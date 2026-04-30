---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten von openclaw onboard
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Einrichtungsablauf, die Auth-/Modell-Einrichtung, Ausgaben und Interna
title: CLI-Einrichtungsreferenz
x-i18n:
    generated_at: "2026-04-30T07:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurz Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Auth-Einrichtung (OpenAI Code-Abonnement-OAuth, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind-Adresse, Auth, Tailscale)
- Kanäle und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere mitgelieferte Kanal-Plugins)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native Windows-Aufgabenplanung mit Startup-Ordner-Fallback)
- Zustandsprüfung
- Skills-Einrichtung

Der Remote-Modus konfiguriert diesen Computer so, dass er eine Verbindung zu einem Gateway an einem anderen Ort herstellt.
Er installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie Behalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, sofern Sie nicht ausdrücklich Zurücksetzen wählen (oder `--reset` übergeben).
    - CLI `--reset` ist standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Das Zurücksetzen verwendet `trash` und bietet folgende Bereiche:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)

  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt Workspace-Dateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent-Workspace](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bind-Adresse, Auth-Modus und Tailscale-Freigabe ab.
    - Empfohlen: Lassen Sie Token-Auth auch für loopback aktiviert, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Bind-Adressen erfordern weiterhin Auth.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Zielgruppe
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): für iMessage empfohlen; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): Legacy-`imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless verwenden Sie einen eigenen LaunchDaemon (nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach der Abmeldung weiterläuft.
      - Fragt möglicherweise nach sudo (schreibt `/var/lib/systemd/linger`); er versucht es zuerst ohne sudo.
    - Natives Windows: zuerst geplante Aufgabe
      - Wenn die Aufgabenerstellung verweigert wird, fällt OpenClaw auf ein benutzerspezifisches Anmeldeelement im Startup-Ordner zurück und startet das Gateway sofort.
      - Geplante Aufgaben bleiben bevorzugt, weil sie einen besseren Supervisor-Status bieten.
    - Laufzeitauswahl: Node (empfohlen; für WhatsApp und Telegram erforderlich). Bun wird nicht empfohlen.

  </Step>
  <Step title="Zustandsprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt der Statusausgabe die Live-Gateway-Zustandsprüfung hinzu, einschließlich Kanalprüfungen, sofern unterstützt.

  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt Sie den Node-Manager auswählen: npm, pnpm oder bun.
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

Der Remote-Modus konfiguriert diesen Computer so, dass er eine Verbindung zu einem Gateway an einem anderen Ort herstellt.

<Info>
Der Remote-Modus installiert oder ändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- Remote-Gateway-URL (`ws://...`)
- Token, wenn Remote-Gateway-Auth erforderlich ist (empfohlen)

<Note>
- Wenn das Gateway nur loopback verwendet, nutzen Sie SSH-Tunneling oder ein Tailnet.
- Erkennungshinweise:
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

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (Geräte-Pairing)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI-(Grok-)API-Schlüssel">
    Fragt `XAI_API_KEY` ab und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) ab und lässt Sie den Zen- oder Go-Katalog auswählen.
    Einrichtungs-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt `AI_GATEWAY_API_KEY` ab.
    Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` ab.
    Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M2.7`; die API-Schlüssel-Einrichtung verwendet
    `minimax/...`, und die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt `SYNTHETIC_API_KEY` ab.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen die Basis-URL ab (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standards vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    Weitere Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Moonshot-(Kimi-K2-) und Kimi-Coding-Konfigurationen werden automatisch geschrieben.
    Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere Provider-API-Schlüssel-Abläufe:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Geheime Referenz verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die abgeleitete Modelleingabefähigkeit)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Standardmodell aus erkannten Optionen auswählen oder Provider und Modell manuell eingeben.
- Das Onboarding für benutzerdefinierte Provider leitet Bildunterstützung für gängige Modell-IDs ab und fragt nur, wenn der Modellname unbekannt ist.
- Wenn das Onboarding mit einer Provider-Auth-Auswahl startet, bevorzugt die Modellauswahl
  diesen Provider automatisch. Für Volcengine und BytePlus stimmt dieselbe Präferenz
  auch mit deren Coding-Plan-Varianten überein (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser bevorzugte Provider-Filter leer wäre, fällt die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Zugangsdaten:

- Das Standardverhalten des Onboardings speichert API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Klartext-Schlüsselspeicherung.
  In der interaktiven Einrichtung können Sie eines von beiden wählen:
  - Umgebungsvariablen-Ref (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Ref (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablenname + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn Preflight fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive Modus `ref` `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall eines benutzerdefinierten Providers erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
- Gateway-Auth-Zugangsdaten unterstützen in der interaktiven Einrichtung Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Vorhandene Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Betrieb: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie anschließend
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
`$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie während der Eingabeaufforderungen zustimmen (Namen werden nach Möglichkeit in IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Eine manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
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

Clients (macOS-App und Control UI) können Schritte darstellen, ohne die Onboarding-Logik erneut zu implementieren.

Signal-Einrichtungsverhalten:

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
