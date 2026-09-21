'use client';

import { useEffect, useState } from 'react';
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
  Search,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';

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
  paymentDate: string;
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

type PayslipRecord = {
  id: string; pay_date: string; payment_date: string | null; working_days: number | null; present_days: number | null;
  gross_amount: number | null; total_deductions: number | null; net_amount: number | null; advance_total: number | null; advance_amount: number | null; advance_balance: number | null;
  employee_id: string; employee_snapshot: Employee | null; earnings_snapshot: Row[] | null;
  deductions_snapshot: Deduction[] | null; pay_fields_snapshot: PayField[] | null; employeeName: string;
};


type EmployeeRecord = {
  id: string;
  employee_code: string | null;
  name: string;
  uan: string | null;
  esic_number: string | null;
  custom_fields?: CustomField[] | null;
  created_at?: string | null;
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
  paymentDate: '',
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

function rateDisplay(
  value: string | number | null | undefined,
  isOvertime = false
) {
  if (value === '' || value === null || value === undefined) return '';

  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '';

  const formatted = n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return isOvertime ? `${formatted} hrs` : formatted;
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
            <b>Salary Month</b>
            <span>:</span>
            {payslipMonth(data.employee.payDate)}
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

          <p>
            <b>Payment Date</b>
            <span>:</span>
            {data.employee.paymentDate || '—'}
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

              <td>
                {rateDisplay(
                  data.earnings[i]?.rate,
                  data.earnings[i]?.name?.trim().toUpperCase() === 'OVER TIME'
                )}
              </td>

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

type DashboardStats = {
  totalEmployees: number;
  monthPayslips: number;
  totalPayroll: number;
  outstandingAdvances: number;
};

const emptyDashboardStats: DashboardStats = {
  totalEmployees: 0,
  monthPayslips: 0,
  totalPayroll: 0,
  outstandingAdvances: 0,
};

function Dashboard({
  onCreatePayslip,
  onEmployees,
  onViewAll,
  onViewPayslip,
  stats,
  loading,
  recentPayslips,
}: {
  onCreatePayslip: () => void;
  onEmployees: () => void;
  onViewAll: () => void;
  onViewPayslip: (record: PayslipRecord) => void;
  stats: DashboardStats;
  loading: boolean;
  recentPayslips: PayslipRecord[];
}) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-intro">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> PAYROLL MANAGEMENT</div>
          <h1>Dashboard</h1>
          <p>Manage employees, payroll and payslips from one place.</p>
        </div>
        <button className="dashboard-primary" onClick={onCreatePayslip}>
          <Plus size={17} /> Create Payslip
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon employee-icon"><UserRound size={19} /></div>
          <div><span>Total Employees</span><strong>{loading ? '…' : stats.totalEmployees}</strong><small>Total employees</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pay-icon"><FileText size={19} /></div>
          <div><span>This Month's Payslips</span><strong>{loading ? '…' : stats.monthPayslips}</strong><small>Based on payment date</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon earning-icon"><TrendingUp size={19} /></div>
          <div><span>Total Payroll</span><strong>{loading ? '…' : `₹ ${money(stats.totalPayroll)}`}</strong><small>Current month</small></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card quick-card">
          <div className="dashboard-card-head"><div><h3>Quick Actions</h3><p>Start your most common payroll tasks.</p></div></div>
          <div className="quick-actions">
            <button onClick={onCreatePayslip}><FileText size={18} /><span><b>Create Payslip</b><small>Generate a monthly payslip</small></span><Plus size={16} /></button>
            <button onClick={onEmployees}><UserRound size={18} /><span><b>Employee Records</b><small>Search saved employees</small></span><Plus size={16} /></button>
          </div>
        </div>

        <div className="dashboard-card recent-card">
          <div className="dashboard-card-head"><div><h3>Recent Payslips</h3><p>Your latest generated payslips will appear here.</p></div><button className="text-button" onClick={onViewAll}>View All</button></div>
          {recentPayslips.length === 0 ? (
            <div className="empty-dashboard">
              <div className="empty-icon"><FileText size={21} /></div>
              <b>No payslips yet</b>
              <span>Once you generate a payslip, it will be listed here.</span>
              <button onClick={onCreatePayslip}>Create your first payslip</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e4e7ec' }}>Employee</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e4e7ec' }}>Month</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e4e7ec' }}>Gross</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e4e7ec' }}>Net</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e4e7ec' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayslips.map((record) => (
                    <tr key={record.id}>
                      <td style={{ padding: '11px 8px', borderBottom: '1px solid #f0f2f5' }}>{record.employeeName}</td>
                      <td style={{ padding: '11px 8px', borderBottom: '1px solid #f0f2f5' }}>{payslipMonth(record.pay_date)}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', borderBottom: '1px solid #f0f2f5' }}>₹ {money(Number(record.gross_amount) || 0)}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', borderBottom: '1px solid #f0f2f5' }}>₹ {money(Number(record.net_amount) || 0)}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', borderBottom: '1px solid #f0f2f5' }}>
                        <button type="button" className="add-button" onClick={() => onViewPayslip(record)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'employees' | 'create' | 'payslips'>('dashboard');
  const [records, setRecords] = useState<PayslipRecord[]>([]);
  const [recordSearch, setRecordSearch] = useState('');
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [employeeMatches, setEmployeeMatches] = useState<Array<{ id: string; name: string; uan: string | null; esic_number: string | null; custom_fields: CustomField[] | null }>>([]);
  const [employeeLookupLoading, setEmployeeLookupLoading] = useState(false);

  const [advanceTotal, setAdvanceTotal] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(emptyDashboardStats);
  const [dashboardRecentPayslips, setDashboardRecentPayslips] = useState<PayslipRecord[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [employeeRecordsLoading, setEmployeeRecordsLoading] = useState(false);
  const [employeeRecordsError, setEmployeeRecordsError] = useState('');
  const [employeeRecordSearch, setEmployeeRecordSearch] = useState('');

  const loadEmployeeRecords = async () => {
    setEmployeeRecordsLoading(true);
    setEmployeeRecordsError('');

    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_code, name, uan, esic_number, custom_fields, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Employee records load error:', error);
      setEmployeeRecordsError(error.message);
      setEmployeeRecords([]);
    } else {
      setEmployeeRecords((data || []) as EmployeeRecord[]);
    }

    setEmployeeRecordsLoading(false);
  };

  const deleteEmployeeRecord = async (employeeRecord: EmployeeRecord) => {
    const confirmed = window.confirm(
      `Delete ${employeeRecord.name}?\n\nThis will also delete all saved payslips for this employee. This action cannot be undone.`
    );

    if (!confirmed) return;

    setEmployeeRecordsError('');

    const { error: payslipDeleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', employeeRecord.id);

    if (payslipDeleteError) {
      console.error('Employee payslip delete error:', payslipDeleteError);
      setEmployeeRecordsError(
        `Could not delete payslips for ${employeeRecord.name}: ${payslipDeleteError.message}`
      );
      return;
    }

    const { error: employeeDeleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeRecord.id);

    if (employeeDeleteError) {
      console.error('Employee delete error:', employeeDeleteError);
      setEmployeeRecordsError(
        `Could not delete employee ${employeeRecord.name}: ${employeeDeleteError.message}`
      );
      return;
    }

    setRecords((current) =>
      current.filter((record) => record.employee_id !== employeeRecord.id)
    );

    setDashboardRecentPayslips((current) =>
      current.filter((record) => record.employee_id !== employeeRecord.id)
    );

    await loadEmployeeRecords();
    await loadPayslipRecords();
    await loadDashboardStats();
  };

  const loadDashboardStats = async () => {
    setDashboardLoading(true);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const nextMonth = new Date(year, month + 1, 1);
    const toDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const [employeeResult, monthResult, payrollResult, advanceResult, recentResult] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }),
      supabase.from('payslips').select('id', { count: 'exact', head: true }).gte('payment_date', toDate(firstDay)).lt('payment_date', toDate(nextMonth)),
      supabase.from('payslips').select('net_amount').gte('payment_date', toDate(firstDay)).lt('payment_date', toDate(nextMonth)),
      supabase.from('payslips').select('employee_id, pay_date, created_at, advance_balance').order('pay_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('payslips').select('id, pay_date, payment_date, gross_amount, total_deductions, net_amount, employee_id, employee_snapshot, earnings_snapshot, deductions_snapshot, pay_fields_snapshot, created_at').order('pay_date', { ascending: false }).order('created_at', { ascending: false }).limit(5),
    ]);

    const payroll = (payrollResult.data || []).reduce((sum: number, row: any) => sum + (Number(row.net_amount) || 0), 0);

    const latestByEmployee = new Map<string, number>();
    (advanceResult.data || []).forEach((row: any) => {
      if (!latestByEmployee.has(row.employee_id)) {
        latestByEmployee.set(row.employee_id, Number(row.advance_balance) || 0);
      }
    });
    const outstandingAdvances = Array.from(latestByEmployee.values()).reduce((sum, value) => sum + value, 0);

    if (employeeResult.error || monthResult.error || payrollResult.error || advanceResult.error || recentResult.error) {
      console.error('Dashboard data load error:', employeeResult.error || monthResult.error || payrollResult.error || advanceResult.error || recentResult.error);
    }

    const recentRows = recentResult.data || [];
    const recentEmployeeIds = Array.from(new Set(recentRows.map((r: any) => r.employee_id).filter(Boolean)));
    let recentNames = new Map<string, string>();
    if (recentEmployeeIds.length) {
      const { data: recentEmployees, error: recentEmployeesError } = await supabase.from('employees').select('id, name').in('id', recentEmployeeIds);
      if (recentEmployeesError) {
        console.error('Recent payslips employee lookup error:', recentEmployeesError);
      } else {
        recentNames = new Map((recentEmployees || []).map((r: any) => [r.id, r.name]));
      }
    }
    setDashboardRecentPayslips(recentRows.map((r: any) => ({
      ...r,
      working_days: null,
      present_days: null,
      employeeName: r.employee_snapshot?.name || recentNames.get(r.employee_id) || 'Employee',
    })));

    setDashboardStats({
      totalEmployees: employeeResult.count || 0,
      monthPayslips: monthResult.count || 0,
      totalPayroll: payroll,
      outstandingAdvances,
    });
    setDashboardLoading(false);
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

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
        j === i ? { ...row, [key]: value } : row
      );

      const changedRow = updated[i];
      if (!changedRow) return updated;

      const changedName = changedRow.name.trim().toUpperCase();

      // BASIC uses a fixed 26-day structure.
      // You can enter either Rate Per Day OR BASIC Amount directly.
      // IMPORTANT: clearing Rate Per Day must NOT clear BASIC Amount.
      if (changedName === 'BASIC' && (key === 'rate' || key === 'amount')) {
        if (key === 'rate') {
          // If the user clears Rate Per Day, keep the existing BASIC amount.
          // Only recalculate when a numeric rate is actually entered.
          if (value.trim() === '') {
            return updated;
          }

          const basicRate = Number(value);
          if (!Number.isFinite(basicRate)) return updated;

          const basicAmount = basicRate * 26;

          return updated.map((row) => {
            const name = row.name.trim().toUpperCase();

            if (name === 'BASIC') {
              return {
                ...row,
                rate: value,
                amount: String(basicAmount),
              };
            }

            if (name === 'HRA') {
              return {
                ...row,
                rate: '10%',
                amount: String(basicAmount * 0.10),
              };
            }

            return row;
          });
        }

        // Direct BASIC amount entry: calculate Rate Per Day from it.
        const basicAmount = Number(value);
        if (!Number.isFinite(basicAmount)) return updated;

        const basicRate = basicAmount / 26;

        return updated.map((row) => {
          const name = row.name.trim().toUpperCase();

          if (name === 'BASIC') {
            return {
              ...row,
              amount: value,
              rate: basicAmount ? basicRate.toFixed(2) : '',
            };
          }

          if (name === 'HRA') {
            return {
              ...row,
              rate: '10%',
              amount: basicAmount ? String(basicAmount * 0.10) : '',
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

  const searchEmployees = async (value: string) => {
    const query = value.trim();
    if (!query) {
      setEmployeeMatches([]);
      return;
    }

    setEmployeeLookupLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, uan, esic_number, custom_fields')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(6);

    if (error) {
      console.error('EMPLOYEE SEARCH ERROR:', error);
      setEmployeeMatches([]);
    } else {
      setEmployeeMatches(data || []);
    }

    setEmployeeLookupLoading(false);
  };

  const selectEmployee = async (saved: {
    id: string;
    name: string;
    uan: string | null;
    esic_number: string | null;
    custom_fields: CustomField[] | null;
  }) => {
    setEmployeeMatches([]);

    setEmployee((current) => ({
      ...current,
      id: saved.id,
      name: saved.name,
      uan: saved.uan || '',
      esic: saved.esic_number || '',
      customFields: saved.custom_fields || [],
    }));

    // Employee master is now the source of truth for permanent employee fields.
    // Payslip history is used only for the previous outstanding advance balance.
    const { data: latestPayslip, error } = await supabase
      .from('payslips')
      .select('advance_total, advance_amount, advance_balance')
      .eq('employee_id', saved.id)
      .order('pay_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && latestPayslip) {
      const previousBalance = Number(latestPayslip.advance_balance) || 0;
      setAdvanceTotal(previousBalance > 0 ? String(previousBalance) : '');
      setAdvanceDeduction('');

      setDeductions((rows) =>
        rows.map((row) =>
          row.name.trim().toUpperCase() === 'LOAN'
            ? { ...row, amount: '' }
            : row
        )
      );
    } else {
      setAdvanceTotal('');
      setAdvanceDeduction('');
    }
  };

  const loadPayslipRecords = async () => {
    setRecordsLoading(true); setRecordsError('');
    const { data: payslipRows, error } = await supabase.from('payslips')
      .select('id, pay_date, payment_date, working_days, present_days, gross_amount, total_deductions, net_amount, advance_total, advance_amount, advance_balance, employee_id, employee_snapshot, earnings_snapshot, deductions_snapshot, pay_fields_snapshot, created_at')
      .order('pay_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) { console.error(error); setRecordsError(error.message); setRecordsLoading(false); return; }
    const ids = Array.from(new Set((payslipRows || []).map((r: any) => r.employee_id).filter(Boolean)));
    let names = new Map<string,string>();
    if (ids.length) {
      const { data: employees, error: empError } = await supabase.from('employees').select('id, name').in('id', ids);
      if (empError) { console.error(empError); setRecordsError(empError.message); setRecordsLoading(false); return; }
      names = new Map((employees || []).map((r: any) => [r.id, r.name]));
    }
    setRecords((payslipRows || []).map((r: any) => ({ ...r, employeeName: r.employee_snapshot?.name || names.get(r.employee_id) || 'Employee' })));
    setRecordsLoading(false);
  };

  const openSavedPayslip = (record: PayslipRecord) => {
    const snapshot = record.employee_snapshot as (Employee & { __advance?: PayslipData['advance']; __company?: Company; __stamp?: string }) | null;
    const savedAdvance = snapshot?.__advance;
    const fallbackAdvanceTotal = Number((record as any).advance_total) || 0;
    const fallbackAdvanceDeduction = Number(record.advance_amount) || 0;
    const fallbackAdvanceBalance = Number((record as any).advance_balance) || 0;
    const advance = savedAdvance
      ? {
          total: savedAdvance.total ?? (fallbackAdvanceTotal ? String(fallbackAdvanceTotal) : ''),
          deduction: savedAdvance.deduction ?? (fallbackAdvanceDeduction ? String(fallbackAdvanceDeduction) : ''),
          balance: savedAdvance.balance ?? (fallbackAdvanceBalance ? String(fallbackAdvanceBalance) : ''),
        }
      : fallbackAdvanceTotal > 0 || fallbackAdvanceDeduction > 0
        ? { total: fallbackAdvanceTotal ? String(fallbackAdvanceTotal) : String(fallbackAdvanceDeduction), deduction: fallbackAdvanceDeduction ? String(fallbackAdvanceDeduction) : '', balance: String(fallbackAdvanceBalance) }
        : { total: '', deduction: '', balance: '' };

    setGenerated({
      company: snapshot?.__company || { ...company },
      employee: { ...initialEmployee, ...(snapshot || {}), payDate: record.pay_date || snapshot?.payDate || '', paymentDate: record.payment_date || snapshot?.paymentDate || '', working: String(record.working_days ?? snapshot?.working ?? ''), present: String(record.present_days ?? snapshot?.present ?? ''), customFields: snapshot?.customFields || [] },
      payFields: record.pay_fields_snapshot || [], earnings: record.earnings_snapshot || [], deductions: record.deductions_snapshot || [],
      advance, stamp: snapshot?.__stamp || '',
    });
    setTimeout(() => document.getElementById('saved-slip-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  /* GENERATE */
  const generatePayslip = async () => {
    const employeeName = employee.name.trim();

    if (!employeeName) {
      alert('Please enter Employee Name first.');
      return;
    }

    if (!employee.payDate) {
      alert('Please enter Salary Month first.');
      return;
    }

    // Find existing employee or create a new one.
    let { data: savedEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('id, employee_code, name, uan, esic_number, custom_fields')
      .eq('name', employeeName)
      .maybeSingle();

    if (employeeError) {
      console.error(employeeError);
      alert('Could not check employee record.');
      return;
    }

    if (!savedEmployee) {
      const { data: newEmployee, error: createEmployeeError } =
        await supabase
          .from('employees')
          .insert({
            name: employeeName,
            uan: employee.uan.trim() || null,
            esic_number: employee.esic.trim() || null,
            custom_fields: employee.customFields,
          })
          .select('id, employee_code, name, uan, esic_number, custom_fields')
          .single();

      if (createEmployeeError) {
  console.error('EMPLOYEE SAVE ERROR:', createEmployeeError);
  alert(
    `Employee could not be saved.\n\n${createEmployeeError.message}`
  );
  return;
}

      savedEmployee = newEmployee;
    } else {
      // Keep saved UAN / ESIC details up to date when they are entered.
      const { error: updateEmployeeError } = await supabase
        .from('employees')
        .update({
          uan: employee.uan.trim() || null,
          esic_number: employee.esic.trim() || null,
          custom_fields: employee.customFields,
        })
        .eq('id', savedEmployee.id);

      if (updateEmployeeError) {
        console.error(updateEmployeeError);
        alert('Could not update employee record.');
        return;
      }
    }

    const basicRow = earnings.find(
      (row) => row.name.trim().toUpperCase() === 'BASIC'
    );

    const hraRow = earnings.find(
      (row) => row.name.trim().toUpperCase() === 'HRA'
    );

    const conRow = earnings.find(
      (row) => row.name.trim().toUpperCase() === 'CON.'
    );

    const otherAllowanceRow = earnings.find(
      (row) => row.name.trim().toUpperCase() === 'OTHER ALLOWANCE'
    );

    const overtimeRow = earnings.find(
      (row) => row.name.trim().toUpperCase() === 'OVER TIME'
    );

    const pfRow = deductions.find(
      (row) => row.name.trim().toUpperCase() === 'P.F.'
    );

    const esicRow = deductions.find(
      (row) => row.name.trim().toUpperCase() === 'ESIC'
    );

    const ptRow = deductions.find(
      (row) => row.name.trim().toUpperCase() === 'P.T.'
    );

    const lwfRow = deductions.find(
      (row) => row.name.trim().toUpperCase() === 'LWF'
    );

    const basicAmount = Number(basicRow?.amount) || 0;
    const hraAmount = Number(hraRow?.amount) || 0;

    const grossAmount = earnings.reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0
    );

    const totalDeductionAmount = deductions.reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0
    );

    const netAmount = grossAmount - totalDeductionAmount;

    const { error: payslipError } = await supabase
      .from('payslips')
      .insert({
        employee_id: savedEmployee.id,
        pay_date: employee.payDate,
        payment_date: employee.paymentDate || null,
        working_days: Number(employee.working) || 0,
        present_days: Number(employee.present) || 0,
        basic_rate_per_day: Number(basicRow?.rate) || 0,
        hra_percent:
          Number(String(hraRow?.rate || '10').replace('%', '')) || 0,
        esic_amount: Number(esicRow?.amount) || 0,
        con_amount: Number(conRow?.amount) || 0,
        other_allowance: Number(otherAllowanceRow?.amount) || 0,
        overtime: Number(overtimeRow?.amount) || 0,
        pf_amount: Number(pfRow?.amount) || 0,
        pt_amount: Number(ptRow?.amount) || 0,
        lwf_amount: Number(lwfRow?.amount) || 0,
        advance_total: Number(advanceTotal) || 0,
        advance_amount: Number(advanceDeduction) || 0,
        advance_balance: Number(advanceBalance) || 0,
        other_deductions: 0,
        basic_amount: basicAmount,
        hra_amount: hraAmount,
        gross_amount: grossAmount,
        total_deductions: totalDeductionAmount,
        net_amount: netAmount,
        employee_snapshot: {
          ...employee,
          customFields: employee.customFields.map((field) => ({ ...field })),
          __advance: { total: advanceTotal, deduction: advanceDeduction, balance: String(advanceBalance) },
          __company: { ...company },
          __stamp: stamp,
        },
        earnings_snapshot: earnings.map((row) => ({
          ...row,
        })),
        deductions_snapshot: deductions.map((row) => ({
          ...row,
        })),
        pay_fields_snapshot: payFields.map((field) => ({
          ...field,
        })),
      });

    if (payslipError) {
  console.error('PAYSLIP SAVE ERROR:', payslipError);
  alert(
    `Payslip could not be saved.\n\n${payslipError.message}`
  );
  return;
}

    const generatedPayslipData: PayslipData = {
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
    };

    // Show the generated payslip first, then automatically save the same
    // payslip as an A5 PDF. The short wait lets React render #payslip-print
    // before html2canvas captures it.
    setGenerated(generatedPayslipData);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await print(generatedPayslipData);

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
  const print = async (payslipData: PayslipData | null = generated) => {
    const source = document.getElementById('payslip-print');

    if (!source || !payslipData) {
      alert('Please open a payslip first.');
      return;
    }

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      // Render a dedicated A5 copy so the desktop layout/CSS
      // can never force the PDF into an A4-like proportion.
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      // Keep the clone inside the viewport so html2canvas can render it reliably.
      wrapper.style.left = '0';
      wrapper.style.top = '0';
      wrapper.style.width = '148mm';
      wrapper.style.height = '210mm';
      wrapper.style.background = '#fff';
      wrapper.style.overflow = 'hidden';
      wrapper.style.zIndex = '999999';
      wrapper.style.pointerEvents = 'none';

      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');
      clone.style.visibility = 'visible';
      clone.style.display = 'block';

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
          font-size: 8.5px !important;
          font-weight: 600 !important;
          text-align: left !important;
          white-space: nowrap !important;
        }

        .advance-cell em,
        .advance-balance-cell em {
          font-size: 8.5px !important;
          font-style: normal !important;
          font-weight: 600 !important;
        }

        .advance-cell b,
        .advance-balance-cell b {
          font-size: 8px !important;
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
          gap: 4px !important;
          width: 100% !important;
          margin: 0 !important;
          padding-right: 2px !important;
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
        payslipData.employee.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') ||
        'Employee';

      const month =
        payslipMonth(payslipData.employee.payDate)
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
          <div className="brand-icon"><FileText size={20} /></div>
          <div>
            <strong>Deepak Industrial Services</strong>
            <span>Payroll Management</span>
          </div>
        </div>
        {currentPage === 'create' && (
          <button className="ghost" onClick={reset}>
            <RotateCcw size={16} /> Reset Payslip
          </button>
        )}
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-label">MENU</div>
          <button className={currentPage === 'dashboard' ? 'side-item active' : 'side-item'} onClick={() => setCurrentPage('dashboard')}>
            <TrendingUp size={17} /> Dashboard
          </button>
          <button className={currentPage === 'employees' ? 'side-item active' : 'side-item'} onClick={() => { setCurrentPage('employees'); loadEmployeeRecords(); }}><UserRound size={17} /> Employees</button>
          <button className={currentPage === 'create' ? 'side-item active' : 'side-item'} onClick={() => setCurrentPage('create')}><FileText size={17} /> Payroll</button>
          <button className={currentPage === 'payslips' ? 'side-item active' : 'side-item'} onClick={() => { setCurrentPage('payslips'); loadPayslipRecords(); }}><FileText size={17} /> Payslips</button>
          <div className="sidebar-bottom">
            <div className="sidebar-company"><Building2 size={16} /><div><b>Deepak Industrial Services</b><small>Payroll System</small></div></div>
          </div>
        </aside>

        <div className="main-content">
          {currentPage === 'dashboard' ? (
            <Dashboard
              onCreatePayslip={() => setCurrentPage('create')}
              onEmployees={() => { setCurrentPage('employees'); loadEmployeeRecords(); }}
              onViewAll={() => { setCurrentPage('payslips'); loadPayslipRecords(); }}
              onViewPayslip={(record) => { setCurrentPage('payslips'); setRecords([record]); openSavedPayslip(record); }}
              stats={dashboardStats}
              loading={dashboardLoading}
              recentPayslips={dashboardRecentPayslips}
            />
          ) : currentPage === 'employees' ? (
            <div className="workspace single-column">
              <section className="panel form-panel">
                <div className="page-intro">
                  <div>
                    <div className="eyebrow"><UserRound size={14} /> EMPLOYEE RECORDS</div>
                    <h1>Employees</h1>
                    <p>Search employees and open their previous payslips.</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="section-card-title">
                      <div className="section-icon employee-icon"><Search size={18} /></div>
                      <div><h3>Find Employee</h3><p>{employeeRecords.length} employee{employeeRecords.length === 1 ? '' : 's'} saved</p></div>
                    </div>
                    <button type="button" className="add-button" onClick={loadEmployeeRecords}>Refresh</button>
                  </div>
                  <div className="card-content">
                    <input
                      value={employeeRecordSearch}
                      onChange={(e) => setEmployeeRecordSearch(e.target.value)}
                      placeholder="Search employee name, UAN or ESIC"
                      style={{ width:'100%', padding:'12px 14px', border:'1px solid #dfe3e8', borderRadius:'9px', fontSize:'14px' }}
                    />
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="section-card-title">
                      <div className="section-icon pay-icon"><UserRound size={18} /></div>
                      <div><h3>Saved Employees</h3><p>Select an employee to view their saved payslips.</p></div>
                    </div>
                  </div>
                  <div className="card-content">
                    {employeeRecordsLoading ? (
                      <p>Loading employees...</p>
                    ) : employeeRecordsError ? (
                      <p style={{ color:'#b42318' }}>{employeeRecordsError}</p>
                    ) : (() => {
                      const q = employeeRecordSearch.trim().toLowerCase();
                      const filtered = employeeRecords.filter((employeeRecord) =>
                        employeeRecord.name.toLowerCase().includes(q) ||
                        (employeeRecord.uan || '').toLowerCase().includes(q) ||
                        (employeeRecord.esic_number || '').toLowerCase().includes(q)
                      );
                      return filtered.length === 0 ? (
                        <p>{q ? 'No employees found.' : 'No employees saved yet. Generate a payslip to create an employee record.'}</p>
                      ) : (
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #e4e7ec' }}>Employee</th>
                                <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #e4e7ec' }}>UAN</th>
                                <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #e4e7ec' }}>ESIC</th>
                                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:'1px solid #e4e7ec' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((employeeRecord) => (
                                <tr key={employeeRecord.id}>
                                  <td style={{ padding:'12px 8px', borderBottom:'1px solid #f0f2f5', fontWeight:600 }}>{employeeRecord.name}</td>
                                  <td style={{ padding:'12px 8px', borderBottom:'1px solid #f0f2f5' }}>{employeeRecord.uan || '—'}</td>
                                  <td style={{ padding:'12px 8px', borderBottom:'1px solid #f0f2f5' }}>{employeeRecord.esic_number || '—'}</td>
                                  <td style={{ padding:'12px 8px', textAlign:'right', borderBottom:'1px solid #f0f2f5' }}>
                                    <button
                                      type="button"
                                      className="add-button"
                                      onClick={() => {
                                        setRecordSearch(employeeRecord.name);
                                        setCurrentPage('payslips');
                                        loadPayslipRecords();
                                      }}
                                    >View Payslips</button>
                                    <button
                                      type="button"
                                      className="delete-button"
                                      onClick={() => deleteEmployeeRecord(employeeRecord)}
                                      title="Delete employee and all saved payslips"
                                      style={{ marginLeft: '8px' }}
                                    >
                                      <Trash2 size={15} />
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>
            </div>
          ) : currentPage === 'payslips' ? (
            <div className="workspace single-column">
              <section className="panel form-panel">
                <div className="page-intro"><div><div className="eyebrow"><FileText size={14} /> PAYROLL RECORDS</div><h1>Previous Payslips</h1><p>Search an employee and open any previously generated payslip.</p></div></div>
                <div className="card">
                  <div className="card-head"><div className="section-card-title"><div className="section-icon pay-icon"><Search size={18} /></div><div><h3>Find Payslip</h3><p>Search by employee name</p></div></div><button type="button" className="add-button" onClick={loadPayslipRecords}>Refresh</button></div>
                  <div className="card-content"><input value={recordSearch} onChange={(e) => setRecordSearch(e.target.value)} placeholder="Search employee name" style={{ width:'100%', padding:'12px 14px', border:'1px solid #dfe3e8', borderRadius:'9px', fontSize:'14px' }} /></div>
                </div>
                <div className="card">
                  <div className="card-head"><div className="section-card-title"><div className="section-icon earning-icon"><FileText size={18} /></div><div><h3>Saved Payslips</h3><p>{records.length} record{records.length === 1 ? '' : 's'} found</p></div></div></div>
                  <div className="card-content">
                    {recordsLoading ? <p>Loading saved payslips...</p> : recordsError ? <p style={{color:'#b42318'}}>{recordsError}</p> : (() => { const filtered = records.filter(r => r.employeeName.toLowerCase().includes(recordSearch.trim().toLowerCase())); return filtered.length === 0 ? <p>No saved payslips found.</p> : <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}><thead><tr><th style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #e4e7ec'}}>Employee</th><th style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #e4e7ec'}}>Month</th><th style={{textAlign:'right',padding:'10px 8px',borderBottom:'1px solid #e4e7ec'}}>Gross</th><th style={{textAlign:'right',padding:'10px 8px',borderBottom:'1px solid #e4e7ec'}}>Net</th><th style={{textAlign:'right',padding:'10px 8px',borderBottom:'1px solid #e4e7ec'}}>Action</th></tr></thead><tbody>{filtered.map(record => <tr key={record.id}><td style={{padding:'12px 8px',borderBottom:'1px solid #f0f2f5'}}>{record.employeeName}</td><td style={{padding:'12px 8px',borderBottom:'1px solid #f0f2f5'}}>{payslipMonth(record.pay_date)}</td><td style={{padding:'12px 8px',textAlign:'right',borderBottom:'1px solid #f0f2f5'}}>₹ {money(Number(record.gross_amount)||0)}</td><td style={{padding:'12px 8px',textAlign:'right',borderBottom:'1px solid #f0f2f5'}}>₹ {money(Number(record.net_amount)||0)}</td><td style={{padding:'12px 8px',textAlign:'right',borderBottom:'1px solid #f0f2f5'}}><button type="button" className="add-button" onClick={() => openSavedPayslip(record)}>View</button></td></tr>)}</tbody></table></div>; })()}
                  </div>
                </div>
                {generated && <section className="generated-section" id="saved-slip-preview"><div className="generated-head"><div><div className="preview-label"><FileText size={14} /> SAVED PAYSLIP</div><h2>Previous Payslip</h2><p>Saved record opened from Supabase.</p></div><button className="download" onClick={() => print(generated)}><Download size={18} /> Save as PDF</button></div><Slip data={generated} /></section>}
              </section>
            </div>
          ) : (
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

                  <div style={{ position: 'relative' }}>
                    <input
                      value={employee.name}
                      onChange={(e) => {
                        setEmp('name', e.target.value);
                        searchEmployees(e.target.value);
                      }}
                      onBlur={() => setTimeout(() => setEmployeeMatches([]), 180)}
                      placeholder="Enter employee name"
                    />

                    {employeeMatches.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 'calc(100% + 4px)',
                        background: '#fff',
                        border: '1px solid #dfe3e8',
                        borderRadius: '9px',
                        boxShadow: '0 8px 24px rgba(16,24,40,0.10)',
                        zIndex: 20,
                        overflow: 'hidden',
                      }}>
                        {employeeMatches.map((match) => (
                          <button
                            key={match.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectEmployee(match)}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '11px 13px',
                              border: 0,
                              borderBottom: '1px solid #f0f2f5',
                              background: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            <b>{match.name}</b>
                            {(match.uan || match.esic_number) && (
                              <span style={{ display: 'block', marginTop: '3px', color: '#667085', fontSize: '12px' }}>
                                {match.uan ? `UAN: ${match.uan}` : ''}{match.uan && match.esic_number ? '  •  ' : ''}{match.esic_number ? `ESIC: ${match.esic_number}` : ''}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {employeeLookupLoading && employee.name.trim() && (
                    <small style={{ color: '#667085', marginTop: '4px' }}>Searching saved employees…</small>
                  )}

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
                  Salary Month

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
                  <small style={{ color: '#667085' }}>Select any date within the salary month.</small>
                </label>

                <label>
                  Payment Date

                  <input
                    type="date"
                    value={employee.paymentDate}
                    onChange={(e) =>
                      setEmp(
                        'paymentDate',
                        e.target.value
                      )
                    }
                  />
                  <small style={{ color: '#667085' }}>Actual date salary is paid.</small>
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
                <span>Rate / Day / OT Hrs</span>
                <span>Amount</span>
                <span></span>

              </div>

              {earnings.map(
                (row, i) => {
                  const isBasic =
                    row.name.trim().toUpperCase() === 'BASIC';

                  const isHra =
                    row.name.trim().toUpperCase() === 'HRA';

                  const isOvertime =
                    row.name.trim().toUpperCase() === 'OVER TIME';

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
                        placeholder={isOvertime ? 'OT Hours' : 'Rate'}
                        readOnly={isHra}
                        title={isOvertime ? 'Enter overtime hours' : 'Enter rate per day'}
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
                        readOnly={isHra}
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
  onClick={() => print()}
>
  <Download size={18} />
  Save as PDF
</button>

            </div>

            <Slip data={generated} />

          </section>

        )}
          </div>
          )}
        </div>
      </div>

    </main>
  );
}