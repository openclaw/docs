---
read_when:
    - Chcesz używać subskrypcji Claude Max z narzędziami zgodnymi z OpenAI
    - Chcesz lokalnego serwera API, który opakowuje Claude Code CLI
    - Chcesz ocenić dostęp do Anthropic oparty na subskrypcji w porównaniu z dostępem opartym na kluczu API
summary: Społecznościowy serwer proxy do udostępniania poświadczeń subskrypcji Claude jako punktu końcowego zgodnego z OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-27T18:11:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** to narzędzie społecznościowe, które udostępnia Twoją subskrypcję Claude Max/Pro jako punkt końcowy API zgodny z OpenAI. Pozwala to używać subskrypcji z dowolnym narzędziem obsługującym format OpenAI API.

<Warning>
Ta ścieżka służy wyłącznie zgodności technicznej. Anthropic w przeszłości blokował część użycia subskrypcji poza Claude Code. Musisz samodzielnie zdecydować, czy z niej korzystać, i zweryfikować aktualne zasady rozliczeń Anthropic, zanim zaczniesz na niej polegać.

Aktualna dokumentacja pomocy Anthropic mówi, że `claude -p` to użycie Agent SDK/programistyczne. Od 15 czerwca 2026 r. użycie `claude -p` w ramach planu subskrypcji najpierw korzysta z oddzielnego miesięcznego kredytu Agent SDK, a następnie z kredytów użycia według standardowych stawek API, jeśli kredyty użycia są włączone.
</Warning>

## Dlaczego tego używać?

| Podejście                 | Ścieżka kosztów                                  | Najlepsze do                                |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Płatność za token przez Claude Console lub chmurę | Aplikacje produkcyjne, współdzielona automatyzacja, duży wolumen |
| Proxy subskrypcji Claude | Zasady planu i kredytów Claude Code / `claude -p` | Osobiste eksperymenty ze zgodnymi narzędziami |

Jeśli masz subskrypcję Claude Max lub Pro i chcesz używać jej z narzędziami zgodnymi z OpenAI, ten proxy może pasować do części osobistych przepływów pracy. Nie jest to nielimitowana ścieżka ze stałą opłatą. Klucze API pozostają jaśniejszą ścieżką zasad i rozliczeń do zastosowań produkcyjnych.

## Jak to działa

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proxy:

1. Przyjmuje żądania w formacie OpenAI pod adresem `http://localhost:3456/v1/chat/completions`
2. Konwertuje je na polecenia Claude Code CLI
3. Zwraca odpowiedzi w formacie OpenAI (obsługiwane jest strumieniowanie)

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj proxy">
    Wymaga Node.js 22+ oraz Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Uruchom serwer">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Przetestuj proxy">
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
  <Step title="Skonfiguruj OpenClaw">
    Skieruj OpenClaw na proxy jako niestandardowy punkt końcowy zgodny z OpenAI:

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

| Identyfikator modelu | Mapuje na       |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Uwagi dotyczące proxy w stylu zgodnym z OpenAI">
    Ta ścieżka używa tej samej trasy zgodnej z OpenAI w stylu proxy co inne niestandardowe backendy `/v1`:

    - Natywne kształtowanie żądań tylko dla OpenAI nie ma zastosowania
    - Brak `service_tier`, brak `store` Responses, brak wskazówek prompt-cache i brak kształtowania payloadu zgodnego z rozumowaniem OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) nie są wstrzykiwane na adres URL proxy

  </Accordion>

  <Accordion title="Automatyczne uruchamianie w macOS za pomocą LaunchAgent">
    Utwórz LaunchAgent, aby automatycznie uruchamiać proxy:

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

## Uwagi

- To jest **narzędzie społecznościowe**, oficjalnie niewspierane przez Anthropic ani OpenClaw
- Wymaga aktywnej subskrypcji Claude Max/Pro z uwierzytelnionym Claude Code CLI
- Dziedziczy zachowanie Claude Code `claude -p` dotyczące rozliczeń, kredytów użycia i limitów szybkości
- Proxy działa lokalnie i nie wysyła danych do żadnych serwerów zewnętrznych
- Odpowiedzi strumieniowane są w pełni obsługiwane

<Note>
Aby skorzystać z natywnej integracji Anthropic z Claude CLI lub kluczami API, zobacz [dostawcę Anthropic](/pl/providers/anthropic). Informacje o subskrypcjach OpenAI/Codex znajdziesz w [dostawcy OpenAI](/pl/providers/openai).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawca Anthropic" href="/pl/providers/anthropic" icon="bolt">
    Natywna integracja OpenClaw z Claude CLI lub kluczami API.
  </Card>
  <Card title="Dostawca OpenAI" href="/pl/providers/openai" icon="robot">
    Dla subskrypcji OpenAI/Codex.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
