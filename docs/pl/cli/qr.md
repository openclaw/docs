---
read_when:
    - Chcesz szybko sparować aplikację węzła mobilnego z Gatewayem
    - Potrzebujesz danych wyjściowych kodu konfiguracji do zdalnego/ręcznego udostępniania
summary: Dokumentacja CLI dla `openclaw qr` (generowanie kodu QR do parowania urządzenia mobilnego i kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-07-12T14:55:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Wygeneruj kod QR do parowania urządzenia mobilnego oraz kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Oficjalne aplikacje OpenClaw na iOS i Androida łączą się automatycznie, gdy ich metadane kodu konfiguracji są zgodne. Jeśli żądanie nadal oczekuje (na przykład w przypadku nieoficjalnego klienta lub niezgodnych metadanych), sprawdź je i zatwierdź:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opcje

- `--remote`: preferuje `gateway.remote.url`; jeśli ten adres URL nie jest ustawiony, używa `gateway.tailscale.mode=serve|funnel`. Ignoruje `publicUrl` Pluginu `device-pair`.
- `--url <url>`: zastępuje adres URL Gateway używany w ładunku
- `--public-url <url>`: zastępuje publiczny adres URL używany w ładunku
- `--token <token>`: zastępuje token Gateway, względem którego uwierzytelnia się przepływ inicjalizacji
- `--password <password>`: zastępuje hasło Gateway, względem którego uwierzytelnia się przepływ inicjalizacji
- `--setup-code-only`: wyświetla tylko kod konfiguracji
- `--no-ascii`: pomija renderowanie kodu QR w ASCII
- `--json`: zwraca dane JSON (`setupCode`, `gatewayUrl`, opcjonalne `gatewayUrls`, `auth`, `urlSource`)

Opcje `--token` i `--password` wzajemnie się wykluczają.

## Zawartość kodu konfiguracji

Kod konfiguracji zawiera nieprzejrzysty, krótkotrwały `bootstrapToken`, a nie współdzielony token ani hasło Gateway. Wbudowany przepływ inicjalizacji wystawia:

- podstawowy token `node` z `scopes: []`
- ograniczony token przekazania `operator`, zawężony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`

Zakresy modyfikacji parowania oraz `operator.admin` nadal wymagają osobno zatwierdzonego parowania operatora lub przepływu tokenu.

## Ustalanie adresu URL Gateway

Parowanie urządzeń mobilnych jest bezpiecznie odrzucane w przypadku publicznych lub obsługiwanych przez Tailscale adresów URL Gateway korzystających z `ws://`: w takich przypadkach użyj Tailscale Serve/Funnel albo adresu URL Gateway z `wss://`. Prywatne adresy LAN i hosty Bonjour z domeną `.local` nadal są obsługiwane przez zwykłe `ws://`.

Gdy wybrany adres URL Gateway pochodzi z `gateway.bind=lan`, OpenClaw sprawdza również trwałe trasy zwracane przez `tailscale serve status --json`. Każdy główny adres HTTPS usługi Serve, który przekazuje ruch do portu local loopback aktywnego Gateway, jest uwzględniany jako trasa zapasowa. Polecenie QR dodaje tę trasę zapasową tylko dla `lan`; ustawienia `custom` i `tailnet` zachowują jawnie anonsowane trasy. Obecne klienty iOS sprawdzają anonsowane trasy w podanej kolejności i zapisują pierwszą osiągalną; starsze pole `url` pozostaje bez zmian dla starszych klientów.

W przypadku użycia `--remote` wymagane jest ustawienie `gateway.remote.url` lub `gateway.tailscale.mode=serve|funnel`.

## Ustalanie uwierzytelniania (bez `--remote`)

Jeśli nie przekazano w CLI wartości zastępującej dane uwierzytelniające, odwołania SecretRef lokalnego uwierzytelniania Gateway są rozwiązywane następująco:

| Warunek                                                                                                                           | Rozwiązywana wartość                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"` lub tryb wywnioskowany bez nadrzędnego źródła hasła                                                   | `gateway.auth.token`                       |
| `gateway.auth.mode="password"` lub tryb wywnioskowany bez nadrzędnego tokenu z konfiguracji uwierzytelniania lub środowiska        | `gateway.auth.password`                    |
| Skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie ustawiono | operacja kończy się niepowodzeniem; ustaw jawnie `gateway.auth.mode` |

## Ustalanie uwierzytelniania (`--remote`)

Jeśli faktycznie aktywne zdalne dane uwierzytelniające są skonfigurowane jako SecretRefs i nie przekazano ani `--token`, ani `--password`, polecenie rozwiązuje je na podstawie aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie natychmiast kończy się niepowodzeniem.

<Note>
Ta ścieżka polecenia wymaga Gateway obsługującego metodę RPC `secrets.resolve`. Starsze wersje Gateway zwracają błąd nieznanej metody.
</Note>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Urządzenia](/pl/cli/devices)
- [Parowanie](/pl/cli/pairing)
