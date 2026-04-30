---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das zalouser-Plugin
summary: 'Zalo Personal-Plugin: QR-Anmeldung + Nachrichtenversand über natives zca-js (Plugin-Installation + Kanal-Konfiguration + Tool)'
title: Persönliches Zalo-Plugin
x-i18n:
    generated_at: "2026-04-30T07:09:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Unterstützung für Zalo Personal in OpenClaw über ein Plugin, wobei das native `zca-js` verwendet wird, um ein normales Zalo-Benutzerkonto zu automatisieren.

<Warning>
Inoffizielle Automatisierung kann zur Kontosperrung oder zum Bann führen. Die Nutzung erfolgt auf eigenes Risiko.
</Warning>

## Benennung

Die Channel-ID ist `zalouser`, um ausdrücklich zu machen, dass damit ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). Wir halten `zalo` für eine mögliche künftige offizielle Zalo-API-Integration reserviert.

## Ausführungsort

Dieses Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt.

Wenn Sie ein entferntes Gateway verwenden, installieren/konfigurieren Sie es auf der **Maschine, auf der das Gateway ausgeführt wird**, und starten Sie anschließend das Gateway neu.

Es ist keine externe `zca`-/`openzca`-CLI-Binärdatei erforderlich.

## Installieren

### Option A: von npm installieren

```bash
openclaw plugins install @openclaw/zalouser
```

Wenn npm meldet, dass das OpenClaw-eigene Paket als veraltet markiert ist, stammt diese Paketversion
aus einem älteren externen Paket-Zweig; verwenden Sie einen aktuellen paketierten OpenClaw-Build oder
den lokalen Ordnerpfad, bis ein neueres npm-Paket veröffentlicht wird.

Starten Sie anschließend das Gateway neu.

### Option B: aus einem lokalen Ordner installieren (Entwicklung)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie anschließend das Gateway neu.

## Konfiguration

Die Channel-Konfiguration liegt unter `channels.zalouser` (nicht `plugins.entries.*`):

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
