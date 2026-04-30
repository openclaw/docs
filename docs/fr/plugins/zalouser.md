---
read_when:
    - Vous souhaitez la prise en charge non officielle de Zalo Personal dans OpenClaw
    - Vous configurez ou développez le Plugin zalouser
summary: 'Plugin Zalo Personal : connexion par code QR + messagerie via zca-js natif (installation du Plugin + configuration du canal + outil)'
title: Plugin personnel Zalo
x-i18n:
    generated_at: "2026-04-30T07:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (plugin)

Prise en charge de Zalo Personal pour OpenClaw via un plugin, avec `zca-js` natif pour automatiser un compte utilisateur Zalo normal.

<Warning>
L’automatisation non officielle peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Nommage

L’id du canal est `zalouser` pour indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous gardons `zalo` réservé à une éventuelle future intégration officielle de l’API Zalo.

## Où il s’exécute

Ce plugin s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez/configurez-le sur la **machine exécutant le Gateway**, puis redémarrez le Gateway.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Installation

### Option A : installer depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Si npm indique que le package appartenant à OpenClaw est obsolète, cette version du package provient
d’une ancienne série de packages externe ; utilisez une build OpenClaw packagée actuelle ou
le chemin du dossier local jusqu’à la publication d’un package npm plus récent.

Redémarrez ensuite le Gateway.

### Option B : installer depuis un dossier local (développement)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite le Gateway.

## Configuration

La configuration du canal se trouve sous `channels.zalouser` (et non `plugins.entries.*`) :

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Outil d’agent

Nom de l’outil : `zalouser`

Actions : `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Les actions de message de canal prennent également en charge `react` pour les réactions aux messages.

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins de la communauté](/fr/plugins/community)
