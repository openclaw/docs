---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous voulez accéder au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle dans le navigateur pour le Gateway (chat, activité, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-06-27T18:23:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

L’authentification est fournie pendant la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session d’onglet actuelle du navigateur et l’URL de gateway sélectionnée ; les mots de passe ne sont pas conservés. L’onboarding génère généralement un jeton de gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage de l’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage ponctuelle**. Il s’agit d’une mesure de sécurité pour empêcher les accès non autorisés.

**Ce que vous verrez :** « disconnected (1008): pairing required »

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une mise à niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne demandera pas de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

Les agents Paperclip qui se connectent via l’adaptateur `openclaw_gateway` utilisent le même flux d’approbation au premier lancement. Après la tentative de connexion initiale, exécutez `openclaw devices approve --latest` pour prévisualiser la demande en attente, puis réexécutez la commande `openclaw devices approve <requestId>` affichée pour l’approuver. Passez des valeurs explicites `--url` et `--token` pour un gateway distant. Pour garder les approbations stables entre les redémarrages, configurez une valeur persistante `adapterConfig.devicePrivateKeyPem` dans Paperclip au lieu de le laisser générer une nouvelle identité d’appareil éphémère à chaque exécution.

<Note>
- Les connexions directes de navigateur via local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas synchronisée avec d’autres appareils ni conservée côté serveur au-delà des métadonnées normales d’auteur de transcript sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés superposent l’identité résolue par le gateway uniquement dans le navigateur local et ne transitent jamais par `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement dans ce champ (comme les gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/control-ui-config.json`, résolu relativement au chemin de base de l’interface de contrôle du gateway (par exemple `/__openclaw__/control-ui-config.json` lorsque l’interface est servie sous `/__openclaw__/`). Ce point de terminaison est protégé par la même authentification de gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement d’après la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue intégré au site de documentation Mintlify est limité aux codes de langue acceptés par Mintlify. La documentation en thaï (`th`) et en persan (`fa`) est tout de même générée dans le dépôt de publication ; elle peut ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez l’[éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Apparence inclut aussi un paramètre Taille du texte local au navigateur. Le paramètre est stocké avec le reste des préférences de l’interface de contrôle, s’applique au texte du chat, au texte du composeur, aux cartes d’outils et aux barres latérales du chat, et garde les champs de saisie à au moins 16px pour éviter que Safari mobile ne zoome automatiquement lors du focus.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local ; l’effacer rétablit le thème actif à Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Discuter avec le modèle via le Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique du chat demandent une fenêtre récente bornée avec des plafonds de texte par message, afin que les grandes sessions n’obligent pas le navigateur à afficher une charge utile complète de transcript avant que le chat devienne utilisable.
    - Parler via des sessions temps réel dans le navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique via WebSocket, et les plugins vocaux temps réel uniquement côté backend utilisent le transport de relais du Gateway. Les sessions de fournisseur possédées par le client commencent par `talk.client.create` ; les sessions relayées par le Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio`, transmet les appels d’outil fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la politique du Gateway et le modèle OpenClaw configuré plus grand, et achemine le pilotage vocal de l’exécution active via `talk.client.steer` ou `talk.session.steer`.
    - Diffuser les appels d’outils et les cartes de sortie d’outil en direct dans le chat (événements d’agent).
    - Onglet Activité avec des résumés locaux au navigateur, axés d’abord sur la rédaction, de l’activité d’outil en direct à partir de la livraison existante des événements `session.tool` / outil.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canaux : état des canaux intégrés et des canaux de plugins groupés/externes, connexion par QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations des sondes de canal gardent l’instantané précédent visible pendant que les vérifications lentes du fournisseur se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface.
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : lister par défaut les sessions d’agents configurées, se rabattre depuis les clés de session d’agent non configuré obsolètes, et appliquer des remplacements par session pour modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Rêves : état de Dreaming, bascule d’activation/désactivation et lecteur du journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills : état, activation/désactivation, installation, mises à jour des clés d’API (`skills.*`).
    - Nœuds : liste + capacités (`node.list`).
    - Approbations d’exécution : modifier les listes d’autorisation du gateway ou des nœuds + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP dispose d’une page de paramètres dédiée pour les serveurs configurés, l’activation, les résumés OAuth/filtre/parallèle, les commandes opérateur courantes et l’éditeur de configuration `mcp` limité à cette portée.
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hash de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) vérifient en amont la résolution des SecretRef actifs pour les références dans la charge utile de configuration soumise ; les références soumises actives non résolues sont rejetées avant l’écriture.
    - Les enregistrements de formulaire éliminent les placeholders caviardés obsolètes qui ne peuvent pas être restaurés depuis la configuration enregistrée, tout en préservant les valeurs caviardées qui correspondent encore à des secrets enregistrés.
    - Schéma + rendu de formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indications d’interface correspondantes, les résumés des enfants immédiats, les métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition, ainsi que les schémas de plugin + canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut est disponible uniquement lorsque l’instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - La commande « Réinitialiser à l’enregistré » de l’éditeur JSON brut préserve la forme rédigée en brut (formatage, commentaires, disposition `$include`) au lieu de régénérer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs de texte de formulaire afin d’éviter une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Débogage : instantanés d’état/de santé/de modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les temps d’actualisation/RPC de l’interface de contrôle, les temps de rendu lents du chat/de la configuration, et des entrées de réactivité du navigateur pour les longues frames d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du gateway avec filtrage/exportation (`logs.tail`).
    - Mise à jour : exécuter une mise à jour de package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après reconnexion pour vérifier la version du gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison utilise par défaut l’annonce du résumé. Vous pouvez passer à aucun si vous souhaitez des exécutions internes uniquement.
    - Les champs de canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucun sont disponibles.
    - Les contrôles d’édition avancés incluent la suppression après exécution, l’effacement du remplacement d’agent, les options cron exact/décalé, les remplacements de modèle/réflexion d’agent et les bascules de livraison au mieux.
    - La validation du formulaire est intégrée avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Solution de repli obsolète : exécutez `openclaw doctor --fix` pour migrer les anciennes tâches stockées avec `notify: true` de `cron.webhook` vers une livraison webhook ou d’achèvement explicite par tâche.

  </Accordion>
</AccordionGroup>

## Page MCP

La page MCP dédiée est une vue opérateur pour les serveurs MCP gérés par OpenClaw sous `mcp.servers`. Elle ne démarre pas les transports MCP elle-même ; utilisez-la pour inspecter et modifier la configuration enregistrée, puis utilisez `openclaw mcp doctor --probe` lorsque vous avez besoin d’une preuve de serveur en direct.

Flux de travail typique :

1. Ouvrez **MCP** depuis la barre latérale.
2. Consultez les cartes de résumé pour le nombre total de serveurs, les serveurs activés, OAuth et filtrés.
3. Examinez chaque ligne de serveur pour le transport, l’activation, l’authentification, les filtres, les délais d’expiration et les indices de commande.
4. Basculez l’activation lorsqu’un serveur doit rester configuré mais rester exclu de la découverte d’exécution.
5. Modifiez la section de configuration `mcp` ciblée pour les définitions de serveurs, les en-têtes, les chemins TLS/mTLS, les métadonnées OAuth, les filtres d’outils et les métadonnées de projection Codex.
6. Utilisez **Enregistrer** pour écrire la configuration, ou **Enregistrer et publier** lorsque le Gateway en cours d’exécution doit appliquer la configuration modifiée.
7. Exécutez `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` depuis un terminal lorsque le processus modifié a besoin de diagnostics statiques, d’une preuve en direct ou de la suppression d’un runtime mis en cache.

La page masque les valeurs de type URL contenant des identifiants avant le rendu et met les noms de serveurs entre guillemets dans les extraits de commande afin que les commandes copiées fonctionnent toujours avec des espaces ou des métacaractères du shell. La référence complète de la CLI et de la configuration se trouve dans [MCP](/fr/cli/mcp).

## Onglet Activité

L’onglet Activité est un observateur éphémère local au navigateur pour l’activité des outils en direct. Il est dérivé du même flux d’événements Gateway `session.tool` / outil qui alimente les cartes d’outils du Chat ; il n’ajoute pas d’autre famille d’événements Gateway, point de terminaison, magasin d’activité durable, flux de métriques ni flux d’observation externe.

Les entrées d’activité ne conservent que des résumés assainis et des aperçus de sortie masqués et tronqués. Les valeurs des arguments d’outil ne sont pas stockées dans l’état Activité ; l’interface indique que les arguments sont masqués et n’enregistre que le nombre de champs d’argument. La liste en mémoire suit l’onglet de navigateur actuel, survit à la navigation dans l’interface de contrôle et se réinitialise lors du rechargement de la page, du changement de session ou de **Effacer**.

## Comportement du Chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`. Les clients de l’interface de contrôle approuvés peuvent également recevoir des métadonnées facultatives de chronométrage d’ACK pour les diagnostics locaux.
    - Les téléversements dans le Chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Le renvoi avec le même `idempotencyKey` retourne `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après l’achèvement.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface utilisateur. Lorsque les entrées de transcription sont trop volumineuses, Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Lorsqu’un message assistant visible a été tronqué dans `chat.history`, le lecteur latéral peut récupérer à la demande l’entrée de transcription complète normalisée pour l’affichage via `chat.message.get`, avec `sessionKey`, l’`agentId` actif si nécessaire et le `messageId` de transcription. Si le Gateway ne peut toujours pas retourner davantage, le lecteur affiche un état explicitement indisponible au lieu de répéter silencieusement l’aperçu tronqué.
    - Les images assistant/générées sont conservées comme références de médias gérés et resservies via des URL de médias Gateway authentifiées, afin que les rechargements ne dépendent pas du maintien des charges utiles d’image brutes en base64 dans la réponse d’historique du Chat.
    - Lors du rendu de `chat.history`, l’interface de contrôle supprime du texte assistant visible les balises de directives en ligne uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d’accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue de Chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` retourne brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique du Gateway a rattrapé son retard.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription durable de la session. Après les événements finaux d’outil, l’interface de contrôle recharge l’historique et ne fusionne qu’une petite fin optimiste ; la limite de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour des mises à jour uniquement destinées à l’interface utilisateur (aucune exécution d’agent, aucune livraison de canal).
    - L’en-tête du Chat affiche le filtre d’agent avant le sélecteur de session, et le sélecteur de session est limité à l’agent sélectionné. Changer d’agent affiche uniquement les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles du Chat restent sur une rangée compacte et se replient lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir en haut ou atteindre le bas restaure les contrôles.
    - Les messages texte uniquement consécutifs en double s’affichent sous forme d’une seule bulle avec un badge de nombre. Les messages qui contiennent des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion dans l’en-tête du Chat appliquent immédiatement un correctif à la session active via `sessions.patch` ; ce sont des remplacements de session persistants, et non des options d’envoi limitées à un seul tour.
    - Si vous envoyez un message pendant qu’un changement de sélecteur de modèle pour la même session est encore en cours d’enregistrement, le composeur attend ce correctif de session avant d’appeler `chat.send` afin que l’envoi utilise le modèle sélectionné.
    - Saisir `/new` dans l’interface de contrôle crée et bascule vers la même nouvelle session de tableau de bord que Nouvelle discussion, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l’agent ; dans ce cas, cela réinitialise la session principale sur place. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du Chat demande la vue de modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation alimente le sélecteur, y compris les entrées `provider/*` qui gardent les catalogues limités au fournisseur dynamiques. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les rapports frais d’utilisation de session du Gateway incluent les jetons de contexte actuels, la zone du composeur de Chat affiche un indicateur compact d’utilisation du contexte. Il passe à un style d’avertissement en cas de forte pression sur le contexte et, aux niveaux de Compaction recommandés, affiche un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale à nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel du navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus un profil d’authentification par clé d’API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY` ; les profils OAuth OpenAI ne configurent pas la voix temps réel. Configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé d’API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel côté backend passent par le transport de relais du Gateway, afin que les identifiants et les sockets fournisseur restent côté serveur tandis que l’audio du navigateur transite par des RPC Gateway authentifiés. L’invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Le composeur du Chat inclut un bouton d’options de conversation à côté du bouton démarrer/arrêter la conversation. Les options s’appliquent à la prochaine session de conversation et peuvent remplacer le fournisseur, le transport, le modèle, la voix, l’effort de raisonnement, le seuil VAD, la durée de silence et le remplissage de préfixe. Lorsqu’une option est vide, le Gateway utilise les valeurs par défaut configurées lorsqu’elles sont disponibles ou la valeur par défaut du fournisseur. Sélectionner le relais Gateway force le chemin de relais backend ; sélectionner WebRTC garde la session sous contrôle du client et échoue au lieu de revenir silencieusement au relais si le fournisseur ne peut pas créer de session de navigateur.

    Dans le composeur du Chat, le contrôle de conversation est le bouton d’ondes à côté du bouton de dictée au microphone. Lorsque la conversation démarre, la ligne d’état du composeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `talk.client.toolCall`.

    Smoke test en direct pour mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie le pont WebSocket backend OpenAI, l’échange SDP WebRTC de navigateur OpenAI, la configuration WebSocket de navigateur Google Live à jeton contraint et l’adaptateur de navigateur de relais Gateway avec un média de microphone factice. La commande n’imprime que l’état des fournisseurs et ne journalise pas les secrets.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Orienter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut tout de même être affiché dans l’interface utilisateur.
    - Gateway conserve le texte partiel d’assistant abandonné dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les fragments d’abandon de la sortie d’achèvement normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et push Web

L’interface de contrôle fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Le push Web permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

Si la page affiche **Incompatibilité de protocole** juste après une mise à jour d’OpenClaw, rouvrez d’abord le tableau de bord avec `openclaw dashboard` et effectuez une actualisation forcée de la page. Si l’échec persiste, effacez les données du site pour l’origine du tableau de bord ou testez dans une fenêtre de navigation privée ; un ancien onglet ou le cache du service worker du navigateur peut continuer à exécuter un bundle de l’interface de contrôle antérieur à la mise à jour avec le nouveau Gateway.

| Surface                                               | Ce qu’elle fait                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » dès qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement, utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement de navigateur persistés.        |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez figer les clés (pour des déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valeur par défaut : `https://openclaw.ai`)

L’interface Control UI utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements de navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` avec `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour les notifications push adossées à un relais) et de la méthode `push.test` existante, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages d’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution des scripts dans les intégrations hébergées.
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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin du comportement same-origin. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues en `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de chat

Les messages de chat groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur écrans larges peuvent la remplacer sans modifier le CSS inclus en définissant `gateway.controlUi.chatMessageMaxWidth` :

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

La valeur est validée avant d’atteindre le navigateur. Les valeurs prises en charge incluent des longueurs simples et des pourcentages comme `960px` ou `82%`, ainsi que des expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gardez le Gateway sur loopback et laissez Tailscale Serve le proxifier avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur Control UI avec identité d’appareil navigateur, ce chemin Serve vérifié évite aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples non-correspondances en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du gateway est approuvé. Si du code local non approuvé peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez ensuite :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord sur HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisée localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification opérateur Control UI réussie via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface localement :

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

    `allowInsecureAuth` est uniquement une option de compatibilité locale :

    - Elle permet aux sessions Control UI localhost de continuer sans identité d’appareil dans les contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil distante (non-localhost).

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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil Control UI et constitue une forte dégradation de sécurité. Revenez rapidement en arrière après une utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Une authentification trusted-proxy réussie peut admettre des sessions Control UI **opérateur** sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions Control UI avec rôle de nœud.
    - Les reverse proxies local loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Voir [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

Control UI est fournie avec une politique `img-src` stricte : seuls les ressources **same-origin**, les URL `data:` et les URL `blob:` générées localement sont autorisées. Les URL d’images distantes en `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune requête réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’interface récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par Control UI s’affichent toujours.
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées par les helpers d’avatar de Control UI et remplacées par le logo/badge intégré, afin qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du gateway est configurée, le point de terminaison d’avatar de Control UI exige le même jeton de gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité d’agent sur des hôtes autrement protégés.
- Control UI transmet elle-même le jeton de gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du gateway (déconseillé sur les hôtes partagés), la route d’avatar devient elle aussi non authentifiée, conformément au reste du gateway.

## Authentification de la route de médias d’assistant

Lorsque l’authentification du gateway est configurée, les aperçus de médias locaux d’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur Control UI normale. Le navigateur envoie le jeton de gateway comme en-tête bearer lorsqu’il vérifie la disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` à courte durée de vie, limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou mot de passe de gateway actif. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela maintient le rendu média normal compatible avec les éléments média natifs du navigateur sans placer d’identifiants gateway réutilisables dans des URL média visibles.

## Construire l’interface

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

Pointez ensuite l’interface vers l’URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Page Control UI vide

Si le navigateur charge un tableau de bord vide et que DevTools n’affiche aucune erreur utile, une extension ou un script de contenu précoce peut avoir empêché l’évaluation de l’application module JavaScript. La page statique inclut un panneau de récupération HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Réessayer** du panneau après avoir changé l’environnement du navigateur, ou rechargez manuellement après ces vérifications :

- Désactivez les extensions qui injectent du contenu dans toutes les pages, en particulier les extensions avec des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur propre ou un autre navigateur.
- Gardez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après le changement de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

Control UI est composée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, mais que le Gateway s’exécute ailleurs.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Authentification ponctuelle facultative (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` est stocké dans localStorage après le chargement, puis supprimé de l’URL.
    - Si vous transmettez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez la valeur de `gatewayUrl` dans l’URL afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais uniquement comme solution de repli, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne revient pas aux identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway se trouve derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le détournement de clic.
    - Les déploiements publics hors loopback de l’interface utilisateur de contrôle doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Les chargements privés de même origine sur LAN/Tailnet depuis des hôtes loopback, RFC1918/link-local, `.local`, `.ts.net` ou Tailscale CGNAT sont acceptés sans activer le repli basé sur l’en-tête Host.
    - Le démarrage du Gateway peut initialiser des origines locales comme `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port de liaison effectifs à l’exécution, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser toute origine de navigateur, et non « faire correspondre l’hôte que j’utilise ».
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

## Articles connexes

- [Tableau de bord](/fr/web/dashboard) — tableau de bord du Gateway
- [Vérifications de santé](/fr/gateway/health) — surveillance de l’état du Gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
