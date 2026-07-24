---
read_when:
    - Sie möchten kürzere `exec`- oder `bash`-Tool-Ergebnisse in OpenClaw
    - Sie möchten das Tokenjuice-Plugin installieren oder aktivieren
    - Sie müssen verstehen, was Tokenjuice verändert und was es unverarbeitet belässt.
summary: Unübersichtliche Ergebnisse der exec- und bash-Tools mit dem optionalen Tokenjuice-Plugin kompakt darstellen
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-24T04:14:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` ist ein optionales externes Plugin, das umfangreiche Ergebnisse von `exec` und `bash`
komprimiert, nachdem der Befehl bereits ausgeführt wurde.

Es verändert die zurückgegebenen `tool_result`, nicht den Befehl selbst. Tokenjuice
schreibt weder Shell-Eingaben um noch führt es Befehle erneut aus oder ändert Exit-Codes.

Derzeit gilt dies für eingebettete OpenClaw-Ausführungen und dynamische OpenClaw-Tools im Codex-
App-Server-Harness. Tokenjuice bindet sich in die Tool-Ergebnis-Middleware von OpenClaw ein und
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

Gleichwertig:

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

## Was Tokenjuice ändert

- Komprimiert umfangreiche Ergebnisse von `exec` und `bash`, bevor sie wieder in die Sitzung eingespeist werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Wendet eine Richtlinie für sichere Bestandsaufnahmen an: Exakte Lesevorgänge von Dateiinhalten bleiben unverändert, eigenständige Befehle zur Repository-Bestandsaufnahme können komprimiert werden und unsichere gemischte Befehlsfolgen bleiben unverändert.
- Bleibt optional: Deaktivieren Sie das Plugin, wenn Sie überall eine wortgetreue Ausgabe wünschen.

## Funktion überprüfen

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen ausgabereichen Befehl wie `git status` aus.
4. Prüfen Sie, ob das zurückgegebene Tool-Ergebnis kürzer und strukturierter als die rohe Shell-Ausgabe ist.

## Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oder:

```bash
openclaw plugins disable tokenjuice
```

## Verwandte Themen

- [Exec-Tool](/de/tools/exec)
- [Denkstufen](/de/tools/thinking)
- [Kontext-Engine](/de/concepts/context-engine)
