---
read_when:
    - Zarządzasz sparowanymi węzłami (kamery, ekran, kanwa)
    - Musisz zatwierdzać żądania lub wywoływać polecenia node
summary: Dokumentacja referencyjna CLI dla `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Węzły
x-i18n:
    generated_at: "2026-05-07T13:14:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Zarządzaj sparowanymi Node (urządzeniami) i wywołuj możliwości Node.

Powiązane:

- Przegląd Node: [Node](/pl/nodes)
- Kamera: [Node kamery](/pl/nodes/camera)
- Obrazy: [Node obrazów](/pl/nodes/images)

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

`nodes list` wypisuje tabele oczekujących/sparowanych elementów. Sparowane wiersze zawierają wiek najnowszego połączenia (Ostatnie połączenie).
Użyj `--connected`, aby pokazać tylko aktualnie połączone Node. Użyj `--last-connected <duration>`, aby
odfiltrować Node, które połączyły się w podanym czasie (np. `24h`, `7d`).
Użyj `nodes remove --node <id|name|ip>`, aby usunąć nieaktualny rekord parowania Node należący do Gateway.

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu parowania.
- `gateway.nodes.pairing.autoApproveCidrs` może pominąć krok oczekiwania tylko dla
  jawnie zaufanego, pierwszego parowania urządzenia `role: node`. Domyślnie jest wyłączone
  i nie zatwierdza uaktualnień.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania dotyczące zakresu z
  oczekującego żądania:
  - żądanie bez polecenia: tylko parowanie
  - polecenia Node inne niż exec: parowanie + zapis
  - `system.run` / `system.run.prepare` / `system.which`: parowanie + admin

## Wywoływanie

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flagi wywołania:

- `--params <json>`: ciąg obiektu JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania Node (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.
- `system.run` i `system.run.prepare` są tutaj blokowane; do wykonywania poleceń powłoki użyj narzędzia `exec` z `host=node`.

Do wykonywania poleceń powłoki na Node użyj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` koncentruje się teraz na możliwościach: bezpośrednie RPC przez `nodes invoke`, a także parowanie, kamera,
ekran, lokalizacja, Canvas i powiadomienia. Polecenia Canvas są implementowane przez dołączony eksperymentalny Plugin Canvas; rdzeń zachowuje hak zgodności, aby pozostały dostępne pod `openclaw nodes canvas`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Node](/pl/nodes)
