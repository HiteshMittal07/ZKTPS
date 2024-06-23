import { generateProof } from "../utils/createProof";
import { QrReader } from "react-qr-reader";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { isMobile } from "react-device-detect";
import { Tooltip } from "@mui/material";
import Button from "@mui/material/Button";
import {
  Invalidate,
  connectWalletL1,
  getL1Contract,
  getL1Provider,
  requestAccounts,
  toHex,
  L1_Contract_Address,
} from "../web3/web3";
import { useState } from "react";
import { on } from "process";
import { toast } from "react-toastify";

/**
 * @typedef {Object} QRReaderProps
 * @property {(d: string) => void} setData - Function to set the scanned data
 * @property {(msg: string) => void} handleError - Function to handle errors
 * @property {() => void} handleClose - Function to handle the close event
 */

// Usage example
/**
 * @param {QRReaderProps} props
 */

const QRReader = (props) => {
  const facingMode = isMobile ? "environment" : "user";
  return (
    <div style={{ width: "100%" }}>
      <QrReader
        ViewFinder={ViewFinder}
        constraints={{ facingMode }}
        onResult={async (result, error) => {
          await getData(result, error, props);
        }}
      />
    </div>
  );
};

/**
 * @typedef {Object} ScanNoteDialogProps
 * @property {boolean} open - Indicates if the dialog is open
 * @property {() => void} onClose - Function to handle the close event
 * @property {(d: string) => void} setData - Function to set the scanned data
 * @property {(msg: string) => void} handleError - Function to handle errors
 * @property {string} dialogTitle - The title of the dialog
 */

// Usage example
/**
 * @param {ScanNoteDialogProps} props
 */
function ScanNoteDialog(props) {
  const { onClose, open } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{props.dialogTitle}</DialogTitle>
      <QRReader
        handleClose={handleClose}
        setData={props.setData}
        handleError={props.handleError}
      ></QRReader>
    </Dialog>
  );
}

/**
 * @typedef {Object} ScanNoteButtonProps
 * @property {(d: string) => void} setData - Function to set the scanned data
 * @property {(msg: string) => void} handleError - Function to handle errors
 * @property {string} dialogTitle - The title of the dialog
 */

// Usage example
/**
 * @param {ScanNoteButtonProps} props
 */
export function ScanNoteButton1(props) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Tooltip arrow title="Scan a QR code">
        <Button
          variant="contained"
          sx={{ height: "100%", fontWeight: 800 }}
          onClick={handleClickOpen}
        >
          Scan
        </Button>
      </Tooltip>
      <ScanNoteDialog
        open={open}
        onClose={handleClose}
        setData={props.setData}
        handleError={props.handleError}
        dialogTitle={props.dialogTitle}
      />
    </div>
  );
}
export const ViewFinder = () => (
  <>
    <svg
      width="50px"
      viewBox="0 0 100 100"
      style={{
        top: 0,
        left: 0,
        zIndex: 1,
        boxSizing: "border-box",
        border: "50px solid rgba(0, 0, 0, 0.3)",
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      <path
        fill="none"
        d="M13,0 L0,0 L0,13"
        stroke="rgba(255, 0, 0, 0.5)"
        strokeWidth="5"
      />
      <path
        fill="none"
        d="M0,87 L0,100 L13,100"
        stroke="rgba(255, 0, 0, 0.5)"
        strokeWidth="5"
      />
      <path
        fill="none"
        d="M87,100 L100,100 L100,87"
        stroke="rgba(255, 0, 0, 0.5)"
        strokeWidth="5"
      />
      <path
        fill="none"
        d="M100,13 L100,0 87,0"
        stroke="rgba(255, 0, 0, 0.5)"
        strokeWidth="5"
      />
    </svg>
  </>
);
async function getData(result, error, props) {
  if (!!result) {
    alert("Qr Scanned Successful");
    props.handleClose();
    try {
      const values = result?.text.split(",");
      const nullifier = parseInt(values[0]);
      const secret = parseInt(values[1]);
      const nullifierHash = values[2];
      const commitmentHash = values[3];
      // how we get the values of the recipient from the one who is calling the function ,
      // so we what to know the address of recipient which is the one who is calling the function
      await invalidateTicket(nullifier, secret, nullifierHash, commitmentHash);
    } catch (error) {
      console.log(error);
    }
  }
}

const fetchDataContract = async (commitment) => {
  const url =
    "https://sepolia-api.voyager.online/beta/events?ps=10&p=1&contract=0x06f52ba412b2b8fd27bd552f734265bf0071808587aca3552bd80bb58e17741a";

  const apiKey = "qN25adhQX38RewEouZjWa6Bd1dj7AFuKUrxVBnX2";

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  while (true) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-api-key": apiKey,
        },
      });

      const data = await response.json();
      const firstEvent = data.items[0];
      console.log(firstEvent);
      const firstEventName = firstEvent.name;
      const firstEventData = firstEvent.dataDecoded;
      if (firstEventName === "inValidatedTicket") {
        if (firstEventData[3].value == commitment) {
          console.log("The event is found");
          handleInvalidatedTicketEvent(firstEventData, firstEventData[0].value);
          break;
        } else {
          console.log(
            "please wait .. The event with particular commitment is not found "
          );
        }
      } else {
        console.log("Please wait... as event with invalidate is not found ");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
    await delay(2000); // Wait for 1 second before making the next request
  }
};
function handleInvalidatedTicketEvent(event, buyer) {
  console.log("Custom code executed for inValidated Ticket event:", event);
  toast.success(`invalidate Successful from l2 from buyer ${buyer}`);
  // Add your custom code here
}

async function invalidateTicket(
  nullifier,
  secret,
  nullifierHash,
  commitmentHash
) {
  try {
    console.log(commitmentHash);
    await connectWalletL1();
    const contractAddress = L1_Contract_Address;
    const provider = getL1Provider();
    const recipient = await requestAccounts(provider);
    console.log(recipient);
    const contract = getL1Contract(provider, contractAddress);
    const selector =
      "0x02ee206af5b468bd3a0f382f37441601d9b049ebb71196c282d2bab1af7b7062";
    const Proof = await generateProof(
      nullifier,
      secret,
      nullifierHash,
      commitmentHash,
      recipient
    );
    console.log(Proof);
    try {
      const transaction = await Invalidate(
        contract,
        Proof,
        toHex(nullifierHash),
        toHex(commitmentHash),
        recipient,
        selector
      );
      await transaction.wait();
      toast.success("invalidate Successful from l1");
      try {
        fetchDataContract(toHex(commitmentHash));
      } catch (error) {
        console.log(`error in the fectching api ${error}`);
      }
    } catch (error) {
      alert(error);
    }
  } catch (error) {
    console.log(error);
  }
}

export default function InvalidateTicket() {
  return (
    <div
      className="container mx-auto mt-64 flex flex-col items-center justify-center"
      style={{ marginTop: "90px" }}
    >
      <h2 className="font-bold text-white" style={{ fontSize: "55px" }}>
        Scan Here
      </h2>
      <p className="text-white" style={{ fontSize: "40px" }}>
        <span className="font-bold">Disclaimer! </span>
        Here you can invalidate the ticket for prevention of further use case or
        black marketing of these tickets.
      </p>
      <div className="flex flex-col items-center mt-4">
        <h3 className="text-white">Invalidate Ticket</h3>
        <div className="flex justify-center mt-4">
          <ScanNoteButton1 dialogTitle="Scan for invalidate ticket" />
        </div>
      </div>
    </div>
  );
}
