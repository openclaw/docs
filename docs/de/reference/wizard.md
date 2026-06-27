---
read_when:
    - Einen bestimmten Onboarding-Schritt oder ein bestimmtes Flag nachschlagen
    - Onboarding mit nicht-interaktivem Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für das CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-06-27T18:13:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Aktuelle Werte behalten**, **Prüfen und aktualisieren** oder **Vor Einrichtung zurücksetzen**.
    - Erneutes Ausführen des Onboardings löscht **nichts**, sofern Sie nicht ausdrücklich **Zurücksetzen**
      wählen (oder `--reset` übergeben).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, hält der Assistent an und fordert Sie auf,
      `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Zurücksetzen verwendet `trash` (niemals `rm`) und bietet Bereiche an:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)

  </Step>
  <Step title="Modell/Auth">
    - **Anthropic API-Schlüssel**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert einen Schlüssel an und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic API-Schlüssel**: bevorzugte Anthropic-Assistentenauswahl in Onboarding/Konfiguration.
    - **Anthropic setup-token**: weiterhin in Onboarding/Konfiguration verfügbar, obwohl OpenClaw jetzt die Wiederverwendung der Claude CLI bevorzugt, wenn verfügbar.
    - **OpenAI Code (Codex)-Abonnement (OAuth)**: Browser-Ablauf; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.
    - **OpenAI Code (Codex)-Abonnement (Gerätekopplung)**: Browser-Kopplungsablauf mit einem kurzlebigen Gerätecode.
      - Setzt `agents.defaults.model` über die Codex-Runtime auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist oder es bereits zur OpenAI-Familie gehört.
    - **OpenAI API-Schlüssel**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert einen Schlüssel an und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.5`, wenn kein Modell festgelegt ist, `openai/*` verwendet wird oder Legacy-Codex-Modellreferenzen genutzt werden.
    - **xAI (Grok) OAuth / API-Schlüssel**: meldet Sie bei Auswahl über xAI OAuth an oder fordert im API-Schlüsselpfad `XAI_API_KEY` an und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fordert `OPENCODE_API_KEY` an (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: bietet zuerst **Cloud + Lokal**, **Nur Cloud** oder **Nur lokal** an. `Cloud only` fordert `OLLAMA_API_KEY` an und verwendet `https://ollama.com`; die hostgestützten Modi fragen nach der Ollama-Basis-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell bei Bedarf automatisch; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    - Weitere Details: [Ollama](/de/providers/ollama)
    - **API-Schlüssel**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Multi-Modell-Proxy)**: fordert `AI_GATEWAY_API_KEY` an.
    - Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fordert Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` an.
    - Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Konfiguration wird automatisch geschrieben; der gehostete Standard ist `MiniMax-M3`.
      Die API-Schlüssel-Einrichtung verwendet `minimax/...`, und die OAuth-Einrichtung verwendet
      `minimax-portal/...`.
    - Weitere Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    - Weitere Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fordert `SYNTHETIC_API_KEY` an.
    - Weitere Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Konfiguration wird automatisch geschrieben.
    - Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: Noch keine Auth konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Für beste Qualität und ein geringeres Prompt-Injection-Risiko wählen Sie das stärkste verfügbare Modell der neuesten Generation in Ihrem Provider-Stack.
    - Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der API-Schlüssel-Speichermodus verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` ist nur noch Legacy-Importquelle.
    - Weitere Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless/Server: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie dann
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
    `$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die Workspace-Dateien, die für das Bootstrap-Ritual des Agenten benötigt werden.
    - Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent-Workspace](/de/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Freigabe.
    - Auth-Empfehlung: Behalten Sie **Token** auch für local loopback bei, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token erzeugen/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
      - Quickstart verwendet vorhandene `gateway.auth.token`-SecretRefs über `env`-, `file`- und `exec`-Provider hinweg für Onboarding-Probe/Dashboard-Bootstrap wieder.
      - Wenn diese SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding früh mit einer klaren Korrekturmeldung fehl, statt die Runtime-Auth stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere env-Variable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Binds erfordern weiterhin Auth.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Zielgruppe.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [iMessage](/de/channels/imessage): `imsg`-CLI-Pfad + Messages-DB-Zugriff; verwenden Sie einen SSH-Wrapper, wenn der Gateway nicht auf einem Mac läuft.
    - DM-Sicherheit: Standard ist Kopplung. Die erste DM sendet einen Code; genehmigen Sie ihn mit `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.

  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie den Schritt).
    - API-gestützte Provider können env-Variablen oder vorhandene Konfiguration für eine schnelle Einrichtung verwenden; schlüsselfreie Provider verwenden stattdessen ihre provider-spezifischen Voraussetzungen.
    - Überspringen mit `--skip-search`.
    - Später konfigurieren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-Benutzereinheit
      - Onboarding versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit der Gateway nach dem Abmelden weiterläuft.
      - Kann nach sudo fragen (schreibt `/var/lib/systemd/linger`); es versucht es zuerst ohne sudo.
    - **Runtime-Auswahl:** Node (empfohlen; für WhatsApp/Telegram erforderlich). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth einen Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation ihn, persistiert aber keine aufgelösten Klartext-Tokenwerte in Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Auth einen Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus ausdrücklich gesetzt ist.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet den Gateway (falls erforderlich) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Gateway-Integritätsprobe, einschließlich Kanalproben, wenn unterstützt (erfordert einen erreichbaren Gateway).

  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich der Eingabeaufforderung **Wie möchten Sie Ihren Agenten schlüpfen lassen?** für Terminal, Browser oder später.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding SSH-Port-Forward-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
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
`--json` impliziert **keinen** nicht interaktiven Modus. Verwenden Sie `--non-interactive` (und `--workspace`) für Skripte.
</Note>

Provider-spezifische Befehlsbeispiele finden Sie in [CLI-Automatisierung](/de/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für Flag-Semantik und Schrittfolge.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Assistenten-RPC

Der Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik neu zu implementieren.

## Signal-Einrichtung (signal-cli)

Onboarding kann `signal-cli` aus GitHub-Releases installieren:

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
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie sich während der Eingabeaufforderungen dafür entscheiden (Namen werden, wenn möglich, zu IDs aufgelöst).
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

Einige Channels werden als Plugins bereitgestellt. Wenn Sie während der Einrichtung einen auswählen, fordert das Onboarding Sie auf, ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumentation

- Onboarding-Überblick: [Onboarding (CLI)](/de/start/wizard)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [iMessage](/de/channels/imessage)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
