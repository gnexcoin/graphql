const books = [
    {name: "Hello jolly", genre: "Fantasy", id: '1', authorid: '1'},
    {name: "Bazm e ghalib", genre: "Poetry", id: '2', authorid: '2'},
    {name: "Crops of Rice", genre: "Fantasy", id: '3', authorid: '1'},
    {name: "Prince of Persia", genre: "Fantasy", id: '4', authorid: '1'},
    {name: "Keeter petter", genre: "Fantasy", id: '5', authorid: '3'},
    {name: "Teen batta Teen", genre: "Poetry", id: '6', authorid: '3'},
    {name: "Love is life", genre: "Fantasy", id: '7', authorid: '1'},
];
module.exports.books = books;

const authors = [
    {name: "Ghalib", age: 21, id: '1'},
    {name: "Bilal", age: 20, id: '2'},
    {name: "Timmy Johns", age: 19, id: '3'},
    {name: "John Mcafee", age: 19, id: '4'},
    {name: "Gordon Brown", age: 19, id: '5'},
    {name: "Terra White", age: 19, id: '6'}
];
module.exports.authors = authors;

const market_bandwidth_data = [
    {id: "224",
    account: 'bilalhaider',
    type: 'market',
    average_bandwidth: '30698970120',
    lifetime_bandwidth: '428450000000',
    last_bandwidth_update: '2018-12-17T16:57:09'}
];
module.exports.market_bandwidth_data = market_bandwidth_data;

const forum_bandwidth_data = [
    { id: 2,
        account: 'bilalhaider',
        type: 'forum',
        average_bandwidth: '23346287089',
        lifetime_bandwidth: '178145000000',
        last_bandwidth_update: '2018-12-17T17:37:57' }
];

module.exports.forum_bandwidth_data = forum_bandwidth_data;

const dynamic_properties = [
    {   head_block_number: 1432781,
        head_block_id: '0015dccd2628570b418c3f49610f31049d100905',
        time: '2018-12-17T21:11:33',
        current_witness: 'bilalhaider',
        total_pow: '18446744073709551615',
        num_pow_witnesses: 0,
        virtual_supply: '504776348.320 VOILK',
        current_supply: '504377192.330 VOILK',
        confidential_supply: '0.000 VOILK',
        current_vsd_supply: '79831.198 VSD',
        confidential_vsd_supply: '0.000 VSD',
        total_coining_fund_voilk: '4489781.007 VOILK',
        total_coining_shares: '4489780.202476 COINS',
        total_reward_fund_voilk: '400809.575 VOILK',
        total_reward_shares2: '5672484014512502366891453',
        pending_rewarded_coining_shares: '0.000000 COINS',
        pending_rewarded_coining_voilk: '0.000 VOILK',
        vsd_interest_rate: 1000,
        vsd_print_rate: 10000,
        maximum_block_size: 1310722,
        current_aslot: 28748631,
        recent_slots_filled: '340282366920938463463374607431768211455',
        participation_count: 128,
        last_irreversible_block_num: 1432781,
        vote_power_reserve_rate: 40,
        delegation_return_period: 604800,
        reverse_auction_seconds: 1800,
        vsd_stop_percent: 500,
        vsd_start_percent: 200,
        average_block_size: 123,
        current_reserve_ratio: 200000000,
        max_virtual_bandwidth: '5284831104000000000000' }

];

module.exports.dynamic_properties = dynamic_properties;

const account_reputation = [ { account: 'bilalhaider', reputation: 922713121 } ];
module.exports.account_reputation = account_reputation;

const account_votes = [
    {
        authorperm:'bilalhaider/creating-a-simple-javascript-api-for-voilk',
        weight: '598370091308399',
        rshares: 1236111420,
        percent: 10000,
        time: '2018-12-17T16:38:51'
    }
];

module.exports.account_votes = account_votes;


const account_data = [ { id: 4,
    name: 'bilalhaider',
    owner:{
        weight_threshold: 1,
        account_auths: [],
        key_auths: [
            [ 'SHR5Z1gfHpcSqWgPwWJbza1dLAeaeJJVyxKKEkpPjwAm6LgHeuE1k', 1 ]
        ]
    }
    ,
    active:
        {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [
                [ 'SHR4zzL6gvnajH6NH95s5z8JDdecHsPHd8rNzdraTiehkFGq7mjMb', 1 ]
            ]
        },
    posting:
        {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [
                [ 'SHR5AvGUF8VDjjdfAhiptAV267uzLpguk9G9Lorh5qe7JYEP8gehM', 1 ]
            ]
        },
    memo_key: 'SHR5C1igT8F6S9Te2ErP6afnxK5wRcLXNkcueQdCBL2wDhFS2c6wM',
    json_metadata:
        '{"profile":{"cover_image":"http://3.bp.blogspot.com/-n2qZL_omLyE/V5fBsy8yAeI/AAAAAAAADAw/Af-1GdnE67AZRj9snjPV0V6a2Yx0vHPVgCK4B/s1600/13775858_1691189714466823_5977384118156671427_n.jpg","name":"Bilal Haider","about":"I am programmer","location":"Pakistan","website":"https://voilk.com","profile_image":"https://i.imgur.com/exjaD27.jpg"}}',
    proxy: '',
    last_owner_update: '2018-11-04T11:41:39',
    last_account_update: '2018-12-08T12:52:24',
    created: '2018-10-16T12:33:54',
    mined: false,
    recovery_account: 'voilk',
    last_account_recovery: '1970-01-01T00:00:00',
    reset_account: 'null',
    comment_count: 0,
    lifetime_vote_count: 0,
    post_count: 113,
    can_vote: true,
    voting_manabar: { current_mana: 9903, last_update_time: 1545064878 },
    voting_power: 9903,
    balance: '0.000 VOILK',
    savings_balance: '0.000 VOILK',
    vsd_balance: '3.250 VSD',
    vsd_seconds: '63087948168',
    vsd_seconds_last_update: '2018-12-17T16:57:09',
    vsd_last_interest_payment: '2018-11-24T00:19:54',
    savings_vsd_balance: '0.000 VSD',
    savings_vsd_seconds: '160826577483',
    savings_vsd_seconds_last_update: '2018-11-26T19:55:03',
    savings_vsd_last_interest_payment: '2018-11-26T05:00:12',
    savings_withdraw_requests: 0,
    reward_vsd_balance: '0.000 VSD',
    reward_voilk_balance: '0.000 VOILK',
    reward_coining_balance: '0.000000 COINS',
    reward_coining_voilk: '0.000 VOILK',
    coining_shares: '254456.276903 COINS',
    delegated_coining_shares: '0.000000 COINS',
    received_coining_shares: '0.000000 COINS',
    coining_withdraw_rate: '0.000000 COINS',
    next_coining_withdrawal: '1969-12-31T23:59:59',
    withdrawn: 0,
    to_withdraw: 0,
    withdraw_routes: 0,
    curation_rewards: 3877267,
    posting_rewards: 18025415,
    proxied_vsf_votes: [ 0, 0, 0, 0 ],
    witnesses_voted_for: 3,
    last_post: '2018-12-17T17:37:57',
    last_root_post: '2018-12-17T16:35:42',
    last_vote_time: '2018-12-17T16:41:18',
    post_bandwidth: 10000,
    pending_claimed_accounts: 0,
    average_bandwidth: '23346287089',
    lifetime_bandwidth: '178145000000',
    last_bandwidth_update: '2018-12-17T17:37:57',
    average_market_bandwidth: '30698970120',
    lifetime_market_bandwidth: '428450000000',
    last_market_bandwidth_update: '2018-12-17T16:57:09',
    coining_balance: '0.000 VOILK',
    reputation: 922713121,
    transfer_history: [],
    market_history: [],
    post_history: [],
    vote_history: [],
    other_history: [],
    witness_votes: [ 'voilk', 'bilalhaider', 'pro' ],
    tags_usage: [],
    guest_bloggers: [] }
    ];

module.exports.account_data = account_data;



















