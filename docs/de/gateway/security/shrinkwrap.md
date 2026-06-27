---
read_when:
    - Sie möchten wissen, was npm shrinkwrap in einem OpenClaw-Release bedeutet
    - Sie prüfen Paket-Lockfiles, Abhängigkeitsänderungen oder Supply-Chain-Risiken
    - Sie validieren Root- oder Plugin-npm-Pakete vor der Veröffentlichung
summary: Allgemeinverständliche und technische Erklärung von npm shrinkwrap in OpenClaw-Releases
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw-Source-Checkouts verwenden `pnpm-lock.yaml`. Veröffentlichte OpenClaw-npm-
Pakete verwenden `npm-shrinkwrap.json`, die veröffentlichbare Dependency-Lockfile von npm, sodass
Paketinstallationen den Dependency-Graph verwenden, der während des Releases geprüft wurde.

## Die einfache Version

Shrinkwrap ist eine Quittung für den Dependency-Baum, der mit einem npm-Paket ausgeliefert wird.
Sie teilt npm mit, welche exakten transitiven Paketversionen installiert werden sollen.

Für OpenClaw-Releases bedeutet das:

- das veröffentlichte Paket fordert npm nicht dazu auf, zur Installationszeit einen
  neuen Dependency-Graph zu erfinden;
- Dependency-Änderungen lassen sich leichter prüfen, weil sie in einer Lockfile erscheinen;
- die Release-Validierung kann denselben Graph testen, den Benutzer installieren werden;
- Überraschungen bei Paketgröße oder nativen Dependencies lassen sich vor dem
  Veröffentlichen leichter erkennen.

Shrinkwrap ist keine Sandbox. Sie macht eine Dependency nicht von sich aus sicher und
ersetzt keine Host-Isolation, `openclaw security audit`, Paket-
Provenance oder Installations-Smoke-Tests.

Das kurze mentale Modell:

| Datei                 | Wo sie relevant ist     | Was sie bedeutet                 |
| --------------------- | ----------------------- | -------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw-Source-Checkout | Maintainer-Dependency-Graph      |
| `npm-shrinkwrap.json` | Veröffentlichtes npm-Paket | npm-Installationsgraph für Benutzer |
| `package-lock.json`   | Lokale npm-Apps          | Nicht der OpenClaw-Veröffentlichungsvertrag |

## Warum OpenClaw sie verwendet

OpenClaw ist ein Gateway, Plugin-Host, Modell-Router und Agent-Runtime. Eine Standard-
installation kann Startzeit, Festplattennutzung, Downloads nativer Pakete und
Supply-Chain-Exponierung beeinflussen.

Shrinkwrap gibt der Release-Prüfung eine stabile Grenze:

- Reviewer können Bewegungen transitiver Dependencies sehen;
- Paketvalidatoren können unerwartete Lockfile-Abweichungen ablehnen;
- die Paketabnahme kann Installationen mit dem Graph testen, der ausgeliefert wird;
- Plugin-Pakete können ihren eigenen gesperrten Dependency-Graph mitbringen, statt
  sich darauf zu verlassen, dass das Root-Paket Plugin-spezifische Dependencies besitzt.

Das Ziel ist nicht „mehr Lockfiles“. Das Ziel sind reproduzierbare Release-Installationen
mit klarer Zuständigkeit.

## Technische Details

Das Root-npm-Paket `openclaw` und OpenClaw-eigene npm-Plugin-Pakete enthalten
`npm-shrinkwrap.json`, wenn sie veröffentlicht werden. Geeignete OpenClaw-eigene Plugin-
Pakete können außerdem mit expliziten `bundledDependencies` veröffentlichen, sodass ihre Runtime-
Dependency-Dateien im Plugin-Tarball mitgeführt werden, statt nur von der
Auflösung zur Installationszeit abzuhängen.

Pflegen Sie die Grenze so:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator löst das veröffentlichbare Lock-Format von npm auf, lehnt aber generierte
Paketversionen ab, die nicht bereits in `pnpm-lock.yaml` vorhanden sind. Dadurch bleibt
die pnpm-Grenze für Dependency-Alter, Overrides und Patch-Prüfung intakt.

Verwenden Sie Root-only-Befehle nur, wenn Sie das Root-Paket absichtlich aktualisieren,
ohne Plugin-Pakete zu berühren:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Prüfen Sie diese Dateien als sicherheitssensibel:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- gebündelte Plugin-Dependency-Payloads
- jeder `package-lock.json`-Diff

OpenClaw-Paketvalidatoren verlangen Shrinkwrap in neuen Root-Paket-Tarballs.
Der npm-Veröffentlichungspfad für Plugins prüft Plugin-lokale Shrinkwrap, installiert
paketlokale gebündelte Dependencies und packt oder veröffentlicht anschließend. Paket-
validatoren lehnen `package-lock.json` für veröffentlichte OpenClaw-Pakete ab.

So prüfen Sie ein veröffentlichtes Root-Paket:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

So prüfen Sie ein OpenClaw-eigenes Plugin-Paket:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Hintergrund: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
