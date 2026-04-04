// Emojis and display names
export const WEATHER_EMOJI: Record<string, string> = {
  sun: '☀️', rain: '🌧️', storm: '⛈️', heatwave: '🔥',
  snow: '❄️', flood: '🌊', cloudy: '☁️',
};
export const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
};
export const SEASON_NAME: Record<string, string> = {
  spring: 'Printemps', summer: 'Été', autumn: 'Automne', winter: 'Hiver',
};
export const WEATHER_NAME: Record<string, string> = {
  sun: 'Soleil', rain: 'Pluie', storm: 'Orage', heatwave: 'Canicule',
  snow: 'Neige', flood: 'Inondation', cloudy: 'Nuageux',
};
export const ECO_COLOR: Record<string, string> = {
  growth: '#00e676', stable: '#ffd740', recession: '#ff5252',
};
export const ECO_NAME: Record<string, string> = {
  growth: 'Croissance', stable: 'Stable', recession: 'Récession',
};
export const BIZ_EMOJI: Record<string, string> = {
  restaurant: '🍽️', boutique: '🛍️', immobilier: '🏠', startup: '💻',
  food_truck: '🚚', garage: '🔧', hotel: '🏨', ferme: '🌾',
};

export const COLORS = {
  bg: '#0f0c29',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardBorder: 'rgba(255,255,255,0.1)',
  green: '#00e676',
  red: '#ff5252',
  yellow: '#ffd740',
  blue: '#448aff',
  purple: '#b388ff',
  text: '#f0f0f0',
  textDim: '#888',
};

// Game speed: 1 in-game day = this many real-world milliseconds
export const TICK_INTERVAL_MS = 2000; // 1 day every 2 seconds
export const STARTING_CASH = 5000;
export const DAYS_PER_SEASON = 30;

// Employee name pools
export const FIRST_NAMES = [
  'Alice', 'Bob', 'Clara', 'David', 'Emma', 'Fabien', 'Gina', 'Hugo',
  'Iris', 'Jules', 'Karine', 'Léo', 'Marie', 'Nathan', 'Olivia', 'Paul',
];
export const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau',
];
