---
read_when:
    - Vous voulez la synthèse vocale Azure Speech pour les réponses sortantes
    - Vous avez besoin d’une sortie native de note vocale Ogg Opus depuis Azure Speech
summary: Synthèse vocale Azure AI Speech pour les réponses d’OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:02:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech est un fournisseur Azure AI Speech de synthèse vocale. Dans OpenClaw, il
synthétise l’audio des réponses sortantes en MP3 par défaut, en Ogg/Opus natif pour les
notes vocales, et en audio mulaw 8 kHz pour les canaux téléphoniques tels que les appels vocaux.

OpenClaw utilise directement l’API REST Azure Speech avec SSML et envoie le
format de sortie propre au fournisseur via `X-Microsoft-OutputFormat`.

| Détail                  | Valeur                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Site web                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentation           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentification        | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Voix par défaut         | `en-US-JennyNeural`                                                                                            |
| Sortie fichier par défaut | `audio-24khz-48kbitrate-mono-mp3`                                                                            |
| Fichier de note vocale par défaut | `ogg-24khz-16bit-mono-opus`                                                                          |

## Démarrage

<Steps>
  <Step title="Create an Azure Speech resource">
    Dans le portail Azure, créez une ressource Speech. Copiez **KEY 1** depuis
    Resource Management > Keys and Endpoint, puis copiez l’emplacement de la ressource,
    comme `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Envoyez une réponse via n’importe quel canal connecté. OpenClaw synthétise l’audio
    avec Azure Speech et fournit du MP3 pour l’audio standard, ou de l’Ogg/Opus lorsque
    le canal attend une note vocale.
  </Step>
</Steps>

## Options de configuration

| Option                  | Chemin                                                      | Description                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Clé de ressource Azure Speech. Se rabat sur `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Région de la ressource Azure Speech. Se rabat sur `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.           |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Remplacement facultatif de l’endpoint/de l’URL de base Azure Speech.                                  |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Remplacement facultatif de l’URL de base Azure Speech.                                                |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure voice ShortName (par défaut `en-US-JennyNeural`). Alias hérité : `voice`.                       |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Code de langue SSML (par défaut `en-US`).                                                             |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format de sortie du fichier audio (par défaut `audio-24khz-48kbitrate-mono-mp3`).                     |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format de sortie de note vocale (par défaut `ogg-24khz-16bit-mono-opus`).                             |

## Notes

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech utilise une clé de ressource Speech, et non une clé Azure OpenAI. La clé
    est envoyée sous forme de `Ocp-Apim-Subscription-Key` ; OpenClaw dérive
    `https://<region>.tts.speech.microsoft.com` depuis `region`, sauf si vous
    fournissez `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Utilisez la valeur `ShortName` de la voix Azure Speech, par exemple
    `en-US-JennyNeural`. Le fournisseur intégré peut lister les voix via la
    même ressource Speech et filtre les voix marquées comme obsolètes ou retirées.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure accepte des formats de sortie tels que `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` et `riff-24khz-16bit-mono-pcm`. OpenClaw
    demande de l’Ogg/Opus pour les cibles `voice-note` afin que les canaux puissent envoyer
    des bulles vocales natives sans conversion MP3 supplémentaire.
  </Accordion>
  <Accordion title="Alias">
    `azure` est accepté comme alias de fournisseur pour les PR existantes et la configuration utilisateur,
    mais les nouvelles configurations doivent utiliser `azure-speech` pour éviter toute confusion avec les
    fournisseurs de modèles Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/fr/tools/tts" icon="waveform-lines">
    Vue d’ensemble de TTS, fournisseurs et configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration, y compris les paramètres `messages.tts`.
  </Card>
  <Card title="Providers" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw intégrés.
  </Card>
  <Card title="Troubleshooting" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
