---
read_when:
    - Vous construisez un plugin backend CLI d’IA local
    - Vous souhaitez enregistrer un backend pour des références de modèle comme acme-cli/model
    - Vous devez associer une CLI tierce à l’exécuteur de repli textuel d’OpenClaw
sidebarTitle: CLI backend plugins
summary: Créez un Plugin qui enregistre un moteur CLI d’IA local
title: Création de Plugins backend CLI
x-i18n:
    generated_at: "2026-05-07T13:23:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Les plugins de backend CLI permettent à OpenClaw d’appeler une CLI d’IA locale comme backend
d’inférence textuelle. Le backend apparaît comme un préfixe de fournisseur dans les références de modèle :

```text
acme-cli/acme-large
```

Utilisez un backend CLI lorsque l’intégration amont est déjà exposée comme une commande
locale, lorsque la CLI possède l’état de connexion local, ou lorsque la CLI constitue une
solution de repli utile si les fournisseurs d’API sont indisponibles.

<Info>
  Si le service amont expose une API de modèle HTTP normale, écrivez plutôt un
  [plugin de fournisseur](/fr/plugins/sdk-provider-plugins). Si le runtime amont
  possède des sessions d’agent complètes, des événements d’outils, la Compaction ou l’état
  de tâches en arrière-plan, utilisez un [harnais d’agent](/fr/plugins/sdk-agent-harness).
</Info>

## Ce que possède le plugin

Un plugin de backend CLI a trois contrats :

| Contrat                  | Fichier                | Objectif                                                  |
| ------------------------ | ---------------------- | --------------------------------------------------------- |
| Point d’entrée du paquet | `package.json`         | Oriente OpenClaw vers le module de runtime du plugin      |
| Propriété du manifeste   | `openclaw.plugin.json` | Déclare l’id du backend avant le chargement du runtime    |
| Enregistrement runtime   | `index.ts`             | Appelle `api.registerCliBackend(...)` avec les valeurs de commande par défaut |

Le manifeste est une métadonnée de découverte. Il n’exécute pas la CLI et n’enregistre
pas le comportement runtime. Le comportement runtime commence lorsque le point d’entrée
du plugin appelle `api.registerCliBackend(...)`.

## Plugin de backend minimal

<Steps>
  <Step title="Créer les métadonnées du paquet">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
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
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Les paquets publiés doivent fournir des fichiers runtime JavaScript compilés. Si votre point
    d’entrée source est `./src/index.ts`, ajoutez `openclaw.runtimeExtensions` qui pointe vers
    le pair JavaScript compilé. Voir [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Déclarer la propriété du backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` est la liste de propriété runtime. Elle permet à OpenClaw de charger
    automatiquement le plugin lorsque la configuration ou la sélection de modèle mentionne `acme-cli/...`.

    `setup.cliBackends` est la surface de configuration priorisant les descripteurs. Ajoutez-la lorsque
    la découverte de modèles, l’onboarding ou l’état doivent reconnaître le backend sans
    charger le runtime du plugin. Utilisez `requiresRuntime: false` uniquement lorsque ces descripteurs
    statiques suffisent pour la configuration.

  </Step>

  <Step title="Enregistrer le backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    L’id du backend doit correspondre à l’entrée `cliBackends` du manifeste. La `config` enregistrée
    n’est que la valeur par défaut ; la configuration utilisateur sous
    `agents.defaults.cliBackends.acme-cli` est fusionnée par-dessus à l’exécution.

  </Step>
</Steps>

## Forme de la configuration

`CliBackendConfig` décrit comment OpenClaw doit lancer et analyser la CLI :

| Champ                                     | Utilisation                                                |
| ----------------------------------------- | ---------------------------------------------------------- |
| `command`                                 | Nom du binaire ou chemin de commande absolu                |
| `args`                                    | argv de base pour les nouvelles exécutions                 |
| `resumeArgs`                              | argv alternatif pour les sessions reprises ; prend en charge `{sessionId}` |
| `output` / `resumeOutput`                 | Analyseur : `json`, `jsonl` ou `text`                      |
| `input`                                   | Transport du prompt : `arg` ou `stdin`                     |
| `modelArg`                                | Drapeau utilisé avant l’id du modèle                       |
| `modelAliases`                            | Associe les ids de modèles OpenClaw aux ids natifs de la CLI |
| `sessionArg` / `sessionArgs`              | Comment transmettre un id de session                       |
| `sessionMode`                             | `always`, `existing` ou `none`                             |
| `sessionIdFields`                         | Champs JSON lus par OpenClaw depuis la sortie de la CLI    |
| `systemPromptArg` / `systemPromptFileArg` | Transport du prompt système                                |
| `systemPromptWhen`                        | `first`, `always` ou `never`                               |
| `imageArg` / `imageMode`                  | Prise en charge des chemins d’image                        |
| `serialize`                               | Garde les exécutions du même backend ordonnées             |
| `reliability.watchdog`                    | Réglage du délai d’absence de sortie                       |

Préférez la plus petite configuration statique qui correspond à la CLI. Ajoutez des callbacks
de plugin uniquement pour les comportements qui appartiennent réellement au backend.

## Hooks de backend avancés

`CliBackendPlugin` peut aussi définir :

| Hook                               | Utilisation                                             |
| ---------------------------------- | ------------------------------------------------------- |
| `normalizeConfig(config, context)` | Réécrire l’ancienne configuration utilisateur après fusion |
| `resolveExecutionArgs(ctx)`        | Ajouter des drapeaux propres à la requête, comme l’effort de réflexion |
| `prepareExecution(ctx)`            | Créer des ponts temporaires d’authentification ou de configuration avant le lancement |
| `transformSystemPrompt(ctx)`       | Appliquer une transformation finale du prompt système propre à la CLI |
| `textTransforms`                   | Remplacements bidirectionnels de prompt/sortie          |
| `defaultAuthProfileId`             | Préférer un profil d’authentification OpenClaw précis   |
| `authEpochMode`                    | Décider comment les changements d’authentification invalident les sessions CLI stockées |
| `nativeToolMode`                   | Déclarer si la CLI possède des outils natifs toujours activés |
| `bundleMcp` / `bundleMcpMode`      | S’inscrire au pont d’outils MCP local loopback d’OpenClaw |

Gardez ces hooks sous la responsabilité du fournisseur. N’ajoutez pas de branches propres
à la CLI dans le cœur lorsqu’un hook de backend peut exprimer le comportement.

## Pont d’outils MCP

Les backends CLI ne reçoivent pas les outils OpenClaw par défaut. Si la CLI peut consommer une
configuration MCP, inscrivez-la explicitement :

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Les modes de pont pris en charge sont :

| Mode                     | Utilisation                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | CLI qui acceptent un fichier de configuration MCP              |
| `codex-config-overrides` | CLI qui acceptent des remplacements de configuration dans argv |
| `gemini-system-settings` | CLI qui lisent les paramètres MCP depuis leur répertoire de paramètres système |

Activez le pont uniquement lorsque la CLI peut réellement le consommer. Si la CLI possède sa
propre couche d’outils intégrée qui ne peut pas être désactivée, définissez `nativeToolMode:
"always-on"` afin qu’OpenClaw puisse échouer de manière fermée lorsqu’un appelant exige l’absence d’outils natifs.

## Configuration utilisateur

Les utilisateurs peuvent remplacer toute valeur par défaut du backend :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documentez le remplacement minimal dont les utilisateurs sont susceptibles d’avoir besoin.
En général, il s’agit seulement de `command` lorsque le binaire se trouve hors de `PATH`.

## Vérification

Pour les plugins intégrés, ajoutez un test ciblé autour du générateur et de l’enregistrement
de configuration, puis exécutez la voie de test ciblée du plugin :

```bash
pnpm test extensions/acme-cli
```

Pour les plugins locaux ou installés, vérifiez la découverte et une exécution de modèle réelle :

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si le backend prend en charge les images ou MCP, ajoutez un smoke test live qui prouve ces chemins
avec la vraie CLI. Ne vous fiez pas à l’inspection statique pour les comportements de prompt, d’image, de MCP ou
de reprise de session.

## Checklist

<Check>`package.json` possède `openclaw.extensions` et des entrées runtime compilées pour les paquets publiés</Check>
<Check>`openclaw.plugin.json` déclare `cliBackends` et un `activation.onStartup` intentionnel</Check>
<Check>`setup.cliBackends` est présent lorsque la configuration/découverte de modèle doit voir le backend à froid</Check>
<Check>`api.registerCliBackend(...)` utilise le même id de backend que le manifeste</Check>
<Check>Les remplacements utilisateur sous `agents.defaults.cliBackends.<id>` gagnent toujours</Check>
<Check>Les paramètres de session, de prompt système, d’image et d’analyseur de sortie correspondent au vrai contrat de la CLI</Check>
<Check>Des tests ciblés et au moins un smoke test CLI live prouvent le chemin du backend</Check>

## Associé

- [Backends CLI](/fr/gateway/cli-backends) - configuration utilisateur et comportement runtime
- [Créer des plugins](/fr/plugins/building-plugins) - bases des paquets et manifestes
- [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview) - référence de l’API d’enregistrement
- [Manifeste de plugin](/fr/plugins/manifest) - `cliBackends` et descripteurs de configuration
- [Harnais d’agent](/fr/plugins/sdk-agent-harness) - runtimes d’agents externes complets
