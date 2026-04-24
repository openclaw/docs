---
read_when:
    - Zarządzasz sparowanymi Nodes (kamerami, ekranem, canvasem)
    - Musisz zatwierdzać żądania lub wywoływać polecenia Node
summary: Dokumentacja referencyjna CLI dla `openclaw nodes` (`status`, `pairing`, `invoke`, `camera`/`canvas`/`screen`)
title: Nodes
x-i18n:
    generated_at: "2026-04-24T09:03:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Zarządzanie sparowanymi Nodes (urządzeniami) i wywoływanie możliwości Node.

Powiązane:

- Przegląd Nodes: [Nodes](/pl/nodes)
- Kamera: [Camera nodes](/pl/nodes/camera)
- Obrazy: [Image nodes](/pl/nodes/images)

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

`nodes list` wypisuje tabele oczekujących/sparowanych. Wiersze sparowane zawierają wiek ostatniego połączenia (Last Connect).
Użyj `--connected`, aby pokazać tylko aktualnie połączone Nodes. Użyj `--last-connected <duration>`, aby
filtrować do Nodes, które połączyły się w zadanym czasie trwania (np. `24h`, `7d`).

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu parowania.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania zakresu z
  oczekującego żądania:
  - żądanie bez polecenia: tylko parowanie
  - polecenia Node inne niż exec: parowanie + zapis
  - `system.run` / `system.run.prepare` / `system.which`: parowanie + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flagi invoke:

- `--params <json>`: ciąg obiektu JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania Node (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.
- `system.run` i `system.run.prepare` są tutaj zablokowane; użyj narzędzia `exec` z `host=node` do wykonywania poleceń powłoki.

Do wykonywania poleceń powłoki na Node używaj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` jest teraz skoncentrowane na możliwościach: bezpośrednie RPC przez `nodes invoke`, a także parowanie, kamerę,
ekran, lokalizację, canvas i powiadomienia.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Nodes](/pl/nodes)
