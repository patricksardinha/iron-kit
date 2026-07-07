import { useMemo, useState } from 'react'
import type { Tab } from './types'
import type { PlanHooks } from './hooks/usePlan'
import type { Data } from './hooks/useData'
import { useData } from './hooks/useData'
import { useAppState } from './hooks/useAppState'
import { usePlan } from './hooks/usePlan'
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

  return <Main data={data.data} />
}

function Main({ data }: { data: Data }) {
  const appState = useAppState()
  const { settings, update: updateSettings } = useSettings()
  const planHooks = useMemo<PlanHooks>(
    () => ({
      onDeleteWeek: appState.remapAfterDeleteWeek,
      onInsertWeek: appState.remapAfterInsertWeek,
      onReorderWeek: appState.remapReorderWeek,
    }),
    [appState.remapAfterDeleteWeek, appState.remapAfterInsertWeek, appState.remapReorderWeek],
  )
  const plan = usePlan(data.plan, planHooks)
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
          library={data.sessions}
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
        <PlanScreen plan={plan} state={appState.state} currentWk={currentWk} library={data.sessions} />
      )}
      {tab === 'rewards' && (
        <RewardsScreen weeks={plan.weeks} state={appState.state} today={today} />
      )}
      {tab === 'nutrition' && <NutritionScreen sections={data.nutrition} settings={settings} />}
      {tab === 'settings' && (
        <SettingsScreen
          settings={settings}
          update={updateSettings}
          state={appState.state}
          onImport={appState.replaceState}
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
