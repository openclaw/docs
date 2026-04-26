---
read_when:
    - Vous voulez utiliser la synthèse vocale Inworld pour les réponses sortantes d’OpenClaw
    - Vous avez besoin d’une sortie PCM téléphonie ou OGG_OPUS mémo vocal depuis Inworld
summary: Synthèse vocale en streaming Inworld pour les réponses OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld est un fournisseur de synthèse vocale en streaming (TTS). Dans OpenClaw, il
synthétise l’audio sortant des réponses (MP3 par défaut, OGG_OPUS pour les mémos vocaux)
et de l’audio PCM pour les canaux de téléphonie tels que Voice Call.

OpenClaw envoie des requêtes au point de terminaison TTS streaming d’Inworld, concatène les
blocs audio base64 renvoyés en un seul buffer, puis transmet le résultat au
pipeline audio de réponse standard.

| Détail        | Valeur                                                      |
| ------------- | ----------------------------------------------------------- |
| Site web      | [inworld.ai](https://inworld.ai)                            |
| Documentation | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, identifiant dashboard Base64) |
| Voix par défaut | `Sarah`                                                   |
| Modèle par défaut | `inworld-tts-1.5-max`                                   |

## Démarrage

<Steps>
  <Step title="Définir votre clé API">
    Copiez l’identifiant depuis votre dashboard Inworld (Workspace > API Keys)
    et définissez-le comme variable d’environnement. La valeur est envoyée telle quelle comme identifiant HTTP Basic,
    donc ne la réencodez pas en Base64 et ne la convertissez pas en bearer
    token.

    ```
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
    Envoyez une réponse via n’importe quel canal connecté. OpenClaw synthétise
    l’audio avec Inworld et le livre en MP3 (ou en OGG_OPUS lorsque le canal
    attend un mémo vocal).
  </Step>
</Steps>

## Options de configuration

| Option        | Chemin                                       | Description                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Identifiant dashboard Base64. Revient à `INWORLD_API_KEY`.        |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Remplace l’URL de base de l’API Inworld (par défaut `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identifiant de voix (par défaut `Sarah`).                         |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Id du modèle TTS (par défaut `inworld-tts-1.5-max`).              |
| `temperature` | `messages.tts.providers.inworld.temperature` | Température d’échantillonnage `0..2` (facultative).               |

## Notes

<AccordionGroup>
  <Accordion title="Authentification">
    Inworld utilise l’authentification HTTP Basic avec une seule chaîne
    d’identifiants encodée en Base64. Copiez-la telle quelle depuis le dashboard Inworld. Le fournisseur l’envoie
    comme `Authorization: Basic <apiKey>` sans encodage supplémentaire, donc
    ne la réencodez pas vous-même en Base64 et ne passez pas de token de style bearer.
    Voir [Notes d’authentification TTS](/fr/tools/tts#inworld-primary) pour le même rappel.
  </Accordion>
  <Accordion title="Modèles">
    Ids de modèle pris en charge : `inworld-tts-1.5-max` (par défaut),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Sorties audio">
    Les réponses utilisent MP3 par défaut. Lorsque la cible du canal est `voice-note`,
    OpenClaw demande à Inworld `OGG_OPUS` afin que l’audio soit lu comme une bulle
    vocale native. La synthèse de téléphonie utilise du `PCM` brut à 22050 Hz pour alimenter
    le pont de téléphonie.
  </Accordion>
  <Accordion title="Points de terminaison personnalisés">
    Remplacez l’hôte API avec `messages.tts.providers.inworld.baseUrl`.
    Les slashs de fin sont supprimés avant l’envoi des requêtes.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Vue d’ensemble TTS, fournisseurs, et configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration, y compris les réglages `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw intégrés.
  </Card>
  <Card title="Résolution des problèmes" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
