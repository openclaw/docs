---
read_when:
    - Connexion d’OpenClaw à un espace de travail ClickClack
    - Test des identités de bots ClickClack
summary: Configuration du canal ClickClack avec un jeton de bot et syntaxe des cibles
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T02:19:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connecte OpenClaw à un espace de travail ClickClack auto-hébergé au moyen de jetons de bot ClickClack pleinement pris en charge.

Utilisez cette intégration lorsque vous souhaitez qu’un agent OpenClaw apparaisse comme un utilisateur bot ClickClack. ClickClack prend en charge les bots de service indépendants et les bots appartenant à des utilisateurs ; ces derniers conservent un `owner_user_id` et reçoivent uniquement les portées de jeton que vous leur accordez.

## Configuration rapide

Créez un jeton de bot sur le serveur ClickClack :

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Pour un bot appartenant à un utilisateur, ajoutez `--owner <user_id>`.

Configurez OpenClaw :

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Exécutez ensuite :

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Un compte est considéré comme configuré uniquement lorsque `baseUrl`, `token` et `workspace` sont tous définis. `workspace` accepte un identifiant d’espace de travail (`wsp_...`), un slug ou un nom ; le Gateway le résout en identifiant au démarrage.

### Clés de configuration du compte

| Clé                     | Valeur par défaut       | Remarques                                                                                                                      |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `baseUrl`               | aucune (obligatoire)    | URL du serveur ClickClack.                                                                                                     |
| `token`                 | aucun (obligatoire)     | Chaîne en clair ou référence de secret (`source: "env" \| "file" \| "exec"`).                                                  |
| `workspace`             | aucun (obligatoire)     | Identifiant, slug ou nom de l’espace de travail.                                                                               |
| `replyMode`             | `"agent"`               | `"agent"` exécute le pipeline complet de l’agent ; `"model"` envoie de courtes réponses directes générées par le modèle.        |
| `defaultTo`             | `"channel:general"`     | Cible utilisée lorsqu’un chemin sortant ne fournit aucune cible.                                                               |
| `allowFrom`             | `["*"]`                 | Liste d’autorisation d’identifiants utilisateur pour les messages privés et les messages de canal entrants.                    |
| `botUserId`             | détecté automatiquement | Résolu à partir de l’identité du jeton de bot au démarrage.                                                                    |
| `agentId`               | valeur par défaut du routage | Associe les messages entrants de ce compte à un seul agent.                                                                |
| `toolsAllow`            | aucune                  | Liste d’autorisation des outils pour les réponses de l’agent provenant de ce compte.                                           |
| `model`, `systemPrompt` | aucun                   | Utilisés par les réponses générées avec `replyMode: "model"`.                                                                  |
| `reconnectMs`           | `1500`                  | Délai de reconnexion en temps réel (de 100 à 60000).                                                                           |

Si `plugins.allow` est une liste restrictive non vide, sélectionner explicitement
ClickClack pendant la configuration du canal ou exécuter `openclaw plugins enable clickclack`
ajoute `clickclack` à cette liste. L’installation lors de l’intégration initiale utilise le même
comportement de sélection explicite. Ces chemins ne remplacent pas `plugins.deny` ni un
paramètre global `plugins.enabled: false`. L’exécution directe de
`openclaw plugins install @openclaw/clickclack` suit la politique normale
d’installation des Plugins et enregistre également ClickClack dans une liste d’autorisation existante.

## Plusieurs bots

Chaque compte ouvre sa propre connexion ClickClack en temps réel et utilise son propre jeton de bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modes de réponse

- `replyMode: "agent"` (par défaut) transmet les messages entrants au pipeline normal de l’agent, notamment à l’enregistrement de session et à la politique d’utilisation des outils.
- `replyMode: "model"` contourne le pipeline de l’agent et utilise `llm.complete` de l’environnement d’exécution du Plugin pour produire de courtes réponses directes du bot, éventuellement adaptées par `model` et `systemPrompt`.

Le mode modèle exécute les générations avec l’identifiant résolu de l’agent du bot, ce qui nécessite
l’indicateur de confiance explicite `plugins.entries.clickclack.llm.allowAgentIdOverride: true` :

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Laissez l’indicateur de confiance désactivé si vous utilisez uniquement le mode de réponse
`agent` par défaut ; il n’est pas nécessaire dans ce cas.

Utilisez le mode `agent` pour obtenir des éléments de corrélation entre services. Pour un
identifiant de message ClickClack faisant autorité et ayant la forme canonique `msg_<ulid>`, le canal dérive
l’identifiant d’exécution OpenClaw déterministe `clickclack:<message-id>`. Chaque appel du modèle est
alors visible dans les diagnostics sous la forme `clickclack:<message-id>:model:<n>` ; lorsque cette
interaction utilise ClawRouter, le même identifiant d’appel du modèle est envoyé comme `X-Request-ID`.
Le mode `model` contourne les diagnostics normaux d’exécution et de session de l’agent et ne convient donc
pas à ce chemin de collecte de preuves.

Lorsqu’un événement en temps réel contient un `payload.correlation_id` validé, le
canal le transmet comme `X-Correlation-ID` lors de la récupération du message faisant autorité et
des requêtes de réponse ClickClack qui en résultent. Les valeurs utilisent le jeu sécurisé de
128 caractères de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` et `-`) ; les valeurs non valides
sont omises. Ces corrélations contiennent uniquement des identifiants, jamais le corps des messages,
les invites, les réponses générées, les identifiants d’authentification ni la sortie des outils.

## Lignes d’activité de l’agent

Par défaut, un canal ClickClack n’affiche rien pendant l’exécution d’une interaction de l’agent ; seule la réponse finale est publiée. Définissez `agentActivity: true` sur un compte pour publier des lignes de message durables `agent_commentary` et `agent_tool` pendant le déroulement de l’interaction :

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Exigences et comportement :

- **Désactivé par défaut.** Les configurations standard et les anciens serveurs ClickClack ne sont pas affectés.
- **Nécessite la portée de jeton `agent_activity:write`.** Cette portée est distincte de `bot:write` et n’en est pas héritée ; créez le jeton de bot avec `--scopes bot:write,agent_activity:write` (ou accordez cette portée à un jeton existant) avant d’activer l’option.
- **Dégradation au mieux.** Si le jeton ne possède pas `agent_activity:write` ou si le serveur refuse les écritures d’activité, les échecs sont consignés et la réponse finale est tout de même transmise normalement ; aucune ligne d’activité n’apparaît.
- Les lignes sont regroupées par interaction (`turn_id`) et fusionnées afin qu’une étape logique corresponde à une ligne ; les lignes d’outil utilisent la même mise en forme de progression que Discord, Slack et Telegram (nom de l’outil accompagné des détails de la commande).
- **Métadonnées d’attribution.** Les publications rédigées par l’agent (lignes d’activité et réponse finale) comportent les champs `author_model` et `author_thinking`, résolus à partir du modèle réellement utilisé pour l’interaction, y compris après un repli. Les serveurs qui ne définissent pas ces colonnes ignorent les champs JSON inconnus ; ceux qui les conservent peuvent déterminer, pour chaque message, « quel modèle a produit cette ligne et avec quel niveau de réflexion ».

## Cibles

- `channel:<name-or-id>` envoie le message à un canal de l’espace de travail. Les cibles sans préfixe utilisent `channel:` par défaut.
- `dm:<user_id>` crée ou réutilise une conversation directe avec cet utilisateur.
- `thread:<message_id>` répond dans le fil de discussion dont ce message constitue la racine.

Les cibles sortantes explicites peuvent également comporter le préfixe de fournisseur `clickclack:` ou `cc:`.

Exemples :

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorisations

Les portées des jetons ClickClack sont appliquées par l’API ClickClack.

- `bot:read` : lecture des données d’espace de travail, de canal, de message, de fil de discussion, de message privé, de temps réel et de profil.
- `bot:write` : `bot:read`, plus les messages de canal, les réponses dans les fils de discussion, les messages privés et les téléversements.
- `bot:admin` : `bot:write`, plus la création de canaux.
- `agent_activity:write` : lignes durables d’activité de l’agent (`agent_commentary` / `agent_tool`). Cette portée n’est héritée ni par `bot:write` ni par `bot:admin` ; elle est requise uniquement lorsque `agentActivity: true` est défini.

OpenClaw nécessite uniquement `bot:write` pour les conversations normales de l’agent. Ajoutez `agent_activity:write` lorsque vous activez les [lignes d’activité de l’agent](#agent-activity-rows).

## Dépannage

- `ClickClack is not configured for account "<id>"` : définissez `baseUrl`, `token` (par exemple au moyen de `CLICKCLACK_BOT_TOKEN`) et `workspace` pour ce compte.
- `ClickClack workspace not found: <value>` : définissez `workspace` sur l’identifiant, le slug ou le nom d’espace de travail renvoyé par ClickClack.
- Aucune réponse entrante : vérifiez que le jeton dispose d’un accès en lecture en temps réel et notez que le bot ignore ses propres messages ainsi que ceux des autres bots.
- Échec des envois dans les canaux : vérifiez que le bot est membre de l’espace de travail et qu’il possède `bot:write`.
