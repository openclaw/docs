---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter les fuites de raisonnement
    - Vous souhaitez exécuter le Gateway en mode surveillance pendant vos itérations
    - Vous avez besoin d’un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode de surveillance, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-05-03T21:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Aides au débogage pour la sortie en flux continu, surtout lorsqu’un fournisseur mêle le raisonnement au texte normal.

## Surcharges de débogage à l’exécution

Utilisez `/debug` dans la conversation pour définir des surcharges de configuration **uniquement à l’exécution** (en mémoire, pas sur le disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez activer ou désactiver des paramètres peu visibles sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface toutes les surcharges et revient à la configuration sur disque.

## Sortie de trace de session

Utilisez `/trace` lorsque vous voulez voir les lignes de trace/débogage propres au Plugin dans une session
sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Utilisez `/trace` pour les diagnostics de Plugin, comme les résumés de débogage Active Memory.
Continuez à utiliser `/verbose` pour la sortie verbeuse normale d’état/d’outil, et continuez à utiliser
`/debug` pour les surcharges de configuration uniquement à l’exécution.

## Trace du cycle de vie du Plugin

Utilisez `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` lorsque les commandes du cycle de vie du Plugin semblent lentes
et que vous avez besoin d’une décomposition intégrée par phase pour les métadonnées du Plugin, la découverte, le registre,
le miroir d’exécution, la mutation de configuration et le travail d’actualisation. La trace est activable sur demande et écrit
sur stderr, afin que la sortie JSON de la commande reste analysable.

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

Utilisez cela pour examiner le cycle de vie du Plugin avant de recourir à un profileur CPU.
Si la commande s’exécute depuis une extraction source, préférez mesurer l’environnement d’exécution compilé
avec `node dist/entry.js ...` après `pnpm build` ; `pnpm openclaw ...`
mesure aussi le surcoût du lanceur source.

## Démarrage de la CLI et profilage des commandes

Utilisez le banc d’essai de démarrage intégré au dépôt lorsqu’une commande semble lente :

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

## Mode de surveillance du Gateway

Pour itérer rapidement, exécutez le Gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Par défaut, cela démarre ou redémarre une session tmux nommée
`openclaw-gateway-watch-main` (ou une variante propre au profil/port telle que
`openclaw-gateway-watch-dev-19001`) et s’y attache automatiquement depuis les terminaux interactifs.
Les interpréteurs de commandes non interactifs, la CI et les appels d’exécution d’agent restent détachés et affichent
plutôt des instructions d’attachement. Attachez-vous manuellement si nécessaire :

```bash
tmux attach -t openclaw-gateway-watch-main
```

Le panneau tmux exécute le surveillant brut :

```bash
node scripts/watch-node.mjs gateway --force
```

Utilisez le mode au premier plan lorsque tmux n’est pas souhaité :

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Désactivez l’attachement automatique tout en conservant la gestion par tmux :

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilez le temps CPU du Gateway surveillé lors du débogage des points chauds de démarrage/d’exécution :

```bash
pnpm gateway:watch --benchmark
```

L’enveloppe de surveillance intercepte `--benchmark` avant d’invoquer le Gateway et écrit
un `.cpuprofile` V8 par sortie de processus enfant du Gateway sous
`.artifacts/gateway-watch-profiles/`. Arrêtez ou redémarrez le Gateway surveillé pour
vider le profil courant, puis ouvrez-le avec Chrome DevTools ou Speedscope :

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Utilisez `--benchmark-dir <path>` lorsque vous voulez placer les profils ailleurs.
Utilisez `--benchmark-no-force` lorsque vous voulez que le processus enfant mesuré ignore le
nettoyage de port `--force` par défaut et échoue rapidement si le port du Gateway est déjà
utilisé.

L’enveloppe tmux transmet au panneau les sélecteurs d’exécution courants non secrets tels que
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` et `OPENCLAW_SKIP_CHANNELS`. Placez
les identifiants des fournisseurs dans votre profil/configuration normal, ou utilisez le mode brut au premier plan
pour des secrets éphémères ponctuels.
Si le Gateway surveillé quitte pendant le démarrage, le surveillant exécute
`openclaw doctor --fix --non-interactive` une fois et redémarre le processus enfant du Gateway.
Utilisez `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` lorsque vous voulez conserver l’échec de démarrage
original sans la passe de réparation réservée au développement.
Le panneau tmux géré utilise aussi par défaut des journaux du Gateway colorés pour la lisibilité ;
définissez `FORCE_COLOR=0` au démarrage de `pnpm gateway:watch` pour désactiver la sortie ANSI.

Le surveillant redémarre sur les fichiers pertinents pour la compilation sous `src/`, les fichiers source de Plugin,
les métadonnées de Plugin `package.json` et `openclaw.plugin.json`, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées de Plugin redémarrent le
Gateway sans forcer une recompilation `tsdown` ; les changements de source et de configuration
recompilent toujours `dist` d’abord.

Ajoutez tout indicateur CLI du Gateway après `gateway:watch` et il sera transmis à
chaque redémarrage. Relancer la même commande de surveillance recrée le panneau tmux nommé, et
le surveillant brut conserve toujours son verrou de surveillant unique, de sorte que les parents de surveillant dupliqués
sont remplacés au lieu de s’accumuler.

## Profil de développement + Gateway de développement (--dev)

Utilisez le profil de développement pour isoler l’état et lancer une configuration sûre et jetable pour
le débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port du Gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` : indique au Gateway de créer automatiquement une configuration +
  un espace de travail par défaut** s’ils manquent (et d’ignorer BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (le navigateur/canevas se décale en conséquence)

2. **Amorçage de développement** (`gateway --dev`)
   - Écrit une configuration minimale si elle manque (`gateway.mode=local`, liaison en boucle locale).
   - Définit `agent.workspace` sur l’espace de travail de développement.
   - Définit `agent.skipBootstrap=true` (pas de BOOTSTRAP.md).
   - Ajoute les fichiers de l’espace de travail s’ils manquent :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde protocolaire).
   - Ignore les fournisseurs de canaux en mode développement (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` est un indicateur de profil **global** et certains lanceurs l’absorbent. Si vous devez l’expliciter, utilisez la forme avec variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail de développement (avec
`trash`, pas `rm`), puis recrée la configuration de développement par défaut.

<Tip>
Si un Gateway non destiné au développement est déjà en cours d’exécution (launchd ou systemd), arrêtez-le d’abord :

```bash
openclaw gateway stop
```

</Tip>

## Journalisation du flux brut (OpenClaw)

OpenClaw peut journaliser le **flux brut de l’assistant** avant tout filtrage/mise en forme.
C’est le meilleur moyen de voir si le raisonnement arrive sous forme de deltas en texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-la via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Surcharge facultative du chemin :

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

- Les journaux de flux brut peuvent inclure les requêtes complètes, la sortie d’outil et les données utilisateur.
- Gardez les journaux locaux et supprimez-les après le débogage.
- Si vous partagez des journaux, expurgez d’abord les secrets et les données personnelles identifiables.

## Voir aussi

- [Dépannage](/fr/help/troubleshooting)
- [FAQ](/fr/help/faq)
