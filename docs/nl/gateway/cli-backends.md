---
read_when:
    - Je wilt een betrouwbare fallback wanneer API-providers falen
    - U gebruikt Codex CLI of andere lokale AI-CLI's en wilt ze hergebruiken
    - Je wilt de MCP-loopbackbrug voor CLI-toegang tot backendtools begrijpen
summary: 'CLI-backends: lokale AI-CLI-terugvaloptie met optionele MCP-toolbrug'
title: CLI-backends
x-i18n:
    generated_at: "2026-05-04T18:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan **lokale AI-CLI's** uitvoeren als **tekst-only fallback** wanneer API-providers niet beschikbaar zijn,
rate-limited zijn of tijdelijk verkeerd werken. Dit is bewust conservatief:

- **OpenClaw-tools worden niet rechtstreeks geïnjecteerd**, maar backends met `bundleMcp: true`
  kunnen Gateway-tools ontvangen via een loopback-MCP-brug.
- **JSONL-streaming** voor CLI's die dit ondersteunen.
- **Sessies worden ondersteund** (zodat vervolgbeurten coherent blijven).
- **Afbeeldingen kunnen worden doorgegeven** als de CLI afbeeldingspaden accepteert.

Dit is ontworpen als een **vangnet** in plaats van een primair pad. Gebruik het wanneer je
"werkt altijd"-tekstantwoorden wilt zonder afhankelijk te zijn van externe API's.

Als je een volledige harness-runtime wilt met ACP-sessiebediening, achtergrondtaken,
thread-/gespreksbinding en persistente externe codeersessies, gebruik dan in plaats daarvan
[ACP Agents](/nl/tools/acp-agents). CLI-backends zijn geen ACP.

## Beginnersvriendelijke snelstart

Je kunt Codex CLI **zonder enige configuratie** gebruiken (de gebundelde OpenAI-Plugin
registreert een standaardbackend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Als je Gateway onder launchd/systemd draait en PATH minimaal is, voeg dan alleen het
commandopad toe:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Dat is alles. Geen sleutels, geen extra auth-configuratie nodig buiten de CLI zelf.

Als je een gebundelde CLI-backend gebruikt als de **primaire berichtprovider** op een
Gateway-host, laadt OpenClaw nu automatisch de eigenaar-gebundelde Plugin wanneer je configuratie
expliciet naar die backend verwijst in een modelref of onder
`agents.defaults.cliBackends`.

## Gebruiken als fallback

Voeg een CLI-backend toe aan je fallback-lijst zodat deze alleen wordt uitgevoerd wanneer primaire modellen falen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Opmerkingen:

- Als je `agents.defaults.models` gebruikt (toegestane lijst), moet je je CLI-backendmodellen daar ook opnemen.
- Als de primaire provider faalt (auth, ratelimieten, time-outs), probeert OpenClaw
  daarna de CLI-backend.

## Configuratieoverzicht

Alle CLI-backends staan onder:

```
agents.defaults.cliBackends
```

Elke vermelding krijgt een sleutel met een **provider-id** (bijv. `codex-cli`, `my-cli`).
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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
          serialize: true,
        },
      },
    },
  },
}
```

## Hoe het werkt

1. **Selecteert een backend** op basis van het providerprefix (`codex-cli/...`).
2. **Bouwt een systeemprompt** met dezelfde OpenClaw-prompt en workspacecontext.
3. **Voert de CLI uit** met een sessie-id (indien ondersteund), zodat de geschiedenis consistent blijft.
   De gebundelde `claude-cli`-backend houdt per OpenClaw-sessie een Claude-stdio-proces actief
   en stuurt vervolgbeurten via stream-json-stdin.
4. **Parset uitvoer** (JSON of platte tekst) en retourneert de definitieve tekst.
5. **Persisteert sessie-id's** per backend, zodat vervolgbeurten dezelfde CLI-sessie hergebruiken.

<Note>
De gebundelde Anthropic `claude-cli`-backend wordt opnieuw ondersteund. Anthropic-medewerkers
vertelden ons dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus OpenClaw behandelt
`claude -p`-gebruik als toegestaan voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
</Note>

De gebundelde OpenAI `codex-cli`-backend geeft de systeemprompt van OpenClaw door via
Codex' `model_instructions_file`-configuratie-override (`-c
model_instructions_file="..."`). Codex biedt geen Claude-achtige
`--append-system-prompt`-vlag, dus OpenClaw schrijft de samengestelde prompt naar een
tijdelijk bestand voor elke nieuwe Codex CLI-sessie.

De gebundelde Anthropic `claude-cli`-backend ontvangt de OpenClaw Skills-snapshot
op twee manieren: de compacte OpenClaw Skills-catalogus in de toegevoegde systeemprompt, en
een tijdelijke Claude Code-Plugin die wordt meegegeven met `--plugin-dir`. De Plugin bevat
alleen de in aanmerking komende Skills voor die agent/sessie, zodat de native Skill-resolver
van Claude Code dezelfde gefilterde set ziet die OpenClaw anders in de prompt zou adverteren.
Skill-env-/API-sleutel-overrides worden nog steeds door OpenClaw toegepast op de
childprocesomgeving voor de run.

Claude CLI heeft ook een eigen niet-interactieve permissiemodus. OpenClaw koppelt die
aan het bestaande exec-beleid in plaats van Claude-specifieke configuratie toe te voegen: wanneer het
effectief aangevraagde exec-beleid YOLO is (`tools.exec.security: "full"` en
`tools.exec.ask: "off"`), voegt OpenClaw `--permission-mode bypassPermissions` toe.
Per-agent-instellingen `agents.list[].tools.exec` overschrijven globale `tools.exec` voor
die agent. Om een andere Claude-modus af te dwingen, stel je expliciete ruwe backendargumenten in
zoals `--permission-mode default` of `--permission-mode acceptEdits` onder
`agents.defaults.cliBackends.claude-cli.args` en bijpassende `resumeArgs`.

De gebundelde Anthropic `claude-cli`-backend koppelt ook OpenClaw `/think`-niveaus
aan Claude Code's native `--effort`-vlag voor niet-uit-niveaus. `minimal` en
`low` worden gekoppeld aan `low`, `adaptive` en `medium` aan `medium`, en `high`,
`xhigh` en `max` rechtstreeks. Andere CLI-backends hebben hun eigenaar-Plugin nodig om
een equivalente argv-mapper te declareren voordat `/think` invloed kan hebben op de gespawnde CLI.

Voordat OpenClaw de gebundelde `claude-cli`-backend kan gebruiken, moet Claude Code zelf
al zijn ingelogd op dezelfde host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gebruik `agents.defaults.cliBackends.claude-cli.command` alleen wanneer de `claude`-
binary nog niet op `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stel dan `sessionArg` in (bijv. `--session-id`) of
  `sessionArgs` (placeholder `{sessionId}`) wanneer de ID in meerdere vlaggen moet worden ingevoegd.
- Als de CLI een **resume-subcommand** met andere vlaggen gebruikt, stel dan
  `resumeArgs` in (vervangt `args` bij hervatten) en optioneel `resumeOutput`
  (voor niet-JSON-hervattingen).
- `sessionMode`:
  - `always`: stuur altijd een sessie-id (nieuwe UUID als er geen is opgeslagen).
  - `existing`: stuur alleen een sessie-id als er eerder een was opgeslagen.
  - `none`: stuur nooit een sessie-id.
- `claude-cli` gebruikt standaard `liveSession: "claude-stdio"`, `output: "jsonl"`,
  en `input: "stdin"` zodat vervolgbeurten het live Claude-proces hergebruiken zolang
  het actief is. Warme stdio is nu de standaard, ook voor aangepaste configuraties
  die transportvelden weglaten. Als de Gateway opnieuw start of het idle proces
  afsluit, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-
  id's worden geverifieerd tegen een bestaand leesbaar projecttranscript voordat
  wordt hervat, zodat fantoomkoppelingen worden gewist met `reason=transcript-missing`
  in plaats van stilzwijgend een nieuwe Claude CLI-sessie te starten onder `--resume`.
- Claude-live-sessies houden begrensde JSONL-uitvoerbewakers aan. Standaarden staan maximaal
  8 MiB en 20.000 ruwe JSONL-regels per beurt toe. Tool-zware Claude-beurten kunnen
  deze per backend verhogen met
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  en `maxTurnLines`; OpenClaw begrenst die instellingen tot 64 MiB en 100.000
  regels.
- Opgeslagen CLI-sessies zijn door de provider beheerde continuïteit. De impliciete dagelijkse sessie-
  reset knipt ze niet af; `/reset` en expliciete `session.reset`-beleidsregels doen dat nog steeds.

Serialisatieopmerkingen:

- `serialize: true` houdt runs in dezelfde lane geordend.
- De meeste CLI's serialiseren op één provider-lane.
- OpenClaw laat hergebruik van opgeslagen CLI-sessies vallen wanneer de geselecteerde auth-identiteit verandert,
  inclusief een gewijzigde auth-profiel-id, statische API-sleutel, statisch token of OAuth-
  accountidentiteit wanneer de CLI er een blootlegt. Rotatie van OAuth-toegangs- en refresh-tokens
  knipt de opgeslagen CLI-sessie niet af. Als een CLI geen
  stabiele OAuth-account-id blootlegt, laat OpenClaw die CLI hervatrechten afdwingen.

## Fallback-prelude uit claude-cli-sessies

Wanneer een `claude-cli`-poging faalt naar een niet-CLI-kandidaat in
[`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), zaait OpenClaw
de volgende poging met een contextprelude die is geoogst uit Claude Code's lokale
JSONL-transcript op `~/.claude/projects/`. Zonder deze seed zou de fallback-
provider koud starten omdat OpenClaw's eigen sessietranscript leeg is
voor `claude-cli`-runs.

- De prelude geeft de voorkeur aan de nieuwste `/compact`-samenvatting of `compact_boundary`-
  marker, en voegt daarna de meest recente post-boundary beurten toe tot aan een teken-
  budget. Pre-boundary beurten worden weggelaten omdat de samenvatting ze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte `(tool call: name)`- en
  `(tool result: …)`-hints om het promptbudget eerlijk te houden. De samenvatting krijgt
  het label `(truncated)` als deze overloopt.
- Same-provider `claude-cli`-naar-`claude-cli`-fallbacks vertrouwen op Claude's eigen
  `--resume` en slaan de prelude over.
- De seed hergebruikt de bestaande Claude-sessiebestandpadvalidatie, zodat
  willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen (doorgeven)

Als je CLI afbeeldingspaden accepteert, stel dan `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die
paden als CLI-argumenten meegegeven. Als `imageArg` ontbreekt, voegt OpenClaw de
bestandspaden toe aan de prompt (padinjectie), wat genoeg is voor CLI's die automatisch
lokale bestanden laden vanuit platte paden.

## Invoer / uitvoer

- `output: "json"` (standaard) probeert JSON te parsen en tekst + sessie-id te extraheren.
- Voor Gemini CLI-JSON-uitvoer leest OpenClaw antwoordtekst uit `response` en
  gebruik uit `stats` wanneer `usage` ontbreekt of leeg is.
- `output: "jsonl"` parset JSONL-streams (bijvoorbeeld Codex CLI `--json`) en extraheert het definitieve agentbericht plus sessie-
  identificatoren wanneer aanwezig.
- `output: "text"` behandelt stdout als het definitieve antwoord.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als het laatste CLI-argument.
- `input: "stdin"` stuurt de prompt via stdin.
- Als de prompt erg lang is en `maxPromptArgChars` is ingesteld, wordt stdin gebruikt.

## Standaarden (eigendom van Plugin)

De gebundelde OpenAI-Plugin registreert ook een standaard voor `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

De gebundelde Google-Plugin registreert ook een standaard voor `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Vereiste: de lokale Gemini CLI moet geïnstalleerd zijn en beschikbaar zijn als
`gemini` op `PATH` (`brew install gemini-cli` of
`npm install -g @google/gemini-cli`).

Gemini CLI-JSON-opmerkingen:

- Antwoordtekst wordt gelezen uit het JSON-veld `response`.
- Gebruik valt terug op `stats` wanneer `usage` ontbreekt of leeg is.
- `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
- Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
  `stats.input_tokens - stats.cached`.

Overschrijf alleen indien nodig (vaak: absoluut `command`-pad).

## Plugin-eigen standaardwaarden

CLI-backendstandaardwaarden maken nu deel uit van het plugin-oppervlak:

- Plugins registreren ze met `api.registerCliBackend(...)`.
- De backend-`id` wordt het providervoorvoegsel in modelrefs.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de pluginstandaard.
- Backend-specifieke configuratieopschoning blijft plugin-eigen via de optionele
  `normalizeConfig`-hook.

Plugins die kleine compatibiliteitsshims voor prompts/berichten nodig hebben, kunnen
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
herschrijft gestreamde assistent-delta's en geparseerde eindtekst voordat OpenClaw
zijn eigen controlemarkeringen en kanaallevering afhandelt.

Voor CLI's die Claude Code stream-json-compatibele JSONL uitvoeren, stel
`jsonlDialect: "claude-stream-json"` in op de configuratie van die backend.

## Bundle-MCP-overlays

CLI-backends ontvangen OpenClaw-toolaanroepen **niet** rechtstreeks, maar een backend kan
zich aanmelden voor een gegenereerde MCP-configuratie-overlay met `bundleMcp: true`.

Huidig gebundeld gedrag:

- `claude-cli`: gegenereerd strikt MCP-configuratiebestand
- `codex-cli`: inline configuratie-overschrijvingen voor `mcp_servers`; de gegenereerde
  OpenClaw-loopbackserver is gemarkeerd met Codex' toolgoedkeuringsmodus per server,
  zodat MCP-aanroepen niet kunnen blijven hangen op lokale goedkeuringsprompts
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand

Wanneer bundle-MCP is ingeschakeld, doet OpenClaw het volgende:

- start een loopback HTTP MCP-server die Gateway-tools blootstelt aan het CLI-proces
- authenticeert de bridge met een token per sessie (`OPENCLAW_MCP_TOKEN`)
- beperkt tooltoegang tot de huidige sessie-, account- en kanaalcontext
- laadt ingeschakelde bundle-MCP-servers voor de huidige werkruimte
- voegt ze samen met bestaande MCP-configuratie-/instellingenvormen van de backend
- herschrijft de startconfiguratie met de backend-eigen integratiemodus van de beherende extensie

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte configuratie wanneer een
backend zich aanmeldt voor bundle-MCP, zodat achtergrondruns geïsoleerd blijven.

Sessiegebonden gebundelde MCP-runtimes worden gecachet voor hergebruik binnen een sessie en daarna
opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10
minuten; stel `0` in om uit te schakelen). Eenmalige ingesloten runs zoals auth-probes,
sluggeneratie en active-memory-recall vragen om opschoning aan het einde van de run, zodat stdio-
children en Streamable HTTP/SSE-streams niet langer blijven bestaan dan de run.

## Beperkingen

- **Geen directe OpenClaw-toolaanroepen.** OpenClaw injecteert geen toolaanroepen in
  het CLI-backendprotocol. Backends zien alleen gatewaytools wanneer ze zich aanmelden voor
  `bundleMcp: true`.
- **Streaming is backend-specifiek.** Sommige backends streamen JSONL; andere bufferen
  tot afsluiten.
- **Gestructureerde uitvoer** hangt af van de JSON-indeling van de CLI.
- **Codex CLI-sessies** worden hervat via tekstuitvoer (geen JSONL), wat minder
  gestructureerd is dan de initiële `--json`-run. OpenClaw-sessies werken nog steeds
  normaal.

## Probleemoplossing

- **CLI niet gevonden**: stel `command` in op een volledig pad.
- **Verkeerde modelnaam**: gebruik `modelAliases` om `provider/model` → CLI-model te koppelen.
- **Geen sessiecontinuïteit**: zorg dat `sessionArg` is ingesteld en dat `sessionMode` niet
  `none` is (Codex CLI kan momenteel niet hervatten met JSON-uitvoer).
- **Afbeeldingen genegeerd**: stel `imageArg` in (en controleer of de CLI bestandspaden ondersteunt).

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Lokale modellen](/nl/gateway/local-models)
