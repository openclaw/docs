---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter des fuites de raisonnement
    - Vous voulez exécuter la Gateway en mode watch pendant l’itération
    - Vous avez besoin d’un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode watch, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-04-23T07:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Débogage

Cette page couvre les assistants de débogage pour la sortie en streaming, en particulier lorsqu’un
fournisseur mélange le raisonnement au texte normal.

## Remplacements de débogage à l’exécution

Utilisez `/debug` dans le chat pour définir des remplacements de configuration **uniquement à l’exécution** (mémoire, pas disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des réglages obscurs sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface tous les remplacements et revient à la configuration sur disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant aux plugins dans une session
sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de plugins tels que les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie normale verbeuse de statut/outils, et continuez à utiliser
`/debug` pour les remplacements de configuration uniquement à l’exécution.

## Chronométrage CLI de débogage temporaire

OpenClaw conserve `src/cli/debug-timing.ts` comme petit assistant pour
l’investigation locale. Il n’est volontairement pas branché au démarrage de la CLI, au routage des commandes
ni à aucune commande par défaut. Utilisez-le uniquement pendant le débogage d’une commande lente, puis
supprimez l’import et les spans avant de livrer le changement de comportement.

Utilisez-le lorsqu’une commande est lente et que vous avez besoin d’un découpage rapide par phase avant de
décider d’utiliser un profileur CPU ou de corriger un sous-système spécifique.

### Ajouter des spans temporaires

Ajoutez l’assistant près du code que vous examinez. Par exemple, lors du débogage de
`openclaw models list`, un patch temporaire dans
`src/commands/models/list.list-command.ts` pourrait ressembler à ceci :

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Directives :

- Préfixez les noms de phase temporaires avec `debug:`.
- N’ajoutez que quelques spans autour des sections suspectées d’être lentes.
- Préférez des phases larges comme `registry`, `auth_store` ou `rows` plutôt que des noms
  d’assistants.
- Utilisez `time()` pour le travail synchrone et `timeAsync()` pour les promesses.
- Gardez stdout propre. L’assistant écrit vers stderr, ainsi la sortie JSON des commandes reste analysable.
- Supprimez les imports et spans temporaires avant d’ouvrir la PR de correction finale.
- Incluez la sortie de chronométrage ou un court résumé dans l’issue ou la PR qui explique
  l’optimisation.

### Exécuter avec une sortie lisible

Le mode lisible est le meilleur pour le débogage en direct :

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Exemple de sortie d’une investigation temporaire sur `models list` :

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Constats issus de cette sortie :

| Phase                                    |      Temps | Ce que cela signifie                                                                                   |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------ |
| `debug:models:list:auth_store`           |      20.3s | Le chargement du store de profils d’authentification est le coût principal et doit être investigué en priorité. |
| `debug:models:list:ensure_models_json`   |       5.0s | La synchronisation de `models.json` est suffisamment coûteuse pour examiner la mise en cache ou les conditions de saut. |
| `debug:models:list:load_model_registry`  |       5.9s | La construction du registre et le travail de disponibilité des fournisseurs représentent aussi des coûts significatifs. |
| `debug:models:list:read_registry_models` |       2.4s | Lire tous les modèles du registre n’est pas gratuit et peut compter pour `--all`.                     |
| phases d’ajout de lignes                 | 3.2s total | Construire cinq lignes affichées prend encore plusieurs secondes, donc le chemin de filtrage mérite un examen plus attentif. |
| `debug:models:list:print_model_table`    |        0ms | Le rendu n’est pas le goulot d’étranglement.                                                           |

Ces constats suffisent à guider le patch suivant sans conserver le code de chronométrage
dans les chemins de production.

### Exécuter avec une sortie JSON

Utilisez le mode JSON lorsque vous voulez enregistrer ou comparer des données de chronométrage :

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Chaque ligne stderr est un objet JSON :

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Nettoyer avant de livrer

Avant d’ouvrir la PR finale :

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

La commande ne doit renvoyer aucun site d’appel d’instrumentation temporaire à moins que la PR
n’ajoute explicitement une surface de diagnostic permanente. Pour les corrections normales de performance,
ne conservez que le changement de comportement, les tests et une courte note avec les preuves de chronométrage.

Pour des points chauds CPU plus profonds, utilisez le profilage Node (`--cpu-prof`) ou un profileur
externe au lieu d’ajouter davantage d’enveloppes de chronométrage.

## Mode watch de la Gateway

Pour une itération rapide, exécutez la Gateway sous le watcher de fichiers :

```bash
pnpm gateway:watch
```

Cela correspond à :

```bash
node scripts/watch-node.mjs gateway --force
```

Le watcher redémarre sur les fichiers pertinents pour le build sous `src/`, les fichiers source d’extensions,
les métadonnées `package.json` et `openclaw.plugin.json` des extensions, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent la
Gateway sans forcer un rebuild `tsdown` ; les changements de source et de configuration
reconstruisent toujours `dist` d’abord.

Ajoutez tous les drapeaux CLI de la Gateway après `gateway:watch` et ils seront retransmis à
chaque redémarrage. Réexécuter la même commande watch pour le même dépôt/jeu de drapeaux
remplace désormais l’ancien watcher au lieu de laisser des parents de watcher en double.

## Profil dev + Gateway dev (`--dev`)

Utilisez le profil dev pour isoler l’état et lancer une configuration sûre et jetable pour le
débogage. Il existe **deux** drapeaux `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port de la Gateway à `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` :** indique à la Gateway de créer automatiquement une configuration +
  un espace de travail par défaut s’ils sont absents (et d’ignorer `BOOTSTRAP.md`).

Flux recommandé (profil dev + bootstrap dev) :

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si vous n’avez pas encore d’installation globale, exécutez la CLI via `pnpm openclaw ...`.

Ce que cela fait :

1. **Isolation de profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se décalent en conséquence)

2. **Bootstrap dev** (`gateway --dev`)
   - Écrit une configuration minimale si absente (`gateway.mode=local`, liaison loopback).
   - Définit `agent.workspace` sur l’espace de travail dev.
   - Définit `agent.skipBootstrap=true` (pas de `BOOTSTRAP.md`).
   - Initialise les fichiers de l’espace de travail s’ils sont absents :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde protocolaire).
   - Ignore les fournisseurs de canaux en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

Remarque : `--dev` est un drapeau de profil **global** et il est absorbé par certains runners.
Si vous devez l’écrire explicitement, utilisez la forme variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail dev (en utilisant
`trash`, pas `rm`), puis recrée la configuration dev par défaut.

Astuce : si une Gateway non dev est déjà en cours d’exécution (launchd/systemd), arrêtez-la d’abord :

```bash
openclaw gateway stop
```

## Journalisation des flux bruts (OpenClaw)

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage/formatage.
C’est la meilleure façon de voir si le raisonnement arrive sous forme de deltas de texte brut
(ou de blocs de réflexion séparés).

Activez-le via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Remplacement facultatif du chemin :

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variables d’environnement équivalentes :

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Fichier par défaut :

`~/.openclaw/logs/raw-stream.jsonl`

## Journalisation des segments bruts (pi-mono)

Pour capturer les **segments bruts compatibles OpenAI** avant qu’ils soient analysés en blocs,
pi-mono expose un journaliseur distinct :

```bash
PI_RAW_STREAM=1
```

Chemin facultatif :

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Fichier par défaut :

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Remarque : ceci n’est émis que par les processus utilisant le fournisseur
> `openai-completions` de pi-mono.

## Remarques de sécurité

- Les journaux de flux bruts peuvent inclure les prompts complets, la sortie des outils et les données utilisateur.
- Conservez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, nettoyez d’abord les secrets et les données personnelles.
