---
read_when:
    - Vuoi usare la generazione multimediale di Vydra in OpenClaw
    - Hai bisogno di indicazioni per configurare la chiave API di Vydra
summary: Usare immagini, video e sintesi vocale di Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-07T08:16:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Il plugin Vydra incluso aggiunge:

- generazione di immagini tramite `vydra/grok-imagine`
- generazione di video tramite `vydra/veo3` e `vydra/kling`
- sintesi vocale tramite il percorso TTS di Vydra basato su ElevenLabs

OpenClaw usa la stessa `VYDRA_API_KEY` per tutte e tre le capacità.

## URL di base importante

Usa `https://www.vydra.ai/api/v1`.

L'host apex di Vydra (`https://vydra.ai/api/v1`) al momento reindirizza a `www`. Alcuni client HTTP eliminano `Authorization` in quel reindirizzamento cross-host, trasformando una chiave API valida in un errore di autenticazione fuorviante. Il plugin incluso usa direttamente l'URL di base `www` per evitarlo.

## Configurazione

Onboarding interattivo:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Oppure imposta direttamente la variabile env:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Generazione di immagini

Modello immagine predefinito:

- `vydra/grok-imagine`

Impostalo come provider di immagini predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

Il supporto incluso attuale è solo text-to-image. I percorsi di modifica ospitati da Vydra si aspettano URL di immagini remote e OpenClaw non aggiunge ancora nel plugin incluso un bridge di upload specifico per Vydra.

Vedi [Generazione di immagini](/it/tools/image-generation) per il comportamento condiviso dello strumento.

## Generazione di video

Modelli video registrati:

- `vydra/veo3` per text-to-video
- `vydra/kling` per image-to-video

Imposta Vydra come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Note:

- `vydra/veo3` è incluso solo come text-to-video.
- `vydra/kling` al momento richiede un riferimento URL immagine remoto. Gli upload di file locali vengono rifiutati immediatamente.
- L'attuale percorso HTTP `kling` di Vydra è stato incoerente sul fatto che richieda `image_url` o `video_url`; il provider incluso mappa lo stesso URL immagine remoto in entrambi i campi.
- Il plugin incluso resta prudente e non inoltra controlli di stile non documentati come aspect ratio, risoluzione, watermark o audio generato.

Copertura live specifica del provider:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

Il file live Vydra incluso ora copre:

- `vydra/veo3` text-to-video
- `vydra/kling` image-to-video usando un URL immagine remoto

Sostituisci il fixture dell'immagine remota quando necessario:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Vedi [Generazione di video](/it/tools/video-generation) per il comportamento condiviso dello strumento.

## Sintesi vocale

Imposta Vydra come provider speech:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Valori predefiniti:

- modello: `elevenlabs/tts`
- voice id: `21m00Tcm4TlvDq8ikWAM`

Il plugin incluso attualmente espone una sola voce predefinita nota per funzionare bene e restituisce file audio MP3.

## Correlati

- [Directory dei provider](/it/providers/index)
- [Generazione di immagini](/it/tools/image-generation)
- [Generazione di video](/it/tools/video-generation)
