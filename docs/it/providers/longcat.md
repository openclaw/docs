---
read_when:
    - Vuoi usare LongCat-2.0 con OpenClaw
    - Ti serve la chiave API di LongCat o i limiti del modello
summary: Configurazione dell'API LongCat per LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T07:25:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) fornisce un'API ospitata per LongCat-2.0, un
modello di ragionamento progettato per la programmazione e i carichi di lavoro agentici. OpenClaw fornisce il
plugin `longcat` ufficiale per l'endpoint compatibile con OpenAI di LongCat.

| Proprietà     | Valore                                      |
| ------------- | ------------------------------------------- |
| Fornitore     | `longcat`                                   |
| Autenticazione | `LONGCAT_API_KEY`                          |
| API           | Chat Completions compatibile con OpenAI     |
| URL di base   | `https://api.longcat.chat/openai`           |
| Modello       | `longcat/LongCat-2.0`                       |
| Contesto      | 1.048.576 token                             |
| Output massimo | 131.072 token                              |
| Input         | Testo                                       |

## Installare il plugin

Installa il pacchetto ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Guida introduttiva

<Steps>
  <Step title="Creare una chiave API">
    Accedi alla [piattaforma API LongCat](https://longcat.chat/platform/) e
    crea una chiave nella pagina [Chiavi API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Eseguire la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verificare il modello">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

La configurazione iniziale aggiunge il catalogo ospitato e seleziona `longcat/LongCat-2.0` quando non è
già configurato alcun modello principale.

### Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Comportamento del ragionamento

LongCat offre un controllo binario del ragionamento. OpenClaw associa i livelli di ragionamento abilitati
a `thinking: { type: "enabled" }` e `/think off` a
`thinking: { type: "disabled" }`. Attualmente LongCat non documenta
`reasoning_effort`, pertanto OpenClaw non lo invia.

LongCat restituisce il ragionamento in `reasoning_content`. OpenClaw conserva questo campo
quando riproduce i turni delle chiamate agli strumenti dell'assistente, affinché le sessioni agentiche
multi-turno mantengano il formato dei messaggi previsto dal fornitore.

## Prezzi

Il catalogo integrato utilizza i prezzi di listino a consumo di LongCat, espressi in USD per milione
di token: 0,75 $ per l'input non memorizzato nella cache, 0,015 $ per l'input memorizzato nella cache e 2,95 $ per l'output. LongCat può
offrire sconti temporanei; la [pagina dei prezzi](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
e i tuoi dati di fatturazione sono le fonti autorevoli.

## LongCat-2.0 in hosting autonomo

Il fornitore `longcat` è destinato all'API ospitata di LongCat. Per i pesi aperti disponibili su
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), esegui il
modello tramite un runtime compatibile con OpenAI e utilizza invece il fornitore
[vLLM](/it/providers/vllm) o [SGLang](/it/providers/sglang) già disponibile in OpenClaw.

Mantieni l'identificatore esatto del modello usato dal runtime nel catalogo del fornitore in hosting autonomo;
non instradare una distribuzione locale tramite `longcat/LongCat-2.0`.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="La chiave funziona in una shell ma non nel Gateway">
    I processi Gateway gestiti dal demone non ereditano tutte le variabili della shell interattiva.
    Inserisci `LONGCAT_API_KEY` in `~/.openclaw/.env`, configurala tramite
    la configurazione iniziale oppure usa un riferimento a un segreto approvato.
  </Accordion>

  <Accordion title="Le richieste non riescono con 402 o 429">
    `402` indica che l'account non dispone di una quota di token sufficiente. `429` indica che la chiave
    API ha raggiunto un limite di frequenza. Controlla l'[utilizzo di LongCat](https://longcat.chat/platform/usage)
    e riprova le richieste soggette al limite di frequenza dopo l'intervallo di attesa del fornitore.
  </Accordion>

  <Accordion title="Il modello non viene visualizzato">
    Esegui `openclaw plugins list` e verifica che il plugin `longcat` sia
    abilitato, quindi esegui `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Fornitori di modelli" href="/it/concepts/model-providers" icon="layers">
    Configurazione dei fornitori, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Documentazione dell'API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Endpoint dell'API ospitata, autenticazione, limiti ed esempi.
  </Card>
  <Card title="Scheda del modello LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Architettura, indicazioni per la distribuzione e dettagli del modello.
  </Card>
  <Card title="Segreti" href="/it/gateway/secrets" icon="key">
    Archivia le credenziali del fornitore senza incorporare testo non cifrato nella configurazione.
  </Card>
</CardGroup>
