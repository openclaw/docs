---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-05T13:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby bezpośrednio wskazać skonfigurowanego agenta.

Przekaż co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Agent send](/tools/agent-send)

## Opcje

- `-m, --message <text>`: wymagane body wiadomości
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; nadpisuje powiązania routingu
- `--thinking <off|minimal|low|medium|high|xhigh>`: poziom myślenia agenta
- `--verbose <on|off>`: zachowuje poziom verbose dla sesji
- `--channel <channel>`: kanał dostarczania; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: nadpisanie celu dostarczania
- `--reply-channel <channel>`: nadpisanie kanału dostarczania
- `--reply-account <id>`: nadpisanie konta dostarczania
- `--local`: uruchamia osadzonego agenta bezpośrednio (po wstępnym załadowaniu rejestru pluginów)
- `--deliver`: wysyła odpowiedź z powrotem na wybrany kanał/cel
- `--timeout <seconds>`: nadpisuje limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: wyjście JSON

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

- Tryb Gateway wraca do osadzonego agenta, gdy żądanie do Gateway się nie powiedzie. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr pluginów, więc providery, narzędzia i kanały dostarczane przez pluginy pozostają dostępne podczas uruchomień osadzonych.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczanie odpowiedzi, a nie na routing sesji.
- Gdy to polecenie wyzwala ponowne wygenerowanie `models.json`, dane uwierzytelniające providera zarządzane przez SecretRef są zapisywane jako znaczniki niesekretne (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako jawny tekst rozwiązanych sekretów.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnego snapshotu konfiguracji źródłowej, a nie z rozwiązanych wartości sekretów w runtime.
