---
read_when:
    - Je wilt de standaardmodellen wijzigen of de authenticatiestatus van providers bekijken
    - Je wilt beschikbare modellen/providers scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/list/set/scan, aliassen, fallbacks, auth)
title: Modellen
x-i18n:
    generated_at: "2026-05-12T00:58:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, fallbacks, auth-profielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + slash-opdracht `/models`: [Models-concept](/nl/concepts/models)
- Auth-instelling voor providers: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte opdrachten

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` toont de opgeloste standaard/fallbacks plus een auth-overzicht.
Wanneer snapshots van providergebruik beschikbaar zijn, bevat de OAuth/API-sleutelstatussectie
gebruiksvensters van providers en quotasnapshots.
Huidige providers met gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi en z.ai. Gebruiks-auth komt uit provider-specifieke hooks
wanneer die beschikbaar zijn; anders valt OpenClaw terug op overeenkomende OAuth/API-sleutel-
referenties uit auth-profielen, env of config.
In `--json`-uitvoer is `auth.providers` het provider-overzicht dat rekening houdt met
env/config/store, terwijl `auth.oauth` alleen de gezondheid van profielen in de auth-store is.
Voeg `--probe` toe om live auth-probes uit te voeren op elk geconfigureerd providerprofiel.
Probes zijn echte requests (kunnen tokens verbruiken en rate limits triggeren).
Gebruik `--agent <id>` om de model/auth-status van een geconfigureerde agent te inspecteren. Wanneer dit wordt weggelaten,
gebruikt de opdracht `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` als die zijn ingesteld, anders de
geconfigureerde standaardagent.
Probe-rijen kunnen afkomstig zijn uit auth-profielen, env-referenties of `models.json`.
Voor probleemoplossing rond Codex OAuth zijn `openclaw models status`,
`openclaw models auth list --provider openai-codex` en
`openclaw config get agents.defaults.model --json` de snelste manier om te
bevestigen of een agent een bruikbaar `openai-codex` auth-profiel heeft voor
`openai/*` via de native Codex-runtime. Zie [OpenAI-providerinstelling](/nl/providers/openai#check-and-recover-codex-oauth-routing).

Opmerkingen:

- `models set <model-or-alias>` accepteert `provider/model` of een alias.
- `models list` is alleen-lezen: het leest config, auth-profielen, bestaande catalogusstatus
  en catalogusrijen die eigendom zijn van providers, maar herschrijft
  `models.json` niet.
- De kolom `Auth` is op providerniveau en alleen-lezen. Deze wordt berekend uit lokale
  metadata van auth-profielen, env-markeringen, geconfigureerde providersleutels, markeringen voor lokale providers,
  AWS Bedrock-env/profielmarkeringen en synthetische-auth-metadata van Plugins;
  deze laadt geen providerruntime, leest geen keychain-geheimen, roept geen provider-
  API's aan en bewijst geen exacte uitvoeringsgereedheid per model.
- `models list --all --provider <id>` kan statische catalogusrijen die eigendom zijn van providers
  uit Plugin-manifesten of gebundelde providercatalogusmetadata bevatten, zelfs wanneer je
  nog niet bij die provider bent geauthenticeerd. Die rijen worden nog steeds als
  niet beschikbaar weergegeven totdat overeenkomende auth is geconfigureerd.
- `models list` houdt het controlevlak responsief terwijl providercatalogusdetectie
  traag is. De standaard- en geconfigureerde weergaven vallen na een korte wachttijd terug op geconfigureerde of
  synthetische modelrijen en laten detectie op de
  achtergrond voltooien. Gebruik `--all` wanneer je de exacte volledige ontdekte catalogus nodig hebt en
  bereid bent te wachten op providerdetectie.
- Brede `models list --all` voegt manifestcatalogusrijen samen boven registry-rijen
  zonder supplement-hooks van de providerruntime te laden. Provider-gefilterde snelle manifestpaden
  gebruiken alleen providers gemarkeerd als `static`; providers gemarkeerd als `refreshable`
  blijven op registry/cache gebaseerd en voegen manifestrijen toe als supplementen, terwijl
  providers gemarkeerd als `runtime` op registry/runtimedetectie blijven.
- `models list` houdt native modelmetadata en runtime-limieten gescheiden. In tabeluitvoer
  toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtimelimiet
  afwijkt van het native contextvenster; JSON-rijen bevatten `contextTokens`
  wanneer een provider die limiet beschikbaar stelt.
- `models list --provider <id>` filtert op provider-id, zoals `moonshot` of
  `openai-codex`. Het accepteert geen weergavelabels uit interactieve provider-
  kiezers, zoals `Moonshot AI`.
- Modelrefs worden geparseerd door te splitsen op de **eerste** `/`. Als de model-ID `/` bevat (OpenRouter-stijl), neem dan de providerprefix op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, lost OpenClaw de invoer eerst op als alias, daarna
  als een unieke match voor geconfigureerde providers voor die exacte model-id, en pas daarna
  valt het terug op de geconfigureerde standaardprovider met een deprecation-waarschuwing.
  Als die provider het geconfigureerde standaardmodel niet langer beschikbaar stelt, valt OpenClaw
  terug op de eerste geconfigureerde provider/model in plaats van een
  verouderde standaard van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` tonen in auth-uitvoer voor niet-geheime placeholders (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Modellen scannen

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor
fallbackgebruik. De catalogus zelf is openbaar, dus scans met alleen metadata hebben geen
OpenRouter-sleutel nodig.

Standaard probeert OpenClaw tool- en image-ondersteuning te proben met live modelaanroepen.
Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op uitvoer met alleen metadata
en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor
probes en inferentie.

Opties:

- `--no-probe` (alleen metadata; geen config/geheimen opzoeken)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalogusrequest en time-out per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen live probes; scanresultaten met alleen metadata
zijn informatief en worden niet toegepast op config.

### Modellenstatus

Opties:

- `--json`
- `--plain`
- `--check` (exit 1=verlopen/ontbreekt, 2=verloopt binnenkort)
- `--probe` (live probe van geconfigureerde auth-profielen)
- `--probe-provider <name>` (probe één provider)
- `--probe-profile <id>` (herhaalbare of door komma's gescheiden profiel-id's)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (geconfigureerde agent-id; overschrijft `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

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

Probe-detail/redencodegevallen die je kunt verwachten:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete
  `auth.order.<provider>` liet het weg, dus de probe rapporteert de uitsluiting in plaats van
  het te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profiel is aanwezig maar niet in aanmerking komend/oplosbaar.
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
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` is de interactieve auth-helper. Deze kan een provider-auth-
flow starten (OAuth/API-sleutel) of je begeleiden naar handmatig token plakken, afhankelijk van de
provider die je kiest.

`models auth list` vermeldt opgeslagen auth-profielen voor de geselecteerde agent zonder
token-, API-sleutel- of OAuth-geheim materiaal af te drukken. Gebruik `--provider <id>` om
op één provider te filteren, zoals `openai-codex`, en `--json` voor scripting.

`models auth login` voert de auth-flow van een provider-Plugin uit (OAuth/API-sleutel). Gebruik
`openclaw plugins list` om te zien welke providers zijn geïnstalleerd.
Gebruik `openclaw models auth --agent <id> <subcommand>` om auth-resultaten naar een
specifieke geconfigureerde agentstore te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door
`add`, `list`, `login`, `setup-token`, `paste-token` en
`login-github-copilot`.

Voor OpenAI-modellen gebruikt `--provider openai` standaard ChatGPT/Codex-accountlogin.
Gebruik `--method api-key` alleen wanneer je een OpenAI API-sleutelprofiel wilt toevoegen,
meestal als back-up voor Codex-abonnementslimieten. De legacy
spelling `--provider openai-codex` werkt nog steeds voor bestaande scripts.

Voorbeelden:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Opmerkingen:

- `setup-token` en `paste-token` blijven generieke tokenopdrachten voor providers
  die token-auth-methoden beschikbaar stellen.
- `setup-token` vereist een interactieve TTY en voert de token-auth-
  methode van de provider uit (standaard die provider's `setup-token`-methode wanneer deze
  er een beschikbaar stelt).
- `paste-token` accepteert een tokenstring die elders of via automatisering is gegenereerd.
- `paste-token` vereist `--provider`, vraagt om de tokenwaarde en schrijft
  deze naar de standaardprofiel-id `<provider>:manual`, tenzij je
  `--profile-id` doorgeeft.
- `paste-token --expires-in <duration>` slaat een absolute tokenvervaldatum op uit een
  relatieve duur zoals `365d` of `12h`.
- Anthropic-opmerking: Anthropic-medewerkers hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus behandelt OpenClaw hergebruik van Claude CLI en `claude -p`-gebruik als toegestaan voor deze integratie, tenzij Anthropic nieuw beleid publiceert.
- Anthropic `setup-token` / `paste-token` blijven beschikbaar als een ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
