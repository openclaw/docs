---
read_when:
    - Przed wdrożeniem musisz zweryfikować routing proxy zarządzany przez operatora
    - Musisz przechwycić lokalnie ruch transportowy OpenClaw na potrzeby debugowania
    - Chcesz sprawdzać sesje debug proxy, bloby lub wbudowane presety zapytań
summary: Dokumentacja CLI dla `openclaw proxy`, obejmująca walidację proxy zarządzanego przez operatora oraz lokalny inspektor przechwytywania proxy debugowania
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:22:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Weryfikuj routing proxy zarządzany przez operatora albo uruchom lokalne jawne debugujące proxy
i sprawdź przechwycony ruch.

Użyj `validate`, aby wykonać preflight proxy przekazującego zarządzanego przez operatora przed włączeniem
routingu proxy OpenClaw. Pozostałe polecenia to narzędzia debugowania do
badania na poziomie transportu: mogą uruchomić lokalne proxy, uruchomić polecenie podrzędne
z włączonym przechwytywaniem, wyświetlić sesje przechwytywania, zapytać o typowe wzorce ruchu, odczytać
przechwycone bloby oraz wyczyścić lokalne dane przechwytywania.

## Polecenia

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Weryfikacja

`openclaw proxy validate` sprawdza efektywny adres URL proxy zarządzanego przez operatora z
`--proxy-url`, konfiguracji albo `OPENCLAW_PROXY_URL`. Adresy URL zarządzanych proxy mogą używać
`http://` dla zwykłego listenera forward proxy albo `https://`, gdy OpenClaw musi
otworzyć TLS do punktu końcowego proxy przed wysłaniem żądań proxy. Zgłasza
problem z konfiguracją, gdy żadne proxy nie jest włączone i skonfigurowane; użyj `--proxy-url` do
jednorazowego preflightu przed zmianą konfiguracji. Dodaj `--proxy-ca-file`, aby zaufać
prywatnemu CA dla połączenia TLS z punktem końcowym proxy HTTPS. Domyślnie
weryfikuje, że publiczne miejsce docelowe działa przez proxy oraz że proxy
nie może dotrzeć do tymczasowego kanarka loopback. Niestandardowe zablokowane miejsca docelowe są
fail-closed: odpowiedzi HTTP i niejednoznaczne błędy transportu powodują niepowodzenie, chyba że
możesz osobno zweryfikować sygnał odmowy specyficzny dla wdrożenia. Dodaj
`--apns-reachable`, aby także otworzyć tunel APNs HTTP/2 CONNECT przez proxy
i potwierdzić, że sandbox APNs odpowiada; sonda używa celowo nieprawidłowego
tokenu dostawcy, więc odpowiedź APNs `403 InvalidProviderToken` jest pomyślnym
sygnałem osiągalności.

Opcje:

- `--json`: wypisz JSON czytelny maszynowo.
- `--proxy-url <url>`: zweryfikuj ten adres URL proxy `http://` lub `https://` zamiast konfiguracji albo env.
- `--proxy-ca-file <path>`: zaufaj temu plikowi CA PEM na potrzeby weryfikacji TLS punktu końcowego proxy HTTPS.
- `--allowed-url <url>`: dodaj miejsce docelowe, które ma działać przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--denied-url <url>`: dodaj miejsce docelowe, które ma być blokowane przez proxy. Powtórz, aby sprawdzić wiele miejsc docelowych.
- `--apns-reachable`: zweryfikuj także, że sandbox APNs HTTP/2 jest osiągalny przez proxy.
- `--apns-authority <url>`: authority APNs do sondowania z `--apns-reachable` (domyślnie `https://api.sandbox.push.apple.com`; produkcja to `https://api.push.apple.com`).
- `--timeout-ms <ms>`: limit czasu dla każdego żądania w milisekundach.

Zobacz [Proxy sieciowe](/pl/security/network-proxy), aby uzyskać wskazówki dotyczące wdrożenia i semantyki odmowy.

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
- `run` uruchamia lokalne debugujące proxy, a następnie uruchamia polecenie po `--`.
- Bezpośrednie przekazywanie upstream przez debugujące proxy otwiera gniazda upstream do diagnostyki. Gdy aktywny jest tryb zarządzanego proxy OpenClaw, bezpośrednie przekazywanie żądań proxy i tuneli CONNECT jest domyślnie wyłączone; ustaw `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` tylko dla zatwierdzonej lokalnej diagnostyki.
- `validate` kończy działanie z kodem 1, gdy konfiguracja proxy lub sprawdzenia miejsc docelowych się nie powiodą.
- Przechwycenia są lokalnymi danymi debugowania; użyj `openclaw proxy purge` po zakończeniu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Proxy sieciowe](/pl/security/network-proxy)
- [Zaufane uwierzytelnianie proxy](/pl/gateway/trusted-proxy-auth)
