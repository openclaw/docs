---
read_when:
    - Ersteinrichtung von Grund auf
    - Sie möchten den schnellsten Weg zu einem funktionierenden Chat
summary: Installieren Sie OpenClaw und starten Sie in wenigen Minuten Ihren ersten Chat.
title: Erste Schritte
x-i18n:
    generated_at: "2026-06-27T18:14:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
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
**Windows-Benutzer:** Die native Windows-Hub-App ist der einfachste Desktop-Weg. Der
PowerShell-Installer und die WSL2-Gateway-Pfade werden ebenfalls unterstützt. Siehe [Windows](/de/platforms/windows).
Müssen Sie Node installieren? Siehe [Node-Einrichtung](/de/install/node).
</Tip>

## Schnelle Einrichtung

<Steps>
  <Step title="OpenClaw installieren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Ablauf des Installationsskripts"
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
    Andere Installationsmethoden (Docker, Nix, npm): [Installation](/de/install).
    </Note>

  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Auswahl eines Modell-Providers, das Festlegen eines API-Schlüssels
    und die Konfiguration des Gateway. Das dauert etwa 2 Minuten.

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

    Möchten Sie stattdessen von Ihrem Telefon aus chatten? Der am schnellsten einzurichtende Kanal ist
    [Telegram](/de/channels/telegram) (nur ein Bot-Token). Siehe [Kanäle](/de/channels)
    für alle Optionen.

  </Step>
</Steps>

<Accordion title="Erweitert: benutzerdefinierten Control-UI-Build einbinden">
  Wenn Sie einen lokalisierten oder angepassten Dashboard-Build pflegen, setzen Sie
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
  <Card title="Kanal verbinden" href="/de/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und mehr.
  </Card>
  <Card title="Kopplung und Sicherheit" href="/de/channels/pairing" icon="shield">
    Steuern Sie, wer Ihrem Agenten Nachrichten senden kann.
  </Card>
  <Card title="Gateway konfigurieren" href="/de/gateway/configuration" icon="settings">
    Modelle, Tools, Sandbox und erweiterte Einstellungen.
  </Card>
  <Card title="Tools durchsuchen" href="/de/tools" icon="wrench">
    Browser, exec, Websuche, Skills und Plugins.
  </Card>
</Columns>

<Accordion title="Erweitert: Umgebungsvariablen">
  Wenn Sie OpenClaw als Dienstkonto ausführen oder benutzerdefinierte Pfade verwenden möchten:

- `OPENCLAW_HOME` — Home-Verzeichnis für die interne Pfadauflösung
- `OPENCLAW_STATE_DIR` — überschreibt das State-Verzeichnis
- `OPENCLAW_CONFIG_PATH` — überschreibt den Pfad der Konfigurationsdatei

Vollständige Referenz: [Umgebungsvariablen](/de/help/environment).
</Accordion>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Kanäle – Übersicht](/de/channels)
- [Einrichtung](/de/start/setup)
