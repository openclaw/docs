---
read_when:
    - Sie verwenden das Sprachanruf-Plugin und möchten die CLI-Einstiegspunkte
    - Sie möchten kurze Beispiele für `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des voice-call-Plugins)
title: Sprachanruf
x-i18n:
    generated_at: "2026-05-01T06:40:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` ist ein von einem Plugin bereitgestellter Befehl. Er wird nur angezeigt, wenn das Sprachanruf-Plugin installiert und aktiviert ist.

Wenn der Gateway ausgeführt wird, werden operative Befehle (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` und `status`) an die Sprachanruf-Runtime
dieses Gateway gesendet. Wenn kein Gateway erreichbar ist, fallen sie auf eine eigenständige
CLI-Runtime zurück.

Primäre Dokumentation:

- Sprachanruf-Plugin: [Sprachanruf](/de/plugins/voice-call)

## Häufige Befehle

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` gibt standardmäßig menschenlesbare Bereitschaftsprüfungen aus. Verwenden Sie `--json` für
Skripte:

```bash
openclaw voicecall setup --json
```

`status` gibt aktive Anrufe standardmäßig als JSON aus. Übergeben Sie `--call-id <id>`, um
einen Anruf zu prüfen.

Für externe Provider (`twilio`, `telnyx`, `plivo`) muss die Einrichtung eine öffentliche
Webhook-URL aus `publicUrl`, einem Tunnel oder einer Tailscale-Freigabe auflösen. Ein Fallback über
Loopback-/privates Bereitstellen wird abgelehnt, weil Netzbetreiber ihn nicht erreichen können.

`smoke` führt dieselben Bereitschaftsprüfungen aus. Es wird keinen echten Telefonanruf
starten, sofern nicht sowohl `--to` als auch `--yes` vorhanden sind:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Webhooks verfügbar machen (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Sicherheitshinweis: Machen Sie den Webhook-Endpunkt nur für Netzwerke verfügbar, denen Sie vertrauen. Bevorzugen Sie nach Möglichkeit Tailscale Serve gegenüber Funnel.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Sprachanruf-Plugin](/de/plugins/voice-call)
