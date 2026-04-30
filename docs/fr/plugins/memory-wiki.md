---
read_when:
    - Vous voulez des connaissances persistantes au-delà de simples notes MEMORY.md
    - Vous configurez le Plugin memory-wiki intégré
    - Vous souhaitez comprendre wiki_search, wiki_get ou le mode pont
summary: 'memory-wiki: coffre de connaissances compilées avec provenance, affirmations, tableaux de bord et mode pont'
title: Wiki de mémoire
x-i18n:
    generated_at: "2026-04-30T07:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` est un Plugin intégré qui transforme la mémoire durable en un coffre de
connaissances compilé.

Il ne remplace **pas** le Plugin Active Memory. Le Plugin Active Memory reste
responsable du rappel, de la promotion, de l’indexation et de Dreaming. `memory-wiki` fonctionne à ses côtés
et compile les connaissances durables dans un wiki navigable avec des pages déterministes,
des affirmations structurées, de la provenance, des tableaux de bord et des condensés lisibles par machine.

Utilisez-le lorsque vous voulez que la mémoire se comporte davantage comme une couche de connaissances maintenue et
moins comme un tas de fichiers Markdown.

## Ce qu’il ajoute

- Un coffre wiki dédié avec une mise en page de pages déterministe
- Des métadonnées structurées d’affirmations et de preuves, pas seulement du texte
- Provenance, confiance, contradictions et questions ouvertes au niveau des pages
- Des condensés compilés pour les consommateurs agent/runtime
- Des outils natifs du wiki pour rechercher/obtenir/appliquer/linter
- Un mode pont optionnel qui importe les artefacts publics du Plugin Active Memory
- Un mode de rendu compatible avec Obsidian et une intégration CLI optionnels

## Comment il s’intègre à la mémoire

Pensez à la séparation ainsi :

| Couche                                                  | Possède                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, etc.) | Rappel, recherche sémantique, promotion, Dreaming, runtime mémoire                         |
| `memory-wiki`                                           | Pages wiki compilées, synthèses riches en provenance, tableaux de bord, recherche/get/apply propres au wiki |

Si le Plugin Active Memory expose des artefacts de rappel partagés, OpenClaw peut rechercher
dans les deux couches en une seule passe avec `memory_search corpus=all`.

Lorsque vous avez besoin d’un classement propre au wiki, de provenance ou d’un accès direct aux pages, utilisez plutôt
les outils natifs du wiki.

## Modèle hybride recommandé

Un bon réglage par défaut pour les configurations local-first est :

- QMD comme backend Active Memory pour le rappel et la recherche sémantique large
- `memory-wiki` en mode `bridge` pour les pages de connaissances synthétisées durables

Cette séparation fonctionne bien parce que chaque couche reste concentrée :

- QMD garde les notes brutes, les exports de session et les collections supplémentaires consultables
- `memory-wiki` compile les entités stables, les affirmations, les tableaux de bord et les pages sources

Règle pratique :

- utilisez `memory_search` lorsque vous voulez une passe de rappel large sur la mémoire
- utilisez `wiki_search` et `wiki_get` lorsque vous voulez des résultats wiki tenant compte de la provenance
- utilisez `memory_search corpus=all` lorsque vous voulez que la recherche partagée couvre les deux couches

Si le mode pont indique zéro artefact exporté, le Plugin Active Memory n’expose pas
encore actuellement d’entrées de pont publiques. Exécutez d’abord `openclaw wiki doctor`,
puis confirmez que le Plugin Active Memory prend en charge les artefacts publics.

Lorsque le mode pont est actif et que `bridge.readMemoryArtifacts` est activé,
`openclaw wiki status`, `openclaw wiki doctor` et `openclaw wiki bridge
import` lisent via le Gateway en cours d’exécution. Cela garde les vérifications CLI du pont alignées
sur le contexte runtime du Plugin mémoire. Si le pont est désactivé ou si les lectures d’artefacts
sont coupées, ces commandes conservent leur comportement local/hors ligne.

## Modes de coffre

`memory-wiki` prend en charge trois modes de coffre :

### `isolated`

Coffre propre, sources propres, aucune dépendance à `memory-core`.

Utilisez ceci lorsque vous voulez que le wiki soit son propre magasin de connaissances organisé.

### `bridge`

Lit les artefacts mémoire publics et les événements mémoire depuis le Plugin Active Memory
via les coutures publiques du SDK de Plugin.

Utilisez ceci lorsque vous voulez que le wiki compile et organise les artefacts exportés du Plugin mémoire
sans accéder aux éléments internes privés du Plugin.

Le mode pont peut indexer :

- artefacts mémoire exportés
- rapports de rêve
- notes quotidiennes
- fichiers racine de mémoire
- journaux d’événements mémoire

### `unsafe-local`

Issue de secours explicite sur la même machine pour les chemins privés locaux.

Ce mode est volontairement expérimental et non portable. Utilisez-le seulement lorsque vous
comprenez la frontière de confiance et avez précisément besoin d’un accès au système de fichiers local que
le mode pont ne peut pas fournir.

## Agencement du coffre

Le Plugin initialise un coffre comme ceci :

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

Le contenu géré reste dans des blocs générés. Les blocs de notes humaines sont préservés.

Les principaux groupes de pages sont :

- `sources/` pour le matériau brut importé et les pages adossées au pont
- `entities/` pour les éléments durables, les personnes, les systèmes, les projets et les objets
- `concepts/` pour les idées, abstractions, modèles et politiques
- `syntheses/` pour les résumés compilés et les regroupements maintenus
- `reports/` pour les tableaux de bord générés

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

C’est ce qui fait que le wiki agit davantage comme une couche de croyances que comme un simple dépôt
passif de notes. Les affirmations peuvent être suivies, notées, contestées et résolues en remontant aux sources.

## Métadonnées d’entité destinées aux agents

Les pages d’entité peuvent aussi porter des métadonnées de routage pour l’usage des agents. Il s’agit de
frontmatter générique, donc cela fonctionne pour les personnes, équipes, systèmes, projets ou tout autre
type d’entité.

Les champs courants incluent :

- `entityType` : par exemple `person`, `team`, `system` ou `project`
- `canonicalId` : clé d’identité stable utilisée entre les alias et les imports
- `aliases` : noms, pseudonymes ou libellés qui doivent se résoudre vers la même page
- `privacyTier` : `public`, `local-private`, `sensitive` ou `confirm-before-use`
- `bestUsedFor` / `notEnoughFor` : indices de routage compacts
- `lastRefreshedAt` : horodatage d’actualisation de source distinct de l’heure de modification de la page
- `personCard` : carte de routage optionnelle propre aux personnes avec pseudonymes, réseaux sociaux,
  e-mails, fuseau horaire, voie, à demander, à éviter de demander, confiance et confidentialité
- `relationships` : arêtes typées vers des pages liées avec cible, nature, poids,
  confiance, type de preuve, niveau de confidentialité et note

Pour un wiki de personnes, l’agent devrait généralement commencer par
`reports/person-agent-directory.md`, puis ouvrir la page de la personne avec `wiki_get`
avant d’utiliser des coordonnées ou des faits inférés.

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

L’étape de compilation lit les pages du wiki, normalise les résumés et émet des artefacts stables
destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ces condensés existent pour que les agents et le code runtime n’aient pas à extraire les pages
Markdown.

La sortie compilée alimente aussi :

- l’indexation wiki de première passe pour les flux search/get
- la recherche d’id d’affirmation vers les pages propriétaires
- les suppléments de prompt compacts
- la génération de rapports/tableaux de bord

## Tableaux de bord et rapports de santé

Lorsque `render.createDashboards` est activé, la compilation maintient les tableaux de bord sous
`reports/`.

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
- les arêtes de relation structurées
- la couverture des classes de preuves
- les niveaux de confidentialité non publics qui nécessitent une revue avant utilisation

## Recherche et récupération

`memory-wiki` prend en charge deux backends de recherche :

- `shared` : utiliser le flux de recherche mémoire partagé lorsqu’il est disponible
- `local` : rechercher localement dans le wiki

Il prend aussi en charge trois corpus :

- `wiki`
- `memory`
- `all`

Comportement important :

- `wiki_search` et `wiki_get` utilisent les condensés compilés comme première passe lorsque possible
- les ids d’affirmation peuvent se résoudre vers la page propriétaire
- les affirmations contestées/obsolètes/fraîches influencent le classement
- les libellés de provenance peuvent être conservés dans les résultats
- le mode de recherche peut orienter le classement vers la recherche de personnes, le routage de questions, les preuves
  sources ou les affirmations brutes

Règle pratique :

- utilisez `memory_search corpus=all` pour une passe de rappel large
- utilisez `wiki_search` + `wiki_get` lorsque le classement propre au wiki,
  la provenance ou la structure de croyances au niveau des pages vous importent

Modes de recherche :

- `auto` : réglage par défaut équilibré
- `find-person` : privilégie les entités de type personne, les alias, les pseudonymes, les réseaux sociaux et
  les IDs canoniques
- `route-question` : privilégie les cartes d’agent, les indices à demander, les indices d’usage recommandé et
  le contexte relationnel
- `source-evidence` : privilégie les pages sources et les métadonnées de preuves structurées
- `raw-claim` : privilégie les affirmations structurées correspondantes et renvoie les métadonnées
  d’affirmation/preuve dans les résultats

Lorsqu’un résultat correspond à une affirmation structurée, `wiki_search` peut renvoyer
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` et `evidenceSourceIds` dans sa charge utile de détails. La sortie texte
inclut aussi des lignes compactes `Claim:` et `Evidence:` lorsqu’elles sont disponibles.

## Outils d’agent

Le Plugin enregistre ces outils :

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ce qu’ils font :

- `wiki_status` : mode de coffre actuel, santé, disponibilité de la CLI Obsidian
- `wiki_search` : recherche dans les pages wiki et, lorsque configuré, dans les corpus mémoire partagés ;
  accepte `mode` pour la recherche de personnes, le routage de questions, les preuves sources ou
  l’exploration des affirmations brutes
- `wiki_get` : lire une page wiki par id/chemin ou se rabattre sur le corpus mémoire partagé
- `wiki_apply` : mutations étroites de synthèse/métadonnées sans chirurgie de page libre
- `wiki_lint` : vérifications structurelles, lacunes de provenance, contradictions, questions ouvertes

Le Plugin enregistre aussi un supplément non exclusif de corpus mémoire, afin que les
`memory_search` et `memory_get` partagés puissent atteindre le wiki lorsque le Plugin Active Memory
prend en charge la sélection de corpus.

## Comportement du prompt et du contexte

Lorsque `context.includeCompiledDigestPrompt` est activé, les sections de prompt mémoire
ajoutent un instantané compilé compact depuis `agent-digest.json`.

Cet instantané est volontairement petit et à fort signal :

- pages principales seulement
- affirmations principales seulement
- nombre de contradictions
- nombre de questions
- qualificateurs de confiance/fraîcheur

Cette option est opt-in parce qu’elle modifie la forme du prompt et est surtout utile pour les moteurs de contexte
ou l’assemblage de prompts historique qui consomment explicitement des suppléments mémoire.

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
- `bridge.readMemoryArtifacts` : importer les artefacts publics du Plugin Active Memory
- `bridge.followMemoryEvents` : inclure les journaux d’événements en mode bridge
- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt` : ajouter un instantané de résumé compact aux sections de prompt mémoire
- `render.createBacklinks` : générer des blocs associés déterministes
- `render.createDashboards` : générer des pages de tableaux de bord

### Exemple : mode QMD + bridge

Utilisez ceci lorsque vous voulez QMD pour le rappel et `memory-wiki` pour une
couche de connaissances maintenue :

```json5
{
  memory: {
    backend: "qmd",
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

- QMD responsable du rappel d’Active Memory
- `memory-wiki` concentré sur les pages compilées et les tableaux de bord
- la forme du prompt inchangée jusqu’à ce que vous activiez intentionnellement les prompts de résumé compilé

## CLI

`memory-wiki` expose également une surface CLI de premier niveau :

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

Lorsque `vault.renderMode` vaut `obsidian`, le Plugin écrit du Markdown compatible
avec Obsidian et peut utiliser facultativement la CLI officielle `obsidian`.

Les workflows pris en charge incluent :

- le sondage de l’état
- la recherche dans le coffre
- l’ouverture d’une page
- l’appel d’une commande Obsidian
- le passage à la note quotidienne

C’est facultatif. Le wiki fonctionne toujours en mode natif sans Obsidian.

## Workflow recommandé

1. Gardez votre Plugin Active Memory pour le rappel/la promotion/le Dreaming.
2. Activez `memory-wiki`.
3. Commencez par le mode `isolated`, sauf si vous voulez explicitement le mode bridge.
4. Utilisez `wiki_search` / `wiki_get` lorsque la provenance compte.
5. Utilisez `wiki_apply` pour des synthèses ciblées ou des mises à jour de métadonnées.
6. Exécutez `wiki_lint` après des modifications significatives.
7. Activez les tableaux de bord si vous voulez une visibilité sur l’obsolescence/les contradictions.

## Documents associés

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)
- [CLI : wiki](/fr/cli/wiki)
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)
