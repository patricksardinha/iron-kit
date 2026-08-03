// Onglet Frigo : je coche ce que j'ai, l'app me dit ce que je peux cuisiner.
// Le catalogue d'aliments est DÉRIVÉ des recettes (union de leurs ingrédients) et
// groupé par catégories (ingredients.json) : chaque aliment sélectionnable a donc,
// par construction, au moins une recette associée. « Souvent utile » est une liste
// de favoris gérée par l'utilisateur (étoile pour ajouter, × pour retirer).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { IngredientCategory, Recipe } from '../types'
import { Icon } from './Icon'

interface Props {
  recipes: Recipe[]
  catalog: IngredientCategory[]
}

// Le frigo et les favoris sont globaux (indépendants du plan actif).
const FRIDGE_KEY = 'ik-fridge-v1'
const FAVS_KEY = 'ik-fridge-favs-v1'

// Placard de base : supposé toujours disponible, jamais compté comme manquant.
const BASICS = ['sel', 'poivre', "huile d'olive", 'huile', 'eau', 'sucre', 'vinaigre']

// Favoris proposés au premier lancement (modifiables ensuite).
const DEFAULT_FAVS = ['oeufs', 'pâtes', 'riz', 'lait', 'banane', "flocons d'avoine", 'tomates', 'poulet']

// Au-delà de ce nombre d'ingrédients manquants, la recette part dans la liste repliée.
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

function loadList(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    /* ignore */
  }
  return fallback
}

interface Scored {
  recipe: Recipe
  missing: string[] // ingrédients manquants (libellés d'origine)
  used: number // combien de MES ingrédients (hors placard de base) la recette utilise
}

interface CatalogItem {
  key: string // clé normalisée
  label: string // libellé d'affichage
}

export function FridgeScreen({ recipes, catalog }: Props) {
  const [items, setItems] = useState<string[]>(() => loadList(FRIDGE_KEY, []))
  const [favs, setFavs] = useState<string[]>(() => loadList(FAVS_KEY, DEFAULT_FAVS))
  const [search, setSearch] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(FRIDGE_KEY, JSON.stringify(items))
      localStorage.setItem(FAVS_KEY, JSON.stringify(favs))
    } catch {
      /* quota / mode privé : on ignore */
    }
  }, [items, favs])

  // Tous les ingrédients connus des recettes : clé normalisée → libellé d'affichage.
  const known = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of recipes)
      for (const i of r.ingredients) {
        const k = norm(i)
        if (!m.has(k)) m.set(k, i)
      }
    return m
  }, [recipes])

  // Catalogue groupé : catégories limitées aux ingrédients couverts par ≥1 recette,
  // + « Autres » pour les ingrédients de recettes non catégorisés.
  const groups = useMemo(() => {
    const used = new Set<string>()
    const out: { cat: string; items: CatalogItem[] }[] = []
    for (const c of catalog) {
      const list: CatalogItem[] = []
      for (const name of c.items) {
        const k = norm(name)
        if (!known.has(k) || used.has(k)) continue
        used.add(k)
        list.push({ key: k, label: known.get(k)! })
      }
      if (list.length) out.push({ cat: c.cat, items: list })
    }
    const rest = [...known.entries()]
      .filter(([k]) => !used.has(k))
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    if (rest.length) out.push({ cat: 'Autres', items: rest })
    return out
  }, [catalog, known])

  const owned = useMemo(() => {
    const set = new Set(BASICS.map(norm))
    for (const it of items) set.add(norm(it))
    return set
  }, [items])
  // Mes ingrédients à moi (sans le placard de base) — pour scorer la pertinence.
  const mine = useMemo(() => new Set(items.map(norm)), [items])
  const favKeys = useMemo(() => new Set(favs.map(norm)), [favs])

  // Recettes triées : d'abord le moins d'ingrédients manquants, puis, à égalité,
  // celles qui utilisent LE PLUS de mes ingrédients (une recette de 5 ingrédients
  // dont 4 sont dans mon frigo passe devant une recette de 2 dont 1 seul est à moi).
  const { ready, near, rest } = useMemo(() => {
    const scored: Scored[] = recipes.map((recipe) => ({
      recipe,
      missing: recipe.ingredients.filter((i) => !owned.has(norm(i))),
      used: recipe.ingredients.filter((i) => mine.has(norm(i))).length,
    }))
    scored.sort((a, b) => a.missing.length - b.missing.length || b.used - a.used)
    const rest = scored.filter((s) => s.missing.length > NEAR_MISSING_MAX)
    // Le fond de liste privilégie la pertinence : mes ingrédients d'abord.
    rest.sort((a, b) => b.used - a.used || a.missing.length - b.missing.length)
    return {
      ready: scored.filter((s) => s.missing.length === 0),
      near: scored.filter((s) => s.missing.length > 0 && s.missing.length <= NEAR_MISSING_MAX),
      rest,
    }
  }, [recipes, owned, mine])

  // Toujours proposer quelque chose : si rien de réalisable ni de « presque »,
  // montrer les meilleures pistes (les recettes les moins incomplètes).
  const fallback = items.length > 0 && ready.length === 0 && near.length === 0 ? rest.slice(0, 6) : []

  function toggleItem(label: string) {
    const k = norm(label)
    setItems((prev) =>
      prev.some((p) => norm(p) === k) ? prev.filter((p) => norm(p) !== k) : [...prev, label],
    )
  }
  function toggleFav(label: string) {
    const k = norm(label)
    setFavs((prev) =>
      prev.some((p) => norm(p) === k) ? prev.filter((p) => norm(p) !== k) : [...prev, label],
    )
  }

  const q = norm(search)
  const searching = q.length > 0
  const visibleGroups = searching
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.key.includes(q)) }))
        .filter((g) => g.items.length > 0)
    : groups

  return (
    <div className="screen">
      <h1 className="screen-title">Frigo</h1>

      {/* --- Ce que j'ai --- */}
      {items.length === 0 ? (
        <p className="tool-hint" style={{ marginTop: 0 }}>
          Coche ci-dessous ce que tu as dans ton frigo et tes placards : je te proposerai des
          recettes réalisables (ou presque) avec ce que tu as. Sel, poivre, huile, sucre et
          vinaigre sont considérés toujours disponibles.
        </p>
      ) : (
        <div className="fridge-items">
          {items.map((it) => (
            <span className="fridge-chip" key={it}>
              {it}
              <button type="button" onClick={() => toggleItem(it)} aria-label={`Retirer ${it} du frigo`}>
                <Icon name="close" size={11} />
              </button>
            </span>
          ))}
          <button type="button" className="fridge-clear" onClick={() => setItems([])}>
            Tout vider
          </button>
        </div>
      )}

      {/* --- Souvent utile (favoris gérés par l'utilisateur) --- */}
      {favs.filter((f) => !owned.has(norm(f))).length > 0 && (
        <div className="fridge-suggest">
          <span className="fs-label">Souvent utile :</span>
          {favs
            .filter((f) => !owned.has(norm(f)))
            .map((f) => (
              <span className="fs-chip" key={f}>
                <button type="button" className="fs-add" onClick={() => toggleItem(f)}>
                  + {f}
                </button>
                <button
                  type="button"
                  className="fs-del"
                  onClick={() => toggleFav(f)}
                  aria-label={`Retirer ${f} des favoris`}
                >
                  <Icon name="close" size={10} />
                </button>
              </span>
            ))}
        </div>
      )}

      {/* --- Catalogue d'aliments (recherche + catégories) --- */}
      <div className="fridge-add">
        <input
          type="search"
          value={search}
          placeholder="Chercher un aliment (tomate, riz, poulet…)"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <p className="tool-hint" style={{ marginTop: 0 }}>
        Touche un aliment pour l'ajouter / le retirer, l'étoile pour le garder dans « Souvent
        utile ». Tous les aliments proposés ont au moins une recette.
      </p>

      <div className="fridge-catalog">
        {visibleGroups.map((g) => {
          const open = searching || openCats.has(g.cat)
          const ownedCount = g.items.filter((i) => owned.has(i.key)).length
          return (
            <div className="fc-group" key={g.cat}>
              <button
                type="button"
                className="fc-head"
                onClick={() =>
                  setOpenCats((prev) => {
                    const next = new Set(prev)
                    if (next.has(g.cat)) next.delete(g.cat)
                    else next.add(g.cat)
                    return next
                  })
                }
                aria-expanded={open}
              >
                <Icon name={open ? 'chevron-down' : 'chevron-right'} size={15} />
                <span className="fc-name">{g.cat}</span>
                <span className="fc-count">
                  {ownedCount > 0 ? `${ownedCount} · ` : ''}
                  {g.items.length}
                </span>
              </button>
              {open && (
                <div className="fc-items">
                  {g.items.map((i) => {
                    const has = owned.has(i.key)
                    const fav = favKeys.has(i.key)
                    return (
                      <span className={`cat-item${has ? ' on' : ''}`} key={i.key}>
                        <button
                          type="button"
                          className="cat-chip"
                          onClick={() => toggleItem(i.label)}
                          aria-pressed={has}
                        >
                          {has ? <Icon name="check" size={12} /> : '+'} {i.label}
                        </button>
                        <button
                          type="button"
                          className={`cat-star${fav ? ' on' : ''}`}
                          onClick={() => toggleFav(i.label)}
                          aria-pressed={fav}
                          aria-label={
                            fav ? `Retirer ${i.label} des favoris` : `Ajouter ${i.label} aux favoris`
                          }
                        >
                          <Icon name="star" size={12} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {searching && visibleGroups.length === 0 && (
          <p className="tool-hint">Aucun aliment ne correspond à « {search} ».</p>
        )}
      </div>

      {/* --- Recettes --- */}
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
          <div className="section-h">Presque — il manque 1 ou 2 ingrédients · {near.length}</div>
          {near.map((s) => (
            <RecipeCard key={s.recipe.name} scored={s} owned={owned} />
          ))}
        </>
      )}

      {fallback.length > 0 && (
        <>
          <div className="section-h">Meilleures pistes avec ton frigo</div>
          {fallback.map((s) => (
            <RecipeCard key={s.recipe.name} scored={s} owned={owned} />
          ))}
        </>
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
            <span className="recipe-state warn">Il manque : {missing.join(', ')}</span>
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
