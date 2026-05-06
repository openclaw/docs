---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das zalouser-Plugin
summary: 'Zalo Personal-Plugin: QR-Login + Nachrichtenversand über natives zca-js (Plugin-Installation + Kanalkonfiguration + Tool)'
title: Persönliches Zalo-Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Zalo Personal-Unterstützung für OpenClaw über ein Plugin, unter Verwendung von nativem `zca-js`, um ein normales Zalo-Benutzerkonto zu automatisieren.

<Warning>
Inoffizielle Automatisierung kann zur Kontosperrung oder zum Ausschluss führen. Verwendung auf eigenes Risiko.
</Warning>

## Benennung

Die Channel-ID ist `zalouser`, um explizit zu machen, dass hier ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). Wir halten `zalo` für eine mögliche zukünftige offizielle Zalo-API-Integration frei.

## Wo es ausgeführt wird

Dieses Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie einen Remote-Gateway verwenden, installieren/konfigurieren Sie es auf dem **Rechner, auf dem der Gateway läuft**, und starten Sie den Gateway anschließend neu.

Es ist kein externes `zca`/`openzca`-CLI-Binary erforderlich.

## Installation

### Option A: Installation aus npm

```bash
openclaw plugins install @openclaw/zalouser
```

Verwenden Sie das einfache Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
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
- [Community-Plugins](/de/plugins/community)
