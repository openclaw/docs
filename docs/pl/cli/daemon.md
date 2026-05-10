---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja referencyjna CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-05-10T19:28:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias poleceń zarządzania usługą Gateway.

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

## Typowe opcje

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- cykl życia (`uninstall|start|stop`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania próby, gdy jest to możliwe.
- Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy połączenie/uwierzytelnianie próby się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli próba się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są wyciszane, aby uniknąć fałszywych alarmów.
- `status --deep` dodaje najlepsze możliwe skanowanie usługi na poziomie systemu. Gdy znajdzie inne usługi podobne do Gateway, czytelny dla człowieka wynik wypisuje wskazówki czyszczenia i ostrzega, że jeden Gateway na maszynę nadal jest zwykłą rekomendacją.
- W instalacjach Linux systemd kontrole rozbieżności tokenu `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole rozbieżności rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` jako `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdy hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole rozbieżności tokenu pomijają rozwiązywanie tokenu konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` weryfikuje, że SecretRef da się rozwiązać, ale nie zapisuje rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się niepowodzeniem w trybie bezpiecznym.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- W systemie macOS `install` utrzymuje pliki plist LaunchAgent dostępne tylko dla właściciela i ładuje zarządzane wartości środowiska usługi przez plik i wrapper dostępne tylko dla właściciela, zamiast serializować klucze API lub odwołania środowiskowe profilu uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan i obszary robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
- `restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy i zaplanowanie jednego scalonego ponownego uruchomienia po opróżnieniu aktywnej pracy. Zwykły `restart` zachowuje dotychczasowe działanie menedżera usług; `--force` pozostaje ścieżką natychmiastowego wymuszenia.
- `restart --safe --skip-deferral` uruchamia bezpieczne ponowne uruchomienie świadome OpenClaw, ale omija bramkę odroczenia aktywnej pracy, dzięki czemu Gateway natychmiast emituje ponowne uruchomienie nawet wtedy, gdy zgłoszono blokady. Awaryjna ścieżka operatora, gdy zablokowane uruchomienie zadania przypina bezpieczne ponowne uruchomienie; wymaga `--safe`.

## Preferowane

Używaj [`openclaw gateway`](/pl/cli/gateway), aby uzyskać aktualną dokumentację i przykłady.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
