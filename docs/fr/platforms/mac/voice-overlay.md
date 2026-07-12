---
read_when:
    - Ajustement du comportement de la superposition vocale
summary: Cycle de vie de la superposition vocale lorsque le mot d’activation et l’appui pour parler se chevauchent
title: Superposition vocale
x-i18n:
    generated_at: "2026-07-12T02:49:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Cycle de vie de la superposition vocale (macOS)

Public : contributeurs de l’application macOS. Objectif : garantir un comportement prévisible de la superposition vocale lorsque le mot d’activation et l’appui pour parler se chevauchent.

## Comportement

- Si la superposition est déjà visible à la suite du mot d’activation et que l’utilisateur appuie sur le raccourci clavier, la session du raccourci reprend le texte existant au lieu de le réinitialiser. La superposition reste affichée tant que le raccourci est maintenu. Au relâchement : envoyer si le texte épuré n’est pas vide, sinon fermer.
- Le mot d’activation seul continue d’entraîner un envoi automatique en cas de silence ; l’appui pour parler envoie immédiatement au relâchement.

## Implémentation

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) est l’unique propriétaire de la session vocale active. Il s’agit d’un singleton `@MainActor @Observable`, et non d’un acteur. API : `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Chaque session comporte un jeton `UUID` ; les appels utilisant un jeton obsolète ou non concordant sont ignorés.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) affiche la superposition et retransmet les actions de l’utilisateur (`requestSend`, `dismiss`) au coordinateur au moyen du jeton de session. Il ne possède jamais lui-même l’état de la session.
- L’appui pour parler (`VoicePushToTalk.begin()`) reprend tout texte visible dans la superposition comme `adoptedPrefix` (via `VoiceSessionCoordinator.shared.snapshot()`), de sorte qu’un appui sur le raccourci lorsque la superposition d’activation est affichée conserve le texte et y ajoute la nouvelle parole. Au relâchement, il attend jusqu’à 1,5 s la transcription finale avant de se rabattre sur le texte actuel.
- Lors de `dismiss`, la superposition appelle `VoiceSessionCoordinator.overlayDidDismiss`, ce qui déclenche `VoiceWakeRuntime.refresh(state:)` afin que la fermeture manuelle avec le bouton X, la fermeture pour texte vide et la fermeture après envoi reprennent toutes l’écoute du mot d’activation.
- Chemin d’envoi unifié : si le texte épuré est vide, fermer ; sinon, `sendNow` joue une seule fois le carillon d’envoi, transmet le texte via `VoiceWakeForwarder`, puis ferme la superposition.

## Journalisation

Le sous-système vocal est `ai.openclaw` ; chaque composant consigne les événements dans sa propre catégorie :

| Catégorie               | Composant                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Raccourci d’appui pour parler et capture        |
| `voicewake.runtime`     | Exécution du mot d’activation                   |
| `voicewake.chime`       | Lecture du carillon                             |
| `voicewake.sync`        | Synchronisation des réglages globaux            |
| `voicewake.forward`     | Transmission de la transcription                |
| `voicewake.meter`       | Surveillance du niveau du microphone            |

## Liste de vérification pour le débogage

- Diffusez les journaux pendant la reproduction d’une superposition qui reste bloquée :

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vérifiez qu’un seul jeton de session est actif ; les rappels obsolètes sont ignorés par le coordinateur.
- Confirmez que le relâchement de l’appui pour parler appelle toujours `end()` avec le jeton actif ; si le texte est vide, attendez-vous à une fermeture sans carillon ni envoi.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Activation vocale (macOS)](/fr/platforms/mac/voicewake)
- [Mode conversation](/fr/nodes/talk)
