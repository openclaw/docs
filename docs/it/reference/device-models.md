---
read_when:
    - Aggiornamento delle mappature degli identificatori dei modelli di dispositivo o dei file NOTICE/licenza
    - Modifica di come l'interfaccia Instances visualizza i nomi dei dispositivi
summary: Come OpenClaw include gli identificatori dei modelli dei dispositivi Apple per nomi leggibili nell'app macOS.
title: Database dei modelli di dispositivo
x-i18n:
    generated_at: "2026-04-24T09:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Database dei modelli di dispositivo (nomi leggibili)

L'app companion macOS mostra nomi leggibili dei modelli di dispositivi Apple nell'interfaccia **Instances** mappando gli identificatori dei modelli Apple (ad esempio `iPad16,6`, `Mac16,6`) in nomi comprensibili.

La mappatura è inclusa come JSON in:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Fonte dei dati

Attualmente includiamo la mappatura dal repository con licenza MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Per mantenere build deterministiche, i file JSON sono fissati a specifici commit upstream (registrati in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Aggiornare il database

1. Scegli i commit upstream che vuoi fissare (uno per iOS, uno per macOS).
2. Aggiorna gli hash dei commit in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Scarica di nuovo i file JSON, fissandoli a quei commit:

```bash
IOS_COMMIT="<commit sha per ios-device-identifiers.json>"
MAC_COMMIT="<commit sha per mac-device-identifiers.json>"

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

- [Nodes](/it/nodes)
- [Node troubleshooting](/it/nodes/troubleshooting)
