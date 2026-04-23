---
read_when:
    - Cerchi lo stato dell'app complementare Linux
    - Pianificazione della copertura della piattaforma o dei contributi
    - Debug di OOM kill Linux o exit 137 su un VPS o in un container
summary: Supporto Linux + stato dell'app complementare
title: App Linux
x-i18n:
    generated_at: "2026-04-23T08:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# App Linux

Il Gateway è completamente supportato su Linux. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway (bug di WhatsApp/Telegram).

Sono previste app complementari native per Linux. I contributi sono benvenuti se vuoi aiutare a svilupparne una.

## Percorso rapido per principianti (VPS)

1. Installa Node 24 (consigliato; Node 22 LTS, attualmente `22.14+`, funziona ancora per compatibilità)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dal tuo laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Apri `http://127.0.0.1:18789/` e autenticati con il segreto condiviso configurato (token per impostazione predefinita; password se hai impostato `gateway.auth.mode: "password"`)

Guida completa al server Linux: [Server Linux](/it/vps). Esempio VPS passo per passo: [exe.dev](/it/install/exe-dev)

## Installazione

- [Per iniziare](/it/start/getting-started)
- [Installazione e aggiornamenti](/it/install/updating)
- Flussi opzionali: [Bun (sperimentale)](/it/install/bun), [Nix](/it/install/nix), [Docker](/it/install/docker)

## Gateway

- [Runbook del Gateway](/it/gateway)
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

Riparare/migrare:

```
openclaw doctor
```

## Controllo del sistema (unità utente systemd)

OpenClaw installa per impostazione predefinita un servizio utente systemd. Usa un servizio di **sistema**
per server condivisi o sempre attivi. `openclaw gateway install` e
`openclaw onboard --install-daemon` generano già per te l'unità canonica
corrente; scrivine una a mano solo quando ti serve una configurazione personalizzata del sistema/service manager.
Le linee guida complete sul servizio si trovano nel [Runbook del Gateway](/it/gateway).

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Abilitalo:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressione sulla memoria e OOM kill

Su Linux, il kernel sceglie una vittima OOM quando un cgroup di host, VM o container
esaurisce la memoria. Il Gateway può essere una vittima sfavorevole perché possiede sessioni
di lunga durata e connessioni ai canali. OpenClaw quindi, quando possibile, favorisce l'uccisione dei
processi figli transitori prima del Gateway.

Per i processi figli Linux idonei, OpenClaw avvia il figlio tramite un breve
wrapper `/bin/sh` che alza `oom_score_adj` del figlio a `1000`, quindi
esegue `exec` del comando reale. Questa è un'operazione senza privilegi perché il figlio
sta solo aumentando la propria probabilità di essere terminato per OOM.

Le superfici dei processi figli coperte includono:

- processi figli di comando gestiti dal supervisore,
- processi figli shell PTY,
- processi figli di server MCP stdio,
- processi browser/Chrome avviati da OpenClaw.

Il wrapper è solo per Linux e viene saltato quando `/bin/sh` non è disponibile. Viene
saltato anche se l'env del figlio imposta `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oppure `off`.

Per verificare un processo figlio:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Il valore previsto per i processi figli coperti è `1000`. Il processo Gateway dovrebbe mantenere
il suo punteggio normale, di solito `0`.

Questo non sostituisce la normale ottimizzazione della memoria. Se un VPS o un container continua
a terminare i processi figli, aumenta il limite di memoria, riduci la concorrenza o aggiungi controlli di risorse più rigorosi come `MemoryMax=` di systemd o limiti di memoria a livello di container.
