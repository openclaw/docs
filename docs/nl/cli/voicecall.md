---
read_when:
    - Je gebruikt de voice-call Plugin en wilt de CLI-toegangspunten
    - Je wilt snelle voorbeelden voor `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: CLI-referentie voor `openclaw voicecall` (opdrachtinterface van de spraakoproep-Plugin)
title: Spraakoproep
x-i18n:
    generated_at: "2026-05-01T11:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` is een door een Plugin geleverde opdracht. Deze verschijnt alleen als de voice-call-Plugin is geinstalleerd en ingeschakeld.

Wanneer de Gateway draait, worden operationele opdrachten (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` en `status`) verzonden naar de
voice-call-runtime van die Gateway. Als er geen Gateway bereikbaar is, vallen ze
terug op een zelfstandige CLI-runtime.

Primair document:

- Voice-call-Plugin: [Voice Call](/nl/plugins/voice-call)

## Veelgebruikte opdrachten

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

`setup` toont standaard voor mensen leesbare gereedheidscontroles. Gebruik `--json` voor
scripts:

```bash
openclaw voicecall setup --json
```

`status` toont actieve oproepen standaard als JSON. Geef `--call-id <id>` door om
een oproep te inspecteren.

Voor externe providers (`twilio`, `telnyx`, `plivo`) moet setup een openbare
Webhook-URL bepalen via `publicUrl`, een tunnel of Tailscale-blootstelling. Een terugval naar
local loopback/private serve wordt geweigerd omdat providers deze niet kunnen bereiken.

`smoke` voert dezelfde gereedheidscontroles uit. Er wordt geen echt telefoongesprek
geplaatst tenzij zowel `--to` als `--yes` aanwezig zijn:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Webhooks beschikbaar maken (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Beveiligingsopmerking: stel het Webhook-eindpunt alleen beschikbaar aan netwerken die u vertrouwt. Geef waar mogelijk de voorkeur aan Tailscale Serve boven Funnel.

## Gerelateerd

- [CLI-verwijzing](/nl/cli)
- [Voice call-Plugin](/nl/plugins/voice-call)
