import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    //다같이 myTokenC를 쓰기위해서 밖에서 정의해준다.
    before("should deploy", async () => {//이 그룹 실행전에 실행되는 함수
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
    it("should return", async () => {
        expect(await myTokenC.decimals()).equal(18);
    });
})