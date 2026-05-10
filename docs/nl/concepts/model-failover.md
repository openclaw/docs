---
read_when:
    - Auth-profielrotatie, afkoelperiodes of model-fallbackgedrag diagnosticeren
    - Failoverregels voor authenticatieprofielen of modellen bijwerken
    - Begrijpen hoe sessiemodeloverschrijvingen samenwerken met terugvalherpogingen
sidebarTitle: Model failover
summary: Hoe OpenClaw authenticatieprofielen roteert en op andere modellen terugvalt
title: Automatische overschakeling van modellen
x-i18n:
    generated_at: "2026-05-10T19:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Rotatie van auth-profielen** binnen de huidige provider.
2. **Modelterugval** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtimeregels uit en de data waarop ze zijn gebaseerd.

## Runtime-stroom

Voor een normale tekstuitvoering evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Resolve session state">
    Los het actieve sessiemodel en de voorkeur voor het auth-profiel op.
  </Step>
  <Step title="Build candidate chain">
    Bouw de keten van modelkandidaten op uit de huidige modelselectie en het terugvalbeleid voor die selectiebron. Geconfigureerde standaardwaarden, primaire cronjobs en automatisch geselecteerde terugvalmodellen kunnen geconfigureerde terugvallen gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="Try the current provider">
    Probeer de huidige provider met de regels voor rotatie/cooldown van auth-profielen.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Als die provider is uitgeput met een fout die failover rechtvaardigt, ga dan door naar de volgende modelkandidaat.
  </Step>
  <Step title="Persist fallback override">
    Sla de geselecteerde terugval-override op voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner gaat gebruiken. De opgeslagen model-override wordt gemarkeerd als `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Als de terugvalkandidaat faalt, draai dan alleen de door terugval beheerde sessie-overridevelden terug wanneer ze nog steeds overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Als elke kandidaat faalt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldown-vervaltijd wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan "de hele sessie opslaan en herstellen". De antwoord-runner slaat alleen de modelselectievelden op die hij voor terugval beheert:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dat voorkomt dat een mislukte terugvalpoging nieuwere, niet-gerelateerde sessiemutaties overschrijft, zoals handmatige `/model`-wijzigingen of sessierotatie-updates die plaatsvonden terwijl de poging liep.

## Beleid voor selectiebron

OpenClaw scheidt de geselecteerde provider/het geselecteerde model van de reden waarom die is geselecteerd. Die bron bepaalt of de terugvalketen is toegestaan:

- **Geconfigureerde standaardwaarde**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primair agentmodel**: `agents.list[].model` is strikt, tenzij dat agentmodelobject eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of geef een niet-lege lijst op om die agent modelterugval te laten gebruiken.
- **Automatische terugval-override**: een runtimeterugval schrijft `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` en het geselecteerde oorsprongsmodel voordat opnieuw wordt geprobeerd. Die automatische override kan de geconfigureerde terugvalketen blijven doorlopen en wordt gewist door `/new`, `/reset` en `sessions.reset`. Heartbeat-uitvoeringen zonder expliciet `heartbeat.model` wissen ook een directe automatische override wanneer de oorsprong niet langer overeenkomt met de huidige geconfigureerde standaardwaarde.
- **Gebruikerssessie-override**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model faalt voordat er een antwoord wordt geproduceerd, rapporteert OpenClaw de fout in plaats van te antwoorden via een niet-gerelateerde geconfigureerde terugval.
- **Legacy sessie-override**: oudere sessievermeldingen kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet in terugvalgedrag.
- **Cron-payloadmodel**: een cronjob `payload.model` / `--model` is een primaire jobselectie, geen gebruikerssessie-override. Deze gebruikt geconfigureerde terugvallen, tenzij de job `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de Cron-uitvoering strikt.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Runtime auth-routeringsstatus staat in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configuratie `auth.profiles` / `auth.order` zijn **alleen metadata + routering** (geen geheimen).
- Alleen-voor-import legacy OAuth-bestand: `~/.openclaw/credentials/oauth.json` (wordt bij eerste gebruik geïmporteerd in `auth-profiles.json`).

Meer details: [OAuth](/nl/concepts/oauth)

Credentialtypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` voor sommige providers)

## Profiel-ID's

OAuth-aanmeldingen maken afzonderlijke profielen aan, zodat meerdere accounts naast elkaar kunnen bestaan.

- Standaard: `provider:default` wanneer er geen e-mail beschikbaar is.
- OAuth met e-mail: `provider:<email>` (bijvoorbeeld `google-antigravity:user@gmail.com`).

Profielen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` onder `profiles`.

## Rotatievolgorde

Wanneer een provider meerdere profielen heeft, kiest OpenClaw een volgorde zoals deze:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (indien ingesteld).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` gefilterd op provider.
  </Step>
  <Step title="Stored profiles">
    Vermeldingen in `auth-profiles.json` voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Profielen in cooldown/uitgeschakelde profielen** worden naar het einde verplaatst, geordend op eerstvolgende vervaltijd.

### Sessiegebondenheid (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie** om providercaches warm te houden. Het roteert **niet** bij elk verzoek. Het gepinde profiel wordt hergebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (compactionteller wordt verhoogd)
- het profiel in cooldown staat/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch gepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan bij snelheidslimieten/time-outs naar een ander profiel roteren. Door de gebruiker gepinde profielen blijven aan dat profiel vastgezet; als het faalt en modelterugvallen zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### Waarom OAuth "verloren" kan lijken

Als je zowel een OAuth-profiel als een API-sleutelprofiel voor dezelfde provider hebt, kan round-robin tussen berichten tussen deze profielen wisselen, tenzij er is gepind. Om één profiel af te dwingen:

- Pin met `auth.order[provider] = ["provider:profileId"]`, of
- Gebruik een override per sessie via `/model …` met een profieloverride (wanneer ondersteund door je UI/chatoppervlak).

## Cooldowns

Wanneer een profiel faalt door auth-/snelheidslimietfouten (of een time-out die op snelheidslimitering lijkt), markeert OpenClaw het als in cooldown en gaat door naar het volgende profiel.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Die snelheidslimietbucket is breder dan alleen `429`: hij omvat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke gebruiksvensterlimieten zoals `weekly/monthly limit reached`.

    Formaat-/ongeldig-verzoekfouten zijn meestal terminaal, omdat opnieuw proberen met dezelfde payload op dezelfde manier zou falen; daarom toont OpenClaw ze in plaats van auth-profielen te roteren. Bekende retry-repairpaden kunnen expliciet meedoen: Cloud Code Assist-validatiefouten voor tool call-ID's worden bijvoorbeeld opgeschoond en één keer opnieuw geprobeerd via het beleid `allowFormatRetry`. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error` worden geclassificeerd als time-out-/failoversignalen.

    Generieke servertekst kan ook in die time-outbucket terechtkomen wanneer de bron overeenkomt met een bekend tijdelijk patroon. Het kale pi-ai stream-wrapperbericht `An unknown error occurred` wordt bijvoorbeeld voor elke provider behandeld als failoverwaardig, omdat pi-ai dit uitzendt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-`api_error`-payloads met tijdelijke servertekst zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error` worden ook behandeld als failoverwaardige time-outs.

    OpenRouter-specifieke generieke upstreamtekst zoals kaal `Provider returned error` wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Generieke interne terugvaltekst zoals `LLM request failed with an unknown error.` blijft conservatief en activeert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Sommige provider-SDK's kunnen anders gedurende een lang `Retry-After`-venster slapen voordat ze de controle teruggeven aan OpenClaw. Voor op Stainless gebaseerde SDK's zoals Anthropic en OpenAI kapt OpenClaw SDK-interne `retry-after-ms` / `retry-after`-wachttijden standaard af op 60 seconden en toont langere opnieuw-probeerbare reacties direct, zodat dit failoverpad kan lopen. Stem de limiet af of schakel deze uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Retry-gedrag](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Snelheidslimietcooldowns kunnen ook modelspecifiek zijn:

    - OpenClaw registreert `cooldownModel` voor snelheidslimietfouten wanneer de ID van het falende model bekend is.
    - Een zustermodel op dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown is beperkt tot een ander model.
    - Facturerings-/uitschakelingsvensters blokkeren nog steeds het hele profiel over modellen heen.

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

## Factureringsuitschakelingen

Facturerings-/kredietfouten (bijvoorbeeld "insufficient credits" / "credit balance too low") worden behandeld als failoverwaardig, maar zijn meestal niet tijdelijk. In plaats van een korte cooldown markeert OpenClaw het profiel als **uitgeschakeld** (met een langere backoff) en roteert het naar het volgende profiel/de volgende provider.

<Note>
Niet elk factureringsachtig antwoord is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in de factureringsroute, zelfs wanneer een provider in plaats daarvan `401` of `403` retourneert, maar provider-specifieke matchers blijven beperkt tot de provider waartoe ze behoren (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Ondertussen worden tijdelijke `402`-gebruiksvenster- en organisatie-/werkruimtebestedingslimietfouten geclassificeerd als `rate_limit` wanneer het bericht opnieuw-probeerbaar lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het korte cooldown-/failoverpad in plaats van het lange factureringsuitschakelpad.
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

- Factureringsbackoff begint bij **5 uur**, verdubbelt per factureringsfout en wordt begrensd op **24 uur**.
- Backofftellers worden gereset als het profiel **24 uur** niet heeft gefaald (configureerbaar).
- Overbelaste retries staan **1 profielrotatie bij dezelfde provider** toe vóór modelterugval.
- Overbelaste retries gebruiken standaard **0 ms backoff**.

## Modelterugval

Als alle profielen voor een provider mislukken, gaat OpenClaw door naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor authenticatiefouten, rate limits en time-outs waarbij profielrotatie is uitgeput (andere fouten laten fallback niet doorgaan). Providerfouten die niet genoeg details blootleggen, worden nog steeds precies gelabeld in de fallbackstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of status heeft geretourneerd, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` heeft geretourneerd, en `unclassified` betekent dat OpenClaw de ruwe preview heeft bewaard, maar dat er nog geen classifier op paste.

Overbelastings- en rate-limit-fouten worden agressiever afgehandeld dan facturerings-cooldowns. Standaard staat OpenClaw één retry toe met hetzelfde provider-authenticatieprofiel en schakelt daarna zonder wachten over naar de volgende geconfigureerde modelfallback. Provider-busy-signalen zoals `ModelNotReadyException` vallen in die overbelastingscategorie. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een run start vanaf de geconfigureerde standaardprimaire keuze, een primaire keuze van een cronjob, een primaire agentkeuze met expliciete fallbacks, of een automatisch geselecteerde fallback-override, kan OpenClaw de bijbehorende geconfigureerde fallbackketen doorlopen. Primaire agentkeuzes zonder expliciete fallbacks en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-provider/model-overrides) zijn strikt: als die provider/dat model onbereikbaar is of faalt voordat er een antwoord wordt geproduceerd, rapporteert OpenClaw de fout in plaats van te antwoorden via een niet-gerelateerde fallback.

### Regels voor kandidaatsketens

OpenClaw bouwt de kandidatenlijst op uit de momenteel gevraagde `provider/model` plus geconfigureerde fallbacks.

<AccordionGroup>
  <Accordion title="Regels">
    - Het gevraagde model staat altijd eerst.
    - Expliciet geconfigureerde fallbacks worden gededupliceerd, maar niet gefilterd via de model-allowlist. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige run al op een geconfigureerde fallback binnen dezelfde providerfamilie draait, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Als de huidige run op een andere provider draait dan de configuratie en dat huidige model nog geen onderdeel is van de geconfigureerde fallbackketen, voegt OpenClaw geen niet-gerelateerde geconfigureerde fallbacks van een andere provider toe.
    - Wanneer er geen expliciete fallback-override aan de fallback-runner wordt geleverd, wordt de geconfigureerde primaire keuze aan het einde toegevoegd, zodat de keten kan terugkeren naar de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` levert, gebruikt de runner exact het gevraagde model plus die override-lijst. Een lege lijst schakelt modelfallback uit en voorkomt dat de geconfigureerde primaire keuze als verborgen retrydoel wordt toegevoegd.

  </Accordion>
</AccordionGroup>

### Welke fouten fallback laten doorgaan

<Tabs>
  <Tab title="Gaat door bij">
    - authenticatiefouten
    - rate limits en uitputting van cooldowns
    - overbelastings-/provider-busy-fouten
    - failoverfouten met time-outvorm
    - uitgeschakelde facturering
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad zodat een verouderd persistent model geen buitenste retrylus veroorzaakt
    - andere niet-herkende fouten wanneer er nog resterende kandidaten zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die geen time-out-/failovervorm hebben
    - context-overflowfouten die binnen compaction-/retrylogica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn

  </Tab>
</Tabs>

### Cooldown overslaan versus probeergedrag

Wanneer elk authenticatieprofiel voor een provider al in cooldown staat, slaat OpenClaw die provider niet automatisch voorgoed over. Het neemt per kandidaat een beslissing:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Permanente authenticatiefouten slaan direct de hele provider over.
    - Uitgeschakelde facturering wordt meestal overgeslagen, maar de primaire kandidaat kan nog steeds beperkt worden geprobed zodat herstel mogelijk is zonder opnieuw te starten.
    - De primaire kandidaat kan vlak voor het verlopen van de cooldown worden geprobed, met een throttle per provider.
    - Fallbacks binnen dezelfde providerfamilie kunnen ondanks cooldown worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een rate limit modelgebonden is en een zustermodel mogelijk direct kan herstellen.
    - Tijdelijke cooldownprobes zijn beperkt tot één per provider per fallback-run, zodat één provider cross-provider fallback niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessie-overrides en live modelschakeling

Wijzigingen aan het sessiemodel zijn gedeelde status. De actieve runner, het `/model`-commando, compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat fallback-retries moeten coördineren met live modelschakeling:

- Alleen expliciete gebruikersgestuurde modelwijzigingen markeren een lopende live switch. Dat omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Systeemgestuurde modelwijzigingen zoals fallbackrotatie, heartbeat-overrides of Compaction markeren op zichzelf nooit een lopende live switch.
- Gebruikersgestuurde model-overrides worden behandeld als exacte selecties voor fallbackbeleid, zodat een onbereikbare geselecteerde provider als fout zichtbaar wordt in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een fallback-retry start, bewaart de reply-runner de geselecteerde fallback-overridevelden persistent in de sessie-entry.
- Automatische fallback-overrides blijven geselecteerd voor volgende beurten, zodat OpenClaw niet bij elk bericht een bekende slechte primaire keuze probert. `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides en zetten de sessie terug naar de geconfigureerde standaard.
- `/status` toont het geselecteerde model en, wanneer de fallbackstatus verschilt, het actieve fallbackmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan persistente sessie-overrides boven verouderde runtime-modelvelden.
- Als een live-switch-fout naar een latere kandidaat in de actieve fallbackketen wijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de fallbackpoging mislukt, draait de runner alleen de overridevelden terug die hij heeft geschreven, en alleen als ze nog steeds overeenkomen met die mislukte kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primaire keuze faalt">
    Het geselecteerde primaire model faalt.
  </Step>
  <Step title="Fallback gekozen in geheugen">
    Fallbackkandidaat wordt in geheugen gekozen.
  </Step>
  <Step title="Sessiestore vermeldt nog oude primaire keuze">
    Sessiestore weerspiegelt nog steeds de oude primaire keuze.
  </Step>
  <Step title="Live reconciliatie leest verouderde status">
    Live-sessiereconciliatie leest de verouderde sessiestatus.
  </Step>
  <Step title="Retry teruggezet">
    De retry wordt teruggezet naar het oude model voordat de fallbackpoging begint.
  </Step>
</Steps>

De persistente fallback-override sluit dat venster, en de nauwe rollback laat nieuwere handmatige of runtime-sessiewijzigingen intact.

## Observeerbaarheid en foutensamenvattingen

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte cooldownberichten voeden:

- geprobeerde provider/model
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failoverredenen)
- optionele status/code
- menselijk leesbare foutensamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat faalt, wordt overgeslagen of een latere fallback slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnostische exporters de primaire fout kunnen reconstrueren, zelfs wanneer de terminale fallback ook faalt.

Wanneer elke kandidaat faalt, gooit OpenClaw `FallbackSummaryError`. De buitenste reply-runner kan dat gebruiken om een specifieker bericht te bouwen, zoals "alle modellen zijn tijdelijk beperkt door rate limits", en de eerstvolgende cooldownvervaldatum opnemen wanneer die bekend is.

Die cooldownsamenvatting is modelbewust:

- niet-gerelateerde modelgebonden rate limits worden genegeerd voor de geprobeerde provider/model-keten
- als de resterende blokkade een overeenkomende modelgebonden rate limit is, rapporteert OpenClaw de laatste overeenkomende vervaldatum die dat model nog blokkeert

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
