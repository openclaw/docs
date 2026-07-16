---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebne są polecenia zarządzania cyklem życia usługi (instalacja/uruchomienie/zatrzymanie/ponowne uruchomienie/status)
summary: Dokumentacja CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-07-16T18:26:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias do zarządzania usługą Gateway. `openclaw daemon ...` odpowiada tym samym poleceniom sterowania usługą co `openclaw gateway ...`. Aktualną dokumentację i przykłady zawiera sekcja [`openclaw gateway`](/pl/cli/gateway).

## Użycie

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Podpolecenia i opcje

| Podpolecenie  | Opcje                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (tylko launchd: trwale wyłącza KeepAlive/RunAtLoad do następnego uruchomienia) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: wyświetla stan instalacji usługi (launchd/systemd/schtasks) i sprawdza kondycję Gateway.
- `install`: instaluje usługę; `--force` ponownie instaluje lub nadpisuje istniejącą instalację.
- `restart --safe`: prosi działający Gateway o wstępne sprawdzenie aktywnych zadań i zaplanowanie jednego skonsolidowanego ponownego uruchomienia po ich zakończeniu, z limitem określonym przez `gateway.reload.deferralTimeoutMs` (domyślnie 300000ms/5 minut; ustawienie `0` oznacza oczekiwanie bezterminowe). Po wyczerpaniu tego limitu ponowne uruchomienie jest mimo wszystko wymuszane. Zwykłe `restart` korzysta bezpośrednio z menedżera usług; `--force` wymusza wykonanie natychmiastowe.
- `restart --safe --skip-deferral`: pomija mechanizm odraczania z powodu aktywnych zadań, dzięki czemu Gateway uruchamia się ponownie natychmiast, nawet gdy zgłoszono blokady. Wymaga `--safe`.

## Uwagi

- `status` w miarę możliwości rozwiązuje skonfigurowane odwołania SecretRef uwierzytelniania na potrzeby uwierzytelniania testu. Jeśli wymagane odwołanie SecretRef pozostaje nierozwiązane, `status --json` zgłasza `rpc.authWarning`; należy jawnie przekazać `--token`/`--password` lub najpierw rozwiązać źródło sekretu. Ostrzeżenia o nierozwiązanym uwierzytelnianiu są wyciszane, gdy test poza tym kończy się powodzeniem.
- `status --deep` dodaje wykonywane w miarę możliwości skanowanie na poziomie systemu w poszukiwaniu innych usług podobnych do Gateway (wyświetla wskazówki dotyczące czyszczenia; nadal zaleca się jeden Gateway na maszynę) oraz uruchamia walidację konfiguracji w trybie uwzględniającym pluginy, ujawniając ostrzeżenia manifestów pluginów pomijane przez szybką ścieżkę domyślną.
- W instalacjach systemd w systemie Linux kontrole rozbieżności tokenów sprawdzają źródła jednostek zarówno `Environment=`, jak i `EnvironmentFile=`.
- Kontrole rozbieżności tokenów rozwiązują odwołania SecretRef `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, następnie środowisko procesu). Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (`gateway.auth.mode` ma wartość `password`/`none`/`trusted-proxy` albo nie jest ustawione, a pierwszeństwo może uzyskać hasło), rozwiązywanie tokenu konfiguracji jest pomijane.
- `install` sprawdza, czy zarządzane przez SecretRef odwołanie `gateway.auth.token` można rozwiązać, ale nigdy nie zapisuje rozwiązanej wartości w metadanych środowiska usługi; jeśli rozwiązanie nie jest możliwe, instalacja kończy się niepowodzeniem zgodnie z zasadą bezpiecznego odrzucenia.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, `install` blokuje działanie do czasu jawnego ustawienia trybu.
- W systemie macOS `install` ustawia pliki plist LaunchAgent oraz wygenerowany plik środowiska/skrypt opakowujący jako dostępne wyłącznie dla właściciela (tryb `0600`/`0700`), zamiast osadzać sekrety w `EnvironmentVariables`.
- Uruchamianie wielu instancji Gateway na jednym hoście: należy odizolować porty, konfigurację/stan oraz obszary robocze. Zobacz [Wiele instancji Gateway](/pl/gateway#multiple-gateways-same-host).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Procedury operacyjne Gateway](/pl/gateway)
