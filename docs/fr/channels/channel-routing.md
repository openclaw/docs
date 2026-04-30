---
read_when:
    - Modification du routage des canaux ou du comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-04-30T07:11:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canaux et routage

OpenClaw achemine les réponses **vers le canal d’où provient le message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus les canaux de Plugin. `webchat` est le canal interne de l’interface WebChat et n’est pas un canal sortant configurable.
- **AccountId** : instance de compte par canal (lorsque pris en charge).
- Compte par défaut facultatif du canal : `channels.<channel>.defaultAccount` choisit
  quel compte est utilisé lorsqu’un chemin sortant ne spécifie pas `accountId`.
  - Dans les configurations multicomptes, définissez une valeur par défaut explicite (`defaultAccount` ou `accounts.default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de secours peut choisir le premier ID de compte normalisé.
- **AgentId** : un espace de travail isolé + un magasin de sessions (« cerveau »).
- **SessionKey** : la clé de compartiment utilisée pour stocker le contexte et contrôler la concurrence.

## Formes des clés de session (exemples)

Par défaut, les messages directs sont regroupés dans la session **main** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

Même lorsque l’historique des conversations par messages directs est partagé avec main, le bac à sable et
la stratégie des outils utilisent une clé d’exécution de discussion directe par compte dérivée pour les DM externes,
afin que les messages provenant d’un canal ne soient pas traités comme des exécutions locales de la session main.

Les groupes et les canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salles : `agent:<agentId>:<channel>:channel:<id>`

Fils :

- Les fils Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé de groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de la route des DM main

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une session main unique.
Pour empêcher que le `lastRoute` de la session soit écrasé par des DM qui n’appartiennent pas au propriétaire,
OpenClaw déduit un propriétaire épinglé à partir de `allowFrom` lorsque toutes ces conditions sont vraies :

- `allowFrom` contient exactement une entrée non générique.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du DM entrant ne correspond pas à ce propriétaire épinglé.

Dans ce cas de non-correspondance, OpenClaw enregistre tout de même les métadonnées de session entrantes, mais
ignore la mise à jour du `lastRoute` de la session main.

## Enregistrement entrant protégé

Les Plugins de canal peuvent marquer un enregistrement de session entrant comme `createIfMissing: false`
lorsqu’un chemin protégé ne doit pas créer une nouvelle session OpenClaw. Dans ce mode,
OpenClaw peut mettre à jour les métadonnées et `lastRoute` pour une session existante, mais il
ne crée pas d’entrée de session uniquement destinée au routage simplement parce qu’un message a été observé.

## Règles de routage (comment un agent est choisi)

Le routage choisit **un agent** pour chaque message entrant :

1. **Correspondance exacte du pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance du pair parent** (héritage du fil).
3. **Correspondance guilde + rôles** (Discord) via `guildId` + `roles`.
4. **Correspondance de guilde** (Discord) via `guildId`.
5. **Correspondance d’équipe** (Slack) via `teamId`.
6. **Correspondance de compte** (`accountId` sur le canal).
7. **Correspondance de canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
8. **Agent par défaut** (`agents.list[].default`, sinon la première entrée de la liste, avec repli sur `main`).

Lorsqu’une liaison inclut plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine l’espace de travail et le magasin de sessions utilisés.

## Groupes de diffusion (exécuter plusieurs agents)

Les groupes de diffusion permettent d’exécuter **plusieurs agents** pour le même pair **lorsqu’OpenClaw répondrait normalement** (par exemple : dans les groupes WhatsApp, après filtrage par mention/activation).

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

## Vue d’ensemble de la configuration

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

Les magasins de sessions résident sous le répertoire d’état (`~/.openclaw` par défaut) :

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Les transcriptions JSONL résident à côté du magasin

Vous pouvez remplacer le chemin du magasin via `session.store` et le gabarit `{agentId}`.

La découverte des sessions Gateway et ACP analyse aussi les magasins d’agents sauvegardés sur disque sous la
racine `agents/` par défaut et sous les racines `session.store` basées sur des gabarits. Les magasins découverts
doivent rester à l’intérieur de cette racine d’agent résolue et utiliser un fichier
`sessions.json` standard. Les liens symboliques et les chemins hors racine sont ignorés.

## Comportement de WebChat

WebChat se rattache à **l’agent sélectionné** et utilise par défaut la session main de l’agent.
Pour cette raison, WebChat vous permet de voir le contexte intercanal de cet
agent au même endroit.

## Contexte de réponse

Les réponses entrantes incluent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsqu’ils sont disponibles.
- Le contexte cité est ajouté à `Body` sous forme de bloc `[Replying to ...]`.

Ce comportement est cohérent sur tous les canaux.

## Connexe

- [Groupes](/fr/channels/groups)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Appairage](/fr/channels/pairing)
