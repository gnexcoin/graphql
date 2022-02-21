const transfer = (from, wif, to, amount, memo) => {

    const mypromise = new Promise((resolve, reject) => {
        fetch('http://gnexportal.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                {
                    transfer(
                      from: "${from}",
                      wif: "${wif}",
                      to: "${to}",
                      amount: "${amount}",
                      memo: "${memo}"  
                    ){
                      result
                      transaction_id
                    }
                  }`
            }),
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.data && res.data.transfer !== null) {
                    resolve(res.data.transfer.result)
                }
                else resolve(false)
            }).catch(e => console.log(e.message))
    })

    return mypromise;

}

module.exports = { transfer }
