---
read_when:
    - Je gebruikt de voice-call-Plugin en wilt de CLI-toegangspunten
    - Je wilt snelle voorbeelden voor `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: CLI-referentie voor `openclaw voicecall` (commandosurface van de spraakoproep-Plugin)
title: Spraakoproep
x-i18n:
    generated_at: "2026-04-29T22:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` is een door een Plugin geleverde opdracht. Deze verschijnt alleen als de spraakoproep-Plugin is geïnstalleerd en ingeschakeld.

Primair document:

- Spraakoproep-Plugin: [Spraakoproep](/nl/plugins/voice-call)

## Veelgebruikte opdrachten

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` toont standaard menselijk leesbare gereedheidscontroles. Gebruik `--json` voor
scripts:

```bash
openclaw voicecall setup --json
```

Voor externe providers (`twilio`, `telnyx`, `plivo`) moet setup een openbare
Webhook-URL oplossen vanuit `publicUrl`, een tunnel of Tailscale-blootstelling. Een terugvaloptie met loopback/privé
serveren wordt geweigerd omdat providers die niet kunnen bereiken.

`smoke` voert dezelfde gereedheidscontroles uit. Er wordt geen echte telefoonoproep geplaatst
tenzij zowel `--to` als `--yes` aanwezig zijn:

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

Beveiligingsopmerking: stel het Webhook-eindpunt alleen beschikbaar aan netwerken die je vertrouwt. Geef waar mogelijk de voorkeur aan Tailscale Serve boven Funnel.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Spraakoproep-Plugin](/nl/plugins/voice-call)
