---
read_when:
    - Vous voulez la reconnaissance vocale Deepgram pour les pièces jointes audio
    - Vous voulez la transcription en streaming Deepgram pour Voice Call
    - Vous avez besoin d’un exemple rapide de configuration Deepgram
summary: Transcription Deepgram pour les notes vocales entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram est une API de reconnaissance vocale. Dans OpenClaw, elle est utilisée pour la
transcription des fichiers audio/notes vocales entrants via `tools.media.audio` et pour la
reconnaissance vocale en streaming de Voice Call via `plugins.entries.voice-call.config.streaming`.

Pour la transcription par lot, OpenClaw téléverse le fichier audio complet vers Deepgram
et injecte la transcription dans le pipeline de réponse (`{{Transcript}}` +
bloc `[Audio]`). Pour la transcription en streaming Voice Call, OpenClaw transfère des trames G.711
u-law live via le point de terminaison WebSocket `listen` de Deepgram et émet des transcriptions partielles ou
finales à mesure que Deepgram les renvoie.

| Détail        | Valeur                                                     |
| ------------- | ---------------------------------------------------------- |
| Site web      | [deepgram.com](https://deepgram.com)                       |
| Documentation | [developers.deepgram.com](https://developers.deepgram.com) |
| Authentification | `DEEPGRAM_API_KEY`                                      |
| Modèle par défaut | `nova-3`                                               |

## Démarrage

<Steps>
  <Step title="Définir votre clé API">
    Ajoutez votre clé API Deepgram à l’environnement :

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Activer le fournisseur audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envoyer une note vocale">
    Envoyez un message audio via n’importe quel canal connecté. OpenClaw le transcrit
    via Deepgram et injecte la transcription dans le pipeline de réponse.
  </Step>
</Steps>

## Options de configuration

| Option            | Chemin                                                         | Description                              |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                             | Identifiant du modèle Deepgram (par défaut : `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                          | Indice de langue (facultatif)            |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language`   | Activer la détection de langue (facultatif) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`         | Activer la ponctuation (facultatif)      |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`      | Activer le formatage intelligent (facultatif) |

<Tabs>
  <Tab title="Avec un indice de langue">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Avec les options Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Reconnaissance vocale en streaming Voice Call

Le Plugin intégré `deepgram` enregistre aussi un fournisseur de transcription temps réel
pour le Plugin Voice Call.

| Paramètre       | Chemin de configuration                                                  | Par défaut                      |
| --------------- | ------------------------------------------------------------------------ | ------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | Se replie sur `DEEPGRAM_API_KEY` |
| Modèle          | `...deepgram.model`                                                      | `nova-3`                        |
| Langue          | `...deepgram.language`                                                   | (non défini)                    |
| Encodage        | `...deepgram.encoding`                                                   | `mulaw`                         |
| Taux d’échantillonnage | `...deepgram.sampleRate`                                          | `8000`                          |
| Endpointing     | `...deepgram.endpointingMs`                                              | `800`                           |
| Résultats intermédiaires | `...deepgram.interimResults`                                     | `true`                          |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call reçoit l’audio téléphonique en G.711 u-law 8 kHz. Le fournisseur
de streaming Deepgram utilise par défaut `encoding: "mulaw"` et `sampleRate: 8000`, de sorte que
les trames média Twilio peuvent être transférées directement.
</Note>

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    L’authentification suit l’ordre standard d’authentification des fournisseurs. `DEEPGRAM_API_KEY` est
    le chemin le plus simple.
  </Accordion>
  <Accordion title="Proxy et points de terminaison personnalisés">
    Remplacez les points de terminaison ou les en-têtes avec `tools.media.audio.baseUrl` et
    `tools.media.audio.headers` lors de l’utilisation d’un proxy.
  </Accordion>
  <Accordion title="Comportement de sortie">
    La sortie suit les mêmes règles audio que les autres fournisseurs (plafonds de taille, délais,
    injection de transcription).
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Outils média" href="/fr/tools/media-overview" icon="photo-film">
    Vue d’ensemble du pipeline de traitement audio, image et vidéo.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration, y compris les paramètres des outils média.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquemment posées sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
