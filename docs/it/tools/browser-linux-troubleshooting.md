---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Correggi i problemi di avvio CDP di Chrome/Brave/Edge/Chromium per il controllo browser di OpenClaw su Linux
title: Risoluzione dei problemi del browser
x-i18n:
    generated_at: "2026-04-05T14:05:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del browser (Linux)

## Problema: "Failed to start Chrome CDP on port 18800"

Il server di controllo browser di OpenClaw non riesce ad avviare Chrome/Brave/Edge/Chromium con l'errore:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa principale

Su Ubuntu (e molte distribuzioni Linux), l'installazione predefinita di Chromium è un **pacchetto snap**. Il confinement AppArmor di snap interferisce con il modo in cui OpenClaw avvia e monitora il processo del browser.

Il comando `apt install chromium` installa un pacchetto stub che reindirizza a snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Questo NON è un browser reale: è solo un wrapper.

### Soluzione 1: installare Google Chrome (consigliato)

Installa il pacchetto `.deb` ufficiale di Google Chrome, che non è confinato da snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se ci sono errori di dipendenza
```

Quindi aggiorna la configurazione di OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Soluzione 2: usare Snap Chromium con la modalità solo collegamento

Se devi usare Chromium snap, configura OpenClaw in modo che si colleghi a un browser avviato manualmente:

1. Aggiorna la configurazione:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Avvia Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Facoltativamente crea un servizio utente systemd per avviare automaticamente Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Abilitalo con: `systemctl --user enable --now openclaw-browser.service`

### Verificare che il browser funzioni

Controlla lo stato:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Testa la navigazione:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Riferimento della configurazione

| Opzione                  | Descrizione                                                          | Predefinito                                                 |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Abilita il controllo del browser                                     | `true`                                                      |
| `browser.executablePath` | Percorso di un binario browser basato su Chromium (Chrome/Brave/Edge/Chromium) | rilevato automaticamente (preferisce il browser predefinito se basato su Chromium) |
| `browser.headless`       | Esegue senza GUI                                                     | `false`                                                     |
| `browser.noSandbox`      | Aggiunge il flag `--no-sandbox` (necessario per alcune configurazioni Linux) | `false`                                                     |
| `browser.attachOnly`     | Non avvia il browser, si collega solo a uno esistente                | `false`                                                     |
| `browser.cdpPort`        | Porta Chrome DevTools Protocol                                       | `18800`                                                     |

### Problema: "No Chrome tabs found for profile=\"user\""

Stai usando un profilo `existing-session` / Chrome MCP. OpenClaw riesce a vedere Chrome locale,
ma non ci sono schede aperte disponibili a cui collegarsi.

Opzioni per la correzione:

1. **Usa il browser gestito:** `openclaw browser start --browser-profile openclaw`
   (oppure imposta `browser.defaultProfile: "openclaw"`).
2. **Usa Chrome MCP:** assicurati che Chrome locale sia in esecuzione con almeno una scheda aperta, poi riprova con `--browser-profile user`.

Note:

- `user` è solo host. Per server Linux, container o host remoti, preferisci i profili CDP.
- `user` / altri profili `existing-session` mantengono gli attuali limiti di Chrome MCP:
  azioni basate su ref, hook di upload di un solo file, nessuna sostituzione del timeout delle finestre di dialogo, nessun
  `wait --load networkidle` e nessun `responsebody`, esportazione PDF, intercettazione dei download o azioni batch.
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; impostali solo per CDP remoto.
- I profili CDP remoti accettano `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) per il rilevamento `/json/version`, oppure WS(S) quando il tuo servizio
  browser ti fornisce un URL socket DevTools diretto.
