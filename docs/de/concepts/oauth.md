---
read_when:
    - Sie möchten OpenClaw OAuth von Anfang bis Ende verstehen
    - Sie stoßen auf Token-Ungültigkeit / Abmeldeprobleme
    - Sie möchten Claude CLI- oder OAuth-Authentifizierungsabläufe
    - Sie möchten mehrere Konten oder Profil-Routing
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Multi-Account-Muster'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:25:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt „Abonnementauthentifizierung“ über OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic gilt praktisch
jetzt die folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Abonnementauthentifizierung innerhalb von OpenClaw**: Anthropic-Mitarbeitende
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Verwendung in externen Tools wie
OpenClaw unterstützt.

OpenClaw speichert sowohl OpenAI-API-Schlüssel-Auth als auch ChatGPT/Codex OAuth unter der
kanonischen Provider-ID `openai`. Ältere `openai-codex:*`-Profil-IDs und
`auth.order.openai-codex`-Einträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird; verwenden Sie `openai:*`-Profil-IDs und `auth.order.openai` für
neue Konfiguration.

Für Anthropic in der Produktion ist API-Schlüssel-Auth der sicherere empfohlene Weg.

Diese Seite erklärt:

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie Sie **mehrere Konten** handhaben (Profile + sitzungsbezogene Überschreibungen)

OpenClaw unterstützt außerdem **Provider-Plugins**, die eigene OAuth- oder API-Schlüssel-
Flows mitbringen. Führen Sie diese aus über:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen während Login-/Refresh-Flows häufig ein **neues Refresh-Token** aus. Manche Provider (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn für denselben Benutzer/dieselbe App ein neues ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines davon wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Runtime liest Anmeldedaten aus **einer Stelle**
- wir können mehrere Profile behalten und deterministisch routen
- Wiederverwendung externer CLIs ist Provider-spezifisch: Codex CLI kann ein leeres
  `openai:default`-Profil initialisieren, aber sobald OpenClaw ein lokales OAuth-Profil hat,
  ist das lokale Refresh-Token kanonisch. Wenn dieses lokale Refresh-Token abgelehnt wird,
  kann OpenClaw ein nutzbares Codex-CLI-Token desselben Kontos als reinen Runtime-
  Fallback verwenden; andere Integrationen können extern verwaltet bleiben und ihren
  CLI-Auth-Speicher erneut lesen
- Status- und Startpfade, die bereits die konfigurierte Provider-Menge kennen, beschränken
  die externe CLI-Erkennung auf diese Menge, sodass ein nicht zusammenhängender CLI-Login-Speicher
  bei einem Single-Provider-Setup nicht abgefragt wird

## Speicherung (wo Tokens liegen)

Secrets werden in Agent-Auth-Speichern gespeichert:

- Auth-Profile (OAuth + API-Schlüssel + optionale refs auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie entdeckt werden)

Legacy-Datei nur für Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alle oben genannten Pfade berücksichtigen auch `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Informationen zu statischen Secret-Refs und dem Aktivierungsverhalten von Runtime-Snapshots finden Sie unter [Secrets-Verwaltung](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Auth-Profil hat, verwendet OpenClaw Read-through-
Vererbung aus dem Standard-/Haupt-Agent-Speicher. Es klont beim Lesen nicht die
`auth-profiles.json` des Haupt-Agents. OAuth-Refresh-Tokens sind besonders
sensibel: normale Kopier-Flows überspringen sie standardmäßig, weil manche Provider
Refresh-Tokens nach der Verwendung rotieren oder ungültig machen. Konfigurieren Sie ein separates OAuth-Login für einen
Agent, wenn er ein unabhängiges Konto benötigt.

## Kompatibilität für Anthropic-Legacy-Tokens

<Warning>
Anthropics öffentliche Claude-Code-Dokumentation sagt, dass die direkte Claude-Code-Nutzung innerhalb
der Claude-Abonnementlimits bleibt, und Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-
CLI-Nutzung wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung von Claude CLI und
die Nutzung von `claude -p` für diese Integration als sanktioniert, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Anthropics aktuelle Dokumentation für direkte Claude-Code-Tarife finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie weitere abonnementartige Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/zai).
</Warning>

OpenClaw bietet Anthropic-Setup-Token ebenfalls als unterstützten Token-Auth-Pfad an, bevorzugt jetzt aber die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Migration für Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung von Anthropic Claude CLI wieder. Wenn Sie bereits ein lokales
Claude-Login auf dem Host haben, kann Onboarding/Configure es direkt wiederverwenden.

## OAuth-Austausch (wie Login funktioniert)

Die interaktiven Login-Flows von OpenClaw sind in `openclaw/plugin-sdk/llm` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Flow-Form:

1. Anthropic-Setup-Token starten oder Token aus OpenClaw einfügen
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Auth-Profil
3. die Modellauswahl bleibt auf `anthropic/...`
4. vorhandene Anthropic-Auth-Profile bleiben für Rollback-/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Der Login-Befehl verwendet weiterhin die kanonische OpenAI-Provider-ID:

```bash
openclaw models auth login --provider openai
```

Verwenden Sie `--profile-id openai:<name>` für mehrere ChatGPT/Codex-OAuth-Konten in
einem Agent. Verwenden Sie `openai-codex:<name>` nicht für neue Profile. Doctor migriert
dieses ältere Präfix zu einer kollisionsfreien `openai:*`-Profil-ID; führen Sie
`openclaw models auth list --provider openai` nach der Reparatur aus, bevor Sie
Profil-IDs in `auth.order` oder `/model ...@<profileId>` kopieren.

Flow-Form (PKCE):

1. PKCE-Verifier/Challenge + zufälliges `state` generieren
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback unter `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht binden kann (oder Sie remote/headless arbeiten), die Redirect-URL/den Code einfügen
5. Austausch unter `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai`.

## Refresh + Ablauf

Profile speichern einen `expires`-Zeitstempel.

Zur Runtime:

- wenn `expires` in der Zukunft liegt → das gespeicherte Access-Token verwenden
- wenn abgelaufen → refreshen (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agents liest, schreibt Refresh
  zurück in den Haupt-Agent-Speicher, statt das Refresh-Token in den
  sekundären Agent-Speicher zu kopieren
- Ausnahme: manche externen CLI-Anmeldedaten bleiben extern verwaltet; OpenClaw
  liest diese CLI-Auth-Speicher erneut, statt kopierte Refresh-Tokens zu verbrauchen.
  Codex-CLI-Bootstrap ist absichtlich enger gefasst: Er legt ein leeres
  `openai:default`-Profil an, danach halten OpenClaw-eigene Refreshes das lokale
  Profil kanonisch. Wenn das lokale Codex-Refresh fehlschlägt und Codex CLI ein
  nutzbares Token für dasselbe Konto hat, kann OpenClaw dieses Token für die aktuelle
  Runtime-Anfrage verwenden, ohne es nach `auth-profiles.json` zurückzuschreiben.

Der Refresh-Flow ist automatisch; Sie müssen Tokens im Allgemeinen nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: getrennte Agents

Wenn Sie möchten, dass „privat“ und „Arbeit“ nie interagieren, verwenden Sie isolierte Agents (separate Sitzungen + Anmeldedaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann Auth pro Agent (Assistent) und routen Sie Chats zum richtigen Agent.

### 2) Fortgeschritten: mehrere Profile in einem Agent

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

Wählen Sie, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- sitzungsbezogen über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs existieren:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentifizierung](/de/gateway/authentication) - Überblick über Modell-Provider-Auth
- [Secrets](/de/gateway/secrets) - Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) - Auth-Konfigurationsschlüssel
