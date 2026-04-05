---
read_when:
    - Węzeł jest połączony, ale narzędzia camera/canvas/screen/exec nie działają
    - Potrzebujesz modelu mentalnego parowania węzłów i zatwierdzeń
summary: Rozwiązywanie problemów z parowaniem węzłów, wymaganiami pierwszego planu, uprawnieniami i błędami narzędzi
title: Rozwiązywanie problemów z węzłami
x-i18n:
    generated_at: "2026-04-05T13:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z węzłami

Użyj tej strony, gdy węzeł jest widoczny w statusie, ale narzędzia węzła nie działają.

## Sekwencja poleceń

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie uruchom kontrole specyficzne dla węzła:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sygnały zdrowego stanu:

- Węzeł jest połączony i sparowany dla roli `node`.
- `nodes describe` zawiera możliwość, którą wywołujesz.
- Zatwierdzenia exec pokazują oczekiwany tryb/allowlistę.

## Wymagania pierwszego planu

`canvas.*`, `camera.*` i `screen.*` działają tylko na pierwszym planie na węzłach iOS/Android.

Szybka kontrola i naprawa:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli zobaczysz `NODE_BACKGROUND_UNAVAILABLE`, przełącz aplikację węzła na pierwszy plan i spróbuj ponownie.

## Macierz uprawnień

| Możliwość                   | iOS                                     | Android                                     | aplikacja węzła macOS        | Typowy kod błędu              |
| --------------------------- | --------------------------------------- | ------------------------------------------- | ---------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Aparat (+ mikrofon dla dźwięku klipu)  | Aparat (+ mikrofon dla dźwięku klipu)       | Aparat (+ mikrofon dla dźwięku klipu) | `*_PERMISSION_REQUIRED`       |
| `screen.record`             | Nagrywanie ekranu (+ mikrofon opcjonalnie) | Monit przechwytywania ekranu (+ mikrofon opcjonalnie) | Nagrywanie ekranu            | `*_PERMISSION_REQUIRED`       |
| `location.get`              | Podczas używania lub Zawsze (zależnie od trybu) | Lokalizacja na pierwszym/drugim planie zależnie od trybu | Uprawnienie lokalizacji      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                | n/d (ścieżka hosta węzła)               | n/d (ścieżka hosta węzła)                    | Wymagane zatwierdzenia exec  | `SYSTEM_RUN_DENIED`           |

## Parowanie a zatwierdzenia

To są różne bramki:

1. **Parowanie urządzenia**: czy ten węzeł może połączyć się z gateway?
2. **Polityka poleceń węzłów Gateway**: czy identyfikator polecenia RPC jest dozwolony przez `gateway.nodes.allowCommands` / `denyCommands` i domyślne ustawienia platformy?
3. **Zatwierdzenia exec**: czy ten węzeł może lokalnie uruchomić określone polecenie powłoki?

Szybkie kontrole:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Jeśli brakuje parowania, najpierw zatwierdź urządzenie węzła.
Jeśli w `nodes describe` brakuje polecenia, sprawdź politykę poleceń węzłów gateway i to, czy węzeł rzeczywiście zadeklarował to polecenie podczas `connect`.
Jeśli parowanie jest poprawne, ale `system.run` nie działa, napraw zatwierdzenia/allowlistę exec na tym węźle.

Parowanie węzła to bramka tożsamości/zaufania, a nie powierzchnia zatwierdzania poszczególnych poleceń. Dla `system.run` polityka dla konkretnego węzła znajduje się w pliku zatwierdzeń exec tego węzła (`openclaw approvals get --node ...`), a nie w rekordzie parowania gateway.

Dla uruchomień `host=node` opartych na zatwierdzeniach gateway dodatkowo wiąże wykonanie z
przygotowanym kanonicznym `systemRunPlan`. Jeśli późniejszy wywołujący zmieni polecenie/cwd lub
metadane sesji przed przekazaniem zatwierdzonego uruchomienia dalej, gateway odrzuci
uruchomienie jako niedopasowanie zatwierdzenia zamiast ufać zmodyfikowanemu payloadowi.

## Typowe kody błędów węzłów

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle; przełącz ją na pierwszy plan.
- `CAMERA_DISABLED` → przełącznik aparatu wyłączony w ustawieniach węzła.
- `*_PERMISSION_REQUIRED` → brakujące/odrzucone uprawnienie systemowe.
- `LOCATION_DISABLED` → tryb lokalizacji jest wyłączony.
- `LOCATION_PERMISSION_REQUIRED` → żądany tryb lokalizacji nie został przyznany.
- `LOCATION_BACKGROUND_UNAVAILABLE` → aplikacja działa w tle, ale istnieje tylko uprawnienie Podczas używania.
- `SYSTEM_RUN_DENIED: approval required` → żądanie exec wymaga jawnego zatwierdzenia.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez tryb allowlisty.
  Na hostach węzłów Windows formy wrappera powłoki, takie jak `cmd.exe /c ...`, są traktowane jako brak trafienia w allowliście w
  trybie allowlisty, chyba że zostały zatwierdzone przez przepływ ask.

## Szybka pętla odzyskiwania

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jeśli nadal utkniesz:

- Zatwierdź ponownie parowanie urządzenia.
- Otwórz ponownie aplikację węzła (pierwszy plan).
- Przyznaj ponownie uprawnienia systemowe.
- Odtwórz/dostosuj politykę zatwierdzeń exec.

Powiązane:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
