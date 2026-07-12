---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter toute fuite de raisonnement
    - Vous souhaitez exécuter le Gateway en mode surveillance pendant vos itérations
    - Vous avez besoin d’un processus de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-07-12T02:54:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Outils d’aide au débogage de la sortie en streaming, des itérations du Gateway et du profilage du démarrage.

## Remplacements de configuration à l’exécution pour le débogage

`/debug` définit des remplacements de configuration **uniquement à l’exécution** (en mémoire, pas sur disque). Désactivé par défaut ; activez-le avec `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface tous les remplacements et rétablit la configuration enregistrée sur disque.

## Sortie de trace de session

`/trace` affiche les lignes de trace et de débogage appartenant au Plugin pour une session, sans activer le mode entièrement détaillé. Utilisez-le pour les diagnostics de Plugin, comme les résumés de débogage d’Active Memory ; utilisez `/verbose` pour les sorties normales d’état et d’outils.

```text
/trace
/trace on
/trace off
```

## Trace du cycle de vie des Plugins

Définissez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` pour obtenir une décomposition phase par phase des métadonnées, de la découverte, du registre, du miroir d’exécution, des modifications de configuration et des opérations d’actualisation des Plugins. La sortie est écrite sur stderr afin que la sortie JSON des commandes reste analysable.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Utilisez ceci avant de recourir à un profileur de processeur. Depuis une copie de travail des sources, mesurez l’exécution compilée avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...` mesure également la surcharge du lanceur de sources.

## Profilage du démarrage et des commandes de la CLI

Tests de performances du démarrage intégrés au dépôt :

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Pour un profilage ponctuel via le lanceur de sources normal, définissez `OPENCLAW_RUN_NODE_CPU_PROF_DIR` :

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Le lanceur de sources ajoute les indicateurs de profilage processeur de Node et écrit un fichier `.cpuprofile` pour la commande. Utilisez ceci avant d’ajouter une instrumentation temporaire au code de la commande.

Pour les blocages au démarrage qui semblent provenir d’opérations synchrones du système de fichiers ou du chargeur de modules, ajoutez l’indicateur de traçage des E/S synchrones de Node via le lanceur de sources :

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laisse cet indicateur désactivé par défaut pour le processus enfant du Gateway surveillé ; définissez également `OPENCLAW_TRACE_SYNC_IO=1` lorsque vous souhaitez obtenir la sortie de trace des E/S synchrones en mode surveillance.

## Mode surveillance du Gateway

```bash
pnpm gateway:watch
```

Par défaut, cette commande démarre ou redémarre une session tmux nommée `openclaw-gateway-watch-<profile>` (par exemple `openclaw-gateway-watch-main`), avec un suffixe de port tel que `openclaw-gateway-watch-dev-19001` ajouté uniquement lorsque `OPENCLAW_GATEWAY_PORT` diffère du port par défaut `18789`. Elle s’attache automatiquement depuis les terminaux interactifs ; les shells non interactifs, la CI et les appels d’exécution d’agents restent détachés et affichent plutôt les instructions de connexion :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le volet tmux exécute directement l’outil de surveillance :

```bash
node scripts/watch-node.mjs gateway --force
```

Arrêtez un service Gateway installé avant de surveiller le même port :

```bash
pnpm openclaw gateway stop
```

L’option `--force` de l’outil de surveillance libère le port actuellement écouté, mais elle ne désactive pas un service supervisé. Sans cela, un service launchd, systemd ou Scheduled Task peut redémarrer et remplacer le Gateway surveillé.

Mode au premier plan sans tmux :

```bash
pnpm gateway:watch:raw
# ou
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Conservez la gestion par tmux, mais désactivez la connexion automatique :

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilez le temps processeur du Gateway surveillé lors du débogage des points chauds au démarrage ou à l’exécution :

```bash
pnpm gateway:watch --benchmark
```

L’enveloppe de surveillance consomme `--benchmark` avant d’appeler le Gateway et écrit un fichier V8 `.cpuprofile` pour chaque arrêt d’un processus enfant du Gateway dans `.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le Gateway surveillé pour finaliser le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>` : écrit les profils dans un autre emplacement.
- `--benchmark-no-force` : ignore la libération par défaut du port avec `--force` et échoue immédiatement si le port du Gateway est déjà utilisé.

Par défaut, le mode test de performances masque les messages répétitifs de traçage des E/S synchrones. Définissez `OPENCLAW_TRACE_SYNC_IO=1` avec `--benchmark` pour obtenir à la fois les profils processeur et les traces de pile des E/S synchrones ; en mode test de performances, ces blocs de trace sont écrits dans `gateway-watch-output.log`, dans le répertoire des tests de performances, et filtrés du volet du terminal, tandis que les journaux normaux du Gateway restent visibles.

L’enveloppe tmux transmet au volet les sélecteurs d’exécution courants non secrets, notamment `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez les identifiants des fournisseurs dans votre profil ou votre configuration habituels, ou utilisez le mode brut au premier plan pour les secrets éphémères ponctuels.

Si le Gateway surveillé s’arrête pendant le démarrage, l’outil de surveillance exécute une fois `openclaw doctor --fix --non-interactive`, puis redémarre le processus enfant du Gateway. Définissez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` pour voir l’échec de démarrage d’origine sans la passe de réparation réservée au développement.

Par défaut, le volet tmux géré affiche les journaux colorés du Gateway ; définissez `FORCE_COLOR=0` lors du démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

L’outil de surveillance redémarre lors de modifications apportées aux fichiers pertinents pour la compilation sous `src/`, aux fichiers sources des extensions, aux métadonnées `package.json` et `openclaw.plugin.json` des extensions, ainsi qu’à `tsconfig.json`, `package.json` et `tsdown.config.ts`. Les modifications des métadonnées des extensions redémarrent le Gateway sans forcer de recompilation ; les modifications des sources et de la configuration recompilent toujours `dist` au préalable.

Ajoutez les indicateurs de CLI du Gateway après `gateway:watch` ; ils seront transmis à chaque redémarrage. La réexécution de la même commande de surveillance recrée le volet tmux nommé ; l’outil de surveillance brut utilise un verrou d’instance unique afin que les processus parents en double soient remplacés plutôt que de s’accumuler.

## Profil de développement et Gateway de développement (--dev)

Deux indicateurs `--dev` **distincts** :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et définit par défaut le port du Gateway sur `19001` (les ports dérivés sont décalés en conséquence).
- **`gateway --dev` :** indique au Gateway de créer automatiquement une configuration et un espace de travail par défaut s’ils sont absents (et d’ignorer l’amorçage).

Flux recommandé (profil de développement et amorçage de développement) :

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sans installation globale, exécutez la CLI via `pnpm openclaw ...`.

Fonctionnement :

1. **Isolation du profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (les ports du navigateur et du canevas sont décalés en conséquence)

2. **Amorçage de développement** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, liaison loopback).
   - Définit `agents.defaults.workspace` sur l’espace de travail de développement et `agents.defaults.skipBootstrap=true`.
   - Initialise les fichiers de l’espace de travail s’ils sont absents : `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identité par défaut : **C3-PO** (droïde de protocole).
   - `pnpm gateway:dev` définit également `OPENCLAW_SKIP_CHANNELS=1` pour ignorer les fournisseurs de canaux.

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un indicateur de profil **global** que certains lanceurs absorbent. Si vous devez l’indiquer explicitement, utilisez la variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail de développement (déplacé dans la corbeille, pas supprimé), puis recrée la configuration de développement par défaut.

<Tip>
Si un Gateway hors développement est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du flux brut

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage ou formatage. C’est la meilleure façon de vérifier si le raisonnement arrive sous forme de fragments de texte brut, ou de blocs de réflexion distincts.

Activez-la via la CLI :

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

Fichier par défaut : `~/.openclaw/logs/raw-stream.jsonl`

## Notes de sécurité

- Les journaux du flux brut peuvent inclure les invites complètes, les sorties des outils et les données utilisateur.
- Conservez les journaux localement et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les informations personnelles identifiables.

## Débogage dans VSCode

Les cartes de sources sont nécessaires, car la compilation applique un hachage aux noms des fichiers générés. Le fichier `launch.json` inclus cible le service Gateway :

1. **Rebuild and Debug Gateway** — supprime `/dist` et recompile avec le débogage activé avant de démarrer le Gateway.
2. **Debug Gateway** — débogue une compilation existante sans modifier `/dist`.

### Configuration

1. Ouvrez **Run and Debug** dans la barre d’activité, ou avec `Ctrl`+`Shift`+`D`.
2. Sélectionnez **Rebuild and Debug Gateway**, puis appuyez sur **Start Debugging**.

Pour gérer plutôt manuellement le cycle de compilation et de débogage :

1. Activez les cartes de sources dans un terminal :
   - **Linux/macOS** : `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)** : `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)** : `set OUTPUT_SOURCE_MAPS=1`
2. Recompilez : `pnpm clean:dist && pnpm build`
3. Sélectionnez **Debug Gateway**, puis appuyez sur **Start Debugging**.

Définissez des points d’arrêt dans les fichiers TypeScript sous `src/` ; le débogueur les associe au JavaScript compilé grâce aux cartes de sources.

### Remarques

- **Rebuild and Debug Gateway** supprime `/dist` et exécute une compilation complète avec `pnpm build` et les cartes de sources à chaque lancement.
- **Debug Gateway** peut démarrer et s’arrêter sans affecter `/dist`, mais vous devez gérer le cycle de compilation dans un terminal distinct.
- Modifiez les `args` de `launch.json` pour déboguer d’autres sous-commandes de la CLI.
- Pour utiliser la CLI compilée pour d’autres tâches, par exemple `dashboard --no-open` si votre session de débogage génère un nouveau jeton d’authentification, exécutez-la depuis un autre terminal : `node ./openclaw.mjs` ou avec un alias tel que `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Pages connexes

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
