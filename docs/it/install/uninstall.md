---
read_when:
    - Vuoi rimuovere OpenClaw da una macchina
    - Il servizio gateway è ancora in esecuzione dopo la disinstallazione
summary: Disinstallare completamente OpenClaw (CLI, servizio, stato, workspace)
title: Disinstallazione
x-i18n:
    generated_at: "2026-04-05T13:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Disinstallazione

Due percorsi:

- **Percorso semplice** se `openclaw` è ancora installato.
- **Rimozione manuale del servizio** se la CLI non c'è più ma il servizio è ancora in esecuzione.

## Percorso semplice (CLI ancora installata)

Consigliato: usa il programma di disinstallazione integrato:

```bash
openclaw uninstall
```

Non interattivo (automazione / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Passaggi manuali (stesso risultato):

1. Arresta il servizio gateway:

```bash
openclaw gateway stop
```

2. Disinstalla il servizio gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimina stato + configurazione:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se hai impostato `OPENCLAW_CONFIG_PATH` su una posizione personalizzata esterna alla directory di stato, elimina anche quel file.

4. Elimina il tuo workspace (facoltativo, rimuove i file dell'agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Rimuovi l'installazione della CLI (scegli quella che hai usato):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se hai installato l'app macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Note:

- Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), ripeti il passaggio 3 per ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
- In modalità remota, la directory di stato si trova sull'**host del gateway**, quindi esegui i passaggi 1-4 anche lì.

## Rimozione manuale del servizio (CLI non installata)

Usa questa procedura se il servizio gateway continua a essere in esecuzione ma `openclaw` non è presente.

### macOS (launchd)

L'etichetta predefinita è `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>`; il legacy `com.openclaw.*` potrebbe ancora esistere):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se hai usato un profilo, sostituisci l'etichetta e il nome plist con `ai.openclaw.<profile>`. Rimuovi eventuali plist legacy `com.openclaw.*` se presenti.

### Linux (unità utente systemd)

Il nome predefinito dell'unità è `openclaw-gateway.service` (oppure `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Attività pianificata)

Il nome predefinito dell'attività è `OpenClaw Gateway` (oppure `OpenClaw Gateway (<profile>)`).
Lo script dell'attività si trova nella directory di stato.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Se hai usato un profilo, elimina il nome dell'attività corrispondente e `~\.openclaw-<profile>\gateway.cmd`.

## Installazione normale vs checkout del sorgente

### Installazione normale (install.sh / npm / pnpm / bun)

Se hai usato `https://openclaw.ai/install.sh` o `install.ps1`, la CLI è stata installata con `npm install -g openclaw@latest`.
Rimuovila con `npm rm -g openclaw` (oppure `pnpm remove -g` / `bun remove -g` se l'hai installata in quel modo).

### Checkout del sorgente (git clone)

Se esegui da un checkout del repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Disinstalla il servizio gateway **prima** di eliminare il repo (usa il percorso semplice sopra o la rimozione manuale del servizio).
2. Elimina la directory del repo.
3. Rimuovi stato + workspace come mostrato sopra.
