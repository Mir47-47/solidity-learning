import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MyToken, TinyBank } from "../typechain-types";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            DECIMALS,
            MINTING_AMOUNT,
        ]);
        tinyBankC = await hre.ethers.deployContract("TinyBank", [
            await myTokenC.getAddress(),
        ]);
        await myTokenC.setManager(tinyBankC.getAddress());
    });
    describe("Initialized state check", () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0);
        });
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    });


    describe("Staking", async () => {
        it("should return staked amount", async() => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(await tinyBankC.totalStaked());
            expect(await myTokenC.balanceOf(tinyBankC)).equal(
                await tinyBankC.totalStaked()
            );
        });
    });

    describe("Withdraw", () => {
        it("should return 0 staked after withdrawing total token", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            await tinyBankC.withdraw(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    });

    describe("reward", () => {
        it("should return 1MT every blocks", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            
            const BLOCKS = 5n;
            const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
            for(var i=0; i<BLOCKS; i++) {
                await myTokenC.transfer(transferAmount, signer0.address);
            }

            await tinyBankC.withdraw(stakingAmount);
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
            );
        });

        it("Should revert when changing rewardPerBlock by hacker", async () => {
            const hacker = signers[3];
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
            await expect(
                tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
            ).to.be.revertedWith(
                "You are not a manager"
            );
        });

        it("should change rewards only after all three managers confirm", async () => {
            const [owner, manager1, manager2, manager3, hacker] = signers;
            const reward = hre.ethers.parseUnits("2", DECIMALS);

            // owner가 manager 3명 등록
            for (const manager of [manager1, manager2, manager3]) {
                await tinyBankC.addManager(manager.address);
            }

            // manager가 아닌 주소는 동의 및 보상 변경 불가
            await expect(tinyBankC.connect(hacker).confirm())
                .to.be.revertedWith("You are not a manager");
            await expect(tinyBankC.connect(hacker).setRewardPerBlock(reward))
                .to.be.revertedWith("You are not a manager");

            // 2명만 동의하면 보상 변경 불가
            await tinyBankC.connect(manager1).confirm();
            await tinyBankC.connect(manager2).confirm();
            await expect(tinyBankC.connect(manager1).setRewardPerBlock(reward))
                .to.be.revertedWith("Not all confirmed yet");

            // 3명 전원이 동의하면 보상 변경 성공
            await tinyBankC.connect(manager3).confirm();
            await expect(tinyBankC.connect(manager1).setRewardPerBlock(reward))
                .not.to.be.reverted;

            // 다음 변경에는 다시 동의 필요
            await expect(tinyBankC.connect(manager1).setRewardPerBlock(reward))
                .to.be.revertedWith("Not all confirmed yet");

            // 실제 지급량으로 변경된 블록당 보상 확인
            const amount = hre.ethers.parseUnits("10", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), amount);
            const stakeReceipt = await (await tinyBankC.stake(amount)).wait();
            const withdrawalReceipt = await (await tinyBankC.withdraw(amount)).wait();
            const blocks = BigInt(withdrawalReceipt!.blockNumber - stakeReceipt!.blockNumber);
            expect(await myTokenC.balanceOf(owner.address))
                .to.equal(MINTING_AMOUNT * 10n ** DECIMALS + blocks * reward);
        });
    });
});
