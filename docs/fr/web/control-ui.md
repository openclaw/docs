---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous voulez accéder au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface utilisateur de contrôle dans le navigateur pour le Gateway (discussion, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-05-06T07:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway fonctionne sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve quand `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance quand `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée ; les mots de passe ne sont pas persistés. L’onboarding génère généralement un jeton de Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi quand `gateway.auth.mode` vaut `"password"`.

## Association d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’association unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

**Ce que vous verrez :** "déconnecté (1008) : association requise"

<Steps>
  <Step title="Lister les demandes en attente">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approuver par identifiant de demande">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si le navigateur relance l’association avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà associé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée de niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus étendue et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes de navigateur local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut ignorer l’aller-retour d’association pour les sessions d’opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le réseau local et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc une nouvelle association.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle propre à chaque navigateur (nom d’affichage et avatar), jointe aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est ni synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique à la substitution de l’avatar de l’assistant. Les avatars d’assistant importés se superposent à l’identité résolue par le Gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement dans ce champ (comme les gateways scriptés ou les tableaux de bord personnalisés).

## Endpoint de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Cet endpoint est protégé par la même authentification de Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe de Gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement selon la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès Gateway, pas sous Apparence.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue intégré au site de documentation Mintlify est limité aux codes de langue acceptés par Mintlify. Les documentations en thaï (`th`) et en persan (`fa`) sont tout de même générées dans le dépôt de publication ; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les identifiants bruts de thème et les noms de thème par défaut comme `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du Gateway et ne sont pas synchronisés entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local ; l’effacer fait revenir le thème actif à Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et voix">
    - Discutez avec le modèle via le WS du Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique de chat demandent une fenêtre récente bornée avec des plafonds de texte par message, afin que les grandes sessions n’obligent pas le navigateur à rendre une charge utile de transcription complète avant que le chat devienne utilisable.
    - Parlez via des sessions temps réel du navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique via WebSocket, et les plugins vocaux temps réel uniquement côté backend utilisent le transport relais du Gateway. Les sessions de fournisseur détenues par le client commencent par `talk.client.create` ; les sessions relais du Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via `talk.session.appendAudio` et transfère les appels d’outils fournisseur `openclaw_agent_consult` via `talk.client.toolCall` pour la stratégie du Gateway et le modèle OpenClaw configuré plus grand.
    - Diffusez les appels d’outils + les cartes de sortie d’outil en direct dans le chat (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux : état des canaux intégrés ainsi que des canaux de plugins groupés/externes, connexion par QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Les actualisations des sondes de canal gardent l’instantané précédent visible pendant que les vérifications lentes du fournisseur se terminent, et les instantanés partiels sont étiquetés lorsqu’une sonde ou un audit dépasse son budget d’interface.
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : liste + remplacements par session du modèle, de la réflexion, du mode rapide, du mode verbeux, de la trace et du raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves : état du dreaming, bascule activer/désactiver et lecteur du Journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills : état, activation/désactivation, installation, mises à jour de clé API (`skills.*`).
    - Nœuds : liste + capacités (`node.list`).
    - Approbations exec : modifier les listes d’autorisation du Gateway ou du nœud + stratégie de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) prévalident la résolution des SecretRef actifs pour les références dans la charge utile de configuration soumise ; les références soumises actives non résolues sont rejetées avant l’écriture.
    - Schéma + rendu de formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indices d’interface correspondants, les résumés des enfants immédiats, les métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition, ainsi que les schémas de Plugin + canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est disponible que lorsque l’instantané dispose d’un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, "Réinitialiser à l’enregistrement" préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de générer à nouveau un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs de texte du formulaire pour éviter une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les temps d’actualisation/RPC de l’interface de contrôle, les temps de rendu lent du chat/de la configuration et les entrées de réactivité du navigateur pour les longues images d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du Gateway avec filtre/export (`logs.tail`).
    - Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après la reconnexion pour vérifier la version du Gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison utilise par défaut l’annonce d’un résumé. Vous pouvez passer à aucune si vous voulez des exécutions uniquement internes.
    - Les champs canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucune sont disponibles.
    - Les contrôles d’édition avancée incluent supprimer après exécution, effacer le remplacement d’agent, les options exactes/échelonnées de Cron, les remplacements du modèle/de la réflexion de l’agent et les bascules de livraison en meilleur effort.
    - La validation de formulaire est en ligne avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Solution de repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

  </Accordion>
</AccordionGroup>

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` une fois terminé.
    - Les réponses `chat.history` sont limitées en taille pour la sûreté de l’interface. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images assistant/générées sont conservées comme références de médias gérés et resservies via des URL de médias authentifiées du Gateway, afin que les rechargements ne dépendent pas de charges utiles d’image base64 brutes restant dans la réponse d’historique de chat.
    - Lors du rendu de `chat.history`, l’interface de contrôle retire du texte visible de l’assistant les balises de directives inline uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d’accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et le rafraîchissement final de l’historique, la vue de chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux dès que l’historique du Gateway se met à jour.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription de session durable. Après les événements finaux d’outils, l’interface de contrôle recharge l’historique et ne fusionne qu’une petite fin optimiste ; la frontière de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement destinées à l’interface (aucune exécution d’agent, aucune livraison de canal).
    - L’en-tête du chat affiche le filtre d’agent avant le sélecteur de session, et le sélecteur de session est limité à l’agent sélectionné. Changer d’agent n’affiche que les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles de chat restent sur une seule ligne compacte et se replient lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir au début ou atteindre le bas restaure les contrôles.
    - Les messages consécutifs dupliqués contenant uniquement du texte s’affichent comme une seule bulle avec un badge de nombre. Les messages contenant des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas repliés.
    - Les sélecteurs de modèle et de réflexion de l’en-tête du chat modifient immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d’envoi limitées à un seul tour.
    - Saisir `/new` dans l’interface de contrôle crée et bascule vers la même nouvelle session de tableau de bord que Nouveau chat. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle de chat demande la vue des modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation alimente le sélecteur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque de nouveaux rapports d’utilisation de session du Gateway indiquent une forte pression de contexte, la zone de composition du chat affiche un avis de contexte et, aux niveaux de Compaction recommandés, un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale de nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel dans le navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey`, ou configurez Google avec `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé d’API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel côté backend passent par le transport relais du Gateway, afin que les identifiants et sockets fournisseur restent côté serveur tandis que l’audio du navigateur circule via des RPC authentifiés du Gateway. L’invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Dans le compositeur de chat, la commande de conversation est le bouton à ondes à côté du bouton de dictée au microphone. Lorsque la conversation démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `talk.client.toolCall`.

    Smoke live mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie l’échange SDP WebRTC du navigateur OpenAI, la configuration WebSocket de navigateur à jeton contraint Google Live, et l’adaptateur navigateur relais du Gateway avec un média de microphone simulé. La commande affiche uniquement l’état du fournisseur et ne journalise aucun secret.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Orienter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut toujours être affiché dans l’interface.
    - Le Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcription lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les partiels abandonnés de la sortie d’achèvement normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

L’interface de contrôle inclut un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce qu’elle fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (dans le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement et utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement de navigateur conservés.        |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements de navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et de la méthode existante `push.test`, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages d’assistant peuvent afficher du contenu web hébergé inline avec le shortcode `[embed ...]`. La politique sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (par défaut)">
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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin du comportement de même origine. Pour la plupart des jeux et canevas interactifs générés par agent, `scripts` est le choix le plus sûr.
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

La valeur est validée avant d’atteindre le navigateur. Les valeurs prises en charge incluent les longueurs simples et les pourcentages comme `960px` ou `82%`, ainsi que les expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Tailscale Serve intégré (préféré)">
    Gardez le Gateway sur loopback et laissez Tailscale Serve le mandater avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Serve de l’interface de contrôle/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions d’opérateur de l’interface de contrôle avec identité d’appareil de navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions à rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limite de débit. Des nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples non-correspondances exécutées en parallèle.

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

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions à l’interface utilisateur de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de l’opérateur auprès de l’interface utilisateur de contrôle via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correction recommandée :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du Gateway)

<AccordionGroup>
  <Accordion title="Comportement de l’option d’authentification non sécurisée">
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

    - Elle permet aux sessions localhost de l’interface utilisateur de contrôle de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil distante (hors localhost).

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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface utilisateur de contrôle et constitue une forte dégradation de sécurité. Rétablissez le réglage rapidement après une utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut admettre des sessions **opérateur** de l’interface utilisateur de contrôle sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de l’interface utilisateur de contrôle avec rôle de nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

L’interface utilisateur de contrôle est fournie avec une politique `img-src` stricte : seuls les actifs de **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune récupération réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatars authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par l’interface utilisateur de contrôle s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les assistants d’avatar de l’interface utilisateur de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations arbitraires d’images distantes depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement : il est toujours actif et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du Gateway est configurée, le point de terminaison d’avatar de l’interface utilisateur de contrôle exige le même jeton de Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes autrement protégés.
- L’interface utilisateur de contrôle transmet elle-même le jeton du Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du Gateway (non recommandé sur les hôtes partagés), la route d’avatar devient également non authentifiée, comme le reste du Gateway.

## Authentification de la route des médias de l’assistant

Lorsque l’authentification du Gateway est configurée, les aperçus des médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur normale de l’interface utilisateur de contrôle. Le navigateur envoie le jeton du Gateway comme en-tête bearer lorsqu’il vérifie la disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` de courte durée limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document affichées par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou du mot de passe actif du Gateway. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela garde le rendu normal des médias compatible avec les éléments multimédias natifs du navigateur sans placer d’identifiants de Gateway réutilisables dans des URL de média visibles.

## Création de l’interface utilisateur

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Créez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (si vous voulez des URL d’actifs fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface utilisateur vers l’URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Débogage/tests : serveur de développement + Gateway distant

L’interface utilisateur de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement alors que le Gateway s’exécute ailleurs.

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
    - `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l’URL.
    - Si vous passez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez la valeur `gatewayUrl` dans l’URL afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les anciens paramètres de requête `?token=` sont toujours importés une fois pour compatibilité, mais uniquement en solution de secours, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne revient pas aux identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` est accepté uniquement dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements non-loopback de l’interface utilisateur de contrôle doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage du Gateway peut amorcer des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port effectifs d’exécution, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]`, sauf pour des tests locaux étroitement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « faire correspondre l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli sur l’origine de l’en-tête Host, mais il s’agit d’un mode de sécurité dangereux.

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
- [Contrôles de santé](/fr/gateway/health) — surveillance de la santé du Gateway
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [WebChat](/fr/web/webchat) — interface de discussion dans le navigateur
