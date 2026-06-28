---
read_when:
    - Ersteinrichtung von Grund auf
    - Sie möchten den schnellsten Weg zu einem funktionierenden Chat
summary: OpenClaw installieren und Ihren ersten Chat in wenigen Minuten starten.
title: Erste Schritte
x-i18n:
    generated_at: "2026-06-28T20:45:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Installieren Sie OpenClaw, führen Sie das Onboarding aus und chatten Sie mit Ihrem KI-Assistenten — alles in
etwa 5 Minuten. Am Ende haben Sie einen laufenden Gateway, konfigurierte Authentifizierung
und eine funktionierende Chat-Sitzung.

## Was Sie benötigen

- **Node.js** — Node 24 empfohlen (Node 22.19+ wird ebenfalls unterstützt)
- **Ein API-Schlüssel** von einem Modell-Provider (Anthropic, OpenAI, Google usw.) — das Onboarding fragt Sie danach

<Tip>
Prüfen Sie Ihre Node-Version mit `node --version`.
**Windows-Nutzer:** Die native Windows Hub-App ist der einfachste Desktop-Weg. Der
PowerShell-Installer und die WSL2-Gateway-Pfade werden ebenfalls unterstützt. Siehe [Windows](/de/platforms/windows).
Müssen Sie Node installieren? Siehe [Node-Einrichtung](/de/install/node).
</Tip>

## Schnelleinrichtung

<Steps>
  <Step title="OpenClaw installieren">
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
    Weitere Installationsmethoden (Docker, Nix, npm): [Installation](/de/install).
    </Note>

  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Auswahl eines Modell-Providers, das Festlegen eines API-Schlüssels
    und die Konfiguration des Gateway. Der Schnellstart dauert normalerweise nur wenige Minuten, aber
    Provider-Anmeldung, Channel-Kopplung, Daemon-Installation, Netzwerk-Downloads, Skills
    oder optionale Plugins können das vollständige Onboarding verlängern. Sie können optionale
    Schritte überspringen und später mit `openclaw configure` zurückkehren.

    Siehe [Onboarding (CLI)](/de/start/wizard) für die vollständige Referenz.

  </Step>
  <Step title="Prüfen, ob der Gateway läuft">
    ```bash
    openclaw gateway status
    ```

    Sie sollten sehen, dass der Gateway auf Port 18789 lauscht.

  </Step>
  <Step title="Dashboard öffnen">
    ```bash
    openclaw dashboard
    ```

    Dadurch wird die Control UI in Ihrem Browser geöffnet. Wenn sie geladen wird, funktioniert alles.

  </Step>
  <Step title="Ihre erste Nachricht senden">
    Geben Sie eine Nachricht im Chat der Control UI ein, und Sie sollten eine KI-Antwort erhalten.

    Möchten Sie stattdessen von Ihrem Telefon aus chatten? Der am schnellsten einzurichtende Channel ist
    [Telegram](/de/channels/telegram) (nur ein Bot-Token). Siehe [Channels](/de/channels)
    für alle Optionen.

  </Step>
</Steps>

<Accordion title="Erweitert: eigenen Control-UI-Build einbinden">
  Wenn Sie einen lokalisierten oder angepassten Dashboard-Build pflegen, verweisen Sie
  `gateway.controlUi.root` auf ein Verzeichnis, das Ihre gebauten statischen
  Assets und `index.html` enthält.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Legen Sie dann Folgendes fest:

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

Starten Sie den Gateway neu und öffnen Sie das Dashboard erneut:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Nächste Schritte

<Columns>
  <Card title="Channel verbinden" href="/de/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und mehr.
  </Card>
  <Card title="Kopplung und Sicherheit" href="/de/channels/pairing" icon="shield">
    Steuern Sie, wer Ihrem Agent Nachrichten senden kann.
  </Card>
  <Card title="Gateway konfigurieren" href="/de/gateway/configuration" icon="settings">
    Modelle, Tools, Sandbox und erweiterte Einstellungen.
  </Card>
  <Card title="Tools durchsuchen" href="/de/tools" icon="wrench">
    Browser, exec, Websuche, Skills und Plugins.
  </Card>
</Columns>

<Accordion title="Erweitert: Umgebungsvariablen">
  Wenn Sie OpenClaw als Dienstkonto ausführen oder eigene Pfade verwenden möchten:

- `OPENCLAW_HOME` — Home-Verzeichnis für interne Pfadauflösung
- `OPENCLAW_STATE_DIR` — überschreibt das State-Verzeichnis
- `OPENCLAW_CONFIG_PATH` — überschreibt den Pfad der Konfigurationsdatei

Vollständige Referenz: [Umgebungsvariablen](/de/help/environment).
</Accordion>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Channels-Übersicht](/de/channels)
- [Einrichtung](/de/start/setup)
