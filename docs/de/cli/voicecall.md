---
read_when:
    - Sie verwenden das Voice-Call-Plugin und möchten die CLI-Einstiegspunkte
    - Sie möchten kurze Beispiele für `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Voice-Call-Plugin)
title: Sprachanruf
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` ist ein vom Plugin bereitgestellter Befehl. Er erscheint nur, wenn das Voice-Call-Plugin installiert und aktiviert ist.

Primäre Dokumentation:

- Voice-Call-Plugin: [Voice Call](/de/plugins/voice-call)

## Häufige Befehle

```bash
openclaw voicecall setup
openclaw voicecall smoke
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

Für externe Provider (`twilio`, `telnyx`, `plivo`) muss setup eine öffentliche
Webhook-URL aus `publicUrl`, einem Tunnel oder Tailscale auflösen. Ein Loopback-/privates
Serve-Fallback wird abgelehnt, da Carrier es nicht erreichen können.

`smoke` führt dieselben Bereitschaftsprüfungen aus. Es führt keinen echten Anruf durch,
es sei denn, sowohl `--to` als auch `--yes` sind vorhanden:

```bash
openclaw voicecall smoke --to "+15555550123"        # Probelauf
openclaw voicecall smoke --to "+15555550123" --yes  # echter Notify-Anruf
```

## Webhooks verfügbar machen (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Sicherheitshinweis: Stellen Sie den Webhook-Endpunkt nur Netzwerken bereit, denen Sie vertrauen. Bevorzugen Sie nach Möglichkeit Tailscale Serve gegenüber Funnel.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Voice-Call-Plugin](/de/plugins/voice-call)
