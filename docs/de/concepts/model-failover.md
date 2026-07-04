---
read_when:
    - Diagnose von Auth-Profilrotation, Cooldowns oder Modell-Fallback-Verhalten
    - Aktualisieren der Failover-Regeln für Authentifizierungsprofile oder Modelle
    - Verstehen, wie Sitzungsmodell-Overrides mit Fallback-Wiederholungen interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Auth-Profile rotiert und zwischen Modellen ausweicht
title: Modell-Failover
x-i18n:
    generated_at: "2026-07-04T15:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Rotation von Auth-Profilen** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf bewertet OpenClaw Kandidaten in dieser Reihenfolge:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Lösen Sie das aktive Sitzungsmodell und die Auth-Profil-Präferenz auf.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Erstellen Sie die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle. Konfigurierte Standardwerte, primäre Cron-Job-Modelle und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen in Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Versuchen Sie den aktuellen Provider mit den Regeln für Auth-Profil-Rotation und Cooldown.
  </Step>
  <Step title="Bei failover-würdigen Fehlern fortfahren">
    Wenn dieser Provider mit einem failover-würdigen Fehler erschöpft ist, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Fallback-Override persistieren">
    Persistieren Sie den ausgewählten Fallback-Override, bevor der Wiederholungsversuch startet, damit andere Sitzungsleser denselben Provider und dasselbe Modell sehen, die der Runner verwenden wird. Der persistierte Modell-Override wird mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng begrenzt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, rollen Sie nur die sitzungsbezogenen Override-Felder zurück, die dem Fallback gehören, wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.
  </Step>
  <Step title="FallbackSummaryError werfen, wenn erschöpft">
    Wenn jeder Kandidat fehlschlägt, werfen Sie einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf, sofern einer bekannt ist.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die ganze Sitzung speichern und wiederherstellen“. Der Reply-Runner persistiert nur die Felder für die Modellauswahl, die er für den Fallback besitzt:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Das verhindert, dass ein fehlgeschlagener Fallback-Wiederholungsversuch neuere, nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Aktualisierungen der Sitzungsrotation, die während des laufenden Versuchs passiert sind.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider und das Modell davon, warum sie ausgewählt wurden. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Standardwert**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Primäres Agent-Modell**: `agents.list[].model` ist strikt, es sei denn, dieses Agent-Modellobjekt enthält eigene `fallbacks`. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, um diesen Agent für Modell-Fallback zu aktivieren.
- **Automatischer Fallback-Override**: Ein Laufzeit-Fallback schreibt `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` und das ausgewählte Ursprungsmodell, bevor er es erneut versucht. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen, ohne bei jeder Nachricht das primäre Modell zu prüfen, aber OpenClaw prüft den konfigurierten Ursprung regelmäßig erneut und entfernt den automatischen Override, wenn er sich erholt. `/new`, `/reset` und `sessions.reset` entfernen ebenfalls automatisch gesetzte Overrides. Heartbeat-Läufe ohne explizites `heartbeat.model` entfernen direkte automatische Overrides, wenn deren Ursprung nicht mehr dem aktuellen konfigurierten Standard entspricht.
- **Benutzer-Override in der Sitzung**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider oder das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt aus einem nicht zusammenhängenden konfigurierten Fallback zu antworten.
- **Legacy-Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Nutzlastmodell**: Ein Cron-Job `payload.model` / `--model` ist ein primäres Job-Modell, kein Benutzer-Override in der Sitzung. Es verwendet konfigurierte Fallbacks, sofern der Job nicht `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

Das Intervall für die Primärprüfung beim automatischen Fallback beträgt fünf Minuten und ist nicht konfigurierbar. OpenClaw merkt sich aktuelle Prüfungen pro Sitzung und primärem Modell, damit ein fehlschlagendes primäres Modell nicht bei jedem Turn erneut versucht wird. OpenClaw sendet einen sichtbaren Hinweis, wenn eine Sitzung auf einen Fallback wechselt, und einen weiteren Hinweis, wenn sie zum ausgewählten primären Modell zurückkehrt; der Hinweis wird nicht bei jedem Sticky-Fallback-Turn wiederholt.

## Skip-Cache für Auth-Fehler

Standardmäßig behält jeder neue Turn das bestehende Fallback-Wiederholungsverhalten bei: OpenClaw
versucht jeden konfigurierten Fallback-Kandidaten erneut, einschließlich nicht primärer
Kandidaten, die kürzlich mit `auth` oder `auth_permanent` fehlgeschlagen sind.

Betreiber, die diese wiederholten Auth-Fehler unterdrücken möchten, können dies aktivieren mit:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wenn aktiviert, zeichnet OpenClaw nach einem Fehler der Auth-Klasse einen
sitzungsbezogenen Skip-Marker im Arbeitsspeicher für einen nicht primären Fallback-Kandidaten auf. Der Marker wird
nach Sitzungs-ID, Provider und Modell geschlüsselt. Primäre Kandidaten werden nie übersprungen, sodass eine
explizite Benutzermodellauswahl weiterhin den echten Auth-Fehler sichtbar macht. Der Cache ist
prozesslokal und wird bei einem Gateway-Neustart gelöscht.

Der Wert ist eine TTL in Millisekunden. `0` oder ein nicht gesetzter Wert deaktiviert den Cache.
Positive Werte werden auf einen Bereich zwischen 1 Sekunde und 10 Minuten begrenzt.

## Für Benutzer sichtbare Fallback-Hinweise

Wenn eine Sitzung auf einen automatisch ausgewählten Fallback wechselt, sendet OpenClaw einen Statushinweis auf derselben Antwortoberfläche:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wenn eine spätere Prüfung erfolgreich ist und die Sitzung zum ausgewählten primären Modell zurückkehrt, sendet OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Diese Hinweise sind operative Nachrichten, keine Assistenteninhalte. Sie werden einmal pro Statusänderung zugestellt, einschließlich nur aus Seiteneffekten bestehender Turns, wenn möglich, aber Sticky-Fallback-Turns wiederholen sie nicht. Die Zustellung umgeht die normale Unterdrückung von Quellantworten, der Hinweis belegt nicht den ersten Assistentenantwort-Slot für Thread-Kanäle, und er ist von Text-to-Speech und Commitment-Extraktion ausgeschlossen.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets und Laufzeitstatus für Auth-Routing liegen in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Secrets).
- Legacy-OAuth-Datei nur für Import: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den Auth-Speicher pro Agent importiert).
- Legacy-Dateien `auth-profiles.json`, `auth-state.json` und agentbezogene `auth.json`-Dateien werden von `openclaw doctor --fix` importiert.

Weitere Details: [OAuth](/de/concepts/oauth)

Zugangsdaten-Typen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen eigene Profile, damit mehrere Konten nebeneinander bestehen können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen im Auth-Profilspeicher `openclaw-agent.sqlite` pro Agent.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie diese:

<Steps>
  <Step title="Explizite Konfiguration">
    `auth.order[provider]` (falls gesetzt).
  </Step>
  <Step title="Konfigurierte Profile">
    `auth.profiles`, nach Provider gefiltert.
  </Step>
  <Step title="Gespeicherte Profile">
    Agentbezogene SQLite-Auth-Profileinträge für den Provider.
  </Step>
</Steps>

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärer Schlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärer Schlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Profile im Cooldown oder deaktivierte Profile** werden ans Ende verschoben, sortiert nach frühestem Ablauf.

### Sitzungshaftung (cachefreundlich)

OpenClaw **pinnt das ausgewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten. Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen wird (Compaction-Zähler erhöht sich)
- das Profil im Cooldown oder deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` setzt einen **Benutzer-Override** für diese Sitzung und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

<Note>
Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits oder Timeouts zu einem anderen Profil rotieren. Wenn das ursprüngliche Profil wieder verfügbar wird, können neue Läufe es wieder bevorzugen, ohne das ausgewählte Modell oder die Laufzeit zu ändern. Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### OpenAI-Codex-Abonnement plus API-Schlüssel-Backup

Für OpenAI-Agent-Modelle sind Auth und Laufzeit getrennt. `openai/gpt-*` bleibt auf
dem Codex-Harness, während Auth zwischen einem Codex-Abonnementprofil und
einem OpenAI-API-Schlüssel-Backup rotieren kann.

Verwenden Sie `auth.order.openai` für die benutzerseitige Reihenfolge:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Verwenden Sie `openai:*` sowohl für ChatGPT/Codex-OAuth-Profile als auch für OpenAI-API-Schlüssel-
Profile. Wenn das Abonnement ein Codex-Nutzungslimit erreicht,
zeichnet OpenClaw die exakte Rücksetzzeit auf, sofern Codex eine bereitstellt, versucht das nächste
geordnete Auth-Profil und hält den Lauf im Codex-Harness. Sobald die Rücksetzzeit
verstrichen ist, ist das Abonnementprofil wieder auswählbar und die nächste automatische
Auswahl kann zu ihm zurückkehren.

Verwenden Sie ein vom Benutzer gepinntes Profil nur, wenn Sie für diese
Sitzung ein bestimmtes Konto oder einen bestimmten Schlüssel erzwingen möchten. Vom Benutzer gepinnte Profile sind absichtlich strikt und springen nicht stillschweigend
zu einem anderen Profil.

## Cooldowns

Wenn ein Profil wegen Auth- oder Ratenlimitfehlern fehlschlägt (oder wegen eines Timeouts, der wie Ratenbegrenzung aussieht), markiert OpenClaw es im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was im Ratenlimit- / Timeout-Bucket landet">
    Dieser Ratenlimit-Bucket ist breiter als ein einfaches `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und regelmäßige Nutzungslimits pro Zeitfenster wie `weekly/monthly limit reached`.

    Format- oder Invalid-Request-Fehler sind normalerweise terminal, weil ein erneuter Versuch mit derselben Nutzlast auf dieselbe Weise fehlschlagen würde; daher macht OpenClaw sie sichtbar, statt Auth-Profile zu rotieren. Bekannte Pfade für Wiederholungsreparaturen können explizit aktiviert werden: Beispielsweise werden Cloud Code Assist-Validierungsfehler bei Tool-Call-IDs bereinigt und einmal über die Richtlinie `allowFormatRetry` erneut versucht. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle zu einem bekannten transienten Muster passt. Zum Beispiel wird die nackte Stream-Wrapper-Meldung der Modelllaufzeit `An unknown error occurred` für jeden Provider als failover-würdig behandelt, weil die gemeinsame Modelllaufzeit sie ausgibt, wenn Provider-Streams mit `stopReason: "aborted"` oder `stopReason: "error"` ohne spezifische Details enden. JSON-`api_error`-Nutzlasten mit transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als failover-würdige Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie das nackte `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich genommen keinen Failover aus.

  </Accordion>
  <Accordion title="SDK-Retry-after-Obergrenzen">
    Einige Provider-SDKs schlafen andernfalls möglicherweise über ein langes `Retry-After`-Fenster, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms`- / `retry-after`-Wartezeiten standardmäßig auf 60 Sekunden und macht längere wiederholbare Antworten sofort sichtbar, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Wiederholungsverhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Ratenlimit-Cooldowns können auch modellbezogen sein:

    - OpenClaw speichert `cooldownModel` für Ratenlimit-Fehler, wenn die fehlgeschlagene Modell-ID bekannt ist.
    - Ein Geschwistermodell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell bezogen ist.
    - Abrechnungs-/deaktivierte Fenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

  </Accordion>
</AccordionGroup>

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

Der Zustand wird im SQLite-Authentifizierungszustand pro Agent unter `usageStats` gespeichert:

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

## Abrechnungsdeaktivierungen

Abrechnungs-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Failover-würdig behandelt, sind aber normalerweise nicht vorübergehend. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jede HTTP-`402` landet hier. OpenClaw belässt expliziten Abrechnungstext in der Abrechnungsspur, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber Provider-spezifische Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Temporäre `402`-Nutzungsfenster- und Organisations-/Workspace-Ausgabenlimitfehler werden dagegen als `rate_limit` klassifiziert, wenn die Nachricht wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Pfad für Abrechnungsdeaktivierungen.
</Note>

Der Zustand wird im SQLite-Authentifizierungszustand pro Agent gespeichert:

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

- Das Abrechnungs-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Überlastungs-Wiederholungen erlauben **1 Profilrotation beim selben Provider** vor dem Modell-Fallback.
- Überlastungs-Wiederholungen verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Ratenlimits und Timeouts, die die Profilrotation ausgeschöpft haben (andere Fehler lösen keinen Fallback aus). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Zustand dennoch präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider keine verwendbare Nachricht oder keinen verwendbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau beibehalten hat, aber noch kein Klassifikator darauf gepasst hat.

Überlastungs- und Ratenlimitfehler werden aggressiver behandelt als Abrechnungs-Cooldowns. Standardmäßig erlaubt OpenClaw einen Wiederholungsversuch mit einem Authentifizierungsprofil beim selben Provider und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Auslastungssignale wie `ModelNotReadyException` landen in diesem Überlastungsbereich. Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf vom konfigurierten Standard-Primärmodell, einem Cron-Job-Primärmodell, einem Agent-Primärmodell mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Agent-Primärmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Provider-/Modellüberschreibungen) sind strikt: Wenn dieser Provider/dieses Modell nicht erreichbar ist oder vor einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt über einen nicht verwandten Fallback zu antworten.

### Regeln für Kandidatenketten

OpenClaw baut die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus konfigurierten Fallbacks auf.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-Allowlist gefiltert. Sie werden als explizite Operator-Absicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-Familie ist, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn keine explizite Fallback-Überschreibung angegeben ist, werden konfigurierte Fallbacks vor dem konfigurierten Primärmodell versucht, selbst wenn das angeforderte Modell einen anderen Provider verwendet.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte Primärmodell am Ende angehängt, damit die Kette nach dem Ausschöpfen früherer Kandidaten wieder auf den normalen Standard zurückfallen kann.
    - Wenn ein Aufrufer `fallbacksOverride` übergibt, verwendet der Runner genau das angeforderte Modell plus diese Überschreibungsliste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte Primärmodell als verborgenes Wiederholungsziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Wird fortgesetzt bei">
    - Authentifizierungsfehlern
    - Ratenlimits und Cooldown-Ausschöpfung
    - Überlastungs-/Provider-Auslastungsfehlern
    - timeoutartigen Failover-Fehlern
    - Abrechnungsdeaktivierungen
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Wiederholungsschleife erzeugt
    - anderen nicht erkannten Fehlern, wenn noch weitere Kandidaten verbleiben

  </Tab>
  <Tab title="Wird nicht fortgesetzt bei">
    - expliziten Abbrüchen, die nicht timeout-/failoverartig sind
    - Kontextüberlauffehlern, die innerhalb der Compaction-/Retry-Logik bleiben sollen (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem finalen unbekannten Fehler, wenn keine Kandidaten mehr übrig sind
    - Sicherheitsablehnungen von Claude Fable 5; direkte API-Key-Anfragen behandeln diese stattdessen auf Provider-Ebene über Anthropics serverseitigen Fallback auf `claude-opus-4-8` (siehe [Anthropic](/de/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Cooldown-Überspringen gegenüber Probeverhalten

Wenn jedes Authentifizierungsprofil für einen Provider bereits im Cooldown ist, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Es trifft eine Entscheidung pro Kandidat:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Persistente Authentifizierungsfehler überspringen sofort den gesamten Provider.
    - Abrechnungsdeaktivierungen werden normalerweise übersprungen, aber der Primärkandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primärkandidat kann nahe am Ablauf des Cooldowns mit einer Drosselung pro Provider geprüft werden.
    - Fallback-Geschwister beim selben Provider können trotz Cooldown versucht werden, wenn der Fehler vorübergehend wirkt (`rate_limit`, `overloaded` oder unbekannt). Dies ist besonders relevant, wenn ein Ratenlimit modellbezogen ist und sich ein Geschwistermodell möglicherweise sofort erholen kann.
    - Vorübergehende Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungsüberschreibungen und Live-Modellwechsel

Sitzungsmodelländerungen sind gemeinsamer Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und die Live-Sitzungsabstimmung lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Wiederholungen mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren von sich aus nie einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modellüberschreibungen werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` verdeckt zu werden.
- Bevor eine Fallback-Wiederholung startet, persistiert der Antwort-Runner die ausgewählten Fallback-Überschreibungsfelder im Sitzungseintrag.
- Automatische Fallback-Überschreibungen bleiben in folgenden Turns ausgewählt, damit OpenClaw nicht bei jeder Nachricht einen bekannt fehlerhaften Primärpfad prüft. OpenClaw prüft den konfigurierten Ursprung regelmäßig erneut und entfernt die automatische Überschreibung, wenn er sich erholt; `/new`, `/reset` und `sessions.reset` entfernen automatisch erzeugte Überschreibungen sofort.
- Benutzerantworten kündigen Fallback-Übergänge und die Wiederherstellung nach aufgehobenem Fallback einmal pro Zustandsänderung an. Sticky-Fallback-Turns wiederholen den Hinweis nicht.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand abweicht, das aktive Fallback-Modell und den Grund.
- Die Live-Sitzungsabstimmung bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten Laufzeitmodellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht verwandte Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und nur wenn sie noch diesem fehlgeschlagenen Kandidaten entsprechen.

Dies verhindert das klassische Rennen:

<Steps>
  <Step title="Primärmodell schlägt fehl">
    Das ausgewählte Primärmodell schlägt fehl.
  </Step>
  <Step title="Fallback im Speicher ausgewählt">
    Der Fallback-Kandidat wird im Speicher ausgewählt.
  </Step>
  <Step title="Sitzungsspeicher meldet noch altes Primärmodell">
    Der Sitzungsspeicher spiegelt weiterhin das alte Primärmodell wider.
  </Step>
  <Step title="Live-Abstimmung liest veralteten Zustand">
    Die Live-Sitzungsabstimmung liest den veralteten Sitzungszustand.
  </Step>
  <Step title="Wiederholung zurückgesetzt">
    Die Wiederholung wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Die persistierte Fallback-Überschreibung schließt dieses Fenster, und das enge Rollback hält neuere manuelle oder Laufzeit-Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten auch flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), damit Log- und Diagnoseexporter den primären Fehler rekonstruieren können, selbst wenn auch der terminale Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere Antwort-Runner kann dies verwenden, um eine spezifischere Nachricht wie „all models are temporarily rate-limited“ zu erstellen und den frühesten Cooldown-Ablauf einzuschließen, wenn einer bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht verwandte modellbezogene Ratenlimits werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Blockade ein passendes modellbezogenes Ratenlimit ist, meldet OpenClaw den letzten passenden Ablauf, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für die umfassendere Übersicht zur Modellauswahl und zu Fallbacks.
