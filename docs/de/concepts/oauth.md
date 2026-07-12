---
read_when:
    - Sie möchten OpenClaw OAuth durchgängig verstehen
    - Es treten Probleme mit Token-Invalidierung / Abmeldung auf
    - Sie möchten Claude-CLI- oder OAuth-Authentifizierungsabläufe
    - Sie möchten mehrere Konten oder eine profilbasierte Weiterleitung verwenden
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T15:16:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt OAuth („Abonnement-Authentifizierung“) für Provider, die dies anbieten,
insbesondere **OpenAI Codex (ChatGPT OAuth)** und die **Wiederverwendung der Anthropic Claude CLI**.
Für Anthropic gilt praktisch folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Abrechnung über die Anthropic-API.
- **Anthropic Claude CLI / Abonnement-Authentifizierung innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder zulässig ist. Daher behandelt OpenClaw die Wiederverwendung
  der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
  keine neue Richtlinie veröffentlicht. Für Anthropic in Produktionsumgebungen bleibt die Authentifizierung
  per API-Schlüssel der sicherere empfohlene Weg.

OpenClaw speichert sowohl die OpenAI-Authentifizierung per API-Schlüssel als auch ChatGPT/Codex OAuth unter der
kanonischen Provider-ID `openai`. Ältere Profil-IDs vom Typ `openai-codex:*` und
Einträge unter `auth.order.openai-codex` sind Legacy-Zustände, die durch
`openclaw doctor --fix` repariert werden; verwenden Sie für neue Konfigurationen
Profil-IDs vom Typ `openai:*` und `auth.order.openai`.

Diese Seite behandelt:

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Token **gespeichert** werden (und warum)
- wie Sie mit **mehreren Konten** umgehen (Profile + sitzungsspezifische Überschreibungen)

Provider-Plugins, die einen eigenen OAuth- oder API-Schlüssel-Ablauf bereitstellen, werden über denselben
Einstiegspunkt ausgeführt:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen üblicherweise bei jeder Anmeldung/Aktualisierung ein neues Aktualisierungs-Token aus.
Einige Provider machen das vorherige Aktualisierungs-Token ungültig, wenn für denselben Benutzer/dieselbe App
ein neues ausgestellt wird. Praktisches Symptom: Sie melden sich über OpenClaw _und_
über Claude Code / Codex CLI an, und eines davon wird später scheinbar zufällig abgemeldet.

Um dies zu reduzieren, behandelt OpenClaw den Speicher für Authentifizierungsprofile als **Token-Senke**:

- Die Laufzeit liest die Anmeldedaten pro Agent aus genau einer Quelle.
- Mehrere Profile können nebeneinander bestehen und deterministisch weitergeleitet werden.
- Die Wiederverwendung externer CLIs ist providerspezifisch: Sobald OpenClaw ein lokales OAuth-Profil
  für einen Provider besitzt, ist das lokale Aktualisierungs-Token kanonisch. Wird dieses lokale
  Aktualisierungs-Token abgelehnt, meldet OpenClaw das Profil zur erneuten
  Authentifizierung, statt auf Token-Material einer externen CLI zurückzugreifen.
  Der Bootstrap über die Codex CLI ist noch stärker eingeschränkt: Er kann nur ein leeres Profil
  im Stil von `openai:default` initial befüllen, bevor OpenClaw OAuth für diesen
  Provider verwaltet; danach bleiben von OpenClaw durchgeführte Aktualisierungen kanonisch.
- Status- und Startpfade beschränken die Erkennung externer CLIs auf die bereits
  konfigurierte Provider-Menge, sodass bei einer Einrichtung mit nur einem Provider
  nicht der Anmeldespeicher einer nicht zugehörigen CLI geprüft wird.

## Speicherung (wo Token abgelegt werden)

Geheimnisse werden pro Agent unter dem logischen Namen `auth-profiles.json` gespeichert (der
zugrunde liegende Speicher ist die SQLite-Datenbank des Agents; der JSON-Name wird aus
Kompatibilitätsgründen und für die Anzeige in Werkzeugen beibehalten):

- Authentifizierungsprofile (OAuth + API-Schlüssel + optionale Referenzen auf Wertebene):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bei ihrer Erkennung entfernt)

Legacy-Datei ausschließlich für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den Speicher für Authentifizierungsprofile importiert)

Alle oben genannten Pfade berücksichtigen auch `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration-reference#auth-storage](/de/gateway/configuration-reference#auth-storage)

Informationen zu statischen Geheimnisreferenzen und zum Aktivierungsverhalten von Laufzeit-Snapshots finden Sie unter [Verwaltung von Geheimnissen](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Authentifizierungsprofil besitzt, verwendet OpenClaw die durchgereichte
Vererbung aus dem Speicher des Standard-/Haupt-Agents; beim Lesen wird der Speicher des Haupt-Agents
nicht geklont. OAuth-Aktualisierungs-Token sind besonders sensibel: Normale
Kopiervorgänge überspringen sie standardmäßig, da manche Provider Aktualisierungs-Token nach der
Verwendung rotieren oder ungültig machen. Konfigurieren Sie für einen Agent eine separate OAuth-Anmeldung,
wenn er ein unabhängiges Konto benötigt.

## Wiederverwendung der Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung der Anthropic Claude CLI und `claude -p` als genehmigten
Authentifizierungsweg. Wenn auf dem Host bereits eine lokale Claude-Anmeldung vorhanden ist,
kann sie beim Onboarding bzw. bei der Konfiguration direkt wiederverwendet werden. Das Anthropic-Setup-Token bleibt
als unterstützter Token-Authentifizierungsweg verfügbar, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI,
wenn diese verfügbar ist.

<Warning>
In der öffentlichen Dokumentation von Anthropic zu Claude Code steht, dass die direkte Nutzung von Claude Code innerhalb
der Limits eines Claude-Abonnements bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung der Claude
CLI nach Art von OpenClaw wieder zulässig ist. OpenClaw behandelt daher die Wiederverwendung der Claude CLI und
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuelle Dokumentation von Anthropic zu Plänen für die direkte Nutzung von Claude Code finden Sie unter [Claude Code
mit Ihrem Pro- oder Max-
Plan verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Claude Code mit Ihrem Team- oder Enterprise-
Plan verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Weitere abonnementbasierte Optionen in OpenClaw finden Sie unter [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax)
und [Z.AI / GLM Coding Plan](/de/providers/zai).
</Warning>

## OAuth-Austausch (wie die Anmeldung funktioniert)

Die interaktiven Anmeldeabläufe von OpenClaw sind in `openclaw/plugin-sdk/llm.ts` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Ablauf:

1. Starten Sie in OpenClaw das Anthropic-Setup-Token oder das Einfügen eines Tokens.
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Authentifizierungsprofil.
3. Die Modellauswahl bleibt bei `anthropic/...`.
4. Vorhandene Anthropic-Authentifizierungsprofile bleiben für Rollback und Reihenfolgensteuerung verfügbar.

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Der Anmeldebefehl verwendet die kanonische OpenAI-Provider-ID:

```bash
openclaw models auth login --provider openai
```

Verwenden Sie `--profile-id openai:<name>` für mehrere ChatGPT/Codex-OAuth-Konten in
einem Agent. Verwenden Sie für neue Profile nicht `openai-codex:<name>`. Doctor migriert
dieses ältere Präfix zu einer kollisionsfreien Profil-ID vom Typ `openai:*`; führen Sie nach der
Reparatur `openclaw models auth list --provider openai` aus, bevor Sie
Profil-IDs in `auth.order` oder `/model ...@<profileId>` übernehmen.

Ablauf (PKCE):

1. Erzeugen Sie einen PKCE-Verifizierer/eine PKCE-Challenge und einen zufälligen `state`.
2. Öffnen Sie `https://auth.openai.com/oauth/authorize?...` (Geltungsbereich
   `openid profile email offline_access`).
3. Versuchen Sie, den Callback unter `http://localhost:1455/auth/callback` zu erfassen (der
   Callback-Host ist standardmäßig `localhost` und akzeptiert nur Loopback-Hosts;
   überschreiben Sie ihn mit `OPENCLAW_OAUTH_CALLBACK_HOST`).
4. Wenn Sie einen Code einfügen können, bevor der Callback eintrifft (oder wenn Sie
   remote/headless arbeiten und der Callback keine Bindung herstellen kann), fügen Sie stattdessen die Weiterleitungs-URL/den Code
   ein – das manuelle Einfügen konkurriert mit dem Browser-Callback, und der zuerst abgeschlossene
   Vorgang gewinnt.
5. Tauschen Sie den Code unter `https://auth.openai.com/oauth/token` aus.
6. Extrahieren Sie `accountId` aus dem Zugriffs-Token und speichern Sie `{ access, refresh, expires, accountId }`.

Der Pfad im Assistenten lautet `openclaw onboard` → Authentifizierungsauswahl `openai`.

## Aktualisierung + Ablauf

Profile speichern einen `expires`-Zeitstempel. Zur Laufzeit:

- Wenn `expires` in der Zukunft liegt, wird das gespeicherte Zugriffs-Token verwendet.
- Wenn es abgelaufen ist, wird es aktualisiert (unter einer Dateisperre), und die gespeicherten Anmeldedaten werden überschrieben.
- Wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agents liest, schreibt die
  Aktualisierung zurück in den Speicher des Haupt-Agents, statt das Aktualisierungs-
  Token in den Speicher des sekundären Agents zu kopieren.
- Extern verwaltete CLI-Anmeldedaten (Claude CLI, eingeschränkter Bootstrap der Codex CLI;
  siehe [Die Token-Senke](#the-token-sink-why-it-exists)) werden erneut gelesen, statt
  ein kopiertes Aktualisierungs-Token zu verbrauchen. Wenn eine verwaltete Aktualisierung fehlschlägt, meldet OpenClaw
  das betroffene Profil zur erneuten Authentifizierung, statt
  Token-Material der externen CLI zurückzugeben.

Der Aktualisierungsablauf erfolgt automatisch; in der Regel müssen Sie Token nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: getrennte Agents

Wenn Sie möchten, dass „privat“ und „geschäftlich“ niemals miteinander interagieren, verwenden Sie isolierte Agents (getrennte Sitzungen + Anmeldedaten + Arbeitsbereich):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie anschließend die Authentifizierung pro Agent (Assistent) und leiten Sie Chats an den richtigen Agent weiter.

### 2) Fortgeschritten: mehrere Profile in einem Agent

Der Speicher für Authentifizierungsprofile unterstützt mehrere Profil-IDs für denselben Provider.
Wählen Sie aus, welche verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

Listen Sie vorhandene Profil-IDs auf mit:

```bash
openclaw models auth list --provider <id>
```

Zugehörige Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Regeln für Rotation + Abkühlzeit)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) – Übersicht über die Authentifizierung bei Modell-Providern
- [Geheimnisse](/de/gateway/secrets) – Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) – Authentifizierungskonfigurationsschlüssel
