---
read_when:
    - Vuoi inferenza orientata alla privacy in OpenClaw
    - Vuoi indicazioni per configurare Venice AI
summary: Usare i modelli orientati alla privacy di Venice AI in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T08:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

Venice AI fornisce **inferenza AI orientata alla privacy** con supporto per modelli senza censura e accesso ai principali modelli proprietari tramite il suo proxy anonimizzato. Tutta l'inferenza è privata per impostazione predefinita — nessun addestramento sui tuoi dati, nessun logging.

## Perché usare Venice in OpenClaw

- **Inferenza privata** per modelli open-source (senza logging).
- **Modelli senza censura** quando ti servono.
- **Accesso anonimizzato** a modelli proprietari (Opus/GPT/Gemini) quando conta la qualità.
- Endpoint `/v1` compatibili con OpenAI.

## Modalità privacy

Venice offre due livelli di privacy — capirli è fondamentale per scegliere il modello:

| Modalità       | Descrizione                                                                                                                          | Modelli                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Private**    | Completamente privata. Prompt/risposte **non vengono mai memorizzati o registrati**. Effimera.                                      | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, ecc. |
| **Anonymized** | Instradata tramite Venice con i metadati rimossi. Il provider sottostante (OpenAI, Anthropic, Google, xAI) vede richieste anonimizzate. | Claude, GPT, Gemini, Grok                                     |

<Warning>
I modelli anonimizzati **non** sono completamente privati. Venice rimuove i metadati prima dell'inoltro, ma il provider sottostante (OpenAI, Anthropic, Google, xAI) elabora comunque la richiesta. Scegli i modelli **Private** quando è richiesta la privacy completa.
</Warning>

## Funzionalità

- **Orientata alla privacy**: scegli tra modalità "private" (completamente privata) e "anonymized" (tramite proxy)
- **Modelli senza censura**: accesso a modelli senza restrizioni sui contenuti
- **Accesso ai principali modelli**: usa Claude, GPT, Gemini e Grok tramite il proxy anonimizzato di Venice
- **API compatibile con OpenAI**: endpoint `/v1` standard per un'integrazione semplice
- **Streaming**: supportato su tutti i modelli
- **Function calling**: supportato su modelli selezionati (controlla le capacità del modello)
- **Vision**: supportata sui modelli con capacità vision
- **Nessun rate limit rigido**: in caso di utilizzo estremo può essere applicato un throttling fair-use

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    1. Registrati su [venice.ai](https://venice.ai)
    2. Vai su **Settings > API Keys > Create new key**
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
        1. Richiederà la tua chiave API (oppure userà `VENICE_API_KEY` se già presente)
        2. Mostrerà tutti i modelli Venice disponibili
        3. Ti permetterà di scegliere il tuo modello predefinito
        4. Configurerà automaticamente il provider
      </Tab>
      <Tab title="Variabile d'ambiente">
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

- **Modello predefinito**: `venice/kimi-k2-5` per un forte reasoning privato più vision.
- **Opzione ad alta capacità**: `venice/claude-opus-4-6` per il percorso Venice anonimizzato più potente.
- **Privacy**: scegli modelli "private" per un'inferenza completamente privata.
- **Capacità**: scegli modelli "anonymized" per accedere a Claude, GPT, Gemini tramite il proxy di Venice.

Cambia il modello predefinito in qualsiasi momento:

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
Usa la tabella qui sotto per scegliere il modello giusto per il tuo caso d'uso.

| Caso d'uso                 | Modello consigliato              | Perché                                        |
| -------------------------- | -------------------------------- | --------------------------------------------- |
| **Chat generale (predefinito)** | `kimi-k2-5`                 | Forte reasoning privato più vision            |
| **Migliore qualità complessiva** | `claude-opus-4-6`          | Opzione Venice anonimizzata più potente       |
| **Privacy + coding**       | `qwen3-coder-480b-a35b-instruct` | Modello di coding privato con grande contesto |
| **Vision privata**         | `kimi-k2-5`                      | Supporto vision senza uscire dalla modalità privata |
| **Veloce + economico**     | `qwen3-4b`                       | Modello di reasoning leggero                  |
| **Attività private complesse** | `deepseek-v3.2`              | Forte reasoning, ma senza supporto tool Venice |
| **Senza censura**          | `venice-uncensored`              | Nessuna restrizione sui contenuti             |

</Tip>

## Catalogo integrato (41 totali)

<AccordionGroup>
  <Accordion title="Modelli privati (26) — completamente privati, senza logging">
    | ID modello                             | Nome                                | Contesto | Funzionalità               |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Predefinito, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Generale                   |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Generale                   |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Generale, tools disabilitati |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Generale                   |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Coding                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Coding                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Reasoning, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Generale                   |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Veloce, reasoning          |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Reasoning, tools disabilitati |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Senza censura, tools disabilitati |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Generale                   |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Generale                   |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Generale                   |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Reasoning                  |
  </Accordion>

  <Accordion title="Modelli anonimizzati (15) — tramite proxy Venice">
    | ID modello                      | Nome                           | Contesto | Funzionalità               |
    | ------------------------------- | ------------------------------ | -------- | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M       | Reasoning, vision          |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k     | Reasoning, vision          |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M       | Reasoning, vision          |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k     | Reasoning, vision          |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M       | Reasoning, vision          |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k     | Reasoning, vision, coding  |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k     | Reasoning                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k     | Reasoning, vision, coding  |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k     | Vision                     |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k     | Vision                     |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M       | Reasoning, vision          |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k     | Reasoning, vision          |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k     | Reasoning, vision          |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M       | Reasoning, vision          |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k     | Reasoning, coding          |
  </Accordion>
</AccordionGroup>

## Rilevamento dei modelli

OpenClaw rileva automaticamente i modelli dall'API Venice quando `VENICE_API_KEY` è impostato. Se l'API non è raggiungibile, ripiega su un catalogo statico.

L'endpoint `/models` è pubblico (non serve auth per elencare i modelli), ma l'inferenza richiede una chiave API valida.

## Supporto per streaming e strumenti

| Funzionalità         | Supporto                                              |
| -------------------- | ----------------------------------------------------- |
| **Streaming**        | Tutti i modelli                                       |
| **Function calling** | La maggior parte dei modelli (controlla `supportsFunctionCalling` nell'API) |
| **Vision/Immagini**  | Modelli contrassegnati con funzionalità "Vision"      |
| **Modalità JSON**    | Supportata tramite `response_format`                  |

## Prezzi

Venice usa un sistema basato su crediti. Controlla [venice.ai/pricing](https://venice.ai/pricing) per le tariffe attuali:

- **Modelli privati**: costo generalmente più basso
- **Modelli anonimizzati**: simile ai prezzi API diretti + una piccola commissione Venice

### Venice (anonimizzato) vs API diretta

| Aspetto      | Venice (anonimizzato)         | API diretta         |
| ------------ | ----------------------------- | ------------------- |
| **Privacy**  | Metadati rimossi, anonimizzato | Il tuo account è collegato |
| **Latenza**  | +10-50ms (proxy)              | Diretta             |
| **Funzionalità** | La maggior parte delle funzionalità è supportata | Funzionalità complete |
| **Fatturazione** | Crediti Venice             | Fatturazione del provider |

## Esempi d'uso

```bash
# Usa il modello privato predefinito
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Usa Claude Opus tramite Venice (anonimizzato)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Usa un modello senza censura
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Usa un modello vision con immagine
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Usa un modello di coding
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
Per ulteriore aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
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
    Scegliere provider, model ref e comportamento di failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Homepage di Venice AI e registrazione account.
  </Card>
  <Card title="Documentazione API" href="https://docs.venice.ai" icon="book">
    Riferimento API Venice e documentazione per sviluppatori.
  </Card>
  <Card title="Prezzi" href="https://venice.ai/pricing" icon="credit-card">
    Tariffe e piani di crediti Venice attuali.
  </Card>
</CardGroup>
