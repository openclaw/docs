---
read_when:
    - Przed wdrożeniem musisz zweryfikować routing proxy zarządzany przez operatora
    - Musisz lokalnie przechwycić ruch transportowy OpenClaw w celu debugowania
    - Chcesz przejrzeć sesje proxy debugowania, obiekty blob lub wbudowane presety zapytań
summary: Dokumentacja referencyjna CLI dla `openclaw proxy`, obejmująca walidację proxy zarządzanego przez operatora oraz inspektor przechwytywania lokalnego proxy debugowania
title: Serwer proxy
x-i18n:
    generated_at: "2026-05-04T07:02:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Zweryfikuj routing proxy zarządzany przez operatora albo uruchom lokalny jawny proxy debugowania i sprawdź przechwycony ruch.

Użyj `validate`, aby sprawdzić zarządzany przez operatora forward proxy przed włączeniem routingu proxy OpenClaw. Pozostałe polecenia są narzędziami debugowania do badania na poziomie transportu: mogą uruchomić lokalny proxy, uruchomić polecenie podrzędne z włączonym przechwytywaniem, wyświetlić sesje przechwytywania, wyszukać typowe wzorce ruchu, odczytać przechwycone bloby i usunąć lokalne dane przechwytywania.

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

`openclaw proxy validate` sprawdza efektywny adres URL proxy zarządzanego przez operatora z `--proxy-url`, konfiguracji albo `OPENCLAW_PROXY_URL`. Zgłasza problem z konfiguracją, gdy żaden proxy nie jest włączony ani skonfigurowany; użyj `--proxy-url` do jednorazowego sprawdzenia przed zmianą konfiguracji. Domyślnie weryfikuje, że publiczny cel jest osiągalny przez proxy oraz że proxy nie może połączyć się z tymczasowym celem kontrolnym loopback. Niestandardowe blokowane cele działają w trybie fail-closed: odpowiedzi HTTP i niejednoznaczne błędy transportu powodują niepowodzenie, chyba że możesz osobno zweryfikować specyficzny dla wdrożenia sygnał odmowy.

Opcje:

- `--json`: wypisz JSON czytelny maszynowo.
- `--proxy-url <url>`: zweryfikuj ten adres URL proxy zamiast konfiguracji lub env.
- `--allowed-url <url>`: dodaj cel, który powinien działać przez proxy. Powtórz, aby sprawdzić wiele celów.
- `--denied-url <url>`: dodaj cel, który powinien być blokowany przez proxy. Powtórz, aby sprawdzić wiele celów.
- `--timeout-ms <ms>`: limit czasu dla pojedynczego żądania w milisekundach.

Zobacz [Network Proxy](/pl/security/network-proxy), aby uzyskać wskazówki dotyczące wdrożenia i semantykę odmowy.

## Presety zapytań

`openclaw proxy query --preset <name>` przyjmuje:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Uwagi

- `start` domyślnie używa `127.0.0.1`, chyba że ustawiono `--host`.
- `run` uruchamia lokalny proxy debugowania, a następnie uruchamia polecenie po `--`.
- Bezpośrednie przekazywanie debug proxy do upstreamu otwiera gniazda upstream na potrzeby diagnostyki. Gdy aktywny jest tryb zarządzanego proxy OpenClaw, bezpośrednie przekazywanie żądań proxy i tuneli CONNECT jest domyślnie wyłączone; ustaw `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` tylko dla zatwierdzonej lokalnej diagnostyki.
- `validate` kończy działanie z kodem 1, gdy konfiguracja proxy lub sprawdzanie celów zakończą się niepowodzeniem.
- Przechwycone dane są lokalnymi danymi debugowania; po zakończeniu użyj `openclaw proxy purge`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Network Proxy](/pl/security/network-proxy)
- [Zaufane uwierzytelnianie proxy](/pl/gateway/trusted-proxy-auth)
