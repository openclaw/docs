---
read_when:
    - Je wilt standaardmodellen wijzigen of de auth-status van providers bekijken
    - Je wilt beschikbare modellen/providers scannen en auth-profielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, fallbacks, auth)
title: Modellen
x-i18n:
    generated_at: "2026-06-27T17:21:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, fallbacks, auth-profielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + `/models` slash-command: [Modelconcept](/nl/concepts/models)
- Auth-installatie voor providers: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte opdrachten

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de opgeloste standaard/fallbacks plus een auth-overzicht.
Wanneer snapshots van providergebruik beschikbaar zijn, bevat de sectie OAuth/API-sleutelstatus
gebruikvensters en quotasnapshots van providers.
Huidige providers met gebruikvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi en z.ai. Gebruiks-auth komt uit providerspecifieke hooks
wanneer die beschikbaar zijn; anders valt OpenClaw terug op overeenkomende OAuth/API-sleutel-
referenties uit auth-profielen, env of configuratie.
In `--json`-uitvoer is `auth.providers` het env/config/store-bewuste provider-
overzicht, terwijl `auth.oauth` alleen de status van auth-storeprofielen is.
Voeg `--probe` toe om live auth-probes uit te voeren tegen elk geconfigureerd providerprofiel.
Probes zijn echte verzoeken (kunnen tokens verbruiken en rate limits activeren).
Gebruik `--agent <id>` om de model/auth-status van een geconfigureerde agent te inspecteren. Wanneer dit wordt weggelaten,
gebruikt de opdracht `OPENCLAW_AGENT_DIR` als die is ingesteld, anders de
geconfigureerde standaardagent.
Probe-rijen kunnen afkomstig zijn uit auth-profielen, env-referenties of `models.json`.
Voor probleemoplossing rond OpenAI ChatGPT/Codex OAuth zijn `openclaw models status`,
`openclaw models auth list --provider openai` en
`openclaw config get agents.defaults.model --json` de snelste manier om te
bevestigen of een agent een bruikbaar `openai` OAuth-profiel heeft voor
`openai/*` via de native Codex-runtime. Zie [OpenAI-providerinstallatie](/nl/providers/openai#check-and-recover-codex-oauth-routing).

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, auth-profielen, bestaande catalogus-
  status en provider-eigen catalogusrijen, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  metadata van auth-profielen, env-markeringen, geconfigureerde providersleutels, lokale-provider-
  markeringen, AWS Bedrock env/profielmarkeringen en synthetische-authmetadata van plugins;
  de provider-runtime wordt niet geladen, keychain-geheimen worden niet gelezen, provider-
  API's worden niet aangeroepen en exacte uitvoeringsgereedheid per model wordt niet bewezen.
- `models list --all --provider <id>` kan provider-eigen statische catalogus-
  rijen uit Plugin-manifesten of gebundelde providercatalogusmetadata bevatten, zelfs wanneer je
  nog niet bij die provider bent geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar weergegeven totdat overeenkomende auth is geconfigureerd.
- `models list` houdt het control plane responsief wanneer providercatalogus-
  detectie traag is. De standaard- en geconfigureerde weergaven vallen na een korte wachttijd terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de
  achtergrond afronden. Gebruik `--all` wanneer je de exacte volledig ontdekte catalogus nodig hebt en
  bereid bent te wachten op providerdetectie.
- Brede `models list --all` voegt manifestcatalogusrijen samen boven registry-rijen
  zonder supplement-hooks van de provider-runtime te laden. Provider-gefilterde manifest-
  snelle paden gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable`
  zijn gemarkeerd blijven registry/cache-ondersteund en voegen manifestrijen toe als supplementen, terwijl
  providers die als `runtime` zijn gemarkeerd op registry/runtime-detectie blijven.
- `models list` houdt native modelmetadata en runtime-limieten gescheiden. In tabel-
  uitvoer toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtime-
  limiet afwijkt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die limiet blootlegt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai`. Het accepteert geen weergavelabels uit interactieve provider-
  kiezers, zoals `Moonshot AI`.
- Modelrefs worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), neem dan het providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als een alias, daarna
  als een unieke match bij geconfigureerde providers voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecation-waarschuwing.
  Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een
  verouderde standaard van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
fallback-gebruik. De catalogus zelf is openbaar, dus metadata-only scans hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw tool- en afbeeldingsondersteuning te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op metadata-only-
uitvoer en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inference.

Opties:

- `--no-probe` (alleen metadata; geen config/geheimen opzoeken)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusverzoek en timeout per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; metadata-only scan-
resultaten zijn informatief en worden niet toegepast op configuratie.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbrekend, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalbare of komma-gescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`)

`--json` houdt stdout gereserveerd voor de JSON-payload. Diagnostiek voor auth-profielen, providers
en opstarten wordt naar stderr geleid, zodat scripts stdout direct kunnen pipen
naar tools zoals `jq`.

Probe-statusgroepen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Te verwachten detail-/redencodegevallen voor probes:

- `excluded_by_auth_order`: een opgeslagen profiel bestaat, maar expliciete
  `auth.order.<provider>` heeft het weggelaten, dus de probe rapporteert de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet eligible/oplosbaar.
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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` is de interactieve auth-helper. Deze kan een provider-auth-
flow (OAuth/API-sleutel) starten of je begeleiden naar handmatig token plakken, afhankelijk van de
provider die je kiest.

`models auth list` toont opgeslagen auth-profielen voor de geselecteerde agent zonder
token-, API-sleutel- of OAuth-geheimmateriaal af te drukken. Gebruik `--provider <id>` om
te filteren op één provider, zoals `openai`, en `--json` voor scripting.

`models auth login` voert de auth-flow van een provider-Plugin uit (OAuth/API-sleutel). Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om auth-resultaten naar een
specifieke geconfigureerde agent-store te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` en
`login-github-copilot`.

Voor OpenAI-modellen gebruikt `--provider openai` standaard ChatGPT/Codex-accountlogin.
Gebruik `--method api-key` alleen wanneer je een OpenAI API-sleutelprofiel wilt toevoegen,
meestal als backup voor Codex-abonnementslimieten. Voer `openclaw doctor --fix` uit
om oudere legacy OpenAI Codex-prefixauth/profielstatus naar `openai` te migreren.

Voorbeelden:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Opmerkingen:

- `login` accepteert `--profile-id <id>` voor providers die benoemde
  profielen tijdens login ondersteunen. Gebruik dit om meerdere logins voor dezelfde
  provider gescheiden te houden.
- `paste-api-key` accepteert API-sleutels die elders zijn gegenereerd, vraagt om de sleutel-
  waarde en schrijft deze naar de standaard profiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft. In automatisering pipe je de sleutel op stdin, bijvoorbeeld
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` en `paste-token` blijven generieke tokenopdrachten voor providers
  die token-authmethoden blootleggen.
- `setup-token` vereist een interactieve TTY en voert de token-auth-
  methode van de provider uit (standaard de `setup-token`-methode van die provider wanneer die er een
  blootlegt).
- `paste-token` accepteert een tokenstring die elders of via automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt standaard om de tokenwaarde
  en schrijft deze naar de standaard profiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- In automatisering pipe je het token op stdin in plaats van het als argument door te geven, zodat
  providerreferenties niet in shellgeschiedenis of proceslijsten verschijnen.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op vanuit een
  relatieve duur zoals `365d` of `12h`.
- Voor `openai` zijn OpenAI API-sleutels en ChatGPT/OAuth-tokenmateriaal
  verschillende auth-vormen. Gebruik `paste-api-key` voor `sk-...` OpenAI API-sleutels en
  `paste-token` alleen voor token-authmateriaal.
- Anthropic-opmerking: medewerkers van Anthropic hebben ons verteld dat OpenClaw-stijl Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en `claude -p`-gebruik als gesanctioneerd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
