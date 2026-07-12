---
read_when:
    - Arbeit an Funktionen des Tlon/Urbit-Kanals
summary: Supportstatus, Funktionen und Konfiguration von Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T15:01:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon ist ein dezentraler Messenger, der auf Urbit basiert. OpenClaw stellt eine Verbindung zu Ihrem Urbit-Ship her und
antwortet auf Direktnachrichten und Gruppenchatnachrichten. Für Gruppenantworten ist standardmäßig eine @-Erwähnung erforderlich,
ergänzt durch Autorisierungsregeln und einen Genehmigungsablauf durch den Eigentümer.

Status: gebündeltes Plugin. Direktnachrichten, Gruppenerwähnungen, Threads, Rich Text, Hoch- und Herunterladen von Bildern sowie ein
Genehmigungssystem für Eigentümer werden unterstützt. Reaktionen und Umfragen werden nicht unterstützt.

## Gebündeltes Plugin

Tlon ist in aktuellen OpenClaw-Versionen gebündelt; bei paketierten Builds ist keine separate Installation erforderlich.

Installieren Sie das Plugin bei einem älteren Build oder einer benutzerdefinierten Installation, die es nicht enthält, über npm:

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

Oder bearbeiten Sie die Konfiguration direkt:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // empfohlen: Ihr Ship, immer autorisiert
    },
  },
}
```

Starten Sie das Gateway nach der direkten Bearbeitung der Konfiguration neu. Senden Sie dem Bot anschließend eine Direktnachricht oder
erwähnen Sie ihn mit @ in einem Gruppenkanal.

## Private/LAN-Ships

OpenClaw blockiert zum Schutz vor SSRF standardmäßig private/interne Hostnamen und IP-Bereiche. Wenn Ihr
Ship in einem privaten Netzwerk ausgeführt wird (localhost, LAN-IP, interner Hostname), aktivieren Sie dies ausdrücklich:

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
`http://my-ship.local:8080`. Aktivieren Sie dies nur für eine Ship-URL, der Sie vertrauen; dadurch wird der SSRF-
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

`autoDiscoverChannels` ist standardmäßig `false`, wenn es in der Konfiguration nicht festgelegt ist; im Einrichtungsassistenten ist die
Eingabeaufforderung standardmäßig auf Ja gesetzt und `true` wird ausdrücklich geschrieben. Wenn die Option aktiviert ist, fragt OpenClaw beim Start beigetretene Gruppen per Scry ab,
überwacht neue Kanäle, wenn Gruppeneinladungen angenommen werden, und prüft sie alle 2 Minuten erneut.

## Zugriffskontrolle

Zulassungsliste für Direktnachrichten (leer = keine Direktnachrichten zulässig, es sei denn, der Absender ist `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Die Gruppenautorisierung ist pro Kanal standardmäßig `restricted`. Legen Sie `defaultAuthorizedShips` als
Grundlage fest und überschreiben Sie sie für jeden Kanal-Nest:

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

Sobald der Bot innerhalb eines Threads geantwortet hat, antwortet er weiterhin auf spätere Nachrichten in diesem Thread,
ohne dass eine weitere Erwähnung erforderlich ist.

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

Das Owner-Ship ist überall autorisiert: DM-Einladungen werden immer automatisch angenommen, Gruppeneinladungen werden
immer automatisch angenommen und Kanalnachrichten bestehen immer die Autorisierungsprüfung. Das Owner-Ship muss nicht in
`dmAllowlist`, `defaultAuthorizedShips` oder `groupInviteAllowlist` enthalten sein.

Wenn `ownerShip` festgelegt ist, werden nicht autorisierte Anfragen nicht einfach verworfen – sie werden als ausstehende
Genehmigung in die Warteschlange gestellt und das Owner-Ship erhält eine DM:

- DM-Anfragen von Ships, die nicht in `dmAllowlist` enthalten sind
- Erwähnungen in Kanälen, bei denen der Absender die Autorisierungsprüfung nicht besteht
- Gruppeneinladungen von Ships, die nicht in `groupInviteAllowlist` enthalten sind (wenn die automatische Annahme deaktiviert ist oder aktiviert ist, aber
  der Einladende nicht in der Zulassungsliste steht)

Das Owner-Ship antwortet per DM, um eine Anfrage zu bearbeiten:

| Antwort des Owner-Ships       | Wirkung                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `approve` / `deny` / `block`  | Bearbeitet die neueste ausstehende Genehmigung                             |
| `approve <id>` / `deny <id>`  | Bearbeitet eine bestimmte Genehmigung anhand ihrer ID                      |
| `block`                       | Blockiert das Ship außerdem nativ, sodass es keine neue Verbindung aufbauen kann |
| `unblock ~ship`               | Hebt eine native Blockierung auf                                           |
| `blocked`                     | Listet die derzeit blockierten Ships auf                                   |
| `pending`                     | Listet ausstehende Genehmigungsanfragen auf                                |

Ohne konfiguriertes `ownerShip` werden nicht autorisierte DMs und Kanalerwähnungen einfach verworfen und protokolliert;
es gibt keine Aufforderung zur Genehmigung.

## Einstellungen für die automatische Annahme

DM-Einladungen von Ships automatisch annehmen, die bereits in `dmAllowlist` enthalten sind (das Owner-Ship wird unabhängig
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

Gruppeneinladungen aus einer Zulassungsliste automatisch annehmen (standardmäßig verweigern: Bei `autoAcceptGroupInvites: true` und
einer leeren `groupInviteAllowlist` wird keine Einladung von einem anderen Ship als dem Owner-Ship angenommen):

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

Die meisten der oben genannten Einstellungen (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) werden beim ersten Start in den
`%settings`-Agenten des Ships (Desk `moltbot`, Bucket `tlon`) gespiegelt und anschließend live von dort gelesen,
sodass Änderungen über einen Landscape-Client oder die Einstellungsbefehle des gebündelten Skills ohne einen
Neustart des Gateways wirksam werden. `channelRules` und ausstehende Genehmigungen werden dort ebenfalls als JSON gespeichert. Die
Dateikonfiguration bleibt die maßgebliche Quelle für Werte, die nie in den Einstellungsspeicher geschrieben wurden.

## Zustellziele (CLI/Cron)

Zur Verwendung mit `openclaw message send` oder der Cron-Zustellung:

- DM: `~sampel-palnet` oder `dm/~sampel-palnet`
- Gruppe: `chat/~host-ship/channel` oder `group:~host-ship/channel`

## Gebündelter Skill

Das Plugin bündelt [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), eine CLI für
direkte Urbit-Operationen, die automatisch verfügbar ist, sobald das Plugin installiert wurde:

- **Aktivität**: Erwähnungen, Antworten, ungelesene Nachrichten
- **Kanäle**: auflisten, erstellen, umbenennen
- **Kontakte**: Profile auflisten/abrufen/aktualisieren
- **Gruppen**: erstellen, beitreten, Einladungs-/Anfrageabläufe, Rollen
- **Hooks**: Kanal-Hooks verwalten
- **Nachrichten**: Verlauf, Suche
- **DMs**: senden, reagieren, annehmen/ablehnen
- **Beiträge**: reagieren, löschen
- **Notizbuch**: in Tagebuchkanälen veröffentlichen
- **Einstellungen**: Plugin-Konfiguration über den oben genannten Einstellungsspeicher per Hot-Reload aktualisieren

## Funktionen

| Funktion         | Status                                                      |
| ---------------- | ----------------------------------------------------------- |
| Direktnachrichten | Unterstützt                                                 |
| Gruppen/Kanäle   | Unterstützt (standardmäßig nur bei Erwähnung)               |
| Threads          | Unterstützt (antwortet weiter, sobald es beigetreten ist)   |
| Rich Text        | Markdown wird in das native Format von Tlon konvertiert     |
| Bilder           | Eingehend heruntergeladen, ausgehend hochgeladen            |
| Reaktionen       | Nur über den [gebündelten Skill](#bundled-skill)            |
| Umfragen         | Nicht unterstützt                                           |
| Native Befehle   | Standardmäßig nur für das Owner-Ship                        |

## Fehlerbehebung

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Häufige Fehler:

- **DMs werden ignoriert**: Der Absender ist nicht in `dmAllowlist` enthalten und für den Genehmigungsablauf ist kein `ownerShip` konfiguriert.
- **Gruppennachrichten werden ignoriert**: Der Kanal wurde nicht erkannt/angeheftet oder der Absender besteht die Autorisierungsprüfung nicht und es gibt kein
  `ownerShip`, um eine Genehmigung in die Warteschlange zu stellen.
- **Verbindungsfehler**: Prüfen Sie, ob die Ship-URL erreichbar ist; legen Sie für lokale Ships
  `network.dangerouslyAllowPrivateNetwork` fest.
- **Authentifizierungsfehler**: Anmeldecodes wechseln regelmäßig – kopieren Sie den aktuellen Code von Ihrem Ship.

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

| Schlüssel                                              | Bedeutung                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Aktiviert/deaktiviert den Kanalstart.                                  |
| `channels.tlon.ship`                                   | Urbit-Ship-Name des Bots (z. B. `~sampel-palnet`).                     |
| `channels.tlon.url`                                    | Ship-URL (z. B. `https://sampel-palnet.tlon.network`).                 |
| `channels.tlon.code`                                   | Anmeldecode des Ships.                                                  |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Erlaubt localhost-/LAN-Ship-URLs (explizite SSRF-Aktivierung).         |
| `channels.tlon.ownerShip`                              | Owner-Ship: immer autorisiert, empfängt Genehmigungsanfragen.          |
| `channels.tlon.dmAllowlist`                            | Ships mit DM-Berechtigung (leer = keine außer dem Owner-Ship).         |
| `channels.tlon.autoAcceptDmInvites`                    | Nimmt DMs von Ships in `dmAllowlist` automatisch an.                   |
| `channels.tlon.autoAcceptGroupInvites`                 | Nimmt Gruppeneinladungen aus `groupInviteAllowlist` automatisch an.    |
| `channels.tlon.groupInviteAllowlist`                   | Ships, deren Gruppeneinladungen automatisch angenommen werden.        |
| `channels.tlon.autoDiscoverChannels`                   | Erkennt beigetretene Gruppenkanäle automatisch (Standard: `false`).    |
| `channels.tlon.groupChannels`                          | Manuell angeheftete Kanal-Nests.                                       |
| `channels.tlon.defaultAuthorizedShips`                 | Für alle Kanäle autorisierte Ships (verwendet, wenn keine Regel zutrifft). |
| `channels.tlon.authorization.channelRules`             | Autorisierungsmodus und Zulassungsliste pro Kanal-Nest.                |
| `channels.tlon.showModelSignature`                     | Hängt `_[Generated by <model>]_` an Antworten an.                      |
| `channels.tlon.responsePrefix`                         | Statisches Präfix, das ausgehenden Antworten vorangestellt wird.       |
| `channels.tlon.accounts.<id>`                          | Zusätzliche benannte Konten (Setups mit mehreren Ships).               |

## Hinweise

- Gruppenantworten benötigen eine @-Erwähnung (z. B. `~your-bot-ship`), sofern der Bot diesem Thread nicht bereits beigetreten ist.
- Thread-Antworten werden im Thread veröffentlicht; außerdem werden dem Agenten die letzten 10 Nachrichten des Thread-Kontexts
  vorangestellt.
- Rich Text (fett, kursiv, Code, Überschriften, Listen) wird in das native Format von Tlon konvertiert.
- Wenn eine eingehende Nachricht eine Kanalzusammenfassung anfordert (zum Beispiel „Diesen
  Kanal zusammenfassen“), wird anstelle des normalen Antwortablaufs eine integrierte Verlaufszusammenfassung ausgelöst.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Beschränkung auf Erwähnungen
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
