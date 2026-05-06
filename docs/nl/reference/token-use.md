---
read_when:
    - Uitleg over tokengebruik, kosten of contextvensters
    - Contextgroei of Compaction-gedrag debuggen
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik + kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-05-06T09:31:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen gebruiken gemiddeld ~4 tekens per token voor Engelse tekst.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke run zijn eigen systeemprompt samen. Deze bevat:

- Toollijst + korte beschrijvingen
- Skills-lijst (alleen metadata; instructies worden op aanvraag geladen met `read`).
  Het compacte Skills-blok wordt begrensd door `skills.limits.maxSkillsPromptChars`,
  met optionele override per agent op
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructies voor zelfupdates
- Workspace + bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus `MEMORY.md` wanneer aanwezig). Rootbestand `memory.md` in kleine letters wordt niet geïnjecteerd; het is legacy-reparatie-invoer voor `openclaw doctor --fix` wanneer het samen met `MEMORY.md` voorkomt. Grote bestanden worden ingekort door `agents.defaults.bootstrapMaxChars` (standaard: 12000), en de totale bootstrapinjectie wordt begrensd door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Dagelijkse bestanden in `memory/*.md` maken geen deel uit van de normale bootstrapprompt; ze blijven op gewone beurten op aanvraag beschikbaar via geheugentools, maar modelruns voor reset/opstarten kunnen voor die eerste beurt een eenmalig startup-contextblok met recente dagelijkse herinneringen vooraf laten gaan. Kale chatcommando's `/new` en `/reset` worden bevestigd zonder het model aan te roepen. De opstartprelude wordt beheerd door `agents.defaults.startupContext`.
- Tijd (UTC + tijdzone van gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtime-metadata (host/OS/model/thinking)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

## Wat meetelt in het contextvenster

Alles wat het model ontvangt, telt mee voor de contextlimiet:

- Systeemprompt (alle hierboven genoemde secties)
- Gespreksgeschiedenis (gebruikers- + assistentberichten)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripten (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en snoei-artefacten
- Providerwrappers of veiligheidsheaders (niet zichtbaar, maar tellen nog steeds mee)

Sommige runtime-intensieve oppervlakken hebben hun eigen expliciete limieten:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overrides per agent staan onder `agents.list[].contextLimits`. Deze knoppen zijn
voor begrensde runtimefragmenten en geïnjecteerde blokken die eigendom zijn van
de runtime. Ze staan los van bootstraplimieten, startup-contextlimieten en
Skills-promptlimieten.

Voor afbeeldingen schaalt OpenClaw transcript-/tool-afbeeldingspayloads omlaag vóór provideraanroepen.
Gebruik `agents.defaults.imageMaxDimensionPx` (standaard: `1200`) om dit af te stemmen:

- Lagere waarden verminderen meestal het gebruik van vision-tokens en de payloadgrootte.
- Hogere waarden behouden meer visuele details voor OCR/UI-intensieve screenshots.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing (per geïnjecteerd bestand, tools, Skills en grootte van de systeemprompt). Zie [Context](/nl/concepts/context).

## Huidig tokengebruik bekijken

Gebruik deze in de chat:

- `/status` → **statuskaart met veel emoji** met het sessiemodel, contextgebruik,
  tokens voor invoer/uitvoer van het laatste antwoord en **geschatte kosten** (alleen API-sleutel).
- `/usage off|tokens|full` → voegt aan elk antwoord een **gebruiksfooter per antwoord** toe.
  - Blijft per sessie bewaard (opgeslagen als `responseUsage`).
  - OAuth-authenticatie **verbergt kosten** (alleen tokens).
- `/usage cost` → toont een lokaal kostenoverzicht uit OpenClaw-sessielogs.

Andere oppervlakken:

- **TUI/Web TUI:** `/status` + `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde quotavensters van providers (`X% left`, geen kosten per antwoord).
  Huidige providers met gebruiksvenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.

Gebruiksoppervlakken normaliseren gangbare provider-native veldaliassen vóór weergave.
Voor OpenAI-familie Responses-verkeer omvat dat zowel `input_tokens` /
`output_tokens` als `prompt_tokens` / `completion_tokens`, zodat transportspecifieke
veldnamen `/status`, `/usage` of sessiesamenvattingen niet veranderen.
Gemini CLI JSON-gebruik wordt ook genormaliseerd: antwoordtekst komt uit `response`, en
`stats.cached` wordt gekoppeld aan `cacheRead`, waarbij `stats.input_tokens - stats.cached`
wordt gebruikt wanneer de CLI geen expliciet veld `stats.input` opgeeft.
Voor native OpenAI-familie Responses-verkeer worden WebSocket/SSE-gebruiksaliassen
op dezelfde manier genormaliseerd, en totalen vallen terug op genormaliseerde invoer + uitvoer wanneer
`total_tokens` ontbreekt of `0` is.
Wanneer de huidige sessiesnapshot schaars is, kunnen `/status` en `session_status` ook
token-/cachetellers en het actieve runtime-modellabel herstellen uit de
meest recente gebruikslog in het transcript. Bestaande niet-nul livewaarden blijven
voorrang houden op transcriptfallbackwaarden, en grotere promptgerichte
transcripttotalen kunnen winnen wanneer opgeslagen totalen ontbreken of kleiner zijn.
Gebruiksauthenticatie voor providerquotavensters komt uit providerspecifieke hooks wanneer
beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelreferenties
uit auth-profielen, env of configuratie.
Assistenttranscriptvermeldingen bewaren dezelfde genormaliseerde gebruiksvorm, inclusief
`usage.cost` wanneer voor het actieve model prijzen zijn geconfigureerd en de provider
gebruiksmetadata terugstuurt. Dit geeft `/usage cost` en transcript-onderbouwde sessiestatus
een stabiele bron, zelfs nadat de live runtime-status verdwenen is.

OpenClaw houdt providergebruiksboekhouding gescheiden van de huidige contextsnapshot.
Provider `usage.total` kan gecachte invoer, uitvoer en meerdere
modelaanroepen in tool-loops omvatten, waardoor het nuttig is voor kosten en telemetrie maar het
live contextvenster kan overschatten. Contextweergaven en diagnostiek gebruiken de nieuwste promptsnapshot
(`promptTokens`, of de laatste modelaanroep wanneer geen promptsnapshot
beschikbaar is) voor `context.used`.

## Kostenschatting (wanneer getoond)

Kosten worden geschat op basis van je modelprijsconfiguratie:

```
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1M tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, toont OpenClaw alleen tokens. OAuth-tokens
tonen nooit dollarkosten.

Nadat sidecars en kanalen het Gateway-ready-pad bereiken, start OpenClaw een
optionele bootstrap op de achtergrond voor prijzen voor geconfigureerde modelrefs die nog
geen lokale prijzen hebben. Die bootstrap haalt externe OpenRouter- en LiteLLM-
prijscatalogi op. Stel `models.pricing.enabled: false` in om die catalogusophalingen
over te slaan op offline of beperkte netwerken; expliciete
`models.providers.*.models[].cost`-vermeldingen blijven lokale kostenschattingen
aansturen.

## Cache-TTL en snoei-impact

Promptcaching van providers geldt alleen binnen het cache-TTL-venster. OpenClaw kan
optioneel **cache-TTL-snoei** uitvoeren: het snoeit de sessie zodra de cache-TTL
is verlopen, en reset daarna het cachevenster zodat latere verzoeken de
nieuw gecachte context opnieuw kunnen gebruiken in plaats van de volledige geschiedenis opnieuw te cachen. Dit houdt
cache-schrijvingskosten lager wanneer een sessie langer dan de TTL inactief blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en bekijk de
gedragsdetails in [Sessiesnoei](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden tijdens inactieve gaten. Als de cache-TTL van je model
`1h` is, kan het instellen van het Heartbeat-interval net daaronder (bijv. `55m`) voorkomen
dat de volledige prompt opnieuw wordt gecachet, waardoor cache-schrijvingskosten dalen.

In multi-agentopstellingen kun je één gedeelde modelconfiguratie behouden en cachegedrag
per agent afstemmen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige knop-voor-knop gids.

Voor Anthropic API-prijzen zijn cachelezingen aanzienlijk goedkoper dan invoer-
tokens, terwijl cacheschrijvingen met een hogere vermenigvuldigingsfactor worden gefactureerd. Zie Anthropic's
prijzen voor promptcaching voor de nieuwste tarieven en TTL-vermenigvuldigingsfactoren:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Voorbeeld: houd 1u-cache warm met Heartbeat

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

`agents.list[].params` wordt boven op de `params` van het geselecteerde model samengevoegd, zodat je
alleen `cacheRetention` kunt overschrijven en andere modelstandaarden ongewijzigd erft.

### Voorbeeld: schakel Anthropic 1M-context betaheader in

Anthropic's 1M-contextvenster is momenteel beta-afgeschermd. OpenClaw kan de
vereiste waarde voor `anthropic-beta` injecteren wanneer je `context1m` inschakelt op ondersteunde Opus-
of Sonnet-modellen.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dit wordt gekoppeld aan Anthropic's betaheader `context-1m-2025-08-07`.

Dit geldt alleen wanneer `context1m: true` is ingesteld op die modelvermelding.

Vereiste: de referentie moet in aanmerking komen voor long-context-gebruik. Zo niet,
dan reageert Anthropic met een provider-side rate-limitfout voor dat verzoek.

Als je Anthropic authenticeert met OAuth-/abonnementstokens (`sk-ant-oat-*`),
slaat OpenClaw de betaheader `context-1m-*` over, omdat Anthropic die combinatie momenteel
weigert met HTTP 401.

## Tips om tokendruk te verminderen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote tooluitvoer in je workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor screenshot-intensieve sessies.
- Houd Skills-beschrijvingen kort (de Skills-lijst wordt in de prompt geïnjecteerd).
- Geef de voorkeur aan kleinere modellen voor uitgebreid, verkennend werk.

Zie [Skills](/nl/tools/skills) voor de exacte formule voor overhead van de Skills-lijst.

## Gerelateerd

- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruiksregistratie](/nl/concepts/usage-tracking)
