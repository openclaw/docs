---
read_when:
    - Cerchi lo stato dell’app companion Linux
    - Pianificare copertura di piattaforma o contributi
    - Eseguire il debug di OOM kill Linux o exit 137 su un VPS o in un container
summary: Supporto Linux + stato dell’app companion
title: App Linux
x-i18n:
    generated_at: "2026-04-24T08:49:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Il Gateway è pienamente supportato su Linux. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway (bug con WhatsApp/Telegram).

Sono previste app companion Linux native. I contributi sono benvenuti se vuoi aiutare a svilupparne una.

## Percorso rapido per principianti (VPS)

1. Installa Node 24 (consigliato; Node 22 LTS, attualmente `22.14+`, funziona ancora per compatibilità)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dal tuo laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Apri `http://127.0.0.1:18789/` e autenticati con il segreto condiviso configurato (token per impostazione predefinita; password se hai impostato `gateway.auth.mode: "password"`)

Guida completa per server Linux: [Linux Server](/it/vps). Esempio VPS passo per passo: [exe.dev](/it/install/exe-dev)

## Installazione

- [Getting Started](/it/start/getting-started)
- [Install & updates](/it/install/updating)
- Flussi opzionali: [Bun (sperimentale)](/it/install/bun), [Nix](/it/install/nix), [Docker](/it/install/docker)

## Gateway

- [Runbook del Gateway](/it/gateway)
- [Configuration](/it/gateway/configuration)

## Installazione del servizio Gateway (CLI)

Usa una di queste opzioni:

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

Quando richiesto, seleziona **Gateway service**.

Riparazione/migrazione:

```
openclaw doctor
```

## Controllo del sistema (unità utente systemd)

OpenClaw installa per impostazione predefinita un servizio systemd **utente**. Usa un servizio di **sistema**
per server condivisi o sempre attivi. `openclaw gateway install` e
`openclaw onboard --install-daemon` generano già per te l’unità canonica corrente;
scrivine una a mano solo quando ti serve una configurazione personalizzata di sistema/service-manager.
Le indicazioni complete sul servizio si trovano nel [Runbook del Gateway](/it/gateway).

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

Su Linux, il kernel sceglie una vittima OOM quando un host, una VM o un cgroup container
esaurisce la memoria. Il Gateway può essere una vittima sfavorevole perché possiede sessioni di lunga durata
e connessioni ai canali. OpenClaw quindi, quando possibile, orienta i processi figli transitori
a essere uccisi prima del Gateway.

Per gli spawn figli Linux idonei, OpenClaw avvia il figlio tramite un breve
wrapper `/bin/sh` che alza `oom_score_adj` del figlio a `1000`, poi
esegue `exec` del comando reale. Questa è un’operazione senza privilegi perché il figlio
sta solo aumentando la propria probabilità di essere ucciso per OOM.

Le superfici di processi figli coperte includono:

- figli di comandi gestiti dal supervisor,
- figli shell PTY,
- figli di server MCP stdio,
- processi browser/Chrome avviati da OpenClaw.

Il wrapper è solo Linux e viene saltato quando `/bin/sh` non è disponibile. Viene
saltato anche se l’env del figlio imposta `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oppure `off`.

Per verificare un processo figlio:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Il valore atteso per i figli coperti è `1000`. Il processo Gateway dovrebbe mantenere
il suo punteggio normale, di solito `0`.

Questo non sostituisce la normale ottimizzazione della memoria. Se un VPS o un container continua
a uccidere processi figli, aumenta il limite di memoria, riduci la concorrenza oppure aggiungi
controlli di risorse più forti come `MemoryMax=` di systemd o limiti di memoria a livello container.

## Correlati

- [Panoramica installazione](/it/install)
- [Linux server](/it/vps)
- [Raspberry Pi](/it/install/raspberry-pi)
