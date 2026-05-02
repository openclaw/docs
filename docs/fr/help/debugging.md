---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter les fuites de raisonnement
    - Vous souhaitez exécuter le Gateway en mode surveillance pendant vos itérations
    - Il vous faut un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-05-02T20:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Aides au débogage pour la sortie en streaming, en particulier lorsqu’un fournisseur mêle du raisonnement au texte normal.

## Surcharges de débogage au runtime

Utilisez `/debug` dans le chat pour définir des surcharges de configuration **uniquement au runtime** (en mémoire, pas sur le disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des paramètres obscurs sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface toutes les surcharges et revient à la configuration présente sur le disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant au Plugin dans une session
sans activer le mode entièrement détaillé.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de Plugin, comme les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie détaillée normale d’état/d’outil, et continuez à utiliser
`/debug` pour les surcharges de configuration uniquement au runtime.

## Trace du cycle de vie du Plugin

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes de cycle de vie du Plugin semblent lentes
et que vous avez besoin d’une décomposition intégrée des phases pour les métadonnées de Plugin, la découverte, le registre,
le miroir de runtime, la mutation de configuration et le travail d’actualisation. La trace est facultative et écrit
sur stderr, de sorte que la sortie JSON des commandes reste analysable.

Exemple :

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Exemple de sortie :

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Utilisez cela pour l’investigation du cycle de vie du Plugin avant de recourir à un profileur CPU.
Si la commande est exécutée depuis un checkout source, préférez mesurer le runtime compilé
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Chronométrage de débogage temporaire de la CLI

OpenClaw conserve `src/cli/debug-timing.ts` comme petit assistant pour les investigations locales.
Il n’est volontairement pas branché par défaut au démarrage de la CLI, au routage des commandes
ni à aucune commande. Utilisez-le uniquement pendant le débogage d’une commande lente, puis
supprimez l’import et les spans avant d’intégrer le changement de comportement.

Utilisez cela lorsqu’une commande est lente et que vous avez besoin d’une décomposition rapide des phases avant
de décider s’il faut utiliser un profileur CPU ou corriger un sous-système précis.

### Ajouter des spans temporaires

Ajoutez l’assistant près du code que vous investiguez. Par exemple, pendant le débogage de
`openclaw models list`, un correctif temporaire dans
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

Consignes :

- Préfixez les noms de phases temporaires avec `debug:`.
- Ajoutez seulement quelques spans autour des sections soupçonnées d’être lentes.
- Préférez des phases larges comme `registry`, `auth_store` ou `rows` plutôt que des
  noms d’assistants.
- Utilisez `time()` pour le travail synchrone et `timeAsync()` pour les promesses.
- Gardez stdout propre. L’assistant écrit sur stderr, donc la sortie JSON des commandes reste
  analysable.
- Supprimez les imports et spans temporaires avant d’ouvrir la PR de correction finale.
- Incluez la sortie de chronométrage ou un court résumé dans l’issue ou la PR qui explique
  l’optimisation.

### Exécuter avec une sortie lisible

Le mode lisible est le mieux adapté au débogage en direct :

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Exemple de sortie issue d’une investigation temporaire de `models list` :

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

Constats tirés de cette sortie :

| Phase                                    |       Durée | Ce que cela signifie                                                                                         |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------------ |
| `debug:models:list:auth_store`           |       20.3s | Le chargement du magasin de profils d’authentification est le coût le plus important et doit être investigué en premier. |
| `debug:models:list:ensure_models_json`   |        5.0s | La synchronisation de `models.json` est assez coûteuse pour inspecter la mise en cache ou les conditions d’évitement. |
| `debug:models:list:load_model_registry`  |        5.9s | La construction du registre et le travail de disponibilité du fournisseur sont aussi des coûts significatifs. |
| `debug:models:list:read_registry_models` |        2.4s | La lecture de tous les modèles du registre n’est pas gratuite et peut compter pour `--all`.                   |
| phases d’ajout de lignes                 | 3.2s au total | Construire cinq lignes affichées prend tout de même plusieurs secondes, donc le chemin de filtrage mérite un examen plus poussé. |
| `debug:models:list:print_model_table`    |         0ms | Le rendu n’est pas le goulot d’étranglement.                                                                 |

Ces constats suffisent à guider le correctif suivant sans conserver le code de chronométrage dans
les chemins de production.

### Exécuter avec une sortie JSON

Utilisez le mode JSON lorsque vous voulez enregistrer ou comparer les données de chronométrage :

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

### Nettoyer avant l’intégration

Avant d’ouvrir la PR finale :

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

La commande ne doit renvoyer aucun site d’appel d’instrumentation temporaire, sauf si la PR
ajoute explicitement une surface de diagnostic permanente. Pour les corrections de performance
normales, ne gardez que le changement de comportement, les tests et une courte note avec les
éléments de chronométrage.

Pour les hotspots CPU plus profonds, utilisez le profilage Node (`--cpu-prof`) ou un profileur
externe plutôt que d’ajouter davantage de wrappers de chronométrage.

## Mode de surveillance du Gateway

Pour une itération rapide, exécutez le Gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port comme
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les shells non interactifs, la CI et les appels d’exécution d’agent restent détachés et affichent
plutôt les instructions d’attachement. Attachez-vous manuellement si nécessaire :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le panneau tmux exécute le surveillant brut :

```bash
node scripts/watch-node.mjs gateway --force
```

Utilisez le mode premier plan lorsque tmux n’est pas souhaité :

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Désactivez l’attachement automatique tout en conservant la gestion tmux :

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilez le temps CPU du Gateway surveillé lors du débogage des hotspots de démarrage/runtime :

```bash
pnpm gateway:watch --benchmark
```

Le wrapper de surveillance consomme `--benchmark` avant d’invoquer le Gateway et écrit
un fichier V8 `.cpuprofile` par sortie d’enfant Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le gateway surveillé pour
vider le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.

Le wrapper tmux transmet au panneau les sélecteurs courants de runtime non secrets comme
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez les identifiants des fournisseurs
dans votre profil/configuration habituels, ou utilisez le mode brut au premier plan
pour des secrets éphémères ponctuels.
Le panneau tmux géré utilise aussi par défaut des journaux Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` lors du lancement de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le surveillant redémarre sur les fichiers pertinents pour la compilation sous `src/`, les fichiers source d’extension,
les métadonnées `package.json` et `openclaw.plugin.json` d’extension, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent le
gateway sans forcer une recompilation `tsdown` ; les changements de source et de configuration
reconstruisent toujours `dist` d’abord.

Ajoutez tout indicateur CLI de gateway après `gateway:watch` et il sera transmis à chaque
redémarrage. Relancer la même commande de surveillance relance le panneau tmux nommé, et
le surveillant brut conserve toujours son verrou de surveillant unique afin que les parents de surveillants en double
soient remplacés au lieu de s’accumuler.

## Profil de dev + gateway de dev (--dev)

Utilisez le profil de dev pour isoler l’état et démarrer une configuration sûre et jetable pour
le débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration par défaut +
  un espace de travail** s’ils sont absents (et d’ignorer BOOTSTRAP.md).

Flux recommandé (profil de dev + bootstrap de dev) :

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si vous n’avez pas encore d’installation globale, exécutez la CLI via `pnpm openclaw ...`.

Ce que cela fait :

1. **Isolation du profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas shift accordingly)

2. **Bootstrap de dev** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, bind loopback).
   - Définit `agent.workspace` sur l’espace de travail de dev.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Amorçe les fichiers de l’espace de travail s’ils sont absents :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde de protocole).
   - Ignore les fournisseurs de canaux en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est une option de profil **globale** et certains lanceurs l’interceptent. Si vous devez l’expliciter, utilisez la forme avec variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail de développement (avec
`trash`, pas `rm`), puis recrée la configuration de développement par défaut.

<Tip>
Si un Gateway hors développement est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du flux brut (OpenClaw)

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage/formatage.
C’est le meilleur moyen de voir si le raisonnement arrive sous forme de deltas de texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-la via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Remplacement de chemin facultatif :

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

## Journalisation des fragments bruts (pi-mono)

Pour capturer les **fragments bruts compatibles OpenAI** avant leur analyse en blocs,
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

## Notes de sécurité

- Les journaux de flux brut peuvent inclure les prompts complets, la sortie des outils et les données utilisateur.
- Gardez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, nettoyez d’abord les secrets et les PII.

## Connexe

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
