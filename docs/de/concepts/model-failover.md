---
read_when:
    - Diagnose der Authentifizierungsprofil-Rotation, von Abklingzeiten oder des Modell-Fallback-Verhaltens
    - Aktualisieren von Failover-Regeln für Auth-Profile oder Modelle
    - Verstehen, wie Modellüberschreibungen auf Sitzungsebene mit Fallback-Wiederholungen interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-05-06T06:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Phasen:

1. **Auth-Profil-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf bewertet OpenClaw Kandidaten in dieser Reihenfolge:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Das aktive Sitzungsmodell und die Auth-Profil-Präferenz auflösen.
  </Step>
  <Step title="Kandidatenkette aufbauen">
    Die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle aufbauen. Konfigurierte Standardwerte, Primärmodelle von Cron-Jobs und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen für Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Den aktuellen Provider mit Auth-Profil-Rotations-/Cooldown-Regeln versuchen.
  </Step>
  <Step title="Bei Failover-relevanten Fehlern fortfahren">
    Wenn dieser Provider mit einem Failover-relevanten Fehler ausgeschöpft ist, zum nächsten Modellkandidaten wechseln.
  </Step>
  <Step title="Fallback-Override dauerhaft speichern">
    Den ausgewählten Fallback-Override dauerhaft speichern, bevor der erneute Versuch startet, damit andere Sitzungsleser denselben Provider/dasselbe Modell sehen, das der Runner gleich verwenden wird. Der gespeicherte Modell-Override wird mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng begrenzt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, nur die sitzungsbezogenen Override-Felder zurückrollen, die dem Fallback gehören, wenn sie weiterhin diesem fehlgeschlagenen Kandidaten entsprechen.
  </Step>
  <Step title="FallbackSummaryError auslösen, wenn ausgeschöpft">
    Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf auslösen, sofern einer bekannt ist.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der Reply-Runner speichert nur die Modellauswahlfelder dauerhaft, die er für Fallbacks besitzt:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Wiederholungsversuch neuere, nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Sitzungsrotations-Updates, die während des laufenden Versuchs stattgefunden haben.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider/das ausgewählte Modell davon, warum es ausgewählt wurde. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Standardwert**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Agent-Primärmodell**: `agents.list[].model` ist strikt, es sei denn, dieses Agent-Modellobjekt enthält eigene `fallbacks`. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, um diesen Agent für Modell-Fallbacks zu aktivieren.
- **Automatischer Fallback-Override**: Ein Laufzeit-Fallback schreibt `providerOverride`, `modelOverride` und `modelOverrideSource: "auto"` vor dem erneuten Versuch. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen und wird durch `/new`, `/reset` und `sessions.reset` gelöscht.
- **Benutzer-Sitzungs-Override**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider/das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wurde, meldet OpenClaw den Fehler, statt von einem nicht zusammenhängenden konfigurierten Fallback zu antworten.
- **Legacy-Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` haben. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Payload-Modell**: Ein Cron-Job `payload.model` / `--model` ist ein Job-Primärmodell, kein Benutzer-Sitzungs-Override. Es verwendet konfigurierte Fallbacks, sofern der Job nicht `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Laufzeitstatus für Auth-Routing befindet sich in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Die Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Secrets).
- Legacy-Datei nur für OAuth-Importe: `~/.openclaw/credentials/oauth.json` (wird bei erster Verwendung in `auth-profiles.json` importiert).

Weitere Details: [OAuth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen eigene Profile, damit mehrere Konten nebeneinander bestehen können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

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

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Profile im Cooldown/deaktivierte Profile** werden ans Ende verschoben, sortiert nach frühestem Ablauf.

### Sitzungsbindung (cachefreundlich)

OpenClaw **pinnt das ausgewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten. Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler erhöht sich)
- das Profil im Cooldown/deaktiviert ist

Manuelle Auswahl über `/model …@<profileId>` setzt einen **Benutzer-Override** für diese Sitzung und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

<Note>
Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Rate Limits/Timeouts zu einem anderen Profil rotieren. Benutzergepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### Warum OAuth „verloren aussehen“ kann

Wenn Sie für denselben Provider sowohl ein OAuth-Profil als auch ein API-Schlüssel-Profil haben, kann Round-Robin zwischen Nachrichten zwischen ihnen wechseln, sofern kein Profil gepinnt ist. Um ein einzelnes Profil zu erzwingen:

- Pinnen Sie mit `auth.order[provider] = ["provider:profileId"]`, oder
- verwenden Sie einen sitzungsbezogenen Override über `/model …` mit einem Profil-Override (sofern von Ihrer UI-/Chat-Oberfläche unterstützt).

## Cooldowns

Wenn ein Profil wegen Auth-/Rate-Limit-Fehlern fehlschlägt (oder wegen eines Timeouts, der wie Rate Limiting aussieht), markiert OpenClaw es im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was im Rate-Limit-/Timeout-Bucket landet">
    Dieser Rate-Limit-Bucket ist breiter als einfaches `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Nutzungslimits wie `weekly/monthly limit reached`.

    Format-/Invalid-Request-Fehler (zum Beispiel Cloud Code Assist-Validierungsfehler für Tool-Call-IDs) werden als Failover-relevant behandelt und verwenden dieselben Cooldowns. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel wird die reine pi-ai-Stream-Wrapper-Meldung `An unknown error occurred` für jeden Provider als Failover-relevant behandelt, weil pi-ai sie ausgibt, wenn Provider-Streams ohne konkrete Details mit `stopReason: "aborted"` oder `stopReason: "error"` enden. JSON-`api_error`-Payloads mit transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als Failover-relevante Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie reines `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich allein kein Failover aus.

  </Accordion>
  <Accordion title="SDK-Retry-After-Obergrenzen">
    Einige Provider-SDKs würden andernfalls möglicherweise für ein langes `Retry-After`-Fenster schlafen, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms`- / `retry-after`-Wartezeiten standardmäßig auf 60 Sekunden und gibt längere wiederholbare Antworten sofort weiter, damit dieser Failover-Pfad laufen kann. Passen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Wiederholungsverhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Rate-Limit-Cooldowns können auch modellbezogen sein:

    - OpenClaw erfasst `cooldownModel` für Rate-Limit-Fehler, wenn die fehlgeschlagene Modell-ID bekannt ist.
    - Ein Schwestermodell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell beschränkt ist.
    - Billing-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil modellübergreifend.

  </Accordion>
</AccordionGroup>

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

## Billing-Deaktivierungen

Billing-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Failover-relevant behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede billingartige Antwort ist `402`, und nicht jede HTTP-`402` landet hier. OpenClaw hält expliziten Billing-Text in der Billing-Spur, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber Provider-spezifische Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Temporäre `402`-Nutzungsfenster- und Organisations-/Arbeitsbereich-Ausgabenlimitfehler werden unterdessen als `rate_limit` klassifiziert, wenn die Meldung wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Billing-Deaktivierungspfad.
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

- Billing-Backoff startet bei **5 Stunden**, verdoppelt sich pro Billing-Fehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Überlastungs-Wiederholungen erlauben **1 Profilrotation beim selben Provider** vor dem Modell-Fallback.
- Überlastungs-Wiederholungen verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Rate Limits und Timeouts, die die Profilrotation ausgeschöpft haben (andere Fehler führen den Fallback nicht fort). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Status weiterhin präzise bezeichnet: `empty_response` bedeutet, dass der Provider keine verwendbare Nachricht oder keinen verwendbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider explizit `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau bewahrt hat, aber noch kein Klassifizierer darauf gepasst hat.

Überlastungs- und Rate-Limit-Fehler werden aggressiver behandelt als Abrechnungs-Cooldowns. Standardmäßig erlaubt OpenClaw einen Retry eines Authentifizierungsprofils beim selben Provider und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Überlastungs-Bucket. Stimmen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` ab.

Wenn eine Ausführung vom konfigurierten Standard-Primärmodell, einem Cron-Job-Primärmodell, einem Agent-Primärmodell mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Agent-Primärmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, der Modellauswahldialog, `sessions.patch` oder einmalige CLI-Provider-/Modell-Überschreibungen) sind strikt: Wenn dieser Provider/dieses Modell nicht erreichbar ist oder fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt über einen nicht zugehörigen Fallback zu antworten.

### Regeln für Kandidatenketten

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus den konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-Allowlist gefiltert. Sie werden als explizite Betreiberabsicht behandelt.
    - Wenn die aktuelle Ausführung bereits auf einem konfigurierten Fallback in derselben Provider-Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn die aktuelle Ausführung auf einem anderen Provider als der Konfiguration läuft und dieses aktuelle Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine nicht zugehörigen konfigurierten Fallbacks eines anderen Providers an.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte Primärmodell am Ende angehängt, damit die Kette nach dem Ausschöpfen früherer Kandidaten wieder zum normalen Standard zurückkehren kann.
    - Wenn ein Aufrufer `fallbacksOverride` übergibt, verwendet der Runner exakt das angeforderte Modell plus diese Überschreibungsliste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte Primärmodell als verborgenes Retry-Ziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Wird fortgesetzt bei">
    - Authentifizierungsfehlern
    - Rate Limits und erschöpften Cooldowns
    - Überlastungs-/Provider-Busy-Fehlern
    - Timeout-artigen Failover-Fehlern
    - Abrechnungsdeaktivierungen
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
    - anderen nicht erkannten Fehlern, wenn noch weitere Kandidaten verbleiben

  </Tab>
  <Tab title="Wird nicht fortgesetzt bei">
    - expliziten Abbrüchen, die nicht Timeout-/Failover-artig sind
    - Kontextüberlauffehlern, die in der Compaction-/Retry-Logik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Cooldown-Überspringen im Vergleich zum Probe-Verhalten

Wenn sich jedes Authentifizierungsprofil für einen Provider bereits im Cooldown befindet, überspringt OpenClaw diesen Provider nicht automatisch für immer. Es trifft eine Entscheidung pro Kandidat:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Dauerhafte Authentifizierungsfehler überspringen sofort den gesamten Provider.
    - Abrechnungsdeaktivierungen überspringen in der Regel, aber der Primärkandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primärkandidat kann nahe am Ablauf des Cooldowns geprüft werden, mit einer Drosselung pro Provider.
    - Fallback-Geschwister beim selben Provider können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Rate Limit modellbezogen ist und ein Geschwistermodell sich möglicherweise sofort erholen kann.
    - Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Ausführung begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungsüberschreibungen und Live-Modellwechsel

Sitzungsmodelländerungen sind geteilter Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und der Live-Sitzungsabgleich lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren von sich aus nie einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modellüberschreibungen werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` verdeckt zu werden.
- Bevor ein Fallback-Retry startet, persistiert der Reply-Runner die ausgewählten Fallback-Überschreibungsfelder im Sitzungseintrag.
- Automatische Fallback-Überschreibungen bleiben in nachfolgenden Turns ausgewählt, damit OpenClaw nicht bei jeder Nachricht ein bekanntermaßen fehlerhaftes Primärmodell prüft. `/new`, `/reset` und `sessions.reset` löschen automatisch bezogene Überschreibungen und setzen die Sitzung auf den konfigurierten Standard zurück.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand abweicht, das aktive Fallback-Modell und den Grund.
- Der Live-Sitzungsabgleich bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten Laufzeitmodellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht zugehörige Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und nur wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.

Dies verhindert das klassische Rennen:

<Steps>
  <Step title="Primärmodell schlägt fehl">
    Das ausgewählte Primärmodell schlägt fehl.
  </Step>
  <Step title="Fallback im Speicher ausgewählt">
    Der Fallback-Kandidat wird im Speicher ausgewählt.
  </Step>
  <Step title="Sitzungsspeicher zeigt noch altes Primärmodell">
    Der Sitzungsspeicher spiegelt noch das alte Primärmodell wider.
  </Step>
  <Step title="Live-Abgleich liest veralteten Zustand">
    Der Live-Sitzungsabgleich liest den veralteten Sitzungszustand.
  </Step>
  <Step title="Retry zurückgesetzt">
    Der Retry wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Die persistierte Fallback-Überschreibung schließt dieses Zeitfenster, und der enge Rollback hält neuere manuelle oder Laufzeitsitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten auch flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), damit Log- und Diagnose-Exporter den Primärfehler rekonstruieren können, selbst wenn auch der finale Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, wirft OpenClaw `FallbackSummaryError`. Der äußere Reply-Runner kann dies nutzen, um eine spezifischere Meldung zu erstellen, etwa „alle Modelle sind vorübergehend rate-limitiert“, und den frühesten Cooldown-Ablauf einzuschließen, wenn einer bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zugehörige modellbezogene Rate Limits werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Blockierung ein passendes modellbezogenes Rate Limit ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für die umfassendere Übersicht über Modellauswahl und Fallback.
