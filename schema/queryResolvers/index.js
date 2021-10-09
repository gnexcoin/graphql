const { get_commissions_info } = require("./get_commissions_info");
const { get_customers_info } = require("./get_customers_info");
const { get_membership_info } = require("./get_membership_info");
const { get_sales_info } = require("./get_sales_info");
const { get_commissions_data } = require("./get_commissions_data");
const { get_customers_data } = require("./get_customers_data");
const { get_sales_data } = require("./get_sales_data");
const { get_commission_history } = require("./get_commission_history");
const { get_commission_history_p } = require("./get_commission_history_p");

const { get_deposit_history } = require("./get_deposit_history");
const { get_deposit_history_p } = require("./get_deposit_history");
const { get_customers_history, get_customers_history_p } = require("./get_customers_history");

const { get_withdrawal_history } = require("./get_withdrawal_history");
const { get_withdrawal_history_p } = require("./get_withdrawal_history");

const { get_package_history } = require("./get_package_history");
const { get_package_history_p } = require("./get_package_history");

const { get_memberships } = require("./get_memberships");
const { get_withdrawal_requests } = require("./get_withdrawal_requests");
const { get_deposit_requests } = require("./get_deposit_requests");
const { get_deposits_stats } = require("./get_deposits_stats");
const { get_withdrawals_stats } = require("./get_withdrawals_stats");


module.exports = {
    get_commission_history,
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
    get_withdrawal_requests
}