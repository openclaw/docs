---
read_when:
    - Configuration initiale d’OpenClaw
    - Recherche de modèles de configuration courants
    - Accéder à des sections spécifiques de la configuration
summary: 'Présentation de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-07-16T13:20:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`. Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres.

Le chemin de la configuration active doit désigner un fichier ordinaire. Les écritures effectuées par OpenClaw le remplacent de manière atomique (par renommage vers le chemin), si bien que la cible d’un `openclaw.json` symbolique est remplacée au lieu que l’écriture la traverse — évitez les agencements de configuration utilisant des liens symboliques. Si vous conservez la configuration hors du répertoire d’état par défaut, faites pointer `OPENCLAW_CONFIG_PATH` directement vers le fichier réel.

Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, les outils, l’isolation ou l’automatisation (cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’interface utilisateur

Consultez la [référence complète](/fr/gateway/configuration-reference) pour connaître tous les champs disponibles.

Les agents et l’automatisation doivent utiliser `config.schema.lookup` pour obtenir la
documentation exacte de chaque champ avant de modifier la configuration. Utilisez cette page pour des conseils orientés tâches et la
[référence de configuration](/fr/gateway/configuration-reference) pour une vue d’ensemble
des champs et des valeurs par défaut.

<Tip>
**Vous découvrez la configuration ?** Commencez par `openclaw onboard` pour une configuration interactive, ou consultez le guide des [exemples de configuration](/fr/gateway/configuration-examples) pour obtenir des configurations complètes prêtes à copier-coller.
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
    L’interface de contrôle génère un formulaire à partir du schéma de configuration actif, notamment les métadonnées de documentation
    `title` / `description` des champs ainsi que les schémas des plugins et des canaux lorsqu’ils
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
OpenClaw accepte uniquement les configurations qui correspondent entièrement au schéma. Les clés inconnues, les types incorrects ou les valeurs non valides conduisent le Gateway à **refuser de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent joindre des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le JSON Schema canonique utilisé par l’interface de contrôle
et la validation. `config.schema.lookup` récupère un nœud unique limité à un chemin ainsi que
les résumés de ses enfants pour les outils d’exploration détaillée. Les métadonnées de documentation `title`/`description` des champs
sont propagées dans les objets imbriqués, les caractères génériques (`*`), les éléments de tableau (`[]`) et les branches `anyOf`/
`oneOf`/`allOf`. Les schémas d’exécution des plugins et des canaux sont fusionnés lorsque le
registre des manifestes est chargé.

Lorsque la validation échoue :

- Le Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour afficher les problèmes exacts
- Exécutez `openclaw doctor --fix` (`--repair` est le même indicateur ; `--yes` ignore les invites) pour appliquer les réparations

Le Gateway conserve une copie fiable de la dernière configuration valide après chaque démarrage réussi,
mais ni le démarrage ni le rechargement à chaud ne la restaurent automatiquement — seul `openclaw doctor --fix`
le fait. Si `openclaw.json` échoue à la validation (y compris la validation propre à un plugin), le
démarrage du Gateway échoue ou le rechargement est ignoré, et l’environnement d’exécution actuel conserve la dernière
configuration acceptée. Une écriture rejetée est également enregistrée sous `<path>.rejected.<timestamp>` à des fins d’inspection.
Le Gateway bloque les écritures qui semblent être des écrasements accidentels — suppression de `gateway.mode`,
perte du bloc `meta` ou réduction de plus de moitié de la taille du fichier — sauf si l’écriture
autorise explicitement les modifications destructrices. La promotion au rang de dernière configuration valide est ignorée lorsqu’un
candidat contient un espace réservé de secret masqué tel que `***` ou `[redacted]`.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Consultez la page consacrée au canal pour connaître les étapes de configuration :

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

    Tous les canaux partagent le même modèle de politique de messages privés :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // association | liste d’autorisation | ouvert | désactivé
          allowFrom: ["tg:123"], // uniquement pour liste d’autorisation/ouvert
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer les modèles">
    Définissez le modèle principal et les modèles de secours facultatifs :

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

    - `agents.defaults.models` définit le catalogue de modèles et sert de liste d’autorisation pour `/model` ; les entrées `provider/*` filtrent `/model`, `/models` et les sélecteurs de modèles afin de ne présenter que les fournisseurs sélectionnés, tout en continuant d’utiliser la découverte dynamique des modèles.
    - Utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées à la liste d’autorisation sans supprimer les modèles existants. Les remplacements simples qui supprimeraient des entrées sont rejetés, sauf si vous transmettez `--replace`.
    - Les références de modèles utilisent le format `provider/model` (par exemple `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction d’échelle des images de transcription et d’outils (valeur par défaut : `1200`) ; des valeurs plus faibles réduisent généralement l’utilisation de jetons de vision lors des exécutions contenant de nombreuses captures d’écran.
    - Consultez la [CLI des modèles](/fr/concepts/models) pour changer de modèle dans une conversation et le [basculement de modèle](/fr/concepts/model-failover) pour la rotation de l’authentification et le comportement de secours.
    - Pour les fournisseurs personnalisés ou auto-hébergés, consultez la section [Fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls) de la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès aux messages privés est contrôlé pour chaque canal via `dmPolicy` (valeur par défaut : `"pairing"`) :

    - `"pairing"` : les expéditeurs inconnus reçoivent un code d’association à usage unique à approuver
    - `"allowlist"` : uniquement les expéditeurs figurant dans `allowFrom` (ou dans le registre d’autorisation des associations)
    - `"open"` : autoriser tous les messages privés entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les messages privés

    Pour les groupes, utilisez `groupPolicy` (`"allowlist" | "open" | "disabled"`) ainsi que `groupAllowFrom` ou les listes d’autorisation propres au canal.

    Consultez la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour obtenir les détails propres à chaque canal.

  </Accordion>

  <Accordion title="Configurer l’exigence de mention dans les discussions de groupe">
    Par défaut, les messages de groupe **nécessitent une mention**. Configurez les motifs de déclenchement pour chaque agent. Les réponses ordinaires de groupe ou de canal sont publiées automatiquement ; activez le chemin de l’outil de messagerie dans les salons partagés où l’agent doit décider quand intervenir :

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // définir "message_tool" pour exiger partout les envois via l’outil de messagerie
        groupChat: {
          visibleReplies: "message_tool", // activation explicite ; la sortie visible nécessite message(action=send)
          unmentionedInbound: "room_event", // les échanges de groupe permanents sans mention constituent un contexte silencieux
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

    - **Mentions dans les métadonnées** : @-mentions natives (mention par appui dans WhatsApp, @bot dans Telegram, etc.)
    - **Motifs textuels** : motifs d’expressions régulières sûrs dans `mentionPatterns`
    - **Réponses visibles** : `messages.visibleReplies` peut exiger globalement les envois via l’outil de messagerie ; `messages.groupChat.visibleReplies` remplace ce réglage pour les groupes et les canaux.
    - Consultez la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour connaître les modes de réponse visible, les remplacements propres à chaque canal et le mode de conversation avec soi-même.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` comme base commune, puis remplacez-la pour certains
    agents avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hérite de github, weather
          { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
          { id: "locked-down", skills: [] }, // aucune compétence
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour ne pas restreindre les Skills par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucune compétence.
    - Consultez [Skills](/fr/tools/skills), la [configuration des Skills](/fr/tools/skills-config) et
      la [référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de l’état des canaux du Gateway">
    Contrôlez l’agressivité avec laquelle le Gateway redémarre les canaux qui semblent inactifs :

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

    - Les valeurs indiquées sont celles par défaut. Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages effectués par le moniteur d’état.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques d’un canal ou d’un compte sans désactiver le moniteur global.
    - Consultez les [vérifications d’état](/fr/gateway/health) pour le diagnostic opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Ajuster le délai d’expiration de la négociation WebSocket du Gateway">
    Accordez davantage de temps aux clients locaux pour terminer la négociation WebSocket préalable à l’authentification sur les
    hôtes très sollicités ou peu puissants :

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - La valeur par défaut est de `15000` millisecondes.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` reste prioritaire pour les remplacements ponctuels au niveau du service ou du shell.
    - Corrigez d’abord les blocages au démarrage ou dans la boucle d’événements ; ce réglage est destiné aux hôtes sains, mais lents pendant le préchauffage.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l’isolation des conversations :

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommandé pour plusieurs utilisateurs
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope` : `main` (partagé) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings` : valeurs par défaut globales pour le routage des sessions liées aux fils de discussion. `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age` permettent respectivement de lier, délier, répertorier et ajuster ce comportement par session (Discord lie les fils de discussion, Telegram lie les sujets/conversations).
    - Consultez [Gestion des sessions](/fr/concepts/session) pour la portée, les liens d’identité et la politique d’envoi.
    - Consultez la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer l’isolation en bac à sable">
    Exécutez les sessions d’agent dans des environnements d’exécution isolés en bac à sable :

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

    Construisez d’abord l’image : depuis un dépôt source extrait, exécutez `scripts/sandbox-setup.sh` ; depuis une installation npm, consultez la commande intégrée `docker build` dans [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup).

    Consultez [Bac à sable](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer les notifications push via relais pour les versions iOS officielles">
    Les notifications push via relais pour les versions publiques de l’App Store utilisent le relais OpenClaw hébergé : `https://ios-push-relay.openclaw.ai`.

    Les déploiements de relais personnalisés nécessitent un chemin de compilation et de déploiement iOS volontairement distinct, dont l’URL de relais correspond à celle du relais du Gateway. Si vous utilisez une version personnalisée avec relais, définissez ceci dans la configuration du Gateway :

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

    Équivalent CLI :

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Fonctionnement :

    - Permet au Gateway d’envoyer `push.test`, des sollicitations de réveil et des réveils de reconnexion par l’intermédiaire du relais externe.
    - Utilise une autorisation d’envoi limitée à l’enregistrement, transmise par l’app iOS appairée. Le Gateway n’a pas besoin d’un jeton de relais couvrant l’ensemble du déploiement.
    - Lie chaque enregistrement via relais à l’identité du Gateway avec lequel l’app iOS a été appairée, afin qu’un autre Gateway ne puisse pas réutiliser l’enregistrement stocké.
    - Conserve l’utilisation directe d’APNs pour les versions iOS locales/manuelles. Les envois via relais s’appliquent uniquement aux versions officielles distribuées qui se sont enregistrées par l’intermédiaire du relais.
    - Doit correspondre à l’URL de base du relais intégrée à la version iOS, afin que le trafic d’enregistrement et d’envoi atteigne le même déploiement de relais.

    Flux de bout en bout :

    1. Installez l’app iOS officielle.
    2. Facultatif : configurez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement si vous utilisez une version personnalisée avec un relais volontairement distinct.
    3. Appairez l’app iOS au Gateway et laissez les sessions du Node et de l’opérateur se connecter.
    4. L’app iOS récupère l’identité du Gateway, s’enregistre auprès du relais à l’aide d’App Attest et du reçu de l’app, puis publie la charge utile `push.apns.register` via relais sur le Gateway appairé.
    5. Le Gateway stocke l’identifiant du relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les sollicitations de réveil et les réveils de reconnexion.

    Notes opérationnelles :

    - Si vous connectez l’app iOS à un autre Gateway, reconnectez l’app afin qu’elle puisse publier un nouvel enregistrement de relais lié à ce Gateway.
    - Si vous distribuez une nouvelle version iOS qui pointe vers un autre déploiement de relais, l’app actualise son enregistrement de relais mis en cache au lieu de réutiliser l’ancienne origine du relais.

    Note de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements temporaires par variables d’environnement.
    - Les URL de relais personnalisées du Gateway doivent correspondre à l’URL de base du relais intégrée à la version iOS ; le canal de publication publique de l’App Store rejette les remplacements personnalisés de l’URL du relais iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement limitée à l’interface de bouclage ; ne conservez pas d’URL de relais HTTP dans la configuration.

    Consultez [App iOS](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d’authentification et de confiance](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

  </Accordion>

  <Accordion title="Configurer le Heartbeat (vérifications périodiques)">
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

    - `every` : chaîne de durée (`30m`, `2h`). Définissez `0m` pour désactiver. Valeur par défaut : `30m`.
    - `target` : `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles de Heartbeat de type message privé
    - Consultez [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer les tâches Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // valeur par défaut ; répartition Cron + exécution isolée d’un tour d’agent Cron
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention` : supprime les sessions d’exécution isolées terminées des lignes de session SQLite (valeur par défaut : `24h` ; définissez `false` pour désactiver).
    - L’historique d’exécution conserve automatiquement les 2000 lignes terminales les plus récentes par tâche ; les lignes perdues conservent leur fenêtre de nettoyage de 24 heures.
    - Consultez [Tâches Cron](/fr/automation/cron-jobs) pour une présentation de la fonctionnalité et des exemples de CLI.

  </Accordion>

  <Accordion title="Configurer les Webhooks (hooks)">
    Activez les points de terminaison Webhook HTTP sur le Gateway :

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

    Note de sécurité :
    - Traitez tout le contenu des charges utiles de hook/Webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas les secrets d’authentification actifs du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - L’authentification des hooks s’effectue uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont rejetés.
    - `hooks.path` ne peut pas être `/` ; conservez l’entrée Webhook sur un sous-chemin dédié tel que `/hooks`.
    - Maintenez désactivés les indicateurs de contournement du contenu non sécurisé (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), sauf pour un débogage strictement circonscrit.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` afin de limiter les clés de session choisies par l’appelant.
    - Pour les agents pilotés par des hooks, privilégiez des niveaux de modèles modernes et robustes ainsi qu’une politique stricte concernant les outils (par exemple, messagerie uniquement avec isolation en bac à sable lorsque cela est possible).

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
    - **Tableau de fichiers** : fusion profonde dans l’ordre (le dernier l’emporte), jusqu’à 10 niveaux d’imbrication
    - **Clés sœurs** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Chemins relatifs** : résolus par rapport au fichier qui effectue l’inclusion
    - **Format du chemin** : les chemins d’inclusion ne doivent pas contenir d’octets nuls et doivent comporter strictement moins de 4096 caractères avant et après leur résolution
    - **Écritures appartenant à OpenClaw** : lorsqu’une écriture ne modifie qu’une seule section de premier niveau
      reposant sur une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture transmise non prise en charge** : les inclusions à la racine, les tableaux d’inclusions et les inclusions
      avec des remplacements par clés sœurs échouent de manière sécurisée pour les écritures appartenant à OpenClaw au lieu
      d’aplatir la configuration
    - **Confinement** : les chemins `$include` doivent être résolus sous le répertoire contenant
      `openclaw.json`. Pour partager une arborescence entre plusieurs machines ou utilisateurs, définissez
      `OPENCLAW_INCLUDE_ROOTS` sur une liste de chemins (`:` sous POSIX, `;` sous Windows) de
      répertoires supplémentaires auxquels les inclusions peuvent faire référence. Les liens symboliques sont résolus
      puis vérifiés de nouveau ; ainsi, un chemin situé lexicalement dans un répertoire de configuration, mais dont
      la cible réelle échappe à toutes les racines autorisées, est tout de même rejeté.
    - **Gestion des erreurs** : erreurs explicites en cas de fichiers manquants, d’erreurs d’analyse, d’inclusions circulaires, de format de chemin non valide et de longueur excessive

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

Le Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications ; aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont considérées comme non fiables tant qu’elles n’ont pas été validées. Le processus de surveillance attend
la fin des écritures temporaires et des renommages effectués par l’éditeur, lit le fichier final et rejette
les modifications externes non valides sans réécrire `openclaw.json`. Les écritures de configuration
appartenant à OpenClaw passent par le même contrôle de schéma avant l’écriture (consultez [Validation stricte](#strict-validation)
pour les règles d’écrasement et de restauration qui s’appliquent à chaque écriture).

Si vous voyez `config reload skipped (invalid config)` ou si le démarrage signale `Invalid
config`, inspectez la configuration, exécutez `openclaw config validate`, puis exécutez `openclaw
doctor --fix` pour effectuer la réparation. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config)
pour la liste de vérification.

### Modes de rechargement

| Mode                   | Comportement                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique instantanément à chaud les modifications sûres. Redémarre automatiquement pour celles qui sont critiques.           |
| **`hot`**              | Applique à chaud uniquement les modifications sûres. Consigne un avertissement lorsqu’un redémarrage est nécessaire — vous devez vous en charger. |
| **`restart`**          | Redémarre le Gateway à chaque modification de configuration, qu’elle soit sûre ou non.                                 |
| **`off`**              | Désactive la surveillance des fichiers. Les modifications prennent effet au prochain redémarrage manuel.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Modifications appliquées à chaud et modifications nécessitant un redémarrage

La plupart des champs sont appliqués à chaud sans interruption de service ; certaines sections appliquées à chaud redémarrent uniquement le
sous-système concerné (canal, cron, heartbeat, moniteur d’intégrité) plutôt que l’ensemble du Gateway. En mode
`hybrid`, les modifications nécessitant le redémarrage du Gateway sont gérées automatiquement.

| Catégorie            | Champs                                                                  | Redémarrage du Gateway nécessaire ?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Canaux            | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et de plugins       | Non (redémarre ce canal)   |
| Agent et modèles      | `agent`, `agents`, `models`, `routing`                                  | Non                           |
| Automatisation          | `hooks`, `cron`, `agent.heartbeat`                                      | Non (redémarre ce sous-système) |
| Sessions et messages | `session`, `messages`                                                   | Non                           |
| Outils et médias       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Non                           |
| Configuration des plugins       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Non (recharge l’environnement d’exécution du plugin)  |
| Interface utilisateur et divers           | `ui`, `logging`, `identity`, `bindings`                                 | Non                           |
| Serveur Gateway      | `gateway.*` (port, liaison, authentification, tailscale, TLS, HTTP, envoi)              | **Oui**                      |
| Infrastructure      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Oui**                      |

<Note>
`gateway.reload` et `gateway.remote` constituent des exceptions sous `gateway.*` : leur modification ne déclenche **pas** de redémarrage. Chaque plugin peut également remplacer les règles de ce tableau : un plugin chargé peut déclarer ses propres préfixes de configuration déclenchant un redémarrage (par exemple, le plugin Canvas intégré redémarre le Gateway pour `plugins.enabled`, `plugins.allow` et `plugins.deny`, et pas seulement pour son propre `plugins.entries.canvas`) ; le comportement réel dépend donc des plugins actifs.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé par `$include`, OpenClaw planifie
le rechargement à partir de la structure définie dans les fichiers sources, et non à partir de la vue aplatie en mémoire.
Ainsi, les décisions de rechargement à chaud (application à chaud ou redémarrage) restent prévisibles, même lorsqu’une
section de premier niveau entière se trouve dans son propre fichier inclus, tel que
`plugins: { $include: "./plugins.json5" }`. La planification du rechargement échoue de manière sécurisée si la
structure des sources est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API du Gateway, privilégiez le flux suivant :

- `config.schema.lookup` pour inspecter une sous-arborescence (nœud de schéma superficiel et résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel ainsi que `hash`
- `config.patch` pour les mises à jour partielles (correctif de fusion JSON : les objets sont fusionnés, `null`
  supprime et les tableaux sont remplacés après confirmation explicite avec `replacePaths` si
  des entrées doivent être supprimées)
- `config.apply` uniquement lorsque vous prévoyez de remplacer toute la configuration
- `update.run` pour une mise à jour automatique explicite suivie d’un redémarrage ; incluez `continuationMessage` si la session après redémarrage doit exécuter un tour de suivi
- `update.status` pour inspecter la dernière sentinelle de redémarrage liée à une mise à jour et vérifier la version en cours d’exécution après un redémarrage

Les agents doivent consulter d’abord `config.schema.lookup` pour obtenir la documentation et les contraintes exactes
au niveau de chaque champ. Utilisez la [référence de configuration](/fr/gateway/configuration-reference)
lorsqu’ils ont besoin de la carte de configuration générale, des valeurs par défaut ou de liens vers les références
propres aux sous-systèmes.

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes par période de 60 secondes et par `deviceId+clientIp`. Les demandes de redémarrage
sont regroupées, puis un délai de récupération de 30 secondes est imposé entre les cycles de redémarrage.
`update.status` est en lecture seule, mais réservé aux administrateurs, car la sentinelle de redémarrage peut
inclure des résumés des étapes de mise à jour et les dernières lignes de sortie des commandes.
</Note>

Exemple de correctif partiel :

```bash
openclaw gateway call config.get --params '{}'  # récupérer payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` et `config.patch` acceptent tous deux `raw`, `baseHash`, `sessionKey`,
`note` et `restartDelayMs`. `baseHash` est requis pour les deux méthodes dès qu’un
fichier de configuration existe déjà (la vérification est ignorée lors d’une première écriture en l’absence de configuration existante).

`config.patch` accepte également `replacePaths`, un tableau de chemins de configuration dont le remplacement
des tableaux est intentionnel. Si un correctif doit remplacer ou supprimer un tableau existant
par un tableau comportant moins d’entrées, le Gateway rejette l’écriture, sauf si ce chemin exact figure
dans `replacePaths` ; les tableaux imbriqués dans les entrées d’un tableau utilisent `[]`, comme
`agents.list[].skills`. Cela empêche les instantanés `config.get` tronqués
d’écraser silencieusement les tableaux de routage ou de listes d’autorisation. Utilisez `config.apply` lorsque vous
souhaitez remplacer l’intégralité de la configuration.

## Variables d’environnement

OpenClaw lit les variables d’environnement du processus parent ainsi que celles provenant de :

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

<Accordion title="Importation de l’environnement du shell (facultative)">
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
  Référencez des variables d’environnement dans toute valeur de configuration de type chaîne avec `${VAR_NAME}` :

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Règles :

- Seuls les noms en majuscules correspondent : `[A-Z_][A-Z0-9_]*`
- Les variables manquantes ou vides déclenchent une erreur au chargement
- Échappez avec `$${VAR}` pour obtenir une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution en ligne : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références de secrets (environnement, fichier, exécution)">
  Pour les champs qui prennent en charge les objets SecretRef, vous pouvez utiliser :

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

Les détails de SecretRef (notamment `secrets.providers` pour `env`/`file`/`exec`) figurent dans [Gestion des secrets](/fr/gateway/secrets).
Les chemins d’identifiants pris en charge sont répertoriés dans [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Accordion>

Consultez [Environnement](/fr/help/environment) pour connaître l’ordre de priorité complet et toutes les sources.

## Référence complète

Pour obtenir la référence complète champ par champ, consultez la **[référence de configuration](/fr/gateway/configuration-reference)**.

---

_Sujets connexes : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Pages connexes

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Guide d’exploitation du Gateway](/fr/gateway)
