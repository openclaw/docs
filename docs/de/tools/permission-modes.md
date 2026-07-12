---
read_when:
    - Auswahl von auto, ask, allowlist, full oder deny für Befehlsberechtigungen
    - Konfigurieren von durch Codex Guardian geprüften Genehmigungen über tools.exec.mode
    - Vergleich der OpenClaw-Ausführungsgenehmigungen mit den ACPX-Harness-Berechtigungen
summary: Berechtigungsmodi für die Host-Ausführung, Codex-Guardian-Genehmigungen und ACPX-Harness-Sitzungen
title: Berechtigungsmodi
x-i18n:
    generated_at: "2026-07-12T16:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Berechtigungsmodi bestimmen, über wie viele Befugnisse ein Agent verfügt, bevor er Host-Befehle ausführt, Dateien schreibt oder ein Backend-Harness um zusätzlichen Zugriff bittet.

<Note>
  Der Berechtigungsmodus ist von `tools.exec.host=auto` getrennt. `tools.exec.host`
  bestimmt, wo ein Befehl ausgeführt wird. `tools.exec.mode` bestimmt, wie Host-Exec
  genehmigt wird.
</Note>

## Empfohlene Standardeinstellung

Verwenden Sie `auto` für Coding-Agenten, die nützlichen Host-Zugriff benötigen, ohne dass jeder Treffer außerhalb der Positivliste eine menschliche Rückfrage auslöst:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Überprüfen Sie anschließend die wirksame Richtlinie:

```bash
openclaw exec-policy show
```

## OpenClaw-Modi für Host-Exec

`tools.exec.mode` ist die normalisierte Richtlinienoberfläche für Host-`exec`. Jeder Modus wird auf ein zugrunde liegendes Paar aus `security` (Strenge der Positivliste) und `ask` (Rückfrage bei fehlendem Treffer) abgebildet:

| Modus       | security / ask          | Verhalten                                                                                                      | Verwenden, wenn                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Host-Exec vollständig blockieren.                                                                              | Keine Host-Befehle zulässig sind.                              |
| `allowlist` | `allowlist` / `off`     | Nur Befehle aus der Positivliste ausführen; fehlende Treffer ohne Rückfrage ablehnen.                           | Sie über eine bekanntermaßen sichere Befehlsmenge verfügen.    |
| `ask`       | `allowlist` / `on-miss` | Treffer der Positivliste ausführen; bei fehlenden Treffern einen Menschen fragen.                               | Ein Mensch jeden neuen Befehl prüfen soll.                     |
| `auto`      | `allowlist` / `on-miss` | Treffer der Positivliste ausführen; fehlende Treffer automatisch prüfen und andernfalls menschlich genehmigen. | Coding-Sitzungen einen praktikablen, geschützten Zugriff benötigen. |
| `full`      | `full` / `off`          | Host-Exec ohne Rückfragen ausführen.                                                                            | Dieser vertrauenswürdige Host bzw. diese Sitzung Genehmigungsschranken überspringen soll. |

`ask` und `auto` verwenden dieselben Einstellungen für Positivliste und Rückfragen; `auto` aktiviert zusätzlich den nativen automatischen Prüfer, der fehlende Treffer selbst beurteilt und nur dann an den konfigurierten menschlichen Genehmigungsweg weiterleitet, wenn er sie nicht sicher genehmigen kann.

Die vollständige Host-Exec-Richtlinie, die lokale Genehmigungsdatei, das Positivlistenschema, sichere Programme und das Weiterleitungsverhalten finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Zuordnung zu Codex Guardian

Bei nativen Codex-App-Server-Sitzungen lenkt `tools.exec.mode: "auto"` Codex zu von Guardian geprüften Genehmigungen, sofern die lokalen Codex-Anforderungen dies zulassen. Typische resultierende Werte:

| Codex-Feld          | Typischer Wert    |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Der Modus `auto` erzwingt diese Richtlinie gegenüber allen konfigurierten Codex-Überschreibungen für Sandbox und Genehmigungen. Daher bleiben unsichere Legacy-Kombinationen wie `approvalPolicy: "never"` mit `sandbox: "danger-full-access"` nicht erhalten. `tools.exec.mode: "deny"` und `"allowlist"` blockieren die lokale Ausführung über den Codex-App-Server vollständig. Verwenden Sie `tools.exec.mode: "full"` nur, wenn Sie bewusst einen Betrieb ohne Genehmigungen wünschen.

Informationen zur Einrichtung des App-Servers, zur Authentifizierungsreihenfolge und zu Details der nativen Codex-Laufzeit finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

## ACPX-Harness-Berechtigungen

ACPX-Sitzungen sind nicht interaktiv und können daher keine TTY-Berechtigungsabfrage bestätigen. ACPX verwendet separate Einstellungen auf Harness-Ebene unter `plugins.entries.acpx.config`:

| Einstellung                  | Werte           | Bedeutung                                                    |
| ---------------------------- | --------------- | ------------------------------------------------------------ |
| `permissionMode`             | `approve-reads` | Nur Lesezugriffe automatisch genehmigen.                     |
| `permissionMode`             | `approve-all`   | Schreibzugriffe und Shell-Befehle automatisch genehmigen.    |
| `permissionMode`             | `deny-all`      | Alle Berechtigungsabfragen ablehnen.                          |
| `nonInteractivePermissions`  | `fail`          | Abbrechen, wenn eine Abfrage erforderlich wäre.               |
| `nonInteractivePermissions`  | `deny`          | Die Abfrage ablehnen und nach Möglichkeit fortfahren.         |

Konfigurieren Sie ACPX-Berechtigungen getrennt von den OpenClaw-Exec-Genehmigungen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Verwenden Sie `approve-all` als ACPX-Notfalläquivalent zu einer Harness-Sitzung ohne Rückfragen. Einzelheiten zur Einrichtung und zu Fehlermodi finden Sie unter [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration).

## Einen Modus auswählen

| Ziel                                              | Konfiguration                                              |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Host-Befehle vollständig blockieren               | `tools.exec.mode: "deny"`                                  |
| Nur bekanntermaßen sichere Befehle ausführen      | `tools.exec.mode: "allowlist"`                             |
| Bei jedem neuen Befehl einen Menschen fragen      | `tools.exec.mode: "ask"`                                   |
| Vor Menschen die automatische Codex/OpenClaw-Prüfung verwenden | `tools.exec.mode: "auto"`                      |
| Host-Exec-Genehmigungen vollständig überspringen  | `tools.exec.mode: "full"` plus passende Host-Genehmigungsdatei |
| Nicht interaktive ACPX-Sitzungen schreiben/ausführen lassen | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Wenn ein Befehl nach dem Ändern des Modus weiterhin eine Rückfrage auslöst oder fehlschlägt, prüfen Sie beide Ebenen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Für Host-Exec gilt das strengere Ergebnis aus der OpenClaw-Konfiguration und der lokalen Genehmigungsdatei des Hosts. ACPX-Harness-Berechtigungen lockern Host-Exec-Genehmigungen nicht, und Host-Exec-Genehmigungen lockern ACPX-Harness-Abfragen nicht.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Exec-Genehmigungen – erweitert](/de/tools/exec-approvals-advanced)
- [Codex-Harness](/de/plugins/codex-harness)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration)
