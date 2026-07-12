---
read_when:
    - Sie möchten wissen, was npm Shrinkwrap in einem OpenClaw-Release bedeutet
    - Sie prüfen Paket-Lockfiles, Abhängigkeitsänderungen oder Risiken in der Lieferkette
    - Sie validieren npm-Pakete des Stammprojekts oder von Plugins vor der Veröffentlichung
summary: Allgemeinverständliche und technische Erläuterung des npm-Shrinkwraps in OpenClaw-Releases
title: npm-Shrinkwrap
x-i18n:
    generated_at: "2026-07-12T01:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw-Quellcode-Checkouts verwenden `pnpm-lock.yaml`. Veröffentlichte OpenClaw-npm-Pakete verwenden `npm-shrinkwrap.json`, die veröffentlichbare Abhängigkeits-Lockdatei von npm, sodass Paketinstallationen den während der Veröffentlichung geprüften Abhängigkeitsgraphen verwenden.

## Warum das wichtig ist

Shrinkwrap ist ein Nachweis für den Abhängigkeitsbaum, der mit einem npm-Paket ausgeliefert wird: Es teilt npm mit, welche exakten transitiven Versionen installiert werden sollen.

| Datei                 | Wo sie relevant ist        | Was sie bedeutet                          |
| --------------------- | -------------------------- | ----------------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw-Quellcode-Checkout | Abhängigkeitsgraph der Maintainer         |
| `npm-shrinkwrap.json` | Veröffentlichtes npm-Paket | npm-Installationsgraph für Benutzer       |
| `package-lock.json`   | Lokale npm-Anwendungen     | Nicht der Veröffentlichungsvertrag von OpenClaw |

Für OpenClaw-Veröffentlichungen bedeutet dies:

- Das veröffentlichte Paket fordert npm nicht dazu auf, zum Installationszeitpunkt einen neuen Abhängigkeitsgraphen zu erstellen;
- Abhängigkeitsänderungen können geprüft werden, da sie als Änderung einer Lockdatei eingehen;
- die Veröffentlichungsvalidierung testet denselben Graphen, den Benutzer installieren werden;
- Überraschungen bei der Paketgröße oder nativen Abhängigkeiten werden vor der Veröffentlichung sichtbar.

Shrinkwrap ist keine Sandbox. Es macht eine Abhängigkeit nicht von sich aus sicher und ersetzt weder die Host-Isolierung noch `openclaw security audit`, die Paketherkunft oder Installations-Smoke-Tests.

OpenClaw ist ein Gateway, Plugin-Host, Modell-Router und eine Agentenlaufzeitumgebung. Daher wirkt sich eine Standardinstallation auf Startzeit, Speicherplatznutzung, Downloads nativer Pakete und die Gefährdung durch Lieferkettenrisiken aus. Shrinkwrap schafft eine stabile Grenze für die Veröffentlichungsprüfung: Prüfer sehen Änderungen transitiver Abhängigkeiten, Validierungswerkzeuge lehnen unerwartete Abweichungen der Lockdatei ab, und Plugin-Pakete enthalten ihren eigenen gesperrten Abhängigkeitsgraphen, anstatt sich auf das Root-Paket zu verlassen.

## Generieren und Prüfen

Das Root-npm-Paket `openclaw`, OpenClaw-eigene npm-Plugin-Pakete (zum Beispiel `@openclaw/discord`) und veröffentlichbare Workspace-Pakete wie [`@openclaw/ai`](/reference/openclaw-ai) enthalten bei der Veröffentlichung `npm-shrinkwrap.json`. Workspace-Abhängigkeiten werden aus dem Root-Shrinkwrap ausgelassen, da sie zusammen mit dem Root-Paket veröffentlicht werden; stattdessen fixiert jedes veröffentlichbare Workspace-Paket seinen eigenen transitiven Abhängigkeitsbaum. Geeignete Plugin-Pakete können außerdem mit expliziten `bundledDependencies` veröffentlicht werden, wodurch ihre Laufzeitabhängigkeitsdateien im Plugin-Tarball enthalten sind, anstatt sich ausschließlich auf die Auflösung zum Installationszeitpunkt zu verlassen.

```bash
# Alle durch Shrinkwrap verwalteten Pakete (Root + veröffentlichbare Plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Nur das Root-Paket
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Nur Pakete, die vom aktuellen Änderungssatz betroffen sind
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Der Generator löst das veröffentlichbare Lockformat von npm auf, lehnt jedoch generierte Paketversionen ab, die nicht bereits in `pnpm-lock.yaml` vorhanden sind. Dadurch bleibt die pnpm-Prüfgrenze für das Alter von Abhängigkeiten, Überschreibungen und Patches erhalten.

Prüfen Sie Folgendes als sicherheitskritisch:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- gebündelte Abhängigkeitsinhalte von Plugins
- jede Änderung an `package-lock.json`

Die OpenClaw-Paketvalidatoren verlangen Shrinkwrap in neuen Tarballs des Root-Pakets und lehnen `package-lock.json` für veröffentlichte Pakete ab. Der npm-Veröffentlichungspfad für Plugins prüft das Plugin-lokale Shrinkwrap, installiert paketlokale gebündelte Abhängigkeiten und erstellt oder veröffentlicht anschließend das Paket.

## Ein veröffentlichtes Paket untersuchen

Root-Paket:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Plugin-Paket:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Hintergrund: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
