axios.get('/chat/'+id)
    .then(res => {
        localStorage.setItem('datn_2019', JSON.stringify(res.data));
    })
    .catch(err => {
        console.log(err);
    });