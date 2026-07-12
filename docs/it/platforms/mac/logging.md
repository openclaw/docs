---
read_when:
    - Acquisizione dei log di macOS o analisi della registrazione di dati privati
    - Debug dei problemi relativi al ciclo di vita dell'attivazione vocale e della sessione
summary: 'Registrazione di OpenClaw: file di log diagnostico a rotazione + flag unificati per la privacy dei log'
title: Registrazione su macOS
x-i18n:
    generated_at: "2026-07-12T07:13:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Registrazione (macOS)

## File di registro diagnostico a rotazione (pannello Debug)

L'app macOS registra gli eventi tramite swift-log (per impostazione predefinita, usando la registrazione unificata) e può anche scrivere un file di registro locale a rotazione per conservarli in modo persistente (`DiagnosticsFileLog`).

- Abilitazione: **Pannello Debug -> Registri -> Registrazione dell'app -> "Scrivi registro diagnostico a rotazione (JSONL)"** (disabilitato per impostazione predefinita).
- Livello di dettaglio: selettore **Pannello Debug -> Registri -> Registrazione dell'app -> Livello di dettaglio**.
- Posizione: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotazione: avviene a 5 MB; vengono conservati fino a 5 backup con suffisso `.1`...`.5` (il più vecchio viene eliminato).
- Cancellazione: **Pannello Debug -> Registri -> Registrazione dell'app -> "Cancella"** elimina il file attivo e tutti i backup.

Considera il file come sensibile; non condividerlo senza averlo esaminato.

## Dati privati nella registrazione unificata su macOS

La registrazione unificata oscura la maggior parte dei payload, a meno che un sottosistema non abiliti `privacy -off`. Questa impostazione è controllata da un plist in `/Library/Preferences/Logging/Subsystems/`, identificato dal nome del sottosistema. Solo le nuove voci di registro recepiscono l'impostazione, quindi abilitala prima di riprodurre un problema. Approfondimento: [particolarità della privacy della registrazione in macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Abilitazione per OpenClaw (`ai.openclaw`)

Scrivi prima il plist in un file temporaneo, quindi installalo atomicamente come root:

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

Non è necessario riavviare; logd rileva rapidamente il file, ma solo le nuove righe di registro includono i payload privati. Visualizza l'output più dettagliato con `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` imposta l'intervallo di tempo, con valore predefinito `5m`; `--category`/`-c` filtra per categoria).

## Disabilitazione dopo il debug

- Rimuovi la sostituzione: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Facoltativamente, esegui `sudo log config --reload` per forzare logd a rimuovere immediatamente la sostituzione.
- Questo registro può includere numeri di telefono e contenuti dei messaggi; mantieni il plist installato solo mentre è effettivamente necessario.

## Argomenti correlati

- [App macOS](/it/platforms/macos)
- [Registrazione del Gateway](/it/gateway/logging)
