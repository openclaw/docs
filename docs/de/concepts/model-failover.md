---
read_when:
    - Diagnose der Rotation von Authentifizierungsprofilen, Abklingzeiten oder des Modell-Fallback-Verhaltens
    - Failover-Regeln für Authentifizierungsprofile oder Modelle aktualisieren
    - Zusammenspiel von Modellüberschreibungen für Sitzungen und Wiederholungsversuchen mit Fallback verstehen
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und auf andere Modelle zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-07-12T01:33:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Rotation des Auth-Profils** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

## Laufzeitablauf

<Steps>
  <Step title="Resolve session state">
    Ermitteln Sie das aktive Sitzungsmodell und die Präferenz für das Auth-Profil.
  </Step>
  <Step title="Build candidate chain">
    Erstellen Sie die Kette der Modellkandidaten aus der aktuellen Modellauswahl und der Fallback-Richtlinie für die Quelle dieser Auswahl. Konfigurierte Standardwerte, primäre Modelle von Cron-Aufträgen und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen für Sitzungen sind strikt.
  </Step>
  <Step title="Try the current provider">
    Versuchen Sie den aktuellen Provider unter Anwendung der Regeln für Auth-Profil-Rotation und Abklingzeiten.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Wenn die Möglichkeiten dieses Providers aufgrund eines Fehlers ausgeschöpft sind, der einen Failover rechtfertigt, wechseln Sie zum nächsten Modellkandidaten.
  </Step>
  <Step title="Persist fallback override">
    Speichern Sie die ausgewählte Fallback-Überschreibung, bevor der erneute Versuch beginnt, damit andere Leser der Sitzung denselben Provider und dasselbe Modell sehen, die der Runner gleich verwenden wird. Die gespeicherte Modellüberschreibung wird mit `modelOverrideSource: "auto"` gekennzeichnet.
  </Step>
  <Step title="Roll back narrowly on failure">
    Wenn der Fallback-Kandidat fehlschlägt, setzen Sie ausschließlich die sitzungsbezogenen Überschreibungsfelder des Fallbacks zurück, sofern sie weiterhin diesem fehlgeschlagenen Kandidaten entsprechen.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Wenn alle Kandidaten fehlschlagen, lösen Sie einen `FallbackSummaryError` mit Details zu jedem Versuch und dem frühesten Ablauf einer Abklingzeit aus, sofern dieser bekannt ist.
  </Step>
</Steps>

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der Antwort-Runner speichert nur die Felder zur Modellauswahl, für die er beim Fallback verantwortlich ist: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Dadurch wird verhindert, dass ein fehlgeschlagener erneuter Fallback-Versuch neuere, nicht damit zusammenhängende Sitzungsänderungen überschreibt, etwa eine manuelle Änderung mit `/model` oder eine Aktualisierung der Sitzungsrotation, die während des laufenden Versuchs erfolgt ist.

## Richtlinie für die Auswahlquelle

Die Auswahlquelle bestimmt, ob die Fallback-Kette zulässig ist:

- **Konfigurierter Standardwert**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Primäres Agentenmodell**: `agents.list[].model` ist strikt, sofern das Modellobjekt dieses Agenten keine eigenen `fallbacks` enthält. Verwenden Sie `fallbacks: []`, um das strikte Verhalten ausdrücklich festzulegen, oder eine nicht leere Liste, um den Modell-Fallback für diesen Agenten zu aktivieren.
- **Automatische Fallback-Überschreibung**: Ein Laufzeit-Fallback schreibt vor dem erneuten Versuch `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` und das ausgewählte Ursprungsmodell. Mit dieser Überschreibung wird die konfigurierte Fallback-Kette weiter durchlaufen, ohne das primäre Modell bei jeder Nachricht erneut zu prüfen. OpenClaw prüft jedoch alle 5 Minuten den konfigurierten Ursprung (nicht konfigurierbar) und entfernt die Überschreibung, sobald er wieder verfügbar ist. `/new`, `/reset` und `sessions.reset` entfernen ebenfalls automatisch erzeugte Überschreibungen. Heartbeat-Ausführungen ohne explizites `heartbeat.model` entfernen direkte automatische Überschreibungen, wenn deren Ursprung nicht mehr dem aktuell konfigurierten Standardwert entspricht.
- **Benutzerdefinierte Sitzungsüberschreibung**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Dies ist eine exakte Modellauswahl für die Sitzung. Wenn der ausgewählte Provider oder das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wurde, meldet OpenClaw den Fehler, anstatt mit einem nicht damit zusammenhängenden konfigurierten Fallback zu antworten.
- **Veraltete Sitzungsüberschreibung**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzerüberschreibungen, damit eine explizite alte Auswahl nicht unbemerkt in Fallback-Verhalten umgewandelt wird.
- **Modell in Cron-Nutzdaten**: `payload.model` beziehungsweise `--model` eines Cron-Auftrags ist das primäre Modell des Auftrags und keine benutzerdefinierte Sitzungsüberschreibung. Es verwendet konfigurierte Fallbacks, sofern der Auftrag keine `payload.fallbacks` angibt; mit `payload.fallbacks: []` wird die Cron-Ausführung strikt.

OpenClaw merkt sich kürzlich erfolgte Prüfungen des primären Modells je Sitzung und primärem Modell, damit ein fehlerhaftes primäres Modell nicht bei jedem Durchlauf erneut versucht wird. Es sendet einen sichtbaren Hinweis, wenn eine Sitzung zu einem Fallback wechselt, und einen weiteren Hinweis, wenn sie zum ausgewählten primären Modell zurückkehrt. Der Hinweis wird nicht bei jedem Durchlauf mit beibehaltenem Fallback wiederholt.

## Cache zum Überspringen von Auth-Fehlern

Standardmäßig behält jeder neue Durchlauf das bestehende Verhalten für erneute Fallback-Versuche bei: OpenClaw versucht jeden konfigurierten Fallback-Kandidaten erneut, einschließlich nicht primärer Kandidaten, die kürzlich mit `auth` oder `auth_permanent` fehlgeschlagen sind.

Aktivieren Sie die Unterdrückung wiederholter Auth-Fehler mit:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wenn diese Option aktiviert ist, zeichnet OpenClaw nach einem Fehler der Auth-Klasse für einen nicht primären Fallback-Kandidaten eine sitzungsbezogene Überspringmarkierung im Arbeitsspeicher auf. Der Schlüssel besteht aus Sitzungs-ID, Provider und Modell. Primäre Kandidaten werden niemals übersprungen, sodass bei einer expliziten Benutzerauswahl eines Modells weiterhin der tatsächliche Auth-Fehler angezeigt wird. Der Cache ist prozesslokal und wird bei einem Neustart des Gateways geleert.

Der Wert ist eine TTL in Millisekunden. `0` oder ein nicht gesetzter Wert deaktiviert den Cache. Positive Werte werden auf einen Bereich zwischen 1 Sekunde und 10 Minuten begrenzt.

## Für Benutzer sichtbare Fallback-Hinweise

Wenn eine Sitzung zu einem automatisch ausgewählten Fallback wechselt, sendet OpenClaw einen Statushinweis über dieselbe Antwortoberfläche:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Wenn eine spätere Prüfung erfolgreich ist und die Sitzung zum ausgewählten primären Modell zurückkehrt, sendet OpenClaw:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Diese Hinweise sind Betriebsnachrichten und keine Inhalte des Assistenten. Sie werden einmal je Zustandsänderung zugestellt, soweit möglich auch bei Durchläufen, die ausschließlich Nebeneffekte auslösen. Bei Durchläufen mit beibehaltenem Fallback werden sie jedoch nicht wiederholt. Die Zustellung umgeht die normale Unterdrückung von Antworten an die Quelle, belegt bei Kanälen mit Threads nicht den Platz der ersten Assistentenantwort und wird von der Sprachsynthese sowie der Extraktion von Zusagen ausgeschlossen.

## Auth-Speicherung (Schlüssel und OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Geheimnisse und der Laufzeitstatus der Auth-Weiterleitung befinden sich in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfigurationen `auth.profiles` und `auth.order` enthalten **nur Metadaten und Weiterleitungsinformationen** (keine Geheimnisse).
- Veraltete, ausschließlich für den Import bestimmte OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den Auth-Speicher des jeweiligen Agenten importiert).
- Veraltete Dateien `auth-profiles.json`, `auth-state.json` und agentenspezifische `auth.json`-Dateien werden durch `openclaw doctor --fix` importiert.

Weitere Einzelheiten: [OAuth](/de/concepts/oauth)

Typen von Zugangsdaten:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` bei einigen Providern)
- `type: "token"` → statisches Token im Bearer-Stil, optional mit Ablaufzeit; OpenClaw aktualisiert es nicht (wird für `aws-sdk` und andere Auth-Modi mit Zugangsdatenketten verwendet)

## Profil-IDs

OAuth-Anmeldungen erstellen getrennte Profile, damit mehrere Konten gleichzeitig verwendet werden können.

- Standardwert: `provider:default`, wenn keine E-Mail-Adresse verfügbar ist.
- OAuth mit E-Mail-Adresse: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Die Profile befinden sich im Auth-Profilspeicher der agentenspezifischen `openclaw-agent.sqlite`.

## Rotationsreihenfolge

Wenn ein Provider über mehrere Profile verfügt, bestimmt OpenClaw die Reihenfolge folgendermaßen:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (sofern festgelegt).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles`, nach Provider gefiltert.
  </Step>
  <Step title="Stored profiles">
    Agentenspezifische Einträge für Auth-Profile des Providers in SQLite.
  </Step>
</Steps>

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärer Schlüssel:** Profiltyp (**OAuth, dann statisches Token, dann API-Schlüssel**).
- **Sekundärer Schlüssel:** `usageStats.lastUsed` (innerhalb jedes Typs zuerst der älteste Wert).
- **Profile mit Abklingzeit oder deaktivierte Profile** werden ans Ende verschoben und nach dem frühesten Ablaufzeitpunkt sortiert.

### Sitzungsbindung (cachefreundlich)

OpenClaw **bindet das ausgewählte Auth-Profil an die jeweilige Sitzung**, damit die Provider-Caches verfügbar bleiben. Es rotiert **nicht** bei jeder Anfrage. Das gebundene Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen wird (der Compaction-Zähler wird erhöht)
- sich das Profil in einer Abklingzeit befindet oder deaktiviert ist

Eine manuelle Auswahl über `/model …@<profileId>` legt für diese Sitzung eine **Benutzerüberschreibung** fest und wird bis zum Beginn einer neuen Sitzung nicht automatisch rotiert.

<Note>
Automatisch gebundene Profile, die vom Sitzungsrouter ausgewählt wurden, werden als **Präferenz** behandelt: Sie werden zuerst versucht, OpenClaw kann bei Ratenbegrenzungen oder Zeitüberschreitungen jedoch zu einem anderen Profil wechseln. Wenn das ursprüngliche Profil wieder verfügbar ist, können neue Ausführungen es erneut bevorzugen, ohne das ausgewählte Modell oder die Laufzeit zu ändern. Vom Benutzer gebundene Profile bleiben auf dieses Profil festgelegt. Wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, anstatt das Profil zu wechseln.
</Note>

### OpenAI-Codex-Abonnement mit API-Schlüssel als Reserve

Bei OpenAI-Agentenmodellen sind Authentifizierung und Laufzeit voneinander getrennt. `openai/gpt-*` verbleibt im Codex-Harness, während die Authentifizierung zwischen einem Codex-Abonnementprofil und einem OpenAI-API-Schlüssel als Reserve rotieren kann.

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

Verwenden Sie `openai:*` sowohl für ChatGPT-/Codex-OAuth-Profile als auch für OpenAI-API-Schlüsselprofile. Wenn das Abonnement ein Codex-Nutzungslimit erreicht, speichert OpenClaw den genauen Zeitpunkt der Zurücksetzung, sofern Codex einen bereitstellt, versucht das nächste Auth-Profil in der festgelegten Reihenfolge und belässt die Ausführung im Codex-Harness. Sobald der Zeitpunkt der Zurücksetzung verstrichen ist, ist das Abonnementprofil wieder verfügbar, und die nächste automatische Auswahl kann zu ihm zurückkehren.

Verwenden Sie ein vom Benutzer gebundenes Profil nur, wenn Sie für diese Sitzung die Verwendung eines bestimmten Kontos oder Schlüssels erzwingen möchten. Vom Benutzer gebundene Profile sind absichtlich strikt und wechseln nicht unbemerkt zu einem anderen Profil.

## Abklingzeiten

Wenn ein Profil aufgrund von Auth- oder Ratenbegrenzungsfehlern fehlschlägt oder eine Zeitüberschreitung auftritt, die wie eine Ratenbegrenzung wirkt, versetzt OpenClaw es in eine Abklingzeit und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Diese Kategorie für Ratenbegrenzungen ist umfassender als ein einfacher `429`-Fehler: Sie umfasst auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` sowie periodische Begrenzungen von Nutzungszeiträumen wie `weekly limit reached` oder `monthly limit exhausted`.

    Format- und Fehler aufgrund ungültiger Anfragen sind üblicherweise endgültig, da ein erneuter Versuch mit denselben Nutzdaten auf dieselbe Weise fehlschlagen würde. OpenClaw zeigt sie daher an, anstatt die Auth-Profile zu rotieren. Bekannte Reparaturpfade für erneute Versuche können ausdrücklich aktiviert werden: Beispielsweise werden Fehler bei der Validierung von Tool-Aufruf-IDs in Cloud Code Assist bereinigt und über die Richtlinie `allowFormatRetry` einmal erneut versucht. OpenAI-kompatible Fehler zum Beendigungsgrund wie `Unhandled stop reason: error`, `stop reason: error` und `reason: error` werden als Signale für Zeitüberschreitung oder Failover klassifiziert.

    Allgemeiner Servertext kann ebenfalls dieser Kategorie für Zeitüberschreitungen zugeordnet werden, wenn die Quelle einem bekannten vorübergehenden Muster entspricht. Beispielsweise wird die unveränderte Stream-Wrapper-Meldung der Modelllaufzeit `An unknown error occurred` bei jedem Provider als Grund für einen Failover behandelt, da die gemeinsame Modelllaufzeit sie ausgibt, wenn Provider-Streams ohne nähere Einzelheiten mit `stopReason: "aborted"` oder `stopReason: "error"` enden. JSON-Nutzdaten vom Typ `api_error` mit vorübergehendem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als Zeitüberschreitungen behandelt, die einen Failover rechtfertigen.

    OpenRouter-spezifischer allgemeiner Upstream-Text wie das unveränderte `Provider returned error` wird nur dann als Zeitüberschreitung behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Allgemeiner interner Fallback-Text wie `LLM request failed with an unknown error.` wird weiterhin zurückhaltend behandelt und löst allein keinen Failover aus.

  </Accordion>
  <Accordion title="Obergrenzen für SDK-Retry-After">
    Einige Provider-SDKs warten andernfalls möglicherweise lange innerhalb eines `Retry-After`-Zeitfensters, bevor sie die Kontrolle an OpenClaw zurückgeben. Bei Stainless-basierten SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne Wartezeiten für `retry-after-ms` / `retry-after` standardmäßig auf 60 Sekunden und gibt länger dauernde, wiederholbare Antworten sofort weiter, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Wiederholungsverhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellspezifische Abklingzeiten">
    Abklingzeiten für Ratenbegrenzungen können ebenfalls modellspezifisch sein:

    - OpenClaw erfasst bei Ratenbegrenzungsfehlern `cooldownModel`, wenn die ID des fehlgeschlagenen Modells bekannt ist.
    - Ein anderes Modell desselben Providers kann weiterhin versucht werden, wenn die Abklingzeit für ein anderes Modell gilt.
    - Zeitfenster für Abrechnungsfehler oder Deaktivierungen sperren weiterhin das gesamte Profil für alle Modelle.

  </Accordion>
</AccordionGroup>

Reguläre Abklingzeiten (weder Abrechnungsfehler noch dauerhafte Authentifizierungsfehler) skalieren mit der Anzahl der kürzlich aufgetretenen Fehler des Profils:

- 1. Fehler: 30 Sekunden
- 2. Fehler: 1 Minute
- Ab dem 3. Fehler: 5 Minuten (Obergrenze)

Die Zähler werden zurückgesetzt, sobald das Fehlerzeitfenster des Profils abgelaufen ist (`auth.cooldowns.failureWindowHours`, Standardwert 24).

Der Status wird im agentenspezifischen SQLite-Authentifizierungsstatus unter `usageStats` gespeichert:

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

## Deaktivierungen aufgrund von Abrechnungsfehlern

Abrechnungs- oder Guthabenfehler (beispielsweise „unzureichendes Guthaben“ / „Guthabenstand zu niedrig“) werden als Grund für einen Failover behandelt, sind jedoch normalerweise nicht vorübergehend. Statt einer kurzen Abklingzeit markiert OpenClaw das Profil als **deaktiviert** (mit einer längeren Wartezeit) und wechselt zum nächsten Profil beziehungsweise Provider.

<Note>
Nicht jede Antwort, die auf ein Abrechnungsproblem hindeutet, verwendet `402`, und nicht jeder HTTP-Status `402` wird hier eingeordnet. OpenClaw ordnet eindeutige Abrechnungstexte weiterhin der Abrechnungskategorie zu, auch wenn ein Provider stattdessen `401` oder `403` zurückgibt. Providerspezifische Erkennungsmuster bleiben jedoch auf den jeweiligen Provider beschränkt (beispielsweise OpenRouter `403 Key limit exceeded`).

Vorübergehende `402`-Fehler aufgrund von Nutzungszeitfenstern sowie Ausgabenlimits von Organisationen oder Arbeitsbereichen werden dagegen als `rate_limit` klassifiziert, wenn die Meldung auf einen wiederholbaren Vorgang hindeutet (beispielsweise `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese Fehler verbleiben auf dem Pfad mit kurzer Abklingzeit und Failover, statt dem Pfad mit langfristiger Deaktivierung aufgrund eines Abrechnungsfehlers zu folgen.
</Note>

Mit hoher Sicherheit dauerhafte Authentifizierungsfehler (widerrufene oder deaktivierte Schlüssel sowie deaktivierte Arbeitsbereiche) werden ähnlich behandelt und führen ebenfalls zu einer Deaktivierung. Die Wiederherstellung erfolgt jedoch deutlich früher als bei Abrechnungsfehlern, da manche Provider bei Störungen vorübergehend Antworten liefern, die wie Authentifizierungsfehler aussehen.

Der Status wird im agentenspezifischen SQLite-Authentifizierungsstatus gespeichert:

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

Standardwerte (`auth.cooldowns.*`):

| Schlüssel                      | Standardwert | Zweck                                                                                       |
| ------------------------------ | ------------ | ------------------------------------------------------------------------------------------- |
| `billingBackoffHours`          | 5            | Grundwartezeit bei Abrechnungsfehlern; verdoppelt sich mit jedem Abrechnungsfehler           |
| `billingMaxHours`              | 24           | Obergrenze der Wartezeit bei Abrechnungsfehlern                                              |
| `authPermanentBackoffMinutes`  | 10           | Grundwartezeit bei mit hoher Sicherheit dauerhaften Authentifizierungsfehlern                |
| `authPermanentMaxMinutes`      | 60           | Obergrenze dieser Wartezeit                                                                  |
| `failureWindowHours`           | 24           | Fehlerzähler werden zurückgesetzt, wenn in diesem Zeitfenster keine Fehler auftreten         |
| `overloadedProfileRotations`   | 1            | Zulässige Profilwechsel innerhalb desselben Providers vor dem Modell-Fallback bei Überlastung |
| `overloadedBackoffMs`          | 0            | Feste Verzögerung vor einem erneuten Versuch nach einem Profilwechsel bei Überlastung         |
| `rateLimitedProfileRotations`  | 1            | Zulässige Profilwechsel innerhalb desselben Providers vor dem Modell-Fallback bei Ratenbegrenzung |

Überlastungs- und Ratenbegrenzungsfehler werden aggressiver behandelt als Abklingzeiten bei Abrechnungsfehlern: Standardmäßig erlaubt OpenClaw einen erneuten Versuch mit einem anderen Authentifizierungsprofil desselben Providers und wechselt anschließend ohne Wartezeit zum nächsten konfigurierten Fallback-Modell.

## Modell-Fallback

Wenn alle Profile eines Providers fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Ratenbegrenzungen und Zeitüberschreitungen, nachdem sämtliche Profilwechsel ausgeschöpft wurden. Andere Fehler lösen keinen Wechsel zum Fallback aus. Providerfehler, die nicht genügend Details enthalten, werden im Fallback-Status dennoch präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider weder eine verwendbare Meldung noch einen verwendbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die unverarbeitete Vorschau beibehalten hat, aber noch keine Klassifizierung darauf zutraf.

Signale für einen ausgelasteten Provider wie `ModelNotReadyException` werden der Überlastungskategorie zugeordnet und folgen derselben Richtlinie „ein Profilwechsel, dann Fallback“ wie Ratenbegrenzungen (siehe die Tabelle mit den Standardwerten oben).

Wenn ein Durchlauf mit dem konfigurierten primären Standardmodell, dem primären Modell eines Cron-Auftrags, dem primären Modell eines Agenten mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung beginnt, kann OpenClaw die passende konfigurierte Fallback-Kette durchlaufen. Primäre Agentenmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (beispielsweise `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Überschreibungen für Provider und Modell) werden strikt behandelt: Wenn dieser Provider beziehungsweise dieses Modell nicht erreichbar ist oder vor der Ausgabe einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt über einen nicht zugehörigen Fallback zu antworten.

### Regeln für die Kandidatenkette

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` und den konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, jedoch nicht anhand der Modell-Zulassungsliste gefiltert. Sie gelten als ausdrückliche Absicht des Betreibers.
    - Wenn der aktuelle Durchlauf bereits ein konfiguriertes Fallback derselben Providerfamilie verwendet, nutzt OpenClaw weiterhin die vollständige konfigurierte Kette.
    - Wenn keine explizite Fallback-Überschreibung angegeben ist, werden konfigurierte Fallbacks vor dem konfigurierten primären Modell versucht, selbst wenn das angeforderte Modell einen anderen Provider verwendet.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte primäre Modell am Ende angefügt, damit die Kette nach Ausschöpfung früherer Kandidaten wieder beim regulären Standardmodell ankommen kann.
    - Wenn ein Aufrufer `fallbacksOverride` angibt, verwendet der Runner ausschließlich das angeforderte Modell und diese Überschreibungsliste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte primäre Modell als verborgenes Ziel für einen erneuten Versuch angefügt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Fortsetzung bei">
    - Authentifizierungsfehlern
    - Ratenbegrenzungen und ausgeschöpften Abklingzeiten
    - Überlastungsfehlern oder ausgelasteten Providern
    - Failover-Fehlern in Form einer Zeitüberschreitung
    - Deaktivierungen aufgrund von Abrechnungsfehlern
    - `LiveSessionModelSwitchError`, der in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Wiederholungsschleife verursacht
    - anderen nicht erkannten Fehlern, solange noch Kandidaten verbleiben

  </Tab>
  <Tab title="Keine Fortsetzung bei">
    - expliziten Abbrüchen, die nicht einer Zeitüberschreitung oder einem Failover entsprechen
    - Kontextüberlauffehlern, die innerhalb der Compaction- und Wiederholungslogik verbleiben sollten (beispielsweise `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` oder `ollama error: context length exceeded`)
    - einem abschließenden unbekannten Fehler, wenn keine Kandidaten mehr vorhanden sind
    - Sicherheitsablehnungen von Claude Fable 5; direkte Anfragen mit API-Schlüssel behandeln diese stattdessen auf Providerebene über Anthropics serverseitigen Fallback auf `claude-opus-4-8` (siehe [Anthropic](/de/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Verhalten beim Überspringen und Prüfen von Abklingzeiten

Wenn sich alle Authentifizierungsprofile eines Providers bereits in der Abklingzeit befinden, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Stattdessen trifft es für jeden Kandidaten eine eigene Entscheidung:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Dauerhafte Authentifizierungsfehler führen dazu, dass der gesamte Provider sofort übersprungen wird.
    - Deaktivierungen aufgrund von Abrechnungsfehlern führen normalerweise zum Überspringen, der primäre Kandidat kann jedoch weiterhin gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
    - Der primäre Kandidat kann kurz vor Ablauf der Abklingzeit mit einer providerspezifischen Drosselung geprüft werden.
    - Andere Fallback-Modelle desselben Providers können trotz Abklingzeit versucht werden, wenn der Fehler vorübergehend erscheint (`rate_limit`, `overloaded` oder unbekannt). Dies ist besonders relevant, wenn eine Ratenbegrenzung modellspezifisch ist und ein anderes Modell möglicherweise sofort wieder funktioniert.
    - Prüfungen vorübergehender Abklingzeiten sind auf eine pro Provider und Fallback-Durchlauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht verzögert.

  </Accordion>
</AccordionGroup>

## Sitzungsüberschreibungen und Modellwechsel während des Betriebs

Änderungen des Sitzungsmodells sind ein gemeinsamer Status. Der aktive Runner, der Befehl `/model`, Compaction- und Sitzungsaktualisierungen sowie der Abgleich laufender Sitzungen lesen oder schreiben jeweils Teile desselben Sitzungseintrags.

Daher müssen Fallback-Wiederholungsversuche mit Modellwechseln während des Betriebs koordiniert werden:

- Nur explizite, vom Benutzer veranlasste Modelländerungen markieren einen ausstehenden Modellwechsel während des Betriebs. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Wechsel, Heartbeat-Überschreibungen oder Compaction markieren niemals selbstständig einen ausstehenden Modellwechsel während des Betriebs.
- Vom Benutzer veranlasste Modellüberschreibungen gelten für die Fallback-Richtlinie als exakte Auswahl. Daher wird ein nicht erreichbarer ausgewählter Provider als Fehler angezeigt, statt durch `agents.defaults.model.fallbacks` verdeckt zu werden.
- Bevor ein Fallback-Wiederholungsversuch beginnt, persistiert der Antwort-Runner die ausgewählten Felder der Fallback-Überschreibung im Sitzungseintrag.
- Automatische Fallback-Überschreibungen bleiben in nachfolgenden Durchläufen ausgewählt, damit OpenClaw nicht bei jeder Nachricht ein bekanntermaßen fehlerhaftes primäres Modell prüft. OpenClaw prüft den konfigurierten Ursprung regelmäßig erneut und entfernt die automatische Überschreibung nach dessen Wiederherstellung. `/new`, `/reset` und `sessions.reset` entfernen automatisch erzeugte Überschreibungen sofort.
- Benutzerantworten kündigen Fallback-Übergänge und die Wiederherstellung nach Aufhebung des Fallbacks einmal pro Statusänderung an. Durchläufe mit beibehaltenem Fallback wiederholen den Hinweis nicht.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Status davon abweicht, das aktive Fallback-Modell sowie den Grund.
- Beim Abgleich laufender Sitzungen haben persistierte Sitzungsüberschreibungen Vorrang vor veralteten Modellfeldern der Laufzeit.
- Wenn ein Fehler beim Modellwechsel während des Betriebs auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zunächst nicht zugehörige Kandidaten zu durchlaufen.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die von ihm geschriebenen Überschreibungsfelder zurück und auch nur dann, wenn sie weiterhin diesem fehlgeschlagenen Kandidaten entsprechen.

Dies verhindert den klassischen Wettlauf:

<Steps>
  <Step title="Primäres Modell schlägt fehl">
    Das ausgewählte primäre Modell schlägt fehl.
  </Step>
  <Step title="Fallback im Arbeitsspeicher ausgewählt">
    Der Fallback-Kandidat wird im Arbeitsspeicher ausgewählt.
  </Step>
  <Step title="Sitzungsspeicher enthält weiterhin das alte primäre Modell">
    Der Sitzungsspeicher verweist weiterhin auf das alte primäre Modell.
  </Step>
  <Step title="Abgleich während des Betriebs liest veralteten Status">
    Der Abgleich der laufenden Sitzung liest den veralteten Sitzungsstatus.
  </Step>
  <Step title="Wiederholungsversuch wird zurückgesetzt">
    Der Wiederholungsversuch wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch beginnt.
  </Step>
</Steps>

Die persistierte Fallback-Überschreibung schließt dieses Zeitfenster, während das gezielte Zurücksetzen neuere manuelle oder laufzeitbedingte Sitzungsänderungen beibehält.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details zu jedem Versuch auf, die in Protokolle und benutzerseitige Meldungen zu Abklingzeiten einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Protokolle enthalten außerdem flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), sodass Protokoll- und Diagnoseexporter den primären Fehler rekonstruieren können, selbst wenn auch der abschließende Fallback fehlschlägt.

Wenn alle Kandidaten fehlschlagen, löst OpenClaw `FallbackSummaryError` aus. Der äußere Antwort-Runner kann damit eine spezifischere Meldung wie „für alle Modelle gelten vorübergehend Ratenbegrenzungen“ erstellen und, sofern bekannt, das früheste Ende einer Abkühlphase angeben.

Diese Zusammenfassung der Abkühlphasen berücksichtigt das jeweilige Modell:

- nicht zugehörige, modellspezifische Ratenbegrenzungen werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Sperre eine passende modellspezifische Ratenbegrenzung ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell weiterhin blockiert

## Zugehörige Konfiguration

Unter [Gateway-Konfiguration](/de/gateway/configuration) finden Sie Informationen zu:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- Routing von `agents.defaults.imageModel`

Unter [Modelle](/de/concepts/models) finden Sie einen umfassenderen Überblick über die Modellauswahl und Fallbacks.
