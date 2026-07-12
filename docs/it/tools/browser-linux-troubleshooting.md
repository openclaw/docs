---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Risoluzione dei problemi di avvio CDP di Chrome/Brave/Edge/Chromium per il controllo del browser OpenClaw su Linux
title: Risoluzione dei problemi del browser
x-i18n:
    generated_at: "2026-07-12T07:31:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problema: impossibile avviare Chrome CDP sulla porta 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Causa principale

Su Ubuntu e sulla maggior parte delle distribuzioni Linux, `apt install chromium` installa un wrapper snap,
non un browser reale:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Il confinamento AppArmor di snap interferisce con il modo in cui OpenClaw avvia e monitora
il processo del browser.

Altri errori comuni di avvio su Linux:

- `The profile appears to be in use by another Chromium process`: file di blocco
  `Singleton*` obsoleti nella directory del profilo gestito. OpenClaw rimuove
  questi blocchi e riprova una volta quando il blocco fa riferimento a un processo terminato o
  su un host diverso.
- `Missing X server or $DISPLAY`: è stato richiesto esplicitamente un browser visibile
  su un host senza una sessione desktop. Su Linux, i profili gestiti locali passano
  alla modalità headless quando sia `DISPLAY` sia `WAYLAND_DISPLAY` non sono impostati.
  Se hai impostato `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` o
  `browser.profiles.<name>.headless: false`, rimuovi tale impostazione che forza la modalità con interfaccia,
  imposta `OPENCLAW_BROWSER_HEADLESS=1`, avvia `Xvfb`, esegui
  `openclaw browser start --headless` per un singolo avvio gestito oppure esegui
  OpenClaw in una vera sessione desktop.

### Soluzione 1: installare Google Chrome (consigliata)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se sono presenti errori relativi alle dipendenze
```

Aggiorna `~/.openclaw/openclaw.json`:

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

### Soluzione 2: utilizzare Chromium snap in modalità di sola connessione

Se devi mantenere Chromium snap, configura OpenClaw affinché si connetta a un
browser avviato manualmente anziché avviarlo:

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

Avvia Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Facoltativamente, avvialo automaticamente con un servizio utente systemd:

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

```bash
systemctl --user enable --now openclaw-browser.service
```

### Verificare che il browser funzioni

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Riferimento alla configurazione

| Opzione                          | Descrizione                                                                         | Valore predefinito                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `browser.enabled`                | Abilita il controllo del browser                                                    | `true`                                                                       |
| `browser.executablePath`         | Percorso del binario di un browser basato su Chromium (Chrome/Brave/Edge/Chromium) | rilevato automaticamente (preferisce il browser predefinito del sistema operativo se basato su Chromium) |
| `browser.headless`               | Esegui senza interfaccia grafica                                                    | `false`                                                                      |
| `OPENCLAW_BROWSER_HEADLESS`      | Sostituzione per processo della modalità headless del browser gestito locale        | non impostato                                                                |
| `browser.noSandbox`              | Aggiunge il flag `--no-sandbox` (necessario per alcune configurazioni Linux)         | `false`                                                                      |
| `browser.attachOnly`             | Non avvia un browser; si connette soltanto a uno esistente                          | `false`                                                                      |
| `browser.cdpPortRangeStart`      | Porta CDP locale iniziale per i profili assegnati automaticamente                   | `18800` (derivata dalla porta del Gateway)                                   |
| `browser.localLaunchTimeoutMs`   | Timeout per il rilevamento locale di Chrome gestito, fino a `120000`                | `15000`                                                                      |
| `browser.localCdpReadyTimeoutMs` | Timeout di disponibilità CDP dopo l'avvio locale gestito, fino a `120000`           | `8000`                                                                       |

Entrambi i valori di timeout devono essere numeri interi positivi non superiori a `120000` ms; gli altri valori
vengono rifiutati durante il caricamento della configurazione. Su Raspberry Pi, host VPS meno recenti o
sistemi di archiviazione lenti, aumenta `browser.localLaunchTimeoutMs` quando Chrome richiede più tempo per
rendere disponibile il proprio endpoint HTTP CDP. Aumenta `browser.localCdpReadyTimeoutMs` quando
l'avvio riesce ma `openclaw browser start` continua a segnalare `not reachable
after start`.

### Problema: nessuna scheda di Chrome trovata per profile="user"

Stai utilizzando il profilo `user` (`existing-session` / Chrome MCP) e non ci sono
schede aperte a cui connettersi.

Possibili soluzioni:

1. Utilizza invece il browser gestito:
   `openclaw browser --browser-profile openclaw start` (oppure imposta
   `browser.defaultProfile: "openclaw"`).
2. Mantieni Chrome locale in esecuzione con almeno una scheda aperta, quindi riprova con
   `--browser-profile user`.

Note:

- `user` è disponibile solo sull'host. Su server Linux, container o host remoti, preferisci
  invece i profili CDP.
- `user` e gli altri profili `existing-session` condividono gli attuali
  limiti di Chrome MCP: solo azioni basate su riferimenti, un file per caricamento, nessuna sostituzione
  di `timeoutMs` per le finestre di dialogo, nessun `wait --load networkidle` e nessuna azione relativa a `responsebody`, esportazione
  PDF, intercettazione dei download o operazioni in batch.
- I profili locali del driver `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; impostali
  manualmente solo per CDP remoto.
- I profili CDP remoti accettano `http://`, `https://`, `ws://` e `wss://`.
  Utilizza HTTP(S) per il rilevamento tramite `/json/version` oppure WS(S) quando il servizio
  del browser fornisce direttamente l'URL di un socket DevTools.

## Risorse correlate

- [Browser](/it/tools/browser)
- [Accesso al browser](/it/tools/browser-login)
- [Risoluzione dei problemi del CDP remoto del browser in WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
