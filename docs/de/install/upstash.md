---
read_when:
    - OpenClaw auf Upstash Box bereitstellen
    - Sie möchten eine verwaltete Linux-Umgebung für OpenClaw mit Dashboard-Zugriff über einen SSH-Tunnel
summary: OpenClaw auf Upstash Box mit Keep-Alive und Zugriff per SSH-Tunnel hosten
title: Upstash Box
x-i18n:
    generated_at: "2026-07-24T03:57:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Führen Sie ein dauerhaftes OpenClaw Gateway auf Upstash Box aus, einer verwalteten Linux-Umgebung
mit Unterstützung für einen Keep-Alive-Lebenszyklus.

Verwenden Sie für den Zugriff auf das Dashboard einen SSH-Tunnel. Setzen Sie den Gateway-Port nicht direkt
dem öffentlichen Internet aus.

## Voraussetzungen

- Upstash-Konto
- Keep-Alive-Upstash-Box
- SSH-Client auf Ihrem lokalen Rechner

## Eine Box erstellen

Erstellen Sie in der Upstash Console eine Keep-Alive-Box. Notieren Sie sich die Box-ID (zum Beispiel
`right-flamingo-14486`) und Ihren Box-API-Schlüssel.

Upstash stellt seine aktuelle Anleitung für eine OpenClaw Box unter
[OpenClaw-Einrichtung](https://upstash.com/docs/box/guides/openclaw-setup) bereit.

## Über einen SSH-Tunnel verbinden

Leiten Sie den Port des OpenClaw-Dashboards an Ihren lokalen Rechner weiter. Verwenden Sie bei der Aufforderung Ihren Box-API-Schlüssel
als SSH-Passwort:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Die Keep-Alive-Optionen reduzieren Verbindungsabbrüche des inaktiven Tunnels während des Onboardings.

## OpenClaw installieren

Innerhalb der Box:

```bash
sudo npm install -g openclaw
```

## Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Folgen Sie den Aufforderungen. Kopieren Sie nach Abschluss des Onboardings die Dashboard-URL und das Token.

## Gateway starten

Konfigurieren Sie das Gateway für das Box-Netzwerk und starten Sie es im Hintergrund:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Öffnen Sie bei aktivem SSH-Tunnel die Dashboard-URL lokal:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatischer Neustart

Legen Sie diesen Befehl als Init-Skript der Box fest, damit das Gateway beim Start der Box
neu gestartet wird:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Fehlerbehebung

Wenn SSH während des Onboardings nicht mehr reagiert, stellen Sie die Verbindung mit einer leeren SSH-Konfiguration und
Keep-Alives erneut her:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Dadurch werden veraltete lokale `~/.ssh/config`-Einstellungen umgangen und der Tunnel bleibt
auch während inaktiver Netzwerkphasen aktiv.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Gateway-Sicherheit](/de/gateway/security)
- [OpenClaw aktualisieren](/de/install/updating)
