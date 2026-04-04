export interface Loan {
  id: string;
  amount: number;           // montant emprunte
  remainingAmount: number;  // capital restant du
  interestRate: number;     // taux annuel au moment de l'emprunt
  monthlyPayment: number;
  monthsRemaining: number;
  totalMonths: number;
}

let nextLoanId = 1;

export function createLoan(
  amount: number,
  annualRate: number,
  durationMonths: number,
): Loan {
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths));

  return {
    id: `loan_${nextLoanId++}`,
    amount,
    remainingAmount: amount,
    interestRate: annualRate,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    monthsRemaining: durationMonths,
    totalMonths: durationMonths,
  };
}
