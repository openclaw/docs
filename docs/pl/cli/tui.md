---
read_when:
    - Chcesz interfejsu terminalowego dla Gateway (przyjaznego dla pracy zdalnej)
    - Chcesz przekazywać url/token/session z poziomu skryptów
    - Chcesz uruchomić TUI w lokalnym trybie osadzonym bez Gateway
    - Chcesz użyć openclaw chat lub openclaw tui --local
summary: Dokumentacja CLI dla `openclaw tui` (terminalowy interfejs użytkownika obsługiwany przez Gateway lub osadzony lokalnie)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Otwórz terminalowy UI połączony z Gateway albo uruchom go w lokalnym trybie
osadzonym.

Powiązane:

- Przewodnik TUI: [TUI](/pl/web/tui)

## Opcje

| Flaga                 | Domyślnie                                 | Opis                                                                                                            |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Uruchom względem lokalnego osadzonego środowiska uruchomieniowego agenta zamiast Gateway.                       |
| `--url <url>`         | `gateway.remote.url` z konfiguracji       | Adres URL WebSocket Gateway.                                                                                    |
| `--token <token>`     | (brak)                                    | Token Gateway, jeśli jest wymagany.                                                                            |
| `--password <pass>`   | (brak)                                    | Hasło Gateway, jeśli jest wymagane.                                                                            |
| `--session <key>`     | `main` (lub `global`, gdy zakres jest globalny) | Klucz sesji. W przestrzeni roboczej agenta automatycznie wybiera tego agenta, chyba że dodano prefiks. |
| `--deliver`           | `false`                                   | Dostarczaj odpowiedzi asystenta przez skonfigurowane kanały.                                                    |
| `--thinking <level>`  | (domyślne modelu)                         | Nadpisanie poziomu myślenia.                                                                                   |
| `--message <text>`    | (brak)                                    | Wyślij początkową wiadomość po połączeniu.                                                                      |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Limit czasu agenta. Nieprawidłowe wartości zapisują ostrzeżenie w dzienniku i są ignorowane.                   |
| `--history-limit <n>` | `200`                                     | Liczba wpisów historii do załadowania przy dołączaniu.                                                          |

Aliasy: `openclaw chat` i `openclaw terminal` wywołują to samo polecenie z domyślnym `--local`.

Uwagi:

- `chat` i `terminal` są aliasami dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- `tui` rozwiązuje skonfigurowane SecretRefs autoryzacji Gateway dla autoryzacji tokenem/hasłem, gdy to możliwe (dostawcy `env`/`file`/`exec`).
- Po uruchomieniu z katalogu skonfigurowanej przestrzeni roboczej agenta TUI automatycznie wybiera tego agenta jako domyślny klucz sesji (chyba że `--session` jest jawnie w formie `agent:<id>:...`).
- Tryb lokalny używa bezpośrednio osadzonego środowiska uruchomieniowego agenta. Większość narzędzi lokalnych działa, ale funkcje dostępne tylko przez Gateway są niedostępne.
- Tryb lokalny dodaje `/auth [provider]` w powierzchni poleceń TUI.
- Bramki zatwierdzania Plugin nadal obowiązują w trybie lokalnym. Narzędzia wymagające zatwierdzenia proszą o decyzję w terminalu; nic nie jest po cichu automatycznie zatwierdzane tylko dlatego, że Gateway nie bierze udziału.

## Przykłady

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Pętla naprawy konfiguracji

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
osadzony agent ją sprawdził, porównał z dokumentacją oraz pomógł ją naprawić
z tego samego terminala:

Jeśli `openclaw config validate` już kończy się niepowodzeniem, najpierw użyj `openclaw configure` albo
`openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową
konfiguracją.

```bash
openclaw chat
```

Następnie w TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Zastosuj ukierunkowane poprawki za pomocą `openclaw config set` albo `openclaw configure`, a następnie
ponownie uruchom `openclaw config validate`. Zobacz [TUI](/pl/web/tui) i [Konfiguracja](/pl/cli/config).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [TUI](/pl/web/tui)
