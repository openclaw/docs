---
read_when:
    - Configuration initiale d’OpenClaw
    - Recherche de modèles de configuration courants
    - Accéder à des sections de configuration spécifiques
summary: 'Présentation de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-07-12T15:21:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18717d03bb923d90725b263e064f932ac30006d21f4b1b1bd98a4e39f1c92cff
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`. Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres.

Le chemin de configuration actif doit désigner un fichier ordinaire. Les écritures effectuées par OpenClaw le remplacent de manière atomique (par renommage vers le chemin), de sorte qu’un fichier `openclaw.json` sous forme de lien symbolique voit sa cible remplacée au lieu d’être modifiée directement — évitez les configurations reposant sur des liens symboliques. Si vous conservez la configuration en dehors du répertoire d’état par défaut, faites pointer `OPENCLAW_CONFIG_PATH` directement vers le fichier réel.

Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, les outils, le bac à sable ou l’automatisation (cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’interface utilisateur

Consultez la [référence complète](/fr/gateway/configuration-reference) pour connaître tous les champs disponibles.

Les agents et les automatisations doivent utiliser `config.schema.lookup` pour obtenir la
documentation exacte de chaque champ avant de modifier la configuration. Utilisez cette page pour des conseils axés sur les tâches et
la [référence de configuration](/fr/gateway/configuration-reference) pour une vue d’ensemble
des champs et des valeurs par défaut.

<Tip>
**Vous découvrez la configuration ?** Commencez par `openclaw onboard` pour une configuration interactive, ou consultez le guide des [exemples de configuration](/fr/gateway/configuration-examples) pour des configurations complètes prêtes à copier-coller.
</Tip>

## Configuration minimale

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modification de la configuration

<Tabs>
  <Tab title="Assistant interactif">
    ```bash
    openclaw onboard       # processus d’intégration complet
    openclaw configure     # assistant de configuration
    ```
  </Tab>
  <Tab title="CLI (commandes sur une ligne)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interface de contrôle">
    Ouvrez [http://127.0.0.1:18789](http://127.0.0.1:18789) et utilisez l’onglet **Configuration**.
    L’interface de contrôle génère un formulaire à partir du schéma de configuration actif, y compris les métadonnées
    documentaires `title` / `description` des champs ainsi que les schémas des plugins et des canaux lorsqu’ils
    sont disponibles, avec un éditeur **JSON brut** comme solution de repli. Pour les interfaces
    d’exploration détaillée et les autres outils, le Gateway expose également `config.schema.lookup` afin de
    récupérer un nœud de schéma limité à un chemin ainsi que les résumés de ses enfants immédiats.
  </Tab>
  <Tab title="Modification directe">
    Modifiez directement `~/.openclaw/openclaw.json`. Le Gateway surveille le fichier et applique automatiquement les modifications (voir le [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw accepte uniquement les configurations qui correspondent entièrement au schéma. Les clés inconnues, les types mal formés ou les valeurs non valides empêchent le Gateway de **démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent joindre des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le schéma JSON canonique utilisé par l’interface de contrôle
et la validation. `config.schema.lookup` récupère un seul nœud limité à un chemin ainsi que
les résumés de ses enfants pour les outils d’exploration détaillée. Les métadonnées documentaires
`title`/`description` des champs sont propagées dans les objets imbriqués, les caractères génériques (`*`),
les éléments de tableau (`[]`) et les branches `anyOf`/`oneOf`/`allOf`. Les schémas d’exécution
des plugins et des canaux sont fusionnés lorsque le registre des manifestes est chargé.

En cas d’échec de la validation :

- Le Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour afficher les problèmes exacts
- Exécutez `openclaw doctor --fix` (`--repair` est le même indicateur ; `--yes` ignore les invites) pour appliquer les corrections

Le Gateway conserve une copie fiable de la dernière configuration valide après chaque démarrage réussi,
mais le démarrage et le rechargement à chaud ne la restaurent pas automatiquement — seul `openclaw doctor --fix`
le fait. Si `openclaw.json` échoue à la validation (y compris à la validation propre à un plugin), le démarrage
du Gateway échoue ou le rechargement est ignoré, et l’environnement d’exécution actuel conserve la dernière
configuration acceptée. Une écriture rejetée est également enregistrée sous `<path>.rejected.<timestamp>` pour examen.
Le Gateway bloque les écritures qui semblent écraser accidentellement la configuration — suppression de `gateway.mode`,
perte du bloc `meta` ou réduction de plus de moitié de la taille du fichier — sauf si l’écriture
autorise explicitement les modifications destructrices. La promotion comme dernière configuration valide est ignorée lorsqu’un
candidat contient un espace réservé de secret masqué tel que `***` ou `[redacted]`.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Consultez la page dédiée au canal pour connaître les étapes de configuration :

    - [Discord](/fr/channels/discord) - `channels.discord`
    - [Feishu](/fr/channels/feishu) - `channels.feishu`
    - [Google Chat](/fr/channels/googlechat) - `channels.googlechat`
    - [iMessage](/fr/channels/imessage) - `channels.imessage`
    - [Mattermost](/fr/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/fr/channels/msteams) - `channels.msteams`
    - [Signal](/fr/channels/signal) - `channels.signal`
    - [Slack](/fr/channels/slack) - `channels.slack`
    - [Telegram](/fr/channels/telegram) - `channels.telegram`
    - [WhatsApp](/fr/channels/whatsapp) - `channels.whatsapp`

    Tous les canaux partagent le même modèle de politique pour les messages privés :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // uniquement pour allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer les modèles">
    Définissez le modèle principal et les modèles de secours facultatifs :

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` définit le catalogue de modèles et sert de liste d’autorisation pour `/model` ; les entrées `provider/*` limitent `/model`, `/models` et les sélecteurs de modèles aux fournisseurs sélectionnés tout en continuant à utiliser la découverte dynamique des modèles.
    - Utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées à la liste d’autorisation sans supprimer les modèles existants. Les remplacements simples qui supprimeraient des entrées sont rejetés, sauf si vous transmettez `--replace`.
    - Les références de modèles utilisent le format `provider/model` (par exemple `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction des images des transcriptions et des outils (valeur par défaut : `1200`) ; des valeurs inférieures réduisent généralement l’utilisation des jetons de vision pour les exécutions comportant de nombreuses captures d’écran.
    - Consultez la [CLI des modèles](/fr/concepts/models) pour changer de modèle dans la conversation et le [basculement de modèle](/fr/concepts/model-failover) pour la rotation de l’authentification et le comportement de secours.
    - Pour les fournisseurs personnalisés ou auto-hébergés, consultez [Fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès aux messages privés est contrôlé pour chaque canal via `dmPolicy` (valeur par défaut : `"pairing"`) :

    - `"pairing"` : les expéditeurs inconnus reçoivent un code d’association à usage unique à approuver
    - `"allowlist"` : uniquement les expéditeurs figurant dans `allowFrom` (ou dans le registre des associations autorisées)
    - `"open"` : autoriser tous les messages privés entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les messages privés

    Pour les groupes, utilisez `groupPolicy` (`"allowlist" | "open" | "disabled"`) avec `groupAllowFrom` ou les listes d’autorisation propres au canal.

    Consultez la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour obtenir les détails propres à chaque canal.

  </Accordion>

  <Accordion title="Configurer l’obligation de mention dans les conversations de groupe">
    Par défaut, les messages de groupe **nécessitent une mention**. Configurez les motifs de déclenchement pour chaque agent. Les réponses normales dans les groupes et les canaux sont publiées automatiquement ; activez explicitement le chemin de l’outil de messagerie pour les salons partagés où l’agent doit décider quand intervenir :

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // définir sur "message_tool" pour exiger des envois via l’outil de messagerie partout
        groupChat: {
          visibleReplies: "message_tool", // activation explicite ; la sortie visible nécessite message(action=send)
          unmentionedInbound: "room_event", // les échanges permanents sans mention dans le groupe servent de contexte silencieux
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Mentions dans les métadonnées** : mentions @ natives (mention par toucher dans WhatsApp, @bot dans Telegram, etc.)
    - **Motifs textuels** : motifs d’expressions régulières sûrs dans `mentionPatterns`
    - **Réponses visibles** : `messages.visibleReplies` peut exiger globalement des envois via l’outil de messagerie ; `messages.groupChat.visibleReplies` remplace ce réglage pour les groupes et les canaux.
    - Consultez la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour les modes de réponse visible, les remplacements propres à chaque canal et le mode de conversation avec soi-même.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` comme base commune, puis remplacez-la pour des
    agents spécifiques avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hérite de github, weather
          { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
          { id: "locked-down", skills: [] }, // aucun skill
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour ne pas restreindre les Skills par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucun skill.
    - Consultez [Skills](/fr/tools/skills), la [configuration des Skills](/fr/tools/skills-config) et
      la [référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de l’état des canaux du Gateway">
    Contrôlez avec quelle agressivité le Gateway redémarre les canaux qui semblent obsolètes :

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Les valeurs affichées sont les valeurs par défaut. Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages déclenchés par la surveillance de l’état.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques d’un canal ou d’un compte sans désactiver la surveillance globale.
    - Consultez les [vérifications d’état](/fr/gateway/health) pour le diagnostic opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Ajuster le délai d’expiration de la négociation WebSocket du Gateway">
    Accordez davantage de temps aux clients locaux pour terminer la négociation WebSocket préalable à l’authentification sur
    les hôtes très sollicités ou peu puissants :

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - La valeur par défaut est de `15000` millisecondes.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` reste prioritaire pour les remplacements ponctuels dans un service ou un shell.
    - Corrigez d’abord les blocages au démarrage ou dans la boucle d’événements ; ce réglage est destiné aux hôtes sains mais lents pendant la mise en route.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l’isolation des conversations :

    ```json5
    {
      session: {
    ```
    ```json5
        dmScope: "per-channel-peer",  // recommandé pour plusieurs utilisateurs
    ```
    ```json5
        threadBindings: {
    ```
    ```json5
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
    ```
    ```json5
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```
    - `dmScope` : `main` (partagée) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings` : valeurs par défaut globales pour le routage des sessions liées à un fil. `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age` permettent de lier, délier, répertorier et ajuster ce paramètre pour chaque session (Discord lie les fils, Telegram lie les sujets/conversations).
    - Consultez [Gestion des sessions](/fr/concepts/session) pour la portée, les liens d’identité et la politique d’envoi.
    - Consultez la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le bac à sable">
    Exécutez les sessions d’agent dans des environnements d’exécution isolés :

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Créez d’abord l’image : depuis une copie de travail des sources, exécutez `scripts/sandbox-setup.sh` ; depuis une installation npm, consultez la commande `docker build` intégrée dans [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup).

    Consultez [l’isolation en bac à sable](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer les notifications push via relais pour les versions iOS officielles">
    Les notifications push via relais pour les versions publiques de l’App Store utilisent le relais OpenClaw hébergé : `https://ios-push-relay.openclaw.ai`.

    Les déploiements de relais personnalisés nécessitent un processus de compilation et de déploiement iOS délibérément distinct, dont l’URL du relais correspond à celle du relais du Gateway. Si vous utilisez une version avec relais personnalisé, définissez ceci dans la configuration du Gateway :

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facultatif. Valeur par défaut : 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Équivalent en CLI :

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Fonctionnement :

    - Permet au Gateway d’envoyer `push.test`, des sollicitations de réveil et des réveils de reconnexion par l’intermédiaire du relais externe.
    - Utilise une autorisation d’envoi limitée à l’inscription, transmise par l’application iOS appairée. Le Gateway n’a pas besoin d’un jeton de relais valable pour l’ensemble du déploiement.
    - Lie chaque inscription reposant sur le relais à l’identité du Gateway avec lequel l’application iOS a été appairée, afin qu’un autre Gateway ne puisse pas réutiliser l’inscription enregistrée.
    - Maintient les builds iOS locaux/manuels sur une connexion APNs directe. Les envois reposant sur le relais s’appliquent uniquement aux builds officiels distribués qui se sont inscrits par l’intermédiaire du relais.
    - Doit correspondre à l’URL de base du relais intégrée au build iOS, afin que le trafic d’inscription et d’envoi atteigne le même déploiement du relais.

    Flux de bout en bout :

    1. Installez l’application iOS officielle.
    2. Facultatif : configurez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement si vous utilisez intentionnellement un build personnalisé avec un relais distinct.
    3. Appairez l’application iOS avec le Gateway et laissez les sessions du Node et de l’opérateur se connecter.
    4. L’application iOS récupère l’identité du Gateway, s’inscrit auprès du relais à l’aide d’App Attest et du reçu de l’application, puis publie la charge utile `push.apns.register` reposant sur le relais auprès du Gateway appairé.
    5. Le Gateway enregistre l’identifiant du relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les sollicitations de réveil et les réveils de reconnexion.

    Notes opérationnelles :

    - Si vous associez l’application iOS à un autre Gateway, reconnectez l’application afin qu’elle puisse publier une nouvelle inscription auprès du relais, liée à ce Gateway.
    - Si vous publiez un nouveau build iOS qui pointe vers un autre déploiement du relais, l’application actualise son inscription au relais mise en cache au lieu de réutiliser l’ancienne origine du relais.

    Remarque sur la compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme substitutions temporaires par variables d’environnement.
    - Les URL de relais personnalisées du Gateway doivent correspondre à l’URL de base du relais intégrée au build iOS ; le canal de publication public de l’App Store rejette les substitutions d’URL de relais iOS personnalisées.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste un mécanisme de contournement réservé au développement en boucle locale ; n’enregistrez pas d’URL de relais HTTP dans la configuration.

    Consultez [Application iOS](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d’authentification et de confiance](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

  </Accordion>

  <Accordion title="Configurer le Heartbeat (contrôles périodiques)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every` : chaîne de durée (`30m`, `2h`). Définissez-la sur `0m` pour désactiver cette fonction. Valeur par défaut : `30m`.
    - `target` : `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles de Heartbeat de type message privé
    - Consultez [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer les tâches Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // valeur par défaut ; répartition Cron + exécution isolée des tours d’agent Cron
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention` : supprime les sessions d’exécution isolées terminées des lignes de session SQLite (valeur par défaut : `24h` ; définissez sur `false` pour désactiver cette suppression).
    - `runLog` : supprime, pour chaque tâche, les lignes conservées de l’historique des exécutions Cron. L’historique est stocké dans SQLite ; `maxBytes` (valeur par défaut : `2_000_000`) est conservé à des fins de compatibilité avec les anciens journaux d’exécution stockés dans des fichiers, et `keepLines` vaut `2000` par défaut.
    - Consultez [Tâches Cron](/fr/automation/cron-jobs) pour une présentation de la fonctionnalité et des exemples de CLI.

  </Accordion>

  <Accordion title="Configurer les Webhooks (hooks)">
    Activez les points de terminaison HTTP de Webhook sur le Gateway :

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Remarque de sécurité :
    - Traitez tout le contenu des charges utiles de hook/Webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas les secrets d’authentification actifs du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - L’authentification des hooks s’effectue uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont refusés.
    - `hooks.path` ne peut pas être `/` ; conservez l’entrée des Webhooks sur un sous-chemin dédié tel que `/hooks`.
    - Laissez désactivés les indicateurs de contournement du filtrage de contenu dangereux (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), sauf lors d’un débogage au périmètre strictement limité.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` afin de limiter les clés de session sélectionnées par l’appelant.
    - Pour les agents pilotés par des hooks, privilégiez des niveaux de modèles modernes et performants ainsi qu’une politique d’outils stricte (par exemple, messagerie uniquement, avec mise en bac à sable lorsque cela est possible).

    Consultez la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mappage et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec des espaces de travail et des sessions distincts :

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Consultez [Multi-agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/config-agents#multi-agent-routing) pour les règles de liaison et les profils d’accès propres à chaque agent.

  </Accordion>

  <Accordion title="Répartir la configuration dans plusieurs fichiers ($include)">
    Utilisez `$include` pour organiser les configurations volumineuses :

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Fichier unique** : remplace l’objet conteneur
    - **Tableau de fichiers** : fusion profonde dans l’ordre (le dernier prévaut), jusqu’à 10 niveaux d’imbrication
    - **Clés sœurs** : fusionnées après les inclusions (elles remplacent les valeurs incluses)
    - **Chemins relatifs** : résolus par rapport au fichier qui effectue l’inclusion
    - **Format des chemins** : les chemins d’inclusion ne doivent pas contenir d’octets nuls et doivent comporter strictement moins de 4096 caractères avant et après leur résolution
    - **Écritures effectuées par OpenClaw** : lorsqu’une écriture ne modifie qu’une seule section de premier niveau
      reposant sur l’inclusion d’un fichier unique, telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture propagée non prise en charge** : les inclusions à la racine, les tableaux d’inclusions et les inclusions
      comportant des remplacements par des clés sœurs échouent de manière sécurisée pour les écritures effectuées par OpenClaw au lieu
      d’aplatir la configuration
    - **Confinement** : les chemins `$include` doivent être résolus sous le répertoire contenant
      `openclaw.json`. Pour partager une arborescence entre plusieurs machines ou utilisateurs, définissez
      `OPENCLAW_INCLUDE_ROOTS` sur une liste de chemins (`:` sous POSIX, `;` sous Windows) vers des
      répertoires supplémentaires auxquels les inclusions peuvent faire référence. Les liens symboliques sont résolus
      puis vérifiés à nouveau : un chemin situé lexicalement dans un répertoire de configuration, mais dont
      la cible réelle se trouve en dehors de toutes les racines autorisées, est donc tout de même refusé.
    - **Gestion des erreurs** : messages d’erreur clairs pour les fichiers manquants, les erreurs d’analyse, les inclusions circulaires, les formats de chemin non valides et les longueurs excessives

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

Le Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications : aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont considérées comme non fiables jusqu’à ce qu’elles soient validées. Le mécanisme de surveillance attend
la fin des écritures temporaires et des renommages effectués par l’éditeur, lit le fichier final et refuse
les modifications externes non valides sans réécrire `openclaw.json`. Les écritures de configuration
effectuées par OpenClaw passent par le même contrôle de schéma avant l’écriture (consultez [Validation stricte](#strict-validation)
pour les règles d’écrasement et de restauration qui s’appliquent à chaque écriture).

Si vous voyez `config reload skipped (invalid config)` ou si le démarrage signale `Invalid
config`, examinez la configuration, exécutez `openclaw config validate`, puis exécutez `openclaw
doctor --fix` pour la réparer. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config)
pour accéder à la liste de vérification.

### Modes de rechargement

| Mode                   | Comportement                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique instantanément à chaud les modifications sûres. Redémarre automatiquement pour les modifications critiques.               |
| **`hot`**              | Applique à chaud uniquement les modifications sûres. Consigne un avertissement lorsqu’un redémarrage est nécessaire : vous devez l’effectuer. |
| **`restart`**          | Redémarre le Gateway à chaque modification de la configuration, qu’elle soit sûre ou non.                                             |
| **`off`**              | Désactive la surveillance du fichier. Les modifications prennent effet au prochain redémarrage manuel.                               |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Modifications appliquées à chaud et modifications nécessitant un redémarrage

La plupart des champs sont appliqués à chaud sans interruption ; certaines sections appliquées à chaud redémarrent uniquement le sous-système concerné (canal, Cron, Heartbeat, moniteur d’intégrité), plutôt que l’ensemble du Gateway. En mode
`hybrid`, les modifications nécessitant un redémarrage du Gateway sont gérées automatiquement.

| Catégorie           | Champs                                                                  | Redémarrage du Gateway nécessaire ? |
| ------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Canaux              | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et de plugins | Non (redémarre ce canal)            |
| Agent et modèles    | `agent`, `agents`, `models`, `routing`                                  | Non                                 |
| Automatisation      | `hooks`, `cron`, `agent.heartbeat`                                      | Non (redémarre ce sous-système)     |
| Sessions et messages | `session`, `messages`                                                  | Non                                 |
| Outils et médias    | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Non                                 |
| Configuration des plugins | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Non (recharge l’environnement d’exécution des plugins) |
| Interface et divers | `ui`, `logging`, `identity`, `bindings`                                 | Non                                 |
| Serveur Gateway     | `gateway.*` (port, liaison, authentification, Tailscale, TLS, HTTP, push) | **Oui**                             |
| Infrastructure      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Oui**                             |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions dans `gateway.*` : leur modification ne déclenche **pas** de redémarrage. Chaque plugin peut également remplacer les règles de ce tableau : un plugin chargé peut déclarer ses propres préfixes de configuration déclenchant un redémarrage (par exemple, le plugin Canvas intégré redémarre le Gateway pour `plugins.enabled`, `plugins.allow` et `plugins.deny`, et pas uniquement pour son propre `plugins.entries.canvas`). Le comportement réel dépend donc des plugins actifs.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé par `$include`, OpenClaw planifie
le rechargement à partir de la structure définie dans les sources, et non de la vue aplatie en mémoire.
Ainsi, les décisions de rechargement à chaud (application à chaud ou redémarrage) restent prévisibles, même lorsqu’une
section de premier niveau entière se trouve dans son propre fichier inclus, comme
`plugins: { $include: "./plugins.json5" }`. La planification du rechargement échoue de manière sécurisée si la
structure des sources est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API du Gateway, privilégiez ce flux :

- `config.schema.lookup` pour examiner une sous-arborescence (nœud de schéma superficiel et résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel ainsi que son `hash`
- `config.patch` pour les mises à jour partielles (correctif de fusion JSON : les objets sont fusionnés, `null`
  supprime, et les tableaux sont remplacés lorsqu’ils sont explicitement confirmés avec `replacePaths` si
  des entrées devaient être supprimées)
- `config.apply` uniquement lorsque vous souhaitez remplacer l’intégralité de la configuration
- `update.run` pour effectuer explicitement une mise à jour automatique suivie d’un redémarrage ; incluez `continuationMessage` lorsque la session après redémarrage doit exécuter un tour de suivi
- `update.status` pour examiner la dernière sentinelle de redémarrage de mise à jour et vérifier la version en cours d’exécution après un redémarrage

Les agents doivent considérer `config.schema.lookup` comme le premier point de consultation pour obtenir la documentation et les contraintes exactes
au niveau des champs. Utilisez la [référence de configuration](/fr/gateway/configuration-reference)
lorsqu’ils ont besoin de la vue d’ensemble de la configuration, des valeurs par défaut ou de liens vers les références
dédiées aux sous-systèmes.

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes par période de 60 secondes et par `deviceId+clientIp`. Les demandes de redémarrage
sont regroupées, puis un délai de récupération de 30 secondes est imposé entre les cycles de redémarrage.
`update.status` est en lecture seule, mais réservé aux administrateurs, car la sentinelle de redémarrage peut
inclure des résumés des étapes de mise à jour et les fins de sortie des commandes.
</Note>

Exemple de correctif partiel :

```bash
openclaw gateway call config.get --params '{}'  # capturer payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` et `config.patch` acceptent tous deux `raw`, `baseHash`, `sessionKey`,
`note` et `restartDelayMs`. `baseHash` est obligatoire pour les deux méthodes dès qu’un
fichier de configuration existe déjà (une première écriture sans configuration existante ignore cette vérification).

`config.patch` accepte également `replacePaths`, un tableau de chemins de configuration dont le remplacement
du tableau est intentionnel. Si un correctif remplace ou supprime un tableau existant
par un tableau comportant moins d’entrées, le Gateway rejette l’écriture, sauf si ce chemin exact figure
dans `replacePaths` ; les tableaux imbriqués dans des entrées de tableau utilisent `[]`, comme
`agents.list[].skills`. Cela empêche les instantanés `config.get` tronqués
d’écraser silencieusement les tableaux de routage ou de listes d’autorisation. Utilisez `config.apply` lorsque vous
souhaitez remplacer l’intégralité de la configuration.

## Variables d’environnement

OpenClaw lit les variables d’environnement du processus parent ainsi que depuis :

- `.env` dans le répertoire de travail actuel (s’il existe)
- `~/.openclaw/.env` (solution de repli globale)

Aucun de ces fichiers ne remplace les variables d’environnement existantes. Vous pouvez également définir des variables d’environnement directement dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importation de l’environnement du shell (facultatif)">
  Si cette option est activée et que les clés attendues ne sont pas définies, OpenClaw exécute votre shell de connexion et importe uniquement les clés manquantes :

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variable d’environnement équivalente : `OPENCLAW_LOAD_SHELL_ENV=1`. Valeur par défaut de `timeoutMs` : `15000`.
</Accordion>

<Accordion title="Substitution des variables d’environnement dans les valeurs de configuration">
  Référencez les variables d’environnement dans toute valeur de configuration de type chaîne avec `${VAR_NAME}` :

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Règles :

- Seuls les noms en majuscules correspondant à `[A-Z_][A-Z0-9_]*` sont pris en compte
- Les variables manquantes ou vides provoquent une erreur au chargement
- Échappez avec `$${VAR}` pour obtenir une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution intégrée : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références de secrets (env, fichier, exécution)">
  Pour les champs prenant en charge les objets SecretRef, vous pouvez utiliser :

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Les détails de SecretRef (y compris `secrets.providers` pour `env`/`file`/`exec`) se trouvent dans la [gestion des secrets](/fr/gateway/secrets).
Les chemins d’identifiants pris en charge sont répertoriés dans la [surface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Accordion>

Consultez [Environnement](/fr/help/environment) pour connaître l’ordre de priorité complet et les sources.

## Référence complète

Pour la référence complète champ par champ, consultez la **[référence de configuration](/fr/gateway/configuration-reference)**.

---

_À lire également : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Pages connexes

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Guide opérationnel du Gateway](/fr/gateway)
