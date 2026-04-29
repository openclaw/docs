---
read_when:
    - Eerste installatie vanaf nul
    - Je wilt de snelste weg naar een werkende chat
summary: Installeer OpenClaw en start binnen enkele minuten je eerste chat.
title: Aan de slag
x-i18n:
    generated_at: "2026-04-29T23:19:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 16
---

Installeer OpenClaw, voer onboarding uit en chat met je AI-assistent — alles in
ongeveer 5 minuten. Aan het einde heb je een werkende Gateway, geconfigureerde auth
en een werkende chatsessie.

## Wat je nodig hebt

- **Node.js** — Node 24 aanbevolen (Node 22.14+ wordt ook ondersteund)
- **Een API-sleutel** van een modelprovider (Anthropic, OpenAI, Google, enz.) — onboarding vraagt je hierom

<Tip>
Controleer je Node-versie met `node --version`.
**Windows-gebruikers:** zowel native Windows als WSL2 worden ondersteund. WSL2 is stabieler
en aanbevolen voor de volledige ervaring. Zie [Windows](/nl/platforms/windows).
Moet je Node installeren? Zie [Node-installatie](/nl/install/node).
</Tip>

## Snelle configuratie

<Steps>
  <Step title="OpenClaw installeren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Andere installatiemethoden (Docker, Nix, npm): [Installeren](/nl/install).
    </Note>

  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard begeleidt je bij het kiezen van een modelprovider, het instellen van een API-sleutel
    en het configureren van de Gateway. Dit duurt ongeveer 2 minuten.

    Zie [Onboarding (CLI)](/nl/start/wizard) voor de volledige referentie.

  </Step>
  <Step title="Controleren of de Gateway actief is">
    ```bash
    openclaw gateway status
    ```

    Je zou moeten zien dat de Gateway luistert op poort 18789.

  </Step>
  <Step title="Het dashboard openen">
    ```bash
    openclaw dashboard
    ```

    Dit opent de Control UI in je browser. Als deze laadt, werkt alles.

  </Step>
  <Step title="Je eerste bericht sturen">
    Typ een bericht in de Control UI-chat en je zou een AI-antwoord moeten krijgen.

    Wil je liever vanaf je telefoon chatten? Het snelste kanaal om in te stellen is
    [Telegram](/nl/channels/telegram) (alleen een bottoken). Zie [Kanalen](/nl/channels)
    voor alle opties.

  </Step>
</Steps>

<Accordion title="Geavanceerd: een aangepaste Control UI-build mounten">
  Als je een gelokaliseerde of aangepaste dashboardbuild onderhoudt, wijs
  `gateway.controlUi.root` naar een map die je gebouwde statische
  assets en `index.html` bevat.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Stel daarna in:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Herstart de gateway en open het dashboard opnieuw:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Wat nu te doen

<Columns>
  <Card title="Een kanaal verbinden" href="/nl/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer.
  </Card>
  <Card title="Koppelen en veiligheid" href="/nl/channels/pairing" icon="shield">
    Bepaal wie je agent berichten kan sturen.
  </Card>
  <Card title="De Gateway configureren" href="/nl/gateway/configuration" icon="settings">
    Modellen, tools, sandbox en geavanceerde instellingen.
  </Card>
  <Card title="Tools bekijken" href="/nl/tools" icon="wrench">
    Browser, exec, zoeken op het web, skills en plugins.
  </Card>
</Columns>

<Accordion title="Geavanceerd: omgevingsvariabelen">
  Als je OpenClaw uitvoert als serviceaccount of aangepaste paden wilt gebruiken:

- `OPENCLAW_HOME` — thuismap voor interne padresolutie
- `OPENCLAW_STATE_DIR` — overschrijf de statusmap
- `OPENCLAW_CONFIG_PATH` — overschrijf het pad naar het configuratiebestand

Volledige referentie: [Omgevingsvariabelen](/nl/help/environment).
</Accordion>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Kanalenoverzicht](/nl/channels)
- [Configuratie](/nl/start/setup)
