---
read_when:
    - Chcesz szybko sparować mobilną aplikację Node z Gateway
    - Potrzebujesz danych wyjściowych kodu konfiguracji do zdalnego/ręcznego udostępniania
summary: Dokumentacja referencyjna CLI dla `openclaw qr` (generowanie kodu QR parowania mobilnego + kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Wygeneruj kod QR parowania mobilnego i kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

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
- `--url <url>`: zastąp URL Gateway używany w ładunku
- `--public-url <url>`: zastąp publiczny URL używany w ładunku
- `--token <token>`: zastąp token Gateway, względem którego uwierzytelnia się przepływ bootstrap
- `--password <password>`: zastąp hasło Gateway, względem którego uwierzytelnia się przepływ bootstrap
- `--setup-code-only`: wypisz tylko kod konfiguracji
- `--no-ascii`: pomiń renderowanie kodu QR w ASCII
- `--json`: emituj JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Uwagi

- `--token` i `--password` wzajemnie się wykluczają.
- Sam kod konfiguracji przenosi teraz nieprzezroczysty, krótkotrwały `bootstrapToken`, a nie współdzielony token/hasło Gateway.
- Wbudowany bootstrap kodu konfiguracji zwraca podstawowy token `node` z `scopes: []` oraz ograniczony token przekazania `operator` na potrzeby zaufanego wdrażania mobilnego.
- Przekazany token operatora jest ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`; zakresy mutacji parowania oraz `operator.admin` nadal wymagają osobnego zatwierdzonego parowania operatora lub przepływu tokenu.
- Parowanie mobilne kończy się bezpieczną odmową dla adresów URL Gateway `ws://` dostępnych przez Tailscale/publicznie. Prywatne adresy LAN i hosty Bonjour `.local` nadal są obsługiwane przez `ws://`, ale trasy mobilne przez Tailscale/publiczne powinny używać Tailscale Serve/Funnel albo adresu URL Gateway `wss://`.
- Z `--remote` OpenClaw wymaga `gateway.remote.url` albo
  `gateway.tailscale.mode=serve|funnel`.
- Z `--remote`, jeśli faktycznie aktywne zdalne poświadczenia są skonfigurowane jako SecretRefs i nie przekazujesz `--token` ani `--password`, polecenie rozwiązuje je z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się błędem.
- Bez `--remote` lokalne SecretRefs uwierzytelniania Gateway są rozwiązywane, gdy nie przekazano nadpisania uwierzytelniania w CLI:
  - `gateway.auth.token` jest rozwiązywane, gdy uwierzytelnianie tokenem może wygrać (jawne `gateway.auth.mode="token"` albo tryb wywnioskowany, w którym nie wygrywa żadne źródło hasła).
  - `gateway.auth.password` jest rozwiązywane, gdy uwierzytelnianie hasłem może wygrać (jawne `gateway.auth.mode="password"` albo tryb wywnioskowany bez wygrywającego tokenu z auth/env).
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione, rozwiązywanie kodu konfiguracji kończy się błędem, dopóki tryb nie zostanie ustawiony jawnie.
- Uwaga o niezgodności wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Oficjalne aplikacje OpenClaw na iOS i Androida łączą się automatycznie, gdy ich
  metadane kodu konfiguracji pasują. Jeśli żądanie pozostaje oczekujące (na przykład dla
  nieoficjalnego klienta lub niezgodnych metadanych), przejrzyj je i zatwierdź za pomocą:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie](/pl/cli/pairing)
