---
read_when:
    - Modification du routage des canaux ou du comportement de la boîte de réception
summary: Règles de routage par canal (WhatsApp, Telegram, Discord, Slack) et contexte partagé
title: Routage des canaux
x-i18n:
    generated_at: "2026-07-12T15:00:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canaux et routage

OpenClaw achemine les réponses **vers le canal d’où provient le message**. Le
modèle ne choisit pas de canal ; le routage est déterministe et contrôlé par la
configuration de l’hôte.

## Termes clés

- **Canal** : un plugin de canal intégré tel que `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` ou `whatsapp`, ainsi que les canaux de plugins installés. `webchat` est le canal interne de l’interface WebChat et ne peut pas être configuré comme canal sortant.
- **AccountId** : instance de compte propre à chaque canal (lorsque cette fonctionnalité est prise en charge).
- Compte par défaut facultatif du canal : `channels.<channel>.defaultAccount` détermine
  le compte utilisé lorsqu’un chemin sortant ne spécifie pas `accountId`.
  - Dans les configurations à plusieurs comptes, définissez une valeur par défaut explicite (`defaultAccount` ou un compte nommé `default`) lorsque deux comptes ou plus sont configurés. Sans cela, le routage de repli peut sélectionner le premier ID de compte normalisé.
- **AgentId** : espace de travail et stockage de sessions isolés (« cerveau »).
- **SessionKey** : clé de compartiment utilisée pour stocker le contexte et contrôler les accès concurrents.

## Préfixes des destinations sortantes

Les destinations sortantes explicites peuvent inclure un préfixe de fournisseur, tel que `telegram:123` ou `tg:123`. Le cœur ne considère ce préfixe comme une indication de sélection du canal que lorsque le canal sélectionné est `last` ou qu’il n’est pas résolu d’une autre manière, et uniquement lorsque le plugin chargé annonce ce préfixe. Si l’appelant a déjà sélectionné un canal explicite, le préfixe du fournisseur doit correspondre à ce canal ; les combinaisons intercanaux, telles qu’une livraison WhatsApp vers `telegram:123`, échouent avant la normalisation de la destination propre au plugin.

Les préfixes de type de destination et de service tels que `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` et `sms:<number>` restent dans la grammaire du canal sélectionné. Ils ne sélectionnent pas eux-mêmes le fournisseur.

## Formes des clés de session (exemples)

Par défaut, les messages directs sont regroupés dans la session **principale** de l’agent :

- `agent:<agentId>:<mainKey>` (par défaut : `agent:main:main`)

`session.dmScope` contrôle le regroupement des messages directs : `main` (valeur par défaut) partage une seule session
principale, tandis que `per-peer`, `per-channel-peer` et `per-account-channel-peer`
conservent les messages directs dans des sessions distinctes. Une liaison de routage peut remplacer la portée pour les
correspondants auxquels elle s’applique via `bindings[].session.dmScope`.

Même lorsque l’historique des conversations par message direct est partagé avec la session principale, les politiques de bac à sable et
d’outils utilisent une clé d’exécution de discussion directe dérivée pour chaque compte dans le cas des messages directs externes,
afin que les messages provenant d’un canal ne soient pas traités comme des exécutions locales de la session principale.

Les groupes et les canaux restent isolés par canal :

- Groupes : `agent:<agentId>:<channel>:group:<id>`
- Canaux/salles : `agent:<agentId>:<channel>:channel:<id>`

Fils de discussion :

- Les fils de discussion Slack/Discord ajoutent `:thread:<threadId>` à la clé de base.
- Les sujets de forum Telegram intègrent `:topic:<topicId>` dans la clé du groupe.

Exemples :

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Épinglage de la route principale des messages directs

Lorsque `session.dmScope` vaut `main`, les messages directs peuvent partager une seule session principale.
Pour empêcher que la valeur `lastRoute` de la session soit remplacée par les messages directs d’un autre utilisateur que le propriétaire,
OpenClaw déduit un propriétaire épinglé à partir de `allowFrom` lorsque toutes les conditions suivantes sont remplies :

- `allowFrom` contient exactement une entrée sans caractère générique.
- L’entrée peut être normalisée en un ID d’expéditeur concret pour ce canal.
- L’expéditeur du message direct entrant ne correspond pas à ce propriétaire épinglé.

En cas de non-correspondance, OpenClaw enregistre tout de même les métadonnées de session entrantes, mais
ne met pas à jour la valeur `lastRoute` de la session principale.

## Enregistrement entrant protégé

Les plugins de canal peuvent marquer un enregistrement de session entrante avec `createIfMissing: false`
lorsqu’un chemin protégé ne doit pas créer de nouvelle session OpenClaw. Dans ce mode,
OpenClaw peut mettre à jour les métadonnées et `lastRoute` d’une session existante, mais
ne crée pas une entrée de session uniquement destinée au routage simplement parce qu’un message a été observé.

## Règles de routage (mode de sélection d’un agent)

Le routage sélectionne **un agent** pour chaque message entrant :

1. **Correspondance exacte avec le pair** (`bindings` avec `peer.kind` + `peer.id`).
2. **Correspondance avec le pair parent** (héritage du fil de discussion).
3. **Correspondance générique avec le pair** (`peer.id: "*"` pour un type de pair).
4. **Correspondance avec la guilde et les rôles** (Discord) via `guildId` + `roles`.
5. **Correspondance avec la guilde** (Discord) via `guildId`.
6. **Correspondance avec l’équipe** (Slack) via `teamId`.
7. **Correspondance avec le compte** (`accountId` sur le canal).
8. **Correspondance avec le canal** (n’importe quel compte sur ce canal, `accountId: "*"`).
9. **Agent par défaut** (`agents.list[].default`, sinon la première entrée de la liste, avec repli sur `main`).

Lorsqu’une liaison comprend plusieurs champs de correspondance (`peer`, `guildId`, `teamId`, `roles`), **tous les champs fournis doivent correspondre** pour que cette liaison s’applique.

L’agent correspondant détermine l’espace de travail et le stockage de sessions utilisés.

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

## Vue d’ensemble de la configuration

- `agents.list` : définitions d’agents nommés (espace de travail, modèle, etc.).
- `bindings` : associe les canaux, comptes et pairs entrants aux agents.

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

Les lignes de session d’exécution se trouvent dans la base de données SQLite de chaque agent, sous le répertoire d’état (par défaut `~/.openclaw`) :

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Les installations plus anciennes peuvent comporter des fichiers JSONL de transcription hérités et un stockage de lignes `sessions.json` sous `~/.openclaw/agents/<agentId>/sessions/`. Au démarrage, le Gateway et `openclaw doctor --fix` importent automatiquement dans SQLite les lignes et l’historique hérités actifs. Utilisez `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` ainsi que la séquence de validation de
[Doctor](/fr/cli/doctor#session-sqlite-migration) lorsque vous avez besoin de preuves explicites de la migration.
Vous pouvez toujours sélectionner un chemin de stockage hérité avec `session.store` et le modèle `{agentId}` pour les workflows de migration et de maintenance hors ligne.

La détection des sessions du Gateway et d’ACP analyse également les stockages d’agents sur disque sous la racine `agents/` par défaut et sous les racines définies par le modèle `session.store`. Les stockages détectés doivent rester dans cette racine d’agent résolue et utiliser un fichier hérité `sessions.json` standard. Les liens symboliques et les chemins situés hors de la racine sont ignorés.

## Comportement de WebChat

WebChat se connecte à l’**agent sélectionné** et utilise par défaut la session principale de l’agent. Ainsi, WebChat vous permet de consulter au même endroit le contexte de cet agent provenant de plusieurs canaux.

## Contexte de réponse

Les réponses entrantes comprennent :

- `ReplyToId`, `ReplyToBody` et `ReplyToSender` lorsqu’ils sont disponibles.
- Le contexte cité est ajouté à `Body` sous forme de bloc `[Replying to ...]`.

Ce comportement est cohérent sur tous les canaux.

## Pages connexes

- [Groupes](/fr/channels/groups)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Appairage](/fr/channels/pairing)
