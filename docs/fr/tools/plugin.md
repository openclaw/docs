---
read_when:
    - Installation ou configuration de plugins
    - Comprendre les règles de découverte et de chargement du Plugin
    - Travailler avec des bundles de Plugin compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-30T07:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, skills, parole, transcription en temps réel, voix en
temps réel, compréhension des médias, génération d’images, génération de vidéos,
récupération web, recherche web, et plus encore. Certains plugins sont **core**
(livrés avec OpenClaw), d’autres sont **externes**. La plupart des plugins
externes sont publiés et découverts via [ClawHub](/fr/tools/clawhub). Npm reste pris
en charge pour les installations directes et pour un ensemble temporaire de
paquets de plugins détenus par OpenClaw pendant la finalisation de cette migration.

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

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin local/archive, valeur explicite
`clawhub:<pkg>`, valeur explicite `npm:<pkg>`, ou spécification de paquet nue (ClawHub d’abord, puis
repli npm).

Si la configuration est invalide, l’installation échoue normalement en mode fermé et vous renvoie vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de plugin groupé
pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.
Pendant le démarrage du Gateway, la configuration invalide d’un plugin est isolée à ce plugin :
le démarrage journalise le problème `plugins.entries.<id>.config`, ignore ce plugin pendant le
chargement et garde les autres plugins et canaux en ligne. Exécutez `openclaw doctor --fix`
pour mettre en quarantaine la mauvaise configuration de plugin en désactivant cette entrée de plugin et en supprimant
sa charge utile de configuration invalide ; la sauvegarde normale de la configuration conserve les valeurs précédentes.
Lorsqu’une configuration de canal référence un plugin qui n’est plus découvrable mais que le
même id de plugin obsolète reste dans la configuration de plugin ou les enregistrements d’installation, le démarrage du Gateway
journalise des avertissements et ignore ce canal au lieu de bloquer tous les autres canaux.
Exécutez `openclaw doctor --fix` pour supprimer les entrées de canal/plugin obsolètes ; les clés de
canal inconnues sans preuve de plugin obsolète échouent toujours à la validation afin que les fautes de frappe restent
visibles.
Si `plugins.enabled: false` est défini, les références de plugins obsolètes sont traitées comme inertes :
le démarrage du Gateway ignore le travail de découverte/chargement des plugins et `openclaw doctor` préserve
la configuration de plugin désactivée au lieu de la supprimer automatiquement. Réactivez les plugins avant
d’exécuter le nettoyage doctor si vous voulez supprimer les ids de plugins obsolètes.

Les installations OpenClaw empaquetées n’installent pas avidement toute l’arborescence de dépendances
d’exécution de chaque plugin groupé. Lorsqu’un plugin groupé détenu par OpenClaw est actif depuis
la configuration de plugin, une configuration de canal héritée ou un manifeste activé par défaut, le démarrage
répare uniquement les dépendances d’exécution déclarées de ce plugin avant de l’importer.
L’état d’authentification de canal persistant seul n’active pas un canal groupé pour
la réparation des dépendances d’exécution au démarrage du Gateway.
La désactivation explicite l’emporte toujours : `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` et `channels.<id>.enabled: false`
empêchent la réparation automatique des dépendances d’exécution groupées pour ce plugin/canal.
Un `plugins.allow` non vide borne aussi la réparation des dépendances d’exécution groupées activées par défaut ;
l’activation explicite d’un canal groupé (`channels.<id>.enabled: true`) peut
toujours réparer les dépendances de plugin de ce canal.
Les plugins externes et les chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugins :

| Format     | Fonctionnement                                                     | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module d’exécution ; s’exécute dans le processus       | Plugins officiels, paquets npm de la communauté               |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Points d’entrée de paquet

Les paquets npm de plugins natifs doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester à l’intérieur du répertoire du paquet et se résoudre vers un fichier
d’exécution lisible, ou vers un fichier source TypeScript avec un pair JavaScript compilé
inféré comme `src/index.ts` vers `dist/index.js`.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers d’exécution publiés ne résident pas aux
mêmes chemins que les entrées sources. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Les listes incompatibles font échouer l’installation et
la découverte de plugins plutôt que de revenir silencieusement aux chemins sources.

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
actuelles d’OpenClaw groupent déjà de nombreux plugins officiels, ils ne nécessitent donc pas
d’installations npm séparées dans les configurations normales. Jusqu’à ce que chaque plugin détenu par OpenClaw ait
migré vers ClawHub, OpenClaw publie toujours certains paquets de plugins `@openclaw/*` sur
npm pour les installations anciennes/personnalisées et les workflows npm directs.

Si npm signale qu’un paquet de plugin `@openclaw/*` est obsolète, cette version du paquet
provient d’une ancienne série de paquets externes. Utilisez le plugin groupé de
l’OpenClaw actuel ou un checkout local jusqu’à la publication d’un paquet npm plus récent.

| Plugin          | Paquet                    | Docs                                       |
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
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)

    Consultez [Memory LanceDB](/fr/plugins/memory-lancedb) pour la configuration d’embeddings compatibles OpenAI,
    les exemples Ollama, les limites de rappel et le dépannage.

  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autre">
    - `browser` — plugin de navigateur groupé pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, l’exécution navigateur et le service de contrôle du navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
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
| `enabled`        | Interrupteur principal (par défaut : `true`)                           |
| `allow`          | Liste d’autorisation de plugins (facultatif)                               |
| `deny`           | Liste de refus de plugins (facultatif ; le refus l’emporte)                     |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires                            |
| `slots`          | Sélecteurs d’emplacement exclusifs (par exemple `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + configuration par plugin                               |

Les changements de configuration **nécessitent un redémarrage du gateway**. Si le Gateway s’exécute avec la surveillance de configuration
et le redémarrage dans le processus activés (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.
Il n’existe pas de chemin de rechargement à chaud pris en charge pour le code d’exécution de plugin natif ou les hooks de cycle de vie ;
redémarrez le processus Gateway qui sert le canal actif avant de vous attendre à ce que le code
`register(api)`, les hooks `api.on(...)`, les outils, services ou hooks
fournisseur/exécution mis à jour s’exécutent.

`openclaw plugins list` est un instantané local du registre/de la configuration des plugins. Un plugin
`enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le
plugin à participer. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution
a redémarré avec le même code de plugin. Sur les configurations VPS/conteneur avec
processus d’enveloppe, envoyez les redémarrages au processus réel `openclaw gateway run`,
ou utilisez `openclaw gateway restart` contre le Gateway en cours d’exécution.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe, mais les règles d’activation l’ont désactivé. La configuration est préservée.
  - **Manquant** : la configuration référence un id de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe, mais sa configuration ne correspond pas au schéma déclaré. Le démarrage du Gateway ignore uniquement ce plugin ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée invalide en la désactivant et en supprimant sa charge utile de configuration.

</Accordion>

## Découverte et précédence

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire. Les chemins qui pointent
    vers les propres répertoires de plugins groupés empaquetés d’OpenClaw sont ignorés ;
    exécutez `openclaw doctor --fix` pour supprimer ces alias obsolètes.
  </Step>

  <Step title="Plugins de workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins inclus">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, voix).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

Les installations packagées et les images Docker résolvent normalement les Plugins inclus depuis
l’arborescence compilée `dist/extensions`. Si un répertoire source de Plugin inclus est
monté par liaison sur le chemin source packagé correspondant, par exemple
`/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté
comme une superposition de source incluse et le découvre avant le bundle packagé
`/app/dist/extensions/synology-chat`. Cela garde les boucles de conteneurs de maintenance
fonctionnelles sans rebasculer chaque Plugin inclus vers la source TypeScript.
Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les bundles dist packagés
même lorsque des montages de superposition de source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les Plugins et ignore le travail de découverte/chargement des Plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les Plugins provenant de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les Plugins inclus suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du Plugin sélectionné pour cet emplacement
- Certains Plugins inclus avec activation explicite sont activés automatiquement lorsque la configuration nomme une
  surface appartenant au Plugin, comme une référence de modèle de fournisseur, une configuration de canal ou un runtime
  de harnais
- La configuration de Plugin obsolète est conservée pendant que `plugins.enabled: false` est actif ;
  réactivez les Plugins avant d’exécuter le nettoyage doctor si vous voulez supprimer les ids obsolètes
- Les routes Codex de la famille OpenAI conservent des frontières de Plugin séparées :
  `openai-codex/*` appartient au Plugin OpenAI, tandis que le Plugin de serveur d’application Codex
  inclus est sélectionné par `agentRuntime.id: "codex"` ou les références de modèle héritées
  `codex/*`

## Dépannage des hooks de runtime

Si un Plugin apparaît dans `plugins list` mais que les effets de bord ou hooks
`register(api)` ne s’exécutent pas dans le trafic de chat en direct, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL du
  Gateway actif, le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après les changements d’installation/configuration/code du Plugin. Dans les conteneurs
  wrapper, le PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non inclus tels que `llm_input`,
  `llm_output`, `before_agent_finalize` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la
  résolution du modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle
  produit une sortie d’assistant.
- Pour prouver le modèle effectif de session, utilisez `openclaw sessions` ou les surfaces
  session/statut du Gateway et, lors du débogage des charges utiles fournisseur, démarrez
  le Gateway avec `--raw-stream --raw-stream-path <path>`.

### Propriété dupliquée de canal ou d’outil

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Cela signifie que plusieurs Plugins activés tentent de posséder le même canal,
flux de configuration ou nom d’outil. La cause la plus courante est un Plugin de canal externe
installé à côté d’un Plugin inclus qui fournit maintenant le même id de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque Plugin activé
  et son origine.
- Exécutez `openclaw plugins inspect <id> --json` pour chaque Plugin suspect et
  comparez `channels`, `channelConfigs`, `tools` et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après l’installation ou la suppression de
  packages de Plugin afin que les métadonnées persistées reflètent l’installation actuelle.
- Redémarrez le Gateway après les changements d’installation, de registre ou de configuration.

Options de correction :

- Si un Plugin en remplace intentionnellement un autre pour le même id de canal, le
  Plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec
  l’id du Plugin de priorité inférieure. Voir [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez un côté avec
  `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation de Plugin
  obsolète.
- Si vous avez explicitement activé les deux Plugins, OpenClaw conserve cette demande et
  signale le conflit. Choisissez un propriétaire pour le canal ou renommez les outils appartenant au Plugin
  afin que la surface de runtime soit sans ambiguïté.

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

| Emplacement     | Ce qu’il contrôle     | Par défaut          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de mémoire active | `memory-core`       |
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

Les Plugins inclus sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles inclus, les fournisseurs de voix inclus et le Plugin de navigateur
inclus). D’autres Plugins inclus nécessitent toujours `openclaw plugins enable <id>`.

`--force` remplace sur place un Plugin installé existant ou un pack de hooks. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des Plugins npm
suivis. Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du
Plugin installé à cette liste d’autorisation avant de l’activer. Si le même id de Plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée de refus obsolète afin que
l’installation explicite soit immédiatement chargeable après redémarrage.

OpenClaw conserve un registre local persistant de Plugins comme modèle de lecture à froid pour
l’inventaire des Plugins, la propriété des contributions et la planification du démarrage. Les flux
d’installation, de mise à jour, de désinstallation, d’activation et de désactivation actualisent ce registre après modification de l’état des Plugins. Le même fichier `plugins/installs.json` conserve les métadonnées d’installation durables dans
`installRecords` au niveau supérieur et les métadonnées de manifeste reconstructibles dans `plugins`. Si
le registre est absent, obsolète ou invalide, `openclaw plugins registry
--refresh` reconstruit sa vue de manifeste à partir des enregistrements d’installation, de la politique de configuration et
des métadonnées de manifeste/package sans charger les modules de runtime des Plugins.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de Plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version ramène une installation épinglée exacte vers
la ligne de publication par défaut du registre. Si le Plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans télécharger, réinstaller ni réécrire la configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations de marketplace persistent les métadonnées de source de marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un contournement d’urgence pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et
mises à jour de Plugins de continuer malgré des constatations `critical` intégrées, mais il ne
contourne toujours pas les blocages de politique `before_install` des Plugins ni le blocage sur échec d’analyse.
Les analyses d’installation ignorent les fichiers et répertoires de test courants tels que `tests/`,
`__tests__/`, `*.test.*` et `*.spec.*` afin d’éviter de bloquer les mocks de test packagés ;
les points d’entrée de runtime déclarés des Plugins sont toujours analysés même s’ils utilisent l’un de
ces noms.

Cet indicateur CLI s’applique uniquement aux flux d’installation/mise à jour de Plugins. Les installations de dépendances de Skills
adossées au Gateway utilisent plutôt le remplacement de requête correspondant
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux distinct
de téléchargement/installation de Skills ClawHub.

Si un Plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse, ouvrez le
tableau de bord ClawHub ou exécutez `clawhub package rescan <name>` pour demander à ClawHub de le vérifier
à nouveau. `--dangerously-force-unsafe-install` n’affecte que les installations sur votre propre
machine ; il ne demande pas à ClawHub de réanalyser le Plugin ni de rendre une publication bloquée
publique.

Les bundles compatibles participent au même flux de liste/inspection/activation/désactivation
des Plugins. La prise en charge actuelle du runtime comprend les Skills de bundle, les Skills de commande Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers`
déclarées par manifeste, les Skills de commande Cursor et les répertoires de hooks Codex
compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées de serveurs MCP et LSP prises en charge ou non prises en charge pour les Plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connu de Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub
ou une URL git. Pour les marketplaces distantes, les entrées de Plugin doivent rester à l’intérieur du
dépôt de marketplace cloné et utiliser uniquement des sources de chemin relatives.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Aperçu de l’API de Plugin

Les Plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
Plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux Plugins doivent
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du Plugin.
Le chargeur se rabat toujours sur `activate(api)` pour les anciens Plugins,
mais les Plugins inclus et les nouveaux Plugins externes doivent traiter `register` comme le
contrat public.

`api.registrationMode` indique à un Plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation à l’exécution. Enregistre les outils, hooks, services, commandes, routes et autres effets de bord actifs.                              |
| `discovery`     | Découverte de capacités en lecture seule. Enregistre les fournisseurs et métadonnées ; le code d’entrée du Plugin de confiance peut se charger, mais les effets de bord actifs sont ignorés. |
| `setup-only`    | Chargement des métadonnées de configuration du canal via une entrée de configuration légère.                                                                |
| `setup-runtime` | Chargement de la configuration du canal qui nécessite aussi l’entrée d’exécution.                                                                         |
| `cli-metadata`  | Collecte uniquement des métadonnées des commandes CLI.                                                                                            |

Les entrées de Plugin qui ouvrent des sockets, des bases de données, des workers en arrière-plan ou des clients longue durée doivent protéger ces effets de bord avec `api.registrationMode === "full"`. Les chargements de découverte sont mis en cache séparément des chargements d’activation et ne remplacent pas le registre Gateway en cours d’exécution. La découverte est non activante, pas sans import :
OpenClaw peut évaluer l’entrée de Plugin de confiance ou le module Plugin de canal pour construire l’instantané. Gardez les niveaux supérieurs des modules légers et sans effets de bord, et déplacez les clients réseau, sous-processus, écouteurs, lectures d’identifiants et démarrages de service derrière les chemins d’exécution complète.

Méthodes d’enregistrement courantes :

| Méthode                                  | Ce qu’elle enregistre           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Outil d’agent                  |
| `registerHook` / `on(...)`              | Hooks de cycle de vie             |
| `registerSpeechProvider`                | Synthèse vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming               |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex       |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio        |
| `registerImageGenerationProvider`       | Génération d’images            |
| `registerMusicGenerationProvider`       | Génération de musique            |
| `registerVideoGenerationProvider`       | Génération de vidéos            |
| `registerWebFetchProvider`              | Fournisseur de récupération / extraction web |
| `registerWebSearchProvider`             | Recherche web                  |
| `registerHttpRoute`                     | Point de terminaison HTTP               |
| `registerCommand` / `registerCli`       | Commandes CLI                |
| `registerContextEngine`                 | Moteur de contexte              |
| `registerService`                       | Service en arrière-plan          |

Comportement des protections de hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Les exécutions du serveur d’application Codex natif relaient les événements d’outils natifs Codex vers cette surface de hook. Les Plugins peuvent bloquer les outils natifs Codex via `before_tool_call`, observer les résultats via `after_tool_call` et participer aux approbations Codex `PermissionRequest`. Le pont ne réécrit pas encore les arguments des outils natifs Codex. La limite exacte de prise en charge de l’exécution Codex se trouve dans le [contrat de prise en charge du harness Codex v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Connexe

- [Créer des Plugins](/fr/plugins/building-plugins) — créer votre propre Plugin
- [Bundles de Plugin](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma de manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un Plugin
- [Internes des Plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
