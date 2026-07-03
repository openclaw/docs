---
read_when:
    - Vous voulez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface utilisateur de contrôle basée sur le navigateur pour le Gateway (discussion, activité, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-07-03T09:35:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway:

- par défaut: `http://<host>:18789/`
- préfixe facultatif: définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway s’exécute sur le même ordinateur, ouvrez:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway: `openclaw gateway`.

<Note>
Sur les liaisons LAN natives de Windows, le pare-feu Windows ou une stratégie de groupe gérée par l’organisation peut encore bloquer l’URL LAN annoncée même lorsque `127.0.0.1` fonctionne sur l’hôte Gateway. Exécutez `openclaw gateway status --deep` sur l’hôte Windows; il signale les ports probablement bloqués, les incompatibilités de profil et les règles de pare-feu local que la stratégie peut ignorer.
</Note>

L’authentification est fournie pendant la négociation WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée; les mots de passe ne sont pas persistés. L’onboarding génère généralement un jeton de Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

**Ce que vous verrez:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Lister les demandes en attente">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approuver par ID de demande">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si le navigateur retente l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera plus de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

Les agents Paperclip qui se connectent via l’adaptateur `openclaw_gateway` utilisent le même flux d’approbation au premier lancement. Après la tentative de connexion initiale, exécutez `openclaw devices approve --latest` pour prévisualiser la demande en attente, puis réexécutez la commande `openclaw devices approve <requestId>` affichée pour l’approuver. Transmettez des valeurs explicites `--url` et `--token` pour un Gateway distant. Pour conserver des approbations stables entre les redémarrages, configurez un `adapterConfig.devicePrivateKeyPem` persistant dans Paperclip au lieu de le laisser générer une nouvelle identité d’appareil éphémère à chaque exécution.

<Note>
- Les connexions directes du navigateur en local loopback (`127.0.0.1` / `localhost`) sont automatiquement approuvées.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle propre à chaque navigateur (nom d’affichage et avatar), attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est ni synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez effectivement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le Gateway uniquement dans le navigateur local et ne transitent jamais par `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients hors interface qui écrivent directement ce champ (comme les Gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/control-ui-config.json`, résolu relativement au chemin de base de l’interface de contrôle du Gateway (par exemple `/__openclaw__/control-ui-config.json` lorsque l’interface est servie sous `/__openclaw__/`). Ce point de terminaison est protégé par la même authentification Gateway que le reste de la surface HTTP: les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe Gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy approuvé.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement selon la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Overview -> Gateway Access -> Language**. Le sélecteur de langue se trouve dans la carte Gateway Access, et non sous Appearance.

- Langues prises en charge: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de langue acceptés par Mintlify. Les documentations en thaï (`th`) et en persan (`fa`) sont tout de même générées dans le dépôt de publication; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Appearance conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Share**, puis collez le lien de thème copié dans Appearance. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thèmes par défaut tels que `amethyst-haze`.

Appearance comprend aussi un paramètre local au navigateur pour la taille du texte. Le paramètre est stocké avec le reste des préférences de l’interface de contrôle, s’applique au texte du chat, au texte du composeur, aux cartes d’outils et aux barres latérales de chat, et maintient les champs de saisie de texte à au moins 16px afin que Safari mobile n’effectue pas de zoom automatique lors de la mise au point.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du Gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local; l’effacer ramène le thème actif à Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et conversation vocale">
    - Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique de chat demandent une fenêtre récente bornée avec des plafonds de texte par message afin que les grandes sessions n’obligent pas le navigateur à rendre une charge utile de transcription complète avant que le chat devienne utilisable.
    - Converser via des sessions temps réel du navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique via WebSocket, et les plugins de voix temps réel uniquement backend utilisent le transport relais du Gateway. Les sessions de fournisseur possédées par le client commencent par `talk.client.create`; les sessions relais Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio`, transmet les appels d’outils fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la politique Gateway et le modèle OpenClaw configuré plus grand, et route le pilotage vocal de l’exécution active via `talk.client.steer` ou `talk.session.steer`.
    - Diffuser les appels d’outils et les cartes de sortie d’outils en direct dans Chat (événements d’agent).
    - Onglet d’activité avec des résumés locaux au navigateur, privilégiant la caviardisation, de l’activité d’outils en direct depuis la livraison existante `session.tool` / événements d’outils.

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux: statut des canaux intégrés et des canaux de Plugin groupés/externes, connexion par QR code et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations de sondes de canal conservent l’instantané précédent visible pendant que les vérifications lentes de fournisseur se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface.
    - Instances: liste de présence + actualisation (`system-presence`).
    - Sessions: lister par défaut les sessions d’agents configurés, se rabattre depuis les clés de session obsolètes d’agents non configurés, et appliquer les remplacements par session de modèle/réflexion/rapide/verbeux/trace/raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves: statut Dreaming, interrupteur activer/désactiver et lecteur de journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron: lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills: statut, activer/désactiver, installer, mises à jour de clé d’API (`skills.*`).
    - Nœuds: liste + capacités (`node.list`).
    - Approbations exec: modifier les listes d’autorisation du Gateway ou des nœuds + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Voir/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP dispose d’une page de paramètres dédiée pour les serveurs configurés, l’activation, les résumés OAuth/filtre/parallèles, les commandes opérateur courantes et l’éditeur de configuration `mcp` limité.
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour empêcher l’écrasement de modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) vérifient en amont la résolution des SecretRef actifs pour les références dans la charge utile de configuration soumise; les références actives soumises non résolues sont rejetées avant l’écriture.
    - Les enregistrements de formulaire écartent les espaces réservés caviardés obsolètes qui ne peuvent pas être restaurés depuis la configuration enregistrée, tout en préservant les valeurs caviardées qui correspondent encore à des secrets enregistrés.
    - Rendu du schéma + formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indices d’interface correspondants, les résumés d’enfants immédiats, les métadonnées de documentation sur les nœuds d’objet imbriqué/joker/tableau/composition, ainsi que les schémas de Plugin + canal lorsqu’ils sont disponibles); l’éditeur JSON brut est disponible uniquement lorsque l’instantané dispose d’un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, "Reset to saved" préserve la forme rédigée en brut (formatage, commentaires, disposition `$include`) au lieu de restituer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les entrées de texte du formulaire afin d’éviter une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage: instantanés de statut/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les temporisations d’actualisation/RPC de l’interface de contrôle, les temporisations lentes de rendu du chat/de la configuration, ainsi que les entrées de réactivité du navigateur pour les longues images d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux: suivi en direct des journaux de fichiers du Gateway avec filtre/export (`logs.tail`).
    - Mise à jour: exécuter une mise à jour paquet/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après reconnexion pour vérifier la version du Gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la diffusion utilise par défaut l’annonce d’un résumé. Vous pouvez passer à aucune diffusion si vous voulez des exécutions internes uniquement.
    - Les champs de canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de diffusion webhook et aucun sont disponibles.
    - Les contrôles d’édition avancés incluent la suppression après exécution, l’effacement du remplacement d’agent, les options cron exactes/échelonnées, les remplacements de modèle/réflexion de l’agent, et les bascules de diffusion au mieux.
    - La validation du formulaire est intégrée avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Solution de repli obsolète : exécutez `openclaw doctor --fix` pour migrer les anciennes tâches stockées avec `notify: true` de `cron.webhook` vers une diffusion webhook ou de fin explicite par tâche.

  </Accordion>
</AccordionGroup>

## Page MCP

La page MCP dédiée est une vue opérateur pour les serveurs MCP gérés par OpenClaw sous `mcp.servers`. Elle ne démarre pas les transports MCP par elle-même ; utilisez-la pour inspecter et modifier la configuration enregistrée, puis utilisez `openclaw mcp doctor --probe` lorsque vous avez besoin d’une preuve de serveur en direct.

Flux de travail typique :

1. Ouvrez **MCP** depuis la barre latérale.
2. Consultez les cartes de résumé pour les nombres total, activé, OAuth et filtré de serveurs.
3. Examinez chaque ligne de serveur pour le transport, l’activation, l’authentification, les filtres, les délais d’expiration et les indications de commande.
4. Basculez l’activation lorsqu’un serveur doit rester configuré mais être exclu de la découverte à l’exécution.
5. Modifiez la section de configuration `mcp` ciblée pour les définitions de serveurs, les en-têtes, les chemins TLS/mTLS, les métadonnées OAuth, les filtres d’outils et les métadonnées de projection Codex.
6. Utilisez **Enregistrer** pour écrire la configuration, ou **Enregistrer et publier** lorsque le Gateway en cours d’exécution doit appliquer la configuration modifiée.
7. Exécutez `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` depuis un terminal lorsque le processus modifié a besoin de diagnostics statiques, d’une preuve en direct ou d’une élimination du runtime mis en cache.

La page expurge les valeurs de type URL contenant des identifiants avant l’affichage et met les noms de serveur entre guillemets dans les extraits de commande afin que les commandes copiées fonctionnent toujours avec des espaces ou des métacaractères shell. La référence complète de la CLI et de la configuration se trouve dans [MCP](/fr/cli/mcp).

## Onglet Activité

L’onglet Activité est un observateur éphémère local au navigateur pour l’activité d’outils en direct. Il dérive du même flux d’événements Gateway `session.tool` / outil qui alimente les cartes d’outils de Chat ; il n’ajoute pas une autre famille d’événements Gateway, un point de terminaison, un stockage durable d’activité, un flux de métriques ou un flux d’observation externe.

Les entrées d’activité ne conservent que des résumés nettoyés et des aperçus de sortie expurgés et tronqués. Les valeurs des arguments d’outil ne sont pas stockées dans l’état d’Activité ; l’interface indique que les arguments sont masqués et n’enregistre que le nombre de champs d’argument. La liste en mémoire suit l’onglet de navigateur actuel, survit à la navigation dans l’interface de contrôle et se réinitialise lors du rechargement de la page, du changement de session ou de **Effacer**.

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via les événements `chat`. Les clients de l’interface de contrôle de confiance peuvent aussi recevoir des métadonnées facultatives de temporisation d’ACK pour les diagnostics locaux.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièce jointe.
    - Un nouvel envoi avec le même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après la fin.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Lorsqu’un message d’assistant visible a été tronqué dans `chat.history`, le lecteur latéral peut récupérer à la demande l’entrée de transcription complète normalisée pour l’affichage via `chat.message.get` avec `sessionKey`, l’`agentId` actif si nécessaire, et le `messageId` de transcription. Si le Gateway ne peut toujours pas renvoyer davantage de contenu, le lecteur affiche un état explicitement indisponible au lieu de répéter silencieusement l’aperçu tronqué.
    - Les images générées par l’assistant sont persistées comme références de médias gérés et resservies via des URL de médias Gateway authentifiées, de sorte que les rechargements ne dépendent pas de charges utiles d’images base64 brutes restant dans la réponse d’historique de chat.
    - Lors du rendu de `chat.history`, l’interface de contrôle supprime du texte visible de l’assistant les balises de directive en ligne réservées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d’accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et le rafraîchissement final de l’historique, la vue de chat conserve visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux dès que l’historique Gateway rattrape son retard.
    - Les événements `chat` en direct représentent l’état de diffusion, tandis que `chat.history` est reconstruit depuis la transcription durable de la session. Après les événements finaux d’outil, l’interface de contrôle recharge l’historique et ne fusionne qu’une petite queue optimiste ; la frontière de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour réservées à l’interface (aucune exécution d’agent, aucune diffusion de canal).
    - La barre latérale liste les sessions récentes avec une action Nouvelle session, un lien Toutes les sessions et un bouton de recherche de session qui ouvre le sélecteur complet de sessions (limité à l’agent sélectionné, avec recherche et pagination). Le changement d’agent n’affiche que les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles de chat restent sur une seule ligne compacte et se replient lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir en haut ou atteindre le bas restaure les contrôles.
    - Les messages consécutifs en double contenant uniquement du texte sont rendus comme une seule bulle avec un badge de nombre. Les messages qui comportent des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion de l’en-tête de chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, pas des options d’envoi limitées à un seul tour.
    - Si vous envoyez un message alors qu’un changement de sélecteur de modèle pour la même session est encore en cours d’enregistrement, le composeur attend cette correction de session avant d’appeler `chat.send` afin que l’envoi utilise le modèle sélectionné.
    - Saisir `/new` dans l’interface de contrôle crée et bascule vers la même nouvelle session de tableau de bord que Nouveau chat, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l’agent ; dans ce cas, cela réinitialise la session principale sur place. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle de chat demande la vue de modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation pilote le sélecteur, y compris les entrées `provider/*` qui gardent les catalogues limités au fournisseur dynamiques. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs avec une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les rapports frais d’utilisation de session du Gateway incluent les jetons de contexte actuels, la barre d’outils du composeur de chat affiche un petit anneau d’utilisation du contexte avec le pourcentage utilisé ; le détail complet des jetons se trouve dans son infobulle. L’anneau passe au style d’avertissement à forte pression de contexte et, aux niveaux de Compaction recommandés, affiche un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons périmés sont masqués jusqu’à ce que le Gateway signale à nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel du navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus un profil d’authentification par clé d’API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY` ; les profils OAuth OpenAI ne configurent pas la voix temps réel. Configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé d’API fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel backend passent par le transport relais du Gateway, de sorte que les identifiants et les sockets fournisseur restent côté serveur tandis que l’audio du navigateur transite par des RPC Gateway authentifiés. L’invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Le composeur de Chat inclut un bouton d’options de conversation à côté du bouton démarrer/arrêter la conversation. Les options s’appliquent à la prochaine session de conversation et peuvent remplacer le fournisseur, le transport, le modèle, la voix, l’effort de raisonnement, le seuil VAD, la durée de silence et le remplissage de préfixe. Lorsqu’une option est vide, le Gateway utilise les valeurs par défaut configurées lorsqu’elles sont disponibles, ou la valeur par défaut du fournisseur. Sélectionner le relais Gateway force le chemin de relais backend ; sélectionner WebRTC garde la session détenue par le client et échoue au lieu de revenir silencieusement au relais si le fournisseur ne peut pas créer une session de navigateur.

    Dans le composeur de Chat, le contrôle de conversation est le bouton d’ondes à côté du bouton de dictée au microphone. Lorsque la conversation démarre, la ligne d’état du composeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` lorsqu’un appel d’outil temps réel consulte le grand modèle configuré via `talk.client.toolCall`.

    Smoke test en direct mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie le pont WebSocket backend OpenAI, l’échange SDP WebRTC navigateur OpenAI, la configuration WebSocket navigateur par jeton contraint Google Live, et l’adaptateur navigateur de relais Gateway avec un faux média de microphone. La commande imprime uniquement l’état du fournisseur et ne journalise pas de secrets.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Piloter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut encore être affiché dans l’interface.
    - Le Gateway persiste le texte partiel abandonné de l’assistant dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées persistées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les parties abandonnées de la sortie de fin normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et push web

L’interface de contrôle fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

Si la page affiche **Incompatibilité de protocole** juste après une mise à jour d’OpenClaw, rouvrez d’abord le tableau de bord avec `openclaw dashboard` et effectuez une actualisation complète de la page. Si l’échec persiste, effacez les données du site pour l’origine du tableau de bord ou testez dans une fenêtre de navigation privée ; un ancien onglet ou le cache du service worker du navigateur peut continuer à exécuter un bundle Control UI antérieur à la mise à jour avec le Gateway plus récent.

| Surface                                               | Ce qu’elle fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnements de navigateur persistés.       |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez figer les clés (pour des déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut : `https://openclaw.ai`)

La Control UI utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements du navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour le push appuyé par relais) et de la méthode existante `push.test`, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages d’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (default)">
    Autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est la valeur par défaut et elle suffit généralement pour les jeux/widgets de navigateur autonomes.
  </Tab>
  <Tab title="trusted">
    Ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site qui ont intentionnellement besoin de privilèges plus élevés.
  </Tab>
</Tabs>

Exemple :

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement de même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration `http(s)` externes absolues restent bloquées par défaut. Si vous souhaitez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de discussion

Les messages de discussion groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur écran large peuvent la remplacer sans modifier le CSS groupé en définissant `gateway.controlUi.chatMessageMaxWidth` :

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

La valeur est validée avant d’atteindre le navigateur. Les valeurs prises en charge incluent les longueurs simples et les pourcentages comme `960px` ou `82%`, ainsi que les expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gardez le Gateway sur loopback et laissez Tailscale Serve le mandater avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions d’opérateur Control UI avec identité d’appareil de navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage de l’appareil ; les navigateurs sans appareil et les connexions de rôle nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Les nouvelles tentatives incorrectes simultanées depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux incompatibilités simples en concurrence en parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez ensuite :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface utilisateur (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification Control UI opérateur réussie via `gateway.auth.mode: "trusted-proxy"`
- bris de glace `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement un commutateur de compatibilité local :

    - Il permet aux sessions Control UI localhost de continuer sans identité d’appareil dans les contextes HTTP non sécurisés.
    - Il ne contourne pas les vérifications d’appairage.
    - Il n’assouplit pas les exigences d’identité d’appareil distantes (non localhost).

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil Control UI et constitue une forte dégradation de la sécurité. Rétablissez rapidement la configuration après l’utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Une authentification trusted-proxy réussie peut admettre des sessions Control UI **opérateur** sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions Control UI de rôle nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Voir [Tailscale](/fr/gateway/tailscale) pour les consignes de configuration HTTPS.

## Politique de sécurité du contenu

La Control UI est livrée avec une politique `img-src` stricte : seuls les éléments **de même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatars authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL inline `data:image/...` s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par la Control UI s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les helpers d’avatar de la Control UI et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations arbitraires d’images distantes depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du gateway est configurée, le point de terminaison d’avatar de la Control UI exige le même jeton de gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité d’agent sur des hôtes qui sont autrement protégés.
- La Control UI elle-même transmet le jeton du gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du gateway (non recommandé sur des hôtes partagés), la route d’avatar devient elle aussi non authentifiée, conformément au reste du gateway.

## Authentification de la route média d’assistant

Lorsque l’authentification du gateway est configurée, les aperçus de médias locaux d’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur Control UI normale. Le navigateur envoie le jeton du gateway comme en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` de courte durée limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou du mot de passe de gateway actif. Le ticket expire rapidement et ne peut pas autoriser une source différente.

Cela garde le rendu média normal compatible avec les éléments média natifs du navigateur sans placer d’identifiants de gateway réutilisables dans des URL média visibles.

## Construction de l’interface utilisateur

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface utilisateur vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Page Control UI vide

Si le navigateur charge un tableau de bord vide et que DevTools n’affiche aucune erreur utile, une extension ou un script de contenu précoce peut avoir empêché l’application de module JavaScript de s’évaluer. La page statique inclut un panneau de récupération HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Réessayer** du panneau après avoir modifié l’environnement du navigateur, ou rechargez manuellement après ces vérifications :

- Désactivez les extensions qui injectent du code dans toutes les pages, en particulier les extensions avec des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur propre ou un autre navigateur.
- Gardez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après le changement de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

La Control UI est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite localement mais que le Gateway s’exécute ailleurs.

<Steps>
  <Step title="Démarrer le serveur de développement de l’interface utilisateur">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Ouvrir avec gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Authentification facultative à usage unique (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` est stocké dans localStorage après le chargement, puis supprimé de l’URL.
    - Si vous transmettez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez en URL la valeur `gatewayUrl` afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et dans Referer. Les paramètres de requête hérités `?token=` sont encore importés une seule fois pour compatibilité, mais uniquement comme solution de secours, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway se trouve derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’éviter le clickjacking.
    - Les déploiements publics non loopback de l’interface Control UI doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Les chargements LAN/Tailnet privés de même origine depuis des hôtes loopback, RFC1918/link-local, `.local`, `.ts.net` ou Tailscale CGNAT sont acceptés sans activer le repli basé sur l’en-tête Host.
    - Au démarrage, le Gateway peut initialiser des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port de liaison effectifs à l’exécution, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]`, sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser toute origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli basé sur l’origine de l’en-tête Host, mais il s’agit d’un mode de sécurité dangereux.

  </Accordion>
</AccordionGroup>

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration de l’accès distant : [Accès distant](/fr/gateway/remote).

## Associés

- [Tableau de bord](/fr/web/dashboard) — tableau de bord du gateway
- [Contrôles d’état](/fr/gateway/health) — surveillance de l’état du gateway
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [WebChat](/fr/web/webchat) — interface de discussion basée sur le navigateur
