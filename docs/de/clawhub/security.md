---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Melden eines Skills oder Pakets
    - Wiederherstellung eines zurückgehaltenen, ausgeblendeten oder gesperrten Eintrags
summary: Vertrauens-, Scan-, Reporting- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Nutzern helfen, das zu prüfen, was sie installieren, Publishern einen Wiederherstellungspfad bei falsch-positiven Treffern geben und missbräuchliche Pakete aus der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Nutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins den ClawHub-Eintrag auf:

- Eigentümer- und Quellenzuordnung
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
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen Installationsflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert wird, sollten Nutzer sie nicht installieren, bis der Eigentümer das Problem behoben hat oder die Moderation sie wieder freigibt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Nutzer sie vor der Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsbezogene Bereinigung bei der Deinstallation, Basic-Auth-Codierung oder vom Nutzer ausgewählte Datei-Uploads an den angegebenen Provider, wird anders behandelt als verdeckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien, nicht zugehörige Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenzuordnung, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor über ClawHub gehostete Plugins installiert werden. Paketdatensätze können außerdem Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan berücksichtigt bei der Prüfung von Plugin-Veröffentlichungen deklarierte Paketmetadaten zu `openclaw.environment` für env/config, sodass deklarierte Laufzeitanforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Nutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und handlungsrelevant sein. Missbrauch der Meldefunktion kann selbst zu Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsvortäuschung
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skills oder Plugins optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext zu Verhalten, das sonst ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native Hosts oder Provider-spezifische Zugangsdaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als schädlich markiert, wird der Publisher automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` wird für den Nutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, künftige Veröffentlichungen starten ausgeblendet, und es wird ein Audit-Log-Eintrag `user.moderation.auto` erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt, blenden Inhalte jedoch nicht aus und bestimmen für sich genommen nicht das öffentliche Scan-Urteil. Neue Uploads bleiben im Status review/pending, bis die LLM-Prüfung abgeschlossen ist. Statisches Scannen blockiert nur bei schädlichen Signaturen sofort. VirusTotal-Engine-Treffer bleiben als sichtbare Sicherheitsnachweise erhalten, aber VirusTotal Code Insight/Palm-Urteile sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen behalten zweckbezogene Hinweise als Orientierung bei. Mittlere Prüfbefunde bleiben am Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-Bedenken, schädliche Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Administratoren können eine falsch-positive Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt durch die nutzerweite Sperre ausgeblendete Skills wieder her und schreibt einen Audit-Log-Eintrag `user.moderation.lift`. Skills, die aus anderen Gründen ausgeblendet sind oder deren eigener statischer Scan weiterhin schädlich ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Weboberfläche an, um den Kontostatus zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff blockiert sind, wenden Sie sich für eine Wiederherstellungsprüfung an security@openclaw.ai.

## Hinweise für Publisher

So reduzieren Sie falsch-positive Treffer und verbessern das Vertrauen der Nutzer:

- Halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen ClawScan-Hinweis des Publishers hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten hat
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Dry Runs, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren Fragen zum Paketverhalten stellen
