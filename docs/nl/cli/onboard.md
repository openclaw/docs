---
read_when:
    - Je wilt begeleide configuratie voor gateway, werkruimte, authenticatie, kanalen en Skills
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Onboard
x-i18n:
    generated_at: "2026-07-01T13:11:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Volledig begeleide onboarding voor lokale of externe Gateway-installatie. Gebruik dit wanneer je wilt dat OpenClaw modelauthenticatie, werkruimte, gateway, kanalen, Skills en gezondheid in één flow doorloopt.

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
    Onboarding-flow voor de macOS-menubalkapp.
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

`--flow import` gebruikt door de Plugin beheerde migratieproviders zoals Hermes. Dit werkt alleen met een nieuwe OpenClaw-installatie; als er bestaande configuratie, referenties, sessies of werkruimtegeheugen-/identiteitsbestanden aanwezig zijn, reset dan of kies een nieuwe installatie voordat je importeert.

`--modern` start de preview van de conversationele Crestodian-onboarding. Zonder
`--modern` behoudt `openclaw onboard` de klassieke onboarding-flow.

Bij een nieuwe installatie waarbij het actieve configuratiebestand ontbreekt of geen zelf ingevoerde
instellingen bevat (leeg of alleen metadata), start ook kale `openclaw` de klassieke
onboarding-flow. Zodra een configuratiebestand zelf ingevoerde instellingen bevat, opent kale `openclaw`
in plaats daarvan Crestodian.

Platte tekst `ws://` wordt geaccepteerd voor loopback, letterlijke privé-IP-adressen, `.local` en
Tailnet `*.ts.net` Gateway-URL's. Stel voor andere vertrouwde privé-DNS-namen
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving van onboarding in.

## Locale

Interactieve onboarding gebruikt de locale van de CLI-wizard voor vaste installatietekst. De oplossingsvolgorde
is:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Engelse fallback

Ondersteunde wizardlocales zijn `en`, `zh-CN` en `zh-TW`. Locale-waarden mogen
underscore- of POSIX-suffixvormen gebruiken, zoals `zh_CN.UTF-8`. Productnamen, commandonamen,
configuratiesleutels, URL's, provider-ID's, model-ID's en Plugin-/kanaallabels
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
OpenClaw markeert gangbare vision-model-ID's automatisch als image-capable. Geef `--custom-image-input` door voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata alleen voor tekst af te dwingen.
Gebruik `--custom-compatibility openai-responses` voor OpenAI-compatibele endpoints die `/v1/responses` ondersteunen maar niet `/v1/chat/completions`.

LM Studio ondersteunt in niet-interactieve modus ook een providerspecifieke sleutelvlag:

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
Voor providers met auth-profile schrijft dit `keyRef`-items; voor aangepaste providers schrijft dit `models.providers.<id>.apiKey` als env-ref (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contract voor niet-interactieve `ref`-modus:

- Stel de provider-env-var in de procesomgeving van onboarding in (bijvoorbeeld `OPENAI_API_KEY`).
- Geef geen inline sleutelvlaggen door (bijvoorbeeld `--openai-api-key`), tenzij die env-var ook is ingesteld.
- Als een inline sleutelvlag wordt doorgegeven zonder de vereiste env-var, faalt onboarding snel met begeleiding.

Gateway-tokenopties in niet-interactieve modus:

- `--gateway-auth token --gateway-token <token>` slaat een token in platte tekst op.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een env SecretRef.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar uit.
- `--gateway-token-ref-env` vereist een niet-lege env-var in de procesomgeving van onboarding.
- Met `--install-daemon`, wanneer tokenauthenticatie een token vereist, worden door SecretRef beheerde gatewaytokens gevalideerd maar niet als opgeloste platte tekst bewaard in metadata van de supervisorserviceomgeving.
- Met `--install-daemon`, als de tokenmodus een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt onboarding gesloten met herstelbegeleiding.
- Met `--install-daemon`, als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert onboarding de installatie totdat de modus expliciet is ingesteld.
- Lokale onboarding schrijft `gateway.mode="local"` naar de configuratie. Als een later configuratiebestand `gateway.mode` mist, behandel dat dan als configuratieschade of een onvolledige handmatige bewerking, niet als een geldige snelkoppeling voor lokale modus.
- Lokale onboarding installeert geselecteerde downloadbare plugins wanneer het gekozen installatiepad deze vereist.
- Externe onboarding schrijft alleen verbindingsinformatie voor de externe Gateway en installeert geen lokale Plugin-pakketten.
- `--allow-unconfigured` is een afzonderlijk ontsnappingsluik voor de Gateway-runtime. Het betekent niet dat onboarding `gateway.mode` mag weglaten.

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

Niet-interactieve lokale Gateway-gezondheid:

- Tenzij je `--skip-health` doorgeeft, wacht onboarding op een bereikbare lokale gateway voordat deze succesvol afsluit.
- `--install-daemon` start eerst het beheerde Gateway-installatiepad. Zonder deze vlag moet er al een lokale gateway draaien, bijvoorbeeld `openclaw gateway run`.
- Als je in automatisering alleen configuratie-/werkruimte-/bootstrap-schrijfacties wilt, gebruik dan `--skip-health`.
- Als je werkruimtebestanden zelf beheert, geef dan `--skip-bootstrap` door om `agents.defaults.skipBootstrap: true` in te stellen en het aanmaken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over te slaan.
- Op native Windows probeert `--install-daemon` eerst Scheduled Tasks en valt terug op een login-item in de Startup-map per gebruiker als het aanmaken van de taak wordt geweigerd.

Gedrag van interactieve onboarding met referentiemodus:

- Kies **Use secret reference** wanneer daarom wordt gevraagd.
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

## Aanvullende niet-interactieve vlaggen

Tokengebaseerde modelauthenticatie (niet-interactief; gebruikt met `--auth-choice token`):

- `--token-provider <id>` — Tokenprovider-ID. Identificeert welke provider het token uitgeeft.
- `--token <token>` — Tokenwaarde voor modelauthenticatie.
- `--token-profile-id <id>` — Auth-profile-ID. Generieke tokenopslag gebruikt standaard `<provider>:manual`; door providers beheerde installatieflows kunnen hun eigen standaard gebruiken, zoals `anthropic:default`.
- `--token-expires-in <duration>` — Optionele vervalduur van token (bijv. `365d`, `12h`).

Cloudflare AI Gateway (niet-interactief):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account-ID voor routering via Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway-ID.

Beheer van daemoninstallatie:

- `--no-install-daemon` — Sla installatie van de gatewayservice expliciet over.
- `--skip-daemon` — Alias voor `--no-install-daemon`.

Beheer van UI- en hookinstallatie:

- `--skip-ui` — Sla Control UI-/TUI-prompts over tijdens onboarding.
- `--skip-hooks` — Sla Webhook-/hookinstallatieprompts over tijdens onboarding.

Onderdrukking van uitvoer:

- `--suppress-gateway-token-output` — Onderdruk Gateway-/UI-uitvoer die tokens bevat (tokenhints, auto-login-URL met ingebed token en automatisch starten van Control UI). Handig in gedeelde terminal- en CI-omgevingen.

## Flow-opmerkingen

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimale prompts, genereert automatisch een gatewaytoken.
    - `manual`: volledige prompts voor poort, bind en auth (alias van `advanced`).
    - `import`: voert een gedetecteerde migratieprovider uit, toont een preview van het plan en past dit daarna toe na bevestiging.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Wanneer een auth-keuze een voorkeursprovider impliceert, filtert onboarding de standaardmodel- en allowlist-kiezers vooraf op die provider. Voor Volcengine en BytePlus matcht dit ook de coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Als het voorkeursproviderfilter nog geen geladen modellen oplevert, valt onboarding terug op de ongefilterde catalogus in plaats van de kiezer leeg te laten.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Sommige webzoekproviders activeren providerspecifieke vervolgprompts:

    - **Grok** kan optionele `x_search`-installatie aanbieden met hetzelfde xAI OAuth-profiel of dezelfde API-sleutel en een `x_search`-modelkeuze.
    - **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` vs `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

  </Accordion>
  <Accordion title="Other behaviors">
    - Gedrag van DM-scope bij lokale onboarding: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals).
    - Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalinstallatie).
    - Aangepaste provider: verbind elk OpenAI- of Anthropic-compatibel endpoint, inclusief gehoste providers die niet worden vermeld. Gebruik Unknown voor automatische detectie.
    - Als Hermes-status wordt gedetecteerd, biedt onboarding een migratieflow aan. Gebruik [Migrate](/nl/cli/migrate) voor dry-run-plannen, overschrijfmodus, rapporten en exacte mappings.

  </Accordion>
</AccordionGroup>

## Veelgebruikte vervolgcommando's

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gebruik `openclaw setup` als hetzelfde begeleide onboarding-ingangspunt. Gebruik `openclaw setup --baseline` wanneer je alleen de baselineconfiguratie/-werkruimte nodig hebt, `openclaw configure` later voor gerichte wijzigingen en `openclaw channels add` voor installatie van alleen kanalen.

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` voor scripts.
</Note>
