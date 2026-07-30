// Onglet Frigo : je note ce que j'ai, l'app me dit ce que je peux cuisiner.
// Les recettes complètes sont mises en avant ; celles où il manque 1-2 ingrédients
// restent proposées avec un avertissement listant ce qui manque.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Recipe } from '../types'
import { Icon } from './Icon'

interface Props {
  recipes: Recipe[]
}

// Le frigo est global (indépendant du plan actif).
const FRIDGE_KEY = 'ik-fridge-v1'

// Placard de base : supposé toujours disponible, jamais compté comme manquant.
const BASICS = ['sel', 'poivre', "huile d'olive", 'huile', 'eau', 'sucre', 'vinaigre']

// Au-delà de ce nombre d'ingrédients manquants, la recette n'est proposée
// que dans la liste repliée « autres recettes ».
const NEAR_MISSING_MAX = 2

/** Normalise un nom d'ingrédient pour la comparaison : minuscules, accents,
 * apostrophes, espaces multiples, pluriel naïf PAR MOT (« haricots rouges » →
 * « haricot rouge »). L'important est la cohérence des deux côtés, pas la
 * justesse linguistique. */
function norm(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/[’`]/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ')
}

function loadFridge(): string[] {
  try {
    const raw = localStorage.getItem(FRIDGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    /* ignore */
  }
  return []
}

interface Scored {
  recipe: Recipe
  missing: string[] // ingrédients manquants (libellés d'origine)
}

export function FridgeScreen({ recipes }: Props) {
  const [items, setItems] = useState<string[]>(loadFridge)
  const [input, setInput] = useState('')
  const [showAll, setShowAll] = useState(false)

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(FRIDGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / mode privé : on ignore */
    }
  }, [items])

  const owned = useMemo(() => {
    const set = new Set(BASICS.map(norm))
    for (const it of items) set.add(norm(it))
    return set
  }, [items])

  // Recettes triées par nombre d'ingrédients manquants.
  const { ready, near, rest } = useMemo(() => {
    const scored: Scored[] = recipes.map((recipe) => ({
      recipe,
      missing: recipe.ingredients.filter((i) => !owned.has(norm(i))),
    }))
    scored.sort((a, b) => a.missing.length - b.missing.length)
    return {
      ready: scored.filter((s) => s.missing.length === 0),
      near: scored.filter((s) => s.missing.length > 0 && s.missing.length <= NEAR_MISSING_MAX),
      rest: scored.filter((s) => s.missing.length > NEAR_MISSING_MAX),
    }
  }, [recipes, owned])

  // Suggestions : ingrédients les plus fréquents des recettes, pas encore au frigo.
  const suggestions = useMemo(() => {
    const freq = new Map<string, { label: string; n: number }>()
    for (const r of recipes)
      for (const i of r.ingredients) {
        const k = norm(i)
        if (owned.has(k)) continue
        const cur = freq.get(k)
        if (cur) cur.n++
        else freq.set(k, { label: i, n: 1 })
      }
    return [...freq.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .map((f) => f.label)
  }, [recipes, owned])

  // Autocomplétion : tous les ingrédients connus des recettes.
  const knownIngredients = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of recipes)
      for (const i of r.ingredients) {
        const k = norm(i)
        if (!seen.has(k) && !owned.has(k)) seen.set(k, i)
      }
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [recipes, owned])

  function addItem(raw: string) {
    const label = raw.replace(/\s+/g, ' ').trim()
    if (!label) return
    const k = norm(label)
    setItems((prev) => (prev.some((p) => norm(p) === k) ? prev : [...prev, label]))
    setInput('')
  }

  function removeItem(label: string) {
    setItems((prev) => prev.filter((p) => p !== label))
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Frigo</h1>

      <div className="fridge-add">
        <input
          type="text"
          value={input}
          list="fridge-known"
          placeholder="Ajouter un ingrédient (tomate, riz, poulet…)"
          enterKeyHint="done"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem(input)
            }
          }}
        />
        <datalist id="fridge-known">
          {knownIngredients.map((i) => (
            <option key={i} value={i} />
          ))}
        </datalist>
        <button type="button" className="tool-btn accent" onClick={() => addItem(input)}>
          <Icon name="plus" size={16} /> Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <p className="tool-hint" style={{ marginTop: 0 }}>
          Note ce que tu as dans ton frigo et tes placards : je te proposerai des recettes
          réalisables (ou presque) avec ce que tu as. Sel, poivre, huile, sucre et vinaigre sont
          considérés comme toujours disponibles.
        </p>
      ) : (
        <div className="fridge-items">
          {items.map((it) => (
            <span className="fridge-chip" key={it}>
              {it}
              <button
                type="button"
                onClick={() => removeItem(it)}
                aria-label={`Retirer ${it} du frigo`}
              >
                <Icon name="close" size={11} />
              </button>
            </span>
          ))}
          <button type="button" className="fridge-clear" onClick={() => setItems([])}>
            Tout vider
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="fridge-suggest">
          <span className="fs-label">Souvent utile :</span>
          {suggestions.map((s) => (
            <button type="button" key={s} className="fs-chip" onClick={() => addItem(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <>
          <div className="section-h">Réalisables maintenant · {ready.length}</div>
          {ready.map((s) => (
            <RecipeCard key={s.recipe.name} scored={s} owned={owned} />
          ))}
        </>
      )}

      {near.length > 0 && (
        <>
          <div className="section-h">
            Presque — il manque 1 ou 2 ingrédients · {near.length}
          </div>
          {near.map((s) => (
            <RecipeCard key={s.recipe.name} scored={s} owned={owned} />
          ))}
        </>
      )}

      {items.length > 0 && ready.length === 0 && near.length === 0 && (
        <p className="tool-hint">
          Rien de réalisable avec ça pour l'instant — ajoute quelques ingrédients ou parcours
          toutes les recettes ci-dessous.
        </p>
      )}

      {rest.length > 0 && (
        <>
          <button type="button" className="fridge-showall" onClick={() => setShowAll((v) => !v)}>
            <Icon name={showAll ? 'chevron-down' : 'chevron-right'} size={15} />
            {showAll ? 'Masquer' : 'Voir'} les autres recettes ({rest.length})
          </button>
          {showAll && rest.map((s) => <RecipeCard key={s.recipe.name} scored={s} owned={owned} />)}
        </>
      )}
    </div>
  )
}

function RecipeCard({ scored, owned }: { scored: Scored; owned: Set<string> }) {
  const [open, setOpen] = useState(false)
  const { recipe, missing } = scored
  const ok = missing.length === 0

  return (
    <div className={`recipe${ok ? ' ok' : ''}${open ? ' open' : ''}`}>
      <button
        type="button"
        className="recipe-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="recipe-head">
          <span className="recipe-name">{recipe.name}</span>
          <span className="recipe-meta">
            <span className="recipe-cat">{recipe.cat}</span>
            {recipe.time !== undefined && <span className="recipe-time">{recipe.time} min</span>}
          </span>
          {ok ? (
            <span className="recipe-state ok">
              <Icon name="check" size={12} /> Tout est là
            </span>
          ) : (
            <span className="recipe-state warn">
              Il manque : {missing.join(', ')}
            </span>
          )}
        </span>
        <span className="recipe-chevron" aria-hidden="true">
          <Icon name="chevron-right" size={18} />
        </span>
      </button>

      {open && (
        <div className="recipe-body">
          {recipe.desc && <p className="recipe-desc">{recipe.desc}</p>}
          <div className="recipe-ings">
            {recipe.ingredients.map((i) => {
              const has = owned.has(norm(i))
              return (
                <span key={i} className={`ing-chip${has ? '' : ' miss'}`}>
                  {has ? <Icon name="check" size={11} /> : '✕'} {i}
                </span>
              )
            })}
          </div>
          {recipe.steps && recipe.steps.length > 0 && (
            <ol className="recipe-steps">
              {recipe.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
