---
read_when:
    - Sie implementieren oder überprüfen eine Phase der Neugestaltung des Onboardings
summary: Implementierungsplan für die Neugestaltung des Custodian-Onboardings (fortlaufend aktualisiertes Dokument)
title: Neugestaltung des Onboardings
x-i18n:
    generated_at: "2026-07-24T04:58:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f892991583d0b77a670e9bf7aa5a0c74af3b3eac9e7b0448706486254eb7e2a0
    source_path: start/onboarding-redesign.md
    workflow: 16
---

# Implementierungsplan für die Neugestaltung des Onboardings

> **Fortlaufend aktualisiertes Dokument.** Diese Seite verfolgt die Neugestaltung des Custodian-Onboardings auf
> Implementierungsebene und wird mit Abschluss jeder Phase aktualisiert. Wenn die letzte Phase
> zusammengeführt wird, wird diese Seite als benutzerorientierter Onboarding-Leitfaden neu verfasst und in
> die Dokumentationsnavigation aufgenommen. Bis dahin ist sie absichtlich nicht in `docs.json` enthalten.

## Leitbild

Ein technisch nicht versierter Benutzer gibt `openclaw onboard` ein (oder öffnet die App) und wird
von einer einzigen dialogorientierten Präsenz begrüßt — OpenClaw, dem System-Custodian („Custodian“ ist
nur die interne Bezeichnung; dem Benutzer wird immer „OpenClaw“ angezeigt) —, die seine KI findet,
alles mit angekündigten Standardwerten statt mit Fragen einrichtet, seinen
Agenten in einem sichtbaren Identitätsmoment schlüpfen lässt und danach dauerhaft als
Betreuer des Systems erreichbar bleibt. Standardmäßig magisch, eine Zustimmungsgrenze, keine Sackgassen.

Designprinzipien (beschlossen, nicht beiläufig erneut diskutieren):

- **Angekündigte Standardwerte mit einfacher Rückgängigmachung** ersetzen blockierende Fragen. Die einzige
  zwingende Voraussetzung ist eine funktionierende Inferenz; alles andere ist ein Angebot.
- **Frage null ist die Zustimmungsgrenze**: „Vollzugriff“ (empfohlen) bedeutet,
  dass die Erkennung unauffällig und automatisch erfolgt; „Zuerst fragen“ stellt jede Erkennung — das Scannen
  nach KI, Apps und Speicherquellen gleichermaßen — hinter ein einziges
  ausdrückliches Ja, mit einem vollständig manuellen Pfad, der niemals scannt.
- **Konversation als Benutzeroberfläche mit fortschreitender Intelligenz**: Die Custodian-Oberfläche
  ist bereits vorhanden, bevor eine KI funktioniert (skriptgesteuerter Dialog), wird in dem
  Moment modellgestützt, in dem eine Route verifiziert ist, und weist sichtbar darauf hin. Sie täuscht niemals Intelligenz vor:
  Freitexteingaben vor der Verifizierung einer Route erhalten ein freundliches „Lassen Sie mich zuerst
  mein Gehirn zum Laufen bringen“.
- **Das Schlüpfen ist eine Zeremonie**: derselbe Thread, Avatarwechsel, der Agent gibt sich selbst
  einen Namen und wählt sein eigenes Gesicht. Der Custodian erklärt die Hierarchie einmalig: „Fragen Sie mich
  zum System oder fragen Sie einfach Ihren Agenten — er leitet es weiter.“
- **Vertrauen ist nach Quelle abgestuft**: Einträge aus dem offiziellen Katalog dürfen vorausgewählt sein;
  Skills von Drittanbietern aus ClawHub werden unabhängig von der
  Modellbewertung niemals vorausgewählt, und ihre Beschriftungen weisen darauf hin, dass sie den Code des Herausgebers installieren.
- **Konfigurierte Installationen sind unantastbar**: Ein erneutes Ausführen des Onboardings ist ein Verifizierungsdurchlauf.
  Die Einrichtung wird niemals erneut angewendet und der Gateway-Dienst niemals neu gestartet.
- **Das Terminal ist der Rückfallpfad, keine Frage**: Wenn ein Gateway erreichbar ist,
  wird das Browser-Dashboard bevorzugt; es wird niemals „Terminal oder Browser?“ gefragt.
- **Schwache Modelle erhalten eine reduzierte Oberfläche** (automatisch `localModelLean`), die mit
  einfachen Worten erklärt wird — niemals anhand von Tools, Codemodus oder Kontextfenstern.

## Aktuell ausgelieferter Ablauf (nach den Phasen 1–3)

`openclaw onboard` bei einer neuen macOS-Installation, idealer Ablauf — insgesamt viermal Eingabetaste:

1. Sicherheitshinweis → einmal Eingabetaste zur Bestätigung (wird gespeichert; nie erneut abgefragt).
2. **Frage null**: „Wie soll ich alles einrichten?“ — Vollzugriff (empfohlen)
   oder Zuerst fragen. Wird als `wizard.accessMode` gespeichert; bei erneuten Durchläufen ist die gespeicherte
   Auswahl voreingestellt. Abgesichert + „manuell konfigurieren“ führt ohne
   jegliches Scannen zur Provider-Auswahl und überspringt auch das Scannen nach Speicherquellen.
3. **Erkennungsinszenierung**: Erkennt Coding-CLIs, Umgebungsschlüssel und lokale Laufzeitumgebungen;
   gibt beim Auffinden von Coding-Agenten einen humorvollen Kommentar aus; testet Kandidaten der Reihe nach live und
   fasst Fehler unauffällig in einer einzigen Zeile zusammen (Details unter „Weitere
   Optionen anzeigen“). Die erste funktionierende Route wird als Standard angekündigt und bietet
   einen mit einem Tastendruck erreichbaren Pfad zur vollständigen Auswahl; beim Erkunden und Überspringen bleibt die
   funktionierende Route erhalten.
4. Angebot zum Speicherimport (Claude Code / Codex / Hermes), wird übersprungen, wenn die Erkennung
   abgelehnt wurde.
5. Nur bei neuen Installationen: Der Standard-Einrichtungsplan wird automatisch angewendet
   (Arbeitsbereich, Gateway-Dienst, Sitzungen — derselbe Plan, den das dialogorientierte
   „Ja“ ausführt). Konfigurierte Installationen geben „bereits eingerichtet“ aus und verändern den
   Dienst niemals.
6. **App-Empfehlungen**: Installierte Apps werden vom verifizierten Modell
   mit offiziellen Katalogen und ClawHub abgeglichen; offizielle Kanal-Plugins sind
   vorausgewählt, Drittanbieter-Skills müssen mit einer Warnbeschriftung explizit ausgewählt werden. Überspringbar;
   Deaktivierungsschalter `wizard.appRecommendations`.
7. **Schlüpfen**: Wenn ein Gateway erreichbar ist, öffnet die Browser-Übergabe (GUI)
   das Dashboard oder gibt dessen URL aus (headless/SSH) und wartet auf die Verbindung der Control UI
   — „Dashboard verbunden — Fortsetzung in Ihrem Browser.“ Andernfalls oder
   mit `--tui` wird die Terminal-TUI mit der Bootstrap-Schlüpfnachricht
   vorbelegt geöffnet und der Agent stellt sich vor.

Das Onboarding für Remote-Gateways behält seine bisherige dialogorientierte Übergabe bei
(`handoffMode: "chat"`); die Einrichtung muss auf dem Remote-Gateway angewendet werden.

## Phasen

| #   | Phase                                                                                                                                                     | Oberfläche              | Status                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Plugin-Empfehlungen für installierte Apps (Scan, Kandidaten, KI-Abgleich, Assistentenschritt, Node-Befehl `device.apps`)                              | klassische + geführte CLI | zusammengeführt ([#109668](https://github.com/openclaw/openclaw/pull/109668))                                                     |
| 2   | CLI-Custodian-Grundgerüst (Frage null, Erkennungsinszenierung, automatische Anwendung + Schlüpfen)                                                        | geführte CLI            | zusammengeführt ([`a83ed13204f1`](https://github.com/openclaw/openclaw/commit/a83ed13204f118adf1009e5ac88d5afe1905b86c))                  |
| 3   | Browserorientierte Übergabe (Erkennung der GUI-Sitzung, Warten auf Dashboard-Verbindung, TUI als Rückfallpfad)                                           | CLI → Web               | zusammengeführt ([#110054](https://github.com/openclaw/openclaw/pull/110054))                                                     |
| 4   | Web-Custodian-Oberfläche (Optionskarten, typisiertes Feld `question` in `openclaw.chat`, Spiegelung der Assistentenschritte, Übergabe beim ersten Start) | Control UI              | zusammengeführt ([#110141](https://github.com/openclaw/openclaw/pull/110141), [#110242](https://github.com/openclaw/openclaw/pull/110242)) |
| 5   | Schlüpfen und Bootstrap (Empfehlungsspeicher mit Einmal-Semantik, selbstbenennende Geburtssequenz, automatische Schlüpfübergabe nach neuer Einrichtung; Avatar-Abstufung vertagt) | Agent-Bootstrap         | zusammengeführt ([#110173](https://github.com/openclaw/openclaw/pull/110173), [#110331](https://github.com/openclaw/openclaw/pull/110331)) |
| 6   | Custodian-Präsenz PR1 (angehefteter Seitenleisteneintrag, OpenClaw fragen in den Einstellungen, Betreuerbegrüßung im normalen Oberflächenrahmen; Ereigniskommentare und Kanalaufruf folgen in PR2) | Web + Kanäle            | zusammengeführt ([#110269](https://github.com/openclaw/openclaw/pull/110269))                                                     |
| 7   | Ausfallsicherheit (Custodian bei fehlerhafter Konfiguration erreichbar, Rettung teilweise funktionsfähiger Oberflächen, automatische Diagnose)           | Gateway                 | Folgearbeit                                                                                                                       |

## Implementierungshinweise je Phase

### Phase 1 — App-Empfehlungen (PR #109668)

- Scanner: `src/infra/installed-apps.ts` (macOS-Auflistung ohne TCC; folgt
  über symbolische Links eingebundenen `.app`-Bundles).
- Kandidaten: offizielle Kataloge + ClawHub-Suche, insgesamt 20 s Zeitbudget, bei
  Offlinebetrieb kontrollierte Reduzierung auf reine Katalogkandidaten. Katalogeinträge sind Paket-
  Manifeste ohne ein `id` auf oberster Ebene — Kandidaten werden anhand der aufgelösten
  Plugin-ID indiziert (Regressionstest mit den tatsächlichen mitgelieferten Katalogen; eine Indizierung anhand
  von `entry.id` führte einst dazu, dass der gesamte Katalog zusammenfiel und jede offizielle
  Empfehlung verworfen wurde).
- KI-Abgleich: eine Vervollständigung über die verifizierte Route
  (`src/system-agent/setup-app-recommendations.ts`); keine kuratierte Bundle-ID-Zuordnung —
  das Modell verwirft zufällige Namensüberschneidungen. Die Ausgabe wird durch das eigene
  `maxTokens`-Budget des aufgelösten Modells begrenzt (die Streaming-Schicht wendet es an, wenn keine
  explizite Obergrenze übergeben wird).
- **Schutz der Lieferkette**: Der ClawHub-Auflistungstext wird vom Herausgeber kontrolliert und
  gelangt in den Abgleich-Prompt, sodass ein Eintrag sich selbst als
  „empfohlen“ bewerben kann. Nur Einträge aus dem offiziellen Katalog dürfen vorausgewählt sein; ClawHub-
  Skills erfordern immer eine ausdrückliche Auswahl und sind mit „Drittanbieter-Skill aus ClawHub;
  installiert den Code seines Herausgebers“ beschriftet.
- Node-Befehl `device.apps` (TS-Node-Host, Parität mit Android-Umschlag), Freigabe
  standardmäßig deaktiviert; Gateway-Deaktivierungsschalter `wizard.appRecommendations`.
- Die Bereitstellung erfolgt im klassischen Assistenten und im geführten Custodian-Ablauf
  (`src/wizard/setup.app-recommendations.ts`); die Verlagerung an das Ende des Bootstraps
  bleibt Phase 5 vorbehalten (der Dienst akzeptiert bereits eine injizierbare Inventarquelle).
  Die Einmal-Semantik (Angebot nur bis zur Annahme, gespeicherter Scan) wird ebenfalls
  mit dem Speicher aus Phase 5 eingeführt; derzeit wird das Angebot bei einem erneuten Durchlauf erneut angezeigt.
- Ebenfalls behoben: Benutzerdefinierte `completeSetupInference`-Prompts übernehmen nicht länger die
  Ausgabebegrenzung der Verifizierungssonde auf 32 Token (`SETUP_INFERENCE_TEST_MAX_TOKENS`
  gilt nur für die Sonde „mit OK antworten“).

### Phase 2 — CLI-Custodian-Grundgerüst (PR #109841)

- Überarbeitung des Ablaufs in `src/commands/onboard-guided.ts`; das Onboarding für Remote-Gateways
  behält über `handoffMode: "chat"` seine bisherige Chat-Übergabe bei.
- Frage null speichert `wizard.accessMode` („full“ | „guarded“); bei erneuten Durchläufen
  ist die gespeicherte Auswahl voreingestellt (das Akzeptieren des Standardwerts kann „guarded“ niemals unbemerkt
  auf „full“ herabstufen). Abgesichert + manuell verwendet
  `listManualSetupInferenceOptions` (nur Konfiguration/Manifeste, keine Sondierung) und
  überspringt das Scannen nach Speicherquellen.
- Erkennung: unauffällige Fehlererfassung (eine einzige Zusammenfassungszeile; Details unter
  „Weitere Optionen anzeigen“), humorvoller Kommentar zu Coding-Agenten, angekündigte Standardroute. Sitzungs-
  zahlen im Kommentar sind vertagt (vorerst nur qualitativ), bis eine kostengünstige
  Schnittstelle zur Sitzungszählung vorhanden ist.
- Neue Installationen: `applySystemAgentSetup` (das deterministische dialogorientierte
  „Ja“), anschließend Schlüpfen über `launchTuiCli`, vorbelegt mit der Bootstrap-Nachricht.
  Konfigurierte Installationen (bereits vorhandene Modell- oder Gateway-Konfiguration — Zeitstempel des Assistenten
  belegen nichts, da sie mit Konfiguration/Diagnose gemeinsam genutzt werden):
  nur Verifizierung — keine Anwendung, kein Neustart des Gateway-Dienstes. Bei einem Fehler während der Anwendung
  erfolgt ein Rückfall auf den dialogorientierten Chat.

### Phase 3 — browserorientierte Übergabe (PR #110054, zusammengeführt)

- `src/commands/onboard-browser-handoff.ts` ist für die reine Erkennung grafischer Sitzungen
  zuständig (`SSH_CONNECTION`/`SSH_TTY`; `DISPLAY`/`WAYLAND_DISPLAY` unter Linux)
  sowie für die Wartezeit von 60 Sekunden für die GUI bzw. 300 Sekunden für SSH. Das geführte Onboarding
  aktiviert die Übergabe derzeit nur unter macOS; `--tui` und andere Plattformen behalten den
  Terminal-Ausstieg. Die Aktivierung unter Linux/Windows erfolgt später.
- Dashboard-Links verwenden dieselben Hilfsfunktionen `resolveAdvertisedControlUiLinks`,
  `resolveLocalControlUiProbeLinks` und `buildOnboardingControlUiUrl`
  wie der klassische Abschluss. Zum Starten des Browsers wird die gemeinsame Hilfsfunktion `openUrl` verwendet.
- Die Bereitschaftsprüfung fragt den vorhandenen RPC `system-presence` als **Loopback-Client
  im CLI-Modus ab, der das konfigurierte gemeinsame Geheimnis vorlegt** – also über den vertrauenswürdigen Pfad, den jeder
  Befehl `openclaw` verwendet. Ein Control-UI-Client mit reiner Shared-Auth wird
  bei SecretRef-Gateways mit „Geräteidentität erforderlich“ abgelehnt. Die Vorabprüfung
  der Erreichbarkeit löst dasselbe Ziel (und Geheimnis) wie die Warteschleife auf, sodass
  Gate und Warteschleife bei der Authentifizierung niemals zu unterschiedlichen Ergebnissen kommen können. Die Übergabe wird nur abgeschlossen,
  wenn eine verbundene Präsenzzeile `openclaw-control-ui`/`webchat` gegenüber
  dem Ausgangszustand vor dem Start neu ist (ein bereits geöffnetes Dashboard kann
  sie nicht abschließen).
- `gateway.controlUi.enabled: false` bricht ab, bevor eine URL angezeigt wird.
- End-to-End gegen ein isoliertes Gateway mit derselben Konfiguration nachgewiesen: URL-Ausgabe → echte
  Browserverbindung → „Dashboard verbunden – fahren Sie in Ihrem Browser fort“ → kein
  Terminal-Ausstieg. Ein früherer Abbruch wegen „Token stimmt nicht überein“ war ein Artefakt
  des Test-Harness – siehe das Test-Playbook unten.

### Phase 4 – Web-Oberfläche des Custodian (zusammengeführt: #110141, #110242)

- Seite `/custodian` über `openclaw.chat` mit der Optionskarten-Komponente
  (2–4 Karten, höchstens eine Empfehlung, immer überspringbar); Onboarding-Rahmen über
  `?onboarding=1`; der Abschluss der erstmaligen Modelleinrichtung übergibt dorthin.
- Strukturierte Fragen sind ein typisiertes, additives Feld `question` in
  `SystemAgentChatResult` (Text `reply` je Option; Prosa steht für
  die macOS-App/TUI immer für sich allein). Erzeuger: beide Varianten der Onboarding-Begrüßung sowie
  Auswahl-/Bestätigungsschritte des gehosteten Assistenten mit 2–4 geschlossenen Optionen – echte Kanalassistenten
  werden als Karten dargestellt. Die Übergangslösung mit String-Markierungen aus PR1 wurde entfernt.
- Der Sitzungsbesitz ist auf die Gateway-URL und sämtliche vorgelegten Anmeldedaten
  begrenzt (Token, Passwort, Bootstrap-Token, gespeichertes Geräte-Token – bleibt
  über vorübergehende Hello-Abbrüche hinweg bestehen); fehlgeschlagene Benutzereingaben können niemals erneut abgespielt werden; vertrauliche
  Eingaben werden unverändert gesendet und im Transkript maskiert.

### Phase 5 – Ausstieg und Bootstrap (zusammengeführt: #110173, #110331)

- Der Custodian erstellt einen namenlosen Agenten (Tool-Aufruf); der Bootstrap des Agenten beginnt
  mit der eigenen Namensgebung. PR1 liefert die Zeremonie, begrenzt auf drei Schritte (Name → Seelenzeile
  → Frage zu Skills), und verschiebt die Leiter für selbst gezeichnete Avatare/Bildgenerierung
  (vom Modell erzeugte Kandidaten → voreingestellte Zeichen → Logo beibehalten) auf eine spätere Umsetzung. Derselbe
  Thread, Avatarwechsel; das Krallenzeichen bleibt dem Custodian vorbehalten. Die
  vereinbarte Identität wird doppelt gespeichert: in `IDENTITY.md`/`SOUL.md` (was der Agent
  liest) und über `openclaw agents set-identity` (was Kanäle und die UI
  anzeigen).
- Empfehlungen (Dienst aus Phase 1, gespeicherter Scan mit Einmal-Semantik) erscheinen als
  letzter Bootstrap-Schritt, bevor die Bootstrap-Datei entfernt wird: „Minimales Set
  oder maximaler Komfort?“ Der Bootstrap liest das gespeicherte Angebot über
  `openclaw onboard recommendations --json` (nur undurchsichtige Installations-IDs) und
  bestätigt es, nachdem die Auswahl verarbeitet wurde, sodass nie erneut danach gefragt wird. Schaltflächen zum
  Verbinden von Kanälen enthalten kanalspezifische Einrichtungs-Playbooks; der Agent erfasst
  Anmeldedaten im Dialog und leitet Konfigurationsschreibvorgänge an den Custodian weiter
  („OpenClaw fragen …“ ist die kanonische Formulierung).
- Selbstlernen wird erfragt, nicht angekündigt, und dient zugleich als Zustimmung zum Skills-Workshop;
  beschreiben Sie die Prüfungen von ClawHub für Release-Vertrauen, Scans, Verifizierung und Integrität
  sowie die Warnung zum Publisher-Code – erwecken Sie niemals den Eindruck, jedes Release sei signiert.
- Der automatische Ausstieg wurde ausgeliefert: Beim Anwenden der Einrichtung einer Neuinstallation wird der Ausstieg angekündigt und
  die Übergabe ausgeführt (Terminal-TUI / `open-agent` für Gateway-Clients); die Webseite
  öffnet den Agenten-Chat mit dem vorausgefüllten Entwurf „Wach auf, mein Freund!“. Die
  Übergabe erfolgt nur nach erfolgreicher Überprüfung nach dem Schreibvorgang. Das Anbieten einer Option bei
  null Agenten nach dem Löschen (statt einer automatischen Aktion) bleibt eine spätere Verfeinerung.

### Phase 6 – Präsenz des Custodian (PR1 zusammengeführt: #110269; Kommentare/Aufruf folgen in PR2)

- In PR1 ausgeliefert: standardmäßig angehefteter Seitenleisteneintrag „OpenClaw“ (neue Profile;
  bestehende Benutzer behalten ihre gespeicherten Anheftungen und erreichen ihn über Anpassen/Mehr), „OpenClaw
  fragen“ als erster Eintrag unter Einstellungen sowie Besuche von `/custodian` im normalen Rahmen,
  die die Begrüßung durch den Betreuer anfordern (keine Variante der Onboarding-Begrüßung), wobei
  „Einrichtung beenden“ nur im Onboarding-Modus angezeigt wird. Ein angedockter eingebetteter Einstellungsbereich
  erfordert die Extraktion einer gemeinsam genutzten Konversationsansicht (spätere Umsetzung).
- Ereignisreaktive Kommentare mit Anti-Clippy-Schutzvorkehrungen: nur bei folgenreichen oder
  fehlgeschlagenen Änderungen, höchstens einmal pro Besuch der Einstellungen, sofern nicht angefordert. Über dieselbe
  Ereignisschnittstelle wird der Custodian später zur Stimme bei eingeschränkter Authentifizierung oder defekten
  Kanälen.
- Kanäle: im Alltag unsichtbar (der Agent leitet weiter); erreichbar durch expliziten
  Aufruf sowie bei Agent-ausgefallen-Ereignissen im selben Thread, mit eigenem Namen und
  Krallen-Avatar, sofern die Plattform dies zulässt.
- Bei der Einrichtung wurde ein schwaches Modell erkannt: `localModelLean` automatisch festlegen, und der Custodian
  erklärt dies in klaren Worten und bietet ein Upgrade an.
- Der Custodian kennt seinen internen Spitznamen („Manche nennen mich den
  Custodian – OpenClaw ist auch in Ordnung“) und bezeichnet den Agenten immer mit seinem Namen.

### Phase 7 – Resilienz (vor der Umsetzung ist eine Entscheidung des Owners erforderlich)

Der ursprüngliche Entwurf – „Der Custodian muss erreichbar sein, unabhängig davon, wie defekt
die Konfiguration ist“ – kollidiert mit der Sicherheitsrichtlinie des Repositorys: Der Root-Leitfaden
besagt, dass das Gateway den **Start verweigert**, wenn die Konfiguration strukturell ungültig ist,
und nur Fehler des SecretRef-Owners zu konfiguriert nicht verfügbaren
Funktionen führen. Das Bereitstellen irgendeiner Oberfläche bei ungültiger Konfiguration ist eine Richtlinienänderung,
kein Implementierungsdetail. Zwei Umfänge, wählen Sie einen:

- **Option A (empfohlen, richtlinienkonform): CLI-seitiger automatischer Doctor.** Wenn ein
  Gateway- oder CLI-Start aufgrund einer ungültigen Konfiguration mit bekannter Struktur fehlschlägt, bietet die CLI
  `openclaw doctor --fix` an (oder führt es mit Zustimmung aus), versucht es anschließend einmal erneut und
  meldet das Ergebnis klar. Das Gateway-Verhalten ändert sich nicht; der Custodian bleibt
  über den bestehenden Pfad für eingeschränkte SecretRefs und das Terminal erreichbar.
- **Option B (erfordert ausdrückliche Zustimmung des Owners und eine Sicherheitsprüfung): Modus mit minimaler
  Gateway-Oberfläche.** Bei strukturell ungültiger Konfiguration wird eine abgeschottete
  Oberfläche gestartet, die nur die Custodian-Konversation und Doctor-Aktionen bereitstellt. Dies
  ändert den Fail-Closed-Startvertrag und muss vor jeglicher Implementierung ein eigenes Konzept
  für den Zugriffsschutz definieren.

Verbleibende Folgearbeiten aus den Phasen 4–6 (erfasst, nicht eingeplant): Avatar-/Bildgenerierungsleiter
für den Ausstieg; Darstellung des typisierten Felds `question` in der macOS-App; ein
angedockter eingebetteter Einstellungsbereich für den Custodian (erfordert die Extraktion einer gemeinsam genutzten Konversationsansicht);
ereignisreaktive Kommentare und Kanalaufruf/Wiederherstellung bei Agentenausfall
(Phase 6 PR2); automatisches `localModelLean` für schwache Modelle; ob die gespeicherten
Seitenleisten-Anheftungen bestehender Benutzer den OpenClaw-Eintrag übernehmen sollen.

## Test- und Landing-Playbook (mühsam erarbeitet; vor den Phasen 4–6 lesen)

- **`OPENCLAW_STATE_DIR` isoliert den Gateway-Dienst nicht.** Das
  LaunchAgent-Label (`ai.openclaw.gateway`) gilt maschinenweit: Ein Onboarding-Test für eine Neuinstallation
  mit einem isolierten Zustandsverzeichnis SCHREIBT den echten Dienst der Maschine NEU und STARTET ihn NEU
  (Wrapper-Skripte befinden sich im isolierten Verzeichnis; der nächste
  Dienststart schlägt fehl, wenn dieses Verzeichnis bereinigt wurde). Stellen Sie nach jedem Test einer Neuinstallation
  mit `openclaw gateway install --force && openclaw gateway
restart` aus der echten Umgebung den Zustand wieder her und prüfen Sie die plist. Produkt-Folgearbeit:
  auf Zustandsverzeichnisse begrenzte Dienst-Labels oder Erkennung eines fremden Dienstes durch das Onboarding.
- **Sicheres End-to-End-Harness**: Befüllen Sie die isolierte Konfiguration vorab mit einem Abschnitt `gateway`
  (damit das Onboarding den Pfad für eine konfigurierte Installation nimmt und den Dienst niemals berührt)
  und führen Sie `openclaw gateway run` als einfachen Vordergrundprozess auf
  einem freien Port mit einem einfachen Token aus. Dieses Harness hat die Schleife aus Phase 3 nachgewiesen,
  einschließlich einer echten Browserverbindung.
- **Authentifizierungspfade unterscheiden sich nach Clientidentität, nicht nur nach Anmeldedaten.** Präsenz- und
  andere Operator-Lesevorgänge verwenden einen Loopback-Client im CLI-Modus mit Anmeldedaten aus
  derselben Konfiguration. Gateways mit Token-Authentifizierung erfordern das gemeinsame Geheimnis; SecretRef-/None-
  Gateways können ohne Token auf vertrauenswürdige Loopback-Authentifizierung zurückgreifen. Ein als Control UI
  identifizierter Browser-Client benötigt eine Geräteidentität oder die Loopback-Freigabe
  für einen sicheren Kontext. Eine Prüfung, die sich bei einem Gateway authentifiziert, das eine
  ANDERE Konfiguration bereitstellt (siehe LaunchAgent-Falle), schlägt mit „Token stimmt nicht überein“ fehl – dieses
  Artefakt hielt Phase 3 kurzzeitig auf.
- **Abschlussprüfungen**: `runSetupInferenceTest` begrenzt die Verifizierungsprüfung auf
  32 Ausgabe-Token; benutzerdefinierte Prompts umgehen diese Begrenzung und werden durch das
  modelleigene `maxTokens` begrenzt. Reasoning-Modelle verbrauchen dieses Budget zunächst durch verborgenes
  Reasoning – eine Texteingabe ohne Ausgabe bedeutet üblicherweise, dass das Budget dort aufgebraucht wurde.
- **Das Landing eines Agenten erfordert gehostete CI auf dem exakten Head.** Der umfangreiche Workflow `CI` wird
  bei Pushes unter hoher Organisationslast möglicherweise nicht eingereiht; als Maintainer-Fallback dient ein
  Release-Gate-Dispatch auf dem PR-Branch:

  ```bash
  gh workflow run ci.yml --ref <branch> -f target_ref=<head-sha> -f release_gate=true -f pull_request_number=<pr>
  ```

  Der Lauf muss auf dem
  Branch-Ref erfolgen, damit `head_sha` übereinstimmt, und der Titel wird zu
  `CI release gate <sha>`, was `scripts/verify-pr-hosted-gates.mjs`
  akzeptiert. Anschließend `scripts/pr` wie üblich vorbereiten/zusammenführen.

- **Gates, die CI zusätzlich zu fokussierten Tests erzwingt**: Dokumentationsübersicht
  (`pnpm docs:map:gen` nach dem Hinzufügen einer Dokumentationsseite), oxlint (`no-map-spread`,
  `max-lines` – Dateien aufteilen, niemals unterdrücken), `check:test-types`, knip-
  Deadcode (nur exportieren, was die Produktionsumgebung verwendet; Tests über öffentliche APIs leiten)
  und der Klassifikator für Live-Test-Shards
  (`test/scripts/test-live-shard.test.ts` muss jedes neue `*.live.test.ts` aufführen).

## Entscheidungsprotokoll

- Magischer Scan mit Abbruchschalter, nicht nach dem Consent-first-Prinzip (Phase 1; die persistente Ausgabe
  weist vor dem Scan auf die Verwendung des Modells und von ClawHub hin, und der Ergebnishinweis wiederholt dies).
- Vollständiger vertikaler Ablauf einschließlich des Node-Befehls `device.apps` (Phase 1).
- Skills von Drittanbietern aus ClawHub sind niemals vorausgewählt und werden als
  Installation des Codes des Herausgebers gekennzeichnet; offizielle Einträge können vorausgewählt sein
  (Phase 1, ausgelieferte Sicherheitsvorgabe).
- Zwei Zugriffskarten statt drei; die Einwilligung ist der Auswahl vorangestellt (Phase 2).
- Automatisches Schlüpfen mit Ankündigung statt einer blockierenden Schaltfläche (Phasen 2/5).
- Browser zuerst: Das Schlüpfen im Terminal ist die Rückfalloption, niemals eine Frage wie „Terminal oder
  Browser?“ (Phase 3).
- Der Verwalter erhält Präsenz im Kanal (Herbeirufen + Wiederherstellung), nicht nur im Web/in der CLI
  (Phase 6).
- Das Schlüpfen erfolgt im selben Thread mit einem Avatarwechsel; nach Abschluss wechselt die
  App zur regulären Benutzeroberfläche (Phase 5).
- Die Einstellungsoberfläche behält den Namen „Einstellungen“; der Verwalter befindet sich dort
  (und in der Seitenleiste), statt sie zu ersetzen (Phase 6).
- Optionskarten sind eingeschränkt: 2–4 Optionen, genau eine davon empfohlen, immer
  überspringbar; dieselbe Komponente dient dem Onboarding und dem Fragetool des Agenten
  (Phase 4).
- „OpenClaw wird gefragt …“ ist die kanonische Formulierung für die Delegation; Souls dürfen eigene Akzente setzen,
  die Beschreibung der Tool-Aktivität bleibt sachlich (Phase 5).
- Benutzerseitige Texte verwenden beim Erklären der Reduzierung für leistungsschwache Modelle niemals
  „Codemodus“, „Tools“ oder „Kontextfenster“ (Phase 6).

## Bekannte Lücken und Folgearbeiten

- Das LaunchAgent-Label ist nicht auf das Zustandsverzeichnis beschränkt (oben genannte Testfalle; außerdem eine
  echte Produktlücke bei mehreren Instanzen).
- Einmalige Semantik der Empfehlungen und der gespeicherte Scan (Phase 5); bei erneuter Ausführung
  werden sie derzeit erneut angeboten.
- Die Browser-Übergabe ist nur unter macOS verfügbar; die Aktivierung unter Linux/Windows steht noch aus.
- Der Kommentar zur Sitzungsanzahl ist qualitativ; für genaue Zahlen ist eine kostengünstige Schnittstelle zur Sitzungszählung erforderlich.
- Die Browser-Übergabe führt zum normalen Dashboard; der Deep-Link zum Verwalter im Onboarding-Modus
  folgt mit Phase 4.
