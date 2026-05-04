---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique Loopback WebChat et utilisation du WS du Gateway pour l’interface utilisateur de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-04T02:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Statut : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket du Gateway.

## Ce que c’est

- Une interface de chat native pour le gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours vers WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de l’interface de contrôle.
3. Assurez-vous qu’un chemin d’authentification gateway valide est configuré (secret partagé par défaut,
   même sur loopback).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket du Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : le Gateway peut tronquer les longs champs de texte, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` suit la branche de transcription active pour les fichiers de session modernes en ajout uniquement, afin que les branches de réécriture abandonnées et les copies d’invite remplacées ne soient pas affichées dans WebChat.
- Les entrées de Compaction s’affichent comme un séparateur explicite d’historique compacté. Le séparateur explique que les tours précédents sont conservés dans un point de contrôle et renvoie vers les contrôles de point de contrôle des sessions, où les opérateurs peuvent créer une branche ou restaurer la vue pré-Compaction si leurs autorisations le permettent.
- L’interface de contrôle mémorise le `sessionId` Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants, afin que les reconnexions et les actualisations de page continuent la même conversation stockée, sauf si l’utilisateur démarre ou réinitialise une session.
- L’interface de contrôle regroupe les soumissions en vol dupliquées pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; le Gateway déduplique toujours les requêtes répétées qui réutilisent la même clé d’idempotence.
- Les fichiers de démarrage de l’espace de travail et les instructions `BOOTSTRAP.md` en attente sont fournis via le Project Context de l’invite système de l’agent, sans être copiés dans le message utilisateur WebChat. La troncature d’amorçage ajoute seulement un avis concis de récupération dans l’invite système ; les comptages détaillés et les paramètres de configuration restent sur les surfaces de diagnostic.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw réservé à l’exécution,
  les enveloppes de messages entrants, les balises de directive de livraison en ligne
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML d’appels d’outils en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés du texte visible,
  et les entrées assistant dont tout le texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu assistant WebChat, du texte de relecture de transcription et des blocs de contenu audio, de sorte que les charges utiles de réflexion seule n’apparaissent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute une note assistant directement à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie assistant partielle visible dans l’interface.
- Le Gateway persiste le texte assistant partiel interrompu dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (sans surveillance de fichier local).
- Si le gateway est inaccessible, WebChat est en lecture seule.

### Modèle de transcription et de livraison

WebChat dispose de deux chemins de données distincts :

- Le fichier JSONL de session est la transcription durable du modèle/de l’exécution. Pour les exécutions d’agent normales, Pi persiste les messages `user`, `assistant` et `toolResult` visibles par le modèle via son gestionnaire de session. WebChat n’écrit pas de texte arbitraire de livraison, de statut ou d’aide dans cette transcription.
- Les événements `ReplyPayload` du Gateway sont la projection de livraison en direct. Ils peuvent être normalisés pour l’affichage WebChat/canal, le streaming par blocs, les balises de directive, l’intégration de médias, les indicateurs TTS/audio et le comportement de repli de l’interface. Ils ne constituent pas eux-mêmes le journal de session canonique.
- WebChat injecte des entrées de transcription assistant uniquement lorsque le Gateway possède un message affiché en dehors d’un tour assistant Pi normal : `chat.inject`, réponses de commandes non-agent, sortie partielle interrompue et suppléments de transcription média gérés par WebChat.
- `chat.history` lit la transcription de session stockée et applique la projection d’affichage WebChat. Si du texte assistant en direct apparaît pendant une exécution mais disparaît après le rechargement de l’historique, vérifiez d’abord si le JSONL brut contient le texte assistant, puis si la projection `chat.history` l’a supprimé, puis si la fusion de fin optimiste de l’interface de contrôle a remplacé l’état de livraison local par l’instantané persisté.

Les réponses finales d’exécutions d’agent normales doivent être durables, car Pi écrit le `message_end` assistant. Tout repli qui reflète une charge utile finale livrée dans la transcription doit d’abord éviter de dupliquer un tour assistant que Pi a déjà écrit.

## Panneau d’outils des agents de l’interface de contrôle

- Le panneau Tools `/agents` de l’interface de contrôle comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et affiche ce que la session actuelle
    peut réellement utiliser à l’exécution, y compris les outils core, plugin et détenus par les canaux.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est propre à la session. Changer de session sur le même agent peut modifier la
  liste **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la priorité des politiques
  (`allow`/`deny`, remplacements par agent et par fournisseur/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket du gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, le Gateway tronque les longs champs de texte et peut remplacer les messages surdimensionnés par un espace réservé. Le client peut également envoyer `maxChars` par requête pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de l’interface de contrôle du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source proxy **non-loopback** consciente de l’identité (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible de gateway distant.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Associé

- [Interface de contrôle](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
