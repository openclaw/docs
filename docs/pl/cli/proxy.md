---
read_when:
    - Należy zweryfikować routing proxy zarządzany przez operatora przed wdrożeniem
    - Musisz lokalnie przechwycić ruch transportowy OpenClaw na potrzeby debugowania
    - Chcesz przejrzeć sesje proxy debugowania, obiekty blob lub wbudowane ustawienia wstępne zapytań
summary: Dokumentacja referencyjna CLI dla `openclaw proxy`, obejmująca walidację proxy zarządzanego przez operatora oraz lokalny inspektor przechwytywania proxy debugowania
title: Serwer proxy
x-i18n:
    generated_at: "2026-05-04T18:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Sprawdź routing proxy zarządzany przez operatora albo uruchom lokalny jawny proxy debugowania
i sprawdź przechwycony ruch.

Użyj `validate`, aby wstępnie sprawdzić zarządzany przez operatora proxy przekazujący przed włączeniem
routingu proxy OpenClaw. Pozostałe polecenia są narzędziami debugowania do
badania na poziomie transportu: mogą uruchomić lokalny proxy, uruchomić polecenie potomne
z włączonym przechwytywaniem, wyświetlić sesje przechwytywania, odpytywać typowe wzorce ruchu, odczytywać
przechwycone bloby oraz usuwać lokalne dane przechwytywania.

## Polecenia

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Walidacja

`openclaw proxy validate` sprawdza efektywny adres URL proxy zarządzanego przez operatora z
`--proxy-url`, konfiguracji albo `OPENCLAW_PROXY_URL`. Zgłasza problem z konfiguracją, gdy
żaden proxy nie jest włączony ani skonfigurowany; użyj `--proxy-url` do jednorazowego wstępnego sprawdzenia
przed zmianą konfiguracji. Domyślnie weryfikuje, że publiczne miejsce docelowe działa
przez proxy oraz że proxy nie może połączyć się z tymczasowym kanarkiem loopback.
Niestandardowe blokowane miejsca docelowe są fail-closed: odpowiedzi HTTP i niejednoznaczne
błędy transportu powodują niepowodzenie, chyba że możesz osobno zweryfikować specyficzny dla wdrożenia
sygnał odmowy. Dodaj `--apns-reachable`, aby również otworzyć tunel APNs HTTP/2 CONNECT
przez proxy i potwierdzić, że sandbox APNs odpowiada; sonda używa
celowo nieprawidłowego tokenu dostawcy, więc odpowiedź APNs `403 InvalidProviderToken`
jest poprawnym sygnałem osiągalności.

Opcje:

- `--json`: wypisz JSON czytelny maszynowo.
- `--proxy-url <url>`: zweryfikuj ten adres URL proxy zamiast konfiguracji lub zmiennej środowiskowej.
- `--allowed-url <url>`: dodaj miejsce docelowe, które powinno działać przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--denied-url <url>`: dodaj miejsce docelowe, które powinno być blokowane przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--apns-reachable`: dodatkowo zweryfikuj, że sandbox APNs HTTP/2 jest osiągalny przez proxy.
- `--apns-authority <url>`: authority APNs do sprawdzenia z `--apns-reachable` (domyślnie `https://api.sandbox.push.apple.com`; środowisko produkcyjne to `https://api.push.apple.com`).
- `--timeout-ms <ms>`: limit czasu na żądanie w milisekundach.

Zobacz [Proxy sieciowy](/pl/security/network-proxy), aby uzyskać wskazówki dotyczące wdrożenia i semantyki
odmowy.

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
- Bezpośrednie przekazywanie upstream w proxy debugowania otwiera gniazda upstream do diagnostyki. Gdy aktywny jest zarządzany tryb proxy OpenClaw, bezpośrednie przekazywanie żądań proxy i tuneli CONNECT jest domyślnie wyłączone; ustaw `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` tylko do zatwierdzonej diagnostyki lokalnej.
- `validate` kończy działanie z kodem 1, gdy konfiguracja proxy lub sprawdzenia miejsc docelowych zakończą się niepowodzeniem.
- Przechwycone dane są lokalnymi danymi debugowania; po zakończeniu użyj `openclaw proxy purge`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Proxy sieciowy](/pl/security/network-proxy)
- [Zaufane uwierzytelnianie proxy](/pl/gateway/trusted-proxy-auth)
