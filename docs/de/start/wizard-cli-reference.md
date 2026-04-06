---
read_when:
    - Sie benötigen detailliertes Verhalten für `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Setup-Ablauf, Auth-/Modelleinrichtung, Ausgaben und Interna
title: CLI-Setup-Referenz
x-i18n:
    generated_at: "2026-04-06T03:12:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92f379b34a2b48c68335dae4f759117c770f018ec51b275f4f40421c6b3abb23
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI-Setup-Referenz

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die kurze Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Auth-Setup (OAuth für OpenAI Code subscription, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Auth, Tailscale)
- Kanäle und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Kanal-Plugins)
- Daemon-Installation (LaunchAgent, systemd-User-Unit oder native Windows Scheduled Task mit Fallback auf den Startup-Ordner)
- Health-Check
- Skills-Setup

Der Remote-Modus konfiguriert diese Maschine so, dass sie sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details des lokalen Ablaufs

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, es sei denn, Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Zum Zurücksetzen wird `trash` verwendet und folgende Bereiche werden angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Legt die für das Bootstrap-Ritual beim ersten Start benötigten Workspace-Dateien an.
    - Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind, Auth-Modus und Tailscale-Exposition.
    - Empfehlung: Lassen Sie Token-Auth auch für loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token erzeugen/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver SecretRef-Pfad für Tokens: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Binds erfordern weiterhin Auth.
  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): JSON für Dienstkonto + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): veralteter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd-User-Unit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Abmelden weiterläuft.
      - Möglicherweise wird sudo abgefragt (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Scheduled Task
      - Wenn das Erstellen der Aufgabe verweigert wird, fällt OpenClaw auf ein Anmeldeelement im benutzerspezifischen Startup-Ordner zurück und startet das Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie einen besseren Supervisor-Status bieten.
    - Auswahl der Laufzeit: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Health-Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt der Statusausgabe die Live-Gateway-Health-Probe hinzu, einschließlich Kanal-Probes, wenn unterstützt.
  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt Sie den Node-Manager wählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).
  </Step>
  <Step title="Fertigstellen">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS-, Android- und macOS-Apps.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent Anweisungen für SSH-Port-Forwarding zur Control UI aus, statt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu erstellen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diese Maschine so, dass sie sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- URL des Remote-Gateways (`ws://...`)
- Token, falls Auth des Remote-Gateways erforderlich ist (empfohlen)

<Note>
- Wenn das Gateway nur über loopback erreichbar ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Auth- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="OpenAI Code subscription (Wiederverwendung der Codex CLI)">
    Wenn `~/.codex/auth.json` existiert, kann der Assistent sie wiederverwenden.
    Wiederverwendete Zugangsdaten der Codex CLI bleiben durch die Codex CLI verwaltet; nach Ablauf liest OpenClaw
    diese Quelle zuerst erneut ein und schreibt die aktualisierten Zugangsdaten,
    wenn der Provider sie aktualisieren kann, zurück in den Codex-Speicher,
    statt die Verwaltung selbst zu übernehmen.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Browser-Ablauf; fügen Sie `code#state` ein.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*`.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok)-API-Schlüssel">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt Sie den Zen- oder Go-Katalog auswählen.
    Setup-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Konten-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Gehosteter Standard ist `MiniMax-M2.7`; das Setup mit API-Schlüssel verwendet
    `minimax/...`, und das OAuth-Setup verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten automatisch geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst außerdem `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud- und lokale offene Modelle)">
    Fragt nach der Basis-URL (Standard `http://127.0.0.1:11434`) und bietet dann Cloud + Local oder den Modus Local an.
    Ermittelt verfügbare Modelle und schlägt Standardwerte vor.
    Weitere Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere API-Schlüssel-Abläufe für Provider:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Geheimnisreferenz verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Belässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie ein Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Provider-Auth-Auswahl beginnt, bevorzugt der Modell-Picker
  diesen Provider automatisch. Für Volcengine und BytePlus entspricht diese Präferenz
  auch ihren Varianten für Coding Plans (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser bevorzugte Provider-Filter leer wäre, fällt der Picker auf den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Veralteter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Zugangsdaten:

- Das Standardverhalten des Onboardings speichert API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt Klartextspeicherung von Schlüsseln.
  Im interaktiven Setup können Sie entweder Folgendes wählen:
  - Referenz auf eine Umgebungsvariable (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Ref (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn der Preflight fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur Env-basiert.
  - Setzen Sie die Provider-Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall für benutzerdefinierte Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Auth-Zugangsdaten unterstützen im interaktiven Setup Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token erzeugen/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Tokens: `--gateway-token-ref-env <ENV_VAR>`.
- Vorhandene Klartext-Setups funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Betrieb: Führen Sie OAuth auf einer Maschine mit Browser aus und kopieren Sie dann
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (falls Minimax gewählt wurde)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich bei den Eingabeaufforderungen dafür entscheiden (Namen werden nach Möglichkeit in IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Zugangsdaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` abgelegt.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Kanäle werden als Plugins ausgeliefert. Wenn sie während des Setups ausgewählt werden, fordert der Assistent
zur Installation des Plugins auf (npm oder lokaler Pfad), bevor die Kanalkonfiguration erfolgt.
</Note>

Gateway-Assistent-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik neu implementieren zu müssen.

Verhalten beim Signal-Setup:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-Ablauf für signal-cli innerhalb von WSL

## Verwandte Docs

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI Automation](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/cli/onboard)
