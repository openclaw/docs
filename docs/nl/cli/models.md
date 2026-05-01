---
read_when:
    - Je wilt standaardmodellen wijzigen of de authenticatiestatus van de provider bekijken
    - Je wilt beschikbare modellen/providers scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, fallbacks, authenticatie)
title: Modellen
x-i18n:
    generated_at: "2026-05-01T11:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
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

`openclaw models status` toont de opgeloste standaardwaarde/fallbacks plus een auth-overzicht.
Wanneer gebruikssnapshots van providers beschikbaar zijn, bevat de statussectie voor OAuth/API-sleutels
gebruiksvensters van providers en quotasnapshots.
Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiks-auth komt uit providerspecifieke hooks
wanneer beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth/API-sleutelreferenties
uit auth-profielen, env of configuratie.
In `--json`-uitvoer is `auth.providers` het provider-overzicht dat rekening houdt met
env/config/store, terwijl `auth.oauth` alleen de gezondheid van auth-store-profielen is.
Voeg `--probe` toe om live auth-probes uit te voeren voor elk geconfigureerd providerprofiel.
Probes zijn echte aanvragen (kunnen tokens verbruiken en rate limits activeren).
Gebruik `--agent <id>` om de model-/auth-status van een geconfigureerde agent te inspecteren. Wanneer dit wordt weggelaten,
gebruikt de opdracht `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` indien ingesteld, anders de
geconfigureerde standaardagent.
Probe-rijen kunnen afkomstig zijn van auth-profielen, env-referenties of `models.json`.

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest configuratie, auth-profielen, bestaande catalogusstatus
  en catalogusrijen die eigendom zijn van providers, maar het herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  auth-profielmetadata, env-markeringen, geconfigureerde providersleutels, lokale-provider-
  markeringen, AWS Bedrock-env-/profielmarkeringen en synthetische-auth-metadata van Plugins;
  deze laadt geen provider-runtime, leest geen keychain-geheimen, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan statische catalogusrijen die eigendom zijn van providers
  bevatten uit Plugin-manifests of gebundelde providercatalogusmetadata, zelfs wanneer je
  nog niet bij die provider bent geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar weergegeven totdat overeenkomende auth is geconfigureerd.
- `models list` houdt het control plane responsief terwijl providercatalogusdetectie
  traag is. De standaard- en geconfigureerde weergaven vallen na kort wachten terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de achtergrond voltooien. Gebruik `--all` wanneer je de exacte volledig ontdekte catalogus nodig hebt en
  bereid bent te wachten op providerdetectie.
- Brede `models list --all` voegt manifestcatalogusrijen samen boven registry-rijen
  zonder supplement-hooks van de provider-runtime te laden. Providergefilterde snelle manifestpaden
  gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable`
  zijn gemarkeerd, blijven registry-/cache-ondersteund en voegen manifestrijen als supplementen toe, terwijl
  providers die als `runtime` zijn gemarkeerd op registry-/runtime-detectie blijven.
- `models list` houdt native modelmetadata en runtime-limieten gescheiden. In tabeluitvoer
  toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtime-limiet
  afwijkt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die limiet blootstelt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve provider-
  pickers, zoals `Moonshot AI`.
- Modelverwijzingen worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), voeg dan het providerprefix toe (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als een alias, daarna
  als een unieke overeenkomst bij een geconfigureerde provider voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecation-waarschuwing.
  Als die provider het geconfigureerde standaardmodel niet langer blootstelt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een
  verouderde verwijderde-providerstandaard te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
fallbackgebruik. De catalogus zelf is openbaar, dus metadata-only scans hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw ondersteuning voor tools en afbeeldingen te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op metadata-only
uitvoer en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inferentie.

Opties:

- `--no-probe` (alleen metadata; geen configuratie-/geheimenlookup)
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

`--set-default` en `--set-image` vereisen live probes; metadata-only scanresultaten
zijn informatief en worden niet toegepast op configuratie.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbrekend, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaal of komma-gescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` houdt stdout gereserveerd voor de JSON-payload. Diagnostiek voor auth-profielen, providers
en opstarten wordt naar stderr geleid zodat scripts stdout direct kunnen pipen
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

Te verwachten gevallen voor probe-details/redencodes:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` liet het weg, dus de probe rapporteert de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet geschikt/oplosbaar.
- `no_model`: provider-auth bestaat, maar OpenClaw kon geen probeerbare
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

`models auth add` is de interactieve auth-helper. Deze kan een provider-auth-
flow (OAuth/API-sleutel) starten of je begeleiden naar handmatig token plakken, afhankelijk van de
provider die je kiest.

`models auth login` voert de auth-flow (OAuth/API-sleutel) van een provider-Plugin uit. Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om auth-resultaten naar een
specifieke geconfigureerde agent-store te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door
`add`, `login`, `setup-token`, `paste-token` en `login-github-copilot`.

Voorbeelden:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Opmerkingen:

- `setup-token` en `paste-token` blijven generieke tokenopdrachten voor providers
  die token-auth-methoden blootstellen.
- `setup-token` vereist een interactieve TTY en voert de token-auth-
  methode van de provider uit (standaard de `setup-token`-methode van die provider wanneer deze er
  een blootstelt).
- `paste-token` accepteert een tokenreeks die elders of via automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  deze naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op uit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-opmerking: medewerkers van Anthropic hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
