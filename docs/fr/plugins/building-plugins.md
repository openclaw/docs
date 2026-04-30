---
read_when:
    - Vous souhaitez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous ajoutez un nouveau canal, fournisseur, outil ou autre fonctionnalité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Développer des plugins
x-i18n:
    generated_at: "2026-04-30T07:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
parole, transcription en temps réel, voix en temps réel, compréhension des médias, génération
d’images, génération de vidéos, récupération web, recherche web, outils d’agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub et
se rabat automatiquement sur npm pour les paquets qui utilisent encore la distribution npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Maîtrise de TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` effectué

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / hook" icon="wrench" href="/fr/plugins/hooks">
    Enregistrer des outils d’agent, des hooks d’événement ou des services — continuez ci-dessous
  </Card>
</CardGroup>

Pour un plugin de canal dont l’installation n’est pas garantie au moment de
l’onboarding/de la configuration, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Il produit une paire adaptateur de configuration + assistant
qui annonce l’exigence d’installation et échoue de manière fermée lors des vraies écritures de configuration
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

    Chaque plugin a besoin d’un manifeste, même sans configuration, et chaque plugin doit
    déclarer `activation.onStartup` intentionnellement. Les outils enregistrés à l’exécution nécessitent
    une importation au démarrage, cet exemple le définit donc sur `true`. Consultez
    [Manifeste](/fr/plugins/manifest) pour le schéma complet. Les extraits de publication ClawHub
    canoniques se trouvent dans `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` sert aux plugins qui ne sont pas des canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour les options complètes du point d’entrée, consultez [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications de paquets simples comme
    `@myorg/openclaw-my-plugin`; npm reste un repli pour les paquets qui n’ont
    pas encore migré vers ClawHub.

    **Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins intégrés — découverte automatique.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités des plugins

Un seul plugin peut enregistrer n’importe quel nombre de capacités via l’objet `api` :

| Capacité               | Méthode d’enregistrement                         | Guide détaillé                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence de texte (LLM) | `api.registerProvider(...)`                    | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)                         |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | [Backends CLI](/fr/gateway/cli-backends)                                           |
| Canal / messagerie     | `api.registerChannel(...)`                       | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                                |
| Parole (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`  | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
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

Les plugins intégrés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
doivent réécrire de façon asynchrone les résultats d’outil avant que le modèle voie la sortie. Déclarez les
runtimes ciblés dans `contracts.agentToolResultMiddleware`, par exemple
`["pi", "codex"]`. Il s’agit d’une interface de confiance pour plugins intégrés ; les plugins
externes doivent préférer les hooks de plugin OpenClaw ordinaires, sauf si OpenClaw ajoute une
politique de confiance explicite pour cette capacité.

Si votre plugin enregistre des méthodes RPC Gateway personnalisées, conservez-les sous un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un plugin demande une portée plus étroite.

Sémantique des gardes de hook à garder en tête :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme une absence de décision.
- `before_tool_call` : `{ requireApproval: true }` met en pause l’exécution de l’agent et demande l’approbation de l’utilisateur via la superposition d’approbation exec, les boutons Telegram, les interactions Discord ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme une absence de décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme une absence de décision.
- `message_received` : préférez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Gardez `metadata` pour les éléments supplémentaires propres au canal.
- `message_sending` : préférez les champs de routage typés `replyToId` / `threadId` aux clés de métadonnées propres au canal.

La commande `/approve` gère à la fois les approbations exec et plugin avec un repli borné : lorsqu’un identifiant d’approbation exec est introuvable, OpenClaw réessaie le même identifiant via les approbations plugin. Le transfert des approbations plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une plomberie d’approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
au lieu de faire correspondre manuellement des chaînes d’expiration d’approbation.

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples et la référence des hooks.

## Enregistrer des outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être obligatoires (toujours
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

Les utilisateurs activent les outils facultatifs dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils du cœur (les conflits sont ignorés)
- Les outils avec des objets d’enregistrement mal formés, y compris l’absence de `parameters`, sont ignorés et signalés dans les diagnostics de plugin au lieu de casser les exécutions d’agent
- Utilisez `optional: true` pour les outils avec des effets de bord ou des exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un plugin en ajoutant l’identifiant du plugin à `tools.allow`

## Conventions d’importation

Importez toujours depuis les chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview).

Dans votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour les
imports internes — n’importez jamais votre propre plugin via son chemin SDK.

Pour les plugins de fournisseur, conservez les helpers propres au fournisseur dans ces barrels
à la racine du package, sauf si le point d’extension est réellement générique. Exemples groupés actuels :

- Anthropic : wrappers de flux Claude et helpers `service_tier` / bêta
- OpenAI : constructeurs de fournisseur, helpers de modèle par défaut, fournisseurs temps réel
- OpenRouter : constructeur de fournisseur ainsi que helpers d’onboarding/configuration

Si un helper n’est utile qu’à l’intérieur d’un seul package de fournisseur groupé, conservez-le sur ce
point d’extension à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certains points d’extension helper générés `openclaw/plugin-sdk/<bundled-id>` existent encore pour
la maintenance des plugins groupés lorsqu’ils ont un usage propriétaire suivi. Considérez-les comme
des surfaces réservées, pas comme le modèle par défaut pour les nouveaux plugins tiers.

## Liste de vérification avant soumission

<Check>**package.json** contient les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests réussissent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (plugins dans le dépôt)</Check>

## Tests de version bêta

1. Surveillez les tags de version GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications du compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de version.
2. Testez votre plugin avec le tag bêta dès son apparition. La fenêtre avant la version stable ne dure généralement que quelques heures.
3. Publiez dans le fil de votre plugin sur le canal Discord `plugin-forum` après les tests, avec `all good` ou ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Ajoutez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas appliquer de labels aux PR, le titre est donc le signal côté PR pour les mainteneurs et l’automatisation. Les blocages avec une PR sont fusionnés ; ceux sans PR peuvent tout de même être publiés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie que tout est vert. Si vous manquez la fenêtre, votre correctif sera probablement intégré au cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèle
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la carte d’imports et de l’API d’enregistrement
  </Card>
  <Card title="Helpers d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
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

- [Architecture des plugins](/fr/plugins/architecture) — exploration approfondie de l’architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
- [Manifeste](/fr/plugins/manifest) — format du manifeste de plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de plugins de fournisseur
