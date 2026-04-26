---
read_when:
    - Configurer OpenClaw pour la première fois
    - Rechercher des modèles de configuration courants
    - Naviguer vers des sections de configuration spécifiques
summary: 'Vue d’ensemble de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-04-26T11:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`.
Le chemin de configuration actif doit être un fichier ordinaire. Les dispositions de
`openclaw.json` via symlink ne sont pas prises en charge pour les écritures détenues par OpenClaw ; une écriture atomique peut remplacer
le chemin au lieu de préserver le symlink. Si vous conservez la configuration en dehors du
répertoire d’état par défaut, pointez `OPENCLAW_CONFIG_PATH` directement vers le fichier réel.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, outils, sandboxing ou automatisations (Cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’UI

Voir la [référence complète](/fr/gateway/configuration-reference) pour tous les champs disponibles.

Les agents et l’automatisation doivent utiliser `config.schema.lookup` pour obtenir une documentation exacte au niveau des champs
avant de modifier la configuration. Utilisez cette page pour des conseils orientés tâches et
la [Référence de configuration](/fr/gateway/configuration-reference) pour la cartographie plus large
des champs et des valeurs par défaut.

<Tip>
**Nouveau dans la configuration ?** Commencez avec `openclaw onboard` pour une configuration interactive, ou consultez le guide [Configuration Examples](/fr/gateway/configuration-examples) pour des configurations complètes prêtes à copier-coller.
</Tip>

## Configuration minimale

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modifier la configuration

<Tabs>
  <Tab title="Assistant interactif">
    ```bash
    openclaw onboard       # flux d’onboarding complet
    openclaw configure     # assistant de configuration
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Ouvrez [http://127.0.0.1:18789](http://127.0.0.1:18789) et utilisez l’onglet **Config**.
    La Control UI rend un formulaire à partir du schéma de configuration actif, y compris les métadonnées de documentation de champ
    `title` / `description` ainsi que les schémas de Plugin et de canal lorsque
    disponibles, avec un éditeur **Raw JSON** comme porte de sortie. Pour les UI
    d’exploration détaillée et autres outils, la gateway expose aussi `config.schema.lookup` pour
    récupérer un nœud de schéma limité à un chemin ainsi que les résumés immédiats de ses enfants.
  </Tab>
  <Tab title="Modification directe">
    Modifiez `~/.openclaw/openclaw.json` directement. La Gateway surveille le fichier et applique automatiquement les changements (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n’accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, types mal formés ou valeurs invalides amènent la Gateway à **refuser de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent attacher des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le JSON Schema canonique utilisé par la Control UI
et la validation. `config.schema.lookup` récupère un seul nœud limité à un chemin ainsi que
les résumés de ses enfants pour les outils d’exploration. Les métadonnées de documentation de champ `title`/`description`
s’appliquent aussi aux objets imbriqués, aux jokers (`*`), aux éléments de tableau (`[]`) et aux branches `anyOf`/
`oneOf`/`allOf`. Les schémas de Plugin et de canal du runtime sont fusionnés lorsque le
registre des manifestes est chargé.

Lorsque la validation échoue :

- La Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

La Gateway conserve une copie de confiance du dernier état valide après chaque démarrage réussi.
Si `openclaw.json` échoue ensuite à la validation (ou supprime `gateway.mode`, rétrécit
fortement ou comporte une ligne de journal parasite ajoutée au début), OpenClaw préserve le fichier
cassé sous `.clobbered.*`, restaure la dernière copie valide connue et journalise la raison
de la récupération. Le prochain tour d’agent reçoit aussi un avertissement d’événement système afin que l’agent principal ne réécrive pas aveuglément la configuration restaurée. La promotion comme dernier état valide connu
est ignorée lorsqu’un candidat contient des espaces réservés de secret masqués comme `***`.
Lorsque tous les problèmes de validation sont limités à `plugins.entries.<id>...`, OpenClaw
n’effectue pas de récupération du fichier entier. Il conserve la configuration actuelle active et
fait remonter l’échec local au Plugin, afin qu’une incompatibilité entre schéma de Plugin et version de l’hôte ne puisse pas annuler des paramètres utilisateur sans rapport.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Voir la page dédiée à chaque canal pour les étapes de configuration :

    - [WhatsApp](/fr/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/fr/channels/telegram) — `channels.telegram`
    - [Discord](/fr/channels/discord) — `channels.discord`
    - [Feishu](/fr/channels/feishu) — `channels.feishu`
    - [Google Chat](/fr/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/fr/channels/msteams) — `channels.msteams`
    - [Slack](/fr/channels/slack) — `channels.slack`
    - [Signal](/fr/channels/signal) — `channels.signal`
    - [iMessage](/fr/channels/imessage) — `channels.imessage`
    - [Mattermost](/fr/channels/mattermost) — `channels.mattermost`

    Tous les canaux partagent le même modèle de politique DM :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // seulement pour allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer les modèles">
    Définissez le modèle principal et d’éventuelles solutions de repli :

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

    - `agents.defaults.models` définit le catalogue de modèles et sert de liste d’autorisation pour `/model`.
    - Utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées à la liste d’autorisation sans supprimer les modèles existants. Les remplacements simples qui supprimeraient des entrées sont rejetés sauf si vous passez `--replace`.
    - Les références de modèle utilisent le format `provider/model` (par ex. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction d’échelle des images de transcription/d’outil (par défaut `1200`) ; des valeurs plus basses réduisent généralement l’usage de jetons de vision lors d’exécutions riches en captures d’écran.
    - Voir [Models CLI](/fr/concepts/models) pour changer de modèle dans le chat et [Model Failover](/fr/concepts/model-failover) pour le comportement de rotation d’authentification et de repli.
    - Pour les fournisseurs personnalisés/autohébergés, voir [Custom providers](/fr/gateway/config-tools#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès DM est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage à usage unique à approuver
    - `"allowlist"` : seuls les expéditeurs présents dans `allowFrom` (ou dans le magasin d’autorisation appairé)
    - `"open"` : autorise tous les DM entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignore tous les DM

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou des listes d’autorisation spécifiques au canal.

    Voir la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer le déclenchement par mention dans les chats de groupe">
    Par défaut, les messages de groupe **nécessitent une mention**. Configurez des motifs par agent :

    ```json5
    {
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

    - **Mentions de métadonnées** : mentions natives @ (WhatsApp tap-to-mention, Telegram @bot, etc.)
    - **Motifs de texte** : motifs regex sûrs dans `mentionPatterns`
    - Voir la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour les remplacements par canal et le mode self-chat.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` pour une base partagée, puis remplacez les agents spécifiques
    avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hérite de github, weather
          { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
          { id: "locked-down", skills: [] }, // aucun Skills
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour autoriser tous les Skills par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’avoir aucun Skills.
    - Voir [Skills](/fr/tools/skills), [Skills config](/fr/tools/skills-config) et
      la [Référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de santé des canaux de la gateway">
    Contrôlez à quel point la gateway redémarre agressivement les canaux qui semblent obsolètes :

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

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages dus au moniteur de santé.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques pour un canal ou un compte sans désactiver le moniteur global.
    - Voir [Health Checks](/fr/gateway/health) pour le débogage opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l’isolation des conversations :

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommandé pour le multi-utilisateur
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

    - `dmScope` : `main` (partagée) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings` : valeurs globales par défaut pour le routage de session lié à un fil (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Voir [Session Management](/fr/concepts/session) pour la portée, les liens d’identité et la politique d’envoi.
    - Voir la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le sandboxing">
    Exécutez les sessions d’agent dans des runtimes sandbox isolés :

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

    Build l’image d’abord : `scripts/sandbox-setup.sh`

    Voir [Sandboxing](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer le push adossé au relay pour les builds iOS officielles">
    Le push adossé au relay se configure dans `openclaw.json`.

    Définissez ceci dans la configuration de la gateway :

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facultatif. Par défaut : 10000
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

    Ce que cela fait :

    - Permet à la gateway d’envoyer `push.test`, des nudges de réveil et des réveils de reconnexion via le relay externe.
    - Utilise une autorisation d’envoi limitée à l’enregistrement transmise par l’app iOS appairée. La gateway n’a pas besoin d’un jeton relay déployé à l’échelle globale.
    - Lie chaque enregistrement adossé au relay à l’identité Gateway avec laquelle l’app iOS a été appairée, de sorte qu’une autre gateway ne puisse pas réutiliser l’enregistrement stocké.
    - Conserve les builds iOS locaux/manuels sur APNs direct. Les envois adossés au relay ne s’appliquent qu’aux builds officielles distribuées qui se sont enregistrées via le relay.
    - Doit correspondre à l’URL de base du relay intégrée dans la build iOS officielle/TestFlight, afin que l’enregistrement et le trafic d’envoi atteignent le même déploiement relay.

    Flux de bout en bout :

    1. Installez une build iOS officielle/TestFlight compilée avec la même URL de base relay.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur la gateway.
    3. Appairez l’app iOS à la gateway et laissez les sessions node et operator se connecter.
    4. L’app iOS récupère l’identité Gateway, s’enregistre auprès du relay en utilisant App Attest plus le reçu de l’app, puis publie la charge `push.apns.register` adossée au relay à la gateway appairée.
    5. La gateway stocke le handle relay et l’autorisation d’envoi, puis les utilise pour `push.test`, les nudges de réveil et les réveils de reconnexion.

    Remarques opérationnelles :

    - Si vous basculez l’app iOS vers une autre gateway, reconnectez l’app afin qu’elle puisse publier un nouvel enregistrement relay lié à cette gateway.
    - Si vous publiez une nouvelle build iOS pointant vers un déploiement relay différent, l’app actualise son enregistrement relay mis en cache au lieu de réutiliser l’ancienne origine relay.

    Remarque de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements temporaires via variable d’environnement.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement limitée au loopback ; ne conservez pas d’URL relay HTTP dans la configuration.

    Voir [iOS App](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Authentication and trust flow](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relay.

  </Accordion>

  <Accordion title="Configurer Heartbeat (vérifications périodiques)">
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

    - `every` : chaîne de durée (`30m`, `2h`). Définissez `0m` pour désactiver.
    - `target` : `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles Heartbeat de type DM
    - Voir [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer les tâches Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention` : supprime les sessions d’exécution isolées terminées de `sessions.json` (par défaut `24h` ; définissez `false` pour désactiver).
    - `runLog` : supprime le contenu de `cron/runs/<jobId>.jsonl` selon la taille et le nombre de lignes conservées.
    - Voir [Cron jobs](/fr/automation/cron-jobs) pour une vue d’ensemble des fonctionnalités et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer les Webhooks (hooks)">
    Activez les endpoints HTTP Webhook sur la Gateway :

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
    - Traitez tout le contenu des charges hook/Webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton partagé de la Gateway.
    - L’authentification des hooks se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la query string sont rejetés.
    - `hooks.path` ne peut pas être `/` ; gardez l’entrée Webhook sur un sous-chemin dédié tel que `/hooks`.
    - Laissez désactivés les drapeaux de contournement de contenu non sûr (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sauf pour un débogage très ciblé.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` afin de limiter les clés de session choisies par l’appelant.
    - Pour les agents pilotés par hooks, privilégiez des niveaux de modèle modernes et solides ainsi qu’une politique d’outils stricte (par exemple messagerie uniquement plus sandboxing lorsque possible).

    Voir la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mapping et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec espaces de travail et sessions séparés :

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

    Voir [Multi-Agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/config-agents#multi-agent-routing) pour les règles de liaison et les profils d’accès par agent.

  </Accordion>

  <Accordion title="Diviser la configuration en plusieurs fichiers ($include)">
    Utilisez `$include` pour organiser les grandes configurations :

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
    - **Tableau de fichiers** : fusion profonde dans l’ordre (le dernier l’emporte)
    - **Clés voisines** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu’à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus relativement au fichier incluant
    - **Écritures détenues par OpenClaw** : lorsqu’une écriture ne change qu’une seule section de niveau supérieur
      adossée à une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture traversante non prise en charge** : les inclusions à la racine, tableaux d’inclusion et inclusions
      avec remplacements voisins échouent en fermeture prudente pour les écritures détenues par OpenClaw au lieu
      d’aplatir la configuration
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, erreurs d’analyse et inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

La Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les changements — aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont traitées comme non fiables tant qu’elles ne sont pas validées. Le watcher attend
que l’agitation due aux écritures temporaires/renommages de l’éditeur se stabilise, lit le fichier final et rejette
les modifications externes invalides en restaurant la dernière configuration valide connue. Les écritures de configuration
détenues par OpenClaw utilisent le même garde-fou de schéma avant écriture ; les écrasements destructeurs tels
que la suppression de `gateway.mode` ou une réduction de plus de moitié du fichier sont rejetés
et enregistrés sous `.rejected.*` pour inspection.

Les échecs de validation locaux aux Plugins constituent l’exception : si tous les problèmes sont sous
`plugins.entries.<id>...`, le rechargement conserve la configuration courante et signale le problème du Plugin
au lieu de restaurer `.last-good`.

Si vous voyez `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` dans les journaux, inspectez le fichier
`.clobbered.*` correspondant à côté de `openclaw.json`, corrigez la charge rejetée, puis exécutez
`openclaw config validate`. Voir [Gateway troubleshooting](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config)
pour la checklist de récupération.

### Modes de rechargement

| Mode                   | Comportement                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique à chaud immédiatement les changements sûrs. Redémarre automatiquement pour les changements critiques. |
| **`hot`**              | Applique à chaud uniquement les changements sûrs. Journalise un avertissement lorsqu’un redémarrage est nécessaire — c’est à vous de le gérer. |
| **`restart`**          | Redémarre la Gateway sur toute modification de configuration, sûre ou non.            |
| **`off`**              | Désactive la surveillance des fichiers. Les changements prennent effet au prochain redémarrage manuel. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s’applique à chaud et ce qui nécessite un redémarrage

La plupart des champs s’appliquent à chaud sans interruption. En mode `hybrid`, les changements nécessitant un redémarrage sont gérés automatiquement.

| Catégorie            | Champs                                                            | Redémarrage nécessaire ? |
| ------------------- | ----------------------------------------------------------------- | ------------------------ |
| Canaux             | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et de Plugin | Non                      |
| Agent et modèles      | `agent`, `agents`, `models`, `routing`                            | Non                      |
| Automatisation          | `hooks`, `cron`, `agent.heartbeat`                                | Non                      |
| Sessions et messages | `session`, `messages`                                             | Non                      |
| Outils et médias       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Non                      |
| UI et divers           | `ui`, `logging`, `identity`, `bindings`                           | Non                      |
| Serveur Gateway      | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Oui**                  |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Oui**                  |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — leur modification **ne** déclenche **pas** de redémarrage.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé via `$include`, OpenClaw planifie
le rechargement à partir de la disposition source rédigée, et non de la vue en mémoire aplatie.
Cela permet de garder des décisions prévisibles de rechargement à chaud (application à chaud vs redémarrage) même lorsqu’une
seule section de niveau supérieur vit dans son propre fichier inclus, telle que
`plugins: { $include: "./plugins.json5" }`. La planification du rechargement échoue prudemment si la
disposition source est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API gateway, préférez ce flux :

- `config.schema.lookup` pour inspecter un sous-arbre (nœud de schéma superficiel + résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel plus le `hash`
- `config.patch` pour les mises à jour partielles (JSON merge patch : les objets fusionnent, `null`
  supprime, les tableaux remplacent)
- `config.apply` uniquement lorsque vous avez l’intention de remplacer toute la configuration
- `update.run` pour une auto-mise à jour explicite plus redémarrage

Les agents doivent considérer `config.schema.lookup` comme le premier arrêt pour la documentation exacte
au niveau des champs et des contraintes. Utilisez la [Référence de configuration](/fr/gateway/configuration-reference)
lorsqu’ils ont besoin de la carte de configuration plus large, des valeurs par défaut ou de liens vers des références
de sous-systèmes dédiées.

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes par 60 secondes par `deviceId+clientIp`. Les demandes de redémarrage
sont regroupées puis imposent un cooldown de 30 secondes entre les cycles de redémarrage.
</Note>

Exemple de patch partiel :

```bash
openclaw gateway call config.get --params '{}'  # capturer payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` et `config.patch` acceptent tous deux `raw`, `baseHash`, `sessionKey`,
`note` et `restartDelayMs`. `baseHash` est requis pour les deux méthodes lorsqu’une
configuration existe déjà.

## Variables d’environnement

OpenClaw lit les variables d’environnement à partir du processus parent ainsi que :

- `.env` depuis le répertoire de travail courant (s’il existe)
- `~/.openclaw/.env` (solution de repli globale)

Aucun de ces fichiers ne remplace les variables d’environnement existantes. Vous pouvez aussi définir des variables d’environnement en ligne dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import des variables d’environnement du shell (facultatif)">
  Si cette option est activée et que les clés attendues ne sont pas définies, OpenClaw exécute votre shell de connexion et importe uniquement les clés manquantes :

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Équivalent en variable d’environnement : `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitution des variables d’environnement dans les valeurs de configuration">
  Référencez des variables d’environnement dans n’importe quelle valeur de chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Règles :

- Seuls les noms en majuscules correspondant à `[A-Z_][A-Z0-9_]*` sont acceptés
- Les variables manquantes/vides provoquent une erreur au chargement
- Échappez avec `$${VAR}` pour une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution en ligne : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références de secret (env, file, exec)">
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

Les détails de SecretRef (y compris `secrets.providers` pour `env`/`file`/`exec`) se trouvent dans [Secrets Management](/fr/gateway/secrets).
Les chemins d’identifiants pris en charge sont listés dans [SecretRef Credential Surface](/fr/reference/secretref-credential-surface).
</Accordion>

Voir [Environment](/fr/help/environment) pour la priorité complète et les sources.

## Référence complète

Pour la référence complète champ par champ, voir **[Configuration Reference](/fr/gateway/configuration-reference)**.

---

_Associé : [Configuration Examples](/fr/gateway/configuration-examples) · [Configuration Reference](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Associé

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Runbook Gateway](/fr/gateway)
