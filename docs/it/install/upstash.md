---
read_when:
    - Distribuzione di OpenClaw su Upstash Box
    - Desideri un ambiente Linux gestito per OpenClaw con accesso alla dashboard tramite tunnel SSH
summary: Ospita OpenClaw su Upstash Box con keep-alive e accesso tramite tunnel SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T07:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su Upstash Box, un ambiente Linux gestito
con supporto del ciclo di vita keep-alive.

Utilizza un tunnel SSH per accedere alla dashboard. Non esporre direttamente la porta del Gateway
a Internet.

## Prerequisiti

- Account Upstash
- Upstash Box con keep-alive
- Client SSH sul computer locale

## Creare una Box

Crea una Box con keep-alive nella console di Upstash. Prendi nota dell'ID della Box (ad esempio
`right-flamingo-14486`) e della chiave API della Box.

Upstash mantiene aggiornata la propria procedura guidata per OpenClaw Box in
[Configurazione di OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Connettersi con un tunnel SSH

Inoltra la porta della dashboard di OpenClaw al computer locale. Utilizza la chiave API della Box
come password SSH quando richiesto:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Le opzioni keep-alive riducono le interruzioni del tunnel dovute all'inattività durante la configurazione iniziale.

## Installare OpenClaw

All'interno della Box:

```bash
sudo npm install -g openclaw
```

## Eseguire la configurazione iniziale

```bash
openclaw onboard --install-daemon
```

Segui le istruzioni. Copia l'URL della dashboard e il token al termine della configurazione iniziale.

## Avviare il Gateway

Configura il Gateway per la rete della Box e avvialo in background:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Con il tunnel SSH attivo, apri localmente l'URL della dashboard:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Riavvio automatico

Imposta questo comando come script di inizializzazione della Box, in modo che il Gateway si riavvii all'avvio della Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Risoluzione dei problemi

Se SSH si blocca durante la configurazione iniziale, riconnettiti con una configurazione SSH pulita e
le opzioni keep-alive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Questo ignora le impostazioni locali obsolete di `~/.ssh/config` e mantiene attivo il tunnel
durante i periodi di inattività della rete.

## Contenuti correlati

- [Accesso remoto](/it/gateway/remote)
- [Sicurezza del Gateway](/it/gateway/security)
- [Aggiornamento di OpenClaw](/it/install/updating)
