let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";


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

// 쿠키에서 특정 값을 가져오는 함수
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 사용자 데이터 불러오기
function loadUserData(page = 1) {
    currentPage = page;
    localStorage.setItem('currentPage', currentPage); // 현재 페이지 저장
    const url = `http://192.168.0.18:28888/with/users?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    makeRequest('get', url)
        .then(response => {
            const data = response.data.data;
            users = data;
            totalPage = response.data.total_page || 1;

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
            <td>${user.phone_number}</td>
            <td>${user.c_name}</td>
            <td>${user.user_rank}</td>
            <td>${user.user_position}</td>
        `;
        tableBody.appendChild(row);

             // 각 행에 클릭 이벤트 추가
             row.setAttribute('draggable', true);  // 드래그 가능하도록 설정
             row.addEventListener('dragstart', function(e) {
                 const userName = this.querySelector('td[data-user-name]').dataset.userName;
                 const userId = this.querySelector('td[data-user-id]').dataset.userId;

                 const userData = JSON.stringify({ userName, userId });
     
                 console.log('Storing user data in dataTransfer:', userData);

                 e.dataTransfer.setData('text/plain', userData);
             

        console.log('User Name:', userName);
        console.log('User ID:', userId);
    });

    });



    // addEventListeners();
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

    // 조직도 데이터 초기화
    $.getJSON('tree.json', function(data) {
        $('#tree-container').jstree({
            'core': {
                'check_callback': true,
                'data': data
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

      // 노드 더블 클릭 시 수정 모드로 전환
      $('#tree-container').on('dblclick', '.jstree-anchor', function(e) {
        var nodeId = $(this).closest('li').attr('id');
        $('#tree-container').jstree('edit', nodeId);
    });

        // 노드 삭제 기능
        $('#deleteNode').on('click', function() {
            if (selectedNodeId) {
                $('#tree-container').jstree('delete_node', selectedNodeId);
                selectedNodeId = null; // 삭제 후 선택된 노드 ID 초기화
            } else {
                alert("삭제할 노드를 선택하세요.");
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
                const userId = droppedData.userId;
                const userName = droppedData.userName;

                var targetNode = $('#tree-container').jstree('get_node', e.target);

                if (!targetNode || targetNode.type !== "team") {
                    alert("사용자는 팀 노드에만 추가할 수 있습니다.");
                    return;
                }

                // 사용자 정보를 jsTree에 새로운 노드로 추가
                $('#tree-container').jstree().create_node(targetNode, {
                    "text": userName,
                    "id": "user_" + userId,
                    "type": "member"
                });

              // 테이블에서 해당 사용자 제거
                $(`#userTableBody tr`).filter(function() {
                    return $(this).find('td[data-user-id]').data('user-id') === userId;
                }).remove();

            } catch (err) {
                console.error('Failed to parse JSON:', err);
            }
        });

        $('#addTeam').on('click', function() {
            // 선택된 노드를 가져옵니다
            var selectedNode = $('#tree-container').jstree('get_node', selectedNodeId);
        
            // 선택된 노드가 없거나, 선택된 노드가 'team' 타입인 경우에만 조직을 추가
            if (!selectedNode || selectedNode.type === "team") {
                // 선택된 노드가 팀 노드일 경우, 자식 노드(팀원)가 있는지 확인
                if (selectedNode && selectedNode.children.length > 0) {
                    alert("해당 팀에 팀원이 있어서 조직을 추가할 수 없습니다.");
                    return; // 조직 추가 중단
                }
        
                var newTeamNode = {
                    "text": "New Team",
                    "type": "team",
                    "id": "team_node_" + (new Date().getTime()),
                    "state": { "opened": true }
                };
        
                // 선택된 노드가 없으면 최상위 노드로 추가, 그렇지 않으면 선택된 팀 노드 아래에 추가
                var parentNodeId = selectedNode && selectedNode.type === 'team' ? selectedNodeId : '#';
        
                $('#tree-container').jstree().create_node(parentNodeId, newTeamNode, "last", function(new_node) {
                    $('#tree-container').jstree('edit', new_node);
                });
        
                // 노드 추가 후 선택 해제
                $('#tree-container').jstree('deselect_all');
                selectedNodeId = null;
            } else {
                alert("조직은 팀 노드에서만 추가할 수 있습니다.");
            }
        });

    });

    $(document).on('click', function(event) {
        if (!$(event.target).closest('#tree-container').length) {
            $('#tree-container').jstree('deselect_all');
        }
    });
});