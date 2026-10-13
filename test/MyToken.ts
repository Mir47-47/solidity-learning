import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSinger } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constants";

const MINTING_AMOUNT = 100n;
const DECIMALS = 18n;

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSinger[];
    //다같이 myTokenC를 쓰기위해서 밖에서 정의해준다.
    beforeEach("should deploy", async () => {//이 그룹 실행전에 실행되는 함수
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            DECIMALS,
            MINTING_AMOUNT,
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
            expect(await myTokenC.decimals()).equal(DECIMALS);
        });
        it("should return 100 totalSupply", async () => {
            expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT * 10n ** DECIMALS);
        });
    });
    describe("Mint", () => {
        it("should return 1MT balance for singer 0", async () => {
            const singer0 = signers[0];
            expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT*10n**DECIMALS);
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
                hre.ethers.parseUnits("0.5", DECIMALS)
            );
            expect(await myTokenC.balanceOf(singer1)).equal(
                hre.ethers.parseUnits("0.5", DECIMALS)
            );
        });
        it("should be reverted with insufficient balance error", async () => {
        const singer1 = signers[1];
        await expect(
            myTokenC.transfer(
                hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), 
                singer1.address
            )
        ).to.be.revertedWith("insufficient balance");
        });
    });
    describe("TransferFrom", () => {
        it("should emit Approval event", async () => {
            const signer1 = signers[1];
            await expect(
                myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS))
            ).to.emit(
                myTokenC,
                "Approval"
            ).withArgs(
                signer1.address,
                hre.ethers.parseUnits("10", DECIMALS)
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
                    hre.ethers.parseUnits("1", DECIMALS)
                )
            ).to.be.revertedWith("insufficient allowance");
        });
        it("should transfer 0.5MT from signer0 to signer1", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];

            const amount = hre.ethers.parseUnits("47", DECIMALS);
            const initialBalance = MINTING_AMOUNT * 10n ** DECIMALS;

            const printBalances = async (label: string) => {
                const signer0Balance = await myTokenC.balanceOf(signer0.address);
                const signer1Balance = await myTokenC.balanceOf(signer1.address);
                        
                console.log(label);
                console.log(
                    "signer0:",
                    hre.ethers.formatUnits(signer0Balance, DECIMALS),
                    "MT"
                );
                console.log(
                    "signer1:",
                    hre.ethers.formatUnits(signer1Balance, DECIMALS),
                    "MT"
                );
            };

            // signer0가 signer1에게 사용할 수 있도록 승인
            await myTokenC.approve(signer1.address, amount);

            await printBalances("transferFrom 전");

            // signer1이 signer0의 토큰을 signer1에게 전송
            await myTokenC.connect(signer1).transferFrom(
                signer0.address,
                signer1.address,
                amount
            );
        
            await printBalances("transferFrom 후");

            // signer0의 잔액 확인
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                initialBalance - amount
            );
        
            // signer1의 잔액 확인
            expect(await myTokenC.balanceOf(signer1.address)).equal(amount);
        });
    });
});;