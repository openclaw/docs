---
read_when:
    - Nach einem bestimmten Onboarding-Schritt oder Flag suchen
    - Onboarding mit dem nicht interaktiven Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-25T18:22:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie **Beibehalten / Ändern / Zurücksetzen**.
    - Das erneute Ausführen des Onboardings löscht nichts, es sei denn, Sie wählen ausdrücklich **Zurücksetzen**
      (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Keys enthält, stoppt der Assistent und fordert
      Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Zum Zurücksetzen wird `trash` verwendet (niemals `rm`) und es werden folgende Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic-API-Key**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Key und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic-API-Key**: bevorzugte Anthropic-Assistentenwahl in Onboarding/Konfiguration.
    - **Anthropic-Setup-Token**: weiterhin in Onboarding/Konfiguration verfügbar, obwohl OpenClaw jetzt die Wiederverwendung der Claude CLI bevorzugt, wenn verfügbar.
    - **OpenAI Code (Codex) subscription (OAuth)**: Browser-Flow; fügen Sie den `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits die OpenAI-Familie verwendet wird.
    - **OpenAI Code (Codex) subscription (device pairing)**: Browser-Pairing-Flow mit einem kurzlebigen Device-Code.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits die OpenAI-Familie verwendet wird.
    - **OpenAI API key**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Key und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.
    - **xAI (Grok) API key**: fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie zwischen dem Zen- oder Go-Katalog wählen.
    - **Ollama**: bietet zuerst **Cloud + Local**, **Nur Cloud** oder **Nur lokal** an. `Nur Cloud` fragt nach `OLLAMA_API_KEY` und verwendet `https://ollama.com`; die hostgestützten Modi fragen nach der Ollama-Basis-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell bei Bedarf automatisch; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API key**: speichert den Key für Sie.
    - **Vercel AI Gateway (Multi-Model-Proxy)**: fragt nach `AI_GATEWAY_API_KEY`.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fragt nach Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Die Konfiguration wird automatisch geschrieben; der gehostete Standard ist `MiniMax-M2.7`.
      API-Key-Setup verwendet `minimax/...`, und OAuth-Setup verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst außerdem `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fragt nach `SYNTHETIC_API_KEY`.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Die Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Die Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: Noch keine Authentifizierung konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Für die beste Qualität und ein geringeres Risiko durch Prompt Injection wählen Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    - Das Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.
    - Der Speicherungsmodus für API-Keys verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile befinden sich unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Keys + OAuth). `~/.openclaw/credentials/oauth.json` dient nur noch dem Legacy-Import.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für headless/Server: Führen Sie OAuth auf einem Rechner mit Browser aus und kopieren Sie dann
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
    Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur noch eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standard ist `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Bootstrap-Ritual des Agenten benötigt werden.
    - Vollständiges Workspace-Layout + Backup-Anleitung: [Agent-Workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Exposition.
    - Auth-Empfehlung: Behalten Sie **Token** auch für loopback bei, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token erzeugen/speichern** (Standard)
      - **SecretRef verwenden** (opt-in)
      - Quickstart verwendet vorhandene SecretRefs aus `gateway.auth.token` über die Provider `env`, `file` und `exec` für Onboarding-Probe/Dashboard-Bootstrap erneut.
      - Wenn diese SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Korrekturmeldung fehl, statt die Laufzeit-Authentifizierung stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls die Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Binds erfordern weiterhin Authentifizierung.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): JSON für Service Account + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-`imsg`-CLI-Pfad + DB-Zugriff.
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn mit `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie ihn).
    - API-gestützte Provider können Umgebungsvariablen oder vorhandene Konfiguration für ein schnelles Setup verwenden; Provider ohne Key verwenden stattdessen ihre providerspezifischen Voraussetzungen.
    - Mit `--skip-search` überspringen.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für headless verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-User-Unit
      - Das Onboarding versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Logout weiterläuft.
      - Möglicherweise wird sudo angefordert (schreibt nach `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - **Laufzeitauswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` durch SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit festgelegt wird.
  </Step>
  <Step title="Health Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` fügt der Statusausgabe die Live-Gateway-Health-Probe hinzu, einschließlich Channel-Probes, wenn unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft die Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (Bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding Anweisungen für SSH-Port-Forwarding zur Control UI aus, statt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht das Onboarding, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

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
`--json` impliziert **nicht** den nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für die Semantik der Flags und die Reihenfolge der Schritte.

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

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik neu implementieren zu müssen.

## Signal-Setup (signal-cli)

Das Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Unter Windows wird WSL2 verwendet; die Installation von signal-cli folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI-Setup-Referenz](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie sie bei den Eingabeaufforderungen aktivieren (Namen werden nach Möglichkeit in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Zugangsdaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Channels werden als Plugins ausgeliefert. Wenn Sie während des Setups eines auswählen, fordert das Onboarding
Sie auf, es zu installieren (npm oder ein lokaler Pfad), bevor es konfiguriert werden kann.

## Verwandte Dokumentation

- Onboarding-Überblick: [Onboarding (CLI)](/de/start/wizard)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (Legacy)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
