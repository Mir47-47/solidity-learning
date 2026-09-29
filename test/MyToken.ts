import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSinger } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSinger[];
    //다같이 myTokenC를 쓰기위해서 밖에서 정의해준다.
    before("should deploy", async () => {//이 그룹 실행전에 실행되는 함수
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            18
        ]);
    });
    it("should return name", async () => {
        expect(await myTokenC.name()).equal("MyToken");
    }); 
    it("should return symbol", async () => {
        expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
        expect(await myTokenC.decimals()).equal(18);
    });
    it("should return 0 totalSupply", async () => {
        expect(await myTokenC.totalSupply()).equal(1n * 10n ** 18n);
    });
    it("should return 1MT balance for singer 0", async () => {
        const singer0 = signers[0];
        expect(await myTokenC.totalSupply()).equal(1n*10n**18n);
    });
})