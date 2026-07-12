---
read_when:
    - Toewijzingen van apparaatmodel-ID's of NOTICE-/licentiebestanden bijwerken
    - Wijzigen hoe de gebruikersinterface Instances apparaatnamen weergeeft
summary: Hoe OpenClaw Apple-apparaatmodel-ID's opneemt voor gebruiksvriendelijke namen in de macOS-app.
title: Database met apparaatmodellen
x-i18n:
    generated_at: "2026-07-12T09:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

De gebruikersinterface **Instanties** van de bijbehorende macOS-app koppelt Apple-model-ID's aan begrijpelijke namen (`iPad16,6` -> "iPad Pro 13-inch (M4)", `Mac16,6` -> "MacBook Pro (14-inch, 2024)"). `DeviceModelCatalog` gebruikt ook het voorvoegsel van de ID (met de apparaatfamilie als terugvaloptie) om per apparaat een SF Symbol te kiezen.

Bestanden in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Bestand                                | Doel                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | Toewijzing van iOS-/iPadOS-ID aan naam |
| `mac-device-identifiers.json`          | Toewijzing van Mac-ID aan naam         |
| `NOTICE.md`                            | Vastgezette upstream-commit-SHA's      |
| `LICENSE.apple-device-identifiers.txt` | Upstream-MIT-licentie                  |

## Gegevensbron

Overgenomen uit de GitHub-repository `kyle-seongwoo-jun/apple-device-identifiers`, die onder de MIT-licentie valt. De JSON-bestanden zijn vastgezet op de commit-SHA's die in `NOTICE.md` zijn vastgelegd, zodat builds deterministisch blijven.

## De database bijwerken

1. Kies de upstream-commit-SHA's waarop u wilt vastzetten (één voor iOS en één voor macOS).
2. Werk `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` bij met de nieuwe SHA's.
3. Download de JSON-bestanden die op deze commits zijn vastgezet opnieuw:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Controleer of `LICENSE.apple-device-identifiers.txt` nog steeds overeenkomt met upstream; vervang het bestand als de upstream-licentie is gewijzigd.
5. Controleer of de macOS-app zonder fouten wordt gebouwd:

```bash
swift build --package-path apps/macos
```

## Gerelateerd

- [Nodes](/nl/nodes)
- [Problemen met Nodes oplossen](/nl/nodes/troubleshooting)
