---
read_when:
    - Rotatie van authenticatieprofielen, afkoelperioden of terugvalgedrag van modellen diagnosticeren
    - Failoverregels voor auth-profielen of modellen bijwerken
    - Begrijpen hoe sessiemodeloverschrijvingen interageren met fallback-herhalingspogingen
sidebarTitle: Model failover
summary: Hoe OpenClaw tussen authenticatieprofielen wisselt en op andere modellen terugvalt
title: Uitwijk voor modellen
x-i18n:
    generated_at: "2026-05-11T20:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Rotatie van auth-profielen** binnen de huidige provider.
2. **Modelfallback** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtimeregels uit en de gegevens waarop ze zijn gebaseerd.

## Runtime-flow

Voor een normale tekstrun evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Sessiestatus bepalen">
    Bepaal het actieve sessiemodel en de voorkeur voor het auth-profiel.
  </Step>
  <Step title="Kandidatenketen opbouwen">
    Bouw de modelkandidatenketen op vanuit de huidige modelselectie en het fallbackbeleid voor de bron van die selectie. Geconfigureerde standaardwaarden, primaire cron-jobmodellen en automatisch geselecteerde fallbackmodellen kunnen geconfigureerde fallbacks gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="Huidige provider proberen">
    Probeer de huidige provider met regels voor rotatie/cooldown van auth-profielen.
  </Step>
  <Step title="Doorgaan bij fouten die failover rechtvaardigen">
    Als die provider uitgeput is met een fout die failover rechtvaardigt, ga dan naar de volgende modelkandidaat.
  </Step>
  <Step title="Fallback-override persistent maken">
    Maak de geselecteerde fallback-override persistent voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner op het punt staat te gebruiken. De persistente model-override wordt gemarkeerd met `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Beperkt terugdraaien bij falen">
    Als de fallbackkandidaat faalt, draai dan alleen de sessie-overridevelden die eigendom zijn van fallback terug wanneer ze nog overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="FallbackSummaryError gooien als alles is uitgeput">
    Als elke kandidaat faalt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldown-vervaldatum wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan "de hele sessie opslaan en herstellen". De reply-runner maakt alleen de modelselectievelden persistent die hij voor fallback beheert:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dat voorkomt dat een mislukte fallbackpoging nieuwere, niet-gerelateerde sessiemutaties overschrijft, zoals handmatige `/model`-wijzigingen of sessierotatie-updates die plaatsvonden terwijl de poging liep.

## Beleid voor selectiebron

OpenClaw scheidt de geselecteerde provider/het geselecteerde model van de reden waarom die selectie is gemaakt. Die bron bepaalt of de fallbackketen is toegestaan:

- **Geconfigureerde standaardwaarde**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primair agentmodel**: `agents.list[].model` is strikt tenzij dat agentmodelobject eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of geef een niet-lege lijst op om die agent modelfallback te laten gebruiken.
- **Automatische fallback-override**: een runtimefallback schrijft `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` en het geselecteerde oorsprongsmodel voordat opnieuw wordt geprobeerd. Die automatische override kan de geconfigureerde fallbackketen blijven doorlopen en wordt gewist door `/new`, `/reset` en `sessions.reset`. Heartbeat-runs zonder expliciet `heartbeat.model` wissen ook een directe automatische override wanneer de oorsprong niet langer overeenkomt met de huidige geconfigureerde standaardwaarde.
- **Gebruikerssessie-override**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model faalt voordat er een antwoord wordt geproduceerd, rapporteert OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde geconfigureerde fallback.
- **Legacy sessie-override**: oudere sessievermeldingen kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet naar fallbackgedrag.
- **Cron-payloadmodel**: een cron-job `payload.model` / `--model` is een primair jobmodel, geen gebruikerssessie-override. Het gebruikt geconfigureerde fallbacks tenzij de job `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de cron-run strikt.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Runtime-auth-routeringsstatus staat in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configuratie `auth.profiles` / `auth.order` is **alleen metadata + routering** (geen geheimen).
- Legacy OAuth-bestand alleen voor import: `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in `auth-profiles.json`).

Meer details: [OAuth](/nl/concepts/oauth)

Credentialtypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` voor sommige providers)

## Profiel-ID's

OAuth-logins maken afzonderlijke profielen aan, zodat meerdere accounts naast elkaar kunnen bestaan.

- Standaard: `provider:default` wanneer er geen e-mail beschikbaar is.
- OAuth met e-mail: `provider:<email>` (bijvoorbeeld `google-antigravity:user@gmail.com`).

Profielen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` onder `profiles`.

## Rotatievolgorde

Wanneer een provider meerdere profielen heeft, kiest OpenClaw een volgorde als volgt:

<Steps>
  <Step title="Expliciete configuratie">
    `auth.order[provider]` (indien ingesteld).
  </Step>
  <Step title="Geconfigureerde profielen">
    `auth.profiles` gefilterd op provider.
  </Step>
  <Step title="Opgeslagen profielen">
    Vermeldingen in `auth-profiles.json` voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robin-volgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Cooldown-/uitgeschakelde profielen** worden naar het einde verplaatst, geordend op vroegste vervaldatum.

### Sessie-affiniteit (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie vast** om provider-caches warm te houden. Het roteert **niet** bij elke aanvraag. Het vastgepinde profiel wordt hergebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (compaction-teller wordt verhoogd)
- het profiel in cooldown/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch vastgepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan bij rate limits/time-outs naar een ander profiel roteren. Wanneer het oorspronkelijke profiel weer beschikbaar is, kunnen nieuwe runs er opnieuw de voorkeur aan geven zonder het geselecteerde model of de runtime te wijzigen. Door de gebruiker vastgepinde profielen blijven aan dat profiel gekoppeld; als het faalt en model-fallbacks zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### OpenAI Codex-abonnement plus API-keyback-up

Voor OpenAI-agentmodellen zijn auth en runtime gescheiden. `openai/gpt-*` blijft op
de Codex-harness terwijl auth kan roteren tussen een Codex-abonnementsprofiel en
een OpenAI API-keyback-up.

Gebruik `auth.order.openai` voor de gebruikersgerichte volgorde:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bestaande Codex-abonnementsprofielen kunnen nog steeds de verouderde
`openai-codex:*` profiel-id gebruiken. De geordende API-keyback-up kan een normaal
`openai:*` API-keyprofiel zijn. Wanneer het abonnement een Codex-gebruikslimiet bereikt,
registreert OpenClaw de exacte resettijd wanneer Codex die verstrekt, probeert het het volgende
geordende auth-profiel en houdt het de run binnen de Codex-harness. Zodra de resettijd
is verstreken, komt het abonnementsprofiel weer in aanmerking en kan de volgende automatische
selectie ernaar terugkeren.

Gebruik een door de gebruiker vastgepind profiel alleen wanneer je één account/key voor die
sessie wilt afdwingen. Door de gebruiker vastgepinde profielen zijn bewust strikt en springen niet stilzwijgend
naar een ander profiel.

## Cooldowns

Wanneer een profiel faalt door auth-/rate-limitfouten (of een time-out die op rate limiting lijkt), markeert OpenClaw het als in cooldown en gaat het naar het volgende profiel.

<AccordionGroup>
  <Accordion title="Wat in de ratelimiet-/timeoutcategorie terechtkomt">
    Die ratelimietcategorie is breder dan alleen `429`: deze omvat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, en periodieke limieten voor gebruiksvensters zoals `weekly/monthly limit reached`.

    Format-/ongeldige-aanvraagfouten zijn meestal definitief, omdat het opnieuw proberen van dezelfde payload op dezelfde manier zou mislukken. Daarom toont OpenClaw ze in plaats van auth-profielen te roteren. Bekende paden voor herstel via opnieuw proberen kunnen zich expliciet aanmelden: validatiefouten voor Cloud Code Assist-toolaanroep-ID's worden bijvoorbeeld opgeschoond en eenmaal opnieuw geprobeerd via het `allowFormatRetry`-beleid. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error`, en `reason: error` worden geclassificeerd als timeout-/failoversignalen.

    Algemene servertekst kan ook in die timeoutcategorie terechtkomen wanneer de bron overeenkomt met een bekend tijdelijk patroon. Het kale pi-ai stream-wrapperbericht `An unknown error occurred` wordt bijvoorbeeld voor elke provider als failoverwaardig behandeld, omdat pi-ai dit uitstuurt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-`api_error`-payloads met tijdelijke servertekst zoals `internal server error`, `unknown error, 520`, `upstream error`, of `backend error` worden ook behandeld als failoverwaardige timeouts.

    OpenRouter-specifieke algemene upstreamtekst zoals kaal `Provider returned error` wordt alleen als timeout behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Algemene interne fallbacktekst zoals `LLM request failed with an unknown error.` blijft conservatief en activeert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK retry-after-limieten">
    Sommige provider-SDK's kunnen anders gedurende een lang `Retry-After`-venster slapen voordat ze de controle aan OpenClaw teruggeven. Voor op Stainless gebaseerde SDK's zoals Anthropic en OpenAI beperkt OpenClaw SDK-interne wachttijden voor `retry-after-ms` / `retry-after` standaard tot 60 seconden en toont langere opnieuw-probeerbare responses direct, zodat dit failoverpad kan worden uitgevoerd. Stem de limiet af of schakel deze uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Gedrag bij opnieuw proberen](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Ratelimiet-cooldowns kunnen ook model-scoped zijn:

    - OpenClaw registreert `cooldownModel` voor ratelimietfouten wanneer de falende model-id bekend is.
    - Een zustermodel bij dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown is beperkt tot een ander model.
    - Facturerings-/uitgeschakelde vensters blokkeren nog steeds het hele profiel over modellen heen.

  </Accordion>
</AccordionGroup>

Cooldowns gebruiken exponentiële backoff:

- 1 minuut
- 5 minuten
- 25 minuten
- 1 uur (limiet)

Status wordt opgeslagen in `auth-state.json` onder `usageStats`:

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

## Factureringsdeactiveringen

Facturerings-/kredietfouten (bijvoorbeeld "insufficient credits" / "credit balance too low") worden als failoverwaardig behandeld, maar zijn meestal niet tijdelijk. In plaats van een korte cooldown markeert OpenClaw het profiel als **uitgeschakeld** (met een langere backoff) en roteert het naar het volgende profiel/de volgende provider.

<Note>
Niet elke factureringsachtige response is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in de factureringsbaan, zelfs wanneer een provider in plaats daarvan `401` of `403` retourneert, maar provider-specifieke matchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Tijdelijke `402`-fouten voor gebruiksvensters en uitgavelimieten van organisaties/werkruimten worden ondertussen geclassificeerd als `rate_limit` wanneer het bericht opnieuw probeerbaar lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het pad voor korte afkoeling/failover in plaats van het lange pad voor facturering uitschakelen.
</Note>

Status wordt opgeslagen in `auth-state.json`:

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

Standaarden:

- Factureringsback-off begint bij **5 uur**, verdubbelt per factureringsfout en wordt begrensd op **24 uur**.
- Back-offtellers worden opnieuw ingesteld als het profiel **24 uur** niet heeft gefaald (configureerbaar).
- Overbelaste nieuwe pogingen staan **1 profielrotatie bij dezelfde provider** toe vóór model-fallback.
- Overbelaste nieuwe pogingen gebruiken standaard **0 ms back-off**.

## Model-fallback

Als alle profielen voor een provider falen, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor auth-fouten, snelheidslimieten en time-outs die profielrotatie hebben uitgeput (andere fouten zetten fallback niet voort). Providerfouten die niet genoeg details blootleggen, worden nog steeds precies gelabeld in de fallbackstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of status teruggaf, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` teruggaf, en `unclassified` betekent dat OpenClaw de ruwe preview heeft behouden maar er nog geen classificatie op paste.

Overbelaste fouten en fouten door snelheidslimieten worden agressiever afgehandeld dan afkoelperiodes voor facturering. Standaard staat OpenClaw één nieuwe poging met hetzelfde provider-auth-profiel toe en schakelt daarna zonder wachten over naar de volgende geconfigureerde model-fallback. Signalen dat een provider bezet is, zoals `ModelNotReadyException`, vallen in die overbelaste categorie. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een uitvoering start vanaf de geconfigureerde standaard primaire keuze, een primaire keuze van een cronjob, een primaire keuze van een agent met expliciete fallbacks, of een automatisch geselecteerde fallback-override, kan OpenClaw de bijpassende geconfigureerde fallbackketen doorlopen. Primaire keuzes van agents zonder expliciete fallbacks en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-overrides voor provider/model) zijn strikt: als die provider/dat model onbereikbaar is of faalt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden via een ongerelateerde fallback.

### Regels voor kandidaatreeksen

OpenClaw bouwt de kandidatenlijst op uit de momenteel aangevraagde `provider/model` plus geconfigureerde fallbacks.

<AccordionGroup>
  <Accordion title="Regels">
    - Het aangevraagde model staat altijd eerst.
    - Expliciet geconfigureerde fallbacks worden ontdubbeld, maar niet gefilterd op de modeltoelatingslijst. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige uitvoering al op een geconfigureerde fallback in dezelfde providerfamilie zit, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Wanneer er geen expliciete fallback-override wordt opgegeven, worden geconfigureerde fallbacks geprobeerd vóór de geconfigureerde primaire keuze, zelfs als het aangevraagde model een andere provider gebruikt.
    - Wanneer er geen expliciete fallback-override aan de fallbackrunner wordt opgegeven, wordt de geconfigureerde primaire keuze aan het einde toegevoegd, zodat de keten kan terugvallen op de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` opgeeft, gebruikt de runner exact het aangevraagde model plus die overridelijst. Een lege lijst schakelt model-fallback uit en voorkomt dat de geconfigureerde primaire keuze wordt toegevoegd als verborgen doel voor een nieuwe poging.

  </Accordion>
</AccordionGroup>

### Welke fouten fallback voortzetten

<Tabs>
  <Tab title="Gaat door bij">
    - auth-fouten
    - snelheidslimieten en uitputting van afkoelperiodes
    - overbelaste fouten/provider-bezet-fouten
    - failoverfouten in de vorm van time-outs
    - factureringsuitschakelingen
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad zodat een verouderd persistent model geen buitenste lus voor nieuwe pogingen creëert
    - andere niet-herkende fouten wanneer er nog kandidaten over zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die niet de vorm hebben van een time-out/failover
    - contextoverloopfouten die binnen compaction-/opnieuw-proberen-logica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn

  </Tab>
</Tabs>

### Gedrag voor afkoelingsoverslag versus probe

Wanneer elk auth-profiel voor een provider al in afkoeling staat, slaat OpenClaw die provider niet automatisch voor altijd over. Het neemt per kandidaat een beslissing:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Persistente auth-fouten slaan de hele provider onmiddellijk over.
    - Factureringsuitschakelingen slaan meestal over, maar de primaire kandidaat kan nog steeds beperkt worden geprobed zodat herstel mogelijk is zonder opnieuw op te starten.
    - De primaire kandidaat kan rond het verlopen van de afkoeling worden geprobed, met een throttle per provider.
    - Fallback-zustermodellen van dezelfde provider kunnen ondanks afkoeling worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een snelheidslimiet modelspecifiek is en een zustermodel mogelijk direct kan herstellen.
    - Tijdelijke afkoelingsprobes zijn beperkt tot één per provider per fallback-uitvoering, zodat één provider cross-provider-fallback niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessie-overrides en live model wisselen

Sessiemodelwijzigingen zijn gedeelde status. De actieve runner, de opdracht `/model`, compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat fallbackpogingen moeten coördineren met live model wisselen:

- Alleen expliciete, door de gebruiker gestuurde modelwijzigingen markeren een wachtende live wissel. Dat omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Door het systeem gestuurde modelwijzigingen zoals fallbackrotatie, heartbeat-overrides of Compaction markeren nooit uit zichzelf een wachtende live wissel.
- Door de gebruiker gestuurde model-overrides worden behandeld als exacte selecties voor fallbackbeleid, zodat een onbereikbare geselecteerde provider als fout zichtbaar wordt in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een fallbackpoging start, schrijft de antwoordrunner de geselecteerde velden voor fallback-overrides persistent weg naar de sessie-entry.
- Automatische fallback-overrides blijven op volgende beurten geselecteerd, zodat OpenClaw niet bij elk bericht een bekende slechte primaire keuze probet. `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides en zetten de sessie terug naar de geconfigureerde standaard.
- `/status` toont het geselecteerde model en, wanneer de fallbackstatus verschilt, het actieve fallbackmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan persistente sessie-overrides boven verouderde runtime-modelvelden.
- Als een live-wisselfout naar een latere kandidaat in de actieve fallbackketen wijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst ongerelateerde kandidaten te doorlopen.
- Als de fallbackpoging faalt, draait de runner alleen de overridevelden terug die hij heeft geschreven, en alleen als die nog steeds overeenkomen met die gefaalde kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primaire keuze faalt">
    Het geselecteerde primaire model faalt.
  </Step>
  <Step title="Fallback in geheugen gekozen">
    Fallbackkandidaat wordt in geheugen gekozen.
  </Step>
  <Step title="Sessiestore zegt nog steeds oude primaire keuze">
    Sessiestore weerspiegelt nog steeds de oude primaire keuze.
  </Step>
  <Step title="Live reconciliatie leest verouderde status">
    Live-sessiereconciliatie leest de verouderde sessiestatus.
  </Step>
  <Step title="Nieuwe poging teruggezet">
    De nieuwe poging wordt teruggezet naar het oude model voordat de fallbackpoging start.
  </Step>
</Steps>

De persistente fallback-override sluit dat venster, en de smalle rollback houdt nieuwere handmatige of runtime-sessiewijzigingen intact.

## Waarneembaarheid en foutensamenvattingen

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte afkoelingsberichten voeden:

- geprobeerd provider/model
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failoverredenen)
- optionele status/code
- leesbare foutensamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat faalt, wordt overgeslagen, of een latere fallback slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnose-exporters de primaire fout kunnen reconstrueren, zelfs wanneer de terminale fallback ook faalt.

Wanneer elke kandidaat faalt, gooit OpenClaw `FallbackSummaryError`. De buitenste antwoordrunner kan dat gebruiken om een specifieker bericht op te bouwen, zoals "alle modellen zijn tijdelijk door snelheidslimieten beperkt", en de eerstvolgende afloop van de afkoeling opnemen wanneer die bekend is.

Die afkoelingssamenvatting is modelbewust:

- ongerelateerde modelspecifieke snelheidslimieten worden genegeerd voor de geprobeerde provider-/modelketen
- als de resterende blokkade een overeenkomende modelspecifieke snelheidslimiet is, meldt OpenClaw de laatste overeenkomende afloop die dat model nog steeds blokkeert

## Gerelateerde configuratie

Zie [Gateway-configuratie](/nl/gateway/configuration) voor:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-routering

Zie [Modellen](/nl/concepts/models) voor het bredere overzicht van modelselectie en fallback.
