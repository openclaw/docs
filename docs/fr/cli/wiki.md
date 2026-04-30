---
read_when:
    - Vous souhaitez utiliser la CLI memory-wiki
    - Vous documentez ou modifiez `openclaw wiki`
summary: Référence CLI pour `openclaw wiki` (état, recherche, compilation, lint, application, bridge et assistants Obsidian du coffre memory-wiki)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T07:20:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecter et maintenir le coffre `memory-wiki`.

Fourni par le Plugin `memory-wiki` intégré.

Liés :

- [Plugin Memory Wiki](/fr/plugins/memory-wiki)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : mémoire](/fr/cli/memory)

## À quoi cela sert

Utilisez `openclaw wiki` lorsque vous voulez un coffre de connaissances compilé avec :

- une recherche native wiki et la lecture de pages
- des synthèses riches en provenance
- des rapports de contradictions et de fraîcheur
- des importations de pont depuis le Plugin de mémoire active
- des assistants CLI Obsidian facultatifs

## Commandes courantes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Inspecter le mode actuel du coffre, son état et la disponibilité de la CLI Obsidian.

Utilisez d’abord cette commande lorsque vous ne savez pas si le coffre est initialisé, si le mode pont
est sain ou si l’intégration Obsidian est disponible.

Lorsque le mode pont est actif et configuré pour lire les artefacts de mémoire, cette commande
interroge le Gateway en cours d’exécution afin de voir le même contexte de Plugin de mémoire active que
la mémoire agent/runtime.

### `wiki doctor`

Exécuter les contrôles d’état du wiki et signaler les problèmes de configuration ou de coffre.

Lorsque le mode pont est actif et configuré pour lire les artefacts de mémoire, cette commande
interroge le Gateway en cours d’exécution avant de créer le rapport. Les importations de pont désactivées
et les configurations de pont qui ne lisent pas les artefacts de mémoire restent locales/hors ligne.

Les problèmes typiques incluent :

- mode pont activé sans artefacts de mémoire publics
- disposition de coffre invalide ou manquante
- CLI Obsidian externe manquante lorsque le mode Obsidian est attendu

### `wiki init`

Créer la disposition du coffre wiki et les pages de démarrage.

Cela initialise la structure racine, y compris les index de premier niveau et les répertoires
de cache.

### `wiki ingest <path-or-url>`

Importer du contenu dans la couche source du wiki.

Notes :

- l’ingestion d’URL est contrôlée par `ingest.allowUrlIngest`
- les pages sources importées conservent leur provenance dans le frontmatter
- la compilation automatique peut s’exécuter après l’ingestion lorsqu’elle est activée

### `wiki compile`

Reconstruire les index, les blocs liés, les tableaux de bord et les condensés compilés.

Cela écrit des artefacts stables destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` est activé, la compilation actualise aussi les pages de rapport.

### `wiki lint`

Analyser le coffre et signaler :

- les problèmes structurels
- les lacunes de provenance
- les contradictions
- les questions ouvertes
- les pages/revendications à faible confiance
- les pages/revendications obsolètes

Exécutez cette commande après des mises à jour significatives du wiki.

### `wiki search <query>`

Rechercher dans le contenu du wiki.

Le comportement dépend de la configuration :

- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `--mode` : `auto`, `find-person`, `route-question`, `source-evidence` ou
  `raw-claim`

Utilisez `wiki search` lorsque vous voulez un classement propre au wiki ou des détails de provenance.
Pour un rappel partagé large en une seule passe, préférez `openclaw memory search` lorsque le
Plugin de mémoire active expose la recherche partagée.

Les modes de recherche aident l’agent à choisir la bonne surface :

- `find-person` : alias, identifiants, réseaux sociaux, ID canoniques et pages de personnes
- `route-question` : indications ask-for/best-used-for et contexte relationnel
- `source-evidence` : pages sources et champs de preuve structurés
- `raw-claim` : texte de revendication structuré avec métadonnées de revendication/preuve

Exemples :

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

La sortie texte inclut des lignes `Claim:` et `Evidence:` lorsqu’un résultat correspond à une
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

Appliquer des mutations ciblées sans chirurgie libre de page.

Les flux pris en charge incluent :

- créer/mettre à jour une page de synthèse
- mettre à jour les métadonnées de page
- attacher des ID sources
- ajouter des questions
- ajouter des contradictions
- mettre à jour la confiance/le statut
- écrire des revendications structurées

Cette commande existe pour que le wiki puisse évoluer en toute sécurité sans modifier manuellement
les blocs gérés.

### `wiki bridge import`

Importer les artefacts de mémoire publics du Plugin de mémoire active dans des pages sources
adossées au pont.

Utilisez cette commande en mode `bridge` lorsque vous voulez importer dans le coffre wiki les derniers artefacts
de mémoire exportés.

Pour les lectures actives d’artefacts de pont, la CLI achemine l’importation via le RPC du Gateway
afin que l’importation utilise le contexte runtime du Plugin de mémoire. Si les importations de pont sont
désactivées ou si les lectures d’artefacts sont coupées, la commande conserve le comportement local/hors ligne
sans importation.

### `wiki unsafe-local import`

Importer depuis des chemins locaux explicitement configurés en mode `unsafe-local`.

C’est volontairement expérimental et limité à la même machine.

### `wiki obsidian ...`

Commandes d’assistance Obsidian pour les coffres exécutés en mode compatible avec Obsidian.

Sous-commandes :

- `status`
- `search`
- `open`
- `command`
- `daily`

Elles nécessitent la CLI officielle `obsidian` sur le `PATH` lorsque
`obsidian.useOfficialCli` est activé.

## Conseils d’utilisation pratiques

- Utilisez `wiki search` + `wiki get` lorsque la provenance et l’identité des pages sont importantes.
- Utilisez `wiki apply` plutôt que de modifier à la main les sections générées gérées.
- Utilisez `wiki lint` avant de faire confiance à du contenu contradictoire ou à faible confiance.
- Utilisez `wiki compile` après des importations en bloc ou des changements de sources lorsque vous voulez immédiatement
  des tableaux de bord et des condensés compilés à jour.
- Utilisez `wiki bridge import` lorsque le mode pont dépend d’artefacts de mémoire nouvellement exportés.

## Liens avec la configuration

Le comportement de `openclaw wiki` est façonné par :

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consultez [Plugin Memory Wiki](/fr/plugins/memory-wiki) pour le modèle de configuration complet.

## Lié

- [Référence CLI](/fr/cli)
- [Wiki mémoire](/fr/plugins/memory-wiki)
