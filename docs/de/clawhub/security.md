---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Wiederherstellung eines zurückgehaltenen, ausgeblendeten oder blockierten Eintrags
summary: Vertrauens-, Prüf-, Melde- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Nutzern helfen, zu prüfen, was sie installieren, Publishern einen Wiederherstellungspfad für Fehlalarme geben und missbräuchliche Pakete aus der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## Was Nutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins dessen ClawHub-Eintrag auf:

- Inhaber und Quellenzuordnung
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Berichte, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Inhaber sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, aber die praktische Bedeutung ist dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert wird, sollten Nutzer sie nicht installieren, bis der Inhaber das Problem behoben hat oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans betrachten das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Nutzer sie vor der Installation sehen können.

Scan-Befunde basieren auf Artefakten. Erwartetes Provider-Verhalten, etwa deklarierte API-Anmeldedaten, lokale OAuth-Callbacks, bereinigte Deinstallation im festgelegten Umfang, Basic-Auth-Codierung oder vom Nutzer ausgewählte Datei-Uploads an den angegebenen Provider, wird anders behandelt als versteckte Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien, nicht zugehörige Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenzuordnung, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor bei ClawHub gehostete Plugins installiert werden. Paketdatensätze können auch Digest-Metadaten offenlegen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan berücksichtigt bei der Prüfung von Plugin-Veröffentlichungen deklarierte `openclaw.environment`-env/config-Metadaten des Pakets, sodass deklarierte Laufzeitanforderungen mit dem beobachteten Verhalten verglichen werden.

## Meldungen

Angemeldete Nutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und handlungsorientiert sein. Missbrauch des Meldesystems kann selbst zu Maßnahmen gegen das Konto führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsnachahmung
- böswillige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skills oder Plugins einen optionalen ClawScan-Hinweis bereitstellen. Dieser Hinweis gibt ClawScan Kontext zu Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native Hosts oder provider-spezifische Anmeldedaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als schädlich markiert, wird der Publisher automatisch unter eine Moderationssperre gesetzt (`requiresModerationAt` wird für den Nutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, künftige Veröffentlichungen starten ausgeblendet, und es wird ein Audit-Log-Eintrag `user.moderation.auto` erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren gespeichert, aber sie blenden Inhalte nicht aus und bestimmen nicht eigenständig das öffentliche Scan-Urteil. Neue Uploads bleiben im Prüf-/Ausstehend-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches Scannen blockiert nur bei schädlichen Signaturen sofort. Treffer von VirusTotal-Engines bleiben als sichtbare Sicherheitsnachweise erhalten, aber VirusTotal Code Insight/Palm-Urteile sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen behalten zweckbezogene Hinweise als Orientierung bei. Mittlere Prüfbefunde bleiben auf dem Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-Bedenken, schädliche Befunde oder bestätigte Erkennungen durch AV-Engines reserviert ist.

Admins können eine falsch positive Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies entfernt `requiresModerationAt` und `requiresModerationReason`, stellt durch die nutzerweite Sperre ausgeblendete Skills wieder her und schreibt einen Audit-Log-Eintrag `user.moderation.lift`. Skills, die aus anderen Gründen ausgeblendet wurden oder deren eigener statischer Scan weiterhin schädlich ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinien verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, wenden Sie sich für eine Wiederherstellungsprüfung an security@openclaw.ai.

## Hinweise für Publisher

Um Fehlalarme zu reduzieren und das Vertrauen der Nutzer zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen Publisher-ClawScan-Hinweis hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten aufweist
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Trockenläufe vor der Veröffentlichung von Plugins
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Paketverhalten fragen
