---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Wiederherstellen eines zurückgehaltenen, ausgeblendeten oder blockierten Listings
summary: Vertrauens-, Scan-, Melde-, Einspruchs- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist für Veröffentlichungen offen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-,
Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzern helfen,
zu prüfen, was sie installieren, Publishern einen Wiederherstellungspfad bei Fehlalarmen geben
und missbräuchliche Pakete aus der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation einer Skill oder eines Plugins den ClawHub-Eintrag auf:

- Inhaber- und Quellenangaben
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Inhaber sichtbaren
Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen
  Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine
Veröffentlichung zurückgehalten oder blockiert wird, sollten Benutzer sie nicht installieren, bis der Inhaber das
Problem behoben hat oder die Moderation sie wieder freigibt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was eine Skill deklariert, und
dem, was sie offenbar tut. Beispielsweise sollte eine Skill, die einen erforderlichen API-Schlüssel erwähnt,
diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der
Installation sehen können.

Scan-Befunde sind artefaktbasiert. Erwartetes Provider-Verhalten, wie deklarierte
API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsgebundene Deinstallationsbereinigung, Basic-Auth-
Codierung oder vom Benutzer ausgewählte Datei-Uploads an den angegebenen Provider, wird
anders behandelt als verdeckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien,
unzusammenhängende Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder
und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität vor der Installation von ClawHub-gehosteten Plugins. Paketdatensätze
können außerdem Digest-Metadaten offenlegen, damit OpenClaw heruntergeladene
Artefakte verifizieren kann. ClawScan bezieht deklarierte Paketmetadaten zu `openclaw.environment` für Umgebung/Konfiguration
bei der Prüfung von Plugin-Veröffentlichungen ein, damit deklarierte Laufzeitanforderungen
mit dem beobachteten Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten spezifisch und umsetzbar sein. Missbrauch der Meldefunktion kann selbst zu
Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## Meldungen zu Bösgläubigkeit oder Markenrechten

ClawHub verwendet dieselbe Melde- und Mitarbeiter-Moderationspipeline für bösgläubige
Registrierungen, Identitätsnachahmung und markenbezogene Streitfälle. Diese Meldungen benötigen
ausreichend Kontext, damit Mitarbeiter den Anspruchsteller, den strittigen Eintrag und die
angeforderte Maßnahme identifizieren können.

Geben Sie Folgendes an:

- die kanonische ClawHub-Skill- oder Paket-URL und den Inhaber-Handle
- die betroffene Marke, das Projekt, das Unternehmen oder den Produktnamen
- öffentliche Nachweise für Eigentum oder Befugnis des Anspruchstellers
- warum der aktuelle Inhaber nicht berechtigt ist, unter diesem Namen zu veröffentlichen
- die angeforderte Maßnahme, z. B. bis zur Prüfung ausblenden, Inhaberschaft übertragen, umbenennen
  oder entfernen

Geben Sie keine privaten Geheimnisse oder sensiblen Rechtsdokumente in öffentlichen Meldungen an. Öffnen Sie
ein GitHub-Issue mit nicht sensiblen Nachweisen und bitten Sie die Maintainer bei Bedarf um einen privaten
Übergabepfad.

## Einsprüche und erneute Scans

Inhaber können einen erneuten Scan anfordern, wenn sie der Meinung sind, dass eine Skill oder ein Paket fälschlicherweise
zurückgehalten oder markiert wurde. Plattformmoderatoren und Administratoren können beim Bearbeiten von Meldungen
oder Supportanfragen für jede Skill oder jedes Paket erneute Scans anfordern:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Bei moderierten Inhalten können Inhaber möglicherweise über die für Inhaber sichtbaren
ClawHub-Oberflächen Einspruch einlegen. Einsprüche sollten erklären, was geändert wurde oder warum die
Markierung falsch ist.

## Moderationssperren

Wenn der statische Scanner eine hochgeladene Skill als bösartig markiert, wird der Publisher
automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` beim
Benutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, zukünftige Veröffentlichungen
beginnen ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische Verdachtsbefunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt,
blenden Inhalte jedoch nicht aus und bestimmen nicht eigenständig das öffentliche Scan-Urteil.
Neue Uploads bleiben im Prüfungs-/Ausstehend-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches
Scannen blockiert nur bei bösartigen Signaturen sofort. VirusTotal-Engine-
Treffer bleiben sichtbare Sicherheitsnachweise, aber VirusTotal-Code-Insight/Palm-
Bewertungen sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen
bewahren zweckorientierte Hinweise als Orientierung auf. Mittlere Prüfungsbefunde bleiben auf
dem Artefakt sichtbar, während der Verdachtsfilter für wirkungsstarke LLM-
Bedenken, bösartige Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Administratoren können eine Fehlalarm-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt
Skills wieder her, die durch die benutzerweite Sperre ausgeblendet wurden, und schreibt einen `user.moderation.lift`-Audit-
Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet sind oder deren eigener statischer Scan weiterhin
bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugang verlieren. Schwerer Missbrauch
kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten
Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-Benutzeroberfläche an, um den Konto-
Status zu prüfen, oder kontaktieren Sie die Maintainer über den vorgesehenen Supportkanal des Projekts.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Benutzervertrauen zu verbessern:

- Namen, Zusammenfassungen, Tags und Changelogs korrekt halten
- erforderliche Umgebungsvariablen und Berechtigungen deklarieren
- verschleierte Installationsbefehle vermeiden
- nach Möglichkeit auf die Quelle verlinken
- Probeläufe vor dem Veröffentlichen von Plugins verwenden
- klar antworten, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
