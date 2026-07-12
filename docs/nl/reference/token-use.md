---
read_when:
    - Uitleg over tokengebruik, kosten of contextvensters
    - Contextgroei of Compaction-gedrag debuggen
summary: Hoe OpenClaw promptcontext opbouwt en tokengebruik en kosten rapporteert
title: Tokengebruik en kosten
x-i18n:
    generated_at: "2026-07-12T09:23:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw houdt **tokens** bij, geen tekens. Tokens zijn modelspecifiek, maar de meeste
OpenAI-achtige modellen gebruiken voor Engelse tekst gemiddeld ~4 tekens per token.

## Hoe de systeemprompt wordt opgebouwd

OpenClaw stelt bij elke uitvoering een eigen systeemprompt samen. Deze bevat:

- Lijst met tools + korte beschrijvingen
- Lijst met Skills (alleen metadata; instructies worden op aanvraag geladen met `read`). Native
  Codex-beurten krijgen het compacte Skills-blok als samenwerkingsinstructies
  voor de ontwikkelaar die alleen voor die beurt gelden; andere harnesses krijgen het in het normale promptoppervlak.
  Begrensd door `skills.limits.maxSkillsPromptChars`, met een optionele overschrijving per agent
  via `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructies voor zelfupdates
- Werkruimte- en bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` wanneer nieuw, plus
  `MEMORY.md` wanneer aanwezig). Grote geïnjecteerde bestanden worden afgekapt op basis van
  `agents.defaults.bootstrapMaxChars` (standaard: `20000`); de totale bootstrapinjectie
  wordt begrensd door `agents.defaults.bootstrapTotalMaxChars` (standaard:
  `60000`).
  - Native Codex-beurten voegen geen onbewerkte `MEMORY.md` toe wanneer geheugentools
    voor die werkruimte beschikbaar zijn; in plaats daarvan krijgen ze een kleine geheugenverwijzing in
    samenwerkingsinstructies voor de ontwikkelaar die alleen voor die beurt gelden en gebruiken ze geheugentools
    op aanvraag. Als tools zijn uitgeschakeld, zoeken in het geheugen niet beschikbaar is of
    de actieve werkruimte afwijkt van de geheugenwerkruimte van de agent, valt `MEMORY.md`
    terug op het normale begrensde pad voor beurtcontext.
  - `memory.md` met kleine letters in de hoofdmap wordt nooit geïnjecteerd. Dit is verouderde reparatie-invoer
    voor `openclaw doctor --fix`, waarmee deze naar `MEMORY.md` wordt gemigreerd.
  - Dagelijkse bestanden in `memory/*.md` maken geen deel uit van de normale bootstrapprompt;
    ze blijven tijdens gewone beurten op aanvraag beschikbaar via geheugentools. Modeluitvoeringen
    voor resetten/opstarten kunnen voor die eerste beurt een eenmalig opstartcontextblok met recent
    dagelijks geheugen vooraan toevoegen, aangestuurd door
    `agents.defaults.startupContext`. Kale chatopdrachten `/new` en `/reset` worden
    bevestigd zonder het model aan te roepen.
  - Fragmenten van `AGENTS.md` na Compaction zijn afzonderlijk en vereisen expliciete
    inschakeling via `agents.defaults.compaction.postCompactionSections`.
- Tijd (UTC + tijdzone van gebruiker)
- Antwoordtags + Heartbeat-gedrag
- Runtime-metadata (host/besturingssysteem/model/denkwijze)

Zie de volledige uitsplitsing in [Systeemprompt](/nl/concepts/system-prompt).

Gebruik bij het documenteren van aanmeldgegevens of authenticatiefragmenten de
[Conventies voor placeholders voor geheimen](/nl/reference/secret-placeholder-conventions) om
fout-positieve detecties door geheimmenscanners bij uitsluitend documentatiewijzigingen te voorkomen.

## Wat meetelt in het contextvenster

Alles wat het model ontvangt, telt mee voor de contextlimiet:

- Systeemprompt (alle bovenstaande onderdelen)
- Gespreksgeschiedenis (berichten van gebruiker + assistent)
- Toolaanroepen en toolresultaten
- Bijlagen/transcripties (afbeeldingen, audio, bestanden)
- Compaction-samenvattingen en opschoningsartefacten
- Providerwrappers of veiligheidsheaders (niet zichtbaar, maar tellen wel mee)

Runtime-intensieve oppervlakken hebben hun eigen expliciete limieten onder
`agents.defaults.contextLimits` (overschrijvingen per agent onder
`agents.list[].contextLimits`):

| Sleutel                   | Doel                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`       | Maximaal aantal tekens dat `memory_get` retourneert vóór afkapping.      |
| `memoryGetDefaultLines`   | Standaardregelvenster van `memory_get` wanneer een aanvraag `lines` weglaat. |
| `toolResultMaxChars`      | Geavanceerde bovengrens voor één live toolresultaat (maximaal `1000000` tekens). |
| `postCompactionMaxChars`  | Maximaal aantal tekens dat uit `AGENTS.md` behouden blijft tijdens vernieuwing na Compaction. |

Dit zijn begrensde runtimefragmenten en door de runtime beheerde geïnjecteerde blokken,
los van bootstraplimieten, limieten voor opstartcontext en limieten voor de Skills-prompt.

`toolResultMaxChars` is standaard niet ingesteld, zodat OpenClaw de limiet voor live
toolresultaten afleidt uit het effectieve contextvenster van het model: `16000` tekens onder
100K tokens, `32000` tekens bij 100K+ tokens en `64000` tekens bij 200K+ tokens.
De beveiliging voor het runtime-contextaandeel begrenst één toolresultaat nog steeds op 30% van het
contextvenster, zelfs wanneer een grotere expliciete bovengrens is geconfigureerd.

Voor afbeeldingen verkleint OpenClaw afbeeldingspayloads van transcripties/tools vóór
provideraanroepen. Stel dit af met `agents.defaults.imageMaxDimensionPx` (standaard:
`1200`):

- Lagere waarden verminderen het gebruik van visietokens en de payloadgrootte.
- Hogere waarden behouden meer visuele details voor schermafbeeldingen met veel OCR/UI.

Gebruik `/context list` of `/context detail` voor een praktische uitsplitsing
(per geïnjecteerd bestand, tools, Skills en grootte van de systeemprompt). Zie
[Context](/nl/concepts/context).

## Het huidige tokengebruik bekijken

In de chat:

- `/status` -> statuskaart met veel emoji's en het sessiemodel, contextgebruik,
  invoer-/uitvoertokens van het laatste antwoord en geschatte kosten wanneer lokale prijzen zijn
  geconfigureerd voor het actieve model.
- `/usage off|tokens|full` -> voegt aan elk antwoord een voettekst met gebruik per antwoord toe.
  Blijft per sessie behouden (opgeslagen als `responseUsage`).
  - `/usage reset` (aliassen: `inherit`, `clear`, `default`) wist de
    sessieoverschrijving, zodat de geconfigureerde standaard opnieuw wordt overgenomen.
  - `/usage tokens` toont details over tokens/cache van de beurt.
  - `/usage full` toont compacte details over model/context/kosten; geschatte kosten
    verschijnen alleen wanneer OpenClaw gebruiksmetadata en lokale prijzen voor het
    actieve model heeft. Aangepaste indelingen van `messages.usageTemplate` kunnen
    token-/cachevelden bevatten.
- `/usage cost` -> lokaal kostenoverzicht uit de OpenClaw-sessielogboeken.

Andere oppervlakken:

- **TUI/Web-TUI:** `/status` en `/usage` worden ondersteund.
- **CLI:** `openclaw status --usage` en `openclaw channels list` tonen
  genormaliseerde quotavensters van providers (`X% left`, geen kosten per antwoord).
  Huidige providers van gebruiksvensters: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan en z.ai.

Gebruiksoppervlakken normaliseren algemene aliassen van providereigen velden vóór
weergave. Voor Responses-verkeer uit de OpenAI-familie omvat dit zowel
`input_tokens`/`output_tokens` als `prompt_tokens`/`completion_tokens`, zodat
transportspecifieke veldnamen `/status`, `/usage` of sessiesamenvattingen niet
wijzigen. Het gebruik van Gemini CLI wordt ook genormaliseerd: de standaardparser voor `stream-json`
leest `message`-gebeurtenissen van de assistent en `stats.cached` wordt toegewezen aan
`cacheRead`, waarbij `stats.input_tokens - stats.cached` wordt gebruikt wanneer de CLI
geen expliciet veld `stats.input` bevat. Verouderde JSON-overschrijvingen lezen antwoordtekst
nog steeds uit `response`.

Voor native Responses-verkeer uit de OpenAI-familie worden gebruiksaliassen voor WebSocket/SSE
op dezelfde manier genormaliseerd en vallen totalen terug op genormaliseerde invoer + uitvoer
wanneer `total_tokens` ontbreekt of `0` is.

Wanneer de huidige sessiemomentopname weinig gegevens bevat, kunnen `/status` en `session_status`
token-/cachetellers en het label van het actieve runtimemodel herstellen uit het
meest recente gebruikslogboek van de transcriptie. Bestaande live waarden die niet nul zijn, blijven
voorrang houden op terugvalwaarden uit transcripties, en grotere promptgerichte
transcriptietotalen kunnen winnen wanneer opgeslagen totalen ontbreken of kleiner zijn.

Gebruiksaanmelding voor quotavensters van providers komt eerst uit providerspecifieke hooks;
als een provider geen hook heeft (of de hook geen token oplevert), valt
OpenClaw terug op overeenkomende OAuth-/API-sleutelaanmeldgegevens uit authenticatieprofielen,
omgevingsvariabelen of configuratie.

Transcriptievermeldingen van de assistent bewaren dezelfde genormaliseerde gebruiksvorm,
inclusief `usage.cost` wanneer voor het actieve model prijzen zijn geconfigureerd en de
provider gebruiksmetadata retourneert. Hierdoor hebben `/usage cost` en
op transcripties gebaseerde sessiestatus een stabiele bron, zelfs nadat de live
runtimestatus verdwenen is.

OpenClaw houdt de gebruiksadministratie van de provider gescheiden van de huidige contextmomentopname.
`usage.total` van de provider kan gecachte invoer, uitvoer en
meerdere modelaanroepen in toollussen omvatten, waardoor het nuttig is voor kosten en telemetrie, maar
het live contextvenster kan worden overschat. Contextweergaven en diagnostiek gebruiken
de laatste promptmomentopname (`promptTokens`, of de laatste modelaanroep wanneer geen
promptmomentopname beschikbaar is) voor `context.used`.

## Kostenraming (indien weergegeven)

Kosten worden geschat op basis van uw configuratie voor modelprijzen:

```text
models.providers.<provider>.models[].cost
```

Dit zijn **USD per 1 miljoen tokens** voor `input`, `output`, `cacheRead` en
`cacheWrite`. Als prijzen ontbreken, laat `/usage full` de kosten weg; gebruik
`/usage tokens` of een aangepaste `messages.usageTemplate` wanneer u in elk antwoord
token-/cachedetails nodig hebt. Kostenweergave is niet beperkt tot authenticatie met API-sleutels:
providers zonder API-sleutel, zoals `aws-sdk`, kunnen geschatte kosten tonen wanneer
hun geconfigureerde modelvermelding lokale prijzen bevat en de provider
gebruiksmetadata retourneert.

Nadat sidecars en kanalen het gereedheidspad van de Gateway hebben bereikt, start OpenClaw een
optionele prijsbootstrap op de achtergrond voor geconfigureerde modelreferenties die nog
geen lokale prijzen hebben. Die bootstrap haalt externe prijscatalogi van OpenRouter en
LiteLLM op. Stel `models.pricing.enabled: false` in om het ophalen van die
catalogi over te slaan op offline of beperkte netwerken; expliciete vermeldingen van
`models.providers.*.models[].cost` blijven lokale kostenramingen aansturen.

## Invloed van cache-TTL en opschoning

Promptcaching van providers is alleen van toepassing binnen het cache-TTL-venster. OpenClaw
kan optioneel **cache-TTL-opschoning** uitvoeren: de sessie wordt opgeschoond zodra de
cache-TTL is verlopen, waarna het cachevenster opnieuw wordt ingesteld zodat volgende aanvragen
de nieuw gecachte context hergebruiken in plaats van de volledige geschiedenis opnieuw te cachen.
Dit houdt de schrijfkosten van de cache lager wanneer een sessie langer dan de TTL inactief blijft.

Configureer dit in [Gateway-configuratie](/nl/gateway/configuration) en bekijk de
gedragsdetails in [Sessies opschonen](/nl/concepts/session-pruning).

Heartbeat kan de cache **warm** houden tijdens perioden van inactiviteit. Als de cache-TTL
van uw model `1h` is, kan het instellen van het Heartbeat-interval op net daaronder
(bijvoorbeeld `55m`) voorkomen dat de volledige prompt opnieuw wordt gecacht, waardoor de
schrijfkosten van de cache afnemen.

In configuraties met meerdere agents kunt u één gedeelde modelconfiguratie behouden en het cachegedrag
per agent afstellen met `agents.list[].params.cacheRetention`.

Zie [Promptcaching](/nl/reference/prompt-caching) voor een volledige gids per instelling.

Voor prijzen van de Anthropic-API zijn cacheleesbewerkingen aanzienlijk goedkoper dan invoertokens,
terwijl cacheschrijfbewerkingen tegen een hogere vermenigvuldigingsfactor worden gefactureerd. Zie de
prijzen van Anthropic voor promptcaching voor de nieuwste tarieven en TTL-vermenigvuldigingsfactoren:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Voorbeeld: houd de cache van 1 uur warm met Heartbeat

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

### Voorbeeld: gemengd verkeer met een cachestrategie per agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # standaardbasis voor de meeste agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # houd de langdurige cache warm voor diepgaande sessies
    - id: "alerts"
      params:
        cacheRetention: "none" # vermijd cacheschrijfbewerkingen voor meldingen in pieken
```

`agents.list[].params` wordt boven op de `params` van het geselecteerde model samengevoegd, zodat u
alleen `cacheRetention` kunt overschrijven en andere modelstandaarden
ongewijzigd kunt overnemen.

### Anthropic-context van 1 miljoen

OpenClaw stelt de grootte van Claude 4.x-modellen die geschikt zijn voor algemene beschikbaarheid, zoals Opus 4.8, Opus 4.7, Opus
4.6 en Sonnet 4.6, in op het contextvenster van 1 miljoen van Anthropic. U hebt
`params.context1m: true` niet nodig voor deze modellen.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Oudere configuraties kunnen `context1m: true` behouden, maar OpenClaw verzendt
de ingetrokken bètaheader `context-1m-2025-08-07` van Anthropic niet langer voor deze instelling en
breidt niet-ondersteunde oudere Claude-modellen niet uit naar 1 miljoen.

Vereiste: de aanmeldgegevens moeten geschikt zijn voor gebruik met een lange context. Zo niet,
dan reageert Anthropic voor die aanvraag met een snelheidslimietfout aan de providerzijde.

Als u zich bij Anthropic verifieert met OAuth-/abonnementstokens
(`sk-ant-oat-*`), behoudt OpenClaw de voor OAuth vereiste Anthropic-bètaheaders,
terwijl de uitgefaseerde `context-1m-*`-bèta wordt verwijderd als deze nog in
oudere configuratie aanwezig is.

## Tips om de tokenbelasting te verlagen

- Gebruik `/compact` om lange sessies samen te vatten.
- Kort grote uitvoer van tools in uw workflows in.
- Verlaag `agents.defaults.imageMaxDimensionPx` voor sessies met veel schermafbeeldingen.
- Houd beschrijvingen van Skills kort (de lijst met Skills wordt in de prompt ingevoegd).
- Geef voor uitgebreide, verkennende werkzaamheden de voorkeur aan kleinere modellen.

Zie [Skills](/nl/tools/skills) voor de exacte formule voor de overhead van de lijst met Skills.

## Gerelateerd

- [API-gebruik en -kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruiksregistratie](/nl/concepts/usage-tracking)
