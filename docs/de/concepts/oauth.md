---
read_when:
    - Sie möchten OpenClaw OAuth durchgängig verstehen
    - Es treten Probleme mit der Token-Ungültigmachung bzw. Abmeldung auf
    - Sie möchten Claude-CLI- oder OAuth-Authentifizierungsabläufe verwenden
    - Sie möchten mehrere Konten oder eine profilbasierte Weiterleitung verwenden
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T01:36:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt OAuth („Abonnementauthentifizierung“) für Provider, die dies anbieten,
insbesondere **OpenAI Codex (ChatGPT OAuth)** und die **Wiederverwendung der Anthropic Claude CLI**.
Für Anthropic gilt in der Praxis folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Abrechnung über die Anthropic-API.
- **Anthropic Claude CLI / Abonnementauthentifizierung innerhalb von OpenClaw**: Mitarbeitende von Anthropic
  haben uns mitgeteilt, dass diese Nutzung wieder zulässig ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und
  die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
  keine neue Richtlinie veröffentlicht. Für Anthropic in Produktionsumgebungen bleibt
  die Authentifizierung per API-Schlüssel der sicherere empfohlene Weg.

OpenClaw speichert sowohl die Authentifizierung per OpenAI-API-Schlüssel als auch ChatGPT/Codex OAuth unter der
kanonischen Provider-ID `openai`. Ältere Profil-IDs mit `openai-codex:*` und
Einträge unter `auth.order.openai-codex` sind Altzustände, die durch
`openclaw doctor --fix` repariert werden. Verwenden Sie für neue Konfigurationen
Profil-IDs mit `openai:*` und `auth.order.openai`.

Diese Seite behandelt:

- wie der OAuth-**Tokenaustausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie Sie **mehrere Konten** verwalten (Profile und sitzungsspezifische Überschreibungen)

Provider-Plugins, die einen eigenen OAuth- oder API-Schlüssel-Ablauf bereitstellen, verwenden
denselben Einstiegspunkt:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen häufig bei jeder Anmeldung oder Aktualisierung ein neues Aktualisierungs-Token aus.
Einige Provider machen das vorherige Aktualisierungs-Token ungültig, wenn für denselben
Benutzer und dieselbe Anwendung ein neues ausgegeben wird. Praktisches Symptom: Sie melden sich über OpenClaw _und_
über Claude Code / Codex CLI an, woraufhin eines davon später scheinbar zufällig abgemeldet wird.

Um dies zu vermeiden, behandelt OpenClaw den Speicher für Authentifizierungsprofile als **Token-Senke**:

- Die Laufzeit liest die Zugangsdaten pro Agent aus einer einzigen Quelle.
- Mehrere Profile können nebeneinander bestehen und deterministisch weitergeleitet werden.
- Die Wiederverwendung externer CLIs ist Provider-spezifisch: Sobald OpenClaw ein lokales OAuth-
  Profil für einen Provider verwaltet, ist das lokale Aktualisierungs-Token maßgeblich. Wird dieses lokale
  Aktualisierungs-Token abgelehnt, meldet OpenClaw das Profil zur
  erneuten Authentifizierung, statt auf Tokenmaterial einer externen CLI zurückzugreifen.
  Die Initialisierung über die Codex CLI ist noch stärker eingeschränkt: Sie kann nur ein leeres Profil
  im Stil von `openai:default` befüllen, bevor OpenClaw OAuth für diesen
  Provider verwaltet. Danach bleiben die von OpenClaw verwalteten Aktualisierungen maßgeblich.
- Status- und Startpfade beschränken die Erkennung externer CLIs auf die bereits
  konfigurierte Provider-Menge. Daher wird bei einer Einrichtung mit nur einem Provider
  nicht der Anmeldespeicher einer nicht zugehörigen CLI geprüft.

## Speicherung (wo Tokens abgelegt werden)

Geheimnisse werden pro Agent unter dem logischen Namen `auth-profiles.json` gespeichert (der
zugrunde liegende Speicher ist die SQLite-Datenbank des Agent; der JSON-Name bleibt aus
Kompatibilitätsgründen und für die Anzeige in Werkzeugen erhalten):

- Authentifizierungsprofile (OAuth, API-Schlüssel und optionale Referenzen auf Wertebene):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Alte Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bei der Erkennung entfernt)

Alte Datei ausschließlich für den Import (wird weiterhin unterstützt, ist aber nicht der primäre Speicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den Speicher für Authentifizierungsprofile importiert)

Alle oben genannten Pfade berücksichtigen außerdem `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration-reference#auth-storage](/de/gateway/configuration-reference#auth-storage)

Informationen zu statischen Geheimnisreferenzen und zum Aktivierungsverhalten von Laufzeit-Snapshots finden Sie unter [Geheimnisverwaltung](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Authentifizierungsprofil besitzt, verwendet OpenClaw eine durchgereichte
Vererbung aus dem Speicher des Standard-/Haupt-Agent; der Speicher des Haupt-Agent
wird beim Lesen nicht kopiert. OAuth-Aktualisierungs-Tokens sind besonders sensibel: Normale
Kopiervorgänge lassen sie standardmäßig aus, da manche Provider Aktualisierungs-Tokens nach der
Verwendung rotieren oder ungültig machen. Konfigurieren Sie für einen Agent eine separate OAuth-Anmeldung, wenn
er ein unabhängiges Konto benötigt.

## Wiederverwendung der Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung der Anthropic Claude CLI und `claude -p` als genehmigten
Authentifizierungsweg. Wenn auf dem Host bereits eine lokale Claude-Anmeldung vorhanden ist,
kann sie beim Onboarding oder bei der Konfiguration direkt wiederverwendet werden. Das Anthropic-Einrichtungs-Token bleibt
als unterstützter Weg zur Tokenauthentifizierung verfügbar, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI,
wenn sie verfügbar ist.

<Warning>
In der öffentlichen Dokumentation von Anthropic zu Claude Code steht, dass die direkte Verwendung von Claude Code innerhalb
der Limits eines Claude-Abonnements bleibt. Mitarbeitende von Anthropic haben uns außerdem mitgeteilt, dass die Nutzung der Claude
CLI im Stil von OpenClaw wieder zulässig ist. OpenClaw behandelt daher die Wiederverwendung der Claude CLI und
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuellen Tarifdokumentationen von Anthropic zur direkten Verwendung von Claude Code finden Sie unter [Claude Code
mit Ihrem Pro- oder Max-
Tarif verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Claude Code mit Ihrem Team- oder Enterprise-
Tarif verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie weitere abonnementbasierte Optionen in OpenClaw verwenden möchten, lesen Sie [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax)
und [Z.AI / GLM Coding Plan](/de/providers/zai).
</Warning>

## OAuth-Austausch (wie die Anmeldung funktioniert)

Die interaktiven Anmeldeabläufe von OpenClaw sind in `openclaw/plugin-sdk/llm.ts` implementiert und in die Assistenten und Befehle eingebunden.

### Anthropic-Einrichtungs-Token

Ablauf:

1. Starten Sie das Anthropic-Einrichtungs-Token oder fügen Sie ein Token in OpenClaw ein.
2. OpenClaw speichert die resultierenden Anthropic-Zugangsdaten in einem Authentifizierungsprofil.
3. Die Modellauswahl bleibt bei `anthropic/...`.
4. Vorhandene Anthropic-Authentifizierungsprofile bleiben für Rollbacks und die Steuerung der Reihenfolge verfügbar.

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Arbeitsabläufen.

Der Anmeldebefehl verwendet die kanonische OpenAI-Provider-ID:

```bash
openclaw models auth login --provider openai
```

Verwenden Sie `--profile-id openai:<name>` für mehrere ChatGPT/Codex-OAuth-Konten innerhalb
eines Agent. Verwenden Sie für neue Profile nicht `openai-codex:<name>`. Doctor migriert
dieses ältere Präfix zu einer kollisionsfreien Profil-ID mit `openai:*`. Führen Sie nach der Reparatur
`openclaw models auth list --provider openai` aus, bevor Sie Profil-IDs
in `auth.order` oder `/model ...@<profileId>` kopieren.

Ablauf (PKCE):

1. Generieren Sie einen PKCE-Verifizierer/eine PKCE-Challenge und einen zufälligen `state`.
2. Öffnen Sie `https://auth.openai.com/oauth/authorize?...` (Geltungsbereich
   `openid profile email offline_access`).
3. Versuchen Sie, den Callback unter `http://localhost:1455/auth/callback` zu erfassen (der
   Callback-Host ist standardmäßig `localhost` und akzeptiert nur local loopback-Hosts;
   mit `OPENCLAW_OAUTH_CALLBACK_HOST` überschreibbar).
4. Wenn Sie einen Code einfügen können, bevor der Callback eintrifft (oder Sie
   remote bzw. ohne grafische Oberfläche arbeiten und der Callback nicht gebunden werden kann), fügen Sie stattdessen
   die Weiterleitungs-URL oder den Code ein. Das manuelle Einfügen konkurriert mit dem Browser-Callback;
   der zuerst abgeschlossene Vorgang gewinnt.
5. Tauschen Sie den Code unter `https://auth.openai.com/oauth/token` aus.
6. Extrahieren Sie `accountId` aus dem Zugriffs-Token und speichern Sie `{ access, refresh, expires, accountId }`.

Der Pfad im Assistenten lautet `openclaw onboard` → Authentifizierungsauswahl `openai`.

## Aktualisierung und Ablauf

Profile speichern einen `expires`-Zeitstempel. Zur Laufzeit gilt:

- Wenn `expires` in der Zukunft liegt, wird das gespeicherte Zugriffs-Token verwendet.
- Wenn es abgelaufen ist, wird es aktualisiert (unter einer Dateisperre), und die gespeicherten Zugangsdaten werden überschrieben.
- Wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agent liest,
  schreibt die Aktualisierung in den Speicher des Haupt-Agent zurück, statt das Aktualisierungs-
  Token in den Speicher des sekundären Agent zu kopieren.
- Extern verwaltete CLI-Zugangsdaten (Claude CLI, eingeschränkte Initialisierung über die Codex CLI;
  siehe [Die Token-Senke](#the-token-sink-why-it-exists)) werden erneut gelesen, statt
  ein kopiertes Aktualisierungs-Token zu verbrauchen. Wenn eine verwaltete Aktualisierung fehlschlägt, meldet OpenClaw
  das betroffene Profil zur erneuten Authentifizierung, statt
  Tokenmaterial einer externen CLI zurückzugeben.

Der Aktualisierungsablauf erfolgt automatisch; normalerweise müssen Sie Tokens nicht manuell verwalten.

## Mehrere Konten (Profile) und Weiterleitung

Zwei Muster:

### 1) Bevorzugt: getrennte Agents

Wenn „privat“ und „beruflich“ niemals miteinander interagieren sollen, verwenden Sie isolierte Agents (getrennte Sitzungen, Zugangsdaten und Arbeitsbereiche):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie anschließend die Authentifizierung pro Agent im Assistenten und leiten Sie Chats an den richtigen Agent weiter.

### 2) Fortgeschritten: mehrere Profile in einem Agent

Der Speicher für Authentifizierungsprofile unterstützt mehrere Profil-IDs für denselben Provider.
Wählen Sie aus, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

Listen Sie vorhandene Profil-IDs mit folgendem Befehl auf:

```bash
openclaw models auth list --provider <id>
```

Zugehörige Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Regeln für Rotation und Abkühlzeiten)
- [Schrägstrichbefehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) – Übersicht zur Authentifizierung bei Modell-Providern
- [Geheimnisse](/de/gateway/secrets) – Speicherung von Zugangsdaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) – Konfigurationsschlüssel für die Authentifizierung
