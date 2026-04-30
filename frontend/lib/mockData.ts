export interface Branch {
  id: string;
  name: string;
  city: string;
  pin: string;
}

export interface BranchStock {
  name: string;
  qty: number;
}

export interface Product {
  name: string;
  sku: string;
  style: string;
  price: number;
  priceSale: number | null;
  category: string;
  color: string;
  size: string;
  imageBg: string;
  imageLabel: string;
  branches: BranchStock[];
  allSizes?: string[];
  availableSizes?: string[];
}

export const BRANCHES: Branch[] = [
  { id: 'perisur',    name: 'Perisur',    city: 'Ciudad de México', pin: '1234' },
  { id: 'interlomas', name: 'Interlomas', city: 'Huixquilucan',     pin: '2345' },
  { id: 'satelite',   name: 'Satélite',   city: 'Naucalpan',        pin: '3456' },
  { id: 'santafe',    name: 'Santa Fe',   city: 'Ciudad de México', pin: '4567' },
];

export const PRODUCTS: Record<string, Product> = {
  '7401234567890': {
    name: 'Bota Roper Hombre',
    sku: 'ARW10001-7',
    style: 'WMS4440',
    price: 2890,
    priceSale: null,
    category: 'Calzado',
    color: 'Café oscuro',
    size: '27 MX',
    imageBg: '#c9a87a',
    imageLabel: 'Bota Roper\nCafé oscuro',
    branches: [
      { name: 'Perisur',    qty: 14 },
      { name: 'Interlomas', qty: 3  },
      { name: 'Satélite',   qty: 0  },
      { name: 'Santa Fe',   qty: 7  },
    ],
    allSizes: ['25 MX', '26 MX', '27 MX', '28 MX', '29 MX'],
    availableSizes: ['26 MX', '27 MX', '28 MX'],
  },
  '7401234567891': {
    name: 'Bota WorkHog XT',
    sku: 'ARW10042-9',
    style: 'WMW4441',
    price: 4250,
    priceSale: 3699,
    category: 'Calzado',
    color: 'Negro',
    size: '28 MX',
    imageBg: '#2d2d2d',
    imageLabel: 'WorkHog XT\nNegro',
    branches: [
      { name: 'Perisur',    qty: 6  },
      { name: 'Interlomas', qty: 0  },
      { name: 'Satélite',   qty: 2  },
      { name: 'Santa Fe',   qty: 1  },
    ],
    allSizes: ['26 MX', '27 MX', '28 MX', '29 MX'],
    availableSizes: ['26 MX', '28 MX', '29 MX'],
  },
  '7401234567892': {
    name: 'Camisa Venttek Manga Larga',
    sku: 'ARW20015-L',
    style: 'MEK0441',
    price: 1290,
    priceSale: null,
    category: 'Ropa',
    color: 'Azul marino',
    size: 'L',
    imageBg: '#1e3a5f',
    imageLabel: 'Camisa Venttek\nAzul marino',
    branches: [
      { name: 'Perisur',    qty: 32 },
      { name: 'Interlomas', qty: 18 },
      { name: 'Satélite',   qty: 9  },
      { name: 'Santa Fe',   qty: 11 },
    ],
    allSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableSizes: ['S', 'M', 'L', 'XL'],
  },
  '7401234567893': {
    name: 'Jeans M4 Relaxed',
    sku: 'ARW30008-32',
    style: 'M44291',
    price: 1590,
    priceSale: 1290,
    category: 'Ropa',
    color: 'Índigo',
    size: '32×30',
    imageBg: '#3b4d6e',
    imageLabel: 'Jeans M4\nÍndigo',
    branches: [
      { name: 'Perisur',    qty: 0  },
      { name: 'Interlomas', qty: 2  },
      { name: 'Satélite',   qty: 0  },
      { name: 'Santa Fe',   qty: 4  },
    ],
    allSizes: ['30x30', '32x30', '34x32', '36x32'],
    availableSizes: ['32x30', '36x32'],
  },
  '7401234567894': {
    name: 'Cinturón de Cuero Clásico',
    sku: 'ARW40003-38',
    style: 'BA451M',
    price: 590,
    priceSale: null,
    category: 'Accesorios',
    color: 'Café',
    size: '38"',
    imageBg: '#8b5e3c',
    imageLabel: 'Cinturón\nCuero Café',
    branches: [
      { name: 'Perisur',    qty: 22 },
      { name: 'Interlomas', qty: 15 },
      { name: 'Satélite',   qty: 8  },
      { name: 'Santa Fe',   qty: 5  },
    ],
    allSizes: ['32"', '34"', '36"', '38"', '40"'],
    availableSizes: ['32"', '34"', '36"', '38"', '40"'],
  },
};
