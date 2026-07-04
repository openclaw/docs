---
read_when:
    - Vous voulez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle dans le navigateur pour le Gateway (chat, activité, nœuds, configuration)
title: Interface utilisateur de contrôle
x-i18n:
    generated_at: "2026-07-04T20:30:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (p. ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway fonctionne sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

<Note>
Sur les liaisons LAN Windows natives, le pare-feu Windows ou une stratégie de groupe gérée par l’organisation peut toujours bloquer l’URL LAN annoncée même lorsque `127.0.0.1` fonctionne sur l’hôte du Gateway. Exécutez `openclaw gateway status --deep` sur l’hôte Windows ; la commande signale les ports probablement bloqués, les incohérences de profil et les règles de pare-feu locales que la stratégie peut ignorer.
</Note>

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité du proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur courant et l’URL de Gateway sélectionnée ; les mots de passe ne sont pas conservés. L’intégration génère généralement un jeton de Gateway pour l’authentification par secret partagé à la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Association d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’association à usage unique**. Il s’agit d’une mesure de sécurité visant à empêcher les accès non autorisés.

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

Si le navigateur relance l’association avec des détails d’authentification modifiés (rôle/périmètres/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà associé et que vous le faites passer d’un accès en lecture à un accès écriture/admin, cela est traité comme une mise à niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de périmètres.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

Les agents Paperclip qui se connectent via l’adaptateur `openclaw_gateway` utilisent le même flux d’approbation au premier lancement. Après la tentative de connexion initiale, exécutez `openclaw devices approve --latest` pour prévisualiser la demande en attente, puis réexécutez la commande `openclaw devices approve <requestId>` affichée pour l’approuver. Fournissez des valeurs explicites `--url` et `--token` pour un Gateway distant. Pour garder les approbations stables entre les redémarrages, configurez un `adapterConfig.devicePrivateKeyPem` persistant dans Paperclip au lieu de le laisser générer une nouvelle identité d’appareil éphémère à chaque exécution.

<Note>
- Les connexions directes du navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’association pour les sessions opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons directes Tailnet, les connexions de navigateur LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc une nouvelle association.

</Note>

## Associer un appareil mobile

Un administrateur déjà associé peut créer le QR de connexion iOS/Android sans
ouvrir de terminal :

<Steps>
  <Step title="Ouvrir l’association mobile">
    Sélectionnez **Nœuds**, puis cliquez sur **Associer un appareil mobile** dans la carte **Appareils**.
  </Step>
  <Step title="Connecter le téléphone">
    Dans l’application mobile OpenClaw, ouvrez **Paramètres** → **Gateway** et scannez le QR
    code. Vous pouvez aussi copier-coller le code de configuration.
  </Step>
  <Step title="Confirmer la connexion">
    L’application officielle iOS/Android se connecte automatiquement. Si **Appareils** affiche une
    demande en attente, vérifiez son rôle et ses périmètres avant de l’approuver.
  </Step>
</Steps>

La création d’un code de configuration nécessite `operator.admin` ; le bouton est désactivé pour
les sessions qui ne l’ont pas. Un code de configuration contient un identifiant d’amorçage de courte durée ;
traitez donc le QR et le code copié comme un mot de passe tant qu’ils sont valides. Pour une
association distante, le Gateway doit se résoudre en `wss://` (par exemple via Tailscale
Serve/Funnel) ; `ws://` en clair est limité aux adresses loopback et LAN privées.
Consultez [Association](/fr/channels/pairing#pair-from-the-control-ui-recommended) pour les
détails complets sur la sécurité et les solutions de repli.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur courant et n’est pas synchronisée vers d’autres appareils ni conservée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez effectivement. Effacer les données du site ou changer de navigateur la réinitialise.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le Gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients hors interface écrivant directement ce champ (par exemple des gateways scriptés ou des tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/control-ui-config.json`, résolu relativement au chemin de base de l’interface de contrôle du Gateway (par exemple `/__openclaw__/control-ui-config.json` lorsque l’interface est servie sous `/__openclaw__/`). Ce point de terminaison est protégé par la même authentification de Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe de Gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement selon la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites ultérieures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue intégré au site de documentation Mintlify est limité aux codes de langue acceptés par Mintlify. Les documentations en thaï (`th`) et en persan (`fa`) sont toujours générées dans le dépôt de publication ; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Apparence inclut aussi un paramètre Taille du texte local au navigateur. Ce paramètre est stocké avec le reste des préférences de l’interface de contrôle, s’applique au texte du chat, au texte du compositeur, aux cartes d’outils et aux barres latérales de chat, et maintient les entrées de texte à au moins 16px afin que Safari mobile ne zoome pas automatiquement à la mise au point.

Les thèmes importés sont stockés uniquement dans le profil de navigateur courant. Ils ne sont pas écrits dans la configuration du Gateway et ne sont pas synchronisés entre appareils. Remplacer le thème importé met à jour l’unique emplacement local ; l’effacer rebascule le thème actif sur Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et conversation vocale">
    - Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique de chat demandent une fenêtre récente bornée avec des plafonds de texte par message afin que les grandes sessions n’obligent pas le navigateur à rendre une charge utile de transcription complète avant que le chat ne devienne utilisable.
    - Converser via des sessions temps réel du navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique sur WebSocket, et les plugins vocaux temps réel uniquement backend utilisent le transport relais du Gateway. Les sessions de fournisseur détenues par le client commencent par `talk.client.create` ; les sessions relais du Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio`, transmet les appels d’outils fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la stratégie du Gateway et le plus grand modèle OpenClaw configuré, et route le pilotage vocal de l’exécution active via `talk.client.steer` ou `talk.session.steer`.
    - Diffuser les appels d’outils + les cartes de sortie d’outils en direct dans Chat (événements d’agent).
    - Onglet Activité avec des résumés locaux au navigateur et privilégiant la rédaction de l’activité d’outils en direct à partir de la livraison existante `session.tool` / événements d’outils.

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux : état des canaux intégrés et des canaux de plugins groupés/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations de sondes de canal gardent l’instantané précédent visible pendant que les vérifications lentes du fournisseur se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface.
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : lister par défaut les sessions d’agents configurés, épingler les sessions fréquentes, les renommer, archiver ou restaurer les sessions inactives, revenir depuis les clés de session d’agent non configuré obsolètes, et appliquer des remplacements par session de modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Les sessions épinglées sont triées au-dessus des sessions récentes non épinglées ; les sessions archivées résident dans la vue archivée de la page Sessions et conservent leurs transcriptions.
    - Rêves : état de Dreaming, bascule activer/désactiver et lecteur du Journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nœuds, approbations exec">
    - Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills : état, activation/désactivation, installation, mises à jour de clés d’API (`skills.*`).
    - Nœuds : liste + capacités (`node.list`), créer des codes de configuration mobile et approuver l’association d’appareil (`device.pair.*`).
    - Approbations exec : modifier les listes d’autorisation de gateway ou de nœud + stratégie de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Affichez/modifiez `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP dispose d’une page de paramètres dédiée aux serveurs configurés, à leur activation, aux récapitulatifs OAuth/filtre/parallèles, aux commandes opérateur courantes et à l’éditeur de configuration `mcp` limité au périmètre.
    - Appliquez + redémarrez avec validation (`config.apply`) et réveillez la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) précontrôlent la résolution des SecretRef actifs pour les références dans la charge utile de configuration soumise ; les références soumises actives non résolues sont rejetées avant l’écriture.
    - Les enregistrements de formulaire écartent les espaces réservés caviardés obsolètes qui ne peuvent pas être restaurés depuis la configuration enregistrée, tout en préservant les valeurs caviardées qui correspondent encore à des secrets enregistrés.
    - Rendu du schéma + formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indications d’interface correspondantes, les résumés d’enfants immédiats, les métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition, ainsi que les schémas de plugin + canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est disponible que lorsque l’instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas faire un aller-retour sûr avec du texte brut, Control UI force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, « Réinitialiser aux valeurs enregistrées » préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de restituer un instantané aplati, de sorte que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont affichées en lecture seule dans les champs texte du formulaire afin d’éviter une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés status/health/models + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les minutages de rafraîchissement/RPC de Control UI, les minutages de rendu lent de chat/configuration et les entrées de réactivité du navigateur pour les longues trames d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du Gateway avec filtre/export (`logs.tail`).
    - Mise à jour : exécutez une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interrogez `update.status` après reconnexion pour vérifier la version du Gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison utilise par défaut l’annonce du récapitulatif. Vous pouvez passer à aucune si vous voulez des exécutions uniquement internes.
    - Les champs canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucune sont disponibles.
    - Les contrôles d’édition avancés incluent la suppression après exécution, l’effacement du remplacement d’agent, les options cron exactes/échelonnées, les remplacements de modèle/réflexion d’agent et les bascules de livraison au mieux.
    - La validation du formulaire est en ligne avec des erreurs au niveau des champs ; les valeurs non valides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Repli obsolète : exécutez `openclaw doctor --fix` pour migrer les tâches héritées stockées avec `notify: true` de `cron.webhook` vers une livraison webhook ou d’achèvement explicite par tâche.

  </Accordion>
</AccordionGroup>

## Page MCP

La page MCP dédiée est une vue opérateur pour les serveurs MCP gérés par OpenClaw sous `mcp.servers`. Elle ne démarre pas les transports MCP elle-même ; utilisez-la pour inspecter et modifier la configuration enregistrée, puis utilisez `openclaw mcp doctor --probe` lorsque vous avez besoin d’une preuve de serveur actif.

Flux de travail typique :

1. Ouvrez **MCP** depuis la barre latérale.
2. Vérifiez les cartes récapitulatives pour le nombre total de serveurs, de serveurs activés, de serveurs OAuth et de serveurs filtrés.
3. Examinez chaque ligne de serveur pour le transport, l’activation, l’authentification, les filtres, les délais d’expiration et les indications de commande.
4. Basculez l’activation lorsqu’un serveur doit rester configuré mais rester exclu de la découverte à l’exécution.
5. Modifiez la section de configuration `mcp` limitée au périmètre pour les définitions de serveurs, les en-têtes, les chemins TLS/mTLS, les métadonnées OAuth, les filtres d’outils et les métadonnées de projection Codex.
6. Utilisez **Enregistrer** pour une écriture de configuration, ou **Enregistrer et publier** lorsque le Gateway en cours d’exécution doit appliquer la configuration modifiée.
7. Exécutez `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` depuis un terminal lorsque le processus modifié a besoin de diagnostics statiques, d’une preuve active ou d’une élimination du runtime mis en cache.

La page caviarde les valeurs de type URL contenant des identifiants avant le rendu et met les noms de serveur entre guillemets dans les extraits de commande afin que les commandes copiées fonctionnent toujours avec des espaces ou des métacaractères de shell. La référence complète de la CLI et de la configuration se trouve dans [MCP](/fr/cli/mcp).

## Onglet Activité

L’onglet Activité est un observateur éphémère local au navigateur pour l’activité d’outils en direct. Il est dérivé du même flux d’événements Gateway `session.tool` / outil qui alimente les cartes d’outils du chat ; il n’ajoute pas d’autre famille d’événements Gateway, point de terminaison, magasin d’activité durable, flux de métriques ni flux d’observation externe.

Les entrées d’activité ne conservent que des récapitulatifs assainis et des aperçus de sortie caviardés et tronqués. Les valeurs d’arguments des outils ne sont pas stockées dans l’état d’Activité ; l’interface indique que les arguments sont masqués et n’enregistre que le nombre de champs d’arguments. La liste en mémoire suit l’onglet de navigateur actuel, survit à la navigation dans Control UI et se réinitialise lors du rechargement de la page, du changement de session ou de l’action **Effacer**.

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via les événements `chat`. Les clients Control UI de confiance peuvent aussi recevoir des métadonnées facultatives de minutage d’ACK pour les diagnostics locaux.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique comme liens de pièces jointes.
    - Un nouvel envoi avec le même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après l’achèvement.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface. Lorsque les entrées de transcription sont trop volumineuses, Gateway peut tronquer les longs champs texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Lorsqu’un message visible de l’assistant a été tronqué dans `chat.history`, le lecteur latéral peut récupérer à la demande l’entrée complète de transcription normalisée pour l’affichage via `chat.message.get` au moyen de `sessionKey`, de l’`agentId` actif si nécessaire, et du `messageId` de transcription. Si Gateway ne peut toujours pas renvoyer davantage, le lecteur affiche un état explicitement indisponible au lieu de répéter silencieusement l’aperçu tronqué.
    - Les images d’assistant/générées sont conservées comme références de médias gérés et resservies via des URL de médias Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien des charges utiles d’image base64 brutes dans la réponse d’historique du chat.
    - Lors du rendu de `chat.history`, Control UI supprime du texte visible de l’assistant les balises de directives en ligne uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d’accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et le rafraîchissement final de l’historique, la vue de chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique Gateway a rattrapé son retard.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit depuis la transcription durable de la session. Après les événements finaux d’outil, Control UI recharge l’historique et ne fusionne qu’une petite fin optimiste ; la limite de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement d’interface (pas d’exécution d’agent, pas de livraison de canal).
    - La barre latérale liste les sessions récentes avec une action Nouvelle session, un lien Toutes les sessions et un bouton de recherche de session qui ouvre le sélecteur complet de sessions (limité au périmètre de l’agent sélectionné, avec recherche et pagination). Le changement d’agent n’affiche que les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a encore aucune session de tableau de bord enregistrée.
    - Chaque ligne du sélecteur de sessions peut renommer, épingler ou archiver la session. Une exécution active et la session principale d’un agent ne peuvent pas être archivées. L’archivage de la session actuellement sélectionnée fait revenir Chat à la session principale de cet agent.
    - Sur les largeurs de bureau, les contrôles de chat restent sur une ligne compacte et se replient lors du défilement vers le bas de la transcription ; le défilement vers le haut, le retour en haut ou l’arrivée en bas restaure les contrôles.
    - Les messages texte seuls consécutifs en double sont rendus comme une seule bulle avec un badge de nombre. Les messages qui transportent des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion de l’en-tête du chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements de session persistants, et non des options d’envoi limitées à un seul tour.
    - Si vous envoyez un message pendant qu’une modification du sélecteur de modèle pour la même session est encore en cours d’enregistrement, le composeur attend la correction de cette session avant d’appeler `chat.send` afin que l’envoi utilise le modèle sélectionné.
    - Saisir `/new` dans Control UI crée et bascule vers la même nouvelle session de tableau de bord que Nouveau chat, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l’agent ; dans ce cas, cela réinitialise la session principale sur place. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du chat demande la vue de modèles configurée par Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation pilote le sélecteur, y compris les entrées `provider/*` qui gardent dynamiques les catalogues limités au fournisseur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via la RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque de nouveaux rapports d’utilisation de session Gateway incluent les jetons de contexte actuels, la barre d’outils du composeur de chat affiche un petit anneau d’utilisation du contexte avec le pourcentage utilisé ; le détail complet des jetons figure dans son info-bulle. L’anneau passe en style d’avertissement lorsque la pression sur le contexte est élevée et, aux niveaux de compaction recommandés, affiche un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que Gateway signale à nouveau une utilisation à jour.

  </Accordion>
  <Accordion title="Mode parole (temps réel du navigateur)">
    Le mode parole utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus un profil d’authentification par clé API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY` ; les profils OAuth OpenAI ne configurent pas la voix temps réel. Configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et les déclarations d’outils verrouillées dans le jeton par Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel backend passent par le transport relais Gateway, de sorte que les identifiants et les sockets fournisseur restent côté serveur pendant que l’audio du navigateur passe par des RPC Gateway authentifiées. L’invite de session Realtime est assemblée par Gateway ; `talk.client.create` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Le composeur de Chat inclut un bouton d’options Talk à côté du bouton de démarrage/arrêt Talk. Les options s’appliquent à la prochaine session Talk et peuvent remplacer le fournisseur, le transport, le modèle, la voix, l’effort de raisonnement, le seuil VAD, la durée de silence et le padding de préfixe. Lorsqu’une option est vide, le Gateway utilise les valeurs par défaut configurées lorsqu’elles sont disponibles, ou la valeur par défaut du fournisseur. Sélectionner le relais Gateway force le chemin de relais backend ; sélectionner WebRTC garde la session sous contrôle du client et échoue au lieu de basculer silencieusement vers le relais si le fournisseur ne peut pas créer de session navigateur.

    Dans le composeur de Chat, le contrôle Talk est le bouton en forme d’ondes à côté du bouton de dictée au microphone. Au démarrage de Talk, la ligne d’état du composeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil en temps réel consulte le modèle plus grand configuré via `talk.client.toolCall`.

    Smoke live mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie le pont WebSocket backend OpenAI, l’échange SDP WebRTC navigateur OpenAI, la configuration WebSocket navigateur Google Live à jetons contraints, et l’adaptateur navigateur de relais Gateway avec un média de microphone factice. La commande affiche uniquement l’état du fournisseur et ne journalise pas les secrets.

  </Accordion>
  <Accordion title="Arrêter et abandonner">
    - Cliquez sur **Stop** (appelle `chat.abort`).
    - Lorsqu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en file d’attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut toujours être affiché dans l’interface utilisateur.
    - Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcript lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcript puissent distinguer les fragments partiels abandonnés de la sortie de fin normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

La Control UI fournit un `manifest.webmanifest` et un service worker, ce qui permet aux navigateurs modernes de l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

Si la page affiche **Protocol mismatch** juste après une mise à jour d’OpenClaw, rouvrez d’abord le tableau de bord avec `openclaw dashboard` et forcez l’actualisation de la page. Si l’échec persiste, effacez les données du site pour l’origine du tableau de bord ou testez dans une fenêtre de navigation privée ; un ancien onglet ou un cache de service worker du navigateur peut continuer à exécuter un bundle Control UI antérieur à la mise à jour contre le Gateway plus récent.

| Surface                                               | Ce qu’elle fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » dès qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (dans le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement et utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement navigateur conservés.           |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez fixer les clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `https://openclaw.ai`)

La Control UI utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` ainsi que `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et de la méthode existante `push.test`, qui cible l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (par défaut)">
    Autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est la valeur par défaut et elle suffit généralement pour les jeux/widgets navigateur autonomes.
  </Tab>
  <Tab title="trusted">
    Ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site qui ont volontairement besoin de privilèges plus forts.
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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de Chat

Les messages de Chat groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur écran large peuvent la remplacer sans patcher le CSS fourni en définissant `gateway.controlUi.chatMessageMaxWidth` :

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
  <Tab title="Tailscale Serve intégré (préféré)">
    Gardez le Gateway sur loopback et laissez Tailscale Serve le proxifier en HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur Control UI avec identité d’appareil navigateur, ce chemin Serve vérifié évite également l’aller-retour d’appairage de l’appareil ; les navigateurs sans appareil et les connexions de rôle nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP client et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples incompatibilités en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Lier au tailnet + jeton">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Puis ouvrez :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface utilisateur (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification Control UI opérateur réussie via `gateway.auth.mode: "trusted-proxy"`
- contournement d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte gateway)

<AccordionGroup>
  <Accordion title="Comportement du bouton d’activation de l’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement un bouton d’activation de compatibilité locale :

    - Il permet aux sessions Control UI localhost de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Il ne contourne pas les vérifications d’appairage.
    - Il n’assouplit pas les exigences d’identité d’appareil distant (non-localhost).

  </Accordion>
  <Accordion title="Contournement d’urgence uniquement">
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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil Control UI et constitue une dégradation de sécurité sévère. Rétablissez rapidement le réglage après l’utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut admettre des sessions Control UI **opérateur** sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions Control UI de rôle nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Voir [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

La Control UI est fournie avec une politique `img-src` stricte : seuls les assets de **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par la Control UI s’affichent toujours.
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées dans les helpers d’avatar de la Control UI et remplacées par le logo/badge intégré, afin qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours actif et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du gateway est configurée, le point de terminaison d’avatar de la Control UI exige le même jeton gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de révéler l’identité de l’agent sur des hôtes autrement protégés.
- La Control UI elle-même transmet le jeton gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du Gateway (non recommandé sur les hôtes partagés), la route d’avatar devient également non authentifiée, comme le reste du Gateway.

## Authentification de la route multimédia de l’assistant

Lorsque l’authentification du Gateway est configurée, les aperçus de médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` nécessite l’authentification opérateur normale de Control UI. Le navigateur envoie le jeton du Gateway comme en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` à courte durée de vie limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou mot de passe actif du Gateway. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela garde le rendu multimédia normal compatible avec les éléments multimédias natifs du navigateur sans placer d’identifiants Gateway réutilisables dans des URL multimédias visibles.

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

Pointez ensuite l’interface utilisateur vers l’URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Page Control UI vide

Si le navigateur charge un tableau de bord vide et que DevTools n’affiche aucune erreur utile, une extension ou un script de contenu précoce peut avoir empêché l’application module JavaScript de s’évaluer. La page statique inclut un panneau de récupération en HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Réessayer** du panneau après avoir modifié l’environnement du navigateur, ou rechargez manuellement après ces vérifications :

- Désactivez les extensions qui s’injectent dans toutes les pages, en particulier les extensions avec des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur propre ou un autre navigateur.
- Gardez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après le changement de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

Control UI est constitué de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, mais que le Gateway s’exécute ailleurs.

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

    Authentification ponctuelle facultative (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` est stocké dans localStorage après le chargement, puis supprimé de l’URL.
    - Si vous transmettez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez en URL la valeur `gatewayUrl` afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les anciens paramètres de requête `?token=` sont encore importés une seule fois pour compatibilité, mais uniquement comme solution de repli, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements Control UI publics non-loopback doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Les chargements privés de LAN/Tailnet de même origine depuis loopback, RFC1918/link-local, `.local`, `.ts.net` ou des hôtes Tailscale CGNAT sont acceptés sans activer la solution de repli par en-tête Host.
    - Le démarrage du Gateway peut initialiser des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` depuis le bind et le port d’exécution effectifs, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de solution de repli d’origine par en-tête Host, mais il s’agit d’un mode de sécurité dangereux.

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
- [Contrôles d’intégrité](/fr/gateway/health) — surveillance de l’intégrité du Gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
