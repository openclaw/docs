---
read_when:
    - Chcesz korzystać z subskrypcji Claude Max z narzędziami zgodnymi z OpenAI
    - Chcesz lokalnego serwera API, który opakowuje Claude Code CLI
    - Chcesz porównać dostęp do Anthropic oparty na subskrypcji z dostępem opartym na kluczu API
summary: Społecznościowy serwer proxy udostępniający dane uwierzytelniające subskrypcji Claude jako punkt końcowy zgodny z OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-07-12T15:33:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** to społecznościowy pakiet npm (nie plugin OpenClaw), który
udostępnia subskrypcję Claude Max/Pro jako punkt końcowy API zgodny z OpenAI,
dzięki czemu dowolne narzędzie zgodne z OpenAI może korzystać z Twojej subskrypcji
zamiast klucza API Anthropic.

<Warning>
Zapewnia wyłącznie zgodność techniczną i nie jest oficjalnie zatwierdzonym
rozwiązaniem. W przeszłości Anthropic blokował niektóre zastosowania subskrypcji
poza Claude Code; przed skorzystaniem z tego rozwiązania sprawdź aktualne zasady
rozliczeń Anthropic.

Dokumentacja Claude Code firmy Anthropic opisuje `claude -p` jako użycie
Agent SDK/programistyczne. Zgodnie z aktualizacją pomocy technicznej Anthropic
z 15 czerwca 2026 r. Claude Agent SDK, `claude -p` oraz aplikacje innych firm
korzystają z limitów użycia zalogowanej subskrypcji (wcześniej zapowiadany
oddzielny plan środków dla Agent SDK został wstrzymany). Zobacz [artykuł o planie
Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
artykuły dotyczące planów [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
i [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
oraz stronę [dostawcy Anthropic](/pl/providers/anthropic), aby poznać informacje
OpenClaw dotyczące rozliczania Claude CLI.
</Warning>

## Dlaczego warto z tego korzystać

| Podejście                     | Sposób rozliczania                                | Najlepsze zastosowanie                                      |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Klucz API Anthropic           | Opłata za token za pośrednictwem Claude Console   | Aplikacje produkcyjne, współdzielone automatyzacje, duży ruch |
| Proxy subskrypcji Claude      | Zasady planu i środków Claude Code / `claude -p`  | Osobiste eksperymenty ze zgodnymi narzędziami               |

Ten serwer proxy umożliwia używanie subskrypcji Claude Max lub Pro z narzędziami
zgodnymi z OpenAI. Nie zapewnia nielimitowanego dostępu za stałą opłatą —
dziedziczy limity użycia Claude Code. W zastosowaniach produkcyjnych klucze API
pozostają bardziej przejrzystym sposobem rozliczania.

## Jak to działa

```text
Twoja aplikacja -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (format OpenAI)                     (konwertuje format)          (używa Twojego logowania)
```

Dla każdego żądania serwer proxy uruchamia Claude Code CLI jako podproces,
konwertuje żądania czatu w formacie OpenAI na monity CLI, a następnie przesyła
strumieniowo (lub zwraca) odpowiedź w formacie OpenAI.

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj serwer proxy">
    Wymaga Node.js 20+ oraz uwierzytelnionego Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Sprawdź, czy Claude CLI jest uwierzytelnione
    claude --version
    claude auth login   # jeśli nie jest jeszcze uwierzytelnione
    ```

  </Step>
  <Step title="Uruchom serwer">
    ```bash
    claude-max-api
    # Serwer działa pod adresem http://localhost:3456
    ```
  </Step>
  <Step title="Przetestuj serwer proxy">
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
  <Step title="Skonfiguruj OpenClaw">
    Skieruj OpenClaw do serwera proxy jako niestandardowego punktu końcowego
    zgodnego z OpenAI:

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
Poniższe identyfikatory modeli pochodzą z własnego katalogu serwera proxy,
a nie z odwołań do modeli Anthropic w OpenClaw. Każdy identyfikator jest
mapowany na alias modelu Claude Code CLI (`opus`, `sonnet`, `haiku`), dlatego
model bazowy zmienia się za każdym razem, gdy Anthropic aktualizuje dany alias
w CLI. Przed przyjęciem określonego mapowania sprawdź aktualny plik README
serwera proxy.
</Note>

| Identyfikator modelu | Alias CLI | Bieżące mapowanie |
| -------------------- | --------- | ----------------- |
| `claude-opus-4`      | `opus`    | Claude Opus 4.5   |
| `claude-sonnet-4`    | `sonnet`  | Claude Sonnet 4   |
| `claude-haiku-4`     | `haiku`   | Claude Haiku 4    |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Uwagi dotyczące serwera proxy zgodnego z OpenAI">
    To rozwiązanie korzysta z ogólnej niestandardowej trasy `/v1` OpenClaw
    zgodnej z OpenAI — tej samej co każdy inny samodzielnie hostowany backend
    zgodny z OpenAI:

    - Natywne kształtowanie żądań przeznaczone wyłącznie dla OpenAI nie ma zastosowania.
    - `/fast` i `service_tier` dotyczą wyłącznie bezpośredniego ruchu do
      `api.anthropic.com`; trasy serwera proxy pozostawiają `service_tier` bez
      zmian (zobacz [tryb szybki dostawcy Anthropic](/pl/providers/anthropic#advanced-configuration)).
    - Brak `store` z Responses, wskazówek dotyczących pamięci podręcznej monitów
      oraz kształtowania ładunku zapewniającego zgodność z mechanizmem rozumowania OpenAI.
    - Nagłówki atrybucji OpenAI/Codex w OpenClaw (`originator`, `version`,
      `User-Agent`) są wysyłane wyłącznie w natywnym ruchu OAuth do
      `api.openai.com`, a nie do niestandardowych celów `OPENAI_BASE_URL`,
      takich jak ten serwer proxy.

  </Accordion>

  <Accordion title="Automatyczne uruchamianie w systemie macOS za pomocą LaunchAgent">
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

- Dziedziczy sposób rozliczania, korzystania ze środków oraz ograniczania liczby żądań przez `claude -p` w Claude Code.
- Nasłuchuje wyłącznie na `127.0.0.1`; nie wysyła danych do żadnego serwera innej firmy poza własnym wywołaniem Anthropic przez CLI.
- Obsługuje odpowiedzi przesyłane strumieniowo.
- Błędy uwierzytelniania nie są sprawdzane podczas uruchamiania i ujawniają się dopiero po rzeczywistym wykonaniu żądania czatu; jeśli CLI nie jest uwierzytelnione, pierwsze żądanie zakończy się niepowodzeniem, zamiast uniemożliwić uruchomienie serwera.

<Note>
Informacje o natywnej integracji Anthropic z Claude CLI lub kluczami API znajdziesz
na stronie [dostawcy Anthropic](/pl/providers/anthropic). Informacje o subskrypcjach
OpenAI/Codex znajdziesz na stronie [dostawcy OpenAI](/pl/providers/openai).
</Note>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawca Anthropic" href="/pl/providers/anthropic" icon="bolt">
    Natywna integracja OpenClaw z Claude CLI lub kluczami API.
  </Card>
  <Card title="Dostawca OpenAI" href="/pl/providers/openai" icon="robot">
    Informacje dotyczące subskrypcji OpenAI/Codex.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i działania mechanizmu awaryjnego przełączania.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
