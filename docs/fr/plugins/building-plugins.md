---
read_when:
    - Vous voulez créer un nouveau plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous ajoutez un nouveau canal, fournisseur, outil ou autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Créer des plugins
x-i18n:
    generated_at: "2026-05-04T02:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
parole, transcription en temps réel, voix en temps réel, compréhension des médias, génération
d’images, génération de vidéos, récupération web, recherche web, outils d’agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) et les utilisateurs l’installent avec
`openclaw plugins install clawhub:<package-name>`. Les spécifications de package nues
s’installent encore depuis npm pendant la transition de lancement.

## Prérequis

- Node >= 22 et un gestionnaire de packages (npm ou pnpm)
- Bonne connaissance de TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` effectué. Le développement
  de plugins depuis un checkout source utilise uniquement pnpm, car OpenClaw charge les plugins
  groupés depuis les packages de l’espace de travail `extensions/*`.

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / point d’accroche" icon="wrench" href="/fr/plugins/hooks">
    Enregistrer des outils d’agent, des points d’accroche d’événements ou des services — continuez ci-dessous
  </Card>
</CardGroup>

Pour un plugin de canal dont l’installation n’est pas garantie lorsque l’intégration/la configuration
s’exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Il produit une paire adaptateur de configuration + assistant
qui annonce l’exigence d’installation et échoue de manière fermée lors des écritures réelles de configuration
jusqu’à ce que le plugin soit installé.

## Démarrage rapide : plugin d’outil

Cette procédure pas à pas crée un plugin minimal qui enregistre un outil d’agent. Les plugins de canal
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
    sans charger l’exécution de chaque plugin. Les plugins doivent aussi déclarer
    `activation.onStartup` intentionnellement. Cet exemple le définit sur `true`. Consultez
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

    `definePluginEntry` est destiné aux plugins qui ne sont pas des canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour toutes les options de point d’entrée, consultez [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Les spécifications de paquet brutes comme `@myorg/openclaw-my-plugin` s’installent depuis npm pendant
    le basculement de lancement. Utilisez `clawhub:` lorsque vous voulez une résolution ClawHub.

    **Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des plugins groupés — découverte automatique.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités du Plugin

Un même plugin peut enregistrer n’importe quel nombre de capacités via l’objet `api` :

| Capacité               | Méthode d’enregistrement                         | Guide détaillé                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence de texte (LLM) | `api.registerProvider(...)`                    | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins)                        |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | [Backends CLI](/fr/gateway/cli-backends)                                           |
| Canal / messagerie     | `api.registerChannel(...)`                       | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                                |
| Voix (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`  | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images    | `api.registerImageGenerationProvider(...)`       | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de vidéos   | `api.registerVideoGenerationProvider(...)`       | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération Web       | `api.registerWebFetchProvider(...)`              | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche Web          | `api.registerWebSearchProvider(...)`             | [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de résultats d’outils | `api.registerAgentToolResultMiddleware(...)` | [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api)                 |
| Outils d’agent         | `api.registerTool(...)`                          | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                     | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Hooks de Plugin        | `api.on(...)`                                    | [Hooks de Plugin](/fr/plugins/hooks)                                               |
| Hooks d’événements internes | `api.registerHook(...)`                    | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |
| Routes HTTP            | `api.registerHttpRoute(...)`                     | [Internes](/fr/plugins/architecture-internals#gateway-http-routes)                 |
| Sous-commandes CLI     | `api.registerCli(...)`                           | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                     |

Pour l’API d’enregistrement complète, consultez [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api).

Les plugins groupés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
doivent réécrire de façon asynchrone les résultats d’outils avant que le modèle ne voie la sortie. Déclarez les
runtimes ciblés dans `contracts.agentToolResultMiddleware`, par exemple
`["pi", "codex"]`. Il s’agit d’une interface de plugin groupé de confiance ; les
plugins externes doivent privilégier les hooks de Plugin OpenClaw standard, sauf si OpenClaw ajoute une
politique de confiance explicite pour cette capacité.

Si votre plugin enregistre des méthodes RPC Gateway personnalisées, conservez-les sous un
préfixe propre au plugin. Les espaces de noms d’administration du noyau (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours en
`operator.admin`, même si un plugin demande une portée plus étroite.

Sémantique de garde des hooks à garder à l’esprit :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme une absence de décision.
- `before_tool_call` : `{ requireApproval: true }` suspend l’exécution de l’agent et demande l’approbation de l’utilisateur via la surcouche d’approbation d’exécution, les boutons Telegram, les interactions Discord ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme une absence de décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme une absence de décision.
- `message_received` : privilégiez le champ typé `threadId` lorsque vous avez besoin du routage entrant de thread/sujet. Conservez `metadata` pour les éléments supplémentaires propres au canal.
- `message_sending` : privilégiez les champs de routage typés `replyToId` / `threadId` plutôt que les clés de métadonnées propres au canal.

La commande `/approve` gère les approbations d’exécution et de plugin avec un repli borné : lorsqu’un id d’approbation d’exécution est introuvable, OpenClaw réessaie le même id dans les approbations de plugin. Le transfert des approbations de plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une plomberie d’approbation personnalisée doit détecter ce même cas de repli borné,
privilégiez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
au lieu de faire correspondre manuellement des chaînes d’expiration d’approbation.

Consultez [Hooks de Plugin](/fr/plugins/hooks) pour des exemples et la référence des hooks.

## Enregistrer des outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être obligatoires (toujours
disponibles) ou facultatifs (activation volontaire par l’utilisateur) :

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

Chaque outil enregistré avec `api.registerTool(...)` doit aussi être déclaré dans le
manifeste du plugin :

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw capture et met en cache le descripteur validé de l’outil enregistré,
afin que les plugins ne dupliquent pas les données de `description` ou de schéma dans le manifeste. Le
contrat du manifeste déclare uniquement la propriété et la découverte ; l’exécution appelle toujours
l’implémentation active de l’outil enregistré.
Définissez `toolMetadata.<tool>.optional: true` pour les outils enregistrés avec
`api.registerTool(..., { optional: true })` afin qu’OpenClaw puisse éviter de charger ce
runtime de plugin tant que l’outil n’est pas explicitement ajouté à la liste d’autorisation.

Les utilisateurs activent les outils optionnels dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils du noyau (les conflits sont ignorés)
- Les outils dont les objets d’enregistrement sont mal formés, y compris ceux où `parameters` est manquant, sont ignorés et signalés dans les diagnostics de plugin au lieu d’interrompre les exécutions d’agents
- Utilisez `optional: true` pour les outils avec des effets de bord ou des exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un plugin en ajoutant l’identifiant du plugin à `tools.allow`

## Enregistrer des commandes CLI

Les plugins peuvent ajouter des groupes de commandes racine `openclaw` avec `api.registerCli`. Fournissez
des `descriptors` pour chaque racine de commande de premier niveau afin qu’OpenClaw puisse afficher et router
la commande sans charger immédiatement chaque runtime de plugin.

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

Pour la référence complète des sous-chemins, consultez [Présentation du SDK](/fr/plugins/sdk-overview).

Dans votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n’importez jamais votre propre plugin via son chemin SDK.

Pour les plugins de fournisseur, gardez les assistants propres au fournisseur dans ces barrels
à la racine du package, sauf si le point d’extension est réellement générique. Exemples groupés actuels :

- Anthropic : wrappers de flux Claude et assistants `service_tier` / bêta
- OpenAI : constructeurs de fournisseurs, assistants de modèle par défaut, fournisseurs temps réel
- OpenRouter : constructeur de fournisseur ainsi qu’assistants d’intégration/configuration

Si un assistant n’est utile qu’à l’intérieur d’un seul package de fournisseur groupé, gardez-le sur ce
point d’extension à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certains points d’extension d’assistance générés `openclaw/plugin-sdk/<bundled-id>` existent encore pour
la maintenance des plugins groupés lorsqu’ils ont un usage propriétaire suivi. Traitez-les comme
des surfaces réservées, et non comme le modèle par défaut pour les nouveaux plugins tiers.

## Liste de contrôle avant soumission

<Check>**package.json** contient les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests réussissent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (plugins dans le dépôt)</Check>

## Tests de version bêta

1. Surveillez les tags de version GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications pour le compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) afin de recevoir les annonces de version.
2. Testez votre plugin avec le tag bêta dès son apparition. La fenêtre avant la version stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests, avec `all good` ou ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le libellé `beta-blocker`. Ajoutez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas libeller les PR, le titre sert donc de signal côté PR pour les mainteneurs et l’automatisation. Les bloqueurs avec une PR sont fusionnés ; ceux sans PR peuvent tout de même être livrés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie que tout est vert. Si vous manquez la fenêtre, votre correctif arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="Présentation du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Carte des imports et référence de l’API d’enregistrement
  </Card>
  <Card title="Assistants de runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma du manifeste
  </Card>
</CardGroup>

## Associés

- [Architecture des Plugins](/fr/plugins/architecture) — exploration approfondie de l’architecture interne
- [Présentation du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
- [Manifeste](/fr/plugins/manifest) — format du manifeste de plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de plugins de fournisseur
