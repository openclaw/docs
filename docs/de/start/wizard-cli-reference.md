---
read_when:
    - Sie benötigen detailliertes Verhalten für openclaw onboard
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für CLI-Einrichtungsablauf, Authentifizierungs-/Modelleinrichtung, Ausgaben und Interna
title: CLI-Einrichtungsreferenz
x-i18n:
    generated_at: "2026-06-30T22:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurzanleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent tut

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (OAuth für OpenAI Code-Abonnement, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind-Adresse, Authentifizierung, Tailscale)
- Kanäle und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage und andere gebündelte Kanal-Plugins)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native Windows Scheduled Task mit Fallback über den Startup-Ordner)
- Integritätsprüfung
- Skills-Einrichtung

Der Remote-Modus konfiguriert diesen Computer so, dass er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Das erneute Ausführen des Assistenten löscht nichts, außer Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI `--reset` ist standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Zurücksetzen verwendet `trash` und bietet Bereiche an:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)

  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die Workspace-Dateien, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent-Workspace](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind-Adresse, Authentifizierungsmodus und Tailscale-Freigabe.
    - Empfehlung: Lassen Sie Token-Authentifizierung auch für loopback aktiviert, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Binds erfordern weiterhin Authentifizierung.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration
    - [iMessage](/de/channels/imessage): `imsg`-CLI-Pfad + Zugriff auf die Messages-Datenbank; verwenden Sie einen SSH-Wrapper, wenn der Gateway nicht auf dem Mac läuft
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht ausgeliefert).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit der Gateway nach dem Abmelden weiterläuft.
      - Kann nach sudo fragen (schreibt `/var/lib/systemd/linger`); er versucht es zuerst ohne sudo.
    - Natives Windows: zuerst Scheduled Task
      - Wenn die Erstellung der Aufgabe verweigert wird, fällt OpenClaw auf einen benutzerspezifischen Login-Eintrag im Startup-Ordner zurück und startet den Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie einen besseren Supervisor-Status bereitstellen.
    - Laufzeitauswahl: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet den Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Integritätsprüfung des Gateways, einschließlich Kanalprüfungen, wenn unterstützt.

  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt Sie den Node-Manager wählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS-, Android- und macOS-Apps.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Port-Forwarding-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn Control-UI-Assets fehlen, versucht der Assistent, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diesen Computer so, dass er sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder ändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- Remote-Gateway-URL (`ws://...`)
- Token, wenn Remote-Gateway-Authentifizierung erforderlich ist (empfohlen)

<Note>
- Wenn der Gateway nur an loopback gebunden ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Auth- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Daemon-Nutzung.
  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (OAuth)">
    Browser-Ablauf; fügen Sie `code#state` ein.

    Setzt `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (Gerätepaarung)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Anmeldedaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist, `openai/*` ist oder Legacy-Codex-Modellreferenzen verwendet.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browser-Anmeldung für berechtigte SuperGrok- oder X-Premium-Konten. Dies ist der
    empfohlene xAI-Pfad für die meisten Benutzer. OpenClaw speichert das resultierende Auth-
    Profil für Grok-Modelle, Grok `web_search`, `x_search` und `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) Gerätecode">
    Remote-freundliche Browser-Anmeldung mit einem kurzen Code statt eines localhost-
    Callbacks. Verwenden Sie dies von SSH-, Docker- oder VPS-Hosts aus.
  </Accordion>
  <Accordion title="xAI (Grok) API-Schlüssel">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider. Verwenden Sie dies,
    wenn Sie einen API-Schlüssel der xAI Console statt Abonnement-OAuth verwenden möchten.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt Sie den Zen- oder Go-Katalog wählen.
    Einrichtungs-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Gehosteter Standard ist `MiniMax-M3`; die Einrichtung per API-Schlüssel verwendet
    `minimax/...`, und die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen nach der Basis-URL (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standardwerte vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
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
    - **Secret-Referenz verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; Standard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die abgeleitete Eingabefähigkeit des Modells)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Das Onboarding für benutzerdefinierte Provider leitet Bildunterstützung für gängige Modell-IDs ab und fragt nur nach, wenn der Modellname unbekannt ist.
- Wenn das Onboarding mit einer Auth-Auswahl für einen Provider beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Für Volcengine und BytePlus passt dieselbe Präferenz
  auch zu ihren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter für bevorzugte Provider leer wäre, fällt die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Das standardmäßige Onboarding-Verhalten speichert API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt der Speicherung von Schlüsseln im Klartext.
  Im interaktiven Setup können Sie eine der folgenden Optionen wählen:
  - Umgebungsvariablen-Referenz, zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Referenzen: validiert den Variablennamen + einen nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Referenzen: validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn der Preflight fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus wird `--secret-input-mode ref` nur über Umgebungsvariablen unterstützt.
  - Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings.
  - Inline-Schlüsselflags, zum Beispiel `--openai-api-key`, erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall eines benutzerdefinierten Providers erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Auth-Anmeldedaten unterstützen im interaktiven Setup Klartext- und SecretRef-Optionen:
  - Tokenmodus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Setups funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Umgebungen: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie dann
die `auth-profiles.json` dieses Agents (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
`$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine Legacy-Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (falls Minimax gewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind-Adresse, Auth, Tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nicht gesetzt; bestehende explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Zulassungslisten (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich während der Prompts dafür entscheiden (Namen werden nach Möglichkeit zu IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` abgelegt.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Kanäle werden als Plugins bereitgestellt. Wenn sie während des Setups ausgewählt werden, fordert der Assistent
Sie auf, das Plugin (npm oder lokaler Pfad) vor der Kanalkonfiguration zu installieren.
</Note>

Gateway-Assistent-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut zu implementieren.

Signal-Setup-Verhalten:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt innerhalb von WSL dem Linux-signal-cli-Ablauf

## Zugehörige Dokumentation

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
