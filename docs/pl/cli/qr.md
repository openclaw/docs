---
read_when:
    - Chcesz szybko sparować aplikację mobilnego Node z gateway
    - Potrzebujesz danych wyjściowych setup-code do zdalnego/ręcznego udostępniania
summary: Dokumentacja CLI dla `openclaw qr` (generowanie mobilnego kodu QR parowania + kodu konfiguracji)
title: QR
x-i18n:
    generated_at: "2026-04-24T09:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Wygeneruj mobilny kod QR parowania i setup code na podstawie bieżącej konfiguracji Gateway.

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
- `--url <url>`: nadpisz URL gateway używany w ładunku
- `--public-url <url>`: nadpisz publiczny URL używany w ładunku
- `--token <token>`: nadpisz, względem którego tokena gateway uwierzytelnia się przepływ bootstrap
- `--password <password>`: nadpisz, względem którego hasła gateway uwierzytelnia się przepływ bootstrap
- `--setup-code-only`: wypisz tylko setup code
- `--no-ascii`: pomiń renderowanie ASCII QR
- `--json`: emituj JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Uwagi

- `--token` i `--password` wzajemnie się wykluczają.
- Sam setup code przenosi teraz nieprzezroczysty, krótkotrwały `bootstrapToken`, a nie współdzielony token/hasło gateway.
- W wbudowanym przepływie bootstrap node/operator podstawowy token Node nadal trafia z `scopes: []`.
- Jeśli przekazanie bootstrap wydaje także token operatora, pozostaje on ograniczony do listy dozwolonych bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Sprawdzenia zakresów bootstrap są poprzedzane prefiksem roli. Ta lista dozwolonych operatora spełnia tylko żądania operatora; role inne niż operator nadal potrzebują zakresów pod własnym prefiksem roli.
- Parowanie mobilne działa w trybie fail-closed dla URL-i gateway Tailscale/public `ws://`. Prywatny LAN `ws://` nadal jest obsługiwany, ale mobilne trasy Tailscale/public powinny używać Tailscale Serve/Funnel albo URL-a gateway `wss://`.
- Przy `--remote` OpenClaw wymaga albo `gateway.remote.url`, albo
  `gateway.tailscale.mode=serve|funnel`.
- Przy `--remote`, jeśli efektywnie aktywne zdalne poświadczenia są skonfigurowane jako SecretRefs i nie przekażesz `--token` ani `--password`, polecenie rozwiąże je z aktywnego snapshotu gateway. Jeśli gateway jest niedostępny, polecenie natychmiast zakończy się błędem.
- Bez `--remote` lokalne SecretRefs uwierzytelniania gateway są rozwiązywane, gdy nie przekazano nadpisania uwierzytelniania przez CLI:
  - `gateway.auth.token` jest rozwiązywane, gdy uwierzytelnianie tokenem może wygrać (jawne `gateway.auth.mode="token"` albo tryb wywnioskowany, w którym żadne źródło hasła nie wygrywa).
  - `gateway.auth.password` jest rozwiązywane, gdy uwierzytelnianie hasłem może wygrać (jawne `gateway.auth.mode="password"` albo tryb wywnioskowany bez wygrywającego tokena z auth/env).
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), a `gateway.auth.mode` nie jest ustawione, rozwiązywanie setup code kończy się błędem, dopóki tryb nie zostanie jawnie ustawiony.
- Uwaga o różnicy wersji Gateway: ta ścieżka poleceń wymaga gateway, który obsługuje `secrets.resolve`; starsze gatewaye zwracają błąd nieznanej metody.
- Po zeskanowaniu zatwierdź parowanie urządzenia za pomocą:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Powiązane

- [CLI reference](/pl/cli)
- [Pairing](/pl/cli/pairing)
