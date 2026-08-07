import { useEffect, useMemo, useState } from 'react';
import { AdvisorOverlay } from '../components/AdvisorOverlay';
import { DecisionCard } from '../components/DecisionCard';
import { NumericInputModal } from '../components/NumericInputModal';
import { StickyFooter } from '../components/StickyFooter';
import { TouchSlider } from '../components/TouchSlider';
import { CONSTANTS } from '../engine/constants';
import {
  createDefaultDecision,
  estimateDecisionPreview,
} from '../engine/preview';
import { getScenarioById } from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import type { Decision, Investment } from '../types/game';
import { formatNumber, formatYen } from '../utils/format';

type NumericField = 'materialPurchase' | 'productionQty' | 'unitPrice';

const INVESTMENT_OPTIONS: {
  id: Investment;
  label: string;
  desc: string;
}[] = [
  { id: 'ad', label: '広告', desc: 'ブランド+15 / 需要押し上げ' },
  { id: 'equipment', label: '設備', desc: '生産能力+300 / 頭金500' },
  { id: 'rd', label: '研究開発', desc: '次々期から原価-10%（2期）' },
];

function clampDecision(d: Decision, maxPurchase: number, maxProduction: number, priceMin: number, priceMax: number): Decision {
  return {
    ...d,
    materialPurchase: Math.min(maxPurchase, Math.max(0, d.materialPurchase)),
    productionQty: Math.min(maxProduction, Math.max(0, d.productionQty)),
    unitPrice: Math.min(priceMax, Math.max(priceMin, d.unitPrice)),
    employeeChange: Math.min(2, Math.max(-2, d.employeeChange)),
  };
}

export function DecisionsScreen() {
  const game = useGameStore((s) => s.game);
  const setView = useGameStore((s) => s.setView);
  const executeTurn = useGameStore((s) => s.executeTurn);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [numericField, setNumericField] = useState<NumericField | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  useEffect(() => {
    if (game) {
      setDecision(createDefaultDecision(game));
      // シナリオモードでは期ごとに助言オーバーレイを表示
      if (game.mode === 'scenario' && game.scenarioId) {
        const scenario = getScenarioById(game.scenarioId);
        const prompt = scenario?.advisorPrompts.find(
          (p) => p.turn === game.currentTurn,
        );
        setAdvisorOpen(Boolean(prompt?.before.length));
      } else {
        setAdvisorOpen(false);
      }
    }
  }, [game, game?.currentTurn]);

  const preview = useMemo(() => {
    if (!game || !decision) return null;
    return estimateDecisionPreview(game, decision);
  }, [game, decision]);

  const advisorPrompts = useMemo(() => {
    if (!game || game.mode !== 'scenario' || !game.scenarioId) return [];
    const scenario = getScenarioById(game.scenarioId);
    return (
      scenario?.advisorPrompts.find((p) => p.turn === game.currentTurn)
        ?.before ?? []
    );
  }, [game]);

  if (!game || !decision || !preview) return null;

  const update = (partial: Partial<Decision>) => {
    setDecision((prev) => {
      if (!prev || !game) return prev;
      const next = { ...prev, ...partial };
      const p = estimateDecisionPreview(game, next);
      return clampDecision(
        next,
        p.maxPurchase,
        p.maxProduction,
        p.priceMin,
        p.priceMax,
      );
    });
  };

  const toggleInvestment = (id: Investment) => {
    const has = decision.investments.includes(id);
    update({
      investments: has
        ? decision.investments.filter((x) => x !== id)
        : [...decision.investments, id],
    });
  };

  const settle = () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const finalDecision = clampDecision(
        decision,
        preview.maxPurchase,
        preview.maxProduction,
        preview.priceMin,
        preview.priceMax,
      );
      executeTurn(finalDecision);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <AdvisorOverlay
        open={advisorOpen}
        prompts={advisorPrompts}
        game={game}
        onComplete={() => setAdvisorOpen(false)}
      />

      <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-mg-primary"
            onClick={() =>
              setView(game.mode === 'scenario' && game.history.length === 0
                ? 'scenarioBriefing'
                : 'dashboard')
            }
            aria-label="戻る"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-mg-accent">
              第{game.currentTurn}期
              {game.mode === 'scenario' ? '　シナリオ' : ''}
            </p>
            <h1 className="text-lg font-bold text-mg-primary">意思決定</h1>
          </div>
          {game.mode === 'scenario' && advisorPrompts.length > 0 && !advisorOpen && (
            <button
              type="button"
              className="min-h-[44px] shrink-0 rounded-lg px-2 text-xs font-semibold text-mg-accent"
              onClick={() => setAdvisorOpen(true)}
            >
              助言を再表示
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 py-4 pb-2">
        <p className="text-sm text-slate-600">
          現預金 {formatYen(game.cash)}　／　材料在庫{' '}
          {formatYen(game.materialInventory)}
        </p>

        <DecisionCard
          title="1. 材料仕入額"
          subtitle="次期の生産余力のもと。現金の80%まで"
          valueLabel={`${formatNumber(decision.materialPurchase)}千円`}
          hint={`即払い約${formatNumber(Math.round(decision.materialPurchase * 0.8))}千円 / 買掛20%`}
          onValueClick={() => setNumericField('materialPurchase')}
        >
          <TouchSlider
            min={0}
            max={preview.maxPurchase}
            step={100}
            value={decision.materialPurchase}
            onChange={(v) => update({ materialPurchase: v })}
            ariaLabel="材料仕入額"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>0</span>
            <span>上限 {formatNumber(preview.maxPurchase)}</span>
          </div>
        </DecisionCard>

        <DecisionCard
          title="2. 生産量"
          subtitle="人員・設備・材料の上限内"
          valueLabel={`${formatNumber(decision.productionQty)}個`}
          hint={`上限 人員${preview.productionCap.labor} / 設備${preview.productionCap.equipment} / 材料${preview.productionCap.material}`}
          onValueClick={() => setNumericField('productionQty')}
        >
          <TouchSlider
            min={0}
            max={Math.max(0, preview.maxProduction)}
            step={1}
            value={decision.productionQty}
            onChange={(v) => update({ productionQty: v })}
            ariaLabel="生産量"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>0</span>
            <span>最大 {formatNumber(preview.maxProduction)}個</span>
          </div>
        </DecisionCard>

        <DecisionCard
          title="3. 販売価格"
          subtitle={`単位原価目安 ${preview.estimatedUnitCost.toFixed(1)}千円/個（材料${preview.unitCost.toFixed(1)}+労務）`}
          valueLabel={`${decision.unitPrice.toFixed(1)}千円`}
          hint={`予想需要 約${formatNumber(preview.expectedDemand)}個（高いほど減）`}
          onValueClick={() => setNumericField('unitPrice')}
        >
          <TouchSlider
            min={preview.priceMin}
            max={preview.priceMax}
            step={0.1}
            value={decision.unitPrice}
            onChange={(v) => update({ unitPrice: Math.round(v * 10) / 10 })}
            ariaLabel="販売価格"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{preview.priceMin.toFixed(1)}</span>
            <span>{preview.priceMax.toFixed(1)}</span>
          </div>
        </DecisionCard>

        <DecisionCard
          title="4. 人員調整"
          subtitle={`現在 ${game.employees}人 → ${preview.employeesAfter}人`}
          valueLabel={`${decision.employeeChange >= 0 ? '+' : ''}${decision.employeeChange}人`}
          hint={`人件費 ${formatNumber(preview.employeesAfter * CONSTANTS.EMPLOYEE_SALARY_PER_TURN)}千円/期`}
        >
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-mg-primary active:scale-95 disabled:opacity-40"
              disabled={decision.employeeChange <= -2}
              onClick={() =>
                update({
                  employeeChange: Math.max(-2, decision.employeeChange - 1),
                })
              }
              aria-label="人員を減らす"
            >
              −
            </button>
            <span className="min-w-[4rem] text-center text-2xl font-bold tabular-nums text-mg-primary">
              {preview.employeesAfter}
              <span className="ml-1 text-sm font-normal text-slate-500">人</span>
            </span>
            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-mg-primary active:scale-95 disabled:opacity-40"
              disabled={decision.employeeChange >= 2}
              onClick={() =>
                update({
                  employeeChange: Math.min(2, decision.employeeChange + 1),
                })
              }
              aria-label="人員を増やす"
            >
              ＋
            </button>
          </div>
        </DecisionCard>

        <DecisionCard
          title="5. 追加投資"
          subtitle={`各${CONSTANTS.INVESTMENT_COST_EACH}千円（複数可）`}
          valueLabel={
            decision.investments.length === 0
              ? 'なし'
              : `${decision.investments.length}件`
          }
          hint={
            preview.investmentCash > 0
              ? `投資支出 ${formatNumber(preview.investmentCash)}千円`
              : '将来の成長に使うかどうか'
          }
        >
          <div className="flex flex-col gap-2">
            {INVESTMENT_OPTIONS.map((opt) => {
              const checked = decision.investments.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInvestment(opt.id)}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.99] ${
                    checked
                      ? 'border-mg-accent bg-orange-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${
                      checked
                        ? 'border-mg-accent bg-mg-accent text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-mg-primary">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {opt.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DecisionCard>

        {preview.affordWarning && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-mg-danger">
            {preview.affordWarning}
          </p>
        )}
      </div>

      <NumericInputModal
        open={numericField === 'materialPurchase'}
        title="材料仕入額"
        value={decision.materialPurchase}
        min={0}
        max={preview.maxPurchase}
        step={100}
        unit="千円"
        onClose={() => setNumericField(null)}
        onConfirm={(v) => update({ materialPurchase: v })}
      />
      <NumericInputModal
        open={numericField === 'productionQty'}
        title="生産量"
        value={decision.productionQty}
        min={0}
        max={Math.max(0, preview.maxProduction)}
        step={1}
        unit="個"
        onClose={() => setNumericField(null)}
        onConfirm={(v) => update({ productionQty: Math.round(v) })}
      />
      <NumericInputModal
        open={numericField === 'unitPrice'}
        title="販売価格"
        value={decision.unitPrice}
        min={preview.priceMin}
        max={preview.priceMax}
        step={0.1}
        unit="千円/個"
        onClose={() => setNumericField(null)}
        onConfirm={(v) => update({ unitPrice: Math.round(v * 10) / 10 })}
      />

      <StickyFooter
        summary={
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 px-2 py-2">
              <p className="text-slate-500">予想売上</p>
              <p className="text-sm font-bold tabular-nums text-mg-primary">
                {formatYen(preview.expectedRevenue)}
              </p>
              <p className="text-slate-500">
                販売見込み {formatNumber(preview.expectedSales)}個
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2">
              <p className="text-slate-500">予想期末現金</p>
              <p
                className={`text-sm font-bold tabular-nums ${
                  preview.expectedCash < 0
                    ? 'text-mg-danger'
                    : preview.cashDelta >= 0
                      ? 'text-mg-success'
                      : 'text-mg-primary'
                }`}
              >
                {formatYen(preview.expectedCash)}
              </p>
              <p className="text-slate-500">
                増減 {preview.cashDelta >= 0 ? '+' : ''}
                {formatNumber(preview.cashDelta)}
              </p>
            </div>
          </div>
        }
      >
        <button
          type="button"
          className="btn-accent w-full text-base disabled:opacity-60"
          disabled={submitting}
          onClick={settle}
        >
          {submitting ? '計算中…' : '決算する ✓'}
        </button>
      </StickyFooter>
    </div>
  );
}
