---
read_when:
    - Je wilt ondersteuning voor Zalo Personal (onofficieel) in OpenClaw
    - Je configureert of ontwikkelt de zalouser-Plugin
summary: 'Zalo Personal-Plugin: QR-login + berichten via native zca-js (Plugin-installatie + kanaalconfiguratie + tool)'
title: Persoonlijke Zalo-Plugin
x-i18n:
    generated_at: "2026-05-11T20:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

Ondersteuning voor Zalo Personal in OpenClaw via een Plugin, waarbij native `zca-js` wordt gebruikt om een normaal Zalo-gebruikersaccount te automatiseren.

<Warning>
Niet-officiële automatisering kan leiden tot accountschorsing of blokkering. Gebruik op eigen risico.
</Warning>

## Naamgeving

De kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (niet-officieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo API-integratie.

## Waar het draait

Deze Plugin draait **binnen het Gateway-proces**.

Als u een externe Gateway gebruikt, installeer/configureer deze dan op de **machine waarop de Gateway draait** en herstart daarna de Gateway.

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Installeren

### Optie A: installeren vanuit npm

```bash
openclaw plugins install @openclaw/zalouser
```

Gebruik het kale pakket om de huidige officiële releasetag te volgen. Pin een exacte
versie alleen wanneer u een reproduceerbare installatie nodig hebt.

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
- [ClawHub](/nl/clawhub)
