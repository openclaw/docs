---
read_when:
    - Vous souhaitez utiliser la synthèse vocale Azure pour les réponses sortantes
    - Vous avez besoin d’une sortie native de note vocale Ogg Opus depuis Azure Speech
summary: Synthèse vocale Azure AI Speech pour les réponses d’OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-12T03:13:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech est un fournisseur de synthèse vocale Azure AI Speech intégré. OpenClaw
appelle directement l’API REST Azure Speech avec du SSML, en synthétisant du MP3 pour
les réponses standard, du Ogg/Opus natif pour les messages vocaux et du mulaw à 8 kHz pour
les canaux téléphoniques tels que Voice Call. La requête transmet le format de sortie propre
au fournisseur dans l’en-tête `X-Microsoft-OutputFormat`.

| Détail                          | Valeur                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID du fournisseur               | `azure-speech` (alias : `azure`)                                                                               |
| Site web                        | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentation                   | [Synthèse vocale via l’API REST Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentification                | `AZURE_SPEECH_KEY` avec `AZURE_SPEECH_REGION`                                                                  |
| Voix par défaut                 | `en-US-JennyNeural`                                                                                            |
| Format de fichier par défaut    | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Format de message vocal par défaut | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Prise en main

<Steps>
  <Step title="Créer une ressource Azure Speech">
    Dans le portail Azure, créez une ressource Speech. Copiez **KEY 1** depuis
    Resource Management > Keys and Endpoint, puis copiez l’emplacement de la ressource,
    par exemple `eastus`.

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
    Envoyez une réponse par l’intermédiaire de n’importe quel canal connecté. OpenClaw synthétise l’audio
    avec Azure Speech et fournit du MP3 pour l’audio standard, ou du Ogg/Opus lorsque
    le canal attend un message vocal.
  </Step>
</Steps>

## Options de configuration

Toutes les options se trouvent sous `messages.tts.providers["azure-speech"]`.

| Option                  | Description                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Clé de la ressource Azure Speech. Utilise à défaut `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.       |
| `region`                | Région de la ressource Azure Speech. Utilise à défaut `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.                      |
| `endpoint`              | Remplacement facultatif du point de terminaison Azure Speech. Utilise à défaut `AZURE_SPEECH_ENDPOINT`.             |
| `baseUrl`               | Remplacement facultatif de l’URL de base Azure Speech.                                                               |
| `voice`                 | `ShortName` de la voix Azure (`en-US-JennyNeural` par défaut). Ancien alias : `voiceId`.                             |
| `lang`                  | Code de langue SSML (`en-US` par défaut).                                                                            |
| `outputFormat`          | Format de sortie du fichier audio (`audio-24khz-48kbitrate-mono-mp3` par défaut).                                    |
| `voiceNoteOutputFormat` | Format de sortie du message vocal (`ogg-24khz-16bit-mono-opus` par défaut).                                          |
| `timeoutMs`             | Remplacement du délai d’expiration de la requête, en millisecondes. Utilise à défaut la valeur globale `messages.tts.timeoutMs`. |

Le fournisseur est considéré comme configuré dès que `apiKey` est défini avec l’une des
options `region`, `endpoint` ou `baseUrl`. Les variables d’environnement ne sont consultées qu’en dernier recours
pour les clés de configuration qui ne sont pas définies.

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    Azure Speech utilise une clé de ressource Speech, et non une clé Azure OpenAI. La clé
    est envoyée dans `Ocp-Apim-Subscription-Key` ; OpenClaw déduit
    `https://<region>.tts.speech.microsoft.com` à partir de `region`, sauf si vous
    fournissez `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Noms des voix">
    Utilisez la valeur `ShortName` de la voix Azure Speech, par exemple
    `en-US-JennyNeural`. Le fournisseur intégré peut répertorier les voix au moyen de la
    même ressource Speech et exclut celles marquées comme obsolètes, retirées
    ou désactivées.
  </Accordion>
  <Accordion title="Sorties audio">
    Azure accepte des formats de sortie tels que `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` et `riff-24khz-16bit-mono-pcm`. OpenClaw
    demande du Ogg/Opus pour les cibles `voice-note` afin que les canaux puissent envoyer des
    bulles vocales natives sans conversion supplémentaire en MP3, et impose
    `raw-8khz-8bit-mono-mulaw` pour les cibles téléphoniques.
  </Accordion>
  <Accordion title="Alias">
    `azure` est accepté comme alias du fournisseur pour les configurations existantes, mais les nouvelles
    configurations doivent utiliser `azure-speech` afin d’éviter toute confusion avec les fournisseurs de modèles
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Présentation de la synthèse vocale, des fournisseurs et de la configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration, y compris les paramètres `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw intégrés.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
