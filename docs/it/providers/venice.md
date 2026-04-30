---
read_when:
    - Vuoi un'inferenza orientata alla privacy in OpenClaw
    - Vuoi indicazioni per la configurazione di Venice AI
summary: Usare i modelli di Venice AI orientati alla privacy in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T09:10:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI fornisce **inferenza AI incentrata sulla privacy** con supporto per modelli senza censura e accesso ai principali modelli proprietari tramite il loro proxy anonimizzato. Tutta l’inferenza è privata per impostazione predefinita: nessun addestramento sui tuoi dati, nessuna registrazione.

## Perché Venice in OpenClaw

- **Inferenza privata** per modelli open-source (nessuna registrazione).
- **Modelli senza censura** quando ti servono.
- **Accesso anonimizzato** a modelli proprietari (Opus/GPT/Gemini) quando la qualità è importante.
- Endpoint `/v1` compatibili con OpenAI.

## Modalità di privacy

Venice offre due livelli di privacy: capirli è fondamentale per scegliere il modello:

| Modalità        | Descrizione                                                                                                                        | Modelli                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privata**     | Completamente privata. Prompt/risposte **non vengono mai archiviati o registrati**. Effimera.                                    | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, ecc. |
| **Anonimizzata** | Inoltrata tramite proxy da Venice con i metadati rimossi. Il provider sottostante (OpenAI, Anthropic, Google, xAI) vede richieste anonimizzate. | Claude, GPT, Gemini, Grok                                     |

<Warning>
I modelli anonimizzati **non** sono completamente privati. Venice rimuove i metadati prima dell’inoltro, ma il provider sottostante (OpenAI, Anthropic, Google, xAI) elabora comunque la richiesta. Scegli modelli **Privati** quando è richiesta la piena privacy.
</Warning>

## Funzionalità

- **Incentrato sulla privacy**: scegli tra modalità "privata" (completamente privata) e "anonimizzata" (tramite proxy)
- **Modelli senza censura**: accesso a modelli senza restrizioni sui contenuti
- **Accesso ai principali modelli**: usa Claude, GPT, Gemini e Grok tramite il proxy anonimizzato di Venice
- **API compatibile con OpenAI**: endpoint `/v1` standard per un’integrazione semplice
- **Streaming**: supportato su tutti i modelli
- **Chiamata di funzioni**: supportata su modelli selezionati (controlla le capacità del modello)
- **Visione**: supportata sui modelli con capacità di visione
- **Nessun limite rigido di frequenza**: per usi estremi può essere applicata una limitazione basata sul fair use

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    1. Registrati su [venice.ai](https://venice.ai)
    2. Vai a **Settings > API Keys > Create new key**
    3. Copia la tua chiave API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configura OpenClaw">
    Scegli il metodo di configurazione che preferisci:

    <Tabs>
      <Tab title="Interattivo (consigliato)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Questo:
        1. Richiederà la tua chiave API (o userà `VENICE_API_KEY` esistente)
        2. Mostrerà tutti i modelli Venice disponibili
        3. Ti permetterà di scegliere il modello predefinito
        4. Configurerà automaticamente il provider
      </Tab>
      <Tab title="Variabile d’ambiente">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non interattivo">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verifica la configurazione">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Selezione del modello

Dopo la configurazione, OpenClaw mostra tutti i modelli Venice disponibili. Scegli in base alle tue esigenze:

- **Modello predefinito**: `venice/kimi-k2-5` per un ragionamento privato solido più visione.
- **Opzione ad alta capacità**: `venice/claude-opus-4-6` per il percorso Venice anonimizzato più potente.
- **Privacy**: scegli modelli "privati" per inferenza completamente privata.
- **Capacità**: scegli modelli "anonimizzati" per accedere a Claude, GPT, Gemini tramite il proxy di Venice.

Cambia il tuo modello predefinito in qualsiasi momento:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Elenca tutti i modelli disponibili:

```bash
openclaw models list | grep venice
```

Puoi anche eseguire `openclaw configure`, selezionare **Model/auth** e scegliere **Venice AI**.

<Tip>
Usa la tabella seguente per scegliere il modello giusto per il tuo caso d’uso.

| Caso d’uso                 | Modello consigliato              | Perché                                       |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Chat generale (predefinita)** | `kimi-k2-5`                      | Ragionamento privato solido più visione      |
| **Migliore qualità complessiva** | `claude-opus-4-6`                | Opzione Venice anonimizzata più potente      |
| **Privacy + programmazione** | `qwen3-coder-480b-a35b-instruct` | Modello di programmazione privato con contesto ampio |
| **Visione privata**        | `kimi-k2-5`                      | Supporto alla visione senza uscire dalla modalità privata |
| **Veloce + economico**     | `qwen3-4b`                       | Modello di ragionamento leggero              |
| **Attività private complesse** | `deepseek-v3.2`                  | Ragionamento solido, ma nessun supporto agli strumenti Venice |
| **Senza censura**          | `venice-uncensored`              | Nessuna restrizione sui contenuti            |

</Tip>

## Comportamento di replay di DeepSeek V4

Se Venice espone modelli DeepSeek V4 come `venice/deepseek-v4-pro` o
`venice/deepseek-v4-flash`, OpenClaw inserisce il segnaposto richiesto da DeepSeek V4 per il replay di
`reasoning_content` nei messaggi dell’assistente quando il proxy
lo omette. Venice rifiuta il controllo `thinking` nativo di primo livello di DeepSeek, quindi
OpenClaw mantiene quella correzione di replay specifica del provider separata dai controlli di pensiero
del provider DeepSeek nativo.

## Catalogo integrato (41 in totale)

<AccordionGroup>
  <Accordion title="Modelli privati (26) — completamente privati, nessuna registrazione">
    | ID modello                              | Nome                                | Contesto | Funzionalità              |
    | -------------------------------------- | ----------------------------------- | -------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Predefinito, ragionamento, visione |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Ragionamento              |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Generale                  |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Generale                  |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k     | Generale, strumenti disabilitati |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k     | Ragionamento              |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k     | Generale                  |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k     | Programmazione            |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k     | Programmazione            |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k     | Ragionamento, visione     |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k     | Generale                  |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k     | Visione                   |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k      | Veloce, ragionamento      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k     | Ragionamento, strumenti disabilitati |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Senza censura, strumenti disabilitati |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k     | Visione                   |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k     | Visione                   |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k     | Generale                  |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k     | Generale                  |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k     | Ragionamento              |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k     | Generale                  |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k     | Ragionamento              |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k     | Ragionamento              |
    | `zai-org-glm-5`                        | GLM 5                              | 198k     | Ragionamento              |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k     | Ragionamento              |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k     | Ragionamento              |
  </Accordion>

  <Accordion title="Modelli anonimizzati (15) — tramite proxy Venice">
    | ID modello                     | Nome                           | Contesto | Funzionalità             |
    | ------------------------------ | ------------------------------ | -------- | ------------------------ |
    | `claude-opus-4-6`              | Claude Opus 4.6 (via Venice)   | 1M       | Ragionamento, visione    |
    | `claude-opus-4-5`              | Claude Opus 4.5 (via Venice)   | 198k     | Ragionamento, visione    |
    | `claude-sonnet-4-6`            | Claude Sonnet 4.6 (via Venice) | 1M       | Ragionamento, visione    |
    | `claude-sonnet-4-5`            | Claude Sonnet 4.5 (via Venice) | 198k     | Ragionamento, visione    |
    | `openai-gpt-54`                | GPT-5.4 (via Venice)           | 1M       | Ragionamento, visione    |
    | `openai-gpt-53-codex`          | GPT-5.3 Codex (via Venice)     | 400k     | Ragionamento, visione, programmazione |
    | `openai-gpt-52`                | GPT-5.2 (via Venice)           | 256k     | Ragionamento             |
    | `openai-gpt-52-codex`          | GPT-5.2 Codex (via Venice)     | 256k     | Ragionamento, visione, programmazione |
    | `openai-gpt-4o-2024-11-20`     | GPT-4o (via Venice)            | 128k     | Visione                  |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k     | Visione                  |
    | `gemini-3-1-pro-preview`       | Gemini 3.1 Pro (via Venice)    | 1M       | Ragionamento, visione    |
    | `gemini-3-pro-preview`         | Gemini 3 Pro (via Venice)      | 198k     | Ragionamento, visione    |
    | `gemini-3-flash-preview`       | Gemini 3 Flash (via Venice)    | 256k     | Ragionamento, visione    |
    | `grok-41-fast`                 | Grok 4.1 Fast (via Venice)     | 1M       | Ragionamento, visione    |
    | `grok-code-fast-1`             | Grok Code Fast 1 (via Venice)  | 256k     | Ragionamento, programmazione |
  </Accordion>
</AccordionGroup>

## Rilevamento dei modelli

OpenClaw rileva automaticamente i modelli dall’API Venice quando `VENICE_API_KEY` è impostata. Se l’API non è raggiungibile, usa un catalogo statico come fallback.

L’endpoint `/models` è pubblico (non serve autenticazione per l’elenco), ma l’inferenza richiede una chiave API valida.

## Supporto per streaming e strumenti

| Funzionalità        | Supporto                                             |
| ------------------- | ---------------------------------------------------- |
| **Streaming**       | Tutti i modelli                                      |
| **Function calling** | La maggior parte dei modelli (controlla `supportsFunctionCalling` nell'API) |
| **Vision/Images**   | Modelli contrassegnati con la funzionalità "Vision" |
| **Modalità JSON**   | Supportata tramite `response_format`                 |

## Prezzi

Venice usa un sistema basato su crediti. Consulta [venice.ai/pricing](https://venice.ai/pricing) per le tariffe attuali:

- **Modelli privati**: generalmente costo inferiore
- **Modelli anonimizzati**: simili ai prezzi dell'API diretta + una piccola commissione Venice

### Venice (anonimizzato) vs API diretta

| Aspetto          | Venice (anonimizzato)              | API diretta              |
| ---------------- | ---------------------------------- | ------------------------ |
| **Privacy**      | Metadati rimossi, anonimizzati     | Account collegato        |
| **Latenza**      | +10-50ms (proxy)                   | Diretta                  |
| **Funzionalità** | La maggior parte delle funzionalità supportata | Funzionalità complete |
| **Fatturazione** | Crediti Venice                     | Fatturazione del provider |

## Esempi di utilizzo

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Chiave API non riconosciuta">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Assicurati che la chiave inizi con `vapi_`.

  </Accordion>

  <Accordion title="Modello non disponibile">
    Il catalogo dei modelli Venice si aggiorna dinamicamente. Esegui `openclaw models list` per vedere i modelli attualmente disponibili. Alcuni modelli potrebbero essere temporaneamente offline.
  </Accordion>

  <Accordion title="Problemi di connessione">
    L'API Venice si trova su `https://api.venice.ai/api/v1`. Assicurati che la tua rete consenta connessioni HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Esempio di file di configurazione">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Homepage Venice AI e registrazione dell'account.
  </Card>
  <Card title="Documentazione API" href="https://docs.venice.ai" icon="book">
    Riferimento dell'API Venice e documentazione per sviluppatori.
  </Card>
  <Card title="Prezzi" href="https://venice.ai/pricing" icon="credit-card">
    Tariffe e piani attuali dei crediti Venice.
  </Card>
</CardGroup>
