---
read_when:
    - Vuoi utilizzare la generazione video di Runway in OpenClaw
    - È necessaria la configurazione della chiave API/env di Runway
    - Vuoi impostare Runway come provider video predefinito
summary: Configurazione della generazione video con Runway in OpenClaw
title: Pista
x-i18n:
    generated_at: "2026-05-06T09:06:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw include un provider `runway` in bundle per la generazione video ospitata. Il Plugin è abilitato per impostazione predefinita e registra il provider `runway` rispetto al contratto `videoGenerationProviders`.

| Proprietà                 | Valore                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| ID provider               | `runway`                                                             |
| Plugin                    | in bundle, `enabledByDefault: true`                                  |
| Variabili env di auth     | `RUNWAYML_API_SECRET` (canonica) o `RUNWAY_API_KEY`                  |
| Flag di onboarding        | `--auth-choice runway-api-key`                                       |
| Flag CLI diretto          | `--runway-api-key <key>`                                             |
| API                       | Generazione video basata su task di Runway (polling `GET /v1/tasks/{id}`) |
| Modello predefinito       | `runway/gen4.5`                                                      |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Imposta Runway come provider video predefinito">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genera un video">
    Chiedi all'agente di generare un video. Runway verrà usato automaticamente.
  </Step>
</Steps>

## Modalità e modelli supportati

Il provider espone sette modelli Runway suddivisi in tre modalità. Lo stesso ID modello può servire più di una modalità (ad esempio `gen4.5` funziona sia per testo-a-video sia per immagine-a-video).

| Modalità        | Modelli                                                                | Input di riferimento     |
| --------------- | ---------------------------------------------------------------------- | ------------------------ |
| Testo-a-video   | `gen4.5` (predefinito), `veo3.1`, `veo3.1_fast`, `veo3`               | Nessuno                  |
| Immagine-a-video | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 immagine locale o remota |
| Video-a-video   | `gen4_aleph`                                                           | 1 video locale o remoto  |

I riferimenti a immagini e video locali sono supportati tramite URI di dati.

| Proporzioni           | Valori consentiti                            |
| --------------------- | -------------------------------------------- |
| Testo-a-video         | `16:9`, `9:16`                               |
| Modifiche a immagini e video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video-a-video attualmente richiede `runway/gen4_aleph`. Altri ID modello Runway rifiutano gli input di riferimento video.
</Warning>

<Note>
  La scelta di un ID modello Runway dalla colonna sbagliata produce un errore esplicito prima che la richiesta API lasci OpenClaw. Il provider valida `model` rispetto all'elenco consentito della modalità (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) in `extensions/runway/video-generation-provider.ts`.
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
  <Accordion title="Alias delle variabili d'ambiente">
    OpenClaw riconosce sia `RUNWAYML_API_SECRET` (canonica) sia `RUNWAY_API_KEY`.
    Entrambe le variabili autenticheranno il provider Runway.
  </Accordion>

  <Accordion title="Polling dei task">
    Runway usa un'API basata su task. Dopo l'invio di una richiesta di generazione, OpenClaw
    esegue il polling di `GET /v1/tasks/{id}` finché il video non è pronto. Non è necessaria
    alcuna configurazione aggiuntiva per il comportamento di polling.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condivisi, selezione del provider e comportamento asincrono.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite dell'agente, incluso il modello di generazione video.
  </Card>
</CardGroup>
