---
read_when:
    - Aggiornamento delle mappature degli identificativi dei modelli dei dispositivi o dei file NOTICE/licenza
    - Modifica del modo in cui l'interfaccia Instances mostra i nomi dei dispositivi
summary: Come OpenClaw include i codici identificativi dei modelli dei dispositivi Apple per mostrare nomi leggibili nell'app macOS.
title: Database dei modelli dei dispositivi
x-i18n:
    generated_at: "2026-04-05T14:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Database dei modelli dei dispositivi (nomi leggibili)

L'app companion macOS mostra nomi leggibili dei modelli dei dispositivi Apple nell'interfaccia **Instances** mappando gli identificativi dei modelli Apple (ad esempio `iPad16,6`, `Mac16,6`) a nomi leggibili.

La mappatura è inclusa come JSON in:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Sorgente dei dati

Attualmente includiamo la mappatura dal repository con licenza MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Per mantenere build deterministiche, i file JSON sono fissati a commit upstream specifici (registrati in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Aggiornamento del database

1. Scegli i commit upstream che vuoi fissare (uno per iOS, uno per macOS).
2. Aggiorna gli hash dei commit in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Scarica di nuovo i file JSON, fissandoli a quei commit:

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
