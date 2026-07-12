---
read_when:
    - Vuoi un host Linux economico e sempre attivo per il Gateway
    - Vuoi accedere da remoto all'interfaccia di controllo senza gestire un VPS tuo
summary: Esegui OpenClaw Gateway su exe.dev (VM + proxy HTTPS) per l'accesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T07:09:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Obiettivo:** Gateway OpenClaw in esecuzione su una VM [exe.dev](https://exe.dev), raggiungibile all'indirizzo `https://<vm-name>.exe.xyz`.

Questa guida presuppone l'immagine predefinita **exeuntu** di exe.dev. Adatta i pacchetti di conseguenza sulle altre distribuzioni.

## Cosa serve

- Account exe.dev
- Accesso tramite `ssh exe.dev` alle VM exe.dev (facoltativo, per la configurazione manuale)

## Procedura rapida per principianti

1. Apri [https://exe.new/openclaw](https://exe.new/openclaw)
2. Inserisci la chiave o il token di autenticazione secondo necessità
3. Fai clic su "Agent" accanto alla VM e attendi che Shelley completi il provisioning
4. Apri `https://<vm-name>.exe.xyz/` ed esegui l'autenticazione con il segreto condiviso configurato (per impostazione predefinita viene usata l'autenticazione tramite token; anche quella tramite password funziona se modifichi `gateway.auth.mode`)
5. Approva le richieste di associazione dei dispositivi in sospeso con `openclaw devices approve <requestId>`

## Installazione automatizzata con Shelley

Shelley, l'agente di exe.dev, può installare OpenClaw a partire da un prompt:

```text
Configura OpenClaw (https://docs.openclaw.ai/install) su questa VM. Usa i flag non interattivo e di accettazione del rischio per l'onboarding di openclaw. Aggiungi l'autenticazione o il token fornito secondo necessità. Configura nginx per inoltrare dalla porta predefinita 18789 al percorso radice nella configurazione predefinita del sito abilitato, assicurandoti di abilitare il supporto WebSocket. L'associazione viene eseguita con "openclaw devices list" e "openclaw devices approve <request id>". Assicurati che il pannello di controllo indichi che lo stato di OpenClaw è OK. exe.dev gestisce per noi l'inoltro dalla porta 8000 alle porte 80/443 e HTTPS, quindi l'indirizzo finale "raggiungibile" deve essere <vm-name>.exe.xyz, senza specificare la porta.
```

## Installazione manuale

<Steps>
  <Step title="Crea la VM">
    Dal tuo dispositivo:

    ```bash
    ssh exe.dev new
    ```

    Quindi connettiti:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Mantieni questa VM **con stato persistente**. OpenClaw archivia `openclaw.json`, i file `auth-profiles.json` dei singoli agenti, le sessioni e lo stato dei canali/provider in `~/.openclaw/`, oltre all'area di lavoro in `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Installa i prerequisiti (sulla VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Installa OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Configura nginx come proxy verso la porta 8000">
    Modifica `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Supporto WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Intestazioni proxy standard
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Impostazioni di timeout per connessioni di lunga durata
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Sovrascrivi le intestazioni di inoltro anziché conservare le catene fornite dal client. OpenClaw considera attendibili i metadati IP inoltrati solo se provengono da proxy configurati esplicitamente e considera le catene `X-Forwarded-For` con aggiunta progressiva un rischio per la sicurezza.

  </Step>

  <Step title="Accedi a OpenClaw e approva i dispositivi">
    Apri `https://<vm-name>.exe.xyz/` (consulta l'output dell'interfaccia di controllo prodotto durante l'onboarding). Se viene richiesta l'autenticazione, incolla il segreto condiviso configurato nella VM.

    Questa guida usa per impostazione predefinita l'autenticazione tramite token, quindi recupera `gateway.auth.token` con `openclaw config get gateway.auth.token` oppure generane uno nuovo con `openclaw doctor --n`. Se hai configurato il Gateway per l'autenticazione tramite password, usa invece `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Approva i dispositivi con `openclaw devices list` e `openclaw devices approve <requestId>`. In caso di dubbi, usa Shelley dal browser.

  </Step>
</Steps>

## Configurazione remota dei canali

Per gli host remoti, preferisci una singola chiamata `config patch` rispetto a numerose chiamate SSH a `config set`. Conserva i token effettivi nell'ambiente della VM o in `~/.openclaw/.env` e inserisci in `openclaw.json` solo i riferimenti ai segreti. Consulta [Gestione dei segreti](/it/gateway/secrets) per il contratto completo dei riferimenti ai segreti.

Sulla VM, assicurati che l'ambiente del servizio contenga i segreti necessari:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Dal computer locale, crea un file di patch e invialo tramite pipe alla VM:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

Usa `--replace-path` quando una lista di elementi consentiti annidata deve coincidere esattamente con il valore della patch, ad esempio per sostituire la lista di elementi consentiti di un canale Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Consulta [Discord](/it/channels/discord) e [Slack](/it/channels/slack) per la documentazione completa sulla configurazione dei canali.

## Accesso remoto

exe.dev gestisce l'autenticazione per l'accesso remoto. Per impostazione predefinita, il traffico HTTP dalla porta 8000 viene inoltrato a `https://<vm-name>.exe.xyz` con autenticazione tramite e-mail.

## Aggiornamento

```bash
openclaw update
```

Consulta [Aggiornamento](/it/install/updating) per il cambio di canale e il ripristino manuale.

## Contenuti correlati

- [Gateway remoto](/it/gateway/remote)
- [Panoramica dell'installazione](/it/install)
