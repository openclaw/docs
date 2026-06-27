---
read_when:
    - Je bouwt een lokale AI-CLI-backend-Plugin
    - Je wilt een backend registreren voor modelverwijzingen zoals acme-cli/model
    - Je moet een CLI van derden koppelen aan OpenClaw's tekstfallback-runner
sidebarTitle: CLI backend plugins
summary: Bouw een Plugin die een lokale AI CLI-backend registreert
title: CLI-backendplugins bouwen
x-i18n:
    generated_at: "2026-06-27T17:50:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI-backendplugins laten OpenClaw een lokale AI-CLI aanroepen als tekstinferentiebackend. De backend verschijnt als providerprefix in modelverwijzingen:

```text
acme-cli/acme-large
```

Gebruik een CLI-backend wanneer de upstreamintegratie al beschikbaar is als lokale opdracht, wanneer de CLI lokale aanmeldstatus beheert, of wanneer de CLI een nuttige fallback is als API-providers niet beschikbaar zijn.

<Info>
  Als de upstreamservice een normale HTTP-model-API aanbiedt, schrijf dan in plaats daarvan een
  [providerplugin](/nl/plugins/sdk-provider-plugins). Als de upstreamruntime volledige agentsessies, toolgebeurtenissen, Compaction of achtergrondtaakstatus beheert, gebruik dan een [agentharnas](/nl/plugins/sdk-agent-harness).
</Info>

## Wat de plugin beheert

Een CLI-backendplugin heeft drie contracten:

| Contract             | Bestand               | Doel                                                      |
| -------------------- | --------------------- | --------------------------------------------------------- |
| Pakketentry          | `package.json`        | Wijst OpenClaw naar de runtimemodule van de plugin        |
| Manifestbeheer       | `openclaw.plugin.json` | Declareert de backend-ID voordat de runtime laadt         |
| Runtimeregistratie   | `index.ts`            | Roept `api.registerCliBackend(...)` aan met opdrachtstandaarden |

Het manifest is discoverymetadata. Het voert de CLI niet uit en registreert geen runtimegedrag. Runtimegedrag start wanneer de pluginentry `api.registerCliBackend(...)` aanroept.

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

    Gepubliceerde pakketten moeten gebouwde JavaScript-runtimebestanden meeleveren. Als je bronentry `./src/index.ts` is, voeg dan `openclaw.runtimeExtensions` toe die naar de gebouwde JavaScript-peer wijst. Zie [Entry points](/nl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Backendbeheer declareren">
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

    `cliBackends` is de lijst met runtimebeheer. Hiermee kan OpenClaw de plugin automatisch laden wanneer configuratie of modelselectie `acme-cli/...` noemt.

    `setup.cliBackends` is het descriptor-eerst setupoppervlak. Voeg dit toe wanneer modeldiscovery, onboarding of status de backend moet herkennen zonder pluginruntime te laden. Gebruik `requiresRuntime: false` alleen wanneer die statische descriptors voldoende zijn voor setup.

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

    De backend-ID moet overeenkomen met de `cliBackends`-entry in het manifest. De geregistreerde `config` is alleen de standaardwaarde; gebruikersconfiguratie onder `agents.defaults.cliBackends.acme-cli` wordt er tijdens runtime overheen samengevoegd.

  </Step>
</Steps>

## Configuratievorm

`CliBackendConfig` beschrijft hoe OpenClaw de CLI moet starten en parsen:

| Veld                                      | Gebruik                                                     |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Binaire naam of absoluut opdrachtpad                        |
| `args`                                    | Basis-argv voor nieuwe runs                                 |
| `resumeArgs`                              | Alternatieve argv voor hervatte sessies; ondersteunt `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` of `text`                           |
| `input`                                   | Prompttransport: `arg` of `stdin`                           |
| `modelArg`                                | Vlag die voor de model-ID wordt gebruikt                    |
| `modelAliases`                            | Koppel OpenClaw-model-ID's aan CLI-native ID's              |
| `sessionArg` / `sessionArgs`              | Hoe een sessie-ID wordt doorgegeven                         |
| `sessionMode`                             | `always`, `existing` of `none`                              |
| `sessionIdFields`                         | JSON-velden die OpenClaw uit CLI-uitvoer leest              |
| `systemPromptArg` / `systemPromptFileArg` | Systeemprompttransport                                      |
| `systemPromptWhen`                        | `first`, `always` of `never`                                |
| `imageArg` / `imageMode`                  | Ondersteuning voor afbeeldingspaden                         |
| `serialize`                               | Houd runs met dezelfde backend geordend                     |
| `reliability.watchdog`                    | Afstemming van time-out bij geen uitvoer                    |

Geef de voorkeur aan de kleinste statische configuratie die bij de CLI past. Voeg plugincallbacks alleen toe voor gedrag dat echt bij de backend hoort.

## Geavanceerde backendhooks

`CliBackendPlugin` kan ook definiëren:

| Hook                               | Gebruik                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Herschrijf verouderde gebruikersconfiguratie na samenvoeging                |
| `resolveExecutionArgs(ctx)`        | Voeg request-scoped vlaggen toe, zoals redeneerinspanning of isolatie van zijvragen |
| `prepareExecution(ctx)`            | Maak tijdelijke auth- of configuratiebruggen voor het starten               |
| `transformSystemPrompt(ctx)`       | Pas een laatste CLI-specifieke systeemprompttransformatie toe               |
| `textTransforms`                   | Bidirectionele prompt-/uitvoervervangingen                                  |
| `defaultAuthProfileId`             | Geef de voorkeur aan een specifiek OpenClaw-authprofiel                     |
| `authEpochMode`                    | Bepaal hoe authwijzigingen opgeslagen CLI-sessies ongeldig maken            |
| `nativeToolMode`                   | Declareer of de CLI altijd ingeschakelde native tools heeft                 |
| `sideQuestionToolMode`             | Declareer uitgeschakelde native tools voor `/btw`-zijvragen                 |
| `bundleMcp` / `bundleMcpMode`      | Kies voor OpenClaw's loopback MCP-toolbrug                                  |
| `ownsNativeCompaction`             | Backend beheert zijn eigen Compaction - OpenClaw stelt uit                  |

Houd deze hooks providerbeheerd. Voeg geen CLI-specifieke vertakkingen toe aan core wanneer een backendhook het gedrag kan uitdrukken.

`ctx.executionMode` is `"agent"` voor normale beurten en `"side-question"` voor tijdelijke `/btw`-aanroepen. Gebruik dit wanneer de CLI andere eenmalige vlaggen nodig heeft, zoals het uitschakelen van native tools, sessiepersistentie of hervattingsgedrag voor BTW. Als een backend normaal `nativeToolMode: "always-on"` heeft, maar zijn argv voor zijvragen die tools betrouwbaar uitschakelt, stel dan ook `sideQuestionToolMode: "disabled"` in; anders faalt OpenClaw gesloten wanneer BTW een CLI-run zonder tools vereist.

### `ownsNativeCompaction`: afmelden voor OpenClaw Compaction

Als je backend een agent uitvoert die zijn **eigen** transcript comprimeert, stel dan `ownsNativeCompaction: true` in zodat OpenClaw's beschermende samenvatter nooit tegen zijn sessies draait - de CLI-Compactionlevenscyclus retourneert een no-op en de beurt gaat door. `claude-cli` declareert dit omdat Claude Code intern comprimeert zonder harnaseindpunt. Native-harnassessies zoals Codex blijven in plaats daarvan routeren naar hun harnas-Compactioneindpunt.

**Declareer dit alleen wanneer al het volgende geldt**, anders kan een uitgestelde sessie die over budget is boven budget blijven / verouderen (OpenClaw redt deze niet langer):

- de backend comprimeert of begrenst betrouwbaar zijn eigen transcript wanneer dit het venster nadert;
- hij bewaart een hervatbare sessie zodat de gecomprimeerde status beurten overleeft
  (bijv. `--resume` / `--session-id`);
- het is geen native-harnas-Compactionsessie - overeenkomende `agentHarnessId`-sessies routeren in plaats daarvan naar het harnaseindpunt.

## MCP-toolbrug

CLI-backends ontvangen standaard geen OpenClaw-tools. Als de CLI een MCP-configuratie kan gebruiken, meld je dan expliciet aan:

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

Ondersteunde brugmodi zijn:

| Modus                    | Gebruik                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI's die een MCP-configuratiebestand accepteren                 |
| `codex-config-overrides` | CLI's die configuratie-overschrijvingen op argv accepteren       |
| `gemini-system-settings` | CLI's die MCP-instellingen uit hun systeeminstellingenmap lezen  |

Schakel de brug alleen in wanneer de CLI deze daadwerkelijk kan gebruiken. Als de CLI een eigen ingebouwde toollaag heeft die niet kan worden uitgeschakeld, stel dan `nativeToolMode:
"always-on"` in zodat OpenClaw gesloten kan falen wanneer een aanroeper geen native tools vereist.

## Gebruikersconfiguratie

Gebruikers kunnen elke backendstandaard overschrijven:

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

Documenteer de minimale overschrijving die gebruikers waarschijnlijk nodig hebben. Meestal is dat alleen `command` wanneer het binaire bestand buiten `PATH` staat.

## Verificatie

Voeg voor gebundelde Plugins een gerichte test toe rond de builder en setupregistratie, en voer daarna de gerichte testlane van de Plugin uit:

```bash
pnpm test extensions/acme-cli
```

Verifieer voor lokale of geïnstalleerde Plugins discovery en één echte modeluitvoering:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Als de backend afbeeldingen of MCP ondersteunt, voeg dan een live smoketest toe die deze paden met de echte CLI bewijst. Vertrouw niet op statische inspectie voor prompt-, afbeelding-, MCP- of sessiehervattingsgedrag.

## Checklist

<Check>`package.json` heeft `openclaw.extensions` en gebouwde runtime-items voor gepubliceerde pakketten</Check>
<Check>`openclaw.plugin.json` declareert `cliBackends` en intentionele `activation.onStartup`</Check>
<Check>`setup.cliBackends` is aanwezig wanneer setup/modeldiscovery de backend koud moet zien</Check>
<Check>`api.registerCliBackend(...)` gebruikt dezelfde backend-id als het manifest</Check>
<Check>Gebruikersoverschrijvingen onder `agents.defaults.cliBackends.<id>` blijven winnen</Check>
<Check>Instellingen voor sessie, systeemprompt, afbeelding en uitvoerparser komen overeen met het echte CLI-contract</Check>
<Check>Gerichte tests en ten minste één live CLI-smoketest bewijzen het backendpad</Check>

## Gerelateerd

- [CLI-backends](/nl/gateway/cli-backends) - gebruikersconfiguratie en runtimegedrag
- [Plugins bouwen](/nl/plugins/building-plugins) - basisprincipes van pakket en manifest
- [Overzicht van Plugin-SDK](/nl/plugins/sdk-overview) - referentie voor registratie-API
- [Pluginmanifest](/nl/plugins/manifest) - `cliBackends` en setupdescriptors
- [Agent-harnas](/nl/plugins/sdk-agent-harness) - volledige externe agentruntimes
