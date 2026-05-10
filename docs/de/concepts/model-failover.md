---
read_when:
    - Diagnose von Auth-Profil-Rotation, Abklingzeiten oder Modell-Fallback-Verhalten
    - Aktualisieren von Failover-Regeln für Authentifizierungsprofile oder Modelle
    - Wie sitzungsbezogene Modellüberschreibungen mit Fallback-Wiederholungsversuchen interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-05-10T19:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Auth-Profil-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Diese Dokumentation erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

<Steps>
  <Step title="Sitzungszustand auflösen">
    Lösen Sie das aktive Sitzungsmodell und die Auth-Profil-Präferenz auf.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Erstellen Sie die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle. Konfigurierte Standardwerte, Primärmodelle von Cron-Jobs und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen in Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Versuchen Sie den aktuellen Provider mit den Regeln für Auth-Profil-Rotation und Cooldown.
  </Step>
  <Step title="Bei Failover-würdigen Fehlern fortfahren">
    Wenn dieser Provider mit einem Failover-würdigen Fehler erschöpft ist, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Fallback-Override persistieren">
    Persistieren Sie den ausgewählten Fallback-Override, bevor der erneute Versuch startet, damit andere Sitzungsleser denselben Provider und dasselbe Modell sehen, die der Runner gleich verwenden wird. Der persistierte Modell-Override ist mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, rollen Sie nur die Fallback-eigenen Sitzungs-Override-Felder zurück, wenn sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.
  </Step>
  <Step title="FallbackSummaryError auslösen, wenn erschöpft">
    Wenn jeder Kandidat fehlschlägt, lösen Sie einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf aus, sofern einer bekannt ist.
  </Step>
</Steps>

Das ist bewusst enger als „die ganze Sitzung speichern und wiederherstellen“. Der Antwort-Runner persistiert nur die Felder der Modellauswahl, die ihm für den Fallback gehören:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Versuch neuere, nicht zugehörige Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Aktualisierungen der Sitzungsrotation, die während des Versuchs passiert sind.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider und das ausgewählte Modell davon, warum sie ausgewählt wurden. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Standardwert**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Agent-Primärmodell**: `agents.list[].model` ist strikt, sofern dieses Agent-Modellobjekt keine eigenen `fallbacks` enthält. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, um den Agent für Modell-Fallback zu aktivieren.
- **Automatischer Fallback-Override**: Ein Laufzeit-Fallback schreibt `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` und das ausgewählte Ursprungsmodell, bevor der erneute Versuch erfolgt. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen und wird durch `/new`, `/reset` und `sessions.reset` gelöscht. Heartbeat-Läufe ohne explizites `heartbeat.model` löschen außerdem einen direkten automatischen Override, wenn dessen Ursprung nicht mehr mit dem aktuellen konfigurierten Standard übereinstimmt.
- **Benutzer-Override für Sitzung**: `/model`, der Modell-Picker, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider oder das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt von einem nicht zugehörigen konfigurierten Fallback aus zu antworten.
- **Legacy-Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Nutzlastmodell**: Ein Cron-Job-`payload.model` / `--model` ist ein Job-Primärmodell, kein Benutzer-Override für eine Sitzung. Es verwendet konfigurierte Fallbacks, sofern der Job kein `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguration `auth.profiles` / `auth.order` sind **nur Metadaten + Routing** (keine Secrets).
- Nur für Legacy-Importe verwendete OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Mehr Details: [OAuth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen unterschiedliche Profile, damit mehrere Konten nebeneinander existieren können.

- Standard: `provider:default`, wenn keine E-Mail-Adresse verfügbar ist.
- OAuth mit E-Mail-Adresse: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

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

- **Primärer Schlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärer Schlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Profile im Cooldown oder deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungsbindung (cachefreundlich)

OpenClaw **pinnt das ausgewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten. Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler wird erhöht)
- das Profil im Cooldown oder deaktiviert ist

Manuelle Auswahl über `/model …@<profileId>` setzt einen **Benutzer-Override** für diese Sitzung und wird erst automatisch rotiert, wenn eine neue Sitzung beginnt.

<Note>
Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits oder Timeouts zu einem anderen Profil rotieren. Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### Warum OAuth „verloren aussehen“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüsselprofil für denselben Provider haben, kann Round-Robin zwischen Nachrichten zwischen ihnen wechseln, sofern sie nicht gepinnt sind. So erzwingen Sie ein einzelnes Profil:

- Pinnen Sie mit `auth.order[provider] = ["provider:profileId"]`, oder
- verwenden Sie einen Sitzungs-Override über `/model …` mit einem Profil-Override (wenn von Ihrer UI-/Chat-Oberfläche unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Ratenlimitfehlern fehlschlägt (oder aufgrund eines Timeouts, der wie Ratenlimitierung aussieht), markiert OpenClaw es im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was im Ratenlimit-/Timeout-Bucket landet">
    Dieser Ratenlimit-Bucket ist breiter als ein einfaches `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Nutzungsfensterlimits wie `weekly/monthly limit reached`.

    Format-/Invalid-Request-Fehler sind in der Regel terminal, weil ein erneuter Versuch mit derselben Nutzlast auf dieselbe Weise fehlschlagen würde; daher zeigt OpenClaw sie an, statt Auth-Profile zu rotieren. Bekannte Retry-Repair-Pfade können explizit optieren: Zum Beispiel werden Cloud Code Assist-Tool-Call-ID-Validierungsfehler bereinigt und einmal über die `allowFormatRetry`-Richtlinie erneut versucht. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel wird die einfache pi-ai-Stream-Wrapper-Meldung `An unknown error occurred` für jeden Provider als Failover-würdig behandelt, weil pi-ai sie ausgibt, wenn Provider-Streams ohne spezifische Details mit `stopReason: "aborted"` oder `stopReason: "error"` enden. JSON-`api_error`-Nutzlasten mit transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als Failover-würdige Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie das einfache `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich allein kein Failover aus.

  </Accordion>
  <Accordion title="SDK-Retry-After-Caps">
    Einige Provider-SDKs könnten andernfalls für ein langes `Retry-After`-Fenster warten, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms`- / `retry-after`-Wartezeiten standardmäßig auf 60 Sekunden und zeigt längere wiederholbare Antworten sofort an, damit dieser Failover-Pfad laufen kann. Passen Sie die Begrenzung mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Retry-Verhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Ratenlimit-Cooldowns können auch modellbezogen sein:

    - OpenClaw zeichnet `cooldownModel` für Ratenlimitfehler auf, wenn die fehlgeschlagene Modell-ID bekannt ist.
    - Ein Geschwistermodell auf demselben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell bezogen ist.
    - Abrechnungs-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

  </Accordion>
</AccordionGroup>

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Cap)

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

## Abrechnungsdeaktivierungen

Abrechnungs-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Failover-würdig behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede abrechnungsartig aussehende Antwort ist `402`, und nicht jedes HTTP-`402` landet hier. OpenClaw hält expliziten Abrechnungstext in der Abrechnungsspur, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber Provider-spezifische Matcher bleiben auf den Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Temporäre `402`-Nutzungsfenster- und Organisations-/Workspace-Ausgabenlimitfehler werden dagegen als `rate_limit` klassifiziert, wenn die Meldung wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Abrechnungsdeaktivierungspfad.
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

- Abrechnungs-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Überlastete erneute Versuche erlauben **1 Profilrotation beim selben Provider** vor dem Modell-Fallback.
- Überlastete erneute Versuche verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Ratenlimits und Timeouts, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler lösen kein Fallback aus). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Zustand trotzdem präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider keine nutzbare Nachricht oder keinen nutzbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau beibehalten hat, aber noch kein Klassifizierer darauf passte.

Überlastungs- und Ratenlimitfehler werden aggressiver behandelt als Abklingzeiten wegen Abrechnung. Standardmäßig erlaubt OpenClaw einen erneuten Versuch mit demselben Provider-Authentifizierungsprofil und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Busy-Signale wie `ModelNotReadyException` fallen in diese Überlastungskategorie. Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf vom konfigurierten Standard-Primärmodell, einem Cron-Job-Primärmodell, einem Agent-Primärmodell mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Agent-Primärmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Provider-/Modellüberschreibungen) sind strikt: Wenn dieser Provider oder dieses Modell nicht erreichbar ist oder fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt mit einem nicht verwandten Fallback zu antworten.

### Regeln für Kandidatenketten

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus den konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht anhand der Modell-Allowlist gefiltert. Sie werden als ausdrückliche Betreiberabsicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback derselben Provider-Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle Modell noch nicht Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine nicht verwandten konfigurierten Fallbacks eines anderen Providers an.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte Primärmodell am Ende angehängt, damit sich die Kette wieder auf den normalen Standard einpendeln kann, sobald frühere Kandidaten ausgeschöpft sind.
    - Wenn ein Aufrufer `fallbacksOverride` übergibt, verwendet der Runner genau das angeforderte Modell plus diese Überschreibungsliste. Eine leere Liste deaktiviert das Modell-Fallback und verhindert, dass das konfigurierte Primärmodell als verborgenes Wiederholungsziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler das Fallback fortsetzen

<Tabs>
  <Tab title="Wird fortgesetzt bei">
    - Authentifizierungsfehlern
    - Ratenlimits und ausgeschöpften Abklingzeiten
    - Überlastungs-/Provider-Busy-Fehlern
    - Timeout-artigen Failover-Fehlern
    - deaktivierter Abrechnung
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Wiederholungsschleife erzeugt
    - anderen nicht erkannten Fehlern, solange noch Kandidaten übrig sind

  </Tab>
  <Tab title="Wird nicht fortgesetzt bei">
    - expliziten Abbrüchen, die nicht Timeout-/Failover-artig sind
    - Kontextüberlauffehlern, die innerhalb der Compaction-/Wiederholungslogik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem abschließenden unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Überspringen wegen Abklingzeit gegenüber Probe-Verhalten

Wenn jedes Authentifizierungsprofil für einen Provider bereits in der Abklingzeit ist, überspringt OpenClaw diesen Provider nicht automatisch für immer. Es trifft eine Entscheidung pro Kandidat:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Persistente Authentifizierungsfehler überspringen sofort den gesamten Provider.
    - Deaktivierungen wegen Abrechnung werden in der Regel übersprungen, aber der Primärkandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primärkandidat kann nahe dem Ablauf der Abklingzeit geprüft werden, mit einer Drosselung pro Provider.
    - Fallback-Geschwister desselben Providers können trotz Abklingzeit versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Dies ist besonders relevant, wenn ein Ratenlimit modellbezogen ist und ein Geschwistermodell sich möglicherweise sofort erholen kann.
    - Transiente Abklingzeit-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider das providerübergreifende Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungsüberschreibungen und Live-Modellwechsel

Sitzungsmodelländerungen sind gemeinsamer Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und die Live-Sitzungsabstimmung lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Wiederholungen mit dem Live-Modellwechsel koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren für sich allein niemals einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modellüberschreibungen werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` maskiert zu werden.
- Bevor eine Fallback-Wiederholung startet, persistiert der Antwort-Runner die ausgewählten Fallback-Überschreibungsfelder im Sitzungseintrag.
- Automatische Fallback-Überschreibungen bleiben in späteren Turns ausgewählt, damit OpenClaw nicht bei jeder Nachricht ein bekanntermaßen fehlerhaftes Primärmodell prüft. `/new`, `/reset` und `sessions.reset` löschen automatisch gesetzte Überschreibungen und setzen die Sitzung auf den konfigurierten Standard zurück.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand abweicht, das aktive Fallback-Modell und den Grund.
- Die Live-Sitzungsabstimmung bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten Laufzeit-Modellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht verwandte Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und nur dann, wenn sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.

Dies verhindert den klassischen Wettlauf:

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
  <Step title="Live-Abstimmung liest veralteten Zustand">
    Die Live-Sitzungsabstimmung liest den veralteten Sitzungszustand.
  </Step>
  <Step title="Wiederholung zurückgesetzt">
    Die Wiederholung wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Die persistierte Fallback-Überschreibung schließt dieses Zeitfenster, und das enge Rollback hält neuere manuelle oder Laufzeit-Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die in Logs und benutzerseitige Abklingzeitmeldungen einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten außerdem flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), sodass Log- und Diagnose-Exporter den Primärfehler rekonstruieren können, selbst wenn auch das abschließende Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere Antwort-Runner kann dies nutzen, um eine spezifischere Meldung wie „alle Modelle sind vorübergehend ratenlimitiert“ zu erstellen und den frühesten Ablauf der Abklingzeit einzuschließen, wenn einer bekannt ist.

Diese Abklingzeitzusammenfassung ist modellbewusst:

- nicht verwandte modellbezogene Ratenlimits werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Sperre ein passendes modellbezogenes Ratenlimit ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für die umfassendere Übersicht zur Modellauswahl und zum Fallback.
