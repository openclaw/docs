---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Eine neue Maschine einrichten
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Workspace, Kanäle und Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T07:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

CLI-Onboarding ist der **empfohlene** Weg, um OpenClaw auf macOS,
Linux oder Windows (über WSL2; dringend empfohlen) einzurichten.
Es konfiguriert ein lokales Gateway oder eine Verbindung zu einem Remote-Gateway sowie Kanäle, Skills
und Workspace-Standards in einem geführten Ablauf.

```bash
openclaw onboard
```

<Info>
Schnellster erster Chat: Öffnen Sie die Control UI (kein Kanal-Setup erforderlich). Führen Sie
`openclaw dashboard` aus und chatten Sie im Browser. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

Zum späteren Neukonfigurieren:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive`.
</Note>

<Tip>
CLI-Onboarding enthält einen Schritt zur Websuche, in dem Sie einen Provider
wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Provider erfordern einen
API-Schlüssel, andere nicht. Sie können dies auch später mit
`openclaw configure --section web` konfigurieren. Dokumentation: [Web-Tools](/de/tools/web).
</Tip>

## QuickStart vs. Advanced

Onboarding beginnt mit **QuickStart** (Standards) vs. **Advanced** (volle Kontrolle).

<Tabs>
  <Tab title="QuickStart (Standards)">
    - Lokales Gateway (Loopback)
    - Workspace-Standard (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (wird automatisch generiert, selbst auf Loopback)
    - Standardrichtlinie für Tools bei neuen lokalen Setups: `tools.profile: "coding"` (vorhandenes explizites Profil bleibt erhalten)
    - Standard für DM-Isolation: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI-Setup-Referenz](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Exponierung **Aus**
    - Telegram- + WhatsApp-DMs verwenden standardmäßig **allowlist** (Sie werden nach Ihrer Telefonnummer gefragt)

  </Tab>
  <Tab title="Advanced (volle Kontrolle)">
    - Zeigt jeden Schritt an (Modus, Workspace, Gateway, Kanäle, Daemon, Skills).

  </Tab>
</Tabs>

## Was Onboarding konfiguriert

**Lokaler Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Auth** — Wählen Sie einen unterstützten Provider-/Auth-Flow (API-Schlüssel, OAuth oder providerspezifische manuelle Authentifizierung), einschließlich Custom Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder Unknown auto-detect). Wählen Sie ein Standardmodell.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführen oder Webhook-/Hook-Inhalte verarbeiten soll, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Tool-Richtlinie strikt. Schwächere/ältere Tiers sind leichter per Prompt-Injection zu beeinflussen.
   Bei nicht interaktiven Läufen speichert `--secret-input-mode ref` env-gestützte Refs in Authentifizierungsprofilen statt Klartextwerte von API-Schlüsseln.
   Im nicht interaktiven `ref`-Modus muss die Env-Variable des Providers gesetzt sein; das Übergeben von Inline-Key-Flags ohne diese Env-Variable schlägt sofort fehl.
   In interaktiven Läufen können Sie im Secret-Reference-Modus entweder auf eine Umgebungsvariable oder auf einen konfigurierten Provider-Ref (`file` oder `exec`) verweisen, mit einer schnellen Preflight-Validierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Configure **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API key** als empfohlenen Produktionspfad an. Anthropic-Setup-Token bleibt außerdem als unterstützter Token-Auth-Pfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Bootstrap-Dateien werden angelegt.
3. **Gateway** — Port, Bind-Adresse, Auth-Modus, Tailscale-Exponierung.
   Im interaktiven Token-Modus wählen Sie zwischen Standard-Klartextspeicherung des Tokens oder SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — integrierte und gebündelte Chat-Kanäle wie BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und mehr.
5. **Daemon** — installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit (Linux/WSL2) oder einen nativen Scheduled Task unter Windows mit Fallback auf den Startup-Ordner pro Benutzer.
   Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst wird, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Health-Check** — startet das Gateway und prüft, ob es läuft.
7. **Skills** — installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen von Onboarding löscht nichts, es sei denn, Sie wählen explizit **Reset** (oder übergeben `--reset`).
CLI-`--reset` betrifft standardmäßig Konfiguration, Credentials und Sitzungen; verwenden Sie `--reset-scope full`, um auch den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Onboarding Sie zuerst auf, `openclaw doctor` auszuführen.
</Note>

**Remote-Modus** konfiguriert nur den lokalen Client für die Verbindung mit einem Gateway an einem anderen Ort.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Einen weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace,
eigenen Sitzungen und eigenen Authentifizierungsprofilen zu erstellen. Wenn Sie den Befehl ohne `--workspace` ausführen, wird Onboarding gestartet.

Was gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten zu routen (Onboarding kann das tun).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Für detaillierte Schritt-für-Schritt-Aufschlüsselungen und Konfigurationsausgaben siehe
[CLI-Setup-Referenz](/de/start/wizard-cli-reference).
Für nicht interaktive Beispiele siehe [CLI-Automatisierung](/de/start/wizard-cli-automation).
Für die tiefere technische Referenz, einschließlich RPC-Details, siehe
[Onboarding-Referenz](/de/reference/wizard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Überblick über Onboarding: [Onboarding-Überblick](/de/start/onboarding-overview)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- First-Run-Ritual für Agenten: [Agent-Bootstrapping](/de/start/bootstrapping)
