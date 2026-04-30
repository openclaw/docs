---
read_when:
    - Zarządzasz sparowanymi węzłami (kamerami, ekranem, kanwą)
    - Musisz zatwierdzać żądania lub wywoływać polecenia Node
summary: Dokumentacja referencyjna CLI dla `openclaw nodes` (status, parowanie, invoke, camera/canvas/screen)
title: Węzły
x-i18n:
    generated_at: "2026-04-30T09:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Zarządzaj sparowanymi węzłami (urządzeniami) i wywołuj możliwości węzłów.

Powiązane:

- Przegląd węzłów: [Węzły](/pl/nodes)
- Kamera: [Węzły kamery](/pl/nodes/camera)
- Obrazy: [Węzły obrazów](/pl/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` wypisuje tabele oczekujących/sparowanych. Sparowane wiersze zawierają wiek ostatniego połączenia (Last Connect).
Użyj `--connected`, aby pokazać tylko aktualnie połączone węzły. Użyj `--last-connected <duration>`, aby
filtrować do węzłów, które połączyły się w podanym czasie (np. `24h`, `7d`).
Użyj `nodes remove --node <id|name|ip>`, aby usunąć nieaktualny rekord parowania węzła należący do Gateway.

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu parowania.
- `gateway.nodes.pairing.autoApproveCidrs` może pominąć krok oczekiwania tylko dla
  jawnie zaufanego, pierwszego parowania urządzenia `role: node`. Jest domyślnie
  wyłączone i nie zatwierdza uaktualnień.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania zakresu z
  oczekującego żądania:
  - żądanie bez polecenia: tylko parowanie
  - polecenia węzła inne niż exec: parowanie + zapis
  - `system.run` / `system.run.prepare` / `system.which`: parowanie + administrator

## Wywołanie

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flagi wywołania:

- `--params <json>`: ciąg obiektu JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania węzła (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.
- `system.run` i `system.run.prepare` są tutaj blokowane; do wykonywania powłoki użyj narzędzia `exec` z `host=node`.

Do wykonywania powłoki na węźle użyj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` koncentruje się teraz na możliwościach: bezpośrednie RPC przez `nodes invoke`, a także parowanie, kamera,
ekran, lokalizacja, canvas i powiadomienia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
