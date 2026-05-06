---
read_when:
    - Acquisizione dei log di macOS o analisi della registrazione nei log di dati privati
    - Risoluzione dei problemi del ciclo di vita del risveglio vocale/sessione
summary: 'Logging di OpenClaw: file di log diagnostico a rotazione + flag di privacy per il log unificato'
title: Registrazione dei log di macOS
x-i18n:
    generated_at: "2026-05-06T09:00:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Logging (macOS)

## Log diagnostico su file a rotazione (pannello Debug)

OpenClaw instrada i log dell'app macOS tramite swift-log (logging unificato per impostazione predefinita) e può scrivere su disco un log locale su file, con rotazione, quando serve un'acquisizione persistente.

- Verbosità: **pannello Debug → Log → Logging dell'app → Verbosità**
- Abilita: **pannello Debug → Log → Logging dell'app → "Scrivi log diagnostico a rotazione (JSONL)"**
- Posizione: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (ruota automaticamente; i file vecchi hanno suffissi `.1`, `.2`, …)
- Cancella: **pannello Debug → Log → Logging dell'app → "Cancella"**

Note:

- È **disattivato per impostazione predefinita**. Abilitalo solo durante il debug attivo.
- Tratta il file come sensibile; non condividerlo senza revisione.

## Dati privati del logging unificato su macOS

Il logging unificato redige la maggior parte dei payload a meno che un sottosistema non attivi `privacy -off`. Secondo l'articolo di Peter sulle [bizzarrie della privacy del logging](https://steipete.me/posts/2025/logging-privacy-shenanigans) su macOS (2025), questa impostazione è controllata da un plist in `/Library/Preferences/Logging/Subsystems/` indicizzato per nome del sottosistema. Solo le nuove voci di log recepiscono il flag, quindi abilitalo prima di riprodurre un problema.

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

- Non è richiesto alcun riavvio; logd rileva rapidamente il file, ma solo le nuove righe di log includeranno i payload privati.
- Visualizza l'output più ricco con l'helper esistente, ad esempio `./scripts/clawlog.sh --category WebChat --last 5m`.

## Disabilitare dopo il debug

- Rimuovi l'override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Facoltativamente esegui `sudo log config --reload` per forzare logd a scartare subito l'override.
- Ricorda che questa superficie può includere numeri di telefono e corpi dei messaggi; lascia il plist in posizione solo mentre hai attivamente bisogno del dettaglio aggiuntivo.

## Correlati

- [app macOS](/it/platforms/macos)
- [Logging del Gateway](/it/gateway/logging)
