export const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL || '';
export const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';
export const WHATSAPP_NUMBER = '5511946851028';

export const DEFAULT_PROCEDURES = [
  { id: 'limpeza', nome: 'Limpeza (Profilaxia)', precoPrivado: 150, volume: 40 },
  { id: 'rest-simples', nome: 'Restauracao simples', precoPrivado: 200, volume: 30 },
  { id: 'rest-composta', nome: 'Restauracao composta', precoPrivado: 350, volume: 20 },
  { id: 'extracao', nome: 'Extracao simples', precoPrivado: 250, volume: 10 },
  { id: 'canal', nome: 'Canal (Endodontia)', precoPrivado: 800, volume: 8 },
  { id: 'coroa', nome: 'Coroa/Protese', precoPrivado: 1500, volume: 5 },
];

export const DEFAULT_PLANS = [
  { id: 'amil', nome: 'Amil Dental', reembolso: 50 },
  { id: 'bradesco', nome: 'Bradesco Dental', reembolso: 55 },
  { id: 'sulamerica', nome: 'SulAmerica Odonto', reembolso: 60 },
  { id: 'odontoprev', nome: 'Odontoprev', reembolso: 40 },
  { id: 'uniodonto', nome: 'Uniodonto', reembolso: 45 },
  { id: 'metlife', nome: 'MetLife Dental', reembolso: 55 },
  { id: 'porto', nome: 'Porto Seguro Odonto', reembolso: 55 },
];
