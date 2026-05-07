---
read_when:
    - Sie möchten zwischen Stabil/Beta/Entwicklung wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie erstellen Tags für Vorabversionen oder veröffentlichen sie
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Dev-Kanäle: Semantik, Wechseln, Fixieren und Taggen'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-05-07T01:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw liefert drei Updatekanäle aus:

- **stable**: npm dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm dist-tag `beta`, wenn er aktuell ist; wenn beta fehlt oder älter ist als
  die neueste stabile Version, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Stand von `main` (git). npm dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung vorgesehen. Er kann
  unvollständige Funktionen oder Breaking Changes enthalten. Verwenden Sie ihn nicht für Produktions-Gateways.

Wir veröffentlichen stabile Builds in der Regel zuerst auf **beta**, testen sie dort und führen dann einen
expliziten Promotion-Schritt aus, der den geprüften Build nach `latest` verschiebt, ohne
die Versionsnummer zu ändern. Maintainer können eine stabile Version bei Bedarf auch
direkt auf `latest` veröffentlichen. Dist-tags sind die maßgebliche Quelle für npm-
Installationen.

## Geplante monatliche Support-Linien

OpenClaw liefert noch keinen LTS- oder monatlichen Supportkanal aus. Wir arbeiten
auf SemVer-kompatible monatliche Support-Linien hin, damit Benutzer auf einer ruhigeren
Linie bleiben können, während `latest` sich weiterhin schnell bewegt.

Die geplante Versionsform ist `YYYY.M.PATCH`:

- `YYYY` ist das Jahr.
- `M` ist die monatliche Release-Linie ohne führende Null.
- `PATCH` wird innerhalb dieser monatlichen Linie erhöht und kann bei Bedarf über 100 hinaus wachsen.

Beispiele für zukünftige Tags:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` für die Juni-Linie.
- `v2026.6.3-beta.1` für ein Prerelease auf dem schnellen/latest-Zweig.
- Ein zukünftiger dist-tag für eine Support-Linie wie `stable-2026-6` oder `lts-2026-6` kann
  auf eine monatliche Linie zeigen, aber heute ist kein solcher Kanal verfügbar.

Bis diese Migration bereitsteht, bleiben die öffentlichen Updatekanäle `stable`, `beta`
und `dev`.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl dauerhaft in der Konfiguration (`update.channel`) und richtet die
Installationsmethode darauf aus:

- **`stable`** (Paketinstallationen): aktualisiert über den npm dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt den npm dist-tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter ist als der aktuelle stabile Tag.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus.
- **`beta`** (git-Installationen): bevorzugt den neuesten beta-git-Tag, fällt aber auf
  den neuesten stabilen git-Tag zurück, wenn beta fehlt oder älter ist.
- **`dev`**: stellt einen git-Checkout sicher (Standard `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, rebased auf upstream, baut und
  installiert die globale CLI aus diesem Checkout.

<Tip>
Wenn Sie stable und dev parallel verwenden möchten, behalten Sie zwei Klone und richten Sie Ihr Gateway auf den stabilen Klon aus.
</Tip>

## Einmaliges Ziel für Version oder Tag

Verwenden Sie `--tag`, um einen bestimmten dist-tag, eine Version oder eine Paketspezifikation für ein einzelnes
Update zu verwenden, **ohne** Ihren dauerhaft gespeicherten Kanal zu ändern:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**. git-Installationen ignorieren es.
- Der Tag wird nicht dauerhaft gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt Ihren konfigurierten
  Kanal.
- Downgrade-Schutz: Wenn die Zielversion älter ist als Ihre aktuelle Version,
  fragt OpenClaw nach einer Bestätigung (mit `--yes` überspringen).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` den
  rohen dist-tag `beta` nur für diesen einen Lauf verwendet.

## Probelauf

Zeigen Sie eine Vorschau dessen an, was `openclaw update` tun würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Probelauf zeigt den effektiven Kanal, die Zielversion, die geplanten Aktionen und
ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Wenn Sie mit `openclaw update` den Kanal wechseln, synchronisiert OpenClaw auch Plugin-
Quellen:

- `dev` bevorzugt gebündelte Plugins aus dem git-Checkout.
- `stable` und `beta` stellen npm-installierte Plugin-Pakete wieder her.
- npm-installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard) an.

## Best Practices für Tags

- Taggen Sie Releases, auf denen git-Checkouts landen sollen (`vYYYY.M.D` für aktuelle
  stabile Releases, `vYYYY.M.D-beta.N` für aktuelle beta-Releases).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, bevorzugen Sie jedoch `-beta.N`.
- Legacy-Tags `vYYYY.M.D-<patch>` werden weiterhin als stabil (nicht beta) erkannt,
  aber das geplante monatliche Supportmodell wird normale Patch-Nummern
  (`vYYYY.M.PATCH`) statt eines Korrektursuffixes mit Bindestrich verwenden.
- Halten Sie Tags unveränderlich: Verschieben oder verwenden Sie einen Tag nie erneut.
- npm dist-tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder beta-first-stabiler Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **keine** macOS-App-Version. Das ist in Ordnung:

- Der git-Tag und npm dist-tag können trotzdem veröffentlicht werden.
- Weisen Sie in Release Notes oder Changelog auf „kein macOS-Build für dieses beta“ hin.

## Verwandt

- [Aktualisieren](/de/install/updating)
- [Installer-Interna](/de/install/installer)
