---
read_when:
    - Sie benötigen gezielte Debug-Protokolle, ohne die globalen Protokollierungsstufen zu erhöhen
    - Sie müssen subsystem-spezifische Protokolle für den Support erfassen
summary: Diagnose-Flags für gezielte Debug-Protokolle
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-07-24T03:46:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad3bdab6ba1fd98ba58c99c93f9a12d31f57e2655cb0c1eb2de09e34b970f56c
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnose-Flags aktivieren zusätzliche Protokollierung für ein Subsystem, ohne
`logging.level` global zu erhöhen. Ein Flag hat keine Wirkung, sofern es nicht von einem Subsystem geprüft wird.

## Funktionsweise

- Bei Flags wird die Groß-/Kleinschreibung nicht berücksichtigt. Sie werden aus `diagnostics.flags` in der
  Konfiguration sowie der Umgebungsüberschreibung `OPENCLAW_DIAGNOSTICS` aufgelöst, dedupliziert und in Kleinbuchstaben umgewandelt.
- `name.*` entspricht `name` selbst und allem unter `name.` (zum Beispiel
  entspricht `telegram.*` dem Wert `telegram.http`).
- `*` oder `all` aktiviert jedes Flag.
- Starten Sie das Gateway neu, nachdem Sie `diagnostics.flags` in der Konfiguration geändert haben; es wird nicht
  dynamisch neu geladen.

## Bekannte Flags

| Flag                  | Aktiviert                                                 |
| --------------------- | --------------------------------------------------------- |
| `telegram.http`       | Protokollierung von HTTP-Fehlern der Telegram Bot API     |
| `brave.http`          | Protokollierung von Brave-Search-Anfragen, -Antworten und -Cache |
| `profiler`            | Antwortphasen-Profiler und Codex-App-Server-Profiler (beide) |
| `reply.profiler`      | Nur Antwortphasen-Profiler                                |
| `codex.profiler`      | Nur Codex-App-Server-Profiler                             |
| `health`              | Debugdetails zu Gateway-Zustandsprüfung, Konto und Bindung |
| `ingress.timing`      | Zeitmessungen für das Laden von Sitzungen, die Modellauswahl und den Modellkatalog |
| `plugin.load-profile` | Zeitmessungen für das synchrone Laden von Plugin-Modulen  |
| `timeline`            | Strukturiertes JSONL-Zeitleistenartefakt (siehe unten)    |

## Über die Konfiguration aktivieren

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Mehrere Flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Umgebungsüberschreibung (einmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Werte werden an Kommas oder Leerzeichen getrennt. Besondere Werte:

| Wert                        | Wirkung                                  |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | Deaktiviert alle Flags und überschreibt auch die Konfiguration |
| `1`, `true`, `all`, `*`     | Aktiviert jedes Flag                     |

`OPENCLAW_DIAGNOSTICS=0` deaktiviert für diesen Prozess Flags aus der Umgebung und der Konfiguration.
Dies ist nützlich, um vorübergehend ein in der Konfiguration aktiviertes Profiler-Flag stummzuschalten,
ohne die Datei zu bearbeiten.

## Profiler-Flags

Profiler-Flags steuern leichtgewichtige Zeitmessspannen; im deaktivierten Zustand verursachen sie keinen Mehraufwand.

Alle durch Profiler-Flags gesteuerten Spannen für einen Gateway-Lauf aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Nur Profiler-Spannen für die Antwortweiterleitung aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Nur Profiler-Spannen für Start, Werkzeuge und Threads des Codex-App-Servers aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` aktiviert sowohl den Antwort-Profiler als auch den Codex-Profiler; verwenden Sie die
bereichsspezifischen Flag-Namen, um nur einen davon zu aktivieren.

Alternativ legen Sie dies in der Konfiguration fest:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Starten Sie das Gateway nach dem Ändern von Konfigurations-Flags neu. Um ein Profiler-Flag zu deaktivieren,
entfernen Sie es aus `diagnostics.flags` und starten Sie neu oder starten Sie den Prozess mit
`OPENCLAW_DIAGNOSTICS=0`, um für diesen Lauf jedes Diagnose-Flag zu überschreiben.

## Zeitleistenartefakte

Das Flag `timeline` (Alias: `diagnostics.timeline`) schreibt strukturierte Zeitmessereignisse für Start
und Laufzeit als JSONL für externe QA-Testsysteme:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Alternativ aktivieren Sie es in der Konfiguration:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Der Ausgabepfad stammt immer aus `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, auch
wenn das Flag selbst in der Konfiguration festgelegt ist; es gibt keinen Konfigurationsschlüssel für den Pfad.
Wenn `timeline` nur über die Konfiguration aktiviert wird, fehlen die frühesten Spannen beim Laden der Konfiguration,
da OpenClaw die Konfiguration zu diesem Zeitpunkt noch nicht gelesen hat; nachfolgende Startspannen
werden normal erfasst.

`OPENCLAW_DIAGNOSTICS=1`, `=all` und `=*` aktivieren ebenfalls die Zeitleiste, da sie
jedes Flag aktivieren. Verwenden Sie vorzugsweise das bereichsspezifische Flag `timeline`, wenn Sie nur das
JSONL-Artefakt und nicht jedes andere Diagnose-Flag benötigen.

Messwerte zur Ereignisschleifenverzögerung in der Zeitleiste benötigen zusätzlich zu
`timeline` eine weitere explizite Aktivierung: Legen Sie zusätzlich zur Aktivierung der Zeitleiste
`OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (oder `on`/`true`/`yes`) fest.

Zeitleistendatensätze verwenden den Umschlag `openclaw.diagnostics.v1` und können
Prozess-IDs, Phasennamen, Spannennamen, Dauern, Plugin-IDs, Anzahlen von Abhängigkeiten,
Messwerte zur Ereignisschleifenverzögerung, Namen von Provider-Operationen, den Beendigungszustand
von Kindprozessen sowie Namen und Meldungen von Startfehlern enthalten. Behandeln Sie Zeitleistendateien als lokale
Diagnoseartefakte und prüfen Sie sie, bevor Sie sie außerhalb Ihres Rechners weitergeben.

## Speicherort der Protokolle

Flags schreiben Protokolle in die standardmäßige Diagnoseprotokolldatei. Standardmäßig:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Benannte Profile verwenden `/tmp/openclaw/openclaw-<profile>-YYYY-MM-DD.log`; beispielsweise
verwendet `--dev` den Wert `openclaw-dev-YYYY-MM-DD.log`.

Wenn Sie `logging.file` festlegen, wird stattdessen dieser Pfad verwendet. Protokolle liegen im JSONL-Format vor (ein JSON-
Objekt pro Zeile). Die Schwärzung wird weiterhin gemäß `logging.redactSensitive` angewendet.
Unter [Protokollierung](/de/logging) finden Sie das vollständige Modell für Pfadauflösung, Rotation und
Schwärzung von Protokollen.

## Protokolle extrahieren

Neueste Protokolldatei des aktiven Profils lesen:

```bash
openclaw logs --plain
# Beispiel für ein benanntes Profil:
openclaw --profile work logs --plain
```

Nach Telegram-HTTP-Diagnosen filtern:

```bash
openclaw logs --plain --limit 5000 | rg "telegram http error"
```

Nach Brave-Search-HTTP-Diagnosen filtern:

```bash
openclaw logs --plain --limit 5000 | rg "brave http"
```

Oder während der Reproduktion fortlaufend verfolgen:

```bash
openclaw logs --follow --plain | rg "telegram http error"
```

Verwenden Sie für entfernte Gateways stattdessen `openclaw logs --follow` (siehe
[/cli/logs](/de/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` festgelegt ist, können durch Flags gesteuerte Protokolle
  unterdrückt werden. Der Standardwert `info` ist ausreichend.
- `brave.http` protokolliert Anfrage-URLs und Abfrageparameter von Brave Search, Antwortstatus
  und -zeitmessung sowie Treffer-, Fehlschlag- und Schreibereignisse des Caches. Es protokolliert weder den API-Schlüssel
  (der als Anfrage-Header gesendet wird) noch Antwortinhalte, Suchanfragen können jedoch
  vertraulich sein.
- Flags können gefahrlos aktiviert bleiben; sie beeinflussen nur das Protokollvolumen des
  jeweiligen Subsystems.
- Unter [/logging](/de/logging) erfahren Sie, wie Sie Protokollziele, -stufen und Schwärzung ändern.

## Verwandte Themen

- [Gateway-Diagnose](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
