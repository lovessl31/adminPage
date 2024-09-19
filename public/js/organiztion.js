let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";
let selectedRows = []; // 선택된 행을 저장할 배열
let addedUserIdxs = []; // 조직도에 추가된 사용자들의 user_idx 배열


// 조직도 데이터를 로드하고, 이미 추가된 사용자들의 user_idx를 추출하는 함수
function loadTreeData(callback) {
    const token = localStorage.getItem('accessToken');

    // $.ajax({
    //     url: 'http://safe.withfirst.com:28888/with/view-org',
    //     method: 'GET',
    //     headers: {
    //         'Authorization': `Bearer ${token}`,
    //     },
    //     dataType: 'json',
    //     success: function(response) {
    //         console.log('조직도목록', response.data);

    //         // 조직도에서 이미 추가된 사용자들의 user_idx 추출
    //         addedUserIdxs = [];
    //         function collectUserIdxs(nodes) {
    //             nodes.forEach(node => {
    //                 if (node.type === 'member') {
    //                     const userIdx = node.id.split('_')[1]; // _ 뒤의 user_idx 추출
    //                     addedUserIdxs.push(parseInt(userIdx, 10)); // 정수로 변환 후 배열에 추가
    //                 }
    //                 if (node.children && node.children.length > 0) {
    //                     collectUserIdxs(node.children); // 재귀적으로 자식 노드도 확인
    //                 }
    //             });
    //         }
    //         collectUserIdxs(response.data); // 조직도 데이터를 순회하며 user_idx 수집

    //         console.log('조직도에 추가된 사용자 user_idx:', addedUserIdxs);

    //         // 조직도 트리 렌더링
    //         $('#tree-container').jstree({
    //             'core': {
    //                 'check_callback': true,
    //                 'data': response.data
    //             },
    //             'plugins': ["dnd", "types", "state", "contextmenu"], 
    //             'types': {
    //                 "team": {
    //                     "icon": "./images/team.svg"
    //                 },
    //                 "member": {
    //                     "icon": "./images/user.svg"
    //                 }
    //             }
    //         });

    $.ajax({
        url: 'http://safe.withfirst.com:28888/with/view-org',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        dataType: 'json',
        success: function(response) {
            console.log('조직도 데이터를 성공적으로 로드했습니다:', response.data); // 트리 데이터를 성공적으로 로드했는지 확인

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


            $('#tree-container').jstree({
                'core': {
                    'check_callback': true,
                    'data': response.data
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
                'multiple': true,
                'contextmenu': false,
            })
            // .on('loaded.jstree', function() {
            //     console.log('조직도가 새로 렌더링되었습니다.'); // jstree가 성공적으로 로드된 후 확인

            //   // type이 'team'인 노드에 'jsteam' 클래스 추가
            //     $('#tree-container').jstree(true).get_json('#', { 'flat': true }).forEach(function(node) {
            //         if (node.type === 'team') {
            //             $('#' + node.id + '_anchor').addClass('jsteam');
            //         }
            //     });

            // });

            if (callback) {
                callback(); // 콜백 함수 호출 (조직도 로드 후 사용자 데이터를 로드)
            }
        },
        error: function(xhr, status, error) {
            console.error('조직도 데이터를 로드하는데 실패했습니다:', status, error);
        }
    });
}



document.addEventListener('DOMContentLoaded', () => {

    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

     loadTreeData(); // 조직도 데이터 로드

     
    // 데이터 로드 함수 호출
    loadUserData(currentPage);
    
    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시 검색
    document.getElementById('searchButton').addEventListener('click', () => {
        executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });
});

// 공통 요청 함수
function makeRequest(method, url, data = {}) {
    const token = localStorage.getItem('accessToken');
    return axios({
        method: method,
        url: url,
        data: data,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}

// 에러 처리 함수
function handleError(error, defaultMessage = 'An error occurred') {
    const message = error.response && error.response.data ? error.response.data : defaultMessage;
    console.error(message);
    console.log('에러', error);
    alert(message);
}

// 사용자 데이터 불러오기
function loadUserData(page = 1) {
    currentPage = page;
    localStorage.setItem('currentPage', currentPage); // 현재 페이지 저장
    const url = `http://safe.withfirst.com:28888/with/users-view-org?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    makeRequest('get', url)
        .then(response => {
            let data = response.data.data;

    
            users = data;
            totalPage = response.data.total_page || 1;

            console.log('사용자목록dd',users);

            renderUserTable();
            renderPagination();
        })
        .catch(error => handleError(error, '사용자 데이터를 불러오는 데 실패했습니다.'));
}

// 검색 실행 함수
function executeSearch() {
    const searchSelect = document.getElementById('searchSelect');
    const searchInput = document.getElementById('searchInput');
    if (searchSelect) {
        optionType = searchSelect.value;
    }
    if (searchInput) {
        optionValue = searchInput.value.trim();
    }
    // 검색 조건이 변경 될 때마다 페이지를 1로 설정하고 데이터를 가져옴
    loadUserData(1);
}

// 사용자 테이블 렌더링
function renderUserTable() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = ''; // 기존 내용을 비우기

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="./images/drag2.svg"></td>
            <td data-user-name="${user.user_name}">${user.user_name}</td>
            <td data-user-id="${user.user_id}">${user.user_id}</td>
            <td data-user-idx="${user.user_idx}" style="display:none;"></td> <!-- user_idx를 숨김 -->
            <td>${user.phone_number}</td>
            <td>${user.c_name}</td>
            <td>${user.user_rank}</td>
            <td>${user.user_position}</td>
        `;
        tableBody.appendChild(row);

        // 각 행에 클릭 이벤트 추가
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) { // Ctrl 키를 눌렀을 때는 다중 선택 가능
                this.classList.toggle('selected');
            } else {
                document.querySelectorAll('#userTableBody tr').forEach(r => r.classList.remove('selected'));
                this.classList.add('selected');
            }
            updateSelectedRows();
        });

        // 각 행에 드래그 이벤트 추가
        row.setAttribute('draggable', true);  // 드래그 가능하도록 설정
        row.addEventListener('dragstart', function(e) {
            if (!this.classList.contains('selected')) {
                this.classList.add('selected');
                updateSelectedRows();
            }
            const userData = JSON.stringify(selectedRows);
            e.dataTransfer.setData('text/plain', userData);
            console.log('Storing user data in dataTransfer:', userData);
        });
    });
}

// 선택된 행 목록 업데이트
function updateSelectedRows() {
    selectedRows = [];
    document.querySelectorAll('#userTableBody tr.selected').forEach(row => {
        const userName = row.querySelector('td[data-user-name]').dataset.userName;
        const userId = row.querySelector('td[data-user-id]').dataset.userId;
        const userIdx = parseInt(row.querySelector('td[data-user-idx]').dataset.userIdx, 10); // user_idx를 숫자로 변환
 // user_idx 추가
        selectedRows.push({ userName, userId, userIdx });
    });
    console.log('Selected Rows:', selectedRows);
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 첫 페이지로 이동 (<<)
    const first = document.createElement('li');
    first.className = 'page-item';
    first.innerHTML = `<a class="page-link" href="#"><<</a>`;
    first.onclick = (event) => {
        event.preventDefault();
        loadUserData(1);
    };
    pagination.appendChild(first);
    
    // 페이지 번호
    const maxPagesToShow = 5; // 최대 페이지 버튼 수
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);
    
    // 페이지 번호가 최소 범위를 초과하면 오른쪽으로 이동
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item' + (i === currentPage ? ' active' : '');
        
        const pageButton = document.createElement('a');
        pageButton.className = 'page-link';
        pageButton.href = '#';
        pageButton.textContent = i;
        pageButton.onclick = (event) => {
            event.preventDefault();
            loadUserData(i);
        };
        
        pageItem.appendChild(pageButton);
        pagination.appendChild(pageItem);
    }

    // 마지막 페이지로 이동 (>>)
    const last = document.createElement('li');
    last.className = 'page-item';
    last.innerHTML = `<a class="page-link" href="#">>></a>`;
    last.onclick = (event) => {
        event.preventDefault();
        loadUserData(totalPage);
    };
    pagination.appendChild(last);
}


$(function() {
        let selectedNodeId = null;
        const token = localStorage.getItem('accessToken');

         // 트리 데이터 로드
        loadTreeData();


    // jstree의 rename_node 이벤트를 사용하여 수정이 완료된 후 서버로 요청
    // $('#tree-container').on('rename_node.jstree', function(e, data) {
    //     const nodeId = data.node.id; // 수정된 노드의 ID
    //     const newName = data.text; // 수정된 조직명
    //     const state = data.node.state.opened; // 열린 상태
    //     let org_p_idx = data.node.parent; // 부모 조직 ID
    //     let org_g_idx = getRootNodeId(data.node); // 루트 조직 ID

    //     // 최상위 루트인 경우 org_p_idx와 org_g_idx를 자기 ID로 설정
    //     if (org_p_idx === "#") {
    //         org_p_idx = nodeId; // 부모 ID를 자기 ID로
    //         org_g_idx = nodeId; // 루트 ID도 자기 ID로
    //     }

    //     console.log('Node renamed. Sending update request:', {
    //         nodeId, newName, state, org_p_idx, org_g_idx
    //     });

    //     // 서버로 수정 요청 보내기
    //     updateTeamNameOnServer(nodeId, newName, state, org_p_idx, org_g_idx);
    // });

    let editingNodeId = null; // 편집 중인 노드의 ID를 저장
    let isEditing = false; // 편집 중 여부를 체크하는 플래그

    // 수정 버튼 클릭 시 노드 편집 모드로 전환
    $('#modifyNode').on('click', function() {
        if (selectedNodeId) {
            const node = $('#tree-container').jstree('get_node', selectedNodeId);
    
            // 노드 타입이 team인지 확인
            if (node.type === 'team') {
                $('#tree-container').jstree('edit', node); // 선택된 노드를 편집 모드로 전환
    
                 // 편집 중인 노드의 ID 저장
                 editingNodeId = selectedNodeId;
                 isEditing = true; // 편집 중임을 표시
                // 버튼 상태 변경
                $('#modifyNode').hide();
                $('#confirmNode').show();
                $('#cancleNode').show();
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
        let org_p_idx = parseInt(editingNode.parent, 10); // 부모 조직 ID를 숫자로 변환
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
        editingNodeId = null; // 편집 중인 노드 ID 초기화
        } 
    });

    $('#cancleNode').on('click', function() {
        if (editingNodeId && isEditing) {
            $('#tree-container').jstree('cancel_node', editingNodeId); // 편집 취소
            isEditing = false;
            editingNodeId = null; // 편집 중인 노드 ID 초기화
            // 버튼 상태 초기화
            $('#confirmNode').hide();
            $('#modifyNode').show();
        }
    });


// 트리 외부 클릭 시 편집 모드 종료 및 UI 복구
$(document).on('mousedown', function(event) {
    // 트리 외부 클릭 시 (단, 확인 버튼과 취소 버튼은 제외)
    if (isEditing && !$(event.target).closest('#tree-container, #confirmNode, #cancleNode').length) {
   
        // 버튼 상태 변경
        $('#confirmNode').hide();
        $('#cancleNode').hide();
        $('#modifyNode').show();
        
        // 편집 모드 종료
        isEditing = false;
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
                'Authorization': `Bearer ${token}`
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                alert('조직명이 성공적으로 업데이트되었습니다.');
                console.log('서버 응답:', response);
                // 트리 데이터 새로고침
                loadTreeData();
            },
            error: function(xhr, status, error) {
                alert('조직명 업데이트에 실패했습니다.');
                console.error('서버 오류:', status, error);
            }
        });
    }

    // 루트 노드 ID를 가져오는 함수
    function getRootNodeId(node) {
        var rootNode = node;
        while (rootNode.parent !== "#") {
            rootNode = $('#tree-container').jstree('get_node', rootNode.parent);
        }
        return rootNode.id;
    }
    // $.ajax({
    //     url: 'http://safe.withfirst.com:28888/with/view-org',
    //     method: 'GET',
    //     headers: {
    //         'Authorization': `Bearer ${token}`,
    //     },
    //     dataType: 'json',
    //     success: function(response) {
    //         console.log('조직도목록',response);
    //         console.log('조직도목록',response.data);
    //         $('#tree-container').jstree({
    //             'core': {
    //                 'check_callback': true,
    //                 'data': response.data
    //             },
    //             'plugins': ["dnd", "types", "state", "contextmenu"], 
    //             'dnd': {
    //                 'check_while_dragging': true,
    //                 'inside_pos': 'last',
    //                 'touch': false,
    //                 'large_drop_target': true,
    //                 'large_drag_target': true,
    //                 'use_html5': true // 드래그 앤 드롭이 HTML5의 기본 동작을 사용하도록 설정
    //             },
    //             'types': {
    //                 "team": {
    //                     "icon": "./images/team.svg" // 팀 노드에 사용할 아이콘 경로
    //                 },
    //                 "member": {
    //                     "icon": "./images/user.svg" // 멤버 노드에 사용할 아이콘 경로
    //                 }
    //             },
    //             'state': {
    //                 'key': 'unique_key' // 트리 상태를 저장할 고유 키
    //             },
    //             'multiple': true,
    //             'contextmenu': {
    //                 'items': function(node) {
    //                     return {
    //                         "rename": {
    //                             "label": "Rename",
    //                             "action": function () {
    //                                 $('#tree-container').jstree('edit', node);
    //                             }
    //                         },
    //                         "remove": {
    //                             "label": "Delete",
    //                             "action": function () {
    //                                 $('#tree-container').jstree('delete_node', node);
    //                             }
    //                         }
    //                     };
    //                 }
    //             }
    //         }).on('loaded.jstree', function() {
    //             // type이 'team'인 노드에 'jsteam' 클래스 추가
    //             $('#tree-container').jstree(true).get_json('#', { 'flat': true }).forEach(function(node) {
    //                 if (node.type === 'team') {
    //                     $('#' + node.id + '_anchor').addClass('jsteam');
    //                 }
    //             });
    //         });
    
            // 노드 선택 시 선택된 노드의 ID 저장
            $('#tree-container').on('select_node.jstree', function(e, data) {
                selectedNodeId = data.node.id;
            });
            
            // 트리 내의 다른 부분(노드 외부) 클릭 시 선택 해제 및 변수 초기화
            $('#tree-container').on('click.jstree', function(e) {
                if (!$(e.target).closest('.jstree-anchor').length) {
                    $('#tree-container').jstree('deselect_all'); // 트리 선택 해제
                    selectedNodeId = null; // 선택된 노드 ID 초기화
                    console.log('Selected Node ID reset to null');
                }
            });
            
    
            var selectedNodeIds = []; // 다중 선택된 노드의 ID를 저장할 배열

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
                        const deleteData = {
                            id: node.id,
                            text: node.text
                        };

                        // 서버에 삭제 요청 보내기
                        $.ajax({
                            url: 'http://safe.withfirst.com:28888/with/del-org', // 조직 삭제 API
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            contentType: 'application/json',
                            data: JSON.stringify([deleteData]), // JSON 데이터를 문자열로 변환하여 전송
                            success: function(response) {
                                alert('조직이 성공적으로 삭제되었습니다.');
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

                    // 서버에 멤버 삭제 요청 보내기
                    $.ajax({
                        url: 'http://safe.withfirst.com:28888/with/users-del-org', // 멤버 삭제 API
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function(response) {
                            alert('멤버가 성공적으로 삭제되었습니다.');

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


    
            $('#tree-container').on('dragover', function(e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
            });
    
            // 중벅처리
// 중복 체크 
        // $('#tree-container').on('drop', function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();

        //     const data = e.originalEvent.dataTransfer.getData('text/plain');
        //     console.log('Data retrieved from dataTransfer:', data);

        //     try {
        //         const droppedData = JSON.parse(data);
        //         const targetNode = $('#tree-container').jstree('get_node', e.target);

        //         if (!targetNode || targetNode.type !== "team") {
        //             alert("사용자는 팀 노드에만 추가할 수 있습니다.");
        //             return;
        //         }

        //         console.log(droppedData);

        //         // 해당 팀 노드의 자식 노드 (이미 추가된 사용자)들의 user_idx 추출
        //         let teamUserIdxs = targetNode.children.map(childId => {
        //             const childNode = $('#tree-container').jstree('get_node', childId);
        //             if (childNode.type === 'member') {
        //                 return parseInt(childNode.id.split('_')[1], 10); // _ 뒤의 user_idx 추출
        //             }
        //             return null;
        //         }).filter(userIdx => userIdx !== null); // null 값 제거

        //         // 중복 여부 체크: 해당 팀에 이미 추가된 user_idx와 드래그된 user_idx 비교
        //         const duplicateUsers = droppedData.filter(user => teamUserIdxs.includes(user.userIdx));

        //         if (duplicateUsers.length > 0) {
        //             alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.map(u => u.userName).join(', '));
        //             return; // 중복이 있으면 추가하지 않음
        //         }

        //         // user_idx 배열을 생성
        //         const userIdxArray = droppedData.map(user => user.userIdx);

        //         // 서버에 user_idx와 org_idx를 POST 요청으로 전송
        //         const formData = new FormData();
        //         formData.append('user_datas', JSON.stringify(userIdxArray)); // user_idx 배열을 문자열로 변환하여 전송
        //         formData.append('org_idx', targetNode.id); // 드랍된 조직의 ID (targetNode의 ID)

        //         const token = localStorage.getItem('accessToken');

        //         $.ajax({
        //             url: 'http://safe.withfirst.com:28888/with/users-add-org',
        //             method: 'POST',
        //             headers: {
        //                 'Authorization': `Bearer ${token}`
        //             },
        //             data: formData,
        //             processData: false,
        //             contentType: false,
        //             success: function(response) {
        //                 alert('사용자가 조직에 성공적으로 추가되었습니다.');
        //                 console.log('서버 응답:', response);

        //                 // 서버 응답에서 data를 받아옴 (조직과 사용자 ID를 기반으로)
        //                 droppedData.forEach(user => {
        //                     const randomId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // 임시 노드 ID 생성

        //                     // jstree에 임시 ID로 추가
        //                     $('#tree-container').jstree().create_node(targetNode, {
        //                         "text": user.userName,
        //                         "id": randomId,
        //                         "type": "member",
        //                     });

        //                     // 서버에서 받은 실제 ID로 노드 업데이트 (org_idx와 user_idx 조합)
        //                     const newNodeId = `${targetNode.id}_${user.userIdx}`;
        //                     $('#tree-container').jstree('set_id', randomId, newNodeId);

        //                     // 추가된 사용자를 teamUserIdxs에 즉시 반영
        //                     teamUserIdxs.push(user.userIdx);

        //                     console.log(`사용자 ${user.userName}가 성공적으로 추가되었습니다. ID 갱신: ${randomId} -> ${newNodeId}`);
        //                 });

        //                 // 추가된 사용자 정보를 최신 상태로 유지
        //                 console.log("Updated teamUserIdxs: ", teamUserIdxs);
        //             },
        //             error: function(xhr, status, error) {
        //                 alert('사용자를 조직에 추가하는 데 실패했습니다.');
        //                 console.error('서버 오류:', status, error);
        //             }
        //         });
        //     } catch (err) {
        //         console.error('Failed to parse JSON:', err);
        //     }
        // });

        // $('#tree-container').on('drop', function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();
        
        //     const data = e.originalEvent.dataTransfer.getData('text/plain');
        //     console.log('Data retrieved from dataTransfer:', data);
        
        //     try {
        //         // JSON이 아닌 데이터를 드롭했을 때 예외 처리 추가
        //         if (!data.startsWith('[') && !data.startsWith('{')) {
        //             throw new Error('Invalid data format. Expected JSON, but received: ' + data);
        //         }
        
        //         const droppedData = JSON.parse(data);
        //         const targetNode = $('#tree-container').jstree('get_node', e.target);
        
        //         if (!targetNode || targetNode.type !== "team") {
        //             alert("사용자는 팀 노드에만 추가할 수 있습니다.");
        //             return;
        //         }
        
        //         console.log(droppedData);
        
        //         // 해당 팀 노드의 자식 노드 (이미 추가된 사용자)들의 user_idx 추출
        //         let teamUserIdxs = targetNode.children.map(childId => {
        //             const childNode = $('#tree-container').jstree('get_node', childId);
        //             if (childNode.type === 'member') {
        //                 return parseInt(childNode.id.split('_')[1], 10); // _ 뒤의 user_idx 추출
        //             }
        //             return null;
        //         }).filter(userIdx => userIdx !== null); // null 값 제거
        
        //         // 중복 여부 체크: 해당 팀에 이미 추가된 user_idx와 드래그된 user_idx 비교
        //         const duplicateUsers = droppedData.filter(user => teamUserIdxs.includes(user.userIdx));
        
        //         if (duplicateUsers.length > 0) {
        //             alert("해당 팀에 이미 추가된 사용자가 있습니다: " + duplicateUsers.map(u => u.userName).join(', '));
        //             return; // 중복이 있으면 추가하지 않음
        //         }
        
        //         // user_idx 배열을 생성
        //         const userIdxArray = droppedData.map(user => user.userIdx);
        
        //         // 서버에 user_idx와 org_idx를 POST 요청으로 전송
        //         const formData = new FormData();
        //         formData.append('user_datas', JSON.stringify(userIdxArray)); // user_idx 배열을 문자열로 변환하여 전송
        //         formData.append('org_idx', targetNode.id); // 드랍된 조직의 ID (targetNode의 ID)
        
        //         const token = localStorage.getItem('accessToken');
        
        //         $.ajax({
        //             url: 'http://safe.withfirst.com:28888/with/users-add-org',
        //             method: 'POST',
        //             headers: {
        //                 'Authorization': `Bearer ${token}`
        //             },
        //             data: formData,
        //             processData: false,
        //             contentType: false,
        //             success: function(response) {
        //                 alert('사용자가 조직에 성공적으로 추가되었습니다.');
        //                 console.log('서버 응답:', response);
        
        //                 // 서버 응답에서 data를 받아옴 (조직과 사용자 ID를 기반으로)
        //                 droppedData.forEach(user => {
        //                     const randomId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // 임시 노드 ID 생성
        
        //                     // jstree에 임시 ID로 추가
        //                     $('#tree-container').jstree().create_node(targetNode, {
        //                         "text": user.userName,
        //                         "id": randomId,
        //                         "type": "member",
        //                     });
        
        //                     // 서버에서 받은 실제 ID로 노드 업데이트 (org_idx와 user_idx 조합)
        //                     const newNodeId = `${targetNode.id}_${user.userIdx}`;
        //                     $('#tree-container').jstree('set_id', randomId, newNodeId);
        
        //                     // 추가된 사용자를 teamUserIdxs에 즉시 반영
        //                     teamUserIdxs.push(user.userIdx);
        
        //                     console.log(`사용자 ${user.userName}가 성공적으로 추가되었습니다. ID 갱신: ${randomId} -> ${newNodeId}`);
        //                 });
        
        //                 // 추가된 사용자 정보를 최신 상태로 유지
        //                 console.log("Updated teamUserIdxs: ", teamUserIdxs);
        //             },
        //             error: function(xhr, status, error) {
        //                 alert('사용자를 조직에 추가하는 데 실패했습니다.');
        //                 console.error('서버 오류:', status, error);
        //             }
        //         });
        //     } catch (err) {
        //         console.error('Failed to parse JSON:', err);
        //     }
        // });
        
        $('#tree-container').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        
            const data = e.originalEvent.dataTransfer.getData('text/plain');
            console.log('Data retrieved from dataTransfer:', data);
        
            // 만약 URL이나 다른 형식의 데이터가 들어왔을 때 이를 무시
            if (data.startsWith('http') || data.includes('localhost')) {
                console.warn('URL 데이터가 드롭되었습니다. 무시합니다:', data);
                return;
            }
        
            try {
                const droppedData = JSON.parse(data);  // JSON 형식으로 변환 시도
                const targetNode = $('#tree-container').jstree('get_node', e.target);
        
                if (!targetNode || targetNode.type !== "team") {
                    alert("사용자는 팀 노드에만 추가할 수 있습니다.");
                    return;
                }
        
                console.log(droppedData);
        
                // 해당 팀 노드의 자식 노드 (이미 추가된 사용자)들의 user_idx 추출
                let teamUserIdxs = targetNode.children.map(childId => {
                    const childNode = $('#tree-container').jstree('get_node', childId);
                    if (childNode.type === 'member') {
                        return parseInt(childNode.id.split('_')[1], 10); // _ 뒤의 user_idx 추출
                    }
                    return null;
                }).filter(userIdx => userIdx !== null); // null 값 제거
        
                // 중복 여부 체크: 해당 팀에 이미 추가된 user_idx와 드래그된 user_idx 비교
                const duplicateUsers = droppedData.filter(user => teamUserIdxs.includes(user.userIdx));
        
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
        
                const token = localStorage.getItem('accessToken');
        
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/users-add-org',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
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

        let moveNodeTimeout;

        $('#tree-container').off('move_node.jstree').on('move_node.jstree', function (e, data) {
            clearTimeout(moveNodeTimeout); // 이전에 설정된 타임아웃을 초기화
        
            moveNodeTimeout = setTimeout(function () {
                const oldTeamId = data.old_parent; // 이동 전 팀의 ID (org_idx)
                const newTeamId = data.parent; // 이동 후 팀의 ID (move_idx)
        
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
        
                const token = localStorage.getItem('accessToken');
        
                // 서버에 AJAX 요청
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/users-add-org',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
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
                var selectedNode = selectedNodeId ? $('#tree-container').jstree('get_node', selectedNodeId) : '#';

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
                
                $.ajax({
                    url: 'http://safe.withfirst.com:28888/with/add-org',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: formData,
                    processData: false, 
                    contentType: false, 
                    success: function(response) {
                        alert('조직이 성공적으로 추가되었습니다.');
                        console.log('서버 응답:', response);

    

                           // 서버에서 응답으로 받은 id를 새로 추가된 노드에 설정
    $('#tree-container').jstree('set_id', newNode, response.data.id);  // response에서 data.id를 사용하여 jstree에 설정
    
                        loadTreeData();
                        //   // 트리 새로고침 시도
                        //     try {
                        //         console.log('트리 데이터 새로고침을 시작합니다.');
                        //         loadTreeData(function() {
                        //             console.log('트리 데이터가 성공적으로 새로고침되었습니다.');
                        //         });
                        //     } catch (error) {
                        //         console.error('트리 데이터를 새로고침하는 중 오류가 발생했습니다:', error);
                        //     }
                            
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
