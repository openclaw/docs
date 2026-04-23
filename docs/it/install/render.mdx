---
read_when:
    - Distribuire OpenClaw su Render
    - Vuoi un deployment cloud dichiarativo con Render Blueprints
summary: Distribuire OpenClaw su Render con Infrastructure-as-Code
title: Render
x-i18n:
    generated_at: "2026-04-23T08:30:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Distribuisci OpenClaw su Render usando Infrastructure as Code. Il Blueprint `render.yaml` incluso definisce l'intero stack in modo dichiarativo, servizio, disco, variabili d'ambiente, così puoi distribuire con un solo clic e versionare l'infrastruttura insieme al codice.

## Prerequisiti

- Un [account Render](https://render.com) (tier gratuito disponibile)
- Una chiave API del tuo [provider](/it/providers) di modelli preferito

## Distribuire con un Render Blueprint

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Facendo clic su questo link:

1. Verrà creato un nuovo servizio Render dal Blueprint `render.yaml` nella root di questo repo.
2. Verrà compilata l'immagine Docker e avviato il deployment

Una volta distribuito, l'URL del tuo servizio segue il pattern `https://<service-name>.onrender.com`.

## Capire il Blueprint

I Render Blueprints sono file YAML che definiscono la tua infrastruttura. Il file `render.yaml` in questo
repository configura tutto ciò che serve per eseguire OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Funzionalità Blueprint principali usate:

| Funzionalità          | Scopo                                                      |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Compila dal Dockerfile del repo                            |
| `healthCheckPath`     | Render monitora `/health` e riavvia le istanze non sane    |
| `generateValue: true` | Genera automaticamente un valore crittograficamente sicuro |
| `disk`                | Archiviazione persistente che sopravvive ai redeploy       |

## Scegliere un piano

| Piano     | Spin-down           | Disco         | Ideale per                    |
| --------- | ------------------- | ------------- | ----------------------------- |
| Free      | Dopo 15 min inattivo | Non disponibile | Test, demo                  |
| Starter   | Mai                 | 1GB+          | Uso personale, piccoli team   |
| Standard+ | Mai                 | 1GB+          | Produzione, più canali        |

Il Blueprint usa `starter` come valore predefinito. Per usare il tier gratuito, cambia `plan: free` nel
`render.yaml` del tuo fork (ma attenzione: senza disco persistente lo stato di OpenClaw
si reimposta a ogni deployment).

## Dopo il deployment

### Accedere alla Control UI

La dashboard web è disponibile su `https://<your-service>.onrender.com/`.

Connettiti usando il secret condiviso configurato. Questo template di deployment genera automaticamente
`OPENCLAW_GATEWAY_TOKEN` (trovalo in **Dashboard → your service →
Environment**); se lo sostituisci con autenticazione tramite password, usa invece quella password.

## Funzionalità della dashboard Render

### Log

Visualizza i log in tempo reale in **Dashboard → your service → Logs**. Filtra per:

- Log di build (creazione dell'immagine Docker)
- Log di deployment (avvio del servizio)
- Log runtime (output dell'applicazione)

### Accesso shell

Per il debug, apri una sessione shell tramite **Dashboard → your service → Shell**. Il disco persistente è montato in `/data`.

### Variabili d'ambiente

Modifica le variabili in **Dashboard → your service → Environment**. Le modifiche attivano un redeploy automatico.

### Auto-deploy

Se usi il repository OpenClaw originale, Render non eseguirà l'auto-deploy del tuo OpenClaw. Per aggiornarlo, esegui una sincronizzazione manuale del Blueprint dalla dashboard.

## Dominio personalizzato

1. Vai su **Dashboard → your service → Settings → Custom Domains**
2. Aggiungi il tuo dominio
3. Configura il DNS come indicato (CNAME verso `*.onrender.com`)
4. Render effettua automaticamente il provisioning di un certificato TLS

## Scalabilità

Render supporta scalabilità orizzontale e verticale:

- **Verticale**: cambia piano per ottenere più CPU/RAM
- **Orizzontale**: aumenta il numero di istanze (piano Standard e superiori)

Per OpenClaw, la scalabilità verticale è in genere sufficiente. La scalabilità orizzontale richiede sticky session o gestione dello stato esterna.

## Backup e migrazione

Esporta in qualsiasi momento stato, configurazione, profili di autenticazione e workspace usando
l'accesso shell nella Dashboard Render:

```bash
openclaw backup create
```

Questo crea un archivio di backup portabile con lo stato OpenClaw più l'eventuale
workspace configurato. Vedi [Backup](/it/cli/backup) per i dettagli.

## Risoluzione dei problemi

### Il servizio non si avvia

Controlla i log di deployment nella Dashboard Render. Problemi comuni:

- `OPENCLAW_GATEWAY_TOKEN` mancante — verifica che sia impostato in **Dashboard → Environment**
- Mancata corrispondenza della porta — assicurati che `OPENCLAW_GATEWAY_PORT=8080` sia impostato affinché il gateway si associ alla porta prevista da Render

### Cold start lenti (tier gratuito)

I servizi del tier gratuito vanno in spin-down dopo 15 minuti di inattività. La prima richiesta dopo lo spin-down richiede alcuni secondi mentre il container si avvia. Passa al piano Starter per restare sempre attivo.

### Perdita di dati dopo il redeploy

Questo succede nel tier gratuito (nessun disco persistente). Passa a un piano a pagamento, oppure
esporta regolarmente un backup completo tramite `openclaw backup create` nella shell Render.

### Errori di health check

Render si aspetta una risposta 200 da `/health` entro 30 secondi. Se le build riescono ma i deployment falliscono, il servizio potrebbe impiegare troppo tempo ad avviarsi. Controlla:

- I log di build per eventuali errori
- Se il container viene eseguito localmente con `docker build && docker run`

## Passi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)
