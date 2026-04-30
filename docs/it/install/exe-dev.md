---
read_when:
    - Vuoi un host Linux economico sempre attivo per il Gateway
    - Vuoi accedere da remoto all'interfaccia di controllo senza dover gestire un VPS tuo
summary: Esegui OpenClaw Gateway su exe.dev (VM + proxy HTTPS) per l'accesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T08:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Obiettivo: OpenClaw Gateway in esecuzione su una VM exe.dev, raggiungibile dal tuo laptop tramite: `https://<vm-name>.exe.xyz`

Questa pagina presuppone l'immagine predefinita **exeuntu** di exe.dev. Se hai scelto una distribuzione diversa, associa i pacchetti di conseguenza.

## Percorso rapido per principianti

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Inserisci la tua chiave/token di autenticazione secondo necessità
3. Fai clic su "Agent" accanto alla tua VM e attendi che Shelley completi il provisioning
4. Apri `https://<vm-name>.exe.xyz/` e autenticati con il segreto condiviso configurato (questa guida usa l'autenticazione tramite token per impostazione predefinita, ma funziona anche l'autenticazione con password se cambi `gateway.auth.mode`)
5. Approva eventuali richieste di associazione dispositivo in sospeso con `openclaw devices approve <requestId>`

## Cosa ti serve

- Account exe.dev
- Accesso `ssh exe.dev` alle macchine virtuali [exe.dev](https://exe.dev) (facoltativo)

## Installazione automatizzata con Shelley

Shelley, l'agent di [exe.dev](https://exe.dev), può installare OpenClaw immediatamente con il nostro
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

<Tip>
Mantieni questa VM **stateful**. OpenClaw archivia `openclaw.json`, `auth-profiles.json` per agent, sessioni e stato di canali/provider in `~/.openclaw/`, oltre al workspace in `~/.openclaw/workspace/`.
</Tip>

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

## 4) Configura nginx per inoltrare OpenClaw alla porta 8000

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

Sovrascrivi gli header di inoltro invece di preservare le catene fornite dal client.
OpenClaw considera attendibili i metadati IP inoltrati solo da proxy configurati esplicitamente,
e le catene `X-Forwarded-For` in stile append sono trattate come un rischio di hardening.

## 5) Accedi a OpenClaw e concedi i privilegi

Accedi a `https://<vm-name>.exe.xyz/` (vedi l'output della Control UI dall'onboarding). Se richiede l'autenticazione, incolla il
segreto condiviso configurato dalla VM. Questa guida usa l'autenticazione tramite token, quindi recupera `gateway.auth.token`
con `openclaw config get gateway.auth.token` (oppure generane uno con `openclaw doctor --generate-gateway-token`).
Se hai cambiato il Gateway all'autenticazione con password, usa invece `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Approva i dispositivi con `openclaw devices list` e `openclaw devices approve <requestId>`. In caso di dubbi, usa Shelley dal browser!

## Configurazione di canali remoti

Per gli host remoti, preferisci una singola chiamata `config patch` a molte chiamate SSH a `config set`. Mantieni i token reali nell'ambiente della VM o in `~/.openclaw/.env`, e inserisci solo SecretRef in `openclaw.json`.

Sulla VM, fai in modo che l'ambiente del servizio contenga i segreti necessari:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Dal tuo computer locale, crea un file di patch e invialo alla VM tramite pipe:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Usa `--replace-path` quando una allowlist annidata deve diventare esattamente il valore della patch, ad esempio quando sostituisci una allowlist di canali Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Accesso remoto

L'accesso remoto è gestito dall'autenticazione di [exe.dev](https://exe.dev). Per
impostazione predefinita, il traffico HTTP dalla porta 8000 viene inoltrato a `https://<vm-name>.exe.xyz`
con autenticazione via email.

## Aggiornamento

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guida: [Aggiornamento](/it/install/updating)

## Correlati

- [Gateway remoto](/it/gateway/remote)
- [Panoramica dell'installazione](/it/install)
