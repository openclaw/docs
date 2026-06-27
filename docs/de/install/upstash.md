---
read_when:
    - OpenClaw auf Upstash Box bereitstellen
    - Sie möchten eine verwaltete Linux-Umgebung für OpenClaw mit Dashboard-Zugriff über einen SSH-Tunnel
summary: OpenClaw auf Upstash Box mit Keep-Alive und SSH-Tunnelzugriff hosten
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T17:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Führen Sie einen persistenten OpenClaw Gateway auf Upstash Box aus, einer verwalteten Linux-Umgebung
mit Keep-alive-Lifecycle-Unterstützung.

Verwenden Sie einen SSH-Tunnel für den Dashboard-Zugriff. Geben Sie den Gateway-Port nicht direkt
für das öffentliche Internet frei.

## Voraussetzungen

- Upstash-Konto
- Keep-alive-Upstash-Box
- SSH-Client auf Ihrem lokalen Computer

## Eine Box erstellen

Erstellen Sie eine Keep-alive-Box in der Upstash Console. Notieren Sie sich die Box-ID, zum Beispiel
`right-flamingo-14486`, und Ihren Box-API-Schlüssel.

Upstash pflegt seine aktuelle OpenClaw-Box-Anleitung unter
[OpenClaw-Einrichtung](https://upstash.com/docs/box/guides/openclaw-setup).

## Mit einem SSH-Tunnel verbinden

Leiten Sie den OpenClaw-Dashboard-Port an Ihren lokalen Computer weiter. Verwenden Sie Ihren Box-API-Schlüssel
als SSH-Passwort, wenn Sie dazu aufgefordert werden:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Die Keepalive-Optionen reduzieren Tunnelabbrüche durch Inaktivität während des Onboardings.

## OpenClaw installieren

Innerhalb der Box:

```bash
sudo npm install -g openclaw
```

## Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Folgen Sie den Eingabeaufforderungen. Kopieren Sie die Dashboard-URL und das Token, wenn das Onboarding abgeschlossen ist.

## Gateway starten

Konfigurieren Sie den Gateway für das Box-Netzwerk und starten Sie ihn im Hintergrund:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Öffnen Sie bei aktivem SSH-Tunnel die Dashboard-URL lokal:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatischer Neustart

Legen Sie diesen Befehl als Box-Init-Skript fest, damit der Gateway neu startet, wenn die Box
startet:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Problembehebung

Wenn SSH während des Onboardings einfriert, verbinden Sie sich erneut mit einer sauberen SSH-Konfiguration und
Keepalives:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Dies umgeht veraltete lokale `~/.ssh/config`-Einstellungen und hält den Tunnel
während inaktiver Netzwerkphasen aktiv.

## Verwandte Themen

- [Remote-Zugriff](/de/gateway/remote)
- [Gateway-Sicherheit](/de/gateway/security)
- [OpenClaw aktualisieren](/de/install/updating)
