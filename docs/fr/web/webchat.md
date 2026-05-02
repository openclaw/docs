---
read_when:
    - Déboguer ou configurer l’accès à WebChat
summary: Hôte statique WebChat en boucle locale et utilisation de WS Gateway pour l’interface utilisateur de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-02T07:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Statut : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket du Gateway.

## Ce que c’est

- Une interface de chat native pour le gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de la Control UI.
3. Assurez-vous qu’un chemin d’authentification valide du gateway est configuré (secret partagé par défaut,
   même sur loopback).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket du Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : le Gateway peut tronquer les longs champs de texte, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` suit la branche de transcription active pour les fichiers de session modernes en ajout seul, de sorte que les branches de réécriture abandonnées et les copies de prompts remplacées ne sont pas affichées dans WebChat.
- La Control UI mémorise le `sessionId` du Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants, de sorte que les reconnexions et les actualisations de page poursuivent la même conversation stockée, sauf si l’utilisateur démarre ou réinitialise une session.
- La Control UI fusionne les soumissions en cours dupliquées pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; le Gateway déduplique toujours les requêtes répétées qui réutilisent la même clé d’idempotence.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw propre à l’exécution,
  les enveloppes entrantes, les balises de directives de livraison en ligne
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML
  d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont retirés du texte visible,
  et les entrées de l’assistant dont l’intégralité du texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu assistant WebChat, du texte de relecture de transcription et des blocs de contenu audio, de sorte que les charges utiles réservées à la réflexion n’apparaissent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute une note d’assistant directement à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie partielle de l’assistant visible dans l’interface.
- Le Gateway persiste le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (pas de surveillance de fichier local).
- Si le gateway est injoignable, WebChat est en lecture seule.

## Panneau d’outils des agents de la Control UI

- Le panneau Tools `/agents` de la Control UI comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et affiche ce que la session actuelle
    peut réellement utiliser à l’exécution, y compris les outils du noyau, des plugins et des canaux.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est limitée à la session. Changer de session sur le même agent peut modifier la
  liste **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la
  priorité des politiques (`allow`/`deny`, remplacements par agent et par fournisseur/canal).

## Utilisation à distance

- Le mode distant achemine le WebSocket du gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, le Gateway tronque les longs champs de texte et peut remplacer les messages surdimensionnés par un espace réservé. Un `maxChars` par requête peut également être envoyé par le client pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de la Control UI dans le navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsque cette option est activée.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source proxy **non-loopback** sensible à l’identité (voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible du gateway distant.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Associés

- [Control UI](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
