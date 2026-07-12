---
read_when:
    - Vous souhaitez utiliser la synthèse vocale d’Inworld pour les réponses sortantes
    - Vous avez besoin d’une sortie de téléphonie PCM ou de note vocale OGG_OPUS depuis Inworld
summary: Synthèse vocale en streaming d’Inworld pour les réponses d’OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T15:44:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld est un fournisseur de synthèse vocale (TTS) en streaming. Dans OpenClaw, il synthétise l’audio des réponses sortantes (MP3 par défaut, OGG_OPUS pour les messages vocaux) ainsi que l’audio PCM brut pour les canaux de téléphonie tels que Voice Call.

OpenClaw envoie des requêtes au point de terminaison TTS en streaming d’Inworld, concatène les fragments audio en base64 renvoyés dans un tampon unique, puis transmet le résultat au pipeline standard d’audio de réponse.

| Propriété            | Valeur                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Identifiant du fournisseur | `inworld`                                                        |
| Plugin               | paquet externe officiel (`@openclaw/inworld-speech`)                    |
| Contrat              | `speechProviders` (TTS uniquement)                                      |
| Variable d’environnement d’authentification | `INWORLD_API_KEY` (HTTP Basic, identifiant du tableau de bord en Base64) |
| URL de base          | `https://api.inworld.ai`                                                 |
| Voix par défaut      | `Sarah`                                                                 |
| Modèle par défaut    | `inworld-tts-1.5-max`                                                    |
| Sortie               | MP3 (par défaut), OGG_OPUS (messages vocaux), PCM 22050 Hz (téléphonie) |
| Site web             | [inworld.ai](https://inworld.ai)                                        |
| Documentation        | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)              |

## Installer le plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Bien démarrer

<Steps>
  <Step title="Définir votre clé API">
    Copiez l’identifiant depuis votre tableau de bord Inworld (Workspace > API Keys) et définissez-le comme variable d’environnement. La valeur est envoyée telle quelle comme identifiant HTTP Basic ; ne l’encodez donc pas de nouveau en Base64 et ne la convertissez pas en jeton porteur.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Sélectionner Inworld dans messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envoyer un message">
    Envoyez une réponse par l’intermédiaire de n’importe quel canal connecté. OpenClaw synthétise l’audio avec Inworld et le transmet au format MP3 (ou OGG_OPUS lorsque le canal attend un message vocal).
  </Step>
</Steps>

## Options de configuration

| Option        | Chemin                                       | Description                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Identifiant du tableau de bord en Base64. Utilise `INWORLD_API_KEY` à défaut. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Remplace l’URL de base de l’API Inworld (par défaut `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identifiant de la voix (par défaut `Sarah`). Ancien alias : `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Identifiant du modèle TTS (par défaut `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Température d’échantillonnage, de `0` (exclus) à `2` (facultatif).             |

## Remarques

<AccordionGroup>
  <Accordion title="Authentification">
    Inworld utilise l’authentification HTTP Basic avec une chaîne d’identification unique encodée en Base64. Copiez-la telle quelle depuis le tableau de bord Inworld. Le fournisseur l’envoie sous la forme `Authorization: Basic <apiKey>` sans encodage supplémentaire ; ne l’encodez donc pas vous-même en Base64 et ne transmettez pas de jeton de type porteur. Consultez les [remarques sur l’authentification TTS](/fr/tools/tts#inworld-primary) pour le même avertissement.
  </Accordion>
  <Accordion title="Modèles">
    Identifiants de modèles pris en charge : `inworld-tts-1.5-max` (par défaut), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Sorties audio">
    Les réponses utilisent le format MP3 par défaut. Lorsque la cible du canal est `voice-note`, OpenClaw demande à Inworld le format `OGG_OPUS` afin que l’audio soit lu comme une bulle vocale native. La synthèse pour la téléphonie utilise du `PCM` brut à 22050 Hz pour alimenter la passerelle de téléphonie.
  </Accordion>
  <Accordion title="Points de terminaison personnalisés">
    Remplacez l’hôte de l’API avec `messages.tts.providers.inworld.baseUrl`. Les barres obliques finales sont supprimées avant l’envoi des requêtes.
  </Accordion>
</AccordionGroup>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Présentation de la TTS, fournisseurs et configuration de `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration, y compris les paramètres de `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs pris en charge par OpenClaw.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
