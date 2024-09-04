let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";
let selectedRows = []; // 선택된 행을 저장할 배열

document.addEventListener('DOMContentLoaded', () => {
    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

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
    const url = `http://192.168.0.18:28888/with/users-view-org?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    makeRequest('get', url)
        .then(response => {
            const data = response.data.data;
            users = data;
            totalPage = response.data.total_page || 1;

            console.log('사용자목록',users);

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

$(document).ready(function() {
    let selectedNodeId = null;

    const token = localStorage.getItem('accessToken');

    $.ajax({
        url: 'http://192.168.0.18:28888/with/view-org',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        dataType: 'json',
        success: function(response) {
            console.log('조직도목록',response);
            console.log('조직도목록',response.data);
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
                        "icon": "./images/team.svg" // 팀 노드에 사용할 아이콘 경로
                    },
                    "member": {
                        "icon": "./images/user.svg" // 멤버 노드에 사용할 아이콘 경로
                    }
                },
                'state': {
                    'key': 'unique_key' // 트리 상태를 저장할 고유 키
                },
                'multiple': true,
                'contextmenu': {
                    'items': function(node) {
                        return {
                            "rename": {
                                "label": "Rename",
                                "action": function () {
                                    $('#tree-container').jstree('edit', node);
                                }
                            },
                            "remove": {
                                "label": "Delete",
                                "action": function () {
                                    $('#tree-container').jstree('delete_node', node);
                                }
                            }
                        };
                    }
                }
            }).on('loaded.jstree', function() {
                // type이 'team'인 노드에 'jsteam' 클래스 추가
                $('#tree-container').jstree(true).get_json('#', { 'flat': true }).forEach(function(node) {
                    if (node.type === 'team') {
                        $('#' + node.id + '_anchor').addClass('jsteam');
                    }
                });
            });
    
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

            // 노드 더블 클릭 시 수정 모드로 전환
            $('#tree-container').on('dblclick', '.jstree-anchor', function(e) {
                var nodeId = $(this).closest('li').attr('id');
                $('#tree-container').jstree('edit', nodeId);
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
                    // 삭제할 노드 정보를 JSON 형식으로 준비
                    const deleteData = selectedNodeIds.map(function(nodeId) {
                        const node = $('#tree-container').jstree('get_node', nodeId);
                        return {
                            id: node.id,
                            text: node.text
                        };
                    });

                    // jstree에서 선택된 모든 노드 삭제
                    selectedNodeIds.forEach(function(nodeId) {
                        $('#tree-container').jstree('delete_node', nodeId);
                    });

                    // 서버에 삭제 요청 보내기
                    $.ajax({
                        url: 'http://192.168.0.18:28888/with/del-org', // 서버의 삭제 API URL
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        contentType: 'application/json', // JSON 형식으로 전송
                        data: JSON.stringify(deleteData), // JSON 데이터를 문자열로 변환하여 전송
                        success: function(response) {
                            alert('조직이 성공적으로 삭제되었습니다.');
                            console.log('서버 응답:', response);
                            selectedNodeIds = []; // 삭제 후 선택된 노드 ID 배열 초기화
                        },
                        error: function(xhr, status, error) {
                            alert('조직 삭제에 실패했습니다.');
                            console.error('서버 오류:', status, error);
                        }
                    });
                } else {
                    alert('삭제할 노드를 선택하세요');
                }
            });
    
            $('#tree-container').on('dragover', function(e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
            });
    
            $('#tree-container').on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
    
                const data = e.originalEvent.dataTransfer.getData('text/plain');
                console.log('Data retrieved from dataTransfer:', data);
    
                try {
                    const droppedData = JSON.parse(data);
                    const targetNode = $('#tree-container').jstree('get_node', e.target);

                    if (!targetNode || targetNode.type !== "team") {
                        alert("사용자는 팀 노드에만 추가할 수 있습니다.");
                        return;
                    }

                    console.log(droppedData);

                    // user_idx 배열을 생성
                    const userIdxArray = droppedData.map(user => user.userIdx);

                    // 서버에 user_idx와 org_idx를 POST 요청으로 전송
                    const formData = new FormData();
                    formData.append('user_datas', JSON.stringify(userIdxArray)); // user_idx 배열을 문자열로 변환하여 전송
                    formData.append('org_idx', targetNode.id); // 드랍된 조직의 ID (targetNode의 ID)

                    for (let pair of formData.entries()) {
                        console.log(`${pair[0]}: ${pair[1]}`);
                    }
                    const token = localStorage.getItem('accessToken');

                    $.ajax({
                        url: 'http://192.168.0.18:28888/with/users-add-org',
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
            
                            //jsTree에 사용자를 새로운 노드로 추가
                            droppedData.forEach(user => {
                                const randomId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // 고유한 랜덤 ID 생성
                                
                                $('#tree-container').jstree().create_node(targetNode, {
                                    "text": user.userName,
                                    "id": randomId,
                                    "type": "member",
                                });

                                    // 추가한 노드가 실제로 존재하는지 확인
    const addedNode = $('#tree-container').jstree().get_node(user.userIdx);
    
    if (addedNode) {
        console.log(`User ${user.userName} with ID ${user.userIdx} was successfully added to jsTree.`);
    } else {
        console.error(`Failed to add user ${user.userName} with ID ${user.userIdx} to jsTree.`);
    }
            
                                //테이블에서 해당 사용자 제거 (선택 사항)
                                $(`#userTableBody tr`).filter(function() {
                                    return $(this).find('td[data-user-idx]').data('user-idx') === user.userIdx;
                                }).remove();
                            });
                        },
                        error: function(xhr, status, error) {
                            alert('사용자를 조직에 추가하는 데 실패했습니다.');
                            console.error('서버 오류:', status, error);
                        }
                    });
    

                    // // 여러 사용자 정보를 jsTree에 새로운 노드로 추가
                    // droppedData.forEach(user => {
                    //     $('#tree-container').jstree().create_node(targetNode, {
                    //         "text": user.userName,
                    //         "id": "user_" + user.userId,
                    //         "type": "member"
                    //     });

                    //     // 테이블에서 해당 사용자 제거 (선택 사항)
                    //     $(`#userTableBody tr`).filter(function() {
                    //         return $(this).find('td[data-user-id]').data('user-id') === user.userId;
                    //     }).remove();
                    // });

                } catch (err) {
                    console.error('Failed to parse JSON:', err);
                }
            });

            // 조직 추가 기능
            $('#addTeam').on('click', function() {
                var selectedNode = selectedNodeId ? $('#tree-container').jstree('get_node', selectedNodeId) : '#';

                const newTeamName = "NEW TEAM";
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
                    url: 'http://192.168.0.18:28888/with/add-org',
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
                        $('#tree-container').jstree('set_id', newNode, response.id);
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
        },
        error: function(xhr, status, error) {
            console.error('Failed to load tree data:', status, error);
        }
    });
});
