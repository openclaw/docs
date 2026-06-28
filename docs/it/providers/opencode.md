---
read_when:
    - Vuoi l'accesso ai modelli ospitati da OpenCode
    - Vuoi scegliere tra i cataloghi Zen e Go
summary: Usa i cataloghi OpenCode Zen e Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode espone due cataloghi ospitati in OpenClaw:

| Catalogo | Prefisso          | Provider runtime |
| -------- | ----------------- | ---------------- |
| **Zen**  | `opencode/...`    | `opencode`       |
| **Go**   | `opencode-go/...` | `opencode-go`    |

Entrambi i cataloghi usano la stessa chiave API OpenCode. OpenClaw mantiene separati
gli ID dei provider runtime, così il routing upstream per modello resta corretto, ma
l’onboarding e la documentazione li trattano come un’unica configurazione OpenCode.

## Per iniziare

<Tabs>
  <Tab title="Zen catalog">
    **Ideale per:** il proxy multi-modello OpenCode curato (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Ideale per:** la gamma Kimi, GLM e MiniMax ospitata da OpenCode.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
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

| Proprietà        | Valore                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Provider runtime | `opencode`                                                                                    |
| Modelli di esempio | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Proprietà        | Valore                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Provider runtime | `opencode-go`                                                            |
| Modelli di esempio | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` è supportata anche come alias di `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Inserire una chiave OpenCode durante la configurazione salva le credenziali per
    entrambi i provider runtime. Non è necessario eseguire l’onboarding di ciascun
    catalogo separatamente.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Accedi a OpenCode, aggiungi i dettagli di fatturazione e copia la tua chiave API.
    La fatturazione e la disponibilità del catalogo sono gestite dalla dashboard OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    I riferimenti OpenCode basati su Gemini restano sul percorso proxy-Gemini, quindi
    OpenClaw mantiene lì la sanitizzazione delle firme di pensiero Gemini senza
    abilitare la convalida nativa del replay Gemini o le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    I riferimenti OpenCode non Gemini mantengono la policy di replay minima compatibile
    con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Inserire una chiave OpenCode durante la configurazione salva le credenziali per entrambi
i provider runtime Zen e Go, quindi devi eseguire l’onboarding una sola volta.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo di configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
