import { useState } from "react";
import "./App.css";
import { connect } from "starknetkit";
import CreateEvent from "./components/createEvent";
import { RpcProvider } from "starknet";
import ScanNoteButton1 from "./components/invalidateTicket";
function App() {
  const [account, setAccount] = useState(null);
  async function connectWalletL2() {
    const { wallet } = await connect({
      provider: new RpcProvider({
        nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
      }),
      dappName: "ZKTPS",
    });
    if (wallet && wallet.isConnected) {
      setAccount(wallet.account);
      localStorage.setItem("account", wallet.account);
    }
  }
  return (
    <div>
      <button onClick={connectWalletL2}>connect</button>
      {/* <BuyTicket account={account} />
      <CreateEvent account={account} /> */}
      <ScanNoteButton1/>
      
    </div>
  );
}

export default App;
