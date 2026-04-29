---
read_when:
    - Je wilt ondersteuning voor Zalo Personal (onofficieel) in OpenClaw
    - U configureert of ontwikkelt de zalouser-Plugin
summary: 'Zalo Personal-plugin: QR-login + berichtenverkeer via native zca-js (plugininstallatie + kanaalconfiguratie + tool)'
title: Persoonlijke Zalo-Plugin
x-i18n:
    generated_at: "2026-04-29T23:07:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Ondersteuning voor Zalo Personal in OpenClaw via een Plugin, met native `zca-js` om een normaal Zalo-gebruikersaccount te automatiseren.

<Warning>
Niet-officiële automatisering kan leiden tot opschorting of blokkering van het account. Gebruik op eigen risico.
</Warning>

## Naamgeving

De kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (niet-officieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo-API-integratie.

## Waar het draait

Deze Plugin draait **binnen het Gateway-proces**.

Als je een externe Gateway gebruikt, installeer/configureer deze dan op de **machine waarop de Gateway draait** en herstart daarna de Gateway.

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Installeren

### Optie A: installeren vanuit npm

```bash
openclaw plugins install @openclaw/zalouser
```

Als npm meldt dat het OpenClaw-pakket is verouderd, komt die pakketversie uit
een oudere externe pakketlijn; gebruik een actuele verpakte OpenClaw-build of
het lokale mappad totdat een nieuwer npm-pakket is gepubliceerd.

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

## Agenttool

Toolnaam: `zalouser`

Acties: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanaalberichtacties ondersteunen ook `react` voor berichtreacties.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Communityplugins](/nl/plugins/community)
