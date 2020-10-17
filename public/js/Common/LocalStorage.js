function setLocal(data) {
    localStorage.setItem('user', JSON.stringify(data));
}

/**
 * @return {string}
 */
function getLocal() {
    let retrievedLocal = localStorage.getItem('user');
    return !!retrievedLocal ? JSON.parse(retrievedLocal) : null;
}
