const account = (username) => {

    const mypromise = new Promise((resolve, reject) => {
        fetch('http://gnexportal.com/graphql', {
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
                    let pb = res.data.account.vsd_balance;

                    let bal = pb.split(" ")[0]

                    resolve(parseFloat(bal))
                }
                else reject({ error: "Could not authenticate" })
            })
    })

    return mypromise;

}

module.exports = { account }
