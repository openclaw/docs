---
x-i18n:
    generated_at: "2026-04-05T14:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Usa Qwen Cloud tramite il provider qwen bundled di OpenClaw"
read_when:

- Vuoi usare Qwen con OpenClaw
- In precedenza usavi Qwen OAuth
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth è stato rimosso.** L'integrazione OAuth del piano gratuito
(`qwen-portal`) che usava gli endpoint `portal.qwen.ai` non è più disponibile.
Vedi [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) per il
contesto.

</Warning>

## Consigliato: Qwen Cloud

OpenClaw ora tratta Qwen come un provider bundled di prima classe con ID canonico
`qwen`. Il provider bundled punta agli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan e mantiene gli ID legacy `modelstudio` come alias di
compatibilità.

- Provider: `qwen`
- Variabile env preferita: `QWEN_API_KEY`
- Accettate anche per compatibilità: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Stile API: compatibile con OpenAI

Se vuoi `qwen3.6-plus`, preferisci l'endpoint **Standard (pay-as-you-go)**.
Il supporto Coding Plan può restare indietro rispetto al catalogo pubblico.

```bash
# Endpoint globale Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint China Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint globale Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Gli ID auth-choice legacy `modelstudio-*` e i ref modello `modelstudio/...` continuano
a funzionare come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli ID
auth-choice canonici `qwen-*` e i ref modello `qwen/...`.

Dopo l'onboarding, imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Piano delle capacità

L'estensione `qwen` sta venendo posizionata come sede vendor per l'intera superficie
Qwen Cloud, non solo per modelli coding/testuali.

- Modelli testo/chat: bundled ora
- Tool calling, output strutturato, thinking: ereditati dal trasporto compatibile con OpenAI
- Generazione di immagini: pianificata a livello di provider-plugin
- Comprensione immagini/video: bundled ora sull'endpoint Standard
- Voce/audio: pianificati a livello di provider-plugin
- Embedding/reranking della memory: pianificati tramite la superficie dell'adapter embedding
- Generazione video: bundled ora tramite la capacità condivisa di generazione video

## Estensioni multimodali

L'estensione `qwen` ora espone anche:

- Comprensione video tramite `qwen-vl-max-latest`
- Generazione video Wan tramite:
  - `wan2.6-t2v` (predefinito)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Queste superfici multimodali usano gli endpoint DashScope **Standard**, non gli
endpoint Coding Plan.

- Base URL Standard globale/intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Per la generazione video, OpenClaw mappa la regione Qwen configurata all'host
DashScope AIGC corrispondente prima di inviare il job:

- Globale/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Questo significa che un normale `models.providers.qwen.baseUrl` che punta a uno degli host
Qwen Coding Plan o Standard mantiene comunque la generazione video sul corretto
endpoint video DashScope regionale.

Per la generazione video, imposta esplicitamente un modello predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limiti attuali bundled per la generazione video Qwen:

- Fino a **1** video di output per richiesta
- Fino a **1** immagine di input
- Fino a **4** video di input
- Fino a **10 secondi** di durata
- Supporta `size`, `aspectRatio`, `resolution`, `audio`, e `watermark`

Vedi [Qwen / Model Studio](/providers/qwen_modelstudio) per dettagli a livello di endpoint
e note di compatibilità.
