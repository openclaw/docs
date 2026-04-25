---
read_when:
    - Sie möchten OpenClaw OAuth Ende-zu-Ende verstehen.
    - Sie sind auf Probleme mit Token-Ungültigkeit oder Abmeldung gestoßen.
    - Sie möchten Authentifizierungsabläufe für Claude CLI oder OAuth.
    - Sie möchten mehrere Konten oder Profil-Routing.
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw unterstützt „Subscription Auth“ über OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic ist die praktische
Aufteilung jetzt:

- **Anthropic API key**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Subscription Auth innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Nutzung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic in der Produktion ist Authentifizierung per API key der sicherere empfohlene Weg.

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie mehrere Konten gehandhabt werden (**Profile + Überschreibungen pro Sitzung**)

OpenClaw unterstützt auch **Provider-Plugins**, die eigene OAuth- oder API-key-
Abläufe mitbringen. Führen Sie sie aus mit:

```bash
openclaw models auth login --provider <id>
```

## Das Token-Sink (warum es existiert)

OAuth-Provider erzeugen bei Login-/Refresh-Abläufen häufig ein **neues Refresh-Token**. Manche Provider (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn für denselben Benutzer/dieselbe App ein neues ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines von beiden wird später zufällig „abgemeldet“

Um das zu verringern, behandelt OpenClaw `auth-profiles.json` als **Token-Sink**:

- die Laufzeit liest Anmeldedaten aus **einer Stelle**
- wir können mehrere Profile behalten und sie deterministisch routen
- externe CLI-Wiederverwendung ist providerspezifisch: Codex CLI kann ein leeres
  Profil `openai-codex:default` bootstrappen, aber sobald OpenClaw ein lokales OAuth-Profil hat,
  ist das lokale Refresh-Token kanonisch; andere Integrationen können extern
  verwaltet bleiben und ihren CLI-Auth-Speicher erneut lesen

## Speicherung (wo Tokens liegen)

Secrets werden **pro Agent** gespeichert:

- Auth-Profile (OAuth + API keys + optionale Refs auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie gefunden werden)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alles oben Genannte berücksichtigt auch `$OPENCLAW_STATE_DIR` (Überschreibung des Statusverzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische SecretRefs und das Aktivierungsverhalten von Laufzeit-Snapshots siehe [Secrets Management](/de/gateway/secrets).

## Legacy-Token-Kompatibilität für Anthropic

<Warning>
In den öffentlichen Claude-Code-Dokumenten von Anthropic steht, dass die direkte Nutzung von Claude Code innerhalb
der Claude-Subscription-Limits bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung von Claude
CLI im OpenClaw-Stil wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung von Claude CLI und die
Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Zu den aktuellen Dokumenten von Anthropic für direkte Claude-Code-Pläne siehe [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere Subscription-ähnliche Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw stellt auch ein Anthropic-Setup-Token als unterstützten Token-Auth-Pfad bereit, bevorzugt jetzt jedoch die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Migration von Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung von Anthropic Claude CLI wieder. Wenn Sie bereits ein lokales
Claude-Login auf dem Host haben, kann Onboarding/Konfiguration es direkt wiederverwenden.

## OAuth-Austausch (wie Login funktioniert)

Die interaktiven Login-Abläufe von OpenClaw sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Ablaufform:

1. Anthropic-Setup-Token oder Paste-Token aus OpenClaw starten
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Auth-Profil
3. die Modellauswahl bleibt auf `anthropic/...`
4. bestehende Anthropic-Auth-Profile bleiben für Rollback/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Ablaufform (PKCE):

1. PKCE-Verifier/Challenge + zufälliges `state` erzeugen
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` abzufangen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless arbeiten), die Redirect-URL/den Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Wizard-Pfad ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen Zeitstempel `expires`.

Zur Laufzeit gilt:

- wenn `expires` in der Zukunft liegt → das gespeicherte Access-Token verwenden
- wenn abgelaufen → refreshen (unter einem Dateilock) und die gespeicherten Anmeldedaten überschreiben
- Ausnahme: einige externe CLI-Anmeldedaten bleiben extern verwaltet; OpenClaw
  liest diese CLI-Auth-Speicher erneut, anstatt kopierte Refresh-Tokens zu verbrauchen.
  Das Bootstrap von Codex CLI ist absichtlich enger gefasst: Es initialisiert ein leeres
  Profil `openai-codex:default`, danach halten OpenClaw-eigene Refreshes das lokale
  Profil kanonisch.

Der Refresh-Ablauf ist automatisch; normalerweise müssen Sie Tokens nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn „privat“ und „Arbeit“ nie miteinander interagieren sollen, verwenden Sie isolierte Agenten (separate Sitzungen + Anmeldedaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann Auth pro Agent (Wizard) und leiten Sie Chats an den richtigen Agenten weiter.

### 2) Erweitert: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

Wählen Sie aus, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs existieren:

- `openclaw channels list --json` (zeigt `auth[]`)

Zugehörige Dokumente:

- [Model failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [Slash commands](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentication](/de/gateway/authentication) — Übersicht zur Authentifizierung von Modell-Providern
- [Secrets](/de/gateway/secrets) — Speicherung von Anmeldedaten und SecretRef
- [Configuration Reference](/de/gateway/configuration-reference#auth-storage) — Auth-Konfigurationsschlüssel
