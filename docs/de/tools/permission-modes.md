---
read_when:
    - Auswahl von „auto“, „ask“, „allowlist“, „full“ oder „deny“ für Befehlsberechtigungen
    - Konfigurieren von durch Codex Guardian geprüften Genehmigungen über tools.exec.mode
    - Vergleich der OpenClaw-Ausführungsgenehmigungen mit den ACPX-Harness-Berechtigungen
summary: Berechtigungsmodi für die Befehlsausführung auf dem Host, Codex-Guardian-Genehmigungen und ACPX-Harness-Sitzungen
title: Berechtigungsmodi
x-i18n:
    generated_at: "2026-07-12T02:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Berechtigungsmodi bestimmen, über welche Befugnisse ein Agent verfügt, bevor er Befehle auf dem Host ausführt, Dateien schreibt oder ein Backend-Harness um zusätzlichen Zugriff bittet.

<Note>
  Der Berechtigungsmodus ist unabhängig von `tools.exec.host=auto`. `tools.exec.host`
  bestimmt, wo ein Befehl ausgeführt wird. `tools.exec.mode` bestimmt, wie die
  Ausführung auf dem Host genehmigt wird.
</Note>

## Empfohlene Standardeinstellung

Verwenden Sie `auto` für Coding-Agenten, die sinnvollen Hostzugriff benötigen, ohne dass jeder nicht abgedeckte Befehl eine Rückfrage an einen Menschen auslöst:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Überprüfen Sie anschließend die wirksame Richtlinie:

```bash
openclaw exec-policy show
```

## OpenClaw-Modi für die Ausführung auf dem Host

`tools.exec.mode` ist die normalisierte Richtlinienoberfläche für `exec` auf dem Host. Jeder Modus wird auf ein zugrunde liegendes Paar aus `security` (Strenge der Positivliste) und `ask` (Rückfrage bei nicht abgedeckten Befehlen) abgebildet:

| Modus       | security / ask          | Verhalten                                                                                                              | Verwenden, wenn                                                    |
| ----------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `deny`      | `deny` / `off`          | Die Ausführung auf dem Host vollständig blockieren.                                                                    | Keine Hostbefehle zulässig sind.                                   |
| `allowlist` | `allowlist` / `off`     | Nur Befehle aus der Positivliste ausführen; nicht abgedeckte Befehle ohne Rückfrage ablehnen.                          | Sie über eine bekanntermaßen sichere Befehlsmenge verfügen.        |
| `ask`       | `allowlist` / `on-miss` | Übereinstimmungen mit der Positivliste ausführen; bei nicht abgedeckten Befehlen einen Menschen fragen.                | Ein Mensch jeden neuen Befehl prüfen soll.                         |
| `auto`      | `allowlist` / `on-miss` | Übereinstimmungen mit der Positivliste ausführen; andere Befehle automatisch prüfen und sonst einen Menschen fragen.   | Coding-Sitzungen praktikablen, abgesicherten Zugriff benötigen.    |
| `full`      | `full` / `off`          | Befehle auf dem Host ohne Rückfragen ausführen.                                                                         | Dieser vertrauenswürdige Host bzw. diese Sitzung Genehmigungen überspringen soll. |

`ask` und `auto` verwenden dieselben Einstellungen für Positivliste und Rückfragen; `auto` aktiviert zusätzlich die native automatische Prüfung, die nicht abgedeckte Befehle selbst bewertet und sie nur dann an den konfigurierten menschlichen Genehmigungsweg weiterleitet, wenn sie keine sichere Genehmigung erteilen kann.

Die vollständige Richtlinie für die Ausführung auf dem Host, die lokale Genehmigungsdatei, das Positivlistenschema, sichere Programme und das Weiterleitungsverhalten finden Sie unter [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Zuordnung für Codex Guardian

Bei nativen Codex-App-Server-Sitzungen führt `tools.exec.mode: "auto"` Codex zu von Guardian geprüften Genehmigungen, sofern die lokalen Codex-Anforderungen dies zulassen. Typische resultierende Werte:

| Codex-Feld          | Typischer Wert    |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Der Modus `auto` erzwingt diese Richtlinie gegenüber allen konfigurierten Codex-Überschreibungen für Sandbox und Genehmigungen. Daher bleiben veraltete unsichere Kombinationen wie `approvalPolicy: "never"` mit `sandbox: "danger-full-access"` nicht erhalten. `tools.exec.mode: "deny"` und `"allowlist"` blockieren die lokale Ausführung über den Codex-App-Server vollständig. Verwenden Sie `tools.exec.mode: "full"` nur, wenn Sie ausdrücklich ohne Genehmigungen arbeiten möchten.

Informationen zur Einrichtung des App-Servers, zur Authentifizierungsreihenfolge und zu Details der nativen Codex-Laufzeit finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

## ACPX-Harness-Berechtigungen

ACPX-Sitzungen sind nicht interaktiv und können daher keine TTY-Berechtigungsabfrage anklicken. ACPX verwendet separate Einstellungen auf Harness-Ebene unter `plugins.entries.acpx.config`:

| Einstellung                  | Werte           | Bedeutung                                                      |
| ---------------------------- | --------------- | -------------------------------------------------------------- |
| `permissionMode`             | `approve-reads` | Nur Lesezugriffe automatisch genehmigen.                       |
| `permissionMode`             | `approve-all`   | Schreibzugriffe und Shell-Befehle automatisch genehmigen.      |
| `permissionMode`             | `deny-all`      | Alle Berechtigungsabfragen ablehnen.                            |
| `nonInteractivePermissions`  | `fail`          | Abbrechen, wenn eine Rückfrage erforderlich wäre.               |
| `nonInteractivePermissions`  | `deny`          | Die Rückfrage ablehnen und nach Möglichkeit fortfahren.         |

Legen Sie ACPX-Berechtigungen getrennt von den OpenClaw-Ausführungsgenehmigungen fest:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Verwenden Sie `approve-all` als ACPX-Notfalläquivalent für eine Harness-Sitzung ohne Rückfragen. Details zur Einrichtung und zu Fehlermodi finden Sie unter [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration).

## Modus auswählen

| Ziel                                                     | Konfiguration                                                |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Hostbefehle vollständig blockieren                       | `tools.exec.mode: "deny"`                                    |
| Nur bekanntermaßen sichere Befehle ausführen lassen      | `tools.exec.mode: "allowlist"`                               |
| Bei jedem neuen Befehl einen Menschen fragen             | `tools.exec.mode: "ask"`                                     |
| Automatische Codex-/OpenClaw-Prüfung vor Menschen nutzen | `tools.exec.mode: "auto"`                                    |
| Genehmigungen für die Hostausführung vollständig umgehen | `tools.exec.mode: "full"` plus passende Host-Genehmigungsdatei |
| Nicht interaktive ACPX-Sitzungen schreiben/ausführen lassen | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Wenn ein Befehl nach dem Ändern des Modus weiterhin eine Rückfrage auslöst oder fehlschlägt, prüfen Sie beide Ebenen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Für die Ausführung auf dem Host gilt das strengere Ergebnis aus der OpenClaw-Konfiguration und der lokalen Genehmigungsdatei des Hosts. ACPX-Harness-Berechtigungen lockern die Genehmigungen für die Hostausführung nicht, und Genehmigungen für die Hostausführung lockern die ACPX-Harness-Rückfragen nicht.

## Verwandte Themen

- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- [Ausführungsgenehmigungen – erweitert](/de/tools/exec-approvals-advanced)
- [Codex-Harness](/de/plugins/codex-harness)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration)
