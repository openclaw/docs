---
read_when:
    - Sie möchten einen Quellcode-Checkout sicher aktualisieren
    - Sie debuggen die Ausgabe oder Optionen von `openclaw update`
    - Sie müssen das Kurzschreibweisenverhalten von `--update` verstehen
summary: CLI-Referenz für `openclaw update` (weitgehend sichere Quellcodeaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-07-16T12:40:41Z"
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
| `--no-restart`                                   | Überspringt den Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung. Bei Paketmanager-Aktualisierungen mit Neustart wird geprüft, ob der neu gestartete Dienst die erwartete Version meldet, bevor der Befehl erfolgreich abgeschlossen wird.                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Legt den Aktualisierungskanal fest und speichert ihn nach erfolgreicher Aktualisierung des Kerns dauerhaft. Extended-stable ist nur für Pakete verfügbar.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Überschreibt das Paketziel nur für diese Aktualisierung. Dies kann nicht mit einem wirksamen `extended-stable`-Kanal kombiniert werden, dessen verifiziertes exaktes Ziel obligatorisch ist. Bei anderen Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet; GitHub-/Git-Quellspezifikationen werden vor der gestaffelten globalen npm-Installation in ein temporäres Tarball gepackt. |
| `--dry-run`                                      | Zeigt eine Vorschau der geplanten Aktionen (Kanal/Tag/Ziel/Neustartablauf), ohne die Konfiguration zu schreiben, etwas zu installieren, Plugins zu synchronisieren oder neu zu starten.                                                                                                                                                                                                                |
| `--json`                                         | Gibt maschinenlesbares `UpdateRunResult`-JSON aus. Enthält `postUpdate.plugins.warnings`, wenn ein verwaltetes Plugin repariert werden muss, Details zum Plugin-Fallback des Beta-Kanals sowie `postUpdate.plugins.integrityDrifts`, wenn während der Synchronisierung nach der Aktualisierung eine Abweichung beim npm-Plugin-Artefakt erkannt wird.                                                                 |
| `--timeout <seconds>`                            | Zeitüberschreitung pro Schritt. Standardwert: `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen (beispielsweise die Bestätigung eines Downgrades).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Ermöglicht der Plugin-Synchronisierung nach der Aktualisierung, Warnungen zur Vertrauenswürdigkeit von Community-Paketen auf ClawHub ohne interaktive Aufforderung zu übergehen. Ohne diese Option werden riskante Community-Releases übersprungen und unverändert belassen, wenn OpenClaw keine Aufforderung anzeigen kann. Offizielle ClawHub-Pakete und gebündelte Plugin-Quellen umgehen diese Aufforderung.                                                     |

Es gibt kein `--verbose`-Flag. Verwenden Sie `--dry-run`, um eine Vorschau der geplanten Aktionen anzuzeigen,
`--json` für maschinenlesbare Ergebnisse und `openclaw update status --json`
nur für Kanal und Verfügbarkeit. Die Ausführlichkeit der Gateway-Konsole (`--verbose`) und
die Protokollierungsstufe für Dateien (`logging.level: "debug"`/`"trace"`) sind unabhängige Einstellungen; siehe
[Gateway-Protokollierung](/de/gateway/logging).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind verändernde `openclaw update`-Ausführungen deaktiviert. Aktualisieren Sie stattdessen die Nix-Quelle oder die Flake-Eingabe für diese Installation; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` und `openclaw update --dry-run` bleiben schreibgeschützt.
</Note>

<Warning>
Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.
Wenn die Installation Sitzungen bereits zu SQLite migriert hat, stellen Sie archivierte ältere
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

| Flag                  | Standardwert | Beschreibung                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Gibt maschinenlesbares Status-JSON aus. |
| `--timeout <seconds>` | `3`     | Zeitüberschreitung für Prüfungen.                 |

Bei Extended-stable-Paketinstallationen führt der Status dieselbe öffentliche Auswahl
und exakte Paketverifizierung wie die Aktualisierung im Vordergrund durch. Er kann
`ahead of extended-stable` melden, wenn die installierte Version neuer ist. JSON-Fehler
enthalten `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` oder `unsupported_git_channel`).

## `update repair`

Führt den Abschluss der Aktualisierung erneut aus, nachdem das Kernpaket bereits geändert wurde, spätere
Reparaturarbeiten jedoch nicht ordnungsgemäß abgeschlossen wurden. Dies ist der unterstützte Wiederherstellungspfad, wenn
`openclaw update` das neue Kernpaket installiert hat, aber die anschließende Plugin-Synchronisierung,
die Metadaten verwalteter npm-Plugins, die Aktualisierung der Registry oder die Doctor-Reparatur nicht
konvergiert sind.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flag                                             | Beschreibung                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Speichert den Aktualisierungskanal des Kerns vor der Reparatur dauerhaft. Bei Extended-stable zielen geeignete offizielle npm-Plugins, die einer bloßen/standardmäßigen oder `latest`-Vorgabe folgen, auf die exakt installierte Kernversion. Die Extended-stable-Reparatur wird bei Git-Checkouts abgelehnt, ohne die Konfiguration zu ändern. |
| `--json`                                         | Gibt maschinenlesbares JSON zum Abschluss aus.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Zeitüberschreitung für Reparaturschritte. Standardwert: `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Überspringt Bestätigungsaufforderungen.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Gleiches Verhalten wie bei `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Wird aus Konsistenzgründen akzeptiert; die Reparatur startet das Gateway niemals neu.                                                                                                                                                                                                             |

`update repair` führt `openclaw doctor --fix` aus, lädt die reparierte Konfiguration und
die Installationsdatensätze neu, synchronisiert nachverfolgte Plugins für den aktiven Aktualisierungskanal, aktualisiert
verwaltete npm-Plugin-Installationen, repariert fehlende konfigurierte Plugin-Nutzdaten,
aktualisiert die Plugin-Registry und schreibt konvergierte Metadaten der Installationsdatensätze.
Es installiert kein neues Kernpaket und startet das Gateway nicht neu.

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das
Gateway anschließend neu gestartet werden soll (standardmäßig erfolgt ein Neustart). Wenn `dev` ohne einen Git-
Checkout ausgewählt wird, wird angeboten, einen zu erstellen.

| Flag                  | Standardwert | Beschreibung                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Zeitüberschreitung für jeden Aktualisierungsschritt. |

## Funktionsweise

Beim expliziten Wechseln von Kanälen (`--channel ...`) wird auch die Installationsmethode
entsprechend angepasst:

- `dev` -> stellt einen Git-Checkout sicher (standardmäßig `~/openclaw` oder
  `$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` festgelegt ist; Überschreibung mit
  `OPENCLAW_GIT_DIR`), aktualisiert ihn und installiert die globale CLI aus diesem
  Checkout.
- `stable` -> installiert aus npm unter Verwendung von `latest`.
- `extended-stable` -> löst den öffentlichen npm-Selektor `extended-stable` auf,
  verifiziert das exakt ausgewählte Paket und installiert genau diese Version. Es
  weicht nicht auf einen anderen Selektor aus und wird bei Git-Checkouts abgelehnt.
- `beta` -> bevorzugt das npm-Dist-Tag `beta` und weicht auf `latest` aus, wenn die Beta-Version
  fehlt oder älter als das aktuelle stabile Release ist.

### Übergabe beim Neustart

Die automatische Kernaktualisierung des Gateways (wenn über die Konfiguration aktiviert) startet den CLI-
Aktualisierungspfad außerhalb des Request-Handlers des laufenden Gateways. Paketmanager-Aktualisierungen der Steuerungsebene
mit `update.run` und überwachte Aktualisierungen von Git-Checkouts verwenden
dieselbe Übergabe an den verwalteten Dienst, anstatt den Paketbaum zu ersetzen oder
`dist/` innerhalb des laufenden Gateway-Prozesses neu zu erstellen: Das Gateway startet ein
abgekoppeltes Hilfsprogramm und beendet sich, woraufhin dieses Hilfsprogramm `openclaw update --yes --json`
außerhalb des Gateway-Prozessbaums ausführt. Wenn die Übergabe nicht verfügbar ist,
gibt `update.run` eine strukturierte Antwort mit dem sicheren Shell-Befehl zurück, der
manuell ausgeführt werden kann.

Gespeicherte Extended-Stable-Auswahlen erhalten schreibgeschützte Start- und 24-Stunden-Aktualisierungshinweise, wenn `update.checkOnStart` aktiviert ist. Diese Prüfungen wenden niemals eine Aktualisierung an, starten keine Übergabe, starten das Gateway nicht neu, verwenden keine Stable-Verzögerung bzw. keinen Stable-Jitter und verwenden nicht den Beta-Abfragezyklus. Explizite Vordergrundaktualisierungen, einfache Vordergrundaktualisierungen mit gespeichertem `update.channel: "extended-stable"`, Statusabfragen bei Bedarf und die zugehörige verwaltete Gateway-Übergabe werden weiterhin unterstützt.

Wenn ein lokaler verwalteter Gateway-Dienst installiert und der Neustart aktiviert ist, beenden Paketmanager- und Git-Checkout-Aktualisierungen den laufenden Dienst, bevor sie den Paketbaum ersetzen oder die Checkout-/Build-Ausgabe verändern. Anschließend aktualisiert das Aktualisierungsprogramm die Dienstmetadaten, startet den Dienst neu und überprüft das neu gestartete Gateway, bevor es `Gateway: restarted and verified.` meldet.
Paketmanager-Aktualisierungen überprüfen zusätzlich, ob das neu gestartete Gateway die erwartete Paketversion meldet; Git-Checkout-Aktualisierungen überprüfen nach dem erneuten Build den Zustand des Gateways und die Dienstbereitschaft.

Paketmanager-Aktualisierungen verwenden normalerweise weiterhin die im verwalteten Dienst erfasste Node-Binärdatei. Wenn diese Node-Version das Zielrelease nicht ausführen kann, die aktuelle CLI-Node-Version dazu jedoch in der Lage ist und nachgewiesen wurde, dass der Dienst zu dem zu aktualisierenden Paket gehört, verwendet eine Aktualisierung mit aktiviertem Neustart die aktuelle Node-Version für den Abschluss und schreibt die Dienstmetadaten auf diese Laufzeit um. `--no-restart` kann Dienstmetadaten nicht reparieren, daher wird bei derselben Laufzeitabweichung vor der Paketänderung abgebrochen.

Unter macOS überprüft die Prüfung nach der Aktualisierung außerdem, ob der LaunchAgent für das aktive Profil geladen/aktiv ist und der konfigurierte Loopback-Port fehlerfrei funktioniert. Wenn die plist installiert ist, aber nicht von launchd überwacht wird, bootstrappt OpenClaw den LaunchAgent automatisch neu und führt die Prüfungen auf Zustand, Version und Kanalbereitschaft erneut aus (ein frischer Bootstrap lädt den Auftrag `RunAtLoad` direkt, sodass die Wiederherstellung das neu gestartete Gateway nicht sofort `kickstart -k`). Wenn das Gateway weiterhin nicht fehlerfrei funktioniert, wird der Befehl mit einem von null verschiedenen Status beendet und gibt den Pfad zum Neustartprotokoll sowie Anweisungen für Neustart, Neuinstallation und Paket-Rollback aus.

Wenn der Neustart nicht ausgeführt werden kann, gibt der Befehl `Gateway: restart skipped (...)` oder `Gateway: restart failed: ...` mit einem Hinweis für ein manuelles `openclaw gateway restart` aus.
Mit `--no-restart` wird der Paketaustausch oder der erneute Git-Build weiterhin ausgeführt, der verwaltete Dienst wird jedoch weder beendet noch neu gestartet. Daher verwendet das laufende Gateway weiterhin den alten Code, bis Sie es manuell neu starten.

### Antwortformat der Steuerungsebene

Wenn `update.run` bei einer Paketmanager-Installation oder einem überwachten Git-Checkout über die Gateway-Steuerungsebene ausgeführt wird, meldet der Handler die Initiierung der Übergabe getrennt von der CLI-Aktualisierung, die nach dem Beenden des Gateways fortgesetzt wird:

- `ok: true`, `result.status: "skipped"`
  und `result.reason: "managed-service-handoff-started"` sowie
  `handoff.status: "started"`: Das Gateway hat die Übergabe des verwalteten Dienstes erstellt
  und seinen eigenen Neustart geplant, damit der entkoppelte Helfer
  `openclaw update --yes --json` außerhalb des laufenden Dienstprozesses ausführen kann.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` und
  `handoff.status: "unavailable"`: OpenClaw konnte keine überwachende
  Dienstgrenze und dauerhafte Dienstidentität für eine sichere Übergabe finden (für
  die systemd-Übergabe ist beispielsweise die Unit-Identität `OPENCLAW_SYSTEMD_UNIT`
  erforderlich, nicht nur im Prozessumfeld vorhandene systemd-Kennzeichnungen). Die Antwort enthält
  `handoff.command`, den Shell-Befehl, der außerhalb des Gateways ausgeführt werden muss.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Das Gateway
  hat versucht, die Übergabe zu erstellen, konnte den entkoppelten Helfer jedoch nicht starten.

Die Nutzlast `sentinel` wird geschrieben, bevor das Gateway beendet wird, und die CLI-Übergabe aktualisiert denselben Neustart-Sentinel, nachdem die Zustandsprüfungen nach dem Neustart des verwalteten Dienstes abgeschlossen sind. Während der Übergabe kann der Sentinel `stats.reason: "restart-health-pending"` ohne erfolgreiche Fortsetzung enthalten; das neu gestartete Gateway fragt ihn ab und löst die Fortsetzung erst aus, nachdem die CLI den Dienstzustand überprüft und den Sentinel mit dem endgültigen Ergebnis `ok` neu geschrieben hat.
`openclaw status` und `openclaw status --all` zeigen eine Zeile `Update restart` an, solange dieser Sentinel aussteht oder fehlgeschlagen ist, und `update.status` aktualisiert den Sentinel und gibt dessen neuesten Stand zurück.

## Ablauf für Git-Checkouts

### Kanalauswahl

- `stable`: Checkt das neueste Nicht-Beta-Tag aus und führt anschließend Build und Doctor aus.
- `beta`: Bevorzugt das neueste Tag `-beta` und greift auf das neueste Stable-Tag zurück,
  wenn die Beta-Version fehlt oder älter ist.
- `dev`: Checkt `main` aus und führt anschließend Abruf und Rebase aus.
- `extended-stable`: Wird für Git-Checkouts nicht unterstützt; der Checkout
  wird nicht verändert.

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
  <Step title="Build-Vorabprüfung (nur Dev)">
    Führt den TypeScript-Build in einem temporären Arbeitsbaum aus. Wenn der Branch-Kopf fehlschlägt, wird bis zu 10 Commits zurückgegangen, um den neuesten buildfähigen Commit zu finden. Setzen Sie `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, um während dieser Vorabprüfung zusätzlich Lint auszuführen; Lint wird in einem ressourcenschonenden seriellen Modus ausgeführt, da Hosts für Benutzeraktualisierungen häufig kleiner als CI-Runner sind.
  </Step>
  <Step title="Rebase ausführen">
    Führt ein Rebase auf den ausgewählten Commit aus (nur Dev).
  </Step>
  <Step title="Abhängigkeiten installieren">
    Verwendet den Paketmanager des Repositorys. Bei pnpm-Checkouts bootstrappt das Aktualisierungsprogramm `pnpm` bei Bedarf (zuerst über `corepack`, anschließend über einen temporären Fallback `npm install pnpm@11`), anstatt `npm run build` innerhalb eines pnpm-Workspace auszuführen. Wenn der pnpm-Bootstrap weiterhin fehlschlägt, bricht das Aktualisierungsprogramm frühzeitig mit einem paketmanagerspezifischen Fehler ab, anstatt `npm run build` im Checkout auszuprobieren.
  </Step>
  <Step title="Control UI erstellen">
    Erstellt das Gateway und die Control UI.
  </Step>
  <Step title="Doctor ausführen">
    `openclaw doctor` wird als abschließende Prüfung für eine sichere Aktualisierung ausgeführt.
  </Step>
  <Step title="Plugins synchronisieren">
    Synchronisiert Plugins mit dem aktiven Kanal. Dev verwendet gebündelte Plugins; Stable und Beta verwenden npm. Aktualisiert nachverfolgte Plugin-Installationen.
  </Step>
</Steps>

### Details zur Plugin-Synchronisierung

Im Beta-Kanal versuchen nachverfolgte npm- und ClawHub-Plugin-Installationen, die der Standard-/Latest-Linie folgen, zunächst ein Plugin-Release `@beta`. Wenn für das Plugin kein Beta-Release vorhanden ist, greift OpenClaw auf die erfasste Standard-/Latest-Spezifikation zurück und meldet eine Warnung. Bei npm-Plugins greift OpenClaw auch dann darauf zurück, wenn das Beta-Paket vorhanden ist, aber die Installationsvalidierung fehlschlägt. Diese Fallback-Warnungen lassen die Kernaktualisierung nicht fehlschlagen. Exakte Versionen und explizite Tags werden niemals umgeschrieben.

<Warning>
Wenn eine Aktualisierung eines exakt angehefteten npm-Plugins ein Artefakt auflöst, dessen Integrität vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` die Aktualisierung dieses Plugin-Artefakts ab, anstatt es zu installieren. Installieren oder aktualisieren Sie das Plugin erst dann explizit neu, nachdem Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.
</Warning>

<Note>
Fehler bei der Plugin-Synchronisierung nach der Aktualisierung, die auf ein verwaltetes Plugin beschränkt sind und die der Synchronisierungspfad umgehen kann (beispielsweise eine nicht erreichbare npm-Registry für ein nicht wesentliches Plugin), werden als Warnungen gemeldet, nachdem die Kernaktualisierung erfolgreich abgeschlossen wurde. Das JSON-Ergebnis behält auf oberster Ebene die Aktualisierung `status: "ok"` bei und meldet `postUpdate.plugins.status: "warning"` mit Hinweisen zu `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json`. Unerwartete Ausnahmen im Aktualisierungsprogramm oder bei der Synchronisierung lassen das Aktualisierungsergebnis weiterhin fehlschlagen. Beheben Sie den Installations- oder Aktualisierungsfehler des Plugins und führen Sie anschließend `openclaw update repair` erneut aus. Wenn ein Plugin durch eine fehlgeschlagene Aktualisierung unbrauchbar bleibt, deaktiviert OpenClaw dessen Laufzeiteintrag und setzt aktive Slots zurück, ohne die vom Operator verfasste Richtlinie `plugins.allow` oder `plugins.deny` zu ändern.

Nach dem Synchronisierungsschritt für die einzelnen Plugins führt `openclaw update` vor dem Neustart des Gateways einen obligatorischen Durchlauf zur **Konvergenz nach der Kernaktualisierung** aus: Fehlende konfigurierte Plugin-Nutzlasten werden repariert, jeder _aktive_ nachverfolgte Installationsdatensatz auf dem Datenträger wird validiert und es wird statisch überprüft, ob sein `package.json` geparst werden kann (und ob jedes explizit deklarierte `main` vorhanden ist). Fehler aus diesem Durchlauf sowie ein ungültiger Konfigurations-Snapshot geben `postUpdate.plugins.status: "error"` zurück und ändern die Aktualisierung `status` auf oberster Ebene in `"error"`. Dadurch wird `openclaw update` mit einem von null verschiedenen Status beendet und das Gateway wird _nicht_ mit einem ungeprüften Plugin-Satz neu gestartet. Der Fehler enthält strukturierte Zeilen `postUpdate.plugins.warnings[].guidance`, die auf `openclaw update repair` und `openclaw plugins inspect <id> --runtime --json` verweisen. Deaktivierte Plugin-Einträge und Datensätze, die keine mit vertrauenswürdigen Quellen verknüpften offiziellen Synchronisierungsziele sind, werden hier übersprungen (entsprechend der Richtlinie `skipDisabledPlugins`, die bei der Prüfung auf fehlende Nutzlasten verwendet wird), sodass ein veralteter Datensatz eines deaktivierten Plugins eine ansonsten gültige Aktualisierung nicht blockieren kann.

Wenn das aktualisierte Gateway startet, dient das Laden von Plugins ausschließlich der Überprüfung: Beim Start werden keine Paketmanager ausgeführt und keine Abhängigkeitsbäume verändert. Paketmanager-Neustarts über `update.run` werden an den CLI-Pfad für verwaltete Dienste übergeben, sodass der Paketaustausch außerhalb des alten Gateway-Prozesses erfolgt und die Dienstzustandsprüfungen darüber entscheiden, ob die Aktualisierung als abgeschlossen gemeldet werden kann.
</Note>

Nach einer erfolgreichen Extended-Stable-Kernaktualisierung zielen die Integritätsprüfung und Konvergenz der Plugins nach der Kernaktualisierung auf geeignete offizielle npm-Plugins mit exakt der installierten Kernversion. Bei der Absicht Standard/`latest` fragt OpenClaw weder Plugin-`@extended-stable` ab noch greift es auf npm-`latest` zurück; stattdessen leitet es die Paketversion vom installierten Kern ab. Explizite Versionsanheftungen, explizite Tags ungleich `latest`, Drittanbieterpakete und Nicht-npm-Quellen behalten ihre bestehende Absicht bei.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion auf, bevor der Paketmanager aufgerufen wird. Globale npm-Installationen verwenden eine gestufte Installation: OpenClaw installiert das neue Paket in einem temporären npm-Präfix, lässt das Kandidatenpaket während `preinstall` die Node-Version des Hosts validieren und überprüft dort das paketierte Inventar `dist`. Eine paketierte Abschlussprüfung bleibt außerhalb dieses Inventars, bis `preinstall` erfolgreich abgeschlossen wurde, sodass Paketmanager, die Lifecycle-Skripte überspringen, ebenfalls vor der Aktivierung abbrechen. Ab npm 12 genehmigt das Aktualisierungsprogramm ausschließlich den Lifecycle von OpenClaw im Kandidatenpaket; Skripte transitiver Abhängigkeiten bleiben blockiert. Anschließend tauscht OpenClaw den sauberen Paketbaum in das tatsächliche globale Präfix ein. Wenn die Überprüfung fehlschlägt, werden Doctor nach der Aktualisierung, Plugin-Synchronisierung und Neustartarbeiten nicht aus dem verdächtigen Baum ausgeführt. Selbst wenn die installierte Version bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation und führt anschließend die Plugin-Synchronisierung, eine Aktualisierung der Vervollständigung für Kernbefehle sowie Neustartarbeiten aus. Dadurch bleiben paketierte Sidecars und kanaleigene Plugin-Datensätze auf den installierten OpenClaw-Build abgestimmt, während vollständige Neuaufbauten der Vervollständigung für Plugin-Befehle expliziten Ausführungen von `openclaw completion --write-state` vorbehalten bleiben.

## Verwandte Themen

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst die Aktualisierung auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisierung](/de/install/updating)
- [CLI-Referenz](/de/cli)
