---
read_when:
    - Vuoi un'inferenza incentrata sulla privacy in OpenClaw
    - Vuoi indicazioni sulla configurazione di Venice AI
summary: Usa i modelli di Venice AI incentrati sulla privacy in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T07:29:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) offre inferenza incentrata sulla privacy: i modelli aperti vengono eseguiti
senza registrazione, oltre all'accesso tramite proxy anonimizzato a Claude, GPT, Gemini e Grok.
Tutti gli endpoint sono compatibili con OpenAI (`/v1`).

## Modalità di privacy

| Modalità        | Comportamento                                                            | Modelli                                                       |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Privata**     | Prompt e risposte non vengono mai archiviati né registrati. Effimera.    | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, ecc. |
| **Anonimizzata** | Inoltro tramite Venice con rimozione dei metadati prima della trasmissione. | Claude, GPT, Gemini, Grok                                     |

<Warning>
I modelli anonimizzati non sono completamente privati. Venice rimuove i metadati prima dell'inoltro, ma il fornitore sottostante (OpenAI, Anthropic, Google, xAI) elabora comunque la richiesta. Usa i modelli privati quando è richiesta la massima privacy.
</Warning>

## Guida introduttiva

<Steps>
  <Step title="Installa il plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Ottieni la tua chiave API">
    1. Registrati su [venice.ai](https://venice.ai)
    2. Vai a **Settings > API Keys > Create new key**
    3. Copia la tua chiave API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configura OpenClaw">
    <Tabs>
      <Tab title="Interattiva (consigliata)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Richiede la chiave API (oppure riutilizza una `VENICE_API_KEY` esistente), elenca i modelli Venice disponibili e imposta il modello predefinito.
      </Tab>
      <Tab title="Variabile di ambiente">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non interattiva">
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

- **Predefinito**: `venice/kimi-k2-5` (privato, ragionamento, visione).
- **Opzione anonimizzata più potente**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Puoi anche eseguire `openclaw configure` e selezionare **Fornitore del modello/autenticazione > Venice AI**.

<Tip>
| Caso d'uso                    | Modello                            | Motivo                                             |
| ----------------------------- | ---------------------------------- | -------------------------------------------------- |
| Chat generica (predefinito)   | `kimi-k2-5`                        | Potente ragionamento privato con visione           |
| Migliore qualità complessiva  | `claude-opus-4-6`                  | Opzione Venice anonimizzata più potente            |
| Privacy + programmazione      | `qwen3-coder-480b-a35b-instruct`   | Modello privato per programmazione con ampio contesto |
| Veloce + economico            | `qwen3-4b`                         | Modello di ragionamento leggero                    |
| Attività private complesse    | `deepseek-v3.2`                    | Potente ragionamento; chiamata di strumenti disabilitata |
| Senza censura                 | `venice-uncensored`                | Nessuna restrizione sui contenuti                  |
</Tip>

## Catalogo integrato (38 modelli)

<AccordionGroup>
  <Accordion title="Modelli privati (26) — completamente privati, senza registrazione">
    | ID modello                             | Nome                                  | Contesto | Note                                  |
    | -------------------------------------- | ------------------------------------- | -------- | ------------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k     | Predefinito, ragionamento, visione    |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k     | Ragionamento                          |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k     | Generale                              |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k     | Generale                              |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k     | Generale, strumenti disabilitati      |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k     | Ragionamento                          |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k     | Generale                              |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k     | Programmazione                        |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k     | Programmazione                        |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k     | Ragionamento, visione                 |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k     | Generale                              |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k     | Visione                               |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k      | Veloce, ragionamento                  |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k     | Ragionamento, strumenti disabilitati  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k      | Senza censura, strumenti disabilitati |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k     | Visione                               |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k     | Visione                               |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k     | Generale                              |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k     | Generale                              |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k     | Ragionamento                          |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k     | Generale                              |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k     | Ragionamento                          |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k     | Ragionamento                          |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k     | Ragionamento                          |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k     | Ragionamento                          |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k     | Ragionamento                          |
  </Accordion>

  <Accordion title="Modelli anonimizzati (12) — tramite proxy Venice">
    | ID modello                       | Nome                            | Contesto | Note                              |
    | -------------------------------- | ------------------------------- | -------- | --------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (tramite Venice) | 1M       | Ragionamento, visione             |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (tramite Venice) | 1M     | Ragionamento, visione             |
    | `openai-gpt-54`                 | GPT-5.4 (tramite Venice)        | 1M       | Ragionamento, visione             |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (tramite Venice)  | 400k     | Ragionamento, visione, programmazione |
    | `openai-gpt-52`                 | GPT-5.2 (tramite Venice)        | 256k     | Ragionamento                      |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (tramite Venice)  | 256k     | Ragionamento, visione, programmazione |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (tramite Venice)         | 128k     | Visione                           |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (tramite Venice)    | 128k     | Visione                           |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (tramite Venice) | 1M       | Ragionamento, visione             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (tramite Venice)   | 198k     | Ragionamento, visione             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (tramite Venice) | 256k     | Ragionamento, visione             |
    | `grok-41-fast`                  | Grok 4.1 Fast (tramite Venice)  | 1M       | Ragionamento, visione             |
  </Accordion>
</AccordionGroup>

I modelli Venice basati su Grok (`grok-41-fast` e simili) ricevono la stessa patch di
compatibilità dello schema degli strumenti del fornitore xAI nativo, poiché condividono lo stesso formato
di chiamata degli strumenti a monte.

## Individuazione dei modelli

Il catalogo incluso sopra è un elenco iniziale basato su manifest. Durante l'esecuzione, OpenClaw
lo aggiorna tramite l'API `/models` di Venice e utilizza l'elenco iniziale come ripiego se
l'API non è raggiungibile. L'endpoint `/models` è pubblico (non è necessaria l'autenticazione per
l'elenco), ma l'inferenza richiede una chiave API valida.

## Comportamento di riproduzione di DeepSeek V4

Se Venice espone modelli DeepSeek V4 come `deepseek-v4-pro` o
`deepseek-v4-flash`, OpenClaw compila il campo di riproduzione `reasoning_content`
richiesto nei messaggi dell'assistente quando Venice lo omette e rimuove `thinking`/
`reasoning`/`reasoning_effort` dal payload della richiesta (Venice rifiuta
il controllo `thinking` nativo di DeepSeek su questi modelli). Questa correzione della riproduzione è
separata dai controlli di ragionamento propri del fornitore DeepSeek nativo.

## Supporto per streaming e strumenti

| Funzionalità          | Supporto                                                    |
| --------------------- | ----------------------------------------------------------- |
| Streaming             | Tutti i modelli                                             |
| Chiamata di funzioni  | La maggior parte dei modelli; disabilitata per singolo modello dove indicato sopra |
| Visione/Immagini      | Modelli contrassegnati con "Visione" sopra                  |
| Modalità JSON         | Tramite `response_format`                                   |

## Prezzi

Venice utilizza un sistema basato su crediti. I modelli anonimizzati costano all'incirca quanto
i prezzi API diretti, più una piccola commissione Venice. Consulta
[venice.ai/pricing](https://venice.ai/pricing) per le tariffe attuali.

## Esempi di utilizzo

```bash
# Modello privato predefinito
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus tramite Venice (anonimizzato)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Modello senza censura
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Modello di visione con immagine
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Modello per programmazione
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Chiave API non riconosciuta">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Verifica che la chiave inizi con `vapi_`.

  </Accordion>

  <Accordion title="Modello non disponibile">
    Esegui `openclaw models list --all --provider venice` per visualizzare i modelli
    attualmente disponibili; il catalogo cambia quando Venice aggiunge o ritira modelli.
  </Accordion>

  <Accordion title="Problemi di connessione">
    L'API Venice si trova all'indirizzo `https://api.venice.ai/api/v1`. Verifica che la rete consenta connessioni HTTPS a tale host.
  </Accordion>
</AccordionGroup>

<Note>
Ulteriori informazioni: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
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

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Homepage di Venice AI e registrazione dell'account.
  </Card>
  <Card title="Documentazione API" href="https://docs.venice.ai" icon="book">
    Riferimento dell'API Venice e documentazione per sviluppatori.
  </Card>
  <Card title="Prezzi" href="https://venice.ai/pricing" icon="credit-card">
    Tariffe attuali dei crediti e piani di Venice.
  </Card>
</CardGroup>
