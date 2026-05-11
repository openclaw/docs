---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Referencja CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-05-11T20:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias poleceń zarządzania usługą Gateway.

`openclaw daemon ...` mapuje na tę samą powierzchnię sterowania usługą co polecenia usługi `openclaw gateway ...`.

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

- `status` w miarę możliwości rozwiązuje skonfigurowane auth SecretRefs na potrzeby uwierzytelniania sondy.
- Jeśli wymagany auth SecretRef nie zostanie rozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych auth-ref są tłumione, aby uniknąć fałszywych alarmów.
- `status --deep` dodaje wykonywane w miarę możliwości skanowanie usługi na poziomie systemu. Gdy znajdzie inne usługi podobne do Gateway, dane wyjściowe dla człowieka drukują wskazówki porządkowe i ostrzegają, że jeden Gateway na maszynę pozostaje normalnym zaleceniem.
- `status --deep` uruchamia też walidację konfiguracji w trybie świadomym Pluginów i ujawnia ostrzeżenia skonfigurowanego manifestu Pluginu (na przykład brak metadanych konfiguracji kanału), aby wychwytywały je kontrole dymne instalacji i aktualizacji. Domyślne `status` zachowuje szybką ścieżkę tylko do odczytu, która pomija walidację Pluginu.
- W instalacjach systemd na Linuksie kontrole dryfu tokenu w `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska runtime (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawny `gateway.auth.mode` o wartości `password`/`none`/`trusted-proxy` albo nieustawiony tryb, w którym hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` sprawdza, czy SecretRef można rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się bezpieczną odmową.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- W systemie macOS `install` zachowuje pliki plist LaunchAgent jako dostępne tylko dla właściciela i ładuje wartości środowiska zarządzanej usługi przez plik i wrapper dostępne tylko dla właściciela, zamiast serializować klucze API lub odwołania środowiskowe profili uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan i obszary robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
- `restart --safe` prosi działający Gateway o wstępne sprawdzenie aktywnej pracy i zaplanowanie jednego skonsolidowanego restartu po opróżnieniu aktywnej pracy. Zwykłe `restart` zachowuje istniejące zachowanie menedżera usługi; `--force` pozostaje ścieżką natychmiastowego nadpisania.
- `restart --safe --skip-deferral` uruchamia bezpieczny restart świadomy OpenClaw, ale pomija bramkę odroczenia aktywnej pracy, dzięki czemu Gateway emituje restart natychmiast nawet wtedy, gdy zgłoszono blokady. Awaryjna ścieżka operatora, gdy zablokowane uruchomienie zadania przytrzymuje bezpieczny restart; wymaga `--safe`.

## Preferowane

Użyj [`openclaw gateway`](/pl/cli/gateway), aby uzyskać aktualną dokumentację i przykłady.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
