---
read_when:
    - Eerste installatie vanaf nul
    - Je wilt de snelste weg naar een werkende chat
summary: Installeer OpenClaw en start binnen enkele minuten je eerste chat.
title: Aan de slag
x-i18n:
    generated_at: "2026-07-16T16:26:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Installeer OpenClaw, doorloop de onboarding en chat binnen ongeveer 5
minuten met je AI-assistent. Aan het einde heb je een werkende Gateway, geconfigureerde authenticatie en een
werkende chatsessie.

## Wat je nodig hebt

- **Node.js 22.22.3+, 24.15+ of 25.9+** (24 is de aanbevolen standaardversie)
- **Een API-sleutel** van een modelprovider (Anthropic, OpenAI, Google enz.) — tijdens de onboarding wordt hierom gevraagd

<Tip>
Controleer je Node-versie met `node --version`.
**Windows-gebruikers:** de native Windows Hub-app is de eenvoudigste desktopoptie. Het
PowerShell-installatieprogramma en de WSL2 Gateway-opties worden ook ondersteund. Zie [Windows](/nl/platforms/windows).
Moet je Node installeren? Zie [Node installeren](/nl/install/node).
</Tip>

## Snel instellen

<Steps>
  <Step title="OpenClaw installeren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Installatieproces"
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
  <Step title="De onboarding uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard begeleidt je bij het kiezen van een modelprovider, het instellen van een API-sleutel
    en het configureren van de Gateway. QuickStart duurt meestal maar enkele minuten, maar
    aanmelden bij de provider, een kanaal koppelen, de daemon installeren, netwerkdownloads, Skills
    of optionele plugins kunnen ervoor zorgen dat de volledige onboarding langer duurt. Sla optionele
    stappen over en keer later terug met `openclaw configure`.

    Zie [Onboarding (CLI)](/nl/start/wizard) voor de volledige documentatie.

  </Step>
  <Step title="Controleren of de Gateway actief is">
    ```bash
    openclaw gateway status
    ```

    Je hoort te zien dat de Gateway op poort 18789 luistert.

  </Step>
  <Step title="Het dashboard openen">
    ```bash
    openclaw dashboard
    ```

    Hiermee wordt de Control UI in je browser geopend. Als deze wordt geladen, werkt alles.

  </Step>
  <Step title="Je eerste bericht verzenden">
    Typ een bericht in de chat van de Control UI. Je hoort vervolgens een AI-antwoord te krijgen.

    Wil je liever vanaf je telefoon chatten? Het snelst in te stellen kanaal is
    [Telegram](/nl/channels/telegram) (alleen een bottoken). Zie [Kanalen](/nl/channels)
    voor alle opties.

  </Step>
</Steps>

<Accordion title="Geavanceerd: een aangepaste Control UI-build koppelen">
  Als je een gelokaliseerde of aangepaste dashboardbuild onderhoudt, laat
  `gateway.controlUi.root` verwijzen naar een map met je gebouwde statische
  assets en `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Kopieer je gebouwde statische bestanden naar die map.
```

Stel vervolgens het volgende in:

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

## Volgende stappen

<Columns>
  <Card title="Een kanaal verbinden" href="/nl/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer.
  </Card>
  <Card title="Koppeling en veiligheid" href="/nl/channels/pairing" icon="shield">
    Bepaal wie berichten naar je agent kan sturen.
  </Card>
  <Card title="De Gateway configureren" href="/nl/gateway/configuration" icon="settings">
    Modellen, tools, sandbox en geavanceerde instellingen.
  </Card>
  <Card title="Tools bekijken" href="/nl/tools" icon="wrench">
    Browser, exec, zoeken op het web, Skills en plugins.
  </Card>
</Columns>

<Accordion title="Geavanceerd: omgevingsvariabelen">
  Als je OpenClaw als serviceaccount uitvoert of aangepaste paden wilt gebruiken:

- `OPENCLAW_HOME` — basismap voor interne padomzetting
- `OPENCLAW_STATE_DIR` — de statusmap overschrijven
- `OPENCLAW_CONFIG_PATH` — het pad naar het configuratiebestand overschrijven

Volledige documentatie: [Omgevingsvariabelen](/nl/help/environment).
</Accordion>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Overzicht van kanalen](/nl/channels)
- [Instellen](/nl/start/setup)
