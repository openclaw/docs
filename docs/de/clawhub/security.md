---
read_when:
    - ClawHub-Scan- und Moderationsergebnisse verstehen
    - Einen Skill oder ein Paket melden
    - Wiederherstellung bei einer zurückgehaltenen, ausgeblendeten oder blockierten Listung
summary: Vertrauens-, Scan-, Melde- und Moderationsverhalten von ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit + Moderation

ClawHub steht für Veröffentlichungen offen, aber öffentliche Listings durchlaufen
weiterhin Vertrauens-, Scan-, Melde- und Moderationskontrollen. Das Ziel ist
praktisch: Benutzern helfen, zu prüfen, was sie installieren, Herausgebern einen
Wiederherstellungspfad bei False Positives geben und missbräuchliche Pakete aus
der öffentlichen Auffindbarkeit heraushalten.

Siehe auch [Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## Was Benutzer prüfen können

Prüfen Sie vor der Installation eines Skill oder Plugin dessen ClawHub-Listing auf:

- Inhaber- und Quellenangabe
- neueste Version und Changelog
- erforderliche Umgebungsvariablen oder Berechtigungen
- Kompatibilitätsmetadaten für Plugins
- Scan- oder Moderationsstatus
- Meldungen, Kommentare, Sterne, Downloads und Installationssignale, sofern angezeigt

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Scan-Zustände

ClawHub kann Scan- oder Moderationsergebnisse auf öffentlichen Seiten und in für
Inhaber sichtbaren Diagnosen anzeigen.

Häufige Ergebnisse sind:

- `clean`: Es wurde kein blockierendes Problem gefunden.
- `suspicious`: Die Veröffentlichung erfordert Vorsicht oder Prüfung.
- `malicious`: Die Veröffentlichung gilt als unsicher.
- `pending`: Die Prüfungen sind noch nicht abgeschlossen.
- `held`, `quarantined`, `revoked` oder `hidden`: Die Veröffentlichung ist auf
  öffentlichen Installationsoberflächen nicht vollständig verfügbar.

Die genaue Formulierung kann je nach Oberfläche variieren, aber die praktische
Bedeutung ist dieselbe: Wenn eine Veröffentlichung zurückgehalten oder blockiert
wird, sollten Benutzer sie nicht installieren, bis der Inhaber das Problem löst
oder die Moderation sie wiederherstellt.

## Skills

Skill-Scans prüfen das veröffentlichte Skill-Bundle, Metadaten, deklarierte
Anforderungen und verdächtige Anweisungen.

ClawHub achtet besonders auf Abweichungen zwischen dem, was ein Skill deklariert,
und dem, was es offenbar tut. Beispielsweise sollte ein Skill, das einen
erforderlichen API-Schlüssel referenziert, diese Anforderung in `SKILL.md`
deklarieren, damit Benutzer sie vor der Installation sehen können.

Scan-Ergebnisse basieren auf Artefakten. Erwartetes Provider-Verhalten, wie
deklarierte API-Anmeldedaten, localhost-OAuth-Callbacks, bereichsbezogene
Deinstallationsbereinigung, Basic-Auth-Codierung oder vom Benutzer ausgewählte
Datei-Uploads zum angegebenen Provider, wird anders behandelt als versteckte
Weiterleitung von Anmeldedaten, breiter Zugriff auf private Dateien, nicht
zugehörige Netzwerkziele oder heimlicher Browsermissbrauch.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugin-Veröffentlichungen enthalten Paketmetadaten, Quellenangaben,
Kompatibilitätsfelder und Informationen zur Artefaktintegrität.

OpenClaw prüft die Kompatibilität, bevor über ClawHub gehostete Plugins
installiert werden. Paketdatensätze können außerdem Digest-Metadaten offenlegen,
damit OpenClaw heruntergeladene Artefakte verifizieren kann. ClawScan bezieht
deklarierte Paketmetadaten zu `openclaw.environment` für Env/Konfiguration ein,
wenn Plugin-Veröffentlichungen geprüft werden, damit deklarierte
Laufzeitanforderungen mit beobachtetem Verhalten verglichen werden.

## Meldungen

Angemeldete Benutzer können Skills, Pakete und Kommentare melden.

Meldungen sollten konkret und umsetzbar sein. Missbrauch der Meldefunktion kann
selbst zu Kontomaßnahmen führen.

Beispiele für Meldungen:

- irreführende Metadaten
- nicht deklarierte Anforderungen an Anmeldedaten oder Berechtigungen
- verdächtige Installationsanweisungen
- Betrugskommentare oder Identitätsnachahmung
- Registrierungen in böser Absicht oder Markenmissbrauch
- Inhalte, die gegen [Akzeptable Nutzung](/de/clawhub/acceptable-usage) verstoßen

## ClawScan-Hinweise für Herausgeber

Herausgeber können beim Veröffentlichen eines Skill oder Plugin optional einen
ClawScan-Hinweis angeben. Dieser Hinweis gibt ClawScan Kontext für Verhalten, das
andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff, Zugriff auf native
Hosts oder Provider-spezifische Anmeldedaten.

## Moderationssperren

Wenn der statische Scanner ein hochgeladenes Skill als bösartig markiert, wird
der Herausgeber automatisch unter eine Moderationssperre gestellt
(`requiresModerationAt` beim Benutzer gesetzt). Dadurch werden alle Skills des
Herausgebers ausgeblendet, künftige Veröffentlichungen beginnen ausgeblendet,
und ein Audit-Log-Eintrag `user.moderation.auto` wird erstellt.

Statische verdächtige Befunde werden als Datei-/Zeilennachweise für Moderatoren
aufbewahrt, aber sie blenden Inhalte nicht aus und entscheiden nicht allein über
das öffentliche Scan-Urteil. Neue Uploads bleiben im Review-/Pending-Zustand,
bis die LLM-Prüfung abgeschlossen ist. Statisches Scannen blockiert nur bei
bösartigen Signaturen sofort. Treffer von VirusTotal-Engines bleiben sichtbare
Sicherheitsnachweise, aber VirusTotal-Code-Insight-/Palm-Urteile sind beratend
und blenden Skills nicht allein aus. ClawScan-LLM-Prüfungen behalten
zweckbezogene Hinweise als Orientierung bei. Mittlere Review-Befunde bleiben am
Artefakt sichtbar, während der Verdachtsfilter für schwerwiegende LLM-Bedenken,
bösartige Befunde oder bestätigte AV-Engine-Erkennungen reserviert ist.

Admins können eine False-Positive-Sperre aufheben:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dies löscht `requiresModerationAt` und `requiresModerationReason`, stellt durch
die benutzerbezogene Sperre ausgeblendete Skills wieder her und schreibt einen
Audit-Log-Eintrag `user.moderation.lift`. Skills, die aus anderen Gründen
ausgeblendet wurden oder deren eigener statischer Scan weiterhin bösartig ist,
bleiben ausgeblendet.

## Sperren und Kontostatus

Konten, die gegen die ClawHub-Richtlinie verstoßen, können den
Veröffentlichungszugriff verlieren. Schwerer Missbrauch kann zu Kontosperren,
Token-Widerruf, ausgeblendeten Inhalten oder entfernten Listings führen.

Gelöschte, gesperrte oder deaktivierte Konten können keine ClawHub-API-Tokens
verwenden. Wenn die CLI-Authentifizierung nach einer Kontomaßnahme fehlschlägt,
melden Sie sich in der Web-UI an, um den Kontostatus zu prüfen. Wenn Anmeldung
oder normaler CLI-Zugriff blockiert sind, wenden Sie sich zur
Wiederherstellungsprüfung an security@openclaw.ai.

## Hinweise für Herausgeber

So reduzieren Sie False Positives und stärken das Benutzervertrauen:

- halten Sie Namen, Zusammenfassungen, Tags und Changelogs korrekt
- deklarieren Sie erforderliche Umgebungsvariablen und Berechtigungen
- fügen Sie einen ClawScan-Hinweis des Herausgebers hinzu, wenn eine Veröffentlichung ungewöhnliches, aber beabsichtigtes Verhalten hat
- vermeiden Sie verschleierte Installationsbefehle
- verlinken Sie, wenn möglich, auf die Quelle
- verwenden Sie Probeläufe vor dem Veröffentlichen von Plugins
- antworten Sie klar, wenn Benutzer oder Moderatoren nach dem Paketverhalten fragen
