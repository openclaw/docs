---
read_when:
    - Je wilt ondersteuning voor Zalo Personal (niet-officieel) in OpenClaw
    - Je configureert of ontwikkelt de zalouser-plugin
summary: 'Zalo Personal-plugin: inloggen via QR-code + berichten via systeemeigen zca-js (Plugin-installatie + kanaalconfiguratie + tool)'
title: Zalo-plugin voor persoonlijk gebruik
x-i18n:
    generated_at: "2026-07-12T09:17:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Zalo Personal-ondersteuning voor OpenClaw via een Plugin die de systeemeigen `zca-js` gebruikt om
een normaal Zalo-gebruikersaccount te automatiseren. Er is geen extern binair
`zca`/`openzca`-CLI-bestand vereist.

<Warning>
Niet-officiële automatisering kan leiden tot opschorting of blokkering van het account. Gebruik dit op eigen risico.
</Warning>

## Naamgeving

De kanaal-id is `zalouser` om duidelijk te maken dat hiermee een **persoonlijk
Zalo-gebruikersaccount** wordt geautomatiseerd (niet-officieel). De afzonderlijke kanaal-id `zalo` is de officiële,
meegeleverde integratie voor Zalo Bot/Webhook - zie [Zalo](/nl/channels/zalo).

## Waar het wordt uitgevoerd

Deze Plugin wordt **binnen het Gateway-proces** uitgevoerd. Installeer en configureer
de Plugin bij een externe Gateway op die host en start daarna de Gateway opnieuw.

## Installatie

### Vanuit npm

```bash
openclaw plugins install @openclaw/zalouser
```

Gebruik het pakket zonder versie om de huidige officiële releasetag te volgen; leg alleen een exacte
versie vast wanneer u een reproduceerbare installatie nodig hebt. Start daarna de Gateway
opnieuw.

### Vanuit een lokale map (ontwikkeling)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Start daarna de Gateway opnieuw.

## Configuratie

De kanaalconfiguratie bevindt zich onder `channels.zalouser` (niet onder `plugins.entries.*`):

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

Zie [Configuratie van het persoonlijke Zalo-kanaal](/nl/channels/zalouser) voor toegangsbeheer
voor privéberichten en groepen, configuratie van meerdere accounts, omgevingsvariabelen en probleemoplossing.

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

## Agenttool

Naam van het hulpmiddel: `zalouser`

Acties: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanaalberichtacties (niet het agenthulpmiddel) ondersteunen ook `react` voor
reacties op berichten.

## Gerelateerd

- [Configuratie van het persoonlijke Zalo-kanaal](/nl/channels/zalouser)
- [Zalo (officieel Bot-/Webhook-kanaal)](/nl/channels/zalo)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [ClawHub](/clawhub)
