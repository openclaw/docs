---
read_when:
    - Stai cercando lo stato dell'app complementare per Linux
    - Stai pianificando la copertura delle piattaforme o i contributi
summary: Supporto Linux + stato dell'app complementare
title: App Linux
x-i18n:
    generated_at: "2026-04-05T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# App Linux

Il Gateway è pienamente supportato su Linux. **Node è il runtime consigliato**.
bun non è consigliato per il Gateway (bug di WhatsApp/Telegram).

Sono previste app complementari native per Linux. I contributi sono benvenuti se vuoi aiutare a svilupparne una.

## Percorso rapido per principianti (VPS)

1. Installa Node 24 (consigliato; Node 22 LTS, attualmente `22.14+`, funziona ancora per compatibilità)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dal tuo portatile: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Apri `http://127.0.0.1:18789/` e autenticati con il segreto condiviso configurato (token per impostazione predefinita; password se imposti `gateway.auth.mode: "password"`)

Guida completa al server Linux: [Server Linux](/vps). Esempio VPS passo dopo passo: [exe.dev](/install/exe-dev)

## Installazione

- [Getting Started](/start/getting-started)
- [Installazione e aggiornamenti](/install/updating)
- Flussi facoltativi: [Bun (sperimentale)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Runbook del Gateway](/gateway)
- [Configurazione](/gateway/configuration)

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

Seleziona **Servizio Gateway** quando richiesto.

Riparazione/migrazione:

```
openclaw doctor
```

## Controllo del sistema (unità utente systemd)

OpenClaw installa per impostazione predefinita un servizio systemd **utente**. Usa un servizio **di sistema**
per server condivisi o sempre attivi. `openclaw gateway install` e
`openclaw onboard --install-daemon` generano già per te l'unità canonica attuale;
scrivine una a mano solo quando hai bisogno di una configurazione personalizzata del sistema/service manager.
Le indicazioni complete sul servizio si trovano nel [Runbook del Gateway](/gateway).

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
