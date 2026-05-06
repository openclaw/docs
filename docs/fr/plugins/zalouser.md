---
read_when:
    - Vous souhaitez la prise en charge de Zalo Personal (non officielle) dans OpenClaw
    - Vous configurez ou développez le Plugin zalouser
summary: 'Plugin Zalo Personal : connexion par QR code + messagerie via zca-js natif (installation du Plugin + configuration du canal + outil)'
title: Plugin personnel Zalo
x-i18n:
    generated_at: "2026-05-06T17:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Prise en charge de Zalo Personal pour OpenClaw via un plugin, avec `zca-js` natif pour automatiser un compte utilisateur Zalo normal.

<Warning>
L’automatisation non officielle peut entraîner la suspension ou le bannissement du compte. À utiliser à vos propres risques.
</Warning>

## Nommage

L’identifiant du canal est `zalouser` afin d’indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous gardons `zalo` réservé pour une éventuelle future intégration officielle de l’API Zalo.

## Où il s’exécute

Ce plugin s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez-le/configurez-le sur la **machine exécutant le Gateway**, puis redémarrez le Gateway.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Installation

### Option A : installer depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Utilisez le package nu pour suivre le tag de version officielle actuel. Épinglez une
version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

Redémarrez ensuite le Gateway.

### Option B : installer depuis un dossier local (dev)

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
- [Plugins communautaires](/fr/plugins/community)
