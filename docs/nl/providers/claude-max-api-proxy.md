---
read_when:
    - Je wilt een Claude Max-abonnement gebruiken met OpenAI-compatibele tools
    - Je wilt een lokale API-server die de Claude Code CLI als wrapper aanbiedt
    - Je wilt Anthropic-toegang op abonnementsbasis vergelijken met toegang via een API-sleutel
summary: Communityproxy om Claude-abonnementsreferenties beschikbaar te stellen als een OpenAI-compatibel eindpunt
title: Claude Max API-proxy
x-i18n:
    generated_at: "2026-07-12T09:17:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** is een community-npm-pakket (geen OpenClaw-plugin) dat
een Claude Max/Pro-abonnement beschikbaar stelt als een OpenAI-compatibel API-eindpunt, zodat
je elk OpenAI-compatibel hulpmiddel naar je abonnement kunt laten verwijzen in plaats van naar een
Anthropic-API-sleutel.

<Warning>
Alleen technisch compatibel, geen officieel goedgekeurde methode. Anthropic heeft
in het verleden bepaald gebruik van abonnementen buiten Claude Code geblokkeerd; controleer
de huidige factureringsregels van Anthropic voordat je hierop vertrouwt.

De Claude Code-documentatie van Anthropic beschrijft `claude -p` als gebruik van de Agent SDK/programmatisch
gebruik. Volgens de ondersteuningsupdate van Anthropic van 15 juni 2026 vallen Claude Agent SDK,
`claude -p` en gebruik door apps van derden onder de
gebruikslimieten van het abonnement waarmee is ingelogd (het eerder aangekondigde afzonderlijke tegoedplan voor de Agent SDK is
gepauzeerd). Zie het [artikel over het Agent SDK-abonnement](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
van Anthropic, de artikelen over de abonnementen [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
en [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
en [Anthropic-provider](/nl/providers/anthropic) voor de eigen opmerkingen van OpenClaw
over facturering via de Claude CLI.
</Warning>

## Waarom dit gebruiken

| Aanpak                    | Kostenroute                                      | Meest geschikt voor                              |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Anthropic-API-sleutel     | Betalen per token via Claude Console             | Productie-apps, gedeelde automatisering, volume  |
| Claude-abonnementsproxy   | Abonnements- en tegoedregels van Claude Code / `claude -p` | Persoonlijke experimenten met compatibele hulpmiddelen |

Met deze proxy werkt een Claude Max- of Pro-abonnement met OpenAI-compatibele
hulpmiddelen. Het is geen onbeperkte route met een vast tarief — de gebruikslimieten
van Claude Code zijn van toepassing. API-sleutels blijven voor productiegebruik de duidelijkere factureringsroute.

## Hoe het werkt

```text
Je app -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI-indeling)             (converteert indeling)           (gebruikt je aanmelding)
```

De proxy start de Claude Code CLI voor elke aanvraag als een subproces, converteert
chataanvragen in OpenAI-indeling naar CLI-prompts en streamt (of retourneert) het
antwoord in OpenAI-indeling.

## Aan de slag

<Steps>
  <Step title="De proxy installeren">
    Vereist Node.js 20+ en een geverifieerde Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="De server starten">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="De proxy testen">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw configureren">
    Stel de proxy in OpenClaw in als een aangepast OpenAI-compatibel eindpunt:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

<Note>
De onderstaande model-ID's komen uit de eigen catalogus van de proxy en zijn niet de Anthropic-
modelreferenties van OpenClaw. Elke ID verwijst naar een modelalias van de Claude Code CLI (`opus`, `sonnet`,
`haiku`), zodat het onderliggende model verandert wanneer Anthropic die
alias in de CLI bijwerkt. Controleer het actuele README-bestand van de proxy voordat je op een
specifieke toewijzing vertrouwt.
</Note>

| Model-ID          | CLI-alias | Huidige toewijzing |
| ----------------- | --------- | ------------------ |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5    |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4    |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4     |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Opmerkingen voor een OpenAI-compatibele proxy">
    Dit gebruikt de generieke aangepaste OpenAI-compatibele `/v1`-route van OpenClaw, hetzelfde
    pad als elke andere zelfgehoste OpenAI-compatibele backend:

    - Aanvraagvorming die alleen voor native OpenAI geldt, is niet van toepassing.
    - `/fast` en `service_tier` zijn alleen van toepassing op rechtstreeks verkeer naar `api.anthropic.com`;
      proxyroutes laten `service_tier` ongewijzigd (zie
      [snelle modus van de Anthropic-provider](/nl/providers/anthropic#advanced-configuration)).
    - Geen Responses-`store`, aanwijzingen voor promptcaching of vorming van payloads voor compatibiliteit met
      OpenAI-redenering.
    - De OpenAI/Codex-toeschrijvingsheaders van OpenClaw (`originator`, `version`,
      `User-Agent`) worden alleen verzonden bij native OAuth-verkeer naar `api.openai.com`, niet
      naar aangepaste `OPENAI_BASE_URL`-doelen zoals deze proxy.

  </Accordion>

  <Accordion title="Automatisch starten op macOS met LaunchAgent">
    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Opmerkingen

- Neemt het facturerings-, gebruikstegoed- en snelheidslimietgedrag van `claude -p` in Claude Code over.
- Bindt alleen aan `127.0.0.1`; verzendt geen gegevens naar servers van derden, behalve via de eigen aanroep van de CLI naar Anthropic.
- Gestreamde antwoorden worden ondersteund.
- Authenticatiefouten worden bij het opstarten niet gecontroleerd en worden pas zichtbaar wanneer daadwerkelijk een chataanvraag wordt uitgevoerd; als de CLI niet is geverifieerd, zal de eerste aanvraag mislukken in plaats van dat de server weigert te starten.

<Note>
Zie [Anthropic-provider](/nl/providers/anthropic) voor native Anthropic-integratie met de Claude CLI of API-sleutels. Zie [OpenAI-provider](/nl/providers/openai) voor OpenAI/Codex-abonnementen.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Anthropic-provider" href="/nl/providers/anthropic" icon="bolt">
    Native OpenClaw-integratie met de Claude CLI of API-sleutels.
  </Card>
  <Card title="OpenAI-provider" href="/nl/providers/openai" icon="robot">
    Voor OpenAI/Codex-abonnementen.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelreferenties en failovergedrag.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledig configuratieoverzicht.
  </Card>
</CardGroup>
