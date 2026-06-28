---
read_when:
    - Vuoi accedere ai modelli ospitati da OpenCode
    - Vuoi scegliere tra i cataloghi Zen e Go
summary: Usa i cataloghi OpenCode Zen e Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode espone due cataloghi ospitati in OpenClaw:

| Catalogo | Prefisso          | Provider di runtime |
| --------- | ----------------- | ------------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Entrambi i cataloghi usano la stessa chiave API OpenCode. OpenClaw mantiene separati
gli id dei provider di runtime in modo che il routing upstream per modello resti corretto,
ma onboarding e documentazione li trattano come un'unica configurazione OpenCode.

## Per iniziare

<Tabs>
  <Tab title="Catalogo Zen">
    **Ideale per:** il proxy multimodello OpenCode curato (Claude, GPT, Gemini).

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
    **Ideale per:** la gamma OpenCode ospitata di Kimi, GLM e MiniMax.

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

| Proprietà        | Valore                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Provider di runtime | `opencode`                                                           |
| Modelli di esempio | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Proprietà        | Valore                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Provider di runtime | `opencode-go`                                                         |
| Modelli di esempio | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Alias della chiave API">
    Anche `OPENCODE_ZEN_API_KEY` è supportata come alias di `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenziali condivise">
    Inserire una chiave OpenCode durante la configurazione memorizza le credenziali per entrambi i provider
    di runtime. Non è necessario eseguire l'onboarding di ciascun catalogo separatamente.
  </Accordion>

  <Accordion title="Fatturazione e dashboard">
    Accedi a OpenCode, aggiungi i dettagli di fatturazione e copia la tua chiave API. La fatturazione
    e la disponibilità del catalogo sono gestite dalla dashboard OpenCode.
  </Accordion>

  <Accordion title="Comportamento di replay Gemini">
    I riferimenti OpenCode basati su Gemini restano nel percorso proxy-Gemini, quindi OpenClaw mantiene
    lì la sanificazione della thought-signature Gemini senza abilitare la validazione di replay Gemini
    nativa né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Comportamento di replay non-Gemini">
    I riferimenti OpenCode non-Gemini mantengono la policy minima di replay compatibile con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Inserire una chiave OpenCode durante la configurazione memorizza le credenziali per entrambi i provider di runtime Zen e
Go, quindi è sufficiente eseguire l'onboarding una sola volta.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
