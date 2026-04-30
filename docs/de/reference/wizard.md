---
read_when:
    - Nachschlagen eines bestimmten Onboarding-Schritts oder Flags
    - Onboarding im nicht interaktiven Modus automatisieren
    - Fehlersuche beim Onboarding-Verhalten
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für das CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-30T07:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Beibehalten / Ändern / Zurücksetzen**.
    - Erneutes Ausführen des Onboardings löscht **nichts**, es sei denn, Sie wählen ausdrücklich **Zurücksetzen**
      (oder übergeben `--reset`).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um auch den Arbeitsbereich zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert
      Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Zurücksetzen verwendet `trash` (nie `rm`) und bietet Bereiche an:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Arbeitsbereich)

  </Step>
  <Step title="Modell/Auth">
    - **Anthropic-API-Schlüssel**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn anschließend für die Verwendung durch den Daemon.
    - **Anthropic-API-Schlüssel**: bevorzugte Anthropic-Assistentenauswahl in Onboarding/Konfiguration.
    - **Anthropic-Setup-Token**: weiterhin in Onboarding/Konfiguration verfügbar, auch wenn OpenClaw jetzt die Wiederverwendung der Claude CLI bevorzugt, sofern verfügbar.
    - **OpenAI Code (Codex)-Abonnement (OAuth)**: Browser-Ablauf; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI Code (Codex)-Abonnement (Gerätekopplung)**: Browser-Kopplungsablauf mit einem kurzlebigen Gerätecode.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI-API-Schlüssel**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn anschließend in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn das Modell nicht gesetzt ist, `openai/*` oder `openai-codex/*`.
    - **xAI (Grok)-API-Schlüssel**: fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: bietet zuerst **Cloud + Lokal**, **Nur Cloud** oder **Nur lokal** an. `Cloud only` fragt nach `OLLAMA_API_KEY` und verwendet `https://ollama.com`; die hostgestützten Modi fragen nach der Ollama-Basis-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell bei Bedarf automatisch; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API-Schlüssel**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Multi-Modell-Proxy)**: fragt nach `AI_GATEWAY_API_KEY`.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fragt nach Account ID, Gateway ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Die Konfiguration wird automatisch geschrieben; der gehostete Standard ist `MiniMax-M2.7`.
      Die Einrichtung mit API-Schlüssel verwendet `minimax/...`, und die OAuth-Einrichtung verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fragt nach `SYNTHETIC_API_KEY`.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Die Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Die Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: Noch keine Auth konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen (oder geben Sie Provider/Modell manuell ein). Für beste Qualität und ein geringeres Prompt-Injection-Risiko wählen Sie das stärkste verfügbare Modell der neuesten Generation in Ihrem Provider-Stack.
    - Das Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der Speichermodus für API-Schlüssel ist standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` ist nur für Legacy-Importe vorgesehen.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless-/Serverbetrieb: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie anschließend
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
    `$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Arbeitsbereich">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Arbeitsbereichsdateien an, die für das Bootstrap-Ritual des Agenten benötigt werden.
    - Vollständiges Arbeitsbereichslayout + Sicherungsleitfaden: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, Bindung, Auth-Modus, Tailscale-Exposition.
    - Auth-Empfehlung: Behalten Sie **Token** auch für loopback bei, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
      - Quickstart verwendet vorhandene `gateway.auth.token`-SecretRefs über `env`-, `file`- und `exec`-Provider hinweg für Onboarding-Prüfung/Dashboard-Bootstrap wieder.
      - Wenn diese SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Behebungsmeldung fehl, statt die Runtime-Auth stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere env-Variable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Bindungen erfordern weiterhin Auth.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-`imsg`-CLI-Pfad + DB-Zugriff.
    - DM-Sicherheit: Standard ist Kopplung. Die erste DM sendet einen Code; genehmigen Sie ihn über `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.

  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie diesen Schritt).
    - API-gestützte Provider können env-Variablen oder vorhandene Konfiguration für eine schnelle Einrichtung verwenden; schlüsselfreie Provider verwenden stattdessen ihre provider-spezifischen Voraussetzungen.
    - Mit `--skip-search` überspringen.
    - Später konfigurieren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Betrieb verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-Benutzereinheit
      - Das Onboarding versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit der Gateway nach der Abmeldung weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); es versucht es zuerst ohne sudo.
    - **Runtime-Auswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert aber keine aufgelösten Klartext-Tokenwerte in Metadaten der Supervisor-Dienstumgebung.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus ausdrücklich gesetzt ist.

  </Step>
  <Step title="Health-Check">
    - Startet den Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Gateway-Health-Prüfung, einschließlich Kanalprüfungen, sofern unterstützt (erfordert einen erreichbaren Gateway).

  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt Sie einen Node-Manager auswählen: **npm / pnpm** (bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding SSH-Port-Forwarding-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn die Control-UI-Assets fehlen, versucht das Onboarding, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

Verwenden Sie `--non-interactive`, um Onboarding zu automatisieren oder zu skripten:

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

Provider-spezifische Befehlsbeispiele finden Sie in [CLI-Automatisierung](/de/start/wizard-cli-automation#provider-specific-examples).
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

Der Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte darstellen, ohne die Onboarding-Logik erneut zu implementieren.

## Signal-Einrichtung (signal-cli)

Das Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, sofern verfügbar.
- Windows verwendet WSL2; die signal-cli-Installation folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bindung, Authentifizierung, tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Zulassungslisten (Slack/Discord/Matrix/Microsoft Teams), wenn Sie sie während der Abfragen aktivieren (Namen werden nach Möglichkeit in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` abgelegt.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Channels werden als Plugins bereitgestellt. Wenn Sie während der Einrichtung einen auswählen, fordert Sie das Onboarding auf,
ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Zugehörige Dokumentation

- Onboarding-Überblick: [Onboarding (CLI)](/de/start/wizard)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (veraltet)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
