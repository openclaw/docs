---
read_when:
    - Vous souhaitez disposer de connaissances persistantes au-delà de simples notes dans MEMORY.md
    - Vous configurez le plugin memory-wiki intégré
    - Vous avez besoin de coffres wiki distincts pour les agents au sein d’un même Gateway
    - Vous souhaitez comprendre wiki_search, wiki_get ou le mode bridge
summary: 'memory-wiki : coffre de connaissances compilées avec provenance, affirmations, tableaux de bord et mode passerelle'
title: Wiki de la mémoire
x-i18n:
    generated_at: "2026-07-12T02:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` est un plugin intégré qui compile les connaissances durables dans un
wiki navigable : pages déterministes, affirmations structurées avec preuves,
provenance, tableaux de bord et condensés lisibles par machine.

Il ne remplace pas le plugin de mémoire active. Le rappel, la promotion, l’indexation et
Dreaming restent sous la responsabilité du backend de mémoire configuré
(`memory-core`, QMD, Honcho, etc.). `memory-wiki` fonctionne à ses côtés et compile
les connaissances dans une couche wiki maintenue.

| Couche                    | Responsabilités                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Plugin de mémoire active  | Rappel, recherche sémantique, promotion, Dreaming, environnement d’exécution de la mémoire            |
| `memory-wiki`             | Pages wiki compilées, synthèses riches en provenance, tableaux de bord, recherche/lecture/application wiki |

Règle pratique :

- `memory_search` pour une passe de rappel générale dans tous les corpus configurés
- `wiki_search` / `wiki_get` lorsque vous souhaitez un classement propre au wiki, la provenance ou une structure de croyances au niveau des pages
- `memory_search corpus=all` pour couvrir les deux couches en un seul appel, lorsque le plugin de mémoire active prend en charge la sélection du corpus

Une configuration locale courante : QMD comme backend de mémoire active pour le rappel, et
`memory-wiki` en mode `bridge` pour les pages synthétisées durables. Consultez
l’exemple QMD avec mode passerelle dans [Configuration](#configuration).

Si le mode passerelle signale qu’aucun artefact n’a été exporté, le plugin de mémoire active
n’expose actuellement aucune entrée publique de passerelle. Exécutez d’abord `openclaw wiki doctor`,
puis vérifiez que le plugin de mémoire active prend en charge les artefacts publics.

## Modes du coffre

- `isolated` (par défaut) : coffre propre, sources propres, aucune dépendance envers le plugin de mémoire active. Utilisez ce mode pour un référentiel de connaissances organisé et autonome.
- `bridge` : lit les artefacts publics de mémoire et les journaux d’événements du plugin de mémoire active via les interfaces publiques du SDK de plugins. Utilisez ce mode pour compiler les artefacts exportés par le plugin de mémoire sans accéder à ses éléments internes privés.
- `unsafe-local` : échappatoire explicite sur une même machine pour les chemins locaux privés. Volontairement expérimental et non portable ; utilisez ce mode uniquement si vous comprenez la frontière de confiance et avez spécifiquement besoin d’un accès au système de fichiers local que le mode passerelle ne peut pas fournir.

Le mode et la portée du coffre sont deux choix distincts :

- `vaultMode` détermine la provenance des entrées du wiki.
- `vault.scope` détermine si tous les agents utilisent un seul coffre ou si chaque agent dispose d’un coffre enfant.

`vault.scope: "global"` est la valeur par défaut et préserve le comportement existant
avec un coffre unique. Utilisez `vault.scope: "agent"` avec le mode `isolated` ou `bridge` lorsque
les agents ne doivent pas partager les pages wiki, les condensés compilés, les résultats de recherche ni les écritures.
La portée par agent ne peut pas être combinée au mode `unsafe-local`, car les chemins privés
configurés ne sont pas des entrées appartenant aux agents. La validation de la configuration rejette cette
combinaison.

Le mode passerelle peut indexer, selon chaque option de configuration `bridge.*` :

- les artefacts de mémoire exportés (`indexMemoryRoot`)
- les notes quotidiennes (`indexDailyNotes`)
- les rapports de rêves (`indexDreamReports`)
- les journaux d’événements de mémoire (`followMemoryEvents`)

Lorsque le mode passerelle est actif et que `bridge.readMemoryArtifacts` est activé,
`openclaw wiki status`, `openclaw wiki doctor` et `openclaw wiki bridge
import` passent par le Gateway en cours d’exécution afin d’utiliser le même contexte du plugin de mémoire active
que la mémoire des agents et de l’environnement d’exécution. Si la passerelle est désactivée ou si la lecture
des artefacts est désactivée, ces commandes conservent leur comportement local/hors ligne.

## Structure du coffre

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

Le contenu géré reste à l’intérieur des blocs générés ; les blocs de notes humaines sont
préservés lors des régénérations.

- `sources/` : contenu brut importé et pages adossées au mode passerelle ou `unsafe-local`
- `entities/` : éléments durables, personnes, systèmes, projets, objets
- `concepts/` : idées, abstractions, modèles, politiques (également destination des importations OKF)
- `syntheses/` : résumés compilés et récapitulatifs maintenus
- `reports/` : tableaux de bord générés

## Importations au format Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importez un paquet Open Knowledge Format décompressé dans les pages de concepts du wiki. Cette approche convient
lorsqu’un catalogue de données, un robot d’exploration de documentation ou un agent d’enrichissement
produit déjà du contenu OKF : conservez OKF comme artefact d’échange portable et laissez `memory-wiki`
le transformer en pages de concepts natives d’OpenClaw et en condensés compilés.

- les fichiers `.md` non réservés sont des documents de concepts
- chaque concept importé nécessite un champ de frontmatter `type` non vide ; l’absence de `type` produit un avertissement `missing-type` et le fichier est ignoré
- les valeurs `type` inconnues sont acceptées comme concepts génériques
- `index.md` et `log.md` sont réservés et ne sont jamais importés comme concepts
- les liens Markdown rompus ou externes restent inchangés

Les pages importées sont regroupées directement sous `concepts/` afin que les flux existants de compilation, de recherche, de lecture et
de tableaux de bord puissent les utiliser sans créer une seconde arborescence wiki. Chaque page conserve
l’identifiant de concept OKF d’origine, le chemin source, `type`, `resource`, `tags`, l’horodatage
et l’intégralité du frontmatter du producteur. Les liens OKF internes sont réécrits pour pointer vers les
pages de concepts wiki générées et produisent également des entrées `relationships` structurées avec
`kind: okf-link`.

## Affirmations structurées et preuves

Les pages contiennent un frontmatter `claims` structuré, et pas uniquement du texte libre. Chaque
affirmation peut inclure `id`, `text`, `status`, `confidence`, `evidence[]` et
`updatedAt`. Chaque entrée de preuve peut inclure `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` et `updatedAt`.

Le wiki se comporte ainsi comme une couche de croyances, et non comme un simple dépôt passif de notes.
Les affirmations peuvent être suivies, évaluées, contestées et rattachées à leurs sources.

## Métadonnées d’entités destinées aux agents

Les pages d’entités contiennent des métadonnées de routage génériques utilisables pour les personnes, les équipes,
les systèmes, les projets ou tout autre type d’entité :

- `entityType` : par exemple `person`, `team`, `system`, `project`
- `canonicalId` : clé d’identité stable entre les alias et les importations
- `aliases` : noms, identifiants ou libellés qui renvoient vers la même page
- `privacyTier` : chaîne libre ; `public` est traité comme ne nécessitant aucune vérification, toute autre valeur (par exemple `local-private`, `sensitive`, `confirm-before-use`) est signalée dans `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor` : indications de routage compactes
- `lastRefreshedAt` : horodatage de l’actualisation des sources, distinct de la date de modification de la page
- `personCard` : fiche de routage facultative propre à une personne (identifiants, réseaux sociaux, adresses e-mail, fuseau horaire, domaine, sujets à demander, sujets à éviter, niveau de confiance, niveau de confidentialité)
- `relationships` : liens typés vers des pages associées (cible, type, poids, niveau de confiance, type de preuve, niveau de confidentialité, note)

Pour un wiki de personnes, commencez par `reports/person-agent-directory.md`, puis ouvrez
la page de la personne avec `wiki_get` avant d’utiliser ses coordonnées ou des
faits déduits.

<Accordion title="Entity page example">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline de compilation

La compilation lit les pages wiki, normalise les résumés et produit des artefacts stables
destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Les agents et le code de l’environnement d’exécution lisent ces condensés au lieu d’analyser le Markdown.
La sortie compilée alimente également l’indexation wiki de première passe pour la recherche et la lecture, la
résolution des identifiants d’affirmations vers leurs pages propriétaires, les compléments compacts aux invites et la génération
de rapports.

## Tableaux de bord et rapports d’état

Lorsque `render.createDashboards` est activé, la compilation maintient les tableaux de bord sous
`reports/` :

| Rapport                             | Éléments suivis                                                     |
| ----------------------------------- | ------------------------------------------------------------------- |
| `reports/open-questions.md`         | pages comportant des questions non résolues                         |
| `reports/contradictions.md`         | groupes de notes contradictoires                                    |
| `reports/low-confidence.md`         | pages et affirmations à faible niveau de confiance                   |
| `reports/claim-health.md`           | affirmations dépourvues de preuves structurées                       |
| `reports/stale-pages.md`            | fraîcheur obsolète ou inconnue                                      |
| `reports/person-agent-directory.md` | fiches de routage des personnes et entités                           |
| `reports/relationship-graph.md`     | liens de relations structurés                                       |
| `reports/provenance-coverage.md`    | couverture des catégories de preuves                                |
| `reports/privacy-review.md`         | niveaux de confidentialité non publics nécessitant une vérification avant utilisation |

## Recherche et récupération

Deux backends de recherche :

- `shared` : utilise le flux partagé de recherche en mémoire lorsqu’il est disponible
- `local` : recherche localement dans le wiki

Trois corpus : `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` utilisent si possible les condensés compilés lors d’une première passe
- les identifiants d’affirmations renvoient vers leur page propriétaire
- les affirmations contestées, obsolètes ou récentes influencent le classement
- les libellés de provenance sont conservés dans les résultats

Modes de recherche (paramètre `--mode` / paramètre d’outil `mode`) :

| Mode              | Éléments favorisés                                                                 |
| ----------------- | ---------------------------------------------------------------------------------- |
| `auto`            | valeur par défaut équilibrée                                                       |
| `find-person`     | entités de type personne, alias, identifiants, réseaux sociaux, identifiants canoniques |
| `route-question`  | fiches d’agents, indications sur les sujets à demander et les usages recommandés, contexte relationnel |
| `source-evidence` | pages sources et métadonnées de preuves structurées                                |
| `raw-claim`       | affirmations structurées correspondantes ; renvoie les métadonnées des affirmations et des preuves |

Lorsqu’un résultat correspond à une affirmation structurée, `wiki_search` renvoie
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` et `evidenceSourceIds` dans sa charge utile détaillée. La sortie textuelle
inclut des lignes compactes `Claim:` et `Evidence:` lorsqu’elles sont disponibles.

## Outils pour agents

| Outil         | Objectif                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | mode et portée actuels du coffre, agent résolu, état de santé, disponibilité de la CLI Obsidian                                                                                                                   |
| `wiki_search` | recherche dans les pages du wiki et, lorsque configuré, dans le corpus de mémoire partagé ; accepte `mode` pour rechercher une personne, acheminer une question, obtenir des preuves de source ou examiner une assertion brute en détail |
| `wiki_get`    | lit une page du wiki par identifiant/chemin, avec repli sur le corpus de mémoire partagé lorsque la recherche partagée est activée et que la recherche ne renvoie aucun résultat                                  |
| `wiki_apply`  | modifications ciblées de synthèse ou de métadonnées, sans remaniement libre des pages                                                                                                                             |
| `wiki_lint`   | vérifications structurelles, lacunes de provenance, contradictions, questions ouvertes                                                                                                                           |

Le plugin enregistre également un complément non exclusif au corpus de mémoire, afin que les commandes partagées
`memory_search` et `memory_get` puissent accéder au wiki lorsque le plugin de mémoire active
prend en charge la sélection du corpus.

## Comportement des invites et du contexte

Lorsque `context.includeCompiledDigestPrompt` est activé, les sections de mémoire de l’invite
ajoutent un instantané compilé compact provenant de `agent-digest.json` : uniquement les pages
principales, uniquement les assertions principales, le nombre de contradictions, le nombre de questions,
ainsi que les qualificatifs de confiance et de fraîcheur. Cette option est désactivée par défaut, car elle
modifie la structure de l’invite ; elle concerne principalement les moteurs de contexte ou l’assemblage
d’invites qui consomment explicitement les compléments de mémoire.

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

Options principales :

| Clé                                        | Valeurs / valeur par défaut                    | Remarques                                                                                                  |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (par défaut), `bridge`, `unsafe-local` | choisit le comportement des entrées et de l’intégration                                                     |
| `vault.scope`                              | `global` (par défaut), `agent`                 | un coffre partagé ou un coffre enfant par agent                                                            |
| `vault.path`                               | valeur globale par défaut `~/.openclaw/wiki/main` | coffre global exact ; le répertoire parent de la portée par agent est par défaut `~/.openclaw/wiki`        |
| `vault.renderMode`                         | `native` (par défaut), `obsidian`              |                                                                                                            |
| `bridge.readMemoryArtifacts`               | `true` par défaut                              | importe les artefacts publics du plugin de mémoire active                                                  |
| `bridge.followMemoryEvents`                | `true` par défaut                              | inclut les journaux d’événements en mode pont                                                              |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | `false` par défaut                             | requis pour exécuter les importations `unsafe-local`                                                       |
| `unsafeLocal.paths`                        | `[]` par défaut                                | chemins locaux explicites à importer en mode `unsafe-local`                                                |
| `search.backend`                           | `shared` (par défaut), `local`                 |                                                                                                            |
| `search.corpus`                            | `wiki` (par défaut), `memory`, `all`           |                                                                                                            |
| `context.includeCompiledDigestPrompt`      | `false` par défaut                             | ajoute l’instantané compact du résumé de l’agent sélectionné aux sections de mémoire de l’invite           |
| `render.createBacklinks`                   | `true` par défaut                              | génère des blocs associés déterministes                                                                    |
| `render.createDashboards`                  | `true` par défaut                              | génère des pages de tableau de bord                                                                         |

### Coffres par agent

Définissez `vault.scope` sur `agent` afin d’attribuer un wiki distinct à chaque agent configuré.
Dans cette portée, `vault.path` est un répertoire parent auquel OpenClaw ajoute
l’identifiant normalisé de l’agent :

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Cela produit `~/.openclaw/wiki/support` et
`~/.openclaw/wiki/marketing`. Si `vault.path` est omis dans la portée par agent, le
répertoire parent est par défaut `~/.openclaw/wiki`. L’agent `main` par défaut conserve donc
le chemin existant `~/.openclaw/wiki/main`.

Les outils d’agent, les résumés compilés des invites et le complément du wiki exposé via
`memory_search` / `memory_get` déterminent le coffre à partir du contexte de l’agent actif.
Pour les appels de la CLI et du Gateway dans une configuration comprenant plusieurs agents,
indiquez explicitement l’agent avec `openclaw wiki --agent <agentId> ...` ou avec
`agentId` dans la requête du Gateway. Lorsqu’un seul agent est configuré, il reste sélectionné
par défaut si aucun identifiant n’est fourni.

En mode pont, les importations propres à un agent n’acceptent un artefact public de mémoire que si
son champ `agentIds` inclut l’agent sélectionné. Les artefacts appartenant à un autre agent,
dépourvus de métadonnées de propriété ou dont le propriétaire est inconnu sont ignorés. La portée
globale conserve le comportement existant pour les artefacts partagés.

<Warning>
La modification de `vault.scope` ne copie ni ne divise un coffre existant. Dans la portée par agent,
un `vault.path` explicitement configuré devient un répertoire parent ; déplacez ou
importez donc volontairement les pages existantes avant de faire basculer les agents de production. Sauvegardez
d’abord le coffre.

Les coffres par agent constituent une frontière de connaissances au sein d’un même processus, et non une frontière de
sécurité du système d’exploitation. Les plugins et les outils non isolés ayant accès au système de fichiers
de l’hôte peuvent toujours lire le répertoire d’un autre agent. Utilisez l’[isolation](/fr/gateway/sandboxing) ou
des [profils Gateway distincts](/fr/gateway/multiple-gateways) lorsque les agents ne se font pas confiance.
</Warning>

### Exemple : QMD + mode pont

Utilisez cette configuration lorsque vous souhaitez employer QMD pour le rappel et `memory-wiki` comme couche de
connaissances maintenue. Chaque couche reste spécialisée : QMD permet de rechercher dans les notes brutes, les
exportations de sessions et les collections supplémentaires, tandis que `memory-wiki` compile
des entités stables, des assertions, des tableaux de bord et des pages de sources.

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

Cette configuration laisse QMD gérer le rappel de la mémoire active, maintient `memory-wiki` centré sur
les pages compilées et les tableaux de bord, et conserve la structure de l’invite inchangée jusqu’à ce que vous
activiez volontairement les invites contenant les résumés compilés.

## CLI

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

Consultez [CLI : wiki](/fr/cli/wiki) pour la référence complète des commandes, notamment
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback`, ainsi que l’ensemble complet des sous-commandes
`wiki obsidian`.

## Prise en charge d’Obsidian

Lorsque `vault.renderMode` vaut `obsidian`, le plugin écrit du Markdown
compatible avec Obsidian et peut, facultativement, utiliser la CLI officielle `obsidian` pour vérifier
l’état, rechercher dans le coffre, ouvrir une page, invoquer une commande et accéder directement à la
note quotidienne. Cette fonctionnalité est facultative ; le wiki fonctionne toujours en mode natif sans
Obsidian.

Les coffres propres aux agents peuvent également utiliser du Markdown compatible avec Obsidian, mais la validation
de la configuration rejette `obsidian.useOfficialCli: true` avec `vault.scope: "agent"`.
Le paramètre actuel `obsidian.vaultName` est global et ne permet pas de sélectionner un coffre
Obsidian distinct pour chaque agent. Utilisez plutôt les outils du wiki et les opérations de la CLI,
ou conservez un wiki exploité par Obsidian dans la portée globale.

## Flux de travail recommandé

<Steps>
<Step title="Conserver le plugin de mémoire active pour le rappel">
Le rappel, la promotion et le processus de rêve restent sous la responsabilité du moteur de mémoire configuré.
</Step>
<Step title="Activer memory-wiki">
Commencez par le mode `isolated`, sauf si vous souhaitez explicitement utiliser le mode pont.
</Step>
<Step title="Utiliser wiki_search / wiki_get lorsque la provenance est importante">
Préférez-les à `memory_search` lorsque vous souhaitez un classement propre au wiki ou une structure de croyances au niveau des pages.
</Step>
<Step title="Utiliser wiki_apply pour des synthèses ciblées ou des mises à jour de métadonnées">
Évitez de modifier manuellement les blocs générés et gérés.
</Step>
<Step title="Exécuter wiki_lint après des modifications significatives">
Détecte les contradictions, les questions ouvertes et les lacunes de provenance.
</Step>
<Step title="Activer les tableaux de bord pour visualiser les informations obsolètes et les contradictions">
Définissez `render.createDashboards: true` (valeur par défaut).
</Step>
</Steps>

## Documentation associée

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : mémoire](/fr/cli/memory)
- [CLI : wiki](/fr/cli/wiki)
- [Vue d’ensemble du SDK des plugins](/fr/plugins/sdk-overview)
