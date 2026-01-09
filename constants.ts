import { RestaurantInfo, MenuItem } from './types';

export const RESTAURANT_DATA: RestaurantInfo = {
  name: "Le Tigre du Bengale",
  address: "19 Rue des Maréchaux, 54000 Nancy",
  phone: "03 83 22 88 31",
  hours: {
    lunch: "12:00 - 14:00",
    dinner: "18:30 - 23:30"
  }
};

export const MENU_CATEGORIES = [
  "ENTRÉES - Les Salades",
  "ENTRÉES - Nos Fritures",
  "ENTRÉES - Spécialités Tandoori",
  "LES PLATS (Sauces)",
  "PLATS LÉGUMES (Végétariens)",
  "PLATS RIZ ET BIRYANIES",
  "ACCOMPAGNEMENTS",
  "DESSERTS",
  "BOISSONS"
];

// Helper for options
const MEAT_OPTIONS = [
  "Poulet",
  "Dinde",
  "Bœuf",
  "Poisson",
  "Crevettes",
  "Agneau"
];

const GLACE_PARFUMS = ["Vanille", "Chocolat", "Café", "Fraise", "Citron", "Pistache", "Caramel"];
const SORBET_PARFUMS = ["Citron", "Fraise", "Mangue", "Framboise", "Cassis", "Passion"];

export const MENU_ITEMS: MenuItem[] = [
  // --- ENTRÉES - Les Salades ---
  {
    id: "salade-bengale",
    name: "Salade Bengale",
    description: "Salade, tomates, concombre, morceaux de dinde grillés au charbon de bois OU aux crevettes, épices avec une sauce salade.",
    price: 10.90,
    category: "ENTRÉES - Les Salades",
    image: "/images/salade-bengale.png",
    options: [
      {
        title: "Choix de la garniture",
        required: true,
        choices: ["Dinde grillée", "Crevettes"]
      }
    ]
  },
  {
    id: "salade-poisson",
    name: "Salade Poisson",
    description: "Poisson, légumes saisonniers, tomate, concombre, épices avec une sauce salade.",
    price: 10.90,
    category: "ENTRÉES - Les Salades",
    image: "/images/salade-poisson.png"
  },
  {
    id: "salade-vegetarienne",
    name: "Salade Végétarienne",
    description: "Salade, tomates, concombre, carottes râpées, pomme de terre et sauce salade.",
    price: 8.90,
    category: "ENTRÉES - Les Salades",
    image: "/images/salade-vegetarienne.png"
  },
  {
    id: "raita",
    name: "Raita",
    description: "Tomate, concombre, carotte, yaourt et épices.",
    price: 6.90,
    category: "ENTRÉES - Les Salades",
    image: "/images/raita.png"
  },
  {
    id: "salade-crevettes",
    name: "Salade de Crevettes",
    description: "Laitue, tomates, concombre, crevettes, sauce maison.",
    price: 11.90,
    category: "ENTRÉES - Les Salades",
    image: "/images/salade-crevettes.png"
  },

  // --- ENTRÉES - Nos Fritures (Beignets) ---
  {
    id: "mangso-pakora",
    name: "Mangso Pakora (Poulet)",
    description: "Beignets de poulet.",
    price: 8.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/mangso-pakora.png"
  },
  {
    id: "mase-pakora",
    name: "Mase Pakora (Poisson)",
    description: "Beignets de poisson.",
    price: 9.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/mase-pakora.png"
  },
  {
    id: "pakora-mixte",
    name: "Pakora Mixte Spécial Bengale",
    description: "Assortiment de beignets (farine pois chiche, oignons, pommes de terre, aubergines).",
    price: 10.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/pakora-mixte.png"
  },
  {
    id: "frites",
    name: "Frites Traditionnelles",
    description: "Portion de frites.",
    price: 5.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/frites.png"
  },
  {
    id: "samossa",
    name: "Samossa",
    description: "Pâte feuilletée fourrée (Viande ou Légumes).",
    price: 6.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/samossa.png",
    options: [
      {
        title: "Garniture",
        required: true,
        choices: ["Viande", "Légumes"]
      }
    ]
  },
  {
    id: "sobji-pakora",
    name: "Sobji Pakora",
    description: "Beignets de légumes.",
    price: 6.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/sobji-pakora.png",
    options: [
      {
        title: "Choix du légume",
        required: true,
        choices: ["Aubergine", "Oignon", "Pomme de terre"]
      }
    ]
  },
  {
    id: "chingri-pakora",
    name: "Chingri Pakora",
    description: "Beignets de crevettes décortiquées aux épices.",
    price: 11.90,
    category: "ENTRÉES - Nos Fritures",
    image: "/images/chingri-pakora.png"
  },

  // --- ENTRÉES - Spécialités Tandoori (Grillades) ---
  {
    id: "murgi-tikka",
    name: "Murgi Tikka",
    description: "Morceaux de poulet marinés sauce épices et grillés.",
    price: 10.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/murgi-tikka.png"
  },
  {
    id: "agneau-tikka",
    name: "Agneau Tikka",
    description: "Morceaux d'agneau marinés sauce épices et grillés.",
    price: 13.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/agneau-tikka.png"
  },
  {
    id: "grill-mixte",
    name: "Grill Mixte Spécial Royal Bengale",
    description: "Agneau, poulet, brochettes de bœuf, gambas, samosa, viande.",
    price: 24.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/grill-mixte.png"
  },
  {
    id: "poulet-tandoori",
    name: "Poulet Tandoori (ou Wings)",
    description: "Pièces de poulet marinées et grillées.",
    price: 9.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/poulet-tandoori.png",
    options: [
      {
        title: "Choix du morceau",
        required: true,
        choices: ["Cuisse de Poulet", "Chicken Wings"]
      }
    ]
  },
  {
    id: "gambas-tandoori",
    name: "Gambas Tandoori",
    description: "4 pièces (env. 300gr), ail, gingembre, Tandoori, massala.",
    price: 19.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/gambas-tandoori.png"
  },
  {
    id: "seekh-kebab",
    name: "Seekh Kebab",
    description: "Viande hachée en forme de long cigare grillé.",
    price: 10.90,
    category: "ENTRÉES - Spécialités Tandoori",
    image: "/images/seekh-kebab.png"
  },

  // --- LES PLATS (Sauces) ---
  {
    id: "curry",
    name: "Curry",
    description: "Sauce aux épices mijotés.",
    price: 15.90,
    category: "LES PLATS (Sauces)",
    image: "/images/curry.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "madras",
    name: "Madras",
    description: "Sauce aux 24 épices.",
    price: 15.90,
    category: "LES PLATS (Sauces)",
    image: "/images/madras.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "makhani",
    name: "Makhani (Très Doux)",
    description: "Sauce tomate, poudre d'amande, beurre indien, safran.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/makhani.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "bengale",
    name: "Bengale",
    description: "Sauce 'maison' avec poudre d'amande, pistache et gingembre.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/bengale.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "massala",
    name: "Massala",
    description: "Sauce 'maison' légèrement pimentée, poudre d'amande et pistaches.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/massala.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "vindaloo",
    name: "Vindaloo",
    description: "Sauce pimentée à la poudre de cajou, amande et pommes de terre.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/vindaloo.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "jalferazi",
    name: "Jalferazi",
    description: "Sauce mijotée avec oignons, poivrons, curcuma, tomate et coriandre.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/jalferazi.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "shahi-korma",
    name: "Shahi Korma (Très Doux)",
    description: "Sauce à la crème, poudre d'amande, coco, pistache, légèrement sucrée.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/shahi-korma.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "kowrai",
    name: "Kowrai",
    description: "Oignons, poivrons et tomates sautés à la coriandre, sauce maison.",
    price: 18.90,
    category: "LES PLATS (Sauces)",
    image: "/images/kowrai.png",
    options: [{ title: "Choix de la viande", required: true, choices: MEAT_OPTIONS }]
  },
  {
    id: "oceanien",
    name: "Océanien",
    description: "Filet de saumon Label Rouge, crème fraîche, safran, citron.",
    price: 20.90,
    category: "LES PLATS (Sauces)",
    image: "/images/oceanien.png"
  },
  {
    id: "galda-chingri",
    name: "Galda Chingri",
    description: "Gambas 16/20 du Bangladesh.",
    price: 19.90,
    category: "LES PLATS (Sauces)",
    image: "/images/galda-chingri.png",
    options: [
        { title: "Sauce", required: true, choices: ["Sauce Massala", "Sauce Vindaloo"] }
    ]
  },
  {
    id: "tikka-massala",
    name: "Murgi ou Titor Tikka Massala",
    description: "Morceaux de dinde ou poulet grillés, sauce oignons et poivrons.",
    price: 17.90,
    category: "LES PLATS (Sauces)",
    image: "/images/tikka-massala.png",
    options: [
        { title: "Viande", required: true, choices: ["Poulet Tikka", "Dinde Tikka"] }
    ]
  },

  // --- PLATS LÉGUMES (Végétariens) ---
  {
    id: "sobji-curry",
    name: "Sobji Curry Mixtes",
    description: "Curry de légumes mixtes, pommes de terre, petits pois, choux fleurs, poivrons verts.",
    price: 12.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/sobji-curry.png"
  },
  {
    id: "alou-saag",
    name: "Alou Saag",
    description: "Pomme de terre, curry d'épinards avec de la crème.",
    price: 12.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/alou-saag.png"
  },
  {
    id: "dal-makani",
    name: "Dal Makani",
    description: "Lentilles indiennes mijotée au beurre indien.",
    price: 12.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/dal-makani.png"
  },
  {
    id: "baigan-borta",
    name: "Baigan Borta",
    description: "Aubergines cuites au feu de charbon de bois, crème, aromatisés aux épices.",
    price: 12.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/baigan-borta.png"
  },
  {
    id: "alo-kopi-korma",
    name: "Alo Kopi Korma (Très Doux)",
    description: "Choux fleurs, pomme de terre, petits pois, poudre d'amande et de noix de coco, crème, épices douces et légèrement sucrées.",
    price: 15.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/alo-kopi-korma.png"
  },
  {
    id: "palak-paneer",
    name: "Palak Paneer (Très Doux)",
    description: "Epinards hachés à la crème et aux épices.",
    price: 12.90,
    category: "PLATS LÉGUMES (Végétariens)",
    image: "/images/palak-paneer.png"
  },

  // --- PLATS RIZ ET BIRYANIES ---
  {
    id: "biryanie-poulet",
    name: "Biryanie Poulet",
    description: "Riz basmati au safran, légumes, coriandre fraîche et tomates avec au choix du poulet.",
    price: 17.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/biryanie-poulet.png"
  },
  {
    id: "biryanie-choix",
    name: "Biryanie (Dinde/Bœuf/Crevettes)",
    description: "Riz basmati au safran, légumes, coriandre fraîche et tomates avec au choix de la dinde, du bœuf ou des crevettes.",
    price: 18.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/biryanie-choix.png",
    options: [
        { title: "Choix", required: true, choices: ["Dinde", "Bœuf", "Crevettes"] }
    ]
  },
  {
    id: "sagol-biryanie",
    name: "Sagol Biryanie (Agneau)",
    description: "Morceaux d'agneau, riz basmati au safran, poudre de noix de cajou, poivrons, coriandre fraîche.",
    price: 20.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/sagol-biryanie.png"
  },
  {
    id: "sobji-biryanie",
    name: "Sobji Biryanie (Légumes)",
    description: "Légumes mixtes, riz basmati au safran, poudre d'amande, coriandre fraîche.",
    price: 16.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/sobji-biryanie.png"
  },
  {
    id: "galda-chingri-biryanie",
    name: "Galda Chingri Biryanie (Gambas)",
    description: "Gambas (16/20) décortiquées, riz basmati au safran, légumes, coriandre fraîche et tomates.",
    price: 21.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/galda-chingri-biryanie.png"
  },
  {
    id: "biryanie-royal",
    name: "Biryanie Spécial Royal Bengale",
    description: "Agneau, bœuf, poulet, riz basmati au safran avec des légumes, coriandre fraîche.",
    price: 24.90,
    category: "PLATS RIZ ET BIRYANIES",
    image: "/images/biryanie-royal.png"
  },

  // --- ACCOMPAGNEMENTS (Pains & Riz) ---
  {
    id: "nan-nature",
    name: "Nan Nature",
    description: "Pâte levée de farine de blé.",
    price: 2.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/nan-nature.png"
  },
  {
    id: "nan-fromage",
    name: "Nan au Fromage",
    description: "Fourrée au fromage.",
    price: 3.50,
    category: "ACCOMPAGNEMENTS",
    image: "/images/nan-fromage.png"
  },
  {
    id: "nan-ail-gingembre",
    name: "Nan Ail ou Gingembre",
    description: "Nan parfumé.",
    price: 4.50,
    category: "ACCOMPAGNEMENTS",
    image: "/images/nan-ail-gingembre.png",
    options: [{ title: "Parfum", required: true, choices: ["Ail", "Gingembre"] }]
  },
  {
    id: "nan-bangale",
    name: "Nan 'Le Bangale'",
    description: "Fourré poudre de noix de coco, amande, sucre (sucré).",
    price: 5.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/nan-bangale.png"
  },
  {
    id: "nan-fromage-ail-gingembre",
    name: "Nan Fromage & Ail/Gingembre",
    description: "Nan au fromage parfumé.",
    price: 5.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/nan-fromage-ail-gingembre.png",
    options: [{ title: "Parfum", required: true, choices: ["Ail", "Gingembre"] }]
  },
  {
    id: "paratha",
    name: "Paratha",
    description: "Pain farine complète, grillé au beurre.",
    price: 3.50,
    category: "ACCOMPAGNEMENTS",
    image: "/images/paratha.png"
  },
  {
    id: "sobji-parata",
    name: "Sobji Parata",
    description: "Fourrée aux légumes mixtes.",
    price: 5.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/sobji-parata.png"
  },
  {
    id: "keema-nan",
    name: "Keema Nan",
    description: "Fourré à la viande hachée.",
    price: 5.50,
    category: "ACCOMPAGNEMENTS",
    image: "/images/keema-nan.png"
  },
  {
    id: "riz-nature",
    name: "Riz Basmati Nature",
    description: "Riz basmati blanc.",
    price: 4.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/riz-nature.png"
  },
  {
    id: "riz-safran",
    name: "Riz Basmati au Safran",
    description: "Riz basmati parfumé.",
    price: 5.00,
    category: "ACCOMPAGNEMENTS",
    image: "/images/riz-safran.png"
  },

  // --- DESSERTS ---
  {
    id: "halwa-suji",
    name: "Halwa Suji",
    description: "Gâteau de semoule aux fruits secs.",
    price: 6.00,
    category: "DESSERTS",
    image: "/images/halwa-suji.png"
  },
  {
    id: "kulfi",
    name: "Kulfi",
    description: "Glace indienne maison avec cardamome.",
    price: 7.50,
    category: "DESSERTS",
    image: "/images/kulfi.png"
  },
  {
    id: "glace-2-boules",
    name: "Glace au choix (2 boules)",
    description: "Glaces.",
    price: 5.90,
    category: "DESSERTS",
    image: "/images/glace-2-boules.png",
    options: [
      {
        title: "Boule 1",
        required: true,
        choices: GLACE_PARFUMS
      },
      {
        title: "Boule 2",
        required: true,
        choices: GLACE_PARFUMS
      }
    ]
  },
  {
    id: "salade-fruits",
    name: "Salade de fruits",
    description: "Fruits frais.",
    price: 7.00,
    category: "DESSERTS",
    image: "/images/salade-fruits.png"
  },
  {
    id: "paiache",
    name: "Paiache",
    description: "Lait, crème fraîche, poudre de pistache et amande, eau de rose.",
    price: 6.90,
    category: "DESSERTS",
    image: "/images/paiache.png"
  },
  {
    id: "sorbet-3-boules",
    name: "Sorbet au choix (3 boules)",
    description: "Sorbets.",
    price: 6.90,
    category: "DESSERTS",
    image: "/images/sorbet-3-boules.png",
    options: [
      {
        title: "Boule 1",
        required: true,
        choices: SORBET_PARFUMS
      },
      {
        title: "Boule 2",
        required: true,
        choices: SORBET_PARFUMS
      },
      {
        title: "Boule 3",
        required: true,
        choices: SORBET_PARFUMS
      }
    ]
  },
  {
    id: "gulab-jamun",
    name: "Gulab Jamun",
    description: "Pâtisserie maison (boule de lait, sirop au miel).",
    price: 6.00,
    category: "DESSERTS",
    image: "/images/gulab-jamun.png"
  },

  // --- BOISSONS ---
  {
    id: "soda",
    name: "Soda (33cl)",
    description: "Boissons fraîches.",
    price: 3.90,
    category: "BOISSONS",
    image: "/images/soda.png",
    options: [
      {
        title: "Choix de la boisson",
        required: true,
        choices: ["Coca-Cola", "Coca Light", "Coca Zero", "Fanta", "Orangina", "7Up", "Ice Tea"]
      }
    ]
  },
  {
    id: "lassi",
    name: "Lassi",
    description: "Boisson traditionnelle indienne à base de yaourt.",
    price: 5.00,
    category: "BOISSONS",
    image: "/images/lassi.png",
    options: [
      {
        title: "Parfum",
        required: true,
        choices: [
            "Nature (5.00€)", 
            "Salé (5.90€)", 
            "Sucré (5.90€)", 
            "Rose (7.00€)", 
            "Banane (7.00€)", 
            "Mangue (7.00€)"
        ]
      }
    ]
  },
  {
    id: "eau",
    name: "Eau Minérale",
    description: "Bouteille d'eau.",
    price: 3.90,
    category: "BOISSONS",
    image: "/images/eau.png",
  }
];