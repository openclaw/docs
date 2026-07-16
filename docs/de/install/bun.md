---
read_when:
    - Sie möchten Abhängigkeiten installieren oder Paketskripte mit Bun ausführen
    - Es treten Probleme mit Bun-Installations-, Patch- oder Lebenszyklusskripten auf
summary: Bun-Workflow für Installationen und Paketskripte; Node ist zur Laufzeit erforderlich
title: Bun
x-i18n:
    generated_at: "2026-07-16T12:58:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun kann die OpenClaw-CLI oder das Gateway nicht ausführen, da es die erforderliche `node:sqlite`-API nicht bereitstellt. Installieren Sie für alle OpenClaw-Laufzeitbefehle eine unterstützte Node-Version.
</Warning>

Bun kann weiterhin optional als Installationsprogramm für Abhängigkeiten und zum Ausführen von Paketskripten verwendet werden. Der standardmäßige Paketmanager bleibt `pnpm`, der vollständig unterstützt und von den Dokumentationswerkzeugen verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert es.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden von Git ignoriert, sodass keine Änderungen im Repository entstehen. So überspringen Sie Schreibvorgänge an der Lockdatei vollständig:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Erstellen und testen">
    ```sh
    bun run build
    bun run vitest run
    ```

    Befehle, die OpenClaw selbst starten, müssen weiterhin über Node ausgeführt werden.

  </Step>
</Steps>

## Lebenszyklusskripte

Bun blockiert Lebenszyklusskripte von Abhängigkeiten, sofern diesen nicht ausdrücklich vertraut wird. Für dieses Repository sind die häufig blockierten Skripte nicht erforderlich:

- `baileys` `preinstall`: prüft, ob die Node-Hauptversion >= 20 ist (OpenClaw erfordert Node 22.22.3+, 24.15+ oder 25.9+; Node 24 wird empfohlen)
- `protobufjs` `postinstall`: gibt Warnungen zu inkompatiblen Versionsschemata aus (keine Build-Artefakte)

Wenn ein Laufzeitproblem auftritt, für dessen Behebung diese Skripte erforderlich sind, vertrauen Sie ihnen ausdrücklich:

```sh
bun pm trust baileys protobufjs
```

## Einschränkungen

Einige Paketskripte verwenden intern fest codiert `pnpm` (zum Beispiel `check:docs`, `ui:*`, `protocol:check`). Wenn sie über `bun run` ausgeführt werden, rufen sie dennoch `pnpm` über die Shell auf. Führen Sie diese daher einfach direkt über `pnpm` aus.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js](/de/install/node)
- [Aktualisierung](/de/install/updating)
