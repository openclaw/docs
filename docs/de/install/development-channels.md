---
read_when:
    - Sie möchten zwischen stable/extended-stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie kennzeichnen oder veröffentlichen Vorabversionen
sidebarTitle: Release Channels
summary: 'Stable-, Extended-Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-07-12T15:33:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw wird über vier Update-Kanäle ausgeliefert:

- **stable**: npm-Dist-Tag `latest`. Für die meisten Benutzer empfohlen.
- **extended-stable**: npm-Dist-Tag `extended-stable`. Ein vollständig neuer, nachlaufender
  Paketkanal für unterstützte Monate. Er ist ausschließlich für Pakete vorgesehen, und die Installation
  erfolgt ausschließlich im Vordergrund. Bei einer gespeicherten Auswahl werden schreibgeschützte Update-Hinweise angezeigt, wenn
  `update.checkOnStart` aktiviert ist, Updates werden jedoch niemals automatisch angewendet.
- **beta**: npm-Dist-Tag `beta`. Fällt auf `latest` zurück, wenn `beta` fehlt
  oder älter als die aktuelle stabile Version ist.
- **dev**: fortlaufend aktualisierte Spitze von `main` (Git). npm-Dist-Tag `dev`, sofern veröffentlicht. `main`
  dient Experimenten und der aktiven Entwicklung; dieser Kanal kann unvollständige
  Funktionen oder grundlegende Änderungen enthalten. Verwenden Sie ihn nicht für produktive Gateways.

Stabile Builds werden normalerweise zuerst über **beta** ausgeliefert, dort geprüft und anschließend
ohne Erhöhung der Versionsnummer zu **latest** hochgestuft. Maintainer können auch
direkt unter `latest` veröffentlichen. Dist-Tags sind die maßgebliche Quelle für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert die Auswahl unter `update.channel` in der Konfiguration und steuert beide
Installationspfade:

| Kanal             | npm-/Paketinstallationen                                                                                                                                                                     | Git-Installationen                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Dist-Tag `latest`                                                                                                                                                                            | neuestes stabiles Git-Tag (schließt `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` und andere benannte Vorabversionssuffixe aus) |
| `extended-stable` | löst den öffentlichen npm-Selektor `extended-stable` auf, überprüft das exakt ausgewählte Paket und installiert genau diese Version. Schlägt ohne Rückfall auf `latest`, `beta` oder `dev` geschlossen fehl. | nicht unterstützt: OpenClaw lässt den Checkout unverändert und fordert Sie auf, eine Paketinstallation zu verwenden                                                     |
| `beta`            | Dist-Tag `beta`, mit Rückfall auf `latest`, wenn `beta` fehlt oder älter ist                                                                                                                  | neuestes Beta-Git-Tag, mit Rückfall auf das neueste stabile Git-Tag, wenn die Beta-Version fehlt oder älter ist                                                          |
| `dev`             | Dist-Tag `dev` (selten; die meisten Dev-Benutzer verwenden Git-Installationen)                                                                                                               | ruft Änderungen ab, führt einen Rebase des Checkouts auf den vorgelagerten Branch `main` durch, erstellt das Projekt und installiert die globale CLI neu                |

Bei `dev`-Git-Installationen lautet der Standard-Checkout `~/openclaw` (oder
`$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` gesetzt ist); überschreiben Sie ihn mit
`OPENCLAW_GIT_DIR`.

<Tip>
Um stable und dev parallel zu verwenden, nutzen Sie zwei separate Checkouts und verweisen Sie jedes Gateway auf den jeweils eigenen.
</Tip>

## Einmalige Auswahl einer Version oder eines Tags

Verwenden Sie `--tag`, um für ein einzelnes Update ein bestimmtes Dist-Tag, eine bestimmte Version oder eine Paketspezifikation
auszuwählen, **ohne** den gespeicherten Kanal zu ändern:

```bash
# Eine bestimmte Version installieren
openclaw update --tag 2026.4.1-beta.1

# Vom Beta-Dist-Tag installieren (einmalig, wird nicht gespeichert)
openclaw update --tag beta

# Zum fortlaufend aktualisierten GitHub-main-Checkout wechseln (dauerhaft)
openclaw update --channel dev

# Eine bestimmte npm-Paketspezifikation installieren
openclaw update --tag openclaw@2026.4.1-beta.1

# Einmalig von GitHub main installieren, ohne den Kanal zu speichern
openclaw update --tag main
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**; Git-Installationen ignorieren es.
- Das Tag wird nicht gespeichert; das nächste `openclaw update` verwendet den konfigurierten
  Kanal.
- `--tag main` wird für diesen einen Durchlauf der npm-kompatiblen Spezifikation `github:openclaw/openclaw#main`
  zugeordnet. Verwenden Sie für eine dauerhafte, fortlaufend aktualisierte `main`-Installation
  `openclaw update --channel dev` (Paketinstallationen wechseln zu einem Git-Checkout)
  oder führen Sie mit der Git-Methode des Installationsprogramms eine Neuinstallation durch:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Der npm-Installationspfad lehnt GitHub-/Git-Quellziele vollständig ab und verweist
  stattdessen auf die Git-Methode.
- Downgrade-Schutz: Wenn die Zielversion älter als die aktuelle
  Version ist, fordert OpenClaw eine Bestätigung an (mit `--yes` überspringen).
- Extended-stable verwendet stets sein überprüftes, exaktes Paketziel. Es ist kein
  einmaliger Alias für `--tag extended-stable`, und `--tag` kann nicht mit
  einem effektiven Extended-stable-Kanal kombiniert werden.
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` bei diesem einen Durchlauf
  immer direkt auf das unverarbeitete Dist-Tag `beta` zielt.

## Probelauf

Zeigen Sie eine Vorschau der Aktionen von `openclaw update` an, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Probelauf meldet den effektiven Kanal, die Zielversion, die geplanten Aktionen
und ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Beim Wechseln von Kanälen mit `openclaw update` werden auch die Plugin-Quellen synchronisiert:

- `dev` stellt bei installierten Plugins, für die ein gebündeltes Gegenstück vorhanden ist, wieder
  deren gebündelte Quelle (Git-Checkout) ein.
- `stable` und `beta` stellen über npm oder ClawHub installierte Plugin-Pakete
  wieder her.
- `extended-stable` löst geeignete offizielle npm-Plugins mit bloßer/standardmäßiger
  oder `latest`-Absicht auf die exakt installierte Kernversion auf. Plugin-Tags vom Typ
  `@extended-stable` werden zur Laufzeit nicht abgefragt.
- Über npm installierte Plugins werden aktualisiert, nachdem das Kern-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal (einschließlich der Quelle, die ihn bestimmt hat: Konfiguration, Git-Tag,
Git-Branch, installierte Version oder Standard), die Installationsart (Git oder Paket),
die aktuelle Version und die Verfügbarkeit von Updates an.

## Bewährte Methoden für Tags

- Vergeben Sie Tags für Releases, auf denen Git-Checkouts landen sollen: `vYYYY.M.PATCH` für stable,
  `vYYYY.M.PATCH-beta.N` für beta. Benannte Vorabversionssuffixe wie
  `-alpha.N`, `-rc.N` und `-next.N` sind keine Ziele für stable oder beta.
- Ältere numerische Stable-Tags wie `vYYYY.M.PATCH-1` und `v1.0.1-1` werden aus
  Kompatibilitätsgründen weiterhin als stabile Git-Tags erkannt.
- `vYYYY.M.PATCH.beta.N` (durch Punkte getrennt) wird aus Kompatibilitätsgründen ebenfalls erkannt;
  bevorzugen Sie `-beta.N`.
- Halten Sie Tags unveränderlich: Verschieben oder verwenden Sie ein Tag niemals erneut.
- npm-Dist-Tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `extended-stable` -> nachlaufendes Paket-Release für unterstützte Monate
  - `beta` -> Release-Kandidat oder zuerst als Beta veröffentlichtes stabiles Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und Dev-Builds enthalten möglicherweise **keine** Veröffentlichung der macOS-App. Das ist in Ordnung:

- Das Git-Tag und das npm-Dist-Tag können weiterhin unabhängig veröffentlicht werden.
- Weisen Sie in den Versionshinweisen oder im Changelog auf „kein macOS-Build für diese Beta-Version“ hin.

## Verwandte Themen

- [Aktualisierung](/de/install/updating)
- [Interna des Installationsprogramms](/de/install/installer)
