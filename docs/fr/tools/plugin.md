---
read_when:
    - Installation ou configuration des plugins
    - Comprendre les règles de découverte et de chargement des Plugin
    - Utiliser des bundles de plugins compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:40:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins étend OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, skills, parole, transcription en temps réel, voix en temps
réel, compréhension des médias, génération d’images, génération vidéo, récupération web, recherche
web, et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes**. La plupart des plugins externes sont publiés et découverts via
[ClawHub](/fr/tools/clawhub). Npm reste pris en charge pour les installations directes et pour un
ensemble temporaire de packages de plugins détenus par OpenClaw pendant la finalisation de cette migration.

## Démarrage rapide

Pour des exemples prêts à copier-coller d’installation, de liste, de désinstallation, de mise à jour et de publication, consultez
[Gérer les plugins](/fr/plugins/manage-plugins).

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configurez ensuite sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>

  <Step title="Gestion native du chat">
    Dans un Gateway en cours d’exécution, les commandes réservées au propriétaire `/plugins enable` et `/plugins disable`
    déclenchent le rechargeur de configuration du Gateway. Le Gateway recharge en cours de processus
    les surfaces d’exécution des plugins, et les nouveaux tours d’agent reconstruisent leur liste d’outils depuis le
    registre actualisé. `/plugins install` modifie le code source du plugin, le
    Gateway demande donc un redémarrage au lieu de prétendre que le processus actuel peut
    recharger en toute sécurité des modules déjà importés.

  </Step>

  <Step title="Vérifier le plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Utilisez `--runtime` lorsque vous devez prouver les outils, services, méthodes gateway,
    hooks ou commandes CLI détenues par le plugin qui sont enregistrés. Un simple `inspect` est une vérification à froid
    du manifeste/registre et évite intentionnellement d’importer l’exécution du plugin.

  </Step>
</Steps>

Si vous préférez un contrôle natif du chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local,
`clawhub:<pkg>` explicite, `npm:<pkg>` explicite, `git:<repo>` explicite, ou spécification de package nue
via npm.

Si la configuration est invalide, l’installation échoue normalement de manière fermée et vous renvoie vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin restreint de réinstallation de plugin groupé
pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.
Pendant le démarrage du Gateway, une configuration de plugin invalide échoue de manière fermée comme toute autre configuration invalide.
Exécutez `openclaw doctor --fix` pour mettre en quarantaine la mauvaise configuration de plugin en
désactivant cette entrée de plugin et en supprimant sa charge utile de configuration invalide ; la sauvegarde normale
de la configuration conserve les valeurs précédentes.
Lorsqu’une configuration de canal référence un plugin qui n’est plus découvrable, mais que le même id de plugin obsolète
reste dans la configuration de plugin ou les enregistrements d’installation, le démarrage du Gateway
journalise des avertissements et ignore ce canal au lieu de bloquer tous les autres canaux.
Exécutez `openclaw doctor --fix` pour supprimer les entrées de canal/plugin obsolètes ; les clés de canal inconnues
sans preuve de plugin obsolète échouent toujours à la validation afin que les fautes de frappe restent
visibles.
Si `plugins.enabled: false` est défini, les références de plugins obsolètes sont traitées comme inertes :
le démarrage du Gateway ignore le travail de découverte/chargement des plugins et `openclaw doctor` préserve
la configuration de plugin désactivée au lieu de la supprimer automatiquement. Réactivez les plugins avant
d’exécuter le nettoyage doctor si vous voulez supprimer les ids de plugins obsolètes.

L’installation des dépendances de plugins ne se produit que pendant les flux explicites d’installation/mise à jour ou
de réparation doctor. Le démarrage du Gateway, le rechargement de configuration et l’inspection d’exécution
n’exécutent pas de gestionnaires de packages et ne réparent pas les arbres de dépendances. Les plugins locaux doivent déjà
avoir leurs dépendances installées, tandis que les plugins npm, git et ClawHub sont
installés sous les racines de plugins gérées par OpenClaw. Les dépendances npm peuvent être hissées
dans la racine npm gérée par OpenClaw ; l’installation/mise à jour analyse cette racine gérée avant
l’approbation et la désinstallation supprime les packages gérés par npm via npm. Les plugins externes
et les chemins de chargement personnalisés doivent toujours être installés via `openclaw plugins install`.
Utilisez `openclaw plugins list --json` pour voir le `dependencyStatus` statique de chaque
plugin visible sans importer de code d’exécution ni réparer les dépendances.
Consultez [Résolution des dépendances de plugins](/fr/plugins/dependency-resolution) pour le
cycle de vie au moment de l’installation.

Pour les installations npm, les sélecteurs mutables tels que `latest` ou une dist-tag sont résolus
avant l’installation puis épinglés à la version vérifiée exacte dans la racine npm
gérée par OpenClaw. Une fois npm terminé, OpenClaw vérifie que l’entrée
`package-lock.json` installée correspond toujours à la version et à l’intégrité résolues. Si
npm écrit des métadonnées de package différentes, l’installation échoue et le package géré
est annulé au lieu d’accepter un artefact de plugin différent.

Les checkouts source sont des workspaces pnpm. Si vous clonez OpenClaw pour modifier des plugins groupés,
exécutez `pnpm install` ; OpenClaw charge ensuite les plugins groupés depuis
`extensions/<id>` afin que les modifications et dépendances locales au package soient utilisées directement.
Les installations racine npm simples sont destinées à OpenClaw packagé, pas au développement
depuis un checkout source.

## Types de plugins

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                     | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module d’exécution ; s’exécute en processus | Plugins officiels, packages npm communautaires         |
| **Bundle** | Mise en page compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de plugins](/fr/plugins/bundles) pour les détails des bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview).

## Points d’entrée de package

Les packages npm de plugins natifs doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester dans le répertoire du package et se résoudre en un fichier
d’exécution lisible, ou en un fichier source TypeScript avec un homologue JavaScript construit
déduit, comme `src/index.ts` vers `dist/index.js`.
Les installations packagées doivent livrer cette sortie d’exécution JavaScript. Le repli vers la source TypeScript
est destiné aux checkouts source et aux chemins de développement locaux, pas aux
packages npm installés dans la racine de plugins gérée par OpenClaw.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers d’exécution publiés ne se trouvent pas aux
mêmes chemins que les entrées source. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Les listes incompatibles font échouer l’installation et
la découverte de plugins au lieu de revenir silencieusement aux chemins source. Si vous
publiez aussi `openclaw.setupEntry`, utilisez `openclaw.runtimeSetupEntry` pour son homologue
JavaScript construit ; ce fichier est requis lorsqu’il est déclaré.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugins officiels

### Packages npm détenus par OpenClaw pendant la migration

ClawHub est le chemin de distribution principal pour la plupart des plugins. Les versions packagées actuelles
d’OpenClaw incluent déjà de nombreux plugins officiels, ils n’ont donc pas besoin
d’installations npm séparées dans les configurations normales. Jusqu’à ce que chaque plugin détenu par OpenClaw ait
migré vers ClawHub, OpenClaw publie encore certains packages de plugins `@openclaw/*` sur
npm pour les installations anciennes/personnalisées et les workflows npm directs.

Si npm signale qu’un package de plugin `@openclaw/*` est obsolète, cette version de package
provient d’un ancien train de packages externe. Utilisez le plugin groupé de la version actuelle
d’OpenClaw ou un checkout local jusqu’à la publication d’un package npm plus récent.

| Plugin          | Package                    | Docs                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/fr/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/fr/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/fr/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/fr/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/fr/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/fr/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fr/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/fr/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/fr/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/fr/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/fr/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/fr/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/fr/plugins/zalouser)         |

### Core (livré avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` — recherche de mémoire groupée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme adossée à LanceDB avec rappel/capture automatique (définissez `plugins.slots.memory = "memory-lancedb"`)

    Consultez [Memory LanceDB](/fr/plugins/memory-lancedb) pour la configuration
    d’embeddings compatible OpenAI, des exemples Ollama, les limites de rappel et le dépannage.

  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autre">
    - `browser` — plugin de navigateur groupé pour l’outil de navigateur, la CLI `openclaw browser`, la méthode gateway `browser.request`, l’exécution du navigateur et le service de contrôle de navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont VS Code Copilot Proxy (désactivé par défaut)

  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Consultez [Plugins communautaires](/fr/plugins/community).

## Configuration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Champ            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Bascule principale (par défaut : `true`)                  |
| `allow`          | Liste d’autorisation des Plugin (facultative)             |
| `deny`           | Liste de refus des Plugin (facultative ; le refus prime)  |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs d’emplacements exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + configuration par Plugin                       |

`plugins.allow` est exclusif. Lorsqu’il n’est pas vide, seuls les plugins listés peuvent être chargés
ou exposer des outils, même si `tools.allow` contient `"*"` ou le nom spécifique d’un outil
appartenant à un Plugin. Si une liste d’autorisation d’outils référence des outils de Plugin, ajoutez les ids des plugins propriétaires
à `plugins.allow` ou supprimez `plugins.allow` ; `openclaw doctor` avertit à propos de cette
forme.

Les changements de configuration effectués via `/plugins enable` ou `/plugins disable` déclenchent un
rechargement en cours de processus des plugins du Gateway. Les nouveaux tours d’agent reconstruisent leur liste d’outils depuis
le registre de plugins actualisé. Les opérations qui modifient la source, comme l’installation,
la mise à jour et la désinstallation, redémarrent toujours le processus Gateway, car les modules de Plugin déjà importés
ne peuvent pas être remplacés sur place en toute sécurité.

`openclaw plugins list` est un instantané local du registre et de la configuration des plugins. Un Plugin
`enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le
Plugin à participer. Cela ne prouve pas qu’un Gateway distant déjà en cours d’exécution
a été rechargé ou redémarré avec le même code de Plugin. Sur les configurations VPS/conteneur
avec des processus d’enveloppe, envoyez les redémarrages ou les écritures déclenchant un rechargement au véritable processus
`openclaw gateway run`, ou utilisez `openclaw gateway restart` sur le
Gateway en cours d’exécution lorsque le rechargement signale un échec.

<Accordion title="États de Plugin : désactivé, manquant ou invalide">
  - **Désactivé** : le Plugin existe, mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un id de Plugin que la découverte n’a pas trouvé.
  - **Invalide** : le Plugin existe, mais sa configuration ne correspond pas au schéma déclaré. Le démarrage du Gateway ignore uniquement ce Plugin ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée invalide en la désactivant et en supprimant sa charge utile de configuration.

</Accordion>

## Découverte et précédence

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites vers un fichier ou un répertoire. Les chemins qui pointent
    vers les propres répertoires de plugins groupés empaquetés d’OpenClaw sont ignorés ;
    exécutez `openclaw doctor --fix` pour supprimer ces alias obsolètes.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins groupés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

Les installations empaquetées et les images Docker résolvent normalement les plugins groupés depuis l’arborescence
`dist/extensions` compilée. Si un répertoire source de Plugin groupé est
monté par liaison sur le chemin source empaqueté correspondant, par exemple
`/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté
comme une superposition de source groupée et le découvre avant le paquet
`/app/dist/extensions/synology-chat`. Cela permet aux boucles de conteneur de mainteneur
de fonctionner sans rebasculer chaque Plugin groupé vers la source TypeScript.
Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les paquets dist empaquetés
même lorsque des montages de superposition source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins et ignore le travail de découverte/chargement des plugins
- `plugins.deny` prime toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les plugins issus de l’espace de travail sont **désactivés par défaut** (doivent être activés explicitement)
- Les plugins groupés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du Plugin sélectionné pour cet emplacement
- Certains plugins groupés à activation explicite sont activés automatiquement lorsque la configuration nomme une
  surface appartenant à un Plugin, comme une référence de modèle fournisseur, une configuration de canal ou un runtime
  de harnais
- La configuration de Plugin obsolète est conservée tant que `plugins.enabled: false` est actif ;
  réactivez les plugins avant d’exécuter le nettoyage doctor si vous voulez supprimer les ids obsolètes
- Les routes Codex de la famille OpenAI conservent des frontières de Plugin séparées :
  `openai-codex/*` appartient au Plugin OpenAI, tandis que le Plugin app-server Codex groupé
  est sélectionné par `agentRuntime.id: "codex"` ou par les anciennes références de modèle
  `codex/*`

## Dépannage des hooks runtime

Si un Plugin apparaît dans `plugins list` mais que les effets de bord ou hooks de `register(api)`
ne s’exécutent pas dans le trafic de chat en direct, vérifiez d’abord les points suivants :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL
  du Gateway actif, le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après des changements d’installation/configuration/code de Plugin. Dans les conteneurs
  d’enveloppe, le PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --runtime --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non groupés tels que `llm_input`,
  `llm_output`, `before_agent_finalize` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la résolution du modèle
  pour les tours d’agent ; `llm_output` s’exécute seulement après qu’une tentative de modèle
  a produit une sortie d’assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les
  surfaces session/statut du Gateway et, lors du débogage des charges utiles de fournisseur, démarrez
  le Gateway avec `--raw-stream --raw-stream-path <path>`.

### Configuration lente des outils de Plugin

Si les tours d’agent semblent se bloquer pendant la préparation des outils, activez la journalisation de trace et
recherchez les lignes de timing des fabriques d’outils de Plugin :

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Recherchez :

```text
[trace:plugin-tools] factory timings ...
```

Le résumé liste le temps total des fabriques et les fabriques d’outils de Plugin les plus lentes,
avec l’id du Plugin, les noms d’outils déclarés, la forme du résultat et si l’outil est
facultatif. Les lignes lentes sont promues en avertissements lorsqu’une seule fabrique prend au
moins 1 s ou que la préparation totale des fabriques d’outils de Plugin prend au moins 5 s.

OpenClaw met en cache les résultats réussis des fabriques d’outils de Plugin pour les résolutions répétées
avec le même contexte de requête effectif. La clé de cache inclut la configuration
runtime effective, l’espace de travail, les ids d’agent/session, la politique de bac à sable, les paramètres du navigateur,
le contexte de livraison, l’identité du demandeur et l’état de propriété, de sorte que les fabriques qui
dépendent de ces champs fiables sont réexécutées lorsque le contexte change.

Si un Plugin domine le timing, inspectez ses enregistrements runtime :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Puis mettez à jour, réinstallez ou désactivez ce Plugin. Les auteurs de Plugin doivent déplacer
le chargement coûteux des dépendances derrière le chemin d’exécution de l’outil au lieu de le faire
dans la fabrique d’outils.

### Propriété de canal ou d’outil en double

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Cela signifie que plusieurs plugins activés essaient de posséder le même canal,
flux de configuration ou nom d’outil. La cause la plus courante est un Plugin de canal externe
installé à côté d’un Plugin groupé qui fournit désormais le même id de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque Plugin activé
  et son origine.
- Exécutez `openclaw plugins inspect <id> --runtime --json` pour chaque Plugin suspect et
  comparez `channels`, `channelConfigs`, `tools` et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après l’installation ou la suppression
  de paquets de Plugin afin que les métadonnées persistantes reflètent l’installation actuelle.
- Redémarrez le Gateway après des changements d’installation, de registre ou de configuration.

Options de correction :

- Si un Plugin remplace intentionnellement un autre pour le même id de canal, le
  Plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec
  l’id du Plugin de priorité inférieure. Consultez [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez un côté avec
  `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation de Plugin
  obsolète.
- Si vous avez explicitement activé les deux plugins, OpenClaw conserve cette demande et
  signale le conflit. Choisissez un propriétaire pour le canal ou renommez les outils appartenant au Plugin
  afin que la surface runtime soit non ambiguë.

## Emplacements de Plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Emplacement     | Ce qu’il contrôle      | Par défaut          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin de mémoire active | `memory-core`       |
| `contextEngine` | Moteur de contexte actif | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins intégrés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs de synthèse vocale intégrés et le plugin
de navigateur intégré). D’autres plugins intégrés nécessitent encore `openclaw plugins enable <id>`.

`--force` remplace sur place un plugin installé ou un pack de hooks existant. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des
plugins npm suivis. Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du
plugin installé à cette liste d’autorisation avant de l’activer. Si le même id de plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée de refus obsolète afin que
l’installation explicite puisse être chargée immédiatement après redémarrage.

OpenClaw conserve un registre local persistant des plugins comme modèle de lecture à froid pour
l’inventaire des plugins, la propriété des contributions et la planification du démarrage. Les flux
d’installation, de mise à jour, de désinstallation, d’activation et de désactivation actualisent ce registre après avoir modifié
l’état des plugins. Le même fichier `plugins/installs.json` conserve les métadonnées d’installation durables dans
`installRecords` au niveau supérieur et les métadonnées de manifeste reconstructibles dans `plugins`. Si
le registre est manquant, obsolète ou invalide, `openclaw plugins registry
--refresh` reconstruit sa vue de manifeste à partir des enregistrements d’installation, de la politique de configuration et
des métadonnées de manifeste/package sans charger les modules d’exécution du plugin.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version replace une installation épinglée exacte sur
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans télécharger, réinstaller ni réécrire la configuration.
Lorsque `openclaw update` s’exécute sur le canal beta, les enregistrements de plugins npm et ClawHub
sur la ligne par défaut essaient d’abord `@beta`, puis reviennent à default/latest lorsqu’aucune version beta
du plugin n’existe. Les versions exactes et les tags explicites restent épinglés.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est une dérogation de dernier recours pour les faux
positifs du scanner de code dangereux intégré. Elle permet aux installations de plugins
et aux mises à jour de plugins de continuer malgré des résultats `critical` intégrés, mais elle ne
contourne toujours pas les blocages de politique `before_install` du plugin ni le blocage en cas d’échec d’analyse.
Les analyses d’installation ignorent les fichiers et répertoires de test courants comme `tests/`,
`__tests__/`, `*.test.*` et `*.spec.*` afin d’éviter de bloquer les mocks de test packagés ;
les points d’entrée d’exécution déclarés du plugin sont toujours analysés, même s’ils utilisent l’un de
ces noms.

Ce flag CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills
adossées au Gateway utilisent à la place la dérogation de requête correspondante `dangerouslyForceUnsafeInstall`,
tandis que `openclaw skills install` reste le flux séparé de téléchargement/installation de Skills
ClawHub.

Si un plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse, ouvrez le
tableau de bord ClawHub ou exécutez `clawhub package rescan <name>` pour demander à ClawHub de le vérifier
à nouveau. `--dangerously-force-unsafe-install` n’affecte que les installations sur votre propre
machine ; cela ne demande pas à ClawHub de réanalyser le plugin ni de rendre publique une version
bloquée.

Les bundles compatibles participent au même flux de liste/inspection/activation/désactivation
des plugins. La prise en charge actuelle à l’exécution inclut les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers`
déclarées par manifeste, les command-skills Cursor et les répertoires de hooks Codex
compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées de serveurs MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à un bundle.

Les sources marketplace peuvent être un nom de marketplace connu de Claude depuis
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub
ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester à l’intérieur du
dépôt marketplace cloné et utiliser uniquement des sources à chemin relatif.

Consultez la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Présentation de l’API de Plugin

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux plugins doivent
utiliser `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du
plugin. Le chargeur revient encore à `activate(api)` pour les anciens plugins,
mais les plugins intégrés et les nouveaux plugins externes doivent traiter `register` comme le
contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation à l’exécution. Enregistre les outils, hooks, services, commandes, routes et autres effets de bord actifs.                              |
| `discovery`     | Découverte de capacités en lecture seule. Enregistre les fournisseurs et les métadonnées ; le code d’entrée du plugin approuvé peut se charger, mais ignore les effets de bord actifs. |
| `setup-only`    | Chargement des métadonnées de configuration du canal via une entrée de configuration légère.                                                                |
| `setup-runtime` | Chargement de configuration du canal qui nécessite aussi l’entrée d’exécution.                                                                         |
| `cli-metadata`  | Collecte des métadonnées de commande CLI uniquement.                                                                                            |

Les entrées de plugin qui ouvrent des sockets, des bases de données, des workers en arrière-plan ou des clients
longue durée doivent protéger ces effets de bord avec `api.registrationMode === "full"`.
Les chargements de découverte sont mis en cache séparément des chargements d’activation et ne remplacent pas
le registre Gateway en cours d’exécution. La découverte est non activante, mais pas sans import :
OpenClaw peut évaluer l’entrée de plugin approuvée ou le module de plugin de canal pour construire
l’instantané. Gardez les niveaux supérieurs de module légers et sans effet de bord, et déplacez
les clients réseau, sous-processus, écouteurs, lectures d’identifiants et démarrages de services
derrière les chemins d’exécution complète.

Méthodes d’enregistrement courantes :

| Méthode                                  | Ce qu’elle enregistre           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM)        |
| `registerChannel`                       | Canal de discussion                |
| `registerTool`                          | Outil d’agent                  |
| `registerHook` / `on(...)`              | Hooks de cycle de vie             |
| `registerSpeechProvider`                | Synthèse vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming               |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex       |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio        |
| `registerImageGenerationProvider`       | Génération d’image            |
| `registerMusicGenerationProvider`       | Génération de musique            |
| `registerVideoGenerationProvider`       | Génération vidéo            |
| `registerWebFetchProvider`              | Fournisseur de récupération / extraction web |
| `registerWebSearchProvider`             | Recherche web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Commandes CLI                |
| `registerContextEngine`                 | Moteur de contexte              |
| `registerService`                       | Service en arrière-plan          |

Comportement de protection des hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Le serveur d’application Codex natif renvoie les événements d’outils natifs Codex vers cette
surface de hooks. Les plugins peuvent bloquer les outils natifs Codex via `before_tool_call`,
observer les résultats via `after_tool_call` et participer aux approbations
`PermissionRequest` de Codex. Le bridge ne réécrit pas encore les arguments d’outils natifs Codex.
La frontière exacte de prise en charge de l’exécution Codex se trouve dans le
[contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [présentation du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Connexe

- [Créer des plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajoutez des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes de tiers
