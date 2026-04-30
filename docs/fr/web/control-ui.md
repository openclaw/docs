---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous voulez accéder au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle basée sur navigateur pour le Gateway (chat, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-30T07:55:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
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

L’authentification est fournie pendant la négociation WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve quand `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance quand `gateway.auth.mode: "trusted-proxy"`

Le panneau de paramètres du tableau de bord conserve un jeton pour la session de l’onglet de navigateur actuel et l’URL du gateway sélectionnée; les mots de passe ne sont pas conservés. L’onboarding génère généralement un jeton de gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi quand `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité destinée à empêcher les accès non autorisés.

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

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande précédente en attente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une mise à niveau d’approbation, pas comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera plus de nouvelle approbation, sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez [CLI Appareils](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes de navigateur en local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface de contrôle quand `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente l’identité de son appareil.
- Les liaisons Tailnet directes, les connexions de navigateur sur le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle vit dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas synchronisée avec d’autres appareils ni conservée côté serveur au-delà des métadonnées normales d’auteur de transcript sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même modèle local au navigateur s’applique au remplacement de l’avatar de l’assistant. Les avatars d’assistant téléversés se superposent à l’identité résolue par le gateway dans le navigateur local uniquement et ne font jamais d’aller-retour via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non-UI qui écrivent directement dans ce champ (comme les gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification gateway que le reste de la surface HTTP: les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe de gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement selon la langue de votre navigateur. Pour la remplacer ensuite, ouvrez **Vue d’ensemble -> Accès au Gateway -> Langue**. Le sélecteur de langue se trouve dans la carte Accès au Gateway, pas sous Apparence.

- Langues prises en charge: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

Les traductions de la documentation sont générées pour le même ensemble de langues non anglaises, mais le sélecteur de langue Mintlify intégré au site de documentation est limité aux codes de langue acceptés par Mintlify. La documentation en thaï (`th`) et en persan (`fa`) est toujours générée dans le dépôt de publication; elle peut ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence conserve les thèmes intégrés Claw, Knot et Dash, plus un emplacement d’import tweakcn local au navigateur. Pour importer un thème, ouvrez [thèmes tweakcn](https://tweakcn.com/themes), choisissez ou créez un thème, cliquez sur **Partager**, puis collez le lien de thème copié dans Apparence. L’importateur accepte aussi les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL d’éditeur comme `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut comme `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel. Ils ne sont pas écrits dans la configuration du gateway et ne se synchronisent pas entre les appareils. Remplacer le thème importé met à jour l’unique emplacement local; l’effacer rétablit le thème actif sur Claw si le thème importé était sélectionné.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Discussion et voix">
    - Discutez avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parlez via des sessions temps réel dans le navigateur. OpenAI utilise WebRTC direct, Google Live utilise un jeton de navigateur à usage unique contraint via WebSocket, et les plugins vocaux temps réel côté backend uniquement utilisent le transport de relais du Gateway. Le relais conserve les identifiants fournisseur sur le Gateway pendant que le navigateur diffuse le PCM du microphone via les RPC `talk.realtime.relay*` et renvoie les appels d’outil `openclaw_agent_consult` via `chat.send` pour le modèle OpenClaw configuré plus large.
    - Diffusez les appels d’outils + les cartes de sortie d’outil en direct dans Discussion (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux: état des canaux intégrés plus plugins groupés/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instances: liste de présence + actualisation (`system-presence`).
    - Sessions: liste + remplacements par session du modèle/de la réflexion/du mode rapide/du mode verbeux/de la trace/du raisonnement (`sessions.list`, `sessions.patch`).
    - Rêves: état Dreaming, bascule activer/désactiver et lecteur de journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron: lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills: état, activer/désactiver, installation, mises à jour de clés API (`skills.*`).
    - Nœuds: liste + capacités (`node.list`).
    - Approbations exec: modifier les listes d’autorisation du gateway ou des nœuds + politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) effectuent un contrôle préalable de la résolution SecretRef active pour les refs dans la charge utile de configuration soumise; les refs soumises actives non résolues sont rejetées avant l’écriture.
    - Schéma + rendu de formulaire (`config.schema` / `config.schema.lookup`, y compris le champ `title` / `description`, les indications UI correspondantes, les résumés des enfants immédiats, les métadonnées de documentation sur les nœuds objet imbriqué/joker/tableau/composition, ainsi que les schémas de plugin + canal lorsqu’ils sont disponibles); l’éditeur JSON brut n’est disponible que lorsque l’instantané dispose d’un aller-retour brut sûr.
    - Si un instantané ne peut pas effectuer un aller-retour sûr du texte brut, l’interface de contrôle force le mode Formulaire et désactive le mode Brut pour cet instantané.
    - Dans l’éditeur JSON brut, "Réinitialiser à la version enregistrée" préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de restituer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs texte de formulaire afin d’empêcher une corruption accidentelle d’objet en chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage: instantanés état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Journaux: suivi en direct des journaux de fichiers du gateway avec filtre/export (`logs.tail`).
    - Mise à jour: exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage, puis interroger `update.status` après reconnexion pour vérifier la version du gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Notes du panneau des tâches Cron">
    - Pour les tâches isolées, la livraison annonce le résumé par défaut. Vous pouvez passer à aucune si vous voulez des exécutions internes uniquement.
    - Les champs canal/cible apparaissent quand l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et aucune sont disponibles.
    - Les contrôles de modification avancés incluent la suppression après exécution, l’effacement du remplacement d’agent, les options cron exact/décalé, les remplacements du modèle/de la réflexion de l’agent et les bascules de livraison au mieux.
    - La validation de formulaire est intégrée avec des erreurs au niveau des champs; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié; s’il est omis, le Webhook est envoyé sans en-tête d’authentification.
    - Solution de repli obsolète: les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

  </Accordion>
</AccordionGroup>

## Comportement de discussion

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
    - Les téléversements de chat acceptent les images ainsi que les fichiers non vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens de pièces jointes.
    - Renvoyer avec le même `idempotencyKey` retourne `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après la fin.
    - Les réponses `chat.history` sont bornées en taille pour la sécurité de l’interface utilisateur. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images d’assistant/générées sont conservées comme références de médias gérés et servies à nouveau via des URL de médias authentifiées du Gateway, afin que les rechargements ne dépendent pas du maintien de charges utiles d’images base64 brutes dans la réponse d’historique du chat.
    - `chat.history` supprime aussi les balises de directives intégrées uniquement destinées à l’affichage du texte visible de l’assistant (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine chasse ayant fuité, et omet les entrées d’assistant dont tout le texte visible n’est que le jeton silencieux exact `NO_REPLY` / `no_reply`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue de chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique du Gateway a rattrapé son retard.
    - `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour réservées à l’interface utilisateur (pas d’exécution d’agent, pas de livraison de canal).
    - Les sélecteurs de modèle et de réflexion de l’en-tête de chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements de session persistants, pas des options d’envoi limitées à un seul tour.
    - Le sélecteur de modèle du chat demande la vue de modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation alimente le sélecteur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les rapports frais d’utilisation de session du Gateway indiquent une forte pression de contexte, la zone de composition du chat affiche un avis de contexte et, aux niveaux de compaction recommandés, un bouton de compactage qui exécute le chemin normal de compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale à nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode conversation (temps réel dans le navigateur)">
    Le mode conversation utilise un fournisseur vocal temps réel enregistré. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou configurez Google avec `talk.provider: "google"` plus `talk.providers.google.apiKey` ; la configuration du fournisseur temps réel Voice Call peut toujours être réutilisée comme solution de repli. Le navigateur ne reçoit jamais une clé API de fournisseur standard. OpenAI reçoit un secret client Realtime éphémère pour WebRTC. Google Live reçoit un jeton d’authentification Live API contraint à usage unique pour une session WebSocket de navigateur, avec les instructions et déclarations d’outils verrouillées dans le jeton par le Gateway. Les fournisseurs qui n’exposent qu’un pont temps réel côté serveur passent par le transport relais du Gateway, de sorte que les identifiants et les sockets fournisseur restent côté serveur pendant que l’audio du navigateur transite par des RPC Gateway authentifiés. L’invite de session Realtime est assemblée par le Gateway ; `talk.realtime.session` n’accepte pas de remplacements d’instructions fournis par l’appelant.

    Dans le compositeur de chat, le contrôle Conversation est le bouton en forme d’ondes à côté du bouton de dictée par microphone. Lorsque Conversation démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le modèle plus grand configuré via `chat.send`.

    Smoke test live mainteneur : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie l’échange SDP WebRTC navigateur OpenAI, la configuration WebSocket navigateur à jeton contraint Google Live, et l’adaptateur navigateur du relais Gateway avec un média de microphone simulé. La commande n’affiche que l’état des fournisseurs et ne journalise aucun secret.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Arrêter** (appelle `chat.abort`).
    - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Orienter** sur un message en file d’attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Tapez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut toujours être affiché dans l’interface utilisateur.
    - Le Gateway conserve le texte partiel abandonné de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les partiels d’abandon d’une sortie de complétion normale.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

L’interface de contrôle fournit un `manifest.webmanifest` et un service worker, afin que les navigateurs modernes puissent l’installer comme PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce qu’elle fait                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » dès qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics de notification. |
| `push/vapid-keys.json` (dans le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement et utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement de navigateur conservés.        |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation des secrets ou les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valeur par défaut : `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway limitées par portée pour enregistrer et tester les abonnements de navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` ainsi que `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour les notifications relayées) et de la méthode `push.test` existante, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages d’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`. La politique de bac à sable iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (par défaut)">
    Autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est la valeur par défaut et elle suffit généralement pour les jeux/widgets de navigateur autonomes.
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
N’utilisez `trusted` que lorsque le document intégré a réellement besoin d’un comportement de même origine. Pour la plupart des jeux et canevas interactifs générés par agent, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès tailnet (recommandé)

<Tabs>
  <Tab title="Tailscale Serve intégré (préféré)">
    Gardez le Gateway sur local loopback et laissez Tailscale Serve le relayer en HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces requêtes que lorsqu’elles atteignent le local loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur de l’interface de contrôle avec identité d’appareil navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage d’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants à secret partagé explicites même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives erronées simultanées depuis le même navigateur peuvent donc afficher `retry later` à la deuxième requête au lieu de deux simples incompatibilités en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Lier au tailnet + jeton">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez ensuite :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface utilisateur (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions de l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de l’interface de contrôle opérateur via `gateway.auth.mode: "trusted-proxy"`
- option d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement :

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

    - Elle permet aux sessions de l’interface de contrôle localhost de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil distantes (non localhost).

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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de la Control UI et constitue une grave dégradation de la sécurité. Rétablissez rapidement la configuration après une utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Note sur le proxy de confiance">
    - Une authentification par proxy de confiance réussie peut admettre des sessions **operator** de la Control UI sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de la Control UI avec rôle de nœud.
    - Les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification par proxy de confiance ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour des conseils de configuration HTTPS.

## Politique de sécurité du contenu

La Control UI est fournie avec une politique `img-src` stricte : seuls les assets de **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune requête réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’UI récupère et convertit en URL `blob:` locales.
- Les URL inline `data:image/...` s’affichent toujours (utile pour les payloads dans le protocole).
- Les URL `blob:` locales créées par la Control UI s’affichent toujours.
- Les URL d’avatars distantes émises par les métadonnées de canal sont supprimées par les helpers d’avatar de la Control UI et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne puisse pas forcer des requêtes d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement : il est toujours activé et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du gateway est configurée, l’endpoint d’avatar de la Control UI exige le même jeton de gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route assistante-média voisine). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes qui sont autrement protégés.
- La Control UI transmet elle-même le jeton de gateway sous forme d’en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification du gateway (déconseillé sur les hôtes partagés), la route d’avatar devient elle aussi non authentifiée, comme le reste du gateway.

## Construction de l’UI

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

Pointez ensuite l’UI vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/tests : serveur de développement + Gateway distant

La Control UI est composée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite localement, mais que le Gateway s’exécute ailleurs.

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
    - `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l’URL.
    - Si vous passez un endpoint complet `ws://` ou `wss://` via `gatewayUrl`, encodez la valeur `gatewayUrl` dans l’URL afin que le navigateur analyse correctement la chaîne de requête.
    - `token` doit être passé via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites via les journaux de requêtes et le Referer. Les paramètres de requête hérités `?token=` sont encore importés une fois pour compatibilité, mais seulement comme solution de repli, et sont supprimés immédiatement après le bootstrap.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’UI ne se rabat pas sur les identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements non-loopback de la Control UI doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage du Gateway peut initialiser des origines locales comme `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse et du port effectifs liés à l’exécution, mais les origines de navigateur distantes nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]`, sauf pour des tests locaux strictement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli d’origine basé sur l’en-tête Host, mais il s’agit d’un mode de sécurité dangereux.

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
- [Contrôles de santé](/fr/gateway/health) — surveillance de la santé du gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur navigateur
