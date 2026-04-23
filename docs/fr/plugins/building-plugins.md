---
read_when:
    - Vous voulez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous ajoutez un nouveau canal, fournisseur, outil ou autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Création de Plugins
x-i18n:
    generated_at: "2026-04-23T07:06:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Création de Plugins

Les Plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
parole, transcription temps réel, voix temps réel, compréhension média, génération d’images,
génération vidéo, récupération web, recherche web, outils agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre Plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) ou npm et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub puis
revient automatiquement à npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Familiarité avec TypeScript (ESM)
- Pour les Plugins dans le dépôt : dépôt cloné et `pnpm install` effectué

## Quel type de Plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / hook" icon="wrench">
    Enregistrer des outils agent, hooks d’événement ou services — voir la suite ci-dessous
  </Card>
</CardGroup>

Si un Plugin de canal est optionnel et peut ne pas être installé lorsque l’onboarding/la configuration
s’exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Il produit une paire adaptateur + assistant de configuration
qui annonce l’exigence d’installation et échoue de manière fermée sur les vraies écritures de configuration
jusqu’à l’installation du Plugin.

## Démarrage rapide : Plugin d’outil

Ce guide crée un Plugin minimal qui enregistre un outil agent. Les Plugins de canal
et de fournisseur disposent de guides dédiés liés ci-dessus.

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

    Chaque Plugin a besoin d’un manifeste, même sans configuration. Voir
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

    `definePluginEntry` est destiné aux Plugins non canal. Pour les canaux, utilisez
    `defineChannelPluginEntry` — voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour toutes les options du point d’entrée, voir [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications de package simples comme
    `@myorg/openclaw-my-plugin`.

    **Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des Plugins inclus — découverte automatique.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités de Plugin

Un seul Plugin peut enregistrer n’importe quel nombre de capacités via l’objet `api` :

| Capacité               | Méthode d’enregistrement                        | Guide détaillé                                                                 |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Inférence texte (LLM)  | `api.registerProvider(...)`                     | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)                        |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                  | [Backends CLI](/fr/gateway/cli-backends)                                          |
| Canal / messagerie     | `api.registerChannel(...)`                      | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                               |
| Parole (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix temps réel        | `api.registerRealtimeVoiceProvider(...)`        | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension média    | `api.registerMediaUnderstandingProvider(...)`   | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images    | `api.registerImageGenerationProvider(...)`      | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération musicale    | `api.registerMusicGenerationProvider(...)`      | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération vidéo       | `api.registerVideoGenerationProvider(...)`      | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web       | `api.registerWebFetchProvider(...)`             | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web          | `api.registerWebSearchProvider(...)`            | [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extension Pi intégrée  | `api.registerEmbeddedExtensionFactory(...)`     | [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api)                |
| Outils agent           | `api.registerTool(...)`                         | Ci-dessous                                                                     |
| Commandes personnalisées | `api.registerCommand(...)`                    | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |
| Hooks d’événement      | `api.registerHook(...)`                         | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |
| Routes HTTP            | `api.registerHttpRoute(...)`                    | [Internals](/fr/plugins/architecture#gateway-http-routes)                         |
| Sous-commandes CLI     | `api.registerCli(...)`                          | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |

Pour l’API d’enregistrement complète, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api).

Utilisez `api.registerEmbeddedExtensionFactory(...)` lorsqu’un Plugin a besoin de hooks
Pi natifs du runner intégré, comme la réécriture asynchrone `tool_result` avant l’émission du
message final de résultat d’outil. Préférez les hooks de Plugin OpenClaw ordinaires lorsque le
travail n’a pas besoin du timing d’extension Pi.

Si votre Plugin enregistre des méthodes RPC Gateway personnalisées, gardez-les sur un
préfixe spécifique au Plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un Plugin demande une portée plus étroite.

Sémantique des gardes de hooks à garder en tête :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme aucune décision.
- `before_tool_call` : `{ requireApproval: true }` suspend l’exécution de l’agent et demande une approbation à l’utilisateur via la surcouche d’approbation exec, les boutons Telegram, les interactions Discord ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme aucune décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme aucune décision.
- `message_received` : préférez le champ typé `threadId` lorsque vous avez besoin d’un routage de fil/sujet entrant. Réservez `metadata` aux extras spécifiques au canal.
- `message_sending` : préférez les champs de routage typés `replyToId` / `threadId` aux clés `metadata` spécifiques au canal.

La commande `/approve` gère à la fois les approbations exec et Plugin avec un repli borné : lorsqu’un identifiant d’approbation exec n’est pas trouvé, OpenClaw réessaie le même identifiant via les approbations de Plugin. Le transfert des approbations de Plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une logique d’approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
plutôt que de faire correspondre manuellement les chaînes d’expiration d’approbation.

Voir [Vue d’ensemble du SDK — sémantique de décision des hooks](/fr/plugins/sdk-overview#hook-decision-semantics) pour plus de détails.

## Enregistrement d’outils agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou optionnels (activation explicite de l’utilisateur) :

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

  // Outil optionnel — l’utilisateur doit l’ajouter à la liste d’autorisation
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

Les utilisateurs activent les outils optionnels dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils du cœur (les conflits sont ignorés)
- Utilisez `optional: true` pour les outils avec effets de bord ou exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un Plugin en ajoutant l’identifiant du Plugin à `tools.allow`

## Conventions d’import

Importez toujours depuis des chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Mauvais : racine monolithique (obsolète, sera supprimée)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview).

Dans votre Plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n’importez jamais votre propre Plugin via son chemin SDK.

Pour les Plugins de fournisseur, gardez les assistants spécifiques au fournisseur dans ces
barrels de racine de package sauf si l’interface est réellement générique. Exemples inclus actuels :

- Anthropic : wrappers de flux Claude et assistants `service_tier` / bêta
- OpenAI : constructeurs de fournisseurs, assistants de modèle par défaut, fournisseurs temps réel
- OpenRouter : constructeur de fournisseur plus assistants d’onboarding/configuration

Si un assistant n’est utile qu’à l’intérieur d’un seul package de fournisseur inclus, gardez-le sur cette
interface de racine de package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines interfaces d’assistance générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour la
maintenance et la compatibilité des Plugins inclus, par exemple
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Considérez-les comme des
surfaces réservées, et non comme le modèle par défaut pour les nouveaux Plugins tiers.

## Liste de vérification avant soumission

<Check>**package.json** a les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passe (Plugins dans le dépôt)</Check>

## Tests de version bêta

1. Surveillez les tags de release GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications pour le compte X officiel OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de release.
2. Testez votre Plugin contre le tag bêta dès son apparition. La fenêtre avant la stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre Plugin dans le canal Discord `plugin-forum` après le test avec soit `all good`, soit ce qui s’est cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Placez le lien vers l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas appliquer de labels aux PR, donc le titre sert de signal côté PR pour les mainteneurs et l’automatisation. Les blocages avec PR sont fusionnés ; les blocages sans PR peuvent quand même être expédiés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. L’absence de signal signifie vert. Si vous manquez la fenêtre, votre correctif arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un Plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un Plugin de fournisseur de modèles
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la table d’import et de l’API d’enregistrement
  </Card>
  <Card title="Assistants runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de Plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Voir aussi

- [Architecture des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
- [Manifest](/fr/plugins/manifest) — format du manifeste de Plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de Plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de Plugins de fournisseur
