---
read_when:
    - Débogage de la vue WebChat sur Mac ou du port local loopback
summary: Comment l’application Mac intègre le WebChat du Gateway et comment le déboguer
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T02:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

L’application de barre des menus macOS intègre l’interface WebChat sous forme de vue SwiftUI native. Elle se connecte au Gateway et utilise par défaut la session principale de l’agent sélectionné (`main`, ou `global` lorsque `session.scope` vaut `global`).

La fenêtre de discussion complète est une vue fractionnée native :

- **Barre latérale des sessions** : liste de sessions avec recherche, sections épinglées et récentes, indicateurs de messages non lus et menus contextuels permettant d’épingler ou de désépingler une session, de copier sa clé et de la supprimer. Un bouton de la barre d’outils (ou Cmd-N) crée une véritable nouvelle session via `sessions.create`.
- **Barre d’outils de la fenêtre** : anneau d’utilisation du contexte (jetons et coût de la session, avec une action compacte), sélecteur du niveau de réflexion, sélecteur de modèle et menu d’actions de session (nouvelle session, actualiser, copier la clé de session, exporter la transcription, compacter, effacer l’historique).
- **Transcription et zone de rédaction** : les messages de l’assistant s’affichent en texte brut avec un avatar, tandis que ceux de l’utilisateur apparaissent dans des bulles avec une couleur d’accentuation. La saisie de `/` ouvre la saisie semi-automatique des commandes slash, alimentée par `commands.list`, avec navigation au clavier à l’aide des touches fléchées, Tab, Return et Escape. Faites un clic droit sur un message pour le copier.

Le panneau de discussion rapide ancré à la barre des menus conserve une disposition compacte sur une seule colonne avec des sélecteurs intégrés.

- **Mode local** : se connecte directement au WebSocket du Gateway local.
- **Mode distant** : transfère le port de contrôle du Gateway via SSH et utilise ce tunnel comme plan de données.

## Lancement et débogage

- Manuellement : menu Lobster -> "Open Chat".
- Ouverture automatique pour les tests :

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` est accepté comme alias hérité.)

- Journaux : `./scripts/clawlog.sh` (sous-système `ai.openclaw`, catégorie `WebChatSwiftUI`).

## Fonctionnement du câblage

- Plan de données : méthodes WS du Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject`, et événements `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` renvoie une transcription normalisée pour l’affichage : les balises de directives intégrées sont retirées du texte visible, les charges utiles XML d’appels d’outils en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, y compris les blocs tronqués) ainsi que les jetons de contrôle du modèle divulgués sont supprimés, les lignes de l’assistant composées uniquement de jetons silencieux tels que les valeurs exactes `NO_REPLY`/`no_reply` sont omises, et les lignes trop volumineuses peuvent être remplacées par un espace réservé indiquant leur troncation.
- Session : utilise par défaut la session principale comme indiqué ci-dessus ; l’interface permet de passer d’une session à une autre.
- L’intégration initiale utilise une session dédiée afin de séparer la configuration de première exécution.
- Cache hors ligne : l’application conserve un petit cache en lecture seule des sessions de discussion et transcriptions récentes pour chaque Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`) : lors d’un démarrage à froid, elle affiche immédiatement la dernière transcription connue et l’actualise dès que le Gateway répond ; les discussions récentes restent consultables en cas de déconnexion, mais l’envoi demeure désactivé jusqu’au rétablissement de la connexion.

## Surface de sécurité

- Le mode distant transfère uniquement le port de contrôle WebSocket du Gateway via SSH.

## Limitations connues

- L’interface est optimisée pour les sessions de discussion, et non pour servir de bac à sable de navigateur complet.

## Voir aussi

- [WebChat](/fr/web/webchat)
- [Application macOS](/fr/platforms/macos)
