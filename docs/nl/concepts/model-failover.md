---
read_when:
    - Diagnose van rotatie van authenticatieprofielen, afkoelperiodes of terugvalgedrag van modellen
    - Failoverregels voor auth-profielen of modellen bijwerken
    - Inzicht in hoe modeloverrides voor sessies zich verhouden tot fallback-herhalingspogingen
sidebarTitle: Model failover
summary: Hoe OpenClaw authenticatieprofielen roteert en tussen modellen terugvalt
title: Modeluitwijk
x-i18n:
    generated_at: "2026-05-06T09:09:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Auth-profielrotatie** binnen de huidige provider.
2. **Model-fallback** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtimeregels uit en de gegevens waarop ze zijn gebaseerd.

## Runtimeflow

Voor een normale tekstuitvoering evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Sessie-status oplossen">
    Los het actieve sessiemodel en de auth-profielvoorkeur op.
  </Step>
  <Step title="Kandidaatketen bouwen">
    Bouw de modelkandidaatketen op basis van de huidige modelselectie en het fallbackbeleid voor die selectiebron. Geconfigureerde standaarden, primaire cron-jobmodellen en automatisch geselecteerde fallbackmodellen kunnen geconfigureerde fallbacks gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="Huidige provider proberen">
    Probeer de huidige provider met auth-profielrotatie- en cooldownregels.
  </Step>
  <Step title="Doorgaan bij failoverwaardige fouten">
    Als die provider is uitgeput met een failoverwaardige fout, ga dan naar de volgende modelkandidaat.
  </Step>
  <Step title="Fallback-override bewaren">
    Bewaar de geselecteerde fallback-override voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner gaat gebruiken. De bewaarde model-override wordt gemarkeerd als `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Beperkt terugdraaien bij mislukking">
    Als de fallbackkandidaat mislukt, draai dan alleen de door fallback beheerde sessie-overridevelden terug wanneer ze nog steeds overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="FallbackSummaryError gooien indien uitgeput">
    Als elke kandidaat mislukt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldownverloopdatum wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan "de hele sessie opslaan en herstellen". De reply runner bewaart alleen de modelselectievelden die hij beheert voor fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dat voorkomt dat een mislukte fallbackpoging nieuwere, niet-gerelateerde sessiemutaties overschrijft, zoals handmatige `/model`-wijzigingen of sessierotatie-updates die plaatsvonden terwijl de poging werd uitgevoerd.

## Beleid voor selectiebron

OpenClaw scheidt de geselecteerde provider/het geselecteerde model van de reden waarom deze is geselecteerd. Die bron bepaalt of de fallbackketen is toegestaan:

- **Geconfigureerde standaard**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primair agentmodel**: `agents.list[].model` is strikt, tenzij dat agentmodelobject eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of geef een niet-lege lijst op om model-fallback voor die agent in te schakelen.
- **Automatische fallback-override**: een runtimefallback schrijft `providerOverride`, `modelOverride` en `modelOverrideSource: "auto"` voordat opnieuw wordt geprobeerd. Die automatische override kan de geconfigureerde fallbackketen blijven doorlopen en wordt gewist door `/new`, `/reset` en `sessions.reset`.
- **Gebruikerssessie-override**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model mislukt voordat er een antwoord is geproduceerd, rapporteert OpenClaw de fout in plaats van te antwoorden via een niet-gerelateerde geconfigureerde fallback.
- **Verouderde sessie-override**: oudere sessie-items kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet naar fallbackgedrag.
- **Cron-payloadmodel**: een cron-job `payload.model` / `--model` is een primair jobmodel, geen gebruikerssessie-override. Het gebruikt geconfigureerde fallbacks, tenzij de job `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de Cron-run strikt.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (verouderd: `~/.openclaw/agent/auth-profiles.json`).
- Runtime-auth-routeringsstatus staat in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configuratie `auth.profiles` / `auth.order` is **alleen metadata + routering** (geen geheimen).
- Verouderd OAuth-bestand alleen voor import: `~/.openclaw/credentials/oauth.json` (wordt bij eerste gebruik geïmporteerd in `auth-profiles.json`).

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
    Items in `auth-profiles.json` voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Profielen in cooldown/uitgeschakelde profielen** worden naar het einde verplaatst, gesorteerd op eerstvolgende verloopdatum.

### Sessiekleefkracht (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie** om providercaches warm te houden. Het roteert **niet** bij elke aanvraag. Het gepinde profiel wordt opnieuw gebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (Compaction-teller wordt verhoogd)
- het profiel in cooldown/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch gepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan bij ratelimits/time-outs naar een ander profiel roteren. Door de gebruiker gepinde profielen blijven vastgezet op dat profiel; als het mislukt en model-fallbacks zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### Waarom OAuth "verloren kan lijken"

Als je zowel een OAuth-profiel als een API-sleutelprofiel voor dezelfde provider hebt, kan round-robin tussen berichten wisselen, tenzij het profiel is gepind. Om één profiel af te dwingen:

- Pin met `auth.order[provider] = ["provider:profileId"]`, of
- Gebruik een override per sessie via `/model …` met een profieloverride (wanneer ondersteund door je UI/chatoppervlak).

## Cooldowns

Wanneer een profiel mislukt door auth-/ratelimitfouten (of een time-out die op ratelimiting lijkt), markeert OpenClaw het als in cooldown en gaat naar het volgende profiel.

<AccordionGroup>
  <Accordion title="Wat in de ratelimit- / time-outbucket terechtkomt">
    Die ratelimitbucket is breder dan alleen `429`: hij bevat ook providermeldingen zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke gebruiksvensterlimieten zoals `weekly/monthly limit reached`.

    Formaat-/ongeldige-aanvraagfouten (bijvoorbeeld Cloud Code Assist-validatiefouten voor toolaanroep-ID's) worden behandeld als failoverwaardig en gebruiken dezelfde cooldowns. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error` worden geclassificeerd als time-out-/failoversignalen.

    Generieke servertekst kan ook in die time-outbucket terechtkomen wanneer de bron overeenkomt met een bekend tijdelijk patroon. Zo wordt de kale pi-ai stream-wrappermelding `An unknown error occurred` als failoverwaardig behandeld voor elke provider, omdat pi-ai die uitstuurt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-`api_error`-payloads met tijdelijke servertekst zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error` worden ook behandeld als failoverwaardige time-outs.

    OpenRouter-specifieke generieke upstreamtekst zoals kale `Provider returned error` wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Generieke interne fallbacktekst zoals `LLM request failed with an unknown error.` blijft conservatief en triggert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK retry-after-caps">
    Sommige provider-SDK's zouden anders gedurende een lang `Retry-After`-venster kunnen slapen voordat ze controle teruggeven aan OpenClaw. Voor Stainless-gebaseerde SDK's zoals Anthropic en OpenAI kapt OpenClaw SDK-interne `retry-after-ms` / `retry-after`-wachttijden standaard af op 60 seconden en geeft langere opnieuw te proberen responses direct door, zodat dit failoverpad kan lopen. Stem de cap af of schakel hem uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Retrygedrag](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Modelgescopeerde cooldowns">
    Ratelimitcooldowns kunnen ook modelgescopeerd zijn:

    - OpenClaw registreert `cooldownModel` voor ratelimitfouten wanneer het falende model-ID bekend is.
    - Een zustermodel op dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown is gescopeerd op een ander model.
    - Facturerings-/uitgeschakelde vensters blokkeren nog steeds het hele profiel voor alle modellen.

  </Accordion>
</AccordionGroup>

Cooldowns gebruiken exponentiële back-off:

- 1 minuut
- 5 minuten
- 25 minuten
- 1 uur (cap)

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

Facturerings-/kredietfouten (bijvoorbeeld "onvoldoende credits" / "creditsaldo te laag") worden behandeld als failoverwaardig, maar zijn meestal niet tijdelijk. In plaats van een korte cooldown markeert OpenClaw het profiel als **uitgeschakeld** (met een langere back-off) en roteert naar het volgende profiel/de volgende provider.

<Note>
Niet elke factureringsvormige response is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in het factureringspad, zelfs wanneer een provider in plaats daarvan `401` of `403` retourneert, maar providerspecifieke matchers blijven gescopeerd tot de provider die ze beheert (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Ondertussen worden tijdelijke `402`-gebruiksvenster- en organisatie-/werkruimte-uitgavelimietfouten geclassificeerd als `rate_limit` wanneer het bericht opnieuw te proberen lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het korte cooldown-/failoverpad in plaats van het lange factureringsuitschakelingspad.
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

- Factureringsback-off begint bij **5 uur**, verdubbelt per factureringsfout en heeft een cap van **24 uur**.
- Back-offtellers worden gereset als het profiel **24 uur** niet is mislukt (configureerbaar).
- Overbelaste nieuwe pogingen staan **1 profielrotatie bij dezelfde provider** toe vóór model-fallback.
- Overbelaste nieuwe pogingen gebruiken standaard **0 ms back-off**.

## Model-fallback

Als alle profielen voor een provider mislukken, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor auth-fouten, ratelimits en time-outs waarbij profielrotatie is uitgeput (andere fouten zetten fallback niet voort). Providerfouten die niet genoeg details blootleggen, krijgen nog steeds een precies label in fallbackstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of bruikbare status retourneerde, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` retourneerde, en `unclassified` betekent dat OpenClaw de ruwe preview heeft behouden, maar dat er nog geen classifier op paste.

Overbelastings- en rate-limitfouten worden agressiever afgehandeld dan factureringscooldowns. Standaard staat OpenClaw één retry met hetzelfde provider-auth-profiel toe en schakelt daarna zonder wachten over naar de volgende geconfigureerde modelterugval. Provider-bezetsignalen zoals `ModelNotReadyException` komen in die overbelastingscategorie terecht. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een run start vanaf de geconfigureerde standaardprimaire keuze, een primaire keuze van een cronjob, een agent-primaire keuze met expliciete terugvalopties, of een automatisch geselecteerde terugvaloverride, kan OpenClaw de bijpassende geconfigureerde terugvalketen doorlopen. Agent-primaire keuzes zonder expliciete terugvalopties en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-provider-/modeloverrides) zijn strikt: als die provider/dat model onbereikbaar is of faalt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden via een niet-gerelateerde terugvaloptie.

### Regels voor de kandidatenketen

OpenClaw bouwt de kandidatenlijst op vanuit de momenteel aangevraagde `provider/model` plus geconfigureerde terugvalopties.

<AccordionGroup>
  <Accordion title="Regels">
    - Het aangevraagde model staat altijd eerst.
    - Expliciet geconfigureerde terugvalopties worden ontdubbeld, maar niet gefilterd op basis van de model-allowlist. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige run al op een geconfigureerde terugvaloptie binnen dezelfde providerfamilie draait, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Als de huidige run op een andere provider draait dan de configuratie en dat huidige model nog geen deel uitmaakt van de geconfigureerde terugvalketen, voegt OpenClaw geen niet-gerelateerde geconfigureerde terugvalopties van een andere provider toe.
    - Wanneer er geen expliciete terugvaloverride aan de terugvalrunner wordt geleverd, wordt de geconfigureerde primaire keuze aan het einde toegevoegd, zodat de keten kan terugvallen naar de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` levert, gebruikt de runner precies het aangevraagde model plus die overridelijst. Een lege lijst schakelt modelterugval uit en voorkomt dat de geconfigureerde primaire keuze als verborgen retrydoel wordt toegevoegd.

  </Accordion>
</AccordionGroup>

### Welke fouten terugval voortzetten

<Tabs>
  <Tab title="Gaat door bij">
    - auth-fouten
    - rate limits en uitputting van cooldowns
    - overbelastings-/provider-bezetfouten
    - failoverfouten met timeout-vorm
    - factureringsuitschakelingen
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad zodat een verouderd persistent model geen buitenste retrylus veroorzaakt
    - andere niet-herkende fouten wanneer er nog resterende kandidaten zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die geen timeout-/failover-vorm hebben
    - context-overflowfouten die binnen compaction-/retrylogica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn

  </Tab>
</Tabs>

### Cooldown overslaan versus probeergedrag

Wanneer elk auth-profiel voor een provider al in cooldown staat, slaat OpenClaw die provider niet automatisch voorgoed over. Het neemt per kandidaat een beslissing:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Aanhoudende auth-fouten slaan de hele provider onmiddellijk over.
    - Factureringsuitschakelingen slaan meestal over, maar de primaire kandidaat kan nog steeds op een throttle worden geprobeerd zodat herstel mogelijk is zonder opnieuw te starten.
    - De primaire kandidaat kan vlak bij het verlopen van de cooldown worden geprobeerd, met een throttle per provider.
    - Terugvalsiblings binnen dezelfde provider kunnen ondanks cooldown worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een rate limit modelspecifiek is en een siblingmodel mogelijk onmiddellijk kan herstellen.
    - Tijdelijke cooldownprobes zijn beperkt tot één per provider per terugvalrun, zodat één provider de terugval naar andere providers niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessieoverrides en live modelwisselingen

Sessiemodelwijzigingen zijn gedeelde staat. De actieve runner, de opdracht `/model`, compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat terugvalretries moeten coördineren met live modelwisselingen:

- Alleen expliciete door de gebruiker gestuurde modelwijzigingen markeren een wachtende livewisseling. Dat omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Door het systeem gestuurde modelwijzigingen, zoals terugvalrotatie, Heartbeat-overrides of Compaction, markeren nooit zelfstandig een wachtende livewisseling.
- Door de gebruiker gestuurde modeloverrides worden voor terugvalbeleid behandeld als exacte selecties, zodat een onbereikbare geselecteerde provider als fout zichtbaar wordt in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een terugvalretry start, bewaart de reply-runner de geselecteerde terugvaloverridevelden in de sessie-entry.
- Automatische terugvaloverrides blijven geselecteerd bij volgende beurten, zodat OpenClaw niet bij elk bericht een bekende slechte primaire keuze probeert. `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides en zetten de sessie terug naar de geconfigureerde standaard.
- `/status` toont het geselecteerde model en, wanneer de terugvalstatus verschilt, het actieve terugvalmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan persistente sessieoverrides boven verouderde runtime-modelvelden.
- Als een livewisselfout naar een latere kandidaat in de actieve terugvalketen wijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de terugvalpoging mislukt, draait de runner alleen de overridevelden terug die hij heeft geschreven, en alleen als ze nog steeds overeenkomen met die mislukte kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primaire keuze faalt">
    Het geselecteerde primaire model faalt.
  </Step>
  <Step title="Terugval in geheugen gekozen">
    Terugvalkandidaat wordt in het geheugen gekozen.
  </Step>
  <Step title="Sessiestore vermeldt nog steeds oude primaire keuze">
    De sessiestore weerspiegelt nog steeds de oude primaire keuze.
  </Step>
  <Step title="Live reconciliatie leest verouderde staat">
    Live-sessiereconciliatie leest de verouderde sessiestaat.
  </Step>
  <Step title="Retry teruggezet">
    De retry wordt teruggezet naar het oude model voordat de terugvalpoging start.
  </Step>
</Steps>

De persistente terugvaloverride sluit dat venster, en de smalle rollback houdt nieuwere handmatige of runtime-sessiewijzigingen intact.

## Observatie en foutensamenvattingen

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte cooldownberichten voeden:

- geprobeerd(e) provider/model
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failoverredenen)
- optionele status/code
- voor mensen leesbare foutensamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat faalt, wordt overgeslagen of een latere terugval slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnose-exporters de primaire fout kunnen reconstrueren, zelfs wanneer de uiteindelijke terugval ook faalt.

Wanneer elke kandidaat faalt, gooit OpenClaw `FallbackSummaryError`. De buitenste reply-runner kan dat gebruiken om een specifieker bericht te bouwen, zoals "alle modellen zijn tijdelijk rate-limited", en de vroegste cooldownvervaldatum opnemen wanneer die bekend is.

Die cooldownsamenvatting is modelbewust:

- niet-gerelateerde modelspecifieke rate limits worden genegeerd voor de geprobeerde provider-/modelketen
- als de resterende blokkade een overeenkomende modelspecifieke rate limit is, meldt OpenClaw de laatste overeenkomende vervaldatum die dat model nog steeds blokkeert

## Gerelateerde configuratie

Zie [Gateway-configuratie](/nl/gateway/configuration) voor:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-routering

Zie [Modellen](/nl/concepts/models) voor het bredere overzicht van modelselectie en terugval.
