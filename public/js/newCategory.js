// 변수 저장
let boards = [];
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";

let selectedNodeId = null;
let editingNodeId = null; // 편집 중인 노드의 ID를 저장
let isEditing = false; // 편집 중 여부를 체크하는 플래그
let originalText = ''; // 수정 전 텍스트 내용

// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const atoken = localStorage.getItem('accessToken');

function fetchBoardData(page = 1) {

    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/board_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
              'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('게시판 목록 데이터:', response);

            // 로컬 스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);
            
            boards = response.data;

            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderBoardTable();
            renderPagination();
        },
        error : function(e) {
            console.log(e);
            console.log(" error :: 게시판 목록 접속 에러");
        }
    })
}

// 게시판 테이블 렌더링
function renderBoardTable() {
    
    const tableBody = $('#boardTableBody');
    tableBody.empty(); // 기존 내용을 비우기

    boards.forEach(board => {
        
        const boardTypeDisplay = board.board_type === 'L' ? '리스트형' : '앨범형';
        const likeSetDisplay = board.LikeSet === 'Y' ? '사용' : '사용안함';
       
        const row = $(`
            <tr>
                <td><img src="./images/drag2.svg"></td>
                <td data-board-name="${board.board_name}">${board.board_name}</td>
                <td>${boardTypeDisplay}</td>
                <td>${likeSetDisplay}</td>
                <td>${board.created_date}</td>
                <td data-board-idx="${board.board_idx}" style="display:none;"></td> <!-- user_idx를 숨김 -->
            </tr>
        `);
        tableBody.append(row);

        // 각 행에 클릭 이벤트 추가
        row.on('click', function(e) {
            e.stopPropagation(); 
            const allRows = $('#boardTableBody tr'); // 모든 행을 가져옴
            const currentIndex = allRows.index(this); // 현재 클릭한 행의 인덱스
            
            if (e.shiftKey && lastSelectedIndex !== null) {
            // Shift 키가 눌렸을 때, 마지막 선택된 인덱스와 현재 인덱스 사이의 모든 행을 선택
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);

            for (let i = start; i <= end; i++) {
                $(allRows[i]).addClass('selected'); // 해당 범위의 모든 행을 선택
                }
            } else if (e.ctrlKey || e.metaKey) { // Ctrl 키 또는 Cmd 키를 눌렀을 때는 다중 선택 가능
                $(this).toggleClass('selected');
            } else {
                // Ctrl 키나 Shift 키를 누르지 않은 상태에서는 기존 선택을 해제하고 새로 선택
                $('#boardTableBody tr').removeClass('selected');
                $(this).addClass('selected');
            }
            lastSelectedIndex = currentIndex; // 마지막 선택된 인덱스 업데이트
            updateSelectedRows();
        });
            
        // 테이블 바깥을 클릭했을 때 선택 해제
        $(document).on('click', function(e) {
            // 테이블 내부 요소를 클릭하지 않았을 때만 선택 해제
            if (!$(e.target).closest('#boardTableBody').length) {
                $('#boardTableBody tr').removeClass('selected');  // 모든 선택된 행의 선택 해제
            }

        
        });
        
        // 각 행에 드래그 이벤트 추가
        row.attr('draggable', true); // 드래그 가능하도록 설정
        row.on('dragstart', function(e) {
            if (!$(this).hasClass('selected')) {
                $(this).addClass('selected');
                updateSelectedRows();
            }
            const boardData = JSON.stringify(selectedRows);
            e.originalEvent.dataTransfer.setData('text/plain', boardData);
            console.log('Storing board data in dataTransfer:', boardData);
        });
    });
}

// 선택된 행 목록 업데이트
function updateSelectedRows() {
    selectedRows = [];
    $('#boardTableBody tr.selected').each(function() {
        const boardName = $(this).find('td[data-board-name]').data('board-name');
        const boardIdx = parseInt($(this).find('td[data-board-idx]').data('board-idx'), 10); // user_idx를 숫자로 변환
        // user_idx 추가
        selectedRows.push({ boardName, boardIdx });
    });
    console.log('선택된 행:', selectedRows);
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = $('#pagination').empty();
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchBoardData(1);
    });
    pagination.append(first);

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
        pageItem.on('click', function (event) {
            event.preventDefault();
            fetchBoardData(i);
        });
        pagination.append(pageItem);
    }

    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchBoardData(totalPage);
    });
    pagination.append(last);
}

// 카테고리 데이터로 jstree 로드
function loadTreeData(callback) {

    $.ajax({
        url : defaultUrl + '/with/cate_board_list ',
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`,
        },
        success : function(response) {

            console.log('카테고리 데이터를 성공적으로 로드했습니다', response.data);
            
            // 서버에서 받은 데이터를 jstree에 맞게 변환하는 함수
            function mapToJsTreeFormat(categories) {
                return categories.map((category) => {
                    // 'board' 타입인 경우 접두사 설정 없이 고유 id 생성
                    let nodeIdPrefix = '';
                    if (category.type === 'Category') {
                        nodeIdPrefix = 'cate_';
                    } else if (category.type === 'Sub_Category') {
                        nodeIdPrefix = 'sub_';
                    }
                    
                    const nodeId = nodeIdPrefix + category.id; // 접두사와 id를 결합하여 고유 id 생성

                    // 중첩된 배열을 정리하는 함수
                    function flattenChildren(children) {
                        return children.reduce((acc, child) => {
                            if (Array.isArray(child)) {
                                acc = acc.concat(flattenChildren(child)); // 배열인 경우 재귀적으로 평탄화
                            } else {
                                acc.push(child);
                            }
                            return acc;
                        }, []);
                    }

                    // 자식 노드를 평탄화 및 변환 처리
                    const flatChildren = category.children ? flattenChildren(category.children) : [];

                    return {
                        id: nodeId, // 고유한 id 생성
                        text: category.text, // 카테고리 이름
                        type: category.type, // 노드 타입
                        depth: category.depth, // depth 값 추가
                        state : { "opened": true },
                        children: flatChildren.length > 0 
                            ? mapToJsTreeFormat(flatChildren) // 하위 카테고리도 동일하게 처리
                            : [] // 하위 카테고리가 없으면 빈 배열
                    };
                });
            }
            
            // jstree에 맞춘 데이터로 변환
            const treeData = mapToJsTreeFormat(response.data);
            console.log('트리에 맞게 맵핑한 데이터', treeData);
            
            // jstree 초기화 및 데이터 적용
            $('#tree-container').jstree({
                'core': {
                    'check_callback': true,
                    'data': treeData // jstree에 맞춘 데이터 설정
                },
                'plugins': ["dnd", "types", "state", "contextmenu"],
                'dnd': {
                    'check_while_dragging': true,
                    'inside_pos': 'last',
                    'touch': false,
                    'large_drop_target': true,
                    'large_drag_target': true,
                    'use_html5': true // 드래그 앤 드롭을 HTML5 기본 동작으로 설정
                },
                'types': {
                    "Category": {
                        "icon": false,
                        'li_attr': {
                            'class': 'team_node' // li 태그에 클래스 추가
                            },
                        'a_attr': {
                            'class': 'team_node_link' // a 태그에 클래스 추가
                        }
                    },
                    "Sub_Category": {
                        "icon": false, 
                        'a_attr': {
                            'class': 'team_node_link' // a 태그에 클래스 추가
                        }
                    },
                    "board": {
                        "icon": "./images/boardIcon.svg", // 멤버 아이콘
                        'a_attr': {
                            'class': 'member_node_link' // a 태그에 클래스 추가
                        }
                    }
                },
                'state': {
                    'key': 'unique_key' // 트리 상태를 저장할 고유 키
                },
                'multiple': true, // 여러 개 노드 동시 선택 허용
                'contextmenu': false,
            });

            // 콜백 함수 실행
            if (callback) {
                    callback();
            }
        },
        error : function(xhr, status, error) {
            console.log(e);
            console.log('error : 카테고리 데이터를 로드하는데 실패하였습니다', status, error);
        }
    });
}

// 검색 실행 함수
function executeSearch() {
    const searchSelect = $('#searchSelect');
    const searchInput = $('#searchInput');
    
    if (searchSelect.length) {
        optionType = searchSelect.val();
    }
    
    if (searchInput.length) {
        optionValue = searchInput.val().trim();
    }

    // 검색 조건이 변경 될 때마다 페이지를 1로 설정하고 데이터를 가져옴
    fetchBoardData(1);
}

$(function() {

    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');

    if (savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

    loadTreeData(); // 카테고리 데이터 로드
    fetchBoardData(currentPage); // 게시판 데이터 로드

    // 검색 버튼 누르면 검색 실행
    $('#serchButton').on('click', function() {
        executeSearch();
    });
   
    // 엔터 누르면 같은 기능 실행
    $('#searchInput').on('keydown', function(event) {
        if(event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });

    // 페이지 당 항목 수 변경 시 해당 항목 수에 맞춰 데이터 로드
     $('#itemCountSelect').on('change', function() {
        itemsPerPage = parseInt($(this).val(), 10);
        fetchBoardData(1);
    });

    // 노드 선택 시 선택된 노드의 ID 저장
    $('#tree-container').on('select_node.jstree', function(e, data) {
        selectedNodeId = data.node.id; // 선택된 노드의 ID를 저장
        console.log('선택된 노드 ID:', selectedNodeId);
    });

    // 트리 내의 다른 부분(노드 외부) 클릭 시 선택 해제 및 변수 초기화
    $('#tree-container').on('click.jstree', function(e) {
        if (!$(e.target).closest('.jstree-anchor').length) {
            $('#tree-container').jstree('deselect_all'); // 트리 선택 해제
            selectedNodeId = null; // 선택된 노드 ID 초기화
            console.log('선택된 노드 id 초기화');
        }
    });

    // 카테고리 추가 기능
    $('#addCate').on('click', function() {
        const selectedNode = selectedNodeId ? $('#tree-container').jstree('get_node', selectedNodeId) : null;

         // 게시판 노드일 경우 카테고리 추가 금지
    if (selectedNode && selectedNode.type === 'board') { // selectedNode가 null이 아닐 때만 type 체크
        alert('게시판에는 카테고리를 추가하실 수 없습니다');
        return;
    } 
    
        const newCategoryName = "새로운 카테고리";
        const newNodeId = new Date().getTime();
    
        let newNodeData = {};
        let formData = new FormData();
    
        // 선택된 노드가 없으면 최상위 카테고리 추가
        if (!selectedNodeId || selectedNodeId === null) {
            newNodeData = {
                "id": newNodeId,
                "text": newCategoryName,
                "type": 'Category', // 상위 카테고리 타입
                "state": { "opened": true },
                "children": [],
            };
    
            // 상위 카테고리 서버 요청용 데이터
            formData.append('id', newNodeId);  // 새로운 상위 카테고리 ID
            formData.append('text', newCategoryName);  // 상위 카테고리 이름
    
        } else if (selectedNodeId.startsWith('cate_') || selectedNodeId.startsWith('sub_')) {
            // 하위 카테고리 추가 (선택된 노드가 cate_ 또는 sub_로 시작하는 경우)
            const parentDepth = selectedNode.original?.depth || 1; // 부모 노드의 depth (기본값 1)
            const newDepth = parentDepth + 1; // 하위 카테고리의 depth는 부모 카테고리보다 1만큼 더 큼
    
            let parentGIdx, parentPIdx;
    
            if (selectedNodeId.startsWith('cate_')) {
                // 상위 카테고리일 경우
                parentGIdx = selectedNode.id.replace('cate_', ''); // cate_를 제거한 id를 g_idx로 사용
                parentPIdx = parentGIdx; // 상위 카테고리의 id를 p_idx로 사용
            } else if (selectedNodeId.startsWith('sub_')) {
                // 하위 카테고리일 경우
                parentGIdx = selectedNode.original?.g_idx || selectedNode.parents.find(id => id.startsWith('cate_')).replace('cate_', ''); // 상위 카테고리의 g_idx 사용
                parentPIdx = selectedNode.id.replace('sub_', ''); // sub_를 제거한 id를 p_idx로 사용
            }
    
            newNodeData = {
                "id": newNodeId,
                "text": newCategoryName,
                "type": 'Sub_Category', // 하위 카테고리 타입
                "state": { "opened": true },
                "children": [],
            };
    
            // 하위 카테고리 서버 요청용 데이터
            formData.append('id', newNodeId);  // 새로운 하위 카테고리 ID
            formData.append('text', newCategoryName);  // 하위 카테고리 이름
            formData.append('g_idx', parentGIdx);  // 상위 카테고리의 g_idx
            formData.append('p_idx', parentPIdx);  // 상위 카테고리의 id (p_idx)
            formData.append('depth', newDepth);  // 하위 카테고리의 depth
        }
    
        // jstree에 새로운 노드 추가
        const newNode = $('#tree-container').jstree().create_node(
            selectedNode ? selectedNode : '#', // 상위 카테고리일 때는 루트에 추가, 하위 카테고리일 때는 선택된 노드에 추가
            newNodeData,
            "last"
        );
    
        // FormData 내용 로그 출력
        formData.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        $.ajax({
            url : defaultUrl + '/with/cate_add',
            method : 'POST',
            headers : {
                'Authorization' : `Bearer ${atoken}`
            },
            data : formData,
            processData: false, 
            contentType: false,
            success : function(response) {
                alert('카테고리가 성공적으로 추가되었습니다.');
                console.log('카테고리 생성 응답 :', response.data);
    
                // 서버에서 응답으로 받은 id를 새로 추가된 노드에 설정
                $('#tree-container').jstree('set_id', newNode, response.data.cate_idx || response.data.sub_cate_idx);  // 상위/하위 카테고리 ID 반영
                loadTreeData();
            }
        });
    });

    let selectedNodeIds = []; // 다중 선택된 노드의 ID를 저장할 배열
    
    // 노드 선택 시 선택된 노드의 ID 저장
    $('#tree-container').on('changed.jstree', function(e, data) {
        selectedNodeIds = data.selected; // 선택된 노드들의 ID 배열
        console.log('Selected Node IDs:', selectedNodeIds);
    });

    // 카테고리 삭제 기능
    $('#deleteNode').on('click', function() {
        if (selectedNodeIds.length > 0) {
            let boardIdxArray = []; // 삭제할 게시판 ID들을 저장할 배열

            selectedNodeIds.forEach(function(nodeId) {
                const node = $('#tree-container').jstree('get_node', nodeId);

                // 게시판 삭제인 경우
                if(node.type === 'board') {

                // board 데이터 배열에 추가
                const boardIdx = node.id.split('_')[1]; // board id 추출 (user_idx로 가정)
                boardIdxArray.push(boardIdx);

                let formData = new FormData();
                
                // 게시판 데이터를 추출
                const parentNodeId = node.parents.find(id => id.startsWith('cate_') || id.startsWith('sub_')); // 상위 카테고리 cate_idx 추출
                const parentNode = $('#tree-container').jstree('get_node', parentNodeId); // 부모 노드 가져오기
                const cateIdx = parentNode.id.split('_')[1]; // 부모 카테고리 ID 추출
                
                // 부모 노드의 type을 정확히 확인해서 설정
                const isCategory = parentNode.type === 'Category' ? 'TOP' : 'SUB';
                
                // FormData에 데이터 추가
                formData.append('board_datas', JSON.stringify(boardIdxArray)); // 삭제할 board 데이터
                formData.append('cate_idx', cateIdx); // 카테고리 ID
                formData.append('isCategory', isCategory); // 카테고리 타입

                // 서버에 삭제 요청 보내기
                $.ajax({
                    url : defaultUrl + '/with/board_del_cate',
                    method : 'POST',
                    headers : {
                        'Authorization' : `Bearer ${atoken}`
                    },
                    data : formData,
                    processData: false, 
                    contentType: false,
                    success : function(response) {
                        alert('게시판이 성공적으로 삭제되었습니다.');
                        console.log('카테고리 생성 응답 :', response.data);
            
                        // jstree에서 해당 노드 삭제
                        $('#tree-container').jstree('delete_node', nodeId);
                        loadTreeData();
                            
                    },
                    error: function(xhr, status, error) {
                        alert('게시판 삭제에 실패했습니다.');
                        console.error('서버 오류:', status, error);
                    }
                });
            } else if (node.type === 'Category' || node.type === 'Sub_Category') {
                
                const cleanId = parseInt(node.id.replace(/^(cate_|sub_)/, ''), 10);
                const deleteData = {
                    id: cleanId,
                    text: node.text,
                    isCategory: node.type === 'Category' ? 'TOP' : 'SUB' // 카테고리 타입에 따른 값 설정
                };
                    
                console.log('서버로 전송될 데이터:', JSON.stringify([deleteData]));
                
                // 서버에 삭제 요청 보내기
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/cate_del', // 조직 삭제 API
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${atoken}`
                    },
                    contentType: 'application/json',
                    data: JSON.stringify([deleteData]), // JSON 데이터를 문자열로 변환하여 전송
                    success: function(response) {
                        alert('카테고리가 성공적으로 삭제되었습니다.');
                            
                        $('#tree-container').jstree('delete_node', nodeId); // jstree에서 노드 삭제
                        loadTreeData(function() { // 콜백으로 트리 갱신 처리
                            selectedNodeIds = []; // 선택된 노드 ID 배열 초기화
                        });
                    },
                    error: function(xhr, status, error) {
                        alert('카테고리 삭제에 실패했습니다.');
                        console.error('서버 오류:', status, error);
                        }
                    });
                }
            });
        } else {
                alert('삭제할 노드를 선택하세요');
        }
    });

    // 수정 버튼 클릭 시 노드 편집 모드로 전환
    $('#modifyNode').on('click', function() {

        if(selectedNodeId) {
            const node = $('#tree-container').jstree('get_node', selectedNodeId);
    
            originalText = node.text;

            if (node.type === 'Category' || node.type === 'Sub_Category') {
                $('#tree-container').jstree('edit', node); 

                // 편집 중인 노드의 ID 저장
                editingNodeId = selectedNodeId;
                isEditing = true; // 편집 중임을 표시

                     // 버튼 상태 변경
                     $('#modifyNode').hide();
                     $('#confirmNode').show();
                     $('#cancleNode').show();
                     $('#deleteNode').hide();

            } else {
                alert('카테고리만 수정 가능합니다.')
            }
        } else {
            alert('수정할 노드를 선택하세요')
        }
    });

    // 루트 노드 ID를 가져오는 함수
    function getRootNodeId(node) {
        var rootNode = node;
        while (rootNode.parent !== "#") {
            rootNode = $('#tree-container').jstree('get_node', rootNode.parent);
        }
        // cate_ 또는 sub_ 접두사 제거 후 숫자만 반환
        return parseInt(rootNode.id.replace(/^(cate_|sub_)/, ''), 10);
    }

    // 확인 버튼 클릭 시 서버에 수정 요청
    $('#confirmNode').on('click', function() {
        sendEditRequest();
    });
    
    // 엔터 키가 눌렸을 때 편집 모드를 종료
    $(document).on('keydown', function(e) {
        if (e.key === 'Enter' && isEditing && editingNodeId) {
            $('#tree-container').jstree('rename_node', editingNodeId); // 편집 종료
        }
    });

    // jstree 편집이 완료될 때 서버로 수정 요청을 보내는 로직
    $('#tree-container').on('rename_node.jstree', function(e, data) {
        if (isEditing && editingNodeId === data.node.id) {
            sendEditRequest();
        }
    });

    // 수정 요청을 서버로 보내는 함수
    function sendEditRequest() {
        if (editingNodeId && isEditing) {
        // 편집 완료 후 텍스트 가져오기
        const editingNode = $('#tree-container').jstree('get_node', editingNodeId);
        const newName = $('#tree-container').jstree('get_text', editingNodeId); // 수정된 조직명

        console.log('수정된 노드:', editingNode);
        console.log('수정된 조직명:', newName);

        // 필요한 데이터 추출
        const nodeId = parseInt(editingNode.id.replace(/^(cate_|sub_)/, ''), 10);

        // org_p_idx와 org_g_idx
        let p_idx = editingNode.parent !== "#" ? editingNode.parent : nodeId;
        let g_idx = parseInt(getRootNodeId(editingNode), 10); // 루트 조직 ID를 숫자로 변환

        // p_idx가 "cate_" 또는 "sub_"로 시작하면 접두사를 제거하고 숫자만 남김
        if (typeof p_idx === 'string' && (p_idx.startsWith('cate_') || p_idx.startsWith('sub_'))) {
            p_idx = parseInt(p_idx.replace(/^(cate_|sub_)/, ''), 10);
        }

        // depth와 isCategory 추출
        const depth = editingNode.original.depth;
        const isCategory = editingNode.type === 'Category' ? 'TOP' : 'SUB'; // 카테고리 타입에 따른 값 설정

        // 최상위 루트인 경우 처리
        if (p_idx === "#") {
            p_idx = nodeId; // 부모 ID를 자기 ID로 설정
            g_idx = nodeId; // 루트 ID도 자기 ID로 설정
        }

        console.log('Sending update request:', {
            nodeId, newName, p_idx, g_idx, depth, isCategory
        });

        // 서버로 수정 요청 보내기
        updateTeamNameOnServer(nodeId, newName, p_idx, g_idx, depth, isCategory);

        // 편집 모드 종료
        isEditing = false;

        // 버튼 상태 초기화
        $('#confirmNode').hide();
        $('#cancleNode').hide();
        $('#modifyNode').show();
        $('#deleteNode').show();
        editingNodeId = null; // 편집 중인 노드 ID 초기화
    }
}


    // 편집 취소 버튼
    $('#cancleNode').on('click', function() {
        if (editingNodeId && isEditing) {
            $('#tree-container').jstree('cancle_node', editingNodeId); // 편집 취소
            isEditing = false;

            // 원래 텍스트로 복원
            if(editingNodeId) {
                const node = $('#tree-container').jstree('get_node', editingNodeId);
                $('#tree-container').jstree('set_text', node, originalText); //원래 텍스트로 복구
            }

            editingNodeId = null; // 편집 중인 노드 ID 초기화

            // 버튼 상태 초기화
            $('#confirmNode').hide();
            $('#modifyNode').show();
            $('#cancleNode').hide();
            $('#deleteNode').show();
        }
    });

    // 트리 외부 클릭 시 편집 모드 종료 및 UI 복구
    $(document).on('mousedown', function(event) {
        // 트리 외부 클릭 시 (단, 확인 버튼과 취소 버튼은 제외)
        if (isEditing && !$(event.target).closest('#confirmNode, #cancleNode').length) {
            
            // 버튼 상태 변경
            $('#confirmNode').hide();
            $('#cancleNode').hide();
            $('#modifyNode').show();
            $('#deleteNode').show(); 
            
            // 편집 모드 종료
            isEditing = false;
            
            // 원래 텍스트로 복원
            if (editingNodeId) {
                const node = $('#tree-container').jstree('get_node', editingNodeId);
                $('#tree-container').jstree('set_text', node, originalText); // 원래 텍스트로 복구
            }
            editingNodeId = null;
        }
    });


    // 서버에 카테고리명 업데이트 요청 함수
    function updateTeamNameOnServer(nodeId, newName, p_idx, g_idx, depth, isCategory) {
        const formData = new FormData();

        formData.append('id', nodeId);
        formData.append('text', newName);
        formData.append('p_idx', p_idx);
        formData.append('g_idx', g_idx);
        formData.append('depth', depth);
        formData.append('isCategory', isCategory);

        // FormData의 내용을 확인하는 코드
        console.log('FormData to be sent:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // 서버 요청
        $.ajax({
            url : defaultUrl + '/with/cate_edit',
            method : 'POST',
            headers : {
                'Authorization' : `Bearer ${atoken}`
            },
            data : formData,
            processData : false,
            contentType : false,
            success : function(response) {
                alert('카테고리명이 수정되었습니다.');
                console.log('서버 응답 :', response);

                // 트리 데이터 새로고침
                window.location.reload();
            },
            error: function(xhr, status, error) {
                alert('조직명 업데이트에 실패했습니다.');
                console.error('서버 오류:', status, error);
            }
        });
    }


    // 모든 노드를 열어주는 코드
$('#tree-container').on('ready.jstree', function () {
    $('#tree-container').jstree('open_all'); // 트리의 모든 노드를 열기
});

    // 드래그시 이동 표시
    $('#tree-container').on('dragover', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });


    // 중복 체크
    $('#tree-container').on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const data = e.originalEvent.dataTransfer.getData('text/plain');
        console.log('드래그된 데이터 : ', data);
        
        // 만약 URL이나 다른 형식의 데이터가 들어왔을 때 이를 무시
        if (data.startsWith('http') || data.includes('localhost')) {
            console.warn('URL 데이터가 드롭되었습니다. 무시합니다:', data);
            return;
        }
        
        try {
            const droppedData = JSON.parse(data);  // JSON 형식으로 변환 시도
            const targetNode = $('#tree-container').jstree('get_node', e.target); // e.target : 드롭된 위치의 노드 , 즉 사용자가 드롭될 팀 노드
            
            if (!targetNode || (targetNode.type !== "Category" && targetNode.type !== "Sub_Category")) {
                alert("게시판은 카테고리에만 추가할 수 있습니다.");
                return;
            }
            
            console.log('JSON 형식으로 변환된 드래그된 데이터 :',droppedData);
            
            // ** 중복 체크 **
            // 해당 카테고리 노드의 자식 노드 (이미 추가된 사용자)들의 board 추출
            let categoryBoardrIdxs = targetNode.children.map(childId => {
                const childNode = $('#tree-container').jstree('get_node', childId);

                console.log('자식 노드', childNode);

                if (childNode.type === 'board') {
                    return parseInt(childNode.id.split('_')[1], 10); // _ 뒤의 board_idx 추출
                    }
                    return null;
                }).filter(boardIdx => boardIdx !== null); // null 값 제거
        
                // 중복 여부 체크: 해당 팀에 이미 추가된 board_idx 드래그된 board_idx 비교
                const duplicateUsers = droppedData.filter(board => categoryBoardrIdxs.includes(board.boardIdx));

                console.log('중복여부', duplicateUsers);
        
                if (duplicateUsers.length > 0) {
                    alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.map(b => b.boardName).join(', '));
                    return; // 중복이 있으면 추가하지 않음
                }
        
                // user_idx 배열을 생성
                const boardIdxArray = droppedData.map(board => board.boardIdx);
        
                // 서버에 user_idx와 org_idx를 POST 요청으로 전송
                const formData = new FormData();
                const cateIdx = targetNode.id.replace(/^(cate_|sub_)/, '');

                const isCategory = targetNode.type === 'Category' ? 'TOP' : 'SUB';


                formData.append('board_datas', JSON.stringify(boardIdxArray)); // user_idx 배열을 문자열로 변환하여 전송
                formData.append('cate_idx', cateIdx); // 드랍된 조직의 ID (targetNode의 ID)
                formData.append('isCategory', isCategory ); // 드랍된 조직의 ID (targetNode의 ID)
    
                
                // FormData의 내용을 확인하는 코드            
                console.log('FormData to be sent:');
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }
                
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/board_add_cate',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${atoken}`
                    },
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        alert('사용자가 조직에 성공적으로 추가되었습니다.');
                        console.log('서버 응답:', response);
        
                        // 서버 응답에서 data를 받아옴 (조직과 사용자 ID를 기반으로)
                        droppedData.forEach(board => {
                            const randomId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // 임시 노드 ID 생성
        
                            // jstree에 임시 ID로 추가
                            $('#tree-container').jstree().create_node(targetNode, {
                                "text": board.boardName,
                                "id": randomId,
                                "type": "board",
                            });
        
                            // 서버에서 받은 실제 boardIdx로 노드 ID 업데이트
                            const newNodeId = board.boardIdx; // 조합하지 않고 board.boardIdx만 사용
                            $('#tree-container').jstree('set_id', randomId, newNodeId);
        
                            // 추가된 사용자를 categoryBoardrIdxs 즉시 반영
                            categoryBoardrIdxs.push(board.boardIdx);
        
                            console.log(`사용자 ${board.boardName}가 성공적으로 추가되었습니다. ID 갱신: ${randomId} -> ${newNodeId}`);
                        });
        
                        // 추가된 사용자 정보를 최신 상태로 유지
                        console.log("Updated categoryBoardrIdxs: ", categoryBoardrIdxs);
                    },
                    error: function(xhr, status, error) {
                        alert('사용자를 조직에 추가하는 데 실패했습니다.');
                        console.error('서버 오류:', status, error);
                    }
                });
            } catch (err) {
                console.error('Failed to parse JSON:', err);
            }
    });


    // 조직도내 팀원 이동
    let moveNodeTimeout; // 노드 이동 처리 시 지연 시간을 설정

    // 노드 이동할 때 발생하는 이벤트에 대한 핸들러 등록(move_node)
    $('#tree-container').off('move_node.jstree').on('move_node.jstree', function (e, data) {
        clearTimeout(moveNodeTimeout); // 이전에 설정된 타임아웃을 초기화 (중복 요청 방지)
        
        moveNodeTimeout = setTimeout(function () {
            const oldTeamId = data.old_parent; // 이동 전 팀의 ID (org_idx)
            const newTeamId = data.parent; // 이동 후 팀의 ID (move_idx)
            const newPosition = data.position; // 새로운 위치
            
            // **같은 팀 내에서 순서만 변경되는 경우 중복 체크 생략**
            if (oldTeamId === newTeamId) {
                console.log('같은 팀 내에서 순서만 변경됩니다.');
                return; // 중복 체크 건너뛰고 종료
            }

            // **선택된 노드 가져오기** //
            let selectedNodes = $('#tree-container').jstree('get_selected'); // 선택된 모든 노드의 ID 배열
            

            // 선택된 노드가 없으면 드래그된 노드를 처리
            if (selectedNodes.length === 0) {
                selectedNodes = [data.node.id]; // 드래그된 노드만 처리
            }
            
            const draggedUserIds = selectedNodes.map(nodeId => parseInt(nodeId.split('_')[1], 10)); // 선택된 노드들의 user_idx 추출 (숫자로 변환)
                
            console.log('선택된 노드들의 ID:', selectedNodes);
            console.log('드래그된 노드들의 user_idx:', draggedUserIds);
            
            // 이동할 팀(newTeamId)의 자식 노드에서 이미 추가된 멤버의 노드 ID 추출 (teamID_userID)
            const newTeamChildren = $('#tree-container').jstree('get_node', newTeamId).children;
            const newTeamNodeIds = newTeamChildren.map(childId => {
            const childNode = $('#tree-container').jstree('get_node', childId);
            
            if (childNode.type === 'board') {
                return childNode.id; 
                }
                return null;
            }).filter(id => id !== null);
            
            console.log('이동되는 팀의 아이디 출력:', newTeamNodeIds); // 이동할 팀의 노드 ID 출력 (teamID_userID)
    

            // org_idx와 move_idx에서 접두어 제거 후 숫자만 추출하여 전송
            const strippedOldTeamId = oldTeamId.split('_')[1]; // cate_8에서 8만 추출
            const strippedNewTeamId = newTeamId.split('_')[1]; // sub_5에서 5만 추출

            // **중복 여부 체크: 팀 내에 이미 같은 노드 ID (teamID_userID)가 있는지 확인**
            const parentNode = $('#tree-container').jstree('get_node', newTeamId); // 이동할 팀의 부모 노드 가져오기
            const parentNodeType = parentNode.type; // 부모 노드의 타입 확인

            // 팀의 타입에 따라 접두어를 결정
            let prefix = '';
            if (parentNodeType === 'Category') {
                prefix = 'T'; // Category일 경우 T 접두어
            } else if (parentNodeType === 'Sub_Category') {
                prefix = 'S'; // Sub_Category일 경우 S 접두어
            }

            // 중복 체크: 팀 내의 자식 노드에서 같은 ID 형식이 있는지 확인
            const duplicateUsers = draggedUserIds.filter(userId => 
                newTeamNodeIds.includes(`${prefix}${strippedNewTeamId}_${userId}`)
            );

            if (duplicateUsers.length > 0) {
                alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.join(', '));
                $('#tree-container').jstree('refresh'); // 트리 새로고침하여 이동 취소
                return; // 서버로 이동 요청을 보내지 않고, 여기서 중단
            }

                    
            // **중복 확인 후에만 서버 요청** //
            const formData = new FormData();

            formData.append('board_datas', JSON.stringify(draggedUserIds)); // 선택된 모든 user_idx 전송
            formData.append('cate_idx', strippedOldTeamId); // 기존 팀의 ID
            formData.append('move_idx', strippedNewTeamId); // 이동할 팀의 ID

         
            // **이동 전 카테고리와 이동 후 카테고리의 isCategory 값 추가**
            const oldParentNode = $('#tree-container').jstree('get_node', oldTeamId); // 이동 전 팀의 부모 노드 가져오기
            const newParentNode = $('#tree-container').jstree('get_node', newTeamId); // 이동 후 팀의 부모 노드 가져오기
            
            let moveCategory = '';
                 // 이동 전 노드 타입

            let oldCategoryType = '';
            if (oldParentNode.type === 'Category') {
                oldCategoryType = 'TOP';
            } else if (oldParentNode.type === 'Sub_Category') {
                oldCategoryType = 'SUB';
            }

            // 이동 후 노드 타입
            let newCategoryType = '';
            if (newParentNode.type === 'Category') {
                newCategoryType = 'TOP';
            } else if (newParentNode.type === 'Sub_Category') {
                newCategoryType = 'SUB';
            }

            isCategory = `${oldCategoryType}`;
            moveCategory = `${newCategoryType}`; // 이동 전과 후의 카테고리 상태
            formData.append('isCategory', isCategory); // move_category 추가
            formData.append('move_category', moveCategory); // move_category 추가

                    
              // FormData의 내용을 확인하는 코드            
              console.log('FormData to be sent:');
              for (let [key, value] of formData.entries()) {
                  console.log(`${key}: ${value}`);
              }

            // 서버에 AJAX 요청
            $.ajax({
                url: 'http://safe.withfirst.com:28888/with/board_add_cate',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${atoken}`
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log('서버 응답:', response);
        
                    // 서버에서 받은 실제 ID로 노드 업데이트 (org_idx와 user_idx 조합)
                    // selectedNodes.forEach(nodeId => {
                    //     const userId = nodeId.split('_')[1];
                    //     const newNodeId = `${newTeamId}_${userId}`;
                    //     $('#tree-container').jstree('set_id', nodeId, newNodeId);
                    //     console.log(`사용자 ${nodeId}가 성공적으로 이동되었습니다. ID 갱신: ${nodeId} -> ${newNodeId}`);
                    // });

                    // 서버에서 받은 실제 ID로 노드 업데이트 (org_idx와 user_idx 조합)
                    // 서버에서 받은 실제 ID로 노드 업데이트 (상위 노드 타입을 고려하여 ID 생성)
                    selectedNodes.forEach(nodeId => {
                        const userId = nodeId.split('_')[1]; // 현재 사용자의 ID를 추출
                        let newNodeId = '';

                        // newTeamId에서 접두어 제거
                        const strippedNewTeamId = newTeamId.split('_')[1]; // cate_9에서 9만 추출

                        // 상위 노드의 타입을 확인하여 ID 매핑 (상위 노드가 Category인지 Sub_Category인지 확인)
                        const parentNode = $('#tree-container').jstree('get_node', newTeamId); // 이동할 팀의 부모 노드 가져오기
                        const parentNodeType = parentNode.type; // 부모 노드의 타입 확인

                        // 상위 노드 타입에 따른 ID 매핑
                        if (parentNodeType === 'Category') {
                            newNodeId = `T${strippedNewTeamId}_${userId}`; // 상위 노드가 Category인 경우
                        } else if (parentNodeType === 'Sub_Category') {
                            newNodeId = `S${strippedNewTeamId}_${userId}`; // 상위 노드가 Sub_Category인 경우
                        } else {
                            console.error(`Unknown parent node type: ${parentNodeType}`);
                            return;
                        }

                        // JSTree 노드 ID를 새로 매핑한 ID로 업데이트
                        $('#tree-container').jstree('set_id', nodeId, newNodeId);
                        console.log(`사용자 ${nodeId}가 성공적으로 이동되었습니다. ID 갱신: ${nodeId} -> ${newNodeId}`);
                    });


                    // 트리 UI를 새로고침하여 추가된 사용자가 반영되도록 함
                    loadTreeData();
                },
                error: function (xhr, status, error) {
                    alert('사용자 이동에 실패했습니다.');
                    console.error('서버 오류:', status, error);
                    $('#tree-container').jstree('refresh'); // 트리 새로고침하여 이동 취소
                }
            });
        }, 100); // 100ms 딜레이 후 서버로 요청을 보냅니다.
    });


});
