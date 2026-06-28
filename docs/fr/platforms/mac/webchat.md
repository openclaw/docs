---
read_when:
    - Débogage de la vue WebChat sur Mac ou du port de boucle locale
summary: Comment l’application Mac intègre le WebChat du Gateway et comment le déboguer
title: Chat Web (macOS)
x-i18n:
    generated_at: "2026-05-06T07:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

L’application de la barre de menus macOS intègre l’interface WebChat comme vue SwiftUI native. Elle
se connecte au Gateway et utilise par défaut la **session principale** pour l’agent
sélectionné (avec un sélecteur de session pour les autres sessions).

- **Mode local** : se connecte directement au WebSocket du Gateway local.
- **Mode distant** : transfère le port de contrôle du Gateway via SSH et utilise ce
  tunnel comme plan de données.

## Lancement et débogage

- Manuel : menu Lobster → « Open Chat ».
- Ouverture automatique pour les tests :

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Journaux : `./scripts/clawlog.sh` (sous-système `ai.openclaw`, catégorie `WebChatSwiftUI`).

## Comment il est raccordé

- Plan de données : méthodes WS du Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` et événements `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` renvoie des lignes de transcription normalisées pour l’affichage : les balises de directive
  en ligne sont supprimées du texte visible, les charges utiles XML d’appels d’outils en texte brut
  (notamment `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, ainsi que les blocs d’appels d’outils tronqués) et
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés, les lignes d’assistant
  composées uniquement de jetons silencieux comme exactement `NO_REPLY` / `no_reply` sont
  omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
- Session : utilise par défaut la session principale (`main`, ou `global` lorsque la portée est
  globale). L’interface peut basculer entre les sessions.
- L’intégration initiale utilise une session dédiée afin de séparer la configuration du premier lancement.

## Surface de sécurité

- Le mode distant ne transfère que le port de contrôle WebSocket du Gateway via SSH.

## Limitations connues

- L’interface est optimisée pour les sessions de chat (pas pour un bac à sable de navigateur complet).

## Connexe

- [WebChat](/fr/web/webchat)
- [application macOS](/fr/platforms/macos)
