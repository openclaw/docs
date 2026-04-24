---
read_when:
    - Vuoi usare la generazione video Wan di Alibaba in OpenClaw
    - Ti serve la configurazione della API key Model Studio o DashScope per la generazione video
summary: Generazione video Wan di Alibaba Model Studio in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T08:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw include un provider di generazione video `alibaba` integrato per i modelli Wan su
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Auth preferita: `MODELSTUDIO_API_KEY`
- Accettate anche: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: generazione video asincrona DashScope / Model Studio

## Per iniziare

<Steps>
  <Step title="Imposta una API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Imposta un modello video predefinito">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica che il provider sia disponibile">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Qualsiasi chiave auth accettata (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funzionerà. La scelta di onboarding `qwen-standard-api-key` configura la credenziale DashScope condivisa.
</Note>

## Modelli Wan integrati

Il provider `alibaba` integrato attualmente registra:

| Riferimento modello        | Modalità                    |
| -------------------------- | --------------------------- |
| `alibaba/wan2.6-t2v`       | Text-to-video               |
| `alibaba/wan2.6-i2v`       | Image-to-video              |
| `alibaba/wan2.6-r2v`       | Reference-to-video          |
| `alibaba/wan2.6-r2v-flash` | Reference-to-video (veloce) |
| `alibaba/wan2.7-r2v`       | Reference-to-video          |

## Limiti attuali

| Parametro              | Limite                                                    |
| ---------------------- | --------------------------------------------------------- |
| Video in uscita        | Fino a **1** per richiesta                                |
| Immagini in ingresso   | Fino a **1**                                              |
| Video in ingresso      | Fino a **4**                                              |
| Durata                 | Fino a **10 secondi**                                     |
| Controlli supportati   | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Immagine/video di riferimento | Solo URL remoti `http(s)`                          |

<Warning>
La modalità immagine/video di riferimento attualmente richiede **URL remoti http(s)**. I percorsi di file locali non sono supportati per gli input di riferimento.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Relazione con Qwen">
    Anche il provider integrato `qwen` usa endpoint DashScope ospitati da Alibaba per
    la generazione video Wan. Usa:

    - `qwen/...` quando vuoi la superficie canonica del provider Qwen
    - `alibaba/...` quando vuoi la superficie video Wan diretta del vendor

    Vedi la [documentazione del provider Qwen](/it/providers/qwen) per maggiori dettagli.

  </Accordion>

  <Accordion title="Priorità delle chiavi auth">
    OpenClaw controlla le chiavi auth in quest'ordine:

    1. `MODELSTUDIO_API_KEY` (preferita)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Ognuna di queste autenticherà il provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Qwen" href="/it/providers/qwen" icon="microchip">
    Configurazione del provider Qwen e integrazione DashScope.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti dell'agente e configurazione del modello.
  </Card>
</CardGroup>
