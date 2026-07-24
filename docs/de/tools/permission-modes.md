---
read_when:
    - Auswahl von auto, ask, allowlist, full oder deny für Befehlsberechtigungen
    - Konfigurieren von durch Codex Guardian geprüften Genehmigungen über tools.exec.mode
    - Vergleich der OpenClaw-Ausführungsgenehmigungen mit den ACPX-Harness-Berechtigungen
summary: Berechtigungsmodi für die Ausführung auf dem Host, Codex-Guardian-Genehmigungen und ACPX-Harness-Sitzungen
title: Berechtigungsmodi
x-i18n:
    generated_at: "2026-07-24T05:24:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Berechtigungsmodi bestimmen, wie viele Befugnisse ein Agent hat, bevor er Host-Befehle ausführt, Dateien schreibt oder ein Backend-Harness um zusätzlichen Zugriff bittet.

<Note>
  Der Berechtigungsmodus ist von `tools.exec.host=auto` getrennt. `tools.exec.host`
  bestimmt, wo ein Befehl ausgeführt wird. `tools.exec.mode` bestimmt, wie die Host-Ausführung
  genehmigt wird.
</Note>

## Empfohlene Standardeinstellung

Verwenden Sie `auto` für Coding-Agenten, die sinnvollen Host-Zugriff benötigen, ohne dass jeder nicht abgedeckte Fall eine Rückfrage an einen Menschen auslöst:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Überprüfen Sie anschließend die wirksame Richtlinie:

```bash
openclaw exec-policy show
```

## OpenClaw-Modi für die Host-Ausführung

`tools.exec.mode` ist die normalisierte Richtlinienoberfläche für Host-`exec`. Jeder Modus wird in ein zugrunde liegendes Paar aus `security` (Strenge der Positivliste) und `ask` (Nachfrage bei Nichtübereinstimmung) aufgelöst:

| Modus        | security / ask          | Verhalten                                                                                      | Verwenden, wenn                                              |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | Host-Ausführung vollständig blockieren.                                                                     | Keine Host-Befehle zulässig sind.                         |
| `allowlist` | `allowlist` / `off`     | Nur Befehle auf der Positivliste ausführen; Nichtübereinstimmungen ohne Meldung ablehnen.                                          | Sie über einen als sicher bekannten Befehlssatz verfügen.                    |
| `ask`       | `allowlist` / `on-miss` | Übereinstimmungen mit der Positivliste ausführen; bei Nichtübereinstimmungen einen Menschen fragen.                                                 | Jeder neue Befehl von einem Menschen geprüft werden soll.              |
| `auto`      | `allowlist` / `on-miss` | Übereinstimmungen mit der Positivliste ausführen; Nichtübereinstimmungen zunächst automatisch prüfen und erst danach auf eine menschliche Genehmigung zurückgreifen. | Coding-Sitzungen praxistauglichen, abgesicherten Zugriff benötigen.        |
| `full`      | `full` / `off`          | Host-Ausführung ohne Rückfragen ausführen.                                                                | Dieser vertrauenswürdige Host bzw. diese vertrauenswürdige Sitzung Genehmigungsschranken überspringen soll. |

`ask` und `auto` verwenden dieselben Einstellungen für Positivliste und Rückfragen; `auto` aktiviert zusätzlich die native automatische Prüfung, die selbst über Nichtübereinstimmungen entscheidet und nur dann auf den konfigurierten Weg zur menschlichen Genehmigung zurückgreift, wenn sie diese nicht sicher genehmigen kann.

Die vollständige Richtlinie für die Host-Ausführung, die lokale Genehmigungsdatei, das Schema der Positivliste, sichere Binärprogramme und das Weiterleitungsverhalten finden Sie unter [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Zuordnung zu Codex Guardian

Bei nativen Codex-App-Server-Sitzungen lenkt `tools.exec.mode: "auto"` Codex zu von Guardian geprüften Genehmigungen, sofern die lokalen Codex-Anforderungen dies zulassen. Typische resultierende Werte:

| Codex-Feld         | Typischer Wert     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Der Modus `auto` erzwingt diese Richtlinie und überschreibt dabei alle konfigurierten Codex-Sandbox- oder Genehmigungsabweichungen. Daher bleiben ältere unsichere Kombinationen wie `approvalPolicy: "never"` mit `sandbox: "danger-full-access"` nicht erhalten. `tools.exec.mode: "deny"` und `"allowlist"` blockieren die lokale Ausführung des Codex-App-Servers vollständig. Verwenden Sie `tools.exec.mode: "full"` nur, wenn Sie ausdrücklich einen Zustand ohne Genehmigungen wünschen.

Informationen zur Einrichtung des App-Servers, zur Authentifizierungsreihenfolge und zu Details der nativen Codex-Laufzeit finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

## ACPX-Harness-Berechtigungen

ACPX-Sitzungen sind nicht interaktiv und können daher keine TTY-Berechtigungsabfrage anklicken. ACPX verwendet separate Einstellungen auf Harness-Ebene unter `plugins.entries.acpx.config`:

| Einstellung                     | Werte          | Bedeutung                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | Nur Lesezugriffe automatisch genehmigen.                    |
| `permissionMode`            | `approve-all`   | Schreibzugriffe und Shell-Befehle automatisch genehmigen.     |
| `permissionMode`            | `deny-all`      | Alle Berechtigungsabfragen ablehnen.                |
| `nonInteractivePermissions` | `fail`          | Abbrechen, wenn eine Abfrage erforderlich wäre.      |
| `nonInteractivePermissions` | `deny`          | Die Abfrage ablehnen und nach Möglichkeit fortfahren. |

Legen Sie ACPX-Berechtigungen getrennt von den OpenClaw-Ausführungsgenehmigungen fest:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Verwenden Sie `approve-all` als ACPX-Notfalläquivalent zu einer Harness-Sitzung ohne Rückfragen. Einzelheiten zur Einrichtung und zu Fehlermodi finden Sie unter [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration).

## Modus auswählen

| Ziel                                          | Konfiguration                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| Host-Befehle vollständig blockieren                | `tools.exec.mode: "deny"`                                   |
| Nur als sicher bekannte Befehle ausführen lassen              | `tools.exec.mode: "allowlist"`                              |
| Bei jeder neuen Befehlsform einen Menschen fragen       | `tools.exec.mode: "ask"`                                    |
| Automatische Prüfung durch Codex/OpenClaw vor menschlicher Prüfung verwenden  | `tools.exec.mode: "auto"`                                   |
| Genehmigungen für die Host-Ausführung vollständig überspringen             | `tools.exec.mode: "full"` plus passende Host-Genehmigungsdatei |
| Nicht interaktiven ACPX-Sitzungen Schreibzugriffe und Ausführungen erlauben | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Wenn ein Befehl nach dem Ändern des Modus weiterhin eine Rückfrage auslöst oder fehlschlägt, prüfen Sie beide Ebenen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Für die Host-Ausführung gilt das strengere Ergebnis aus der OpenClaw-Konfiguration und der lokalen Genehmigungsdatei des Hosts. ACPX-Harness-Berechtigungen lockern die Genehmigungen für die Host-Ausführung nicht, und Genehmigungen für die Host-Ausführung lockern ACPX-Harness-Abfragen nicht.

## Verwandte Themen

- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- [Ausführungsgenehmigungen – erweitert](/de/tools/exec-approvals-advanced)
- [Codex-Harness](/de/plugins/codex-harness)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup#permission-configuration)
