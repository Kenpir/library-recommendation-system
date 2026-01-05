export enum Century {
  C21 = '21st Century',
  C20 = '20th Century',
  C19 = '19th Century',
  C18 = '18th Century',
  C17 = '17th Century',
  C16 = '16th Century',
  C15 = '15th Century',
  C14 = '14th Century',
  C13 = '13th Century',
  C12 = '12th Century',
  C11 = '11th Century',
  C10 = '10th Century',
  C9 = '9th Century',
  C8 = '8th Century',
  C7 = '7th Century',
  C6 = '6th Century',
  C5 = '5th Century',
  C4 = '4th Century',
  C3 = '3rd Century',
  C2 = '2nd Century',
  C1 = '1st Century',
  BC = 'BC',
}

export const getCenturyFromYear = (year: number): string => {
  if (year <= 0) return 'BC';
  const century = Math.ceil(year / 100);

  // Handle suffixes
  const lastDigit = century % 10;
  const lastTwoDigits = century % 100;

  let suffix = 'th';
  if (lastTwoDigits < 11 || lastTwoDigits > 13) {
    if (lastDigit === 1) suffix = 'st';
    else if (lastDigit === 2) suffix = 'nd';
    else if (lastDigit === 3) suffix = 'rd';
  }

  return `${century}${suffix} Century`;
};
