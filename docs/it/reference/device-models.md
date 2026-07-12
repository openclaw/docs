---
read_when:
    - Aggiornamento delle mappature degli identificatori dei modelli di dispositivo o dei file NOTICE/licenza
    - Modifica della modalità di visualizzazione dei nomi dei dispositivi nell'interfaccia Istanze
summary: Come OpenClaw integra gli identificatori dei modelli dei dispositivi Apple per visualizzare nomi descrittivi nell'app macOS.
title: Database dei modelli di dispositivo
x-i18n:
    generated_at: "2026-07-12T07:27:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

L'interfaccia **Istanze** dell'app complementare per macOS associa gli identificatori dei modelli Apple a nomi intuitivi (`iPad16,6` -> "iPad Pro da 13 pollici (M4)", `Mac16,6` -> "MacBook Pro (14 pollici, 2024)"). `DeviceModelCatalog` usa inoltre il prefisso dell'identificatore (con ripiego sulla famiglia del dispositivo) per scegliere un simbolo SF per ciascun dispositivo.

File in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| File                                   | Scopo                                      |
| -------------------------------------- | ------------------------------------------ |
| `ios-device-identifiers.json`          | Associazione identificatore iOS/iPadOS -> nome |
| `mac-device-identifiers.json`          | Associazione identificatore Mac -> nome    |
| `NOTICE.md`                            | SHA dei commit upstream fissati            |
| `LICENSE.apple-device-identifiers.txt` | Licenza MIT upstream                       |

## Origine dei dati

Inclusi nel progetto dal repository GitHub `kyle-seongwoo-jun/apple-device-identifiers`, distribuito con licenza MIT. I file JSON sono fissati agli SHA dei commit registrati in `NOTICE.md` per mantenere le build deterministiche.

## Aggiornamento del database

1. Scegliere gli SHA dei commit upstream da fissare (uno per iOS e uno per macOS).
2. Aggiornare `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` con i nuovi SHA.
3. Scaricare nuovamente i file JSON fissati a tali commit:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Verificare che `LICENSE.apple-device-identifiers.txt` corrisponda ancora alla versione upstream; sostituirlo se la licenza upstream è cambiata.
5. Verificare che la build dell'app macOS venga completata senza errori:

```bash
swift build --package-path apps/macos
```

## Contenuti correlati

- [Node](/it/nodes)
- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
