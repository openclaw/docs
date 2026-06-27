---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - Ti serve la variabile d’ambiente della chiave API oppure la scelta di autenticazione della CLI
summary: Configurazione di DeepSeek (autenticazione + selezione del modello)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:06:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli di IA con un'API compatibile con OpenAI.

| Proprietà | Valore                     |
| --------- | -------------------------- |
| Provider  | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | compatibile con OpenAI     |
| URL di base | `https://api.deepseek.com` |

## Installa Plugin

Installa il Plugin ufficiale, poi riavvia Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Verrà richiesta la tua chiave API e `deepseek/deepseek-v4-flash` verrà impostato come modello predefinito.

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider deepseek
    ```

    Per ispezionare il catalogo statico del Plugin senza richiedere un Gateway in esecuzione,
    usa:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configurazione non interattiva">
    Per installazioni con script o senza interfaccia, passa direttamente tutti i flag:

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
Se Gateway viene eseguito come daemon (launchd/systemd), assicurati che `DEEPSEEK_API_KEY`
sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).
</Warning>

## Catalogo integrato

| Rif. modello                 | Nome              | Input | Contesto  | Output max | Note                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | testo | 1.000.000 | 384.000    | Modello predefinito; superficie V4 con capacità di thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | testo | 1.000.000 | 384.000    | Superficie V4 con capacità di thinking     |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | testo | 131.072   | 8.192      | Superficie DeepSeek V3.2 senza thinking    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | testo | 131.072   | 65.536     | Superficie V3.2 con reasoning abilitato    |

<Tip>
I modelli V4 supportano il controllo `thinking` di DeepSeek. OpenClaw riproduce anche
`reasoning_content` di DeepSeek nei turni successivi, così le sessioni di thinking con chiamate
agli strumenti possono continuare.
Usa `/think xhigh` o `/think max` con i modelli DeepSeek V4 per richiedere il
massimo `reasoning_effort` di DeepSeek.
</Tip>

## Thinking e strumenti

Le sessioni di thinking DeepSeek V4 hanno un contratto di replay più rigoroso rispetto alla maggior parte
dei provider compatibili con OpenAI: dopo che un turno con thinking abilitato usa strumenti, DeepSeek
si aspetta che i messaggi assistente riprodotti da quel turno includano
`reasoning_content` nelle richieste successive. OpenClaw gestisce questo all'interno del
Plugin DeepSeek, quindi il normale uso di strumenti multi-turno funziona con
`deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`.

Se passi una sessione esistente da un altro provider compatibile con OpenAI a un
modello DeepSeek V4, i turni precedenti di chiamata strumento dell'assistente potrebbero non avere
`reasoning_content` nativo di DeepSeek. OpenClaw compila quel campo mancante nei messaggi
assistente riprodotti per le richieste di thinking DeepSeek V4, così il provider può accettare
la cronologia senza richiedere `/new`.

Quando il thinking è disabilitato in OpenClaw (inclusa la selezione **Nessuna** nell'interfaccia),
OpenClaw invia a DeepSeek `thinking: { type: "disabled" }` e rimuove
`reasoning_content` riprodotto dalla cronologia in uscita. Questo mantiene le sessioni con thinking
disabilitato sul percorso DeepSeek senza thinking.

Usa `deepseek/deepseek-v4-flash` per il percorso rapido predefinito. Usa
`deepseek/deepseek-v4-pro` quando vuoi il modello V4 più potente e puoi accettare
costi o latenza superiori.

## Test live

La suite diretta dei modelli live include DeepSeek V4 nel set di modelli moderni. Per
eseguire solo i controlli diretti dei modelli DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Questo controllo live verifica sia che entrambi i modelli V4 possano completare sia che i turni successivi
con thinking/strumenti preservino il payload di replay richiesto da DeepSeek.

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
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
