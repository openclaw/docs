---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Hai bisogno dei riferimenti modello runtime per i modelli ospitati da Go
summary: Usa il catalogo OpenCode Go con la configurazione condivisa di OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T08:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go è il catalogo Go all’interno di [OpenCode](/it/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l’ID provider runtime
`opencode-go` così l’instradamento upstream per modello resta corretto.

| Proprietà        | Valore                          |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Configurazione padre | [OpenCode](/it/providers/opencode) |

## Catalogo integrato

OpenClaw prende il catalogo Go dal registro dei modelli pi incluso. Esegui
`openclaw models list --provider opencode-go` per l’elenco attuale dei modelli.

Nel catalogo pi incluso, il provider include:

| Riferimento modello         | Nome                  |
| --------------------------- | --------------------- |
| `opencode-go/glm-5`         | GLM-5                 |
| `opencode-go/glm-5.1`       | GLM-5.1               |
| `opencode-go/kimi-k2.5`     | Kimi K2.5             |
| `opencode-go/kimi-k2.6`     | Kimi K2.6 (limiti 3x) |
| `opencode-go/mimo-v2-omni`  | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`   | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`  | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`  | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`  | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`  | Qwen3.6 Plus          |

## Per iniziare

<Tabs>
  <Tab title="Interattivo">
    <Steps>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Imposta un modello Go come predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non interattivo">
    <Steps>
      <Step title="Passa direttamente la chiave">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Esempio di configurazione

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di instradamento">
    OpenClaw gestisce automaticamente l’instradamento per modello quando il riferimento modello usa
    `opencode-go/...`. Non è richiesta alcuna configurazione provider aggiuntiva.
  </Accordion>

  <Accordion title="Convenzione dei riferimenti runtime">
    I riferimenti runtime restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
    Questo mantiene corretto l’instradamento upstream per modello su entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    La stessa `OPENCODE_API_KEY` viene usata sia dal catalogo Zen sia da quello Go. Inserendo
    la chiave durante la configurazione vengono memorizzate le credenziali per entrambi i provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Vedi [OpenCode](/it/providers/opencode) per la panoramica condivisa dell’onboarding e il riferimento completo del catalogo
Zen + Go.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenCode (padre)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
</CardGroup>
