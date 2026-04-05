---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - Ti servono la variabile d'ambiente della chiave API di Fireworks o l'ID del modello predefinito
summary: Configurazione di Fireworks (autenticazione + selezione del modello)
x-i18n:
    generated_at: "2026-04-05T14:01:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. OpenClaw ora include un plugin provider Fireworks integrato.

- Provider: `fireworks`
- Autenticazione: `FIREWORKS_API_KEY`
- API: chat/completions compatibile con OpenAI
- URL di base: `https://api.fireworks.ai/inference/v1`
- Modello predefinito: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Avvio rapido

Configura l'autenticazione di Fireworks tramite onboarding:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Questo memorizza la tua chiave Fireworks nella configurazione di OpenClaw e imposta il modello iniziale Fire Pass come predefinito.

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Nota sull'ambiente

Se il Gateway viene eseguito fuori dalla tua shell interattiva, assicurati che `FIREWORKS_API_KEY`
sia disponibile anche per quel processo. Una chiave presente solo in `~/.profile` non
aiuterà un daemon launchd/systemd a meno che quell'ambiente non venga importato anche lì.

## Catalogo integrato

| Riferimento modello                                     | Nome                        | Input      | Contesto | Output massimo | Note                                         |
| ------------------------------------------------------- | --------------------------- | ---------- | -------- | -------------- | -------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000        | Modello iniziale predefinito incluso in Fireworks |

## ID modello Fireworks personalizzati

OpenClaw accetta anche ID modello Fireworks dinamici. Usa l'ID esatto del modello o del router mostrato da Fireworks e anteponi `fireworks/`.

Esempio:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Se Fireworks pubblica un modello più recente, come una nuova release Qwen o Gemma, puoi passare direttamente a quel modello usando il suo ID modello Fireworks senza aspettare un aggiornamento del catalogo integrato.
