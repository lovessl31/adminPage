// 전역 변수 선언
let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";
let selectedRows = []; // 선택된 행을 저장할 배열
let addedUserIdxs = []; // 조직도에 추가된 사용자들의 user_idx 배열
let lastSelectedIndex = null; // 마지막으로 선택된 행의 인덱스를 저장

// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

// 유저 목록 테이블 렌더링
function fetchUserData(page = 1) {

    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/user_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('사용자 목록 데이터를 조회하는데 성공하였습니다.');
            console.log('사용자 데이터 : ', response.data);
            console.log('사용자 데이터 : ', response);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);

            users = response.data;
            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderUserTable();
            renderPagination();
        },
        error : function(e) {
            console.log(e);
            console.log(" error :: 사용자 접속 에러");
        }
    })
}

// 사용자 테이블 렌더링
function renderUserTable() {
    const tableBody = $('#userTableBody');
    tableBody.empty(); // 기존 내용을 비우기

    users.forEach(user => {
        const row = $(`
            <tr>
                <td><img src="./images/drag2.svg"></td>
                <td data-user-name="${user.user_name}">${user.user_name}</td>
                <td data-user-id="${user.user_id}">${user.user_id}</td>
                <td data-user-idx="${user.user_idx}" style="display:none;"></td> <!-- user_idx를 숨김 -->
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `);

        // <td>${user.phone_number}</td>
        // <td>${user.c_name}</td>
        // <td>${user.user_rank}</td>
        // <td>${user.user_position}</td>

        tableBody.append(row);
        
        // 각 행에 클릭 이벤트 추가
        row.on('click', function(e) {
            e.stopPropagation(); 
            const allRows = $('#userTableBody tr'); // 모든 행을 가져옴
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
            $('#userTableBody tr').removeClass('selected');
            $(this).addClass('selected');
        }

        lastSelectedIndex = currentIndex; // 마지막 선택된 인덱스 업데이트
        updateSelectedRows();
        });


        // 테이블 바깥을 클릭했을 때 선택 해제
        $(document).on('click', function(e) {
            // 테이블 내부 요소를 클릭하지 않았을 때만 선택 해제
            if (!$(e.target).closest('#userTableBody').length) {
                $('#userTableBody tr').removeClass('selected');  // 모든 선택된 행의 선택 해제
            }
        });

        // 각 행에 드래그 이벤트 추가
        row.attr('draggable', true); // 드래그 가능하도록 설정
        row.on('dragstart', function(e) {
            if (!$(this).hasClass('selected')) {
                $(this).addClass('selected');
                updateSelectedRows();
            }
            const userData = JSON.stringify(selectedRows);
            e.originalEvent.dataTransfer.setData('text/plain', userData);
            console.log('Storing user data in dataTransfer:', userData);
        });
    });
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = $('#pagination').empty();
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchCompanyData(1);
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
            fetchCompanyData(i);
        });
        pagination.append(pageItem);
    }

    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchCompanyData(totalPage);
    });
    pagination.append(last);
}

// 조직도 데이터를 로드하고, 이미 추가된 사용자들의 user_idx를 추출하는 함수
function loadTreeData(callback) {

    $.ajax({
        url: 'http://safe.withfirst.com:28888/with/view-org',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`,
        },
        dataType: 'json',
        success: function(response) {
            console.log('조직도 데이터를 성공적으로 로드했습니다:', response.data);

            // 로드 시 조직도에 회사명 업데이트
            // const companyName = document.querySelector('.Owrap div p');
            // const com_name =localStorage.getItem('com_name');
            // companyName.textContent = com_name;

             // type이 'team'인 경우, 이름 옆에 count 값을 추가하는 함수
             function addMemberCount(nodes) {
                nodes.forEach(node => {
                    if (node.type === 'team' && node.count !== undefined) {
                        // count 부분을 별도의 span으로 감싸서 클래스 추가
                        node.text = `${node.text} <span class="member-count">(${node.count})</span>`;
                    }
                    // 자식 노드가 있을 경우 재귀적으로 처리
                    if (node.children && node.children.length > 0) {
                        addMemberCount(node.children);
                    }
                });
            }

            // count 값을 각 팀 노드에 추가
            addMemberCount(response.data);

            // jstree 라이브러리를 사용한 트리 렌더링
            $('#tree-container').jstree({
                'core': {
                    'check_callback': true,
                    'data': response.data //response.data를 트리 구조의 데이터로 설정
                },
                'plugins': ["dnd", "types", "state", "contextmenu"], 
                'dnd': {
                    'check_while_dragging': true,
                    'inside_pos': 'last',
                    'touch': false,
                    'large_drop_target': true,
                    'large_drag_target': true,
                    'use_html5': true // 드래그 앤 드롭이 HTML5의 기본 동작을 사용하도록 설정
                },
                'types': {
                    "team": {
                        "icon": "./images/team.svg", // 팀 노드에 사용할 아이콘 경로
                        'li_attr': {
                            'class': 'team_node' // li 태그에 클래스 추가
                        },
                        'a_attr': {
                            'class': 'team_node_link' // a 태그에 클래스 추가
                        }
                    },
                    "member": {
                        "icon": "./images/user.svg", // 멤버 노드에 사용할 아이콘 경로
                        'a_attr': {
                            'class': 'member_node_link' // a 태그에 클래스 추가
                        }
                    }
                },
                'state': {
                    'key': 'unique_key' // 트리 상태를 저장할 고유 키
                },
                'multiple': true, // 여러개 노드 동시 선택
                'contextmenu': false,
            })
     
            if (callback) {
                callback(); // 콜백 함수 호출 (조직도 로드 후 사용자 데이터를 로드)
            }
        },
        error: function(xhr, status, error) {
            console.error('조직도 데이터를 로드하는데 실패했습니다:', status, error);
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
    fetchUserData(1);
}

// 선택된 행 목록 업데이트
function updateSelectedRows() {
    selectedRows = [];
    $('#userTableBody tr.selected').each(function() {
        const userName = $(this).find('td[data-user-name]').data('user-name');
        const userId = $(this).find('td[data-user-id]').data('user-id');
        const userIdx = parseInt($(this).find('td[data-user-idx]').data('user-idx'), 10); // user_idx를 숫자로 변환
        // user_idx 추가
        selectedRows.push({ userName, userId, userIdx });
    });
    console.log('선택된 행:', selectedRows);
}

// 페이지네이션 렌더링
function renderPagination() {

    // 페이지네이션 ui가 들어갈 요소 선택
    const pagination = $('#pagination').empty();

    // << 버튼 (첫 페이지로 이동)
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchUserData(1);
    });
    pagination.append(first);

    const maxPagesToShow = 5; //한 번에 보여줄 페이지 번호의 개수(최대 5개로 설정)
    // let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    // let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

    // if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    //     startPage = Math.max(1, endPage - maxPagesToShow + 1);
    // }
    let startPage = Math.max(1, Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPage - maxPagesToShow + 1));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);


    // startPage 부터 endPage 까지의 페이지 번호 생성
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
        pageItem.on('click', function (event) {
            event.preventDefault();
            fetchUserData(i);
        });
        pagination.append(pageItem);
    }

    // >> 버튼 (마지막 페이지로 이동)
    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchUserData(totalPage);
    });
    pagination.append(last);
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
    
    loadTreeData();     // 조직도 데이터 로드
    fetchUserData(currentPage);     // 데이터 로드 함수 호출
    
    $('#serchButton').on('click', function() {
        executeSearch();
    });
   
    $('#searchInput').on('keydown', function(event) {
        if(event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });
    
    // 페이지 당 항목 수 변경 시 해당 항목 수에 맞춰 데이터 로드
    $('#itemCountSelect').on('change', function() {
        itemsPerPage = parseInt($(this).val(), 10);
        fetchUserData(1);
    });
       
    let selectedNodeId = null;
    let editingNodeId = null; // 편집 중인 노드의 ID를 저장
    let isEditing = false; // 편집 중 여부를 체크하는 플래그
    let originalText = ''; // 수정 전 텍스트 내용
    
    // 수정 버튼 클릭 시 노드 편집 모드로 전환
    $('#modifyNode').on('click', function() {
        
        if (selectedNodeId) {
            const node = $('#tree-container').jstree('get_node', selectedNodeId);
            
            console.log('노드 정보 !!!!!!!', node);
            
            originalText = node.text;
            
            // 노드 타입이 team인지 확인
            if (node.type === 'team') {
                // 기존의 멤버 카운트 span을 제거한 텍스트로 설정
             // 멤버 카운트 부분을 제외한 텍스트로 편집 모드 설정
             const cleanText = originalText.replace(/<span class="member-count">\(\d+\)<\/span>/, '').trim();

                $('#tree-container').jstree('set_text', node, cleanText);  // span 제거 후 텍스트로 설정
                $('#tree-container').jstree('edit', node); // 선택된 노드를 편집 모드로 전환
    
                 // 편집 중인 노드의 ID 저장
                 editingNodeId = selectedNodeId;
                 isEditing = true; // 편집 중임을 표시
                // 버튼 상태 변경
                $('#modifyNode').hide();
                $('#confirmNode').show();
                $('#cancleNode').show();
                $('#deleteNode').hide();
            } else {
                alert('팀 노드만 수정 가능합니다.');
            }
        } else {
            alert('수정할 노드를 선택하세요');
        }
    });

    // 확인 버튼 클릭 시 서버에 수정 요청
    $('#confirmNode').on('click', function() {
        
        if (editingNodeId && isEditing)  {
        // 편집 완료 후 텍스트 가져오기
        const editingNode = $('#tree-container').jstree('get_node', editingNodeId);
        const newName = $('#tree-container').jstree('get_text', editingNodeId); // 수정된 조직명

        console.log('수정된 노드:', editingNode);
        console.log('수정된 조직명:', newName);

        // 필요한 데이터 추출
        const fullNodeId = editingNode.id; // 예시로 "2_4" 형식의 ID
        const nodeId = parseInt(fullNodeId.split('_')[0], 10); // "2_4"에서 앞부분 "2"를 추출하여 숫자로 변환추출하고 정수로 변환
        const state = editingNode.state.opened; // 열린 상태 확인

        // org_p_idx와 org_g_idx
        let org_p_idx = editingNode.parent !== "#" ? editingNode.parent : nodeId;
        let org_g_idx = parseInt(getRootNodeId(editingNode), 10); // 루트 조직 ID를 숫자로 변환

        // 최상위 루트인 경우 처리
        if (org_p_idx === "#") {
            org_p_idx = nodeId; // 부모 ID를 자기 ID로 설정
            org_g_idx = nodeId; // 루트 ID도 자기 ID로 설정
        }

        console.log('Sending update request:', {
            nodeId, newName, state, org_p_idx, org_g_idx
        });
        
        // 서버로 수정 요청 보내기
        updateTeamNameOnServer(nodeId, newName, state, org_p_idx, org_g_idx);

        // 편집 모드 종료
        isEditing = false;

        // 버튼 상태 초기화
        $('#confirmNode').hide();
        $('#cancleNode').hide();
        $('#modifyNode').show();
        $('#deleteNode').show();
        editingNodeId = null; // 편집 중인 노드 ID 초기화
        } 
    });

    // 편집 취소 버튼
    $('#cancleNode').on('click', function() {
        if (editingNodeId && isEditing) {
            $('#tree-container').jstree('cancel_node', editingNodeId); // 편집 취소
            isEditing = false;
            
            // 원래 텍스트로 복원
            if (editingNodeId) {
                const node = $('#tree-container').jstree('get_node', editingNodeId);
                $('#tree-container').jstree('set_text', node, originalText); // 원래 텍스트로 복구
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

    // 서버에 조직명 업데이트 요청 함수
    function updateTeamNameOnServer(nodeId, newName, state, org_p_idx, org_g_idx) {
        const formData = new FormData();
        
        formData.append('id', nodeId); // 조직 ID
        formData.append('text', newName); // 수정된 조직명
        formData.append('state', JSON.stringify(state)); // 상태
        formData.append('org_p_idx', org_p_idx); // 부모 조직 ID
        formData.append('org_g_idx', org_g_idx); // 루트 조직 ID

        // FormData의 내용을 확인하는 코드
        console.log('FormData to be sent:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // 서버 요청
        $.ajax({
            url: 'http://safe.withfirst.com:28888/with/edit-org', // 서버 URL
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${atoken}`
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                alert('조직명이 성공적으로 업데이트되었습니다.');
                console.log('서버 응답:', response);
                // 트리 데이터 새로고침
                window.location.reload();
            },
            error: function(xhr, status, error) {
                alert('조직명 업데이트에 실패했습니다.');
                console.error('서버 오류:', status, error);
            }
        });
    }

    // 노드 선택 시 선택된 노드의 ID 저장
    $('#tree-container').on('select_node.jstree', function(e, data) {
        selectedNodeId = data.node.id;
    });
            
    // 트리 내의 다른 부분(노드 외부) 클릭 시 선택 해제 및 변수 초기화
    $('#tree-container').on('click.jstree', function(e) {
        if (!$(e.target).closest('.jstree-anchor').length) {
            $('#tree-container').jstree('deselect_all'); // 트리 선택 해제
            selectedNodeId = null; // 선택된 노드 ID 초기화
            console.log('선택된 노드 id 초기화');
        }
    });
    
    let selectedNodeIds = []; // 다중 선택된 노드의 ID를 저장할 배열
    
    // 노드 선택 시 선택된 노드의 ID 저장
    $('#tree-container').on('changed.jstree', function(e, data) {
        selectedNodeIds = data.selected; // 선택된 노드들의 ID 배열
        console.log('Selected Node IDs:', selectedNodeIds);
    });
    
    // 노드 삭제 기능
    $('#deleteNode').on('click', function() {
        if (selectedNodeIds.length > 0) {
            const userIdsToDelete = [];
            let orgIdx = null;
            
            selectedNodeIds.forEach(function(nodeId) {
                const node = $('#tree-container').jstree('get_node', nodeId);
                
                // 팀 삭제인 경우
                if (node.type === 'team') {
                    // 조직 삭제 처리
                    const cleanText = node.text.replace(/<span.*<\/span>/, '').trim(); // span 태그 제거한 텍스트

                    const deleteData = {
                        id: node.id,
                        text: cleanText
                    };
                    
                    console.log('서버로 전송될 데이터:', JSON.stringify([deleteData]));

                    // 서버에 삭제 요청 보내기
                    $.ajax({
                        url: 'http://safe.withfirst.com:28888/with/del-org', // 조직 삭제 API
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${atoken}`
                        },
                        contentType: 'application/json',
                        data: JSON.stringify([deleteData]), // JSON 데이터를 문자열로 변환하여 전송
                        success: function(response) {
                            alert('조직이 성공적으로 삭제되었습니다.');
                            console.log('성공했으니까 오는거지',response)
                            
                            $('#tree-container').jstree('delete_node', nodeId); // jstree에서 노드 삭제
                            loadTreeData(function() { // 콜백으로 트리 갱신 처리
                                selectedNodeIds = []; // 선택된 노드 ID 배열 초기화
                            });
                        },
                        error: function(xhr, status, error) {
                            alert('조직 삭제에 실패했습니다.');
                            console.error('서버 오류:', status, error);
                        }
                    });
                }

                // 멤버 삭제인 경우
                if (node.type === 'member') {
                    const userIdx = node.id.split('_')[1]; // user_idx 추출
                    userIdsToDelete.push(parseInt(userIdx, 10)); // 정수로 변환하여 배열에 추가
                    orgIdx = node.parent; // 조직 ID 설정
                }
            });
            
            // 멤버 삭제 처리
            if (userIdsToDelete.length > 0 && orgIdx) {
                const formData = new FormData();
                
                formData.append('user_datas', JSON.stringify(userIdsToDelete)); // 삭제할 사용자들의 user_idx 배열
                formData.append('org_idx', orgIdx); // 조직 ID

                // FormData 내용을 콘솔에 출력
                console.log('FormData to be sent:');
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }

                // 서버에 멤버 삭제 요청 보내기
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/users-del-org', // 멤버 삭제 API
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${atoken}`
                    },
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        alert('멤버가 성공적으로 삭제되었습니다.');
                        console.log('멤버삭제',response);
                        
                        // UI에서 즉시 멤버 노드를 삭제
                        userIdsToDelete.forEach(userId => {
                            // 팀 ID와 유저 ID를 결합하여 노드 ID를 생성 (형식: 팀ID_유저ID)
                            const nodeId = `${orgIdx}_${userId}`; // 예상되는 형식으로 노드 ID 생성
                            const node = $('#tree-container').jstree('get_node', nodeId);

                            // 디버깅: 노드가 존재하는지 여부를 콘솔에 출력
                            console.log(`Trying to delete node with ID: ${nodeId}`);
                            console.log('All nodes in jstree:', $('#tree-container').jstree(true).get_json('#', { 'flat': true }));
                            
                            if (node) {
                                $('#tree-container').jstree('delete_node', nodeId); // jstree에서 멤버 노드 삭제
                            } else {
                                console.error(`Failed to find node with ID: ${nodeId}`);
                            }
                        });
                
                        selectedNodeIds = []; // 선택된 노드 ID 배열 초기화
                        },
                        error: function(xhr, status, error) {
                        alert('멤버 삭제에 실패했습니다.');
                        console.error('서버 오류:', status, error);
                    }
                });
            }
        } else {
            alert('삭제할 노드를 선택하세요');
        }
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
            
            if (!targetNode || targetNode.type !== "team") {
                alert("사용자는 팀 노드에만 추가할 수 있습니다.");
                return;
            }
            
            console.log('JSON 형식으로 변환된 드래그된 데이터 :',droppedData);
            
            // ** 중복 체크 **
            // 해당 팀 노드의 자식 노드 (이미 추가된 사용자)들의 user_idx 추출
            let teamUserIdxs = targetNode.children.map(childId => {
                const childNode = $('#tree-container').jstree('get_node', childId);

                console.log('자식 노드', childNode);

                if (childNode.type === 'member') {
                    return parseInt(childNode.id.split('_')[1], 10); // _ 뒤의 user_idx 추출
                    }
                    return null;
                }).filter(userIdx => userIdx !== null); // null 값 제거
        
                // 중복 여부 체크: 해당 팀에 이미 추가된 user_idx와 드래그된 user_idx 비교
                const duplicateUsers = droppedData.filter(user => teamUserIdxs.includes(user.userIdx));

                console.log('중복여부', duplicateUsers);
        
                if (duplicateUsers.length > 0) {
                    alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.map(u => u.userName).join(', '));
                    return; // 중복이 있으면 추가하지 않음
                }
        
                // user_idx 배열을 생성
                const userIdxArray = droppedData.map(user => user.userIdx);
        
                // 서버에 user_idx와 org_idx를 POST 요청으로 전송
                const formData = new FormData();
                formData.append('user_datas', JSON.stringify(userIdxArray)); // user_idx 배열을 문자열로 변환하여 전송
                formData.append('org_idx', targetNode.id); // 드랍된 조직의 ID (targetNode의 ID)
        
        
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/users-add-org',
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
                        droppedData.forEach(user => {
                            const randomId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // 임시 노드 ID 생성
        
                            // jstree에 임시 ID로 추가
                            $('#tree-container').jstree().create_node(targetNode, {
                                "text": user.userName,
                                "id": randomId,
                                "type": "member",
                            });
        
                            // 서버에서 받은 실제 ID로 노드 업데이트 (org_idx와 user_idx 조합)
                            const newNodeId = `${targetNode.id}_${user.userIdx}`;
                            $('#tree-container').jstree('set_id', randomId, newNodeId);
        
                            // 추가된 사용자를 teamUserIdxs에 즉시 반영
                            teamUserIdxs.push(user.userIdx);
        
                            console.log(`사용자 ${user.userName}가 성공적으로 추가되었습니다. ID 갱신: ${randomId} -> ${newNodeId}`);
                        });
        
                        // 추가된 사용자 정보를 최신 상태로 유지
                        console.log("Updated teamUserIdxs: ", teamUserIdxs);
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
            
            if (childNode.type === 'member') {
                return childNode.id; // 자식 노드의 전체 ID (teamID_userID) 반환
                }
                return null;
            }).filter(id => id !== null);
            
            console.log('newTeamNodeIds:', newTeamNodeIds); // 이동할 팀의 노드 ID 출력 (teamID_userID)
            
            // 중복 여부 체크: 팀 내에 이미 같은 노드 ID (teamID_userID)가 있는지 확인
            const duplicateUsers = draggedUserIds.filter(userId => newTeamNodeIds.includes(`${newTeamId}_${userId}`));
            if (duplicateUsers.length > 0) {
                alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.join(', '));
                $('#tree-container').jstree('refresh'); // 트리 새로고침하여 이동 취소
                return; // 서버로 이동 요청을 보내지 않고, 여기서 중단
            }
        
            // **중복 확인 후에만 서버 요청** //
            const formData = new FormData();
            formData.append('user_datas', JSON.stringify(draggedUserIds)); // 선택된 모든 user_idx 전송
            formData.append('org_idx', oldTeamId); // 기존 팀의 ID
            formData.append('move_idx', newTeamId); // 이동할 팀의 ID
            
            // 서버에 AJAX 요청
            $.ajax({
                url: 'http://safe.withfirst.com:28888/with/users-add-org',
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
                    selectedNodes.forEach(nodeId => {
                        const userId = nodeId.split('_')[1];
                        const newNodeId = `${newTeamId}_${userId}`;
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
    
    // 조직 추가 기능
    $('#addTeam').on('click', function() {
        const selectedNode = selectedNodeId ? $('#tree-container').jstree('get_node', selectedNodeId) : '#';
        
        // 선택된 노드가 'member' 타입인 경우 추가를 차단하고 경고 메시지 표시
        if (selectedNode !== '#' && selectedNode.type === 'member') {
            alert('멤버 노드에는 조직을 추가할 수 없습니다.');
            return;
        }
        
        // 선택된 조직의 자식 노드들 중 'member' 타입이 있는지 확인
        if (selectedNode && selectedNode.children) {
            const hasMembers = selectedNode.children.some(childId => {
                const childNode = $('#tree-container').jstree('get_node', childId);
                return childNode.type === 'member';
            });
            
            // 멤버가 있는 경우 추가를 차단하고 경고 메시지 표시
            if (hasMembers) {
                alert('이 조직에 이미 멤버가 있으므로 새로운 조직을 추가할 수 없습니다.');
                return;
            }
        }
        const newTeamName = "새로운 조직";
        const newNodeId = new Date().getTime();
                
        // 새로운 팀 노드 데이터 생성
        const newNodeData = {
            "id" : newNodeId,
            "text": newTeamName,
            "type": "team",
            "state": { "opened": true }, // 기본적으로 열림 상태로 추가
            "children": [],
        };
        
        // jstree에 새로운 노드 추가
        const newNode = $('#tree-container').jstree().create_node(selectedNode === '#' ? '#' : selectedNode, newNodeData, "last");
        
        const formData = new FormData();
        formData.append('text', newTeamName);
        formData.append('state', JSON.stringify({ "opened": true }));

        // 선택된 노드가 있는 경우에만 org_p_idx와 org_g_idx 전송
        if (selectedNode !== '#') {
            formData.append('org_p_idx', selectedNode.id); // 부모 노드의 ID 사용
            formData.append('org_g_idx', getRootNodeId(selectedNode)); // 루트 노드의 ID 사용
        }
                
        // FormData 내용 로그 출력
        formData.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });
        
        $.ajax({

            url: 'http://safe.withfirst.com:28888/with/add-org',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${atoken}`
                },
                data: formData,
                processData: false, 
                contentType: false, 
                success: function(response) {
                    alert('조직이 성공적으로 추가되었습니다.');
                    console.log('서버 응답:', response)
                    
                    // 서버에서 응답으로 받은 id를 새로 추가된 노드에 설정
                    $('#tree-container').jstree('set_id', newNode, response.data.id);  // response에서 data.id를 사용하여 jstree에 설정
                    
                    loadTreeData();
                },
                error: function(xhr, status, error) {
                    alert('조직 추가에 실패했습니다.');
                    console.error('서버 오류:', status, error);
            }
        });
    });
    
    // 루트 노드 ID를 가져오는 함수
    function getRootNodeId(node) {
            var rootNode = node;
            while (rootNode.parent !== "#") {
                rootNode = $('#tree-container').jstree('get_node', rootNode.parent);
            }
            return rootNode.id;
    }
        
    // 클릭 시 트리 외부 영역에서 선택 해제 및 변수 초기화
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#tree-container').length) {
             $('#tree-container').jstree('deselect_all'); // 트리 선택 해제
            selectedNodeId = null; // 선택된 노드 ID 초기화
            console.log('Selected Node ID reset to null');
        }
    });

});
