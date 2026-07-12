---
read_when:
    - Vous souhaitez utiliser la transcription audio de Deepgram pour les pièces jointes audio
    - Vous souhaitez utiliser la transcription en continu de Deepgram pour les appels vocaux
    - Vous avez besoin d’un exemple rapide de configuration Deepgram
summary: Transcription Deepgram des messages vocaux entrants
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T02:59:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram est une API de conversion de la parole en texte. OpenClaw l’utilise pour la
transcription des fichiers audio et des notes vocales entrants via `tools.media.audio`,
ainsi que pour la transcription vocale en continu des appels via
`plugins.entries.voice-call.config.streaming`.

La transcription par lots téléverse le fichier audio complet vers Deepgram et injecte
la transcription dans le pipeline de réponse (bloc `{{Transcript}}` + `[Audio]`).
La diffusion en continu des appels vocaux transmet en direct les trames G.711 u-law
au point de terminaison WebSocket `listen` de Deepgram et émet les transcriptions
partielles et finales à mesure que Deepgram les renvoie.

| Détail         | Valeur                                                     |
| -------------- | ---------------------------------------------------------- |
| Site web       | [deepgram.com](https://deepgram.com)                       |
| Documentation  | [developers.deepgram.com](https://developers.deepgram.com) |
| Authentification | `DEEPGRAM_API_KEY`                                       |
| Modèle par défaut | `nova-3`                                                |

## Prise en main

<Steps>
  <Step title="Définir votre clé API">
    ```bash
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
    Envoyez un message audio par l’intermédiaire de n’importe quel canal connecté.
    OpenClaw le transcrit via Deepgram et injecte la transcription dans le pipeline
    de réponse.
  </Step>
</Steps>

## Options de configuration

| Option     | Chemin                                | Description                                  |
| ---------- | ------------------------------------- | -------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identifiant du modèle Deepgram (par défaut : `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Indication de langue (facultative)           |

`providerOptions.deepgram` fusionne des paramètres de requête supplémentaires
directement dans la requête Deepgram `/listen`. Tout nom de paramètre pris en
charge par Deepgram peut donc être utilisé (par exemple `detect_language`,
`punctuate`, `smart_format`) :

<Tabs>
  <Tab title="Avec une indication de langue">
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
  <Tab title="Avec des options Deepgram">
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

## Transcription vocale en continu des appels

Le plugin `deepgram` fourni enregistre également un fournisseur de transcription
en temps réel pour le plugin d’appels vocaux.

| Paramètre              | Chemin de configuration                                                   | Valeur par défaut                  |
| ---------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| Clé API                | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`   | Utilise `DEEPGRAM_API_KEY` à défaut |
| Modèle                 | `...deepgram.model`                                                       | `nova-3`                           |
| Langue                 | `...deepgram.language`                                                    | (non définie)                      |
| Encodage               | `...deepgram.encoding`                                                    | `mulaw`                            |
| Fréquence d’échantillonnage | `...deepgram.sampleRate`                                             | `8000`                             |
| Détection de fin d’énoncé | `...deepgram.endpointingMs`                                            | `800`                              |
| Résultats intermédiaires | `...deepgram.interimResults`                                            | `true`                             |

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
Les appels vocaux reçoivent le son téléphonique au format G.711 u-law à 8 kHz.
Le fournisseur de diffusion en continu Deepgram utilise par défaut
`encoding: "mulaw"` et `sampleRate: 8000`, ce qui permet de transmettre
directement les trames multimédias Twilio.
</Note>

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    L’authentification suit l’ordre standard d’authentification des fournisseurs.
    `DEEPGRAM_API_KEY` est la méthode la plus simple.
  </Accordion>
  <Accordion title="Proxy et points de terminaison personnalisés">
    Remplacez les points de terminaison ou les en-têtes avec
    `tools.media.audio.baseUrl` et `tools.media.audio.headers` lors de
    l’utilisation d’un proxy.
  </Accordion>
  <Accordion title="Comportement de la sortie">
    La sortie suit les mêmes règles audio que les autres fournisseurs
    (limites de taille, délais d’expiration et injection de la transcription).
  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Outils multimédias" href="/fr/tools/media-overview" icon="photo-film">
    Présentation du pipeline de traitement des fichiers audio, des images et des vidéos.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration, y compris les paramètres des outils multimédias.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquentes sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
