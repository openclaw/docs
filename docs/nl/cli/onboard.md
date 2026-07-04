---
read_when:
    - Je wilt begeleide configuratie voor gateway, werkruimte, auth, kanalen en Skills
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Instappen
x-i18n:
    generated_at: "2026-07-04T20:37:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Volledig begeleide onboarding voor lokale of externe Gateway-configuratie. Gebruik dit wanneer je wilt dat OpenClaw in één flow modelauthenticatie, werkruimte, Gateway, kanalen, Skills en statuscontrole doorloopt.

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
    Niet-interactieve flags en gescripte configuraties.
  </Card>
  <Card title="macOS app onboarding" href="/nl/start/onboarding" icon="apple">
    Onboardingflow voor de macOS-menubalk-app.
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

`--flow import` gebruikt door plugins beheerde migratieproviders, zoals Hermes. Dit wordt alleen uitgevoerd op een nieuwe OpenClaw-configuratie; als er bestaande configuratie, referenties, sessies of werkruimtegeheugen-/identiteitsbestanden aanwezig zijn, reset dan of kies een nieuwe configuratie voordat je importeert.

`--modern` start de preview van de conversationele Crestodian-onboarding. Zonder
`--modern` behoudt `openclaw onboard` de klassieke onboardingflow.

In een interactieve terminal routeert kale `openclaw` (zonder subopdracht) op basis van de configuratiestatus:

- Als het actieve configuratiebestand ontbreekt of geen door de gebruiker gemaakte instellingen heeft (leeg of
  alleen metadata), start deze klassieke onboardingflow.
- Als het configuratiebestand bestaat maar niet door de validatie komt, start
  [Crestodian](/nl/cli/crestodian) voor herstel.
- Als het configuratiebestand geldig is, opent het de normale agent-TUI, lokaal
  of verbonden met een bereikbare geconfigureerde Gateway. Op een geconfigureerde installatie
  bereik je Crestodian met `/crestodian` binnen de TUI of `openclaw crestodian`.

Plattetekst `ws://` wordt geaccepteerd voor local loopback, privé-IP-literals, `.local` en
Tailnet `*.ts.net`-Gateway-URL's. Stel voor andere vertrouwde privé-DNS-namen
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving van de onboarding in.

## Locale

Interactieve onboarding gebruikt de locale van de CLI-wizard voor vaste configuratieteksten. De volgorde voor oplossen is:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Engelse fallback

Ondersteunde wizard-locales zijn `en`, `zh-CN` en `zh-TW`. Locale-waarden mogen
underscore- of POSIX-suffixvormen gebruiken, zoals `zh_CN.UTF-8`. Productnamen, opdrachtnamen, configuratiesleutels, URL's, provider-ID's, model-ID's en plugin-/kanaallabels
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

`--custom-api-key` is optioneel in niet-interactieve modus. Als deze wordt weggelaten, controleert onboarding `CUSTOM_API_KEY`.
OpenClaw markeert veelvoorkomende vision-model-ID's automatisch als geschikt voor afbeeldingsinvoer. Geef `--custom-image-input` door voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata alleen voor tekst af te dwingen.
Gebruik `--custom-compatibility openai-responses` voor OpenAI-compatibele endpoints die `/v1/responses` ondersteunen maar niet `/v1/chat/completions`.

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

Sla providerkeys op als refs in plaats van als platte tekst:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Met `--secret-input-mode ref` schrijft onboarding door omgevingsvariabelen ondersteunde refs in plaats van keywaarden als platte tekst.
Voor providers met auth-profile schrijft dit `keyRef`-vermeldingen; voor aangepaste providers schrijft dit `models.providers.<id>.apiKey` als een env-ref (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contract voor niet-interactieve `ref`-modus:

- Stel de provider-env-var in de procesomgeving van onboarding in (bijvoorbeeld `OPENAI_API_KEY`).
- Geef geen inline key-flags door (bijvoorbeeld `--openai-api-key`), tenzij die env-var ook is ingesteld.
- Als een inline key-flag wordt doorgegeven zonder de vereiste env-var, faalt onboarding snel met begeleiding.

Gateway-tokenopties in niet-interactieve modus:

- `--gateway-auth token --gateway-token <token>` slaat een platteteksttoken op.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een env SecretRef.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar uit.
- `--gateway-token-ref-env` vereist een niet-lege env-var in de procesomgeving van onboarding.
- Met `--install-daemon`, wanneer tokenauthenticatie een token vereist, worden door SecretRef beheerde Gateway-tokens gevalideerd maar niet als opgeloste platte tekst bewaard in de metadata van de supervisor-serviceomgeving.
- Met `--install-daemon`, als tokenmodus een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt onboarding gesloten met hersteladvies.
- Met `--install-daemon`, als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert onboarding installatie totdat de modus expliciet is ingesteld.
- Lokale onboarding schrijft `gateway.mode="local"` naar de configuratie. Als in een later configuratiebestand `gateway.mode` ontbreekt, behandel dat dan als configuratieschade of een onvolledige handmatige bewerking, niet als een geldige snelkoppeling voor lokale modus.
- Lokale onboarding installeert geselecteerde downloadbare plugins wanneer het gekozen configuratiepad die vereist.
- Externe onboarding schrijft alleen verbindingsinformatie voor de externe Gateway en installeert geen lokale pluginpakketten.
- `--allow-unconfigured` is een afzonderlijke ontsnappingsmogelijkheid voor Gateway-runtime. Het betekent niet dat onboarding `gateway.mode` mag weglaten.

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

Niet-interactieve lokale Gateway-statuscontrole:

- Tenzij je `--skip-health` doorgeeft, wacht onboarding op een bereikbare lokale Gateway voordat het succesvol afsluit.
- `--install-daemon` start eerst het pad voor beheerde Gateway-installatie. Zonder deze flag moet je al een lokale Gateway hebben draaien, bijvoorbeeld `openclaw gateway run`.
- Als je in automatisering alleen configuratie-/werkruimte-/bootstrapwrites wilt, gebruik dan `--skip-health`.
- Als je werkruimtebestanden zelf beheert, geef dan `--skip-bootstrap` door om `agents.defaults.skipBootstrap: true` in te stellen en het maken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over te slaan.
- Op native Windows probeert `--install-daemon` eerst Scheduled Tasks en valt terug op een loginitem in de Startup-map per gebruiker als het maken van de taak wordt geweigerd.

Interactief onboardinggedrag met referentiemodus:

- Kies **Use secret reference** wanneer daarom wordt gevraagd.
- Kies daarna een van beide:
  - Omgevingsvariabele
  - Geconfigureerde secretprovider (`file` of `exec`)
- Onboarding voert een snelle preflightvalidatie uit voordat de ref wordt opgeslagen.
  - Als validatie faalt, toont onboarding de fout en kun je opnieuw proberen.

### Niet-interactieve Z.AI-endpointkeuzes

<Note>
`--auth-choice zai-api-key` detecteert automatisch het beste Z.AI-endpoint en model voor
je key. Coding Plan-endpoints geven de voorkeur aan `zai/glm-5.2`; algemene API-endpoints gebruiken
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

## Aanvullende niet-interactieve flags

Tokengebaseerde modelauthenticatie (niet-interactief; gebruikt met `--auth-choice token`):

- `--token-provider <id>` — Tokenprovider-ID. Identificeert welke provider het token uitgeeft.
- `--token <token>` — Tokenwaarde voor modelauthenticatie.
- `--token-profile-id <id>` — Auth-profile-ID. Algemene tokenopslag gebruikt standaard `<provider>:manual`; door de provider beheerde configuratieflows kunnen hun eigen standaard gebruiken, zoals `anthropic:default`.
- `--token-expires-in <duration>` — Optionele vervalduur voor token (bijv. `365d`, `12h`).

Cloudflare AI Gateway (niet-interactief):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account-ID voor routering via Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway-ID.

Installatiebeheer voor daemon:

- `--no-install-daemon` — Sla installatie van de Gateway-service expliciet over.
- `--skip-daemon` — Alias voor `--no-install-daemon`.

Beheer voor UI- en hookconfiguratie:

- `--skip-ui` — Sla Control UI-/TUI-prompts over tijdens onboarding.
- `--skip-hooks` — Sla Webhook-/hookconfiguratieprompts over tijdens onboarding.

Uitvoeronderdrukking:

- `--suppress-gateway-token-output` — Onderdruk Gateway-/UI-uitvoer met tokens (tokenhints, auto-login-URL met ingesloten token en automatische lancering van Control UI). Nuttig in gedeelde terminal- en CI-omgevingen.

## Flow-opmerkingen

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimale prompts, genereert automatisch een Gateway-token.
    - `manual`: volledige prompts voor poort, bind en auth (alias van `advanced`).
    - `import`: voert een gedetecteerde migratieprovider uit, toont een preview van het plan en past het daarna toe na bevestiging.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Wanneer een authkeuze een voorkeursprovider impliceert, filtert onboarding de default-model- en allowlist-kiezers vooraf op die provider. Voor Volcengine en BytePlus matcht dit ook de coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Als het voorkeursproviderfilter nog geen geladen modellen oplevert, valt onboarding terug op de ongefilterde catalogus in plaats van de kiezer leeg te laten.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Sommige web-searchproviders activeren providerspecifieke vervolgprompts:

    - **Grok** kan optionele `x_search`-configuratie aanbieden met hetzelfde xAI OAuth-profiel of dezelfde API-key en een `x_search`-modelkeuze.
    - **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` versus `api.moonshot.cn`) en het standaard Kimi-web-searchmodel.

  </Accordion>
  <Accordion title="Other behaviors">
    - Gedrag van DM-scope bij lokale onboarding: [CLI-configuratiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals).
    - Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalconfiguratie).
    - Aangepaste provider: verbind elk OpenAI- of Anthropic-compatibel endpoint, inclusief gehoste providers die niet vermeld staan. Gebruik Unknown voor automatische detectie.
    - Als Hermes-status wordt gedetecteerd, biedt onboarding een migratieflow aan. Gebruik [Migreren](/nl/cli/migrate) voor dry-runplannen, overschrijfmodus, rapporten en exacte mappings.

  </Accordion>
</AccordionGroup>

## Veelgebruikte vervolgopdrachten

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gebruik `openclaw setup` als hetzelfde begeleide instappunt voor onboarding. Gebruik `openclaw setup --baseline` wanneer je alleen de basisconfiguratie/werkruimte nodig hebt, later `openclaw configure` voor gerichte wijzigingen, en `openclaw channels add` voor configuratie van alleen kanalen.

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` voor scripts.
</Note>
