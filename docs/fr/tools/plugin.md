---
read_when:
    - Installation ou configuration de plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Utilisation de bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T13:59:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, Skills, parole, transcription en temps réel, voix en temps
réel, compréhension multimédia, génération d’images, génération de vidéos, récupération web, recherche web,
et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes** (publiés sur npm par la communauté).

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
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer la Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configurez ensuite sous `plugins.entries.\<id\>.config` dans votre fichier de config.

  </Step>
</Steps>

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local, `clawhub:<pkg>` explicite, ou
spécification de package nue (ClawHub d’abord, puis repli sur npm).

Si la config est invalide, l’installation échoue normalement de façon sécurisée et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin intégré pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas de manière anticipée tout l’arbre des dépendances d’exécution
de chaque plugin intégré. Lorsqu’un plugin intégré détenu par OpenClaw est actif depuis la
config du plugin, une ancienne config de canal ou un manifeste activé par défaut, le démarrage
ne répare que les dépendances d’exécution déclarées de ce plugin avant de l’importer.
La désactivation explicite l’emporte toujours : `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, et `channels.<id>.enabled: false`
empêchent la réparation automatique des dépendances d’exécution intégrées pour ce plugin/canal.
Les plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                  | Exemples                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module d’exécution ; s’exécute dans le même processus | Plugins officiels, packages npm de la communauté |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/fr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/fr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/fr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/fr/plugins/zalouser)   |

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
    - `memory-core` — recherche mémoire intégrée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin navigateur intégré pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime navigateur et le service de contrôle navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
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
| `allow`          | Liste d’autorisation des plugins (facultatif)             |
| `deny`           | Liste de refus des plugins (facultatif ; le refus l’emporte) |
| `load.paths`     | Fichiers/répertoires de plugin supplémentaires            |
| `slots`          | Sélecteurs d’emplacements exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + config par plugin                              |

Les changements de config **nécessitent un redémarrage de la gateway**. Si la Gateway fonctionne avec surveillance de config
+ redémarrage dans le processus activé (le chemin par défaut `openclaw gateway`), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la config.
Il n’existe pas de chemin pris en charge de rechargement à chaud pour le code d’exécution natif des plugins ni pour les hooks
de cycle de vie ; redémarrez le processus Gateway qui sert le canal en direct avant
d’attendre que le code `register(api)` mis à jour, les hooks `api.on(...)`, les outils, services ou
hooks fournisseur/runtime s’exécutent.

`openclaw plugins list` est un instantané local CLI/config. Un plugin `loaded`
à cet endroit signifie que le plugin est détectable et chargeable à partir de la config/des fichiers vus par cette
invocation CLI. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution
a redémarré sur le même code de plugin. Sur des configurations VPS/conteneur avec processus enveloppants,
envoyez les redémarrages au véritable processus `openclaw gateway run`, ou utilisez
`openclaw gateway restart` contre la Gateway en cours d’exécution.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La config est conservée.
  - **Manquant** : la config référence un ID de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa config ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (le premier trouvé l’emporte) :

<Steps>
  <Step title="Chemins de config">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire.
  </Step>

  <Step title="Plugins de l’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins intégrés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, voix).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins issus de l’espace de travail sont **désactivés par défaut** (doivent être explicitement activés)
- Les plugins intégrés suivent l’ensemble intégré activé par défaut sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du plugin sélectionné pour cet emplacement
- Certains plugins intégrés opt-in sont activés automatiquement lorsque la config nomme une
  surface détenue par le plugin, telle qu’une référence de modèle fournisseur, une config de canal ou un
  runtime de harnais
- Les routes Codex de la famille OpenAI conservent des limites de plugin distinctes :
  `openai-codex/*` appartient au plugin OpenAI, tandis que le plugin intégré de serveur d’application Codex
  est sélectionné par `embeddedHarness.runtime: "codex"` ou les anciennes références de modèle
  `codex/*`

## Dépannage des hooks d’exécution

Si un plugin apparaît dans `plugins list` mais que les effets de bord ou hooks `register(api)`
ne s’exécutent pas dans le trafic de chat en direct, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL de Gateway active,
  le profil, le chemin de config et le processus sont bien ceux que vous modifiez.
- Redémarrez la Gateway active après des changements d’installation/config/code de plugin. Dans des
  conteneurs enveloppants, PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et les
  diagnostics. Les hooks de conversation non intégrés comme `llm_input`,
  `llm_output`, et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le basculement de modèle, préférez `before_model_resolve`. Il s’exécute avant la résolution du modèle
  pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle a produit une sortie assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les surfaces Gateway de session/statut et, lors du débogage des charges utiles fournisseur, démarrez
  la Gateway avec `--raw-stream --raw-stream-path <path>`.

## Emplacements de plugins (catégories exclusives)

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
| `memory`        | Plugin mémoire actif   | `memory-core`       |
| `contextEngine` | Moteur de contexte actif | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # uniquement les plugins chargés
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau à l’échelle du parc
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser une installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # mettre à jour un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements de config/installation
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins intégrés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs vocaux intégrés et le plugin navigateur
intégré). D’autres plugins intégrés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin ou pack de hooks déjà installé. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Ce n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’ID du
plugin installé à cette liste d’autorisation avant de l’activer, afin que les installations soient
immédiatement chargeables après redémarrage.

`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Transmettre
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement du plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Transmettre le nom du package sans version fait revenir une installation épinglée exacte vers
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation ni réécriture de config.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations marketplace persistent les métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est une dérogation de secours pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de plugins
de continuer malgré les résultats intégrés `critical`, mais il
ne contourne toujours pas les blocages de politique `before_install` des plugins ni le blocage en cas d’échec du scan.

Cet indicateur CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills soutenues par Gateway utilisent à la place la dérogation de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux distinct de téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux list/inspect/enable/disable des plugins.
La prise en charge actuelle à l’exécution comprend les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers`
déclarées par manifeste, les command-skills Cursor, et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées de serveur MCP et LSP prises en charge ou non pour les plugins basés sur des bundles.

Les sources marketplace peuvent être un nom de marketplace Claude connu issu de
`~/.claude/plugins/known_marketplaces.json`, une racine marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub, ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester dans le dépôt marketplace cloné et utiliser uniquement des sources de chemin relatives.

Consultez la [`référence CLI openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API Plugin

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
plugins peuvent encore utiliser `activate(api)` comme alias historique, mais les nouveaux plugins doivent
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du plugin.
Le chargeur continue de revenir à `activate(api)` pour les anciens plugins,
mais les plugins intégrés et les nouveaux plugins externes doivent considérer `register` comme le contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation du runtime. Enregistrez les outils, hooks, services, commandes, routes et autres effets de bord actifs.              |
| `discovery`     | Découverte en lecture seule des capacités. Enregistrez les fournisseurs et métadonnées ; le code d’entrée de plugin de confiance peut être chargé, mais évitez les effets de bord actifs. |
| `setup-only`    | Chargement des métadonnées de configuration du canal via une entrée légère de configuration.                                      |
| `setup-runtime` | Chargement de configuration du canal qui a aussi besoin de l’entrée runtime.                                                      |
| `cli-metadata`  | Collecte des métadonnées de commande CLI uniquement.                                                                              |

Les entrées de plugin qui ouvrent des sockets, bases de données, workers d’arrière-plan ou clients
longue durée doivent protéger ces effets de bord avec `api.registrationMode === "full"`.
Les chargements de découverte sont mis en cache séparément des chargements d’activation et ne remplacent
pas le registre de la Gateway en cours d’exécution. La découverte est non activante, pas sans import :
OpenClaw peut évaluer l’entrée de plugin de confiance ou le module de plugin de canal pour construire
l’instantané. Gardez les niveaux supérieurs des modules légers et sans effets de bord, et déplacez
les clients réseau, sous-processus, écouteurs, lectures d’identifiants et démarrage de services
derrière les chemins de runtime complet.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre        |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM) |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Outil d’agent                |
| `registerHook` / `on(...)`              | Hooks de cycle de vie        |
| `registerSpeechProvider`                | Synthèse vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex       |
| `registerMediaUnderstandingProvider`    | Analyse image/audio          |
| `registerImageGenerationProvider`       | Génération d’images          |
| `registerMusicGenerationProvider`       | Génération musicale          |
| `registerVideoGenerationProvider`       | Génération vidéo             |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web                |
| `registerHttpRoute`                     | Point de terminaison HTTP    |
| `registerCommand` / `registerCli`       | Commandes CLI                |
| `registerContextEngine`                 | Moteur de contexte           |
| `registerService`                       | Service d’arrière-plan       |

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est sans effet et n’annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est sans effet et n’annule pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les handlers de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est sans effet et n’annule pas une annulation antérieure.

Le serveur d’application Codex natif exécute un pont des événements d’outils natifs Codex vers cette
surface de hooks. Les plugins peuvent bloquer les outils natifs Codex via `before_tool_call`,
observer les résultats via `after_tool_call`, et participer aux approbations
`PermissionRequest` de Codex. Le pont ne réécrit pas encore les
arguments des outils natifs Codex. La limite exacte de prise en charge du runtime Codex se trouve dans le
[contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Liens connexes

- [Créer des plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrement des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajoutez des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
