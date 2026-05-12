---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Einen zurückgehaltenen, ausgeblendeten oder gesperrten Eintrag wiederherstellen
summary: Verhalten von ClawHub in Bezug auf Vertrauen, Scans, Meldungen und Moderation.
x-i18n:
    generated_at: "2026-05-12T15:42:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzer sollen prüfen können, was sie installieren, Publisher sollen einen Wiederherstellungspfad bei False Positives erhalten, und missbräuchliche Pakete sollen aus der öffentlichen Auffindbarkeit herausgehalten werden.

Siehe auch [Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins dessen ClawHub-Eintrag auf:

- Eigentümer- und Quellenangaben
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Status

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Eigentümer sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen Installationsflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, aber die praktische Bedeutung ist dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert wird, sollten Benutzer sie nicht installieren, bis der Eigentümer das Problem behebt oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der Installation sehen können.

Scan-Befunde basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte API-Anmeldedaten, localhost-OAuth-Callbacks, bereichsbezogene Deinstallationsbereinigung, Basic Auth-Codierung oder vom Benutzer ausgewählte Datei-Uploads an den angegebenen Provider, wird anders behandelt als versteckte Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien, nicht zugehörige Netzwerkziele oder verdeckter Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor von ClawHub gehostete Plugins installiert werden. Paketdatensätze können außerdem Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan bezieht deklarierte `openclaw.environment`-Umgebungs-/Konfigurationsmetadaten des Pakets ein, wenn Plugin-Veröffentlichungen geprüft werden, sodass deklarierte Laufzeitanforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und handlungsorientiert sein. Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsmissbrauch
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

## Publisher-ClawScan-Hinweise

Publisher können beim Veröffentlichen eines Skills oder Plugins einen optionalen ClawScan-Hinweis bereitstellen. Dieser Hinweis gibt ClawScan Kontext zu Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, nativer Host-Zugriff oder Provider-spezifische Anmeldedaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Publisher automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` wird für den Benutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, zukünftige Veröffentlichungen werden zunächst ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt, aber sie blenden Inhalte nicht aus und entscheiden nicht allein über das öffentliche Scan-Urteil. Neue Uploads bleiben im Review-/Pending-Status, bis die LLM-Prüfung abgeschlossen ist. Statisches Scanning blockiert nur bei bösartigen Signaturen sofort. Treffer von VirusTotal-Engines bleiben sichtbare Sicherheitsnachweise, aber VirusTotal Code Insight/Palm-Urteile sind empfehlend und blenden Skills nicht allein aus. ClawScan-LLM-Prüfungen behalten zweckbezogene Hinweise als Orientierung bei. Mittlere Review-Befunde bleiben auf dem Artefakt sichtbar, während der Filter für verdächtige Inhalte LLM-Bedenken mit hoher Auswirkung, bösartigen Befunden oder bestätigten AV-Engine-Erkennungen vorbehalten ist.

Admins können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt durch die Sperre auf Benutzerebene ausgeblendete Skills wieder her und schreibt einen `user.moderation.lift`-Audit-Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet wurden oder deren eigener statischer Scan weiterhin bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, kontaktieren Sie security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Publisher

So reduzieren Sie False Positives und verbessern das Vertrauen der Benutzer:

- Halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen Publisher-ClawScan-Hinweis hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten aufweist
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Probeläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
