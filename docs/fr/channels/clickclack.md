---
read_when:
    - Connexion d’OpenClaw à un espace de travail ClickClack
    - Test des identités de bots ClickClack
summary: Configuration du canal ClickClack avec un jeton de bot et syntaxe des cibles
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T15:02:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connecte OpenClaw à un espace de travail ClickClack auto-hébergé au moyen de jetons de bot ClickClack pris en charge nativement.

Utilisez cette intégration lorsque vous souhaitez qu’un agent OpenClaw apparaisse comme un utilisateur bot ClickClack. ClickClack prend en charge les bots de service indépendants et les bots appartenant à des utilisateurs ; les bots appartenant à des utilisateurs conservent un `owner_user_id` et reçoivent uniquement les portées de jeton que vous leur accordez.

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

| Clé                     | Valeur par défaut       | Remarques                                                                                                          |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `baseUrl`               | aucune (obligatoire)    | URL du serveur ClickClack.                                                                                         |
| `token`                 | aucun (obligatoire)     | Chaîne en clair ou référence de secret (`source: "env" \| "file" \| "exec"`).                                      |
| `workspace`             | aucun (obligatoire)     | Identifiant, slug ou nom de l’espace de travail.                                                                   |
| `replyMode`             | `"agent"`               | `"agent"` exécute le pipeline d’agent complet ; `"model"` envoie de courtes complétions directes du modèle.        |
| `defaultTo`             | `"channel:general"`     | Cible utilisée lorsqu’un chemin sortant ne fournit aucune cible.                                                   |
| `allowFrom`             | `["*"]`                 | Liste d’autorisation d’identifiants utilisateur pour les messages privés et les messages de canal entrants.       |
| `botUserId`             | détecté automatiquement | Résolu à partir de l’identité du jeton de bot au démarrage.                                                        |
| `agentId`               | valeur par défaut du routage | Associe les messages entrants de ce compte à un seul agent.                                                    |
| `toolsAllow`            | aucune                  | Liste d’autorisation des outils pour les réponses d’agent provenant de ce compte.                                 |
| `model`, `systemPrompt` | aucun                   | Utilisés par les complétions avec `replyMode: "model"`.                                                            |
| `reconnectMs`           | `1500`                  | Délai de reconnexion en temps réel (100 à 60000).                                                                  |

Si `plugins.allow` est une liste restrictive non vide, la sélection explicite de
ClickClack dans la configuration des canaux ou l’exécution de `openclaw plugins enable clickclack`
ajoute `clickclack` à cette liste. L’installation lors de l’intégration initiale utilise le même
comportement de sélection explicite. Ces chemins ne remplacent pas `plugins.deny` ni un
paramètre global `plugins.enabled: false`. L’exécution directe de
`openclaw plugins install @openclaw/clickclack` suit la politique normale
d’installation des Plugins et enregistre également ClickClack dans une liste d’autorisation existante.

## Plusieurs bots

Chaque compte ouvre sa propre connexion en temps réel à ClickClack et utilise son propre jeton de bot.

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

- `replyMode: "agent"` (par défaut) distribue les messages entrants via le pipeline d’agent normal, y compris l’enregistrement de session et la politique d’utilisation des outils.
- `replyMode: "model"` contourne le pipeline d’agent et utilise `llm.complete` de l’environnement d’exécution du Plugin pour de courtes réponses directes du bot (éventuellement configurées par `model` et `systemPrompt`).

Le mode modèle exécute les complétions avec l’identifiant résolu de l’agent du bot, ce qui nécessite
le paramètre de confiance explicite `plugins.entries.clickclack.llm.allowAgentIdOverride: true` :

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

Laissez le paramètre de confiance désactivé si vous utilisez uniquement le mode de réponse `agent`
par défaut ; il n’est pas nécessaire dans ce cas.

Utilisez le mode `agent` pour obtenir des éléments de corrélation entre services. Pour un
identifiant de message ClickClack faisant autorité dans son format canonique `msg_<ulid>`, le canal
dérive l’identifiant d’exécution OpenClaw déterministe `clickclack:<message-id>`. Chaque appel de modèle est
alors visible dans les diagnostics sous la forme `clickclack:<message-id>:model:<n>` ; lorsque ce
tour utilise ClawRouter, le même identifiant d’appel de modèle est envoyé comme `X-Request-ID`.
Le mode `model` contourne les diagnostics normaux d’exécution et de session de l’agent et ne convient donc
pas à ce chemin de collecte d’éléments de corrélation.

Lorsqu’un événement en temps réel contient un `payload.correlation_id` validé, le
canal le transmet comme `X-Correlation-ID` lors de la récupération du message faisant autorité et
des requêtes de réponse ClickClack qui en résultent. Les valeurs utilisent le jeu sécurisé de
128 caractères de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` et `-`) ; les valeurs non valides
sont omises. Ces jointures contiennent uniquement des identifiants, jamais le corps des messages,
les invites, les complétions, les identifiants d’authentification ni la sortie des outils.

## Lignes d’activité de l’agent

Par défaut, un canal ClickClack n’affiche rien pendant l’exécution d’un tour d’agent ; seule la réponse finale est publiée. Définissez `agentActivity: true` sur un compte pour publier des lignes de message persistantes `agent_commentary` et `agent_tool` pendant le déroulement du tour :

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

- **Désactivé par défaut.** Les configurations standard et les anciens serveurs ClickClack restent inchangés.
- **Nécessite la portée de jeton `agent_activity:write`.** Cette portée est distincte de `bot:write` et n’en est pas héritée ; créez le jeton de bot avec `--scopes bot:write,agent_activity:write` (ou accordez la portée à un jeton existant) avant d’activer l’option.
- **Dégradation sans garantie.** Si le jeton ne dispose pas de `agent_activity:write` ou si le serveur rejette les écritures d’activité, les échecs sont consignés et la réponse finale est tout de même distribuée normalement ; aucune ligne d’activité n’apparaît.
- Les lignes sont regroupées par tour (`turn_id`) et fusionnées afin qu’une étape logique corresponde à une seule ligne ; les lignes d’outil utilisent le même formatage de progression que Discord/Slack/Telegram (nom de l’outil accompagné des détails de la commande).
- **Métadonnées d’attribution.** Les publications rédigées par l’agent (lignes d’activité et réponse finale) comportent les champs `author_model` et `author_thinking`, résolus à partir du modèle réellement utilisé pour le tour (y compris après un repli). Les serveurs qui ne définissent pas ces colonnes ignorent les champs JSON inconnus ; ceux qui les conservent peuvent déterminer « quel modèle a produit cette ligne et avec quel niveau de réflexion » pour chaque message.

## Cibles

- `channel:<name-or-id>` envoie le message à un canal de l’espace de travail. Les cibles sans préfixe utilisent `channel:` par défaut.
- `dm:<user_id>` crée ou réutilise une conversation directe avec cet utilisateur.
- `thread:<message_id>` répond dans le fil de discussion dont ce message est la racine.

Les cibles sortantes explicites peuvent également comporter le préfixe de fournisseur `clickclack:` ou `cc:`.

Exemples :

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorisations

Les portées des jetons ClickClack sont appliquées par l’API ClickClack.

- `bot:read` : lire les données de l’espace de travail, des canaux, des messages, des fils de discussion, des messages privés, du temps réel et des profils.
- `bot:write` : `bot:read`, ainsi que les messages de canal, les réponses dans les fils de discussion, les messages privés et les téléversements.
- `bot:admin` : `bot:write`, ainsi que la création de canaux.
- `agent_activity:write` : lignes persistantes d’activité de l’agent (`agent_commentary` / `agent_tool`). Non héritée de `bot:write` ni de `bot:admin` ; requise uniquement lorsque `agentActivity: true` est défini.

OpenClaw nécessite uniquement `bot:write` pour les conversations normales avec l’agent. Ajoutez `agent_activity:write` lorsque vous activez les [lignes d’activité de l’agent](#agent-activity-rows).

## Résolution des problèmes

- `ClickClack is not configured for account "<id>"` : définissez `baseUrl`, `token` (par exemple au moyen de `CLICKCLACK_BOT_TOKEN`) et `workspace` pour ce compte.
- `ClickClack workspace not found: <value>` : définissez `workspace` sur l’identifiant, le slug ou le nom de l’espace de travail renvoyé par ClickClack.
- Aucune réponse entrante : vérifiez que le jeton dispose d’un accès en lecture en temps réel et notez que le bot ignore ses propres messages ainsi que ceux des autres bots.
- Échec des envois vers les canaux : vérifiez que le bot est membre de l’espace de travail et dispose de `bot:write`.
