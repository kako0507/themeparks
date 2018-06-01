

// source-map support for ES6 compiled code
require('source-map-support/register');

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require('./settings');


// === Include Park Libs ===

// Walt Disney World Resort
const WaltDisneyWorldEpcot = require('./disney/waltdisneyworldepcot');
const WaltDisneyWorldMagicKingdom = require('./disney/waltdisneyworldmagickingdom');
const WaltDisneyWorldHollywoodStudios = require('./disney/waltdisneyworldhollywoodstudios');
const WaltDisneyWorldAnimalKingdom = require('./disney/waltdisneyworldanimalkingdom');

// Disneyland Resort
const DisneylandResortMagicKingdom = require('./disney/disneylandresortmagickingdom');
const DisneylandResortCaliforniaAdventure = require('./disney/disneylandresortcaliforniaadventure');

// Disneyland Paris
const DisneylandParisMagicKingdom = require('./disney/disneylandparismagickingdom');
const DisneylandParisWaltDisneyStudios = require('./disney/disneylandpariswaltdisneystudios');

// Shanghai Disney Resort
const ShanghaiDisneyResortMagicKingdom = require('./disney/shanghaidisneyresort');

// Tokyo Disney Resort
const TokyoDisneyResortMagicKingdom = require('./disneytokyo/tokyodisneyresortmagickingdom');
const TokyoDisneyResortDisneySea = require('./disneytokyo/tokyodisneyresortdisneysea');

// Hong Kong Disneyland
const HongKongDisneyland = require('./disney/hongkongdisneyland');

// Universal Florida
const UniversalStudiosFlorida = require('./universal/universalstudiosflorida');
const UniversalIslandsOfAdventure = require('./universal/universalislandsofadventure');
const UniversalVolcanoBay = require('./universal/universalvolcanobay');

// Universal Hollywood
const UniversalStudiosHollywood = require('./universal/universalstudioshollywood');

// Universal Singapore
const UniversalStudiosSingapore = require('./universal/universalstudiossingapore');

// Seaworld Parks
const SeaworldOrlando = require('./seaworld/seaworldorlando');
const SeaworldSanAntonio = require('./seaworld/seaworldsanantonio');
const SeaworldSanDiego = require('./seaworld/seaworldsandiego');
const BuschGardensTampaBay = require('./seaworld/buschgardenstampabay');
const BuschGardensWilliamsburg = require('./seaworld/buschgardenswilliamsburg');
const SesamePlace = require('./seaworld/sesameplace');

// Europa Park
const EuropaPark = require('./europapark');

// Six Flags Parks
const SixFlagsOverTexas = require('./sixflags/sixflagsovertexas');
const SixFlagsOverGeorgia = require('./sixflags/sixflagsovergeorgia');
const SixFlagsStLouis = require('./sixflags/sixflagsstlouis');
const SixFlagsGreatAdventure = require('./sixflags/sixflagsgreatadventure');
const SixFlagsMagicMountain = require('./sixflags/sixflagsmagicmountain');
const SixFlagsGreatAmerica = require('./sixflags/sixflagsgreatamerica');
const SixFlagsFiestaTexas = require('./sixflags/sixflagsfiestatexas');
const SixFlagsHurricaneHarborArlington = require('./sixflags/sixflagshurricaneharborarlington');
const SixFlagsHurricaneHarborLosAngeles = require('./sixflags/sixflagshurricaneharborlosangeles');
const SixFlagsAmerica = require('./sixflags/sixflagsamerica');
const SixFlagsDiscoveryKingdom = require('./sixflags/sixflagsdiscoverykingdom');
const SixFlagsNewEngland = require('./sixflags/sixflagsnewengland');
const SixFlagsHurricaneHarborJackson = require('./sixflags/sixflagshurricaneharborjackson');
const TheGreatEscape = require('./sixflags/thegreatescape');
const SixFlagsWhiteWaterAtlanta = require('./sixflags/sixflagswhitewateratlanta');
const SixFlagsMexico = require('./sixflags/sixflagsmexico');
const LaRondeMontreal = require('./sixflags/larondemontreal');

// Merlin Parks
const AltonTowers = require('./merlinparks/altontowers');
const ThorpePark = require('./merlinparks/thorpepark');
const ChessingtonWorldOfAdventures = require('./merlinparks/chessingtonworldofadventures');

// Parc Asterix
const AsterixPark = require('./asterixpark/');

// Hershey Park
const HersheyPark = require('./hersheys');

// Herschend Parks
const Dollywood = require('./herschend/dollywood');
const SilverDollarCity = require('./herschend/silverdollarcity');

// Cedar Fair Parks
const KnottsBerryFarm = require('./cedarfair/knottsberryfarm');
const CedarPoint = require('./cedarfair/cedarpoint');
const Carowinds = require('./cedarfair/carowinds');
const CanadasWonderland = require('./cedarfair/canadaswonderland');
const KingsIsland = require('./cedarfair/kingsisland');
// Cedar Fair Parks that don't suppoer wait times (yet?). They are using a "new and improved" mobile app that doesn't include wait times
//  Dorney Park
//  Valley Fair
//  Michigan's Adventure
//  Worlds of Fun
//  Kings Dominion
//  California's Great America

// Efteling
const Efteling = require('./efteling/');

// === Expose Parks ===

// Array of available theme parks in the API
//  we manually add each one of these as any nice IDEs that "intellisense" will pick them up :)
exports.AllParks = [
  // Walt Disney World Resort
  WaltDisneyWorldMagicKingdom,
  WaltDisneyWorldEpcot,
  WaltDisneyWorldHollywoodStudios,
  WaltDisneyWorldAnimalKingdom,
  // Disneyland Resort
  DisneylandResortMagicKingdom,
  DisneylandResortCaliforniaAdventure,
  // Disneyland Paris
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
  // Shanghai Disney Resort
  ShanghaiDisneyResortMagicKingdom,
  // Tokyo Disney Resort
  TokyoDisneyResortMagicKingdom,
  TokyoDisneyResortDisneySea,
  // Hong Kong Disneyland
  HongKongDisneyland,
  // Universal Florida
  UniversalStudiosFlorida,
  UniversalIslandsOfAdventure,
  UniversalVolcanoBay,
  // Universal Hollywood
  UniversalStudiosHollywood,
  // Universal Singapore
  UniversalStudiosSingapore,
  // Seaworld Parks
  SeaworldOrlando,
  SeaworldSanAntonio,
  SeaworldSanDiego,
  BuschGardensTampaBay,
  BuschGardensWilliamsburg,
  SesamePlace,
  // Europa Park
  EuropaPark,
  // Six Flags Parks
  SixFlagsOverTexas,
  SixFlagsOverGeorgia,
  SixFlagsStLouis,
  SixFlagsGreatAdventure,
  SixFlagsMagicMountain,
  SixFlagsGreatAmerica,
  SixFlagsFiestaTexas,
  SixFlagsHurricaneHarborArlington,
  SixFlagsHurricaneHarborLosAngeles,
  SixFlagsAmerica,
  SixFlagsDiscoveryKingdom,
  SixFlagsNewEngland,
  SixFlagsHurricaneHarborJackson,
  TheGreatEscape,
  SixFlagsWhiteWaterAtlanta,
  SixFlagsMexico,
  LaRondeMontreal,
  // Merlin Parks
  AltonTowers,
  ThorpePark,
  ChessingtonWorldOfAdventures,
  // Parc Asterix
  AsterixPark,
  // Hershey Park
  HersheyPark,
  // Herschend
  Dollywood,
  SilverDollarCity,
  // Cedar Fair Parks
  KnottsBerryFarm,
  CedarPoint,
  Carowinds,
  CanadasWonderland,
  KingsIsland,
  // Efteling
  Efteling,
];

// export all parks by name
exports.Parks = {
  // Walt Disney World Resort
  WaltDisneyWorldMagicKingdom,
  WaltDisneyWorldEpcot,
  WaltDisneyWorldHollywoodStudios,
  WaltDisneyWorldAnimalKingdom,
  // Disneyland Resort
  DisneylandResortMagicKingdom,
  DisneylandResortCaliforniaAdventure,
  // Disneyland Paris
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
  // Shanghai Disney Resort
  ShanghaiDisneyResortMagicKingdom,
  // Tokyo Disney Resort
  TokyoDisneyResortMagicKingdom,
  TokyoDisneyResortDisneySea,
  // Hong Kong Disneyland
  HongKongDisneyland,
  // Universal Florida
  UniversalStudiosFlorida,
  UniversalIslandsOfAdventure,
  UniversalVolcanoBay,
  // Universal Hollywood
  UniversalStudiosHollywood,
  // Universal Singapore
  UniversalStudiosSingapore,
  // Seaworld Parks
  SeaworldOrlando,
  SeaworldSanAntonio,
  SeaworldSanDiego,
  BuschGardensTampaBay,
  BuschGardensWilliamsburg,
  SesamePlace,
  // Europa Park
  EuropaPark,
  // Six Flags Parks
  SixFlagsOverTexas,
  SixFlagsOverGeorgia,
  SixFlagsStLouis,
  SixFlagsGreatAdventure,
  SixFlagsMagicMountain,
  SixFlagsGreatAmerica,
  SixFlagsFiestaTexas,
  SixFlagsHurricaneHarborArlington,
  SixFlagsHurricaneHarborLosAngeles,
  SixFlagsAmerica,
  SixFlagsDiscoveryKingdom,
  SixFlagsNewEngland,
  SixFlagsHurricaneHarborJackson,
  TheGreatEscape,
  SixFlagsWhiteWaterAtlanta,
  SixFlagsMexico,
  LaRondeMontreal,
  // Merlin Parks
  AltonTowers,
  ThorpePark,
  ChessingtonWorldOfAdventures,
  // Parc Asterix
  AsterixPark,
  // Hershey Park
  HersheyPark,
  // Herschend
  SilverDollarCity,
  Dollywood,
  // Cedar Fair Parks
  KnottsBerryFarm,
  CedarPoint,
  Carowinds,
  CanadasWonderland,
  KingsIsland,
  // Efteling
  Efteling,
};
