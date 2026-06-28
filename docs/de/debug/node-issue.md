---
read_when:
    - Debugging von reinen Node-Dev-Skripten oder Fehlern im Watch-Modus
    - Untersuchung von tsx/esbuild-Loader-Abstürzen in OpenClaw
summary: 'Node + tsx: Hinweise zum Absturz "__name is not a function" und Problemumgehungen'
title: Node + tsx-Absturz
x-i18n:
    generated_at: "2026-05-06T17:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx „\_\_name is not a function“-Absturz

## Zusammenfassung

Das Ausführen von OpenClaw über Node mit `tsx` schlägt beim Start fehl mit:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Dies begann nach der Umstellung der Entwicklungsskripte von Bun auf `tsx` (Commit `2871657e`, 2026-01-06). Derselbe Runtime-Pfad funktionierte mit Bun.

## Umgebung

- Node: v25.x (beobachtet auf v25.3.0)
- tsx: 4.21.0
- OS: macOS (Reproduktion wahrscheinlich auch auf anderen Plattformen, die Node 25 ausführen)

## Reproduktion (nur Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimale Reproduktion im Repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node-Versionsprüfung

- Node 25.3.0: schlägt fehl
- Node 22.22.0 (Homebrew `node@22`): schlägt fehl
- Node 24: hier noch nicht installiert; muss verifiziert werden

## Hinweise / Hypothese

- `tsx` verwendet esbuild, um TS/ESM zu transformieren. esbuilds `keepNames` gibt einen `__name`-Helper aus und umschließt Funktionsdefinitionen mit `__name(...)`.
- Der Absturz zeigt, dass `__name` zur Laufzeit existiert, aber keine Funktion ist, was darauf hindeutet, dass der Helper für dieses Modul im Node-25-Loader-Pfad fehlt oder überschrieben wurde.
- Ähnliche Probleme mit dem `__name`-Helper wurden in anderen esbuild-Consumern gemeldet, wenn der Helper fehlt oder umgeschrieben wird.

## Regressionshistorie

- `2871657e` (2026-01-06): Skripte wurden von Bun auf tsx umgestellt, um Bun optional zu machen.
- Davor (Bun-Pfad) funktionierten `openclaw status` und `gateway:watch`.

## Workarounds

- Verwenden Sie Bun für Entwicklungsskripte (aktueller temporärer Revert).
- Verwenden Sie `tsgo` für die Typprüfung des Repos und führen Sie dann die gebaute Ausgabe aus:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Historischer Hinweis: `tsc` wurde hier während des Debuggings dieses Node/tsx-Problems verwendet, aber die Typprüfungs-Lanes des Repos verwenden jetzt `tsgo`.
- Deaktivieren Sie esbuild keepNames im TS-Loader, falls möglich (verhindert das Einfügen des `__name`-Helpers); tsx stellt dies derzeit nicht bereit.
- Testen Sie Node LTS (22/24) mit `tsx`, um zu sehen, ob das Problem Node-25-spezifisch ist.

## Referenzen

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Nächste Schritte

- Auf Node 22/24 reproduzieren, um die Node-25-Regression zu bestätigen.
- `tsx` Nightly testen oder auf eine frühere Version pinnen, falls eine bekannte Regression existiert.
- Wenn es auf Node LTS reproduzierbar ist, eine minimale Reproduktion upstream mit dem `__name`-Stacktrace einreichen.

## Verwandt

- [Node.js-Installation](/de/install/node)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
