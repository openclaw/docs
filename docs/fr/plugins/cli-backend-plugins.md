---
read_when:
    - Vous développez un plugin de backend CLI d’IA local
    - Vous souhaitez enregistrer un backend pour des références de modèles telles que acme-cli/model
    - Vous devez intégrer une CLI tierce au programme d’exécution de secours en mode texte d’OpenClaw
sidebarTitle: CLI backend plugins
summary: Créez un Plugin qui enregistre un backend CLI d’IA local
title: Création de plugins de backend CLI
x-i18n:
    generated_at: "2026-07-12T03:02:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Les plugins de backend CLI permettent à OpenClaw d’appeler une CLI d’IA locale comme backend d’inférence
textuelle. Le backend apparaît comme préfixe de fournisseur dans les références de modèles :

```text
acme-cli/acme-large
```

Utilisez un backend CLI lorsque l’intégration en amont est déjà exposée sous forme de commande
locale, lorsque la CLI gère l’état de connexion local ou comme solution de repli lorsque les
fournisseurs d’API sont indisponibles.

<Info>
  Si le service en amont expose une API HTTP de modèle standard, écrivez plutôt un
  [plugin de fournisseur](/fr/plugins/sdk-provider-plugins). Si l’environnement d’exécution en amont
  gère des sessions d’agent complètes, les événements d’outils, la Compaction ou l’état des tâches
  en arrière-plan, utilisez un [environnement d’agent](/fr/plugins/sdk-agent-harness).
</Info>

## Responsabilités du plugin

Un plugin de backend CLI comporte trois contrats :

| Contrat                | Fichier                | Objectif                                                           |
| ---------------------- | ---------------------- | ------------------------------------------------------------------ |
| Point d’entrée du paquet | `package.json`         | Indique à OpenClaw le module d’exécution du plugin                 |
| Propriété du manifeste | `openclaw.plugin.json` | Déclare l’identifiant du backend avant le chargement de l’exécution |
| Enregistrement à l’exécution | `index.ts`             | Appelle `api.registerCliBackend(...)` avec les valeurs par défaut de la commande |

Le manifeste contient les métadonnées de découverte : il n’exécute pas la CLI et
n’enregistre aucun comportement d’exécution. Le comportement d’exécution commence lorsque
le point d’entrée du plugin appelle `api.registerCliBackend(...)`.

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

    Les paquets publiés doivent inclure les fichiers JavaScript d’exécution compilés. Si votre point
    d’entrée source est `./src/index.ts`, ajoutez `openclaw.runtimeExtensions` en le faisant pointer vers le
    fichier JavaScript compilé correspondant. Consultez [Points d’entrée](/fr/plugins/sdk-entrypoints).

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

    `cliBackends` est la liste de propriété à l’exécution ; elle permet à OpenClaw de charger automatiquement le
    plugin lorsque la configuration ou la sélection du modèle mentionne `acme-cli/...`.

    `setup.cliBackends` est la surface de configuration fondée en priorité sur les descripteurs. Ajoutez-la lorsque
    la découverte de modèles, l’intégration initiale ou l’état doivent reconnaître le backend
    sans charger l’exécution du plugin. Utilisez `requiresRuntime: false` uniquement lorsque
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
      description: "Run Acme's local AI CLI through OpenClaw",
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

| Champ                                                     | Utilisation                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `command`                                                 | Nom du binaire ou chemin absolu de la commande                                                               |
| `args`                                                    | Arguments de base pour les nouvelles exécutions                                                              |
| `resumeArgs`                                              | Autres arguments pour les sessions reprises ; prend en charge `{sessionId}`                                  |
| `output` / `resumeOutput`                                 | Analyseur : `json`, `jsonl` ou `text`                                                                        |
| `jsonlDialect`                                            | Dialecte d’événements JSONL : `claude-stream-json` ou `gemini-stream-json`                                   |
| `liveSession`                                             | Mode de processus CLI de longue durée (`claude-stdio`)                                                       |
| `input`                                                   | Transport de l’invite : `arg` ou `stdin`                                                                     |
| `maxPromptArgChars`                                       | Longueur maximale de l’invite en mode `arg` avant le repli vers l’entrée standard                            |
| `env` / `clearEnv`                                        | Variables d’environnement supplémentaires à injecter ou noms à supprimer avant le lancement                 |
| `modelArg`                                                | Option utilisée avant l’identifiant du modèle                                                                |
| `modelAliases`                                            | Associe les identifiants de modèles OpenClaw aux identifiants natifs de la CLI                               |
| `sessionArg` / `sessionArgs`                              | Manière de transmettre un identifiant de session                                                             |
| `sessionMode`                                             | `always`, `existing` ou `none`                                                                                |
| `sessionIdFields`                                         | Champs JSON qu’OpenClaw lit dans la sortie de la CLI                                                         |
| `systemPromptArg` / `systemPromptFileArg`                 | Transport de l’invite système                                                                                |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transport de remplacement de configuration pour un fichier d’invite système (par exemple `-c`)              |
| `systemPromptMode`                                        | `append` ou `replace`                                                                                         |
| `systemPromptWhen`                                        | `first`, `always` ou `never`                                                                                  |
| `imageArg` / `imageMode`                                  | Option du chemin d’image et manière de transmettre plusieurs images (`repeat` ou `list`)                     |
| `imagePathScope`                                          | Emplacement des fichiers image préparés avant leur transfert : `temp` ou `workspace`                         |
| `serialize`                                               | Maintient l’ordre des exécutions utilisant le même backend                                                   |
| `reseedFromRawTranscriptWhenUncompacted`                  | Active le réamorçage limité à partir de la transcription brute avant la Compaction pour réinitialiser les sessions en toute sécurité |
| `reliability.outputLimits`                                | Nombre maximal de caractères/lignes JSONL bruts conservés pour un tour CLI en direct (backends à session en direct) |
| `reliability.watchdog`                                    | Réglage du délai d’expiration en l’absence de sortie, distinct pour les nouvelles exécutions et les reprises |

Privilégiez la plus petite configuration statique correspondant à la CLI. Ajoutez des rappels du plugin
uniquement pour les comportements qui relèvent réellement du backend.

## Points d’extension avancés du backend

`CliBackendPlugin` peut également définir :

| Point d’extension                    | Utilisation                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)`   | Réécrit l’ancienne configuration utilisateur après la fusion                                 |
| `resolveExecutionArgs(ctx)`          | Ajoute des options propres à la requête, comme l’effort de réflexion ou l’isolation des questions annexes |
| `prepareExecution(ctx)`              | Crée des passerelles temporaires d’authentification ou de configuration avant le lancement  |
| `transformSystemPrompt(ctx)`         | Applique une transformation finale de l’invite système propre à la CLI                       |
| `textTransforms`                     | Remplacements bidirectionnels des invites et des sorties                                     |
| `defaultAuthProfileId`               | Privilégie un profil d’authentification OpenClaw spécifique                                   |
| `authEpochMode`                      | Détermine comment les changements d’authentification invalident les sessions CLI enregistrées |
| `nativeToolMode`                     | Indique si les outils natifs sont absents, toujours actifs ou sélectionnables par l’hôte     |
| `sideQuestionToolMode`               | Déclare les outils natifs désactivés pour les questions annexes `/btw`                       |
| `bundleMcp` / `bundleMcpMode`        | Active la passerelle d’outils MCP en local loopback d’OpenClaw                                |
| `ownsNativeCompaction`               | Le backend gère sa propre Compaction — OpenClaw s’en remet à lui                              |
| `runtimeArtifact`                    | Lie un lanceur de script à l’arborescence complète de son paquet intégré                     |

Conservez ces points d’extension sous la responsabilité du fournisseur. N’ajoutez pas de branches propres à la CLI au cœur
lorsqu’un point d’extension du backend peut exprimer le comportement.

`runtimeArtifact` appartient au plugin et ne peut pas être remplacé par l’utilisateur. Il n’est consulté
que lorsqu’un tour d’inférence en direct crée ou revalide une autorité de configuration vérifiée ;
les exécutions CLI normales ne l’exigent pas. Un backend dépourvu de cette déclaration ne peut pas
créer d’autorité de configuration CLI vérifiée. Une déclaration `bundled-package-tree` nomme
le propriétaire exact du `package.json` et exige que le point d’entrée du paquet soit la
commande. OpenClaw calcule le hachage de l’intégralité de l’arborescence limitée du paquet installé, y compris
les dépendances imbriquées, et échoue de manière sécurisée en cas de liens symboliques redirigés,
de lanceurs situés en dehors du paquet déclaré, de déclarations de dépendances externes
requises, d’arborescences surdimensionnées et de scripts inconnus. Ne déclarez cela que lorsque cette
arborescence contient l’implémentation complète de l’inférence ; les intégrations d’outils facultatives
ne sécurisent pas un graphe d’implémentation externe.

Si le même backend fournit également un exécutable natif autonome, répertoriez ses
noms de base canoniques dans `nativeExecutableNames`. Les autres commandes natives restent
non vérifiées même lorsqu’un utilisateur remplace la commande du backend.

`ctx.executionMode` vaut `"agent"` pour les tours normaux et `"side-question"` pour les
appels éphémères `/btw`. Utilisez-le lorsque la CLI nécessite des options ponctuelles
différentes, par exemple pour désactiver les outils natifs, la persistance de session ou
le comportement de reprise pour BTW. Si un backend possède normalement
`nativeToolMode: "always-on"`, mais que ses arguments de question annexe désactivent
ces outils de manière fiable, définissez également
`sideQuestionToolMode: "disabled"` ; sinon, OpenClaw applique un refus sécurisé lorsque BTW
nécessite une exécution de la CLI sans outils.

Définissez `nativeToolMode: "selectable"` uniquement lorsque `resolveExecutionArgs` peut
désactiver chaque outil natif du backend pour une exécution donnée. Pour ces exécutions
restreintes, `ctx.toolAvailability.native` est un tuple vide et
`ctx.toolAvailability.mcp` est la liste d’autorisation MCP exacte isolée par l’hôte. Le hook
doit remplacer les options d’outils contradictoires et renvoyer des arguments qui imposent
les deux valeurs ; OpenClaw l’appelle une fois avec les arguments finaux d’une nouvelle
exécution ou d’une reprise, et applique un refus sécurisé lorsque le backend ne peut pas
faire respecter la restriction. Dans ce contexte, les noms MCP peuvent être approuvés
automatiquement en toute sécurité uniquement parce que l’hôte a déjà limité la
configuration MCP générée à ces serveurs et outils.

### `ownsNativeCompaction` : désactiver la Compaction d’OpenClaw

Si votre backend exécute un agent qui compacte sa **propre** transcription, définissez
`ownsNativeCompaction: true` afin que le synthétiseur de protection d’OpenClaw ne
s’exécute jamais sur ses sessions : le cycle de vie de Compaction de la CLI n’effectue
aucune opération et le tour se poursuit. `claude-cli` le déclare, car Claude Code
effectue la Compaction en interne sans point de terminaison du harnais. Les sessions
de harnais natif telles que Codex continuent plutôt d’être acheminées vers le point de
terminaison de Compaction de leur harnais.

**Ne le déclarez que si toutes les conditions suivantes sont remplies**, faute de quoi
une session différée dépassant le budget peut rester hors budget ou devenir obsolète
(OpenClaw ne la récupère plus) :

- le backend compacte ou limite de manière fiable sa propre transcription à l’approche
  de sa fenêtre ;
- il conserve une session reprenable afin que l’état compacté persiste entre les tours
  (par exemple `--resume` / `--session-id`) ;
- il ne s’agit pas d’une session de Compaction de harnais natif : les sessions
  correspondant à `agentHarnessId` sont plutôt acheminées vers le point de terminaison
  du harnais.

## Pont d’outils MCP

Par défaut, les backends CLI ne reçoivent pas les outils OpenClaw. Si la CLI peut
utiliser une configuration MCP, activez-la explicitement :

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
| `gemini-system-settings` | CLI lisant les paramètres MCP dans leur répertoire de paramètres système |

N’activez le pont que lorsque la CLI peut réellement l’utiliser. Si la CLI possède
sa propre couche d’outils intégrée qui ne peut pas être désactivée, définissez
`nativeToolMode: "always-on"` afin qu’OpenClaw puisse appliquer un refus sécurisé
lorsqu’un appelant exige l’absence d’outils natifs. Si elle peut désactiver tous les
outils natifs à chaque exécution, utilisez `"selectable"` avec le contrat
`resolveExecutionArgs` décrit ci-dessus.

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

Pour les plugins intégrés, ajoutez un test ciblé portant sur le générateur et
l’enregistrement de la configuration, puis exécutez la voie de test ciblée du plugin :

```bash
pnpm test extensions/acme-cli
```

Pour les plugins locaux ou installés, vérifiez la découverte et une véritable exécution
du modèle :

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Si le backend prend en charge les images ou MCP, ajoutez un test de fumée en conditions
réelles qui valide ces parcours avec la véritable CLI. Ne vous fiez pas à une inspection
statique pour le comportement des invites, des images, de MCP ou de la reprise de session.

## Liste de contrôle

<Check>`package.json` contient `openclaw.extensions` et des entrées d’exécution compilées pour les paquets publiés</Check>
<Check>`openclaw.plugin.json` déclare `cliBackends` et une valeur intentionnelle pour `activation.onStartup`</Check>
<Check>`setup.cliBackends` est présent lorsque la configuration ou la découverte de modèles doit détecter le backend à froid</Check>
<Check>`api.registerCliBackend(...)` utilise le même identifiant de backend que le manifeste</Check>
<Check>Les substitutions utilisateur sous `agents.defaults.cliBackends.<id>` restent prioritaires</Check>
<Check>Les paramètres de session, d’invite système, d’image et d’analyseur de sortie correspondent au véritable contrat de la CLI</Check>
<Check>Des tests ciblés et au moins un test de fumée réel de la CLI valident le parcours du backend</Check>

## Pages connexes

- [Backends CLI](/fr/gateway/cli-backends) - configuration utilisateur et comportement à l’exécution
- [Création de plugins](/fr/plugins/building-plugins) - principes de base des paquets et des manifestes
- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview) - référence de l’API d’enregistrement
- [Manifeste de Plugin](/fr/plugins/manifest) - `cliBackends` et descripteurs de configuration
- [Harnais d’agent](/fr/plugins/sdk-agent-harness) - environnements d’exécution complets pour agents externes
