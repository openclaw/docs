---
read_when:
    - Vuoi i modelli GLM in OpenClaw
    - Hai bisogno della convenzione di naming dei modelli e della configurazione initiale
summary: Panoramica della famiglia di modelli GLM + come usarla in OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T08:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Modelli GLM

GLM è una **famiglia di modelli** (non un’azienda) disponibile tramite la piattaforma Z.AI. In OpenClaw, i modelli
GLM sono accessibili tramite il provider `zai` e ID modello come `zai/glm-5`.

## Per iniziare

<Steps>
  <Step title="Scegli un percorso di autenticazione ed esegui l’onboarding">
    Scegli l’opzione di onboarding che corrisponde al tuo piano Z.AI e alla tua regione:

    | Scelta auth | Ideale per |
    | ----------- | ---------- |
    | `zai-api-key` | Configurazione generica con chiave API e auto-rilevamento dell’endpoint |
    | `zai-coding-global` | Utenti Coding Plan (globale) |
    | `zai-coding-cn` | Utenti Coding Plan (regione Cina) |
    | `zai-global` | API generale (globale) |
    | `zai-cn` | API generale (regione Cina) |

    ```bash
    # Esempio: auto-rilevamento generico
    openclaw onboard --auth-choice zai-api-key

    # Esempio: Coding Plan globale
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Imposta GLM come modello predefinito">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Esempio di configurazione

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` permette a OpenClaw di rilevare l’endpoint Z.AI corrispondente dalla chiave e
applicare automaticamente il base URL corretto. Usa le scelte regionali esplicite quando
vuoi forzare una specifica superficie Coding Plan o API generale.
</Tip>

## Catalogo integrato

OpenClaw attualmente inizializza il provider incluso `zai` con questi riferimenti GLM:

| Modello       | Modello          |
| ------------- | ---------------- |
| `glm-5.1`     | `glm-4.7`        |
| `glm-5`       | `glm-4.7-flash`  |
| `glm-5-turbo` | `glm-4.7-flashx` |
| `glm-5v-turbo`| `glm-4.6`        |
| `glm-4.5`     | `glm-4.6v`       |
| `glm-4.5-air` |                  |
| `glm-4.5-flash` |                |
| `glm-4.5v`    |                  |

<Note>
Il riferimento modello incluso predefinito è `zai/glm-5.1`. Le versioni GLM e la disponibilità
possono cambiare; controlla la documentazione Z.AI per le informazioni più aggiornate.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Auto-rilevamento dell’endpoint">
    Quando usi la scelta di autenticazione `zai-api-key`, OpenClaw ispeziona il formato della chiave
    per determinare il base URL Z.AI corretto. Le scelte regionali esplicite
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) sostituiscono
    il rilevamento automatico e fissano direttamente l’endpoint.
  </Accordion>

  <Accordion title="Dettagli del provider">
    I modelli GLM sono serviti dal provider runtime `zai`. Per la configurazione completa del provider,
    endpoint regionali e capacità aggiuntive, vedi
    [documentazione del provider Z.AI](/it/providers/zai).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider Z.AI" href="/it/providers/zai" icon="server">
    Configurazione completa del provider Z.AI ed endpoint regionali.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
</CardGroup>
