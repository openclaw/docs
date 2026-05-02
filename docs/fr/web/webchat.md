---
read_when:
    - Déboguer ou configurer l’accès à WebChat
summary: Hôte statique Loopback WebChat et utilisation WS du Gateway pour l’interface de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-02T23:39:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

État : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket du Gateway.

## Ce que c’est

- Une interface de chat native pour le Gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez le Gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de l’interface utilisateur de contrôle.
3. Assurez-vous qu’un chemin d’authentification de Gateway valide est configuré (secret partagé par défaut,
   même sur loopback).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket du Gateway et utilise `chat.history`, `chat.send`, `chat.inject` et `chat.transcribeAudio`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les champs de texte longs, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` suit la branche de transcription active pour les fichiers de session modernes en ajout uniquement ; les branches de réécriture abandonnées et les copies d’invite supplantées ne sont donc pas affichées dans WebChat.
- L’interface utilisateur de contrôle mémorise le `sessionId` Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants ; ainsi, les reconnexions et actualisations de page continuent la même conversation stockée, sauf si l’utilisateur démarre ou réinitialise une session.
- L’interface utilisateur de contrôle fusionne les soumissions en cours dupliquées pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; le Gateway déduplique encore les requêtes répétées qui réutilisent la même clé d’idempotence.
- `chat.history` est aussi normalisé pour l’affichage : le contexte OpenClaw propre à l’exécution,
  les enveloppes entrantes, les balises de directives de livraison en ligne
  comme `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML d’appels d’outils en texte brut
  (notamment `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés du texte visible,
  et les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu d’assistant WebChat, du texte de relecture de la transcription et des blocs de contenu audio ; les charges utiles réservées à la réflexion n’apparaissent donc pas comme messages d’assistant visibles ni comme audio lisible.
- `chat.transcribeAudio` alimente la dictée côté serveur dans le composeur de chat de l’interface utilisateur de contrôle. Le navigateur enregistre l’audio du microphone, l’envoie en base64 au Gateway, puis le Gateway exécute le pipeline `tools.media.audio` configuré. La transcription renvoyée est insérée dans le brouillon ; aucune exécution d’agent n’est lancée tant que l’utilisateur ne l’envoie pas.
- `chat.inject` ajoute directement une note d’assistant à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions abandonnées peuvent conserver une sortie partielle de l’assistant visible dans l’interface.
- Gateway persiste le texte partiel d’assistant abandonné dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe, et marque ces entrées avec des métadonnées d’abandon.
- L’historique est toujours récupéré depuis le Gateway (pas de surveillance de fichier local).
- Si le Gateway est injoignable, WebChat est en lecture seule.

## Panneau des outils d’agents de l’interface utilisateur de contrôle

- Le panneau Tools `/agents` de l’interface utilisateur de contrôle comporte deux vues distinctes :
  - **Disponibles maintenant** utilise `tools.effective(sessionKey=...)` et affiche ce que la session actuelle
    peut réellement utiliser à l’exécution, y compris les outils du cœur, des plugins et des canaux.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est limitée à la session. Changer de session sur le même agent peut modifier la
  liste **Disponibles maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la
  précédence des règles (`allow`/`deny`, remplacements par agent et par fournisseur/canal).

## Utilisation distante

- Le mode distant fait transiter le WebSocket du Gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, Gateway tronque les champs de texte longs et peut remplacer les messages surdimensionnés par un espace réservé. Un `maxChars` par requête peut aussi être envoyé par le client pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de l’interface utilisateur de contrôle du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source de proxy **non-loopback** sensible à l’identité (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible du Gateway distant.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Connexe

- [Interface utilisateur de contrôle](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
