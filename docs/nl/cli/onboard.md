---
read_when:
    - Je wilt begeleide configuratie voor Gateway, werkruimte, authenticatie, kanalen en Skills
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Onboarden
x-i18n:
    generated_at: "2026-06-30T22:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Volledig begeleide onboarding voor lokale of externe Gateway-installatie. Gebruik dit wanneer je wilt dat OpenClaw in één flow modelauthenticatie, werkruimte, Gateway, kanalen, Skills en health doorloopt.

## Gerelateerde gidsen

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/nl/start/wizard" icon="rocket">
    Doorloop van de interactieve CLI-flow.
  </Card>
  <Card title="Onboarding overview" href="/nl/start/onboarding-overview" icon="map">
    Hoe OpenClaw-onboarding samenhangt.
  </Card>
  <Card title="CLI setup reference" href="/nl/start/wizard-cli-reference" icon="book">
    Uitvoer, interne werking en gedrag per stap.
  </Card>
  <Card title="CLI automation" href="/nl/start/wizard-cli-automation" icon="terminal">
    Niet-interactieve vlaggen en gescripte installaties.
  </Card>
  <Card title="macOS app onboarding" href="/nl/start/onboarding" icon="apple">
    Onboardingflow voor de macOS-menubalkapp.
  </Card>
</CardGroup>

## Voorbeelden

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` gebruikt door Plugins beheerde migratieproviders zoals Hermes. Het draait alleen tegen een nieuwe OpenClaw-installatie; als bestaande configuratie, referenties, sessies of bestanden voor werkruimtegeheugen/identiteit aanwezig zijn, reset dan of kies een nieuwe installatie voordat je importeert.

`--modern` start de preview van Crestodian-conversatie-onboarding. Zonder
`--modern` behoudt `openclaw onboard` de klassieke onboardingflow.

Bij een nieuwe installatie waarbij het actieve configuratiebestand ontbreekt of geen door de gebruiker
geschreven instellingen heeft (leeg of alleen metadata), start kale `openclaw` ook de klassieke
onboardingflow. Zodra een configuratiebestand door de gebruiker geschreven instellingen heeft, opent kale `openclaw`
in plaats daarvan Crestodian.

Platte tekst `ws://` wordt geaccepteerd voor loopback, private IP-literals, `.local` en
Tailnet `*.ts.net` Gateway-URL's. Stel voor andere vertrouwde private-DNS-namen
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving van onboarding in.

## Locale

Interactieve onboarding gebruikt de CLI-wizardlocale voor vaste installatietekst. De oplosvolgorde
is:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Engelse fallback

Ondersteunde wizardlocales zijn `en`, `zh-CN` en `zh-TW`. Locale-waarden mogen
underscore- of POSIX-suffixvormen gebruiken, zoals `zh_CN.UTF-8`. Productnamen, opdracht-
namen, configuratiesleutels, URL's, provider-ID's, model-ID's en Plugin-/kanaallabels
blijven letterlijk.

Voorbeeld:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Niet-interactieve aangepaste provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` is optioneel in niet-interactieve modus. Als dit wordt weggelaten, controleert onboarding `CUSTOM_API_KEY`.
OpenClaw markeert veelvoorkomende vision-model-ID's automatisch als geschikt voor afbeeldingen. Geef `--custom-image-input` door voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata voor alleen tekst af te dwingen.
Gebruik `--custom-compatibility openai-responses` voor OpenAI-compatibele endpoints die `/v1/responses` ondersteunen maar niet `/v1/chat/completions`.

LM Studio ondersteunt ook een providerspecifieke sleutelvlag in niet-interactieve modus:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Niet-interactieve Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` gebruikt standaard `http://127.0.0.1:11434`. `--custom-model-id` is optioneel; als dit wordt weggelaten, gebruikt onboarding de voorgestelde standaardwaarden van Ollama. Cloudmodel-ID's zoals `kimi-k2.5:cloud` werken hier ook.

Sla providersleutels op als refs in plaats van platte tekst:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Met `--secret-input-mode ref` schrijft onboarding door env ondersteunde refs in plaats van sleutelwaarden in platte tekst.
Voor providers die door auth-profielen worden ondersteund, schrijft dit `keyRef`-vermeldingen; voor aangepaste providers schrijft dit `models.providers.<id>.apiKey` als een env-ref (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contract voor niet-interactieve `ref`-modus:

- Stel de provider-env-var in de procesomgeving van onboarding in (bijvoorbeeld `OPENAI_API_KEY`).
- Geef geen inline sleutelvlaggen door (bijvoorbeeld `--openai-api-key`) tenzij die env-var ook is ingesteld.
- Als een inline sleutelvlag wordt doorgegeven zonder de vereiste env-var, faalt onboarding snel met begeleiding.

Gateway-tokenopties in niet-interactieve modus:

- `--gateway-auth token --gateway-token <token>` slaat een token in platte tekst op.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een env SecretRef.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar wederzijds uit.
- `--gateway-token-ref-env` vereist een niet-lege env-var in de procesomgeving van onboarding.
- Met `--install-daemon`, wanneer tokenauthenticatie een token vereist, worden door SecretRef beheerde Gateway-tokens gevalideerd maar niet als opgeloste platte tekst bewaard in metadata van de supervisorserviceomgeving.
- Met `--install-daemon`, als de tokenmodus een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt onboarding gesloten met herstelbegeleiding.
- Met `--install-daemon`, als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert onboarding de installatie totdat de modus expliciet is ingesteld.
- Lokale onboarding schrijft `gateway.mode="local"` naar de configuratie. Als in een later configuratiebestand `gateway.mode` ontbreekt, behandel dat dan als configuratieschade of een onvolledige handmatige bewerking, niet als een geldige snelkoppeling voor lokale modus.
- Lokale onboarding installeert geselecteerde downloadbare Plugins wanneer het gekozen installatiepad die vereist.
- Externe onboarding schrijft alleen verbindingsinformatie voor de externe Gateway en installeert geen lokale Plugin-pakketten.
- `--allow-unconfigured` is een afzonderlijke escape hatch voor Gateway-runtime. Het betekent niet dat onboarding `gateway.mode` mag weglaten.

Voorbeeld:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Niet-interactieve lokale Gateway-health:

- Tenzij je `--skip-health` doorgeeft, wacht onboarding op een bereikbare lokale Gateway voordat het succesvol afsluit.
- `--install-daemon` start eerst het beheerde Gateway-installatiepad. Zonder deze vlag moet je al een lokale Gateway hebben draaien, bijvoorbeeld `openclaw gateway run`.
- Als je in automatisering alleen configuratie-/werkruimte-/bootstrapwrites wilt, gebruik dan `--skip-health`.
- Als je werkruimtebestanden zelf beheert, geef dan `--skip-bootstrap` door om `agents.defaults.skipBootstrap: true` in te stellen en het maken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over te slaan.
- Op native Windows probeert `--install-daemon` eerst Scheduled Tasks en valt terug op een login-item in de Startup-map per gebruiker als het maken van taken wordt geweigerd.

Gedrag van interactieve onboarding met referentiemodus:

- Kies **Geheime referentie gebruiken** wanneer daarom wordt gevraagd.
- Kies daarna een van beide:
  - Omgevingsvariabele
  - Geconfigureerde secretprovider (`file` of `exec`)
- Onboarding voert een snelle preflightvalidatie uit voordat de ref wordt opgeslagen.
  - Als validatie mislukt, toont onboarding de fout en kun je opnieuw proberen.

### Niet-interactieve Z.AI-endpointkeuzes

<Note>
`--auth-choice zai-api-key` detecteert automatisch het beste Z.AI-endpoint en model voor
je sleutel. Coding Plan-endpoints geven de voorkeur aan `zai/glm-5.2`; algemene API-endpoints gebruiken
`zai/glm-5.1`. Kies `zai-coding-global` of
`zai-coding-cn` om een Coding Plan-endpoint af te dwingen.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Niet-interactief Mistral-voorbeeld:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flow-opmerkingen

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimale prompts, genereert automatisch een Gateway-token.
    - `manual`: volledige prompts voor poort, bind en auth (alias van `advanced`).
    - `import`: voert een gedetecteerde migratieprovider uit, toont een preview van het plan en past het daarna toe na bevestiging.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Wanneer een auth-keuze een voorkeursprovider impliceert, filtert onboarding de pickers voor standaardmodel en allowlist vooraf op die provider. Voor Volcengine en BytePlus matcht dit ook de coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Als het voorkeursproviderfilter nog geen geladen modellen oplevert, valt onboarding terug op de ongefilterde catalogus in plaats van de picker leeg te laten.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Sommige webzoekproviders activeren providerspecifieke vervolgprompts:

    - **Grok** kan optionele `x_search`-installatie aanbieden met hetzelfde xAI OAuth-profiel of dezelfde API-sleutel en een `x_search`-modelkeuze.
    - **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` versus `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

  </Accordion>
  <Accordion title="Other behaviors">
    - Gedrag van lokale onboarding voor DM-scope: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals).
    - Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalinstallatie).
    - Aangepaste provider: verbind elk OpenAI- of Anthropic-compatibel endpoint, inclusief gehoste providers die niet worden vermeld. Gebruik Unknown om automatisch te detecteren.
    - Als Hermes-status wordt gedetecteerd, biedt onboarding een migratieflow aan. Gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, overschrijfmodus, rapporten en exacte mappings.

  </Accordion>
</AccordionGroup>

## Veelgebruikte vervolgopdrachten

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gebruik `openclaw setup` als hetzelfde begeleide onboarding-startpunt. Gebruik `openclaw setup --baseline` wanneer je alleen de basisconfiguratie/-werkruimte nodig hebt, later `openclaw configure` voor gerichte wijzigingen en `openclaw channels add` voor installatie van alleen kanalen.

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` voor scripts.
</Note>
