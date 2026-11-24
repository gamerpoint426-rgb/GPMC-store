// Customize all addresses, Discord link, products, prices and perks here.
window.STORE_CONFIG = {
  discordUrl: "https://discord.gg/REPLACE-ME",
  javaAddress: "REPLACE-WITH-JAVA-IP",
  bedrockAddress: "REPLACE-WITH-BEDROCK-IP",
  bedrockPort: "19132",
  statusAddress: "REPLACE-WITH-JAVA-IP",
  products: [
    {id:"ascendant",category:"ranks",name:"ASCENDANT",label:"RANK",icon:"♛",price:"SET PRICE",description:"A premium rank with exclusive server perks.",perks:["Exclusive rank prefix","Rank cosmetics","Priority perks"]},
    {id:"immortal",category:"ranks",name:"IMMORTAL",label:"RANK",icon:"✦",price:"SET PRICE",description:"Stand out with upgraded rank privileges.",perks:["All Ascendant perks","Additional cosmetics","More exclusive perks"],featured:true},
    {id:"radiant",category:"ranks",name:"RADIANT",label:"TOP RANK",icon:"👑",price:"SET PRICE",description:"The ultimate GamerPointMC rank experience.",perks:["All Immortal perks","Top-tier rank identity","Exclusive rewards"]},
    {id:"coins-small",category:"coins",name:"COIN PACK",label:"CURRENCY",icon:"◈",price:"SET PRICE",description:"Add coins to your in-game balance.",perks:["In-game coin delivery","Use in the Coins Shop","Staff-confirmed delivery"]},
    {id:"coins-large",category:"coins",name:"MEGA COINS",label:"CURRENCY",icon:"◆",price:"SET PRICE",description:"A bigger coin bundle for more shop choices.",perks:["Larger coin bundle","Use in the Coins Shop","Staff-confirmed delivery"],featured:true},
    {id:"tag-custom",category:"tags",name:"CUSTOM TAG",label:"COSMETIC",icon:"✧",price:"SET PRICE",description:"Give your name a distinctive chat identity.",perks:["Custom chat tag","Subject to staff approval","One tag per order"]}
  ]
};