---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Zurückgehaltenen, ausgeblendeten oder blockierten Eintrag wiederherstellen
summary: Verhalten von ClawHub in Bezug auf Vertrauen, Scans, Meldungen und Moderation.
x-i18n:
    generated_at: "2026-05-11T22:20:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub ist offen für Veröffentlichungen, aber öffentliche Einträge durchlaufen weiterhin Vertrauens-,
Scan-, Melde- und Moderationskontrollen. Das Ziel ist praktisch: Benutzern helfen,
zu prüfen, was sie installieren, Publishern einen Wiederherstellungsweg bei False Positives geben
und missbräuchliche Pakete aus der öffentlichen Entdeckung heraushalten.

Siehe auch [Zulässige Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skill oder Plugin dessen ClawHub-Eintrag auf:

- Inhaber- und Quellenangaben
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Status

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für
Inhaber sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Das Release erfordert Vorsicht oder Prüfung.
- `malicious`: Das Release gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Das Release ist auf öffentlichen
  Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, aber die praktische Bedeutung ist dieselbe: Wenn ein
Release zurückgehalten oder blockiert ist, sollten Benutzer es nicht installieren, bis der Inhaber das
Problem behebt oder die Moderation es wiederherstellt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert, und
dem, was er offenbar tut. Beispielsweise sollte ein Skill, der auf einen erforderlichen API-Schlüssel
verweist, diese Anforderung in `SKILL.md` deklarieren, damit Benutzer sie vor der
Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, wie deklarierte
API-Zugangsdaten, localhost-OAuth-Callbacks, bereichsbezogene Deinstallationsbereinigung, Basic Auth-
Kodierung oder vom Benutzer ausgewählte Datei-Uploads zum angegebenen Provider, wird
anders behandelt als versteckte Weiterleitung von Zugangsdaten, breiter Zugriff auf private Dateien,
unabhängige Netzwerkziele oder heimlicher Browser-Missbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Releases enthalten Paketmetadaten, Quellenangaben, Kompatibilitätsfelder
und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor über ClawHub gehostete Plugins installiert werden. Paket-
Datensätze können außerdem Digest-Metadaten offenlegen, damit OpenClaw heruntergeladene
Artefakte verifizieren kann. ClawScan berücksichtigt deklarierte Paket-`openclaw.environment`-Env-/Config-
Metadaten bei der Prüfung von Plugin-Releases, sodass deklarierte Laufzeitanforderungen mit
beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und handlungsorientiert sein. Missbrauch der Meldefunktion kann selbst zu
Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Zugangsdaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsnachahmung
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen [Zulässige Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Publisher

Publisher können beim Veröffentlichen eines Skill oder
Plugin optional einen ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext für Verhalten, das andernfalls
ungewöhnlich wirken könnte, wie Netzwerkzugriff, nativer Host-Zugriff oder Provider-spezifische
Zugangsdaten.

## Moderationssperren

Wenn der statische Scanner einen hochgeladenen Skill als bösartig markiert, wird der Publisher
automatisch unter eine Moderationssperre gesetzt (`requiresModerationAt` wird für den
Benutzer gesetzt). Dadurch werden alle Skills des Publishers ausgeblendet, künftige Veröffentlichungen
beginnen ausgeblendet, und es wird ein `user.moderation.auto`-Audit-Log-Eintrag erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren aufbewahrt,
blenden Inhalte jedoch nicht aus und bestimmen nicht eigenständig das öffentliche Scan-Urteil.
Neue Uploads bleiben im Prüf-/Ausstehend-Status, bis die LLM-Prüfung abgeschlossen ist. Statisches
Scannen blockiert nur bei bösartigen Signaturen sofort. VirusTotal-Engine-
Treffer bleiben als sichtbare Sicherheitsnachweise erhalten, aber VirusTotal Code Insight/Palm-
Urteile sind empfehlend und blenden Skills nicht eigenständig aus. ClawScan-LLM-Prüfungen
behalten zweckorientierte Hinweise als Orientierung bei. Befunde mittlerer Schwere bleiben auf
dem Artefakt sichtbar, während der Verdachtsfilter hochwirksamen LLM-
Bedenken, bösartigen Befunden oder bestätigten AV-Engine-Erkennungen vorbehalten ist.

Admins können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies entfernt `requiresModerationAt` und `requiresModerationReason`, stellt
durch die benutzerweite Sperre ausgeblendete Skills wieder her und schreibt einen `user.moderation.lift`-Audit-
Log-Eintrag. Skills, die aus anderen Gründen ausgeblendet sind oder deren eigener statischer Scan weiterhin
bösartig ist, bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den Veröffentlichungszugriff verlieren. Schwerer Missbrauch
kann zu Kontosperren, Token-Widerruf, ausgeblendeten Inhalten oder entfernten
Einträgen führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Token verwenden. Wenn die CLI-Authentifizierung
nach einer Kontomaßnahme fehlschlägt, melden Sie sich in der Web-UI an, um den Konto-
Status zu prüfen. Wenn Anmeldung oder normaler CLI-Zugriff blockiert sind, kontaktieren Sie
security@openclaw.ai für eine Wiederherstellungsprüfung.

## Hinweise für Publisher

Um False Positives zu reduzieren und das Vertrauen der Benutzer zu erhöhen:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen Publisher-ClawScan-Hinweis hinzu, wenn ein Release ungewöhnliches, aber beabsichtigtes Verhalten hat
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie nach Möglichkeit auf den Quellcode
- verwenden Sie Dry Runs vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
