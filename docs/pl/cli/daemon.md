---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Odwołanie CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-05-02T22:17:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias dla poleceń zarządzania usługą Gateway.

`openclaw daemon ...` mapuje się na ten sam interfejs sterowania usługą co polecenia usługi `openclaw gateway ...`.

## Użycie

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Podpolecenia

- `status`: pokaż stan instalacji usługi i sprawdź kondycję Gateway
- `install`: zainstaluj usługę (`launchd`/`systemd`/`schtasks`)
- `uninstall`: usuń usługę
- `start`: uruchom usługę
- `stop`: zatrzymaj usługę
- `restart`: uruchom usługę ponownie

## Wspólne opcje

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- cykl życia (`uninstall|start|stop`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane auth SecretRefs dla uwierzytelniania sondy, gdy jest to możliwe.
- Jeśli wymagany auth SecretRef pozostaje nierozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych auth-ref są pomijane, aby uniknąć wyników fałszywie dodatnich.
- `status --deep` dodaje best-effort skan usługi na poziomie systemu. Gdy znajdzie inne usługi przypominające Gateway, wyjście dla człowieka wypisuje wskazówki dotyczące czyszczenia i ostrzega, że jeden Gateway na maszynę nadal jest normalnym zaleceniem.
- W instalacjach Linux systemd kontrole rozbieżności tokena w `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole rozbieżności rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego env środowiska uruchomieniowego (najpierw env polecenia usługi, potem awaryjnie env procesu).
- Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawny `gateway.auth.mode` ustawiony na `password`/`none`/`trusted-proxy` albo brak ustawionego trybu, gdzie hasło może wygrać i żaden kandydat na token nie może wygrać), kontrole rozbieżności tokena pomijają rozwiązywanie tokena konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokena w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef pozostaje nierozwiązany, instalacja kończy się niepowodzeniem w trybie zamkniętym.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- W systemie macOS `install` utrzymuje pliki plist LaunchAgent jako dostępne tylko dla właściciela i ładuje zarządzane wartości środowiska usługi przez plik dostępny tylko dla właściciela oraz wrapper, zamiast serializować klucze API lub odwołania env profilu uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan oraz obszary robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

## Zalecane

Używaj [`openclaw gateway`](/pl/cli/gateway), aby korzystać z aktualnej dokumentacji i przykładów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
