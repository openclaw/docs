---
read_when:
    - Chcesz używać subskrypcji Claude Max z narzędziami zgodnymi z OpenAI
    - Chcesz lokalnego serwera API, który opakowuje Claude Code CLI
    - Chcesz ocenić dostęp do Anthropic oparty na subskrypcji vs na kluczu API
summary: Społecznościowy proxy wystawiający poświadczenia subskrypcji Claude jako endpoint zgodny z OpenAI
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T14:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** to narzędzie społecznościowe, które wystawia twoją subskrypcję Claude Max/Pro jako endpoint API zgodny z OpenAI. Dzięki temu możesz używać swojej subskrypcji z dowolnym narzędziem obsługującym format OpenAI API.

<Warning>
Ta ścieżka zapewnia wyłącznie zgodność techniczną. Anthropic w przeszłości blokował część użycia subskrypcji
poza Claude Code. Musisz samodzielnie zdecydować, czy chcesz z tego korzystać,
i sprawdzić aktualne warunki Anthropic, zanim zaczniesz na tym polegać.
</Warning>

## Dlaczego warto tego używać?

| Approach                | Cost                                                | Best For                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | Płatność za token (~$15/M wejścia, $75/M wyjścia dla Opus) | Aplikacje produkcyjne, duży wolumen               |
| Claude Max subscription | $200/miesiąc stałej opłaty                          | Użycie osobiste, development, nielimitowane użycie |

Jeśli masz subskrypcję Claude Max i chcesz używać jej z narzędziami zgodnymi z OpenAI, ten proxy może obniżyć koszty w niektórych przepływach pracy. Klucze API pozostają bardziej jednoznaczną ścieżką polityki dla użycia produkcyjnego.

## Jak to działa

```
Twoja aplikacja → claude-max-api-proxy → Claude Code CLI → Anthropic (przez subskrypcję)
     (format OpenAI)                (konwersja formatu)      (używa twojego logowania)
```

Ten proxy:

1. Akceptuje żądania w formacie OpenAI pod `http://localhost:3456/v1/chat/completions`
2. Konwertuje je do poleceń Claude Code CLI
3. Zwraca odpowiedzi w formacie OpenAI (streaming jest obsługiwany)

## Instalacja

```bash
# Wymaga Node.js 20+ i Claude Code CLI
npm install -g claude-max-api-proxy

# Zweryfikuj, że Claude CLI jest uwierzytelnione
claude --version
```

## Użycie

### Uruchom serwer

```bash
claude-max-api
# Serwer działa pod http://localhost:3456
```

### Przetestuj go

```bash
# Kontrola stanu
curl http://localhost:3456/health

# Lista modeli
curl http://localhost:3456/v1/models

# Uzupełnianie czatu
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Z OpenClaw

Możesz skierować OpenClaw na ten proxy jako niestandardowy endpoint zgodny z OpenAI:

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

Ta ścieżka używa tej samej trasy proxy w stylu OpenAI-compatible co inne niestandardowe
backendy `/v1`:

- natywne kształtowanie żądań tylko dla OpenAI nie ma zastosowania
- brak `service_tier`, brak Responses `store`, brak wskazówek cache promptów i brak
  kształtowania payloadów zgodności rozumowania OpenAI
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane dla URL proxy

## Dostępne modele

| Model ID          | Maps To         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Automatyczne uruchamianie na macOS

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

## Linki

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Uwagi

- To **narzędzie społecznościowe**, oficjalnie niewspierane przez Anthropic ani OpenClaw
- Wymaga aktywnej subskrypcji Claude Max/Pro z uwierzytelnionym Claude Code CLI
- Proxy działa lokalnie i nie wysyła danych do żadnych serwerów firm trzecich
- Odpowiedzi strumieniowe są w pełni obsługiwane

## Zobacz także

- [Provider Anthropic](/providers/anthropic) - Natywna integracja OpenClaw z Claude CLI lub kluczami API
- [Provider OpenAI](/providers/openai) - Dla subskrypcji OpenAI/Codex
