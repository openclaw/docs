---
read_when:
    - Nachfassen nach Feedback von Barnacle oder ClawSweeper
    - ClawSweeper um eine Überprüfung bitten
    - Debugging von Barnacle, ClawSweeper, veralteten Labels oder automatischen Schließungen
sidebarTitle: PR review flow
summary: Wie Feedback von Barnacle und ClawSweeper dazu beiträgt, OpenClaw-Pull-Requests durch den Review-Prozess zu führen.
title: Pull-Request-Review-Ablauf
x-i18n:
    generated_at: "2026-07-24T04:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9bec4578d55d2279450e991480467946db7da5ca956f85c35b4221190b2babe
    source_path: reference/pull-request-review-flow.md
    workflow: 16
---

Diese Seite erläutert den Pull-Request-Review-Ablauf, nachdem Sie einen OpenClaw-Pull-
Request geöffnet oder aktualisiert haben: was Barnacle und ClawSweeper tun, wie Sie den PR anhand ihres
Feedbacks verbessern und was Sie prüfen sollten, wenn die Automatisierung nicht reagiert.

Barnacle und ClawSweeper helfen den Maintainern, die Review-Warteschlange nutzbar zu halten. Sie
ersetzen nicht das Urteilsvermögen der Maintainer.

## Barnacle

Barnacle führt eine deterministische GitHub-Triage durch. Es sucht nach bekannten Fällen der
Warteschlangenverwaltung und reagiert mit Labels, Kommentaren oder Schließungen.

Barnacle kann aktiv werden, wenn:

- ein PR-Text weitgehend leer ist oder der Problemkontext fehlt;
- ein PR keine aussagekräftigen Nachweise enthält;
- bei einer reinen Dokumentations-, Test-, Refactoring-, CI- oder Infrastrukturänderung ein verknüpfter
  Maintainer-Kontext fehlt;
- eine Änderung eher in ClawHub oder ein Plugin als in den Core gehört;
- ein Branch nicht zugehörige Arbeiten enthält;
- ein Autor mehr als 20 offene PRs hat.

Barnacle wird über vertrauenswürdigen Workflow-Code des Repositorys ausgeführt. Es checkt keinen
Code von Mitwirkenden aus und führt ihn nicht aus.

Die meisten Routing-Labels sind Signale für Maintainer oder die Automatisierung, daher müssen Mitwirkende
selbst keine Labels hinzufügen.

## ClawSweeper

ClawSweeper ist der KI-gestützte Review- und Wartungs-Bot für OpenClaw-
Repositorys. Er kann PRs prüfen, Nachweise bewerten, dauerhafte Review-Kommentare hinterlassen
und Maintainer bei abgesicherten Reparatur- oder Automerge-Abläufen unterstützen.

Ein positives ClawSweeper-Ergebnis ist ein unterstützender Nachweis, keine Genehmigung durch Maintainer.
Die Maintainer entscheiden weiterhin, ob und wann ein PR zum Mergen bereit ist.

ClawSweeper arbeitet warteschlangenbasiert. Erwarten Sie keine sofortige Reaktion, nachdem Sie einen
PR geöffnet, einen Commit gepusht oder eine Review-Anfrage hinzugefügt haben. Auch Label-Aktualisierungen nach einem
ClawSweeper-Durchlauf können einige Zeit dauern.

Neue PRs werden in die ClawSweeper-Review-Warteschlange aufgenommen. Maintainer können außerdem Review-,
Reparatur- oder Automerge-Abläufe über Labels oder Befehle einreihen. Bitten Sie ClawSweeper bei gewöhnlichen
Aktualisierungen durch Mitwirkende erst dann um ein weiteres Review, nachdem Sie den
Branch, die PR-Beschreibung, die Nachweise oder den Code aktualisiert haben. Fordern Sie anschließend mit einem neuen
PR-Kommentar ein erneutes Review an:

```text
@clawsweeper re-review
```

PR-Autoren können außerdem `@clawsweeper re-run` verwenden; Benutzer mit Schreibzugriff auf das Repository
können beide Befehle für jedes offene Element verwenden. Der einfache
Befehl `@clawsweeper review` ist ausschließlich Maintainern vorbehalten. Haben Sie Geduld: Eine erneute Anfrage,
bevor die angeforderten Änderungen vorliegen, erzeugt lediglich unnötige Warteschlangenaktivität.

Wenn ClawSweeper Review-Konversationen hinterlässt, behandeln Sie diese wie normales Review-
Feedback und verwenden Sie die nachfolgende Checkliste.

Wenn ein menschlicher Mitwirkender oder Maintainer den PR übernommen hat und aktiv
daran arbeitet, rufen Sie nicht gleichzeitig ClawSweeper auf und arbeiten Sie auch nicht anderweitig am PR.
Lassen Sie zuerst das menschliche Review oder die Reparatur abschließen. Wenn die Aktivität endet, prüfen Sie,
ob der Autor aufgefordert wurde, Nachweise bereitzustellen oder andere Aktualisierungen vorzunehmen.

## Einen PR während des Reviews verbessern

Sobald Barnacle, ClawSweeper oder ein Maintainer reagiert, verwenden Sie dieses Feedback als
Checkliste für die nächsten Schritte des PRs.

1. Lesen Sie ClawSweepers `Rank-up moves:` und `Proof guidance:` als Aufgabenliste
   für diesen PR. Bewertungen und Labels sind Review-Signale, keine festen Merge-Ziele.
2. Pushen Sie die angeforderte Code- oder Dokumentationsänderung und aktualisieren Sie die PR-Beschreibung, wenn
   sich das Problem, die Lösung, die Auswirkungen auf Benutzer oder die Nachweise geändert haben.
3. Fügen Sie die angeforderten Nachweise hinzu und verwenden Sie dabei Belege, die zur Änderung passen.
4. Lösen Sie erledigte Review-Konversationen selbst auf. Antworten Sie und lassen Sie eine
   Konversation nur dann offen, wenn Sie die Einschätzung eines Maintainers oder Reviewers benötigen.
5. Bitten Sie erst dann um ein erneutes Review, wenn der Branch, die PR-Beschreibung, die Nachweise und
   die relevanten CI-Ergebnisse aktuell sind. Mehrere Aktualisierungs- und Review-Zyklen zwischen
   Autor, Maintainer und ClawSweeper sind normal.
6. Führen Sie die Diskussion nach Möglichkeit im PR. Wechseln Sie nur dann zu `#clawtributors` auf Discord,
   wenn für den PR eine Abstimmung mit Maintainern erforderlich ist, die Automatisierung blockiert zu sein scheint
   oder die nächste Entscheidung in GitHub-Kommentaren nur schwer zu klären ist. Geben Sie den PR-
   Link, den aktuellen Status und die konkrete Frage oder den noch fehlenden Nachweis an.

Halten Sie den PR-Text aktuell. Kommentare unterstützen die Diskussion, doch die PR-
Beschreibung ist die dauerhafte Zusammenfassung, auf die Maintainer und Automatisierung zurückgreifen.

`status: ⏳ waiting on author` bedeutet, dass der PR-Autor als Nächstes handeln muss:
Aktualisieren Sie den Branch, die PR-Beschreibung oder die Nachweise beziehungsweise antworten Sie mit dem fehlenden Kontext,
bevor Sie um ein weiteres Review bitten.

Nützliche Nachweise umfassen gezielte Testausgaben, CI-Ergebnisse, Screenshots,
Aufzeichnungen, Terminalausgaben, Live-Beobachtungen, bereinigte Protokolle oder Links zu
Artefakten. Fügen Sie bei visuellen Änderungen nach Möglichkeit Vorher- und Nachher-Screenshots hinzu.
Verlinken Sie für Nachweisdateien vorzugsweise CI-Artefakte, auf GitHub hochgeladene Screenshots oder
Aufzeichnungen oder einen kurzen bereinigten Protokollauszug. Committen Sie keine generierten Nachweisdateien,
sofern sie nicht Teil der eigentlichen Dokumentations-, Test- oder Produktänderung sind.

Die Bereinigung sensibler Daten liegt in der Verantwortung des Mitwirkenden. Entfernen Sie Secrets,
Token, private URLs, Benutzerdaten und nicht zugehörige Protokolle, bevor Sie Nachweise veröffentlichen.

OpenClaw verwendet außerdem eine separate Automatisierung für inaktive Elemente. Nicht zugewiesene Issues und PRs können
nach 14 Tagen ohne Aktivität als inaktiv markiert und nach weiteren 7 inaktiven Tagen geschlossen werden.
Zugewiesene PRs werden 27 Tage nach dem Öffnen als inaktiv markiert, unabhängig von späteren
Aktualisierungen, und anschließend nach 7 inaktiven Tagen ohne Aktivität geschlossen. Wenn ein zugewiesener PR
noch aktiv ist, stimmen Sie sich mit dem daran arbeitenden Maintainer ab.

## Wenn die Automatisierung nicht reagiert

Die Automatisierung reagiert möglicherweise nicht, wenn ein Maintainer das Element bereits bearbeitet, eine
Review- oder Reparaturanfrage noch in der Warteschlange steht, das Ereignis routinemäßig ist oder der
ClawSweeper-Ablauf nicht für die angeforderte Aktion konfiguriert ist.

Sie kann außerdem von einer Aktion absehen, wenn ein vertrauenswürdiger Workflow nicht vertrauenswürdigen
Code von Mitwirkenden ausführen müsste. In diesem Fall verwenden Maintainer stattdessen ein normales Review oder einen
sichereren Workflow.

## Fehlerbehebung

Wenn ClawSweeper nicht sofort reagiert, warten Sie, bevor Sie es erneut versuchen. Der Dienst arbeitet
warteschlangenbasiert, und wiederholte Kommentare oder Label-Änderungen können die Prüfung des Threads erschweren,
ohne die Warteschlange zu beschleunigen.

Prüfen Sie Folgendes, bevor Sie um Hilfe bitten:

- Die PR-Beschreibung ist aktuell;
- der neueste Commit enthält die angeforderte Änderung;
- die CI ist abgeschlossen oder der PR-Text erklärt, warum ein verbleibender Fehler
  nicht mit dem PR zusammenhängt;
- die neueste Review-Anfrage wurde als PR-Kommentar gestellt:
  `@clawsweeper re-review`;
- ein Maintainer oder Mitwirkender arbeitet nicht bereits aktiv am PR;
- die neueste Anfrage liegt nicht noch innerhalb der normalen ClawSweeper-Wartezeit.

Wenn mehrere Stunden, nachdem der PR aktuell ist, noch immer keine ClawSweeper-Antwort vorliegt
oder der PR durch die Automatisierung blockiert zu sein scheint, fragen Sie in `#clawtributors` auf Discord nach.
Geben Sie den PR-Link, das erwartete Ergebnis, den Zeitpunkt Ihrer Anfrage und die Änderungen seit
dem letzten Bot-Kommentar an.

## Automatisierung forken

Projekte, die eine ähnliche Review-Automatisierung wünschen, können ClawSweeper untersuchen oder forken:

- [openclaw/clawsweeper](https://github.com/openclaw/clawsweeper)
- [ClawSweeper-Dokumentation](https://clawsweeper.bot/)

## Verwandte Themen

- [Mitwirken](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [CI-Pipeline](/de/ci)
