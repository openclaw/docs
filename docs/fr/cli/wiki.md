---
read_when:
    - Vous voulez utiliser la CLI memory-wiki
    - Vous documentez ou modifiez `openclaw wiki`
summary: Référence CLI pour `openclaw wiki` (état du coffre memory-wiki, recherche, compilation, lint, application, pont et assistants Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T07:02:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspectez et maintenez le coffre `memory-wiki`.

Fourni par le plugin intégré `memory-wiki`.

Liens associés :

- [Plugin Memory Wiki](/fr/plugins/memory-wiki)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)

## À quoi cela sert

Utilisez `openclaw wiki` lorsque vous voulez un coffre de connaissances compilé avec :

- recherche native au wiki et lecture de pages
- synthèses riches en provenance
- rapports de contradictions et de fraîcheur
- imports de pont depuis le plugin de mémoire actif
- assistants CLI Obsidian facultatifs

## Commandes courantes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

Inspectez le mode actuel du coffre, son état de santé et la disponibilité de la CLI Obsidian.

Utilisez cette commande en premier lorsque vous n’êtes pas sûr que le coffre soit initialisé, que le mode pont
soit sain ou que l’intégration Obsidian soit disponible.

### `wiki doctor`

Exécutez des vérifications de santé du wiki et faites remonter les problèmes de configuration ou du coffre.

Les problèmes typiques incluent :

- mode pont activé sans artefacts de mémoire publics
- disposition du coffre invalide ou manquante
- CLI Obsidian externe manquante lorsque le mode Obsidian est attendu

### `wiki init`

Créez la structure du coffre wiki et les pages de départ.

Cela initialise la structure racine, y compris les index de premier niveau et les répertoires
de cache.

### `wiki ingest <path-or-url>`

Importez du contenu dans la couche source du wiki.

Remarques :

- l’import d’URL est contrôlé par `ingest.allowUrlIngest`
- les pages source importées conservent la provenance dans le frontmatter
- la compilation automatique peut s’exécuter après l’import lorsqu’elle est activée

### `wiki compile`

Reconstruisez les index, blocs liés, tableaux de bord et condensés compilés.

Cela écrit des artefacts stables destinés aux machines sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` est activé, la compilation rafraîchit aussi les pages de rapport.

### `wiki lint`

Analysez le coffre et signalez :

- problèmes structurels
- lacunes de provenance
- contradictions
- questions ouvertes
- pages/affirmations à faible confiance
- pages/affirmations obsolètes

Exécutez cette commande après des mises à jour significatives du wiki.

### `wiki search <query>`

Recherchez du contenu dans le wiki.

Le comportement dépend de la configuration :

- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`

Utilisez `wiki search` lorsque vous voulez un classement spécifique au wiki ou des détails de provenance.
Pour un large passage unique de rappel partagé, préférez `openclaw memory search` lorsque le
plugin de mémoire actif expose une recherche partagée.

### `wiki get <lookup>`

Lisez une page wiki par identifiant ou chemin relatif.

Exemples :

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Appliquez des mutations ciblées sans chirurgie libre sur les pages.

Les flux pris en charge incluent :

- création/mise à jour d’une page de synthèse
- mise à jour des métadonnées de page
- attachement d’identifiants de source
- ajout de questions
- ajout de contradictions
- mise à jour de la confiance/du statut
- écriture d’affirmations structurées

Cette commande existe pour que le wiki puisse évoluer en toute sécurité sans modifier manuellement
les blocs gérés.

### `wiki bridge import`

Importez dans des pages source adossées au pont les artefacts de mémoire publics provenant du plugin de mémoire actif.

Utilisez cette commande en mode `bridge` lorsque vous voulez que les derniers artefacts de mémoire exportés
soient importés dans le coffre wiki.

### `wiki unsafe-local import`

Importez depuis des chemins locaux explicitement configurés en mode `unsafe-local`.

Ceci est intentionnellement expérimental et limité à la même machine.

### `wiki obsidian ...`

Commandes d’assistance Obsidian pour les coffres exécutés en mode compatible Obsidian.

Sous-commandes :

- `status`
- `search`
- `open`
- `command`
- `daily`

Elles exigent la CLI officielle `obsidian` dans le `PATH` lorsque
`obsidian.useOfficialCli` est activé.

## Conseils pratiques d’utilisation

- Utilisez `wiki search` + `wiki get` lorsque la provenance et l’identité des pages comptent.
- Utilisez `wiki apply` au lieu de modifier manuellement des sections générées et gérées.
- Utilisez `wiki lint` avant de faire confiance à un contenu contradictoire ou à faible confiance.
- Utilisez `wiki compile` après des imports en masse ou des modifications de sources lorsque vous voulez
  immédiatement des tableaux de bord et des condensés compilés à jour.
- Utilisez `wiki bridge import` lorsque le mode pont dépend d’artefacts de mémoire
  nouvellement exportés.

## Liens avec la configuration

Le comportement de `openclaw wiki` est façonné par :

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Voir [Plugin Memory Wiki](/fr/plugins/memory-wiki) pour le modèle de configuration complet.
