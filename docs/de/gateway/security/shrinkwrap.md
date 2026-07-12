---
read_when:
    - Sie möchten wissen, was npm Shrinkwrap in einem OpenClaw-Release bedeutet.
    - Sie überprüfen Paket-Lockfiles, Änderungen an Abhängigkeiten oder Risiken in der Lieferkette
    - Sie validieren Root- oder Plugin-npm-Pakete vor der Veröffentlichung
summary: Allgemein verständliche und technische Erklärung von npm Shrinkwrap in OpenClaw-Releases
title: npm-Shrinkwrap
x-i18n:
    generated_at: "2026-07-12T15:28:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw-Quellcode-Checkouts verwenden `pnpm-lock.yaml`. Veröffentlichte OpenClaw-npm-Pakete verwenden `npm-shrinkwrap.json`, die veröffentlichbare Abhängigkeitssperrdatei von npm, sodass Paketinstallationen den während der Veröffentlichung geprüften Abhängigkeitsgraphen verwenden.

## Warum das wichtig ist

Shrinkwrap ist ein Beleg für den Abhängigkeitsbaum, der mit einem npm-Paket ausgeliefert wird: Es teilt npm mit, welche exakten transitiven Versionen installiert werden sollen.

| Datei                 | Wo sie relevant ist          | Was sie bedeutet                          |
| --------------------- | ---------------------------- | ----------------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw-Quellcode-Checkout  | Abhängigkeitsgraph der Maintainer         |
| `npm-shrinkwrap.json` | Veröffentlichtes npm-Paket   | npm-Installationsgraph für Benutzer       |
| `package-lock.json`   | Lokale npm-Anwendungen       | Nicht der Veröffentlichungsvertrag von OpenClaw |

Für OpenClaw-Veröffentlichungen bedeutet dies:

- Das veröffentlichte Paket fordert npm nicht auf, während der Installation einen neuen Abhängigkeitsgraphen zu erzeugen;
- Abhängigkeitsänderungen sind überprüfbar, da sie als Diff einer Sperrdatei eingehen;
- die Veröffentlichungsvalidierung testet denselben Graphen, den Benutzer installieren werden;
- Überraschungen bei der Paketgröße oder nativen Abhängigkeiten werden vor der Veröffentlichung sichtbar.

Shrinkwrap ist keine Sandbox. Es macht eine Abhängigkeit nicht von sich aus sicher und ersetzt weder die Host-Isolierung noch `openclaw security audit`, die Paketherkunft oder Installations-Smoketests.

OpenClaw ist ein Gateway, Plugin-Host, Modell-Router und eine Agentenlaufzeit. Daher wirkt sich eine Standardinstallation auf Startzeit, Speicherplatzverbrauch, Downloads nativer Pakete und die Gefährdung durch die Lieferkette aus. Shrinkwrap gibt der Veröffentlichungsprüfung eine stabile Grenze: Prüfer sehen Änderungen transitiver Abhängigkeiten, Validatoren weisen unerwartete Abweichungen der Sperrdatei zurück und Plugin-Pakete enthalten ihren eigenen gesperrten Abhängigkeitsgraphen, anstatt sich auf das Root-Paket zu verlassen.

## Generieren und Prüfen

Das Root-npm-Paket `openclaw`, OpenClaw-eigene npm-Plugin-Pakete (beispielsweise `@openclaw/discord`) und veröffentlichbare Workspace-Pakete wie [`@openclaw/ai`](/de/reference/openclaw-ai) enthalten bei der Veröffentlichung `npm-shrinkwrap.json`. Workspace-Abhängigkeiten werden aus der Root-Shrinkwrap-Datei ausgelassen, da sie zusammen mit dem Root-Paket veröffentlicht werden; stattdessen legt jedes veröffentlichbare Workspace-Paket seinen eigenen transitiven Baum fest. Geeignete Plugin-Pakete können außerdem mit expliziten `bundledDependencies` veröffentlicht werden, wodurch ihre Laufzeit-Abhängigkeitsdateien im Plugin-Tarball enthalten sind, anstatt sich ausschließlich auf die Auflösung bei der Installation zu verlassen.

```bash
# Alle mit Shrinkwrap verwalteten Pakete (Root + veröffentlichbare Plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Nur Root-Paket
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Nur von der aktuellen Änderungsgruppe betroffene Pakete
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Der Generator löst das veröffentlichbare Sperrformat von npm auf, weist jedoch generierte Paketversionen zurück, die nicht bereits in `pnpm-lock.yaml` vorhanden sind. Dadurch bleibt die pnpm-Prüfgrenze für Abhängigkeitsalter, Überschreibungen und Patches intakt.

Prüfen Sie Folgendes als sicherheitskritisch:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- gebündelte Abhängigkeitsinhalte von Plugins
- jeden Diff von `package-lock.json`

OpenClaw-Paketvalidatoren verlangen Shrinkwrap in neuen Tarballs des Root-Pakets und weisen `package-lock.json` für veröffentlichte Pakete zurück. Der npm-Veröffentlichungspfad für Plugins prüft die lokale Shrinkwrap-Datei des Plugins, installiert paketlokale gebündelte Abhängigkeiten und packt oder veröffentlicht das Paket anschließend.

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
