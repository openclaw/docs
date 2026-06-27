---
read_when:
    - Auth-profielrotatie, cooldowns of model-fallbackgedrag diagnosticeren
    - Failoverregels voor auth-profielen of modellen bijwerken
    - Begrijpen hoe modeloverschrijvingen voor sessies samenwerken met fallback-herhalingen
sidebarTitle: Model failover
summary: Hoe OpenClaw auth-profielen roteert en terugvalt tussen modellen
title: Model-failover
x-i18n:
    generated_at: "2026-06-27T17:27:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw verwerkt fouten in twee fasen:

1. **Rotatie van auth-profielen** binnen de huidige provider.
2. **Modelfallback** naar het volgende model in `agents.defaults.model.fallbacks`.

Dit document legt de runtime-regels uit en de gegevens waarop ze zijn gebaseerd.

## Runtime-flow

Voor een normale tekstrun evalueert OpenClaw kandidaten in deze volgorde:

<Steps>
  <Step title="Resolve session state">
    Los het actieve sessiemodel en de voorkeur voor het auth-profiel op.
  </Step>
  <Step title="Build candidate chain">
    Bouw de keten met modelkandidaten op basis van de huidige modelselectie en het fallbackbeleid voor die selectiebron. Geconfigureerde standaardwaarden, primaire modellen voor cronjobs en automatisch geselecteerde fallbackmodellen kunnen geconfigureerde fallbacks gebruiken; expliciete gebruikerssessieselecties zijn strikt.
  </Step>
  <Step title="Try the current provider">
    Probeer de huidige provider met de regels voor rotatie/cooldown van auth-profielen.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Als die provider is uitgeput met een fout die failover rechtvaardigt, ga dan naar de volgende modelkandidaat.
  </Step>
  <Step title="Persist fallback override">
    Sla de geselecteerde fallback-override op voordat de nieuwe poging start, zodat andere sessielezers dezelfde provider/hetzelfde model zien dat de runner gaat gebruiken. De opgeslagen model-override wordt gemarkeerd als `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Als de fallbackkandidaat mislukt, draai dan alleen de sessie-overridevelden terug die eigendom zijn van fallback wanneer ze nog steeds overeenkomen met die mislukte kandidaat.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Als elke kandidaat mislukt, gooi dan een `FallbackSummaryError` met details per poging en de eerstvolgende cooldown-vervaltijd wanneer die bekend is.
  </Step>
</Steps>

Dit is bewust beperkter dan "de hele sessie opslaan en herstellen". De reply runner bewaart alleen de modelselectievelden die hij voor fallback bezit:

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
- **Automatische fallback-override**: een runtimefallback schrijft `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` en het geselecteerde oorsprongsmodel voordat opnieuw wordt geprobeerd. Die automatische override kan de geconfigureerde fallbackketen blijven doorlopen zonder het primaire model bij elk bericht te testen, maar OpenClaw test periodiek opnieuw de geconfigureerde oorsprong en wist de automatische override wanneer die herstelt. `/new`, `/reset` en `sessions.reset` wissen ook overrides met automatische bron. Heartbeat-runs zonder expliciete `heartbeat.model` wissen directe automatische overrides wanneer hun oorsprong niet langer overeenkomt met de huidige geconfigureerde standaardwaarde.
- **Gebruikerssessie-override**: `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` schrijven `modelOverrideSource: "user"`. Dat is een exacte sessieselectie. Als de geselecteerde provider/het geselecteerde model mislukt voordat er een antwoord wordt geproduceerd, rapporteert OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde geconfigureerde fallback.
- **Verouderde sessie-override**: oudere sessie-items kunnen `modelOverride` hebben zonder `modelOverrideSource`. OpenClaw behandelt die als gebruikersoverrides, zodat een expliciete oude selectie niet stilzwijgend wordt omgezet naar fallbackgedrag.
- **Cron-payloadmodel**: een cronjob `payload.model` / `--model` is een primair jobmodel, geen gebruikerssessie-override. Het gebruikt geconfigureerde fallbacks tenzij de job `payload.fallbacks` opgeeft; `payload.fallbacks: []` maakt de cronrun strikt.

Het interval voor automatische fallbacktests van het primaire model is vijf minuten en is niet configureerbaar. OpenClaw onthoudt recente tests per sessie en primair model, zodat een falend primair model niet bij elke beurt opnieuw wordt geprobeerd. OpenClaw stuurt een zichtbare melding wanneer een sessie naar fallback verschuift en nog een melding wanneer die terugkeert naar het geselecteerde primaire model; de melding wordt niet bij elke vaste fallbackbeurt herhaald.

## Skip-cache voor auth-fouten

Standaard behoudt elke nieuwe beurt het bestaande gedrag voor fallbackpogingen: OpenClaw
probeert elke geconfigureerde fallbackkandidaat opnieuw, inclusief niet-primaire
kandidaten die recent zijn mislukt met `auth` of `auth_permanent`.

Operators die deze herhaalde auth-fouten liever onderdrukken, kunnen dit inschakelen met:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wanneer dit is ingeschakeld, registreert OpenClaw een in-memory, sessiegebonden skipmarkering voor een
niet-primaire fallbackkandidaat na een fout uit de auth-klasse. De markering wordt gesleuteld
op sessie-id, provider en model. Primaire kandidaten worden nooit overgeslagen, zodat een
expliciete gebruikersmodelselectie nog steeds de echte auth-fout toont. De cache is
proceslokaal en wordt gewist bij een Gateway-herstart.

De waarde is een TTL in milliseconden. `0` of een niet-ingestelde waarde schakelt de cache uit.
Positieve waarden worden begrensd tussen 1 seconde en 10 minuten.

## Gebruikerszichtbare fallbackmeldingen

Wanneer een sessie naar een automatisch geselecteerde fallback verschuift, stuurt OpenClaw een statusmelding in hetzelfde antwoordoppervlak:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wanneer een latere test slaagt en de sessie terugkeert naar het geselecteerde primaire model, stuurt OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Deze meldingen zijn operationele berichten, geen assistentinhoud. Ze worden eenmaal per statuswijziging geleverd, inclusief beurten met alleen bijwerkingen wanneer haalbaar, maar vaste fallbackbeurten herhalen ze niet. Levering omzeilt normale onderdrukking van bronantwoorden, de melding neemt niet het eerste assistentantwoordslot in beslag voor threaded kanalen, en ze wordt uitgesloten van tekst-naar-spraak en extractie van toezeggingen.

## Auth-opslag (sleutels + OAuth)

OpenClaw gebruikt **auth-profielen** voor zowel API-sleutels als OAuth-tokens.

- Geheimen en runtime-status voor auth-routering bevinden zich in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Configuratie `auth.profiles` / `auth.order` zijn **alleen metadata + routering** (geen geheimen).
- Verouderd OAuth-bestand alleen voor import: `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in de auth-store per agent).
- Verouderde bestanden `auth-profiles.json`, `auth-state.json` en `auth.json` per agent worden geïmporteerd door `openclaw doctor --fix`.

Meer details: [OAuth](/nl/concepts/oauth)

Credentialtypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` voor sommige providers)

## Profiel-id's

OAuth-logins maken afzonderlijke profielen, zodat meerdere accounts naast elkaar kunnen bestaan.

- Standaard: `provider:default` wanneer geen e-mail beschikbaar is.
- OAuth met e-mail: `provider:<email>` (bijvoorbeeld `google-antigravity:user@gmail.com`).

Profielen bevinden zich in de auth-profielstore `openclaw-agent.sqlite` per agent.

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
    SQLite-auth-profielitems per agent voor de provider.
  </Step>
</Steps>

Als er geen expliciete volgorde is geconfigureerd, gebruikt OpenClaw een round-robinvolgorde:

- **Primaire sleutel:** profieltype (**OAuth vóór API-sleutels**).
- **Secundaire sleutel:** `usageStats.lastUsed` (oudste eerst, binnen elk type).
- **Profielen in cooldown/uitgeschakelde profielen** worden naar het einde verplaatst, geordend op eerstvolgende vervaltijd.

### Sessievastheid (cachevriendelijk)

OpenClaw **pint het gekozen auth-profiel per sessie vast** om providercaches warm te houden. Het roteert **niet** bij elk verzoek. Het vastgepinde profiel wordt hergebruikt totdat:

- de sessie wordt gereset (`/new` / `/reset`)
- een Compaction is voltooid (compaction-teller wordt verhoogd)
- het profiel in cooldown staat/uitgeschakeld is

Handmatige selectie via `/model …@<profileId>` stelt een **gebruikersoverride** in voor die sessie en wordt niet automatisch geroteerd totdat een nieuwe sessie start.

<Note>
Automatisch vastgepinde profielen (geselecteerd door de sessierouter) worden behandeld als een **voorkeur**: ze worden eerst geprobeerd, maar OpenClaw kan bij rate limits/time-outs naar een ander profiel roteren. Wanneer het oorspronkelijke profiel weer beschikbaar wordt, kunnen nieuwe runs het opnieuw verkiezen zonder het geselecteerde model of de runtime te wijzigen. Door de gebruiker vastgepinde profielen blijven vergrendeld op dat profiel; als het mislukt en modelfallbacks zijn geconfigureerd, gaat OpenClaw naar het volgende model in plaats van van profiel te wisselen.
</Note>

### OpenAI Codex-abonnement plus API-sleutelback-up

Voor OpenAI-agentmodellen zijn auth en runtime gescheiden. `openai/gpt-*` blijft op
de Codex-harness, terwijl auth kan roteren tussen een Codex-abonnementsprofiel en
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

Gebruik `openai:*` voor zowel ChatGPT/Codex OAuth-profielen als OpenAI API-sleutelprofielen. Wanneer het abonnement een Codex-gebruikslimiet bereikt,
registreert OpenClaw de exacte reset-tijd wanneer Codex die verstrekt, probeert het volgende
geordende auth-profiel en houdt de run binnen de Codex-harness. Zodra de reset-tijd is verstreken, komt het abonnementsprofiel opnieuw in aanmerking en kan de volgende automatische
selectie ernaar terugkeren.

Gebruik een door de gebruiker vastgepind profiel alleen wanneer je één account/sleutel voor die
sessie wilt afdwingen. Door de gebruiker vastgepinde profielen zijn bewust strikt en springen niet stilzwijgend
naar een ander profiel.

## Cooldowns

Wanneer een profiel mislukt door auth-/rate-limitfouten (of een time-out die op rate limiting lijkt), markeert OpenClaw het als in cooldown en gaat het naar het volgende profiel.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Die rate-limitbucket is breder dan alleen `429`: hij omvat ook providerberichten zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` en periodieke gebruiksvensterlimieten zoals `weekly/monthly limit reached`.

    Format-/ongeldige-verzoekfouten zijn meestal terminaal, omdat dezelfde payload opnieuw proberen op dezelfde manier zou mislukken, dus OpenClaw toont ze in plaats van auth-profielen te roteren. Bekende paden voor retry-repair kunnen zich expliciet aanmelden: bijvoorbeeld validatiefouten voor Cloud Code Assist tool call-ID's worden opgeschoond en eenmaal opnieuw geprobeerd via het `allowFormatRetry`-beleid. OpenAI-compatibele stopredenfouten zoals `Unhandled stop reason: error`, `stop reason: error` en `reason: error` worden geclassificeerd als time-out-/failoversignalen.

    Generieke servertekst kan ook in die time-outbucket terechtkomen wanneer de bron overeenkomt met een bekend tijdelijk patroon. Het kale stream-wrapperbericht van de modelruntime `An unknown error occurred` wordt bijvoorbeeld voor elke provider behandeld als failoverwaardig, omdat de gedeelde modelruntime dit uitzendt wanneer providerstreams eindigen met `stopReason: "aborted"` of `stopReason: "error"` zonder specifieke details. JSON `api_error`-payloads met tijdelijke servertekst zoals `internal server error`, `unknown error, 520`, `upstream error` of `backend error` worden ook behandeld als failoverwaardige time-outs.

    OpenRouter-specifieke generieke upstreamtekst zoals kaal `Provider returned error` wordt alleen als time-out behandeld wanneer de providercontext daadwerkelijk OpenRouter is. Generieke interne fallbacktekst zoals `LLM request failed with an unknown error.` blijft conservatief en activeert op zichzelf geen failover.

  </Accordion>
  <Accordion title="SDK retry-after-limieten">
    Sommige provider-SDK's kunnen anders gedurende een lange `Retry-After`-periode slapen voordat ze de controle teruggeven aan OpenClaw. Voor SDK's op basis van Stainless, zoals Anthropic en OpenAI, begrenst OpenClaw standaard SDK-interne wachttijden voor `retry-after-ms` / `retry-after` op 60 seconden en geeft het langere opnieuw probeerbare antwoorden onmiddellijk door, zodat dit failoverpad kan worden uitgevoerd. Stem de limiet af of schakel die uit met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zie [Opnieuw proberen](/nl/concepts/retry).
  </Accordion>
  <Accordion title="Modelgebonden cooldowns">
    Cooldowns voor snelheidslimieten kunnen ook modelgebonden zijn:

    - OpenClaw registreert `cooldownModel` voor snelheidslimietfouten wanneer de id van het falende model bekend is.
    - Een zustermodel bij dezelfde provider kan nog steeds worden geprobeerd wanneer de cooldown aan een ander model is gebonden.
    - Facturerings-/uitgeschakelde vensters blokkeren nog steeds het hele profiel over modellen heen.

  </Accordion>
</AccordionGroup>

Cooldowns gebruiken exponentiële backoff:

- 1 minuut
- 5 minuten
- 25 minuten
- 1 uur (limiet)

Status wordt opgeslagen in de SQLite-auth-status per agent onder `usageStats`:

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
Niet elk antwoord dat op facturering lijkt is `402`, en niet elke HTTP-`402` komt hier terecht. OpenClaw houdt expliciete factureringstekst in het factureringspad, zelfs wanneer een provider in plaats daarvan `401` of `403` retourneert, maar provider-specifieke matchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter `403 Key limit exceeded`).

Tijdelijke `402`-fouten voor gebruiksvensters en bestedingslimieten van organisatie/werkruimte worden intussen geclassificeerd als `rate_limit` wanneer het bericht opnieuw probeerbaar lijkt (bijvoorbeeld `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` of `organization spending limit exceeded`). Die blijven op het korte cooldown-/failoverpad in plaats van op het lange pad voor uitschakeling wegens facturering.
</Note>

Status wordt opgeslagen in de SQLite-auth-status per agent:

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

- Backoff voor facturering begint bij **5 uur**, verdubbelt per factureringsfout en is begrensd op **24 uur**.
- Backoff-tellers worden gereset als het profiel **24 uur** niet heeft gefaald (configureerbaar).
- Overbelaste nieuwe pogingen staan **1 profielrotatie bij dezelfde provider** toe vóór modelterugval.
- Overbelaste nieuwe pogingen gebruiken standaard **0 ms backoff**.

## Modelterugval

Als alle profielen voor een provider falen, gaat OpenClaw naar het volgende model in `agents.defaults.model.fallbacks`. Dit geldt voor auth-fouten, snelheidslimieten en time-outs waarbij profielrotatie is uitgeput (andere fouten laten terugval niet doorgaan). Providerfouten die niet genoeg detail blootleggen, worden nog steeds precies gelabeld in de terugvalstatus: `empty_response` betekent dat de provider geen bruikbaar bericht of bruikbare status retourneerde, `no_error_details` betekent dat de provider expliciet `Unknown error (no error details in response)` retourneerde, en `unclassified` betekent dat OpenClaw de ruwe preview heeft bewaard, maar dat nog geen classifier erop overeenkwam.

Overbelaste fouten en snelheidslimietfouten worden agressiever behandeld dan cooldowns voor facturering. Standaard staat OpenClaw één nieuwe poging met een auth-profiel van dezelfde provider toe en schakelt het daarna zonder wachten over naar de volgende geconfigureerde modelterugval. Signalen dat de provider bezet is, zoals `ModelNotReadyException`, vallen in die overbelaste categorie. Stem dit af met `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` en `auth.cooldowns.rateLimitedProfileRotations`.

Wanneer een run start vanaf de geconfigureerde standaardprimaire, een primaire van een Cron-taak, een primaire agent met expliciete terugvallen of een automatisch geselecteerde terugvaloverride, kan OpenClaw de overeenkomende geconfigureerde terugvalketen doorlopen. Primaire agents zonder expliciete terugvallen en expliciete gebruikersselecties (bijvoorbeeld `/model ollama/qwen3.5:27b`, de modelkiezer, `sessions.patch` of eenmalige CLI-provider-/modeloverrides) zijn strikt: als die provider/dat model onbereikbaar is of faalt voordat er een antwoord wordt geproduceerd, meldt OpenClaw de fout in plaats van te antwoorden vanuit een niet-gerelateerde terugval.

### Regels voor kandidaatketens

OpenClaw bouwt de kandidatenlijst op uit het momenteel aangevraagde `provider/model` plus geconfigureerde terugvallen.

<AccordionGroup>
  <Accordion title="Regels">
    - Het aangevraagde model staat altijd eerst.
    - Expliciet geconfigureerde terugvallen worden ontdubbeld maar niet gefilterd door de modelallowlist. Ze worden behandeld als expliciete operatorintentie.
    - Als de huidige run al op een geconfigureerde terugval in dezelfde providerfamilie draait, blijft OpenClaw de volledige geconfigureerde keten gebruiken.
    - Wanneer geen expliciete terugvaloverride wordt geleverd, worden geconfigureerde terugvallen geprobeerd vóór de geconfigureerde primaire, zelfs als het aangevraagde model een andere provider gebruikt.
    - Wanneer geen expliciete terugvaloverride aan de terugvalrunner wordt geleverd, wordt de geconfigureerde primaire aan het einde toegevoegd, zodat de keten kan terugvallen op de normale standaard zodra eerdere kandidaten zijn uitgeput.
    - Wanneer een aanroeper `fallbacksOverride` levert, gebruikt de runner precies het aangevraagde model plus die overridelijst. Een lege lijst schakelt modelterugval uit en voorkomt dat de geconfigureerde primaire wordt toegevoegd als verborgen doel voor opnieuw proberen.

  </Accordion>
</AccordionGroup>

### Welke fouten laten terugval doorgaan

<Tabs>
  <Tab title="Gaat door bij">
    - auth-fouten
    - snelheidslimieten en uitgeputte cooldowns
    - overbelaste/provider-bezette fouten
    - time-outvormige failoverfouten
    - uitschakelingen wegens facturering
    - `LiveSessionModelSwitchError`, die wordt genormaliseerd naar een failoverpad zodat een verouderd persistent model geen buitenste retry-loop maakt
    - andere niet-herkende fouten wanneer er nog resterende kandidaten zijn

  </Tab>
  <Tab title="Gaat niet door bij">
    - expliciete afbrekingen die geen time-out-/failovervorm hebben
    - contextoverloopfouten die binnen de Compaction-/retry-logica moeten blijven (bijvoorbeeld `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` of `ollama error: context length exceeded`)
    - een laatste onbekende fout wanneer er geen kandidaten meer over zijn

  </Tab>
</Tabs>

### Gedrag bij cooldown overslaan versus peilen

Wanneer elk auth-profiel voor een provider al in cooldown is, slaat OpenClaw die provider niet automatisch voorgoed over. Het neemt een beslissing per kandidaat:

<AccordionGroup>
  <Accordion title="Beslissingen per kandidaat">
    - Persistente auth-fouten slaan de hele provider onmiddellijk over.
    - Uitschakelingen wegens facturering slaan meestal over, maar de primaire kandidaat kan nog steeds op een throttle worden gepeild, zodat herstel mogelijk is zonder opnieuw te starten.
    - De primaire kandidaat kan rond het aflopen van de cooldown worden gepeild, met een throttle per provider.
    - Terugval-zustermodellen bij dezelfde provider kunnen ondanks cooldown worden geprobeerd wanneer de fout tijdelijk lijkt (`rate_limit`, `overloaded` of onbekend). Dit is vooral relevant wanneer een snelheidslimiet modelgebonden is en een zustermodel mogelijk onmiddellijk kan herstellen.
    - Tijdelijke cooldown-peilingen zijn beperkt tot één per provider per terugvalrun, zodat één provider terugval naar andere providers niet ophoudt.

  </Accordion>
</AccordionGroup>

## Sessieoverrides en live modelschakeling

Sessiemodelwijzigingen zijn gedeelde status. De actieve runner, het commando `/model`, Compaction-/sessie-updates en live-sessiereconciliatie lezen of schrijven allemaal delen van dezelfde sessie-entry.

Dat betekent dat terugvalpogingen moeten coördineren met live modelschakeling:

- Alleen expliciete door de gebruiker gestuurde modelwijzigingen markeren een pending live switch. Dit omvat `/model`, `session_status(model=...)` en `sessions.patch`.
- Systeemgestuurde modelwijzigingen zoals terugvalrotatie, Heartbeat-overrides of Compaction markeren zelf nooit een pending live switch.
- Door de gebruiker gestuurde modeloverrides worden voor terugvalbeleid behandeld als exacte selecties, zodat een onbereikbare geselecteerde provider als fout zichtbaar wordt in plaats van gemaskeerd te worden door `agents.defaults.model.fallbacks`.
- Voordat een terugvalpoging start, persisteert de reply runner de geselecteerde terugvaloverridevelden naar de sessie-entry.
- Automatische terugvaloverrides blijven geselecteerd in volgende beurten, zodat OpenClaw niet bij elk bericht een bekende slechte primaire peilt. OpenClaw peilt periodiek opnieuw de geconfigureerde oorsprong en wist de automatische override wanneer die herstelt; `/new`, `/reset` en `sessions.reset` wissen automatisch afkomstige overrides onmiddellijk.
- Gebruikersantwoorden kondigen terugvalovergangen en herstel waarbij terugval is gewist eenmaal per statuswijziging aan. Sticky terugvalbeurten herhalen de melding niet.
- `/status` toont het geselecteerde model en, wanneer de terugvalstatus verschilt, het actieve terugvalmodel en de reden.
- Live-sessiereconciliatie geeft de voorkeur aan gepersisteerde sessieoverrides boven verouderde runtime-modelvelden.
- Als een live-switchfout naar een latere kandidaat in de actieve terugvalketen wijst, springt OpenClaw direct naar dat geselecteerde model in plaats van eerst niet-gerelateerde kandidaten te doorlopen.
- Als de terugvalpoging faalt, draait de runner alleen de overridevelden terug die hij heeft geschreven, en alleen als ze nog steeds overeenkomen met die gefaalde kandidaat.

Dit voorkomt de klassieke race:

<Steps>
  <Step title="Primaire faalt">
    Het geselecteerde primaire model faalt.
  </Step>
  <Step title="Terugval in geheugen gekozen">
    Terugvalkandidaat wordt in geheugen gekozen.
  </Step>
  <Step title="Sessiestore zegt nog steeds oude primaire">
    Sessiestore weerspiegelt nog steeds de oude primaire.
  </Step>
  <Step title="Live-reconciliatie leest verouderde status">
    Live-sessiereconciliatie leest de verouderde sessiestatus.
  </Step>
  <Step title="Nieuwe poging teruggesprongen">
    De nieuwe poging wordt teruggesprongen naar het oude model voordat de terugvalpoging start.
  </Step>
</Steps>

De gepersisteerde terugvaloverride sluit dat venster, en de smalle rollback houdt nieuwere handmatige of runtime-sessiewijzigingen intact.

## Observeerbaarheid en foutensamenvattingen

`runWithModelFallback(...)` registreert details per poging die logs en gebruikersgerichte cooldownberichten voeden:

- provider/model geprobeerd
- reden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` en vergelijkbare failoverredenen)
- optionele status/code
- menselijk leesbare foutensamenvatting

Gestructureerde `model_fallback_decision`-logs bevatten ook platte `fallbackStep*`-velden wanneer een kandidaat faalt, wordt overgeslagen of een latere terugval slaagt. Deze velden maken de geprobeerde overgang expliciet (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), zodat log- en diagnostische exporters de primaire fout kunnen reconstrueren, zelfs wanneer de terminale terugval ook faalt.

Wanneer elke kandidaat faalt, gooit OpenClaw `FallbackSummaryError`. De buitenste reply runner kan dat gebruiken om een specifieker bericht te bouwen, zoals "alle modellen zijn tijdelijk beperkt door snelheidslimieten", en de vroegste cooldownvervaldatum opnemen wanneer die bekend is.

Die cooldownsamenvatting is modelbewust:

- niet-gerelateerde modelgebonden snelheidslimieten worden genegeerd voor de geprobeerde provider-/modelketen
- als de resterende blokkade een overeenkomende modelgebonden snelheidslimiet is, meldt OpenClaw de laatste overeenkomende vervaldatum die dat model nog steeds blokkeert

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
