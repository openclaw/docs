---
x-i18n:
    generated_at: "2026-04-05T14:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Dettagli degli endpoint per il provider qwen incluso e per la sua superficie di compatibilità legacy modelstudio"
read_when:

- Vuoi dettagli a livello di endpoint per Qwen Cloud / Alibaba DashScope
- Hai bisogno della spiegazione della compatibilità delle variabili env per il provider qwen
- Vuoi usare l'endpoint Standard (pay-as-you-go) o Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Questa pagina documenta la mappatura degli endpoint dietro il provider `qwen`
incluso in OpenClaw. Il provider mantiene funzionanti come alias di compatibilità
gli id provider, gli id auth-choice e i riferimenti ai modelli `modelstudio`,
mentre `qwen` diventa la superficie canonica.

<Info>

Se ti serve **`qwen3.6-plus`**, preferisci **Standard (pay-as-you-go)**. La
disponibilità del Coding Plan può essere in ritardo rispetto al catalogo
pubblico di Model Studio, e l'API del Coding Plan può rifiutare un modello
finché non compare nell'elenco dei modelli supportati dal tuo piano.

</Info>

- Provider: `qwen` (alias legacy: `modelstudio`)
- Auth: `QWEN_API_KEY`
- Accettati anche: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: compatibile con OpenAI

## Avvio rapido

### Standard (pay-as-you-go)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (abbonamento)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-api-key
```

Gli id auth-choice legacy `modelstudio-*` continuano a funzionare come alias di compatibilità, ma
gli id di onboarding canonici sono le scelte `qwen-*` mostrate sopra.

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

## Tipi di piano ed endpoint

| Piano                      | Regione | Auth choice                | Endpoint                                         |
| -------------------------- | ------- | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global  | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abbonamento)  | China   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abbonamento)  | Global  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Il provider seleziona automaticamente l'endpoint in base alla tua auth choice. Le scelte
canoniche usano la famiglia `qwen-*`; `modelstudio-*` resta solo per compatibilità.
Puoi
sovrascriverlo con un `baseUrl` personalizzato nella configurazione.

Gli endpoint nativi Model Studio dichiarano la compatibilità di utilizzo dello streaming sul
trasporto condiviso `openai-completions`. OpenClaw ora si basa sulle capacità dell'endpoint,
quindi gli id provider personalizzati compatibili con DashScope che puntano agli
stessi host nativi ereditano lo stesso comportamento di utilizzo dello streaming invece di
richiedere specificamente l'id del provider `qwen` integrato.

## Ottieni la tua chiave API

- **Gestisci chiavi**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentazione**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catalogo integrato

OpenClaw include attualmente questo catalogo Qwen integrato:

| Riferimento modello         | Input       | Contesto  | Note                                                |
| --------------------------- | ----------- | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modello predefinito                                 |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferisci endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linea Qwen Max                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                              |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                              |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Supporto al ragionamento                            |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                 |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                 |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI tramite Alibaba                         |

La disponibilità può comunque variare in base all'endpoint e al piano di fatturazione anche quando un modello è
presente nel catalogo integrato.

La compatibilità d'uso del native-streaming si applica sia agli host del Coding Plan sia
agli host Standard compatibili con DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilità di Qwen 3.6 Plus

`qwen3.6-plus` è disponibile sugli endpoint Standard (pay-as-you-go) di Model Studio:

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Se gli endpoint del Coding Plan restituiscono un errore "unsupported model" per
`qwen3.6-plus`, passa a Standard (pay-as-you-go) invece della coppia
endpoint/chiave del Coding Plan.

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
`QWEN_API_KEY` sia disponibile per quel processo (ad esempio in
`~/.openclaw/.env` o tramite `env.shellEnv`).
