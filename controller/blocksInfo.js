const express = require("express");
var async = require("async");
let blockInfo = require("../model/blockInfo");
let transaction = require("../model/transaction");
let userInfo = require("../model/users");
let userAddress = require("../model/userAddress");
const axios = require('axios');
const variiable = require('../config/variables');

let contracts = require("../model/contracts");
let token = require("../model/token");
const freezeInfo = require("../model/freeze_info");

const mongoose = require("../config/production"); // Adjust the path accordingly

const getHomePageData = async (req, response, next) => {
  try {
    let blockData = await getblockInfo();
    let transactions = await gettransactions();
    let listTransactions = await getlastTransaction();
    let totalAccount = await gettotalAccount();
    let totalcontracts = await gettotalcontracts();
    let totaltoken = await gettotaltoken();
    let totalstaked = await gettransactions24hours();
    let transactions24hours = await getaccount24hours();
    let account24hours = await getcontracts24hours();
    let contracts24hours = await gettotalStaked();
    let token24hours = await gettoken24hours();
    let staked24hours = await getstaked24hours();
    let blockData24hours = await getblockData24hours();

    const [blockDataResults, transactionResults] = await Promise.all([
      new Promise((resolve) => generateBlockData(blockData, resolve)),
      new Promise((resolve) =>
        generateTransactionData(listTransactions, resolve)
      ),
    ]);

    if (totalstaked[0]) {
      var totalstakedValue = totalstaked[0].totals / 1000000;
    } else {
      var totalstakedValue = totalstaked;
    }

    let recentBlk =
      blockDataResults.length > 0 ? blockDataResults[0].blockNumber : 0;

    let homePageData = {
      blockData: blockDataResults,
      latestCount: recentBlk,
      listTransactions: transactionResults,
      transactions,
      totalAccount,
      totalcontracts,
      totaltoken,
      totalstaked: totalstakedValue,
      transactions24hours,
      account24hours,
      contracts24hours,
      token24hours,
      staked24hours,
      blockData24hours,
    };

    return response.json({ success: 1, result: homePageData });
  } catch (error) {
    console.error("Error:", error.message);
    return response.json({ success: 0, error: error.message });
  } finally {
    try {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error.message);
    }
  }
};

const customBlockData = async (req, response, next) => {

	try {
	  const blockData = await blockInfo.find().sort({ created_at: -1 }).limit(8);
	  console.log(blockData)
	  const returnData = await generateBlockData(blockData);
  
	  return response.json({ success: 1, result: returnData });
	} catch (error) {
	  console.error("Error in customBlockData:", error);
	  return response.json({ success: 0, error: "Internal server error" });
	}
  }
  const getTransactionData = async (req, response, next) => {

	transaction.find().sort({created_at: -1}).limit(10).exec(function(err, res){
		generateTransactionData(res, function(returnData) {
			return response.json({success:1, result:returnData});
		})
	});
}


const getAddressinfoData = async (request, response, next) => {
	var address = request.body.address;
	console.log(address)
	transaction.find({$or:[{owner_address:address}, {to_address:address}]}).sort({created_at: -1}).exec(function(err, res){
		generateTransactionData(res, function(returnData) {
			return response.json({success:1, result:returnData});
		})
	});
};

const getBlockCount = async (request, response, next) => {
    try {
        const axiosResponse = await axios.get(variiable.blockchain_url + "/getCurrentBlock", {
            headers: { "Content-Type": "application/json" }
        });

        const resData = axiosResponse.data;

        if (resData.status) {
            const blockID = resData.getCurrentBlock.blockID;
            const count = await blockInfo.countDocuments({ 'blockID': blockID });

            if (!count) {
                const blockData = {
                    blockID: blockID,
                    blockNumber: resData.getCurrentBlock.block_header.raw_data.number,
                    txTrieRoot: resData.getCurrentBlock.block_header.raw_data.txTrieRoot,
                    witness_address: resData.getCurrentBlock.block_header.raw_data.witness_address,
                    parentHash: resData.getCurrentBlock.block_header.raw_data.parentHash,
                    version: resData.getCurrentBlock.block_header.raw_data.version,
                    timestamp: resData.getCurrentBlock.block_header.raw_data.timestamp,
                    witness_signature: resData.getCurrentBlock.block_header.witness_signature,
                    transaction_fetch_status: "0"
                };

                const createdBlock = await blockInfo.create(blockData);

                if (createdBlock) {
                    return response.json({ success: 1, blocknumber: createdBlock.blockNumber });
                } else {
                    return response.json({ success: 3, blocknumber: '0' });
                }
            } else {
                return response.json({ success: 4, blocknumber: '0' });
            }
        } else {
            return response.json({ success: 5, msg: "Failed to create address" });
        }
    } catch (error) {
        console.error("Error in getBlockCount:", error);
        return response.json({ success: 6, msg: "Error fetching block count" });
    }
};












const getblockInfo = () => {
  return new Promise(async (resolve, reject) => {
    const data = await blockInfo.find().sort({ created_at: -1 }).limit(8).exec();
    console.log("blockInfo", data);
    if (data) {
      resolve(data);
    } else {
      reject(new Error(data));
    }
  });
};

const gettransactions = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await transaction.findOne().sort({ created_at: -1 }).countDocuments().exec();
      console.log("transaction", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getlastTransaction = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await transaction
        .find({
          type: {
            $in: [
              "TransferContract",
              "TriggerSmartContract",
              "TransferAssetContract",
            ],
          },
        })
        .sort({ created_at: -1 })
        .limit(100)
        .exec();

      console.log("transaction", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const gettotalAccount = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await userAddress
        .findOne()
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const gettotalcontracts = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await contracts.find().countDocuments().exec();
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const gettotaltoken = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await token.find().countDocuments().exec();
      console.log("token", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const gettotalStaked = () => {
  return new Promise((resolve, reject) => {
    freezeInfo.find().exec(async (err1, data1) => {
      try {
        if (data1.length > 0) {
          const stakedData = await freezeInfo
            .aggregate([
              { $match: { status: "staked" } },
              { $group: { _id: "null", totals: { $sum: "$amount_staked" } } },
            ])
            .exec();
          console.log(stakedData);
          resolve(stakedData);
        } else {
          resolve(0); // Resolve with 0 if there is no data
        }
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  });
};

const gettransactions24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await transaction
        .find({
          created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      console.log("transaction", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getaccount24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await userInfo
        .find({
          created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: 1,
        })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      console.log("account24hours", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getcontracts24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await contracts
        .find({
          created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      console.log("getcontracts24hours", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const gettoken24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await token
        .find({
          created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      console.log("token", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getstaked24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await freezeInfo
        .aggregate([
          {
            $match: {
              status: "staked",
              staked_time: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: { _id: "null", totals: { $sum: "$amount_staked" } },
          },
        ])
        .exec();
      console.log("staked24hours", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getblockData24hours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await blockInfo
        .find({
          created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec();
      console.log("getblockData24hours", data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

function generateBlockData(data, callback) {
  var length = data.length;
  var result = [];
  if (length > 0) {
    var i = 1;
    data.forEach((val) => {
      let theDate = new Date(parseInt(val["timestamp"]));
      let currentDate = new Date();
      var timestamp = Math.abs(currentDate.getTime() - theDate.getTime());

      var delta = Math.abs(timestamp) / 1000;
      var diff = "";
      if (delta >= 86400) {
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        diff = days + " days ";
        if (delta >= 3600) {
          var hours = Math.floor(delta / 3600) % 24;
          delta -= hours * 3600;
          diff += hours + " hours ";
        }
        diff += " ago";
      } else if (delta >= 3600) {
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        diff = hours + " hours ";
        if (delta >= 60) {
          var minutes = Math.floor(delta / 60) % 60;
          delta -= minutes * 60;
          diff += minutes + " minutes ";
        }
        diff += " ago";
      } else if (delta >= 60) {
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        diff = minutes + " minutes ";
        if (delta != 0 && delta <= 60) {
          diff += parseInt(delta) + " seconds ";
        }
        diff += " ago";
      } else {
        var seconds = parseInt(delta) + " seconds ago ";
        diff += seconds;
      }
      transaction
        .find({ blockNumber: val["blockNumber"] })
        .sort({ created_at: -1 })
        .countDocuments()
        .exec(function (err, res) {
          var blockData = {
            blockNumber: val["blockNumber"],
            timediff: diff,
            status: "Completed",
            witness_address: val["witness_address"],
            transaction_count: res,
          };
          result.push(blockData);
          if (i == length) {
            callback(result);
          }
          i = i + 1;
        });
    });
  } else {
    callback([]);
  }
}

function generateTransactionData(data, callback) {
  var length = data.length;
  var result = [];
  if (length > 0) {
    var i = 1;
    data.forEach((val) => {
      let theDate = new Date(parseInt(val["timestamp"]));
      let currentDate = new Date();
      var timestamp = Math.abs(currentDate.getTime() - theDate.getTime());

      var delta = Math.abs(timestamp) / 1000;
      var diff = "";
      if (delta >= 86400) {
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        diff = days + " days ";
        if (delta >= 3600) {
          var hours = Math.floor(delta / 3600) % 24;
          delta -= hours * 3600;
          diff += hours + " hours ";
        }
        diff += " ago";
      } else if (delta >= 3600) {
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        diff = hours + " hours ";
        if (delta >= 60) {
          var minutes = Math.floor(delta / 60) % 60;
          delta -= minutes * 60;
          diff += minutes + " minutes ";
        }
        diff += " ago";
      } else if (delta >= 60) {
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        diff = minutes + " minutes ";
        if (delta != 0 && delta <= 60) {
          diff += parseInt(delta) + " seconds ";
        }
        diff += " ago";
      } else {
        var seconds = parseInt(delta) + " seconds ago ";
        diff += seconds;
      }

      if (val["type"] == "TriggerSmartContract") {
        var amount = val["amount"] / 1000000000000000000;
      } else {
        var amount = val["amount"] / 1000000;
      }

      var fromAddress = val["owner_address"];
      var toAddress = val["to_address"];
      var txID = val["txID"];

      var fromaddress_split =
        fromAddress.substring(0, 10) + "..." + fromAddress.slice(-6);
      var txID_split = txID.substring(0, 10) + "..." + txID.slice(-6);

      if (typeof toAddress !== "undefined") {
        var toaddress_split =
          toAddress.substring(0, 10) + "..." + toAddress.slice(-6);
      } else {
        var toaddress_split = "NaN";
      }
      if (val.type == "TransferContract") {
        val.type = "Transfer RUBY";
      } else if (val.type == "TriggerSmartContract") {
        val.type = "Transfer Token";
      }
      var transactionData = {
        txID: val["txID"],
        txID_split: txID_split,
        approveHash: val["witness_address"],
        amount: amount,
        from: val["owner_address"],
        to: val["to_address"],
        fromaddress_split: fromaddress_split,
        toaddress_split: toaddress_split,
        dateTime: diff,
        blockId: val["blockNumber"],
        method: val["type"],
        fee: val["fee"],
        energy_fee: val["energy_fee"],
        net_fee: val["net_fee"],
        created_at: val["created_at"] /*/ 1000000*/,
      };
      result.push(transactionData);
      if (i == length) {
        callback(result);
      }
      i = i + 1;
      //callback(result);
    });
  } else {
    callback([]);
  }
}

module.exports = {
  getHomePageData,
  customBlockData,
  getTransactionData,
  getAddressinfoData,
  getBlockCount
};
