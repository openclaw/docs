---
read_when:
    - Aktualizowanie mapowań identyfikatorów modeli urządzeń lub plików NOTICE/licencji
    - Zmiana sposobu wyświetlania nazw urządzeń w interfejsie Instancje
summary: Jak OpenClaw dołącza identyfikatory modeli urządzeń Apple, aby wyświetlać przyjazne nazwy w aplikacji na macOS.
title: Baza danych modeli urządzeń
x-i18n:
    generated_at: "2026-07-12T15:35:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Interfejs **Instances** aplikacji towarzyszącej dla systemu macOS odwzorowuje identyfikatory modeli Apple na przyjazne nazwy (`iPad16,6` -> „iPad Pro 13-calowy (M4)”, `Mac16,6` -> „MacBook Pro (14-calowy, 2024)”). `DeviceModelCatalog` używa również prefiksu identyfikatora (a w razie jego braku — rodziny urządzenia), aby wybrać symbol SF dla każdego urządzenia.

Pliki w `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Plik                                   | Przeznaczenie                                      |
| -------------------------------------- | -------------------------------------------------- |
| `ios-device-identifiers.json`          | Mapowanie identyfikatora iOS/iPadOS -> nazwa       |
| `mac-device-identifiers.json`          | Mapowanie identyfikatora Mac -> nazwa               |
| `NOTICE.md`                            | Przypięte wartości SHA commitów źródła nadrzędnego |
| `LICENSE.apple-device-identifiers.txt` | Licencja MIT źródła nadrzędnego                    |

## Źródło danych

Dane zostały skopiowane z repozytorium GitHub `kyle-seongwoo-jun/apple-device-identifiers`, objętego licencją MIT. Pliki JSON są przypięte do wartości SHA commitów zapisanych w `NOTICE.md`, aby kompilacje były deterministyczne.

## Aktualizowanie bazy danych

1. Wybierz wartości SHA commitów źródła nadrzędnego, do których mają zostać przypięte dane (jedną dla systemu iOS i jedną dla systemu macOS).
2. Zaktualizuj plik `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`, wpisując nowe wartości SHA.
3. Ponownie pobierz pliki JSON przypięte do tych commitów:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Potwierdź, że plik `LICENSE.apple-device-identifiers.txt` nadal odpowiada licencji źródła nadrzędnego; zastąp go, jeśli licencja źródła nadrzędnego uległa zmianie.
5. Sprawdź, czy aplikacja dla systemu macOS kompiluje się bez błędów:

```bash
swift build --package-path apps/macos
```

## Powiązane

- [Node](/pl/nodes)
- [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting)
