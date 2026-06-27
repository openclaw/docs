---
read_when:
    - Sie möchten kürzere `exec`- oder `bash`-Tool-Ergebnisse in OpenClaw
    - Sie möchten das Tokenjuice-Plugin installieren oder aktivieren
    - Sie müssen verstehen, was tokenjuice verändert und was roh belässt
summary: Kompaktieren Sie rauschanfällige Ergebnisse von exec- und bash-Tools mit dem optionalen Tokenjuice-Plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:22:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` ist ein optionales externes Plugin, das umfangreiche `exec`- und `bash`-Tool-Ergebnisse komprimiert, nachdem der Befehl bereits ausgeführt wurde.

Es ändert das zurückgegebene `tool_result`, nicht den Befehl selbst. Tokenjuice schreibt keine Shell-Eingaben um, führt Befehle nicht erneut aus und ändert keine Exit-Codes.

Derzeit gilt dies für eingebettete OpenClaw-Ausführungen und dynamische OpenClaw-Tools im Codex-App-Server-Harness. Tokenjuice klinkt sich in OpenClaws Tool-Ergebnis-Middleware ein und kürzt die Ausgabe, bevor sie zurück in die aktive Harness-Sitzung gelangt.

## Das Plugin aktivieren

Einmal installieren:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Dann aktivieren:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Entsprechend:

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

- Komprimiert umfangreiche `exec`- und `bash`-Ergebnisse, bevor sie zurück in die Sitzung eingespeist werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Bewahrt exakte Dateiinhalts-Lesevorgänge und andere Befehle, die tokenjuice roh belassen soll.
- Bleibt Opt-in: Deaktivieren Sie das Plugin, wenn Sie überall wortgetreue Ausgabe möchten.

## Prüfen, ob es funktioniert

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen umfangreichen Befehl wie `git status` aus.
4. Prüfen Sie, ob das zurückgegebene Tool-Ergebnis kürzer und stärker strukturiert ist als die rohe Shell-Ausgabe.

## Das Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oder:

```bash
openclaw plugins disable tokenjuice
```

## Verwandt

- [Exec-Tool](/de/tools/exec)
- [Thinking-Stufen](/de/tools/thinking)
- [Kontext-Engine](/de/concepts/context-engine)
