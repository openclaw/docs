---
read_when:
    - Node jest połączony, ale narzędzia camera/canvas/screen/exec nie działają
    - 'Potrzebujesz modelu mentalnego: parowanie węzła a zatwierdzenia'
summary: Rozwiązywanie problemów z parowaniem węzła, wymaganiami dotyczącymi działania na pierwszym planie, uprawnieniami i awariami narzędzi
title: Rozwiązywanie problemów z Node
x-i18n:
    generated_at: "2026-05-10T19:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy węzeł jest widoczny w statusie, ale narzędzia węzła zawodzą.

## Drabina poleceń

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie uruchom kontrole właściwe dla węzła:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sygnały prawidłowego działania:

- Węzeł jest połączony i sparowany dla roli `node`.
- `nodes describe` zawiera wywoływaną funkcję.
- Zatwierdzenia exec pokazują oczekiwany tryb/listę dozwolonych.

## Wymagania pierwszego planu

`canvas.*`, `camera.*` i `screen.*` działają tylko na pierwszym planie na węzłach iOS/Android.

Szybka kontrola i poprawka:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli widzisz `NODE_BACKGROUND_UNAVAILABLE`, przenieś aplikację węzła na pierwszy plan i spróbuj ponownie.

## Macierz uprawnień

| Funkcja                      | iOS                                           | Android                                             | Aplikacja węzła macOS        | Typowy kod błędu               |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------- | ---------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Kamera (+ mikrofon dla dźwięku klipu)         | Kamera (+ mikrofon dla dźwięku klipu)               | Kamera (+ mikrofon dla dźwięku klipu) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Nagrywanie ekranu (+ opcjonalnie mikrofon)    | Monit przechwytywania ekranu (+ opcjonalnie mikrofon) | Nagrywanie ekranu            | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Podczas używania lub zawsze (zależy od trybu) | Lokalizacja na pierwszym planie/w tle zależnie od trybu | Uprawnienie do lokalizacji   | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | nie dotyczy (ścieżka hosta węzła)             | nie dotyczy (ścieżka hosta węzła)                   | Wymagane zatwierdzenia exec  | `SYSTEM_RUN_DENIED`            |

## Parowanie a zatwierdzenia

To są różne bramki:

1. **Parowanie urządzenia**: czy ten węzeł może połączyć się z Gateway?
2. **Polityka poleceń węzła Gateway**: czy identyfikator polecenia RPC jest dozwolony przez `gateway.nodes.allowCommands` / `denyCommands` oraz domyślne ustawienia platformy?
3. **Zatwierdzenia exec**: czy ten węzeł może lokalnie uruchomić konkretne polecenie powłoki?

Szybkie kontrole:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Jeśli brakuje parowania, najpierw zatwierdź urządzenie węzła.
Jeśli w `nodes describe` brakuje polecenia, sprawdź politykę poleceń węzła Gateway oraz czy węzeł faktycznie zadeklarował to polecenie przy połączeniu.
Jeśli parowanie jest poprawne, ale `system.run` kończy się niepowodzeniem, popraw zatwierdzenia exec/listę dozwolonych na tym węźle.

Parowanie węzła jest bramką tożsamości/zaufania, a nie powierzchnią zatwierdzania per polecenie. Dla `system.run` polityka dla danego węzła znajduje się w pliku zatwierdzeń exec tego węzła (`openclaw approvals get --node ...`), a nie w rekordzie parowania Gateway.

Dla uruchomień z `host=node` opartych na zatwierdzeniach Gateway wiąże też wykonanie z
przygotowanym kanonicznym `systemRunPlan`. Jeśli późniejszy wywołujący zmieni polecenie/cwd lub
metadane sesji przed przekazaniem zatwierdzonego uruchomienia, Gateway odrzuca
uruchomienie jako niezgodność zatwierdzenia zamiast ufać edytowanemu ładunkowi.

## Typowe kody błędów węzła

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle; przenieś ją na pierwszy plan.
- `CAMERA_DISABLED` → przełącznik kamery jest wyłączony w ustawieniach węzła.
- `*_PERMISSION_REQUIRED` → brakuje uprawnienia systemu operacyjnego lub zostało odmówione.
- `LOCATION_DISABLED` → tryb lokalizacji jest wyłączony.
- `LOCATION_PERMISSION_REQUIRED` → żądany tryb lokalizacji nie został przyznany.
- `LOCATION_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle, ale istnieje tylko uprawnienie Podczas używania.
- `SYSTEM_RUN_DENIED: approval required` → żądanie exec wymaga jawnego zatwierdzenia.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez tryb listy dozwolonych.
  Na hostach węzłów Windows formy opakowujące powłokę, takie jak `cmd.exe /c ...`, są traktowane jako braki na liście dozwolonych w
  trybie listy dozwolonych, chyba że zostaną zatwierdzone przez przepływ pytania.

## Szybka pętla odzyskiwania

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli problem nadal występuje:

- Ponownie zatwierdź parowanie urządzenia.
- Ponownie otwórz aplikację węzła (na pierwszym planie).
- Ponownie przyznaj uprawnienia systemu operacyjnego.
- Odtwórz/dostosuj politykę zatwierdzeń exec.

## Powiązane

- [Omówienie węzłów](/pl/nodes)
- [Węzły kamery](/pl/nodes/camera)
- [Polecenie lokalizacji](/pl/nodes/location-command)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Parowanie Gateway](/pl/gateway/pairing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
