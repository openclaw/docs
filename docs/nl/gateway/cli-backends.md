---
read_when:
    - Je wilt een betrouwbare fallback wanneer API-aanbieders falen
    - Je draait lokale AI-CLI's en wilt ze opnieuw gebruiken
    - Je wilt de MCP-loopbackbridge voor toegang tot backendtools via de CLI begrijpen
summary: 'CLI-backends: lokale AI CLI-terugval met optionele MCP-toolbridge'
title: CLI-backends
x-i18n:
    generated_at: "2026-07-01T08:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan **lokale AI-CLI's** uitvoeren als **fallback uitsluitend voor tekst** wanneer API-providers offline zijn,
rate-limited zijn of zich tijdelijk verkeerd gedragen. Dit is bewust conservatief:

- **OpenClaw-tools worden niet rechtstreeks geïnjecteerd**, maar backends met `bundleMcp: true`
  kunnen Gateway-tools ontvangen via een loopback-MCP-brug.
- **JSONL-streaming** voor CLI's die dit ondersteunen.
- **Sessies worden ondersteund** (zodat vervolgroundes coherent blijven).
- **Afbeeldingen kunnen worden doorgegeven** als de CLI afbeeldingspaden accepteert.

Dit is ontworpen als een **veiligheidsnet** en niet als primair pad. Gebruik dit wanneer je
tekstreacties wilt die "altijd werken" zonder afhankelijk te zijn van externe API's.

Als je een volledige harness-runtime wilt met ACP-sessiebesturing, achtergrondtaken,
thread-/conversatiekoppeling en blijvende externe codeersessies, gebruik dan
[ACP-agenten](/nl/tools/acp-agents). CLI-backends zijn geen ACP.

<Tip>
  Bouw je een nieuwe backendplugin? Gebruik
  [CLI-backendplugins](/nl/plugins/cli-backend-plugins). Deze pagina is voor gebruikers
  die een al geregistreerde backend configureren en beheren.
</Tip>

## Beginnersvriendelijke snelstart

Je kunt Claude Code CLI **zonder configuratie** gebruiken (de gebundelde Anthropic-plugin
registreert een standaardbackend):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` is de standaard-agent-id wanneer er geen expliciete agentlijst is geconfigureerd. Als
je meerdere agenten gebruikt, vervang dit dan door de agent-id die je wilt uitvoeren.

Als je Gateway onder launchd/systemd draait en PATH minimaal is, voeg dan alleen het
opdrachtpad toe:

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

Als je een gebundelde CLI-backend gebruikt als de **primaire berichtenprovider** op een
Gateway-host, laadt OpenClaw nu automatisch de bijbehorende gebundelde plugin wanneer je configuratie
expliciet naar die backend verwijst in een modelref of onder
`agents.defaults.cliBackends`.

## Gebruiken als fallback

Voeg een CLI-backend toe aan je fallbacklijst, zodat deze alleen draait wanneer primaire modellen falen:

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

- Als je `agents.defaults.models` (allowlist) gebruikt, moet je daar ook je CLI-backendmodellen opnemen.
- Als de primaire provider faalt (auth, rate limits, time-outs), probeert OpenClaw
  daarna de CLI-backend.

## Configuratieoverzicht

Alle CLI-backends staan onder:

```
agents.defaults.cliBackends
```

Elke vermelding gebruikt een **provider-id** als sleutel (bijv. `claude-cli`, `my-cli`).
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

1. **Selecteert een backend** op basis van de providerprefix (`claude-cli/...`).
2. **Bouwt een systeemprompt** met dezelfde OpenClaw-prompt en workspace-context.
3. **Voert de CLI uit** met een sessie-id (indien ondersteund), zodat de geschiedenis consistent blijft.
   De gebundelde `claude-cli`-backend houdt per OpenClaw-sessie een Claude-stdio-proces actief
   en stuurt vervolgroundes via stream-json-stdin.
4. **Parset uitvoer** (JSON of platte tekst) en retourneert de uiteindelijke tekst.
5. **Bewaart sessie-id's** per backend, zodat vervolgrondes dezelfde CLI-sessie hergebruiken.

<Note>
De gebundelde Anthropic-`claude-cli`-backend wordt opnieuw ondersteund. Anthropic-medewerkers
hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl opnieuw is toegestaan, dus OpenClaw behandelt
`claude -p`-gebruik als goedgekeurd voor deze integratie tenzij Anthropic
een nieuw beleid publiceert.
</Note>

De gebundelde Anthropic-`claude-cli`-backend geeft de voorkeur aan Claude Code's native resolver
voor OpenClaw-Skills. Wanneer de huidige snapshot van Skills ten minste
één geselecteerde Skill met een gematerialiseerd pad bevat, geeft OpenClaw een tijdelijke Claude
Code-plugin door met `--plugin-dir` en laat het de dubbele OpenClaw-catalogus met Skills
weg uit de toegevoegde systeemprompt. Als de snapshot geen gematerialiseerde plugin-Skill
heeft, behoudt OpenClaw de promptcatalogus als fallback. Env-/API-sleuteloverrides voor Skills
worden nog steeds door OpenClaw toegepast op de childprocesomgeving voor de
run.

Claude CLI heeft ook een eigen niet-interactieve permissiemodus. OpenClaw koppelt die
aan het bestaande exec-beleid in plaats van Claude-specifieke beleidsconfiguratie toe te voegen.
Voor door OpenClaw beheerde live Claude-sessies is het effectieve OpenClaw-execbeleid
leidend: YOLO (`tools.exec.security: "full"` en
`tools.exec.ask: "off"`) start Claude met
`--permission-mode bypassPermissions`, terwijl beperkend effectief execbeleid
Claude start met `--permission-mode default`. Per-agent
`agents.list[].tools.exec`-instellingen overschrijven globale `tools.exec` voor die
agent. Ruwe Claude-backendargumenten kunnen nog steeds `--permission-mode` bevatten, maar live
Claude-starts normaliseren die vlag zodat deze overeenkomt met het effectieve OpenClaw-execbeleid.

De gebundelde Anthropic-`claude-cli`-backend koppelt OpenClaw-`/think`-niveaus ook
aan Claude Code's native `--effort`-vlag voor niveaus die niet uit staan. `minimal` en
`low` worden gekoppeld aan `low`, `adaptive` en `medium` aan `medium`, en `high`,
`xhigh` en `max` worden rechtstreeks gekoppeld. Andere CLI-backends hebben hun eigen plugin nodig om
een equivalente argv-mapper te declareren voordat `/think` invloed kan hebben op de gestarte CLI.

Voordat OpenClaw de gebundelde `claude-cli`-backend kan gebruiken, moet Claude Code zelf
al op dezelfde host zijn ingelogd:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker-installaties hebben Claude Code nodig dat geïnstalleerd en ingelogd is binnen de blijvende
container-home, niet alleen op de host. Zie
[Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).

Gebruik `agents.defaults.cliBackends.claude-cli.command` alleen wanneer de `claude`-
binary nog niet op `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stel dan `sessionArg` (bijv. `--session-id`) of
  `sessionArgs` (placeholder `{sessionId}`) in wanneer de ID in meerdere vlaggen moet worden ingevoegd.
- Als de CLI een **resume-subopdracht** met andere vlaggen gebruikt, stel dan
  `resumeArgs` in (vervangt `args` bij hervatten) en optioneel `resumeOutput`
  (voor niet-JSON-hervattingen).
- `sessionMode`:
  - `always`: stuur altijd een sessie-id (nieuwe UUID als er geen is opgeslagen).
  - `existing`: stuur alleen een sessie-id als er eerder een is opgeslagen.
  - `none`: stuur nooit een sessie-id.
- `claude-cli` gebruikt standaard `liveSession: "claude-stdio"`, `output: "jsonl"`,
  en `input: "stdin"`, zodat vervolgrondes het live Claude-proces hergebruiken zolang
  het actief is. Warme stdio is nu de standaard, ook voor aangepaste configuraties
  die transportvelden weglaten. Als de Gateway opnieuw start of het idle proces
  afsluit, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-
  id's worden gecontroleerd tegen een bestaand leesbaar projecttranscript voordat
  wordt hervat, zodat fantoomkoppelingen worden gewist met `reason=transcript-missing`
  in plaats van stilzwijgend een nieuwe Claude CLI-sessie te starten onder `--resume`.
- Live Claude-sessies behouden begrensde JSONL-uitvoerbewaking. Standaarden staan tot
  8 MiB en 20.000 ruwe JSONL-regels per ronde toe. Tool-intensieve Claude-rondes kunnen
  deze per backend verhogen met
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  en `maxTurnLines`; OpenClaw begrenst die instellingen op 64 MiB en 100.000
  regels.
- Opgeslagen CLI-sessies zijn provider-eigendom voor continuïteit. De impliciete dagelijkse sessie-
  reset onderbreekt ze niet; `/reset` en expliciete `session.reset`-beleidsregels doen dat nog steeds
  wel.
- Nieuwe CLI-sessies worden normaal alleen opnieuw gevoed vanuit OpenClaw's Compaction-samenvatting
  plus de staart na Compaction. Om korte sessies te herstellen die ongeldig worden
  vóór Compaction, kan een backend zich aanmelden met
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw houdt het opnieuw voeden uit ruwe
  transcripties nog steeds begrensd en beperkt het tot veilige ongeldigverklaringen, zoals ontbrekende
  CLI-transcripties, wijzigingen in systeemprompt/MCP of een retry na verlopen sessie; wijzigingen in
  authprofiel of credential-epoch voeden nooit ruwe transcriptgeschiedenis opnieuw.

Serialisatie-opmerkingen:

- `serialize: true` houdt runs in dezelfde lane op volgorde.
- De meeste CLI's serialiseren op één providerlane.
- OpenClaw laat hergebruik van opgeslagen CLI-sessies vallen wanneer de geselecteerde auth-identiteit verandert,
  inclusief een gewijzigde authprofiel-id, statische API-sleutel, statisch token of OAuth-
  accountidentiteit wanneer de CLI er een blootlegt. Rotatie van OAuth-toegangs- en refresh-tokens
  onderbreekt de opgeslagen CLI-sessie niet. Als een CLI geen
  stabiele OAuth-account-id blootlegt, laat OpenClaw die CLI de hervatpermissies afdwingen.

## Fallback-prelude uit claude-cli-sessies

Wanneer een `claude-cli`-poging overschakelt naar een niet-CLI-kandidaat in
[`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), voedt OpenClaw
de volgende poging met een contextprelude die wordt geoogst uit Claude Code's lokale
JSONL-transcript op `~/.claude/projects/`. Zonder deze seed zou de fallback-
provider koud starten omdat OpenClaw's eigen sessietranscript leeg is
voor `claude-cli`-runs.

- De prelude geeft de voorkeur aan de nieuwste `/compact`-samenvatting of `compact_boundary`-
  marker en voegt daarna de meest recente rondes na de grens toe tot aan een teken-
  budget. Rondes van vóór de grens worden weggelaten omdat de samenvatting ze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte `(tool call: name)`- en
  `(tool result: …)`-hints om het promptbudget eerlijk te houden. De samenvatting wordt
  gelabeld als `(truncated)` als deze overloopt.
- Fallbacks van dezelfde provider van `claude-cli` naar `claude-cli` vertrouwen op Claude's eigen
  `--resume` en slaan de prelude over.
- De seed hergebruikt de bestaande validatie van het Claude-sessiebestandspad, zodat
  willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen (doorgeven)

Als je CLI afbeeldingspaden accepteert, stel dan `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die
paden als CLI-argumenten doorgegeven. Als `imageArg` ontbreekt, voegt OpenClaw de
bestandspaden toe aan de prompt (padinjectie), wat voldoende is voor CLI's die lokale bestanden automatisch
laden vanuit platte paden.

## Invoer / uitvoer

- `output: "json"` (standaard) probeert JSON te parsen en tekst plus sessie-id te extraheren.
- Voor Gemini CLI-JSON-uitvoer leest OpenClaw antwoordtekst uit `response` en gebruik
  uit `stats` wanneer `usage` ontbreekt of leeg is. De gebundelde Gemini CLI-standaard
  gebruikt `stream-json`, maar oude `--output-format json`-overrides gebruiken nog steeds de
  JSON-parser.
- `output: "jsonl"` parset JSONL-streams en extraheert het uiteindelijke agentbericht plus sessie-
  identifiers wanneer aanwezig.
- `output: "text"` behandelt stdout als het uiteindelijke antwoord.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als het laatste CLI-argument.
- `input: "stdin"` verzendt de prompt via stdin.
- Als de prompt erg lang is en `maxPromptArgChars` is ingesteld, wordt stdin gebruikt.

## Standaardwaarden (eigendom van de plugin)

Gebundelde standaardwaarden voor CLI-backends staan bij hun beherende Plugin. Anthropic beheert bijvoorbeeld `claude-cli` en Google beheert `google-gemini-cli`. OpenAI Codex-agentruns gebruiken de Codex app-server-harness via `openai/*`; OpenClaw registreert niet langer een gebundelde `codex-cli`-backend.

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

Vereiste: de lokale Gemini CLI moet geinstalleerd zijn en beschikbaar zijn als `gemini` op `PATH` (`brew install gemini-cli` of `npm install -g @google/gemini-cli`).

Opmerkingen over Gemini CLI-uitvoer:

- De standaard `stream-json`-parser leest assistant-`message`-events, tool-events, definitieve `result`-usage en fatale Gemini-foutevents.
- Als je Gemini-argumenten overschrijft naar `--output-format json`, normaliseert OpenClaw die backend terug naar `output: "json"` en leest antwoordtekst uit het JSON-veld `response`.
- Usage valt terug op `stats` wanneer `usage` ontbreekt of leeg is.
- `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
- Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit `stats.input_tokens - stats.cached`.

Overschrijf alleen indien nodig (gebruikelijk: absoluut `command`-pad).

## Standaardwaarden in eigendom van Plugins

Standaardwaarden voor CLI-backends maken nu deel uit van het Plugin-oppervlak:

- Plugins registreren ze met `api.registerCliBackend(...)`.
- De backend-`id` wordt het providerprefix in modelreferenties.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de Plugin-standaardwaarde.
- Backendspecifieke configuratieopschoning blijft eigendom van de Plugin via de optionele `normalizeConfig`-hook.

Plugins die kleine prompt-/berichtcompatibiliteitsshims nodig hebben, kunnen bidirectionele teksttransformaties declareren zonder een provider of CLI-backend te vervangen:

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

`input` herschrijft de systeemprompt en gebruikersprompt die aan de CLI worden doorgegeven. `output` herschrijft gestreamde assistant-tekst en geparste definitieve tekst voordat OpenClaw zijn eigen controlemakers en kanaalbezorging verwerkt. Voor provider-backed modelaanroepen herstelt `output` ook stringwaarden binnen gestructureerde tool-call-argumenten na streamreparatie en voor tooluitvoering. Ruwe provider-JSON-fragmenten blijven ongewijzigd; consumenten moeten de gestructureerde partial-, end- of result-payload gebruiken.

Voor CLI's die providerspecifieke JSONL-events uitsturen, stel je `jsonlDialect` in op de configuratie van die backend. Ondersteunde dialecten zijn `claude-stream-json` voor Claude Code-compatibele streams en `gemini-stream-json` voor Gemini CLI `stream-json`-events.

## Eigendom van native Compaction

Sommige CLI-backends draaien een agent die zijn **eigen** transcript comprimeert, dus OpenClaw mag zijn beveiligende summarizer niet daarop uitvoeren - dat zou de eigen Compaction van de backend tegenwerken en kan de beurt hard laten falen.

`claude-cli` heeft geen harness-endpoint - Claude Code comprimeert intern - dus declareert het `ownsNativeCompaction: true`, en OpenClaw retourneert een no-op vanuit het Compaction-pad. Native-harness-sessies zoals Codex blijven in plaats daarvan naar hun harness-Compaction-endpoint routeren.

Omdat de backend eigenaar is van Compaction, is de oude noodoplossing om `contextTokens: 1_000_000` in te stellen puur om te voorkomen dat OpenClaw's beveiliging op een claude-cli-sessie afgaat **niet langer nodig** - de opt-out vervangt die.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declareer `ownsNativeCompaction` alleen voor een backend die echt eigenaar is van zijn Compaction: die moet betrouwbaar zijn eigen transcript begrenzen wanneer het zijn contextvenster nadert en een hervatbare sessie persistent maken (bijv. `--resume` / `--session-id`); anders kan een uitgestelde sessie boven budget blijven. Overeenkomende `agentHarnessId`-sessies blijven naar het harness-endpoint routeren.

## Bundle MCP-overlays

CLI-backends ontvangen **geen** OpenClaw-toolaanroepen direct, maar een backend kan zich aanmelden voor een gegenereerde MCP-configuratieoverlay met `bundleMcp: true`.

Huidig gebundeld gedrag:

- `claude-cli`: gegenereerd strikt MCP-configuratiebestand
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand

Wanneer bundle MCP is ingeschakeld, doet OpenClaw het volgende:

- start een loopback-HTTP-MCP-server die gateway-tools beschikbaar maakt aan het CLI-proces
- authenticeert de bridge met een token per sessie (`OPENCLAW_MCP_TOKEN`)
- beperkt tooltoegang tot de huidige sessie-, account- en kanaalcontext
- laadt ingeschakelde bundle-MCP-servers voor de huidige workspace
- voegt ze samen met een bestaande backend-MCP-configuratie-/instellingenvorm
- herschrijft de startconfiguratie met de integratiemodus, eigendom van de backend, uit de beherende extensie

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte configuratie wanneer een backend zich aanmeldt voor bundle MCP, zodat achtergrondruns geisoleerd blijven.

Sessiespecifieke gebundelde MCP-runtimes worden gecachet voor hergebruik binnen een sessie en daarna opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel `0` in om uit te schakelen). Eenmalige embedded runs zoals auth-probes, slug-generatie en active-memory-recall vragen cleanup aan het einde van de run, zodat stdio-children en Streamable HTTP/SSE-streams niet langer leven dan de run.

## Limiet voor reseed-geschiedenis

Wanneer een nieuwe CLI-sessie wordt geseed vanuit een eerder OpenClaw-transcript (bijvoorbeeld na een `session_expired`-retry), wordt het gerenderde `<conversation_history>`-blok begrensd om te voorkomen dat reseed-prompts uit de hand lopen. De standaardwaarde is `12288` tekens (ongeveer 3000 tokens).

Claude CLI-backends gebruiken automatisch een grotere limiet die is afgeleid van de opgeloste Claude-contexttier. Standaard Claude-runs met 200K tokens behouden een groter transcriptsegment, en Claude-runs met 1M tokens behouden opnieuw een groter segment, terwijl andere CLI-backends de conservatieve standaardwaarde behouden.

- De limiet geldt alleen voor het prior-history-blok van de reseed-prompt. Limieten voor live-sessie-uitvoer worden afzonderlijk afgestemd onder `reliability.outputLimits` (zie [Sessies](#sessions)).

## Beperkingen

- **Geen directe OpenClaw-toolaanroepen.** OpenClaw injecteert geen toolaanroepen in het CLI-backendprotocol. Backends zien gateway-tools alleen wanneer ze zich aanmelden voor `bundleMcp: true`.
- **Streaming is backendspecifiek.** Sommige backends streamen JSONL; andere bufferen tot afsluiten.
- **Gestructureerde uitvoer** is afhankelijk van het JSON-formaat van de CLI.

## Problemen oplossen

- **CLI niet gevonden**: stel `command` in op een volledig pad.
- **Verkeerde modelnaam**: gebruik `modelAliases` om `provider/model` → CLI-model te mappen.
- **Geen sessiecontinuiteit**: zorg dat `sessionArg` is ingesteld en dat `sessionMode` niet `none` is.
- **Afbeeldingen genegeerd**: stel `imageArg` in (en controleer of de CLI bestandspaden ondersteunt).

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Lokale modellen](/nl/gateway/local-models)
