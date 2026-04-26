---
read_when:
    - Vous souhaitez la synthèse vocale Azure Speech pour les réponses sortantes.
    - Vous avez besoin d’une sortie native de note vocale Ogg Opus depuis Azure Speech.
summary: Synthèse vocale Azure AI Speech pour les réponses OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:37:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech est un fournisseur de synthèse vocale Azure AI Speech. Dans OpenClaw, il
synthétise par défaut l’audio des réponses sortantes en MP3, utilise le format Ogg/Opus natif pour les
notes vocales, et un audio mulaw à 8 kHz pour les canaux de téléphonie tels que Voice Call.

OpenClaw utilise directement l’API REST Azure Speech avec SSML et envoie le
format de sortie propriétaire du fournisseur via `X-Microsoft-OutputFormat`.

| Détail                  | Valeur                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Site web                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                 |
| Documentation           | [Synthèse vocale REST Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentification        | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Voix par défaut         | `en-US-JennyNeural`                                                                                            |
| Sortie de fichier par défaut | `audio-24khz-48kbitrate-mono-mp3`                                                                         |
| Fichier de note vocale par défaut | `ogg-24khz-16bit-mono-opus`                                                                           |

## Prise en main

<Steps>
  <Step title="Créer une ressource Azure Speech">
    Dans le portail Azure, créez une ressource Speech. Copiez **KEY 1** depuis
    Resource Management > Keys and Endpoint, puis copiez l’emplacement de la ressource
    tel que `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Sélectionner Azure Speech dans messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envoyer un message">
    Envoyez une réponse via n’importe quel canal connecté. OpenClaw synthétise l’audio
    avec Azure Speech et livre du MP3 pour l’audio standard, ou du Ogg/Opus lorsque
    le canal attend une note vocale.
  </Step>
</Steps>

## Options de configuration

| Option                  | Chemin                                                      | Description                                                                                             |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Clé de ressource Azure Speech. Utilise en repli `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Région de la ressource Azure Speech. Utilise en repli `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.        |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Remplacement facultatif de l’endpoint/de l’URL de base Azure Speech.                                   |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Remplacement facultatif de l’URL de base Azure Speech.                                                 |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | ShortName de la voix Azure (par défaut `en-US-JennyNeural`).                                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Code de langue SSML (par défaut `en-US`).                                                              |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format de sortie du fichier audio (par défaut `audio-24khz-48kbitrate-mono-mp3`).                     |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format de sortie des notes vocales (par défaut `ogg-24khz-16bit-mono-opus`).                          |

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    Azure Speech utilise une clé de ressource Speech, et non une clé Azure OpenAI. La clé
    est envoyée comme `Ocp-Apim-Subscription-Key` ; OpenClaw dérive
    `https://<region>.tts.speech.microsoft.com` à partir de `region`, sauf si vous
    fournissez `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Noms des voix">
    Utilisez la valeur `ShortName` de la voix Azure Speech, par exemple
    `en-US-JennyNeural`. Le fournisseur intégré peut lister les voix via la
    même ressource Speech et filtre les voix marquées comme obsolètes ou retirées.
  </Accordion>
  <Accordion title="Sorties audio">
    Azure accepte des formats de sortie tels que `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` et `riff-24khz-16bit-mono-pcm`. OpenClaw
    demande Ogg/Opus pour les cibles `voice-note` afin que les canaux puissent envoyer des
    bulles vocales natives sans conversion supplémentaire en MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` est accepté comme alias de fournisseur pour les PR existantes et la configuration utilisateur,
    mais les nouvelles configurations doivent utiliser `azure-speech` pour éviter toute confusion avec les
    fournisseurs de modèles Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Vue d’ensemble de la TTS, fournisseurs et configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration, y compris les paramètres `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw intégrés.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
