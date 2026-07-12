---
read_when:
    - Vous développez un plugin de backend CLI d’IA locale
    - Vous souhaitez enregistrer un backend pour des références de modèles telles que acme-cli/model
    - Vous devez intégrer une CLI tierce au moteur d’exécution de secours textuel d’OpenClaw
sidebarTitle: CLI backend plugins
summary: Créez un Plugin qui enregistre un backend CLI d’IA local
title: Création de plugins de backend CLI
x-i18n:
    generated_at: "2026-07-12T15:38:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Les plugins de backend CLI permettent à OpenClaw d’appeler une CLI d’IA locale comme backend
d’inférence de texte. Le backend apparaît comme préfixe de fournisseur dans les références de modèle :

```text
acme-cli/acme-large
```

Utilisez un backend CLI lorsque l’intégration en amont est déjà exposée sous forme de commande
locale, lorsque la CLI gère l’état de connexion local ou comme solution de secours lorsque les
fournisseurs d’API sont indisponibles.

<Info>
  Si le service en amont expose une API de modèle HTTP standard, écrivez plutôt un
  [plugin de fournisseur](/fr/plugins/sdk-provider-plugins). Si le runtime en amont
  gère des sessions d’agent complètes, les événements d’outils, la Compaction ou l’état des tâches
  en arrière-plan, utilisez un [harnais d’agent](/fr/plugins/sdk-agent-harness).
</Info>

## Ce que gère le plugin

Un plugin de backend CLI possède trois contrats :

| Contrat                | Fichier                | Objectif                                                          |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- |
| Point d’entrée du paquet | `package.json`         | Indique à OpenClaw le module de runtime du plugin                 |
| Propriété du manifeste | `openclaw.plugin.json` | Déclare l’identifiant du backend avant le chargement du runtime   |
| Enregistrement du runtime | `index.ts`             | Appelle `api.registerCliBackend(...)` avec les valeurs par défaut de la commande |

Le manifeste constitue les métadonnées de découverte : il n’exécute pas la CLI et n’enregistre
aucun comportement de runtime. Le comportement du runtime commence lorsque le point d’entrée du plugin appelle
`api.registerCliBackend(...)`.

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

    Les paquets publiés doivent inclure les fichiers JavaScript de runtime compilés. Si votre point
    d’entrée source est `./src/index.ts`, ajoutez `openclaw.runtimeExtensions` en le faisant pointer vers le
    fichier JavaScript compilé correspondant. Consultez [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Déclarer la propriété du backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Exécuter la CLI d’IA locale d’Acme via OpenClaw",
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

    `cliBackends` est la liste de propriété du runtime ; elle permet à OpenClaw de charger automatiquement le
    plugin lorsque la configuration ou la sélection du modèle mentionne `acme-cli/...`.

    `setup.cliBackends` est la surface de configuration privilégiant les descripteurs. Ajoutez-la lorsque
    la découverte des modèles, l’intégration initiale ou l’état doivent reconnaître le backend
    sans charger le runtime du plugin. Utilisez `requiresRuntime: false` uniquement lorsque
    ces descripteurs statiques suffisent à la configuration.

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
      description: "Exécuter la CLI d’IA locale d’Acme via OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    L’identifiant du backend doit correspondre à l’entrée `cliBackends` du manifeste. La
    `config` enregistrée ne constitue que la valeur par défaut ; la configuration utilisateur sous
    `agents.defaults.cliBackends.acme-cli` est fusionnée par-dessus lors de l’exécution.

  </Step>
</Steps>

## Structure de la configuration

`CliBackendConfig` décrit comment OpenClaw doit lancer et analyser la CLI :

| Champ                                                     | Utilisation                                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `command`                                                 | Nom du binaire ou chemin absolu de la commande                                      |
| `args`                                                    | Arguments argv de base pour les nouvelles exécutions                               |
| `resumeArgs`                                              | Arguments argv alternatifs pour les sessions reprises ; prend en charge `{sessionId}` |
| `output` / `resumeOutput`                                 | Analyseur : `json`, `jsonl` ou `text`                                               |
| `jsonlDialect`                                            | Dialecte d’événements JSONL : `claude-stream-json` ou `gemini-stream-json`          |
| `liveSession`                                             | Mode de processus CLI de longue durée (`claude-stdio`)                             |
| `input`                                                   | Transport de l’invite : `arg` ou `stdin`                                            |
| `maxPromptArgChars`                                       | Longueur maximale de l’invite en mode `arg` avant le repli vers stdin               |
| `env` / `clearEnv`                                        | Variables d’environnement supplémentaires à injecter ou noms à retirer avant le lancement |
| `modelArg`                                                | Indicateur utilisé avant l’identifiant du modèle                                    |
| `modelAliases`                                            | Associe les identifiants de modèles OpenClaw aux identifiants natifs de la CLI      |
| `sessionArg` / `sessionArgs`                              | Méthode de transmission d’un identifiant de session                                |
| `sessionMode`                                             | `always`, `existing` ou `none`                                                      |
| `sessionIdFields`                                         | Champs JSON lus par OpenClaw dans la sortie de la CLI                              |
| `systemPromptArg` / `systemPromptFileArg`                 | Transport de l’invite système                                                       |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transport par remplacement de configuration pour un fichier d’invite système (par exemple `-c`) |
| `systemPromptMode`                                        | `append` ou `replace`                                                               |
| `systemPromptWhen`                                        | `first`, `always` ou `never`                                                        |
| `imageArg` / `imageMode`                                  | Indicateur du chemin d’image et méthode de transmission de plusieurs images (`repeat` ou `list`) |
| `imagePathScope`                                          | Emplacement des fichiers image préparés avant leur transfert : `temp` ou `workspace` |
| `serialize`                                               | Maintient l’ordre des exécutions utilisant le même backend                         |
| `reseedFromRawTranscriptWhenUncompacted`                  | Active le réamorçage limité à partir de la transcription brute avant la Compaction pour réinitialiser les sessions en toute sécurité |
| `reliability.outputLimits`                                | Nombre maximal de caractères/lignes JSONL bruts conservés pour un tour CLI en direct (backends à session en direct) |
| `reliability.watchdog`                                    | Réglage du délai d’expiration en l’absence de sortie, distinct pour les nouvelles exécutions et celles reprises |

Préférez la configuration statique minimale correspondant à la CLI. Ajoutez des rappels de plugin
uniquement pour les comportements qui appartiennent réellement au backend.

## Points d’extension avancés du backend

`CliBackendPlugin` peut également définir :

| Point d’extension                    | Utilisation                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)`   | Réécrit l’ancienne configuration utilisateur après la fusion                  |
| `resolveExecutionArgs(ctx)`          | Ajoute des indicateurs propres à la requête, comme l’effort de réflexion ou l’isolation des questions annexes |
| `prepareExecution(ctx)`              | Crée des passerelles temporaires d’authentification ou de configuration avant le lancement |
| `transformSystemPrompt(ctx)`         | Applique une transformation finale de l’invite système propre à la CLI        |
| `textTransforms`                     | Remplacements bidirectionnels dans les invites et les sorties                 |
| `defaultAuthProfileId`               | Privilégie un profil d’authentification OpenClaw spécifique                   |
| `authEpochMode`                      | Détermine comment les modifications d’authentification invalident les sessions CLI stockées |
| `nativeToolMode`                     | Déclare si les outils natifs sont absents, toujours actifs ou sélectionnables par l’hôte |
| `sideQuestionToolMode`               | Déclare les outils natifs désactivés pour les questions annexes `/btw`        |
| `bundleMcp` / `bundleMcpMode`        | Active la passerelle d’outils MCP en boucle locale d’OpenClaw                 |
| `ownsNativeCompaction`               | Le backend gère sa propre Compaction — OpenClaw s’en remet à lui              |
| `runtimeArtifact`                    | Limite un lanceur de script à l’arborescence complète de son paquet intégré   |

Conservez ces points d’extension sous la responsabilité du fournisseur. N’ajoutez pas de branches propres à une CLI au cœur lorsqu’un
point d’extension de backend peut exprimer le comportement.

`runtimeArtifact` appartient au plugin et ne peut pas être remplacé par l’utilisateur. Il n’est consulté
que lorsqu’un tour d’inférence en direct crée ou revalide une autorité de configuration vérifiée ;
les exécutions CLI normales ne l’exigent pas. Un backend dépourvu de cette déclaration ne peut pas
créer d’autorité de configuration CLI vérifiée. Une déclaration `bundled-package-tree` nomme
le propriétaire exact de `package.json` et exige que le point d’entrée du paquet soit la
commande. OpenClaw hache l’intégralité de l’arborescence délimitée du paquet installé, y compris
les dépendances imbriquées, et échoue de manière sécurisée en présence de liens symboliques de redirection,
de lanceurs situés hors du paquet déclaré, de déclarations de dépendances externes requises,
d’arborescences surdimensionnées et de scripts inconnus. Ne déclarez ceci que lorsque cette
arborescence contient l’implémentation complète de l’inférence ; les intégrations d’outils facultatives
ne rendent pas sûr un graphe d’implémentation externe.

Si le même backend fournit également un exécutable natif autonome, répertoriez ses
noms de base canoniques dans `nativeExecutableNames`. Les autres commandes natives restent
non vérifiées, même lorsqu’un utilisateur remplace la commande du backend.

`ctx.executionMode` vaut `"agent"` pour les tours normaux et `"side-question"` pour les
appels éphémères `/btw`. Utilisez-le lorsque la CLI nécessite des indicateurs ponctuels
différents, par exemple pour désactiver les outils natifs, la persistance de session ou
le comportement de reprise pour BTW. Si un backend utilise normalement
`nativeToolMode: "always-on"`, mais que ses arguments de question secondaire
désactivent ces outils de manière fiable, définissez également
`sideQuestionToolMode: "disabled"` ; sinon, OpenClaw échoue de manière sécurisée lorsque BTW
nécessite une exécution de la CLI sans outils.

Définissez `nativeToolMode: "selectable"` uniquement lorsque `resolveExecutionArgs` peut
désactiver chaque outil natif du backend pour une exécution donnée. Pour ces exécutions
restreintes, `ctx.toolAvailability.native` est un tuple vide et
`ctx.toolAvailability.mcp` est la liste d’autorisation MCP exacte isolée par l’hôte. Le hook
doit remplacer les indicateurs d’outils incompatibles et renvoyer des arguments qui imposent
ces deux valeurs ; OpenClaw l’appelle une seule fois avec les arguments finaux d’une nouvelle
exécution ou d’une reprise, et échoue de manière sécurisée lorsque le backend ne peut pas
appliquer la restriction. Dans ce contexte, les noms MCP peuvent être approuvés
automatiquement en toute sécurité uniquement parce que l’hôte a déjà limité la configuration
MCP générée à ces serveurs et outils.

### `ownsNativeCompaction` : désactiver la Compaction d’OpenClaw

Si votre backend exécute un agent qui compacte sa **propre** transcription, définissez
`ownsNativeCompaction: true` afin que le mécanisme de synthèse de protection d’OpenClaw ne
s’exécute jamais sur ses sessions : le cycle de vie de Compaction de la CLI ne fait rien et le
tour se poursuit. `claude-cli` le déclare, car Claude Code effectue la Compaction
en interne sans point de terminaison du harnais. Les sessions de harnais natif telles que Codex
continuent à être acheminées vers leur point de terminaison de Compaction du harnais.

**Ne le déclarez que si toutes les conditions suivantes sont remplies**, sinon une session
différée dépassant le budget peut rester hors budget ou devenir obsolète (OpenClaw ne la
récupère plus) :

- le backend compacte ou limite de manière fiable sa propre transcription à l’approche de sa
  fenêtre ;
- il conserve une session pouvant être reprise afin que l’état compacté persiste entre les tours
  (par exemple `--resume` / `--session-id`) ;
- il ne s’agit pas d’une session de Compaction de harnais natif : les sessions correspondant à
  `agentHarnessId` sont acheminées vers le point de terminaison du harnais à la place.

## Pont d’outils MCP

Par défaut, les backends CLI ne reçoivent pas les outils OpenClaw. Si la CLI peut consommer
une configuration MCP, activez-la explicitement :

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

Modes de pont pris en charge :

| Mode                     | Utilisation                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `claude-config-file`     | CLI acceptant un fichier de configuration MCP                      |
| `codex-config-overrides` | CLI acceptant des substitutions de configuration dans les arguments |
| `gemini-system-settings` | CLI lisant les paramètres MCP depuis leur répertoire de paramètres système |

N’activez le pont que lorsque la CLI peut réellement le consommer. Si la CLI possède
sa propre couche d’outils intégrée qui ne peut pas être désactivée, définissez `nativeToolMode:
"always-on"` afin qu’OpenClaw puisse échouer de manière sécurisée lorsqu’un appelant exige
l’absence d’outils natifs. Si elle peut désactiver tous les outils natifs pour chaque exécution,
utilisez `"selectable"` avec le contrat `resolveExecutionArgs` décrit ci-dessus.

## Configuration utilisateur

Les utilisateurs peuvent remplacer n’importe quelle valeur par défaut du backend :

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documentez la substitution minimale dont les utilisateurs auront probablement besoin,
généralement uniquement `command` lorsque le binaire se trouve en dehors de `PATH`.

## Vérification

Pour les plugins intégrés, ajoutez un test ciblé autour du générateur et de l’enregistrement
de la configuration, puis exécutez la suite de tests ciblée du plugin :

```bash
pnpm test extensions/acme-cli
```

Pour les plugins locaux ou installés, vérifiez la découverte et une exécution réelle du modèle :

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "répondez exactement : backend ok" --model acme-cli/acme-large
```

Si le backend prend en charge les images ou MCP, ajoutez un test rapide réel qui valide ces
chemins avec la véritable CLI. Ne vous fiez pas à une inspection statique pour le comportement
de l’invite, des images, de MCP ou de la reprise de session.

## Liste de contrôle

<Check>`package.json` contient `openclaw.extensions` et des entrées d’exécution compilées pour les paquets publiés</Check>
<Check>`openclaw.plugin.json` déclare `cliBackends` et un `activation.onStartup` intentionnel</Check>
<Check>`setup.cliBackends` est présent lorsque la configuration ou la découverte de modèles doit détecter le backend à froid</Check>
<Check>`api.registerCliBackend(...)` utilise le même identifiant de backend que le manifeste</Check>
<Check>Les substitutions utilisateur sous `agents.defaults.cliBackends.<id>` restent prioritaires</Check>
<Check>Les paramètres de session, d’invite système, d’image et d’analyseur de sortie correspondent au contrat réel de la CLI</Check>
<Check>Des tests ciblés et au moins un test rapide réel de la CLI valident le chemin du backend</Check>

## Pages connexes

- [Backends CLI](/fr/gateway/cli-backends) - configuration utilisateur et comportement d’exécution
- [Création de plugins](/fr/plugins/building-plugins) - principes de base des paquets et des manifestes
- [Présentation du SDK de plugin](/fr/plugins/sdk-overview) - référence de l’API d’enregistrement
- [Manifeste de plugin](/fr/plugins/manifest) - `cliBackends` et descripteurs de configuration
- [Harnais d’agent](/fr/plugins/sdk-agent-harness) - environnements d’exécution complets pour agents externes
