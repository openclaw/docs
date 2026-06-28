---
read_when:
    - Aggiornamento delle mappature degli identificatori di modello dei dispositivi o dei file NOTICE/licenza
    - Modifica del modo in cui l'interfaccia Instances mostra i nomi dei dispositivi
summary: Come OpenClaw include i vendor degli identificatori di modello dei dispositivi Apple per ottenere nomi leggibili nell'app macOS.
title: Database dei modelli dei dispositivi
x-i18n:
    generated_at: "2026-04-25T13:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
    postprocess_version: locale-links-v1
---

L'app companion macOS mostra nomi leggibili dei modelli dei dispositivi Apple nell'interfaccia **Instances** mappando gli identificatori di modello Apple (ad esempio `iPad16,6`, `Mac16,6`) a nomi comprensibili.

La mappatura è inclusa come JSON sotto:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Sorgente dati

Attualmente includiamo come vendor la mappatura dal repository con licenza MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Per mantenere le build deterministiche, i file JSON sono fissati a commit upstream specifici (registrati in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Aggiornamento del database

1. Scegli i commit upstream che vuoi fissare (uno per iOS, uno per macOS).
2. Aggiorna gli hash dei commit in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Riscarica i file JSON, fissati a quei commit:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Assicurati che `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` corrisponda ancora all'upstream (sostituiscilo se la licenza upstream cambia).
5. Verifica che l'app macOS venga compilata correttamente (senza avvisi):

```bash
swift build --package-path apps/macos
```

## Correlati

- [Node](/it/nodes)
- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
