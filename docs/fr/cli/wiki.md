---
read_when:
    - Vous souhaitez utiliser la CLI memory-wiki
    - Vous documentez ou modifiez `openclaw wiki`
summary: Référence de la CLI pour `openclaw wiki` (état du coffre memory-wiki, recherche, compilation, analyse, application, passerelle, importation depuis ChatGPT et utilitaires Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T02:45:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspectez et gérez le coffre `memory-wiki`. Fourni par le plugin `memory-wiki` intégré.

Voir aussi : [Plugin Memory Wiki](/fr/plugins/memory-wiki), [Vue d’ensemble de la mémoire](/fr/concepts/memory), [CLI : mémoire](/fr/cli/memory)

## Commandes courantes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Sélection de l’agent

Lorsque `plugins.entries.memory-wiki.config.vault.scope` vaut `agent`, sélectionnez le
coffre avec l’option de premier niveau `--agent <id>` :

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Dans une configuration comportant plusieurs agents configurés, `--agent` est requis pour les
opérations de la CLI afin qu’une commande ne puisse pas lire ou écrire dans un coffre par défaut arbitraire. Si
un seul agent est configuré, cet agent reste celui par défaut. Les identifiants d’agent inconnus
provoquent un échec avant le début de l’opération sur le coffre. L’option ne modifie pas le chemin sélectionné
lorsque `vault.scope` vaut `global`.

Les clients du Gateway suivent la même règle : transmettez `agentId` dans les requêtes `wiki.*`
adossées à un coffre dans une configuration multi-agent à portée d’agent. Un identifiant manquant ou inconnu constitue une
erreur. Les tours d’agent, les outils wiki, les compléments au corpus mémoire et les condensés d’invite
compilés transportent déjà le contexte actif de l’agent d’exécution.

## Commandes

### `wiki status`

Affichez le mode et la portée du coffre, l’agent résolu, son état et la disponibilité de la CLI Obsidian. Utilisez d’abord cette commande pour vérifier si le coffre prévu est initialisé, si le mode pont est opérationnel ou si l’intégration Obsidian est disponible.

Lorsque le mode pont est actif et configuré pour lire les artefacts mémoire, cette commande interroge le Gateway en cours d’exécution afin d’utiliser le même contexte de plugin mémoire actif que la mémoire de l’agent ou de l’environnement d’exécution.

### `wiki doctor`

Exécutez les vérifications d’état du wiki et indiquez des correctifs applicables. Se termine avec un code différent de zéro en cas de problème.

Lorsque le mode pont est actif et configuré pour lire les artefacts mémoire, cette commande interroge le Gateway en cours d’exécution avant de générer le rapport. Les importations par pont désactivées et les configurations de pont qui ne lisent pas les artefacts mémoire restent locales et hors ligne.

Problèmes courants :

- mode pont activé sans artefacts mémoire publics
- structure du coffre absente ou non valide
- CLI Obsidian externe absente alors que le mode Obsidian est attendu

### `wiki init`

Créez la structure du coffre wiki et les pages initiales, notamment les index de premier niveau et les répertoires de cache.

### `wiki ingest <path>`

Importez un fichier Markdown ou texte local dans le dossier `sources/` du wiki sous forme de page source. `<path>` doit être un chemin de fichier local ; l’importation depuis une URL n’est actuellement pas prise en charge. Les fichiers binaires sont refusés.

Les pages sources importées comportent des métadonnées d’origine dans le frontmatter (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Après chaque importation, le coffre est toujours recompilé.

Option : `--title <title>` remplace le titre de la source (par défaut, il est dérivé du nom du fichier).

### `wiki okf import <path>`

Importez un paquet Open Knowledge Format décompressé dans les pages de concepts du wiki.

L’importateur lit chaque document de concept `.md` non réservé dans l’arborescence du répertoire OKF, exige un champ `type` non vide et traite les valeurs `type` OKF inconnues comme des concepts génériques. Les fichiers OKF réservés `index.md` et `log.md` ne sont pas importés comme concepts.

Les pages importées sont regroupées directement sous `concepts/` afin que les processus existants de compilation, recherche, lecture, génération de condensés et tableaux de bord du wiki les prennent immédiatement en compte. L’identifiant de concept OKF d’origine, le `type`, la `resource`, les `tags`, l’horodatage, le chemin source et l’intégralité du frontmatter sont conservés dans le frontmatter de la page. Les liens Markdown OKF internes sont réécrits pour pointer vers les pages wiki générées ; les liens rompus ou externes restent inchangés. Après chaque importation, le coffre est toujours recompilé.

Exemples :

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruisez les index, les blocs associés, les tableaux de bord et les condensés compilés. Écrit des artefacts stables destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` est activé, la compilation actualise également les pages de rapport.

### `wiki lint`

Analysez le coffre et produisez un rapport couvrant :

- les problèmes structurels (liens rompus, identifiants absents ou dupliqués, type ou titre de page manquant, frontmatter non valide)
- les lacunes de traçabilité (identifiants de source manquants, provenance d’importation manquante)
- les contradictions (contradictions signalées, affirmations contradictoires)
- les questions ouvertes
- les pages et affirmations à faible niveau de confiance
- les pages et affirmations obsolètes

Exécutez cette commande après des mises à jour importantes du wiki.

### `wiki search <query>`

Recherchez dans le contenu du wiki. Le comportement dépend de la configuration :

- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `--mode` : `auto`, `find-person`, `route-question`, `source-evidence` ou `raw-claim`

Utilisez `wiki search` pour bénéficier du classement et de la traçabilité propres au wiki. Pour une recherche large et partagée en une seule passe, privilégiez `openclaw memory search` lorsque le plugin mémoire actif expose une recherche partagée.

Modes de recherche :

- `find-person` : alias, pseudonymes, profils sociaux, identifiants canoniques et pages de personnes
- `route-question` : indications permettant de savoir à qui demander ou dans quel cas utiliser une personne, ainsi que le contexte relationnel
- `source-evidence` : pages sources et champs de preuves structurés
- `raw-claim` : texte d’affirmation structuré accompagné de métadonnées sur l’affirmation et les preuves

Exemples :

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

La sortie textuelle inclut des lignes `Claim:` et `Evidence:` lorsqu’un résultat correspond à une affirmation structurée. La sortie JSON expose également `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` et `evidenceSourceIds` pour permettre une analyse approfondie par l’agent.

### `wiki get <lookup>`

Lisez une page wiki à partir de son identifiant ou de son chemin relatif.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Appliquez des modifications ciblées sans intervenir librement dans le contenu des pages :

- `apply synthesis <title>` : crée ou actualise une page de synthèse avec un corps de résumé géré
- `apply metadata <lookup>` : met à jour les métadonnées d’une page existante

Les deux acceptent `--source-id`, `--contradiction`, `--question` (chacune pouvant être répétée), `--confidence <n>` (0-1) et `--status <status>`. `apply metadata` accepte également `--clear-confidence` pour supprimer une valeur de confiance enregistrée. Il s’agit de la méthode prise en charge pour faire évoluer les pages wiki tout en préservant les blocs générés et gérés.

### `wiki bridge import`

Importez les artefacts mémoire publics du plugin mémoire actif dans des pages sources adossées au pont. Utilisez cette commande en mode `bridge` pour intégrer au coffre wiki les derniers artefacts mémoire exportés.

Pour les lectures actives d’artefacts par pont, la CLI achemine l’importation via le RPC du Gateway afin d’utiliser le contexte du plugin mémoire de l’environnement d’exécution. Si les importations par pont sont désactivées ou si la lecture des artefacts est inactive, la commande conserve le comportement local et hors ligne avec zéro importation. L’actualisation de l’index après l’importation est contrôlée par `ingest.autoCompile`.

### `wiki unsafe-local import`

Importez depuis des chemins locaux explicitement configurés (`unsafeLocal.paths`) en mode `unsafe-local`. Fonctionnalité volontairement expérimentale et limitée à la même machine. L’actualisation de l’index après l’importation est contrôlée par `ingest.autoCompile`.

### `wiki chatgpt import`

Importez une exportation ChatGPT dans des brouillons de pages sources du wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Option            | Valeur par défaut | Description                                                                  |
| ----------------- | ----------------- | ---------------------------------------------------------------------------- |
| `--export <path>` | (obligatoire)     | Répertoire d’exportation ChatGPT ou chemin vers `conversations.json`.        |
| `--dry-run`       | `false`           | Prévisualise le nombre d’éléments créés, mis à jour ou ignorés sans écrire de pages. |

Une importation réelle qui modifie une page enregistre un identifiant d’exécution d’importation, affiché dans le résumé et nécessaire à l’annulation.

### `wiki chatgpt rollback <run-id>`

Annulez une importation ChatGPT précédemment appliquée en supprimant les pages qu’elle a créées et en restaurant celles qu’elle a remplacées. N’effectue aucune opération (et indique `alreadyRolledBack`) si l’exécution a déjà été annulée.

### `wiki obsidian ...`

Commandes auxiliaires Obsidian pour les coffres exécutés dans un mode compatible avec Obsidian : `status`, `search`, `open`, `command`, `daily`. Elles nécessitent la CLI officielle `obsidian` dans `PATH` lorsque `obsidian.useOfficialCli` est activé.

La validation de la configuration refuse `obsidian.useOfficialCli: true` lorsque
`vault.scope` vaut `agent`, car `obsidian.vaultName` est un paramètre global unique,
et non une correspondance propre à chaque agent. Le rendu Markdown compatible avec Obsidian reste
disponible.

## Conseils pratiques d’utilisation

- Utilisez `wiki search` avec `wiki get` lorsque la traçabilité et l’identité des pages sont importantes.
- Utilisez `wiki apply` au lieu de modifier manuellement les sections générées et gérées.
- Utilisez `wiki lint` avant de vous fier à du contenu contradictoire ou à faible niveau de confiance.
- Utilisez `wiki compile` après des importations en masse ou des modifications de sources lorsque vous souhaitez actualiser immédiatement les tableaux de bord et les condensés compilés.
- Utilisez `wiki okf import` lorsqu’un catalogue de données, une exportation de documentation ou un pipeline d’enrichissement d’agent produit déjà des paquets Markdown OKF.
- Utilisez `wiki bridge import` lorsque le mode pont dépend d’artefacts mémoire récemment exportés.

## Paramètres de configuration associés

Le comportement de `openclaw wiki` est déterminé par :

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consultez [Plugin Memory Wiki](/fr/plugins/memory-wiki) pour connaître le modèle de configuration complet.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Wiki mémoire](/fr/plugins/memory-wiki)
