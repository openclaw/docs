---
read_when:
    - Je wilt begeleide configuratie voor Gateway, werkruimte, authenticatie, kanalen en Skills
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Onboarden
x-i18n:
    generated_at: "2026-05-02T11:12:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interactieve introductie voor lokale of externe Gateway-configuratie.

## Gerelateerde gidsen

<CardGroup cols={2}>
  <Card title="CLI-introductiehub" href="/nl/start/wizard" icon="rocket">
    Stapsgewijze uitleg van de interactieve CLI-flow.
  </Card>
  <Card title="Overzicht van introductie" href="/nl/start/onboarding-overview" icon="map">
    Hoe de OpenClaw-introductie samenhangt.
  </Card>
  <Card title="CLI-configuratiereferentie" href="/nl/start/wizard-cli-reference" icon="book">
    Uitvoer, interne werking en gedrag per stap.
  </Card>
  <Card title="CLI-automatisering" href="/nl/start/wizard-cli-automation" icon="terminal">
    Niet-interactieve flags en gescripte configuraties.
  </Card>
  <Card title="macOS-appintroductie" href="/nl/start/onboarding" icon="apple">
    Introductieflow voor de macOS-menubalkapp.
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

`--flow import` gebruikt door plugins beheerde migratieproviders zoals Hermes. Het wordt alleen uitgevoerd op een verse OpenClaw-configuratie; als bestaande configuratie, referenties, sessies of bestanden voor werkruimtegeheugen/identiteit aanwezig zijn, reset dan of kies een verse configuratie voordat je importeert.

`--modern` start de preview van de conversatie-introductie van Crestodian. Zonder
`--modern` behoudt `openclaw onboard` de klassieke introductieflow.

Voor plaintext private-network `ws://`-doelen (alleen vertrouwde netwerken) stel je
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving voor introductie in.
Er is geen equivalent in `openclaw.json` voor deze noodoptie voor
client-side transport.

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

`--custom-api-key` is optioneel in niet-interactieve modus. Als deze wordt weggelaten, controleert de introductie `CUSTOM_API_KEY`.
OpenClaw markeert gangbare vision-model-ID's automatisch als geschikt voor afbeeldingen. Geef `--custom-image-input` door voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata voor alleen tekst af te dwingen.

LM Studio ondersteunt ook een providerspecifieke key-flag in niet-interactieve modus:

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

`--custom-base-url` gebruikt standaard `http://127.0.0.1:11434`. `--custom-model-id` is optioneel; als deze wordt weggelaten, gebruikt de introductie de voorgestelde standaardinstellingen van Ollama. Cloudmodel-ID's zoals `kimi-k2.5:cloud` werken hier ook.

Sla providersleutels op als verwijzingen in plaats van plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Met `--secret-input-mode ref` schrijft de introductie door omgevingsvariabelen ondersteunde verwijzingen in plaats van plaintext sleutelwaarden.
Voor providers die door auth-profielen worden ondersteund, schrijft dit `keyRef`-items; voor aangepaste providers schrijft dit `models.providers.<id>.apiKey` als een omgevingsverwijzing (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contract voor niet-interactieve `ref`-modus:

- Stel de omgevingsvariabele van de provider in de procesomgeving voor introductie in (bijvoorbeeld `OPENAI_API_KEY`).
- Geef geen inline key-flags door (bijvoorbeeld `--openai-api-key`), tenzij die omgevingsvariabele ook is ingesteld.
- Als een inline key-flag wordt doorgegeven zonder de vereiste omgevingsvariabele, stopt de introductie snel met begeleiding.

Gateway-tokenopties in niet-interactieve modus:

- `--gateway-auth token --gateway-token <token>` slaat een plaintext token op.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een omgevings-SecretRef.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar uit.
- `--gateway-token-ref-env` vereist een niet-lege omgevingsvariabele in de procesomgeving voor introductie.
- Met `--install-daemon`, wanneer tokenauthenticatie een token vereist, worden door SecretRef beheerde Gateway-tokens gevalideerd maar niet als opgeloste plaintext opgeslagen in omgevingsmetadata van de supervisorservice.
- Met `--install-daemon`, als de tokenmodus een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt de introductie gesloten met herstelbegeleiding.
- Met `--install-daemon`, als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert de introductie de installatie totdat de modus expliciet is ingesteld.
- Lokale introductie schrijft `gateway.mode="local"` naar de configuratie. Als in een later configuratiebestand `gateway.mode` ontbreekt, behandel dat dan als configuratieschade of een onvolledige handmatige bewerking, niet als een geldige snelkoppeling voor lokale modus.
- Lokale introductie installeert geselecteerde downloadbare plugins wanneer het gekozen configuratiepad deze vereist.
- Externe introductie schrijft alleen verbindingsinformatie voor de externe Gateway en installeert geen lokale pluginpakketten.
- `--allow-unconfigured` is een afzonderlijke ontsnappingsoptie voor de Gateway-runtime. Het betekent niet dat de introductie `gateway.mode` mag weglaten.

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

Niet-interactieve lokale Gateway-status:

- Tenzij je `--skip-health` doorgeeft, wacht de introductie op een bereikbare lokale gateway voordat deze succesvol afsluit.
- `--install-daemon` start eerst het installatiepad voor de beheerde Gateway. Zonder deze optie moet je al een lokale Gateway hebben draaien, bijvoorbeeld `openclaw gateway run`.
- Als je in automatisering alleen configuratie-/werkruimte-/bootstrap-schrijfacties wilt, gebruik dan `--skip-health`.
- Als je werkruimtebestanden zelf beheert, geef dan `--skip-bootstrap` door om `agents.defaults.skipBootstrap: true` in te stellen en het aanmaken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over te slaan.
- Op native Windows probeert `--install-daemon` eerst Scheduled Tasks en valt terug op een login-item in de Startup-map per gebruiker als het aanmaken van de taak wordt geweigerd.

Interactief introductiegedrag met verwijzingsmodus:

- Kies **Geheime verwijzing gebruiken** wanneer daarom wordt gevraagd.
- Kies daarna een van beide:
  - Omgevingsvariabele
  - Geconfigureerde geheime provider (`file` of `exec`)
- De introductie voert een snelle preflightvalidatie uit voordat de verwijzing wordt opgeslagen.
  - Als de validatie mislukt, toont de introductie de fout en kun je het opnieuw proberen.

### Niet-interactieve Z.AI-endpointkeuzes

<Note>
`--auth-choice zai-api-key` detecteert automatisch het beste Z.AI-endpoint voor je sleutel (geeft de voorkeur aan de algemene API met `zai/glm-5.1`). Als je specifiek de GLM Coding Plan-endpoints wilt, kies dan `zai-coding-global` of `zai-coding-cn`.
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
  <Accordion title="Flowtypen">
    - `quickstart`: minimale prompts, genereert automatisch een Gateway-token.
    - `manual`: volledige prompts voor poort, bind en auth (alias van `advanced`).
    - `import`: voert een gedetecteerde migratieprovider uit, toont een preview van het plan en past dit vervolgens toe na bevestiging.

  </Accordion>
  <Accordion title="Provider-prefiltering">
    Wanneer een auth-keuze een voorkeursprovider impliceert, filtert de introductie vooraf de standaardmodel- en allowlist-kiezers op die provider. Voor Volcengine en BytePlus matcht dit ook de Coding Plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Als het voorkeursproviderfilter nog geen geladen modellen oplevert, valt de introductie terug op de ongefilterde catalogus in plaats van de kiezer leeg te laten.

  </Accordion>
  <Accordion title="Vervolgprompts voor webzoekopdrachten">
    Sommige providers voor webzoekopdrachten activeren providerspecifieke vervolgprompts:

    - **Grok** kan optionele `x_search`-configuratie aanbieden met dezelfde `XAI_API_KEY` en een `x_search`-modelkeuze.
    - **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` versus `api.moonshot.cn`) en het standaard Kimi-model voor webzoekopdrachten.

  </Accordion>
  <Accordion title="Ander gedrag">
    - Gedrag van DM-scope bij lokale introductie: [CLI-configuratiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals).
    - Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalconfiguratie).
    - Aangepaste provider: verbind elk OpenAI- of Anthropic-compatibel endpoint, inclusief gehoste providers die niet worden vermeld. Gebruik Unknown om automatisch te detecteren.
    - Als Hermes-status wordt gedetecteerd, biedt de introductie een migratieflow aan. Gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, overschrijfmodus, rapporten en exacte mappings.

  </Accordion>
</AccordionGroup>

## Veelgebruikte vervolgcommando's

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` voor scripts.
</Note>
