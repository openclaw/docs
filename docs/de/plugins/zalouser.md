---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das zalouser-Plugin
summary: 'Zalo-Personal-Plugin: QR-Anmeldung + Nachrichtenversand über natives zca-js (Plugin-Installation + Kanalkonfiguration + Tool)'
title: Zalo-Plugin für persönliche Konten
x-i18n:
    generated_at: "2026-07-12T02:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Zalo-Personal-Unterstützung für OpenClaw über ein Plugin, das das native `zca-js`
verwendet, um ein normales Zalo-Benutzerkonto zu automatisieren. Es ist keine externe
`zca`-/`openzca`-CLI-Binärdatei erforderlich.

<Warning>
Inoffizielle Automatisierung kann zur Sperrung oder zum Ausschluss des Kontos führen. Die Nutzung erfolgt auf eigenes Risiko.
</Warning>

## Benennung

Die Kanal-ID lautet `zalouser`, um ausdrücklich kenntlich zu machen, dass hiermit ein **persönliches
Zalo-Benutzerkonto** automatisiert wird (inoffiziell). Die separate Kanal-ID `zalo` bezeichnet die offizielle,
mitgelieferte Zalo-Bot-/Webhook-Integration – siehe [Zalo](/de/channels/zalo).

## Ausführungsort

Dieses Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt. Bei einem entfernten Gateway
installieren und konfigurieren Sie es auf diesem Host und starten anschließend den Gateway neu.

## Installation

### Über npm

```bash
openclaw plugins install @openclaw/zalouser
```

Verwenden Sie das Paket ohne Versionsangabe, um dem aktuellen offiziellen Release-Tag zu folgen. Legen Sie nur dann eine exakte
Version fest, wenn Sie eine reproduzierbare Installation benötigen. Starten Sie den Gateway
anschließend neu.

### Aus einem lokalen Ordner (Entwicklung)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie den Gateway anschließend neu.

## Konfiguration

Die Kanalkonfiguration befindet sich unter `channels.zalouser` (nicht unter `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

Informationen zur Zugriffskontrolle für Direktnachrichten und Gruppen, zur Einrichtung mehrerer Konten,
zu Umgebungsvariablen und zur Fehlerbehebung finden Sie unter [Konfiguration des persönlichen Zalo-Kanals](/de/channels/zalouser).

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Agentenwerkzeug

Werkzeugname: `zalouser`

Aktionen: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanalnachrichtenaktionen (nicht das Agentenwerkzeug) unterstützen außerdem `react` für
Nachrichtenreaktionen.

## Verwandte Themen

- [Konfiguration des persönlichen Zalo-Kanals](/de/channels/zalouser)
- [Zalo (offizieller Bot-/Webhook-Kanal)](/de/channels/zalo)
- [Plugins erstellen](/de/plugins/building-plugins)
- [ClawHub](/clawhub)
