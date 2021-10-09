const is_exists = (username) => {

    const mypromise = new Promise((resolve, reject) => {
        fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                        { 
                            account(name: "${username}") 
                            { 
                                vsd_balance 
                            }
                        }`
            }),
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.data && res.data.account !== null) {
                    resolve(true)
                }
                else resolve(false)
            })
    })

    return mypromise;

}

module.exports = { is_exists }