---
read_when:
    - Sie möchten den schnellsten lokalen Entwicklungszyklus (bun + watch)
    - Sie stoßen auf Probleme mit Bun-Installation, Patches oder Lifecycle-Skripten
summary: 'Bun-Workflow (experimentell): Installationen und Stolperfallen im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-05-07T13:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird **nicht für die Gateway-Laufzeit empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für die Produktion.
</Warning>

Bun ist eine optionale lokale Laufzeit, um TypeScript direkt auszuführen (`bun run ...`, `bun --watch ...`). Der Standard-Paketmanager bleibt `pnpm`, der vollständig unterstützt und von der Docs-Toolchain verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert sie.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sind in `.gitignore` eingetragen, daher entsteht kein Repo-Churn. Um das Schreiben von Lockfiles vollständig zu überspringen:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build und Tests ausführen">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle-Skripte

Bun blockiert Lifecycle-Skripte von Abhängigkeiten, sofern sie nicht ausdrücklich als vertrauenswürdig eingestuft wurden. Für dieses Repo sind die üblicherweise blockierten Skripte nicht erforderlich:

- `@whiskeysockets/baileys` `preinstall` -- prüft Node-Hauptversion >= 20 (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.16+`)
- `protobufjs` `postinstall` -- gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Laufzeitproblem auftritt, das diese Skripte erfordert, stufen Sie sie ausdrücklich als vertrauenswürdig ein:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Einschränkungen

Einige Skripte codieren weiterhin pnpm fest (zum Beispiel `docs:build`, `ui:*`, `protocol:check`). Führen Sie diese vorerst über pnpm aus.

## Verwandt

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisieren](/de/install/updating)
