---
read_when:
    - Eerste installatie vanaf nul
    - Je wilt de snelste manier om een werkende chat op te zetten
summary: Installeer OpenClaw en start binnen enkele minuten je eerste chat.
title: Aan de slag
x-i18n:
    generated_at: "2026-07-12T09:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Installeer OpenClaw, doorloop de onboarding en chat binnen ongeveer 5 minuten
met je AI-assistent. Aan het einde heb je een actieve Gateway, geconfigureerde
authenticatie en een werkende chatsessie.

## Wat je nodig hebt

- **Node.js 22.19+, 23.11+ of 24+** (24 is de aanbevolen standaardversie)
- **Een API-sleutel** van een modelprovider (Anthropic, OpenAI, Google enzovoort) — tijdens de onboarding wordt hierom gevraagd

<Tip>
Controleer je Node-versie met `node --version`.
**Windows-gebruikers:** de systeemeigen Windows Hub-app is de eenvoudigste optie voor desktopgebruik. Ook het
PowerShell-installatieprogramma en Gateway via WSL2 worden ondersteund. Zie [Windows](/nl/platforms/windows).
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
  alt="Installatieproces van het script"
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
    Andere installatiemethoden (Docker, Nix, npm): [Installatie](/nl/install).
    </Note>

  </Step>
  <Step title="De onboarding doorlopen">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard begeleidt je bij het kiezen van een modelprovider, het instellen van een API-sleutel
    en het configureren van de Gateway. QuickStart duurt meestal maar enkele minuten, maar
    aanmelden bij de provider, het koppelen van een kanaal, het installeren van de daemon, netwerkdownloads, Skills
    of optionele plugins kunnen ervoor zorgen dat de volledige onboarding langer duurt. Sla optionele
    stappen over en ga er later naar terug met `openclaw configure`.

    Zie [Onboarding (CLI)](/nl/start/wizard) voor de volledige naslaginformatie.

  </Step>
  <Step title="Controleren of de Gateway actief is">
    ```bash
    openclaw gateway status
    ```

    Je hoort te zien dat de Gateway luistert op poort 18789.

  </Step>
  <Step title="Het dashboard openen">
    ```bash
    openclaw dashboard
    ```

    Hiermee wordt de Control UI in je browser geopend. Als deze wordt geladen, werkt alles.

  </Step>
  <Step title="Je eerste bericht versturen">
    Typ een bericht in de chat van de Control UI. Je hoort vervolgens een antwoord van de AI te krijgen.

    Wil je liever vanaf je telefoon chatten? Het snelst in te stellen kanaal is
    [Telegram](/nl/channels/telegram) (je hebt alleen een bottoken nodig). Zie [Kanalen](/nl/channels)
    voor alle opties.

  </Step>
</Steps>

<Accordion title="Geavanceerd: een aangepaste Control UI-build koppelen">
  Als je een gelokaliseerde of aangepaste dashboardbuild onderhoudt, laat je
  `gateway.controlUi.root` verwijzen naar een map met je gebouwde statische
  bestanden en `index.html`.

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

Start de Gateway opnieuw en open het dashboard opnieuw:

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
    Modellen, hulpmiddelen, sandbox en geavanceerde instellingen.
  </Card>
  <Card title="Hulpmiddelen bekijken" href="/nl/tools" icon="wrench">
    Browser, uitvoering, zoeken op het web, Skills en plugins.
  </Card>
</Columns>

<Accordion title="Geavanceerd: omgevingsvariabelen">
  Als je OpenClaw uitvoert als een serviceaccount of aangepaste paden wilt gebruiken:

- `OPENCLAW_HOME` — basismap voor interne padomzetting
- `OPENCLAW_STATE_DIR` — de statusmap overschrijven
- `OPENCLAW_CONFIG_PATH` — het pad naar het configuratiebestand overschrijven

Volledige naslaginformatie: [Omgevingsvariabelen](/nl/help/environment).
</Accordion>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Overzicht van kanalen](/nl/channels)
- [Configuratie](/nl/start/setup)
