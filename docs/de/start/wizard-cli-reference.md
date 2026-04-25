---
read_when:
    - Sie benötigen detailliertes Verhalten für `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für CLI-Setup-Ablauf, Auth-/Modell-Setup, Ausgaben und Interna
title: Referenz für CLI-Setup
x-i18n:
    generated_at: "2026-04-25T13:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Für die Kurzanleitung siehe [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (OpenAI Code Subscription OAuth, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Speicherort des Workspace und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Authentifizierung, Tailscale)
- Channels und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Channel-Plugins)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native Windows-Aufgabe im Aufgabenplaner mit Fallback auf den Autostart-Ordner)
- Systemprüfung
- Skills-Einrichtung

Der Remote-Modus konfiguriert diese Maschine für die Verbindung mit einem Gateway an einem anderen Ort.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung bestehender Konfiguration">
    - Falls `~/.openclaw/openclaw.json` existiert, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, außer Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um zusätzlich den Workspace zu entfernen.
    - Falls die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Zum Zurücksetzen wird `trash` verwendet und folgende Bereiche werden angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Authentifizierungs- und Modelloptionen](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Standardwert `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind, Authentifizierungsmodus und Tailscale-Freigabe.
    - Empfohlen: Lassen Sie die Token-Authentifizierung selbst für Loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Plaintext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (optional)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls die Speicherung als Plaintext oder SecretRef.
    - Nicht-interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Umgebungsumgebung des Onboarding-Prozesses.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Bindings, die nicht nur Loopback sind, erfordern weiterhin Authentifizierung.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): JSON des Servicekontos + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): veralteter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; bestätigen Sie ihn mit
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Zulassungslisten.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach der Abmeldung weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Aufgabe im Aufgabenplaner
      - Falls das Erstellen der Aufgabe verweigert wird, fällt OpenClaw auf einen benutzerspezifischen Anmeldeeintrag im Autostart-Ordner zurück und startet das Gateway sofort.
      - Aufgaben im Aufgabenplaner bleiben bevorzugt, weil sie einen besseren Supervisor-Status bereitstellen.
    - Laufzeitauswahl: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Systemprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Systemprüfung des Gateways, einschließlich Channel-Prüfungen, sofern unterstützt.
  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft die Anforderungen.
    - Lässt Sie den Node-Manager auswählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich App-Optionen für iOS, Android und macOS.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Portweiterleitungsanweisungen für die Control UI aus, anstatt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diese Maschine für die Verbindung mit einem Gateway an einem anderen Ort.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- URL des Remote-Gateways (`ws://...`)
- Token, falls die Authentifizierung des Remote-Gateways erforderlich ist (empfohlen)

<Note>
- Falls das Gateway nur für Loopback erreichbar ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Hinweise zur Erkennung:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Authentifizierungs- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann für die Nutzung durch den Daemon.
  </Accordion>
  <Accordion title="OpenAI Code Subscription (OAuth)">
    Browser-Ablauf; fügen Sie `code#state` ein.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell festgelegt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code Subscription (Gerätepaarung)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell festgelegt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell festgelegt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI-(Grok)-API-Schlüssel">
    Fordert `XAI_API_KEY` an und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fordert `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) an und lässt Sie zwischen dem Zen- oder Go-Katalog wählen.
    Einrichtungs-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fordert `AI_GATEWAY_API_KEY` an.
    Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fordert Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` an.
    Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M2.7`; bei der API-Schlüssel-Einrichtung wird
    `minimax/...` verwendet, bei OAuth-Einrichtung `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fordert `SYNTHETIC_API_KEY` an.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    In den hostgestützten Modi wird nach der Basis-URL gefragt (Standard `http://127.0.0.1:11434`), verfügbare Modelle werden erkannt und Standardvorschläge gemacht.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    Weitere Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Das interaktive Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere API-Schlüssel-Abläufe für Provider:
    - **API-Schlüssel jetzt einfügen** (Plaintext)
    - **Geheimnisreferenz verwenden** (Umgebungsreferenz oder konfigurierte Provider-Referenz, mit Vorabvalidierung)

    Nicht-interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; greift auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt die Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie ein Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Provider-Authentifizierungsoption beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Für Volcengine und BytePlus gilt dieselbe Präferenz
  auch für deren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Falls dieser bevorzugte Provider-Filter leer wäre, fällt die Auswahl
  auf den vollständigen Katalog zurück, anstatt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder die Authentifizierung fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Veralteter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Zugangsdaten:

- Das Standardverhalten beim Onboarding speichert API-Schlüssel als Plaintext-Werte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Speicherung von Schlüsseln im Plaintext.
  In der interaktiven Einrichtung können Sie wählen:
  - Umgebungsvariablen-Referenz (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Vorabvalidierung aus.
  - Umgebungsreferenzen: validiert den Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Referenzen: validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Falls die Vorabvalidierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht-interaktiven Modus ist `--secret-input-mode ref` nur umgebungsbasiert.
  - Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht-interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall für benutzerdefinierte Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Authentifizierungsdaten unterstützen in der interaktiven Einrichtung Plaintext- und SecretRef-Optionen:
  - Token-Modus: **Plaintext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Plaintext oder SecretRef.
- Nicht-interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Plaintext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Umgebungen: Schließen Sie OAuth auf einer Maschine mit Browser ab und kopieren Sie dann
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wird)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Authentifizierung, Tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Zulassungslisten (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich während der Eingabeaufforderungen dafür entscheiden (Namen werden, wenn möglich, in IDs aufgelöst)
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
Einige Channels werden als Plugins bereitgestellt. Wenn sie während der Einrichtung ausgewählt werden, fordert der Assistent
Sie auf, das Plugin (npm oder lokaler Pfad) vor der Channel-Konfiguration zu installieren.
</Note>

Gateway-Assistent-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik neu implementieren zu müssen.

Verhalten bei der Signal-Einrichtung:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-`signal-cli`-Ablauf innerhalb von WSL

## Zugehörige Dokumente

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
