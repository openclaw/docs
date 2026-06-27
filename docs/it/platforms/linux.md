---
read_when:
    - Ricerca dello stato dell'app complementare per Linux
    - Pianificazione della copertura della piattaforma o dei contributi
    - Debug degli OOM kill di Linux o dell'uscita 137 su un VPS o container
summary: Stato del supporto Linux + app complementare
title: App Linux
x-i18n:
    generated_at: "2026-06-27T17:45:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

OpenClaw Gateway è pienamente supportato su Linux. **Node è il runtime consigliato**.
Bun non è consigliato per Gateway (bug di WhatsApp/Telegram).

Sono previste app companion native per Linux. I contributi sono benvenuti se vuoi aiutare a crearne una.

## Percorso rapido per principianti (VPS)

1. Installa Node 24 (consigliato; Node 22 LTS, attualmente `22.19+`, funziona ancora per compatibilità)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dal tuo laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Apri `http://127.0.0.1:18789/` e autenticati con il segreto condiviso configurato (token per impostazione predefinita; password se hai impostato `gateway.auth.mode: "password"`)

Guida completa al server Linux: [Server Linux](/it/vps). Esempio VPS passo per passo: [exe.dev](/it/install/exe-dev)

## Installazione

- [Introduzione](/it/start/getting-started)
- [Installazione e aggiornamenti](/it/install/updating)
- Flussi facoltativi: [Bun (sperimentale)](/it/install/bun), [Nix](/it/install/nix), [Docker](/it/install/docker)

## Gateway

- [Runbook di Gateway](/it/gateway)
- [Configurazione](/it/gateway/configuration)

## Installazione del servizio Gateway (CLI)

Usa uno di questi:

```
openclaw onboard --install-daemon
```

Oppure:

```
openclaw gateway install
```

Oppure:

```
openclaw configure
```

Seleziona **Servizio Gateway** quando richiesto.

Ripara/migra:

```
openclaw doctor
```

## Controllo di sistema (unità utente systemd)

OpenClaw installa un servizio **utente** systemd per impostazione predefinita. Usa un servizio di **sistema** per server condivisi o sempre attivi. `openclaw gateway install` e
`openclaw onboard --install-daemon` generano già per te l'unità canonica attuale;
scrivine una a mano solo quando ti serve una configurazione system/service-manager
personalizzata. La guida completa al servizio si trova nel [runbook di Gateway](/it/gateway).

Configurazione minima:

Crea `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Abilitala:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressione sulla memoria e terminazioni OOM

Su Linux, il kernel sceglie una vittima OOM quando un cgroup di host, VM o container
esaurisce la memoria. Gateway può essere una cattiva vittima perché possiede
sessioni di lunga durata e connessioni di canale. OpenClaw quindi fa in modo, quando possibile, che i processi figli transitori vengano terminati prima di Gateway.

Per gli avvii di processi figli Linux idonei, OpenClaw avvia il figlio tramite un breve
wrapper `/bin/sh` che porta l'`oom_score_adj` del figlio a `1000`, quindi
esegue con `exec` il comando reale. Questa è un'operazione senza privilegi perché il figlio sta
solo aumentando la propria probabilità di terminazione OOM.

Le superfici dei processi figli coperte includono:

- figli di comandi gestiti dal supervisore,
- figli di shell PTY,
- figli di server stdio MCP,
- processi browser/Chrome avviati da OpenClaw.

Il wrapper è solo per Linux e viene saltato quando `/bin/sh` non è disponibile. Viene
saltato anche se l'ambiente del figlio imposta `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` o `off`.

Per verificare un processo figlio:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Il valore atteso per i figli coperti è `1000`. Il processo Gateway dovrebbe mantenere
il suo punteggio normale, di solito `0`.

L'unità systemd consigliata imposta anche `OOMPolicy=continue`. Questo mantiene
viva l'unità Gateway quando un processo figlio transitorio viene selezionato dall'OOM killer;
il comando/la sessione figlio può non riuscire e segnalare il proprio errore senza che systemd contrassegni
l'intero servizio gateway come non riuscito e riavvii tutti i canali.

Questo non sostituisce la normale regolazione della memoria. Se un VPS o un container termina ripetutamente
i figli, aumenta il limite di memoria, riduci la concorrenza o aggiungi controlli
delle risorse più forti come `MemoryMax=` di systemd o limiti di memoria a livello di container.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Server Linux](/it/vps)
- [Raspberry Pi](/it/install/raspberry-pi)
