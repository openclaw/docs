---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Wiederherstellung nach einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
summary: Vertrauens-, Scan-, Berichts- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-12T12:54:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praxisnah: Nutzern helfen, zu prüfen, was sie installieren, Publishern einen Wiederherstellungspfad für Fehlalarme geben und missbräuchliche Pakete aus der öffentlichen Suche heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Nutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins den ClawHub-Eintrag auf:

- Eigentümer- und Quellenangaben
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Status

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Eigentümer sichtbaren Diagnoseinformationen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert wird, sollten Nutzer sie nicht installieren, bis der Eigentümer das Problem behoben hat oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans betrachten das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Wenn ein Skill beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte er diese Anforderung in `SKILL.md` deklarieren, damit Nutzer sie vor der Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsbezogene Deinstallationsbereinigung, Basic-Auth-Kodierung oder vom Nutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird anders behandelt als versteckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien, nicht zusammenhängende Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor über ClawHub gehostete Plugins installiert werden. Paketdatensätze können außerdem Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan bezieht deklarierte Paketmetadaten zu `openclaw.environment` für env/config bei der Prüfung von Plugin-Veröffentlichungen ein, damit deklarierte Laufzeitanforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Nutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und umsetzbar sein. Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsmissbrauch
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skills oder Plugins optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext für Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native Hosts oder provider-spezifische Zugangsdaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Publisher automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` wird für den Nutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, zukünftige Veröffentlichungen starten ausgeblendet, und es wird ein Audit-Log-Eintrag `user.moderation.auto` erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt, blenden Inhalte aber nicht aus und entscheiden für sich genommen nicht über das öffentliche Scan-Urteil. Neue Uploads bleiben im Prüf-/Wartestatus, bis die LLM-Prüfung abgeschlossen ist. Statisches Scannen blockiert nur bei bösartigen Signaturen sofort. VirusTotal-Engine-Treffer bleiben als sichtbare Sicherheitsnachweise erhalten, aber Urteile von VirusTotal Code Insight/Palm sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen behalten zweckbezogene Hinweise als Orientierung bei. Befunde mit mittlerer Einstufung bleiben am Artefakt sichtbar, während der verdächtige Filter für folgenreiche LLM-Bedenken, bösartige Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Admins können eine falsch-positive Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt durch die nutzerweite Sperre ausgeblendete Skills wieder her und schreibt einen Audit-Log-Eintrag `user.moderation.lift`. Skills, die aus anderen Gründen ausgeblendet wurden oder deren eigener statischer Scan weiterhin bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, kontaktieren Sie security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Nutzer zu stärken:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen Publisher-ClawScan-Hinweis hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten aufweist
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Testläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Paketverhalten fragen
