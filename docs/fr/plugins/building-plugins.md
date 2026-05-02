---
read_when:
    - Vous souhaitez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous ajoutez un nouveau canal, fournisseur, outil ou une autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Création de plugins
x-i18n:
    generated_at: "2026-05-02T07:13:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
voix, transcription en temps réel, voix en temps réel, compréhension multimédia, génération
d’images, génération de vidéos, récupération web, recherche web, outils d’agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub, puis
revient automatiquement à npm pour les paquets qui utilisent encore la distribution npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Familiarité avec TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` exécuté. Le développement de plugins depuis une copie de travail source est uniquement compatible avec pnpm, car OpenClaw charge les plugins groupés depuis les paquets d’espace de travail `extensions/*`.

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou endpoint personnalisé)
  </Card>
  <Card title="Plugin d’outil / de hook" icon="wrench" href="/fr/plugins/hooks">
    Enregistrer des outils d’agent, des hooks d’événement ou des services — continuez ci-dessous
  </Card>
</CardGroup>

Pour un plugin de canal dont l’installation n’est pas garantie lorsque l’onboarding/la configuration
s’exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Il produit une paire adaptateur de configuration + assistant
qui annonce l’exigence d’installation et échoue de manière fermée sur les véritables écritures de configuration
jusqu’à ce que le plugin soit installé.

## Démarrage rapide : plugin d’outil

Ce guide crée un plugin minimal qui enregistre un outil d’agent. Les plugins de canal
et de fournisseur disposent de guides dédiés liés ci-dessus.

<Steps>
  <Step title="Créer le paquet et le manifeste">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Chaque plugin a besoin d’un manifeste, même sans configuration. Les outils enregistrés à l’exécution
    doivent être listés dans `contracts.tools` afin qu’OpenClaw puisse découvrir le plugin propriétaire
    sans charger l’environnement d’exécution de chaque plugin. Les plugins doivent aussi déclarer
    `activation.onStartup` intentionnellement. Cet exemple le définit à `true`. Consultez
    [Manifeste](/fr/plugins/manifest) pour le schéma complet. Les snippets de publication ClawHub canoniques
    se trouvent dans `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Écrire le point d’entrée">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` est destiné aux plugins qui ne sont pas des canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour les options complètes de point d’entrée, consultez [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications de paquets simples comme
    `@myorg/openclaw-my-plugin` ; npm reste une solution de repli pour les paquets qui n’ont
    pas encore migré vers ClawHub.

    **Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins groupés — découverte automatiquement.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités des plugins

Un seul plugin peut enregistrer n’importe quel nombre de capacités via l’objet `api` :

| Capacité               | Méthode d’enregistrement                         | Guide détaillé                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence de texte (LLM) | `api.registerProvider(...)`                    | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)                         |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | [Backends CLI](/fr/gateway/cli-backends)                                           |
| Canal / messagerie     | `api.registerChannel(...)`                       | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                                |
| Voix (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension multimédia | `api.registerMediaUnderstandingProvider(...)`  | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images    | `api.registerImageGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de vidéos   | `api.registerVideoGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web       | `api.registerWebFetchProvider(...)`              | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web          | `api.registerWebSearchProvider(...)`             | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de résultat d’outil | `api.registerAgentToolResultMiddleware(...)` | [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api)                 |
| Outils d’agent         | `api.registerTool(...)`                          | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                     | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/fr/plugins/hooks)                                               |
| Hooks d’événements internes | `api.registerHook(...)`                    | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Routes HTTP            | `api.registerHttpRoute(...)`                     | [Internes](/fr/plugins/architecture-internals#gateway-http-routes)                 |
| Sous-commandes CLI     | `api.registerCli(...)`                           | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |

Pour l’API d’enregistrement complète, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api).

Les plugins groupés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
doivent réécrire de manière asynchrone les résultats d’outil avant que le modèle voie la sortie. Déclarez les
environnements d’exécution ciblés dans `contracts.agentToolResultMiddleware`, par exemple
`["pi", "codex"]`. Il s’agit d’une interface de confiance pour plugins groupés ; les plugins
externes doivent privilégier les hooks de plugin OpenClaw standard, sauf si OpenClaw ajoute une
politique de confiance explicite pour cette capacité.

Si votre plugin enregistre des méthodes RPC de gateway personnalisées, conservez-les sous un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un plugin demande une portée plus étroite.

Sémantique des protections de hook à garder à l’esprit :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme une absence de décision.
- `before_tool_call` : `{ requireApproval: true }` suspend l’exécution de l’agent et demande l’approbation de l’utilisateur via la surcouche d’approbation d’exécution, les boutons Telegram, les interactions Discord ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme une absence de décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme une absence de décision.
- `message_received` : privilégiez le champ typé `threadId` lorsque vous avez besoin de router les fils/sujets entrants. Conservez `metadata` pour les extras propres au canal.
- `message_sending` : privilégiez les champs de routage typés `replyToId` / `threadId` plutôt que les clés de métadonnées propres au canal.

La commande `/approve` gère à la fois les approbations d’exécution et de plugin avec une solution de repli bornée : lorsqu’un identifiant d’approbation d’exécution est introuvable, OpenClaw réessaie le même identifiant via les approbations de plugin. Le transfert des approbations de plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une plomberie d’approbation personnalisée doit détecter ce même cas de repli borné,
privilégiez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
plutôt que de faire correspondre manuellement des chaînes d’expiration d’approbation.

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples et la référence des hooks.

## Enregistrement d’outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou facultatifs (activation par l’utilisateur) :

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Chaque outil enregistré avec `api.registerTool(...)` doit également être déclaré dans le
manifeste du plugin :

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Les utilisateurs activent les outils facultatifs dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils du cœur (les conflits sont ignorés)
- Les outils dont les objets d’enregistrement sont mal formés, y compris ceux auxquels il manque `parameters`, sont ignorés et signalés dans les diagnostics du plugin au lieu d’interrompre les exécutions d’agents
- Utilisez `optional: true` pour les outils avec effets de bord ou exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un plugin en ajoutant l’id du plugin à `tools.allow`

## Enregistrer des commandes CLI

Les plugins peuvent ajouter des groupes de commandes racine `openclaw` avec `api.registerCli`. Fournissez des
`descriptors` pour chaque racine de commande de premier niveau afin qu’OpenClaw puisse afficher et acheminer
la commande sans charger avec empressement chaque runtime de plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Après l’installation, vérifiez l’enregistrement du runtime et exécutez la commande :

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Conventions d’importation

Importez toujours depuis des chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview).

Dans votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les importations internes — n’importez jamais votre propre plugin via son chemin SDK.

Pour les plugins fournisseurs, conservez les helpers propres au fournisseur dans ces barrels
à la racine du package, sauf si la jonction est véritablement générique. Exemples groupés actuels :

- Anthropic : wrappers de flux Claude et helpers `service_tier` / bêta
- OpenAI : constructeurs de fournisseur, helpers de modèle par défaut, fournisseurs en temps réel
- OpenRouter : constructeur de fournisseur plus helpers d’onboarding/configuration

Si un helper n’est utile qu’à l’intérieur d’un seul package fournisseur groupé, conservez-le sur cette
jonction à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines jonctions de helpers générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour
la maintenance des plugins groupés lorsqu’elles ont un usage propriétaire suivi. Traitez-les comme
des surfaces réservées, et non comme le modèle par défaut pour les nouveaux plugins tiers.

## Liste de vérification avant soumission

<Check>**package.json** possède les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Toutes les importations utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les importations internes utilisent des modules locaux, pas des auto-importations SDK</Check>
<Check>Les tests réussissent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (plugins dans le dépôt)</Check>

## Tests de version bêta

1. Surveillez les tags de publication GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez également activer les notifications du compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de publication.
2. Testez votre plugin avec le tag bêta dès son apparition. La fenêtre avant la version stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests, avec soit `all good`, soit ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Mettez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue dans la PR ainsi que dans votre fil Discord. Les contributeurs ne peuvent pas ajouter de labels aux PR, le titre sert donc de signal côté PR pour les mainteneurs et l’automatisation. Les bloqueurs avec une PR sont fusionnés ; les bloqueurs sans PR peuvent tout de même être livrés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie que tout est vert. Si vous manquez la fenêtre, votre correctif arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la carte d’importation et de l’API d’enregistrement
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
- [Manifeste](/fr/plugins/manifest) — format du manifeste de plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de plugins de fournisseur
