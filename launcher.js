const nameFilter = document.getElementById('nameFilter');
const dateFilter = document.getElementById('dateFilter');
const sortButton = document.getElementById('sortButton');
const linkList = document.getElementById('linkList');
const listItems = Array.from(linkList.getElementsByTagName('li'));

let sortOrder = 'desc'; // 'desc' for newest to oldest, 'asc' for oldest to newest

function filterLinks() {
    const nameValue = nameFilter.value.toLowerCase();
    const dateValue = dateFilter.value;

    listItems.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        const date = item.getAttribute('data-date');
        
        const nameMatch = name.includes(nameValue);
        const dateMatch = !dateValue || date === dateValue;

        if (nameMatch && dateMatch) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function sortLinks() {
    listItems.sort((a, b) => {
        const dateA = new Date(a.getAttribute('data-date'));
        const dateB = new Date(b.getAttribute('data-date'));

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    // Re-append sorted items to the list
    listItems.forEach(item => linkList.appendChild(item));
}

function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    sortLinks();
}

// Initial sort
sortLinks();

nameFilter.addEventListener('keyup', filterLinks);
dateFilter.addEventListener('change', filterLinks);
sortButton.addEventListener('click', toggleSort);
