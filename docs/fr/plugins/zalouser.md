---
read_when:
    - Vous souhaitez la prise en charge de Zalo Personal (non officielle) dans OpenClaw
    - Vous configurez ou développez le plugin zalouser
summary: 'Plugin Zalo Personal : connexion par code QR + messagerie via zca-js natif (installation du Plugin + configuration du canal + outil)'
title: Plugin personnel Zalo
x-i18n:
    generated_at: "2026-07-12T02:58:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Prise en charge de Zalo Personal pour OpenClaw via un Plugin qui utilise la bibliothèque native `zca-js` afin
d’automatiser un compte utilisateur Zalo standard. Aucun binaire CLI externe `zca`/`openzca`
n’est requis.

<Warning>
L’automatisation non officielle peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Nommage

L’identifiant du canal est `zalouser` afin d’indiquer explicitement qu’il automatise un **compte
utilisateur Zalo personnel** (non officiel). L’identifiant de canal distinct `zalo` correspond à l’intégration
officielle et intégrée du bot Zalo/Webhook — consultez [Zalo](/fr/channels/zalo).

## Environnement d’exécution

Ce Plugin s’exécute **dans le processus Gateway**. Pour un Gateway distant,
installez-le et configurez-le sur cet hôte, puis redémarrez le Gateway.

## Installation

### Depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Utilisez le paquet sans version pour suivre la balise de la version officielle actuelle ; épinglez une version
exacte uniquement lorsqu’une installation reproductible est nécessaire. Redémarrez ensuite le Gateway.

### Depuis un dossier local (développement)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite le Gateway.

## Configuration

La configuration du canal se trouve sous `channels.zalouser` (et non sous `plugins.entries.*`) :

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

Consultez la [configuration du canal Zalo personnel](/fr/channels/zalouser) pour le contrôle d’accès
aux messages privés et aux groupes, la configuration de plusieurs comptes, les variables d’environnement et le dépannage.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Outil de l’agent

Nom de l’outil : `zalouser`

Actions : `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Les actions sur les messages du canal, distinctes de l’outil de l’agent, prennent également en charge `react` pour les
réactions aux messages.

## Pages connexes

- [Configuration du canal Zalo personnel](/fr/channels/zalouser)
- [Zalo (canal officiel de bot/Webhook)](/fr/channels/zalo)
- [Création de plugins](/fr/plugins/building-plugins)
- [ClawHub](/clawhub)
