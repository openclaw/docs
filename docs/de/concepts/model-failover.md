---
read_when:
    - Diagnose der Rotation von Authentifizierungsprofilen, Cooldowns oder des Modell-Fallback-Verhaltens
    - Failover-Regeln für Authentifizierungsprofile oder Modelle aktualisieren
    - Verstehen, wie Modellüberschreibungen für Sitzungen mit Wiederholungsversuchen unter Verwendung von Fallbacks interagieren
sidebarTitle: Model failover
summary: Wie OpenClaw Authentifizierungsprofile rotiert und auf andere Modelle ausweicht
title: Modell-Failover
x-i18n:
    generated_at: "2026-07-24T03:45:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3dfedbc85038eebb5be056a7b3ffa3275b4329a0b0d791e1a2b4701cbaa4b595
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw behandelt Fehler in zwei Stufen:

1. **Rotation des Auth-Profils** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

## Laufzeitablauf

<Steps>
  <Step title="Sitzungsstatus auflösen">
    Das aktive Sitzungsmodell und die Präferenz für das Auth-Profil auflösen.
  </Step>
  <Step title="Kandidatenkette erstellen">
    Die Modellkandidatenkette aus der aktuellen Modellauswahl und der Fallback-Richtlinie für die Quelle dieser Auswahl erstellen. Konfigurierte Standardwerte, primäre Modelle von Cron-Jobs und automatisch ausgewählte Fallback-Modelle können konfigurierte Fallbacks verwenden; explizite Benutzerauswahlen für Sitzungen sind strikt.
  </Step>
  <Step title="Aktuellen Provider versuchen">
    Den aktuellen Provider unter Anwendung der Regeln für Rotation und Cooldown von Auth-Profilen versuchen.
  </Step>
  <Step title="Bei Failover-relevanten Fehlern fortfahren">
    Wenn die Möglichkeiten dieses Providers aufgrund eines Failover-relevanten Fehlers ausgeschöpft sind, zum nächsten Modellkandidaten wechseln.
  </Step>
  <Step title="Fallback für den aktuellen Durchlauf verwenden">
    Den erfolgreichen Fallback-Kandidaten ausführen, ohne den für die Sitzung ausgewählten Provider oder das Modell zu ändern.
  </Step>
  <Step title="Sichere reine Überlastung erneut versuchen">
    Wenn alle Kandidaten ausschließlich wegen überlasteter Provider fehlschlagen, die vollständige durchlauflokale Kette mit exponentiellem Backoff bis zu 10-mal erneut versuchen, solange weder eine Werkzeugausführung noch eine Assistentenausgabe begonnen hat. Nach 30 Sekunden einmalig einen Statushinweis senden, damit der Benutzer nicht ohne Rückmeldung warten muss.
  </Step>
  <Step title="Bei ausgeschöpften Kandidaten FallbackSummaryError auslösen">
    Wenn alle Kandidaten fehlschlagen, einen `FallbackSummaryError` mit Details zu jedem Versuch und dem frühesten Ablaufzeitpunkt eines Cooldowns auslösen, sofern dieser bekannt ist.
  </Step>
</Steps>

Die Fallback-Ausführung gilt nur für den jeweiligen Durchlauf. Der Antwort-Runner speichert ausschließlich den Zustand der Fallback-Hinweise, damit `/status` und Übergangshinweise zwischen dem ausgewählten Modell und dem antwortenden Modell unterscheiden können; er speichert den Fallback nicht als Modellauswahl für den nächsten Durchlauf.

## Richtlinie für Auswahlquellen

Die Auswahlquelle bestimmt, ob die Fallback-Kette zulässig ist:

- **Konfigurierter Standardwert**: `agents.defaults.model.primary` verwendet `agents.defaults.model.fallbacks`.
- **Primäres Agentenmodell**: `agents.entries.*.model` ist strikt, sofern das Modellobjekt dieses Agenten nicht über ein eigenes `fallbacks` verfügt. Verwenden Sie `fallbacks: []`, um das strikte Verhalten ausdrücklich festzulegen, oder eine nicht leere Liste, um den Modell-Fallback für diesen Agenten zu aktivieren.
- **Laufzeit-Fallback**: Der Fallback-Kandidat gilt nur für den aktuellen Durchlauf. Der nächste Durchlauf beginnt wieder mit dem ausgewählten primären Modell. OpenClaw erkennt weiterhin zuvor gespeicherte `modelOverrideSource: "auto"`-Einträge, prüft deren konfigurierten Ursprung alle 5 Minuten und entfernt sie, sobald der Ursprung wieder verfügbar ist. `/new`, `/reset` und `sessions.reset` entfernen diese Einträge ebenfalls.
- **Benutzerdefinierte Sitzungsüberschreibung**: `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` schreiben `modelOverrideSource: "user"`. Dies ist eine exakte Sitzungsauswahl. Wenn der ausgewählte Provider oder das ausgewählte Modell fehlschlägt, bevor eine Antwort erzeugt wurde, meldet OpenClaw den Fehler, statt mit einem nicht zugehörigen konfigurierten Fallback zu antworten.
- **Veraltete Sitzungsüberschreibung**: Ältere Sitzungseinträge können `modelOverride` ohne `modelOverrideSource` enthalten. OpenClaw behandelt diese als Benutzerüberschreibungen, damit eine explizite alte Auswahl nicht stillschweigend in Fallback-Verhalten umgewandelt wird.
- **Cron-Nutzlastmodell**: Ein `payload.model` / `--model` eines Cron-Jobs ist das primäre Modell des Jobs und keine benutzerdefinierte Sitzungsüberschreibung. Es verwendet konfigurierte Fallbacks, sofern der Job nicht `payload.fallbacks` bereitstellt; `payload.fallbacks: []` sorgt für eine strikte Cron-Ausführung.

OpenClaw sendet einen sichtbaren Hinweis, wenn ein Durchlauf zu einem Fallback wechselt, und einen weiteren Hinweis, wenn ein späterer Durchlauf mit dem ausgewählten primären Modell erfolgreich ist. Der gespeicherte Hinweisstatus verhindert wiederholte Hinweise, wenn aufeinanderfolgende Durchläufe dasselbe Paar aus ausgewähltem und aktivem Modell verwenden, während die Modellauswahl selbst unverändert bleibt.

## Cache zum Überspringen von Auth-Fehlern

Standardmäßig behält jeder neue Durchlauf das bestehende Wiederholungsverhalten für Fallbacks bei: OpenClaw versucht jeden konfigurierten Fallback-Kandidaten erneut, einschließlich nicht primärer Kandidaten, die kürzlich mit `auth` oder `auth_permanent` fehlgeschlagen sind.

Aktivieren Sie die Unterdrückung wiederholter Auth-Fehler mit:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Wenn diese Funktion aktiviert ist, speichert OpenClaw nach einem Fehler der Auth-Klasse eine sitzungsbezogene Überspringmarkierung im Arbeitsspeicher für einen nicht primären Fallback-Kandidaten. Der Schlüssel besteht aus Sitzungs-ID, Provider und Modell. Primäre Kandidaten werden niemals übersprungen, sodass bei einer expliziten Modellauswahl durch den Benutzer weiterhin der tatsächliche Auth-Fehler angezeigt wird. Der Cache ist prozesslokal und wird bei einem Neustart des Gateways geleert.

Der Wert ist eine TTL in Millisekunden. `0` oder ein nicht gesetzter Wert deaktiviert den Cache. Positive Werte werden auf einen Bereich zwischen 1 Sekunde und 10 Minuten begrenzt.

## Für Benutzer sichtbare Fallback-Hinweise

Wenn eine Sitzung zu einem automatisch ausgewählten Fallback wechselt, sendet OpenClaw einen Statushinweis auf derselben Antwortoberfläche:

```text
↪️ Modell-Fallback: <fallback> (ausgewählt: <primary>; <reason>)
```

Wenn eine spätere Prüfung erfolgreich ist und die Sitzung zum ausgewählten primären Modell zurückkehrt, sendet OpenClaw:

```text
↪️ Modell-Fallback aufgehoben: <primary> (zuvor <fallback>)
```

Diese Hinweise sind Betriebsmeldungen und keine Assistenteninhalte. Sie werden einmal pro Statusänderung zugestellt, nach Möglichkeit auch bei Durchläufen, die ausschließlich Nebeneffekte haben; wiederholte durchlauflokale Fallback-Übergänge führen jedoch nicht zu erneuten Hinweisen. Die Zustellung umgeht die normale Unterdrückung von Antworten an die Quelle, belegt bei Kanälen mit Threads nicht den Platz für die erste Assistentenantwort und ist von Sprachausgabe sowie Zusagenextraktion ausgeschlossen.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Geheimnisse und der Laufzeitstatus des Auth-Routings befinden sich in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Die Konfigurationen `auth.profiles` / `auth.order` enthalten **nur Metadaten + Routing** (keine Geheimnisse).
- Veraltete, ausschließlich für den Import vorgesehene OAuth-Datei: `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in den agentenspezifischen Auth-Speicher importiert).
- Veraltete Dateien `auth-profiles.json`, `auth-state.json` und agentenspezifische Dateien `auth.json` werden von `openclaw doctor --fix` importiert.

Weitere Einzelheiten: [OAuth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)
- `type: "token"` → statisches Token im Bearer-Stil, optional mit Ablaufzeit; OpenClaw aktualisiert es nicht (verwendet für `aws-sdk` und andere Auth-Modi mit Anmeldedatenketten)

## Profil-IDs

OAuth-Anmeldungen erstellen separate Profile, sodass mehrere Konten nebeneinander bestehen können.

- Standardwert: `provider:default`, wenn keine E-Mail-Adresse verfügbar ist.
- OAuth mit E-Mail-Adresse: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile befinden sich im agentenspezifischen Auth-Profilspeicher `openclaw-agent.sqlite`.

## Rotationsreihenfolge

Wenn ein Provider über mehrere Profile verfügt, bestimmt OpenClaw die Reihenfolge wie folgt:

<Steps>
  <Step title="Explizite Konfiguration">
    `auth.order[provider]` (sofern festgelegt).
  </Step>
  <Step title="Konfigurierte Profile">
    `auth.profiles`, nach Provider gefiltert.
  </Step>
  <Step title="Gespeicherte Profile">
    Agentenspezifische SQLite-Auth-Profileinträge für den Provider.
  </Step>
</Steps>

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth, dann statisches Token, dann API-Schlüssel**).
- **Sekundärschlüssel für OAuth:** Profile mit einem aktuell verwendbaren Zugriffstoken vor
  Profilen, deren Zugriffstoken abgelaufen ist. Abgelaufene OAuth-Profile bleiben auswählbar, damit
  die Laufzeit sie aktualisieren kann, wenn kein verwendbares anderes Profil verfügbar ist.
- **Nächster Schlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jeder Typ-/Statusstufe).
- **Profile im Cooldown oder deaktivierte Profile** werden ans Ende verschoben und nach dem frühesten Ablaufzeitpunkt sortiert.

### Sitzungsbindung (cachefreundlich)

OpenClaw **bindet das ausgewählte Auth-Profil an die jeweilige Sitzung**, um die Provider-Caches warm zu halten. Es rotiert **nicht** bei jeder Anfrage. Das gebundene Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen wird (der Compaction-Zähler wird erhöht)
- sich das Profil im Cooldown befindet oder deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` legt eine **Benutzerüberschreibung** für diese Sitzung fest und wird bis zum Beginn einer neuen Sitzung nicht automatisch rotiert.

<Note>
Automatisch gebundene Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt: Sie werden zuerst versucht, OpenClaw kann bei Ratenbegrenzungen oder Zeitüberschreitungen jedoch zu einem anderen Profil rotieren. Wenn das ursprüngliche Profil wieder verfügbar ist, können neue Ausführungen es erneut bevorzugen, ohne das ausgewählte Modell oder die Laufzeit zu ändern. Vom Benutzer gebundene Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt das Profil zu wechseln.
</Note>

### OpenAI-Codex-Abonnement mit API-Schlüssel als Absicherung

Bei OpenAI-Agentenmodellen sind Authentifizierung und Laufzeit voneinander getrennt. `openai/gpt-*` verbleibt im Codex-Harness, während die Authentifizierung zwischen einem Codex-Abonnementprofil und einem OpenAI-API-Schlüssel als Absicherung rotieren kann.

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

Verwenden Sie `openai:*` sowohl für ChatGPT-/Codex-OAuth-Profile als auch für OpenAI-API-Schlüsselprofile. Wenn das Abonnement ein Codex-Nutzungslimit erreicht, speichert OpenClaw den exakten Rücksetzzeitpunkt, sofern Codex einen bereitstellt, versucht das nächste Auth-Profil in der Reihenfolge und belässt die Ausführung im Codex-Harness. Sobald der Rücksetzzeitpunkt verstrichen ist, kann das Abonnementprofil wieder ausgewählt werden, und die nächste automatische Auswahl kann dorthin zurückkehren.

Verwenden Sie ein vom Benutzer gebundenes Profil nur, wenn für diese Sitzung die Verwendung eines bestimmten Kontos oder Schlüssels erzwungen werden soll. Vom Benutzer gebundene Profile sind absichtlich strikt und wechseln nicht stillschweigend zu einem anderen Profil.

## Cooldowns

Wenn ein Profil aufgrund von Auth- oder Ratenbegrenzungsfehlern fehlschlägt (oder aufgrund einer Zeitüberschreitung, die wie eine Ratenbegrenzung wirkt), versetzt OpenClaw es in den Cooldown und wechselt zum nächsten Profil.

<AccordionGroup>
  <Accordion title="Was der Kategorie für Ratenbegrenzung/Zeitüberschreitung zugeordnet wird">
    Diese Ratenbegrenzungskategorie ist umfassender als lediglich `429`: Sie schließt auch Provider-Meldungen wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` sowie regelmäßige Nutzungslimits wie `weekly limit reached` oder `monthly limit exhausted` ein.

    Format- und Fehler aufgrund ungültiger Anfragen sind in der Regel endgültig, da ein erneuter Versuch mit derselben Nutzlast auf dieselbe Weise fehlschlagen würde. Daher zeigt OpenClaw sie an, statt die Auth-Profile zu rotieren. Bekannte Wiederholungs- und Reparaturpfade können ausdrücklich aktiviert werden: Beispielsweise werden Validierungsfehler bei Tool-Aufruf-IDs von Cloud Code Assist bereinigt und gemäß der Richtlinie `allowFormatRetry` einmal erneut versucht.

    OpenAI-kompatible, **vom Provider abgeschlossene** Stopp-/Beendigungsgründe wie `Unhandled stop reason: error`, `stop reason: error`, `reason: error` und `Provider finish_reason: error` werden als **`server_error`** (HTTP-ähnlicher Status 500) und nicht als Zeitüberschreitung klassifiziert. Sie bleiben für Failover durch Modell-/Profilrotation geeignet, die Diagnose behält jedoch den Text des Beendigungsgrunds des Providers bei, statt den Benutzertext in „Zeitüberschreitung der LLM-Anfrage.“ umzuschreiben. Transportbezogene Beendigungsgründe wie `Provider finish_reason: abort`, `network_error` und `malformed_response` verbleiben in der Kategorie für Zeitüberschreitung/Failover (Status 408).

    Generischer Servertext kann ebenfalls dieser Zeitüberschreitungskategorie zugeordnet werden, wenn die Quelle einem bekannten vorübergehenden Muster entspricht. Beispielsweise wird die reine Stream-Wrapper-Meldung der Modelllaufzeit `An unknown error occurred` für jeden Provider als Failover-relevant behandelt, da die gemeinsame Modelllaufzeit sie ausgibt, wenn Provider-Streams ohne spezifische Details mit `stopReason: "aborted"` oder `stopReason: "error"` enden. JSON-Nutzlasten vom Typ `api_error` mit vorübergehendem Servertext wie `internal server error`, `unknown error, 520`, `upstream error` oder `backend error` werden ebenfalls als Failover-relevante Zeitüberschreitungen behandelt.

    OpenRouter-spezifischer generischer Upstream-Text wie etwa ein alleinstehendes `Provider returned error` wird nur dann als Zeitüberschreitung behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner Fallback-Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst für sich allein keinen Failover aus.

  </Accordion>
  <Accordion title="Retry-after-Obergrenzen des SDK">
    Einige Provider-SDKs würden andernfalls möglicherweise für ein langes `Retry-After`-Zeitfenster pausieren, bevor sie die Kontrolle an OpenClaw zurückgeben. Bei Stainless-basierten SDKs wie Anthropic und OpenAI begrenzt OpenClaw SDK-interne Wartezeiten für `retry-after-ms` / `retry-after` standardmäßig auf 60 Sekunden und gibt länger dauernde wiederholbare Antworten sofort weiter, damit dieser Failover-Pfad ausgeführt werden kann. Passen Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` an oder deaktivieren Sie sie; siehe [Wiederholungsverhalten](/de/concepts/retry).
  </Accordion>
  <Accordion title="Modellspezifische Abklingzeiten">
    Abklingzeiten für Ratenbegrenzungen können auch modellspezifisch sein:

    - OpenClaw zeichnet bei Ratenbegrenzungsfehlern `cooldownModel` auf, wenn die ID des fehlgeschlagenen Modells bekannt ist.
    - Ein verwandtes Modell beim selben Provider kann weiterhin ausprobiert werden, wenn die Abklingzeit für ein anderes Modell gilt.
    - Abrechnungs-/Deaktivierungszeiträume blockieren weiterhin das gesamte Profil über alle Modelle hinweg.

  </Accordion>
</AccordionGroup>

Reguläre Abklingzeiten (weder abrechnungsbedingt noch dauerhaft authentifizierungsbedingt) richten sich nach der Anzahl der kürzlich aufgetretenen Fehler des Profils:

- 1\. Fehler: 30 Sekunden
- 2\. Fehler: 1 Minute
- Ab dem 3. Fehler: 5 Minuten (Obergrenze)

Die Zähler werden zurückgesetzt, sobald das integrierte Fehlerzeitfenster des Profils abgelaufen ist.

Der Zustand wird im agentenspezifischen SQLite-Authentifizierungszustand unter `usageStats` gespeichert:

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

## Deaktivierungen wegen Abrechnungsproblemen

Abrechnungs-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als Grund für einen Failover behandelt, sind jedoch normalerweise nicht vorübergehend. Statt einer kurzen Abklingzeit markiert OpenClaw das Profil als **deaktiviert** (mit einem längeren Backoff) und wechselt zum nächsten Profil/Provider.

<Note>
Nicht jede Antwort, die wie ein Abrechnungsfehler aussieht, ist `402`, und nicht jeder HTTP-Status `402` fällt in diese Kategorie. OpenClaw ordnet eindeutigen Abrechnungstext auch dann der Abrechnungskategorie zu, wenn ein Provider stattdessen `401` oder `403` zurückgibt. Provider-spezifische Matcher bleiben jedoch auf den jeweiligen Provider beschränkt (zum Beispiel OpenRouter `403 Key limit exceeded`).

Vorübergehende `402`-Fehler bei Nutzungszeitfenstern und Ausgabenlimits von Organisationen/Arbeitsbereichen werden dagegen als `rate_limit` klassifiziert, wenn die Meldung wiederholbar erscheint (zum Beispiel `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oder `organization spending limit exceeded`). Diese verbleiben auf dem Pfad für kurze Abklingzeiten und Failover statt auf dem Pfad für langfristige Deaktivierungen wegen Abrechnungsproblemen.
</Note>

Mit hoher Sicherheit dauerhafte Authentifizierungsfehler (widerrufene/deaktivierte Schlüssel, deaktivierte Arbeitsbereiche) werden ähnlich deaktiviert, erholen sich jedoch wesentlich früher als Abrechnungsfehler, da einige Provider bei Störungen vorübergehend wie Authentifizierungsfehler aussehende Nutzdaten zurückgeben.

Der Zustand wird im agentenspezifischen SQLite-Authentifizierungszustand gespeichert:

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

Überlastungs- und Ratenbegrenzungsfehler werden aggressiver behandelt als Abrechnungs-Abklingzeiten: Standardmäßig erlaubt OpenClaw einen erneuten Versuch mit einem Authentifizierungsprofil desselben Providers und wechselt anschließend ohne Wartezeit zum nächsten konfigurierten Modell-Fallback.

## Modell-Fallback

Wenn alle Profile eines Providers fehlschlagen, wechselt OpenClaw zum nächsten Modell in `agents.defaults.model.fallbacks`. Dies gilt für Authentifizierungsfehler, Ratenbegrenzungen und Zeitüberschreitungen, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler lösen keinen weiteren Fallback aus). Provider-Fehler, die nicht genügend Details bereitstellen, werden im Fallback-Zustand dennoch präzise gekennzeichnet: `empty_response` bedeutet, dass der Provider weder eine verwendbare Meldung noch einen verwendbaren Status zurückgegeben hat, `no_error_details` bedeutet, dass der Provider ausdrücklich `Unknown error (no error details in response)` zurückgegeben hat, und `unclassified` bedeutet, dass OpenClaw die unverarbeitete Vorschau beibehalten hat, bisher jedoch kein Klassifikator darauf zutraf.

Signale für eine Auslastung des Providers wie `ModelNotReadyException` fallen in die Überlastungskategorie und folgen derselben Richtlinie „eine Rotation, dann Fallback“ wie Ratenbegrenzungen (siehe die Standardwerttabelle oben).

Wenn die gesamte Kandidatenkette ausschließlich aufgrund von Überlastungsfehlern ausgeschöpft wird, versucht der Antwort-Runner die Kette im selben Durchlauf bis zu 10-mal erneut. Eine Wiederholung des gesamten Durchlaufs ist nur zulässig, bevor die Werkzeugausführung oder die Assistentenausgabe beginnt. Dadurch werden doppelte Änderungen oder Nachrichten vermieden, falls nach bereits wahrnehmbarer Arbeit eine Überlastung auftritt. Der Backoff beginnt bei 2,5 Sekunden und verdoppelt sich bis zu einer Obergrenze von 30 Sekunden. Sobald der Durchlauf 30 Sekunden gewartet hat, sendet OpenClaw einmalig einen vorübergehenden Statushinweis: `The AI service is temporarily overloaded. I’m still retrying; this may take a few minutes.` Der erneute Versuch und ein möglicher erfolgreicher Fallback bleiben auf den aktuellen Durchlauf beschränkt; für gewöhnliche vorübergehende Serverfehler gilt weiterhin die separate Richtlinie mit einem erneuten Versuch.

Wenn ein Lauf mit dem konfigurierten standardmäßigen Primärmodell, dem Primärmodell eines Cron-Jobs, dem Primärmodell eines Agenten mit expliziten Fallbacks oder einer automatisch ausgewählten Fallback-Überschreibung beginnt, kann OpenClaw die entsprechende konfigurierte Fallback-Kette durchlaufen. Agenten-Primärmodelle ohne explizite Fallbacks und explizite Benutzerauswahlen (zum Beispiel `/model ollama/qwen3.5:27b`, die Modellauswahl, `sessions.patch` oder einmalige CLI-Überschreibungen für Provider/Modell) sind strikt: Wenn dieser Provider bzw. dieses Modell nicht erreichbar ist oder vor dem Erzeugen einer Antwort fehlschlägt, meldet OpenClaw den Fehler, statt mit einem nicht zugehörigen Fallback zu antworten.

### Regeln für die Kandidatenkette

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model` und den konfigurierten Fallbacks.

<AccordionGroup>
  <Accordion title="Regeln">
    - Das angeforderte Modell steht immer an erster Stelle.
    - Explizit konfigurierte Fallbacks werden dedupliziert, jedoch nicht anhand der Modell-Zulassungsliste gefiltert. Sie gelten als ausdrückliche Absicht des Betreibers.
    - Wenn der aktuelle Lauf bereits einen konfigurierten Fallback derselben Provider-Familie verwendet, nutzt OpenClaw weiterhin die gesamte konfigurierte Kette.
    - Wenn keine explizite Fallback-Überschreibung angegeben ist, werden konfigurierte Fallbacks vor dem konfigurierten Primärmodell ausprobiert, selbst wenn das angeforderte Modell einen anderen Provider verwendet.
    - Wenn dem Fallback-Runner keine explizite Fallback-Überschreibung übergeben wird, wird das konfigurierte Primärmodell am Ende angefügt, damit die Kette nach Ausschöpfung früherer Kandidaten wieder zum regulären Standardmodell zurückkehren kann.
    - Wenn ein Aufrufer `fallbacksOverride` angibt, verwendet der Runner genau das angeforderte Modell und diese Überschreibungsliste. Eine leere Liste deaktiviert den Modell-Fallback und verhindert, dass das konfigurierte Primärmodell als verborgenes Ziel für einen erneuten Versuch angefügt wird.

  </Accordion>
</AccordionGroup>

### Welche Fehler den Fallback fortsetzen

<Tabs>
  <Tab title="Fortsetzung bei">
    - Authentifizierungsfehlern
    - Ratenbegrenzungen und ausgeschöpften Abklingzeiten
    - Überlastungsfehlern bzw. Auslastung des Providers
    - Failover-Fehlern in Form einer Zeitüberschreitung
    - Deaktivierungen wegen Abrechnungsproblemen
    - `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, damit ein veraltetes persistiertes Modell keine äußere Wiederholungsschleife erzeugt
    - anderen nicht erkannten Fehlern, solange noch weitere Kandidaten vorhanden sind

  </Tab>
  <Tab title="Keine Fortsetzung bei">
    - expliziten Abbrüchen, die nicht wie eine Zeitüberschreitung oder ein Failover aussehen
    - Kontextüberlauffehlern, die innerhalb der Compaction-/Wiederholungslogik verbleiben sollen (zum Beispiel `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` oder `ollama error: context length exceeded`)
    - einem abschließenden unbekannten Fehler, wenn keine Kandidaten mehr vorhanden sind
    - Sicherheitsablehnungen von Claude Fable 5; direkte Anfragen mit API-Schlüssel behandeln diese stattdessen auf Provider-Ebene über Anthropics serverseitigen Fallback auf `claude-opus-4-8` (siehe [Anthropic](/de/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Verhalten beim Überspringen oder Prüfen während der Abklingzeit

Wenn sich bereits alle Authentifizierungsprofile eines Providers in einer Abklingzeit befinden, überspringt OpenClaw diesen Provider nicht automatisch dauerhaft. Die Entscheidung wird für jeden Kandidaten einzeln getroffen:

<AccordionGroup>
  <Accordion title="Entscheidungen pro Kandidat">
    - Dauerhafte Authentifizierungsfehler führen zum sofortigen Überspringen des gesamten Providers.
    - Deaktivierungen wegen Abrechnungsproblemen führen normalerweise zum Überspringen, der Primärkandidat kann jedoch gedrosselt geprüft werden, sodass eine Wiederherstellung ohne Neustart möglich ist.
    - Der Primärkandidat kann kurz vor Ablauf der Abklingzeit geprüft werden, mit einer Drosselung pro Provider.
    - Fallback-Geschwistermodelle desselben Providers können trotz Abklingzeit ausprobiert werden, wenn der Fehler vorübergehend erscheint (`rate_limit`, `overloaded` oder unbekannt). Dies ist besonders relevant, wenn eine Ratenbegrenzung modellspezifisch ist und ein Geschwistermodell möglicherweise sofort wieder funktioniert.
    - Vorübergehende Prüfungen während der Abklingzeit sind auf eine Prüfung pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den Provider-übergreifenden Fallback nicht verzögert.

  </Accordion>
</AccordionGroup>

## Sitzungsüberschreibungen und Live-Modellwechsel

Änderungen des Sitzungsmodells sind ein gemeinsam genutzter Zustand. Der aktive Runner, der Befehl `/model`, Compaction-/Sitzungsaktualisierungen und der Live-Sitzungsabgleich lesen oder schreiben jeweils Teile desselben Sitzungseintrags. Die Fallback-Ausführung schreibt keine Modellauswahlfelder und kann daher während eines erneuten Versuchs keine neuere manuelle Auswahl ersetzen.

Für Live-Modellwechsel gelten folgende Regeln:

- Nur explizite, benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen oder Compaction markieren niemals von sich aus einen ausstehenden Live-Wechsel.
- Benutzergesteuerte Modellüberschreibungen werden für die Fallback-Richtlinie als exakte Auswahl behandelt. Daher wird ein nicht erreichbarer ausgewählter Provider als Fehler gemeldet, statt durch `agents.defaults.model.fallbacks` verdeckt zu werden.
- Laufzeit-Fallback-Kandidaten bleiben auf den aktuellen Durchlauf beschränkt. Der nächste Durchlauf beginnt mit dem aktuell ausgewählten Modell, einschließlich einer manuellen Auswahl, die während des vorherigen Laufs eingegangen ist.
- Zuvor gespeicherte automatische Fallback-Überschreibungen werden weiterhin unterstützt: OpenClaw prüft regelmäßig ihren konfigurierten Ursprung und entfernt die Überschreibung, sobald dieser wieder funktioniert; `/new`, `/reset` und `sessions.reset` entfernen automatisch erzeugte Überschreibungen sofort.
- Benutzerantworten kündigen Fallback-Übergänge und die Wiederherstellung nach Entfernung des Fallbacks einmal pro Zustandsänderung an. Wiederholte Durchläufe mit demselben ausgewählten/aktiven Paar wiederholen den Hinweis nicht.
- `/status` zeigt das ausgewählte Modell und, wenn der Fallback-Zustand davon abweicht, das aktive Fallback-Modell und den Grund.
- Beim Live-Sitzungsabgleich haben persistierte Sitzungsüberschreibungen Vorrang vor veralteten Laufzeit-Modellfeldern.
- Wenn ein Live-Wechselfehler auf einen späteren Kandidaten in der aktiven Fallback-Kette verweist, springt OpenClaw direkt zu diesem ausgewählten Modell, statt zunächst nicht zugehörige Kandidaten zu durchlaufen.

Der aktive Lauf führt den ausgewählten Kandidaten direkt mit. Der Live-Abgleich ändert diesen Kandidaten nur bei einem explizit ausstehenden Benutzerwechsel, sodass weder eine vorübergehende Fallback-Überschreibung noch eine Rücknahme erforderlich ist.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details zu jedem Versuch auf, die in Protokolle und benutzerseitige Meldungen zu Abklingzeiten einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Strukturierte `model_fallback_decision`-Protokolle enthalten außerdem flache `fallbackStep*`-Felder, wenn ein Kandidat fehlschlägt, übersprungen wird oder ein späterer Fallback erfolgreich ist. Diese Felder machen den versuchten Übergang explizit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), sodass Protokoll- und Diagnoseexporter den Fehler des Primärmodells rekonstruieren können, selbst wenn auch der abschließende Fallback fehlschlägt.

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere Antwort-Runner kann dies verwenden, um eine spezifischere Meldung wie „Alle Modelle sind vorübergehend ratenbegrenzt“ zu erstellen und den frühesten Ablauf der Abklingzeit anzugeben, sofern dieser bekannt ist.

Diese Zusammenfassung der Abklingzeiten berücksichtigt das Modell:

- nicht zugehörige modellspezifische Ratenbegrenzungen werden für die versuchte Provider-/Modellkette ignoriert
- wenn die verbleibende Sperre eine passende modellspezifische Ratenbegrenzung ist, meldet OpenClaw den letzten passenden Ablaufzeitpunkt, der dieses Modell weiterhin sperrt

## Zugehörige Konfiguration

Informationen zu Folgendem finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration):

- `auth.profiles` / `auth.order`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Einen umfassenderen Überblick über die Modellauswahl und Fallbacks finden Sie unter [Modelle](/de/concepts/models).
