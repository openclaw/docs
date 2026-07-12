---
read_when:
    - Vuoi accedere ai modelli ospitati su OpenCode
    - Vuoi scegliere tra i cataloghi Zen e Go
summary: Usa i cataloghi OpenCode Zen e Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T07:25:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode espone due cataloghi in hosting in OpenClaw:

| Catalogo | Prefisso          | Provider di runtime |
| -------- | ----------------- | ------------------- |
| **Zen**  | `opencode/...`    | `opencode`          |
| **Go**   | `opencode-go/...` | `opencode-go`       |

Entrambi i cataloghi condividono un'unica chiave API OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). OpenClaw mantiene separati gli ID dei provider di runtime affinché
l'instradamento upstream per modello rimanga corretto, ma l'onboarding e la documentazione li trattano come
un'unica configurazione OpenCode.

## Per iniziare

<Tabs>
  <Tab title="Catalogo Zen">
    **Ideale per:** il proxy multimodello OpenCode selezionato (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Imposta un modello Zen come predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalogo Go">
    **Ideale per:** la selezione di modelli Kimi, GLM, MiniMax, Qwen e DeepSeek ospitata da OpenCode.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## Esempio di configurazione

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Cataloghi integrati

### Zen

| Proprietà          | Valore                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Provider di runtime | `opencode`                                                                                    |
| Modelli di esempio | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Esegui `openclaw models list --provider opencode` per visualizzare l'elenco completo attuale, che
include anche voci del piano gratuito come `opencode/big-pickle` e
`opencode/deepseek-v4-flash-free`.

### Go

| Proprietà          | Valore                                                                   |
| ------------------ | ------------------------------------------------------------------------ |
| Provider di runtime | `opencode-go`                                                            |
| Modelli di esempio | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Consulta [OpenCode Go](/it/providers/opencode-go) per la tabella completa dei modelli Go.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Alias delle chiavi API">
    `OPENCODE_ZEN_API_KEY` è accettata anche come alias di `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenziali condivise">
    L'inserimento di una singola chiave OpenCode durante la configurazione memorizza le credenziali per entrambi i provider di
    runtime. Non è necessario eseguire separatamente l'onboarding di ciascun catalogo.
  </Accordion>

  <Accordion title="Come ottenere una chiave API">
    Crea un account OpenCode e genera una chiave API su
    [opencode.ai/auth](https://opencode.ai/auth). La fatturazione e la disponibilità del catalogo
    sono gestite dalla dashboard di OpenCode.
  </Accordion>

  <Accordion title="Comportamento di replay di Gemini">
    I riferimenti OpenCode basati su Gemini rimangono nel percorso proxy-Gemini, quindi OpenClaw mantiene
    la sanitizzazione delle firme di ragionamento di Gemini senza abilitare la convalida nativa del
    replay di Gemini o le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Comportamento di replay per modelli non Gemini">
    I riferimenti OpenCode non basati su Gemini mantengono i criteri minimi di replay compatibili con OpenAI.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/it/providers/opencode-go" icon="server">
    Riferimento completo del catalogo Go.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo per la configurazione di agenti, modelli e provider.
  </Card>
</CardGroup>
