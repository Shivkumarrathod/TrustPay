// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract YourContract is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =============================================================
    //                      ORIGINAL CONTRACT
    // =============================================================

    address public immutable owner;

    string public greeting = "Building Unstoppable Apps!!!";
    bool public premium = false;
    uint256 public totalCounter = 0;

    mapping(address => uint256) public userGreetingCounter;

    event GreetingChange(
        address indexed greetingSetter,
        string newGreeting,
        bool premium,
        uint256 value
    );

    constructor(address _owner) {
        owner = _owner;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    function setGreeting(
        string memory _newGreeting
    ) public payable {
        console.log(
            "Setting new greeting '%s' from %s",
            _newGreeting,
            msg.sender
        );

        greeting = _newGreeting;
        totalCounter += 1;
        userGreetingCounter[msg.sender] += 1;

        if (msg.value > 0) {
            premium = true;
        } else {
            premium = false;
        }

        emit GreetingChange(
            msg.sender,
            _newGreeting,
            msg.value > 0,
            msg.value
        );
    }

    function withdraw() public isOwner {
        (bool success, ) = owner.call{
            value: address(this).balance
        }("");

        require(success, "Failed to send Ether");
    }

    // =============================================================
    //                           ENUMS
    // =============================================================

    enum EscrowStatus {
        Created,
        Funded,
        InProgress,
        Disputed,
        Completed,
        Cancelled,
        Refunded
    }

    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved,
        Rejected,
        Paid,
        Disputed,
        Refunded
    }

    // =============================================================
    //                          STRUCTS
    // =============================================================

    struct Milestone {
        uint256 amount;
        bytes32 proofHash;

        MilestoneStatus status;

        uint256 submittedAt;
        uint256 resolvedAt;
    }

    struct Escrow {
        uint256 id;

        address buyer;
        address seller;

        // address(0) = native MON
        // otherwise ERC20 token address
        address token;

        uint256 totalAmount;
        uint256 depositedAmount;
        uint256 releasedAmount;
        uint256 refundedAmount;

        uint256 deadline;

        address arbiter;

        EscrowStatus status;

        uint256 milestoneCount;
    }

    // =============================================================
    //                         STORAGE
    // =============================================================

    uint256 private _escrowCounter;

    mapping(uint256 => Escrow) private _escrows;

    mapping(uint256 => Milestone[]) private _milestones;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 totalAmount,
        uint256 deadline,
        address arbiter
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        uint256 amount
    );

    event MilestoneCreated(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        uint256 amount
    );

    event MilestoneSubmitted(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        bytes32 proofHash
    );

    event MilestoneApproved(
        uint256 indexed escrowId,
        uint256 indexed milestoneId
    );

    event MilestoneRejected(
        uint256 indexed escrowId,
        uint256 indexed milestoneId
    );

    event MilestonePaid(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        address indexed seller,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        address indexed raisedBy
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        uint256 sellerAmount,
        uint256 buyerAmount
    );

    event MilestoneRefunded(
        uint256 indexed escrowId,
        uint256 indexed milestoneId,
        address indexed buyer,
        uint256 amount
    );

    event EscrowCompleted(
        uint256 indexed escrowId
    );

    event EscrowCancelled(
        uint256 indexed escrowId
    );

    // =============================================================
    //                           ERRORS
    // =============================================================

    error InvalidAddress();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidMilestones();
    error InvalidEscrow();
    error NotBuyer();
    error NotSeller();
    error NotParticipant();
    error NotArbiter();
    error InvalidStatus();
    error IncorrectPayment();
    error AlreadyFunded();
    error NotFunded();
    error MilestoneDoesNotExist();
    error InvalidMilestoneStatus();
    error NothingToRelease();
    error DeadlineNotReached();
    error DeadlineReached();
    error DisputeActive();
    error NoDispute();
    error TransferFailed();

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier escrowExists(uint256 escrowId) {
        if (escrowId >= _escrowCounter) {
            revert InvalidEscrow();
        }

        _;
    }

    modifier onlyBuyer(uint256 escrowId) {
        if (_escrows[escrowId].buyer != msg.sender) {
            revert NotBuyer();
        }

        _;
    }

    modifier onlySeller(uint256 escrowId) {
        if (_escrows[escrowId].seller != msg.sender) {
            revert NotSeller();
        }

        _;
    }

    modifier onlyParticipant(uint256 escrowId) {
        Escrow memory escrow = _escrows[escrowId];

        if (
            msg.sender != escrow.buyer &&
            msg.sender != escrow.seller
        ) {
            revert NotParticipant();
        }

        _;
    }

    modifier onlyArbiter(uint256 escrowId) {
        if (_escrows[escrowId].arbiter != msg.sender) {
            revert NotArbiter();
        }

        _;
    }

    // =============================================================
    //                     CREATE ESCROW
    // =============================================================

    function createEscrow(
        address seller,
        address token,
        uint256 totalAmount,
        uint256 deadline,
        address arbiter,
        uint256[] calldata milestoneAmounts
    )
        external
        returns (uint256 escrowId)
    {
        if (seller == address(0)) {
            revert InvalidAddress();
        }

        if (seller == msg.sender) {
            revert InvalidAddress();
        }

        if (arbiter == address(0)) {
            revert InvalidAddress();
        }

        if (totalAmount == 0) {
            revert InvalidAmount();
        }

        if (deadline <= block.timestamp) {
            revert InvalidDeadline();
        }

        if (milestoneAmounts.length == 0) {
            revert InvalidMilestones();
        }

        uint256 milestoneTotal = 0;

        for (
            uint256 i = 0;
            i < milestoneAmounts.length;
            i++
        ) {
            if (milestoneAmounts[i] == 0) {
                revert InvalidAmount();
            }

            milestoneTotal += milestoneAmounts[i];
        }

        if (milestoneTotal != totalAmount) {
            revert InvalidMilestones();
        }

        escrowId = _escrowCounter++;

        Escrow storage escrow = _escrows[escrowId];

        escrow.id = escrowId;
        escrow.buyer = msg.sender;
        escrow.seller = seller;
        escrow.token = token;
        escrow.totalAmount = totalAmount;
        escrow.deadline = deadline;
        escrow.arbiter = arbiter;
        escrow.status = EscrowStatus.Created;
        escrow.milestoneCount = milestoneAmounts.length;

        for (
            uint256 i = 0;
            i < milestoneAmounts.length;
            i++
        ) {
            _milestones[escrowId].push(
                Milestone({
                    amount: milestoneAmounts[i],
                    proofHash: bytes32(0),
                    status: MilestoneStatus.Pending,
                    submittedAt: 0,
                    resolvedAt: 0
                })
            );

            emit MilestoneCreated(
                escrowId,
                i,
                milestoneAmounts[i]
            );
        }

        emit EscrowCreated(
            escrowId,
            msg.sender,
            seller,
            token,
            totalAmount,
            deadline,
            arbiter
        );
    }

    // =============================================================
    //                         FUND ESCROW
    // =============================================================

    function fundNativeEscrow(
        uint256 escrowId
    )
        external
        payable
        nonReentrant
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (escrow.status != EscrowStatus.Created) {
            revert InvalidStatus();
        }

        if (escrow.token != address(0)) {
            revert IncorrectPayment();
        }

        if (msg.value != escrow.totalAmount) {
            revert IncorrectPayment();
        }

        escrow.depositedAmount = msg.value;
        escrow.status = EscrowStatus.Funded;

        emit EscrowFunded(
            escrowId,
            msg.value
        );
    }

    function fundTokenEscrow(
        uint256 escrowId
    )
        external
        nonReentrant
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (escrow.status != EscrowStatus.Created) {
            revert InvalidStatus();
        }

        if (escrow.token == address(0)) {
            revert IncorrectPayment();
        }

        IERC20(escrow.token).safeTransferFrom(
            msg.sender,
            address(this),
            escrow.totalAmount
        );

        escrow.depositedAmount = escrow.totalAmount;
        escrow.status = EscrowStatus.Funded;

        emit EscrowFunded(
            escrowId,
            escrow.totalAmount
        );
    }

    // =============================================================
    //                    SUBMIT MILESTONE
    // =============================================================

    function submitMilestone(
        uint256 escrowId,
        uint256 milestoneId,
        bytes32 proofHash
    )
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.InProgress
        ) {
            revert InvalidStatus();
        }

        if (block.timestamp > escrow.deadline) {
            revert DeadlineReached();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Pending
        ) {
            revert InvalidMilestoneStatus();
        }

        if (proofHash == bytes32(0)) {
            revert InvalidAmount();
        }

        milestone.proofHash = proofHash;
        milestone.submittedAt = block.timestamp;
        milestone.status = MilestoneStatus.Submitted;

        escrow.status = EscrowStatus.InProgress;

        emit MilestoneSubmitted(
            escrowId,
            milestoneId,
            proofHash
        );
    }

    // =============================================================
    //                     APPROVE MILESTONE
    // =============================================================

    function approveMilestone(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.InProgress
        ) {
            revert InvalidStatus();
        }

        if (block.timestamp > escrow.deadline) {
            revert DeadlineReached();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Submitted
        ) {
            revert InvalidMilestoneStatus();
        }

        milestone.status = MilestoneStatus.Approved;

        emit MilestoneApproved(
            escrowId,
            milestoneId
        );
    }

    // =============================================================
    //                     REJECT MILESTONE
    // =============================================================

    function rejectMilestone(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.InProgress
        ) {
            revert InvalidStatus();
        }

        if (block.timestamp > escrow.deadline) {
            revert DeadlineReached();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Submitted
        ) {
            revert InvalidMilestoneStatus();
        }

        milestone.status = MilestoneStatus.Rejected;

        emit MilestoneRejected(
            escrowId,
            milestoneId
        );
    }

    // =============================================================
    //                   RESUBMIT REJECTED
    // =============================================================

    function resubmitMilestone(
        uint256 escrowId,
        uint256 milestoneId,
        bytes32 proofHash
    )
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.InProgress
        ) {
            revert InvalidStatus();
        }

        if (block.timestamp > escrow.deadline) {
            revert DeadlineReached();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Rejected
        ) {
            revert InvalidMilestoneStatus();
        }

        if (proofHash == bytes32(0)) {
            revert InvalidAmount();
        }

        milestone.proofHash = proofHash;
        milestone.submittedAt = block.timestamp;
        milestone.status = MilestoneStatus.Submitted;

        emit MilestoneSubmitted(
            escrowId,
            milestoneId,
            proofHash
        );
    }

    // =============================================================
    //                    RELEASE MILESTONE
    // =============================================================

    function releaseMilestone(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        nonReentrant
        escrowExists(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Approved
        ) {
            revert InvalidMilestoneStatus();
        }

        uint256 amount = milestone.amount;

        milestone.status = MilestoneStatus.Paid;
        milestone.resolvedAt = block.timestamp;

        escrow.releasedAmount += amount;

        _transferFunds(
            escrow.token,
            escrow.seller,
            amount
        );

        emit MilestonePaid(
            escrowId,
            milestoneId,
            escrow.seller,
            amount
        );

        _checkCompletion(escrowId);
    }

    // =============================================================
    //                       DISPUTES
    // =============================================================

    function raiseDispute(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        escrowExists(escrowId)
        onlyParticipant(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status ==
            EscrowStatus.Completed ||
            escrow.status ==
            EscrowStatus.Cancelled ||
            escrow.status ==
            EscrowStatus.Refunded
        ) {
            revert InvalidStatus();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Submitted &&
            milestone.status !=
            MilestoneStatus.Approved
        ) {
            revert InvalidMilestoneStatus();
        }

        milestone.status = MilestoneStatus.Disputed;

        escrow.status = EscrowStatus.Disputed;

        emit DisputeRaised(
            escrowId,
            milestoneId,
            msg.sender
        );
    }

    function resolveDispute(
        uint256 escrowId,
        uint256 milestoneId,
        uint256 sellerAmount,
        uint256 buyerAmount
    )
        external
        nonReentrant
        escrowExists(escrowId)
        onlyArbiter(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status !=
            EscrowStatus.Disputed
        ) {
            revert NoDispute();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status !=
            MilestoneStatus.Disputed
        ) {
            revert NoDispute();
        }

        if (
            sellerAmount + buyerAmount !=
            milestone.amount
        ) {
            revert IncorrectPayment();
        }

        milestone.resolvedAt = block.timestamp;

        if (sellerAmount > 0) {
            _transferFunds(
                escrow.token,
                escrow.seller,
                sellerAmount
            );

            escrow.releasedAmount += sellerAmount;
        }

        if (buyerAmount > 0) {
            _transferFunds(
                escrow.token,
                escrow.buyer,
                buyerAmount
            );

            escrow.refundedAmount += buyerAmount;
        }

        milestone.status = MilestoneStatus.Paid;

        emit DisputeResolved(
            escrowId,
            milestoneId,
            sellerAmount,
            buyerAmount
        );

        if (_allMilestonesResolved(escrowId)) {
            escrow.status = EscrowStatus.Completed;

            emit EscrowCompleted(escrowId);
        } else {
            escrow.status = EscrowStatus.InProgress;
        }
    }

    // =============================================================
    //                     DEADLINE REFUND
    // =============================================================

    function refundMilestoneAfterDeadline(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        nonReentrant
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            block.timestamp <=
            escrow.deadline
        ) {
            revert DeadlineNotReached();
        }

        if (
            escrow.status ==
            EscrowStatus.Disputed
        ) {
            revert DisputeActive();
        }

        Milestone storage milestone =
            _getMilestone(
                escrowId,
                milestoneId
            );

        if (
            milestone.status ==
            MilestoneStatus.Paid ||
            milestone.status ==
            MilestoneStatus.Refunded
        ) {
            revert InvalidMilestoneStatus();
        }

        uint256 amount = milestone.amount;

        milestone.status = MilestoneStatus.Refunded;
        milestone.resolvedAt = block.timestamp;

        escrow.refundedAmount += amount;

        _transferFunds(
            escrow.token,
            escrow.buyer,
            amount
        );

        emit MilestoneRefunded(
            escrowId,
            milestoneId,
            escrow.buyer,
            amount
        );

        if (_allMilestonesResolved(escrowId)) {
            escrow.status = EscrowStatus.Refunded;
        }
    }

    // =============================================================
    //                    CANCEL BEFORE FUNDING
    // =============================================================

    function cancelEscrow(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = _escrows[escrowId];

        if (
            escrow.status !=
            EscrowStatus.Created
        ) {
            revert InvalidStatus();
        }

        escrow.status = EscrowStatus.Cancelled;

        emit EscrowCancelled(
            escrowId
        );
    }

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================

    function getEscrow(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (Escrow memory)
    {
        return _escrows[escrowId];
    }

    function getMilestone(
        uint256 escrowId,
        uint256 milestoneId
    )
        external
        view
        escrowExists(escrowId)
        returns (Milestone memory)
    {
        return _getMilestone(
            escrowId,
            milestoneId
        );
    }

    function getAllMilestones(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (Milestone[] memory)
    {
        return _milestones[escrowId];
    }

    function getEscrowCount()
        external
        view
        returns (uint256)
    {
        return _escrowCounter;
    }

    function getRemainingBalance(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (uint256)
    {
        Escrow memory escrow =
            _escrows[escrowId];

        return
            escrow.depositedAmount -
            escrow.releasedAmount -
            escrow.refundedAmount;
    }

    // =============================================================
    //                    INTERNAL FUNCTIONS
    // =============================================================

    function _getMilestone(
        uint256 escrowId,
        uint256 milestoneId
    )
        internal
        view
        returns (Milestone storage)
    {
        if (
            milestoneId >=
            _milestones[escrowId].length
        ) {
            revert MilestoneDoesNotExist();
        }

        return _milestones[escrowId][milestoneId];
    }

    function _transferFunds(
        address token,
        address recipient,
        uint256 amount
    )
        internal
    {
        if (amount == 0) {
            return;
        }

        if (token == address(0)) {
            (bool success, ) = payable(recipient).call{
                value: amount
            }("");

            if (!success) {
                revert TransferFailed();
            }
        } else {
            IERC20(token).safeTransfer(
                recipient,
                amount
            );
        }
    }

    function _allMilestonesResolved(
        uint256 escrowId
    )
        internal
        view
        returns (bool)
    {
        Milestone[] storage milestones =
            _milestones[escrowId];

        for (
            uint256 i = 0;
            i < milestones.length;
            i++
        ) {
            MilestoneStatus status =
                milestones[i].status;

            if (
                status !=
                MilestoneStatus.Paid &&
                status !=
                MilestoneStatus.Refunded
            ) {
                return false;
            }
        }

        return true;
    }

    function _checkCompletion(
        uint256 escrowId
    )
        internal
    {
        Escrow storage escrow =
            _escrows[escrowId];

        if (
            _allMilestonesResolved(
                escrowId
            )
        ) {
            escrow.status =
                EscrowStatus.Completed;

            emit EscrowCompleted(
                escrowId
            );
        }
    }

    // =============================================================
    //                     RECEIVE / FALLBACK
    // =============================================================

    /**
     * Native MON can only enter through
     * fundNativeEscrow().
     *
     * This prevents accidental deposits.
     */
    receive() external payable {
        revert IncorrectPayment();
    }

    fallback() external payable {
        revert IncorrectPayment();
    }
}