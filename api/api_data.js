const api_link = "https://api.voilk.com";
const axios    = require('axios');

const methods = {
    getDynamicGlobalProperties: {
        method: "condenser_api.get_dynamic_global_properties",
        params: "[]"
    },
    getAccountBandWidthMarket: {
        method: "condenser_api.get_account_bandwidth",
        params: "[\"bilalhaider\",\"market\"]"
    },
    getAccountBandWidthForum: {
        method: "condenser_api.get_account_bandwidth",
        params: "[\"bilalhaider\",\"forum\"]"
    },
    getAccountHistory: {
        method: "condenser_api.get_account_history",
        params: "[\"bilalhaider\", -1, 2]"
    },
    getAccountReputations: {
        method: "condenser_api.get_account_reputations",
        params: "[\"bilalhaider\", 1]"
    },
    getAccountVotes: {
        method: "condenser_api.get_account_votes",
        params: "[\"bilalhaider\"]"
    },
    getAccount: {
        method: "condenser_api.get_accounts",
        params:"[[\"bilalhaider\"]]"
    },
    getAccounts: {
        method: "condenser_api.get_accounts",
        params:"[[\"bilalhaider\"]]"
    },
    getAccountCount: {
        method: "condenser_api.get_account_count",
        params: "[]"
    },
    getBlock: {
        method: "condenser_api.get_block",
        params: "[1]"
    },
    getBlockHeader: {
        method: "condenser_api.get_block_header",
        params: "[1]"
    },
    getBlog: {
        method: "condenser_api.get_blog",
        params: "[\"bilalhaider\",-1,5]"
    },
    getBlogAuthors: {
        method: "condenser_api.get_blog_authors",
        params: "[\"bilalhaider\"]"
    },
    getBlogEntries: {
        method: "condenser_api.get_blog_entries",
        params: "[\"bilalhaider\",0,5]"
    },
    getActiveVotes: {
        method: "condenser_api.get_active_votes",
        params: "[\"bilalhaider\", \"es6-javascript-cheat-sheet\"]"
    },
    getActiveWitnesses: {
        method: "condenser_api.get_active_witnesses",
        params: "[]"
    },
    getChainProperties: {
        method: "condenser_api.get_chain_properties",
        params: "[]"
    },
    getCurrentMedianHistoryPrice: {
        method: "condenser_api.get_current_median_history_price",
        params: "[]"
    },
    getCommentDiscussionsByPayout: {
        method: "condenser_api.get_comment_discussions_by_payout",
        params: "[{\"tag\":\"voilk\",\"limit\":1}]"
    },
    getConfig: {
        method: "condenser_api.get_config",
        params: "[]"
    },
    getContent: {
        method: "condenser_api.get_content",
        params: "[\"bilalhaider\", \"es6-javascript-cheat-sheet\"]"
    },
    getContentReplies: {
        method: "condenser_api.get_content_replies",
        params: "[\"bilalhaider\", \"es6-javascript-cheat-sheet\"]"
    },
    getConversionRequests: {
        method: "condenser_api.get_conversion_requests",
        params: "[1]"
    },
    getActiveDiscussion: {
        method: "condenser_api.get_discussions_by_active",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByAuthorBeforeDate: {
        method: "condenser_api.get_discussions_by_author_before_date",
        params: "[\"bilalhaider\",\"es6-javascript-cheat-sheet\",\"2018-12-16T22:49:43\",1]"
    },
    getDiscussionsByBlog: {
        method: "condenser_api.get_discussions_by_blog",
        params: "[{\"tag\":\"photography\",\"limit\":1}]"
    },
    getDiscussionsByCashout: {
        method: "condenser_api.get_discussions_by_cashout",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByChildern: {
        method: "condenser_api.get_discussions_by_children",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByComments: {
        method: "condenser_api.get_discussions_by_comments",
        params: "[{\"start_author\":\"bilalhaider\",\"start_permlink\":\"es6-javascript-cheat-sheet\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByCreated: {
        method: "condenser_api.get_discussions_by_created",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByFeed: {
        method: "condenser_api.get_discussions_by_feed",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByPopular: {
        method: "condenser_api.get_discussions_by_hot",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByPromoted: {
        method: "condenser_api.get_discussions_by_promoted",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByTrending: {
        method: "condenser_api.get_discussions_by_trending",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getDiscussionsByVotes: {
        method: "condenser_api.get_discussions_by_votes",
        params: "[{\"tag\":\"photography\",\"limit\":10,\"truncate_body\":0}]"
    },
    getEscrow: {
        method: "condenser_api.get_escrow",
        params: "[\"bilalhaider\", 1]"
    },
    getExpiringDelegations: {
        method: "condenser_api.get_expiring_vesting_delegations",
        params: "[\"voilk\",\"2018-12-19T00:00:00\"]"
    },
    getFeed: {
        method: "condenser_api.get_feed",
        params: "[\"bilalhaider\",0,1]"
    },
    getFeedEntries: {
        method: "condenser_api.get_feed_entries",
        params: "[\"bilalhaider\",0,1]"
    },
    getFeedHistory: {
        method: "condenser_api.get_feed_history",
        params: "[]"
    },
    getFollowCount: {
        method: "condenser_api.get_follow_count",
        params: "[\"bilalhaider\"]"
    },
    getFollowers: {
        method: "condenser_api.get_followers",
        params: "[\"bilalhaider\",null,\"blog\",10]"
    },
    getMutes: {
        method: "condenser_api.get_followers",
        params: "[\"bilalhaider\",null,\"ignore\",10]"
    },
    getFollowing: {
        method: "condenser_api.get_following",
        params: "[\"bilalhaider\",null,\"blog\",10]"
    },
    getIgnored: {
        method: "condenser_api.get_following",
        params: "[\"bilalhaider\",null,\"ignore\",10]"
    },
    getHardForkVersion: {
        method: "condenser_api.get_hardfork_version",
        params: "[]"
    },
    getKeyReferences: {
        method: "condenser_api.get_key_references",
        params: "[[\"SHR5NtYEdtSmUpoYkNVhRPrT4VEyD6pWSuyHuPcBKdEpVcyr2fKPF\"]]"
    },
    getMarketHistory: {
        method: "condenser_api.get_market_history",
        params: "[15,\"2018-01-01T00:00:00\",\"2018-12-17T00:00:00\"]"
    },
    getMarketHistoryBuckets: {
        method: "condenser_api.get_market_history_buckets",
        params: "[]"
    },
    getScheduledHardFork: {
        method: "condenser_api.get_next_scheduled_hardfork",
        params: "[]"
    },
    getOpenOrders: {
        method: "condenser_api.get_open_orders",
        params: "[\"bilalhaider\"]"
    },
    getOperationsInBlock: {
        method: "condenser_api.get_ops_in_block",
        params: "[10,true]"
    },
    getOrderBook: {
        method: "condenser_api.get_order_book",
        params: "[50]"
    },
    getOwnerHistory: {
        method:"condenser_api.get_owner_history",
        params:"[\"bilalhaider\"]"
    },
    getPostDiscussionsByPayout: {
        method:"condenser_api.get_post_discussions_by_payout",
        params:"[{\"tag\":\"bilalhaider\",\"limit\":1,\"truncate_body\":0}]"
    },
    getRebloggedBy: {
        method:"condenser_api.get_reblogged_by",
        params:"[\"bilalhaider\",\"firstpost\"]"
    },
    getRecentTrades: {
        method:"condenser_api.get_recent_trades",
        params:"[10]"
    },
    getRecoveryRequest: {
        method:"condenser_api.get_recovery_request",
        params:"[\"bilalhaider\"]"
    },
    getRepliesByLastUpdate: {
        method:"condenser_api.get_replies_by_last_update",
        params:"[\"bilalhaider\",\"firstpost\",1]"
    },
    getRewardFund: {
        method: "condenser_api.get_reward_fund",
        params: "[\"post\"]"
    },
    getSavingsWithdrawFrom: {
        method:"condenser_api.get_savings_withdraw_from",
        params: "[\"bilalhaider\"]"
    },
    getSavingsWithdrawTo: {
        method:"condenser_api.get_savings_withdraw_to",
        params:"[\"bilalhaider\"]"
    },
    getState: {
        method: "condenser_api.get_state",
        params:"[\"/@bilalhaider\"]"
    },
    getTagsUsedByAuthor: {
        method:"condenser_api.get_tags_used_by_author",
        params: "[\"bilalhaider\"]"
    },
    getTicker: {
        method:"condenser_api.get_ticker",
        params:"[]"
    },
    getTradeHistory: {
        method:"condenser_api.get_trade_history",
        params: "[\"2018-01-01T00:00:00\",\"2018-12-17T00:00:00\",10]"
    },
    getTransaction: {
        method:"condenser_api.get_transaction",
        params:"[\"6fde0190a97835ea6d9e651293e90c89911f933c\"]"
    },
    getTransactionHex: {
        method:"condenser_api.get_transaction_hex",
        params:"[]"
    },
    getTrendingTags: {
        method:"condenser_api.get_trending_tags",
        params:"[null,36]"
    },
    getVersion: {
        method:"condenser_api.get_version",
        params:"[]"
    },
    getVestingDelegations: {
        method:"condenser_api.get_vesting_delegations",
        params: "[\"bilalhaider\",null,10]"
    },
    getVolume: {
        method:"condenser_api.get_volume",
        params: "[]"
    },
    getOutGoingWithdrawRoutes: {
        method:"condenser_api.get_withdraw_routes",
        params:"[\"bilalhaider\",\"outgoing\"]"
    },
    getIncomingWithdrawRoutes: {
        method:"condenser_api.get_withdraw_routes",
        params:"[\"bilalhaider\",\"incoming\"]"
    },
    getAllWithdrawRoutes: {
        method:"condenser_api.get_withdraw_routes",
        params:"[\"bilalhaider\",\"all\"]"
    },
    getWitnessByAccount: {
        method:"condenser_api.get_witness_by_account",
        params:"[\"bilalhaider\"]"
    },
    getWitnessCount: {
        method:"condenser_api.get_witness_count",
        params:"[]"
    },
    getWitnessSchedule: {
        method:"condenser_api.get_witness_schedule",
        params:"[]"
    },
    getWitnesses: {
        method:"condenser_api.get_witnesses",
        params:"[[1]]"
    },
    getWitnessesByVote: {
        method:"condenser_api.get_witnesses_by_vote",
        params:"[null, 21]"
    },
    lookUpAccountNames: {
        method:"condenser_api.lookup_account_names",
        params:"[[\"bilalhaider\"]]"
    },
    lookUpAccounts: {
        method:"condenser_api.lookup_accounts",
        params:"[\"b\",10]"
    },
    lookUpWitnessAccounts: {
        method:"condenser_api.lookup_witness_accounts",
        params:"[\"b\",10]"
    },
    verifyAccountAuthority: {
        method:"condenser_api.verify_account_authority",
        params:"[\"bilalhaider\",[\"SHR4zzL6gvnajH6NH95s5z8JDdecHsPHd8rNzdraTiehkFGq7mjMb\"]]"
    },
    verifyAuthority: {
        method:"condenser_api.verify_authority",
        params: "[]"
    },
    getAccountReferrences: {
        method: "condenser_api.get_account_references",
        params: "[\"bilalhaider\"]"
    },
    getApiKeyReferences: {
        method:"account_by_key_api.get_key_references",
        params:"{\"keys\":[\"SHR4zzL6gvnajH6NH95s5z8JDdecHsPHd8rNzdraTiehkFGq7mjMb\"]}"
    },
    getApiAccountHistory: {
        method:"account_history_api.get_account_history",
        params:"{\"account\":\"bilalhaider\", \"start\":-1, \"limit\":100}"
    },
    getApiVirtualOperationsInBlock: {
        method:"account_history_api.get_ops_in_block",
        params:"{\"block_num\":1,\"only_virtual\":true}"
    },
    getApiOperationsInBlock: {
        method:"account_history_api.get_ops_in_block",
        params:"{\"block_num\":1,\"only_virtual\":false}"
    },
    getApiTransaction: {
        method:"account_history_api.get_transaction",
        params:"{\"id\":\"6fde0190a97835ea6d9e651293e90c89911f933c\"}"
    },
    login: {
        method: "login_api.login",
        params: "[\"username\", \"password\"]"
    }
}

voilk = (method, params="[]", single) => {
        let querydata = '{\"jsonrpc\":\"2.0\", \"method\":\"' + method + '\", \"params\":'+ params +', \"id\":1}';
        //console.log("Method: ", method," :::: Params:", params);

        return axios.get(api_link, {
            data: querydata
        })
        .then(function (response) {

            if( method==methods.getAccountBandWidthForum.method ||
                method==methods.getAccountBandWidthMarket.method ||
                method==methods.getDynamicGlobalProperties.method ||
                method==methods.getBlockHeader.method ||
                method==methods.getBlogAuthors.method ||
                method==methods.getBlogEntries.method ||
                method==methods.getActiveVotes.method ||
                method==methods.getChainProperties.method ||
                method==methods.getFeedHistory.method ||
                method==methods.getVersion.method ||
                method==methods.getCurrentMedianHistoryPrice.method||
                method==methods.getTrendingTags.method||
                method==methods.getRebloggedBy.method
            ) {
                //console.log(response.data.result);
                return (response.data.result);
            }
            else if(method==methods.getBlock.method){
                let block = JSON.parse(params);
                let ndata = response.data.result;
                ndata.height = block[0];
                ndata.transactions_count = ndata.transactions.length;
                //console.log(ndata);
                return (ndata);
            }
            else if (method==methods.getAccountHistory.method)
            {
                let historyentities = response.data.result;
                let newData = historyentities.map(item => {
                    let temp = item;
                    item[0] = {block_number: temp[0]};
                    item[1] = {transaction: temp[1]};
                    item[1].transaction.op = { name :  temp[1].transaction.op[0], opdetail :  JSON.stringify(temp[1].transaction.op[1])};
                    return item;
                });
                let nData = newData.map(dataitem => {
                    let temp = dataitem;
                    dataitem = { block: temp[0], detail: temp[1]}
                    return dataitem
                })
                //console.log(nData);
                return nData;
            }
            else if(method==methods.getAccountVotes.method){
                let votes_data = response.data.result;
                let newdata = votes_data.map(vote => {
                    let temp = vote;
                    let splitter = temp.authorperm.split('/');
                    vote = {
                        account: splitter[0],
                        permlink: splitter[1],
                        authorperm: temp.authorperm,
                        weight: temp.weight,
                        rshares: temp.rshares,
                        percent: temp.percent,
                        time: temp.time
                    };
                    return vote;
                })
                //console.log(newdata);
                return newdata;
            }
            else if(method==methods.getAccountCount.method ||
                    method==methods.getWitnessCount.method
            ){
                let count = response.data.result;
                count = {count: count};
                //console.log(count);
                return count;
            }
            else if(method==methods.getBlog.method){
                let data = response.data.result;
                let newData = data.map(d => {
                    if(d.entry_id != 0) return d;
                });
                let filtered = newData.filter(x => {return x!=null});
                //console.log(filtered);
                return filtered;
            }
            else if(method==methods.getActiveWitnesses.method){
                let data = response.data.result;
                let filtered = data.filter(x => {return x!=''});
                let newData = filtered.map(d => {
                    let tmp = d;
                    d = {name: tmp};
                    return d;
                });
                //console.log(newData);
                return newData;
            }
            else if(method==methods.getAccount.method&&single==1){
                let ndata = response.data.result[0];
                
                if(ndata.json_metadata=='')
                {
                    ndata.json_metadata = '{"profile":{"profile_image":"https://graphql.voilk.com/image/e40fee86e46168b14e0f048f7c236829.jpeg","cover_image":"https://cdn.pixabay.com/photo/2015/10/17/20/03/voilk-993221_960_720.jpg","name":"Anonymous","about":"I am Anonymous","location":"Antarctica","website":"https://voilk.com"}}'
                }
                let profile = JSON.parse(ndata.json_metadata);

                if(!profile.profile.profile_image || 
                    profile.profile.profile_image == "" || 
                    profile.profile.profile_image == "https://image.flaticon.com/icons/svg/1372/1372315.svg")
                {
                    profile.profile.profile_image = "https://graphql.voilk.com/image/e40fee86e46168b14e0f048f7c236829.jpeg"

                }
                ndata.json_metadata = profile.profile;
                //console.log(ndata);
                return ndata;
            }
            else if(method==methods.getAccounts.method){
                let newData = []

                newData = response.data.result.map(data => {
                    let ndata = data;
                
                    if(ndata.json_metadata=='')
                    {
                        ndata.json_metadata = '{"profile":{"profile_image":"https://graphql.voilk.com/image/e40fee86e46168b14e0f048f7c236829.jpeg","cover_image":"https://cdn.pixabay.com/photo/2015/10/17/20/03/voilk-993221_960_720.jpg","name":"Anonymous","about":"I am Anonymous","location":"Antarctica","website":"https://voilk.com"}}'
                    }
                    let profile = JSON.parse(ndata.json_metadata);
                    if(!profile.profile.profile_image || profile.profile.profile_image == "" || profile.profile.profile_image == "https://image.flaticon.com/icons/svg/1372/1372315.svg")
                    {
                        profile.profile.profile_image = "https://graphql.voilk.com/image/e40fee86e46168b14e0f048f7c236829.jpeg"
                        
                    }
                    ndata.json_metadata = profile.profile;
                    return ndata;
                })

                //console.log(newData)
                //console.log(ndata);
                return newData;
            }
            else{
                //console.log(response.data.result);
                return (response.data.result[0]);
            }
        })
        .catch(function (error) {
            //console.log(error);
        });

};

module.exports.voilk = voilk;
module.exports.methods = methods;