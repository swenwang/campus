import { ethers } from 'ethers';

export const A_ADDRESS = import.meta.env?.VITE_A_TOKEN_ADDRESS || '0xf2E21e7355E4e550E7053250ABE5a8d6849722ef';
export const B_ADDRESS = import.meta.env?.VITE_B_TOKEN_ADDRESS || '0x20435cB6da6dC84C56889E2568FB049034ed2C6d';
export const EX_ADDRESS = import.meta.env?.VITE_EXCHANGE_ADDRESS || '0x082aE3a47069edBCbB159Ef361509ff67468b10B';
export const A_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function owner() view returns (address)',
  'function ATTENDANCE_VERSION() view returns (uint256)',
  'function claimToken(string,uint256,bytes)',
];
export const B_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
];
export const EX_ABI = [
  'function getCurrentRate() view returns (uint256)',
  'function EXCHANGE_VERSION() view returns (uint256)',
  'function aToken() view returns (address)',
  'function bToken() view returns (address)',
  'function quoteExchange(uint256) view returns (uint256)',
  'function exchangeForB(uint256,uint256)',
];
export function contracts(runner) {
  return {
    a: new ethers.Contract(A_ADDRESS, A_ABI, runner),
    b: new ethers.Contract(B_ADDRESS, B_ABI, runner),
    ex: new ethers.Contract(EX_ADDRESS, EX_ABI, runner),
  };
}
export const attendanceTypes = { Attendance: [
  { name: 'classId', type: 'string' },
  { name: 'student', type: 'address' },
  { name: 'deadline', type: 'uint256' },
] };
export function attendanceDomain(chainId, verifyingContract = A_ADDRESS) {
  return { name: 'CampusAttendance', version: '2', chainId, verifyingContract };
}
export function validateClassId(value) {
  const id = value.trim();
  if (!id || ethers.toUtf8Bytes(id).length > 128) throw new Error('Class ID must contain 1–128 UTF-8 bytes.');
  return id;
}
export function parseAmount(value) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) throw new Error('Enter a positive decimal amount with at most 18 decimal places.');
  const amount = ethers.parseEther(value);
  if (amount <= 0n || amount > ethers.parseEther('100')) throw new Error('Enter an amount greater than 0 and at most 100 BTK.');
  return amount;
}
