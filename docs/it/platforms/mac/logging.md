---
read_when:
    - Stai acquisendo log macOS o analizzando il logging di dati privati
    - Stai eseguendo il debug di problemi relativi a voice wake/ciclo di vita della sessione
summary: 'Logging di OpenClaw: log diagnostico a file con rotazione + flag di privacy del log unificato'
title: Logging macOS
x-i18n:
    generated_at: "2026-04-05T13:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## Log diagnostico a file con rotazione (pannello Debug)

OpenClaw instrada i log dell'app macOS tramite swift-log (logging unificato per impostazione predefinita) e può scrivere su disco un log locale a file con rotazione quando hai bisogno di una cattura persistente.

- Verbosità: **Pannello Debug → Logs → App logging → Verbosity**
- Abilitazione: **Pannello Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Posizione: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (ruota automaticamente; i file vecchi hanno il suffisso `.1`, `.2`, …)
- Cancella: **Pannello Debug → Logs → App logging → “Clear”**

Note:

- Questa funzione è **disattivata per impostazione predefinita**. Abilitala solo mentre stai eseguendo attivamente il debug.
- Tratta il file come sensibile; non condividerlo senza revisione.

## Dati privati nel logging unificato su macOS

Il logging unificato oscura la maggior parte dei payload a meno che un sottosistema non abiliti `privacy -off`. Secondo il post di Peter sulle [stranezze della privacy nel logging](https://steipete.me/posts/2025/logging-privacy-shenanigans) di macOS (2025), questo è controllato da un plist in `/Library/Preferences/Logging/Subsystems/` indicizzato dal nome del sottosistema. Solo le nuove voci di log recepiscono il flag, quindi abilitalo prima di riprodurre un problema.

## Abilitazione per OpenClaw (`ai.openclaw`)

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

- Non è richiesto alcun riavvio; `logd` rileva rapidamente il file, ma solo le nuove righe di log includeranno i payload privati.
- Visualizza l'output più ricco con l'helper esistente, ad esempio `./scripts/clawlog.sh --category WebChat --last 5m`.

## Disabilitazione dopo il debug

- Rimuovi l'override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Facoltativamente esegui `sudo log config --reload` per forzare `logd` a rimuovere immediatamente l'override.
- Ricorda che questa superficie può includere numeri di telefono e corpi dei messaggi; mantieni il plist attivo solo mentre hai effettivamente bisogno del dettaglio aggiuntivo.
