const GameConfig = {
    // --- ÉPÜLETEK ---
    buildings: {
        'capital': { id: 'capital', name: 'Kocsma', cost: 0, income: 5, defense: 1 },
        'house':   { id: 'house', name: 'Italbolt', cost: 12, income: 5, defense: 0 },
        'tower1':  { id: 'tower1', name: 'Kidobó', cost: 15, income: 0, defense: 1 },
        'tower2':  { id: 'tower2', name: 'ZH', cost: 35, income: 0, defense: 2 },
        'tower3':  { id: 'tower3', name: 'Rendőr', cost: 70, income: 0, defense: 3 }
    },

    // --- EGYSÉGEK ---
    units: {
        1: { level: 1, name: 'Csöves', cost: 10, upkeep: 2 },
        2: { level: 2, name: 'Egyetemista', cost: 20, upkeep: 6 },
        3: { level: 3, name: 'Delinquent', cost: 30, upkeep: 18 },
        4: { level: 4, name: 'Maffiás', cost: 40, upkeep: 54 }
    }
};