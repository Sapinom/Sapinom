import { randFloat, randInt } from '../utils/random';
import { CONFIG } from '../data/config';

export interface Employee {
  id: string;
  name: string;
  salary: number;
  performance: number;    // 0.5 a 1.5 — multiplicateur de productivite
  morale: number;         // 0..100
  daysEmployed: number;
  isOnStrike: boolean;
  strikeDaysLeft: number;
}

const FIRST_NAMES = [
  'Alice', 'Bob', 'Clara', 'David', 'Emma', 'Fabien', 'Gina', 'Hugo',
  'Iris', 'Jules', 'Karine', 'Leo', 'Marie', 'Nathan', 'Olivia', 'Paul',
  'Rita', 'Sam', 'Tina', 'Victor',
];

const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia',
  'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel',
];

let nextEmployeeId = 1;

export function createEmployee(salaryLevel: number): Employee {
  const { EMPLOYEE } = CONFIG;
  const salary = Math.round(
    salaryLevel * randFloat(EMPLOYEE.BASE_SALARY_MIN, EMPLOYEE.BASE_SALARY_MAX)
  );
  const performance = randFloat(EMPLOYEE.PERFORMANCE_MIN, EMPLOYEE.PERFORMANCE_MAX);
  const firstName = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];

  return {
    id: `emp_${nextEmployeeId++}`,
    name: `${firstName} ${lastName}`,
    salary,
    performance: Math.round(performance * 100) / 100,
    morale: randInt(60, 90),
    daysEmployed: 0,
    isOnStrike: false,
    strikeDaysLeft: 0,
  };
}
