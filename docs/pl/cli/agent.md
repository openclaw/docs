---
read_when:
    - Chcesz uruchomić jedną turę agenta z poziomu skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja referencyjna CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-30T09:41:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby bezpośrednio wskazać skonfigurowanego agenta.

Przekaż co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Wysyłanie agenta](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: wymagana treść wiadomości
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; zastępuje powiązania routingu
- `--model <id>`: nadpisanie modelu dla tego uruchomienia (`provider/model` lub identyfikator modelu)
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez dostawcę, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: utrwal poziom szczegółowości dla sesji
- `--channel <channel>`: kanał dostarczenia; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: nadpisanie celu dostarczenia
- `--reply-channel <channel>`: nadpisanie kanału dostarczenia
- `--reply-account <id>`: nadpisanie konta dostarczenia
- `--local`: uruchom osadzonego agenta bezpośrednio (po wstępnym załadowaniu rejestru pluginów)
- `--deliver`: wyślij odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: nadpisz limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: wyjście JSON

## Przykłady

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Uwagi

- Tryb Gateway przełącza się awaryjnie na osadzonego agenta, gdy żądanie Gateway się nie powiedzie. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr pluginów, więc dostawcy, narzędzia i kanały zapewniane przez pluginy pozostają dostępne podczas uruchomień osadzonych.
- `--local` i osadzone uruchomienia awaryjne są traktowane jako uruchomienia jednorazowe. Dołączone zasoby MCP loopback oraz ciepłe sesje Claude stdio otwarte dla tego lokalnego procesu są wycofywane po odpowiedzi, więc wywołania skryptowe nie utrzymują lokalnych procesów potomnych przy życiu.
- Uruchomienia oparte na Gateway pozostawiają zasoby MCP loopback należące do Gateway w działającym procesie Gateway; starsi klienci mogą nadal wysyłać historyczną flagę czyszczenia, ale Gateway akceptuje ją jako bezoperacyjną zgodność wsteczną.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczenie odpowiedzi, a nie na routing sesji.
- `--json` rezerwuje stdout dla odpowiedzi JSON. Diagnostyka Gateway, pluginów i osadzonego trybu awaryjnego jest kierowana do stderr, aby skrypty mogły bezpośrednio parsować stdout.
- JSON osadzonego trybu awaryjnego zawiera `meta.transport: "embedded"` i `meta.fallbackFrom: "gateway"`, aby skrypty mogły odróżnić uruchomienia awaryjne od uruchomień Gateway.
- Jeśli Gateway przyjmie uruchomienie agenta, ale CLI przekroczy limit czasu oczekiwania na końcową odpowiedź, osadzony tryb awaryjny użyje świeżego jawnego identyfikatora sesji/uruchomienia `gateway-fallback-*` i zgłosi `meta.fallbackReason: "gateway_timeout"` oraz pola sesji awaryjnej. Pozwala to uniknąć wyścigu z blokadą transkryptu należącą do Gateway albo cichego zastąpienia oryginalnej routowanej sesji rozmowy.
- Gdy to polecenie wyzwala ponowne wygenerowanie `models.json`, poświadczenia dostawców zarządzane przez SecretRef są utrwalane jako niesekretne znaczniki (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako rozwiązany tajny tekst jawny.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw utrwala znaczniki z aktywnego zrzutu konfiguracji źródłowej, a nie z rozwiązanych wartości sekretów w czasie wykonywania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Środowisko wykonawcze agenta](/pl/concepts/agent)
