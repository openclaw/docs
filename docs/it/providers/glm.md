---
read_when:
    - Vuoi usare i modelli GLM in OpenClaw
    - Sono necessarie la convenzione di denominazione dei modelli e la configurazione
summary: Panoramica della famiglia di modelli GLM e su come usarla in OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM è una famiglia di modelli (non un'azienda) disponibile tramite la piattaforma [Z.AI](https://z.ai). In OpenClaw, i modelli GLM sono accessibili tramite il provider `zai` incluso con riferimenti come `zai/glm-5.1`.

| Proprietà           | Valore                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| ID provider         | `zai`                                                                       |
| Plugin              | incluso, `enabledByDefault: true`                                           |
| Variabili env auth  | `ZAI_API_KEY` o `Z_AI_API_KEY`                                              |
| Scelte onboarding   | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | compatibile con OpenAI                                                      |
| URL di base predefinito | `https://api.z.ai/api/paas/v4`                                          |
| Predefinito suggerito | `zai/glm-5.1`                                                             |
| Modello immagine predefinito | `zai/glm-4.6v`                                                     |

## Per iniziare

<Steps>
  <Step title="Scegli una route di autenticazione ed esegui l'onboarding">
    Scegli l'opzione di onboarding che corrisponde al tuo piano e alla tua area geografica Z.AI. L'opzione generica `zai-api-key` rileva automaticamente l'endpoint corrispondente dalla forma della chiave; usa le opzioni regionali esplicite quando vuoi forzare uno specifico Coding Plan o una superficie API generale.

    | Scelta auth         | Ideale per                                           |
    | ------------------- | ---------------------------------------------------- |
    | `zai-api-key`       | Chiave API generica con rilevamento automatico dell'endpoint |
    | `zai-coding-global` | Utenti del Coding Plan (globale)                     |
    | `zai-coding-cn`     | Utenti del Coding Plan (area geografica Cina)        |
    | `zai-global`        | API generale (globale)                               |
    | `zai-cn`            | API generale (area geografica Cina)                  |

    <CodeGroup>

```bash Rilevamento automatico
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (globale)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (Cina)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API generale (globale)
openclaw onboard --auth-choice zai-global
```

```bash API generale (Cina)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

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
  `zai-api-key` consente a OpenClaw di rilevare l'endpoint Z.AI corrispondente dalla forma della chiave e applicare automaticamente l'URL di base corretto. Usa le opzioni regionali esplicite quando vuoi fissare uno specifico Coding Plan o una superficie API generale.
</Tip>

## Catalogo integrato

Il provider `zai` incluso inizializza 13 riferimenti di modelli GLM. Tutte le voci supportano il ragionamento, salvo diversa indicazione; `glm-5v-turbo` e `glm-4.6v` accettano input immagine oltre al testo.

| Riferimento modello  | Note                                               |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Modello predefinito. Ragionamento, solo testo, contesto 202k. |
| `zai/glm-5`          | Ragionamento, solo testo, contesto 202k.           |
| `zai/glm-5-turbo`    | Ragionamento, solo testo, contesto 202k.           |
| `zai/glm-5v-turbo`   | Ragionamento, testo + immagine, contesto 202k.     |
| `zai/glm-4.7`        | Ragionamento, solo testo, contesto 204k.           |
| `zai/glm-4.7-flash`  | Ragionamento, solo testo, contesto 200k.           |
| `zai/glm-4.7-flashx` | Ragionamento, solo testo.                          |
| `zai/glm-4.6`        | Ragionamento, solo testo.                          |
| `zai/glm-4.6v`       | Ragionamento, testo + immagine. Modello immagine predefinito. |
| `zai/glm-4.5`        | Ragionamento, solo testo.                          |
| `zai/glm-4.5-air`    | Ragionamento, solo testo.                          |
| `zai/glm-4.5-flash`  | Ragionamento, solo testo.                          |
| `zai/glm-4.5v`       | Ragionamento, testo + immagine.                    |

<Note>
  Le versioni e la disponibilità di GLM possono cambiare. Esegui `openclaw models list --provider zai` per vedere le righe del catalogo note alla tua versione installata e consulta la documentazione di Z.AI per i modelli aggiunti di recente o deprecati.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Rilevamento automatico dell'endpoint">
    Quando usi l'opzione auth `zai-api-key`, OpenClaw ispeziona la forma della chiave per determinare l'URL di base Z.AI corretto. Le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) sovrascrivono il rilevamento automatico e fissano direttamente l'endpoint.
  </Accordion>

  <Accordion title="Dettagli del provider">
    I modelli GLM sono serviti dal provider runtime `zai`. Per la configurazione completa del provider, gli endpoint regionali e le funzionalità aggiuntive, consulta la [pagina del provider Z.AI](/it/providers/zai).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider Z.AI" href="/it/providers/zai" icon="server">
    Configurazione completa del provider Z.AI ed endpoint regionali.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Modalità di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli `/think` per la famiglia GLM con capacità di ragionamento.
  </Card>
  <Card title="FAQ sui modelli" href="/it/help/faq-models" icon="circle-question">
    Profili auth, cambio di modelli e risoluzione degli errori "no profile".
  </Card>
</CardGroup>
