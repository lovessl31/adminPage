let currentMaxId = 0; // 현재 최대 ID
let selectedCategory = null;
let categoryData = []; // 전체 카테고리 데이터를 저장할 배열
let previouslySelectedDiv = null; // 이전에 선택된 카테고리의 div 요소
let expandedCategories = new Set(); // 열림 상태의 카테고리를 저장

function updateCategory(category, initialName) {
    const isCategory = category.cate_idx && !category.s_c_idx ? 'top' : 'sub';
    const cate_idx = category.cate_idx || category.s_c_idx;
    const cate_name = category.cate_name || category.s_cate_name;
    const initial_name = initialName;
    
    // 로컬 스토리지에서 com_idx 추출
    const comIdx = localStorage.getItem('com_idx');
    
    // JSON 객체 생성
    const data = {
        cate_name: cate_name
    };
    
    const token = localStorage.getItem('accessToken');
    
    // 요청 URL 확인
    const url = `http://safe.withfirst.com:28888/with/cate/${isCategory}/${cate_idx}`;
    console.log('Request URL:', url);
    // JSON 객체 내용을 콘솔에 출력
    console.log('---- JSON 데이터로 보내는 키랑 값 ----');
    console.log(data);
    console.log('----파라미터에 들어가는 값----');
    console.log('isCategory:', isCategory);
    console.log('cate_idx:', cate_idx);
    console.log('초기값:', initial_name);
    console.log('토큰:', token);
    
    axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('수정 완료:', response.data);
    })
    .catch(error => {
        console.error('수정 오류:', error);
    });
}

function findMaxId(categories) {
    categories.forEach(category => {
        if (category.cate_idx && category.cate_idx > currentMaxId) {
            currentMaxId = category.cate_idx;
        }
        if (category.s_c_idx && category.s_c_idx > currentMaxId) {
            currentMaxId = category.s_c_idx;
        }
        if (category.sub_category && category.sub_category.length > 0) {
            findMaxId(category.sub_category);
        }
    });
}
function createCategoryElement(category, depth, parentCategory = null) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'listStyle';
    div.style.paddingLeft = depth === 1 ? '20px' : `${(depth - 1) * 20 + 20}px`; // 최상위 카테고리에 20px, 하위 카테고리에 깊이에 따라 20px씩 패딩
    div.setAttribute('data-category-id', category.cate_idx || category.s_c_idx);
    div.setAttribute('data-initial-name', category.cate_name || category.s_cate_name); // 초기 이름 저장
    
    const spanFolder = document.createElement('span');
    spanFolder.className = 'iconContainer';
    
    const imgRightArrow = document.createElement('img');
    imgRightArrow.src = './images/rightArrow.png';
    imgRightArrow.className = 'toggleArrow';
    
    if (!(category.sub_category && category.sub_category.length > 0)) {
        imgRightArrow.style.visibility = 'hidden'; // 하위 카테고리가 없는 경우 투명하게 처리
        }
        spanFolder.appendChild(imgRightArrow);
        
        if (category.sub_category && category.sub_category.length > 0) {
            imgRightArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                const ul = li.querySelector('ul');
                const isExpanded = ul.style.display === 'block';
                ul.style.display = isExpanded ? 'none' : 'block';
                imgRightArrow.src = isExpanded ? './images/rightArrow.png' : './images/downArrow.png';
                imgFolder.src = isExpanded ? './images/folder.png' : './images/openFolder.png';
                if (isExpanded) {
                    expandedCategories.delete(category.cate_idx || category.s_c_idx);
                } else {
                    expandedCategories.add(category.cate_idx || category.s_c_idx);
                }
            });
        }
        
    const imgFolder = document.createElement('img');
    imgFolder.src = './images/folder.png';
    spanFolder.appendChild(imgFolder);
    div.appendChild(spanFolder);
        
    const categoryNameText = document.createTextNode(category.cate_name || category.s_cate_name);
    div.appendChild(categoryNameText);
        
    const spanButtons = document.createElement('span');
    spanButtons.className = 'cateAdmin';
    
    const buttonAdd = document.createElement('button');
    const imgAdd = document.createElement('img');
    imgAdd.src = './images/addCate.png';
        
    buttonAdd.appendChild(imgAdd);
    buttonAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        addSubCategory(li, category, depth + 1);
    });
        
    const buttonTrash = document.createElement('button');
    const imgTrash = document.createElement('img');
    imgTrash.src = './images/minuCate.png';
        
    buttonTrash.appendChild(imgTrash);
    buttonTrash.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCategory(li, category, parentCategory);
    });
    
    spanButtons.appendChild(buttonAdd);
    spanButtons.appendChild(buttonTrash);
    div.appendChild(spanButtons);
    li.appendChild(div);
    
    if (category.sub_category && category.sub_category.length > 0) {
        const ul = document.createElement('ul');
        ul.style.display = expandedCategories.has(category.cate_idx || category.s_c_idx) ? 'block' : 'none';
        category.sub_category.forEach(subCat => {
            ul.appendChild(createCategoryElement(subCat, depth + 1, category));
        });
        li.appendChild(ul);
        
        if (expandedCategories.has(category.cate_idx || category.s_c_idx)) {
            imgRightArrow.src = './images/downArrow.png';
            imgFolder.src = './images/openFolder.png';
        }
    }
    
    div.addEventListener('click', () => {
        if (previouslySelectedDiv) {
            previouslySelectedDiv.classList.remove('selected');
        }
        div.classList.add('selected');
        previouslySelectedDiv = div;
        
        document.getElementById('cateInputWrap').style.display = 'block';
        const cateInput = document.getElementById('cateInput');
        cateInput.value = category.cate_name || category.s_cate_name;
        const initialName = div.getAttribute('data-initial-name'); // 초기 이름 가져오기
        selectedCategory = category;
        cateInput.oninput = () => {
            selectedCategory.cate_name = cateInput.value;
            categoryNameText.textContent = cateInput.value;
        };
        
        // 입력 필드를 벗어날 때, 변경 사항이 있으면 updateCategory 함수 호출
        cateInput.onblur = () => {
            if (cateInput.value !== initialName) {
                updateCategory(selectedCategory, initialName);
                
                // 변경된 이름을 새로운 초기 이름으로 저장
                div.setAttribute('data-initial-name', cateInput.value);
            }
        };
    });
    return li;
}

function renderCategories(categories) {
    const cateList = document.getElementById('cateList');
    const explainDiv = document.getElementById('explain');
    const cateInputWrap = document.getElementById('cateInputWrap');
    cateList.innerHTML = ''; // 카테고리 목록을 초기화
    
    if (categories.length === 0) { // 카테고리가 하나도 없는 경우
        explainDiv.style.display = 'block';
        cateInputWrap.style.display = 'none';
    } else { // 카테고리가 있는 경우
        explainDiv.style.display = 'none';
        categories.forEach(category => { // 각 카테고리에 대해
            cateList.appendChild(createCategoryElement(category, 1)); // 카테고리 요소를 생성하여 <ul> 요소에 추가
        });
        findMaxId(categories); // 최대 ID를 찾음
    }
}

function cateGetData() {
    const token = localStorage.getItem('accessToken');
    
    return axios.get('http://safe.withfirst.com:28888/with/cateList', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('서버 응답 데이터:', response.data.data); // 서버 응답 데이터 콘솔 출력
        if (response.data && Array.isArray(response.data.data)) {
            categoryData = response.data.data; // 전체 카테고리 데이터를 저장
            renderCategories(categoryData);
        } else {
            console.error('Invalid data format:', response.data);
        }
    })
    .catch(error => {
        console.log('Error loading user data:', error);
    });
}

function isElementBeyondViewport(el, container) {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return elRect.bottom > containerRect.bottom || elRect.top < containerRect.top;
}

// 최상위 카테고리
function addTopCategory() {
    const tempId = ++currentMaxId; // 임시 ID 할당
    const newCategory = {
        cate_idx: ++currentMaxId, // 새로운 ID 할당
        cate_name: '새로운 카테고리',
        s_depth: 1,
        sub_category: []
    };
    
    // 로컬 데이터에 새 카테고리 추가
    categoryData.push(newCategory);
    renderCategories(categoryData);
    
    // 새로 추가된 최상위 카테고리를 선택된 상태로 표시
    const addedCategoryDiv = document.querySelector(`div[data-category-id='${newCategory.cate_idx}']`);
    if (previouslySelectedDiv) {
        previouslySelectedDiv.classList.remove('selected');
    }
    addedCategoryDiv.classList.add('selected');
    previouslySelectedDiv = addedCategoryDiv;
    
    // 입력창에 새 카테고리명 표시 및 수정 가능하게 설정
    const cateInputWrap = document.getElementById('cateInputWrap');
    const cateInput = document.getElementById('cateInput');
    cateInput.value = '새로운 카테고리'; // 기본값 설정
    cateInputWrap.style.display = 'block';
    selectedCategory = newCategory;
    
    let initialName = newCategory.cate_name;
    
    // .cateListWrap 범위를 벗어나는 경우에만 스크롤
    const cateListWrap = document.querySelector('.cateListWrap');
    if (isElementBeyondViewport(addedCategoryDiv, cateListWrap)) {
        addedCategoryDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    const isCategory = 'top'; // isCategory 값을 변수로 설정
    const token = localStorage.getItem('accessToken');
    
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('cate_name', newCategory.cate_name);
    
    // 서버에 새로운 카테고리 추가 요청
    axios.post(`http://safe.withfirst.com:28888/with/addCate/${isCategory}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('최상위 카테고리 생성 완료:', response);
        newCategory.cate_idx = response.data.data.cate_idx;
        
        // 이후에 수정 작업 가능하게 설정
        selectedCategory = newCategory;
        initialName = newCategory.cate_name; // 초기 이름을 응답 받은 데이터로 갱신
        cateInput.oninput = () => {
            selectedCategory.cate_name = cateInput.value;
            addedCategoryDiv.childNodes[1].textContent = cateInput.value;
        };
        cateInput.onblur = () => {
            if (cateInput.value !== initialName) {
                updateCategory(selectedCategory, initialName);
                initialName = cateInput.value; // 업데이트 후 초기 이름 갱신
                addedCategoryDiv.setAttribute('data-initial-name', initialName); // 새로운 초기 이름을 data 속성으로 저장
            }
        };
    })
    .catch(error => {
        console.error('카테고리 생성 오류:', error);
    });
}

// 하위 카테고리 추가 함수
function addSubCategory(parentLi, parentCategory, depth) {
    const newSubCategory = {
        s_c_idx: ++currentMaxId, // 새로운 ID 할당
        s_cate_name: '새로운 하위 카테고리',
        s_depth: depth,
        s_g_c_idx: parentCategory.s_g_c_idx || parentCategory.cate_idx,
        s_p_c_idx: parentCategory.s_c_idx || parentCategory.cate_idx,
        sub_category: []
    };

    // 로컬 데이터에 새 하위 카테고리 추가
    if (!parentCategory.sub_category) {
        parentCategory.sub_category = [];
    }
    parentCategory.sub_category.push(newSubCategory);
    expandedCategories.add(parentCategory.cate_idx || parentCategory.s_c_idx); // 부모 카테고리를 펼침 상태로 유지
    renderCategories(categoryData);

    // 새로 추가된 하위 카테고리를 선택된 상태로 표시
    const addedSubCategoryDiv = document.querySelector(`div[data-category-id='${newSubCategory.s_c_idx}']`);
    if (previouslySelectedDiv) {
        previouslySelectedDiv.classList.remove('selected');
    }
    addedSubCategoryDiv.classList.add('selected');
    previouslySelectedDiv = addedSubCategoryDiv;
    
    // 입력창에 새 하위 카테고리명 표시 및 수정 가능하게 설정
    const cateInputWrap = document.getElementById('cateInputWrap');
    const cateInput = document.getElementById('cateInput');
    cateInput.value = '새로운 하위 카테고리'; // 기본값 설정
    cateInputWrap.style.display = 'block';
    selectedCategory = newSubCategory;

    let initialName = newSubCategory.s_cate_name;

    cateInput.oninput = () => {
        selectedCategory.s_cate_name = cateInput.value;
        addedSubCategoryDiv.childNodes[1].textContent = cateInput.value;
    };

    cateInput.onblur = () => {
        if (cateInput.value !== initialName) {
            updateCategory(selectedCategory, initialName);
            initialName = cateInput.value; // 업데이트 후 초기 이름 갱신
            addedSubCategoryDiv.setAttribute('data-initial-name', initialName); // 새로운 초기 이름을 data 속성으로 저장
        }
    };

    // .cateListWrap 범위를 벗어나는 경우에만 스크롤
    const cateListWrap = document.querySelector('.cateListWrap');
    if (isElementBeyondViewport(addedSubCategoryDiv, cateListWrap)) {
        addedSubCategoryDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const isCategory = 'sub'; // isCategory 값을 변수로 설정
    const token = localStorage.getItem('accessToken');

    // FormData 객체 생성
    const formData = new FormData();
    formData.append('cate_name', newSubCategory.s_cate_name);
    formData.append('s_g_c_idx', newSubCategory.s_g_c_idx);
    formData.append('s_p_c_idx', newSubCategory.s_p_c_idx);
    formData.append('s_depth', newSubCategory.s_depth);

    // 서버에 새로운 하위 카테고리 추가 요청
    axios.post(`http://safe.withfirst.com:28888/with/addCate/${isCategory}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('하위 카테고리 생성 완료:', response);

        // 서버 응답에서 새로운 하위 카테고리 ID를 가져와서 업데이트
        newSubCategory.s_c_idx = response.data.data.cate_idx;

        // 이후에 수정 작업 가능하게 설정
        selectedCategory = newSubCategory;
        initialName = newSubCategory.s_cate_name; // 초기 이름을 응답 받은 데이터로 갱신
        cateInput.oninput = () => {
            selectedCategory.s_cate_name = cateInput.value;
            addedSubCategoryDiv.childNodes[1].textContent = cateInput.value;
        };
        cateInput.onblur = () => {
            if (cateInput.value !== initialName) {
                updateCategory(selectedCategory, initialName);
                initialName = cateInput.value; // 업데이트 후 초기 이름 갱신
                addedSubCategoryDiv.setAttribute('data-initial-name', initialName); // 새로운 초기 이름을 data 속성으로 저장
            }
        };
    })
    .catch(error => {
        console.error('하위 카테고리 생성 오류:', error);
    });
}

// 카테고리 삭제 함수
function deleteCategory(li, category, parentCategory) {
    const isCategory = category.cate_idx && !category.s_c_idx ? 'top' : 'sub';
    const cate_idx = category.cate_idx || category.s_c_idx;
    const cate_name = category.cate_name || category.s_cate_name;
    
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('cate_name', cate_name);
    formData.append('isCategory', isCategory);
    formData.append('cate_idx', cate_idx);
    
    const token = localStorage.getItem('accessToken');
    
    // URL에 파라미터 추가
    const url = `http://safe.withfirst.com:28888/with/cate/${isCategory}/${cate_idx}/${cate_name}`;
    
    // 서버에 삭제 요청
    axios.delete(url, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        },
        data: formData
    })
    .then(response => {
        console.log('카테고리 삭제 완료:', response.data);
        
        // 로컬 데이터에서 카테고리 삭제
        if (parentCategory) {
            const index = parentCategory.sub_category.indexOf(category);
            if (index > -1) {
                parentCategory.sub_category.splice(index, 1);
            }
        } else {
            const index = categoryData.indexOf(category);
            if (index > -1) {
                categoryData.splice(index, 1);
            }
        }
        renderCategories(categoryData);
        
        // 카테고리가 모두 삭제된 경우 입력 필드를 숨김
        if (categoryData.length === 0) {
            document.getElementById('cateInputWrap').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('카테고리 삭제 오류:', error);
    });
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    cateGetData();
    document.getElementById('addCategoryBtn').addEventListener('click', addTopCategory);
    
    // 로컬스토리지에서 com_idx 추출
    const comIdx = localStorage.getItem('com_idx');
    console.log('Company ID:', comIdx);
});