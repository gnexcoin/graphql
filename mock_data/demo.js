

return fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ get_response_of_job(job_id: "'+args.job_id+'") { _id username }}' }),
 })
.then(res => res.json())
.then(res => {
    if(res.data.get_response_of_job!==null)
    {
        let jobID = res.data.get_response_of_job._id;
        let username = res.data.get_response_of_job.username;

    }
    else return {error: "There was an error!!"}
})


return fetch('http://localhost:4000/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ auth_active(username: "'+args.from+'", wif: "'+args.wif+'") { authenticated }}' }),
                         })
                        .then(rest => rest.json())
                        .then(rest => {
                            if(rest.data.auth_active!==null)
                            {
                                let pb = rest.data.auth_active.authenticated;
                                let currentDate = new Date();                  
                                if(pb){
                                    let nRating = new Rating({
                                            _id: rating_id,
                                            from: args.from,
                                            to: args.to,
                                            job_id: args.job_id,
                                            response_id:  args.response_id,
                                            rating: args.rating,
                                            lock: 0,
                                            rating_message: args.message,
                                            created_at: currentDate,
                                            updated_at: currentDate
                                      });
              
                                      return nRating.save();
                                }
                                else return {error: "Could not verify account"};
                            }
                            else return {error: "Invalid account"};
                        })