---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique Loopback WebChat et utilisation WS du Gateway pour l’interface utilisateur de chat
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Statut : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket Gateway.

## De quoi il s’agit

- Une interface de chat native pour le gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours à WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de Control UI.
3. Assurez-vous qu’un chemin d’authentification gateway valide est configuré (secret partagé par défaut,
   même sur la boucle locale).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les longs champs texte, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- Lorsqu’un message assistant visible a été tronqué dans `chat.history`, Control UI peut ouvrir un lecteur latéral et récupérer à la demande l’entrée complète normalisée pour l’affichage via `chat.message.get`, sans augmenter la charge utile d’historique par défaut.
- `chat.history` suit la branche de transcription active pour les fichiers de session modernes en ajout seul, afin que les branches de réécriture abandonnées et les copies d’invite remplacées ne soient pas affichées dans WebChat.
- Les entrées de Compaction s’affichent comme un séparateur explicite d’historique compacté. Le séparateur explique que la transcription compactée est conservée comme point de contrôle et renvoie aux contrôles de point de contrôle des Sessions, où les opérateurs peuvent créer une branche ou restaurer depuis cette vue compactée lorsque leurs autorisations le permettent.
- Control UI mémorise le `sessionId` Gateway sous-jacent renvoyé par `chat.history` et l’inclut dans les appels `chat.send` suivants, afin que les reconnexions et les actualisations de page continuent la même conversation stockée, sauf si l’utilisateur démarre ou réinitialise une session.
- Control UI fusionne les soumissions en cours dupliquées pour la même session, le même message et les mêmes pièces jointes avant de générer un nouvel identifiant d’exécution `chat.send` ; Gateway déduplique toujours les requêtes répétées qui réutilisent la même clé d’idempotence.
- Les fichiers de démarrage de l’espace de travail et les instructions `BOOTSTRAP.md` en attente sont fournis via le Project Context de l’invite système de l’agent, et non copiés dans le message utilisateur WebChat. La troncature de bootstrap n’ajoute qu’un avis concis de récupération dans l’invite système ; les comptes détaillés et les paramètres de configuration restent sur les surfaces de diagnostic.
- `chat.history` est également normalisé pour l’affichage : le contexte OpenClaw réservé à l’exécution,
  les enveloppes entrantes, les balises de directives de livraison en ligne
  telles que `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML
  en texte brut d’appels d’outils (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que
  les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont retirés du texte visible,
  et les entrées assistant dont tout le texte visible est uniquement le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- Les charges utiles de réponse marquées comme raisonnement (`isReasoning: true`) sont exclues du contenu assistant WebChat, du texte de relecture de transcription et des blocs de contenu audio, afin que les charges utiles de pensée seule ne s’affichent pas comme messages assistant visibles ni comme audio lisible.
- `chat.inject` ajoute une note assistant directement à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie assistant partielle visible dans l’interface.
- Gateway persiste le texte assistant partiel interrompu dans l’historique de transcription lorsqu’une sortie mise en tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (aucune surveillance de fichier local).
- Si le gateway est inaccessible, WebChat est en lecture seule.

### Modèle de transcription et de livraison

WebChat dispose de deux chemins de données distincts :

- Le fichier JSONL de session est la transcription durable du modèle/de l’exécution. Pour les exécutions d’agent normales, l’exécution OpenClaw intégrée persiste les messages visibles par le modèle `user`, `assistant` et `toolResult` via son gestionnaire de session. WebChat n’écrit pas de texte arbitraire de livraison, d’état ou d’assistance dans cette transcription.
- Les événements Gateway `ReplyPayload` sont la projection de livraison en direct. Ils peuvent être normalisés pour l’affichage WebChat/canal, le streaming de blocs, les balises de directives, l’intégration de médias, les indicateurs TTS/audio et le comportement de repli de l’interface. Ils ne constituent pas eux-mêmes le journal de session canonique.
- Les harnais qui exigent des réponses visibles via `tools.message` utilisent toujours WebChat comme récepteur de réponse source interne pour l’exécution en cours. Un `message.send` sans cible depuis cette exécution WebChat active est projeté dans le même chat et répliqué dans la transcription de session ; WebChat ne devient pas un canal sortant réutilisable et n’hérite jamais de `lastChannel`.
- WebChat injecte des entrées de transcription assistant uniquement lorsque Gateway possède un message affiché en dehors d’un tour d’agent intégré normal : `chat.inject`, réponses de commandes hors agent, sortie partielle interrompue et suppléments de transcription média gérés par WebChat.
- `chat.history` lit la transcription de session stockée et applique la projection d’affichage WebChat. Si du texte assistant en direct apparaît pendant une exécution puis disparaît après le rechargement de l’historique, vérifiez d’abord si le JSONL brut contient le texte assistant, puis si la projection `chat.history` l’a retiré, puis si la fusion de queue optimiste de Control UI a remplacé l’état de livraison local par l’instantané persisté.
- `chat.message.get` utilise les mêmes règles de branche de transcription et de projection d’affichage que `chat.history`, y compris la portée de l’agent actif, mais cible une seule entrée de transcription par `messageId` et renvoie une raison d’indisponibilité honnête lorsque le contenu complet ne peut plus être renvoyé.

Les réponses finales d’exécution d’agent normales doivent être durables, car l’exécution intégrée écrit le `message_end` assistant. Tout repli qui réplique une charge utile finale livrée dans la transcription doit d’abord éviter de dupliquer un tour assistant que l’exécution intégrée a déjà écrit.

## Panneau des outils d’agents de Control UI

- Le panneau Outils `/agents` de Control UI comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et affiche une projection en lecture seule dérivée du serveur de l’inventaire de session actuel, y compris les outils du noyau, des Plugins, appartenant aux canaux,
    et des serveurs MCP déjà découverts.
  - **Configuration des outils** utilise `tools.catalog` et reste centrée sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité d’exécution est limitée à la session. Changer de session sur le même agent peut modifier la liste
  **Disponible maintenant**. Si les serveurs MCP configurés n’ont pas été connectés ou ont été modifiés
  depuis la dernière découverte, le panneau affiche un avis au lieu de démarrer silencieusement les transports MCP
  depuis le chemin de lecture.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la précédence des politiques
  (`allow`/`deny`, remplacements par agent et par provider/canal).

## Utilisation distante

- Le mode distant tunnelise le WebSocket gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

WebChat n’a pas de section de configuration persistée. Gateway utilise la limite d’affichage intégrée de `chat.history` ; les clients API peuvent envoyer `maxChars` par requête pour la remplacer pour un seul appel `chat.history`. La configuration héritée `channels.webchat` et `gateway.webchat` est retirée ; exécutez `openclaw doctor --fix` pour la supprimer.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat Control UI du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’il est activé.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source de proxy **non-loopback** sensible à l’identité (voir [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible gateway distante.
- `session.*` : stockage de session et valeurs par défaut de la clé principale.

## Connexe

- [Control UI](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
