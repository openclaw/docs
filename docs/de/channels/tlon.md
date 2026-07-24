---
read_when:
    - Arbeiten an Funktionen des Tlon-/Urbit-Kanals
summary: Status, Funktionen und Konfiguration der Tlon-/Urbit-Unterstützung
title: Tlon
x-i18n:
    generated_at: "2026-07-24T04:48:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d742628d6cf9aaf82d79a8d96b1685229905e9452c9fc4d3a494d2dee8d69943
    source_path: channels/tlon.md
    workflow: 16
---

Tlon ist ein dezentraler Messenger, der auf Urbit basiert. OpenClaw stellt eine Verbindung zu Ihrem Urbit-Schiff her und
antwortet auf Direktnachrichten und Gruppenchatnachrichten. Für Gruppenantworten ist standardmäßig eine @-Erwähnung erforderlich,
ergänzt durch Autorisierungsregeln und einen Genehmigungsablauf durch den Eigentümer.

Status: gebündeltes Plugin. Direktnachrichten, Gruppenerwähnungen, Threads, Rich Text, Hoch- und Herunterladen von Bildern sowie ein
Genehmigungssystem für Eigentümer werden unterstützt. Reaktionen und Umfragen werden nicht unterstützt.

## Gebündeltes Plugin

Tlon ist in aktuellen OpenClaw-Versionen gebündelt; paketierte Builds benötigen keine separate Installation.

Installieren Sie es bei einem älteren Build oder einer benutzerdefinierten Installation, die es ausschließt, über npm:

```bash
openclaw plugins install @openclaw/tlon
```

Verwenden Sie den reinen Paketnamen, um dem aktuellen Release-Tag zu folgen. Fixieren Sie eine Version (`@openclaw/tlon@x.y.z`)
nur für reproduzierbare Installationen.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/de/tools/plugin)

## Einrichtung

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Alternativ können Sie die Konfiguration direkt bearbeiten:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // empfohlen: Ihr Schiff, immer autorisiert
    },
  },
}
```

Starten Sie den Gateway nach der direkten Bearbeitung der Konfiguration neu. Senden Sie dem Bot anschließend eine Direktnachricht
oder erwähnen Sie ihn mit @ in einem Gruppenkanal.

## Dauerhaftigkeit eingehender Nachrichten

OpenClaw speichert akzeptierte Tlon-Ereignisse aus Direktnachrichten und Gruppenchats dauerhaft, bevor sie an den Agenten weitergeleitet werden. Ausstehende oder wiederholbare Vorgänge überstehen einen Neustart des Gateways, und die Verarbeitung bleibt pro Gruppenkanal oder direktem Gesprächspartner serialisiert. Stabile Urbit-Nachrichten-IDs unterdrücken außerdem ein erneut zugestelltes Ereignis, solange dessen Warteschlangendatensatz oder aufbewahrter Abschlussdatensatz vorhanden ist.

Die Zustellung über die Grenze zwischen Warteschlange und Agent erfolgt mindestens einmal: Ein Absturz während der Übergabe kann einen Vorgang erneut ausführen. Agentenaktionen, die externe Nebeneffekte verursachen, sollten daher nach Möglichkeit idempotent bleiben.

## Private/LAN-Schiffe

OpenClaw blockiert private/interne Hostnamen und IP-Bereiche standardmäßig zum Schutz vor SSRF. Wenn Ihr
Schiff in einem privaten Netzwerk ausgeführt wird (localhost, LAN-IP, interner Hostname), müssen Sie dies ausdrücklich zulassen:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Dies gilt für Ziele wie `http://localhost:8080`, `http://192.168.x.x:8080` und
`http://my-ship.local:8080`. Aktivieren Sie dies nur für eine vertrauenswürdige Schiffs-URL; dadurch wird der SSRF-
Schutz für die HTTP-Anfragen dieses Kontos deaktiviert.

<Note>
`channels.tlon.allowPrivateNetwork` (flacher Schlüssel) wird nicht mehr verwendet. `openclaw doctor --fix` verschiebt ihn automatisch nach
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Gruppenkanäle

Heften Sie Kanäle manuell an oder aktivieren Sie die automatische Erkennung:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` verwendet standardmäßig `false`, wenn der Wert in der Konfiguration nicht festgelegt ist; der Einrichtungsassistent beantwortet die
Abfrage standardmäßig mit Ja und schreibt `true` ausdrücklich. Wenn die Option aktiviert ist, durchsucht OpenClaw beim Start beigetretene Gruppen,
überwacht neue Kanäle, sobald Gruppeneinladungen angenommen werden, und prüft sie alle 2 Minuten erneut.

## Zugriffskontrolle

Zulassungsliste für Direktnachrichten (leer = keine Direktnachrichten zulässig, sofern der Absender nicht `ownerShip` ist):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Die Gruppenautorisierung verwendet pro Kanal standardmäßig `restricted`. Legen Sie mit `defaultAuthorizedShips` eine
Basis fest und überschreiben Sie diese pro Kanal-Nest:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Nachdem der Bot innerhalb eines Threads geantwortet hat, antwortet er weiterhin auf spätere Nachrichten in diesem Thread,
ohne eine weitere Erwähnung zu erfordern.

Legen Sie `channels.tlon.implicitMentions.threadParticipation: false` fest, um für diese Folgenachrichten eine neue ausdrückliche Erwähnung
zu verlangen. Kontoüberschreibungen verwenden `channels.tlon.accounts.<id>.implicitMentions`. Tlon
erzeugt derzeit keine `replyToBot`- oder `quotedBot`-Fakten, daher haben diese Flags hier keine Wirkung.

## Eigentümer- und Genehmigungssystem

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Das Eigentümerschiff ist überall autorisiert: Einladungen zu Direktnachrichten werden immer automatisch angenommen, Gruppeneinladungen werden
immer automatisch angenommen und Kanalnachrichten bestehen stets die Autorisierungsprüfung. Der Eigentümer muss nicht in
`dmAllowlist`, `defaultAuthorizedShips` oder `groupInviteAllowlist` enthalten sein.

Wenn `ownerShip` festgelegt ist, werden nicht autorisierte Anfragen nicht einfach verworfen – sie werden als ausstehende
Genehmigung in die Warteschlange gestellt, und der Eigentümer erhält eine Direktnachricht:

- Direktnachrichtenanfragen von Schiffen, die nicht in `dmAllowlist` enthalten sind
- Erwähnungen in Kanälen, in denen der Absender die Autorisierung nicht besteht
- Gruppeneinladungen von Schiffen, die nicht in `groupInviteAllowlist` enthalten sind (wenn die automatische Annahme deaktiviert ist oder aktiviert ist, aber der
  Einladende nicht auf der Zulassungsliste steht)

Der Eigentümer antwortet per Direktnachricht, um eine Anfrage zu bearbeiten:

| Antwort des Eigentümers       | Wirkung                                                        |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | Bearbeitet die neueste ausstehende Genehmigung                  |
| `approve <id>` / `deny <id>` | Bearbeitet eine bestimmte Genehmigung anhand der ID             |
| `block`                      | Blockiert das Schiff zusätzlich nativ, sodass es keine erneute Verbindung herstellen kann |
| `unblock ~ship`              | Hebt eine native Blockierung auf                                |
| `blocked`                    | Listet derzeit blockierte Schiffe auf                           |
| `pending`                    | Listet ausstehende Genehmigungsanfragen auf                     |

Wenn `ownerShip` nicht konfiguriert ist, werden nicht autorisierte Direktnachrichten und Kanalerwähnungen lediglich verworfen und protokolliert;
es gibt keine Genehmigungsaufforderung.

## Einstellungen für die automatische Annahme

Einladungen zu Direktnachrichten von Schiffen, die bereits in `dmAllowlist` enthalten sind, automatisch annehmen (der Eigentümer wird unabhängig
von diesem Flag immer automatisch angenommen):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Gruppeneinladungen von einer Zulassungsliste automatisch annehmen (sicheres Fehlschlagen: Bei `autoAcceptGroupInvites: true` und
einem leeren `groupInviteAllowlist` wird keine Einladung von Nicht-Eigentümern angenommen):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Hot-Reload über den Urbit-Einstellungsspeicher

Die meisten der obigen Einstellungen (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) werden beim ersten Start in den
`%settings`-Agenten des Schiffs (Desk `moltbot`, Bucket `tlon`) gespiegelt und anschließend live von dort gelesen,
sodass Änderungen über einen Landscape-Client oder die Einstellungsbefehle des gebündelten Skills ohne einen
Neustart des Gateways wirksam werden. `channelRules` und ausstehende Genehmigungen werden dort ebenfalls als JSON gespeichert. Die Datei-
konfiguration bleibt die maßgebliche Quelle für Werte, die nie in den Einstellungsspeicher geschrieben wurden.

## Zustellungsziele (CLI/Cron)

Verwenden Sie diese mit `openclaw message send` oder für die Cron-Zustellung:

- Direktnachricht: `~sampel-palnet` oder `dm/~sampel-palnet`
- Gruppe: `chat/~host-ship/channel` oder `group:~host-ship/channel`

## Gebündelter Skill

Das Plugin bündelt [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), eine CLI für
direkte Urbit-Vorgänge, die nach der Installation des Plugins automatisch verfügbar ist:

- **Aktivität**: Erwähnungen, Antworten, ungelesene Elemente
- **Kanäle**: auflisten, erstellen, umbenennen
- **Kontakte**: Profile auflisten/abrufen/aktualisieren
- **Gruppen**: erstellen, beitreten, Einladungs-/Anfrageabläufe, Rollen
- **Hooks**: Kanal-Hooks verwalten
- **Nachrichten**: Verlauf, Suche
- **Direktnachrichten**: senden, reagieren, annehmen/ablehnen
- **Beiträge**: reagieren, löschen
- **Notizbuch**: in Tagebuchkanälen veröffentlichen
- **Einstellungen**: Plugin-Konfiguration über den obigen Einstellungsspeicher per Hot-Reload aktualisieren

## Funktionen

| Funktion        | Status                                                    |
| --------------- | --------------------------------------------- |
| Direktnachrichten | Unterstützt                                               |
| Gruppen/Kanäle  | Unterstützt (standardmäßig nur bei Erwähnung)             |
| Threads         | Unterstützt (antwortet nach dem Beitritt weiterhin)       |
| Rich Text       | Markdown wird in das native Format von Tlon konvertiert   |
| Bilder          | Eingehend heruntergeladen, ausgehend hochgeladen          |
| Reaktionen      | Nur über den [gebündelten Skill](#bundled-skill)          |
| Umfragen        | Nicht unterstützt                                         |
| Native Befehle  | Standardmäßig nur für den Eigentümer                      |

## Fehlerbehebung

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Häufige Fehler:

- **Direktnachrichten werden ignoriert**: Der Absender ist nicht in `dmAllowlist` enthalten, und für den Genehmigungsablauf ist kein `ownerShip` konfiguriert.
- **Gruppennachrichten werden ignoriert**: Der Kanal wurde nicht erkannt/angeheftet oder der Absender besteht die Autorisierung nicht und es gibt kein
  `ownerShip`, um eine Genehmigung in die Warteschlange zu stellen.
- **Verbindungsfehler**: Prüfen Sie, ob die Schiffs-URL erreichbar ist; legen Sie für lokale Schiffe
  `network.dangerouslyAllowPrivateNetwork` fest.
- **Authentifizierungsfehler**: Anmeldecodes ändern sich regelmäßig – kopieren Sie den aktuellen Code von Ihrem Schiff.

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

| Schlüssel                                              | Bedeutung                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Aktiviert/deaktiviert den Start des Kanals.                    |
| `channels.tlon.ship`                                   | Urbit-Schiffsname des Bots (z. B. `~sampel-palnet`).          |
| `channels.tlon.url`                                    | Schiffs-URL (z. B. `https://sampel-palnet.tlon.network`).                         |
| `channels.tlon.code`                                   | Anmeldecode des Schiffs.                                       |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Erlaubt localhost-/LAN-Schiffs-URLs (SSRF-Opt-in).             |
| `channels.tlon.ownerShip`                              | Eigentümerschiff: immer autorisiert, empfängt Genehmigungsanfragen. |
| `channels.tlon.dmAllowlist`                            | Schiffe, die Direktnachrichten senden dürfen (leer = keine außer dem Eigentümer). |
| `channels.tlon.autoAcceptDmInvites`                    | Nimmt Direktnachrichten von Schiffen in `dmAllowlist` automatisch an. |
| `channels.tlon.autoAcceptGroupInvites`                 | Nimmt Gruppeneinladungen aus `groupInviteAllowlist` automatisch an. |
| `channels.tlon.groupInviteAllowlist`                   | Schiffe, deren Gruppeneinladungen automatisch angenommen werden. |
| `channels.tlon.autoDiscoverChannels`                   | Erkennt beigetretene Gruppenkanäle automatisch (Standard: `false`). |
| `channels.tlon.implicitMentions.threadParticipation`   | Erlaubt Folgenachrichten in beteiligten Threads, die Erwähnungspflicht zu umgehen. |
| `channels.tlon.groupChannels`                          | Manuell angeheftete Kanal-Nests.                               |
| `channels.tlon.defaultAuthorizedShips`                 | Für alle Kanäle autorisierte Schiffe (wenn keine Regel zutrifft). |
| `channels.tlon.authorization.channelRules`             | Autorisierungsmodus und Zulassungsliste pro Kanal-Nest.        |
| `channels.tlon.showModelSignature`                     | Hängt `_[Generated by <model>]_` an Antworten an.                       |
| `channels.tlon.responsePrefix`                         | Statisches Präfix, das ausgehenden Antworten vorangestellt wird. |
| `channels.tlon.accounts.<id>`                          | Zusätzliche benannte Konten (Einrichtungen mit mehreren Schiffen). |

## Hinweise

- Antworten in Gruppen benötigen eine @-Erwähnung (z. B. `~your-bot-ship`), es sei denn, der Bot ist diesem Thread bereits beigetreten.
- Antworten auf Threads werden im jeweiligen Thread veröffentlicht; außerdem werden dem Bot die letzten 10 Nachrichten des Thread-Kontexts
  für den Agenten vorangestellt.
- Rich Text (Fettdruck, Kursivschrift, Code, Überschriften, Listen) wird in das native Format von Tlon konvertiert.
- Das Senden einer eingehenden Nachricht, die um eine Zusammenfassung eines Kanals bittet (zum Beispiel „Fassen Sie diesen
  Kanal zusammen“), löst anstelle des normalen Antwortablaufs eine integrierte Zusammenfassung des Verlaufs aus.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungspflicht
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
