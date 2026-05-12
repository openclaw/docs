---
read_when:
    - Scan- und Moderationsergebnisse von ClawHub verstehen
    - Skill oder Paket melden
    - Wiederherstellung einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
summary: Vertrauens-, Scan-, Melde- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:09:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-,
Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzern helfen,
zu prüfen, was sie installieren, Publishern einen Wiederherstellungspfad für False Positives geben
und missbräuchliche Pakete aus der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins den ClawHub-Eintrag auf:

- Eigentümer und Quellenangabe
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für
Eigentümer sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Überprüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf
  öffentlichen Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, aber die praktische Bedeutung ist dieselbe: Wenn eine
Veröffentlichung gehalten oder blockiert wird, sollten Benutzer sie nicht installieren, bis der Eigentümer
das Problem behoben hat oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert,
und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel
referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der
Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte
API-Anmeldedaten, localhost-OAuth-Callbacks, bereinigende Deinstallation im Geltungsbereich, Basic Auth-
Codierung oder vom Benutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird
anders behandelt als versteckte Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien,
nicht verwandte Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder
und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor auf ClawHub gehostete Plugins installiert werden. Paketdatensätze
können außerdem Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene
Artefakte verifizieren kann. ClawScan bezieht deklarierte Paketmetadaten für `openclaw.environment` zu Umgebungs-/Konfigurationsdaten
bei der Überprüfung von Plugin-Veröffentlichungen ein, damit deklarierte Laufzeitanforderungen
mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten spezifisch und umsetzbar sein. Missbrauch des Meldesystems kann selbst zu
Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- betrügerische Kommentare oder Identitätsmissbrauch
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skills oder Plugins einen optionalen ClawScan-Hinweis angeben.
Dieser Hinweis gibt ClawScan Kontext für Verhalten, das andernfalls ungewöhnlich wirken könnte,
etwa Netzwerkzugriff, nativen Hostzugriff oder Provider-spezifische
Anmeldedaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als schädlich markiert, wird der Publisher
automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` beim
Benutzer gesetzt). Dadurch werden alle Skills des Publishers verborgen, künftige Veröffentlichungen
starten verborgen, und es wird ein Audit-Log-Eintrag `user.moderation.auto` erstellt.

Statische verdächtige Ergebnisse werden als Datei-/Zeilenbelege für Moderatoren aufbewahrt,
verbergen Inhalte aber nicht eigenständig und entscheiden auch nicht allein über das öffentliche Scan-Urteil.
Neue Uploads bleiben im Überprüfungs-/Pending-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches
Scannen blockiert nur bei schädlichen Signaturen sofort. VirusTotal-Engine-
Treffer bleiben als sichtbare Sicherheitsbelege erhalten, aber VirusTotal-Code-Insight-/Palm-
Urteile sind beratend und verbergen Skills nicht eigenständig. ClawScan-LLM-Prüfungen
behalten zweckbezogene Hinweise als Orientierung bei. Ergebnisse mittlerer Prüfungsstufe bleiben auf
dem Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-
Bedenken, schädliche Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Admins können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dadurch werden `requiresModerationAt` und `requiresModerationReason` gelöscht, durch die Sperre auf Benutzerebene
verborgene Skills wiederhergestellt und ein Audit-Log-Eintrag `user.moderation.lift`
geschrieben. Skills, die aus anderen Gründen verborgen sind oder deren eigener statischer Scan weiterhin
schädlich ist, bleiben verborgen.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch
kann zu Kontosperren, Token-Widerruf, verborgenen Inhalten oder entfernten
Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens verwenden. Wenn die CLI-Authentifizierung
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen.
Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, wenden Sie sich für eine Wiederherstellungsprüfung an
security@openclaw.ai.

## Leitlinien für Publisher

Um False Positives zu reduzieren und das Vertrauen der Benutzer zu erhöhen:

- Namen, Zusammenfassungen, Tags und Changelogs korrekt halten
- erforderliche Umgebungsvariablen und Berechtigungen deklarieren
- einen Publisher-ClawScan-Hinweis hinzufügen, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten hat
- verschleierte Installationsbefehle vermeiden
- nach Möglichkeit auf die Quelle verlinken
- Dry Runs vor dem Veröffentlichen von Plugins verwenden
- klar antworten, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
