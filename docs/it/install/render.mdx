---
read_when:
    - Distribuzione di OpenClaw su Render
    - Vuoi una distribuzione cloud dichiarativa con Render Blueprints
summary: Distribuisci OpenClaw su Render con l'Infrastructure-as-Code
title: Rendering
x-i18n:
    generated_at: "2026-07-12T07:08:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Distribuisci OpenClaw su [Render](https://render.com) usando il Blueprint `render.yaml` del repository. Questo file dichiara il servizio, il disco e le variabili d'ambiente.

## Prerequisiti

- Un [account Render](https://render.com) (è disponibile un piano gratuito)
- Una chiave API del [provider di modelli](/it/providers) che preferisci

## Distribuzione

[Distribuisci su Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Questa operazione crea un servizio Render da `render.yaml`, genera l'immagine Docker e la distribuisce. L'URL del servizio segue il formato `https://<service-name>.onrender.com`.

## Il Blueprint

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
        generateValue: true # genera automaticamente un token sicuro
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Funzionalità           | Scopo                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `runtime: docker`      | Genera l'immagine dal Dockerfile del repository                    |
| `healthCheckPath`      | Render monitora `/health` e riavvia le istanze non integre         |
| `generateValue: true`  | Genera automaticamente un valore crittograficamente sicuro         |
| `disk`                 | Spazio di archiviazione persistente che sopravvive alle ridistribuzioni |

## Scelta di un piano

| Piano     | Sospensione                  | Disco          | Ideale per                         |
| --------- | ---------------------------- | -------------- | ---------------------------------- |
| Free      | Dopo 15 minuti di inattività | Non disponibile | Test e dimostrazioni               |
| Starter   | Mai                          | 1 GB o più     | Uso personale e piccoli team       |
| Standard+ | Mai                          | 1 GB o più     | Produzione e più canali             |

Il Blueprint usa `starter` per impostazione predefinita. Per usare il piano gratuito, modifica `plan: free` nel file `render.yaml` del tuo fork. Tieni presente che, senza un disco persistente, lo stato di OpenClaw viene reimpostato a ogni distribuzione.

## Dopo la distribuzione

### Accesso all'interfaccia di controllo

La dashboard web è disponibile all'indirizzo `https://<your-service>.onrender.com/`. Connettiti usando il segreto condiviso, ovvero `OPENCLAW_GATEWAY_TOKEN` generato automaticamente (puoi trovarlo in **Dashboard → your service → Environment**), oppure la tua password se sei passato all'autenticazione tramite password.

### Log

**Dashboard → your service → Logs** mostra i log di generazione (creazione dell'immagine Docker), i log di distribuzione (avvio del servizio) e i log di runtime (output dell'applicazione).

### Accesso alla shell

**Dashboard → your service → Shell** apre una sessione shell. Il disco persistente è montato in `/data`.

### Variabili d'ambiente

Modifica le variabili in **Dashboard → your service → Environment**. Le modifiche attivano automaticamente una nuova distribuzione.

### Distribuzione automatica

Render esegue automaticamente una nuova distribuzione quando viene aggiunto un commit al ramo del repository collegato. Se hai eseguito la distribuzione direttamente da `openclaw/openclaw` anziché dal tuo fork, non disponi dell'accesso in scrittura necessario per attivarla. In tal caso, esegui una sincronizzazione manuale del Blueprint dalla Dashboard oppure configura il servizio affinché usi il tuo fork.

## Dominio personalizzato

1. **Dashboard → your service → Settings → Custom Domains**
2. Aggiungi il tuo dominio
3. Configura il DNS come indicato (CNAME verso `*.onrender.com`)
4. Render effettua automaticamente il provisioning di un certificato TLS

## Scalabilità

- **Verticale**: cambia piano per ottenere più CPU/RAM. In genere è sufficiente per OpenClaw.
- **Orizzontale**: aumenta il numero di istanze (piano Standard o superiore). Sono necessarie sessioni persistenti o una gestione esterna dello stato, poiché OpenClaw conserva lo stato di runtime sul disco locale.

## Backup e migrazione

Dalla shell della Dashboard di Render puoi esportare in qualsiasi momento stato, configurazione, profili di autenticazione e area di lavoro:

```bash
openclaw backup create
```

Questo comando crea un archivio di backup portabile. Consulta [Backup](/it/cli/backup).

## Risoluzione dei problemi

### Il servizio non si avvia

Controlla i log di distribuzione nella Dashboard di Render. Problemi comuni:

- `OPENCLAW_GATEWAY_TOKEN` mancante: verifica che sia impostato in **Dashboard → Environment**
- Porta non corrispondente: assicurati che sia impostato `OPENCLAW_GATEWAY_PORT=8080`, affinché il Gateway si associ alla porta prevista da Render

### Avvii a freddo lenti (piano gratuito)

I servizi del piano gratuito vengono sospesi dopo 15 minuti di inattività; la prima richiesta successiva alla sospensione richiede alcuni secondi mentre il container si avvia. Passa al piano Starter per mantenere il servizio sempre attivo.

### Perdita di dati dopo una nuova distribuzione

Si verifica con il piano gratuito, che non dispone di un disco persistente. Passa a un piano a pagamento oppure esporta regolarmente un backup con `openclaw backup create` dalla shell di Render.

### Errori del controllo di integrità

Se la generazione riesce ma la distribuzione non va a buon fine, l'avvio del servizio potrebbe richiedere troppo tempo oppure `/health` potrebbe non essere raggiungibile. Controlla:

- La presenza di errori nei log di generazione
- Se il container viene eseguito localmente con `docker build && docker run`

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)
