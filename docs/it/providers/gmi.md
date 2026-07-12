---
read_when:
    - Vuoi eseguire OpenClaw con i modelli GMI Cloud
    - Sono necessari l'ID provider, la chiave o l'endpoint GMI
summary: Usa l'API compatibile con OpenAI di GMI Cloud con OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T07:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud è una piattaforma di inferenza in hosting per modelli di frontiera e a pesi aperti
accessibili tramite un'API compatibile con OpenAI. In OpenClaw è un plugin provider
esterno ufficiale: installalo una sola volta, archivia le credenziali tramite la normale autenticazione
dei modelli e usa riferimenti ai modelli come `gmi/google/gemini-3.1-flash-lite`.

Usa GMI quando desideri un'unica chiave API per diverse famiglie di modelli in hosting, incluse
le route Anthropic, DeepSeek, Google, Moonshot, OpenAI e Z.AI esposte dal catalogo
di GMI. Funziona come provider secondario per il fallback dei modelli, per confrontare
route in hosting di diversi fornitori o quando GMI rende disponibile un modello prima del
tuo provider principale. OpenClaw gestisce l'id del provider, il profilo di autenticazione, gli alias,
la configurazione iniziale del catalogo dei modelli e l'URL di base; GMI gestisce la disponibilità effettiva dei modelli, la fatturazione,
i limiti di frequenza e qualsiasi criterio di instradamento lato provider.

| Proprietà                  | Valore                                   |
| -------------------------- | ---------------------------------------- |
| Id del provider            | `gmi` (alias: `gmi-cloud`, `gmicloud`)   |
| Pacchetto                  | `@openclaw/gmi-provider`                 |
| Variabile d'ambiente auth  | `GMI_API_KEY`                            |
| API                        | Compatibile con OpenAI (`openai-completions`) |
| URL di base                | `https://api.gmi-serving.com/v1`         |
| Modello predefinito        | `gmi/google/gemini-3.1-flash-lite`       |

## Configurazione

Installa il plugin, riavvia il Gateway, quindi crea una chiave API in GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Quindi esegui:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Le configurazioni non interattive possono passare `--gmi-api-key <key>` oppure impostare:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Quando scegliere GMI

- Desideri un endpoint compatibile con OpenAI in hosting anziché un server di modelli locale.
- Desideri provare diverse famiglie di modelli commerciali e a pesi aperti tramite un unico
  account del provider.
- Desideri un provider di fallback con un instradamento a monte diverso da DeepInfra,
  OpenRouter, Together o dalle API dirette dei fornitori.
- Ti servono id dei modelli, prezzi o controlli dell'account specifici di GMI.

Scegli invece il provider diretto del fornitore quando ti servono funzionalità native
che GMI non espone tramite la propria route compatibile con OpenAI. Scegli un provider
locale come LM Studio, Ollama, SGLang o vLLM quando la località dei dati o il controllo
della GPU locale sono più importanti della praticità dell'hosting.

## Modelli

Il catalogo del plugin include come configurazione iniziale gli id delle route GMI Cloud comunemente disponibili:

| Riferimento del modello             | Input          | Contesto  | Output massimo |
| ----------------------------------- | -------------- | --------- | -------------- |
| `gmi/anthropic/claude-sonnet-4.6`   | testo + immagine | 200,000   | 64,000         |
| `gmi/deepseek-ai/DeepSeek-V3.2`     | testo          | 163,840   | 65,536         |
| `gmi/google/gemini-3.1-flash-lite`  | testo + immagine | 1,048,576 | 65,536         |
| `gmi/moonshotai/Kimi-K2.5`          | testo + immagine | 262,144   | 65,536         |
| `gmi/openai/gpt-5.4`                | testo + immagine | 400,000   | 128,000        |
| `gmi/zai-org/GLM-5.1-FP8`           | testo          | 202,752   | 65,536         |

Il catalogo è una configurazione iniziale, non una garanzia che ogni account possa chiamare ogni modello
in qualsiasi momento. Elenca ciò che il provider configurato segnala nel tuo ambiente:

```bash
openclaw models list --provider gmi
```

## Risoluzione dei problemi

- `401` o `403`: verifica che `GMI_API_KEY` sia impostata per il processo che esegue
  OpenClaw oppure ripeti la procedura di onboarding per archiviare la chiave nel profilo di autenticazione del provider.
- Errori di modello sconosciuto: verifica che il modello esista nel tuo account GMI e usa il
  riferimento completo `gmi/<route-id>` mostrato da `openclaw models list --provider gmi`.
- Errori intermittenti del provider: prova una route GMI diversa oppure configura GMI come
  fallback anziché come unico provider principale dei modelli.

## Argomenti correlati

- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
