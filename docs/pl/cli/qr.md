---
read_when:
    - Chcesz szybko sparować mobilną aplikację Node z Gatewayem
    - Potrzebne jest wyświetlenie kodu konfiguracji do zdalnego/ręcznego udostępnienia
summary: Dokumentacja CLI dla `openclaw qr` (generowanie kodu QR do parowania urządzenia mobilnego i kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-07-16T18:29:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Wygeneruj kod QR parowania urządzenia mobilnego i kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Oficjalne aplikacje OpenClaw na iOS i Androida łączą się automatycznie, gdy metadane ich
kodu konfiguracji są zgodne. Jeśli żądanie nadal oczekuje (na przykład w przypadku
nieoficjalnego klienta lub niezgodnych metadanych), sprawdź je i zatwierdź:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opcje

- `--remote`: preferuje `gateway.remote.url`; jeśli ten adres URL nie jest ustawiony, używa zastępczo `gateway.tailscale.mode=serve|funnel`. Ignoruje `device-pair` Plugin `publicUrl`.
- `--url <url>`: zastępuje adres URL Gateway używany w ładunku
- `--public-url <url>`: zastępuje publiczny adres URL używany w ładunku
- `--token <token>`: zastępuje token Gateway, względem którego uwierzytelnia się przepływ inicjalizacji
- `--password <password>`: zastępuje hasło Gateway, względem którego uwierzytelnia się przepływ inicjalizacji
- `--limited`: pomija administracyjny dostęp do Gateway w przekazywanym tokenie operatora
- `--setup-code-only`: wyświetla tylko kod konfiguracji
- `--no-ascii`: pomija renderowanie kodu QR w ASCII
- `--json`: generuje JSON (`setupCode`, `gatewayUrl`, opcjonalnie `gatewayUrls`, `auth`, `access`, opcjonalnie `accessDowngraded`, `urlSource`)

`--token` i `--password` wzajemnie się wykluczają.

## Zawartość kodu konfiguracji

Kod konfiguracji zawiera nieprzezroczysty, krótkotrwały `bootstrapToken`, a nie współdzielony token ani hasło Gateway. W przypadku punktu końcowego `wss://` (lub pętli zwrotnej na tym samym hoście) domyślny przepływ inicjalizacji wydaje:

- podstawowy token `node` z `scopes: []`
- pełny token przekazania `operator` dla natywnej aplikacji mobilnej z `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`

Użyj `--limited`, aby zachować ten sam token węzła, jednocześnie pomijając `operator.admin` w przekazaniu operatora. Zakres modyfikacji parowania nigdy nie jest przekazywany przez kod konfiguracji.

Konfiguracja `ws://` w postaci zwykłego tekstu w sieci LAN pozostaje dostępna, ale OpenClaw automatycznie używa
profilu ograniczonego, ponieważ obserwator sieci mógłby przechwycić token okaziciela
inicjalizacji i wykorzystać go wcześniej. Skonfiguruj `wss://` lub Tailscale Serve, a następnie wygeneruj nowy kod,
aby uzyskać pełny dostęp.

## Rozpoznawanie adresu URL Gateway

Parowanie urządzeń mobilnych bezpiecznie odrzuca adresy URL Gateway Tailscale/publiczne `ws://`: w ich przypadku użyj Tailscale Serve/Funnel lub adresu URL Gateway `wss://`. Prywatne adresy LAN i hosty Bonjour `.local` są nadal obsługiwane przez zwykły `ws://`, z ograniczonym dostępem operatora opisanym powyżej.

Gdy wybrany adres URL Gateway pochodzi z `gateway.bind=lan`, OpenClaw sprawdza również trwałe trasy `tailscale serve status --json`. Każdy główny adres HTTPS Serve, który pośredniczy w dostępie do portu pętli zwrotnej aktywnego Gateway, jest uwzględniany jako trasa zapasowa. Polecenie QR dodaje tę trasę zapasową tylko dla `lan`; `custom` i `tailnet` zachowują jawnie rozgłaszane trasy. Bieżące klienty iOS sprawdzają rozgłaszane trasy w podanej kolejności i zapisują pierwszą osiągalną; starsze pole `url` pozostaje bez zmian dla starszych klientów.

W przypadku `--remote` wymagane jest jedno z `gateway.remote.url` lub `gateway.tailscale.mode=serve|funnel`.

## Rozpoznawanie uwierzytelniania (bez `--remote`)

Jeśli nie podano zastąpienia uwierzytelniania w CLI, lokalne odwołania SecretRef uwierzytelniania Gateway są rozpoznawane w następujący sposób:

| Warunek                                                                                                                      | Rozpoznawana wartość                       |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"` lub tryb wywnioskowany bez nadrzędnego źródła hasła                                                       | `gateway.auth.token`                         |
| `gateway.auth.mode="password"` lub tryb wywnioskowany bez nadrzędnego tokenu z uwierzytelniania/środowiska                               | `gateway.auth.password`                         |
| Skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione | występuje błąd; ustaw jawnie `gateway.auth.mode` |

## Rozpoznawanie uwierzytelniania (`--remote`)

Jeśli faktycznie aktywne zdalne dane uwierzytelniające są skonfigurowane jako SecretRefs i nie przekazano ani `--token`, ani `--password`, polecenie rozpoznaje je z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie natychmiast kończy się błędem.

<Note>
Ta ścieżka polecenia wymaga Gateway obsługującego metodę RPC `secrets.resolve`. Starsze Gateway zwracają błąd nieznanej metody.
</Note>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Urządzenia](/pl/cli/devices)
- [Parowanie](/pl/cli/pairing)
