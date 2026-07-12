---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Ti servono i riferimenti ai modelli di runtime per i modelli ospitati su Go
summary: Usa il catalogo OpenCode Go con la configurazione OpenCode condivisa
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T07:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go è il catalogo Go all'interno di [OpenCode](/it/providers/opencode). Condivide
la credenziale `OPENCODE_API_KEY` con il catalogo Zen, ma mantiene un proprio
ID del provider di runtime (`opencode-go`), affinché l'instradamento upstream per modello rimanga
corretto.

| Proprietà           | Valore                                             |
| ------------------- | -------------------------------------------------- |
| Provider di runtime | `opencode-go`                                      |
| Autenticazione      | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Configurazione principale | [OpenCode](/it/providers/opencode)               |

## Per iniziare

<Tabs>
  <Tab title="Interattiva">
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

  <Tab title="Non interattiva">
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

## Catalogo integrato

Esegui `openclaw models list --provider opencode-go` per visualizzare l'elenco attuale dei modelli.
Righe incluse:

| Riferimento del modello          | Nome              | Contesto  | Output massimo | Input immagine |
| -------------------------------- | ----------------- | --------- | -------------- | -------------- |
| `opencode-go/deepseek-v4-pro`    | DeepSeek V4 Pro   | 1M        | 384K           | No             |
| `opencode-go/deepseek-v4-flash`  | DeepSeek V4 Flash | 1M        | 384K           | No             |
| `opencode-go/glm-5`              | GLM-5             | 202,752   | 32,768         | No             |
| `opencode-go/glm-5.1`            | GLM-5.1           | 202,752   | 32,768         | No             |
| `opencode-go/glm-5.2`            | GLM-5.2           | 1M        | 131,072        | No             |
| `opencode-go/hy3-preview`        | Anteprima HY3     | 262,144   | 32,768         | No             |
| `opencode-go/kimi-k2.5`          | Kimi K2.5         | 262,144   | 65,536         | Sì             |
| `opencode-go/kimi-k2.6`          | Kimi K2.6         | 262,144   | 65,536         | Sì             |
| `opencode-go/kimi-k2.7-code`     | Kimi K2.7 Code    | 262,144   | 262,144        | Sì             |
| `opencode-go/mimo-v2.5`          | MiMo V2.5         | 1M        | 128,000        | Sì             |
| `opencode-go/mimo-v2.5-pro`      | MiMo V2.5 Pro     | 1,048,576 | 128,000        | No             |
| `opencode-go/minimax-m2.5`       | MiniMax M2.5      | 204,800   | 65,536         | No             |
| `opencode-go/minimax-m2.7`       | MiniMax M2.7      | 204,800   | 131,072        | No             |
| `opencode-go/minimax-m3`         | MiniMax M3        | 204,800   | 131,072        | No             |
| `opencode-go/qwen3.5-plus`       | Qwen3.5 Plus      | 262,144   | 65,536         | Sì             |
| `opencode-go/qwen3.6-plus`       | Qwen3.6 Plus      | 262,144   | 65,536         | Sì             |
| `opencode-go/qwen3.7-max`        | Qwen3.7 Max       | 1M        | 65,536         | No             |
| `opencode-go/qwen3.7-plus`       | Qwen3.7 Plus      | 1M        | 65,536         | Sì             |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento dell'instradamento">
    OpenClaw instrada automaticamente qualsiasi riferimento di modello `opencode-go/...`. Non è
    richiesta alcuna configurazione aggiuntiva del provider.
  </Accordion>

  <Accordion title="Convenzione dei riferimenti di runtime">
    I riferimenti di runtime rimangono espliciti: `opencode/...` per Zen, `opencode-go/...` per
    Go. Ciò mantiene corretto l'instradamento upstream per modello in entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    Un'unica `OPENCODE_API_KEY` copre sia il catalogo Zen sia quello Go. L'inserimento della
    chiave durante la configurazione memorizza le credenziali per entrambi i provider di runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/it/providers/opencode) per una panoramica dell'onboarding condiviso e il riferimento
completo dei cataloghi Zen e Go.
</Tip>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="OpenCode (principale)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
</CardGroup>
