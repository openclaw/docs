---
read_when:
    - Diagnose van rotatie van authenticatieprofielen, afkoelperiodes of terugvalgedrag van modellen
    - Failoverregels voor auth-profielen of modellen bijwerken
    - Begrijpen hoe sessiemodel-overschrijvingen samenwerken met fallback-herhaalpogingen
sidebarTitle: Model failover
summary: Hoe OpenClaw authenticatieprofielen roteert en terugvalt op andere modellen
title: Modeluitwijk
x-i18n:
    generated_at: "2026-04-29T22:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Rotatie van auth-profielen** binnen de huidige provider.
2. **Modelfallback** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtimeregels uit en de gegevens waarop ze gebaseerd zijn.

## Runtimeflow

Voor een normale tekstuitvoering evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Resolve session state">
    Los het actieve sessiemodel en de voorkeur voor het auth-profiel op.
  </Step>
  <Step title="Build candidate chain">
    Bouw de modelkandidatenketen op vanuit de huidige modelselectie en het fallbackbeleid voor die selectiebron. Geconfigureerde standaardwaarden, primaire modellen voor cronjobs en automatisch geselecteerde fallbackmodellen kunnen geconfigureerde fallbacks gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="Try the current provider">
    Probeer de huidige provider met de rotatie- en cooldownregels voor auth-profielen.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Als die provider is uitgeput met een fout die failover rechtvaardigt, ga dan door naar de volgende modelkandidaat.
  </Step>
  <Step title="Persist fallback override">
    Sla de geselecteerde fallback-override op voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner gaat gebruiken. De opgeslagen modeloverride wordt gemarkeerd als `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Als de fallbackkandidaat mislukt, draai dan alleen de sessieoverridevelden terug die eigendom zijn van de fallback wanneer ze nog steeds overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Als elke kandidaat mislukt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldownverlooptijd wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust smaller dan "de hele sessie opslaan en herstellen". De reply-runner slaat alleen de modelselectievelden op die hij voor fallback beheert:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dat voorkomt dat een mislukte fallbackpoging nieuwere, niet-gerelateerde sessiemutaties overschrijft, zoals handmatige `/model`-wijzigingen of sessierotatie-updates die plaatsvonden terwijl de poging liep.

## Beleid voor selectiebron

OpenClaw scheidt de geselecteerde provider/het geselecteerde model van de reden waarom die is geselecteerd. Die bron bepaalt of de fallbackketen is toegestaan:

- **Geconfigureerde standaardwaarde**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primair agentmodel**: `agents.list[].model` is strikt, tenzij dat agentmodelobject eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of geef een niet-lege lijst op om die agent in te schakelen voor modelfallback.
- **Automatische fallbackoverride**: een runtimefallback schrijft `providerOverride`, `modelOverride` en `modelOverrideSource: "auto"` voordat er opnieuw wordt geprobeerd. Die automatische override kan door de geconfigureerde fallbackketen blijven lopen en wordt gewist door `/new`, `/reset` en `sessions.reset`.
- **Gebruikerssessieoverride**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model mislukt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde geconfigureerde fallback.
- **Verouderde sessieoverride**: oudere sessie-items kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet in fallbackgedrag.
- **Cron-payloadmodel**: een cronjob `payload.model` / `--model` is een primair jobmodel, geen gebruikerssessieoverride. Het gebruikt geconfigureerde fallbacks tenzij de job `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de cronuitvoering strikt.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (verouderd: `~/.openclaw/agent/auth-profiles.json`).
- Runtime-auth-routeringsstatus staat in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configuratie `auth.profiles` / `auth.order` is **alleen metadata + routering** (geen geheimen).
- Verouderd OAuth-bestand dat alleen voor import wordt gebruikt: `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in `auth-profiles.json`).

Meer details: [OAuth](/nl/concepts/oauth)

Credentialtypes:

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
  <Step title="Explicit config">
    `auth.order[provider]` (indien ingesteld).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` gefilterd op provider.
  </Step>
  <Step title="Stored profiles">
    Items in `auth-profiles.json` voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Cooldown-/uitgeschakelde profielen** worden naar het einde verplaatst, geordend op vroegste verlooptijd.

### Sessiestickyheid (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie vast** om providercaches warm te houden. Het roteert **niet** bij elk verzoek. Het vastgepinde profiel wordt hergebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (Compaction-teller wordt verhoogd)
- het profiel in cooldown zit/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch vastgepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan naar een ander profiel roteren bij snelheidslimieten/time-outs. Door gebruikers vastgepinde profielen blijven aan dat profiel vergrendeld; als het mislukt en modelfallbacks zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### Waarom OAuth "verloren kan lijken"

Als je zowel een OAuth-profiel als een API-sleutelprofiel hebt voor dezelfde provider, kan round-robin tussen berichten wisselen, tenzij het profiel is vastgepind. Om één profiel af te dwingen:

- Pin met `auth.order[provider] = ["provider:profileId"]`, of
- Gebruik een override per sessie via `/model …` met een profieloverride (wanneer ondersteund door je UI-/chatoppervlak).

## Cooldowns

Wanneer een profiel mislukt door auth-/snelheidslimietfouten (of een time-out die op snelheidslimiting lijkt), markeert OpenClaw het als in cooldown en gaat het naar het volgende profiel.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Die snelheidslimietbucket is breder dan alleen `429`: hij bevat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke limieten voor gebruiksvensters zoals `weekly/monthly limit reached`.

    Format-/ongeldige-verzoekfouten (bijvoorbeeld Cloud Code Assist-validatiefouten voor tool call-ID's) worden behandeld als failoverwaardig en gebruiken dezelfde cooldowns. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error` worden geclassificeerd als time-out-/failoversignalen.

    Algemene servertekst kan ook in die time-outbucket terechtkomen wanneer de bron overeenkomt met een bekend transient patroon. Het kale pi-ai stream-wrapperbericht `An unknown error occurred` wordt bijvoorbeeld voor elke provider als failoverwaardig behandeld, omdat pi-ai het uitzendt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-`api_error`-payloads met transient servertekst zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error` worden ook behandeld als failoverwaardige time-outs.

    OpenRouter-specifieke algemene upstreamtekst zoals het kale `Provider returned error` wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Algemene interne fallbacktekst zoals `LLM request failed with an unknown error.` blijft conservatief en triggert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Sommige provider-SDK's kunnen anders gedurende een lange `Retry-After`-periode slapen voordat ze de controle aan OpenClaw teruggeven. Voor op Stainless gebaseerde SDK's zoals Anthropic en OpenAI kapt OpenClaw SDK-interne `retry-after-ms` / `retry-after`-wachttijden standaard af op 60 seconden en geeft het langere retrybare responses onmiddellijk door, zodat dit failoverpad kan lopen. Stem de limiet af of schakel die uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Retrygedrag](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Snelheidslimietcooldowns kunnen ook modelgebonden zijn:

    - OpenClaw registreert `cooldownModel` voor snelheidslimietfouten wanneer de falende model-ID bekend is.
    - Een siblingmodel bij dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown aan een ander model is gebonden.
    - Facturerings-/uitgeschakelde vensters blokkeren nog steeds het volledige profiel voor alle modellen.

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

## Uitschakelingen door facturering

Facturerings-/kredietfouten (bijvoorbeeld "insufficient credits" / "credit balance too low") worden behandeld als failoverwaardig, maar zijn meestal niet transient. In plaats van een korte cooldown markeert OpenClaw het profiel als **uitgeschakeld** (met een langere backoff) en roteert het naar het volgende profiel/de volgende provider.

<Note>
Niet elke response die op facturering lijkt is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in de factureringsbaan, zelfs wanneer een provider in plaats daarvan `401` of `403` teruggeeft, maar providerspecifieke matchers blijven beperkt tot de provider die ze beheert (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Tijdelijke `402`-gebruikvenster- en organisatie-/werkruimte-uitgavenlimietfouten worden intussen geclassificeerd als `rate_limit` wanneer het bericht retrybaar lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het korte cooldown-/failoverpad in plaats van het lange pad voor uitschakeling door facturering.
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

Standaardwaarden:

- Factureringsbackoff begint bij **5 uur**, verdubbelt per factureringsfout en is begrensd op **24 uur**.
- Backofftellers worden gereset als het profiel **24 uur** niet heeft gefaald (configureerbaar).
- Overbelaste nieuwe pogingen staan **1 profielrotatie bij dezelfde provider** toe vóór modelfallback.
- Overbelaste nieuwe pogingen gebruiken standaard **0 ms backoff**.

## Modelfallback

Als alle profielen voor een provider falen, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor auth-fouten, snelheidslimieten en time-outs die profielrotatie hebben uitgeput (andere fouten laten fallback niet doorgaan). Providerfouten die niet genoeg details blootleggen, krijgen nog steeds een precies label in fallbackstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of bruikbare status teruggaf, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` teruggaf, en `unclassified` betekent dat OpenClaw de ruwe preview heeft behouden maar dat nog geen classifier ermee overeenkwam.

Overbelastings- en rate-limietfouten worden agressiever afgehandeld dan facturerings-cooldowns. Standaard staat OpenClaw één retry toe met een auth-profiel van dezelfde provider, en schakelt daarna zonder wachten over naar de volgende geconfigureerde modelfallback. Provider-bezet-signalen zoals `ModelNotReadyException` komen in die overbelaste categorie terecht. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een uitvoering start vanaf de geconfigureerde standaardprimary, een Cron-taakprimary, een agent-primary met expliciete fallbacks, of een automatisch geselecteerde fallback-override, kan OpenClaw de overeenkomende geconfigureerde fallbackketen doorlopen. Agent-primaries zonder expliciete fallbacks en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-provider/model-overrides) zijn strikt: als die provider/dat model onbereikbaar is of faalt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde fallback.

### Regels voor kandidaatketen

OpenClaw bouwt de kandidatenlijst op uit de momenteel gevraagde `provider/model` plus geconfigureerde fallbacks.

<AccordionGroup>
  <Accordion title="Regels">
    - Het gevraagde model staat altijd eerst.
    - Expliciet geconfigureerde fallbacks worden ontdubbeld maar niet gefilterd op de model-allowlist. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige uitvoering al op een geconfigureerde fallback in dezelfde providerfamilie zit, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Als de huidige uitvoering op een andere provider dan de configuratie zit en dat huidige model nog geen onderdeel is van de geconfigureerde fallbackketen, voegt OpenClaw geen niet-gerelateerde geconfigureerde fallbacks van een andere provider toe.
    - Wanneer er geen expliciete fallback-override aan de fallback-runner wordt geleverd, wordt de geconfigureerde primary aan het einde toegevoegd zodat de keten kan terugvallen op de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` levert, gebruikt de runner exact het gevraagde model plus die overridelijst. Een lege lijst schakelt modelfallback uit en voorkomt dat de geconfigureerde primary wordt toegevoegd als verborgen retrydoel.

  </Accordion>
</AccordionGroup>

### Welke fouten fallback voortzetten

<Tabs>
  <Tab title="Gaat door bij">
    - auth-fouten
    - rate limits en uitputting van cooldowns
    - overbelastings-/provider-bezet-fouten
    - failoverfouten met timeoutvorm
    - factureringsuitschakelingen
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad zodat een verouderd persistent model geen buitenste retrylus creëert
    - andere niet-herkende fouten wanneer er nog resterende kandidaten zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die geen timeout-/failovervorm hebben
    - context-overflowfouten die binnen compaction-/retrylogica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn

  </Tab>
</Tabs>

### Gedrag voor cooldown overslaan versus peilen

Wanneer elk auth-profiel voor een provider al in cooldown zit, slaat OpenClaw die provider niet automatisch voor altijd over. Het neemt een beslissing per kandidaat:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Persistente auth-fouten slaan direct de hele provider over.
    - Factureringsuitschakelingen slaan meestal over, maar de primary-kandidaat kan nog steeds op een throttle worden gepeild zodat herstel mogelijk is zonder opnieuw te starten.
    - De primary-kandidaat kan vlak voor het verlopen van de cooldown worden gepeild, met een throttle per provider.
    - Fallback-zusters binnen dezelfde provider kunnen ondanks cooldown worden geprobeerd wanneer de fout transient lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een rate limit modelspecifiek is en een zustermodel mogelijk direct kan herstellen.
    - Transient cooldownpeilingen zijn beperkt tot één per provider per fallback-uitvoering, zodat één provider cross-provider fallback niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessie-overrides en live modelwissel

Sessiemodelwijzigingen zijn gedeelde status. De actieve runner, de opdracht `/model`, compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat fallback-retries moeten coördineren met live modelwissel:

- Alleen expliciete gebruikersgestuurde modelwijzigingen markeren een wachtende live switch. Dat omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Systeemgestuurde modelwijzigingen zoals fallbackrotatie, heartbeat-overrides of Compaction markeren nooit uit zichzelf een wachtende live switch.
- Gebruikersgestuurde model-overrides worden behandeld als exacte selecties voor fallbackbeleid, dus een onbereikbare geselecteerde provider wordt als fout zichtbaar in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een fallback-retry start, persisteert de reply-runner de geselecteerde fallback-overridevelden naar de sessie-entry.
- Automatische fallback-overrides blijven geselecteerd bij volgende beurten zodat OpenClaw niet bij elk bericht een bekende slechte primary peilt. `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides en zetten de sessie terug naar de geconfigureerde standaard.
- `/status` toont het geselecteerde model en, wanneer de fallbackstatus verschilt, het actieve fallbackmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan persistente sessie-overrides boven verouderde runtimemodelvelden.
- Als een live-switchfout naar een latere kandidaat in de actieve fallbackketen wijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de fallbackpoging mislukt, rolt de runner alleen de overridevelden terug die hij heeft geschreven, en alleen als ze nog steeds overeenkomen met die mislukte kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primary faalt">
    Het geselecteerde primarymodel faalt.
  </Step>
  <Step title="Fallback gekozen in geheugen">
    Fallbackkandidaat wordt in het geheugen gekozen.
  </Step>
  <Step title="Sessieopslag zegt nog steeds oude primary">
    Sessieopslag weerspiegelt nog steeds de oude primary.
  </Step>
  <Step title="Live reconciliatie leest verouderde status">
    Live-sessiereconciliatie leest de verouderde sessiestatus.
  </Step>
  <Step title="Retry teruggezet">
    De retry wordt teruggezet naar het oude model voordat de fallbackpoging start.
  </Step>
</Steps>

De persistente fallback-override sluit dat venster, en de smalle rollback houdt nieuwere handmatige of runtime-sessie-wijzigingen intact.

## Observeerbaarheid en foutensamenvattingen

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte cooldownmeldingen voeden:

- geprobeerde provider/model
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failoverredenen)
- optionele status/code
- voor mensen leesbare foutensamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook vlakke `fallbackStep*`-velden wanneer een kandidaat faalt, wordt overgeslagen of een latere fallback slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnose-exporters de primary-fout kunnen reconstrueren, zelfs wanneer de terminale fallback ook faalt.

Wanneer elke kandidaat faalt, gooit OpenClaw `FallbackSummaryError`. De buitenste reply-runner kan dat gebruiken om een specifiekere melding te maken, zoals "alle modellen hebben tijdelijk een rate limit", en de vroegste cooldownvervaldatum opnemen wanneer die bekend is.

Die cooldownsamenvatting is modelbewust:

- niet-gerelateerde modelspecifieke rate limits worden genegeerd voor de geprobeerde provider/model-keten
- als de resterende blokkade een overeenkomende modelspecifieke rate limit is, meldt OpenClaw de laatste overeenkomende vervaldatum die dat model nog blokkeert

## Gerelateerde configuratie

Zie [Gateway-configuratie](/nl/gateway/configuration) voor:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routering voor `agents.defaults.imageModel`

Zie [Modellen](/nl/concepts/models) voor het bredere overzicht van modelselectie en fallback.
