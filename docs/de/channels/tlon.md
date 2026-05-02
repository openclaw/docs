---
read_when:
    - Arbeiten an Funktionen für den Tlon/Urbit-Kanal
summary: Supportstatus, Funktionen und Konfiguration für Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon ist ein dezentraler Messenger, der auf Urbit basiert. OpenClaw verbindet sich mit Ihrem Urbit-Ship und kann
auf Direktnachrichten und Gruppenchat-Nachrichten antworten. Gruppenantworten erfordern standardmäßig eine @-Erwähnung und können
über Allowlists weiter eingeschränkt werden.

Status: gebündeltes Plugin. Direktnachrichten, Gruppenerwähnungen, Thread-Antworten, Rich-Text-Formatierung und
Bild-Uploads werden unterstützt. Reaktionen und Umfragen werden noch nicht unterstützt.

## Gebündeltes Plugin

Tlon wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte
Builds keine separate Installation.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die Tlon ausschließt, installieren Sie ein
aktuelles npm-Paket:

Installation per CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/tlon
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Lokaler Checkout (wenn Sie aus einem Git-Repository ausführen):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/de/tools/plugin)

## Einrichtung

1. Stellen Sie sicher, dass das Tlon-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erfassen Sie Ihre Ship-URL und Ihren Anmeldecode.
3. Konfigurieren Sie `channels.tlon`.
4. Starten Sie das Gateway neu.
5. Senden Sie dem Bot eine Direktnachricht oder erwähnen Sie ihn in einem Gruppenkanal.

Minimale Konfiguration (einzelnes Konto):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Private/LAN-Ships

Standardmäßig blockiert OpenClaw private/interne Hostnamen und IP-Bereiche zum SSRF-Schutz.
Wenn Ihr Ship in einem privaten Netzwerk ausgeführt wird (localhost, LAN-IP oder interner Hostname),
müssen Sie dies ausdrücklich aktivieren:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Dies gilt für URLs wie:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Aktivieren Sie dies nur, wenn Sie Ihrem lokalen Netzwerk vertrauen. Diese Einstellung deaktiviert SSRF-Schutzmaßnahmen
für Anfragen an Ihre Ship-URL.

## Gruppenkanäle

Die automatische Erkennung ist standardmäßig aktiviert. Sie können Kanäle auch manuell festlegen:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Automatische Erkennung deaktivieren:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Zugriffskontrolle

Allowlist für Direktnachrichten (leer = keine Direktnachrichten erlaubt, verwenden Sie `ownerShip` für den Genehmigungsablauf):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Gruppenautorisierung (standardmäßig eingeschränkt):

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

## Owner- und Genehmigungssystem

Legen Sie ein Owner-Ship fest, um Genehmigungsanfragen zu erhalten, wenn nicht autorisierte Benutzer zu interagieren versuchen:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Das Owner-Ship ist **überall automatisch autorisiert** — Einladungen zu Direktnachrichten werden automatisch akzeptiert und
Kanalnachrichten sind immer erlaubt. Sie müssen den Owner nicht zu `dmAllowlist` oder
`defaultAuthorizedShips` hinzufügen.

Wenn festgelegt, erhält der Owner Direktnachrichten-Benachrichtigungen für:

- Direktnachrichten-Anfragen von Ships, die nicht in der Allowlist sind
- Erwähnungen in Kanälen ohne Autorisierung
- Gruppeneinladungsanfragen

## Einstellungen für automatische Annahme

Einladungen zu Direktnachrichten automatisch annehmen (für Ships in dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Gruppeneinladungen automatisch annehmen:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Zustellziele (CLI/Cron)

Verwenden Sie diese mit `openclaw message send` oder Cron-Zustellung:

- Direktnachricht: `~sampel-palnet` oder `dm/~sampel-palnet`
- Gruppe: `chat/~host-ship/channel` oder `group:~host-ship/channel`

## Gebündeltes Skill

Das Tlon-Plugin enthält ein gebündeltes Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
das CLI-Zugriff auf Tlon-Operationen bereitstellt:

- **Kontakte**: Profile abrufen/aktualisieren, Kontakte auflisten
- **Kanäle**: auflisten, erstellen, Nachrichten posten, Verlauf abrufen
- **Gruppen**: auflisten, erstellen, Mitglieder verwalten
- **Direktnachrichten**: Nachrichten senden, auf Nachrichten reagieren
- **Reaktionen**: Emoji-Reaktionen zu Posts und Direktnachrichten hinzufügen/entfernen
- **Einstellungen**: Plugin-Berechtigungen über Slash-Befehle verwalten

Das Skill ist automatisch verfügbar, wenn das Plugin installiert ist.

## Funktionen

| Funktion           | Status                                           |
| ------------------ | ------------------------------------------------ |
| Direktnachrichten  | ✅ Unterstützt                                   |
| Gruppen/Kanäle     | ✅ Unterstützt (standardmäßig erwähnungsgesteuert) |
| Threads            | ✅ Unterstützt (automatische Antworten im Thread) |
| Rich Text          | ✅ Markdown wird in das Tlon-Format konvertiert  |
| Bilder             | ✅ In den Tlon-Speicher hochgeladen              |
| Reaktionen         | ✅ Über [gebündeltes Skill](#bundled-skill)      |
| Umfragen           | ❌ Noch nicht unterstützt                        |
| Native Befehle     | ✅ Unterstützt (standardmäßig nur Owner)         |

## Fehlerbehebung

Führen Sie zuerst diese Leiter aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Häufige Fehler:

- **Direktnachrichten werden ignoriert**: Absender ist nicht in `dmAllowlist` und kein `ownerShip` für den Genehmigungsablauf konfiguriert.
- **Gruppennachrichten werden ignoriert**: Kanal wurde nicht erkannt oder Absender ist nicht autorisiert.
- **Verbindungsfehler**: Prüfen Sie, ob die Ship-URL erreichbar ist; aktivieren Sie `allowPrivateNetwork` für lokale Ships.
- **Authentifizierungsfehler**: Stellen Sie sicher, dass der Anmeldecode aktuell ist (Codes rotieren).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.tlon.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.tlon.ship`: Urbit-Ship-Name des Bots (z. B. `~sampel-palnet`).
- `channels.tlon.url`: Ship-URL (z. B. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: Ship-Anmeldecode.
- `channels.tlon.allowPrivateNetwork`: localhost-/LAN-URLs zulassen (SSRF-Umgehung).
- `channels.tlon.ownerShip`: Owner-Ship für das Genehmigungssystem (immer autorisiert).
- `channels.tlon.dmAllowlist`: Ships, die Direktnachrichten senden dürfen (leer = keine).
- `channels.tlon.autoAcceptDmInvites`: Direktnachrichten von Ships in der Allowlist automatisch annehmen.
- `channels.tlon.autoAcceptGroupInvites`: alle Gruppeneinladungen automatisch annehmen.
- `channels.tlon.autoDiscoverChannels`: Gruppenkanäle automatisch erkennen (Standard: true).
- `channels.tlon.groupChannels`: manuell festgelegte Kanal-Nests.
- `channels.tlon.defaultAuthorizedShips`: Ships, die für alle Kanäle autorisiert sind.
- `channels.tlon.authorization.channelRules`: Authentifizierungsregeln pro Kanal.
- `channels.tlon.showModelSignature`: Modellnamen an Nachrichten anhängen.

## Hinweise

- Gruppenantworten erfordern eine Erwähnung (z. B. `~your-bot-ship`), um zu antworten.
- Thread-Antworten: Wenn sich die eingehende Nachricht in einem Thread befindet, antwortet OpenClaw im Thread.
- Rich Text: Markdown-Formatierung (fett, kursiv, Code, Überschriften, Listen) wird in das native Format von Tlon konvertiert.
- Bilder: URLs werden in den Tlon-Speicher hochgeladen und als Bildblöcke eingebettet.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — Authentifizierung per Direktnachricht und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungssteuerung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
