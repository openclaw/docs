---
read_when:
    - CLI-Einrichtung ausführen oder konfigurieren
    - Einrichten eines neuen Rechners
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Arbeitsbereich, Kanäle und Skills'
title: Einrichtung (CLI)
x-i18n:
    generated_at: "2026-05-10T19:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d8093f2375240f7a784b22c97c824a49b4d39b9217c0d1c0a1490bb15160700
    source_path: start/wizard.md
    workflow: 16
---

CLI-Onboarding ist der **empfohlene** Weg, um OpenClaw unter macOS,
Linux oder Windows (über WSL2; dringend empfohlen) einzurichten.
Es konfiguriert einen lokalen Gateway oder eine Remote-Gateway-Verbindung sowie Kanäle, Skills
und Workspace-Standards in einem geführten Ablauf.

```bash
openclaw onboard
```

<Info>
Schnellster erster Chat: Öffnen Sie die Control UI (keine Kanaleinrichtung erforderlich). Führen Sie
`openclaw dashboard` aus und chatten Sie im Browser. Doku: [Dashboard](/de/web/dashboard).
</Info>

So konfigurieren Sie später neu:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` bedeutet keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive`.
</Note>

<Tip>
CLI-Onboarding enthält einen Websuche-Schritt, in dem Sie einen Provider
wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Provider benötigen einen
API-Schlüssel, andere kommen ohne Schlüssel aus. Sie können dies auch später mit
`openclaw configure --section web` konfigurieren. Doku: [Web-Tools](/de/tools/web).
</Tip>

## Schnellstart vs. Erweitert

Onboarding beginnt mit **Schnellstart** (Standards) vs. **Erweitert** (vollständige Kontrolle).

<Tabs>
  <Tab title="Schnellstart (Standards)">
    - Lokaler Gateway (loopback)
    - Workspace-Standard (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei loopback)
    - Standard-Tool-Richtlinie für neue lokale Setups: `tools.profile: "coding"` (ein vorhandenes explizites Profil bleibt erhalten)
    - DM-Isolierungsstandard: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Telegram- und WhatsApp-DMs verwenden standardmäßig eine **Allowlist** (Sie werden nach Ihrer Telefonnummer gefragt)

  </Tab>
  <Tab title="Erweitert (vollständige Kontrolle)">
    - Zeigt jeden Schritt an (Modus, Workspace, Gateway, Kanäle, Daemon, Skills).

  </Tab>
</Tabs>

## Was Onboarding konfiguriert

Der **lokale Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Auth** — Wählen Sie einen unterstützten Provider/Auth-Ablauf (API-Schlüssel, OAuth oder providerspezifische manuelle Authentifizierung), einschließlich Custom Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder Unknown-Autoerkennung). Wählen Sie ein Standardmodell.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführt oder Webhook-/Hook-Inhalte verarbeitet, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Tool-Richtlinie strikt. Schwächere/ältere Stufen sind leichter per Prompt Injection angreifbar.
   Für nicht interaktive Ausführungen speichert `--secret-input-mode ref` env-gestützte Verweise in Auth-Profilen statt Klartextwerte für API-Schlüssel.
   Im nicht interaktiven `ref`-Modus muss die Provider-Umgebungsvariable gesetzt sein; Inline-Schlüsselflags ohne diese Umgebungsvariable schlagen sofort fehl.
   In interaktiven Ausführungen können Sie im Secret-Reference-Modus entweder auf eine Umgebungsvariable oder einen konfigurierten Provider-Verweis (`file` oder `exec`) zeigen, mit einer schnellen Preflight-Validierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Konfigurieren **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API key** als empfohlenen Produktionspfad an. Anthropic setup-token bleibt ebenfalls als unterstützter Token-Auth-Pfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** — Port, Bind-Adresse, Auth-Modus, Tailscale-Freigabe.
   Im interaktiven Token-Modus wählen Sie die standardmäßige Klartext-Token-Speicherung oder entscheiden sich für SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — Integrierte und gebündelte Chat-Kanäle wie iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-User-Unit (Linux/WSL2) oder eine native Windows Scheduled Task mit benutzerspezifischem Startup-Ordner-Fallback.
   Wenn Token-Auth ein Token benötigt und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert das aufgelöste Token aber nicht dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn Token-Auth ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Health Check** — Startet den Gateway und verifiziert, dass er läuft.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen des Onboardings löscht **nichts**, es sei denn, Sie wählen explizit **Zurücksetzen** (oder übergeben `--reset`).
CLI `--reset` verwendet standardmäßig Konfiguration, Anmeldedaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Onboarding Sie auf, zuerst `openclaw doctor` auszuführen.
</Note>

Der **Remote-Modus** konfiguriert nur den lokalen Client für die Verbindung zu einem Gateway an anderer Stelle.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agent hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agent mit eigenem Workspace,
eigenen Sitzungen und eigenen Auth-Profilen zu erstellen. Ausführung ohne `--workspace` startet Onboarding.

Was festgelegt wird:

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
Die ausführlichere technische Referenz einschließlich RPC-Details finden Sie in der
[Onboarding-Referenz](/de/reference/wizard).

## Verwandte Dokumente

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Ritual beim ersten Agent-Start: [Agent-Bootstrapping](/de/start/bootstrapping)
