---
read_when:
    - Vuoi utilizzare la generazione video di Alibaba Wan in OpenClaw
    - È necessario configurare una chiave API di Model Studio o DashScope per la generazione di video
summary: Generazione video con Alibaba Model Studio Wan in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:04:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw include un plugin `alibaba` in bundle che registra un provider per la generazione video per i modelli Wan su Alibaba Model Studio (il nome internazionale di DashScope). Il plugin è abilitato per impostazione predefinita; devi solo impostare una chiave API.

| Proprietà        | Valore                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| ID provider      | `alibaba`                                                                       |
| Plugin           | in bundle, `enabledByDefault: true`                                             |
| Variabili env auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (vince la prima corrispondenza) |
| Flag onboarding  | `--auth-choice alibaba-model-studio-api-key`                                    |
| Flag CLI diretto | `--alibaba-model-studio-api-key <key>`                                          |
| Modello predefinito | `alibaba/wan2.6-t2v`                                                         |
| URL base predefinito | `https://dashscope-intl.aliyuncs.com`                                      |

## Per iniziare

<Steps>
  <Step title="Imposta una chiave API">
    Usa l'onboarding per archiviare la chiave per il provider `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Oppure passa la chiave direttamente durante l'installazione/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Oppure esporta una qualsiasi delle variabili env accettate prima di avviare il Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
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
  <Step title="Verifica che il provider sia configurato">
    ```bash
    openclaw models list --provider alibaba
    ```

    L'elenco dovrebbe includere tutti e cinque i modelli Wan inclusi in bundle. Se `MODELSTUDIO_API_KEY` non viene risolta, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Il plugin Alibaba e il [plugin Qwen](/it/providers/qwen) si autenticano entrambi su DashScope e accettano variabili env sovrapposte. Usa gli ID modello `alibaba/...` per utilizzare la superficie video Wan dedicata; usa gli ID `qwen/...` quando vuoi la superficie di chat, embedding o comprensione dei media di Qwen.
</Note>

## Modelli Wan integrati

| Riferimento modello        | Modalità                  |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Testo-video (predefinito) |
| `alibaba/wan2.6-i2v`       | Immagine-video            |
| `alibaba/wan2.6-r2v`       | Riferimento-video         |
| `alibaba/wan2.6-r2v-flash` | Riferimento-video (rapido) |
| `alibaba/wan2.7-r2v`       | Riferimento-video         |

## Capacità e limiti

Il provider incluso in bundle rispecchia i limiti dell'API video Wan di DashScope. Tutte e tre le modalità condividono lo stesso conteggio video per richiesta e lo stesso limite di durata; cambia solo la forma dell'input.

| Modalità           | Video di output max | Immagini di input max | Video di input max | Durata max | Controlli supportati                                      |
| ------------------ | ------------------- | --------------------- | ------------------ | ---------- | --------------------------------------------------------- |
| Testo-video        | 1                   | n/a                   | n/a                | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Immagine-video     | 1                   | 1                     | n/a                | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Riferimento-video  | 1                   | n/a                   | 4                  | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Quando una richiesta omette `durationSeconds`, il provider invia il valore predefinito accettato da DashScope di **5 secondi**. Imposta esplicitamente `durationSeconds` nello [strumento di generazione video](/it/tools/video-generation) per arrivare fino a 10 s.

<Warning>
  Gli input di immagini e video di riferimento devono essere URL `http(s)` remoti. I percorsi di file locali non sono accettati dalle modalità di riferimento di DashScope; caricali prima su un object storage oppure usa il flusso dello [strumento media](/it/tools/media-overview) che produce già un URL pubblico.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Sovrascrivi l'URL base di DashScope">
    Il provider usa per impostazione predefinita l'endpoint internazionale di DashScope. Per indirizzare l'endpoint della regione Cina, imposta:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Il provider rimuove le barre finali prima di costruire gli URL delle attività AIGC.

  </Accordion>

  <Accordion title="Priorità env auth">
    OpenClaw risolve la chiave API Alibaba dalle variabili di ambiente in quest'ordine, prendendo il primo valore non vuoto:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Le voci `auth.profiles` configurate (impostate tramite `openclaw models auth login`) sovrascrivono la risoluzione delle variabili env. Consulta [Profili auth nelle FAQ sui modelli](/it/help/faq-models#what-is-an-auth-profile) per la rotazione dei profili, il cooldown e i meccanismi di sovrascrittura.

  </Accordion>

  <Accordion title="Relazione con il plugin Qwen">
    Entrambi i plugin inclusi in bundle comunicano con DashScope e accettano chiavi API sovrapposte. Usa:

    - gli ID `alibaba/wan*.*` per utilizzare il provider video Wan dedicato documentato in questa pagina.
    - gli ID `qwen/*` per chat, embedding e comprensione dei media Qwen (vedi [Qwen](/it/providers/qwen)).

    Impostare una sola volta `MODELSTUDIO_API_KEY` autentica entrambi i plugin perché l'elenco delle variabili env auth è intenzionalmente sovrapposto; non devi eseguire l'onboarding di ciascun plugin separatamente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento video condiviso e selezione del provider.
  </Card>
  <Card title="Qwen" href="/it/providers/qwen" icon="microchip">
    Configurazione di chat, embedding e comprensione dei media Qwen con la stessa auth DashScope.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti agent e configurazione dei modelli.
  </Card>
  <Card title="FAQ modelli" href="/it/help/faq-models" icon="circle-question">
    Profili auth, cambio di modello e risoluzione degli errori "no profile".
  </Card>
</CardGroup>
