export interface Operator {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
}

export const DEMO_OPERATOR: Operator = {
  id: 'op_marta',
  name: 'Marta Kovač',
  role: 'Payments operator',
  initials: 'MK',
};
