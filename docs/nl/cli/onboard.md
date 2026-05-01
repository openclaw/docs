---
read_when:
    - U wilt begeleide configuratie voor Gateway, werkruimte, authenticatie, kanalen en Skills
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Onboarden
x-i18n:
    generated_at: "2026-05-01T11:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interactieve onboarding voor lokale of externe Gateway-configuratie.

## Gerelateerde handleidingen

<CardGroup cols={2}>
  <Card title="CLI-onboardinghub" href="/nl/start/wizard" icon="rocket">
    Stapsgewijze uitleg van het interactieve CLI-proces.
  </Card>
  <Card title="Overzicht van onboarding" href="/nl/start/onboarding-overview" icon="map">
    Hoe OpenClaw-onboarding samenhangt.
  </Card>
  <Card title="Referentie voor CLI-configuratie" href="/nl/start/wizard-cli-reference" icon="book">
    Uitvoer, interne werking en gedrag per stap.
  </Card>
  <Card title="CLI-automatisering" href="/nl/start/wizard-cli-automation" icon="terminal">
    Niet-interactieve flags en gescripte configuraties.
  </Card>
  <Card title="Onboarding voor de macOS-app" href="/nl/start/onboarding" icon="apple">
    Onboardingproces voor de macOS-menubalkapp.
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

`--flow import` gebruikt migratieproviders die eigendom zijn van Plugins, zoals Hermes. Dit wordt alleen uitgevoerd op een nieuwe OpenClaw-configuratie; als bestaande config, referenties, sessies of workspacegeheugen-/identiteitsbestanden aanwezig zijn, reset dan of kies een nieuwe configuratie voordat je importeert.

`--modern` start de preview van de conversationele Crestodian-onboarding. Zonder
`--modern` behoudt `openclaw onboard` het klassieke onboardingproces.

Voor plaintext private-network `ws://`-doelen (alleen vertrouwde netwerken), stel
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving voor onboarding in.
Er is geen `openclaw.json`-equivalent voor deze break-glass voor client-side transport.

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

`--custom-api-key` is optioneel in niet-interactieve modus. Als deze wordt weggelaten, controleert onboarding `CUSTOM_API_KEY`.
OpenClaw markeert veelvoorkomende vision-model-ID's automatisch als image-capable. Geef `--custom-image-input` mee voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata voor alleen tekst af te dwingen.

LM Studio ondersteunt in niet-interactieve modus ook een providerspecifieke key-flag:

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

`--custom-base-url` gebruikt standaard `http://127.0.0.1:11434`. `--custom-model-id` is optioneel; als deze wordt weggelaten, gebruikt onboarding de voorgestelde standaardwaarden van Ollama. Cloudmodel-ID's zoals `kimi-k2.5:cloud` werken hier ook.

Sla providerkeys op als refs in plaats van plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Met `--secret-input-mode ref` schrijft onboarding env-ondersteunde refs in plaats van plaintext key-waarden.
Voor providers met auth-profielen schrijft dit `keyRef`-vermeldingen; voor aangepaste providers schrijft dit `models.providers.<id>.apiKey` als een env-ref (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contract voor niet-interactieve `ref`-modus:

- Stel de provider-env-var in de procesomgeving voor onboarding in (bijvoorbeeld `OPENAI_API_KEY`).
- Geef geen inline key-flags mee (bijvoorbeeld `--openai-api-key`) tenzij die env-var ook is ingesteld.
- Als een inline key-flag wordt meegegeven zonder de vereiste env-var, faalt onboarding snel met begeleiding.

Gateway-tokenopties in niet-interactieve modus:

- `--gateway-auth token --gateway-token <token>` slaat een plaintext token op.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een env SecretRef.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar uit.
- `--gateway-token-ref-env` vereist een niet-lege env-var in de procesomgeving voor onboarding.
- Met `--install-daemon`, wanneer tokenauth een token vereist, worden Gateway-tokens die via SecretRef worden beheerd gevalideerd maar niet persistent opgeslagen als opgeloste plaintext in metadata van de supervisor-serviceomgeving.
- Met `--install-daemon`, als tokenmodus een token vereist en de geconfigureerde token SecretRef niet kan worden opgelost, faalt onboarding gesloten met herstelbegeleiding.
- Met `--install-daemon`, als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert onboarding de installatie totdat de modus expliciet is ingesteld.
- Lokale onboarding schrijft `gateway.mode="local"` naar de config. Als een later configbestand `gateway.mode` mist, behandel dat dan als configschade of een onvolledige handmatige bewerking, niet als een geldige snelkoppeling voor lokale modus.
- Lokale onboarding materialiseert nieuw vereiste gebundelde Plugin-runtimeafhankelijkheden na het schrijven van config, voordat workspace/bootstrap, daemoninstallatie of healthchecks doorgaan. Dit is een smalle package-manager-reparatiestap, geen volledige `openclaw doctor`-run.
- Externe onboarding schrijft alleen verbindingsinformatie voor de externe Gateway en installeert geen lokale gebundelde Plugin-afhankelijkheden.
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

- Tenzij je `--skip-health` meegeeft, wacht onboarding op een bereikbare lokale gateway voordat het succesvol afsluit.
- `--install-daemon` start eerst het beheerde Gateway-installatiepad. Zonder deze optie moet er al een lokale gateway draaien, bijvoorbeeld `openclaw gateway run`.
- Als je in automatisering alleen config-/workspace-/bootstrap-writes wilt, gebruik dan `--skip-health`.
- Als je workspacebestanden zelf beheert, geef dan `--skip-bootstrap` mee om `agents.defaults.skipBootstrap: true` in te stellen en het maken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over te slaan.
- Op native Windows probeert `--install-daemon` eerst Scheduled Tasks en valt terug op een per-user login item in de Startup-folder als het maken van taken wordt geweigerd.

Gedrag van interactieve onboarding met referentiemodus:

- Kies **Use secret reference** wanneer daarom wordt gevraagd.
- Kies daarna een van beide:
  - Omgevingsvariabele
  - Geconfigureerde secret-provider (`file` of `exec`)
- Onboarding voert een snelle preflightvalidatie uit voordat de ref wordt opgeslagen.
  - Als validatie mislukt, toont onboarding de fout en kun je het opnieuw proberen.

### Niet-interactieve Z.AI-endpointkeuzes

<Note>
`--auth-choice zai-api-key` detecteert automatisch het beste Z.AI-endpoint voor je key (geeft de voorkeur aan de algemene API met `zai/glm-5.1`). Als je specifiek de GLM Coding Plan-endpoints wilt, kies dan `zai-coding-global` of `zai-coding-cn`.
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

## Procesnotities

<AccordionGroup>
  <Accordion title="Procestypen">
    - `quickstart`: minimale prompts, genereert automatisch een gatewaytoken.
    - `manual`: volledige prompts voor poort, bind en auth (alias van `advanced`).
    - `import`: voert een gedetecteerde migratieprovider uit, toont een preview van het plan en past dit daarna toe na bevestiging.

  </Accordion>
  <Accordion title="Provider-prefiltering">
    Wanneer een auth-keuze een voorkeursprovider impliceert, filtert onboarding de default-model- en allowlist-kiezers vooraf op die provider. Voor Volcengine en BytePlus matcht dit ook de coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Als het voorkeursproviderfilter nog geen geladen modellen oplevert, valt onboarding terug op de ongefilterde catalogus in plaats van de kiezer leeg te laten.

  </Accordion>
  <Accordion title="Webzoek-follow-ups">
    Sommige webzoekproviders activeren providerspecifieke follow-upprompts:

    - **Grok** kan optionele `x_search`-configuratie aanbieden met dezelfde `XAI_API_KEY` en een `x_search`-modelkeuze.
    - **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` versus `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

  </Accordion>
  <Accordion title="Ander gedrag">
    - Gedrag van DM-scope bij lokale onboarding: [Referentie voor CLI-configuratie](/nl/start/wizard-cli-reference#outputs-and-internals).
    - Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalconfiguratie).
    - Aangepaste provider: verbind elk OpenAI- of Anthropic-compatibel endpoint, inclusief gehoste providers die niet worden vermeld. Gebruik Unknown om automatisch te detecteren.
    - Als Hermes-status wordt gedetecteerd, biedt onboarding een migratieproces aan. Gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, overschrijfmodus, rapporten en exacte mappings.

  </Accordion>
</AccordionGroup>

## Veelvoorkomende vervolgopdrachten

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` voor scripts.
</Note>
