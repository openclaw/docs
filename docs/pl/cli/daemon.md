---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń do zarządzania cyklem życia usługi (instalacja/uruchamianie/zatrzymywanie/ponowne uruchamianie/status)
summary: Dokumentacja CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-07-12T15:00:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias do zarządzania usługą Gateway. `openclaw daemon ...` odpowiada tym samym poleceniom sterowania usługą co `openclaw gateway ...`. W aktualnej dokumentacji i przykładach używaj [`openclaw gateway`](/pl/cli/gateway).

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

| Podpolecenie | Opcje                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `status`     | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                         |
| `install`    | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                     |
| `uninstall`  | `--json`                                                                                                                 |
| `start`      | `--json`                                                                                                                 |
| `stop`       | `--json`, `--disable` (tylko launchd: trwale wyłącza KeepAlive/RunAtLoad do następnego uruchomienia)                      |
| `restart`    | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                     |

- `status`: wyświetla stan instalacji usługi (launchd/systemd/schtasks) i sprawdza kondycję Gateway.
- `install`: instaluje usługę; `--force` ponownie instaluje lub nadpisuje istniejącą instalację.
- `restart --safe`: zleca działającemu Gateway przeprowadzenie wstępnej kontroli aktywnych zadań i zaplanowanie jednego skonsolidowanego ponownego uruchomienia po ich zakończeniu, z limitem określonym przez `gateway.reload.deferralTimeoutMs` (domyślnie 300000 ms/5 minut; ustaw `0`, aby czekać bezterminowo). Po wyczerpaniu tego limitu ponowne uruchomienie i tak zostaje wymuszone. Zwykłe `restart` korzysta bezpośrednio z menedżera usług; `--force` wymusza natychmiastowe ponowne uruchomienie.
- `restart --safe --skip-deferral`: pomija mechanizm odraczania ze względu na aktywne zadania, dzięki czemu Gateway uruchamia się ponownie natychmiast, nawet gdy zgłoszono blokady. Wymaga `--safe`.

## Uwagi

- `status` w miarę możliwości rozwiązuje skonfigurowane odwołania SecretRef do uwierzytelniania sondy. Jeśli wymagane odwołanie SecretRef pozostaje nierozwiązane, `status --json` zgłasza `rpc.authWarning`; jawnie przekaż `--token`/`--password` albo najpierw rozwiąż źródło sekretu. Ostrzeżenia o nierozwiązanym uwierzytelnianiu są ukrywane, gdy sonda mimo to zakończy się powodzeniem.
- `status --deep` dodaje wykonywane w miarę możliwości skanowanie na poziomie systemu w poszukiwaniu innych usług podobnych do Gateway (wyświetla wskazówki dotyczące ich usuwania; nadal zaleca się jeden Gateway na komputer) oraz przeprowadza walidację konfiguracji w trybie uwzględniającym pluginy, ujawniając ostrzeżenia dotyczące manifestów pluginów pomijane przez szybką ścieżkę domyślną.
- W instalacjach systemd w systemie Linux kontrole rozbieżności tokenów sprawdzają zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole rozbieżności tokenów rozwiązują odwołania SecretRef w `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowiska polecenia usługi, a następnie środowiska procesu). Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (`gateway.auth.mode` ma wartość `password`/`none`/`trusted-proxy` albo nie jest ustawione, a pierwszeństwo może uzyskać hasło), rozwiązywanie tokenu z konfiguracji jest pomijane.
- `install` sprawdza, czy zarządzany przez SecretRef parametr `gateway.auth.token` można rozwiązać, ale nigdy nie zapisuje rozwiązanej wartości w metadanych środowiska usługi; jeśli nie można jej rozwiązać, instalacja zostaje przerwana w trybie bezpiecznym.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, `install` jest blokowane do czasu jawnego ustawienia trybu.
- W systemie macOS polecenie `install` ogranicza dostęp do plików plist LaunchAgent oraz wygenerowanego pliku środowiska i wrappera wyłącznie do właściciela (tryb `0600`/`0700`), zamiast osadzać sekrety w `EnvironmentVariables`.
- Uruchamianie wielu instancji Gateway na jednym hoście: odizoluj porty, konfigurację/stan oraz obszary robocze. Zobacz [Wiele instancji Gateway](/pl/gateway#multiple-gateways-same-host).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Instrukcja operacyjna Gateway](/pl/gateway)
