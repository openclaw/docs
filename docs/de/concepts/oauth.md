---
read_when:
    - Sie möchten OpenClaw OAuth durchgängig verstehen
    - Es treten Probleme mit der Token-Ungültigmachung oder Abmeldung auf
    - Sie möchten Claude CLI oder OAuth-Authentifizierungsabläufe
    - Sie möchten mehrere Konten oder ein profilbasiertes Routing verwenden
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-07-24T05:00:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw unterstützt OAuth („Abonnement-Authentifizierung“) für Provider, die dies anbieten,
insbesondere **OpenAI Codex (ChatGPT OAuth)** und die **Wiederverwendung der Anthropic Claude CLI**.
Für Anthropic gilt praktisch folgende Aufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung.
- **Anthropic Claude CLI / Abonnement-Authentifizierung innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder zulässig ist. Daher betrachtet OpenClaw die Wiederverwendung der Claude CLI und
  die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
  keine neue Richtlinie veröffentlicht. Für Anthropic im Produktivbetrieb bleibt die
  Authentifizierung per API-Schlüssel der sicherere empfohlene Weg.

OpenClaw speichert sowohl die OpenAI-Authentifizierung per API-Schlüssel als auch ChatGPT/Codex OAuth unter der
kanonischen Provider-ID `openai`. Ältere `openai-codex:*`-Profil-IDs und
`auth.order.openai-codex`-Einträge sind Legacy-Zustände, die durch
`openclaw doctor --fix` repariert werden; verwenden Sie für
neue Konfigurationen `openai:*`-Profil-IDs und `auth.order.openai`.

Diese Seite behandelt:

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Token **gespeichert** werden (und warum)
- wie **mehrere Konten** verwaltet werden (Profile + sitzungsbezogene Überschreibungen)

Provider-Plugins, die einen eigenen OAuth- oder API-Schlüssel-Ablauf bereitstellen, verwenden denselben
Einstiegspunkt:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Provider stellen häufig bei jeder Anmeldung/Aktualisierung ein neues Aktualisierungs-Token aus.
Einige Provider machen das vorherige Aktualisierungs-Token ungültig, wenn für denselben
Benutzer/dieselbe App ein neues ausgestellt wird. Praktisches Symptom: Sie melden sich über OpenClaw _und_
über Claude Code / Codex CLI an, und eine der Anwendungen wird später scheinbar zufällig abgemeldet.

Um dies zu reduzieren, behandelt OpenClaw den Speicher für Authentifizierungsprofile als **Token-Senke**:

- die Laufzeit liest Anmeldedaten pro Agent aus einer einzigen Quelle
- mehrere Profile können nebeneinander bestehen und deterministisch weitergeleitet werden
- die Wiederverwendung externer CLIs ist Provider-spezifisch: Sobald OpenClaw ein lokales OAuth-
  Profil für einen Provider besitzt, ist das lokale Aktualisierungs-Token maßgeblich. Wird dieses lokale
  Aktualisierungs-Token abgelehnt, meldet OpenClaw das Profil zur
  erneuten Authentifizierung, statt auf Token-Material einer externen CLI zurückzugreifen.
  Das Bootstrapping über die Codex CLI ist noch stärker eingeschränkt: Es kann nur ein leeres Profil
  im Stil von `openai:default` initialisieren, bevor OpenClaw OAuth für diesen
  Provider besitzt; danach bleiben von OpenClaw durchgeführte Aktualisierungen maßgeblich
- Status-/Startpfade beschränken die Erkennung externer CLIs auf die bereits
  konfigurierte Provider-Menge, sodass bei einer Konfiguration mit nur einem Provider
  nicht der Anmeldespeicher einer nicht zugehörigen CLI geprüft wird

## Speicherung (wo Token gespeichert werden)

Geheimnisse werden pro Agent unter dem logischen Namen `auth-profiles.json` gespeichert (der
zugrunde liegende Speicher ist die SQLite-Datenbank des Agents; der JSON-Name wird aus
Kompatibilitätsgründen und für die Anzeige in Werkzeugen beibehalten):

- Authentifizierungsprofile (OAuth + API-Schlüssel + optionale Verweise auf Wertebene):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bei ihrer Erkennung entfernt)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der primäre Speicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den Speicher für Authentifizierungsprofile importiert)

Alle oben genannten Pfade berücksichtigen auch `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration-reference#auth-storage](/de/gateway/configuration-reference#auth-storage)

Informationen zu statischen Geheimnisverweisen und zum Aktivierungsverhalten von Laufzeit-Snapshots finden Sie unter [Verwaltung von Geheimnissen](/de/gateway/secrets).

Wenn ein sekundärer Agent kein lokales Authentifizierungsprofil besitzt, verwendet OpenClaw eine durchgereichte
Vererbung aus dem Speicher des Standard-/Haupt-Agents; beim Lesen wird der Speicher des Haupt-Agents nicht
geklont. OAuth-Aktualisierungs-Token sind besonders sensibel: Normale
Kopiervorgänge überspringen sie standardmäßig, da einige Provider Aktualisierungs-Token nach der Verwendung
rotieren oder ungültig machen. Konfigurieren Sie eine separate OAuth-Anmeldung für einen Agent, wenn
dieser ein unabhängiges Konto benötigt.

## Wiederverwendung der Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung der Anthropic Claude CLI und `claude -p` als genehmigten
Authentifizierungsweg. Wenn auf dem Host bereits eine lokale Claude-Anmeldung vorhanden ist,
kann diese beim Onboarding bzw. bei der Konfiguration direkt wiederverwendet werden. Das Anthropic-Einrichtungs-Token bleibt
als unterstützter Weg für die Token-Authentifizierung verfügbar, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI,
wenn diese verfügbar ist.

<Warning>
In den öffentlichen Claude-Code-Dokumenten von Anthropic steht, dass die direkte Nutzung von Claude Code innerhalb
der Limits des Claude-Abonnements bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung der Claude
CLI nach Art von OpenClaw wieder zulässig ist. Daher betrachtet OpenClaw die Wiederverwendung der Claude CLI und
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuellen Anthropic-Dokumente zu Tarifen für die direkte Nutzung von Claude Code finden Sie unter [Claude Code
mit Ihrem Pro- oder Max-
Tarif verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Claude Code mit Ihrem Team- oder Enterprise-
Tarif verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Weitere abonnementbasierte Optionen in OpenClaw finden Sie unter [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax)
und [Z.AI / GLM Coding Plan](/de/providers/zai).
</Warning>

## OAuth-Austausch (wie die Anmeldung funktioniert)

Die interaktiven Anmeldeabläufe von OpenClaw sind in `openclaw/plugin-sdk/llm.ts` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Einrichtungs-Token

Ablauf:

1. erstellen Sie das Token, indem Sie `claude setup-token` auf einem beliebigen Computer mit Claude Code ausführen, und starten Sie anschließend die Anthropic-Einrichtung per Token oder fügen Sie das Token in OpenClaw ein
2. OpenClaw speichert die resultierenden Anthropic-Anmeldedaten in einem Authentifizierungsprofil
3. die Modellauswahl bleibt auf `anthropic/...`
4. vorhandene Anthropic-Authentifizierungsprofile bleiben für Rollbacks bzw. zur Steuerung der Reihenfolge verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Verwendung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Arbeitsabläufen.

Der Anmeldebefehl verwendet die kanonische OpenAI-Provider-ID:

```bash
openclaw models auth login --provider openai
```

Verwenden Sie `--profile-id openai:<name>` für mehrere ChatGPT/Codex-OAuth-Konten in
einem Agent. Verwenden Sie `openai-codex:<name>` nicht für neue Profile. Doctor migriert
dieses ältere Präfix zu einer kollisionsfreien `openai:*`-Profil-ID; führen Sie
nach der Reparatur `openclaw models auth list --provider openai` aus, bevor Sie
Profil-IDs in `auth.order` oder `/model ...@<profileId>` kopieren.

Ablauf (PKCE):

1. einen PKCE-Verifizierer/eine PKCE-Challenge und einen zufälligen `state` erzeugen
2. `https://auth.openai.com/oauth/authorize?...` öffnen (Geltungsbereich
   `openid profile email offline_access`)
3. versuchen, den Callback unter `http://localhost:1455/auth/callback` zu erfassen (der
   Callback-Host ist standardmäßig `localhost` und akzeptiert nur Loopback-Hosts;
   mit `OPENCLAW_OAUTH_CALLBACK_HOST` überschreiben)
4. wenn Sie einen Code einfügen können, bevor der Callback eingeht (oder Sie
   remote/headless arbeiten und der Callback keine Bindung herstellen kann), fügen Sie stattdessen die Weiterleitungs-URL/den Code
   ein – das manuelle Einfügen konkurriert mit dem Browser-Callback, und der zuerst
   abgeschlossene Vorgang gewinnt
5. den Code unter `https://auth.openai.com/oauth/token` austauschen
6. `accountId` aus dem Zugriffs-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad lautet `openclaw onboard` → Authentifizierungsauswahl `openai`.

## Aktualisierung + Ablauf

Profile speichern einen `expires`-Zeitstempel. Zur Laufzeit gilt:

- wenn `expires` in der Zukunft liegt, das gespeicherte Zugriffs-Token verwenden
- wenn es abgelaufen ist, aktualisieren (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- wenn ein sekundärer Agent ein geerbtes OAuth-Profil des Haupt-Agents liest, schreibt die
  Aktualisierung in den Speicher des Haupt-Agents zurück, statt das Aktualisierungs-
  Token in den Speicher des sekundären Agents zu kopieren
- extern verwaltete CLI-Anmeldedaten (Claude CLI, eingeschränktes Bootstrapping über die Codex CLI;
  siehe [Die Token-Senke](#the-token-sink-why-it-exists)) werden erneut gelesen, statt
  ein kopiertes Aktualisierungs-Token zu verbrauchen. Wenn eine verwaltete Aktualisierung fehlschlägt, meldet OpenClaw
  das betroffene Profil zur erneuten Authentifizierung, statt
  Token-Material einer externen CLI zurückzugeben.

Der Aktualisierungsablauf erfolgt automatisch; im Allgemeinen müssen Token nicht manuell verwaltet werden.

## Mehrere Konten (Profile) + Weiterleitung

Zwei Muster:

### 1) Bevorzugt: separate Agents

Wenn „privat“ und „geschäftlich“ niemals miteinander interagieren sollen, verwenden Sie isolierte Agents (separate Sitzungen + Anmeldedaten + Arbeitsbereiche):

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

Vorhandene Profil-IDs auflisten mit:

```bash
openclaw models auth list --provider <id>
```

Zugehörige Dokumentation:

- [Modell-Failover](/de/concepts/model-failover) (Rotations- und Abkühlregeln)
- [Slash-Befehle](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) – Übersicht zur Authentifizierung bei Modell-Providern
- [Geheimnisse](/de/gateway/secrets) – Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/de/gateway/configuration-reference#auth-storage) – Authentifizierungskonfigurationsschlüssel
