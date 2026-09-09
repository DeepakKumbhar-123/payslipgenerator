'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Settings2,
  Building2,
  UserRound,
  WalletCards,
  TrendingUp,
  MinusCircle,
  PenTool,
  FileText,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

type Row = {
  name: string;
  rate: string;
  amount: string;
};

type Deduction = {
  name: string;
  amount: string;
};

type CustomField = {
  name: string;
  value: string;
};

type Employee = {
  payDate: string;
  name: string;
  working: string;
  present: string;
  uan: string;
  esic: string;
  customFields: CustomField[];
};

type PayField = {
  name: string;
  value: string;
};

type Company = {
  name: string;
  address: string;
};

type PayslipData = {
  company: Company;
  employee: Employee;
  payFields: PayField[];
  earnings: Row[];
  deductions: Deduction[];
  advance: {
    total: string;
    deduction: string;
    balance: string;
  };
  stamp: string;
};

const initialEarnings: Row[] = [
  { name: 'BASIC', rate: '', amount: '' },
  { name: 'HRA', rate: '10%', amount: '' },
  { name: 'CON.', rate: '', amount: '' },
  { name: 'Other Allowance', rate: '', amount: '' },
  { name: 'Over Time', rate: '', amount: '' },
];

const initialDeductions: Deduction[] = [
  { name: 'P.F.', amount: '' },
  { name: 'ESIC', amount: '' },
  { name: 'P.T.', amount: '' },
  { name: 'LWF', amount: '' },
  { name: 'LOAN', amount: '' },
];

const initialCompany: Company = {
  name: 'DEEPAK INDUSTRIAL SERVICES',
  address:
    'Shop No.3, Om Avinash CHS Ltd, Gaondevi, Near Shiv Mandir, Badlapur (E) – 421 503',
};

const initialEmployee: Employee = {
  payDate: '',
  name: '',
  working: '',
  present: '',
  uan: '',
  esic: '',
  customFields: [],
};

const initialPayFields: PayField[] = [];

function money(n: number) {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function payslipMonth(value: string) {
  if (!value) return '';

  const date = new Date(value + 'T00:00:00');

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  }

  return value;
}

function words(n: number) {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const two = (x: number) =>
    x < 20
      ? a[x]
      : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');

  const three = (x: number) =>
    x >= 100
      ? a[Math.floor(x / 100)] +
        ' Hundred' +
        (x % 100 ? ' And ' + two(x % 100) : '')
      : two(x);

  if (n === 0) return 'Zero Only';

  let x = Math.floor(Math.abs(n));
  let out = '';

  const crore = Math.floor(x / 10000000);
  x %= 10000000;

  const lakh = Math.floor(x / 100000);
  x %= 100000;

  const thousand = Math.floor(x / 1000);
  x %= 1000;

  if (crore) out += three(crore) + ' Crore ';
  if (lakh) out += three(lakh) + ' Lakh ';
  if (thousand) out += three(thousand) + ' Thousand ';
  if (x) out += three(x) + ' ';

  return out.trim() + ' Only';
}

function Slip({ data }: { data: PayslipData }) {
  const gross = data.earnings.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  const totalDed = data.deductions.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  const net = gross - totalDed;

  const rows = Math.max(
    data.earnings.length,
    data.deductions.length
  );

  return (
    <div className="paper" id="payslip-print">

      {/* HEADER */}
      <div className="slip-head">
        <img
          src="/default-logo.png"
          alt="Company logo"
          className="payslip-logo"
        />

        <div className="company-head">
          <div className="company-name">
            {data.company.name}
          </div>

          <div className="address">
            {data.company.address}
          </div>
        </div>

        <div className="month-head">
          <div>Payslip For the Month</div>
          <strong>
            {payslipMonth(data.employee.payDate)}
          </strong>
        </div>
      </div>

      {/* EMPLOYEE + PAY DETAILS */}
      <div className="employee-box">

        <div>
          <p>
            <b>Pay Date</b>
            <span>:</span>
            {data.employee.payDate}
          </p>

          <p>
            <b>Working Days</b>
            <span>:</span>
            {data.employee.working}
          </p>

          <p>
            <b>Present Days</b>
            <span>:</span>
            {data.employee.present}
          </p>

          {data.employee.customFields
            .filter((f) => f.name || f.value)
            .map((f, i) => (
              <p key={`employee-${i}`}>
                <b>{f.name}</b>
                <span>:</span>
                {f.value}
              </p>
            ))}
        </div>

        <div>
          <p>
            <b>Employee Name</b>
            <span>:</span>
            {data.employee.name}
          </p>

          <p>
            <b>UAN No.</b>
            <span>:</span>
            {data.employee.uan}
          </p>

          <p>
            <b>ESIC Card No.</b>
            <span>:</span>
            {data.employee.esic}
          </p>

          {data.payFields
            .filter((f) => f.name || f.value)
            .map((f, i) => (
              <p key={`pay-${i}`}>
                <b>{f.name}</b>
                <span>:</span>
                {f.value}
              </p>
            ))}
        </div>

      </div>

      {/* SALARY TABLE */}
      <table className="salary salary-with-advance">
        <thead>
          <tr>
            <th>Earnings</th>
            <th>Rate Per Day</th>
            <th>Earning</th>
            <th>Deductions</th>
            <th>Amount</th>
            <th>Advance</th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: Math.max(rows, 3) }).map((_, i) => (
            <tr key={i}>
              <td>{data.earnings[i]?.name || ''}</td>

              <td>{data.earnings[i]?.rate || ''}</td>

              <td>
                {data.earnings[i]
                  ? money(Number(data.earnings[i].amount) || 0)
                  : ''}
              </td>

              <td>{data.deductions[i]?.name || ''}</td>

              <td>
                {data.deductions[i]
                  ? money(Number(data.deductions[i].amount) || 0)
                  : ''}
              </td>

              <td className="advance-cell">
                {i === 0 && Number(data.advance.total) > 0 ? (
                  <div>
                    <span>Advance</span>
                    <em>:</em>
                    <b>{money(Number(data.advance.total) || 0)}</b>
                  </div>
                ) : null}

                {i === 1 && Number(data.advance.deduction) > 0 ? (
                  <div>
                    <span>Deducted</span>
                    <em>:</em>
                    <b>-{money(Number(data.advance.deduction) || 0)}</b>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}

          <tr className="totals">
            <td colSpan={2}>GROSS PAY</td>
            <td>{money(gross)}</td>
            <td>TOTAL DEDUCTION</td>
            <td>{money(totalDed)}</td>
            <td className="advance-balance-cell">
              {Number(data.advance.total) > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '7px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    paddingRight: '6px',
                  }}
                >
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>BALANCE</span>
                  <span style={{ fontWeight: 700 }}>:</span>
                  <b style={{ whiteSpace: 'nowrap' }}>
                    {money(Number(data.advance.balance) || 0)}
                  </b>
                </div>
              ) : null}
            </td>
          </tr>

          <tr className="netrow">
            <td colSpan={3}></td>
            <td>NET AMOUNT</td>
            <td>{money(net)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* NET PAY */}
      <div className="amount-box">
        <b>
          Net Amount = Gross Pay (₹ {money(gross)}) - Total Deduction (₹ {money(totalDed)}) = ₹ {money(net)}
        </b>

        <span>
          ({words(net)})
        </span>
      </div>

      {/* OPTIONAL STAMP */}
      {data.stamp ? (
        <div className="stamp-box">
          <img
            src={data.stamp}
            alt="Stamp / signature"
          />

          <span>
           Authorised Signatory 
          </span>
        </div>
      ) : null}

      {/* FOOTER */}
      <div className="foot">
        {data.stamp
          ? ''
          : 'This is a computer generated payslip and does not require a signature.'}
      </div>

    </div>
  );
}

export default function Home() {
  const [company, setCompany] =
    useState<Company>(initialCompany);

  const [employee, setEmployee] =
    useState<Employee>(initialEmployee);

  const [payFields, setPayFields] =
    useState<PayField[]>(initialPayFields);

  const [earnings, setEarnings] =
    useState<Row[]>(
      initialEarnings.map((r) => ({ ...r }))
    );

  const [deductions, setDeductions] =
    useState<Deduction[]>(
      initialDeductions.map((r) => ({ ...r }))
    );

  const [stamp, setStamp] =
    useState('');

  const [generated, setGenerated] =
    useState<PayslipData | null>(null);

  const [advanceTotal, setAdvanceTotal] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState('');

  const gross = earnings.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  const totalDed = deductions.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  const advanceBalance = Math.max(
    0,
    (Number(advanceTotal) || 0) - (Number(advanceDeduction) || 0)
  );

  const updateAdvanceDeduction = (value: string) => {
    setAdvanceDeduction(value);

    setDeductions((rows) =>
      rows.map((row) =>
        row.name.trim().toUpperCase() === 'LOAN'
          ? { ...row, amount: value }
          : row
      )
    );
  };

  const setEmp = (
    key: keyof Employee,
    value: string
  ) => {
    setEmployee((e) => ({
      ...e,
      [key]: value,
    }));
  };

  const setEarn = (
    i: number,
    key: keyof Row,
    value: string
  ) => {
    setEarnings((rows) => {
      const updated = rows.map((row, j) =>
        j === i
          ? { ...row, [key]: value }
          : row
      );

      const changedRow = updated[i];

      if (!changedRow) {
        return updated;
      }

      const changedName =
        changedRow.name.trim().toUpperCase();

      // BASIC = Rate Per Day × 26 fixed days
      if (
        changedName === 'BASIC' &&
        key === 'rate'
      ) {
        const basicRate =
          Number(value) || 0;

        const basicAmount =
          basicRate * 26;

        return updated.map((row) => {
          const name =
            row.name.trim().toUpperCase();

          if (name === 'BASIC') {
            return {
              ...row,
              amount:
                basicRate
                  ? String(basicAmount)
                  : '',
            };
          }

          // HRA = 10% of BASIC
          if (name === 'HRA') {
            return {
              ...row,
              rate: '10%',
              amount:
                basicAmount
                  ? String(basicAmount * 0.10)
                  : '',
            };
          }

          return row;
        });
      }

      return updated;
    });
  };

  const setDed = (
    i: number,
    key: keyof Deduction,
    value: string
  ) => {
    setDeductions((x) =>
      x.map((r, j) =>
        j === i
          ? { ...r, [key]: value }
          : r
      )
    );

    if (
      key === 'amount' &&
      deductions[i]?.name.trim().toUpperCase() === 'LOAN'
    ) {
      setAdvanceDeduction(value);
    }
  };

  const setEmpCustom = (
    i: number,
    key: keyof CustomField,
    value: string
  ) => {
    setEmployee((e) => ({
      ...e,
      customFields: e.customFields.map(
        (field, j) =>
          j === i
            ? {
                ...field,
                [key]: value,
              }
            : field
      ),
    }));
  };

  const setPayField = (
    i: number,
    key: keyof PayField,
    value: string
  ) => {
    setPayFields((fields) =>
      fields.map((field, j) =>
        j === i
          ? {
              ...field,
              [key]: value,
            }
          : field
      )
    );
  };

  /* ADD STAMP */
  const addStamp = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () =>
      setStamp(
        String(reader.result)
      );

    reader.readAsDataURL(file);
  };

  /* GENERATE */
  const generatePayslip = () => {
    setGenerated({
      company: {
        ...company,
      },

      employee: {
        ...employee,

        customFields:
          employee.customFields.map(
            (field) => ({
              ...field,
            })
          ),
      },

      payFields:
        payFields.map(
          (field) => ({
            ...field,
          })
        ),

      earnings:
        earnings.map(
          (row) => ({
            ...row,
          })
        ),

      deductions:
        deductions.map(
          (row) => ({
            ...row,
          })
        ),

      advance: {
        total: advanceTotal,
        deduction: advanceDeduction,
        balance: String(advanceBalance),
      },

      stamp,
    });

    setTimeout(() => {
      document
        .getElementById(
          'generated-slip'
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    }, 50);
  };

  /* RESET */
  const reset = () => {
    setCompany({
      ...initialCompany,
    });

    setEmployee({
      ...initialEmployee,
      customFields: [],
    });

    setPayFields([]);

    setEarnings(
      initialEarnings.map(
        (r) => ({
          ...r,
        })
      )
    );

    setDeductions(
      initialDeductions.map(
        (r) => ({
          ...r,
        })
      )
    );

    setAdvanceTotal('');
    setAdvanceDeduction('');

    setStamp('');

    setGenerated(null);
  };

  /* SAVE DIRECTLY AS A5 PDF */
  const print = async () => {
    const source = document.getElementById('payslip-print');

    if (!source) {
      alert('Please generate the payslip first.');
      return;
    }

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      // Render a dedicated A5 copy so the desktop layout/CSS
      // can never force the PDF into an A4-like proportion.
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      wrapper.style.width = '148mm';
      wrapper.style.height = '210mm';
      wrapper.style.background = '#fff';
      wrapper.style.overflow = 'hidden';
      wrapper.style.zIndex = '-1';

      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');

      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }

        .paper {
          width: 148mm !important;
          height: 210mm !important;
          max-width: 148mm !important;
          max-height: 210mm !important;
          margin: 0 !important;
          padding: 8mm 8mm 5mm !important;
          background: #fff !important;
          border: 0 !important;
          box-shadow: none !important;
          overflow: hidden !important;
          position: relative !important;
        }

        .slip-head {
          display: grid !important;
          grid-template-columns: 30mm 1fr 38mm !important;
          align-items: center !important;
          min-height: 28mm !important;
          height: 28mm !important;
          border-bottom: 1px solid #cfd4dc !important;
          padding-bottom: 2mm !important;
        }

        .slip-head img {
          max-width: 25mm !important;
          max-height: 22mm !important;
          object-fit: contain !important;
        }

        .company-head {
          text-align: left !important;
          padding-right: 2mm !important;
        }

        .company-name {
          font-size: 12px !important;
          line-height: 1.15 !important;
          margin-top: 0 !important;
        }

        .address {
          font-size: 7px !important;
          line-height: 1.25 !important;
          margin-top: 1mm !important;
        }

        .month-head {
          text-align: right !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: flex-end !important;
          gap: 1.5mm !important;
        }

        .month-head div {
          font-size: 8px !important;
          color: #555 !important;
        }

        .month-head strong {
          font-size: 10px !important;
          color: #000 !important;
        }

        .employee-box {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          margin: 3mm 0 4mm !important;
          padding: 5px 8px !important;
        }

        .employee-box p {
          display: grid !important;
          grid-template-columns: 27mm 4mm 1fr !important;
          margin: 2.5px 0 !important;
          font-size: 8.5px !important;
        }

        .salary {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 8.5px !important;
        }

        .salary-with-advance {
          table-layout: fixed !important;
        }

        .salary-with-advance th:nth-child(1),
        .salary-with-advance td:nth-child(1) {
          width: 22% !important;
        }

        .salary-with-advance th:nth-child(2),
        .salary-with-advance td:nth-child(2) {
          width: 14% !important;
        }

        .salary-with-advance th:nth-child(3),
        .salary-with-advance td:nth-child(3) {
          width: 13% !important;
        }

        .salary-with-advance th:nth-child(4),
        .salary-with-advance td:nth-child(4) {
          width: 19% !important;
        }

        .salary-with-advance th:nth-child(5),
        .salary-with-advance td:nth-child(5) {
          width: 12% !important;
        }

        .salary-with-advance th:nth-child(6),
        .salary-with-advance td:nth-child(6) {
          width: 20% !important;
        }

        .advance-cell {
          text-align: right !important;
          vertical-align: middle !important;
          padding: 2px 4px !important;
        }

        .advance-cell div,
        .advance-balance-cell div {
          display: grid !important;
          grid-template-columns: auto auto 1fr !important;
          align-items: center !important;
          column-gap: 3px !important;
          line-height: 1.2 !important;
          width: 100% !important;
        }

        .advance-cell span,
        .advance-balance-cell span {
          font-size: 7px !important;
          font-weight: 600 !important;
          text-align: left !important;
          white-space: nowrap !important;
        }

        .advance-cell em,
        .advance-balance-cell em {
          font-size: 7px !important;
          font-style: normal !important;
          font-weight: 600 !important;
        }

        .advance-cell b,
        .advance-balance-cell b {
          font-size: 7.5px !important;
          white-space: nowrap !important;
          text-align: right !important;
        }

        .advance-balance-cell {
          text-align: right !important;
          vertical-align: middle !important;
          padding: 2px 8px 2px 10px !important;
        }

        .advance-balance-cell div {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 8px !important;
          width: 100% !important;
          margin: 0 !important;
          padding-right: 4px !important;
          white-space: nowrap !important;
        }

        .advance-balance-cell span {
          text-align: left !important;
        }

        .advance-balance-cell em {
          padding: 0 !important;
          margin: 0 !important;
        }

        .advance-balance-cell b {
          text-align: right !important;
        }

        .salary th {
          padding: 5px 3px !important;
          font-size: 8.5px !important;
          height: 7mm !important;
        }

        .salary td {
          height: 6mm !important;
          padding: 3px 5px !important;
        }

        .salary .totals td {
          font-size: 8.5px !important;
          height: 7mm !important;
        }

        .netrow td {
          font-size: 9.5px !important;
          height: 7mm !important;
        }

        .amount-box {
          margin-top: 3mm !important;
          padding: 5px 7px !important;
          gap: 3px !important;
          font-size: 8.5px !important;
        }

        .amount-box b {
          font-size: 10.5px !important;
        }

        .stamp-box {
          margin-top: 3mm !important;
          min-height: 22mm !important;
          height: 22mm !important;
        }

        .stamp-box img {
          max-width: 35mm !important;
          max-height: 15mm !important;
          object-fit: contain !important;
        }

        .stamp-box span {
          font-size: 7px !important;
        }

        .foot {
          margin-top: 2mm !important;
          padding-top: 2mm !important;
          font-size: 7px !important;
        }
      `;

      wrapper.appendChild(style);
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Wait one frame so the browser lays out the clone at true A5 dimensions.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );

      const canvas = await html2canvas(clone, {
        width: Math.round((148 / 25.4) * 96),
        height: Math.round((210 / 25.4) * 96),
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(wrapper);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
        compress: true,
      });

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        148,
        210,
        undefined,
        'FAST'
      );

      const employeeName =
        employee.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') ||
        'Employee';

      const month =
        payslipMonth(employee.payDate)
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/gi, '') || 'Payslip';

      pdf.save(`${employeeName}-${month}-Payslip.pdf`);
    } catch (error) {
      console.error('A5 PDF generation failed:', error);
      alert('Could not create the A5 PDF. Please try again.');
    }
  };

  return (
    <main>

      {/* TOP BAR */}
      <header className="appbar">

        <div className="brand-area">

          <div className="brand-icon">
            <FileText size={20} />
          </div>

          <div>
            <strong>
              Deepak Industrial Services
            </strong>

            <span>
              Payslip Generator
            </span>
          </div>

        </div>

        <button
          className="ghost"
          onClick={reset}
        >
          <RotateCcw size={16} />
          Reset
        </button>

      </header>

      <div className="workspace single-column">

        <section className="panel form-panel">

          {/* PAGE TITLE */}
          <div className="page-intro">

            <div>
              <div className="eyebrow">
                <Sparkles size={14} />
                PAYROLL MANAGEMENT
              </div>

              <h1>
                Create Payslip
              </h1>

              <p>
                Enter employee and salary details to generate a professional payslip.
              </p>
            </div>

          </div>

          {/* COMPANY */}
          <div className="card">

            <div className="section-card-title">

              <div className="section-icon company-icon">
                <Building2 size={18} />
              </div>

              <div>
                <h3>Company Information</h3>
                <p>Enter your company details</p>
              </div>

            </div>

            <div className="card-content">

              <label>
                Company Name

                <input
                  value={company.name}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      name: e.target.value,
                    })
                  }
                />

              </label>

              <label>
                Address

                <textarea
                  value={company.address}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      address: e.target.value,
                    })
                  }
                />

              </label>

              <div className="default-logo-note">

                <div>
                  <span className="small-label">
                    COMPANY LOGO
                  </span>

                  <strong>
                    Default company logo
                  </strong>
                </div>

                <img
                  src="/default-logo.png"
                  alt="Company logo"
                />

              </div>

            </div>

          </div>

          {/* EMPLOYEE DETAILS */}
          <div className="card">

            <div className="card-head">

              <div className="section-card-title">

                <div className="section-icon employee-icon">
                  <UserRound size={18} />
                </div>

                <div>
                  <h3>Employee Details</h3>
                  <p>Employee identification information</p>
                </div>

              </div>

              <button
                type="button"
                className="add-button"
                onClick={() =>
                  setEmployee((e) => ({
                    ...e,

                    customFields: [
                      ...e.customFields,

                      {
                        name: '',
                        value: '',
                      },
                    ],
                  }))
                }
              >
                <Plus size={15} />
                Add Field
              </button>

            </div>

            <div className="card-content">

              <div className="grid2">

                <label>
                  Employee Name

                  <input
                    value={employee.name}
                    onChange={(e) =>
                      setEmp(
                        'name',
                        e.target.value
                      )
                    }
                    placeholder="Enter employee name"
                  />

                </label>

                <label>
                  UAN No.

                  <input
                    value={employee.uan}
                    onChange={(e) =>
                      setEmp(
                        'uan',
                        e.target.value
                      )
                    }
                    placeholder="Enter UAN number"
                  />

                </label>

                <label>
                  ESIC Card No.

                  <input
                    value={employee.esic}
                    onChange={(e) =>
                      setEmp(
                        'esic',
                        e.target.value
                      )
                    }
                    placeholder="Enter ESIC number"
                  />

                </label>

              </div>

              {employee.customFields.map(
                (field, i) => (

                  <div
                    className="custom-row"
                    key={`employee-field-${i}`}
                  >

                    <input
                      value={field.name}
                      onChange={(e) =>
                        setEmpCustom(
                          i,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Field name"
                    />

                    <input
                      value={field.value}
                      onChange={(e) =>
                        setEmpCustom(
                          i,
                          'value',
                          e.target.value
                        )
                      }
                      placeholder="Value"
                    />

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        setEmployee((e) => ({
                          ...e,

                          customFields:
                            e.customFields.filter(
                              (_, j) =>
                                j !== i
                            ),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                )
              )}

            </div>

          </div>

          {/* PAY DETAILS */}
          <div className="card">

            <div className="card-head">

              <div className="section-card-title">

                <div className="section-icon pay-icon">
                  <WalletCards size={18} />
                </div>

                <div>
                  <h3>Pay Details</h3>
                  <p>Attendance and payment period</p>
                </div>

              </div>

              <button
                type="button"
                className="add-button"
                onClick={() =>
                  setPayFields((fields) => [
                    ...fields,

                    {
                      name: '',
                      value: '',
                    },
                  ])
                }
              >
                <Plus size={15} />
                Add Field
              </button>

            </div>

            <div className="card-content">

              <div className="grid2">

                <label>
                  Pay Date

                  <input
                    type="date"
                    value={employee.payDate}
                    onChange={(e) =>
                      setEmp(
                        'payDate',
                        e.target.value
                      )
                    }
                  />

                </label>

                <label>
                  Working Days

                  <input
                    type="number"
                    value={employee.working}
                    onChange={(e) =>
                      setEmp(
                        'working',
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />

                </label>

                <label>
                  Present Days

                  <input
                    type="number"
                    value={employee.present}
                    onChange={(e) =>
                      setEmp(
                        'present',
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />

                </label>

              </div>

              {payFields.map(
                (field, i) => (

                  <div
                    className="custom-row"
                    key={`pay-field-${i}`}
                  >

                    <input
                      value={field.name}
                      onChange={(e) =>
                        setPayField(
                          i,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Field name"
                    />

                    <input
                      value={field.value}
                      onChange={(e) =>
                        setPayField(
                          i,
                          'value',
                          e.target.value
                        )
                      }
                      placeholder="Value"
                    />

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        setPayFields(
                          (fields) =>
                            fields.filter(
                              (_, j) =>
                                j !== i
                            )
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                )
              )}

            </div>

          </div>

          {/* EARNINGS */}
          <div className="card">

            <div className="card-head">

              <div className="section-card-title">

                <div className="section-icon earning-icon">
                  <TrendingUp size={18} />
                </div>

                <div>
                  <h3>Earnings</h3>
                  <p>Add salary and allowance components</p>
                </div>

              </div>

              <button
                type="button"
                className="add-button"
                onClick={() =>
                  setEarnings((x) => [
                    ...x,

                    {
                      name: '',
                      rate: '',
                      amount: '',
                    },
                  ])
                }
              >
                <Plus size={15} />
                Add
              </button>

            </div>

            <div className="card-content">

              <div className="row-labels">

                <span>Component</span>
                <span>Rate / Day</span>
                <span>Amount</span>
                <span></span>

              </div>

              {earnings.map(
                (row, i) => {
                  const isBasic =
                    row.name.trim().toUpperCase() === 'BASIC';

                  const isHra =
                    row.name.trim().toUpperCase() === 'HRA';

                  return (
                    <div
                      className="row-edit"
                      key={i}
                    >

                      <input
                        value={row.name}
                        onChange={(e) =>
                          setEarn(
                            i,
                            'name',
                            e.target.value
                          )
                        }
                        placeholder="Component"
                      />

                      <input
                        type={isHra ? 'text' : 'number'}
                        value={row.rate}
                        onChange={(e) =>
                          setEarn(
                            i,
                            'rate',
                            e.target.value
                          )
                        }
                        placeholder="Rate"
                        readOnly={isHra}
                      />

                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) =>
                          setEarn(
                            i,
                            'amount',
                            e.target.value
                          )
                        }
                        placeholder="Amount"
                        readOnly={isBasic || isHra}
                      />

                      <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        setEarnings((x) =>
                          x.filter(
                            (_, j) =>
                              j !== i
                          )
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                    </div>
                  );
                }
              )}

              <div className="total-edit">

                <span>
                  Gross Pay
                </span>

                <b>
                  ₹ {money(gross)}
                </b>

              </div>

            </div>

          </div>

          {/* DEDUCTIONS */}
          <div className="card">

            <div className="card-head">

              <div className="section-card-title">

                <div className="section-icon deduction-icon">
                  <MinusCircle size={18} />
                </div>

                <div>
                  <h3>Deductions</h3>
                  <p>PF, ESIC, PT and other deductions</p>
                </div>

              </div>

              <button
                type="button"
                className="add-button"
                onClick={() =>
                  setDeductions((x) => [
                    ...x,

                    {
                      name: '',
                      amount: '',
                    },
                  ])
                }
              >
                <Plus size={15} />
                Add
              </button>

            </div>

            <div className="card-content">

              <div className="row-labels deduction-labels">

                <span>Deduction</span>
                <span>Amount</span>
                <span></span>
                <span></span>

              </div>

              {deductions.map(
                (row, i) => (

                  <div
                    className="row-edit ded"
                    key={i}
                  >

                    <input
                      value={row.name}
                      onChange={(e) =>
                        setDed(
                          i,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Deduction"
                    />

                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) =>
                        setDed(
                          i,
                          'amount',
                          e.target.value
                        )
                      }
                      placeholder="Amount"
                    />

                    <span></span>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        setDeductions((x) =>
                          x.filter(
                            (_, j) =>
                              j !== i
                          )
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                )
              )}

              <div
                className="advance-entry"
                style={{
                  marginTop: '18px',
                  padding: '12px',
                  border: '1px solid #e4e7ec',
                  borderRadius: '10px',
                  background: '#fffdf2',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: '8px',
                    fontSize: '14px',
                  }}
                >
                  Advance
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <label>
                    Total Advance
                    <input
                      type="number"
                      value={advanceTotal}
                      onChange={(e) => setAdvanceTotal(e.target.value)}
                      placeholder="0"
                    />
                  </label>

                  <label>
                    Deduct This Month
                    <input
                      type="number"
                      value={advanceDeduction}
                      onChange={(e) =>
                        updateAdvanceDeduction(e.target.value)
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    Balance Advance
                    <input
                      type="number"
                      value={advanceBalance || ''}
                      readOnly
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              <div className="total-edit">

                <span>
                  Total Deduction
                </span>

                <b>
                  ₹ {money(totalDed)}
                </b>

              </div>

            </div>

          </div>

          {/* SIGNATURE / STAMP */}
          <div className="card">

            <div className="card-head">

              <div className="section-card-title">

                <div className="section-icon stamp-icon">
                  <PenTool size={18} />
                </div>

                <div>
                  <h3>Signature / Stamp</h3>
                  <p>Optional employer signature or stamp</p>
                </div>

              </div>

              {!stamp && (
                <button
                  type="button"
                  className="add-button"
                  onClick={() =>
                    document
                      .getElementById(
                        'stamp-input'
                      )
                      ?.click()
                  }
                >
                  <Plus size={15} />
                  Add Stamp
                </button>
              )}

            </div>

            <div className="card-content">

              {stamp ? (

                <div className="stamp-selected">

                  <img
                    src={stamp}
                    alt="Selected stamp"
                  />

                  <div>

                    <b>
                      Stamp / Signature added
                    </b>

                    <button
                      type="button"
                      onClick={() =>
                        setStamp('')
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

              ) : (

                <div className="stamp-empty">

                  <PenTool size={18} />

                  <p>
                    No stamp added. The payslip will use the computer-generated footer.
                  </p>

                </div>

              )}

              <input
                id="stamp-input"
                className="hidden-file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={addStamp}
              />

            </div>

          </div>

          {/* GENERATE */}
          <button
            className="generate"
            onClick={generatePayslip}
          >
            <FileText size={19} />
            Generate Payslip
          </button>

        </section>

        {/* GENERATED PAYSLIP */}
        {generated && (

          <section
            className="generated-section"
            id="generated-slip"
          >

            <div className="generated-head">

              <div>

                <div className="preview-label">
                  <FileText size={14} />
                  PREVIEW
                </div>

                <h2>
                  Generated Payslip
                </h2>

                <p>
                  Review your payslip before saving it as PDF.
                </p>

              </div>

              <button
                className="download"
                onClick={print}
              >
                <Download size={18} />
                Save as PDF
              </button>

            </div>

            <Slip data={generated} />

          </section>

        )}

      </div>

    </main>
  );
}