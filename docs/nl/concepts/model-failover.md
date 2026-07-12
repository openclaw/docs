---
read_when:
    - Diagnose van de rotatie van authenticatieprofielen, afkoelperiodes of het terugvalgedrag van modellen
    - Failoverregels voor authenticatieprofielen of modellen bijwerken
    - Begrijpen hoe modeloverschrijvingen voor sessies samenwerken met nieuwe pogingen via terugvalmodellen
sidebarTitle: Model failover
summary: Hoe OpenClaw authenticatieprofielen roteert en terugvalt op andere modellen
title: Model-failover
x-i18n:
    generated_at: "2026-07-12T08:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Rotatie van authenticatieprofielen** binnen de huidige provider.
2. **Modelterugval** naar het volgende model in `agents.defaults.model.fallbacks`.

## Runtimeverloop

<Steps>
  <Step title="Resolve session state">
    Bepaal het actieve sessiemodel en de voorkeur voor het authenticatieprofiel.
  </Step>
  <Step title="Build candidate chain">
    Bouw de keten met kandidaatmodellen op uit de huidige modelselectie en het terugvalbeleid voor de bron van die selectie. Geconfigureerde standaardwaarden, primaire modellen van Cron-taken en automatisch geselecteerde terugvalmodellen kunnen geconfigureerde terugvalmodellen gebruiken; expliciete gebruikersselecties voor sessies zijn strikt.
  </Step>
  <Step title="Try the current provider">
    Probeer de huidige provider met de regels voor rotatie en afkoeling van authenticatieprofielen.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Als de mogelijkheden van die provider zijn uitgeput door een fout die failover rechtvaardigt, ga dan door naar het volgende kandidaatmodel.
  </Step>
  <Step title="Persist fallback override">
    Sla de geselecteerde terugvaloverschrijving op voordat de nieuwe poging begint, zodat andere sessielezers dezelfde provider en hetzelfde model zien die de uitvoerder gaat gebruiken. De opgeslagen modeloverschrijving wordt gemarkeerd met `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Als het kandidaat-terugvalmodel mislukt, draai dan alleen de sessieoverschrijvingsvelden terug die eigendom zijn van de terugval en nog steeds overeenkomen met dat mislukte kandidaatmodel.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Als elk kandidaatmodel mislukt, werp dan een `FallbackSummaryError` met details per poging en het eerstvolgende moment waarop een afkoelperiode afloopt, indien dat bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan „de hele sessie opslaan en herstellen”. De antwoorduitvoerder slaat alleen de modelselectievelden op waarvan deze voor terugval eigenaar is: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Zo wordt voorkomen dat een mislukte nieuwe terugvalpoging nieuwere, niet-gerelateerde sessiewijzigingen overschrijft, zoals een handmatige wijziging via `/model` of een update van de sessierotatie die plaatsvond terwijl de poging werd uitgevoerd.

## Beleid voor selectiebronnen

De selectiebron bepaalt of de terugvalketen is toegestaan:

- **Geconfigureerde standaardwaarde**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primair agentmodel**: `agents.list[].model` is strikt, tenzij het modelobject van die agent eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of een niet-lege lijst om modelterugval voor die agent in te schakelen.
- **Automatische terugvaloverschrijving**: een runtime-terugval schrijft vóór een nieuwe poging `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` en het geselecteerde oorspronkelijke model. Met deze overschrijving wordt de geconfigureerde terugvalketen verder doorlopen zonder bij elk bericht het primaire model te testen, maar OpenClaw test de geconfigureerde oorsprong elke 5 minuten (niet configureerbaar) en wist de overschrijving zodra deze is hersteld. `/new`, `/reset` en `sessions.reset` wissen ook automatisch aangemaakte overschrijvingen. Heartbeat-uitvoeringen zonder expliciet `heartbeat.model` wissen directe automatische overschrijvingen wanneer hun oorsprong niet meer overeenkomt met de huidige geconfigureerde standaardwaarde.
- **Gebruikersoverschrijving voor sessies**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dit is een exacte sessieselectie. Als de geselecteerde provider of het geselecteerde model mislukt voordat er een antwoord is geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden met een niet-gerelateerd geconfigureerd terugvalmodel.
- **Verouderde sessieoverschrijving**: oudere sessievermeldingen kunnen `modelOverride` zonder `modelOverrideSource` bevatten. OpenClaw behandelt deze als gebruikersoverschrijvingen, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet in terugvalgedrag.
- **Model in Cron-payload**: `payload.model` / `--model` van een Cron-taak is een primair taakmodel, geen gebruikersoverschrijving voor een sessie. Het gebruikt geconfigureerde terugvalmodellen, tenzij de taak `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de Cron-uitvoering strikt.

OpenClaw onthoudt recente tests van primaire modellen per sessie en per primair model, zodat een falend primair model niet bij elke beurt opnieuw wordt geprobeerd. Het stuurt een zichtbare melding wanneer een sessie naar een terugvalmodel overschakelt en nog een melding wanneer deze terugkeert naar het geselecteerde primaire model; de melding wordt niet bij elke beurt met een aangehouden terugvalmodel herhaald.

## Cache voor het overslaan van authenticatiefouten

Standaard behoudt elke nieuwe beurt het bestaande gedrag voor nieuwe terugvalpogingen: OpenClaw probeert elk geconfigureerd kandidaat-terugvalmodel opnieuw, inclusief niet-primaire kandidaatmodellen die onlangs zijn mislukt met `auth` of `auth_permanent`.

Schakel het onderdrukken van herhaalde authenticatiefouten in met:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wanneer dit is ingeschakeld, registreert OpenClaw na een fout uit de authenticatiecategorie een sessiegebonden oversla-markering in het geheugen voor een niet-primair kandidaat-terugvalmodel, met sessie-id, provider en model als sleutel. Primaire kandidaatmodellen worden nooit overgeslagen, zodat een expliciete modelselectie door de gebruiker nog steeds de werkelijke authenticatiefout toont. De cache is lokaal voor het proces en wordt gewist wanneer de Gateway opnieuw wordt gestart.

De waarde is een TTL in milliseconden. `0` of een niet-ingestelde waarde schakelt de cache uit. Positieve waarden worden begrensd tussen 1 seconde en 10 minuten.

## Voor gebruikers zichtbare terugvalmeldingen

Wanneer een sessie overschakelt naar een automatisch geselecteerd terugvalmodel, stuurt OpenClaw een statusmelding via hetzelfde antwoordoppervlak:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wanneer een latere test slaagt en de sessie terugkeert naar het geselecteerde primaire model, stuurt OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Deze meldingen zijn operationele berichten, geen inhoud van de assistent. Ze worden eenmaal per statuswijziging afgeleverd, waar mogelijk ook bij beurten met uitsluitend neveneffecten, maar worden niet herhaald bij beurten met een aangehouden terugvalmodel. De aflevering omzeilt de normale onderdrukking van antwoorden op de bron, neemt bij kanalen met threads niet de eerste antwoordpositie van de assistent in en wordt uitgesloten van tekst-naar-spraak en de extractie van toezeggingen.

## Opslag van authenticatie (sleutels + OAuth)

OpenClaw gebruikt **authenticatieprofielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen en de runtimestatus voor authenticatieroutering bevinden zich in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- De configuratie `auth.profiles` / `auth.order` bevat **alleen metagegevens + routering** (geen geheimen).
- Verouderd OAuth-bestand uitsluitend voor import: `~/.openclaw/credentials/oauth.json` (bij het eerste gebruik geïmporteerd in de authenticatieopslag per agent).
- Verouderde bestanden `auth-profiles.json`, `auth-state.json` en `auth.json` per agent worden geïmporteerd door `openclaw doctor --fix`.

Meer informatie: [OAuth](/nl/concepts/oauth)

Typen aanmeldgegevens:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` voor sommige providers)
- `type: "token"` → statisch token van het bearer-type, eventueel met vervaldatum; OpenClaw vernieuwt dit niet (gebruikt voor `aws-sdk` en andere authenticatiemodi met een aanmeldgegevensketen)

## Profiel-ID's

OAuth-aanmeldingen maken afzonderlijke profielen aan, zodat meerdere accounts naast elkaar kunnen bestaan.

- Standaard: `provider:default` wanneer geen e-mailadres beschikbaar is.
- OAuth met e-mailadres: `provider:<email>` (bijvoorbeeld `google-antigravity:user@gmail.com`).

Profielen bevinden zich in de opslag voor authenticatieprofielen in `openclaw-agent.sqlite` per agent.

## Rotatievolgorde

Wanneer een provider meerdere profielen heeft, kiest OpenClaw als volgt een volgorde:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (indien ingesteld).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles`, gefilterd op provider.
  </Step>
  <Step title="Stored profiles">
    Vermeldingen voor authenticatieprofielen van de provider in SQLite per agent.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth, vervolgens statisch token, vervolgens API-sleutel**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Profielen in afkoeling of uitgeschakelde profielen** worden naar het einde verplaatst, geordend op het eerstvolgende verloopmoment.

### Sessiebinding (cachevriendelijk)

OpenClaw **koppelt het gekozen authenticatieprofiel aan de sessie** om de providercaches warm te houden. Het roteert **niet** bij elke aanvraag. Het gekoppelde profiel wordt hergebruikt totdat:

- de sessie opnieuw wordt ingesteld (`/new` / `/reset`)
- een Compaction is voltooid (de Compaction-teller wordt verhoogd)
- het profiel in afkoeling staat of is uitgeschakeld

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverschrijving** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie begint.

<Note>
Automatisch gekoppelde profielen (geselecteerd door de sessierouter) worden als een **voorkeur** behandeld: ze worden eerst geprobeerd, maar OpenClaw kan bij frequentielimieten of time-outs naar een ander profiel roteren. Wanneer het oorspronkelijke profiel weer beschikbaar is, kunnen nieuwe uitvoeringen er opnieuw de voorkeur aan geven zonder het geselecteerde model of de runtime te wijzigen. Door de gebruiker gekoppelde profielen blijven aan dat profiel vergrendeld; als het mislukt en er modelterugvallen zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### OpenAI Codex-abonnement met API-sleutel als reserve

Voor OpenAI-agentmodellen staan authenticatie en runtime los van elkaar. `openai/gpt-*` blijft in het Codex-harnas, terwijl de authenticatie kan roteren tussen een Codex-abonnementsprofiel en een OpenAI-API-sleutel als reserve.

Gebruik `auth.order.openai` voor de aan de gebruiker getoonde volgorde:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Gebruik `openai:*` voor zowel ChatGPT/Codex OAuth-profielen als OpenAI-API-sleutelprofielen. Wanneer het abonnement een Codex-gebruikslimiet bereikt, registreert OpenClaw het exacte hersteltijdstip als Codex dat verstrekt, probeert het het volgende authenticatieprofiel in de ingestelde volgorde en houdt het de uitvoering binnen het Codex-harnas. Nadat het hersteltijdstip is verstreken, komt het abonnementsprofiel weer in aanmerking en kan de volgende automatische selectie ernaar terugkeren.

Gebruik een door de gebruiker gekoppeld profiel alleen wanneer u voor die sessie één account of sleutel wilt afdwingen. Door de gebruiker gekoppelde profielen zijn bewust strikt en springen niet stilzwijgend naar een ander profiel.

## Afkoelperioden

Wanneer een profiel mislukt door authenticatie- of frequentielimietfouten (of een time-out die op frequentiebeperking lijkt), markeert OpenClaw het als in afkoeling en gaat het naar het volgende profiel.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Die categorie voor frequentielimieten is breder dan alleen `429`: deze omvat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke limieten voor gebruiksvensters zoals `weekly limit reached` of `monthly limit exhausted`.

    Opmaakfouten en fouten door ongeldige aanvragen zijn doorgaans definitief, omdat een nieuwe poging met dezelfde payload op dezelfde manier zou mislukken. Daarom toont OpenClaw deze fouten in plaats van authenticatieprofielen te roteren. Bekende herstelpaden voor nieuwe pogingen kunnen dit expliciet inschakelen: validatiefouten voor aanroep-ID's van Cloud Code Assist-hulpmiddelen worden bijvoorbeeld opgeschoond en eenmaal opnieuw geprobeerd via het beleid `allowFormatRetry`. OpenAI-compatibele fouten voor stopredenen, zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error`, worden geclassificeerd als signalen voor time-out of failover.

    Algemene servertekst kan ook in die time-outcategorie terechtkomen wanneer de bron overeenkomt met een bekend tijdelijk patroon. Het kale bericht `An unknown error occurred` van de stream-wrapper van de modelruntime wordt bijvoorbeeld voor elke provider behandeld als een fout die failover rechtvaardigt, omdat de gedeelde modelruntime dit bericht produceert wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-payloads van het type `api_error` met tijdelijke servertekst, zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error`, worden eveneens behandeld als time-outs die failover rechtvaardigen.

    Algemene upstreamtekst die specifiek is voor OpenRouter, zoals het kale `Provider returned error`, wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Algemene interne terugvaltekst zoals `LLM request failed with an unknown error.` blijft behoudend en activeert op zichzelf geen failover.

  </Accordion>
  <Accordion title="Limieten voor retry-after van de SDK">
    Sommige provider-SDK's wachten anders mogelijk gedurende een lang `Retry-After`-interval voordat ze de besturing teruggeven aan OpenClaw. Voor op Stainless gebaseerde SDK's, zoals Anthropic en OpenAI, beperkt OpenClaw interne wachttijden van de SDK voor `retry-after-ms` / `retry-after` standaard tot 60 seconden en worden langer durende reacties die opnieuw kunnen worden geprobeerd onmiddellijk doorgegeven, zodat dit failoverpad kan worden uitgevoerd. Pas de limiet aan of schakel deze uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Gedrag bij opnieuw proberen](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Modelgebonden afkoelperiodes">
    Afkoelperiodes vanwege frequentielimieten kunnen ook aan een model zijn gebonden:

    - OpenClaw registreert `cooldownModel` voor fouten vanwege frequentielimieten wanneer de id van het falende model bekend is.
    - Een ander model van dezelfde provider kan nog steeds worden geprobeerd wanneer de afkoelperiode aan een ander model is gebonden.
    - Factureringsvensters en uitgeschakelde vensters blokkeren nog steeds het hele profiel voor alle modellen.

  </Accordion>
</AccordionGroup>

Reguliere afkoelperiodes (niet voor facturering en niet voor permanente authenticatiefouten) worden geschaald op basis van het recente aantal fouten van het profiel:

- 1e fout: 30 seconden
- 2e fout: 1 minuut
- 3e en volgende fouten: 5 minuten (maximum)

De tellers worden opnieuw ingesteld zodra het foutvenster van het profiel is verstreken (`auth.cooldowns.failureWindowHours`, standaard 24).

De status wordt opgeslagen in de SQLite-authenticatiestatus per agent onder `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Uitschakeling vanwege facturering

Facturerings- en tegoedfouten (bijvoorbeeld "onvoldoende tegoed" / "te laag tegoedsaldo") worden beschouwd als redenen voor failover, maar zijn meestal niet tijdelijk. In plaats van een korte afkoelperiode markeert OpenClaw het profiel als **uitgeschakeld** (met een langere wachttijd) en schakelt het over naar het volgende profiel of de volgende provider.

<Note>
Niet elke reactie die op een factureringsfout lijkt, is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in het factureringspad, zelfs wanneer een provider in plaats daarvan `401` of `403` retourneert, maar providerspecifieke herkenningsmechanismen blijven beperkt tot de provider die er eigenaar van is (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Tijdelijke `402`-fouten voor gebruiksvensters en bestedingslimieten van organisaties of werkruimten worden daarentegen geclassificeerd als `rate_limit` wanneer het bericht aangeeft dat opnieuw proberen zinvol is (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Deze blijven het pad voor korte afkoeling en failover volgen in plaats van het lange pad voor uitschakeling vanwege facturering.
</Note>

Permanente authenticatiefouten met hoge zekerheid (ingetrokken of gedeactiveerde sleutels, gedeactiveerde werkruimten) krijgen een vergelijkbaar uitschakelpad, maar herstellen veel sneller dan factureringsfouten, omdat sommige providers tijdens incidenten tijdelijk reacties retourneren die op authenticatiefouten lijken.

De status wordt opgeslagen in de SQLite-authenticatiestatus per agent:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Standaardwaarden (`auth.cooldowns.*`):

| Sleutel                       | Standaard | Doel                                                                                           |
| ----------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5         | Basiswachttijd voor facturering; verdubbelt na elke factureringsfout                            |
| `billingMaxHours`             | 24        | Maximum voor de wachttijd bij facturering                                                       |
| `authPermanentBackoffMinutes` | 10        | Basiswachttijd voor permanente authenticatiefouten met hoge zekerheid                           |
| `authPermanentMaxMinutes`     | 60        | Maximum voor die wachttijd                                                                      |
| `failureWindowHours`          | 24        | Fouttellers worden opnieuw ingesteld als er binnen dit venster geen fouten optreden             |
| `overloadedProfileRotations`  | 1         | Toegestane profielwisselingen bij dezelfde provider vóór modelterugval bij overbelasting         |
| `overloadedBackoffMs`         | 0         | Vaste vertraging vóór een nieuwe poging met wisseling bij overbelasting                         |
| `rateLimitedProfileRotations` | 1         | Toegestane profielwisselingen bij dezelfde provider vóór modelterugval bij een frequentielimiet  |

Fouten vanwege overbelasting en frequentielimieten worden agressiever afgehandeld dan afkoelperiodes vanwege facturering: standaard staat OpenClaw één nieuwe poging met een authenticatieprofiel van dezelfde provider toe en schakelt het daarna zonder te wachten over naar het volgende geconfigureerde terugvalmodel.

## Modelterugval

Als alle profielen voor een provider mislukken, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor authenticatiefouten, frequentielimieten en time-outs waarbij profielwisseling is uitgeput (andere fouten activeren geen terugval). Providerfouten die onvoldoende details bevatten, krijgen nog steeds een nauwkeurig label in de terugvalstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of bruikbare status retourneerde, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` retourneerde en `unclassified` betekent dat OpenClaw het onbewerkte voorbeeld heeft behouden, maar dat nog geen classificatiemechanisme ermee overeenkwam.

Signalen dat een provider bezet is, zoals `ModelNotReadyException`, komen in de categorie overbelasting terecht en volgen hetzelfde beleid van één wisseling en daarna terugval als frequentielimieten (zie de tabel met standaardwaarden hierboven).

Wanneer een uitvoering begint met de geconfigureerde standaardwaarde voor het primaire model, het primaire model van een Cron-taak, het primaire model van een agent met expliciete terugvalmodellen of een automatisch geselecteerde terugvaloverschrijving, kan OpenClaw de bijbehorende geconfigureerde terugvalketen doorlopen. Primaire modellen van agents zonder expliciete terugvalmodellen en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-overschrijvingen voor provider/model) zijn strikt: als die provider of dat model onbereikbaar is of mislukt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van een antwoord van een niet-gerelateerd terugvalmodel te geven.

### Regels voor de kandidatenketen

OpenClaw stelt de kandidatenlijst samen uit het momenteel aangevraagde `provider/model` plus de geconfigureerde terugvalmodellen.

<AccordionGroup>
  <Accordion title="Regels">
    - Het aangevraagde model staat altijd vooraan.
    - Expliciet geconfigureerde terugvalmodellen worden ontdubbeld, maar niet gefilterd op basis van de lijst met toegestane modellen. Ze worden beschouwd als expliciete intentie van de beheerder.
    - Als de huidige uitvoering al een geconfigureerd terugvalmodel binnen dezelfde providerfamilie gebruikt, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Wanneer geen expliciete terugvaloverschrijving is opgegeven, worden geconfigureerde terugvalmodellen vóór het geconfigureerde primaire model geprobeerd, zelfs als het aangevraagde model een andere provider gebruikt.
    - Wanneer geen expliciete terugvaloverschrijving aan de terugvalrunner wordt doorgegeven, wordt het geconfigureerde primaire model aan het einde toegevoegd, zodat de keten kan terugkeren naar de normale standaardwaarde zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` opgeeft, gebruikt de runner exact het aangevraagde model plus die overschrijvingslijst. Een lege lijst schakelt modelterugval uit en voorkomt dat het geconfigureerde primaire model als verborgen doel voor een nieuwe poging wordt toegevoegd.

  </Accordion>
</AccordionGroup>

### Welke fouten terugval activeren

<Tabs>
  <Tab title="Gaat door bij">
    - authenticatiefouten
    - frequentielimieten en uitputting van afkoelperiodes
    - fouten vanwege overbelasting of een bezette provider
    - failoverfouten in de vorm van een time-out
    - uitschakelingen vanwege facturering
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad, zodat een verouderd persistent model geen buitenste lus voor nieuwe pogingen veroorzaakt
    - andere niet-herkende fouten wanneer er nog kandidaten over zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die niet de vorm van een time-out of failover hebben
    - fouten door overschrijding van de contextlimiet die binnen de logica voor Compaction en opnieuw proberen moeten blijven (bijvoorbeeld `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer zijn
    - veiligheidsweigeringen van Claude Fable 5; directe aanvragen met een API-sleutel handelen deze op providerniveau af via de serverzijdige terugval van Anthropic naar `claude-opus-4-8` (zie [Anthropic](/nl/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Gedrag bij overslaan van afkoeling versus testen

Wanneer elk authenticatieprofiel voor een provider al in een afkoelperiode zit, slaat OpenClaw die provider niet automatisch voorgoed over. Het neemt per kandidaat een beslissing:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Permanente authenticatiefouten zorgen ervoor dat de hele provider onmiddellijk wordt overgeslagen.
    - Uitschakelingen vanwege facturering worden gewoonlijk overgeslagen, maar de primaire kandidaat kan nog steeds met een frequentiebeperking worden getest, zodat herstel mogelijk is zonder opnieuw op te starten.
    - De primaire kandidaat kan vlak voor het verlopen van de afkoelperiode worden getest, met een frequentiebeperking per provider.
    - Terugvalmodellen van dezelfde provider kunnen ondanks de afkoelperiode worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een frequentielimiet aan een model is gebonden en een ander model mogelijk onmiddellijk kan herstellen.
    - Tests tijdens tijdelijke afkoelperiodes zijn beperkt tot één per provider per terugvaluitvoering, zodat één provider de terugval tussen providers niet vertraagt.

  </Accordion>
</AccordionGroup>

## Sessieoverschrijvingen en live wisselen van model

Wijzigingen van het sessiemodel zijn gedeelde status. De actieve runner, de opdracht `/model`, updates voor Compaction en sessies en afstemming van live sessies lezen of schrijven allemaal delen van dezelfde sessievermelding.

Dat betekent dat nieuwe terugvalpogingen moeten worden gecoördineerd met het live wisselen van model:

- Alleen expliciete, door de gebruiker gestuurde modelwijzigingen markeren een wachtende live wissel. Dit omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Door het systeem gestuurde modelwijzigingen, zoals terugvalwisseling, Heartbeat-overschrijvingen of Compaction, markeren zelf nooit een wachtende live wissel.
- Door de gebruiker gestuurde modeloverschrijvingen worden voor het terugvalbeleid behandeld als exacte selecties, zodat een onbereikbare geselecteerde provider als fout wordt weergegeven in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een nieuwe terugvalpoging begint, slaat de antwoordrunner de geselecteerde velden voor de terugvaloverschrijving op in de sessievermelding.
- Automatische terugvaloverschrijvingen blijven tijdens volgende beurten geselecteerd, zodat OpenClaw niet bij elk bericht een primair model test waarvan bekend is dat het niet werkt. OpenClaw test periodiek opnieuw de geconfigureerde oorsprong en wist de automatische overschrijving wanneer deze herstelt; `/new`, `/reset` en `sessions.reset` wissen automatisch ingestelde overschrijvingen onmiddellijk.
- Antwoorden aan gebruikers kondigen terugvalovergangen en herstel na het wissen van de terugval eenmaal per statuswijziging aan. Beurten met blijvende terugval herhalen de melding niet.
- `/status` toont het geselecteerde model en, wanneer de terugvalstatus afwijkt, het actieve terugvalmodel en de reden.
- Afstemming van live sessies geeft voorrang aan opgeslagen sessieoverschrijvingen boven verouderde modelvelden tijdens runtime.
- Als een fout bij live wisselen naar een latere kandidaat in de actieve terugvalketen verwijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de terugvalpoging mislukt, draait de runner alleen de overschrijvingsvelden terug die deze zelf heeft geschreven, en alleen wanneer ze nog steeds overeenkomen met die mislukte kandidaat.

Dit voorkomt de klassieke racevoorwaarde:

<Steps>
  <Step title="Primair model mislukt">
    Het geselecteerde primaire model mislukt.
  </Step>
  <Step title="Terugvalmodel in het geheugen gekozen">
    De terugvalkandidaat wordt in het geheugen gekozen.
  </Step>
  <Step title="Sessiestore vermeldt nog steeds het oude primaire model">
    De sessiestore bevat nog steeds het oude primaire model.
  </Step>
  <Step title="Live afstemming leest verouderde status">
    De afstemming van de live sessie leest de verouderde sessiestatus.
  </Step>
  <Step title="Nieuwe poging teruggezet">
    De nieuwe poging wordt teruggezet naar het oude model voordat de terugvalpoging begint.
  </Step>
</Steps>

De opgeslagen terugvaloverschrijving sluit dat venster, en de beperkte terugdraaiing laat nieuwere handmatige of tijdens runtime aangebrachte sessiewijzigingen intact.

## Observeerbaarheid en foutoverzichten

`runWithModelFallback(...)` registreert details per poging die worden gebruikt voor logboeken en gebruikersgerichte meldingen over afkoelperiodes:

- geprobeerde provider/model
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare redenen voor failover)
- optionele status/code
- voor mensen leesbare samenvatting van de fout

Gestructureerde `model_fallback_decision`-logboeken bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat mislukt, wordt overgeslagen of een latere fallback slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat exportfuncties voor logboeken en diagnostiek de primaire fout kunnen reconstrueren, zelfs wanneer de uiteindelijke fallback ook mislukt.

Wanneer elke kandidaat mislukt, genereert OpenClaw een `FallbackSummaryError`. De bovenliggende antwoordrunner kan die gebruiken om een specifiekere melding op te stellen, zoals "voor alle modellen geldt tijdelijk een snelheidslimiet", en het eerstvolgende tijdstip waarop de afkoelperiode afloopt opnemen wanneer dat bekend is.

Die samenvatting van de afkoelperiode houdt rekening met het model:

- niet-gerelateerde, modelgebonden snelheidslimieten worden genegeerd voor de geprobeerde provider/model-keten
- als de resterende blokkering een overeenkomende modelgebonden snelheidslimiet is, rapporteert OpenClaw het laatste overeenkomende verlooptijdstip dat dat model nog blokkeert

## Gerelateerde configuratie

Zie [Gateway-configuratie](/nl/gateway/configuration) voor:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routering van `agents.defaults.imageModel`

Zie [Modellen](/nl/concepts/models) voor het bredere overzicht van modelselectie en fallback.
