---
read_when:
    - Sie nutzen einen OpenClaw-Agenten gemeinsam mit anderen Betreibern
    - Sie müssen die Sitzungsinhaber- und Anwesenheitsanzeigen verstehen
    - Sie entscheiden, ob ein gemeinsam genutzter Agent eine ausreichende Isolierung bietet
summary: Funktionsweise von Sitzungsverantwortung und Präsenz, wenn mehrere Personen einen Agenten bedienen
title: Mehrbenutzermodus
x-i18n:
    generated_at: "2026-07-24T04:53:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6a5a0e37b8dbeb2ebb7f32c3518acc6f3995dbfc09102f4d58c85e9cd62dfc2
    source_path: concepts/multi-user.md
    workflow: 16
---

Im Mehrbenutzermodus können mehrere vertrauenswürdige Personen denselben OpenClaw-Agenten bedienen. Er ergänzt Sitzungsinhaberschaft, Live-Präsenz und Filterung nach Ersteller, damit ein Team erkennen kann, wer die Arbeit begonnen hat und wer sie derzeit beobachtet.

## Vertrauensgrenze

Jede Person, die einen Agenten bedienen kann, kann ihn alles ausführen lassen, wozu dieser Agent in der Lage ist. Sitzungsinhaberschaft, Sichtbarkeit in der Seitenleiste und Präsenzanzeigen sind Bedienkomfortfunktionen, keine Sicherheitsgrenzen.

Wenn Personen nicht auf die Sitzungen, Tools, Anmeldedaten oder Dateien anderer zugreifen dürfen, stellen Sie ihnen separate Agenten oder separate Gateway-/Host-Vertrauensgrenzen bereit. Verlassen Sie sich zur Isolation nicht auf Inhaberavatare oder Filter.

## Inhaberschaft und Präsenz

Neue Sitzungen zeichnen einen einmalig schreibbaren `createdActor` auf, wenn der Erstellungspfad nachweisen kann, wer sie ausgelöst hat. Bei authentifizierten Personen wird ihre dauerhafte Gateway-Profil-ID verwendet; anfragende Agenten und Systempfade verwenden dasselbe Akteursfeld. Sitzungen, die ohne nachgewiesenen Akteur erstellt werden, bleiben ohne Zuordnung.

Die Anzeigenamen von Personen werden aus dem aktuellen Gateway-Profil aufgelöst, wenn Sitzungszeilen zurückgegeben werden. OpenClaw speichert keine Bezeichnungen in Sitzungseinträgen. Daher aktualisiert eine Änderung des Profilnamens die Inhaberschaftsanzeige, ohne den Sitzungsverlauf neu zu schreiben.

Die Web-App stellt Inhaberschaft und Präsenz visuell getrennt dar:

- Ein ausgefüllter Inhaberavatar bleibt während der gesamten Lebensdauer dieser Sitzung bestehen.
- Umrandete oder durchscheinende Präsenzavatare zeigen Personen, die derzeit verbunden sind oder zuschauen.
- Der Personenfilter in der Seitenleiste zeigt Sitzungen, die von einer bestimmten Identität erstellt wurden, und behält dabei die vorhandenen benutzerdefinierten Gruppen bei.

Wenn in der geladenen Sitzungsliste weniger als zwei unterschiedliche Ersteller erscheinen, blendet OpenClaw sämtliche Bedienelemente für Inhaberschaft und Personenfilter aus. Ein Gateway für einen einzelnen Benutzer sieht daher unverändert aus.

## Entwürfe

Starten Sie eine Sitzung als Entwurf, damit laufende Arbeiten nicht in den Seitenleisten Ihrer Teammitglieder erscheinen, bis Sie sie veröffentlichen. Entwürfe werden Administratoren niemals vorenthalten; sie sehen die Entwürfe anderer Personen mit einer abgeblendeten Geistmarkierung. Dies ist eine Koordinationsfunktion, keine Sicherheitsgrenze.

## Zuordnung von Gesprächsrunden

Die Zuordnung des Absenders einer Gesprächsrunde erfolgt nach bestem Bemühen. Durch Steuerung können Eingaben in eine aktive Gesprächsrunde eingefügt werden, sodass das Transkript den Beitrag jeder Person nicht immer als separate Gesprächsrunde darstellen kann.

## Verwandte Themen

- [Die Hauptsitzung](/concepts/main-session)
- [Sitzungsverwaltung](/de/concepts/session)
- [Präsenz](/de/concepts/presence)
- [Gateway-Sicherheit](/de/gateway/security)
