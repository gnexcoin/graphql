const graphql = require('graphql');
const api     = require('voilk');
let { PrivateKey, key_utils } =  require('voilk/lib/auth/ecc');
const Premium  = require('../data/premium.js');
const User = require("../models/User");
const Advert = require("../models/Advert");
const Coupon = require("../models/Coupon");
const Cashout = require("../models/Cashout");
const Hplan = require("../models/Hplan");
const Profile = require("../models/Profile");
const Job = require("../models/Job");
const Rating = require("../models/Rating");
const Response = require("../models/Response");
const Cost = require("../models/Cost");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const Bitcoin = require("../models/Bitcoin");
const BitcoinCash = require("../models/BitcoinCash");
const Wallet = require("../models/Wallet");
const Ticket = require("../models/Ticket");
const Message = require("../models/Message");
const io = require('socket.io-client');
const { addUser, removeUser, getUser, getUserbyName, getUsersInRoom } = require('../chat/users');
const { addMessage, getMessagesOfRoom } = require('../chat/messages');
const { addNotification, getNotificationOfUser } = require('../chat/notifications');
const assert = require("assert")
const {
    activate_package,
    create_deposit,
    create_withdraw,
    delete_deposit,
    process_transaction,
    reject_transaction,
    add_bad_user,
    remove_bad_user
} = require("./mutationResolvers");
const {
    get_commission_history,
    get_bad_users,
    get_commission_history_p,
    get_customers_history,
    get_customers_history_p,
    get_commissions_data,
    get_commissions_info,
    get_customers_data,
    get_customers_info,
    get_deposit_history,
    get_deposit_history_p,
    get_membership_info,
    get_package_history,
    get_package_history_p,
    get_sales_data,
    get_sales_info,
    get_withdrawal_history,
    get_withdrawal_history_p,
    get_memberships,
    get_deposit_requests,
    get_deposits_stats,
    get_withdrawals_stats,
    get_withdrawal_requests,
    get_board_history
} = require("./queryResolvers");
require('dotenv').config();
require('isomorphic-fetch');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const ENDPOINT = 'https://graphql.voilk.com'
const socket = io(ENDPOINT);
// Verification Schemas
const yup = require('yup');

const profileValidationSchema = yup.object().shape({
    full_name: yup.string().min(3).max(150).required().label("Full Name"),
    about: yup.string().min(3).max(150).required().label("About"),
    profile_image: yup.string().max(150).required().url().label("Profile Photo"),
    cover_image: yup.string().max(150).url().required().label("Cover Photo"),
    phone: yup.number().required().label("Phone"),
    email: yup.string().max(150).email().required().label("Email"),
    intro_video: yup.string().max(150).required().url().label("Intro Video"),
    address1: yup.string().max(150).required().label("Address Line 1"),
    address2: yup.string().max(150).required().label("Address Line 2"),
    city: yup.string().max(150).required().label("City"),
    country: yup.string().max(150).required().label("Country"),
    postal_code: yup.string().max(150).required().label("Postal Code")
})

const ticketValidationSchema = yup.object().shape({
    title: yup.string().min(3).max(150).required()
    .matches(/^[a-zA-Z ]*$/g, "Title can only consist upon letters and spaces")
    .label("Title"),
    message: yup.string().min(3).max(150).required()
    .matches(/^[a-zA-Z0-9 .,'$?<>]*$/gm, "Message can only consist upon letters and spaces")
    .label("Message"),
})

const messageValidationSchema = yup.object().shape({
    message: yup.string().min(3).max(150).required()
    .matches(/^[a-zA-Z0-9 .,'$?<>]*$/gm, "Message can only consist upon letters and spaces")
    .label("Message"),
})

const productValidationSchema = yup.object().shape({
    title: yup.string().min(4).max(100)
        .matches(/^[a-zA-Z ]*$/g, "Product name can only consist upon letters and spaces")
        .required().label("Product Name"),
    category: yup.string().max(50)
        .matches(/^[a-zA-Z ]*$/g, "Category can only consist upon letters and spaces")
        .required().label("Category"),
    subcategory: yup.string().max(50)
        .matches(/^[a-zA-Z ]*$/g, "Sub Category can only consist upon letters and spaces")
        .label("Sub Category"),
    short_description: yup.string().min(4).max(150)
        .matches(/^[a-zA-Z .<>$]*$/gm, "Short description can only consist upon letters, periods(.) and spaces")
        .required().label("Short Description"),
    long_description: yup.string().max(2000)
        .matches(/^[a-zA-Z .<>$]*$/gm, "Long description contains an invalid character")
        .required().label("Long Description"),        
    details: yup.string().required().max(2000)
        .matches(/^[a-zA-Z .<>$]*$/gm, "Details contains an invalid character")
        .label("Details"),
    video_link: yup.string().max(150).label("Video Link"),   
    price: yup
        .number()
        .required()
        .positive()
        .test("validate_price", "Not a valid amount (0.001 Minimum)", val => {
            if (val === undefined) return false
            if (parseFloat(val) == val) {
                let value = val.toString();
                if (value.includes(".")) {
                    let count = value.split(".")[1].length;
                    if (count <= 3) return true
                    else return false
                }
                else return true
            } else return false;
        }).label("Product Price"),
    discount_percentage: yup.number()
        .integer()
        .lessThan(100)
        .test("validate_discount", "Not a valid amount (minimum 0, maximum 99)", val => {
            if (val === undefined) return true
            if (parseFloat(val) == val) {
                if(parseFloat(val)<0) return false
                else return true
            } else return false
        })
        .label("Percentage"),
    shipping_cost: yup
        .number()
        .test("validate_price", "Not a valid amount (0.001 Minimum)", val => {
            if (val === undefined) return true
            if (parseFloat(val) == val) {
                if(parseFloat(val)<0) return false
                else{
                    let value = val.toString();
                    if (value.includes(".")) {
                        let count = value.split(".")[1].length;
                        if (count <= 3) return true
                        else return false
                    }
                    else return true
                }
            } else return false;
        }).label("Shipping Cost"),
   available_quantity: yup.number()
        .integer()
        .required()
        .positive()
        .moreThan(0, "Must sell at least 1 item")
        .label("Available Quantity"),
   brand: yup.string().min(4).max(100)
        .matches(/^[a-zA-Z ]*$/g, "Product Brand can only consist upon letters and spaces")
        .label("Brand"),
   attain_options: yup.string().required()
        .label("Delivery Options"),
   tags: yup.string().required().min(3).max(100)
        .matches(/^[a-zA-Z ]*$/g, "Tags can only consist upon letters and spaces")
        .label("Tags"),
   image1: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image1"),
    image2: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image2"),
    image3: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image3"),
    image4: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image4"),
    image5: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image5"),
    image6: yup.string().url().nullable()
         .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
        .label("Image6"),
    color1: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color1"),
    color2: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color2"),
    color3: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color3"),
    color4: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color4"),
    color5: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color5"),
    color6: yup.string().min(3).max(7).nullable()
        .matches(/^[0-9a-zA-Z#]*$/g, "Not a valid color")
        .label("Color6"),
})

const shopValidationSchema = yup.object().shape({
    title: yup.string().min(4).max(150)
    .matches(/^[a-zA-Z ]*$/g, "Shop name can only consist upon letters and spaces")
    .required().label("Shop Name"),
    short_description: yup.string().min(4).max(150)
    .matches(/^[a-zA-Z .]*$/g, "Shop description can only consist upon letters, periods(.) and spaces")
    .required().label("Description"),
    logo: yup.string().required().max(150)
    .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
    .label("Shop Logo"),
    cover_photo: yup.string().max(150)
    .matches(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g, "Must be a valid image (jpg, png, gif, jpeg) file")
    .required().label("Shop Cover"),
    category: yup.string().min(4).max(150)
    .matches(/^[a-zA-Z ]*$/g, "Category can only consist upon letters and spaces")
    .required().label("Category")
})

const mongoURI = process.env.MONGO_URL;

const promise = mongoose.connect(mongoURI, {   
    useNewUrlParser: true,
    useUnifiedTopology: true });
const conn = mongoose.connection;
  

let gfs;
  
conn.once("open", () => {
    gfs = Grid(conn, mongoose.mongo);
    gfs.collection('uploads');
});

const fee     = "0.001 VOILK";
const SecretToken = process.env.ACCESS_CODE;
const wif         = process.env.PASSWORD;
const creator     = process.env.USERNAME;
const hyipSender  = process.env.HYIP;
const hyipPrivate = process.env.PRIVATE;

const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLBoolean
} = graphql;
const { methods, voilk } = require('../api/api_data');
const { Membership } = require('../models/index.js');
const { ReferralType, MembershipType } = require('../types');
const TransactionModel = require('../models/TransactionModel/TransactionModel.js');
//voilk(methods.getWitnessSchedule.method, methods.getWitnessSchedule.params);

const capitals = [
    'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z'
]

const numbers = [0, 1, 2, 3,4, 5, 6, 7, 8, 9]

const smalls = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
  'u', 'v', 'w', 'x', 'y', 'z'
]


const token_generate = () => {
  
  const str = [];
  str[0]  = "B"
  str[1]  = numbers[Math.floor(Math.random() * numbers.length)];
  str[2]  = smalls[Math.floor(Math.random() * smalls.length)];
  str[3]  = numbers[Math.floor(Math.random() * numbers.length)];
  str[4]  = capitals[Math.floor(Math.random() * capitals.length)];
  str[5]  = 1;
  str[6]  = smalls[Math.floor(Math.random() * smalls.length)];
  str[7]  = numbers[Math.floor(Math.random() * numbers.length)];
  str[8]  = capitals[Math.floor(Math.random() * capitals.length)];
  str[9]  = smalls[Math.floor(Math.random() * smalls.length)];
  str[10] = 5;
  str[11] = capitals[Math.floor(Math.random() * numbers.length)];
  str[12] = smalls[Math.floor(Math.random() * smalls.length)];
  str[13] = numbers[Math.floor(Math.random() * numbers.length)];
  str[14] = "D";
  str[15] = numbers[Math.floor(Math.random() * numbers.length)];
  str[16] = "u"
  str[17] = numbers[Math.floor(Math.random() * numbers.length)];
  str[18] = capitals[Math.floor(Math.random() * capitals.length)];
  str[19] = smalls[Math.floor(Math.random() * smalls.length)];
  let shuffled = str.sort(() => 0.5-Math.random()).join('');
  //console.log(replace_array(shuffled));
  return shuffled;  
}

const replace_array = (str) => {
    let newstr = str.replace(5, 4);
    newstr = newstr.replace("D", "L");
    newstr = newstr.replace("u", "l");
    newstr = newstr.replace("B", "E");
    newstr = newstr.replace(1, 2);
    return newstr;
}

const getLocation = (ip) => {
    var result;
    //console.log(ip);
    return new Promise(function(resolve, reject) {
        //https://api.ipify.org?format=json
        //http://www.geoplugin.net/json.gp
        var link = "http://www.geoplugin.net/json.gp?ip="+ip;
        //console.log(link);
        fetch(link)
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function(data) {
           resolve(data);
        });
    })
}
const getMinutesBetweenDates = (startDate, endDate) => {
    var diff = endDate.getTime() - startDate.getTime();
    return parseInt(Math.ceil(diff / 60000));
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
}
const ValidateIPaddress = (ipaddress) => {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
      return (true)  
    }   
    return (false)  
} 
const get_public_key = (privWif) => {
    var pubWif = PrivateKey.fromWif(privWif);
    pubWif = pubWif.toPublic().toString();
    return pubWif;
} 
const verifykey = (e, p) => {
    let pub;
    try {
      pub = get_public_key(e);
    } catch (error) {
      return false;
    }
    if (pub === p) {
      return true
    }
    else return false
}
const validURL = (str) => {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}
const checkImage =(url) => {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}
const validate_token = (str) => {
    const nstr = str.split("");
    let check1 = false;
    let check2 = false;
    let check3 = false;
    let check4 = false;
    let check5 = false;
    let numbers = 0;
    let caps = 0;
    let sm = 0;
    
    let newstring = []
    for (var i = 0; i < nstr.length; i++) {
      newstring[i] = nstr[i].charCodeAt(0)
      if(newstring[i] >= 48 && newstring[i]<=57){
        numbers ++;
      }
      if(newstring[i] >= 65 && newstring[i]<=90){
        caps ++;
      }
      if(newstring[i] >= 97 && newstring[i]<=122){
        sm ++;
      }
      if(nstr[i]==2){
          check1 = true;
      }
      if(nstr[i]=="l"){
          check2 = true;
      }
      if(nstr[i]=="E"){
          check3 = true;
      }
      if(nstr[i]==4){
          check4 = true;
      }
      if(nstr[i]=="L"){
          check5 = true;
      }
    }
    
    if(numbers==8&&caps==6&&sm==6&&check1&&check2&&check3&&check4&&check5){
      return true;
    }
    else return false
}




const validate_account_name = (value) => {
    let i, label, len, length, ref;
    
    if (!value) {
        return "Account name Should not be empty";
    }
    length = value.length;
    if (length < 3) {
        return "Account name should be at least 3 characters";
    }
    if (length > 16) {
        return "Account name should be shorter than 16 characters";
    }
    // if (!/-/.test(value)) {
    //     return "Account name must contain a dash (-) e.g bilal-haider";
    // }
    if (Premium.list.includes(value)) {
        return "This username is purchase only!!";
    }
    ref = value.split('.');
    for (i = 0, len = ref.length; i < len; i++) {
        label = ref[i];
        if (!/^[a-z]/.test(label)) {
            return "Account name should start with a letter!";
        }
        if (!/^[a-z0-9-]*$/.test(label)) {
            return "Account name can only consist upon letters, digits and dashes";
        }
        if (/--/.test(label)) {
            return "Account name can only have 1 dash in a row";
        }
        if (!/[a-z0-9]$/.test(label)) {
            return "Account name should end with a letter or digit";
        }
        if (!(label.length >= 3)) {
            return "each account segment should be longer";
        }
    }
    return null;
}

const generate_random_password = (prefix="P") => {
    let pass = prefix + key_utils.get_random_key().toWif();
    return pass;
}
const generate_keys = (pass, name) => {
    let private_keys;
    private_keys = api.auth.getPrivateKeys(name, pass, ['owner', 'active', 'posting', 'memo']);
    private_keys["masterPassword"] = pass;
    return private_keys;
}

const seconds_between_dates = (t1, t2) => {
    var dif = t1.getTime() - t2.getTime();

    var Seconds_from_T1_to_T2 = dif / 1000;
    var Seconds_Between_Dates = Math.floor(Math.abs(Seconds_from_T1_to_T2));
    return Seconds_Between_Dates;
}

const wait = (ms) =>
{
    var d = new Date();
    var d2 = null;
    do { d2 = new Date(); }
    while(d2-d < ms);
}
const Witness = new GraphQLObjectType({
    name: 'Witness',
    fields: () => ({
        name: {type: GraphQLString},
        account: {
            type: Account,
            resolve(parent, args) {
                return voilk(methods.getAccount.method, `[["${parent.name}"]]`, 1);
            }
        }
    })
});

const FeedHistory = new GraphQLObjectType({
   name: 'FeedHistory',
   fields: () => ({
        id: {type: GraphQLInt},
        current_median_history: {type: FeedEntry},
        price_history: {type: GraphQLList(FeedEntry)}
   })
});

const FeedEntry = new GraphQLObjectType({
    name: 'FeedEntry',
    fields: () => ({
        base: {type: GraphQLString},
        quote: {type: GraphQLString}
    })
})

const BlockChainVersion = new GraphQLObjectType({
   name: 'BlockChainVersion',
   fields: () => ({
        blockchain_version: {type: GraphQLString},
        voilk_revision: {type: GraphQLString},
        fc_revision: {type: GraphQLString}
   })
});

const ChainProperties =  new GraphQLObjectType({
   name: 'ChainProperties',
   fields: () => ({
        account_creation_fee: {type: GraphQLString},
        maximum_block_size: {type: GraphQLString},
        vsd_interest_rate: {type: GraphQLString},
        account_subsidy_budget: {type: GraphQLString},
        account_subsidy_decay: {type: GraphQLString}
   })
});

const RewardFund = new GraphQLObjectType({
    name: 'RewardFund',
    fields: () => ({
        id: { type: GraphQLInt},
        name: { type: GraphQLString},
        reward_balance: { type: GraphQLString},
        recent_claims: { type: GraphQLString},
        last_update: { type: GraphQLString},
        content_constant: { type: GraphQLString},
        percent_curation_rewards: { type: GraphQLInt},
        percent_content_rewards: { type: GraphQLInt},
        author_reward_curve: { type: GraphQLString},
        curation_reward_curve: { type: GraphQLString}
    })
})

const DynamicGlobalProperties = new GraphQLObjectType({
    name: 'DynamicGlobalProperties',
    fields: () => ({
        head_block_number: { type: GraphQLID},
        head_block_id: { type: GraphQLString},
        time: { type: GraphQLString},
        current_witness: { type: GraphQLString},
        total_pow: { type: GraphQLString},
        num_pow_witnesses: { type: GraphQLInt},
        virtual_supply: { type: GraphQLString},
        current_supply: { type: GraphQLString},
        confidential_supply: { type: GraphQLString},
        current_vsd_supply: { type: GraphQLString},
        confidential_vsd_supply: { type: GraphQLString},
        total_coining_fund_voilk: { type: GraphQLString},
        total_coining_shares: { type: GraphQLString},
        total_reward_fund_voilk: { type: GraphQLString},
        total_reward_shares2: { type: GraphQLString},
        pending_rewarded_coining_shares: { type: GraphQLString},
        pending_rewarded_coining_voilk: { type: GraphQLString},
        vsd_interest_rate: { type: GraphQLInt},
        vsd_print_rate: { type: GraphQLInt},
        maximum_block_size: { type: GraphQLInt},
        current_aslot: { type: GraphQLInt},
        recent_slots_filled: { type: GraphQLString},
        participation_count: { type: GraphQLInt},
        last_irreversible_block_num: { type: GraphQLInt},
        vote_power_reserve_rate: { type: GraphQLInt},
        delegation_return_period: { type: GraphQLInt},
        reverse_auction_seconds: { type: GraphQLInt},
        vsd_stop_percent: { type: GraphQLInt},
        vsd_start_percent: { type: GraphQLInt},
        average_block_size: { type: GraphQLInt},
        current_reserve_ratio: { type: GraphQLInt},
        max_virtual_bandwidth: { type: GraphQLString},
        post_reward_fund: { 
            type: RewardFund,
            resolve(parent, args){
                const name = "post"
                let getFundP = new Promise((resolve, reject) => {
                    api.api.getRewardFund(name, function(err, result) {
                    resolve(result)
                    });
                })
                return getFundP.then(tr => {
                    if(tr!==undefined){
                        return tr
                    }
                    else {
                        return {
                            id: null,
                            name: null,
                            reward_balance: null,
                            recent_claims: null,
                            last_update: null,
                            content_constant: null,
                            percent_curation_rewards: null,
                            percent_content_rewards: null,
                            author_reward_curve: null,
                            curation_reward_curve: null
                          }                          
                    }
                })
                
            }
        }
    })
});

const AccountMarketBandWidth = new GraphQLObjectType({
    name: 'AccountMarketBandWidth',
    fields: () => ({
        id: { type: GraphQLID},
        account: { type: GraphQLString},
        type: { type: GraphQLString},
        average_bandwidth: { type: GraphQLString},
        lifetime_bandwidth: { type: GraphQLString},
        last_bandwidth_update: { type: GraphQLString}
    })
});

const AccountForumBandWidth = new GraphQLObjectType({
    name: 'AccountForumBandWidth',
    fields: () => ({
        id: { type: GraphQLID},
        account: { type: GraphQLString},
        type: { type: GraphQLString},
        average_bandwidth: { type: GraphQLString},
        lifetime_bandwidth: { type: GraphQLString},
        last_bandwidth_update: { type: GraphQLString}
    })
});

const AccountReputation = new GraphQLObjectType({
    name: 'AccountReputation',
    fields: () => ({
        account: { type: GraphQLString},
        reputation: { type: GraphQLInt}
    })
});


const Vote = new GraphQLObjectType({
    name: 'Vote',
    fields: () => ({
        account: {type: GraphQLString},
        permlink: {type: GraphQLString},
        authorperm: {type: GraphQLString},
        weight: {type: GraphQLString},
        rshares: { type: GraphQLInt},
        percent: { type: GraphQLInt},
        time: {type: GraphQLString}
    })
});


const ActiveVote = new GraphQLObjectType({
    name: 'ActiveVote',
    fields: () => ({
        voter: {type: GraphQLString},
        weight: {type: GraphQLString},
        rshares: {type: GraphQLString},
        percent: { type: GraphQLInt},
        reputation: {type: GraphQLString},
        time: {type: GraphQLString},
    })
});


const VotingManaBar = new GraphQLObjectType({
    name: 'VotingManaBar',
    fields: () => ({
        current_mana: { type: GraphQLString},
        last_update_time: { type: GraphQLInt}
    })
});

const KeyType = new GraphQLObjectType({
    name: 'KeyType',
    fields: () => ({
        weight_threshold: { type: GraphQLInt},
        account_auths: { type: GraphQLList(GraphQLList(GraphQLString)) },
        key_auths: {type: GraphQLList(GraphQLList(GraphQLString))}
    })
});

const HistoryType = new GraphQLObjectType({
    name: 'HistoryType',
    fields: () => ({
        block: {type: BlockType},
        detail: {type: DetailType}
    })
});

const DetailType = new GraphQLObjectType({
    name: 'DetailType',
    fields: () => ({
        transaction: {type: TransactionType}
    })
});

const BlockType = new GraphQLObjectType({
    name: 'BlockType',
    fields: () => ({
      block_number: {type: GraphQLInt}
    })
});

const TransactionType = new GraphQLObjectType({
    name: 'TransactionType',
    fields: () => ({
        trx_id: {type: GraphQLString},
        block: { type: GraphQLInt},
        trx_in_block: { type: GraphQLString},
        op_in_trx: { type: GraphQLString},
        virtual_op: { type: GraphQLString},
        timestamp: {type: GraphQLString},
        op: {type: OperationType}
    })
});

const OperationType = new GraphQLObjectType({
   name: 'OperationType',
   fields: () => ({
       name: {type: GraphQLString},
       opdetail: {type: GraphQLString }
   })
});

const AccountsCount = new GraphQLObjectType({
    name: 'AccountsCount',
    fields: () => ({
        count: {type: GraphQLInt}
    })
});

const Block = new GraphQLObjectType({
    name: 'Block',
    fields: () => ({
        height:{type: GraphQLString},
        previous: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        witness: {type: GraphQLString},
        transaction_merkle_root: {type: GraphQLString},
        extensions: {type: GraphQLList(GraphQLString)},
        witness_signature:{type: GraphQLString},
        transactions: {type: GraphQLList(Transaction)},
        block_id: {type: GraphQLString},
        signing_key: {type: GraphQLString},
        transaction_ids: {type: GraphQLList(GraphQLString)},
        transactions_count: {type: GraphQLInt}
    })
});

const Transaction = new GraphQLObjectType({
    name: 'Transaction',
    fields: () => ({
        ref_block_num: {type: GraphQLString},
        ref_block_prefix: {type: GraphQLString},
        expiration: {type: GraphQLString},
        operations: {
            type: GraphQLList(GraphQLString),
            resolve(parent, args) {
                let nData = parent.operations.map(op => {return JSON.stringify(op)})
                return nData;
            }
        },
        extensions: {type: GraphQLList(GraphQLString)},
        signatures: {type: GraphQLList(GraphQLString)},
        transaction_id: {type: GraphQLString},
        block_num: {type: GraphQLString},
        transaction_num: {type: GraphQLString}
    })
});

const BlockHeader = new GraphQLObjectType({
    name: 'BlockHeader',
    fields: () => ({
        previous: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        witness: {type: GraphQLString},
        transaction_merkle_root: {type: GraphQLString},
        extensions: {type: GraphQLList(GraphQLString)}
    })
});

const Blog = new GraphQLObjectType({
    name: 'Blog',
    fields: () => ({
        comment: {type: Post },
        blog: {type: GraphQLString },
        reblog_on: {type: GraphQLString },
        entry_id: {type: GraphQLInt }
    })
});

const BlogEntry = new GraphQLObjectType({
    name: 'BlogEntry',
    fields: () => ({
        author: {type: GraphQLString },
        permlink: {type: GraphQLString },
        blog: {type: GraphQLString },
        reblog_on: {type: GraphQLString },
        entry_id: {type: GraphQLInt }
    })
})

const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: {type: GraphQLInt } ,
        author: {type: GraphQLString },
        permlink: {type: GraphQLString },
        category: {type: GraphQLString },
        parent_author: {type: GraphQLString },
        parent_permlink: {type: GraphQLString },
        title: {type: GraphQLString },
        body: {type: GraphQLString },
        json_metadata: {type: GraphQLString },
        last_update: {type: GraphQLString },
        created: {type: GraphQLString },
        active: {type: GraphQLString },
        last_payout: {type: GraphQLString },
        depth: {type: GraphQLInt } ,
        children: {type: GraphQLInt } ,
        net_rshares: {type: GraphQLString },
        abs_rshares: {type: GraphQLString },
        vote_rshares: {type: GraphQLString },
        children_abs_rshares: {type: GraphQLString },
        cashout_time: {type: GraphQLString },
        max_cashout_time: {type: GraphQLString },
        total_vote_weight: {type: GraphQLString } ,
        reward_weight: {type: GraphQLInt } ,
        total_payout_value: {type: GraphQLString },
        curator_payout_value: {type: GraphQLString },
        author_rewards: {type: GraphQLInt } ,
        net_votes: {type: GraphQLInt } ,
        root_author: {type: GraphQLString },
        root_permlink: {type: GraphQLString },
        max_accepted_payout: {type: GraphQLString },
        percent_voilk_dollars: {type: GraphQLInt } ,
        allow_replies: {type: GraphQLBoolean } ,
        allow_votes: {type: GraphQLBoolean } ,
        allow_curation_rewards: {type: GraphQLBoolean } ,
        beneficiaries: {type: GraphQLList(GraphQLString) },
        reblogged_by: {type: GraphQLList(GraphQLString) }
    })
});

const Account = new GraphQLObjectType({
    name: 'Account',
    fields: () => ({
        id: { type: GraphQLInt},
        bitcoin: {
            type: GraphQLString,
            resolve(parent, args){
                //console.log(parent.id)
                let bit = Bitcoin.findOne({userid: parent.id})
                return bit.then(x=> {
                    //console.log(x)
                    return x.address
                })
            }
        },
        bitcoincash: {
            type: GraphQLString,
            resolve(parent, args){
                //console.log(parent.id)

                let bit = BitcoinCash.findOne({userid: parent.id})
                return bit.then(x=> {
                    //console.log(x)
                    return x.address
                })
            }
        },
        name: {type: GraphQLString},
        membership: {
            type: MembershipType,
            async resolve(parent, args){
                return Membership.findOne({username: parent.name})
            }
        },
        owner:{type: KeyType},
        active:{type: KeyType},
        posting:{type: KeyType},
        memo_key: {type: GraphQLString},
        json_metadata:{type: ProfileType},
        followers: {
            type: FollowType, 
            resolve(parent, args){
                let trp = new Promise(function(resolve, reject) {
             
                    api.api.getFollowCount(parent.name, function(err, result) {
                        //console.log(err, result);
                        resolve(result)
                      });
                })
                return trp.then(tr => {
                    if(tr!==undefined){
                        return tr
                    }
                    else {
                        return {follower_count: 0, following_count: 0}
                    }
                })
            }
        },
        user_followers: {
            type: new GraphQLList(GraphQLString),
            resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.api.getFollowers(parent.name, null, "blog", 500, function(err, result) {
                    if(result){
                        let followers = result.map(follower => {
                            return follower.follower
                        })
                        resolve(followers)
                    }else {
                        resolve(null)
                    }
                    
                });
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return tr
                 }
                 else {
                     return null
                 }
             })
            }
        },
        user_following: {
            type: new GraphQLList(GraphQLString),
            resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.api.getFollowing(parent.name, null, "blog", 500, function(err, result) {
                    if(result){
                        let followers = result.map(follower => {
                            return follower.following
                        })
                        resolve(followers)
                    }else {
                        resolve(null)
                    }
                    
                });
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return tr
                 }
                 else {
                     return null
                 }
             })
            }
        },
        user_muted: {
            type: new GraphQLList(GraphQLString),
            resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.api.getFollowers(parent.name, null, "ignore", 500, function(err, result) {
                    if(result){
                        let followers = result.map(follower => {
                            return follower.follower
                        })
                        resolve(followers)
                    }else {
                        resolve(null)
                    }
                    
                });
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return tr
                 }
                 else {
                     return null
                 }
             })
            }
        },
        user_ignored: {
            type: new GraphQLList(GraphQLString),
            resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.api.getFollowing(parent.name, null, "ignore", 500, function(err, result) {
                    if(result){
                        let followers = result.map(follower => {
                            return follower.following
                        })
                        resolve(followers)
                    }else {
                        resolve(null)
                    }
                    
                });
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return tr
                 }
                 else {
                     return null
                 }
             })
            }
        },
        proxy: {type: GraphQLString},
        last_owner_update: {type: GraphQLString},
        last_account_update: {type: GraphQLString},
        created: {type: GraphQLString},
        mined: { type: GraphQLBoolean},
        recovery_account: {type: GraphQLString},
        last_account_recovery: {type: GraphQLString},
        reset_account: {type: GraphQLString},
        comment_count: { type: GraphQLInt},
        lifetime_vote_count: { type: GraphQLInt},
        post_count: { type: GraphQLInt},
        can_vote: { type: GraphQLBoolean},
        voting_manabar: {type: VotingManaBar},
        voting_power: { type: GraphQLInt},
        balance: {type: GraphQLString},
        savings_balance: {type: GraphQLString},
        vsd_balance: {type: GraphQLString},
        vsd_seconds: {type: GraphQLString},
        vsd_seconds_last_update: {type: GraphQLString},
        vsd_last_interest_payment: {type: GraphQLString},
        savings_vsd_balance: {type: GraphQLString},
        savings_vsd_seconds: {type: GraphQLString},
        savings_vsd_seconds_last_update: {type: GraphQLString},
        savings_vsd_last_interest_payment: {type: GraphQLString},
        savings_withdraw_requests: { type: GraphQLInt},
        reward_vsd_balance: {type: GraphQLString},
        reward_voilk_balance: {type: GraphQLString},
        reward_coining_balance: {type: GraphQLString},
        reward_coining_voilk: {type: GraphQLString},
        coining_shares: {type: GraphQLString},
        delegated_coining_shares: {type: GraphQLString},
        received_coining_shares: {type: GraphQLString},
        coining_withdraw_rate: {type: GraphQLString},
        next_coining_withdrawal: {type: GraphQLString},
        withdrawn: { type: GraphQLString},
        to_withdraw: { type: GraphQLString},
        withdraw_routes: { type: GraphQLString},
        curation_rewards: { type: GraphQLString},
        posting_rewards: { type: GraphQLString},
        proxied_vsf_votes: { type: GraphQLList(GraphQLString)},
        witnesses_voted_for: { type: GraphQLString},
        last_post: {type: GraphQLString},
        last_root_post: {type: GraphQLString},
        last_vote_time: {type: GraphQLString},
        post_bandwidth: { type: GraphQLInt},
        pending_claimed_accounts: { type: GraphQLString},
        average_bandwidth: {type: GraphQLString},
        lifetime_bandwidth: {type: GraphQLString},
        last_bandwidth_update: {type: GraphQLString},
        average_market_bandwidth: {type: GraphQLString},
        lifetime_market_bandwidth: {type: GraphQLString},
        last_market_bandwidth_update: {type: GraphQLString},
        coining_balance: {type: GraphQLString},
        reputation: { type: GraphQLString},
        witness_votes: { type: GraphQLList(GraphQLString)}
    })
});

const BlogPartner = new GraphQLObjectType({
    name: 'BlogPartner',
    fields: () => ({
        author: {type: GraphQLString },
        count: {type: GraphQLInt }
    })
});

const ProfileType = new GraphQLObjectType({
   name: 'ProfileType',
   fields: () => ({
       cover_image: {type: GraphQLString},
       name:{type: GraphQLString},
       about:{type: GraphQLString},
       location:{type: GraphQLString},
       website:{type: GraphQLString},
       profile_image: {type: GraphQLString}
   })
});

const PasswordType = new GraphQLObjectType({
    name: 'PasswordType',
    fields: () => ({
        result: {type: GraphQLString}
    })
});

const PublicKeysType = new GraphQLObjectType({
    name: 'PublicKeysType',
    fields: () => ({
        active: {type: GraphQLString},
        owner: {type: GraphQLString},
        posting: {type: GraphQLString},
        memo: {type: GraphQLString},
        activePubkey: {type: GraphQLString},
        ownerPubkey: {type: GraphQLString},
        postingPubkey: {type: GraphQLString},
        memoPubkey: {type: GraphQLString},
        masterPassword: {type: GraphQLString},
        errors: {type: GraphQLString}
    })
});

const ValidateUsernameType = new GraphQLObjectType({
    name: 'ValidateNameType',
    fields: () => ({
        result: {type: GraphQLString}
    })
});

const ResultType = new GraphQLObjectType({
    name: 'ResultType',
    fields: () => ({
        result: {type: GraphQLString},
        notes: {type: GraphQLString}
    })
});

const TagType = new GraphQLObjectType({
    name: 'TagType',
    fields: () => (  {
        name: {type: GraphQLString},
        total_payouts: {type: GraphQLString},
        net_votes: {type: GraphQLString},
        top_posts: {type: GraphQLString},
        comments: {type: GraphQLString},
        trending: {type: GraphQLString}
      })
})

const CouponType =  new GraphQLObjectType({
    name: "CouponType",
    fields: () => ({
        coupon_id: {type: GraphQLString},
        value: {type: GraphQLString},
        error: {type: GraphQLString}
    })
});

const AdProfileType = new GraphQLObjectType({
    name: "AdProfileType",
    fields: () => ({
        _id: {type: GraphQLString},
        name: {type: GraphQLString},
        username: {type: GraphQLString},
        credit: {type: GraphQLInt},
        ads: {type: GraphQLList(AdvertType)},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
});

const AdvertType = new GraphQLObjectType({
    name: "AdvertType",
    fields: () => ({
       _id: {type: GraphQLString},
        ad_type: {type: GraphQLString},
        ad_width: {type: GraphQLString},
        ad_height: {type: GraphQLString},
        ad_credits: {type: GraphQLString},
        ad_timer: {type: GraphQLString},
        ad_link: {type: GraphQLString},
        ad_target: {type: GraphQLString},
        ad_status: {type: GraphQLString},
        ad_active: {type: GraphQLString},
        ad_impressions: {type: GraphQLList(ViewType)},
        ad_clicks: {type: GraphQLList(ViewType)},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString}
    })
});

const ModifyType = new GraphQLObjectType({
    name: "ModifyType",
    fields: () => ({
        error: {type: GraphQLString},
        nMatched : {type: GraphQLInt}, 
        nUpserted : {type: GraphQLInt}, 
        nModified : {type: GraphQLInt}
    })
});
const DeleteType = new GraphQLObjectType({
    name: "DeleteType",
    fields: () => ({
        error: {type: GraphQLString},
        acknowledged : {type: GraphQLInt}, 
        deletedCount : {type: GraphQLInt}
    })
});


const ViewType = new GraphQLObjectType({
    name: "ViewType",
    fields: () => ({
        ad_browser: {type: GraphQLString},
        ad_platform: {type: GraphQLString},
        ad_url: {type: GraphQLString},
        created_at: {type: GraphQLString},
        geoplugin_areaCode: {type: GraphQLString},
        geoplugin_city: {type: GraphQLString},
        geoplugin_continentCode: {type: GraphQLString},
        geoplugin_continentName:{type: GraphQLString},
        geoplugin_countryCode: {type: GraphQLString},
        geoplugin_countryName: {type: GraphQLString},
        geoplugin_currencyCode: {type: GraphQLString},
        geoplugin_currencyConverter:{type: GraphQLString},
        geoplugin_currencySymbol: {type: GraphQLString},
        geoplugin_currencySymbol_UTF8: {type: GraphQLString},
        geoplugin_delay: {type: GraphQLString},
        geoplugin_dmaCode:{type: GraphQLString},
        geoplugin_euVATrate: {type: GraphQLString},
        geoplugin_inEU: {type: GraphQLString},
        geoplugin_latitude: {type: GraphQLString},
        geoplugin_locationAccuracyRadius: {type: GraphQLString},
        geoplugin_longitude: {type: GraphQLString},
        geoplugin_region: {type: GraphQLString},
        geoplugin_regionCode: {type: GraphQLString},
        geoplugin_regionName: {type: GraphQLString},
        geoplugin_request: {type: GraphQLString},
        geoplugin_status: {type: GraphQLString},
        geoplugin_timezone:{type: GraphQLString}
      })
})

const LocationType = new GraphQLObjectType({
    name: "LocationType",
    fields: () => ({
        geoplugin_areaCode: {type: GraphQLString},
        geoplugin_city: {type: GraphQLString},
        geoplugin_continentCode: {type: GraphQLString},
        geoplugin_continentName:{type: GraphQLString},
        geoplugin_countryCode: {type: GraphQLString},
        geoplugin_countryName: {type: GraphQLString},
        geoplugin_currencyCode: {type: GraphQLString},
        geoplugin_currencyConverter:{type: GraphQLString},
        geoplugin_currencySymbol: {type: GraphQLString},
        geoplugin_currencySymbol_UTF8: {type: GraphQLString},
        geoplugin_delay: {type: GraphQLString},
        geoplugin_dmaCode:{type: GraphQLString},
        geoplugin_euVATrate: {type: GraphQLString},
        geoplugin_inEU: {type: GraphQLString},
        geoplugin_latitude: {type: GraphQLString},
        geoplugin_locationAccuracyRadius: {type: GraphQLString},
        geoplugin_longitude: {type: GraphQLString},
        geoplugin_region: {type: GraphQLString},
        geoplugin_regionCode: {type: GraphQLString},
        geoplugin_regionName: {type: GraphQLString},
        geoplugin_request: {type: GraphQLString},
        geoplugin_status: {type: GraphQLString},
        geoplugin_timezone:{type: GraphQLString},
        error: {type: GraphQLString}
      })
})

const ActiveAdvertType = new GraphQLObjectType({
    name: "ActiveAdvertType",
    fields: () => ({
        _id: {type: GraphQLString},
        ad_link : {type: GraphQLString},
        ad_target : {type: GraphQLString},
        ad_width : {type: GraphQLInt}, 
        ad_height : {type: GraphQLInt}, 
        username : {type: GraphQLString}
    })
})

const ReportType = new GraphQLObjectType({
    name: "ReportType",
    fields: () => ({
        result: {type: GraphQLString},
        count: {type: GraphQLInt}
    })
})

const AuthenticateType = new GraphQLObjectType({
    name: "AuthenticateType",
    fields: () => ({
        authenticated: {type: GraphQLBoolean},
        public_key: {type: GraphQLString},
        private_key: {type: GraphQLString}
    })
})

const TransferType = new GraphQLObjectType({
    name: "TransferType",
    fields: () => ({
        result: {type: GraphQLBoolean},
        transaction_id: {type: GraphQLString}
    })
})

const CashoutType = new GraphQLObjectType({
    name: "CashoutType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        method: {type: GraphQLString},
        account: {type: GraphQLString},
        amount: {type: GraphQLString},
        status: {type: GraphQLString},
        error: {type: GraphQLString},
        processed: {type: GraphQLString},
        timestamp: {type: GraphQLString}
    })
})
const PlanType = new GraphQLObjectType({
    name: "PlanType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        planID: {type: GraphQLString},
        invested_amount: {type: GraphQLString},
        amount: {type: GraphQLInt},
        package_percent: {type: GraphQLString},
        claim: {type: GraphQLInt},
        claim_amount: {type: GraphQLString},
        package_period: {type: GraphQLString},
        status: {type: GraphQLString},
        lock: {type: GraphQLInt},
        claim_date: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const InvestType = new GraphQLObjectType({
    name: "InvestType",
    fields: () => ({
        _id: {type: GraphQLString},
        amount: {type: GraphQLString}
    })
}) 
const CountType = new GraphQLObjectType({
    name: "CountType",
    fields: () => ({
        _id: {type: GraphQLString},
        count: {type: GraphQLString}
    })
})

const CostType = new GraphQLObjectType({
    name: "CostType",
    fields: () => ({
        _id: {type: GraphQLString},
        job_creation_cost: {type: GraphQLString},
        job_response_cost: {type: GraphQLString},
        job_feature_cost: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const JobType = new GraphQLObjectType({
    name: "JobType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        job_title: {type: GraphQLString},
        job_instructions: {type: GraphQLString},
        job_discussion_url: {type: GraphQLString},
        job_time_required: {type: GraphQLInt},
        lock: {type: GraphQLInt},
        tags: {type: GraphQLList(GraphQLString)},
        category: {type: GraphQLString},
        pay_per_job: {type: GraphQLString},
        pay_per_job_value: {type: GraphQLInt},
        featured: {type: GraphQLBoolean},
        feature_expire: {type: GraphQLString},

        responses_required: {type: GraphQLInt},
        total_budget: {type: GraphQLString},
        total_budget_value: {type: GraphQLInt},

        status: {type: GraphQLString},
        cancel_before: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},

        responses_count: {
            type: GraphQLInt,
            resolve(parent, args){
                return Response.find({job_id: parent._id}).count(); 
            }
        },
        ratings_count: {type: GraphQLInt,
            resolve(parent, args){
                return Rating.find({job_id: parent._id}).count(); 
            }},
        average_rating: {
            type: new GraphQLList(CountType),
            resolve(parent, args){
                return Rating.aggregate(
                    [
                      {$match: {job_id: parent._id}},  
                      {
                        $group:
                          {
                            _id: null,
                            count: { $avg: "$rating" }
                          }
                      }
                    ]
                 )
            }
        },
        error: {type: GraphQLString}
    })
})


const JobPaginateType = new GraphQLObjectType({
    name: "JobPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(JobType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const UserInfoType = new GraphQLObjectType({
    name: "UserInfoType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        status: {type: GraphQLString},
        full_name: {type: GraphQLString},
        phone: {type: GraphQLString},
        email: {type: GraphQLString},
        intro_video: {type: GraphQLString},
        address1: {type: GraphQLString},
        address2: {type: GraphQLString},
        country: {type: GraphQLString},
        city: {type: GraphQLString},
        postal_code: {type: GraphQLString},
        profile_image: {type: GraphQLString},
        cover_image: {type: GraphQLString},
        subscribers: {type: GraphQLList(GraphQLString)},
        subscribees: {type: GraphQLList(GraphQLString)},
        about: {type: GraphQLString},
        lock: {type: GraphQLInt},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString},
        result: {type: GraphQLBoolean},

    })
})
const RatingType = new GraphQLObjectType({
    name: "RatingType",
    fields: () => ({
        _id: {type: GraphQLString},
        from: {type: GraphQLString},
        to: {type: GraphQLString},
        job_id: {type: GraphQLString},
        job: {
            type: JobType,
            resolve(parent, args){
                return Job.findOne({_id: parent.job_id});
            } 
        },
        response_id:  {type: GraphQLString},
        response: {
            type: ResponseType,
            resolve(parent, args){
                return Response.findOne({_id: parent.response_id});
            } 
        },
        rating:  {type: GraphQLInt},
        lock:  {type: GraphQLInt},
        rating_message: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})

const ResponseType = new GraphQLObjectType({
    name: "ResponseType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        job_id: {type: GraphQLString},
        job: {
            type: JobType,
            resolve(parent, args){
                return Job.findOne({_id: parent.job_id});
            } 
        },
        response_body:{type: GraphQLString},
        status:{type: GraphQLString},

        lock: {type: GraphQLInt},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const ResponsePaginateType = new GraphQLObjectType({
    name: "ResponsePaginateType",
    fields: () => ({
        docs: {type: GraphQLList(ResponseType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const RatingPaginateType = new GraphQLObjectType({
    name: "RatingPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(RatingType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const RemoveType = new GraphQLObjectType({
    name: "RemoveType",
    fields: () => ({
        n: {type: GraphQLInt},
        ok: {type: GraphQLInt},
        nModified: {type: GraphQLInt},
        deletedCount: {type: GraphQLInt},
        error: {type: GraphQLString}
    })
})

const BoolType = new GraphQLObjectType({
    name: "BoolType",
    fields: () => ({
        result: {type: GraphQLBoolean},
        error: {type: GraphQLString}
    })
})

const MetaData = new GraphQLObjectType({
    name: 'MetaData',
    fields: () => ({
        fileurl : {type: GraphQLString}
    })
})

const FileType =  new GraphQLObjectType({
    name: "FileType",
    fields: () => ({ 
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        length: {type: GraphQLInt},
        chunkSize: {type: GraphQLInt},
        uploadDate: {type: GraphQLString},
        filename: {type: GraphQLString},
        metadata: {
            type: MetaData
        },
        md5: {type: GraphQLString},
        contentType: {type: GraphQLString}
    })
})

const ShopType = new GraphQLObjectType({
    name: "ShopType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        title: {type: GraphQLString},
        short_description: {type: GraphQLString},
        logo: {type: GraphQLString},
        cover_photo: {type: GraphQLString},
        tags: {type: GraphQLList(GraphQLString)},
        category: {type: GraphQLString},
        status: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const ShopPaginateType = new GraphQLObjectType({
    name: "ShopPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(ShopType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const ProductType = new GraphQLObjectType({
    name: "ProductType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        shop_id: {type: GraphQLString},
    
        title: {type: GraphQLString},
        category: {type: GraphQLString},
        subcategory: {type: GraphQLString},
    
        short_description: {type: GraphQLString},
        long_description: {type: GraphQLString},
        details:{type: GraphQLString},
        video_link:{type: GraphQLString},
    
        price: {type: GraphQLInt},
        price_value: {type: GraphQLString},
        discount_percentage: {type: GraphQLInt},
        attain_options: {type: GraphQLList(GraphQLString)},
    
        free_shipping: {type: GraphQLBoolean},
        shipping_cost: {type: GraphQLInt},
        shipping_cost_value: {type: GraphQLString},
    
        available_quantity: {type: GraphQLInt},
        sold_quantity: {type: GraphQLInt},
    
        brand: {type: GraphQLString},
        images: {type: GraphQLList(GraphQLString)},
        colors: {type: GraphQLList(GraphQLString)},
    
        lock: {type: GraphQLInt},
        tags: {type: GraphQLList(GraphQLString)},
    
    
        featured: {type: GraphQLBoolean},
        feature_expiry: {type: GraphQLString},
        status: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString},
    })
})
const ProductPaginateType = new GraphQLObjectType({
    name: "ProductPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(ProductType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const CashRequestType = new GraphQLObjectType({
    name: "CashRequestType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        type: {type: GraphQLString},
        status: {type: GraphQLString},
        method: {type: GraphQLString},
        price: {type: GraphQLString},
        amount: {type: GraphQLInt},
        amount_value: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString}
    })
})

const CashRequestPaginateType = new GraphQLObjectType({
    name: "CashRequestPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(CashRequestType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})


const WalletType = new GraphQLObjectType({
    name: "WalletType",
    fields: () => ({
        _id: {type: GraphQLString},
        username: {type: GraphQLString},
        method: {type: GraphQLString},
        address: {type: GraphQLString},
        verified: {type: GraphQLBoolean},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})

const WalletPaginateType = new GraphQLObjectType({
    name: "WalletPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(WalletType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const TicketType = new GraphQLObjectType({
    name: "TicketType",
    fields: () => ({
        _id: {type: GraphQLString},
        messages: {
            type: new GraphQLList(MessageType),
            resolve(parent, args){
                return Message.find({ticket_id: parent._id});
            }
        },
        messages_count: {
            type: GraphQLInt,
            resolve(parent, args){
                return Message.find({ticket_id: parent._id}).count();
            }
        },
        username: {type: GraphQLString},
        title: {type: GraphQLString},
        message: {type: GraphQLString},
        closed: {type: GraphQLBoolean},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})

const TicketPaginateType = new GraphQLObjectType({
    name: "TicketPaginateType",
    fields: () => ({
        docs: {type: GraphQLList(TicketType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const MessageType = new GraphQLObjectType({
    name: "MessageType",
    fields: () => ({
        _id: {type: GraphQLString},
        ticket_id: {type: GraphQLString},
        from: {type: GraphQLString},
        to: {type: GraphQLString},
        message: {type: GraphQLString},
        created_at: {type: GraphQLString},
        updated_at: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})

const MessagePaginateType = new GraphQLObjectType({
    name: "MessagePaginateType",
    fields: () => ({
        docs: {type: GraphQLList(MessageType)},
        totalDocs: {type: GraphQLInt},
        offset: {type: GraphQLInt},
        limit: {type: GraphQLInt},
        totalPages: {type: GraphQLInt},
        page: {type: GraphQLInt},
        pagingCounter: {type: GraphQLInt},
        hasPrevPage: {type: GraphQLBoolean},
        hasNextPage: {type: GraphQLBoolean},
        prevPage: {type: GraphQLInt},
        nextPage: {type: GraphQLInt}
    })
})

const ConversionType =  new GraphQLObjectType({
    name: "ConversionType",
    fields: () => ({
        id: {type: GraphQLInt},
        owner: {type: GraphQLString},
        requestid: {type: GraphQLInt},
        amount: {type: GraphQLString},
        conversion_date: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})

const VoteType = new GraphQLObjectType({
    name: "VoteType",
    fields: () => ({
        voter: {type: GraphQLString},
        account: {
            type: Account,
            resolve(parent, args) {
                return voilk(methods.getAccount.method, `[["${parent.voter}"]]`, 1);
            }
        },
      weight: {type: GraphQLString},
      rshares:{type: GraphQLString},
      percent: {type: GraphQLInt},
      reputation:{type: GraphQLString},
      time: {type: GraphQLString}
    })
})

const ContentType =  new GraphQLObjectType({
    name: "ContentType",
    fields: () => ({
        id: {type: GraphQLInt},
        author: {type: GraphQLString},
        account: {
            type: Account,
            resolve(parent, args) {
                return voilk(methods.getAccount.method, `[["${parent.author}"]]`, 1);
            }
        },
        permlink: {type: GraphQLString},
        category: {type: GraphQLString},
        parent_author: {type: GraphQLString},
        parent_permlink: {type: GraphQLString},
        title: {type: GraphQLString},
        body: {type: GraphQLString},
        json_metadata: {type: GraphQLString},
        last_update: {type: GraphQLString},
        created: {type: GraphQLString},
        active: {type: GraphQLString},
        last_payout: {type: GraphQLString},
        depth: {type: GraphQLInt},
        children: {type: GraphQLInt},
        net_rshares: {type: GraphQLString},
        abs_rshares: {type: GraphQLString},
        vote_rshares: {type: GraphQLString},
        children_abs_rshares: {type: GraphQLString},
        cashout_time: {type: GraphQLString},
        max_cashout_time: {type: GraphQLString},
        total_vote_weight: {type: GraphQLString},
        reward_weight: {type: GraphQLInt},
        total_payout_value: {type: GraphQLString},
        curator_payout_value: {type: GraphQLString},
        author_rewards: {type: GraphQLInt},
        net_votes: {type: GraphQLInt},
        root_author: {type: GraphQLString},
        root_permlink: {type: GraphQLString},
        max_accepted_payout: {type: GraphQLString},
        percent_voilk_dollars: {type: GraphQLInt},
        allow_replies: {type: GraphQLBoolean},
        allow_votes: {type: GraphQLBoolean},
        allow_curation_rewards: {type: GraphQLBoolean},
        beneficiaries: {type: GraphQLList(GraphQLString)},
        url: {type: GraphQLString},
        root_title: {type: GraphQLString},
        pending_payout_value: {type: GraphQLString},
        total_pending_payout_value: {type: GraphQLString},
        active_votes: {type: GraphQLList(VoteType)},
        replies: {
            type: GraphQLList(ContentType),
            resolve(parent, args){
              let trp = new Promise(function(resolve, reject) {
                   
                  api.api.getContentReplies(parent.author, parent.permlink, function(err, result) {
                      //console.log(err, result);
                      resolve(result)
                    });
              })
              return trp.then(tr => {
                  if(tr!==undefined){
                      return tr
                  }
                  else {
                      return {result: false, transaction_id: null}
                  }
              })
            }
          },
        author_reputation: {type: GraphQLString},
        promoted: {type: GraphQLString},
        body_length: {type: GraphQLInt},
        reblogged_by: {type: GraphQLList(GraphQLString),
        resolve(parent, args){
            return voilk(methods.getRebloggedBy.method, `["${parent.author}", "${parent.permlink}"]`);
        }
        }

    })
})

const FollowType = new GraphQLObjectType({
    name: "FollowType",
    fields: () => ({ 
        follower_count: {type: GraphQLInt}, 
        following_count: {type: GraphQLInt} 
    })
})

const FollowerType = new GraphQLObjectType({
    name: "FollowerType",
    fields: () => ({
        follower: {type: GraphQLString},
        account: {
            type: Account,
            resolve(parent, args){
                return voilk(methods.getAccount.method, `[["${parent.follower}"]]`, 1)
            }
        },
        following: {type: GraphQLString}, 
        faccount: {
            type: Account,
            resolve(parent, args){
                return voilk(methods.getAccount.method, `[["${parent.following}"]]`, 1)
            } 
        },
        what: {type: GraphQLList(GraphQLString)}
    })
})

const RootQuery = new GraphQLObjectType({
   name: 'RootQueryType',
   fields: {
       
       lookup_accounts: {
        type: new GraphQLList(Account),
        args: {
            lowerBound: {type: GraphQLString},
            limit: {type: GraphQLInt},
        },
        resolve(parent, args) {
            
         let trp = new Promise(function(resolve, reject) {
            api.api.lookupAccounts(args.lowerBound, args.limit, function(err, result) {
              //console.log(err, result);
              if(result){
                api.api.lookupAccountNames(result, function(err, result) {
                    if(result){

                        let users = []
                        users = result.map(user => {
                            let ndata = user
                
                            if(ndata.json_metadata=='')
                            {
                                ndata.json_metadata = '{"profile":{"profile_image":"https://image.flaticon.com/icons/svg/1372/1372315.svg","cover_image":"https://cdn.pixabay.com/photo/2015/10/17/20/03/voilk-993221_960_720.jpg","name":"Anonymous","about":"I am Anonymous","location":"Antarctica","website":"https://voilk.com"}}'
                            }
                            let profile = JSON.parse(ndata.json_metadata);
                            ndata.json_metadata = profile.profile;
                            //console.log(ndata);
                            return ndata;
                        })
                        if(!(args.lowerBound=="")){
                            users.shift()
                        }


                        resolve(users)
                    }
                    else {
                        reject(err)
                    }
                });
              }
              else {
                  reject(err)
              }
            });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       lookup_accounts_custom: {
        type: new GraphQLList(Account),
        args: {
            accounts: {type: GraphQLList(GraphQLString)}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {

                api.api.lookupAccountNames(args.accounts, function(err, result) {
                    if(result){
                        let users = []
                        users = result.map(user => {
                            let ndata = user
                
                            if(ndata.json_metadata=='')
                            {
                                ndata.json_metadata = '{"profile":{"profile_image":"https://image.flaticon.com/icons/svg/1372/1372315.svg","cover_image":"https://cdn.pixabay.com/photo/2015/10/17/20/03/voilk-993221_960_720.jpg","name":"Anonymous","about":"I am Anonymous","location":"Antarctica","website":"https://voilk.com"}}'
                            }
                            let profile = JSON.parse(ndata.json_metadata);
                            ndata.json_metadata = profile.profile;
                            //console.log(ndata);
                            return ndata;
                        })


                        resolve(users)
                    }
                    else {
                        reject(err)
                    }
                });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_followers_user: {
        type: new GraphQLList(FollowerType),
        args: {
            username: {type: GraphQLString},
            start: {type: GraphQLString},
            what: {type: GraphQLString},
            limit: {type: GraphQLInt},
        },
        resolve(parent, args) {
            
         let trp = new Promise(function(resolve, reject) {
            api.api.getFollowers(args.username, args.start, args.what, args.limit, function(err, result) {
                //console.log(err, result);
                    if(result){
                        let users = []
                        users = result;
                        if(!(args.start=="")){
                            users.shift()
                        }
                        resolve(users)
                    }
                    else {
                        reject(err)
                    }
                });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_following_user: {
        type: new GraphQLList(FollowerType),
        args: {
            username: {type: GraphQLString},
            start: {type: GraphQLString},
            what: {type: GraphQLString},
            limit: {type: GraphQLInt},
        },
        resolve(parent, args) {
            
         let trp = new Promise(function(resolve, reject) {
            api.api.getFollowing(args.username, args.start, args.what, args.limit, function(err, result) {
                //console.log(err, result);
                    if(result){
                        let users = []
                        users = result;
                        if(!(args.start=="")){
                            users.shift()
                        }
                        resolve(users)
                    }
                    else {
                        reject(err)
                    }
                });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_trending_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByTrending({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_created_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByCreated({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_active_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByActive({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_cashout_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByCashout({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_payout_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByPayout({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                //console.log(result)
                if(result){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_voted_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByVotes({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_children_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByChildren({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_popular_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByHot({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_feed_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByFeed({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_blog_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByBlog({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_commented_posts: {
        type: new GraphQLList(ContentType),
        args: {
            tag: {type: GraphQLString},
            limit: {type: GraphQLInt},
            truncate: {type: GraphQLInt},
            page: {type: GraphQLInt}
        },
        resolve(parent, args) {
         let trp = new Promise(function(resolve, reject) {
            let page = args.page
            let limit = args.limit
            
            let times = page * limit
            
            
            api.api.getDiscussionsByComments({"tag": args.tag, "limit": times, "truncate_body": args.truncate}, function(err, result) {
                
                if(result!==null){
                  if(page==1){
                      //console.log(err, result)
                    resolve(result)
                  }
                  else {
                    //console.log(err, result)
                    let newResult = result.slice(times-limit, result.length)
                    //console.log(err, newResult)
                    resolve(newResult)
                  }
                }
              });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_followers: {
           type: FollowType,
           args: {
               username: {type: GraphQLString}
           },
           resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
             
                api.api.getFollowCount(args.username, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return tr
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
           }
       },
       get_user_followers: {
        type: new GraphQLList(GraphQLString),
        args: {
            username: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
         let trp = new Promise(function(resolve, reject) {
          
             api.api.getFollowers(args.username, null, "blog", args.limit, function(err, result) {
                if(result){
                    let followers = result.map(follower => {
                        return follower.follower
                    })
                    resolve(followers)
                }else {
                    resolve(null)
                }
                
            });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_user_following: {
        type: new GraphQLList(GraphQLString),
        args: {
            username: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
         let trp = new Promise(function(resolve, reject) {
          
             api.api.getFollowing(args.username, null, "blog", args.limit, function(err, result) {
                if(result){
                    let followers = result.map(follower => {
                        return follower.following
                    })
                    resolve(followers)
                }else {
                    resolve(null)
                }
                
            });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_user_muted: {
        type: new GraphQLList(GraphQLString),
        args: {
            username: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
         let trp = new Promise(function(resolve, reject) {
          
             api.api.getFollowers(args.username, null, "ignore", args.limit, function(err, result) {
                if(result){
                    let followers = result.map(follower => {
                        return follower.follower
                    })
                    resolve(followers)
                }else {
                    resolve(null)
                }
                
            });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_user_ignored: {
        type: new GraphQLList(GraphQLString),
        args: {
            username: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
         let trp = new Promise(function(resolve, reject) {
          
             api.api.getFollowing(args.username, null, "ignore", args.limit, function(err, result) {
                if(result){
                    let followers = result.map(follower => {
                        return follower.following
                    })
                    resolve(followers)
                }else {
                    resolve(null)
                }
                
            });
         })
         return trp.then(tr => {
             if(tr!==undefined){
                 return tr
             }
             else {
                 return {result: false, transaction_id: null}
             }
         })
        }
       },
       get_content: {
         type: ContentType,
         args: {
             username: {type: GraphQLString},
             permlink: {type: GraphQLString}
         },
         resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
             
                api.api.getContent(args.username, args.permlink, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return tr
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
         }
       },
       get_content_replies: {
        type: new GraphQLList(ContentType),
        args: {
            username: {type: GraphQLString},
            permlink: {type: GraphQLString}
        },
        resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
             
                api.api.getContentReplies(args.username, args.permlink, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return tr
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
        }
       },
       create_ticket: {
           type: TicketType,
           args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            title: {type: GraphQLString},
            message: {type: GraphQLString}
           },
           resolve(parent, args){
            const {username, wif, title, message} = args
            const currentDate = new Date()

            return ticketValidationSchema.isValid(args).then(valid => {
                if(valid){
                    return fetch('https://graphql.voilk.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if(res.data.auth_active!==null)
                        {
                            let pb = res.data.auth_active.authenticated;
                            if(pb){
                                let nTicket= new Ticket({
                                    _id: generate_random_password("TICKET"),
                                    username: username,
                                    title: title,
                                    message: message,
                                    closed: false,
                                    created_at: currentDate,
                                    updated_at: currentDate
                                })
                                return nTicket.save();
                            } else return {error: "Could not verify.."}
                        } else return {error: "Could not connect.."}
                    })
                }
                else return {error: "Schema is not valid.."}
            })
          }
       },
       close_ticket: {
        type: RemoveType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            ticket_id: {type: GraphQLString}
        }, 
        resolve(parent, args){
            let ticket = Ticket.findOne({_id: args.ticket_id})
            return ticket.then(x => {
             if(x!==undefined){
                 return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                 })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.auth_active!==null)
                     {
                         let pb = res.data.auth_active.authenticated;
                         if(pb){
                            if(x.username==args.username){
                                return Ticket.updateOne({_id: args.ticket_id}, { 
                                   $set:
                                   {
                                       closed: true
                                   }
                                })
                            }
                            else return {error: "You cannot close this ticket.."}
                         } else return {error: "Could not verify.."}
                     } else return {error: "Could not connect.."}
                 })
             } else return {error: "Ticket does not exist.."}
            })
        }
       },
       open_ticket: {
        type: RemoveType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            ticket_id: {type: GraphQLString}
        }, 
        resolve(parent, args){
            let ticket = Ticket.findOne({_id: args.ticket_id})
            return ticket.then(x => {
             if(x!==undefined){
                 return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                 })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.auth_active!==null)
                     {
                         let pb = res.data.auth_active.authenticated;
                         if(pb){
                            if(x.username==args.username){
                                return Ticket.updateOne({_id: args.ticket_id}, { 
                                   $set:
                                   {
                                       closed: false
                                   }
                                })
                            }
                            else return {error: "You cannot close this ticket.."}
                         } else return {error: "Could not verify.."}
                     } else return {error: "Could not connect.."}
                 })
             } else return {error: "Ticket does not exist.."}
            })
        }
       },
       get_user_tickets: {
        type: TicketPaginateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            const {username, wif, page, limit} = args;

            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
            })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;
                    if(pb){
                     var options = {
                         sort:     { created_at: -1 },
                         page:     page,
                         limit:    limit
                       };
                     return Ticket.paginate({username: username},options).then(result => {
                             return result;
                         })
                    } else return {error: "Could not verify.."}
                } else return {error: "Could not connect.."}
            })
        }
       },
       get_user_ticket: {
        type: TicketType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            ticket_id: {type: GraphQLString}
        },
        resolve(parent, args){
            const {username, wif, ticket_id} = args;

            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
            })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;
                    if(pb){
                     return Ticket.findOne({_id: ticket_id, username})
                    } else return {error: "Could not verify.."}
                } else return {error: "Could not connect.."}
            })
        }
       },
       get_messages_of_ticket: {
        type: MessagePaginateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            ticket_id: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            const {username, wif, page, limit, ticket_id} = args;

            let ticket = Ticket.findOne({username: username})
            return ticket.then(tkk => {
                if(!(tkk._id==undefined)){
                    return fetch('https://graphql.voilk.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if(res.data.auth_active!==null)
                        {
                            let pb = res.data.auth_active.authenticated;
                            if(pb){
                            var options = {
                                sort:     { created_at: -1 },
                                page:     page,
                                limit:    limit
                            };
                            return Message.paginate({ticket_id: ticket_id},options).then(result => {
                                    return result;
                                })
                            } else return {error: "Could not verify.."}
                        } else return {error: "Could not connect.."}
                    })
                } else return {error: "You don't own this ticket.."}
            })
        }
       },
       add_message_to_ticket: {
           type: MessageType,
           args: {
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
               ticket_id: {type: GraphQLString},
               message: {type: GraphQLString}
           },
           resolve(parent, args){
               const {username, wif, ticket_id, message} = args
               return messageValidationSchema.isValid(args).then(valid => {
                if(valid){

                    let lastmessage = Message.find({from: username}).sort({created_at: -1}).limit(1);

                    return lastmessage.then(m1 => {
                        
                        if(m1.length==1){
                          let d1 = new Date(m1[0].created_at)
                          let d2 = new Date();
                          
                          let diff = seconds_between_dates(d1, d2)
                          if(diff>20){
                            let ticket = Ticket.findOne({_id: ticket_id})
                            return ticket.then(tk => {
                            if(tk._id!==undefined){
                                if(!(tk.username!==username||username!=="bilalhaider")){
                                    return fetch('https://graphql.voilk.com/graphql', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
                                    })
                                    .then(res => res.json())
                                    .then(res => {
                                        if(res.data.auth_active!==null)
                                        {
                                            let pb = res.data.auth_active.authenticated;
                                            let currentDate = new Date();
                                            if(pb){
                                                let nMessage = new Message({
                                                    _id: generate_random_password("MSG"),
                                                    ticket_id: ticket_id,
                                                    from: username,
                                                    to: "bilalhaider",
                                                    message: message,
                                                    created_at: currentDate,
                                                    updated_at: currentDate
                                                })
                                                return nMessage.save();

                                            } else return {error: "Could not verify.."}
                                        } else return {error: "Could not connect.."}
                                    })
    
                                }
                                else return {error: "You cannot add message to this ticket."}
    
                            }
                            else return {error: "Ticket does not exist.."}
                            })
                          }
                          else return {error: "You must wait at least 20 seconds"}
                        }
                        else if(m1.length==0){
                            let ticket = Ticket.findOne({_id: ticket_id})
                        return ticket.then(tk => {
                        if(tk._id!==undefined){
                            if(!(tk.username!==username||username!=="bilalhaider")){
                                return fetch('https://graphql.voilk.com/graphql', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
                                })
                                .then(res => res.json())
                                .then(res => {
                                    if(res.data.auth_active!==null)
                                    {
                                        let pb = res.data.auth_active.authenticated;
                                        let currentDate = new Date();
                                        if(pb){
                                            let nMessage = new Message({
                                                _id: generate_random_password("MSG"),
                                                ticket_id: ticket_id,
                                                from: username,
                                                to: "bilalhaider",
                                                message: message,
                                                created_at: currentDate,
                                                updated_at: currentDate
                                            })
                                            return nMessage.save();
                                        } else return {error: "Could not verify.."}
                                    } else return {error: "Could not connect.."}
                                })

                            }
                            else return {error: "You cannot add message to this ticket."}

                        }
                        else return {error: "Ticket does not exist.."}
                        })
                        }
                        else return {error: "There was an error: Code 333"}

                        
                    })
                    

                }
                else return {error: "Message contains some invalid characters"}
            })
           }
       },
       add_wallet: {

           type: WalletType,
           args: {
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
               method: {type: GraphQLString},
               address: {type: GraphQLString}
           },
           resolve(parent, args){

              const {username, wif, method, address} = args

              if(!(method==="Skrill"||method==="Perfectmoney"||method==="Webmoney")){
                  return {error: "Invalid payment method"}
              }
              else {
                 return fetch('https://graphql.voilk.com/graphql', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
                  })
                  .then(res => res.json())
                  .then(res => {
                      if(res.data.auth_active!==null)
                      {
                          let pb = res.data.auth_active.authenticated;
                          if(pb){
                              let nWallet = new Wallet({
                                  _id: generate_random_password("WALLET"),
                                  username: username,
                                  method: method,
                                  address: address,
                                  verified: false
                              })
                              return nWallet.save();
                          } else return {error: "Could not verify.."}
                      } else return {error: "Could not connect.."}
                  })
              }

           }
       },
       remove_wallet: {
           type: RemoveType,
           args: {
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
               wallet_id: {type: GraphQLString}
           }, 
           resolve(parent, args){
               let wallet = Wallet.findOne({_id: args.wallet_id})
               return wallet.then(x => {
                if(x!==undefined){
                    return fetch('https://graphql.voilk.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if(res.data.auth_active!==null)
                        {
                            let pb = res.data.auth_active.authenticated;
                            if(pb){
                                if(x.username==args.username&&!x.verified){
                                    return Wallet.deleteOne({_id: args.wallet_id})
                                }
                                else return {error: "You cannot delete this wallet.."}
                            } else return {error: "Could not verify.."}
                        } else return {error: "Could not connect.."}
                    })
                } else return {error: "Wallet does not exist.."}
               })
           }
       },
       verify_wallet: {
        type: RemoveType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            wallet_id: {type: GraphQLString}
        }, 
        resolve(parent, args){
            if(args.username!=="bilalhaider") return {error: "Only an admin can verify"}
            let wallet = Wallet.findOne({_id: args.wallet_id})
            return wallet.then(x => {
             if(x!==undefined){
                 return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                 })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.auth_active!==null)
                     {
                         let pb = res.data.auth_active.authenticated;
                         if(pb){
                            return Wallet.updateOne({_id: args.wallet_id}, { 
                                $set:
                                {
                                    verified: true
                                }
                             })
                         } else return {error: "Could not verify.."}
                     } else return {error: "Could not connect.."}
                 })
             } else return {error: "Wallet does not exist.."}
            })
        }
       },
       unverify_wallet: {
        type: RemoveType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            wallet_id: {type: GraphQLString}
        }, 
        resolve(parent, args){
            if(args.username!=="bilalhaider") return {error: "Only an admin can verify"}
            let wallet = Wallet.findOne({_id: args.wallet_id})
            return wallet.then(x => {
             if(x!==undefined){
                 return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                 })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.auth_active!==null)
                     {
                         let pb = res.data.auth_active.authenticated;
                         if(pb){
                            return Wallet.updateOne({_id: args.wallet_id}, { 
                                $set:
                                {
                                    verified: false
                                }
                             })
                         } else return {error: "Could not verify.."}
                     } else return {error: "Could not connect.."}
                 })
             } else return {error: "Wallet does not exist.."}
            })
        }
       },
       get_user_wallets: {
           type: WalletPaginateType,
           args: {
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
               page: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){
               const {username, wif, page, limit} = args;

               return fetch('https://graphql.voilk.com/graphql', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ query: '{ auth_active(username: "'+username+'", wif: "'+wif+'") { authenticated }}' }),
               })
               .then(res => res.json())
               .then(res => {
                   if(res.data.auth_active!==null)
                   {
                       let pb = res.data.auth_active.authenticated;
                       if(pb){
                        var options = {
                            sort:     { created_at: -1 },
                            page:     page,
                            limit:    limit
                          };
                        return Wallet.paginate({username: username},options).then(result => {
                                return result;
                            })
                       } else return {error: "Could not verify.."}
                   } else return {error: "Could not connect.."}
               })
           }
       },
       create_cash_order: {
           type: CashRequestType,
           args: {
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
               type: {type: GraphQLString},
               method: {type: GraphQLString},
               amount: {type: GraphQLInt},
               price: {type: GraphQLString}
           },
           resolve(parent, args){

               const { type, method, amount, price } = args
               if(type!=="BUY"||type!=="SELL"){
                   return {error: "Invalid order type"}
               } 

               if(method!=="Skrill"||method!=="Perfectmoney"||method!=="Webmoney"||method!="Bitcoin"||method!=="BitcoinCash"){
                   return {error: "Invalid payment method"}
               }

               if((amount<5||amount>1000)&&(type=="BUY")&&(method=="Skrill"||method=="Perfectmoney"||method=="Webmoney")){
                 return {error: "Order must be between 5$ and 1000$"}
               }
               
               if((amount<0.0005||amount>10)&&(type=="BUY")&&(method=="Bitcoin")){
                return {error: "Order must be between 0.0005 BTC and 10 BTC"}
               }

               if((amount<0.02||amount>100)&&(type=="BUY")&&(method=="BitcoinCash")){
                return {error: "Order must be between 0.02 BCH and 100 BCH"}
               }

               if((amount<50000||amount>100000)&&(type=="SELL")&&(method=="Skrill"||method=="Perfectmoney"||method=="Webmoney")){
                return {error: "Order must be between 50000 VOILK and 100000 VOILK via FIAT"}
               }
               if((amount<5000||amount>100000)&&(type=="SELL")&&(method=="Bitcoin"||method=="BitcoinCash")){
                return {error: "Order must be between 5000 VOILK and 100000 VOILK via crypto"}
               }

               return fetch('https://graphql.voilk.com/graphql', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
               })
               .then(res => res.json())
               .then(res => {
                   if(res.data.auth_active!==null)
                   {
                       let pb = res.data.auth_active.authenticated;
                       if(pb){
                           
                       } else return {error: "Could not verify.."}
                   } else return {error: "Could not connect.."}
               })
           }
       },
       get_product_by_id: {
           type: ProductType,
           args: {
               product_id: {type: GraphQLString}
           },
           resolve(parent, args){
               return Product.findOne({_id: args.product_id})
           }
       },
       get_user_product_by_id: {
        type: ProductType,
        args: {
            product_id: {type: GraphQLString},
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            return Product.findOne({_id: args.product_id, username: args.username})
        }
       },
       get_products_of_shop: {
           type: ProductPaginateType,
           args: {
               shop_id: {type: GraphQLString},
               page: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };
            return Product.paginate({shop_id: args.shop_id},options).then(result => {
                    return result;
                })
           }
       },
       get_user_products_of_shop: {
        type: ProductPaginateType,
        args: {
            shop_id: {type: GraphQLString},
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Product.paginate({shop_id: args.shop_id, username: args.username},options).then(result => {
                 return result;
             })
        }
       },
       get_products_of_user: {
        type: ProductPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt},
            status: {type: GraphQLString}
        },
        resolve(parent, args){
         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Product.paginate({username: args.username, status: args.status},options).then(result => {
                 return result;
             })
        }
       },
       create_a_product: {
        type: ProductType,
        args: {
           username: {type: GraphQLString},
           wif: {type: GraphQLString},
           username: {type: GraphQLString},
           shop_id: {type: GraphQLString},
    
           title: {type: GraphQLString},
           category: {type: GraphQLString},
           subcategory: {type: GraphQLString},
    
           short_description: {type: GraphQLString},
           long_description: {type: GraphQLString},
           details:{type: GraphQLString},
           video_link:{type: GraphQLString},
           price: {type: GraphQLInt},
           attain_options: {type: GraphQLString},

           discount_percentage: {type: GraphQLInt},
           shipping_cost: {type: GraphQLInt},
           available_quantity: {type: GraphQLInt},
           
           brand: {type: GraphQLString},
           image1: {type: GraphQLString},
           image2: {type: GraphQLString},
           image3: {type: GraphQLString},
           image4: {type: GraphQLString},
           image5: {type: GraphQLString},
           image6: {type: GraphQLString},

           color1: {type: GraphQLString},
           color2: {type: GraphQLString},
           color3: {type: GraphQLString},
           color4: {type: GraphQLString},
           color5: {type: GraphQLString},
           color6: {type: GraphQLString},
           tags: {type: GraphQLString}
        }, 
        resolve(parent, args){

            let colors = [args.color1, args.color2, args.color3, args.color4, args.color5, args.color6];
            let images = [args.image1, args.image2, args.image3, args.image4, args.image5, args.image6];
            let tags = args.tags;
            let attain_options = JSON.parse(args.attain_options);
            args.attain_options = attain_options;

           return productValidationSchema.isValid(args).then(valid => {
               if(valid){

                if(/^[a-z][a-z\s]*$/.test(tags)==false){
                    return {error: "Tags can only contain small letters and spaces"}
                }
                else{
                    tags = tags.split(" ");
                    tags = tags.filter(function (el) { return el!="" })
                }
                let tags_length = tags.length;
                if(tags_length>5||tags_length<0){
                    return {error: "A Product must have at least 1 upto 5 tags"}
                }
                let shop = Shop.findOne({_id: args.shop_id})
                return shop.then(sh => {
                    if(sh._id!==null){
                        return fetch('https://graphql.voilk.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                        })
                        .then(res => res.json())
                        .then(res => {
                            if(res.data.auth_active!==null)
                            {
                                let pb = res.data.auth_active.authenticated;
                                let currentDate = new Date(); 
                                let productID = generate_random_password("ITEM");                 
                                if(pb){
                                    
                                    return fetch('https://graphql.voilk.com/graphql', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
                                    })
                                    .then(res => res.json())
                                    .then(res => {
                                        if(res.data.is_profile_exists!==null)
                                        {
                                            if(res.data.is_profile_exists.result==true)
                                            {
                                                
                                                // get costing properties
                                                    return fetch('https://graphql.voilk.com/graphql', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ query: '{ get_costing_properties(limit: 1) { job_response_cost }}' }),
                                                    })
                                                    .then(res => res.json())
                                                    .then(res => {
                                                        if(res.data.get_costing_properties!==null)
                                                        {
                                                            let cost = parseFloat(res.data.get_costing_properties[0].job_response_cost.split(" ")[0]);
                                                            let productCost = res.data.get_costing_properties[0].job_response_cost;
                                                            
                                                            return fetch('https://graphql.voilk.com/graphql', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ query: '{ account (name: "'+args.username+'") { balance vsd_balance active { key_auths} }}' }),
                                                            })
                                                            .then(res => res.json())
                                                            .then(res => {
                                                                if(res.data.account!==null)
                                                                {
                                                                    let bal = res.data.account.balance;
                                                                    let bal_value = parseFloat(bal.split(" ")[0]);
                                                                    let memo = productID;
     
                                                                    if(bal_value<cost){
                                                                        return {error: "You don't have enough Voilk to list a product."}
                                                                    }
                                                                    //transfer cost
                                                                    return fetch('https://graphql.voilk.com/graphql', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ query: '{ transfer(from: "'+args.username+'", wif: "'+args.wif+'", to: "voilk", amount: "'+productCost+'", memo:"'+memo+'") { result transaction_id }}' }),
                                                                    })
                                                                    .then(res => res.json())
                                                                    .then(res => {
                                                                        if(res.data.transfer!==null)
                                                                        {
                                                                            let result = res.data.transfer.result;
                                                                            let shippingcost,shippingcost_value;
                                                                            if(args.shipping_cost==undefined) 
                                                                            {
                                                                                shippingcost = null
                                                                                shippingcost_value = null
                                                                            }
                                                                            else {
                                                                                shippingcost = parseFloat(args.shipping_cost).toFixed(3);
                                                                                shippingcost_value = parseFloat(args.shipping_cost).toFixed(3).toString() + " VOILK"
                                                                            }
                                                                            if(result){
                                                                            let nProduct = new Product({
                                                                                 _id: productID,
                                                                                 username: args.username, 
                                                                                 status: "Open",
                                                                                 shop_id: args.shop_id,
                                                                             
                                                                                 title: args.title,
                                                                                 brand: args.brand,
     
                                                                                 category: args.category,
                                                                                 subcategory: args.subcategory,
                                                                             
                                                                                 short_description: args.short_description,
                                                                                 long_description: args.long_description,
                                                                                 details:args.details,
                                                                                 video_link:args.video_link,
                                                                                 price: parseFloat(args.price).toFixed(3),
                                                                                 price_value: parseFloat(args.price).toFixed(3).toString() + " VOILK",
                                                                                 discount_percentage: args.discount_percentage,
                                                                                 attain_options: attain_options,
                                                                                 images: images,
                                                                                 colors: colors,
                                                                                 shipping_cost: shippingcost,
                                                                                 shipping_cost_value: shippingcost_value,
                                                                                 free_shipping: parseFloat(args.shipping_cost).toFixed(3)<=0?true:false,
                                                                                 available_quantity: args.available_quantity,
                                                                                 lock: 0,
                                                                                 tags: tags,
                                                                                 created_at: currentDate,
                                                                                 updated_at: currentDate
                                                                            });
                                                                            return nProduct.save();
                                                                           }
                                                                           else return {error: "Could not Pay for creation.."}
                                                                        }
                                                                        else return {error: "Could not Connect.."}
                                                                    })
     
                                                                
                                                                }
                                                                else return {error: "Could not Connect.."}
                                                            })
     
     
                                                        } else return {error: "Could not Connect.."}
                                                    })
                                            }
                                            else return {error: "Could not verify.."}
                                        }
                                        else return {error: "Could not Connect.."}
                                    })
     
                                } else return {error: "Could not verify"}
                            } else return {error: "Could not connect.."}
                        })
                    }else return {error: "You cannot add product to non-existent shop"}
                })

                   
               }
               else return {error: "Invalid data."}
           })
        }
       },
       update_a_product: {
       type: RemoveType,
       args: {
           username: {type: GraphQLString},
           wif: {type: GraphQLString},
           shop_id: {type: GraphQLString},
           title: {type: GraphQLString},
           category: {type: GraphQLString},
           short_description: {type: GraphQLString},
           logo: {type: GraphQLString},
           cover_photo: {type: GraphQLString}
        }, 
        resolve(parent, args){
           return shopValidationSchema.isValid(args).then(valid => {
               if(valid){

                   let shop = Shop.findOne({_id: args.shop_id});
                   return shop.then(sh => {
                       if(sh._id!==null&&sh.username==args.username){

                           return fetch('https://graphql.voilk.com/graphql', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                           })
                           .then(res => res.json())
                           .then(res => {
                               if(res.data.auth_active!==null)
                               {
                                   let pb = res.data.auth_active.authenticated;
                                   let currentDate = new Date(); 
                                   if(pb){
                                       return Shop.updateOne({
                                           _id: args.shop_id
                                       },
                                       {$set: {
                                           title: args.title,
                                           category: args.category,
                                           short_description: args.short_description,
                                           logo: args.logo,
                                           cover_photo: args.cover_photo, 
                                           updated_at: currentDate}}
                                       );
                                   }else return {error: "Could not verify"}
                               }
                               else return {error: "Could not connect.."}
                           })
                       }
                       else return {error: "Shop does not exist or you can't change it."}
                   })

               }  
               else return {error: "Invalid data provided.."}
           })
       }
       },
       get_user_shops: {
        type: ShopPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Shop.paginate({username: args.username},options).then(result => {
                 return result;
             })
            
        }
       },
       get_shop_by_id: {
        type: ShopType,
        args: {
            shop_id: {type: GraphQLString}
        },
        resolve(parent, args){
            return Shop.findOne({_id: args.shop_id});
        }
       },
       create_a_shop: {
         type: ShopType,
         args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            title: {type: GraphQLString},
            category: {type: GraphQLString},
            short_description: {type: GraphQLString},
            logo: {type: GraphQLString},
            cover_photo: {type: GraphQLString}
         }, 
         resolve(parent, args){
            return shopValidationSchema.isValid(args).then(valid => {
                if(valid){
                    return fetch('https://graphql.voilk.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if(res.data.auth_active!==null)
                        {
                            let pb = res.data.auth_active.authenticated;
                            let currentDate = new Date(); 
                            let shopID = generate_random_password("SHOP");                 
                            if(pb){
                                
                                return fetch('https://graphql.voilk.com/graphql', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
                                })
                                .then(res => res.json())
                                .then(res => {
                                    if(res.data.is_profile_exists!==null)
                                    {
                                        if(res.data.is_profile_exists.result==true)
                                        {
                                            
                                            // get costing properties
                                                return fetch('https://graphql.voilk.com/graphql', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ query: '{ get_costing_properties(limit: 1) { job_response_cost }}' }),
                                                })
                                                .then(res => res.json())
                                                .then(res => {
                                                    if(res.data.get_costing_properties!==null)
                                                    {
                                                        let cost = parseFloat(res.data.get_costing_properties[0].job_response_cost.split(" ")[0]);
                                                        let shopCost = res.data.get_costing_properties[0].job_response_cost;
                                                        
                                                        return fetch('https://graphql.voilk.com/graphql', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ query: '{ account (name: "'+args.username+'") { balance vsd_balance active { key_auths} }}' }),
                                                        })
                                                        .then(res => res.json())
                                                        .then(res => {
                                                            if(res.data.account!==null)
                                                            {
                                                                let bal = res.data.account.balance;
                                                                let bal_value = parseFloat(bal.split(" ")[0]);
                                                                let memo = shopID;

                                                                if(bal_value<cost){
                                                                    return {error: "You don't have enough Voilk to create a job."}
                                                                }
                                                                //transfer cost
                                                                return fetch('https://graphql.voilk.com/graphql', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ query: '{ transfer(from: "'+args.username+'", wif: "'+args.wif+'", to: "voilk", amount: "'+shopCost+'", memo:"'+memo+'") { result transaction_id }}' }),
                                                                })
                                                                .then(res => res.json())
                                                                .then(res => {
                                                                    if(res.data.transfer!==null)
                                                                    {
                                                                        let result = res.data.transfer.result;
                                                                        if(result){
                                                                        let nShop = new Shop({
                                                                            _id: shopID,
                                                                            username: args.username, 
                                                                            status: "Open",
                                                                            title: args.title,
                                                                            short_description: args.short_description,
                                                                            category: args.category,
                                                                            logo: args.logo,
                                                                            cover_photo: args.cover_photo,
                                                                            lock: 0,
                                                                            created_at: currentDate,
                                                                            updated_at: currentDate
                                                                        });
                                                                        return nShop.save();
                                                                       }
                                                                       else return {error: "Could not Pay for creation.."}
                                                                    }
                                                                    else return {error: "Could not Connect.."}
                                                                })

                                                            
                                                            }
                                                            else return {error: "Could not Connect.."}
                                                        })


                                                    } else return {error: "Could not Connect.."}
                                                })
                                        }
                                        else return {error: "Could not verify.."}
                                    }
                                    else return {error: "Could not Connect.."}
                                })

                            } else return {error: "Could not verify"}
                        } else return {error: "Could not connect.."}
                    })
                }
                else return {error: "Invalid data."}
            })
         }
       },
       update_a_shop: {
        type: RemoveType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            shop_id: {type: GraphQLString},
            title: {type: GraphQLString},
            category: {type: GraphQLString},
            short_description: {type: GraphQLString},
            logo: {type: GraphQLString},
            cover_photo: {type: GraphQLString}
         }, 
         resolve(parent, args){
            return shopValidationSchema.isValid(args).then(valid => {
                if(valid){

                    let shop = Shop.findOne({_id: args.shop_id});
                    return shop.then(sh => {
                        if(sh._id!==null&&sh.username==args.username){

                            return fetch('https://graphql.voilk.com/graphql', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                            })
                            .then(res => res.json())
                            .then(res => {
                                if(res.data.auth_active!==null)
                                {
                                    let pb = res.data.auth_active.authenticated;
                                    let currentDate = new Date(); 
                                    if(pb){
                                        return Shop.updateOne({
                                            _id: args.shop_id
                                        },
                                        {$set: {
                                            title: args.title,
                                            category: args.category,
                                            short_description: args.short_description,
                                            logo: args.logo,
                                            cover_photo: args.cover_photo, 
                                            updated_at: currentDate}}
                                        );
                                    }else return {error: "Could not verify"}
                                }
                                else return {error: "Could not connect.."}
                            })
                        }
                        else return {error: "Shop does not exist or you can't change it."}
                    })

                }  
                else return {error: "Invalid data provided.."}
            })
        }
       },
       get_files: {
         type: new GraphQLList(FileType),
         resolve(parent, args){
             return new Promise((resolve, reject) => {
                gfs.files.find().limit(100).sort({uploadDate: -1}).toArray((err, files) => {
                    resolve(files);
                 })
             })
         }
       },
       get_file_by_name: {
           type: FileType,
           args: {filename: {type: GraphQLString}},
           resolve(parent, args){
               return new Promise((resolve, reject) => {
                gfs.files.findOne({ filename: args.filename }, (err, file) => {
                    resolve(file);
                })
               })
           }
       },
       get_files_of_user: {
        type: new GraphQLList(FileType),
        args: {username: {type: GraphQLString}},
        resolve(parent, args){
            return new Promise((resolve, reject) => {
             gfs.files.find({ username: args.username }).limit(100).sort({uploadDate: -1}).toArray((err, files) => {
                 resolve(files);
             })
            })
        }
       },
       delete_file: {
           type: BoolType,
           args: {
               file_id: {type: GraphQLString},
               username: {type: GraphQLString},
               wif: {type: GraphQLString},
           },
           resolve(parent, args){

            let exiting = new Promise((resolve, reject) => {
                gfs.exist({ _id: args.file_id, username: args.username, root: 'uploads' }, function (err, found) {
                    if (err) return handleError(err);
                    resolve(found);
                  });
            })

               return exiting.then(ss => {

                if(!ss){
                    return {result: false, error: "File does not exist.."}
                }

                return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
                })
                .then(res => res.json())
                .then(res => {
                    let data = res.data.account;
                    if(data!==null)
                    {
                    let pb = data.posting.key_auths[0][0];
                    let u = data.name;
                    let e = verifykey(args.wif, pb);
                    if (e==true&&u==args.username)
                    {
                        return new Promise((resolve, reject) => {
                            gfs.remove({ _id: args.file_id, root: 'uploads' }, (err, gridStore) => {
                            if (err) {
                                reject({result: false, error: "Could not delete.."})
                            }
                        
                            resolve({result: true, error: "Deleted successfully.."})
                            });
                        })
                    } else return {result: false, error: "could not verify..."}
                    } else return {result: false, error: "error.."}
                    
                    })

                
            })
           }
       },
       create_a_response: {
           type: ResponseType,
           args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            job_id: {type: GraphQLString},
            response_body: {type: GraphQLString},
           },
           resolve(parent, args){

            // check whvoilk or not job profile exists
            let response_id = generate_random_password("RSP");
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
            })
            .then(res => res.json())
            .then(res => {
                if(res.data.is_profile_exists!==null)
                {
                    if(res.data.is_profile_exists.result==true)
                    {
                        // check whvoilk or not job exists
                        return fetch('https://graphql.voilk.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ get_job_by_id(job_id: "'+args.job_id+'") { _id username }}' }),
                         })
                        .then(res => res.json())
                        .then(res => {
                            if(res.data.get_job_by_id!==null)
                            {
                                let jobID = res.data.get_job_by_id._id;
                                let username = res.data.get_job_by_id.username;

                                // check whvoilk or not the response creator is a job creator
                                if (args.username == username)
                                {
                                    return {error: "You cannot respond to your own Job.."}
                                }
                                wait(3000);
                                // check whvoilk or not a response was already posted.
                                return fetch('https://graphql.voilk.com/graphql', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ query: '{ get_response_of_job(username: "'+args.username+'", job_id: "'+args.job_id+'") { _id username }}' }),
                                })
                                .then(res => res.json())
                                .then(res => {
                                    if(res.data.get_response_of_job===null)
                                    {
                                        
                                        // get costing properties
                                        return fetch('https://graphql.voilk.com/graphql', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ query: '{ get_costing_properties(limit: 1) { job_response_cost }}' }),
                                        })
                                        .then(res => res.json())
                                        .then(res => {
                                            if(res.data.get_costing_properties!==null)
                                            {
                                                let cost = parseFloat(res.data.get_costing_properties[0].job_response_cost.split(" ")[0]);
                                                let responseCost = res.data.get_costing_properties[0].job_response_cost;
                                                
                                                // get user's balance and verify auth
                                                return fetch('https://graphql.voilk.com/graphql', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ query: '{ account (name: "'+args.username+'") { balance vsd_balance active { key_auths} }}' }),
                                                })
                                                .then(res => res.json())
                                                .then(res => {
                                                    if(res.data.account!==null)
                                                    {
                                                        let bal = res.data.account.balance;
                                                        let bal_value = parseFloat(bal.split(" ")[0]);
                                                        let memo = response_id;

                                                        if(bal_value<cost){
                                                            return {error: "You don't have enough Voilk to create a job."}
                                                        }

                                                        let pb = res.data.account.active.key_auths[0][0];
                                                        let e = verifykey(args.wif, pb);
                                                        if (e==true)
                                                        {
                                                            //transfer cost
                                                            return fetch('https://graphql.voilk.com/graphql', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ query: '{ transfer(from: "'+args.username+'", wif: "'+args.wif+'", to: "voilk", amount: "'+responseCost+'", memo:"'+memo+'") { result transaction_id }}' }),
                                                            })
                                                            .then(res => res.json())
                                                            .then(res => {
                                                                if(res.data.transfer!==null)
                                                                {
                                                                    let result = res.data.transfer.result;
                                                                    let currentDate = new Date();
                                                                    if(result){
                                                                        let nResponse = new Response({
                                                                            _id: response_id,
                                                                            username: args.username,
                                                                            job_id: args.job_id,
                                                                            response_body: args.response_body,
                                                                            status: "Awaiting Payment",
                                                                            lock: 0,
                                                                            created_at: currentDate,
                                                                            updated_at: currentDate
                                                                        });
                                            
                                                                        return nResponse.save();
                                                                    }
                                                                    else return {error: "We could not transfer the fee.."}
                                                                }
                                                                else return {error: "We could not pay the fee.."}
                                                            })

                                                        }
                                                        else return {error: "Authorization failed.."}
                                                    }
                                                    else return {error: "There was an error!!"}
                                                })


                                            }
                                            else return {error: "There was an error!!"}
                                        })
                                    }
                                    else return {error: "You have Already responded to this job!!"}
                                })
                            }
                            else return {error: "Job does not exist!!"}
                        })
                    }
                    else return {error: "Job Profile does not exist for the user!!"}
                }
                else return {error: "There was an error!!"}
            })


           }
       },
       create_a_job: {
           type: JobType,
           args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            title: {type: GraphQLString},
            instructions: {type: GraphQLString},
            discussion_url: {type: GraphQLString},
            tags: {type: GraphQLString},
            pay_per_job: {type: GraphQLString},
            time_required: {type: GraphQLInt},
            responses_required: {type: GraphQLInt}
           },
           resolve(parent, args){
            let ppt = args.pay_per_job.split(" ")[0];
            let sym = args.pay_per_job.split(" ")[1];
            let job_id = generate_random_password("JOB");

            let responses_count = parseInt(args.responses_required);
            let response_cost = parseFloat(ppt);
            let total_budget = response_cost * responses_count;
            let duration = parseInt(args.time_required);

            let title_length = args.title.length;
            let instructions_length = args.instructions.length;
            let tags = args.tags;

            if(/^[a-zA-Z][\w\-\.\s]*$/.test(args.title)==false){
                return {error: "Title can only consist upon letters, numbers, spaces, (-) and (.) "}
            }

            if(/^[a-z][a-z\s]*$/.test(tags)==false){
                return {error: "Tags can only contain small letters and spaces"}
            }
            else{
                tags = tags.split(" ");
                tags = tags.filter(function (el) { return el!="" })
            }
            let tags_length = tags.length;
            if(tags_length>5||tags_length<1){
                return {error: "A job can have at least 1 and maximum 5 tags"}
            }
            
            let category = tags[0];

            if(sym!=="VOILK"){
                return {error: "Cannot accept that currency for payment"}
            }
            
            if(duration<3){
                return {error: "Cannot create a job with less than 3 minutes duration"}
            }

            if(title_length >150 || title_length < 10){
                return {error: "Job's title cannot contain fewer than 10 or more than 150 letters. "}
            }

            if(instructions_length > 10000 || instructions_length < 50) {
                return {error: "Instructions cannot contain fewer than 200 or more than 10k letters."}
            }

            // check if user profile exists
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
            })
            .then(res => res.json())
            .then(res => {
                if(res.data.is_profile_exists!==null)
                {
                    if(res.data.is_profile_exists.result==true)
                    {
                        // get costing properties
                        return fetch('https://graphql.voilk.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ get_costing_properties(limit: 1) { job_creation_cost }}' }),
                        })
                        .then(res => res.json())
                        .then(res => {
                            if(res.data.get_costing_properties!==null)
                            {
                                let cost = parseFloat(res.data.get_costing_properties[0].job_creation_cost.split(" ")[0]);
                                let jobCost = res.data.get_costing_properties[0].job_creation_cost;
                                
                                wait(3000);
                                // get user's balance and verify auth
                                return fetch('https://graphql.voilk.com/graphql', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ query: '{ account (name: "'+args.username+'") { balance vsd_balance active { key_auths} }}' }),
                                })
                                .then(res => res.json())
                                .then(res => {
                                    if(res.data.account!==null)
                                    {
                                        let bal = res.data.account.balance;
                                        let bal_value = parseFloat(bal.split(" ")[0]);
                                        let memo = job_id;

                                        if(bal_value<cost){
                                            return {error: "You don't have enough Voilk to create a job."}
                                        }

                                        let pb = res.data.account.active.key_auths[0][0];
                                        let e = verifykey(args.wif, pb);
                                        if (e==true)
                                        {
                                            //transfer cost
                                            return fetch('https://graphql.voilk.com/graphql', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ query: '{ transfer(from: "'+args.username+'", wif: "'+args.wif+'", to: "voilk", amount: "'+jobCost+'", memo:"'+memo+'") { result transaction_id }}' }),
                                            })
                                            .then(res => res.json())
                                            .then(res => {
                                                if(res.data.transfer!==null)
                                                {
                                                    let result = res.data.transfer.result;
                                                    let currentDate = new Date();
                                                    let nextDate = new Date(currentDate);
                                                    let expiration = 3;
                                                    let nDate = nextDate.setDate(nextDate.getDate()+expiration);
                                                    if(result){
                                                        let nJob = new Job({
                                                            _id: job_id,
                                                            username: args.username,
                                                            job_title: args.title,
                                                            job_instructions: args.instructions,
                                                            job_discussion_url: args.discussion_url,
                                                            job_time_required: duration,
                                                            lock: 0,
                                                            tags: tags,
                                                            category: category,
                                                            pay_per_job: args.pay_per_job,
                                                            pay_per_job_value: parseFloat(ppt).toFixed(3),
                                                            responses_required: args.responses_required,
                                                            total_budget: total_budget.toFixed(3) + " VOILK",
                                                            total_budget_value: total_budget.toFixed(3),
                                                            status: "Active",
                                                            cancel_before: nDate,
                                                            created_at: currentDate,
                                                            updated_at: currentDate
                                                      });
                              
                                                      return nJob.save();
                                                    }
                                                    else return {error: "We could not transfer the fee.."}
                                                }
                                                else return {error: "We could not pay the fee.."}
                                            })

                                        }
                                        else return {error: "Authorization failed.."}
                                    }
                                    else return {error: "There was an error!!"}
                                })


                            }
                            else return {error: "There was an error!!"}
                        })

                    }
                    else return {error: "Job Profile does not exist for the user!!"}
                }
                else return {error: "There was an error!!"}
            })

           }
       },
       get_user_responses: {
        type: ResponsePaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Response.paginate({username: args.username},options).then(result => {
                 return result;
             })
            
        }
       },
       get_user_jobs: {
           type: JobPaginateType,
           args: {
               username: {type: GraphQLString},
               page: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){

            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };
            return Job.paginate({username: args.username},options).then(result => {
                    return result;
                })
               
           }
       },
       get_user_ratings_received: {
        type: RatingPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Rating.paginate({to: args.username},options).then(result => {
                 return result;
             })
            
        }
       },
       get_user_ratings_given: {
        type: RatingPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Rating.paginate({from: args.username},options).then(result => {
                 return result;
             })
            
        }
       },
       get_job_ratings: {
        type: RatingPaginateType,
        args: {
            job_id: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Rating.paginate({job_id: args.job_id},options).then(result => {
                 return result;
             })
            
        }
       },
       get_response_ratings: {
        type: RatingPaginateType,
        args: {
            response_id: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Rating.paginate({response_id: args.response_id},options).then(result => {
                 return result;
             })
            
        }
       },
       get_user_active_jobs: {
        type: JobPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Job.paginate({username: args.username, status: "Active"},options).then(result => {
                 return result;
             })
            
        }
       },
       get_user_archived_jobs: {
        type: JobPaginateType,
        args: {
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };
         return Job.paginate({username: args.username, status: "Archived"},options).then(result => {
                 return result;
             })
            
        }
       },
       get_user_jobs_by_title: {
        type: JobPaginateType,
        args: {
            title: {type: GraphQLString},
            username: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            let exp = new RegExp(args.title, "i")
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };

               
            return Job.paginate({job_title: { $regex:  exp},username: args.username},options).then(result => {
                    return result;
                })
            
        }
       },
       get_job_by_id: {
        type: JobType,
        args: {
            job_id: {type: GraphQLString},
        },
        resolve(parent, args){

           return Job.findOne({_id: args.job_id});
                            
        }
       },
       get_response_by_id: {
        type: ResponseType,
        args: {
            response_id: {type: GraphQLString},
        },
        resolve(parent, args){

           return Response.findOne({_id: args.response_id});
                            
        }
       },
       get_response_of_job: {
        type: ResponseType,
        args: {
            username: {type: GraphQLString},
            job_id: {type: GraphQLString},
        },
        resolve(parent, args){
           return Response.findOne({username: args.username, job_id: args.job_id});
        }
       },
       get_responses_of_a_job: {
        type: ResponsePaginateType,
        args: {
            job_id: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };

               
            return Response.paginate({job_id: args.job_id},options).then(result => {
                    return result;
                })
        }
       },
       get_user_jobs_by_status: {
        type: new GraphQLList(JobType),
        args: {
            username: {type: GraphQLString},
            status: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {username: args.username, status: args.status}}, 
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_user_jobs_by_category: {
        type: JobPaginateType,
        args: {
            username: {type: GraphQLString},
            category: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            //
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };
            return Job.paginate({username: args.username, category: args.category},options).then(result => {
                    return result;
                })
            }
       },
       get_user_jobs_by_budget: {
        type: new GraphQLList(JobType),
        args: {
            username: {type: GraphQLString},
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {username: args.username, total_budget_value: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_user_jobs_by_pay: {
        type: new GraphQLList(JobType),
        args: {
            username: {type: GraphQLString},
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {username: args.username, pay_per_job_value: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_user_jobs_by_date: {
        type: new GraphQLList(JobType),
        args: {
            username: {type: GraphQLString},
            start: {type: GraphQLString},
            end: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

            let start = new Date(args.start);
            let end = new Date(args.end);

            return Job.aggregate([
                {$match: {username: args.username, created_at: {$gt: start, $lt: end}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_user_jobs_by_responses_required: {
        type: new GraphQLList(JobType),
        args: {
            username: {type: GraphQLString},
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {username: args.username, responses_required: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_active_jobs: {
        type: new GraphQLList(JobType),
        args: {
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         return Job.aggregate([
            {$sort:{created_at: -1}},
            { $limit : args.limit } ]); 

            
        }
       },
       get_popular_categories: {
           type: new GraphQLList(CountType),
           args: {
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){
               return Job.aggregate([
                {"$group" : {_id:"$category", count:{$sum:1}}},
                {$sort: {count: -1}},
                {$limit: args.limit},                
                ])
           }
       },
       get_highly_paying_jobs: {
           type: JobPaginateType,
           args: {
               page: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){

            var options = {
                sort:     { pay_per_job_value: -1 },
                page:     args.page,
                limit:    args.limit
              };

               
            return Job.paginate({},options).then(result => {
                    return result;
                })
           }
       },
       get_high_budget_jobs: {
        type: JobPaginateType,
        args: {
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { total_budget_value: -1 },
             page:     args.page,
             limit:    args.limit
           };

            
         return Job.paginate({},options).then(result => {
                 return result;
             })
        }
       },
       get_high_responses_jobs: {
        type: JobPaginateType,
        args: {
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { responses_required: -1 },
             page:     args.page,
             limit:    args.limit
           };

            
         return Job.paginate({},options).then(result => {
                 return result;
             })
        }
       },
       get_new_jobs: {
        type: JobPaginateType,
        args: {
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

         var options = {
             sort:     { created_at: -1 },
             page:     args.page,
             limit:    args.limit
           };

            
         return Job.paginate({},options).then(result => {
                 return result;
             })
        }
       },
       get_featured_jobs: {
           type: new GraphQLList(JobType),
           resolve(parent, args){
               return Job.aggregate([
                { $match: { status: "Active", featured: true } },
                { $sample: { size: 5 } }
            ])
           }
       },
       get_jobs_by_status: {
        type: new GraphQLList(JobType),
        args: {
            status: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {status: args.status}}, 
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_jobs_by_title: {
        type: JobPaginateType,
        args: {
            title: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            let exp = new RegExp(args.title, "i")
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };    
            return Job.paginate({job_title: { $regex:  exp}},options).then(result => {
                    return result;
                })
            
        }
       },
       get_jobs_by_tag: {
        type:JobPaginateType,
        args: {
            tag: {type: GraphQLString},
            page: {type: GraphQLInt},            
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            
            let exp = new RegExp(args.tag, "i")
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };    
            return Job.paginate({tags: { $regex:  exp}},options).then(result => {
                    return result;
                })
        }
       },
       get_jobs_by_category: {
        type: JobPaginateType,
        args: {
            category: {type: GraphQLString},
            page: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            var options = {
                sort:     { created_at: -1 },
                page:     args.page,
                limit:    args.limit
              };    
            return Job.paginate({category: args.category},options).then(result => {
                    return result;
                })
        }
       },
       get_jobs_by_budget: {
        type: new GraphQLList(JobType),
        args: {
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {total_budget_value: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_jobs_by_pay: {
        type: new GraphQLList(JobType),
        args: {
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {pay_per_job_value: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_jobs_by_date: {
        type: new GraphQLList(JobType),
        args: {
            start: {type: GraphQLString},
            end: {type: GraphQLString},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){

            let start = new Date(args.start);
            let end = new Date(args.end);

            return Job.aggregate([
                {$match: {created_at: {$gt: start, $lt: end}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_jobs_by_duration: {
        type: new GraphQLList(JobType),
        args: {
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {responses_required: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       get_jobs_by_responses_required: {
        type: new GraphQLList(JobType),
        args: {
            min: {type: GraphQLInt},
            max: {type: GraphQLInt},
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Job.aggregate([
                {$match: {responses_required: {$gt: args.min, $lt: args.max}}},
                {$sort:{created_at: -1}},
                { $limit : args.limit } ]); 
        }
       },
       is_job_rated_by_user: {
        type: BoolType,
        args: {
            username: {type: GraphQLString},
            job_id: {type: GraphQLString},
        },
        resolve(parent, args){
            let usr = Rating.find({from: args.username, job_id: args.job_id});
            return usr.then(user => {
                if(user.length==0){
                  return {result: false, error: args.username + " has not rated this job.."}
                }
                else return {result: true, error: "Yes "+args.username+" has rated this job.."}
            })
        }
       },
       is_response_rated_by_user: {
        type: BoolType,
        args: {
            username: {type: GraphQLString},
            response_id: {type: GraphQLString},
        },
        resolve(parent, args){
            let usr = Rating.find({from: args.username, response_id: args.response_id});
            return usr.then(user => {
                if(user.length==0){
                  return {result: false, error: args.username + " has not rated this response.."}
                }
                else return {result: true, error: "Yes "+args.username+" has rated this response.."}
            })
        }
       },
       is_user_rated_by_user: {
        type: BoolType,
        args: {
            from: {type: GraphQLString},
            to: {type: GraphQLString},
        },
        resolve(parent, args){
            let usr = Rating.find({from: args.from, to: args.to, response_id: null, job_id: null});
            return usr.then(user => {
                if(user.length==0){
                  return {result: false, error: args.from + " has not rated " + args.to}
                }
                else return {result: true, error: "Yes "+args.from+" has rated " + args.to}
            })
        }
       },
       rate_a_job: {
        type: RatingType,
        args: {
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            to: {type: GraphQLString},
            job_id: {type: GraphQLString},
            rating: {type: GraphQLInt},
            message: {type: GraphQLString},
        },
        resolve(parent, args){
           let rating_id = generate_random_password("RATE");

           if(args.from == args.to ){
               return {error: "You cannot rate yourself.."}
           }

           if(args.rating<=0||args.rating>5){
               return {error: "Rating can be 1 to 5 only.."}
           }
           // check whvoilk or not job exists
           return fetch('https://graphql.voilk.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ get_job_by_id(job_id: "'+args.job_id+'") { _id username }}' }),
           })
          .then(res => res.json())
          .then(res => {
            if(res.data.get_job_by_id!==null)
            {
                // check whvoilk or not job profile exists for the user
                return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.from+'") { result }}' }),
                 })
                .then(res => res.json())
                .then(res => {
                    if(res.data.is_profile_exists!==null)
                    {
                        if(res.data.is_profile_exists.result==true)
                        {
                            // check whvoilk or not job was already rated
                            return fetch('https://graphql.voilk.com/graphql', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: '{ is_job_rated_by_user(username: "'+args.from+'", job_id: "'+args.job_id+'") { result }}' }),
                            })
                            .then(res => res.json())
                            .then(res => {
                                if(res.data.is_job_rated_by_user!==null)
                                {
                                    
                                    if(res.data.is_job_rated_by_user.result==false)
                                    {
                                        // verify authority
                                        return fetch('https://graphql.voilk.com/graphql', {
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

                                                    // Check if Rating was posted already
                                                    let mRating = Rating.findOne({job_id: args.job_id});
                                                    return mRating.then(x => {
                                                        
                                                        if(x==null){
                                                            let nRating = new Rating({
                                                                _id: rating_id,
                                                                from: args.from,
                                                                to: args.to,
                                                                job_id: args.job_id,
                                                                response_id:  null,
                                                                rating: args.rating,
                                                                lock: 0,
                                                                rating_message: args.message,
                                                                created_at: currentDate,
                                                                updated_at: currentDate
                                                            });
                                                            wait(3000)
                                                            return nRating.save();
                                                        }
                                                        else {
                                                            return {error: "Rating was already posted.."}
                                                        }

                                                    })
                                                    
                                                }
                                                else return {error: "Could not verify account"};
                                            }
                                            else return {error: "Invalid account"};
                                        })
    
                                    }
                                    else return {error: "You already rated this job!!"}
                                }
                                else return {error: "There was an error!!"}
                            })
                        }
                        else return {error: "You need to create a profile first."}
                    } else return {error: "Error."}
                })

            }
            else return {error: "Job does not exist.."}
        })

           
        }
       },
       rate_a_response: {
        type: RatingType,
        args: {
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            to: {type: GraphQLString},
            job_id: {type: GraphQLString},
            response_id: {type: GraphQLString},
            rating: {type: GraphQLInt},
            message: {type: GraphQLString},
        },
        resolve(parent, args){
            let rating_id = generate_random_password("RATE");
 
            if(args.from == args.to ){
                return {error: "You cannot rate yourself.."}
            }
 
            if(args.rating<=0||args.rating>5){
                return {error: "Rating can be 1 to 5 only.."}
            }
            // Check whvoilk or not response exists
            let nRS = Response.findOne({_id: args.response_id})
            return nRS.then( sss => {
                if(nRS!=null){

                    // Check whvoilk or not job creator is rating the response.. 
                    let nJP = Job.findOne({_id: args.job_id})
                    return nJP.then(jjj => {
                        if(jjj!=null){
                            if(jjj.username == args.from){

                                // check whvoilk or not job exists
                                return fetch('https://graphql.voilk.com/graphql', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ query: '{ get_job_by_id(job_id: "'+args.job_id+'") { _id username }}' }),
                                })
                                .then(res => res.json())
                                .then(res => {
                                    if(res.data.get_job_by_id!==null)
                                    {
                                        // check whvoilk or not job profile exists for the user
                                        return fetch('https://graphql.voilk.com/graphql', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.from+'") { result }}' }),
                                        })
                                        .then(res => res.json())
                                        .then(res => {
                                            if(res.data.is_profile_exists!==null)
                                            {
                                                if(res.data.is_profile_exists.result==true)
                                                {
                                                    // check whvoilk or not job was already rated
                                                    return fetch('https://graphql.voilk.com/graphql', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ query: '{ is_response_rated_by_user(username: "'+args.from+'", response_id: "'+args.response_id+'") { result }}' }),
                                                    })
                                                    .then(res => res.json())
                                                    .then(res => {
                                                        if(res.data.is_response_rated_by_user!==null)
                                                        {
                                                            
                                                            if(res.data.is_response_rated_by_user.result==false)
                                                            {
                                                                // verify authority
                                                                return fetch('https://graphql.voilk.com/graphql', {
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
                        
                                                                            // Check if Rating was posted already
                                                                            let mRating = Rating.findOne({response_id: args.response_id});
                                                                            return mRating.then(x => {
                                                                                
                                                                                if(x==null){
                                                                                    let nRating = new Rating({
                                                                                        _id: rating_id,
                                                                                        from: args.from,
                                                                                        to: args.to,
                                                                                        job_id: args.job_id,
                                                                                        response_id: args.response_id,
                                                                                        rating: args.rating,
                                                                                        lock: 0,
                                                                                        rating_message: args.message,
                                                                                        created_at: currentDate,
                                                                                        updated_at: currentDate
                                                                                    });
                                                                                    wait(3000)
                                                                                    return nRating.save();
                                                                                }
                                                                                else {
                                                                                    return {error: "Rating was already posted.."}
                                                                                }
                        
                                                                            })
                                                                            
                                                                        }
                                                                        else return {error: "Could not verify account"};
                                                                    }
                                                                    else return {error: "Invalid account"};
                                                                })
                            
                                                            }
                                                            else return {error: "You already rated this job!!"}
                                                        }
                                                        else return {error: "There was an error!!"}
                                                    })
                                                }
                                                else return {error: "You need to create a profile first."}
                                            } else return {error: "Error."}
                                        })
                        
                                    }
                                    else return {error: "Job does not exist.."}
                                })

                            }
                            else return {error: "Only job creator can rate a response.."}

                        }
                        else return {error: "Job does not exist..."}
                    })

                }
                else return {error: "Response does not exist..."}
            })
 
            
        }
       },
       pay_for_response: {
           type: RemoveType,
           args: {
               wif: {type: GraphQLString},
               response_id: {type: GraphQLString}
           },
           resolve(parent, args){
               // check if response exists
               // check if it is already paid
               // update status of response
               // transfer amount
               let rpay = Response.findOne({_id: args.response_id})
               return rpay.then(rps => {
                   if(rps!=null){
                       let rStatus = rps.status;
                       let rPayee = rps.username;
                       let rID = rps._id;
                       let rJobid = rps.job_id;

                       if(rStatus=="Paid"){
                          return {error: "This Response was already paid.."}
                       }

                       let rJob = Job.findOne({_id: rJobid});
                       return rJob.then(rpj => {

                        
                        if(rpj!=null){

                            let rPayment = rpj.pay_per_job;
                            let rPayer = rpj.username;

                            wait(3000);
                            //transfer cost
                            return fetch('https://graphql.voilk.com/graphql', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: '{ transfer(from: "'+rPayer+'", wif: "'+args.wif+'", to: "'+rPayee+'", amount: "'+rPayment+'", memo:"'+rID+'") { result transaction_id }}' }),
                            })
                            .then(res => res.json())
                            .then(res => {
                                if(res.data.transfer!==null)
                                {
                                    let result = res.data.transfer.result;
                                    let currentDate = new Date();
                                    if(result){

                                    return Response.updateOne({
                                        _id: args.response_id
                                    },
                                    {$set: {status: "Paid", updated_at: currentDate}}
                                    );

                                    }
                                    else return {error: "We could not complete transaction.."}

                                }
                                else return {error: "We could not complete transaction.."}
                            
                            })
                        }
                        else return {error: "Job does not exist.."}
                       })
                   }
                   else return {error: "Response does not exist.."}
               })
           }
       },
       get_user_job_ratings: {
        type: new GraphQLList(RatingType),
        args: {
            username: {type: GraphQLString},
            job_id: {type: GraphQLString},
        },
        resolve(parent, args){
            return Rating.find({from: args.username, job_id: args.job_id}); 
        }
       },
       get_user_response_ratings: {
        type: new GraphQLList(RatingType),
        args: {
            username: {type: GraphQLString},
            response_id: {type: GraphQLString},
        },
        resolve(parent, args){
            return Rating.find({from: args.username, response_id: args.response_id}); 
        }
       },
       set_costing_properties: {
        type: CostType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            creation_cost: {type: GraphQLString},
            response_cost: {type: GraphQLString},
            feature_cost: {type: GraphQLString}
        },
        resolve(parent, args){
           let cost_id = generate_random_password("COSTID");
           
           if(args.username!=="bilalhaider")
           {
             return {error: "You can't set the cost.."}
           }
           
           return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;
 		            let currentDate = new Date();                  
                    if(pb){
                        let nCost = new Cost({
                                _id: cost_id,
                                username: args.username, 
                                job_creation_cost: args.creation_cost,
				                job_response_cost: args.response_cost,
				                job_feature_cost: args.feature_cost,
                                created_at: currentDate,
                                updated_at: currentDate
                          });
  
                          return nCost.save();
                    }
                    else return {error: "Could not verify account"};
                }
                else return {error: "Invalid account"};
            })
        }
       },
       get_costing_properties: {
        type: new GraphQLList(CostType),
        args: {
            limit: {type: GraphQLInt}
        },
        resolve(parent, args){
            return Cost.find().sort({created_at: -1}).limit(args.limit)
        }

       },
       delete_costing_properties: {
         type: RemoveType,
         args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            costing_id: {type: GraphQLString},
         },
         resolve(parent, args){
            if(args.username!=="bilalhaider")
            {
              return {error: "You can't delete the cost.."}
            }
            
            return fetch('https://graphql.voilk.com/graphql', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
              })
             .then(res => res.json())
             .then(res => {
                if(res.data.auth_active!==null)
                {
                     let pb = res.data.auth_active.authenticated;             
                     if(pb){
                        return Cost.deleteOne({_id: args.costing_id})
                         
                    }
                     else return {error: "You can't set the cost.."}
                }
             })
         }
       },
       is_profile_exists: {
        type: UserInfoType,
        args: {
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            let usr = Profile.findOne({username: args.username});
            return usr.then(user => {
                //console.log(user)
                if(user==null){
                  return {result: false, error: "Account does not exist.."};
                }
                else{
                    user.result = true;
                    user.error = "Account exists.." 
                    
                    return user;
                }
            })
        }

       },
       create_profile: {
        type: UserInfoType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString}
        },
        resolve(parent, args){
           let profile_id = generate_random_password("PRO");
           
           return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.is_profile_exists!==null)
                {
                    if(res.data.is_profile_exists.result==false)
                    {
                        return fetch('https://graphql.voilk.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                         })
                        .then(rest => rest.json())
                        .then(rest => {
                            if(rest.data.auth_active!==null)
                            {
                                let pb = rest.data.auth_active.authenticated;
                                let currentDate = new Date();                  
                                if(pb){
                                    let nProfile = new Profile({
                                            _id: profile_id,
                                            username: args.username, 
                                            status: "Active",
                                            lock: 0,
                                            created_at: currentDate,
                                            updated_at: currentDate
                                      });
              
                                      return nProfile.save();
                                }
                                else return {error: "Could not verify account"};
                            }
                            else return {error: "Invalid account"};
                        })
                    }
                    else return {error: "Cannot Create profile."}
                } else return {error: "Error."}
            })
        }
       },
       update_user_profile: {
           type: RemoveType,
           args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             full_name: {type: GraphQLString},
             phone: {type: GraphQLString},
             email: {type: GraphQLString},
             intro_video: {type: GraphQLString},
             address1: {type: GraphQLString},
             address2: {type: GraphQLString},
             country: {type: GraphQLString},
             city: {type: GraphQLString},
             postal_code: {type: GraphQLString},
             profile_image: {type: GraphQLString},
             cover_image: {type: GraphQLString},
             about: {type: GraphQLString}
           },
           resolve(parent, args){

            return profileValidationSchema.isValid(args).then(valid => {
                if(valid){
                    return fetch('https://graphql.voilk.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if(res.data.auth_active!==null)
                        {
                            let pb = res.data.auth_active.authenticated;
                            let currentDate = new Date();     
                            if(pb){
                                return Profile.updateOne({ username: args.username },
                                    {$set: {
                                        full_name: args.full_name,
                                        phone: args.phone,
                                        email: args.email,
                                        intro_video: args.intro_video,
                                        address1: args.address1,
                                        address2: args.address2,
                                        country: args.country,
                                        city: args.city,
                                        postal_code: args.postal_code,
                                        profile_image: args.profile_image,
                                        cover_image: args.cover_image,
                                        about: args.about,
                                        updated_at: currentDate
                                }});
                            } else return {error: "Could not verify.."}
                        } else return {error: "Could not connect.."}
                    })
                }
                else return {error: "Data not valid.."}
            })
            
           }
       },
       get_user_profile: {
        type: UserInfoType,
        args: {
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            return Profile.findOne({username: args.username});
        }

       },
       change_profile_status: {
        type: RemoveType,
        args: {
            admin: {type: GraphQLString},
            wif: {type: GraphQLString},
            username: {type: GraphQLString},
            status: {type: GraphQLString}
        },
        resolve(parent, args){
           
           if(args.admin!=="bilalhaider")
           {
               return {error: "You cannot change the status.."}
           } 

           return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ is_profile_exists(username: "'+args.username+'") { result }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.is_profile_exists!==null)
                {
                    if(res.data.is_profile_exists.result==true)
                    {
                        return fetch('https://graphql.voilk.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: '{ auth_active(username: "'+args.admin+'", wif: "'+args.wif+'") { authenticated }}' }),
                         })
                        .then(rest => rest.json())
                        .then(rest => {
                            if(rest.data.auth_active!==null)
                            {
                                let pb = rest.data.auth_active.authenticated;
                                let currentDate = new Date();                  
                                if(pb){
                                
                                    return Profile.updateOne({
                                        username: args.username
                                    },
                                    {$set: {status: args.status, updated_at: currentDate}}
                                    );
                                }
                                else return {error: "Could not verify account"};
                            }
                            else return {error: "Invalid account"};
                        })
                    }
                    else return {error: "Profile does not exist."}
                } else return {error: "There was an error.."}
            })
        }
       },
       create_hyip_package: {
        type: TransferType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            planID: {type: GraphQLString},
            amount: {type: GraphQLString}
        },
        resolve(parent, args){
           let memo = generate_random_password("HYIP");
           let hplanID = memo;
           let amt = parseFloat(args.amount).toFixed(3);
           let snd = amt+ " VOILK";
           let pckPercent = 0;
           let profitAmt = 0;
           let pckPeriod = 0;

           switch (args.planID) {
                case "PK01":
                   memo += ":"+args.planID;
                   if(amt<1000||amt>5000)
                   {
                       return {result: false, transaction_id: "Amount is invalid "+snd}
                   }
                   pckPercent = 101;
                   profitAmt = amt * 101/100;
                   pckPeriod = 2;
                   memo += ":"+snd
                   break;
                case "PK02":
                   memo += ":"+args.planID;
                   if(amt<5001||amt>10000)
                   {
                       return {result: false, transaction_id: "Amount is invalid "+snd}
                   }
                   pckPercent = 105;
                   profitAmt = amt * 105/100;
                   pckPeriod = 10;
                   memo += ":"+snd
                   break;
                case "PK03":
                     memo += ":"+args.planID;
                     if(amt<10001||amt>20000)
                     {
                         return {result: false, transaction_id: "Amount is invalid "+snd}
                     }
                     pckPercent = 115;
                   profitAmt = amt * 115/100;
                   pckPeriod = 30;
                     memo += ":"+snd
                     break;
                case "PK04":
                   memo += ":"+args.planID;
                   if(amt<20001||amt>50000)
                   {
                       return {result: false, transaction_id: "Amount is invalid "+snd}
                   }
                   pckPercent = 130;
                   profitAmt = amt * 130/100;
                   pckPeriod = 60;
                   memo += ":"+snd
                   break;
                case "PK05":
                     memo += ":"+args.planID;
                     if(amt<50001||amt>100000)
                     {
                         return {result: false, transaction_id: "Amount is invalid "+snd}
                     }
                     pckPercent = 150;
                   profitAmt = amt * 150/100;
                   pckPeriod = 90;
                     memo += ":"+snd
                     break;
                  case "PK06":
                     memo += ":"+args.planID;
                     if(amt<100001||amt>150000)
                     {
                         return {result: false, transaction_id: "Amount is invalid "+snd}
                     }
                     pckPercent = 200;
                   profitAmt = amt * 200/100;
                   pckPeriod = 180;
                     memo += ":"+snd
                     break;
                  case "PK07":
                       memo += ":"+args.planID;
                       if(amt<150001||amt>200000)
                       {
                           return {result: false, transaction_id: "Amount is invalid "+snd}
                       }
                       pckPercent = 210;
                   profitAmt = amt * 210/100;
                   pckPeriod = 180;
                       memo += ":"+snd
                       break;
                  case "PK08":
                     memo += ":"+args.planID;
                     if(amt<200001||amt>250000)
                     {
                         return {result: false, transaction_id: "Amount is invalid "+snd}
                     }
                     pckPercent = 220;
                   profitAmt = amt * 220/100;
                   pckPeriod = 180;
                     memo += ":"+snd
                     break;              
                  case "PK09":
                     memo += ":"+args.planID;
                     if(amt<250001||amt>300000)
                     {
                         return {result: false, transaction_id: "Amount is invalid "+snd}
                     }
                     pckPercent = 230;
                   profitAmt = amt * 230/100;
                   pckPeriod = 180;
                     memo += ":"+snd
                     break;         
               default:
                   return {result: false, transaction_id: "Invalid Package Code "+args.planID}
                   break;
           } 

           return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ transfer(from: "'+args.username+'", wif: "'+args.wif+'", to: "voilk", amount: "'+snd+'", memo:"'+memo+'") { result transaction_id }}' }),
                })
                .then(res => res.json())
                .then(res => {
                    if(res.data.transfer!==null)
                    {
                        let result = res.data.transfer.result;
                        let currentDate = new Date();
                        let nextDate = new Date(currentDate);
                        let nDate = nextDate.setDate(nextDate.getDate()+pckPeriod);
                        if(result){
                            let nHyip = new Hplan({
                                _id: hplanID,
                                username: args.username, 
                                planID: args.planID,
                                invested_amount: snd,
                                amount: amt,
                                package_percent: pckPercent,
                                claim: profitAmt.toFixed(3),
                                claim_amount: profitAmt.toFixed(3)+" VOILK",
                                package_period: pckPeriod,
                                lock: 0,
                                status: "Active",
                                claim_date: nDate,
                                created_at: currentDate,
                                updated_at: currentDate
                          });
  
                          let sv = nHyip.save();
  
                          return sv.then(rest => {
                              //console.log(rest);
                              if(rest.username==args.username)
                              {
                                  return {result: true, transaction_id: hplanID}
                              }
                              else return {result: false, transaction_id: "Could not create request.."}
                          })
                        }
                        else return {error: "Could not verify account"};
                    }
                    else return {error: "Invalid account"};
                })
        }
       },
       claim_hyip_bonus: {
        type: ModifyType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            package_id: {type: GraphQLString}
        },
        resolve(parent, args){

        let req = Hplan.findOne({_id: args.package_id});  
        return req.then(rr => {
           
           let currentDate = new Date();
           let claimDate = new Date(rr.claim_date);
           let createdDate = new Date(rr.created_at);
           let updatedDate = new Date(rr.updated_at);
           let status = rr.status;
           let lock = rr.lock;
           
           if(!(status=="Active")){
            return {error: "Your package is not active, hence it can't be claimed"}
           }

           if(claimDate.getTime()>currentDate.getTime())
           {
               return {error: "Kindly wait until " + rr.claim_date}
           }
           if(args.username!==rr.username){
               return {error: "You cannot claim this bonus.."}
           }

           return fetch('https://graphql.voilk.com/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
           })
          .then(res => res.json())
          .then(res => {
              if(res.data.auth_active!==null)
              {
                  let pb = res.data.auth_active.authenticated;                  
                  if (pb==true)
                  {
                    if(status=="Active"){
                        if(claimDate.getTime()<=currentDate.getTime())
                        {
                            lock++;
                            let updd = Hplan.updateOne({
                                username: rr.username,
                                _id: rr._id
                            },
                            {$set: {status: "Completed", lock: lock, updated_at: new Date()}}
                            )
                            wait(3000)
                            return updd.then(xx => {
                                if(xx.nModified==1&&xx.ok==1){
                                    let getadvert = Hplan.findOne({_id: args.package_id});  
                                    return getadvert.then(gtr => {
                                       
                                        if(gtr.lock==1){
                                            return fetch('https://graphql.voilk.com/graphql', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ query: '{ transfer(from: "'+hyipSender+'", wif: "'+hyipPrivate+'", to: "'+rr.username+'", amount: "'+rr.claim_amount+'", memo:"'+rr._id+'") { result transaction_id }}' }),
                                            })
                                            .then(nxt => nxt.json())
                                            .then(nxt => {
                                                if(nxt.data.transfer!==null)
                                                {
                                                    let result = nxt.data.transfer.result;
                                                    if(result){
                                                        return xx;
                                                    }
                                                    else return {error: "We could not pay the bonus: contact support"}
                                                }
                                            })
                                        }
                                        else if(gtr.lock==0){
                                            return {error: "Error Code 0"}
                                        }
                                        else return {error: "Cannot claim this plan. Contact Support"}

                                    })   
                                }
                                else return {error: "Could not update Database."}
                            })
                            
                        }
                        else return {error: "Kindly wait until " + rr.claim_date}
                    }
                    else return {error: "Your package is not active, hence it can't be claimed"}
                  }
                  else return {error: "Your authorization key is not valid.."}
              }
              else return {error: "Could not Connect.."}
          })
         })
       }
       },
       get_hyip_history: {
           type: new GraphQLList(PlanType),
           args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            limit: {type: GraphQLInt}
           },
           resolve(parent, args){
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;                  
                    if (pb==true)
                    {
                      return Hplan.find({username: args.username}).sort({created_at: -1}).limit(args.limit);
                    }
                    else return {error: "We could not authenticate you.."}
                }
            })
        }
       },
       get_latest_hyip_deposits: {
           type: new GraphQLList(PlanType),
           args: {
            limit: {type: GraphQLInt}               
           },
           resolve(parent, args){
             return Hplan.find({status: "Active"}).sort({created_at: -1}).limit(args.limit)
           }
       },
       get_latest_hyip_claims: {
        type: new GraphQLList(PlanType),
        args: {
         limit: {type: GraphQLInt}               
        },
        resolve(parent, args){
          return Hplan.find({status: "Completed"}).sort({updated_at: -1}).limit(args.limit)
        }
       },
       get_top_investor: {
           type: new GraphQLList(InvestType),
           args: {
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){
               return Hplan.aggregate([ { 
                $group: { 
                    _id: "$username", 
                    amount: { $sum: "$amount" }
                }
            },{$sort:{amount: -1}},{ $limit : args.limit } ] )
           }
       },
       get_top_claims: {
            type: new GraphQLList(InvestType),
            args: {
                limit: {type: GraphQLInt}
            },
            resolve(parent, args){
                return Hplan.aggregate([ 
                {$match: {status: "Completed"}},
                { $group: { 
                    _id: "$username",
                    amount: { $sum: "$claim" }}   
                },
                {$sort:{amount: -1}},
                { $limit : args.limit } ] )
            }
       },
       get_total_claimed_amount: {
        type: new GraphQLList(InvestType),
        resolve(parent, args){
            return Hplan.aggregate([ 
            {$match: {status: "Completed"}},
            { $group: { 
                _id: null,
                amount: { $sum: "$claim" }}   
            } ] )
        }
       },
       get_total_investment: {
        type: new GraphQLList(InvestType),
        resolve(parent, args){
            return Hplan.aggregate([
            { $group: { 
                _id: null,
                amount: { $sum: "$claim" }}   
            } ] )
        }
       },
       get_total_active_investment: {
        type: new GraphQLList(InvestType),
        resolve(parent, args){
            return Hplan.aggregate([ 
            {$match: {status: "Active"}},
            { $group: { 
                _id: null,
                amount: { $sum: "$claim" }}   
            } ] )
        }
       },
       get_users_claimed_amount: {
        type: new GraphQLList(InvestType),
        args: {
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            return Hplan.aggregate([ 
            {$match: {username: args.username, status: "Completed"}},
            { $group: { 
                _id: null,
                amount: { $sum: "$claim" }}   
            } ] )
        }
       },
       get_users_active_investment: {
        type: new GraphQLList(InvestType),
        args: {
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            return Hplan.aggregate([ 
            {$match: {username: args.username, status: "Active"}},
            { $group: { 
                _id: null,
                amount: { $sum: "$amount" }}   
            } ] )
        }
       },
       get_users_total_investment: {
        type: new GraphQLList(InvestType),
        args: {
            username: {type: GraphQLString}
        },
        resolve(parent, args){
            return Hplan.aggregate([ 
            {$match: {username: args.username}},
            { $group: { 
                _id: null,
                amount: { $sum: "$amount" }}   
            } ] )
        }
       },
       get_completed_accounts_count: {
           type: new GraphQLList(CountType),
           resolve(parent, args){
               return Hplan.aggregate([
                {$match: {status: "Completed"}},
                {$group: {_id: "$username", amount: { $sum: "$amount" } } },
                {$count: "count"},
                {$sort:{amount: -1}}
            ])
           }
       },
       get_completed_plans_count: {
        type: new GraphQLList(CountType),
        resolve(parent, args){
            return Hplan.aggregate([
             {$match: {status: "Completed"}},
             {$count: "count"}
            
         ])
        }
       },
       get_active_plans_count: {
        type: new GraphQLList(CountType),
        resolve(parent, args){
            return Hplan.aggregate([
             {$match: {status: "Active"}},
             {$count: "count"}
            
         ])
        }
       },
       get_active_accounts_count: {
        type: new GraphQLList(CountType),
        resolve(parent, args){
            return Hplan.aggregate([
             {$match: {status: "Active"}},
             {$group: {_id: "$username", amount: { $sum: "$amount" } } },
             {$count: "count"},
             {$sort:{amount: -1}}
         ])
        }
       },
       get_completed_users_plans_count: {
           type: new GraphQLList(CountType),
           args: {
            username: {type: GraphQLString},
           },
           resolve(parent, args){
               return Hplan.aggregate([
                {$match: {username: args.username, status: "Completed"}},
                {$count: "count"},
                {$sort:{amount: -1}}
            ])
           }
       },
       get_active_users_plans_count: {
        type: new GraphQLList(CountType),
        args: {
            username: {type: GraphQLString},
           },
        resolve(parent, args){
            return Hplan.aggregate([
             {$match: {username: args.username,status: "Active"}},
             {$count: "count"},
             {$sort:{amount: -1}}
         ])
        }
       },
       transfer: {
            type: TransferType,
            args:{
                wif: {type: GraphQLString},
                from: {type: GraphQLString},
                to: {type: GraphQLString},
                amount: {type: GraphQLString},
                memo: {type: GraphQLString}
            },
            resolve(parent, args){
                let trp = new Promise(function(resolve, reject) {
                    
                    api.broadcast.transfer(args.wif, args.from, args.to, args.amount, args.memo, function(err, result) {
                        console.log(err, result);
                        resolve(result);
                    });
                })
                return trp.then(tr => {
                    
                    if(tr!==undefined){
                        return {result: true, transaction_id: tr.id}
                    }
                    else {
                        return {result: false, transaction_id: null}
                    }
                })
                
            }
       },
       transfer_to_vesting: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            to: {type: GraphQLString},
            amount: {type: GraphQLString}
        },
        resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.transferToCoining(args.wif, args.from, args.to, args.amount, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       withdraw_vesting_shares: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            username: {type: GraphQLString},
            amount: {type: GraphQLString}
        },
        resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
                api.broadcast.withdrawCoining(args.wif, args.username, args.amount, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       transfer_to_savings: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            to: {type: GraphQLString},
            amount: {type: GraphQLString},
            memo: {type: GraphQLString}
        },
        resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.transferToSavings(args.wif, args.from, args.to, args.amount, args.memo, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       withdraw_from_savings: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            to: {type: GraphQLString},
            amount: {type: GraphQLString},
            memo: {type: GraphQLString}
        },
        resolve(parent, args){
            let requestID = Math.ceil(Math.random() * 10000000);
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.transferFromSavings(args.wif, args.from, requestID, args.to, args.amount, args.memo, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       cancel_withdraw_from_savings: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            requestId: {type: GraphQLInt}
        },
        resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.cancelTransferFromSavings(args.wif, args.from, args.requestId, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       delegate_share_power: {
           type: TransferType,
           args: {
               active_key: {type: GraphQLString},
               delegator: {type: GraphQLString},
               delegatee: {type: GraphQLString},
               coining_shares: {type: GraphQLString}
           },
           resolve(parent, args){
               let amt = parseFloat(args.coining_shares);
               let result = false;
               let transaction_id = null;
               if(amt<=0.0)
               {
                   result = false;
                   transaction_id = "Cannot delegate less than 100 COINS";
                   let res = {result: result,
                       transaction_id: transaction_id}
                   return res;
               }
               else if(amt<100)
               {
                   result = false;
                   transaction_id = "Cannot delegate less than 100 COINS";
                   let res = {result: result,
                       transaction_id: transaction_id}
                   return res;
               }
               else {

               let trp = new Promise(function(resolve, reject) {
                   api.broadcast.delegateCoiningShares(
                       args.active_key,
                       args.delegator,
                       args.delegatee,
                       args.coining_shares,
                       function(err, result) {
                           //console.log(err, result);
                           resolve(result);
                       })
               })
               return trp.then(tr => {
                   if(tr!==undefined){
                       return {result: true, transaction_id: tr.id}
                   }
                   else {
                       return {result: false, transaction_id: null}
                   }
               })
            }
           }
       },
       undelegate_share_power: {
        type: TransferType,
        args: {
            active_key: {type: GraphQLString},
            delegator: {type: GraphQLString},
            delegatee: {type: GraphQLString}
        },
        resolve(parent, args){
            
            let trp = new Promise(function(resolve, reject) {
                api.broadcast.delegateCoiningShares(
                    args.active_key,
                    args.delegator,
                    args.delegatee,
                    "0.000000 COINS",
                    function(err, result) {
                        //console.log(err, result);
                        resolve(result);
                    })
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
        }
       },
       convert_to_voilk: {
        type: TransferType,
        args:{
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            amount: {type: GraphQLString}
        },
        resolve(parent, args){
            let requestID = Math.ceil(Math.random() * 10000000);
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.convert(args.wif, args.from, requestID, args.amount, function(err, result) {
                    //console.log(err, result);
                    resolve(result);
                });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
            
        }
       },
       fill_convert_request: {
           type: TransferType,
           args: {
            wif: {type: GraphQLString},
            from: {type: GraphQLString},
            amountin: {type: GraphQLString},
            amountout: {type: GraphQLString},
            requestid: {type: GraphQLInt}
           },
           resolve(parent, args){
            let trp = new Promise(function(resolve, reject) {
                
                api.broadcast.fillConvertRequest(args.wif, args.from, args.requestid, args.amountin, args.amountout, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return {result: true, transaction_id: tr.id}
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
           }
       },
       get_conversion_requests: {
         type: new GraphQLList(ConversionType),
         args: {
             username: {type: GraphQLString}
         },
         resolve(parent, args){

            let trp = new Promise(function(resolve, reject) {
                
                api.api.getConversionRequests(args.username, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return tr
                }
                else {
                    return {error: "Some error occured."}
                }
            })
            
         }
       },
       get_latest_news: {
            type: new GraphQLList(Blog),
            args: {
                username: {type: GraphQLString}
            },
            resolve(parent, args){
              return voilk(methods.getBlog.method, `["${args.username}",-1,10]`); 
            }
       },
       create_cashout_request: {
        type: TransferType,
        args: {
            wif: {type: GraphQLString},
            username: {type: GraphQLString},
            method: {type: GraphQLString},
            amount: {type: GraphQLString},
            account: {type: GraphQLString}
        },
        resolve(parent, args){
            let ran = generate_random_password("WDID");

            let amt = parseFloat(args.amount.split(" ")[0]);
            if(amt<1) return {result: false, transaction_id: "10,000 Minimum Withdrawal.."}
            

            return fetch('https://graphql.voilk.com/graphql', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: '{ transfer(wif: "'+args.wif+'", from: "'+args.username+'", to: "voilk", amount: "'+args.amount+'", memo: "'+ran+'") { result transaction_id }}' }),
              })
              .then(res => res.json())
              .then(res => {
                  let data = res.data.transfer;
                  if(data!==null)
                  {
                      let auth = data.result;
                      if (auth)
                      {
                          let username = args.username;
                          let method = args.method;
                          let account = args.account;
                          let amount = args.amount;
                          let status = args.status;
                          let cashout = new Cashout({
                              _id: ran,
                            username: args.username,
                            method: args.method,
                            amount: args.amount,
                            account: args.account,
                            status: "Pending",
                        });

                        let sv = cashout.save();

                        return sv.then(rest => {
                            //console.log(rest);
                            if(rest.username==username)
                            {
                                return {result: true, transaction_id: ran}
                            }
                            else return {result: false, transaction_id: "Could not create request.."}
                        })
                      }
                      else return {result: false, transaction_id: "Could not authenticate.."};
                  }
                  else return {result: false, transaction_id: "Could not Connect.."};
              })
        }
       },
       get_cashout_requests: {
        type: new GraphQLList(CashoutType),
        args: {
            wif: {type: GraphQLString},
            username: {type: GraphQLString},
            all: {type: GraphQLBoolean},
            limit: {type: GraphQLInt}            
        },
        resolve(parent, args){
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;                    
                    if (pb==true)
                    {
                        if(args.all && args.username=="voilk")
                        return Cashout.find().limit(args.limit);
                        else
                        return Cashout.find({username: args.username}).limit(args.limit);
                    }
                    else {return {error: "Could not authenticate.."}}
                }
                else {return {error: "Could not connect.."}}
            })
        } 
       },
       approve_cashout_request: {
        type: ModifyType,
        args: {
            wif: {type: GraphQLString},
            username: {type: GraphQLString},
            cashout_id: {type: GraphQLString},
            status: {type: GraphQLString}            
        },
        resolve(parent, args){

            if(!(args.username=="voilk"||args.username=="bilalhaider")){
                return {error: "You cannot approve cashout.."}
            }

            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
             })
            .then(res => res.json())
            .then(res => {
                if(res.data.auth_active!==null)
                {
                    let pb = res.data.auth_active.authenticated;                    
                    if (pb==true)
                    {
                        return Cashout.updateOne({
                            _id: args.cashout_id,
                        },
                        {$set: {
                            status: args.status,
                            processed: Date.now()
                        }}
                        );
                    }
                    else {return {error: "Could not authenticate.."}}
                }
                else {return {error: "Could not connect.."}}
            })
        } 
       },
       delete_cashout_request: {
        type: DeleteType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            cashout_id: {type: GraphQLString}
        },
        resolve(parent, args){

        let req = Cashout.findOne({_id: args.cashout_id});  
        return req.then(rr => {
           //console.log(rr); 
           if(!(rr.status=="Pending")) {return {error: "Cannot delete Processed requests.."}}

           return fetch('https://graphql.voilk.com/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: '{ auth_active(username: "'+args.username+'", wif: "'+args.wif+'") { authenticated }}' }),
           })
          .then(res => res.json())
          .then(res => {
              if(res.data.auth_active!==null)
              {
                  let pb = res.data.auth_active.authenticated;
                  
                  if (pb==true)
                  {
                     return Cashout.deleteOne( { _id : args.cashout_id } )
                  }
                  else return {error: "Could not authenticate.."}
              }
              else return {error: "Could not Connect.."}
          })
         })
       }
       },
       get_location_by_ip: {
           type: LocationType,
           args: {
               ip: {type: GraphQLString}
           },
           resolve(parent, args){
            
             if(!ValidateIPaddress(args.ip))
             return {error: "Invalid IP"};

             let ipdata = getLocation(args.ip);
             return ipdata.then(d =>{
                //console.log(d); 
                return d;
                });

           }
       },
       add_credit: {
           type: ModifyType,
           args: {
            username: {type: GraphQLString},   
            wif: {type: GraphQLString},
            amount: {type: GraphQLString}
           },
           resolve(parent, args){
            let data = Advert.find({username: args.username});
           
            return data.then( d => {
                return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name active {key_auths}} }' }),
                 })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.account!==null)
                     {
                         let pb = res.data.account.active.key_auths[0][0];
                         let e = verifykey(args.wif, pb);
                         if (e==true)
                         {
                             let ps = generate_random_password("CR");
                             let trans = new Promise(function(resolve, reject) {
                                //https://api.ipify.org?format=json
                                //http://www.geoplugin.net/json.gp
                                // getJSON("http://www.geoplugin.net/json.gp", function(err, data){ 
                                //    result = data; 
                                //    resolve(result);
                                // })
                                api.broadcast.transfer(args.wif, args.username, "voilk", args.amount, ps+" Credit Purchase", function(err, result) {
                                    ////console.log(err, result);
                                    resolve(result);
                                  });
                             });
                              return trans.then(rs => {
                                if(!(rs===undefined))
                                {
                                    let credit_to_add = d[0].credit+parseFloat(args.amount.split(" ")[0]);
                                    //console.log(credit_to_add);
                                    return Advert.updateOne({
                                        username: args.username
                                    },
                                    {$set: {"credit": credit_to_add}}
                                    );
                                }
                                else{
                                    return {error: "There was some error try again"}
                                }
                                  
                              })
                         }else return {error: "Key is not valid"}
                     }
                     else return {error: "Could not find account."}
                    })
           }
        )}
       },
       add_credit_to_advert: {
        type: ModifyType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            credit: {type: GraphQLInt}
        },
        resolve(parent, args){
           let a_data = Advert.aggregate([
                { $match: {username: args.username}},
                { $unwind: '$ads'},
                { $match: {'ads._id': args.advert_id}},
                { $group: {_id: '$_id', ads: {$push: '$ads'}}}
            ])
           let user = Advert.find({username: args.username});
           return user.then(u => {
              return a_data.then( d => {
                 return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
                 })
                .then(res => res.json())
                .then(res => {
                    if(res.data.account!==null)
                    {
                        let pb = res.data.account.posting.key_auths[0][0];
                        let e = verifykey(args.wif, pb);
                        if (e==true)
                        {
                          if(!(args.credit<=u[0].credit))
                          {
                            return {error: "Credit Not enough"}
                          }
                          else{
                            //console.log(u[0].credit + args.credit);  
                            let credit_to_add = d[0].ads[0].ad_credits+args.credit;
                            let credit_to_subtract = u[0].credit-args.credit;
                            //console.log(credit_to_add+ " : "+credit_to_subtract);
                            let addcredit = Advert.updateOne({
                                username: args.username,
                                "ads._id": args.advert_id
                            },
                            {$set: {"ads.$.ad_credits": credit_to_add}}
                            );
                            let subtractcredit = Advert.updateOne({
                                username: args.username
                            },
                            {$set: {"credit": credit_to_subtract}}
                            );
                            return addcredit.then(ad => {
                                return subtractcredit;
                            })
                          }
                        }
                        else return {error: "Could not verify account"};
                    }
                    else return {error: "Invalid account"};
                })
            })
          })
         }
       },
       get_active_ads_mini: {
         type: new GraphQLList(ActiveAdvertType),
         resolve(parent, args){
             let active = Advert.aggregate([
                { $unwind: '$ads'},
                { $match: {
                    'ads.ad_status': "approved", 
                    'ads.ad_active': "true", 
                    'ads.ad_width': {$eq: 125},
                    'ads.ad_height': {$eq: 125},
                    'ads.ad_credits': { $gt:  0}
                  }
                },
                { $group: {_id: "$username", ads: {$push: '$ads'}}},
                { $unwind: '$ads'},
                { $project: {
                    "_id": 0,
                    "ads._id": 1,
                    "ads.username": "$_id", 
                    "ads.ad_link": 1, 
                    "ads.ad_target": 1, 
                    "ads.ad_width": 1, 
                    "ads.ad_height": 1
                    }
                }
            ])
            
            return active.then(a=> {
                let ads_arr = [];
                for (const advert of a) {
                    ads_arr.push(advert.ads);
                }
                shuffle(ads_arr);
                return ads_arr;
            })
         }
       },
       get_active_ads_small: {
        type: new GraphQLList(ActiveAdvertType),
        resolve(parent, args){
            let active = Advert.aggregate([
               { $unwind: '$ads'},
               { $match: {
                   'ads.ad_status': "approved", 
                   'ads.ad_active': "true", 
                   'ads.ad_width': {$eq: 250},
                   'ads.ad_height': {$eq: 250},
                   'ads.ad_credits': { $gt:  0}
                 }
               },
               { $group: {_id: "$username", ads: {$push: '$ads'}}},
               { $unwind: '$ads'},
               { $project: {
                   "_id": 0,
                   "ads._id": 1,
                   "ads.username": "$_id", 
                   "ads.ad_link": 1, 
                   "ads.ad_target": 1, 
                   "ads.ad_width": 1, 
                   "ads.ad_height": 1
                   }
               }
           ])
           
           return active.then(a=> {
               let ads_arr = [];
               for (const advert of a) {
                   ads_arr.push(advert.ads);
               }

               shuffle(ads_arr);
               
               return ads_arr;
           })
        }
       },
       get_active_ads_mediam: {
        type: new GraphQLList(ActiveAdvertType),
        resolve(parent, args){
            let active = Advert.aggregate([
               { $unwind: '$ads'},
               { $match: {
                   'ads.ad_status': "approved", 
                   'ads.ad_active': "true", 
                   'ads.ad_width': {$eq: 468},
                   'ads.ad_height': {$eq: 60},
                   'ads.ad_credits': { $gt:  0}
                 }
               },
               { $group: {_id: "$username", ads: {$push: '$ads'}}},
               { $unwind: '$ads'},
               { $project: {
                   "_id": 0,
                   "ads._id": 1,
                   "ads.username": "$_id", 
                   "ads.ad_link": 1, 
                   "ads.ad_target": 1, 
                   "ads.ad_width": 1, 
                   "ads.ad_height": 1
                   }
               }
           ])
           
           return active.then(a=> {
               let ads_arr = [];
               for (const advert of a) {
                   ads_arr.push(advert.ads);
               }
               shuffle(ads_arr);
               return ads_arr;
           })
        }
       },
       get_active_ads_large: {
            type: new GraphQLList(ActiveAdvertType),
            resolve(parent, args){
                let active = Advert.aggregate([
                { $unwind: '$ads'},
                { $match: {
                    'ads.ad_status': "approved", 
                    'ads.ad_active': "true", 
                    'ads.ad_width': {$eq: 728},
                    'ads.ad_height': {$eq: 90},
                    'ads.ad_credits': { $gt:  0}
                    }
                },
                { $group: {_id: "$username", ads: {$push: '$ads'}}},
                { $unwind: '$ads'},
                { $project: {
                    "_id": 0,
                    "ads._id": 1,
                    "ads.username": "$_id", 
                    "ads.ad_link": 1, 
                    "ads.ad_target": 1, 
                    "ads.ad_width": 1, 
                    "ads.ad_height": 1
                    }
                }
            ])
            
            return active.then(a=> {
                let ads_arr = [];
                for (const advert of a) {
                    ads_arr.push(advert.ads);
                }
                shuffle(ads_arr);
                return ads_arr;
            })
            }
       },
       get_active_ads_long: {
            type: new GraphQLList(ActiveAdvertType),
            resolve(parent, args){
                let active = Advert.aggregate([
                { $unwind: '$ads'},
                { $match: {
                    'ads.ad_status': "approved", 
                    'ads.ad_active': "true", 
                    'ads.ad_width': {$eq: 120},
                    'ads.ad_height': {$eq: 600},
                    'ads.ad_credits': { $gt:  0}
                    }
                },
                { $group: {_id: "$username", ads: {$push: '$ads'}}},
                { $unwind: '$ads'},
                { $project: {
                    "_id": 0,
                    "ads._id": 1,
                    "ads.username": "$_id", 
                    "ads.ad_link": 1, 
                    "ads.ad_target": 1, 
                    "ads.ad_width": 1, 
                    "ads.ad_height": 1
                    }
                }
            ])
            
            return active.then(a=> {
                let ads_arr = [];
                for (const advert of a) {
                    ads_arr.push(advert.ads);
                }
                shuffle(ads_arr);
                return ads_arr;
            })
            }
       },
       get_active_ads_wide: {
            type: new GraphQLList(ActiveAdvertType),
            resolve(parent, args){
                let active = Advert.aggregate([
                { $unwind: '$ads'},
                { $match: {
                    'ads.ad_status': "approved", 
                    'ads.ad_active': "true", 
                    'ads.ad_width': {$eq: 160},
                    'ads.ad_height': {$eq: 600},
                    'ads.ad_credits': { $gt:  0}
                    }
                },
                { $group: {_id: "$username", ads: {$push: '$ads'}}},
                { $unwind: '$ads'},
                { $project: {
                    "_id": 0,
                    "ads._id": 1,
                    "ads.username": "$_id", 
                    "ads.ad_link": 1, 
                    "ads.ad_target": 1, 
                    "ads.ad_width": 1, 
                    "ads.ad_height": 1
                    }
                }
            ])
            
            return active.then(a=> {
                let ads_arr = [];
                for (const advert of a) {
                    ads_arr.push(advert.ads);
                }
                shuffle(ads_arr);
                return ads_arr;
            })
            }
       },
       get_ads_profile: {
        type: AdProfileType,
        args: {
            private_posting_key: {type: GraphQLString},
            username: {type: GraphQLString}
        },
        resolve(parent, args){
           
           let data = Advert.find({username: args.username});
           
           return data.then( d => {
               let count = d.length;
               return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
                })
                .then(res => res.json())
                .then(res => {
                    if(res.data.account!==null)
                    {
                        let pb = res.data.account.posting.key_auths[0][0];
                        let e = verifykey(args.private_posting_key, pb);
                        if (e==true)
                        {
                            if(count==0)
                            {
                                let advert = new Advert({
                                    username: args.username,
                                    name: "advert",
                                    created_at: new Date(),
                                    updated_at: new Date(),
                                    credit: 1000
                                });

                                return advert.save();
                            }
                            else if(count==1) {
                                return d[0];
                            }
                            else {
                                return {error: "Query Error"};
                            }
                        }
                        else
                        {
                            return {error: "Private posting key is not valid!"};
                        }
                    }else{
                        return {error: "You need to register"}
                    }
                })
               
           })
           
           
        }
       },
       create_advert: {
        type: ModifyType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            type: {type: GraphQLString},
            size: {type: GraphQLString},
            image_link: {type: GraphQLString},
            target_link: {type: GraphQLString}
        },
        resolve(parent, args){
           let a_data = Advert.find({username: args.username});
           
           return a_data.then( d => {
            return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
                })
                .then(res => res.json())
                .then(res => {
                    if(res.data.account!==null)
                    {
                        let pb = res.data.account.posting.key_auths[0][0];
                        let e = verifykey(args.wif, pb);
                        if (e==true)
                        {
                            let verify_link = validURL(args.target_link);
                            let verify_image = checkImage(args.image_link);
                            let image_size = args.size.split("x");
                            let timer;
                            if(verify_image&&verify_link)
                            {
                                return Advert.updateOne(
                                    {username: args.username}, 
                                    { $push: {
                                      ads: {
                                            _id: generate_random_password("AD"),
                                            ad_type: "IMAGE",
                                            ad_link: args.image_link,
                                            ad_target: args.target_link,
                                            ad_credits: 0,
                                            ad_timer: 5,
                                            ad_width: image_size[0], 
                                            ad_height: image_size[1],
                                            ad_status: "approved",
                                            ad_active: false,
                                            created_at: Date.now(),
                                            updated_at: Date.now()
                                      }
                                     }	
                                    });
                            }
                            else return {error: "Invalid image or link"};
                        }
                        else return {error: "Could not verify account"};
                    }
                    else return {error: "Invalid account"};
                })
        }
      )}
       },
       delete_advert: {
        type: ModifyType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            advert_id: {type: GraphQLString}
        },
        resolve(parent, args){
            let a_data = Advert.aggregate([
                 { $match: {username: args.username}},
                 { $unwind: '$ads'},
                 { $match: {'ads._id': args.advert_id}},
                 { $group: {_id: '$_id', ads: {$push: '$ads'}}}
             ])
            let user = Advert.find({username: args.username});
            return user.then(u => {
               return a_data.then( d => {
                  return fetch('https://graphql.voilk.com/graphql', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
                  })
                 .then(res => res.json())
                 .then(res => {
                     if(res.data.account!==null)
                     {
                         let pb = res.data.account.posting.key_auths[0][0];
                         let e = verifykey(args.wif, pb);
                         if (e==true)
                         {
                           if(d[0].ads[0].ad_credits>0)
                           {
                             //console.log(u[0].credit + args.credit);  
                             let credit_to_add = d[0].ads[0].ad_credits+u[0].credit;
                             //console.log(credit_to_add);
                             
                             let addcredit = Advert.updateOne({
                                 username: args.username
                             },
                             {$set: {"credit": credit_to_add}}
                             );
                             return addcredit.then(ad => {
                                 return Advert.updateOne({ 
                                    username : args.username
                                    },
                                    {$pull : { "ads" : 
                                    {"_id": args.advert_id} 
                                    } 
                                });
                             })
                           }
                           else{
                             return Advert.updateOne({ 
                                username : args.username
                                },
                                {$pull : { "ads" : 
                                {"_id": args.advert_id} 
                                } 
                            });
                           }
                         }
                         else return {error: "Could not verify account"};
                     }
                     else return {error: "Invalid account"};
                 })
             })
           })
          }

       },
       act_dec_advert: {
        type: ModifyType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            toggle: {type: GraphQLBoolean}
        },
        resolve(parent, args)
        {
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
            })
            .then(res => res.json())
            .then(res => {
                if(res.data.account!==null)
                {
                    let pb = res.data.account.posting.key_auths[0][0];
                    let e = verifykey(args.wif, pb);
                    if (e==true)
                    {
                        return Advert.findOneAndUpdate({
                            username: args.username,
                            "ads._id": args.advert_id
                        },
                        {$set: {"ads.$.ad_active": args.toggle}}
                        )
                    }else return {error: "Could not verify account"};
                }else return {error: "Invalid account"};
            })
        }
       },
       record_impression: {
        type: ModifyType,
        args: {
            impression: {type: GraphQLString},
            username: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            accesstoken: {type: GraphQLString}
        },
        resolve(parent, args){
           let validate_t = validate_token(args.accesstoken);
           let impression = JSON.parse(args.impression);
           //console.log(impression );
           if(impression===null)
            return {error: "null value"};
           if(validate_t)
           {
              let user = Advert.find({username: args.username});
              let a_data = Advert.aggregate([
                { $match: {username: args.username}},
                { $unwind: '$ads'},
                { $match: {'ads._id': args.advert_id}},
                { $group: {_id: '$_id', ads: {$push: '$ads'}}}
              ]);
              return user.then(u => {
                return a_data.then( d => {
                    let credit_to_remove = d[0].ads[0].ad_credits;
                    if(d[0].ads[0].ad_height==125&&d[0].ads[0].ad_width==125){
                        credit_to_remove -= 1;
                    }
                    else if(d[0].ads[0].ad_height==60&&d[0].ads[0].ad_width==468){
                        credit_to_remove -= 4;
                    }
                    else if(d[0].ads[0].ad_height==250&&d[0].ads[0].ad_width==250){
                        credit_to_remove -= 2;
                    }
                    else if(d[0].ads[0].ad_height==90&&d[0].ads[0].ad_width==728){
                        credit_to_remove -= 8;
                    }
                    else if(d[0].ads[0].ad_height==600&&d[0].ads[0].ad_width==120){
                        credit_to_remove -= 8;
                    }
                    else if(d[0].ads[0].ad_height==600&&d[0].ads[0].ad_width==160){
                        credit_to_remove -= 10;
                    }
                    else{
                        credit_to_remove -= 1;
                    }
                    //console.log(credit_to_remove);
                    //console.log(credit_to_remove)
                    let removecredit = Advert.updateOne({
                        username: args.username,
                        "ads._id": args.advert_id
                    },
                    {$set: {"ads.$.ad_credits": credit_to_remove}}
                    );
                    return removecredit.then(ad => {
                        let addimpression = Advert.updateOne({
                            username: args.username,
                            "ads._id": args.advert_id
                          },
                          {$push: {"ads.$.ad_impressions": impression }}
                          );
                        return addimpression;
                    })
                          
                })
              })

           }else
           {
               return {error: "Could not verify Token"}
           }
        }
       },
       record_click: {
        type: ModifyType,
        args: {
            click_data: {type: GraphQLString},
            username: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            accesstoken: {type: GraphQLString}
        },
        resolve(parent, args){
            let validate_t = validate_token(args.accesstoken);
            let click_d = JSON.parse(args.click_data);
            //console.log(click_d);
            if(click_d===null)
            return {error: "null value"};
            if(validate_t)
            {
               let user = Advert.find({username: args.username});
               let a_data = Advert.aggregate([
                 { $match: {username: args.username}},
                 { $unwind: '$ads'},
                 { $match: {'ads._id': args.advert_id}},
                 { $group: {_id: '$_id', ads: {$push: '$ads'}}}
               ]);
               return user.then(u => {
                 return a_data.then( d => {
                     let credit_to_remove = d[0].ads[0].ad_credits-5;
                     if(d[0].ads[0].ad_height==125&&d[0].ads[0].ad_width==125){
                        credit_to_remove -= 5;
                    }
                    else if(d[0].ads[0].ad_height==60&&d[0].ads[0].ad_width==468){
                        credit_to_remove -= 8;
                    }
                    else if(d[0].ads[0].ad_height==250&&d[0].ads[0].ad_width==250){
                        credit_to_remove -= 5;
                    }
                    else if(d[0].ads[0].ad_height==90&&d[0].ads[0].ad_width==728){
                        credit_to_remove -= 10;
                    }
                    else if(d[0].ads[0].ad_height==600&&d[0].ads[0].ad_width==120){
                        credit_to_remove -= 10;
                    }
                    else if(d[0].ads[0].ad_height==600&&d[0].ads[0].ad_width==160){
                        credit_to_remove -= 10;
                    }
                    else{
                        credit_to_remove -= 1;
                    }
                     let removecredit = Advert.updateOne({
                         username: args.username,
                         "ads._id": args.advert_id
                     },
                     {$set: {"ads.$.ad_credits": credit_to_remove}}
                     );
                     return removecredit.then(ad => {
                         let addclick = Advert.updateOne({
                             username: args.username,
                             "ads._id": args.advert_id
                           },
                           {$push: {"ads.$.ad_clicks": click_d }}
                           );
                         return addclick;
                     })
                           
                 })
               })
 
            }else
            {
                return {error: "Could not verify Token"}
            }
         }
       },
       get_impressions_report_by: {
        type: new GraphQLList(ReportType),
        
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            all: {type: GraphQLBoolean},
            criteria: {type: GraphQLString}
        },
        resolve(parent, args){
          return fetch('https://graphql.voilk.com/graphql', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
           })
           .then(res => res.json())
           .then(res => {
               if(res.data.account!==null)
               {
                   let pb = res.data.account.posting.key_auths[0][0];
                   let e = verifykey(args.wif, pb);
                   if (e==true)
                   {
                       let query = "$impressions." + args.criteria;
                       if(args.all)
                       {
                          return Advert.aggregate([
                            { $match: {username: args.username}},
                            { $unwind: "$ads" },
                            { $unwind: "$ads.ad_impressions"},   
                            { $group: {_id: "$ads._id", impressions: {$push: '$ads.ad_impressions'}}},
                            { $project: {
                                "_id": 0, 
                                "impressions": 1
                                }
                            },
                            { $unwind: "$impressions" },
                            { $group: {_id: query, count: {$sum: 1}}},
                            { $project: {
                                _id: 0,
                                "result": "$_id",
                                "count": 1
                                }
                            }
                            
                           ]) 
                       }
                       else{
                        return Advert.aggregate([
                            { $match: {username: args.username}},
                            { $unwind: "$ads" },
                            { $unwind: "$ads.ad_impressions"},
                            { $match: {'ads._id': args.advert_id}},    
                            { $group: {_id: "$ads._id", impressions: {$push: '$ads.ad_impressions'}}},
                            { $project: {
                                "_id": 0, 
                                "impressions": 1
                                }
                            },
                            { $unwind: "$impressions" },
                            { $group: {_id: query, count: {$sum: 1}}},
                            { $project: {
                                _id: 0,
                                "result": "$_id",
                                "count": 1
                                }
                            }
                            
                           ])
                       }
                   }
               }
            })
        }  
       },
       get_clicks_report_by: {
        type: new GraphQLList(ReportType),
        
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString},
            advert_id: {type: GraphQLString},
            all: {type: GraphQLBoolean},
            criteria: {type: GraphQLString}
        },
        resolve(parent, args){
          return fetch('https://graphql.voilk.com/graphql', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
           })
           .then(res => res.json())
           .then(res => {
               if(res.data.account!==null)
               {
                   let pb = res.data.account.posting.key_auths[0][0];
                   let e = verifykey(args.wif, pb);
                   if (e==true)
                   {
                       let query = "$clicks." + args.criteria;
                       if(args.all)
                       {
                          return Advert.aggregate([
                            { $match: {username: args.username}},
                            { $unwind: "$ads" },
                            { $unwind: "$ads.ad_clicks"},   
                            { $group: {_id: "$ads._id", clicks: {$push: '$ads.ad_clicks'}}},
                            { $project: {
                                "_id": 0, 
                                "clicks": 1
                                }
                            },
                            { $unwind: "$clicks" },
                            { $group: {_id: query, count: {$sum: 1}}},
                            { $project: {
                                _id: 0,
                                "result": "$_id",
                                "count": 1
                                }
                            }
                            
                           ]) 
                       }
                       else{
                        return Advert.aggregate([
                            { $match: {username: args.username}},
                            { $unwind: "$ads" },
                            { $unwind: "$ads.ad_clicks"},
                            { $match: {'ads._id': args.advert_id}},    
                            { $group: {_id: "$ads._id", clicks: {$push: '$ads.ad_clicks'}}},
                            { $project: {
                                "_id": 0, 
                                "clicks": 1
                                }
                            },
                            { $unwind: "$clicks" },
                            { $group: {_id: query, count: {$sum: 1}}},
                            { $project: {
                                _id: 0,
                                "result": "$_id",
                                "count": 1
                                }
                            }
                            
                           ])
                       }
                   }
               }
            })
        }  
       },
       get_referrals: {
           type: new GraphQLList(ReferralType),
           args: {
               all: {type: GraphQLBoolean},
               username: {type: GraphQLString}
           },
           resolve(parent, args){
               if(args.all==true){
                   return User.find();
               }
               else
               return User.find({username: args.username});
           }
       },
       get_referrals_count: {
            type: AccountsCount,
            args: {
                username: {type: GraphQLString}
            },
            resolve(parent, args){
              let count = User.find({username: args.username}).countDocuments();
              
              return {count: count};
            }
       },
       get_sponsor: {
            type: ReferralType,
            args: {
                username: {type: GraphQLString}
            },
            resolve(parent, args){
               return User.findOne({referral: args.username});
            }
       },
       generate_password: {
           type: PasswordType,
           resolve(parent, args) {
                const d = generate_random_password();
                let pass = {result: d}
                return pass;
           }
       },
       get_tags: {
           type: new GraphQLList(TagType),
           args: {
               limit: {type: GraphQLInt}
           },
           resolve(parent, args) {
            let trp = new Promise(function(resolve, reject) {
                 
                api.api.getTrendingTags(null, args.limit, function(err, result) {
                    //console.log(err, result);
                    resolve(result)
                  });
            })
            return trp.then(tr => {
                if(tr!==undefined){
                    return tr
                }
                else {
                    return {result: false, transaction_id: null}
                }
            })
           }
       },
       generate_keys: {
            type: PublicKeysType,
            args: {
                name: {type: GraphQLString}
            },
            resolve(parent, args) {
                const d = generate_random_password();
                const publickeys = generate_keys(d, args.name);
                return publickeys;
            }
       },
       create_account: {
           type: PublicKeysType,
           args: {
               username: {type: GraphQLString},
               password: {type: GraphQLString},

               referral: {type: GraphQLString},
               accesstoken: {type: GraphQLString}
           },
           async resolve(result, args){

            let validate_t = validate_token(args.accesstoken);
            // get referral membership
            const custs = await User.find({inviter: args.referral}).count()
            const membr = await Membership.findOne({username: args.referral})

            let referral = args.referral
            if(membr && custs < membr.max_invites){
                referral = args.referral
            }
            else {
                referral = "promoter"
            }


            if(validate_t){

               let keys = generate_keys(args.password, args.username);
               const validate = validate_account_name(args.username);
               if(validate!==null){
                   keys = {errors: validate}
                   return keys;
               }
               
               var owner = { weight_threshold: 1, account_auths: [], key_auths: [[keys.ownerPubkey, 1]] };
               var active = { weight_threshold: 1, account_auths: [], key_auths: [[keys.activePubkey, 1]] };
               var posting = { weight_threshold: 1, account_auths: [], key_auths: [[keys.postingPubkey, 1]] };
               let memoKey = keys["memoPubkey"];
               
               let jsonMetadata = '{"profile":{"profile_image":"https://image.flaticon.com/icons/svg/1372/1372315.svg","cover_image":"https://cdn.pixabay.com/photo/2015/10/17/20/03/voilk-993221_960_720.jpg"}}';
               console.log("Creator:", creator)
               console.log("Wif:", wif)
               console.log("fee:", fee)
               let accP = new Promise((resolve, reject) =>{
                api.broadcast.accountCreate(
                    wif, 
                    fee, 
                    creator, 
                    args.username, 
                    owner, 
                    active, 
                    posting, 
                    memoKey, 
                    jsonMetadata, 
                    function(err, result) {
                        console.log(err, result)
                        // Sign up delegation bonus
                        if(!err){
                            const coining_shares = "5.000000 COINS"
                            api.broadcast.delegateCoiningShares(wif, creator, args.username, coining_shares, function(errt, rest) {
                                //console.log(errt, rest);
                            });
                        }
                        resolve(result)
                    }
                );
               })

               
               
               return accP.then(async x => {
                   console.log("Created Account", x)
                   if(x){	
                    let user = new User({
                        inviter: referral,
                        invitee: args.username,
                        creation_time: new Date(),
                        
                    })
                    let membership = new Membership({
                        username: args.username,
                        membership: "Basic 0",
                        max_invites: 10,
                        max_withdrawal: 50,
                        max_commission: 50,
                        created_at: new Date(),
                        updated_at: new Date(),
            
                    })
                    const mmm = await membership.save();
                    const uss = await user.save()
                    return keys; 
                   }
                   else return {errors: "Could not create account.."}
               }) 
            }
            else {
                return {errors: "Invalid Access Token!!"}
            }
          }
       },
       validate_username: {
           type: ValidateUsernameType,
           args: {
               username: {type: GraphQLString}
           },
           resolve(parent, args){
            let d = validate_account_name(args.username);
            let res = {result: d}
            return res;
           }
       },
       global_dynamic_properties: {
           type: DynamicGlobalProperties,
           resolve(parent, args) {
               return voilk(methods.getDynamicGlobalProperties.method);
           }
       },
       chain_properties: {
           type: ChainProperties,
           resolve(parent, args){
                return voilk(methods.getChainProperties.method);
           }
       },
       active_witnesses: {
           type: new GraphQLList(Witness),
           resolve(parent, args) {
               return voilk(methods.getActiveWitnesses.method);
           }
       },
       version: {
         type: BlockChainVersion,
         resolve(parent, args) {
             return voilk(methods.getVersion.method);
         }
       },
       feed_history: {
           type: FeedHistory,
           resolve(parent, args) {
               return voilk(methods.getFeedHistory.method);
           }
       },
       median_price: {
           type: FeedEntry,
           resolve(parent, args){
               return voilk(methods.getCurrentMedianHistoryPrice.method);
           }
       },
       block: {
           type: Block,
           args: {
               block_number: {type: GraphQLInt}
           },
           resolve(parent, args){
               return voilk(methods.getBlock.method, `["${args.block_number}"]`);
           }
       },
       blocks: {
           type: GraphQLList(Block),
           args: {
               block_header: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args){
               let blocks_list = [args.limit];
               let head_block = args.block_header;
               for(var x=args.limit-1; x>=0; x--){
                   blocks_list[x] = voilk(methods.getBlock.method, `["${head_block}"]`);
                   head_block--;
               }
               //console.log(blocks_list);
               return blocks_list;
           }
       },
       active_votes: {
           type: new GraphQLList(ActiveVote),
           args: {
               author: {type: GraphQLString},
               permlink: {type: GraphQLString}
           },
           resolve(parent, args) {
               return voilk(methods.getActiveVotes.method, `["${args.author}", "${args.permlink}"]`);
           }
       },
       block_header: {
           type: BlockHeader,
           args: {
               block_number: {type: GraphQLInt}
           },
           resolve(parent, args){
               return voilk(methods.getBlockHeader.method, `["${args.block_number}"]`);
           }
       },
       account: {
           type: Account,
           args: {
               name: {type: GraphQLString}
           },
           resolve(parent, args) {
               return voilk(methods.getAccount.method, `[["${args.name}"]]`, 1);
           }
       },
       accounts: {
        type: new GraphQLList(Account),
        args: {
            usernames: {type: GraphQLList(GraphQLString)}
        },
        resolve(parent, args) {
            return voilk(methods.getAccounts.method, `[${JSON.stringify(args.usernames)}]`);
        }
        },
       blog: {
           type: new GraphQLList(Blog),
           args: {
               name: {type: GraphQLString},
               start: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args) {
               return voilk(methods.getBlog.method, `["${args.name}",${args.start},${args.limit}]`);
           }
       },
       blogentries: {
           type: new GraphQLList(BlogEntry),
           args: {
               name: {type: GraphQLString},
               start: {type: GraphQLInt},
               limit: {type: GraphQLInt}
           },
           resolve(parent, args) {
               return voilk(methods.getBlogEntries.method, `["${args.name}",${args.start},${args.limit}]`);
           }
       },
       blogpartners: {
           type: new GraphQLList(BlogPartner),
           args: {
               name: {type: GraphQLString}
           },
           resolve(parent, args) {
               return voilk(methods.getBlogAuthors.method, `["${args.name}"]`);
           }
       },
       votes: {
           type: new GraphQLList(Vote),
           args: {
               account: {type: GraphQLString}
           },
           resolve(parent, args){
               return voilk(methods.getAccountVotes.method, `["${args.account}"]`);
           }
       },
       accounts_count: {
           type: AccountsCount,
           resolve(parent, args) {
               return voilk(methods.getAccountCount.method);
           }
       },
       witness_count: {
           type: AccountsCount,
           resolve(parent, args) {
               return voilk(methods.getWitnessCount.method);
           }
       },
       history: {
           type: new GraphQLList(HistoryType),
           args: {
               name: {type: GraphQLString},
               start: {type: GraphQLInt},
               finish: {type: GraphQLInt}
           },
           resolve(parent,args){
               return voilk(methods.getAccountHistory.method, `["${args.name}", ${args.start}, ${args.finish}]`);
           }
       },
       reputation: {
           type: AccountReputation,
           args: {
               name: {type: GraphQLString},
               amount: {type: GraphQLInt}
           },
           resolve(parent, args){
               return voilk(methods.getAccountReputations.method, `["${args.name}", ${args.amount}]`);
           }
       },
       market_bandwidth: {
           type: AccountMarketBandWidth,
           args: {
               name: {type: GraphQLString}
           },
           resolve(parent, args){
               return voilk(methods.getAccountBandWidthMarket.method, `["${args.name}", "market"]`);
           }
       },
       account_bandwidth: {
           type: AccountForumBandWidth,
           args: {
               name: {type: GraphQLString}
           },
           resolve(parent, args){
               return voilk(methods.getAccountBandWidthForum.method, `["${args.name}", "forum"]`);
           }
       },
       auth_active: {
        type: AuthenticateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString}
        },
        resolve(parent, args){
            let pubKey = get_public_key(args.wif);
            let userName = args.username;
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name active {key_auths}} }' }),
            })
            .then(res => res.json())
            .then(res => {
                let data = res.data.account;
                if(data!==null)
                {
                  let pb = data.active.key_auths[0][0];
                  let u = data.name;
                  let e = verifykey(args.wif, pb);
                  if (e==true&&u==userName)
                  {
                     return {
                         authenticated: true,
                         public_key: pubKey,
                         private_key: args.wif
                     }
                  }else return {authenticated: false, public_key: null, private_key: null}
                }
                else return {authenticated: false, public_key: null, private_key: null}
            })
        }  
   },
   auth_posting: {
    type: AuthenticateType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },
    resolve(parent, args){
        let pubKey = get_public_key(args.wif);
        let userName = args.username;
        return fetch('https://graphql.voilk.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
        })
        .then(res => res.json())
        .then(res => {
            let data = res.data.account;
            if(data!==null)
            {
              let pb = data.posting.key_auths[0][0];
              let u = data.name;
              let e = verifykey(args.wif, pb);
              if (e==true&&u==userName)
              {
                 return {
                     authenticated: true,
                     public_key: pubKey,
                     private_key: args.wif
                 }
              }else return {authenticated: false, public_key: null, private_key: null}
            }
            else return {authenticated: false, public_key: null, private_key: null}
        })
    }  
   },
   auth_owner: {
    type: AuthenticateType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },
    resolve(parent, args){
        let pubKey = get_public_key(args.wif);
        let userName = args.username;
        return fetch('https://graphql.voilk.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name owner {key_auths}} }' }),
        })
        .then(res => res.json())
        .then(res => {
            let data = res.data.account;
            if(data!==null)
            {
              let pb = data.owner.key_auths[0][0];
              let u = data.name;
              let e = verifykey(args.wif, pb);
              if (e==true&&u==userName)
              {
                 return {
                     authenticated: true,
                     public_key: pubKey,
                     private_key: args.wif
                 }
              }else return {authenticated: false, public_key: null, private_key: null}
            }
            else return {authenticated: false, public_key: null, private_key: null}
        })
    }  
   },
   auth_memo: {
    type: AuthenticateType,
    args: {
        username: {type: GraphQLString},
        wif: {type: GraphQLString}
    },
    resolve(parent, args){
        let pubKey = get_public_key(args.wif);
        let userName = args.username;
        return fetch('https://graphql.voilk.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name memo_key} }' }),
        })
        .then(res => res.json())
        .then(res => {
            let data = res.data.account;
            if(data!==null)
            {
              let pb = data.memo_key;
              let u = data.name;
              let e = verifykey(args.wif, pb);
              if (e==true&&u==userName)
              {
                 return {
                     authenticated: true,
                     public_key: pubKey,
                     private_key: args.wif
                 }
              }else return {authenticated: false, public_key: null, private_key: null}
            }
            else return {authenticated: false, public_key: null, private_key: null}
        })
    }  
   },
       get_commission_history,
       get_commissions_data,
       get_commissions_info,
       get_customers_data,
       get_customers_info,
       get_deposit_history,
       get_membership_info,
       get_package_history,
       get_sales_data,
       get_sales_info,
       get_withdrawal_history,
       get_memberships,
       get_commission_history_p,
       get_deposit_history_p,
       get_package_history_p,
       get_withdrawal_history_p,
       get_customers_history,
       get_customers_history_p,
       get_deposit_requests,
       get_deposits_stats,
       get_withdrawals_stats,
       get_withdrawal_requests,
       get_board_history,
       get_bad_users
   }
});

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        create_deposit,
        create_withdraw,

        activate_package,
        process_transaction,
        reject_transaction,
        
        delete_deposit,
        add_bad_user,
        remove_bad_user,
        auth_active: {
            type: AuthenticateType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString}
            },
            resolve(parent, args){
                let pubKey = get_public_key(args.wif);
                let userName = args.username;
                return fetch('https://graphql.voilk.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name active {key_auths}} }' }),
                })
                .then(res => res.json())
                .then(res => {
                    let data = res.data.account;
                    if(data!==null)
                    {
                      let pb = data.active.key_auths[0][0];
                      let u = data.name;
                      let e = verifykey(args.wif, pb);
                      if (e==true&&u==userName)
                      {
                         return {
                             authenticated: true,
                             public_key: pubKey,
                             private_key: args.wif
                         }
                      }else return {authenticated: false, public_key: null, private_key: null}
                    }
                    else return {authenticated: false, public_key: null, private_key: null}
                })
            }  
       },
       auth_posting: {
        type: AuthenticateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString}
        },
        resolve(parent, args){
            let pubKey = get_public_key(args.wif);
            let userName = args.username;
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name posting {key_auths}} }' }),
            })
            .then(res => res.json())
            .then(res => {
                let data = res.data.account;
                if(data!==null)
                {
                  let pb = data.posting.key_auths[0][0];
                  let u = data.name;
                  let e = verifykey(args.wif, pb);
                  if (e==true&&u==userName)
                  {
                     return {
                         authenticated: true,
                         public_key: pubKey,
                         private_key: args.wif
                     }
                  }else return {authenticated: false, public_key: null, private_key: null}
                }
                else return {authenticated: false, public_key: null, private_key: null}
            })
        }  
       },
       auth_owner: {
        type: AuthenticateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString}
        },
        resolve(parent, args){
            let pubKey = get_public_key(args.wif);
            let userName = args.username;
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name owner {key_auths}} }' }),
            })
            .then(res => res.json())
            .then(res => {
                let data = res.data.account;
                if(data!==null)
                {
                  let pb = data.owner.key_auths[0][0];
                  let u = data.name;
                  let e = verifykey(args.wif, pb);
                  if (e==true&&u==userName)
                  {
                     return {
                         authenticated: true,
                         public_key: pubKey,
                         private_key: args.wif
                     }
                  }else return {authenticated: false, public_key: null, private_key: null}
                }
                else return {authenticated: false, public_key: null, private_key: null}
            })
        }  
       },
       auth_memo: {
        type: AuthenticateType,
        args: {
            username: {type: GraphQLString},
            wif: {type: GraphQLString}
        },
        resolve(parent, args){
            let pubKey = get_public_key(args.wif);
            let userName = args.username;
            return fetch('https://graphql.voilk.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ account(name: "'+args.username+'") { name memo_key} }' }),
            })
            .then(res => res.json())
            .then(res => {
                let data = res.data.account;
                if(data!==null)
                {
                  let pb = data.memo_key;
                  let u = data.name;
                  let e = verifykey(args.wif, pb);
                  if (e==true&&u==userName)
                  {
                     return {
                         authenticated: true,
                         public_key: pubKey,
                         private_key: args.wif
                     }
                  }else return {authenticated: false, public_key: null, private_key: null}
                }
                else return {authenticated: false, public_key: null, private_key: null}
            })
        }  
       },
        make_a_post: {
            type: TransferType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString},
                title: {type: GraphQLString},
                tags: {type: GraphQLString},
                body: {type: GraphQLString},
            },
            resolve(parent, args){
             var permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
             //bilal
             var replaced = args.title.split(' ').join('-');
             var newpm = replaced.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase() +"-"+permlink
             var result = newpm.replace(/(-)\1+/g, '$1')
             let tags = args.tags;
             var matches = args.body.match(/https?:.*?\.(?:png|jpe?g|svg)/gi);
             //console.log(matches)
             if(/^[a-z][a-z\s]*$/.test(tags)==false){
                 return {error: "Tags can only contain small letters and spaces"}
             }
             else{
                 tags = tags.split(" ");
                 tags = tags.filter(function (el) { return el!="" })
             }
             let tags_length = tags.length;
             if(tags_length>5||tags_length<0){
                 return {error: "A Product must have at least 1 upto 5 tags"}
             }
             let trp = new Promise(function(resolve, reject) {
                 
                 api.broadcast.comment(
                     args.wif,
                     '', // Leave parent author empty
                     tags[0], // Main tag
                     args.username, // Author
                     result + '-post', // Permlink
                     args.title, // Title
                     args.body, // Body
                     { tags: tags, image: matches, app: 'voilk/0.1' }, // Json Metadata
                     function(err, result) {
                       //console.log(err, result);
                       resolve(result)
                     }
                   );
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return {result: true, transaction_id: tr.id}
                 }
                 else {
                     return {result: false, transaction_id: null}
                 }
             })
            }
        },
        update_a_post: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             title: {type: GraphQLString},
             permlink: {type: GraphQLString},
             category: {type: GraphQLString},
             tags: {type: GraphQLString},
             body: {type: GraphQLString},
         },
         resolve(parent, args){
          
          let tags = args.tags;
 
          if(/^[a-z][a-z\s]*$/.test(tags)==false){
              return {error: "Tags can only contain small letters and spaces"}
          }
          else{
              tags = tags.split(" ");
              tags = tags.filter(function (el) { return el!="" })
          }
          let tags_length = tags.length;
          if(tags_length>5||tags_length<0){
              return {error: "A Product must have at least 1 upto 5 tags"}
          }
          let trp = new Promise(function(resolve, reject) {
              
              api.broadcast.comment(
                  args.wif,
                  '', // Leave parent author empty
                  args.category.toLowerCase(), // Main tag
                  args.username, // Author
                  args.permlink, // Permlink
                  args.title, // Title
                  args.body, // Body
                  { tags: tags, app: 'voilk/0.1' }, // Json Metadata
                  function(err, result) {
                    //console.log(err, result);
                    if(result)
                    resolve(result)
                    else
                    reject(err)
                  }
                );
          })
          return trp.then(tr => {
              if(tr!==undefined){
                  return {result: true, transaction_id: tr.id}
              }
              else {
                  return {result: false, transaction_id: null}
              }
          })
         }
        },
        delete_a_post: {
            type: TransferType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString},
                permlink: {type: GraphQLString}
            },
            resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.broadcast.deleteComment(args.wif, args.username, args.permlink, function(err, result) {
                     //console.log(err, result);
                     resolve(result)
                   });
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return {result: true, transaction_id: tr.id}
                 }
                 else {
                     return {result: false, transaction_id: null}
                 }
             })
            }
        },
        upvote: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             author: {type: GraphQLString},
             permlink: {type: GraphQLString},
             weight: {type: GraphQLInt}
         },
         resolve(parent, args){
             let trp = new Promise(function(resolve, reject) {
              
                 api.broadcast.vote(
                     args.wif,
                     args.username, // Voter
                     args.author, // Author
                     args.permlink, // Permlink
                     args.weight, // Weight (10000 = 100%)
                     function(err, result) {
                       //console.log(err, result);
                       if(result)
                       resolve(result)
                       else
                       reject(err)
                     }
                   );
             })
             return trp.then(tr => {
                 if(tr!==undefined){
                     return {result: true, transaction_id: tr.id}
                 }
                 else {
                     return {result: false, transaction_id: null}
                 }
             })   
         }
        },
        make_a_comment: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             parent_author: {type: GraphQLString},
             parent_permlink: {type: GraphQLString},
             tags: {type: GraphQLString},
             body: {type: GraphQLString},
         },
         resolve(parent, args){
          var permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
          //bilal
          var replaced = args.parent_permlink.split(' ').join('-');
          var newpm = replaced.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase() +"-"+permlink
          var result = newpm.replace(/(-)\1+/g, '$1')
          var matches = args.body.match(/https?:.*?\.(?:png|jpe?g|svg)/gi);
             //console.log(matches)
          let tags = args.tags;
 
          if(/^[a-z][a-z\s]*$/.test(tags)==false){
              return {error: "Tags can only contain small letters and spaces"}
          }
          else{
              tags = tags.split(" ");
              tags = tags.filter(function (el) { return el!="" })
          }
          let tags_length = tags.length;
          if(tags_length>5||tags_length<0){
              return {error: "A Product must have at least 1 upto 5 tags"}
          }
          let trp = new Promise(function(resolve, reject) {             
              api.broadcast.comment(
                 args.wif,
                 args.parent_author, // Parent Author
                 args.parent_permlink, // Parent Permlink
                 args.username, // Author
                 result, // Permlink
                 '', // Title
                 args.body, // Body
                 { tags: tags,image: matches, app: 'voilk/0.1' }, // Json Metadata
                 function(err, result) {
                   //console.log(err, result);
                   resolve(result)
                 }
               );
          })
          return trp.then(tr => {
              if(tr!==undefined){
                  return {result: true, transaction_id: tr.id}
              }
              else {
                  return {result: false, transaction_id: null}
              }
          })
         }
        },
        update_a_comment: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             parent_author: {type: GraphQLString},
             parent_permlink: {type: GraphQLString},
             permlink: {type: GraphQLString},
             tags: {type: GraphQLString},
             body: {type: GraphQLString},
         },
         resolve(parent, args){
          let tags = args.tags;
 
          if(/^[a-z][a-z\s]*$/.test(tags)==false){
              return {error: "Tags can only contain small letters and spaces"}
          }
          else{
              tags = tags.split(" ");
              tags = tags.filter(function (el) { return el!="" })
          }
          let tags_length = tags.length;
          if(tags_length>5||tags_length<0){
              return {error: "A Product must have at least 1 upto 5 tags"}
          }
          let trp = new Promise(function(resolve, reject) {             
              api.broadcast.comment(
                 args.wif,
                 args.parent_author, // Parent Author
                 args.parent_permlink, // Parent Permlink
                 args.username, // Author
                 args.permlink, // Permlink
                 '', // Title
                 args.body, // Body
                 { tags: tags, app: 'voilk/0.1' }, // Json Metadata
                 function(err, result) {
                   //console.log(err, result);
                   resolve(result)
                 }
               );
          })
          return trp.then(tr => {
              if(tr!==undefined){
                  return {result: true, transaction_id: tr.id}
              }
              else {
                  return {result: false, transaction_id: null}
              }
          })
         }
        },
        follow: {
            type: TransferType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString},
                following: {type: GraphQLString}
            },
            resolve(parent, args){
                 var json = JSON.stringify(
                     ['follow', {
                     follower: args.username,
                     following: args.following,
                     what: ['blog']
                     }]
                 );
                 let trp = new Promise(function(resolve, reject) {             
                     api.broadcast.customJson(
                         args.wif,
                         [], // Required_auths
                         [args.username], // Required Posting Auths
                         'follow', // Id
                         json, //
                         function(err, result) {
                           //console.log(err, result);
                           if(result){
                            


                            resolve(result)
                           }
                         }
                       );
                 })
                 return trp.then(tr => {
                     if(tr!==undefined){
                         return {result: true, transaction_id: tr.id}
                     }
                     else {
                         return {result: false, transaction_id: null}
                     }
                 })   
                 
            }
        },
        unfollow: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             following: {type: GraphQLString}
         },
         resolve(parent, args){
              var json = JSON.stringify(
                  ['follow', {
                  follower: args.username,
                  following: args.following,
                  what: []
                  }]
              );
              let trp = new Promise(function(resolve, reject) {             
                  api.broadcast.customJson(
                      args.wif,
                      [], // Required_auths
                      [args.username], // Required Posting Auths
                      'follow', // Id
                      json, //
                      function(err, result) {
                        //console.log(err, result);
                        resolve(result)
                      }
                    );
              })
              return trp.then(tr => {
                  if(tr!==undefined){
                      return {result: true, transaction_id: tr.id}
                  }
                  else {
                      return {result: false, transaction_id: null}
                  }
              })   
              
         }
        },
        mute: {
            type: TransferType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString},
                following: {type: GraphQLString}
            },
            resolve(parent, args){
                 var json = JSON.stringify(
                     ['follow', {
                     follower: args.username,
                     following: args.following,
                     what: ['ignore']
                     }]
                 );
                 let trp = new Promise(function(resolve, reject) {             
                     api.broadcast.customJson(
                         args.wif,
                         [], // Required_auths
                         [args.username], // Required Posting Auths
                         'follow', // Id
                         json, //
                         function(err, result) {
                           //console.log(err, result);
                           resolve(result)
                         }
                       );
                 })
                 return trp.then(tr => {
                     if(tr!==undefined){
                         return {result: true, transaction_id: tr.id}
                     }
                     else {
                         return {result: false, transaction_id: null}
                     }
                 })   
                 
            }
        },
        unmute: {
         type: TransferType,
         args: {
             username: {type: GraphQLString},
             wif: {type: GraphQLString},
             following: {type: GraphQLString}
         },
         resolve(parent, args){
              var json = JSON.stringify(
                  ['follow', {
                  follower: args.username,
                  following: args.following,
                  what: []
                  }]
              );
              let trp = new Promise(function(resolve, reject) {             
                  api.broadcast.customJson(
                      args.wif,
                      [], // Required_auths
                      [args.username], // Required Posting Auths
                      'follow', // Id
                      json, //
                      function(err, result) {
                        //console.log(err, result);
                        resolve(result)
                      }
                    );
              })
              return trp.then(tr => {
                  if(tr!==undefined){
                      return {result: true, transaction_id: tr.id}
                  }
                  else {
                      return {result: false, transaction_id: null}
                  }
              })   
              
         }
        },
        share: {
            type: TransferType,
            args: {
                username: {type: GraphQLString},
                wif: {type: GraphQLString},
                author: {type: GraphQLString},
                permlink: {type: GraphQLString}

            },
            resolve(parent, args){
                var json = JSON.stringify(
                    ["reblog",{
                    account:args.username,
                    author:args.author,
                    permlink:args.permlink}
                    ]
                );
                 let trp = new Promise(function(resolve, reject) {             
                     api.broadcast.customJson(
                         args.wif,
                         [], // Required_auths
                         [args.username], // Required Posting Auths
                         'follow', // Id
                         json, //
                         function(err, result) {
                           //console.log(err, result);
                           resolve(result)
                         }
                       );
                 })
                 return trp.then(tr => {
                     if(tr!==undefined){
                         return {result: true, transaction_id: tr.id}
                     }
                     else {
                         return {result: false, transaction_id: null}
                     }
                 })   
                 
            }
           },
        generate_token: {
        type: ValidateUsernameType,
        resolve(parent, args){
            return {result: token_generate()};
        }     
    },
      
    generate_coupon: {
        type: CouponType,
        args: {
            value: {type: GraphQLString},
            accesstoken: {type: GraphQLString}
        },
        resolve(parent, args){

            let coupon = new Coupon({
                value: args.value,
                coupon_id: generate_random_password("COU")
            });
            if(args.accesstoken===SecretToken)
            {
                return coupon.save();
            }
            else{
            return {
                coupon_id: null,
                error: "Access Token Invalid!!"
            };
        }
        }
    }
  }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})
