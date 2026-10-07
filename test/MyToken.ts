import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSinger } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimal = 18n;

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSinger[];
    //다같이 myTokenC를 쓰기위해서 밖에서 정의해준다.
    beforeEach("should deploy", async () => {//이 그룹 실행전에 실행되는 함수
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            decimal,
            mintingAmount,
        ]);
    });
    describe("Baic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).equal("MyToken");
        }); 
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).equal("MT");
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).equal(decimal);
        });
        it("should return 100 totalSupply", async () => {
            expect(await myTokenC.totalSupply()).equal(mintingAmount * 10n ** decimal);
        });
    });
    describe("Mint", () => {
        it("should return 1MT balance for singer 0", async () => {
            const singer0 = signers[0];
            expect(await myTokenC.totalSupply()).equal(mintingAmount*10n**decimal);
        });
    })
    describe("transfer", () => {
        //1MT = 1*10^18
        it("should have 0.5MT", async () => {
            const signer0 = signers[0];
            const singer1 = signers[1];
            await expect ( 
                myTokenC.transfer(
                    hre.ethers.parseUnits("0.5", 18), 
                    singer1.address
                )).to.emit(
                    myTokenC, 
                    "Transfer"
                ).withArgs(
                    signer0.address, 
                singer1.address, 
                hre.ethers.parseUnits("0.5", decimal)
            );
            expect(await myTokenC.balanceOf(singer1)).equal(
                hre.ethers.parseUnits("0.5", decimal)
            );
        });
        it("should be reverted with insufficient balance error", async () => {
        const singer1 = signers[1];
        await expect(
            myTokenC.transfer(
                hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimal), 
                singer1.address
            )
        ).to.be.revertedWith("insufficient balance");
        });
    });
    describe("TransferFrom", () => {
        it("should emit Approval event", async () => {
            const signer1 = signers[1];
            await expect(
                myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", decimal))
            ).to.emit(
                myTokenC,
                "Approval"
            ).withArgs(
                signer1.address,
                hre.ethers.parseUnits("10", decimal)
            );
        });
        it("should be reverted with insufficient allowance error", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            await expect (
                myTokenC.connect(
                    signer1
                ).transferFrom(
                    signer0.address,
                    signer1.address,
                    hre.ethers.parseUnits("1", decimal)
                )
            ).to.be.revertedWith("insufficient allowance");
        });
    });
});;