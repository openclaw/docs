---
read_when:
    - Je wilt standaardmodellen wijzigen of de authenticatiestatus van providers bekijken
    - Je wilt beschikbare modellen/providers scannen en auth-profielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, terugvalopties, auth)
title: Modellen
x-i18n:
    generated_at: "2026-04-29T22:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modelontdekking, scanning en configuratie (standaardmodel, fallbacks, auth-profielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + slashcommando `/models`: [Modellenconcept](/nl/concepts/models)
- Instellen van providerauthenticatie: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte commando's

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de opgeloste standaardinstelling/fallbacks plus een auth-overzicht.
Wanneer snapshots van providergebruik beschikbaar zijn, bevat de statussectie voor OAuth/API-sleutels
vensters voor providergebruik en quotasnapshots.
Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiksaanmelding komt uit provider-specifieke hooks
wanneer die beschikbaar zijn; anders valt OpenClaw terug op overeenkomende OAuth/API-sleutelreferenties
uit auth-profielen, env of configuratie.
In `--json`-uitvoer is `auth.providers` het provider-overzicht dat rekening houdt met env/config/store,
terwijl `auth.oauth` alleen de gezondheid van auth-store-profielen is.
Voeg `--probe` toe om live auth-probes uit te voeren tegen elk geconfigureerd providerprofiel.
Probes zijn echte aanvragen (kunnen tokens verbruiken en rate limits activeren).
Gebruik `--agent <id>` om de model-/authstatus van een geconfigureerde agent te inspecteren. Indien weggelaten,
gebruikt het commando `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` als die zijn ingesteld, anders de
geconfigureerde standaardagent.
Probe-rijen kunnen afkomstig zijn uit auth-profielen, env-referenties of `models.json`.

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, auth-profielen, bestaande catalogusstatus
  en catalogusrijen van providers, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  auth-profielmetadata, env-markeringen, geconfigureerde providersleutels, local-provider-
  markeringen, AWS Bedrock-env-/profielmarkeringen en synthetische-auth-metadata van plugins;
  de kolom laadt geen providerruntime, leest geen keychain-geheimen, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan provider-eigen statische catalogusrijen bevatten
  uit pluginmanifesten of gebundelde providercatalogusmetadata, zelfs wanneer je je nog
  niet bij die provider hebt aangemeld. Die rijen worden nog steeds als niet beschikbaar weergegeven
  totdat overeenkomende auth is geconfigureerd.
- Brede `models list --all` voegt manifestcatalogusrijen samen bovenop registryrijen
  zonder supplementhooks voor providerruntime te laden. Provider-gefilterde snelle manifestpaden
  gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable`
  zijn gemarkeerd blijven registry-/cache-ondersteund en voegen manifestrijen toe als supplementen, terwijl
  providers die als `runtime` zijn gemarkeerd op registry-/runtimeontdekking blijven.
- `models list` houdt native modelmetadata en runtimecaps gescheiden. In tabeluitvoer
  toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtimecap
  verschilt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die cap aanbiedt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve providerkiezers,
  zoals `Moonshot AI`.
- Modelrefs worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), voeg dan het providerprefix toe (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als alias, daarna
  als een unieke match bij een geconfigureerde provider voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecatiewaarschuwing.
  Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een
  verouderde verwijderde-providerstandaard te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellenscan

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
fallbackgebruik. De catalogus zelf is openbaar, dus scans met alleen metadata hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw tool- en afbeeldingsondersteuning te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt het commando terug op uitvoer met alleen metadata
en legt het uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inference.

Opties:

- `--no-probe` (alleen metadata; geen config-/geheimenlookup)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusaanvraag en time-out per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; scanresultaten met alleen metadata
zijn informatief en worden niet toegepast op de configuratie.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbrekend, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalbare of kommagescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` houdt stdout gereserveerd voor de JSON-payload. Diagnostiek voor auth-profielen, providers
en opstarten wordt naar stderr geleid, zodat scripts stdout direct kunnen pipen
naar tools zoals `jq`.

Probe-statuscategorieën:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Te verwachten probe-detail-/redencodegevallen:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` liet het weg, dus de probe rapporteert de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet geschikt/oplosbaar.
- `no_model`: providerauth bestaat, maar OpenClaw kon geen te proben
  modelkandidaat voor die provider oplossen.

## Aliassen + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth-profielen

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` is de interactieve auth-helper. Die kan een providerauthflow
starten (OAuth/API-sleutel) of je begeleiden naar handmatig tokenplakken, afhankelijk van de
provider die je kiest.

`models auth login` voert de authflow van een providerplugin uit (OAuth/API-sleutel). Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om auth-resultaten naar een
specifieke geconfigureerde agentstore te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door
`add`, `login`, `setup-token`, `paste-token` en `login-github-copilot`.

Voorbeelden:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Opmerkingen:

- `setup-token` en `paste-token` blijven generieke tokencommando's voor providers
  die tokenauthmethoden aanbieden.
- `setup-token` vereist een interactieve TTY en voert de tokenauthmethode van de provider uit
  (standaard de `setup-token`-methode van die provider wanneer die er een aanbiedt).
- `paste-token` accepteert een tokenstring die elders of via automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  die naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op uit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-opmerking: Anthropic-medewerkers hebben ons verteld dat OpenClaw-stijl Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt Claude CLI-hergebruik en `claude -p`-gebruik als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als een ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
