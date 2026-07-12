---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Kurzschreibweisenverhalten von `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Aktualisierung des Quellcodes + automatischer Neustart des Gateways)
title: Aktualisieren
x-i18n:
    generated_at: "2026-07-12T15:15:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw aktualisieren und zwischen den Kanälen Stable/Extended-Stable/Beta/Dev wechseln.

Wenn Sie die Installation über **npm/pnpm/bun** vorgenommen haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den unter
[Aktualisieren](/de/install/updating) beschriebenen Paketmanager-Ablauf.

## Verwendung

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` wird in `openclaw update` umgeschrieben (nützlich für Shells und
Startskripte).

## Optionen

| Flag                                             | Beschreibung                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Bei Paketmanager-Aktualisierungen mit Neustart wird vor dem erfolgreichen Abschluss des Befehls geprüft, ob der neu gestartete Dienst die erwartete Version meldet.                                                                                      |
| `--channel <stable\|extended-stable\|beta\|dev>` | Legt den Aktualisierungskanal fest und speichert ihn nach erfolgreicher Aktualisierung des Kerns dauerhaft. Extended-Stable ist nur für Paketinstallationen verfügbar.                                                                                                                                                                        |
| `--tag <dist-tag\|version\|spec>`                | Überschreibt das Paketziel nur für diese Aktualisierung. Kann nicht mit einem wirksamen `extended-stable`-Kanal kombiniert werden, da dessen verifiziertes exaktes Ziel obligatorisch ist. Bei anderen Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet; GitHub-/Git-Quellspezifikationen werden vor der gestuften globalen npm-Installation in ein temporäres Tarball gepackt. |
| `--dry-run`                                      | Zeigt die geplanten Aktionen (Kanal/Tag/Ziel/Neustartablauf) in einer Vorschau an, ohne die Konfiguration zu schreiben, etwas zu installieren, Plugins zu synchronisieren oder einen Neustart durchzuführen.                                                                                                                                     |
| `--json`                                         | Gibt maschinenlesbares `UpdateRunResult`-JSON aus. Enthält `postUpdate.plugins.warnings`, wenn ein verwaltetes Plugin repariert werden muss, Details zum Plugin-Fallback des Beta-Kanals und `postUpdate.plugins.integrityDrifts`, wenn bei der Synchronisierung nach der Aktualisierung eine Abweichung des npm-Plugin-Artefakts erkannt wird. |
| `--timeout <seconds>`                            | Zeitlimit pro Schritt. Standardwert `1800`.                                                                                                                                                                                                                                                                                                   |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen (beispielsweise die Bestätigung eines Downgrades).                                                                                                                                                                                                                                                     |
| `--acknowledge-clawhub-risk`                     | Erlaubt der Plugin-Synchronisierung nach der Aktualisierung, ohne interaktive Aufforderung trotz Vertrauenswarnungen für Community-Pakete von ClawHub fortzufahren. Ohne dieses Flag werden riskante Community-Versionen übersprungen und unverändert belassen, wenn OpenClaw keine Aufforderung anzeigen kann. Offizielle ClawHub-Pakete und gebündelte Plugin-Quellen umgehen diese Aufforderung.               |

Es gibt kein Flag `--verbose`. Verwenden Sie `--dry-run`, um die geplanten Aktionen anzuzeigen,
`--json` für maschinenlesbare Ergebnisse und `openclaw update status --json`
nur für Kanal und Verfügbarkeit. Die Ausführlichkeit der Gateway-Konsole (`--verbose`) und
die Protokollierungsstufe für Dateien (`logging.level: "debug"`/`"trace"`) sind unabhängige Einstellungen; siehe
[Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde Ausführungen von `openclaw update` deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder den Flake-Input für diese Installation; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades müssen bestätigt werden, da ältere Versionen die Konfiguration beschädigen können.
Wenn die Installation Sitzungen bereits zu SQLite migriert hat, stellen Sie archivierte Legacy-
Transkriptartefakte wieder her, bevor Sie eine ältere dateibasierte Version starten. Siehe
[Doctor: Downgrade nach der SQLite-Migration von Sitzungen](/de/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Zeigt den aktiven Aktualisierungskanal, Git-Tag/-Branch/-SHA (nur Quellcode-Checkouts)
und die Verfügbarkeit von Aktualisierungen an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Flag                  | Standardwert | Beschreibung                              |
| --------------------- | ------------ | ----------------------------------------- |
| `--json`              | `false`      | Gibt maschinenlesbares Status-JSON aus.   |
| `--timeout <seconds>` | `3`          | Zeitlimit für Prüfungen.                  |

Bei Extended-Stable-Paketinstallationen führt die Statusabfrage dieselbe öffentliche Auswahl
und exakte Paketverifizierung wie die Aktualisierung im Vordergrund aus. Sie kann
`ahead of extended-stable` melden, wenn die installierte Version neuer ist. JSON-Fehler
enthalten `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` oder `unsupported_git_channel`).

## `update repair`

Führt die Finalisierung der Aktualisierung erneut aus, nachdem das Kernpaket bereits geändert wurde, aber spätere
Reparaturarbeiten nicht ordnungsgemäß abgeschlossen wurden. Dies ist der unterstützte Wiederherstellungspfad, wenn
`openclaw update` das neue Kernpaket installiert hat, aber die anschließende Plugin-Synchronisierung,
die Metadaten verwalteter npm-Plugins, die Aktualisierung der Registry oder die Doctor-Reparatur nicht
konvergiert sind.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flag                                             | Beschreibung                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Speichert den Aktualisierungskanal des Kerns vor der Reparatur dauerhaft. Bei Extended-Stable verwenden geeignete offizielle npm-Plugins mit unbestimmter/standardmäßiger oder `latest`-Zielvorgabe exakt die installierte Kernversion als Ziel. Die Extended-Stable-Reparatur wird bei Git-Checkouts abgelehnt, ohne die Konfiguration zu ändern. |
| `--json`                                         | Gibt maschinenlesbares Finalisierungs-JSON aus.                                                                                                                                                                                                                             |
| `--timeout <seconds>`                            | Zeitlimit für Reparaturschritte. Standardwert `1800`.                                                                                                                                                                                                                       |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen.                                                                                                                                                                                                                                     |
| `--acknowledge-clawhub-risk`                     | Gleiches Verhalten wie bei `openclaw update`.                                                                                                                                                                                                                               |
| `--no-restart`                                   | Wird aus Gründen der Einheitlichkeit akzeptiert; die Reparatur startet das Gateway niemals neu.                                                                                                                                                                             |

`update repair` führt `openclaw doctor --fix` aus, lädt die reparierte Konfiguration und
die Installationsdatensätze neu, synchronisiert nachverfolgte Plugins für den aktiven Aktualisierungskanal, aktualisiert
verwaltete npm-Plugin-Installationen, repariert fehlende konfigurierte Plugin-Nutzdaten,
aktualisiert die Plugin-Registry und schreibt konvergierte Metadaten der Installationsdatensätze.
Es installiert kein neues Kernpaket und startet das Gateway nicht neu.

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das
Gateway anschließend neu gestartet werden soll (standardmäßig erfolgt ein Neustart). Wenn Sie `dev` ohne einen Git-
Checkout auswählen, wird angeboten, einen solchen zu erstellen.

| Flag                  | Standardwert | Beschreibung                           |
| --------------------- | ------------ | -------------------------------------- |
| `--timeout <seconds>` | `1800`       | Zeitlimit für jeden Aktualisierungsschritt. |

## Funktionsweise

Beim expliziten Wechseln von Kanälen (`--channel ...`) wird auch die Installationsmethode
entsprechend angepasst:

- `dev` -> stellt einen Git-Checkout sicher (standardmäßig `~/openclaw` oder
  `$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` gesetzt ist; kann mit
  `OPENCLAW_GIT_DIR` überschrieben werden), aktualisiert ihn und installiert die globale CLI aus diesem
  Checkout.
- `stable` -> installiert über npm unter Verwendung von `latest`.
- `extended-stable` -> löst den öffentlichen npm-Selektor `extended-stable` auf,
  verifiziert das exakt ausgewählte Paket und installiert diese exakte Version. Es
  greift nicht auf einen anderen Selektor zurück und wird für Git-Checkouts abgelehnt.
- `beta` -> bevorzugt den npm-Dist-Tag `beta` und greift auf `latest` zurück, wenn Beta
  fehlt oder älter als die aktuelle Stable-Version ist.

### Neustartübergabe

Die automatische Aktualisierungsfunktion des Gateway-Kerns startet, wenn sie über die Konfiguration aktiviert ist, den CLI-
Aktualisierungspfad außerhalb des aktiven Gateway-Anfragehandlers. Paketmanager-Aktualisierungen über die Steuerungsebene
`update.run` und überwachte Aktualisierungen von Git-Checkouts verwenden
dieselbe Übergabe an den verwalteten Dienst, statt den Paketbaum zu ersetzen oder
`dist/` innerhalb des aktiven Gateway-Prozesses neu zu erstellen: Das Gateway startet einen
abgekoppelten Hilfsprozess und wird beendet; dieser Hilfsprozess führt `openclaw update --yes --json`
außerhalb des Gateway-Prozessbaums aus. Wenn die Übergabe nicht verfügbar ist,
gibt `update.run` eine strukturierte Antwort mit dem sicheren Shell-Befehl zurück, der
manuell ausgeführt werden kann.

Gespeicherte Extended-Stable-Auswahlen erhalten beim Start schreibgeschützte Hinweise sowie alle 24 Stunden Aktualisierungshinweise, wenn `update.checkOnStart` aktiviert ist. Diese Prüfungen wenden niemals eine Aktualisierung an, starten keine Übergabe, starten den Gateway nicht neu, verwenden weder die Verzögerung bzw. den Jitter von Stable noch den Abfragezyklus von Beta. Explizite Aktualisierungen im Vordergrund, einfache Aktualisierungen im Vordergrund mit gespeichertem `update.channel: "extended-stable"`, Statusabfragen bei Bedarf und die zugehörige Übergabe des verwalteten Gateway werden weiterhin unterstützt.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und der Neustart aktiviert ist, beenden Aktualisierungen über den Paketmanager und aus Git-Checkouts den laufenden Dienst, bevor sie den Paketbaum ersetzen oder die Checkout-/Build-Ausgabe verändern. Anschließend aktualisiert das Aktualisierungsprogramm die Dienstmetadaten, startet den Dienst neu und überprüft den neu gestarteten Gateway, bevor es `Gateway: restarted and verified.` meldet. Aktualisierungen über den Paketmanager überprüfen zusätzlich, ob der neu gestartete Gateway die erwartete Paketversion meldet; Aktualisierungen aus Git-Checkouts überprüfen nach dem erneuten Build die Funktionsfähigkeit des Gateway und die Dienstbereitschaft.

Unter macOS überprüft die Prüfung nach der Aktualisierung außerdem, ob der LaunchAgent für das aktive Profil geladen/aktiv ist und der konfigurierte Loopback-Port ordnungsgemäß funktioniert. Wenn die plist installiert ist, aber nicht von launchd überwacht wird, bootstrapt OpenClaw den LaunchAgent automatisch neu und führt die Prüfungen auf Funktionsfähigkeit, Version und Kanalbereitschaft erneut aus (ein neuer Bootstrap lädt den `RunAtLoad`-Job direkt, sodass die Wiederherstellung den neu gestarteten Gateway nicht sofort mit `kickstart -k` neu startet). Wenn der Gateway weiterhin nicht funktionsfähig wird, wird der Befehl mit einem von null verschiedenen Status beendet und gibt den Pfad zum Neustartprotokoll sowie Anweisungen für Neustart, Neuinstallation und Paket-Rollback aus.

Wenn der Neustart nicht ausgeführt werden kann, gibt der Befehl `Gateway: restart skipped (...)` oder `Gateway: restart failed: ...` mit einem Hinweis auf den manuellen Befehl `openclaw gateway restart` aus. Mit `--no-restart` wird der Paketaustausch oder der erneute Git-Build weiterhin ausgeführt, der verwaltete Dienst wird jedoch weder beendet noch neu gestartet, sodass der laufende Gateway den alten Code weiterverwendet, bis Sie ihn manuell neu starten.

### Form der Control-Plane-Antwort

Wenn `update.run` bei einer Paketmanager-Installation oder einem überwachten Git-Checkout über die Control Plane des Gateway ausgeführt wird, meldet der Handler die Einleitung der Übergabe getrennt von der CLI-Aktualisierung, die nach dem Beenden des Gateway fortgesetzt wird:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` und
  `handoff.status: "started"`: Der Gateway hat die Übergabe des verwalteten Dienstes erstellt und seinen eigenen Neustart geplant, damit der abgekoppelte Helfer
  `openclaw update --yes --json` außerhalb des laufenden Dienstprozesses ausführen kann.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` und
  `handoff.status: "unavailable"`: OpenClaw konnte keine überwachende Dienstgrenze und dauerhafte Dienstidentität für eine sichere Übergabe finden (beispielsweise erfordert die systemd-Übergabe die Unit-Identität `OPENCLAW_SYSTEMD_UNIT`, nicht nur Umgebungsmerkmale eines systemd-Prozesses). Die Antwort enthält
  `handoff.command`, den Shell-Befehl, der außerhalb des Gateway ausgeführt werden soll.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Der Gateway hat versucht, die Übergabe zu erstellen, konnte den abgekoppelten Helfer jedoch nicht starten.

Die `sentinel`-Nutzlast wird geschrieben, bevor der Gateway beendet wird, und die CLI-Übergabe aktualisiert denselben Neustart-Sentinel, nachdem die Funktionsprüfungen nach dem Neustart des verwalteten Dienstes abgeschlossen sind. Während der Übergabe kann der Sentinel
`stats.reason: "restart-health-pending"` ohne erfolgreiche Fortsetzung enthalten; der neu gestartete Gateway fragt ihn regelmäßig ab und löst die Fortsetzung erst aus, nachdem die CLI die Funktionsfähigkeit des Dienstes überprüft und den Sentinel mit dem endgültigen `ok`-Ergebnis neu geschrieben hat.
`openclaw status` und `openclaw status --all` zeigen eine Zeile `Update restart`, solange dieser Sentinel aussteht oder fehlgeschlagen ist, und `update.status` aktualisiert den Sentinel und gibt seinen neuesten Stand zurück.

## Ablauf für Git-Checkouts

### Kanalauswahl

- `stable`: Checkt das neueste Tag ohne Beta-Kennzeichnung aus und führt anschließend Build und Doctor aus.
- `beta`: Bevorzugt das neueste `-beta`-Tag und greift auf das neueste Stable-Tag zurück, wenn Beta fehlt oder älter ist.
- `dev`: Checkt `main` aus und führt anschließend Fetch und Rebase aus.
- `extended-stable`: Wird für Git-Checkouts nicht unterstützt; der Checkout wird nicht verändert.

### Aktualisierungsschritte

<Steps>
  <Step title="Sauberen Arbeitsbaum überprüfen">
    Erfordert, dass keine nicht committeten Änderungen vorhanden sind.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur für Dev.
  </Step>
  <Step title="Vorab-Build (nur Dev)">
    Führt den TypeScript-Build in einem temporären Arbeitsbaum aus. Wenn der neueste Stand fehlschlägt, werden bis zu 10 Commits zurückgegangen, um den neuesten buildfähigen Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieser Vorabprüfung zusätzlich Lint auszuführen; Lint wird in einem eingeschränkten seriellen Modus ausgeführt, da Hosts für Benutzeraktualisierungen häufig kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase durchführen">
    Führt einen Rebase auf den ausgewählten Commit durch (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repositorys. Bei pnpm-Checkouts bootstrapt das Aktualisierungsprogramm `pnpm` bei Bedarf (zuerst über `corepack`, anschließend als Fallback über ein temporäres `npm install pnpm@11`), anstatt `npm run build` innerhalb eines pnpm-Workspace auszuführen. Wenn auch das Bootstrapping von pnpm fehlschlägt, beendet sich das Aktualisierungsprogramm frühzeitig mit einem paketmanagerspezifischen Fehler, anstatt im Checkout `npm run build` auszuführen.
  </Step>
  <Step title="Control UI erstellen">
    Erstellt den Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als abschließende Prüfung für eine sichere Aktualisierung ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

### Details zur Plugin-Synchronisierung

Im Beta-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der Standard-/Latest-Linie folgen, zuerst eine Plugin-Version mit `@beta`. Wenn für das Plugin keine Beta-Version vorhanden ist, greift OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück und meldet eine Warnung. Bei npm-Plugins greift OpenClaw auch dann zurück, wenn das Beta-Paket vorhanden ist, aber die Installationsvalidierung fehlschlägt. Diese Fallback-Warnungen führen nicht dazu, dass die Kernaktualisierung fehlschlägt. Exakte Versionen und explizite Tags werden niemals umgeschrieben.

<Warning>
Wenn eine exakt angeheftete Aktualisierung eines npm-Plugins ein Artefakt auflöst, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` die Aktualisierung dieses Plugin-Artefakts ab, anstatt es zu installieren. Installieren oder aktualisieren Sie das Plugin nur dann explizit neu, nachdem Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach der Aktualisierung, die auf ein verwaltetes Plugin beschränkt sind und die der Synchronisierungspfad umgehen kann (beispielsweise eine nicht erreichbare npm-Registry für ein nicht wesentliches Plugin), werden nach erfolgreichem Abschluss der Kernaktualisierung als Warnungen gemeldet. Das JSON-Ergebnis behält für die Aktualisierung auf oberster Ebene `status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen auf `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Ausnahmen im Aktualisierungsprogramm oder bei der Synchronisierung lassen das Aktualisierungsergebnis weiterhin fehlschlagen. Beheben Sie den Installations- oder Aktualisierungsfehler des Plugins und führen Sie anschließend `openclaw update repair` erneut aus.

Nach dem Synchronisierungsschritt für jedes einzelne Plugin führt `openclaw update` vor dem Neustart des Gateway einen obligatorischen Durchlauf zur **Konvergenz nach der Kernaktualisierung** aus: Dabei werden fehlende Nutzlasten konfigurierter Plugins repariert, jeder _aktive_ nachverfolgte Installationsdatensatz auf dem Datenträger validiert und statisch überprüft, ob dessen `package.json` geparst werden kann (und ob ein explizit deklariertes `main` vorhanden ist). Fehler aus diesem Durchlauf sowie ein ungültiger Konfigurations-Snapshot geben `postUpdate.plugins.status: "error"` zurück und setzen den `status` der Aktualisierung auf oberster Ebene auf `"error"`, sodass `openclaw update` mit einem von null verschiedenen Status beendet und der Gateway _nicht_ mit einem ungeprüften Plugin-Satz neu gestartet wird. Der Fehler enthält strukturierte Zeilen unter `postUpdate.plugins.warnings[].guidance`, die auf `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json` verweisen. Deaktivierte Plugin-Einträge und Datensätze, die keine mit einer vertrauenswürdigen Quelle verknüpften offiziellen Synchronisierungsziele sind, werden hier übersprungen (entsprechend der vom Test auf fehlende Nutzlasten verwendeten Richtlinie `skipDisabledPlugins`), sodass ein veralteter Datensatz eines deaktivierten Plugins eine ansonsten gültige Aktualisierung nicht blockieren kann.

Beim Start des aktualisierten Gateway werden Plugins ausschließlich überprüft: Beim Start werden keine Paketmanager ausgeführt und keine Abhängigkeitsbäume verändert. Neustarts über `update.run` des Paketmanagers werden an den CLI-Pfad für verwaltete Dienste übergeben, sodass der Paketaustausch außerhalb des alten Gateway-Prozesses erfolgt und die Funktionsprüfungen des Dienstes bestimmen, ob die Aktualisierung als abgeschlossen gemeldet werden kann.
</Note>

Nach erfolgreichem Abschluss einer Extended-Stable-Kernaktualisierung richten sich die Plugin-Integritätsprüfung und -Konvergenz nach der Kernaktualisierung für geeignete offizielle npm-Plugins nach der exakt installierten Kernversion. Bei Standard-/`latest`-Absicht fragt OpenClaw weder Plugin-`@extended-stable` ab noch greift es auf npm-`latest` zurück; stattdessen leitet es die Paketversion aus dem installierten Kern ab. Explizite Versions-Pins, explizite Tags außer `latest`, Drittanbieterpakete und Quellen außerhalb von npm behalten ihre bestehende Absicht bei.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf, bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix, überprüft dort den paketierten `dist`-Bestand und tauscht anschließend diesen sauberen Paketbaum in das tatsächliche globale Präfix ein. Wenn die Überprüfung fehlschlägt, werden Doctor nach der Aktualisierung, Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation und führt anschließend die Plugin-Synchronisierung, eine Aktualisierung der Vervollständigungen für Kernbefehle und die Neustartarbeiten aus. Dadurch bleiben paketierte Sidecars und kanaleigene Plugin-Datensätze mit dem installierten OpenClaw-Build synchron, während vollständige Neuaufbauten der Vervollständigungen für Plugin-Befehle expliziten Ausführungen von
`openclaw completion --write-state` vorbehalten bleiben.

## Verwandte Themen

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst die Aktualisierung auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
