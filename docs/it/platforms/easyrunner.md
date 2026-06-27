---
read_when:
    - Distribuzione di OpenClaw su EasyRunner
    - Eseguire il Gateway dietro il proxy Caddy di EasyRunner
    - Scegliere volumi persistenti e autenticazione per un Gateway ospitato
summary: Esegui il Gateway OpenClaw su EasyRunner con Podman e Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner può ospitare il Gateway di OpenClaw come una piccola app containerizzata dietro il suo
proxy Caddy. Questa guida presuppone un host EasyRunner che esegue app Compose
compatibili con Podman ed espone HTTPS tramite Caddy.

## Prima di iniziare

- Un server EasyRunner con un dominio instradato verso di esso.
- Un'immagine container OpenClaw compilata o pubblicata.
- Un volume di configurazione persistente per `/home/node/.openclaw`.
- Un volume workspace persistente per `/workspace`.
- Un token o una password Gateway robusti.

Mantieni l'autenticazione del dispositivo abilitata quando possibile. Se il tuo deployment con reverse proxy non può
trasportare correttamente l'identità del dispositivo, correggi prima le impostazioni dei proxy attendibili; usa
bypass di autenticazione pericolosi solo per una rete completamente privata e controllata dall'operatore.

## App Compose

Crea un'app EasyRunner con un file Compose strutturato così:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Sostituisci `openclaw.example.com` con il nome host del tuo Gateway. Archivia
`OPENCLAW_GATEWAY_TOKEN` nel gestore di segreti/ambiente di EasyRunner invece di
committarlo nella definizione dell'app.

## Configura OpenClaw

All'interno del volume di configurazione persistente, mantieni il Gateway raggiungibile solo tramite
il proxy e richiedi l'autenticazione:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Se Caddy termina TLS per il Gateway, configura le impostazioni dei proxy attendibili per
il percorso proxy esatto invece di disabilitare globalmente i controlli di autenticazione. Vedi
[Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

## Verifica

Dalla tua workstation:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Dall'host EasyRunner, controlla nei log dell'app la presenza di un Gateway in ascolto e l'assenza di
errori di avvio relativi a SecretRef, plugin o autenticazione dei canali.

## Aggiornamenti e backup

- Scarica o compila la nuova immagine OpenClaw, quindi ridistribuisci l'app EasyRunner.
- Esegui il backup del volume `openclaw-config` prima degli aggiornamenti.
- Esegui il backup di `openclaw-workspace` se gli agenti vi scrivono dati di progetto duraturi.
- Esegui `openclaw doctor` dopo aggiornamenti importanti per rilevare migrazioni della configurazione e
  avvisi di servizio.

## Risoluzione dei problemi

- `gateway probe` non riesce a connettersi: conferma che il nome host Caddy punti all'app
  e che il container ascolti su `0.0.0.0:1455`.
- L'autenticazione non riesce: ruota insieme il token nei segreti EasyRunner e il comando
  del client locale.
- I file appartengono a root dopo il ripristino: ripara i volumi montati in modo che l'utente del
  container possa scrivere in `/home/node/.openclaw` e `/workspace`.
- I plugin browser o di canale non funzionano: controlla che i binari esterni richiesti,
  l'egress di rete e le credenziali montate siano disponibili all'interno del
  container.
