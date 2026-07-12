---
read_when:
    - Vuoi utilizzare la generazione di video Runway in OpenClaw
    - È necessario configurare la chiave API e la variabile d'ambiente di Runway
    - Vuoi impostare Runway come provider video predefinito
summary: Configurazione della generazione video con Runway in OpenClaw
title: Percorso di lancio
x-i18n:
    generated_at: "2026-07-12T07:26:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw include un provider `runway` integrato per la generazione di video in hosting, abilitato per impostazione predefinita e registrato secondo il contratto `videoGenerationProviders`.

| Proprietà                   | Valore                                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| ID del provider             | `runway`                                                                |
| Plugin                      | integrato, `enabledByDefault: true`                                     |
| Variabili di ambiente di autenticazione | `RUNWAYML_API_SECRET` (canonica) o `RUNWAY_API_KEY`          |
| Flag di onboarding          | `--auth-choice runway-api-key`                                          |
| Flag CLI diretto            | `--runway-api-key <key>`                                                |
| API                         | Generazione video Runway basata su attività (polling di `GET /v1/tasks/{id}`) |
| Modello predefinito         | `runway/gen4.5`                                                         |

## Guida introduttiva

<Steps>
  <Step title="Impostare la chiave API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Impostare Runway come provider video predefinito">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generare un video">
    Chiedi all'agente di generare un video. Runway verrà utilizzato automaticamente.
  </Step>
</Steps>

## Modalità e modelli supportati

Il provider offre sette modelli Runway suddivisi in tre modalità. Lo stesso ID modello può essere utilizzato per più modalità (ad esempio, `gen4.5` funziona sia per la conversione da testo a video sia per quella da immagine a video).

| Modalità                | Modelli                                                                 | Input di riferimento           |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| Da testo a video        | `gen4.5` (predefinito), `veo3.1`, `veo3.1_fast`, `veo3`                 | Nessuno                        |
| Da immagine a video     | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 immagine locale o remota     |
| Da video a video        | `gen4_aleph`                                                            | 1 video locale o remoto        |

I riferimenti a immagini e video locali sono supportati tramite URI di dati.

| Proporzioni immagine        | Valori consentiti                           |
| --------------------------- | ------------------------------------------- |
| Da testo a video            | `16:9`, `9:16`                              |
| Modifiche di immagini e video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  La conversione da video a video attualmente richiede `runway/gen4_aleph`. Gli altri ID modello Runway rifiutano gli input video di riferimento.
</Warning>

<Note>
  La selezione di un ID modello Runway dalla colonna errata produce un errore esplicito prima che la richiesta API lasci OpenClaw. Il provider convalida `model` rispetto all'elenco consentito della modalità (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) in `extensions/runway/video-generation-provider.ts`.
</Note>

## Configurazione

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Alias delle variabili di ambiente">
    OpenClaw riconosce sia `RUNWAYML_API_SECRET` (canonica) sia `RUNWAY_API_KEY`.
    Entrambe le variabili consentono di autenticare il provider Runway.
  </Accordion>

  <Accordion title="Polling delle attività">
    Runway utilizza un'API basata su attività. Dopo l'invio di una richiesta di generazione, OpenClaw
    esegue il polling di `GET /v1/tasks/{id}` finché il video non è pronto. Non è necessaria alcuna
    configurazione aggiuntiva per il comportamento di polling.
  </Accordion>
</AccordionGroup>

## Risorse correlate

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento, selezione del provider e comportamento asincrono.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite dell'agente, incluso il modello di generazione video.
  </Card>
</CardGroup>
