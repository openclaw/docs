---
read_when:
    - Sie möchten zwischen stable/extended-stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie versehen Vorabversionen mit Tags oder veröffentlichen sie
sidebarTitle: Release Channels
summary: 'Stable-, Extended-Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-07-24T04:36:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw wird über vier Aktualisierungskanäle bereitgestellt:

- **stable**: npm-dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **extended-stable**: npm-dist-tag `extended-stable`. Ein vollständig neuer, nachlaufender
  Paketkanal für unterstützte Monate. Er ist ausschließlich für Pakete vorgesehen, und die Installation
  erfolgt ausschließlich im Vordergrund. Für eine gespeicherte Auswahl werden schreibgeschützte Aktualisierungshinweise angezeigt, wenn
  `update.checkOnStart` aktiviert ist, sie wird jedoch nie automatisch angewendet.
- **beta**: npm-dist-tag `beta`. Fällt auf `latest` zurück, wenn `beta` fehlt
  oder älter als das aktuelle stabile Release ist.
- **dev**: fortlaufender Stand von `main` (git). npm-dist-tag `dev`, sofern veröffentlicht. `main`
  dient Experimenten und der aktiven Entwicklung; dieser Kanal kann unvollständige
  Funktionen oder inkompatible Änderungen enthalten. Verwenden Sie ihn nicht für produktive Gateways.

Stabile Builds werden üblicherweise zuerst über **beta** bereitgestellt, dort geprüft und anschließend
ohne Versionsanhebung zu **latest** hochgestuft. Maintainer können auch
direkt unter `latest` veröffentlichen. Dist-Tags sind die maßgebliche Quelle für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert die Auswahl als `update.channel` in der Konfiguration und steuert beide
Installationspfade:

| Kanal             | npm-/Paketinstallationen                                                                                                                                                               | git-Installationen                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | neuestes stabiles git-Tag (schließt `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` und andere benannte Vorabversionssuffixe aus) |
| `extended-stable` | löst den öffentlichen npm-Selektor `extended-stable` auf, überprüft das exakt ausgewählte Paket und installiert genau diese Version. Schlägt sicher und ohne Rückgriff auf `latest`, `beta` oder `dev` fehl. | nicht unterstützt: OpenClaw lässt den Checkout unverändert und fordert Sie auf, eine Paketinstallation zu verwenden                                               |
| `beta`            | dist-tag `beta`, mit Rückgriff auf `latest`, wenn `beta` fehlt oder älter ist                                                                                                    | neuestes Beta-git-Tag, mit Rückgriff auf das neueste stabile git-Tag, wenn Beta fehlt oder älter ist                                                               |
| `dev`             | dist-tag `dev` (selten; die meisten dev-Benutzer verwenden git-Installationen)                                                                                                                           | ruft Änderungen ab, führt einen Rebase des Checkouts auf den vorgelagerten Branch `main` durch, erstellt den Build und installiert die globale CLI neu |

Bei git-Installationen mit `dev` ist der standardmäßige Checkout `~/openclaw` (oder
`$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` gesetzt ist); überschreiben Sie ihn mit
`OPENCLAW_GIT_DIR`.

<Tip>
Um stable und dev parallel zu verwenden, nutzen Sie zwei separate Checkouts und verweisen Sie jedes Gateway auf seinen eigenen.
</Tip>

## Einmaliges Festlegen einer Version oder eines Tags

Verwenden Sie `--tag`, um für eine einzelne Aktualisierung ein bestimmtes dist-tag, eine bestimmte Version oder eine Paketspezifikation
festzulegen, **ohne** den gespeicherten Kanal zu ändern:

```bash
# Eine bestimmte Version installieren
openclaw update --tag 2026.4.1-beta.1

# Vom Beta-dist-tag installieren (einmalig, wird nicht gespeichert)
openclaw update --tag beta

# Zum fortlaufenden GitHub-main-Checkout wechseln (dauerhaft)
openclaw update --channel dev

# Eine bestimmte npm-Paketspezifikation installieren
openclaw update --tag openclaw@2026.4.1-beta.1

# Einmalig von GitHub main installieren, ohne den Kanal zu speichern
openclaw update --tag main
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**; git-Installationen ignorieren die Option.
- Das Tag wird nicht gespeichert; beim nächsten `openclaw update` wird der konfigurierte
  Kanal verwendet.
- `--tag main` wird für diesen einen Durchlauf der npm-kompatiblen Spezifikation `github:openclaw/openclaw#main`
  zugeordnet. Verwenden Sie für eine dauerhafte fortlaufende Installation von `main`
  `openclaw update --channel dev` (Paketinstallationen wechseln zu einem git-Checkout)
  oder führen Sie mit der git-Methode des Installationsprogramms eine Neuinstallation durch:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Der npm-Installationspfad lehnt GitHub-/git-Quellziele grundsätzlich ab und verweist
  stattdessen auf die git-Methode.
- Downgrade-Schutz: Wenn die Zielversion älter als die aktuelle
  Version ist, fordert OpenClaw eine Bestätigung an (mit `--yes` überspringen).
- Extended-stable verwendet stets sein verifiziertes, exaktes Paketziel. Es ist kein
  einmaliger Alias für `--tag extended-stable`, und `--tag` kann nicht mit
  einem tatsächlich verwendeten extended-stable-Kanal kombiniert werden.
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückgreifen, wenn beta fehlt oder älter ist, während `--tag beta` für diesen einen Durchlauf stets
  direkt auf das dist-tag `beta` zielt.

## Probelauf

Zeigen Sie in einer Vorschau an, was `openclaw update` ausführen würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Probelauf meldet den tatsächlich verwendeten Kanal, die Zielversion, die geplanten Aktionen
und ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Beim Wechseln von Kanälen mit `openclaw update` werden auch die Plugin-Quellen synchronisiert:

- `dev` stellt installierte Plugins, für die es ein gebündeltes Gegenstück gibt, wieder auf
  ihre gebündelte Quelle (git-Checkout) um.
- `stable` und `beta` stellen über npm oder ClawHub installierte Plugin-
  Pakete wieder her.
- `extended-stable` löst geeignete offizielle npm-Plugins mit unveränderter/standardmäßiger
  oder `latest`-Auswahlabsicht auf die exakt installierte Kernversion auf. Zur Laufzeit werden keine
  Plugin-Tags vom Typ `@extended-stable` abgefragt.
- Über npm installierte Plugins werden aktualisiert, nachdem die Kernaktualisierung abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal (einschließlich der Quelle, die ihn bestimmt hat: Konfiguration, git-Tag,
git-Branch, installierte Version oder Standardwert), die Installationsart (git oder Paket),
die aktuelle Version und die Verfügbarkeit von Aktualisierungen an.

## Bewährte Vorgehensweisen für Tags

- Versehen Sie Releases, auf denen git-Checkouts landen sollen, mit Tags: `vYYYY.M.PATCH` für stable,
  `vYYYY.M.PATCH-beta.N` für beta. Benannte Vorabversionssuffixe wie
  `-alpha.N`, `-rc.N` und `-next.N` sind keine stable- oder beta-Ziele.
- Ältere numerische stable-Tags wie `vYYYY.M.PATCH-1` und `v1.0.1-1` werden aus
  Kompatibilitätsgründen weiterhin als stabile git-Tags erkannt.
- `vYYYY.M.PATCH.beta.N` (durch Punkte getrennt) wird aus Kompatibilitätsgründen ebenfalls erkannt;
  bevorzugen Sie `-beta.N`.
- Halten Sie Tags unveränderlich: Verschieben oder verwenden Sie ein Tag niemals erneut.
- npm-dist-tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `extended-stable` -> nachlaufendes Paket-Release für einen unterstützten Monat
  - `beta` -> Kandidaten-Build oder zuerst über beta bereitgestellter stabiler Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **kein** Release der macOS-App. Das ist unproblematisch:

- Das git-Tag und das npm-dist-tag können dennoch unabhängig veröffentlicht werden.
- Weisen Sie in den Release Notes oder im Changelog auf „kein macOS-Build für diese Beta-Version“ hin.

## Verwandte Themen

- [Aktualisieren](/de/install/updating)
- [Interna des Installationsprogramms](/de/install/installer)
