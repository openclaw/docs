---
read_when:
    - Chcesz terminalowy interfejs użytkownika dla Gateway (przyjazny dla pracy zdalnej)
    - Chcesz przekazywać url/token/session ze skryptów
    - Chcesz uruchomić TUI w lokalnym trybie osadzonym bez Gateway
    - Chcesz użyć openclaw chat lub openclaw tui --local
summary: CLI reference dla `openclaw tui` (interfejs terminalowy oparty na Gateway lub lokalnie osadzony)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:24:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Otwórz interfejs terminalowy połączony z Gateway albo uruchom go w lokalnym trybie osadzonym.

Powiązane:

- Przewodnik po TUI: [TUI](/pl/web/tui)

## Opcje

| Flaga                 | Domyślnie                                | Opis                                                                                                             |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                  | Uruchom względem lokalnego osadzonego środowiska uruchomieniowego agenta zamiast Gateway.                        |
| `--url <url>`         | `gateway.remote.url` z konfiguracji      | URL WebSocket Gateway.                                                                                           |
| `--token <token>`     | (brak)                                   | Token Gateway, jeśli jest wymagany.                                                                              |
| `--password <pass>`   | (brak)                                   | Hasło Gateway, jeśli jest wymagane.                                                                              |
| `--session <key>`     | `main` (lub `global`, gdy zakres globalny) | Klucz sesji. W obszarze roboczym agenta automatycznie wybiera tego agenta, chyba że użyto prefiksu.              |
| `--deliver`           | `false`                                  | Dostarczaj odpowiedzi asystenta przez skonfigurowane kanały.                                                     |
| `--thinking <level>`  | (domyślne modelu)                        | Nadpisanie poziomu myślenia.                                                                                     |
| `--message <text>`    | (brak)                                   | Wyślij wiadomość początkową po połączeniu.                                                                       |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Limit czasu agenta. Nieprawidłowe wartości zapisują ostrzeżenie w logu i są ignorowane.                          |
| `--history-limit <n>` | `200`                                    | Wpisy historii do załadowania przy dołączaniu.                                                                   |

Aliasy: `openclaw chat` i `openclaw terminal` wywołują to samo polecenie z domyślnym `--local`.

Uwagi:

- `chat` i `terminal` są aliasami dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- `tui` w miarę możliwości rozwiązuje skonfigurowane SecretRefs uwierzytelniania Gateway dla tokenu/hasła (dostawcy `env`/`file`/`exec`).
- Po uruchomieniu z katalogu skonfigurowanego obszaru roboczego agenta TUI automatycznie wybiera tego agenta jako domyślny klucz sesji (chyba że `--session` ma jawnie postać `agent:<id>:...`).
- Aby pokazać nazwę hosta Gateway w stopce dla nielokalnych połączeń opartych na URL, uruchom `openclaw config set tui.footer.showRemoteHost true`. Etykieta hosta jest domyślnie wyłączona i nigdy nie pojawia się dla połączeń local loopback ani osadzonych połączeń lokalnych.
- Tryb lokalny używa bezpośrednio osadzonego środowiska uruchomieniowego agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko przez Gateway są niedostępne.
- Tryb lokalny dodaje `/auth [provider]` w zakresie poleceń TUI.
- Bramki zatwierdzania Plugin nadal obowiązują w trybie lokalnym. Narzędzia wymagające zatwierdzenia proszą o decyzję w terminalu; nic nie jest po cichu automatycznie zatwierdzane tylko dlatego, że Gateway nie uczestniczy w procesie.
- [Cele](/pl/tools/goal) sesji pojawiają się w stopce i można nimi zarządzać za pomocą `/goal`.

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

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację, a chcesz, aby osadzony agent ją sprawdził, porównał z dokumentacją i pomógł naprawić ją z tego samego terminala:

Jeśli `openclaw config validate` już kończy się niepowodzeniem, najpierw użyj `openclaw configure` albo `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.

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

Zastosuj ukierunkowane poprawki za pomocą `openclaw config set` albo `openclaw configure`, a następnie ponownie uruchom `openclaw config validate`. Zobacz [TUI](/pl/web/tui) i [Konfiguracja](/pl/cli/config).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [TUI](/pl/web/tui)
- [Cel](/pl/tools/goal)
