---
read_when:
    - Sie möchten den schnellsten lokalen Entwicklungszyklus (bun + watch)
    - Bei der Installation, beim Patchen oder bei Lifecycle-Skripten mit Bun treten Probleme auf
summary: 'Bun-Workflow (experimentell): Installation und Fallstricke im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-07-12T15:32:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wird für die Gateway-Laufzeit nicht empfohlen (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für den Produktivbetrieb.
</Warning>

Bun ist eine optionale lokale Laufzeitumgebung, mit der TypeScript direkt ausgeführt werden kann (`bun run ...`, `bun --watch ...`). Der standardmäßige Paketmanager bleibt `pnpm`, der vollständig unterstützt und von den Dokumentationswerkzeugen verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert die Datei.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, sodass keine Änderungen im Repository entstehen. Um das Schreiben von Lockfiles vollständig zu überspringen:

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

Bun blockiert Lebenszyklusskripte von Abhängigkeiten, sofern diesen nicht ausdrücklich vertraut wird. Für dieses Repository sind die häufig blockierten Skripte nicht erforderlich:

- `baileys` `preinstall`: prüft, ob die Node-Hauptversion >= 20 ist (OpenClaw erfordert Node 22.19+ oder 23.11+; Node 24 wird empfohlen)
- `protobufjs` `postinstall`: gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Laufzeitproblem auftritt, für dessen Behebung diese Skripte erforderlich sind, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust baileys protobufjs
```

## Einschränkungen

Einige Paketskripte verwenden intern fest `pnpm` (zum Beispiel `check:docs`, `ui:*`, `protocol:check`). Wenn Sie diese über `bun run` ausführen, wird dennoch `pnpm` in einer Shell aufgerufen. Führen Sie diese daher einfach direkt über `pnpm` aus.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisierung](/de/install/updating)
