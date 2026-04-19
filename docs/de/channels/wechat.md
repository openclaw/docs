---
read_when:
    - Sie möchten OpenClaw mit WeChat oder Weixin verbinden.
    - Sie installieren oder beheben Probleme mit dem Channel-Plugin `openclaw-weixin`.
    - Sie müssen verstehen, wie externe Channel-Plugins neben dem Gateway ausgeführt werden.
summary: Einrichtung des WeChat-Kanals über das externe openclaw-weixin Plugin
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw verbindet sich mit WeChat über Tencents externes
Channel-Plugin `@tencent-weixin/openclaw-weixin`.

Status: externes Plugin. Direktchats und Medien werden unterstützt. Gruppenchats werden von den aktuellen Plugin-Fähigkeitsmetadaten nicht beworben.

## Benennung

- **WeChat** ist der benutzerseitige Name in dieser Dokumentation.
- **Weixin** ist der Name, der von Tencents Paket und von der Plugin-ID verwendet wird.
- `openclaw-weixin` ist die OpenClaw-Channel-ID.
- `@tencent-weixin/openclaw-weixin` ist das npm-Paket.

Verwenden Sie `openclaw-weixin` in CLI-Befehlen und Konfigurationspfaden.

## Funktionsweise

Der WeChat-Code befindet sich nicht im OpenClaw-Core-Repository. OpenClaw stellt den generischen Vertrag für Channel-Plugins bereit, und das externe Plugin stellt die WeChat-spezifische Laufzeit bereit:

1. `openclaw plugins install` installiert `@tencent-weixin/openclaw-weixin`.
2. Das Gateway erkennt das Plugin-Manifest und lädt den Plugin-Einstiegspunkt.
3. Das Plugin registriert die Channel-ID `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` startet die QR-Anmeldung.
5. Das Plugin speichert Kontozugangsdaten im OpenClaw-Statusverzeichnis.
6. Wenn das Gateway startet, startet das Plugin seinen Weixin-Monitor für jedes konfigurierte Konto.
7. Eingehende WeChat-Nachrichten werden über den Channel-Vertrag normalisiert, an den ausgewählten OpenClaw-Agenten weitergeleitet und über den ausgehenden Pfad des Plugins zurückgesendet.

Diese Trennung ist wichtig: Der OpenClaw-Core sollte channel-agnostisch bleiben. WeChat-Anmeldung, Tencent-iLink-API-Aufrufe, Medien-Upload/-Download, Kontext-Token und Kontoüberwachung liegen in der Verantwortung des externen Plugins.

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

Führen Sie die QR-Anmeldung auf demselben Rechner aus, auf dem auch das Gateway läuft:

```bash
openclaw channels login --channel openclaw-weixin
```

Scannen Sie den QR-Code mit WeChat auf Ihrem Telefon und bestätigen Sie die Anmeldung. Das Plugin speichert das Konto-Token nach einem erfolgreichen Scan lokal.

Um ein weiteres WeChat-Konto hinzuzufügen, führen Sie denselben Anmeldebefehl erneut aus. Für mehrere Konten isolieren Sie Direktnachrichten-Sitzungen nach Konto, Channel und Absender:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Zugriffskontrolle

Direktnachrichten verwenden das normale OpenClaw-Pairing- und Allowlist-Modell für Channel-Plugins.

Genehmigen Sie neue Absender:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Das vollständige Zugriffskontrollmodell finden Sie unter [Pairing](/de/channels/pairing).

## Kompatibilität

Das Plugin prüft beim Start die Version des OpenClaw-Hosts.

| Plugin-Linie | OpenClaw-Version        | npm-Tag  |
| ------------ | ----------------------- | -------- |
| `2.x`        | `>=2026.3.22`           | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Wenn das Plugin meldet, dass Ihre OpenClaw-Version zu alt ist, aktualisieren Sie entweder OpenClaw oder installieren Sie die Legacy-Plugin-Linie:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-Prozess

Das WeChat-Plugin kann Hilfsarbeit neben dem Gateway ausführen, während es die Tencent-iLink-API überwacht. In Issue #68451 machte dieser Hilfspfad einen Fehler in OpenClaws generischer Bereinigung veralteter Gateways sichtbar: Ein Child-Prozess konnte versuchen, den übergeordneten Gateway-Prozess zu bereinigen, was unter Prozessmanagern wie systemd zu Neustartschleifen führte.

Die aktuelle OpenClaw-Startbereinigung schließt den aktuellen Prozess und seine Vorfahren aus, daher darf ein Channel-Helfer das Gateway, das ihn gestartet hat, nicht beenden. Diese Korrektur ist generisch; sie ist kein WeChat-spezifischer Pfad im Core.

## Fehlerbehebung

Prüfen Sie Installation und Status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Wenn der Channel als installiert angezeigt wird, aber keine Verbindung herstellt, bestätigen Sie, dass das Plugin aktiviert ist, und starten Sie neu:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Wenn das Gateway nach dem Aktivieren von WeChat wiederholt neu startet, aktualisieren Sie sowohl OpenClaw als auch das Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Vorübergehend deaktivieren:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Verwandte Dokumentation

- Channel-Überblick: [Chat Channels](/de/channels)
- Pairing: [Pairing](/de/channels/pairing)
- Channel-Routing: [Channel Routing](/de/channels/channel-routing)
- Plugin-Architektur: [Plugin Architecture](/de/plugins/architecture)
- Channel-Plugin-SDK: [Channel Plugin SDK](/de/plugins/sdk-channel-plugins)
- Externes Paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
