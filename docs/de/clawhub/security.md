---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Skill oder Paket melden
    - Wiederherstellen eines zurückgehaltenen, ausgeblendeten oder blockierten Eintrags
summary: Vertrauens-, Scan-, Melde-, Einspruchs- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-,
Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzer sollen
prüfen können, was sie installieren, Herausgeber sollen einen Wiederherstellungspfad bei False Positives
erhalten, und missbräuchliche Pakete sollen aus der öffentlichen Auffindbarkeit herausgehalten werden.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins dessen ClawHub-Eintrag auf:

- Inhaber- und Quellenzuordnung
- neueste Version und Änderungsprotokoll
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für
Inhaber sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen
  Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine
Veröffentlichung zurückgehalten oder blockiert wird, sollten Benutzer sie nicht installieren, bis der Inhaber
das Problem behebt oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans betrachten das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert,
und dem, was er offenbar tut. Beispielsweise sollte ein Skill, der einen erforderlichen API-Schlüssel
referenziert, diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der
Installation sehen können.

Scan-Befunde sind artefaktbasiert. Erwartetes Provider-Verhalten, etwa deklarierte
API-Anmeldedaten, localhost-OAuth-Callbacks, bereichsgebundene Bereinigung bei der Deinstallation,
Basic-Auth-Codierung oder vom Benutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird
anders behandelt als versteckte Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien,
nicht zusammenhängende Netzwerkziele oder heimlicher Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenzuordnung, Kompatibilitätsfelder
und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor über ClawHub gehostete Plugins installiert werden. Paketdatensätze
können außerdem Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene
Artefakte verifizieren kann. ClawScan bezieht deklarierte `openclaw.environment`-Env-/Konfigurationsmetadaten des Pakets
bei der Prüfung von Plugin-Veröffentlichungen ein, sodass deklarierte Laufzeitanforderungen
mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten spezifisch und umsetzbar sein. Missbrauch des Meldesystems kann selbst zu
Maßnahmen gegen das Konto führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsanmaßung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## Meldungen zu Bösgläubigkeit oder Markenrechten

ClawHub verwendet dieselbe Melde- und Moderationspipeline des Teams für bösgläubige
Registrierungen, Identitätsanmaßung und markenbezogene Streitfälle. Diese Meldungen benötigen
ausreichend Kontext, damit das Team den Anspruchsteller, den umstrittenen Eintrag und die
angeforderte Maßnahme identifizieren kann.

Geben Sie Folgendes an:

- die kanonische ClawHub-Skill- oder Paket-URL und das Inhaber-Handle
- die betroffene Marke, das Projekt, das Unternehmen oder den Produktnamen
- öffentliche Nachweise zur Inhaberschaft oder Befugnis des Anspruchstellers
- warum der aktuelle Inhaber nicht berechtigt ist, unter diesem Namen zu veröffentlichen
- die angeforderte Maßnahme, etwa Ausblenden bis zur Prüfung, Übertragung der Inhaberschaft, Umbenennung
  oder Entfernung

Stellen Sie keine privaten Geheimnisse oder sensiblen juristischen Dokumente in öffentliche Meldungen. Öffnen Sie
ein GitHub-Issue mit nicht sensiblen Nachweisen und bitten Sie Maintainer bei Bedarf um einen privaten
Übergabepfad.

## Einsprüche und erneute Scans

Inhaber können einen erneuten Scan anfordern, wenn sie glauben, dass ein Skill oder Paket fälschlicherweise
zurückgehalten oder markiert wurde. Plattformmoderatoren und Administratoren können erneute Scans für jeden
Skill und jedes Paket anfordern, während sie Meldungen oder Supportanfragen bearbeiten:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Bei moderierten Inhalten können Inhaber möglicherweise über die für Inhaber sichtbaren
ClawHub-Oberflächen Einspruch einlegen. Einsprüche sollten erklären, was sich geändert hat oder warum die
Markierung falsch ist.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Herausgeber
automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` wird beim
Benutzer gesetzt). Dadurch werden alle Skills des Herausgebers ausgeblendet, zukünftige Veröffentlichungen
beginnen ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt,
blenden Inhalte jedoch nicht aus und entscheiden nicht eigenständig über das öffentliche Scan-Urteil.
Neue Uploads bleiben im Prüf-/Pending-Zustand, bis die VirusTotal- und LLM-Prüfungen
abgeschlossen sind; statisches Scanning blockiert nur bei bösartigen Signaturen sofort.
ClawScan-LLM-Prüfungen behalten zweckbezogene Hinweise als Orientierung bei; sie geben nur dann ein
Review-/suspicious-Urteil zurück, wenn die strukturierte Prüfung einen wesentlichen Anlass zur Sorge enthält.

Administratoren können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt
Skills wieder her, die durch die benutzerbezogene Sperre ausgeblendet wurden, und schreibt einen
`user.moderation.lift`-Audit-Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet sind oder deren
eigener statischer Scan weiterhin bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch
kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten
Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den
Kontostatus zu prüfen, oder kontaktieren Sie Maintainer über den erwarteten Supportkanal des Projekts.

## Hinweise für Herausgeber

Um False Positives zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Änderungsprotokolle korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Dry Runs, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
