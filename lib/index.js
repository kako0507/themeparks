import _ from 'lodash';
import settings from './settings';

// === Include Park Libs ===

// Walt Disney World Resort
import WaltDisneyWorldEpcot from './disney/waltdisneyworldepcot';
import WaltDisneyWorldMagicKingdom from './disney/waltdisneyworldmagickingdom';
import WaltDisneyWorldHollywoodStudios from './disney/waltdisneyworldhollywoodstudios';
import WaltDisneyWorldAnimalKingdom from './disney/waltdisneyworldanimalkingdom';

// Disneyland Resort
import DisneylandResortMagicKingdom from './disney/disneylandresortmagickingdom';
import DisneylandResortCaliforniaAdventure from './disney/disneylandresortcaliforniaadventure';

// Disneyland Paris
import DisneylandParisMagicKingdom from './disney/disneylandparismagickingdom';
import DisneylandParisWaltDisneyStudios from './disney/disneylandpariswaltdisneystudios';

// Shanghai Disney Resort
import ShanghaiDisneyResortMagicKingdom from './disney/shanghaidisneyresort';

// Tokyo Disney Resort
import TokyoDisneyResortMagicKingdom from './disneytokyo/tokyodisneyresortmagickingdom';
import TokyoDisneyResortDisneySea from './disneytokyo/tokyodisneyresortdisneysea';

// Hong Kong Disneyland
import HongKongDisneyland from './disney/hongkongdisneyland';

// Universal Florida
import UniversalStudiosFlorida from './universal/universalstudiosflorida';
import UniversalIslandsOfAdventure from './universal/universalislandsofadventure';
import UniversalVolcanoBay from './universal/universalvolcanobay';

// Universal Hollywood
import UniversalStudiosHollywood from './universal/universalstudioshollywood';

// Universal Singapore
import UniversalStudiosSingapore from './universal/universalstudiossingapore';

// Europa Park
import EuropaPark from './europapark';

// Six Flags Parks
import SixFlagsOverTexas from './sixflags/sixflagsovertexas';
import SixFlagsOverGeorgia from './sixflags/sixflagsovergeorgia';
import SixFlagsStLouis from './sixflags/sixflagsstlouis';
import SixFlagsGreatAdventure from './sixflags/sixflagsgreatadventure';
import SixFlagsMagicMountain from './sixflags/sixflagsmagicmountain';
import SixFlagsGreatAmerica from './sixflags/sixflagsgreatamerica';
import SixFlagsFiestaTexas from './sixflags/sixflagsfiestatexas';
import SixFlagsHurricaneHarborArlington from './sixflags/sixflagshurricaneharborarlington';
import SixFlagsHurricaneHarborLosAngeles from './sixflags/sixflagshurricaneharborlosangeles';
import SixFlagsAmerica from './sixflags/sixflagsamerica';
import SixFlagsDiscoveryKingdom from './sixflags/sixflagsdiscoverykingdom';
import SixFlagsNewEngland from './sixflags/sixflagsnewengland';
import SixFlagsHurricaneHarborJackson from './sixflags/sixflagshurricaneharborjackson';
import TheGreatEscape from './sixflags/thegreatescape';
import SixFlagsWhiteWaterAtlanta from './sixflags/sixflagswhitewateratlanta';
import SixFlagsMexico from './sixflags/sixflagsmexico';
import LaRondeMontreal from './sixflags/larondemontreal';
import SixFlagsHurricaneHarborOaxtepec from './sixflags/sixflagshurricaneharboroaxtepec';

// Merlin Parks
import AltonTowers from './merlinparks/altontowers';
import ThorpePark from './merlinparks/thorpepark';
import ChessingtonWorldOfAdventures from './merlinparks/chessingtonworldofadventures';

// Parc Asterix
import AsterixPark from './asterixpark/';

// Hershey Park
import HersheyPark from './hersheys';

// Herschend Parks
import Dollywood from './herschend/dollywood';
import SilverDollarCity from './herschend/silverdollarcity';

// Cedar Fair Parks
import KnottsBerryFarm from './cedarfair/knottsberryfarm';
import CedarPoint from './cedarfair/cedarpoint';
import Carowinds from './cedarfair/carowinds';
import CanadasWonderland from './cedarfair/canadaswonderland';
import KingsIsland from './cedarfair/kingsisland';
// Cedar Fair Parks that don't suppoer wait times (yet?).
// They are using a "new and improved" mobile app that doesn't include wait times
//  Dorney Park
//  Valley Fair
//  Michigan's Adventure
//  Worlds of Fun
//  Kings Dominion
//  California's Great America

// Efteling
import Efteling from './efteling/';

// === Expose Parks ===

// export all parks by name
const Parks = {
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
  SixFlagsHurricaneHarborOaxtepec,
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

// Array of available theme parks in the API
//  we manually add each one of these as any nice IDEs that "intellisense" will pick them up :)
const AllParks = _.map(Parks, ParkClass => ParkClass);

export default {
  settings,
  Parks,
  AllParks,
};
