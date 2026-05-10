---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten von `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Einrichtungsablauf, die Authentifizierungs- und Modelleinrichtung, Ausgaben und Interna
title: Referenz zur CLI-Einrichtung
x-i18n:
    generated_at: "2026-05-10T19:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurz-Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Wizard macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (OpenAI Code-Abonnement-OAuth, Anthropic Claude CLI oder API-Schlüssel sowie MiniMax-, GLM-, Ollama-, Moonshot-, StepFun- und AI Gateway-Optionen)
- Speicherort des Arbeitsbereichs und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bindung, Authentifizierung, Tailscale)
- Kanäle und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage und weitere gebündelte Kanal-Plugins)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native Windows-Aufgabenplanung mit Fallback auf den Autostart-Ordner)
- Integritätsprüfung
- Skills-Einrichtung

Der Remote-Modus konfiguriert diese Maschine so, dass sie eine Verbindung zu einem Gateway an anderer Stelle herstellt.
Er installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Das erneute Ausführen des Wizards löscht nichts, es sei denn, Sie wählen ausdrücklich Zurücksetzen (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Arbeitsbereich zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, hält der Wizard an und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Zurücksetzen verwendet `trash` und bietet Bereiche an:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Arbeitsbereich)

  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Authentifizierungs- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Arbeitsbereich">
    - Standard: `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Arbeitsbereichsdateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Arbeitsbereichs-Layout: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bindung, Authentifizierungsmodus und Tailscale-Freigabe ab.
    - Empfohlen: Lassen Sie Token-Authentifizierung auch für Loopback aktiviert, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Bindungen erfordern weiterhin Authentifizierung.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration
    - [iMessage](/de/channels/imessage): `imsg`-CLI-Pfad + Zugriff auf die Messages-Datenbank; verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf einem Mac läuft
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Wizard versucht `loginctl enable-linger <user>`, damit das Gateway nach der Abmeldung weiterläuft.
      - Kann nach sudo fragen (schreibt `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Aufgabenplanung
      - Wenn das Erstellen der Aufgabe verweigert wird, fällt OpenClaw auf ein benutzerspezifisches Autostart-Ordner-Anmeldeelement zurück und startet das Gateway sofort.
      - Geplante Aufgaben bleiben bevorzugt, weil sie einen besseren Supervisor-Status bieten.
    - Laufzeitauswahl: Node (empfohlen; für WhatsApp und Telegram erforderlich). Bun wird nicht empfohlen.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Gateway-Integritätsprüfung, einschließlich Kanalprüfungen, sofern unterstützt.

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
Wenn keine GUI erkannt wird, gibt der Wizard SSH-Portweiterleitungsanweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn Control-UI-Assets fehlen, versucht der Wizard, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diese Maschine so, dass sie eine Verbindung zu einem Gateway an anderer Stelle herstellt.

<Info>
Der Remote-Modus installiert oder ändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- Remote-Gateway-URL (`ws://...`)
- Token, wenn das Remote-Gateway Authentifizierung erfordert (empfohlen)

<Note>
- Wenn das Gateway nur Loopback verwendet, nutzen Sie SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Authentifizierungs- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn anschließend für die Daemon-Nutzung.
  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (OAuth)">
    Browser-Ablauf; fügen Sie `code#state` ein.

    Setzt `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (Geräte-Pairing)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Anmeldedaten anschließend in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist, `openai/*` ist oder `openai-codex/*` ist.

  </Accordion>
  <Accordion title="xAI (Grok)-API-Schlüssel">
    Fragt `XAI_API_KEY` ab und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) ab und lässt Sie den Zen- oder Go-Katalog wählen.
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
    Die Konfiguration wird automatisch geschrieben. Gehosteter Standard ist `MiniMax-M2.7`; die API-Schlüssel-Einrichtung verwendet
    `minimax/...`, und die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten automatisch geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt `SYNTHETIC_API_KEY` ab.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst `Cloud + Local`, `Cloud only` oder `Local only` ab.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen die Basis-URL ab (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standards vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    Weitere Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Moonshot- (Kimi K2) und Kimi-Coding-Konfigurationen werden automatisch geschrieben.
    Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere Provider-API-Schlüsselabläufe:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Secret-Referenz verwenden** (Env-Referenz oder konfigurierte Provider-Referenz, mit Preflight-Validierung)

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
    Lässt die Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie ein Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Das Onboarding für benutzerdefinierte Provider leitet Bildunterstützung für gängige Modell-IDs ab und fragt nur nach, wenn der Modellname unbekannt ist.
- Wenn das Onboarding mit einer Provider-Authentifizierungsauswahl beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Für Volcengine und BytePlus stimmt dieselbe Präferenz
  auch mit deren Coding-Plan-Varianten überein (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser bevorzugte Provider-Filter leer wäre, fällt die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Wizard führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Das Standardverhalten beim Onboarding speichert API-Schlüssel als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt Klartext-Schlüsselspeicherung.
  In der interaktiven Einrichtung können Sie wählen zwischen:
  - Umgebungsvariablen-Ref (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierter Provider-Ref (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablenname + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Preflight-Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Setzen Sie die Provider-Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall mit benutzerdefiniertem Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding schnell fehl.
- Gateway-Authentifizierungsdaten unterstützen in der interaktiven Einrichtung Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Vorhandene Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Headless- und Server-Tipp: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie dann
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
`$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind-Adresse, Authentifizierung, Tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich während der Eingabeaufforderungen dafür entscheiden (Namen werden nach Möglichkeit in IDs aufgelöst)
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

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut zu implementieren.

Signal-Einrichtungsverhalten:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-signal-cli-Ablauf innerhalb von WSL

## Verwandte Dokumentation

- Onboarding-Zentrale: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
