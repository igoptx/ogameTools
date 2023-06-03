// ==UserScript==
// @name         InfoCompte (Beta)
// @namespace    https://github.com/igoptx/ogameTools
// @version      9.2.5.4
// @description  InfoCompte script for OGame
// @author       Igo (Original Authors: Vulca, benneb, The Stubbs)
// @license      MIT
// @match        https://*.ogame.gameforge.com/game/*
// @downloadURL  https://github.com/igoptx/ogameTools/raw/main/InfoCompte/InfoCompte_beta.user.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @website      https://correia.red
// ==/UserScript==

/**
 * Game entities classes
 */
class Body {

    constructor( data ){
        Object.assign( this, data );
        this.technologies = new Technologies( this.technologies );
    }

    get_building_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            const is_building = technology instanceof Building;
            const is_mine = technology instanceof Mine;
            if( is_building && !is_mine ){
                const cost = technology.get_cost_from( data );
                result += cost;
            }
        }
        return result;
    }

    get_defence_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            if( technology instanceof Defence ){
                result += technology.get_cost_from( data );
            }
        }
        return result;
    }

    get_static_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            const is_ship = technology instanceof Ship;
            const is_static_ship = technology.id === 212 || technology.id === 217;
            if( !is_ship || is_static_ship ){
                const cost = technology.get_cost_from( data );
                result += cost;
            }
        }
        return result;
    }

    get_without_fleet_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            const is_ship = technology instanceof Ship;
            if( !is_ship ){
                const cost = technology.get_cost_from( data );
                result += cost;
            }
        }
        return result;
    }
}

class Positions {

    constructor( data ){
        for( const coordinates in data ){
            const { planet, moon } = data[ coordinates ];
            const position = this[ coordinates ] = {};
            position.planet = new Planet( planet );
            if( moon ) position.moon = new Moon( moon );
        }
    }

    get_mine_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const planet = this[ coordinates ].planet;
            result += planet.get_mine_cost_from( data );
        }
        return result;
    }

    get_metal_mine_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const technologies = this[ coordinates ].planet.technologies;
            result += technologies[1]?.get_cost_from( data ) || 0;
        }
        return result;
    }

    get_crystal_mine_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const technologies = this[ coordinates ].planet.technologies;
            result += technologies[2]?.get_cost_from( data ) || 0;
        }
        return result;
    }

    get_deuterium_mine_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const technologies = this[ coordinates ].planet.technologies;
            result += technologies[3]?.get_cost_from( data ) || 0;
        }
        return result;
    }

    get_planetary_building_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const planet = this[ coordinates ].planet;
            result += planet.get_building_cost_from( data );
        }
        return result;
    }

    get_lunar_building_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const moon = this[ coordinates ].moon;
            if( moon ){
                result += moon.get_building_cost_from( data );
            }
        }
        return result;
    }

    get_lifeform_buildings_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const planet = this[ coordinates ].planet;
            result += planet.get_lifeform_buildings_cost_from( data );
        }
        return result;
    }

    get_lifeform_researches_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const planet = this[ coordinates ].planet;
            result += planet.get_lifeform_researches_cost_from( data );
        }
        return result;
    }

    get_defence_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const { planet, moon } = this[ coordinates ];
            result += planet.get_defence_cost_from( data );
            if( moon ) result += moon.get_defence_cost_from( data );
        }
        return result;
    }

    get_destructible_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const { planet, moon } = this[ coordinates ];
            result += planet.get_defence_cost_from( data );
            if( moon ){
                result += moon.get_building_cost_from( data );
                result += moon.get_defence_cost_from( data );
            }
        }
        return result;
    }

    get_upgrade_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const { planet, moon } = this[ coordinates ];
            result += planet.technologies.get_upgrade_cost_from( data );
            if( moon ) result += moon.technologies.get_upgrade_cost_from( data );
        }
        return result;
    }

    get_static_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const { planet, moon } = this[ coordinates ];
            result += planet.get_static_cost_from( data );
            if( moon ) result += moon.get_static_cost_from( data );
        }
        return result;
    }

    get_without_fleet_cost_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const { planet, moon } = this[ coordinates ];
            result += planet.get_without_fleet_cost_from( data );
            if( moon ) result += moon.get_without_fleet_cost_from( data );
        }
        return result;
    }

    get_average_cost_from( data ){
        return this.get_static_cost_from( data ) / Object.values( this ).length;
    }

    get_upgraded_production_from( data ){
        let result = 0;
        for( const coordinates in this ){
            const planet = this[ coordinates ].planet;
            result += planet.get_upgraded_production_from( data );
        }
        return result;
    }

    get_average_upgraded_production_from( data ){
        return this.get_upgraded_production_from( data ) / Object.values( this ).length;
    }
}

class Technologies {

    static costs = {
        1: [60, 15, 0, 1.5],
        2: [48, 24, 0, 1.6],
        3: [225, 75, 0, 1.5],
        4: [75, 30, 0, 1.5],
        12: [900, 360, 180, 1.8],
        14: [400, 120, 200, 2],
        15: [1_000_000, 500_000, 100_000, 2],
        21: [400, 200, 100, 2],
        22: [1_000, 0, 0, 2],
        23: [1_000, 500, 0, 2],
        24: [1_000, 1_000, 0, 2],
        31: [200, 400, 200, 2],
        33: [0, 50_000, 100_000, 2],
        34: [20_000, 40_000, 0, 2],
        36: [200, 0, 50, 5],
        41: [20_000, 40_000, 20_000, 2],
        42: [20_000, 40_000, 20_000, 2],
        43: [2_000_000, 4_000_000, 2_000_000, 2],
        44: [20_000, 20_000, 1_000, 2],
        106: [200, 1_000, 200, 2],
        108: [0, 400, 600, 2],
        109: [800, 200, 0, 2],
        110: [200, 600, 0, 2],
        111: [1_000, 0, 0, 2],
        113: [0, 800, 400, 2],
        114: [0, 4_000, 2_000, 2],
        115: [400, 0, 600, 2],
        117: [2_000, 4_000, 600, 2],
        118: [10_000, 20_000, 6_000, 2],
        120: [200, 100, 0, 2],
        121: [1_000, 300, 100, 2],
        122: [2_000, 4_000, 1_000, 2],
        123: [240_000, 400_000, 160_000, 2],
        124: [4_000, 8_000, 4_000, 1.75],
        199: [0, 0, 0, 3],
        202: [2_000, 2_000, 0],
        203: [6_000, 6_000, 0],
        204: [3_000, 1_000, 0],
        205: [6_000, 4_000, 0],
        206: [20_000, 7_000, 2_000],
        207: [45_000, 15_000, 0],
        208: [10_000, 20_000, 10_000],
        209: [10_000, 6_000, 2_000],
        210: [0, 1_000, 0],
        211: [50_000, 25_000, 15_000],
        212: [0, 2_000, 500],
        213: [60_000, 50_000, 15_000],
        214: [5_000_000, 4_000_000, 1_000_000],
        215: [30_000, 40_000, 15_000],
        217: [2_000, 2_000, 1_000],
        218: [85_000, 55_000, 20_000],
        219: [8_000, 15_000, 8_000],
        401: [2_000, 0, 0],
        402: [1_500, 500, 0],
        403: [6_000, 2_000, 0],
        404: [20_000, 15_000, 2_000],
        405: [5_000, 3_000, 0],
        406: [50_000, 50_000, 30_000],
        407: [10_000, 10_000, 0],
        408: [50_000, 50_000, 0],
        502: [8_000, 0, 2_000],
        503: [12_500, 2_500, 10_000],
        11101: [7, 2, 0 , 1.2],
        11102: [5, 2, 0 , 1.23],
        11103: [20_000, 25_000, 10_000, 1.3],
        11104: [5_000, 3_200, 1_500, 1.7],
        11105: [50_000, 40_000, 50_000, 1.7],
        11106: [9_000, 6_000, 3_000, 1.5],
        11107: [25_000, 13_000, 7_000, 1.09],
        11108: [50_000, 25_000, 15_000, 1.5],
        11109: [75_000, 20_000, 25_000, 1.09],
        11110: [150_000, 30_000, 15_000, 1.12],
        11111: [80_000, 35_000, 60_000, 1.5],
        11112: [250_000, 125_000, 125_000, 1.2],
        11201: [5_000, 2_500, 500, 1.3],
        11202: [7_000, 10_000, 5_000, 1.5],
        11203: [15_000, 10_000, 5_000, 1.3],
        11204: [20_000, 15_000, 7_500, 1.3],
        11205: [25_000, 20_000, 10_000, 1.2],
        11206: [35_000, 25_000, 15_000, 1.5],
        11207: [70_000, 40_000, 20_000, 1.3],
        11208: [80_000, 50_000, 20_000, 1.5],
        11209: [320_000, 240_000, 100_000, 1.5],
        11210: [320_000, 240_000, 100_000, 1.5],
        11211: [120_000, 30_000, 25_000, 1.5],
        11212: [100_000, 40_000, 30_000, 1.3],
        11213: [200_000, 100_000, 100_000, 1.3],
        11214: [160_000, 120_000, 50_000, 1.5],
        11215: [160_000, 120_000, 50_000, 1.5],
        11216: [320_000, 240_000, 100_000, 1.5],
        11217: [300_000, 180_000, 120_000, 1.5],
        11218: [500_000, 300_000, 200_000, 1.3],
        12101: [9, 3, 0 , 1.2],
        12102: [7, 2, 0 , 1.2],
        12103: [40_000, 10_000, 15_000, 1.3],
        12104: [5_000, 3_800, 1_000, 1.7],
        12105: [50_000, 40_000, 50_000, 1.65],
        12106: [10_000, 8_000, 1_000, 1.4],
        12107: [20_000, 15_000, 10_000, 1.2],
        12108: [50_000, 35_000, 15_000, 1.5],
        12109: [85_000, 44_000, 25_000, 1.4],
        12110: [120_000, 50_000, 20_000, 1.4],
        12111: [250_000, 150_000, 100_000, 1.8],
        12112: [250_000, 125_000, 125_000, 1.5],
        12201: [10_000, 6_000, 1_000, 1.5],
        12202: [7_500, 12_500, 5_000, 1.5],
        12203: [15_000, 10_000, 5_000, 1.5],
        12204: [20_000, 15_000, 7_500, 1.3],
        12205: [25_000, 20_000, 10_000, 1.5],
        12206: [50_000, 50_000, 20_000, 1.5],
        12207: [70_000, 40_000, 20_000, 1.5],
        12208: [160_000, 120_000, 50_000, 1.5],
        12209: [75_000, 55_000, 25_000, 1.5],
        12210: [85_000, 40_000, 35_000, 1.5],
        12211: [120_000, 30_000, 25_000, 1.5],
        12212: [100_000, 40_000, 30_000, 1.5],
        12213: [200_000, 100_000, 100_000, 1.2],
        12214: [220_000, 110_000, 110_000, 1.3],
        12215: [240_000, 120_000, 120_000, 1.3],
        12216: [250_000, 250_000, 250_000, 1.4],
        12217: [500_000, 300_000, 200_000, 1.5],
        12218: [300_000, 180_000, 120_000, 1.7],
        13101: [6, 2, 0 , 1.21],
        13102: [5, 2, 0 , 1.18],
        13103: [30_000, 20_000, 10_000, 1.3],
        13104: [5_000, 3_800, 1_000, 1.8],
        13105: [50_000, 40_000, 50_000, 1.8],
        13106: [7_500, 7_000, 1_000, 1.3],
        13107: [35_000, 15_000, 10_000, 1.5],
        13108: [50_000, 20_000, 30_000, 1.07],
        13109: [100_000, 10_000, 3_000, 1.14],
        13110: [100_000, 40_000, 20_000, 1.5],
        13111: [55_000, 50_000, 30_000, 1.5],
        13112: [250_000, 125_000, 125_000, 1.4],
        13201: [10_000, 6_000, 1_000, 1.5],
        13202: [7_500, 12_500, 5_000, 1.3],
        13203: [15_000, 10_000, 5_000, 1.5],
        13204: [20_000, 15_000, 7_500, 1.3],
        13205: [160_000, 120_000, 50_000, 1.5],
        13206: [50_000, 50_000, 20_000, 1.5],
        13207: [70_000, 40_000, 20_000, 1.3],
        13208: [160_000, 120_000, 50_000, 1.5],
        13209: [160_000, 120_000, 50_000, 1.5],
        13210: [85_000, 40_000, 35_000, 1.2],
        13211: [120_000, 30_000, 25_000, 1.3],
        13212: [160_000, 120_000, 50_000, 1.5],
        13213: [200_000, 100_000, 100_000, 1.5],
        13214: [160_000, 120_000, 50_000, 1.5],
        13215: [320_000, 240_000, 100_000, 1.5],
        13216: [320_000, 240_000, 100_000, 1.5],
        13217: [500_000, 300_000, 200_000, 1.5],
        13218: [300_000, 180_000, 120_000, 1.7],
        14101: [4, 3, 0 , 1.21],
        14102: [6, 3, 0 , 1.21],
        14103: [20_000, 20_000, 30_000, 1.3],
        14104: [7_500, 5_000, 800, 1.8],
        14105: [60_000, 30_000, 50_000, 1.8],
        14106: [8_500, 5_000, 3_000, 1.25],
        14107: [15_000, 15_000, 20_000, 1.2],
        14108: [75_000, 25_000, 30_000, 1.05],
        14109: [87_500, 25_000, 30_000, 1.2],
        14110: [150_000, 30_000, 30_000, 1.5],
        14111: [75_000, 50_000, 55_000, 1.2],
        14112: [500_000, 250_000, 250_000, 1.4],
        14201: [10_000, 6_000, 1_000, 1.5],
        14202: [7_500, 12_500, 5_000, 1.5],
        14203: [15_000, 10_000, 5_000, 1.5],
        14204: [20_000, 15_000, 7_500, 1.5],
        14205: [25_000, 20_000, 10_000, 1.5],
        14206: [50_000, 50_000, 20_000, 1.3],
        14207: [70_000, 40_000, 20_000, 1.5],
        14208: [80_000, 50_000, 20_000, 1.2],
        14209: [320_000, 240_000, 100_000, 1.5],
        14210: [85_000, 40_000, 35_000, 1.2],
        14211: [120_000, 30_000, 25_000, 1.5],
        14212: [100_000, 40_000, 30_000, 1.5],
        14213: [200_000, 100_000, 100_000, 1.5],
        14214: [160_000, 120_000, 50_000, 1.5],
        14215: [240_000, 120_000, 120_000, 1.5],
        14216: [320_000, 240_000, 100_000, 1.5],
        14217: [500_000, 300_000, 200_000, 1.5],
        14218: [300_000, 180_000, 120_000, 1.7]
    }

    constructor( data = {} ){
        for( const id in data ){
            let Technology;
            if( id > 14_200 ) Technology = LifeformResearch;
            else if( id > 14_100 ) Technology = LifeformBuilding;
            else if( id > 13_200 ) Technology = LifeformResearch;
            else if( id > 13_100 ) Technology = LifeformBuilding;
            else if( id > 12_200 ) Technology = LifeformResearch;
            else if( id > 12_100 ) Technology = LifeformBuilding;
            else if( id > 11_200 ) Technology = LifeformResearch;
            else if( id > 11_100 ) Technology = LifeformBuilding;
            else if( id > 400 ) Technology = Defence;
            else if( id > 200 ) Technology = Ship;
            else if( id > 100 ) Technology = Research;
            else if( id > 3 ) Technology = Building;
            else Technology = Mine;
            this[ id ] = new Technology( data[ id ] );
        }
    }

    get_cost_from( data ){
        let result = 0;
        for( const id in this ){
            const technology = this[ id ];
            result += technology.get_cost_from( data );
        }
        return result;
    }

    get_upgrade_cost_from( data ){
        let result = 0;
        for( const id in this ){
            const technology = this[ id ];
            result += technology.get_upgrade_cost_from( data );
        }
        return result;
    }
}

class Technology {

    constructor( data ){
        this.id = parseInt( data.id );
        this.value = data.value;
        this.upgrade = data.upgrade;
        this.upgraded = data.value + data.upgrade;
    }
}

class Moon extends Body {}

class Planet extends Body {

    get_mine_cost_from( data ){
        return ( this.technologies[1]?.get_cost_from( data ) || 0 ) +
            ( this.technologies[2]?.get_cost_from( data ) || 0 ) +
            ( this.technologies[3]?.get_cost_from( data ) || 0 );
    }

    get_lifeform_buildings_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            if( technology instanceof LifeformBuilding ){
                result += technology.get_cost_from( data );
            }
        }
        return result;
    }

    get_lifeform_researches_cost_from( data ){
        let result = 0;
        for( const id in this.technologies ){
            const technology = this.technologies[ id ];
            if( technology instanceof LifeformResearch ){
                result += technology.get_cost_from( data );
            }
        }
        return result;
    }

    // get_basic_production_from( data ){
    // 	const speed = data.game.universe.economy_speed;
    // 	const rates = data?.script?.rates || { metal: 1, crystal: 1 };
    // 	return 30 * speed / rates.metal + 15 * speed / rates.crystal;
    // }

    // get_fusion_production_from( data ){
    // 	const level = this.technologies?.[12].upgraded || 0;
    // 	const speed = data.game.universe.economy_speed;
    // 	const factor = this.productions?.fusion.factor || 1;
    // 	const rate = data?.script?.rates.deuterium || 1;
    // 	return Math.floor( 10 * level * 1.1 ** level * speed * factor ) * rate * -1;
    // }

    get_upgraded_production_from( data ){
        const mines = this.get_upgraded_mines_production_from( data );
        const crawlers = this.get_upgraded_crawlers_production_from( data, mines );
        const plasma = this.get_upgraded_plasma_production_from( data, mines );
        const classes = this.get_classes_production_from( data, mines );
        const officers = this.get_officers_production_from( data, mines );
        return mines.total + crawlers + plasma + classes + officers;
    }

    get_upgraded_mines_production_from( data ){
        const metal = this.get_upgraded_metal_mine_production_from( data );
        const crystal = this.get_upgraded_crystal_mine_production_from( data );
        const deuterium = this.get_upgraded_deuterium_mine_production_from( data );
        const total = metal + crystal + deuterium;
        return {
            metal,
            crystal,
            deuterium,
            total
        };
    }

    get_upgraded_metal_mine_production_from( data ){
        const level = this.technologies?.[1].upgraded || 0;
        const bonus = [1.35, 1.23, 1.17, 1][ Math.min( 3, Math.abs( this.position - 8 ) ) ];
        const speed = data.game.universe.economy_speed;
        const rate = data?.script?.rates.metal || 1;
        return Math.round( 30 * level * 1.1 ** level * bonus * speed ) / rate;
    }

    get_upgraded_crystal_mine_production_from( data ){
        const level = this.technologies?.[2].upgraded || 0;
        const bonus = Math.max( 1, 1.4 - .1 * this.position );
        const speed = data.game.universe.economy_speed;
        const rate = data?.script?.rates.crystal || 1;
        return Math.round( 20 * level * 1.1 ** level * bonus * speed ) / rate;
    }

    get_upgraded_deuterium_mine_production_from( data ){
        const level = this.technologies?.[3].upgraded || 0;
        const bonus = 1.44 - .004 * this.temperatures?.max || 0;
        const speed = data.game.universe.economy_speed;
        const rate = data?.script?.rates.deuterium || 1;
        return Math.round( 10 * level * 1.1 ** level * bonus * speed ) / rate;
    }

    get_upgraded_crawlers_production_from( data, productions ){
        const metal_level = this.technologies?.[1].upgraded || 0;
        const crystal_level = this.technologies?.[2].upgraded || 0;
        const deuterium_level = this.technologies?.[3].upgraded || 0;
        const crawlers_count_bonus = data.game.player.class === 'miner' ? 1.1 : 1;
        const crawlers_count = ( metal_level + crystal_level + deuterium_level ) * 8 * crawlers_count_bonus;
        const crawlers_production_bonus = data.game.player.class === 'miner' ? 1.5 : 1;
        const crawlers_production_factor = crawlers_production_bonus;
        const crawlers_rate = Math.min( .5, .02 * crawlers_production_bonus * crawlers_production_factor * crawlers_count );
        return productions.total * crawlers_rate;
    }

    get_upgraded_plasma_production_from( data, productions ){
        const level = data.game.player.researches?.[122].upgraded || 0;
        return productions.metal * .01 * level +
            productions.crystal * .0066 * level +
            productions.deuterium * .0033 * level;
    }

    get_classes_production_from( data, productions ){
        const miner_class = data.game.player.class === 'miner';
        const trader_class = data.game.player?.alliance?.class === 'trader';
        const bonus = ( miner_class ? .25 : 0 ) + ( trader_class ? .05 : 0 );
        return productions.total * bonus;
    }

    get_officers_production_from( data, productions ){
        const officers = data.game.player.officers;
        const bonus = ( officers.geologist ? .1 : 0 ) + ( officers.all ? .02 : 0 );
        return productions.total * bonus;
    }
}

class Researches extends Technologies {}

class Unit extends Technology {

    get_cost_from( data ){
        const [ metal, crystal, deuterium ] = Technologies.costs[ this.id ];
        const rates = data?.script?.rates || { metal: 1, crystal: 1, deuterium: 1 };
        return  metal * this.value / rates.metal +
            crystal * this.value / rates.crystal +
            deuterium * this.value / rates.deuterium;
    }

    get_upgrade_cost_from( data ){
        const [ metal, crystal, deuterium ] = Technologies.costs[ this.id ];
        const rates = data?.script?.rates || { metal: 1, crystal: 1, deuterium: 1 };
        return  metal * this.upgrade / rates.metal +
            crystal * this.upgrade / rates.crystal +
            deuterium * this.upgrade / rates.deuterium;
    }
}

class Upgradable extends Technology {

    get_cost_from( data ){
        const [ metal, crystal, deuterium, factor ] = Technologies.costs[ this.id ];
        const rates = data?.script?.rates || { metal: 1, crystal: 1, deuterium: 1 };
        let result = 0;
        for( let i = 1; i <= this.value; i++ ){
            result += this.get_level_cost_from( metal, factor, i ) / rates.metal +
                this.get_level_cost_from( crystal, factor, i ) / rates.crystal +
                this.get_level_cost_from( deuterium, factor, i ) / rates.deuterium;
        }
        return result;
    }

    get_upgrade_cost_from( data ){
        const [ metal, crystal, deuterium, factor ] = Technologies.costs[ this.id ];
        const rates = data?.script?.rates || { metal: 1, crystal: 1, deuterium: 1 };
        let result = 0;
        for( let i = this.value + 1; i <= this.upgraded; i++ ){
            result += this.get_level_cost_from( metal, factor, i ) / rates.metal +
                this.get_level_cost_from( crystal, factor, i ) / rates.crystal +
                this.get_level_cost_from( deuterium, factor, i ) / rates.deuterium;
        }
        return result;
    }
}

class Defence extends Unit {
}

class Ship extends Unit {
}

class Building extends Upgradable {

    get_level_cost_from( base, factor, level ){
        return Math.floor( base * factor ** ( level - 1 ) );
    }
}

class Lifeform extends Upgradable {

    get_level_cost_from( base, factor, level ){
        return Math.floor( base * factor ** ( level - 1 ) * level );
    }
}

class Research extends Upgradable {

    get_level_cost_from( base, factor, level ){
        return Math.round( base * factor ** ( level - 1 ) * .01 ) * 100;
    }
}

class Mine extends Building {
}

class LifeformBuilding extends Lifeform {
}

class LifeformResearch extends Lifeform {
}
/**
 * Sript components
 */
const Translation = new function(){
    const translations = {
        en: {
            1: 'Metal mine',
            2: 'Crystal mine',
            3: 'Deuterium synthesizer',
            4: 'Solar plant',
            12: 'Fusion plant',
            14: 'Robotics factory',
            15: 'Nanite factory',
            21: 'Shipyard',
            22: 'Metal storage',
            23: 'Crystal storage',
            24: 'Deuterium storage',
            31: 'Research laboratory',
            33: 'Terraformer',
            34: 'Alliance depot',
            36: 'Repair dock',
            41: 'Moonbase',
            42: 'Sensor phalanx',
            43: 'Jump gate',
            44: 'Missile silo',
            106: 'Espionage',
            108: 'Computer',
            109: 'Weapons',
            110: 'Shielding',
            111: 'Armour',
            113: 'Energy',
            114: 'Hyperspace',
            115: 'Combustion drive',
            117: 'Impulse drive',
            118: 'Hyperspace drive',
            120: 'Laser',
            121: 'Ion',
            122: 'Plasma',
            123: 'Intergalacticresearch network',
            124: 'Astrophysics',
            199: 'Graviton',
            202: 'Small cargo',
            203: 'Large cargo',
            204: 'Light fighter',
            205: 'Heavy fighter',
            206: 'Cruiser',
            207: 'Battleship ',
            208: 'Colony ship',
            209: 'Recycler',
            210: 'Espionage probe',
            211: 'Bomber',
            212: 'Solar satellite',
            213: 'Destroyer',
            214: 'Deathstar',
            215: 'Battlecruiser',
            217: 'Crawler',
            218: 'Reaper',
            219: 'Pathfinder',
            401: 'Rocket launchers',
            402: 'Light lasers',
            403: 'Heavy laser',
            404: 'Gauss cannon',
            405: 'Ion cannon',
            406: 'Plasma turret',
            407: 'Small shield dome',
            408: 'Large shield dome',
            502: 'Anti-ballistic missiles',
            503: 'Interplanetary missile',
            11101: 'Residential Sector',
            11102: 'Biosphere Farm',
            11103: 'Research Centre',
            11104: 'Academy of Sciences',
            11105: 'Neuro-Calibration Centre',
            11106: 'High Energy Smelting',
            11107: 'Food Silo',
            11108: 'Fusion-Powered Production',
            11109: 'Skyscraper',
            11110: 'Biotech Lab',
            11111: 'Metropolis',
            11112: 'Planetary Shield',
            11201: 'Intergalactic Envoys',
            11202: 'High-Performance Extractors',
            11203: 'Fusion Drives',
            11204: 'Stealth Field Generator',
            11205: 'Orbital Den',
            11206: 'Research AI',
            11207: 'High-Performance Terraformer',
            11208: 'Enhanced Production Technologies',
            11209: 'Light Fighter Mk II',
            11210: 'Cruiser Mk II',
            11211: 'Improved Lab Technology',
            11212: 'Plasma Terraformer',
            11213: 'Low-Temperature Drives',
            11214: 'Bomber Mk II',
            11215: 'Destructeur Mk II',
            11216: 'Battlecruiser Mk II',
            11217: 'Robot Assistants',
            11218: 'Supercomputer',
            12101: 'Meditation Enclave',
            12102: 'Crystal Farm',
            12103: 'Rune Technologium',
            12104: 'Rune Forge',
            12105: 'Oriktorium',
            12106: 'Magma Forge',
            12107: 'Disruption Chamber',
            12108: 'Megalith',
            12109: 'Crystal Refinery',
            12110: 'Deuterium Synthesiser',
            12111: 'Mineral Research Centre',
            12112: 'Advanced Recycling Plant',
            12201: 'Magma Refinement',
            12202: 'Acoustic Scanning',
            12203: 'High Energy Pump Systems',
            12204: 'Cargo Hold Expansion',
            12205: 'Magma-Powered Production',
            12206: 'Geothermal Power Plants',
            12207: 'Depth Sounding',
            12208: 'Ion Crystal Enhancement (Heavy Fighter)',
            12209: 'Improved Stellarator',
            12210: 'Hardened Diamond Drill Heads',
            12211: 'Seismic Mining Technology',
            12212: 'Magma-Powered Pump Systems',
            12213: 'Ion Crystal Modules',
            12214: 'Optimised Silo Construction Method',
            12215: 'Diamond Energy Transmitter',
            12216: 'Obsidian Shield Reinforcement',
            12217: 'Rune Shields',
            12218: 'Rock’tal Collector Enhancement',
            13101: 'Assembly Line',
            13102: 'Fusion Cell Factory',
            13103: 'Robotics Research Centre',
            13104: 'Update Network',
            13105: 'Quantum Computer Centre',
            13106: 'Automatised Assembly Centre',
            13107: 'High-Performance Transformer',
            13108: 'Microchip Assembly Line',
            13109: 'Production Assembly Hall',
            13110: 'High-Performance Synthesiser',
            13111: 'Chip Mass Production',
            13112: 'Nano Repair Bots',
            13201: 'Catalyser Technology',
            13202: 'Plasma Drive',
            13203: 'Efficiency Module',
            13204: 'Depot AI',
            13205: 'General Overhaul (Light Fighter)',
            13206: 'Automated Transport Lines',
            13207: 'Improved Drone AI',
            13208: 'Experimental Recycling Technology',
            13209: 'General Overhaul (Cruiser)',
            13210: 'Slingshot Autopilot',
            13211: 'High-Temperature Superconductors',
            13212: 'General Overhaul (Battleship)',
            13213: 'Artificial Swarm Intelligence',
            13214: 'General Overhaul (Battlecruiser)',
            13215: 'General Overhaul (Bomber)',
            13216: 'General Overhaul (Destroyer)',
            13217: 'Experimental Weapons Technology',
            13218: 'Mechan General Enhancement',
            14101: 'Sanctuary',
            14102: 'Antimatter Condenser',
            14103: 'Vortex Chamber',
            14104: 'Halls of Realisation',
            14105: 'Forum of Transcendence',
            14106: 'Antimatter Convector',
            14107: 'Cloning Laboratory',
            14108: 'Chrysalis Accelerator',
            14109: 'Bio Modifier',
            14110: 'Psionic Modulator',
            14111: 'Ship Manufacturing Hall',
            14112: 'Supra Refractor',
            14201: 'Heat Recovery',
            14202: 'Sulphide Process',
            14203: 'Psionic Network',
            14204: 'Telekinetic Tractor Beam',
            14205: 'Enhanced Sensor Technology',
            14206: 'Neuromodal Compressor',
            14207: 'Neuro-Interface',
            14208: 'Interplanetary Analysis Network',
            14209: 'Overclocking (Heavy Fighter)',
            14210: 'Telekinetic Drive',
            14211: 'Sixth Sense',
            14212: 'Psychoharmoniser',
            14213: 'Efficient Swarm Intelligence',
            14214: 'Overclocking (Large Cargo)',
            14215: 'Gravitation Sensors',
            14216: 'Overclocking (Battleship)',
            14217: 'Psionic Shield Matrix',
            14218: 'Kaelesh Discoverer Enhancement',
            account_points_repartition: 'Account points repartition',
            alliance: 'Alliance',
            at: 'at',
            buildings: 'Buildings',
            clear_confirm: 'You are going to delete the InfoCompte data.',
            crystal: 'Crystal',
            daily_productions: 'Daily productions',
            days: 'jours',
            defence: 'Defence',
            defences: 'Defences',
            deuterium: 'Deuterium',
            empire: 'Empire',
            empire_of: "Empire of",
            explorer_player_class: 'Discoverer',
            export_notification: 'Export placed in clipboard',
            facilities: 'Facilities',
            fleet: 'Fleet',
            generated_on: 'Generated on',
            highscore: 'Highscore',
            hours: 'hours',
            if_destroyed: 'place(s) if destroyed',
            indestructible: 'Indestructible',
            levels: 'Levels',
            lifeform1: 'Human',
            lifeform2: 'Rock’tal',
            lifeform3: 'Mecha',
            lifeform4: 'Kaelesh',
            lifeform_buildings: 'Lifeform buildings',
            lifeform_buildings_short: 'LF buildings',
            lifeform_researches: 'Lifeform researches',
            lifeform_researches_short: 'LF researches',
            lifeforms: 'Lifeforms',
            lifeform_levels: 'Lifeform levels',
            lunar_buildings: 'Lunar buildings',
            lunar_defences: 'Lunar defences',
            maximum: 'maximum',
            metal: 'Metal',
            mines: 'Mines',
            mines_only: 'Mines only',
            mines_points: 'Mines points',
            miner_player_class: 'Collector',
            months: 'months',
            moon: 'Moon',
            on: 'on',
            others: 'Others',
            planet: 'Planet',
            planet_fields: 'Planet fields',
            planetary_buildings: 'Planetary buildings',
            planetary_defences: 'Planetary defences',
            planets: 'Planets',
            planets_repartition: 'Planets points repartition',
            points: 'Points',
            production: 'Production',
            production_of: "Production of",
            productions: 'Productions',
            queue: 'Upgrades queue',
            rates: 'Trade rates:',
            rentabilities: "Rentabilities",
            research: 'Research',
            researcher_alliance_class: 'Researcher',
            researches: 'Researches',
            resources: 'Resources',
            shipyards: 'Shipyards',
            temperatures_maximum: 'Maxmimum temperatures',
            total: 'Total',
            trader_alliance_class: 'Trader',
            upgrade: 'In construction',
            used: 'used',
            validate: 'Validate',
            warrior_alliance_class: 'Warrior',
            warrior_player_class: 'General',
            weeks: 'weeks',
            when_finished: 'place(s) when finished',
            with: 'with',
            without_dark_matter: 'Without DM',
            years: 'years',
            coords: 'Coords'
        },
        fr: {
            1: "Mine de métal",
            2: "Mine de cristal",
            3: "Synthétiseur de deutérium",
            4: "Centrale électrique solaire",
            12: "Centrale électrique de fusion",
            14: "Usine de robots",
            15: "Usine de nanites",
            21: "Chantier spatial",
            22: "Hangar de métal",
            23: "Hangar de cristal",
            24: "Réservoir de deutérium",
            31: "Laboratoire de recherche",
            33: "Terraformeur",
            34: "Dépôt de ravitaillement",
            36: "Dock spatial",
            41: "Base lunaire",
            42: "Phalange de capteur",
            43: "Porte de saut spatial",
            44: "Silo de missiles",
            106: "Espionnage",
            108: "Ordinateur",
            109: "Armes",
            110: "Bouclier",
            111: "Protection",
            113: "Énergie",
            114: "Hyperespace",
            115: "Réacteur à combustion",
            117: "Réacteur à impulsion",
            118: "Propulsion hyperespace",
            120: "Laser",
            121: "Ions",
            122: "Plasma",
            123: "Réseau de recherche",
            124: "Astrophysique",
            199: "Graviton",
            202: "Petit transporteur",
            203: "Grand transporteur",
            204: "Chasseur léger",
            205: "Chasseur lourd",
            206: "Croiseur",
            207: "Vaisseau de bataille",
            208: "Vaisseau de colonisation",
            209: "Recycleur",
            210: "Sonde d'espionnage",
            211: "Bombardier",
            212: "Satellite solaire",
            213: "Destructeur",
            214: "Étoile de la mort",
            215: "Traqueur",
            217: "Foreuse",
            218: "Faucheur",
            219: "Éclaireur",
            401: "Lanceur de missiles",
            402: "Artillerie laser légère",
            403: "Artillerie laser lourde",
            404: "Canon de Gauss",
            405: "Artillerie à ions",
            406: "Lanceur de plasma",
            407: "Petit bouclier",
            408: "Grand bouclier",
            502: "Missile d'interception",
            503: "Missile interplanétaire",
            11101: "Secteur résidentiel",
            11102: "Ferme biosphérique",
            11103: "Centre de recherche",
            11104: "Académie des sciences",
            11105: "Centre de neurocalibrage",
            11106: "Fusion à haute énergie",
            11107: "Réserve alimentaire",
            11108: "Extraction par fusion",
            11109: "Tour d’habitation",
            11110: "Laboratoire de biotechnologie",
            11111: "Metropolis",
            11112: "Bouclier planétaire",
            11201: "Intergalactic Envoys",
            11202: "Extracteurs à haute performance",
            11203: "Moteur à fusion",
            11204: "Générateur de champ de camouflage",
            11205: "Planque orbitale",
            11206: "IA de recherche",
            11207: "Terraformeur à haute performance",
            11208: "Technologies d'extraction améliorés",
            11209: "Chasseur léger Mk II",
            11210: "Croiseur Mk II",
            11211: "Technologie de laboratoire améliorée",
            11212: "Terraformeur à plasma",
            11213: "Propulseurs à faible température",
            11214: "Bombardier Mk II",
            11215: "Destroyer Mk II",
            11216: "Traqueur Mk II",
            11217: "Assistants robotiques",
            11218: "Superordinateur",
            12101: "Enclave stoïque",
            12102: "Culture du cristal",
            12103: "Centre technologique runique",
            12104: "Forge runique",
            12105: "Orictorium",
            12106: "Fusion magmatique",
            12107: "Chambre de disruption",
            12108: "Monument rocheux",
            12109: "Raffinerie de cristal",
            12110: "Syntoniseur de deutérium",
            12111: "Centre de recherche sur les minéraux",
            12112: "Usine de traitement à haut rendement",
            12201: "Batteries volcaniques",
            12202: "Sondage acoustique",
            12203: "Système de pompage à haute énergie",
            12204: "Extension d'espace fret",
            12205: "Extraction",
            12206: "Centrales géothermiques",
            12207: "Sondage en profondeur",
            12208: "Renforcement à cristaux ioniques",
            12209: "Stellarator amélioré",
            12210: "Tête de forage en dimant",
            12211: "Technologie d'extraction sismique",
            12212: "Pompes au magma",
            12213: "Module à cristaux ioniques",
            12214: "Construction optimisée de silos",
            12215: "Émetteur d'énergie à diamants",
            12216: "Intensification du bouclier à l'obsidienne",
            12217: "Boucliers runiques",
            12218: "Renfort du collecteur Rocta",
            13101: "Chaîne de production",
            13102: "Usine de fusion de cellules",
            13103: "Centre de recherche en robotique",
            13104: "Réseau d’actualisation",
            13105: "Centre d’informatique quantique",
            13106: "Centre d’assemblage automatisé",
            13107: "Transformateur hyperpuissant",
            13108: "Chaîne de production de micropuces",
            13109: "Atelier de montage",
            13110: "Synthétiseur à haut rendement",
            13111: "Production de masse de puces",
            13112: "Nanorobots réparateurs",
            13201: "Technique de catalyse",
            13202: "Moteur à plasma",
            13203: "Module d'optimisation",
            13204: "IA du dépôt",
            13205: "Révision général (chasseur léger)",
            13206: "Chaîne de production automatisée",
            13207: "IA de drone améliorée",
            13208: "Technique de recyclage expérimental",
            13209: "Révision général (croiseur)",
            13210: "Pilote automatique Slingshot",
            13211: "Supraconducteur à haute température",
            13212: "Révision général (vaisseau de bataille)",
            13213: "Intelligence artificielle collective",
            13214: "Révision général (traqueur)",
            13215: "Révision général (bombardier)",
            13216: "Révision général (destructeur)",
            13217: "Technique d'armement expérimental",
            13218: "Renforcement du général des Mechas",
            14101: "Refugium",
            14102: "Condensateur d’antimatière",
            14103: "Salle à vortex",
            14104: "Maison du savoir",
            14105: "Forum de la transcendance",
            14106: "Convecteur d’antimatière",
            14107: "Laboratoire de clonage",
            14108: "Accélérateur par chrysalide",
            14109: "Biomodificateur",
            14110: "Modulateur psionique",
            14111: "Hangar de construction de vaisseau",
            14112: "Supraréfracteur",
            14201: "Récupération de chaleur",
            14202: "Traitement au sulfure",
            14203: "Réseau psionique",
            14204: "Faisceau de traction télékinésique	",
            14205: "Technologie de détection améliorée",
            14206: "Compresseur neuromodal",
            14207: "Neuro-interface",
            14208: "Réseau d'analyse superglobal",
            14209: "Surcadençage (chasseur lourd)",
            14210: "Système de propulsion télékinétique",
            14211: "Sixième sens",
            14212: "Harmonisateur psychique",
            14213: "Efficient Swarm Intelligence",
            14214: "Surcadençage (grand transporteur)",
            14215: "Capteurs gravitationnels",
            14216: "Surcadençage (vaisseau de bataille)",
            14217: "Matrice de protection psionique",
            14218: "Renforcement d'explorateur Kaelesh",
            account_points_repartition: "Répartition des points du compte",
            alliance: "Alliance",
            at: "à",
            buildings: "Bâtiments",
            clear_confirm: "Vous êtes sur le point de supprimer les données d'InfoCompte.",
            crystal: "Cristal",
            daily_productions: "Productions journalières",
            days: "jours",
            defence: "Défense",
            defences: "Défenses",
            deuterium: "Deutérium",
            empire: "Empire",
            empire_of: "Empire du joueur",
            explorer_player_class: "Explorateur",
            export_notification: "Export placé dans le presse-papier",
            facilities: "Installations",
            fleet: "Flotte",
            generated_on: "Généré le",
            highscore: "Classement",
            hours: "heures",
            if_destroyed: "place(s) si détruit",
            indestructible: "Indestructible",
            levels: "Niveaux",
            lifeform1: "Humains",
            lifeform2: "Roctas",
            lifeform3: "Mecas",
            lifeform4: "Kaeleshs",
            lifeform_buildings: "Bâtiments FDV",
            lifeform_buildings_short: "Bâtiments FDV",
            lifeform_researches: "Recherches FDV",
            lifeform_researches_short: "Recherches FDV",
            lifeforms: "Formes de vie",
            lifeform_levels: "Niveaux des FDV",
            lunar_buildings: "Bâtiments lunaires",
            lunar_defences: "Défenses lunaires",
            maximum: "maximum",
            metal: "Métal",
            mines: "Mines",
            mines_only: "Mines seules",
            mines_points: "Points répartis en mines",
            miner_player_class: "Collecteur",
            months: "mois",
            moon: "Lune",
            on: "sur",
            others: "Autres",
            planet: "Planète",
            planet_fields: "Cases planétaires",
            planetary_buildings: "Bâtiments planétaires",
            planetary_defences: "Défenses planétaires",
            planets: "Planètes",
            planets_repartition: "Répartition des points par planète",
            points: "Points",
            production: "Production",
            production_of: "Production du joueur",
            productions: "Productions",
            queue: "File de constructions",
            rates: "Taux de change",
            rentabilities: "Rentabilités",
            research: "Recherche",
            researcher_alliance_class: "Chercheur",
            researches: "Recherches",
            resources: "Ressources",
            shipyards: "Chantiers spatials",
            temperatures_maximum: "Températures maximales",
            total: "Total",
            trader_alliance_class: "Marchand",
            upgrade: "En construction",
            used: "utilisées",
            validate: "Valider",
            warrior_alliance_class: "Guerrier",
            warrior_player_class: "Général",
            weeks: "semaines",
            when_finished: "place(s) quand terminé",
            with: "avec",
            without_dark_matter: "Sans AM",
            years: "années",
            coords: 'Coords'
        },
        pt: {
            1: 'Mina de Metal',
            2: 'Mina de Cristal',
            3: 'Sintetizador de Deutério',
            4: 'Planta Solar',
            12: 'Planta de Fusão',
            14: 'Fábrica de Robots',
            15: 'Fábrica de Nanites',
            21: 'Hangar',
            22: 'Armazém de Metal',
            23: 'Armazém de Cristal',
            24: 'Tanque de Deutério',
            31: 'Laboratório de Pesquisas',
            33: 'Terra-Formador',
            34: 'Depósito de Aliança',
            36: 'Estaleiro Espacial',
            41: 'Base Lunar',
            42: 'Sensor Phalanx',
            43: 'Portal de Salto Quântico',
            44: 'Silo de Mísseis',
            106: 'Tecnologia de Espionagem',
            108: 'Tecnologia de Computadores',
            109: 'Tecnologia de Armas',
            110: 'Tecnologia de Escudo',
            111: 'Tecnologia de Blindagem',
            113: 'Tecnologia de Energia',
            114: 'Tecnologia de Hiperespaço',
            115: 'Motor de Combustão',
            117: 'Motor de Impulsão',
            118: 'Motor Propulsor de Hiperespaço',
            120: 'Tecnologia Laser',
            121: 'Tecnologia de Iões',
            122: 'Tecnologia de Plasma',
            123: 'Rede Intergaláctica de Pesquisas',
            124: 'Astrofísica',
            199: 'Tecnologia de Gravitação',
            202: 'Cargueiro Pequeno',
            203: 'Cargueiro Grande',
            204: 'Caça Ligeiro',
            205: 'Caça Pesado',
            206: 'Cruzador',
            207: 'Nave de Batalha',
            208: 'Nave de Colonização',
            209: 'Reciclador',
            210: 'Sonda de Espionagem',
            211: 'Bombardeiro',
            212: 'Satélite Solar',
            213: 'Destruidor',
            214: 'Estrela da Morte',
            215: 'Interceptor',
            217: 'Rastejador',
            218: 'Ceifeira',
            219: 'Exploradora',
            401: 'Lançador de Mísseis',
            402: 'Laser Ligeiro',
            403: 'Laser Pesado',
            404: 'Canhão de Gauss',
            405: 'Canhão de Iões',
            406: 'Canhão de Plasma',
            407: 'Pequeno Escudo Planetário',
            408: 'Grande Escudo Planetário',
            502: 'Míssil de Intercepção',
            503: 'Míssil Interplanetário',
            11101: 'Setor Residencial',
            11102: 'Quinta de Biosfera',
            11103: 'Centro de Pesquisa',
            11104: 'Academia de Ciências',
            11105: 'Centro de Neurocalibragem',
            11106: 'Fundição de Alta Energia',
            11107: 'Silo de Comida',
            11108: 'Produção com Recurso a Fusão',
            11109: 'Arranha-céus',
            11110: 'Laboratório de Biotecnologia',
            11111: 'Metrópole',
            11112: 'Escudo Planetário',
            11201: 'Emissários Intergaláticos',
            11202: 'High-Performance Extractors',
            11203: 'Motores de Fusão',
            11204: 'Gerador de Campo Furtivo',
            11205: 'Esconderijo Orbital',
            11206: 'IA de Pesquisa',
            11207: 'Terra-Formador de Alto Desempenho',
            11208: 'Tecnologias de Produção Melhoradas',
            11209: 'Caça Ligeiro V2',
            11210: 'Cruiser Mk II',
            11211: 'Improved Lab Technology',
            11212: 'Plasma Terraformer',
            11213: 'Low-Temperature Drives',
            11214: 'Bomber Mk II',
            11215: 'Destructeur Mk II',
            11216: 'Battlecruiser Mk II',
            11217: 'Robot Assistants',
            11218: 'Supercomputer',
            12101: 'Enclave de Meditação',
            12102: 'Quinta de Cristal',
            12103: 'Tecnologium Rúnico',
            12104: 'Forja Rúnica',
            12105: 'Oriktorium',
            12106: 'Forja de Magma',
            12107: 'Câmara de Disrupção',
            12108: 'Megálito',
            12109: 'Refinaria de Cristal',
            12110: 'Sintetizador de Deutério',
            12111: 'Centro de Pesquisa de Minerais',
            12112: 'Centro de Reciclagem Avançada',
            12201: 'Baterias Vulcânicas',
            12202: 'Varrimento Acústico',
            12203: 'Sistemas de Bomba de Alto Desempenho',
            12204: 'Expansão da Baía de Carga (Naves Civis)',
            12205: 'Produção com Recurso a Magma',
            12206: 'Centrais de Energia Geotérmica',
            12207: 'Sonda de Profundidade',
            12208: 'Ion Crystal Enhancement (Heavy Fighter)',
            12209: 'Improved Stellarator',
            12210: 'Hardened Diamond Drill Heads',
            12211: 'Seismic Mining Technology',
            12212: 'Magma-Powered Pump Systems',
            12213: 'Ion Crystal Modules',
            12214: 'Optimised Silo Construction Method',
            12215: 'Diamond Energy Transmitter',
            12216: 'Obsidian Shield Reinforcement',
            12217: 'Rune Shields',
            12218: 'Rock’tal Collector Enhancement',
            13101: 'Linha de Montagem',
            13102: 'Fábrica de Células de Fusão',
            13103: 'Centro de Pesquisa Robótica',
            13104: 'Rede de Atualização',
            13105: 'Centro de Computação Quântica',
            13106: 'Centro de Montagem Automatizado',
            13107: 'Transformador de Alto Desempenho',
            13108: 'Linha de Montagem de Microchips',
            13109: 'Sala de Montagem da Linha de Produção',
            13110: 'Sintetizador de Alto Desempenho',
            13111: 'Produção Massiva de Chips',
            13112: 'Nanorobôs de Reparação',
            13201: 'Tecnologia de Catalisador',
            13202: 'Motor de Plasma',
            13203: 'Módulo de Eficiência',
            13204: 'IA de Depósito',
            13205: 'Remodelação Geral (Caça Ligeiro)',
            13206: 'Linha de Transporte Automatizadas',
            13207: 'Improved Drone AI',
            13208: 'Experimental Recycling Technology',
            13209: 'General Overhaul (Cruiser)',
            13210: 'Slingshot Autopilot',
            13211: 'High-Temperature Superconductors',
            13212: 'General Overhaul (Battleship)',
            13213: 'Artificial Swarm Intelligence',
            13214: 'General Overhaul (Battlecruiser)',
            13215: 'General Overhaul (Bomber)',
            13216: 'General Overhaul (Destroyer)',
            13217: 'Experimental Weapons Technology',
            13218: 'Mechan General Enhancement',
            14101: 'Santuário',
            14102: 'Condensador de Antimatéria',
            14103: 'Câmara de Vortex',
            14104: 'Salões do Conhecimento',
            14105: 'Fórum da Transcendência',
            14106: 'Convetor de Antimatéria',
            14107: 'Laboratório de Clonagem',
            14108: 'Acelerador de Crisálidas',
            14109: 'Biomodificador',
            14110: 'Modulador Psiónico',
            14111: 'Sala de Produção de Naves',
            14112: 'Super-refrator',
            14201: 'Recuperação de Calor',
            14202: 'Processamento de Sulfuretos',
            14203: 'Rede Psiónica',
            14204: 'Feixe de Captura Telecinético',
            14205: 'Tecnologias de Sensores Melhoradas',
            14206: 'Compressor Neuromodular',
            14207: 'Neuro-Interface',
            14208: 'Interplanetary Analysis Network',
            14209: 'Overclocking (Heavy Fighter)',
            14210: 'Telekinetic Drive',
            14211: 'Sixth Sense',
            14212: 'Psychoharmoniser',
            14213: 'Efficient Swarm Intelligence',
            14214: 'Overclocking (Large Cargo)',
            14215: 'Gravitation Sensors',
            14216: 'Overclocking (Battleship)',
            14217: 'Psionic Shield Matrix',
            14218: 'Kaelesh Discoverer Enhancement',
            account_points_repartition: 'Repartição de pontos de conta',
            alliance: 'Aliança',
            at: 'ás',
            buildings: 'Edifícios',
            clear_confirm: 'Vais eliminar os dados do InfoCompte.',
            crystal: 'Cristal',
            daily_productions: 'Produções Diárias',
            days: 'dias',
            defence: 'Defesa',
            defences: 'Defesas',
            deuterium: 'Deutério',
            empire: 'Império',
            empire_of: "Império de",
            explorer_player_class: 'Descobridor',
            export_notification: 'Exportar colocado na área de transferência',
            facilities: 'Instalações',
            fleet: 'Frota',
            generated_on: 'Gerado em',
            highscore: 'Highscore',
            hours: 'horas',
            if_destroyed: 'lugar se destruído',
            indestructible: 'Indestrutível',
            levels: 'Níveis',
            lifeform1: 'Humanos',
            lifeform2: 'Rock’tal',
            lifeform3: 'Mechas',
            lifeform4: 'Kaelesh',
            lifeform_buildings: 'Edifícios de Forma de Vida',
            lifeform_buildings_short: 'Edifícios FdV',
            lifeform_researches: 'Pesquisa de Forma de Vida',
            lifeform_researches_short: 'Pesquisa FdV',
            lifeforms: 'Formas de Vida',
            lifeform_levels: 'Níveis de Forma de Vida',
            lunar_buildings: 'Edifícios Lunares',
            lunar_defences: 'Defesas Lunares',
            maximum: 'Máximo',
            metal: 'Metal',
            mines: 'Minas',
            mines_only: 'Apenas Minas',
            mines_points: 'Pontos de Minas',
            miner_player_class: 'Colecionador',
            months: 'meses',
            moon: 'Lua',
            on: 'em',
            others: 'Outros',
            planet: 'Planeta',
            planet_fields: 'Campos do Planeta',
            planetary_buildings: 'Edifícios Planetários',
            planetary_defences: 'Defesas Planetárias',
            planets: 'Planetas',
            planets_repartition: 'Repartição de pontos por Planetas',
            points: 'Pontos',
            production: 'Produção',
            production_of: "Produção de",
            productions: 'Produções',
            queue: 'Fila de Upgrades',
            rates: 'Taxa de troca:',
            rentabilities: "Rentabilidades",
            research: 'Pesquisa',
            researcher_alliance_class: 'Pesquisadores',
            researches: 'Pesquisas',
            resources: 'Recursos',
            shipyards: 'Hangares',
            temperatures_maximum: 'Temperaturas Máximas',
            total: 'Total',
            trader_alliance_class: 'Comerciantes',
            upgrade: 'Em construção',
            used: 'usado',
            validate: 'Validar',
            warrior_alliance_class: 'Guerreiros',
            warrior_player_class: 'General',
            weeks: 'semanas',
            when_finished: 'lugar quando terminado',
            with: 'com',
            without_dark_matter: 'Sem DM',
            years: 'anos',
            coords: 'Coords'
        }
    };
    return translations[ document.documentElement.lang ] || translations.en;
};

const Formats = new function(){

    const locale = LocalizationStrings.decimalPoint === '.' ? 'en-US' : 'de-DE';
    const number_options = { style: 'decimal', maximumFractionDigits: 2 };
    const percent_options = { style: 'percent', minimumFractionDigits: 2 };
    const padded_percent_options = { style: 'percent', minimumIntegerDigits: 2, minimumFractionDigits: 2 };

    return {
        get_duration_from( value ){
            let unit;
            if( value > 8_760 ){
                value /= 8_760
                unit = Translation.years;
            }else if( value > 732 ){
                value /= 732;
                unit = Translation.months;
            }else if( value > 168 ){
                value /= 168;
                unit = Translation.weeks;
            }else if( value > 24 ){
                value /= 24;
                unit = Translation.days;
            }else{
                unit = Translation.hours;
            }
            return `${ value.toLocaleString( locale, number_options ) } ${ unit }`;
        },
        get_padded_percent_from( value ){
            const string = value.toLocaleString( locale, padded_percent_options );
            return string[0] === '0' ? `<span class="ic-padded-percent">${ string }</span>` : string;
        },
        get_percent_from( value ){
            return value.toLocaleString( locale, percent_options );
        },
        get_number_from( value ){
            return value.toLocaleString( locale, number_options );
        }
    };
};

const AccountPanel = {

    init( data ){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html_from( data );
        document.querySelector( '#middle' ).appendChild( template.content );
    },
    get_html_from( data ){
        const points = data.game.player.points;
        const percents = data.game.player.percents;
        const score = data.game.player.score;
        return `<div id="ic-account-points-component" class="ic-component" data-state="expanded">
						<h3>${ Translation.account_points_repartition }<button></button></h3>
						<div class="ic-component-main">
							<table>
								<tr>
									<th>${ Translation.mines }</th>
									<td>${ Formats.get_number_from( points.mines.total ) } — ${ Formats.get_padded_percent_from( percents.mines.total ) }</td>
								</tr>
								<tr>
									<th>${ Translation.planetary_buildings }</th>
									<td>${ Formats.get_number_from( points.buildings.planetary ) } — ${ Formats.get_padded_percent_from( percents.buildings.planetary ) }</td>
								</tr>
								<tr>
									<th>${ Translation.lunar_buildings }</th>
									<td>${ Formats.get_number_from( points.buildings.lunar ) } — ${ Formats.get_padded_percent_from( percents.buildings.lunar ) }</td>
								</tr>
								<tr>
									<th>${ Translation.lifeform_buildings }</th>
									<td>${ Formats.get_number_from( points.lifeforms.buildings ) } — ${ Formats.get_padded_percent_from( percents.lifeforms.buildings ) }</td>
								</tr>
								<tr>
									<th>${ Translation.lifeform_researches }</th>
									<td>${ Formats.get_number_from( points.lifeforms.researches ) } — ${ Formats.get_padded_percent_from( percents.lifeforms.researches ) }</td>
								</tr>
								<tr>
									<th>${ Translation.research }</th>
									<td>${ Formats.get_number_from( points.research ) } — ${ Formats.get_padded_percent_from( percents.research ) }</td>
								</tr>
								<tr>
									<th>${ Translation.fleet }</th>
									<td>${ Formats.get_number_from( points.fleet ) } — ${ Formats.get_padded_percent_from( percents.fleet ) }</td>
								</tr>
								<tr>
									<th>${ Translation.defence }</th>
									<td>${ Formats.get_number_from( points.defence ) } — ${ Formats.get_padded_percent_from( percents.defence ) }</td>
								</tr>
								<tr>
									<th>${ Translation.indestructible }</th>
									<td>
										<div>${ Formats.get_number_from( points.indestructible ) } — ${ Formats.get_padded_percent_from( percents.indestructible ) }</div>
										<div>- ${ score.if_destroyed } ${ Translation.if_destroyed }</div>
									</td>
								</tr>
								<tr>
									<th>${ Translation.upgrade }</th>
									<td>
										<div>${ Formats.get_number_from( points.upgrade ) } — ${ Formats.get_padded_percent_from( percents.upgrade ) }</div>
										<div>+ ${ score.when_finished } ${ Translation.when_finished }</div>
									</td>
								</tr>
							</table>
							${ PieChart.get_html_from( this.get_chart_data_from( data ) ) }
						</div>
					</div>`;
    },
    get_chart_data_from( data ){
        const percents = data.game.player.percents;
        return [
            [ Colors.mines, percents.mines.total ],
            [ Colors.planetary_buildings, percents.buildings.planetary ],
            [ Colors.lunar_buildings, percents.buildings.lunar ],
            [ Colors.lifeform_buildings, percents.lifeforms.buildings ],
            [ Colors.lifeform_researches, percents.lifeforms.researches ],
            [ Colors.research, percents.research ],
            [ Colors.fleet, percents.fleet ],
            [ Colors.defence, percents.defence ]
        ];
    }
};

const ClearButton = {

    get_html(){
        return '<button id="ic-clear-button" class="ic-outline-button">Reset</button>';
    },
    set_event_listeners(){
        document.querySelector( '#ic-clear-button' ).addEventListener( 'click', function(){
            if( confirm( Translation.clear_confirm ) ){
                Storage.clear();
                window.location.reload();
            }
        } );
    }
};

const Colors = {
    primary: '#6f9fc8',
    metal: '#a9a9a9',
    crystal: '#8dceec',
    deuterium: '#6cc6a3',
    mines: '#eb782d',
    planetary_buildings: '#9c3d00',
    lunar_buildings: '#83919c',
    lifeform_buildings: '#800080',
    lifeform_researches: '#ee82ee',
    research: '#0077b6',
    fleet: '#e30613',
    defence: '#16bd05',
    crawlers: '#eb782d'
};

const Data = {

    get(){
        const result = Storage.get();
        this.set_positions_to( result );
        this.set_researches_to( result );
        return result;
    },
    get_from( storage, interface ){
        const result = this.reduce( storage, interface );
        this.clean( storage, interface, result );
        this.set_positions_to( result );
        this.set_researches_to( result );
        this.set_costs_to( result );
        this.set_points_to( result );
        this.set_percents_to( result );
        this.set_productions_to( result );
        this.set_highscore_to( result );
        result.script ||= {};
        return result;
    },
    reduce( ...objects ){
        const result = {};
        for( const object of objects ){
            for( const key in object ){
                if( typeof result[ key ] === 'object' && typeof object[ key ] === 'object' ){
                    const value = this.reduce( result[ key ], object[ key ] );
                    result[ key ] = value;
                }else result[ key ] = object[ key ]
            }
        }
        return result;
    },
    clean( storage, interface, result ){
        const storage_positions = storage.game?.player.positions || {};
        const interface_positions = interface.game.player.positions;
        const result_positions = result.game.player.positions;
        for( const coordinates in storage_positions ){
            const interface_position = interface_positions[ coordinates ];
            if( currentPage === 'empire' ){
                if( !interface_position ){
                    if( planetType === 0 ) delete result_positions[ coordinates ];
                    else delete result_positions[ coordinates ].moon;
                }
            }else{
                if( !interface_position ) delete result_positions[ coordinates ];
                else if( !interface_position.moon ) delete result_positions[ coordinates ].moon;
            }
        }
    },
    set_positions_to( data ){
        const player = data.game.player;
        player.positions = new Positions( player.positions );
    },
    set_researches_to( data ){
        const player = data.game.player;
        player.researches = new Researches( player.researches );
    },
    set_costs_to( data ){

        function get_buildings_from( data ){
            const positions = data.game.player.positions;
            const planetary = positions.get_planetary_building_cost_from();
            const lunar = positions.get_lunar_building_cost_from();
            const total = planetary + lunar;
            return {
                planetary,
                lunar,
                total
            };
        }
        function get_defence_from( data ){
            return data.game.player.positions.get_defence_cost_from();
        }
        function get_destructible_from( data ){
            return data.game.player.positions.get_destructible_cost_from();
        }
        function get_lifeforms_from( data ){
            const positions = data.game.player.positions;
            const buildings = positions.get_lifeform_buildings_cost_from();
            const researches = positions.get_lifeform_researches_cost_from();
            const total = buildings + researches;
            return {
                buildings,
                researches,
                total
            };
        }
        function get_mines_from( data ){
            const positions = data.game.player.positions;
            return {
                metal: positions.get_metal_mine_cost_from(),
                crystal: positions.get_crystal_mine_cost_from(),
                deuterium: positions.get_deuterium_mine_cost_from(),
                total: positions.get_mine_cost_from()
            };
        }
        function get_research_from( data ){
            return data.game.player.researches.get_cost_from();
        }
        function get_upgrade_from( data ){
            const positions = data.game.player.positions;
            const researches = data.game.player.researches;
            return positions.get_upgrade_cost_from() + researches.get_upgrade_cost_from();
        }
        function get_without_fleet( data ){
            const positions = data.game.player.positions.get_without_fleet_cost_from();
            const researches = data.game.player.researches.get_cost_from();
            return positions + researches;
        }
        function get_positions_from( data ){
            const positions = data.game.player.positions;
            const result = {};
            for( const coordinates in positions ){
                const { planet, moon } = positions[ coordinates ];
                result[ coordinates ] = {
                    planet: {
                        mines: planet.get_mine_cost_from(),
                        buildings: planet.get_building_cost_from(),
                        lifeforms: {
                            buildings: planet.get_lifeform_buildings_cost_from(),
                            researches: planet.get_lifeform_researches_cost_from()
                        },
                        defence: planet.get_defence_cost_from(),
                        total: planet.get_static_cost_from()
                    }
                };
                if( moon ){
                    result[ coordinates ].moon = {
                        buildings: moon.get_building_cost_from(),
                        defence: moon.get_defence_cost_from(),
                        total: moon.get_static_cost_from()
                    };
                }
            }
            return result;
        }

        data.game.player.costs = {
            buildings: get_buildings_from( data ),
            defence: get_defence_from( data ),
            destructible: get_destructible_from( data ),
            lifeforms: get_lifeforms_from( data ),
            mines: get_mines_from( data ),
            research: get_research_from( data ),
            upgrade: get_upgrade_from( data ),
            without_fleet: get_without_fleet( data ),
            positions: get_positions_from( data )
        };
    },
    set_points_to( data ){

        function get_from( costs ){
            const result = {};
            for( const key in costs ){
                const value = costs[ key ];
                if( typeof value === 'object' ) result[ key ] = get_from( value );
                else result[ key ] = Math.floor( value * .001 );
            }
            return result;
        }

        const total = data.game.player.score?.points;
        if( total ){
            const costs = data.game.player.costs;
            const result = get_from( costs );
            result.fleet = total - Math.floor( costs.without_fleet * .001 );
            result.indestructible = total - ( Math.floor( costs.destructible * .001 ) + result.fleet );
            result.upgraded = total + result.upgrade;
            result.total = total;
            data.game.player.points = result;
        }
    },
    set_percents_to( data ){

        function get_from( points, total ){
            const result = {};
            for( const key in points ){
                const value = points[ key ];
                if( typeof value === 'object' ) result[ key ] = get_from( value, total );
                else result[ key ] = value / total;
            }
            return result;
        }

        const total = data.game.player.score?.points;
        if( total ){
            const points = data.game.player.points;
            data.game.player.percents = get_from( points, total );
        }
    },
    set_productions_to( data ){

        function get_mines_from( data ){
            const positions = data.game.player.positions;
            let metal = 0;
            let crystal = 0;
            let deuterium = 0;
            let points;
            for( const coordinates in positions ){
                const productions = positions[ coordinates ].planet.productions;
                if( productions ){
                    metal += productions.mines.metal;
                    crystal += productions.mines.crystal;
                    deuterium += productions.mines.deuterium;
                }
            }
            metal = Math.floor( metal * 24 );
            crystal = Math.floor( crystal * 24 );
            deuterium = Math.floor( deuterium * 24 );
            points = Math.floor( ( metal + crystal + deuterium ) * .001 );
            return {
                metal,
                crystal,
                deuterium,
                points
            };
        }
        function get_lifeforms_from( data ){
            const positions = data.game.player.positions;
            let metal = 0;
            let crystal = 0;
            let deuterium = 0;
            let points;
            for( const coordinates in positions ){
                const productions = positions[ coordinates ].planet.productions;
                if( productions ){
                    const basic = productions.basic;
                    const mines = productions.mines;
                    const fusion = productions.fusion;
                    const crawlers = productions.crawlers;
                    const plasma = productions.plasma;
                    const objects = productions.objects;
                    const geologist = productions.geologist;
                    const officers = productions.officers;
                    const classes = productions.classes;
                    const total = productions.total;
                    const without_lifeform_metal = basic.metal + mines.metal + crawlers.metal + plasma.metal + objects.metal + geologist.metal + officers.metal + classes.player.metal + classes.alliance.metal;
                    const without_lifeform_crystal = basic.crystal + mines.crystal + crawlers.crystal + plasma.crystal + objects.crystal + geologist.crystal + officers.crystal + classes.player.crystal + classes.alliance.crystal;
                    const without_lifeform_deuterium = mines.deuterium + fusion.deuterium + crawlers.deuterium + plasma.deuterium + objects.deuterium + geologist.deuterium + officers.deuterium + classes.player.deuterium + classes.alliance.deuterium;
                    metal += total.metal - without_lifeform_metal;
                    crystal += total.crystal - without_lifeform_crystal;
                    deuterium += total.deuterium - without_lifeform_deuterium;
                }
            }
            metal = Math.max( 0,  Math.floor( metal * 24 ) );
            crystal = Math.max( 0, Math.floor( crystal * 24 ) );
            deuterium = Math.max( 0, Math.floor( deuterium * 24 ) );
            points = Math.floor( ( metal + crystal + deuterium ) * .001 );
            return {
                metal,
                crystal,
                deuterium,
                points
            };
        }
        function get_free_from( data ){
            const crawlers_rate = document.querySelector( `#officers a.on.geologist` ) ? .1 : 0;
            const positions = data.game.player.positions;
            let metal = 0;
            let crystal = 0;
            let deuterium = 0;
            let points;
            for( const coordinates in positions ){
                const productions = positions[ coordinates ].planet.productions;
                if( productions ){
                    const crawlers = productions.crawlers;
                    const objects = productions.objects;
                    const geologist = productions.geologist;
                    const officers = productions.officers;
                    const paid_metal = crawlers.metal * crawlers_rate + objects.metal + geologist.metal + officers.metal;
                    const paid_crystal = crawlers.crystal * crawlers_rate + objects.crystal + geologist.crystal + officers.crystal;
                    const paid_deuterium = crawlers.deuterium * crawlers_rate + objects.deuterium + geologist.deuterium + officers.deuterium;
                    metal += productions.total.metal - paid_metal;
                    crystal += productions.total.crystal - paid_crystal;
                    deuterium += productions.total.deuterium - paid_deuterium;
                }
            }
            metal = Math.floor( metal * 24 );
            crystal = Math.floor( crystal * 24 );
            deuterium = Math.floor( deuterium * 24 );
            points = Math.floor( ( metal + crystal + deuterium ) * .001 );
            return {
                metal,
                crystal,
                deuterium,
                points
            };
        }
        function get_total_from( data ){
            const positions = data.game.player.positions;
            let metal = 0;
            let crystal = 0;
            let deuterium = 0;
            let points;
            for( const coordinates in positions ){
                const productions = positions[ coordinates ].planet.productions;
                if( productions ){
                    const total = productions.total;
                    metal += total.metal;
                    crystal += total.crystal;
                    deuterium += total.deuterium;
                }
            }
            metal = Math.floor( metal * 24 );
            crystal = Math.floor( crystal * 24 );
            deuterium = Math.floor( deuterium * 24 );
            points = Math.floor( ( metal + crystal + deuterium ) * .001 );
            return {
                metal,
                crystal,
                deuterium,
                points
            };
        }

        data.game.player.productions = {
            mines: get_mines_from( data ),
            lifeforms: get_lifeforms_from( data ),
            free: get_free_from( data ),
            total: get_total_from( data )
        };
    },
    set_highscore_to( data ){
        const score = data.game.player.score;
        if( score ){
            const highscores = data.game.universe.highscores;
            const points = data.game.player.points;
            const position = score.position;
            score.if_destroyed = 0;
            score.when_finished = 0;
            for( const key in highscores ){
                const value = highscores[ key ];
                if( value < points.indestructible ){
                    score.if_destroyed = parseInt( key ) - 1 - position;
                    break;
                }
            }
            if( points.upgrade ){
                for( const key in highscores ){
                    const value = highscores[ key ];
                    if( value < points.upgraded ){
                        score.when_finished = position - parseInt( key );
                        break;
                    }
                }
            }
        }
    }
};

const EmpireTextExport = {

    get_from( data ){
        return	this.get_header_from( data ) +
            TextExport.get_classes_from( data ) +
            this.get_points_from( data ) +
            this.get_productions_from( data ) +
            this.get_temperatures_from( data ) +
            this.get_planet_fields_from( data ) +
            this.get_planetary_buildings_from( data ) +
            this.get_lunar_buildings_from( data ) +
            this.get_researches_from( data ) +
            TextExport.get_lifeform_levels_from( data ) +
            this.get_fleet_from( data ) +
            this.get_planetary_defence_from( data ) +
            this.get_lunar_defence_from( data );
    },
    get_header_from( data ){
        const title = TextExport.get_title_from( `${ Translation.empire_of } ${ data.game.player.name } ${ Translation.on } ${ data.game.universe.name }.${ data.game.universe.language }` );
        const stamp = TextExport.get_stamp();
        return title + stamp + '\n';
    },
    get_points_from( data ){
        const heading = TextExport.get_heading_from( Translation.account_points_repartition );
        const points = data.game.player.points;
        const percents = data.game.player.percents;
        const mines_points = TextExport.get_colored_from( Formats.get_number_from( points.mines.total ), Colors.primary );
        const planetary_buildings_points = TextExport.get_colored_from( Formats.get_number_from( points.buildings.planetary ), Colors.primary );
        const lunar_buildings_points = TextExport.get_colored_from( Formats.get_number_from( points.buildings.lunar ), Colors.primary );
        const lifeform_buildings_points = TextExport.get_colored_from( Formats.get_number_from( points.lifeforms.buildings ), Colors.primary );
        const lifeform_researches_points = TextExport.get_colored_from( Formats.get_number_from( points.lifeforms.researches ), Colors.primary );
        const research_points = TextExport.get_colored_from( Formats.get_number_from( points.research ), Colors.primary );
        const fleet_points = TextExport.get_colored_from( Formats.get_number_from( points.fleet ), Colors.primary );
        const defence_points = TextExport.get_colored_from( Formats.get_number_from( points.defence ), Colors.primary );
        const total_points = TextExport.get_colored_from( Formats.get_number_from( points.total ), Colors.primary );
        const mines_percent = Formats.get_percent_from( percents.mines.total );
        const planetary_buildings_percent = Formats.get_percent_from( percents.buildings.planetary );
        const lunar_buildings_percent = Formats.get_percent_from( percents.buildings.lunar );
        const lifeform_buildings_percent = Formats.get_percent_from( percents.lifeforms.buildings );
        const lifeform_researches_percent = Formats.get_percent_from( percents.lifeforms.researches );
        const research_percent = Formats.get_percent_from( percents.research ) ;
        const fleet_percent = Formats.get_percent_from( percents.fleet );
        const defence_percent = Formats.get_percent_from( percents.defence );
        const indestructible_percent = Formats.get_percent_from( percents.indestructible );
        return	heading +
            `${ Translation.mines } : ${ mines_points } · ${ mines_percent }\n` +
            `${ Translation.planetary_buildings } : ${ planetary_buildings_points } · ${ planetary_buildings_percent }\n` +
            `${ Translation.lunar_buildings } : ${ lunar_buildings_points } · ${ lunar_buildings_percent }\n` +
            `${ Translation.lifeform_buildings } : ${ lifeform_buildings_points } · ${ lifeform_buildings_percent }\n` +
            `${ Translation.lifeform_researches } : ${ lifeform_researches_points } · ${ lifeform_researches_percent }\n` +
            `${ Translation.researches } : ${ research_points } · ${ research_percent }\n` +
            `${ Translation.fleet } : ${ fleet_points } · ${ fleet_percent }\n` +
            `${ Translation.defence } : ${ defence_points } · ${ defence_percent }\n` +
            `${ Translation.total } : ${ total_points } · ${ indestructible_percent } ${ Translation.indestructible }\n\n`;
    },
    get_productions_from( data ){
        const heading = TextExport.get_heading_from( Translation.daily_productions );
        const total = data.game.player.productions.total;
        const metal = Formats.get_number_from( total.metal );
        const crystal = Formats.get_number_from( total.crystal );
        const deuterium = Formats.get_number_from( total.deuterium );
        return	heading +
            `${ Translation.metal } : ${ TextExport.get_colored_from( metal, Colors.primary ) }\n` +
            `${ Translation.crystal } : ${ TextExport.get_colored_from( crystal, Colors.primary ) }\n` +
            `${ Translation.deuterium } : ${ TextExport.get_colored_from( deuterium, Colors.primary ) }\n\n`;
    },
    get_temperatures_from( data ){
        const heading = TextExport.get_heading_from( Translation.temperatures_maximum );
        const positions = data.game.player.positions;
        const values = [];
        for( const coordinates in positions ){
            const position = positions[ coordinates ];
            values.push( position.planet.temperatures.max );
        }
        const average = this.get_average_from( values ) + ' Ø';
        return	heading +
            `${ values.join( ', ' ) } · ${ TextExport.get_colored_from( average, Colors.primary ) }\n\n`;
    },
    get_planet_fields_from( data ){
        const heading = TextExport.get_heading_from( Translation.planet_fields );
        const positions = data.game.player.positions;
        const maximum = [];
        const used = [];
        for( const coordinates in positions ){
            const fields = positions[ coordinates ].planet.fields;
            maximum.push( fields.maximum );
            used.push( fields.used );
        }
        const maximum_padded = maximum.map( value => TextExport.get_padding_from( value, 3 ) + value );
        const used_padded = used.map( value => TextExport.get_padding_from( value, 3 ) + value );
        const maximum_average = this.get_average_from( maximum ) + ' Ø';
        const used_average = this.get_average_from( used ) + ' Ø';
        return	heading +
            `${ used_padded.join( ', ' ) } · ${ TextExport.get_colored_from( used_average, Colors.primary ) } ${ Translation.used }\n` +
            `${ maximum_padded.join( ', ' ) } · ${ TextExport.get_colored_from( maximum_average, Colors.primary ) } ${ Translation.maximum }\n\n`;
    },
    get_planetary_buildings_from( data ){
        const heading = TextExport.get_heading_from( Translation.planetary_buildings );
        const content = this.get_technologies_from( data, 'planet', Building, 2 );
        return content ? heading + content + '\n' : '';
    },
    get_lunar_buildings_from( data ){
        const heading = TextExport.get_heading_from( Translation.lunar_buildings );
        const content = this.get_technologies_from( data, 'moon', Building, 2 );
        return content ? heading + content  + '\n': '';
    },
    get_researches_from( data ){
        const heading = TextExport.get_heading_from( Translation.researches );
        const researches = data.game.player.researches;
        let content = '';
        for( const key in researches ){
            const research = researches[ key ];
            let value;
            let color;
            if( research.upgrade ){
                value = research.upgraded;
                color = 'gold';
            }else{
                value = research.value;
                color = Colors.primary;
            }
            content += Translation[ key ] + ' : ' + TextExport.get_colored_from( value, color ) + '\n';
        }
        return content ? heading + content + '\n' : '';
    },
    get_fleet_from( data ){
        const heading = TextExport.get_heading_from( Translation.fleet );
        const positions = data.game.player.positions;
        const values = {};
        const upgraded = {};
        let content = '';
        for( const coordinates in positions ){
            const { planet, moon } = positions[ coordinates ];
            const technologies = Object.values( planet.technologies );
            if( moon ) technologies.push( ...Object.values( moon.technologies ) );
            for( const technology of technologies ){
                if( technology instanceof Ship ){
                    values[ technology.id ] ||= 0;
                    values[ technology.id ] += technology.upgraded;
                    upgraded[ technology.id ] += technology.upgrade ? true : false;
                }
            }
        }
        for( const key in values ){
            const value = values[ key ];
            if( value ){
                const color = upgraded[ key ] ? 'gold' : Colors.primary;
                content += `${ Translation[ key ] } : ${ TextExport.get_colored_from( Formats.get_number_from( value ), color ) }\n`;
            }
        }
        return content ? heading + content + '\n' : '';
    },
    get_planetary_defence_from( data ){
        const heading = TextExport.get_heading_from( Translation.planetary_defences );
        const content = this.get_technologies_from( data, 'planet', Defence, 8 );
        return content ? heading + content + '\n' : '';
    },
    get_lunar_defence_from( data ){
        const heading = TextExport.get_heading_from( Translation.lunar_defences );
        const content = this.get_technologies_from( data, 'moon', Defence, 8 );
        return content ? heading + content + '\n' : '';
    },
    get_technologies_from( data, body, type, digits ){
        const positions = data.game.player.positions;
        const rows = {};
        let result = '';
        for( const coordinates in positions ){
            const position = positions[ coordinates ];
            if( position[ body ] ){
                for( const key in position[ body ].technologies ){
                    const technology = position[ body ].technologies[ key ];
                    if( technology instanceof type ){
                        rows[ technology.id ] ||= [];
                        rows[ technology.id ].push( technology );
                    }
                }
            }
        }
        for( const key in rows ){
            const row = rows[ key ];
            let total = 0;
            for( let i = 0; i < row.length; i++ ){
                const technology = row[ i ];
                if( technology.upgrade ){
                    const value = technology.upgraded;
                    row[ i ] = TextExport.get_padding_from( value, digits ) + TextExport.get_colored_from( value, 'gold' );
                    total += value;
                }else{
                    const value = technology.value;
                    row[ i ] = TextExport.get_padding_from( value, digits ) + value;
                    total += value;
                }
            }
            if( total ){
                result += `${ row.join( ', ' ) } · ${ TextExport.get_colored_from( Formats.get_number_from( total ), Colors.primary ) } ${ Translation[ key ] }\n`;
            }
        }
        return result;
    },
    get_sum_from( array ){
        return array.reduce( ( previous, current ) => previous + current, 0 );
    },
    get_average_from( array ){
        return Math.round( this.get_sum_from( array ) / array.length );
    }
};

const EnergyWarnings = {

    init( data ){
        const warnings = data.script.warnings ||= {};
        const id = document.head.querySelector( 'meta[name=ogame-planet-id]' ).content;
        if( document.querySelector( '#resources_energy.overmark' ) ) warnings[ id ] = true;
        else warnings[ id ] = false;
        for( const key in warnings ){
            if( warnings[ key ] ){
                const element = document.querySelector( `#planet-${ key } .planet-name` );
                element.classList.add( 'ic-warning' );
            }
        }
    }
};

const Exports = {

    get_html(){
        return `<div id="ic-exports-component">
						<form>
							<button id="ic-empire-export-button" class="ic-button">${ Translation.empire }</button>
							<button id="ic-production-export-button" class="ic-button">${ Translation.production }</button>
							<label><input type="radio" name="export" disabled>Image</label>
							<label><input type="radio" name="export" checked>Text</label>
							<label><input type="checkbox" checked>BBCode</label>
						</form>
						<div id="ic-export-notification">${ Translation.export_notification }</div>
					</div>`;
    },
    set_event_listeners( data ){
        document.querySelector( '#ic-exports-component form' ).addEventListener( 'submit', event => event.preventDefault() );
        document.querySelector( '#ic-empire-export-button' ).addEventListener( 'click', _ => this.export_empire( data ) );
        document.querySelector( '#ic-production-export-button' ).addEventListener( 'click', _ => this.export_production( data ) );
    },
    export_empire( data ){
        this.export_text_from( EmpireTextExport.get_from( data ) );
    },
    export_production( data ){
        this.export_text_from( ProductionTextExport.get_from( data ) );
    },
    export_text_from( content ){
        const element = document.querySelector( '#ic-exports-component [type="checkbox"]' );
        if( !element.checked ) content = content.replace( /\[\/?[^\]]*\]/g, '' );
        navigator.clipboard.writeText( content );
        this.animate();
    },
    async animate(){
        const form = document.querySelector( '#ic-exports-component form' );
        const notification = document.querySelector( '#ic-export-notification' );
        await form.animate( { opacity: 0 }, 250 ).finished;
        form.style.display = 'none';
        notification.style.display = 'flex';
        await notification.animate( { opacity: [ 0, 1 ] }, 250 ).finished;
        await notification.animate( { opacity: [ 1, 0 ] }, { delay: 1500, duration: 500 } ).finished;
        notification.style.display = 'none';
        form.style.display = 'flex';
        form.animate( { opacity: [ 0, 1 ] }, 500 );
    }
};

const Footer = {

    init( data ){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html();
        document.querySelector( '#middle' ).appendChild( template.content );
        this.set_event_listeners( data );
    },
    get_html(){
        return  `<footer id="ic-footer">
						${ Exports.get_html() }
						${ ClearButton.get_html() }
					</footer>`;
    },
    set_event_listeners( data ){
        Exports.set_event_listeners( data );
        ClearButton.set_event_listeners();
    }
};

const Highscore = {

    async init(){
        const selector = '#stat_list_content';
        await Interface.element_change( selector );
        await Interface.element_change( selector );
        const data = Storage.get();
        Interface.set_highscores_to( data );
        Storage.set( data );
    }
};

const Interface = {

    async get(){
        const data = {};
        this.set_meta_to( data );
        if( currentPage !== 'empire' ){
            this.set_positions_to( data );
            this.set_class_to( data );
            this.set_lifeform_to( data );
            this.set_officers_to( data );
            if( currentPage === 'alliance' ) await this.set_alliance_to( data );
            else if( currentPage === 'highscore' ) this.set_highscores_to( data );
            else if( currentPage === 'lfsettings' ) this.set_lifeforms_to( data );
            else if( currentPage === 'overview' ) this.set_overview_to( data );
            else if( currentPage === 'resourceSettings' ||
                currentPage === 'resourcesettings' ) this.set_productions_to( data );
            else if( currentPage === 'defenses' ||
                currentPage === 'facilities' ||
                currentPage === 'fleetdispatch' ||
                currentPage === 'lfbuildings' ||
                currentPage === 'lfresearch' ||
                currentPage === 'research' ||
                currentPage === 'shipyard' ||
                currentPage === 'supplies' ) this.set_technologies_to( data );
        }else await this.set_empire_to( data );
        return data;
    },
    async set_alliance_to( data ){
        await this.element_exist( '#allyData' );
        const classes = document.querySelector( '.alliance_class' ).classList;
        const alliance = data.game.player.alliance = {};
        alliance.class = null;
        for( const key of [ 'trader', 'warrior', 'explorer' ] ){
            if( classes.contains( key ) ){
                alliance.class = key;
                break;
            }
        }
    },
    async set_empire_to( data ){

        function get_coordinates_from( element ){
            const text = element.querySelector( '.planetData :first-child li:first-child' ).textContent;
            return text.replaceAll( ':', '.' ).slice( 1, -1 );
        }
        function get_body_from( element ){

            function get_name_from( element ){
                return element.querySelector( '.planetname' ).textContent;
            }
            function get_fields_from( element ){
                const values = element.querySelector( '.fields' ).textContent.match( /\d+/g );
                return {
                    used: parseInt( values[0] ),
                    maximum: parseInt( values[1] )
                };
            }
            function get_temperatures_from( element ){
                const values = element.querySelector( '.planetDataBottom' ).textContent.match( /-?\d+/g );
                return {
                    min: parseInt( values[0] ),
                    max: parseInt( values[1] )
                };
            }

            const elements = element.querySelectorAll( '.values:not( .items, .resources, .storage, .research ) > div' );

            return {
                name: get_name_from( element ),
                fields: get_fields_from( element ),
                temperatures: get_temperatures_from( element ),
                technologies: get_technologies_from( elements )
            };
        }
        function get_researches(){
            const elements = document.querySelector( '.planet:not( .summary )' ).querySelectorAll( '.research > div' );
            return get_technologies_from( elements );
        }
        function get_technologies_from( elements ){

            function get_unit_from( element ){
                const id = parseInt( element.classList[0] );
                const value = parseInt( element.childNodes[0].textContent.replaceAll( LocalizationStrings.thousandSeperator, '' ) );
                let upgrade = 0;
                for( const node of element.querySelectorAll( '.active, .loop' ) ){
                    const text = node.textContent.replaceAll( LocalizationStrings.thousandSeperator, '' );
                    upgrade += parseInt( text );
                }
                return {
                    id,
                    value,
                    upgrade
                };
            }

            function get_upgradable_from( element ){
                const id = parseInt( element.classList[0] );
                const value = parseInt( element.childNodes[0].textContent.replaceAll( LocalizationStrings.thousandSeperator, '' ) );
                let upgrade = 0;
                for( const node of element.querySelectorAll( '.active, .loop' ) ){
                    const text = node.textContent.replaceAll( LocalizationStrings.thousandSeperator, '' );
                    if( Math.max( 0, parseInt( text ) - value ) > 0 ) upgrade++;
                }
                return {
                    id,
                    value,
                    upgrade
                };
            }

            const result = {};
            for( const element of elements ){
                const id = parseInt( element.classList[0] );
                const is_unit = id > 200 && id < 600;
                result[ id ] = is_unit ? get_unit_from( element ) : get_upgradable_from( element );
            }
            return result;
        }

        await this.element_exist( '.planetWrapper' );
        const body = planetType === 0 ? 'planet' : 'moon';
        const positions = data.game.player.positions = {};
        data.game.player.researches = get_researches();
        for( const node of document.querySelectorAll( '.planet:not( .summary )' ) ){
            const coordinates = get_coordinates_from( node );
            const position = positions[ coordinates ] = {};
            position[ body ] = get_body_from( node );
        }
    },
    set_class_to( data ){
        const player = data.game.player;
        player.class = null;
        for( const key of [ 'miner', 'warrior', 'explorer' ] ){
            if( document.querySelector( `#characterclass .${ key }` ) ){
                player.class = key;
                break;
            }
        }
    },
    set_highscores_to( data ){
        if( currentCategory === 1 && currentType === 0 ){
            const highscores = data.game.universe.highscores ||= {};
            for( const node of document.querySelectorAll( '#ranks tr[ id ]' ) ){
                const position = parseInt( node.querySelector( '.position' ).textContent );
                const points = parseInt( node.querySelector( '.score' ).firstChild.textContent.replaceAll( LocalizationStrings.thousandSeperator, '' ) ); // firstChild used for OGLight compatibility
                highscores[ position ] = points;
            }
        }
    },
    set_lifeform_to( data ){
        const coordinates = data.game.interface.current_coordinates;
        const planet = data.game.player.positions[ coordinates ].planet;
        planet.lifeform = null;
        for( const key of [ 'lifeform1', 'lifeform2', 'lifeform3', 'lifeform4' ] ){
            if( document.querySelector( `#lifeform .${ key }` ) ){
                planet.lifeform = key;
                break;
            }
        }
    },
    set_lifeforms_to( data ){
        const lifeforms = data.game.player.lifeforms = {};
        for( const node of document.querySelectorAll( '.lifeform-item' ) ){
            const id = node.querySelector( '.lifeform-item-icon' ).classList[1];
            const values = node.querySelector( '.lifeform-item-wrapper p:nth-last-of-type(2)' ).textContent.match( /\d+/g );
            lifeforms[ id ] = {
                level: parseInt( values[0] ),
                xp: {
                    current: parseInt( values[1] ),
                    maximum: parseInt( values[2] )
                }
            };
        }
    },
    set_meta_to( data ){
        data.game = {
            interface: {
                current_body_type: document.head.querySelector( 'meta[name=ogame-planet-type]' ).content,
                current_coordinates: document.head.querySelector( 'meta[name=ogame-planet-coordinates]' ).content.replaceAll( ':', '.' )
            },
            player: {
                id: parseInt( document.head.querySelector( 'meta[name=ogame-player-id]' ).content ),
                name: document.head.querySelector( 'meta[name=ogame-player-name]' ).content
            },
            universe: {
                economy_speed: parseInt( document.head.querySelector( 'meta[name=ogame-universe-speed]' ).content ),
                language: document.head.querySelector( 'meta[name=ogame-language]' ).content,
                name: document.head.querySelector( 'meta[name=ogame-universe-name]' ).content
            }
        }
    },
    set_officers_to( data ){
        const officers = data.game.player.officers = {};
        officers.all = true;
        for( const key of [ 'commander', 'admiral', 'engineer', 'geologist', 'technocrat' ] ){
            const element = document.querySelector( `#officers a.on.${ key }` );
            if( element ) officers[ key ] = true;
            else officers[ key ] = officers.all = false;
        }
    },
    set_overview_to( data ){

        function get_name(){
            return document.head.querySelector( 'meta[name=ogame-planet-name]' ).content;
        }

        function get_fields_from( text ){
            const values = text.match( /\d+/g );
            return {
                used: parseInt( values[2] ),
                maximum: parseInt( values[3] )
            };
        }

        function get_temperatures_from( text ){
            const values = text.replaceAll( /\\.{5}/g, '' ).match( /-?\d+/g );
            return {
                min: parseInt( values[1] ),
                max: parseInt( values[2] )
            };
        }

        function get_score_from( text ){
            const values = text.match( /\d+/g );
            return {
                points: parseInt( values[2] ),
                position: parseInt( values[3] )
            };
        }

        const text = document.querySelector( '#overviewcomponent > script:nth-child(2)' ).textContent;
        const rows = text.replaceAll( LocalizationStrings.thousandSeperator, '' ).split( '\n' );
        const position = data.game.player.positions[ data.game.interface.current_coordinates ];
        data.game.player.score = get_score_from( rows[20] );
        position[ data.game.interface.current_body_type ] = {
            name: get_name(),
            fields: get_fields_from( rows[14] ),
            temperatures: get_temperatures_from( rows[16] )
        };
    },
    set_positions_to( data ){
        const positions = data.game.player.positions = {};
        for( const node of document.querySelectorAll( '#planetList .smallplanet' ) ){
            const coordinates = node.querySelector( '.planet-koords' ).textContent.replaceAll( ':', '.' ).slice( 1, -1 );
            const has_moon = node.querySelector( '.moonlink' );
            const position = parseInt( coordinates.split( '.' )[2] );
            positions[ coordinates ] = {
                planet: { position },
                moon: has_moon ? { position } : null
            };
        }
    },
    set_productions_to( data ){

        function get_value_from( element ){
            const title = element.querySelector( 'span' ).title;
            const text = title.replaceAll( LocalizationStrings.thousandSeperator, '' ).replace( LocalizationStrings.decimalPoint, '.' );
            return parseFloat( text );
        }

        function get_factor_from( element ){
            // alternative drop downs management
            const value = element.querySelector( 'a' )?.dataset.value || element.querySelector( 'option:checked' )?.value;
            return parseInt( value ) * .01;
        }

        const element = document.querySelector( '.listOfResourceSettingsPerPlanet' );
        const position = data.game.player.positions[ data.game.interface.current_coordinates ];
        position[ data.game.interface.current_body_type ].productions = {
            basic: {
                metal: get_value_from( element.querySelector( 'tr.alt :nth-child(2)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.alt :nth-child(3)' ) )
            },
            mines: {
                metal: get_value_from( element.querySelector( 'tr.\\31  :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\32  :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\33  :nth-child(5)' ) )
            },
            fusion: {
                deuterium: get_value_from( element.querySelector( 'tr.\\31 2  :nth-child(5)' ) ),
                factor: get_factor_from( element.querySelector( 'tr.\\31 2' ) )
            },
            crawlers: {
                metal: get_value_from( element.querySelector( 'tr.\\32 17 :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\32 17 :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\32 17 :nth-child(5)' ) ),
                factor: get_factor_from( element.querySelector( 'tr.\\32 17' ) )
            },
            plasma: {
                metal: get_value_from( element.querySelector( 'tr.\\31 22 :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\31 22 :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\31 22 :nth-child(5)' ) )
            },
            objects: {
                metal: get_value_from( element.querySelector( 'tr.\\31 000 :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\31 000 :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\31 000 :nth-child(5)' ) )
            },
            geologist: {
                metal: get_value_from( element.querySelector( 'tr.\\31 001 :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\31 001 :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\31 001 :nth-child(5)' ) )
            },
            officers: {
                metal: get_value_from( element.querySelector( 'tr.\\31 003 :nth-child(3)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.\\31 003 :nth-child(4)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.\\31 003 :nth-child(5)' ) )
            },
            classes: {
                player: {
                    metal: get_value_from( element.querySelector( 'tr.\\31 004 :nth-child(3)' ) ),
                    crystal: get_value_from( element.querySelector( 'tr.\\31 004 :nth-child(4)' ) ),
                    deuterium: get_value_from( element.querySelector( 'tr.\\31 004 :nth-child(5)' ) )
                },
                alliance: {
                    metal: get_value_from( element.querySelector( 'tr.\\31 005 :nth-child(3)' ) ),
                    crystal: get_value_from( element.querySelector( 'tr.\\31 005 :nth-child(4)' ) ),
                    deuterium: get_value_from( element.querySelector( 'tr.\\31 005 :nth-child(5)' ) )
                }
            },
            total: {
                metal: get_value_from( element.querySelector( 'tr.summary :nth-child(2)' ) ),
                crystal: get_value_from( element.querySelector( 'tr.summary :nth-child(3)' ) ),
                deuterium: get_value_from( element.querySelector( 'tr.summary :nth-child(4)' ) )
            }
        }
    },
    set_technologies_to( data ){

        function get_unit_from( element ){
            const id = element.dataset.technology;
            const value = parseInt( element.querySelector( '.amount' ).dataset.value );
            const upgrade = parseInt( element.querySelector( '.targetamount' )?.dataset.value || 0 );
            return {
                id,
                value,
                upgrade
            };
        }

        function get_upgradable_from( element ){
            const id = element.dataset.technology;
            const value = parseInt( element.querySelector( '.level' ).dataset.value );
            const upgrade = Math.max( 0, parseInt( element.querySelector( '.targetlevel' )?.dataset.value || 0 ) - value ) > 0 ? 1 : 0;
            return {
                id,
                value,
                upgrade
            };
        }

        const result = {};
        for( const node of document.querySelectorAll( '#technologies ul > li.hasDetails' ) ){
            const id = node.dataset.technology;
            const is_unit = id > 200 && id < 600;
            result[ id ] = is_unit ? get_unit_from( node ) : get_upgradable_from( node );
        }
        if( currentPage === 'research' ) data.game.player.researches = result;
        else data.game.player.positions[ data.game.interface.current_coordinates ][ data.game.interface.current_body_type ].technologies = result;
    },
    element_exist( selector ){
        return new Promise( function( resolve ){
            if( !document.querySelector( selector ) ){
                const observer = new MutationObserver( function(){
                    if( document.querySelector( selector ) ){
                        observer.disconnect();
                        resolve();
                    }
                } );
                observer.observe( document.body, { childList: true, subtree: true } );
            }else resolve();
        } );
    },
    element_change( selector ){
        return new Promise( function( resolve ){
            const observer = new MutationObserver( function(){
                observer.disconnect();
                resolve();
            } );
            observer.observe( document.querySelector( selector ), { childList: true, subtree: true } );
        } );
    }
};

const MenuButton = {

    init(){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html();
        document.querySelector( '#menuTable' ).appendChild( template.content );
    },
    get_html(){
        return `<li id="ic-menu-button">
						<span class="menu_icon">
							<a href="https://ko-fi.com/rodrigocorreia" target="_blank">
								<div class="tooltipRight" title="Buy me a coffee <3">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20">
										<path fill="currentColor" d="M20 3H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
									</svg>
								</div>
							</a>
						</span>
						<a class="menubutton" href="https://board.fr.ogame.gameforge.com/index.php?thread/746302-infocompte/" target="_blank">
							<span class="textlabel">InfoCompte ${ GM_info.script.version }</span>
						</a>
					</li>`;
    }
};

const Panels = {

    init( data ){
        const collapsables = data.script.collapsables || {};
        for( const button of document.querySelectorAll( '.ic-component h3 button' ) ){
            const panel = button.parentElement.parentElement;
            if( collapsables[ panel.id ] === 'collapsed' ) this.collapse( panel );
            else if( collapsables[ panel.id ] === 'expanded' ) this.expand( panel );
            else if( panel.dataset.state === 'collapsed' ) this.collapse( panel );
            else if( panel.dataset.state === 'expanded' ) this.expand( panel );
            button.addEventListener( 'click', _ => this.toggle( panel ) );
        }
    },
    toggle( panel ){
        const data = Storage.get();
        const collapsables = data.script.collapsables ||= {};
        if( panel.dataset.state === 'collapsed' ){
            this.expand( panel );
            collapsables[ panel.id ] = 'expanded';
        }else if( panel.dataset.state === 'expanded' ){
            this.collapse( panel );
            collapsables[ panel.id ] = 'collapsed';
        }
        Storage.set( data );
    },
    collapse( panel ){
        const button = panel.querySelector( '.ic-component h3 button' );
        const main = panel.querySelector( '.ic-component-main' );
        main.style.display = 'none';
        button.textContent = '⏴';
        panel.dataset.state = 'collapsed';
    },
    expand( panel ){
        const button = panel.querySelector( '.ic-component h3 button' );
        const main = panel.querySelector( '.ic-component-main' );
        main.style.display = null;
        button.textContent = '⏷';
        panel.dataset.state = 'expanded';
    }
};

const PieChart = {

    get_html_from( data ){
        let	start = 0;
        let content = '';
        for( const [ color, percentage ] of data ){
            content += this.get_slice_from( color, percentage, start );
            start += percentage;
        }
        return `<svg viewBox="0 0 100 100" transform="rotate(-90)">${ content }</svg>`;
    },
    get_slice_from( color, value, start ){
        const offset = 2 * Math.PI * 25;
        return `<circle cx=50 cy=50 r=25
							fill=transparent
							stroke=${ color }
							stroke-width=50
							stroke-dasharray="${ value * offset } ${ offset }"
							transform="rotate( ${ start * 360 } 50 50 )"/>`;
    }
};

const PositionsPanel = {

    init( data ){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html_from( data );
        document.querySelector( '#middle' ).appendChild( template.content );
    },
    get_html_from( data ){
        return `<div id="ic-positions-panel" class="ic-component" data-state="collapsed">
						<h3>${ Translation.planets_repartition }<button></button></h3>
						<div class="ic-component-main">
							<table>
							    <tr>
							        <th>${ Translation.coords }</th>
							        <th></th>
							        <th>${ Translation.mines }</th>
							        <th>${ Translation.buildings }</th>
							        <th>${ Translation.lifeform_buildings_short }</th>
							        <th>${ Translation.lifeform_researches_short }</th>
							        <th>${ Translation.defence }</th>
							        <th></th>
                                </tr>
								${ this.get_rows_from( data ) }
							</table>
						</div>
					</div>`;
    },
    get_rows_from( data ){
        const positions = data.game.player.positions;
        let result = '';
        for( const coordinates in positions ){
            result += this.get_row_from( data, coordinates );
        }
        return result;
    },
    get_row_from( data, coordinates ){
        const position = data.game.player.positions[ coordinates ];
        const points = data.game.player.points.positions[ coordinates ];
        const percents = data.game.player.percents.positions[ coordinates ];
        return `<tr>
						<th>${ coordinates }</th>
						<td>${ this.get_names_from( position ) }</td>
						<td>${ this.get_mines_from( points ) }</td>
						<td>${ this.get_buildings_from( points ) }</td>
						<td>${ this.get_lifeform_buildings_from( points ) }</td>
						<td>${ this.get_lifeform_researches_from( points ) }</td>
						<td>${ this.get_defences_from( points ) }</td>
						<td>${ this.get_total_from( points, percents ) }</td>
					</tr>`;
    },
    get_names_from( position ){
        let result = `<div>${ position.planet.name || Translation.planet }</div>`;
        if( position.moon ){
            result += `<div>${ position.moon.name || Translation.moon }</div>`;
        }
        return result;
    },
    get_mines_from( points ){
        return `${ Formats.get_number_from( points.planet.mines ) }`;
    },
    get_buildings_from( points ){
        let result = `${ Formats.get_number_from( points.planet.buildings ) }`;
        if( points.moon ){
            result = `<div>${ result }</div>
						  <div>${ Formats.get_number_from( points.moon.buildings ) }</div>`;
        }
        return result;
    },
    get_lifeform_buildings_from( points ){
        return `${ Formats.get_number_from( points.planet.lifeforms.buildings ) }`;
    },
    get_lifeform_researches_from( points ){
        return `${ Formats.get_number_from( points.planet.lifeforms.researches ) }`;
    },
    get_defences_from( points ){
        let result = `${ Formats.get_number_from( points.planet.defence ) }`;
        if( points.moon ){
            result = `<div>${ result }</div>
						  <div>${ Formats.get_number_from( points.moon.defence ) }</div>`;
        }
        return result;
    },
    get_total_from( points, percents ){
        let result = `${ Formats.get_number_from( points.planet.total ) } — ${ Formats.get_padded_percent_from( percents.planet.total ) }`;
        if( points.moon ){
            result = `<div>${ result }</div>
						  <div>${ Formats.get_number_from( points.moon.total ) } — ${ Formats.get_padded_percent_from( percents.moon.total ) }</div>`;
        }
        return result;
    }
};

const ProductionsPanel = {

    init( data ){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html_from( data );
        document.querySelector( '#middle' ).appendChild( template.content );
    },
    get_html_from( data ){
        const productions = data.game.player.productions;
        const mines = productions.mines;
        const lifeforms = productions.lifeforms;
        const free = productions.free;
        const total = productions.total;
        return  `<div id="ic-productions-panel" class="ic-component" data-state="collapsed">
						<h3>${ Translation.daily_productions }<button></button></h3>
						<div class="ic-component-main">
							<table>
								<tr>
									<th>${ Translation.mines }</th>
									<td>${ Formats.get_number_from( mines.metal ) }</td>
									<td>${ Formats.get_number_from( mines.crystal ) }</td>
									<td>${ Formats.get_number_from( mines.deuterium ) }</td>
									<td>${ Formats.get_number_from( mines.points ) } pts</td>
								</tr>
								<tr>
									<th>${ Translation.lifeforms }</th>
									<td>${ Formats.get_number_from( lifeforms.metal ) }</td>
									<td>${ Formats.get_number_from( lifeforms.crystal ) }</td>
									<td>${ Formats.get_number_from( lifeforms.deuterium ) }</td>
									<td>${ Formats.get_number_from( lifeforms.points ) } pts</td>
								</tr>
								<tr>
									<th>${ Translation.without_dark_matter }</th>
									<td>${ Formats.get_number_from( free.metal ) }</td>
									<td>${ Formats.get_number_from( free.crystal ) }</td>
									<td>${ Formats.get_number_from( free.deuterium ) }</td>
									<td>${ Formats.get_number_from( free.points ) } pts</td>
								</tr>
								<tr>
									<th>${ Translation.total }</th>
									<td>${ Formats.get_number_from( total.metal ) }</td>
									<td>${ Formats.get_number_from( total.crystal ) }</td>
									<td>${ Formats.get_number_from( total.deuterium ) }</td>
									<td>${ Formats.get_number_from( total.points ) } pts</td>
								</tr>
							</table>
						</div>
					</div>`;
    }
};

const ProductionTextExport = {

    get_from( data ){
        return	this.get_header_from( data ) +
            TextExport.get_classes_from( data ) +
            this.get_planets_from( data ) +
            this.get_researches_from( data ) +
            TextExport.get_lifeform_levels_from( data ) +
            this.get_productions_from( data ) +
            this.get_points_from( data );
    },
    get_header_from( data ){
        const title = TextExport.get_title_from( `${ Translation.production_of } ${ data.game.player.name } ${ Translation.on } ${ data.game.universe.name }.${ data.game.universe.language }` );
        const stamp = TextExport.get_stamp();
        return title + stamp + '\n';
    },
    get_planets_from( data ){

        function get_place_from( value ){
            return value.toString().padStart( 2, '0' ) + '. ';
        }

        function get_technology_from( technology, color, padding ){
            let value;
            if( technology.upgrade ){
                value = technology.upgraded;
                color = 'gold';
            }else value = technology.value;
            return TextExport.get_padding_from( value, padding ) + TextExport.get_colored_from( Formats.get_number_from( value ), color ) + ', ';
        }

        function get_temperature_from( value ){
            return TextExport.get_colored_from( value + ' °C', '#f5bbb4' ) + '\n';
        }

        const heading = TextExport.get_heading_from( Translation.planets );
        const positions = data.game.player.positions;
        let content = '';
        let i = 1;
        for( const coordinates in positions ){
            const { technologies, temperatures } = positions[ coordinates ].planet;
            content += get_place_from( i++ );
            content += get_technology_from( technologies[1], Colors.metal, 2 );
            content += get_technology_from( technologies[2], Colors.crystal, 2 );
            content += get_technology_from( technologies[3], Colors.deuterium, 2 );
            content += get_technology_from( technologies[217], Colors.crawlers, 0 );
            content += get_temperature_from( temperatures.max );
        }
        return heading + content + '\n';
    },
    get_researches_from( data ){
        const heading = TextExport.get_heading_from( Translation.researches );
        let content = '';
        const researches = data.game.player.researches;
        for( const key in researches ){
            if( key == 122 ){
                const research = researches[ key ];
                let value;
                let color;
                if( research.upgrade ){
                    value = research.upgraded;
                    color = 'gold';
                }else{
                    value = research.value;
                    color = Colors.primary;
                }
                content += `${ Translation[ key ] } : ${ TextExport.get_colored_from( value, color ) }\n`
            }
        }
        return content ? heading + content + '\n' : '';
    },
    get_productions_from( data ){
        const heading = TextExport.get_heading_from( Translation.daily_productions );
        const productions = data.game.player.productions;
        const mines = productions.mines;
        const free = productions.free;
        const lifeforms = productions.lifeforms;
        const total = productions.total;
        const mines_metal = TextExport.get_colored_from( Formats.get_number_from( mines.metal ), Colors.metal );
        const mines_crystal = TextExport.get_colored_from( Formats.get_number_from( mines.crystal ), Colors.crystal );
        const mines_deuterium = TextExport.get_colored_from( Formats.get_number_from( mines.deuterium ), Colors.deuterium );
        const lifeforms_metal = TextExport.get_colored_from( Formats.get_number_from( lifeforms.metal ), Colors.metal );
        const lifeforms_crystal = TextExport.get_colored_from( Formats.get_number_from( lifeforms.crystal ), Colors.crystal );
        const lifeforms_deuterium = TextExport.get_colored_from( Formats.get_number_from( lifeforms.deuterium ), Colors.deuterium );
        const free_metal = TextExport.get_colored_from( Formats.get_number_from( free.metal ), Colors.metal );
        const free_crystal = TextExport.get_colored_from( Formats.get_number_from( free.crystal ), Colors.crystal );
        const free_deuterium = TextExport.get_colored_from( Formats.get_number_from( free.deuterium ), Colors.deuterium );
        const total_metal = TextExport.get_colored_from( Formats.get_number_from( total.metal ), Colors.metal );
        const total_crystal = TextExport.get_colored_from( Formats.get_number_from( total.crystal ), Colors.crystal );
        const total_deuterium = TextExport.get_colored_from( Formats.get_number_from( total.deuterium ), Colors.deuterium );
        return	heading +
            `${ Translation.mines } : ${ mines_metal }, ${ mines_crystal }, ${ mines_deuterium }\n` +
            `${ Translation.lifeforms } : ${ lifeforms_metal }, ${ lifeforms_crystal }, ${ lifeforms_deuterium }\n` +
            `${ Translation.without_dark_matter } : ${ free_metal }, ${ free_crystal }, ${ free_deuterium }\n` +
            `${ Translation.total } : ${ total_metal }, ${ total_crystal }, ${ total_deuterium }\n\n`;
    },
    get_points_from( data ){
        const heading = TextExport.get_heading_from( Translation.mines_points );
        const points = data.game.player.points;
        return	heading +
            `${ Translation.metal } : ${ TextExport.get_colored_from( Formats.get_number_from( points.mines.metal ), Colors.metal ) }\n` +
            `${ Translation.crystal } : ${ TextExport.get_colored_from( Formats.get_number_from( points.mines.crystal ), Colors.crystal ) }\n` +
            `${ Translation.deuterium } : ${ TextExport.get_colored_from( Formats.get_number_from( points.mines.deuterium ), Colors.deuterium ) }\n` +
            `${ Translation.total } : ${ Formats.get_number_from( points.mines.total ) }`;
    }
};

const RentabilitiesPanel = {

    init(){
        const template = document.createElement( 'template' );
        template.innerHTML = this.get_html_from( data );
        document.querySelector( '#middle' ).appendChild( template.content );
        this.set_event_listeners();
    },
    get_html_from( data ){
        return  `<div id="ic-rentabilities-panel" class="ic-component" data-state="collapsed">
						<h3>${ Translation.rentabilities }<button></button></h3>
						<div class="ic-component-main">
							<form>
								<h1>${ Translation.rates }</h1>
								<input type="number" value="${ data.script.rates?.metal || 2 }" step="0.01">
								<input type="number" value="${ data.script.rates?.crystal || 1.5 }" step="0.01">
								<input type="number" value="${ data.script.rates?.deuterium || 1 }" disabled>
								<button class="ic-button">${ Translation.validate }</button>
							</form>
							<div></div>
						</div>
					</div>`;
    },
    get_mines_table(){
        const data = Data.get();
        const positions = data.game.player.positions;
        let rows = '';
        for( const coordinates in positions ){
            const planet = positions[ coordinates ].planet;
            const technologies = planet.technologies;
            rows += `<tr>
							<th>${ planet.name }</th>
							<td>
								<div>${ Translation.metal } ${ technologies[1].upgraded + 1 }</div>
								<div>${ Formats.get_duration_from( this.get_next_mine_upgrade_rentability_from( data, planet, technologies[1] ) ) }</div>
							</td>
							<td>
								<div>${ Translation.crystal } ${ technologies[2].upgraded + 1 }</div>
								<div>${ Formats.get_duration_from( this.get_next_mine_upgrade_rentability_from( data, planet, technologies[2] ) ) }</div>
							</td>
							<td>
								<div>${ Translation.deuterium } ${ technologies[3].upgraded + 1 }</div>
								<div>${ Formats.get_duration_from( this.get_next_mine_upgrade_rentability_from( data, planet, technologies[3] ) ) }</div>
							</td>
						  </tr>`;
        }
        return `<table id="ic-mines-table">
						<caption>${ Translation.mines }</caption>
						<tbody>${ rows }</tbody>
					</table>`;
    },
    get_researches_table(){
        const data = Data.get();
        const plasma = data.game.player.researches[122];
        const astrophysics = data.game.player.researches[124];
        let plasma_cells = '';
        let astrophysics_cells = '';
        for( let i = 0; i < 3; i++ ){
            const rentability = this.get_next_plasma_upgrade_rentability_from( data );
            plasma_cells += `<td><div>${ plasma.upgraded += 1 }</div><div>${ Formats.get_duration_from( rentability ) }</div></td>`;
        }
        plasma.upgraded -= 3
        for( let i = 0; i < 3; i++ ){
            const rentability = this.get_next_astrophysics_upgrade_rentability_from( data );
            astrophysics.value = astrophysics.upgraded;
            astrophysics.upgrade = ( Math.ceil( astrophysics.value * .5 ) * 2 + 1 ) - astrophysics.value;
            astrophysics.upgraded = astrophysics.value + astrophysics.upgrade;
            astrophysics_cells += `<td><div>${ astrophysics.upgraded - 1 }/${ astrophysics.upgraded }</div><div>${ Formats.get_duration_from( rentability ) }</div></td>`;
        }
        return `<table id="ic-researches-table">
						<caption>${ Translation.researches }</caption>
						<tbody>
                            <tr><th>${ Translation[122] }</th>${ plasma_cells }</tr>
                            <tr><th>${ Translation[124] }</th>${ astrophysics_cells }</tr>
                        </tbody>
					</table>`;
    },
    get_queue_table(){
        const data = Data.get();
        const positions = data.game.player.positions;
        const researches = data.game.player.researches;
        let rows = '';
        // set initial rentabilities
        const rentabilities = {
            astrophysics: this.get_next_astrophysics_upgrade_rentability_from( data ),
            plasma: this.get_next_plasma_upgrade_rentability_from( data )
        };
        for( const coordinates in positions ){
            const planet = positions[ coordinates ].planet;
            const technologies = planet.technologies;
            rentabilities[ coordinates ] = {
                metal : this.get_next_mine_upgrade_rentability_from( data, planet, technologies[ 1 ] ),
                crystal : this.get_next_mine_upgrade_rentability_from( data, planet, technologies[ 2 ] ),
                deuterium : this.get_next_mine_upgrade_rentability_from( data, planet, technologies[ 3 ] )
            };
        }
        // add rows
        for( let i = 1; i <= 100; i++ ){
            let rentability = Infinity;
            let coordinates;
            let planet;
            let planet_name;
            let technology;
            let technology_type;
            let technology_name;
            let technology_class;
            // filter lowest mine rentability
            for( const _coordinates in positions ){
                const technologies = positions[ _coordinates ].planet.technologies;
                const { metal, crystal, deuterium } = rentabilities[ _coordinates ];
                const _rentability = Math.min( metal, crystal, deuterium );
                if( _rentability < rentability ){
                    rentability = _rentability;
                    coordinates = _coordinates;
                    planet = positions[ _coordinates ].planet;
                    if( metal === _rentability ){
                        technology = technologies[1];
                        technology_type = 'metal';
                    }else if( crystal === _rentability ){
                        technology = technologies[2];
                        technology_type = 'crystal';
                    }else if( deuterium === _rentability ){
                        technology = technologies[3];
                        technology_type = 'deuterium';
                    }
                }
            }
            // filter lowest technology rentability
            const _rentability = Math.min( rentabilities.astrophysics, rentabilities.plasma );
            if( _rentability < rentability ){
                rentability = _rentability;
                planet_name = '';
                technology_class = '';
                if( rentabilities.astrophysics === _rentability ){
                    const technology = researches[ 124 ];
                    technology.value = technology.upgraded;
                    technology.upgrade = ( Math.ceil( technology.value * .5 ) * 2 + 1 ) - technology.value;
                    technology.upgraded = technology.value + technology.upgrade;
                    technology_name = `${ Translation[ technology.id ] } ${ technology.upgraded - 1 }/${ technology.upgraded }`;
                    technology_class = `ic-research`;
                    rentabilities.astrophysics = this.get_next_astrophysics_upgrade_rentability_from( data );
                }else if( rentabilities.plasma === _rentability ){
                    const technology = researches[ 122 ];
                    technology.value = technology.upgraded;
                    technology.upgrade = 1;
                    technology.upgraded = technology.value + technology.upgrade;
                    technology_name = `${ Translation[ technology.id ] } ${ technology.upgraded }`;
                    technology_class = `ic-research`;
                    rentabilities.plasma = this.get_next_plasma_upgrade_rentability_from( data );
                }
            }else{
                technology.value = technology.upgraded;
                technology.upgrade = 1;
                technology.upgraded = technology.value + technology.upgrade;
                planet_name = planet.name;
                technology_name = `${ Translation[ technology_type ] } ${ technology.upgraded }`;
                technology_class = `ic-${ technology_type }-mine`;
                rentabilities[ coordinates ][ technology_type ] = this.get_next_mine_upgrade_rentability_from( data, planet, technology );
            }
            // add row
            rows += `<tr><th>${ i }.</th><td>${ planet_name }</td><td class="${ technology_class }"><div>${ technology_name }</div><div>${ Formats.get_duration_from( rentability ) }</div></td></tr>`;
        }
        return `<table id="ic-queue-table">
						<caption>${ Translation.queue }</caption>
						<tbody>${ rows }</tbody>
					</table>`;
    },
    get_next_mine_upgrade_rentability_from( data, planet, technology ){
        const initial_production = planet.get_upgraded_production_from( data );
        const initial_value = technology.value;
        const initial_upgrade = technology.upgrade;
        const initial_upgraded = technology.upgraded;
        technology.value = technology.upgraded;
        technology.upgrade = 1;
        technology.upgraded = technology.value + technology.upgrade;
        const upgrade_cost = technology.get_upgrade_cost_from( data );
        const upgraded_production = planet.get_upgraded_production_from( data );
        technology.value = initial_value;
        technology.upgrade = initial_upgrade;
        technology.upgraded = initial_upgraded;
        return upgrade_cost / ( upgraded_production - initial_production );
    },
    get_next_plasma_upgrade_rentability_from( data ){
        const positions = data.game.player.positions;
        const technology = data.game.player.researches[122];
        const initial_production = positions.get_upgraded_production_from( data );
        const initial_value = technology.value;
        const initial_upgrade = technology.upgrade;
        const initial_upgraded = technology.upgraded;
        technology.value = technology.upgraded;
        technology.upgrade = 1;
        technology.upgraded = technology.value + technology.upgrade;
        const upgrade_cost = technology.get_upgrade_cost_from( data );
        const upgraded_production = positions.get_upgraded_production_from( data );
        technology.value = initial_value;
        technology.upgrade = initial_upgrade;
        technology.upgraded = initial_upgraded;
        return upgrade_cost / ( upgraded_production - initial_production );
    },
    get_next_astrophysics_upgrade_rentability_from( data ){
        const positions = data.game.player.positions;
        const technology = data.game.player.researches[124];
        const initial_value = technology.value;
        const initial_upgrade = technology.upgrade;
        const initial_upgraded = technology.upgraded;
        technology.value = technology.upgraded;
        technology.upgrade = Math.ceil( technology.value * .5 ) * 2 + 1 - technology.value;
        technology.upgraded = technology.value + technology.upgrade;
        const upgrade_costs = technology.get_upgrade_cost_from( data );
        technology.value = initial_value;
        technology.upgrade = initial_upgrade;
        technology.upgraded = initial_upgraded;
        return ( positions.get_average_cost_from( data ) + upgrade_costs ) / positions.get_average_upgraded_production_from( data );
    },
    set_event_listeners(){
        const component = document.querySelector( '#ic-rentabilities-panel' );
        const inputs = component.querySelectorAll( 'input' );
        const tables = component.querySelector( '.ic-component-main > div' );
        component.addEventListener( 'submit', event => {
            event.preventDefault();
            const data = Storage.get();
            data.script.rates = {
                metal: inputs[0].value,
                crystal: inputs[1].value,
                deuterium: inputs[2].value
            };
            Storage.set( data );
            tables.innerHTML = this.get_mines_table() +
                this.get_researches_table() +
                this.get_queue_table();
        } );
    }
};

const Storage = {

    key: document.head.querySelector( 'meta[name=ogame-player-id]' ).content + '_v2',

    get(){
        return GM_getValue( this.key, {} );
    },
    set( data ){
        GM_setValue( this.key, data );
    },
    clear(){
        GM_setValue( this.key, {} );
    }
};

const Style = {

    init(){
        const style =
            `@charset "utf-8";
				.ic-component {
					background: #0d1014;
					border: 2px solid black;
					box-sizing: border-box;
					color: lightgrey;
					line-height: 1;
					margin: 0 auto 0;
					padding: 8px;
					position: relative;
					width: 654px;
				}
				.ic-component::before, .ic-component::after {
					content: '';
					position: absolute;
					width: 668px;
				}
				.ic-component::before {
					background: url('//gf3.geo.gfsrv.net/cdn53/f333e15eb738b8ec692340f507e1ae.png') bottom left no-repeat, url('//gf2.geo.gfsrv.net/cdnd5/66551209db14e23b3001901b996cc6.png') bottom right no-repeat;
					height: 28px;
					left: -9px;
					top: -3px;
				}
				.ic-component::after {
					background: url('//gf3.geo.gfsrv.net/cdnea/0330abcdca0d125d35a0ebace4b584.png') bottom left no-repeat, url('//gf1.geo.gfsrv.net/cdn9b/8003a40825bc96919c5fec01b018b8.png') bottom right no-repeat;
					height: 50px;
					bottom: -4px;
					left: -9px;
				}
				.ic-component h3 {
					background: url('//gf1.geo.gfsrv.net/cdnfb/a4e7913209228ebaf2297429aeb87b.png');
					color: ${ Colors.primary };
					font: bold 12px/27px Verdana,Arial,Helvetica,sans-serif;
					margin: -9px -8px 4px;
					text-align: center;
					position: relative;
				}
				.ic-component h3::before, .ic-component h3::after {
					content: '';
					display: block;
					position: absolute;
					top: 0;
					width: 26px;
					height: 27px;
				}
				.ic-component h3::before {
					background: url('//gf2.geo.gfsrv.net/cdn4a/127bd495b9325216af08a588ecc540.png');
					left: 0;
				}
				.ic-component h3::after {
					background: url('//gf2.geo.gfsrv.net/cdn1d/80db96934a5b82ce002f839cd85a44.png');
					right: 0;
				}
				.ic-component h3 button {
					background: none;
					color: #2dad40;
					font-size: 20px;
					position: absolute;
					right: 20px;
					top: -2px;
				}
				.ic-component h3 button:hover {
					cursor: pointer;
				}
				.ic-component-main {
					background: #12171c;
					border: 1px solid black;
					display: flex;
				}
				.ic-component table {
					border-collapse: collapse;
					font-size: 11px;
				}
				.ic-component table:not( :last-child ) {
					margin-bottom: 8px;
				}
				.ic-component caption {
					color: ${ Colors.primary };
					font: bold 12px/27px Verdana,Arial,Helvetica,sans-serif;
					padding-left: 6px;
					text-align: left;
				}
				.ic-component tr:nth-child( even ) {
					background: #141e26;
				}
				.ic-component tr > * {
					padding: 6px;
					white-space: nowrap;
				}
				.ic-component tr > :first-child {
					padding-left: 8px;
				}
				.ic-component tr > :last-child {
					padding-right: 8px;
				}
				.ic-component tbody th {
					text-align: left;
				}
				.ic-component td {
					text-align: right;
				}
				.ic-component :is( th, td ) > div:not( :last-child ) {
					margin-bottom: 6px;
				}
				.ic-button, .ic-outline-button {
					border-radius: 3px;
					border-style: solid;
					border-width: 1px;
					color: inherit;
					line-height: 1;
					padding: 8px;
				}
				.ic-button {
					background: linear-gradient( to bottom, #2d3743 0%, #181e25 100% );
					border-color: #28323e #222b34 #232a34 #222b34;
					box-shadow: 0 1px 3px 0 black, inset 0 1px 1px 0 #405064;
				}
				.ic-outline-button {
					background: none;
				}
				:is( .ic-button, .ic-outline-button ):hover {
					cursor: pointer;
				}
				.ic-button:hover {
					filter: brightness( 1.15 );
				}
				.ic-outline-button:hover {
					background: #f1f1f1;
					color: #0d1014;
				}
				#ic-account-points-component table {
                    margin-bottom: 0;
					min-width: 50%;
				}
				#ic-account-points-component tr:nth-child( 8 ) > * {
					padding-bottom: 8px;
				}
				#ic-account-points-component tr:nth-child( 9 ) > * {
					border-top: 1px dotted rgb( 128, 128, 128, .2 );
					padding-top: 8px;
				}
				#ic-account-points-component th::before {
					color: transparent;
					content: '⬤';
					margin-right: 8px;
				}
				#ic-account-points-component tr:nth-child( 1 ) th::before {
					color: ${ Colors.mines };
				}
				#ic-account-points-component tr:nth-child( 2 ) th::before {
					color: ${ Colors.planetary_buildings };
				}
				#ic-account-points-component tr:nth-child( 3 ) th::before {
					color: ${ Colors.lunar_buildings };
				}
				#ic-account-points-component tr:nth-child( 4 ) th::before {
					color: ${ Colors.lifeform_buildings };
				}
				#ic-account-points-component tr:nth-child( 5 ) th::before {
					color: ${ Colors.lifeform_researches };
				}
				#ic-account-points-component tr:nth-child( 6 ) th::before {
					color: ${ Colors.research };
				}
				#ic-account-points-component tr:nth-child( 7 ) th::before {
					color: ${ Colors.fleet };
				}
				#ic-account-points-component tr:nth-child( 8 ) th::before {
					color: ${ Colors.defence };
				}
				#ic-account-points-component svg {
					margin: auto;
					width: 33%;
				}
				#ic-positions-panel table {
					width: 100%;
				}
				#ic-positions-panel th {
					width: 0;
				}
				#ic-positions-panel td {
					vertical-align: baseline;
				}
				#ic-positions-panel td:nth-child( 2 ) {
					text-align: left;
				}
				#ic-positions-panel td:nth-child( 3 ) {
					color: ${ Colors.mines };
				}
				#ic-positions-panel td:nth-child( 4 ) {
					color: ${ Colors.planetary_buildings };
				}
				#ic-positions-panel td:nth-child( 4 ) div:nth-child( 2 ){
					color: ${ Colors.lunar_buildings };
				}
				#ic-positions-panel td:nth-child( 5 ) {
					color: ${ Colors.lifeform_buildings };
				}
				#ic-positions-panel td:nth-child( 6 ) {
					color: ${ Colors.lifeform_researches };
				}
				#ic-positions-panel td:nth-child( 7 ) {
					color: ${ Colors.defence };
				}
				#ic-positions-panel td:not( :nth-child( 2 ) ) {
					width: 0;
				}
				#ic-productions-panel table {
					table-layout: fixed;
					width: 100%;
				}
				#ic-productions-panel td:nth-child( 2 ) {
					color: ${ Colors.metal };
				}
				#ic-productions-panel td:nth-child( 3 ) {
					color: ${ Colors.crystal };
				}
				#ic-productions-panel td:nth-child( 4 ) {
					color: ${ Colors.deuterium };
				}
				#ic-rentabilities-panel .ic-component-main {
					flex-direction: column;
				}
				#ic-rentabilities-panel form {
					align-items: center;
					display: flex;
					justify-content: end;
					padding: 8px;
				}
				#ic-rentabilities-panel form h1 {
					margin-right: 8px;
				}
				#ic-rentabilities-panel [ type="number" ]::-webkit-outer-spin-button,
				#ic-rentabilities-panel [ type="number" ]::-webkit-inner-spin-button {
					-webkit-appearance: none;
					margin: 0;
				}
				#ic-rentabilities-panel input {
					-moz-appearance: textfield;
					border: 1px solid white;
					box-sizing: border-box;
					padding: 6px;
					text-align: right;
					width: 40px;
				}
				#ic-rentabilities-panel input:not( :last-of-type ) {
					margin-right: 4px;
				}
				#ic-rentabilities-panel input:disabled {
					background: none;
					color: inherit;
					opacity: .5;
				}
				#ic-rentabilities-panel button {
					margin-left: 8px;
				}
				#ic-rentabilities-panel table {
					width: 100%;
				}
				#ic-rentabilities-panel th {
					width: 0;
				}
				#ic-mines-table {
					table-layout: fixed;
				}
				#ic-mines-table td:nth-child( 2 ) {
					color: ${ Colors.metal };
				}
				#ic-mines-table td:nth-child( 3 ) {
					color: ${ Colors.crystal };
				}
				#ic-mines-table td:nth-child( 4 ) {
					color: ${ Colors.deuterium };
				}
				#ic-researches-table {
					table-layout: fixed;
				}
				#ic-queue-table tbody {
					display: flex;
					flex-direction: column;
					flex-wrap: wrap;
					height: 2000px;
				}
				#ic-queue-table td {
					width: 50%;
				}
				#ic-queue-table td:first-of-type {
					text-align: left;
				}
				#ic-queue-table .ic-metal-mine {
					color: ${ Colors.metal }
				}
				#ic-queue-table .ic-crystal-mine {
					color: ${ Colors.crystal }
				}
				#ic-queue-table .ic-deuterium-mine {
					color: ${ Colors.deuterium }
				}
                #ic-queue-table .ic-research {
					color: ${ Colors.research }
				}
				#ic-footer {
					display: flex;
					justify-content: space-between;
					margin: 8px 0 35px 0;
					padding: 0 19px;
				}
				#ic-exports-component {
					align-items: center;
					display: flex;
				}
				#ic-exports-component form {
					display: flex;
				}
				#ic-exports-component form label {
					align-items: center;
					display: inline-flex;
				}
				#ic-exports-component form label:not( :last-of-type ) {
					margin-right: 8px;
				}
				#ic-exports-component form input {
					margin: 0 4px 0 0;
				}
					#ic-exports-component form > label:nth-child( 3 ) {
						opacity: .33;
					}
					#ic-exports-component form :is( label:nth-child( 3 ), label:nth-child( 3 ) input ):hover {
						cursor: default;
					}
				#ic-exports-component form :is( label, input ):hover {
					cursor: pointer;
				}
				#ic-exports-component form button {
					margin-right: 8px;
				}
				#ic-exports-component form button:last-of-type {
					margin-right: 16px;
				}
				#ic-export-notification {
					display: none;
				}
				#ic-export-notification::before {
					content: '✓';
					margin-right: 4px;
				}
				#ic-menu-button .textlabel {
					font-size: 10px;
				}
				#ic-menu-button div {
					align-items: center;
					background: linear-gradient( to bottom, #1b2024 50%, #000 50% );
					border-radius: 4px;
					color: #353a3c;
					display: flex;
					justify-content: center;
					width: 27px;
					height: 27px;
				}
				#ic-menu-button div:hover {
					color: #d39343;
				}
				.ic-warning::after {
					animation: pulse 1s ease-in-out infinite alternate;
					color: yellow;
					content: '🗲';
					margin-left: 4px;
				}
				.ic-padded-percent {
					display: inline-block;
				}
				.ic-padded-percent::first-letter {
					opacity: 0;
				}
				@keyframes pulse {
					to {
						opacity: 0;
					}
				}`;
        GM_addStyle( style );
    }
};

const TextExport = {

    get_title_from( value ){
        return this.get_sized_from( this.get_colored_from( value, Colors.primary ), 24 ) + '\n';
    },
    get_heading_from( value ){
        return this.get_sized_from( this.get_colored_from( value, Colors.primary ), 18 ) + '\n';
    },
    get_stamp(){
        const date = new Date();
        return `${ Translation.generated_on } ${ date.toLocaleDateString( 'fr-FR' ) } ${ Translation.at } ${ date.toLocaleTimeString( 'de-DE', { timeStyle: 'short'} ) } ${ Translation.with } [url=https://board.fr.ogame.gameforge.com/index.php?thread/746302-infocompte/]InfoCompte ${ GM_info.script.version }[/url]\n`;
    },
    get_classes_from( data ){
        const player_class = data.game.player.class;
        const alliance_class = data.game.player.alliance?.class;
        let result = '';
        if( player_class ){
            const value = Translation[ player_class + '_player_class' ];
            result += this.get_colored_from( value, Colors.primary );
        }
        if( alliance_class ){
            if( result !== '' ) result += ' & ';
            const value = Translation[ alliance_class + '_alliance_class' ];
            result += this.get_colored_from( value, Colors.primary );
        }
        return result ? this.get_sized_from( result, 14 ) + '\n\n' : '';
    },
    get_lifeform_levels_from( data ){
        const heading = this.get_heading_from( Translation.lifeform_levels );
        const lifeforms = data.game.player.lifeforms;
        let result = '';
        for( const key in lifeforms ){
            const lifeform = lifeforms[ key ];
            const level = this.get_colored_from( lifeform.level, Colors.primary );
            const current_xp = Formats.get_number_from( lifeform.xp.current );
            const maximum_xp = Formats.get_number_from( lifeform.xp.maximum );
            result += `${ Translation[ key ] } : ${ level } · ${ current_xp }/${ maximum_xp } xp\n`;
        }
        return result ? heading + result + '\n' : '';
    },
    get_padding_from( value, length ){
        const count = Math.max( 0, length - value.toString().length );
        return '_'.repeat( count );
    },
    get_colored_from( value, color ){
        return `[color=${ color }]${ value }[/color]`;
    },
    get_sized_from( value, size ){
        return `[size=${ size }]${ value }[/size]`;
    }
};
/**
 * Script initialization
 */
const data = Data.get_from( Storage.get(), await Interface.get() );
if( currentPage !== 'empire' ){
    if( currentPage === 'overview' ){
        AccountPanel.init( data );
        PositionsPanel.init( data );
        ProductionsPanel.init( data );
        RentabilitiesPanel.init();
        Panels.init( data );
        Footer.init( data );
    }else if( currentPage === 'highscore' ) Highscore.init();
    EnergyWarnings.init( data );
    MenuButton.init();
    Style.init();
}
Storage.set( data );
