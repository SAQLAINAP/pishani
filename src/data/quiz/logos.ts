import type { QuizQuestion } from './types'

/**
 * Picture clues for Taglines & Logos. `art` points at a simplified sketch in
 * ui/LogoArt. Each question is worded differently on purpose — the no-repeat
 * shuffle bag is keyed by question text.
 */
export const taglinesLogos: QuizQuestion[] = [
  { art: 'nike', q: 'This swoosh belongs to which sportswear brand?', a: 'Nike', wrong: ['Puma', 'Reebok', 'Under Armour'] },
  { art: 'adidas', q: 'Three slanted bars — which sportswear giant uses this mark?', a: 'Adidas', wrong: ['Puma', 'Reebok', 'Fila'] },
  { art: 'mcdonalds', q: 'Golden arches on red — which fast-food chain?', a: "McDonald's", wrong: ['Burger King', 'KFC', "Wendy's"] },
  { art: 'apple', q: 'A fruit with a bite taken out — which tech company?', a: 'Apple', wrong: ['Samsung', 'BlackBerry', 'Xiaomi'] },
  { art: 'olympics', q: 'What do these five interlocking rings represent?', a: 'Olympic Games', wrong: ['Commonwealth Games', 'FIFA World Cup', 'Asian Games'] },
  { art: 'mercedes', q: 'A three-pointed star in a ring — which carmaker?', a: 'Mercedes-Benz', wrong: ['BMW', 'Audi', 'Volkswagen'] },
  { art: 'audi', q: 'Four linked rings side by side — which car brand?', a: 'Audi', wrong: ['Volkswagen', 'Opel', 'Skoda'] },
  { art: 'mitsubishi', q: 'Three red diamonds meeting at a point — which company?', a: 'Mitsubishi', wrong: ['Toyota', 'Nissan', 'Mazda'] },
  { art: 'toyota', q: 'Three overlapping ellipses — which Japanese carmaker?', a: 'Toyota', wrong: ['Honda', 'Suzuki', 'Hyundai'] },
  { art: 'mastercard', q: 'Red and yellow circles overlapping — which payment network?', a: 'Mastercard', wrong: ['Visa', 'American Express', 'RuPay'] },
  { art: 'target', q: 'This red bullseye is the logo of which US retailer?', a: 'Target', wrong: ['Walmart', 'Costco', 'Tesco'] },
  { art: 'pepsi', q: 'A red, white and blue globe — which soft drink?', a: 'Pepsi', wrong: ['Coca-Cola', 'Sprite', 'Fanta'] },
  { art: 'bmw', q: 'A roundel quartered blue and white — which carmaker?', a: 'BMW', wrong: ['Mercedes-Benz', 'Audi', 'Porsche'] },
  { art: 'chevrolet', q: 'A golden bowtie — which car brand?', a: 'Chevrolet', wrong: ['Ford', 'Dodge', 'Buick'] },
  { art: 'microsoft', q: 'Four coloured squares in a grid — which tech company?', a: 'Microsoft', wrong: ['Google', 'Apple', 'IBM'] },
  { art: 'youtube', q: 'A white play button on red — which platform?', a: 'YouTube', wrong: ['Netflix', 'Vimeo', 'Twitch'] },
  { art: 'instagram', q: 'A camera outline in a sunset gradient — which app?', a: 'Instagram', wrong: ['Snapchat', 'Pinterest', 'TikTok'] },
  { art: 'spotify', q: 'Three curved lines on a green circle — which music app?', a: 'Spotify', wrong: ['Gaana', 'JioSaavn', 'SoundCloud'] },
  { art: 'android', q: 'This green robot head is the mascot of which operating system?', a: 'Android', wrong: ['Linux', 'Windows', 'Ubuntu'] },
  { art: 'dominos', q: 'A red-and-blue domino tile — which pizza chain?', a: "Domino's", wrong: ['Pizza Hut', "Papa John's", 'Subway'] },
  { art: 'amazon', q: 'This orange smile-shaped arrow is from which company?', a: 'Amazon', wrong: ['Flipkart', 'eBay', 'Alibaba'] },
  { art: 'tata', q: 'A stylised T inside an oval — which Indian group?', a: 'Tata', wrong: ['Mahindra', 'Reliance', 'Birla'] },
  { art: 'chrome', q: 'Red, yellow and green around a blue centre — which browser?', a: 'Google Chrome', wrong: ['Firefox', 'Safari', 'Microsoft Edge'] },
  { art: 'hyundai', q: 'A slanted H inside an oval — which carmaker?', a: 'Hyundai', wrong: ['Honda', 'Hero', 'Hindustan Motors'] },
  { art: 'dropbox', q: 'An open box built from blue diamonds — which cloud storage service?', a: 'Dropbox', wrong: ['Google Drive', 'OneDrive', 'Box'] },
]
