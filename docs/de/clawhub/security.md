---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Melden eines Skills oder Pakets
    - Wiederherstellen eines zurückgehaltenen, ausgeblendeten oder blockierten Eintrags
summary: Verhalten von ClawHub in Bezug auf Vertrauen, Prüfungen, Meldungen und Moderation.
x-i18n:
    generated_at: "2026-05-13T05:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, öffentliche Listings durchlaufen jedoch weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzern helfen, zu prüfen, was sie installieren, Publishern einen Wiederherstellungsweg bei Fehlalarmen geben und missbräuchliche Pakete aus der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins dessen ClawHub-Listing auf:

- Eigentümer- und Quellenangaben
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Eigentümer sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Überprüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen Installationsflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert wird, sollten Benutzer sie nicht installieren, bis der Eigentümer das Problem behoben hat oder die Moderation sie wieder freigibt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsgebundene Deinstallationsbereinigung, Basic Auth-Codierung oder vom Benutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird anders behandelt als versteckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien, nicht zusammenhängende Netzwerkziele oder heimlicher Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor in ClawHub gehostete Plugins installiert werden. Paketdatensätze können außerdem Digest-Metadaten offenlegen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan bezieht deklarierte Paketmetadaten für `openclaw.environment`-Umgebung/Konfiguration bei der Prüfung von Plugin-Veröffentlichungen ein, sodass deklarierte Laufzeitanforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und umsetzbar sein. Missbrauch des Meldesystems kann selbst zu Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsmissbrauch
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skills oder Plugins optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext für Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native Hosts oder providerspezifische Zugangsdaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Publisher automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` beim Benutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, zukünftige Veröffentlichungen starten ausgeblendet, und es wird ein Audit-Log-Eintrag `user.moderation.auto` erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilenbelege für Moderatoren aufbewahrt, blenden Inhalte aber nicht aus und entscheiden den öffentlichen Scan-Befund nicht eigenständig. Neue Uploads bleiben im Prüf-/Ausstehend-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches Scanning blockiert nur bei bösartigen Signaturen sofort. Treffer der VirusTotal-Engine bleiben als sichtbare Sicherheitsbelege erhalten, aber VirusTotal Code Insight/Palm-Befunde sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen behalten zweckkonforme Hinweise als Orientierung bei. Mittlere Prüfbefunde bleiben am Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-Bedenken, bösartige Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Administratoren können eine falsch-positive Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt Skills wieder her, die durch die Sperre auf Benutzerebene ausgeblendet wurden, und schreibt einen Audit-Log-Eintrag `user.moderation.lift`. Skills, die aus anderen Gründen ausgeblendet wurden oder deren eigener statischer Scan weiterhin bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Listings führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, kontaktieren Sie security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Benutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen ClawScan-Hinweis des Publishers hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten aufweist
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Probeläufe vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
