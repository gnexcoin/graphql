const authorize = (username, wif) => {

    const mypromise = new Promise((resolve, reject) => {
        fetch('http://gnexportal.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                        { 
                            auth_active(username: "${username}", wif: "${wif}") 
                            { 
                                authenticated 
                            }
                        }`
            }),
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.data && res.data.auth_active !== null) {
                    let pb = res.data.auth_active.authenticated;
                    resolve(pb)
                }
                else reject({ error: "Could not authenticate" })
            })
    })

    return mypromise;

}

module.exports = { authorize }
