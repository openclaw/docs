---
read_when:
    - Sie möchten OpenClaw mit WeChat oder Weixin verbinden
    - Sie installieren das Kanal-Plugin openclaw-weixin oder beheben Probleme damit.
    - Sie müssen verstehen, wie externe Kanal-Plugins neben dem Gateway ausgeführt werden.
summary: Einrichtung des WeChat-Kanals über das externe Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-24T03:39:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw stellt über Tencents externes
`@tencent-weixin/openclaw-weixin`-Kanal-Plugin eine Verbindung zu WeChat her.

Status: externes Plugin, verwaltet vom Tencent-Weixin-Team. Direkte Chats und
Medien werden unterstützt. Gruppenchats werden in den Metadaten zu den
Plugin-Funktionen nicht ausgewiesen (das Plugin deklariert ausschließlich direkte Chats).

## Benennung

- **WeChat** ist der in dieser Dokumentation verwendete benutzerseitige Name.
- **Weixin** ist der Name, der von Tencents Paket und von der Plugin-ID verwendet wird.
- `openclaw-weixin` ist die OpenClaw-Kanal-ID (`weixin` und `wechat` funktionieren als Aliasse).
- `@tencent-weixin/openclaw-weixin` ist das npm-Paket.

Verwenden Sie `openclaw-weixin` in CLI-Befehlen und Konfigurationspfaden.

## Funktionsweise

Der WeChat-Code befindet sich nicht im OpenClaw-Core-Repository. OpenClaw stellt den
generischen Vertrag für Kanal-Plugins bereit, und das externe Plugin stellt die
WeChat-spezifische Laufzeit bereit:

1. `openclaw plugins install` installiert `@tencent-weixin/openclaw-weixin`.
2. Das Gateway erkennt das Plugin-Manifest und lädt den Plugin-Einstiegspunkt.
3. Das Plugin registriert die Kanal-ID `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` startet die QR-Anmeldung.
5. Das Plugin speichert die Zugangsdaten des Kontos im OpenClaw-Zustandsverzeichnis
   (standardmäßig `~/.openclaw`).
6. Beim Start des Gateways startet das Plugin seinen Weixin-Monitor für jedes
   konfigurierte Konto.
7. Eingehende WeChat-Nachrichten werden über den Kanalvertrag normalisiert, an den
   ausgewählten OpenClaw-Agenten weitergeleitet und über den ausgehenden Pfad des Plugins zurückgesendet.

Diese Trennung ist wichtig: Der OpenClaw-Core bleibt kanalunabhängig. Die WeChat-Anmeldung,
Aufrufe der Tencent-iLink-API, das Hoch- und Herunterladen von Medien, Kontext-Token und die
Kontoüberwachung liegen in der Verantwortung des externen Plugins.

## Installation

Schnellinstallation:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Manuelle Installation:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Starten Sie das Gateway nach der Installation neu:

```bash
openclaw gateway restart
```

## Anmeldung

Führen Sie die QR-Anmeldung auf demselben Computer aus, auf dem das Gateway läuft:

```bash
openclaw channels login --channel openclaw-weixin
```

Scannen Sie den QR-Code mit WeChat auf Ihrem Telefon und bestätigen Sie die Anmeldung. Nach einem
erfolgreichen Scan speichert das Plugin das Konto-Token lokal.

Um ein weiteres WeChat-Konto hinzuzufügen, führen Sie denselben Anmeldebefehl erneut aus. Isolieren
Sie bei mehreren Konten Direktnachrichtensitzungen nach Konto, Kanal und Absender:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Zugriffskontrolle

Direktnachrichten verwenden das reguläre OpenClaw-Modell für Kopplung und Zulassungslisten für
Kanal-Plugins.

Genehmigen Sie neue Absender:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Das vollständige Zugriffskontrollmodell finden Sie unter [Kopplung](/de/channels/pairing).

## Kompatibilität

Das Plugin prüft beim Start die Version des OpenClaw-Hosts.

| Plugin-Reihe | OpenClaw-Version                                                | npm-Tag  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (aktuell 2.4.6; frühe 2.x-Versionen akzeptierten `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Wenn das Plugin meldet, dass Ihre OpenClaw-Version zu alt ist, aktualisieren Sie entweder
OpenClaw oder installieren Sie die ältere Plugin-Reihe:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-Prozess

Das WeChat-Plugin kann neben dem Gateway Hilfsaufgaben ausführen, während es die
Tencent-iLink-API überwacht. In Issue #68451 legte dieser Hilfspfad einen Fehler in der
generischen OpenClaw-Bereinigung veralteter Gateways offen: Ein untergeordneter Prozess konnte
versuchen, den übergeordneten Gateway-Prozess zu bereinigen, was unter Prozessmanagern wie systemd
zu Neustartschleifen führte.

Die aktuelle OpenClaw-Startbereinigung schließt den aktuellen Prozess und dessen übergeordnete
Prozesse aus, sodass eine Kanal-Hilfskomponente das Gateway, das sie gestartet hat, nicht beenden
kann. Diese Korrektur ist generisch; sie ist kein WeChat-spezifischer Pfad im Core.

## Fehlerbehebung

Prüfen Sie Installation und Status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Wenn der Kanal als installiert angezeigt wird, aber keine Verbindung herstellt, vergewissern Sie
sich, dass das Plugin aktiviert ist, und starten Sie neu:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Wenn das Gateway nach der Aktivierung von WeChat wiederholt neu startet, aktualisieren Sie sowohl
OpenClaw als auch das Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Wenn beim Start gemeldet wird, dass das installierte Plugin-Paket `requires compiled runtime
output for TypeScript entry`, wurde das npm-Paket ohne die kompilierten
JavaScript-Laufzeitdateien veröffentlicht, die OpenClaw benötigt. Aktualisieren oder installieren
Sie es erneut, nachdem der Plugin-Herausgeber ein korrigiertes Paket veröffentlicht hat, oder
deaktivieren beziehungsweise deinstallieren Sie das Plugin vorübergehend.

Vorübergehende Deaktivierung:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Zugehörige Dokumentation

- Kanalübersicht: [Chatkanäle](/de/channels)
- Kopplung: [Kopplung](/de/channels/pairing)
- Kanal-Routing: [Kanal-Routing](/de/channels/channel-routing)
- Plugin-Architektur: [Plugin-Architektur](/de/plugins/architecture)
- SDK für Kanal-Plugins: [SDK für Kanal-Plugins](/de/plugins/sdk-channel-plugins)
- Externes Paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
