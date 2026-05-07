---
read_when:
    - Je wilt standaardmodellen wijzigen of de authenticatiestatus van providers bekijken
    - Je wilt beschikbare modellen/aanbieders scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, terugvalopties, authenticatie)
title: Modellen
x-i18n:
    generated_at: "2026-05-07T13:14:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, terugvalopties, auth-profielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + `/models` slash-opdracht: [Modelconcept](/nl/concepts/models)
- Provider-auth instellen: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte opdrachten

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de opgeloste standaard-/terugvalmodellen plus een auth-overzicht.
Wanneer gebruikssnapshots van providers beschikbaar zijn, bevat de statussectie voor OAuth/API-sleutels
gebruiksvensters per provider en quotasnapshots.
Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiks-auth komt uit providerspecifieke hooks
wanneer beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth/API-sleutel-
referenties uit auth-profielen, env of configuratie.
In `--json`-uitvoer is `auth.providers` het provider-
overzicht dat rekening houdt met env/config/store, terwijl `auth.oauth` alleen de status van auth-store-profielen is.
Voeg `--probe` toe om live auth-probes uit te voeren tegen elk geconfigureerd providerprofiel.
Probes zijn echte requests (kunnen tokens verbruiken en rate limits triggeren).
Gebruik `--agent <id>` om de model-/auth-status van een geconfigureerde agent te inspecteren. Wanneer dit wordt weggelaten,
gebruikt de opdracht `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` als die zijn ingesteld, anders de
geconfigureerde standaardagent.
Proberijen kunnen afkomstig zijn uit auth-profielen, env-referenties of `models.json`.
Voor probleemoplossing rond Codex OAuth zijn `openclaw models status`,
`openclaw models auth list --provider openai-codex` en
`openclaw config get agents.defaults.model --json` de snelste manier om te
bevestigen of een agent een bruikbaar `openai-codex` auth-profiel heeft voor
`openai/*` via de native Codex-runtime. Zie [OpenAI-provider instellen](/nl/providers/openai#check-and-recover-codex-oauth-routing).

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, auth-profielen, bestaande catalogusstatus
  en catalogusrijen die eigendom zijn van providers, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  metadata van auth-profielen, env-markers, geconfigureerde providersleutels, local-provider-
  markers, AWS Bedrock env-/profielmarkers en synthetische-auth-metadata van Plugins;
  hij laadt geen provider-runtime, leest geen keychain-geheimen, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan statische catalogusrijen die eigendom zijn van providers
  bevatten uit Plugin-manifesten of gebundelde provider-catalogusmetadata, zelfs wanneer je
  nog niet bij die provider bent geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar getoond totdat overeenkomende auth is geconfigureerd.
- `models list` houdt het control plane responsief terwijl provider-catalogusdetectie
  traag is. De standaard- en geconfigureerde weergaven vallen na een korte wachttijd terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de achtergrond afronden.
  Gebruik `--all` wanneer je de exacte volledige ontdekte catalogus nodig hebt en
  bereid bent te wachten op providerdetectie.
- Brede `models list --all` voegt manifestcatalogusrijen samen boven registryrijen
  zonder provider-runtime-supplementhooks te laden. Providergefilterde snelle manifestpaden
  gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable` zijn gemarkeerd
  blijven door registry/cache ondersteund en voegen manifestrijen toe als supplementen, terwijl
  providers die als `runtime` zijn gemarkeerd op registry-/runtime-detectie blijven.
- `models list` houdt native modelmetadata en runtime-limieten gescheiden. In tabel-
  uitvoer toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtime-
  limiet verschilt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die limiet blootlegt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve provider-
  kiezers, zoals `Moonshot AI`.
- Modelrefs worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als alias, daarna
  als een unieke match bij een geconfigureerde provider voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecatiewaarschuwing.
  Als die provider het geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een
  verouderde standaard van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest de publieke `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
gebruik als terugvalmodel. De catalogus zelf is publiek, dus metadata-only scans hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw ondersteuning voor tools en afbeeldingen te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op metadata-only
uitvoer en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inferentie.

Opties:

- `--no-probe` (alleen metadata; geen configuratie-/geheimenopzoeking)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusrequest en timeout per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; metadata-only scan-
resultaten zijn informatief en worden niet toegepast op configuratie.

### Modelstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbreekt, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalbare of kommagescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` reserveert stdout voor de JSON-payload. Auth-profiel-, provider-
en opstartdiagnostiek worden naar stderr geleid, zodat scripts stdout direct
naar tools zoals `jq` kunnen pipen.

Probestatuscategorieën:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Te verwachten detail-/redencodegevallen voor probes:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` heeft het weggelaten, dus de probe rapporteert de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet geschikt/oplosbaar.
- `no_model`: provider-auth bestaat, maar OpenClaw kon geen probeerbare
  modelkandidaat voor die provider oplossen.

## Aliassen + terugvalopties

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
flow (OAuth/API-sleutel) starten of je begeleiden bij handmatig token plakken, afhankelijk van de
provider die je kiest.

`models auth list` toont opgeslagen auth-profielen voor de geselecteerde agent zonder
token-, API-sleutel- of OAuth-geheim materiaal af te drukken. Gebruik `--provider <id>` om
te filteren op één provider, zoals `openai-codex`, en `--json` voor scripting.

`models auth login` voert de auth-flow (OAuth/API-sleutel) van een provider-Plugin uit. Gebruik
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

Opmerkingen:

- `setup-token` en `paste-token` blijven generieke tokenopdrachten voor providers
  die token-auth-methoden blootleggen.
- `setup-token` vereist een interactieve TTY en voert de token-auth-
  methode van de provider uit (standaard de `setup-token`-methode van die provider wanneer deze
  er een blootlegt).
- `paste-token` accepteert een tokenstring die elders is gegenereerd of uit automatisering komt.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  die naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op vanuit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-opmerking: Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus OpenClaw behandelt Claude CLI-hergebruik en `claude -p`-gebruik als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
