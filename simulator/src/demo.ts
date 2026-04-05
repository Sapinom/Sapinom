import { simulate, UserProfile, DecisionParams } from './engine/Simulator';

// ============ DEMO ============

const paul: UserProfile = {
  monthlyIncome: 2200,
  monthlySavings: 400,
  totalSavings: 5000,
  monthlyExpenses: 1800,
  city: 'paris',
  age: 23,
  situation: 'salarie',
};

console.log('='.repeat(60));
console.log('  SIMULATEUR DE DECISIONS DE VIE');
console.log('='.repeat(60));

// --- Test 1: Voyage au Japon ---
console.log('\n📍 DECISION: Partir au Japon 2 semaines\n');

const voyageResult = simulate(paul, {
  category: 'voyage',
  params: { destination: 'japon', duration: 14, budget: 3000, travelers: 1, style: 'standard' },
});

printResult(voyageResult);

// --- Test 2: Acheter un MacBook ---
console.log('\n📍 DECISION: Acheter un MacBook Pro\n');

const achatResult = simulate(paul, {
  category: 'achat',
  params: { item: 'MacBook Pro', price: 2000, credit: false, monthlyUse: 0 },
});

printResult(achatResult);

// --- Test 3: Passer freelance ---
console.log('\n📍 DECISION: Passer freelance\n');

const carriereResult = simulate(paul, {
  category: 'carriere',
  params: { type: 'freelance', currentSalary: 2200, expectedIncome: 3500, transitionMonths: 3 },
});

printResult(carriereResult);

function printResult(r: any) {
  const emoji = r.recommendation === 'go' ? '✅' : r.recommendation === 'wait' ? '⏳' : '❌';
  console.log(`  ${emoji} VERDICT: ${r.recommendationText}`);
  console.log(`  💡 ${r.keyInsight}`);
  console.log();
  
  for (const [key, scenario] of Object.entries(r.scenarios) as any) {
    console.log(`  ${scenario.emoji} ${scenario.name} (${Math.round(scenario.probability * 100)}% de chances):`);
    console.log(`     Cout total: ${scenario.totalCost}€`);
    console.log(`     Epargne apres: ${scenario.savingsAfter}€`);
    console.log(`     Recuperation: ${scenario.monthsToRecover} mois`);
    console.log(`     Score: ${scenario.score}/100 — ${scenario.verdict}`);
    console.log();
  }
  
  console.log('  ⚠️  Risques:');
  for (const risk of r.risks) {
    console.log(`     ${risk.emoji} ${risk.name} (${Math.round(risk.probability * 100)}%) — ${risk.impact}`);
  }

  // Timeline du scenario realiste
  console.log('\n  📊 Timeline (scenario realiste):');
  const timeline = r.scenarios.realiste.timeline;
  for (const t of timeline) {
    const bar = '█'.repeat(Math.max(0, Math.round(t.savings / Math.max(1, ...timeline.map((x: any) => Math.abs(x.savings))) * 20)));
    console.log(`     ${t.label.padEnd(8)} ${String(Math.round(t.savings)).padStart(8)}€ ${bar} ${t.event || ''}`);
  }
  console.log('\n' + '-'.repeat(60));
}
