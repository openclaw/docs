---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einen neuen Rechner einrichten
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Arbeitsbereich, Kanäle und Skills'
title: Einrichtung (CLI)
x-i18n:
    generated_at: "2026-05-06T07:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI-Onboarding ist der **empfohlene** Weg, OpenClaw unter macOS,
Linux oder Windows (über WSL2; dringend empfohlen) einzurichten.
Es konfiguriert einen lokalen Gateway oder eine Remote-Gateway-Verbindung sowie Kanäle, Skills
und Workspace-Standardwerte in einem geführten Ablauf.

```bash
openclaw onboard
```

<Info>
Schnellster erster Chat: Öffnen Sie die Control UI (keine Kanaleinrichtung erforderlich). Führen Sie
`openclaw dashboard` aus und chatten Sie im Browser. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

Für eine spätere Neukonfiguration:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive`.
</Note>

<Tip>
CLI-Onboarding enthält einen Websuchschritt, in dem Sie einen Provider
wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Provider benötigen einen
API-Schlüssel, andere kommen ohne Schlüssel aus. Sie können dies auch später mit
`openclaw configure --section web` konfigurieren. Dokumentation: [Webtools](/de/tools/web).
</Tip>

## Schnellstart vs. Erweitert

Onboarding beginnt mit **Schnellstart** (Standardwerte) vs. **Erweitert** (volle Kontrolle).

<Tabs>
  <Tab title="Schnellstart (Standardwerte)">
    - Lokaler Gateway (loopback)
    - Workspace-Standardwert (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch auf loopback)
    - Standard-Tool-Richtlinie für neue lokale Einrichtungen: `tools.profile: "coding"` (ein vorhandenes explizites Profil bleibt erhalten)
    - Standard für DM-Isolierung: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Telegram- und WhatsApp-DMs verwenden standardmäßig eine **Allowlist** (Sie werden nach Ihrer Telefonnummer gefragt)

  </Tab>
  <Tab title="Erweitert (volle Kontrolle)">
    - Zeigt jeden Schritt an (Modus, Workspace, Gateway, Kanäle, Daemon, Skills).

  </Tab>
</Tabs>

## Was Onboarding konfiguriert

**Lokaler Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Auth** — Wählen Sie einen unterstützten Provider-/Authentifizierungsablauf (API-Schlüssel, OAuth oder Provider-spezifische manuelle Authentifizierung), einschließlich Custom Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung als Unknown). Wählen Sie ein Standardmodell.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführt oder Webhook-/Hook-Inhalte verarbeitet, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Tool-Richtlinie strikt. Schwächere/ältere Stufen lassen sich leichter per Prompt-Injection angreifen.
   Für nicht interaktive Ausführungen speichert `--secret-input-mode ref` umgebungsbasierte Refs in Auth-Profilen statt API-Schlüsselwerte im Klartext.
   Im nicht interaktiven `ref`-Modus muss die Provider-Umgebungsvariable gesetzt sein; das Übergeben von Inline-Schlüsselflags ohne diese Umgebungsvariable schlägt sofort fehl.
   In interaktiven Ausführungen können Sie im Secret-Referenzmodus entweder auf eine Umgebungsvariable oder auf eine konfigurierte Provider-Ref (`file` oder `exec`) verweisen, mit schneller Preflight-Validierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Configure **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API key** als empfohlenen Produktionspfad an. Anthropic setup-token bleibt außerdem als unterstützter Token-Auth-Pfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** — Port, Bind-Adresse, Authentifizierungsmodus, Tailscale-Freigabe.
   Im interaktiven Token-Modus wählen Sie den Standardspeicher für Klartext-Token oder entscheiden sich für SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — integrierte und gebündelte Chat-Kanäle wie BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit (Linux/WSL2) oder eine native geplante Aufgabe unter Windows mit benutzerspezifischem Startup-Ordner als Fallback.
   Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert das aufgelöste Token jedoch nicht in den Supervisor-Dienstumgebungsmetadaten.
   Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Health Check** — Startet den Gateway und verifiziert, dass er ausgeführt wird.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen des Onboardings löscht **nichts**, sofern Sie nicht explizit **Zurücksetzen** wählen (oder `--reset` übergeben).
CLI `--reset` bezieht sich standardmäßig auf Konfiguration, Anmeldedaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzubeziehen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Onboarding Sie auf, zuerst `openclaw doctor` auszuführen.
</Note>

**Remote-Modus** konfiguriert nur den lokalen Client für die Verbindung mit einem Gateway an anderer Stelle.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agent hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agent mit eigenem Workspace,
eigenen Sitzungen und Auth-Profilen zu erstellen. Ausführen ohne `--workspace` startet Onboarding.

Was gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (Onboarding kann dies übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Detaillierte Schritt-für-Schritt-Aufschlüsselungen und Konfigurationsausgaben finden Sie in der
[CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die ausführlichere technische Referenz, einschließlich RPC-Details, finden Sie in der
[Onboarding-Referenz](/de/reference/wizard).

## Zugehörige Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Erststart-Ritual des Agent: [Agent-Bootstrapping](/de/start/bootstrapping)
