---
read_when:
    - OpenClaw introduceren aan nieuwkomers
summary: OpenClaw is een multikanaals-Gateway voor AI-agents die op elk besturingssysteem draait.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-16T15:53:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe97e7299be4855fd9af21838e0626b5a5c8aafe46d982859e9033f0efec2443
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIEER! EXFOLIEER!"_ — Waarschijnlijk een ruimtekreeft

<p align="center">
  <strong>Gateway voor elk besturingssysteem voor AI-agents via Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer.</strong><br />
  Stuur een bericht en ontvang waar je ook bent antwoord van een agent. Voer één Gateway uit voor kanaalplugins, WebChat en mobiele nodes.
</p>

<Columns>
  <Card title="Aan de slag" href="/nl/start/getting-started" icon="rocket">
    Installeer OpenClaw en stel de Gateway binnen enkele minuten in werking.
  </Card>
  <Card title="Onboarding uitvoeren" href="/nl/start/wizard" icon="list-checks">
    Begeleide configuratie met `openclaw onboard` en koppelingsprocessen.
  </Card>
  <Card title="Een kanaal verbinden" href="/nl/channels" icon="message-circle">
    Koppel Discord, Signal, Telegram, WhatsApp en meer om overal te kunnen chatten.
  </Card>
  <Card title="De bedieningsinterface openen" href="/nl/web/control-ui" icon="layout-dashboard">
    Open het browserdashboard voor chat, configuratie en sessies.
  </Card>
</Columns>

## Door de documentatie bladeren

Mobiele browsers tonen mogelijk het sectiemenu zonder de volledige tabbalk van de desktopversie. Gebruik
deze hubkoppelingen om vanuit de hoofdtekst dezelfde documentatiegebieden op het hoogste niveau te bereiken.

<Columns>
  <Card title="Aan de slag" href="/nl" icon="rocket">
    Overzicht, demonstratie, eerste stappen en configuratiehandleidingen.
  </Card>
  <Card title="Installeren" href="/nl/install" icon="download">
    Installatiemethoden, updates, containers, hosting en geavanceerde configuratie.
  </Card>
  <Card title="Kanalen" href="/nl/channels" icon="messages-square">
    Berichtkanalen, koppeling, routering, toegangsgroepen en kanaal-QA.
  </Card>
  <Card title="Agents" href="/nl/concepts/architecture" icon="bot">
    Architectuur, sessies, context, geheugen en routering met meerdere agents.
  </Card>
  <Card title="Mogelijkheden" href="/nl/tools" icon="wand-sparkles">
    Tools, Skills, Cron, Webhooks en automatiseringsmogelijkheden.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="store">
    Pluginmarktplaats, publicatie, selectie en richtlijnen voor vertrouwen.
  </Card>
  <Card title="Modellen" href="/nl/providers" icon="brain">
    Providers, modelconfiguratie, failover en lokale modelservices.
  </Card>
  <Card title="Platforms" href="/nl/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, nodes en webinterfaces.
  </Card>
  <Card title="Gateway en beheer" href="/nl/gateway" icon="server">
    Gatewayconfiguratie, beveiliging, diagnostiek en beheer.
  </Card>
  <Card title="Naslagwerk" href="/nl/cli" icon="terminal">
    CLI-naslagwerk, schema's, RPC, releaseopmerkingen en sjablonen.
  </Card>
  <Card title="Hulp" href="/nl/help" icon="life-buoy">
    Probleemoplossing, veelgestelde vragen, tests, diagnostiek en omgevingscontroles.
  </Card>
</Columns>

## Wat is OpenClaw?

OpenClaw is een **zelfgehoste gateway** die je favoriete chatapps — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer via kanaalplugins — verbindt met AI-programmeeragents. Je voert één Gateway-proces uit op je eigen computer (of een server), dat de brug vormt tussen je berichtenapps en een altijd beschikbare AI-assistent.

**Voor wie is het bedoeld?** Ontwikkelaars en ervaren gebruikers die een persoonlijke AI-assistent willen die ze overal berichten kunnen sturen, zonder de controle over hun gegevens op te geven of afhankelijk te zijn van een gehoste service.

**Wat maakt het anders?**

- **Zelfgehost**: draait op jouw hardware, volgens jouw regels
- **Meerdere kanalen**: één Gateway bedient gelijktijdig elke geconfigureerde kanaalplugin
- **Agent-native**: gebouwd voor programmeeragents met toolgebruik, sessies, geheugen en routering met meerdere agents
- **Open source**: met MIT-licentie en aangestuurd door de community

**Wat heb je nodig?** Node 24.15+ (aanbevolen), Node 22 LTS (`22.22.3+`) voor compatibiliteit, of Node 25.9+, een API-sleutel van de gekozen provider en 5 minuten. Gebruik voor de beste kwaliteit en beveiliging het krachtigste beschikbare model van de nieuwste generatie.

## Hoe het werkt

```mermaid
flowchart LR
  A["Chatapps + plugins"] --> B["Gateway"]
  B --> C["OpenClaw-agent"]
  B --> D["CLI"]
  B --> E["Webbedieningsinterface"]
  B --> F["macOS-app"]
  B --> G["iOS- en Android-nodes"]
```

De Gateway is de enige gezaghebbende bron voor sessies, routering en kanaalverbindingen.

## Belangrijkste mogelijkheden

<Columns>
  <Card title="Gateway voor meerdere kanalen" icon="network" href="/nl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat en meer met één Gateway-proces.
  </Card>
  <Card title="Kanaalplugins" icon="plug" href="/nl/tools/plugin">
    Kanaalplugins voegen Matrix, Nostr, Twitch, Zalo en meer toe; officiële plugins worden op aanvraag geïnstalleerd.
  </Card>
  <Card title="Routering met meerdere agents" icon="route" href="/nl/concepts/multi-agent">
    Geïsoleerde sessies per agent, werkruimte of afzender.
  </Card>
  <Card title="Mediaondersteuning" icon="image" href="/nl/nodes/images">
    Verstuur en ontvang afbeeldingen, audio en documenten.
  </Card>
  <Card title="Webbedieningsinterface" icon="monitor" href="/nl/web/control-ui">
    Browserdashboard voor chat, configuratie, sessies en nodes.
  </Card>
  <Card title="Mobiele nodes" icon="smartphone" href="/nl/nodes">
    Koppel iOS- en Android-nodes voor workflows met Canvas, camera en spraak.
  </Card>
</Columns>

## Snel aan de slag

<Steps>
  <Step title="OpenClaw installeren">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Onboarding uitvoeren en de service installeren">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatten">
    Open de bedieningsinterface in je browser en stuur een bericht:

    ```bash
    openclaw dashboard
    ```

    Of verbind een kanaal ([Telegram](/nl/channels/telegram) is het snelst) en chat vanaf je telefoon.

  </Step>
</Steps>

Heb je de volledige installatie- en ontwikkelconfiguratie nodig? Zie [Aan de slag](/nl/start/getting-started).

## Dashboard

Open de bedieningsinterface in de browser nadat de Gateway is gestart.

- Lokale standaardinstelling: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Externe toegang: [Webinterfaces](/nl/web) en [Tailscale](/nl/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configuratie (optioneel)

De configuratie bevindt zich in `~/.openclaw/openclaw.json`.

- Als je **niets doet**, gebruikt OpenClaw de meegeleverde OpenClaw-agentruntime; privéberichten delen de hoofdsessie van de agent en elke groepschat krijgt een eigen sessie.
- Als je de toegang wilt beperken, begin je met `channels.whatsapp.allowFrom` en (voor groepen) vermeldingsregels.

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
  <Card title="Documentatiehubs" href="/nl/start/hubs" icon="book-open">
    Alle documentatie en handleidingen, geordend op gebruiksscenario.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="settings">
    Kerninstellingen van de Gateway, tokens en providerconfiguratie.
  </Card>
  <Card title="Externe toegang" href="/nl/gateway/remote" icon="globe">
    Toegangspatronen voor SSH en tailnet.
  </Card>
  <Card title="Kanalen" href="/nl/channels/telegram" icon="message-square">
    Kanaalspecifieke configuratie voor Discord, Feishu, Microsoft Teams, Telegram, WhatsApp en meer.
  </Card>
  <Card title="Nodes" href="/nl/nodes" icon="smartphone">
    iOS- en Android-nodes met koppeling, Canvas, camera en apparaatacties.
  </Card>
  <Card title="Hulp" href="/nl/help" icon="life-buoy">
    Veelvoorkomende oplossingen en startpunt voor probleemoplossing.
  </Card>
</Columns>

## Meer informatie

<Columns>
  <Card title="Volledige lijst met functies" href="/nl/concepts/features" icon="list">
    Volledige mogelijkheden voor kanalen, routering en media.
  </Card>
  <Card title="Routering met meerdere agents" href="/nl/concepts/multi-agent" icon="route">
    Isolatie van werkruimten en sessies per agent.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security" icon="shield">
    Tokens, toelatingslijsten en veiligheidsmaatregelen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/gateway/troubleshooting" icon="wrench">
    Gatewaydiagnostiek en veelvoorkomende fouten.
  </Card>
  <Card title="Over het project en naamsvermeldingen" href="/nl/reference/credits" icon="info">
    Oorsprong van het project, bijdragers en licentie.
  </Card>
</Columns>
