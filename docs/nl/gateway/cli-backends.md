---
read_when:
    - Je wilt een betrouwbare terugvaloptie wanneer API-aanbieders uitvallen
    - Je gebruikt Codex CLI of andere lokale AI-CLI's en wilt ze hergebruiken
    - Je wilt de MCP-loopback-bridge begrijpen voor toegang tot CLI-backendtools
summary: 'CLI-backends: lokale AI CLI-fallback met optionele MCP-toolbrug'
title: CLI-backends
x-i18n:
    generated_at: "2026-04-29T22:42:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kan **lokale AI-CLI's** uitvoeren als een **tekst-only fallback** wanneer API-providers niet beschikbaar zijn,
rate-limited zijn of tijdelijk verkeerd reageren. Dit is bewust conservatief:

- **OpenClaw-tools worden niet rechtstreeks geïnjecteerd**, maar backends met `bundleMcp: true`
  kunnen Gateway-tools ontvangen via een loopback-MCP-bridge.
- **JSONL-streaming** voor CLI's die dit ondersteunen.
- **Sessies worden ondersteund** (zodat vervolgrundes coherent blijven).
- **Afbeeldingen kunnen worden doorgegeven** als de CLI afbeeldingspaden accepteert.

Dit is ontworpen als een **vangnet** in plaats van een primair pad. Gebruik het wanneer je
tekstreacties wilt die “altijd werken” zonder afhankelijk te zijn van externe API's.

Als je een volledige harness-runtime wilt met ACP-sessiebesturing, achtergrondtaken,
thread-/gespreksbinding en persistente externe codeersessies, gebruik dan
[ACP Agents](/nl/tools/acp-agents). CLI-backends zijn geen ACP.

## Beginnersvriendelijke snelstart

Je kunt Codex CLI **zonder configuratie** gebruiken (de meegeleverde OpenAI-plugin
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

Als je een meegeleverde CLI-backend gebruikt als de **primaire berichtprovider** op een
Gateway-host, laadt OpenClaw nu automatisch de eigenaar-plugin wanneer je configuratie
expliciet naar die backend verwijst in een modelreferentie of onder
`agents.defaults.cliBackends`.

## Gebruiken als fallback

Voeg een CLI-backend toe aan je fallbacklijst zodat deze alleen draait wanneer primaire modellen falen:

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

- Als je `agents.defaults.models` gebruikt (allowlist), moet je je CLI-backendmodellen daar ook opnemen.
- Als de primaire provider faalt (auth, rate limits, time-outs), probeert OpenClaw
  daarna de CLI-backend.

## Configuratieoverzicht

Alle CLI-backends staan onder:

```
agents.defaults.cliBackends
```

Elke entry wordt gesleuteld met een **provider-id** (bijv. `codex-cli`, `my-cli`).
De provider-id wordt de linkerkant van je modelreferentie:

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
2. **Bouwt een systeemprompt** met dezelfde OpenClaw-prompt + workspace-context.
3. **Voert de CLI uit** met een sessie-id (indien ondersteund), zodat geschiedenis consistent blijft.
   De meegeleverde `claude-cli`-backend houdt per OpenClaw-sessie een Claude-stdio-proces actief
   en stuurt vervolgrondes via stream-json-stdin.
4. **Parset output** (JSON of platte tekst) en retourneert de uiteindelijke tekst.
5. **Persisteert sessie-id's** per backend, zodat vervolgrondes dezelfde CLI-sessie hergebruiken.

<Note>
De meegeleverde Anthropic `claude-cli`-backend wordt weer ondersteund. Anthropic-medewerkers
hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt
`claude -p`-gebruik als goedgekeurd voor deze integratie, tenzij Anthropic
een nieuw beleid publiceert.
</Note>

De meegeleverde OpenAI `codex-cli`-backend geeft de systeemprompt van OpenClaw door via
Codex' `model_instructions_file`-configuratie-override (`-c
model_instructions_file="..."`). Codex biedt geen Claude-achtige
`--append-system-prompt`-flag, dus OpenClaw schrijft de samengestelde prompt naar een
tijdelijk bestand voor elke nieuwe Codex CLI-sessie.

De meegeleverde Anthropic `claude-cli`-backend ontvangt de OpenClaw-Skills-snapshot
op twee manieren: de compacte OpenClaw-Skills-catalogus in de toegevoegde systeemprompt, en
een tijdelijke Claude Code-plugin die wordt meegegeven met `--plugin-dir`. De plugin bevat
alleen de geschikte Skills voor die agent/sessie, zodat Claude Code's native skill-resolver
dezelfde gefilterde set ziet die OpenClaw anders in
de prompt zou adverteren. Skill-env-/API-key-overrides worden nog steeds door OpenClaw toegepast op
de childprocess-omgeving voor de run.

Claude CLI heeft ook een eigen niet-interactieve permissiemodus. OpenClaw mapt die
naar het bestaande exec-beleid in plaats van Claude-specifieke configuratie toe te voegen: wanneer het
effectieve gevraagde exec-beleid YOLO is (`tools.exec.security: "full"` en
`tools.exec.ask: "off"`), voegt OpenClaw `--permission-mode bypassPermissions` toe.
Per-agent-instellingen voor `agents.list[].tools.exec` overschrijven globale `tools.exec` voor
die agent. Om een andere Claude-modus af te dwingen, stel je expliciete ruwe backend-args in
zoals `--permission-mode default` of `--permission-mode acceptEdits` onder
`agents.defaults.cliBackends.claude-cli.args` en bijpassende `resumeArgs`.

Voordat OpenClaw de meegeleverde `claude-cli`-backend kan gebruiken, moet Claude Code zelf
al zijn ingelogd op dezelfde host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gebruik `agents.defaults.cliBackends.claude-cli.command` alleen wanneer de `claude`-
binary nog niet op `PATH` staat.

## Sessies

- Als de CLI sessies ondersteunt, stel dan `sessionArg` (bijv. `--session-id`) of
  `sessionArgs` (placeholder `{sessionId}`) in wanneer de ID in meerdere flags moet worden ingevoegd.
- Als de CLI een **resume-subcommand** met andere flags gebruikt, stel dan
  `resumeArgs` in (vervangt `args` bij hervatten) en optioneel `resumeOutput`
  (voor niet-JSON-resumes).
- `sessionMode`:
  - `always`: stuur altijd een sessie-id (nieuwe UUID als er geen is opgeslagen).
  - `existing`: stuur alleen een sessie-id als er eerder een was opgeslagen.
  - `none`: stuur nooit een sessie-id.
- `claude-cli` staat standaard op `liveSession: "claude-stdio"`, `output: "jsonl"`,
  en `input: "stdin"`, zodat vervolgrondes het live Claude-proces hergebruiken zolang
  het actief is. Warme stdio is nu de standaard, ook voor aangepaste configuraties
  die transportvelden weglaten. Als de Gateway herstart of het idle proces
  afsluit, hervat OpenClaw vanaf de opgeslagen Claude-sessie-id. Opgeslagen sessie-
  id's worden vóór hervatten geverifieerd tegen een bestaand leesbaar projecttranscript,
  zodat spookbindingen worden gewist met `reason=transcript-missing`
  in plaats van stilzwijgend een nieuwe Claude CLI-sessie te starten onder `--resume`.
- Opgeslagen CLI-sessies zijn provider-eigen continuïteit. De impliciete dagelijkse sessie-
  reset kapt ze niet af; `/reset` en expliciete `session.reset`-beleidsregels doen dat nog steeds.

Serialisatie-opmerkingen:

- `serialize: true` houdt runs op dezelfde lane geordend.
- De meeste CLI's serialiseren op één provider-lane.
- OpenClaw laat hergebruik van opgeslagen CLI-sessies vallen wanneer de geselecteerde auth-identiteit verandert,
  inclusief een gewijzigde auth-profiel-id, statische API-sleutel, statisch token of OAuth-
  accountidentiteit wanneer de CLI er een exposeert. Rotatie van OAuth-access- en refresh-tokens
  kapt de opgeslagen CLI-sessie niet af. Als een CLI geen
  stabiele OAuth-account-id exposeert, laat OpenClaw die CLI de hervatpermissies afdwingen.

## Fallback-prelude uit claude-cli-sessies

Wanneer een `claude-cli`-poging faalt naar een niet-CLI-kandidaat in
[`agents.defaults.model.fallbacks`](/nl/concepts/model-failover), seedt OpenClaw
de volgende poging met een contextprelude die wordt geoogst uit Claude Code's lokale
JSONL-transcript op `~/.claude/projects/`. Zonder deze seed zou de fallback-
provider koud starten omdat OpenClaw's eigen sessietranscript leeg is
voor `claude-cli`-runs.

- De prelude geeft de voorkeur aan de nieuwste `/compact`-samenvatting of `compact_boundary`-
  marker, en voegt daarna de meest recente post-boundary-rondes toe tot een teken-
  budget. Pre-boundary-rondes worden weggelaten omdat de samenvatting ze al vertegenwoordigt.
- Toolblokken worden samengevoegd tot compacte `(tool call: name)`- en
  `(tool result: …)`-hints om het promptbudget eerlijk te houden. De samenvatting wordt
  gelabeld als `(truncated)` als deze overloopt.
- Same-provider-`claude-cli`-naar-`claude-cli`-fallbacks vertrouwen op Claude's eigen
  `--resume` en slaan de prelude over.
- De seed hergebruikt de bestaande validatie van het Claude-sessiebestandspad, zodat
  willekeurige paden niet kunnen worden gelezen.

## Afbeeldingen (pass-through)

Als je CLI afbeeldingspaden accepteert, stel dan `imageArg` in:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schrijft base64-afbeeldingen naar tijdelijke bestanden. Als `imageArg` is ingesteld, worden die
paden doorgegeven als CLI-args. Als `imageArg` ontbreekt, voegt OpenClaw de
bestandspaden toe aan de prompt (padinjectie), wat genoeg is voor CLI's die lokale bestanden automatisch
laden vanuit platte paden.

## Invoer / uitvoer

- `output: "json"` (standaard) probeert JSON te parsen en tekst + sessie-id te extraheren.
- Voor Gemini CLI JSON-output leest OpenClaw antwoordtekst uit `response` en
  gebruik uit `stats` wanneer `usage` ontbreekt of leeg is.
- `output: "jsonl"` parset JSONL-streams (bijvoorbeeld Codex CLI `--json`) en extraheert het uiteindelijke agentbericht plus sessie-
  identifiers wanneer aanwezig.
- `output: "text"` behandelt stdout als het uiteindelijke antwoord.

Invoermodi:

- `input: "arg"` (standaard) geeft de prompt door als de laatste CLI-arg.
- `input: "stdin"` stuurt de prompt via stdin.
- Als de prompt erg lang is en `maxPromptArgChars` is ingesteld, wordt stdin gebruikt.

## Standaardwaarden (plugin-eigen)

De meegeleverde OpenAI-plugin registreert ook een standaard voor `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

De meegeleverde Google-plugin registreert ook een standaard voor `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voorwaarde: de lokale Gemini CLI moet geïnstalleerd zijn en beschikbaar zijn als
`gemini` op `PATH` (`brew install gemini-cli` of
`npm install -g @google/gemini-cli`).

Gemini CLI JSON-opmerkingen:

- Antwoordtekst wordt gelezen uit het JSON-veld `response`.
- Gebruik valt terug op `stats` wanneer `usage` afwezig of leeg is.
- `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
- Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
  `stats.input_tokens - stats.cached`.

Overschrijf alleen als dat nodig is (veelvoorkomend: absoluut `command`-pad).

## Plugin-eigen standaardwaarden

Standaardwaarden voor CLI-backends maken nu deel uit van het plugin-oppervlak:

- Plugins registreren ze met `api.registerCliBackend(...)`.
- De backend-`id` wordt het providerprefix in modelreferenties.
- Gebruikersconfiguratie in `agents.defaults.cliBackends.<id>` overschrijft nog steeds de plugin-standaard.
- Backend-specifieke configuratieopschoning blijft plugin-eigen via de optionele
  `normalizeConfig`-hook.

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

`input` herschrijft de systeemprompt en gebruikersprompt die aan de CLI worden doorgegeven. `output`
herschrijft gestreamde assistant-delta's en geparseerde definitieve tekst voordat OpenClaw
zijn eigen controlemarkeringen en kanaallevering verwerkt.

Voor CLI's die Claude Code stream-json-compatibele JSONL uitvoeren, stel
`jsonlDialect: "claude-stream-json"` in op de config van die backend.

## MCP-overlays bundelen

CLI-backends ontvangen OpenClaw-toolaanroepen **niet** rechtstreeks, maar een backend kan
zich aanmelden voor een gegenereerde MCP-config-overlay met `bundleMcp: true`.

Huidig gebundeld gedrag:

- `claude-cli`: gegenereerd strikt MCP-configbestand
- `codex-cli`: inline config-overschrijvingen voor `mcp_servers`; de gegenereerde
  OpenClaw-loopbackserver wordt gemarkeerd met Codex' goedkeuringsmodus per server
  zodat MCP-aanroepen niet kunnen blijven hangen op lokale goedkeuringsprompts
- `google-gemini-cli`: gegenereerd Gemini-systeeminstellingenbestand

Wanneer bundle-MCP is ingeschakeld, doet OpenClaw het volgende:

- start een loopback HTTP-MCP-server die gateway-tools aan het CLI-proces blootstelt
- verifieert de bridge met een token per sessie (`OPENCLAW_MCP_TOKEN`)
- beperkt tooltoegang tot de huidige sessie, account- en kanaalcontext
- laadt ingeschakelde bundle-MCP-servers voor de huidige workspace
- voegt ze samen met elke bestaande MCP-config-/instellingenvorm van de backend
- herschrijft de startconfig met de integratiemodus van de backend uit de eigenaarsextensie

Als er geen MCP-servers zijn ingeschakeld, injecteert OpenClaw nog steeds een strikte config wanneer een
backend zich aanmeldt voor bundle-MCP, zodat achtergrondruns geïsoleerd blijven.

Sessiegebonden gebundelde MCP-runtimes worden in de cache gezet voor hergebruik binnen een sessie en daarna
opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10
minuten; stel `0` in om uit te schakelen). Eenmalige ingesloten runs zoals auth-probes,
slug-generatie en active-memory recall ruimen verzoeken op aan het einde van de run, zodat stdio-
childprocessen en Streamable HTTP/SSE-streams niet langer blijven bestaan dan de run.

## Beperkingen

- **Geen rechtstreekse OpenClaw-toolaanroepen.** OpenClaw injecteert geen toolaanroepen in
  het CLI-backendprotocol. Backends zien gateway-tools alleen wanneer ze zich aanmelden voor
  `bundleMcp: true`.
- **Streaming is backend-specifiek.** Sommige backends streamen JSONL; andere bufferen
  tot afsluiting.
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
