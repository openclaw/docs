---
read_when:
    - Sie benötigen detailliertes Verhalten für `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Setup-Ablauf, die Einrichtung von Auth/Modellen, Ausgaben und Interna
title: CLI-Setup-Referenz
x-i18n:
    generated_at: "2026-04-25T18:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Für die Kurzanleitung siehe [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent tut

Der lokale Modus (Standard) führt Sie durch:

- Einrichtung von Modell und Auth (OAuth für OpenAI Code-Abonnement, Anthropic Claude CLI oder API-Schlüssel sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Auth, Tailscale)
- Channels und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Channel-Plugins)
- Daemon-Installation (LaunchAgent, systemd-User-Unit oder native Windows-Aufgabe in der Aufgabenplanung mit Fallback auf den Startup-Ordner)
- Health Check
- Skills-Einrichtung

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details des lokalen Ablaufs

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Falls `~/.openclaw/openclaw.json` existiert, wählen Sie Beibehalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, sofern Sie nicht ausdrücklich Zurücksetzen wählen (oder `--reset` übergeben).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Beim Zurücksetzen wird `trash` verwendet und es werden folgende Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Standard ist `~/.openclaw/workspace` (konfigurierbar).
    - Legt Workspace-Dateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt Port, Bind, Auth-Modus und Tailscale-Exposition ab.
    - Empfohlen: Lassen Sie Token-Auth auch bei loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Plaintext-Token erzeugen/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls die Speicherung als Plaintext oder SecretRef.
    - Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Auch bei Nicht-Loopback-Binds bleibt Auth erforderlich.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): JSON für Service-Account + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): veralteter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; Freigabe über
      `openclaw pairing approve <channel> <code>` oder über Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-User-Unit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Abmelden weiterläuft.
      - Möglicherweise wird sudo abgefragt (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - Natives Windows: zuerst Aufgabe in der Aufgabenplanung
      - Wenn das Erstellen der Aufgabe verweigert wird, fällt OpenClaw auf ein benutzerspezifisches Startup-Ordner-Login-Element zurück und startet das Gateway sofort.
      - Aufgaben in der Aufgabenplanung bleiben bevorzugt, weil sie einen besseren Supervisor-Status bieten.
    - Laufzeitauswahl: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Health Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt die Live-Gateway-Health-Probe zur Statusausgabe hinzu, einschließlich Channel-Probes, sofern unterstützt.
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
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details des Remote-Modus

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- URL des Remote-Gateways (`ws://...`)
- Token, falls das Remote-Gateway Auth erfordert (empfohlen)

<Note>
- Wenn das Gateway nur auf loopback verfügbar ist, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Hinweise zur Erkennung:
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

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI Code-Abonnement (Device Pairing)">
    Browser-Pairing-Ablauf mit einem kurzlebigen Gerätecode.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok)-API-Schlüssel">
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
    Fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M2.7`; beim Setup mit API-Schlüssel wird
    `minimax/...` verwendet, beim OAuth-Setup `minimax-portal/...`.
    Mehr Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst zusätzlich `step-3.5-flash-2603`.
    Mehr Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Mehr Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    In den hostgestützten Modi wird nach der Basis-URL gefragt (Standard `http://127.0.0.1:11434`), verfügbare Modelle werden erkannt und Standardwerte vorgeschlagen.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    Mehr Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Das interaktive Onboarding unterstützt dieselben Auswahlmöglichkeiten für die Speicherung von API-Schlüsseln wie andere API-Key-Abläufe für Provider:
    - **API-Schlüssel jetzt einfügen** (Plaintext)
    - **Secret Reference verwenden** (env-Ref oder konfigurierte Provider-Ref mit Vorabvalidierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Provider-Auth-Auswahl beginnt, bevorzugt der Modellwähler
  automatisch diesen Provider. Bei Volcengine und BytePlus umfasst dieselbe Präferenz
  auch deren Varianten für Coding-Pläne (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Falls dieser Filter für den bevorzugten Provider leer wäre, fällt der Wähler auf
  den vollständigen Katalog zurück, statt gar keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Veralteter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Zugangsdaten:

- Das Standardverhalten beim Onboarding speichert API-Schlüssel als Plaintext-Werte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Speicherung des Klartextschlüssels.
  Im interaktiven Setup können Sie wählen zwischen:
  - env-Variablen-Ref (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierter Provider-Ref (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Vorabvalidierung durch.
  - Env-Refs: validiert Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Vorabvalidierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Setzen Sie die Provider-Umgebungsvariable in der Umgebung des Onboarding-Prozesses.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) setzen voraus, dass diese env-Variable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall für benutzerdefinierte Provider setzt `--custom-api-key` voraus, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Auth-Zugangsdaten unterstützen im interaktiven Setup Auswahl zwischen Plaintext und SecretRef:
  - Token-Modus: **Plaintext-Token erzeugen/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Plaintext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Plaintext-Setups funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Umgebungen: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie dann
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wurde)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn es nicht gesetzt ist; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn es nicht gesetzt ist; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich während der Prompts dafür entscheiden (Namen werden nach Möglichkeit in IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
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
Sie auf, das Plugin (npm oder lokaler Pfad) vor der Channel-Konfiguration zu installieren.
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
- Windows verwendet WSL2 und folgt dem Linux-`signal-cli`-Ablauf innerhalb von WSL

## Verwandte Dokumente

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
