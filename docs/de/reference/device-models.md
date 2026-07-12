---
read_when:
    - Zuordnungen von Gerätemodellkennungen oder NOTICE-/Lizenzdateien aktualisieren
    - Ändern der Anzeige von Gerätenamen in der Instanzen-Benutzeroberfläche
summary: Wie OpenClaw Apple-Gerätemodellkennungen für benutzerfreundliche Namen in der macOS-App einbindet.
title: Gerätemodell-Datenbank
x-i18n:
    generated_at: "2026-07-12T15:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Die **Instanzen**-Benutzeroberfläche der macOS-Begleit-App ordnet Apple-Modellkennungen benutzerfreundlichen Namen zu (`iPad16,6` -> „iPad Pro 13 Zoll (M4)“, `Mac16,6` -> „MacBook Pro (14 Zoll, 2024)“). `DeviceModelCatalog` verwendet außerdem das Kennungspräfix (mit Rückgriff auf die Gerätefamilie), um für jedes Gerät ein SF Symbol auszuwählen.

Dateien in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Datei                                  | Zweck                                    |
| -------------------------------------- | ---------------------------------------- |
| `ios-device-identifiers.json`          | Zuordnung von iOS-/iPadOS-Kennung zu Name |
| `mac-device-identifiers.json`          | Zuordnung von Mac-Kennung zu Name         |
| `NOTICE.md`                            | Angeheftete Upstream-Commit-SHAs           |
| `LICENSE.apple-device-identifiers.txt` | Upstream-MIT-Lizenz                        |

## Datenquelle

Aus dem MIT-lizenzierten GitHub-Repository `kyle-seongwoo-jun/apple-device-identifiers` übernommen. Die JSON-Dateien sind an die in `NOTICE.md` verzeichneten Commit-SHAs angeheftet, damit Builds deterministisch bleiben.

## Datenbank aktualisieren

1. Wählen Sie die anzuheftenden Upstream-Commit-SHAs aus (eine für iOS, eine für macOS).
2. Aktualisieren Sie `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` mit den neuen SHAs.
3. Laden Sie die an diese Commits angehefteten JSON-Dateien erneut herunter:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Vergewissern Sie sich, dass `LICENSE.apple-device-identifiers.txt` weiterhin mit der Upstream-Version übereinstimmt; ersetzen Sie die Datei, falls sich die Upstream-Lizenz geändert hat.
5. Prüfen Sie, ob die macOS-App fehlerfrei gebaut wird:

```bash
swift build --package-path apps/macos
```

## Verwandte Themen

- [Nodes](/de/nodes)
- [Fehlerbehebung für Nodes](/de/nodes/troubleshooting)
