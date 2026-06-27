---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten von openclaw onboard
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Einrichtungsablauf, die Auth-/Modelleinrichtung, Ausgaben und Interna
title: Referenz zur CLI-Einrichtung
x-i18n:
    generated_at: "2026-06-27T18:14:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurzanleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Auth-Einrichtung (OAuth für OpenAI Code-Abonnement, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind-Adresse, Auth, Tailscale)
- Channels und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage und andere gebündelte Channel-Plugins)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native Windows Scheduled Task mit Startup-Ordner-Fallback)
- Integritätsprüfung
- Skills-Einrichtung

Der Remote-Modus konfiguriert diesen Rechner so, dass er eine Verbindung zu einem Gateway an anderer Stelle herstellt.
Er installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, es sei denn, Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Zurücksetzen verwendet `trash` und bietet Geltungsbereiche an:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)

  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt anfängliche Workspace-Dateien, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent-Workspace](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bind-Adresse, Auth-Modus und Tailscale-Freigabe ab.
    - Empfohlen: Lassen Sie Token-Auth auch für Loopback aktiviert, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Env-Variable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Bindings erfordern weiterhin Auth.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration
    - [iMessage](/de/channels/imessage): `imsg`-CLI-Pfad + Zugriff auf die Messages-DB; verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf dem Mac läuft
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; verwenden Sie für Headless-Betrieb einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Abmelden weiterläuft.
      - Kann nach sudo fragen (schreibt `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Scheduled Task
      - Wenn die Task-Erstellung verweigert wird, fällt OpenClaw auf ein benutzerspezifisches Anmeldeobjekt im Startup-Ordner zurück und startet das Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie einen besseren Supervisor-Status bereitstellen.
    - Runtime-Auswahl: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Gateway-Integritätsprobe, einschließlich Channel-Probes, sofern unterstützt.

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

Der Remote-Modus konfiguriert diesen Rechner so, dass er eine Verbindung zu einem Gateway an anderer Stelle herstellt.

<Info>
Der Remote-Modus installiert oder ändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- Remote-Gateway-URL (`ws://...`)
- Token, wenn Remote-Gateway-Auth erforderlich ist (empfohlen)

<Note>
- Wenn das Gateway nur an Loopback gebunden ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
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

    Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (Geräte-Pairing)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist, `openai/*` verwendet wird oder Legacy-Codex-Modellreferenzen vorhanden sind.

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
    wenn Sie einen xAI-Console-API-Schlüssel statt Abonnement-OAuth wünschen.
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
    Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M3`; die API-Schlüssel-Einrichtung verwendet
    `minimax/...`, und die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Mehr Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    Mehr Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Mehr Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen nach der Basis-URL (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standards vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    Mehr Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere Provider-API-Schlüssel-Abläufe:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Secret-Referenz verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; Standard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die abgeleitete Modelleingabefähigkeit)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Das Onboarding für benutzerdefinierte Provider leitet Bildunterstützung für gängige Modell-IDs ab und fragt nur nach, wenn der Modellname unbekannt ist.
- Wenn das Onboarding mit einer Provider-Auth-Auswahl beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Für Volcengine und BytePlus stimmt dieselbe Präferenz
  auch mit ihren Coding-Plan-Varianten überein (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser bevorzugte Provider-Filter leer wäre, fällt die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-OAuth-Import: `~/.openclaw/credentials/oauth.json`

Modus für die Speicherung von Zugangsdaten:

- Das standardmäßige Onboarding-Verhalten speichert API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt der Speicherung von Klartextschlüsseln.
  In der interaktiven Einrichtung können Sie wählen zwischen:
  - Umgebungsvariablen-Referenz (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierter Provider-Referenz (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablenname + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn der Preflight fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Legen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings fest.
  - Inline-Schlüsselflags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall mit benutzerdefiniertem Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
- Gateway-Authentifizierungsdaten unterstützen in der interaktiven Einrichtung Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Serverbetrieb: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie dann
die `auth-profiles.json` dieses Agents (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
`$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine Legacy-Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich während der Prompts dafür entscheiden (Namen werden nach Möglichkeit in IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` abgelegt.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Kanäle werden als Plugins bereitgestellt. Wenn sie während der Einrichtung ausgewählt werden, fordert der Assistent
Sie auf, das Plugin (npm oder lokaler Pfad) vor der Kanalkonfiguration zu installieren.
</Note>

Gateway-Assistent-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte darstellen, ohne die Onboarding-Logik neu zu implementieren.

Signal-Einrichtungsverhalten:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-signal-cli-Ablauf innerhalb von WSL

## Zugehörige Dokumentation

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
