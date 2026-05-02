---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das zalouser-Plugin
summary: 'Zalo Personal-Plugin: QR-Anmeldung + Nachrichtenversand über natives zca-js (Plugin-Installation + Kanalkonfiguration + Tool)'
title: Persönliches Zalo-Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Zalo Personal-Unterstützung für OpenClaw über ein Plugin, mit nativem `zca-js`, um ein normales Zalo-Benutzerkonto zu automatisieren.

<Warning>
Inoffizielle Automatisierung kann zur Sperrung oder zum Bann des Kontos führen. Nutzung auf eigenes Risiko.
</Warning>

## Benennung

Die Kanal-ID ist `zalouser`, um ausdrücklich zu machen, dass dadurch ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Integration der Zalo-API reserviert.

## Wo es ausgeführt wird

Dieses Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt.

Wenn Sie einen entfernten Gateway verwenden, installieren/konfigurieren Sie es auf der **Maschine, auf der der Gateway ausgeführt wird**, und starten Sie dann den Gateway neu.

Es ist keine externe `zca`/`openzca`-CLI-Binärdatei erforderlich.

## Installation

### Option A: Installation von npm

```bash
openclaw plugins install @openclaw/zalouser
```

Verwenden Sie das Paket ohne Versionsangabe, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
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

Die Kanalkonfiguration befindet sich unter `channels.zalouser` (nicht `plugins.entries.*`):

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

Kanalnachrichtenaktionen unterstützen außerdem `react` für Nachrichtenreaktionen.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [Community-Plugins](/de/plugins/community)
