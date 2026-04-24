---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Starszy alias dla poleceń zarządzania usługą Gateway.

`openclaw daemon ...` mapuje się na tę samą powierzchnię sterowania usługą co polecenia usługowe `openclaw gateway ...`.

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

- `status` rozwiązuje skonfigurowane SecretRef uwierzytelniania dla uwierzytelniania sondy, gdy to możliwe.
- Jeśli wymagany SecretRef uwierzytelniania nie może zostać rozwiązany w tej ścieżce polecenia, `daemon status --json` raportuje `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda zakończy się powodzeniem, ostrzeżenia o nierozwiązanym auth-ref są ukrywane, aby uniknąć fałszywych alarmów.
- `status --deep` dodaje skanowanie usługi na poziomie systemu z podejściem best-effort. Gdy znajdzie inne usługi podobne do Gateway, wyjście dla człowieka drukuje wskazówki dotyczące czyszczenia i ostrzega, że jedna Gateway na maszynę nadal jest normalnym zaleceniem.
- W instalacjach Linux systemd kontrole dryfu tokena w `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole dryfu rozwiązują SecretRef `gateway.auth.token` przy użyciu scalonego env środowiska uruchomieniowego (najpierw env polecenia usługi, potem rezerwa env procesu).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawne `gateway.auth.mode` ustawione na `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdy może wygrać hasło i żaden kandydat tokena nie może wygrać), kontrole dryfu tokena pomijają rozwiązywanie tokena z konfiguracji.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, `install` sprawdza, czy SecretRef można rozwiązać, ale nie zapisuje rozwiązanego tokena w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie może zostać rozwiązany, instalacja kończy się bezpieczną odmową.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan i obszary robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

## Preferowane

Używaj [`openclaw gateway`](/pl/cli/gateway), aby korzystać z aktualnej dokumentacji i przykładów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
