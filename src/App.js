import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'
import BN from 'bn.js'

import getConfig from './config'
const { networkId } = getConfig('production')

import * as nearAPI from "near-api-js";
const { utils, connect, providers } = nearAPI;

import Lottie from 'react-lottie';
import animationData from './lotties/coins';

export default function App() {

  function clicked1N () {
    setAmount(1)
  }
  function clicked2N () {
    setAmount(2)
  }

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(false)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const [amount, setAmount] = React.useState(1)
  
  const [balance, setBalance] = React.useState(0)
  const [contractBalance, setContractBalance] = React.useState(0)

  const [totalVolume, setTotalVolume] = React.useState(0)


  const [status, setStatus] = React.useState('')

  const [leaderboard, setLeaderboard] = React.useState([])

  const [isStopped, setIsStopped] = React.useState(true)

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to DEGEN Lizards' CASINO!</h1>
        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  React.useEffect(async () => {
    fetch('https://leaderboard-degen.vercel.app/api/indexer').then(function(response) {
      return response.json();
    }).then(async function(data) {
      console.log(data)

      let totalVolumepl = 0;

      console.log(data.slice(0, 10))
      setLeaderboard(data.slice(0, 10))

      data.forEach(val => {
        totalVolumepl += parseInt(val[1])
      })



      setTotalVolume(totalVolumepl)

      setBalance( (await window.walletConnection._connectedAccount.getAccountBalance()).available / 1000000000000000000000000 );

      const near = await connect(window.walletConnection._near.config);
      const account = await near.account(window.walletConnection._near.config.contractName);
      
      console.log(account)
      setContractBalance( (await account.getAccountBalance()).available / 1000000000000000000000000 );
    }).catch(function() {
      console.log("Booo");
    });

    const provider = new providers.JsonRpcProvider(
      "https://archival-rpc.mainnet.near.org"
    );
  
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = urlSearchParams.get('transactionHashes');
  
    console.log(params);
    
    const result = await provider.txStatus(params, window.walletConnection._near.config.contractName);

    setStatus(result.receipts_outcome[0].outcome.logs[3])

    setTimeout(() => {
      setStatus('')
    }, 11000)
  }, []);

  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
    
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1>Welcome to DEGEN Lizards' CASINO!</h1>
        <div className='text'>
          <p>{window.accountId}</p>
          <p id='balance'>Balance : {balance.toFixed(2)}</p>
          <p id='contract-balance'>Contract Balance : {contractBalance.toFixed(2)}</p>

          <p id="status">{status}</p>

        </div>
        
        <form onSubmit={async event => {
          event.preventDefault()

          setButtonDisabled(true)

          setIsStopped(false)


          try {
            // make an update call to the smart contract
            await window.contract.play(
              {},
              100000000000000,
              (new BN('1035000000000000000000000', 10)).mul(new BN((amount).toString(), 10))
            )
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            setButtonDisabled(false)
          }

          // show Notification
          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          <fieldset id="fieldset">
            
            <div style={{ display: 'flex' }}>

              <button
                disabled={buttonDisabled}
                onClick={clicked1N}
                className='1n'
                style={{ borderRadius: '0 5px 5px 0' }}
              >
                1N
              </button>

              <button
                disabled={buttonDisabled}
                onClick={clicked2N}
                className='2n'
                style={{ borderRadius: '0 5px 5px 0' }}
              >
                2N
              </button>

            </div>
          </fieldset>
        </form>

        <Lottie style={{display: isStopped ? 'none' : 'block'}}
	    options={defaultOptions}
        height={400}
        width={400}
        isStopped={isStopped}
      />

        <br/><br/>
{/*
        <h3 className='text'>TOTAL VOLUME : {totalVolume}</h3>
        <br/>
        <h3 className='text'>LEADERBOARD (BY VOLUME)</h3>
        <table className='leaderboard'>
          <tbody>
            <br/>
            {
              leaderboard.map(val => 
                (
                  <tr>
                    <th>{val[0]}</th>
                    <th> </th>
                    <th>{val[1]}</th>
                  </tr>
                )
              )
            }

          </tbody>
        </table>
*/}
        <br/><br/>
        
      </main>
      {showNotification && <Notification />}
    </>
  )
}
