---
read_when:
    - Vous voulez la synthèse vocale Inworld pour les réponses sortantes
    - Vous avez besoin d’une sortie de téléphonie PCM ou de note vocale OGG_OPUS depuis Inworld
summary: Synthèse vocale en streaming d’Inworld pour les réponses OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:05:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld est un fournisseur de synthèse vocale (TTS) en streaming. Dans OpenClaw, il
synthétise l’audio des réponses sortantes (MP3 par défaut, OGG_OPUS pour les notes vocales)
et l’audio PCM pour les canaux de téléphonie comme Voice Call.

OpenClaw publie vers le point de terminaison TTS en streaming d’Inworld, concatène les
fragments audio base64 renvoyés dans un seul tampon, puis transmet le résultat au
pipeline standard d’audio de réponse.

| Propriété      | Valeur                                                           |
| ------------- | --------------------------------------------------------------- |
| ID du fournisseur | `inworld`                                                       |
| Plugin        | package externe officiel                                       |
| Contrat      | `speechProviders` (TTS uniquement)                                    |
| Variable d’environnement d’authentification  | `INWORLD_API_KEY` (HTTP Basic, identifiant du tableau de bord en Base64)     |
| URL de base      | `https://api.inworld.ai`                                        |
| Voix par défaut | `Sarah`                                                         |
| Modèle par défaut | `inworld-tts-1.5-max`                                           |
| Sortie        | MP3 (par défaut), OGG_OPUS (notes vocales), PCM 22050 Hz (téléphonie) |
| Site web       | [inworld.ai](https://inworld.ai)                                |
| Documentation          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Définissez votre clé API">
    Copiez l’identifiant depuis votre tableau de bord Inworld (Workspace > API Keys)
    et définissez-le comme variable d’environnement. La valeur est envoyée telle quelle comme
    identifiant HTTP Basic ; ne l’encodez donc pas à nouveau en Base64 et ne la convertissez
    pas en jeton bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Sélectionnez Inworld dans messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
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
    l’audio avec Inworld et le transmet en MP3 (ou en OGG_OPUS lorsque le canal
    attend une note vocale).
  </Step>
</Steps>

## Options de configuration

| Option           | Chemin                                            | Description                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Identifiant du tableau de bord en Base64. Se rabat sur `INWORLD_API_KEY`.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Remplace l’URL de base de l’API Inworld (par défaut `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Identifiant de voix (par défaut `Sarah`).                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID du modèle TTS (par défaut `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Température d’échantillonnage `0..2` (facultatif).                           |

## Notes

<AccordionGroup>
  <Accordion title="Authentification">
    Inworld utilise l’authentification HTTP Basic avec une seule chaîne d’identifiant
    encodée en Base64. Copiez-la telle quelle depuis le tableau de bord Inworld. Le fournisseur l’envoie
    sous la forme `Authorization: Basic <apiKey>` sans aucun encodage supplémentaire ; ne
    l’encodez donc pas vous-même en Base64 et ne transmettez pas de jeton de type bearer.
    Voir les [notes d’authentification TTS](/fr/tools/tts#inworld-primary) pour le même rappel.
  </Accordion>
  <Accordion title="Modèles">
    ID de modèles pris en charge : `inworld-tts-1.5-max` (par défaut),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Sorties audio">
    Les réponses utilisent MP3 par défaut. Lorsque la cible du canal est `voice-note`,
    OpenClaw demande `OGG_OPUS` à Inworld afin que l’audio soit lu comme une bulle
    vocale native. La synthèse de téléphonie utilise du `PCM` brut à 22050 Hz pour alimenter
    le pont de téléphonie.
  </Accordion>
  <Accordion title="Points de terminaison personnalisés">
    Remplacez l’hôte de l’API avec `messages.tts.providers.inworld.baseUrl`.
    Les barres obliques finales sont supprimées avant l’envoi des requêtes.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="waveform-lines">
    Vue d’ensemble de TTS, fournisseurs et configuration `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration, y compris les paramètres `messages.tts`.
  </Card>
  <Card title="Fournisseurs" href="/fr/providers" icon="grid">
    Tous les fournisseurs OpenClaw pris en charge.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
</CardGroup>
