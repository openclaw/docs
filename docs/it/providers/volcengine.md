---
read_when:
    - Vuoi usare Volcano Engine o modelli Doubao con OpenClaw
    - Ti serve la configurazione della chiave API di Volcengine
summary: Configurazione di Volcano Engine (modelli Doubao, endpoint generali e di coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T14:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Il provider Volcengine offre accesso ai modelli Doubao e ai modelli di terze parti
ospitati su Volcano Engine, con endpoint separati per carichi di lavoro generali e di coding.

- Provider: `volcengine` (generale) + `volcengine-plan` (coding)
- Autenticazione: `VOLCANO_ENGINE_API_KEY`
- API: compatibile con OpenAI

## Avvio rapido

1. Imposta la chiave API:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Provider ed endpoint

| Provider          | Endpoint                                  | Caso d'uso      |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelli generali |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelli di coding |

Entrambi i provider sono configurati da un'unica chiave API. Il setup registra
automaticamente entrambi.

## Modelli disponibili

Provider generale (`volcengine`):

| Riferimento modello                           | Nome                            | Input       | Contesto |
| --------------------------------------------- | ------------------------------- | ----------- | -------- |
| `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | text, image | 256,000  |
| `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | text, image | 256,000  |
| `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | text, image | 256,000  |
| `volcengine/glm-4-7-251222`                   | GLM 4.7                         | text, image | 200,000  |
| `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | text, image | 128,000  |

Provider di coding (`volcengine-plan`):

| Riferimento modello                                | Nome                     | Input | Contesto |
| -------------------------------------------------- | ------------------------ | ----- | -------- |
| `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | text  | 256,000  |
| `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | text  | 256,000  |
| `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | text  | 200,000  |
| `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | text  | 256,000  |
| `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | text  | 256,000  |
| `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | text  | 256,000  |

`openclaw onboard --auth-choice volcengine-api-key` imposta attualmente
`volcengine-plan/ark-code-latest` come modello predefinito registrando allo stesso tempo
il catalogo generale `volcengine`.

Durante la selezione del modello in onboarding/configurazione, la scelta di autenticazione Volcengine preferisce
sia le righe `volcengine/*` sia quelle `volcengine-plan/*`. Se quei modelli non sono
ancora caricati, OpenClaw ricade sul catalogo non filtrato invece di mostrare un
selettore vuoto limitato al provider.

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
`VOLCANO_ENGINE_API_KEY` sia disponibile per quel processo (ad esempio in
`~/.openclaw/.env` o tramite `env.shellEnv`).
