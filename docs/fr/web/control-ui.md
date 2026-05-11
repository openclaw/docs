---
read_when:
    - Vous souhaitez administrer le Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface utilisateur de contrôle basée sur navigateur pour le Gateway (discussion, nœuds, configuration)
title: Interface utilisateur de contrôle
x-i18n:
    generated_at: "2026-05-11T21:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

L’interface utilisateur de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway:

- par défaut: `http://<host>:18789/`
- préfixe facultatif: définir `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (local)

Si le Gateway s’exécute sur le même ordinateur, ouvrez:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway: `openclaw gateway`.

L’authentification est fournie pendant la négociation WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur actuel et l’URL de gateway sélectionnée; les mots de passe ne sont pas persistés. L’intégration génère généralement un jeton de gateway pour l’authentification par secret partagé à la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface utilisateur de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage à usage unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

**Ce que vous verrez:** "déconnecté (1008): appairage requis"

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

Si le navigateur relance l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une mise à niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw garde l’ancienne approbation active, bloque la reconnexion plus étendue et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne demandera plus de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes depuis un navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface utilisateur de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface utilisateur de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement dans le champ (comme les gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface utilisateur de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification de gateway que le reste de la surface HTTP: les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy approuvé.

## Prise en charge des langues

L’interface utilisateur de contrôle peut se localiser au premier chargement en fonction de la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Langues prises en charge: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes utilisent l’anglais en repli.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de langue acceptés par Mintlify. La documentation en thaï (`th`) et en persan (`fa`) est toujours générée dans le dépôt de publication; elle peut ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte également les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre appareils. Remplacer le thème importé met à jour l’unique emplacement local; l’effacer fait repasser le thème actif à Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et Talk">
    - Discutez avec le modèle via le WS du Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique de chat demandent une fenêtre récente bornée avec des plafonds de texte par message afin que les grandes sessions ne forcent pas le navigateur à rendre une charge utile de transcription complète avant que le chat devienne utilisable.
    - Parlez via des sessions temps réel du navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton navigateur contraint à usage unique via WebSocket, et les plugins vocaux temps réel uniquement backend utilisent le transport relais du Gateway. Les sessions fournisseur détenues par le client démarrent avec `talk.client.create`; les sessions relais du Gateway démarrent avec `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio` et transmet les appels d’outil fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la politique du Gateway et le modèle OpenClaw configuré plus grand.
    - Diffusez les appels d’outils et les cartes de sortie d’outil en direct dans Chat (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux: état des canaux intégrés ainsi que des canaux de plugins groupés/externes, connexion par QR code et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations de sonde de canal gardent l’instantané précédent visible pendant que les vérifications lentes des fournisseurs se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface utilisateur.
    - Instances: liste de présence + actualisation (`system-presence`).
    - Sessions: liste par défaut les sessions d’agents configurés, se replie depuis les clés de session d’agent non configuré obsolètes et applique des remplacements par session pour le modèle/la réflexion/le mode rapide/le mode verbeux/la trace/le raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves: état de Dreaming, interrupteur d’activation/désactivation et lecteur du Journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations d’exécution">
    - Tâches Cron: lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills: état, activation/désactivation, installation, mises à jour de clés API (`skills.*`).
    - Nœuds: liste + capacités (`node.list`).
    - Approbations d’exécution: modifier les listes d’autorisation du gateway ou du nœud + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser les modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) prévalident la résolution des SecretRef actifs pour les références dans la charge utile de configuration soumise; les références soumises actives non résolues sont rejetées avant l’écriture.
    - Schéma + rendu de formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indications d’interface utilisateur correspondantes, les résumés des enfants immédiats, les métadonnées de documentation sur les nœuds objet imbriqué/joker/tableau/composition, ainsi que les schémas de plugin et de canal lorsqu’ils sont disponibles); l’éditeur JSON brut est disponible uniquement lorsque l’instantané dispose d’un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface utilisateur de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, "Réinitialiser à l’état enregistré" préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de rerendre un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs de texte de formulaire afin d’éviter toute corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage: instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les minutages d’actualisation/RPC de l’interface utilisateur de contrôle, les minutages lents de rendu chat/configuration et les entrées de réactivité du navigateur pour les longues images d’animation ou les longues tâches lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux: suivi en direct des journaux de fichiers du gateway avec filtre/export (`logs.tail`).
    - Mise à jour: exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après reconnexion pour vérifier la version du gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison annonce le résumé par défaut. Vous pouvez passer à aucune si vous voulez des exécutions purement internes.
    - Les champs canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison Webhook et aucune sont disponibles.
    - Les contrôles d’édition avancés incluent la suppression après exécution, l’effacement du remplacement d’agent, les options cron exactes/échelonnées, les remplacements de modèle/réflexion d’agent et les bascules de livraison en meilleur effort.
    - La validation de formulaire est intégrée avec des erreurs au niveau des champs; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié; s’il est omis, le Webhook est envoyé sans en-tête d’authentification.
    - Repli obsolète: les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

  </Accordion>
</AccordionGroup>

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via les événements `chat`.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Un nouvel envoi avec le même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après l’achèvement.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface utilisateur. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages trop volumineux par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images générées par l’assistant sont conservées sous forme de références de médias gérés et resservies via des URL de médias authentifiées du Gateway, afin que les rechargements ne dépendent pas du maintien des charges utiles d’images base64 brutes dans la réponse de l’historique du chat.
    - Lors du rendu de `chat.history`, l’interface de contrôle supprime du texte visible de l’assistant les balises de directives en ligne uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, ainsi que les blocs d’appels d’outils tronqués), et les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées de l’assistant dont tout le texte visible se limite au jeton silencieux exact `NO_REPLY` / `no_reply` ou au jeton d’accusé de réception heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue de chat conserve visibles les messages utilisateur/assistant locaux optimistes si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique du Gateway a rattrapé son retard.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription durable de la session. Après les événements finaux d’outil, l’interface de contrôle recharge l’historique et ne fusionne qu’une petite fin optimiste ; la limite de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement destinées à l’interface utilisateur (pas d’exécution d’agent, pas de livraison de canal).
    - L’en-tête du chat affiche le filtre d’agent avant le sélecteur de session, et le sélecteur de session est limité à l’agent sélectionné. Changer d’agent affiche uniquement les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles du chat restent sur une seule ligne compacte et se réduisent lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir en haut ou atteindre le bas restaure les contrôles.
    - Les messages consécutifs dupliqués contenant uniquement du texte s’affichent comme une seule bulle avec un badge de nombre. Les messages contenant des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion dans l’en-tête du chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d’envoi limitées à un seul tour.
    - Si vous envoyez un message pendant qu’une modification du sélecteur de modèle pour la même session est encore en cours d’enregistrement, le compositeur attend cette correction de session avant d’appeler `chat.send` afin que l’envoi utilise le modèle sélectionné.
    - Saisir `/new` dans l’interface de contrôle crée et active la même nouvelle session de tableau de bord que Nouveau chat, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l’agent ; dans ce cas, il réinitialise la session principale sur place. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du chat demande la vue de modèle configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation pilote le sélecteur, y compris les entrées `provider/*` qui gardent les catalogues limités au fournisseur dynamiques. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque de nouveaux rapports d’utilisation de session du Gateway incluent les jetons de contexte actuels, la zone du compositeur de chat affiche un indicateur compact d’utilisation du contexte. Il passe à un style d’avertissement lorsque la pression sur le contexte est élevée et, aux niveaux de Compaction recommandés, affiche un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale à nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel du navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` ou un profil OAuth `openai-codex` ; configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé d’API standard du fournisseur. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et les déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel côté backend passent par le transport de relais du Gateway, de sorte que les identifiants et les sockets du fournisseur restent côté serveur tandis que l’audio du navigateur circule via des RPC Gateway authentifiés. L’invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Le compositeur de chat inclut un bouton d’options de conversation à côté du bouton de démarrage/arrêt de la conversation. Les options s’appliquent à la prochaine session de conversation et peuvent remplacer le fournisseur, le transport, le modèle, la voix, l’effort de raisonnement, le seuil VAD, la durée de silence et le remplissage de préfixe. Lorsqu’une option est vide, le Gateway utilise les valeurs par défaut configurées lorsqu’elles sont disponibles, ou la valeur par défaut du fournisseur. Sélectionner le relais Gateway force le chemin de relais backend ; sélectionner WebRTC garde la session détenue par le client et échoue au lieu de revenir silencieusement au relais si le fournisseur ne peut pas créer de session navigateur.

    Dans le compositeur de chat, le contrôle de conversation est le bouton d’ondes à côté du bouton de dictée au microphone. Lorsque la conversation démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `talk.client.toolCall`.

    Test de fumée en direct pour mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie le pont WebSocket backend d’OpenAI, l’échange SDP WebRTC navigateur d’OpenAI, la configuration WebSocket navigateur à jeton contraint de Google Live, et l’adaptateur navigateur de relais Gateway avec un média de microphone simulé. La commande affiche uniquement l’état du fournisseur et ne journalise pas les secrets.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Orienter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut encore être affiché dans l’interface utilisateur.
    - Le Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcription lorsque la sortie mise en tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les éléments partiels d’abandon d’une sortie d’achèvement normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et push web

L’interface de contrôle fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce qu’il fait                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics de notification. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement du navigateur conservés.       |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous souhaitez figer les clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valeur par défaut : `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements du navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour le push adossé au relais) et de la méthode `push.test` existante, qui ciblent l’association mobile native.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de bac à sable de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement de même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de chat

Les messages de chat groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur écrans larges peuvent la remplacer sans modifier le CSS groupé en définissant `gateway.controlUi.chatMessageMaxWidth` :

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

La valeur est validée avant d’atteindre le navigateur. Les valeurs prises en charge incluent les longueurs et pourcentages simples comme `960px` ou `82%`, ainsi que les expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès Tailnet (recommandé)

<Tabs>
  <Tab title="Tailscale Serve intégré (préféré)">
    Gardez le Gateway sur local loopback et laissez Tailscale Serve le relayer avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Serve de l’interface utilisateur de contrôle/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la comparant à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur de l’interface utilisateur de contrôle avec identité d’appareil du navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’association de l’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites de secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes simultanées depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples non-correspondances en concurrence en parallèle.

    <Warning>
    L’authentification Serve sans token suppose que l’hôte du Gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par token/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Lier au tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez ensuite :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface utilisateur (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord via HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions de l’interface utilisateur de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de l’interface utilisateur de contrôle opérateur via `gateway.auth.mode: "trusted-proxy"`
- option de dernier recours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correction recommandée :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du Gateway)

<AccordionGroup>
  <Accordion title="Comportement du réglage d’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement un réglage de compatibilité locale :

    - Il permet aux sessions localhost de l’interface utilisateur de contrôle de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Il ne contourne pas les vérifications d’association.
    - Il n’assouplit pas les exigences d’identité d’appareil distantes (non-localhost).

  </Accordion>
  <Accordion title="Dernier recours uniquement">
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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface utilisateur de contrôle et constitue une dégradation sévère de la sécurité. Revenez rapidement en arrière après l’utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut admettre des sessions **opérateur** de l’interface utilisateur de contrôle sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de l’interface utilisateur de contrôle avec rôle de nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour les instructions de configuration HTTPS.

## Politique de sécurité du contenu

L’interface utilisateur de contrôle est fournie avec une politique `img-src` stricte : seuls les éléments **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune requête réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatars authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` intégrées s’affichent toujours (utile pour les charges utiles intégrées au protocole).
- Les URL `blob:` locales créées par l’interface utilisateur de contrôle s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les helpers d’avatar de l’interface utilisateur de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du Gateway est configurée, le point de terminaison d’avatar de l’interface utilisateur de contrôle exige le même token de Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité d’un agent sur des hôtes autrement protégés.
- L’interface utilisateur de contrôle transmet elle-même le token du Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du Gateway (non recommandé sur les hôtes partagés), la route d’avatar devient également non authentifiée, conformément au reste du Gateway.

## Authentification de la route de médias de l’assistant

Lorsque l’authentification du Gateway est configurée, les aperçus de médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur normale de l’interface utilisateur de contrôle. Le navigateur envoie le token du Gateway comme en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` à courte durée de vie, limité à ce chemin source exact.
- Les URL d’image, audio, vidéo et document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du token ou mot de passe actif du Gateway. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela maintient le rendu normal des médias compatible avec les éléments multimédias natifs du navigateur sans placer d’identifiants réutilisables du Gateway dans des URL de médias visibles.

## Compilation de l’interface utilisateur

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Compilez-les avec :

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

## Page blanche de l’interface utilisateur de contrôle

Si le navigateur charge un tableau de bord vide et que DevTools n’affiche aucune erreur utile, une extension ou un script de contenu précoce peut avoir empêché l’application de module JavaScript de s’évaluer. La page statique inclut un panneau de récupération en HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Réessayer** du panneau après avoir modifié l’environnement du navigateur, ou rechargez manuellement après ces vérifications :

- Désactivez les extensions qui injectent du contenu dans toutes les pages, en particulier les extensions avec des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur propre ou un autre navigateur.
- Gardez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après le changement de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

L’interface utilisateur de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, mais que le Gateway s’exécute ailleurs.

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

    Authentification unique facultative (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` est stocké dans localStorage après le chargement et retiré de l’URL.
    - Si vous transmettez un point de terminaison complet `ws://` ou `wss://` via `gatewayUrl`, encodez en URL la valeur `gatewayUrl` afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les paramètres de requête historiques `?token=` sont toujours importés une fois pour compatibilité, mais uniquement comme solution de repli, et sont supprimés immédiatement après le bootstrap.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne se rabat pas sur la configuration ni sur les identifiants d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’éviter le clickjacking.
    - Les déploiements non-loopback de l’interface utilisateur de contrôle doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage du Gateway peut initialiser des origines locales comme `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir du bind et du port d’exécution effectifs, mais les origines de navigateur distantes nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli d’origine par en-tête Host, mais il s’agit d’un mode de sécurité dangereux.

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
- [Vérifications d’état](/fr/gateway/health) — surveillance de l’état du Gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
