---
read_when:
    - U wilt een betrouwbare terugvaloptie wanneer API-providers uitvallen
    - Je voert lokale AI-CLI’s uit en wilt deze hergebruiken
    - U wilt de MCP-loopbackbridge voor toegang tot CLI-backendtools begrijpen
summary: 'CLI-backends: lokale AI-CLI-terugvaloptie met optionele MCP-toolbridge'
title: CLI-backends
x-i18n:
    generated_at: "2026-07-12T08:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan een lokale AI-CLI uitvoeren als tekstgebaseerde terugvaloptie wanneer API-providers niet beschikbaar zijn, snelheidsbeperkingen toepassen of zich onjuist gedragen. Deze optie is bewust behoudend:

- OpenClaw-tools worden niet rechtstreeks geïnjecteerd, maar een backend met `bundleMcp: true` kan Gateway-tools ontvangen via een local loopback-MCP-bridge.
- JSONL-streaming voor CLI's die dit ondersteunen.
- Sessies worden ondersteund, zodat vervolgbeurten coherent blijven.
- Afbeeldingen worden doorgegeven als de CLI afbeeldingspaden accepteert.

Gebruik dit als vangnet voor tekstreacties die "altijd werken", niet als primair pad. Gebruik in plaats daarvan [ACP-agents](/nl/tools/acp-agents) voor een volledige harness-runtime met ACP-sessiebediening, achtergrondtaken, koppeling aan threads/gesprekken en permanente externe codeersessies; CLI-backends zijn geen ACP.

<Tip>
  Bouwt u een nieuwe backend-Plugin? Zie [CLI-backend-Plugins](/nl/plugins/cli-backend-plugins). Deze pagina behandelt de configuratie en bediening van een reeds geregistreerde backend.
</Tip>

## Snel aan de slag

De meegeleverde Anthropic-Plugin registreert een standaardbackend `claude-cli`, zodat deze zonder verdere configuratie werkt zodra Claude Code is geïnstalleerd en u bent aangemeld:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` is de standaard-agent-id wanneer geen expliciete agentlijst is geconfigureerd; gebruik anders uw eigen agent-id.

Als de Gateway onder launchd/systemd met een minimale `PATH` wordt uitgevoerd, verwijs dan expliciet naar het binaire bestand:

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

Als u een meegeleverde CLI-backend als primaire berichtprovider op een Gateway-host gebruikt, laadt OpenClaw automatisch de bijbehorende meegeleverde Plugin wanneer uw configuratie naar die backend verwijst in een modelreferentie of onder `agents.defaults.cliBackends`.

## Als terugvaloptie gebruiken

Voeg de CLI-backend toe aan uw lijst met terugvalopties, zodat deze alleen wordt uitgevoerd wanneer primaire modellen mislukken:

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

Als u `agents.defaults.models` als toelatingslijst gebruikt, neem daar dan ook uw CLI-backendmodellen in op. Wanneer de primaire provider mislukt door authenticatieproblemen, snelheidslimieten of time-outs, probeert OpenClaw vervolgens de CLI-backend.

## Configuratie

Alle CLI-backends staan onder `agents.defaults.cliBackends`, met de provider-id als sleutel (bijvoorbeeld `claude-cli`, `my-cli`). De provider-id vormt de linkerzijde van de modelreferentie: `<provider>/<model>`.

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
          // Specifieke vlag voor promptbestand:
          // systemPromptFileArg: "--system-file",
          // Of in plaats daarvan een Codex-achtige vlag voor configuratieoverschrijving:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Schakel dit alleen in als deze backend ongeldig gemaakte sessies opnieuw mag
          // vullen vanuit begrensde onbewerkte OpenClaw-transcriptgeschiedenis vóór Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Werking

1. Selecteert een backend op basis van het providervoorvoegsel (`claude-cli/...`).
2. Stelt een systeemprompt samen met dezelfde OpenClaw-prompt en werkruimtecontext.
3. Voert de CLI uit met een sessie-id, indien ondersteund, zodat de geschiedenis consistent blijft. De meegeleverde backend `claude-cli` houdt per OpenClaw-sessie een Claude-stdio-proces actief en verzendt vervolgbeurten via stream-JSON naar stdin.
4. Verwerkt de uitvoer (JSON of platte tekst) en retourneert de definitieve tekst.
5. Slaat sessie-id's per backend permanent op, zodat vervolgbeurten dezelfde CLI-sessie hergebruiken.

### Specifieke kenmerken van Claude CLI

De meegeleverde backend `claude-cli` geeft de voorkeur aan de ingebouwde skill-resolver van Claude Code. Wanneer de huidige snapshot van Skills ten minste één geselecteerde skill met een gerealiseerd pad bevat, geeft OpenClaw een tijdelijke Claude Code-Plugin door via `--plugin-dir` en laat het de dubbele OpenClaw-catalogus van Skills weg uit de toegevoegde systeemprompt. Zonder een gerealiseerde Plugin-skill behoudt OpenClaw de promptcatalogus als terugvaloptie. Overschrijvingen van omgevingsvariabelen/API-sleutels voor skills blijven voor de uitvoering van toepassing op de omgeving van het onderliggende proces.

Claude CLI heeft een eigen niet-interactieve machtigingsmodus; OpenClaw koppelt deze aan het bestaande uitvoeringsbeleid in plaats van Claude-specifieke configuratie toe te voegen. Voor door OpenClaw beheerde actieve Claude-sessies is het effectieve uitvoeringsbeleid doorslaggevend: YOLO (`tools.exec.security: "full"` en `tools.exec.ask: "off"`) start Claude met `--permission-mode bypassPermissions`, terwijl een beperkend beleid Claude start met `--permission-mode default`. Instellingen per agent in `agents.list[].tools.exec` overschrijven de globale `tools.exec` voor die agent. Onbewerkte backendargumenten mogen nog steeds `--permission-mode` bevatten, maar actieve Claude-starts normaliseren die vlag zodat deze overeenkomt met het effectieve beleid.

De backend koppelt OpenClaw-niveaus voor `/think` ook aan de ingebouwde vlag `--effort` van Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, en `high`/`xhigh`/`max` worden rechtstreeks doorgegeven. `adaptive` verwijdert geconfigureerde `--effort`-vlaggen en levert geen vervanging, zodat Claude Code de effectieve inspanning bepaalt op basis van de eigen omgeving, instellingen en modelstandaarden. Voor andere CLI-backends moet de bijbehorende Plugin een gelijkwaardige argv-mapper declareren voordat `/think` invloed heeft op de gestarte CLI.

Voordat OpenClaw `claude-cli` kan gebruiken, moet Claude Code zelf op dezelfde host zijn aangemeld:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Voor Docker-installaties moet Claude Code in de permanente containerhome zijn geïnstalleerd en aangemeld, niet alleen op de host; zie [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).

Stel `agents.defaults.cliBackends.claude-cli.command` alleen in wanneer het binaire bestand `claude` nog niet in `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stelt u `sessionArg` in (bijvoorbeeld `--session-id`), of `sessionArgs` (tijdelijke aanduiding `{sessionId}`) wanneer de id in meerdere vlaggen moet worden opgenomen.
- Als de CLI een hervattingssubopdracht met andere vlaggen gebruikt, stelt u `resumeArgs` in (vervangt `args` bij het hervatten) en optioneel `resumeOutput` voor hervattingen zonder JSON.
- `sessionMode`:
  - `always`: altijd een sessie-id verzenden (een nieuwe UUID als er geen is opgeslagen).
  - `existing`: alleen een sessie-id verzenden als er eerder een is opgeslagen.
  - `none`: nooit een sessie-id verzenden.
- `claude-cli` gebruikt standaard `liveSession: "claude-stdio"`, `output: "jsonl"` en `input: "stdin"`, zodat vervolgbeurten het actieve Claude-proces hergebruiken zolang het actief is, ook bij aangepaste configuraties waarin transportvelden ontbreken. Als de Gateway opnieuw wordt gestart of het inactieve proces wordt beëindigd, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-id's worden vóór hervatting gecontroleerd aan de hand van een leesbaar projecttranscript; bij een ontbrekend transcript wordt de koppeling gewist (geregistreerd als `reason=transcript-missing`) in plaats van stilzwijgend een nieuwe sessie te starten met `--resume`.
- Actieve Claude-sessies behouden begrensde beveiligingen voor JSONL-uitvoer: standaard 8 MiB en 20.000 onbewerkte JSONL-regels per beurt. Verhoog deze per backend met `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` en `maxTurnLines`; OpenClaw begrenst deze instellingen op 64 MiB en 100.000 regels.
- Opgeslagen CLI-sessies vormen continuïteit die eigendom is van de provider. De impliciete dagelijkse sessiereset onderbreekt ze niet; `/reset` en expliciete beleidsregels voor `session.reset` doen dat nog steeds.
- Nieuwe CLI-sessies worden normaal gesproken alleen opnieuw gevuld vanuit de Compaction-samenvatting van OpenClaw plus het gedeelte na de Compaction. Om korte sessies te herstellen die vóór Compaction ongeldig zijn gemaakt, kan een backend zich hiervoor aanmelden met `reseedFromRawTranscriptWhenUncompacted: true`. Het opnieuw vullen vanuit het onbewerkte transcript blijft begrensd en beperkt tot veilige ongeldigverklaringen, zoals een ontbrekend CLI-transcript, een verweesd restant van toolgebruik, wijzigingen in berichtbeleid/systeemprompt/werkmap/MCP of een nieuwe poging na het verlopen van een sessie; wijzigingen in het authenticatieprofiel of de referentieperiode van inloggegevens vullen de onbewerkte transcriptgeschiedenis nooit opnieuw.

Serialisatie: `serialize: true` houdt uitvoeringen binnen dezelfde baan op volgorde (de meeste CLI's serialiseren binnen één providerbaan). OpenClaw hergebruikt een opgeslagen CLI-sessie ook niet meer wanneer de geselecteerde authenticatie-identiteit verandert, waaronder een gewijzigde authenticatieprofiel-id, statische API-sleutel, statisch token of OAuth-accountidentiteit wanneer de CLI deze beschikbaar stelt; alleen rotatie van OAuth-toegangs- of vernieuwingstokens onderbreekt de sessie niet. Als een CLI geen stabiele OAuth-account-id heeft, laat OpenClaw die CLI de eigen hervattingsmachtigingen afdwingen.

## Terugvalinleiding vanuit claude-cli-sessies

Wanneer een poging met `claude-cli` terugvalt op een kandidaat die geen CLI is in [`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), voorziet OpenClaw de volgende poging van een contextinleiding die is verzameld uit het lokale JSONL-transcript van Claude Code (onder `~/.claude/projects/`, per werkruimte geïndexeerd). Zonder deze uitgangscontext begint de terugvalprovider zonder context, omdat het eigen sessietranscript van OpenClaw leeg is voor uitvoeringen met `claude-cli`.

- De inleiding geeft de voorkeur aan de meest recente `/compact`-samenvatting of markering `compact_boundary` en voegt daarna de meest recente beurten na de grens toe tot aan een tekenbudget. Beurten vóór de grens worden verwijderd omdat de samenvatting deze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte aanwijzingen `(tool call: name)` en `(tool result: …)` om het promptbudget realistisch te houden; een te grote samenvatting wordt afgekapt en gelabeld met `(truncated)`.
- Terugval van `claude-cli` naar `claude-cli` bij dezelfde provider vertrouwt op Claude's eigen `--resume` en slaat de inleiding over.
- De uitgangscontext hergebruikt de bestaande validatie van het Claude-sessiebestandspad, zodat willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen

Als uw CLI afbeeldingspaden accepteert, stelt u `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die paden als CLI-argumenten doorgegeven; zo niet, dan voegt OpenClaw de bestandspaden toe aan de prompt (padinjectie), wat werkt voor CLI's die lokale bestanden automatisch laden vanuit platte paden.

## Invoer en uitvoer

- `output: "text"` (standaard) behandelt stdout als het definitieve antwoord.
- `output: "json"` probeert JSON te verwerken en tekst plus een sessie-id te extraheren.
- `output: "jsonl"` verwerkt een JSONL-stream en extraheert het definitieve agentbericht plus sessie-id's wanneer deze aanwezig zijn.
- Voor JSON-uitvoer van Gemini CLI leest OpenClaw de antwoordtekst uit `response` en het gebruik uit `stats` wanneer `usage` ontbreekt of leeg is. De meegeleverde standaardinstelling voor Gemini CLI gebruikt `stream-json`; oude overschrijvingen met `--output-format json` gebruiken nog steeds de JSON-parser.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als het laatste CLI-argument.
- `input: "stdin"` verzendt de prompt via stdin.
- Als de prompt zeer lang is en `maxPromptArgChars` is ingesteld, wordt in plaats daarvan stdin gebruikt.

## Standaardinstellingen die eigendom zijn van Plugins

Standaardinstellingen voor CLI-backends maken deel uit van het Plugin-oppervlak:

- Plugins registreren deze met `api.registerCliBackend(...)`.
- De backend-`id` wordt het providervoorvoegsel in modelreferenties.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de standaardinstelling van de Plugin.
- Backendspecifieke configuratieopschoning blijft eigendom van de Plugin via de optionele hook `normalizeConfig`.

Anthropic is eigenaar van `claude-cli` en Google is eigenaar van `google-gemini-cli`. OpenAI Codex-agentuitvoeringen gebruiken de Codex-app-serverharness via `openai/*`; OpenClaw registreert niet langer een meegeleverde backend `codex-cli`.

De meegeleverde Anthropic-Plugin registreert voor `claude-cli`:

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

De meegeleverde Google-plugin registreert zich voor `google-gemini-cli`:

| Sleutel                    | Waarde                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `command`                  | `gemini`                                                                               |
| `args`                     | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`               | hetzelfde, met `--resume {sessionId}`                                                   |
| `output` / `resumeOutput`  | `jsonl`                                                                                |
| `jsonlDialect`             | `gemini-stream-json`                                                                   |
| `imageArg`                 | `@`                                                                                    |
| `imagePathScope`           | `workspace`                                                                            |
| `modelArg`                 | `--model`                                                                              |
| `sessionMode`              | `existing`                                                                             |
| `sessionIdFields`          | `["session_id", "sessionId"]`                                                          |

Vereiste: de lokale Gemini CLI moet zijn geïnstalleerd en als `gemini` beschikbaar zijn op `PATH` (`brew install gemini-cli` of `npm install -g @google/gemini-cli`).

Opmerkingen over Gemini CLI-uitvoer:

- De standaardparser voor `stream-json` leest `message`-gebeurtenissen van de assistent, toolgebeurtenissen, het uiteindelijke `result`-gebruik en fatale Gemini-foutgebeurtenissen.
- Als je de Gemini-argumenten overschrijft met `--output-format json`, normaliseert OpenClaw die backend terug naar `output: "json"` en leest het de antwoordtekst uit het JSON-veld `response`.
- Het gebruik valt terug op `stats` wanneer `usage` ontbreekt of leeg is; `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`, en als `stats.input` ontbreekt, worden de invoertokens afgeleid van `stats.input_tokens - stats.cached`.

Overschrijf de standaardwaarden alleen indien nodig (meestal voor een absoluut `command`-pad).

## Overlays voor teksttransformaties

Plugins die kleine compatibiliteitsaanpassingen voor prompts of berichten nodig hebben, kunnen bidirectionele teksttransformaties declareren zonder een provider of CLI-backend te vervangen:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` herschrijft de systeemprompt en gebruikersprompt die aan de CLI worden doorgegeven. `output` herschrijft gestreamde assistenttekst en geparseerde uiteindelijke tekst voordat OpenClaw zijn eigen besturingsmarkeringen en kanaalbezorging verwerkt; bij providergebaseerde modelaanroepen herstelt het ook tekenreekswaarden in gestructureerde toolaanroepargumenten na herstel van de stream en vóór uitvoering van de tool. Ruwe JSON-fragmenten van de provider blijven ongewijzigd; afnemers moeten de gestructureerde gedeeltelijke, eind- of resultaatpayload gebruiken.

Voor CLI's die providerspecifieke JSONL-gebeurtenissen uitvoeren, stel je `jsonlDialect` in de configuratie van die backend in: `claude-stream-json` voor streams die compatibel zijn met Claude Code, en `gemini-stream-json` voor Gemini CLI-`stream-json`-gebeurtenissen.

## Eigenaarschap van native Compaction

Sommige CLI-backends voeren een agent uit die zijn eigen transcript compacteert. OpenClaw mag daarom zijn beveiligende samenvatter niet op deze backends uitvoeren — anders werkt die de eigen Compaction van de backend tegen en kan de beurt definitief mislukken.

`claude-cli` heeft geen harness-eindpunt (Claude Code compacteert intern), dus declareert deze `ownsNativeCompaction: true` en retourneert het Compaction-pad van OpenClaw de sessievermelding ongewijzigd. Sessies met een native harness, zoals Codex, blijven in plaats daarvan naar het Compaction-eindpunt van hun harness routeren.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declareer `ownsNativeCompaction` alleen voor een backend die daadwerkelijk eigenaar is van Compaction: deze moet zijn eigen transcript betrouwbaar begrenzen rond het contextvenster en een hervatbare sessie opslaan (bijvoorbeeld `--resume` / `--session-id`), anders kan een uitgestelde sessie het budget blijven overschrijden.

## Overlays voor gebundelde MCP

CLI-backends ontvangen OpenClaw-toolaanroepen niet rechtstreeks, maar een backend kan met `bundleMcp: true` kiezen voor een gegenereerde MCP-configuratie-overlay. Huidig meegeleverd gedrag:

- `claude-cli`: gegenereerd strikt MCP-configuratiebestand.
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand.

Wanneer gebundelde MCP is ingeschakeld, doet OpenClaw het volgende:

- start een local loopback HTTP-MCP-server die Gateway-tools beschikbaar stelt aan het CLI-proces, geverifieerd met een contexttoekenning per uitvoering (`OPENCLAW_MCP_TOKEN`) die alleen actief is voor de huidige uitvoeringspoging;
- koppelt tooltoegang aan de door de Gateway geselecteerde sessie-, account- en kanaalcontext in plaats van headers van het onderliggende proces te vertrouwen;
- laadt ingeschakelde gebundelde MCP-servers voor de huidige werkruimte en voegt deze samen met een eventueel bestaande MCP-configuratie- of instellingenstructuur van de backend;
- herschrijft de opstartconfiguratie met behulp van de integratiemodus die eigendom is van de backend en door de bijbehorende Plugin wordt geleverd.

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte configuratie wanneer een backend voor gebundelde MCP kiest, zodat uitvoeringen op de achtergrond geïsoleerd blijven.

Sessiespecifieke gebundelde MCP-runtimes worden in de cache opgeslagen voor hergebruik binnen een sessie en vervolgens opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel in op `0` om dit uit te schakelen). Eenmalige ingebedde uitvoeringen, zoals authenticatiecontroles, slug-generatie en het ophalen van Active Memory, vragen om opruiming aan het einde van de uitvoering, zodat stdio-subprocessen en Streamable HTTP/SSE-streams niet langer blijven bestaan dan de uitvoering.

## Limiet voor opnieuw ingevoerde geschiedenis

Wanneer een nieuwe CLI-sessie wordt gevuld vanuit een eerder OpenClaw-transcript (bijvoorbeeld na een nieuwe poging vanwege `session_expired`), wordt het gerenderde blok `<conversation_history>` begrensd om te voorkomen dat prompts voor opnieuw invoeren onbeheersbaar groot worden. De standaardlimiet is 12.288 tekens (ongeveer 3.000 tokens).

Claude CLI-backends schalen deze limiet in plaats daarvan mee met het vastgestelde Claude-contextvenster: grotere contextvensters krijgen een groter deel van de eerdere geschiedenis, tot een vast maximum; andere CLI-backends behouden de conservatieve standaardwaarde. Deze limiet geldt alleen voor het blok met eerdere geschiedenis in de prompt voor opnieuw invoeren — uitvoerlimieten voor live sessies worden afzonderlijk afgestemd onder `reliability.outputLimits` (zie [Sessies](#sessions)).

## Beperkingen

- Geen rechtstreekse OpenClaw-toolaanroepen: OpenClaw injecteert geen toolaanroepen in het CLI-backendprotocol. Backends zien Gateway-tools alleen wanneer ze voor `bundleMcp: true` kiezen.
- Streaming is backendspecifiek: sommige backends streamen JSONL, andere bufferen tot het proces wordt afgesloten.
- Gestructureerde uitvoer is afhankelijk van de eigen JSON-indeling van de CLI.

## Probleemoplossing

| Symptoom                    | Oplossing                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| CLI niet gevonden           | Stel `command` in op een volledig pad.                                            |
| Verkeerde modelnaam         | Gebruik `modelAliases` om `provider/model` toe te wijzen aan de model-id van de CLI. |
| Geen sessiecontinuïteit     | Zorg dat `sessionArg` is ingesteld en `sessionMode` niet `none` is.              |
| Afbeeldingen worden genegeerd | Stel `imageArg` in en controleer of de CLI bestandspaden ondersteunt.           |

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Lokale modellen](/nl/gateway/local-models)
