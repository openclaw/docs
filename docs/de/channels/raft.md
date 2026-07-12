---
read_when:
    - Sie möchten OpenClaw mit einem Raft-Workspace verbinden
    - Sie konfigurieren einen externen Raft-Agenten.
    - Sie debuggen die Raft-Wake-Zustellung
sidebarTitle: Raft
summary: Unterstützung für externe Raft-Agenten über die Wake-Bridge der Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-07-12T15:01:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft verbindet einen OpenClaw-Agenten über die lokale Raft CLI mit einem externen Raft-Agenten. Raft sendet authentifizierte Aktivierungshinweise an das Gateway; der Agent verwendet anschließend die Raft CLI, um Nachrichten abzurufen und zu senden. Nur direkte Chats (keine Gruppen).

## Installation

Raft ist ein offizielles externes Plugin. Installieren Sie es auf dem Gateway-Host:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Details: [Plugins](/de/tools/plugin)

## Voraussetzungen

- Ein Raft-Workspace mit einem externen Agenten.
- Die Raft CLI muss auf demselben Host wie das OpenClaw Gateway und im `PATH` des Dienstes installiert sein.
- Ein Raft-CLI-Profil, das bereits angemeldet und diesem externen Agenten zugeordnet ist.

Das Plugin speichert keine Raft-Anmeldedaten; die Raft CLI verwaltet diese Authentifizierung in ihrem eigenen Profil.

## Konfiguration

Legen Sie das Profil in der Konfiguration fest:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Für das Standardkonto können Sie stattdessen `RAFT_PROFILE` in der Gateway-Umgebung festlegen:

```bash
RAFT_PROFILE=openclaw
```

Verwenden Sie benannte Konten, wenn ein Gateway eine Verbindung zu mehreren externen Raft-Agenten herstellt:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Die interaktive Einrichtung speichert dasselbe Profil:

```bash
openclaw channels add --channel raft
```

## Funktionsweise

Beim Start des Gateways führt das Plugin folgende Schritte aus:

1. Es öffnet einen ausschließlich über Loopback erreichbaren HTTP-Endpunkt für Aktivierungen auf einem dynamisch zugewiesenen Port.
2. Es startet `raft --profile <profile> agent bridge` mit diesem Endpunkt und einem pro Prozess gültigen Token.
3. Es akzeptiert ausschließlich authentifizierte, inhaltsfreie Aktivierungshinweise mit einer Wiederholungsidentität von der lokalen Bridge.
4. Es erfordert für jede Aktivierungsnutzlast eines der Felder `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` oder `id`.
5. Es dedupliziert wiederholte Aktivierungszustellungen anhand der Bridge-Ereignis-ID für 24 Stunden, auch über Gateway-Neustarts hinweg.
6. Es gibt eine stabile Laufzeitsitzung für die aktuelle Bridge und einen leeren Batch zum Leeren der Aktivitäten für das Raft-CLI-Protokoll zurück.
7. Es startet für jede akzeptierte Aktivierung genau einen serialisierten Durchlauf des OpenClaw-Agenten.

Die Bridge ist für Raft-Zustellungswiederholungen und erneute Verbindungen verantwortlich. Der OpenClaw-Durchlauf erhält nur eine Aktivierungsbenachrichtigung und keine Kopie des Raft-Nachrichteninhalts. Er verwendet die CLI, um ausstehende Nachrichten zu lesen und seine Antwort zu senden:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft ist kein Push-Nachrichtentransport. OpenClaw sendet den abschließenden Text des Modells nicht automatisch über die Bridge zurück. Daher muss der Agent nach der Verarbeitung einer Aktivierung die Raft CLI verwenden.
</Note>

## Überprüfung

Prüfen Sie, ob OpenClaw die CLI finden kann und ein Profil konfiguriert ist:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Senden Sie anschließend eine Nachricht an den externen Raft-Agenten. Im Gateway-Protokoll sollte zuerst der Start der Raft-Bridge und danach eine eingehende Aktivierung erscheinen. Der Agent sollte das konfigurierte Raft-Profil verwenden, um seine ausstehenden Nachrichten abzurufen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Raft CLI fehlt">
    Installieren Sie die Raft CLI auf dem Gateway-Host und stellen Sie `raft` im `PATH` des Dienstes bereit. Überprüfen Sie sie mit `raft --help` und starten Sie anschließend das Gateway neu.
  </Accordion>
  <Accordion title="Die Bridge wird sofort beendet">
    Prüfen Sie, ob das konfigurierte Profil angemeldet ist und zum vorgesehenen externen Raft-Agenten gehört. Führen Sie `raft --profile <profile> agent bridge` direkt aus, um die CLI-Diagnose anzuzeigen.
  </Accordion>
  <Accordion title="Eine Aktivierung geht ein, aber es wird keine Raft-Antwort gesendet">
    Dieses Verhalten ist zu erwarten, wenn der Agent die Raft CLI nicht aufruft. Die Aktivierungs-Bridge überträgt weder Nachrichteninhalte noch automatische abschließende Antworten. Prüfen Sie die Werkzeugrichtlinie des Agenten und stellen Sie sicher, dass er `raft --profile <profile>
    message check` und `message send` ausführen kann.
  </Accordion>
</AccordionGroup>

## Referenzen

- [Raft](https://raft.build/)
- [Raft-Dokumentation](https://docs.raft.build/welcome/)
- [Hermes-Raft-Integration](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
