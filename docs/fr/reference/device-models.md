---
read_when:
    - Mettre à jour les correspondances d’identifiants de modèles d’appareils ou les fichiers NOTICE/licence
    - Modification de la façon dont l’interface utilisateur des Instances affiche les noms des appareils
summary: Comment OpenClaw intègre les identifiants de modèles d’appareils Apple pour fournir des noms conviviaux dans l’application macOS.
title: Base de données des modèles d’appareils
x-i18n:
    generated_at: "2026-04-25T13:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
---

L’application compagnon macOS affiche des noms de modèles d’appareils Apple conviviaux dans l’interface utilisateur **Instances** en faisant correspondre les identifiants de modèle Apple (par ex. `iPad16,6`, `Mac16,6`) à des noms lisibles par l’humain.

Le mappage est intégré sous forme de JSON dans :

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Source de données

Nous intégrons actuellement le mappage depuis le dépôt sous licence MIT suivant :

- `kyle-seongwoo-jun/apple-device-identifiers`

Pour garantir des builds déterministes, les fichiers JSON sont épinglés à des commits upstream spécifiques (enregistrés dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Mise à jour de la base de données

1. Choisissez les commits upstream que vous souhaitez épingler (un pour iOS, un pour macOS).
2. Mettez à jour les hachages de commit dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Téléchargez à nouveau les fichiers JSON, épinglés à ces commits :

```bash
IOS_COMMIT="<sha de commit pour ios-device-identifiers.json>"
MAC_COMMIT="<sha de commit pour mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Assurez-vous que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` correspond toujours à la version upstream (remplacez-le si la licence upstream change).
5. Vérifiez que l’application macOS se compile correctement (sans avertissements) :

```bash
swift build --package-path apps/macos
```

## Lié

- [Nœuds](/fr/nodes)
- [Dépannage des nœuds](/fr/nodes/troubleshooting)
