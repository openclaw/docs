---
read_when:
    - Je wilt het Claude Max-abonnement gebruiken met OpenAI-compatibele tools
    - Je wilt een lokale API-server die Claude Code CLI verpakt
    - Je wilt toegang tot Anthropic op basis van abonnementen versus op basis van API-sleutels evalueren
summary: Communityproxy om Claude-abonnementsreferenties bloot te stellen als OpenAI-compatibel eindpunt
title: Claude Max API-proxy
x-i18n:
    generated_at: "2026-06-27T18:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** is een communitytool die je Claude Max/Pro-abonnement beschikbaar maakt als een OpenAI-compatibel API-eindpunt. Zo kun je je abonnement gebruiken met elke tool die de OpenAI API-indeling ondersteunt.

<Warning>
Dit pad is alleen bedoeld voor technische compatibiliteit. Anthropic heeft in het verleden bepaald abonnementsgebruik buiten Claude Code geblokkeerd. Je moet zelf beslissen of je het gebruikt en de huidige factureringsregels van Anthropic controleren voordat je erop vertrouwt.

De huidige supportdocumentatie van Anthropic zegt dat `claude -p` Agent SDK-/programmatisch gebruik is. Vanaf 15 juni 2026 gebruikt `claude -p`-gebruik binnen een abonnementsplan eerst een afzonderlijk maandelijks Agent SDK-tegoed, en daarna gebruikstegoeden tegen standaard API-tarieven als gebruikstegoeden zijn ingeschakeld.
</Warning>

## Waarom dit gebruiken?

| Aanpak                    | Kostenroute                                      | Geschikt voor                              |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Betalen per token via Claude Console of cloud   | Productie-apps, gedeelde automatisering, volume |
| Claude-abonnementsproxy   | Claude Code / `claude -p`-plan en tegoedregels  | Persoonlijke experimenten met compatibele tools |

Als je een Claude Max- of Pro-abonnement hebt en dit wilt gebruiken met OpenAI-compatibele tools, kan deze proxy bij sommige persoonlijke workflows passen. Het is geen onbeperkt pad met vast tarief. API-sleutels blijven het duidelijkere beleids- en factureringspad voor productiegebruik.

## Hoe het werkt

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

De proxy:

1. Accepteert verzoeken in OpenAI-indeling op `http://localhost:3456/v1/chat/completions`
2. Zet ze om naar Claude Code CLI-opdrachten
3. Retourneert antwoorden in OpenAI-indeling (streaming ondersteund)

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

| Model-ID          | Komt overeen met |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Dit pad gebruikt dezelfde proxy-achtige OpenAI-compatibele route als andere aangepaste `/v1`-backends:

    - Native verzoekvorming die alleen voor OpenAI geldt, is niet van toepassing
    - Geen `service_tier`, geen Responses `store`, geen prompt-cache-hints en geen OpenAI reasoning-compat payloadvorming
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

- Dit is een **communitytool**, niet officieel ondersteund door Anthropic of OpenClaw
- Vereist een actief Claude Max/Pro-abonnement waarbij Claude Code CLI is geauthenticeerd
- Neemt het facturerings-, gebruikstegoed- en rate-limit-gedrag van Claude Code `claude -p` over
- De proxy draait lokaal en stuurt geen gegevens naar servers van derden
- Streamingantwoorden worden volledig ondersteund

<Note>
Zie [Anthropic-provider](/nl/providers/anthropic) voor native Anthropic-integratie met Claude CLI of API-sleutels. Zie [OpenAI-provider](/nl/providers/openai) voor OpenAI/Codex-abonnementen.
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
    Overzicht van alle providers, modelrefs en failover-gedrag.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
