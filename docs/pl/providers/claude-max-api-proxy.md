---
read_when:
    - Chcesz używać subskrypcji Claude Max z narzędziami kompatybilnymi z OpenAI
    - Chcesz lokalny serwer API, który opakowuje Claude Code CLI
    - Chcesz porównać dostęp oparty na subskrypcji i dostęp oparty na kluczu API Anthropic
summary: Proxy społecznościowe do udostępniania poświadczeń subskrypcji Claude jako endpointu kompatybilnego z OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-04-24T09:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** to narzędzie społeczności, które udostępnia Twoją subskrypcję Claude Max/Pro jako endpoint API kompatybilny z OpenAI. Pozwala to używać subskrypcji z dowolnym narzędziem obsługującym format API OpenAI.

<Warning>
Ta ścieżka zapewnia tylko zgodność techniczną. Anthropic w przeszłości blokował część użycia subskrypcji
poza Claude Code. Sam musisz zdecydować, czy chcesz z tego korzystać,
i sprawdzić aktualne warunki Anthropic, zanim zaczniesz na tym polegać.
</Warning>

## Dlaczego warto tego używać?

| Podejście               | Koszt                                               | Najlepsze do                                |
| ----------------------- | --------------------------------------------------- | ------------------------------------------- |
| API Anthropic           | Opłata za token (~$15/M wejścia, $75/M wyjścia dla Opus) | Aplikacje produkcyjne, duży wolumen     |
| Subskrypcja Claude Max  | $200/miesiąc ryczałtowo                             | Użycie osobiste, rozwój, nieograniczone użycie |

Jeśli masz subskrypcję Claude Max i chcesz używać jej z narzędziami kompatybilnymi z OpenAI, ten proxy może obniżyć koszt niektórych przepływów pracy. Klucze API pozostają bardziej jednoznaczną ścieżką polityki dla zastosowań produkcyjnych.

## Jak to działa

```
Twoja aplikacja → claude-max-api-proxy → Claude Code CLI → Anthropic (przez subskrypcję)
   (format OpenAI)              (konwertuje format)         (używa Twojego logowania)
```

Proxy:

1. Przyjmuje żądania w formacie OpenAI pod `http://localhost:3456/v1/chat/completions`
2. Konwertuje je na polecenia Claude Code CLI
3. Zwraca odpowiedzi w formacie OpenAI (obsługiwany streaming)

## Pierwsze kroki

<Steps>
  <Step title="Install the proxy">
    Wymaga Node.js 20+ oraz Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Zweryfikuj, że Claude CLI jest uwierzytelnione
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Serwer działa pod http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # Wyświetl modele
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
    Skieruj OpenClaw na proxy jako niestandardowy endpoint kompatybilny z OpenAI:

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

## Wbudowany katalog

| ID modelu         | Mapuje do       |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Uwagi dotyczące trasy proxy w stylu OpenAI-compatible">
    Ta ścieżka używa tej samej trasy proxy w stylu OpenAI-compatible co inne niestandardowe
    backendy `/v1`:

    - Natywne kształtowanie żądań tylko dla OpenAI nie ma zastosowania
    - Brak `service_tier`, brak `store` dla Responses, brak wskazówek prompt-cache i brak
      kształtowania ładunków zgodności z rozumowaniem OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane na URL proxy

  </Accordion>

  <Accordion title="Auto-start na macOS przez LaunchAgent">
    Utwórz LaunchAgent, aby uruchamiać proxy automatycznie:

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

## Linki

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Uwagi

- To **narzędzie społeczności**, nieobsługiwane oficjalnie przez Anthropic ani OpenClaw
- Wymaga aktywnej subskrypcji Claude Max/Pro z uwierzytelnionym Claude Code CLI
- Proxy działa lokalnie i nie wysyła danych do żadnych zewnętrznych serwerów
- Odpowiedzi streamingowe są w pełni obsługiwane

<Note>
Dla natywnej integracji Anthropic z Claude CLI albo kluczami API zobacz [Anthropic provider](/pl/providers/anthropic). Dla subskrypcji OpenAI/Codex zobacz [OpenAI provider](/pl/providers/openai).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/pl/providers/anthropic" icon="bolt">
    Natywna integracja OpenClaw z Claude CLI albo kluczami API.
  </Card>
  <Card title="OpenAI provider" href="/pl/providers/openai" icon="robot">
    Dla subskrypcji OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
