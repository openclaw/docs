---
read_when:
    - U wilt standaardmodellen wijzigen of de authenticatiestatus van providers bekijken
    - Je wilt beschikbare modellen/providers scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, terugvalopties, authenticatie)
title: Modellen
x-i18n:
    generated_at: "2026-05-06T19:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, fallbacks, authenticatieprofielen).

Gerelateerd:

- Aanbieders + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + slash-opdracht `/models`: [Modelconcept](/nl/concepts/models)
- Authenticatie-instelling voor aanbieders: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte opdrachten

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de herleide standaardwaarde/fallbacks plus een authenticatieoverzicht.
Wanneer momentopnamen van providergebruik beschikbaar zijn, bevat de OAuth/API-sleutelstatussectie
gebruiksvensters en quotamomentopnamen van aanbieders.
Huidige aanbieders met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiksauthenticatie komt uit providerspecifieke hooks
wanneer beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelreferenties
uit authenticatieprofielen, omgevingsvariabelen of configuratie.
In uitvoer met `--json` is `auth.providers` het provider-overzicht dat rekening houdt met omgeving/configuratie/opslag,
terwijl `auth.oauth` alleen de gezondheid van profielen in de authenticatieopslag is.
Voeg `--probe` toe om live authenticatieprobes uit te voeren op elk geconfigureerd providerprofiel.
Probes zijn echte verzoeken (kunnen tokens verbruiken en snelheidslimieten activeren).
Gebruik `--agent <id>` om de model-/authenticatiestatus van een geconfigureerde agent te inspecteren. Wanneer dit wordt weggelaten,
gebruikt de opdracht `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` als die is ingesteld, anders de
geconfigureerde standaardagent.
Proberijen kunnen afkomstig zijn uit authenticatieprofielen, omgevingsreferenties of `models.json`.
Voor probleemoplossing met Codex OAuth zijn `openclaw models status`,
`openclaw models auth list --provider openai-codex` en
`openclaw config get agents.defaults.model --json` de snelste manier om te
bevestigen of een agent `openai-codex/*` via PI of `openai/*`
via de native Codex-runtime gebruikt. Zie [OpenAI-providerinstelling](/nl/providers/openai#check-and-recover-codex-oauth-routing).

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, authenticatieprofielen, bestaande catalogusstatus
  en door providers beheerde catalogusrijen, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  metadata van authenticatieprofielen, omgevingsmarkeringen, geconfigureerde providersleutels, lokale-provider-
  markeringen, AWS Bedrock-omgevings-/profielmarkeringen en synthetische authenticatiemetadata van Plugins;
  hij laadt geen providerruntime, leest geen geheimen uit de sleutelhanger, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan door providers beheerde statische catalogusrijen
  uit Plugin-manifesten of meegeleverde providercatalogusmetadata bevatten, zelfs wanneer je
  je nog niet bij die provider hebt geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar weergegeven totdat overeenkomende authenticatie is geconfigureerd.
- `models list` houdt het besturingsvlak responsief terwijl providercatalogusdetectie
  traag is. De standaard- en geconfigureerde weergaven vallen na een korte wachttijd terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de achtergrond voltooien.
  Gebruik `--all` wanneer je de exacte volledig gedetecteerde catalogus nodig hebt en
  bereid bent te wachten op providerdetectie.
- Brede `models list --all` voegt manifestcatalogusrijen samen bovenop registerrijen
  zonder supplement-hooks van de providerruntime te laden. Providergefilterde snelle manifestpaden
  gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable`
  zijn gemarkeerd blijven register-/cachegebaseerd en voegen manifestrijen toe als supplementen, terwijl
  providers die als `runtime` zijn gemarkeerd op register-/runtimedetectie blijven.
- `models list` houdt native modelmetadata en runtimebeperkingen gescheiden. In tabeluitvoer
  toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtimebeperking
  afwijkt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die beperking beschikbaar stelt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve providerkiezers,
  zoals `Moonshot AI`.
- Modelreferenties worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, herleidt OpenClaw de invoer eerst als alias, daarna
  als een unieke overeenkomst met een geconfigureerde provider voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een afschrijvingswaarschuwing.
  Als die provider het geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw
  terug op de eerste geconfigureerde provider/het eerste geconfigureerde model in plaats van een
  verouderde standaardwaarde van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` tonen in authenticatie-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest OpenRouters openbare `:free`-catalogus en rangschikt kandidaten voor
fallbackgebruik. De catalogus zelf is openbaar, dus scans met alleen metadata hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw ondersteuning voor tools en afbeeldingen te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op uitvoer met alleen metadata
en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inferentie.

Opties:

- `--no-probe` (alleen metadata; geen configuratie-/geheimenlookup)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusverzoek en time-out per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; scanresultaten
met alleen metadata zijn informatief en worden niet toegepast op de configuratie.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (afsluitcode 1=verlopen/ontbrekend, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde authenticatieprofielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalde of door komma's gescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` houdt stdout gereserveerd voor de JSON-payload. Diagnostiek voor authenticatieprofielen, providers
en opstarten wordt naar stderr geleid zodat scripts stdout rechtstreeks kunnen pipen
naar tools zoals `jq`.

Statuscategorieën voor probes:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Te verwachten gevallen voor probe-details/redencodes:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` heeft het weggelaten, dus de probe meldt de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet geschikt/oplosbaar.
- `no_model`: providerauthenticatie bestaat, maar OpenClaw kon geen probeerbare
  modelkandidaat voor die provider herleiden.

## Aliassen + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Authenticatieprofielen

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` is de interactieve authenticatiehulp. Deze kan een authenticatiestroom van een provider
starten (OAuth/API-sleutel) of je naar handmatig tokenplakken begeleiden, afhankelijk van de
provider die je kiest.

`models auth list` toont opgeslagen authenticatieprofielen voor de geselecteerde agent zonder
token-, API-sleutel- of OAuth-geheim materiaal af te drukken. Gebruik `--provider <id>` om
te filteren op één provider, zoals `openai-codex`, en `--json` voor scripting.

`models auth login` voert de authenticatiestroom van een provider-Plugin uit (OAuth/API-sleutel). Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om authenticatieresultaten naar een
specifieke geconfigureerde agentopslag te schrijven. De bovenliggende vlag `--agent` wordt gehonoreerd door
`add`, `list`, `login`, `setup-token`, `paste-token` en
`login-github-copilot`.

Voorbeelden:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Opmerkingen:

- `setup-token` en `paste-token` blijven generieke tokenopdrachten voor providers
  die tokenauthenticatiemethoden beschikbaar stellen.
- `setup-token` vereist een interactieve TTY en voert de tokenauthenticatie-
  methode van de provider uit (standaard de methode `setup-token` van die provider wanneer deze
  er een beschikbaar stelt).
- `paste-token` accepteert een tokenreeks die elders of door automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  deze naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op vanuit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-opmerking: medewerkers van Anthropic hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
