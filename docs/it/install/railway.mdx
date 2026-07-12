---
read_when:
    - Distribuzione di OpenClaw su Railway
    - Vuoi una distribuzione nel cloud con un solo clic e un'interfaccia di controllo basata sul browser
summary: Distribuisci OpenClaw su Railway con un modello in un clic
title: Railway
x-i18n:
    generated_at: "2026-07-12T07:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Distribuisci OpenClaw su Railway con un modello con un solo clic e accedi tramite l'interfaccia web di controllo. Questo è il percorso più semplice «senza terminale sul server»: Railway esegue il Gateway per te.

## Distribuzione con un solo clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Distribuisci su Railway
</a>

<Steps>
  <Step title="Distribuisci il modello">
    Fai clic su **Distribuisci su Railway** qui sopra.
  </Step>

<Step title="Aggiungi un volume">
  Collega un volume montato in `/data` (necessario per rendere persistente lo stato).
</Step>

  <Step title="Imposta le variabili">
    Imposta le **Variables** necessarie nel servizio:

    - `OPENCLAW_GATEWAY_PORT=8080` (obbligatoria -- deve corrispondere alla porta in Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (obbligatoria; trattala come un segreto amministrativo)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (consigliata)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (consigliata)

  </Step>

<Step title="Abilita la rete pubblica">
  In **Public Networking**, abilita **HTTP Proxy** per il servizio sulla porta `8080`.
</Step>

  <Step title="Connettiti">
    Trova l'URL pubblico in **Railway -> your service -> Settings -> Domains** -- può essere un dominio generato (spesso `https://<something>.up.railway.app`) oppure il dominio personalizzato collegato.

    Apri `https://<your-railway-domain>/openclaw` e connettiti usando il segreto condiviso configurato. Per impostazione predefinita, il modello usa `OPENCLAW_GATEWAY_TOKEN`; se lo sostituisci con l'autenticazione tramite password, usa invece tale password.

  </Step>
</Steps>

## Cosa ottieni

- Gateway OpenClaw ospitato + interfaccia di controllo
- Archiviazione persistente tramite il volume Railway (`/data`), così `openclaw.json`, i file `auth-profiles.json` specifici per ogni agente, lo stato dei canali e dei provider, le sessioni e lo spazio di lavoro vengono mantenuti durante le nuove distribuzioni

## Connetti un canale

Usa l'interfaccia di controllo in `/openclaw` oppure esegui `openclaw onboard` tramite la shell di Railway per ottenere le istruzioni di configurazione del canale:

- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram) (il più rapido -- basta il token di un bot)
- [Tutti i canali](/it/channels)

## Backup e migrazione

Esporta lo stato, la configurazione, i profili di autenticazione e lo spazio di lavoro:

```bash
openclaw backup create
```

Viene creato un archivio di backup portabile contenente lo stato di OpenClaw e qualsiasi spazio di lavoro configurato. Per i dettagli, consulta [Backup](/it/cli/backup).

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)
