---
read_when:
    - Introductie van OpenClaw voor nieuwkomers
summary: OpenClaw is een meerkanaals Gateway voor AI-agenten die op elk besturingssysteem draait.
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIEER! EXFOLIEER!"_ — Een ruimtekreeft, waarschijnlijk

<p align="center">
  <strong>Gateway voor elk besturingssysteem voor AI-agenten via Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer.</strong><br />
  Stuur een bericht en ontvang een agentantwoord vanuit je broekzak. Voer één Gateway uit voor ingebouwde kanalen, meegeleverde kanaalplugins, WebChat en mobiele nodes.
</p>

<Columns>
  <Card title="Aan de slag" href="/nl/start/getting-started" icon="rocket">
    Installeer OpenClaw en start de Gateway binnen enkele minuten.
  </Card>
  <Card title="Onboarding uitvoeren" href="/nl/start/wizard" icon="sparkles">
    Begeleide installatie met `openclaw onboard` en koppelingsflows.
  </Card>
  <Card title="De beheerinterface openen" href="/nl/web/control-ui" icon="layout-dashboard">
    Start het browserdashboard voor chat, configuratie en sessies.
  </Card>
</Columns>

## Wat is OpenClaw?

OpenClaw is een **zelfgehoste gateway** die je favoriete chatapps en kanaaloppervlakken verbindt — ingebouwde kanalen plus meegeleverde of externe kanaalplugins zoals Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer — met AI-codeeragenten zoals Pi. Je voert één Gateway-proces uit op je eigen machine (of een server), en dat wordt de brug tussen je berichtenapps en een altijd beschikbare AI-assistent.

**Voor wie is het bedoeld?** Ontwikkelaars en powerusers die een persoonlijke AI-assistent willen die ze overal vandaan kunnen berichten, zonder de controle over hun gegevens op te geven of afhankelijk te zijn van een gehoste service.

**Wat maakt het anders?**

- **Zelfgehost**: draait op jouw hardware, volgens jouw regels
- **Meerdere kanalen**: één Gateway bedient gelijktijdig ingebouwde kanalen plus meegeleverde of externe kanaalplugins
- **Agent-native**: gebouwd voor codeeragenten met toolgebruik, sessies, geheugen en multi-agent-routering
- **Open source**: MIT-gelicentieerd en communitygedreven

**Wat heb je nodig?** Node 24 (aanbevolen), of Node 22 LTS (`22.16+`) voor compatibiliteit, een API-sleutel van je gekozen provider en 5 minuten. Gebruik voor de beste kwaliteit en beveiliging het krachtigste beschikbare model van de nieuwste generatie.

## Hoe het werkt

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

De Gateway is de enige bron van waarheid voor sessies, routering en kanaalverbindingen.

## Belangrijkste mogelijkheden

<Columns>
  <Card title="Gateway voor meerdere kanalen" icon="network" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer met één Gateway-proces.
  </Card>
  <Card title="Plugin-kanalen" icon="plug" href="/nl/tools/plugin">
    Meegeleverde plugins voegen Matrix, Nostr, Twitch, Zalo en meer toe in normale huidige releases.
  </Card>
  <Card title="Multi-agent-routering" icon="route" href="/nl/concepts/multi-agent">
    Geïsoleerde sessies per agent, werkruimte of afzender.
  </Card>
  <Card title="Media-ondersteuning" icon="image" href="/nl/nodes/images">
    Verzend en ontvang afbeeldingen, audio en documenten.
  </Card>
  <Card title="Webbeheerinterface" icon="monitor" href="/nl/web/control-ui">
    Browserdashboard voor chat, configuratie, sessies en nodes.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    Koppel iOS- en Android-nodes voor Canvas, camera en spraakgestuurde workflows.
  </Card>
</Columns>

## Snel starten

<Steps>
  <Step title="OpenClaw installeren">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Onboarden en de service installeren">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatten">
    Open de beheerinterface in je browser en stuur een bericht:

    ```bash
    openclaw dashboard
    ```

    Of verbind een kanaal ([Telegram](/nl/channels/telegram) is het snelst) en chat vanaf je telefoon.

  </Step>
</Steps>

Heb je de volledige installatie- en ontwikkelsetup nodig? Zie [Aan de slag](/nl/start/getting-started).

## Dashboard

Open de browserbeheerinterface nadat de Gateway is gestart.

- Lokale standaard: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Toegang op afstand: [Weboppervlakken](/nl/web) en [Tailscale](/nl/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configuratie (optioneel)

De configuratie staat op `~/.openclaw/openclaw.json`.

- Als je **niets doet**, gebruikt OpenClaw de meegeleverde Pi-binary in RPC-modus met sessies per afzender.
- Als je het wilt vergrendelen, begin dan met `channels.whatsapp.allowFrom` en (voor groepen) vermeldingsregels.

Voorbeeld:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Begin hier

<Columns>
  <Card title="Docshubs" href="/nl/start/hubs" icon="book-open">
    Alle docs en handleidingen, georganiseerd per usecase.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="settings">
    Kerninstellingen van de Gateway, tokens en providerconfiguratie.
  </Card>
  <Card title="Toegang op afstand" href="/nl/gateway/remote" icon="globe">
    Toegangspatronen voor SSH en tailnet.
  </Card>
  <Card title="Kanalen" href="/nl/channels/telegram" icon="message-square">
    Kanaalspecifieke installatie voor Feishu, Microsoft Teams, WhatsApp, Telegram, Discord en meer.
  </Card>
  <Card title="Nodes" href="/nl/nodes" icon="smartphone">
    iOS- en Android-nodes met koppeling, Canvas, camera en apparaatacties.
  </Card>
  <Card title="Help" href="/nl/help" icon="life-buoy">
    Ingangspunt voor veelvoorkomende oplossingen en probleemoplossing.
  </Card>
</Columns>

## Meer informatie

<Columns>
  <Card title="Volledige functielijst" href="/nl/concepts/features" icon="list">
    Volledige mogelijkheden voor kanalen, routering en media.
  </Card>
  <Card title="Multi-agent-routering" href="/nl/concepts/multi-agent" icon="route">
    Werkruimte-isolatie en sessies per agent.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security" icon="shield">
    Tokens, allowlists en veiligheidscontroles.
  </Card>
  <Card title="Probleemoplossing" href="/nl/gateway/troubleshooting" icon="wrench">
    Gateway-diagnostiek en veelvoorkomende fouten.
  </Card>
  <Card title="Over en credits" href="/nl/reference/credits" icon="info">
    Projectoorsprong, bijdragers en licentie.
  </Card>
</Columns>
