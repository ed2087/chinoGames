/* ============================================
   POKEMON-SOURCE.JS - Fetches and caches Pokemon
   for the memory match cards. Gen 1 only (1-151)
   since those are the most recognizable to kids.
   ============================================ */

class PokemonSource {
    static MAX_ID = 151;
    static memoryCache = new Map();

    static async fetchOne(id) {
        if (this.memoryCache.has(id)) return this.memoryCache.get(id);

        const cacheKey = `pokemonCardInfo_${id}`;
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            const info = JSON.parse(stored);
            this.memoryCache.set(id, info);
            return info;
        }

        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error(`PokeAPI request failed: ${res.status}`);
        const data = await res.json();

        const spriteUrl = (data.sprites && data.sprites.front_default) ||
            (data.sprites && data.sprites.other && data.sprites.other['official-artwork'] &&
                data.sprites.other['official-artwork'].front_default);
        if (!spriteUrl) throw new Error(`No sprite available for pokemon ${id}`);

        const cryUrl = data.cries && (data.cries.latest || data.cries.legacy);

        const info = { id, name: data.name, spriteUrl, cryUrl: cryUrl || null };
        localStorage.setItem(cacheKey, JSON.stringify(info));
        this.memoryCache.set(id, info);
        return info;
    }

    // Fetches `count` distinct Pokemon. Skips any that fail to load instead
    // of aborting the whole round - callers should treat a short result
    // (fewer than requested) as "fall back to something else".
    static async fetchRandomUnique(count) {
        const ids = new Set();
        while (ids.size < count) {
            ids.add(Math.floor(Math.random() * this.MAX_ID) + 1);
        }

        const results = [];
        for (const id of ids) {
            try {
                results.push(await this.fetchOne(id));
            } catch (err) {
                console.warn('Pokemon fetch failed for id', id, err);
            }
        }
        return results;
    }
}

window.PokemonSource = PokemonSource;
