---
read_when:
    - Chcesz szybko sparować mobilną aplikację node z gateway
    - Potrzebujesz wyjścia z kodem konfiguracji do zdalnego/ręcznego udostępnienia
summary: Dokumentacja CLI dla `openclaw qr` (generowanie QR parowania mobilnego + kodu konfiguracji)
title: qr
x-i18n:
    generated_at: "2026-04-05T13:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Wygeneruj mobilny kod QR parowania i kod konfiguracji na podstawie bieżącej konfiguracji Gateway.

## Użycie

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opcje

- `--remote`: preferuj `gateway.remote.url`; jeśli nie jest ustawiony, `gateway.tailscale.mode=serve|funnel` nadal może dostarczyć zdalny publiczny URL
- `--url <url>`: nadpisz URL gateway używany w payload
- `--public-url <url>`: nadpisz publiczny URL używany w payload
- `--token <token>`: nadpisz, względem którego tokenu gateway uwierzytelnia się przepływ bootstrap
- `--password <password>`: nadpisz, względem którego hasła gateway uwierzytelnia się przepływ bootstrap
- `--setup-code-only`: wypisz tylko kod konfiguracji
- `--no-ascii`: pomiń renderowanie ASCII QR
- `--json`: emituj JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Uwagi

- `--token` i `--password` wzajemnie się wykluczają.
- Sam kod konfiguracji zawiera teraz niejawny, krótkotrwały `bootstrapToken`, a nie współdzielony token/hasło gateway.
- W wbudowanym przepływie bootstrap node/operator podstawowy token node nadal trafia z `scopes: []`.
- Jeśli przekazanie bootstrap wydaje też token operatora, pozostaje on ograniczony do allowlisty bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Kontrole zakresów bootstrap mają prefiks roli. Ta allowlista operatora spełnia tylko żądania operatora; role inne niż operator nadal potrzebują zakresów pod własnym prefiksem roli.
- Parowanie mobilne kończy się bezpieczną odmową dla URL-i gateway `ws://` w Tailscale/public. Prywatny LAN `ws://` nadal jest obsługiwany, ale mobilne trasy Tailscale/public powinny używać Tailscale Serve/Funnel albo URL gateway `wss://`.
- Z `--remote` OpenClaw wymaga albo `gateway.remote.url`, albo
  `gateway.tailscale.mode=serve|funnel`.
- Z `--remote`, jeśli efektywnie aktywne zdalne poświadczenia są skonfigurowane jako SecretRefs i nie przekażesz `--token` ani `--password`, polecenie rozwiązuje je z aktywnego snapshotu gateway. Jeśli gateway jest niedostępny, polecenie kończy się szybkim błędem.
- Bez `--remote` lokalne SecretRef uwierzytelniania gateway są rozwiązywane, gdy nie przekazano nadpisania uwierzytelniania w CLI:
  - `gateway.auth.token` jest rozwiązywany, gdy uwierzytelnianie tokenem może wygrać (jawne `gateway.auth.mode="token"` lub tryb wnioskowany, gdy żadne źródło hasła nie wygrywa).
  - `gateway.auth.password` jest rozwiązywane, gdy uwierzytelnianie hasłem może wygrać (jawne `gateway.auth.mode="password"` lub tryb wnioskowany bez wygrywającego tokenu z auth/env).
- Jeśli zarówno `gateway.auth.token`, jak i `gateway.auth.password` są skonfigurowane (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione, rozwiązywanie kodu konfiguracji kończy się błędem, dopóki tryb nie zostanie ustawiony jawnie.
- Uwaga o rozbieżności wersji gateway: ta ścieżka polecenia wymaga gateway obsługującego `secrets.resolve`; starsze gateway zwracają błąd nieznanej metody.
- Po zeskanowaniu zatwierdź parowanie urządzenia za pomocą:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
