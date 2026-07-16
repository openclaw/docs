---
read_when:
    - Ersteinrichtung von Grund auf
    - Sie möchten auf dem schnellsten Weg zu einem funktionierenden Chat gelangen
summary: Installieren Sie OpenClaw und führen Sie innerhalb weniger Minuten Ihren ersten Chat.
title: Erste Schritte
x-i18n:
    generated_at: "2026-07-16T13:39:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Installieren Sie OpenClaw, führen Sie das Onboarding durch und chatten Sie in etwa 5
Minuten mit Ihrem KI-Assistenten. Am Ende verfügen Sie über einen laufenden Gateway, eine konfigurierte Authentifizierung und eine
funktionierende Chatsitzung.

## Voraussetzungen

- **Node.js 22.22.3+, 24.15+ oder 25.9+** (24 ist die empfohlene Standardeinstellung)
- **Ein API-Schlüssel** eines Modell-Providers (Anthropic, OpenAI, Google usw.) — während des Onboardings werden Sie danach gefragt

<Tip>
Prüfen Sie Ihre Node-Version mit `node --version`.
**Windows-Nutzer:** Die native Windows Hub-App ist der einfachste Weg für die Desktop-Nutzung. Das
PowerShell-Installationsprogramm und WSL2-Gateway-Pfade werden ebenfalls unterstützt. Siehe [Windows](/de/platforms/windows).
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
    Weitere Installationsmethoden (Docker, Nix, npm): [Installation](/de/install).
    </Note>

  </Step>
  <Step title="Onboarding durchführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Auswahl eines Modell-Providers, das Festlegen eines API-Schlüssels
    und die Konfiguration des Gateways. Der Schnellstart dauert normalerweise nur wenige Minuten, doch
    die Anmeldung beim Provider, die Kanalkopplung, die Daemon-Installation, Netzwerkdownloads, Skills
    oder optionale Plugins können das vollständige Onboarding verlängern. Überspringen Sie optionale
    Schritte und kehren Sie später mit `openclaw configure` zurück.

    Die vollständige Referenz finden Sie unter [Onboarding (CLI)](/de/start/wizard).

  </Step>
  <Step title="Überprüfen, ob der Gateway ausgeführt wird">
    ```bash
    openclaw gateway status
    ```

    Der Gateway sollte auf Port 18789 lauschen.

  </Step>
  <Step title="Dashboard öffnen">
    ```bash
    openclaw dashboard
    ```

    Dadurch wird die Control UI in Ihrem Browser geöffnet. Wenn sie geladen wird, funktioniert alles.

  </Step>
  <Step title="Ihre erste Nachricht senden">
    Geben Sie im Chat der Control UI eine Nachricht ein. Sie sollten eine KI-Antwort erhalten.

    Möchten Sie stattdessen von Ihrem Telefon aus chatten? Der am schnellsten einzurichtende Kanal ist
    [Telegram](/de/channels/telegram) (Sie benötigen nur ein Bot-Token). Unter [Kanäle](/de/channels)
    finden Sie alle Optionen.

  </Step>
</Steps>

<Accordion title="Erweitert: benutzerdefinierten Control-UI-Build einbinden">
  Wenn Sie einen lokalisierten oder angepassten Dashboard-Build verwalten, verweisen Sie mit
  `gateway.controlUi.root` auf ein Verzeichnis, das Ihre erstellten statischen
  Assets und `index.html` enthält.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Kopieren Sie Ihre erstellten statischen Dateien in dieses Verzeichnis.
```

Legen Sie anschließend Folgendes fest:

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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere.
  </Card>
  <Card title="Kopplung und Sicherheit" href="/de/channels/pairing" icon="shield">
    Legen Sie fest, wer Ihrem Agenten Nachrichten senden darf.
  </Card>
  <Card title="Gateway konfigurieren" href="/de/gateway/configuration" icon="settings">
    Modelle, Werkzeuge, Sandbox und erweiterte Einstellungen.
  </Card>
  <Card title="Werkzeuge durchsuchen" href="/de/tools" icon="wrench">
    Browser, Ausführung, Websuche, Skills und Plugins.
  </Card>
</Columns>

<Accordion title="Erweitert: Umgebungsvariablen">
  Wenn Sie OpenClaw unter einem Dienstkonto ausführen oder benutzerdefinierte Pfade verwenden möchten:

- `OPENCLAW_HOME` — Stammverzeichnis für die interne Pfadauflösung
- `OPENCLAW_STATE_DIR` — Zustandsverzeichnis überschreiben
- `OPENCLAW_CONFIG_PATH` — Pfad der Konfigurationsdatei überschreiben

Vollständige Referenz: [Umgebungsvariablen](/de/help/environment).
</Accordion>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Kanalübersicht](/de/channels)
- [Einrichtung](/de/start/setup)
