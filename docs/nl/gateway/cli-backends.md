---
read_when:
    - Je wilt een betrouwbare terugvaloptie wanneer API-providers uitvallen
    - Je draait lokale AI-CLI's en wilt ze hergebruiken
    - Je wilt de MCP-loopbackbridge voor tooltoegang via de CLI-backend begrijpen
summary: 'CLI-backends: terugvaloptie voor lokale AI-CLI met optionele MCP-toolbridge'
title: CLI-backends
x-i18n:
    generated_at: "2026-07-16T15:35:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan een lokale AI-CLI uitvoeren als tekstuele terugvaloptie wanneer API-providers niet beschikbaar zijn, beperkt worden vanwege aanvraaglimieten of zich onjuist gedragen. Dit is bewust conservatief opgezet:

- OpenClaw-tools worden niet rechtstreeks geïnjecteerd, maar een backend met `bundleMcp: true` kan Gateway-tools ontvangen via een loopback-MCP-bridge.
- JSONL-streaming voor CLI's die dit ondersteunen.
- Sessies worden ondersteund, zodat vervolgbeurten coherent blijven.
- Afbeeldingen worden doorgegeven als de CLI afbeeldingspaden accepteert.

Gebruik dit als vangnet voor tekstreacties die "altijd werken", niet als primair pad. Gebruik in plaats daarvan [ACP-agents](/nl/tools/acp-agents) voor een volledige harness-runtime met ACP-sessiebediening, achtergrondtaken, thread-/gesprekskoppeling en persistente externe codeersessies; CLI-backends zijn geen ACP.

<Tip>
  Een nieuwe backend-Plugin bouwen? Zie [CLI-backend-Plugins](/nl/plugins/cli-backend-plugins). Deze pagina behandelt het configureren en gebruiken van een reeds geregistreerde backend.
</Tip>

## Snel aan de slag

De meegeleverde Anthropic-Plugin registreert een standaardbackend `claude-cli`, zodat deze zonder verdere configuratie werkt als Claude Code is geïnstalleerd en je bent aangemeld:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` is de standaard-agent-id wanneer geen expliciete agentlijst is geconfigureerd; gebruik anders je eigen agent-id.

Als de Gateway onder launchd/systemd met een minimale `PATH` draait, verwijs dan expliciet naar het binaire bestand:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Als je een meegeleverde CLI-backend als primaire berichtenprovider op een Gateway-host gebruikt, laadt OpenClaw de bijbehorende meegeleverde Plugin automatisch wanneer je configuratie naar die backend verwijst in een modelreferentie of onder `agents.defaults.cliBackends`.

## Als terugvaloptie gebruiken

Voeg de CLI-backend toe aan je lijst met terugvalopties, zodat deze alleen wordt uitgevoerd wanneer primaire modellen mislukken:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Als je `agents.defaults.models` als toelatingslijst gebruikt, neem daar dan ook je CLI-backendmodellen in op. Wanneer de primaire provider mislukt (authenticatie, aanvraaglimieten, time-outs), probeert OpenClaw vervolgens de CLI-backend.

## Configuratie

Alle CLI-backends staan onder `agents.defaults.cliBackends`, met de provider-id als sleutel (bijvoorbeeld `claude-cli`, `my-cli`). De provider-id wordt de linkerkant van de modelreferentie: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Specifieke vlag voor promptbestanden:
          // systemPromptFileArg: "--system-file",
          // Of een configuratie-overschrijvingsvlag in Codex-stijl:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Schakel dit alleen in als deze backend ongeldige sessies opnieuw mag vullen
          // vanuit begrensde onbewerkte OpenClaw-transcriptgeschiedenis vóór Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Werking

1. Selecteert een backend op basis van het providerprefix (`claude-cli/...`).
2. Bouwt een systeemprompt met dezelfde OpenClaw-prompt en werkruimtecontext.
3. Voert de CLI uit met een sessie-id (indien ondersteund), zodat de geschiedenis consistent blijft. De meegeleverde backend `claude-cli` houdt per OpenClaw-sessie een Claude-stdio-proces actief en verzendt vervolgbeurten via stream-json-stdin.
4. Parseert de uitvoer (JSON of platte tekst) en retourneert de uiteindelijke tekst.
5. Slaat sessie-id's per backend persistent op, zodat vervolgbeurten dezelfde CLI-sessie hergebruiken.

### Bijzonderheden van Claude CLI

De meegeleverde backend `claude-cli` geeft de voorkeur aan de ingebouwde Skills-resolver van Claude Code. Wanneer de huidige Skills-momentopname ten minste één geselecteerde Skill met een gematerialiseerd pad bevat, geeft OpenClaw via `--plugin-dir` een tijdelijke Claude Code-Plugin door en laat het de dubbele OpenClaw-Skills-catalogus weg uit de toegevoegde systeemprompt. Zonder een gematerialiseerde Plugin-Skill behoudt OpenClaw de promptcatalogus als terugvaloptie. Overschrijvingen van Skill-omgevingsvariabelen/API-sleutels blijven van toepassing op de omgeving van het onderliggende proces voor de uitvoering.

Claude CLI heeft een eigen niet-interactieve machtigingsmodus; OpenClaw koppelt die aan het bestaande uitvoeringsbeleid in plaats van Claude-specifieke configuratie toe te voegen. Voor door OpenClaw beheerde live Claude-sessies is het effectieve uitvoeringsbeleid leidend: YOLO (`tools.exec.security: "full"` en `tools.exec.ask: "off"`) start Claude normaal gesproken met `--permission-mode bypassPermissions`, terwijl een beperkend beleid Claude met `--permission-mode default` start. Gateways die als root worden uitgevoerd, gebruiken ook `default`, omdat Claude Code de bypassmodus voor root weigert; OpenClaw beantwoordt de stdio-verzoeken van Claude voor toolbediening nog steeds volgens het geconfigureerde uitvoeringsbeleid. Instellingen van `agents.list[].tools.exec` per agent overschrijven voor die agent de globale `tools.exec`. Onbewerkte backendargumenten kunnen nog steeds `--permission-mode` bevatten, maar live Claude-starts normaliseren die vlag zodat deze overeenkomt met het effectieve beleid en de hostbeperking.

De backend koppelt ook de OpenClaw-niveaus `/think` aan de ingebouwde vlag `--effort` van Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, en `high`/`xhigh`/`max` worden rechtstreeks doorgegeven. Hierdoor blijven de ondersteunde Fable 5-inspanningsniveaus gelijk voor Claude CLI via een abonnement en routes met een API-sleutel. `adaptive` verwijdert geconfigureerde `--effort`-vlaggen en levert geen vervanging, zodat Claude Code de effectieve inspanning bepaalt op basis van zijn eigen omgeving, instellingen en modelstandaarden. Voor andere CLI-backends moet de bijbehorende Plugin een gelijkwaardige argv-mapper declareren voordat `/think` invloed heeft op de gestarte CLI.

Voordat OpenClaw `claude-cli` kan gebruiken, moet Claude Code zelf op dezelfde host zijn aangemeld:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bij Docker-installaties moet Claude Code binnen de persistente home-map van de container zijn geïnstalleerd en aangemeld, niet alleen op de host; zie [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).

Stel `agents.defaults.cliBackends.claude-cli.command` alleen in wanneer het binaire bestand `claude` nog niet op `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stel je `sessionArg` in (bijvoorbeeld `--session-id`), of `sessionArgs` (tijdelijke aanduiding `{sessionId}`) wanneer de id in meerdere vlaggen moet terechtkomen.
- Als de CLI een hervattingssubopdracht met andere vlaggen gebruikt, stel je `resumeArgs` in (vervangt `args` bij hervatten) en eventueel `resumeOutput` voor hervattingen zonder JSON.
- `sessionMode`:
  - `always`: verzend altijd een sessie-id (een nieuwe UUID als er geen is opgeslagen).
  - `existing`: verzend alleen een sessie-id als er eerder een is opgeslagen.
  - `none`: verzend nooit een sessie-id.
- `claude-cli` gebruikt standaard `liveSession: "claude-stdio"`, `output: "jsonl"` en `input: "stdin"`, zodat vervolgbeurten het actieve Claude-proces hergebruiken, ook voor aangepaste configuraties waarin transportvelden ontbreken. Als de Gateway opnieuw wordt gestart of het inactieve proces wordt afgesloten, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-id's worden vóór hervatting gecontroleerd aan de hand van een leesbaar projecttranscript; als het transcript ontbreekt, wordt de koppeling gewist (vastgelegd als `reason=transcript-missing`) in plaats van ongemerkt een nieuwe sessie onder `--resume` te starten.
- Live Claude-sessies hanteren begrensde beveiligingen voor JSONL-uitvoer: standaard 8 MiB en 20,000 onbewerkte JSONL-regels per beurt. Verhoog deze per backend met `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` en `maxTurnLines`; OpenClaw begrenst die instellingen op 64 MiB en 100,000 regels.
- Opgeslagen CLI-sessies vormen continuïteit die eigendom is van de provider. De impliciete dagelijkse sessiereset onderbreekt ze niet; `/reset` en expliciete `session.reset`-beleidsregels doen dat nog steeds.
- Nieuwe CLI-sessies worden normaal gesproken alleen opnieuw gevuld vanuit de Compaction-samenvatting van OpenClaw plus het deel na de Compaction. Om korte sessies te herstellen die vóór Compaction ongeldig zijn geworden, kan een backend dit inschakelen met `reseedFromRawTranscriptWhenUncompacted: true`. Het opnieuw vullen vanuit een onbewerkt transcript blijft begrensd en beperkt tot veilige ongeldigverklaringen, zoals een ontbrekend CLI-transcript, een verweesd toolgebruikseinde, wijzigingen in berichtenbeleid/systeemprompt/werkmap/MCP of een nieuwe poging na het verlopen van een sessie; wijzigingen in het authenticatieprofiel of credentialtijdperk vullen de onbewerkte transcriptgeschiedenis nooit opnieuw.

Serialisatie: `serialize: true` houdt uitvoeringen binnen dezelfde baan op volgorde (de meeste CLI's serialiseren binnen één providerbaan). OpenClaw hergebruikt opgeslagen CLI-sessies ook niet meer wanneer de geselecteerde authenticatie-identiteit verandert, waaronder een gewijzigde authenticatieprofiel-id, statische API-sleutel, statisch token of OAuth-accountidentiteit wanneer de CLI die beschikbaar stelt; alleen rotatie van OAuth-toegangs-/vernieuwingstokens onderbreekt de sessie niet. Als een CLI geen stabiele OAuth-account-id heeft, laat OpenClaw die CLI zijn eigen hervattingsmachtigingen afdwingen.

## Terugvalinleiding vanuit claude-cli-sessies

Wanneer een poging via `claude-cli` terugvalt op een niet-CLI-kandidaat in [`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), voorziet OpenClaw de volgende poging van een contextinleiding uit het lokale JSONL-transcript van Claude Code (onder `~/.claude/projects/`, per werkruimte als sleutel). Zonder deze uitgangscontext begint de terugvalprovider zonder context, omdat het eigen sessietranscript van OpenClaw leeg is voor uitvoeringen via `claude-cli`.

- De inleiding geeft de voorkeur aan de nieuwste `/compact`-samenvatting of `compact_boundary`-markering en voegt vervolgens de meest recente beurten na de grens toe tot aan een tekenbudget. Beurten vóór de grens worden verwijderd omdat de samenvatting ze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte aanwijzingen `(tool call: name)` en `(tool result: …)` om het promptbudget correct te houden; een te grote samenvatting wordt afgekapt en gelabeld als `(truncated)`.
- Terugvalopties van dezelfde provider van `claude-cli` naar `claude-cli` vertrouwen op Claude's eigen `--resume` en slaan de inleiding over.
- De uitgangscontext hergebruikt de bestaande validatie van het Claude-sessiebestandspad, zodat willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen

Als je CLI afbeeldingspaden accepteert, stel je `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die paden als CLI-argumenten doorgegeven; anders voegt OpenClaw de bestandspaden toe aan de prompt (padinjectie), wat werkt voor CLI's die lokale bestanden automatisch via platte paden laden.

## Invoer en uitvoer

- `output: "text"` (standaard) behandelt stdout als de uiteindelijke reactie.
- `output: "json"` probeert JSON te parseren en tekst plus een sessie-id te extraheren.
- `output: "jsonl"` parseert een JSONL-stream en extraheert het uiteindelijke agentbericht plus sessie-id's wanneer die aanwezig zijn.
- Voor JSON-uitvoer van Gemini CLI leest OpenClaw de antwoordtekst uit `response` en het gebruik uit `stats` wanneer `usage` ontbreekt of leeg is. De meegeleverde standaardinstelling voor Gemini CLI gebruikt `stream-json`; oude overschrijvingen van `--output-format json` gebruiken nog steeds de JSON-parser.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als het laatste CLI-argument.
- `input: "stdin"` verzendt de prompt via stdin.
- Als de prompt zeer lang is en `maxPromptArgChars` is ingesteld, wordt in plaats daarvan stdin gebruikt.

## Standaardwaarden van Plugins

Standaardwaarden voor CLI-backends maken deel uit van het Plugin-oppervlak:

- Plugins registreren deze met `api.registerCliBackend(...)`.
- De backend-`id` wordt het providervoorvoegsel in modelreferenties.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de standaardwaarde van de Plugin.
- Backend-specifieke configuratieopschoning blijft eigendom van de Plugin via de optionele `normalizeConfig`-hook.

Anthropic beheert `claude-cli` en Google beheert `google-gemini-cli`. OpenAI Codex-agentuitvoeringen gebruiken de Codex-app-serverharness via `openai/*`; OpenClaw registreert niet langer een gebundelde `codex-cli`-backend.

De gebundelde Anthropic-Plugin registreert voor `claude-cli`:

| Sleutel               | Waarde                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

De gebundelde Google-Plugin registreert voor `google-gemini-cli`:

| Sleutel                   | Waarde                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | hetzelfde, met `--resume {sessionId}`                                                 |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Vereiste: de lokale Gemini CLI moet zijn geïnstalleerd en als `gemini` beschikbaar zijn op `PATH` (`brew install gemini-cli` of `npm install -g @google/gemini-cli`).

Opmerkingen over Gemini CLI-uitvoer:

- De standaard `stream-json`-parser leest assistent-`message`-gebeurtenissen, toolgebeurtenissen, het uiteindelijke `result`-gebruik en fatale Gemini-foutgebeurtenissen.
- Als je de Gemini-argumenten overschrijft met `--output-format json`, normaliseert OpenClaw die backend terug naar `output: "json"` en leest het antwoordtekst uit het JSON-veld `response`.
- Het gebruik valt terug op `stats` wanneer `usage` ontbreekt of leeg is; `stats.cached` wordt genormaliseerd naar OpenClaw-`cacheRead`, en als `stats.input` ontbreekt, worden invoertokens afgeleid van `stats.input_tokens - stats.cached`.

Overschrijf standaardwaarden alleen indien nodig (meestal een absoluut `command`-pad).

## Overlays voor teksttransformaties

Plugins die kleine compatibiliteitsshimmen voor prompts/berichten nodig hebben, kunnen bidirectionele teksttransformaties declareren zonder een provider of CLI-backend te vervangen:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` herschrijft de systeemprompt en gebruikersprompt die aan de CLI worden doorgegeven. `output` herschrijft gestreamde assistenttekst en geparseerde definitieve tekst voordat OpenClaw zijn eigen besturingsmarkeringen en kanaalaflevering verwerkt; bij modelaanroepen via een provider herstelt het ook tekenreekswaarden in gestructureerde toolaanroepargumenten na streamherstel en vóór tooluitvoering. Ruwe JSON-fragmenten van de provider blijven ongewijzigd; afnemers moeten de gestructureerde gedeeltelijke, eind- of resultaatpayload gebruiken.

Stel voor CLI's die providerspecifieke JSONL-gebeurtenissen uitvoeren `jsonlDialect` in binnen de configuratie van die backend: `claude-stream-json` voor Claude Code-compatibele streams, `gemini-stream-json` voor Gemini CLI-`stream-json`-gebeurtenissen.

## Eigenaarschap van native Compaction

Sommige CLI-backends voeren een agent uit die zijn eigen transcript compacteert, waardoor OpenClaw zijn beveiligende samenvatter niet voor deze backends mag uitvoeren — anders werkt deze de eigen Compaction van de backend tegen en kan de beurt onherstelbaar mislukken.

`claude-cli` heeft geen harness-eindpunt (Claude Code voert intern Compaction uit) en declareert daarom `ownsNativeCompaction: true`, waarna het Compaction-pad van OpenClaw de sessie-invoer ongewijzigd retourneert. OpenClaw geeft het effectieve contextbudget van de uitvoering door via de gedocumenteerde [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) van Claude Code, zodat native automatische Compaction afgestemd blijft op de geconfigureerde Anthropic-`contextTokens`-limieten. Sessies met een native harness, zoals Codex, blijven in plaats daarvan naar hun harness-eindpunt voor Compaction worden gerouteerd.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declareer `ownsNativeCompaction` alleen voor een backend die daadwerkelijk eigenaar is van Compaction: deze moet zijn eigen transcript betrouwbaar begrenzen rond het contextvenster en een hervatbare sessie behouden (bijvoorbeeld `--resume` / `--session-id`), anders kan een uitgestelde sessie het budget blijven overschrijden.

## MCP-overlays bundelen

CLI-backends ontvangen OpenClaw-toolaanroepen niet rechtstreeks, maar een backend kan met `bundleMcp: true` kiezen voor een gegenereerde MCP-configuratie-overlay. Huidig gebundeld gedrag:

- `claude-cli`: gegenereerd strikt MCP-configuratiebestand.
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand.

Wanneer gebundelde MCP is ingeschakeld, doet OpenClaw het volgende:

- start een loopback HTTP-MCP-server die Gateway-tools beschikbaar stelt aan het CLI-proces, geauthenticeerd met een contexttoekenning per uitvoering (`OPENCLAW_MCP_TOKEN`) die alleen actief is voor de huidige uitvoeringspoging;
- koppelt tooltoegang aan de door de Gateway geselecteerde sessie-, account- en kanaalcontext in plaats van headers van onderliggende processen te vertrouwen;
- laadt ingeschakelde gebundelde MCP-servers voor de huidige werkruimte en voegt deze samen met een eventuele bestaande MCP-configuratie-/instellingenvorm van de backend;
- herschrijft de startconfiguratie met de integratiemodus die wordt beheerd door de verantwoordelijke Plugin.

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte configuratie wanneer een backend kiest voor gebundelde MCP, zodat achtergronduitvoeringen geïsoleerd blijven.

Gebundelde MCP-runtimes met sessiebereik worden in de cache bewaard voor hergebruik binnen een sessie en vervolgens opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel `0` in om dit uit te schakelen). Eenmalige ingebedde uitvoeringen, zoals authenticatiecontroles, sluggeneratie en het ophalen van Active Memory, vragen om opschoning aan het einde van de uitvoering, zodat stdio-onderliggende processen en Streamable HTTP/SSE-streams niet langer blijven bestaan dan de uitvoering.

## Limiet voor opnieuw ingezaaide geschiedenis

Wanneer een nieuwe CLI-sessie wordt ingezaaid vanuit een eerder OpenClaw-transcript (bijvoorbeeld na een `session_expired`-hernieuwde poging), wordt het gerenderde `<conversation_history>`-blok begrensd om te voorkomen dat prompts voor opnieuw inzaaien buitensporig groot worden. De standaardwaarde is 12.288 tekens (ongeveer 3.000 tokens).

Claude CLI-backends schalen deze limiet in plaats daarvan met het bepaalde Claude-contextvenster: grotere contextvensters krijgen een groter fragment van de eerdere geschiedenis, tot een vast plafond; andere CLI-backends behouden de conservatieve standaardwaarde. Deze limiet is alleen van toepassing op het blok met eerdere geschiedenis in de prompt voor opnieuw inzaaien — uitvoerlimieten van live sessies worden afzonderlijk afgestemd onder `reliability.outputLimits` (zie [Sessies](#sessions)).

## Beperkingen

- Geen rechtstreekse OpenClaw-toolaanroepen: OpenClaw injecteert geen toolaanroepen in het CLI-backendprotocol. Backends zien Gateway-tools alleen wanneer ze kiezen voor `bundleMcp: true`.
- Streaming is backendspecifiek: sommige backends streamen JSONL, andere bufferen tot het proces wordt afgesloten.
- Gestructureerde uitvoer is afhankelijk van de eigen JSON-indeling van de CLI.

## Probleemoplossing

| Symptoom                  | Oplossing                                                                         |
| ------------------------ | --------------------------------------------------------------------------------- |
| CLI niet gevonden        | Stel `command` in op een volledig pad.                                   |
| Verkeerde modelnaam      | Gebruik `modelAliases` om `provider/model` toe te wijzen aan de model-id van de CLI. |
| Geen sessiecontinuïteit  | Zorg dat `sessionArg` is ingesteld en `sessionMode` niet `none` is. |
| Afbeeldingen genegeerd   | Stel `imageArg` in en controleer of de CLI bestandspaden ondersteunt.     |

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Lokale modellen](/nl/gateway/local-models)
