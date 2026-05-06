---
read_when:
    - Je wilt ondersteuning voor Zalo Personal (onofficieel) in OpenClaw
    - Je configureert of ontwikkelt de zalouser Plugin
summary: 'Zalo Personal-Plugin: QR-inloggen + berichtenuitwisseling via native zca-js (Plugin-installatie + kanaalconfiguratie + tool)'
title: Persoonlijke Zalo-Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Zalo Personal-ondersteuning voor OpenClaw via een Plugin, met native `zca-js` om een normaal Zalo-gebruikersaccount te automatiseren.

<Warning>
Onofficiële automatisering kan leiden tot schorsing of blokkering van het account. Gebruik op eigen risico.
</Warning>

## Naamgeving

Kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (onofficieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo API-integratie.

## Waar het draait

Deze Plugin draait **binnen het Gateway-proces**.

Als je een externe Gateway gebruikt, installeer/configureer deze dan op de **machine waarop de Gateway draait** en herstart vervolgens de Gateway.

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Installeren

### Optie A: installeren vanaf npm

```bash
openclaw plugins install @openclaw/zalouser
```

Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

Herstart daarna de Gateway.

### Optie B: installeren vanuit een lokale map (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Herstart daarna de Gateway.

## Configuratie

Kanaalconfiguratie staat onder `channels.zalouser` (niet `plugins.entries.*`):

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

## Agent-tool

Toolnaam: `zalouser`

Acties: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanaalberichtacties ondersteunen ook `react` voor berichtreacties.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Community-Plugins](/nl/plugins/community)
