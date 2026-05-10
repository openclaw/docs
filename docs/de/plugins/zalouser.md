---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das zalouser-Plugin
summary: 'Zalo Personal-Plugin: QR-Anmeldung + Nachrichtenversand über natives zca-js (Plugin-Installation + Kanalkonfiguration + Tool)'
title: Persönliches Zalo-Plugin
x-i18n:
    generated_at: "2026-05-10T19:48:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

Unterstützung für Zalo Personal in OpenClaw über ein Plugin, wobei natives `zca-js` verwendet wird, um ein normales Zalo-Benutzerkonto zu automatisieren.

<Warning>
Inoffizielle Automatisierung kann zur Sperrung oder Deaktivierung des Kontos führen. Die Nutzung erfolgt auf Ihr eigenes Risiko.
</Warning>

## Benennung

Die Channel-ID ist `zalouser`, um ausdrücklich klarzumachen, dass dies ein **persönliches Zalo-Benutzerkonto** automatisiert (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Integration der Zalo-API reserviert.

## Ausführungsort

Dieses Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie einen Remote-Gateway verwenden, installieren/konfigurieren Sie es auf dem **Rechner, auf dem der Gateway läuft**, und starten Sie anschließend den Gateway neu.

Es ist keine externe `zca`/`openzca`-CLI-Binärdatei erforderlich.

## Installation

### Option A: Installation aus npm

```bash
openclaw plugins install @openclaw/zalouser
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur dann, wenn Sie eine reproduzierbare Installation benötigen.

Starten Sie den Gateway anschließend neu.

### Option B: Installation aus einem lokalen Ordner (Entwicklung)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie den Gateway anschließend neu.

## Konfiguration

Die Channel-Konfiguration befindet sich unter `channels.zalouser` (nicht `plugins.entries.*`):

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

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent-Tool

Tool-Name: `zalouser`

Aktionen: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Channel-Nachrichtenaktionen unterstützen außerdem `react` für Nachrichtenreaktionen.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [ClawHub](/de/clawhub)
