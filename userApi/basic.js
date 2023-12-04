// app.js
const axios = require('axios');
const express = require('express');
const mongoose = require('../config/production'); // Adjust the path accordingly
const userAddr = require('../model/userAddress');
const variiable = require('../config/variables');



const generatenewaddress = async (req, response, next) => {

  const url = variiable.blockchain_url + '/generateaddr';
  const headers = { 'Content-Type': 'application/json' };

  let flattenedResponse = {};

  try {
    const blockchainResponse = await axios.get(url, { headers });

    flattenedResponse = {
      status: blockchainResponse.data.status,
      privateKey: blockchainResponse.data.createAccount.privateKey,
      publicKey: blockchainResponse.data.createAccount.publicKey,
      address_base58: blockchainResponse.data.createAccount.address.base58,
      address_hex: blockchainResponse.data.createAccount.address.hex,
    };

    const newAddress = new userAddr({
      user_id: mongoose.Types.ObjectId('your_user_id'),
      ...flattenedResponse,
      created_at: Date.now(),
    });

    await newAddress.save();
  } catch (error) {
    console.error('Error:', error.message);
    return response.json({ success: 0, error: error.message }); // Send an error response
  } finally {
    mongoose.connection.close();
    return response.json({ success: 1, result: flattenedResponse });
  }
};



module.exports = {
  generatenewaddress,}