---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique WebChat en boucle locale et utilisation du WS du Gateway pour l’interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-07-12T15:57:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Statut : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket du Gateway. Aucun navigateur intégré, aucun serveur statique local.

## Présentation

- Une interface de chat native pour le Gateway.
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.
- L’historique est toujours récupéré depuis le Gateway (aucune surveillance de fichier local). Si le Gateway est inaccessible, WebChat est en lecture seule.

## Démarrage rapide

1. Démarrez le Gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de l’interface de contrôle.
3. Vérifiez qu’un mécanisme d’authentification valide du Gateway est configuré (secret partagé par défaut, même sur l’interface de bouclage).

## Fonctionnement

- L’interface se connecte au WebSocket du Gateway et utilise les méthodes RPC `chat.history`, `chat.send`, `chat.inject` et `chat.message.get`.
- `chat.history` est limité pour garantir la stabilité : le Gateway peut tronquer les champs de texte longs, omettre les métadonnées volumineuses et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`. Les clients API peuvent envoyer un paramètre `maxChars` par requête afin de remplacer la limite par défaut pour un appel.
- Lorsqu’un message visible de l’assistant a été tronqué dans `chat.history`, l’interface de contrôle peut ouvrir un lecteur latéral et récupérer à la demande l’entrée complète normalisée pour l’affichage via `chat.message.get`, sans augmenter la charge utile par défaut de l’historique. `chat.message.get` utilise la même branche de transcription et les mêmes règles d’affichage que `chat.history`, mais cible une entrée par `messageId` et renvoie un motif d’indisponibilité exact lorsque le contenu complet ne peut plus être renvoyé.
- `chat.history` suit la branche de transcription active pour les fichiers de session en ajout uniquement, afin que les branches de réécriture abandonnées et les copies de prompts remplacées ne soient pas affichées dans WebChat.
- Les entrées de Compaction s’affichent sous la forme d’un séparateur « Historique compacté » expliquant que la transcription compactée est conservée comme point de contrôle, avec une action permettant d’ouvrir les points de contrôle de la session (créer une branche ou restaurer, lorsque les autorisations le permettent).
- L’interface de contrôle mémorise le `sessionId` du Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants, afin que les reconnexions et les actualisations de page poursuivent la même conversation enregistrée, sauf si l’utilisateur démarre ou réinitialise une session.
- `chat.send` accepte une clé d’idempotence (l’interface de contrôle utilise l’identifiant d’exécution) ; le Gateway déduplique les requêtes répétées qui réutilisent la même clé, de sorte que les envois réessayés ou dupliqués en cours pour la même session, le même message et les mêmes pièces jointes ne créent pas une deuxième exécution.
- Les fichiers de démarrage de l’espace de travail et les instructions `BOOTSTRAP.md` en attente sont fournis dans la section `# Project Context` du prompt système de l’agent, et non copiés dans le message utilisateur WebChat. Si le contenu d’amorçage est tronqué, le prompt système reçoit à la place une courte « Notification relative au contexte d’amorçage » ; les décomptes détaillés et les options de configuration restent disponibles sur les surfaces de diagnostic.
- La normalisation de l’affichage dans `chat.history` supprime : le contexte OpenClaw réservé à l’exécution, les enveloppes des messages entrants, les balises de directives de livraison intégrées telles que `[[reply_to_current]]`, `[[reply_to:<id>]]` et `[[audio_as_voice]]`, les charges utiles XML d’appels d’outils en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, y compris les blocs tronqués), ainsi que les jetons de contrôle du modèle ASCII ou pleine chasse divulgués. Les entrées de l’assistant dont l’intégralité du texte visible se réduit au jeton silencieux `NO_REPLY` (sans distinction entre majuscules et minuscules) sont omises.
- Les charges utiles de réponse signalées comme raisonnement (`isReasoning: true`) sont exclues du contenu de l’assistant dans WebChat, du texte de relecture de la transcription et des blocs de contenu audio, afin que les charges utiles contenant uniquement le raisonnement ne soient pas présentées comme des messages visibles de l’assistant ni comme du contenu audio lisible.
- `chat.inject` ajoute directement une note de l’assistant à la transcription et la diffuse à l’interface (sans exécution de l’agent).
- Les exécutions interrompues peuvent conserver une sortie partielle de l’assistant visible dans l’interface. Le Gateway conserve ce texte partiel dans l’historique de la transcription lorsqu’une sortie mise en mémoire tampon existe et marque l’entrée avec des métadonnées d’interruption.

### Modèle de transcription et de livraison

WebChat dispose de deux chemins de données distincts :

- Les lignes de transcription SQLite constituent la transcription durable du modèle et de l’environnement d’exécution. Pour les exécutions normales de l’agent, l’environnement d’exécution OpenClaw intégré conserve les messages visibles par le modèle `user`, `assistant` et `toolResult` au moyen de l’accesseur de session. WebChat n’écrit aucun texte arbitraire de livraison, d’état ou d’assistance dans cette transcription.
- Les événements `ReplyPayload` du Gateway constituent la projection de livraison en direct : normalisée pour l’affichage dans WebChat et les canaux, la diffusion par blocs, les balises de directives, l’intégration des médias, les indicateurs TTS/audio et le comportement de repli de l’interface. Ils ne constituent pas eux-mêmes le journal canonique de la session.
- Les environnements de test qui nécessitent des réponses visibles via `tools.message` continuent d’utiliser WebChat comme destination interne des réponses sources pour l’exécution en cours. Un `message.send` sans cible provenant de cette exécution WebChat active est projeté dans le même chat et reproduit dans la transcription de la session ; WebChat ne devient pas un canal sortant réutilisable et n’hérite jamais de `lastChannel`.
- WebChat injecte des entrées de transcription de l’assistant uniquement lorsque le Gateway est responsable d’un message affiché en dehors d’un tour normal de l’agent intégré : `chat.inject`, réponses aux commandes sans agent, sortie partielle interrompue et compléments de transcription multimédia gérés par WebChat.
- Si du texte de l’assistant apparaît en direct pendant une exécution, mais disparaît après le rechargement de l’historique, vérifiez dans l’ordre : si la transcription SQLite contient le texte de l’assistant, si la projection d’affichage de `chat.history` l’a supprimé, puis si la fusion de fin optimiste de l’interface de contrôle a remplacé l’état de livraison local par l’instantané conservé.

Les réponses finales des exécutions normales de l’agent doivent être durables, car l’environnement d’exécution intégré écrit le `message_end` de l’assistant. Tout mécanisme de repli qui reproduit une charge utile finale livrée dans la transcription doit d’abord éviter de dupliquer un tour de l’assistant déjà écrit par l’environnement d’exécution intégré.

## Panneau des outils des agents de l’interface de contrôle

- Le panneau Tools de `/agents` dans l’interface de contrôle comporte une vue « Disponible immédiatement » reposant sur `tools.effective(sessionKey=...)` : une projection en lecture seule, générée par le serveur, de l’inventaire des outils de la session actuelle, y compris les outils principaux, ceux des plugins et des canaux, ainsi que ceux des serveurs MCP déjà découverts.
- Une vue distincte de modification de la configuration (reposant sur `tools.catalog`) couvre les profils, les remplacements par agent et la sémantique du catalogue.
- La disponibilité lors de l’exécution est propre à chaque session. Changer de session pour un même agent peut modifier la liste « Disponible immédiatement ». Si les serveurs MCP configurés n’ont pas été connectés ou ont changé depuis la dernière découverte, le panneau affiche une notification au lieu de démarrer silencieusement les transports MCP depuis le chemin de lecture.
- L’éditeur de configuration n’implique pas la disponibilité lors de l’exécution ; l’accès effectif continue de respecter la priorité des politiques (`allow`/`deny`, remplacements par agent, fournisseur et canal).

## Utilisation à distance

- Le mode distant fait transiter le WebSocket du Gateway dans un tunnel SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat distinct.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

WebChat ne possède aucune section de configuration persistante. Le Gateway utilise la limite d’affichage intégrée de `chat.history` ; les clients API peuvent envoyer un paramètre `maxChars` par requête afin de la remplacer pour un seul appel. Les configurations historiques `channels.webchat` et `gateway.webchat` ont été retirées ; exécutez `openclaw doctor --fix` pour les supprimer.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de l’interface de contrôle dans le navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients de navigateur derrière une source de proxy **hors interface de bouclage** prenant en charge l’identité (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible du Gateway distant.
- `session.*` : stockage des sessions et valeurs par défaut de la clé principale.

## Voir aussi

- [Interface de contrôle](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
