---
doc-schema-version: 1
read_when:
    - Vous voulez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous choisissez entre des docs de canal, fournisseur, backend CLI, outil ou hook
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Créer des plugins
x-i18n:
    generated_at: "2026-07-04T15:15:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Les Plugins étendent OpenClaw sans modifier le noyau. Un Plugin peut ajouter un
canal de messagerie, un fournisseur de modèle, un backend CLI local, un outil
d’agent, un hook, un fournisseur de médias ou une autre capacité appartenant au
Plugin.

Vous n’avez pas besoin d’ajouter un Plugin externe au dépôt OpenClaw. Publiez
le package sur [ClawHub](/fr/clawhub) et les utilisateurs l’installent avec :

```bash
openclaw plugins install clawhub:<package-name>
```

Les spécifications de package nues s’installent encore depuis npm pendant la
transition du lancement. Utilisez le préfixe `clawhub:` lorsque vous voulez la
résolution ClawHub.

## Exigences

- Utilisez Node 22.19+, Node 23.11+ ou Node 24+, ainsi qu’un gestionnaire de package comme `npm` ou `pnpm`.
- Soyez à l’aise avec les modules TypeScript ESM.
- Pour travailler sur un Plugin groupé dans le dépôt, clonez le dépôt et exécutez `pnpm install`.
  Le développement de Plugins depuis une extraction source est réservé à pnpm,
  car OpenClaw charge les Plugins groupés depuis les packages d’espace de travail `extensions/*`.

## Choisir la forme du Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèle, de médias, de recherche, de récupération, de voix ou temps réel.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Exécuter une CLI d’IA locale via le repli de modèle OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/fr/plugins/tool-plugins">
    Enregistrer des outils d’agent.
  </Card>
</CardGroup>

## Démarrage rapide

Créez un Plugin d’outil minimal en enregistrant un outil d’agent obligatoire.
C’est la forme de Plugin utile la plus courte et elle montre le package, le
manifeste, le point d’entrée et la preuve locale.

<Steps>
  <Step title="Create package metadata">
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

    Les Plugins externes publiés doivent pointer les entrées d’exécution vers
    des fichiers JavaScript générés. Consultez [Points d’entrée SDK](/fr/plugins/sdk-entrypoints)
    pour le contrat complet des points d’entrée.

    Chaque Plugin a besoin d’un manifeste, même lorsqu’il n’a pas de configuration.
    Les outils d’exécution doivent apparaître dans `contracts.tools` afin
    qu’OpenClaw puisse découvrir la propriété sans charger avec empressement
    chaque runtime de Plugin. Définissez `activation.onStartup` intentionnellement.
    Cet exemple démarre au lancement du Gateway.

    Les surfaces de Plugin approuvées par l’hôte sont également contrôlées par
    le manifeste et nécessitent une activation explicite pour les Plugins
    installés. Si un Plugin installé enregistre
    `api.registerAgentToolResultMiddleware(...)`, déclarez chaque runtime cible
    dans `contracts.agentToolResultMiddleware`. S’il enregistre
    `api.registerTrustedToolPolicy(...)`, déclarez chaque identifiant de
    politique dans `contracts.trustedToolPolicies`. Ces déclarations gardent
    alignées l’inspection à l’installation et l’enregistrement à l’exécution.

    Pour chaque champ du manifeste, consultez [Manifeste de Plugin](/fr/plugins/manifest).

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

    Utilisez `definePluginEntry` pour les Plugins qui ne sont pas des canaux.
    Les Plugins de canal utilisent `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Pour un Plugin installé ou externe, inspectez le runtime chargé :

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Si le Plugin enregistre une commande CLI, exécutez aussi cette commande.
    Par exemple, une commande de démonstration doit avoir une preuve d’exécution
    comme `openclaw demo-plugin ping`.

    Pour un Plugin groupé dans ce dépôt, OpenClaw découvre les packages de
    Plugin d’extraction source depuis l’espace de travail `extensions/*`.
    Exécutez le test ciblé le plus proche :

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Avant de publier un Plugin prêt à être empaqueté, testez la même forme
    d’installation que les utilisateurs recevront. Ajoutez d’abord une étape
    de build, pointez les entrées d’exécution comme `openclaw.extensions` vers
    du JavaScript généré comme `./dist/index.js`, et assurez-vous que
    `npm pack` inclut cette sortie `dist/`. Les entrées source TypeScript sont
    réservées aux extractions source et aux chemins de développement local.

    Ensuite, empaquetez le Plugin et installez l’archive avec `npm-pack:` :

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` utilise le projet npm géré par OpenClaw pour chaque Plugin, ce
    qui détecte les erreurs de dépendances d’exécution que les tests depuis une
    extraction source peuvent masquer. Cela prouve la forme du package et des
    dépendances, pas la confiance officielle liée au catalogue. Les imports
    d’exécution doivent être dans `dependencies` ou `optionalDependencies` ;
    les dépendances laissées seulement dans `devDependencies` ne seront pas
    installées pour le projet d’exécution géré.

    N’utilisez pas une installation brute depuis une archive ou un chemin comme
    preuve finale pour un comportement de Plugin officiel ou privilégié. Les
    sources brutes sont utiles pour le débogage local, mais elles ne prouvent
    pas le même chemin de dépendances que les installations npm ou ClawHub. Si
    votre Plugin dépend du statut de Plugin officiel approuvé, ajoutez une
    seconde preuve via une installation officielle adossée à un catalogue ou un
    chemin de package publié qui enregistre la confiance officielle. Consultez
    [Résolution des dépendances de Plugin](/fr/plugins/dependency-resolution) pour
    les détails sur la racine d’installation et la propriété des dépendances.

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

Les outils peuvent être obligatoires ou facultatifs. Les outils obligatoires
sont toujours disponibles lorsque le Plugin est activé. Les outils facultatifs
nécessitent l’activation explicite par l’utilisateur.

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

Chaque outil enregistré avec `api.registerTool(...)` doit aussi être déclaré
dans le manifeste du Plugin :

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

Les outils facultatifs contrôlent si un outil est exposé au modèle. Utilisez
[les demandes d’autorisation de Plugin](/fr/plugins/plugin-permission-requests)
lorsqu’un outil ou un hook doit demander une approbation après que le modèle
l’a sélectionné et avant l’exécution de l’action.

Utilisez les outils facultatifs pour les effets de bord, les binaires inhabituels
ou les capacités qui ne doivent pas être exposées par défaut. Les noms d’outils
ne doivent pas entrer en conflit avec les outils du noyau ; les conflits sont
ignorés et signalés dans les diagnostics de Plugin. Les enregistrements mal
formés, y compris les descripteurs d’outils sans `parameters`, sont ignorés et
signalés de la même façon. Les outils enregistrés sont des fonctions typées que
le modèle peut appeler après validation des politiques et de la liste d’autorisation.

Les fabriques d’outils reçoivent un objet de contexte fourni par le runtime.
Utilisez `ctx.activeModel` lorsqu’un outil doit journaliser, afficher ou
s’adapter au modèle actif pour le tour actuel. L’objet peut inclure `provider`,
`modelId` et `modelRef`. Traitez-le comme des métadonnées d’exécution
informatives, et non comme une frontière de sécurité contre l’opérateur local,
le code de Plugin installé ou un runtime OpenClaw modifié. Les outils locaux
sensibles doivent toujours exiger une activation explicite du Plugin ou de
l’opérateur, et échouer fermement lorsque les métadonnées de modèle actif sont
absentes ou inadaptées.

Le manifeste déclare la propriété et la découverte ; l’exécution appelle tout
de même l’implémentation d’outil enregistrée en direct. Gardez
`toolMetadata.<tool>.optional: true` aligné avec
`api.registerTool(..., { optional: true })` afin qu’OpenClaw puisse éviter de
charger ce runtime de Plugin tant que l’outil n’est pas explicitement autorisé.

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

Dans votre package de Plugin, utilisez des fichiers barrel locaux comme `api.ts`
et `runtime-api.ts` pour les imports internes. N’importez pas votre propre
Plugin via un chemin SDK. Les assistants propres à un fournisseur doivent rester
dans le package du fournisseur, sauf si le point d’extension est réellement
générique.

Les méthodes RPC Gateway personnalisées sont un point d’entrée avancé.
Gardez-les sur un préfixe propre au Plugin ; les espaces de noms
d’administration du noyau comme `config.*`, `exec.approvals.*`,
`operator.admin.*`, `wizard.*` et `update.*` restent réservés et se résolvent
vers `operator.admin`. Le pont
`openclaw/plugin-sdk/gateway-method-runtime` est réservé aux routes HTTP de
Plugin qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pour la carte complète des imports, consultez [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Liste de vérification avant soumission

<Check>**package.json** contient les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins `plugin-sdk/<subpath>` ciblés</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passe (Plugins dans le dépôt)</Check>

## Tester avec les versions bêta

1. Surveillez les balises de publication GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les balises bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez également activer les notifications pour le compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) afin de recevoir les annonces de publication.
2. Testez votre plugin avec la balise bêta dès qu’elle apparaît. La fenêtre avant la version stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests, avec soit `all good`, soit ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Ajoutez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas labelliser les PR, donc le titre sert de signal côté PR pour les mainteneurs et l’automatisation. Les blocages avec une PR sont fusionnés ; ceux sans PR peuvent tout de même être publiés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. L’absence de retour signifie que tout est au vert. Si vous manquez la fenêtre, votre correctif sera probablement intégré au cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="Plugins de backend CLI" icon="terminal" href="/fr/plugins/cli-backend-plugins">
    Enregistrer un backend CLI IA local
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la carte d’importation et de l’API d’enregistrement
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste du plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Associé

- [Hooks de plugin](/fr/plugins/hooks)
- [Architecture des plugins](/fr/plugins/architecture)
