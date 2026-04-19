---
read_when:
    - Fehlersuche bei rein Node-basierten Entwicklungsskripten oder Fehlern im Watch-Modus
    - Untersuchung von tsx/esbuild-Loader-Abstürzen in OpenClaw
summary: Node + tsx-Absturzhinweise und Workarounds für "__name is not a function"
title: Node + tsx-Absturz
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx-Absturz bei „\_\_name is not a function“

## Zusammenfassung

Das Ausführen von OpenClaw über Node mit `tsx` schlägt beim Start mit folgendem Fehler fehl:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Dies begann nach der Umstellung der Entwicklungsskripte von Bun auf `tsx` (Commit `2871657e`, 2026-01-06). Derselbe Laufzeitpfad funktionierte mit Bun.

## Umgebung

- Node: v25.x (beobachtet unter v25.3.0)
- tsx: 4.21.0
- Betriebssystem: macOS (Reproduktion wahrscheinlich auch auf anderen Plattformen, auf denen Node 25 läuft)

## Reproduktion (nur Node)

```bash
# im Repo-Root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimale Reproduktion im Repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Prüfung der Node-Version

- Node 25.3.0: schlägt fehl
- Node 22.22.0 (Homebrew `node@22`): schlägt fehl
- Node 24: hier noch nicht installiert; muss noch verifiziert werden

## Hinweise / Hypothese

- `tsx` verwendet esbuild, um TS/ESM zu transformieren. Die esbuild-Option `keepNames` erzeugt einen `__name`-Helper und umschließt Funktionsdefinitionen mit `__name(...)`.
- Der Absturz zeigt, dass `__name` existiert, aber zur Laufzeit keine Funktion ist. Das deutet darauf hin, dass der Helper für dieses Modul im Node-25-Loader-Pfad fehlt oder überschrieben wird.
- Ähnliche Probleme mit dem `__name`-Helper wurden auch bei anderen esbuild-Verbrauchern gemeldet, wenn der Helper fehlt oder umgeschrieben wird.

## Verlauf der Regression

- `2871657e` (2026-01-06): Skripte wurden von Bun auf tsx umgestellt, um Bun optional zu machen.
- Davor (Bun-Pfad) funktionierten `openclaw status` und `gateway:watch`.

## Workarounds

- Bun für Entwicklungsskripte verwenden (aktuelle temporäre Rücknahme).
- `tsgo` für die Type-Prüfung im Repo verwenden und dann die gebaute Ausgabe ausführen:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Historischer Hinweis: `tsc` wurde hier während der Fehlersuche zu diesem Node/tsx-Problem verwendet, aber die Type-Check-Lanes im Repo nutzen jetzt `tsgo`.
- `keepNames` von esbuild im TS-Loader nach Möglichkeit deaktivieren (verhindert das Einfügen des `__name`-Helpers); `tsx` bietet dies derzeit nicht an.
- Node LTS (22/24) mit `tsx` testen, um zu sehen, ob das Problem spezifisch für Node 25 ist.

## Referenzen

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Nächste Schritte

- Unter Node 22/24 reproduzieren, um eine Regression in Node 25 zu bestätigen.
- `tsx` nightly testen oder auf eine frühere Version pinnen, falls eine bekannte Regression existiert.
- Falls es sich auch unter Node LTS reproduzieren lässt, upstream eine minimale Reproduktion mit dem `__name`-Stacktrace melden.
