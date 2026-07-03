export function numberToWords(num: number, currency: string = 'INR'): string {
  if (num === 0) return 'Zero Only';
  
  // Clean up decimals
  const mainNum = Math.floor(num);
  const paise = Math.round((num - mainNum) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  // Indian Numbering System (Lakhs, Crores) for INR, Standard Millions/Billions for others
  function convertIndian(n: number): string {
    if (n === 0) return '';
    let str = '';
    
    // Crore (1,00,00,000)
    if (n >= 10000000) {
      str += convertLessThanOneThousand(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    // Lakh (1,00,000)
    if (n >= 100000) {
      str += convertLessThanOneThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    // Thousand (1,000)
    if (n >= 1000) {
      str += convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    
    str += convertLessThanOneThousand(n);
    return str.trim();
  }

  function convertInternational(n: number): string {
    if (n === 0) return '';
    let str = '';

    // Billion
    if (n >= 1000000000) {
      str += convertLessThanOneThousand(Math.floor(n / 1000000000)) + ' Billion ';
      n %= 1000000000;
    }
    // Million
    if (n >= 1000000) {
      str += convertLessThanOneThousand(Math.floor(n / 1000000)) + ' Million ';
      n %= 1000000;
    }
    // Thousand
    if (n >= 1000) {
      str += convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }

    str += convertLessThanOneThousand(n);
    return str.trim();
  }

  const isINR = currency.toUpperCase() === 'INR';
  const mainWords = isINR ? convertIndian(mainNum) : convertInternational(mainNum);
  const currencyLabel = isINR ? 'Rupees' : currency.toUpperCase();
  const subCurrencyLabel = isINR ? 'Paise' : 'Cents';

  let result = `${currencyLabel} ${mainWords}`;

  if (paise > 0) {
    const paiseWords = isINR ? convertLessThanOneThousand(paise) : convertLessThanOneThousand(paise);
    result += ` and ${paiseWords} ${subCurrencyLabel}`;
  }

  return result.trim() + ' Only';
}
