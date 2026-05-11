---
read_when:
    - Sie möchten OpenClaw OAuth End-to-End verstehen
    - Sie stoßen auf Probleme mit der Token-Invalidierung / Abmeldung
    - Sie möchten Authentifizierungsabläufe für Claude CLI oder OAuth
    - Sie möchten mehrere Konten oder Profil-Routing verwenden
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt „Abonnementauthentifizierung“ über OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic gilt praktisch
jetzt folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Abonnementauthentifizierung in OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Verwendung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic in der Produktion ist die Authentifizierung per API-Schlüssel der sicherere empfohlene Weg.

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Token **gespeichert** werden (und warum)
- wie Sie **mehrere Konten** handhaben (Profile + Überschreibungen pro Sitzung)

OpenClaw unterstützt außerdem **Provider-Plugins**, die eigene OAuth- oder API-Schlüssel-
Flows mitbringen. Führen Sie sie aus mit:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen bei Login-/Refresh-Flows häufig ein **neues Refresh-Token** aus. Einige Provider (oder OAuth-Clients) können ältere Refresh-Token ungültig machen, wenn ein neues für dieselbe Benutzer/App-Kombination ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines davon wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Laufzeit liest Anmeldedaten von **einer Stelle**
- wir können mehrere Profile behalten und sie deterministisch weiterleiten
- die Wiederverwendung externer CLI-Daten ist Provider-spezifisch: Codex CLI kann ein leeres
  Profil `openai-codex:default` initialisieren, aber sobald OpenClaw ein lokales OAuth-Profil hat,
  ist das lokale Refresh-Token kanonisch; andere Integrationen können weiterhin
  extern verwaltet bleiben und ihren CLI-Authentifizierungsspeicher erneut lesen
- Status- und Startpfade, die den konfigurierten Provider-Satz bereits kennen, beschränken
  die externe CLI-Erkennung auf diesen Satz, sodass ein nicht zugehöriger CLI-Login-Speicher nicht
  für eine Einzel-Provider-Einrichtung geprüft wird

## Speicherung (wo Token liegen)

Geheimnisse werden in den Authentifizierungsspeichern des Agenten gespeichert:

- Authentifizierungsprofile (OAuth + API-Schlüssel + optionale Referenzen auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie entdeckt werden)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alle oben genannten Pfade berücksichtigen außerdem `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische Geheimnisreferenzen und das Aktivierungsverhalten von Laufzeit-Snapshots siehe [Geheimnisverwaltung](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Authentifizierungsprofil hat, verwendet OpenClaw durchlesende
Vererbung aus dem Speicher des Standard-/Hauptagenten. Es klont die `auth-profiles.json` des
Hauptagenten beim Lesen nicht. OAuth-Refresh-Token sind besonders
sensibel: normale Kopier-Flows überspringen sie standardmäßig, weil einige Provider Refresh-Token
nach der Verwendung rotieren oder ungültig machen. Konfigurieren Sie für einen
Agenten ein separates OAuth-Login, wenn er ein unabhängiges Konto benötigt.

## Kompatibilität mit Anthropic-Legacy-Token

<Warning>
Die öffentlichen Claude Code-Dokumente von Anthropic sagen, dass die direkte Nutzung von Claude Code innerhalb
der Claude-Abonnementlimits bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude-
CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung von Claude CLI und
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuellen Anthropic-Dokumente zu Direct-Claude-Code-Plänen finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere Optionen im Abonnementstil in OpenClaw wünschen, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw stellt Anthropic-Setup-Token ebenfalls als unterstützten Token-Authentifizierungspfad bereit, bevorzugt jetzt aber die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Anthropic-Claude-CLI-Migration

OpenClaw unterstützt die Wiederverwendung von Anthropic Claude CLI wieder. Wenn Sie auf dem Host bereits ein lokales
Claude-Login haben, können Onboarding/Konfiguration es direkt wiederverwenden.

## OAuth-Austausch (wie die Anmeldung funktioniert)

Die interaktiven Login-Flows von OpenClaw sind in `@earendil-works/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Flow-Struktur:

1. Anthropic-Setup-Token starten oder Token aus OpenClaw einfügen
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Authentifizierungsprofil
3. die Modellauswahl bleibt auf `anthropic/...`
4. bestehende Anthropic-Authentifizierungsprofile bleiben für Rollback-/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Flow-Struktur (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` erzeugen
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht binden kann (oder Sie remote/headless arbeiten), die Redirect-URL/den Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Zugriffstoken extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Authentifizierungsauswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen `expires`-Zeitstempel.

Zur Laufzeit:

- wenn `expires` in der Zukunft liegt → das gespeicherte Zugriffstoken verwenden
- wenn abgelaufen → refreshen (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Hauptagenten liest, schreibt der Refresh
  zurück in den Speicher des Hauptagenten, statt das Refresh-Token in den
  Speicher des sekundären Agenten zu kopieren
- Ausnahme: Einige externe CLI-Anmeldedaten bleiben extern verwaltet; OpenClaw
  liest diese CLI-Authentifizierungsspeicher erneut, statt kopierte Refresh-Token zu verbrauchen.
  Das Codex-CLI-Bootstrap ist absichtlich enger gefasst: Es legt ein leeres
  Profil `openai-codex:default` an, danach halten OpenClaw-eigene Refreshes das lokale
  Profil kanonisch.

Der Refresh-Flow ist automatisch; in der Regel müssen Sie Token nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn Sie möchten, dass „persönlich“ und „Arbeit“ nie interagieren, verwenden Sie isolierte Agenten (separate Sitzungen + Anmeldedaten + Arbeitsbereich):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann die Authentifizierung pro Agent (Assistent) und leiten Sie Chats an den richtigen Agenten weiter.

### 2) Fortgeschritten: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

Wählen Sie, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs existieren:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumente:

- [Modell-Failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentifizierung](/de/gateway/authentication) - Überblick über die Modell-Provider-Authentifizierung
- [Geheimnisse](/de/gateway/secrets) - Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) - Authentifizierungskonfigurationsschlüssel
