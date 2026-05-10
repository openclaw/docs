---
read_when:
    - Sie möchten den schnellsten lokalen Entwicklungszyklus (bun + watch)
    - Sie stoßen auf Probleme mit Bun-Installations-, Patch- oder Lifecycle-Skripten
summary: 'Bun-Workflow (experimentell): Installationen und Fallstricke im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-05-10T19:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird **nicht für die Gateway-Runtime empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für die Produktion.
</Warning>

Bun ist eine optionale lokale Runtime, um TypeScript direkt auszuführen (`bun run ...`, `bun --watch ...`). Der Standard-Paketmanager bleibt `pnpm`, der vollständig unterstützt und vom Dokumentations-Tooling verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert es.

## Installation

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, sodass keine Repo-Änderungen entstehen. Um das Schreiben von Lockfiles vollständig zu überspringen:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle-Skripte

Bun blockiert Lifecycle-Skripte von Abhängigkeiten, sofern ihnen nicht ausdrücklich vertraut wird. Für dieses Repo sind die üblicherweise blockierten Skripte nicht erforderlich:

- `baileys` `preinstall` -- prüft Node-Major >= 20 (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.16+`)
- `protobufjs` `postinstall` -- gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Runtime-Problem auftritt, das diese Skripte erfordert, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust baileys protobufjs
```

## Einschränkungen

Einige Skripte codieren pnpm weiterhin fest (zum Beispiel `docs:build`, `ui:*`, `protocol:check`). Führen Sie diese vorerst über pnpm aus.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisieren](/de/install/updating)
