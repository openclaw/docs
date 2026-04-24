---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - Ti serve la variabile d'ambiente della chiave API o l'opzione di autenticazione della CLI
summary: Configurazione di DeepSeek (autenticazione + selezione del modello)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:23:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli di IA con un'API compatibile con OpenAI.

| Proprietà | Valore                     |
| --------- | -------------------------- |
| Provider  | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | Compatibile con OpenAI     |
| URL di base | `https://api.deepseek.com` |

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Ti verrà chiesta la chiave API e `deepseek/deepseek-v4-flash` verrà impostato come modello predefinito.

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configurazione non interattiva">
    Per installazioni con script o headless, passa direttamente tutti i flag:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Se il Gateway è in esecuzione come demone (launchd/systemd), assicurati che `DEEPSEEK_API_KEY`
sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).
</Warning>

## Catalogo integrato

| Riferimento modello          | Nome              | Input | Contesto  | Output max | Note                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Modello predefinito; superficie V4 con capacità di thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Superficie V4 con capacità di thinking     |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Superficie non-thinking DeepSeek V3.2      |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Superficie V3.2 con ragionamento abilitato |

<Tip>
I modelli V4 supportano il controllo `thinking` di DeepSeek. OpenClaw riproduce anche
`reasoning_content` di DeepSeek nei turni successivi, così le sessioni di thinking con chiamate
agli strumenti possono continuare.
</Tip>

## Esempio di configurazione

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
