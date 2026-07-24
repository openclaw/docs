---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Node
    - Den direkten Apple-Watch-Node aktivieren oder Fehler beheben
    - Ausführen der iOS-App aus dem Quellcode
    - Fehlerbehebung bei der Gateway-Erkennung oder bei Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung zum Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-24T03:54:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2b01a63fa1e2c445f7fb35843536f7f5918e94bfe885dac19c852d7d52d86342
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Funktionsumfang

- Stellt über WebSocket (LAN oder Tailnet) eine Verbindung zu einem Gateway her.
- Stellt Node-Funktionen bereit: Canvas, Bildschirmaufnahme, Kameraaufnahme, Standort, Gesprächsmodus, Sprachaktivierung und optionale Gesundheitszusammenfassungen.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.
- Ermöglicht über die Agents-Oberfläche (Dateien) den schreibgeschützten Zugriff auf den Arbeitsbereich des ausgewählten Agenten: Navigation durch Verzeichnisse, Textvorschauen mit Syntaxhervorhebung, Bildvorschauen und Export über das Teilen-Menü. Es sind keine Schreibvorgänge möglich; die Größe der Vorschauen wird durch das Gateway begrenzt.
- Verwaltet pro gekoppeltem Gateway einen kleinen schreibgeschützten Offline-Cache der letzten Chatsitzungen und Transkripte: Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet. Letzte Chats bleiben ohne Verbindung durchsuchbar, und Zurücksetzen/Entfernen löscht den geschützten lokalen Cache.
- Stellt Textnachrichten, die ohne Verbindung gesendet werden, in eine dauerhafte Ausgangswarteschlange pro Gateway (bis zu 50): Nachrichten in der Warteschlange werden im Transkript angezeigt, nach der Wiederherstellung der Verbindung der Reihe nach mit idempotenten Wiederholungsversuchen gesendet und bleiben erhalten, bis der kanonische Verlauf den Versand bestätigt. Vor Anzeige einer Aktion zum Wiederholen/Löschen erfolgen Wiederholungsversuche mit Backoff; nach 48 Stunden ohne Verbindung verfallen die Nachrichten, statt gesendet zu werden. Zurücksetzen/Entfernen löscht die Warteschlange zusammen mit dem Cache.
- Chat ist die zentrale Oberfläche für Text und Sprache. Über Chat-Aktionen lässt sich die vollständige Sitzungsansicht öffnen, ohne Chat zu verlassen; außerdem können Überlegungen des Assistenten und Tool-Aktivitäten ein- oder ausgeblendet werden. Tippen Sie für eine Diktatvorlage auf das Mikrofon, öffnen Sie dessen Menü, um eine Sprachnachricht aufzunehmen, oder verwenden Sie das eingebettete Gesprächssteuerelement für Echtzeitsprachkommunikation. Während des Zuhörens oder Sprechens wird das Gesprächssteuerelement anhand des Live-Mikrofon- oder Wiedergabepegels animiert.
- **Einstellungen -> OpenClaw** öffnet einen speziellen Assistenten für Gateway-Einstellungen, wenn die Operatorverbindung über `operator.admin` verfügt und das Gateway `openclaw.chat` unterstützt. Die Einrichtungskonversation bleibt vom regulären Chat getrennt, schwärzt geheime Antworten lokal und wechselt erst zu Chat, nachdem Sie auf **Chat öffnen** getippt haben.
- Liest Nachrichten des Assistenten bei Bedarf vor: Drücken Sie lange auf eine Nachricht in Chat und wählen Sie **Anhören**. Die App gibt unterstützte `tts.speak`-Clips des Gateways mit dem konfigurierten TTS-Provider wieder und greift auf die Sprachausgabe des Geräts zurück, wenn Gateway-Audio nicht verfügbar oder nicht abspielbar ist. Die Wiedergabe wird beim Wechsel der Sitzung oder beim Verschieben in den Hintergrund beendet.

## Anforderungen

- Ein Gateway, das auf einem anderen Gerät ausgeführt wird (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manuell angegebener Host/Port (Fallback).

## Schnellstart (koppeln und verbinden)

Beim ersten Start führt die App durch eine kurze Erläuterung zur Kopplung und eine
Berechtigungsseite (Mitteilungen, Kamera, Mikrofon, Fotos, Kontakte,
Kalender, Erinnerungen, Standort). Jede Freigabe ist optional und kann später
unter **Einstellungen** -> **Berechtigungen** oder in der iOS-App Settings geändert
werden.

1. Starten Sie ein authentifiziertes Gateway mit einer Route, die Ihr Telefon erreichen kann. Tailscale
   Serve ist der empfohlene Pfad für Remoteverbindungen:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Verwenden Sie für eine vertrauenswürdige Einrichtung im selben LAN stattdessen ein authentifiziertes `gateway.bind: "lan"`.
Die standardmäßige Loopback-Bindung ist von einem Telefon aus nicht erreichbar. Falls das
Gateway noch nicht konfiguriert wurde, führen Sie zuerst `openclaw onboard` aus, damit für die Erstellung
des Einrichtungscodes ein Authentifizierungspfad mit Token oder Passwort verfügbar ist.

2. Öffnen Sie die [Control UI](/de/web/control-ui), wählen Sie **Nodes** und klicken Sie
   auf der Seite **Geräte** auf **Mobilgerät koppeln**. Vollzugriff wird empfohlen
   und ist standardmäßig ausgewählt. Wählen Sie eingeschränkten Zugriff nur, wenn Sie
   administrative Gateway-Steuerelemente auslassen möchten, und klicken Sie anschließend auf **Einrichtungscode erstellen**.

3. Öffnen Sie in der iOS-App **Einstellungen** -> **Gateway**, scannen Sie den QR-Code (oder fügen Sie
   den Einrichtungscode ein) und stellen Sie die Verbindung her.

   Wenn der Einrichtungscode sowohl LAN- als auch Tailscale-Serve-Routen enthält, prüft die App
   diese der Reihe nach und speichert den ersten erreichbaren Endpunkt.

   Gekoppelte Gateways bleiben in der Liste **Gateways**. Das Häkchen kennzeichnet
   das fokussierte Gateway. Verwenden Sie das Blitz-Steuerelement in einer anderen Zeile, damit dessen
   Operatorsitzung gleichzeitig verbunden bleibt. Beim Wechsel des Fokus werden andere
   aktivierte Gateways nicht getrennt. Nur das fokussierte Gateway empfängt die
   funktionsbereitstellende Node-Sitzung des iPhone, sodass Kamera, Bildschirm, Standort und
   andere Gerätebefehle immer einen eindeutigen Eigentümer haben. iOS kann
   diese Vordergrundverbindungen aussetzen, nachdem die App in den Hintergrund gewechselt ist.

4. Die offizielle App stellt die Verbindung automatisch her. Wenn **Genehmigung ausstehend** eine
   Anfrage anzeigt, prüfen Sie vor der Genehmigung deren Rolle und Geltungsbereiche.

   Unter **Einstellungen → Gateway** wird angezeigt, ob die gespeicherte Operatorverbindung
   **Vollzugriff** oder **eingeschränkten Zugriff** besitzt. Die Einrichtung über Klartext-LAN mit `ws://` wird zur
   Sicherheit von Bearer-Token automatisch eingeschränkt. Falls sie eingeschränkt ist, konfigurieren Sie `wss://` oder
   Tailscale Serve, scannen Sie in der Control UI oder über `openclaw qr` einen neuen Code für den Vollzugriff
   und stellen Sie anschließend erneut eine Verbindung her, um Einstellungen und Upgrades zu aktivieren.

Die Schaltfläche der Control UI erfordert eine bereits gekoppelte Sitzung mit `operator.admin`.
Wählen Sie als Terminal-Fallback ein erkanntes Gateway in der iOS-App aus (oder aktivieren Sie
den manuellen Host und geben Sie Host/Port ein) und genehmigen Sie anschließend die Anfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Geltungsbereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und ein neuer `requestId` erstellt. Führen Sie `openclaw devices list` vor der Genehmigung erneut aus.

Optional: Wenn der iOS-Node immer aus einem streng kontrollierten Subnetz eine Verbindung herstellt, können Sie die automatische Erstgenehmigung des Nodes mit expliziten CIDRs oder genauen IP-Adressen aktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies ist standardmäßig deaktiviert. Es gilt nur für eine neue `role: node`-Kopplung ohne angeforderte Geltungsbereiche. Die Kopplung von Operatoren und Browsern sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

5. Überprüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Gesundheitszusammenfassungen

Der iOS-Node kann eine optionale, schreibgeschützte HealthKit-Zusammenfassung für den aktuellen
Kalendertag zurückgeben. Die Zustimmung auf dem iOS-Gerät und die explizite Autorisierung des Gateway-Befehls sind
unabhängige Voraussetzungen. Unter [HealthKit-Zusammenfassungen](/de/platforms/ios-healthkit) finden Sie Informationen zu
Einrichtung, Aufruf, Nutzdatenfeldern, Datenschutzverhalten und Fehlerbehebung.

Standardmäßig verwendet die Apple-Watch-Begleit-App weiterhin das bestehende iPhone-Relay und
benötigt keine separate Gateway-Kopplung. Koppeln Sie die Watch in Apples App Watch mit dem iPhone,
installieren Sie OpenClaw über **Watch app -> My Watch -> Available
Apps** und öffnen Sie OpenClaw anschließend einmal auf beiden Geräten.

## Genehmigungen für Befehle prüfen

Eine Operatorverbindung mit `operator.admin` oder eine gekoppelte
`operator.approvals`-Verbindung, die vom Gateway ausdrücklich als Ziel angegeben wurde, kann ausstehende
Ausführungsanfragen auf dem iPhone prüfen. Die Genehmigungskarte zeigt die
bereinigte Befehlsvorschau, Warnung, den Hostkontext und den Ablaufzeitpunkt des Gateways sowie ausschließlich die
von dieser Anfrage angebotenen Entscheidungen. Die gekoppelte Apple Watch empfängt dieselbe
für Prüfer geeignete Aufforderung über das bestehende iPhone-Relay und bietet die kompakte
Auswahl aus einmaligem Zulassen und Ablehnen. Im direkten Watch-Gateway-Modus werden
Genehmigungsaufforderungen nicht übertragen.

Der Genehmigungsstatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich übermittelte Antwort gewinnt. iPhone und Watch rufen den kanonischen
Abschlussdatensatz des Gateways ab, nachdem eine andere Oberfläche die Anfrage bearbeitet hat, nach einer
Remote-Benachrichtigung über den Abschluss und immer dann, wenn eine Abschlussbestätigung möglicherweise
verloren gegangen ist. Aktionen bleiben nicht verfügbar, bis diese Rückmeldung bestätigt, ob die
Anfrage weiterhin aussteht.

Die Zuständigkeit für Genehmigungen ist an das ausgewählte Gateway gebunden. Beim Wechsel zwischen Gateways kann
eine alte Aufforderung nicht auf die neue Verbindung angewendet werden. Gateways, die älter als die
vereinheitlichten Genehmigungsmethoden sind, greifen auf die ausgelieferten ausführungsbezogenen Methoden zurück.
Ein beibehaltener Abschlussstatus und umfangreichere oberflächenübergreifende Ergebnisse erfordern ein aktualisiertes
Gateway.

## Fragen des Agenten beantworten

Chat zeigt ausstehende Gateway-Fragen als native Karten für Operatorverbindungen
mit `operator.questions` (oder `operator.admin`) an. Die Karten unterstützen Optionen mit Einfach- und
Mehrfachauswahl, Optionsbeschreibungen, Freitextantworten unter **Sonstiges** und einen
Countdown bis zum Ablauf. Nach einer erneuten Verbindung werden ausstehende Fragen vom Gateway neu geladen. Eine Karte
wird gesperrt, wenn dieses Gerät sie beantwortet, eine andere Oberfläche sie zuerst beantwortet oder die
Frage abläuft oder abgebrochen wird.

## Optionaler direkter Apple-Watch-Node

Im direkten Modus erhält die Watch eine eigene signierte Node-Identität und Gateway-Verbindung.
Unterstützte Node-Befehle funktionieren weiterhin über WLAN oder Mobilfunk der Watch, solange
OpenClaw aktiv ist, selbst wenn das gekoppelte iPhone nicht verfügbar ist.

Anforderungen:

- Das iPhone ist mit dem Gateway verbunden und besitzt den Geltungsbereich `operator.admin`.
- Der Einrichtungscode gibt einen `wss://`-Gateway-Endpunkt mit einem von watchOS als vertrauenswürdig eingestuften Zertifikat
  bekannt. Die Watch fragt den entsprechenden `https://`-Ursprung ab. Unverschlüsseltes HTTP sowie
  selbst signiertes oder ausschließlich per Fingerabdruck als vertrauenswürdig eingestuftes TLS werden nicht unterstützt. Informationen zur Endpunktkonfiguration finden Sie unter [Gateway-eigene
  Kopplung](/de/gateway/pairing). Loopback-, reine iPhone- und reine Tailnet-Routen sind für die Watch
  nicht unabhängig erreichbar.
- Die Nutzung über Mobilfunk erfordert eine mobilfunkfähige Apple Watch mit aktivem Dienst.
- OpenClaw ist auf der Watch aktiv. Apple erlaubt gewöhnlichen watchOS-Apps nicht,
  generische WebSocket-/TCP-Verbindungen aufrechtzuerhalten. Daher verwendet der direkte Node kurze HTTPS-
  Abfragen und stellt erneut eine Verbindung her, wenn die App in den Vordergrund zurückkehrt. Siehe Apples
  [Anleitung zur Low-Level-Netzwerkkommunikation unter watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Einrichtung:

1. Öffnen Sie auf dem iPhone **Einstellungen -> Apple Watch**.
2. Tippen Sie auf **Direkte Gateway-Verbindung aktivieren**.
3. Öffnen Sie OpenClaw auf der Watch, bevor der kurzlebige Einrichtungscode abläuft.
4. Überprüfen Sie die separate Apple-Watch-Zeile mit `openclaw nodes status`.

Der Einrichtungscode enthält kurzlebige Bootstrap-Anmeldedaten ausschließlich für den Node. Behandeln Sie diese
bis zum Ablauf wie ein Passwort. Er enthält niemals das auf dem iPhone gespeicherte Gateway-
Passwort oder -Token. Nach der Kopplung speichert die Watch ihr eigenes Geräte-Token und
löscht die Bootstrap-Anmeldedaten. Der direkte Modus umfasst nur die nachfolgend aufgeführten Befehle.
Chat, Gesprächsmodus, Genehmigungen und der bestehende `watch.*`-Benachrichtigungsablauf bleiben
Funktionen des iPhone-Relays und erfordern weiterhin das gekoppelte iPhone.

Direkte watchOS-Node-Befehle:

| Oberfläche     | Befehle                        | Hinweise                                                |
| -------------- | ------------------------------ | ------------------------------------------------------- |
| Gerät          | `device.info`, `device.status` | Watch-Identität, Akku, Temperatur, Speicher und Netzwerk. |
| Mitteilungen   | `system.notify`                | Während die App aktiv ist; erfordert die Berechtigung der Watch. |

watchOS stellt Drittanbieter-Apps kein WebKit zur Verfügung. Daher gibt der direkte Watch-Node
keine Canvas-Befehle bekannt.

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden ein externes Push-Relay, statt das unformatierte APNs-Token an das Gateway zu übermitteln. Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`. Diese Basis-URL ist für die App-Store-Verteilung fest codiert und berücksichtigt keine Überschreibung.

Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst getrennten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Der App-Store-Release-Kanal akzeptiert niemals eine benutzerdefinierte Relay-URL. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie die entsprechende Gateway-Relay-URL fest:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

So funktioniert der Ablauf:

- Die iOS-App registriert sich beim Relay mithilfe von App Attest und einer StoreKit-App-Transaktions-JWS.
- Das Relay gibt ein opakes Relay-Handle sowie eine auf die Registrierung beschränkte Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways (`gateway.identity.get`) ab und nimmt sie in die Relay-Registrierung auf, sodass die Relay-gestützte Registrierung an dieses spezifische Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet dieses gespeicherte Relay-Handle für `push.test`, Hintergrundaktivierungen und Aktivierungsimpulse.
- Wenn die App später eine Verbindung zu einem anderen Gateway oder zu einem Build mit einer anderen Relay-Basis-URL herstellt, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt: kein bereitstellungsweites Relay-Token und keinen direkten APNs-Schlüssel für Relay-gestützte Sendungen der offiziellen App-Store-Version.

Erwarteter Ablauf für Betreiber:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Legen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur fest, wenn Sie bewusst einen separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und warten Sie, bis der Verbindungsaufbau abgeschlossen ist.
4. Die App veröffentlicht `push.apns.register`, sobald sie über ein APNs-Token verfügt, die Betreibersitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Aktivierungen bei erneuter Verbindung und Aktivierungsimpulse die gespeicherte Relay-gestützte Registrierung verwenden.

## Hintergrund-Beacons zur Aktivitätsmeldung

Wenn iOS die App für eine stille Push-Nachricht, eine Hintergrundaktualisierung oder ein Ereignis aufgrund einer erheblichen Standortänderung aktiviert, versucht die App, kurzzeitig erneut eine Node-Verbindung herzustellen, und ruft anschließend `node.event` mit `event: "node.presence.alive"` auf. Das Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten der gekoppelten Node bzw. des gekoppelten Geräts auf, wenn die Identität des authentifizierten Node-Geräts bekannt ist.

Die App betrachtet eine Hintergrundaktivierung nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, zählt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Aktivität.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Umgebungsvariablen-Überschreibung für das Gateway (`gateway.push.apns.relay.baseUrl` ist der primäre konfigurationsbasierte Pfad).
- Der Push-Modus des App-Store-Release-Builds enthält den Host des gehosteten Relays fest codiert und liest niemals eine Relay-URL-Überschreibung ein – die Buildzeit-Umgebungsvariable `OPENCLAW_PUSH_RELAY_BASE_URL` wirkt sich nur auf lokale bzw. Sandbox-iOS-Build-Modi aus.

## Authentifizierungs- und Vertrauensablauf

Das Relay dient dazu, zwei Einschränkungen durchzusetzen, die direkte APNs-Nutzung auf dem Gateway für offizielle iOS-Builds nicht gewährleisten kann:

- Nur echte, über Apple vertriebene OpenClaw-iOS-Builds können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Push-Nachrichten nur für iOS-Geräte senden, die mit genau diesem Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`: Die App wird über den normalen Gateway-Authentifizierungsablauf mit dem Gateway gekoppelt und erhält dadurch eine authentifizierte Node-Sitzung sowie eine authentifizierte Betreibersitzung. Die Betreibersitzung ruft `gateway.identity.get` auf.
2. `iOS app -> relay`: Die App ruft die Relay-Registrierungsendpunkte über HTTPS mit einem App-Attest-Nachweis sowie einer StoreKit-App-Transaktions-JWS auf. Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und setzt den offiziellen Produktionsverteilungsweg voraus – dadurch werden lokale Xcode-/Entwicklungs-Builds von der Nutzung des gehosteten Relays ausgeschlossen, da ein lokaler Build den offiziellen Apple-Verteilungsnachweis nicht erbringen kann.
3. `gateway identity delegation`: Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways von `gateway.identity.get` ab und nimmt sie in die Nutzdaten der Relay-Registrierung auf. Das Relay gibt ein Relay-Handle und eine auf die Registrierung beschränkte Sendeberechtigung zurück, die an diese Gateway-Identität delegiert ist.
4. `gateway -> relay`: Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`. Bei `push.test`, Aktivierungen bei erneuter Verbindung und Aktivierungsimpulsen signiert das Gateway die Sendeanforderung mit seiner eigenen Geräteidentität. Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur anhand der bei der Registrierung angegebenen delegierten Gateway-Identität. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es auf irgendeine Weise an das Handle gelangt.
5. `relay -> APNs`: Das Relay verwaltet die produktiven APNs-Anmeldedaten und das unverarbeitete APNs-Token für den offiziellen Build. Das Gateway speichert bei Relay-gestützten offiziellen Builds niemals das unverarbeitete APNs-Token. Das Relay sendet die endgültige Push-Nachricht im Namen des gekoppelten Gateways an APNs.

Warum dieses Design entwickelt wurde: um produktive APNs-Anmeldedaten von Benutzer-Gateways fernzuhalten, die Speicherung unverarbeiteter APNs-Token offizieller Builds auf dem Gateway zu vermeiden, die Nutzung des gehosteten Relays ausschließlich offiziellen OpenClaw-iOS-Builds zu erlauben und zu verhindern, dass ein Gateway Aktivierungs-Push-Nachrichten an iOS-Geräte sendet, die zu einem anderen Gateway gehören.

Lokale bzw. manuelle Builds verwenden weiterhin direkte APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeit-Umgebungsvariablen des Gateway-Hosts und keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur die App-Store-Connect-Authentifizierung, beispielsweise `APP_STORE_CONNECT_KEY_ID` und `APP_STORE_CONNECT_ISSUER_ID`; damit wird keine direkte APNs-Zustellung für lokale iOS-Builds konfiguriert.

Empfohlene Speicherung auf dem Gateway-Host, entsprechend anderen Provider-Anmeldedaten unter `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die Datei `.p8` nicht und legen Sie sie nicht im Repository-Checkout ab.

## Ermittlungspfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` unter `local.` und, sofern konfiguriert, dieselbe Wide-Area-DNS-SD-Ermittlungsdomain. Gateways im selben LAN werden automatisch über `local.` angezeigt. Für die netzwerkübergreifende Ermittlung kann die konfigurierte Wide-Area-Domain verwendet werden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel: `openclaw.internal.`) und Tailscale Split DNS. Das CoreDNS-Beispiel finden Sie unter [Bonjour](/de/gateway/bonjour).

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie Host und Port des Gateways ein (Standard: `18789`).

## Mehrere Gateways

Die App verwaltet eine Registrierung aller Gateways, mit denen sie gekoppelt wurde, sodass Sie zwischen ihnen wechseln können, ohne sie erneut zu koppeln:

- Unter **Settings -> Gateway** wird eine Liste **Paired Gateways** angezeigt, in der das aktive Gateway markiert ist. Tippen Sie auf einen Eintrag, um zu wechseln. Die App beendet die aktuellen Sitzungen und stellt erneut eine Verbindung zum ausgewählten Gateway her. Wenn mehr als ein Gateway gekoppelt ist, wird neben der Verbindungszeile ein Schnellwechselmenü angezeigt.
- Anmeldedaten, TLS-Vertrauensentscheidungen, Gateway-spezifische Einstellungen und der zwischengespeicherte Chatverlauf werden für jedes Gateway separat gespeichert. Beim Wechsel werden Zustände verschiedener Gateways niemals vermischt, und die Push-Registrierung folgt dem aktiven Gateway.
- Wischen Sie über ein gekoppeltes Gateway oder verwenden Sie dessen Kontextmenü, um es mit **Forget** zu entfernen. Dadurch werden seine Anmeldedaten, Geräte-Token, der TLS-Pin und die zwischengespeicherten Chats gelöscht.
- Ermittelte Gateways müssen im Netzwerk sichtbar sein, damit zu ihnen gewechselt werden kann. Manuelle Gateways stellen die Verbindung anhand des gespeicherten Hosts und Ports wieder her.

## Canvas + A2UI

Die iOS-Node rendert eine WKWebView-Canvas. Steuern Sie sie mit `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateways stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` über den HTTP-Server des Gateways bereit (derselbe Port wie `gateway.port`, Standard: `18789`).
- Die iOS-Node verwendet das integrierte Grundgerüst als verbundene Standardansicht. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte, App-eigene A2UI-Seite.
- A2UI-Seiten eines entfernten Gateways werden unter iOS nur gerendert. Native A2UI-Schaltflächenaktionen werden nur von gebündelten, App-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Grundgerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche und kein Backend für Codex Computer Use. Codex Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-Tools. Die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-Befehle aufrufen. Diese Aufrufe verwenden jedoch das Gateway-Node-Protokoll und unterliegen den Vordergrund-/Hintergrundbeschränkungen von iOS. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use) für die lokale Desktop-Steuerung und diese Seite für die Funktionen der iOS-Node.

### Canvas-Auswertung/Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung + Gesprächsmodus

- Sprachaktivierung und Gesprächsmodus sind in den Einstellungen verfügbar.
- OpenAI-Echtzeitgespräche verwenden clientseitig verwaltetes WebRTC, wenn `talk.realtime.transport` den Wert `webrtc` hat. Eine explizite `gateway-relay`-Konfiguration bleibt unter der Verwaltung des Gateways. Siehe [Gesprächsmodus](/de/nodes/talk).
- Gesprächsfähige iOS-Nodes geben die Fähigkeit `talk` an und können `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren. Das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige, gesprächsfähige Nodes.
- iOS kann Hintergrundaudio anhalten. Betrachten Sie Sprachfunktionen als Best-Effort-Funktionen, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-, Kamera- und Bildschirmbefehle setzen dies voraus).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der WebView der App nicht erreichbar. Lassen Sie die App auf der Registerkarte „Screen“ im Vordergrund und versuchen Sie es erneut.
- Die Kopplungsaufforderung wird nie angezeigt: Führen Sie `openclaw devices list` aus und genehmigen Sie die Kopplung manuell.
- Die Watch zeigt keinen iPhone-Status an: Vergewissern Sie sich, dass das iPhone `watchPaired: true`
  und `watchAppInstalled: true` in `watch.status` meldet. Wenn die Kopplung auf „false“ steht, koppeln Sie die
  Watch in Apples Watch-App. Wenn die Installation auf „false“ steht, installieren Sie die Begleit-App
  über **My Watch -> Available Apps**. Öffnen Sie OpenClaw nach einer der beiden Änderungen einmal auf der
  Watch. Für die sofortige Erreichbarkeit müssen weiterhin beide Apps ausgeführt werden,
  während Aktualisierungen in der Warteschlange später im Hintergrund eintreffen können.
- Die erneute Verbindung schlägt nach einer Neuinstallation fehl: Das Kopplungs-Token im Schlüsselbund wurde gelöscht. Koppeln Sie die Node erneut.

## Zugehörige Dokumentation

- [Kopplung](/de/channels/pairing)
- [Ermittlung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
