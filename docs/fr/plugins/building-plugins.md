---
read_when:
    - Vous voulez créer un nouveau plugin OpenClaw
    - Vous avez besoin d’un démarrage rapide pour le développement de plugins
    - Vous ajoutez un nouveau canal, fournisseur, outil ou autre fonctionnalité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier plugin OpenClaw en quelques minutes
title: Création de plugins
x-i18n:
    generated_at: "2026-04-25T13:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Les plugins étendent OpenClaw avec de nouvelles fonctionnalités : canaux, fournisseurs de modèles,
parole, transcription en temps réel, voix en temps réel, compréhension des médias, génération d’images,
génération vidéo, récupération web, recherche web, outils d’agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) ou npm et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub et
se replie automatiquement sur npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Connaissance de TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` exécuté

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connectez OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajoutez un fournisseur de modèle (LLM, proxy ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / de hook" icon="wrench" href="/fr/plugins/hooks">
    Enregistrez des outils d’agent, des hooks d’événement ou des services — continuez ci-dessous
  </Card>
</CardGroup>

Pour un plugin de canal dont l’installation n’est pas garantie lorsque les flux d’onboarding/setup
s’exécutent, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Cela produit une paire adaptateur d’installation + assistant
qui annonce l’exigence d’installation et échoue en mode fermé sur les écritures réelles de configuration
tant que le plugin n’est pas installé.

## Démarrage rapide : plugin d’outil

Ce guide crée un plugin minimal qui enregistre un outil d’agent. Les plugins de canal
et de fournisseur ont des guides dédiés liés ci-dessus.

<Steps>
  <Step title="Créer le package et le manifeste">
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Chaque plugin a besoin d’un manifeste, même sans configuration. Voir
    [Manifest](/fr/plugins/manifest) pour le schéma complet. Les extraits canoniques de publication ClawHub
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

    `definePluginEntry` est destiné aux plugins non liés aux canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour toutes les options de point d’entrée, voir [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications de package simples comme
    `@myorg/openclaw-my-plugin`.

    **Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des plugins inclus — ils seront découverts automatiquement.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Fonctionnalités des plugins

Un seul plugin peut enregistrer un nombre quelconque de fonctionnalités via l’objet `api` :

| Fonctionnalité         | Méthode d’enregistrement                         | Guide détaillé                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence textuelle (LLM) | `api.registerProvider(...)`                   | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)                         |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | [Backends CLI](/fr/gateway/cli-backends)                                           |
| Canal / messagerie     | `api.registerChannel(...)`                       | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                                |
| Parole (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`  | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images    | `api.registerImageGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération musicale    | `api.registerMusicGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération vidéo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web       | `api.registerWebFetchProvider(...)`              | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web          | `api.registerWebSearchProvider(...)`             | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de résultat d’outil | `api.registerAgentToolResultMiddleware(...)` | [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api)              |
| Outils d’agent         | `api.registerTool(...)`                          | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                     | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/fr/plugins/hooks)                                               |
| Hooks d’événement internes | `api.registerHook(...)`                      | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Routes HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/fr/plugins/architecture-internals#gateway-http-routes)                |
| Sous-commandes CLI     | `api.registerCli(...)`                           | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |

Pour l’API complète d’enregistrement, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api).

Les plugins inclus peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
ont besoin d’une réécriture asynchrone du résultat d’outil avant que le modèle ne voie la sortie. Déclarez les
runtimes ciblés dans `contracts.agentToolResultMiddleware`, par exemple
`["pi", "codex"]`. Il s’agit d’une couture de confiance réservée aux plugins inclus ; les plugins externes
devraient préférer les hooks de plugin OpenClaw réguliers sauf si OpenClaw étend une
politique de confiance explicite pour cette fonctionnalité.

Si votre plugin enregistre des méthodes RPC Gateway personnalisées, conservez-les sous un
préfixe spécifique au plugin. Les espaces de noms d’administration cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un plugin demande une portée plus étroite.

Sémantique des gardes de hook à garder à l’esprit :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme aucune décision.
- `before_tool_call` : `{ requireApproval: true }` met l’exécution de l’agent en pause et invite l’utilisateur à approuver via la surcouche d’approbation d’exécution, les boutons Telegram, les interactions Discord, ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme aucune décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme aucune décision.
- `message_received` : préférez le champ typé `threadId` lorsque vous avez besoin du routage entrant par fil/sujet. Gardez `metadata` pour les extras spécifiques au canal.
- `message_sending` : préférez les champs de routage typés `replyToId` / `threadId` aux clés de métadonnées spécifiques au canal.

La commande `/approve` gère à la fois les approbations d’exécution et de plugin avec un repli borné : lorsqu’un identifiant d’approbation d’exécution est introuvable, OpenClaw réessaie le même identifiant via les approbations de plugin. Le transfert d’approbation de plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une mécanique d’approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
plutôt que de faire correspondre manuellement des chaînes d’expiration d’approbation.

Voir [Hooks de plugin](/fr/plugins/hooks) pour des exemples et la référence des hooks.

## Enregistrement d’outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou facultatifs (opt-in utilisateur) :

```typescript
register(api) {
  // Outil requis — toujours disponible
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Outil facultatif — l’utilisateur doit l’ajouter à la liste d’autorisations
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

Les utilisateurs activent les outils facultatifs dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils cœur (les conflits sont ignorés)
- Utilisez `optional: true` pour les outils avec effets secondaires ou exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un plugin en ajoutant l’identifiant du plugin à `tools.allow`

## Conventions d’import

Importez toujours depuis les chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Mauvais : racine monolithique (obsolète, sera supprimée)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview).

Dans votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n’importez jamais votre propre plugin via son chemin SDK.

Pour les plugins de fournisseur, conservez les helpers spécifiques au fournisseur dans ces fichiers
barrel à la racine du package sauf si la couture est réellement générique. Exemples inclus actuels :

- Anthropic : wrappers de flux Claude et helpers `service_tier` / bêta
- OpenAI : builders de fournisseurs, helpers de modèles par défaut, fournisseurs realtime
- OpenRouter : builder de fournisseur plus helpers d’onboarding/configuration

Si un helper n’est utile qu’à l’intérieur d’un seul package de fournisseur inclus, gardez-le sur cette
couture racine de package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines coutures de helpers générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour
la maintenance et la compatibilité des plugins inclus, par exemple
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Traitez-les comme des surfaces réservées,
et non comme le modèle par défaut pour les nouveaux plugins tiers.

## Checklist avant soumission

<Check>**package.json** possède les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (plugins dans le dépôt)</Check>

## Tests de release bêta

1. Surveillez les tags de release GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications pour le compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de release.
2. Testez votre plugin sur le tag bêta dès son apparition. La fenêtre avant la stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests avec soit `all good`, soit ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Placez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas étiqueter les PR, donc le titre est le signal côté PR pour les mainteneurs et l’automatisation. Les bloqueurs avec PR sont fusionnés ; les bloqueurs sans PR peuvent quand même être livrés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie vert. Si vous manquez la fenêtre, votre correctif arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créez un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créez un plugin de fournisseur de modèle
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Carte des imports et référence de l’API d’enregistrement
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et patterns de test
  </Card>
  <Card title="Manifeste de plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Voir aussi

- [Architecture des plugins](/fr/plugins/architecture) — analyse détaillée de l’architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
- [Manifest](/fr/plugins/manifest) — format du manifeste de plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de plugins de fournisseur
