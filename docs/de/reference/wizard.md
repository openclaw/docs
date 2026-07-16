---
read_when:
    - Nachschlagen eines bestimmten Onboarding-Schritts oder Flags
    - Onboarding im nicht interaktiven Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für das Onboarding über die CLI: alle Schritte, Flags und Konfigurationsfelder'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-07-16T13:16:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard). Das schrittweise
Verhalten und die Ausgaben werden in der [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference) beschrieben.

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Zurücksetzen (optional)">
    - `--reset` setzt den Zustand zurück, bevor die Einrichtung ausgeführt wird; ohne diese Option behält ein erneutes Ausführen des Onboardings
      die vorhandene Konfiguration bei und verwendet sie erneut als Standardwerte.
    - `--reset-scope` steuert, was `--reset` entfernt: `config` (nur die Konfigurationsdatei
      ), `config+creds+sessions` (Standardwert) oder `full` (entfernt außerdem den
      Workspace).
    - Wenn die Konfigurationsdatei ungültig ist, wird das Onboarding beendet und Sie werden aufgefordert, zuerst
      `openclaw doctor` auszuführen und anschließend die Einrichtung erneut auszuführen.
    - Beim Zurücksetzen wird der Zustand in den Papierkorb verschoben (niemals direkt gelöscht).

  </Step>
  <Step title="Risikobestätigung">
    - Beim ersten Durchlauf (oder jedem Durchlauf, bevor `wizard.securityAcknowledgedAt` festgelegt ist)
      werden Sie gebeten zu bestätigen, dass Ihnen bewusst ist, dass Agenten leistungsfähig sind und ein vollständiger
      Systemzugriff riskant ist.
    - `--non-interactive` erfordert ausdrücklich `--accept-risk`; ohne diese Option
      wird das Onboarding mit einem Fehler beendet, statt eine Eingabeaufforderung anzuzeigen.
    - Bei interaktiven Durchläufen wird statt des Flags eine Bestätigungsaufforderung angezeigt; eine Ablehnung
      bricht die Einrichtung ab.

  </Step>
  <Step title="Modell/Authentifizierung">
    - **Anthropic-API-Schlüssel**: Verwendet `ANTHROPIC_API_KEY`, sofern vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn anschließend für die Verwendung durch den Daemon.
    - **Anthropic Claude CLI**: Bevorzugter lokaler Pfad, wenn bereits eine Claude-CLI-Anmeldung vorhanden ist; OpenClaw unterstützt alternativ weiterhin die Authentifizierung mit einem Anthropic-Einrichtungstoken.
    - **OpenAI-Code-Abonnement (Codex) (OAuth)**: Browserablauf; fügen Sie `code#state` ein.
      - Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.6-sol` gesetzt.
    - **OpenAI-Code-Abonnement (Codex) (Gerätekopplung)**: Browserbasierter Kopplungsablauf mit einem kurzlebigen Gerätecode.
      - Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit auf `openai/gpt-5.6-sol` gesetzt.
    - **OpenAI-API-Schlüssel**: Verwendet `OPENAI_API_KEY`, sofern vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn anschließend in Authentifizierungsprofilen.
      - Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` auf `openai/gpt-5.6` gesetzt; die reine Modell-ID der direkten API wird der Sol-Stufe zugeordnet.
    - Beim Hinzufügen oder erneuten Authentifizieren von OpenAI bleibt ein vorhandenes, explizit festgelegtes primäres Modell erhalten, einschließlich `openai/gpt-5.5`. Wenn GPT-5.6 für das Konto nicht verfügbar ist, wählen Sie ausdrücklich `openai/gpt-5.5` aus; OpenClaw stuft das Modell nicht automatisch herunter.
    - **xAI OAuth**: Browseranmeldung per Gerätecode, für die kein localhost-Callback erforderlich ist und die daher auch über SSH/Docker/VPS funktioniert (`--auth-choice xai-oauth`).
    - **xAI-API-Schlüssel**: Fordert zur Eingabe von `XAI_API_KEY` auf (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` funktioniert weiterhin als rein manueller Kompatibilitätsalias für denselben xAI-OAuth-Gerätecodeablauf; verwenden Sie für neue Skripte `xai-oauth`.
    - **OpenCode**: Fordert zur Eingabe von `OPENCODE_API_KEY` auf (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: Bietet zunächst **Cloud + lokal**, **Nur Cloud** oder **Nur lokal** an. `Cloud only` fordert zur Eingabe von `OLLAMA_API_KEY` auf und verwendet `https://ollama.com`; bei den hostgestützten Modi wird nach der Ollama-Basis-URL gefragt (Standardwert `http://127.0.0.1:11434`), die verfügbaren Modelle werden ermittelt und das ausgewählte lokale Modell wird bei Bedarf automatisch abgerufen; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    - Weitere Einzelheiten: [Ollama](/de/providers/ollama)
    - **API-Schlüssel**: Speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Proxy für mehrere Modelle)**: Fordert zur Eingabe von `AI_GATEWAY_API_KEY` auf.
    - Weitere Einzelheiten: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Fordert zur Eingabe der Konto-ID, Gateway-ID und von `CLOUDFLARE_AI_GATEWAY_API_KEY` auf.
    - Weitere Einzelheiten: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Die Konfiguration wird automatisch geschrieben; der gehostete Standardwert ist `MiniMax-M3`.
      Die Einrichtung per API-Schlüssel verwendet `minimax/...`, die OAuth-Einrichtung
      `minimax-portal/...`.
    - Weitere Einzelheiten: [MiniMax](/de/providers/minimax)
    - **StepFun**: Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    - Standard verwendet derzeit standardmäßig `step-3.5-flash`; Step Plan umfasst außerdem `step-3.5-flash-2603`.
    - Weitere Einzelheiten: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: Fordert zur Eingabe von `SYNTHETIC_API_KEY` auf.
    - Weitere Einzelheiten: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Die Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Die Konfiguration wird automatisch geschrieben.
    - Weitere Einzelheiten: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Benutzerdefinierter Provider**: Funktioniert mit OpenAI-kompatiblen, OpenAI-Responses-kompatiblen oder Anthropic-kompatiblen Endpunkten. Nicht interaktive Flags: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (optional; greift ersatzweise auf `CUSTOM_API_KEY` zurück), `--custom-provider-id` (optional; wird automatisch aus der Basis-URL abgeleitet), `--custom-compatibility openai|openai-responses|anthropic` (Standardwert `openai`), `--custom-image-input` / `--custom-text-input` (überschreibt die abgeleitete Erkennung von Vision-Modellen).
    - **Überspringen**: Noch keine Authentifizierung konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Wählen Sie für optimale Qualität und ein geringeres Risiko durch Prompt-Injection das leistungsfähigste verfügbare Modell der neuesten Generation in Ihrem Provider-Stack.
    - Das Onboarding führt eine Modellprüfung durch und warnt, wenn das konfigurierte Modell unbekannt ist oder die Authentifizierung fehlt.
    - Der Speichermodus für API-Schlüssel verwendet standardmäßig Klartextwerte in Authentifizierungsprofilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen umgebungsvariablenbasierte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); die referenzierte Umgebungsvariable muss bereits gesetzt sein, andernfalls schlägt das Onboarding sofort fehl.
    - Authentifizierungsprofile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` dient ausschließlich dem Import aus Altsystemen.
    - Weitere Einzelheiten: [OAuth](/de/concepts/oauth)
    <Note>
    Hinweis für Systeme ohne Benutzeroberfläche/Server: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie anschließend
    `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
    Pfad `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    dient nur als Importquelle für Altdaten.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Bootstrap-Ritual des Agenten erforderlich sind.
    - Vollständiges Workspace-Layout und Sicherungsleitfaden: [Agenten-Workspace](/de/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port (Standardwert **18789**), Bindung, Authentifizierungsmodus, Tailscale-Freigabe.
    - Authentifizierungsempfehlung: Behalten Sie **Token** selbst bei Loopback bei, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung Folgendes an:
      - **Klartext-Token generieren/speichern** (Standardwert)
      - **SecretRef verwenden** (optional)
      - Der Schnellstart verwendet vorhandene `gateway.auth.token`-SecretRefs für die Provider `env`, `file` und `exec` erneut, um die Onboarding-Prüfung und die Dashboard-Initialisierung durchzuführen.
      - Wenn diese SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Korrekturanweisung fehl, statt die Laufzeitauthentifizierung unbemerkt herabzustufen.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls die Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess uneingeschränkt vertrauen.
    - Bindungen außerhalb von Loopback erfordern weiterhin eine Authentifizierung.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): Optionale QR-Anmeldung.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Zielgruppe.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal) (Plugin): Optionale Installation von `signal-cli` + Kontokonfiguration.
    - [iMessage](/de/channels/imessage): Pfad zur `imsg`-CLI + Zugriff auf die Nachrichtendatenbank; verwenden Sie einen SSH-Wrapper, wenn der Gateway nicht auf einem Mac ausgeführt wird.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack und weitere Kanäle werden als
      Plugins ausgeliefert, die das Onboarding für Sie installieren kann. Vollständiger Katalog: [Kanäle](/de/channels).
    - DM-Sicherheit: Standardmäßig wird eine Kopplung verwendet. Die erste DM sendet einen Code; genehmigen Sie ihn über `openclaw pairing approve <channel> <code>` oder verwenden Sie Zulassungslisten.

  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG oder Tavily aus (oder überspringen Sie diesen Schritt).
    - API-gestützte Provider können für eine schnelle Einrichtung Umgebungsvariablen oder die vorhandene Konfiguration verwenden; Provider ohne Schlüssel nutzen stattdessen ihre providerspezifischen Voraussetzungen.
    - Überspringen Sie den Schritt mit `--skip-search`.
    - Später konfigurieren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; verwenden Sie für Systeme ohne Benutzeroberfläche einen benutzerdefinierten LaunchDaemon (nicht im Lieferumfang enthalten).
    - Linux (und Windows über WSL2): systemd-Benutzereinheit
      - Das Onboarding versucht, über `loginctl enable-linger <user>` das Fortbestehen der Benutzersitzung zu aktivieren, damit der Gateway nach der Abmeldung weiter ausgeführt wird.
      - Möglicherweise wird nach sudo gefragt (schreibt `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - Natives Windows: Zunächst wird eine geplante Aufgabe verwendet; wenn das Erstellen der Aufgabe verweigert wird, greift OpenClaw auf ein benutzerspezifisches Anmeldeelement im Autostartordner zurück und startet den Gateway sofort.
    - **Laufzeitauswahl:** Node ist erforderlich, da der kanonische Laufzeit-Zustandsspeicher `node:sqlite` verwendet. Veraltete Bun-Dienste werden bei der Reparatur zu Node migriert.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert den aufgelösten Klartext-Tokenwert jedoch nicht dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, wird die Daemon-Installation mit konkreten Anweisungen zur Behebung blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, wird die Daemon-Installation blockiert, bis der Modus ausdrücklich festgelegt wurde.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet bei Bedarf den Gateway und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Integritätsprüfung des Gateways, einschließlich Kanalprüfungen, sofern unterstützt (erfordert einen erreichbaren Gateway).

  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft die Anforderungen.
    - Ermöglicht Ihnen die Auswahl eines Node-Managers: **npm / pnpm / bun**.
    - Installiert automatisch optionale Abhängigkeiten für vertrauenswürdige mitgelieferte Skills (einige verwenden Homebrew unter macOS).
    - Überspringt Skills, deren Voraussetzung für das Homebrew-, uv- oder Go-Installationsprogramm nicht verfügbar ist, gruppiert sie mit Anleitungen zur manuellen Einrichtung und verweist Sie nach der Installation der Voraussetzung auf `openclaw doctor`.

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich der Aufforderung **Wie möchten Sie Ihren Agenten schlüpfen lassen?** für Terminal, Browser oder später.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding Anweisungen zur SSH-Portweiterleitung für die Control UI aus, anstatt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht das Onboarding, sie zu erstellen; als Fallback dient `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

Verwenden Sie `--non-interactive --accept-risk`, um das Onboarding zu automatisieren oder per Skript auszuführen (das
Flag ist die erforderliche Bestätigung des Risikos; ohne dieses Flag wird das Onboarding
mit einem Fehler beendet):

```bash
openclaw onboard --non-interactive --accept-risk \
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
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.

<Note>
`--json` aktiviert **nicht** automatisch den nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive --accept-risk` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation#provider-specific-examples).
Diese Referenzseite erläutert die Semantik der Flags und die Reihenfolge der Schritte.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` ist eine reservierte Agent-ID und kann nicht für `openclaw agents add` verwendet werden.

## Gateway-Assistent-RPC

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können die Schritte darstellen, ohne die Onboarding-Logik erneut zu implementieren.

## Signal-Einrichtung (signal-cli)

Das Onboarding erkennt, ob `signal-cli` in `PATH` vorhanden ist, und bietet andernfalls die Installation an:

- Linux x86-64: Lädt den offiziellen nativen GraalVM-Build aus den GitHub-Releases von `signal-cli` herunter und speichert ihn unter `~/.openclaw/tools/signal-cli/<version>/`.
- macOS und andere Architekturen: Installiert stattdessen über Homebrew.
- Natives Windows: Wird noch nicht unterstützt; führen Sie das Onboarding innerhalb von WSL2 aus, um den Linux-Installationspfad zu verwenden.
- Schreibt in jedem Fall `channels.signal.cliPath` in Ihre Konfiguration.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (beim lokalen Onboarding standardmäßig `"coding"`, wenn nicht festgelegt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bindung, Authentifizierung, Tailscale)
- `session.dmScope` (beim lokalen Onboarding standardmäßig `"per-channel-peer"`, wenn nicht festgelegt; vorhandene explizite Werte bleiben erhalten. Details: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Zulassungslisten für Direktnachrichten von Kanälen, wenn Sie diese während der Kanalabfragen aktivieren. Discord, Matrix, Microsoft Teams und Slack lösen Namen nach Möglichkeit in IDs auf; andere Kanäle übernehmen IDs direkt (zum Beispiel numerische Telegram-Absender-IDs oder WhatsApp-Telefonnummern).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Bei manueller Konfiguration kann `yarn` weiterhin verwendet werden, indem `skills.install.nodeManager` direkt festgelegt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schreibt `agents.list[]` und optional `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` gespeichert.
Aktive Sitzungen und Transkripte werden in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` gespeichert. Das Verzeichnis
`~/.openclaw/agents/<agentId>/sessions/` wird für Eingaben zur Migration von Altdaten
sowie für Archiv- und Support-Artefakte verwendet.

Einige Kanäle werden als Plugins bereitgestellt. Wenn Sie während der Einrichtung einen davon auswählen, fordert das Onboarding
Sie zur Installation auf (über npm oder einen lokalen Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumentation

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- CLI-Einrichtungsreferenz: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [iMessage](/de/channels/imessage)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
