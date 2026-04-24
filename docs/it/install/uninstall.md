---
read_when:
    - Vuoi rimuovere OpenClaw da una macchina
    - Il servizio Gateway è ancora in esecuzione dopo la disinstallazione
summary: Disinstallare completamente OpenClaw (CLI, servizio, stato, workspace)
title: Disinstallazione
x-i18n:
    generated_at: "2026-04-24T08:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Due percorsi:

- **Percorso semplice** se `openclaw` è ancora installato.
- **Rimozione manuale del servizio** se la CLI non c'è più ma il servizio è ancora in esecuzione.

## Percorso semplice (CLI ancora installata)

Consigliato: usa il disinstallatore integrato:

```bash
openclaw uninstall
```

Non interattivo (automazione / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Passaggi manuali (stesso risultato):

1. Ferma il servizio Gateway:

```bash
openclaw gateway stop
```

2. Disinstalla il servizio Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimina stato + configurazione:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se hai impostato `OPENCLAW_CONFIG_PATH` su una posizione personalizzata fuori dalla directory di stato, elimina anche quel file.

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
- In modalità remota, la directory di stato si trova sull'**host del gateway**, quindi esegui lì anche i passaggi 1-4.

## Rimozione manuale del servizio (CLI non installata)

Usa questo percorso se il servizio gateway continua a essere in esecuzione ma `openclaw` manca.

### macOS (launchd)

La label predefinita è `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>`; i vecchi `com.openclaw.*` potrebbero ancora esistere):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se hai usato un profilo, sostituisci label e nome plist con `ai.openclaw.<profile>`. Rimuovi eventuali plist legacy `com.openclaw.*` se presenti.

### Linux (unità utente systemd)

Il nome unità predefinito è `openclaw-gateway.service` (oppure `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Attività pianificata)

Il nome attività predefinito è `OpenClaw Gateway` (oppure `OpenClaw Gateway (<profile>)`).
Lo script dell'attività si trova nella tua directory di stato.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Se hai usato un profilo, elimina il nome attività corrispondente e `~\.openclaw-<profile>\gateway.cmd`.

## Installazione normale vs checkout del sorgente

### Installazione normale (install.sh / npm / pnpm / bun)

Se hai usato `https://openclaw.ai/install.sh` o `install.ps1`, la CLI è stata installata con `npm install -g openclaw@latest`.
Rimuovila con `npm rm -g openclaw` (oppure `pnpm remove -g` / `bun remove -g` se hai installato in quel modo).

### Checkout del sorgente (git clone)

Se esegui da un checkout del repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Disinstalla il servizio Gateway **prima** di eliminare il repo (usa il percorso semplice sopra o la rimozione manuale del servizio).
2. Elimina la directory del repo.
3. Rimuovi stato + workspace come mostrato sopra.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Guida alla migrazione](/it/install/migrating)
