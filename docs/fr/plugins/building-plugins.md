---
doc-schema-version: 1
read_when:
    - Vous souhaitez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de plugins
    - Vous choisissez entre la documentation des canaux, des fournisseurs, du backend CLI, des outils ou des hooks
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Développer des Plugins
x-i18n:
    generated_at: "2026-07-04T08:45:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les plugins étendent OpenClaw sans modifier le cœur. Un plugin peut ajouter un
canal de messagerie, un fournisseur de modèle, un backend CLI local, un outil
d’agent, un hook, un fournisseur de médias ou une autre capacité appartenant au
plugin.

Vous n’avez pas besoin d’ajouter un plugin externe au dépôt OpenClaw. Publiez
le package sur [ClawHub](/fr/clawhub) et les utilisateurs l’installent avec :

```bash
openclaw plugins install clawhub:<package-name>
```

Les spécifications de package nues s’installent toujours depuis npm pendant la
bascule de lancement. Utilisez le préfixe `clawhub:` lorsque vous souhaitez une
résolution ClawHub.

## Prérequis

- Utilisez Node 22.19+, Node 23.11+ ou Node 24+ et un gestionnaire de packages comme `npm` ou `pnpm`.
- Soyez à l’aise avec les modules TypeScript ESM.
- Pour travailler sur un plugin groupé dans le dépôt, clonez le dépôt et exécutez `pnpm install`.
  Le développement de plugins depuis un checkout source est réservé à pnpm,
  car OpenClaw charge les plugins groupés depuis les packages d’espace de
  travail `extensions/*`.

## Choisir la forme du plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connectez OpenClaw à une plateforme de messagerie.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajoutez un fournisseur de modèle, médias, recherche, récupération, synthèse vocale ou temps réel.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Exécutez une CLI d’IA locale via le fallback de modèle OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/fr/plugins/tool-plugins">
    Enregistrez des outils d’agent.
  </Card>
</CardGroup>

## Démarrage rapide

Créez un plugin d’outil minimal en enregistrant un outil d’agent requis. C’est
la forme de plugin utile la plus courte et elle montre le package, le manifeste,
le point d’entrée et la preuve locale.

<Steps>
  <Step title="Create package metadata">
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

    Les plugins externes publiés doivent faire pointer les entrées runtime vers
    des fichiers JavaScript compilés. Consultez [points d’entrée SDK](/fr/plugins/sdk-entrypoints)
    pour le contrat complet des points d’entrée.

    Chaque plugin a besoin d’un manifeste, même lorsqu’il n’a pas de
    configuration. Les outils runtime doivent apparaître dans `contracts.tools`
    afin qu’OpenClaw puisse découvrir leur propriété sans charger avidement
    chaque runtime de plugin. Définissez `activation.onStartup`
    intentionnellement. Cet exemple démarre au lancement du Gateway.

    Les surfaces de plugin approuvées par l’hôte sont également contrôlées par
    le manifeste et nécessitent une activation explicite pour les plugins
    installés. Si un plugin installé enregistre
    `api.registerAgentToolResultMiddleware(...)`, déclarez chaque runtime cible
    dans `contracts.agentToolResultMiddleware`. S’il enregistre
    `api.registerTrustedToolPolicy(...)`, déclarez chaque identifiant de
    politique dans `contracts.trustedToolPolicies`. Ces déclarations maintiennent
    l’inspection à l’installation et l’enregistrement runtime alignés.

    Pour chaque champ du manifeste, consultez [Manifeste du plugin](/fr/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Utilisez `definePluginEntry` pour les plugins qui ne sont pas des canaux.
    Les plugins de canal utilisent `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Pour un plugin installé ou externe, inspectez le runtime chargé :

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si le plugin enregistre une commande CLI, exécutez aussi cette commande. Par
    exemple, une commande de démonstration doit disposer d’une preuve d’exécution
    comme `openclaw demo-plugin ping`.

    Pour un plugin groupé dans ce dépôt, OpenClaw découvre les packages de
    plugin du checkout source depuis l’espace de travail `extensions/*`.
    Exécutez le test ciblé le plus proche :

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Validez le package avant publication :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Les extraits ClawHub canoniques se trouvent dans `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Installez le package publié via ClawHub :

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Enregistrer des outils

Les outils peuvent être requis ou facultatifs. Les outils requis sont toujours
disponibles lorsque le plugin est activé. Les outils facultatifs nécessitent
l’acceptation explicite de l’utilisateur.

```typescript
register(api) {
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

Chaque outil enregistré avec `api.registerTool(...)` doit également être déclaré
dans le manifeste du plugin :

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Les utilisateurs l’activent avec `tools.allow` :

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Les outils facultatifs contrôlent si un outil est exposé au modèle. Utilisez les
[demandes d’autorisation de plugin](/fr/plugins/plugin-permission-requests)
lorsqu’un outil ou un hook doit demander une approbation après sa sélection par
le modèle et avant l’exécution de l’action.

Utilisez des outils facultatifs pour les effets de bord, les binaires inhabituels
ou les capacités qui ne doivent pas être exposées par défaut. Les noms d’outils
ne doivent pas entrer en conflit avec les outils du cœur ; les conflits sont
ignorés et signalés dans les diagnostics de plugin. Les enregistrements mal
formés, y compris les descripteurs d’outils sans `parameters`, sont ignorés et
signalés de la même manière. Les outils enregistrés sont des fonctions typées que
le modèle peut appeler après réussite des contrôles de politique et de liste
d’autorisation.

Les fabriques d’outils reçoivent un objet de contexte fourni par le runtime.
Utilisez `ctx.activeModel` lorsqu’un outil doit journaliser, afficher ou
s’adapter au modèle actif pour le tour actuel. L’objet peut inclure `provider`,
`modelId` et `modelRef`. Traitez-le comme des métadonnées runtime informatives,
et non comme une frontière de sécurité contre l’opérateur local, le code de
plugin installé ou un runtime OpenClaw modifié. Les outils locaux sensibles
doivent toujours exiger une acceptation explicite du plugin ou de l’opérateur et
échouer de manière fermée lorsque les métadonnées du modèle actif sont absentes
ou inadaptées.

Le manifeste déclare la propriété et la découverte ; l’exécution appelle
toujours l’implémentation enregistrée en direct de l’outil. Gardez
`toolMetadata.<tool>.optional: true` aligné avec
`api.registerTool(..., { optional: true })` afin qu’OpenClaw puisse éviter de
charger ce runtime de plugin tant que l’outil n’est pas explicitement ajouté à la
liste d’autorisation.

## Conventions d’import

Importez depuis des sous-chemins SDK ciblés :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

N’importez pas depuis le barrel racine obsolète :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dans votre package de plugin, utilisez des fichiers barrel locaux comme `api.ts`
et `runtime-api.ts` pour les imports internes. N’importez pas votre propre
plugin via un chemin SDK. Les helpers propres à un fournisseur doivent rester
dans le package du fournisseur, sauf si la jonction est réellement générique.

Les méthodes RPC Gateway personnalisées sont un point d’entrée avancé.
Conservez-les sur un préfixe propre au plugin ; les espaces de noms
d’administration du cœur comme `config.*`, `exec.approvals.*`,
`operator.admin.*`, `wizard.*` et `update.*` restent réservés et se résolvent
vers `operator.admin`. Le pont
`openclaw/plugin-sdk/gateway-method-runtime` est réservé aux routes HTTP de
plugin qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pour la carte complète des imports, consultez [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview).

## Liste de contrôle avant soumission

<Check>**package.json** contient les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests réussissent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (plugins dans le dépôt)</Check>

## Tester avec les versions bêta

1. Surveillez les tags de release GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications du compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de release.
2. Testez votre plugin avec le tag bêta dès son apparition. La fenêtre avant la version stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests, avec `all good` ou ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le libellé `beta-blocker`. Mettez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas libeller les PR, donc le titre est le signal côté PR pour les mainteneurs et l’automatisation. Les blocages avec une PR sont fusionnés ; ceux sans PR peuvent tout de même être livrés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie que tout est vert. Si vous manquez la fenêtre, votre correctif atterrira probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créez un plugin de canal de messagerie
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créez un plugin de fournisseur de modèle
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Enregistrez un backend CLI d’IA local
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fr/plugins/sdk-overview">
    Carte des imports et référence de l’API d’enregistrement
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Associé

- [Hooks de plugin](/fr/plugins/hooks)
- [Architecture de plugin](/fr/plugins/architecture)
