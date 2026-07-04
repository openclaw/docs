---
read_when:
    - Vous voulez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle basée sur le navigateur pour le Gateway (discussion, activité, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-07-04T17:58:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway:

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

<Note>
Sur les liaisons LAN natives de Windows, le pare-feu Windows ou une stratégie de groupe gérée par l’organisation peut encore bloquer l’URL LAN annoncée même lorsque `127.0.0.1` fonctionne sur l’hôte du Gateway. Exécutez `openclaw gateway status --deep` sur l’hôte Windows ; la commande signale les ports probablement bloqués, les incompatibilités de profil et les règles de pare-feu locales que la stratégie peut ignorer.
</Note>

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session d’onglet de navigateur actuelle et l’URL de gateway sélectionnée ; les mots de passe ne sont pas persistés. L’intégration génère généralement un jeton de gateway pour l’authentification par secret partagé à la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

**Ce que vous verrez :** « disconnected (1008): pairing required »

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

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée de niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

Les agents Paperclip qui se connectent via l’adaptateur `openclaw_gateway` utilisent le même flux d’approbation au premier lancement. Après la tentative de connexion initiale, exécutez `openclaw devices approve --latest` pour prévisualiser la demande en attente, puis réexécutez la commande `openclaw devices approve <requestId>` affichée pour l’approuver. Fournissez des valeurs explicites `--url` et `--token` pour un gateway distant. Pour garder les approbations stables entre les redémarrages, configurez une valeur persistante `adapterConfig.devicePrivateKeyPem` dans Paperclip au lieu de le laisser générer une nouvelle identité d’appareil éphémère à chaque exécution.

<Note>
- Les connexions directes depuis le navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Appairer un appareil mobile

Un administrateur déjà appairé peut créer le QR de connexion iOS/Android sans
ouvrir de terminal :

<Steps>
  <Step title="Ouvrir l’appairage mobile">
    Sélectionnez **Nœuds**, puis cliquez sur **Appairer un appareil mobile** dans la carte **Appareils**.
  </Step>
  <Step title="Connecter le téléphone">
    Dans l’application mobile OpenClaw, ouvrez **Paramètres** → **Gateway** et scannez le code QR.
    Vous pouvez aussi copier-coller le code de configuration.
  </Step>
  <Step title="Confirmer la connexion">
    L’application officielle iOS/Android se connecte automatiquement. Si **Appareils** affiche une
    demande en attente, vérifiez son rôle et ses portées avant de l’approuver.
  </Step>
</Steps>

La création d’un code de configuration nécessite `operator.admin` ; le bouton est désactivé pour
les sessions qui n’en disposent pas. Un code de configuration contient un identifiant d’amorçage à durée de vie courte ;
traitez donc le QR et le code copié comme un mot de passe tant qu’ils sont valides. Pour l’appairage
distant, le Gateway doit se résoudre en `wss://` (par exemple via Tailscale
Serve/Funnel) ; `ws://` non chiffré est limité aux adresses loopback et LAN privées.
Consultez [Appairage](/fr/channels/pairing#pair-from-the-control-ui-recommended) pour les
détails complets de sécurité et de secours.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) associée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est ni synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés recouvrent l’identité résolue par le gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement dans ce champ (comme des gateways scriptés ou des tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/control-ui-config.json`, résolu relativement au chemin de base de l’interface de contrôle du gateway (par exemple `/__openclaw__/control-ui-config.json` lorsque l’interface est servie sous `/__openclaw__/`). Ce point de terminaison est protégé par la même authentification de gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement en fonction de la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites suivantes.
- Les clés de traduction manquantes se replient sur l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de langue acceptés par Mintlify. Les documentations en thaï (`th`) et en persan (`fa`) sont toujours générées dans le dépôt de publication ; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien du thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Apparence inclut aussi un réglage Taille du texte local au navigateur. Le réglage est stocké avec le reste des préférences de l’interface de contrôle, s’applique au texte du chat, au texte du compositeur, aux cartes d’outils et aux barres latérales de chat, et maintient les champs de saisie de texte à au moins 16px afin que Safari mobile ne zoome pas automatiquement à la prise de focus.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local ; l’effacer ramène le thème actif à Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et conversation vocale">
    - Discutez avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique de chat demandent une fenêtre récente bornée avec des plafonds de texte par message, afin que les grandes sessions n’obligent pas le navigateur à afficher une charge utile de transcription complète avant que le chat devienne utilisable.
    - Parlez via des sessions temps réel du navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique sur WebSocket, et les plugins vocaux temps réel uniquement côté backend utilisent le transport relais du Gateway. Les sessions de fournisseur détenues par le client commencent par `talk.client.create` ; les sessions relais du Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio`, transmet les appels d’outils fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la stratégie du Gateway et le plus grand modèle OpenClaw configuré, et route le pilotage vocal d’exécution active via `talk.client.steer` ou `talk.session.steer`.
    - Diffusez les appels d’outils et les cartes de sortie d’outils en direct dans le chat (événements d’agent).
    - Onglet Activité avec des résumés locaux au navigateur, priorisant la rédaction, de l’activité d’outils en direct provenant des livraisons existantes `session.tool` / d’événements d’outils.

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux : état des canaux intégrés ainsi que des canaux de Plugin groupés/externes, connexion par QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations de sondes de canaux gardent l’instantané précédent visible pendant que les vérifications lentes des fournisseurs se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface.
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : lister par défaut les sessions d’agents configurés, se replier depuis des clés de session d’agent non configuré périmées, et appliquer des remplacements par session pour le modèle/la réflexion/le mode rapide/le mode verbeux/la trace/le raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves : état de Dreaming, bascule d’activation/désactivation et lecteur du journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills : état, activation/désactivation, installation, mises à jour de clés d’API (`skills.*`).
    - Nœuds : liste + capacités (`node.list`), création de codes de configuration mobile et approbation de l’appairage d’appareils (`device.pair.*`).
    - Approbations exec : modifier les listes d’autorisation du gateway ou du nœud + stratégie de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP dispose d'une page de paramètres dédiée pour les serveurs configurés, l'activation, les récapitulatifs OAuth/filtre/parallèles, les commandes opérateur courantes et l'éditeur de configuration `mcp` à portée limitée.
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une garde par hachage de base pour éviter d'écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) vérifient au préalable la résolution active des SecretRef pour les références dans la charge utile de configuration soumise ; les références actives soumises non résolues sont rejetées avant l'écriture.
    - Les enregistrements de formulaire ignorent les anciens espaces réservés expurgés qui ne peuvent pas être restaurés depuis la configuration enregistrée, tout en préservant les valeurs expurgées qui correspondent encore aux secrets enregistrés.
    - Rendu de schéma + formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indices d'interface utilisateur correspondants, les résumés des enfants immédiats, les métadonnées de documentation sur les noeuds objet imbriqué/joker/tableau/composition, ainsi que les schémas de Plugin + canal lorsqu'ils sont disponibles) ; l'éditeur JSON brut est disponible uniquement lorsque l'instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer en toute sécurité un aller-retour de texte brut, Control UI force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l'éditeur JSON brut, « Réinitialiser à l'état enregistré » préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de restituer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l'instantané peut effectuer un aller-retour sûr.
    - Les valeurs d'objet SecretRef structurées sont rendues en lecture seule dans les champs de texte du formulaire afin d'éviter une corruption accidentelle d'objet vers chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés d'état/santé/modèles + journal des événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal des événements inclut les temps de rafraîchissement/RPC de Control UI, les temps de rendu lent de discussion/configuration, ainsi que les entrées de réactivité du navigateur pour les longues images d'animation ou les longues tâches lorsque le navigateur expose ces types d'entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du Gateway avec filtre/export (`logs.tail`).
    - Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après la reconnexion pour vérifier la version du gateway en cours d'exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison annonce un résumé par défaut. Vous pouvez passer à aucune livraison si vous souhaitez des exécutions internes uniquement.
    - Les champs canal/cible apparaissent lorsque l'annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucun sont disponibles.
    - Les contrôles de modification avancée incluent supprimer-après-exécution, effacer le remplacement d'agent, les options cron exact/décalage, les remplacements de modèle/réflexion d'agent et les bascules de livraison au mieux.
    - La validation du formulaire est intégrée avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d'enregistrement jusqu'à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton porteur dédié ; s'il est omis, le webhook est envoyé sans en-tête d'authentification.
    - Solution de repli obsolète : exécutez `openclaw doctor --fix` pour migrer les anciennes tâches stockées avec `notify: true` de `cron.webhook` vers une livraison webhook ou de complétion explicite par tâche.

  </Accordion>
</AccordionGroup>

## Page MCP

La page MCP dédiée est une vue opérateur pour les serveurs MCP gérés par OpenClaw sous `mcp.servers`. Elle ne démarre pas les transports MCP elle-même ; utilisez-la pour inspecter et modifier la configuration enregistrée, puis utilisez `openclaw mcp doctor --probe` lorsque vous avez besoin d'une preuve de serveur en direct.

Flux de travail typique :

1. Ouvrez **MCP** depuis la barre latérale.
2. Vérifiez les cartes de résumé pour le nombre total de serveurs, les serveurs activés, OAuth et filtrés.
3. Examinez chaque ligne de serveur pour le transport, l'activation, l'authentification, les filtres, les délais d'attente et les indications de commande.
4. Basculez l'activation lorsqu'un serveur doit rester configuré mais être exclu de la découverte à l'exécution.
5. Modifiez la section de configuration `mcp` à portée limitée pour les définitions de serveurs, les en-têtes, les chemins TLS/mTLS, les métadonnées OAuth, les filtres d'outils et les métadonnées de projection Codex.
6. Utilisez **Enregistrer** pour une écriture de configuration, ou **Enregistrer et publier** lorsque le Gateway en cours d'exécution doit appliquer la configuration modifiée.
7. Exécutez `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` depuis un terminal lorsque le processus modifié nécessite des diagnostics statiques, une preuve en direct ou l'élimination du cache d'exécution.

La page expurge les valeurs de type URL contenant des informations d'identification avant le rendu et met les noms de serveurs entre guillemets dans les extraits de commande afin que les commandes copiées fonctionnent encore avec des espaces ou des métacaractères shell. La référence complète de la CLI et de la configuration se trouve dans [MCP](/fr/cli/mcp).

## Onglet Activité

L'onglet Activité est un observateur éphémère local au navigateur pour l'activité d'outils en direct. Il est dérivé du même flux d'événements `session.tool` / outil du Gateway qui alimente les cartes d'outils de Chat ; il n'ajoute pas d'autre famille d'événements Gateway, point de terminaison, magasin d'activité durable, flux de métriques ni flux d'observateur externe.

Les entrées d'activité ne conservent que des résumés assainis et des aperçus de sortie expurgés et tronqués. Les valeurs d'arguments d'outils ne sont pas stockées dans l'état d'Activité ; l'interface indique que les arguments sont masqués et n'enregistre que le nombre de champs d'arguments. La liste en mémoire suit l'onglet de navigateur actuel, survit à la navigation dans Control UI et se réinitialise au rechargement de la page, au changement de session ou avec **Effacer**.

## Comportement de Chat

<AccordionGroup>
  <Accordion title="Sémantique d'envoi et d'historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`. Les clients Control UI de confiance peuvent également recevoir des métadonnées facultatives de chronométrage d'ACK pour les diagnostics locaux.
    - Les téléversements de Chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d'image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l'historique sous forme de liens de pièces jointes.
    - Un nouvel envoi avec le même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l'exécution, puis `{ status: "ok" }` après la fin.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l'interface. Lorsque les entrées de transcription sont trop volumineuses, Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Lorsqu'un message d'assistant visible a été tronqué dans `chat.history`, le lecteur latéral peut récupérer à la demande l'entrée de transcription complète normalisée pour l'affichage via `chat.message.get`, avec `sessionKey`, l'`agentId` actif si nécessaire et le `messageId` de transcription. Si Gateway ne peut toujours pas renvoyer davantage, le lecteur affiche un état explicitement indisponible au lieu de répéter silencieusement l'aperçu tronqué.
    - Les images d'assistant/générées sont conservées comme références de médias gérés et renvoyées via des URL média Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien des charges utiles d'image base64 brutes dans la réponse d'historique de discussion.
    - Lors du rendu de `chat.history`, Control UI supprime du texte d'assistant visible les balises de directives en ligne uniquement destinées à l'affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d'appels d'outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d'appels d'outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées d'assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d'accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et le rafraîchissement final de l'historique, la vue de discussion conserve les messages utilisateur/assistant optimistes locaux visibles si `chat.history` renvoie brièvement un ancien instantané ; la transcription canonique remplace ces messages locaux une fois que l'historique Gateway a rattrapé son retard.
    - Les événements `chat` en direct représentent l'état de livraison, tandis que `chat.history` est reconstruit depuis la transcription durable de la session. Après les événements finaux d'outils, Control UI recharge l'historique et ne fusionne qu'une petite fin optimiste ; la frontière de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d'assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour réservées à l'interface (pas d'exécution d'agent, pas de livraison canal).
    - La barre latérale répertorie les sessions récentes avec une action Nouvelle session, un lien Toutes les sessions et un bouton de recherche de session qui ouvre le sélecteur complet de sessions (délimité par l'agent sélectionné, avec recherche et pagination). Le changement d'agent n'affiche que les sessions liées à cet agent et revient à la session principale de cet agent lorsqu'il n'a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles de discussion restent sur une ligne compacte et se réduisent lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir en haut ou atteindre le bas restaure les contrôles.
    - Les messages texte uniquement dupliqués consécutifs s'affichent comme une seule bulle avec un badge de comptage. Les messages contenant des images, des pièces jointes, une sortie d'outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion de l'en-tête de discussion corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d'envoi limitées à un seul tour.
    - Si vous envoyez un message alors qu'une modification du sélecteur de modèle pour la même session est encore en cours d'enregistrement, le compositeur attend cette correction de session avant d'appeler `chat.send` afin que l'envoi utilise le modèle sélectionné.
    - Saisir `/new` dans Control UI crée et bascule vers la même nouvelle session de tableau de bord que Nouveau chat, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l'agent ; dans ce cas, cela réinitialise la session principale sur place. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle de discussion demande la vue des modèles configurés du Gateway. Si `agents.defaults.models` est présent, cette liste d'autorisation alimente le sélecteur, y compris les entrées `provider/*` qui gardent les catalogues à portée fournisseur dynamiques. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs avec une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les rapports récents d'utilisation de session Gateway incluent les jetons de contexte actuels, la barre d'outils du compositeur de discussion affiche un petit anneau d'utilisation du contexte avec le pourcentage utilisé ; le détail complet des jetons se trouve dans son infobulle. L'anneau passe à un style d'avertissement à forte pression de contexte et, aux niveaux de compaction recommandés, affiche un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu'à ce que Gateway signale à nouveau une utilisation récente.

  </Accordion>
  <Accordion title="Mode conversation (temps réel navigateur)">
    Le mode conversation utilise un fournisseur vocal en temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus un profil d'authentification par clé API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY` ; les profils OAuth OpenAI ne configurent pas la voix Realtime. Configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d'authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et les déclarations d'outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n'exposent qu'un pont temps réel côté backend passent par le transport relais Gateway, de sorte que les identifiants et les sockets fournisseur restent côté serveur tandis que l'audio du navigateur transite par des RPC Gateway authentifiés. L'invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n'accepte pas de remplacements d'instructions fournis par l'appelant.

    Le composeur Chat inclut un bouton d’options de conversation vocale à côté du bouton de démarrage/arrêt de la conversation vocale. Les options s’appliquent à la prochaine session de conversation vocale et peuvent remplacer le fournisseur, le transport, le modèle, la voix, l’effort de raisonnement, le seuil VAD, la durée de silence et le préremplissage du préfixe. Lorsqu’une option est vide, le Gateway utilise les valeurs par défaut configurées lorsqu’elles sont disponibles, ou la valeur par défaut du fournisseur. Sélectionner le relais Gateway force le chemin de relais côté backend ; sélectionner WebRTC garde la session détenue par le client et échoue au lieu de basculer silencieusement vers le relais si le fournisseur ne peut pas créer de session de navigateur.

    Dans le composeur Chat, le contrôle de conversation vocale est le bouton à ondes situé à côté du bouton de dictée au microphone. Lorsque la conversation vocale démarre, la ligne d’état du composeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil en temps réel consulte le modèle plus grand configuré via `talk.client.toolCall`.

    Smoke test live mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie le pont WebSocket backend OpenAI, l’échange SDP WebRTC de navigateur OpenAI, la configuration WebSocket navigateur à jeton contraint Google Live et l’adaptateur navigateur de relais Gateway avec un faux média de microphone. La commande affiche uniquement l’état du fournisseur et ne journalise pas les secrets.

  </Accordion>
  <Accordion title="Arrêter et interrompre">
    - Cliquez sur **Stop** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en file d’attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Saisissez `/stop` (ou des expressions d’interruption autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après interruption">
    - Lorsqu’une exécution est interrompue, le texte partiel de l’assistant peut encore être affiché dans l’interface utilisateur.
    - Le Gateway persiste le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées persistées incluent des métadonnées d’interruption afin que les consommateurs de transcriptions puissent distinguer les fragments interrompus de la sortie d’achèvement normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et push web

La Control UI fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications, même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

Si la page affiche **Protocol mismatch** juste après une mise à jour d’OpenClaw, rouvrez d’abord le tableau de bord avec `openclaw dashboard` et forcez l’actualisation de la page. Si l’échec persiste, effacez les données de site pour l’origine du tableau de bord ou testez dans une fenêtre de navigation privée ; un ancien onglet ou un cache de service worker du navigateur peut continuer à exécuter un bundle Control UI d’avant mise à jour contre le Gateway plus récent.

| Surface                                               | Ce qu’elle fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics de notification. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement, utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement navigateur persistés.           |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `https://openclaw.ai`)

La Control UI utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` ainsi que `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais iOS APNS (voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et de la méthode `push.test` existante, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (default)">
    Autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est la valeur par défaut et elle suffit généralement pour les jeux/widgets de navigateur autonomes.
  </Tab>
  <Tab title="trusted">
    Ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site qui ont intentionnellement besoin de privilèges plus forts.
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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin du comportement même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages Chat

Les messages Chat groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur moniteurs larges peuvent la remplacer sans modifier le CSS fourni en définissant `gateway.controlUi.chatMessageMaxWidth` :

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

La valeur est validée avant d’atteindre le navigateur. Les valeurs prises en charge incluent des longueurs et pourcentages simples comme `960px` ou `82%`, ainsi que les expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gardez le Gateway sur loopback et laissez Tailscale Serve le proxifier avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur Control UI avec identité d’appareil du navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les contrôles d’appareil normaux. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP client et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives concurrentes incorrectes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux incompatibilités simples en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte Gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
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

- compatibilité HTTP non sécurisée localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification Control UI opérateur réussie via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte Gateway)

<AccordionGroup>
  <Accordion title="Comportement du basculeur d’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement un basculeur de compatibilité locale :

    - Il permet aux sessions Control UI localhost de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Il ne contourne pas les contrôles d’appairage.
    - Il n’assouplit pas les exigences d’identité d’appareil distantes (non-localhost).

  </Accordion>
  <Accordion title="Urgence uniquement">
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
    `dangerouslyDisableDeviceAuth` désactive les contrôles d’identité d’appareil Control UI et constitue une forte dégradation de la sécurité. Rétablissez rapidement la configuration après l’utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut admettre des sessions Control UI **opérateur** sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions Control UI avec rôle de nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Voir [Tailscale](/fr/gateway/tailscale) pour les conseils de configuration HTTPS.

## Politique de sécurité du contenu

La Control UI est livrée avec une politique `img-src` stricte : seuls les ressources de **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisées. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatars authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL inline `data:image/...` s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par la Control UI s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les assistants d’avatar de la Control UI et remplacées par le logo/badge intégré, afin qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours actif et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification Gateway est configurée, le point de terminaison d’avatar de la Control UI exige le même jeton Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar sous la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité d’un agent sur des hôtes qui sont par ailleurs protégés.
- La Control UI transmet elle-même le jeton Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du Gateway (déconseillé sur les hôtes partagés), la route de l’avatar devient elle aussi non authentifiée, comme le reste du Gateway.

## Authentification de la route des médias de l’assistant

Lorsque l’authentification du Gateway est configurée, les aperçus de médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` nécessite l’authentification opérateur normale de l’interface de contrôle. Le navigateur envoie le jeton du Gateway sous forme d’en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` de courte durée, limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou du mot de passe actif du Gateway. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela maintient le rendu normal des médias compatible avec les éléments multimédias natifs du navigateur sans placer d’identifiants réutilisables du Gateway dans les URL de médias visibles.

## Construction de l’interface utilisateur

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue optionnelle (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface utilisateur vers votre URL WS du Gateway (par exemple `ws://127.0.0.1:18789`).

## Page d’interface de contrôle vide

Si le navigateur charge un tableau de bord vide et que DevTools n’affiche aucune erreur utile, une extension ou un script de contenu précoce peut avoir empêché l’application module JavaScript de s’évaluer. La page statique inclut un panneau de récupération en HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Réessayer** du panneau après avoir modifié l’environnement du navigateur, ou rechargez manuellement après ces vérifications :

- Désactivez les extensions qui s’injectent dans toutes les pages, en particulier celles avec des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur propre ou un autre navigateur.
- Gardez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après le changement de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

L’interface de contrôle se compose de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, mais que le Gateway s’exécute ailleurs.

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

    Authentification ponctuelle optionnelle (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l’URL.
    - Si vous transmettez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez la valeur `gatewayUrl` dans l’URL afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les paramètres de requête hérités `?token=` sont toujours importés une seule fois par compatibilité, mais uniquement comme solution de repli, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements publics non-loopback de l’interface de contrôle doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Les chargements privés sur LAN/Tailnet à même origine depuis des hôtes loopback, RFC1918/link-local, `.local`, `.ts.net` ou Tailscale CGNAT sont acceptés sans activer la solution de repli par en-tête Host.
    - Le démarrage du Gateway peut initialiser des origines locales comme `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port effectifs de liaison à l’exécution, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, pas « faire correspondre l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de solution de repli par origine d’en-tête Host, mais c’est un mode de sécurité dangereux.

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

## Connexe

- [Tableau de bord](/fr/web/dashboard) — tableau de bord du Gateway
- [Contrôles de santé](/fr/gateway/health) — surveillance de l’état du Gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
