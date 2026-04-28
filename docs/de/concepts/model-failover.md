---
read_when:
    - Diagnose von Authentifizierungsprofil-Rotation, Cooldowns oder Modell-Fallback-Verhalten
    - Failover-Regeln für Authentifizierungsprofile oder Modelle aktualisieren
    - Verstehen, wie sitzungsbezogene Modellüberschreibungen mit Fallback-Retries interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-26T11:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Rotation von Authentifizierungsprofilen** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf bewertet OpenClaw Kandidaten in dieser Reihenfolge:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Das aktive Sitzungsmodell und die Präferenz für das Authentifizierungsprofil auflösen.
  </Step>
  <Step title="Kandidatenkette aufbauen">
    Die Modell-Kandidatenkette aus dem aktuell ausgewählten Sitzungsmodell aufbauen, dann `agents.defaults.model.fallbacks` in Reihenfolge, und mit dem konfigurierten primären Modell beenden, wenn der Lauf mit einer Überschreibung begonnen hat.
  </Step>
  <Step title="Den aktuellen Provider versuchen">
    Den aktuellen Provider mit Regeln für Rotation/Cooldown von Authentifizierungsprofilen versuchen.
  </Step>
  <Step title="Bei fallback-würdigen Fehlern weiterschalten">
    Wenn dieser Provider mit einem fallback-würdigen Fehler ausgeschöpft ist, zum nächsten Modellkandidaten wechseln.
  </Step>
  <Step title="Fallback-Überschreibung persistieren">
    Die ausgewählte Fallback-Überschreibung persistieren, bevor der Retry startet, damit andere Sitzungsleser denselben Provider/dasselbe Modell sehen, das der Runner gleich verwenden wird.
  </Step>
  <Step title="Bei Fehler gezielt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, nur die vom Fallback verwalteten Sitzungs-Override-Felder zurückrollen, wenn sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.
  </Step>
  <Step title="FallbackSummaryError auslösen, wenn ausgeschöpft">
    Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf auslösen, sofern bekannt.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die ganze Sitzung speichern und wiederherstellen“. Der Reply-Runner persistiert nur die Felder zur Modellauswahl, die ihm für den Fallback gehören:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Retry neuere, nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle Änderungen über `/model` oder Aktualisierungen der Sitzungsrotation, die während des Versuchs passiert sind.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Authentifizierungsprofile** sowohl für API-Schlüssel als auch für OAuth-Tokens.

- Geheimnisse liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (veraltet: `~/.openclaw/agent/auth-profiles.json`).
- Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Geheimnisse).
- Veraltete, nur für Import gedachte OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Mehr Details: [OAuth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Logins erzeugen eindeutige Profile, damit mehrere Konten koexistieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie folgt:

<Steps>
  <Step title="Explizite Konfiguration">
    `auth.order[provider]` (falls gesetzt).
  </Step>
  <Step title="Konfigurierte Profile">
    `auth.profiles`, nach Provider gefiltert.
  </Step>
  <Step title="Gespeicherte Profile">
    Einträge in `auth-profiles.json` für den Provider.
  </Step>
</Steps>

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**)
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs)
- **Cooldown-/deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf

### Sitzungs-Stickiness (cache-freundlich)

OpenClaw **pinnt das gewählte Authentifizierungsprofil pro Sitzung**, damit Provider-Caches warm bleiben. Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (die Compaction-Anzahl erhöht sich)
- das Profil in Cooldown/deaktiviert ist

Manuelle Auswahl über `/model …@<profileId>` setzt eine **Benutzer-Überschreibung** für diese Sitzung und wird nicht automatisch rotiert, bis eine neue Sitzung beginnt.

<Note>
Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Rate Limits/Timeouts auf ein anderes Profil rotieren. Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### Warum OAuth „verloren wirken“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Key-Profil für denselben Provider haben, kann Round-Robin zwischen ihnen über Nachrichten hinweg wechseln, sofern sie nicht gepinnt sind. Um ein einzelnes Profil zu erzwingen:

- mit `auth.order[provider] = ["provider:profileId"]` pinnen, oder
- eine sitzungsbezogene Überschreibung über `/model …` mit Profil-Override verwenden (sofern von Ihrer UI-/Chat-Oberfläche unterstützt)

## Cooldowns

Wenn ein Profil wegen Auth-/Rate-Limit-Fehlern fehlschlägt (oder wegen eines Timeouts, der wie ein Rate Limit aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was im Bucket für Rate Limit / Timeout landet">
    Dieser Rate-Limit-Bucket ist breiter als nur `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Limits von Nutzungsfenstern wie `weekly/monthly limit reached`.

    Format-/Invalid-Request-Fehler (zum Beispiel Cloud Code Assist-Validierungsfehler für Tool-Call-IDs) werden als fallback-würdig behandelt und verwenden dieselben Cooldowns. OpenAI-kompatible Fehler mit Stop-Reason wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Fallback-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel wird die nackte Stream-Wrapper-Meldung von pi-ai `An unknown error occurred` für jeden Provider als fallback-würdig behandelt, weil pi-ai sie ausgibt, wenn Provider-Streams mit `stopReason: "aborted"` oder `stopReason: "error"` ohne spezifische Details enden. JSON-Payloads mit `api_error` und transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als fallback-würdige Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie das nackte `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich genommen keinen Fallback aus.

  </Accordion>
  <Accordion title="SDK-`retry-after`-Obergrenzen">
    Einige Provider-SDKs würden andernfalls für ein langes `Retry-After`-Fenster schlafen, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw standardmäßig SDK-interne Wartezeiten für `retry-after-ms` / `retry-after` auf 60 Sekunden und gibt länger retrybare Antworten sofort weiter, damit dieser Fallback-Pfad ausgeführt werden kann. Stimmen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ab oder deaktivieren Sie sie; siehe [Retry behavior](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Cooldowns für Rate Limits können auch modellbezogen sein:

    - OpenClaw speichert bei Rate-Limit-Fehlern `cooldownModel`, wenn die ID des fehlgeschlagenen Modells bekannt ist.
    - Ein gleichartiges Modell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell beschränkt ist.
    - Billing-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

  </Accordion>
</AccordionGroup>

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

## Billing-Deaktivierungen

Billing-/Credit-Fehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als fallback-würdig behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede billing-artige Antwort ist `402`, und nicht jedes HTTP-`402` landet hier. OpenClaw hält expliziten Billing-Text im Billing-Pfad, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben auf den Provider beschränkt, zu dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Gleichzeitig werden temporäre `402`-Fehler für Nutzungsfenster und Organisations-/Workspace-Ausgabenlimits als `rate_limit` klassifiziert, wenn die Meldung retrybar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben im Pfad für kurzen Cooldown/Fallback statt im langen Billing-Deaktivierungspfad.
</Note>

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

- Billing-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Billing-Fehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Retries bei Überlastung erlauben **1 Rotation desselben Provider-Profils**, bevor auf Modell-Fallback gewechselt wird.
- Retries bei Überlastung verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Das gilt für Auth-Fehler, Rate Limits und Timeouts, die die Profilrotation ausgeschöpft haben (andere Fehler lösen keinen Fallback aus).

Fehler wegen Überlastung und Rate Limits werden aggressiver behandelt als Billing-Cooldowns. Standardmäßig erlaubt OpenClaw einen Retry mit einem Authentifizierungsprofil desselben Providers und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Auslastungssignale des Providers wie `ModelNotReadyException` landen in diesem Überlastungs-Bucket. Stimmen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` ab.

Wenn ein Lauf mit einer Modell-Überschreibung beginnt (Hooks oder CLI), enden Fallbacks dennoch bei `agents.defaults.model.primary`, nachdem alle konfigurierten Fallbacks versucht wurden.

### Regeln für Kandidatenketten

OpenClaw baut die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus konfigurierten Fallbacks auf.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-Allowlist gefiltert. Sie werden als explizite Betreiberabsicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback derselben Provider-Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine nicht zusammenhängenden konfigurierten Fallbacks eines anderen Providers an.
    - Wenn der Lauf mit einer Überschreibung begonnen hat, wird das konfigurierte primäre Modell am Ende angehängt, damit sich die Kette nach Ausschöpfen früherer Kandidaten wieder auf den normalen Standard einpendeln kann.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback weiterschalten

<Tabs>
  <Tab title="Setzt fort bei">
    - Authentifizierungsfehlern
    - Rate Limits und ausgeschöpften Cooldowns
    - Überlastungs-/Provider-busy-Fehlern
    - timeout-artigen Fallback-Fehlern
    - Billing-Deaktivierungen
    - `LiveSessionModelSwitchError`, das in einen Fallback-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
    - anderen nicht erkannten Fehlern, wenn noch Kandidaten übrig sind

  </Tab>
  <Tab title="Setzt nicht fort bei">
    - expliziten Abbrüchen, die nicht timeout-/fallback-artig sind
    - Kontextüberlauffehlern, die innerhalb der Compaction-/Retry-Logik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Verhalten bei Cooldown-Überspringen vs. Probe

Wenn sich jedes Authentifizierungsprofil für einen Provider bereits im Cooldown befindet, überspringt OpenClaw diesen Provider nicht automatisch für immer. Es trifft pro Kandidat eine Entscheidung:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Persistente Authentifizierungsfehler überspringen sofort den gesamten Provider.
    - Billing-Deaktivierungen werden normalerweise übersprungen, aber der primäre Kandidat kann gedrosselt weiterhin geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der primäre Kandidat kann nahe dem Ablauf des Cooldowns geprüft werden, mit einer providerbezogenen Drosselung.
    - Gleichartige Fallback-Geschwister desselben Providers können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Rate Limit modellbezogen ist und sich ein Geschwistermodell möglicherweise sofort erholen kann.
    - Transiente Cooldown-Probes sind auf eine pro Provider pro Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungs-Overrides und Live-Modellwechsel

Änderungen des Sitzungsmodells sind gemeinsam genutzter Status. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und die Live-Sitzungsabstimmung lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite, benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Overrides oder Compaction markieren nie von sich aus einen ausstehenden Live-Wechsel.
- Bevor ein Fallback-Retry startet, persistiert der Reply-Runner die ausgewählten Fallback-Override-Felder im Sitzungseintrag.
- Die Live-Sitzungsabstimmung bevorzugt persistierte Sitzungs-Overrides gegenüber veralteten Laufzeit-Modellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, rollt der Runner nur die Override-Felder zurück, die er geschrieben hat, und nur dann, wenn sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.

Dadurch wird das klassische Race verhindert:

<Steps>
  <Step title="Primäres Modell schlägt fehl">
    Das ausgewählte primäre Modell schlägt fehl.
  </Step>
  <Step title="Fallback im Speicher gewählt">
    Der Fallback-Kandidat wird im Speicher ausgewählt.
  </Step>
  <Step title="Sitzungsspeicher zeigt noch das alte primäre Modell">
    Der Sitzungsspeicher spiegelt weiterhin das alte primäre Modell wider.
  </Step>
  <Step title="Live-Abstimmung liest veralteten Status">
    Die Live-Sitzungsabstimmung liest den veralteten Sitzungsstatus.
  </Step>
  <Step title="Retry springt zurück">
    Der Retry springt zurück auf das alte Modell, bevor der Fallback-Versuch beginnt.
  </Step>
</Steps>

Das persistierte Fallback-Override schließt dieses Fenster, und der gezielte Rollback bewahrt neuere manuelle oder laufzeitbezogene Sitzungsänderungen.

## Observability und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Fallback-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn alle Kandidaten fehlschlagen, löst OpenClaw `FallbackSummaryError` aus. Der äußere Reply-Runner kann damit eine spezifischere Nachricht erzeugen, etwa „alle Modelle sind vorübergehend rate-limited“, und den frühesten Cooldown-Ablauf einschließen, sofern bekannt.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zusammenhängende modellbezogene Rate Limits werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Blockierung ein passendes modellbezogenes Rate Limit ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell weiterhin blockiert

## Verwandte Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Routing von `agents.defaults.imageModel`

Siehe [Modelle](/de/concepts/models) für die umfassendere Übersicht zu Modellauswahl und Fallback.
