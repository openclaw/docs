---
read_when:
    - Musisz zweryfikować routing przez proxy zarządzane przez operatora przed wdrożeniem
    - Musisz lokalnie przechwycić ruch transportowy OpenClaw w celu debugowania.
    - Chcesz sprawdzić sesje proxy debugowania, obiekty blob lub wbudowane ustawienia wstępne zapytań
summary: Dokumentacja referencyjna CLI dla `openclaw proxy`, obejmująca walidację proxy zarządzanego przez operatora i inspektor przechwytywania lokalnego proxy debugowania
title: Serwer proxy
x-i18n:
    generated_at: "2026-05-01T09:57:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Sprawdź routing proxy zarządzany przez operatora albo uruchom lokalny jawny proxy debugowania
i przeanalizuj przechwycony ruch.

Użyj `validate`, aby wstępnie sprawdzić forward proxy zarządzany przez operatora przed włączeniem
routingu proxy OpenClaw. Pozostałe polecenia to narzędzia debugowania do
diagnostyki na poziomie transportu: mogą uruchomić lokalny proxy, uruchomić polecenie podrzędne
z włączonym przechwytywaniem, wyświetlić sesje przechwytywania, wyszukiwać typowe wzorce ruchu, odczytywać
przechwycone bloby oraz usuwać lokalne dane przechwytywania.

## Polecenia

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Walidacja

`openclaw proxy validate` sprawdza efektywny adres URL proxy zarządzanego przez operatora z
`--proxy-url`, konfiguracji albo `OPENCLAW_PROXY_URL`. Zgłasza problem z konfiguracją, gdy
żaden proxy nie jest włączony i skonfigurowany; użyj `--proxy-url` do jednorazowego wstępnego sprawdzenia
przed zmianą konfiguracji. Domyślnie weryfikuje, czy publiczne miejsce docelowe działa
przez proxy oraz czy proxy nie może dotrzeć do tymczasowego kanarka loopback.
Niestandardowe odrzucane miejsca docelowe działają w trybie fail-closed: odpowiedzi HTTP i niejednoznaczne
awarie transportowe kończą się niepowodzeniem, chyba że możesz osobno zweryfikować specyficzny dla wdrożenia
sygnał odmowy.

Opcje:

- `--json`: wypisz JSON czytelny maszynowo.
- `--proxy-url <url>`: zweryfikuj ten adres URL proxy zamiast konfiguracji lub zmiennej środowiskowej.
- `--allowed-url <url>`: dodaj miejsce docelowe, które powinno działać przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--denied-url <url>`: dodaj miejsce docelowe, które powinno być blokowane przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--timeout-ms <ms>`: limit czasu na żądanie w milisekundach.

Zobacz [Proxy sieciowy](/pl/security/network-proxy), aby uzyskać wskazówki dotyczące wdrożenia i semantyki odmowy.

## Presety zapytań

`openclaw proxy query --preset <name>` akceptuje:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Uwagi

- `start` domyślnie używa `127.0.0.1`, chyba że ustawiono `--host`.
- `run` uruchamia lokalny proxy debugowania, a następnie uruchamia polecenie po `--`.
- `validate` kończy działanie z kodem 1, gdy konfiguracja proxy lub sprawdzenia miejsc docelowych nie powiodą się.
- Przechwycone dane są lokalnymi danymi debugowania; użyj `openclaw proxy purge` po zakończeniu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Proxy sieciowy](/pl/security/network-proxy)
- [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)
