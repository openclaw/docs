---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique WebChat en loopback et utilisation du WS du Gateway pour l’interface de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-03T07:15:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Statut : l’interface de chat macOS/iOS SwiftUI communique directement avec le WebSocket du Gateway.

## Ce que c’est

- Une interface de chat native pour le gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de Control UI.
3. Assurez-vous qu’un chemin d’authentification gateway valide est configuré (secret partagé par défaut,
   même en loopback).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket du Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les champs de texte longs, omettre les métadonnées volumineuses et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` suit la branche de transcription active pour les fichiers de session modernes en ajout seul, de sorte que les branches de réécriture abandonnées et les copies de prompt remplacées ne sont pas affichées dans WebChat.
- Les entrées de Compaction s’affichent sous forme de séparateur explicite d’historique compacté. Le séparateur explique que les tours précédents sont conservés dans un point de contrôle et renvoie vers les contrôles de point de contrôle des sessions, où les opérateurs peuvent créer une branche ou restaurer la vue pré-Compaction lorsque leurs autorisations le permettent.
- Control UI mémorise le `sessionId` Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants, afin que les reconnexions et actualisations de page poursuivent la même conversation enregistrée, sauf si l’utilisateur démarre ou réinitialise une session.
- Control UI regroupe les soumissions en cours dupliquées pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; le Gateway déduplique toujours les requêtes répétées qui réutilisent la même clé d’idempotence.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw uniquement runtime,
  les enveloppes entrantes, les balises de directive de livraison en ligne
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML
  d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés du texte visible,
  et les entrées assistant dont l’intégralité du texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu assistant WebChat, du texte de relecture de transcription et des blocs de contenu audio, afin que les charges utiles réservées à la réflexion n’apparaissent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute une note assistant directement à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent laisser une sortie assistant partielle visible dans l’interface.
- Gateway persiste le texte assistant partiel interrompu dans l’historique de transcription lorsqu’une sortie mise en tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (pas de surveillance de fichier local).
- Si le gateway est inaccessible, WebChat est en lecture seule.

## Panneau d’outils des agents de Control UI

- Le panneau Tools `/agents` de Control UI comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et affiche ce que la session actuelle
    peut réellement utiliser au runtime, y compris les outils core, Plugin et appartenant au canal.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité au runtime est limitée à la session. Changer de session sur le même agent peut modifier la
  liste **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité au runtime ; l’accès effectif suit toujours la précédence
  des politiques (`allow`/`deny`, remplacements par agent et fournisseur/canal).

## Utilisation distante

- Le mode distant tunnelise le WebSocket du gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, Gateway tronque les champs de texte longs et peut remplacer les messages surdimensionnés par un placeholder. Le client peut aussi envoyer `maxChars` par requête pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat Control UI du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsque cette option est activée.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source de proxy **non-loopback** tenant compte de l’identité (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible du gateway distant.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Associés

- [Control UI](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
