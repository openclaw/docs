---
read_when:
    - Förstagångskonfiguration från grunden
    - Du vill ha den snabbaste vägen till en fungerande chatt
summary: Installera OpenClaw och starta din första chatt på några minuter.
title: Kom igång
x-i18n:
    generated_at: "2026-10-15T00:25:48Z"
    postprocess_version: locale-links-v1
    prompt_version: 32
    source_hash: 1e40b583a2b3bb902795d8887c3ddd46d7ab88d4073ae6a2cc33744dc9b30634
    source_path: start/getting-started.md
    workflow: 17
---

Installera OpenClaw, genomför första konfigurationen och chatta med din AI-assistent på ungefär 5
minuter. När du är klar har du en Gateway som körs, konfigurerad autentisering och en
fungerande chattsession.

## Vad du behöver

- **Node.js 24.16+ eller 26.1+** (Node 26 är den rekommenderade körmiljön)
- **En befintlig inloggning i Claude Code eller Codex CLI, eller en API-nyckel från en leverantör** — första konfigurationen kan återanvända den

<Tip>
Kontrollera din Node-version med `node --version`.
**Windows-användare:** Windows Hub-appen som körs direkt i Windows är det enklaste skrivbordsalternativet.
Installationsprogrammet för PowerShell och Gateway via WSL2 stöds också. Se [Windows](/platforms/windows).
Behöver du installera Node? Se [Konfiguration av Node](/install/node).
</Tip>

## Prova med ett enda kommando

```bash
npx openclaw@latest
```

Vid en nyinstallation väljer du **Snabbstart** efter en enradig hänvisning till
[säkerhetsguiden](/gateway/security). Det är den enda frågan under första konfigurationen när
fungerande AI-åtkomst redan finns: OpenClaw
hittar en befintlig inloggning i Claude Code eller Codex CLI eller en API-nyckel, verifierar den med en
faktisk modellgenerering, sparar konfigurationen och öppnar webbkontrollpanelen.

Gateway körs i den här terminalen tills du trycker på **Ctrl+C**; din konfiguration förblir
sparad. Om ingen identifierad åtkomstväg fungerar öppnar första konfigurationen manuell leverantörskonfiguration.
Välj **Anpassad konfiguration** för att i stället gå igenom alla guidade alternativ.

För att låta Gateway fortsätta köras i bakgrunden senare installerar du CLI nedan och
kör `openclaw gateway install`. Kör `openclaw` för TUI eller
`openclaw dashboard` för att öppna webbgränssnittet igen.

## Snabbkonfiguration

<Steps>
  <Step title="Installation av OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Installationsskriptets process"
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
    Andra installationsmetoder (Docker, Nix, npm): [Installation](/install).
    </Note>

  </Step>
  <Step title="Slutför första konfigurationen">
    Installationsprogrammet startar automatiskt guiden för första konfigurationen. Välj
    **Snabbstart** för att återanvända identifierad AI-åtkomst och öppna kontrollpanelen, eller
    **Anpassad konfiguration** för hela det guidade flödet. Inloggning hos leverantören och valfri
    konfiguration kan ta längre tid. Återkom senare med `openclaw configure` för
    ytterligare inställningar. `openclaw onboard --classic` öppnar i stället den klassiska
    steg-för-steg-guiden.

    Se [Första konfigurationen (CLI)](/start/wizard) för den fullständiga referensen.

  </Step>
  <Step title="Installera Gateway-tjänsten">
    Snabbstart låter Gateway köras i förgrunden i den här terminalen. Nästa
    steg kräver att den körs i bakgrunden. Tryck på **Ctrl+C** för att stoppa
    Gateway i förgrunden och installera sedan tjänsten:

    ```bash
    openclaw gateway install
    ```

    Detta installerar en LaunchAgent på macOS, en systemd-användarenhet på Linux och
    WSL2, eller en schemalagd aktivitet direkt i Windows (med ett inloggningsobjekt
    i användarens autostartmapp som reservlösning om skapandet av aktiviteten nekas).
    Din konfiguration förblir sparad när tjänsten stoppas och installeras.

  </Step>
  <Step title="Verifiera att Gateway körs">
    ```bash
    openclaw gateway status
    ```

    Du bör se att Gateway lyssnar på port 18789.

  </Step>
  <Step title="Öppna kontrollpanelen">
    ```bash
    openclaw dashboard
    ```

    Detta öppnar Kontrollgränssnitt i din webbläsare. Om det läses in fungerar allt.

  </Step>
  <Step title="Skicka ditt första meddelande">
    Skriv ett meddelande i chatten i Kontrollgränssnitt, så bör du få ett AI-svar.

    Vill du chatta från telefonen i stället? Den snabbaste kanalen att konfigurera är
    [Telegram](/channels/telegram) (bara en bottoken). Se [Kanaler](/channels)
    för alla alternativ.

  </Step>
</Steps>

<Accordion title="Avancerat: montera en anpassad version av Kontrollgränssnitt">
  Om du underhåller en lokaliserad eller anpassad version av kontrollpanelen, låt
  `gateway.controlUi.root` peka på en katalog som innehåller dina byggda statiska
  resurser och `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Ange sedan:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "${HOME}/.openclaw/control-ui-custom"
    }
  }
}
```

Starta om Gateway och öppna kontrollpanelen igen:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Om konfigurationen inte fungerar

Ett enda kommando omvandlar installationens aktuella tillstånd till en diagnos som du kan agera på:

```bash
openclaw triage
```

Det kör hälsokontroller som bara läser data, skriver en rensad prompt som beskriver resultaten och erbjuder sedan att lämna över prompten till en kodningsagent som det hittar på din dator — Claude Code, Codex CLI eller den inbyggda OpenClaw-agenten — så att agenten startar med diagnosen redan inläst. Välj ”skriv bara ut kommandona” om du hellre vill sköta överlämningen själv.

Ingenting lämnar din dator förrän du väljer en agent, och hemligheter, token, råa chattdata och råa loggar utesluts från prompten.

Om du i stället vill läsa resultaten själv kör du [`openclaw doctor`](/cli/doctor). För felsökningsvägar som utgår från symtomen, se [Felsökning](/help/troubleshooting).

## Vad du kan göra härnäst

<Columns>
  <Card title="Anslut en kanal" href="/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo med flera.
  </Card>
  <Card title="Parkoppling och säkerhet" href="/channels/pairing" icon="shield">
    Styr vem som kan skicka meddelanden till din agent.
  </Card>
  <Card title="Konfigurera Gateway" href="/gateway/configuration" icon="settings">
    Modeller, verktyg, sandlåda och avancerade inställningar.
  </Card>
  <Card title="Utforska verktyg" href="/tools" icon="wrench">
    Webbläsare, exec, webbsökning, Skills och pluginer.
  </Card>
</Columns>

<Accordion title="Avancerat: miljövariabler">
  Om du kör OpenClaw med ett tjänstekonto eller vill använda anpassade sökvägar:

- `OPENCLAW_HOME` — hemkatalog för intern sökvägsupplösning
- `OPENCLAW_STATE_DIR` — åsidosätt tillståndskatalogen
- `OPENCLAW_CONFIG_PATH` — åsidosätt sökvägen till konfigurationsfilen

Fullständig referens: [Miljövariabler](/help/environment).
</Accordion>

## Relaterat

- [Installationsöversikt](/install)
- [Kanalöversikt](/channels)
- [Konfiguration](/start/setup)
- [Konfiguration av personlig assistent](/start/openclaw) - heltäckande guide till ett dedikerat nummer som fungerar som en ständigt tillgänglig assistent
- [Triage](/cli/triage)
- [Felsökning](/help/troubleshooting)
