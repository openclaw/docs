---
read_when:
    - Vuoi rimuovere OpenClaw da un computer
    - Il servizio Gateway è ancora in esecuzione dopo la disinstallazione
summary: Disinstallare completamente OpenClaw (CLI, servizio, stato, area di lavoro)
title: Disinstallazione
x-i18n:
    generated_at: "2026-07-12T07:12:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Due percorsi:

- **Percorso semplice** se `openclaw` è ancora installato.
- **Rimozione manuale del servizio** se la CLI non è più presente ma il servizio è ancora in esecuzione.

## Percorso semplice (CLI ancora installata)

Consigliato: usa il programma di disinstallazione integrato:

```bash
openclaw uninstall
```

La rimozione dello stato mantiene le directory dell'area di lavoro configurate, a meno che non selezioni anche `--workspace`.

Visualizza in anteprima ciò che verrà rimosso (operazione sicura):

```bash
openclaw uninstall --dry-run --all
```

Modalità non interattiva (automazione / npx). Usala con cautela e solo dopo aver verificato gli ambiti:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flag: `--service`, `--state`, `--workspace`, `--app` selezionano i singoli ambiti; `--all` li seleziona tutti e quattro.

Passaggi manuali (stesso risultato):

1. Arresta il servizio Gateway:

```bash
openclaw gateway stop
```

2. Disinstalla il servizio Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimina stato e configurazione:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se hai impostato `OPENCLAW_CONFIG_PATH` su un percorso personalizzato esterno alla directory dello stato, elimina anche quel file.
Se vuoi conservare un'area di lavoro all'interno della directory dello stato, ad esempio `~/.openclaw/workspace`, spostala altrove prima di eseguire `rm -rf` oppure elimina selettivamente il contenuto dello stato.

4. Elimina la tua area di lavoro (facoltativo, rimuove i file dell'agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Rimuovi l'installazione della CLI (scegli il comando corrispondente al metodo usato):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se hai installato l'app per macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Note:

- Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), ripeti il passaggio 3 per ogni directory dello stato (i valori predefiniti sono `~/.openclaw-<profile>`).
- In modalità remota, la directory dello stato si trova sull'**host del Gateway**, quindi esegui anche lì i passaggi 1-4.

## Rimozione manuale del servizio (CLI non installata)

Usa questa procedura se il servizio Gateway continua a essere eseguito ma `openclaw` non è presente.

### macOS (launchd)

L'etichetta predefinita è `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>` con un profilo):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se hai usato un profilo, sostituisci l'etichetta e il nome del file plist con `ai.openclaw.<profile>`.

### Linux (unità utente systemd)

Il nome predefinito dell'unità è `openclaw-gateway.service` (oppure `openclaw-gateway-<profile>.service`). Un'unità precedente alla ridenominazione, `clawdbot-gateway.service`, potrebbe essere ancora presente nei computer aggiornati da installazioni molto vecchie; `openclaw uninstall` / `openclaw gateway uninstall` la rileva e la rimuove automaticamente.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (attività pianificata)

Il nome predefinito dell'attività è `OpenClaw Gateway` (oppure `OpenClaw Gateway (<profile>)`).
L'attività avvia senza finestra uno script `gateway.vbs` nella directory dello stato, che a sua volta
esegue `gateway.cmd`; rimuovili entrambi.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Se hai usato un profilo, elimina l'attività con il nome corrispondente e i file `gateway.cmd` /
`gateway.vbs` in `~\.openclaw-<profile>`.

## Installazione normale e checkout del codice sorgente

### Installazione normale (install.sh / npm / pnpm / bun)

Se hai usato `https://openclaw.ai/install.sh` o `install.ps1`, la CLI è stata installata con `npm install -g openclaw@latest`.
Rimuovila con `npm rm -g openclaw` (oppure `pnpm remove -g` / `bun remove -g` se hai utilizzato uno di questi metodi).

### Checkout del codice sorgente (git clone)

Se esegui il programma da un checkout del repository (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Disinstalla il servizio Gateway **prima** di eliminare il repository (usa il percorso semplice descritto sopra o la rimozione manuale del servizio).
2. Elimina la directory del repository.
3. Rimuovi lo stato e l'area di lavoro come illustrato sopra.

## Argomenti correlati

- [Panoramica dell'installazione](/it/install)
- [Guida alla migrazione](/it/install/migrating)
