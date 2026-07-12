---
read_when:
    - Sie möchten OpenClaw mit WeChat oder Weixin verbinden
    - Sie installieren das Kanal-Plugin openclaw-weixin oder beheben Fehler daran.
    - Sie müssen verstehen, wie externe Kanal-Plugins neben dem Gateway ausgeführt werden
summary: Einrichtung des WeChat-Kanals über das externe Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T15:02:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw stellt über Tencents externes Kanal-Plugin
`@tencent-weixin/openclaw-weixin` eine Verbindung zu WeChat her.

Status: externes Plugin, betreut vom Tencent-Weixin-Team. Direktchats und
Medien werden unterstützt. Gruppenchats werden in den Metadaten zu den
Plugin-Funktionen nicht ausgewiesen (dort sind nur Direktchats deklariert).

## Benennung

- **WeChat** ist der in dieser Dokumentation verwendete Name.
- **Weixin** ist der Name, den Tencent für sein Paket und die Plugin-ID verwendet.
- `openclaw-weixin` ist die OpenClaw-Kanal-ID (`weixin` und `wechat` funktionieren als Aliasse).
- `@tencent-weixin/openclaw-weixin` ist das npm-Paket.

Verwenden Sie `openclaw-weixin` in CLI-Befehlen und Konfigurationspfaden.

## Funktionsweise

Der WeChat-Code befindet sich nicht im OpenClaw-Core-Repository. OpenClaw stellt
den generischen Vertrag für Kanal-Plugins bereit, und das externe Plugin stellt
die WeChat-spezifische Laufzeit bereit:

1. `openclaw plugins install` installiert `@tencent-weixin/openclaw-weixin`.
2. Das Gateway erkennt das Plugin-Manifest und lädt den Plugin-Einstiegspunkt.
3. Das Plugin registriert die Kanal-ID `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` startet die Anmeldung per QR-Code.
5. Das Plugin speichert die Anmeldedaten des Kontos im OpenClaw-Statusverzeichnis
   (standardmäßig `~/.openclaw`).
6. Beim Start des Gateways startet das Plugin seinen Weixin-Monitor für jedes
   konfigurierte Konto.
7. Eingehende WeChat-Nachrichten werden über den Kanalvertrag normalisiert, an
   den ausgewählten OpenClaw-Agenten weitergeleitet und über den ausgehenden Pfad
   des Plugins zurückgesendet.

Diese Trennung ist wichtig: Der OpenClaw-Core bleibt kanalunabhängig. Die
WeChat-Anmeldung, Aufrufe der Tencent-iLink-API, das Hoch- und Herunterladen von
Medien, Kontext-Token und die Kontoüberwachung liegen in der Verantwortung des
externen Plugins.

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

Führen Sie die Anmeldung per QR-Code auf demselben Rechner aus, auf dem das Gateway läuft:

```bash
openclaw channels login --channel openclaw-weixin
```

Scannen Sie den QR-Code mit WeChat auf Ihrem Smartphone und bestätigen Sie die
Anmeldung. Nach erfolgreichem Scannen speichert das Plugin das Konto-Token lokal.

Um ein weiteres WeChat-Konto hinzuzufügen, führen Sie denselben Anmeldebefehl
erneut aus. Isolieren Sie bei mehreren Konten die Direktnachrichtensitzungen nach
Konto, Kanal und Absender:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Zugriffskontrolle

Direktnachrichten verwenden das normale Kopplungs- und Zulassungslistenmodell von OpenClaw für Kanal-Plugins.

Neue Absender genehmigen:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Das vollständige Modell der Zugriffssteuerung finden Sie unter [Kopplung](/de/channels/pairing).

## Kompatibilität

Das Plugin prüft beim Start die OpenClaw-Version des Hosts.

| Plugin-Linie | OpenClaw-Version                                               | npm-Tag  |
| ------------- | -------------------------------------------------------------- | -------- |
| `2.x`         | `>=2026.5.12` (aktuell 2.4.6; frühe 2.x akzeptierten `>=2026.3.22`) | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22`                                       | `legacy` |

Wenn das Plugin meldet, dass Ihre OpenClaw-Version zu alt ist, aktualisieren Sie entweder OpenClaw oder installieren Sie die Legacy-Plugin-Linie:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-Prozess

Das WeChat-Plugin kann neben dem Gateway Hilfsprozesse ausführen, während es die Tencent iLink API überwacht. In Issue #68451 deckte dieser Hilfspfad einen Fehler in der generischen Bereinigung veralteter Gateways von OpenClaw auf: Ein untergeordneter Prozess konnte versuchen, den übergeordneten Gateway-Prozess zu bereinigen, was unter Prozessmanagern wie systemd Neustartschleifen verursachte.

Die aktuelle Startbereinigung von OpenClaw schließt den aktuellen Prozess und seine Vorgängerprozesse aus, sodass ein Kanal-Hilfsprozess das Gateway, von dem er gestartet wurde, nicht beenden kann. Diese Korrektur ist generisch; sie ist kein WeChat-spezifischer Pfad im Kernsystem.

## Fehlerbehebung

Installation und Status prüfen:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Wenn der Kanal als installiert angezeigt wird, aber keine Verbindung herstellt, vergewissern Sie sich, dass das Plugin aktiviert ist, und starten Sie neu:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Wenn das Gateway nach der Aktivierung von WeChat wiederholt neu startet, aktualisieren Sie sowohl OpenClaw als auch das Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Wenn beim Start gemeldet wird, dass das installierte Plugin-Paket `requires compiled runtime
output for TypeScript entry`, wurde das npm-Paket ohne die kompilierten JavaScript-Laufzeitdateien veröffentlicht, die OpenClaw benötigt. Aktualisieren oder installieren Sie es erneut, nachdem der Plugin-Herausgeber ein korrigiertes Paket veröffentlicht hat, oder deaktivieren beziehungsweise deinstallieren Sie das Plugin vorübergehend.

Vorübergehend deaktivieren:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Verwandte Dokumentation

- Kanalübersicht: [Chat-Kanäle](/de/channels)
- Kopplung: [Kopplung](/de/channels/pairing)
- Kanal-Routing: [Kanal-Routing](/de/channels/channel-routing)
- Plugin-Architektur: [Plugin-Architektur](/de/plugins/architecture)
- SDK für Kanal-Plugins: [SDK für Kanal-Plugins](/de/plugins/sdk-channel-plugins)
- Externes Paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
