---
read_when:
    - Vous souhaitez disposer de connaissances persistantes au-delà de simples notes MEMORY.md
    - Vous configurez le plugin memory-wiki intégré
    - Vous voulez comprendre wiki_search, wiki_get ou le mode bridge
summary: 'memory-wiki : coffre de connaissances compilées avec provenance, revendications, tableaux de bord et mode passerelle'
title: Wiki de mémoire
x-i18n:
    generated_at: "2026-06-27T17:49:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` est un plugin groupé qui transforme la mémoire durable en coffre de connaissances compilé.

Il ne remplace **pas** le plugin de mémoire active. Le plugin de mémoire active reste responsable du rappel, de la promotion, de l’indexation et du Dreaming. `memory-wiki` fonctionne à côté de lui et compile les connaissances durables dans un wiki navigable avec des pages déterministes, des affirmations structurées, la provenance, des tableaux de bord et des condensés lisibles par machine.

Utilisez-le lorsque vous voulez que la mémoire se comporte davantage comme une couche de connaissances maintenue, et moins comme un amas de fichiers Markdown.

## Ce qu’il ajoute

- Un coffre wiki dédié avec une mise en page de pages déterministe
- Des métadonnées structurées d’affirmation et de preuve, pas seulement de la prose
- Une provenance, une confiance, des contradictions et des questions ouvertes au niveau des pages
- Des condensés compilés pour les consommateurs agent/runtime
- Des outils natifs wiki de recherche/consultation/application/lint
- Des imports Open Knowledge Format dans des concepts wiki compilés
- Un mode passerelle optionnel qui importe les artefacts publics depuis le plugin de mémoire active
- Un mode de rendu compatible Obsidian optionnel et une intégration CLI

## Comment il s’intègre avec la mémoire

Pensez à la séparation comme suit :

| Couche                                                  | Possède                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin de mémoire active (`memory-core`, QMD, Honcho, etc.) | Rappel, recherche sémantique, promotion, Dreaming, runtime mémoire                               |
| `memory-wiki`                                           | Pages wiki compilées, synthèses riches en provenance, tableaux de bord, recherche/consultation/application propres au wiki |

Si le plugin de mémoire active expose des artefacts de rappel partagés, OpenClaw peut rechercher dans les deux couches en une seule passe avec `memory_search corpus=all`.

Lorsque vous avez besoin d’un classement propre au wiki, de provenance ou d’un accès direct aux pages, utilisez plutôt les outils natifs wiki.

## Modèle hybride recommandé

Un bon choix par défaut pour les configurations local-first est :

- QMD comme backend de mémoire active pour le rappel et la recherche sémantique large
- `memory-wiki` en mode `bridge` pour les pages de connaissances synthétisées durables

Cette séparation fonctionne bien, car chaque couche reste concentrée :

- QMD garde les notes brutes, les exports de session et les collections supplémentaires consultables
- `memory-wiki` compile les entités stables, les affirmations, les tableaux de bord et les pages sources

Règle pratique :

- utilisez `memory_search` lorsque vous voulez une large passe de rappel dans la mémoire
- utilisez `wiki_search` et `wiki_get` lorsque vous voulez des résultats wiki sensibles à la provenance
- utilisez `memory_search corpus=all` lorsque vous voulez que la recherche partagée couvre les deux couches

Si le mode passerelle signale zéro artefact exporté, le plugin de mémoire active n’expose pas encore actuellement d’entrées publiques de passerelle. Exécutez d’abord `openclaw wiki doctor`, puis confirmez que le plugin de mémoire active prend en charge les artefacts publics.

Lorsque le mode passerelle est actif et que `bridge.readMemoryArtifacts` est activé, `openclaw wiki status`, `openclaw wiki doctor` et `openclaw wiki bridge import` lisent via le Gateway en cours d’exécution. Cela garde les vérifications CLI de passerelle alignées avec le contexte du plugin de mémoire runtime. Si la passerelle est désactivée ou si les lectures d’artefacts sont désactivées, ces commandes conservent leur comportement local/hors ligne.

## Modes de coffre

`memory-wiki` prend en charge trois modes de coffre :

### `isolated`

Coffre propre, sources propres, aucune dépendance à `memory-core`.

Utilisez ce mode lorsque vous voulez que le wiki soit son propre magasin de connaissances organisé.

### `bridge`

Lit les artefacts de mémoire publics et les événements mémoire depuis le plugin de mémoire active via les jonctions publiques du SDK de plugin.

Utilisez ce mode lorsque vous voulez que le wiki compile et organise les artefacts exportés du plugin de mémoire sans accéder aux éléments internes privés du plugin.

Le mode passerelle peut indexer :

- les artefacts de mémoire exportés
- les rapports de Dreaming
- les notes quotidiennes
- les fichiers racine de mémoire
- les journaux d’événements mémoire

### `unsafe-local`

Échappatoire explicite sur la même machine pour des chemins locaux privés.

Ce mode est volontairement expérimental et non portable. Utilisez-le seulement si vous comprenez la frontière de confiance et avez spécifiquement besoin d’un accès au système de fichiers local que le mode passerelle ne peut pas fournir.

## Disposition du coffre

Le plugin initialise un coffre comme ceci :

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Le contenu géré reste à l’intérieur des blocs générés. Les blocs de notes humaines sont préservés.

Les principaux groupes de pages sont :

- `sources/` pour les matières premières importées et les pages soutenues par la passerelle
- `entities/` pour les éléments durables, personnes, systèmes, projets et objets
- `concepts/` pour les idées, abstractions, modèles et politiques
- `syntheses/` pour les résumés compilés et les agrégats maintenus
- `reports/` pour les tableaux de bord générés

## Imports Open Knowledge Format

`memory-wiki` peut importer des lots Open Knowledge Format décompressés avec :

```bash
openclaw wiki okf import ./bundles/ga4
```

C’est l’ajustement le plus propre lorsqu’un catalogue de données, un crawler de documentation ou un agent d’enrichissement produit déjà de l’OKF : gardez l’OKF comme artefact d’échange portable, puis laissez `memory-wiki` le transformer en pages de concepts natives OpenClaw et en condensés compilés.

L’importateur suit la forme OKF v0.1 :

- les fichiers `.md` non réservés sont des documents de concept
- chaque concept importé nécessite un champ frontmatter `type` non vide
- les valeurs OKF `type` inconnues sont acceptées
- les fichiers réservés `index.md` et `log.md` ne sont pas importés comme concepts
- les liens Markdown cassés ou externes sont préservés

Les pages de concepts importées sont aplaties sous `concepts/` afin que les chemins existants de compilation, recherche, consultation, tableau de bord et condensé de prompt les voient sans ajouter un second arbre wiki. Chaque page conserve l’ID de concept OKF d’origine, le chemin source, `type`, `resource`, `tags`, l’horodatage et le frontmatter complet du producteur. Les liens OKF internes sont réécrits vers les pages de concepts wiki générées et également émis comme entrées `relationships` structurées avec `kind: okf-link`.

## Affirmations structurées et preuves

Les pages peuvent porter du frontmatter `claims` structuré, pas seulement du texte libre.

Chaque affirmation peut inclure :

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Les entrées de preuve peuvent inclure :

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

C’est ce qui fait que le wiki agit davantage comme une couche de croyances que comme un dépôt passif de notes. Les affirmations peuvent être suivies, notées, contestées et rattachées à des sources.

## Métadonnées d’entité destinées aux agents

Les pages d’entité peuvent aussi porter des métadonnées de routage pour l’usage des agents. Il s’agit de frontmatter générique, donc cela fonctionne pour les personnes, équipes, systèmes, projets ou tout autre type d’entité.

Les champs courants incluent :

- `entityType` : par exemple `person`, `team`, `system` ou `project`
- `canonicalId` : clé d’identité stable utilisée entre les alias et les imports
- `aliases` : noms, identifiants ou libellés qui doivent résoudre vers la même page
- `privacyTier` : `public`, `local-private`, `sensitive` ou `confirm-before-use`
- `bestUsedFor` / `notEnoughFor` : indications compactes de routage
- `lastRefreshedAt` : horodatage de rafraîchissement de source distinct de l’heure de modification de la page
- `personCard` : carte de routage optionnelle propre à une personne avec identifiants, réseaux sociaux,
  e-mails, fuseau horaire, domaine, sujets à demander, sujets à éviter, confiance et confidentialité
- `relationships` : arêtes typées vers des pages liées avec cible, nature, poids,
  confiance, type de preuve, niveau de confidentialité et note

Pour un wiki de personnes, l’agent doit généralement commencer par `reports/person-agent-directory.md`, puis ouvrir la page de la personne avec `wiki_get` avant d’utiliser des coordonnées ou des faits inférés.

Exemple :

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Pipeline de compilation

L’étape de compilation lit les pages wiki, normalise les résumés et émet des artefacts stables orientés machine sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ces condensés existent afin que les agents et le code runtime n’aient pas à extraire les pages Markdown.

La sortie compilée alimente aussi :

- l’indexation wiki de première passe pour les flux de recherche/consultation
- la résolution d’ID d’affirmation vers les pages propriétaires
- les suppléments compacts de prompt
- la génération de rapports/tableaux de bord

## Tableaux de bord et rapports de santé

Lorsque `render.createDashboards` est activé, la compilation maintient des tableaux de bord sous `reports/`.

Les rapports intégrés incluent :

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Ces rapports suivent des éléments comme :

- les groupes de notes contradictoires
- les groupes d’affirmations concurrentes
- les affirmations sans preuve structurée
- les pages et affirmations à faible confiance
- la fraîcheur obsolète ou inconnue
- les pages avec des questions non résolues
- les cartes de routage personne/entité
- les arêtes de relations structurées
- la couverture par classe de preuve
- les niveaux de confidentialité non publics nécessitant un examen avant utilisation

## Recherche et récupération

`memory-wiki` prend en charge deux backends de recherche :

- `shared` : utiliser le flux de recherche de mémoire partagée lorsqu’il est disponible
- `local` : rechercher localement dans le wiki

Il prend aussi en charge trois corpus :

- `wiki`
- `memory`
- `all`

Comportement important :

- `wiki_search` et `wiki_get` utilisent les condensés compilés comme première passe lorsque possible
- les ID d’affirmation peuvent résoudre vers la page propriétaire
- les affirmations contestées/obsolètes/fraîches influencent le classement
- les libellés de provenance peuvent survivre dans les résultats
- le mode de recherche peut biaiser le classement pour la recherche de personnes, le routage de questions, les preuves sources ou les affirmations brutes

Règle pratique :

- utilisez `memory_search corpus=all` pour une large passe de rappel
- utilisez `wiki_search` + `wiki_get` lorsque le classement propre au wiki,
  la provenance ou la structure de croyance au niveau des pages vous importent

Modes de recherche :

- `auto` : valeur par défaut équilibrée
- `find-person` : renforcer les entités de type personne, alias, identifiants, réseaux sociaux et
  ID canoniques
- `route-question` : renforcer les cartes d’agent, indications de sujets à demander, indications d’usage recommandé et
  contexte de relation
- `source-evidence` : renforcer les pages sources et les métadonnées de preuve structurée
- `raw-claim` : renforcer les affirmations structurées correspondantes et renvoyer les métadonnées
  d’affirmation/preuve dans les résultats

Lorsqu’un résultat correspond à une affirmation structurée, `wiki_search` peut renvoyer `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` et `evidenceSourceIds` dans sa charge utile de détails. La sortie texte inclut aussi des lignes compactes `Claim:` et `Evidence:` lorsqu’elles sont disponibles.

## Outils d’agent

Le plugin enregistre ces outils :

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ce qu’ils font :

- `wiki_status` : mode de coffre actuel, santé, disponibilité de la CLI Obsidian
- `wiki_search` : rechercher dans les pages wiki et, lorsque configuré, dans les corpus de mémoire partagée ;
  accepte `mode` pour la recherche de personnes, le routage de questions, les preuves sources ou l’exploration
  d’affirmations brutes
- `wiki_get` : lire une page wiki par ID/chemin ou revenir au corpus de mémoire partagée
- `wiki_apply` : mutations ciblées de synthèse/métadonnées sans chirurgie libre de page
- `wiki_lint` : vérifications structurelles, lacunes de provenance, contradictions, questions ouvertes

Le plugin enregistre aussi un supplément de corpus mémoire non exclusif, afin que
`memory_search` et `memory_get` partagés puissent atteindre le wiki lorsque le
plugin de mémoire active prend en charge la sélection de corpus.

## Comportement du prompt et du contexte

Lorsque `context.includeCompiledDigestPrompt` est activé, les sections de prompt
mémoire ajoutent un instantané compilé compact depuis `agent-digest.json`.

Cet instantané est volontairement petit et à fort signal :

- pages principales uniquement
- affirmations principales uniquement
- nombre de contradictions
- nombre de questions
- qualificatifs de confiance/fraîcheur

C’est opt-in, car cela modifie la forme du prompt et s’avère surtout utile pour
les moteurs de contexte ou l’assemblage de prompts legacy qui consomment
explicitement des suppléments mémoire.

## Configuration

Placez la configuration sous `plugins.entries.memory-wiki.config` :

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Options clés :

- `vaultMode` : `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode` : `native` ou `obsidian`
- `bridge.readMemoryArtifacts` : importer les artefacts publics du plugin de mémoire active
- `bridge.followMemoryEvents` : inclure les journaux d’événements en mode bridge
- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt` : ajouter un instantané de digest compact aux sections de prompt mémoire
- `render.createBacklinks` : générer des blocs associés déterministes
- `render.createDashboards` : générer des pages de tableau de bord

### Exemple : QMD + mode bridge

Utilisez ceci lorsque vous voulez QMD pour le rappel et `memory-wiki` pour une
couche de connaissances maintenue :

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Cela conserve :

- QMD responsable du rappel de la mémoire active
- `memory-wiki` centré sur les pages compilées et les tableaux de bord
- la forme du prompt inchangée jusqu’à ce que vous activiez intentionnellement les prompts de digest compilé

## CLI

`memory-wiki` expose aussi une surface CLI de premier niveau :

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Consultez [CLI : wiki](/fr/cli/wiki) pour la référence complète des commandes.

## Prise en charge d’Obsidian

Lorsque `vault.renderMode` vaut `obsidian`, le plugin écrit du Markdown compatible
avec Obsidian et peut éventuellement utiliser la CLI officielle `obsidian`.

Les workflows pris en charge incluent :

- vérification du statut
- recherche dans le coffre
- ouverture d’une page
- invocation d’une commande Obsidian
- accès direct à la note quotidienne

C’est facultatif. Le wiki fonctionne toujours en mode natif sans Obsidian.

## Workflow recommandé

1. Conservez votre plugin de mémoire active pour le rappel, la promotion et le Dreaming.
2. Activez `memory-wiki`.
3. Commencez avec le mode `isolated`, sauf si vous voulez explicitement le mode bridge.
4. Utilisez `wiki_search` / `wiki_get` lorsque la provenance est importante.
5. Utilisez `wiki_apply` pour des synthèses étroites ou des mises à jour de métadonnées.
6. Exécutez `wiki_lint` après des changements significatifs.
7. Activez les tableaux de bord si vous voulez de la visibilité sur l’obsolescence ou les contradictions.

## Documentation associée

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)
- [CLI : wiki](/fr/cli/wiki)
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)
