---
read_when:
    - Chcesz szybko sparować mobilną aplikację node z gatewayem
    - Potrzebujesz danych wyjściowych setup-code do zdalnego/ręcznego udostępniania
summary: Dokumentacja CLI dla `openclaw qr` (generowanie kodu QR parowania mobilnego + kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:22:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Wygeneruj kod QR do parowania mobilnego oraz kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

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
- `--token <token>`: zastąp token Gateway, wobec którego uwierzytelnia się przepływ bootstrap
- `--password <password>`: zastąp hasło Gateway, wobec którego uwierzytelnia się przepływ bootstrap
- `--setup-code-only`: wypisz tylko kod konfiguracji
- `--no-ascii`: pomiń renderowanie ASCII QR
- `--json`: wygeneruj JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Uwagi

- `--token` i `--password` wzajemnie się wykluczają.
- Sam kod konfiguracji przenosi teraz nieprzezroczysty, krótkotrwały `bootstrapToken`, a nie współdzielony token/hasło Gateway.
- Wbudowany bootstrap kodu konfiguracji zwraca główny token `node` z `scopes: []` oraz ograniczony token przekazania `operator` dla zaufanego onboardingu mobilnego.
- Przekazany token operatora jest ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`; `operator.admin` oraz `operator.pairing` wymagają osobnego zatwierdzonego parowania operatora lub przepływu tokenu.
- Parowanie mobilne kończy się odmową dla adresów URL Gateway `ws://` Tailscale/publicznych. Prywatne adresy LAN i hosty Bonjour `.local` pozostają obsługiwane przez `ws://`, ale trasy mobilne Tailscale/publiczne powinny używać Tailscale Serve/Funnel albo adresu URL Gateway `wss://`.
- Z `--remote` OpenClaw wymaga `gateway.remote.url` albo
  `gateway.tailscale.mode=serve|funnel`.
- Z `--remote`, jeśli efektywnie aktywne zdalne poświadczenia są skonfigurowane jako SecretRefs i nie przekażesz `--token` ani `--password`, polecenie rozwiąże je z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się niepowodzeniem.
- Bez `--remote` lokalne SecretRefs uwierzytelniania Gateway są rozwiązywane, gdy nie przekazano nadpisania uwierzytelniania w CLI:
  - `gateway.auth.token` jest rozwiązywane, gdy uwierzytelnianie tokenem może wygrać (jawne `gateway.auth.mode="token"` albo wywnioskowany tryb, w którym nie wygrywa żadne źródło hasła).
  - `gateway.auth.password` jest rozwiązywane, gdy uwierzytelnianie hasłem może wygrać (jawne `gateway.auth.mode="password"` albo wywnioskowany tryb bez zwycięskiego tokenu z auth/env).
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione, rozwiązywanie kodu konfiguracji kończy się niepowodzeniem do czasu jawnego ustawienia trybu.
- Uwaga o rozbieżności wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Po zeskanowaniu zatwierdź parowanie urządzenia za pomocą:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie](/pl/cli/pairing)
