---
read_when:
    - 'Befehlsberechtigungen: auto, ask, allowlist, full oder deny auswählen'
    - Codex Guardian-geprüfte Genehmigungen über tools.exec.mode konfigurieren
    - OpenClaw-Ausführungsgenehmigungen mit ACPX-Harness-Berechtigungen vergleichen
summary: Berechtigungsmodi für Host-Exec, Codex Guardian-Genehmigungen und ACPX-Harness-Sitzungen
title: Berechtigungsmodi
x-i18n:
    generated_at: "2026-06-27T18:20:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Berechtigungsmodi legen fest, wie viel Autorität ein Agent hat, bevor er Host-Befehle ausführen, Dateien schreiben oder ein Backend-Harness um zusätzlichen Zugriff bitten kann. Beginnen Sie mit `tools.exec.mode: "auto"`, wenn OpenClaw zuerst Allowlists verwenden soll und anschließend bei Fehltreffern die native Codex-Auto-Review oder eine menschliche Genehmigungsroute.

<Note>
  Der Berechtigungsmodus ist von `tools.exec.host=auto` getrennt. `tools.exec.host`
  wählt aus, wo ein Befehl ausgeführt wird. `tools.exec.mode` wählt aus, wie Host-Exec
  genehmigt wird.
</Note>

## Empfohlene Standardeinstellung

Verwenden Sie `auto` für Coding-Agenten, die nützlichen Host-Zugriff benötigen, ohne jeden Fehltreffer zu einer menschlichen Rückfrage zu machen:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Überprüfen Sie anschließend die wirksame Richtlinie:

```bash
openclaw exec-policy show
```

Im Modus `auto` führt OpenClaw deterministische Allowlist-Treffer direkt aus. Genehmigungs-Fehltreffer durchlaufen zuerst den nativen Auto-Reviewer von OpenClaw und fallen dann bei Bedarf auf die konfigurierte menschliche Genehmigungsroute zurück.

## OpenClaw-Host-Exec-Modi

`tools.exec.mode` ist die normalisierte Richtlinienoberfläche für Host-`exec`.

| Modus       | Verhalten                                             | Verwenden, wenn                                             |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `deny`      | Host-Exec blockieren.                                 | Keine Host-Befehle erlaubt sind.                            |
| `allowlist` | Nur Allowlist-Befehle ausführen.                      | Sie einen bekannten sicheren Befehlssatz haben.             |
| `ask`       | Allowlist-Treffer ausführen und bei Fehltreffern fragen. | Ein Mensch neue Befehlsformen prüfen soll.               |
| `auto`      | Allowlist-Treffer ausführen, dann Auto-Review verwenden. | Coding-Sitzungen praktischen, abgesicherten Zugriff benötigen. |
| `full`      | Host-Exec ohne Rückfragen ausführen.                  | Dieser vertrauenswürdige Host/diese Sitzung Genehmigungsgates überspringen soll. |

Die vollständige Host-Exec-Richtlinie, die lokale Genehmigungsdatei, das Allowlist-Schema, sichere Bins und das Weiterleitungsverhalten finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Codex-Guardian-Zuordnung

Für native Codex-App-Server-Sitzungen wird `tools.exec.mode: "auto"` Codex-Guardian-geprüften Genehmigungen zugeordnet, wenn die lokalen Codex-Anforderungen dies zulassen. OpenClaw sendet normalerweise:

| Codex-Feld         | Typischer Wert    |
| ------------------ | ----------------- |
| `approvalPolicy`   | `on-request`      |
| `approvalsReviewer` | `auto_review`    |
| `sandbox`          | `workspace-write` |

Im Modus `auto` bewahrt OpenClaw keine veralteten unsicheren Codex-Überschreibungen wie `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` auf. Verwenden Sie `tools.exec.mode: "full"` nur, wenn Sie bewusst die Haltung ohne Genehmigungen wünschen.

Informationen zur App-Server-Einrichtung, Auth-Reihenfolge und zu nativen Codex-Laufzeitdetails finden Sie unter [Codex-Harness](/de/plugins/codex-harness).

## ACPX-Harness-Berechtigungen

ACPX-Sitzungen sind nicht interaktiv und können daher keine TTY-Berechtigungsaufforderung anklicken. ACPX verwendet separate Harness-Einstellungen unter `plugins.entries.acpx.config`:

| Einstellung                 | Üblicher Wert   | Bedeutung                                      |
| --------------------------- | --------------- | ---------------------------------------------- |
| `permissionMode`            | `approve-reads` | Nur Lesezugriffe automatisch genehmigen.       |
| `permissionMode`            | `approve-all`   | Schreibzugriffe und Shell-Befehle automatisch genehmigen. |
| `permissionMode`            | `deny-all`      | Alle Berechtigungsaufforderungen ablehnen.     |
| `nonInteractivePermissions` | `fail`          | Abbrechen, wenn eine Aufforderung erforderlich wäre. |
| `nonInteractivePermissions` | `deny`          | Die Aufforderung ablehnen und nach Möglichkeit fortfahren. |

Legen Sie ACPX-Berechtigungen getrennt von OpenClaw-Exec-Genehmigungen fest:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Verwenden Sie `approve-all` als ACPX-Break-Glass-Entsprechung einer Harness-Sitzung ohne Rückfragen. Einrichtungsdetails und Fehlermodi finden Sie unter [ACP-Agenten einrichten](/de/tools/acp-agents-setup#permission-configuration).

## Einen Modus auswählen

| Ziel                                           | Konfiguration                                             |
| ---------------------------------------------- | --------------------------------------------------------- |
| Host-Befehle vollständig blockieren            | `tools.exec.mode: "deny"`                                 |
| Nur bekannte sichere Befehle ausführen lassen  | `tools.exec.mode: "allowlist"`                            |
| Einen Menschen für jede neue Befehlsform fragen | `tools.exec.mode: "ask"`                                 |
| Codex/OpenClaw-Auto-Review vor Menschen verwenden | `tools.exec.mode: "auto"`                              |
| Host-Exec-Genehmigungen vollständig überspringen | `tools.exec.mode: "full"` plus passende Host-Genehmigungsdatei |
| Nicht interaktive ACPX-Sitzungen schreiben/ausführen lassen | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Wenn ein Befehl nach dem Ändern des Modus weiterhin eine Aufforderung zeigt oder fehlschlägt, prüfen Sie beide Ebenen:

```bash
openclaw approvals get
openclaw exec-policy show
```

Host-Exec verwendet das strengere Ergebnis aus OpenClaw-Konfiguration und der hostlokalen Genehmigungsdatei. ACPX-Harness-Berechtigungen lockern Host-Exec-Genehmigungen nicht, und Host-Exec-Genehmigungen lockern ACPX-Harness-Aufforderungen nicht.

## Verwandt

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Exec-Genehmigungen - erweitert](/de/tools/exec-approvals-advanced)
- [Codex-Harness](/de/plugins/codex-harness)
- [ACP-Agenten einrichten](/de/tools/acp-agents-setup#permission-configuration)
