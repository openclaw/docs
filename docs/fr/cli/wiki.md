---
read_when:
    - Vous souhaitez utiliser la CLI memory-wiki
    - Vous documentez ou modifiez `openclaw wiki`
summary: Référence CLI pour `openclaw wiki` (état du coffre memory-wiki, recherche, compilation, lint, application, bridge et assistants Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecter et maintenir le coffre `memory-wiki`.

Fourni par le Plugin `memory-wiki` intégré.

Liés :

- [Plugin Memory Wiki](/fr/plugins/memory-wiki)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)

## À quoi cela sert

Utilisez `openclaw wiki` lorsque vous voulez un coffre de connaissances compilé avec :

- recherche native de wiki et lecture de pages
- synthèses riches en provenance
- rapports de contradiction et de fraîcheur
- imports de pont depuis le Plugin de mémoire active
- assistants CLI Obsidian facultatifs

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Commandes

### `wiki status`

Inspecter le mode actuel du coffre, son état de santé et la disponibilité de la CLI Obsidian.

Utilisez cette commande en premier lorsque vous ne savez pas si le coffre est initialisé, si le mode pont
est sain ou si l’intégration Obsidian est disponible.

Lorsque le mode pont est actif et configuré pour lire les artefacts de mémoire, cette commande
interroge le Gateway en cours d’exécution afin de voir le même contexte du Plugin de mémoire active que
la mémoire agent/runtime.

### `wiki doctor`

Exécuter les vérifications de santé du wiki et faire apparaître les problèmes de configuration ou de coffre.

Lorsque le mode pont est actif et configuré pour lire les artefacts de mémoire, cette commande
interroge le Gateway en cours d’exécution avant de construire le rapport. Les imports de pont désactivés
et les configurations de pont qui ne lisent pas les artefacts de mémoire restent locaux/hors ligne.

Les problèmes typiques incluent :

- mode pont activé sans artefacts de mémoire publics
- disposition du coffre invalide ou manquante
- CLI Obsidian externe manquante lorsque le mode Obsidian est attendu

### `wiki init`

Créer la disposition du coffre wiki et les pages de démarrage.

Cela initialise la structure racine, y compris les index de premier niveau et les répertoires
de cache.

### `wiki ingest <path-or-url>`

Importer du contenu dans la couche source du wiki.

Notes :

- l’ingestion d’URL est contrôlée par `ingest.allowUrlIngest`
- les pages source importées conservent la provenance dans le frontmatter
- l’auto-compilation peut s’exécuter après l’ingestion lorsqu’elle est activée

### `wiki okf import <path>`

Importer un bundle Open Knowledge Format décompressé dans les pages de concepts du wiki.

L’importateur lit chaque document de concept `.md` non réservé dans l’arborescence
OKF, exige un champ `type` non vide et traite les valeurs OKF `type` inconnues
comme des concepts génériques. Les fichiers OKF réservés `index.md` et `log.md`
ne sont pas importés comme concepts.

Les pages importées sont aplaties sous `concepts/` afin que les flux existants de compilation,
recherche, lecture, résumé et tableau de bord du wiki les voient immédiatement. L’ID de concept OKF
d’origine, `type`, `resource`, `tags`, l’horodatage, le chemin source et le frontmatter
complet sont conservés dans le frontmatter de la page. Les liens Markdown OKF internes
sont réécrits vers les pages wiki générées ; les liens cassés ou externes restent
inchangés.

Exemples :

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Reconstruire les index, les blocs associés, les tableaux de bord et les résumés compilés.

Cela écrit des artefacts stables destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` est activé, la compilation actualise également les pages de rapport.

### `wiki lint`

Vérifier le coffre et signaler :

- problèmes structurels
- lacunes de provenance
- contradictions
- questions ouvertes
- pages/revendications à faible confiance
- pages/revendications obsolètes

Exécutez cette commande après des mises à jour significatives du wiki.

### `wiki search <query>`

Rechercher dans le contenu du wiki.

Le comportement dépend de la configuration :

- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `--mode` : `auto`, `find-person`, `route-question`, `source-evidence` ou
  `raw-claim`

Utilisez `wiki search` lorsque vous voulez un classement propre au wiki ou des détails de provenance.
Pour une seule passe large de rappel partagé, préférez `openclaw memory search` lorsque le
Plugin de mémoire active expose la recherche partagée.

Les modes de recherche aident l’agent à choisir la bonne surface :

- `find-person` : alias, handles, réseaux sociaux, ID canoniques et pages de personnes
- `route-question` : indices ask-for/best-used-for et contexte relationnel
- `source-evidence` : pages source et champs de preuves structurées
- `raw-claim` : texte de revendication structuré avec métadonnées de revendication/preuve

Exemples :

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

La sortie texte inclut les lignes `Claim:` et `Evidence:` lorsqu’un résultat correspond à une
revendication structurée. La sortie JSON expose en plus `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` et
`evidenceSourceIds` pour l’exploration côté agent.

### `wiki get <lookup>`

Lire une page wiki par ID ou chemin relatif.

Exemples :

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Appliquer des mutations ciblées sans chirurgie de page libre.

Les flux pris en charge incluent :

- créer/mettre à jour une page de synthèse
- mettre à jour les métadonnées de page
- attacher des ID de source
- ajouter des questions
- ajouter des contradictions
- mettre à jour la confiance/le statut
- écrire des revendications structurées

Cette commande existe pour que le wiki puisse évoluer en toute sécurité sans modifier manuellement
les blocs gérés.

### `wiki bridge import`

Importer des artefacts de mémoire publics depuis le Plugin de mémoire active vers des
pages source adossées au pont.

Utilisez cette commande en mode `bridge` lorsque vous voulez que les derniers artefacts de mémoire exportés
soient importés dans le coffre wiki.

Pour les lectures actives d’artefacts de pont, la CLI achemine l’import via Gateway RPC
afin que l’import utilise le contexte runtime du Plugin de mémoire. Si les imports de pont sont
désactivés ou si les lectures d’artefacts sont désactivées, la commande conserve le comportement local/hors ligne
à zéro import.

### `wiki unsafe-local import`

Importer depuis des chemins locaux explicitement configurés en mode `unsafe-local`.

Ceci est intentionnellement expérimental et limité à la même machine.

### `wiki obsidian ...`

Commandes d’assistance Obsidian pour les coffres exécutés en mode compatible avec Obsidian.

Sous-commandes :

- `status`
- `search`
- `open`
- `command`
- `daily`

Elles nécessitent la CLI officielle `obsidian` sur `PATH` lorsque
`obsidian.useOfficialCli` est activé.

## Conseils d’utilisation pratique

- Utilisez `wiki search` + `wiki get` lorsque la provenance et l’identité des pages comptent.
- Utilisez `wiki apply` au lieu de modifier manuellement les sections générées gérées.
- Utilisez `wiki lint` avant de faire confiance à du contenu contradictoire ou à faible confiance.
- Utilisez `wiki compile` après des imports en masse ou des changements de source lorsque vous voulez immédiatement des
  tableaux de bord et des résumés compilés à jour.
- Utilisez `wiki okf import` lorsqu’un catalogue de données, un export de documentation ou un pipeline
  d’enrichissement d’agent émet déjà des bundles Markdown OKF.
- Utilisez `wiki bridge import` lorsque le mode pont dépend d’artefacts de mémoire
  nouvellement exportés.

## Liens de configuration

Le comportement de `openclaw wiki` est façonné par :

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consultez [Plugin Memory Wiki](/fr/plugins/memory-wiki) pour le modèle de configuration complet.

## Liés

- [Référence CLI](/fr/cli)
- [Wiki de mémoire](/fr/plugins/memory-wiki)
