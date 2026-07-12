---
read_when:
    - Sie möchten zwischen Stable/Extended-Stable/Beta/Dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie kennzeichnen oder veröffentlichen Vorabversionen.
sidebarTitle: Release Channels
summary: 'Stable-, Extended-Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Versionsfixierung und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-07-12T01:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw wird in vier Aktualisierungskanälen ausgeliefert:

- **stable**: npm-Dist-Tag `latest`. Für die meisten Benutzer empfohlen.
- **extended-stable**: npm-Dist-Tag `extended-stable`. Ein vollständig neuer, nachlaufender
  Paketkanal für unterstützte Monate. Er ist ausschließlich für Pakete vorgesehen,
  und die Installation erfolgt nur im Vordergrund. Bei gespeicherter Auswahl werden
  schreibgeschützte Aktualisierungshinweise angezeigt, wenn `update.checkOnStart`
  aktiviert ist; Aktualisierungen werden jedoch niemals automatisch angewendet.
- **beta**: npm-Dist-Tag `beta`. Fällt auf `latest` zurück, wenn `beta` fehlt
  oder älter als die aktuelle stabile Version ist.
- **dev**: fortlaufend aktualisierter Stand von `main` (Git). npm-Dist-Tag `dev`,
  sofern veröffentlicht. `main` dient Experimenten und der aktiven Entwicklung;
  der Branch kann unvollständige Funktionen oder inkompatible Änderungen enthalten.
  Verwenden Sie ihn nicht für produktive Gateways.

Stabile Builds werden üblicherweise zuerst über **beta** ausgeliefert, dort geprüft
und anschließend ohne Erhöhung der Versionsnummer zu **latest** hochgestuft.
Maintainer können auch direkt unter `latest` veröffentlichen. Dist-Tags sind die
maßgebliche Quelle für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert die Auswahl unter `update.channel` in der Konfiguration
und steuert beide Installationspfade:

| Kanal             | npm-/Paketinstallationen                                                                                                                                                                                | Git-Installationen                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Dist-Tag `latest`                                                                                                                                                                                       | neuestes stabiles Git-Tag (schließt `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` und andere benannte Vorabversionssuffixe aus) |
| `extended-stable` | löst den öffentlichen npm-Selektor `extended-stable` auf, verifiziert das exakt ausgewählte Paket und installiert genau diese Version. Schlägt ohne Rückfall auf `latest`, `beta` oder `dev` sicher fehl. | nicht unterstützt: OpenClaw lässt den Checkout unverändert und fordert Sie auf, eine Paketinstallation zu verwenden                                                   |
| `beta`            | Dist-Tag `beta` mit Rückfall auf `latest`, wenn `beta` fehlt oder älter ist                                                                                                                             | neuestes Beta-Git-Tag mit Rückfall auf das neueste stabile Git-Tag, wenn die Beta-Version fehlt oder älter ist                                                        |
| `dev`             | Dist-Tag `dev` (selten; die meisten Entwickler verwenden Git-Installationen)                                                                                                                           | ruft Änderungen ab, führt für den Checkout ein Rebase auf den vorgelagerten Branch `main` durch, erstellt den Build und installiert die globale CLI neu               |

Bei `dev`-Git-Installationen ist der standardmäßige Checkout `~/openclaw`
(oder `$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` gesetzt ist); mit
`OPENCLAW_GIT_DIR` können Sie ihn überschreiben.

<Tip>
Wenn Sie stable und dev parallel verwenden möchten, nutzen Sie zwei separate Checkouts und weisen Sie jedem Gateway einen eigenen zu.
</Tip>

## Einmalig eine bestimmte Version oder ein Tag auswählen

Verwenden Sie `--tag`, um für eine einzelne Aktualisierung ein bestimmtes
Dist-Tag, eine bestimmte Version oder Paketspezifikation auszuwählen,
**ohne** den gespeicherten Kanal zu ändern:

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

- `--tag` gilt **nur für Paketinstallationen (npm)**; Git-Installationen
  ignorieren die Option.
- Das Tag wird nicht gespeichert; beim nächsten `openclaw update` wird der
  konfigurierte Kanal verwendet.
- `--tag main` wird für diesen einen Durchlauf der npm-kompatiblen Spezifikation
  `github:openclaw/openclaw#main` zugeordnet. Verwenden Sie für eine dauerhaft
  fortlaufend aktualisierte `main`-Installation
  `openclaw update --channel dev` (Paketinstallationen wechseln zu einem
  Git-Checkout), oder führen Sie mit der Git-Methode des Installationsprogramms
  eine Neuinstallation durch:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Der npm-Installationspfad lehnt GitHub-/Git-Quellziele grundsätzlich ab und
  verweist Sie stattdessen auf die Git-Methode.
- Schutz vor Herabstufungen: Wenn die Zielversion älter als die aktuelle
  Version ist, fordert OpenClaw Sie zur Bestätigung auf (mit `--yes`
  überspringen).
- Extended-stable verwendet immer sein verifiziertes, exaktes Paketziel. Es ist
  kein einmaliger Alias für `--tag extended-stable`, und `--tag` kann nicht mit
  einem wirksamen extended-stable-Kanal kombiniert werden.
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann
  auf stable/latest zurückfallen, wenn die Beta-Version fehlt oder älter ist,
  während `--tag beta` bei diesem einen Durchlauf immer direkt das Dist-Tag
  `beta` auswählt.

## Probelauf

Zeigen Sie in einer Vorschau an, was `openclaw update` ausführen würde, ohne
Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Probelauf meldet den wirksamen Kanal, die Zielversion, die geplanten
Aktionen und ob eine Bestätigung für eine Herabstufung erforderlich wäre.

## Plugins und Kanäle

Beim Wechseln des Kanals mit `openclaw update` werden außerdem die
Plugin-Quellen synchronisiert:

- `dev` stellt installierte Plugins, für die es ein gebündeltes Gegenstück
  gibt, wieder auf ihre gebündelte Quelle (Git-Checkout) um.
- `stable` und `beta` stellen über npm oder ClawHub installierte Plugin-Pakete
  wieder her.
- `extended-stable` löst geeignete offizielle npm-Plugins mit unveränderter,
  standardmäßiger oder `latest`-Auswahl auf die exakt installierte Kernversion
  auf. Zur Laufzeit werden keine `@extended-stable`-Tags der Plugins abgefragt.
- Über npm installierte Plugins werden aktualisiert, nachdem die
  Kernaktualisierung abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal einschließlich der Quelle, die ihn bestimmt hat
(Konfiguration, Git-Tag, Git-Branch, installierte Version oder Standard), die
Installationsart (Git oder Paket), die aktuelle Version und die Verfügbarkeit
von Aktualisierungen an.

## Bewährte Vorgehensweisen für Tags

- Versehen Sie Veröffentlichungen, bei denen Git-Checkouts landen sollen, mit
  Tags: `vYYYY.M.PATCH` für stable und `vYYYY.M.PATCH-beta.N` für beta.
  Benannte Vorabversionssuffixe wie `-alpha.N`, `-rc.N` und `-next.N` sind
  keine Ziele für stable oder beta.
- Veraltete numerische stable-Tags wie `vYYYY.M.PATCH-1` und `v1.0.1-1` werden
  aus Kompatibilitätsgründen weiterhin als stabile Git-Tags erkannt.
- `vYYYY.M.PATCH.beta.N` (durch Punkte getrennt) wird aus
  Kompatibilitätsgründen ebenfalls erkannt; bevorzugen Sie `-beta.N`.
- Halten Sie Tags unveränderlich: Verschieben oder verwenden Sie Tags niemals
  erneut.
- npm-Dist-Tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `extended-stable` -> nachlaufende Paketveröffentlichung für unterstützte Monate
  - `beta` -> Kandidaten-Build oder zuerst als Beta veröffentlichter stabiler Build
  - `dev` -> Momentaufnahme von main (optional)

## Verfügbarkeit der macOS-App

Beta- und Dev-Builds enthalten möglicherweise **keine** Veröffentlichung der
macOS-App. Das ist unproblematisch:

- Das Git-Tag und das npm-Dist-Tag können weiterhin unabhängig veröffentlicht
  werden.
- Weisen Sie in den Veröffentlichungshinweisen oder im Änderungsprotokoll auf
  „kein macOS-Build für diese Beta-Version“ hin.

## Verwandte Themen

- [Aktualisieren](/de/install/updating)
- [Interne Funktionsweise des Installationsprogramms](/de/install/installer)
