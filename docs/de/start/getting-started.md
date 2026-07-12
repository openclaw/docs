---
read_when:
    - Ersteinrichtung von Grund auf
    - Sie möchten auf dem schnellsten Weg zu einem funktionierenden Chat gelangen.
summary: Installieren Sie OpenClaw und starten Sie innerhalb weniger Minuten Ihren ersten Chat.
title: Erste Schritte
x-i18n:
    generated_at: "2026-07-12T15:53:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Installieren Sie OpenClaw, führen Sie das Onboarding durch und chatten Sie in etwa 5
Minuten mit Ihrem KI-Assistenten. Anschließend verfügen Sie über ein laufendes Gateway, eine
konfigurierte Authentifizierung und eine funktionierende Chatsitzung.

## Voraussetzungen

- **Node.js 22.19+, 23.11+ oder 24+** (24 ist die empfohlene Standardversion)
- **Ein API-Schlüssel** von einem Modell-Provider (Anthropic, OpenAI, Google usw.) — beim Onboarding werden Sie danach gefragt

<Tip>
Prüfen Sie Ihre Node-Version mit `node --version`.
**Windows-Benutzer:** Die native Windows-Hub-App ist der einfachste Weg für die Desktop-Nutzung. Der
PowerShell-Installer und Gateway unter WSL2 werden ebenfalls unterstützt. Siehe [Windows](/de/platforms/windows).
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
    Weitere Installationsmethoden (Docker, Nix, npm): [Installation](/de/install).
    </Note>

  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Auswahl eines Modell-Providers, das Festlegen eines API-Schlüssels
    und die Konfiguration des Gateways. Der Schnellstart dauert in der Regel nur wenige Minuten, die
    Provider-Anmeldung, die Kanalkopplung, die Daemon-Installation, Netzwerk-Downloads, Skills
    oder optionale Plugins können das vollständige Onboarding jedoch verlängern. Überspringen Sie optionale
    Schritte und kehren Sie später mit `openclaw configure` zurück.

    Die vollständige Referenz finden Sie unter [Onboarding (CLI)](/de/start/wizard).

  </Step>
  <Step title="Prüfen, ob das Gateway ausgeführt wird">
    ```bash
    openclaw gateway status
    ```

    Das Gateway sollte auf Port 18789 lauschen.

  </Step>
  <Step title="Dashboard öffnen">
    ```bash
    openclaw dashboard
    ```

    Dadurch wird die Control UI in Ihrem Browser geöffnet. Wenn sie geladen wird, funktioniert alles.

  </Step>
  <Step title="Ihre erste Nachricht senden">
    Geben Sie im Chat der Control UI eine Nachricht ein. Sie sollten eine KI-Antwort erhalten.

    Möchten Sie stattdessen über Ihr Mobiltelefon chatten? Am schnellsten lässt sich
    [Telegram](/de/channels/telegram) einrichten (Sie benötigen lediglich ein Bot-Token). Unter [Kanäle](/de/channels)
    finden Sie alle Optionen.

  </Step>
</Steps>

<Accordion title="Erweitert: einen benutzerdefinierten Control-UI-Build einbinden">
  Wenn Sie einen lokalisierten oder angepassten Dashboard-Build pflegen, legen Sie
  für `gateway.controlUi.root` ein Verzeichnis fest, das Ihre erstellten statischen
  Ressourcen und `index.html` enthält.

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

Starten Sie das Gateway neu und öffnen Sie das Dashboard erneut:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Nächste Schritte

<Columns>
  <Card title="Einen Kanal verbinden" href="/de/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere.
  </Card>
  <Card title="Kopplung und Sicherheit" href="/de/channels/pairing" icon="shield">
    Legen Sie fest, wer Ihrem Agenten Nachrichten senden kann.
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

- `OPENCLAW_HOME` — Basisverzeichnis für die interne Pfadauflösung
- `OPENCLAW_STATE_DIR` — überschreibt das Zustandsverzeichnis
- `OPENCLAW_CONFIG_PATH` — überschreibt den Pfad der Konfigurationsdatei

Vollständige Referenz: [Umgebungsvariablen](/de/help/environment).
</Accordion>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Kanalübersicht](/de/channels)
- [Einrichtung](/de/start/setup)
