import { useMemo, useState } from 'react'
import type { Tab } from './types'
import type { Data } from './hooks/useData'
import { useData } from './hooks/useData'
import { useAppState } from './hooks/useAppState'
import { usePlan } from './hooks/usePlan'
import { currentWeekIndex } from './lib/logic'
import { TabBar } from './components/TabBar'
import { WeekScreen } from './components/WeekScreen'
import { ProgressScreen } from './components/ProgressScreen'
import { PlanScreen } from './components/PlanScreen'
import { NutritionScreen } from './components/NutritionScreen'

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
  const plan = usePlan(data.plan, appState.remapAfterDeleteWeek)
  const [tab, setTab] = useState<Tab>('week')

  // "Aujourd'hui" figé au montage.
  const today = useMemo(() => new Date(), [])
  const total = plan.weeks.length
  const currentWk = useMemo(() => currentWeekIndex(today, total), [today, total])

  const [weekIndex, setWeekIndex] = useState(currentWk)
  const safeIndex = Math.min(Math.max(1, weekIndex), total)

  function openWeek(wk: number) {
    setWeekIndex(wk)
    setTab('week')
  }

  return (
    <div className="app">
      {tab === 'week' && (
        <WeekScreen
          weeks={plan.weeks}
          weekIndex={safeIndex}
          currentWk={currentWk}
          today={today}
          appState={appState}
          onNav={setWeekIndex}
        />
      )}
      {tab === 'progress' && (
        <ProgressScreen
          weeks={plan.weeks}
          state={appState.state}
          currentWk={currentWk}
          today={today}
          onImport={appState.replaceState}
        />
      )}
      {tab === 'plan' && (
        <PlanScreen
          plan={plan}
          state={appState.state}
          currentWk={currentWk}
          onOpenWeek={openWeek}
        />
      )}
      {tab === 'nutrition' && <NutritionScreen sections={data.nutrition} />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
