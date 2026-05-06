---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter les fuites de raisonnement
    - Vous souhaitez lancer le Gateway en mode surveillance pendant vos itérations
    - Vous avez besoin d’un workflow de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-05-06T07:25:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Assistants de débogage pour la sortie en streaming, en particulier lorsqu’un provider mélange le raisonnement au texte normal.

## Remplacements de débogage à l’exécution

Utilisez `/debug` dans le chat pour définir des remplacements de configuration **uniquement à l’exécution** (mémoire, pas disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des paramètres obscurs sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface tous les remplacements et revient à la configuration sur disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant aux Plugins dans une session
sans activer le mode entièrement verbeux.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de Plugin tels que les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie verbeuse normale de statut/outils, et continuez à utiliser
`/debug` pour les remplacements de configuration uniquement à l’exécution.

## Trace du cycle de vie des Plugins

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes de cycle de vie des Plugins semblent lentes
et que vous avez besoin d’un découpage intégré par phase pour les métadonnées de Plugin, la découverte, le registre,
le miroir d’exécution, la mutation de configuration et le travail d’actualisation. La trace est activée explicitement et écrit
sur stderr, de sorte que la sortie JSON de la commande reste analysable.

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

Utilisez ceci pour étudier le cycle de vie des Plugins avant de recourir à un profileur CPU.
Si la commande s’exécute depuis un checkout source, préférez mesurer le runtime construit
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Profilage du démarrage CLI et des commandes

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
commande. Utilisez ceci avant d’ajouter une instrumentation temporaire au code de commande.

Pour les blocages au démarrage qui ressemblent à du travail synchrone de système de fichiers ou de chargeur de modules,
ajoutez l’indicateur de trace d’E/S synchrones de Node via le lanceur source :

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` active cet indicateur par défaut pour l’enfant Gateway surveillé.
Définissez `OPENCLAW_TRACE_SYNC_IO=0` pour supprimer la sortie de trace d’E/S synchrones Node en mode watch
mode.

## Mode watch Gateway

Pour itérer rapidement, exécutez le Gateway sous le watcher de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port telle que
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les shells non interactifs, CI et appels exec d’agent restent détachés et impriment plutôt les
instructions d’attachement. Attachez-vous manuellement si nécessaire :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le panneau tmux exécute le watcher brut :

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

Profilez le temps CPU du Gateway surveillé lors du débogage des points chauds de démarrage/runtime :

```bash
pnpm gateway:watch --benchmark
```

Le wrapper watch consomme `--benchmark` avant d’invoquer le Gateway et écrit
un `.cpuprofile` V8 par sortie d’enfant Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le gateway surveillé pour
vider le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.
Utilisez `--benchmark-no-force` lorsque vous voulez que l’enfant benchmarké ignore le
nettoyage de port `--force` par défaut et échoue rapidement si le port Gateway est déjà
utilisé.
Le mode benchmark supprime par défaut le bruit des traces d’E/S synchrones. Définissez
`OPENCLAW_TRACE_SYNC_IO=1` avec `--benchmark` lorsque vous voulez explicitement à la fois les profils CPU
et les traces de pile d’E/S synchrones Node. En mode benchmark, ces blocs de trace
sont écrits dans `gateway-watch-output.log` sous le répertoire de benchmark et
filtrés du panneau de terminal ; les journaux Gateway normaux restent visibles.

Le wrapper tmux transporte dans le panneau les sélecteurs runtime non secrets courants tels que
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez
les identifiants de provider dans votre profil/configuration habituels, ou utilisez le mode brut au premier plan
pour des secrets éphémères ponctuels.
Si le Gateway surveillé se ferme pendant le démarrage, le watcher exécute
`openclaw doctor --fix --non-interactive` une fois et redémarre l’enfant Gateway.
Utilisez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` lorsque vous voulez l’échec de démarrage original
sans la passe de réparation réservée au développement.
Le panneau tmux géré utilise aussi par défaut des journaux Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` au démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le watcher redémarre sur les fichiers pertinents pour la build sous `src/`, les fichiers source d’extensions,
les métadonnées `package.json` et `openclaw.plugin.json` des extensions, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent le
gateway sans forcer une reconstruction `tsdown` ; les changements de source et de configuration
reconstruisent toujours `dist` d’abord.

Ajoutez tout indicateur CLI gateway après `gateway:watch` et il sera transmis à
chaque redémarrage. Réexécuter la même commande watch relance le panneau tmux nommé, et
le watcher brut conserve toujours son verrou de watcher unique afin que les parents watcher en double
soient remplacés au lieu de s’accumuler.

## Profil dev + gateway dev (--dev)

Utilisez le profil dev pour isoler l’état et lancer une configuration sûre et jetable pour le
débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration par défaut +
  un espace de travail** s’ils manquent (et d’ignorer BOOTSTRAP.md).

Flux recommandé (profil dev + amorçage dev) :

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
   - `OPENCLAW_GATEWAY_PORT=19001` (le navigateur/canvas se décalent en conséquence)

2. **Amorçage dev** (`gateway --dev`)
   - Écrit une configuration minimale si elle manque (`gateway.mode=local`, bind loopback).
   - Définit `agent.workspace` sur l’espace de travail dev.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Amorçe les fichiers d’espace de travail s’ils manquent :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3-PO** (droïde protocolaire).
   - Ignore les providers de canal en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un indicateur de profil **global** et certains lanceurs le consomment. Si vous devez l’écrire explicitement, utilisez la forme variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail dev (avec
`trash`, pas `rm`), puis recrée la configuration dev par défaut.

<Tip>
Si un gateway non-dev est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du stream brut (OpenClaw)

OpenClaw peut journaliser le **stream assistant brut** avant tout filtrage/formatage.
C’est la meilleure façon de voir si le raisonnement arrive sous forme de deltas de texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-le via la CLI :

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

## Journalisation des chunks bruts (pi-mono)

Pour capturer les **chunks bruts compatibles OpenAI** avant qu’ils soient analysés en blocs,
pi-mono expose un logger distinct :

```bash
PI_RAW_STREAM=1
```

Chemin facultatif :

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Fichier par défaut :

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Remarque : ceci est émis uniquement par les processus utilisant le provider
> `openai-completions` de pi-mono.

## Notes de sécurité

- Les journaux de stream brut peuvent inclure des prompts complets, la sortie d’outils et des données utilisateur.
- Gardez les journaux locaux et supprimez-les après le débogage.
- Si vous partagez des journaux, expurgez d’abord les secrets et les données personnelles.

## Débogage dans VSCode

Les source maps sont nécessaires pour activer le débogage dans les IDE basés sur VSCode, car beaucoup de fichiers générés se retrouvent avec des noms hachés dans le cadre du processus de build. Les configurations `launch.json` incluses ciblent le service Gateway, mais peuvent être adaptées rapidement à d’autres usages :

1. **Reconstruire et déboguer Gateway** - Débogue le service Gateway après avoir créé une nouvelle build
2. **Déboguer Gateway** - Débogue le service Gateway d’une build préexistante

### Configuration

La configuration **Reconstruire et déboguer Gateway** par défaut est prête à l’emploi ; elle supprimera automatiquement le dossier `/dist` et reconstruira le projet avec le débogage activé :

1. Ouvrez le panneau **Exécuter et déboguer** depuis la barre d’activité ou appuyez sur `Ctrl`+`Shift`+`D`
2. Dans l’IDE, assurez-vous que **Reconstruire et déboguer Gateway** est sélectionné dans la liste déroulante de configuration, puis appuyez sur le bouton **Démarrer le débogage**

Autrement, si vous préférez gérer manuellement les processus de build et de débogage :

1. Ouvrez un terminal et activez les source maps :
   - **Linux/macOS** : `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)** : `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)** : `set OUTPUT_SOURCE_MAPS=1`
2. Dans le même terminal, reconstruisez le projet : `pnpm clean:dist && pnpm build`
3. Dans l’IDE, sélectionnez l’option **Déboguer Gateway** dans la liste déroulante de configuration **Exécuter et déboguer**, puis appuyez sur le bouton **Démarrer le débogage**

Vous pouvez maintenant définir des points d’arrêt dans vos fichiers source TypeScript (répertoire `src/`) et le débogueur associera correctement les points d’arrêt au JavaScript compilé via les source maps. Vous pourrez inspecter les variables, exécuter le code pas à pas et examiner les piles d’appels comme prévu.

### Notes

- Si vous utilisez l’option **"Reconstruire et déboguer Gateway"**, chaque lancement du débogueur supprimera complètement le dossier `/dist` et exécutera un `pnpm build` complet avec les source maps activées avant de démarrer le Gateway
- Si vous utilisez l’option **"Déboguer Gateway"**, les sessions de débogage peuvent être démarrées et arrêtées à tout moment sans affecter le dossier `/dist`, mais vous devez utiliser un processus de terminal séparé pour activer le débogage et gérer le cycle de build
- Modifiez les paramètres `launch.json` pour `args` afin de déboguer d’autres sections du projet
- Si vous devez utiliser la CLI OpenClaw construite pour d’autres tâches (c.-à-d. `dashboard --no-open` si votre session de débogage génère un nouveau jeton d’authentification), vous pouvez l’exécuter dans un autre terminal avec `node ./openclaw.mjs` ou créer un alias shell comme `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Connexe

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
