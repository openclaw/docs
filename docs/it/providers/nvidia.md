---
read_when:
    - Vuoi usare gratuitamente modelli open source in OpenClaw
    - È necessario configurare NVIDIA_API_KEY
    - Vuoi usare Nemotron 3 Ultra tramite NVIDIA
summary: Usa l'API di NVIDIA compatibile con OpenAI in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T07:25:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA mette a disposizione gratuitamente modelli aperti tramite un'API compatibile con OpenAI all'indirizzo
`https://integrate.api.nvidia.com/v1`, autenticata con una chiave API ottenuta da
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
imposta per impostazione predefinita il provider NVIDIA su Nemotron 3 Ultra, il modello di ragionamento NVIDIA
con 550 miliardi di parametri totali e 55 miliardi attivi, progettato per attività agentiche con contesti estesi.

## Guida introduttiva

<Steps>
  <Step title="Ottieni la chiave API">
    Crea una chiave API su [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Esporta la chiave ed esegui la configurazione iniziale">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Imposta un modello NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Per la configurazione non interattiva, passa direttamente la chiave:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` inserisce la chiave nella cronologia della shell e nell'output di `ps`. Quando possibile, preferisci
la variabile d'ambiente `NVIDIA_API_KEY`.
</Warning>

## Esempio di configurazione

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catalogo in evidenza

Quando è configurata una chiave API NVIDIA, i percorsi di configurazione e selezione del modello recuperano
il catalogo pubblico dei modelli in evidenza di NVIDIA da
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
memorizzano il risultato nella cache per 24 ore (le prime 32 voci, importate come
righe con input di testo gratuito). I nuovi modelli in evidenza di build.nvidia.com vengono quindi visualizzati nelle interfacce
di configurazione e selezione del modello senza attendere una versione di OpenClaw. Quando
il feed in tempo reale è disponibile, il primo modello restituito è l'opzione preselezionata
durante la configurazione di NVIDIA.

Il recupero utilizza un criterio fisso per l'host HTTPS `assets.ngc.nvidia.com`. Se non è
configurata alcuna chiave API NVIDIA oppure se il feed non è disponibile o non è valido,
OpenClaw utilizza come ripiego il catalogo incluso e il valore predefinito incluso descritti di seguito.

## Nemotron 3 Ultra

Nemotron 3 Ultra è il modello NVIDIA predefinito in OpenClaw. La pagina di NVIDIA relativa a
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo indica come endpoint gratuito disponibile, con una specifica di contesto pari a 1 milione di token.

La riga Ultra inclusa invia per impostazione predefinita
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
affinché il normale output della chat rimanga nella risposta visibile anziché
esporre il testo del ragionamento.

Usa Ultra come opzione NVIDIA predefinita con le capacità più elevate. Mantieni selezionato Super quando
desideri l'opzione Nemotron 3 più piccola oppure scegli uno dei modelli di terze parti
ospitati nel catalogo NVIDIA quando il relativo contesto, la latenza o il comportamento sono più adatti.

## Catalogo di ripiego incluso

Le righe selezionabili incluse rappresentano un'istantanea del catalogo dei modelli in evidenza di NVIDIA. Le righe
di compatibilità deprecate rimangono risolvibili tramite il riferimento esatto, ma non vengono visualizzate nei selettori
dei modelli.

| Riferimento del modello                     | Nome                  | Contesto  | Output massimo |
| ------------------------------------------ | --------------------- | --------- | -------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192          |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192          |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192          |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192          |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384         |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384         |

Il catalogo completo di compatibilità conserva inoltre questi riferimenti distribuiti per le configurazioni
esistenti: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` e
`nvidia/minimaxai/minimax-m2.7`. Rimangono disponibili tramite il riferimento esatto, ma
non vengono mai visualizzati durante la configurazione iniziale o nei selettori dei modelli.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di attivazione automatica">
    Il provider si attiva automaticamente quando è impostata la variabile d'ambiente `NVIDIA_API_KEY`
    oppure quando una chiave è stata memorizzata durante la configurazione iniziale. Oltre alla chiave, non è
    richiesta alcuna configurazione esplicita del provider.
  </Accordion>

  <Accordion title="Catalogo e prezzi">
    OpenClaw preferisce il catalogo pubblico dei modelli in evidenza di NVIDIA quando è
    configurata l'autenticazione NVIDIA e lo memorizza nella cache per 24 ore. Il catalogo di ripiego selezionabile incluso è
    un'istantanea statica del catalogo dei modelli in evidenza di NVIDIA; le righe di compatibilità deprecate
    accessibili tramite riferimento esatto sono nascoste nei selettori dei modelli. I costi hanno come valore predefinito `0` nel
    codice sorgente, poiché NVIDIA offre attualmente l'accesso API gratuito ai modelli elencati.
  </Accordion>

  <Accordion title="Endpoint compatibile con OpenAI">
    OpenClaw comunica con NVIDIA utilizzando l'adattatore `openai-completions` tramite la
    route standard `/v1` per i completamenti di chat. Qualsiasi strumento compatibile con OpenAI dovrebbe
    funzionare immediatamente con l'URL di base NVIDIA.
  </Accordion>

  <Accordion title="Parametri di ragionamento di Nemotron 3 Ultra">
    La richiesta di esempio di NVIDIA per Ultra utilizza `chat_template_kwargs.enable_thinking`
    e `reasoning_budget` per l'output del ragionamento. La riga Ultra inclusa in OpenClaw
    disabilita per impostazione predefinita il ragionamento del modello per il normale utilizzo in chat. Se devi
    attivare l'output di ragionamento NVIDIA o forzare altri campi della richiesta
    specifici di NVIDIA, imposta i parametri per modello e limita le sostituzioni specifiche
    del provider al modello NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` viene unito a qualsiasi `chat_template_kwargs`
    già presente nella richiesta, anziché sostituire l'intero oggetto.
    `params.extra_body` è la sostituzione finale del corpo della richiesta compatibile con OpenAI
    e sovrascrive le chiavi del payload in conflitto; usalo quindi solo per i campi che NVIDIA
    documenta per l'endpoint selezionato.

  </Accordion>

  <Accordion title="Risposte lente dei provider personalizzati">
    Alcuni modelli personalizzati ospitati da NVIDIA possono impiegare più del periodo predefinito di circa 120 secondi
    del controllo di inattività del modello prima di emettere il primo frammento di risposta. Per le voci
    personalizzate del provider NVIDIA, aumenta il timeout del provider anziché quello dell'intero
    ambiente di esecuzione dell'agente; `timeoutSeconds` si applica alle richieste HTTP del provider e
    aumenta il limite del controllo di inattività e del flusso per tale provider:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
L'utilizzo dei modelli NVIDIA è attualmente gratuito. Consulta
[build.nvidia.com](https://build.nvidia.com/) per le informazioni più recenti sulla disponibilità e
sui limiti di frequenza.
</Tip>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
