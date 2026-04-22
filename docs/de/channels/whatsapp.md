---
read_when:
    - Arbeiten am WhatsApp-/Web-Channel-Verhalten oder am Inbox-Routing
summary: WhatsApp-Channel-Unterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:20:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web-Channel)

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  bieten beim ersten Auswählen des WhatsApp-Plugins eine Installationsaufforderung an.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Channel + Git-Checkout: Standardmäßig wird der lokale Plugin-Pfad verwendet.
- Stable/Beta: Standardmäßig wird das npm-Paket `@openclaw/whatsapp` verwendet.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Standard-DM-Richtlinie ist Pairing für unbekannte Absender.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für Channel-Konfigurationen.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="WhatsApp-Zugriffsrichtlinie konfigurieren">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp verknüpfen (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Das Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Erste Pairing-Anfrage genehmigen (bei Verwendung des Pairing-Modus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing-Anfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Channel begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer zu betreiben. (Die Channel-Metadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwirrung durch Chats mit sich selbst

    Minimales Richtlinienmuster:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback mit persönlicher Nummer">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit richten sich Selbstchat-Schutzmechanismen nach der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Nur-WhatsApp-Web-Channel-Bereich">
    Der Messaging-Plattform-Channel basiert in der aktuellen OpenClaw-Channel-Architektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Channel in der integrierten Chat-Channel-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber channel-spezifischen WhatsApp-Proxy-Einstellungen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direktchats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Multi-Account-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Channel-Ebene.

    Details zum Laufzeitverhalten:

    - Pairings werden im Channel-Allow-Store gespeichert und mit dem konfigurierten `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - ausgehende `fromMe`-DMs werden niemals automatisch gepairt

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenzugehörigkeit** (`channels.whatsapp.groups`)
       - wenn `groups` weggelassen wird, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Absenderrichtlinie für Gruppen** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Sender-Allowlist wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Sender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, falls verfügbar
    - Sender-Allowlists werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Gruppenrichtlinien-Fallback zur Laufzeit `allowlist` (mit einer Warnmeldung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-an-Bot-Erkennung (Absender der Antwort stimmt mit der Bot-Identität überein)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur die Erwähnungssteuerung; sie gewährt **keine** Absenderautorisierung
    - bei `groupPolicy: "allowlist"` werden nicht auf der Allowlist stehende Absender weiterhin blockiert, auch wenn sie auf die Nachricht eines auf der Allowlist stehenden Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist per Owner-Gating geschützt.

  </Tab>
</Tabs>

## Verhalten mit persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden Schutzmechanismen für WhatsApp-Selbstchats aktiviert:

- Lesebestätigungen für Selbstchat-Züge überspringen
- Verhalten zum automatischen Triggern per Erwähnungs-JID ignorieren, das Sie sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbstchat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadatenfelder zur Antwort werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakten">
    Eingehende Nur-Medien-Nachrichten werden mit Platzhaltern normalisiert wie:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standort- und Kontakt-Payloads werden vor dem Routing in textuellen Kontext normalisiert.

  </Accordion>

  <Accordion title="Einfügen ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Markierungen für die Einfügung:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Lesebestätigungen sind standardmäßig für akzeptierte eingehende WhatsApp-Nachrichten aktiviert.

    Global deaktivieren:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Überschreibung pro Konto:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Selbstchat-Züge überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standardlimit für Chunks: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensicheres Chunking zurück
  </Accordion>

  <Accordion title="Verhalten bei ausgehenden Medien">
    - unterstützt Payloads für Bilder, Videos, Audio (PTT-Sprachnachricht) und Dokumente
    - `audio/ogg` wird für die Kompatibilität mit Sprachnachrichten zu `audio/ogg; codecs=opus` umgeschrieben
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Bildunterschriften werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Grenzen für Mediengröße und Fallback-Verhalten">
    - Speichergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendegrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größen-/Qualitätsdurchlauf), um in die Grenzen zu passen
    - bei Fehlern beim Senden von Medien sendet der Fallback des ersten Elements eine Textwarnung, anstatt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Reaktionsebene

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Ebene         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                      |
| ------------- | ---------------------- | --------------------------------- | ------------------------------------------------ |
| `"off"`       | Nein                   | Nein                              | Überhaupt keine Reaktionen                       |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Empfang vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)                | Bestätigung + Agent-Reaktionen mit zurückhaltender Steuerung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agent-Reaktionen mit empfohlener Steuerung   |

Standard: `"minimal"`.

Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Bestätigungsreaktionen

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
Bestätigungsreaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Hinweise zum Verhalten:

- werden sofort gesendet, nachdem eine eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber die normale Antwortzustellung nicht
- im Gruppenmodus `mentions` wird bei durch Erwähnung ausgelösten Zügen reagiert; Gruppenaktivierung `always` umgeht diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Multi-Account und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontenauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontenauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Auflösung normalisiert
  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Backup-Datei: `creds.json.bak`
    - Legacy-Standard-Auth in `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Verhalten beim Abmelden">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In Legacy-Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Durch den Channel initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Channel-Status meldet „nicht verknüpft“.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Behebung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Allowlist-Einträge in `groups`
    - Erwähnungssteuerung (`requireMention` + Muster für Erwähnungen)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, daher pro Bereich nur ein `groupPolicy` verwenden

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die Laufzeit des WhatsApp-Gateways sollte Node verwenden. Bun ist als inkompatibel für einen stabilen Betrieb des WhatsApp-/Telegram-Gateways markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt es die `groups`-Map auf Root-Ebene vollständig (kein Deep-Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder keinen `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt es die `direct`-Map auf Root-Ebene vollständig (kein Deep-Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für Direktnachrichten** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag fehlt oder keinen `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichtgewichtige Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen befinden sich unter `direct`.

**Unterschied zum Multi-Account-Verhalten von Telegram:** Bei Telegram wird `groups` auf Root-Ebene in einem Multi-Account-Setup absichtlich für alle Konten unterdrückt — selbst für Konten, die keine eigenen `groups` definieren —, damit ein Bot keine Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem Multi-Account-WhatsApp-Setup gruppen- oder direktchatbezogene Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Group-Allowlist auf Chat-Ebene. Auf Root- oder Kontoebene bedeutet `groups["*"]` „alle Gruppen sind für diesen Bereich zugelassen“.
- Fügen Sie nur dann einen Wildcard-`systemPrompt` für Gruppen hinzu, wenn Sie ohnehin möchten, dass in diesem Bereich alle Gruppen zugelassen sind. Wenn weiterhin nur eine feste Menge an Gruppen-IDs infrage kommen soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie stattdessen den Prompt in jedem explizit auf die Allowlist gesetzten Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Zugriff von Absendern wird weiterhin separat über `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs nicht denselben Nebeneffekt. `direct["*"]` stellt nur eine Standardkonfiguration für Direktchats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Pairing-Stores zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn im Root-Bereich alle Gruppen zugelassen werden sollen.
        // Gilt für alle Konten, die keine eigene groups-Map definieren.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Map definieren.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden groups auf Root-Ebene
            // vollständig ersetzt. Um einen Wildcard-Eintrag zu behalten, definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen werden sollen.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Map, daher werden direct-Einträge auf Root-Ebene
            // vollständig ersetzt. Um einen Wildcard-Eintrag zu behalten, definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Verweise zur Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - WhatsApp](/de/gateway/configuration-reference#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Pairing](/de/channels/pairing)
- [Groups](/de/channels/groups)
- [Security](/de/gateway/security)
- [Channel routing](/de/channels/channel-routing)
- [Multi-agent routing](/de/concepts/multi-agent)
- [Troubleshooting](/de/channels/troubleshooting)
