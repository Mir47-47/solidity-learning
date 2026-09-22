import hre from "hardhat";

describe("hardhat-test", () => {//test에서 그룹핑할떄 사용
    it("print hardhat", async () => {//하나하나의 테스트 케이스를 정의할때 사용
        const signers = await hre.ethers.getSigners();
        const bobWallet = signers[0]; //첫번째 지갑을 가져와서 정의한것
        const aliceWallet = signers[1]; //두번째 지갑을 가져와서 정의한것
        const tx = {
            from:bobWallet.address,
            to:aliceWallet.address,
            // 1 ETH = 1 * 10^18 wei
            value:hre.ethers.parseEther("100")//value와 우리의 ether로 보내는 단위를 맞춰주기 위해서 parseEther를 사용한다.
        };
        const txHash = await bobWallet.sendTransaction(tx);//보내고 transaction 해쉬값을 받음
        const receipt = await txHash.wait();//트랜잭션이 블록에 포함될때까지 기다린다. 그리고 receipt를 받는다.
        console.log(await hre.ethers.provider.getTransaction(txHash.hash));//트랜잭션 해쉬값을 이용해서 트랜잭션을 가져온다.
        console.log("-----------------------------")
        console.log(receipt);
    });
    it("ethers test", async () => {

    })


})