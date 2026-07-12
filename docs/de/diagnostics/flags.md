---
read_when:
    - Sie benötigen gezielte Debug-Protokolle, ohne die globalen Protokollierungsstufen zu erhöhen
    - Sie müssen subsystem-spezifische Protokolle für den Support erfassen
summary: Diagnose-Flags für gezielte Debug-Protokolle
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-07-12T15:15:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnose-Flags aktivieren zusätzliche Protokollierung für ein einzelnes Subsystem, ohne
`logging.level` global anzuheben. Ein Flag hat keine Wirkung, sofern es nicht von einem Subsystem geprüft wird.

## Funktionsweise

- Flags sind Zeichenfolgen, bei denen Groß-/Kleinschreibung nicht berücksichtigt wird. Sie werden aus `diagnostics.flags` in
  der Konfiguration sowie der Umgebungsvariablen-Überschreibung `OPENCLAW_DIAGNOSTICS` ermittelt, dedupliziert und in Kleinbuchstaben umgewandelt.
- `name.*` entspricht `name` selbst und allem unterhalb von `name.` (beispielsweise
  entspricht `telegram.*` auch `telegram.http`).
- `*` oder `all` aktiviert alle Flags.
- Starten Sie den Gateway neu, nachdem Sie `diagnostics.flags` in der Konfiguration geändert haben; die Einstellung wird nicht
  im laufenden Betrieb neu geladen.

## Bekannte Flags

| Flag             | Aktiviert                                                   |
| ---------------- | ----------------------------------------------------------- |
| `telegram.http`  | HTTP-Fehlerprotokollierung der Telegram Bot API             |
| `brave.http`     | Protokollierung von Anfragen, Antworten und Cache für Brave Search |
| `profiler`       | Profiler für die Antwortphase und Codex-App-Server-Profiler (beide) |
| `reply.profiler` | Nur den Profiler für die Antwortphase                       |
| `codex.profiler` | Nur den Codex-App-Server-Profiler                            |
| `timeline`       | Strukturiertes JSONL-Zeitleistenartefakt (siehe unten)      |

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

## Umgebungsvariablen-Überschreibung (einmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Werte werden an Kommas oder Leerzeichen getrennt. Besondere Werte:

| Wert                        | Wirkung                                                  |
| --------------------------- | -------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Alle Flags deaktivieren und auch die Konfiguration überschreiben |
| `1`, `true`, `all`, `*`     | Alle Flags aktivieren                                    |

`OPENCLAW_DIAGNOSTICS=0` deaktiviert für diesen
Prozess sowohl Flags aus der Umgebung als auch aus der Konfiguration. Dies ist nützlich, um ein in der Konfiguration aktiviert gebliebenes Profiler-Flag vorübergehend stummzuschalten,
ohne die Datei zu bearbeiten.

## Profiler-Flags

Profiler-Flags steuern leichtgewichtige Zeitmessspannen; im deaktivierten Zustand verursachen sie keinen Mehraufwand.

Alle durch Profiler-Flags gesteuerten Spannen für einen einzelnen Gateway-Lauf aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Nur Profiler-Spannen für die Antwortweiterleitung aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Nur Profiler-Spannen für Start, Tools und Threads des Codex-App-Servers aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` aktiviert sowohl den Antwort-Profiler als auch den Codex-Profiler; verwenden Sie die
bereichsspezifischen Flag-Namen, um nur einen davon zu aktivieren.

Alternativ können Sie die Einstellung in der Konfiguration festlegen:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Starten Sie den Gateway nach dem Ändern der Konfigurations-Flags neu. Um ein Profiler-Flag zu deaktivieren,
entfernen Sie es aus `diagnostics.flags` und starten Sie neu, oder starten Sie den Prozess mit
`OPENCLAW_DIAGNOSTICS=0`, um alle Diagnose-Flags für diesen Lauf zu überschreiben.

## Zeitleistenartefakte

Das Flag `timeline` (Alias: `diagnostics.timeline`) schreibt strukturierte Zeitmessereignisse für Start
und Laufzeit als JSONL für externe QA-Testsysteme:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Alternativ können Sie es in der Konfiguration aktivieren:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Der Ausgabepfad stammt immer aus `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, auch
wenn das Flag selbst in der Konfiguration gesetzt ist; für den Pfad gibt es keinen Konfigurationsschlüssel.
Wenn `timeline` ausschließlich über die Konfiguration aktiviert wird, fehlen die frühesten Spannen beim Laden der Konfiguration,
da OpenClaw die Konfiguration zu diesem Zeitpunkt noch nicht eingelesen hat; nachfolgende Startspannen
werden normal erfasst.

`OPENCLAW_DIAGNOSTICS=1`, `=all` und `=*` aktivieren ebenfalls die Zeitleiste, da sie
alle Flags aktivieren. Verwenden Sie vorzugsweise das bereichsspezifische Flag `timeline`, wenn Sie nur das
JSONL-Artefakt und nicht alle anderen Diagnose-Flags benötigen.

Messwerte zur Verzögerung der Ereignisschleife in der Zeitleiste erfordern zusätzlich zu
`timeline` eine weitere ausdrückliche Aktivierung: Setzen Sie zusätzlich zur Aktivierung der Zeitleiste
`OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (oder `on`/`true`/`yes`).

Zeitleisteneinträge verwenden den Umschlag `openclaw.diagnostics.v1` und können
Prozess-IDs, Phasennamen, Spannennamen, Dauern, Plugin-IDs, Anzahlen von Abhängigkeiten,
Messwerte zur Verzögerung der Ereignisschleife, Namen von Provider-Vorgängen, den Beendigungsstatus
untergeordneter Prozesse sowie Namen und Meldungen von Startfehlern enthalten. Behandeln Sie Zeitleistendateien als lokale
Diagnoseartefakte und prüfen Sie sie, bevor Sie sie außerhalb Ihres Rechners weitergeben.

## Speicherort der Protokolle

Flags schreiben Protokolle in die standardmäßige Diagnoseprotokolldatei. Standardmäßig:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Wenn Sie `logging.file` festlegen, wird stattdessen dieser Pfad verwendet. Protokolle liegen als JSONL vor (ein JSON-
Objekt pro Zeile). Die Schwärzung wird weiterhin gemäß `logging.redactSensitive` angewendet.
Unter [Protokollierung](/de/logging) finden Sie das vollständige Modell zur Auflösung des Protokollpfads, zur Rotation und
zur Schwärzung.

## Protokolle extrahieren

Neueste Protokolldatei auswählen:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Nach Telegram-HTTP-Diagnosen filtern:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Nach HTTP-Diagnosen von Brave Search filtern:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Oder das Protokoll während der Reproduktion fortlaufend anzeigen:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Verwenden Sie für entfernte Gateways stattdessen `openclaw logs --follow` (siehe
[/cli/logs](/de/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` eingestellt ist, können durch Flags gesteuerte Protokolle
  unterdrückt werden. Der Standardwert `info` ist geeignet.
- `brave.http` protokolliert Anfrage-URLs und Abfrageparameter von Brave Search, den Antwortstatus
  und die Antwortzeit sowie Cache-Treffer-, Cache-Fehl- und Cache-Schreibereignisse. Es protokolliert weder den API-Schlüssel
  (der als Anfrage-Header gesendet wird) noch Antwortinhalte, Suchanfragen können jedoch
  vertraulich sein.
- Flags können bedenkenlos aktiviert bleiben; sie beeinflussen nur das Protokollvolumen des
  jeweiligen Subsystems.
- Verwenden Sie [/logging](/de/logging), um Protokollziele, Protokollstufen und Schwärzung zu ändern.

## Verwandte Themen

- [Gateway-Diagnose](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
