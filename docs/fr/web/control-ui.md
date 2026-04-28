---
read_when:
    - Vous voulez utiliser la Gateway depuis un navigateur.
    - Vous voulez un accès Tailnet sans tunnels SSH.
sidebarTitle: Control UI
summary: Interface de contrôle basée sur le navigateur pour la Gateway (chat, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-26T11:41:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Elle communique **directement avec le WebSocket de la Gateway** sur le même port.

## Ouverture rapide (locale)

Si la Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord la Gateway : `openclaw gateway`.

L’authentification est fournie pendant la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session d’onglet actuelle du navigateur et l’URL de Gateway sélectionnée ; les mots de passe ne sont pas conservés. L’intégration génère généralement un jeton Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage de l’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, la Gateway exige généralement une **approbation d’appairage unique**. Il s’agit d’une mesure de sécurité visant à empêcher les accès non autorisés.

**Ce que vous verrez :** "disconnected (1008): pairing required"

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

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/scopes/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous passez d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée de niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw garde l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de scopes.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf si vous la révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir [CLI Devices](/fr/cli/devices) pour la rotation et la révocation des jetons.

<Note>
- Les connexions directes de navigateur local loopback (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil.
- Les liaisons Tailnet directes, les connexions de navigateur en LAN et les profils de navigateur sans identité d’appareil exigent toujours une approbation explicite.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

</Note>

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle est stockée dans le navigateur, limitée au profil de navigateur actuel et n’est ni synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales de paternité du transcript sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à une valeur vide.

Le même modèle local au navigateur s’applique au remplacement d’avatar de l’assistant. Les avatars d’assistant importés superposent l’identité résolue par la gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non UI qui écrivent directement ce champ (comme les gateways scriptées ou les tableaux de bord personnalisés).

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un jeton/mot de passe Gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement en fonction de la langue de votre navigateur. Pour la remplacer plus tard, ouvrez **Overview -> Gateway Access -> Language**. Le sélecteur de langue se trouve dans la carte Gateway Access, et non dans Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions autres que l’anglais sont chargées paresseusement dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

<AccordionGroup>
  <Accordion title="Chat et Talk">
    - Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parler directement à OpenAI Realtime depuis le navigateur via WebRTC. La Gateway émet un secret client Realtime de courte durée avec `talk.realtime.session` ; le navigateur envoie l’audio du microphone directement à OpenAI et relaie les appels d’outil `openclaw_agent_consult` via `chat.send` pour le plus grand modèle OpenClaw configuré.
    - Diffuser les appels d’outil + les cartes de sortie d’outil en direct dans le chat (événements d’agent).

  </Accordion>
  <Accordion title="Canaux, instances, sessions, rêves">
    - Canaux : état des canaux intégrés et des canaux de Plugin inclus/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instances : liste de présence + actualisation (`system-presence`).
    - Sessions : liste + remplacements par session pour modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Rêves : état de Dreaming, bascule activer/désactiver et lecteur Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nœuds, approbations exec">
    - Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`).
    - Skills : état, activer/désactiver, installer, mises à jour de clé d’API (`skills.*`).
    - Nœuds : liste + limites (`node.list`).
    - Approbations exec : modifier les listes d’autorisation de la gateway ou du nœud + demander une politique pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active.
    - Les écritures incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) effectuent en amont la résolution active de SecretRef pour les références du payload de configuration soumis ; les références actives soumises non résolues sont rejetées avant écriture.
    - Rendu du schéma + du formulaire (`config.schema` / `config.schema.lookup`, y compris les champs `title` / `description`, les indications UI correspondantes, les résumés immédiats des enfants, les métadonnées de documentation sur les nœuds objet générique/array/composition imbriqués, ainsi que les schémas de Plugin + canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est disponible que lorsque l’instantané permet un aller-retour brut sûr.
    - Si un instantané ne peut pas faire un aller-retour sûr en texte brut, l’interface de contrôle force le mode Form et désactive le mode Raw pour cet instantané.
    - L’option de l’éditeur JSON brut « Réinitialiser à la version enregistrée » préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de réafficher un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut faire un aller-retour sûr.
    - Les valeurs d’objet SecretRef structurées sont affichées en lecture seule dans les entrées texte du formulaire afin d’éviter une corruption accidentelle objet-vers-chaîne.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés d’état/santé/modèles + journal des événements + appels RPC manuels (`status`, `health`, `models.list`).
    - Journaux : suivi en direct des journaux de fichiers de la gateway avec filtre/export (`logs.tail`).
    - Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage.

  </Accordion>
  <Accordion title="Notes sur le panneau des tâches Cron">
    - Pour les tâches isolées, la livraison est annoncée par défaut via un résumé. Vous pouvez passer à aucune si vous voulez des exécutions purement internes.
    - Les champs canal/cible apparaissent lorsque announce est sélectionné.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
    - Pour les tâches de session principale, les modes de livraison webhook et none sont disponibles.
    - Les contrôles de modification avancés incluent delete-after-run, clear agent override, les options cron exact/stagger, les remplacements agent model/thinking et les bascules de livraison best-effort.
    - La validation du formulaire est en ligne avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
    - Solution de secours obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à migration.

  </Accordion>
</AccordionGroup>

## Comportement du chat

<AccordionGroup>
  <Accordion title="Sémantique d’envoi et d’historique">
    - `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
    - Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après la fin.
    - Les réponses `chat.history` sont limitées en taille pour la sécurité de l’UI. Lorsque les entrées du transcript sont trop volumineuses, la Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Les images générées/par l’assistant sont persistées comme références média gérées et réservies via des URL média Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien des charges utiles d’images base64 brutes dans la réponse `chat.history`.
    - `chat.history` supprime également des textes visibles de l’assistant les balises de directive inline d’affichage uniquement (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outil en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués), ainsi que les jetons de contrôle du modèle ASCII/pleine largeur divulgués, et omet les entrées d’assistant dont tout le texte visible n’est que le jeton silencieux exact `NO_REPLY` / `no_reply`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue du chat garde visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; le transcript canonique remplace ces messages locaux une fois que l’historique Gateway est à jour.
    - `chat.inject` ajoute une note d’assistant au transcript de session et diffuse un événement `chat` pour les mises à jour UI uniquement (aucune exécution d’agent, aucun envoi de canal).
    - Les sélecteurs de modèle et de thinking de l’en-tête du chat appliquent immédiatement un patch à la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d’envoi pour un seul tour.
    - Lorsque les rapports récents d’utilisation de session Gateway montrent une forte pression de contexte, la zone du compositeur de chat affiche un avis de contexte et, aux niveaux recommandés de Compaction, un bouton de compaction qui exécute le chemin normal de Compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que la Gateway signale de nouveau une utilisation fraîche.

  </Accordion>
  <Accordion title="Mode Talk (WebRTC navigateur)">
    Le mode Talk utilise un fournisseur vocal temps réel enregistré qui prend en charge les sessions WebRTC navigateur. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou réutilisez la configuration du fournisseur temps réel Voice Call. Le navigateur ne reçoit jamais la clé d’API OpenAI standard ; il reçoit uniquement le secret client Realtime éphémère. La voix temps réel Google Live est prise en charge pour Voice Call côté backend et les ponts Google Meet, mais pas encore pour ce chemin WebRTC navigateur. Le prompt de session Realtime est assemblé par la Gateway ; `talk.realtime.session` n’accepte pas de remplacements d’instructions fournis par l’appelant.

    Dans le compositeur Chat, le contrôle Talk est le bouton en forme d’ondes à côté du bouton de dictée par microphone. Lorsque Talk démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` lorsque l’audio est connecté, ou `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le grand modèle configuré via `chat.send`.

  </Accordion>
  <Accordion title="Arrêter et interrompre">
    - Cliquez sur **Stop** (appelle `chat.abort`).
    - Lorsqu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en attente pour injecter ce suivi dans le tour en cours.
    - Saisissez `/stop` (ou des phrases autonomes d’interruption comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après interruption">
    - Lorsqu’une exécution est interrompue, le texte partiel de l’assistant peut tout de même être affiché dans l’interface.
    - La Gateway persiste le texte partiel interrompu de l’assistant dans l’historique du transcript lorsque des sorties en mémoire tampon existent.
    - Les entrées persistées incluent des métadonnées d’interruption afin que les consommateurs du transcript puissent distinguer les fragments dus à une interruption des sorties normales terminées.

  </Accordion>
</AccordionGroup>

## Installation PWA et Web Push

L’interface de contrôle inclut un `manifest.webmanifest` et un service worker, ce qui permet aux navigateurs modernes de l’installer comme PWA autonome. Web Push permet à la Gateway de réveiller la PWA installée avec des notifications, même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce qu’elle fait                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’elle est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (dans le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement, utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement du navigateur persistés.          |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque vous voulez fixer les clés (déploiements multi-hôtes, rotation de secrets ou tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut : `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway protégées par scope pour enregistrer et tester les abonnements du navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` ainsi que `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS iOS (voir [Configuration](/fr/gateway/configuration) pour les push via relais) et de la méthode existante `push.test`, qui ciblent l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne via le shortcode `[embed ...]`. La politique de sandbox de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (default)">
    Autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est la valeur par défaut et cela suffit généralement pour les jeux/widgets navigateur autonomes.
  </Tab>
  <Tab title="trusted">
    Ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents d’un même site qui ont intentionnellement besoin de privilèges plus élevés.
  </Tab>
</Tabs>

Exemple :

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
Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement same-origin. Pour la plupart des jeux générés par agent et des canvases interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues en `http(s)` restent bloquées par défaut. Si vous voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

<Tabs>
  <Tab title="Tailscale Serve intégré (préféré)">
    Gardez la Gateway sur loopback et laissez Tailscale Serve la proxifier en HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez :

    - `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

    Par défaut, les requêtes Serve vers l’interface de contrôle/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la comparant à l’en-tête, et n’accepte cela que lorsque la requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions opérateur de l’interface de contrôle avec identité d’appareil du navigateur, ce chemin Serve vérifié évite également l’aller-retour d’appairage de l’appareil ; les navigateurs sans appareil et les connexions avec rôle de nœud suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé, même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin asynchrone d’identité Serve, les tentatives d’authentification échouées pour la même IP cliente et le même scope d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher `retry later` à la deuxième requête au lieu de deux simples non-correspondances en parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte de la gateway est approuvé. Si du code local non approuvé peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.
    </Warning>

  </Tab>
  <Tab title="Lier à tailnet + jeton">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez ensuite :

    - `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

    Collez le secret partagé correspondant dans les paramètres de l’interface (envoyé comme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord via HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions à l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisée localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie d’opérateur de l’interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- mode break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte de la gateway)

<AccordionGroup>
  <Accordion title="Comportement de la bascule d’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement une bascule locale de compatibilité :

    - Elle permet aux sessions locales localhost de l’interface de contrôle de continuer sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil pour les accès distants (non localhost).

  </Accordion>
  <Accordion title="Mode break-glass uniquement">
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
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface de contrôle et constitue une forte régression de sécurité. Revenez rapidement en arrière après un usage d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Remarque sur le proxy de confiance">
    - Une authentification trusted-proxy réussie peut admettre des sessions **opérateur** de l’interface de contrôle sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de l’interface de contrôle avec rôle de nœud.
    - Les proxies inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Voir [Tailscale](/fr/gateway/tailscale) pour les recommandations de configuration HTTPS.

## Politique de sécurité du contenu

L’interface de contrôle est fournie avec une politique `img-src` stricte : seules les ressources **de même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisées. Les URL d’images distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et ne déclenchent aucune récupération réseau.

Concrètement :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’interface récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles in-protocol).
- Les URL `blob:` locales créées par l’interface de contrôle s’affichent toujours.
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées par les helpers d’avatar de l’interface de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations arbitraires d’images distantes depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement : il est toujours activé et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification Gateway est configurée, le point de terminaison d’avatar de l’interface de contrôle exige le même jeton Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route sœur des médias de l’assistant). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes autrement protégés.
- L’interface de contrôle elle-même transmet le jeton Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification Gateway (déconseillé sur des hôtes partagés), la route d’avatar devient également non authentifiée, conformément au reste de la gateway.

## Construction de l’interface

La Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distante

L’interface de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite en local mais que la Gateway s’exécute ailleurs.

<Steps>
  <Step title="Démarrer le serveur de développement de l’interface">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Ouvrir avec gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Authentification unique facultative (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Remarques">
    - `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l’URL.
    - `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et via Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais seulement comme solution de secours, puis supprimés immédiatement après l’amorçage.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface ne revient pas aux identifiants de configuration ou d’environnement. Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
    - Utilisez `wss://` lorsque la Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` n’est accepté que dans une fenêtre de niveau supérieur (non intégrée) afin d’empêcher le clickjacking.
    - Les déploiements distants de l’interface de contrôle hors loopback doivent définir explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Cela inclut les configurations de développement distantes.
    - Le démarrage de la Gateway peut préremplir des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de la liaison d’exécution effective et du port, mais les origines de navigateur distantes nécessitent toujours des entrées explicites.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux étroitement contrôlés. Cela signifie autoriser toute origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de secours d’origine basé sur l’en-tête Host, mais c’est un mode de sécurité dangereux.

  </Accordion>
</AccordionGroup>

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration pour l’accès distant : [Accès distant](/fr/gateway/remote).

## Lié

- [Tableau de bord](/fr/web/dashboard) — tableau de bord de la gateway
- [Health Checks](/fr/gateway/health) — surveillance de l’état de la gateway
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
