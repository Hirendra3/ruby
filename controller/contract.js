const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
var async  = require('async');
let common = require('../../helpers/common');
let socketdata = require('../../helpers/socketdata');
var endecrypt = require('../../helpers/newendecryption');
const multer = require('multer');

let moment = require('moment');
var validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');
var Client = require('node-rest-client').Client;

const path = require('path');
const fs = require('fs');
const solc_0_8 = require('solc0_8_13');
const solc_0_5 = require('solc0_5_10');
const solc_7_6 = require('solc0_7_6');
const solc_7_0 = require('solc0_7_0');
//var translate = require('solc/translate');
const cloudinary = require('../../helpers/cloudinary');
let user_token = require('../../model/user_tokens');
const variiable = require('../../config/variables');

const { createProxyMiddleware } = require('http-proxy-middleware')
const RubyWeb = require('rubyweb');

const cron = require('node-cron');

const TronTxDecoder = require('@beycandeveloper/tron-tx-decoder');
const decoder = new TronTxDecoder(variiable.fullNode);

const sessionStorage = require('node-sessionstorage');

function onProxyRes(proxyRes, req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-with,Content-Type,Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
}

var fullnode = express()
fullnode.use('/', createProxyMiddleware({
    target: variiable.fullNode,
    changeOrigin: true,
    onProxyRes
}))
fullnode.listen(8090)

var soliditynode = express()
soliditynode.use('/', createProxyMiddleware({
    target: variiable.solidityNode,
    changeOrigin: true,
    onProxyRes
}))
soliditynode.listen(8091)

const fullNode = variiable.fullNode;
const solidityNode = variiable.solidityNode; 
const eventServer = variiable.eventServer;
const privateKey = variiable.privateKey;

const rubyweb = new RubyWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

var restCli = new Client();

//schemas
const users = require('../../model/users');
const userAddr = require('../../model/userAddress');
const userBal = require('../../model/userBalance');
const amountTransfer = require('../../model/amountTransfer');
let transaction = require('../../model/transaction');
let contract = require('../../model/contract');
let contracts = require('../../model/contracts');
let token = require('../../model/token');
let eventsBlock = require('../../model/events_block');

var storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, common.randomString(8) + new Date().getTime() + file.originalname);
	}
});
var upload = multer({ storage: storage });

router.post('/getCompileResult', (req, response) => {
	var source = req.body.file_source;
	var input = {
		language: 'Solidity',
		sources: {
		    'TRC.sol': {
		      content: source
		    }
		},
		settings: {
		    outputSelection: {
		      '*': {
		        '*': ['*']
		      }
		    }
		}
	};
	 
	if(req.body.version == '0.8.6_Bacon_v4.3' || req.body.version == '0.8.0_Plato_v4.2') {
		output = JSON.parse(solc_0_8.compile(JSON.stringify(input)));
	} else if(req.body.version == '0.7.7_Bacon_v4.3') {
		output = JSON.parse(solc_7_6.compile(JSON.stringify(input)));
	} else if(req.body.version == '0.7.0_Plato_v4.2') {
		output = JSON.parse(solc_7_0.compile(JSON.stringify(input)));
	} else {
		output = JSON.parse(solc_0_5.compile(JSON.stringify(input)));
	}

	if(output['errors']) {
		response.json({success:0, compileData:output});
	} else {
		var result = [];
		for (var contractName in output.contracts['TRC.sol']) {
			var compileData = {
				contract_name:contractName,
				bytecode:output.contracts['TRC.sol'][contractName].evm.bytecode.object,
				abi:output.contracts['TRC.sol'][contractName]['abi'],
			}
			result.push(compileData);
		}
		sessionStorage.setItem('compileData', result);
		response.json({success:1, compileData:result});
	}
});

router.get('/sampleCall', async (req, res) => {
	sampleee()
	async function sampleee() {
		userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId('61e3bb5b366ae6b2f11eafaa')}).exec();
		res.json(userPk.privateKey);
	}
})

router.post('/createSmartContract', common.tokenMiddleware, async (req,res) => {
	if(isNum(req.body.fee_limit) == true){
		if(isNum(req.body.fee_percentage) == true){
			if(isNum(req.body.energy_limit) == true){
				createSmartContract();
				async function createSmartContract(){
					let userId = req.userId;
					userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
					if(userPk) {
						userPrivateKey = userPk.privateKey;
						useraddr = rubyweb.address.fromPrivateKey(userPrivateKey);
						let compileData = req.body.compileData;
						var length = Object.keys(compileData).length;
						for(let i =0; i <= length-1; i++) {
							if(compileData[i].contract_name == req.body.contract_name) {
								var abi = compileData[i].abi;
								var bytecode = compileData[i].bytecode;
							}
						}
						if(abi == "") {
							return res.json({success:0,message:"ABI data doesn't empty"});
						} 

						if(bytecode == "") {
							return res.json({success:0,message:"Byte code doesn't empty"});
						}

						let l_args = {
							feeLimit: req.body.fee_limit,
							callValue: 0,
							tokenId:"",
							tokenValue:0,
							userFeePercentage: req.body.fee_percentage,
							originEnergyLimit: req.body.energy_limit,
							abi: abi,
							bytecode:bytecode, //pass bytecode
							name:req.body.trx_token
						}

						if(req.body.trx_token == "TRC721") {
							//l_args['parameters'] = [req.body.token_name, req.body.token_symbol];
						} else if(req.body.trx_token == "TRC1155") {
							//l_args['parameters'] = [req.body.website_url];
						}
						//return res.json({l_args});
						rubyweb.transactionBuilder.createSmartContract(l_args,useraddr, function(err, transaction){
							if(err) {
								return res.json({success:0,message:err});
							}
							if(transaction) {
								rubyweb.ruby.sign(transaction, userPrivateKey, function(err1, signedTransaction){
									if(err1) {
										return res.json({success:0,message:err1});
									}

									if(!signedTransaction.signature){
										return res.json({success:0,message:"Transaction was not signed properly"});	
									}

									rubyweb.ruby.sendRawTransaction(signedTransaction, function(err2, contract){
										if(err2) {
											return res.json({success:0,message:err2});
										}
										let obj = {
											user_id : userId,
											txID : contract['txid'],
											contract_address : contract['transaction']['contract_address'],
											owner_address : contract['transaction']['raw_data']['contract'][0]['parameter']['value']['owner_address'],
											contract_name : req.body.contract_name,
											version : req.body.compilerOptions.version,
											runs : req.body.compilerOptions.runs,
											contract_status : "invalid",
											optimization : req.body.compilerOptions.optimization,
											user_address : useraddr,
											contract_type: req.body.trx_token,
										};
										   
										let isInserted = contracts.create(obj, function(err3, resData){
											if(err3) {
												return res.json({success:0,message:err3});
											}
											if(resData) {
												res.json({success:1, data:contract, txId:obj.txID, contract_address:obj.contract_address});
												//socketdata
												socketdata.socketpassdata('contracts', 'empty1', 'empty2');
											} else {
												res.json({success:0, message:"Please try again"});
											}
										});
									});
								});
							}
						})	
					} else {
						res.json({success:0,message:"Use privateKey Not found"});
					}
				}
			}else{
				res.json({success:0,message:"energy limit must be numerical format"});
			}
		}else{
			res.json({success:0,message:"fee percentage must be numerical format"});
		}
	}else{
		res.json({success:0,message:"fee limit must be numerical format"});
	}
})

// function socketpassdata(database, blockNumber, blockData){
// 	console.log(database);
// }

router.get('/contractList', function(req,response){
	contract.find().sort({created_at: -1}).exec(function(err, res){
		generateContractData(res, function(returnData) {
			return response.json({success:1, result:returnData});
		});
	});
});

router.get('/contractData', function(req, response){
	contracts.find().sort({created_at: -1}).exec(function(err, res){
		generateContractData(res, function(returnData) {
			return response.json({success:1, result:returnData});
		});
	});
});


function generateContractData(data, callback) {
	var length = data.length;
	var result = [];
	if(length > 0)
	{
		var i = 0;
		var args = { headers: {"Content-Type":"application/json"} };
		data.forEach((val) => {
			var contract_address = val['contract_address'];
			var user_address = val['user_address'];
			if(val['contract_type'] == 'TRC20')
			{
				let url = variiable.blockchain_url+"/balanceOf/"+contract_address+"/"+user_address;

				/*restCli.get(url, args, function(resData, err2) {
					transaction.find({'owner_address':val['owner_address'], 'type':'TriggerSmartContract'}).countDocuments().exec(function(err1, res) {
						contract_address_split = contract_address.substring(0, 8)+ "..." +contract_address.slice(36, 42);
						let License = (val['license'] == '') ? "-" : val['license'];
						let validated_on = val['expiration'];
						let txn_count = 0;
						let created_at = val['created_at'];
						if(resData) {
							var balance = parseInt(resData['Token_balance']['hex']) / 1000000000000000000;
						} else {
							var balance = "0.00";
						}

						var contract_data = {
							contract_address_split: contract_address_split,
							contract_address:contract_address,
							contract_name: val['contract_name'],
							txn_count : res,
							created_at : val['created_at'],
							version : val['version'],
							License : License,
							validated_on: val['validated_on'],
							balance : balance,
							status:val['contract_status']
						}
						result.push(contract_data);
						i = i+1;
						console.log(i);
						if(i == length) { callback(result);}
						i = i-1;
					});	
				});*/

				var contract_data = {
					contract_address_split: contract_address.substring(0, 8)+ "..." +contract_address.slice(36, 42),
					contract_address:contract_address,
					contract_name: val['contract_name'],
					txn_count : 0,
					created_at : val['created_at'],
					version : val['version'],
					License : val['license'],
					validated_on: val['validated_on'],
					balance : 0.00,
					status:val['contract_status']
				}
				result.push(contract_data);
				i = i+1;
				if(i == length) { callback(result);}
			} else {
				transaction.find({'owner_address':val['owner_address'], 'type':'TriggerSmartContract'}).countDocuments().exec(function(err1, res) {
					contract_address_split = contract_address.substring(0, 8)+ "..." +contract_address.slice(36, 42);
					let License = (val['license'] == '') ? "-" : val['license'];
					let validated_on = val['expiration'];
					let txn_count = 0;
					let created_at = val['created_at'];
					var balance = "0.00";
					var contract_data = {
						contract_address_split: contract_address_split,
						contract_address:contract_address,
						contract_name: val['contract_name'],
						txn_count : res,
						created_at : val['created_at'],
						version : val['version'],
						License : License,
						validated_on: val['validated_on'],
						balance : balance,
						status:val['contract_status']
					}
					result.push(contract_data);
					i = i+1;
					if(i == length) { callback(result);}
				});	
			}
		});
	} else {
		callback([]);
	}
}

router.post('/validateContract', common.tokenMiddleware, function(request, response) {
	checkaddres(request.body.contract_address, function(data1){
	    if(data1 == true){
			let userId  = request.userId;
			var source = request.body.file_source;
			var contract_name = request.body.contract_name;
			var contract_address = request.body.contract_address;
			var token_type = request.body.token_type;
			var input = {
			  	language: 'Solidity',
			 	sources: {
			    	'TRC.sol': {
			     	 content: source
			    	}
			  	},
				settings: {
				    outputSelection: {
				      '*': {
				        '*': ['*']
				      }
				    }
				}
			};

			if(request.body.compiler_version == '0.8.6_Bacon_v4.3' || request.body.compiler_version == '0.8.0_Plato_v4.2') {
				output = JSON.parse(solc_0_8.compile(JSON.stringify(input)));
			} else if(request.body.compiler_version == '0.7.7_Bacon_v4.3') {
				output = JSON.parse(solc_7_6.compile(JSON.stringify(input)));
			} else if(request.body.compiler_version == '0.7.0_Plato_v4.2') {
				output = JSON.parse(solc_7_0.compile(JSON.stringify(input)));
			} else {
				output = JSON.parse(solc_0_5.compile(JSON.stringify(input)));
			}
			
			// output = JSON.parse(solc_0_8.compile(JSON.stringify(input)));

			if(output['errors']) {
					response.json({success:0, compileData:output, msg:"compiler version doesn't match"});
			} else {
				var result = [];

				var names = Object.keys(output.contracts['TRC.sol']);
				var result = names.indexOf(contract_name);
				if(result > 0)
				{
					for (var contractName in output.contracts['TRC.sol']) {

						if(contract_name == contractName) {
							var bytecode_from_compile = output.contracts['TRC.sol'][contractName].evm.bytecode.object;
							var abi_from_compile = output.contracts['TRC.sol'][contractName]['abi'];
					
							var args = { headers: {"Content-Type":"application/json"} };
							var url = variiable.blockchain_url+"/getContract/"+contract_address;
							restCli.get(url, args, function (resData, err1) {  

								if(resData) {
									var bytecode_from_api = resData['Contract_details']['bytecode'];
									var abi_from_api = resData['Contract_details']['abi'];
									//response.json({abi_from_api:abi_from_api, abi_from_compile:abi_from_compile});

									/*if(bytecode_from_api == bytecode_from_compile) { }*/
									
									/*if((bytecode_from_api == bytecode_from_compile) && (abi_from_compile == abi_from_api)) {*/
									
									if(token_type == "TRC721"){
										var result = bytecode_from_api.includes(bytecode_from_compile);
									}else{
										var result = false;
									}


									if(bytecode_from_api == bytecode_from_compile && token_type == "TRC20" || bytecode_from_api == bytecode_from_compile && token_type == "TRC10" || bytecode_from_api == bytecode_from_compile && token_type == "TRC1155" || result == true)
									{
										var file_name = common.randomString(8) + new Date().getTime() +".sol";
										var file_path = 'uploads/'+file_name;
										fs.appendFile(file_path, source, function (err) {
										  	if (err) {
										  		response.json({success:0, msg:err});
										  	}

											userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, res1){
												var useraddr = res1.address_base58;

											  	var update_data = {
													contract_status: "verified",
													validated_on: new Date(),
													contract_file_name: file_name,
													license: request.body.contract_license,
													optimization : request.body.compiler_optimization
												}   

											  	contracts.updateOne({contract_address:contract_address, user_address: useraddr},{"$set": update_data} ).exec(function(err2, res2){
											  		if(res2.nModified > 0){
										  				contracts.findOne({contract_address:contract_address}).exec(function(err, res) {
									  						if(res) {
									  							response.json({success:1, result:res});
									  						}
									  						if(err) {
									  							response.json({success:0, msg:"Please try again"});
									  						}	
									  					});
											  		}else {
											  			response.json({success:0, msg:"Contract Owneraddress doesn't matched"});
											  		}
												})
										  	});
										});

									} else {
										response.json({success:0, msg:"Contract info doesn't matched"});
									}
								} else {
									response.json({success:0, msg:"Contract info not found"});
								}
							})
						}	
					}
				} else {
					return response.json({success:0, msg:"Contract Name doesn't matched"});
				}
			}
	    }else{
	    	res.json({success:0,message:"contract address must be address format"});
	    }
	})
});

router.post('/contract_info', function(request, response) {
	let address = request.body.address;
	contracts.findOne({contract_address:address}).exec(function(err, res) {
		if(res) {
			var responseData = res;
			var args = { headers: {"Content-Type":"application/json"} };
			var url = variiable.blockchain_url+"/getContract/"+address;
			restCli.get(url, args, function (resData, err1) {
				if(resData.status) {
					var bytecode = resData['Contract_details']['bytecode'];
					var abi = resData['Contract_details']['abi'];
				} else {
					var bytecode = '';
					var abi = [];
				}
				transaction.find({'owner_address':res.owner_address, 'type':'TriggerSmartContract'}).countDocuments().exec(function(err3, res3) {
					if(res) {
						var count = res3;
					} else {
						var count = 0;
					}
					userAddr.findOne({address_base58: res.user_address}).exec(function(err4, data) {
						if(res.contract_type == "TRC1155")
						{
							var balance = "0.00";
							if(data) {
								var addressHash = data.address_hex;
							} else {
								var addressHash = res.user_address;
							} 
							var file_name = 'uploads/'+res.contract_file_name;
							fs.readFile(file_name, 'utf8', function(err, data2){
								if(data2) {
									var code = data2;	
								} else {
									var code = '';
								} 
								var responseData = res;
								var compileData = {bytecode:bytecode, abi:abi};
								getabidetails(abi.entrys, function(returnData, returnvalue) {
									response.json({success:1,contract_data:responseData,compileData:compileData, balance:balance, count:count,useraddr:addressHash,code:code, read_contract: returnData, write_contract: returnvalue});
								});
							});
						} else {
							balanceOf()
							async function balanceOf(){
								let instance = await rubyweb.contract().at(address)
								let result = await instance["balanceOf"](res.user_address).call();
								if(result){
									var balance = parseInt(result['_hex'])/1000000000000000000;
								}else{
									var balance = "0.00";
								}
								if(data) {
									var addressHash = data.address_hex;
								} else {
									var addressHash = res.user_address;
								} 
								var file_name = 'uploads/'+res.contract_file_name;
								fs.readFile(file_name, 'utf8', function(err, data2){
									if(data2) {
										var code = data2;	
									} else {
										var code = '';
									} 
									var responseData = res;
									var compileData = {bytecode:bytecode, abi:abi};
									getabidetails(abi.entrys, function(returnData, returnvalue) {
										response.json({success:1,contract_data:responseData,compileData:compileData, balance:balance, count:count,useraddr:addressHash,code:code, read_contract: returnData, write_contract: returnvalue});
									});
								});
							}
							/*let url = variiable.blockchain_url+"/balanceOf/"+address+"/"+res.user_address;
							restCli.get(url, args, function(resData1, err2) {
								if(resData1) {
									console.log(resData1);
									var balance = parseInt(resData1['Token_balance']['hex']) / 1000000000000000000;
								} else {
									var balance = "0.00";
								}
								if(data) {
									var addressHash = data.address_hex;
								} else {
									var addressHash = res.user_address;
								} 
								var file_name = 'uploads/'+res.contract_file_name;
								fs.readFile(file_name, 'utf8', function(err, data2){
									if(data2) {
										var code = data2;	
									} else {
										var code = '';
									} 
									var responseData = res;
									var compileData = {bytecode:bytecode, abi:abi};
									getabidetails(abi.entrys, function(returnData, returnvalue) {
										response.json({success:1,contract_data:responseData,compileData:compileData, balance:balance, count:count,useraddr:addressHash,code:code, read_contract: returnData, write_contract: returnvalue});
									});
								});
							});*/
						}
					});
				});
			});

			/*var bytecode = '';
			var abi = [];
			transaction.find({'owner_address':res.owner_address, 'type':'TriggerSmartContract'}).countDocuments().exec(function(err3, res3) {
				if(res) {var count = res3;
				} else {var count = 0;}
				userAddr.findOne({address_base58: res.user_address}).exec(function(err4, data) {
					if(res.contract_type == "TRC1155"){
						var balance = "0.00";
						if(data) {
							var addressHash = data.address_hex;
						} else {
							var addressHash = res.user_address;
						}
						var file_name = 'uploads/'+res.contract_file_name;
						fs.readFile(file_name, 'utf8', function(err, data2){
							if(data2) {
								var code = data2;	
							} else {
								var code = '';
							} 
							var responseData = res;
							var compileData = {bytecode:bytecode, abi:abi};
							getabidetails(abi.entrys, function(returnData, returnvalue) {
								response.json({success:1,contract_data:responseData,compileData:compileData, balance:balance, count:count,useraddr:addressHash,code:code, read_contract: returnData, write_contract: returnvalue});
							});
						});

					} else {
						var balance = "0.00";
						if(data) {
							var addressHash = data.address_hex;
						} else {
							var addressHash = res.user_address;
						} 
						var file_name = 'uploads/'+res.contract_file_name;
						fs.readFile(file_name, 'utf8', function(err, data2){
							if(data2) {
								var code = data2;	
							} else {
								var code = '';
							} 
							var responseData = res;
							var compileData = {bytecode:bytecode, abi:abi};
							getabidetails(abi.entrys, function(returnData, returnvalue) {
								response.json({success:1,contract_data:responseData,compileData:compileData, balance:balance, count:count,useraddr:addressHash,code:code, read_contract: returnData, write_contract: returnvalue});
							});
						});
					}
				});
			});*/

		} else {
			response.json({success:0,message:"Contract info not found"});
		}
	})
});

function getabidetails(data, callback, secondval){
	if(data == undefined){
		callback([]);
	}else{
		var length = data.length;
		var read_contract = [];
		var write_contract = [];
		if(length > 0) {
			var i = 1;
			data.forEach((val) => {
				if(val.type == "Function" || val.type == "function"){
					if(val.stateMutability == "View" || val.stateMutability == "view"){
						read_contract.push(val);
					}else if(val.stateMutability == "Pay" || val.stateMutability == "pay" || val.stateMutability == "Nonpayable" || val.stateMutability == "nonpayable"){
						write_contract.push(val);
					}
				}
				if(i == length) { callback(read_contract, write_contract); }
				i = i+1;
			})
		} else {
				callback([]);
		}
	}
}

router.post('/getContractInfo', common.tokenMiddleware, function(req,res) {
	let userId  = req.userId;
	var contract_address = req.body.contract_address;
	contracts.findOne({contract_address: contract_address, contract_status: 'verified'}).exec(function(err, res1) {
		if(res1) {
			token.findOne({contract_address:contract_address}).exec(function(err2, res2) {
				if(res2){
					res.json({success:0,message:"Contract already used"});
				}else{
					res.json({success:1,data:res1});
				}
			})
		} else {
			res.json({success:0,message:"Contract address not verified yet!"});
		}
	});
});

router.post('/checkTokenName', common.tokenMiddleware, function(req, res) {
	let userId  = req.userId;
	var token_name = req.body.token_name;
	token.find({token_name:token_name}).countDocuments().exec(function(err3, res3) { 
		if(res3 > 0) {
			res.json({success:0, message:"Token name already exist"});
		} else {
			res.json({success:1});
		}
	});
});


function uploadcheck(req, cb) {
	var uploadImg = "";
	if(req.file != null && req.file != undefined && req.file.path != "") {
		cloudinary.uploadImage(req.file.path,function(imgRes){
			if(imgRes != undefined) {
				uploadImg = imgRes.secure_url;
				cb(uploadImg);
			} else {
				cb(uploadImg);
			}
		});
	} else {
		cb(uploadImg);
	}
}


/*router.post('/checkContractExist', function (req, res) {
	let usrname = validator.isEmpty(req.body.username);
	//return res.json({dddd:usrname});
  users.find({'username': req.body.username }).countDocuments().exec(function (err, data) {

    if(err){
    	return res.json({success:2, msg:"Try again later"});
    }
    if(data && !usrname){
      return res.json({success:0, msg:"username already exists"});
    } else {
      return res.json({success:1});
    }
  });
});

router.post('/checkTokenNameExist', function (req, res) {
	let usrname = validator.isEmpty(req.body.username);
	//return res.json({dddd:usrname});
  users.find({'username': req.body.username }).countDocuments().exec(function (err, data) {

    if(err){
    	return res.json({success:2, msg:"Try again later"});
    }
    if(data && !usrname){
      return res.json({success:0, msg:"username already exists"});
    } else {
      return res.json({success:1});
    }
  });
});*/


router.post('/saveTokenInfo', upload.single('token_logo1'), common.tokenMiddleware, (req, res) => {
	saveToken()
	async function saveToken(){
		var data = req.body;
		let userId = req.userId;
		uploadcheck(req, function(uploadImg) {
			let obj = {
				user_id: userId,
				contract_address: data.contract_address,
				token_name: data.token_name,
				token_abbr: data.token_abbr,
				token_intro: data.token_intro,
				token_supply: data.token_supply,
				decimal_place: data.decimal_place,
				issuer: data.issuer,
				token_logo: uploadImg,
				website_url: data.website_url,
				email: data.email,
				github_url: data.github_url,
				white_paper_url: data.white_paper_url,
				twitter_url: (data.twitter_url) ? data.twitter_url : '',
				facebook_url: (data.facebook_url) ? data.facebook_url : '',
				telegram_url: (data.telegram_url) ? data.telegram_url : '',
				webibo_url: (data.webibo_url) ? data.webibo_url : '',
				token_info: contract,
				token_type: data.token_type,
				owner_address: data.owner_address,
			}

			let isInserted = token.create(obj);
			if(isInserted) {
				res.json({success:1, message:"Token created"});
				//socketdata
				socketdata.socketpassdata('token', 'empty1', 'empty2');
			} else {
				res.json({success:0, message:"Please try again"});
			}
		});
	}
});


router.post('/createToken', upload.single('token_logo1'), common.tokenMiddleware, (req,res) => {
	createToken()
	async function createToken(){
		var data = req.body;
		let userId = req.userId;
		var args = { headers: {"Content-Type":"application/json"} };
		userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
		var url = variiable.blockchain_url+"/balance/"+userPk.address_base58;

		restCli.get(url, args, async function(resData1, err2) { 
			var balance = parseFloat(resData1['RUBY_Balance']) / 1000000;
			if(balance >= 5) {
				var dateString = data.sale_start;
				var sale_start = new Date(dateString);
				sale_start = sale_start.getTime();

				var dateString = data.sale_end+" 23:59:59";
				var sale_end = new Date(dateString);
				sale_end = sale_end.getTime();

				//goto
				const hrn_options = {
					name 				: data.token_name1,
					abbreviation 		: data.token_abbr1,
					description 		: data.token_intro1,
					url 				: data.website_url1,
					totalSupply 		: parseFloat(data.token_supply),
					trxRatio 			: 1, 
					tokenRatio 			: data.Token_ratio, 
					saleStart 			: sale_start,
					saleEnd 			: sale_end,
					freeBandwidth 		: 0,
					freeBandwidthLimit 	: 0, 
					frozenAmount 		: parseFloat(data.frozen_amount),
					frozenDuration 		: parseFloat(data.frozen_duration),
					precision 			: parseInt(data.decimal_place),
				}
				userpk = userPk.privateKey;

				useraddr = rubyweb.address.fromPrivateKey(userpk);
				rubyweb.transactionBuilder.createToken(hrn_options, useraddr, function(err3, transaction) {

					if(err3) {
						var message = err3.split(':');
						return res.json({success:0,message:message[1]});
					}

					if(transaction) {
						rubyweb.ruby.sign(transaction, userpk, function(err4, signedTransaction) {
							if(err4) {
								//var message = err4.split(':');
								//return res.json({success:0,message:message[1]});
								return res.json({success:0,message:err4});
							}

							if(!signedTransaction.signature) {
								return res.json({success:0,message:"Transaction was not signed properly"}); 
							}

							rubyweb.ruby.sendRawTransaction(signedTransaction, function(err5, contract) {
								if(err5) {
									return res.json({success:0,message:err5});
								}

								uploadcheck(req, function(uploadImg) { 
									let obj = {
										user_id: userId,
										contract_address: data.contract_address,
										token_name: data.token_name1,
										token_abbr: data.token_abbr1,
										token_intro: data.token_intro1,
										token_supply: data.token_supply,
										decimal_place: data.decimal_place,
										issuer: data.issuer,
										token_logo: uploadImg,
										website_url: data.website_url1,
										email: data.email,
										github_url: data.github_url,
										white_paper_url: data.white_paper_url,
										twitter_url: (data.twitter_url) ? data.twitter_url : '',
										facebook_url: (data.facebook_url) ? data.facebook_url : '',
										telegram_url: (data.telegram_url) ? data.telegram_url : '',
										webibo_url: (data.webibo_url) ? data.webibo_url : '',
										token_info: contract,
										token_type: 'RUBY10',
										frozen_amount: parseFloat(data.frozen_amount),
										frozen_days: parseFloat(data.frozen_duration),
										ruby_num: data.Token_ratio,
										owner_address: data.owner_address,
										owner_address_hex: userPk.address_hex,
										transaction: transaction,
										issuer_start: sale_start,
										issuer_end: sale_end,
									}

									let isInserted = token.create(obj);
									if(isInserted) {
										return res.json({transaction:transaction,signedTransaction:signedTransaction,contract:contract});
										res.json({success:1, message:"Token created"});
									} else {
										res.json({success:0, message:"Please try again"});
									}
								});
							});
						});	
					} else {
						res.json({success:0,message:"Please try again"});
					}
				});
			} else {
				res.json({success:0,message:"Issuing RUBY10 Token consumes 5 RUBY, and you have insufficient RUBY in your balance."});
			}
		});
	}
});


cron.schedule('*/10 * * * * *', () => {
   getTokenIdfromAPI();
});

function getTokenIdfromAPI()
{
	rubyweb.ruby.listTokens().then(result => {
		result.forEach((val) => {
			owner_address = new RegExp(["^", val.owner_address, "$"].join(""), "i");
			token.findOne({tokenId:"", token_type:'RUBY10', owner_address_hex: owner_address}).exec((err1, data1) => {
				if(data1){
					token.updateOne({owner_address_hex: owner_address, token_name:val.name}, {"$set":{tokenId:val.id}}).exec((err, data) => {
						if(err){
							console.log("Token is not updated id");
						}
					});
				}
			});
		});
	});
}

router.get('/getTokenData', function(req, response){
	token.find().sort({created_at: -1}).exec(function(err, res){
		if(res){ 
			generateTokenData(res, function(ruby1155, ruby20, ruby721, ruby10) {
				token.find().countDocuments().exec(function(err1, count){
					token.find( {"created_at":{$gt:new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}}).sort({created_at: -1}).countDocuments().exec(function(err2, last7days){
						if(last7days){
							return response.json({success:1, TRC1155list:ruby1155, TRC20list:ruby20, TRC721list:ruby721, TRC10list:ruby10, totalcount: count, lastweekcount: last7days});
						}else{
							return response.json({success:1, TRC1155list:ruby1155, TRC20list:ruby20, TRC721list:ruby721, TRC10list:ruby10, totalcount: count, lastweekcount: "0"});
						}
					});
				});
				//res.json({status: true, "Token_details": result})
			});
		}else{
			response.json({success:0, message: "token not found"});
		}
	});
});

function generateTokenData(data, callback, ruby20, ruby721, ruby10) {
	var length = data.length;
	var result = [];
	var result20 = [];
	var result10 = [];
	var result1155 = [];
	var result721 = [];
	if(length > 0) {
		var i = 1;
		var args = { headers: {"Content-Type":"application/json"} };
		data.forEach((val) => {
			var ownewradd = val['owner_address'];
			var useradd = val['owner_address'];
			transaction.find({'owner_address': ownewradd, 'type':'TriggerSmartContract'}).countDocuments().exec((err2, data2)=>{
				if(data2){
					var transcount = data2;
				}else{
					var transcount = 0;
				}

				var token_data = {
					token_name: val['token_name'],
					token_intro:val['token_intro'],
					token_logo: val['token_logo'],
					transactioncount: transcount,
					token_supply : val['token_supply'],
					decimal_place:val['decimal_place'],
					id: val['tokenId'],
					created_at: val['created_at'],
					token_type: val['token_type'],
				}

				if(val.token_type == "RUBY10"){
					var address = val['owner_address'];
					var contract_address_split = address.substring(0, 8)+ "..." +address.slice(-6);
					rubyweb.ruby.getAccount(address).then(result => {
						var asset = result.assetV2;
						asset.forEach((val1) => {
							if(val1.key == val['tokenId']){
								var balance = val1.value;
							}else{
								var balance = "0.00";
							}
							token_data.contract_address_split = contract_address_split;
							token_data.contract_address = address;
							token_data.tokenbalance = balance;

							if(val.token_type == "RUBY20"){result20.push(token_data);
							}else if(val.token_type == "RUBY10"){result10.push(token_data);
							}else if(val.token_type == "RUBY721"){result721.push(token_data);
							}else if(val.token_type == "RUBY1155"){result1155.push(token_data);
							}else{result.push(token_data);}
							if(i == length) { callback(result1155, result20, result721, result10); }
							i = i+1;
						})
					})
					
					/*if(i == length) { callback(result1155, result20, result721, result10); }
					i = i+1;*/

				}else if(val.token_type == "RUBY20"){
					balanceOf()
					async function balanceOf(){
						var address = val['contract_address'];
						var contract_address_split = address.substring(0, 8)+ "..." +address.slice(36, 42);
						let instance = await rubyweb.contract().at(address);
						let result = await instance["balanceOf"](val['owner_address']).call();
						
						if(result){
							var balance = parseInt(result['_hex'])/1000000000000000000;
						}else{
							var balance = "0.00";
						}
						token_data.contract_address_split = contract_address_split;
						token_data.contract_address = address;
						token_data.tokenbalance = balance;

						if(val.token_type == "RUBY20"){result20.push(token_data);
						}else if(val.token_type == "RUBY10"){result10.push(token_data);
						}else if(val.token_type == "RUBY721"){result721.push(token_data);
						}else if(val.token_type == "RUBY1155"){result1155.push(token_data);
						}else{result.push(token_data);}
						if(i == length) { callback(result1155, result20, result721, result10, result); }
						i = i+1;
					}

					/*if(i == length) { callback(result1155, result20, result721, result10, result); }
					i = i+1;*/
				}else{
					var address = val['contract_address'];
					var contract_address_split = address.substring(0, 8)+ "..." +address.slice(36, 42);
					var balance = "0.00";

					token_data.contract_address_split = contract_address_split;
					token_data.contract_address = address;
					token_data.tokenbalance = balance;

					if(val.token_type == "RUBY20"){result20.push(token_data);
					}else if(val.token_type == "RUBY10"){result10.push(token_data);
					}else if(val.token_type == "RUBY721"){result721.push(token_data);
					}else if(val.token_type == "RUBY1155"){result1155.push(token_data);
					}else{result.push(token_data);}
					if(i == length) { callback(result1155, result20, result721, result10, result); }
					i = i+1;
				}
			})
		});
	} else {
		callback(result1155, result20, result721, result10, result);
	}
}

router.get('/balanceOf/:caddr/:uaddr', (req,res) => {
	balanceOf()
	async function balanceOf(){
		let instance = await rubyweb.contract().at(req.params.caddr) //deployed contract address
		let result = await instance["balanceOf"](req.params.uaddr).call(); //userAddr for balance check
		res.json({status: true, "Token_balance": (result)})
	}
})

function isNum(val){
  return !isNaN(Number(val))
}


function checkaddres(value, callback){
	var url = variiable.blockchain_url+"/isAddress/"+value;
	var args = { headers: {"Content-Type":"application/json"} };
	restCli.get(url, args, function (resData, resp) { 
		if(resData['status'] == true && resData['isAddress'] == true)
		{
				return callback(true);
		} else {
				return callback(false);
		}

	});
	// return callback(true);
}

router.post('/sendToken', common.tokenMiddleware, (req,res) => {
	if(isNum(req.body.amount) == true){
		checkaddres(req.body.caddr, function(data1){
	    	if(data1 == true){
				checkaddres(req.body.user_address, function(data2){
			    	if(data2 == true){

					/*transferToken()
					async function transferToken(){
						let instance = await rubyweb.contract().at(req.params.caddr);
						let result = await instance["transfer"](req.params.taddr,req.params.amount).send({
							callValue: 0,		
						}); //toaddress , amount
						res.json({status: true, "Set_write": result})
					}*/

						transferToken()
						async function transferToken(){
							var data = req.body;
							let userId = req.userId;
							amount = parseFloat((data.amount * 1000000000000000000), 16);
							amount = BigInt(amount).toString();
							userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
							var privateKey = userPk.privateKey;
							var conaddr = req.body.caddr;
							var usaddr = req.body.user_address;
							
							const rubyweb = new RubyWeb(fullNode, solidityNode, eventServer, privateKey);

							balanceOf()
							async function balanceOf(){
								let instance = await rubyweb.contract().at(conaddr);
								let bal = await instance["balanceOf"](usaddr).call();
								if(bal){
									var tokenbal = parseInt(bal['_hex'])/1000000000000000000;
								}else{
									var tokenbal = 0;
								}
								if(tokenbal >= req.body.amount){
									try{
										let instance1 = await rubyweb.contract().at(data.caddr);
										let result = await instance1["transfer"](data.toAddress,amount).send({
											callValue: 0,
										})
										res.json({success: 1, "Set_write": result, message: "Transaction success"});
									}
									catch(e){
										console.log(e);
									}
								}else{
									res.json({success:0,message:"Insufficient Balance"});
								}
							}
						}
			    	}else{
			    		res.json({success:0,message:"user address must be address format"});
			    	}
			    })
	    	}else{
	    		res.json({success:0,message:"Contract address must be address format"});
	    	}
	    })
	}else{
		res.json({success:0,message:"amount must be numerical format"});
	}
})

router.get('/transferToken/:caadr/:taddr/:amount', (req,res) => {
		transferToken()
		async function transferToken(){
			/*contract_address = '28e1b88e9554506c55ad33542a55765c71cc555ed1';
			to_address = '';
			amount = '';*/

			var privateKey = '0466F870887512209B9774C457385AB2858C9EDE72A24A920C25D1825DAC4A2DC38D955998C254E1325821E25822CB00194BFE3881C699ECFE8C53B93E5D7B040A';
			const rubyweb = new rubyweb(
			    fullNode,
			    solidityNode,
			    eventServer,
			    privateKey
			);

			let instance = await rubyweb.contract().at(req.params.caddr) //deployed contract address
			let result = await instance["transfer"](req.params.taddr,req.params.amount).send({
				callValue: 0,		
			}); //toaddress , amount
			res.json({status: true, "Set_write": result})
		}
})

router.get('/funccall', (req,res) => {
	funccall()
	async function funccall(){
		let instance = await rubyweb.contract().at('WXnQo4JJr2ccLNKyEotFsemkCynDjgHFoi')
		let result = await instance["balanceOf"]('WdnMMLUmDdCfvq1uGnow7dbc8a2su2h5cH').call();
		res.json({status: true, "Get_call": (result.balance)});
	}
})

router.get('/listTokens/:limit/:offset', (req,res) => {
	listTokens()
	async function listTokens(){
		rubyweb.ruby.listTokens().then(result => {
			res.json({status: true, "Token_details": result})
		});
	}
})


router.post('/searchTransactionData', function(request, response) {
	let addr = request.body.searchHash;
	addr = addr.toLowerCase();
	//return response.json({addr:addr});
	transaction.find({'owner_address':addr, 'type':'TriggerSmartContract'}).sort({created_at: -1}).limit(10).exec(function(err, res){
		generateTransactionData(res, addr, function(returnData) {
			return response.json({success:1, result:returnData});
		})
	});
});

function generateTransactionData(data, address, callback) { 
	var length = data.length;
	var result = [];
	if(length > 0) {
		var i = 1;
		data.forEach((val) => {
			let theDate = new Date(parseInt(val['timestamp']));
			
			if(address == val['owner_address']) {
					var type = "Send";
			} else {
					var type = "Receive";
			}

			if(val['type'] == 'TriggerSmartContract') {
				var amount = val['amount'] / 1000000000000000000;
			} else {
				var amount = val['amount'] / 1000000;
			}

			var args = { headers: {"Content-Type":"application/json"} };
			var url = variiable.blockchain_url+"/getAddress/"+val.owner_address;

			restCli.get(url, args, function (resData1, err1) { 
				if(resData1) {
					var url = variiable.blockchain_url+"/getAddress/"+val.to_address;
					restCli.get(url, args, function (resData2, err2) {

						var txID_split = val.txID.substring(0, 10)+ "..." +val.txID.slice(-6);
						var formaddress_split = resData1.getAddress.substring(0, 10)+ "..." +resData1.getAddress.slice(-6);
						var toaddress_split = resData2.getAddress.substring(0, 10)+ "..." +resData2.getAddress.slice(-6);

						if(resData2) {
							var transactionData = {
								txID:val.txID,
								txID_split:txID_split,
								approveHash:val['witness_address'],
								amount:amount,
								from:resData1.getAddress,
								to:resData2.getAddress,
								formaddress_split: formaddress_split,
								toaddress_split:toaddress_split,
								type:type,
								dateTime:theDate,
								blockId:val['blockNumber'],
								method:val['type'],
								fee:val['fee']
							}
							result.push(transactionData);
							if(i == length) { callback(result); }
							i = i+1;
						}
					});
				}
			});
		});
	} else {
			callback([]);
	}
}

router.post('/readContractData', common.tokenMiddleware, function(req, res) {
	var userId = req.userId;
	var conaddr = req.body.conaddr;
	var name = req.body.name;
	var input = req.body.input;
	var inttype = req.body.type; 

    var array = Object.keys(input)
    .map(function(key) {
        return input[key];
    });

	//     var array1 = array.toString();
	// console.log(array1);
		test1 = array[0];
		test2 = array[1];
		test3 = array[2];
		test4 = array[3];
		test5 = array[4];
		test6 = array[5];
		test7 = array[6];
		test8 = array[7];
	// console.log(test1+","+test2);
	var keyreadlangth = Object.keys(input).length;

	funccall()
	async function funccall(){
		userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
		var privateKey = userPk.privateKey;
		const rubyweb = new RubyWeb(fullNode, solidityNode, eventServer, privateKey);

		var instance = await rubyweb.contract().at(conaddr);

		if(keyreadlangth == 1){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var resultreadvalue =  await instance[name](test1).call();
		}else if(keyreadlangth == 2){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2).call();
		}else if(keyreadlangth == 3){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3).call();
		}else if(keyreadlangth == 4){
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3, test4).call();
		}else if(keyreadlangth == 5){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3, test4, test5).call();
		}else if(keyreadlangth == 6){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3, test4, test5, test6).call();
		}else if(keyreadlangth == 7){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			var ttype6 = inttype.filter(type => type.name == Object.keys(input)[6]);
			if(ttype6[0].type == 'uint256[]' || ttype6[0].type == 'address[]') {
				test7 = test7.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3, test4, test5, test6, test7).call();
		}else if(keyreadlangth == 8){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			var ttype6 = inttype.filter(type => type.name == Object.keys(input)[6]);
			if(ttype6[0].type == 'uint256[]' || ttype6[0].type == 'address[]') {
				test7 = test7.split(',');
			}
			var ttype7 = inttype.filter(type => type.name == Object.keys(input)[7]);
			if(ttype7[0].type == 'uint256[]' || ttype7[0].type == 'address[]') {
				test8 = test8.split(',');
			}
			var resultreadvalue =  await instance[name](test1, test2, test3, test4, test5, test6, test7, test8).call();
		}else{
			var resultreadvalue =  await instance[name]().call();
		}
		var result = resultreadvalue;
		var obj = {
			user_id : userId,
			contract_address : conaddr,
			input_params: array,
			name: name,
			output:result,
			type: "readContract",
			input_types: inttype,
		};
		eventsBlock.create(obj);
		res.json({status: true, "Get_call": (result)});
	}
})


router.post('/writeContractData', common.tokenMiddleware, function(req, res) {
	var userId = req.userId;
	var conaddr = req.body.conaddr;
	var name = req.body.name;
	var input = req.body.input;
	var inttype = req.body.type; 

    var array = Object.keys(input).map(function(key) {
        return input[key];
    });
    //console.log(Object.keys(input)[0]);
    
	test1 = array[0];
	test2 = array[1];
	test3 = array[2];
	test4 = array[3];
	test5 = array[4];
	test6 = array[5];
	test7 = array[6];
	test8 = array[7];

	var keywritelangth = Object.keys(input).length;

	// amount = parseFloat((data.amount * 1000000000000000000), 16);
	// amount = BigInt(amount).toString();
	funcwrite()
	async function funcwrite(){
		userPk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
		var privateKey = userPk.privateKey;
		// const rubyweb = new rubyweb(fullNode, solidityNode, eventServer, privateKey);
		const rubyweb = new RubyWeb(fullNode, solidityNode, eventServer, privateKey);
		
		var instance = await rubyweb.contract().at(conaddr);
		if(keywritelangth == 1){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 2){
			//return res.json({ttype});
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 3){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 4){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3, test4).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 5){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3, test4, test5).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 6){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3, test4, test5, test6).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 7){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			var ttype6 = inttype.filter(type => type.name == Object.keys(input)[6]);
			if(ttype6[0].type == 'uint256[]' || ttype6[0].type == 'address[]') {
				test7 = test7.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3, test4, test5, test6, test7).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else if(keywritelangth == 8){
			var ttype = inttype.filter(type => type.name == Object.keys(input)[0]);
			if(ttype[0].type == 'uint256[]' || ttype[0].type == 'address[]') {
				test1 = test1.split(',');
			}
			var ttype1 = inttype.filter(type => type.name == Object.keys(input)[1]);
			if(ttype1[0].type == 'uint256[]' || ttype1[0].type == 'address[]') {
				test2 = test2.split(',');
			}
			var ttype2 = inttype.filter(type => type.name == Object.keys(input)[2]);
			if(ttype2[0].type == 'uint256[]' || ttype2[0].type == 'address[]') {
				test3 = test3.split(',');
			}
			var ttype3 = inttype.filter(type => type.name == Object.keys(input)[3]);
			if(ttype3[0].type == 'uint256[]' || ttype3[0].type == 'address[]') {
				test4 = test4.split(',');
			}
			var ttype4 = inttype.filter(type => type.name == Object.keys(input)[4]);
			if(ttype4[0].type == 'uint256[]' || ttype4[0].type == 'address[]') {
				test5 = test5.split(',');
			}
			var ttype5 = inttype.filter(type => type.name == Object.keys(input)[5]);
			if(ttype5[0].type == 'uint256[]' || ttype5[0].type == 'address[]') {
				test6 = test6.split(',');
			}
			var ttype6 = inttype.filter(type => type.name == Object.keys(input)[6]);
			if(ttype6[0].type == 'uint256[]' || ttype6[0].type == 'address[]') {
				test7 = test7.split(',');
			}
			var ttype7 = inttype.filter(type => type.name == Object.keys(input)[7]);
			if(ttype7[0].type == 'uint256[]' || ttype7[0].type == 'address[]') {
				test8 = test8.split(',');
			}
			try{
				var resultwritevalue =  await instance[name](test1, test2, test3, test4, test5, test6, test7, test8).send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}else {
			try{
				var resultwritevalue =  await instance[name]().send({callValue: 0});
			}
			catch(e){
				console.log(e);
			}
		}


		var result = resultwritevalue;
		var obj = {
			user_id : userId,
			contract_address : conaddr,
			input_params: array,
			name: name,
			output:result,
			type: "writeContract",
			input_types: inttype,
		};
		eventsBlock.create(obj);
		return res.json({status: true, "Set_write": result});
		
		/*console.log('result : '+ result);
		if(name == "mint") {
			const decodedInput = await decoder.decodeResultById(resultwritevalue);
			var tokenId = parseInt(decodedInput.decodedOutput['0']['_hex']);
			console.log('tokenId : ' +tokenId);
			
		} else {*/
		
		//	}
	}
});	

router.post('/getTxInfo', common.tokenMiddleware, async function(req, res) {
	var txId = req.body.txnhash;
	const decodedInput = await decoder.decodeResultById(txId);
	var tokenId = parseInt(decodedInput.decodedOutput['0']['_hex']);
	return res.json({success:1,tokenId:tokenId});
});

router.post('/eventsData', (req,res) => {
	var conaddress = req.body.address;
	eventsBlock.find({contract_address: conaddress}).sort({created_at: -1}).limit(20).exec(function(err, data){
		if(data){
			res.json({success: 1, "eventBlockData": data});
		}else{
			res.json({success: 0, "msg" : "events not found"});
		}
	});
});



router.post('/eventsresponse', common.tokenMiddleware, (req,res) => {
	var conaddr = req.body.conaddr;
	var name = req.body.name;
	var input = req.body.input;
	var inttype = req.body.type;
	var userId = req.userId;

	eventsBlock.findOne({user_id: mongoose.mongo.ObjectId(userId), contract_address: conaddr, name : name}).sort({created_at: -1}).exec(function(err, data){
		if(data){
			eventsBlock.aggregate([
			  {
			  	"$match": {
			  		user_id: mongoose.mongo.ObjectId(userId),
  					contract_address: conaddr,
			  	},
			  },
			  {
			    "$group": {
				 _id: "$name",onlyOne: { $last : "$$ROOT" }
				}
			  },
			  {
			    "$replaceWith": {
				  evendataval: "$onlyOne"
				},
			  },
			  {
			  	"$project" : {
			  	  _id: "$evendataval._id",
				  input_params: "$evendataval.input_params",
				  input_types: "$evendataval.input_types",
				  user_id: "$evendataval.user_id",
				  contract_address: "$evendataval.contract_address",
				  name: "$evendataval.name",
				  output: "$evendataval.output",
				  type: "$evendataval.type",
				  created_at: "$evendataval.created_at",
			  	},
			  },
			]).then((evendata) => {
				res.json({success: 1, "eventsResponse": evendata});
			});
			// res.json({success: 1, "eventsResponse": data});
		}else{
			res.json({success: 0, "msg" : "found some error !"});
		}
	})

});

router.get('/getuseraddress', common.tokenMiddleware, (req, res) => {
	var userId = req.userId;
	userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err1, data1){
		res.json({success: 1, "address" : data1.address_base58});
	});
})


module.exports = router;
