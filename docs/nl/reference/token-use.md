---
read_when:
    - Tokengebruik, kosten of contextvensters uitleggen
    - Foutopsporing van contextgroei of Compaction-gedrag
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik + kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-07-01T18:16:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen gebruiken gemiddeld ~4 tekens per token voor Engelse tekst.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke run zijn eigen systeemprompt samen. Deze bevat:

- Toollijst + korte beschrijvingen
- Skills-lijst (alleen metadata; instructies worden op aanvraag geladen met `read`).
  Native Codex-turns ontvangen het compacte Skills-blok als turn-gebonden
  samenwerkingontwikkelaarsinstructies; andere harnesses ontvangen het in het normale
  promptoppervlak. Het wordt begrensd door `skills.limits.maxSkillsPromptChars`, met
  een optionele override per agent op `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructies voor zelfupdates
- Workspace + bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus `MEMORY.md` wanneer aanwezig). Native Codex-turns plakken geen ruwe `MEMORY.md` uit de geconfigureerde agent-workspace wanneer memory-tools beschikbaar zijn voor die workspace; ze bevatten een kleine geheugenverwijzing in turn-gebonden samenwerkingontwikkelaarsinstructies en gebruiken memory-tools op aanvraag. Als tools zijn uitgeschakeld, zoeken in geheugen niet beschikbaar is, of de actieve workspace verschilt van de agent-geheugenworkspace, gebruikt `MEMORY.md` het normale begrensde turn-contextpad. Lowercase root `memory.md` wordt niet geïnjecteerd; het is legacy-reparatie-invoer voor `openclaw doctor --fix` wanneer gekoppeld aan `MEMORY.md`. Grote geïnjecteerde bestanden worden afgekapt door `agents.defaults.bootstrapMaxChars` (standaard: 20000), en de totale bootstrapinjectie wordt begrensd door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Dagelijkse `memory/*.md`-bestanden maken geen deel uit van de normale bootstrapprompt; ze blijven op aanvraag beschikbaar via memory-tools in gewone turns, maar reset-/startup-modelruns kunnen een eenmalig startup-contextblok met recent dagelijks geheugen vooraf toevoegen voor die eerste turn. Kale chatcommando's `/new` en `/reset` worden bevestigd zonder het model aan te roepen. De startup-prelude wordt beheerd door `agents.defaults.startupContext`. AGENTS.md-fragmenten na Compaction zijn afzonderlijk en vereisen expliciete opt-in via `agents.defaults.compaction.postCompactionSections`.
- Tijd (UTC + tijdzone van gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtime-metadata (host/OS/model/thinking)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

Gebruik bij het documenteren van credentials of auth-fragmenten de
[Conventies voor geheime placeholders](/nl/reference/secret-placeholder-conventions) om
vals-positieven van secret-scanners in docs-only wijzigingen te voorkomen.

## Wat meetelt in het contextvenster

Alles wat het model ontvangt telt mee voor de contextlimiet:

- Systeemprompt (alle hierboven genoemde secties)
- Gespreksgeschiedenis (berichten van gebruiker + assistant)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripts (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en snoei-artifacts
- Provider-wrappers of safety-headers (niet zichtbaar, maar tellen nog steeds mee)

Sommige runtime-zware oppervlakken hebben hun eigen expliciete limieten:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overrides per agent staan onder `agents.list[].contextLimits`. Deze knoppen zijn
voor begrensde runtime-fragmenten en geïnjecteerde runtime-eigen blokken. Ze zijn
gescheiden van bootstraplimieten, startup-contextlimieten en Skills-promptlimieten.

`toolResultMaxChars` is een geavanceerde bovengrens (tot `1000000` tekens). Wanneer deze niet is ingesteld, kiest OpenClaw
de live toolresultaatlimiet uit het effectieve modelcontextvenster: `16000` tekens
onder 100K tokens, `32000` tekens bij 100K+ tokens, en `64000` tekens bij 200K+
tokens, nog steeds begrensd door de runtime context-share guard.

Voor afbeeldingen schaalt OpenClaw transcript-/tool-afbeeldingspayloads omlaag vóór provideraanroepen.
Gebruik `agents.defaults.imageMaxDimensionPx` (standaard: `1200`) om dit af te stemmen:

- Lagere waarden verminderen meestal het gebruik van vision-tokens en de payloadgrootte.
- Hogere waarden behouden meer visueel detail voor OCR-/UI-zware screenshots.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing (per geïnjecteerd bestand, tools, Skills en systeempromptgrootte). Zie [Context](/nl/concepts/context).

## Huidig tokengebruik bekijken

Gebruik deze in chat:

- `/status` → **emojirijke statuskaart** met het sessiemodel, contextgebruik,
  input-/outputtokens van het laatste antwoord, en **geschatte kosten** wanneer lokale prijzen zijn
  geconfigureerd voor het actieve model.
- `/usage off|tokens|full` → voegt een **gebruikfooter per antwoord** toe aan elk antwoord.
  - Blijft per sessie behouden (opgeslagen als `responseUsage`).
  - `/usage reset` (aliassen: `inherit`, `clear`, `default`) — wist de sessie-
    override zodat de sessie opnieuw de geconfigureerde standaard overerft.
  - `/usage tokens` toont token-/cachedetails van de turn.
  - `/usage full` toont compacte model-/context-/kostendetails; geschatte kosten verschijnen
    alleen wanneer OpenClaw gebruiksmetadata en lokale prijzen voor het actieve model heeft.
    Aangepaste `messages.usageTemplate`-layouts kunnen token-/cachevelden bevatten.
- `/usage cost` → toont een lokaal kostenoverzicht uit OpenClaw-sessielogs.

Andere oppervlakken:

- **TUI/Web TUI:** `/status` + `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde providerquotavensters (`X% left`, geen kosten per antwoord).
  Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.

Gebruiksoppervlakken normaliseren veelvoorkomende provider-native veldaliassen vóór weergave.
Voor Responses-verkeer uit de OpenAI-familie omvat dat zowel `input_tokens` /
`output_tokens` als `prompt_tokens` / `completion_tokens`, zodat transportspecifieke
veldnamen `/status`, `/usage` of sessiesamenvattingen niet veranderen.
Gemini CLI-gebruik wordt ook genormaliseerd: de standaard `stream-json`-parser leest
assistant-`message`-events, en `stats.cached` wordt toegewezen aan `cacheRead`, waarbij
`stats.input_tokens - stats.cached` wordt gebruikt wanneer de CLI geen expliciet
`stats.input`-veld opgeeft. Legacy JSON-overrides lezen antwoordtekst nog steeds uit
`response`.
Voor native Responses-verkeer uit de OpenAI-familie worden WebSocket-/SSE-gebruiksaliassen
op dezelfde manier genormaliseerd, en totalen vallen terug op genormaliseerde input + output wanneer
`total_tokens` ontbreekt of `0` is.
Wanneer de huidige sessiesnapshot schaars is, kunnen `/status` en `session_status` ook
token-/cachetellers en het actieve runtime-modellabel herstellen uit de meest recente
transcriptgebruiklog. Bestaande niet-nul live waarden blijven voorrang hebben op
transcriptfallbackwaarden, en grotere promptgerichte transcripttotalen kunnen winnen
wanneer opgeslagen totalen ontbreken of kleiner zijn.
Gebruiksauth voor providerquotavensters komt uit providerspecifieke hooks wanneer
beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-key-credentials
uit auth-profielen, env of config.
Assistant-transcriptvermeldingen bewaren dezelfde genormaliseerde gebruiksvorm, inclusief
`usage.cost` wanneer het actieve model prijzen geconfigureerd heeft en de provider
gebruiksmetadata teruggeeft. Dit geeft `/usage cost` en transcriptonderbouwde sessiestatus
een stabiele bron, zelfs nadat de live runtime-status verdwenen is.

OpenClaw houdt providergebruiksboekhouding gescheiden van de huidige contextsnapshot.
Provider `usage.total` kan gecachte input, output en meerdere
tool-loop-modelaanroepen bevatten, dus het is nuttig voor kosten en telemetrie maar kan het
live contextvenster overschatten. Contextweergaven en diagnostiek gebruiken de nieuwste
promptsnapshot (`promptTokens`, of de laatste modelaanroep wanneer geen promptsnapshot
beschikbaar is) voor `context.used`.

## Kostenraming (wanneer getoond)

Kosten worden geraamd op basis van je modelprijsconfiguratie:

```
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1M tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, laat `/usage full` kosten weg; gebruik `/usage tokens`
of een aangepaste `messages.usageTemplate` wanneer je token-/cachedetails in elk
antwoord nodig hebt. Kostenweergave is niet beperkt tot API-key-auth: providers zonder API-key,
zoals `aws-sdk`, kunnen geschatte kosten tonen wanneer hun geconfigureerde modelvermelding
lokale prijzen bevat en de provider gebruiksmetadata teruggeeft.

Nadat sidecars en kanalen het Gateway-ready-pad bereiken, start OpenClaw een
optionele pricing-bootstrap op de achtergrond voor geconfigureerde modelrefs die nog
geen lokale prijzen hebben. Die bootstrap haalt remote OpenRouter- en LiteLLM-
prijscatalogi op. Stel `models.pricing.enabled: false` in om die catalogusopvragingen
op offline of beperkte netwerken over te slaan; expliciete
`models.providers.*.models[].cost`-vermeldingen blijven lokale kostenramingen
aansturen.

## Cache-TTL en impact van snoeien

Promptcaching door providers geldt alleen binnen het cache-TTL-venster. OpenClaw kan
optioneel **cache-TTL-snoeiing** uitvoeren: het snoeit de sessie zodra de cache-TTL
is verlopen, en reset daarna het cachevenster zodat daaropvolgende requests de
vers gecachte context opnieuw kunnen gebruiken in plaats van de volledige geschiedenis
opnieuw te cachen. Dit houdt cachewrite-kosten lager wanneer een sessie langer dan de TTL
idle blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en zie de
gedragsdetails in [Sessiesnoeiing](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden over idle onderbrekingen heen. Als de cache-TTL
van je model `1h` is, kan het instellen van het Heartbeat-interval net daaronder
(bijv. `55m`) voorkomen dat de volledige prompt opnieuw wordt gecachet, waardoor
cachewrite-kosten dalen.

In multi-agent setups kun je één gedeelde modelconfig behouden en cachegedrag
per agent afstemmen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige knop-voor-knop-gids.

Voor Anthropic API-prijzen zijn cachereads aanzienlijk goedkoper dan inputtokens,
terwijl cachewrites met een hogere multiplier worden gefactureerd. Zie Anthropic's
prijzen voor promptcaching voor de nieuwste tarieven en TTL-multipliers:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Voorbeeld: houd 1h-cache warm met Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Voorbeeld: gemengd verkeer met cachestrategie per agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` wordt samengevoegd boven op de `params` van het geselecteerde model, zodat je
alleen `cacheRetention` kunt overriden en andere modelstandaarden ongewijzigd kunt erven.

### Anthropic 1M-context

OpenClaw schaalt GA-capabele Claude 4.x-modellen zoals Opus 4.8, Opus 4.7, Opus 4.6 en
Sonnet 4.6 met Anthropic's 1M-contextvenster. Je hebt
`params.context1m: true` niet nodig voor die modellen.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Oudere configs kunnen `context1m: true` behouden, maar OpenClaw stuurt
Anthropic's uitgefaseerde `context-1m-2025-08-07` beta-header niet langer voor deze instelling en
breidt niet-ondersteunde oudere Claude-modellen niet uit naar 1M.

Vereiste: de credential moet in aanmerking komen voor long-context-gebruik. Zo niet,
dan antwoordt Anthropic met een provider-side rate limit-fout voor die request.

Als je Anthropic authenticeert met OAuth-/subscription-tokens (`sk-ant-oat-*`),
behoudt OpenClaw de OAuth-vereiste Anthropic beta-headers terwijl de
uitgefaseerde `context-1m-*` beta wordt gestript als die in oudere config achterblijft.

## Tips om tokendruk te verlagen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote tooluitvoer in je workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor sessies met veel screenshots.
- Houd Skill-beschrijvingen kort (de lijst met Skills wordt in de prompt ingevoegd).
- Geef de voorkeur aan kleinere modellen voor uitgebreid, verkennend werk.

Zie [Skills](/nl/tools/skills) voor de exacte formule voor de overhead van de lijst met Skills.

## Gerelateerd

- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruik bijhouden](/nl/concepts/usage-tracking)
