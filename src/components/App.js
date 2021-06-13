import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbank from '../dbank2.png';
import Web3 from 'web3';
import './App.css';

class App extends Component {

  async componentWillMount() {    
    await this.loadWeb3()
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }


  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum !== 'undefined'){
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId() 
      const accounts = await web3.eth.getAccounts()
      const balance = await web3.eth.getBalance(accounts[0]) 
      if(typeof accounts[0] !=='undefined'){
        this.setState({ account: accounts[0],web3: web3,balance: web3.utils.fromWei(balance)})
      }else{
        window.alert('Please connect MetaMask.')
      }
      try{
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        const bankInfo = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address)
        const dBankAddress = bankInfo._address
        const interestEarned = await token.methods.balanceOf(this.state.account).call()
        const totalDeposits = await bankInfo.methods.etherBalanceOf(this.state.account).call()
        const totalMintedCoin = await token.methods.totalSupply().call()
        const ethBalance = await new web3.eth.getBalance(this.state.account)
        this.setState({
          token: token, 
          dbank: bankInfo, 
          dBankAddress: dBankAddress, 
          interestEarned: web3.utils.fromWei(interestEarned),
          totalDeposits: web3.utils.fromWei(totalDeposits),
          totalMintedCoin: web3.utils.fromWei(totalMintedCoin),
          ethBalance: web3.utils.fromWei(ethBalance)
        })
      }catch(e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }
    }else{
      window.alert("Please Install MetaMask")
    }

  }

  async deposit(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.deposit().send({value: amount.toString(), from: this.state.account})
        window.location.reload(false);
      } catch (e) {
        console.log('Error, deposit: ', e)
      }
    }
  }

  async withdraw(e) {
    e.preventDefault()
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.withdraw().send({from: this.state.account})
        window.location.reload(false);
      } catch(e) {
        console.log('Error, withdraw: ', e)
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null,
      interestEarned: 0,
      totalDeposits: 0,  
      totalMintedBankCoin: 0
    }
  }

 render() {
    return (
      <div className='text-monospace'>
        <div className="container-fluid p-1 text-center">
          <div className="row d-flex justify-content-between border-bottom">
            <span><img src={dbank} height="100"/></span> 
            <span className="mt-4">
              <h5>Welcome to <strong>मेरो</strong> Crypto Finance</h5>
              <p>Total Supply(minted): <strong> {this.state.totalMintedCoin} MCF </strong></p>
            </span> 
            <span className="mt-4 mr-2">
              <button type="button" class="btn btn-sm btn-outline-dark mr-2">{this.state.ethBalance} ETH</button>
              <button type="button" class="btn btn-sm btn-dark mr-2">{this.state.account.replace(/(.{7})..+/, "$1…")}</button>
            </span>            
          </div>
          <div className="row p-1">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="deposit" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                    <br></br>
                    Total ETH Deposited: <strong> {this.state.totalDeposits} ETH</strong>
                    <br></br>
                    How much do you want to deposit?
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    (1 deposit is possible at the time)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.depositAmount.value
                      amount = amount * 10**18 //convert to wei
                      this.deposit(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.depositAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>

                  </div>
                </Tab>
                <Tab eventKey="withdraw" title="Withdraw">
                  <br></br>
                    Do you want to withdraw + take interest?
                    <br></br>
                    Total Claimed Reward: <strong> {this.state.interestEarned} MCF</strong>
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.withdraw(e)}>WITHDRAW</button>
                  </div>
                </Tab>
                <Tab eventKey="borrow" title="Borrow">
                  <div>

                  <br></br>
                    Do you want to borrow tokens?
                    <br></br>
                    (You'll get 50% of collateral, in Tokens)
                    <br></br>
                    Type collateral amount (in ETH)
                    <br></br>
                    <br></br>
                    <form onSubmit={(e) => {

                      e.preventDefault()
                      let amount = this.borrowAmount.value
                      amount = amount * 10 **18 //convert to wei
                      this.borrow(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.borrowAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="payOff" title="Payoff">
                  <div>

                  <br></br>
                    Do you want to payoff the loan?
                    <br></br>
                    (You'll receive your collateral - fee)
                    <br></br>
                    <br></br>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                  </div>
                </Tab>
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;