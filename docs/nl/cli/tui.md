---
read_when:
    - Je wilt een terminalinterface voor de Gateway (geschikt voor externe toegang)
    - Je wilt url/token/session vanuit scripts doorgeven
    - Je wilt de TUI in lokale ingebedde modus uitvoeren zonder Gateway
    - Je wilt openclaw chat of openclaw tui --local gebruiken
summary: CLI-referentie voor `openclaw tui` (door Gateway ondersteunde of lokaal ingebedde terminalinterface)
title: TUI
x-i18n:
    generated_at: "2026-04-29T22:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Open de terminal-UI die is verbonden met de Gateway, of voer deze uit in lokale ingebedde
modus.

Gerelateerd:

- TUI-handleiding: [TUI](/nl/web/tui)

Opmerkingen:

- `chat` en `terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- `tui` lost waar mogelijk geconfigureerde Gateway-authenticatie-SecretRefs op voor token-/wachtwoordauthenticatie (`env`/`file`/`exec`-providers).
- Wanneer TUI wordt gestart vanuit een geconfigureerde agentwerkruimtemap, selecteert TUI automatisch die agent voor de standaardwaarde van de sessiesleutel (tenzij `--session` expliciet `agent:<id>:...` is).
- Lokale modus gebruikt de ingebedde agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Lokale modus voegt `/auth [provider]` toe binnen het TUI-oppervlak voor commando’s.
- Plugin-goedkeuringspoorten blijven ook in lokale modus van toepassing. Tools die goedkeuring vereisen, vragen in de terminal om een beslissing; niets wordt stilzwijgend automatisch goedgekeurd omdat de Gateway niet betrokken is.

## Voorbeelden

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Configuratiereparatielus

Gebruik lokale modus wanneer de huidige configuratie al valideert en je wilt dat de
ingebedde agent deze inspecteert, vergelijkt met de documentatie en helpt deze te
repareren vanuit dezelfde terminal:

Als `openclaw config validate` al faalt, gebruik dan eerst `openclaw configure` of
`openclaw doctor --fix`. `openclaw chat` omzeilt de bewaking tegen ongeldige
configuratie niet.

```bash
openclaw chat
```

Daarna binnen de TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Pas gerichte oplossingen toe met `openclaw config set` of `openclaw configure`, en
voer daarna `openclaw config validate` opnieuw uit. Zie [TUI](/nl/web/tui) en [Configuratie](/nl/cli/config).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [TUI](/nl/web/tui)
