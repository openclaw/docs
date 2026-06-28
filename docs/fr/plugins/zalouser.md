---
read_when:
    - Vous souhaitez la prise en charge de Zalo Personal (non officielle) dans OpenClaw
    - Vous configurez ou développez le Plugin zalouser
summary: 'Plugin Zalo Personal : connexion par QR code + messagerie via zca-js natif (installation du plugin + configuration du canal + outil)'
title: Plugin personnel Zalo
x-i18n:
    generated_at: "2026-05-11T20:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Prise en charge de Zalo Personal pour OpenClaw via un Plugin, en utilisant `zca-js` natif pour automatiser un compte utilisateur Zalo normal.

<Warning>
L’automatisation non officielle peut entraîner la suspension ou le bannissement du compte. À utiliser à vos propres risques.
</Warning>

## Nommage

L’id du canal est `zalouser` afin d’indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` à une éventuelle future intégration officielle de l’API Zalo.

## Où il s’exécute

Ce Plugin s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez-le/configurez-le sur la **machine exécutant le Gateway**, puis redémarrez le Gateway.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Installation

### Option A : installer depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Utilisez le package nu pour suivre le tag de version officielle actuelle. Épinglez une version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

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

## Articles associés

- [Créer des Plugins](/fr/plugins/building-plugins)
- [ClawHub](/fr/clawhub)
