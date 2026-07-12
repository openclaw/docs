---
read_when:
    - Vuoi eseguire OpenClaw con i modelli NovitaAI
    - Ti serve l'ID, la chiave o l'endpoint del provider Novita
summary: Usa l'API compatibile con OpenAI di NovitaAI con OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T07:25:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI è un provider di infrastruttura IA in hosting con un'API compatibile con OpenAI.
È incluso come provider integrato di OpenClaw (non è necessario installare un plugin separato), quindi
le credenziali vengono gestite tramite il normale flusso di autenticazione dei modelli e i riferimenti ai modelli hanno un formato simile a
`novita/deepseek/deepseek-v3-0324`.

## Configurazione

Crea una chiave API in [novita.ai/settings/key-management](https://novita.ai/settings/key-management), quindi esegui:

```bash
openclaw onboard --auth-choice novita-api-key
```

In alternativa, imposta:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Valori predefiniti

| Impostazione        | Valore                             |
| ------------------- | ---------------------------------- |
| ID del provider     | `novita`                           |
| Alias               | `novita-ai`, `novitaai`            |
| URL di base         | `https://api.novita.ai/openai/v1`  |
| Variabile d'ambiente | `NOVITA_API_KEY`                  |
| Modello predefinito | `novita/deepseek/deepseek-v3-0324` |

## Catalogo dei modelli integrati

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Questo è un punto di partenza, non un catalogo aggiornato in tempo reale. Il tuo account, la tua regione o
l'offerta attuale di Novita potrebbero aggiungere, rimuovere o limitare alcune route. Verifica prima
di impostare un valore predefinito a lungo termine:

```bash
openclaw models list --provider novita
```

## Quando scegliere Novita

- Accesso in hosting a modelli con pesi aperti tramite un'API compatibile con OpenAI.
- Route per le famiglie DeepSeek, Kimi, MiniMax, GLM o Qwen tramite un unico account
  del provider.
- Un ulteriore percorso di fallback in hosting accanto a DeepInfra, GMI, OpenRouter o alle API
  dirette dei fornitori.
- Hosting dei modelli lato provider invece di gestire un'infrastruttura LM Studio, Ollama,
  SGLang o vLLM.

Scegli un provider diretto del fornitore quando sono necessari parametri di richiesta
nativi del fornitore o contratti di assistenza. Scegli un provider locale quando il modello deve
essere eseguito sul tuo hardware o entro il perimetro della tua rete.

## Risoluzione dei problemi

- `401`/`403`: verifica la chiave nella pagina di gestione delle chiavi di Novita ed esegui nuovamente
  `openclaw onboard --auth-choice novita-api-key` se il profilo memorizzato non è più
  aggiornato.
- Errori di modello sconosciuto: usa il valore esatto `novita/<route-id>` restituito da
  `openclaw models list --provider novita`.
- Route lente o non riuscite: prova un'altra route di modello Novita oppure imposta Novita come
  provider di fallback per i carichi di lavoro che possono tollerare variazioni
  specifiche del provider.

## Contenuti correlati

- [Provider di modelli](/it/concepts/model-providers)
- [Directory dei provider](/it/providers/index)
