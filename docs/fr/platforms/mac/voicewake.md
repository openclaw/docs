---
read_when:
    - Travail sur les parcours d’activation vocale ou PTT
summary: Modes d’activation vocale et d’appui pour parler, ainsi que détails du routage dans l’app Mac
title: Activation vocale (macOS)
x-i18n:
    generated_at: "2026-07-12T03:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Réveil vocal et appuyer-pour-parler

## Configuration requise

Le réveil vocal et la fonction appuyer-pour-parler nécessitent macOS 26 ou une version ultérieure. Sur les versions antérieures de macOS, les commandes sont masquées sur la page des réglages vocaux, qui affiche à la place la nécessité d’utiliser macOS 26.

## Modes

- **Mode mot d’activation** (par défaut) : un module de reconnaissance vocale toujours actif attend les mots déclencheurs (`swabbleTriggerWords`). Lorsqu’il en détecte un, il commence la capture, affiche la superposition avec le texte partiel, puis envoie automatiquement le contenu après un silence.
- **Appuyer-pour-parler (maintenir la touche Option droite)** : maintenez la touche Option droite pour commencer immédiatement la capture, sans mot déclencheur. La superposition reste affichée tant que la touche est maintenue ; lorsque vous la relâchez, le contenu est finalisé puis transmis après un court délai afin que vous puissiez modifier le texte.

## Comportement à l’exécution (mot d’activation)

- Le module de reconnaissance se trouve dans `VoiceWakeRuntime`.
- Le déclenchement ne se produit que lorsqu’une pause significative sépare le mot d’activation du mot suivant (`triggerPauseWindow` = 0,55 s). La superposition et le signal sonore peuvent s’activer pendant cette pause, avant même le début de la commande.
- Fenêtres de silence : 2,0 s (`silenceWindow`) lorsque la parole se poursuit, 5,0 s (`triggerOnlySilenceWindow`) si seul le mot déclencheur a été entendu.
- Arrêt forcé : 120 s (`captureHardStop`) pour empêcher les sessions de se prolonger indéfiniment.
- Temporisation entre les sessions : 350 ms (`debounceAfterSend`) après un envoi.
- La superposition est gérée par `VoiceWakeOverlayController`, avec une coloration distincte pour le texte validé et le texte provisoire.
- Après l’envoi, le module de reconnaissance redémarre proprement afin d’attendre le prochain mot déclencheur.

## Invariants du cycle de vie

- Si le réveil vocal est activé et que les autorisations sont accordées, le module de reconnaissance du mot d’activation reste à l’écoute, sauf pendant une capture appuyer-pour-parler active.
- La fermeture de la superposition, y compris sa fermeture manuelle à l’aide du bouton X, réactive toujours le module de reconnaissance : `VoiceSessionCoordinator.overlayDidDismiss` appelle `VoiceWakeRuntime.refresh(state:)` pour chaque chemin de fermeture. Consultez [Superposition vocale](/fr/platforms/mac/voice-overlay) pour en savoir plus sur le modèle de session et de jeton.

## Particularités de la fonction appuyer-pour-parler

- La détection du raccourci clavier utilise un moniteur global `.flagsChanged` pour la touche Option droite (`keyCode 61` + `.option`). Il se contente d’observer les événements et ne les intercepte jamais.
- La capture se déroule dans `VoicePushToTalk` : elle démarre immédiatement la reconnaissance vocale, transmet les résultats partiels à la superposition et appelle `VoiceWakeForwarder` lorsque la touche est relâchée.
- Le démarrage de la fonction appuyer-pour-parler suspend l’exécution du mot d’activation afin d’éviter des captures audio concurrentes ; celle-ci redémarre automatiquement après le relâchement de la touche.
- Autorisations : nécessite l’accès au microphone et à la reconnaissance vocale ; la réception des événements clavier nécessite une autorisation d’accessibilité ou de surveillance des entrées.
- Claviers externes : certains n’exposent pas la touche Option droite comme prévu. Proposez un raccourci de secours si des utilisateurs signalent des détections manquées.

## Réglages visibles par l’utilisateur

- Bouton **Réveil vocal** : active l’exécution du mot d’activation.
- **Maintenir la touche Option droite pour parler** : active la surveillance de la fonction appuyer-pour-parler.
- Sélecteurs de langue et de microphone, indicateur de niveau en direct, tableau des mots déclencheurs et outil de test (local uniquement, sans aucune transmission).
- Le sélecteur de microphone conserve la dernière sélection si un appareil se déconnecte, affiche une indication de déconnexion et utilise temporairement le périphérique système par défaut jusqu’au retour de l’appareil.
- **Sons** : signaux sonores lors de la détection du mot déclencheur et de l’envoi, avec le son système « Glass » de macOS par défaut. Choisissez pour chaque événement n’importe quel fichier pouvant être chargé par `NSSound` (par exemple MP3/WAV/AIFF), ou sélectionnez **Aucun son**.

## Comportement de transmission

- Lors de la transmission, `VoiceWakeForwarder.selectedSessionOptions` sélectionne la clé de la session WebChat active si elle est définie ; sinon, il utilise la clé de la session principale du Gateway.
- Il recherche cette session au moyen de `sessions.list`, puis déduit le canal et la cible de livraison à partir du contexte de livraison de la session (avec repli sur son dernier canal et sa dernière cible, puis sur une clé de session analysée). WebChat est utilisé par défaut si aucune valeur ne peut être déterminée.
- Si la livraison échoue, l’erreur est consignée dans les journaux (catégorie `voicewake.forward`) et l’exécution reste visible dans les journaux de WebChat et de la session.

## Charge utile de transmission

- `VoiceWakeForwarder.prefixedTranscript(_:)` ajoute avant la transcription une ligne d’indication destinée à la machine (nom d’hôte résolu, avec repli sur « ce Mac »), commune aux chemins du mot d’activation et de la fonction appuyer-pour-parler.

## Vérification rapide

- Activez la fonction appuyer-pour-parler, maintenez la touche Option droite, parlez, puis relâchez-la : la superposition doit afficher les résultats partiels, puis les envoyer.
- Tant que la touche est maintenue, les oreilles de la barre des menus doivent rester agrandies (`triggerVoiceEars(ttl: nil)`) ; elles reprennent leur taille normale après le relâchement.

## Pages connexes

- [Réveil vocal](/fr/nodes/voicewake)
- [Superposition vocale](/fr/platforms/mac/voice-overlay)
- [Application macOS](/fr/platforms/macos)
