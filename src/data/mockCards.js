export const mockCards = [
  {
    id: 'c1',
    name: 'Aelastion',
    type: null,
    requirements: null,
    attack: '1d6 + Con (Holy)',
    abilities: [
      {
        name: 'Channel Divinity',
        effect: 'You may use your Con in place of any other stat when meeting the total stat requirement of the next Boon you perform this round.'
      }
    ],
    text: 'Whenever you perform a Boon card, restore 1 Hit Point to the target for each point of Constitution required to perform that card.',
    flavorText: null,
    footer: 'Place Holder Art',
    artUrl: '/cards/fronts/000.png'
  },
  {
    id: 'c2',
    name: 'Blade Dance',
    type: 'Action - Ability',
    requirements: [0, 5, 0, 0, 0, 0],
    attack: null,
    abilities: null,
    text: 'Deal 1d10 plus your Dexterity modifier in Slashing damage to a target.',
    flavorText: null,
    footer: 'Place Holder Art',
    artUrl: '/cards/fronts/001.png'
  },
  {
    id: 'c3',
    name: 'Absorb Elements',
    type: 'Reaction - Boon',
    requirements: [0, 0, 0, 4, 0, 0],
    attack: null,
    abilities: null,
    text: 'A target gains resistance to a type of Elemental damage targeting them until the beginning of their next turn. (Air, Earth, Fire, Ice, Lightning, Thunder, or Water.)',
    flavorText: null,
    footer: 'Place Holder Art',
    artUrl: '/cards/fronts/002.png'
  },
  {
    id: 'c4',
    name: 'Arena of Strength',
    type: 'Location - Common',
    requirements: null,
    attack: null,
    abilities: null,
    text: 'Gain +1 Strength.',
    flavorText: 'The roar of the crowd fuels both ambition and might.',
    footer: 'Place Holder Art',
    artUrl: '/cards/fronts/003.png'
  }
];
