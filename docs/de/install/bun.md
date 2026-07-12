---
read_when:
    - Sie möchten die schnellste lokale Entwicklungsschleife (bun + watch)
    - Bei Ihnen treten Probleme mit Bun-Installations-, Patch- oder Lebenszyklusskripten auf
summary: 'Bun-Workflow (experimentell): Installation und Fallstricke im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-07-12T01:45:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird für den Gateway-Betrieb nicht empfohlen (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für den Produktivbetrieb.
</Warning>

Bun ist eine optionale lokale Laufzeitumgebung zum direkten Ausführen von TypeScript (`bun run ...`, `bun --watch ...`). Der standardmäßige Paketmanager bleibt `pnpm`, der vollständig unterstützt und von den Dokumentationswerkzeugen verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert die Datei.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, sodass keine unnötigen Änderungen im Repository entstehen. Um das Schreiben von Lockdateien vollständig zu überspringen:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Erstellen und testen">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lebenszyklusskripte

Bun blockiert Lebenszyklusskripte von Abhängigkeiten, sofern ihnen nicht ausdrücklich vertraut wird. Für dieses Repository sind die üblicherweise blockierten Skripte nicht erforderlich:

- `baileys` `preinstall`: prüft, ob die Node-Hauptversion mindestens 20 ist (OpenClaw erfordert Node 22.19+ oder 23.11+; Node 24 wird empfohlen)
- `protobufjs` `postinstall`: gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Laufzeitproblem auftritt, das diese Skripte erfordert, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust baileys protobufjs
```

## Einschränkungen

Einige Paketskripte verwenden intern fest codiert `pnpm` (beispielsweise `check:docs`, `ui:*`, `protocol:check`). Wenn Sie diese über `bun run` ausführen, wird weiterhin `pnpm` über die Shell aufgerufen. Führen Sie diese daher direkt mit `pnpm` aus.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisierung](/de/install/updating)
