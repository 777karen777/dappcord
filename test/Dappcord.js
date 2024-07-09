const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
} 

describe("Dappcord", function () {
  let dappcord
  let deployer, user

  const NAME = "Dappcord"
  const SYMBOL = "DC"
  
  beforeEach(async () => {
    // Deploy Contract
    [deployer, user] =  await ethers.getSigners()

    const Dappcord = await ethers.getContractFactory("Dappcord")
    dappcord = await Dappcord.deploy(NAME, SYMBOL)

    // Create a channel
    const transaction = await dappcord.connect(deployer).createChannel("general", tokens(1))
    await transaction.wait() 
  })

  describe("Deployment", function () {

    it("Sets the name", async () => {

      // Fetch name
      let result = await dappcord.name()
      // Check name 
      expect(result).to.equal(NAME)
    })

    it("Sets the symbol", async () => {
      // Fetch symbol
      let result = await dappcord.symbol()
      // Check symbol
      expect(result).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      const result = await dappcord.owner()
      expect(result).to.equal(deployer.address)
    })
  })

  describe("Creating Channels", () => {
    it("Returns total channels", async () => {
      const result = await dappcord.totalChannels()
      expect(result).to.be.equal(1)      
    })

    it("Returns channel attributes", async () => {
      const result = await dappcord.getChannel(1)

      expect(result.id).to.be.equal(1)
      expect(result.name).to.be.equal("general")
      expect(result.cost).to.be.equal(tokens(1))

    })

    it("Not owner can't call this function", async () => {
      await expect(dappcord.connect(user).createChannel("newChannel", tokens(3))).to.be.reverted
      await expect(dappcord.connect(deployer).createChannel("newChannel", tokens(3))).to.not.be.reverted
    })
  })

  describe("Joining Channels", () => {
    const ID = 1
    const AMOUNT = tokens(1)

    beforeEach(async () => {
      const transaction = await dappcord.connect(user).mint(ID, {value: AMOUNT})
      await transaction.wait()
    })

    it("Joins the user", async () => {
      const result = await dappcord.hasJoined(ID, user.address)
      expect(result).to.be.equal(true)
    })
    
    it("Increases total supply", async () => {
      const result = await dappcord.totalSupply()
      expect(result).to.be.equal(ID)
    })
    
    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappcord.address)
      expect(result).to.be.equal(AMOUNT)
    })
    
  })
  
  describe("Checking requirements in \"mint\" function", () => {
    const ID = 1
    const AMOUNT = tokens(1)

    it("ID can't be 0", async () => {
      await expect(dappcord.connect(user).mint(0, {value: AMOUNT})).to.be.reverted
      await expect(dappcord.connect(user).mint(1, {value: AMOUNT})).to.not.be.reverted
    })
    
    it("ID can't be greater than totalChannels", async () => {      
      await expect(dappcord.connect(user).mint(2, {value: AMOUNT})).to.be.reverted
      await expect(dappcord.connect(user).mint(ID, {value: AMOUNT})).to.not.be.reverted
    })
    
    it("User has not joined the channel yet", async () => {      
      let result = await dappcord.hasJoined(ID, user.address)
      expect(result).to.be.equal(false)
    })

    it("User has already joined the channel", async () => {
      const transaction = await dappcord.connect(user).mint(ID, {value: AMOUNT})
      let result = await dappcord.hasJoined(ID, user.address)
      expect(result).to.be.equal(true)
    })

    it("Amount should be greater or equal the Channels cost", async () => {
      await expect(dappcord.connect(user).mint(ID, {value: tokens(0.5)})).to.be.reverted      
    })    
  })
  
  describe("Checking  \"withdraw\" function", () => {
    const ID = 1
    const AMOUNT = tokens(1)

    it("Checking balane of the contract befor and after calling withdraw finction", async () => {
      let transaction = await dappcord.connect(user).mint(ID, {value: AMOUNT})
      let result = await ethers.provider.getBalance(dappcord.address)
      
      transaction = await dappcord.connect(deployer).withdraw()
      result = await ethers.provider.getBalance(dappcord.address)
      expect(result).to.be.equal(0)
    })    
  })
})
