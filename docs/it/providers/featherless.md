---
read_when:
    - Vuoi utilizzare Featherless AI con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API di Featherless o il formato del riferimento al modello
summary: Configurazione di Featherless AI, selezione del modello e chiamata degli strumenti
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T07:24:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) rende disponibili modelli aperti tramite un'API
compatibile con OpenAI. OpenClaw installa Featherless come Plugin provider esterno
ufficiale e mantiene ridotto il catalogo integrato, accettando durante l'esecuzione
gli ID modello esatti di Featherless.

| Proprietà                    | Valore                                   |
| ---------------------------- | ---------------------------------------- |
| ID provider                  | `featherless`                            |
| Pacchetto                    | `@openclaw/featherless-provider`         |
| Variabile d'ambiente di autenticazione | `FEATHERLESS_API_KEY`          |
| Flag di configurazione iniziale | `--auth-choice featherless-api-key`   |
| Flag CLI diretto             | `--featherless-api-key <key>`            |
| API                          | compatibile con OpenAI (`openai-completions`) |
| URL di base                  | `https://api.featherless.ai/v1`          |
| Modello predefinito          | `featherless/Qwen/Qwen3-32B`             |

## Configurazione

Installa il Plugin e riavvia il Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Esegui la configurazione iniziale:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Per la configurazione non interattiva:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

In alternativa, rendi disponibile la chiave al processo Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Verifica il provider:

```bash
openclaw models list --provider featherless
```

## Modello predefinito

Il Plugin usa `Qwen/Qwen3-32B` come impostazione predefinita perché Featherless
documenta il supporto nativo per le chiamate agli strumenti nella famiglia Qwen 3.
OpenClaw configura la finestra di contesto da 32.768 token, un limite di output
prudenziale di 4.096 token e i controlli di ragionamento del modello di chat Qwen.

I campi relativi ai costi nel catalogo sono impostati a zero perché Featherless
supporta più modalità di fatturazione e OpenClaw non incorpora tariffe specifiche
del piano dell'account o basate sulle richieste.

## Altri modelli Featherless

Usa l'ID modello Featherless esatto dopo il prefisso provider `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw non copia deliberatamente l'intero indice pubblico dei modelli di
Featherless nel selettore. L'indice è ampio e non espone metadati strutturati
sufficienti sulle funzionalità per classificare in modo sicuro ogni modello di
testo, visione, embedding e ragionamento. Gli ID sconosciuti vengono quindi
risolti con impostazioni predefinite prudenziali, limitate al testo e senza
ragionamento: una finestra di contesto da 4.096 token e un limite di output di
1.024 token.

Aggiungi una voce esplicita per il modello del provider quando un modello
richiede metadati diversi:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Prima di aggiungere metadati personalizzati, consulta il catalogo dei modelli
Featherless per verificarne la disponibilità attuale e le etichette delle
funzionalità.

## Risoluzione dei problemi

- `401` o `403`: verifica che `FEATHERLESS_API_KEY` sia visibile al processo
  Gateway oppure esegui nuovamente la configurazione iniziale.
- Modello sconosciuto: usa l'ID esatto con distinzione tra maiuscole e minuscole
  fornito da Featherless dopo il prefisso `featherless/`.
- Chiamate agli strumenti restituite come testo: scegli una famiglia di modelli
  per la quale Featherless documenta il supporto nativo delle chiamate di
  funzione, come Qwen 3.
- Il Gateway gestito non rileva la chiave: inseriscila in `~/.openclaw/.env` o
  in un'altra origine delle variabili d'ambiente caricata dal servizio, quindi
  riavvia il Gateway.

## Contenuti correlati

- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
- [Modalità di ragionamento](/it/tools/thinking)
