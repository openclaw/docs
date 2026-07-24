---
read_when:
    - Sie möchten wissen, was npm Shrinkwrap in einem OpenClaw-Release bedeutet
    - Sie prüfen Paket-Lockfiles, Abhängigkeitsänderungen oder Risiken in der Lieferkette
    - Sie validieren npm-Pakete des Stammprojekts oder von Plugins vor der Veröffentlichung
summary: Allgemeinverständliche und technische Erklärung von npm Shrinkwrap in OpenClaw-Releases
title: npm-Shrinkwrap
x-i18n:
    generated_at: "2026-07-24T04:36:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw-Quell-Checkouts verwenden `pnpm-lock.yaml`. Veröffentlichte OpenClaw-npm-Pakete verwenden `npm-shrinkwrap.json`, die veröffentlichbare Abhängigkeits-Lockdatei von npm, sodass Paketinstallationen den während des Releases geprüften Abhängigkeitsgraphen verwenden.

## Warum dies wichtig ist

Shrinkwrap ist ein Beleg für den Abhängigkeitsbaum, der mit einem npm-Paket ausgeliefert wird: Es teilt npm mit, welche exakten transitiven Versionen installiert werden sollen.

| Datei                  | Wo sie relevant ist         | Was sie bedeutet                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw-Quell-Checkout | Abhängigkeitsgraph der Maintainer       |
| `npm-shrinkwrap.json` | Veröffentlichtes npm-Paket    | npm-Installationsgraph für Benutzer       |
| `package-lock.json`   | Lokale npm-Anwendungen           | Nicht der Veröffentlichungsvertrag von OpenClaw |

Für OpenClaw-Releases bedeutet dies:

- das veröffentlichte Paket fordert npm nicht auf, bei der Installation einen neuen Abhängigkeitsgraphen zu erstellen;
- Abhängigkeitsänderungen sind überprüfbar, da sie in einem Lockdatei-Diff eingehen;
- die Release-Validierung testet denselben Graphen, den Benutzer installieren werden;
- Überraschungen bei der Paketgröße oder nativen Abhängigkeiten werden vor der Veröffentlichung sichtbar.

Shrinkwrap ist keine Sandbox. Es macht eine Abhängigkeit nicht von sich aus sicher und ersetzt weder Host-Isolation, `openclaw security audit`, Paketherkunft noch Installations-Smoke-Tests.

OpenClaw ist ein Gateway, Plugin-Host, Modell-Router und eine Agentenlaufzeitumgebung. Daher wirkt sich eine Standardinstallation auf Startzeit, Speicherplatzbedarf, Downloads nativer Pakete und Gefährdung durch die Lieferkette aus. Shrinkwrap verleiht der Release-Prüfung eine stabile Grenze: Prüfer sehen Bewegungen transitiver Abhängigkeiten, Validatoren lehnen unerwartete Abweichungen der Lockdatei ab, und Plugin-Pakete führen ihren eigenen gesperrten Abhängigkeitsgraphen mit, statt sich auf das Root-Paket zu verlassen.

## Generieren und prüfen

Das npm-Root-Paket `openclaw`, OpenClaw-eigene npm-Plugin-Pakete (zum Beispiel `@openclaw/discord`) und veröffentlichbare Workspace-Pakete wie [`@openclaw/ai`](/de/reference/openclaw-ai) enthalten bei der Veröffentlichung `npm-shrinkwrap.json`. Workspace-Abhängigkeiten werden aus dem Root-Shrinkwrap ausgelassen, da sie zusammen mit dem Root-Paket veröffentlicht werden; stattdessen fixiert jedes veröffentlichbare Workspace-Paket seinen eigenen transitiven Baum. Geeignete Plugin-Pakete können auch mit expliziten `bundledDependencies` veröffentlicht werden und ihre Laufzeit-Abhängigkeitsdateien im Plugin-Tarball mitführen, statt sich ausschließlich auf die Auflösung zur Installationszeit zu verlassen.

```bash
# Alle durch Shrinkwrap verwalteten Pakete (Root + veröffentlichbare Plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Nur Root-Paket
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Nur von der aktuellen Änderungsmenge betroffene Pakete
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Der Generator löst das veröffentlichbare Lockformat von npm auf, lehnt jedoch generierte Paketversionen ab, die nicht bereits in `pnpm-lock.yaml` vorhanden sind. Dadurch bleibt die Prüfgrenze für Abhängigkeitsalter, Überschreibungen und Patches von pnpm erhalten.

Prüfen Sie Folgendes als sicherheitskritisch:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- Abhängigkeits-Nutzlasten gebündelter Plugins
- jeden Diff von `package-lock.json`

OpenClaw-Paketvalidatoren verlangen Shrinkwrap in neuen Tarballs des Root-Pakets und lehnen `package-lock.json` für veröffentlichte Pakete ab. Der npm-Veröffentlichungspfad für Plugins prüft das Plugin-lokale Shrinkwrap, installiert paketlokale gebündelte Abhängigkeiten und packt oder veröffentlicht anschließend das Paket.

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
