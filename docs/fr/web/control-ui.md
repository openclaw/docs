---
read_when:
    - Vous voulez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle dans le navigateur pour le Gateway (discussion, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-05-04T09:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

L’interface utilisateur de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway:

- par défaut: `http://<host>:18789/`
- préfixe facultatif: définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (locale)

Si le Gateway est en cours d’exécution sur le même ordinateur, ouvrez:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway: `openclaw gateway`.

L’authentification est fournie pendant la négociation WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée; les mots de passe ne sont pas conservés. L’onboarding génère généralement un jeton de Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface utilisateur de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

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

Si le navigateur retente l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus étendue et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes depuis un navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface utilisateur de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface utilisateur de contrôle prend en charge une identité personnelle propre à chaque navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas synchronisée avec d’autres appareils ni conservée côté serveur au-delà des métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le gateway uniquement dans le navigateur local et ne transitent jamais par `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non UI qui écrivent directement dans ce champ (par exemple les gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface utilisateur de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification de gateway que le reste de la surface HTTP: les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface utilisateur de contrôle peut se localiser au premier chargement selon la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Vue d’ensemble -> Accès Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès Gateway, pas sous Apparence.

- Langues prises en charge: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions autres que l’anglais sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites ultérieures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de langue acceptés par Mintlify. La documentation en thaï (`th`) et en persan (`fa`) est tout de même générée dans le dépôt de publication; elle peut ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, plus un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [l’éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien du thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut tels que `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local; l’effacer rétablit le thème actif sur Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et parole">
    - Discutez avec le modèle via le WS du Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parlez au moyen de sessions temps réel dans le navigateur. OpenAI utilise WebRTC directement, Google Live utilise un jeton de navigateur à usage unique contraint via WebSocket, et les Plugins vocaux temps réel uniquement backend utilisent le transport relais du Gateway. Le relais conserve les identifiants fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via les RPC `talk.realtime.relay*` et renvoie les appels d’outil `openclaw_agent_consult` via `chat.send` pour le plus grand modèle OpenClaw configuré.
    - Diffusez les appels d’outil + les cartes de sortie d’outil en direct dans Chat (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux: statut des canaux intégrés et des canaux Plugin groupés/externes, connexion par QR code et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instances: liste de présence + actualisation (`system-presence`).
    - Sessions: liste + remplacements par session du modèle, de la réflexion, du mode rapide, du mode verbeux, de la trace et du raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves: statut Dreaming, bascule d’activation/désactivation et lecteur de journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron: lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills: statut, activer/désactiver, installer, mises à jour de clé d’API (`skills.*`).
    - Nœuds: liste + capacités (`node.list`).
    - Approbations exec: modifier les listes d’autorisation du gateway ou des nœuds + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) effectuent une prévalidation de la résolution des SecretRef actifs pour les références présentes dans la charge utile de configuration soumise; les références actives soumises non résolues sont rejetées avant l’écriture.
    - Schéma + rendu de formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indices d’interface correspondants, les résumés d’enfants immédiats, les métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition, ainsi que les schémas Plugin + canal lorsqu’ils sont disponibles); l’éditeur JSON brut n’est disponible que lorsque l’instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface utilisateur de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, "Réinitialiser à l’enregistrement" préserve la forme rédigée en brut (formatage, commentaires, disposition `$include`) au lieu de restituer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs texte du formulaire afin d’éviter toute corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage: instantanés de statut/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal d’événements inclut les temps d’actualisation/RPC de l’interface utilisateur de contrôle ainsi que les entrées de réactivité du navigateur pour les longues images d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux: suivi en direct des journaux de fichiers du gateway avec filtre/export (`logs.tail`).
    - Mise à jour: exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après la reconnexion pour vérifier la version du gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la diffusion est par défaut l’annonce d’un résumé. Vous pouvez passer à aucune si vous voulez des exécutions purement internes.
    - Les champs canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de diffusion webhook et aucune sont disponibles.
    - Les contrôles d’édition avancés incluent suppression après exécution, effacer le remplacement d’agent, options cron exactes/échelonnées, remplacements du modèle/de la réflexion de l’agent, et bascules de diffusion au mieux.
    - La validation du formulaire est intégrée avec des erreurs au niveau des champs; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton porteur dédié; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Repli obsolète: les anciennes tâches stockées avec `notify: true` peuvent toujours utiliser `cron.webhook` jusqu’à migration.

  </Accordion>
</AccordionGroup>

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via les événements `chat`.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Un renvoi avec le même `idempotencyKey` retourne `{ status: "in_flight" }` pendant l’exécution, et `{ status: "ok" }` après l’achèvement.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface utilisateur. Quand les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images de l’assistant/générées sont conservées comme références de médias gérés et resservies via des URL de médias authentifiées du Gateway, afin que les rechargements ne dépendent pas du maintien de charges utiles d’images brutes en base64 dans la réponse d’historique du chat.
    - `chat.history` supprime aussi du texte visible de l’assistant les balises de directives inline uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et les blocs d’appels d’outils tronqués), ainsi que les tokens de contrôle de modèle ASCII/pleine chasse qui ont fuité, et omet les entrées de l’assistant dont tout le texte visible est uniquement le token silencieux exact `NO_REPLY` / `no_reply`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue de chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique du Gateway a rattrapé son retard.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription durable de la session. Après les événements finaux d’outils, l’interface de contrôle recharge l’historique et ne fusionne qu’une petite queue optimiste ; la limite de transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note de l’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement destinées à l’interface utilisateur (aucune exécution d’agent, aucune livraison de canal).
    - L’en-tête du chat affiche le filtre d’agent avant le sélecteur de session, et le sélecteur de session est limité à l’agent sélectionné. Changer d’agent affiche uniquement les sessions liées à cet agent et revient à la session principale de cet agent lorsqu’il n’a pas encore de sessions de tableau de bord enregistrées.
    - Sur les largeurs de bureau, les contrôles de chat restent sur une ligne compacte et se replient lors du défilement vers le bas de la transcription ; faire défiler vers le haut, revenir au début ou atteindre le bas restaure les contrôles.
    - Les messages consécutifs dupliqués contenant uniquement du texte sont rendus comme une seule bulle avec un badge de nombre. Les messages qui contiennent des images, des pièces jointes, une sortie d’outil ou des aperçus de canvas ne sont pas regroupés.
    - Les sélecteurs de modèle et de raisonnement de l’en-tête du chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, pas des options d’envoi limitées à un seul tour.
    - Saisir `/new` dans l’interface de contrôle crée et bascule vers la même nouvelle session de tableau de bord que Nouveau chat. Saisir `/reset` conserve la réinitialisation explicite en place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du chat demande la vue de modèle configurée du Gateway. Si `agents.defaults.models` est présent, cette liste autorisée pilote le sélecteur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs avec une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Quand les rapports récents d’utilisation de session du Gateway indiquent une forte pression de contexte, la zone du composeur de chat affiche un avis de contexte et, aux niveaux de Compaction recommandés, un bouton compact qui exécute le chemin normal de Compaction de session. Les instantanés de tokens périmés sont masqués jusqu’à ce que le Gateway signale à nouveau une utilisation récente.

  </Accordion>
  <Accordion title="Mode conversation (temps réel du navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou configurez Google avec `talk.provider: "google"` plus `talk.providers.google.apiKey` ; la configuration du fournisseur temps réel Voice Call peut toujours être réutilisée comme solution de repli. Le navigateur ne reçoit jamais de clé API standard de fournisseur. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un token d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le token par le Gateway. Les fournisseurs qui exposent uniquement un pont temps réel backend passent par le transport relais du Gateway, afin que les identifiants et les sockets fournisseur restent côté serveur pendant que l’audio du navigateur transite par des RPC authentifiés du Gateway. Le prompt de session Realtime est assemblé par le Gateway ; `talk.realtime.session` n’accepte pas les remplacements d’instructions fournis par l’appelant.

    Dans le composeur de chat, le contrôle de conversation est le bouton en forme d’ondes à côté du bouton de dictée au microphone. Quand la conversation démarre, la ligne d’état du composeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `chat.send`.

    Smoke live mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie l’échange SDP WebRTC navigateur d’OpenAI, la configuration WebSocket navigateur à token contraint Google Live, et l’adaptateur navigateur de relais Gateway avec un média de microphone factice. La commande imprime uniquement l’état du fournisseur et ne journalise aucun secret.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Orienter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours.
    - Saisissez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Quand une exécution est abandonnée, le texte partiel de l’assistant peut encore être affiché dans l’interface utilisateur.
    - Le Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les fragments partiels d’abandon de la sortie d’achèvement normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

L’interface de contrôle fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce que cela fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnements navigateur persistés.          |

Remplacez la paire de clés VAPID via les variables d’environnement sur le processus Gateway lorsque vous voulez épingler des clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et de la méthode `push.test` existante, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé inline avec le shortcode `[embed ...]`. La stratégie sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement de même origine. Pour la plupart des jeux générés par agent et des canvas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de chat

Les messages de chat groupés utilisent une largeur maximale lisible par défaut. Les déploiements sur écrans larges peuvent la remplacer sans corriger le CSS groupé en définissant `gateway.controlUi.chatMessageMaxWidth` :

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
    Gardez le Gateway sur local loopback et laissez Tailscale Serve le proxyfier avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le local loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur de l’interface de contrôle avec identité d’appareil navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête au lieu de deux simples non-correspondances en concurrence parallèle.

    <Warning>
    L’authentification Serve sans token suppose que l’hôte gateway est approuvé. Si du code local non approuvé peut s’exécuter sur cet hôte, exigez une authentification par token/mot de passe.
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

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions à Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification Control UI opérateur réussie via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correction recommandée :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du gateway)

<AccordionGroup>
  <Accordion title="Comportement du commutateur d’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement un commutateur de compatibilité locale :

    - Il permet aux sessions Control UI localhost de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Il ne contourne pas les vérifications d’appairage.
    - Il n’assouplit pas les exigences d’identité d’appareil distant (non-localhost).

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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de Control UI et constitue une forte dégradation de la sécurité. Rétablissez rapidement la configuration après une utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut autoriser des sessions Control UI **opérateur** sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions Control UI avec rôle de node.
    - Les proxies inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

Control UI est livré avec une politique `img-src` stricte : seuls les éléments **same-origin**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’interface utilisateur récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles intégrées au protocole).
- Les URL `blob:` locales créées par Control UI s’affichent toujours.
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées par les assistants d’avatar de Control UI et remplacées par le logo/badge intégré, afin qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement : il est toujours activé et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification Gateway est configurée, le point de terminaison d’avatar de Control UI exige le même jeton Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes par ailleurs protégés.
- Control UI transmet lui-même le jeton Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification Gateway (non recommandé sur les hôtes partagés), la route d’avatar devient également non authentifiée, comme le reste du Gateway.

## Authentification de la route média de l’assistant

Lorsque l’authentification Gateway est configurée, les aperçus de médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur Control UI normale. Le navigateur envoie le jeton Gateway comme en-tête bearer lors de la vérification de disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` de courte durée, limité à ce chemin source exact.
- Les URL d’image, d’audio, de vidéo et de document rendues par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou du mot de passe Gateway actif. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela permet au rendu média normal de rester compatible avec les éléments multimédias natifs du navigateur sans placer d’identifiants Gateway réutilisables dans des URL média visibles.

## Construire l’interface utilisateur

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL d’assets fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface utilisateur vers votre URL WS du Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/tests : serveur de développement + Gateway distant

Control UI est composé de fichiers statiques ; la cible WebSocket est configurable et peut différer de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement alors que le Gateway s’exécute ailleurs.

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
    - Si vous transmettez un point de terminaison complet `ws://` ou `wss://` via `gatewayUrl`, encodez en URL la valeur de `gatewayUrl` afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et le Referer. Les paramètres de requête hérités `?token=` sont toujours importés une fois pour compatibilité, mais uniquement comme solution de repli, et sont supprimés immédiatement après le bootstrap.
    - `password` est conservé en mémoire uniquement.
    - Lorsque `gatewayUrl` est défini, l’interface utilisateur ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements Control UI non-loopback doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage du Gateway peut préremplir des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port effectifs liés à l’exécution, mais les origines de navigateurs distants nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser toute origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
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

- [Tableau de bord](/fr/web/dashboard) — tableau de bord Gateway
- [Contrôles de santé](/fr/gateway/health) — surveillance de l’état du gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
