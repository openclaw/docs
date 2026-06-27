---
read_when:
    - U wilt een betrouwbare fallback wanneer API-providers falen
    - Je draait lokale AI-CLI's en wilt ze hergebruiken
    - Je wilt de MCP-loopbackbridge begrijpen voor tooltoegang tot de CLI-backend
summary: 'CLI-backends: lokale AI CLI-fallback met optionele MCP-toolbridge'
title: CLI-backends
x-i18n:
    generated_at: "2026-06-27T17:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan **lokale AI-CLI's** uitvoeren als **alleen-tekst terugval** wanneer API-providers uitvallen,
door rate limits worden beperkt of tijdelijk verkeerd werken. Dit is bewust conservatief:

- **OpenClaw-tools worden niet rechtstreeks geïnjecteerd**, maar backends met `bundleMcp: true`
  kunnen gateway-tools ontvangen via een local loopback MCP-bridge.
- **JSONL-streaming** voor CLI's die dit ondersteunen.
- **Sessies worden ondersteund** (zodat vervolgroundes coherent blijven).
- **Afbeeldingen kunnen worden doorgegeven** als de CLI afbeeldingspaden accepteert.

Dit is bedoeld als **vangnet** in plaats van een primair pad. Gebruik het wanneer je
"werkt altijd"-tekstantwoorden wilt zonder afhankelijk te zijn van externe API's.

Als je een volledige harness-runtime wilt met ACP-sessiebediening, achtergrondtaken,
thread-/gespreksbinding en persistente externe codeersessies, gebruik dan in plaats daarvan
[ACP Agents](/nl/tools/acp-agents). CLI-backends zijn geen ACP.

<Tip>
  Bouw je een nieuwe backend-Plugin? Gebruik
  [CLI-backend-Plugins](/nl/plugins/cli-backend-plugins). Deze pagina is voor gebruikers
  die een al geregistreerde backend configureren en beheren.
</Tip>

## Beginnersvriendelijke snelstart

Je kunt Claude Code CLI **zonder enige configuratie** gebruiken (de gebundelde Anthropic-Plugin
registreert een standaardbackend):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` is de standaard-agent-id wanneer er geen expliciete agentlijst is geconfigureerd. Als
je meerdere agents gebruikt, vervang dit dan door de agent-id die je wilt uitvoeren.

Als je Gateway onder launchd/systemd draait en PATH minimaal is, voeg dan alleen het
commandopad toe:

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

Dat is alles. Geen sleutels, geen extra auth-configuratie nodig buiten de CLI zelf.

Als je een gebundelde CLI-backend gebruikt als de **primaire berichtprovider** op een
Gateway-host, laadt OpenClaw nu automatisch de eigenaar-bundel-Plugin wanneer je configuratie
expliciet naar die backend verwijst in een modelref of onder
`agents.defaults.cliBackends`.

## Gebruiken als terugval

Voeg een CLI-backend toe aan je terugvallijst, zodat deze alleen draait wanneer primaire modellen falen:

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

Opmerkingen:

- Als je `agents.defaults.models` gebruikt (allowlist), moet je je CLI-backendmodellen daar ook opnemen.
- Als de primaire provider faalt (auth, rate limits, time-outs), probeert OpenClaw
  daarna de CLI-backend.

## Configuratieoverzicht

Alle CLI-backends staan onder:

```
agents.defaults.cliBackends
```

Elke vermelding wordt gesleuteld op een **provider-id** (bijv. `claude-cli`, `my-cli`).
De provider-id wordt de linkerkant van je modelref:

```
<provider>/<model>
```

### Voorbeeldconfiguratie

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Hoe het werkt

1. **Selecteert een backend** op basis van het providerprefix (`claude-cli/...`).
2. **Bouwt een systeemprompt** met dezelfde OpenClaw-prompt + werkruimtecontext.
3. **Voert de CLI uit** met een sessie-id (indien ondersteund), zodat de geschiedenis consistent blijft.
   De gebundelde `claude-cli`-backend houdt per OpenClaw-sessie een Claude-stdio-proces actief
   en stuurt vervolgroundes via stream-json stdin.
4. **Parseert uitvoer** (JSON of platte tekst) en retourneert de uiteindelijke tekst.
5. **Bewaart sessie-id's persistent** per backend, zodat vervolgroundes dezelfde CLI-sessie hergebruiken.

<Note>
De gebundelde Anthropic `claude-cli`-backend wordt weer ondersteund. Anthropic-medewerkers
hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt
`claude -p`-gebruik als goedgekeurd voor deze integratie tenzij Anthropic
nieuw beleid publiceert.
</Note>

De gebundelde Anthropic `claude-cli`-backend geeft de voorkeur aan Claude Code's native skillresolver
voor OpenClaw-Skills. Wanneer de huidige Skills-snapshot ten minste
één geselecteerde skill met een gematerialiseerd pad bevat, geeft OpenClaw een tijdelijke Claude
Code-Plugin door met `--plugin-dir` en laat het de dubbele OpenClaw-Skills-catalogus
uit de toegevoegde systeemprompt weg. Als de snapshot geen gematerialiseerde Plugin-
skill heeft, behoudt OpenClaw de promptcatalogus als terugval. Skill-env/API-sleutel-
overrides worden nog steeds door OpenClaw toegepast op de child process-omgeving voor de
run.

Claude CLI heeft ook een eigen niet-interactieve permissiemodus. OpenClaw koppelt die
aan het bestaande exec-beleid in plaats van Claude-specifieke beleidsconfiguratie toe te voegen.
Voor door OpenClaw beheerde Claude-live sessies is het effectieve OpenClaw-exec-beleid
gezaghebbend: YOLO (`tools.exec.security: "full"` en
`tools.exec.ask: "off"`) start Claude met
`--permission-mode bypassPermissions`, terwijl restrictief effectief exec-beleid
Claude start met `--permission-mode default`. Per-agent
`agents.list[].tools.exec`-instellingen overschrijven globale `tools.exec` voor die
agent. Ruwe Claude-backendargs kunnen nog steeds `--permission-mode` bevatten, maar live
Claude-starts normaliseren die vlag zodat deze overeenkomt met het effectieve OpenClaw-exec-beleid.

De gebundelde Anthropic `claude-cli`-backend koppelt ook OpenClaw `/think`-niveaus
aan Claude Code's native `--effort`-vlag voor niet-uit-niveaus. `minimal` en
`low` mappen naar `low`, `adaptive` en `medium` mappen naar `medium`, en `high`,
`xhigh` en `max` mappen rechtstreeks. Andere CLI-backends hebben hun eigenaar-Plugin nodig om
een equivalente argv-mapper te declareren voordat `/think` invloed kan hebben op de gespawnde CLI.

Voordat OpenClaw de gebundelde `claude-cli`-backend kan gebruiken, moet Claude Code zelf
al ingelogd zijn op dezelfde host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker-installaties hebben Claude Code geïnstalleerd en ingelogd nodig binnen de persistente
container-home, niet alleen op de host. Zie
[Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).

Gebruik `agents.defaults.cliBackends.claude-cli.command` alleen wanneer de `claude`-
binary nog niet op `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stel dan `sessionArg` (bijv. `--session-id`) of
  `sessionArgs` (placeholder `{sessionId}`) in wanneer de ID in
  meerdere vlaggen moet worden ingevoegd.
- Als de CLI een **resume-subcommand** gebruikt met andere vlaggen, stel dan
  `resumeArgs` in (vervangt `args` bij hervatten) en optioneel `resumeOutput`
  (voor niet-JSON-resumes).
- `sessionMode`:
  - `always`: stuur altijd een sessie-id (nieuwe UUID als er geen is opgeslagen).
  - `existing`: stuur alleen een sessie-id als er eerder een is opgeslagen.
  - `none`: stuur nooit een sessie-id.
- `claude-cli` gebruikt standaard `liveSession: "claude-stdio"`, `output: "jsonl"`,
  en `input: "stdin"`, zodat vervolgroundes het live Claude-proces hergebruiken terwijl
  het actief is. Warme stdio is nu de standaard, ook voor aangepaste configuraties
  die transportvelden weglaten. Als de Gateway opnieuw start of het idle proces
  stopt, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-
  id's worden geverifieerd tegen een bestaande leesbare projecttranscriptie voordat
  wordt hervat, zodat spookbindingen worden gewist met `reason=transcript-missing`
  in plaats van stilzwijgend een nieuwe Claude CLI-sessie te starten onder `--resume`.
- Claude-live sessies behouden begrensde JSONL-uitvoerbeschermingen. Standaarden staan tot
  8 MiB en 20.000 ruwe JSONL-regels per ronde toe. Tool-zware Claude-rondes kunnen
  ze per backend verhogen met
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  en `maxTurnLines`; OpenClaw begrenst die instellingen tot 64 MiB en 100.000
  regels.
- Opgeslagen CLI-sessies zijn provider-eigen continuïteit. De impliciete dagelijkse sessie-
  reset verbreekt ze niet; `/reset` en expliciete `session.reset`-beleidsregels doen dat nog steeds
  wel.
- Verse CLI-sessies worden normaal alleen opnieuw gevuld vanuit OpenClaw's Compaction-samenvatting
  plus de post-Compaction-staart. Om korte sessies te herstellen die ongeldig worden gemaakt
  vóór Compaction, kan een backend zich aanmelden met
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw houdt raw
  transcript-reseed nog steeds begrensd en beperkt dit tot veilige ongeldigverklaringen zoals ontbrekende
  CLI-transcripties, systeemprompt-/MCP-wijzigingen of session-expired retry; auth-
  profiel- of credential-epoch-wijzigingen reseeden nooit raw transcriptgeschiedenis.

Serialisatie-opmerkingen:

- `serialize: true` houdt runs in dezelfde lane op volgorde.
- De meeste CLI's serialiseren op één provider-lane.
- OpenClaw laat opgeslagen CLI-sessiehergebruik vallen wanneer de geselecteerde auth-identiteit verandert,
  inclusief een gewijzigde auth-profiel-id, statische API-sleutel, statische token of OAuth-
  accountidentiteit wanneer de CLI er een blootstelt. Rotatie van OAuth access- en refresh-tokens
  verbreekt de opgeslagen CLI-sessie niet. Als een CLI geen stabiele OAuth-account-id blootstelt,
  laat OpenClaw die CLI resume-permissies afdwingen.

## Terugvalprelude vanuit claude-cli-sessies

Wanneer een `claude-cli`-poging terugvalt naar een niet-CLI-kandidaat in
[`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), vult OpenClaw
de volgende poging met een contextprelude die is geoogst uit Claude Code's lokale
JSONL-transcriptie op `~/.claude/projects/`. Zonder deze seed zou de terugval-
provider koud starten omdat OpenClaw's eigen sessietranscriptie leeg is
voor `claude-cli`-runs.

- De prelude geeft de voorkeur aan de nieuwste `/compact`-samenvatting of `compact_boundary`-
  marker en voegt daarna de meest recente post-boundary-rondes toe tot een teken-
  budget. Pre-boundary-rondes worden verwijderd omdat de samenvatting ze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte `(tool call: name)`- en
  `(tool result: …)`-hints om het promptbudget eerlijk te houden. De samenvatting wordt
  gelabeld als `(truncated)` als deze overloopt.
- Terugvallen van dezelfde provider `claude-cli` naar `claude-cli` vertrouwen op Claude's eigen
  `--resume` en slaan de prelude over.
- De seed hergebruikt de bestaande Claude-sessiebestandpadvalidatie, zodat
  willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen (doorvoer)

Als je CLI afbeeldingspaden accepteert, stel dan `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die
paden als CLI-args doorgegeven. Als `imageArg` ontbreekt, voegt OpenClaw de
bestandspaden toe aan de prompt (padinjectie), wat genoeg is voor CLI's die automatisch
lokale bestanden laden vanuit platte paden.

## Invoer / uitvoer

- `output: "json"` (standaard) probeert JSON te parsen en tekst + sessie-id te extraheren.
- Voor Gemini CLI JSON-uitvoer leest OpenClaw antwoordtekst uit `response` en gebruik
  uit `stats` wanneer `usage` ontbreekt of leeg is. De gebundelde Gemini CLI-standaard
  gebruikt `stream-json`, maar oude `--output-format json`-overrides gebruiken nog steeds de
  JSON-parser.
- `output: "jsonl"` parseert JSONL-streams en extraheert het uiteindelijke agentbericht plus sessie-
  identifiers wanneer aanwezig.
- `output: "text"` behandelt stdout als het uiteindelijke antwoord.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als het laatste CLI-argument.
- `input: "stdin"` verzendt de prompt via stdin.
- Als de prompt erg lang is en `maxPromptArgChars` is ingesteld, wordt stdin gebruikt.

## Standaardwaarden (eigendom van plugin)

Standaardwaarden voor gebundelde CLI-backends staan bij hun eigenaar-plugin. Anthropic
is bijvoorbeeld eigenaar van `claude-cli` en Google is eigenaar van
`google-gemini-cli`. OpenAI Codex-agentruns gebruiken de Codex app-server-harness
via `openai/*`; OpenClaw registreert niet langer een gebundelde
`codex-cli`-backend.

De gebundelde Anthropic-plugin registreert een standaardwaarde voor `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

De gebundelde Google-plugin registreert ook een standaardwaarde voor `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Vereiste: de lokale Gemini CLI moet geinstalleerd zijn en beschikbaar zijn als
`gemini` op `PATH` (`brew install gemini-cli` of
`npm install -g @google/gemini-cli`).

Opmerkingen bij Gemini CLI-uitvoer:

- De standaard `stream-json`-parser leest assistant-`message`-gebeurtenissen, toolgebeurtenissen,
  het uiteindelijke `result`-gebruik en fatale Gemini-foutgebeurtenissen.
- Als je Gemini-argumenten overschrijft naar `--output-format json`, normaliseert OpenClaw die
  backend terug naar `output: "json"` en leest het antwoordtekst uit het JSON-veld
  `response`.
- Gebruik valt terug op `stats` wanneer `usage` ontbreekt of leeg is.
- `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
- Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
  `stats.input_tokens - stats.cached`.

Overschrijf alleen indien nodig (gebruikelijk: absoluut `command`-pad).

## Standaardwaarden in eigendom van plugins

Standaardwaarden voor CLI-backends maken nu deel uit van het plugin-oppervlak:

- Plugins registreren ze met `api.registerCliBackend(...)`.
- De backend-`id` wordt de provider-prefix in modelverwijzingen.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de standaardwaarde van de plugin.
- Backend-specifieke configuratieopschoning blijft eigendom van de plugin via de optionele
  `normalizeConfig`-hook.

Plugins die kleine prompt-/berichtcompatibiliteitsshims nodig hebben, kunnen
bidirectionele teksttransformaties declareren zonder een provider of CLI-backend te vervangen:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` herschrijft de systeemprompt en gebruikersprompt die aan de CLI worden doorgegeven. `output`
herschrijft gestreamde assistant-delta's en geparste uiteindelijke tekst voordat OpenClaw
zijn eigen controlemarkers en kanaalaflevering afhandelt.

Voor CLI's die provider-specifieke JSONL-gebeurtenissen uitsturen, stel je `jsonlDialect` in op de
configuratie van die backend. Ondersteunde dialecten zijn `claude-stream-json` voor met Claude
Code compatibele streams en `gemini-stream-json` voor Gemini CLI-`stream-json`-
gebeurtenissen.

## Eigenaarschap van native Compaction

Sommige CLI-backends draaien een agent die zijn **eigen** transcript comprimeert, dus OpenClaw mag
zijn beveiligende samenvatter daar niet op uitvoeren - dat werkt de eigen Compaction van de backend tegen
en kan de beurt hard laten mislukken.

`claude-cli` heeft geen harness-eindpunt - Claude Code comprimeert intern - dus declareert het
`ownsNativeCompaction: true`, en OpenClaw retourneert een no-op vanuit het Compaction-pad.
Native-harnesssessies zoals Codex blijven in plaats daarvan naar hun harness-Compaction-eindpunt
routeren.

Omdat de backend eigenaar is van Compaction, is de oude noodoplossing om
`contextTokens: 1_000_000` in te stellen alleen om te voorkomen dat OpenClaw's beveiliging afgaat op een
claude-cli-sessie **niet langer nodig** - de opt-out vervangt die.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declareer `ownsNativeCompaction` alleen voor een backend die echt eigenaar is van zijn Compaction: hij
moet betrouwbaar zijn eigen transcript begrenzen wanneer hij zijn contextvenster nadert en een
hervatbare sessie bewaren (bijv. `--resume` / `--session-id`); anders kan een uitgestelde sessie
boven het budget blijven. Overeenkomende `agentHarnessId`-sessies blijven naar het harness-eindpunt routeren.

## Bundle-MCP-overlays

CLI-backends ontvangen OpenClaw-toolaanroepen **niet** rechtstreeks, maar een backend kan
zich aanmelden voor een gegenereerde MCP-configuratie-overlay met `bundleMcp: true`.

Huidig gebundeld gedrag:

- `claude-cli`: gegenereerd strikt MCP-configuratiebestand
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand

Wanneer bundle MCP is ingeschakeld, doet OpenClaw het volgende:

- start een loopback-HTTP-MCP-server die gateway-tools aan het CLI-proces beschikbaar stelt
- authenticeert de bridge met een token per sessie (`OPENCLAW_MCP_TOKEN`)
- beperkt tooltoegang tot de huidige sessie-, account- en kanaalcontext
- laadt ingeschakelde bundle-MCP-servers voor de huidige workspace
- voegt ze samen met een bestaande backend-MCP-configuratie-/instellingenvorm
- herschrijft de startconfiguratie met de integratiemodus van de eigenaar-backend uit de eigenaarsextensie

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte configuratie wanneer een
backend zich aanmeldt voor bundle MCP, zodat achtergrondruns geisoleerd blijven.

Sessiegebonden gebundelde MCP-runtimes worden gecachet voor hergebruik binnen een sessie en vervolgens
opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10
minuten; stel `0` in om uit te schakelen). Eenmalige embedded runs zoals auth-probes,
sluggeneratie en active-memory recall vragen opschoning aan het einde van de run aan, zodat stdio-
children en Streamable HTTP/SSE-streams niet langer leven dan de run.

## Limiet voor reseed-geschiedenis

Wanneer een nieuwe CLI-sessie wordt gevuld vanuit een eerder OpenClaw-transcript (bij
voorbeeld na een `session_expired`-retry), wordt het gerenderde
`<conversation_history>`-blok begrensd om te voorkomen dat reseed-prompts
exploderen. De standaardwaarde is `12288` tekens (ongeveer 3000 tokens).

Claude CLI-backends gebruiken automatisch een grotere limiet die is afgeleid van de opgeloste
Claude-contexttier. Standaard Claude-runs met 200K tokens behouden een grotere transcriptsnede,
en Claude-runs met 1M tokens behouden opnieuw een grotere snede, terwijl andere CLI-
backends de conservatieve standaard behouden.

- De limiet geldt alleen voor het prior-history-blok van de reseed-prompt. Limieten voor uitvoer
  van live-sessies worden apart afgestemd onder `reliability.outputLimits`
  (zie [Sessies](#sessions)).

## Beperkingen

- **Geen rechtstreekse OpenClaw-toolaanroepen.** OpenClaw injecteert geen toolaanroepen in
  het CLI-backendprotocol. Backends zien Gateway-tools alleen wanneer ze zich aanmelden voor
  `bundleMcp: true`.
- **Streaming is backend-specifiek.** Sommige backends streamen JSONL; andere bufferen
  tot afsluiten.
- **Gestructureerde uitvoer** hangt af van de JSON-indeling van de CLI.

## Probleemoplossing

- **CLI niet gevonden**: stel `command` in op een volledig pad.
- **Verkeerde modelnaam**: gebruik `modelAliases` om `provider/model` → CLI-model te mappen.
- **Geen sessiecontinuiteit**: zorg dat `sessionArg` is ingesteld en `sessionMode` niet
  `none` is.
- **Afbeeldingen genegeerd**: stel `imageArg` in (en verifieer dat de CLI bestandspaden ondersteunt).

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Lokale modellen](/nl/gateway/local-models)
