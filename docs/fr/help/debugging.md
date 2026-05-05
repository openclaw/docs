---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter une fuite de raisonnement
    - Vous voulez exécuter le Gateway en mode watch pendant vos itérations
    - Il vous faut un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-05-05T01:47:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Aides au débogage pour la sortie en streaming, en particulier lorsqu’un fournisseur mélange le raisonnement au texte normal.

## Substitutions de débogage à l’exécution

Utilisez `/debug` dans le chat pour définir des substitutions de configuration **uniquement à l’exécution** (en mémoire, pas sur le disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des paramètres peu visibles sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface toutes les substitutions et revient à la configuration sur disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant aux plugins dans une session
sans activer le mode entièrement détaillé.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de plugins tels que les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie détaillée normale d’état/d’outils, et continuez à utiliser
`/debug` pour les substitutions de configuration uniquement à l’exécution.

## Trace du cycle de vie du Plugin

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes de cycle de vie des plugins semblent lentes
et que vous avez besoin d’une décomposition intégrée par phase pour les métadonnées, la découverte, le registre,
le miroir d’exécution, la mutation de configuration et les travaux d’actualisation des plugins. La trace est optionnelle et écrit
vers stderr, donc la sortie JSON des commandes reste analysable.

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

Utilisez cela pour l’investigation du cycle de vie des plugins avant de recourir à un profileur CPU.
Si la commande s’exécute depuis une copie de travail source, préférez mesurer le runtime construit
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Démarrage de la CLI et profilage des commandes

Utilisez le benchmark de démarrage versionné lorsqu’une commande semble lente :

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

Le lanceur source ajoute les indicateurs de profil CPU Node et écrit un `.cpuprofile` pour la
commande. Utilisez cela avant d’ajouter une instrumentation temporaire au code de la commande.

Pour les blocages au démarrage qui ressemblent à un travail synchrone du système de fichiers ou du chargeur de modules,
ajoutez l’indicateur de trace d’E/S synchrones de Node via le lanceur source :

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` active cet indicateur par défaut pour le processus enfant Gateway surveillé.
Définissez `OPENCLAW_TRACE_SYNC_IO=0` pour supprimer la sortie de trace d’E/S synchrones Node en mode
surveillance.

## Mode de surveillance du Gateway

Pour une itération rapide, exécutez le gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port telle que
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les shells non interactifs, la CI et les appels d’exécution d’agents restent détachés et affichent plutôt
les instructions d’attachement. Attachez-vous manuellement si nécessaire :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le volet tmux exécute le surveillant brut :

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

Profilez le temps CPU du Gateway surveillé lors du débogage des points chauds de démarrage/runtime :

```bash
pnpm gateway:watch --benchmark
```

L’enveloppe de surveillance consomme `--benchmark` avant d’invoquer le Gateway et écrit
un `.cpuprofile` V8 par arrêt de processus enfant Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le gateway surveillé pour
vider le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.
Utilisez `--benchmark-no-force` lorsque vous voulez que le processus enfant benchmarké ignore le
nettoyage de port `--force` par défaut et échoue rapidement si le port Gateway est déjà
utilisé.
Le mode benchmark supprime par défaut le bruit de trace d’E/S synchrones. Définissez
`OPENCLAW_TRACE_SYNC_IO=1` avec `--benchmark` lorsque vous voulez explicitement à la fois les profils CPU
et les traces de pile d’E/S synchrones Node. En mode benchmark, ces blocs de trace
sont écrits dans `gateway-watch-output.log` sous le répertoire de benchmark et
filtrés du volet de terminal ; les journaux Gateway normaux restent visibles.

L’enveloppe tmux transmet au volet les sélecteurs runtime non secrets courants tels que
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez
les identifiants des fournisseurs dans votre profil/configuration normale, ou utilisez le mode premier plan brut
pour des secrets éphémères ponctuels.
Si le Gateway surveillé quitte pendant le démarrage, le surveillant exécute
`openclaw doctor --fix --non-interactive` une fois et redémarre le processus enfant Gateway.
Utilisez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` lorsque vous voulez l’échec de démarrage original
sans la passe de réparation réservée au développement.
Le volet tmux géré utilise aussi par défaut des journaux Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` au démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le surveillant redémarre sur les fichiers pertinents pour la compilation sous `src/`, les fichiers source d’extensions,
les métadonnées `package.json` et `openclaw.plugin.json` des extensions, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent le
gateway sans forcer une reconstruction `tsdown` ; les changements de source et de configuration
reconstruisent toujours d’abord `dist`.

Ajoutez tout indicateur CLI du gateway après `gateway:watch` et il sera transmis à
chaque redémarrage. Relancer la même commande de surveillance recrée le volet tmux nommé, et
le surveillant brut conserve toujours son verrou de surveillant unique afin que les parents surveillants en double
soient remplacés au lieu de s’accumuler.

## Profil de développement + Gateway de développement (--dev)

Utilisez le profil de développement pour isoler l’état et démarrer une configuration sûre et jetable pour
le débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration +
  un espace de travail par défaut** lorsqu’ils manquent (et d’ignorer BOOTSTRAP.md).

Flux recommandé (profil de développement + amorçage de développement) :

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
   - `OPENCLAW_GATEWAY_PORT=19001` (le navigateur/canvas se décalent en conséquence)

2. **Amorçage de développement** (`gateway --dev`)
   - Écrit une configuration minimale si elle manque (`gateway.mode=local`, liaison loopback).
   - Définit `agent.workspace` sur l’espace de travail de développement.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Initialise les fichiers de l’espace de travail s’ils manquent :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde de protocole).
   - Ignore les fournisseurs de canaux en mode développement (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un indicateur de profil **global** et certains lanceurs le consomment. Si vous devez l’expliciter, utilisez la forme variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail de développement (avec
`trash`, pas `rm`), puis recrée la configuration de développement par défaut.

<Tip>
Si un gateway non développement est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du flux brut (OpenClaw)

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage/formatage.
C’est la meilleure façon de voir si le raisonnement arrive sous forme de deltas en texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-la via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Substitution facultative du chemin :

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
pi-mono expose un journaliseur séparé :

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

- Les journaux de flux brut peuvent inclure des prompts complets, la sortie des outils et des données utilisateur.
- Gardez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les données personnelles.

## Connexe

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
