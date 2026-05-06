---
read_when:
    - Modifier le routage des canaux ou le comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-05-06T07:14:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canaux et routage

OpenClaw achemine les réponses **vers le canal d’où provient un message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ainsi que les canaux de plugins. `webchat` est le canal interne de l’interface WebChat et n’est pas un canal sortant configurable.
- **AccountId** : instance de compte propre à chaque canal (lorsque pris en charge).
- Compte par défaut facultatif du canal : `channels.<channel>.defaultAccount` choisit
  le compte utilisé lorsqu’un chemin sortant ne précise pas `accountId`.
  - Dans les configurations multicomptes, définissez une valeur par défaut explicite (`defaultAccount` ou `accounts.default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de secours peut choisir le premier ID de compte normalisé.
- **AgentId** : un espace de travail isolé + magasin de sessions (« cerveau »).
- **SessionKey** : la clé de compartiment utilisée pour stocker le contexte et contrôler la concurrence.

## Préfixes de cibles sortantes

Les cibles sortantes explicites peuvent inclure un préfixe de fournisseur, comme `telegram:123` ou `tg:123`. Le cœur traite ce préfixe comme une indication de sélection de canal uniquement lorsque le canal sélectionné est `last` ou autrement non résolu, et seulement lorsque le Plugin chargé annonce ce préfixe. Si l’appelant a déjà sélectionné un canal explicite, le préfixe de fournisseur doit correspondre à ce canal ; les combinaisons entre canaux, comme une livraison WhatsApp vers `telegram:123`, échouent avant la normalisation de cible propre au Plugin.

Les préfixes de type de cible et de service comme `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` et `sms:<number>` restent dans la grammaire du canal sélectionné. Ils ne sélectionnent pas le fournisseur à eux seuls.

## Formes des clés de session (exemples)

Les messages directs se replient par défaut sur la session **main** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

Même lorsque l’historique de conversation des messages directs est partagé avec main, la stratégie de bac à sable et d’outils utilise une clé d’exécution de discussion directe dérivée par compte pour les DM externes, afin que les messages provenant d’un canal ne soient pas traités comme des exécutions de session main locales.

Les groupes et canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salons : `agent:<agentId>:<channel>:channel:<id>`

Fils de discussion :

- Les fils Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé du groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de la route des DM main

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une seule session main.
Pour empêcher que le `lastRoute` de la session soit écrasé par des DM dont l’expéditeur n’est pas le propriétaire, OpenClaw déduit un propriétaire épinglé à partir de `allowFrom` lorsque toutes ces conditions sont vraies :

- `allowFrom` contient exactement une entrée non générique.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du DM entrant ne correspond pas à ce propriétaire épinglé.

Dans ce cas de non-correspondance, OpenClaw enregistre tout de même les métadonnées de session entrante, mais ignore la mise à jour de `lastRoute` pour la session main.

## Enregistrement entrant protégé

Les plugins de canal peuvent marquer un enregistrement de session entrante comme `createIfMissing: false` lorsqu’un chemin protégé ne doit pas créer une nouvelle session OpenClaw. Dans ce mode, OpenClaw peut mettre à jour les métadonnées et `lastRoute` pour une session existante, mais ne crée pas d’entrée de session uniquement dédiée à la route simplement parce qu’un message a été observé.

## Règles de routage (choix de l’agent)

Le routage choisit **un seul agent** pour chaque message entrant :

1. **Correspondance exacte du pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance du pair parent** (héritage de fil).
3. **Correspondance guilde + rôles** (Discord) via `guildId` + `roles`.
4. **Correspondance de guilde** (Discord) via `guildId`.
5. **Correspondance d’équipe** (Slack) via `teamId`.
6. **Correspondance de compte** (`accountId` sur le canal).
7. **Correspondance de canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
8. **Agent par défaut** (`agents.list[].default`, sinon première entrée de liste, repli sur `main`).

Lorsqu’une liaison inclut plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine l’espace de travail et le magasin de sessions utilisés.

## Groupes de diffusion (exécuter plusieurs agents)

Les groupes de diffusion vous permettent d’exécuter **plusieurs agents** pour le même pair **lorsqu’OpenClaw répondrait normalement** (par exemple : dans les groupes WhatsApp, après le filtrage par mention/activation).

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
- `bindings` : associent les canaux/comptes/pairs entrants aux agents.

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

Les magasins de sessions se trouvent sous le répertoire d’état (`~/.openclaw` par défaut) :

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Les transcriptions JSONL se trouvent à côté du magasin

Vous pouvez remplacer le chemin du magasin via `session.store` et le gabarit `{agentId}`.

La découverte de sessions Gateway et ACP analyse également les magasins d’agents adossés au disque sous la racine `agents/` par défaut et sous les racines `session.store` basées sur un gabarit. Les magasins découverts doivent rester à l’intérieur de cette racine d’agent résolue et utiliser un fichier `sessions.json` standard. Les liens symboliques et les chemins hors racine sont ignorés.

## Comportement de WebChat

WebChat s’attache à l’**agent sélectionné** et utilise par défaut la session main de l’agent. De ce fait, WebChat vous permet de voir le contexte intercanal de cet agent au même endroit.

## Contexte de réponse

Les réponses entrantes incluent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsqu’ils sont disponibles.
- Le contexte cité est ajouté à `Body` sous forme de bloc `[Replying to ...]`.

Ce comportement est cohérent entre les canaux.

## Connexe

- [Groupes](/fr/channels/groups)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Appairage](/fr/channels/pairing)
