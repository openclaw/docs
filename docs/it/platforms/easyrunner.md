---
read_when:
    - Distribuzione di OpenClaw su EasyRunner
    - Esecuzione del Gateway dietro il proxy Caddy di EasyRunner
    - Scelta dei volumi persistenti e dell'autenticazione per un Gateway in hosting
summary: Esegui il Gateway di OpenClaw su EasyRunner con Podman e Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T07:11:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner ospita il Gateway OpenClaw come una piccola applicazione containerizzata dietro il proprio proxy Caddy. Questa guida presuppone un host EasyRunner che esegua applicazioni Compose compatibili con Podman e termini HTTPS tramite Caddy.

## Prima di iniziare

- Un server EasyRunner con un dominio instradato verso di esso.
- L'immagine ufficiale di OpenClaw (`ghcr.io/openclaw/openclaw`) o una compilazione personalizzata.
- Un volume di configurazione persistente per `/home/node/.openclaw`.
- Un volume di area di lavoro persistente per `/home/node/.openclaw/workspace`.
- Un token o una password robusti per il Gateway.

Mantieni abilitata l'autenticazione del dispositivo quando possibile. Se il proxy inverso non riesce a trasmettere correttamente l'identità del dispositivo, correggi prima le impostazioni del proxy attendibile (vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)); usa le esclusioni pericolose dell'autenticazione solo in una rete completamente privata e controllata dall'operatore.

## Applicazione Compose

Crea un'applicazione EasyRunner con un file Compose strutturato come segue:

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Sostituisci `openclaw.example.com` con il nome host del Gateway. Archivia `OPENCLAW_GATEWAY_TOKEN` nel gestore dei segreti o delle variabili d'ambiente di EasyRunner anziché inserirlo nella definizione dell'applicazione. Per impostazione predefinita, l'immagine si associa al local loopback, pertanto l'opzione esplicita `--bind lan --port 1455` in `command` è necessaria affinché Caddy possa raggiungere il container.

## Configurare OpenClaw

All'interno del volume di configurazione persistente, mantieni il Gateway raggiungibile esclusivamente tramite il proxy e richiedi l'autenticazione:

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

Se Caddy termina TLS per il Gateway, configura le impostazioni del proxy attendibile per l'esatto percorso del proxy anziché disabilitare globalmente i controlli di autenticazione. Vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).

## Verifica

Dalla tua postazione di lavoro:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Dall'host EasyRunner, `GET /healthz` (operatività) e `GET /readyz` (disponibilità) non richiedono autenticazione e supportano il controllo di integrità del container integrato nell'immagine. Controlla inoltre nei log dell'applicazione che il Gateway sia in ascolto e che non vi siano errori di avvio relativi a SecretRef, Plugin o autenticazione dei canali.

## Aggiornamenti e backup

- Scarica o compila la nuova immagine di OpenClaw, quindi ridistribuisci l'applicazione EasyRunner.
- Esegui il backup del volume `openclaw-config` prima degli aggiornamenti. Contiene `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` e lo stato dei pacchetti dei Plugin installati.
- Esegui il backup di `openclaw-workspace` se gli agenti vi scrivono dati di progetto persistenti.
- Esegui `openclaw doctor` dopo gli aggiornamenti principali per individuare le migrazioni della configurazione e gli avvisi del servizio.

## Risoluzione dei problemi

- `gateway probe` non riesce a connettersi: verifica che il nome host Caddy punti all'applicazione e che il container sia in ascolto su `0.0.0.0:1455`.
- L'autenticazione non riesce: sostituisci contemporaneamente il token nei segreti di EasyRunner e nel comando del client locale.
- I file appartengono a root dopo il ripristino: l'immagine viene eseguita come `node` (uid 1000); correggi i volumi montati affinché tale utente possa scrivere in `/home/node/.openclaw` e `/home/node/.openclaw/workspace`.
- I Plugin del browser o dei canali non funzionano: verifica che i file binari esterni richiesti, il traffico di rete in uscita e le credenziali montate siano disponibili all'interno del container.
