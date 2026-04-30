---
read_when:
    - Diagnose der Rotation von Auth-Profilen, von Cooldowns oder des Modell-Fallback-Verhaltens
    - Failover-Regeln für Auth-Profile oder Modelle aktualisieren
    - Verstehen, wie Modellüberschreibungen auf Sitzungsebene mit Fallback-Wiederholungsversuchen interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-30T06:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Phasen:

1. **Auth-Profil-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, auf denen sie basieren.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Lösen Sie das aktive Sitzungsmodell und die Auth-Profil-Präferenz auf.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Erstellen Sie die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle. Konfigurierte Standards, primäre Cron-Job-Modelle und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen in Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Versuchen Sie den aktuellen Provider mit den Regeln für Auth-Profil-Rotation und Cooldowns.
  </Step>
  <Step title="Bei failoverrelevanten Fehlern fortfahren">
    Wenn dieser Provider mit einem failoverrelevanten Fehler ausgeschöpft ist, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Fallback-Override speichern">
    Speichern Sie den ausgewählten Fallback-Override, bevor der erneute Versuch startet, damit andere Sitzungsleser denselben Provider und dasselbe Modell sehen, die der Runner gleich verwenden wird. Der gespeicherte Modell-Override wird mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng begrenzt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, rollen Sie nur die sitzungsbezogenen Override-Felder zurück, die dem Fallback gehören, sofern sie noch diesem fehlgeschlagenen Kandidaten entsprechen.
  </Step>
  <Step title="FallbackSummaryError auslösen, wenn alles ausgeschöpft ist">
    Wenn jeder Kandidat fehlschlägt, lösen Sie einen `FallbackSummaryError` mit Details pro Versuch und der frühesten Cooldown-Ablaufzeit aus, sofern eine bekannt ist.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die ganze Sitzung speichern und wiederherstellen“. Der Antwort-Runner speichert nur die Felder der Modellauswahl, die ihm für den Fallback gehören:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Versuch neuere, nicht zusammenhängende Sitzungsänderungen überschreibt, etwa manuelle `/model`-Änderungen oder Aktualisierungen der Sitzungsrotation, die während des laufenden Versuchs passiert sind.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider und das ausgewählte Modell von dem Grund, warum sie ausgewählt wurden. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Standard**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Agent-Primärmodell**: `agents.list[].model` ist strikt, sofern dieses Agent-Modellobjekt keine eigenen `fallbacks` enthält. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, damit dieser Agent Modell-Fallback verwendet.
- **Automatischer Fallback-Override**: Ein Laufzeit-Fallback schreibt `providerOverride`, `modelOverride` und `modelOverrideSource: "auto"`, bevor der erneute Versuch startet. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen und wird durch `/new`, `/reset` und `sessions.reset` gelöscht.
- **Benutzer-Override für die Sitzung**: `/model`, der Modell-Picker, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider oder das ausgewählte Modell vor dem Erzeugen einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt aus einem nicht zusammenhängenden konfigurierten Fallback zu antworten.
- **Älterer Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Modell in der Cron-Payload**: Ein Cron-Job-`payload.model` / `--model` ist ein Job-Primärmodell, kein Benutzer-Override für die Sitzung. Es verwendet konfigurierte Fallbacks, sofern der Job kein `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

## Auth-Speicherung (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Tokens.

- Geheime Zugangsdaten befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing befindet sich in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Die Konfiguration `auth.profiles` / `auth.order` besteht **nur aus Metadaten + Routing** (keine geheimen Zugangsdaten).
- Ältere, nur für den Import verwendete OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert).

Weitere Details: [OAuth](/de/concepts/oauth)

Typen von Zugangsdaten:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen eigene Profile, damit mehrere Konten koexistieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie diese:

<Steps>
  <Step title="Explizite Konfiguration">
    `auth.order[provider]` (falls festgelegt).
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
- **Profile im Cooldown/deaktivierte Profile** werden ans Ende verschoben, geordnet nach frühestem Ablauf.

### Sitzungsbindung (cachefreundlich)

OpenClaw **fixiert das gewählte Auth-Profil pro Sitzung**, damit Provider-Caches warm bleiben. Es rotiert **nicht** bei jeder Anfrage. Das fixierte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen wird (Compaction-Zähler wird erhöht)
- das Profil im Cooldown/deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` setzt einen **Benutzer-Override** für diese Sitzung und wird nicht automatisch rotiert, bis eine neue Sitzung beginnt.

<Note>
Automatisch fixierte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Rate-Limits/Timeouts zu einem anderen Profil rotieren. Vom Benutzer fixierte Profile bleiben an dieses Profil gebunden; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### Warum OAuth „verloren“ erscheinen kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüsselprofil für denselben Provider haben, kann Round-Robin zwischen ihnen über Nachrichten hinweg wechseln, sofern kein Profil fixiert ist. Um ein einzelnes Profil zu erzwingen:

- Fixieren Sie es mit `auth.order[provider] = ["provider:profileId"]`, oder
- verwenden Sie einen sitzungsbezogenen Override über `/model …` mit einem Profil-Override (wenn Ihre UI-/Chat-Oberfläche dies unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Rate-Limit-Fehlern fehlschlägt (oder aufgrund eines Timeouts, der wie Rate-Limiting aussieht), markiert OpenClaw es im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was in der Rate-Limit-/Timeout-Kategorie landet">
    Diese Rate-Limit-Kategorie ist breiter als ein bloßes `429`: Sie umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Nutzungsfenster-Limits wie `weekly/monthly limit reached`.

    Formatfehler/Fehler durch ungültige Anfragen (zum Beispiel Validierungsfehler für Cloud Code Assist-Tool-Call-IDs) werden als failoverrelevant behandelt und verwenden dieselben Cooldowns. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in dieser Timeout-Kategorie landen, wenn die Quelle zu einem bekannten vorübergehenden Muster passt. Zum Beispiel wird die reine pi-ai-Stream-Wrapper-Meldung `An unknown error occurred` für jeden Provider als failoverrelevant behandelt, weil pi-ai sie ausgibt, wenn Provider-Streams mit `stopReason: "aborted"` oder `stopReason: "error"` ohne konkrete Details enden. JSON-`api_error`-Payloads mit vorübergehendem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als failoverrelevante Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie das bloße `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich allein kein Failover aus.

  </Accordion>
  <Accordion title="SDK-Retry-After-Begrenzungen">
    Einige Provider-SDKs würden sonst möglicherweise für ein langes `Retry-After`-Fenster schlafen, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms` / `retry-after`-Wartezeiten standardmäßig auf 60 Sekunden und macht längere wiederholbare Antworten sofort sichtbar, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Begrenzung mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Wiederholungsverhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Rate-Limit-Cooldowns können auch modellbezogen sein:

    - OpenClaw zeichnet `cooldownModel` für Rate-Limit-Fehler auf, wenn die ID des fehlgeschlagenen Modells bekannt ist.
    - Ein anderes Modell auf demselben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell beschränkt ist.
    - Abrechnungs-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil modellübergreifend.

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

## Abrechnungsbedingte Deaktivierungen

Abrechnungs-/Guthabenfehler (zum Beispiel „unzureichendes Guthaben“ / „Guthaben zu niedrig“) werden als failoverrelevant behandelt, sind aber normalerweise nicht vorübergehend. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jedes HTTP-`402` landet hier. OpenClaw belässt expliziten Abrechnungstext in der Abrechnungskategorie, selbst wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Temporäre `402`-Nutzungsfenster- und Organisations-/Workspace-Ausgabenlimitfehler werden dagegen als `rate_limit` klassifiziert, wenn die Meldung wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Pfad für abrechnungsbedingte Deaktivierung.
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

Standards:

- Das Abrechnungs-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil seit **24 Stunden** nicht fehlgeschlagen ist (konfigurierbar).
- Überlastungs-Retries erlauben **1 Rotation eines Profils desselben Providers** vor dem Modell-Fallback.
- Überlastungs-Retries verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Rate-Limits und Timeouts, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler führen den Fallback nicht fort). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Status dennoch präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider keine nutzbare Meldung oder keinen nutzbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider explizit `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau beibehalten hat, aber noch kein Klassifizierer darauf gepasst hat.

Überlastungs- und Rate-Limit-Fehler werden aggressiver behandelt als Billing-Cooldowns. Standardmäßig erlaubt OpenClaw einen Retry mit einem Auth-Profil desselben Providers und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Busy-Signale wie `ModelNotReadyException` fallen in diesen Überlastungsbereich. Stimmen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` ab.

Wenn ein Lauf mit dem konfigurierten primären Standardmodell, einem primären Modell eines Cron-Jobs, einem primären Modell eines Agents mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Primäre Modelle von Agents ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Überschreibungen für Provider/Modell) sind strikt: Wenn dieser Provider/dieses Modell nicht erreichbar ist oder vor dem Erzeugen einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt über einen nicht zugehörigen Fallback zu antworten.

### Regeln für Kandidatenketten

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Rules">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht anhand der Modell-Allowlist gefiltert. Sie werden als explizite Betreiberabsicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine nicht zugehörigen konfigurierten Fallbacks eines anderen Providers an.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte primäre Modell am Ende angehängt, damit sich die Kette wieder auf den normalen Standard zurücksetzen kann, sobald frühere Kandidaten ausgeschöpft sind.
    - Wenn ein Aufrufer `fallbacksOverride` übergibt, verwendet der Runner exakt das angeforderte Modell plus diese Überschreibungsliste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte primäre Modell als verborgenes Retry-Ziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Continues on">
    - Auth-Fehler
    - Rate Limits und ausgeschöpfte Cooldowns
    - Überlastungs-/Provider-Busy-Fehler
    - Failover-Fehler mit Timeout-Charakter
    - Billing-Deaktivierungen
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
    - andere nicht erkannte Fehler, wenn noch Kandidaten übrig sind

  </Tab>
  <Tab title="Does not continue on">
    - explizite Abbrüche, die keinen Timeout-/Failover-Charakter haben
    - Kontextüberlauf-Fehler, die innerhalb der Compaction-/Retry-Logik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - ein letzter unbekannter Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Cooldown-Überspringen gegenüber Probe-Verhalten

Wenn sich bereits jedes Auth-Profil eines Providers im Cooldown befindet, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Es trifft pro Kandidat eine Entscheidung:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Dauerhafte Auth-Fehler überspringen sofort den gesamten Provider.
    - Billing-Deaktivierungen werden normalerweise übersprungen, aber der primäre Kandidat kann weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der primäre Kandidat kann nahe am Ablauf des Cooldowns geprüft werden, mit einer Drosselung pro Provider.
    - Fallback-Geschwister desselben Providers können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Rate Limit modellbezogen ist und ein Geschwistermodell sich möglicherweise sofort erholen kann.
    - Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Session-Überschreibungen und Live-Modellwechsel

Änderungen am Session-Modell sind geteilter Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Session-Aktualisierungen und die Live-Session-Abstimmung lesen oder schreiben alle Teile desselben Session-Eintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren für sich genommen niemals einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modellüberschreibungen werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` verdeckt zu werden.
- Bevor ein Fallback-Retry startet, persistiert der Reply-Runner die ausgewählten Fallback-Überschreibungsfelder im Session-Eintrag.
- Automatische Fallback-Überschreibungen bleiben in nachfolgenden Durchläufen ausgewählt, damit OpenClaw nicht bei jeder Nachricht ein bekannt fehlerhaftes primäres Modell prüft. `/new`, `/reset` und `sessions.reset` löschen automatisch stammende Überschreibungen und setzen die Session auf den konfigurierten Standard zurück.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand abweicht, das aktive Fallback-Modell und den Grund.
- Die Live-Session-Abstimmung bevorzugt persistierte Session-Überschreibungen gegenüber veralteten Runtime-Modellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht zugehörige Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück, die er geschrieben hat, und nur, wenn sie noch zu diesem fehlgeschlagenen Kandidaten passen.

Das verhindert das klassische Rennen:

<Steps>
  <Step title="Primary fails">
    Das ausgewählte primäre Modell schlägt fehl.
  </Step>
  <Step title="Fallback chosen in memory">
    Der Fallback-Kandidat wird im Speicher ausgewählt.
  </Step>
  <Step title="Session store still says old primary">
    Der Session-Speicher verweist weiterhin auf das alte primäre Modell.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Die Live-Session-Abstimmung liest den veralteten Session-Zustand.
  </Step>
  <Step title="Retry snapped back">
    Der Retry wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Die persistierte Fallback-Überschreibung schließt dieses Zeitfenster, und das enge Rollback hält neuere manuelle oder Runtime-Session-Änderungen intakt.

## Observability und Fehlersummaries

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten auch flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), sodass Log- und Diagnose-Exporter den primären Fehler rekonstruieren können, selbst wenn auch der abschließende Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, wirft OpenClaw `FallbackSummaryError`. Der äußere Reply-Runner kann dies nutzen, um eine spezifischere Meldung wie „Alle Modelle sind vorübergehend rate-limited“ zu erstellen und den frühesten Cooldown-Ablauf einzuschließen, sofern einer bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zugehörige modellbezogene Rate Limits werden für die versuchte Provider-/Modellkette ignoriert
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

Siehe [Modelle](/de/concepts/models) für die umfassendere Übersicht über Modellauswahl und Fallback.
