---
read_when:
    - Diagnose von Auth-Profil-Rotation, Cooldowns oder Modell-Fallback-Verhalten
    - Aktualisieren von Failover-Regeln für Auth-Profile oder Modelle
    - Verstehen, wie Sitzungs-Modellüberschreibungen mit Fallback-Wiederholungen interagieren
summary: Wie OpenClaw Auth-Profile rotiert und modellübergreifend Fallbacks verwendet
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-25T18:17:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw behandelt Ausfälle in zwei Stufen:

1. **Auth-Profile-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

1. Das aktuell ausgewählte Sitzungsmodell.
2. Konfigurierte `agents.defaults.model.fallbacks` in Reihenfolge.
3. Das konfigurierte primäre Modell am Ende, wenn der Lauf von einer Überschreibung gestartet wurde.

Innerhalb jedes Kandidaten versucht OpenClaw Auth-Profil-Failover, bevor es zum
nächsten Modellkandidaten übergeht.

Ablauf auf hoher Ebene:

1. Das aktive Sitzungsmodell und die Auth-Profil-Präferenz auflösen.
2. Die Kette der Modellkandidaten aufbauen.
3. Den aktuellen Provider mit Auth-Profil-Rotations-/Cooldown-Regeln versuchen.
4. Wenn dieser Provider mit einem Failover-würdigen Fehler ausgeschöpft ist, zum nächsten
   Modellkandidaten wechseln.
5. Die ausgewählte Fallback-Überschreibung beibehalten, bevor der Wiederholungsversuch startet,
   damit andere Sitzungsleser denselben Provider/dasselbe Modell sehen, den bzw. das der Runner
   gleich verwenden wird.
6. Wenn der Fallback-Kandidat fehlschlägt, nur die sitzungseigenen
   Überschreibungsfelder des Fallbacks zurücksetzen, wenn sie noch diesem fehlgeschlagenen
   Kandidaten entsprechen.
7. Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch
   und dem frühesten Cooldown-Ablauf auslösen, wenn einer bekannt ist.

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der
Reply-Runner speichert für Fallback nur die Felder zur Modellauswahl, die ihm gehören:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Wiederholungsversuch neuere,
nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen
oder Sitzungsrotations-Updates, die während des Versuchs passiert sind.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Geheimnisse liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Altbestand: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Geheimnisse).
- Alte reine Import-OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Mehr Details: [/concepts/oauth](/de/concepts/oauth)

Typen von Anmeldedaten:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen unterschiedliche Profile, damit mehrere Konten nebeneinander existieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge so aus:

1. **Explizite Konfiguration**: `auth.order[provider]` (falls gesetzt).
2. **Konfigurierte Profile**: `auth.profiles`, nach Provider gefiltert.
3. **Gespeicherte Profile**: Einträge in `auth-profiles.json` für den Provider.

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Cooldown-/deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungs-Stickiness (cachefreundlich)

OpenClaw **pinnt das gewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten.
Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler wird erhöht)
- das Profil im Cooldown/deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` setzt eine **Benutzerüberschreibung** für diese Sitzung
und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt:
Sie werden zuerst versucht, aber OpenClaw kann bei Ratenbegrenzungen/Timeouts zu einem anderen Profil rotieren.
Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks
konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.

### Warum OAuth „verloren aussehen“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüssel-Profil für denselben Provider haben, kann Round-Robin zwischen ihnen über Nachrichten hinweg wechseln, sofern sie nicht gepinnt sind. Um ein einzelnes Profil zu erzwingen:

- Mit `auth.order[provider] = ["provider:profileId"]` pinnen, oder
- Eine sitzungsspezifische Überschreibung über `/model …` mit einer Profilüberschreibung verwenden (wenn von Ihrer UI-/Chat-Oberfläche unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Ratenbegrenzungsfehlern fehlschlägt (oder eines Timeouts, das
wie eine Ratenbegrenzung aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.
Dieser Bucket für Ratenbegrenzungen ist weiter gefasst als nur `429`: Er umfasst auch Provider-
Nachrichten wie `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` und periodische Nutzungsfenstergrenzen wie
`weekly/monthly limit reached`.
Format-/ungültige-Anfrage-Fehler (zum Beispiel Validierungsfehler bei Cloud Code Assist-Tool-Call-IDs)
werden als Failover-würdig behandelt und verwenden dieselben Cooldowns.
OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`,
`stop reason: error` und `reason: error` werden als Timeout-/Failover-
Signale klassifiziert.
Allgemeiner Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem
bekannten vorübergehenden Muster entspricht. Zum Beispiel wird die reine pi-ai-Stream-Wrapper-Nachricht
`An unknown error occurred` für jeden Provider als Failover-würdig behandelt,
weil pi-ai sie ausgibt, wenn Provider-Streams mit `stopReason: "aborted"` oder
`stopReason: "error"` ohne spezifische Details enden. JSON-`api_error`-Payloads mit
vorübergehendem Servertext wie `internal server error`, `unknown error, 520`,
`upstream error` oder `backend error` werden ebenfalls als Failover-würdige
Timeouts behandelt.
OpenRouter-spezifischer allgemeiner Upstream-Text wie das bloße `Provider returned error`
wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist.
Allgemeiner interner Fallback-Text wie `LLM request failed with an unknown
error.` bleibt konservativ und löst für sich genommen kein Failover aus.

Einige Provider-SDKs schlafen andernfalls möglicherweise für ein langes `Retry-After`-Fenster, bevor
sie die Kontrolle an OpenClaw zurückgeben. Für auf Stainless basierende SDKs wie Anthropic und
OpenAI begrenzt OpenClaw standardmäßig SDK-interne `retry-after-ms`- / `retry-after`-Wartezeiten auf 60
Sekunden und gibt längere wiederholbare Antworten sofort aus, damit dieser
Failover-Pfad ausgeführt werden kann. Die Obergrenze kann mit
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` angepasst oder deaktiviert werden; siehe [/concepts/retry](/de/concepts/retry).

Cooldowns für Ratenbegrenzungen können auch modellspezifisch sein:

- OpenClaw zeichnet `cooldownModel` für Ausfälle aufgrund von Ratenbegrenzung auf, wenn die ID
  des fehlgeschlagenen Modells bekannt ist.
- Ein Schwestermodell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown
  auf ein anderes Modell begrenzt ist.
- Abrechnungs-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

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

## Abrechnungsbedingte Deaktivierungen

Abrechnungs-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Failover-würdig behandelt, sind aber in der Regel nicht vorübergehend. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit einem längeren Backoff) und rotiert zum nächsten Profil/Provider.

Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jeder HTTP-`402` landet
hier. OpenClaw behält expliziten Abrechnungstext in der Abrechnungsbahn, selbst wenn ein
Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben
auf den Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit
exceeded`). Gleichzeitig werden vorübergehende `402`-Nutzungsfenster- und
Ausgabenlimitfehler von Organisationen/Workspaces als `rate_limit` klassifiziert, wenn
die Nachricht wiederholbar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` oder `organization spending limit exceeded`).
Diese bleiben auf dem Pfad für kurzen Cooldown/Failover statt auf dem langen
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

Standardeinstellungen:

- Das Abrechnungs-Backoff startet bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist bei **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Wiederholungen bei Überlastung erlauben **1 Profilrotation beim selben Provider**, bevor Modell-Fallback verwendet wird.
- Wiederholungen bei Überlastung verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in
`agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Ratenbegrenzungen und
Timeouts, die die Profilrotation ausgeschöpft haben (andere Fehler lassen den Fallback nicht weitergehen).

Überlastungs- und Ratenbegrenzungsfehler werden aggressiver behandelt als Cooldowns für die Abrechnung.
Standardmäßig erlaubt OpenClaw einen Wiederholungsversuch mit Auth-Profil beim selben Provider,
wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback.
Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Überlastungs-Bucket.
Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` und
`auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf mit einer Modellüberschreibung startet (Hooks oder CLI), enden Fallbacks dennoch bei
`agents.defaults.model.primary`, nachdem alle konfigurierten Fallbacks versucht wurden.

### Regeln für Kandidatenketten

OpenClaw baut die Kandidatenliste aus dem aktuell angeforderten `provider/model`
und konfigurierten Fallbacks auf.

Regeln:

- Das angeforderte Modell steht immer an erster Stelle.
- Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-
  Allowlist gefiltert. Sie gelten als explizite Absicht des Operators.
- Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback derselben Provider-
  Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
- Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle
  Modell noch nicht Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine
  nicht zusammenhängenden konfigurierten Fallbacks von einem anderen Provider an.
- Wenn der Lauf von einer Überschreibung gestartet wurde, wird das konfigurierte primäre Modell am
  Ende angehängt, damit sich die Kette wieder auf den normalen Standard einpendeln kann, sobald frühere
  Kandidaten ausgeschöpft sind.

### Welche Fehler den Fallback voranbringen

Der Modell-Fallback setzt sich fort bei:

- Auth-Fehlern
- Ratenbegrenzungen und ausgeschöpften Cooldowns
- Überlastungs-/Provider-busy-Fehlern
- Timeout-ähnlichen Failover-Fehlern
- abrechnungsbedingten Deaktivierungen
- `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, damit ein
  veraltetes gespeichertes Modell keine äußere Wiederholungsschleife erzeugt
- anderen nicht erkannten Fehlern, wenn noch Kandidaten übrig sind

Der Modell-Fallback setzt sich nicht fort bei:

- expliziten Abbrüchen, die nicht timeout-/failover-ähnlich sind
- Kontextüberlauffehlern, die innerhalb der Compaction-/Wiederholungslogik bleiben sollten
  (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` oder `ollama error: context
length exceeded`)
- einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

### Verhalten bei Cooldown-Überspringen vs. Prüfen

Wenn jedes Auth-Profil für einen Provider bereits im Cooldown ist, überspringt OpenClaw diesen
Provider nicht automatisch für immer. Es trifft pro Kandidat eine Entscheidung:

- Persistente Auth-Fehler überspringen sofort den gesamten Provider.
- Abrechnungsbedingte Deaktivierungen werden normalerweise übersprungen, aber der primäre Kandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
- Der primäre Kandidat kann kurz vor dem Ablauf des Cooldowns geprüft werden, mit einer providerbezogenen Drosselung.
- Geschwister-Fallbacks beim selben Provider können trotz Cooldown versucht werden, wenn der Fehler vorübergehend aussieht (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn eine Ratenbegrenzung modellspezifisch ist und sich ein Schwestermodell möglicherweise sofort wieder erholen kann.
- Vorübergehende Cooldown-Prüfungen sind auf eine pro Provider pro Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

## Sitzungsüberschreibungen und Live-Modellumschaltung

Änderungen am Sitzungsmodell sind gemeinsam genutzter Status. Der aktive Runner, der Befehl `/model`,
Compaction-/Sitzungsupdates und die Live-Sitzungsabstimmung lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Wiederholungen mit der Live-Modellumschaltung koordiniert werden müssen:

- Nur explizite, vom Benutzer ausgelöste Modelländerungen markieren eine ausstehende Live-Umschaltung. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren nicht von selbst eine ausstehende Live-Umschaltung.
- Bevor eine Fallback-Wiederholung startet, speichert der Reply-Runner die ausgewählten Fallback-Überschreibungsfelder im Sitzungseintrag.
- Die Live-Sitzungsabstimmung bevorzugt gespeicherte Sitzungsüberschreibungen gegenüber veralteten Laufzeit-Modellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und nur dann, wenn sie noch diesem fehlgeschlagenen Kandidaten entsprechen.

Dadurch wird die klassische Race-Condition verhindert:

1. Das primäre Modell schlägt fehl.
2. Ein Fallback-Kandidat wird im Speicher ausgewählt.
3. Im Sitzungsspeicher steht noch das alte primäre Modell.
4. Die Live-Sitzungsabstimmung liest den veralteten Sitzungsstatus.
5. Der Wiederholungsversuch springt zurück auf das alte Modell, bevor der Fallback-Versuch startet.

Die gespeicherte Fallback-Überschreibung schließt dieses Zeitfenster, und das enge Zurücksetzen
hält neuere manuelle oder laufzeitbezogene Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die in Logs und
benutzerseitige Cooldown-Meldungen einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und
  ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere
Reply-Runner kann damit eine spezifischere Meldung erstellen, etwa „alle Modelle
sind vorübergehend ratenbegrenzt“, und den frühesten Cooldown-Ablauf einbeziehen, wenn einer
bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zusammenhängende modellspezifische Ratenbegrenzungen werden für die versuchte
  Provider-/Modellkette ignoriert
- wenn die verbleibende Blockierung eine passende modellspezifische Ratenbegrenzung ist, meldet OpenClaw
  den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Routing für `agents.defaults.imageModel`

Siehe [Modelle](/de/concepts/models) für den umfassenderen Überblick über Modellauswahl und Fallback.
