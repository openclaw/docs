---
read_when:
    - Sie möchten kürzere Ergebnisse des Tools `exec` oder `bash` in OpenClaw
    - Sie möchten das Tokenjuice-Plugin installieren oder aktivieren
    - Sie müssen verstehen, was Tokenjuice verändert und was es unverändert lässt.
summary: Komprimieren Sie umfangreiche Ausgaben der Tools `exec` und `bash` mit dem optionalen Tokenjuice-Plugin.
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T16:00:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` ist ein optionales externes Plugin, das umfangreiche und unübersichtliche Ergebnisse der Tools `exec` und `bash`
komprimiert, nachdem der Befehl bereits ausgeführt wurde.

Es verändert das zurückgegebene `tool_result`, nicht den Befehl selbst. Tokenjuice
schreibt Shell-Eingaben nicht um, führt Befehle nicht erneut aus und ändert keine Exit-Codes.

Derzeit gilt dies für eingebettete OpenClaw-Ausführungen und dynamische OpenClaw-Tools im Codex-
App-Server-Harness. Tokenjuice bindet sich in die Middleware für Tool-Ergebnisse von OpenClaw ein und
kürzt die Ausgabe, bevor sie an die aktive Harness-Sitzung zurückgegeben wird.

## Plugin aktivieren

Einmalig installieren:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Anschließend aktivieren:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Entsprechender Befehl:

```bash
openclaw plugins enable tokenjuice
```

Wenn Sie die Konfiguration lieber direkt bearbeiten:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Was tokenjuice ändert

- Komprimiert umfangreiche und unübersichtliche Ergebnisse von `exec` und `bash`, bevor sie wieder in die Sitzung eingespeist werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Wendet eine Richtlinie für sichere Bestandsaufnahmen an: Exakte Lesevorgänge von Dateiinhalten bleiben unverändert, eigenständige Befehle zur Bestandsaufnahme eines Repositorys können komprimiert werden und unsichere gemischte Befehlsfolgen bleiben unverändert.
- Bleibt optional: Deaktivieren Sie das Plugin, wenn Sie überall die wortgetreue Ausgabe wünschen.

## Funktionsfähigkeit überprüfen

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen umfangreiche Ausgaben erzeugenden Befehl wie `git status` aus.
4. Prüfen Sie, ob das zurückgegebene Tool-Ergebnis kürzer und strukturierter als die unverarbeitete Shell-Ausgabe ist.

## Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Alternativ:

```bash
openclaw plugins disable tokenjuice
```

## Verwandte Themen

- [Exec-Tool](/de/tools/exec)
- [Denkstufen](/de/tools/thinking)
- [Kontext-Engine](/de/concepts/context-engine)
