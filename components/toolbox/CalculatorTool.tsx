"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

// 安全的四则运算求值器（调度场算法），不用 eval/new Function
function evaluateExpression(expr: string): number {
  const tokens = expr.match(/\d+\.?\d*|[()+\-*/]/g);
  if (!tokens) throw new Error('bad expression');

  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const output: (number | string)[] = [];
  const ops: string[] = [];

  for (const token of tokens) {
    if (/^\d/.test(token)) {
      output.push(parseFloat(token));
    } else if (token === '(') {
      ops.push(token);
    } else if (token === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop()!);
      if (!ops.length) throw new Error('unbalanced parens');
      ops.pop();
    } else {
      while (ops.length && precedence[ops[ops.length - 1]] >= precedence[token]) {
        output.push(ops.pop()!);
      }
      ops.push(token);
    }
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op === '(') throw new Error('unbalanced parens');
    output.push(op);
  }

  const stack: number[] = [];
  for (const item of output) {
    if (typeof item === 'number') {
      stack.push(item);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('bad expression');
      stack.push(item === '+' ? a + b : item === '-' ? a - b : item === '*' ? a * b : a / b);
    }
  }
  if (stack.length !== 1 || !isFinite(stack[0])) throw new Error('bad expression');
  return stack[0];
}

export default function CalculatorTool() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (display === 'Error') {
      if (['+', '-', '*', '/'].includes(val) || val === '=') {
        setDisplay('0');
        setEquation('');
        return;
      } else {
        setDisplay(val === '.' ? '0.' : val);
        setEquation('');
        return;
      }
    }

    if (val === '=') {
      try {
        const fullEq = equation + display;
        const safeEq = fullEq.replace(/[^-()\d/*+.]/g, '');
        const result = evaluateExpression(safeEq);
        setDisplay(String(parseFloat(result.toFixed(6))));
        setEquation('');
      } catch (e) {
        setDisplay('Error');
      }
    }
    else if (['+', '-', '*', '/'].includes(val)) {
      if (display === '0' && equation && ['+', '-', '*', '/'].includes(equation.slice(-1))) {
        setEquation(equation.slice(0, -1) + val);
      } else {
        setEquation(equation + display + val);
        setDisplay('0');
      }
    }
    else {
      if (val === '.' && display.includes('.')) return;
      setDisplay(display === '0' && val !== '.' ? val : display + val);
    }
  };

  const calcButtons = [
    'C', '(', ')', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '=',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 【显示屏扩容】：高度提升到 h-20，增加内边距 p-4 */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex flex-col items-end justify-center h-24 shadow-inner border border-slate-200 dark:border-slate-700">
        {/* 公式字号放大到 text-sm */}
        <span className="text-sm text-slate-400 dark:text-slate-500 tracking-wider h-5 mb-1">{equation}</span>
        {/* 主数字字号放大到 text-4xl */}
        <span className="text-4xl font-black text-slate-800 dark:text-white truncate w-full text-right">{display}</span>
      </div>

      {/* 键盘 */}
      <div className="grid grid-cols-4 gap-2 mt-1">
        {calcButtons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleCalcClick(btn)}
            className={`h-10 rounded-xl text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all
              ${btn === '=' ? 'col-span-2 bg-indigo-500 text-white hover:bg-indigo-600' 
              : ['C', '(', ')', '/', '*', '-', '+'].includes(btn) ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
              : 'bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600'}
            `}
          >
            {btn}
          </button>
        ))}
      </div>
    </motion.div>
  );
}