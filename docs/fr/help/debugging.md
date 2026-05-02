---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter les fuites de raisonnement
    - Vous voulez exécuter le Gateway en mode surveillance pendant vos itérations
    - Vous avez besoin d’un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-05-02T22:19:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Aides au débogage pour la sortie en streaming, surtout lorsqu’un fournisseur mélange le raisonnement au texte normal.

## Surcharges de débogage au runtime

Utilisez `/debug` dans le chat pour définir des surcharges de configuration **uniquement au runtime** (en mémoire, pas sur disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des paramètres obscurs sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface toutes les surcharges et revient à la configuration sur disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant aux Plugins dans une session
sans activer le mode détaillé complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de Plugin tels que les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie détaillée normale d’état/d’outils, et continuez à utiliser
`/debug` pour les surcharges de configuration uniquement au runtime.

## Trace du cycle de vie des Plugins

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes de cycle de vie des Plugins semblent lentes
et que vous avez besoin d’une décomposition intégrée des phases pour les métadonnées de Plugin, la découverte, le registre,
le miroir runtime, la mutation de configuration et le travail d’actualisation. La trace est optionnelle et écrit
vers stderr, de sorte que la sortie JSON des commandes reste analysable.

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

Utilisez cela pour analyser le cycle de vie des Plugins avant de recourir à un profileur CPU.
Si la commande s’exécute depuis un checkout source, préférez mesurer le runtime construit
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Démarrage de la CLI et profilage des commandes

Utilisez le benchmark de démarrage inclus lorsqu’une commande semble lente :

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Pour un profilage ponctuel via le lanceur source normal, définissez
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` :

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Le lanceur source ajoute les flags de profil CPU Node et écrit un `.cpuprofile` pour la
commande. Utilisez cela avant d’ajouter une instrumentation temporaire au code de commande.

## Mode watch du Gateway

Pour itérer rapidement, exécutez le Gateway sous le watcher de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port telle que
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les shells non interactifs, la CI et les appels exec d’agent restent détachés et affichent plutôt les
instructions d’attachement. Attachez-vous manuellement si nécessaire :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le volet tmux exécute le watcher brut :

```bash
node scripts/watch-node.mjs gateway --force
```

Utilisez le mode au premier plan lorsque tmux n’est pas souhaité :

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Désactivez l’attachement automatique tout en conservant la gestion tmux :

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilez le temps CPU du Gateway surveillé lorsque vous déboguez des points chauds de démarrage/runtime :

```bash
pnpm gateway:watch --benchmark
```

Le wrapper watch consomme `--benchmark` avant d’invoquer le Gateway et écrit
un `.cpuprofile` V8 par sortie d’enfant Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le gateway surveillé pour
vider le profil courant, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.

Le wrapper tmux transporte dans le volet les sélecteurs runtime courants non secrets tels que
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez les identifiants des
fournisseurs dans votre profil/configuration habituels, ou utilisez le mode brut au premier plan
pour les secrets éphémères ponctuels.
Le volet tmux géré utilise aussi par défaut des journaux Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` au démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le watcher redémarre sur les fichiers pertinents pour la build sous `src/`, les fichiers source d’extension,
les métadonnées `package.json` et `openclaw.plugin.json` d’extension, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent le
gateway sans forcer une rebuild `tsdown` ; les changements de source et de configuration reconstruisent toujours
`dist` d’abord.

Ajoutez tout flag CLI de gateway après `gateway:watch` et ils seront transmis à
chaque redémarrage. Relancer la même commande watch relance le volet tmux nommé, et
le watcher brut conserve toujours son verrou de watcher unique afin que les parents watcher dupliqués
soient remplacés au lieu de s’empiler.

## Profil dev + Gateway dev (--dev)

Utilisez le profil dev pour isoler l’état et lancer une configuration sûre et jetable pour
le débogage. Il existe **deux** flags `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du gateway à `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration par défaut +
  un workspace** lorsqu’ils sont absents (et d’ignorer BOOTSTRAP.md).

Flux recommandé (profil dev + bootstrap dev) :

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
   - `OPENCLAW_GATEWAY_PORT=19001` (le navigateur/canevas se décalent en conséquence)

2. **Bootstrap dev** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, liaison loopback).
   - Définit `agent.workspace` sur le workspace dev.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Initialise les fichiers du workspace s’ils sont absents :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde de protocole).
   - Ignore les fournisseurs de canaux en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un flag de profil **global** et est consommé par certains lanceurs. Si vous devez l’écrire explicitement, utilisez la forme variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et le workspace dev (avec
`trash`, pas `rm`), puis recrée la configuration dev par défaut.

<Tip>
Si un gateway non-dev est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du stream brut (OpenClaw)

OpenClaw peut journaliser le **stream assistant brut** avant tout filtrage/formatage.
C’est la meilleure façon de voir si le raisonnement arrive sous forme de deltas en texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-la via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Surcharge de chemin optionnelle :

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

## Journalisation des chunks bruts (pi-mono)

Pour capturer les **chunks bruts compatibles OpenAI** avant leur analyse en blocs,
pi-mono expose un journaliseur séparé :

```bash
PI_RAW_STREAM=1
```

Chemin optionnel :

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Fichier par défaut :

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Remarque : ceci n’est émis que par les processus utilisant le fournisseur
> `openai-completions` de pi-mono.

## Notes de sécurité

- Les journaux de stream brut peuvent inclure les prompts complets, la sortie d’outils et les données utilisateur.
- Gardez les journaux locaux et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les informations personnelles identifiables.

## Connexe

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
