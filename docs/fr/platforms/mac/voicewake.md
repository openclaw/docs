---
read_when:
    - Travail sur les parcours de réveil vocal ou PTT
summary: Modes d’activation vocale et de push-to-talk, ainsi que détails de routage dans l’app Mac
title: Réveil vocal (macOS)
x-i18n:
    generated_at: "2026-06-27T17:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Réveil vocal et appuyer pour parler

## Exigences

Le Réveil vocal et l’appuyer pour parler nécessitent macOS 26 ou une version ultérieure. Sur les anciennes versions de macOS,
les contrôles sont masqués sur la page des réglages Voix, qui affiche l’exigence
macOS 26.

## Modes

- **Mode mot de réveil** (par défaut) : le reconnaisseur vocal Speech toujours actif attend les jetons de déclenchement (`swabbleTriggerWords`). En cas de correspondance, il démarre la capture, affiche la superposition avec le texte partiel, puis envoie automatiquement après un silence.
- **Appuyer pour parler (maintien de Option droite)** : maintenez la touche Option droite pour capturer immédiatement, sans déclencheur nécessaire. La superposition apparaît pendant le maintien ; le relâchement finalise et transmet après un court délai afin que vous puissiez ajuster le texte.

## Comportement à l’exécution (mot de réveil)

- Le reconnaisseur vocal Speech réside dans `VoiceWakeRuntime`.
- Le déclenchement ne se produit que lorsqu’il y a une **pause significative** entre le mot de réveil et le mot suivant (intervalle d’environ 0,55 s). La superposition/le carillon peut démarrer lors de la pause, même avant le début de la commande.
- Fenêtres de silence : 2,0 s lorsque la parole est en cours, 5,0 s si seul le déclencheur a été entendu.
- Arrêt forcé : 120 s pour éviter les sessions incontrôlées.
- Antirebond entre les sessions : 350 ms.
- La superposition est pilotée via `VoiceWakeOverlayController` avec une coloration validée/volatile.
- Après l’envoi, le reconnaisseur redémarre proprement pour écouter le prochain déclencheur.

## Invariants du cycle de vie

- Si le Réveil vocal est activé et que les autorisations sont accordées, le reconnaisseur de mot de réveil doit être à l’écoute (sauf pendant une capture explicite par appuyer pour parler).
- La visibilité de la superposition (y compris la fermeture manuelle via le bouton X) ne doit jamais empêcher le reconnaisseur de reprendre.

## Mode de défaillance de la superposition persistante (précédent)

Auparavant, si la superposition restait bloquée visible et que vous la fermiez manuellement, le Réveil vocal pouvait sembler « mort », car la tentative de redémarrage de l’exécution pouvait être bloquée par la visibilité de la superposition et aucun redémarrage ultérieur n’était planifié.

Renforcement :

- Le redémarrage de l’exécution du réveil n’est plus bloqué par la visibilité de la superposition.
- La fin de la fermeture de la superposition déclenche un `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, de sorte qu’une fermeture manuelle avec X reprend toujours l’écoute.

## Détails de l’appuyer pour parler

- La détection du raccourci utilise un moniteur global `.flagsChanged` pour **Option droite** (`keyCode 61` + `.option`). Nous observons seulement les événements (sans les intercepter).
- Le pipeline de capture réside dans `VoicePushToTalk` : il démarre Speech immédiatement, diffuse les résultats partiels vers la superposition et appelle `VoiceWakeForwarder` au relâchement.
- Lorsque l’appuyer pour parler démarre, nous mettons en pause l’exécution du mot de réveil pour éviter des prises audio concurrentes ; elle redémarre automatiquement après le relâchement.
- Autorisations : nécessite Microphone + Speech ; voir les événements nécessite l’approbation Accessibilité/Surveillance de la saisie.
- Claviers externes : certains peuvent ne pas exposer Option droite comme prévu ; proposez un raccourci de secours si des utilisateurs signalent des ratés.

## Réglages visibles par l’utilisateur

- Bascule **Réveil vocal** : active l’exécution du mot de réveil.
- **Maintenir Option droite pour parler** : active le moniteur d’appuyer pour parler.
- Sélecteurs de langue et de micro, vumètre en direct, tableau des mots de déclenchement, testeur (local uniquement ; ne transmet pas).
- Le sélecteur de micro conserve la dernière sélection si un appareil se déconnecte, affiche une indication de déconnexion et revient temporairement au périphérique par défaut du système jusqu’à son retour.
- **Sons** : carillons lors de la détection du déclencheur et lors de l’envoi ; par défaut, utilise le son système macOS « Glass ». Vous pouvez choisir n’importe quel fichier chargeable par `NSSound` (par exemple MP3/WAV/AIFF) pour chaque événement, ou choisir **Aucun son**.

## Comportement de transmission

- Lorsque le Réveil vocal est activé, les transcriptions sont transmises au Gateway/agent actif (le même mode local ou distant que celui utilisé par le reste de l’app Mac).
- Les réponses sont envoyées au **dernier fournisseur principal utilisé** (WhatsApp/Telegram/Discord/WebChat). Si la livraison échoue, l’erreur est journalisée et l’exécution reste visible via WebChat/les journaux de session.

## Charge utile de transmission

- `VoiceWakeForwarder.prefixedTranscript(_:)` préfixe l’indication de la machine avant l’envoi. Partagé entre les chemins mot de réveil et appuyer pour parler.

## Vérification rapide

- Activez l’appuyer pour parler, maintenez Option droite, parlez, relâchez : la superposition doit afficher les résultats partiels puis envoyer.
- Pendant le maintien, les oreilles de la barre de menus doivent rester agrandies (utilise `triggerVoiceEars(ttl:nil)`) ; elles redescendent après le relâchement.

## Connexe

- [Réveil vocal](/fr/nodes/voicewake)
- [Superposition vocale](/fr/platforms/mac/voice-overlay)
- [App macOS](/fr/platforms/macos)
