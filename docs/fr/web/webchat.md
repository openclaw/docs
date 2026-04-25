---
read_when:
    - Déboguer ou configurer l’accès WebChat
summary: Hôte statique WebChat en loopback et utilisation de Gateway WS pour l’UI de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:00:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Statut : l’UI de chat SwiftUI macOS/iOS parle directement au WebSocket Gateway.

## Ce que c’est

- Une UI de chat native pour la Gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez la Gateway.
2. Ouvrez l’UI WebChat (application macOS/iOS) ou l’onglet de chat de l’UI de contrôle.
3. Assurez-vous qu’un chemin d’authentification Gateway valide est configuré (secret partagé par défaut,
   même en loopback).

## Comment cela fonctionne (comportement)

- L’UI se connecte au WebSocket Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : la Gateway peut tronquer les champs de texte longs, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw uniquement runtime,
  les wrappers d’enveloppe entrante, les balises de directive de livraison inline
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML d’appel d’outil en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/full-width divulgués sont supprimés du texte visible,
  et les entrées d’assistant dont tout le texte visible est uniquement le jeton
  silencieux exact `NO_REPLY` / `no_reply` sont omises.
- `chat.inject` ajoute directement une note d’assistant à la transcription et la diffuse à l’UI (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie partielle de l’assistant visible dans l’UI.
- La Gateway conserve le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis la Gateway (pas de surveillance de fichier locale).
- Si la Gateway est injoignable, WebChat est en lecture seule.

## Panneau des outils des agents de l’UI de contrôle

- Le panneau Outils de `/agents` dans l’UI de contrôle possède deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et montre ce que la
    session actuelle peut réellement utiliser à l’exécution, y compris les outils du cœur, des Plugins et des canaux.
  - **Configuration de l’outil** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est limitée à la session. Changer de session sur le même agent peut modifier la liste
  **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la priorité des politiques
  (`allow`/`deny`, remplacements par agent et par fournisseur/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket Gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, la Gateway tronque les champs texte longs et peut remplacer les messages surdimensionnés par un espace réservé. Le client peut également envoyer `maxChars` par requête pour remplacer cette valeur par défaut lors d’un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de l’UI de contrôle dans le navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source proxy **non-loopback** sensible à l’identité (voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible Gateway distante.
- `session.*` : stockage de session et valeurs par défaut de clé principale.

## Lié

- [UI de contrôle](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
