---
read_when:
    - Installer ou configurer des plugins
    - Comprendre la découverte des Plugins et les règles de chargement
    - Travailler avec des bundles de Plugin compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T07:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, skills, parole, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d’images, génération de vidéos, récupération web, recherche web,
et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes**. La plupart des plugins externes sont publiés et découverts via
[ClawHub](/fr/tools/clawhub). Npm reste pris en charge pour les installations directes et pour un
ensemble temporaire de packages de plugins appartenant à OpenClaw pendant la finalisation de cette migration.

## Démarrage rapide

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Si vous préférez un contrôle natif par chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local,
`clawhub:<pkg>` explicite, `npm:<pkg>` explicite, ou spécification de package simple (ClawHub d’abord, puis
repli vers npm).

Si la configuration est invalide, l’installation échoue normalement fermée et vous dirige vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de plugin groupé
pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.
Pendant le démarrage du Gateway, une configuration invalide pour un plugin est isolée à ce plugin :
le démarrage journalise le problème `plugins.entries.<id>.config`, ignore ce plugin pendant le
chargement, et maintient les autres plugins et canaux en ligne. Exécutez `openclaw doctor --fix`
pour mettre en quarantaine la mauvaise configuration du plugin en désactivant cette entrée de plugin et en supprimant
sa charge utile de configuration invalide ; la sauvegarde de configuration normale conserve les valeurs précédentes.
Lorsqu’une configuration de canal référence un plugin qui n’est plus découvrable mais que le
même ancien id de plugin reste dans la configuration de plugin ou les enregistrements d’installation, le démarrage du Gateway
journalise des avertissements et ignore ce canal au lieu de bloquer tous les autres canaux.
Exécutez `openclaw doctor --fix` pour supprimer les anciennes entrées de canal/plugin ; les clés de
canal inconnues sans preuve d’ancien plugin échouent toujours à la validation afin que les fautes de frappe restent
visibles.
Si `plugins.enabled: false` est défini, les références de plugins obsolètes sont traitées comme inertes :
le démarrage du Gateway ignore la découverte/le chargement des plugins et `openclaw doctor` préserve
la configuration de plugin désactivée au lieu de la supprimer automatiquement. Réactivez les plugins avant
d’exécuter le nettoyage doctor si vous voulez supprimer les ids de plugins obsolètes.

Les installations empaquetées d’OpenClaw n’installent pas avec empressement toute l’arborescence de
dépendances d’exécution de chaque plugin groupé. Lorsqu’un plugin groupé appartenant à OpenClaw est actif depuis
la configuration de plugin, une configuration de canal héritée, ou un manifeste activé par défaut, le démarrage
répare uniquement les dépendances d’exécution déclarées par ce plugin avant de l’importer.
L’état d’authentification de canal persistant seul n’active pas un canal groupé pour
la réparation des dépendances d’exécution au démarrage du Gateway.
La désactivation explicite l’emporte toujours : `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` et `channels.<id>.enabled: false`
empêchent la réparation automatique des dépendances d’exécution groupées pour ce plugin/canal.
Un `plugins.allow` non vide limite également la réparation des dépendances d’exécution groupées
activées par défaut ; l’activation explicite d’un canal groupé (`channels.<id>.enabled: true`) peut
toujours réparer les dépendances de plugin de ce canal.
Les plugins externes et les chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugins :

| Format     | Fonctionnement                                                    | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module d’exécution ; s’exécute dans le processus | Plugins officiels, packages npm communautaires         |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers des fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Points d’entrée des packages

Les packages npm de plugin natif doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester dans le répertoire du package et se résoudre vers un fichier
d’exécution lisible, ou vers un fichier source TypeScript avec un pair JavaScript compilé inféré
tel que `src/index.ts` vers `dist/index.js`.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers d’exécution publiés ne se trouvent pas aux
mêmes chemins que les entrées sources. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Les listes non concordantes font échouer l’installation et
la découverte des plugins au lieu de revenir silencieusement aux chemins sources.

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

### Packages npm appartenant à OpenClaw pendant la migration

ClawHub est le chemin de distribution principal pour la plupart des plugins. Les versions empaquetées actuelles
d’OpenClaw groupent déjà de nombreux plugins officiels, ils ne nécessitent donc pas
d’installations npm séparées dans les configurations normales. Jusqu’à ce que chaque plugin appartenant à OpenClaw ait
migré vers ClawHub, OpenClaw continue d’expédier certains packages de plugins `@openclaw/*` sur
npm pour les installations anciennes/personnalisées et les flux directs npm.

Si npm signale qu’un package de plugin `@openclaw/*` est obsolète, cette version de package
provient d’une ancienne série de packages externes. Utilisez le plugin groupé depuis
OpenClaw actuel ou un checkout local jusqu’à la publication d’un package npm plus récent.

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

### Core (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` — recherche mémoire groupée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatique (définissez `plugins.slots.memory = "memory-lancedb"`)

    Consultez [Memory LanceDB](/fr/plugins/memory-lancedb) pour la configuration d’embeddings compatible OpenAI,
    les exemples Ollama, les limites de rappel et le dépannage.

  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autre">
    - `browser` — plugin de navigateur groupé pour l’outil navigateur, la CLI `openclaw browser`, la méthode gateway `browser.request`, l’exécution navigateur et le service de contrôle de navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
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
| `allow`          | Liste d’autorisation de plugins (facultatif)              |
| `deny`           | Liste de refus de plugins (facultatif ; deny l’emporte)   |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs de slots exclusifs (p. ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascule + configuration par plugin                        |

`plugins.allow` est exclusif. Lorsqu’il n’est pas vide, seuls les plugins listés peuvent se charger
ou exposer des outils, même si `tools.allow` contient `"*"` ou un nom d’outil
appartenant à un plugin spécifique. Si une liste d’autorisation d’outils référence des outils de plugin, ajoutez les ids de plugins propriétaires
à `plugins.allow` ou supprimez `plugins.allow` ; `openclaw doctor` avertit pour cette
forme.

Les changements de configuration **nécessitent un redémarrage du gateway**. Si le Gateway s’exécute avec la surveillance de configuration
+ le redémarrage dans le processus activés (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.
Il n’existe pas de chemin de rechargement à chaud pris en charge pour le code d’exécution des plugins natifs ou les hooks de cycle de vie ;
redémarrez le processus Gateway qui sert le canal actif avant
d’attendre l’exécution du code `register(api)` mis à jour, des hooks `api.on(...)`, des outils, services ou
hooks de fournisseur/exécution.

`openclaw plugins list` est un instantané local du registre/de la configuration des plugins. Un plugin
`enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le
plugin à participer. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution
a redémarré avec le même code de plugin. Sur les configurations VPS/conteneur avec
processus wrapper, envoyez les redémarrages au véritable processus `openclaw gateway run`,
ou utilisez `openclaw gateway restart` contre le Gateway en cours d’exécution.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La configuration est préservée.
  - **Manquant** : la configuration référence un id de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré. Le démarrage du Gateway ignore uniquement ce plugin ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée invalide en la désactivant et en supprimant sa charge utile de configuration.

</Accordion>

## Découverte et précédence

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites vers des fichiers ou des répertoires. Les chemins qui pointent
    vers les propres répertoires de plugins groupés empaquetés d'OpenClaw sont ignorés ;
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
compilée `dist/extensions`. Si un répertoire source de Plugin groupé est
monté par liaison sur le chemin source empaqueté correspondant, par exemple
`/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté
comme une surcouche de source groupée et le découvre avant le bundle empaqueté
`/app/dist/extensions/synology-chat`. Cela permet aux boucles de conteneur des mainteneurs
de continuer à fonctionner sans rebasculer chaque Plugin groupé vers la source TypeScript.
Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les bundles dist empaquetés
même lorsque des montages de surcouche source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins et ignore le travail de découverte/chargement des plugins
- `plugins.deny` l’emporte toujours sur l’autorisation
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les plugins groupés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du Plugin sélectionné pour cet emplacement
- Certains plugins groupés à activation explicite sont activés automatiquement lorsque la configuration nomme une
  surface détenue par un Plugin, comme une référence de modèle de fournisseur, une configuration de canal ou un
  runtime de harnais
- La configuration obsolète des plugins est conservée tant que `plugins.enabled: false` est actif ;
  réactivez les plugins avant d’exécuter le nettoyage doctor si vous voulez supprimer les ids obsolètes
- Les routes Codex de la famille OpenAI conservent des limites de Plugin séparées :
  `openai-codex/*` appartient au Plugin OpenAI, tandis que le Plugin app-server Codex groupé
  est sélectionné par `agentRuntime.id: "codex"` ou les anciennes références de modèle
  `codex/*`

## Dépannage des hooks de runtime

Si un Plugin apparaît dans `plugins list` mais que les effets de bord ou hooks
`register(api)` ne s’exécutent pas dans le trafic de discussion en direct, vérifiez d’abord ces points :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL du
  Gateway actif, le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après les modifications d’installation, de configuration ou de code du Plugin. Dans les conteneurs
  enveloppes, le PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non groupés comme `llm_input`,
  `llm_output`, `before_agent_finalize` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la
  résolution du modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle
  a produit une sortie d’assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les
  surfaces de session/statut du Gateway et, lors du débogage des charges utiles de fournisseur, démarrez
  le Gateway avec `--raw-stream --raw-stream-path <path>`.

### Propriété dupliquée de canal ou d’outil

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Cela signifie que plusieurs plugins activés essaient de posséder le même canal,
flux de configuration ou nom d’outil. La cause la plus fréquente est un Plugin de canal externe
installé à côté d’un Plugin groupé qui fournit désormais le même id de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque Plugin activé
  et son origine.
- Exécutez `openclaw plugins inspect <id> --json` pour chaque Plugin suspecté et
  comparez `channels`, `channelConfigs`, `tools` et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après l’installation ou la suppression
  de packages de Plugin afin que les métadonnées persistées reflètent l’installation actuelle.
- Redémarrez le Gateway après les modifications d’installation, de registre ou de configuration.

Options de correction :

- Si un Plugin en remplace intentionnellement un autre pour le même id de canal, le
  Plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec
  l’id du Plugin de priorité inférieure. Voir [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez l’un des deux côtés avec
  `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation obsolète du Plugin.
- Si vous avez explicitement activé les deux plugins, OpenClaw conserve cette demande et
  signale le conflit. Choisissez un propriétaire pour le canal ou renommez les outils détenus par le Plugin
  afin que la surface de runtime soit non ambiguë.

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
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins groupés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles groupés, les fournisseurs de parole groupés et le Plugin de navigateur
groupé). Les autres plugins groupés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase en place un Plugin installé ou un pack de hooks existant. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du
Plugin installé à cette liste d’autorisation avant de l’activer. Si le même id de Plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée de refus obsolète afin que
l’installation explicite soit immédiatement chargeable après redémarrage.

OpenClaw conserve un registre local persistant des plugins comme modèle de lecture à froid pour
l’inventaire des plugins, la propriété des contributions et la planification du démarrage. Les flux d’installation, de mise à jour,
de désinstallation, d’activation et de désactivation actualisent ce registre après modification de l’état des plugins.
Le même fichier `plugins/installs.json` conserve les métadonnées d’installation durables dans
`installRecords` au niveau supérieur et les métadonnées de manifeste reconstructibles dans `plugins`. Si
le registre est manquant, obsolète ou invalide, `openclaw plugins registry
--refresh` reconstruit sa vue de manifeste à partir des enregistrements d’installation, de la politique de configuration et
des métadonnées de manifeste/package sans charger les modules de runtime des plugins.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de Plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version replace une installation épinglée exacte sur
la ligne de publication par défaut du registre. Si le Plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans télécharger, réinstaller ni réécrire la configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations depuis une marketplace persistent les métadonnées de source de marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un contournement d’urgence pour les faux
positifs du scanner de code dangereux intégré. Il permet aux installations de Plugin
et aux mises à jour de Plugin de continuer malgré les constats `critical` intégrés, mais il ne
contourne toujours pas les blocages de politique `before_install` du Plugin ni le blocage en cas d’échec d’analyse.
Les analyses d’installation ignorent les fichiers et répertoires de test courants comme `tests/`,
`__tests__/`, `*.test.*` et `*.spec.*` afin d’éviter de bloquer les mocks de test empaquetés ;
les points d’entrée de runtime déclarés du Plugin sont toujours analysés même s’ils utilisent l’un de
ces noms.

Cet indicateur CLI s’applique uniquement aux flux d’installation/mise à jour des plugins. Les installations de dépendances de Skills
adossées au Gateway utilisent à la place le remplacement de requête
`dangerouslyForceUnsafeInstall` correspondant, tandis que `openclaw skills install` reste le flux séparé
de téléchargement/installation de Skills ClawHub.

Si un Plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse, ouvrez le
tableau de bord ClawHub ou exécutez `clawhub package rescan <name>` pour demander à ClawHub de le vérifier
à nouveau. `--dangerously-force-unsafe-install` affecte uniquement les installations sur votre propre
machine ; il ne demande pas à ClawHub de réanalyser le Plugin ni de rendre publique une version
bloquée.

Les bundles compatibles participent au même flux de liste/inspection/activation/désactivation des plugins.
La prise en charge actuelle du runtime inclut les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et
`lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex
compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées de serveur MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connu Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub,
ou une URL git. Pour les marketplaces distantes, les entrées de Plugin doivent rester à l’intérieur du
dépôt de marketplace cloné et utiliser uniquement des sources de chemin relatif.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Aperçu de l’API Plugin

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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation
du plugin. Le chargeur se rabat encore sur `activate(api)` pour les anciens plugins,
mais les plugins intégrés et les nouveaux plugins externes doivent considérer `register`
comme le contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation à l’exécution. Enregistrez les outils, hooks, services, commandes, routes et autres effets de bord actifs.           |
| `discovery`     | Découverte des capacités en lecture seule. Enregistrez les fournisseurs et métadonnées ; le code d’entrée du plugin approuvé peut se charger, mais ignorez les effets de bord actifs. |
| `setup-only`    | Chargement des métadonnées de configuration du canal via une entrée de configuration légère.                                    |
| `setup-runtime` | Chargement de la configuration du canal qui nécessite aussi l’entrée d’exécution.                                               |
| `cli-metadata`  | Collecte des métadonnées de commandes CLI uniquement.                                                                           |

Les entrées de plugins qui ouvrent des sockets, bases de données, workers en
arrière-plan ou clients à longue durée de vie doivent protéger ces effets de bord
avec `api.registrationMode === "full"`. Les chargements de découverte sont mis en
cache séparément des chargements d’activation et ne remplacent pas le registre
Gateway en cours d’exécution. La découverte est non activante, pas sans import :
OpenClaw peut évaluer l’entrée du plugin approuvé ou le module du plugin de canal
pour construire l’instantané. Gardez les niveaux supérieurs des modules légers et
sans effets de bord, et déplacez les clients réseau, sous-processus, écouteurs,
lectures d’identifiants et démarrage de services derrière des chemins d’exécution
complète.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qui est enregistré                 |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM)           |
| `registerChannel`                       | Canal de discussion                   |
| `registerTool`                          | Outil d’agent                         |
| `registerHook` / `on(...)`              | Hooks de cycle de vie                 |
| `registerSpeechProvider`                | Synthèse vocale / STT                 |
| `registerRealtimeTranscriptionProvider` | STT en streaming                      |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex                |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio                 |
| `registerImageGenerationProvider`       | Génération d’images                   |
| `registerMusicGenerationProvider`       | Génération de musique                 |
| `registerVideoGenerationProvider`       | Génération de vidéo                   |
| `registerWebFetchProvider`              | Fournisseur de récupération Web / scraping |
| `registerWebSearchProvider`             | Recherche Web                         |
| `registerHttpRoute`                     | Point de terminaison HTTP             |
| `registerCommand` / `registerCli`       | Commandes CLI                         |
| `registerContextEngine`                 | Moteur de contexte                    |
| `registerService`                       | Service en arrière-plan               |

Comportement des gardes de hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Les exécutions du serveur d’application Codex natif raccordent les événements
d’outils natifs Codex à cette surface de hooks. Les plugins peuvent bloquer les
outils natifs Codex via `before_tool_call`, observer les résultats via
`after_tool_call` et participer aux approbations Codex `PermissionRequest`. Le
pont ne réécrit pas encore les arguments des outils natifs Codex. La limite exacte
de prise en charge du runtime Codex se trouve dans le
[contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Associé

- [Création de plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrement d’outils](/fr/plugins/building-plugins#registering-agent-tools) — ajoutez des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
