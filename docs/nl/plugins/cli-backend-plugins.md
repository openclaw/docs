---
read_when:
    - Je bouwt een lokale AI-CLI-backendplugin
    - U wilt een backend registreren voor modelverwijzingen zoals acme-cli/model
    - Je moet een CLI van derden koppelen aan OpenClaws tekstgebaseerde fallback-runner
sidebarTitle: CLI backend plugins
summary: Bouw een plugin die een lokale AI-CLI-backend registreert
title: CLI-backendplugins bouwen
x-i18n:
    generated_at: "2026-07-12T09:01:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI-backendplugins stellen OpenClaw in staat een lokale AI-CLI aan te roepen als
backend voor tekstinferentie. De backend verschijnt als providerprefix in modelverwijzingen:

```text
acme-cli/acme-large
```

Gebruik een CLI-backend wanneer de bovenliggende integratie al beschikbaar is als een lokale
opdracht, wanneer de CLI de lokale aanmeldstatus beheert, of als terugvaloptie wanneer API-
providers niet beschikbaar zijn.

<Info>
  Als de bovenliggende service een normale HTTP-model-API aanbiedt, schrijf dan in plaats daarvan
  een [providerplugin](/nl/plugins/sdk-provider-plugins). Als de bovenliggende
  runtime volledige agentsessies, toolgebeurtenissen, Compaction of de status van
  achtergrondtaken beheert, gebruik dan een [agentharnas](/nl/plugins/sdk-agent-harness).
</Info>

## Wat de plugin beheert

Een CLI-backendplugin heeft drie contracten:

| Contract             | Bestand                | Doel                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Pakketingang         | `package.json`         | Verwijst OpenClaw naar de runtimemodule van de plugin     |
| Manifesteigenaarschap | `openclaw.plugin.json` | Declareert de backend-id voordat de runtime wordt geladen |
| Runtimeregistratie   | `index.ts`             | Roept `api.registerCliBackend(...)` aan met opdrachtstandaarden |

Het manifest is detectiemetadata: het voert de CLI niet uit en registreert geen
runtimegedrag. Runtimegedrag begint wanneer de plugingang
`api.registerCliBackend(...)` aanroept.

## Minimale backendplugin

<Steps>
  <Step title="Pakketmetadata maken">
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

    Gepubliceerde pakketten moeten gebouwde JavaScript-runtimebestanden bevatten. Als je broningang
    `./src/index.ts` is, voeg dan `openclaw.runtimeExtensions` toe die naar de
    gebouwde JavaScript-tegenhanger verwijst. Zie [Ingangspunten](/nl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Backendeigenaarschap declareren">
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

    `cliBackends` is de lijst met runtime-eigenaarschap; hiermee kan OpenClaw de
    plugin automatisch laden wanneer configuratie of modelselectie `acme-cli/...` vermeldt.

    `setup.cliBackends` is het descriptorgerichte installatieoppervlak. Voeg dit toe wanneer
    modeldetectie, onboarding of status de backend moet herkennen
    zonder de pluginruntime te laden. Gebruik `requiresRuntime: false` alleen wanneer
    die statische descriptors voldoende zijn voor de installatie.

  </Step>

  <Step title="De backend registreren">
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

    De backend-id moet overeenkomen met de vermelding in `cliBackends` van het manifest. De
    geregistreerde `config` is alleen de standaard; gebruikersconfiguratie onder
    `agents.defaults.cliBackends.acme-cli` wordt er tijdens runtime overheen samengevoegd.

  </Step>
</Steps>

## Configuratiestructuur

`CliBackendConfig` beschrijft hoe OpenClaw de CLI moet starten en parseren:

| Veld                                                      | Gebruik                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `command`                                                 | Naam van het binaire bestand of absoluut opdrachtpad                               |
| `args`                                                    | Basis-argv voor nieuwe uitvoeringen                                                 |
| `resumeArgs`                                              | Alternatieve argv voor hervatte sessies; ondersteunt `{sessionId}`                 |
| `output` / `resumeOutput`                                 | Parser: `json`, `jsonl` of `text`                                                  |
| `jsonlDialect`                                            | JSONL-gebeurtenisdialect: `claude-stream-json` of `gemini-stream-json`             |
| `liveSession`                                             | Modus voor een langlopend CLI-proces (`claude-stdio`)                              |
| `input`                                                   | Prompttransport: `arg` of `stdin`                                                  |
| `maxPromptArgChars`                                       | Maximale promptlengte voor de modus `arg` voordat wordt teruggevallen op stdin     |
| `env` / `clearEnv`                                        | Extra omgevingsvariabelen om in te voegen, of namen om vóór het starten te verwijderen |
| `modelArg`                                                | Vlag die vóór de model-id wordt gebruikt                                           |
| `modelAliases`                                            | Wijst OpenClaw-model-id's toe aan CLI-eigen id's                                   |
| `sessionArg` / `sessionArgs`                              | Hoe een sessie-id wordt doorgegeven                                                |
| `sessionMode`                                             | `always`, `existing` of `none`                                                     |
| `sessionIdFields`                                         | JSON-velden die OpenClaw uit CLI-uitvoer leest                                     |
| `systemPromptArg` / `systemPromptFileArg`                 | Transport van de systeemprompt                                                     |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transport voor configuratieoverschrijving van een systeempromptbestand (bijvoorbeeld `-c`) |
| `systemPromptMode`                                        | `append` of `replace`                                                              |
| `systemPromptWhen`                                        | `first`, `always` of `never`                                                       |
| `imageArg` / `imageMode`                                  | Vlag voor afbeeldingspaden en hoe meerdere afbeeldingen worden doorgegeven (`repeat` of `list`) |
| `imagePathScope`                                          | Waar klaargezette afbeeldingsbestanden vóór overdracht staan: `temp` of `workspace` |
| `serialize`                                               | Houd uitvoeringen met dezelfde backend geordend                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | Schakel begrensd opnieuw vullen vanuit het onbewerkte transcript vóór Compaction in voor veilige sessieherinitialisaties |
| `reliability.outputLimits`                                | Maximaal aantal behouden onbewerkte JSONL-tekens/-regels voor één live CLI-beurt (backends met livesessies) |
| `reliability.watchdog`                                    | Afstemming van time-outs zonder uitvoer, afzonderlijk voor nieuwe en hervatte uitvoeringen |

Geef de voorkeur aan de kleinste statische configuratie die bij de CLI past. Voeg plugincallbacks
alleen toe voor gedrag dat daadwerkelijk bij de backend hoort.

## Geavanceerde backendhooks

`CliBackendPlugin` kan ook het volgende definiëren:

| Hook                               | Gebruik                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `normalizeConfig(config, context)` | Herschrijf verouderde gebruikersconfiguratie na samenvoeging                   |
| `resolveExecutionArgs(ctx)`        | Voeg aanvraaggebonden vlaggen toe, zoals denkinspanning of isolatie van nevenvragen |
| `prepareExecution(ctx)`            | Maak vóór het starten tijdelijke authenticatie- of configuratiebruggen         |
| `transformSystemPrompt(ctx)`       | Pas een laatste CLI-specifieke transformatie van de systeemprompt toe          |
| `textTransforms`                   | Tweerichtingsvervangingen voor prompts/uitvoer                                 |
| `defaultAuthProfileId`             | Geef de voorkeur aan een specifiek OpenClaw-authenticatieprofiel                |
| `authEpochMode`                    | Bepaal hoe authenticatiewijzigingen opgeslagen CLI-sessies ongeldig maken      |
| `nativeToolMode`                   | Declareer of systeemeigen tools afwezig, altijd ingeschakeld of door de host selecteerbaar zijn |
| `sideQuestionToolMode`             | Declareer uitgeschakelde systeemeigen tools voor nevenvragen via `/btw`         |
| `bundleMcp` / `bundleMcpMode`      | Schakel de local loopback-MCP-toolbrug van OpenClaw in                          |
| `ownsNativeCompaction`             | De backend beheert zijn eigen Compaction - OpenClaw stelt deze uit              |
| `runtimeArtifact`                  | Bind een scriptstarter aan de volledige meegeleverde pakketboom                 |

Houd deze hooks onder beheer van de provider. Voeg geen CLI-specifieke vertakkingen toe aan de kern wanneer
een backendhook het gedrag kan uitdrukken.

`runtimeArtifact` wordt door de plugin beheerd en kan niet door de gebruiker worden overschreven. Het wordt
alleen geraadpleegd wanneer een live inferentiebeurt geverifieerde installatiebevoegdheid aanmaakt of opnieuw valideert;
normale CLI-uitvoeringen vereisen dit niet. Een backend zonder deze declaratie kan geen
geverifieerde CLI-installatiebevoegdheid aanmaken. Een declaratie `bundled-package-tree` benoemt
de exacte eigenaar van `package.json` en vereist dat het pakketingangspunt de
opdracht is. OpenClaw hasht de begrensde, volledige geïnstalleerde pakketboom, inclusief
geneste afhankelijkheden, en weigert standaard bij omleidende symbolische koppelingen,
starters buiten het gedeclareerde pakket, vereiste externe afhankelijkheidsdeclaraties,
te grote bomen en onbekende scripts. Declareer dit alleen wanneer die
boom de volledige inferentie-implementatie bevat; optionele toolintegraties
maken een externe implementatiegraaf niet veilig.

Als dezelfde backend ook een zelfstandig systeemeigen uitvoerbaar bestand levert, vermeld dan de
canonieke basisnamen in `nativeExecutableNames`. Andere systeemeigen opdrachten blijven
niet-geverifieerd, zelfs wanneer een gebruiker de backendopdracht overschrijft.

`ctx.executionMode` is `"agent"` voor normale beurten en `"side-question"` voor
tijdelijke `/btw`-aanroepen. Gebruik dit wanneer de CLI andere eenmalige vlaggen nodig heeft,
zoals voor het uitschakelen van native tools, sessiepersistentie of hervattingsgedrag voor
BTW. Als een backend normaal `nativeToolMode: "always-on"` heeft, maar de argv voor
zijvragen deze tools betrouwbaar uitschakelt, stel dan ook
`sideQuestionToolMode: "disabled"` in; anders weigert OpenClaw veilig wanneer BTW
een CLI-uitvoering zonder tools vereist.

Stel `nativeToolMode: "selectable"` alleen in wanneer `resolveExecutionArgs`
elke backend-native tool voor een afzonderlijke uitvoering kan uitschakelen. Voor deze beperkte uitvoeringen
is `ctx.toolAvailability.native` een lege tuple en
is `ctx.toolAvailability.mcp` de exacte, van de host geïsoleerde MCP-toelatingslijst. De hook
moet conflicterende toolvlaggen vervangen en argv retourneren die beide waarden afdwingt;
OpenClaw roept de hook eenmaal aan met de uiteindelijke argv voor een nieuwe of hervatte sessie en weigert veilig wanneer
de backend de beperking niet kan afdwingen. MCP-namen in deze context mogen alleen
automatisch worden goedgekeurd omdat de host de gegenereerde MCP-configuratie al heeft
beperkt tot die servers en tools.

### `ownsNativeCompaction`: OpenClaw-compactie uitschakelen

Als uw backend een agent uitvoert die zijn **eigen** transcript compacteert, stel dan
`ownsNativeCompaction: true` in, zodat de beveiligende samenvatter van OpenClaw nooit
op zijn sessies wordt uitgevoerd: de CLI-compactielevenscyclus voert geen bewerking uit en de
beurt gaat verder. `claude-cli` declareert dit omdat Claude Code intern compacteert
zonder harness-eindpunt. Sessies met een native harness, zoals Codex,
blijven in plaats daarvan naar het compactie-eindpunt van hun harness worden gerouteerd.

**Declareer dit alleen wanneer aan alle volgende voorwaarden is voldaan**, anders kan een uitgestelde
sessie die het budget overschrijdt boven het budget blijven of verouderd raken (OpenClaw
herstelt deze niet langer):

- de backend compacteert of begrenst zijn eigen transcript betrouwbaar wanneer het
  venster bijna vol is;
- de backend bewaart een hervatbare sessie, zodat de gecompacteerde toestand tussen beurten behouden blijft
  (bijvoorbeeld `--resume` / `--session-id`);
- het is geen compactiesessie met een native harness: sessies met een overeenkomende `agentHarnessId`
  worden in plaats daarvan naar het harness-eindpunt gerouteerd.

## MCP-toolbrug

CLI-backends ontvangen standaard geen OpenClaw-tools. Als de CLI een
MCP-configuratie kan gebruiken, schakel dit dan expliciet in:

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

Ondersteunde brugmodi:

| Modus                    | Gebruik                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLI's die een MCP-configuratiebestand accepteren                   |
| `codex-config-overrides` | CLI's die configuratieoverschrijvingen in argv accepteren          |
| `gemini-system-settings` | CLI's die MCP-instellingen uit hun map met systeeminstellingen lezen |

Schakel de brug alleen in wanneer de CLI deze daadwerkelijk kan gebruiken. Als de CLI
een eigen ingebouwde toollaag heeft die niet kan worden uitgeschakeld, stel dan `nativeToolMode:
"always-on"` in, zodat OpenClaw veilig kan weigeren wanneer een aanroeper vereist dat er geen native
tools zijn. Als alle native tools per uitvoering kunnen worden uitgeschakeld, gebruikt u `"selectable"` met het
hierboven beschreven `resolveExecutionArgs`-contract.

## Gebruikersconfiguratie

Gebruikers kunnen elke standaardwaarde van een backend overschrijven:

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

Documenteer de minimale overschrijving die gebruikers waarschijnlijk nodig hebben, doorgaans alleen
`command` wanneer het binaire bestand zich buiten `PATH` bevindt.

## Verificatie

Voeg voor gebundelde plugins een gerichte test toe voor de builder en
setupregistratie en voer vervolgens de gerichte testreeks van de Plugin uit:

```bash
pnpm test extensions/acme-cli
```

Controleer voor lokale of geïnstalleerde plugins de detectie en één echte modeluitvoering:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Als de backend afbeeldingen of MCP ondersteunt, voeg dan een live-rooktest toe die deze
paden met de echte CLI bewijst. Vertrouw niet op statische inspectie voor prompt-, afbeeldings-,
MCP- of sessiehervattingsgedrag.

## Controlelijst

<Check>`package.json` bevat `openclaw.extensions` en gebouwde runtimevermeldingen voor gepubliceerde pakketten</Check>
<Check>`openclaw.plugin.json` declareert `cliBackends` en een doelbewuste `activation.onStartup`</Check>
<Check>`setup.cliBackends` is aanwezig wanneer setup/modeldetectie de backend koud moet kunnen vinden</Check>
<Check>`api.registerCliBackend(...)` gebruikt dezelfde backend-id als het manifest</Check>
<Check>Gebruikersoverschrijvingen onder `agents.defaults.cliBackends.<id>` blijven voorrang houden</Check>
<Check>Instellingen voor sessie, systeemprompt, afbeelding en uitvoerparser komen overeen met het echte CLI-contract</Check>
<Check>Gerichte tests en ten minste één live-CLI-rooktest bewijzen het backendpad</Check>

## Gerelateerd

- [CLI-backends](/nl/gateway/cli-backends) - gebruikersconfiguratie en runtimegedrag
- [Plugins bouwen](/nl/plugins/building-plugins) - basisprincipes van pakketten en manifesten
- [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) - API-referentie voor registratie
- [Pluginmanifest](/nl/plugins/manifest) - `cliBackends` en setupbeschrijvingen
- [Agent-harness](/nl/plugins/sdk-agent-harness) - volledige externe agentruntimes
