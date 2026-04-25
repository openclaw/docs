---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Hai bisogno dei riferimenti di modello runtime per i modelli ospitati su Go
summary: Usa il catalogo OpenCode Go con la configurazione OpenCode condivisa
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go è il catalogo Go all'interno di [OpenCode](/it/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l'ID provider
runtime `opencode-go` così che il routing upstream per modello resti corretto.

| Proprietà       | Valore                          |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Autenticazione   | `OPENCODE_API_KEY`              |
| Configurazione padre | [OpenCode](/it/providers/opencode) |

## Catalogo integrato

OpenClaw ricava la maggior parte delle righe del catalogo Go dal registro dei modelli pi integrato e
integra le righe upstream correnti mentre il registro si aggiorna. Esegui
`openclaw models list --provider opencode-go` per l'elenco corrente dei modelli.

Il provider include:

| Riferimento modello             | Nome                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (limiti 3x) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## Per iniziare

<Tabs>
  <Tab title="Interattivo">
    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Imposta un modello Go come predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
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
      <Step title="Passa la chiave direttamente">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento del routing">
    OpenClaw gestisce automaticamente il routing per modello quando il riferimento del modello usa
    `opencode-go/...`. Non è richiesta alcuna configurazione aggiuntiva del provider.
  </Accordion>

  <Accordion title="Convenzione dei riferimenti runtime">
    I riferimenti runtime restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
    Questo mantiene corretto il routing upstream per modello in entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    La stessa `OPENCODE_API_KEY` è usata sia dal catalogo Zen sia da quello Go. Inserendo
    la chiave durante la configurazione vengono archiviate le credenziali per entrambi i provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Vedi [OpenCode](/it/providers/opencode) per la panoramica condivisa dell'onboarding e il riferimento completo
dei cataloghi Zen + Go.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenCode (padre)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti di modello e comportamento di failover.
  </Card>
</CardGroup>
