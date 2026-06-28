---
read_when:
    - Chcesz używać subskrypcji Claude Max z narzędziami zgodnymi z OpenAI
    - Chcesz lokalny serwer API, który opakowuje CLI Claude Code
    - Chcesz ocenić dostęp do Anthropic oparty na subskrypcji w porównaniu z dostępem opartym na kluczu API
summary: Społecznościowy proxy udostępniający poświadczenia subskrypcji Claude jako punkt końcowy zgodny z OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:45:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** to narzędzie społecznościowe, które udostępnia Twoją subskrypcję Claude Max/Pro jako zgodny z OpenAI punkt końcowy API. Pozwala to używać subskrypcji z dowolnym narzędziem obsługującym format OpenAI API.

<Warning>
Ta ścieżka służy wyłącznie do zgodności technicznej. Anthropic w przeszłości blokował część użycia subskrypcji
poza Claude Code. Musisz samodzielnie zdecydować, czy jej używać,
i zweryfikować bieżące zasady rozliczeń Anthropic, zanim zaczniesz na niej polegać.

Bieżąca dokumentacja pomocy Anthropic mówi, że `claude -p` to użycie Agent SDK/programistyczne.
Aktualizacja pomocy Anthropic z 15 czerwca 2026 r. wstrzymała zapowiedziany osobny plan kredytów
Agent SDK. Na razie Claude Agent SDK, `claude -p` oraz użycie aplikacji firm trzecich
nadal korzystają z limitów użycia zalogowanej subskrypcji.

Przed poleganiem na tej ścieżce sprawdź [artykuł o planie Agent SDK
Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
a także artykuły pomocy Claude Code dla kont
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
lub
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Dlaczego tego używać?

| Podejście                 | Ścieżka kosztów                                  | Najlepsze dla                               |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Płatność za token przez Claude Console lub chmurę | Aplikacje produkcyjne, współdzielona automatyzacja, duża skala |
| Proxy subskrypcji Claude | Zasady planu i kredytów Claude Code / `claude -p` | Osobiste eksperymenty ze zgodnymi narzędziami |

Jeśli masz subskrypcję Claude Max lub Pro i chcesz używać jej z narzędziami
zgodnymi z OpenAI, ten proxy może pasować do niektórych osobistych przepływów pracy. Nie jest to
nielimitowana ścieżka z opłatą ryczałtową. Klucze API pozostają jaśniejszą ścieżką zasad i rozliczeń
dla użycia produkcyjnego.

## Jak to działa

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proxy:

1. Przyjmuje żądania w formacie OpenAI pod `http://localhost:3456/v1/chat/completions`
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

| ID modelu         | Odpowiada       |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Uwagi dotyczące zgodnej z OpenAI ścieżki typu proxy">
    Ta ścieżka używa tej samej zgodnej z OpenAI trasy typu proxy co inne niestandardowe
    backendy `/v1`:

    - Natywne kształtowanie żądań tylko dla OpenAI nie ma zastosowania
    - Brak `service_tier`, brak Responses `store`, brak wskazówek pamięci podręcznej promptów oraz brak
      kształtowania payloadu zgodnego z reasoning OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane pod adresem URL proxy

  </Accordion>

  <Accordion title="Automatyczny start na macOS z LaunchAgent">
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

- To **narzędzie społecznościowe**, które nie jest oficjalnie wspierane przez Anthropic ani OpenClaw
- Wymaga aktywnej subskrypcji Claude Max/Pro z uwierzytelnionym Claude Code CLI
- Dziedziczy zachowanie rozliczeń, kredytów użycia i limitów szybkości Claude Code `claude -p`
- Proxy działa lokalnie i nie wysyła danych na żadne serwery firm trzecich
- Odpowiedzi strumieniowe są w pełni obsługiwane

<Note>
Aby użyć natywnej integracji Anthropic z Claude CLI lub kluczami API, zobacz [dostawcę Anthropic](/pl/providers/anthropic). Dla subskrypcji OpenAI/Codex zobacz [dostawcę OpenAI](/pl/providers/openai).
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
    Przegląd wszystkich dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
