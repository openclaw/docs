---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Neuen Rechner einrichten
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Workspace, Kanäle und Skills'
title: Einrichtung (CLI)
x-i18n:
    generated_at: "2026-06-27T18:14:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI-Onboarding ist der **empfohlene** Setup-Pfad im Terminal für OpenClaw unter
macOS, Linux oder Windows. Nutzer von Windows-Desktops können auch mit dem
[Windows Hub](/de/platforms/windows) beginnen.
Es konfiguriert einen lokalen Gateway oder eine Remote-Gateway-Verbindung sowie Channels, Skills
und Workspace-Standardeinstellungen in einem geführten Ablauf.

```bash
openclaw onboard
```

## Gebietsschema

Der CLI-Assistent lokalisiert feste Onboarding-Texte. Er ermittelt das Gebietsschema aus
`OPENCLAW_LOCALE`, dann `LC_ALL`, dann `LC_MESSAGES`, dann `LANG`, und fällt
auf Englisch zurück. Unterstützte Assistent-Gebietsschemata sind `en`, `zh-CN` und `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Namen und stabile Kennungen bleiben unverändert: `OpenClaw`, `Gateway`, `Tailscale`,
Befehle, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Channel-Bezeichnungen
werden nicht übersetzt.

<Info>
Schnellster erster Chat: Öffnen Sie die Control UI (kein Channel-Setup erforderlich). Führen Sie
`openclaw dashboard` aus und chatten Sie im Browser. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

Zur späteren Neukonfiguration:

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

## QuickStart vs. Erweitert

Das Onboarding beginnt mit **QuickStart** (Standardeinstellungen) vs. **Erweitert** (vollständige Kontrolle).

<Tabs>
  <Tab title="QuickStart (Standardeinstellungen)">
    - Lokaler Gateway (loopback)
    - Workspace-Standard (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei loopback)
    - Standard-Toolrichtlinie für neue lokale Setups: `tools.profile: "coding"` (vorhandenes explizites Profil bleibt erhalten)
    - Standard für DM-Isolierung: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI-Setup-Referenz](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Telegram- und WhatsApp-DMs verwenden standardmäßig eine **Allowlist** (Sie werden nach Ihrer Telefonnummer gefragt)

  </Tab>
  <Tab title="Erweitert (vollständige Kontrolle)">
    - Legt jeden Schritt offen (Modus, Workspace, Gateway, Channels, Daemon, Skills).

  </Tab>
</Tabs>

## Was das Onboarding konfiguriert

Der **lokale Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Authentifizierung** — Wählen Sie einen unterstützten Provider-/Authentifizierungsablauf (API-Schlüssel, OAuth oder Provider-spezifische manuelle Authentifizierung), einschließlich benutzerdefiniertem Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder Unbekannt mit automatischer Erkennung). Wählen Sie ein Standardmodell aus.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführt oder Webhook-/Hook-Inhalte verarbeitet, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Toolrichtlinie strikt. Schwächere/ältere Stufen sind leichter per Prompt-Injection angreifbar.
   Für nicht interaktive Ausführungen speichert `--secret-input-mode ref` umgebungsbasierte Verweise in Authentifizierungsprofilen statt API-Schlüsselwerte im Klartext.
   Im nicht interaktiven `ref`-Modus muss die Provider-Umgebungsvariable gesetzt sein; das Übergeben von Inline-Schlüsselflags ohne diese Umgebungsvariable schlägt sofort fehl.
   In interaktiven Ausführungen können Sie im Modus für geheime Verweise entweder auf eine Umgebungsvariable oder einen konfigurierten Provider-Verweis (`file` oder `exec`) zeigen, mit einer schnellen Preflight-Validierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Konfigurieren **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic-API-Schlüssel** als empfohlenen Produktionspfad an. Anthropic setup-token bleibt ebenfalls als unterstützter Token-Authentifizierungspfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** — Port, Bind-Adresse, Authentifizierungsmodus, Tailscale-Freigabe.
   Im interaktiven Token-Modus wählen Sie die standardmäßige Klartext-Tokenspeicherung oder entscheiden sich für SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — Integrierte und offizielle Plugin-Chat-Channels wie iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und mehr.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit (Linux/WSL2) oder eine native Windows Scheduled Task mit Rückfall auf den benutzerspezifischen Startup-Ordner.
   Wenn Token-Authentifizierung ein Token benötigt und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, persistiert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn Token-Authentifizierung ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Health Check** — Startet den Gateway und überprüft, ob er läuft.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen des Onboardings löscht **nichts**, es sei denn, Sie wählen explizit **Zurücksetzen** (oder übergeben `--reset`).
CLI `--reset` umfasst standardmäßig Konfiguration, Anmeldedaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert das Onboarding Sie auf, zuerst `openclaw doctor` auszuführen.
</Note>

Der **Remote-Modus** konfiguriert nur den lokalen Client so, dass er sich mit einem Gateway an anderer Stelle verbindet.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agent hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agent mit eigenem Workspace,
eigenen Sitzungen und eigenen Authentifizierungsprofilen zu erstellen. Das Ausführen ohne `--workspace` startet das Onboarding.

Was gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (Onboarding kann dies übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Ausführliche Schritt-für-Schritt-Aufschlüsselungen und Konfigurationsausgaben finden Sie in der
[CLI-Setup-Referenz](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die tiefere technische Referenz, einschließlich RPC-Details, finden Sie in der
[Onboarding-Referenz](/de/reference/wizard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- Onboarding für die macOS-App: [Onboarding](/de/start/onboarding)
- Erstausführungsritual für Agents: [Agent-Bootstrapping](/de/start/bootstrapping)
