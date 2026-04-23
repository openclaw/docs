---
read_when:
    - Configurer OpenClaw pour la première fois
    - Rechercher des modèles de configuration courants
    - Accéder à des sections de configuration spécifiques
summary: 'Vue d’ensemble de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-04-23T07:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8130d29e9fbf5104d0a76f26b26186b6aab2b211030b8c8ba0d1131daf890993
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuration

OpenClaw lit une configuration facultative en <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> depuis `~/.openclaw/openclaw.json`.
Le chemin de configuration actif doit être un fichier ordinaire. Les dispositions
`openclaw.json` avec lien symbolique ne sont pas prises en charge pour les écritures
gérées par OpenClaw ; une écriture atomique peut remplacer le chemin au lieu de
préserver le lien symbolique. Si vous conservez la configuration en dehors du
répertoire d’état par défaut, pointez `OPENCLAW_CONFIG_PATH` directement vers le vrai fichier.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, les outils, l’isolation ou l’automatisation (Cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’interface

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
    La Control UI affiche un formulaire à partir du schéma de configuration actif, y compris les métadonnées de documentation des champs
    `title` / `description` ainsi que les schémas des plugins et des canaux lorsqu’ils
    sont disponibles, avec un éditeur **Raw JSON** comme solution d’échappement. Pour les interfaces
    de navigation détaillée et autres outils, le gateway expose aussi `config.schema.lookup` pour
    récupérer un nœud de schéma limité à un chemin ainsi que les résumés immédiats de ses enfants.
  </Tab>
  <Tab title="Édition directe">
    Modifiez directement `~/.openclaw/openclaw.json`. Le Gateway surveille le fichier et applique automatiquement les modifications (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n’accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, les types mal formés ou les valeurs invalides font que le Gateway **refuse de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent rattacher des métadonnées JSON Schema.
</Warning>

Remarques sur l’outillage du schéma :

- `openclaw config schema` affiche la même famille de JSON Schema utilisée par la Control UI
  et la validation de configuration.
- Considérez cette sortie de schéma comme le contrat lisible par machine canonique pour
  `openclaw.json` ; cette vue d’ensemble et la référence de configuration en donnent un résumé.
- Les valeurs `title` et `description` des champs sont reportées dans la sortie du schéma pour
  l’outillage des éditeurs et formulaires.
- Les entrées d’objet imbriqué, joker (`*`) et d’élément de tableau (`[]`) héritent des mêmes
  métadonnées de documentation lorsqu’il existe une documentation de champ correspondante.
- Les branches de composition `anyOf` / `oneOf` / `allOf` héritent aussi des mêmes métadonnées
  de documentation, afin que les variantes union/intersection conservent la même aide sur les champs.
- `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma
  superficiel (`title`, `description`, `type`, `enum`, `const`, bornes courantes
  et champs de validation similaires), les métadonnées d’indication UI correspondantes, et les résumés immédiats des enfants
  pour les outils de navigation détaillée.
- Les schémas runtime des plugins/canaux sont fusionnés lorsque le gateway peut charger le
  registre de manifestes actuel.
- `pnpm config:docs:check` détecte les dérives entre les artefacts de base de configuration orientés documentation
  et la surface actuelle du schéma.

Lorsque la validation échoue :

- Le Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

Le Gateway conserve aussi une copie fiable du dernier état valide après un démarrage réussi. Si
`openclaw.json` est ensuite modifié en dehors d’OpenClaw et n’est plus valide, le démarrage
et le rechargement à chaud préservent le fichier cassé sous la forme d’un instantané horodaté `.clobbered.*`,
restaurent la copie du dernier état valide et consignent un avertissement fort avec la raison de la récupération.
La récupération en lecture au démarrage traite aussi comme signatures critiques d’écrasement les fortes diminutions de taille, les métadonnées de configuration manquantes et l’absence de `gateway.mode` lorsque la
copie du dernier état valide contenait ces champs.
Si une ligne de statut/journal est accidentellement préfixée avant une configuration JSON par ailleurs valide,
le démarrage du gateway et `openclaw doctor --fix` peuvent supprimer le préfixe,
préserver le fichier pollué en `.clobbered.*`, puis continuer avec le JSON
récupéré.
Le prochain tour de l’agent principal reçoit aussi un avertissement par événement système lui indiquant que la
configuration a été restaurée et qu’elle ne doit pas être réécrite aveuglément. La promotion du dernier état valide
est mise à jour après un démarrage validé et après les rechargements à chaud acceptés, y compris
les écritures de configuration gérées par OpenClaw dont le hachage du fichier persisté correspond encore à l’écriture
acceptée. La promotion est ignorée lorsque le candidat contient des
placeholders secrets expurgés tels que `***` ou des valeurs de jeton raccourcies.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Consultez la page dédiée au canal pour les étapes de configuration :

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
    Définissez le modèle principal et les replis facultatifs :

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
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction des images du transcript/des outils (valeur par défaut `1200`) ; des valeurs plus faibles réduisent généralement l’usage des vision tokens dans les exécutions riches en captures d’écran.
    - Consultez [CLI Models](/fr/concepts/models) pour changer de modèle dans le chat et [Model Failover](/fr/concepts/model-failover) pour le comportement de rotation d’authentification et de repli.
    - Pour les providers personnalisés/autohébergés, consultez [Custom providers](/fr/gateway/configuration-reference#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès DM est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage à usage unique à approuver
    - `"allowlist"` : seuls les expéditeurs dans `allowFrom` (ou le magasin d’autorisations appairé)
    - `"open"` : autoriser tous les DM entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les DM

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou des listes d’autorisation spécifiques au canal.

    Consultez la [référence complète](/fr/gateway/configuration-reference#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer le filtrage par mention dans les chats de groupe">
    Les messages de groupe exigent par défaut une **mention requise**. Configurez des motifs par agent :

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
    - **Motifs textuels** : motifs regex sûrs dans `mentionPatterns`
    - Consultez la [référence complète](/fr/gateway/configuration-reference#group-chat-mention-gating) pour les remplacements par canal et le mode self-chat.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` pour une base partagée, puis remplacez des
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
          { id: "locked-down", skills: [] }, // aucune Skill
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour ne pas restreindre les Skills par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’avoir aucune Skill.
    - Consultez [Skills](/fr/tools/skills), [Skills config](/fr/tools/skills-config) et
      la [Référence de configuration](/fr/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de santé des canaux du gateway">
    Contrôlez l’agressivité avec laquelle le gateway redémarre les canaux qui semblent obsolètes :

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

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages du moniteur de santé.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques pour un canal ou un compte sans désactiver le moniteur global.
    - Consultez [Health Checks](/fr/gateway/health) pour le débogage opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

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

    - `dmScope` : `main` (partagé) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings` : valeurs globales par défaut pour le routage de session lié aux fils (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Consultez [Session Management](/fr/concepts/session) pour la portée, les liens d’identité et la politique d’envoi.
    - Consultez la [référence complète](/fr/gateway/configuration-reference#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer l’isolation">
    Exécutez les sessions d’agent dans des runtimes isolés :

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

    Consultez [Sandboxing](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/configuration-reference#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer le push adossé à un relais pour les builds iOS officiels">
    Le push adossé à un relais se configure dans `openclaw.json`.

    Définissez ceci dans la configuration du gateway :

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

    - Permet au gateway d’envoyer `push.test`, des incitations de réveil et des réveils de reconnexion via le relais externe.
    - Utilise une autorisation d’envoi limitée à l’enregistrement, transmise par l’application iOS appairée. Le gateway n’a pas besoin d’un jeton de relais à l’échelle du déploiement.
    - Lie chaque enregistrement adossé à un relais à l’identité du gateway avec laquelle l’application iOS a été appairée, de sorte qu’un autre gateway ne puisse pas réutiliser l’enregistrement stocké.
    - Conserve les builds iOS locaux/manuels sur APNs direct. Les envois adossés à un relais ne s’appliquent qu’aux builds officiels distribués qui se sont enregistrés via le relais.
    - Doit correspondre à l’URL de base du relais intégrée dans le build iOS officiel/TestFlight, afin que l’enregistrement et le trafic d’envoi atteignent le même déploiement de relais.

    Flux de bout en bout :

    1. Installez un build iOS officiel/TestFlight compilé avec la même URL de base de relais.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur le gateway.
    3. Appairez l’application iOS au gateway et laissez les sessions node et opérateur se connecter.
    4. L’application iOS récupère l’identité du gateway, s’enregistre auprès du relais à l’aide d’App Attest et du reçu de l’application, puis publie la payload `push.apns.register` adossée au relais au gateway appairé.
    5. Le gateway stocke le handle du relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les incitations de réveil et les réveils de reconnexion.

    Remarques opérationnelles :

    - Si vous faites passer l’application iOS à un autre gateway, reconnectez l’application afin qu’elle puisse publier un nouvel enregistrement de relais lié à ce gateway.
    - Si vous publiez un nouveau build iOS pointant vers un autre déploiement de relais, l’application actualise son enregistrement de relais en cache au lieu de réutiliser l’ancienne origine de relais.

    Remarque de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements temporaires via l’environnement.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement réservée à local loopback ; ne persistez pas d’URL de relais HTTP dans la configuration.

    Consultez [iOS App](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Authentication and trust flow](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

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
    - Consultez [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

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
    - `runLog` : purge `cron/runs/<jobId>.jsonl` selon la taille et le nombre de lignes conservées.
    - Consultez [Cron jobs](/fr/automation/cron-jobs) pour une vue d’ensemble de la fonctionnalité et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer les Webhooks (hooks)">
    Activez les points de terminaison HTTP Webhook sur le Gateway :

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
    - Traitez tout le contenu des payloads hook/Webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton partagé du Gateway.
    - L’authentification hook se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont rejetés.
    - `hooks.path` ne peut pas être `/` ; conservez l’entrée Webhook sur un sous-chemin dédié tel que `/hooks`.
    - Gardez les drapeaux de contournement de contenu non sûr désactivés (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sauf en cas de débogage strictement limité.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour borner les clés de session choisies par l’appelant.
    - Pour les agents pilotés par hook, privilégiez les niveaux de modèles modernes robustes et une politique d’outils stricte (par exemple, messagerie uniquement plus isolation lorsque c’est possible).

    Consultez la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mapping et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec des espaces de travail et des sessions séparés :

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

    Consultez [Multi-Agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/configuration-reference#multi-agent-routing) pour les règles de liaison et les profils d’accès par agent.

  </Accordion>

  <Accordion title="Scinder la configuration en plusieurs fichiers ($include)">
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
    - **Clés sœurs** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu’à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus relativement au fichier incluant
    - **Écritures gérées par OpenClaw** : lorsqu’une écriture ne modifie qu’une seule section de niveau supérieur
      adossée à une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture traversante non prise en charge** : les inclusions racine, les tableaux d’inclusions et les inclusions
      avec remplacements par clés sœurs échouent de manière fermée pour les écritures gérées par OpenClaw au lieu
      d’aplatir la configuration
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, les erreurs d’analyse et les inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

Le Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications — aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont traitées comme non fiables tant qu’elles ne sont pas validées. Le watcher attend
que les écritures temporaires/renommages de l’éditeur se stabilisent, lit le fichier final et rejette
les modifications externes invalides en restaurant la configuration du dernier état valide. Les écritures de configuration
gérées par OpenClaw utilisent la même barrière de schéma avant écriture ; les écrasements destructeurs tels
que la suppression de `gateway.mode` ou la réduction du fichier de plus de moitié sont rejetés
et enregistrés sous `.rejected.*` pour inspection.

Si vous voyez `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` dans les journaux, inspectez le fichier
`.clobbered.*` correspondant à côté de `openclaw.json`, corrigez la payload rejetée, puis exécutez
`openclaw config validate`. Consultez [Gateway troubleshooting](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config)
pour la checklist de récupération.

### Modes de rechargement

| Mode                   | Comportement                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique à chaud immédiatement les changements sûrs. Redémarre automatiquement pour les changements critiques. |
| **`hot`**              | Applique à chaud uniquement les changements sûrs. Consigne un avertissement lorsqu’un redémarrage est nécessaire — à vous de le gérer. |
| **`restart`**          | Redémarre le Gateway à chaque modification de configuration, sûre ou non.             |
| **`off`**              | Désactive la surveillance du fichier. Les modifications prennent effet au prochain redémarrage manuel. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s’applique à chaud vs ce qui nécessite un redémarrage

La plupart des champs s’appliquent à chaud sans interruption. En mode `hybrid`, les changements nécessitant un redémarrage sont gérés automatiquement.

| Catégorie            | Champs                                                            | Redémarrage nécessaire ? |
| ------------------- | ----------------------------------------------------------------- | ------------------------ |
| Canaux              | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et fournis par Plugin | Non             |
| Agent et modèles    | `agent`, `agents`, `models`, `routing`                            | Non                      |
| Automatisation      | `hooks`, `cron`, `agent.heartbeat`                                | Non                      |
| Sessions et messages | `session`, `messages`                                            | Non                      |
| Outils et médias    | `tools`, `browser`, `skills`, `audio`, `talk`                     | Non                      |
| UI et divers        | `ui`, `logging`, `identity`, `bindings`                           | Non                      |
| Serveur Gateway     | `gateway.*` (port, liaison, auth, Tailscale, TLS, HTTP)           | **Oui**                  |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Oui**                  |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — les modifier ne déclenche **pas** de redémarrage.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé via `$include`, OpenClaw planifie
le rechargement à partir de la disposition rédigée dans la source, et non depuis la vue mémoire aplatie.
Cela permet de garder prévisibles les décisions de rechargement à chaud (application à chaud vs redémarrage) même lorsqu’une
seule section de niveau supérieur vit dans son propre fichier inclus, comme
`plugins: { $include: "./plugins.json5" }`.

Si un rechargement ne peut pas être planifié en toute sécurité — par exemple parce que la disposition source
combine des inclusions racine avec des remplacements par clés sœurs — OpenClaw échoue de manière fermée, consigne la
raison et laisse la configuration actuellement active en place afin que vous puissiez corriger la
forme source au lieu de retomber silencieusement sur un rechargement aplati.

## RPC de configuration (mises à jour programmatiques)

<Note>
Les RPC d’écriture du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont limités à **3 requêtes par 60 secondes** par `deviceId+clientIp`. En cas de limitation, le RPC renvoie `UNAVAILABLE` avec `retryAfterMs`.
</Note>

Flux sûr/par défaut :

- `config.schema.lookup` : inspecter un sous-arbre de configuration limité à un chemin avec un nœud de schéma superficiel,
  les métadonnées d’indication correspondantes et les résumés immédiats des enfants
- `config.get` : récupérer l’instantané actuel + le hash
- `config.patch` : chemin préféré pour les mises à jour partielles
- `config.apply` : remplacement intégral de la configuration uniquement
- `update.run` : auto-mise à jour explicite + redémarrage

Lorsque vous ne remplacez pas l’intégralité de la configuration, préférez `config.schema.lookup`
puis `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (remplacement intégral)">
    Valide + écrit la configuration complète et redémarre le Gateway en une seule étape.

    <Warning>
    `config.apply` remplace la **configuration entière**. Utilisez `config.patch` pour les mises à jour partielles, ou `openclaw config set` pour des clés isolées.
    </Warning>

    Paramètres :

    - `raw` (string) — payload JSON5 pour l’ensemble de la configuration
    - `baseHash` (facultatif) — hash de configuration issu de `config.get` (requis lorsque la configuration existe)
    - `sessionKey` (facultatif) — clé de session pour le ping de réveil après redémarrage
    - `note` (facultatif) — note pour le marqueur de redémarrage
    - `restartDelayMs` (facultatif) — délai avant redémarrage (par défaut 2000)

    Les demandes de redémarrage sont regroupées lorsqu’un redémarrage est déjà en attente/en cours, et un délai de récupération de 30 secondes s’applique entre les cycles de redémarrage.

    ```bash
    openclaw gateway call config.get --params '{}'  # capturer payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (mise à jour partielle)">
    Fusionne une mise à jour partielle dans la configuration existante (sémantique JSON merge patch) :

    - Les objets fusionnent récursivement
    - `null` supprime une clé
    - Les tableaux sont remplacés

    Paramètres :

    - `raw` (string) — JSON5 avec uniquement les clés à modifier
    - `baseHash` (requis) — hash de configuration issu de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — identiques à `config.apply`

    Le comportement de redémarrage correspond à `config.apply` : regroupement des redémarrages en attente plus délai de récupération de 30 secondes entre les cycles de redémarrage.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variables d’environnement

OpenClaw lit les variables d’environnement à partir du processus parent ainsi que :

- `.env` depuis le répertoire de travail actuel (s’il existe)
- `~/.openclaw/.env` (repli global)

Aucun des deux fichiers ne remplace les variables d’environnement existantes. Vous pouvez aussi définir des variables d’environnement inline dans la configuration :

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

Équivalent via variable d’environnement : `OPENCLAW_LOAD_SHELL_ENV=1`
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
- Fonctionne à l’intérieur des fichiers `$include`
- Substitution inline : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références secrètes (env, file, exec)">
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

Consultez [Environment](/fr/help/environment) pour la priorité complète et les sources.

## Référence complète

Pour la référence complète champ par champ, consultez **[Configuration Reference](/fr/gateway/configuration-reference)**.

---

_Liens connexes : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_
