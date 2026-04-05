---
read_when:
    - Aktualizowanie mapowań identyfikatorów modeli urządzeń lub plików NOTICE/licencji
    - Zmiana sposobu wyświetlania nazw urządzeń w interfejsie Instances UI
summary: Jak OpenClaw vendoryzuje identyfikatory modeli urządzeń Apple do przyjaznych nazw w aplikacji macOS.
title: Baza danych modeli urządzeń
x-i18n:
    generated_at: "2026-04-05T14:04:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Baza danych modeli urządzeń (przyjazne nazwy)

Aplikacja towarzysząca dla macOS pokazuje przyjazne nazwy modeli urządzeń Apple w interfejsie **Instances** UI, mapując identyfikatory modeli Apple (np. `iPad16,6`, `Mac16,6`) na nazwy czytelne dla człowieka.

Mapowanie jest vendoryzowane jako JSON w:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Źródło danych

Obecnie vendoryzujemy mapowanie z repozytorium na licencji MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Aby zachować deterministyczność buildów, pliki JSON są przypięte do konkretnych commitów upstream (zapisanych w `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Aktualizowanie bazy danych

1. Wybierz commity upstream, do których chcesz przypiąć wersje (jeden dla iOS, jeden dla macOS).
2. Zaktualizuj hashe commitów w `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Pobierz ponownie pliki JSON przypięte do tych commitów:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Upewnij się, że `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` nadal odpowiada wersji upstream (zastąp go, jeśli licencja upstream się zmieni).
5. Zweryfikuj, że aplikacja macOS buduje się poprawnie (bez ostrzeżeń):

```bash
swift build --package-path apps/macos
```
