---
read_when:
    - Travailler sur les parcours de réveil vocal ou PTT
summary: Modes d’activation vocale et d’appui pour parler, ainsi que détails de routage dans l’application Mac
title: Réveil vocal (macOS)
x-i18n:
    generated_at: "2026-05-06T07:32:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Réveil vocal et push-to-talk

## Modes

- **Mode mot de réveil** (par défaut) : le reconnaisseur vocal toujours actif attend les jetons déclencheurs (`swabbleTriggerWords`). En cas de correspondance, il démarre la capture, affiche la superposition avec le texte partiel, puis envoie automatiquement après un silence.
- **Push-to-talk (maintien de la touche Option droite)** : maintenez la touche Option droite pour capturer immédiatement, sans déclencheur. La superposition apparaît pendant le maintien ; le relâchement finalise et transmet après un court délai pour vous permettre d’ajuster le texte.

## Comportement à l’exécution (mot de réveil)

- Le reconnaisseur vocal réside dans `VoiceWakeRuntime`.
- Le déclencheur ne se lance que lorsqu’il y a une **pause significative** entre le mot de réveil et le mot suivant (intervalle d’environ 0,55 s). La superposition/le carillon peut démarrer pendant la pause, avant même le début de la commande.
- Fenêtres de silence : 2,0 s lorsque la parole est en cours, 5,0 s si seul le déclencheur a été entendu.
- Arrêt forcé : 120 s pour éviter les sessions incontrôlées.
- Anti-rebond entre les sessions : 350 ms.
- La superposition est pilotée via `VoiceWakeOverlayController` avec une coloration validée/volatile.
- Après l’envoi, le reconnaisseur redémarre proprement pour écouter le déclencheur suivant.

## Invariants de cycle de vie

- Si le réveil vocal est activé et que les autorisations sont accordées, le reconnaisseur de mot de réveil doit être à l’écoute (sauf pendant une capture push-to-talk explicite).
- La visibilité de la superposition (y compris la fermeture manuelle via le bouton X) ne doit jamais empêcher le reconnaisseur de reprendre.

## Mode de défaillance de superposition persistante (précédent)

Auparavant, si la superposition restait bloquée en étant visible et que vous la fermiez manuellement, le réveil vocal pouvait sembler « mort », car la tentative de redémarrage du runtime pouvait être bloquée par la visibilité de la superposition et aucun redémarrage ultérieur n’était planifié.

Renforcement :

- Le redémarrage du runtime de réveil n’est plus bloqué par la visibilité de la superposition.
- La fin de la fermeture de la superposition déclenche un `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, de sorte qu’une fermeture manuelle avec X reprend toujours l’écoute.

## Spécificités du push-to-talk

- La détection du raccourci utilise un moniteur global `.flagsChanged` pour **Option droite** (`keyCode 61` + `.option`). Nous observons uniquement les événements (sans les intercepter).
- Le pipeline de capture réside dans `VoicePushToTalk` : il démarre immédiatement Speech, diffuse les fragments partiels vers la superposition et appelle `VoiceWakeForwarder` au relâchement.
- Lorsque le push-to-talk démarre, nous mettons en pause le runtime de mot de réveil afin d’éviter des prises audio concurrentes ; il redémarre automatiquement après le relâchement.
- Autorisations : nécessite Microphone + Speech ; voir les événements nécessite l’approbation Accessibilité/Surveillance de la saisie.
- Claviers externes : certains peuvent ne pas exposer Option droite comme prévu ; proposez un raccourci de secours si les utilisateurs signalent des ratés.

## Paramètres visibles par l’utilisateur

- Bouton **Réveil vocal** : active le runtime de mot de réveil.
- **Maintenir Cmd+Fn pour parler** : active le moniteur push-to-talk. Désactivé sur macOS < 26.
- Sélecteurs de langue et de micro, vumètre en direct, tableau des mots déclencheurs, testeur (local uniquement ; ne transmet pas).
- Le sélecteur de micro conserve la dernière sélection si un appareil se déconnecte, affiche une indication de déconnexion et revient temporairement au micro système par défaut jusqu’à son retour.
- **Sons** : carillons lors de la détection du déclencheur et lors de l’envoi ; utilise par défaut le son système macOS « Glass ». Vous pouvez choisir n’importe quel fichier chargeable par `NSSound` (par exemple MP3/WAV/AIFF) pour chaque événement ou choisir **Aucun son**.

## Comportement de transmission

- Lorsque le réveil vocal est activé, les transcriptions sont transmises au Gateway/agent actif (le même mode local ou distant que celui utilisé par le reste de l’application Mac).
- Les réponses sont livrées au **dernier fournisseur principal utilisé** (WhatsApp/Telegram/Discord/WebChat). Si la livraison échoue, l’erreur est journalisée et l’exécution reste visible via les journaux WebChat/session.

## Charge utile de transmission

- `VoiceWakeForwarder.prefixedTranscript(_:)` ajoute l’indice machine avant l’envoi. Partagé entre les chemins mot de réveil et push-to-talk.

## Vérification rapide

- Activez le push-to-talk, maintenez Cmd+Fn, parlez, relâchez : la superposition doit afficher les fragments partiels puis envoyer.
- Pendant le maintien, les oreilles de la barre de menus doivent rester agrandies (utilise `triggerVoiceEars(ttl:nil)`) ; elles disparaissent après le relâchement.

## Associés

- [Réveil vocal](/fr/nodes/voicewake)
- [Superposition vocale](/fr/platforms/mac/voice-overlay)
- [Application macOS](/fr/platforms/macos)
