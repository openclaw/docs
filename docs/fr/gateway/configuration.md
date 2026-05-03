---
read_when:
    - Configurer OpenClaw pour la première fois
    - Recherche de modèles de configuration courants
    - Accéder à des sections de configuration spécifiques
summary: 'Vue d’ensemble de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-05-03T21:31:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`.
Le chemin de configuration actif doit être un fichier ordinaire. Les mises en page `openclaw.json`
sous forme de liens symboliques ne sont pas prises en charge pour les écritures gérées par OpenClaw ; une écriture atomique peut remplacer
le chemin au lieu de préserver le lien symbolique. Si vous conservez la configuration en dehors du
répertoire d’état par défaut, pointez `OPENCLAW_CONFIG_PATH` directement vers le fichier réel.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, les outils, le sandboxing ou l’automatisation (cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’UI

Consultez la [référence complète](/fr/gateway/configuration-reference) pour tous les champs disponibles.

Les agents et l’automatisation doivent utiliser `config.schema.lookup` pour obtenir la documentation exacte
au niveau des champs avant de modifier la configuration. Utilisez cette page pour des conseils orientés tâche et la
[référence de configuration](/fr/gateway/configuration-reference) pour la carte plus large
des champs et des valeurs par défaut.

<Tip>
**Vous découvrez la configuration ?** Commencez avec `openclaw onboard` pour une configuration interactive, ou consultez le guide [Exemples de configuration](/fr/gateway/configuration-examples) pour des configurations complètes à copier-coller.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (commandes en une ligne)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Ouvrez [http://127.0.0.1:18789](http://127.0.0.1:18789) et utilisez l’onglet **Configuration**.
    Le Control UI affiche un formulaire à partir du schéma de configuration actif, y compris les métadonnées
    de documentation `title` / `description` des champs, ainsi que les schémas des plugins et canaux lorsqu’ils sont
    disponibles, avec un éditeur **JSON brut** comme échappatoire. Pour les UI
    d’exploration détaillée et les autres outils, le Gateway expose aussi `config.schema.lookup` pour
    récupérer un nœud de schéma limité à un chemin, ainsi que les résumés de ses enfants immédiats.
  </Tab>
  <Tab title="Modification directe">
    Modifiez directement `~/.openclaw/openclaw.json`. Le Gateway surveille le fichier et applique automatiquement les modifications (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n’accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, les types mal formés ou les valeurs non valides empêchent le Gateway de **démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent attacher des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le JSON Schema canonique utilisé par le Control UI
et la validation. `config.schema.lookup` récupère un seul nœud limité à un chemin, ainsi que
des résumés d’enfants pour les outils d’exploration détaillée. Les métadonnées de documentation
`title`/`description` des champs sont propagées dans les objets imbriqués, les branches génériques (`*`),
les éléments de tableau (`[]`) et les branches `anyOf`/
`oneOf`/`allOf`. Les schémas de plugins et de canaux d’exécution sont fusionnés lorsque le
registre des manifestes est chargé.

Lorsque la validation échoue :

- Le Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

Le Gateway conserve une copie fiable du dernier bon état connu après chaque démarrage réussi,
mais le démarrage et le rechargement à chaud ne la restaurent pas automatiquement. Si `openclaw.json`
échoue à la validation (y compris la validation locale au plugin), le démarrage du Gateway échoue ou
le rechargement est ignoré et l’exécution actuelle conserve la dernière configuration acceptée.
Exécutez `openclaw doctor --fix` (ou `--yes`) pour réparer une configuration préfixée/écrasée ou
restaurer la copie du dernier bon état connu. La promotion vers le dernier bon état connu est ignorée lorsqu’un
candidat contient des espaces réservés de secrets masqués, comme `***`.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal dispose de sa propre section de configuration sous `channels.<provider>`. Consultez la page dédiée au canal pour les étapes de configuration :

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

    Tous les canaux partagent le même modèle de stratégie DM :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer les modèles">
    Définissez le modèle principal et les solutions de repli facultatives :

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
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction d’échelle des images de transcript/outils (par défaut `1200`) ; des valeurs plus basses réduisent généralement l’utilisation des jetons de vision lors des exécutions riches en captures d’écran.
    - Consultez [CLI des modèles](/fr/concepts/models) pour changer de modèle dans le chat et [basculement de modèle](/fr/concepts/model-failover) pour la rotation d’authentification et le comportement de repli.
    - Pour les fournisseurs personnalisés/auto-hébergés, consultez [fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès DM est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage à usage unique à approuver
    - `"allowlist"` : uniquement les expéditeurs dans `allowFrom` (ou dans le stockage d’autorisation appairé)
    - `"open"` : autoriser tous les DM entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les DM

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou des listes d’autorisation propres au canal.

    Consultez la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer le filtrage par mention dans les discussions de groupe">
    Les messages de groupe exigent par défaut une **mention obligatoire**. Configurez les motifs de déclenchement par agent, et conservez les réponses visibles dans le salon sur le chemin de l’outil de message par défaut, sauf si vous souhaitez intentionnellement les réponses finales automatiques héritées :

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **Mentions de métadonnées** : @-mentions natives (mention tactile WhatsApp, @bot Telegram, etc.)
    - **Motifs textuels** : motifs regex sûrs dans `mentionPatterns`
    - **Réponses visibles** : `messages.visibleReplies` peut exiger des envois via l’outil de message globalement ; `messages.groupChat.visibleReplies` remplace ce réglage pour les groupes/canaux.
    - Consultez la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour les modes de réponse visible, les remplacements par canal et le mode self-chat.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` pour une base partagée, puis remplacez-la pour des
    agents précis avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour des skills non restreints par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’avoir aucun skill.
    - Consultez [Skills](/fr/tools/skills), [configuration des Skills](/fr/tools/skills-config) et
      la [référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de santé des canaux du Gateway">
    Contrôlez l’agressivité avec laquelle le Gateway redémarre les canaux qui semblent obsolètes :

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

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages par surveillance de santé.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques pour un canal ou un compte sans désactiver la surveillance globale.
    - Consultez [contrôles de santé](/fr/gateway/health) pour le débogage opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Ajuster le délai d’attente de handshake WebSocket du Gateway">
    Donnez aux clients locaux plus de temps pour terminer le handshake WebSocket avant authentification sur
    des hôtes chargés ou peu puissants :

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - La valeur par défaut est `15000` millisecondes.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` conserve la priorité pour les remplacements ponctuels de service ou de shell.
    - Préférez d’abord corriger les blocages au démarrage ou dans la boucle d’événements ; ce réglage est destiné aux hôtes sains mais lents pendant le préchauffage.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l’isolation des conversations :

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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
    - `threadBindings` : valeurs par défaut globales pour le routage des sessions liées aux threads (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Consultez [gestion des sessions](/fr/concepts/session) pour la portée, les liens d’identité et la stratégie d’envoi.
    - Consultez la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le sandboxing">
    Exécutez les sessions d’agent dans des environnements d’exécution sandbox isolés :

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

    Construisez d’abord l’image — depuis un checkout source, exécutez `scripts/sandbox-setup.sh`, ou depuis une installation npm, consultez la commande `docker build` en ligne dans [Sandboxing § Images et configuration](/fr/gateway/sandboxing#images-and-setup).

    Consultez [Sandboxing](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer les notifications push via relais pour les builds iOS officielles">
    Les notifications push via relais sont configurées dans `openclaw.json`.

    Définissez ceci dans la configuration du gateway :

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Équivalent CLI :

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Effets :

    - Permet au gateway d’envoyer `push.test`, des impulsions de réveil et des réveils de reconnexion via le relais externe.
    - Utilise une autorisation d’envoi limitée à l’inscription, transmise par l’app iOS appairée. Le gateway n’a pas besoin d’un jeton de relais couvrant tout le déploiement.
    - Lie chaque inscription via relais à l’identité du gateway avec lequel l’app iOS a été appairée, de sorte qu’un autre gateway ne puisse pas réutiliser l’inscription stockée.
    - Conserve les builds iOS locales/manuelles sur APNs direct. Les envois via relais ne s’appliquent qu’aux builds distribuées officiellement qui se sont inscrites via le relais.
    - Doit correspondre à l’URL de base du relais intégrée dans la build iOS officielle/TestFlight, afin que le trafic d’inscription et d’envoi atteigne le même déploiement de relais.

    Flux de bout en bout :

    1. Installez une build iOS officielle/TestFlight compilée avec la même URL de base du relais.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur le gateway.
    3. Appairez l’app iOS au gateway et laissez les sessions de nœud et d’opérateur se connecter.
    4. L’app iOS récupère l’identité du gateway, s’inscrit auprès du relais avec App Attest plus le reçu de l’app, puis publie la charge utile `push.apns.register` via relais vers le gateway appairé.
    5. Le gateway stocke le handle de relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les impulsions de réveil et les réveils de reconnexion.

    Notes opérationnelles :

    - Si vous basculez l’app iOS vers un autre gateway, reconnectez l’app afin qu’elle puisse publier une nouvelle inscription de relais liée à ce gateway.
    - Si vous livrez une nouvelle build iOS qui pointe vers un autre déploiement de relais, l’app actualise son inscription de relais mise en cache au lieu de réutiliser l’ancienne origine de relais.

    Note de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements temporaires par variables d’environnement.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement limitée à loopback ; ne conservez pas d’URL de relais HTTP dans la configuration.

    Consultez [App iOS](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d’authentification et de confiance](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

  </Accordion>

  <Accordion title="Configurer Heartbeat (pointages périodiques)">
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

    - `every` : chaîne de durée (`30m`, `2h`). Définissez `0m` pour désactiver.
    - `target` : `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles Heartbeat de type DM
    - Consultez [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer les tâches Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention` : supprime les sessions d’exécution isolées terminées de `sessions.json` (par défaut `24h` ; définissez `false` pour désactiver).
    - `runLog` : limite `cron/runs/<jobId>.jsonl` par taille et par nombre de lignes conservées.
    - Consultez [Tâches Cron](/fr/automation/cron-jobs) pour la présentation de la fonctionnalité et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer les webhooks (hooks)">
    Activez les points de terminaison Webhook HTTP sur le Gateway :

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

    Note de sécurité :
    - Traitez tout le contenu des charges utiles hook/webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton Gateway partagé.
    - L’authentification des hooks se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont rejetés.
    - `hooks.path` ne peut pas être `/` ; conservez l’ingestion Webhook sur un sous-chemin dédié tel que `/hooks`.
    - Gardez les indicateurs de contournement de contenu non sécurisé désactivés (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), sauf pour un débogage strictement ciblé.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour limiter les clés de session choisies par l’appelant.
    - Pour les agents pilotés par hook, privilégiez des niveaux de modèle modernes et robustes ainsi qu’une politique d’outils stricte (par exemple messagerie uniquement, plus sandboxing lorsque possible).

    Consultez la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mappage et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec des espaces de travail et des sessions séparés :

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

    Consultez [Multi-Agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/config-agents#multi-agent-routing) pour les règles de liaison et les profils d’accès par agent.

  </Accordion>

  <Accordion title="Diviser la configuration en plusieurs fichiers ($include)">
    Utilisez `$include` pour organiser les grandes configurations :

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

    - **Fichier unique** : remplace l’objet contenant
    - **Tableau de fichiers** : fusion profonde dans l’ordre (le dernier l’emporte)
    - **Clés sœurs** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu’à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus par rapport au fichier qui inclut
    - **Écritures appartenant à OpenClaw** : lorsqu’une écriture ne modifie qu’une section de premier niveau
      adossée à une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture traversante non prise en charge** : les inclusions racine, les tableaux d’inclusion et les inclusions
      avec remplacements par clés sœurs échouent en mode fermé pour les écritures appartenant à OpenClaw au lieu
      d’aplatir la configuration
    - **Confinement** : les chemins `$include` doivent se résoudre sous le répertoire contenant
      `openclaw.json`. Pour partager une arborescence entre machines ou utilisateurs, définissez
      `OPENCLAW_INCLUDE_ROOTS` sur une liste de chemins (`:` sur POSIX, `;` sur Windows) de
      répertoires supplémentaires que les inclusions peuvent référencer. Les liens symboliques sont résolus
      et revérifiés, de sorte qu’un chemin qui se trouve lexicalement dans un répertoire de configuration mais dont
      la cible réelle sort de toutes les racines autorisées est toujours rejeté.
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, les erreurs d’analyse et les inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

Le Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications — aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes de fichier sont considérées comme non fiables jusqu’à leur validation. Le watcher attend
que les écritures temporaires/renommages de l’éditeur se stabilisent, lit le fichier final et rejette
les modifications externes invalides sans réécrire `openclaw.json`. Les écritures de configuration
appartenant à OpenClaw utilisent le même garde de schéma avant l’écriture ; les écrasements destructeurs tels que
la suppression de `gateway.mode` ou la réduction de plus de moitié de la taille du fichier sont rejetés et
enregistrés sous `.rejected.*` pour inspection.

Si vous voyez `config reload skipped (invalid config)` ou si le démarrage signale `Invalid
config`, inspectez la configuration, exécutez `openclaw config validate`, puis exécutez `openclaw
doctor --fix` pour réparer. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config)
pour la checklist.

### Modes de rechargement

| Mode                   | Comportement                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique à chaud les modifications sûres instantanément. Redémarre automatiquement pour les modifications critiques. |
| **`hot`**              | Applique à chaud uniquement les modifications sûres. Journalise un avertissement lorsqu’un redémarrage est nécessaire — vous le gérez. |
| **`restart`**          | Redémarre le Gateway à chaque modification de configuration, sûre ou non.               |
| **`off`**              | Désactive la surveillance des fichiers. Les modifications prennent effet au prochain redémarrage manuel. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s’applique à chaud et ce qui nécessite un redémarrage

La plupart des champs s’appliquent à chaud sans interruption. En mode `hybrid`, les modifications nécessitant un redémarrage sont gérées automatiquement.

| Catégorie           | Champs                                                            | Redémarrage nécessaire ? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canaux              | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et Plugin | Non             |
| Agent et modèles    | `agent`, `agents`, `models`, `routing`                            | Non             |
| Automatisation      | `hooks`, `cron`, `agent.heartbeat`                                | Non             |
| Sessions et messages | `session`, `messages`                                             | Non             |
| Outils et médias    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Non             |
| UI et divers        | `ui`, `logging`, `identity`, `bindings`                           | Non             |
| Serveur Gateway     | `gateway.*` (port, liaison, auth, tailscale, TLS, HTTP)           | **Oui**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Oui**         |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — leur modification ne déclenche **pas** de redémarrage.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé via `$include`, OpenClaw planifie
le rechargement à partir de la disposition écrite dans la source, et non de la vue
aplatie en mémoire. Cela rend les décisions de rechargement à chaud (application à chaud vs redémarrage)
prévisibles, même lorsqu’une seule section de premier niveau réside dans son propre
fichier inclus, comme `plugins: { $include: "./plugins.json5" }`. La planification
du rechargement échoue de façon fermée si la disposition source est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API Gateway, privilégiez ce flux :

- `config.schema.lookup` pour inspecter un sous-arbre (nœud de schéma superficiel + résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel plus `hash`
- `config.patch` pour les mises à jour partielles (correctif de fusion JSON : les objets fusionnent, `null`
  supprime, les tableaux remplacent)
- `config.apply` uniquement lorsque vous avez l’intention de remplacer toute la configuration
- `update.run` pour une auto-mise à jour explicite suivie d’un redémarrage ; incluez `continuationMessage` lorsque la session après redémarrage doit exécuter un tour de suivi
- `update.status` pour inspecter la dernière sentinelle de redémarrage de mise à jour et vérifier la version en cours d’exécution après un redémarrage

Les agents doivent considérer `config.schema.lookup` comme le premier point d’entrée pour la documentation
et les contraintes exactes au niveau des champs. Utilisez [Référence de configuration](/fr/gateway/configuration-reference)
lorsqu’ils ont besoin de la carte de configuration plus large, des valeurs par défaut ou de liens vers les références
dédiées des sous-systèmes.

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes toutes les 60 secondes par `deviceId+clientIp`. Les requêtes de
redémarrage sont regroupées, puis appliquent un temps de recharge de 30 secondes entre les cycles de redémarrage.
`update.status` est en lecture seule mais limité aux administrateurs, car la sentinelle de redémarrage peut
inclure des résumés d’étapes de mise à jour et des extraits de sortie de commande.
</Note>

Exemple de correctif partiel :

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` et `config.patch` acceptent tous deux `raw`, `baseHash`, `sessionKey`,
`note` et `restartDelayMs`. `baseHash` est requis pour les deux méthodes lorsqu’une
configuration existe déjà.

## Variables d’environnement

OpenClaw lit les variables d’environnement depuis le processus parent, ainsi que :

- `.env` depuis le répertoire de travail actuel (s’il existe)
- `~/.openclaw/.env` (solution de repli globale)

Aucun des deux fichiers ne remplace les variables d’environnement existantes. Vous pouvez aussi définir des variables d’environnement en ligne dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import d’environnement shell (facultatif)">
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

<Accordion title="Substitution de variables d’environnement dans les valeurs de configuration">
  Référencez des variables d’environnement dans toute valeur de chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Règles :

- Seuls les noms en majuscules correspondent : `[A-Z_][A-Z0-9_]*`
- Les variables manquantes/vides déclenchent une erreur au chargement
- Échappez avec `$${VAR}` pour une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution en ligne : `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Voir [Environnement](/fr/help/environment) pour la précédence et les sources complètes.

## Référence complète

Pour la référence complète champ par champ, consultez **[Référence de configuration](/fr/gateway/configuration-reference)**.

---

_Connexe : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Runbook Gateway](/fr/gateway)
