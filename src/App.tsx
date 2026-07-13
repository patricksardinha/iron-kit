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
import { currentWeekIndex } from './lib/logic'
import { AppHeader } from './components/AppHeader'
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

  // "Aujourd'hui" figé au montage.
  const today = useMemo(() => new Date(), [])
  const total = plan.weeks.length
  const currentWk = useMemo(() => currentWeekIndex(today, plan.weeks), [today, plan.weeks])

  const [weekIndex, setWeekIndex] = useState(currentWk)
  const safeIndex = Math.min(Math.max(1, weekIndex), total)

  return (
    <div className="app">
      <AppHeader />
      {tab === 'week' && (
        <WeekScreen
          weeks={plan.weeks}
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
          weeks={plan.weeks}
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
        <RewardsScreen weeks={plan.weeks} state={appState.state} today={today} />
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
