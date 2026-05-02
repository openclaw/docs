---
read_when:
    - Installer ou configurer des plugins
    - Comprendre les règles de découverte et de chargement des Plugins
    - Travailler avec des lots Plugin compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T07:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agents, outils, skills, parole, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d’images, génération de vidéos, récupération web,
recherche web, et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes**. La plupart des plugins externes sont publiés et découverts via
[ClawHub](/fr/tools/clawhub). Npm reste pris en charge pour les installations directes et pour un
ensemble temporaire de paquets de plugins détenus par OpenClaw pendant la fin de cette migration.

## Démarrage rapide

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

  <Step title="Vérifier le plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Utilisez `--runtime` lorsque vous devez prouver les outils enregistrés, services, méthodes Gateway,
    hooks ou commandes CLI détenues par le plugin. Un `inspect` simple est une vérification à froid
    du manifeste/registre et évite intentionnellement d’importer le runtime du plugin.

  </Step>
</Steps>

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local, explicite
`clawhub:<pkg>`, explicite `npm:<pkg>`, explicite `git:<repo>`, ou spécification de paquet nue
(ClawHub d’abord, puis repli vers npm).

Si la configuration est invalide, l’installation échoue normalement de manière fermée et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de plugin groupé
pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.
Pendant le démarrage du Gateway, la configuration invalide d’un plugin est isolée à ce plugin :
le démarrage journalise le problème `plugins.entries.<id>.config`, ignore ce plugin pendant le
chargement et garde les autres plugins et canaux en ligne. Exécutez `openclaw doctor --fix`
pour mettre en quarantaine la mauvaise configuration du plugin en désactivant cette entrée de plugin et en supprimant
sa charge utile de configuration invalide ; la sauvegarde normale de configuration conserve les valeurs précédentes.
Lorsqu’une configuration de canal référence un plugin qui n’est plus découvrable mais que le même
identifiant de plugin obsolète reste dans la configuration de plugin ou les enregistrements d’installation, le démarrage du Gateway
journalise des avertissements et ignore ce canal au lieu de bloquer tous les autres canaux.
Exécutez `openclaw doctor --fix` pour supprimer les entrées canal/plugin obsolètes ; les clés
de canal inconnues sans preuve de plugin obsolète échouent toujours à la validation afin que les fautes de frappe restent
visibles.
Si `plugins.enabled: false` est défini, les références de plugins obsolètes sont traitées comme inertes :
le démarrage du Gateway ignore le travail de découverte/chargement des plugins et `openclaw doctor` préserve
la configuration de plugin désactivée au lieu de la supprimer automatiquement. Réactivez les plugins avant
d’exécuter le nettoyage doctor si vous voulez supprimer les identifiants de plugins obsolètes.

L’installation des dépendances de plugins se produit uniquement pendant les flux explicites d’installation/mise à jour ou
de réparation doctor. Le démarrage du Gateway, le rechargement de configuration et l’inspection runtime ne
lancent pas de gestionnaires de paquets et ne réparent pas les arbres de dépendances. Les plugins locaux doivent déjà
avoir leurs dépendances installées, tandis que les plugins npm, git et ClawHub sont
installés sous les racines de plugins gérées par OpenClaw. Les dépendances npm peuvent être hissées
dans la racine npm gérée d’OpenClaw ; l’installation/mise à jour analyse cette racine gérée avant
la confiance et la désinstallation supprime les paquets gérés par npm via npm. Les plugins externes
et chemins de chargement personnalisés doivent toujours être installés avec `openclaw plugins install`.
Consultez [Résolution des dépendances de plugins](/fr/plugins/dependency-resolution) pour le cycle de vie
au moment de l’installation.

Les checkouts source sont des workspaces pnpm. Si vous clonez OpenClaw pour modifier des plugins
groupés, exécutez `pnpm install` ; OpenClaw charge ensuite les plugins groupés depuis
`extensions/<id>` afin que les modifications et dépendances locales au paquet soient utilisées directement.
Les installations racine npm simples sont destinées à OpenClaw empaqueté, pas au développement
depuis un checkout source.

## Types de plugins

OpenClaw reconnaît deux formats de plugins :

| Format     | Fonctionnement                                                     | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module runtime ; s’exécute dans le processus | Plugins officiels, paquets npm communautaires          |
| **Bundle** | Agencement compatible Codex/Claude/Cursor ; mappé aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de plugins](/fr/plugins/bundles) pour les détails des bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Points d’entrée de paquet

Les paquets npm de plugins natifs doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester dans le répertoire du paquet et se résoudre vers un fichier
runtime lisible, ou vers un fichier source TypeScript avec un pair JavaScript compilé inféré
tel que `src/index.ts` vers `dist/index.js`.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers runtime publiés ne se trouvent pas aux
mêmes chemins que les entrées source. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Les listes incompatibles font échouer l’installation et
la découverte de plugins plutôt que de se replier silencieusement vers les chemins source. Si vous
publiez aussi `openclaw.setupEntry`, utilisez `openclaw.runtimeSetupEntry` pour son pair
JavaScript compilé ; ce fichier est obligatoire lorsqu’il est déclaré.

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

### Paquets npm détenus par OpenClaw pendant la migration

ClawHub est le chemin de distribution principal pour la plupart des plugins. Les versions empaquetées
actuelles d’OpenClaw groupent déjà de nombreux plugins officiels, ceux-ci n’ont donc pas besoin
d’installations npm séparées dans les configurations normales. Jusqu’à ce que chaque plugin détenu par OpenClaw ait
migré vers ClawHub, OpenClaw publie encore certains paquets de plugins `@openclaw/*` sur
npm pour les installations anciennes/personnalisées et les workflows npm directs.

Si npm signale un paquet de plugin `@openclaw/*` comme obsolète, cette version de paquet
provient d’un ancien train de paquets externes. Utilisez le plugin groupé de
l’OpenClaw actuel ou un checkout local jusqu’à ce qu’un paquet npm plus récent soit publié.

| Plugin          | Paquet                     | Docs                                       |
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

    Consultez [Mémoire LanceDB](/fr/plugins/memory-lancedb) pour la configuration d’embeddings compatible OpenAI,
    les exemples Ollama, les limites de rappel et le dépannage.

  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autre">
    - `browser` — plugin de navigateur groupé pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime navigateur et le service de contrôle de navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
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
| `enabled`        | Interrupteur principal (par défaut : `true`)              |
| `allow`          | Liste d’autorisation des plugins (facultatif)             |
| `deny`           | Liste de refus des plugins (facultatif ; le refus l’emporte) |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs de slots exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + configuration par plugin                       |

`plugins.allow` est exclusif. Lorsqu’il n’est pas vide, seuls les plugins listés peuvent charger
ou exposer des outils, même si `tools.allow` contient `"*"` ou un nom d’outil spécifique
détenu par un plugin. Si une liste d’autorisation d’outils référence des outils de plugins, ajoutez les identifiants des plugins propriétaires
à `plugins.allow` ou supprimez `plugins.allow` ; `openclaw doctor` avertit à propos de cette
forme.

Les changements de configuration **nécessitent un redémarrage du Gateway**. Si le Gateway s’exécute avec la surveillance de configuration
+ redémarrage dans le processus activés (le chemin par défaut `openclaw gateway`), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.
Il n’existe aucun chemin de rechargement à chaud pris en charge pour le code runtime de plugin natif ou les hooks de cycle de vie ;
redémarrez le processus Gateway qui sert le canal actif avant
d’attendre l’exécution du code `register(api)` mis à jour, des hooks `api.on(...)`, des outils, services ou
des hooks fournisseur/runtime.

`openclaw plugins list` est un instantané local du registre/de la configuration des plugins. Un
Plugin `enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le
plugin à participer. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution
a redémarré avec le même code de plugin. Dans les configurations VPS/conteneur avec
processus enveloppes, envoyez les redémarrages au vrai processus `openclaw gateway run`,
ou utilisez `openclaw gateway restart` sur le Gateway en cours d’exécution.

<Accordion title="États des Plugins : désactivé, manquant ou invalide">
  - **Désactivé** : le plugin existe, mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un id de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe, mais sa configuration ne correspond pas au schéma déclaré. Le démarrage du Gateway ignore seulement ce plugin ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée invalide en la désactivant et en supprimant sa charge utile de configuration.

</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichiers ou de répertoires. Les chemins qui pointent
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
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, synthèse vocale).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

Les installations empaquetées et les images Docker résolvent normalement les plugins groupés depuis l’arborescence
compilée `dist/extensions`. Si un répertoire source de plugin groupé est
monté par liaison par-dessus le chemin source empaqueté correspondant, par exemple
`/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté
comme une superposition de source groupée et le découvre avant le bundle empaqueté
`/app/dist/extensions/synology-chat`. Cela permet aux boucles de conteneur des mainteneurs
de continuer à fonctionner sans rebasculer chaque plugin groupé vers la source TypeScript.
Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les bundles dist empaquetés
même lorsque des montages de superposition source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins et ignore le travail de découverte/chargement des plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (doivent être activés explicitement)
- Les plugins groupés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du plugin sélectionné pour cet emplacement
- Certains plugins groupés optionnels sont activés automatiquement lorsque la configuration nomme une
  surface appartenant au plugin, comme une référence de modèle de fournisseur, une configuration de canal ou un runtime
  de harnais
- La configuration de plugin obsolète est conservée tant que `plugins.enabled: false` est actif ;
  réactivez les plugins avant d’exécuter le nettoyage doctor si vous voulez supprimer les ids obsolètes
- Les routes Codex de la famille OpenAI conservent des frontières de plugin séparées :
  `openai-codex/*` appartient au plugin OpenAI, tandis que le plugin groupé de serveur d’application Codex
  est sélectionné par `agentRuntime.id: "codex"` ou par les références de modèle historiques
  `codex/*`

## Dépannage des hooks runtime

Si un plugin apparaît dans `plugins list`, mais que les effets de bord ou hooks
`register(api)` ne s’exécutent pas dans le trafic de chat en direct, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL,
  le profil, le chemin de configuration et le processus actifs du Gateway sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après les changements d’installation, de configuration ou de code de plugin. Dans les conteneurs
  enveloppes, le PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --runtime --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non groupés comme `llm_input`,
  `llm_output`, `before_agent_finalize` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, privilégiez `before_model_resolve`. Il s’exécute avant la résolution
  du modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle
  a produit une sortie d’assistant.
- Pour prouver le modèle effectif de la session, utilisez `openclaw sessions` ou les surfaces
  de session/statut du Gateway et, lors du débogage des charges utiles de fournisseur, démarrez
  le Gateway avec `--raw-stream --raw-stream-path <path>`.

### Configuration lente des outils de plugin

Si les tours d’agent semblent se bloquer pendant la préparation des outils, activez la journalisation de trace et
recherchez les lignes de temps des fabriques d’outils de plugin :

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Recherchez :

```text
[trace:plugin-tools] factory timings ...
```

Le résumé liste le temps total des fabriques et les fabriques d’outils de plugin les plus lentes,
avec l’id du plugin, les noms d’outils déclarés, la forme du résultat et si l’outil est
facultatif. Les lignes lentes sont promues en avertissements lorsqu’une seule fabrique prend au
moins 1 s ou que la préparation totale des fabriques d’outils de plugin prend au moins 5 s.

Si un plugin domine le temps, inspectez ses enregistrements runtime :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ensuite, mettez à jour, réinstallez ou désactivez ce plugin. Les auteurs de Plugins doivent déplacer
le chargement coûteux de dépendances derrière le chemin d’exécution de l’outil au lieu de le faire
dans la fabrique d’outils.

### Propriété en double de canal ou d’outil

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Ils signifient que plusieurs plugins activés essaient de posséder le même canal,
flux de configuration ou nom d’outil. La cause la plus fréquente est un plugin de canal externe
installé à côté d’un plugin groupé qui fournit maintenant le même id de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque plugin activé
  et son origine.
- Exécutez `openclaw plugins inspect <id> --runtime --json` pour chaque plugin suspect et
  comparez `channels`, `channelConfigs`, `tools` et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après avoir installé ou supprimé
  des paquets de plugin afin que les métadonnées persistantes reflètent l’installation actuelle.
- Redémarrez le Gateway après les changements d’installation, de registre ou de configuration.

Options de correction :

- Si un plugin en remplace intentionnellement un autre pour le même id de canal, le
  plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec
  l’id du plugin de priorité inférieure. Voir [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez un côté avec
  `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation de plugin
  obsolète.
- Si vous avez explicitement activé les deux plugins, OpenClaw conserve cette demande et
  signale le conflit. Choisissez un propriétaire pour le canal ou renommez les outils appartenant aux plugins
  afin que la surface runtime soit sans ambiguïté.

## Emplacements de Plugins (catégories exclusives)

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

| Emplacement     | Ce qu’il contrôle       | Par défaut          |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin de mémoire actif | `memory-core`       |
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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

Les plugins groupés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles groupés, les fournisseurs de synthèse vocale groupés et le plugin de navigateur
groupé). Les autres plugins groupés nécessitent toujours `openclaw plugins enable <id>`.

`--force` remplace sur place un plugin ou un pack de hooks déjà installé. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier par-dessus une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du plugin
installé à cette liste d’autorisation avant de l’activer. Si le même id de plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée deny obsolète afin que
l’installation explicite soit immédiatement chargeable après redémarrage.

OpenClaw conserve un registre local persistant de plugins comme modèle de lecture à froid pour
l’inventaire des plugins, la propriété des contributions et la planification du démarrage. Les flux d’installation, de mise à jour,
de désinstallation, d’activation et de désactivation actualisent ce registre après avoir modifié l’état des plugins.
Le même fichier `plugins/installs.json` conserve les métadonnées d’installation durables dans
`installRecords` au niveau supérieur et les métadonnées de manifeste reconstructibles dans `plugins`. Si
le registre est absent, obsolète ou invalide, `openclaw plugins registry
--refresh` reconstruit sa vue de manifeste à partir des enregistrements d’installation, de la politique de configuration et
des métadonnées de manifeste/paquet sans charger les modules runtime des plugins.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de paquet npm avec un dist-tag ou une version exacte résout le nom du paquet
vers l’enregistrement de plugin suivi et enregistre la nouvelle spécification pour les mises à jour futures.
Passer le nom du paquet sans version replace une installation épinglée exacte sur
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans télécharger, réinstaller ni réécrire la configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations depuis une marketplace conservent les métadonnées de source de
la marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est une option de dernier recours pour les
faux positifs du scanner intégré de code dangereux. Elle permet aux installations
et mises à jour de plugins de continuer malgré les constats intégrés `critical`,
mais elle ne contourne toujours pas les blocages de politique `before_install`
du plugin ni les blocages dus à un échec d’analyse. Les analyses d’installation
ignorent les fichiers et répertoires de test courants tels que `tests/`,
`__tests__/`, `*.test.*` et `*.spec.*` afin d’éviter de bloquer les mocks de test
empaquetés ; les points d’entrée d’exécution déclarés du plugin sont tout de
même analysés même s’ils utilisent l’un de ces noms.

Cet indicateur CLI s’applique uniquement aux flux d’installation et de mise à
jour des plugins. Les installations de dépendances de Skills adossées au Gateway
utilisent à la place l’override de requête correspondant
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le
flux distinct de téléchargement et d’installation de Skills depuis ClawHub.

Si un plugin que vous avez publié sur ClawHub est masqué ou bloqué par une
analyse, ouvrez le tableau de bord ClawHub ou exécutez
`clawhub package rescan <name>` pour demander à ClawHub de le vérifier à
nouveau. `--dangerously-force-unsafe-install` n’affecte que les installations
sur votre propre machine ; il ne demande pas à ClawHub de réanalyser le plugin
ni de rendre publique une version bloquée.

Les bundles compatibles participent au même flux de liste, inspection,
activation et désactivation des plugins. La prise en charge actuelle à
l’exécution inclut les Skills de bundle, les Skills de commande Claude, les
valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude
`.lsp.json` et `lspServers` déclarées dans le manifeste, les Skills de commande
Cursor et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées
ainsi que les entrées de serveurs MCP et LSP prises en charge ou non prises en
charge pour les plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connue de Claude
issu de `~/.claude/plugins/known_marketplaces.json`, une racine de marketplace
locale ou un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`,
une URL de dépôt GitHub ou une URL git. Pour les marketplaces distantes, les
entrées de plugin doivent rester à l’intérieur du dépôt de marketplace cloné et
utiliser uniquement des sources de chemin relatives.

Consultez la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Aperçu de l’API des plugins

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les
anciens plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais
les nouveaux plugins doivent utiliser `register`.

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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation
du plugin. Le chargeur revient encore à `activate(api)` pour les anciens
plugins, mais les plugins intégrés et les nouveaux plugins externes doivent
considérer `register` comme le contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation à l’exécution. Enregistrer les outils, hooks, services, commandes, routes et autres effets de bord actifs.                  |
| `discovery`     | Découverte de capacités en lecture seule. Enregistrer les fournisseurs et métadonnées ; le code d’entrée du plugin de confiance peut se charger, mais les effets de bord actifs doivent être ignorés. |
| `setup-only`    | Chargement des métadonnées de configuration de canal via une entrée de configuration légère.                                           |
| `setup-runtime` | Chargement de configuration de canal qui nécessite aussi l’entrée d’exécution.                                                         |
| `cli-metadata`  | Collecte des métadonnées de commandes CLI uniquement.                                                                                  |

Les entrées de plugin qui ouvrent des sockets, bases de données, workers en
arrière-plan ou clients de longue durée doivent protéger ces effets de bord avec
`api.registrationMode === "full"`. Les chargements de découverte sont mis en
cache séparément des chargements d’activation et ne remplacent pas le registre
Gateway en cours d’exécution. La découverte n’active rien, mais elle n’est pas
sans import : OpenClaw peut évaluer l’entrée de plugin de confiance ou le module
du plugin de canal pour construire l’instantané. Gardez les niveaux supérieurs
des modules légers et sans effet de bord, et placez les clients réseau,
sous-processus, écouteurs, lectures d’identifiants et démarrages de services
derrière les chemins d’exécution complète.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre              |
| --------------------------------------- | ---------------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM)        |
| `registerChannel`                       | Canal de discussion                |
| `registerTool`                          | Outil d’agent                      |
| `registerHook` / `on(...)`              | Hooks de cycle de vie              |
| `registerSpeechProvider`                | Synthèse vocale / STT              |
| `registerRealtimeTranscriptionProvider` | STT en streaming                   |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex             |
| `registerMediaUnderstandingProvider`    | Analyse d’images/audio             |
| `registerImageGenerationProvider`       | Génération d’images                |
| `registerMusicGenerationProvider`       | Génération de musique              |
| `registerVideoGenerationProvider`       | Génération de vidéo                |
| `registerWebFetchProvider`              | Fournisseur de récupération / extraction web |
| `registerWebSearchProvider`             | Recherche web                      |
| `registerHttpRoute`                     | Point de terminaison HTTP          |
| `registerCommand` / `registerCli`       | Commandes CLI                      |
| `registerContextEngine`                 | Moteur de contexte                 |
| `registerService`                       | Service en arrière-plan            |

Comportement de garde des hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Le serveur d’app Codex natif relie les événements d’outils natifs Codex à cette
surface de hooks. Les plugins peuvent bloquer les outils natifs Codex via
`before_tool_call`, observer les résultats via `after_tool_call` et participer
aux approbations Codex `PermissionRequest`. Le pont ne réécrit pas encore les
arguments des outils natifs Codex. La limite exacte de prise en charge de
l’exécution Codex se trouve dans le [contrat de prise en charge v1 du harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Connexe

- [Créer des plugins](/fr/plugins/building-plugins) — créer votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
