---
read_when:
    - Réglage du comportement de la superposition vocale
summary: Cycle de vie de la superposition vocale lorsque le mot d’activation et le mode « appuyer pour parler » se chevauchent
title: Superposition vocale
x-i18n:
    generated_at: "2026-07-12T15:31:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Cycle de vie de la superposition vocale (macOS)

Public : contributeurs à l’application macOS. Objectif : garantir un comportement prévisible de la superposition vocale lorsque la détection du mot d’activation et le mode appuyer-pour-parler se chevauchent.

## Comportement

- Si la superposition est déjà visible à la suite de la détection du mot d’activation et que l’utilisateur appuie sur la touche de raccourci, la session lancée par cette touche adopte le texte existant au lieu de le réinitialiser. La superposition reste affichée tant que la touche est maintenue. Au relâchement : envoyer si le texte sans espaces superflus n’est pas vide, sinon fermer.
- La détection du mot d’activation seule continue d’effectuer un envoi automatique après un silence ; le mode appuyer-pour-parler envoie immédiatement au relâchement.

## Implémentation

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) est l’unique propriétaire de la session vocale active. Il s’agit d’un singleton `@MainActor @Observable`, et non d’un acteur. API : `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Chaque session comporte un jeton `UUID` ; les appels utilisant un jeton obsolète ou non concordant sont ignorés.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) affiche la superposition et retransmet les actions de l’utilisateur (`requestSend`, `dismiss`) au coordinateur à l’aide du jeton de session. Il ne possède jamais lui-même l’état de la session.
- Le mode appuyer-pour-parler (`VoicePushToTalk.begin()`) adopte tout texte visible dans la superposition comme `adoptedPrefix` (via `VoiceSessionCoordinator.shared.snapshot()`), de sorte qu’une pression sur la touche de raccourci pendant l’affichage de la superposition d’activation conserve le texte et y ajoute la nouvelle parole. Au relâchement, il attend jusqu’à 1.5s l’obtention d’une transcription finale avant de se rabattre sur le texte actuel.
- Lors de `dismiss`, la superposition appelle `VoiceSessionCoordinator.overlayDidDismiss`, ce qui déclenche `VoiceWakeRuntime.refresh(state:)` afin que la fermeture manuelle avec X, la fermeture en cas de texte vide et la fermeture après l’envoi reprennent toutes l’écoute du mot d’activation.
- Chemin d’envoi unifié : si le texte sans espaces superflus est vide, fermer ; sinon, `sendNow` joue une fois le carillon d’envoi, transmet le texte via `VoiceWakeForwarder`, puis ferme la superposition.

## Journalisation

Le sous-système vocal est `ai.openclaw` ; chaque composant utilise sa propre catégorie de journalisation :

| Catégorie               | Composant                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Touche de raccourci et capture du mode appuyer-pour-parler |
| `voicewake.runtime`     | Environnement d’exécution du mot d’activation   |
| `voicewake.chime`       | Lecture du carillon                             |
| `voicewake.sync`        | Synchronisation des paramètres globaux          |
| `voicewake.forward`     | Transmission de la transcription                |
| `voicewake.meter`       | Moniteur du niveau du microphone                 |

## Liste de vérification pour le débogage

- Diffusez les journaux en continu pendant que vous reproduisez une superposition qui reste affichée :

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vérifiez qu’un seul jeton de session est actif ; les rappels obsolètes sont ignorés par le coordinateur.
- Vérifiez que le relâchement en mode appuyer-pour-parler appelle toujours `end()` avec le jeton actif ; si le texte est vide, attendez-vous à une fermeture sans carillon ni envoi.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [Activation vocale (macOS)](/fr/platforms/mac/voicewake)
- [Mode conversation](/fr/nodes/talk)
