---
read_when:
    - Je wilt OpenClaw koppelen aan WeChat of Weixin
    - Je installeert de openclaw-weixin-kanaal-Plugin of lost problemen ermee op
    - Je moet begrijpen hoe externe kanaalplugins naast de Gateway draaien
summary: WeChat-kanaalconfiguratie via de externe openclaw-weixin-Plugin
title: WeChat
x-i18n:
    generated_at: "2026-04-29T22:29:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw maakt verbinding met WeChat via de externe
`@tencent-weixin/openclaw-weixin`-kanaalplugin van Tencent.

Status: externe plugin. Directe chats en media worden ondersteund. Groepschats worden niet
geadverteerd door de huidige capabilitymetadata van de plugin.

## Naamgeving

- **WeChat** is de gebruikersgerichte naam in deze documentatie.
- **Weixin** is de naam die wordt gebruikt door het pakket van Tencent en door de plugin-id.
- `openclaw-weixin` is de OpenClaw-kanaal-id.
- `@tencent-weixin/openclaw-weixin` is het npm-pakket.

Gebruik `openclaw-weixin` in CLI-opdrachten en configuratiepaden.

## Hoe het werkt

De WeChat-code staat niet in de core-repo van OpenClaw. OpenClaw biedt het
generieke contract voor kanaalplugins, en de externe plugin biedt de
WeChat-specifieke runtime:

1. `openclaw plugins install` installeert `@tencent-weixin/openclaw-weixin`.
2. De Gateway ontdekt het pluginmanifest en laadt het plugin-entrypoint.
3. De plugin registreert kanaal-id `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` start QR-login.
5. De plugin slaat accountreferenties op onder de statusmap van OpenClaw.
6. Wanneer de Gateway start, start de plugin zijn Weixin-monitor voor elk
   geconfigureerd account.
7. Inkomende WeChat-berichten worden genormaliseerd via het kanaalcontract, gerouteerd naar
   de geselecteerde OpenClaw-agent en teruggestuurd via het uitgaande pad van de plugin.

Die scheiding is belangrijk: de core van OpenClaw moet kanaalonafhankelijk blijven. WeChat-login,
Tencent iLink API-aanroepen, media-upload/download, contexttokens en accountbewaking
zijn eigendom van de externe plugin.

## Installeren

Snelle installatie:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Handmatige installatie:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Herstart de Gateway na installatie:

```bash
openclaw gateway restart
```

## Inloggen

Voer QR-login uit op dezelfde machine waarop de Gateway draait:

```bash
openclaw channels login --channel openclaw-weixin
```

Scan de QR-code met WeChat op je telefoon en bevestig de login. De plugin slaat
het accounttoken lokaal op na een geslaagde scan.

Om nog een WeChat-account toe te voegen, voer je dezelfde loginopdracht opnieuw uit. Isoleer voor meerdere
accounts direct-message-sessies per account, kanaal en afzender:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Toegangscontrole

Directe berichten gebruiken het normale OpenClaw-model voor koppeling en allowlists voor kanaalplugins.

Keur nieuwe afzenders goed:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Zie [Koppeling](/nl/channels/pairing) voor het volledige toegangscontrolemodel.

## Compatibiliteit

De plugin controleert de OpenClaw-versie van de host bij het opstarten.

| Pluginlijn | OpenClaw-versie         | npm-tag  |
| ---------- | ----------------------- | -------- |
| `2.x`      | `>=2026.3.22`           | `latest` |
| `1.x`      | `>=2026.1.0 <2026.3.22` | `legacy` |

Als de plugin meldt dat je OpenClaw-versie te oud is, werk dan
OpenClaw bij of installeer de legacy-pluginlijn:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-proces

De WeChat-plugin kan helperwerk naast de Gateway uitvoeren terwijl hij de
Tencent iLink API bewaakt. In issue #68451 legde dat helperpad een bug bloot in de
generieke opschoning van verouderde Gateways in OpenClaw: een childproces kon proberen het bovenliggende
Gateway-proces op te schonen, wat herstartlussen veroorzaakte onder procesbeheerders zoals systemd.

De huidige opstartopschoning van OpenClaw sluit het huidige proces en zijn ancestors uit,
dus een kanaalhelper mag de Gateway die hem heeft gestart niet beëindigen. Deze fix is
generiek; het is geen WeChat-specifiek pad in de core.

## Problemen oplossen

Controleer installatie en status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Als het kanaal als geïnstalleerd wordt weergegeven maar geen verbinding maakt, bevestig dan dat de plugin is
ingeschakeld en herstart:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Als de Gateway herhaaldelijk herstart na het inschakelen van WeChat, werk dan zowel OpenClaw als
de plugin bij:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Tijdelijk uitschakelen:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Gerelateerde documentatie

- Kanaaloverzicht: [Chatkanalen](/nl/channels)
- Koppeling: [Koppeling](/nl/channels/pairing)
- Kanaalroutering: [Kanaalroutering](/nl/channels/channel-routing)
- Pluginarchitectuur: [Pluginarchitectuur](/nl/plugins/architecture)
- Kanaalplugin-SDK: [Kanaalplugin-SDK](/nl/plugins/sdk-channel-plugins)
- Extern pakket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
