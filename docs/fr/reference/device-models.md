---
read_when:
    - Mise à jour des correspondances d’identifiants de modèles d’appareils ou des fichiers NOTICE/de licence
    - Modification de l’affichage des noms d’appareils dans l’interface utilisateur Instances
summary: Comment OpenClaw intègre les identifiants de modèles d’appareils Apple afin d’afficher des noms conviviaux dans l’application macOS.
title: Base de données des modèles d’appareils
x-i18n:
    generated_at: "2026-07-12T03:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

L’interface **Instances** de l’app compagnon macOS associe les identifiants de modèles Apple à des noms explicites (`iPad16,6` -> « iPad Pro 13 pouces (M4) », `Mac16,6` -> « MacBook Pro (14 pouces, 2024) »). `DeviceModelCatalog` utilise également le préfixe de l’identifiant (avec recours à la famille de l’appareil en cas d’échec) pour choisir un symbole SF propre à chaque appareil.

Fichiers dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/` :

| Fichier                                | Rôle                                            |
| -------------------------------------- | ----------------------------------------------- |
| `ios-device-identifiers.json`          | Association identifiant iOS/iPadOS -> nom       |
| `mac-device-identifiers.json`          | Association identifiant Mac -> nom              |
| `NOTICE.md`                            | SHA des commits amont épinglés                   |
| `LICENSE.apple-device-identifiers.txt` | Licence MIT du projet amont                      |

## Source des données

Importés depuis le dépôt GitHub `kyle-seongwoo-jun/apple-device-identifiers`, sous licence MIT. Les fichiers JSON sont épinglés aux SHA de commits consignés dans `NOTICE.md` afin de garantir des builds déterministes.

## Mise à jour de la base de données

1. Choisissez les SHA des commits amont à épingler (un pour iOS, un pour macOS).
2. Mettez à jour `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` avec les nouveaux SHA.
3. Téléchargez à nouveau les fichiers JSON épinglés à ces commits :

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Vérifiez que `LICENSE.apple-device-identifiers.txt` correspond toujours à la version amont ; remplacez-le si la licence amont a changé.
5. Vérifiez que l’app macOS se compile sans erreur :

```bash
swift build --package-path apps/macos
```

## Voir aussi

- [Nodes](/fr/nodes)
- [Dépannage des Nodes](/fr/nodes/troubleshooting)
