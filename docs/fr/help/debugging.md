---
read_when:
    - Vous devez inspecter la sortie brute du modèle afin de détecter toute divulgation du raisonnement.
    - Vous souhaitez exécuter le Gateway en mode surveillance pendant vos itérations
    - Vous avez besoin d’un workflow de débogage reproductible
summary: 'Outils de débogage : mode surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-07-12T15:24:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Outils d’aide au débogage de la sortie en streaming, des itérations du Gateway et du profilage du démarrage.

## Remplacements de débogage à l’exécution

`/debug` définit des remplacements de configuration **uniquement à l’exécution** (en mémoire, pas sur disque). Désactivé par défaut ; activez-le avec `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface tous les remplacements et rétablit la configuration sur disque.

## Sortie de trace de session

`/trace` affiche les lignes de trace/débogage appartenant au Plugin pour une session, sans activer le mode entièrement détaillé. Utilisez-le pour les diagnostics de Plugin, tels que les résumés de débogage d’Active Memory ; utilisez `/verbose` pour la sortie normale d’état/des outils.

```text
/trace
/trace on
/trace off
```

## Trace du cycle de vie des Plugins

Définissez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` pour obtenir une ventilation phase par phase des métadonnées des Plugins, de la découverte, du registre, du miroir d’exécution, des modifications de configuration et des opérations d’actualisation. La sortie est écrite sur stderr, afin que la sortie JSON des commandes reste analysable.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="lecture de la configuration" ms=6.83 status=ok command="installation"
[plugins:lifecycle] phase="sélection de l’emplacement" ms=94.31 status=ok command="installation" pluginId="tokenjuice"
[plugins:lifecycle] phase="actualisation du registre" ms=51.56 status=ok command="installation" reason="source modifiée"
```

Utilisez ceci avant de recourir à un profileur de processeur. Depuis une copie de travail des sources, mesurez l’environnement d’exécution compilé avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...` mesure également la surcharge du lanceur de sources.

## Profilage du démarrage et des commandes de la CLI

Tests de performance de démarrage intégrés au dépôt :

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Pour un profilage ponctuel via le lanceur de sources normal, définissez `OPENCLAW_RUN_NODE_CPU_PROF_DIR` :

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Le lanceur de sources ajoute les options de profilage du processeur de Node et écrit un fichier `.cpuprofile` pour la commande. Utilisez ceci avant d’ajouter une instrumentation temporaire au code de la commande.

Pour les blocages au démarrage qui semblent liés à des opérations synchrones du système de fichiers ou du chargeur de modules, ajoutez l’option de trace des E/S synchrones de Node via le lanceur de sources :

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laisse cette option désactivée par défaut pour le processus enfant surveillé du Gateway ; définissez `OPENCLAW_TRACE_SYNC_IO=1` si vous souhaitez également obtenir la sortie de trace des E/S synchrones en mode surveillance.

## Mode surveillance du Gateway

```bash
pnpm gateway:watch
```

Par défaut, cette commande démarre ou redémarre une session tmux nommée `openclaw-gateway-watch-<profile>` (par exemple `openclaw-gateway-watch-main`), avec un suffixe de port tel que `openclaw-gateway-watch-dev-19001` ajouté uniquement lorsque `OPENCLAW_GATEWAY_PORT` diffère du port par défaut `18789`. Elle s’attache automatiquement depuis les terminaux interactifs ; les shells non interactifs, la CI et les appels d’exécution d’agents restent détachés et affichent à la place les instructions de connexion :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le volet tmux exécute directement le processus de surveillance :

```bash
node scripts/watch-node.mjs gateway --force
```

Arrêtez un service Gateway installé avant de surveiller le même port :

```bash
pnpm openclaw gateway stop
```

L’option `--force` du processus de surveillance libère le port actuellement utilisé, mais ne désactive pas un service supervisé. Un service launchd, systemd ou Scheduled Task pourrait sinon redémarrer et remplacer le Gateway surveillé.

Mode premier plan sans tmux :

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

L’enveloppe de surveillance consomme `--benchmark` avant d’appeler le Gateway et écrit un fichier V8 `.cpuprofile` à chaque arrêt d’un processus enfant du Gateway sous `.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le Gateway surveillé pour finaliser le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>` : écrit les profils à un autre emplacement.
- `--benchmark-no-force` : ignore le nettoyage de port effectué par défaut avec `--force` et échoue immédiatement si le port du Gateway est déjà utilisé.

Le mode de test de performance supprime par défaut le bruit des traces d’E/S synchrones. Définissez `OPENCLAW_TRACE_SYNC_IO=1` avec `--benchmark` pour obtenir à la fois les profils du processeur et les traces de pile des E/S synchrones ; en mode de test de performance, ces blocs de trace sont écrits dans `gateway-watch-output.log` sous le répertoire des tests de performance (et filtrés dans le volet du terminal), tandis que les journaux normaux du Gateway restent visibles.

L’enveloppe tmux transmet au volet les sélecteurs d’exécution courants non secrets, notamment `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez les identifiants des fournisseurs dans votre profil/configuration habituel, ou utilisez le mode premier plan direct pour des secrets éphémères ponctuels.

Si le Gateway surveillé s’arrête pendant le démarrage, le processus de surveillance exécute une fois `openclaw doctor --fix --non-interactive`, puis redémarre le processus enfant du Gateway. Définissez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` pour voir l’échec de démarrage d’origine sans la passe de réparation réservée au développement.

Le volet tmux géré utilise par défaut des journaux colorés pour le Gateway ; définissez `FORCE_COLOR=0` lors du démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le processus de surveillance redémarre lors de modifications apportées aux fichiers pertinents pour la compilation sous `src/`, aux fichiers sources des extensions, aux métadonnées `package.json` et `openclaw.plugin.json` des extensions, à `tsconfig.json`, à `package.json` et à `tsdown.config.ts`. Les modifications des métadonnées d’extension redémarrent le Gateway sans forcer une recompilation ; les modifications des sources et de la configuration recompilent toujours `dist` au préalable.

Ajoutez les options de la CLI du Gateway après `gateway:watch` afin qu’elles soient transmises à chaque redémarrage. La réexécution de la même commande de surveillance recrée le volet tmux nommé ; le processus de surveillance direct utilise un verrou garantissant une seule instance, de sorte que les processus parents de surveillance en double sont remplacés plutôt que de s’accumuler.

## Profil de développement + Gateway de développement (--dev)

Deux options `--dev` **distinctes** :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et définit par défaut le port du Gateway sur `19001` (les ports dérivés sont décalés en conséquence).
- **`gateway --dev` :** demande au Gateway de créer automatiquement une configuration et un espace de travail par défaut s’ils sont absents (et d’ignorer l’amorçage).

Flux recommandé (profil de développement + amorçage de développement) :

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
   - `OPENCLAW_GATEWAY_PORT=19001` (les ports du navigateur/canevas sont décalés en conséquence)

2. **Amorçage de développement** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, liaison à l’interface de bouclage).
   - Définit `agents.defaults.workspace` sur l’espace de travail de développement et `agents.defaults.skipBootstrap=true`.
   - Initialise les fichiers de l’espace de travail s’ils sont absents : `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identité par défaut : **C3-PO** (droïde de protocole).
   - `pnpm gateway:dev` définit également `OPENCLAW_SKIP_CHANNELS=1` pour ignorer les fournisseurs de canaux.

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est une option **globale** de profil et certains lanceurs l’interceptent. Si vous devez l’indiquer explicitement, utilisez la forme avec variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail de développement (déplacé dans la corbeille, et non supprimé), puis recrée la configuration de développement par défaut.

<Tip>
Si un Gateway hors développement est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du flux brut

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage/formatage. C’est le meilleur moyen de déterminer si le raisonnement arrive sous forme de deltas de texte brut (ou de blocs de réflexion distincts).

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

## Remarques de sécurité

- Les journaux du flux brut peuvent inclure l’intégralité des invites, la sortie des outils et les données utilisateur.
- Conservez les journaux localement et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les informations personnelles identifiables.

## Débogage dans VSCode

Les mappages de sources sont nécessaires, car la compilation applique un hachage aux noms des fichiers générés. Le fichier `launch.json` inclus cible le service Gateway :

1. **Rebuild and Debug Gateway** - supprime `/dist` et recompile avec le débogage activé avant de démarrer le Gateway.
2. **Debug Gateway** - débogue une compilation existante sans modifier `/dist`.

### Configuration

1. Ouvrez **Run and Debug** (barre d’activité ou `Ctrl`+`Shift`+`D`).
2. Sélectionnez **Rebuild and Debug Gateway** et appuyez sur **Start Debugging**.

Pour gérer plutôt manuellement le cycle compilation/débogage :

1. Activez les mappages de sources dans un terminal :
   - **Linux/macOS** : `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)** : `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)** : `set OUTPUT_SOURCE_MAPS=1`
2. Recompilez : `pnpm clean:dist && pnpm build`
3. Sélectionnez **Debug Gateway** et appuyez sur **Start Debugging**.

Définissez des points d’arrêt dans les fichiers TypeScript sous `src/` ; le débogueur les associe au JavaScript compilé grâce aux mappages de sources.

### Remarques

- **Rebuild and Debug Gateway** supprime `/dist` et exécute une compilation complète avec `pnpm build` et les mappages de sources à chaque lancement.
- **Debug Gateway** peut démarrer/s’arrêter sans affecter `/dist`, mais vous gérez le cycle de compilation dans un terminal distinct.
- Modifiez les `args` de `launch.json` pour déboguer d’autres sous-commandes de la CLI.
- Pour utiliser la CLI compilée pour d’autres tâches (par exemple `dashboard --no-open` si votre session de débogage génère un nouveau jeton d’authentification), exécutez-la depuis un autre terminal : `node ./openclaw.mjs` ou un alias tel que `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Ressources associées

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
