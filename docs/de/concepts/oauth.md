---
read_when:
    - Sie möchten OpenClaw OAuth durchgängig verstehen
    - Sie stoßen auf Probleme mit Token-Invalidierung / Abmeldung
    - Sie möchten Claude CLI- oder OAuth-Authentifizierungsabläufe verwenden
    - Sie möchten mehrere Konten oder Profil-Routing verwenden
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Multi-Account-Muster'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T06:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt „Abonnement-Authentifizierung“ per OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic gilt in der Praxis
nun folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Abonnement-Authentifizierung innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Nutzung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic in der Produktion ist die Authentifizierung per API-Schlüssel der sicherer empfohlene Weg.

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie Sie **mehrere Konten** handhaben (Profile + Überschreibungen pro Sitzung)

OpenClaw unterstützt außerdem **Provider-Plugins**, die eigene OAuth- oder API-Schlüssel-
Abläufe mitbringen. Führen Sie diese aus mit:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen während Login-/Refresh-Abläufen häufig ein **neues Refresh-Token** aus. Einige Provider (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn ein neues für dieselbe Benutzer-/App-Kombination ausgestellt wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines davon wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Laufzeit liest Anmeldedaten von **einer Stelle**
- wir können mehrere Profile behalten und sie deterministisch routen
- die Wiederverwendung externer CLIs ist Provider-spezifisch: Codex CLI kann ein leeres
  `openai-codex:default`-Profil initialisieren, aber sobald OpenClaw ein lokales OAuth-Profil hat,
  ist das lokale Refresh-Token maßgeblich; andere Integrationen können weiterhin
  extern verwaltet bleiben und ihren CLI-Auth-Speicher erneut lesen
- Status- und Startpfade, die den konfigurierten Provider-Satz bereits kennen, begrenzen
  die externe CLI-Erkennung auf diesen Satz, sodass ein nicht zusammenhängender CLI-Login-Speicher bei einer Einrichtung mit nur einem Provider nicht
  geprüft wird

## Speicherung (wo Tokens liegen)

Secrets werden in Auth-Speichern der Agenten gespeichert:

- Auth-Profile (OAuth + API-Schlüssel + optionale Referenzen auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie gefunden werden)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Nutzung in `auth-profiles.json` importiert)

Alle oben genannten Pfade respektieren auch `$OPENCLAW_STATE_DIR` (Überschreibung des State-Verzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Informationen zu statischen Secret-Referenzen und dem Verhalten bei Aktivierung von Laufzeit-Snapshots finden Sie unter [Secrets-Verwaltung](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Auth-Profil hat, verwendet OpenClaw Read-through-
Vererbung aus dem Standard-/Haupt-Agent-Speicher. Es klont die `auth-profiles.json`
des Haupt-Agenten beim Lesen nicht. OAuth-Refresh-Tokens sind besonders
sensibel: Normale Kopierabläufe überspringen sie standardmäßig, weil einige Provider
Refresh-Tokens nach der Nutzung rotieren oder ungültig machen. Konfigurieren Sie für einen
Agenten einen separaten OAuth-Login, wenn er ein unabhängiges Konto benötigt.

## Anthropic-Legacy-Token-Kompatibilität

<Warning>
Anthropics öffentliche Claude-Code-Dokumentation besagt, dass die direkte Claude-Code-Nutzung innerhalb
der Claude-Abonnementlimits bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude-
CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist. OpenClaw behandelt die Wiederverwendung von Claude CLI und
die Nutzung von `claude -p` für diese Integration daher als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Anthropics aktuelle Plan-Dokumentation für direkte Claude-Code-Nutzung finden Sie unter [Claude Code
mit Ihrem Pro- oder Max-
Plan verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Claude Code mit Ihrem Team- oder Enterprise-
Plan verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere abonnementartige Optionen in OpenClaw wünschen, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax)
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw stellt auch das Anthropic setup-token als unterstützten Token-Auth-Pfad bereit, bevorzugt nun aber die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Migration für Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung von Anthropic Claude CLI wieder. Wenn Sie bereits ein lokales
Claude-Login auf dem Host haben, können Onboarding/Konfiguration es direkt wiederverwenden.

## OAuth-Austausch (wie der Login funktioniert)

Die interaktiven Login-Abläufe von OpenClaw sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic setup-token

Ablauf:

1. Anthropic setup-token starten oder paste-token aus OpenClaw einfügen
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Auth-Profil
3. die Modellauswahl bleibt auf `anthropic/...`
4. vorhandene Anthropic-Auth-Profile bleiben für Rollback-/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Ablauf (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` erzeugen
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless arbeiten), die Redirect-URL/den Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen `expires`-Zeitstempel.

Zur Laufzeit:

- wenn `expires` in der Zukunft liegt → das gespeicherte Access-Token verwenden
- wenn abgelaufen → aktualisieren (unter einem Dateilock) und die gespeicherten Anmeldedaten überschreiben
- wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agenten liest, schreibt der Refresh
  in den Haupt-Agent-Speicher zurück, statt das Refresh-Token in
  den Speicher des sekundären Agenten zu kopieren
- Ausnahme: Einige externe CLI-Anmeldedaten bleiben extern verwaltet; OpenClaw
  liest diese CLI-Auth-Speicher erneut, statt kopierte Refresh-Tokens zu verbrauchen.
  Das Codex-CLI-Bootstrap ist absichtlich enger gefasst: Es initialisiert ein leeres
  `openai-codex:default`-Profil, anschließend halten OpenClaw-eigene Refreshes das lokale
  Profil maßgeblich.

Der Refresh-Ablauf ist automatisch; in der Regel müssen Sie Tokens nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn „privat“ und „Arbeit“ niemals interagieren sollen, verwenden Sie isolierte Agenten (separate Sitzungen + Anmeldedaten + Arbeitsbereich):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann Authentifizierung pro Agent (Assistent) und routen Sie Chats an den richtigen Agenten.

### 2) Erweitert: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

Wählen Sie, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs vorhanden sind:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentifizierung](/de/gateway/authentication) - Überblick über die Authentifizierung von Modell-Providern
- [Secrets](/de/gateway/secrets) - Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) - Auth-Konfigurationsschlüssel
