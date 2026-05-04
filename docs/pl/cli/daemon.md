---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja referencyjna CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-05-04T18:23:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias poleceń zarządzania usługą Gateway.

`openclaw daemon ...` odpowiada temu samemu interfejsowi sterowania usługą co polecenia usługi `openclaw gateway ...`.

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
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- cykl życia (`uninstall|start|stop`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania sondy, gdy to możliwe.
- Jeśli wymagany SecretRef uwierzytelniania pozostaje nierozwiązany w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych odwołaniach do uwierzytelniania są wyciszane, aby uniknąć wyników fałszywie dodatnich.
- `status --deep` dodaje możliwie najlepsze skanowanie usługi na poziomie systemu. Gdy znajdzie inne usługi podobne do Gateway, dane wyjściowe dla użytkownika wypisują wskazówki dotyczące czyszczenia i ostrzegają, że jedno Gateway na maszynę pozostaje normalną rekomendacją.
- W instalacjach systemd na Linuksie kontrole dryfu tokenu w `status` obejmują zarówno źródła jednostki `Environment=`, jak i `EnvironmentFile=`.
- Kontrole dryfu rozwiązują SecretRefs `gateway.auth.token` za pomocą scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest faktycznie aktywne (jawny `gateway.auth.mode` równy `password`/`none`/`trusted-proxy` albo nieustawiony tryb, w którym hasło może wygrać i żaden kandydat tokenu nie może wygrać), kontrole dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` sprawdza, czy SecretRef da się rozwiązać, ale nie zapisuje rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja kończy się niepowodzeniem w trybie zamkniętym.
- Jeśli skonfigurowane są jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Na macOS `install` utrzymuje pliki plist LaunchAgent dostępne tylko dla właściciela i ładuje zarządzane wartości środowiska usługi przez plik dostępny tylko dla właściciela oraz wrapper, zamiast serializować klucze API lub odwołania env profilu uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele Gateway na jednym hoście, odizoluj porty, konfigurację/stan i przestrzenie robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).
- `restart --safe` prosi działające Gateway o wstępną kontrolę aktywnej pracy i zaplanowanie jednego scalonego ponownego uruchomienia po opróżnieniu aktywnej pracy. Zwykłe `restart` zachowuje istniejące zachowanie menedżera usługi; `--force` pozostaje ścieżką natychmiastowego wymuszenia.

## Zalecane

Użyj [`openclaw gateway`](/pl/cli/gateway), aby uzyskać aktualną dokumentację i przykłady.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
