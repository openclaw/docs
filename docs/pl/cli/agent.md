---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-24T09:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby kierować bezpośrednio do skonfigurowanego agenta.

Podaj co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Agent send](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: wymagane ciało wiadomości
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; nadpisuje powiązania routingu
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez providera, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: zapisuje poziom verbose dla sesji
- `--channel <channel>`: kanał dostarczania; pomiń, aby użyć kanału sesji głównej
- `--reply-to <target>`: nadpisanie celu dostarczania
- `--reply-channel <channel>`: nadpisanie kanału dostarczania
- `--reply-account <id>`: nadpisanie konta dostarczania
- `--local`: uruchamia osadzonego agenta bezpośrednio (po wstępnym załadowaniu rejestru Pluginów)
- `--deliver`: wysyła odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: nadpisuje limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: zwraca dane wyjściowe JSON

## Przykłady

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Uwagi

- Tryb Gateway wraca do osadzonego agenta, gdy żądanie do Gateway zakończy się niepowodzeniem. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr Pluginów, więc dostawcy, narzędzia i kanały dostarczane przez Pluginy pozostają dostępne podczas uruchomień osadzonych.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczanie odpowiedzi, a nie na routing sesji.
- Gdy to polecenie wyzwala regenerację `models.json`, poświadczenia providera zarządzane przez SecretRef są zapisywane jako znaczniki niesekretne (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako rozstrzygnięty jawny tekst sekretu.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnego snapshotu konfiguracji źródłowej, a nie z rozstrzygniętych wartości sekretów w runtime.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runtime agenta](/pl/concepts/agent)
