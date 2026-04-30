---
read_when:
    - Nadal używasz `openclaw daemon ...` w skryptach
    - Potrzebujesz poleceń cyklu życia usługi (install/start/stop/restart/status)
summary: Dokumentacja referencyjna CLI dla `openclaw daemon` (starszy alias do zarządzania usługą Gateway)
title: Demon
x-i18n:
    generated_at: "2026-04-30T09:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Starszy alias poleceń zarządzania usługą Gateway.

`openclaw daemon ...` mapuje na ten sam interfejs sterowania usługą co polecenia usługi `openclaw gateway ...`.

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
- `restart`: zrestartuj usługę

## Typowe opcje

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- cykl życia (`uninstall|start|stop|restart`): `--json`

Uwagi:

- `status` rozwiązuje skonfigurowane SecretRefs uwierzytelniania na potrzeby uwierzytelniania sondy, gdy to możliwe.
- Jeśli wymagane SecretRef uwierzytelniania pozostaje nierozwiązane w tej ścieżce polecenia, `daemon status --json` zgłasza `rpc.authWarning`, gdy łączność/uwierzytelnianie sondy nie powiedzie się; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda zakończy się powodzeniem, ostrzeżenia o nierozwiązanych odwołaniach uwierzytelniania są tłumione, aby uniknąć wyników fałszywie dodatnich.
- `status --deep` dodaje najlepsze możliwe skanowanie usługi na poziomie systemu. Gdy znajdzie inne usługi podobne do gateway, wyjście czytelne dla człowieka wypisuje wskazówki dotyczące porządkowania i ostrzega, że jeden gateway na maszynę nadal jest normalną rekomendacją.
- W instalacjach systemd na Linuksie kontrole rozbieżności tokenu w `status` obejmują zarówno źródła jednostek `Environment=`, jak i `EnvironmentFile=`.
- Kontrole rozbieżności rozwiązują SecretRefs `gateway.auth.token` przy użyciu scalonego środowiska uruchomieniowego (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawny `gateway.auth.mode` ustawiony na `password`/`none`/`trusted-proxy` albo tryb nieustawiony, gdy hasło może wygrać i żaden kandydat na token nie może wygrać), kontrole rozbieżności tokenu pomijają rozwiązywanie tokenu konfiguracji.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, `install` sprawdza, czy SecretRef da się rozwiązać, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowane SecretRef tokenu jest nierozwiązane, instalacja kończy się bezpieczną odmową.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Na macOS `install` utrzymuje pliki plist LaunchAgent wyłącznie dla właściciela i ładuje zarządzane wartości środowiska usługi przez plik oraz wrapper dostępne wyłącznie dla właściciela, zamiast serializować klucze API lub odwołania env profilu uwierzytelniania do `EnvironmentVariables`.
- Jeśli celowo uruchamiasz wiele gateway na jednym hoście, odizoluj porty, konfigurację/stan i obszary robocze; zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

## Zalecane

Użyj [`openclaw gateway`](/pl/cli/gateway), aby zobaczyć aktualną dokumentację i przykłady.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Runbook Gateway](/pl/gateway)
