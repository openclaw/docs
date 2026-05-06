---
read_when:
    - Je wilt standaardmodellen wijzigen of de provider-authstatus bekijken
    - Je wilt beschikbare modellen/aanbieders scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, terugvalopties, authenticatie)
title: Modellen
x-i18n:
    generated_at: "2026-05-06T09:06:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, fallbacks, auth-profielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + slash-command `/models`: [Modelconcept](/nl/concepts/models)
- Auth-installatie voor providers: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte commando's

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de opgeloste standaard/fallbacks plus een auth-overzicht.
Wanneer momentopnamen van providergebruik beschikbaar zijn, bevat de OAuth/API-key-statussectie
gebruikvensters en quotamomentopnamen per provider.
Huidige providers met gebruikvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiks-auth komt uit providerspecifieke hooks
wanneer beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth/API-key-
credentials uit auth-profielen, env of configuratie.
In `--json`-uitvoer is `auth.providers` het env/config/store-bewuste provider-
overzicht, terwijl `auth.oauth` alleen de gezondheid van auth-store-profielen is.
Voeg `--probe` toe om live auth-probes uit te voeren tegen elk geconfigureerd providerprofiel.
Probes zijn echte aanvragen (kunnen tokens verbruiken en rate limits activeren).
Gebruik `--agent <id>` om de model-/auth-status van een geconfigureerde agent te inspecteren. Wanneer weggelaten,
gebruikt het commando `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` indien ingesteld, anders de
geconfigureerde standaardagent.
Probe-rijen kunnen afkomstig zijn uit auth-profielen, env-credentials of `models.json`.

Notities:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, auth-profielen, bestaande catalogus-
  status en provider-eigen catalogusrijen, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  auth-profielmetadata, env-markeringen, geconfigureerde providersleutels, local-provider-
  markeringen, AWS Bedrock env-/profielmarkeringen en synthetische-auth-metadata van Plugins;
  deze laadt geen provider-runtime, leest geen keychain-geheimen, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan provider-eigen statische catalogus-
  rijen uit Plugin-manifesten of gebundelde provider-catalogusmetadata bevatten, zelfs wanneer je
  nog niet bij die provider bent geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar weergegeven totdat overeenkomende auth is geconfigureerd.
- `models list` houdt het control plane responsief terwijl provider-catalogus-
  detectie traag is. De standaard- en geconfigureerde weergaven vallen na korte tijd terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de achtergrond afronden.
  Gebruik `--all` wanneer je de exacte volledig gedetecteerde catalogus nodig hebt en
  bereid bent op providerdetectie te wachten.
- Brede `models list --all` voegt manifest-catalogusrijen samen over registry-rijen
  zonder provider-runtime-supplementhooks te laden. Provider-gefilterde manifest-
  snelle paden gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable`
  zijn gemarkeerd blijven registry/cache-backed en voegen manifestrijen als supplementen toe, terwijl
  providers die als `runtime` zijn gemarkeerd op registry/runtime-detectie blijven.
- `models list` houdt native modelmetadata en runtime-limieten gescheiden. In tabel-
  uitvoer toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtime-
  limiet verschilt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die limiet beschikbaar stelt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve provider-
  kiezers, zoals `Moonshot AI`.
- Modelreferenties worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als alias, daarna
  als unieke match van een geconfigureerde provider voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecatiewaarschuwing.
  Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een verouderde
  standaard van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
fallback-gebruik. De catalogus zelf is openbaar, dus metadata-only-scans hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw ondersteuning voor tools en afbeeldingen te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt het commando terug op metadata-only-
uitvoer en legt het uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inference.

Opties:

- `--no-probe` (alleen metadata; geen config-/geheimenlookup)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusaanvraag en timeout per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; metadata-only-scan-
resultaten zijn informatief en worden niet op de configuratie toegepast.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbrekend, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalde of komma-gescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` houdt stdout gereserveerd voor de JSON-payload. Diagnostiek voor auth-profielen, provider
en opstarten wordt naar stderr geleid, zodat scripts stdout direct
naar tools zoals `jq` kunnen pipen.

Probe-statusgroepen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Te verwachten gevallen voor probe-details/reason-codes:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` heeft het weggelaten, dus de probe rapporteert de uitsluiting in plaats van
  deze te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet geschikt/oplosbaar.
- `no_model`: provider-auth bestaat, maar OpenClaw kon geen probe-bare
  modelkandidaat voor die provider oplossen.

## Aliassen + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth-profielen

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` is de interactieve auth-helper. Deze kan een provider-auth-
flow (OAuth/API-key) starten of je begeleiden bij het handmatig plakken van een token, afhankelijk van de
provider die je kiest.

`models auth list` toont opgeslagen auth-profielen voor de geselecteerde agent zonder
token-, API-key- of OAuth-geheim materiaal af te drukken. Gebruik `--provider <id>` om
op één provider te filteren, zoals `openai-codex`, en `--json` voor scripting.

`models auth login` voert de auth-flow van een provider-Plugin uit (OAuth/API-key). Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om auth-resultaten naar een
specifieke geconfigureerde agent-store te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door
`add`, `list`, `login`, `setup-token`, `paste-token` en
`login-github-copilot`.

Voorbeelden:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Notities:

- `setup-token` en `paste-token` blijven generieke tokencommando's voor providers
  die token-auth-methoden beschikbaar stellen.
- `setup-token` vereist een interactieve TTY en voert de token-auth-
  methode van de provider uit (standaard de `setup-token`-methode van die provider wanneer deze
  er een beschikbaar stelt).
- `paste-token` accepteert een tokenreeks die elders of door automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  deze naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` meegeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op vanuit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-notitie: Anthropic-medewerkers hebben ons verteld dat OpenClaw-stijl Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
