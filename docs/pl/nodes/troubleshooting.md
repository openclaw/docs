---
read_when:
    - Node jest połączony, ale narzędzia aparatu/canvas/ekranu/exec nie działają
    - Potrzebujesz modelu mentalnego rozróżniającego parowanie węzłów od zatwierdzeń
summary: Rozwiązywanie problemów z parowaniem Node, wymaganiami dotyczącymi działania na pierwszym planie, uprawnieniami i błędami narzędzi
title: Rozwiązywanie problemów z Node
x-i18n:
    generated_at: "2026-07-12T15:16:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy Node jest widoczny w statusie, ale narzędzia Node nie działają.

## Sekwencja poleceń

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie uruchom testy dotyczące konkretnego Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sygnały prawidłowego działania:

- Node jest połączony i sparowany dla roli `node`.
- Wynik `nodes describe` zawiera wywoływaną funkcję.
- Zatwierdzenia wykonywania pokazują oczekiwany tryb/listę dozwolonych elementów.

## Wymagania dotyczące pierwszego planu

Operacje `canvas.*`, `camera.*` i `screen.*` działają na Node iOS/Android tylko wtedy, gdy aplikacja jest na pierwszym planie.

Szybkie sprawdzenie i rozwiązanie:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli widzisz `NODE_BACKGROUND_UNAVAILABLE`, przenieś aplikację Node na pierwszy plan i spróbuj ponownie.

## Macierz uprawnień

| Funkcja                      | iOS                                                   | Android                                                   | Aplikacja Node na macOS                    | Typowy kod błędu                             |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ mikrofon dla dźwięku w klipie)              | Kamera (+ mikrofon dla dźwięku w klipie)                  | Kamera (+ mikrofon dla dźwięku w klipie)    | `*_PERMISSION_REQUIRED`                      |
| `screen.record`              | Nagrywanie ekranu (+ opcjonalnie mikrofon)            | Monit przechwytywania ekranu (+ opcjonalnie mikrofon)     | Nagrywanie ekranu                            | `*_PERMISSION_REQUIRED`                      |
| `computer.act`               | nie dotyczy                                           | nie dotyczy                                               | Dostępność + nagrywanie ekranu               | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Podczas używania lub zawsze (w zależności od trybu)   | Lokalizacja na pierwszym planie/w tle zależnie od trybu   | Uprawnienie do lokalizacji                   | `LOCATION_PERMISSION_REQUIRED`               |
| `system.run`                 | nie dotyczy (ścieżka hosta Node)                      | nie dotyczy (ścieżka hosta Node)                          | Wymagane zatwierdzenia wykonywania           | `SYSTEM_RUN_DENIED`                          |

## Parowanie a zatwierdzenia

Powodzenie polecenia Node zależy od trzech oddzielnych mechanizmów kontroli:

1. **Parowanie urządzenia**: czy ten Node może połączyć się z Gateway?
2. **Zasady poleceń Node w Gateway**: czy identyfikator polecenia RPC jest dozwolony przez `gateway.nodes.allowCommands` / `denyCommands` oraz ustawienia domyślne platformy?
3. **Zatwierdzenia wykonywania**: czy ten Node może lokalnie uruchomić określone polecenie powłoki?

Parowanie Node jest mechanizmem kontroli tożsamości/zaufania, a nie miejscem zatwierdzania poszczególnych poleceń. W przypadku `system.run` zasady dla konkretnego Node znajdują się w pliku zatwierdzeń wykonywania tego Node (`openclaw approvals get --node ...`), a nie w rekordzie parowania Gateway.

Szybkie testy:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Brak parowania: najpierw zatwierdź urządzenie Node.
- W wyniku `nodes describe` brakuje polecenia: sprawdź zasady poleceń Node w Gateway oraz czy Node faktycznie zadeklarował to polecenie podczas łączenia.
- Parowanie działa, ale `system.run` kończy się niepowodzeniem: popraw zatwierdzenia wykonywania/listę dozwolonych elementów na tym Node.

W przypadku uruchomień `host=node` wymagających zatwierdzenia Gateway wiąże również wykonanie z przygotowanym, kanonicznym planem `systemRunPlan`. Jeśli przed przekazaniem zatwierdzonego uruchomienia późniejszy wywołujący zmodyfikuje polecenie, katalog roboczy lub metadane sesji, Gateway odrzuci uruchomienie z powodu niezgodności zatwierdzenia, zamiast ufać zmodyfikowanym danym.

## Typowe kody błędów Node

| Kod                                    | Znaczenie                                                                                                                                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | Aplikacja działa w tle; przenieś ją na pierwszy plan.                                                                                                                                                                                                             |
| `CAMERA_DISABLED`                      | Przełącznik kamery jest wyłączony w ustawieniach Node.                                                                                                                                                                                                            |
| `*_PERMISSION_REQUIRED`                | Brak uprawnienia systemu operacyjnego lub zostało ono odrzucone.                                                                                                                                                                                                  |
| `LOCATION_DISABLED`                    | Tryb lokalizacji jest wyłączony.                                                                                                                                                                                                                                  |
| `LOCATION_PERMISSION_REQUIRED`         | Nie przyznano uprawnienia dla żądanego trybu lokalizacji.                                                                                                                                                                                                         |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | Aplikacja działa w tle, ale ma tylko uprawnienie Podczas używania.                                                                                                                                                                                                 |
| `COMPUTER_DISABLED`                    | Włącz **Allow Computer Control** w aplikacji na macOS, a następnie zatwierdź aktualizację parowania.                                                                                                                                                               |
| `ACCESSIBILITY_REQUIRED`               | Przyznaj bieżącemu pakietowi aplikacji OpenClaw uprawnienie Dostępność w Ustawieniach systemowych macOS.                                                                                                                                                           |
| `SYSTEM_RUN_DENIED: approval required` | Żądanie wykonania wymaga jawnego zatwierdzenia.                                                                                                                                                                                                                    |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Polecenie zostało zablokowane przez tryb listy dozwolonych elementów. Na hostach Node z systemem Windows formy używające opakowania powłoki, takie jak `cmd.exe /c ...`, są w tym trybie traktowane jako brak zgodności z listą, chyba że zatwierdzono je w procesie pytania. |

## Szybka procedura naprawcza

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli problem nadal występuje:

- Ponownie zatwierdź parowanie urządzenia.
- Otwórz ponownie aplikację Node na pierwszym planie.
- Ponownie przyznaj uprawnienia systemu operacyjnego.
- Utwórz ponownie lub dostosuj zasady zatwierdzania wykonywania.

W przypadku sterowania komputerem sprawdź również, czy agent obsługujący analizę obrazu udostępnia narzędzie `computer`, czy `screen.snapshot` działa z uprawnieniem Nagrywanie ekranu oraz czy `/phone status` pokazuje zamierzoną tymczasową lub trwałą autoryzację Gateway. Wpis `gateway.nodes.denyCommands` zawsze ma pierwszeństwo przed `allowCommands`.

## Powiązane materiały

- [Przegląd Node](/pl/nodes)
- [Node z kamerą](/pl/nodes/camera)
- [Polecenie lokalizacji](/pl/nodes/location-command)
- [Sterowanie komputerem](/pl/nodes/computer-use)
- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals)
- [Parowanie Gateway](/pl/gateway/pairing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
