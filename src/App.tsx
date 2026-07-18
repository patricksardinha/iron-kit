import { useMemo, useState } from 'react'
import type { Tab } from './types'
import type { PlanHooks } from './hooks/usePlan'
import type { Data } from './hooks/useData'
import type { PlansApi } from './hooks/usePlans'
import type { SettingsApi } from './hooks/useSettings'
import { useData } from './hooks/useData'
import { useAppState } from './hooks/useAppState'
import { usePlan } from './hooks/usePlan'
import { usePlans } from './hooks/usePlans'
import { useSettings } from './hooks/useSettings'
import { applyLayout, currentWeekIndex } from './lib/logic'
import { computeBadges } from './lib/badges'
import { AppHeader } from './components/AppHeader'
import { BadgeCelebration } from './components/BadgeCelebration'
import { TabBar } from './components/TabBar'
import { WeekScreen } from './components/WeekScreen'
import { ProgressScreen } from './components/ProgressScreen'
import { PlanScreen } from './components/PlanScreen'
import { RewardsScreen } from './components/RewardsScreen'
import { NutritionScreen } from './components/NutritionScreen'
import { SettingsScreen } from './components/SettingsScreen'

export default function App() {
  const data = useData()

  if (data.state === 'loading') {
    return (
      <div className="app">
        <div className="center-msg">Chargement du plan…</div>
      </div>
    )
  }
  if (data.state === 'error') {
    return (
      <div className="app">
        <div className="center-msg">
          Impossible de charger les données ({data.message}).
          <br />
          Recharge l'application une fois en ligne.
        </div>
      </div>
    )
  }

  return <Root data={data.data} />
}

// Registre des plans + réglages globaux (persistent au switch de plan).
function Root({ data }: { data: Data }) {
  const settings = useSettings()
  const plans = usePlans(data)
  // key = plan actif → remonte tout le sous-arbre pour recharger l'état cloisonné.
  return <PlanApp key={plans.activeId} data={data} plans={plans} settings={settings} />
}

function PlanApp({
  data,
  plans,
  settings,
}: {
  data: Data
  plans: PlansApi
  settings: SettingsApi
}) {
  const appState = useAppState(plans.activeId)
  const planHooks = useMemo<PlanHooks>(
    () => ({
      onDeleteWeek: appState.remapAfterDeleteWeek,
      onInsertWeek: appState.remapAfterInsertWeek,
      onReorderWeek: appState.remapReorderWeek,
    }),
    [appState.remapAfterDeleteWeek, appState.remapAfterInsertWeek, appState.remapReorderWeek],
  )
  const plan = usePlan(plans.baseWeeks, planHooks, plans.activeId)
  const [tab, setTab] = useState<Tab>('week')

  // Réalité = plan + agencement réarrangé par l'utilisateur (onglet Semaine).
  const weeksView = useMemo(
    () => applyLayout(plan.weeks, appState.state.layout),
    [plan.weeks, appState.state.layout],
  )

  // "Aujourd'hui" figé au montage.
  const today = useMemo(() => new Date(), [])
  const total = weeksView.length
  const currentWk = useMemo(() => currentWeekIndex(today, weeksView), [today, weeksView])

  const [weekIndex, setWeekIndex] = useState(currentWk)
  const safeIndex = Math.min(Math.max(1, weekIndex), total)

  // Badges recalculés pour détecter les déblocages (notification animée).
  const badges = useMemo(
    () => computeBadges(weeksView, appState.state, today),
    [weeksView, appState.state, today],
  )

  return (
    <div className="app">
      <BadgeCelebration badges={badges} planId={plans.activeId} />
      <AppHeader />
      {tab === 'week' && (
        <WeekScreen
          weeks={weeksView}
          weekIndex={safeIndex}
          currentWk={currentWk}
          today={today}
          appState={appState}
          library={plans.library}
          onNav={setWeekIndex}
        />
      )}
      {tab === 'progress' && (
        <ProgressScreen
          weeks={weeksView}
          state={appState.state}
          currentWk={currentWk}
          today={today}
          options={plan.options}
        />
      )}
      {tab === 'plan' && (
        <PlanScreen plan={plan} state={appState.state} currentWk={currentWk} library={plans.library} />
      )}
      {tab === 'rewards' && (
        <RewardsScreen weeks={weeksView} state={appState.state} today={today} />
      )}
      {tab === 'nutrition' && (
        <NutritionScreen sections={data.nutrition} settings={settings.settings} />
      )}
      {tab === 'settings' && (
        <SettingsScreen
          settings={settings.settings}
          update={settings.update}
          state={appState.state}
          onImport={appState.replaceState}
          plans={plans}
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
