axios.get('/chat/'+id)
    .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data));
    })
    .catch(err => {
        console.log(err);
    });
