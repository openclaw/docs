---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - Hai bisogno della variabile d'ambiente della chiave API o della scelta di autenticazione CLI
summary: Setup di DeepSeek (autenticazione + selezione del modello)
x-i18n:
    generated_at: "2026-04-05T14:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli AI con un'API compatibile con OpenAI.

- Provider: `deepseek`
- Autenticazione: `DEEPSEEK_API_KEY`
- API: compatibile con OpenAI
- URL di base: `https://api.deepseek.com`

## Avvio rapido

Imposta la chiave API (consigliato: memorizzarla per il Gateway):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Questo richiederà la tua chiave API e imposterà `deepseek/deepseek-chat` come modello predefinito.

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Nota sull'ambiente

Se il Gateway è in esecuzione come daemon (launchd/systemd), assicurati che `DEEPSEEK_API_KEY`
sia disponibile a quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Catalogo integrato

| Riferimento modello          | Nome              | Input | Contesto | Output massimo | Note                                                |
| ---------------------------- | ----------------- | ----- | -------- | -------------- | --------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192          | Modello predefinito; superficie non-thinking di DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536         | Superficie V3.2 con reasoning abilitato             |

Entrambi i modelli bundled attualmente dichiarano nel sorgente la compatibilità con l'uso dello streaming.

Ottieni la tua chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
