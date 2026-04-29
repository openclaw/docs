---
read_when:
    - Je wilt een Claude Max-abonnement gebruiken met OpenAI-compatibele tools
    - Je wilt een lokale API-server die de Claude Code CLI verpakt
    - U wilt op abonnement gebaseerde toegang tot Anthropic vergelijken met toegang op basis van API-sleutels
summary: Communityproxy om de inloggegevens van een Claude-abonnement beschikbaar te stellen als OpenAI-compatibel eindpunt
title: Claude Max API-proxy
x-i18n:
    generated_at: "2026-04-29T23:09:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** is een communitytool die je Claude Max/Pro-abonnement beschikbaar maakt als een OpenAI-compatibel API-eindpunt. Hierdoor kun je je abonnement gebruiken met elke tool die de OpenAI API-indeling ondersteunt.

<Warning>
Dit pad is alleen bedoeld voor technische compatibiliteit. Anthropic heeft in het verleden sommige abonnementsgebruik
buiten Claude Code geblokkeerd. Je moet zelf beslissen of je het wilt gebruiken
en Anthropic's huidige voorwaarden controleren voordat je erop vertrouwt.
</Warning>

## Waarom dit gebruiken?

| Benadering             | Kosten                                                     | Beste voor                                |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Anthropic API          | Betalen per token (~$15/M invoer, $75/M uitvoer voor Opus) | Productie-apps, hoog volume               |
| Claude Max-abonnement  | $200/maand vast tarief                                     | Persoonlijk gebruik, ontwikkeling, onbeperkt gebruik |

Als je een Claude Max-abonnement hebt en dit met OpenAI-compatibele tools wilt gebruiken, kan deze proxy de kosten voor sommige workflows verlagen. API-sleutels blijven het duidelijkere beleidspad voor productiegebruik.

## Hoe het werkt

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

De proxy:

1. Accepteert aanvragen in OpenAI-indeling op `http://localhost:3456/v1/chat/completions`
2. Zet ze om naar Claude Code CLI-opdrachten
3. Geeft reacties terug in OpenAI-indeling (streaming ondersteund)

## Aan de slag

<Steps>
  <Step title="Installeer de proxy">
    Vereist Node.js 20+ en Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start de server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test de proxy">
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
  <Step title="Configureer OpenClaw">
    Wijs OpenClaw naar de proxy als aangepast OpenAI-compatibel eindpunt:

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

| Model-ID          | Koppelt aan     |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Opmerkingen voor proxy-achtige OpenAI-compatibiliteit">
    Dit pad gebruikt dezelfde proxy-achtige OpenAI-compatibele route als andere aangepaste
    `/v1`-backends:

    - Native aanvraagvorming die alleen voor OpenAI geldt, is niet van toepassing
    - Geen `service_tier`, geen Responses `store`, geen prompt-cache-hints en geen
      payloadvorming voor OpenAI-redeneercompatibiliteit
    - Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
      worden niet geïnjecteerd op de proxy-URL

  </Accordion>

  <Accordion title="Automatisch starten op macOS met LaunchAgent">
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

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Opmerkingen

- Dit is een **communitytool**, niet officieel ondersteund door Anthropic of OpenClaw
- Vereist een actief Claude Max/Pro-abonnement met geauthenticeerde Claude Code CLI
- De proxy draait lokaal en verzendt geen gegevens naar servers van derden
- Streamingreacties worden volledig ondersteund

<Note>
Voor native Anthropic-integratie met Claude CLI of API-sleutels, zie [Anthropic-provider](/nl/providers/anthropic). Voor OpenAI/Codex-abonnementen, zie [OpenAI-provider](/nl/providers/openai).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Anthropic-provider" href="/nl/providers/anthropic" icon="bolt">
    Native OpenClaw-integratie met Claude CLI of API-sleutels.
  </Card>
  <Card title="OpenAI-provider" href="/nl/providers/openai" icon="robot">
    Voor OpenAI/Codex-abonnementen.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
