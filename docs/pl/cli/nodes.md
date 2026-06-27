---
read_when:
    - Zarządzasz sparowanymi węzłami (kamery, ekran, płótno)
    - Musisz zatwierdzać żądania lub wywoływać polecenia node
summary: Dokumentacja referencyjna CLI dla `openclaw nodes` (status, parowanie, wywołanie, kamera/płótno/ekran)
title: Węzły
x-i18n:
    generated_at: "2026-06-27T17:22:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Zarządzaj sparowanymi węzłami (urządzeniami) i wywołuj możliwości węzłów.

Powiązane:

- Omówienie węzłów: [Węzły](/pl/nodes)
- Kamera: [Węzły kamer](/pl/nodes/camera)
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

`nodes list` wypisuje tabele oczekujących/sparowanych elementów. Sparowane wiersze zawierają wiek najnowszego połączenia (Last Connect).
Użyj `--connected`, aby pokazać tylko aktualnie połączone węzły. Użyj `--last-connected <duration>`, aby
przefiltrować do węzłów, które połączyły się w określonym czasie (np. `24h`, `7d`).
Użyj `nodes remove --node <id|name|ip>`, aby usunąć sparowanie węzła. W przypadku
węzła wspieranego przez urządzenie unieważnia to rolę `node` urządzenia w `devices/paired.json`
i rozłącza jego sesje z rolą węzła (urządzenie z mieszanymi rolami zachowuje swój wiersz i
traci tylko rolę `node`; urządzenie tylko z węzłem jest usuwane); czyści to również każdy
pasujący starszy rekord sparowania węzła należący do bramy. `operator.pairing` może usuwać
wiersze węzłów niebędące operatorami; wywołujący z tokenem urządzenia, który unieważnia własną rolę węzła na
urządzeniu z mieszanymi rolami, dodatkowo potrzebuje `operator.admin`.

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu parowania.
- `gateway.nodes.pairing.autoApproveCidrs` może pominąć krok oczekiwania tylko dla
  jawnie zaufanego, pierwszego parowania urządzenia `role: node`. Jest domyślnie wyłączone
  i nie zatwierdza aktualizacji.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania dotyczące zakresu z
  oczekującego żądania:
  - żądanie bez polecenia: tylko parowanie
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
- `system.run` i `system.run.prepare` są tutaj blokowane; do wykonywania poleceń powłoki użyj narzędzia `exec` z `host=node`.

Do wykonywania poleceń powłoki na węźle użyj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` koncentruje się teraz na możliwościach: bezpośrednie RPC przez `nodes invoke`, a także parowanie, kamera,
ekran, lokalizacja, Canvas i powiadomienia. Polecenia Canvas są implementowane przez dołączony eksperymentalny Plugin Canvas; core zachowuje hak zgodności, aby pozostały dostępne pod `openclaw nodes canvas`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
