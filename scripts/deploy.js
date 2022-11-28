const { ethers } = require("hardhat")
const hre = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

const properties = [
    "https://ipfs.io/ipfs/QmdzEwky7NxeFHnPXuDREu1PnCprT3XbBDZ3oDZnnDz6JR?filename=p1.json",
    "https://ipfs.io/ipfs/QmY99jYSWosVxa6LpW88F2dgVabFNxza3kLPLnPAVxyb8w?filename=p2.json",
    "https://ipfs.io/ipfs/QmYGqpfEtd6QKhydfpgrs4BoPFKdceqrAvmQBrxhdsAEwD?filename=p3.json",
]

async function main() {
    // Setup accounts
    const [buyer, seller, inspector, lender] = await ethers.getSigners()
    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory("RealEstate")
    const realEstate = await RealEstate.deploy()
    await realEstate.deployed()

    console.log(`Deployed Real Estate Contract at: ${realEstate.address}`)
    console.log(`Minting 3 properties...\n`)

    for (let i = 0; i < properties.length; i++) {
        const transaction = await realEstate.connect(seller).mint(properties[i])
        await transaction.wait()
    }

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow")
    const escrow = await Escrow.deploy(
        realEstate.address,
        seller.address,
        inspector.address,
        lender.address
    )
    await escrow.deployed()

    console.log(`Deployed Escrow Contract at: ${escrow.address}`)
    console.log(`Listing 3 properties...\n`)

    for (let i = 0; i < properties.length; i++) {
        // Approve properties...
        let transaction = await realEstate.connect(seller).approve(escrow.address, i + 1)
        await transaction.wait()
    }

    // Listing properties...
    transaction = await escrow.connect(seller).list(1, buyer.address, tokens(35), tokens(20))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(50), tokens(30))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(20), tokens(10))
    await transaction.wait()

    console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
