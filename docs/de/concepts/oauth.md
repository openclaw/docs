---
read_when:
    - Sie möchten OpenClaw OAuth durchgängig verstehen
    - Sie haben Probleme mit der Token-Invalidierung bzw. Abmeldung.
    - Sie möchten Claude CLI- oder OAuth-Authentifizierungsabläufe
    - Sie möchten mehrere Konten oder Profil-Routing
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt „Subscription Auth“ über OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic gilt nun praktisch
die folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Subscription Auth innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Verwendung in externen Tools wie
OpenClaw unterstützt.

OpenClaw speichert sowohl die OpenAI-API-Schlüssel-Authentifizierung als auch ChatGPT/Codex OAuth unter der
kanonischen Provider-ID `openai`. Ältere `openai-codex:*`-Profil-IDs und
`auth.order.openai-codex`-Einträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird; verwenden Sie `openai:*`-Profil-IDs und `auth.order.openai` für
neue Konfigurationen.

Für Anthropic in Produktion ist die Authentifizierung per API-Schlüssel der sicherere empfohlene Weg.

Diese Seite erklärt:

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Token **gespeichert** werden (und warum)
- wie Sie **mehrere Konten** handhaben (Profile + sitzungsbezogene Overrides)

OpenClaw unterstützt außerdem **Provider-Plugins**, die eigene OAuth- oder API-Schlüssel-
Abläufe mitliefern. Führen Sie sie aus über:

```bash
openclaw models auth login --provider <id>
```

## Der Token-Sink (warum es ihn gibt)

OAuth-Provider stellen während Login-/Refresh-Abläufen häufig ein **neues Refresh-Token** aus. Manche Provider (oder OAuth-Clients) können ältere Refresh-Token ungültig machen, wenn für denselben Benutzer/dieselbe App ein neues ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines davon ist später zufällig „abgemeldet“

Um dies zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Sink**:

- die Runtime liest Anmeldedaten aus **einer Stelle**
- wir können mehrere Profile behalten und sie deterministisch routen
- die Wiederverwendung externer CLI ist Provider-spezifisch: Codex CLI kann ein leeres
  `openai:default`-Profil initialisieren, aber sobald OpenClaw ein lokales OAuth-Profil hat,
  ist das lokale Refresh-Token kanonisch. Wenn dieses lokale Refresh-Token abgelehnt wird,
  meldet OpenClaw das verwaltete Profil zur erneuten Authentifizierung, statt
  Codex CLI-Tokenmaterial als Fallback für eine gleichrangige Runtime zu verwenden. Andere Integrationen können
  extern verwaltet bleiben und ihren CLI-Auth-Speicher erneut lesen
- Status- und Startpfade, die die konfigurierte Provider-Menge bereits kennen, beschränken
  die externe CLI-Erkennung auf diese Menge, sodass ein nicht zugehöriger CLI-Login-Speicher bei einem Setup mit nur einem Provider nicht
  geprüft wird

## Speicherung (wo Token liegen)

Secrets werden in Agent-Auth-Speichern abgelegt:

- Auth-Profile (OAuth + API-Schlüssel + optionale wertbezogene Refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie entdeckt werden)

Nur für Legacy-Importe verwendete Datei (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

All dies berücksichtigt auch `$OPENCLAW_STATE_DIR` (Override für das Zustandsverzeichnis). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische Secret-Refs und das Aktivierungsverhalten von Runtime-Snapshots siehe [Secrets-Verwaltung](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Auth-Profil hat, verwendet OpenClaw Read-through-
Vererbung aus dem Standard-/Haupt-Agent-Speicher. Es klont beim Lesen nicht die
`auth-profiles.json` des Haupt-Agents. OAuth-Refresh-Token sind besonders
sensibel: Normale Kopierabläufe überspringen sie standardmäßig, weil manche Provider Refresh-Token nach der Verwendung rotieren
oder ungültig machen. Konfigurieren Sie für einen
Agent einen separaten OAuth-Login, wenn er ein unabhängiges Konto benötigt.

## Kompatibilität mit Anthropic-Legacy-Token

<Warning>
Die öffentlichen Claude Code-Dokumente von Anthropic sagen, dass die direkte Nutzung von Claude Code innerhalb
der Claude-Abonnementlimits bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die OpenClaw-artige Claude
CLI-Nutzung wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung der Claude CLI und
die Nutzung von `claude -p` für diese Integration als freigegeben, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuellen Plan-Dokumente von Anthropic für direkte Claude-Code-Nutzung finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie weitere abonnementartige Optionen in OpenClaw wünschen, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/zai).
</Warning>

OpenClaw stellt Anthropic-Setup-Token ebenfalls als unterstützten Token-Auth-Pfad bereit, bevorzugt nun aber die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Migration der Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung der Anthropic Claude CLI wieder. Wenn Sie bereits einen lokalen
Claude-Login auf dem Host haben, kann Onboarding/Konfiguration ihn direkt wiederverwenden.

## OAuth-Austausch (wie der Login funktioniert)

Die interaktiven Login-Abläufe von OpenClaw sind in `openclaw/plugin-sdk/llm` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Ablaufstruktur:

1. Anthropic-Setup-Token starten oder Token aus OpenClaw einfügen
2. OpenClaw speichert die resultierende Anthropic-Anmeldedaten in einem Auth-Profil
3. die Modellauswahl bleibt auf `anthropic/...`
4. vorhandene Anthropic-Auth-Profile bleiben für Rollback-/Reihenfolgekontrolle verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Der Login-Befehl verwendet weiterhin die kanonische OpenAI-Provider-ID:

```bash
openclaw models auth login --provider openai
```

Verwenden Sie `--profile-id openai:<name>` für mehrere ChatGPT/Codex-OAuth-Konten in
einem Agent. Verwenden Sie `openai-codex:<name>` nicht für neue Profile. Doctor migriert
dieses ältere Präfix zu einer kollisionsfreien `openai:*`-Profil-ID; führen Sie nach der Reparatur
`openclaw models auth list --provider openai` aus, bevor Sie
Profil-IDs in `auth.order` oder `/model ...@<profileId>` kopieren.

Ablaufstruktur (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` erzeugen
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht binden kann (oder Sie remote/headless arbeiten), Redirect-URL/Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai`.

## Refresh + Ablauf

Profile speichern einen `expires`-Zeitstempel.

Zur Runtime:

- wenn `expires` in der Zukunft liegt → gespeichertes Access-Token verwenden
- wenn abgelaufen → aktualisieren (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agents liest, schreibt Refresh
  zurück in den Haupt-Agent-Speicher, statt das Refresh-Token in
  den sekundären Agent-Speicher zu kopieren
- Ausnahme: Einige externe CLI-Anmeldedaten bleiben extern verwaltet; OpenClaw
  liest diese CLI-Auth-Speicher erneut, statt kopierte Refresh-Token zu verbrauchen.
  Der Codex-CLI-Bootstrap ist absichtlich enger gefasst: Er kann ein leeres
  `openai:default` oder explizit angefordertes OpenAI-Profil nur anlegen, bevor OpenClaw
  OAuth für den Provider besitzt. Danach halten OpenClaw-eigene Refreshes lokale
  Profile kanonisch, und die Erkennung fügt Codex-CLI-Auth in keinem gleichrangigen
  Slot hinzu. Wenn ein verwalteter Refresh fehlschlägt, meldet OpenClaw das betroffene Profil zur
  erneuten Authentifizierung, statt externes CLI-Tokenmaterial zurückzugeben.

Der Refresh-Ablauf ist automatisch; Sie müssen Token im Allgemeinen nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: getrennte Agents

Wenn Sie möchten, dass „privat“ und „Arbeit“ nie interagieren, verwenden Sie isolierte Agents (separate Sitzungen + Anmeldedaten + Arbeitsbereich):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann Auth pro Agent (Assistent) und routen Sie Chats zum richtigen Agent.

### 2) Fortgeschritten: mehrere Profile in einem Agent

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

Wählen Sie aus, welches Profil verwendet wird:

- global über Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungs-Override):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs existieren:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentifizierung](/de/gateway/authentication) - Übersicht über Authentifizierung bei Modell-Providern
- [Secrets](/de/gateway/secrets) - Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) - Auth-Konfigurationsschlüssel
