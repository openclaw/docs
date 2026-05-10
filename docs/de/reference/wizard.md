---
read_when:
    - Nachschlagen eines bestimmten Onboarding-Schritts oder Flags
    - Automatisieren der Einrichtung im nicht interaktiven Modus
    - Fehlerbehebung beim Onboarding-Verhalten
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für das CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Referenz zur Ersteinrichtung
x-i18n:
    generated_at: "2026-05-10T19:52:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine übergeordnete Übersicht finden Sie unter [Einrichtung (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie **Aktuelle Werte beibehalten**, **Prüfen und aktualisieren** oder **Vor der Einrichtung zurücksetzen**.
    - Das erneute Ausführen der Einrichtung löscht **nichts**, außer Sie wählen ausdrücklich **Zurücksetzen**
      (oder übergeben `--reset`).
    - CLI `--reset` ist standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um auch den Arbeitsbereich zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert
      Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Das Zurücksetzen verwendet `trash` (nie `rm`) und bietet folgende Bereiche:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Arbeitsbereich)

  </Step>
  <Step title="Modell/Auth">
    - **Anthropic-API-Schlüssel**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic-API-Schlüssel**: bevorzugte Anthropic-Assistentenauswahl in Einrichtung/Konfiguration.
    - **Anthropic setup-token**: weiterhin in Einrichtung/Konfiguration verfügbar, obwohl OpenClaw jetzt die Wiederverwendung der Claude CLI bevorzugt, wenn sie verfügbar ist.
    - **OpenAI Code (Codex)-Abonnement (OAuth)**: Browser-Ablauf; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI Code (Codex)-Abonnement (Gerätekopplung)**: Browser-Kopplungsablauf mit einem kurzlebigen Gerätecode.
      - Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI-API-Schlüssel**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist, `openai/*` oder `openai-codex/*` ist.
    - **xAI (Grok)-API-Schlüssel**: fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: bietet zuerst **Cloud + Lokal**, **Nur Cloud** oder **Nur lokal** an. `Cloud only` fragt nach `OLLAMA_API_KEY` und verwendet `https://ollama.com`; die hostgestützten Modi fragen nach der Ollama-Basis-URL, erkennen verfügbare Modelle und laden das ausgewählte lokale Modell bei Bedarf automatisch herunter; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    - Weitere Details: [Ollama](/de/providers/ollama)
    - **API-Schlüssel**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Multi-Modell-Proxy)**: fragt nach `AI_GATEWAY_API_KEY`.
    - Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Die Konfiguration wird automatisch geschrieben; der gehostete Standard ist `MiniMax-M2.7`.
      Die Einrichtung per API-Schlüssel verwendet `minimax/...`, und die OAuth-Einrichtung verwendet
      `minimax-portal/...`.
    - Weitere Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    - Weitere Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fragt nach `SYNTHETIC_API_KEY`.
    - Weitere Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Die Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Die Konfiguration wird automatisch geschrieben.
    - Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: Noch keine Auth konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Für beste Qualität und ein geringeres Prompt-Injection-Risiko wählen Sie das stärkste verfügbare Modell der neuesten Generation in Ihrem Provider-Stack.
    - Die Einrichtung führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der Speichermodus für API-Schlüssel verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie stattdessen `--secret-input-mode ref`, um env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` ist nur eine Legacy-Importquelle.
    - Weitere Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless/Server: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie dann
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
    `$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Arbeitsbereich">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die für das Agent-Bootstrap-Ritual benötigten Arbeitsbereichsdateien.
    - Vollständiges Arbeitsbereichslayout + Backup-Leitfaden: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, Bind-Adresse, Auth-Modus, Tailscale-Freigabe.
    - Auth-Empfehlung: Behalten Sie **Token** auch für loopback bei, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung Folgendes:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
      - Quickstart verwendet vorhandene `gateway.auth.token`-SecretRefs über `env`-, `file`- und `exec`-Provider hinweg für Einrichtungsprobe/Dashboard-Bootstrap erneut.
      - Wenn diese SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt die Einrichtung frühzeitig mit einer klaren Behebungsmeldung fehl, statt die Runtime-Auth stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung der Einrichtung.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Bind-Adressen erfordern weiterhin Auth.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [iMessage](/de/channels/imessage): `imsg`-CLI-Pfad + Zugriff auf die Nachrichten-DB; verwenden Sie einen SSH-Wrapper, wenn das Gateway außerhalb des Mac läuft.
    - DM-Sicherheit: Standard ist die Kopplung. Die erste DM sendet einen Code; genehmigen Sie über `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.

  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie den Schritt).
    - API-gestützte Provider können Umgebungsvariablen oder vorhandene Konfiguration für die schnelle Einrichtung verwenden; schlüsselfreie Provider verwenden stattdessen ihre providerspezifischen Voraussetzungen.
    - Überspringen mit `--skip-search`.
    - Später konfigurieren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-Benutzereinheit
      - Die Einrichtung versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Abmelden weiterläuft.
      - Kann nach sudo fragen (schreibt `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - **Runtime-Auswahl:** Node (empfohlen; für WhatsApp/Telegram erforderlich). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert aber keine aufgelösten Klartext-Tokenwerte in Supervisor-Dienstumgebungsmetadaten.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus ausdrücklich gesetzt ist.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Gateway-Integritätsprobe, einschließlich Kanalproben, sofern unterstützt (erfordert ein erreichbares Gateway).

  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich der Abfrage **Wie möchten Sie Ihren Agenten ausbrüten?** für Terminal, Browser oder später.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt die Einrichtung SSH-Port-Forwarding-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn die Control-UI-Assets fehlen, versucht die Einrichtung, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

Verwenden Sie `--non-interactive`, um die Einrichtung zu automatisieren oder zu skripten:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Fügen Sie `--json` für eine maschinenlesbare Zusammenfassung hinzu.

Gateway-Token-SecretRef im nicht interaktiven Modus:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.

<Note>
`--json` impliziert **nicht** den nicht interaktiven Modus. Verwenden Sie `--non-interactive` (und `--workspace`) für Skripte.
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für Flag-Semantik und Schrittreihenfolge.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Assistent-RPC

Das Gateway stellt den Einrichtungsablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Einrichtungslogik neu zu implementieren.

## Signal-Einrichtung (signal-cli)

Die Einrichtung kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die signal-cli-Installation folgt dem Linux-Ablauf innerhalb von WSL.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (die lokale Einrichtung verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind-Adresse, Authentifizierung, Tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Zulassungslisten (Slack/Discord/Matrix/Microsoft Teams), wenn Sie sie während der Eingabeaufforderungen aktivieren (Namen werden nach Möglichkeit in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` abgelegt.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Kanäle werden als Plugins bereitgestellt. Wenn Sie während der Einrichtung einen auswählen, fordert die Einrichtung Sie auf, ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumentation

- Überblick zur Einrichtung: [Einrichtung (CLI)](/de/start/wizard)
- Einrichtung der macOS-App: [Einrichtung](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [iMessage](/de/channels/imessage)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
