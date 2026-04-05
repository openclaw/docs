---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja CLI dla `openclaw daemon` (starszy alias do zarządzania usługą gateway)
title: daemon
x-i18n:
    generated_at: "2026-04-05T13:48:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Starszy alias dla poleceń zarządzania usługą Gateway.

`openclaw daemon ...` mapuje się na tę samą powierzchnię sterowania usługą co polecenia usługi `openclaw gateway ...`.

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

## Typowe opcje

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- cykl życia (`uninstall|start|stop|restart`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane SecretRef uwierzytelniania dla uwierzytelniania probe, gdy to możliwe.
- Jeśli wymagany SecretRef uwierzytelniania nie jest rozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy probe połączenia/uwierzytelniania się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli probe powiedzie się, ostrzeżenia o nierozwiązanych auth-ref są tłumione, aby uniknąć fałszywych alarmów.
- `status --deep` dodaje skanowanie usług na poziomie systemu w trybie best-effort. Gdy znajdzie inne usługi podobne do gateway, wynik dla człowieka wyświetla wskazówki dotyczące czyszczenia i ostrzega, że jedna gateway na maszynę nadal jest normalnym zaleceniem.
- W instalacjach Linux systemd sprawdzenia dryfu tokena przez `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Sprawdzenia dryfu rozwiązują SecretRef `gateway.auth.token` przy użyciu scalonego runtime env (najpierw env polecenia usługi, potem fallback do env procesu).
- Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawne `gateway.auth.mode` o wartości `password`/`none`/`trusted-proxy`, albo nieustawiony tryb, w którym może wygrać hasło i żaden kandydat tokena nie może wygrać), sprawdzenia dryfu tokena pomijają rozwiązywanie tokena z konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, `install` sprawdza, czy SecretRef można rozwiązać, ale nie zapisuje rozwiązanego tokena do metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie jest rozwiązany, instalacja kończy się bezpieczną odmową.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana, dopóki tryb nie zostanie ustawiony jawnie.
- Jeśli celowo uruchamiasz wiele gateway na jednym hoście, odizoluj porty, config/state i workspace'y; zobacz [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Preferowane

Użyj [`openclaw gateway`](/cli/gateway), aby zobaczyć aktualną dokumentację i przykłady.
