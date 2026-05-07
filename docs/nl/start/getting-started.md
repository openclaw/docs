---
read_when:
    - Eerste installatie vanaf nul
    - Je wilt de snelste weg naar een werkende chat
summary: Installeer OpenClaw en voer binnen enkele minuten je eerste chatgesprek.
title: Aan de slag
x-i18n:
    generated_at: "2026-05-07T13:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Installeer OpenClaw, doorloop de onboarding en chat met je AI-assistent, alles in
ongeveer 5 minuten. Aan het einde heb je een draaiende Gateway, geconfigureerde auth
en een werkende chatsessie.

## Wat je nodig hebt

- **Node.js** — Node 24 aanbevolen (Node 22.16+ ook ondersteund)
- **Een API-sleutel** van een modelprovider (Anthropic, OpenAI, Google, enz.) — onboarding vraagt hierom

<Tip>
Controleer je Node-versie met `node --version`.
**Windows-gebruikers:** zowel native Windows als WSL2 worden ondersteund. WSL2 is
stabieler en aanbevolen voor de volledige ervaring. Zie [Windows](/nl/platforms/windows).
Moet je Node installeren? Zie [Node instellen](/nl/install/node).
</Tip>

## Snelle setup

<Steps>
  <Step title="OpenClaw installeren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Proces van installatiescript"
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
  <Step title="Controleren of de Gateway draait">
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
  <Step title="Je eerste bericht verzenden">
    Typ een bericht in de Control UI-chat en je zou een AI-antwoord moeten krijgen.

    Wil je liever vanaf je telefoon chatten? Het snelste kanaal om in te stellen is
    [Telegram](/nl/channels/telegram) (alleen een bottoken). Zie [Kanalen](/nl/channels)
    voor alle opties.

  </Step>
</Steps>

<Accordion title="Geavanceerd: een aangepaste Control UI-build koppelen">
  Als je een gelokaliseerde of aangepaste dashboardbuild onderhoudt, laat
  `gateway.controlUi.root` verwijzen naar een map die je gebouwde statische
  assets en `index.html` bevat.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Kopieer je gebouwde statische bestanden naar die map.
```

Stel vervolgens in:

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

## Wat je hierna kunt doen

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
    Browser, exec, webzoekfunctie, Skills en plugins.
  </Card>
</Columns>

<Accordion title="Geavanceerd: omgevingsvariabelen">
  Als je OpenClaw als serviceaccount uitvoert of aangepaste paden wilt:

- `OPENCLAW_HOME` — homedirectory voor interne padresolutie
- `OPENCLAW_STATE_DIR` — overschrijf de statusdirectory
- `OPENCLAW_CONFIG_PATH` — overschrijf het pad naar het configbestand

Volledige referentie: [Omgevingsvariabelen](/nl/help/environment).
</Accordion>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Kanalenoverzicht](/nl/channels)
- [Setup](/nl/start/setup)
