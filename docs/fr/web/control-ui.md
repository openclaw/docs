---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle basée sur le navigateur pour le Gateway (chat, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-05-05T06:19:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

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

Le panneau des paramètres du tableau de bord conserve un jeton pour la session d’onglet de navigateur actuelle et l’URL de gateway sélectionnée ; les mots de passe ne sont pas persistés. L’onboarding génère généralement un jeton de gateway pour l’authentification par secret partagé à la première connexion, mais l’authentification par mot de passe fonctionne aussi quand `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité pour empêcher les accès non autorisés.

**Ce que vous verrez :** "disconnected (1008): pairing required"

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

Si le navigateur retente l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une mise à niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouveau jeu de portées.

Une fois approuvé, l’appareil est mémorisé et ne demandera plus de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes depuis un navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions d’opérateur de l’interface de contrôle quand `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) jointe aux messages sortants pour l’attribution dans les sessions partagées. Elle vit dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le gateway uniquement dans le navigateur local et ne font jamais d’aller-retour via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement le champ (comme des gateways scriptés ou des tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification de gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge linguistique

L’interface de contrôle peut se localiser au premier chargement selon la locale de votre navigateur. Pour la modifier plus tard, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de locale se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Locales prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées paresseusement dans le navigateur.
- La locale sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites suivantes.
- Les clés de traduction manquantes se rabattent sur l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de locales non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de locale acceptés par Mintlify. Les docs en thaï (`th`) et en persan (`fa`) sont toujours générées dans le dépôt de publication ; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, ainsi qu’un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local ; l’effacer rebascule le thème actif sur Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et conversation vocale">
    - Discuter avec le modèle via le WS du Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parler via des sessions temps réel dans le navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur contraint à usage unique sur WebSocket, et les plugins de voix temps réel côté backend uniquement utilisent le transport relais du Gateway. Le relais conserve les identifiants du fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via les RPC `talk.realtime.relay*` et renvoie les appels d’outil `openclaw_agent_consult` via `chat.send` pour le modèle OpenClaw configuré plus grand.
    - Diffuser les appels d’outils + les cartes de sortie d’outil en direct dans Chat (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux : état des canaux intégrés ainsi que des canaux de plugins groupés/externes, connexion par QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : liste + remplacements par session pour modèle/thinking/rapide/verbeux/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Rêves : état de dreaming, bouton activer/désactiver et lecteur de journal Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron : liste/ajout/modification/exécution/activation/désactivation + historique d’exécution (`cron.*`).
    - Skills : état, activation/désactivation, installation, mises à jour de clés API (`skills.*`).
    - Nœuds : liste + capacités (`node.list`).
    - Approbations exec : modifier les listes d’autorisation du gateway ou des nœuds + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) pré-vérifient la résolution active des SecretRef pour les refs présentes dans la charge utile de configuration soumise ; les refs actives soumises non résolues sont rejetées avant l’écriture.
    - Rendu du schéma + formulaire (`config.schema` / `config.schema.lookup`, incluant les champs `title` / `description`, les indices UI correspondants, les résumés d’enfants immédiats, les métadonnées de docs sur les nœuds objet imbriqué/joker/tableau/composition, ainsi que les schémas de plugin + canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est disponible que lorsque l’instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas faire un aller-retour de texte brut en toute sécurité, l’interface de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Le bouton "Reset to saved" de l’éditeur JSON brut préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de restituer un instantané aplati ; les modifications externes survivent donc à une réinitialisation quand l’instantané peut faire un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs de texte de formulaire afin d’éviter une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les timings d’actualisation/RPC de l’interface de contrôle ainsi que les entrées de réactivité du navigateur pour les longues images d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du gateway avec filtre/export (`logs.tail`).
    - Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après la reconnexion pour vérifier la version du gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison utilise par défaut l’annonce du résumé. Vous pouvez choisir aucune si vous voulez des exécutions uniquement internes.
    - Les champs canal/cible apparaissent quand l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucune sont disponibles.
    - Les contrôles de modification avancés incluent supprimer après exécution, effacer le remplacement d’agent, options cron exact/stagger, remplacements du modèle/thinking de l’agent et bascules de livraison au mieux.
    - La validation du formulaire est intégrée avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Solution de repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent toujours utiliser `cron.webhook` jusqu’à migration.

  </Accordion>
</AccordionGroup>

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Un nouvel envoi avec le même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` une fois terminé.
    - Les réponses de `chat.history` sont limitées en taille pour la sécurité de l’interface utilisateur. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images de l’assistant/générées sont conservées comme références de médias gérés et renvoyées via des URL média authentifiées du Gateway, de sorte que les rechargements ne dépendent pas de la présence de charges utiles d’image base64 brutes dans la réponse d’historique du chat.
    - Lors du rendu de `chat.history`, l’interface Control UI supprime du texte visible de l’assistant les balises de directives en ligne uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués, et omet les entrées de l’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply` ou le jeton d’accusé de réception Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue de chat garde visibles les messages utilisateur/assistant locaux optimistes si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique du Gateway est à jour.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription durable de session. Après les événements finaux d’outil, l’interface Control UI recharge l’historique et fusionne seulement une petite fin optimiste ; la limite de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement destinées à l’interface utilisateur (aucune exécution d’agent, aucune livraison de canal).
    - L’en-tête du chat affiche le filtre d’agent avant le sélecteur de session, et le sélecteur de session est limité à l’agent sélectionné. Changer d’agent affiche uniquement les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles de chat restent sur une seule ligne compacte et se replient lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir en haut ou atteindre le bas restaure les contrôles.
    - Les messages consécutifs en double contenant uniquement du texte sont rendus comme une seule bulle avec un badge de compteur. Les messages qui contiennent des images, des pièces jointes, une sortie d’outil ou des aperçus de canevas ne sont pas regroupés.
    - Les sélecteurs de modèle et de réflexion dans l’en-tête du chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, pas des options d’envoi limitées à un seul tour.
    - Saisir `/new` dans l’interface Control UI crée et sélectionne la même nouvelle session de tableau de bord que New Chat. Saisir `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du chat demande la vue de modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation pilote le sélecteur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs avec une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les rapports d’utilisation de session frais du Gateway indiquent une forte pression de contexte, la zone du compositeur de chat affiche un avis de contexte et, aux niveaux de compaction recommandés, un bouton compact qui exécute le chemin normal de compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale de nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel dans le navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou configurez Google avec `talk.provider: "google"` plus `talk.providers.google.apiKey` ; la configuration de fournisseur temps réel Voice Call peut toujours être réutilisée comme solution de repli. Le navigateur ne reçoit jamais de clé d’API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel côté serveur passent par le transport relais du Gateway, de sorte que les identifiants et les sockets fournisseur restent côté serveur tandis que l’audio du navigateur transite par des RPC authentifiés du Gateway. Le prompt de session Realtime est assemblé par le Gateway ; `talk.realtime.session` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Dans le compositeur de chat, le contrôle Conversation est le bouton à ondes à côté du bouton de dictée au microphone. Lorsque Conversation démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `chat.send`.

    Smoke test en direct pour mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie l’échange SDP WebRTC du navigateur OpenAI, la configuration WebSocket de navigateur avec jeton contraint Google Live, et l’adaptateur navigateur de relais Gateway avec de faux médias de microphone. La commande affiche uniquement l’état du fournisseur et ne journalise aucun secret.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Stop** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en file d’attente pour injecter ce suivi dans le tour en cours.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut toujours être affiché dans l’interface utilisateur.
    - Le Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les fragments partiels abandonnés de la sortie de complétion normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

L’interface Control UI fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce que cela fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent "Install app" une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement, utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement de navigateur persistés.        |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation de secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `mailto:openclaw@localhost`)

L’interface Control UI utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements de navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais iOS APNS (voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et de la méthode `push.test` existante, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de sandbox iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts à l’intérieur des intégrations hébergées.
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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.
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

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gardez le Gateway sur local loopback et laissez Tailscale Serve le proxifier en HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles arrivent sur local loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur Control UI avec identité d’appareil de navigateur, ce chemin Serve vérifié saute aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions de rôle nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes simultanées depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples incompatibilités en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’UI (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions de l’UI de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de l’opérateur dans l’UI de contrôle via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du gateway)

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

    - Elle permet aux sessions localhost de l’UI de contrôle de continuer sans identité d’appareil dans les contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil distant (non-localhost).

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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’UI de contrôle et constitue une dégradation de sécurité majeure. Rétablissez rapidement la configuration après une utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut autoriser des sessions **opérateur** de l’UI de contrôle sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de l’UI de contrôle avec rôle de nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

L’UI de contrôle est fournie avec une politique `img-src` stricte : seuls les éléments **same-origin**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune récupération réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatars authentifiées que l’UI récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles intégrées au protocole).
- Les URL `blob:` locales créées par l’UI de contrôle s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les assistants d’avatar de l’UI de contrôle et remplacées par le logo/badge intégré ; ainsi, un canal compromis ou malveillant ne peut pas forcer des récupérations arbitraires d’images distantes depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du gateway est configurée, le point de terminaison d’avatar de l’UI de contrôle exige le même jeton de gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route sœur des médias d’assistant). Cela empêche la route d’avatar de divulguer l’identité d’un agent sur des hôtes qui sont autrement protégés.
- L’UI de contrôle elle-même transmet le jeton de gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du gateway (déconseillé sur les hôtes partagés), la route d’avatar devient elle aussi non authentifiée, conformément au reste du gateway.

## Authentification de la route des médias d’assistant

Lorsque l’authentification du gateway est configurée, les aperçus de médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur normale de l’UI de contrôle. Le navigateur envoie le jeton de gateway comme en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` de courte durée limité à ce chemin source exact.
- Les URL d’images, d’audio, de vidéo et de documents rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou mot de passe de gateway actif. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela maintient la compatibilité du rendu normal des médias avec les éléments multimédias natifs du navigateur, sans placer d’identifiants réutilisables du gateway dans des URL de médias visibles.

## Construire l’UI

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

Pointez ensuite l’UI vers votre URL WS de Gateway (par exemple `ws://127.0.0.1:18789`).

## Débogage/tests : serveur de développement + Gateway distant

L’UI de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, tandis que le Gateway s’exécute ailleurs.

<Steps>
  <Step title="Démarrer le serveur de développement de l’UI">
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
    - Si vous transmettez un point de terminaison complet `ws://` ou `wss://` via `gatewayUrl`, encodez en URL la valeur de `gatewayUrl` afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les anciens paramètres de requête `?token=` sont toujours importés une fois pour compatibilité, mais uniquement comme solution de secours, et sont supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’UI ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements non-loopback de l’UI de contrôle doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage du Gateway peut initialiser des origines locales comme `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir du bind et du port effectifs à l’exécution, mais les origines de navigateur distantes nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]`, sauf pour des tests locaux très contrôlés. Cela signifie autoriser toute origine de navigateur, et non « faire correspondre l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli d’origine basé sur l’en-tête Host, mais c’est un mode de sécurité dangereux.

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

- [Tableau de bord](/fr/web/dashboard) — tableau de bord du gateway
- [Vérifications d’état](/fr/gateway/health) — surveillance de l’état du gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de discussion basée sur le navigateur
