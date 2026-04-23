---
read_when:
    - Einen bestimmten Onboarding-Schritt oder ein Flag nachschlagen
    - Onboarding mit dem nicht interaktiven Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-23T06:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding-Referenz

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht findest du unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wähle **Keep / Modify / Reset**.
    - Das erneute Ausführen des Onboardings löscht **nichts**, es sei denn, du wählst explizit **Reset**
      (oder übergibst `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; nutze `--reset-scope full`,
      um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert
      dich auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Für Reset wird `trash` verwendet (niemals `rm`) und es werden folgende Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiger Reset (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic API key**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic API key**: bevorzugte Anthropic-Assistant-Auswahl in `onboarding/configure`.
    - **Anthropic setup-token**: weiterhin in `onboarding/configure` verfügbar, obwohl OpenClaw jetzt die Wiederverwendung von Claude CLI bevorzugt, wenn verfügbar.
    - **OpenAI Code (Codex) subscription (OAuth)**: Browser-Ablauf; füge den `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn das Modell nicht gesetzt ist oder `openai/*` ist.
    - **OpenAI Code (Codex) subscription (device pairing)**: Browser-Kopplungsablauf mit einem kurzlebigen Gerätecode.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn das Modell nicht gesetzt ist oder `openai/*` ist.
    - **OpenAI API key**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn das Modell nicht gesetzt ist, `openai/*` oder `openai-codex/*` ist.
    - **xAI (Grok) API key**: fordert `XAI_API_KEY` an und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fordert `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) an und lässt dich den Zen- oder Go-Katalog auswählen.
    - **Ollama**: bietet zuerst **Cloud + Local**, **Cloud only** oder **Local only** an. `Cloud only` fordert `OLLAMA_API_KEY` an und verwendet `https://ollama.com`; die hostgestützten Modi fordern die Base-URL von Ollama an, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell bei Bedarf automatisch; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API key**: speichert den Schlüssel für dich.
    - **Vercel AI Gateway (multi-model proxy)**: fordert `AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fordert Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Konfiguration wird automatisch geschrieben; gehosteter Standard ist `MiniMax-M2.7`.
      Die Einrichtung per API-Key verwendet `minimax/...`, und die Einrichtung per OAuth verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält auch `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: fordert `SYNTHETIC_API_KEY` an.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Skip**: noch keine Auth konfiguriert.
    - Wähle ein Standardmodell aus den erkannten Optionen aus (oder gib `provider/model` manuell ein). Für beste Qualität und geringeres Prompt-Injection-Risiko wähle das stärkste Modell der neuesten Generation, das in deinem Provider-Stack verfügbar ist.
    - Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der Speichermodus für API-Keys verwendet standardmäßig Klartextwerte in Auth-Profilen. Nutze `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Keys + OAuth). `~/.openclaw/credentials/oauth.json` ist nur noch eine Legacy-Importquelle.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless-/Server-Setups: Schließe OAuth auf einem Rechner mit Browser ab und kopiere dann
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
    Pfad `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Initialisiert die Workspace-Dateien, die für das Bootstrap-Ritual des Agenten benötigt werden.
    - Vollständiges Workspace-Layout + Backup-Anleitung: [Agent workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Exponierung.
    - Auth-Empfehlung: Behalte **Token** auch für Loopback bei, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
      - Quickstart verwendet vorhandene SecretRefs in `gateway.auth.token` über `env`-, `file`- und `exec`-Provider hinweg für Onboarding-Probe-/Dashboard-Bootstrap erneut.
      - Wenn dieser SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Meldung zur Behebung fehl, statt die Laufzeit-Auth stillschweigend zu verschlechtern.
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Env-Variable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktiviere Auth nur, wenn du jedem lokalen Prozess vollständig vertraust.
    - Auch Nicht-Loopback-Binds erfordern weiterhin Auth.
  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Service-Account-JSON + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Base-URL.
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-`imsg`-CLI-Pfad + DB-Zugriff.
    - DM-Sicherheit: Standard ist Kopplung. Die erste DM sendet einen Code; genehmige ihn über `openclaw pairing approve <channel> <code>` oder verwende Allowlists.
  </Step>
  <Step title="Websuche">
    - Wähle einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringe diesen Schritt).
    - API-gestützte Provider können für schnelles Setup Env-Variablen oder vorhandene Konfiguration verwenden; Provider ohne Schlüssel nutzen ihre providerspezifischen Voraussetzungen.
    - Überspringen mit `--skip-search`.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Setups nutze einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-User-Unit
      - Onboarding versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Logout weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); es versucht es zuerst ohne sudo.
    - **Laufzeitauswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert aber keine aufgelösten Klartext-Tokenwerte in den Supervisor-Service-Umgebungsmetadaten.
    - Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt wird.
  </Step>
  <Step title="Health Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statuseinträge um die Live-Gateway-Health-Probe, einschließlich Kanal-Probes, wenn unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt dich einen Node-Manager wählen: **npm / pnpm** (Bun wird nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt Onboarding SSH-Port-Forward-Anweisungen für die Control UI aus, anstatt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht Onboarding, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

Verwende `--non-interactive`, um das Onboarding zu automatisieren oder zu skripten:

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

Füge `--json` hinzu für eine maschinenlesbare Zusammenfassung.

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
`--json` impliziert **nicht** den nicht interaktiven Modus. Verwende für Skripte `--non-interactive` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele findest du unter [CLI Automation](/de/start/wizard-cli-automation#provider-specific-examples).
Verwende diese Referenzseite für Flag-Semantik und die Reihenfolge der Schritte.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Wizard-RPC

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut implementieren zu müssen.

## Signal-Setup (`signal-cli`)

Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in deine Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die Installation von `signal-cli` folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax gewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nichts gesetzt ist; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (Details zum Verhalten: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn du während der Prompts zustimmst (Namen werden nach Möglichkeit zu IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Kanäle werden als Plugins ausgeliefert. Wenn du während des Setups einen davon auswählst, fordert dich das Onboarding
auf, ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumente

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway configuration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (Legacy)
- Skills: [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config)
