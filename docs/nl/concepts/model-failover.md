---
read_when:
    - Auth-profielrotatie, cooldowns of model-fallbackgedrag diagnosticeren
    - Failoverregels voor auth-profielen of modellen bijwerken
    - Begrijpen hoe sessiemodeloverschrijvingen samenwerken met fallback-pogingen
sidebarTitle: Model failover
summary: Hoe OpenClaw auth-profielen roteert en terugvalt over modellen heen
title: Modelfailover
x-i18n:
    generated_at: "2026-07-04T15:25:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw handelt fouten in twee fasen af:

1. **Rotatie van auth-profielen** binnen de huidige provider.
2. **Model fallback** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtime-regels uit en de data waarop ze zijn gebaseerd.

## Runtime-flow

Voor een normale tekstrun evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Sessie-status oplossen">
    Los het actieve sessiemodel en de voorkeur voor het auth-profiel op.
  </Step>
  <Step title="Kandidatenketen bouwen">
    Bouw de modelkandidatenketen op basis van de huidige modelselectie en het fallback-beleid voor die selectiebron. Geconfigureerde standaardwaarden, primaire cronjobs en automatisch geselecteerde fallback-modellen kunnen geconfigureerde fallbacks gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="De huidige provider proberen">
    Probeer de huidige provider met regels voor rotatie/cooldown van auth-profielen.
  </Step>
  <Step title="Doorgaan bij failover-waardige fouten">
    Als die provider is uitgeput met een failover-waardige fout, ga dan naar de volgende modelkandidaat.
  </Step>
  <Step title="Fallback-override bewaren">
    Bewaar de geselecteerde fallback-override voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner gaat gebruiken. De bewaarde modeloverride wordt gemarkeerd als `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Nauw terugdraaien bij mislukking">
    Als de fallback-kandidaat faalt, draai dan alleen de door fallback beheerde sessie-overridevelden terug wanneer ze nog steeds overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="FallbackSummaryError gooien indien uitgeput">
    Als elke kandidaat faalt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldown-vervaltijd wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan "de hele sessie opslaan en herstellen". De reply-runner bewaart alleen de modelselectievelden die hij voor fallback beheert:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dit voorkomt dat een mislukte fallback-herpoging nieuwere, niet-gerelateerde sessiemutaties overschrijft, zoals handmatige `/model`-wijzigingen of sessierotatie-updates die plaatsvonden terwijl de poging liep.

## Beleid voor selectiebron

OpenClaw scheidt de geselecteerde provider/het geselecteerde model van waarom die selectie is gemaakt. Die bron bepaalt of de fallback-keten is toegestaan:

- **Geconfigureerde standaardwaarde**: `agents.defaults.model.primary` gebruikt `agents.defaults.model.fallbacks`.
- **Primaire agent**: `agents.list[].model` is strikt tenzij dat agentmodelobject zijn eigen `fallbacks` bevat. Gebruik `fallbacks: []` om het strikte gedrag expliciet te maken, of geef een niet-lege lijst op om die agent model fallback te laten gebruiken.
- **Automatische fallback-override**: een runtime-fallback schrijft `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` en het geselecteerde oorsprongsmodel voordat opnieuw wordt geprobeerd. Die automatische override kan de geconfigureerde fallback-keten blijven doorlopen zonder bij elk bericht de primaire te testen, maar OpenClaw test periodiek opnieuw de geconfigureerde oorsprong en wist de automatische override wanneer die herstelt. `/new`, `/reset` en `sessions.reset` wissen ook automatisch afkomstige overrides. Heartbeat-runs zonder expliciete `heartbeat.model` wissen directe automatische overrides wanneer hun oorsprong niet langer overeenkomt met de huidige geconfigureerde standaardwaarde.
- **Gebruikerssessie-override**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model faalt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde geconfigureerde fallback.
- **Verouderde sessie-override**: oudere sessie-items kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet in fallback-gedrag.
- **Cron-payloadmodel**: een cronjob `payload.model` / `--model` is een primaire job, geen gebruikerssessie-override. Het gebruikt geconfigureerde fallbacks tenzij de job `payload.fallbacks` levert; `payload.fallbacks: []` maakt de cron-run strikt.

Het interval voor de primaire test van automatische fallback is vijf minuten en is niet configureerbaar. OpenClaw onthoudt recente tests per sessie en primair model, zodat een falende primaire niet bij elke beurt opnieuw wordt geprobeerd. OpenClaw stuurt een zichtbare melding wanneer een sessie naar fallback gaat en nog een melding wanneer deze terugkeert naar de geselecteerde primaire; de melding wordt niet bij elke sticky fallback-beurt herhaald.

## Skipcache voor auth-fouten

Standaard behoudt elke nieuwe beurt het bestaande fallback-herpogingsgedrag: OpenClaw
probeert elke geconfigureerde fallback-kandidaat opnieuw, inclusief niet-primaire
kandidaten die recent faalden met `auth` of `auth_permanent`.

Operators die zulke herhaalde auth-fouten liever onderdrukken, kunnen dit inschakelen met:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wanneer ingeschakeld, registreert OpenClaw een in-memory, sessiegebonden skipmarkering voor een
niet-primaire fallback-kandidaat na een fout uit de auth-klasse. De markering is keyed
op sessie-id, provider en model. Primaire kandidaten worden nooit overgeslagen, zodat een
expliciete gebruikersmodelselectie nog steeds de echte auth-fout toont. De cache is
proceslokaal en wordt gewist bij herstart van de Gateway.

De waarde is een TTL in milliseconden. `0` of een niet-ingestelde waarde schakelt de cache uit.
Positieve waarden worden begrensd tussen 1 seconde en 10 minuten.

## Gebruikerszichtbare fallback-meldingen

Wanneer een sessie naar een automatisch geselecteerde fallback gaat, stuurt OpenClaw een statusmelding in hetzelfde reply-oppervlak:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wanneer een latere test slaagt en de sessie terugkeert naar de geselecteerde primaire, stuurt OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Deze meldingen zijn operationele berichten, geen assistant-inhoud. Ze worden één keer per statuswijziging geleverd, inclusief side-effect-only beurten wanneer haalbaar, maar sticky fallback-beurten herhalen ze niet. Levering omzeilt normale onderdrukking van bron-replies, de melding gebruikt niet het eerste assistant-replyslot voor threaded kanalen en wordt uitgesloten van tekst-naar-spraak en commitment-extractie.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen en runtime-status voor auth-routering staan in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Configuratie `auth.profiles` / `auth.order` is **alleen metadata + routering** (geen geheimen).
- Verouderd OAuth-bestand alleen voor import: `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in de auth-store per agent).
- Verouderde bestanden `auth-profiles.json`, `auth-state.json` en per-agent `auth.json` worden geïmporteerd door `openclaw doctor --fix`.

Meer details: [OAuth](/nl/concepts/oauth)

Referentietypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` voor sommige providers)

## Profiel-id's

OAuth-logins maken afzonderlijke profielen, zodat meerdere accounts naast elkaar kunnen bestaan.

- Standaard: `provider:default` wanneer er geen e-mail beschikbaar is.
- OAuth met e-mail: `provider:<email>` (bijvoorbeeld `google-antigravity:user@gmail.com`).

Profielen staan in de auth-profielstore per agent in `openclaw-agent.sqlite`.

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
    SQLite-authprofielitems per agent voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Cooldown-/uitgeschakelde profielen** worden naar het einde verplaatst, geordend op de eerstvolgende vervaltijd.

### Sessiestickiness (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie vast** om providercaches warm te houden. Het roteert **niet** bij elk verzoek. Het vastgepinde profiel wordt hergebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (compaction count wordt verhoogd)
- het profiel in cooldown/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch vastgepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan bij rate limits/time-outs naar een ander profiel roteren. Wanneer het oorspronkelijke profiel weer beschikbaar komt, kunnen nieuwe runs het opnieuw verkiezen zonder het geselecteerde model of de runtime te wijzigen. Door de gebruiker vastgepinde profielen blijven vergrendeld op dat profiel; als het faalt en model-fallbacks zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### OpenAI Codex-abonnement plus API-sleutelback-up

Voor OpenAI-agentmodellen zijn auth en runtime gescheiden. `openai/gpt-*` blijft op
de Codex-harness terwijl auth kan roteren tussen een Codex-abonnementsprofiel en
een OpenAI API-sleutelback-up.

Gebruik `auth.order.openai` voor de gebruikersgerichte volgorde:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Gebruik `openai:*` voor zowel ChatGPT/Codex OAuth-profielen als OpenAI API-sleutelprofielen.
Wanneer het abonnement een Codex-gebruikslimiet bereikt,
registreert OpenClaw de exacte resettijd wanneer Codex die levert, probeert het het volgende
geordende auth-profiel en houdt het de run binnen de Codex-harness. Zodra de resettijd
is verstreken, komt het abonnementsprofiel weer in aanmerking en kan de volgende automatische
selectie ernaar terugkeren.

Gebruik een door de gebruiker vastgepind profiel alleen wanneer je één account/sleutel voor die
sessie wilt afdwingen. Door de gebruiker vastgepinde profielen zijn bewust strikt en springen niet stilzwijgend
naar een ander profiel.

## Cooldowns

Wanneer een profiel faalt door auth-/rate-limitfouten (of een time-out die op rate limiting lijkt), markeert OpenClaw het als in cooldown en gaat het naar het volgende profiel.

<AccordionGroup>
  <Accordion title="Wat in de rate-limit-/time-outbucket belandt">
    Die rate-limitbucket is breder dan alleen `429`: hij omvat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke gebruiksvensterlimieten zoals `weekly/monthly limit reached`.

    Format-/invalid-request-fouten zijn meestal terminaal omdat opnieuw proberen met dezelfde payload op dezelfde manier zou falen, dus OpenClaw toont ze in plaats van auth-profielen te roteren. Bekende retry-repair-paden kunnen zich expliciet aanmelden: bijvoorbeeld validatiefouten voor Cloud Code Assist tool call-ID's worden opgeschoond en één keer opnieuw geprobeerd via het `allowFormatRetry`-beleid. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error` worden geclassificeerd als time-out-/failover-signalen.

    Generieke servertekst kan ook in die time-outbucket belanden wanneer de bron overeenkomt met een bekend tijdelijk patroon. Bijvoorbeeld het kale stream-wrapperbericht van de modelruntime `An unknown error occurred` wordt voor elke provider behandeld als failover-waardig, omdat de gedeelde modelruntime dit uitzendt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON-`api_error`-payloads met tijdelijke servertekst zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error` worden ook behandeld als failover-waardige time-outs.

    OpenRouter-specifieke generieke upstreamtekst zoals kaal `Provider returned error` wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Generieke interne fallback-tekst zoals `LLM request failed with an unknown error.` blijft conservatief en triggert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK-caps voor retry-after">
    Sommige provider-SDK's kunnen anders gedurende een lange `Retry-After`-periode slapen voordat ze de controle teruggeven aan OpenClaw. Voor op Stainless gebaseerde SDK's zoals Anthropic en OpenAI kapt OpenClaw SDK-interne wachttijden voor `retry-after-ms` / `retry-after` standaard af op 60 seconden en geeft langere opnieuw te proberen responses direct door, zodat dit failover-pad kan worden uitgevoerd. Stem de cap af of schakel die uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Retry-gedrag](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Modelgebonden cooldowns">
    Rate-limit-cooldowns kunnen ook modelgebonden zijn:

    - OpenClaw registreert `cooldownModel` voor rate-limit-fouten wanneer de id van het falende model bekend is.
    - Een verwant model bij dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown aan een ander model is gebonden.
    - Vensters voor facturering/uitgeschakeld blokkeren nog steeds het hele profiel over modellen heen.

  </Accordion>
</AccordionGroup>

Cooldowns gebruiken exponentiële backoff:

- 1 minuut
- 5 minuten
- 25 minuten
- 1 uur (cap)

Status wordt opgeslagen in de per-agent SQLite-authstatus onder `usageStats`:

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

## Facturering schakelt uit

Facturerings-/tegoedfouten (bijvoorbeeld "insufficient credits" / "credit balance too low") worden behandeld als geschikt voor failover, maar zijn meestal niet tijdelijk. In plaats van een korte cooldown markeert OpenClaw het profiel als **uitgeschakeld** (met een langere backoff) en roteert het naar het volgende profiel/de volgende provider.

<Note>
Niet elke response met factureringsvorm is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in het factureringspad, zelfs wanneer een provider in plaats daarvan `401` of `403` teruggeeft, maar providerspecifieke matchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Tijdelijke `402`-fouten voor gebruiksvensters en bestedingslimieten van organisatie/werkruimte worden ondertussen geclassificeerd als `rate_limit` wanneer het bericht opnieuw te proberen lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het korte cooldown-/failover-pad in plaats van het lange pad voor uitschakeling wegens facturering.
</Note>

Status wordt opgeslagen in de per-agent SQLite-authstatus:

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

- Backoff voor facturering begint bij **5 uur**, verdubbelt per factureringsfout en kapt af op **24 uur**.
- Backoff-tellers worden gereset als het profiel **24 uur** niet is mislukt (configureerbaar).
- Overbelaste retries staan **1 profielrotatie bij dezelfde provider** toe vóór modelfallback.
- Overbelaste retries gebruiken standaard **0 ms backoff**.

## Modelfallback

Als alle profielen voor een provider mislukken, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor auth-fouten, rate limits en time-outs waarvoor profielrotatie is uitgeput (andere fouten laten fallback niet doorgaan). Providerfouten die onvoldoende details blootstellen, worden nog steeds nauwkeurig gelabeld in fallbackstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of bruikbare status teruggaf, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` teruggaf, en `unclassified` betekent dat OpenClaw de ruwe preview heeft behouden, maar dat er nog geen classifier op paste.

Overbelaste fouten en rate-limit-fouten worden agressiever afgehandeld dan factureringscooldowns. Standaard staat OpenClaw één auth-profielretry bij dezelfde provider toe en schakelt daarna zonder wachten over naar de volgende geconfigureerde modelfallback. Provider-bezet-signalen zoals `ModelNotReadyException` komen in die overbelaste bucket terecht. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een run start vanaf de geconfigureerde standaardprimaire waarde, een primaire waarde van een Cron-taak, een agentprimaire waarde met expliciete fallbacks, of een automatisch geselecteerde fallback-override, kan OpenClaw de bijpassende geconfigureerde fallback-keten doorlopen. Agentprimaire waarden zonder expliciete fallbacks en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-provider-/modeloverrides) zijn strikt: als die provider/dat model onbereikbaar is of mislukt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde fallback.

### Regels voor kandidaatketen

OpenClaw bouwt de kandidatenlijst op uit de momenteel aangevraagde `provider/model` plus geconfigureerde fallbacks.

<AccordionGroup>
  <Accordion title="Regels">
    - Het aangevraagde model staat altijd eerst.
    - Expliciet geconfigureerde fallbacks worden gededupliceerd maar niet gefilterd door de model-allowlist. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige run al op een geconfigureerde fallback in dezelfde providerfamilie draait, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Wanneer er geen expliciete fallback-override is opgegeven, worden geconfigureerde fallbacks geprobeerd vóór de geconfigureerde primaire waarde, zelfs als het aangevraagde model een andere provider gebruikt.
    - Wanneer er geen expliciete fallback-override aan de fallback-runner wordt opgegeven, wordt de geconfigureerde primaire waarde aan het einde toegevoegd, zodat de keten kan terugvallen op de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een caller `fallbacksOverride` opgeeft, gebruikt de runner exact het aangevraagde model plus die override-lijst. Een lege lijst schakelt modelfallback uit en voorkomt dat de geconfigureerde primaire waarde wordt toegevoegd als verborgen retry-doel.

  </Accordion>
</AccordionGroup>

### Welke fouten fallback laten doorgaan

<Tabs>
  <Tab title="Gaat door bij">
    - auth-fouten
    - rate limits en uitputting van cooldowns
    - overbelaste/provider-bezet-fouten
    - failover-fouten met time-outvorm
    - uitschakelingen wegens facturering
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failover-pad zodat een verouderd opgeslagen model geen buitenste retry-lus maakt
    - andere niet-herkende fouten wanneer er nog kandidaten over zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die geen time-out-/failover-vorm hebben
    - context-overflowfouten die binnen compaction-/retry-logica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn
    - veiligheidsweigeringen van Claude Fable 5; directe API-key-aanvragen handelen die in plaats daarvan op providerniveau af via Anthropic's server-side fallback naar `claude-opus-4-8` (zie [Anthropic](/nl/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Cooldown overslaan versus probe-gedrag

Wanneer elk auth-profiel voor een provider al in cooldown is, slaat OpenClaw die provider niet automatisch voor altijd over. Het neemt een beslissing per kandidaat:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Aanhoudende auth-fouten slaan de hele provider direct over.
    - Uitschakelingen wegens facturering slaan meestal over, maar de primaire kandidaat kan nog steeds throttled worden geprobed zodat herstel mogelijk is zonder opnieuw op te starten.
    - De primaire kandidaat kan dicht bij het verlopen van de cooldown worden geprobed, met een throttle per provider.
    - Fallback-verwanten bij dezelfde provider kunnen ondanks cooldown worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een rate limit modelgebonden is en een verwant model mogelijk nog direct kan herstellen.
    - Tijdelijke cooldown-probes zijn beperkt tot één per provider per fallback-run, zodat één provider cross-provider fallback niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessie-overrides en live modelschakeling

Sessiemodelwijzigingen zijn gedeelde status. De actieve runner, de opdracht `/model`, compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat fallback-retries moeten coördineren met live modelschakeling:

- Alleen expliciete door de gebruiker gestuurde modelwijzigingen markeren een pending live switch. Dat omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Door het systeem gestuurde modelwijzigingen zoals fallback-rotatie, heartbeat-overrides of compaction markeren nooit uit zichzelf een pending live switch.
- Door de gebruiker gestuurde modeloverrides worden behandeld als exacte selecties voor fallbackbeleid, zodat een onbereikbare geselecteerde provider als fout verschijnt in plaats van te worden gemaskeerd door `agents.defaults.model.fallbacks`.
- Voordat een fallback-retry start, slaat de reply-runner de geselecteerde fallback-overridevelden op in de sessie-entry.
- Automatische fallback-overrides blijven geselecteerd tijdens volgende beurten, zodat OpenClaw niet bij elk bericht een bekende slechte primaire waarde probeit. OpenClaw probeit periodiek opnieuw de geconfigureerde oorsprong en wist de automatische override wanneer die herstelt; `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides direct.
- Gebruikersantwoorden kondigen fallback-overgangen en herstel waarbij fallback is gewist één keer per statuswijziging aan. Sticky fallback-beurten herhalen de melding niet.
- `/status` toont het geselecteerde model en, wanneer fallbackstatus verschilt, het actieve fallbackmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan opgeslagen sessie-overrides boven verouderde runtimemodelvelden.
- Als een live-switch-fout wijst naar een latere kandidaat in de actieve fallback-keten, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de fallbackpoging mislukt, rolt de runner alleen de overridevelden terug die hij schreef, en alleen als ze nog steeds overeenkomen met die mislukte kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primaire waarde mislukt">
    Het geselecteerde primaire model mislukt.
  </Step>
  <Step title="Fallback in geheugen gekozen">
    Fallback-kandidaat wordt in het geheugen gekozen.
  </Step>
  <Step title="Sessiestore zegt nog oude primaire waarde">
    Sessiestore weerspiegelt nog steeds de oude primaire waarde.
  </Step>
  <Step title="Live reconciliatie leest verouderde status">
    Live-sessiereconciliatie leest de verouderde sessiestatus.
  </Step>
  <Step title="Retry teruggeklikt">
    De retry wordt teruggeklikt naar het oude model voordat de fallbackpoging start.
  </Step>
</Steps>

De opgeslagen fallback-override sluit dat venster, en de smalle rollback houdt nieuwere handmatige of runtime-sessiewijzigingen intact.

## Observeerbaarheid en foutoverzichten

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte cooldown-berichten voeden:

- provider/model geprobeerd
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failover-redenen)
- optionele status/code
- menselijk leesbare foutsamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat mislukt, wordt overgeslagen of een latere fallback slaagt. Deze velden maken de poging tot overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnostische exporters de primaire fout kunnen reconstrueren, zelfs wanneer de terminale fallback ook mislukt.

Wanneer elke kandidaat mislukt, gooit OpenClaw `FallbackSummaryError`. De buitenste reply-runner kan dat gebruiken om een specifieker bericht te bouwen, zoals "alle modellen zijn tijdelijk rate-limited", en het eerstvolgende cooldown-vervalmoment opnemen wanneer dat bekend is.

Dat cooldown-overzicht is modelbewust:

- niet-gerelateerde modelgebonden rate limits worden genegeerd voor de geprobeerde provider-/modelketen
- als de resterende blokkade een overeenkomende modelgebonden rate limit is, meldt OpenClaw het laatste overeenkomende vervalmoment dat dat model nog blokkeert

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
