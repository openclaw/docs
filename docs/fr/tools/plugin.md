---
read_when:
    - Installer ou configurer des Plugins
    - Comprendre les règles de découverte et de chargement des Plugins
    - Travailler avec des bundles de Plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:40:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Les Plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, Skills, parole, transcription temps réel, voix temps réel,
compréhension des médias, génération d’images, génération de vidéos, web fetch, web
search, et plus encore. Certains Plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes** (publiés sur npm par la communauté).

## Démarrage rapide

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un Plugin">
    ```bash
    # Depuis npm
    openclaw plugins install @openclaw/voice-call

    # Depuis un répertoire local ou une archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer la Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configurez ensuite sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif à la discussion, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local(e), `clawhub:<pkg>` explicite, ou spécification de package nue (ClawHub d’abord, puis repli npm).

Si la configuration est invalide, l’installation échoue normalement en mode fermé et vous renvoie vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de Plugin intégré pour les Plugins qui activent
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas de manière anticipée tout
l’arbre de dépendances d’exécution de chaque Plugin intégré. Lorsqu’un Plugin intégré appartenant à OpenClaw est actif via la
configuration du Plugin, l’ancienne configuration de canal, ou un manifeste activé par défaut, le démarrage
répare uniquement les dépendances d’exécution déclarées de ce Plugin avant son import.
L’état d’authentification de canal persisté seul n’active pas un canal intégré pour la réparation
des dépendances d’exécution au démarrage de la Gateway.
La désactivation explicite l’emporte toujours : `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, et `channels.<id>.enabled: false`
empêchent la réparation automatique des dépendances d’exécution intégrées pour ce Plugin/canal.
Un `plugins.allow` non vide borne aussi la réparation des dépendances d’exécution
des Plugins intégrés activés par défaut ; l’activation explicite d’un canal intégré (`channels.<id>.enabled: true`) peut
tout de même réparer les dépendances du Plugin de ce canal.
Les Plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de Plugins

OpenClaw reconnaît deux formats de Plugin :

| Format     | Fonctionnement                                                     | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natif**  | `openclaw.plugin.json` + module runtime ; s’exécute en processus   | Plugins officiels, packages npm communautaires         |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers les fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Voir [Bundles de Plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un Plugin natif, commencez par [Construire des Plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Points d’entrée du package

Les packages npm de Plugin natif doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester à l’intérieur du répertoire du package et se résoudre vers un
fichier runtime lisible, ou vers un fichier source TypeScript avec un pair JavaScript construit inféré
tel que `src/index.ts` vers `dist/index.js`.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers runtime publiés ne vivent pas aux
mêmes chemins que les entrées source. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Des listes non correspondantes font échouer l’installation et
la découverte de Plugin au lieu de revenir silencieusement aux chemins source.

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

### Installables (npm)

| Plugin          | Package                | Documentation                          |
| --------------- | ---------------------- | -------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/fr/channels/matrix)             |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/fr/channels/msteams)   |
| Nostr           | `@openclaw/nostr`      | [Nostr](/fr/channels/nostr)               |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)      |
| Zalo            | `@openclaw/zalo`       | [Zalo](/fr/channels/zalo)                 |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/fr/plugins/zalouser)     |

### Core (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins mémoire">
    - `memory-core` — recherche mémoire intégrée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire long terme installée à la demande avec auto-recall/capture (définissez `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin navigateur intégré pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime navigateur, et le service de contrôle de navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont VS Code Copilot Proxy (désactivé par défaut)

  </Accordion>
</AccordionGroup>

Vous cherchez des Plugins tiers ? Voir [Plugins communautaires](/fr/plugins/community).

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

| Champ            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Commutateur maître (par défaut : `true`)                   |
| `allow`          | Liste d’autorisation de Plugins (facultative)              |
| `deny`           | Liste de refus de Plugins (facultative ; le refus l’emporte) |
| `load.paths`     | Fichiers/répertoires de Plugin supplémentaires             |
| `slots`          | Sélecteurs de slots exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Commutateurs + configuration par Plugin                    |

Les changements de configuration **nécessitent un redémarrage de la Gateway**. Si la Gateway s’exécute avec
surveillance de configuration + redémarrage en processus activé (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement un instant après l’écriture de la configuration.
Il n’existe aucun chemin pris en charge de hot-reload pour le code runtime natif de Plugin ni pour les hooks de cycle de vie ; redémarrez le processus Gateway qui sert le canal live avant
d’attendre l’exécution du code `register(api)` mis à jour, des hooks `api.on(...)`, des outils, services, ou des hooks fournisseur/runtime.

`openclaw plugins list` est un instantané local du registre/configuration des Plugins. Un
Plugin `enabled` qui y apparaît signifie que le registre persisté et la configuration actuelle autorisent le
Plugin à participer. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution a redémarré avec le même code de Plugin. Sur des configurations VPS/conteneur avec processus wrapper, envoyez les redémarrages au vrai processus `openclaw gateway run`,
ou utilisez `openclaw gateway restart` contre la Gateway en cours d’exécution.

<Accordion title="États de Plugin : désactivé vs manquant vs invalide">
  - **Désactivé** : le Plugin existe mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un id de Plugin que la découverte n’a pas trouvé.
  - **Invalide** : le Plugin existe mais sa configuration ne correspond pas au schéma déclaré.

</Accordion>

## Découverte et priorité

OpenClaw analyse les Plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire. Les chemins qui
    pointent de nouveau vers les propres répertoires de Plugins intégrés packagés d’OpenClaw sont ignorés ;
    exécutez `openclaw doctor --fix` pour supprimer ces alias obsolètes.
  </Step>

  <Step title="Plugins de l’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins intégrés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

Les installations packagées et les images Docker résolvent normalement les Plugins intégrés à partir de
l’arborescence compilée `dist/extensions`. Si un répertoire source de Plugin intégré est
monté en bind sur le chemin source packagé correspondant, par exemple
`/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté
comme un overlay de source intégrée et le découvre avant le bundle
packagé `/app/dist/extensions/synology-chat`. Cela permet aux boucles mainteneur en conteneur
de fonctionner sans repasser chaque Plugin intégré en source TypeScript.
Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les bundles dist packagés
même lorsque des montages overlay source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les Plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les Plugins d’origine workspace sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les Plugins intégrés suivent l’ensemble intégré activé par défaut sauf remplacement
- Les slots exclusifs peuvent forcer l’activation du Plugin sélectionné pour ce slot
- Certains Plugins intégrés opt-in sont activés automatiquement lorsque la configuration nomme une
  surface possédée par le Plugin, telle qu’une référence de modèle fournisseur, une configuration de canal, ou un runtime de harnais
- Les routes Codex de la famille OpenAI conservent des frontières de Plugin séparées :
  `openai-codex/*` appartient au Plugin OpenAI, tandis que le Plugin intégré
  app-server Codex est sélectionné par `agentRuntime.id: "codex"` ou les anciennes
  références de modèle `codex/*`

## Dépannage des hooks runtime

Si un Plugin apparaît dans `plugins list` mais que les effets de bord `register(api)` ou les hooks
ne s’exécutent pas dans le trafic de discussion live, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL active de la
  Gateway, le profil, le chemin de configuration, et le processus sont bien ceux que vous modifiez.
- Redémarrez la Gateway live après les changements de Plugin/install/config/code. Dans les
  conteneurs wrapper, PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non intégrés tels que
  `llm_input`,
  `llm_output`, `before_agent_finalize`, et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la résolution
  de modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle a produit une sortie assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les surfaces
  session/status de la Gateway et, lors du débogage des payloads fournisseur, démarrez
  la Gateway avec `--raw-stream --raw-stream-path <path>`.

### Propriété du canal ou de l’outil en doublon

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Cela signifie que plus d’un Plugin activé essaie de posséder le même canal,
le même flux de setup, ou le même nom d’outil. La cause la plus courante est un Plugin de canal externe
installé à côté d’un Plugin intégré qui fournit maintenant le même id de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque Plugin activé
  et son origine.
- Exécutez `openclaw plugins inspect <id> --json` pour chaque Plugin suspect et
  comparez `channels`, `channelConfigs`, `tools`, et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après l’installation ou la suppression de
  packages de Plugin afin que les métadonnées persistées reflètent l’installation actuelle.
- Redémarrez la Gateway après les changements d’installation, de registre, ou de configuration.

Options de correction :

- Si un Plugin remplace intentionnellement un autre pour le même id de canal, le
  Plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec
  l’id du Plugin de priorité inférieure. Voir [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez l’un des deux avec
  `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation
  de Plugin obsolète.
- Si vous avez explicitement activé les deux Plugins, OpenClaw conserve cette requête et
  signale le conflit. Choisissez un propriétaire pour le canal ou renommez les
  outils possédés par le Plugin afin que la surface runtime soit sans ambiguïté.

## Slots de Plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" pour désactiver
      contextEngine: "legacy", // ou un id de Plugin
    },
  },
}
```

| Slot            | Ce qu’il contrôle         | Valeur par défaut     |
| --------------- | ------------------------- | --------------------- |
| `memory`        | Plugin mémoire actif      | `memory-core`         |
| `contextEngine` | Moteur de contexte actif  | `legacy` (intégré)    |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # uniquement les Plugins activés
openclaw plugins list --verbose            # lignes de détail par Plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau sur toute la flotte
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspecter l’état du registre persisté
openclaw plugins registry --refresh        # reconstruire le registre persisté
openclaw doctor --fix                      # réparer l’état du registre de Plugins

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser une installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le développement
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # mettre à jour un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer la configuration et les enregistrements d’index du Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les Plugins intégrés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs vocaux intégrés, et le plugin navigateur
intégré). D’autres Plugins intégrés nécessitent quand même `openclaw plugins enable <id>`.

`--force` écrase en place un Plugin ou hook pack installé existant. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des Plugins npm
suivis. Ce n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de recopier sur une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du
Plugin installé à cette liste d’autorisation avant de l’activer. Si le même id de Plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée deny obsolète afin que l’installation explicite soit immédiatement chargeable après redémarrage.

OpenClaw conserve un registre local persisté des Plugins comme modèle de lecture à froid pour
l’inventaire des Plugins, la propriété des contributions, et la planification du démarrage. Les flux install, update,
uninstall, enable, et disable actualisent ce registre après toute modification de l’état du Plugin.
Le même fichier `plugins/installs.json` conserve des métadonnées d’installation durables dans le niveau supérieur `installRecords` et des métadonnées de manifeste reconstructibles dans `plugins`. Si
le registre est manquant, obsolète, ou invalide, `openclaw plugins registry
--refresh` reconstruit sa vue du manifeste à partir des enregistrements d’installation, de la politique de configuration, et des métadonnées de manifeste/package, sans charger les modules runtime de Plugin.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de Plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version replace une installation exacte épinglée vers la
ligne de release par défaut du registre. Si le Plugin npm installé correspond déjà à
la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation, ni réécriture de configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, parce que
les installations marketplace persistent des métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement break-glass pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de Plugin de continuer malgré les findings intégrés `critical`, mais il ne contourne
toujours pas les blocs de politique `before_install` du Plugin ni le blocage en cas d’échec d’analyse.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de Plugins. Les installations de dépendances de Skills soutenues par la Gateway utilisent à la place le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux `plugin list/inspect/enable/disable`.
La prise en charge runtime actuelle inclut les bundles de Skills, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers`
déclarées par manifeste, les command-skills Cursor, et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` rapporte aussi les capacités de bundle détectées ainsi que
les entrées de serveur MCP et LSP prises en charge ou non prises en charge pour les Plugins soutenus par bundle.

Les sources marketplace peuvent être un nom de marketplace connu Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub, ou une URL git. Pour les marketplaces distants, les entrées de Plugin doivent rester dans le
dépôt marketplace cloné et n’utiliser que des sources de chemin relatif.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API Plugin

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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation
du Plugin. Le chargeur revient toujours à `activate(api)` pour les anciens Plugins,
mais les Plugins intégrés et les nouveaux Plugins externes doivent traiter `register` comme le contrat public.

`api.registrationMode` indique à un Plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation runtime. Enregistrer outils, hooks, services, commandes, routes, et autres effets de bord live.                     |
| `discovery`     | Découverte en lecture seule des capacités. Enregistrer fournisseurs et métadonnées ; le code d’entrée du Plugin de confiance peut se charger, mais ignorer les effets de bord live. |
| `setup-only`    | Chargement des métadonnées de setup de canal via une entrée légère de setup.                                                     |
| `setup-runtime` | Chargement du setup de canal qui nécessite aussi l’entrée runtime.                                                               |
| `cli-metadata`  | Collecte uniquement des métadonnées de commandes CLI.                                                                            |

Les entrées de Plugin qui ouvrent des sockets, bases de données, workers d’arrière-plan, ou clients longue durée
doivent protéger ces effets de bord avec `api.registrationMode === "full"`.
Les chargements de découverte sont mis en cache séparément des chargements d’activation et ne remplacent
pas le registre de la Gateway en cours d’exécution. La découverte est non activante, pas sans import :
OpenClaw peut évaluer l’entrée de Plugin de confiance ou le module de Plugin de canal pour construire
l’instantané. Gardez les niveaux supérieurs des modules légers et sans effets de bord, et déplacez les
clients réseau, sous-processus, écouteurs, lectures d’identifiants, et démarrages de service
derrière les chemins runtime complets.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre        |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM) |
| `registerChannel`                       | Canal de discussion          |
| `registerTool`                          | Outil d’agent                |
| `registerHook` / `on(...)`              | Hooks de cycle de vie        |
| `registerSpeechProvider`                | Synthèse vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex       |
| `registerMediaUnderstandingProvider`    | Analyse image/audio          |
| `registerImageGenerationProvider`       | Génération d’images          |
| `registerMusicGenerationProvider`       | Génération de musique        |
| `registerVideoGenerationProvider`       | Génération de vidéos         |
| `registerWebFetchProvider`              | Fournisseur web fetch / scrape |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | Point de terminaison HTTP    |
| `registerCommand` / `registerCli`       | Commandes CLI                |
| `registerContextEngine`                 | Moteur de contexte           |
| `registerService`                       | Service d’arrière-plan       |

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un bloc précédent.
- `before_install` : `{ block: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un bloc précédent.
- `message_sending` : `{ cancel: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation précédente.

Les exécutions app-server Codex natives relient les événements d’outils natifs Codex à cette
surface de hooks. Les Plugins peuvent bloquer les outils natifs Codex via `before_tool_call`,
observer les résultats via `after_tool_call`, et participer aux approbations
`PermissionRequest` de Codex. Le pont ne réécrit pas encore les arguments des outils natifs Codex. La frontière exacte de prise en charge runtime Codex se trouve dans le
[contrat de prise en charge Codex harness v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Associé

- [Construire des Plugins](/fr/plugins/building-plugins) — créer votre propre Plugin
- [Bundles de Plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma de manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un Plugin
- [Internals des Plugins](/fr/plugins/architecture) — modèle de capacité et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
