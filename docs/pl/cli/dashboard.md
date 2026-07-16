---
read_when:
    - Chcesz otworzyć interfejs sterowania przy użyciu bieżącego tokenu
    - Chcesz wyświetlić adres URL bez uruchamiania przeglądarki
summary: Dokumentacja CLI dla `openclaw dashboard` (otwieranie interfejsu Control UI)
title: Panel sterowania
x-i18n:
    generated_at: "2026-07-16T18:08:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Otwórz interfejs Control UI przy użyciu bieżącego uwierzytelnienia.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: wyświetl adres URL, ale nie uruchamiaj przeglądarki.
- `--json`: wyświetl jeden obiekt połączenia w formacie przeznaczonym do odczytu maszynowego bez otwierania przeglądarki, używania schowka, wyświetlania monitów ani uruchamiania Gateway.
- `--yes`: w razie potrzeby uruchom/zainstaluj Gateway bez wyświetlania monitów.

## Dane wyjściowe do odczytu maszynowego

Użyj `--json` w integracjach pulpitu i skryptach, które wymagają ustalonego adresu URL interfejsu Control UI:

```bash
openclaw dashboard --json
```

Odpowiedź zawiera `url`, `httpUrl`, `wsUrl`, `port` oraz `tokenIncluded`. Jeśli Gateway nie jest gotowy, polecenie zwraca `{"ok":false,"reason":"..."}` i kończy działanie z niezerowym kodem wyjścia. Tokeny zarządzane przez SecretRef nigdy nie są uwzględniane w `url`.

Uwagi:

- W miarę możliwości rozwiązuje skonfigurowane odwołania SecretRef dla `gateway.auth.token`.
- Stosuje się do `gateway.tls.enabled`: bramy z włączonym TLS wyświetlają/otwierają adresy URL interfejsu Control UI używające `https://` i łączą się za pośrednictwem `wss://`.
- W przypadku powiązania `lan` lub powiązania `custom` z symbolem wieloznacznym uruchomienia na tym samym hoście zawsze używają interfejsu pętli zwrotnej, ponieważ symbol wieloznaczny nie jest miejscem docelowym przeglądarki. Powiązania `tailnet` i `custom` bez szyfrowania również używają `127.0.0.1`, aby przeglądarka miała bezpieczny kontekst; konkretne hosty z włączonym TLS zachowują skonfigurowany adres, aby nazwy certyfikatów były zgodne.
- Przed przekazaniem uwierzytelnionego adresu URL interfejsu pętli zwrotnej dla powiązania z określonym interfejsem polecenie sonduje skonfigurowany interfejs i sprawdza, czy on oraz `127.0.0.1` należą do tego samego procesu Gateway. Niejednoznaczna własność procesu nasłuchującego powoduje bezpieczne przerwanie działania z instrukcjami dotyczącymi stanu.
- W przypadku tokenów zarządzanych przez SecretRef (rozwiązanych lub nierozwiązanych) wyświetlany, kopiowany lub otwierany adres URL nigdy nie zawiera tokenu, dzięki czemu zewnętrzne sekrety nie wyciekają do danych wyjściowych terminala, historii schowka ani argumentów uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale nierozwiązany, polecenie zamiast nieprawidłowego symbolu zastępczego tokenu wyświetla adres URL bez tokenu oraz instrukcje naprawcze.
- Jeśli przekazanie do schowka/przeglądarki nie powiedzie się dla adresu URL uwierzytelnianego tokenem, polecenie rejestruje bezpieczną wskazówkę dotyczącą ręcznego uwierzytelnienia, wymieniającą `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` oraz klucz fragmentu adresu URL `token`, bez wyświetlania wartości tokenu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Panel sterowania](/pl/web/dashboard)
