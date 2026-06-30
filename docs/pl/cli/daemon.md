---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja referencyjna CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-06-30T14:30:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
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
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- cykl życia (`uninstall|start|stop`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania dla uwierzytelniania sondy, gdy jest to możliwe.
- Jeśli wymagany SecretRef uwierzytelniania nie zostanie rozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy łączność z sondą lub uwierzytelnianie nie powiedzie się; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są tłumione, aby uniknąć fałszywych alarmów.
- `status --deep` dodaje najlepszą możliwą kontrolę usługi na poziomie systemu. Gdy znajdzie inne usługi podobne do Gateway, wynik czytelny dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że jedna Gateway na maszynę nadal jest normalnym zaleceniem.
- `status --deep` uruchamia także walidację konfiguracji w trybie świadomym Plugin i pokazuje skonfigurowane ostrzeżenia manifestu Plugin (na przykład brak metadanych konfiguracji kanału), aby testy smoke instalacji i aktualizacji je wychwytywały. Domyślne `status` zachowuje szybką ścieżkę tylko do odczytu, która pomija walidację Plugin.
- W instalacjach Linux systemd kontrole dryfu tokenu `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska runtime (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` o wartości `password`/`none`/`trusted-proxy` albo nieustawiony tryb, w którym hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się błędem w trybie fail-closed.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- W systemie macOS `install` utrzymuje pliki plist LaunchAgent dostępne tylko dla właściciela i ładuje zarządzane wartości środowiska usługi przez plik oraz wrapper dostępne tylko dla właściciela, zamiast serializować klucze API lub odwołania środowiskowe profilu uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan i przestrzenie robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
- `restart --safe` prosi działającą Gateway o wstępne sprawdzenie aktywnej pracy i zaplanowanie jednego scalonego restartu po opróżnieniu aktywnej pracy. Domyślny bezpieczny restart czeka na aktywną pracę do skonfigurowanego `gateway.reload.deferralTimeoutMs` (domyślnie 5 minut); po wyczerpaniu tego budżetu restart jest wymuszany. Ustaw `gateway.reload.deferralTimeoutMs` na `0`, aby uzyskać bezterminowe bezpieczne oczekiwanie, które nigdy nie wymusza restartu. Zwykłe `restart` zachowuje dotychczasowe działanie menedżera usług; `--force` pozostaje ścieżką natychmiastowego nadpisania.
- `restart --safe --skip-deferral` uruchamia bezpieczny restart świadomy OpenClaw, ale pomija bramkę odroczenia aktywnej pracy, więc Gateway emituje restart natychmiast nawet wtedy, gdy zgłaszane są blokady. To awaryjna ścieżka operatora, gdy zablokowane uruchomienie zadania unieruchamia bezpieczny restart; wymaga `--safe`.

## Preferowane

Użyj [`openclaw gateway`](/pl/cli/gateway), aby zobaczyć aktualną dokumentację i przykłady.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
