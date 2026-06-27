---
read_when:
    - Connexion d’OpenClaw à un espace de travail ClickClack
    - Test des identités de bot ClickClack
summary: Configuration du canal bot-token ClickClack et syntaxe de cible
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connecte OpenClaw à un espace de travail ClickClack auto-hébergé via des jetons de bot ClickClack de première classe.

Utilisez ceci lorsque vous voulez qu’un agent OpenClaw apparaisse comme un utilisateur bot ClickClack. ClickClack prend en charge les bots de service indépendants et les bots détenus par des utilisateurs ; les bots détenus par des utilisateurs conservent un `owner_user_id` et ne reçoivent que les portées de jeton que vous accordez.

## Configuration rapide

Créez un jeton de bot dans ClickClack :

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Pour un bot détenu par un utilisateur, ajoutez `--owner <user_id>`.

Configurez OpenClaw :

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Exécutez ensuite :

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Si `plugins.allow` est une liste restrictive non vide, sélectionner explicitement
ClickClack dans la configuration du canal ou exécuter `openclaw plugins enable clickclack`
ajoute `clickclack` à cette liste. L’installation lors de l’intégration utilise le même
comportement de sélection explicite. Ces chemins ne remplacent pas `plugins.deny` ni un
paramètre global `plugins.enabled: false`. La commande directe
`openclaw plugins install @openclaw/clickclack` suit la politique normale
d’installation de plugin et enregistre également ClickClack dans une liste d’autorisation existante.

## Plusieurs bots

Chaque compte ouvre sa propre connexion temps réel ClickClack et utilise son propre jeton de bot.

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` utilise directement `api.runtime.llm.complete` pour les réponses courtes du bot.
Lorsqu’un compte définit `agentId`, OpenClaw exige le bit de confiance explicite
`plugins.entries.clickclack.llm.allowAgentIdOverride` afin que le plugin
puisse exécuter des complétions pour cet agent bot. Laissez-le désactivé si vous utilisez uniquement la route
d’agent par défaut.

## Cibles

- `channel:<name-or-id>` envoie vers un canal d’espace de travail. Les cibles nues utilisent `channel:` par défaut.
- `dm:<user_id>` crée ou réutilise une conversation directe avec cet utilisateur.
- `thread:<message_id>` répond dans un fil existant.

Exemples :

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorisations

Les portées de jeton ClickClack sont appliquées par l’API ClickClack.

- `bot:read` : lire les données d’espace de travail, de canal, de message, de fil, de DM, de temps réel et de profil.
- `bot:write` : `bot:read` plus les messages de canal, les réponses de fil, les DM et les téléversements.
- `bot:admin` : `bot:write` plus la création de canaux.

OpenClaw n’a besoin que de `bot:write` pour les conversations d’agent normales.

## Dépannage

- `ClickClack is not configured` : définissez `channels.clickclack.token` ou `CLICKCLACK_BOT_TOKEN`.
- `workspace not found` : définissez `workspace` sur l’identifiant ou le slug d’espace de travail renvoyé par ClickClack.
- Aucune réponse entrante : confirmez que le jeton dispose d’un accès en lecture temps réel et que le bot ne répond pas à ses propres messages.
- Les envois au canal échouent : vérifiez que le bot est membre de l’espace de travail et dispose de `bot:write`.
