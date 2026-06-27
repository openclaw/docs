---
read_when:
    - Eerste installatie vanaf nul
    - Je wilt de snelste weg naar een werkende chat
summary: Installeer OpenClaw en voer binnen enkele minuten je eerste chat uit.
title: Aan de slag
x-i18n:
    generated_at: "2026-06-27T18:21:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Installeer OpenClaw, voer onboarding uit en chat met je AI-assistent — allemaal in
ongeveer 5 minuten. Aan het einde heb je een actieve Gateway, geconfigureerde auth
en een werkende chatsessie.

## Wat je nodig hebt

- **Node.js** — Node 24 aanbevolen (Node 22.19+ wordt ook ondersteund)
- **Een API-sleutel** van een modelprovider (Anthropic, OpenAI, Google, enz.) — onboarding vraagt je hierom

<Tip>
Controleer je Node-versie met `node --version`.
**Windows-gebruikers:** de native Windows Hub-app is de eenvoudigste desktoproute. Het
PowerShell-installatieprogramma en de WSL2 Gateway-routes worden ook ondersteund. Zie [Windows](/nl/platforms/windows).
Moet je Node installeren? Zie [Node-installatie](/nl/install/node).
</Tip>

## Snelle installatie

<Steps>
  <Step title="OpenClaw installeren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Proces voor installatiescript"
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

    Hiermee wordt de Control UI in je browser geopend. Als die laadt, werkt alles.

  </Step>
  <Step title="Je eerste bericht verzenden">
    Typ een bericht in de Control UI-chat en je zou een AI-antwoord moeten krijgen.

    Wil je in plaats daarvan vanaf je telefoon chatten? Het snelst in te stellen kanaal is
    [Telegram](/nl/channels/telegram) (alleen een bottoken). Zie [Kanalen](/nl/channels)
    voor alle opties.

  </Step>
</Steps>

<Accordion title="Geavanceerd: een aangepaste Control UI-build koppelen">
  Als je een gelokaliseerde of aangepaste dashboardbuild onderhoudt, wijs
  `gateway.controlUi.root` naar een directory die je gebouwde statische
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

Herstart de Gateway en open het dashboard opnieuw:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Wat je hierna kunt doen

<Columns>
  <Card title="Een kanaal verbinden" href="/nl/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer.
  </Card>
  <Card title="Koppeling en veiligheid" href="/nl/channels/pairing" icon="shield">
    Bepaal wie je agent berichten kan sturen.
  </Card>
  <Card title="De Gateway configureren" href="/nl/gateway/configuration" icon="settings">
    Modellen, tools, sandbox en geavanceerde instellingen.
  </Card>
  <Card title="Tools bekijken" href="/nl/tools" icon="wrench">
    Browser, exec, webzoekopdracht, skills en plugins.
  </Card>
</Columns>

<Accordion title="Geavanceerd: omgevingsvariabelen">
  Als je OpenClaw uitvoert als serviceaccount of aangepaste paden wilt gebruiken:

- `OPENCLAW_HOME` — homedirectory voor interne padresolutie
- `OPENCLAW_STATE_DIR` — overschrijf de statusdirectory
- `OPENCLAW_CONFIG_PATH` — overschrijf het pad naar het configuratiebestand

Volledige referentie: [Omgevingsvariabelen](/nl/help/environment).
</Accordion>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Kanalenoverzicht](/nl/channels)
- [Setup](/nl/start/setup)
