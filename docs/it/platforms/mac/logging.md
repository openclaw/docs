---
read_when:
    - Acquisizione dei log macOS o analisi della registrazione di dati privati
    - Debug dei problemi del ciclo di vita di attivazione/sessione vocale
summary: 'Logging di OpenClaw: file di diagnostica rotante + flag di privacy del log unificato'
title: Logging macOS
x-i18n:
    generated_at: "2026-04-24T08:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## File di log diagnostico rotante (pannello Debug)

OpenClaw instrada i log dell'app macOS tramite swift-log (logging unificato per impostazione predefinita) e può scrivere un file di log locale e rotante su disco quando ti serve una cattura durevole.

- Verbosità: **Pannello Debug → Logs → App logging → Verbosity**
- Abilita: **Pannello Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Posizione: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (ruota automaticamente; i file vecchi hanno suffissi `.1`, `.2`, …)
- Cancella: **Pannello Debug → Logs → App logging → “Clear”**

Note:

- È **disattivato per impostazione predefinita**. Abilitalo solo durante un debug attivo.
- Tratta il file come sensibile; non condividerlo senza revisione.

## Dati privati nel logging unificato su macOS

Il logging unificato oscura la maggior parte dei payload a meno che un sottosistema non attivi `privacy -off`. Secondo l'articolo di Peter su macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), questo è controllato da un plist in `/Library/Preferences/Logging/Subsystems/` indicizzato dal nome del sottosistema. Solo le nuove voci di log recepiscono il flag, quindi abilitalo prima di riprodurre un problema.

## Abilitare per OpenClaw (`ai.openclaw`)

- Scrivi prima il plist in un file temporaneo, poi installalo atomicamente come root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Non è richiesto alcun riavvio; `logd` rileva rapidamente il file, ma solo le nuove righe di log includeranno payload privati.
- Visualizza l'output più ricco con l'helper esistente, ad esempio `./scripts/clawlog.sh --category WebChat --last 5m`.

## Disabilitare dopo il debug

- Rimuovi l'override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Facoltativamente esegui `sudo log config --reload` per forzare `logd` a rimuovere immediatamente l'override.
- Ricorda che questa superficie può includere numeri di telefono e corpi dei messaggi; mantieni il plist attivo solo mentre ti serve davvero il livello di dettaglio aggiuntivo.

## Correlati

- [App macOS](/it/platforms/macos)
- [Logging del Gateway](/it/gateway/logging)
