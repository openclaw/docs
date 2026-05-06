---
read_when:
    - Ajustement du comportement de la superposition vocale
summary: Cycle de vie de la superposition vocale lorsque le mot d’activation et l’appui pour parler se chevauchent
title: Surcouche vocale
x-i18n:
    generated_at: "2026-05-06T07:31:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Cycle de vie de la superposition vocale (macOS)

Public : contributeurs de l’app macOS. Objectif : garder la superposition vocale prévisible lorsque le mot d’activation et l’appuyer-pour-parler se chevauchent.

## Intention actuelle

- Si la superposition est déjà visible à cause du mot d’activation et que l’utilisateur appuie sur le raccourci clavier, la session du raccourci clavier _adopte_ le texte existant au lieu de le réinitialiser. La superposition reste affichée tant que le raccourci clavier est maintenu. Lorsque l’utilisateur relâche : envoyer s’il reste du texte après suppression des espaces, sinon fermer.
- Le mot d’activation seul continue à envoyer automatiquement en cas de silence ; l’appuyer-pour-parler envoie immédiatement au relâchement.

## Implémenté (9 déc. 2025)

- Les sessions de superposition portent désormais un jeton par capture (mot d’activation ou appuyer-pour-parler). Les mises à jour partielles/finales/d’envoi/de fermeture/de niveau sont ignorées lorsque le jeton ne correspond pas, ce qui évite les rappels obsolètes.
- L’appuyer-pour-parler adopte tout texte de superposition visible comme préfixe (ainsi, appuyer sur le raccourci clavier pendant que la superposition de réveil est affichée conserve le texte et ajoute la nouvelle parole). Il attend jusqu’à 1,5 s une transcription finale avant de revenir au texte actuel.
- La journalisation du carillon/de la superposition est émise au niveau `info` dans les catégories `voicewake.overlay`, `voicewake.ptt` et `voicewake.chime` (début de session, partiel, final, envoi, fermeture, raison du carillon).

## Étapes suivantes

1. **VoiceSessionCoordinator (acteur)**
   - Possède exactement une `VoiceSession` à la fois.
   - API (basée sur jeton) : `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Ignore les rappels qui portent des jetons obsolètes (empêche les anciens reconnaisseurs de rouvrir la superposition).
2. **VoiceSession (modèle)**
   - Champs : `token`, `source` (wakeWord|pushToTalk), texte validé/volatile, indicateurs de carillon, minuteurs (envoi automatique, inactivité), `overlayMode` (display|editing|sending), échéance du délai de récupération.
3. **Liaison de la superposition**
   - `VoiceSessionPublisher` (`ObservableObject`) réplique la session active dans SwiftUI.
   - `VoiceWakeOverlayView` s’affiche uniquement via le publisher ; il ne modifie jamais directement les singletons globaux.
   - Les actions utilisateur de la superposition (`sendNow`, `dismiss`, `edit`) rappellent le coordinateur avec le jeton de session.
4. **Chemin d’envoi unifié**
   - Sur `endCapture` : si le texte après suppression des espaces est vide → fermer ; sinon `performSend(session:)` (joue le carillon d’envoi une fois, transfère, ferme).
   - Appuyer-pour-parler : aucun délai ; mot d’activation : délai facultatif pour l’envoi automatique.
   - Appliquer un court délai de récupération au runtime de réveil après la fin de l’appuyer-pour-parler afin que le mot d’activation ne se redéclenche pas immédiatement.
5. **Journalisation**
   - Le coordinateur émet des journaux `.info` dans le sous-système `ai.openclaw`, catégories `voicewake.overlay` et `voicewake.chime`.
   - Événements clés : `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Liste de vérification de débogage

- Diffuser les journaux pendant la reproduction d’une superposition bloquée :

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vérifier qu’un seul jeton de session active existe ; les rappels obsolètes doivent être ignorés par le coordinateur.
- S’assurer que le relâchement de l’appuyer-pour-parler appelle toujours `endCapture` avec le jeton actif ; si le texte est vide, attendre `dismiss` sans carillon ni envoi.

## Étapes de migration (suggérées)

1. Ajouter `VoiceSessionCoordinator`, `VoiceSession` et `VoiceSessionPublisher`.
2. Refactoriser `VoiceWakeRuntime` pour créer/mettre à jour/terminer les sessions au lieu de toucher directement `VoiceWakeOverlayController`.
3. Refactoriser `VoicePushToTalk` pour adopter les sessions existantes et appeler `endCapture` au relâchement ; appliquer le délai de récupération du runtime.
4. Connecter `VoiceWakeOverlayController` au publisher ; supprimer les appels directs depuis le runtime/PTT.
5. Ajouter des tests d’intégration pour l’adoption de session, le délai de récupération et la fermeture avec texte vide.

## Associé

- [App macOS](/fr/platforms/macos)
- [Réveil vocal (macOS)](/fr/platforms/mac/voicewake)
- [Mode conversation](/fr/nodes/talk)
