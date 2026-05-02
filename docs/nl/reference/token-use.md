---
read_when:
    - Uitleg over tokengebruik, kosten of contextvensters
    - Debuggen van contextgroei of Compaction-gedrag
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik + kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-05-02T11:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Tokengebruik en kosten

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen gebruiken gemiddeld ~4 tekens per token voor Engelse tekst.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke uitvoering zijn eigen systeemprompt samen. Deze bevat:

- Toollijst + korte beschrijvingen
- Skills-lijst (alleen metadata; instructies worden op aanvraag geladen met `read`).
  Het compacte Skills-blok wordt begrensd door `skills.limits.maxSkillsPromptChars`,
  met optionele overschrijving per agent via
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Zelfupdate-instructies
- Werkruimte + bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus `MEMORY.md` wanneer aanwezig). De root `memory.md` in kleine letters wordt niet geïnjecteerd; het is legacy-reparatie-invoer voor `openclaw doctor --fix` wanneer gekoppeld aan `MEMORY.md`. Grote bestanden worden afgekapt door `agents.defaults.bootstrapMaxChars` (standaard: 12000), en de totale bootstrapinjectie is begrensd door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Dagelijkse bestanden in `memory/*.md` maken geen deel uit van de normale bootstrapprompt; ze blijven bij gewone beurten op aanvraag beschikbaar via geheugentools, maar reset-/opstartmodeluitvoeringen kunnen voor die eerste beurt een eenmalig opstartcontextblok met recent dagelijks geheugen vooraf invoegen. Kale chatcommando's `/new` en `/reset` worden bevestigd zonder het model aan te roepen. De opstartprelude wordt beheerd door `agents.defaults.startupContext`.
- Tijd (UTC + tijdzone van de gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtimemetadata (host/OS/model/thinking)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

## Wat meetelt in het contextvenster

Alles wat het model ontvangt, telt mee voor de contextlimiet:

- Systeemprompt (alle hierboven genoemde secties)
- Gespreksgeschiedenis (berichten van gebruiker + assistent)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripten (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en pruning-artefacten
- Providerwrappers of veiligheidsheaders (niet zichtbaar, maar tellen nog steeds mee)

Sommige runtime-zware oppervlakken hebben hun eigen expliciete limieten:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overschrijvingen per agent staan onder `agents.list[].contextLimits`. Deze knoppen zijn
bedoeld voor begrensde runtimefragmenten en geïnjecteerde runtime-eigen blokken. Ze staan
los van bootstraplimieten, opstartcontextlimieten en limieten voor de Skills-prompt.

Voor afbeeldingen schaalt OpenClaw transcript-/toolafbeeldingspayloads omlaag vóór provideraanroepen.
Gebruik `agents.defaults.imageMaxDimensionPx` (standaard: `1200`) om dit af te stemmen:

- Lagere waarden verminderen meestal het gebruik van vision-tokens en de payloadgrootte.
- Hogere waarden behouden meer visuele details voor OCR/UI-zware screenshots.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing (per geïnjecteerd bestand, tools, Skills en grootte van de systeemprompt). Zie [Context](/nl/concepts/context).

## Huidig tokengebruik bekijken

Gebruik deze in chat:

- `/status` → **statuskaart met veel emoji's** met het sessiemodel, contextgebruik,
  invoer-/uitvoertokens van het laatste antwoord en **geschatte kosten** (alleen API-sleutel).
- `/usage off|tokens|full` → voegt aan elk antwoord een **gebruiksvoetregel per antwoord** toe.
  - Blijft per sessie behouden (opgeslagen als `responseUsage`).
  - OAuth-authenticatie **verbergt kosten** (alleen tokens).
- `/usage cost` → toont een lokale kostenoverzicht uit OpenClaw-sessielogs.

Andere oppervlakken:

- **TUI/Web TUI:** `/status` + `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde providerquotavensters (`X% left`, geen kosten per antwoord).
  Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.

Gebruiksoppervlakken normaliseren algemene provider-native veldaliassen vóór weergave.
Voor OpenAI-family Responses-verkeer omvat dat zowel `input_tokens` /
`output_tokens` als `prompt_tokens` / `completion_tokens`, zodat transportspecifieke
veldnamen `/status`, `/usage` of sessiesamenvattingen niet wijzigen.
Gemini CLI JSON-gebruik wordt ook genormaliseerd: antwoordtekst komt uit `response`, en
`stats.cached` wordt gekoppeld aan `cacheRead`, met `stats.input_tokens - stats.cached`
wanneer de CLI geen expliciet `stats.input`-veld opgeeft.
Voor native OpenAI-family Responses-verkeer worden WebSocket/SSE-gebruikaliassen
op dezelfde manier genormaliseerd, en totalen vallen terug op genormaliseerde invoer + uitvoer wanneer
`total_tokens` ontbreekt of `0` is.
Wanneer de huidige sessiesnapshot schaars is, kunnen `/status` en `session_status` ook
token-/cachetellers en het actieve runtimemodellabel herstellen uit het
meest recente transcriptgebruikslog. Bestaande niet-nul livewaarden krijgen nog steeds
voorrang boven transcript-fallbackwaarden, en grotere promptgerichte
transcripttotalen kunnen winnen wanneer opgeslagen totalen ontbreken of kleiner zijn.
Gebruiksauthenticatie voor providerquotavensters komt waar beschikbaar uit providerspecifieke hooks;
anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelcredentials
uit auth-profielen, env of config.
Assistenttranscriptitems bewaren dezelfde genormaliseerde gebruiksvorm, inclusief
`usage.cost` wanneer voor het actieve model prijzen zijn geconfigureerd en de provider
gebruiksmetadata retourneert. Dit geeft `/usage cost` en transcriptgebaseerde sessiestatus
een stabiele bron, zelfs nadat de live runtimestatus verdwenen is.

OpenClaw houdt providergebruiksboekhouding gescheiden van de huidige contextsnapshot.
Provider `usage.total` kan gecachte invoer, uitvoer en meerdere
modelaanroepen in tool-loops omvatten, dus het is nuttig voor kosten en telemetrie maar kan
het live contextvenster overschatten. Contextweergaven en diagnostiek gebruiken de nieuwste promptsnapshot
(`promptTokens`, of de laatste modelaanroep wanneer geen promptsnapshot
beschikbaar is) voor `context.used`.

## Kostenraming (wanneer getoond)

Kosten worden geraamd op basis van je modelprijsconfiguratie:

```
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1M tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, toont OpenClaw alleen tokens. OAuth-tokens
tonen nooit dollarkosten.

Nadat sidecars en kanalen het Gateway-ready-pad bereiken, start OpenClaw een
optionele achtergrond-bootstrap voor prijzen voor geconfigureerde modelrefs die nog geen
lokale prijzen hebben. Die bootstrap haalt externe prijscatalogi van OpenRouter en LiteLLM op.
Stel `models.pricing.enabled: false` in om die catalogusophalingen over te slaan
op offline of beperkte netwerken; expliciete
`models.providers.*.models[].cost`-items blijven lokale kostenramingen aansturen.

## Cache-TTL en impact van pruning

Providerpromptcaching geldt alleen binnen het cache-TTL-venster. OpenClaw kan
optioneel **cache-TTL-pruning** uitvoeren: het snoeit de sessie zodra de cache-TTL
is verlopen en reset daarna het cachevenster zodat volgende verzoeken de
nieuw gecachte context opnieuw kunnen gebruiken in plaats van de volledige geschiedenis opnieuw te cachen. Dit houdt cache-
schrijfkosten lager wanneer een sessie langer dan de TTL inactief blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en zie de
gedragsdetails in [Sessiesnoeiing](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden tijdens inactieve intervallen. Als de cache-TTL van je model
`1h` is, kan het instellen van het heartbeatinterval net daaronder (bijv. `55m`) voorkomen
dat de volledige prompt opnieuw wordt gecachet, waardoor cache-schrijfkosten dalen.

In setups met meerdere agents kun je één gedeelde modelconfiguratie houden en cachegedrag
per agent afstemmen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige knop-voor-knop-handleiding.

Voor Anthropic API-prijzen zijn cachelezingen aanzienlijk goedkoper dan invoer-
tokens, terwijl cacheschrijvingen met een hogere multiplier worden gefactureerd. Zie de
promptcachingprijzen van Anthropic voor de nieuwste tarieven en TTL-multipliers:
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

`agents.list[].params` wordt samengevoegd boven op de `params` van het geselecteerde model, zodat je
alleen `cacheRetention` kunt overschrijven en andere modelstandaarden ongewijzigd overerft.

### Voorbeeld: Anthropic 1M-context-bètaheader inschakelen

Anthropic's 1M-contextvenster is momenteel bèta-afgeschermd. OpenClaw kan de
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

Dit wordt gekoppeld aan Anthropic's `context-1m-2025-08-07`-bètaheader.

Dit is alleen van toepassing wanneer `context1m: true` is ingesteld voor dat modelitem.

Vereiste: de credential moet in aanmerking komen voor gebruik van lange context. Zo niet,
reageert Anthropic met een providerzijdige rate-limit-fout voor dat verzoek.

Als je Anthropic authenticeert met OAuth-/abonnementstokens (`sk-ant-oat-*`),
slaat OpenClaw de `context-1m-*`-bètaheader over, omdat Anthropic die combinatie momenteel
weigert met HTTP 401.

## Tips om tokendruk te verminderen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote tooluitvoer in je workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor sessies met veel screenshots.
- Houd Skill-beschrijvingen kort (de Skill-lijst wordt in de prompt geïnjecteerd).
- Geef de voorkeur aan kleinere modellen voor uitvoerig, verkennend werk.

Zie [Skills](/nl/tools/skills) voor de exacte overheadformule van de Skill-lijst.

## Gerelateerd

- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruikstracking](/nl/concepts/usage-tracking)
