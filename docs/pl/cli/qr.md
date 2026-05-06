---
read_when:
    - Chcesz szybko sparować aplikację węzła mobilnego z Gateway
    - Potrzebujesz wyniku setup-code do zdalnego/ręcznego udostępniania
summary: Dokumentacja referencyjna CLI dla `openclaw qr` (generowanie kodu QR do parowania z urządzeniem mobilnym + kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-05-06T09:05:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Wygeneruj mobilny kod QR do parowania oraz kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

## Użycie

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opcje

- `--remote`: preferuj `gateway.remote.url`; jeśli nie jest ustawione, `gateway.tailscale.mode=serve|funnel` nadal może dostarczyć zdalny publiczny URL
- `--url <url>`: zastąp URL bramy używany w ładunku
- `--public-url <url>`: zastąp publiczny URL używany w ładunku
- `--token <token>`: zastąp token Gateway, wobec którego uwierzytelnia się przepływ bootstrap
- `--password <password>`: zastąp hasło Gateway, wobec którego uwierzytelnia się przepływ bootstrap
- `--setup-code-only`: wypisz tylko kod konfiguracji
- `--no-ascii`: pomiń renderowanie kodu QR w ASCII
- `--json`: wyemituj JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Uwagi

- `--token` i `--password` wzajemnie się wykluczają.
- Sam kod konfiguracji przenosi teraz nieprzezroczysty, krótkotrwały `bootstrapToken`, a nie współdzielony token/hasło Gateway.
- We wbudowanym przepływie bootstrap węzła/operatora główny token węzła nadal trafia z `scopes: []`.
- Jeśli przekazanie bootstrap wystawia również token operatora, pozostaje on ograniczony do listy dozwolonej bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Kontrole zakresów bootstrap są prefiksowane rolą. Ta lista dozwolona operatora spełnia tylko żądania operatora; role niebędące operatorem nadal potrzebują zakresów z własnym prefiksem roli.
- Parowanie mobilne kończy się bezpieczną odmową dla adresów URL Gateway `ws://` przez Tailscale/public. Prywatne adresy LAN i hosty Bonjour `.local` nadal są obsługiwane przez `ws://`, ale mobilne trasy Tailscale/public powinny używać Tailscale Serve/Funnel albo adresu URL Gateway `wss://`.
- Z `--remote` OpenClaw wymaga `gateway.remote.url` albo
  `gateway.tailscale.mode=serve|funnel`.
- Z `--remote`, jeśli faktycznie aktywne zdalne dane uwierzytelniające są skonfigurowane jako SecretRefs i nie przekazujesz `--token` ani `--password`, polecenie rozwiązuje je z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się błędem.
- Bez `--remote` lokalne SecretRefs uwierzytelniania Gateway są rozwiązywane, gdy nie przekazano nadpisania uwierzytelniania przez CLI:
  - `gateway.auth.token` jest rozwiązywane, gdy uwierzytelnianie tokenem może wygrać (jawne `gateway.auth.mode="token"` albo tryb wywnioskowany, w którym nie wygrywa żadne źródło hasła).
  - `gateway.auth.password` jest rozwiązywane, gdy uwierzytelnianie hasłem może wygrać (jawne `gateway.auth.mode="password"` albo tryb wywnioskowany bez zwycięskiego tokena z uwierzytelniania/środowiska).
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione, rozwiązywanie kodu konfiguracji kończy się błędem do czasu jawnego ustawienia trybu.
- Uwaga o rozbieżności wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Po zeskanowaniu zatwierdź parowanie urządzenia za pomocą:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie](/pl/cli/pairing)
