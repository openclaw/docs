---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique WebChat de bouclage et utilisation du WS du Gateway pour l’interface utilisateur de chat
title: Chat Web
x-i18n:
    generated_at: "2026-04-30T07:55:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

État : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket du Gateway.

## Ce que c’est

- Une interface de chat native pour le gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de la Control UI.
3. Assurez-vous qu’un chemin d’authentification gateway valide est configuré (shared-secret par défaut,
   même en boucle locale).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket du Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les champs de texte longs, omettre les métadonnées lourdes et remplacer les entrées trop volumineuses par `[chat.history omitted: message too large]`.
- `chat.history` suit la branche active de la transcription pour les fichiers de session append-only modernes, afin que les branches de réécriture abandonnées et les copies de prompts remplacées ne soient pas affichées dans WebChat.
- Control UI fusionne les envois en cours dupliqués pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; le Gateway déduplique toujours les requêtes répétées qui réutilisent la même clé d’idempotence.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw uniquement disponible à l’exécution,
  les enveloppes entrantes, les balises de directives de livraison en ligne
  comme `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML
  d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse ayant fuité sont supprimés du texte visible,
  et les entrées assistant dont tout le texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu assistant WebChat, du texte de relecture de transcription et des blocs de contenu audio, afin que les charges utiles contenant uniquement de la réflexion n’apparaissent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute une note assistant directement à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie assistant partielle visible dans l’interface.
- Gateway persiste le texte assistant partiel interrompu dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (pas de surveillance de fichiers locaux).
- Si le gateway est inaccessible, WebChat est en lecture seule.

## Panneau d’outils des agents Control UI

- Le panneau Tools de Control UI `/agents` comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et affiche ce que la session actuelle
    peut réellement utiliser à l’exécution, notamment les outils core, plugin et appartenant au canal.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est propre à la session. Changer de session sur le même agent peut modifier la
  liste **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la priorité
  des politiques (`allow`/`deny`, remplacements par agent et par provider/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket du gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat distinct.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, Gateway tronque les champs de texte longs et peut remplacer les messages trop volumineux par un placeholder. Le client peut aussi envoyer `maxChars` par requête pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket shared-secret.
- `gateway.auth.allowTailscale` : l’onglet de chat Control UI du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsque cette option est activée.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source proxy **non issue de la boucle locale** sensible à l’identité (voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible de gateway distant.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Connexe

- [Control UI](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
