---
read_when:
    - Sie möchten OpenClaw OAuth Ende-zu-Ende verstehen
    - Sie stoßen auf Probleme mit Token-Invalidierung oder Abmeldung
    - Sie möchten Auth-Flows für Claude CLI oder OAuth
    - Sie möchten mehrere Konten oder Profil-Routing
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-04-06T03:07:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 402e20dfeb6ae87a90cba5824a56a7ba3b964f3716508ea5cc48a47e5affdd73
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw unterstützt „subscription auth“ über OAuth für Anbieter, die dies
anbieten (insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic ist
die praktische Aufteilung jetzt:

- **Anthropic API key**: normale Anthropic-API-Abrechnung
- **Anthropic subscription auth innerhalb von OpenClaw**: Anthropic hat
  OpenClaw-Nutzer am **4. April 2026 um 12:00 PM PT / 8:00 PM BST** darüber
  informiert, dass dies jetzt **Extra Usage** erfordert

OpenAI Codex OAuth wird ausdrücklich für die Verwendung in externen Tools wie
OpenClaw unterstützt. Auf dieser Seite wird Folgendes erklärt:

Für Anthropic im Produktiveinsatz ist Auth per API key der sicherere,
empfohlene Weg.

- wie der OAuth-**Tokenaustausch** funktioniert (PKCE)
- wo Token **gespeichert** werden (und warum)
- wie mit **mehreren Konten** umzugehen ist (Profile + sitzungsspezifische Overrides)

OpenClaw unterstützt außerdem **Anbieter-Plugins**, die ihre eigenen OAuth-
oder API-key-Flows mitbringen. Führen Sie sie aus mit:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Anbieter prägen bei Login-/Refresh-Flows häufig einen **neuen Refresh-Token**. Manche Anbieter (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn ein neuer für denselben Benutzer/dieselbe App ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines von beiden wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Laufzeit liest Anmeldedaten aus **einem Ort**
- wir können mehrere Profile behalten und sie deterministisch routen
- wenn Anmeldedaten aus einer externen CLI wie Codex CLI wiederverwendet werden, spiegelt OpenClaw
  sie mit Provenienz und liest diese externe Quelle erneut, anstatt
  den Refresh-Token selbst zu rotieren

## Speicherung (wo Token gespeichert werden)

Geheimnisse werden **pro Agent** gespeichert:

- Auth-Profile (OAuth + API keys + optionale Ref-Werte auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bereinigt, wenn sie entdeckt werden)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alles oben Genannte berücksichtigt auch `$OPENCLAW_STATE_DIR` (Override für das State-Verzeichnis). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische SecretRef-Werte und das Aktivierungsverhalten von Laufzeit-Snapshots siehe [Secrets Management](/de/gateway/secrets).

## Anthropic-Legacy-Token-Kompatibilität

<Warning>
Anthropics öffentliche Claude-Code-Dokumentation besagt, dass die direkte
Verwendung von Claude Code innerhalb der Claude-Abonnementgrenzen bleibt.
Separat dazu hat Anthropic OpenClaw-Nutzern am
**4. April 2026 um 12:00 PM PT / 8:00 PM BST** mitgeteilt, dass OpenClaw als
**Third-Party-Harness** zählt. Bestehende Anthropic-Token-Profile bleiben in
OpenClaw technisch nutzbar, aber Anthropic sagt, dass der OpenClaw-Pfad jetzt
für diesen Traffic **Extra Usage** erfordert (**pay-as-you-go**, getrennt vom
Abonnement abgerechnet).

Die aktuellen Anthropic-Dokumente zum direkten Claude-Code-Plan finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere abonnementähnliche Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax)
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw stellt jetzt Anthropic setup-token erneut als Legacy-/manuellen Pfad bereit.
Der Anthropic-Hinweis zur OpenClaw-spezifischen Abrechnung gilt weiterhin für
diesen Pfad. Verwenden Sie ihn also in der Erwartung, dass Anthropic für
Claude-Login-Traffic über OpenClaw **Extra Usage** verlangt.

## Anthropic-Claude-CLI-Migration

Anthropic hat in OpenClaw keinen unterstützten lokalen Migrationspfad für Claude CLI mehr.
Verwenden Sie Anthropic API keys für Anthropic-Traffic oder behalten Sie
Legacy-auth auf Token-Basis nur dort bei, wo sie bereits konfiguriert ist, und
mit der Erwartung, dass Anthropic diesen OpenClaw-Pfad als **Extra Usage**
behandelt.

## OAuth-Austausch (wie der Login funktioniert)

Die interaktiven Login-Flows von OpenClaw sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic setup-token

Ablauf:

1. Starten Sie Anthropic setup-token oder paste-token aus OpenClaw
2. OpenClaw speichert die resultierende Anthropic-Anmeldedaten in einem Auth-Profil
3. die Modellauswahl bleibt bei `anthropic/...`
4. bestehende Anthropic-Auth-Profile bleiben für Rollback/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Ablauf (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` generieren
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` abzufangen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless arbeiten), die Redirect-URL bzw. den Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen Zeitstempel `expires`.

Zur Laufzeit gilt:

- wenn `expires` in der Zukunft liegt → den gespeicherten Access-Token verwenden
- wenn abgelaufen → aktualisieren (unter einem Dateilock) und die gespeicherten Anmeldedaten überschreiben
- Ausnahme: wiederverwendete Anmeldedaten aus externer CLI bleiben extern verwaltet; OpenClaw
  liest den Auth-Speicher der CLI erneut und verwendet den kopierten Refresh-Token selbst nie

Der Refresh-Flow ist automatisch; normalerweise müssen Sie Token nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn „privat“ und „Arbeit“ nie miteinander interagieren sollen, verwenden Sie isolierte Agenten (separate Sitzungen + Anmeldedaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann Auth pro Agent (Assistent) und routen Sie Chats an den richtigen Agenten.

### 2) Fortgeschritten: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Anbieter.

So wählen Sie aus, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungs-Override):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs existieren:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [/concepts/model-failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [/tools/slash-commands](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentication](/de/gateway/authentication) — Überblick über die Authentifizierung von Modellanbietern
- [Secrets](/de/gateway/secrets) — Speicherung von Anmeldedaten und SecretRef
- [Configuration Reference](/de/gateway/configuration-reference#auth-storage) — Auth-Konfigurationsschlüssel
