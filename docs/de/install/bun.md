---
read_when:
    - Sie möchten den schnellsten lokalen Entwicklungszyklus (bun + watch)
    - Sie stoßen auf Probleme mit Bun-Installation, Patches oder Lifecycle-Skripten
summary: 'Bun-Workflow (experimentell): Installation und Fallstricke im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-06-27T17:37:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird **nicht für die Gateway-Laufzeit empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für die Produktion.
</Warning>

Bun ist eine optionale lokale Laufzeit, um TypeScript direkt auszuführen (`bun run ...`, `bun --watch ...`). Der standardmäßige Paketmanager bleibt `pnpm`, das vollständig unterstützt und von den Dokumentationstools verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert diese Datei.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, daher entsteht keine Repo-Änderung. Um Lockfile-Schreibvorgänge vollständig zu überspringen:

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

## Lifecycle-Skripte

Bun blockiert Dependency-Lifecycle-Skripte, sofern ihnen nicht ausdrücklich vertraut wird. Für dieses Repo sind die häufig blockierten Skripte nicht erforderlich:

- `baileys` `preinstall` -- prüft Node-Hauptversion >= 20 (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.19+`)
- `protobufjs` `postinstall` -- gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Laufzeitproblem auftritt, das diese Skripte erfordert, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust baileys protobufjs
```

## Einschränkungen

Einige Skripte enthalten weiterhin fest codiert pnpm (zum Beispiel `check:docs`, `ui:*`, `protocol:check`). Führen Sie diese vorerst über pnpm aus.

## Verwandt

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisierung](/de/install/updating)
