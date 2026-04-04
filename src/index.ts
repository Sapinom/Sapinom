// Business Simulator — Point d'entree et exports publics

export { GameLoop, DayResult } from './engine/GameLoop';
export { WorldState, Season, WeatherType, EconomyCycle } from './engine/WorldState';
export { Player, createPlayer } from './models/Player';
export { Business, BusinessType, createBusiness } from './models/Business';
export { Employee, createEmployee } from './models/Employee';
export { Loan, createLoan } from './models/Loan';
export { BUSINESS_TEMPLATES } from './data/businesses';
export { ALL_EVENTS } from './data/events';
export { CONFIG } from './data/config';

// --- Demo rapide ---
import { GameLoop } from './engine/GameLoop';

function runDemo() {
  console.log('='.repeat(60));
  console.log('  BUSINESS SIMULATOR — Demo de simulation (90 jours)');
  console.log('='.repeat(60));
  console.log();

  const game = new GameLoop('Joueur Demo');

  // Le joueur ouvre un food truck (pas cher)
  const foodTruck = game.openBusiness('Chez Marcel', 'food_truck', 'Paris');
  if (typeof foodTruck === 'string') {
    console.log('Erreur:', foodTruck);
    return;
  }
  console.log(`Ouvert: ${foodTruck.name} (${foodTruck.type}) a ${foodTruck.city}`);

  // Embaucher un employe
  const emp = game.hireEmployee(foodTruck.id);
  if (typeof emp !== 'string') {
    console.log(`Embauche: ${emp.name} (perf: ${emp.performance}, salaire: ${emp.salary}$/mois)`);
  }

  // Apres 20 jours, ouvrir un restaurant
  console.log('\n--- Simulation de 90 jours ---\n');

  let restaurantOpened = false;

  for (let d = 0; d < 90; d++) {
    const result = game.tick();

    // Ouvrir un restaurant au jour 20 si assez de cash
    if (d === 20 && !restaurantOpened) {
      const resto = game.openBusiness('Le Petit Bistro', 'restaurant', 'Paris');
      if (typeof resto !== 'string') {
        restaurantOpened = true;
        console.log(`[Jour ${result.day}] Ouvert: ${resto.name}`);
        game.hireEmployee(resto.id);
        game.hireEmployee(resto.id);
      }
    }

    // Afficher un rapport tous les 7 jours ou quand il y a un evenement
    if (result.day % 7 === 0 || result.newEvent) {
      const totalProfit = result.reports.reduce((s, r) => s + r.profit, 0);
      console.log(
        `[Jour ${String(result.day).padStart(3)}] ` +
        `${result.season.padEnd(8)} | ${result.weather.padEnd(9)} | ` +
        `${result.economyCycle.padEnd(10)} | ` +
        `Profit: ${totalProfit >= 0 ? '+' : ''}${Math.round(totalProfit).toString().padStart(6)}$ | ` +
        `Cash: ${Math.round(result.playerCash).toString().padStart(8)}$` +
        (result.newEvent ? ` | EVENT: ${result.newEvent.name} (${result.newEvent.impact})` : ''),
      );
    }
  }

  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('  RAPPORT FINAL');
  console.log('='.repeat(60));

  const ps = game.getPlayerSummary();
  const ws = game.getWorldSummary();

  console.log(`\n  Joueur: ${ps.name}`);
  console.log(`  Niveau: ${ps.level} (XP: ${ps.xp})`);
  console.log(`  Cash: ${ps.cash}$`);
  console.log(`  Total gagne: ${ps.totalEarned}$`);
  console.log(`  Total depense: ${ps.totalSpent}$`);
  console.log(`  Businesses: ${ps.businesses}`);
  console.log(`  Reputation: ${ps.reputation}/100`);

  console.log(`\n  Economie: ${ws.economyCycle}`);
  console.log(`  Inflation: ${ws.inflation}`);
  console.log(`  Consommation: ${ws.consumption}`);
  console.log(`  Chomage: ${ws.unemployment}`);
  console.log(`  Taux d'interet: ${ws.interestRate}`);

  const events = game.getRecentEvents(10);
  if (events.length > 0) {
    console.log('\n  Derniers evenements:');
    events.forEach(e => {
      console.log(`    [Jour ${e.day}] ${e.message} (${e.impact})`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

// Lancer la demo si execute directement
if (require.main === module) {
  runDemo();
}
