---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Ti servono i riferimenti dei modelli di runtime per i modelli ospitati in Go
summary: Usa il catalogo Go di OpenCode con la configurazione condivisa di OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:08:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go è il catalogo Go all'interno di [OpenCode](/it/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l'id provider
runtime `opencode-go` così che l'instradamento upstream per modello resti corretto.

| Proprietà        | Valore                          |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Setup padre      | [OpenCode](/it/providers/opencode) |

## Catalogo integrato

OpenClaw ricava la maggior parte delle righe del catalogo Go dal registro modelli OpenClaw integrato e
integra le righe upstream correnti mentre il registro si aggiorna. Esegui
`openclaw models list --provider opencode-go` per l'elenco dei modelli corrente.

Il provider include:

| Rif. modello                    | Nome                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (limiti 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 usa una finestra di contesto da 1M token e supporta fino a 131K token di output.

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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di instradamento">
    OpenClaw gestisce automaticamente l'instradamento per modello quando il rif. modello usa
    `opencode-go/...`. Non è necessaria alcuna configurazione aggiuntiva del provider.
  </Accordion>

  <Accordion title="Convenzione dei rif. runtime">
    I rif. runtime restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
    Questo mantiene corretto l'instradamento upstream per modello in entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    La stessa `OPENCODE_API_KEY` viene usata sia dal catalogo Zen sia dal catalogo Go. Inserire
    la chiave durante il setup salva le credenziali per entrambi i provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/it/providers/opencode) per la panoramica condivisa dell'onboarding e il riferimento completo
del catalogo Zen + Go.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenCode (padre)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, rif. modello e comportamento di failover.
  </Card>
</CardGroup>
