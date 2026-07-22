/* ============================================
   POKEMON-SOURCE.JS - Fetches and caches Pokemon
   for the Poke Ball reveal. Gen 1 only (1-151)
   since those are the most recognizable to kids.

   Each ball type pulls from its own curated pool, so the
   ball actually means something: Poke Ball = common/basic,
   Great Ball = starters & fan favorites, Ultra Ball = strong
   evolved Pokemon, Master Ball = legendaries (shown shiny).
   ============================================ */

class PokemonSource {
    static memoryCache = new Map();

    static TIERS = {
        // Common, basic-stage Pokemon
        pokeball: [10, 13, 16, 19, 21, 23, 27, 29, 32, 41, 43, 46, 48, 50, 52, 54,
                   60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 96, 98,
                   100, 102, 104, 109, 116, 118, 120, 129],
        // Starters and well-known first-stage favorites
        greatball: [1, 4, 7, 25, 35, 37, 39, 58, 93, 111, 122, 123, 124, 132, 133, 138, 140, 147],
        // Fully-evolved, strong Pokemon
        ultraball: [3, 6, 9, 26, 65, 68, 76, 94, 112, 130, 134, 135, 136, 139, 141, 142, 143, 149],
        // Legendary / mythical - the rarest catch, shown shiny
        masterball: [144, 145, 146, 150, 151]
    };

    static async fetchOne(id, { shiny = false } = {}) {
        const cacheKey = `pokemonRevealInfo_${id}_${shiny ? 'shiny' : 'normal'}`;
        if (this.memoryCache.has(cacheKey)) return this.memoryCache.get(cacheKey);

        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            const info = JSON.parse(stored);
            this.memoryCache.set(cacheKey, info);
            return info;
        }

        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error(`PokeAPI request failed: ${res.status}`);
        const data = await res.json();

        const artwork = data.sprites && data.sprites.other && data.sprites.other['official-artwork'];
        const spriteUrl = (shiny && artwork && artwork.front_shiny) ||
            (artwork && artwork.front_default) ||
            (data.sprites && data.sprites.front_default);
        if (!spriteUrl) throw new Error(`No sprite available for pokemon ${id}`);

        const types = (data.types || []).map(t => t.type.name);
        const cryUrl = data.cries && (data.cries.latest || data.cries.legacy);

        const info = { id, name: data.name, spriteUrl, types, cryUrl: cryUrl || null, shiny };
        localStorage.setItem(cacheKey, JSON.stringify(info));
        this.memoryCache.set(cacheKey, info);
        return info;
    }

    static async fetchRandomForTier(ballType) {
        const pool = this.TIERS[ballType] || this.TIERS.pokeball;
        const id = pool[Math.floor(Math.random() * pool.length)];
        const shiny = ballType === 'masterball';
        return this.fetchOne(id, { shiny });
    }
}

window.PokemonSource = PokemonSource;
