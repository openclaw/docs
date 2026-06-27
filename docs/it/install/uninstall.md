---
read_when:
    - Vuoi rimuovere OpenClaw da una macchina
    - Il servizio Gateway è ancora in esecuzione dopo la disinstallazione
summary: Disinstalla completamente OpenClaw (CLI, servizio, stato, workspace)
title: Disinstallare
x-i18n:
    generated_at: "2026-06-27T17:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Due percorsi:

- **Percorso semplice** se `openclaw` è ancora installato.
- **Rimozione manuale del servizio** se la CLI non c’è più ma il servizio è ancora in esecuzione.

## Percorso semplice (CLI ancora installata)

Consigliato: usa il programma di disinstallazione integrato:

```bash
openclaw uninstall
```

Quando usi la CLI, la rimozione dello stato conserva le directory dell’area di lavoro configurate, a meno che tu non selezioni anche `--workspace`.

Anteprima di ciò che verrà rimosso (sicuro):

```bash
openclaw uninstall --dry-run --all
```

Non interattivo (automazione / npx). Usa con cautela e solo dopo aver confermato gli ambiti:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Passaggi manuali (stesso risultato):

1. Arresta il servizio Gateway:

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
Se vuoi mantenere un’area di lavoro dentro la directory di stato, come `~/.openclaw/workspace`, spostala altrove prima di eseguire `rm -rf` oppure elimina selettivamente i contenuti dello stato.

4. Elimina la tua area di lavoro (opzionale, rimuove i file degli agenti):

```bash
rm -rf ~/.openclaw/workspace
```

5. Rimuovi l’installazione della CLI (scegli quella che hai usato):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se hai installato l’app macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Note:

- Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), ripeti il passaggio 3 per ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
- In modalità remota, la directory di stato si trova sull’**host Gateway**, quindi esegui anche lì i passaggi 1-4.

## Rimozione manuale del servizio (CLI non installata)

Usa questa procedura se il servizio Gateway continua a essere in esecuzione ma `openclaw` è mancante.

### macOS (launchd)

L’etichetta predefinita è `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>`; potrebbero ancora esistere voci legacy `com.openclaw.*`):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se hai usato un profilo, sostituisci l’etichetta e il nome del plist con `ai.openclaw.<profile>`. Rimuovi eventuali plist legacy `com.openclaw.*` se presenti.

### Linux (unità utente systemd)

Il nome dell’unità predefinita è `openclaw-gateway.service` (oppure `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Attività pianificata)

Il nome dell’attività predefinita è `OpenClaw Gateway` (oppure `OpenClaw Gateway (<profile>)`).
Lo script dell’attività si trova sotto la tua directory di stato come `gateway.cmd`; le installazioni correnti possono
anche creare un launcher senza finestra `gateway.vbs`, che Utilità di pianificazione esegue invece
di aprire direttamente `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Se hai usato un profilo, elimina il nome dell’attività corrispondente e i file `gateway.cmd` /
`gateway.vbs` sotto `~\.openclaw-<profile>`.

## Installazione normale rispetto a checkout sorgente

### Installazione normale (install.sh / npm / pnpm / bun)

Se hai usato `https://openclaw.ai/install.sh` o `install.ps1`, la CLI è stata installata con `npm install -g openclaw@latest`.
Rimuovila con `npm rm -g openclaw` (oppure `pnpm remove -g` / `bun remove -g` se l’hai installata in quel modo).

### Checkout sorgente (git clone)

Se esegui da un checkout del repository (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Disinstalla il servizio Gateway **prima** di eliminare il repository (usa il percorso semplice sopra o la rimozione manuale del servizio).
2. Elimina la directory del repository.
3. Rimuovi stato + area di lavoro come mostrato sopra.

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Guida alla migrazione](/it/install/migrating)
