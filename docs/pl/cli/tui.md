---
read_when:
    - Potrzebujesz interfejsu terminalowego dla Gateway (przystosowanego do pracy zdalnej)
    - Chcesz przekazywać adres URL/token/sesję ze skryptów
    - Chcesz uruchomić TUI w lokalnym trybie osadzonym bez Gateway
    - Chcesz użyć `openclaw chat` lub `openclaw tui --local`
summary: Dokumentacja CLI dla `openclaw tui` (terminalowy interfejs użytkownika oparty na Gateway lub osadzony lokalnie)
title: TUI
x-i18n:
    generated_at: "2026-07-12T14:56:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Otwórz terminalowy interfejs użytkownika połączony z Gateway lub uruchom go w lokalnym trybie osadzonym.

Powiązany przewodnik: [TUI](/pl/web/tui)

## Opcje

| Flaga                        | Wartość domyślna                          | Opis                                                                                                        |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Uruchom z lokalnym osadzonym środowiskiem wykonawczym agenta zamiast Gateway.                               |
| `--url <url>`                | `gateway.remote.url` z konfiguracji       | Adres URL WebSocket Gateway.                                                                                |
| `--token <token>`            | (brak)                                    | Token Gateway, jeśli jest wymagany.                                                                         |
| `--password <pass>`          | (brak)                                    | Hasło Gateway, jeśli jest wymagane.                                                                         |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Oczekiwany odcisk certyfikatu TLS dla przypiętego Gateway korzystającego z `wss://`.                         |
| `--session <key>`            | `main` (lub `global`, gdy zakres jest globalny) | Klucz sesji. W przestrzeni roboczej agenta automatycznie wybiera tego agenta, chyba że podano prefiks. |
| `--deliver`                  | `false`                                   | Dostarczaj odpowiedzi asystenta przez skonfigurowane kanały.                                                |
| `--thinking <level>`         | (wartość domyślna modelu)                 | Nadpisanie poziomu rozumowania.                                                                              |
| `--message <text>`           | (brak)                                    | Wyślij wiadomość początkową po nawiązaniu połączenia.                                                       |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Limit czasu agenta. Nieprawidłowe wartości powodują zapisanie ostrzeżenia w dzienniku i są ignorowane.       |
| `--history-limit <n>`        | `200`                                     | Liczba wpisów historii wczytywanych podczas dołączania.                                                     |

Aliasy: `openclaw chat` i `openclaw terminal` wywołują to polecenie z domyślnie zastosowaną opcją `--local`.

## Uwagi

- Opcji `--local` nie można łączyć z `--url`, `--token`, `--password` ani `--tls-fingerprint`.
- Gdy jest to możliwe, `tui` rozpoznaje skonfigurowane odwołania SecretRef uwierzytelniania Gateway dla uwierzytelniania tokenem lub hasłem (dostawcy `env`/`file`/`exec`).
- Jeśli nie podano jawnie adresu URL ani portu, `tui` używa aktywnego portu lokalnego Gateway zapisanego przez działający Gateway. Jawne ustawienia `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` oraz konfiguracja zdalnego Gateway mają pierwszeństwo.
- Po uruchomieniu z katalogu skonfigurowanej przestrzeni roboczej agenta TUI automatycznie wybiera tego agenta jako domyślną wartość klucza sesji (chyba że opcja `--session` ma jawnie postać `agent:<id>:...`).
- Aby wyświetlać nazwę hosta Gateway w stopce dla połączeń innych niż lokalne, korzystających z adresu URL, uruchom `openclaw config set tui.footer.showRemoteHost true`. Domyślnie wyłączone; nigdy nie jest wyświetlane dla połączeń local loopback ani osadzonych połączeń lokalnych.
- Tryb lokalny korzysta bezpośrednio z osadzonego środowiska wykonawczego agenta. Większość narzędzi lokalnych działa, ale funkcje dostępne wyłącznie w Gateway są niedostępne.
- Tryb lokalny dodaje `/auth [provider]` do zestawu poleceń TUI.
- Bramki zatwierdzania Pluginów nadal obowiązują w trybie lokalnym: narzędzia wymagające zatwierdzenia wyświetlają w terminalu monit o podjęcie decyzji; nic nie jest automatycznie zatwierdzane bez powiadomienia.
- [Cele](/pl/tools/goal) sesji są widoczne w stopce i można nimi zarządzać za pomocą `/goal`.

## Przykłady

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Porównaj moją konfigurację z dokumentacją i powiedz mi, co należy poprawić"
# po uruchomieniu w przestrzeni roboczej agenta automatycznie rozpoznaje tego agenta
openclaw tui --session bugfix
```

## Pętla naprawy konfiguracji

Użyj trybu lokalnego, aby osadzony agent sprawdził bieżącą konfigurację, porównał ją z dokumentacją i pomógł ją naprawić w tym samym terminalu.

Jeśli polecenie `openclaw config validate` już kończy się niepowodzeniem, najpierw uruchom `openclaw configure` lub `openclaw doctor --fix`; `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.

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

Wprowadź ukierunkowane poprawki za pomocą `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `openclaw config validate`. Zobacz [TUI](/pl/web/tui) i [Konfiguracja](/pl/cli/config).

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [TUI](/pl/web/tui)
- [Cel](/pl/tools/goal)
