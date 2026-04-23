---
read_when:
    - Diagnose von Authentifizierungsprofilrotation, Cooldowns oder Modell-Fallback-Verhalten
    - Failover-Regeln für Authentifizierungsprofile oder Modelle aktualisieren
    - Verstehen, wie Überschreibungen von Sitzungsmodellen mit Fallback-Wiederholungen interagieren
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend Fallbacks verwendet
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-23T06:28:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Modell-Failover

OpenClaw verarbeitet Fehler in zwei Stufen:

1. **Rotation von Authentifizierungsprofilen** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

1. Das aktuell ausgewählte Sitzungsmodell.
2. Konfigurierte `agents.defaults.model.fallbacks` in Reihenfolge.
3. Das konfigurierte Primärmodell am Ende, wenn der Lauf mit einer Überschreibung begonnen hat.

Innerhalb jedes Kandidaten versucht OpenClaw zunächst Authentifizierungsprofil-Failover, bevor zum nächsten Modellkandidaten übergegangen wird.

Ablauf auf hoher Ebene:

1. Das aktive Sitzungsmodell und die Präferenz für das Authentifizierungsprofil auflösen.
2. Die Kette der Modellkandidaten aufbauen.
3. Den aktuellen Provider mit Regeln für Rotation/Cooldown von Authentifizierungsprofilen versuchen.
4. Wenn dieser Provider mit einem für Failover geeigneten Fehler ausgeschöpft ist, zum nächsten Modellkandidaten wechseln.
5. Die ausgewählte Fallback-Überschreibung persistieren, bevor der Retry beginnt, damit andere Sitzungsleser denselben Provider/dasselbe Modell sehen, die bzw. das der Runner gleich verwenden wird.
6. Wenn der Fallback-Kandidat fehlschlägt, nur die sitzungseigenen Überschreibungsfelder des Fallbacks zurückrollen, wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.
7. Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf auslösen, sofern dieser bekannt ist.

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der Antwort-Runner persistiert für Fallback nur die Modellauswahlfelder, die ihm gehören:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Retry neuere, nicht zusammenhängende Sitzungsänderungen überschreibt, etwa manuelle `/model`-Änderungen oder Aktualisierungen der Sitzungsrotation, die während des Versuchs passiert sind.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Authentifizierungsprofile** sowohl für API-Schlüssel als auch für OAuth-Tokens.

- Geheimnisse liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Die Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Geheimnisse).
- Legacy-Datei nur für OAuth-Import: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Mehr Details: [/concepts/oauth](/de/concepts/oauth)

Typen von Anmeldedaten:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Logins erstellen eindeutige Profile, damit mehrere Konten parallel existieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie folgt:

1. **Explizite Konfiguration**: `auth.order[provider]` (falls gesetzt).
2. **Konfigurierte Profile**: `auth.profiles`, gefiltert nach Provider.
3. **Gespeicherte Profile**: Einträge in `auth-profiles.json` für den Provider.

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Profile mit Cooldown/deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungs-Stickiness (cache-freundlich)

OpenClaw **heftet das gewählte Authentifizierungsprofil pro Sitzung an**, um Provider-Caches warm zu halten.
Es rotiert **nicht** bei jeder Anfrage. Das angeheftete Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen wird (die Compaction-Anzahl wird erhöht)
- das Profil im Cooldown/deaktiviert ist

Eine manuelle Auswahl über `/model …@<profileId>` setzt eine **Benutzerüberschreibung** für diese Sitzung
und wird nicht automatisch rotiert, bis eine neue Sitzung beginnt.

Automatisch angeheftete Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt:
Sie werden zuerst versucht, aber OpenClaw kann bei Rate-Limits/Timeouts auf ein anderes Profil rotieren.
Vom Benutzer angeheftete Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks
konfiguriert sind, wechselt OpenClaw zum nächsten Modell, anstatt das Profil zu wechseln.

### Warum OAuth „verloren wirken“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüssel-Profil für denselben Provider haben, kann Round-Robin zwischen ihnen über mehrere Nachrichten hinweg wechseln, sofern sie nicht angeheftet sind. Um ein einzelnes Profil zu erzwingen:

- Heften Sie es mit `auth.order[provider] = ["provider:profileId"]` an, oder
- verwenden Sie eine Überschreibung pro Sitzung über `/model …` mit einer Profilüberschreibung (wenn dies von Ihrer UI-/Chat-Oberfläche unterstützt wird).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Rate-Limit-Fehlern fehlschlägt (oder eines Timeouts, das wie ein Rate-Limit aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.
Dieser Rate-Limit-Bucket ist breiter als nur `429`: Er umfasst auch Provider-Meldungen
wie `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` und periodische Nutzungsfenstergrenzen wie
`weekly/monthly limit reached`.
Format-/Invalid-Request-Fehler (zum Beispiel Cloud Code Assist-Fehler bei der
Validierung von Tool-Call-IDs) werden als failoverwürdig behandelt und verwenden dieselben Cooldowns.
OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`,
`stop reason: error` und `reason: error` werden als Timeout-/Failover-
Signale klassifiziert.
Providerbezogener generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn
die Quelle zu einem bekannten transienten Muster passt. Zum Beispiel werden bei Anthropic
ein nacktes `An unknown error occurred` und JSON-`api_error`-Payloads mit transientem Servertext
wie `internal server error`, `unknown error, 520`, `upstream error`
oder `backend error` als failoverwürdige Timeouts behandelt. OpenRouter-spezifischer
generischer Upstream-Text wie ein nacktes `Provider returned error` wird ebenfalls nur dann als
Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner
Fallback-Text wie `LLM request failed with an unknown error.` bleibt
konservativ und löst für sich genommen kein Failover aus.

Einige Provider-SDKs könnten andernfalls für ein langes `Retry-After`-Fenster schlafen, bevor
sie die Kontrolle an OpenClaw zurückgeben. Bei auf Stainless basierenden SDKs wie Anthropic und
OpenAI begrenzt OpenClaw standardmäßig interne SDK-Wartezeiten von `retry-after-ms` / `retry-after` auf 60
Sekunden und gibt länger retrybare Antworten sofort weiter, damit dieser
Failover-Pfad ausgeführt werden kann. Passen Sie die Begrenzung mit
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [/concepts/retry](/de/concepts/retry).

Rate-Limit-Cooldowns können auch modellspezifisch sein:

- OpenClaw zeichnet `cooldownModel` für Rate-Limit-Fehler auf, wenn die ID des fehlgeschlagenen
  Modells bekannt ist.
- Ein Geschwistermodell beim selben Provider kann trotzdem versucht werden, wenn der Cooldown
  auf ein anderes Modell begrenzt ist.
- Abrechnungs-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Maximum)

Der Status wird in `auth-state.json` unter `usageStats` gespeichert:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Deaktivierungen wegen Abrechnung

Abrechnungs-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als failoverwürdig behandelt, sind aber normalerweise nicht transient. Anstelle eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jede HTTP-`402` landet
hier. OpenClaw hält expliziten Abrechnungstext auch dann im Abrechnungszweig, wenn ein
Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben
auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit
exceeded`). Vorübergehende `402`-Nutzungsfenster und
Ausgabenlimitfehler für Organisationen/Workspaces werden hingegen als `rate_limit` klassifiziert, wenn
die Nachricht retrybar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` oder `organization spending limit exceeded`).
Diese bleiben auf dem Pfad mit kurzem Cooldown/Failover statt auf dem langen
Pfad für abrechnungsbedingte Deaktivierung.

Der Status wird in `auth-state.json` gespeichert:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Standardwerte:

- Das Abrechnungs-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist bei **24 Stunden** gedeckelt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang keinen Fehler hatte (konfigurierbar).
- Retries bei Überlastung erlauben **1 Rotation desselben Provider-Profils**, bevor Modell-Fallback erfolgt.
- Retries bei Überlastung verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in
`agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Rate-Limits und
Timeouts, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler führen nicht zum Fallback).

Überlastungs- und Rate-Limit-Fehler werden aggressiver behandelt als Abrechnungs-
Cooldowns. Standardmäßig erlaubt OpenClaw eine erneute Authentifizierungsprofil-Prüfung beim selben Provider,
wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback.
Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Überlastungs-
Bucket. Sie können dies mit `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` und
`auth.cooldowns.rateLimitedProfileRotations` anpassen.

Wenn ein Lauf mit einer Modellüberschreibung beginnt (Hooks oder CLI), enden Fallbacks trotzdem bei
`agents.defaults.model.primary`, nachdem alle konfigurierten Fallbacks versucht wurden.

### Regeln für Kandidatenketten

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model`
plus konfigurierten Fallbacks.

Regeln:

- Das angeforderte Modell steht immer an erster Stelle.
- Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-
  Allowlist gefiltert. Sie gelten als explizite Betreiberabsicht.
- Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-
  Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
- Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle
  Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine
  nicht zusammenhängenden konfigurierten Fallbacks eines anderen Providers an.
- Wenn der Lauf mit einer Überschreibung begonnen hat, wird das konfigurierte Primärmodell am
  Ende angehängt, damit sich die Kette wieder auf den normalen Standard einpendeln kann, sobald frühere
  Kandidaten ausgeschöpft sind.

### Welche Fehler Fallback voranbringen

Modell-Fallback wird fortgesetzt bei:

- Authentifizierungsfehlern
- Rate-Limits und ausgeschöpften Cooldowns
- Überlastungs-/Provider-busy-Fehlern
- Timeout-ähnlichen Failover-Fehlern
- Deaktivierungen wegen Abrechnung
- `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, sodass ein
  veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
- anderen unbekannten Fehlern, wenn noch Kandidaten übrig sind

Modell-Fallback wird nicht fortgesetzt bei:

- expliziten Abbrüchen, die nicht timeout-/failoverartig sind
- Kontextüberlauffehlern, die innerhalb der Compaction-/Retry-Logik bleiben sollten
  (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` oder `ollama error: context
length exceeded`)
- einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

### Verhalten beim Überspringen oder Prüfen während Cooldown

Wenn jedes Authentifizierungsprofil für einen Provider bereits im Cooldown ist, überspringt OpenClaw
diesen Provider nicht automatisch für immer. Es trifft eine Entscheidung pro Kandidat:

- Persistente Authentifizierungsfehler überspringen sofort den gesamten Provider.
- Deaktivierungen wegen Abrechnung werden normalerweise übersprungen, aber der primäre Kandidat kann gedrosselt trotzdem geprüft werden, sodass eine Wiederherstellung ohne Neustart möglich ist.
- Der primäre Kandidat kann kurz vor Ablauf des Cooldowns geprüft werden, mit einer providerbezogenen Drosselung.
- Fallback-Geschwister desselben Providers können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Rate-Limit modellspezifisch ist und sich ein Geschwistermodell möglicherweise sofort wieder erholen kann.
- Transiente Cooldown-Prüfungen sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

## Sitzungsüberschreibungen und Live-Modellwechsel

Änderungen am Sitzungsmodell sind gemeinsam genutzter Zustand. Der aktive Runner, der Befehl `/model`,
Compaction-/Sitzungsaktualisierungen und die Live-Sitzungsabstimmung lesen oder schreiben
alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite, vom Benutzer ausgelöste Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren niemals selbstständig einen ausstehenden Live-Wechsel.
- Bevor ein Fallback-Retry beginnt, persistiert der Antwort-Runner die ausgewählten Fallback-Überschreibungsfelder im Sitzungseintrag.
- Die Live-Sitzungsabstimmung bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten Laufzeit-Modellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, rollt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und auch nur dann, wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.

Dadurch wird die klassische Race-Condition verhindert:

1. Das Primärmodell schlägt fehl.
2. Der Fallback-Kandidat wird im Speicher ausgewählt.
3. Der Sitzungsspeicher zeigt weiterhin das alte Primärmodell.
4. Die Live-Sitzungsabstimmung liest den veralteten Sitzungszustand.
5. Der Retry wird zurück auf das alte Modell gesetzt, bevor der Fallback-Versuch beginnt.

Die persistierte Fallback-Überschreibung schließt dieses Zeitfenster, und der enge Rollback
hält neuere manuelle oder Laufzeit-Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die in Logs und
benutzerseitige Cooldown-Meldungen einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere
Antwort-Runner kann dies verwenden, um eine spezifischere Meldung zu erstellen, etwa „alle Modelle
sind vorübergehend rate-limitiert“, und den frühesten Cooldown-Ablauf einzuschließen, sofern dieser bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zusammenhängende modellspezifische Rate-Limits werden für die versuchte
  Provider-/Modellkette ignoriert
- wenn die verbleibende Blockierung ein passendes modellspezifisches Rate-Limit ist, meldet OpenClaw
  den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Verwandte Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für den allgemeineren Überblick über Modellauswahl und Fallback.
