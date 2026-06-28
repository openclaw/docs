---
read_when:
    - Je wilt een Claude Max-abonnement gebruiken met OpenAI-compatibele tools
    - Je wilt een lokale API-server die Claude Code CLI omhult
    - Je wilt Anthropic-toegang op basis van abonnementen vergelijken met toegang op basis van API-sleutels
summary: Communityproxy om Claude-abonnementsreferenties als een OpenAI-compatibel endpoint beschikbaar te stellen
title: Claude Max API-proxy
x-i18n:
    generated_at: "2026-06-28T20:45:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** is een community-tool die je Claude Max/Pro-abonnement beschikbaar maakt als een OpenAI-compatibel API-eindpunt. Zo kun je je abonnement gebruiken met elke tool die de OpenAI API-indeling ondersteunt.

<Warning>
Dit pad is alleen bedoeld voor technische compatibiliteit. Anthropic heeft in het verleden sommige abonnementsgebruik buiten Claude Code geblokkeerd. Je moet zelf beslissen of je dit wilt gebruiken en de huidige factureringsregels van Anthropic controleren voordat je erop vertrouwt.

De huidige ondersteuningsdocumentatie van Anthropic zegt dat `claude -p` Agent SDK/programmatisch gebruik is. De supportupdate van Anthropic van 15 juni 2026 heeft het aangekondigde afzonderlijke Agent SDK-tegoedplan gepauzeerd. Voor nu tellen Claude Agent SDK, `claude -p` en gebruik via apps van derden nog steeds mee voor de gebruikslimieten van het ingelogde abonnement.

Controleer voordat je op dit pad vertrouwt het [artikel over het Agent SDK-plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) van Anthropic, plus de Claude Code-ondersteuningsartikelen voor [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)- of [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)-accounts.
</Warning>

## Waarom dit gebruiken?

| Aanpak                    | Kostenroute                                      | Beste voor                                      |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Anthropic API             | Betalen per token via Claude Console of cloud   | Productie-apps, gedeelde automatisering, volume |
| Claude-abonnementsproxy   | Claude Code / `claude -p`-plan en tegoedregels  | Persoonlijke experimenten met compatibele tools |

Als je een Claude Max- of Pro-abonnement hebt en dit wilt gebruiken met OpenAI-compatibele tools, kan deze proxy passen bij sommige persoonlijke workflows. Het is geen onbeperkte route met vast tarief. API-sleutels blijven het duidelijkere beleids- en factureringspad voor productiegebruik.

## Hoe het werkt

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

De proxy:

1. Accepteert OpenAI-indelingsverzoeken op `http://localhost:3456/v1/chat/completions`
2. Zet ze om naar Claude Code CLI-opdrachten
3. Retourneert antwoorden in OpenAI-indeling (streaming wordt ondersteund)

## Aan de slag

<Steps>
  <Step title="Install the proxy">
    Vereist Node.js 22+ en Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    Richt OpenClaw op de proxy als een aangepast OpenAI-compatibel eindpunt:

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

## Ingebouwde catalogus

| Model-ID          | Verwijst naar   |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Dit pad gebruikt dezelfde proxy-achtige OpenAI-compatibele route als andere aangepaste `/v1`-backends:

    - Native verzoekvorming alleen voor OpenAI is niet van toepassing
    - Geen `service_tier`, geen Responses `store`, geen prompt-cachehints en geen OpenAI reasoning-compat-payloadvorming
    - Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden niet geïnjecteerd op de proxy-URL

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    Maak een LaunchAgent om de proxy automatisch uit te voeren:

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

- Dit is een **community-tool**, niet officieel ondersteund door Anthropic of OpenClaw
- Vereist een actief Claude Max/Pro-abonnement waarbij Claude Code CLI is geauthenticeerd
- Erft het facturerings-, gebruikstegoed- en snelheidslimietgedrag van Claude Code `claude -p`
- De proxy draait lokaal en stuurt geen gegevens naar servers van derden
- Streaming-antwoorden worden volledig ondersteund

<Note>
Zie [Anthropic-aanbieder](/nl/providers/anthropic) voor native Anthropic-integratie met Claude CLI of API-sleutels. Zie [OpenAI-aanbieder](/nl/providers/openai) voor OpenAI/Codex-abonnementen.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/nl/providers/anthropic" icon="bolt">
    Native OpenClaw-integratie met Claude CLI of API-sleutels.
  </Card>
  <Card title="OpenAI provider" href="/nl/providers/openai" icon="robot">
    Voor OpenAI/Codex-abonnementen.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle aanbieders, modelverwijzingen en failover-gedrag.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
