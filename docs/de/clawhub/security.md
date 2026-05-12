---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Wiederherstellung nach einem zurückgehaltenen, ausgeblendeten oder blockierten Eintrag
summary: Vertrauens-, Scan-, Melde- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist für Veröffentlichungen offen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzern helfen, zu prüfen, was sie installieren, Publishern einen Wiederherstellungsweg bei False Positives geben und missbräuchliche Pakete aus der öffentlichen Entdeckung heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skills oder Plugins dessen ClawHub-Eintrag auf:

- Owner- und Quellenangabe
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für Owner sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Das Release erfordert Vorsicht oder Überprüfung.
- `malicious`: Das Release gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Das Release ist auf öffentlichen Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, die praktische Bedeutung ist jedoch dieselbe: Wenn ein Release zurückgehalten oder blockiert ist, sollten Benutzer es nicht installieren, bis der Owner das Problem behoben hat oder die Moderation es wiederherstellt.

## Skills

Skill-Scans betrachten das veröffentlichte Skill-Bundle, Metadaten, deklarierte Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und dem, was er offenbar tut. Ein Skill, der beispielsweise einen erforderlichen API-Schlüssel referenziert, sollte diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der Installation sehen können.

Scan-Befunde sind artefaktbasiert. Erwartetes Provider-Verhalten, wie deklarierte API-Anmeldedaten, localhost-OAuth-Callbacks, bereichsbezogene Bereinigung bei der Deinstallation, Basic-Auth-Kodierung oder vom Benutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird anders behandelt als versteckte Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien, nicht zugehörige Netzwerkziele oder heimlicher Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Releases enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor von ClawHub gehostete Plugins installiert werden. Paketdatensätze können außerdem Digest-Metadaten offenlegen, damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan bezieht deklarierte `openclaw.environment`-Env-/Konfigurationsmetadaten von Paketen bei der Prüfung von Plugin-Releases ein, damit deklarierte Runtime-Anforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und umsetzbar sein. Missbrauch der Meldefunktion kann selbst zu Maßnahmen gegen das Konto führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Scam-Kommentare oder Imitation
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen die [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## Publisher-ClawScan-Hinweise

Publisher können beim Veröffentlichen eines Skills oder Plugins optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext zu Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native Hosts oder Provider-spezifische Anmeldedaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Publisher automatisch unter eine Moderationssperre gestellt (`requiresModerationAt` wird beim Benutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, zukünftige Veröffentlichungen starten ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilenbelege für Moderatoren aufbewahrt, sie blenden Inhalte jedoch nicht aus und bestimmen nicht eigenständig das öffentliche Scan-Urteil. Neue Uploads bleiben im Review-/Pending-Zustand, bis die LLM-Prüfung abgeschlossen ist. Statisches Scanning blockiert nur bei bösartigen Signaturen sofort. VirusTotal-Engine-Treffer bleiben als sichtbare Sicherheitsbelege erhalten, aber VirusTotal Code Insight/Palm-Urteile sind beratend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen behalten zweckkonforme Hinweise als Orientierung bei. Mittlere Review-Befunde bleiben auf dem Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-Bedenken, bösartige Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Admins können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt durch die benutzerbezogene Sperre ausgeblendete Skills wieder her und schreibt einen `user.moderation.lift`-Audit-Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet sind oder deren eigener statischer Scan weiterhin bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn die Anmeldung oder der normale CLI-Zugriff blockiert ist, kontaktieren Sie security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Publisher

Um False Positives zu reduzieren und das Vertrauen der Benutzer zu erhöhen:

- Halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen Publisher-ClawScan-Hinweis hinzu, wenn ein Release ungewöhnliches, aber beabsichtigtes Verhalten hat
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf die Quelle
- verwenden Sie Dry Runs vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
