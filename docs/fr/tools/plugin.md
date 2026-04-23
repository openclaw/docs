---
read_when:
    - Installer ou configurer des plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Travailler avec des bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T07:12:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, providers de modèles,
outils, Skills, parole, transcription temps réel, voix temps réel,
compréhension des médias, génération d’images, génération vidéo, récupération web,
recherche web, etc. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
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

  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```

    Puis configurez sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif en chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local, préfixe explicite
`clawhub:<pkg>`, ou spécification de package simple (ClawHub d’abord, puis repli npm).

Si la configuration est invalide, l’installation échoue normalement de manière fermée et vous redirige vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de Plugin groupé
pour les plugins qui activent
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas de manière eager tout l’arbre de dépendances runtime
de chaque Plugin groupé. Lorsqu’un Plugin groupé possédé par OpenClaw est actif depuis la
configuration de Plugin, une ancienne configuration de canal ou un manifeste activé par défaut,
le démarrage répare uniquement les dépendances runtime déclarées par ce Plugin avant de l’importer.
Les plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de Plugin :

| Format     | Fonctionnement                                                    | Exemples                                              |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Natif** | `openclaw.plugin.json` + module runtime ; s’exécute in-process    | Plugins officiels, packages npm communautaires        |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers les fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Plugin Bundles](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un Plugin natif, commencez par [Building Plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Package                | Documentation                        |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/fr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/fr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/fr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/fr/plugins/zalouser)   |

### Core (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Providers de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins mémoire">
    - `memory-core` — recherche mémoire groupée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Providers speech (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — Plugin navigateur groupé pour l’outil navigateur, la CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime navigateur et le service par défaut de contrôle du navigateur (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont Proxy VS Code Copilot (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Consultez [Community Plugins](/fr/plugins/community).

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
| `enabled`        | Interrupteur maître (par défaut : `true`)                  |
| `allow`          | Liste d’autorisation de plugins (facultatif)               |
| `deny`           | Liste de refus de plugins (facultatif ; deny l’emporte)    |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires            |
| `slots`          | Sélecteurs d’emplacements exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Basculements + configuration par Plugin                    |

Les modifications de configuration **nécessitent un redémarrage du gateway**. Si le Gateway s’exécute avec surveillance de configuration
+ redémarrage in-process activé (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La configuration est préservée.
  - **Manquant** : la configuration référence un ID de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites vers un fichier ou un répertoire.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins groupés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (providers de modèles, speech).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (doivent être explicitement activés)
- Les plugins groupés suivent l’ensemble intégré activé par défaut sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du plugin sélectionné pour cet emplacement

## Emplacements de Plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" pour désactiver
      contextEngine: "legacy", // ou un ID de plugin
    },
  },
}
```

| Emplacement     | Ce qu’il contrôle     | Par défaut          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin mémoire actif  | `memory-core`       |
| `contextEngine` | Moteur de contexte actif | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # seulement les plugins chargés
openclaw plugins list --verbose            # lignes détaillées par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détails approfondis
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau global
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser l’installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le développement
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # mettre à jour un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins groupés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les providers de modèles groupés, les providers speech groupés et le Plugin navigateur
groupé). D’autres plugins groupés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase en place un plugin ou un pack de hooks déjà installé. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Ce n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version fait revenir une installation exacte épinglée vers
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation ni réécriture de configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, parce que
les installations depuis la marketplace persistent les métadonnées de source de marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement de dernier recours pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de plugins de continuer au-delà des constats intégrés `critical`, mais il ne contourne toujours pas les blocages de politique `before_install` de Plugin ni les blocages dus à l’échec du scan.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent à la place le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux `plugins list/inspect/enable/disable`.
La prise en charge runtime actuelle inclut les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers` déclarés dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que les entrées de serveur MCP et LSP prises en charge ou non pour les plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connu Claude issu de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou
un chemin `marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub
ou une URL git. Pour les marketplaces distantes, les entrées de Plugin doivent rester à l’intérieur du
dépôt de marketplace cloné et utiliser uniquement des sources de chemin relatives.

Consultez la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API Plugin

Les plugins natifs exportent un objet d’entrée exposant `register(api)`. Les anciens
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
Le chargeur retombe encore sur `activate(api)` pour les anciens plugins,
mais les plugins groupés et les nouveaux plugins externes doivent traiter `register` comme le contrat public.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre       |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider de modèle (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Outil d’agent               |
| `registerHook` / `on(...)`              | Hooks de cycle de vie       |
| `registerSpeechProvider`                | Synthèse vocale / STT       |
| `registerRealtimeTranscriptionProvider` | STT en streaming            |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex      |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio       |
| `registerImageGenerationProvider`       | Génération d’image          |
| `registerMusicGenerationProvider`       | Génération musicale         |
| `registerVideoGenerationProvider`       | Génération vidéo            |
| `registerWebFetchProvider`              | Provider de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web               |
| `registerHttpRoute`                     | Point de terminaison HTTP   |
| `registerCommand` / `registerCli`       | Commandes CLI               |
| `registerContextEngine`                 | Moteur de contexte          |
| `registerService`                       | Service en arrière-plan     |

Comportement des gardes de hook pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Pour le comportement complet des hooks typés, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Liens connexes

- [Building Plugins](/fr/plugins/building-plugins) — créer votre propre plugin
- [Plugin Bundles](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Plugin Manifest](/fr/plugins/manifest) — schéma du manifeste
- [Registering Tools](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Plugin Internals](/fr/plugins/architecture) — modèle de capacité et pipeline de chargement
- [Community Plugins](/fr/plugins/community) — listes tierces
