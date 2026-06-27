---
read_when:
    - Distribuire OpenClaw su Upstash Box
    - Vuoi un ambiente Linux gestito per OpenClaw con accesso alla dashboard tramite tunnel SSH
summary: Ospita OpenClaw su Upstash Box con keep-alive e accesso tramite tunnel SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T17:41:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su Upstash Box, un ambiente Linux gestito
con supporto del ciclo di vita keep-alive.

Usa un tunnel SSH per l'accesso al dashboard. Non esporre direttamente la porta del Gateway
a Internet pubblico.

## Prerequisiti

- Account Upstash
- Upstash Box keep-alive
- Client SSH sulla tua macchina locale

## Creare un Box

Crea un Box keep-alive nella Console Upstash. Prendi nota dell'ID del Box, ad esempio
`right-flamingo-14486`, e della chiave API del tuo Box.

Upstash mantiene la procedura dettagliata corrente per OpenClaw Box in
[Configurazione di OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Connettersi con un tunnel SSH

Inoltra la porta del dashboard OpenClaw alla tua macchina locale. Usa la chiave API del tuo Box
come password SSH quando richiesto:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Le opzioni keepalive riducono le interruzioni del tunnel inattivo durante l'onboarding.

## Installare OpenClaw

All'interno del Box:

```bash
sudo npm install -g openclaw
```

## Eseguire l'onboarding

```bash
openclaw onboard --install-daemon
```

Segui le istruzioni. Copia l'URL del dashboard e il token al termine dell'onboarding.

## Avviare il Gateway

Configura il Gateway per la rete del Box e avvialo in background:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Con il tunnel SSH attivo, apri localmente l'URL del dashboard:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Riavvio automatico

Imposta questo comando come script di inizializzazione del Box, in modo che il Gateway si riavvii quando il Box
si avvia:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Risoluzione dei problemi

Se SSH si blocca durante l'onboarding, riconnettiti con una configurazione SSH pulita e
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Questo evita impostazioni locali `~/.ssh/config` obsolete e mantiene attivo il tunnel
durante periodi di inattività della rete.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Sicurezza del Gateway](/it/gateway/security)
- [Aggiornare OpenClaw](/it/install/updating)
