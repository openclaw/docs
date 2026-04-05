---
read_when:
    - Vuoi un host Linux economico sempre attivo per il Gateway
    - Vuoi accesso remoto alla Control UI senza gestire un tuo VPS
summary: Esegui OpenClaw Gateway su exe.dev (VM + proxy HTTPS) per l'accesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T13:55:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Obiettivo: OpenClaw Gateway in esecuzione su una VM exe.dev, raggiungibile dal tuo laptop tramite: `https://<vm-name>.exe.xyz`

Questa pagina presume l'immagine predefinita **exeuntu** di exe.dev. Se hai scelto una distribuzione diversa, adatta di conseguenza i pacchetti.

## Percorso rapido per principianti

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Inserisci la tua chiave/token di autenticazione secondo necessità
3. Fai clic su "Agent" accanto alla tua VM e attendi che Shelley completi il provisioning
4. Apri `https://<vm-name>.exe.xyz/` e autenticati con il segreto condiviso configurato (questa guida usa l'autenticazione con token per impostazione predefinita, ma funziona anche l'autenticazione con password se cambi `gateway.auth.mode`)
5. Approva eventuali richieste di pairing del dispositivo in sospeso con `openclaw devices approve <requestId>`

## Cosa ti serve

- Account exe.dev
- accesso `ssh exe.dev` alle macchine virtuali di [exe.dev](https://exe.dev) (facoltativo)

## Installazione automatizzata con Shelley

Shelley, l'agente di [exe.dev](https://exe.dev), può installare OpenClaw istantaneamente con il nostro
prompt. Il prompt usato è il seguente:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Installazione manuale

## 1) Crea la VM

Dal tuo dispositivo:

```bash
ssh exe.dev new
```

Poi connettiti:

```bash
ssh <vm-name>.exe.xyz
```

Suggerimento: mantieni questa VM **stateful**. OpenClaw archivia `openclaw.json`, per agente
`auth-profiles.json`, sessioni e stato di canali/provider sotto
`~/.openclaw/`, oltre al workspace sotto `~/.openclaw/workspace/`.

## 2) Installa i prerequisiti (sulla VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Installa OpenClaw

Esegui lo script di installazione di OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configura nginx per fare da proxy a OpenClaw sulla porta 8000

Modifica `/etc/nginx/sites-enabled/default` con

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Sovrascrivi gli header di forwarding invece di preservare le catene fornite dal client.
OpenClaw considera attendibili i metadati IP inoltrati solo da proxy esplicitamente configurati,
e le catene `X-Forwarded-For` in stile append vengono trattate come un rischio di hardening.

## 5) Accedi a OpenClaw e concedi i privilegi

Accedi a `https://<vm-name>.exe.xyz/` (vedi l'output della Control UI dall'onboarding). Se richiede autenticazione, incolla il
segreto condiviso configurato dalla VM. Questa guida usa l'autenticazione con token, quindi recupera `gateway.auth.token`
con `openclaw config get gateway.auth.token` (oppure generane uno con `openclaw doctor --generate-gateway-token`).
Se hai cambiato il gateway in autenticazione con password, usa invece `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Approva i dispositivi con `openclaw devices list` e `openclaw devices approve <requestId>`. In caso di dubbi, usa Shelley dal browser!

## Accesso remoto

L'accesso remoto è gestito dall'autenticazione di [exe.dev](https://exe.dev). Per
impostazione predefinita, il traffico HTTP dalla porta 8000 viene inoltrato a `https://<vm-name>.exe.xyz`
con autenticazione email.

## Aggiornamento

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guida: [Updating](/install/updating)
