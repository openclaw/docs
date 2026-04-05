---
read_when:
    - Zarządzasz sparowanymi węzłami (kamery, ekran, canvas)
    - Musisz zatwierdzać żądania lub wywoływać polecenia węzła
summary: Dokumentacja CLI dla `openclaw nodes` (status, parowanie, wywoływanie, kamera/canvas/ekran)
title: nodes
x-i18n:
    generated_at: "2026-04-05T13:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Zarządzaj sparowanymi węzłami (urządzeniami) i wywołuj możliwości węzłów.

Powiązane:

- Omówienie węzłów: [Nodes](/nodes)
- Kamera: [Węzły kamery](/nodes/camera)
- Obrazy: [Węzły obrazów](/nodes/images)

Typowe opcje:

- `--url`, `--token`, `--timeout`, `--json`

## Typowe polecenia

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` wyświetla tabele oczekujących/sparowanych elementów. Sparowane wiersze zawierają czas od ostatniego połączenia (Last Connect).
Użyj `--connected`, aby wyświetlić tylko aktualnie połączone węzły. Użyj `--last-connected <duration>`, aby
filtrować węzły, które połączyły się w podanym czasie (np. `24h`, `7d`).

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu parowania.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania zakresu z
  oczekującego żądania:
  - żądanie bez poleceń: tylko parowanie
  - polecenia węzła inne niż exec: parowanie + zapis
  - `system.run` / `system.run.prepare` / `system.which`: parowanie + admin

## Wywoływanie

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flagi wywoływania:

- `--params <json>`: ciąg obiektu JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania węzła (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.
- `system.run` i `system.run.prepare` są tutaj zablokowane; do wykonywania poleceń powłoki użyj narzędzia `exec` z `host=node`.

Do wykonywania poleceń powłoki na węźle użyj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` jest teraz skoncentrowane na możliwościach: bezpośrednie RPC przez `nodes invoke`, a także parowanie, kamera,
ekran, lokalizacja, canvas i powiadomienia.
