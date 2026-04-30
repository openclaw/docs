---
read_when:
    - Sie möchten die schnellste lokale Entwicklungsschleife (bun + watch)
    - Sie stoßen auf Probleme mit der Bun-Installation, mit Patches oder mit Lebenszyklus-Skripten
summary: 'Bun-Workflow (experimentell): Installationen und Fallstricke im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-04-30T06:59:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird **nicht für die Gateway-Laufzeit empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für die Produktion.
</Warning>

Bun ist eine optionale lokale Laufzeit, um TypeScript direkt auszuführen (`bun run ...`, `bun --watch ...`). Der Standard-Paketmanager bleibt `pnpm`, der vollständig unterstützt und vom Dokumentationstooling verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert diese Datei.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, daher entsteht keine Unruhe im Repository. Um Lockfile-Schreibvorgänge vollständig zu überspringen:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build und Test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle-Skripte

Bun blockiert Lifecycle-Skripte von Abhängigkeiten, sofern ihnen nicht ausdrücklich vertraut wird. Für dieses Repository sind die häufig blockierten Skripte nicht erforderlich:

- `@whiskeysockets/baileys` `preinstall` -- prüft Node-Hauptversion >= 20 (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.14+`)
- `protobufjs` `postinstall` -- gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn Sie auf ein Laufzeitproblem stoßen, das diese Skripte erfordert, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Hinweise

Einige Skripte enthalten derzeit noch fest kodiert pnpm (zum Beispiel `docs:build`, `ui:*`, `protocol:check`). Führen Sie diese vorerst über pnpm aus.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisieren](/de/install/updating)
