---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einen neuen Rechner einrichten
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Arbeitsbereich, Kanäle und Skills'
title: Einrichtung (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI-Onboarding ist der **empfohlene** Einrichtungsweg im Terminal für OpenClaw unter
macOS, Linux oder Windows. Windows-Desktop-Benutzer können auch mit dem
[Windows Hub](/de/platforms/windows) beginnen.
Es konfiguriert ein lokales Gateway oder eine Remote-Gateway-Verbindung sowie Kanäle, Skills
und Workspace-Standardeinstellungen in einem geführten Ablauf.

```bash
openclaw onboard
```

Der Schnellstart dauert normalerweise nur wenige Minuten, das vollständige Onboarding kann jedoch länger dauern,
wenn Provider-Anmeldung, Kanal-Kopplung, Daemon-Installation, Netzwerk-Downloads,
Skills oder optionale Plugins zusätzliche Einrichtung benötigen. Der Assistent zeigt diese Zeitplanung
vorab an, und optionale Schritte können übersprungen und später mit
`openclaw configure` erneut aufgerufen werden.

## Gebietsschema

Der CLI-Assistent lokalisiert feste Onboarding-Texte. Er ermittelt das Gebietsschema aus
`OPENCLAW_LOCALE`, dann `LC_ALL`, dann `LC_MESSAGES`, dann `LANG` und fällt
auf Englisch zurück. Unterstützte Assistent-Gebietsschemas sind `en`, `zh-CN` und `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Namen und stabile Kennungen bleiben wörtlich: `OpenClaw`, `Gateway`, `Tailscale`,
Befehle, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Kanalbezeichnungen
werden nicht übersetzt.

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
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Provider benötigen einen
API-Schlüssel, andere kommen ohne Schlüssel aus. Sie können dies auch später mit
`openclaw configure --section web` konfigurieren. Dokumentation: [Webtools](/de/tools/web).
</Tip>

## Schnellstart vs. Erweitert

Onboarding beginnt mit **Schnellstart** (Standardeinstellungen) vs. **Erweitert** (vollständige Kontrolle).

<Tabs>
  <Tab title="Schnellstart (Standardeinstellungen)">
    - Lokales Gateway (loopback)
    - Workspace-Standard (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei loopback)
    - Tool-Policy-Standard für neue lokale Setups: `tools.profile: "coding"` (vorhandenes explizites Profil bleibt erhalten)
    - Standard für DM-Isolierung: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Telegram- und WhatsApp-DMs verwenden standardmäßig **Allowlist** (Sie werden nach Ihrer Telefonnummer gefragt)

  </Tab>
  <Tab title="Erweitert (vollständige Kontrolle)">
    - Zeigt jeden Schritt an (Modus, Workspace, Gateway, Kanäle, Daemon, Skills).

  </Tab>
</Tabs>

## Was Onboarding konfiguriert

**Lokaler Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Auth** — Wählen Sie einen unterstützten Provider-/Auth-Ablauf (API-Schlüssel, OAuth oder Provider-spezifische manuelle Authentifizierung), einschließlich benutzerdefiniertem Provider
   (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung „Unbekannt“). Wählen Sie ein Standardmodell.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführt oder Webhook-/Hook-Inhalte verarbeitet, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Tool-Policy strikt. Schwächere/ältere Stufen sind anfälliger für Prompt-Injection.
   Für nicht interaktive Ausführungen speichert `--secret-input-mode ref` env-gestützte Referenzen in Auth-Profilen statt Klartext-API-Schlüsselwerten.
   Im nicht interaktiven `ref`-Modus muss die Provider-Umgebungsvariable gesetzt sein; die Übergabe von Inline-Schlüssel-Flags ohne diese Umgebungsvariable schlägt sofort fehl.
   In interaktiven Ausführungen können Sie im Geheimnisreferenzmodus entweder auf eine Umgebungsvariable oder eine konfigurierte Provider-Referenz (`file` oder `exec`) verweisen, mit schneller Vorabvalidierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Konfigurieren **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API key** als empfohlenen Produktionspfad an. Anthropic setup-token bleibt ebenfalls als unterstützter Token-Auth-Pfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** — Port, Bind-Adresse, Auth-Modus, Tailscale-Freigabe.
   Wählen Sie im interaktiven Token-Modus die standardmäßige Klartext-Token-Speicherung oder entscheiden Sie sich für SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — integrierte und offizielle Plugin-Chatkanäle wie iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit (Linux/WSL2) oder eine native Windows Scheduled Task mit benutzerspezifischem Startup-Ordner-Fallback.
   Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation dieses Token, speichert das aufgelöste Token jedoch nicht dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn Token-Auth ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbarer Anleitung blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt wird.
6. **Health Check** — Startet das Gateway und prüft, ob es läuft.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Erneutes Ausführen des Onboardings löscht **nichts**, sofern Sie nicht ausdrücklich **Zurücksetzen** wählen (oder `--reset` übergeben).
CLI `--reset` umfasst standardmäßig Konfiguration, Zugangsdaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Onboarding Sie zuerst auf, `openclaw doctor` auszuführen.
</Note>

**Remote-Modus** konfiguriert nur den lokalen Client so, dass er eine Verbindung zu einem Gateway an einem anderen Ort herstellt.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agent hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agent mit eigenem Workspace,
eigenen Sitzungen und Auth-Profilen zu erstellen. Eine Ausführung ohne `--workspace` startet das Onboarding.

Was gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (Onboarding kann dies erledigen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Ausführliche Schritt-für-Schritt-Aufschlüsselungen und Konfigurationsausgaben finden Sie in der
[CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die tiefere technische Referenz einschließlich RPC-Details finden Sie in der
[Onboarding-Referenz](/de/reference/wizard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Erster Agent-Startablauf: [Agent-Bootstrapping](/de/start/bootstrapping)
