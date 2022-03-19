import React, { useEffect, useState } from "react";
import "./App.css";
import pic from "./utils/green.png";

/*ethers変数を使えるようにする*/
import { ethers } from "ethers";
/* ABIファイルを含むWavePrtal.jsonファイルをインポートする*/
import abi from "./utils/WavePortal.json";
const App = () => {
    /*ユーザーのパブリックウォレットを保存するために使用する状態変数を定義します*/
    const [currentAccount, setCurrentAccount] = useState("");
    /*メッセージの保存*/
    const [messageValue, setMessageValue] = useState("")
    /*試しに追加*/
    const [inProgress, setInProgress] = useState(false);
    const [isWon, setIsWon] = useState();
    /*全てのウェイブを保存*/
    const [allWaves, setAllWaves] = useState([]);
    console.log("currentAccount:", currentAccount);
    /**
     * デプロイされたコントラクトアドレスを保持する変数を作成
     */
    const contractAddress = "0xAe2F1752070363B5B3117437A6A550e8671252Bd";
    /**
     * ABIの内容を参照する変数を作成
     */
    const contractABI = abi.abi;

    const getAllWaves = async () => {
        const { ethereum } = window;

        try {
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
                /* コントラクトからgetAllWavesメソッドを呼び出す */
                const waves = await wavePortalContract.getAllWaves();
                /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
                const wavesCleaned = waves.map(wave => {
                    return {
                        address: wave.waver,
                        timestamp: new Date(wave.timestamp * 1000),
                        message: wave.message,
                        win: wave.win,
                    };
                });

                /* React Stateにデータを格納する */
                setAllWaves(wavesCleaned);
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };

    /**
     * `emit`されたイベントをフロントエンドに反映させる
     */
    useEffect(() => {
        let wavePortalContract;

        const onNewWave = (from, timestamp, message, win) => {
            console.log("NewWave", from, timestamp, message, win);
            setAllWaves(prevState => [
                ...prevState,
                {
                    address: from,
                    timestamp: new Date(timestamp * 1000),
                    message: message,
                    win,
                },
            ]);
        };

        /* NewWaveイベントがコントラクトから発信されたときに、情報をを受け取ります */
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
            wavePortalContract.on("NewWave", onNewWave);
        }
        /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
        return () => {
            if (wavePortalContract) {
                wavePortalContract.off("NewWave", onNewWave);
            }
        };
    }, []);

    /*
     * window.ethereumにアクセスできることを確認します。
     */
    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                console.log("Make sure you have metamask!");
                return;
            } else {
                console.log("We have the ethereum object", ethereum);
            }
            /*ユーザーのウォレットへのアクセスが許可されているかどうか確認します*/
            const accounts = await ethereum.request({
                method: "eth_accounts"});
            if(accounts.length !== 0){
                    const account = accounts[0];
                console.log("Found an authorized account:", account);
                setCurrentAccount(account)
        } else {
            console.log("No authorized account found");
        }
    }catch (error) {
        console.log(error);
    }
    }
    //connectWalletメソッドを実装
    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            console.log("Connected:", accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error)
        }
    }
    //waveの回数をカウントする関数を実装
    const wave = async () => {
        try {
            const { ethereum } = window;
            console.log("wallet exists")
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                /*
                 * ABIをここで参照
                 */
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
                let count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());

                let contractBalance = await provider.getBalance(
                    wavePortalContract.address
                );
                console.log(
                    "Contract balance:",
                    ethers.utils.formatEther(contractBalance)
                );
                /*
                 * コントラクトにwaveを書き込む。ここから
                 */
                const waveTxn = await wavePortalContract.wave(messageValue, {gasLimit:300000});
                console.log("Mining...", waveTxn.hash);
                await waveTxn.wait();
                console.log("Mined --", waveTxn.hash);
                count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());
                console.log("Signer:", signer);
                /*__ここまで__*/
                let contractBalance_post = await provider.getBalance(wavePortalContract.address);
                /* コントラクトの残高が減っていることを確認 */
                if (contractBalance_post < contractBalance){
    /* 減っていたら下記を出力 */
   console.log("User won ETH!");
                } else {
                    console.log("User didn't win ETH.");
                }
                console.log(
                     "Contract balance after wave:",
                    ethers.utils.formatEther(contractBalance_post)
                );
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error)
        }
    }
    /*
    * WEBページがロードされたときに下記の関数を実行します。
    */
    useEffect(() => {
        checkIfWalletIsConnected();
    }, [])
   
    return (
        <div className="mainContainer">
            <div className="dataContainer">
                <div className="header">
                    <span role="img" aria-label="hand-wave">👋</span> Hello World!
                </div>
                
                <div className="bio">
                    After connecting your Wallet, <span role="img" aria-label="hand-wave">👋</span> Wave at your neighbor!<span role="img" aria-label="shine">✨</span>
                </div>
                <br />
                {/*メッセージボックス*/}
                {currentAccount && (<textarea name="messageArea"
                    placeholder="message please"
                    type="text"
                    id="message"
                    value={messageValue}
                    onChange={e => setMessageValue(e.target.value)} />)
                }
               
                {/* waveボタンにwave関数を連動させる*/}
                {currentAccount && (
                    <button className="waveButton" onClick={wave}>
                        Wave at Your Neighbor
                    </button>)
                }
                {/*ウォレットコネクトボタンを実装*/}
                {!currentAccount && (
                    <button className="waveButton" onClick={connectWallet}>
                        Connect Wallet
                    </button>
                )}
                {currentAccount && (
                    <button className="waveButton">
                        Wallet Connected
                    </button>
                )}
               
                {/*履歴を表示*/}
                {currentAccount && (
                    allWaves.slice(0).reverse().map((wave, index) => {
                        return (
                            <div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px" }}>
                                <div>Address: {wave.address}</div>
                                <div>Time: {wave.timestamp.toString()}</div>
                                <div>Message: {wave.message}</div>
                            </div>)
                    })
                    )}
                <div className="imageBox">
                    <img src={pic} alt="Peace" />
                </div>
            </div>
        </div>
    );
    
}
export default App