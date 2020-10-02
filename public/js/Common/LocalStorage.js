function setLocal(data) {
    localStorage.setItem('datn_2019', JSON.stringify(data));
}

/**
 * @return {string}
 */
function getLocal() {
    let retrievedLocal = localStorage.getItem('datn_2019');
    return !!retrievedLocal ? JSON.parse(retrievedLocal) : null;
}