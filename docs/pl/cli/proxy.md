---
read_when:
    - Przed wdrożeniem należy zweryfikować routing przez serwer proxy zarządzany przez operatora
    - Musisz lokalnie przechwycić ruch transportowy OpenClaw na potrzeby debugowania
    - Chcesz sprawdzić sesje debugowania proxy, obiekty blob lub wbudowane ustawienia wstępne zapytań
summary: Dokumentacja CLI dla `openclaw proxy`, obejmująca walidację serwera proxy zarządzanego przez operatora oraz lokalny inspektor przechwyconych danych serwera proxy do debugowania
title: Serwer proxy
x-i18n:
    generated_at: "2026-07-12T15:00:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Sprawdź routing przez serwer proxy zarządzany przez operatora albo uruchom lokalny, jawnie skonfigurowany serwer proxy do debugowania i przeanalizuj przechwycony ruch.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

Polecenie `validate` wykonuje wstępną kontrolę serwera proxy przekazującego zarządzanego przez operatora. Pozostałe polecenia to narzędzia do debugowania na poziomie transportu: uruchamiają lokalny serwer proxy przechwytujący ruch, wykonują polecenie podrzędne za jego pośrednictwem, wyświetlają listę sesji przechwytywania, analizują wzorce ruchu, odczytują przechwycone obiekty binarne i usuwają lokalne dane przechwytywania.

## Sprawdzanie poprawności

Sprawdza obowiązujący adres URL serwera proxy zarządzanego przez operatora, pobierany kolejno z `--proxy-url`, konfiguracji (`proxy.proxyUrl`) lub `OPENCLAW_PROXY_URL`, zgodnie z tą kolejnością pierwszeństwa. Zgłasza problem z konfiguracją, jeśli serwer proxy nie jest włączony i skonfigurowany. Przekaż `--proxy-url`, aby przeprowadzić jednorazową kontrolę wstępną bez modyfikowania konfiguracji.

Adresy URL zarządzanych serwerów proxy używają `http://` w przypadku zwykłego nasłuchiwania serwera proxy przekazującego lub `https://`, gdy OpenClaw musi najpierw nawiązać połączenie TLS z punktem końcowym serwera proxy, zanim wyśle żądania proxy. Użyj `--proxy-ca-file`, aby zaufać prywatnemu urzędowi certyfikacji dla tego połączenia TLS.

Domyślnie wykonywane są:

- jedna kontrola **dozwolonego** adresu `https://example.com/` (można ją zastąpić lub dodać kolejne za pomocą powtarzalnej opcji `--allowed-url`)
- jedna kontrola **zablokowanego** adresu tymczasowego wzorca kontrolnego local loopback (można ją zastąpić za pomocą powtarzalnej opcji `--denied-url`)

Niestandardowe cele `--denied-url` działają w trybie bezpiecznej odmowy: zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu są uznawane za niepowodzenie, chyba że można niezależnie zweryfikować sygnał odmowy właściwy dla danego wdrożenia. Wbudowany wzorzec kontrolny local loopback jest jedynym celem, dla którego błąd transportu jest uznawany za dowód zablokowania.

Dodaj `--apns-reachable`, aby również otworzyć przez serwer proxy tunel HTTP/2 CONNECT do APNs i potwierdzić odpowiedź środowiska testowego APNs. Test wysyła celowo nieprawidłowy token dostawcy, dlatego odpowiedź APNs `403 InvalidProviderToken` jest uznawana za pomyślny sygnał osiągalności, a nie za błąd.

### Opcje

| Flaga                    | Działanie                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | wyświetla kod JSON przeznaczony do odczytu maszynowego                                                                      |
| `--proxy-url <url>`      | sprawdza podany adres URL serwera proxy `http://`/`https://` zamiast wartości z konfiguracji lub zmiennej środowiskowej      |
| `--proxy-ca-file <path>` | ufa podanemu plikowi urzędu certyfikacji PEM podczas weryfikacji TLS punktu końcowego serwera proxy HTTPS                    |
| `--allowed-url <url>`    | miejsce docelowe, do którego połączenie przez serwer proxy powinno się powieść (opcja powtarzalna)                           |
| `--denied-url <url>`     | miejsce docelowe, które powinno zostać zablokowane przez serwer proxy (opcja powtarzalna)                                    |
| `--apns-reachable`       | dodatkowo sprawdza, czy środowisko testowe APNs HTTP/2 jest osiągalne przez serwer proxy                                     |
| `--apns-authority <url>` | punkt APNs do sprawdzenia (domyślnie `https://api.sandbox.push.apple.com`; środowisko produkcyjne: `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | limit czasu dla pojedynczego żądania                                                                                        |

Kończy działanie z kodem 1, gdy konfiguracja serwera proxy lub kontrole miejsc docelowych zakończą się niepowodzeniem.

Wskazówki dotyczące wdrażania i semantyki odmowy zawiera dokument [Serwer proxy sieci](/pl/security/network-proxy).

## Serwer proxy do debugowania

Polecenie `start` uruchamia lokalny serwer proxy przechwytujący ruch oraz wyświetla jego adres URL, ścieżkę certyfikatu urzędu certyfikacji i ścieżkę bazy danych przechwytywania. Zatrzymaj go za pomocą Ctrl+C. Domyślnie nasłuchuje pod adresem `127.0.0.1`, chyba że ustawiono `--host`.

Polecenie `run` uruchamia lokalny serwer proxy do debugowania, a następnie wykonuje `<cmd...>` (po `--`) z zastosowanymi zmiennymi środowiskowymi serwera proxy, we własnej sesji przechwytywania.

Bezpośrednie przekazywanie ruchu do serwerów nadrzędnych przez serwer proxy do debugowania otwiera gniazda nadrzędne do celów diagnostycznych. Gdy aktywny jest tryb zarządzanego serwera proxy OpenClaw, bezpośrednie przekazywanie żądań proxy i tuneli CONNECT jest domyślnie wyłączone. Ustaw `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` wyłącznie na potrzeby zatwierdzonej diagnostyki lokalnej.

Polecenie `coverage` wyświetla raport JSON (`summary` oraz `entries` dla poszczególnych transportów) wskazujący, które transporty są przechwytywane, obsługiwane wyłącznie przez serwer proxy lub nieobjęte przechwytywaniem.

Polecenie `sessions` wyświetla listę ostatnich sesji przechwytywania (`--limit`, domyślnie 20).

Polecenie `query --preset <name>` wykonuje wbudowane zapytanie dotyczące przechwyconego ruchu, opcjonalnie ograniczone do `--session <id>`. Dostępne ustawienia:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

Polecenie `blob --id <blobId>` wyświetla nieprzetworzoną zawartość przechwyconego obiektu binarnego ładunku.

Polecenie `purge` usuwa wszystkie metadane i obiekty binarne przechwyconego ruchu. Przechwycone dane służą do lokalnego debugowania; usuń je po zakończeniu pracy.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Serwer proxy sieci](/pl/security/network-proxy)
- [Uwierzytelnianie zaufanego serwera proxy](/pl/gateway/trusted-proxy-auth)
