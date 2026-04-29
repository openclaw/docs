---
read_when:
    - Tokengebruik, kosten of contextvensters uitleggen
    - Debuggen van contextgroei of Compaction-gedrag
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik + kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-04-29T23:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Tokengebruik en kosten

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen hebben gemiddeld ~4 tekens per token voor Engelse tekst.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke uitvoering zijn eigen systeemprompt samen. Deze bevat:

- Toollijst + korte beschrijvingen
- Skills-lijst (alleen metadata; instructies worden op aanvraag geladen met `read`).
  Het compacte Skills-blok wordt begrensd door `skills.limits.maxSkillsPromptChars`,
  met optionele overschrijving per agent op
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructies voor zelfupdates
- Workspace + bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus `MEMORY.md` wanneer aanwezig). Rootbestand `memory.md` in kleine letters wordt niet geïnjecteerd; het is legacy-reparatie-invoer voor `openclaw doctor --fix` wanneer het is gekoppeld aan `MEMORY.md`. Grote bestanden worden afgekapt door `agents.defaults.bootstrapMaxChars` (standaard: 12000), en totale bootstrapinjectie wordt beperkt door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Dagelijkse bestanden in `memory/*.md` maken geen deel uit van de normale bootstrapprompt; ze blijven op gewone beurten op aanvraag beschikbaar via geheugentools, maar modeluitvoeringen voor reset/opstart kunnen voor die eerste beurt een eenmalig opstartcontextblok met recent dagelijks geheugen toevoegen. Kale chatopdrachten `/new` en `/reset` worden bevestigd zonder het model aan te roepen. De opstartprelude wordt aangestuurd door `agents.defaults.startupContext`.
- Tijd (UTC + tijdzone van de gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtime-metadata (host/OS/model/thinking)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

## Wat meetelt in het contextvenster

Alles wat het model ontvangt, telt mee voor de contextlimiet:

- Systeemprompt (alle hierboven genoemde secties)
- Gespreksgeschiedenis (berichten van gebruiker + assistent)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripties (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en snoei-artefacten
- Providerwrappers of veiligheidsheaders (niet zichtbaar, maar tellen nog steeds mee)

Sommige runtime-intensieve oppervlakken hebben hun eigen expliciete limieten:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overschrijvingen per agent staan onder `agents.list[].contextLimits`. Deze knoppen zijn
bedoeld voor begrensde runtimefragmenten en geïnjecteerde blokken die eigendom zijn van de runtime. Ze staan
los van bootstraplimieten, opstartcontextlimieten en Skills-promptlimieten.

Voor afbeeldingen schaalt OpenClaw transcript-/toolafbeeldingspayloads omlaag vóór provideraanroepen.
Gebruik `agents.defaults.imageMaxDimensionPx` (standaard: `1200`) om dit af te stemmen:

- Lagere waarden verminderen meestal het gebruik van vision-tokens en de payloadgrootte.
- Hogere waarden behouden meer visueel detail voor OCR/UI-zware screenshots.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing (per geïnjecteerd bestand, tools, Skills en grootte van de systeemprompt). Zie [Context](/nl/concepts/context).

## Huidig tokengebruik bekijken

Gebruik deze in chat:

- `/status` → **statuskaart met veel emoji** met het sessiemodel, contextgebruik,
  invoer-/uitvoertokens van het laatste antwoord en **geschatte kosten** (alleen API-sleutel).
- `/usage off|tokens|full` → voegt aan elk antwoord een **gebruiksfooter per antwoord** toe.
  - Blijft per sessie behouden (opgeslagen als `responseUsage`).
  - OAuth-authenticatie **verbergt kosten** (alleen tokens).
- `/usage cost` → toont een lokaal kostenoverzicht uit OpenClaw-sessielogs.

Andere oppervlakken:

- **TUI/Web-TUI:** `/status` + `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde providerquotavensters (`X% left`, geen kosten per antwoord).
  Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.

Gebruiksoppervlakken normaliseren veelvoorkomende provider-native veldaliassen vóór weergave.
Voor OpenAI-familie Responses-verkeer omvat dat zowel `input_tokens` /
`output_tokens` als `prompt_tokens` / `completion_tokens`, zodat transportspecifieke
veldnamen `/status`, `/usage` of sessiesamenvattingen niet veranderen.
Gemini CLI JSON-gebruik wordt ook genormaliseerd: antwoordtekst komt uit `response`, en
`stats.cached` wordt toegewezen aan `cacheRead`, waarbij `stats.input_tokens - stats.cached`
wordt gebruikt wanneer de CLI geen expliciet `stats.input`-veld geeft.
Voor native OpenAI-familie Responses-verkeer worden WebSocket-/SSE-gebruiksaliassen
op dezelfde manier genormaliseerd, en totalen vallen terug op genormaliseerde invoer + uitvoer wanneer
`total_tokens` ontbreekt of `0` is.
Wanneer de huidige sessiesnapshot schaars is, kunnen `/status` en `session_status` ook
token-/cachetellers en het actieve runtime-modellabel herstellen uit het
meest recente gebruikslog in het transcript. Bestaande live waarden groter dan nul krijgen nog steeds
voorrang boven transcriptfallbackwaarden, en grotere promptgerichte
transcripttotalen kunnen winnen wanneer opgeslagen totalen ontbreken of kleiner zijn.
Gebruiksauthenticatie voor providerquotavensters komt uit providerspecifieke hooks wanneer
beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelreferenties
uit auth-profielen, env of configuratie.
Assistenttranscriptvermeldingen behouden dezelfde genormaliseerde gebruiksvorm, inclusief
`usage.cost` wanneer voor het actieve model prijzen zijn geconfigureerd en de provider
gebruiksmetadata retourneert. Dit geeft `/usage cost` en transcriptgebaseerde sessiestatus
een stabiele bron, zelfs nadat de live runtimestatus verdwenen is.

OpenClaw houdt providergebruiksadministratie gescheiden van de huidige contextsnapshot.
Provider `usage.total` kan gecachete invoer, uitvoer en meerdere
modelaanroepen in tool-loops omvatten, dus dit is nuttig voor kosten en telemetrie, maar kan
het live contextvenster overschatten. Contextweergaven en diagnostiek gebruiken de nieuwste promptsnapshot
(`promptTokens`, of de laatste modelaanroep wanneer er geen promptsnapshot
beschikbaar is) voor `context.used`.

## Kostenraming (wanneer getoond)

Kosten worden geschat op basis van je modelprijsconfiguratie:

```
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1M tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, toont OpenClaw alleen tokens. OAuth-tokens
tonen nooit dollarkosten.

Gateway-opstart voert ook een optionele achtergrond-bootstrap voor prijzen uit voor
geconfigureerde modelverwijzingen die nog geen lokale prijzen hebben. Die bootstrap
haalt externe OpenRouter- en LiteLLM-prijscatalogi op. Stel
`models.pricing.enabled: false` in om die catalogusophalingen bij het opstarten over te slaan op offline
of beperkte netwerken; expliciete vermeldingen in `models.providers.*.models[].cost`
blijven lokale kostenramingen aansturen.

## Cache-TTL en impact van snoeien

Providercaching van prompts geldt alleen binnen het cache-TTL-venster. OpenClaw kan
optioneel **cache-TTL-snoeiing** uitvoeren: het snoeit de sessie zodra de cache-TTL
is verlopen en reset daarna het cachevenster, zodat volgende aanvragen de
vers gecachete context kunnen hergebruiken in plaats van de volledige geschiedenis opnieuw te cachen. Dit houdt cache-
schrijfkosten lager wanneer een sessie langer dan de TTL inactief blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en zie de
gedragsdetails in [Sessiesnoeiing](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden over inactieve onderbrekingen heen. Als de cache-TTL van je model
`1h` is, kan het instellen van het Heartbeat-interval net daaronder (bijv. `55m`) voorkomen
dat de volledige prompt opnieuw wordt gecachet, waardoor cache-schrijfkosten afnemen.

In multi-agentopstellingen kun je één gedeelde modelconfiguratie behouden en cachegedrag
per agent afstemmen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige knop-voor-knopgids.

Voor Anthropic API-prijzen zijn cachelezingen aanzienlijk goedkoper dan invoer-
tokens, terwijl cacheschrijvingen met een hogere multiplier worden gefactureerd. Zie de
promptcachingprijzen van Anthropic voor de nieuwste tarieven en TTL-multipliers:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Voorbeeld: 1h-cache warm houden met Heartbeat

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

`agents.list[].params` wordt bovenop de `params` van het geselecteerde model samengevoegd, zodat je
alleen `cacheRetention` kunt overschrijven en andere modelstandaarden ongewijzigd kunt erven.

### Voorbeeld: Anthropic 1M-contextbetaheader inschakelen

Anthropic's 1M-contextvenster wordt momenteel achter een betaflag geleverd. OpenClaw kan de
vereiste `anthropic-beta`-waarde injecteren wanneer je `context1m` inschakelt op ondersteunde Opus-
of Sonnet-modellen.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dit wordt toegewezen aan Anthropic's `context-1m-2025-08-07`-betaheader.

Dit geldt alleen wanneer `context1m: true` op die modelvermelding is ingesteld.

Vereiste: de referentie moet in aanmerking komen voor gebruik met lange context. Zo niet,
dan antwoordt Anthropic met een provider-side rate limit-fout voor die aanvraag.

Als je Anthropic authenticeert met OAuth-/abonnementstokens (`sk-ant-oat-*`),
slaat OpenClaw de `context-1m-*`-betaheader over omdat Anthropic die combinatie momenteel
weigert met HTTP 401.

## Tips om tokendruk te verminderen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote tooluitvoer in je workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor sessies met veel screenshots.
- Houd Skills-beschrijvingen kort (de Skills-lijst wordt in de prompt geïnjecteerd).
- Geef de voorkeur aan kleinere modellen voor uitgebreid, verkennend werk.

Zie [Skills](/nl/tools/skills) voor de exacte overheadformule van de Skills-lijst.

## Gerelateerd

- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruikstracking](/nl/concepts/usage-tracking)
