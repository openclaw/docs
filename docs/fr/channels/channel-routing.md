---
read_when:
    - Modifier le routage des canaux ou le comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-05-02T06:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canaux et routage

OpenClaw achemine les réponses **vers le canal d’où provient le message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ainsi que les canaux Plugin. `webchat` est le canal interne de l’interface utilisateur WebChat et n’est pas un canal sortant configurable.
- **AccountId** : instance de compte par canal (quand c’est pris en charge).
- Compte par défaut facultatif du canal : `channels.<channel>.defaultAccount` choisit
  le compte utilisé quand un chemin sortant ne spécifie pas `accountId`.
  - Dans les configurations multi-comptes, définissez une valeur par défaut explicite (`defaultAccount` ou `accounts.default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de repli peut choisir le premier ID de compte normalisé.
- **AgentId** : un espace de travail isolé + magasin de sessions (« cerveau »).
- **SessionKey** : la clé de compartiment utilisée pour stocker le contexte et contrôler la concurrence.

## Préfixes de cibles sortantes

Les cibles sortantes explicites peuvent inclure un préfixe de fournisseur, comme `telegram:123` ou `tg:123`. Le cœur ne traite ce préfixe comme une indication de sélection de canal que lorsque le canal sélectionné est `last` ou autrement non résolu, et seulement lorsque le Plugin chargé annonce ce préfixe. Si l’appelant a déjà sélectionné un canal explicite, le préfixe de fournisseur doit correspondre à ce canal ; les combinaisons inter-canaux, comme une livraison WhatsApp vers `telegram:123`, échouent avant la normalisation de cible propre au Plugin.

Les préfixes de type de cible et de service comme `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` et `sms:<number>` restent dans la grammaire du canal sélectionné. Ils ne sélectionnent pas le fournisseur à eux seuls.

## Formes des clés de session (exemples)

Les messages directs se replient par défaut sur la session **main** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

Même lorsque l’historique de conversation des messages directs est partagé avec main, la stratégie de bac à sable et
d’outils utilise une clé d’exécution de discussion directe dérivée par compte pour les messages directs externes,
afin que les messages provenant d’un canal ne soient pas traités comme des exécutions de session principale locale.

Les groupes et canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salons : `agent:<agentId>:<channel>:channel:<id>`

Fils :

- Les fils Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé de groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de la route de message direct principal

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une seule session principale.
Pour empêcher que le `lastRoute` de la session soit écrasé par des messages directs qui ne viennent pas du propriétaire,
OpenClaw déduit un propriétaire épinglé depuis `allowFrom` lorsque toutes ces conditions sont vraies :

- `allowFrom` contient exactement une entrée non générique.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du message direct entrant ne correspond pas à ce propriétaire épinglé.

Dans ce cas de non-correspondance, OpenClaw enregistre quand même les métadonnées de session entrantes, mais il
ignore la mise à jour du `lastRoute` de la session principale.

## Enregistrement entrant protégé

Les Plugins de canal peuvent marquer un enregistrement de session entrant comme `createIfMissing: false`
lorsqu’un chemin protégé ne doit pas créer une nouvelle session OpenClaw. Dans ce mode,
OpenClaw peut mettre à jour les métadonnées et `lastRoute` d’une session existante, mais il
ne crée pas une entrée de session uniquement pour la route simplement parce qu’un message a été observé.

## Règles de routage (comment un agent est choisi)

Le routage choisit **un agent** pour chaque message entrant :

1. **Correspondance exacte de pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance du pair parent** (héritage de fil).
3. **Correspondance guilde + rôles** (Discord) via `guildId` + `roles`.
4. **Correspondance de guilde** (Discord) via `guildId`.
5. **Correspondance d’équipe** (Slack) via `teamId`.
6. **Correspondance de compte** (`accountId` sur le canal).
7. **Correspondance de canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
8. **Agent par défaut** (`agents.list[].default`, sinon première entrée de la liste, repli sur `main`).

Lorsqu’une liaison inclut plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine l’espace de travail et le magasin de sessions utilisés.

## Groupes de diffusion (exécuter plusieurs agents)

Les groupes de diffusion permettent d’exécuter **plusieurs agents** pour le même pair **quand OpenClaw répondrait normalement** (par exemple : dans les groupes WhatsApp, après le filtrage par mention/activation).

Configuration :

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Voir : [Groupes de diffusion](/fr/channels/broadcast-groups).

## Aperçu de la configuration

- `agents.list` : définitions d’agents nommés (espace de travail, modèle, etc.).
- `bindings` : associe les canaux/comptes/pairs entrants aux agents.

Exemple :

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Stockage des sessions

Les magasins de sessions se trouvent sous le répertoire d’état (par défaut `~/.openclaw`) :

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Les transcriptions JSONL se trouvent à côté du magasin

Vous pouvez remplacer le chemin du magasin via `session.store` et le modèle `{agentId}`.

La découverte de sessions Gateway et ACP analyse aussi les magasins d’agents sauvegardés sur disque sous la
racine `agents/` par défaut et sous les racines `session.store` modélisées. Les magasins découverts
doivent rester à l’intérieur de cette racine d’agent résolue et utiliser un fichier
`sessions.json` normal. Les liens symboliques et les chemins hors racine sont ignorés.

## Comportement de WebChat

WebChat s’attache à l’**agent sélectionné** et utilise par défaut la session principale de l’agent.
De ce fait, WebChat vous permet de voir le contexte inter-canaux de cet agent
au même endroit.

## Contexte de réponse

Les réponses entrantes incluent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsqu’ils sont disponibles.
- Le contexte cité est ajouté à `Body` sous forme de bloc `[Replying to ...]`.

Ce comportement est cohérent sur tous les canaux.

## Connexe

- [Groupes](/fr/channels/groups)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Association](/fr/channels/pairing)
