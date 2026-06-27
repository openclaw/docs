---
read_when:
    - Tokengebruik, kosten of contextvensters uitleggen
    - Contextgroei of Compaction-gedrag debuggen
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik + kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-06-27T18:20:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen gebruiken gemiddeld ~4 tekens per token voor Engelse tekst.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke run zijn eigen systeemprompt samen. Deze bevat:

- Toollijst + korte beschrijvingen
- Skills-lijst (alleen metadata; instructies worden op aanvraag geladen met `read`).
  Native Codex-beurten ontvangen het compacte Skills-blok als ontwikkelaarsinstructies
  voor samenwerking binnen de beurt; andere harnassen ontvangen het in het normale
  promptoppervlak. Het wordt begrensd door `skills.limits.maxSkillsPromptChars`, met
  een optionele override per agent op `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Zelf-update-instructies
- Werkruimte + bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus `MEMORY.md` wanneer aanwezig). Native Codex-beurten plakken geen ruwe `MEMORY.md` uit de geconfigureerde agentwerkruimte wanneer geheugentools beschikbaar zijn voor die werkruimte; ze nemen een kleine geheugenverwijzing op in ontwikkelaarsinstructies voor samenwerking binnen de beurt en gebruiken geheugentools op aanvraag. Als tools zijn uitgeschakeld, zoeken in geheugen niet beschikbaar is, of de actieve werkruimte verschilt van de agentgeheugenwerkruimte, gebruikt `MEMORY.md` het normale begrensde beurtcontextpad. `memory.md` met kleine letters in de root wordt niet geïnjecteerd; het is legacy-reparatie-invoer voor `openclaw doctor --fix` wanneer gekoppeld aan `MEMORY.md`. Grote geïnjecteerde bestanden worden afgekapt door `agents.defaults.bootstrapMaxChars` (standaard: 20000), en de totale bootstrapinjectie wordt afgetopt door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Dagelijkse bestanden in `memory/*.md` maken geen deel uit van de normale bootstrapprompt; ze blijven op gewone beurten op aanvraag beschikbaar via geheugentools, maar modelruns voor reset/opstart kunnen voor die eerste beurt een eenmalig opstartcontextblok met recent dagelijks geheugen vooraf toevoegen. Kale chatcommando's `/new` en `/reset` worden bevestigd zonder het model aan te roepen. De opstartprelude wordt beheerd door `agents.defaults.startupContext`. AGENTS.md-fragmenten na Compaction staan los en vereisen expliciete opt-in via `agents.defaults.compaction.postCompactionSections`.
- Tijd (UTC + tijdzone van de gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtimemetadata (host/OS/model/denkmodus)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

Gebruik bij het documenteren van inloggegevens of auth-fragmenten de
[Conventies voor geheime placeholders](/nl/reference/secret-placeholder-conventions) om
false positives van geheimescanners in wijzigingen die alleen docs raken te voorkomen.

## Wat meetelt in het contextvenster

Alles wat het model ontvangt telt mee voor de contextlimiet:

- Systeemprompt (alle hierboven genoemde secties)
- Gespreksgeschiedenis (gebruikers- + assistentberichten)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripten (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en snoeiartefacten
- Providerwrappers of veiligheidsheaders (niet zichtbaar, maar tellen nog steeds mee)

Sommige runtime-intensieve oppervlakken hebben hun eigen expliciete limieten:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overrides per agent staan onder `agents.list[].contextLimits`. Deze knoppen zijn
voor begrensde runtimefragmenten en geïnjecteerde blokken die eigendom zijn van de runtime. Ze staan
los van bootstraplimieten, opstartcontextlimieten en limieten voor de Skills-prompt.

`toolResultMaxChars` is een geavanceerde bovengrens (tot `1000000` tekens). Wanneer deze niet is ingesteld, kiest OpenClaw
de live limiet voor toolresultaten op basis van het effectieve modelcontextvenster: `16000` tekens
onder 100K tokens, `32000` tekens bij 100K+ tokens, en `64000` tekens bij 200K+
tokens, nog steeds begrensd door de runtimebewaking voor contextaandeel.

Voor afbeeldingen verkleint OpenClaw transcript-/toolafbeeldingspayloads voordat provideroproepen worden gedaan.
Gebruik `agents.defaults.imageMaxDimensionPx` (standaard: `1200`) om dit af te stemmen:

- Lagere waarden verminderen doorgaans het gebruik van vision-tokens en de payloadgrootte.
- Hogere waarden behouden meer visueel detail voor OCR/UI-intensieve screenshots.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing (per geïnjecteerd bestand, tools, Skills en systeempromptgrootte). Zie [Context](/nl/concepts/context).

## Huidig tokengebruik bekijken

Gebruik deze in chat:

- `/status` → **statuskaart met veel emoji** met het sessiemodel, contextgebruik,
  invoer-/uitvoertokens van de laatste reactie, en **geschatte kosten** wanneer lokale prijzen zijn
  geconfigureerd voor het actieve model.
- `/usage off|tokens|full` → voegt een **gebruiksvoettekst per reactie** toe aan elk antwoord.
  - Blijft per sessie behouden (opgeslagen als `responseUsage`).
  - `/usage reset` (aliassen: `inherit`, `clear`, `default`) — wist de sessieoverride
    zodat de sessie opnieuw de geconfigureerde standaard erft.
  - `/usage full` toont geschatte kosten alleen wanneer OpenClaw gebruiksmetadata en
    lokale prijzen voor het actieve model heeft. Anders worden alleen tokens getoond.
- `/usage cost` → toont een lokale kostensamenvatting uit OpenClaw-sessielogs.

Andere oppervlakken:

- **TUI/Web TUI:** `/status` + `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde providerquotavensters (`X% left`, geen kosten per reactie).
  Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.

Gebruiksoppervlakken normaliseren gangbare provider-native veldaliassen vóór weergave.
Voor Responses-verkeer uit de OpenAI-familie omvat dat zowel `input_tokens` /
`output_tokens` als `prompt_tokens` / `completion_tokens`, zodat transportspecifieke
veldnamen `/status`, `/usage` of sessiesamenvattingen niet veranderen.
Gemini CLI-gebruik wordt ook genormaliseerd: de standaard `stream-json`-parser leest
assistent-`message`-events, en `stats.cached` wordt gemapt naar `cacheRead`, waarbij
`stats.input_tokens - stats.cached` wordt gebruikt wanneer de CLI geen expliciet
`stats.input`-veld opgeeft. Legacy JSON-overrides lezen antwoordtekst nog steeds uit
`response`.
Voor native Responses-verkeer uit de OpenAI-familie worden WebSocket/SSE-gebruiksaliassen
op dezelfde manier genormaliseerd, en totalen vallen terug op genormaliseerde invoer + uitvoer wanneer
`total_tokens` ontbreekt of `0` is.
Wanneer de huidige sessiesnapshot schaars is, kunnen `/status` en `session_status` ook
token-/cachetellers en het actieve runtimemodellabel herstellen uit het meest recente
transcriptgebruikslog. Bestaande niet-nul live waarden hebben nog steeds voorrang
op transcriptfallbackwaarden, en grotere promptgerichte transcripttotalen kunnen winnen
wanneer opgeslagen totalen ontbreken of kleiner zijn.
Gebruiksauth voor providerquotavensters komt uit providerspecifieke hooks wanneer
beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelgegevens
uit auth-profielen, env of configuratie.
Assistenttranscriptitems bewaren dezelfde genormaliseerde gebruiksvorm, inclusief
`usage.cost` wanneer voor het actieve model prijzen zijn geconfigureerd en de provider
gebruiksmetadata retourneert. Dit geeft `/usage cost` en transcriptgebaseerde sessiestatus
een stabiele bron, zelfs nadat de live runtimestatus verdwenen is.

OpenClaw houdt providergebruiksboekhouding gescheiden van de huidige contextsnapshot.
Provider `usage.total` kan gecachte invoer, uitvoer en meerdere modelaanroepen in de
toollus omvatten, dus dit is nuttig voor kosten en telemetrie maar kan het live
contextvenster overschatten. Contextweergaven en diagnostiek gebruiken de nieuwste
promptsnapshot (`promptTokens`, of de laatste modelaanroep wanneer geen promptsnapshot
beschikbaar is) voor `context.used`.

## Kostenraming (wanneer getoond)

Kosten worden geschat op basis van je modelprijsconfiguratie:

```
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1M tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, toont OpenClaw alleen tokens. Kostenweergave is
niet beperkt tot API-sleutelauth: providers zonder API-sleutel zoals `aws-sdk` kunnen
geschatte kosten tonen wanneer hun geconfigureerde modelitem lokale prijzen bevat en de
provider gebruiksmetadata retourneert.

Nadat sidecars en kanalen het Gateway-ready-pad bereiken, start OpenClaw een
optionele bootstrap voor prijzen op de achtergrond voor geconfigureerde modelrefs die nog
geen lokale prijzen hebben. Die bootstrap haalt externe OpenRouter- en LiteLLM-
prijscatalogi op. Stel `models.pricing.enabled: false` in om die catalogusfetches
over te slaan op offline of beperkte netwerken; expliciete
`models.providers.*.models[].cost`-items blijven lokale kostenramingen aansturen.

## Cache-TTL en impact van snoeien

Providercaching van prompts is alleen van toepassing binnen het cache-TTL-venster. OpenClaw kan
optioneel **cache-TTL-snoeiing** uitvoeren: het snoeit de sessie zodra de cache-TTL
is verlopen en reset daarna het cachevenster zodat volgende requests de
nieuw gecachte context opnieuw kunnen gebruiken in plaats van de volledige geschiedenis opnieuw te cachen. Dit houdt
cache-schrijftkosten lager wanneer een sessie langer dan de TTL inactief blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en zie de
gedragsdetails in [Sessiesnoeiing](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden tijdens inactieve intervallen. Als de cache-TTL van je model
`1h` is, kan het instellen van het Heartbeat-interval net daaronder (bijv. `55m`) voorkomen
dat de volledige prompt opnieuw wordt gecachet, waardoor cache-schrijftkosten dalen.

In multi-agentopstellingen kun je één gedeelde modelconfiguratie behouden en cachegedrag
per agent afstemmen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige gids per knop.

Voor Anthropic API-prijzen zijn cachelezingen aanzienlijk goedkoper dan invoer-
tokens, terwijl cacheschrijfbewerkingen met een hogere multiplier worden gefactureerd. Zie Anthropic's
promptcachingprijzen voor de nieuwste tarieven en TTL-multipliers:
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

`agents.list[].params` wordt boven op de `params` van het geselecteerde model samengevoegd, zodat je
alleen `cacheRetention` kunt overriden en andere modelstandaarden ongewijzigd erft.

### Anthropic 1M-context

OpenClaw dimensioneert GA-geschikte Claude 4.x-modellen zoals Opus 4.8, Opus 4.7, Opus 4.6 en
Sonnet 4.6 met Anthropic's 1M-contextvenster. Je hebt
`params.context1m: true` niet nodig voor die modellen.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Oudere configuraties kunnen `context1m: true` behouden, maar OpenClaw verzendt
Anthropic's ingetrokken `context-1m-2025-08-07`-betaheader niet langer voor deze instelling en
breidt niet-ondersteunde oudere Claude-modellen niet uit naar 1M.

Vereiste: de inloggegevens moeten in aanmerking komen voor gebruik met lange context. Zo niet,
dan reageert Anthropic met een providerspecifieke rate-limitfout voor dat request.

Als je bij Anthropic authenticeert met OAuth-/abonnementstokens (`sk-ant-oat-*`),
behoudt OpenClaw de door OAuth vereiste Anthropic-betaheaders terwijl de
ingetrokken `context-1m-*`-beta wordt verwijderd als die nog in oudere configuratie staat.

## Tips om tokendruk te verminderen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote tooluitvoer in je workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor sessies met veel screenshots.
- Houd Skills-beschrijvingen kort (de Skills-lijst wordt in de prompt geïnjecteerd).
- Geef de voorkeur aan kleinere modellen voor uitgebreid, verkennend werk.

Zie [Skills](/nl/tools/skills) voor de exacte formule voor overhead van de Skills-lijst.

## Gerelateerd

- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruiksregistratie](/nl/concepts/usage-tracking)
