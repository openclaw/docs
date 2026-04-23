---
read_when:
    - Sie möchten kürzere Tool-Ergebnisse von `exec` oder `bash` in OpenClaw
    - Sie möchten das gebündelte Tokenjuice-Plugin aktivieren
    - Sie müssen verstehen, was Tokenjuice verändert und was es roh belässt
summary: Rauschige Ergebnisse von Exec- und Bash-Tools mit einem optionalen gebündelten Plugin kompakt zusammenfassen
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T06:36:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` ist ein optionales gebündeltes Plugin, das rauschige Tool-Ergebnisse von `exec` und `bash` kompakt zusammenfasst, nachdem der Befehl bereits ausgeführt wurde.

Es verändert das zurückgegebene `tool_result`, nicht den Befehl selbst. Tokenjuice
schreibt keine Shell-Eingaben um, führt keine Befehle erneut aus und ändert keine Exit-Codes.

Aktuell gilt dies für eingebettete Pi-Läufe, bei denen Tokenjuice in den eingebetteten
Pfad von `tool_result` eingreift und die Ausgabe kürzt, die in die Sitzung zurückgeht.

## Das Plugin aktivieren

Schnellster Weg:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Entspricht:

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

- Fasst rauschige Ergebnisse von `exec` und `bash` kompakt zusammen, bevor sie zurück in die Sitzung gespeist werden.
- Lässt die ursprüngliche Befehlsausführung unverändert.
- Bewahrt exakte Lesevorgänge von Dateiinhalten und andere Befehle, die Tokenjuice roh belassen soll.
- Bleibt opt-in: Deaktivieren Sie das Plugin, wenn Sie überall wortgetreue Ausgaben möchten.

## Überprüfen, ob es funktioniert

1. Aktivieren Sie das Plugin.
2. Starten Sie eine Sitzung, die `exec` aufrufen kann.
3. Führen Sie einen rauschigen Befehl wie `git status` aus.
4. Prüfen Sie, ob das zurückgegebene Tool-Ergebnis kürzer und stärker strukturiert ist als die rohe Shell-Ausgabe.

## Das Plugin deaktivieren

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oder:

```bash
openclaw plugins disable tokenjuice
```
