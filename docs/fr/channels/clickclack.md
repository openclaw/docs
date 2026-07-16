---
read_when:
    - Connexion d’OpenClaw à un espace de travail ClickClack
    - Test des identités de bots ClickClack
summary: Configuration du canal ClickClack par jeton de bot et syntaxe de la cible
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T12:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connecte OpenClaw à un espace de travail ClickClack auto-hébergé au moyen de jetons de bot ClickClack de première classe.

Utilisez cette intégration lorsque vous souhaitez qu’un agent OpenClaw apparaisse comme un utilisateur bot ClickClack. ClickClack prend en charge les bots de service indépendants et les bots appartenant à des utilisateurs ; ces derniers conservent un `owner_user_id` et reçoivent uniquement les portées de jeton que vous leur accordez.

## Configuration rapide

Dans ClickClack, ouvrez **Workspace settings → Integrations → OpenClaw**, créez un
bot et copiez son jeton. Configurez ensuite le canal :

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` accepte un identifiant d’espace de travail (`wsp_...`), un slug ou un nom d’affichage.
`channels add` vérifie le serveur, le jeton et l’espace de travail après l’enregistrement, puis
indique si le Gateway en cours d’exécution a pris en compte le nouveau compte. Si OpenClaw est
déjà en cours d’exécution, ClickClack se connecte automatiquement et aucune deuxième commande
n’est nécessaire. Sinon, démarrez-le avec :

```bash
openclaw gateway
```

Pour une configuration guidée, exécutez :

```bash
openclaw onboard
```

Sélectionnez ClickClack, puis saisissez l’URL du serveur, le jeton du bot et l’espace de travail lorsque
vous y êtes invité. La configuration guidée vérifie le serveur, le jeton et l’espace de travail après l’enregistrement ; un
échec de vérification ne supprime pas la configuration.

### Alternative : jeton basé sur une variable d’environnement

Le compte par défaut peut lire `CLICKCLACK_BOT_TOKEN` au lieu de stocker un jeton
dans la configuration :

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Les comptes nommés doivent utiliser un jeton configuré ou un fichier de jeton ; la variable
d’environnement partagée est volontairement limitée au compte par défaut.

### Référence JSON5

La structure de configuration équivalente est :

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

Un compte n’est considéré comme configuré que lorsque `baseUrl`, une source de jeton et
`workspace` sont tous définis. Une source de jeton peut être `token`, `tokenFile` ou
`CLICKCLACK_BOT_TOKEN` pour le compte par défaut. `workspace` accepte un identifiant d’espace de travail
(`wsp_...`), un slug ou un nom ; le Gateway le résout en identifiant au démarrage.

### Clés de configuration du compte

| Clé                     | Valeur par défaut             | Remarques                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | aucune (obligatoire)     | URL du serveur ClickClack.                                                                  |
| `token`                 | aucune                | Jeton du bot sous forme de chaîne simple ou de référence de secret (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | aucune                | Chemin vers un fichier de jeton de bot ; prioritaire sur `token`.                                |
| `workspace`             | aucune (obligatoire)     | Identifiant, slug ou nom de l’espace de travail.                                                            |
| `replyMode`             | `"agent"`           | `"agent"` exécute le pipeline complet de l’agent ; `"model"` envoie de courtes complétions directes du modèle. |
| `defaultTo`             | `"channel:general"` | Cible utilisée lorsqu’un chemin sortant ne fournit aucune cible.                                      |
| `allowFrom`             | `["*"]`             | Liste d’identifiants utilisateur autorisés pour les messages privés et les messages de canal entrants.                                 |
| `botUserId`             | détecté automatiquement       | Résolu à partir de l’identité du jeton du bot au démarrage.                                        |
| `agentId`               | valeur par défaut de la route       | Épingle les messages entrants de ce compte à un seul agent.                                       |
| `toolsAllow`            | aucune                | Liste d’outils autorisés pour les réponses de l’agent provenant de ce compte.                                     |
| `model`, `systemPrompt` | aucune                | Utilisés par les complétions `replyMode: "model"`.                                               |
| `commandMenu`           | `true`              | Publie les commandes natives dans la saisie semi-automatique de l’éditeur ClickClack.                            |
| `reconnectMs`           | `1500`              | Délai de reconnexion en temps réel (100 à 60000).                                                |

Si `plugins.allow` est une liste restrictive non vide, sélectionner explicitement
ClickClack dans la configuration du canal ou exécuter `openclaw plugins enable clickclack`
ajoute `clickclack` à cette liste. L’installation lors de l’intégration utilise le même
comportement de sélection explicite. Ces chemins ne remplacent pas `plugins.deny` ni un
paramètre global `plugins.enabled: false`. L’exécution directe de
`openclaw plugins install @openclaw/clickclack` suit la politique normale
d’installation des plugins et enregistre également ClickClack dans une liste d’autorisation existante.

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

- `replyMode: "agent"` (par défaut) transmet les messages entrants au pipeline normal de l’agent, notamment l’enregistrement de la session et la politique des outils.
- `replyMode: "model"` contourne le pipeline de l’agent et utilise le `llm.complete` de l’environnement d’exécution du plugin pour les réponses directes du bot, éventuellement structurées par `model` et `systemPrompt`. Le fournisseur et le modèle sélectionnés déterminent le budget de complétion.

Le mode modèle exécute les complétions avec l’identifiant résolu de l’agent du bot, ce qui nécessite
le bit de confiance explicite `plugins.entries.clickclack.llm.allowAgentIdOverride: true` :

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

Laissez le bit de confiance désactivé si vous utilisez uniquement le mode de réponse `agent` par défaut ; il
n’y est pas nécessaire.

## Menu des commandes

Au démarrage du Gateway, chaque compte configuré publie les commandes
natives d’OpenClaw dans ClickClack. Elles apparaissent dans la saisie semi-automatique de l’éditeur avec
le pseudo du bot comme libellé. L’ensemble publié est entièrement remplacé à chaque démarrage,
y compris par la suppression d’un menu obsolète lorsque le catalogue des commandes natives est vide.

La synchronisation du menu des commandes est activée par défaut. Définissez `commandMenu: false` sur un compte
pour la désactiver :

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Le jeton nécessite `commands:write`. Les offres ClickClack `bot:write` et
`bot:admin` actuelles incluent cette portée, qui peut également être accordée
individuellement. Les jetons créés avant l’introduction des menus de commandes peuvent nécessiter
l’ajout de cette portée ou un jeton de remplacement.

La synchronisation s’effectue au mieux et s’exécute une fois par démarrage du Gateway. Une portée manquante ou une défaillance
réseau consigne un avertissement ; un ancien serveur ClickClack dépourvu du point de terminaison consigne
le problème au niveau débogage. Aucun de ces échecs ne bloque le démarrage en temps réel. Les menus restent
disponibles lorsque l’agent est hors ligne et sont supprimés lorsque le bot quitte
l’espace de travail.

Cette version publie uniquement les spécifications des commandes natives. Les alias et les
catalogues de commandes de Skills, de plugins ou personnalisées ne sont pas ajoutés au menu. Si un
nom est également enregistré comme commande HTTP avec barre oblique, ClickClack traite d’abord cet
enregistrement ; les autres commandes du menu continuent d’être transmises par la voie normale
des messages.

Utilisez le mode `agent` pour les éléments de preuve de corrélation entre services. À partir d’un
identifiant de message ClickClack faisant autorité dans sa forme canonique `msg_<ulid>`, le canal dérive
l’identifiant d’exécution OpenClaw déterministe `clickclack:<message-id>`. Chaque appel de modèle est
alors visible dans les diagnostics sous la forme `clickclack:<message-id>:model:<n>` ; lorsque ce
tour utilise ClawRouter, le même identifiant d’appel de modèle est envoyé comme `X-Request-ID`.
Le mode `model` contourne les diagnostics normaux d’exécution et de session de l’agent et ne convient donc
pas à ce parcours de preuve.

Lorsqu’un événement en temps réel contient un `payload.correlation_id` validé, le
canal le transmet comme `X-Correlation-ID` lors de la récupération du message faisant autorité et
des requêtes de réponse ClickClack qui en résultent. Les valeurs utilisent le jeu sécurisé de
128 caractères de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` et `-`) ; les valeurs non valides
sont omises. Ces jointures ne contiennent que des identifiants, jamais le corps des messages,
les prompts, les complétions, les identifiants d’authentification ni la sortie des outils.

## Livraison durable des médias

Les réponses de l’agent contenant des médias utilisent obligatoirement une livraison durable. OpenClaw attribue
des nonces stables par partie pour les messages et les téléversements avant la première écriture ClickClack, afin qu’une
nouvelle tentative réutilise le même téléversement et le même message au lieu de consommer le quota de stockage
ou de publier des doublons. Si un téléversement existe déjà après un redémarrage,
OpenClaw ne relit ni le chemin local d’origine ni l’URL distante du média.

Ce contrat de récupération nécessite un serveur ClickClack prenant en charge :

- `GET /api/uploads/by-nonce` avec
  `X-ClickClack-Upload-Nonce: supported` pour les résultats trouvés et manquants.
- `GET /api/messages/by-nonce` avec
  `X-ClickClack-Message-Nonce: supported` pour les résultats trouvés et manquants.
- La création idempotente des messages et l’association des pièces jointes pour le même
  nonce limité au propriétaire et le même téléversement.

Une erreur 404 générique d’un ancien serveur n’est pas considérée comme la preuve qu’un envoi est absent.
OpenClaw laisse la livraison non résolue plutôt que de risquer un doublon ; mettez à jour
ClickClack avant d’activer les réponses d’agent produisant des médias.

## Lignes d’activité de l’agent

Par défaut, un canal ClickClack n’affiche rien pendant l’exécution d’un tour de l’agent ; seule la réponse finale apparaît. Définissez `agentActivity: true` sur un compte pour publier des lignes de message durables `agent_commentary` et `agent_tool` pendant le déroulement du tour :

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
- **Nécessite la portée de jeton `agent_activity:write`.** Cette portée est distincte de `bot:write` et n’en est pas héritée ; créez le jeton du bot avec `--scopes bot:write,agent_activity:write` (ou accordez cette portée à un jeton existant) avant d’activer l’option.
- **Dégradation au mieux.** Si le jeton ne dispose pas de `agent_activity:write` ou si le serveur rejette les écritures d’activité, les échecs sont consignés et la réponse finale est tout de même livrée normalement ; aucune ligne d’activité n’apparaît.
- Les lignes sont regroupées par tour (`turn_id`), fusionnées afin qu’une étape logique corresponde à une ligne, et les lignes d’outil utilisent la même mise en forme de progression que Discord/Slack/Telegram (nom de l’outil suivi des détails de la commande).
- **Métadonnées d’attribution.** Les publications rédigées par l’agent (lignes d’activité et réponse finale) comportent les champs `author_model` et `author_thinking`, résolus à partir du modèle réellement utilisé pour le tour (y compris après un repli). Les serveurs qui ne définissent pas ces colonnes ignorent les champs JSON inconnus ; ceux qui les conservent peuvent déterminer « quel modèle a produit cette ligne, et à quel niveau de réflexion » pour chaque message.

## Cibles

- `channel:<name-or-id>` envoie vers un canal de l’espace de travail. Les cibles sans préfixe utilisent `channel:` par défaut.
- `dm:<user_id>` crée ou réutilise une conversation directe avec cet utilisateur.
- `thread:<message_id>` répond dans le fil de discussion dont ce message est la racine.

Les cibles sortantes explicites peuvent également comporter le préfixe de fournisseur `clickclack:` ou `cc:`.

Pour les médias sortants, l’API de téléversement de ClickClack est utilisée, puis le téléversement durable
est joint au message de canal, à la réponse dans le fil de discussion ou au message privé créé. Les fichiers locaux et les URL de médias
distants pris en charge suivent la politique habituelle d’accès aux médias d’OpenClaw, avec une limite de 64 MiB
par fichier. Les envois durables mis en file d’attente utilisent des nonces distincts propres au propriétaire pour chaque
téléversement et chaque partie de message, puis réessaient d’associer la pièce jointe à ces mêmes
objets. Consultez [Distribution durable des médias](#durable-media-delivery) pour connaître le contrat
du serveur et le comportement de récupération.

Exemples :

```bash
openclaw message send --channel clickclack --target channel:general --message "bonjour"
openclaw message send --channel clickclack --target dm:usr_123 --message "bonjour"
openclaw message send --channel clickclack --target thread:msg_123 --message "je reviens vers vous"
```

## Autorisations

Les portées des jetons ClickClack sont appliquées par l’API ClickClack.

- `bot:read` : lecture des données de l’espace de travail, des canaux, des messages, des fils de discussion, des messages privés, du temps réel et des profils.
- `bot:write` : `bot:read`, ainsi que les messages de canal, les réponses dans les fils de discussion, les messages privés, les téléversements et la publication du menu de commandes.
- `bot:admin` : `bot:write`, ainsi que la création de canaux.
- `commands:write` : publication du menu de commandes du bot. Inclus dans les ensembles `bot:write` et `bot:admin` actuels et pouvant être accordé individuellement.
- `agent_activity:write` : lignes durables d’activité de l’agent (`agent_commentary` / `agent_tool`). Non hérité par `bot:write` ni `bot:admin` ; requis uniquement lorsque `agentActivity: true` est défini.

OpenClaw a uniquement besoin de la portée `bot:write` actuelle pour les conversations normales avec l’agent et la synchronisation du menu de commandes. Ajoutez `agent_activity:write` lors de l’activation des [lignes d’activité de l’agent](#agent-activity-rows).

## Dépannage

- `ClickClack is not configured for account "<id>"` : définissez `baseUrl`, `token` (par exemple via `CLICKCLACK_BOT_TOKEN`) et `workspace` pour ce compte.
- `ClickClack workspace not found: <value>` : définissez `workspace` sur l’identifiant, le slug ou le nom de l’espace de travail renvoyé par ClickClack.
- Aucune réponse entrante : vérifiez que le jeton dispose d’un accès en lecture en temps réel et notez que le bot ignore ses propres messages ainsi que ceux des autres bots.
- Échec des envois vers les canaux : vérifiez que le bot est membre de l’espace de travail et dispose de `bot:write`.
- Aucun menu de commandes : vérifiez que `commandMenu` n’est pas `false`, que le serveur ClickClack prend en charge `PUT /api/bots/self/commands` et que le jeton dispose de `commands:write`.
