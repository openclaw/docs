---
read_when:
    - Vous souhaitez utiliser la synthèse vocale Inworld pour les réponses sortantes
    - Vous avez besoin d’une sortie de téléphonie PCM ou de note vocale OGG_OPUS depuis Inworld
summary: Synthèse vocale en streaming d’Inworld pour les réponses d’OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T07:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld est un fournisseur de synthèse vocale en streaming (TTS). Dans OpenClaw, il
synthétise l’audio des réponses sortantes (MP3 par défaut, OGG_OPUS pour les notes vocales)
et l’audio PCM pour les canaux de téléphonie tels que les appels vocaux.

OpenClaw publie vers le point de terminaison TTS en streaming d’Inworld, concatène les
fragments audio base64 renvoyés dans un seul tampon, puis transmet le résultat au
pipeline audio de réponse standard.

| Propriété     | Valeur                                                          |
| ------------- | --------------------------------------------------------------- |
| ID fournisseur | `inworld`                                                      |
| Plugin        | intégré, `enabledByDefault: true`                               |
| Contrat       | `speechProviders` (TTS uniquement)                              |
| Variable d’env. d’auth. | `INWORLD_API_KEY` (HTTP Basic, identifiant du tableau de bord en Base64) |
| URL de base   | `https://api.inworld.ai`                                        |
| Voix par défaut | `Sarah`                                                       |
| Modèle par défaut | `inworld-tts-1.5-max`                                      |
| Sortie        | MP3 (par défaut), OGG_OPUS (notes vocales), PCM 22050 Hz (téléphonie) |
| Site web      | [inworld.ai](https://inworld.ai)                                |
| Documentation | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Démarrage

<Steps>
  <Step title="Définir votre clé API">
    Copiez l’identifiant depuis votre tableau de bord Inworld (Workspace > API Keys)
    et définissez-le comme variable d’environnement. La valeur est envoyée telle quelle
    comme identifiant HTTP Basic ; ne l’encodez donc pas à nouveau en Base64 et ne la
    convertissez pas en jeton bearer.

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
    attend une note vocale).
  </Step>
</Steps>

## Options de configuration

| Option        | Chemin                                       | Description                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Identifiant du tableau de bord en Base64. Se rabat sur `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Remplace l’URL de base de l’API Inworld (par défaut `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identifiant de voix (par défaut `Sarah`).                         |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID du modèle TTS (par défaut `inworld-tts-1.5-max`).              |
| `temperature` | `messages.tts.providers.inworld.temperature` | Température d’échantillonnage `0..2` (facultatif).                |

## Notes

<AccordionGroup>
  <Accordion title="Authentification">
    Inworld utilise l’authentification HTTP Basic avec une seule chaîne
    d’identifiant encodée en Base64. Copiez-la telle quelle depuis le tableau de bord
    Inworld. Le fournisseur l’envoie sous la forme `Authorization: Basic <apiKey>`
    sans autre encodage ; ne l’encodez donc pas vous-même en Base64 et ne transmettez
    pas un jeton de style bearer. Consultez les [notes d’authentification TTS](/fr/tools/tts#inworld-primary)
    pour le même rappel.
  </Accordion>
  <Accordion title="Modèles">
    ID de modèles pris en charge : `inworld-tts-1.5-max` (par défaut),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Sorties audio">
    Les réponses utilisent MP3 par défaut. Lorsque la cible du canal est `voice-note`,
    OpenClaw demande `OGG_OPUS` à Inworld afin que l’audio soit lu comme une bulle
    vocale native. La synthèse téléphonique utilise du `PCM` brut à 22050 Hz pour
    alimenter la passerelle téléphonique.
  </Accordion>
  <Accordion title="Points de terminaison personnalisés">
    Remplacez l’hôte de l’API avec `messages.tts.providers.inworld.baseUrl`.
    Les barres obliques finales sont supprimées avant l’envoi des requêtes.
  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Vue d’ensemble TTS, fournisseurs et configuration `messages.tts`.
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
