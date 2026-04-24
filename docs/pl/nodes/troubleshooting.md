---
read_when:
    - Node jest połączony, ale narzędzia camera/canvas/screen/exec kończą się błędem
    - Potrzebujesz modelu mentalnego parowania Node a zatwierdzeń
summary: Rozwiązywanie problemów z parowaniem Node, wymaganiami pierwszego planu, uprawnieniami i błędami narzędzi
title: Rozwiązywanie problemów z Node
x-i18n:
    generated_at: "2026-04-24T09:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Używaj tej strony, gdy Node jest widoczny w statusie, ale narzędzia Node kończą się błędem.

## Sekwencja poleceń

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie uruchom kontrole specyficzne dla Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sygnały zdrowego stanu:

- Node jest połączony i sparowany dla roli `node`.
- `nodes describe` zawiera możliwość, którą wywołujesz.
- Zatwierdzenia exec pokazują oczekiwany tryb/listę dozwolonych.

## Wymagania pierwszego planu

`canvas.*`, `camera.*` i `screen.*` działają tylko na pierwszym planie na Node iOS/Android.

Szybkie sprawdzenie i naprawa:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli widzisz `NODE_BACKGROUND_UNAVAILABLE`, przenieś aplikację Node na pierwszy plan i spróbuj ponownie.

## Macierz uprawnień

| Możliwość                    | iOS                                     | Android                                      | aplikacja Node macOS         | Typowy kod błędu              |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ---------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Camera (+ mic dla audio klipu)          | Camera (+ mic dla audio klipu)               | Camera (+ mic dla audio klipu) | `*_PERMISSION_REQUIRED`     |
| `screen.record`              | Screen Recording (+ mic opcjonalnie)    | prompt przechwytywania ekranu (+ mic opcjonalnie) | Screen Recording         | `*_PERMISSION_REQUIRED`       |
| `location.get`               | While Using albo Always (zależnie od trybu) | lokalizacja na pierwszym planie/w tle zależnie od trybu | uprawnienie Location | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/d (ścieżka hosta Node)                | n/d (ścieżka hosta Node)                     | wymagane zatwierdzenia exec  | `SYSTEM_RUN_DENIED`           |

## Parowanie a zatwierdzenia

To są różne bramki:

1. **Parowanie urządzenia**: czy ten Node może połączyć się z gateway?
2. **Polityka poleceń Node w Gateway**: czy identyfikator polecenia RPC jest dozwolony przez `gateway.nodes.allowCommands` / `denyCommands` i domyślne ustawienia platformy?
3. **Zatwierdzenia exec**: czy ten Node może lokalnie uruchomić konkretne polecenie powłoki?

Szybkie sprawdzenia:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Jeśli brakuje parowania, najpierw zatwierdź urządzenie Node.
Jeśli w `nodes describe` brakuje polecenia, sprawdź politykę poleceń Node w gateway oraz czy Node rzeczywiście zadeklarował to polecenie przy połączeniu.
Jeśli parowanie jest poprawne, ale `system.run` kończy się błędem, popraw zatwierdzenia exec/listę dozwolonych na tym Node.

Parowanie Node to bramka tożsamości/zaufania, a nie powierzchnia zatwierdzania per polecenie. Dla `system.run` polityka per Node znajduje się w pliku zatwierdzeń exec tego Node (`openclaw approvals get --node ...`), a nie w rekordzie parowania gateway.

Dla uruchomień `host=node` wspieranych zatwierdzeniami gateway dodatkowo wiąże wykonanie z
przygotowanym kanonicznym `systemRunPlan`. Jeśli późniejszy wywołujący zmieni polecenie/cwd
albo metadane sesji przed przekazaniem zatwierdzonego uruchomienia, gateway odrzuci
uruchomienie jako niezgodność zatwierdzenia zamiast ufać zmodyfikowanemu ładunkowi.

## Typowe kody błędów Node

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle; przenieś ją na pierwszy plan.
- `CAMERA_DISABLED` → przełącznik kamery wyłączony w ustawieniach Node.
- `*_PERMISSION_REQUIRED` → brakuje uprawnienia systemowego albo zostało odrzucone.
- `LOCATION_DISABLED` → tryb lokalizacji jest wyłączony.
- `LOCATION_PERMISSION_REQUIRED` → żądany tryb lokalizacji nie został przyznany.
- `LOCATION_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle, ale istnieje tylko uprawnienie While Using.
- `SYSTEM_RUN_DENIED: approval required` → żądanie exec wymaga jawnego zatwierdzenia.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez tryb listy dozwolonych.
  Na hostach Node z Windows formy opakowania powłoki, takie jak `cmd.exe /c ...`, są traktowane jako chybienie listy dozwolonych w
  trybie listy dozwolonych, chyba że zostaną zatwierdzone przez przepływ ask.

## Szybka pętla odzyskiwania

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli nadal utkniesz:

- Ponownie zatwierdź parowanie urządzenia.
- Ponownie otwórz aplikację Node (na pierwszym planie).
- Ponownie przyznaj uprawnienia systemowe.
- Odtwórz/dostosuj politykę zatwierdzania exec.

Powiązane:

- [/nodes/index](/pl/nodes/index)
- [/nodes/camera](/pl/nodes/camera)
- [/nodes/location-command](/pl/nodes/location-command)
- [/tools/exec-approvals](/pl/tools/exec-approvals)
- [/gateway/pairing](/pl/gateway/pairing)

## Powiązane

- [Nodes overview](/pl/nodes)
- [Gateway troubleshooting](/pl/gateway/troubleshooting)
- [Channel troubleshooting](/pl/channels/troubleshooting)
