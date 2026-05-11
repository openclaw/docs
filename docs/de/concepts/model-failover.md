---
read_when:
    - Diagnose der Rotation von Authentifizierungsprofilen, von Abklingzeiten oder des Modell-Fallback-Verhaltens
    - Failover-Regeln für Auth-Profile oder Modelle aktualisieren
    - Verstehen, wie Modell-Overrides für Sitzungen mit Fallback-Retries interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Auth-Profile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-05-11T20:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Auth-Profile-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Lösen Sie das aktive Sitzungsmodell und die Auth-Profile-Präferenz auf.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Erstellen Sie die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle. Konfigurierte Standards, primäre Cron-Auftragsmodelle und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzersitzungsauswahlen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Versuchen Sie den aktuellen Provider mit Auth-Profile-Rotations- und Cooldown-Regeln.
  </Step>
  <Step title="Bei Failover-würdigen Fehlern fortfahren">
    Wenn dieser Provider mit einem Failover-würdigen Fehler ausgeschöpft ist, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Fallback-Override persistieren">
    Persistieren Sie den ausgewählten Fallback-Override, bevor der erneute Versuch startet, damit andere Sitzungsleser denselben Provider und dasselbe Modell sehen, die der Runner gleich verwenden wird. Der persistierte Modell-Override wird mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng begrenzt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, rollen Sie nur die Fallback-eigenen Sitzungs-Override-Felder zurück, sofern sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.
  </Step>
  <Step title="FallbackSummaryError auslösen, wenn erschöpft">
    Wenn jeder Kandidat fehlschlägt, lösen Sie einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf aus, sofern einer bekannt ist.
  </Step>
</Steps>

Dies ist bewusst enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der Reply-Runner persistiert nur die Modellauswahlfelder, die ihm für den Fallback gehören:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Wiederholungsversuch neuere, nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Sitzungsrotationsaktualisierungen, die während des laufenden Versuchs stattgefunden haben.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider und das ausgewählte Modell davon, warum sie ausgewählt wurden. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Standard**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Agent-Primärmodell**: `agents.list[].model` ist strikt, sofern dieses Agent-Modellobjekt keine eigenen `fallbacks` enthält. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, um diesen Agent für Modell-Fallback zu aktivieren.
- **Automatischer Fallback-Override**: Ein Laufzeit-Fallback schreibt vor dem erneuten Versuch `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` und das ausgewählte Ursprungsmodell. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen und wird durch `/new`, `/reset` und `sessions.reset` gelöscht. Heartbeat-Läufe ohne explizites `heartbeat.model` löschen außerdem einen direkten automatischen Override, wenn dessen Ursprung nicht mehr dem aktuellen konfigurierten Standard entspricht.
- **Benutzersitzungs-Override**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider oder das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt von einem nicht zusammenhängenden konfigurierten Fallback aus zu antworten.
- **Legacy-Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Payload-Modell**: Ein Cron-Auftrag `payload.model` / `--model` ist ein primäres Auftragsmodell, kein Benutzersitzungs-Override. Es verwendet konfigurierte Fallbacks, sofern der Auftrag kein `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguration `auth.profiles` / `auth.order` sind **nur Metadaten + Routing** (keine Secrets).
- Legacy-Datei nur für OAuth-Import: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Weitere Details: [OAuth](/de/concepts/oauth)

Credential-Typen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen getrennte Profile, damit mehrere Konten nebeneinander bestehen können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw die Reihenfolge wie folgt:

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
- **Cooldown-/deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungsbindung (cachefreundlich)

OpenClaw **heftet das ausgewählte Auth-Profil pro Sitzung an**, damit Provider-Caches warm bleiben. Es rotiert **nicht** bei jeder Anfrage. Das angeheftete Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler wird erhöht)
- das Profil in einer Abkühlphase/deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` legt eine **Benutzerüberschreibung** für diese Sitzung fest und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

<Note>
Automatisch angeheftete Profile (vom Sitzungs-Router ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits/Timeouts zu einem anderen Profil rotieren. Wenn das ursprüngliche Profil wieder verfügbar ist, können neue Läufe es wieder bevorzugen, ohne das ausgewählte Modell oder die Runtime zu ändern. Vom Benutzer angeheftete Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### OpenAI Codex-Abonnement plus API-Schlüssel-Backup

Für OpenAI-Agentenmodelle sind Authentifizierung und Runtime getrennt. `openai/gpt-*` bleibt auf
dem Codex-Harness, während die Authentifizierung zwischen einem Codex-Abonnementprofil und
einem OpenAI-API-Schlüssel-Backup rotieren kann.

Verwenden Sie `auth.order.openai` für die benutzerseitige Reihenfolge:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Vorhandene Codex-Abonnementprofile können weiterhin die ältere
`openai-codex:*`-Profil-ID verwenden. Das geordnete API-Schlüssel-Backup kann ein normales
`openai:*`-API-Schlüsselprofil sein. Wenn das Abonnement ein Codex-Nutzungslimit erreicht,
zeichnet OpenClaw die genaue Zurücksetzungszeit auf, sofern Codex eine bereitstellt, versucht das nächste
geordnete Auth-Profil und hält den Lauf innerhalb des Codex-Harness. Sobald die Zurücksetzungszeit
verstrichen ist, ist das Abonnementprofil wieder zulässig, und die nächste automatische
Auswahl kann zu ihm zurückkehren.

Verwenden Sie ein vom Benutzer angeheftetes Profil nur, wenn Sie für diese
Sitzung ein Konto/einen Schlüssel erzwingen möchten. Vom Benutzer angeheftete Profile sind absichtlich strikt und springen nicht stillschweigend
zu einem anderen Profil.

## Abkühlphasen

Wenn ein Profil aufgrund von Authentifizierungs-/Ratenlimitfehlern fehlschlägt (oder aufgrund eines Timeouts, der wie Ratenbegrenzung aussieht), markiert OpenClaw es mit einer Abkühlphase und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was in den Rate-Limit-/Timeout-Bucket fällt">
    Dieser Rate-Limit-Bucket ist weiter gefasst als ein einfaches `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Nutzungsfenster-Limits wie `weekly/monthly limit reached`.

    Format-/Invalid-Request-Fehler sind in der Regel terminal, weil ein erneuter Versuch mit derselben Payload auf dieselbe Weise fehlschlagen würde. Daher gibt OpenClaw sie aus, statt Auth-Profile zu rotieren. Bekannte Retry-Reparaturpfade können sich explizit dafür entscheiden: Beispielsweise werden Validierungsfehler bei Cloud Code Assist Tool-Call-IDs bereinigt und über die `allowFormatRetry`-Policy einmal erneut versucht. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem bekannten transienten Muster entspricht. Beispielsweise wird die bloße pi-ai Stream-Wrapper-Meldung `An unknown error occurred` für jeden Provider als failoverwürdig behandelt, weil pi-ai sie ausgibt, wenn Provider-Streams ohne spezifische Details mit `stopReason: "aborted"` oder `stopReason: "error"` enden. JSON-`api_error`-Payloads mit transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als failoverwürdige Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie das bloße `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich genommen kein Failover aus.

  </Accordion>
  <Accordion title="SDK-Retry-After-Obergrenzen">
    Einige Provider-SDKs warten andernfalls möglicherweise ein langes `Retry-After`-Fenster ab, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms`- / `retry-after`-Wartezeiten standardmäßig auf 60 Sekunden und gibt längere wiederholbare Antworten sofort aus, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Retry-Verhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Rate-Limit-Cooldowns können auch modellbezogen sein:

    - OpenClaw zeichnet `cooldownModel` für Rate-Limit-Fehler auf, wenn die ID des fehlgeschlagenen Modells bekannt ist.
    - Ein verwandtes Modell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell beschränkt ist.
    - Abrechnungs-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

  </Accordion>
</AccordionGroup>

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

Der Zustand wird in `auth-state.json` unter `usageStats` gespeichert:

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

Fehler bei Abrechnung/Guthaben (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Grund für ein Failover behandelt, sind aber in der Regel nicht vorübergehend. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit einem längeren Backoff) und wechselt zum nächsten Profil/Provider.

<Note>
Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jede HTTP-`402` landet hier. OpenClaw hält expliziten Abrechnungstext in der Abrechnungsspur, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Inzwischen werden temporäre `402`-Fehler für Nutzungsfenster und Spend-Limits von Organisationen/Workspaces als `rate_limit` klassifiziert, wenn die Meldung wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Pfad für deaktivierte Abrechnung.
</Note>

Der Zustand wird in `auth-state.json` gespeichert:

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

- Der Billing-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Billing-Fehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Overloaded-Wiederholungen erlauben **1 Profilrotation beim selben Provider** vor dem Modell-Fallback.
- Overloaded-Wiederholungen verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Rate Limits und Timeouts, die die Profilrotation ausgeschöpft haben (andere Fehler lösen keinen Fallback aus). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Zustand trotzdem präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider keine verwendbare Nachricht oder keinen verwendbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau beibehalten hat, aber noch kein Klassifizierer darauf passt.

Overloaded- und Rate-Limit-Fehler werden aggressiver behandelt als Billing-Cooldowns. Standardmäßig erlaubt OpenClaw eine Auth-Profil-Wiederholung beim selben Provider und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Overloaded-Bucket. Stimmen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` ab.

Wenn ein Lauf vom konfigurierten primären Standardmodell, einem Cron-Job-Primärmodell, einem Agent-Primärmodell mit expliziten Fallbacks oder einem automatisch ausgewählten Fallback-Override startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Agent-Primärmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Provider-/Modell-Overrides) sind strikt: Wenn dieser Provider/dieses Modell nicht erreichbar ist oder vor dem Erzeugen einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt aus einem nicht zugehörigen Fallback zu antworten.

### Regeln für die Kandidatenkette

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht anhand der Modell-Allowlist gefiltert. Sie werden als ausdrückliche Operator-Absicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-Familie ist, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn kein expliziter Fallback-Override angegeben ist, werden konfigurierte Fallbacks vor dem konfigurierten Primärmodell versucht, auch wenn das angeforderte Modell einen anderen Provider verwendet.
    - Wenn dem Fallback-Runner kein expliziter Fallback-Override übergeben wird, wird das konfigurierte Primärmodell am Ende angehängt, damit die Kette nach Ausschöpfen früherer Kandidaten wieder auf den normalen Standard zurückfallen kann.
    - Wenn ein Aufrufer `fallbacksOverride` übergibt, verwendet der Runner exakt das angeforderte Modell plus diese Override-Liste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte Primärmodell als verborgenes Wiederholungsziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Wird fortgesetzt bei">
    - Authentifizierungsfehlern
    - Rate Limits und ausgeschöpften Cooldowns
    - Overloaded-/Provider-Busy-Fehlern
    - Timeout-förmigen Failover-Fehlern
    - Billing-Deaktivierungen
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Wiederholungsschleife erzeugt
    - anderen nicht erkannten Fehlern, wenn noch Kandidaten übrig sind

  </Tab>
  <Tab title="Wird nicht fortgesetzt bei">
    - expliziten Abbrüchen, die nicht timeout-/failover-förmig sind
    - Kontextüberlauf-Fehlern, die innerhalb der Compaction-/Wiederholungslogik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem abschließenden unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Verhalten bei Cooldown-Überspringen vs. Probe

Wenn jedes Auth-Profil für einen Provider bereits im Cooldown ist, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Es trifft eine Entscheidung pro Kandidat:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Persistente Authentifizierungsfehler überspringen sofort den gesamten Provider.
    - Billing-Deaktivierungen werden normalerweise übersprungen, aber der Primärkandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primärkandidat kann kurz vor Ablauf des Cooldowns mit einer Drosselung pro Provider geprüft werden.
    - Fallback-Geschwister beim selben Provider können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Rate Limit modellbezogen ist und ein Geschwistermodell sich möglicherweise sofort erholt.
    - Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den Provider-übergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungs-Overrides und Live-Modellwechsel

Sitzungsmodelländerungen sind geteilter Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsupdates und die Live-Sitzungsabstimmung lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Wiederholungen mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Overrides oder Compaction markieren für sich allein nie einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modell-Overrides werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` maskiert zu werden.
- Bevor eine Fallback-Wiederholung startet, persistiert der Reply-Runner die ausgewählten Fallback-Override-Felder im Sitzungseintrag.
- Automatische Fallback-Overrides bleiben in nachfolgenden Turns ausgewählt, damit OpenClaw nicht bei jeder Nachricht ein bekanntermaßen defektes Primärmodell prüft. `/new`, `/reset` und `sessions.reset` löschen automatisch gesetzte Overrides und setzen die Sitzung auf den konfigurierten Standard zurück.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand abweicht, das aktive Fallback-Modell und den Grund.
- Die Live-Sitzungsabstimmung bevorzugt persistierte Sitzungs-Overrides gegenüber veralteten Laufzeit-Modellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht zugehörige Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die von ihm geschriebenen Override-Felder zurück, und nur wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.

Dies verhindert das klassische Race:

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
  <Step title="Wiederholung springt zurück">
    Die Wiederholung wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Der persistierte Fallback-Override schließt dieses Zeitfenster, und das enge Rollback hält neuere manuelle oder Laufzeit-Sitzungsänderungen intakt.

## Observability und Fehlersummaries

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten außerdem flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), sodass Log- und Diagnose-Exporter den primären Fehler rekonstruieren können, selbst wenn auch der abschließende Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, wirft OpenClaw `FallbackSummaryError`. Der äußere Reply-Runner kann dies verwenden, um eine spezifischere Meldung zu erstellen, etwa „alle Modelle sind vorübergehend rate-limitiert“, und den frühesten Cooldown-Ablauf einzubeziehen, wenn einer bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zugehörige modellbezogene Rate Limits werden für die versuchte Provider-/Modell-Kette ignoriert
- wenn die verbleibende Blockade ein passendes modellbezogenes Rate Limit ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für die breitere Übersicht zu Modellauswahl und Fallback.
