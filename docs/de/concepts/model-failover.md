---
read_when:
    - Diagnose von Auth-Profil-Rotation, Cooldowns oder Modell-Fallback-Verhalten
    - Failover-Regeln für Auth-Profile oder Modelle aktualisieren
    - Verstehen, wie Sitzungsmodell-Overrides mit Fallback-Wiederholungen interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Auth-Profile rotiert und modellübergreifend zurückfällt
title: Modell-Failover
x-i18n:
    generated_at: "2026-06-27T17:24:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Phasen:

1. **Auth-Profil-Rotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Runtime-Regeln und die Daten, auf denen sie basieren.

## Runtime-Ablauf

Für einen normalen Textlauf bewertet OpenClaw Kandidaten in dieser Reihenfolge:

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Lösen Sie das aktive Sitzungsmodell und die Auth-Profil-Präferenz auf.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Erstellen Sie die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für diese Auswahlquelle. Konfigurierte Defaults, primäre Cron-Job-Modelle und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen in Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Versuchen Sie den aktuellen Provider mit Auth-Profil-Rotations- und Cooldown-Regeln.
  </Step>
  <Step title="Bei Failover-würdigen Fehlern fortfahren">
    Wenn dieser Provider mit einem Failover-würdigen Fehler erschöpft ist, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Fallback-Override persistieren">
    Persistieren Sie den ausgewählten Fallback-Override, bevor der erneute Versuch startet, damit andere Sitzungsleser denselben Provider/dasselbe Modell sehen, den bzw. das der Runner gleich verwenden wird. Der persistierte Modell-Override wird mit `modelOverrideSource: "auto"` markiert.
  </Step>
  <Step title="Bei Fehler eng begrenzt zurückrollen">
    Wenn der Fallback-Kandidat fehlschlägt, rollen Sie nur die Fallback-eigenen Sitzungs-Override-Felder zurück, sofern sie noch diesem fehlgeschlagenen Kandidaten entsprechen.
  </Step>
  <Step title="FallbackSummaryError werfen, wenn erschöpft">
    Wenn jeder Kandidat fehlschlägt, werfen Sie einen `FallbackSummaryError` mit Details pro Versuch und dem frühesten Cooldown-Ablauf, sofern einer bekannt ist.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der Antwort-Runner persistiert nur die Modellauswahlfelder, die er für Fallback besitzt:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Das verhindert, dass ein fehlgeschlagener Fallback-Wiederholungsversuch neuere, nicht zusammenhängende Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Sitzungsrotations-Updates, die während des laufenden Versuchs passiert sind.

## Richtlinie für Auswahlquellen

OpenClaw trennt den ausgewählten Provider/das ausgewählte Modell davon, warum es ausgewählt wurde. Diese Quelle steuert, ob die Fallback-Kette erlaubt ist:

- **Konfigurierter Default**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Primäres Agent-Modell**: `agents.list[].model` ist strikt, es sei denn, das Modellobjekt dieses Agent enthält eigene `fallbacks`. Verwenden Sie `fallbacks: []`, um das strikte Verhalten explizit zu machen, oder geben Sie eine nicht leere Liste an, um diesen Agent für Modell-Fallback zu aktivieren.
- **Automatischer Fallback-Override**: Ein Runtime-Fallback schreibt `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` und das ausgewählte Ursprungsmodell, bevor er es erneut versucht. Dieser automatische Override kann die konfigurierte Fallback-Kette weiter durchlaufen, ohne bei jeder Nachricht das primäre Modell zu prüfen, aber OpenClaw prüft den konfigurierten Ursprung regelmäßig erneut und löscht den automatischen Override, wenn er sich erholt. `/new`, `/reset` und `sessions.reset` löschen ebenfalls automatisch erzeugte Overrides. Heartbeat-Läufe ohne explizites `heartbeat.model` löschen direkte automatische Overrides, wenn deren Ursprung nicht mehr dem aktuellen konfigurierten Default entspricht.
- **Benutzer-Sitzungs-Override**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Das ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider/das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wird, meldet OpenClaw den Fehler, statt mit einem nicht zusammenhängenden konfigurierten Fallback zu antworten.
- **Legacy-Sitzungs-Override**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzer-Overrides, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Payload-Modell**: Ein Cron-Job-`payload.model` / `--model` ist ein primäres Job-Modell, kein Benutzer-Sitzungs-Override. Es verwendet konfigurierte Fallbacks, sofern der Job nicht `payload.fallbacks` bereitstellt; `payload.fallbacks: []` macht den Cron-Lauf strikt.

Das automatische Fallback-Prüfintervall für das primäre Modell beträgt fünf Minuten und ist nicht konfigurierbar. OpenClaw merkt sich aktuelle Prüfungen pro Sitzung und primärem Modell, damit ein fehlgeschlagenes primäres Modell nicht bei jedem Turn erneut versucht wird. OpenClaw sendet einen sichtbaren Hinweis, wenn eine Sitzung auf Fallback wechselt, und einen weiteren Hinweis, wenn sie zum ausgewählten primären Modell zurückkehrt; der Hinweis wird nicht bei jedem Sticky-Fallback-Turn wiederholt.

## Überspring-Cache für Auth-Fehler

Standardmäßig behält jeder neue Turn das bestehende Fallback-Wiederholungsverhalten bei: OpenClaw
versucht jeden konfigurierten Fallback-Kandidaten erneut, einschließlich nicht primärer
Kandidaten, die kürzlich mit `auth` oder `auth_permanent` fehlgeschlagen sind.

Operatoren, die diese wiederholten Auth-Fehler unterdrücken möchten, können dies aktivieren mit:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wenn aktiviert, zeichnet OpenClaw nach einem Fehler der Auth-Klasse einen im Arbeitsspeicher gehaltenen, sitzungsbezogenen Überspring-Marker für einen
nicht primären Fallback-Kandidaten auf. Der Marker wird nach
Sitzungs-ID, Provider und Modell geschlüsselt. Primäre Kandidaten werden nie übersprungen, sodass eine
explizite Benutzermodellauswahl weiterhin den echten Auth-Fehler anzeigt. Der Cache ist
prozesslokal und wird beim Gateway-Neustart gelöscht.

Der Wert ist eine TTL in Millisekunden. `0` oder ein nicht gesetzter Wert deaktiviert den Cache.
Positive Werte werden zwischen 1 Sekunde und 10 Minuten begrenzt.

## Für Benutzer sichtbare Fallback-Hinweise

Wenn eine Sitzung auf einen automatisch ausgewählten Fallback wechselt, sendet OpenClaw einen Statushinweis in derselben Antwortoberfläche:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wenn eine spätere Prüfung erfolgreich ist und die Sitzung zum ausgewählten primären Modell zurückkehrt, sendet OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Diese Hinweise sind Betriebsnachrichten, keine Assistenteninhalte. Sie werden einmal pro Statusänderung zugestellt, einschließlich Turns mit reinen Seiteneffekten, wenn möglich, aber Sticky-Fallback-Turns wiederholen sie nicht. Die Zustellung umgeht die normale Unterdrückung von Quellenantworten, der Hinweis belegt in Thread-Kanälen nicht den ersten Antwortslot des Assistenten, und er ist von Text-to-Speech und Commitment-Extraktion ausgeschlossen.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets und Runtime-Auth-Routing-Status befinden sich in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguration `auth.profiles` / `auth.order` sind **nur Metadaten + Routing** (keine Secrets).
- Legacy-OAuth-Datei nur für Import: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den agentbezogenen Auth-Speicher importiert).
- Legacy-Dateien `auth-profiles.json`, `auth-state.json` und agentbezogene `auth.json`-Dateien werden von `openclaw doctor --fix` importiert.

Weitere Details: [OAuth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen unterschiedliche Profile, damit mehrere Konten parallel existieren können.

- Default: `provider:default`, wenn keine E-Mail-Adresse verfügbar ist.
- OAuth mit E-Mail-Adresse: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile befinden sich im agentbezogenen `openclaw-agent.sqlite`-Auth-Profilspeicher.

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
    Agentbezogene SQLite-Auth-Profileinträge für den Provider.
  </Step>
</Steps>

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärer Schlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärer Schlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Profile in Cooldown/deaktivierte Profile** werden ans Ende verschoben, sortiert nach frühestem Ablauf.

### Sitzungsbindung (cache-freundlich)

OpenClaw **pinnt das gewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten. Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler wird erhöht)
- das Profil im Cooldown/deaktiviert ist

Eine manuelle Auswahl über `/model …@<profileId>` setzt einen **Benutzer-Override** für diese Sitzung und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

<Note>
Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits/Timeouts zu einem anderen Profil rotieren. Wenn das ursprüngliche Profil wieder verfügbar ist, können neue Läufe es wieder bevorzugen, ohne das ausgewählte Modell oder die Runtime zu ändern. Benutzergepinnte Profile bleiben auf dieses Profil fixiert; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.
</Note>

### OpenAI Codex-Abonnement plus API-Schlüssel-Backup

Für OpenAI-Agent-Modelle sind Auth und Runtime getrennt. `openai/gpt-*` bleibt im
Codex-Harness, während Auth zwischen einem Codex-Abonnementprofil und
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
geordnete Auth-Profil und hält den Lauf innerhalb des Codex-Harness. Sobald die Rücksetzzeit
verstrichen ist, ist das Abonnementprofil wieder zulässig, und die nächste automatische
Auswahl kann zu ihm zurückkehren.

Verwenden Sie ein benutzergepinntes Profil nur, wenn Sie für diese
Sitzung ein Konto/einen Schlüssel erzwingen möchten. Benutzergepinnte Profile sind absichtlich strikt und springen nicht stillschweigend
zu einem anderen Profil.

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Ratenlimitfehlern fehlschlägt (oder aufgrund eines Timeouts, der wie Ratenbegrenzung aussieht), markiert OpenClaw es im Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was im Ratenlimit-/Timeout-Bucket landet">
    Dieser Ratenlimit-Bucket ist breiter als bloß `429`: Er umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` und periodische Nutzungslimits wie `weekly/monthly limit reached`.

    Format-/Invalid-Request-Fehler sind normalerweise terminal, weil ein erneuter Versuch mit derselben Payload auf dieselbe Weise fehlschlagen würde; daher zeigt OpenClaw sie an, statt Auth-Profile zu rotieren. Bekannte Retry-Reparaturpfade können explizit aktiviert werden: Zum Beispiel werden Cloud Code Assist-Validierungsfehler für Tool-Call-IDs bereinigt und einmal über die `allowFormatRetry`-Richtlinie erneut versucht. OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Timeout-/Failover-Signale klassifiziert.

    Generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel wird die reine Modell-Runtime-Stream-Wrapper-Meldung `An unknown error occurred` für jeden Provider als Failover-würdig behandelt, weil die gemeinsame Modell-Runtime sie ausgibt, wenn Provider-Streams mit `stopReason: "aborted"` oder `stopReason: "error"` ohne spezifische Details enden. JSON-`api_error`-Payloads mit transientem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als Failover-würdige Timeouts behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie reines `Provider returned error` wird nur dann als Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich genommen kein Failover aus.

  </Accordion>
  <Accordion title="SDK-Caps für Retry-After">
    Einige Provider-SDKs würden sonst möglicherweise für ein langes `Retry-After`-Fenster warten, bevor sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne Wartezeiten für `retry-after-ms` / `retry-after` standardmäßig auf 60 Sekunden und gibt längere wiederholbare Antworten sofort weiter, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Begrenzung mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Retry-Verhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellbezogene Cooldowns">
    Rate-Limit-Cooldowns können auch modellbezogen sein:

    - OpenClaw zeichnet `cooldownModel` für Rate-Limit-Fehler auf, wenn die fehlschlagende Modell-ID bekannt ist.
    - Ein Geschwistermodell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown auf ein anderes Modell bezogen ist.
    - Billing-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

  </Accordion>
</AccordionGroup>

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

Der Zustand wird im agentbezogenen SQLite-Auth-Zustand unter `usageStats` gespeichert:

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

Billing-/Guthabenfehler (zum Beispiel "insufficient credits" / "credit balance too low") werden als failoverwürdig behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit einem längeren Backoff) und rotiert zum nächsten Profil/Provider.

<Note>
Nicht jede billingartige Antwort ist `402`, und nicht jede HTTP-`402` landet hier. OpenClaw hält expliziten Billing-Text in der Billing-Spur, auch wenn ein Provider stattdessen `401` oder `403` zurückgibt, aber provider-spezifische Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit exceeded`).

Temporäre `402`-Nutzungsfenster- und Organisations-/Workspace-Ausgabenlimitfehler werden hingegen als `rate_limit` klassifiziert, wenn die Meldung wiederholbar wirkt (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen Billing-Deaktivierungspfad.
</Note>

Der Zustand wird im agentbezogenen SQLite-Auth-Zustand gespeichert:

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
- Überlastungs-Retries erlauben **1 Profilrotation beim selben Provider** vor dem Modell-Fallback.
- Überlastungs-Retries verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Rate-Limits und Timeouts, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler lösen keinen Fallback aus). Provider-Fehler, die nicht genügend Details offenlegen, werden im Fallback-Zustand trotzdem präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider keine nutzbare Nachricht oder keinen nutzbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die Rohvorschau beibehalten hat, aber noch kein Klassifizierer darauf gepasst hat.

Überlastungs- und Rate-Limit-Fehler werden aggressiver behandelt als Billing-Cooldowns. Standardmäßig erlaubt OpenClaw einen Auth-Profil-Retry beim selben Provider und wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback. Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Überlastungs-Bucket. Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` und `auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf vom konfigurierten Standard-Primary, einem Cron-Job-Primary, einem Agent-Primary mit expliziten Fallbacks oder einem automatisch ausgewählten Fallback-Override startet, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Agent-Primaries ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Provider-/Modell-Overrides) sind strikt: Wenn dieser Provider/dieses Modell nicht erreichbar ist oder vor dem Erzeugen einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt mit einem nicht zugehörigen Fallback zu antworten.

### Regeln für die Kandidatenkette

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` plus konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht anhand der Modell-Allowlist gefiltert. Sie werden als explizite Operator-Absicht behandelt.
    - Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn kein expliziter Fallback-Override bereitgestellt wird, werden konfigurierte Fallbacks vor dem konfigurierten Primary versucht, auch wenn das angeforderte Modell einen anderen Provider verwendet.
    - Wenn dem Fallback-Runner kein expliziter Fallback-Override bereitgestellt wird, wird der konfigurierte Primary am Ende angehängt, damit die Kette wieder zum normalen Standard zurückkehren kann, sobald frühere Kandidaten ausgeschöpft sind.
    - Wenn ein Aufrufer `fallbacksOverride` bereitstellt, verwendet der Runner genau das angeforderte Modell plus diese Override-Liste. Eine leere Liste deaktiviert Modell-Fallback und verhindert, dass der konfigurierte Primary als verstecktes Retry-Ziel angehängt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Fährt fort bei">
    - Auth-Fehlern
    - Rate-Limits und ausgeschöpften Cooldowns
    - Überlastungs-/Provider-Busy-Fehlern
    - timeoutartigen Failover-Fehlern
    - Billing-Deaktivierungen
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
    - anderen nicht erkannten Fehlern, wenn noch Kandidaten verbleiben

  </Tab>
  <Tab title="Fährt nicht fort bei">
    - expliziten Abbrüchen, die nicht timeout-/failoverartig sind
    - Kontextüberlauf-Fehlern, die in der Compaction-/Retry-Logik bleiben sollten (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oder `ollama error: context length exceeded`)
    - einem abschließenden unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

  </Tab>
</Tabs>

### Cooldown-Überspringen vs. Probe-Verhalten

Wenn jedes Auth-Profil für einen Provider bereits im Cooldown ist, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Es trifft eine Entscheidung pro Kandidat:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Persistente Auth-Fehler überspringen sofort den gesamten Provider.
    - Billing-Deaktivierungen überspringen normalerweise, aber der Primary-Kandidat kann weiterhin gedrosselt getestet werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primary-Kandidat kann nahe dem Cooldown-Ablauf mit einer providerbezogenen Drosselung getestet werden.
    - Geschwister-Fallbacks beim selben Provider können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Dies ist besonders relevant, wenn ein Rate-Limit modellbezogen ist und ein Geschwistermodell möglicherweise sofort wiederhergestellt werden kann.
    - Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

  </Accordion>
</AccordionGroup>

## Sitzungs-Overrides und Live-Modellwechsel

Sitzungsmodelländerungen sind geteilter Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und Live-Sitzungsabgleich lesen oder schreiben alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Overrides oder Compaction markieren von sich aus niemals einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modell-Overrides werden für die Fallback-Richtlinie als exakte Auswahlen behandelt, sodass ein nicht erreichbarer ausgewählter Provider als Fehler sichtbar wird, statt durch `agents.defaults.model.fallbacks` maskiert zu werden.
- Bevor ein Fallback-Retry startet, persistiert der Antwort-Runner die ausgewählten Fallback-Override-Felder im Sitzungseintrag.
- Automatische Fallback-Overrides bleiben in nachfolgenden Turns ausgewählt, damit OpenClaw nicht bei jeder Nachricht einen bekannt fehlerhaften Primary testet. OpenClaw testet den konfigurierten Ursprung periodisch erneut und löscht den automatischen Override, wenn er sich erholt; `/new`, `/reset` und `sessions.reset` löschen automatisch erzeugte Overrides sofort.
- Benutzerantworten kündigen Fallback-Übergänge und Fallback-gelöschte Wiederherstellung einmal pro Zustandsänderung an. Sticky-Fallback-Turns wiederholen den Hinweis nicht.
- `/status` zeigt das ausgewählte Modell und, wenn sich der Fallback-Zustand unterscheidet, das aktive Fallback-Modell und den Grund.
- Live-Sitzungsabgleich bevorzugt persistierte Sitzungs-Overrides gegenüber veralteten Runtime-Modellfeldern.
- Wenn ein Live-Wechsel-Fehler auf einen späteren Kandidaten in der aktiven Fallback-Kette zeigt, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zuerst nicht zugehörige Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Override-Felder zurück, die er geschrieben hat, und nur, wenn sie noch diesem fehlgeschlagenen Kandidaten entsprechen.

Dies verhindert das klassische Race:

<Steps>
  <Step title="Primary schlägt fehl">
    Das ausgewählte Primary-Modell schlägt fehl.
  </Step>
  <Step title="Fallback im Speicher gewählt">
    Der Fallback-Kandidat wird im Speicher gewählt.
  </Step>
  <Step title="Sitzungsspeicher sagt noch alter Primary">
    Der Sitzungsspeicher spiegelt noch den alten Primary wider.
  </Step>
  <Step title="Live-Abgleich liest veralteten Zustand">
    Der Live-Sitzungsabgleich liest den veralteten Sitzungszustand.
  </Step>
  <Step title="Retry zurückgesetzt">
    Der Retry wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch startet.
  </Step>
</Steps>

Der persistierte Fallback-Override schließt dieses Fenster, und das enge Rollback hält neuere manuelle oder runtimegesteuerte Sitzungsänderungen intakt.

## Observability und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Logs enthalten außerdem flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), damit Log- und Diagnose-Exporter den Primary-Fehler rekonstruieren können, selbst wenn der abschließende Fallback ebenfalls fehlschlägt.

Wenn jeder Kandidat fehlschlägt, wirft OpenClaw `FallbackSummaryError`. Der äußere Antwort-Runner kann dies nutzen, um eine spezifischere Meldung wie "alle Modelle sind vorübergehend rate-limited" zu erstellen und den frühesten Cooldown-Ablauf einzuschließen, wenn einer bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zugehörige modellbezogene Rate-Limits werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Sperre ein passendes modellbezogenes Rate-Limit ist, meldet OpenClaw den letzten passenden Ablauf, der dieses Modell noch blockiert

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
