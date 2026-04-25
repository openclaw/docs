---
read_when:
    - Configurer OpenClaw pour la première fois
    - Recherche de modèles de configuration courants
    - Navigation vers des sections de configuration spécifiques
summary: 'Aperçu de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-04-25T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`.
Le chemin de configuration actif doit être un fichier classique. Les dispositions
`openclaw.json` sous forme de lien symbolique ne sont pas prises en charge pour les écritures gérées par OpenClaw ; une écriture atomique peut remplacer
le chemin au lieu de préserver le lien symbolique. Si vous conservez la configuration en dehors du
répertoire d’état par défaut, pointez `OPENCLAW_CONFIG_PATH` directement vers le fichier réel.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Voici les raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, outils, le sandboxing ou l’automatisation (Cron, Hooks)
- Ajuster les sessions, les médias, le réseau ou l’interface utilisateur

Consultez la [référence complète](/fr/gateway/configuration-reference) pour tous les champs disponibles.

<Tip>
**Vous débutez avec la configuration ?** Commencez par `openclaw onboard` pour une configuration interactive, ou consultez le guide [Exemples de configuration](/fr/gateway/configuration-examples) pour des configurations complètes prêtes à copier-coller.
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
    Control UI affiche un formulaire à partir du schéma de configuration en direct, y compris les métadonnées de documentation
    `title` / `description` des champs ainsi que les schémas de Plugin et de canal lorsqu’ils sont
    disponibles, avec un éditeur **Raw JSON** comme solution de secours. Pour les interfaces
    d’exploration détaillée et autres outils, la Gateway expose également `config.schema.lookup` pour
    récupérer un nœud de schéma limité à un chemin ainsi qu’un résumé immédiat de ses enfants.
  </Tab>
  <Tab title="Modification directe">
    Modifiez directement `~/.openclaw/openclaw.json`. La Gateway surveille le fichier et applique automatiquement les modifications (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n’accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, types mal formés ou valeurs invalides font que la Gateway **refuse de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent attacher des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le JSON Schema canonique utilisé par Control UI
et par la validation. `config.schema.lookup` récupère un seul nœud limité à un chemin ainsi qu’un
résumé de ses enfants pour les outils d’exploration. Les métadonnées de documentation `title`/`description`
des champs se propagent aux objets imbriqués, aux jokers (`*`), aux éléments de tableau (`[]`) et aux branches `anyOf`/
`oneOf`/`allOf`. Les schémas runtime des plugins et des canaux sont fusionnés lorsque le
registre de manifestes est chargé.

Lorsque la validation échoue :

- La Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

La Gateway conserve une copie fiable du dernier état valide après chaque démarrage réussi.
Si `openclaw.json` échoue ensuite à la validation (ou supprime `gateway.mode`, rétrécit
fortement, ou contient une ligne de journal parasite en préfixe), OpenClaw préserve le fichier
cassé sous `.clobbered.*`, restaure la dernière copie valide connue, et consigne la raison de la récupération.
Le tour d’agent suivant reçoit également un avertissement sous forme d’événement système afin que l’agent
principal ne réécrive pas aveuglément la configuration restaurée. La promotion au statut de dernière version valide connue
est ignorée lorsqu’un candidat contient des espaces réservés de secrets expurgés tels que `***`.
Lorsque chaque problème de validation est limité à `plugins.entries.<id>...`, OpenClaw
n’effectue pas de récupération du fichier complet. Il garde la configuration actuelle active et
signale l’échec local au plugin afin qu’un schéma de Plugin ou une incompatibilité de version hôte
ne puisse pas annuler des paramètres utilisateur sans rapport.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Consultez la page dédiée du canal pour les étapes de configuration :

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

    Tous les canaux partagent le même modèle de politique de messages privés :

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
    Définissez le modèle principal et les remplacements facultatifs :

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
    - Les références de modèle utilisent le format `provider/model` (par exemple `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction d’échelle des images de transcript/outil (par défaut `1200`) ; des valeurs plus faibles réduisent généralement l’usage des jetons de vision dans les exécutions riches en captures d’écran.
    - Consultez [CLI Models](/fr/concepts/models) pour changer de modèle dans le chat et [Model Failover](/fr/concepts/model-failover) pour la rotation d’authentification et le comportement de repli.
    - Pour les fournisseurs personnalisés/autohébergés, voir [Fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès aux messages privés est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage à usage unique à approuver
    - `"allowlist"` : seuls les expéditeurs dans `allowFrom` (ou le stockage d’autorisations appairées)
    - `"open"` : autoriser tous les messages privés entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les messages privés

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou des listes d’autorisation spécifiques au canal.

    Consultez la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer l’exigence de mention dans les conversations de groupe">
    Les messages de groupe exigent par défaut une **mention**. Configurez les motifs par agent :

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

    - **Mentions de métadonnées** : @-mentions natives (WhatsApp tap-to-mention, Telegram @bot, etc.)
    - **Motifs texte** : motifs regex sûrs dans `mentionPatterns`
    - Consultez la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour les remplacements par canal et le mode auto-conversation.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` comme base partagée, puis remplacez des
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
          { id: "locked-down", skills: [] }, // aucune skill
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour des Skills non restreintes par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’avoir aucune skill.
    - Consultez [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config), et
      la [Référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de santé des canaux de la Gateway">
    Contrôlez à quel point la Gateway redémarre agressivement les canaux qui semblent inactifs :

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

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages de surveillance de santé.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques d’un seul canal ou compte sans désactiver la surveillance globale.
    - Consultez [Health Checks](/fr/gateway/health) pour le débogage opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

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

    - `dmScope`: `main` (partagé) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valeurs globales par défaut pour le routage de session lié aux fils (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Consultez [Gestion de session](/fr/concepts/session) pour la portée, les liens d’identité et la politique d’envoi.
    - Consultez la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le sandboxing">
    Exécutez les sessions d’agent dans des runtimes sandboxés isolés :

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

    Construisez d’abord l’image : `scripts/sandbox-setup.sh`

    Consultez [Sandboxing](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer le push via relais pour les builds iOS officiels">
    Le push via relais se configure dans `openclaw.json`.

    Définissez ceci dans la configuration de la Gateway :

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

    - Permet à la Gateway d’envoyer `push.test`, des signaux de réveil et des réveils de reconnexion via le relais externe.
    - Utilise une autorisation d’envoi limitée à l’enregistrement, transmise par l’application iOS appairée. La Gateway n’a pas besoin d’un jeton de relais valable pour tout le déploiement.
    - Lie chaque enregistrement via relais à l’identité Gateway avec laquelle l’application iOS a été appairée, afin qu’une autre Gateway ne puisse pas réutiliser l’enregistrement stocké.
    - Conserve les builds iOS locaux/manuels sur APNs direct. Les envois via relais s’appliquent uniquement aux builds officiels distribués qui se sont enregistrés via le relais.
    - Doit correspondre à l’URL de base du relais intégrée dans le build iOS officiel/TestFlight, afin que l’enregistrement et le trafic d’envoi atteignent le même déploiement de relais.

    Flux de bout en bout :

    1. Installez un build iOS officiel/TestFlight compilé avec la même URL de base de relais.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur la Gateway.
    3. Appairez l’application iOS à la Gateway et laissez les sessions node et operator se connecter.
    4. L’application iOS récupère l’identité de la Gateway, s’enregistre auprès du relais à l’aide d’App Attest et du reçu de l’application, puis publie la charge utile `push.apns.register` via relais vers la Gateway appairée.
    5. La Gateway stocke le handle de relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les signaux de réveil et les réveils de reconnexion.

    Remarques opérationnelles :

    - Si vous basculez l’application iOS vers une autre Gateway, reconnectez l’application pour qu’elle puisse publier un nouvel enregistrement de relais lié à cette Gateway.
    - Si vous publiez un nouveau build iOS pointant vers un autre déploiement de relais, l’application actualise son enregistrement de relais en cache au lieu de réutiliser l’ancienne origine de relais.

    Remarque de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements temporaires via variables d’environnement.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement réservée au loopback ; ne conservez pas d’URL de relais HTTP dans la configuration.

    Voir [Application iOS](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d’authentification et de confiance](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

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
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles Heartbeat de type message privé
    - Voir [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer des tâches Cron">
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
    - `runLog` : nettoie `cron/runs/<jobId>.jsonl` selon la taille et le nombre de lignes conservées.
    - Voir [Tâches Cron](/fr/automation/cron-jobs) pour l’aperçu de la fonctionnalité et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer des Webhooks (Hooks)">
    Activer les points de terminaison Webhook HTTP sur la Gateway :

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
    - Traitez tout le contenu des charges utiles hook/webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton Gateway partagé.
    - L’authentification des Hooks se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont rejetés.
    - `hooks.path` ne peut pas être `/` ; conservez l’entrée webhook sur un sous-chemin dédié tel que `/hooks`.
    - Laissez désactivés les indicateurs de contournement de contenu non sûr (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sauf pour un débogage strictement ciblé.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` afin de limiter les clés de session choisies par l’appelant.
    - Pour les agents pilotés par Hook, privilégiez des niveaux de modèles modernes et robustes ainsi qu’une politique d’outils stricte (par exemple messagerie uniquement plus sandboxing lorsque possible).

    Voir la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mapping et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécuter plusieurs agents isolés avec des workspaces et sessions séparés :

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

    Voir [Multi-Agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/config-agents#multi-agent-routing) pour les règles de binding et les profils d’accès par agent.

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
    - **Clés sœurs** : fusionnées après les inclusions (écrasent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu’à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus par rapport au fichier incluant
    - **Écritures gérées par OpenClaw** : lorsqu’une écriture ne modifie qu’une section de premier niveau
      adossée à une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture traversante non prise en charge** : les inclusions racine, tableaux d’inclusion et inclusions
      avec remplacements par clés sœurs échouent de manière sûre pour les écritures gérées par OpenClaw au lieu
      d’aplatir la configuration
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, erreurs d’analyse et inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

La Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications — aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont traitées comme non fiables jusqu’à leur validation. Le watcher attend
que l’agitation d’écriture temporaire/de renommage de l’éditeur se stabilise, lit le fichier final, et rejette
les modifications externes invalides en restaurant la dernière configuration valide connue. Les écritures de configuration
gérées par OpenClaw utilisent la même barrière de schéma avant écriture ; les écrasements destructeurs tels
que la suppression de `gateway.mode` ou la réduction de plus de moitié de la taille du fichier sont rejetés
et enregistrés sous `.rejected.*` pour inspection.

Les échecs de validation locaux aux plugins constituent l’exception : si tous les problèmes se trouvent sous
`plugins.entries.<id>...`, le rechargement conserve la configuration actuelle et signale le problème du plugin
au lieu de restaurer `.last-good`.

Si vous voyez `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` dans les journaux, inspectez le fichier
`.clobbered.*` correspondant à côté de `openclaw.json`, corrigez la charge utile rejetée, puis exécutez
`openclaw config validate`. Voir [Dépannage de la Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config)
pour la checklist de récupération.

### Modes de rechargement

| Mode                   | Comportement                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique à chaud immédiatement les modifications sûres. Redémarre automatiquement pour les modifications critiques.           |
| **`hot`**              | Applique à chaud uniquement les modifications sûres. Consigne un avertissement lorsqu’un redémarrage est nécessaire — à vous de le gérer. |
| **`restart`**          | Redémarre la Gateway à chaque modification de configuration, sûre ou non.                                 |
| **`off`**              | Désactive la surveillance du fichier. Les modifications prennent effet au prochain redémarrage manuel.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s’applique à chaud vs ce qui nécessite un redémarrage

La plupart des champs s’appliquent à chaud sans interruption. En mode `hybrid`, les modifications nécessitant un redémarrage sont gérées automatiquement.

| Catégorie            | Champs                                                            | Redémarrage nécessaire ? |
| ------------------- | ----------------------------------------------------------------- | ----------------------- |
| Canaux            | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et de plugins | Non              |
| Agent et modèles      | `agent`, `agents`, `models`, `routing`                            | Non              |
| Automatisation          | `hooks`, `cron`, `agent.heartbeat`                                | Non              |
| Sessions et messages | `session`, `messages`                                             | Non              |
| Outils et médias       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Non              |
| UI et divers           | `ui`, `logging`, `identity`, `bindings`                           | Non              |
| Serveur Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Oui**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Oui**         |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — les modifier **ne** déclenche **pas** de redémarrage.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé via `$include`, OpenClaw planifie
le rechargement à partir de la structure rédigée dans la source, et non de la vue en mémoire aplatie.
Cela garde les décisions de rechargement à chaud (application à chaud vs redémarrage) prévisibles même lorsqu’une
section unique de premier niveau vit dans son propre fichier inclus tel que
`plugins: { $include: "./plugins.json5" }`. La planification du rechargement échoue de manière sûre si la
structure source est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API Gateway, privilégiez ce flux :

- `config.schema.lookup` pour inspecter un sous-arbre (nœud de schéma superficiel + résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel plus le `hash`
- `config.patch` pour les mises à jour partielles (JSON merge patch : les objets fusionnent, `null`
  supprime, les tableaux remplacent)
- `config.apply` uniquement lorsque vous souhaitez remplacer toute la configuration
- `update.run` pour une auto-mise à jour explicite plus redémarrage

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes par 60 secondes par `deviceId+clientIp`. Les requêtes de redémarrage
sont fusionnées puis imposent un délai de récupération de 30 secondes entre les cycles de redémarrage.
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

OpenClaw lit les variables d’environnement du processus parent ainsi que :

- `.env` depuis le répertoire de travail actuel (si présent)
- `~/.openclaw/.env` (repli global)

Aucun de ces fichiers ne remplace des variables d’environnement existantes. Vous pouvez également définir des variables d’environnement inline dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import des variables d’environnement du shell (optionnel)">
  Si cette option est activée et que les clés attendues ne sont pas définies, OpenClaw exécute votre shell de connexion et n’importe que les clés manquantes :

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

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`
- Les variables manquantes/vides provoquent une erreur au chargement
- Échappez avec `$${VAR}` pour une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution inline : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références de secrets (env, file, exec)">
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

Les détails de SecretRef (y compris `secrets.providers` pour `env`/`file`/`exec`) se trouvent dans [Gestion des secrets](/fr/gateway/secrets).
Les chemins d’identifiants pris en charge sont listés dans [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Accordion>

Voir [Environnement](/fr/help/environment) pour l’ordre de priorité complet et les sources.

## Référence complète

Pour la référence complète champ par champ, consultez **[Référence de configuration](/fr/gateway/configuration-reference)**.

---

_Associé : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Liens associés

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Runbook de la Gateway](/fr/gateway)
