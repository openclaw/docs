---
read_when:
    - Travail sur les parcours d’activation vocale ou PTT
summary: Modes d’activation vocale et d’appui pour parler, ainsi que les détails de routage dans l’app Mac
title: Activation vocale (macOS)
x-i18n:
    generated_at: "2026-07-12T15:37:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activation vocale et appuyer-pour-parler

## Configuration requise

L’activation vocale et le mode appuyer-pour-parler nécessitent macOS 26 ou une version ultérieure. Sur les versions antérieures de macOS, les commandes sont masquées sur la page des réglages vocaux, qui affiche à la place l’exigence relative à macOS 26.

## Modes

- **Mode mot d’activation** (par défaut) : un module de reconnaissance vocale toujours actif attend les jetons déclencheurs (`swabbleTriggerWords`). Lorsqu’il les détecte, il démarre la capture, affiche la superposition avec le texte partiel et effectue l’envoi automatique après un silence.
- **Appuyer-pour-parler (maintenir la touche Option droite)** : maintenez la touche Option droite pour démarrer immédiatement la capture, sans déclencheur. La superposition reste affichée tant que la touche est maintenue ; son relâchement finalise et transfère le texte après un court délai afin que vous puissiez le modifier.

## Comportement à l’exécution (mot d’activation)

- Le module de reconnaissance se trouve dans `VoiceWakeRuntime`.
- Le déclenchement ne se produit que lorsqu’une pause significative sépare le mot d’activation du mot suivant (`triggerPauseWindow` = 0.55s). La superposition et le signal sonore peuvent s’activer pendant la pause, avant même le début de la commande.
- Fenêtres de silence : 2.0s (`silenceWindow`) lorsque la parole se poursuit, 5.0s (`triggerOnlySilenceWindow`) si seul le déclencheur a été entendu.
- Arrêt forcé : 120s (`captureHardStop`) pour éviter les sessions incontrôlées.
- Anti-rebond entre les sessions : 350ms (`debounceAfterSend`) après un envoi.
- La superposition est pilotée par `VoiceWakeOverlayController`, avec une coloration distincte du texte validé et du texte provisoire.
- Après l’envoi, le module de reconnaissance redémarre proprement afin d’écouter le déclencheur suivant.

## Invariants du cycle de vie

- Si l’activation vocale est activée et que les autorisations sont accordées, le module de reconnaissance du mot d’activation reste à l’écoute, sauf pendant une capture appuyer-pour-parler active.
- La fermeture de la superposition, y compris sa fermeture manuelle via le bouton X, reprend toujours le module de reconnaissance : `VoiceSessionCoordinator.overlayDidDismiss` appelle `VoiceWakeRuntime.refresh(state:)` pour chaque chemin de fermeture. Consultez [Superposition vocale](/fr/platforms/mac/voice-overlay) pour le modèle de session et de jeton.

## Particularités du mode appuyer-pour-parler

- La détection du raccourci utilise un moniteur global `.flagsChanged` pour la touche Option droite (`keyCode 61` + `.option`). Il ne fait qu’observer les événements, sans jamais les intercepter.
- La capture se trouve dans `VoicePushToTalk` : elle démarre immédiatement la reconnaissance vocale, transmet les résultats partiels à la superposition et appelle `VoiceWakeForwarder` au relâchement.
- Le démarrage du mode appuyer-pour-parler suspend l’exécution du mot d’activation afin d’éviter des captures audio concurrentes ; elle redémarre automatiquement après le relâchement.
- Autorisations : nécessite l’accès au microphone et à la reconnaissance vocale ; la réception des événements clavier nécessite une autorisation d’accessibilité ou de surveillance de la saisie.
- Claviers externes : certains n’exposent pas la touche Option droite comme prévu. Proposez un raccourci de secours si des utilisateurs signalent que la détection échoue.

## Réglages visibles par l’utilisateur

- Bouton **Activation vocale** : active l’exécution du mot d’activation.
- **Hold Right Option to talk** : active le moniteur du mode appuyer-pour-parler.
- Sélecteurs de langue et de microphone, indicateur de niveau en direct, tableau des mots déclencheurs et outil de test (local uniquement, sans aucun transfert).
- Le sélecteur de microphone conserve la dernière sélection si un appareil se déconnecte, affiche une indication de déconnexion et utilise temporairement le périphérique système par défaut jusqu’au retour de l’appareil.
- **Sons** : signaux sonores lors de la détection du déclencheur et de l’envoi, avec le son système « Glass » de macOS par défaut. Choisissez pour chaque événement n’importe quel fichier pouvant être chargé par `NSSound` (par exemple, MP3/WAV/AIFF), ou sélectionnez **No Sound**.

## Comportement du transfert

- Lors du transfert, `VoiceWakeForwarder.selectedSessionOptions` sélectionne la clé de la session WebChat active si elle est définie, sinon la clé de la session principale du Gateway.
- Il recherche cette session via `sessions.list` et déduit le canal et la cible de livraison à partir du contexte de livraison de la session (avec repli sur son dernier canal et sa dernière cible, puis sur une clé de session analysée), en utilisant WebChat par défaut si aucune résolution n’aboutit.
- Si la livraison échoue, l’erreur est journalisée (catégorie `voicewake.forward`) et l’exécution reste visible dans les journaux WebChat/de session.

## Charge utile du transfert

- `VoiceWakeForwarder.prefixedTranscript(_:)` ajoute avant la transcription une ligne d’indication destinée à la machine (nom d’hôte résolu, avec repli sur « ce Mac »), commune aux chemins du mot d’activation et du mode appuyer-pour-parler.

## Vérification rapide

- Activez le mode appuyer-pour-parler, maintenez la touche Option droite, parlez, puis relâchez-la : la superposition doit afficher les résultats partiels, puis effectuer l’envoi.
- Pendant que vous maintenez la touche, les oreilles de la barre des menus doivent rester agrandies (`triggerVoiceEars(ttl: nil)`) ; elles retrouvent leur taille normale après le relâchement.

## Voir aussi

- [Activation vocale](/fr/nodes/voicewake)
- [Superposition vocale](/fr/platforms/mac/voice-overlay)
- [Application macOS](/fr/platforms/macos)
