---
doc-schema-version: 1
read_when:
    - Vous souhaitez créer un nouveau plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de plugins
    - Vous choisissez entre la documentation des canaux, des fournisseurs, du backend CLI, des outils ou des hooks
sidebarTitle: Getting Started
summary: Créez votre premier plugin OpenClaw en quelques minutes
title: Création de plugins
x-i18n:
    generated_at: "2026-07-12T15:39:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les Plugins étendent OpenClaw sans modifier le cœur. Un Plugin peut ajouter un
canal de messagerie, un fournisseur de modèles, un backend CLI local, un outil
d’agent, un hook, un fournisseur de médias ou une autre fonctionnalité détenue
par le Plugin.

Vous n’avez pas besoin d’ajouter un Plugin externe au dépôt OpenClaw. Publiez
le paquet sur [ClawHub](/fr/clawhub), puis les utilisateurs l’installent avec :

```bash
openclaw plugins install clawhub:<package-name>
```

Les spécifications de paquet sans préfixe continuent d’être installées depuis npm pendant
la transition de lancement. Utilisez le préfixe `clawhub:` lorsque vous souhaitez
une résolution par ClawHub.

## Prérequis

- Node 22.19+, Node 23.11+ ou Node 24+, et `npm` ou `pnpm`.
- Modules ESM TypeScript.
- Pour travailler sur un Plugin intégré au dépôt, clonez le dépôt et exécutez `pnpm install`.
  Le développement de Plugins depuis une copie des sources nécessite exclusivement pnpm, car OpenClaw
  découvre les Plugins intégrés à partir des paquets de l’espace de travail `extensions/*`.

## Choisir la forme du Plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connectez OpenClaw à une plateforme de messagerie.
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajoutez un fournisseur de modèles, de médias, de recherche, de récupération, de synthèse vocale ou de temps réel.
  </Card>
  <Card title="Plugin de backend CLI" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Exécutez une CLI d’IA locale via le mécanisme de repli de modèle d’OpenClaw.
  </Card>
  <Card title="Plugin d’outil" icon="wrench" href="/fr/plugins/tool-plugins">
    Enregistrez des outils d’agent.
  </Card>
</CardGroup>

## Démarrage rapide

Créez un Plugin d’outil minimal en enregistrant un outil d’agent obligatoire. Il s’agit de la
forme de Plugin utile la plus courte ; elle couvre le paquet, le manifeste, le point d’entrée et
la validation locale.

<Steps>
  <Step title="Créer les métadonnées du paquet">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Les Plugins externes publiés doivent faire pointer les entrées d’exécution vers des fichiers
    JavaScript compilés. Consultez [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) pour connaître
    le contrat complet des points d’entrée.

    Chaque Plugin nécessite un manifeste, même sans configuration. Les outils d’exécution doivent
    figurer dans `contracts.tools` afin qu’OpenClaw puisse déterminer leur propriétaire sans
    charger immédiatement l’environnement d’exécution de chaque Plugin. Définissez
    `activation.onStartup` de manière intentionnelle ; cet exemple effectue le chargement au démarrage du Gateway.

    Les surfaces de Plugin approuvées par l’hôte sont également contrôlées par le manifeste et nécessitent une
    déclaration explicite pour les Plugins installés : `api.registerAgentToolResultMiddleware(...)`
    exige que chaque environnement d’exécution ciblé soit répertorié dans `contracts.agentToolResultMiddleware`,
    et `api.registerTrustedToolPolicy(...)` exige que chaque identifiant de politique figure dans
    `contracts.trustedToolPolicies`. Ces déclarations maintiennent la cohérence entre
    l’inspection à l’installation et l’enregistrement à l’exécution.

    Pour chaque champ du manifeste, consultez [Manifeste du Plugin](/fr/plugins/manifest).

  </Step>

  <Step title="Enregistrer l’outil">
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

    Utilisez `definePluginEntry` pour les Plugins qui ne sont pas des canaux. Les Plugins de canal utilisent
    plutôt `defineChannelPluginEntry` depuis `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Tester l’environnement d’exécution">
    Pour un Plugin installé ou externe, inspectez l’environnement d’exécution chargé :

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si le Plugin enregistre une commande CLI, exécutez également cette commande et vérifiez
    sa sortie, par exemple `openclaw demo-plugin ping`.

    Pour un Plugin intégré à ce dépôt, OpenClaw découvre les paquets de Plugins
    depuis les sources dans l’espace de travail `extensions/*`. Exécutez le test ciblé
    le plus proche :

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Tester l’installation du paquet">
    Avant de publier un Plugin prêt à être empaqueté, testez la même forme d’installation que celle
    reçue par les utilisateurs. Ajoutez d’abord une étape de compilation, faites pointer les entrées
    d’exécution telles que `openclaw.extensions` vers du JavaScript compilé comme `./dist/index.js`, et
    assurez-vous que `npm pack` inclut cette sortie `dist/`. Les entrées de sources TypeScript sont
    réservées aux copies des sources et aux chemins de développement local.

    Empaquetez ensuite le Plugin et installez l’archive avec `npm-pack:` :

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` utilise le projet npm géré par OpenClaw pour chaque Plugin ; il détecte donc
    les erreurs de dépendances d’exécution que les tests depuis une copie des sources peuvent masquer. Il valide
    la forme du paquet et des dépendances, mais pas la confiance officielle liée au catalogue.
    Les importations d’exécution doivent figurer dans `dependencies` ou `optionalDependencies` ;
    les dépendances présentes uniquement dans `devDependencies` ne seront pas installées pour le
    projet d’exécution géré.

    N’utilisez pas l’installation directe d’une archive ou d’un chemin comme validation finale du comportement
    officiel ou privilégié d’un Plugin. Les sources brutes sont utiles pour le débogage local, mais
    elles ne valident pas le même chemin de dépendances que les installations npm ou ClawHub. Si
    votre Plugin repose sur le statut de Plugin officiel approuvé, ajoutez une seconde validation
    via une installation officielle adossée au catalogue ou un chemin de paquet publié qui
    enregistre la confiance officielle. Consultez
    [Résolution des dépendances des Plugins](/fr/plugins/dependency-resolution) pour plus de détails
    sur la racine d’installation et la propriété des dépendances.

  </Step>

  <Step title="Publier">
    Validez le paquet avant de le publier :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Les extraits canoniques de paquets ClawHub se trouvent dans `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installer">
    Installez le paquet publié via ClawHub :

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Enregistrer des outils

Les outils peuvent être obligatoires ou facultatifs. Les outils obligatoires sont toujours disponibles lorsque le
Plugin est activé. Les outils facultatifs nécessitent le consentement explicite de l’utilisateur avant qu’OpenClaw
ne charge l’environnement d’exécution du Plugin propriétaire.

Les fabriques d’outils reçoivent un contexte d’exécution approuvé, notamment `deliveryContext`,
`nativeChannelId` pour la conversation active sur la plateforme lorsqu’il est disponible, ainsi que
`requesterSenderId`.

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

Chaque outil enregistré avec `api.registerTool(...)` doit également être déclaré dans le
manifeste du Plugin :

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

Les utilisateurs donnent leur consentement avec `tools.allow` :

```json5
{
  tools: { allow: ["workflow_tool"] }, // ou ["my-plugin"] pour tous les outils d’un Plugin
}
```

Les outils facultatifs déterminent si un outil est exposé au modèle. Utilisez les
[demandes d’autorisation de Plugin](/fr/plugins/plugin-permission-requests) lorsqu’un outil
ou un hook doit demander une approbation après sa sélection par le modèle et avant
l’exécution de l’action.

Utilisez les outils facultatifs pour les effets de bord, les binaires inhabituels ou les fonctionnalités qui
ne doivent pas être exposées par défaut. Les noms d’outils ne doivent pas entrer en conflit avec ceux des outils
du cœur ; les conflits sont ignorés et signalés dans les diagnostics des Plugins. Les
enregistrements mal formés sont ignorés et signalés de la même manière : un `name`
absent ou vide, un `execute` qui n’est pas une fonction, ou un descripteur d’outil sans objet
`parameters`.

Les fabriques d’outils reçoivent un objet de contexte fourni par l’environnement d’exécution. Utilisez `ctx.activeModel`
lorsqu’un outil doit journaliser, afficher ou adapter son comportement au modèle actif pour le tour
en cours ; il peut inclure `provider`, `modelId` et `modelRef`. Considérez-le comme
des métadonnées d’exécution informatives, et non comme une frontière de sécurité contre l’opérateur
local, le code des Plugins installés ou un environnement d’exécution OpenClaw modifié. Les outils
locaux sensibles doivent toujours exiger le consentement explicite du Plugin ou de l’opérateur et
échouer de manière fermée lorsque les métadonnées du modèle actif sont absentes ou inadaptées.

Le manifeste déclare la propriété et la découverte ; l’exécution appelle toujours l’implémentation
active de l’outil enregistré. Maintenez `toolMetadata.<tool>.optional: true`
cohérent avec `api.registerTool(..., { optional: true })` afin qu’OpenClaw puisse éviter
de charger l’environnement d’exécution de ce Plugin tant que l’outil n’a pas été explicitement ajouté à la liste d’autorisation.

## Conventions d’importation

Importez depuis des sous-chemins ciblés du SDK :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

N’importez pas depuis le barrel racine obsolète :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dans votre paquet de Plugin, utilisez des fichiers barrel locaux tels que `api.ts` et
`runtime-api.ts` pour les importations internes. N’importez pas votre propre Plugin via un
chemin du SDK. Les utilitaires propres à un fournisseur doivent rester dans le paquet du fournisseur, sauf
si l’interface est réellement générique.

Les méthodes RPC personnalisées du Gateway constituent un point d’entrée avancé. Placez-les sous un
préfixe propre au Plugin ; les espaces de noms d’administration du cœur tels que `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` et `update.*` restent réservés
et sont résolus en `operator.admin`. Le pont
`openclaw/plugin-sdk/gateway-method-runtime` est réservé aux routes HTTP des Plugins
qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pour connaître la table complète des importations, consultez [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Liste de contrôle avant soumission

<Check>**package.json** contient des métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Toutes les importations utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les importations internes utilisent des modules locaux, et non des auto-importations du SDK</Check>
<Check>Les tests réussissent (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` réussit (Plugins du dépôt)</Check>

## Tester avec les versions bêta

1. Surveillez les versions d’[openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Les balises bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez également suivre [@openclaw](https://x.com/openclaw) sur X pour les annonces de versions.
2. Testez votre plugin avec la balise bêta dès sa publication. La période précédant la version stable ne dure généralement que quelques heures.
3. Après le test, publiez dans le fil de discussion de votre plugin sur le canal Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), en indiquant soit `all good`, soit ce qui ne fonctionne plus. Créez un fil de discussion si vous n’en avez pas encore.
4. Si quelque chose ne fonctionne plus, ouvrez ou mettez à jour un ticket intitulé `Beta blocker: <plugin-name> - <summary>` et appliquez le libellé `beta-blocker`. Ajoutez un lien vers le ticket dans votre fil de discussion.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et ajoutez un lien vers le ticket dans la PR ainsi que dans votre fil de discussion Discord. Les contributeurs ne peuvent pas ajouter de libellés aux PR ; le titre sert donc de signal côté PR pour les mainteneurs et l’automatisation. Les blocages accompagnés d’une PR sont fusionnés ; ceux qui n’en ont pas peuvent malgré tout être inclus dans la version.
6. L’absence de retour signifie que tout est au vert. Si vous manquez cette période, votre correctif sera généralement intégré au cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canaux" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseurs" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="Plugins de backend CLI" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Enregistrer un backend CLI d’IA local
  </Card>
  <Card title="Présentation du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la table d’importation et de l’API d’enregistrement
  </Card>
  <Card title="Utilitaires d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche et sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma du manifeste
  </Card>
</CardGroup>

## Contenu associé

- [Hooks de plugin](/fr/plugins/hooks)
- [Architecture des plugins](/fr/plugins/architecture)
