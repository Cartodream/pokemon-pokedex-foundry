class PokedexApp extends Application {
  constructor() {
    super();
    this.selectedPokemon = null;
    this.pokemonData = {};
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "pokedex-app",
      title: "Pokédex",
      template: "modules/pokemon-pokedex/templates/pokedex.html",
      width: 1000,
      height: 700,
      resizable: true,
      classes: ["pokedex-window"]
    });
  }

  async getData() {
    this.pokemonData = await this.loadPokemonData();
    const pokemonList = Object.values(this.pokemonData).sort((a, b) => a.id - b.id);
    return { 
      pokemon: pokemonList,
      selectedPokemon: this.selectedPokemon
    };
  }

  async loadPokemonData() {
    try {
      const response = await fetch("modules/pokemon-pokedex/data/pokemon_data.json");
      return await response.json();
    } catch (error) {
      console.error("Erreur lors du chargement du Pokédex:", error);
      return {};
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('#pokemon-search').on('input', this._onSearch.bind(this));
    html.find('.pokemon-entry').on('click', this._onPokemonClick.bind(this));
    html.find('#type-filter').on('change', this._onTypeFilter.bind(this));
  }

  _onSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const entries = this.element.find('.pokemon-entry');
    
    entries.each((i, entry) => {
      const name = $(entry).find('.pokemon-name').text().toLowerCase();
      if (name.includes(searchTerm)) {
        $(entry).show();
      } else {
        $(entry).hide();
      }
    });
  }

  _onTypeFilter(event) {
    const selectedType = event.target.value;
    const entries = this.element.find('.pokemon-entry');
    
    entries.each((i, entry) => {
      const pokemonId = $(entry).data('pokemon-id');
      const pokemon = this.pokemonData[pokemonId];
      
      if (!selectedType || pokemon.type.includes(selectedType)) {
        $(entry).show();
      } else {
        $(entry).hide();
      }
    });
  }

  async _onPokemonClick(event) {
    const pokemonId = $(event.currentTarget).data('pokemon-id');
    this.selectedPokemon = this.pokemonData[pokemonId];
    
    // Mettre à jour l'affichage des détails
    this._updatePokemonDetails();
    
    // Marquer l'entrée comme sélectionnée
    this.element.find('.pokemon-entry').removeClass('selected');
    $(event.currentTarget).addClass('selected');
  }

  _updatePokemonDetails() {
    if (!this.selectedPokemon) return;
    
    const detailsContainer = this.element.find('.pokemon-details');
    const pokemon = this.selectedPokemon;
    
    let evolutionText = "N'évolue pas";
    if (pokemon.evolution && typeof pokemon.evolution === 'object') {
      if (pokemon.evolution.niveau) {
        evolutionText = `Évolue en ${pokemon.evolution.nom} au niveau ${pokemon.evolution.niveau}`;
      } else if (pokemon.evolution.pierre) {
        evolutionText = `Évolue en ${pokemon.evolution.nom} avec une ${pokemon.evolution.pierre}`;
      } else if (pokemon.evolution.echange) {
        evolutionText = `Évolue en ${pokemon.evolution.nom} par échange`;
      }
    } else if (Array.isArray(pokemon.evolution)) {
      evolutionText = pokemon.evolution.map(evo => {
        if (evo.pierre) return `${evo.nom} (${evo.pierre})`;
        return evo.nom;
      }).join(', ');
    }
    
    const weaknesses = Object.entries(pokemon.sensibilites)
      .filter(([type, multiplier]) => multiplier > 1)
      .map(([type, multiplier]) => `${type} (×${multiplier})`)
      .join(', ');
    
    const resistances = Object.entries(pokemon.sensibilites)
      .filter(([type, multiplier]) => multiplier < 1 && multiplier > 0)
      .map(([type, multiplier]) => `${type} (×${multiplier})`)
      .join(', ');
    
    const immunities = Object.entries(pokemon.sensibilites)
      .filter(([type, multiplier]) => multiplier === 0)
      .map(([type]) => type)
      .join(', ');
    
    const movesHtml = pokemon.capacites.map(move => 
      `<div class="move-item">Niv. ${move.niveau}: <strong>${move.attaque}</strong></div>`
    ).join('');
    
    detailsContainer.html(`
      <div class="pokemon-detail-header">
        <h3>#${pokemon.id} - ${pokemon.nom}</h3>
        <div class="pokemon-types">
          ${pokemon.type.map(type => `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`).join('')}
        </div>
      </div>
      
      <div class="pokemon-stats">
        <div class="stat-row"><strong>Taille:</strong> ${pokemon.taille}</div>
        <div class="stat-row"><strong>Poids:</strong> ${pokemon.poids}</div>
        <div class="stat-row"><strong>Exp. de base:</strong> ${pokemon.exp_base}</div>
        <div class="stat-row"><strong>Évolution:</strong> ${evolutionText}</div>
      </div>
      
      <div class="pokemon-effectiveness">
        <h4>Efficacité des types</h4>
        ${weaknesses ? `<div class="weakness"><strong>Faiblesses:</strong> ${weaknesses}</div>` : ''}
        ${resistances ? `<div class="resistance"><strong>Résistances:</strong> ${resistances}</div>` : ''}
        ${immunities ? `<div class="immunity"><strong>Immunités:</strong> ${immunities}</div>` : ''}
      </div>
      
      <div class="pokemon-moves">
        <h4>Capacités apprises</h4>
        <div class="moves-list">
          ${movesHtml}
        </div>
      </div>
    `);
  }
}

Hooks.once('ready', () => {
  const button = $(`<li class="scene-control" data-tool="pokedex" title="Pokédex">
    <i class="fas fa-book"></i>
  </li>`);
  
  button.on('click', () => {
    new PokedexApp().render(true);
  });
  
  $('#controls .main-controls').append(button);
});