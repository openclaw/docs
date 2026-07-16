---
read_when:
    - Vous souhaitez utiliser la synthèse vocale Azure pour les réponses sortantes
    - Vous avez besoin d’une sortie de note vocale native au format Ogg Opus depuis Azure Speech
summary: Synthèse vocale Azure AI Speech pour les réponses d’OpenClaw
title: Synthèse vocale Azure
x-i18n:
    generated_at: "2026-07-16T13:41:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech est un fournisseur groupé de synthèse vocale Azure AI Speech. OpenClaw
appelle directement l’API REST Azure Speech avec SSML, en synthétisant du MP3 pour
les réponses standard, du Ogg/Opus natif pour les notes vocales et du mulaw à 8 kHz pour
les canaux de téléphonie tels que Voice Call. La requête envoie le format de sortie
géré par le fournisseur via l’en-tête `X-Microsoft-OutputFormat`.

| Détail                  | Valeur                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID du fournisseur       | `azure-speech` (alias : `azure`)                                                               |
| Site web                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentation           | [Synthèse vocale avec l’API REST Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentification        | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                    |
| Voix par défaut         | `en-US-JennyNeural`                                                                                             |
| Fichier de sortie par défaut | `audio-24khz-48kbitrate-mono-mp3`                                                                                       |
| Fichier de note vocale par défaut | `ogg-24khz-16bit-mono-opus`                                                                                  |

## Bien démarrer

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
    Envoyez une réponse via n’importe quel canal connecté. OpenClaw synthétise l’audio
    avec Azure Speech et transmet du MP3 pour l’audio standard, ou du Ogg/Opus lorsque
    le canal attend une note vocale.
  </Step>
</Steps>

## Options de configuration

Toutes les options se trouvent sous `messages.tts.providers["azure-speech"]`.

| Option                  | Description                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Clé de la ressource Azure Speech. Se rabat sur `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`. |
| `region`      | Région de la ressource Azure Speech. Se rabat sur `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.           |
| `endpoint`      | Remplacement facultatif du point de terminaison Azure Speech. Se rabat sur la valeur approuvée `AZURE_SPEECH_ENDPOINT`. |
| `baseUrl`      | Remplacement facultatif de l’URL de base Azure Speech.                                                |
| `voice`      | ShortName de la voix Azure (valeur par défaut : `en-US-JennyNeural`). Alias hérité : `voiceId`. |
| `lang`      | Code de langue SSML (valeur par défaut : `en-US`).                                        |
| `outputFormat`      | Format de sortie du fichier audio (valeur par défaut : `audio-24khz-48kbitrate-mono-mp3`).                           |
| `voiceNoteOutputFormat`      | Format de sortie de la note vocale (valeur par défaut : `ogg-24khz-16bit-mono-opus`).                          |
| `timeoutMs`      | Remplacement du délai d’expiration de la requête en millisecondes. Se rabat sur la valeur globale `messages.tts.timeoutMs`. |

Le fournisseur est considéré comme configuré dès que `apiKey` est défini avec l’un des éléments
`region`, `endpoint` ou `baseUrl`. Les variables d’environnement ne sont vérifiées qu’en dernier recours
pour les clés de configuration non définies. Les fichiers `.env` de l’espace de travail ne peuvent pas définir
`AZURE_SPEECH_ENDPOINT` ; utilisez l’environnement du processus, le fichier dotenv global de l’environnement d’exécution
ou une configuration explicite pour le routage des points de terminaison.

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    Azure Speech utilise une clé de ressource Speech, et non une clé Azure OpenAI. La clé
    est envoyée sous la forme `Ocp-Apim-Subscription-Key` ; OpenClaw déduit
    `https://<region>.tts.speech.microsoft.com` à partir de `region`, sauf si vous
    fournissez `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Noms des voix">
    Utilisez la valeur `ShortName` de la voix Azure Speech, par exemple
    `en-US-JennyNeural`. Le fournisseur groupé peut répertorier les voix à l’aide de la
    même ressource Speech et exclut celles qui sont marquées comme obsolètes, retirées
    ou désactivées.
  </Accordion>
  <Accordion title="Sorties audio">
    Azure accepte des formats de sortie tels que `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` et `riff-24khz-16bit-mono-pcm`. OpenClaw
    demande du Ogg/Opus pour les cibles `voice-note` afin que les canaux puissent envoyer des bulles
    vocales natives sans conversion MP3 supplémentaire, et impose
    `raw-8khz-8bit-mono-mulaw` pour les cibles de téléphonie.
  </Accordion>
  <Accordion title="Alias">
    `azure` est accepté comme alias de fournisseur pour les configurations existantes, mais les nouvelles
    configurations doivent utiliser `azure-speech` afin d’éviter toute confusion avec les fournisseurs de modèles
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Présentation de la synthèse vocale, fournisseurs et configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration, y compris les paramètres `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw groupés.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
