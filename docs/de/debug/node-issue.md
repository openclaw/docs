---
read_when:
    - Untersuchung eines Absturzes des tsx/esbuild-Loaders, bei dem ein fehlender __name-Helper erwähnt wird
summary: Historischer Absturz mit Node + tsx („__name is not a function“) und seine Ursache
title: Node- und tsx-Absturz
x-i18n:
    generated_at: "2026-07-12T15:21:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Absturz bei Node + tsx: „\_\_name is not a function“

## Status

Behoben. Dieser Absturz lässt sich mit der aktuellen, in
`package.json` festgelegten `tsx`-Version (`4.22.3`) und aktuellen Node-Versionen nicht reproduzieren. Diese Seite bleibt für den Fall erhalten, dass ein
zukünftiges Upgrade von `tsx`/esbuild das Problem erneut verursacht.

## Ursprüngliches Symptom

Beim Ausführen der OpenClaw-Entwicklungsskripte über `tsx` trat beim Start folgender Fehler auf:

```text
[openclaw] CLI konnte nicht gestartet werden: TypeError: __name is not a function
    bei createSubsystemLogger (src/logging/subsystem.ts)
    bei <caller> (src/agents/auth-profiles/constants.ts)
```

Die Zeilennummern wurden weggelassen; beide Dateien wurden seit dem ursprünglichen Absturz
geändert, und die betreffenden Zeilen stimmen nicht mehr überein.

Das Problem trat auf, nachdem die Entwicklungsskripte von Bun auf `tsx` umgestellt worden waren (`2871657e`,
2026-01-06), um Bun optional zu machen. Beim entsprechenden Bun-basierten Pfad trat kein Absturz auf.
Ursprünglich wurde das Problem unter Node v25.3.0 auf macOS beobachtet; es wurde davon ausgegangen, dass auch andere Plattformen betroffen sein könnten, auf denen
Node 25 ausgeführt wird.

## Ursache

`tsx` transformiert TS/ESM über esbuild, wobei `keepNames: true` in
den Transformationsoptionen fest codiert ist. Diese Einstellung bewirkt, dass esbuild benannte Funktions- und Klassen-
deklarationen in einen Aufruf eines `__name`-Hilfsprogramms einschließt, damit `fn.name` bei Minifizierung
und Bündelung erhalten bleibt. Der Absturz bedeutet, dass das Hilfsprogramm an der Aufrufstelle
dieses Moduls in der betroffenen Kombination aus `tsx` und Node fehlte oder überschattet wurde, sodass `__name(...)`
eine Ausnahme auslöste, anstatt den eingeschlossenen Wert zurückzugeben.

## Aktuelle Reproduktionsprüfung

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Minimale isolierte Reproduktion (lädt nur das Modul aus dem ursprünglichen Stacktrace):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Beide Befehle werden derzeit fehlerfrei beendet. Falls einer der beiden erneut `__name is not a
function` auslöst, erfassen Sie die genaue Node-Version, die `tsx`-Version
(`node_modules/tsx/package.json`) und den vollständigen Stacktrace, bevor Sie das Problem upstream melden.

## Problemumgehungen (falls der Absturz erneut auftritt)

- Führen Sie Entwicklungsskripte mit Bun statt mit `node --import tsx` aus.
- Führen Sie `pnpm tsgo` zur Typprüfung aus und verwenden Sie anschließend die gebaute Ausgabe, anstatt den
  Quellcode über `tsx` auszuführen:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Probieren Sie eine andere `tsx`-Version aus (`pnpm add -D tsx@<version>` ist eine Änderung der Abhängigkeiten
  und erfordert gemäß den Repository-Richtlinien eine Genehmigung), um durch Eingrenzung festzustellen, ob die enthaltene esbuild-
  Version den Fehler erneut verursacht hat.
- Testen Sie eine andere Haupt-/Nebenversion von Node, um festzustellen, ob der Fehler versions-
  spezifisch ist.

## Referenzen

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Verwandte Themen

- [Node.js-Installation](/de/install/node)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
