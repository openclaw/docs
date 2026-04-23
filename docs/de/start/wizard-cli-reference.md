---
read_when:
    - Sie benötigen detailliertes Verhalten für `openclaw onboard`.
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients.
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Setup-Ablauf, Auth-/Modell-Setup, Ausgaben und Interna
title: CLI-Setup-Referenz
x-i18n:
    generated_at: "2026-04-23T06:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI-Setup-Referenz

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurzanleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Auth-Setup (OAuth für OpenAI Code subscription, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Auth, Tailscale)
- Channels und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Channel-Plugins)
- Daemon-Installation (LaunchAgent, systemd-User-Unit oder native Windows Scheduled Task mit Fallback über den Startup-Ordner)
- Integritätsprüfung
- Skills-Setup

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details des lokalen Ablaufs

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Das erneute Ausführen des Assistenten löscht nichts, außer Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder alte Schlüssel enthält, stoppt der Assistent und fordert Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Zum Zurücksetzen wird `trash` verwendet und es werden Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-und-modelloptionen).
  </Step>
  <Step title="Workspace">
    - Standard ist `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt Workspace-Dateien, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind, Auth-Modus und Tailscale-Exposition.
    - Empfohlen: Lassen Sie Token-Authentifizierung auch für Loopback aktiviert, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token erzeugen/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwort-Modus unterstützt das interaktive Setup ebenfalls Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Onboarding-Prozessumgebung.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Binds erfordern weiterhin Authentifizierung.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): JSON des Service-Accounts + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Base-URL
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Account-Konfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): alter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn mit
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-User-Unit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Logout aktiv bleibt.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Scheduled Task
      - Wenn die Erstellung der Aufgabe verweigert wird, fällt OpenClaw auf einen benutzerspezifischen Login-Eintrag im Startup-Ordner zurück und startet das Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie einen besseren Supervisor-Status bereitstellen.
    - Auswahl der Laufzeit: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt der Statusausgabe die Live-Integritätsprüfung des Gateways hinzu, einschließlich Channel-Prüfungen, wenn unterstützt.
  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt Sie den Node-Manager wählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS-, Android- und macOS-App.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Port-Forward-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details des Remote-Modus

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- URL des Remote-Gateways (`ws://...`)
- Token, falls für die Authentifizierung des Remote-Gateways erforderlich (empfohlen)

<Note>
- Wenn das Gateway nur über Loopback erreichbar ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Auth- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Browser-Ablauf; fügen Sie `code#state` ein.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*`.

  </Accordion>
  <Accordion title="OpenAI Code subscription (Geräte-Pairing)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*`.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert die Anmeldeinformation dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI-(Grok)-API-Schlüssel">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt Sie zwischen dem Zen- oder Go-Katalog wählen.
    Setup-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M2.7`; Setup mit API-Schlüssel verwendet
    `minimax/...`, und OAuth-Setup verwendet `minimax-portal/...`.
    Mehr Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    Mehr Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Mehr Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen nach der Base-URL (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standardwerte vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    Mehr Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere Abläufe mit API-Schlüssel für Provider:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Secret Reference verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Validierung vorab)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; greift auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie ein Standardmodell aus erkannten Optionen aus, oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Auth-Auswahl für einen Provider startet, bevorzugt der Modell-Picker
  diesen Provider automatisch. Bei Volcengine und BytePlus stimmt dieselbe Präferenz
  außerdem mit ihren Varianten für Coding-Pläne überein (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter für den bevorzugten Provider leer wäre, fällt der Picker auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung durch und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Alter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Standardmäßig speichert das Onboarding API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt der Speicherung von Schlüsseln als Klartext.
  Im interaktiven Setup können Sie Folgendes wählen:
  - Umgebungsvariablen-Ref (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Ref (`file` oder `exec`) mit Provider-Alias + ID
- Im interaktiven Referenzmodus wird vor dem Speichern eine schnelle Vorabvalidierung ausgeführt.
  - Env-Refs: validiert Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Vorabvalidierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Setzen Sie die Provider-Umgebungsvariable in der Onboarding-Prozessumgebung.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Bei benutzerdefinierten Providern speichert der nicht interaktive Modus `ref` `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall für benutzerdefinierte Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Zugangsdaten für Gateway-Authentifizierung unterstützen im interaktiven Setup Auswahl zwischen Klartext und SecretRef:
  - Token-Modus: **Klartext-Token erzeugen/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwort-Modus: Klartext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Setups funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Systeme: Führen Sie OAuth auf einem Rechner mit Browser aus und kopieren Sie dann
`auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
Pfad `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine alte Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wurde)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie während der Prompts zustimmen (Namen werden nach Möglichkeit zu IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - In der manuellen Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` gesetzt werden.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Zugangsdaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Channels werden als Plugins bereitgestellt. Wenn sie während des Setups ausgewählt werden, fordert der Assistent
zur Installation des Plugins auf (npm oder lokaler Pfad), bevor die Channel-Konfiguration erfolgt.
</Note>

Gateway-Wizard-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut zu implementieren.

Verhalten beim Signal-Setup:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt innerhalb von WSL dem Linux-Ablauf für signal-cli

## Verwandte Dokumente

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
