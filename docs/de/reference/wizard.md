---
read_when:
    - Nachschlagen eines bestimmten Onboarding-Schritts oder Flags
    - Automatisieren des Onboardings mit dem nicht-interaktiven Modus
    - Debuggen des Onboarding-Verhaltens
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-06T03:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e02a4da4a39ba335199095723f5d3b423671eb12efc2d9e4f9e48c1e8ee18419
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding-Referenz

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie **Beibehalten / Ändern / Zurücksetzen**.
    - Erneutes Ausführen des Onboardings löscht nichts, es sei denn, Sie wählen ausdrücklich **Zurücksetzen**
      (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert
      Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Beim Zurücksetzen wird `trash` verwendet (niemals `rm`) und es werden folgende Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic API key**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic API key**: bevorzugte Anthropic-Assistant-Auswahl in Onboarding/Konfiguration.
    - **Anthropic setup-token (legacy/manual)**: ist in Onboarding/Konfiguration wieder verfügbar, aber Anthropic hat OpenClaw-Benutzern mitgeteilt, dass der OpenClaw-Claude-Login-Pfad als Nutzung eines Drittanbieter-Harness gilt und **Extra Usage** für das Claude-Konto erfordert.
    - **OpenAI Code (Codex) subscription (Codex CLI)**: wenn `~/.codex/auth.json` existiert, kann das Onboarding es wiederverwenden. Wiederverwendete Codex-CLI-Anmeldedaten bleiben von Codex CLI verwaltet; bei Ablauf liest OpenClaw diese Quelle zuerst erneut und schreibt bei Providern, die eine Aktualisierung unterstützen, die aktualisierten Anmeldedaten zurück in den Codex-Speicher, statt selbst die Kontrolle zu übernehmen.
    - **OpenAI Code (Codex) subscription (OAuth)**: Browser-Ablauf; fügen Sie den `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*` verwendet wird.
    - **OpenAI API key**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.
    - **xAI (Grok) API key**: fordert `XAI_API_KEY` an und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fordert `OPENCODE_API_KEY` an (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: fordert die Ollama-Basis-URL an, bietet den Modus **Cloud + Local** oder **Local** an, erkennt verfügbare Modelle und lädt das ausgewählte lokale Modell bei Bedarf automatisch herunter.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API key**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (multi-model proxy)**: fordert `AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fordert Account ID, Gateway ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Die Konfiguration wird automatisch geschrieben; der gehostete Standardwert ist `MiniMax-M2.7`.
      Die Einrichtung mit API-Schlüssel verwendet `minimax/...`, und die OAuth-Einrichtung verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpoints geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: fordert `SYNTHETIC_API_KEY` an.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Die Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Die Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: noch keine Authentifizierung konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Für die beste Qualität und ein geringeres Risiko durch Prompt-Injection wählen Sie das stärkste aktuelle Modell, das in Ihrem Provider-Stack verfügbar ist.
    - Das Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.
    - Der Speichermodus für API-Schlüssel verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` dient nur noch dem Legacy-Import.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless-/Server-Setups: Führen Sie OAuth auf einem Rechner mit Browser aus und kopieren
    Sie dann die `auth-profiles.json` dieses Agents (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
    Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Bootstrap-Ritual des Agents benötigt werden.
    - Vollständiges Workspace-Layout + Anleitung für Backups: [Agent workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Exposition.
    - Auth-Empfehlung: Behalten Sie **Token** auch für Loopback bei, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
      - Quickstart verwendet bestehende `gateway.auth.token`-SecretRefs über `env`-, `file`- und `exec`-Provider hinweg erneut für den Onboarding-Probe-/Dashboard-Bootstrap.
      - Wenn dieses SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Fehlerbehebung fehl, statt die Laufzeit-Authentifizierung stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls die Speicherung als Klartext oder SecretRef.
    - Nicht-interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Onboarding-Prozessumgebung.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Bindings erfordern weiterhin Authentifizierung.
  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): JSON für Servicekonto + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-`imsg`-CLI-Pfad + DB-Zugriff.
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn mit `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie diesen Schritt).
    - API-gestützte Provider können für die Schnelleinrichtung Umgebungsvariablen oder bestehende Konfiguration verwenden; Provider ohne Schlüssel nutzen stattdessen ihre providerspezifischen Voraussetzungen.
    - Überspringen mit `--skip-search`.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Setups verwenden Sie einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-User-Unit
      - Das Onboarding versucht, mit `loginctl enable-linger <user>` Linger zu aktivieren, damit das Gateway nach dem Abmelden weiterläuft.
      - Möglicherweise wird nach sudo gefragt (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne sudo versucht.
    - **Laufzeitauswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun ist **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` durch SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Auth ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt wird.
  </Step>
  <Step title="Health-Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` fügt der Statusausgabe die Live-Gateway-Health-Probe hinzu, einschließlich Kanal-Probes, wenn unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft die Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding Anweisungen zum SSH-Port-Forwarding für die Control UI aus, statt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht das Onboarding, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht-interaktiver Modus

Verwenden Sie `--non-interactive`, um das Onboarding zu automatisieren oder zu skripten:

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

Fügen Sie `--json` hinzu, um eine maschinenlesbare Zusammenfassung zu erhalten.

Gateway-Token-SecretRef im nicht-interaktiven Modus:

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
`--json` impliziert **nicht** den nicht-interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI Automation](/de/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für die Semantik der Flags und die Reihenfolge der Schritte.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Assistent-RPC

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik neu zu implementieren.

## Signal-Einrichtung (signal-cli)

Das Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die Installation von signal-cli folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn Minimax gewählt wurde)
- `tools.profile` (lokales Onboarding setzt standardmäßig `"coding"`, wenn kein Wert gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (Details zum Verhalten: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie während der Eingabeaufforderungen zustimmen (Namen werden, wenn möglich, in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten befinden sich unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Kanäle werden als Plugins ausgeliefert. Wenn Sie während der Einrichtung einen davon auswählen,
fordert das Onboarding Sie zur Installation auf (npm oder lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumentation

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Onboarding für die macOS-App: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway configuration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (Legacy)
- Skills: [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config)
