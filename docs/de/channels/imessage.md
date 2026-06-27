---
read_when:
    - iMessage-Unterstützung einrichten
    - Debugging von iMessage-Senden/-Empfangen
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Einrichtungen, wenn die Host-Anforderungen passen.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw iMessage-Bereitstellungen `imsg` auf einem angemeldeten macOS-Messages-Host. Wenn Ihr Gateway unter Linux oder Windows läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Die eingehende Wiederherstellung erfolgt automatisch.** Nach einem Neustart der Bridge oder des Gateways spielt iMessage die Nachrichten erneut ab, die während des Ausfalls verpasst wurden, und unterdrückt die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausspülen kann; dabei wird dedupliziert, sodass nichts doppelt verteilt wird. Es gibt keine zu aktivierende Konfiguration — siehe [Eingehende Wiederherstellung nach einem Neustart der Bridge oder des Gateways](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Die BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage ausschließlich über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und eine erfolgreiche Private-API-Prüfung.

<CardGroup cols={3}>
  <Card title="Private-API-Aktionen" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
  </Card>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Remote-Mac" icon="terminal" href="#remote-mac-over-ssh">
    Verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf dem Messages-Mac läuft.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und prüfen">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Erstes DM-Pairing genehmigen (standardmäßige dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing-Anfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote-Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`; Sie können `cliPath` daher auf ein Wrapper-Skript setzen, das per SSH eine Verbindung zu einem Remote-Mac herstellt und `imsg` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Empfohlene Konfiguration, wenn Anhänge aktiviert sind:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn durch Parsen des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet strikte Host-Key-Prüfung für SCP; der Relay-Host-Key muss daher bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen zulässige Roots (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

<Warning>
Jeder `cliPath`-Wrapper oder SSH-Proxy, den Sie vor `imsg` schalten, MUSS sich für langlebiges JSON-RPC wie eine transparente stdio-Pipe verhalten. OpenClaw tauscht über stdin/stdout des Wrappers während der gesamten Lebensdauer des Kanals kleine, zeilenbasierte JSON-RPC-Nachrichten aus:

- Leiten Sie jeden stdin-Chunk/jede stdin-Zeile **weiter, sobald Bytes verfügbar sind** — warten Sie nicht auf EOF.
- Leiten Sie jeden stdout-Chunk/jede stdout-Zeile umgehend in die Gegenrichtung weiter.
- Bewahren Sie Zeilenumbrüche.
- Vermeiden Sie blockierende Lesevorgänge fester Größe (`read(4096)`, `cat | buffer`, Standard-Shell-`read`), die kleine Frames verhungern lassen können.
- Halten Sie stderr getrennt vom JSON-RPC-stdout-Stream.

Ein Wrapper, der stdin puffert, bis ein großer Block gefüllt ist, erzeugt Symptome, die wie ein iMessage-Ausfall aussehen — `imsg rpc timeout (chats.list)` oder wiederholte Kanalneustarts — obwohl `imsg rpc` selbst intakt ist. `ssh -T host imsg "$@"` (oben) ist sicher, weil es die `cliPath`-Argumente von OpenClaw wie `rpc` und `--db` weiterleitet. Pipelines wie `ssh host imsg | grep -v '^DEBUG'` sind NICHT sicher — zeilengepufferte Tools können Frames trotzdem zurückhalten; verwenden Sie `stdbuf -oL -eL` in jeder Stufe, wenn Sie filtern müssen.
</Warning>

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` läuft.
- Full Disk Access ist für den Prozesskontext erforderlich, der OpenClaw/`imsg` ausführt (Zugriff auf die Messages-Datenbank).
- Die Automation-Berechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (Reagieren / Bearbeiten / Zurücknehmen / Thread-Antwort / Effekte / Gruppenoperationen) muss System Integrity Protection deaktiviert sein — siehe [Aktivieren der imsg Private API](#enabling-the-imsg-private-api) unten. Einfaches Senden/Empfangen von Text und Medien funktioniert ohne diese Einstellung.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn das Gateway headless läuft (LaunchAgent/SSH), führen Sie in demselben Kontext einmalig einen interaktiven Befehl aus, um Aufforderungen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Senden über SSH-Wrapper schlägt mit AppleEvents -1743 fehl">
  Ein Remote-SSH-Setup kann Chats lesen, `channels status --probe` bestehen und eingehende Nachrichten verarbeiten, während ausgehende Sends weiterhin mit einem AppleEvents-Autorisierungsfehler fehlschlagen:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Prüfen Sie die TCC-Datenbank des angemeldeten Mac-Benutzers oder Systemeinstellungen > Datenschutz & Sicherheit > Automation. Wenn der Automation-Eintrag für `/usr/libexec/sshd-keygen-wrapper` statt für den `imsg`- oder lokalen Shell-Prozess erfasst ist, zeigt macOS für diesen SSH-serverseitigen Client möglicherweise keinen nutzbaren Messages-Schalter an:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In diesem Zustand können wiederholtes `tccutil reset AppleEvents` oder erneutes Ausführen von `imsg send` über denselben SSH-Wrapper weiterhin fehlschlagen, weil der Prozesskontext, der Messages-Automation benötigt, der SSH-Wrapper ist und keine App, der die UI eine Berechtigung erteilen kann.

Verwenden Sie stattdessen einen der unterstützten `imsg`-Prozesskontexte:

- Führen Sie das Gateway oder zumindest die `imsg`-Bridge in der lokalen Sitzung des angemeldeten Messages-Benutzers aus.
- Starten Sie das Gateway mit einem LaunchAgent für diesen Benutzer, nachdem Full Disk Access und Automation aus derselben Sitzung erteilt wurden.
- Wenn Sie die Zwei-Benutzer-SSH-Topologie beibehalten, prüfen Sie, dass ein echter ausgehender `imsg send` über exakt denselben Wrapper erfolgreich ist, bevor Sie den Kanal aktivieren. Wenn Automation nicht erteilt werden kann, konfigurieren Sie stattdessen auf ein Ein-Benutzer-`imsg`-Setup um, anstatt sich für Sends auf den SSH-Wrapper zu verlassen.

</Accordion>

## Aktivieren der imsg Private API

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehendes Watch/History, Chatliste. Das erhalten Sie direkt nach einem frischen `brew install steipete/tap/imsg` plus den oben genannten standardmäßigen macOS-Berechtigungen.
- **Private-API-Modus**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (Thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die erweiterte Aktionsoberfläche zu erreichen, die diese Kanalseite dokumentiert, benötigen Sie den Private-API-Modus. Das `imsg`-README nennt die Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, bridge-gestütztes Rich Send, Nachrichtenmutation und Chatverwaltung sind Opt-in. Sie erfordern, dass SIP deaktiviert ist und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Helper-Injection-Technik verwendet `imsg`'s eigene dylib, um die Private APIs von Messages zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server und keine BlueBubbles-Runtime.

<Warning>
**Das Deaktivieren von SIP ist ein realer Sicherheitskompromiss.** SIP ist eine der Kernschutzfunktionen von macOS gegen das Ausführen veränderten Systemcodes; systemweites Abschalten öffnet zusätzliche Angriffsflächen und kann Nebenwirkungen haben. Insbesondere **deaktiviert das Abschalten von SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste Betriebsentscheidung, nicht als Standard. Wenn Ihr Bedrohungsmodell deaktiviertes SIP nicht zulässt, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeiten / Zurücknehmen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, sodass Sie sehen können, was der aktuelle Build unterstützt, bevor Sie beginnen.

2. **Deaktivieren Sie System Integrity Protection und (auf modernem macOS) Library Validation.** Das Injizieren einer Nicht-Apple-Hilfs-dylib in die von Apple signierte `Messages.app` erfordert deaktiviertes SIP **und** gelockerte Library Validation. Der SIP-Schritt im Recovery-Modus ist macOS-versionsspezifisch:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Library Validation über Terminal deaktivieren, in den Recovery-Modus neu starten, `csrutil disable` ausführen, neu starten.
   - **macOS 11+ (Big Sur und später), Intel:** Recovery-Modus (oder Internet Recovery), `csrutil disable`, neu starten.
   - **macOS 11+, Apple Silicon:** Startsequenz über die Ein/Aus-Taste, um Recovery zu öffnen; halten Sie bei aktuellen macOS-Versionen die **linke Umschalttaste** gedrückt, wenn Sie auf Fortfahren klicken, dann `csrutil disable`. Setups mit virtuellen Maschinen folgen einem separaten Ablauf; erstellen Sie daher zuerst einen VM-Snapshot.

   **Unter macOS 11 und später reicht `csrutil disable` allein normalerweise nicht aus.** Apple erzwingt weiterhin Library Validation gegen `Messages.app` als Platform Binary, sodass ein ad-hoc-signierter Helper abgelehnt wird (`Library Validation failed: ... platform binary, but mapped file is not`), selbst wenn SIP deaktiviert ist. Deaktivieren Sie nach dem Deaktivieren von SIP auch Library Validation und starten Sie neu:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verifiziert auf 26.5.1:** SIP aus **plus** der obige `DisableLibraryValidation`-Befehl reicht aus, um den Helper über 26.0 bis 26.5.x hinweg zu injizieren. **Keine boot-args sind erforderlich.** Die plist ist der entscheidende Faktor und der häufigste fehlende Schritt, wenn die Injektion auf Tahoe fehlschlägt:
   - **Mit der plist:** `imsg launch` injiziert, und `imsg status` meldet `advanced_features: true`.
   - **Ohne die plist (selbst bei deaktiviertem SIP):** `imsg launch` schlägt mit `Failed to launch: Timeout waiting for Messages.app to initialize` fehl. AMFI weist den ad-hoc-Helper beim Laden zurück, sodass die Bridge nie bereit wird und der Start in ein Timeout läuft. Dieses Timeout ist das Symptom, auf das die meisten Personen unter Tahoe stoßen; die Korrektur ist die obige plist, nicht etwas Drastischeres.

   Dies wurde mit einem kontrollierten Vorher/Nachher-Test auf macOS 26.5.1 (Apple Silicon) bestätigt: Mit der plist wird die dylib in `Messages.app` gemappt und die Bridge startet; entfernen Sie die plist und starten Sie neu, erzeugt `imsg launch` den oben genannten Timeout-Fehler, wobei die dylib nicht gemappt wird.

   Wenn die Injektion von `imsg launch` oder bestimmte `selectors` nach einem macOS-Upgrade `false` zurückgeben, ist dieses Gate die übliche Ursache. Prüfen Sie Ihren SIP- und Library-Validation-Status, bevor Sie annehmen, dass der SIP-Schritt selbst fehlgeschlagen ist. Wenn diese Einstellungen korrekt sind und die Bridge weiterhin nicht injizieren kann, sammeln Sie `imsg status --json` sowie die Ausgabe von `imsg launch` und melden Sie dies an das `imsg`-Projekt, statt zusätzliche systemweite Sicherheitskontrollen abzuschwächen.

   Folgen Sie Apples Recovery-Mode-Ablauf für Ihren Mac, um SIP zu deaktivieren, bevor Sie `imsg launch` ausführen.

3. **Hilfsprozess injizieren.** Mit deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist. Damit dient dies zugleich als Bestätigung, dass Schritt 2 gegriffen hat.

4. **Bridge aus OpenClaw verifizieren:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '.selectors'` sollte `retractMessagePart: true` sowie die Editier-/Tipp-/Lesebestätigungs-Selektoren zeigen, die Ihr macOS-Build bereitstellt. Das pro Methode arbeitende Gating des OpenClaw-Plugins in `actions.ts` bewirbt nur Aktionen, deren zugrunde liegender Selektor `true` ist. Daher spiegelt die Aktionsoberfläche, die Sie in der Tool-Liste des Agenten sehen, wider, was die Bridge auf diesem Host tatsächlich tun kann.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen aber zur Versandzeit „iMessage `<action>` erfordert die private `imsg`-API-Bridge“ auslösen, führen Sie `imsg launch` erneut aus — der Hilfsprozess kann herausfallen (Neustart von Messages.app, OS-Update usw.), und der zwischengespeicherte Status `available: true` bewirbt Aktionen weiter, bis der nächste Probe ihn aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfangen.
- Das OpenClaw-Plugin bewirbt weiterhin Text-/Medienversand und Eingangsüberwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß dem pro Methode arbeitenden Capability-Gate).
- Sie können einen separaten Nicht-Apple-Silicon-Mac (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Workload betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe [Dedizierter Bot-macOS-Benutzer (separate iMessage-Identität)](#deployment-patterns) unten.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge müssen Absender identifizieren: Handles oder statische Absenderzugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chat-Ziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische `chat_id`-Registrierungsschlüssel.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Gruppenabsender-Allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können auch auf statische Absenderzugriffsgruppen verweisen (`accessGroup:<name>`).

    Runtime-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, verwenden iMessage-Gruppenabsenderprüfungen `allowFrom`; setzen Sie `groupAllowFrom`, wenn sich die Zulassung für Direktnachrichten und Gruppen unterscheiden soll.
    Runtime-Hinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Runtime auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppenrouting hat **zwei** Allowlist-Gates, die direkt nacheinander ausgeführt werden, und beide müssen bestehen:

    1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder einen Wildcard-Eintrag `groups: { "*": { ... } }` (setzt `allowAll = true`) oder einen expliziten Eintrag pro `chat_id` unter `groups`.

    Wenn Gate 2 leer ist, wird jede Gruppennachricht verworfen. Das Plugin gibt auf der Standard-Logstufe zwei Signale auf `warn`-Ebene aus:

    - einmalig pro Konto beim Start: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - einmalig pro `chat_id` zur Laufzeit: `imessage: dropping group message from chat_id=<id> ...`

    Direktnachrichten funktionieren weiter, weil sie einen anderen Codepfad verwenden.

    Minimale Konfiguration, damit Gruppen unter `groupPolicy: "allowlist"` weiterlaufen:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Wenn diese `warn`-Zeilen im Gateway-Log erscheinen, verwirft Gate 2 — fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Erwähnungsmetadaten
    - Erwähnungserkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

    `systemPrompt` pro Gruppe:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert einen optionalen `systemPrompt`-String. Der Wert wird in jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten injiziert. Die Auflösung entspricht der Prompt-Auflösung pro Gruppe, die von `channels.whatsapp.groups` verwendet wird:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` ein leerer String (`""`) ist, wird die Wildcard unterdrückt und auf diese Gruppe kein System-Prompt angewendet.
    2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag vollständig in der Map fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts pro Gruppe gelten nur für Gruppennachrichten — Direktnachrichten in diesem Kanal bleiben unberührt.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Direktnachrichten verwenden direktes Routing; Gruppen verwenden Gruppenrouting.
    - Mit dem Standard `session.dmScope=main` werden iMessage-Direktnachrichten in die Hauptsession des Agenten zusammengeführt.
    - Gruppensessions sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der ursprünglichen Kanal-/Zielmetadaten zurück an iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eintreffen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Gruppensession-Isolierung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Legacy-iMessage-Chats können auch an ACP-Sessions gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der Direktnachricht oder im erlaubten Gruppenchat aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Session geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Session an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Session und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Top-Level-`bindings[]`-Einträge mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisierten Direktnachrichten-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>` (empfohlen für stabile Gruppenbindungen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Siehe [ACP-Agenten](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Verwenden Sie eine dedizierte Apple-ID und einen macOS-Benutzer, damit Bot-Traffic von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Dedizierten macOS-Benutzer erstellen/anmelden.
    2. In diesem Benutzer mit der Bot-Apple-ID bei Messages anmelden.
    3. `imsg` in diesem Benutzer installieren.
    4. SSH-Wrapper erstellen, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil zeigen lassen.

    Der erste Lauf kann GUI-Genehmigungen (Automation + Full Disk Access) in dieser Bot-Benutzersession erfordern.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Häufige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` laufen auf einem Mac in Ihrem Tailnet
    - `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` aktiviert SCP-Attachment-Abrufe

    Beispiel:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Verwenden Sie SSH-Schlüssel, damit sowohl SSH als auch SCP nicht interaktiv sind.
    Stellen Sie zuerst sicher, dass der Host-Schlüssel vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage unterstützt kontospezifische Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Attachment-Root-Allowlists überschreiben.

  </Accordion>

  <Accordion title="Direct-message history">
    Setzen Sie `channels.imessage.dmHistoryLimit`, um neue Direktnachrichten-Sessions mit dem aktuellen dekodierten `imsg`-Verlauf für diese Konversation zu initialisieren. Verwenden Sie `channels.imessage.dms["<sender>"].historyLimit` für absenderspezifische Überschreibungen, einschließlich `0`, um den Verlauf für einen Absender zu deaktivieren.

    Der iMessage-Direktnachrichtenverlauf wird bei Bedarf von `imsg` abgerufen. Wenn `dmHistoryLimit` nicht gesetzt ist, ist die globale Initialisierung des Direktnachrichtenverlaufs deaktiviert, aber ein positiver absenderspezifischer Wert `channels.imessage.dms["<sender>"].historyLimit` aktiviert die Initialisierung für diesen Absender weiterhin.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Wenn dies deaktiviert ist, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Protokollzeile.
    - entfernte Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen erlaubten Stammverzeichnissen entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Standard-Stammmuster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

  </Accordion>

  <Accordion title="Aufteilung ausgehender Nachrichten">
    - Text-Chunk-Grenze: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (absatzbasierte Aufteilung zuerst)

  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (empfohlen für stabiles Routing)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-Ziele werden ebenfalls unterstützt:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private-API-Aktionen

Wenn `imsg launch` läuft und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichten-Tool zusätzlich zum normalen Textversand iMessage-native Aktionen verwenden.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbare Aktionen">
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden Herz, Daumen hoch, Daumen runter, Lachen, Hervorheben und Frage zugeordnet.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message`, plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`).
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`).
    - **edit**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen bearbeiten (`messageId`, `text` oder `newText`).
    - **unsend**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen zurückziehen (`messageId`).
    - **upload-file**: Medien/Dateien senden (`buffer` als base64 oder ein hydriertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy-Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenunterhaltung ist.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, sofern verfügbar. Kurze IDs sind auf den aktuellen SQLite-gestützten Antwort-Cache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Funktionserkennung">
    OpenClaw blendet Private-API-Aktionen nur aus, wenn der zwischengespeicherte Probe-Status angibt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben Aktionen sichtbar und führen Probes verzögert beim Dispatch aus, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippen">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats als gelesen markiert, und direkte Chats zeigen eine Tippblase, sobald der Turn akzeptiert wird, während der Agent Kontext vorbereitet und generiert. Deaktivieren Sie die Lesemarkierung mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der funktionsbezogenen Methodenliste liegen, deaktivieren Tippen/Lesen stillschweigend; OpenClaw protokolliert pro Neustart eine einmalige Warnung, damit die fehlende Bestätigung nachvollziehbar ist.

  </Accordion>

  <Accordion title="Eingehende Tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und leitet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext weiter, sodass ein Benutzer-Tapback keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standard): nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: für alle eingehenden Tapbacks autorisierter Absender benachrichtigen.
    - `"off"`: eingehende Tapbacks ignorieren.

    Kontoabhängige Überschreibungen verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Genehmigungsreaktionen (👍 / 👎)">
    Wenn `approvals.exec.enabled` oder `approvals.plugin.enabled` true ist und die Anfrage an iMessage geroutet wird, liefert der Gateway eine Genehmigungsaufforderung nativ aus und akzeptiert einen Tapback, um sie aufzulösen:

    - `👍` (Daumen-hoch-Tapback) → `allow-once`
    - `👎` (Daumen-runter-Tapback) → `deny`
    - `allow-always` bleibt ein manueller Fallback: Senden Sie `/approve <id> allow-always` als reguläre Antwort.

    Die Reaktionsverarbeitung erfordert, dass der Handle des reagierenden Benutzers ein expliziter Genehmiger ist. Die Genehmigerliste wird aus `channels.imessage.allowFrom` (oder `channels.imessage.accounts.<id>.allowFrom`) gelesen; fügen Sie die Telefonnummer des Benutzers im E.164-Format oder dessen Apple-ID-E-Mail hinzu. Der Wildcard-Eintrag `"*"` wird berücksichtigt, erlaubt aber jedem Absender die Genehmigung. Die Reaktionsverknüpfung umgeht absichtlich `reactionNotifications`, `dmPolicy` und `groupAllowFrom`, weil die explizite Genehmiger-Allowlist das einzige relevante Gate für die Genehmigungsauflösung ist.

    **Verhaltensänderung mit diesem Release:** Wenn `channels.imessage.allowFrom` nicht leer ist, wird der Textbefehl `/approve <id> <decision>` jetzt gegen diese Genehmigerliste autorisiert (nicht gegen die breitere DM-Allowlist). Absender, die auf der DM-Allowlist erlaubt sind, aber nicht in `allowFrom` stehen, erhalten eine explizite Ablehnung. Fügen Sie jeden Operator, der per `/approve` (und per Reaktionen) genehmigen können soll, zu `allowFrom` hinzu, um das bisherige Verhalten beizubehalten. Wenn `allowFrom` leer ist, bleibt der Legacy-„gleicher-Chat-Fallback“ wirksam, und `/approve` autorisiert weiterhin alle, die die DM-Allowlist erlaubt.

    Hinweise für Operatoren:
    - Die Reaktionsbindung wird sowohl im Arbeitsspeicher (mit einer TTL, die dem Ablauf der Genehmigung entspricht) als auch im persistenten Keyed Store des Gateway gespeichert, sodass ein Tapback, der kurz nach einem Gateway-Neustart eintrifft, die Genehmigung weiterhin auflöst.
    - Geräteübergreifende `is_from_me=true`-Tapbacks (die eigene Reaktion des Operators auf einem gekoppelten Apple-Gerät) werden absichtlich ignoriert, damit der Bot sich nicht selbst genehmigen kann.
    - Legacy-Tapbacks im Textstil (`Liked "…"` als Klartext von sehr alten Apple-Clients) können Genehmigungen nicht auflösen, weil sie keine Nachrichten-GUID enthalten; die Reaktionsauflösung erfordert die strukturierten Tapback-Metadaten, die aktuelle macOS-/iOS-Clients ausgeben.

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig vom Kanal initiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

Deaktivieren:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Zusammenführen aufgeteilter DM-Sendungen (Befehl + URL in einer Eingabe)

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apples Messages-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Blase (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die beiden Zeilen treffen bei OpenClaw in den meisten Setups im Abstand von etwa 0,8 bis 2,0 s ein. Ohne Zusammenführung erhält der Agent in Turn 1 nur den Befehl, antwortet (oft „senden Sie mir die URL“) und sieht die URL erst in Turn 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline, nicht etwas, das OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine DM das Puffern aufeinanderfolgender Zeilen desselben Absenders. Wenn `imsg` den strukturellen URL-Vorschau-Marker `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` in einer der Quellzeilen bereitstellt, führt OpenClaw nur diese echte aufgeteilte Sendung zusammen und behält alle anderen gepufferten Zeilen als separate Turns bei. Bei älteren `imsg`-Builds, die überhaupt keine Ballon-Metadaten ausgeben, kann OpenClaw eine aufgeteilte Sendung nicht von separaten Sendungen unterscheiden und fällt daher auf das Zusammenführen des Buckets zurück. Das bewahrt das Verhalten vor den Metadaten, statt `Dump <url>`-Split-Sends in zwei Turns zurückfallen zu lassen. Gruppenchats werden weiterhin pro Nachricht dispatcht, damit die Multi-User-Turn-Struktur erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Lassen Sie dies deaktiviert, wenn:

    - Sie minimale Befehlslatenz für Ein-Wort-DM-Trigger benötigen.
    - Alle Ihre Flows einmalige Befehle ohne Payload-Folgeeingaben sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Wenn das Flag aktiv ist und kein explizites `messages.inbound.byChannel.imessage` oder globales `messages.inbound.debounceMs` gesetzt ist, wird das Debounce-Fenster auf **7000 ms** erweitert (der Legacy-Standard ist 0 ms — kein Debouncing). Das breitere Fenster ist erforderlich, weil Apples URL-Vorschau-Split-Send-Taktung sich über mehrere Sekunden erstrecken kann, während Messages.app die Vorschauzeile ausgibt.

    Um das Fenster selbst anzupassen:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Präzises Zusammenführen benötigt aktuelle `imsg`-Payload-Metadaten.** Wenn die URL-Zeile `balloon_bundle_id` enthält, wird nur diese echte aufgeteilte Sendung zusammengeführt, und andere gepufferte Zeilen bleiben separat. Bei älteren `imsg`-Builds, die keine Ballon-Metadaten bereitstellen, fällt OpenClaw auf das Zusammenführen des gepufferten Buckets zurück, damit `Dump <url>`-Split-Sends nicht in zwei Turns zurückfallen (vorläufige Rückwärtskompatibilität, entfernt, sobald `imsg` Split-Sends upstream zusammenführt).
    - **Zusätzliche Latenz für DM-Nachrichten.** Wenn das Flag aktiv ist, wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Text-Follow-ups) bis zum Debounce-Fenster, bevor sie dispatcht wird, falls eine URL-Vorschau-Zeile eintrifft. Gruppenchats behalten sofortigen Dispatch.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten `…[truncated]`-Marker begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (darüber hinaus werden der erste und die neuesten beibehalten). Jede Quell-GUID wird in `coalescedMessageGuids` für nachgelagerte Telemetrie verfolgt.
    - **Nur DM.** Gruppenchats fallen auf Dispatch pro Nachricht zurück, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Legacy-BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

Die Spalte „Flag an“ zeigt das Verhalten bei einem `imsg`-Build, der `balloon_bundle_id` ausgibt. Bei älteren `imsg`-Builds, die gar keine Balloon-Metadaten ausgeben, fallen die unten mit „Zwei Turns“ / „N Turns“ markierten Zeilen stattdessen auf eine Legacy-Zusammenführung zurück (ein Turn): OpenClaw kann einen geteilten Sendevorgang strukturell nicht von separaten Sendevorgängen unterscheiden, daher bleibt die Zusammenführung aus der Zeit vor den Metadaten erhalten. Präzise Trennung wird aktiviert, sobald der Build Balloon-Metadaten ausgibt.

| Benutzer erstellt                                                  | `chat.db` erzeugt                   | Flag aus (Standard)                     | Flag an + Fenster (`imsg` gibt Balloon-Metadaten aus)                                               |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ein Sendevorgang)                      | 2 Zeilen im Abstand von ~1 s        | Zwei Agent-Turns: nur „Dump“, dann URL  | Ein Turn: zusammengeführter Text `Dump https://example.com`                                         |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Zeilen ohne URL-Balloon-Metadaten | Zwei Turns                              | Zwei Turns, nachdem Metadaten beobachtet wurden; ein zusammengeführter Turn in alten/vor-Latch-Sitzungen ohne Metadaten |
| `/status` (eigenständiger Befehl)                                  | 1 Zeile                             | Sofortige Auslieferung                  | **Bis zum Fenster warten, dann ausliefern**                                                         |
| Nur URL eingefügt                                                  | 1 Zeile                             | Sofortige Auslieferung                  | Bis zum Fenster warten, dann ausliefern                                                             |
| Text + URL als zwei bewusst separate Nachrichten, Minuten auseinander gesendet | 2 Zeilen außerhalb des Fensters     | Zwei Turns                              | Zwei Turns (Fenster läuft dazwischen ab)                                                            |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Zeilen ohne URL-Balloon-Metadaten | N Turns                                 | N Turns, nachdem Metadaten beobachtet wurden; ein begrenzter zusammengeführter Turn in alten/vor-Latch-Sitzungen ohne Metadaten |
| Zwei Personen tippen in einem Gruppenchat                          | N Zeilen von M Absendern            | M+ Turns (einer pro Absender-Bucket)    | M+ Turns — Gruppenchats werden nicht zusammengeführt                                                |

## Eingehende Wiederherstellung nach einem Bridge- oder Gateway-Neustart

iMessage stellt Nachrichten wieder her, die verpasst wurden, während das Gateway ausgefallen war, und unterdrückt gleichzeitig die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Das Standardverhalten ist immer aktiv und basiert auf der eingehenden Deduplizierung.

- **Replay-Deduplizierung.** Jede ausgelieferte eingehende Nachricht wird anhand ihrer Apple-GUID im persistenten Plugin-Zustand (`imessage.inbound-dedupe`) aufgezeichnet, bei der Aufnahme beansprucht und nach der Verarbeitung festgeschrieben (bei einem transienten Fehler freigegeben, damit sie erneut versucht werden kann). Alles, was bereits verarbeitet wurde, wird verworfen, statt zweimal ausgeliefert zu werden. Dadurch kann die Wiederherstellung aggressiv erneut abspielen, ohne Buchhaltung pro Nachricht.
- **Downtime-Wiederherstellung.** Beim Start merkt sich der Monitor die zuletzt ausgelieferte `chat.db`-rowid (ein persistierter Cursor pro Konto) und übergibt sie als `since_rowid` an `imsg watch.subscribe`, sodass imsg die Zeilen erneut abspielt, die eingetroffen sind, während das Gateway ausgefallen war, und danach live folgt. Das Replay ist auf die neuesten Zeilen und auf Nachrichten bis zu ~2 Stunden Alter begrenzt, und die Deduplizierung verwirft alles, was bereits verarbeitet wurde.
- **Altersgrenze für veralteten Backlog.** Zeilen oberhalb der Startgrenze sind tatsächlich live; eine Zeile, deren Sendedatum mehr als ~15 Minuten älter als ihre Ankunft ist, ist der Push-Flush-Backlog und wird unterdrückt. Erneut abgespielte Zeilen (an oder unterhalb der Grenze) verwenden stattdessen das breitere Wiederherstellungsfenster, sodass eine kürzlich verpasste Nachricht zugestellt wird, alte Historie jedoch nicht.

Die Wiederherstellung funktioniert sowohl mit lokalen als auch mit entfernten `cliPath`-Setups, weil das `since_rowid`-Replay über dieselbe `imsg`-RPC-Verbindung läuft. Der Unterschied ist das Fenster: Wenn das Gateway `chat.db` lesen kann (lokal), verankert es die Start-rowid-Grenze, begrenzt die Replay-Spanne und stellt verpasste Nachrichten zu, die bis zu ein paar Stunden alt sind. Über einen entfernten SSH-`cliPath` kann es die Datenbank nicht lesen, daher ist das Replay unbegrenzt und jede Zeile verwendet die Live-Altersgrenze — es stellt weiterhin kürzlich verpasste Nachrichten wieder her und unterdrückt weiterhin alten Backlog, nur mit dem engeren Live-Fenster. Führen Sie das Gateway auf dem Messages-Mac aus, um das breitere Wiederherstellungsfenster zu nutzen.

### Für Operator sichtbares Signal

Unterdrückter Backlog wird auf der Standardebene protokolliert und nie stillschweigend verworfen (das `recovery`-Flag zeigt, welches Fenster angewendet wurde):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migration

`channels.imessage.catchup.*` ist veraltet — Downtime-Wiederherstellung ist jetzt automatisch und benötigt für neue Setups keine Konfiguration. Bestehende Konfigurationen mit `catchup.enabled: true` werden als Kompatibilitätsprofil für das Wiederherstellungs-Replay-Fenster weiterhin berücksichtigt. Deaktivierte Catchup-Blöcke (`enabled: false` oder kein `enabled: true`) sind außer Betrieb genommen; `openclaw doctor --fix` entfernt diese.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie die Binärdatei und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn private API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und prüfen Sie erneut. Wenn das Gateway nicht unter macOS läuft, verwenden Sie stattdessen das oben beschriebene Remote-Mac-über-SSH-Setup anstelle des standardmäßigen lokalen `imsg`-Pfads.

  </Accordion>

  <Accordion title="Messages werden gesendet, aber eingehende iMessages kommen nicht an">
    Weisen Sie zuerst nach, ob die Nachricht den lokalen Mac erreicht hat. Wenn sich `chat.db` nicht ändert, kann OpenClaw die Nachricht nicht empfangen, selbst wenn `imsg status --json` eine gesunde Bridge meldet.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Wenn vom Telefon gesendete Nachrichten keine neuen Zeilen erzeugen, reparieren Sie die macOS-Messages- und Apple-Push-Schicht, bevor Sie die OpenClaw-Konfiguration ändern. Eine einmalige Dienstaktualisierung reicht oft aus:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Senden Sie eine neue iMessage vom Telefon und bestätigen Sie eine neue `chat.db`-Zeile oder ein `imsg watch`-Ereignis, bevor Sie OpenClaw-Sitzungen debuggen. Führen Sie dies nicht als periodische Bridge-Neustart-Schleife aus; wiederholtes `imsg launch` plus Gateway-Neustarts während aktiver Arbeit können Zustellungen unterbrechen und laufende Channel-Runs hängen lassen.

  </Accordion>

  <Accordion title="Gateway läuft nicht unter macOS">
    Der standardmäßige `cliPath: "imsg"` muss auf dem Mac ausgeführt werden, der bei Messages angemeldet ist. Legen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript fest, das per SSH zu diesem Mac verbindet und `imsg "$@"` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Führen Sie dann aus:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Pairing-Freigaben (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Mention-Pattern-Konfiguration (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Entfernte Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel existiert in `~/.ssh/known_hosts` auf dem Gateway-Host
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Aufforderungen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bestätigen Sie, dass Full Disk Access + Automation für den Prozesskontext gewährt sind, der OpenClaw/`imsg` ausführt.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Pairing](/de/channels/pairing)

## Verwandt

- [Channels-Übersicht](/de/channels) — alle unterstützten Channels
- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — Ankündigung und Migrationszusammenfassung
- [Wechsel von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Konfigurations-Übersetzungstabelle und schrittweise Umstellung
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
