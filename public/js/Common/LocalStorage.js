function setLocal(data) {
    localStorage.setItem('datn_2020', JSON.stringify(data));
}

/**
 * @return {string}
 */
function getLocal() {
    let retrievedLocal = localStorage.getItem('datn_2020');
    return !!retrievedLocal ? JSON.parse(retrievedLocal) : null;
}