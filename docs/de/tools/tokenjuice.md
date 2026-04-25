---
read_when:
    - Sie möchten kürzere Tool-Ergebnisse für `exec` oder `bash` in OpenClaw
    - Sie möchten das gebündelte Tokenjuice Plugin aktivieren
    - Sie müssen verstehen, was Tokenjuice verändert und was es unbearbeitet lässt
summary: Kompaktes Zusammenfassen verrauschter `exec`- und Bash-Tool-Ergebnisse mit einem optionalen gebündelten Plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T13:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` ist ein optionales gebündeltes Plugin, das verrauschte `exec`- und `bash`-
Tool-Ergebnisse komprimiert, nachdem der Befehl bereits ausgeführt wurde.

Es verändert das zurückgegebene `tool_result`, nicht den Befehl selbst. Tokenjuice
schreibt keine Shell-Eingaben um, führt keine Befehle erneut aus und ändert keine Exit-Codes.

Derzeit gilt dies für eingebettete PI-Ausführungen und dynamische OpenClaw-Tools im Codex-
App-Server-Harness. Tokenjuice klinkt sich in OpenClaws Tool-Result-Middleware ein und
kürzt die Ausgabe, bevor sie in die aktive Harness-Sitzung zurückgegeben wird.

## Plugin aktivieren

Schnellster Weg:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Äquivalent:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw liefert das Plugin bereits mit. Es gibt keinen separaten Schritt
`plugins install` oder `tokenjuice install openclaw`.

Wenn Sie die Konfiguration lieber direkt bearbeiten möchten:

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

## Was Tokenjuice verändert

- Komprimiert verrauschte `exec`- und `bash`-Ergebnisse, bevor sie in die Sitzung zurückgeführt werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Bewahrt exakte Dateiinhalts-Lesevorgänge und andere Befehle, die Tokenjuice unbearbeitet lassen soll.
- Bleibt optional: Deaktivieren Sie das Plugin, wenn Sie überall wortgetreue Ausgabe möchten.

## Verifizieren, dass es funktioniert

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen verrauschten Befehl wie `git status` aus.
4. Prüfen Sie, dass das zurückgegebene Tool-Ergebnis kürzer und strukturierter ist als die rohe Shell-Ausgabe.

## Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oder:

```bash
openclaw plugins disable tokenjuice
```

## Verwandt

- [Exec tool](/de/tools/exec)
- [Thinking levels](/de/tools/thinking)
- [Context engine](/de/concepts/context-engine)
