---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Melden eines Skills oder Pakets
    - Wiederherstellung eines zurückgehaltenen, ausgeblendeten oder gesperrten Eintrags
summary: Vertrauens-, Scan-, Melde- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, öffentliche Einträge durchlaufen jedoch weiterhin Vertrauens-,
Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Nutzern helfen,
zu prüfen, was sie installieren, Herausgebern einen Wiederherstellungspfad bei Fehlalarmen geben
und missbräuchliche Pakete aus der öffentlichen Suche heraushalten.

Siehe auch [Akzeptable Nutzung](/de/clawhub/acceptable-usage).

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

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Eigentümer sichtbaren
Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf öffentlichen
  Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn eine
Veröffentlichung zurückgehalten oder blockiert ist, sollten Nutzer sie nicht installieren, bis der Eigentümer das
Problem behoben hat oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und
dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert,
sollte diese Anforderung in `SKILL.md` deklarieren, damit Nutzer sie vor der
Installation sehen können.

Scan-Befunde sind artefaktbasiert. Erwartetes Provider-Verhalten, wie deklarierte
API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsbezogene Deinstallationsbereinigung, Basic-Auth-
Kodierung oder vom Nutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird
anders behandelt als versteckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien,
nicht zugehörige Netzwerkziele oder heimlicher Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenzuordnung, Kompatibilitätsfelder
und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor auf ClawHub gehostete Plugins installiert werden. Paket-
Datensätze können auch Digest-Metadaten bereitstellen, damit OpenClaw heruntergeladene
Artefakte verifizieren kann. ClawScan bezieht deklarierte Paket-`openclaw.environment`-Env-/Konfigurations-
Metadaten bei der Prüfung von Plugin-Veröffentlichungen ein, sodass deklarierte Laufzeitanforderungen
mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Nutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und umsetzbar sein. Missbrauch des Meldesystems kann selbst zu
Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsnachahmung
- bösgläubige Registrierungen oder Markenmissbrauch
- Inhalte, die gegen die [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Herausgeber

Herausgeber können beim Veröffentlichen eines Skills oder
Plugins optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext zu Verhalten, das sonst
ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf den nativen Host oder providerspezifische
Zugangsdaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als schädlich markiert, wird der Herausgeber
automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` ist beim
Nutzer gesetzt). Dadurch werden alle Skills des Herausgebers ausgeblendet, zukünftige Veröffentlichungen
starten ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren gespeichert,
blenden Inhalte jedoch nicht aus und entscheiden nicht allein über das öffentliche Scan-Urteil.
Neue Uploads bleiben im Prüf-/Ausstehend-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches
Scannen blockiert nur bei schädlichen Signaturen sofort. Treffer von VirusTotal-Engines
bleiben als sichtbare Sicherheitsnachweise erhalten, aber VirusTotal Code Insight/Palm-
Urteile sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen
behalten zweckbezogene Hinweise als Orientierung bei. Mittlere Prüfbefunde bleiben auf
dem Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-
Bedenken, schädliche Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Admins können eine falsch positive Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies entfernt `requiresModerationAt` und `requiresModerationReason`, stellt
durch die nutzerbezogene Sperre ausgeblendete Skills wieder her und schreibt einen `user.moderation.lift`-Audit-
Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet sind oder deren eigener statischer Scan weiterhin
schädlich ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch
kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten
Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den
Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, kontaktieren Sie
security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Herausgeber

Um Fehlalarme zu reduzieren und das Nutzervertrauen zu verbessern:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen ClawScan-Hinweis für Herausgeber hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten hat
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Trockenläufe, bevor Sie Plugins veröffentlichen
- antworten Sie klar, wenn Nutzer oder Moderatoren nach dem Paketverhalten fragen
