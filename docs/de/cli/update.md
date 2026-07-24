---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Kurzschreibweisenverhalten von `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellcodeaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-07-24T04:21:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aktualisieren Sie OpenClaw und wechseln Sie zwischen den Kanälen stable/extended-stable/beta/dev.

Wenn Sie die Installation über **npm/pnpm/bun** durchgeführt haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den unter
[Aktualisierung](/de/install/updating) beschriebenen Paketmanager-Ablauf.

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
| `--no-restart`                                   | Überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Bei Paketmanager-Aktualisierungen mit Neustart wird vor dem erfolgreichen Abschluss des Befehls geprüft, ob der neu gestartete Dienst die erwartete Version meldet.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Legt den Aktualisierungskanal fest und speichert ihn nach erfolgreicher Aktualisierung des Kerns dauerhaft. Extended-stable ist nur für Pakete verfügbar.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Überschreibt das Paketziel nur für diese Aktualisierung. Dies kann nicht mit einem wirksamen Kanal `extended-stable` kombiniert werden, dessen verifiziertes exaktes Ziel zwingend erforderlich ist. Bei anderen Paketinstallationen wird `main` `github:openclaw/openclaw#main` zugeordnet; GitHub-/Git-Quellspezifikationen werden vor der gestaffelten globalen npm-Installation in ein temporäres Tarball gepackt. |
| `--dry-run`                                      | Zeigt eine Vorschau der geplanten Aktionen (Kanal/Tag/Ziel/Neustartablauf) an, ohne die Konfiguration zu schreiben, etwas zu installieren, Plugins zu synchronisieren oder einen Neustart durchzuführen.                                                                                                                                                                                                                |
| `--json`                                         | Gibt maschinenlesbares `UpdateRunResult`-JSON aus. Enthält `postUpdate.plugins.warnings`, wenn ein verwaltetes Plugin repariert werden muss, Details zum Plugin-Fallback des Beta-Kanals sowie `postUpdate.plugins.integrityDrifts`, wenn während der Synchronisierung nach der Aktualisierung eine Abweichung bei npm-Plugin-Artefakten erkannt wird.                                                                 |
| `--timeout <seconds>`                            | Zeitüberschreitung pro Schritt. Standardwert: `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen (beispielsweise die Bestätigung einer Herabstufung).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Ermöglicht der Plugin-Synchronisierung nach der Aktualisierung, Vertrauenswarnungen der ClawHub-Community ohne interaktive Aufforderung zu übergehen. Ohne dieses Flag werden riskante Community-Versionen übersprungen und unverändert belassen, wenn OpenClaw keine Aufforderung anzeigen kann. Offizielle ClawHub-Pakete und gebündelte Plugin-Quellen umgehen diese Aufforderung.                                                     |

Es gibt kein Flag `--verbose`. Verwenden Sie `--dry-run` für eine Vorschau der geplanten Aktionen,
`--json` für maschinenlesbare Ergebnisse und `openclaw update status --json`
nur für Kanal und Verfügbarkeit. Die Ausführlichkeit der Gateway-Konsole (`--verbose`) und
die Protokollierungsstufe der Datei (`logging.level: "debug"`/`"trace"`) sind voneinander unabhängige Einstellungen; siehe
[Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde Ausführungen von `openclaw update` deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder die Flake-Eingabe für diese Installation; verwenden Sie für nix-openclaw den Agent-zentrierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Herabstufungen erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
Wenn die Installation Sitzungen bereits zu SQLite migriert hat, stellen Sie archivierte
Artefakte älterer Transkripte wieder her, bevor Sie eine ältere dateibasierte Version starten. Siehe
[Doctor: Herabstufung nach der SQLite-Migration von Sitzungen](/de/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Zeigt den aktiven Aktualisierungskanal, Git-Tag/-Branch/-SHA (nur Quellcode-Checkouts)
und die Verfügbarkeit von Aktualisierungen an.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Flag                  | Standard | Beschreibung                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Gibt maschinenlesbares Status-JSON aus. |
| `--timeout <seconds>` | `3`     | Zeitüberschreitung für Prüfungen.                 |

Bei extended-stable-Paketinstallationen führt der Status dieselbe öffentliche Auswahl
und Prüfung des exakten Pakets wie die Aktualisierung im Vordergrund durch. Er kann
`ahead of extended-stable` melden, wenn die installierte Version neuer ist. JSON-Fehler
enthalten `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` oder `unsupported_git_channel`).

## `update repair`

Führt den Abschluss der Aktualisierung erneut aus, nachdem das Kernpaket bereits geändert wurde, spätere
Reparaturarbeiten jedoch nicht ordnungsgemäß abgeschlossen wurden. Dies ist der unterstützte Wiederherstellungspfad, wenn
`openclaw update` das neue Kernpaket installiert hat, aber die Plugin-Synchronisierung nach der Kernaktualisierung,
die Metadaten verwalteter npm-Plugins, die Registry-Aktualisierung oder die Doctor-Reparatur nicht
konvergiert sind.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flag                                             | Beschreibung                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Speichert den Aktualisierungskanal des Kerns vor der Reparatur dauerhaft. Bei extended-stable zielen geeignete offizielle npm-Plugins, die der Absicht bare/default oder `latest` folgen, auf die exakt installierte Kernversion. Die Reparatur für extended-stable wird bei Git-Checkouts abgelehnt, ohne die Konfiguration zu ändern. |
| `--json`                                         | Gibt maschinenlesbares JSON zum Abschluss aus.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Zeitüberschreitung für Reparaturschritte. Standardwert: `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Gleiches Verhalten wie bei `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Wird zur Wahrung der Parität akzeptiert; die Reparatur startet das Gateway niemals neu.                                                                                                                                                                                                             |

`update repair` führt `openclaw doctor --fix` aus, lädt die reparierte Konfiguration und
die Installationsdatensätze neu, synchronisiert nachverfolgte Plugins für den aktiven Aktualisierungskanal, aktualisiert
verwaltete npm-Plugin-Installationen, repariert fehlende konfigurierte Plugin-Nutzlasten,
aktualisiert die Plugin-Registry und schreibt konvergierte Metadaten der Installationsdatensätze.
Es installiert kein neues Kernpaket und startet das Gateway nicht neu.

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das
Gateway anschließend neu gestartet werden soll (standardmäßig erfolgt ein Neustart). Bei Auswahl von `dev` ohne Git-
Checkout wird angeboten, einen zu erstellen.

| Flag                  | Standard | Beschreibung                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Zeitüberschreitung für jeden Aktualisierungsschritt. |

## Funktionsweise

Durch einen expliziten Kanalwechsel (`--channel ...`) wird auch die Installationsmethode
entsprechend angepasst:

- `dev` -> stellt einen Git-Checkout sicher (standardmäßig `~/openclaw` oder
  `$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` festgelegt ist; kann mit
  `OPENCLAW_GIT_DIR` überschrieben werden), aktualisiert ihn und installiert die globale CLI aus diesem
  Checkout.
- `stable` -> installiert aus npm unter Verwendung von `latest`.
- `extended-stable` -> löst den öffentlichen npm-Selektor `extended-stable` auf,
  verifiziert das exakt ausgewählte Paket und installiert diese exakte Version. Es
  weicht nicht auf einen anderen Selektor aus und wird für Git-Checkouts abgelehnt.
- `beta` -> bevorzugt das npm-Dist-Tag `beta` und weicht auf `latest` aus, wenn die Beta-Version
  fehlt oder älter als die aktuelle stabile Version ist.

### Neustartübergabe

Der automatische Aktualisierer des Gateway-Kerns (wenn über die Konfiguration aktiviert) startet den CLI-
Aktualisierungspfad außerhalb des aktiven Gateway-Anfrage-Handlers. Paketmanager-Aktualisierungen der Steuerungsebene
`update.run` und beaufsichtigte Aktualisierungen von Git-Checkouts verwenden
dieselbe Übergabe an den verwalteten Dienst, anstatt den Paketbaum zu ersetzen oder
`dist/` innerhalb des aktiven Gateway-Prozesses neu zu erstellen: Das Gateway startet einen
abgekoppelten Hilfsprozess und wird beendet; dieser Hilfsprozess führt `openclaw update --yes --json`
außerhalb des Gateway-Prozessbaums aus. Wenn die Übergabe nicht verfügbar ist,
gibt `update.run` eine strukturierte Antwort mit dem sicheren Shell-Befehl zurück, der
manuell ausgeführt werden kann.

Gespeicherte Extended-Stable-Auswahlen erhalten beim Start schreibgeschützte Hinweise sowie
24-stündige Aktualisierungshinweise, wenn `update.checkOnStart` aktiviert ist. Diese Prüfungen wenden niemals eine Aktualisierung an,
starten keine Übergabe, starten das Gateway nicht neu, verwenden weder Stable-Verzögerung/Jitter noch den
Beta-Abfragezyklus. Explizite Aktualisierungen im Vordergrund, einfache Aktualisierungen im Vordergrund mit
gespeichertem `update.channel: "extended-stable"`, Statusabfragen bei Bedarf und deren verwaltete
Gateway-Übergabe werden weiterhin unterstützt.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und der Neustart aktiviert ist,
stoppen Aktualisierungen über den Paketmanager und Git-Checkout-Aktualisierungen den laufenden Dienst, bevor
sie den Paketbaum ersetzen oder die Checkout-/Build-Ausgabe verändern. Das Aktualisierungsprogramm
aktualisiert anschließend die Dienstmetadaten, startet den Dienst neu und überprüft das
neu gestartete Gateway, bevor es `Gateway: restarted and verified.` meldet.
Paketmanager-Aktualisierungen überprüfen zusätzlich, dass das neu gestartete Gateway die
erwartete Paketversion meldet; Git-Checkout-Aktualisierungen überprüfen nach dem erneuten Build
den Zustand des Gateways und die Dienstbereitschaft.

Paketmanager-Aktualisierungen verwenden normalerweise weiterhin die im
verwalteten Dienst hinterlegte Node-Binärdatei. Wenn diese Node-Version das Ziel-Release nicht ausführen kann, die aktuelle
CLI-Node-Version dies jedoch kann und nachgewiesen ist, dass der Dienst zu dem aktualisierten Paket gehört,
verwendet eine Aktualisierung mit aktiviertem Neustart die aktuelle Node-Version für den Abschluss und schreibt
die Dienstmetadaten auf diese Laufzeit um. `--no-restart` kann Dienstmetadaten
nicht reparieren, daher wird dieselbe Laufzeitinkompatibilität vor der Paketänderung abgebrochen.

Unter macOS überprüft die Prüfung nach der Aktualisierung außerdem, ob der LaunchAgent
für das aktive Profil geladen/ausgeführt wird und der konfigurierte Loopback-Port
funktionsfähig ist. Wenn die plist installiert ist, aber nicht von launchd überwacht wird, führt OpenClaw
automatisch ein erneutes Bootstrap des LaunchAgent durch und wiederholt die Zustands-/Versions-/
Kanalbereitschaftsprüfungen (ein frisches Bootstrap lädt den Auftrag `RunAtLoad` direkt,
sodass die Wiederherstellung das neu gestartete Gateway nicht sofort `kickstart -k`). Wenn
das Gateway weiterhin nicht funktionsfähig wird, wird der Befehl mit einem von null verschiedenen Status beendet und
gibt den Pfad zum Neustartprotokoll sowie Anweisungen zum Neustart, zur Neuinstallation und zum Paket-Rollback
aus.

Wenn der Neustart nicht ausgeführt werden kann, gibt der Befehl `Gateway: restart skipped (...)` oder
`Gateway: restart failed: ...` mit einem manuellen Hinweis zu `openclaw gateway restart` aus.
Mit `--no-restart` wird der Paketersatz oder der erneute Git-Build weiterhin ausgeführt, aber der
verwaltete Dienst wird weder gestoppt noch neu gestartet, sodass das laufende Gateway den alten
Code behält, bis Sie es manuell neu starten.

### Antwortformat der Steuerungsebene

Wenn `update.run` über die Gateway-Steuerungsebene bei einer Paketmanager-
Installation oder einem überwachten Git-Checkout ausgeführt wird, meldet der Handler die Initiierung der Übergabe
getrennt von der CLI-Aktualisierung, die nach dem Beenden des Gateways fortgesetzt wird:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` und
  `handoff.status: "started"`: Das Gateway hat die Übergabe des verwalteten Dienstes erstellt
  und seinen eigenen Neustart geplant, damit das abgekoppelte Hilfsprogramm
  `openclaw update --yes --json` außerhalb des laufenden Dienstprozesses ausführen kann.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` und
  `handoff.status: "unavailable"`: OpenClaw konnte keine überwachende
  Dienstgrenze und dauerhafte Dienstidentität für eine sichere Übergabe finden (zum
  Beispiel erfordert eine systemd-Übergabe die Unit-Identität `OPENCLAW_SYSTEMD_UNIT`,
  nicht nur systemd-Prozessmarkierungen aus der Umgebung). Die Antwort enthält
  `handoff.command`, den Shell-Befehl, der außerhalb des Gateways ausgeführt werden soll.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Das Gateway
  hat versucht, die Übergabe zu erstellen, konnte das abgekoppelte Hilfsprogramm jedoch nicht starten.

Die Nutzlast `sentinel` wird geschrieben, bevor das Gateway beendet wird, und die CLI-
Übergabe aktualisiert denselben Neustart-Sentinel, nachdem die Zustandsprüfungen nach dem Neustart
des verwalteten Dienstes abgeschlossen sind. Während der Übergabe kann der Sentinel
`stats.reason: "restart-health-pending"` ohne Erfolgsfortsetzung enthalten; das
neu gestartete Gateway fragt ihn ab und löst die Fortsetzung erst aus, nachdem die CLI
den Dienstzustand überprüft und den Sentinel mit dem endgültigen Ergebnis `ok` neu geschrieben hat.
`openclaw status` und `openclaw status --all` zeigen eine Zeile `Update restart`,
während dieser Sentinel aussteht oder fehlgeschlagen ist, und `update.status` aktualisiert und
gibt den neuesten Sentinel zurück.

## Git-Checkout-Ablauf

### Kanalauswahl

- `stable`: Checkt den neuesten Nicht-Beta-Tag aus und führt anschließend Build und Doctor aus.
- `beta`: Bevorzugt den neuesten Tag `-beta` und greift auf den neuesten Stable-Tag zurück,
  wenn Beta fehlt oder älter ist.
- `dev`: Checkt `main` aus und führt anschließend Fetch und Rebase aus.
- `extended-stable`: Für Git-Checkouts nicht unterstützt; es erfolgt keine Änderung
  des Checkouts.

### Aktualisierungsschritte

<Steps>
  <Step title="Sauberen Arbeitsbaum überprüfen">
    Erfordert, dass keine nicht committeten Änderungen vorhanden sind.
  </Step>
  <Step title="Kanal wechseln">
    Wechselt zum ausgewählten Kanal (Tag oder Branch).
  </Step>
  <Step title="Upstream abrufen">
    Nur Dev.
  </Step>
  <Step title="Vorab-Build (nur Dev)">
    Führt den TypeScript-Build in einem temporären Arbeitsbaum aus. Wenn der aktuelle Stand fehlschlägt, werden bis zu 10 Commits zurückgegangen, um den neuesten buildfähigen Commit zu finden. Legen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` fest, um während dieser Vorabprüfung zusätzlich Lint auszuführen; Lint läuft in einem eingeschränkten seriellen Modus, da Benutzerhosts für Aktualisierungen häufig kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase durchführen">
    Führt einen Rebase auf den ausgewählten Commit durch (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repositorys. Bei pnpm-Checkouts führt das Aktualisierungsprogramm bei Bedarf ein Bootstrap von `pnpm` durch (zuerst über `corepack`, danach über eine temporäre Alternative `npm install pnpm@11`), anstatt `npm run build` innerhalb eines pnpm-Arbeitsbereichs auszuführen. Wenn das pnpm-Bootstrap weiterhin fehlschlägt, bricht das Aktualisierungsprogramm frühzeitig mit einem paketmanagerspezifischen Fehler ab, anstatt `npm run build` im Checkout zu versuchen.
  </Step>
  <Step title="Control UI erstellen">
    Erstellt das Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als abschließende Prüfung für sichere Aktualisierungen ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

### Details zur Plugin-Synchronisierung

Im Beta-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der
Standard-/Latest-Linie folgen, zunächst ein Plugin-Release `@beta`. Wenn das Plugin kein
Beta-Release besitzt, greift OpenClaw auf die aufgezeichnete Standard-/Latest-Spezifikation zurück und
meldet eine Warnung. Bei npm-Plugins greift OpenClaw auch zurück, wenn das Beta-
Paket vorhanden ist, aber die Installationsvalidierung fehlschlägt. Diese Rückfallwarnungen führen nicht
zum Fehlschlagen der Core-Aktualisierung. Exakte Versionen und explizite Tags werden niemals umgeschrieben.

<Warning>
Wenn eine exakt angeheftete npm-Plugin-Aktualisierung ein Artefakt ergibt, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` die Aktualisierung dieses Plugin-Artefakts ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann ausdrücklich neu, nachdem Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach der Aktualisierung, die auf ein verwaltetes Plugin beschränkt sind und die der Synchronisierungspfad umgehen kann (zum Beispiel eine nicht erreichbare npm-Registry für ein nicht wesentliches Plugin), werden als Warnungen gemeldet, nachdem die Core-Aktualisierung erfolgreich war. Das JSON-Ergebnis behält die Aktualisierung `status: "ok"` auf oberster Ebene bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Ausnahmen des Aktualisierungsprogramms oder der Synchronisierung lassen das Aktualisierungsergebnis weiterhin fehlschlagen. Beheben Sie den Installations- oder Aktualisierungsfehler des Plugins und führen Sie anschließend `openclaw update repair` erneut aus. Wenn eine fehlgeschlagene Aktualisierung ein verwaltetes Plugin unbrauchbar macht, deaktiviert OpenClaw dessen Laufzeiteintrag und setzt aktive Slots zurück, ohne die vom Betreiber erstellte Richtlinie `plugins.allow` oder `plugins.deny` zu ändern.

Nach dem Synchronisierungsschritt für jedes Plugin führt `openclaw update` vor dem Neustart des Gateways einen obligatorischen Durchlauf zur **Konvergenz nach der Core-Aktualisierung** aus: Er repariert fehlende konfigurierte Plugin-Nutzlasten, validiert jeden _aktiven_ nachverfolgten Installationsdatensatz auf dem Datenträger und überprüft statisch, ob dessen `package.json` geparst werden kann (und ob jede explizit deklarierte `main` vorhanden ist). Fehler dieses Durchlaufs sowie ein ungültiger Konfigurations-Snapshot geben `postUpdate.plugins.status: "error"` zurück und setzen die Aktualisierung `status` auf oberster Ebene auf `"error"`, sodass `openclaw update` mit einem von null verschiedenen Status beendet und das Gateway _nicht_ mit einem ungeprüften Plugin-Satz neu gestartet wird. Der Fehler enthält strukturierte Zeilen `postUpdate.plugins.warnings[].guidance`, die auf `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json` verweisen. Deaktivierte Plugin-Einträge und Datensätze, die keine mit einer vertrauenswürdigen Quelle verknüpften offiziellen Synchronisierungsziele sind, werden hier übersprungen (entsprechend der Richtlinie `skipDisabledPlugins`, die bei der Prüfung auf fehlende Nutzlasten verwendet wird), sodass ein veralteter deaktivierter Plugin-Datensatz eine ansonsten gültige Aktualisierung nicht blockieren kann.

Wenn das aktualisierte Gateway startet, erfolgt das Laden der Plugins ausschließlich zur Überprüfung: Beim Start werden keine Paketmanager ausgeführt und keine Abhängigkeitsbäume verändert. Paketmanager-Neustarts über `update.run` werden an den verwalteten Dienstpfad der CLI übergeben, sodass der Paketaustausch außerhalb des alten Gateway-Prozesses erfolgt und die Dienstzustandsprüfungen entscheiden, ob die Aktualisierung als abgeschlossen gemeldet werden kann.
</Note>

Nach dem erfolgreichen Abschluss einer Extended-Stable-Core-Aktualisierung zielen die Integritäts- und
Konvergenzprüfungen der Plugins nach der Core-Aktualisierung auf geeignete offizielle npm-Plugins mit exakt der installierten Core-
Version. Bei Standard-/`latest`-Absicht fragt OpenClaw keine Plugin-
`@extended-stable` ab und greift nicht auf npm-`latest` zurück; die Paketversion
wird aus dem installierten Core abgeleitet. Explizite Versions-Pins, explizite Tags, die nicht `latest` sind,
Drittanbieterpakete und Nicht-npm-Quellen behalten ihre bestehende Absicht bei.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf,
bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte
Installation: OpenClaw installiert das neue Paket in ein temporäres npm-Präfix,
lässt das Kandidatenpaket während `preinstall` die Node-Version des Hosts validieren
und überprüft dort das paketierte Inventar `dist`. Eine paketierte Abschlussprüfung
bleibt außerhalb dieses Inventars, bis `preinstall` erfolgreich ist, sodass Paketmanager,
die Lebenszyklusskripte überspringen, ebenfalls vor der Aktivierung anhalten. Bei npm 12 und neuer
genehmigt das Aktualisierungsprogramm nur den OpenClaw-Lebenszyklus des Kandidaten; Skripte
transitiver Abhängigkeiten bleiben blockiert. OpenClaw tauscht anschließend den sauberen Paketbaum
in das tatsächliche globale Präfix ein. Wenn die Überprüfung fehlschlägt, werden Doctor nach der Aktualisierung, Plugin-
Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die
installierte Version bereits mit dem Ziel übereinstimmt, aktualisiert der Befehl die
globale Paketinstallation und führt anschließend die Plugin-Synchronisierung, eine Aktualisierung der Core-Befehlsvervollständigung
und die Neustartarbeiten aus. Dadurch bleiben paketierte Sidecars und kanaleigene
Plugin-Datensätze auf den installierten OpenClaw-Build abgestimmt, während vollständige
Neuaufbauten der Plugin-Befehlsvervollständigung expliziten Ausführungen von
`openclaw completion --write-state` vorbehalten bleiben.

## Verwandte Themen

- `openclaw doctor` (bietet an, bei Git-Checkouts zuerst die Aktualisierung auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
