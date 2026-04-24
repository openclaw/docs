---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - Hai bisogno della variabile d’ambiente della chiave API o della scelta di autenticazione CLI
summary: Configurazione di DeepSeek (autenticazione + selezione del modello)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T08:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli AI con un’API OpenAI-compatible.

| Proprietà | Valore                     |
| --------- | -------------------------- |
| Provider  | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | OpenAI-compatible          |
| Base URL  | `https://api.deepseek.com` |

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Questo chiederà la tua chiave API e imposterà `deepseek/deepseek-chat` come modello predefinito.

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configurazione non interattiva">
    Per installazioni scriptate o headless, passa direttamente tutti i flag:

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
Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `DEEPSEEK_API_KEY`
sia disponibile per quel processo (per esempio in `~/.openclaw/.env` oppure tramite
`env.shellEnv`).
</Warning>

## Catalogo integrato

| Riferimento modello          | Nome              | Input | Contesto | Output max | Note                                                |
| ---------------------------- | ----------------- | ----- | -------- | ---------- | --------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192      | Modello predefinito; superficie non-thinking DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536     | Superficie V3.2 con ragionamento abilitato          |

<Tip>
Entrambi i modelli inclusi attualmente dichiarano compatibilità con l’uso in streaming nel sorgente.
</Tip>

## Esempio di configurazione

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
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
