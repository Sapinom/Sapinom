import * as readline from 'readline';
import { GameLoop } from './engine/GameLoop';
import { BUSINESS_TEMPLATES } from './data/businesses';
import { BusinessType } from './models/Business';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

let game: GameLoop;

function printStatus() {
  const w = game.getWorldSummary();
  const p = game.getPlayerSummary();
  console.log();
  console.log(`--- Jour ${w.day} | ${w.season} | ${w.weather} | Eco: ${w.economyCycle} ---`);
  console.log(`Cash: ${p.cash}$ | Niv: ${p.level} | Rep: ${p.reputation}/100 | Businesses: ${p.businesses}`);
  console.log(`Inflation: ${w.inflation} | Chomage: ${w.unemployment} | Taux: ${w.interestRate}`);
  if (w.activeEvents.length > 0) {
    console.log(`Events actifs: ${w.activeEvents.map(e => `${e.name} (${e.daysLeft}j)`).join(', ')}`);
  }
}

function printHelp() {
  console.log(`
COMMANDES:
  next [N]        Avancer de 1 ou N jours
  status          Afficher l'etat du monde et du joueur
  businesses      Lister vos entreprises
  open            Ouvrir un nouveau business
  hire <id>       Embaucher un employe
  upgrade <id>    Ameliorer un business
  price <id> <x>  Fixer le prix (0.5 a 2.0)
  loan <montant> <mois>  Emprunter a la banque
  events          Voir les derniers evenements
  catalog         Voir les types de business disponibles
  help            Afficher cette aide
  quit            Quitter
`);
}

function printCatalog() {
  console.log('\nBUSINESS DISPONIBLES:');
  for (const [key, t] of Object.entries(BUSINESS_TEMPLATES)) {
    console.log(`  ${key.padEnd(12)} | ${t.displayName.padEnd(20)} | Cout: ${t.baseCost}$ | Rev: ~${t.dailyBaseRevenue}$/j | ${t.description}`);
  }
}

function printBusinesses() {
  if (game.player.businesses.length === 0) {
    console.log('\nAucun business. Utilisez "open" pour en creer un.');
    return;
  }
  console.log('\nVOS BUSINESSES:');
  for (const b of game.player.businesses) {
    const emp = b.employees.length;
    console.log(
      `  [${b.id}] ${b.name} (${b.type}) Niv.${b.level} | ` +
      `${b.city} | ${emp} employes | Rep: ${b.reputation}/100 | ` +
      `Prix: x${b.priceMultiplier.toFixed(1)} | ` +
      `Dernier: +${Math.round(b.lastDailyRevenue)}$ / -${Math.round(b.lastDailyCost)}$`
    );
  }
}

async function handleOpen() {
  printCatalog();
  const type = await ask('\nType de business: ');
  if (!BUSINESS_TEMPLATES[type as BusinessType]) {
    console.log('Type invalide.');
    return;
  }
  const name = await ask('Nom: ');
  const city = await ask('Ville: ');
  const result = game.openBusiness(name || 'Mon Business', type as BusinessType, city || 'Paris');
  if (typeof result === 'string') {
    console.log(`Erreur: ${result}`);
  } else {
    console.log(`Ouvert ! ${result.name} [${result.id}] a ${result.city}`);
  }
}

function advanceDays(n: number) {
  const results = game.tickMultiple(n);
  for (const r of results) {
    const profit = r.reports.reduce((s, rep) => s + rep.profit, 0);
    const hasEvent = r.newEvent ? ` | EVENT: ${r.newEvent.name} (${r.newEvent.impact})` : '';
    console.log(
      `[Jour ${String(r.day).padStart(3)}] ${r.season.padEnd(7)} ${r.weather.padEnd(9)} | ` +
      `Profit: ${profit >= 0 ? '+' : ''}${Math.round(profit).toString().padStart(6)}$ | ` +
      `Cash: ${Math.round(r.playerCash).toString().padStart(8)}$${hasEvent}`
    );
  }
  printStatus();
}

async function main() {
  console.log('='.repeat(50));
  console.log('  BUSINESS SIMULATOR — Mode Interactif');
  console.log('='.repeat(50));

  const name = await ask('\nVotre nom: ');
  game = new GameLoop(name || 'Joueur');

  console.log(`\nBienvenue ${game.player.name} ! Vous avez ${game.player.cash}$.`);
  printHelp();
  printStatus();

  while (true) {
    const input = (await ask('\n> ')).trim();
    const [cmd, ...args] = input.split(/\s+/);

    switch (cmd) {
      case 'next':
      case 'n':
        advanceDays(Math.max(1, parseInt(args[0]) || 1));
        break;

      case 'status':
      case 's':
        printStatus();
        break;

      case 'businesses':
      case 'b':
        printBusinesses();
        break;

      case 'open':
      case 'o':
        await handleOpen();
        break;

      case 'hire':
      case 'h': {
        const id = args[0];
        if (!id) { console.log('Usage: hire <business_id>'); break; }
        const r = game.hireEmployee(id);
        console.log(typeof r === 'string' ? r : `Embauche: ${r.name} (perf: ${r.performance}, salaire: ${r.salary}$/mois)`);
        break;
      }

      case 'upgrade':
      case 'u': {
        const id = args[0];
        if (!id) { console.log('Usage: upgrade <business_id>'); break; }
        const r = game.upgradeBusiness(id);
        console.log(r === true ? 'Amelioration reussie !' : r);
        break;
      }

      case 'price':
      case 'p': {
        const [id, val] = args;
        if (!id || !val) { console.log('Usage: price <business_id> <0.5-2.0>'); break; }
        game.setPrice(id, parseFloat(val));
        console.log(`Prix mis a jour: x${parseFloat(val).toFixed(1)}`);
        break;
      }

      case 'loan':
      case 'l': {
        const [amount, months] = args;
        if (!amount || !months) { console.log('Usage: loan <montant> <mois>'); break; }
        const r = game.takeLoan(parseInt(amount), parseInt(months));
        console.log(typeof r === 'string' ? r : `Emprunt: ${r.amount}$ sur ${r.totalMonths} mois (${Math.round(r.monthlyPayment)}$/mois)`);
        break;
      }

      case 'events':
      case 'e':
        const evts = game.getRecentEvents(10);
        if (evts.length === 0) { console.log('Aucun evenement pour le moment.'); break; }
        evts.forEach(e => console.log(`  [Jour ${e.day}] (${e.impact}) ${e.message}`));
        break;

      case 'catalog':
      case 'c':
        printCatalog();
        break;

      case 'help':
        printHelp();
        break;

      case 'quit':
      case 'q':
        console.log('\nMerci d\'avoir joue !');
        const ps = game.getPlayerSummary();
        console.log(`Score final: ${ps.cash}$ | Niveau ${ps.level} | ${ps.businesses} business(es)`);
        rl.close();
        return;

      default:
        if (cmd) console.log('Commande inconnue. Tapez "help".');
        break;
    }
  }
}

main().catch(console.error);
