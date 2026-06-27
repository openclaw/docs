---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter les fuites de raisonnement
    - Vous voulez exécuter le Gateway en mode de surveillance pendant vos itérations
    - Vous avez besoin d’un workflow de débogage reproductible
summary: 'Outils de débogage : mode surveillance, flux de modèle bruts et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-06-27T17:35:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Assistants de débogage pour la sortie en streaming, en particulier lorsqu’un fournisseur mélange le raisonnement au texte normal.

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

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage appartenant au Plugin dans une session
sans activer le mode détaillé complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de Plugin comme les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie détaillée normale d’état/outils, et continuez à utiliser
`/debug` pour les remplacements de configuration uniquement à l’exécution.

## Trace du cycle de vie du Plugin

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes du cycle de vie du Plugin semblent lentes
et que vous avez besoin d’une ventilation intégrée des phases pour les métadonnées de Plugin, la découverte, le registre,
le miroir d’exécution, la mutation de configuration et le travail d’actualisation. La trace est opt-in et écrit
dans stderr, donc la sortie JSON de la commande reste analysable.

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

Utilisez ceci pour l’investigation du cycle de vie du Plugin avant de recourir à un profileur CPU.
Si la commande s’exécute depuis une extraction source, préférez mesurer le runtime compilé
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Profilage du démarrage et des commandes CLI

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

Pour les blocages de démarrage qui ressemblent à un travail synchrone du système de fichiers ou du chargeur de modules,
ajoutez l’indicateur de trace d’E/S synchrones de Node via le lanceur source :

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laisse cet indicateur désactivé par défaut pour l’enfant Gateway
surveillé. Définissez `OPENCLAW_TRACE_SYNC_IO=1` lorsque vous voulez explicitement la sortie de trace d’E/S synchrones Node
en mode surveillance.

## Mode surveillance du Gateway

Pour une itération rapide, exécutez le Gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port comme
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les shells non interactifs, CI et appels d’exécution d’agents restent détachés et impriment plutôt les
instructions d’attachement. Attachez-vous manuellement si nécessaire :

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
# ou
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

L’enveloppe de surveillance consomme `--benchmark` avant d’appeler le Gateway et écrit
un `.cpuprofile` V8 par sortie d’enfant Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le gateway surveillé pour
vider le profil actuel, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.
Utilisez `--benchmark-no-force` lorsque vous voulez que l’enfant benchmarké ignore le nettoyage de port
`--force` par défaut et échoue rapidement si le port Gateway est déjà utilisé.
Le mode benchmark supprime par défaut le spam de trace d’E/S synchrones. Définissez
`OPENCLAW_TRACE_SYNC_IO=1` avec `--benchmark` lorsque vous voulez explicitement à la fois des profils CPU
et des traces de pile d’E/S synchrones Node. En mode benchmark, ces blocs de trace
sont écrits dans `gateway-watch-output.log` sous le répertoire de benchmark et
filtrés du volet de terminal ; les journaux Gateway normaux restent visibles.

L’enveloppe tmux transporte les sélecteurs runtime non secrets courants comme
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS` dans le volet. Placez
les identifiants de fournisseur dans votre profil/configuration normale, ou utilisez le mode premier plan brut
pour des secrets éphémères ponctuels.
Si le Gateway surveillé quitte pendant le démarrage, le surveillant exécute
`openclaw doctor --fix --non-interactive` une fois et redémarre l’enfant Gateway.
Utilisez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` lorsque vous voulez l’échec de démarrage original
sans passe de réparation réservée au développement.
Le volet tmux géré utilise aussi par défaut des journaux Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` au démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le surveillant redémarre sur les fichiers pertinents pour la compilation sous `src/`, les fichiers source d’extension,
les métadonnées `package.json` et `openclaw.plugin.json` d’extension, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les modifications de métadonnées d’extension redémarrent le
gateway sans forcer une recompilation `tsdown` ; les modifications de source et de configuration
recompilent toujours `dist` d’abord.

Ajoutez les indicateurs CLI de gateway après `gateway:watch` et ils seront transmis à
chaque redémarrage. Réexécuter la même commande de surveillance recrée le volet tmux nommé, et
le surveillant brut conserve toujours son verrou de surveillant unique afin que les parents de surveillant en double
soient remplacés au lieu de s’accumuler.

## Profil de développement + gateway de développement (--dev)

Utilisez le profil de développement pour isoler l’état et lancer une configuration sûre et jetable pour
le débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration + un espace de travail par défaut** s’ils manquent (et d’ignorer BOOTSTRAP.md).

Flux recommandé (profil de développement + amorçage de développement) :

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

2. **Amorçage de développement** (`gateway --dev`)
   - Écrit une configuration minimale si elle manque (`gateway.mode=local`, bind loopback).
   - Définit `agent.workspace` sur l’espace de travail de développement.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Initialise les fichiers d’espace de travail s’ils manquent :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3-PO** (droïde de protocole).
   - Ignore les fournisseurs de canaux en mode développement (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un indicateur de profil **global** et se fait absorber par certains lanceurs. Si vous devez l’écrire explicitement, utilisez la forme variable d’environnement :

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

OpenClaw peut journaliser le **flux assistant brut** avant tout filtrage/formatage.
C’est la meilleure façon de voir si le raisonnement arrive comme des deltas de texte brut
(ou comme des blocs de réflexion séparés).

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

## Journalisation des segments bruts compatibles OpenAI

Pour capturer les **segments bruts compatibles OpenAI** avant leur analyse en blocs,
activez le journaliseur de transport :

```bash
OPENCLAW_RAW_STREAM=1
```

Chemin facultatif :

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Fichier par défaut :

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Notes de sécurité

- Les journaux de flux brut peuvent inclure les prompts complets, la sortie d’outil et les données utilisateur.
- Gardez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, retirez d’abord les secrets et les informations personnelles.

## Débogage dans VSCode

Les source maps sont requises pour activer le débogage dans les IDE basés sur VSCode, car de nombreux fichiers générés finissent avec des noms hachés dans le cadre du processus de compilation. Les configurations `launch.json` incluses ciblent le service Gateway, mais peuvent être adaptées rapidement à d’autres usages :

1. **Recompiler et déboguer le Gateway** - Débogue le service Gateway après avoir créé une nouvelle compilation
2. **Déboguer le Gateway** - Débogue le service Gateway d’une compilation préexistante

### Configuration

La configuration **Recompiler et déboguer le Gateway** par défaut est complète : elle supprimera automatiquement le dossier `/dist` et recompilera le projet avec le débogage activé :

1. Ouvrez le panneau **Exécuter et déboguer** depuis la barre d’activité ou appuyez sur `Ctrl`+`Shift`+`D`
2. Dans l’IDE, assurez-vous que **Recompiler et déboguer le Gateway** est sélectionné dans la liste déroulante de configuration, puis appuyez sur le bouton **Démarrer le débogage**

Sinon, si vous préférez gérer manuellement les processus de compilation et de débogage :

1. Ouvrez un terminal et activez les source maps :
   - **Linux/macOS** : `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)** : `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)** : `set OUTPUT_SOURCE_MAPS=1`
2. Dans le même terminal, recompilez le projet : `pnpm clean:dist && pnpm build`
3. Dans l’IDE, sélectionnez l’option **Déboguer le Gateway** dans la liste déroulante de configuration **Exécuter et déboguer**, puis appuyez sur le bouton **Démarrer le débogage**

Vous pouvez maintenant définir des points d’arrêt dans vos fichiers source TypeScript (répertoire `src/`) et le débogueur associera correctement les points d’arrêt au JavaScript compilé via les source maps. Vous pourrez inspecter les variables, avancer pas à pas dans le code et examiner les piles d’appels comme prévu.

### Notes

- Si vous utilisez l’option **"Recompiler et déboguer le Gateway"**, chaque lancement du débogueur supprimera complètement le dossier `/dist` et exécutera un `pnpm build` complet avec les source maps activées avant de démarrer le Gateway
- Si vous utilisez l’option **"Déboguer le Gateway"**, les sessions de débogage peuvent être démarrées et arrêtées à tout moment sans affecter le dossier `/dist`, mais vous devez utiliser un processus de terminal séparé pour activer le débogage et gérer le cycle de compilation
- Modifiez les paramètres `launch.json` pour `args` afin de déboguer d’autres sections du projet
- Si vous devez utiliser la CLI OpenClaw compilée pour d’autres tâches (c.-à-d. `dashboard --no-open` si votre session de débogage génère un nouveau jeton d’authentification), vous pouvez l’exécuter dans un autre terminal avec `node ./openclaw.mjs` ou créer un alias shell comme `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Connexe

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
