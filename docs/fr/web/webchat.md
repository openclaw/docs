---
read_when:
    - Débogage ou configuration de l'accès à WebChat
summary: Hôte statique WebChat en loopback et utilisation de Gateway WS pour l'interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Statut : l'interface de chat SwiftUI macOS/iOS parle directement au WebSocket Gateway.

## Ce que c'est

- Une interface de chat native pour la gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et les mêmes règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours vers WebChat.

## Démarrage rapide

1. Démarrez la gateway.
2. Ouvrez l'interface WebChat (app macOS/iOS) ou l'onglet de chat de la Control UI.
3. Assurez-vous qu'un chemin d'authentification gateway valide est configuré (secret partagé par défaut,
   même en loopback).

## Fonctionnement (comportement)

- L'interface se connecte au WebSocket Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les champs de texte longs, omettre les métadonnées volumineuses et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` est également normalisé pour l'affichage : le contexte OpenClaw réservé au runtime,
  les wrappers d'enveloppe entrante, les balises de directive de livraison inline
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML
  d'appel d'outil en texte brut (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d'appel d'outil tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine largeur ayant fuité sont supprimés du texte visible,
  et les entrées assistant dont tout le texte visible n'est que le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées raisonnement (`isReasoning: true`) sont exclues du contenu assistant de WebChat, du texte de relecture de transcription et des blocs de contenu audio, afin que les charges utiles de thinking uniquement n'apparaissent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute directement une note assistant à la transcription et la diffuse vers l'interface (sans exécution d'agent).
- Les exécutions interrompues peuvent conserver une sortie assistant partielle visible dans l'interface.
- Gateway conserve le texte assistant partiel interrompu dans l'historique de transcription lorsqu'une sortie en tampon existe, et marque ces entrées avec des métadonnées d'interruption.
- L'historique est toujours récupéré depuis la gateway (sans surveillance de fichier local).
- Si la gateway est inaccessible, WebChat est en lecture seule.

## Panneau d'outils des agents de la Control UI

- Le panneau Tools de `/agents` dans la Control UI comporte deux vues distinctes :
  - **Available Right Now** utilise `tools.effective(sessionKey=...)` et affiche ce que la
    session actuelle peut réellement utiliser au runtime, y compris les outils core, Plugin et appartenant au canal.
  - **Tool Configuration** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité au runtime est scoped à la session. Changer de session sur le même agent peut modifier la
  liste **Available Right Now**.
- L'éditeur de configuration n'implique pas la disponibilité au runtime ; l'accès effectif suit toujours l'ordre
  de priorité de la politique (`allow`/`deny`, remplacements par agent et par provider/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket Gateway via SSH/Tailscale.
- Vous n'avez pas besoin d'exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu'une entrée de transcription dépasse cette limite, Gateway tronque les champs de texte longs et peut remplacer les messages surdimensionnés par un espace réservé. Un `maxChars` par requête peut également être envoyé par le client pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l'onglet de chat de la Control UI dans le navigateur peut utiliser les en-têtes d'identité Tailscale
  Serve lorsqu'ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source de proxy **hors loopback** consciente de l'identité (voir [Trusted Proxy Auth](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible gateway distante.
- `session.*` : stockage de session et valeurs par défaut de clé principale.

## Liens connexes

- [Control UI](/fr/web/control-ui)
- [Dashboard](/fr/web/dashboard)
