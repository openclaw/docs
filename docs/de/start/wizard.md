---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einrichten eines neuen Computers
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Ersteinrichtung: geführte Einrichtung von Gateway, Arbeitsbereich, Kanälen und Skills'
title: Einrichtung (CLI)
x-i18n:
    generated_at: "2026-04-30T07:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI-Onboarding ist die **empfohlene** Methode, um OpenClaw unter macOS,
Linux oder Windows (über WSL2; dringend empfohlen) einzurichten.
Es konfiguriert ein lokales Gateway oder eine Verbindung zu einem entfernten Gateway sowie Kanäle, Skills
und Workspace-Standardeinstellungen in einem geführten Ablauf.

```bash
openclaw onboard
```

<Info>
Schnellster erster Chat: Öffnen Sie die Control UI (keine Kanaleinrichtung erforderlich). Führen Sie
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
CLI-Onboarding enthält einen Websuchschritt, in dem Sie einen Provider
wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Provider erfordern einen
API-Schlüssel, während andere keinen Schlüssel benötigen. Sie können dies auch später mit
`openclaw configure --section web` konfigurieren. Dokumentation: [Web-Tools](/de/tools/web).
</Tip>

## Schnellstart vs. Erweitert

Onboarding beginnt mit **Schnellstart** (Standardeinstellungen) oder **Erweitert** (volle Kontrolle).

<Tabs>
  <Tab title="Schnellstart (Standardeinstellungen)">
    - Lokales Gateway (local loopback)
    - Workspace-Standard (oder bestehender Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei local loopback)
    - Standard-Toolrichtlinie für neue lokale Setups: `tools.profile: "coding"` (bestehendes explizites Profil bleibt erhalten)
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

1. **Modell/Authentifizierung** — wählen Sie einen unterstützten Provider-/Authentifizierungsablauf (API-Schlüssel, OAuth oder providerspezifische manuelle Authentifizierung), einschließlich Custom Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung bei Unknown). Wählen Sie ein Standardmodell aus.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführen oder Webhook-/Hook-Inhalte verarbeiten soll, verwenden Sie vorzugsweise das stärkste verfügbare Modell der neuesten Generation und halten Sie die Toolrichtlinie strikt. Schwächere/ältere Stufen sind anfälliger für Prompt-Injection.
   Bei nicht interaktiven Ausführungen speichert `--secret-input-mode ref` umgebungsbasierte Verweise in Authentifizierungsprofilen statt API-Schlüsselwerte im Klartext.
   Im nicht interaktiven `ref`-Modus muss die Provider-Umgebungsvariable gesetzt sein; die Übergabe von Inline-Schlüsselflags ohne diese Umgebungsvariable schlägt sofort fehl.
   Bei interaktiven Ausführungen können Sie im Modus für geheime Verweise entweder auf eine Umgebungsvariable oder einen konfigurierten Provider-Verweis (`file` oder `exec`) zeigen, mit schneller Vorabvalidierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Konfigurieren **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API-Schlüssel** als empfohlenen Produktionspfad an. Anthropic setup-token bleibt ebenfalls als unterstützter Token-Authentifizierungspfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** — Port, Bind-Adresse, Authentifizierungsmodus, Tailscale-Freigabe.
   Im interaktiven Token-Modus wählen Sie die standardmäßige Klartext-Token-Speicherung oder aktivieren SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — integrierte und gebündelte Chat-Kanäle wie BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit (Linux/WSL2) oder eine native geplante Aufgabe unter Windows mit Fallback über den benutzerspezifischen Startup-Ordner.
   Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht auflösbar ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Health Check** — Startet das Gateway und prüft, ob es läuft.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen des Onboardings löscht **nichts**, sofern Sie nicht ausdrücklich **Zurücksetzen** wählen (oder `--reset` übergeben).
CLI `--reset` umfasst standardmäßig Konfiguration, Anmeldedaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Onboarding Sie auf, zuerst `openclaw doctor` auszuführen.
</Note>

**Remote-Modus** konfiguriert nur den lokalen Client für die Verbindung zu einem Gateway an anderer Stelle.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agent hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agent mit eigenem Workspace,
eigenen Sitzungen und Authentifizierungsprofilen zu erstellen. Ausführung ohne `--workspace` startet das Onboarding.

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
Die tiefere technische Referenz einschließlich RPC-Details finden Sie in der
[Onboarding-Referenz](/de/reference/wizard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Ritual beim ersten Agent-Start: [Agent-Bootstrapping](/de/start/bootstrapping)
