---
read_when:
    - Untersuchung eines Absturzes des tsx/esbuild-Loaders, bei dem ein fehlender __name-Helper erwähnt wird
summary: Historischer Absturz bei Node + tsx mit „__name is not a function“ und seine Ursache
title: Node- und tsx-Absturz
x-i18n:
    generated_at: "2026-07-24T03:50:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Absturz bei Node + tsx: „\_\_name is not a function“

## Status

Behoben. Dieser Absturz lässt sich weder mit der aktuellen, in
`package.json` fixierten `tsx`-Version (`4.22.3`) noch mit aktuellen Node-Versionen reproduzieren. Diese Seite bleibt für den Fall erhalten, dass ein zukünftiges
Upgrade von `tsx`/esbuild den Fehler erneut verursacht.

## Ursprüngliches Symptom

Beim Ausführen der OpenClaw-Entwicklungsskripte über `tsx` schlug der Start mit folgender Meldung fehl:

```text
[openclaw] CLI konnte nicht gestartet werden: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Die Zeilennummern wurden weggelassen; beide Dateien wurden seit dem ursprünglichen Absturz geändert,
sodass die konkreten Zeilen nicht mehr übereinstimmen.

Der Fehler trat auf, nachdem die Entwicklungsskripte von Bun auf `tsx` umgestellt worden waren (`2871657e`,
2026-01-06), um Bun optional zu machen. Der entsprechende Bun-basierte Ausführungspfad stürzte nicht ab.
Der Fehler wurde ursprünglich mit Node v25.3.0 unter macOS beobachtet; es wurde davon ausgegangen, dass auch andere Plattformen betroffen sein könnten, auf denen
Node 25 ausgeführt wird.

## Ursache

`tsx` transformiert TS/ESM mithilfe von esbuild, wobei `keepNames: true` in
den Transformationsoptionen fest codiert ist. Diese Einstellung veranlasst esbuild dazu, benannte Funktions- und Klassendeklarationen
in einen Aufruf eines `__name`-Hilfsprogramms einzuschließen, damit `fn.name` die Minifizierung
und Bündelung übersteht. Der Absturz bedeutet, dass das Hilfsprogramm an der Aufrufstelle
dieses Moduls in der betroffenen Kombination aus `tsx` und Node fehlte oder überschattet wurde, sodass `__name(...)`
eine Ausnahme auslöste, statt den eingeschlossenen Wert zurückzugeben.

## Aktuelle Reproduktionsprüfung

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Minimales isoliertes Reproduktionsbeispiel (lädt nur das Modul aus dem ursprünglichen Stacktrace):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Beide Befehle werden derzeit fehlerfrei beendet. Falls einer davon erneut `__name is not a
function` auslöst, erfassen Sie die genaue Node-Version, die Version von `tsx`
(`node_modules/tsx/package.json`) und den vollständigen Stacktrace, bevor Sie den Fehler an das Upstream-Projekt melden.

## Problemumgehungen (falls der Absturz erneut auftritt)

- Führen Sie Entwicklungsskripte mit Bun statt mit `node --import tsx` aus.
- Führen Sie `pnpm tsgo` zur Typprüfung aus und führen Sie anschließend statt des Quellcodes über `tsx` die erstellte Ausgabe aus:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Probieren Sie eine andere Version von `tsx` aus (`pnpm add -D tsx@<version>` ist eine Änderung an einer Abhängigkeit
  und erfordert gemäß den Repository-Richtlinien eine Genehmigung), um durch Bisektion festzustellen, ob die darin enthaltene esbuild-Version
  den Fehler erneut verursacht hat.
- Testen Sie mit einer anderen Haupt-/Nebenversion von Node, um festzustellen, ob der Fehler
  versionsspezifisch ist.

## Referenzen

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Verwandte Themen

- [Node.js-Installation](/de/install/node)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
