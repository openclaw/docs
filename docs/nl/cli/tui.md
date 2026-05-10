---
read_when:
    - Je wilt een terminalinterface voor de Gateway (geschikt voor bediening op afstand)
    - Je wilt url/token/session vanuit scripts doorgeven
    - Je wilt de TUI in lokale ingebedde modus uitvoeren zonder Gateway
    - Je wilt openclaw chat of openclaw tui --local gebruiken
summary: CLI-referentie voor `openclaw tui` (door Gateway ondersteunde of lokaal ingebouwde terminal-UI)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Open de terminal-UI die is verbonden met de Gateway, of voer deze uit in lokale ingebedde
modus.

Gerelateerd:

- TUI-gids: [TUI](/nl/web/tui)

## Opties

| Vlag                  | Standaardwaarde                          | Beschrijving                                                                       |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Voer uit tegen de lokale ingebedde agent-runtime in plaats van een Gateway.        |
| `--url <url>`         | `gateway.remote.url` uit de configuratie  | Gateway WebSocket-URL.                                                             |
| `--token <token>`     | (geen)                                    | Gateway-token indien vereist.                                                      |
| `--password <pass>`   | (geen)                                    | Gateway-wachtwoord indien vereist.                                                 |
| `--session <key>`     | `main` (of `global` wanneer scope globaal is) | Sessiesleutel. Binnen een agent-werkruimte selecteert deze automatisch die agent, tenzij voorafgegaan door een prefix. |
| `--deliver`           | `false`                                   | Lever assistentantwoorden via geconfigureerde kanalen.                             |
| `--thinking <level>`  | (modelstandaard)                          | Overschrijving van denkniveau.                                                     |
| `--message <text>`    | (geen)                                    | Verzend een eerste bericht na het verbinden.                                       |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Agent-time-out. Ongeldige waarden loggen een waarschuwing en worden genegeerd.     |
| `--history-limit <n>` | `200`                                     | Geschiedenisitems om te laden bij koppelen.                                        |

Aliassen: `openclaw chat` en `openclaw terminal` roepen dezelfde opdracht aan met impliciet `--local`.

Opmerkingen:

- `chat` en `terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- `tui` lost waar mogelijk geconfigureerde Gateway-authenticatie-SecretRefs op voor token-/wachtwoordauthenticatie (`env`/`file`/`exec`-providers).
- Wanneer gestart vanuit een geconfigureerde agent-werkruimtemap, selecteert TUI automatisch die agent als standaard voor de sessiesleutel (tenzij `--session` expliciet `agent:<id>:...` is).
- Lokale modus gebruikt de ingebedde agent-runtime rechtstreeks. De meeste lokale tools werken, maar functies die alleen in de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Lokale modus voegt `/auth [provider]` toe binnen het opdrachtoppervlak van de TUI.
- Plugin-goedkeuringspoorten blijven gelden in lokale modus. Tools waarvoor goedkeuring vereist is, vragen in de terminal om een beslissing; niets wordt stilzwijgend automatisch goedgekeurd omdat de Gateway niet betrokken is.

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

## Configuratieherstellus

Gebruik lokale modus wanneer de huidige configuratie al valideert en je wilt dat de
ingebedde agent deze inspecteert, vergelijkt met de documentatie en helpt deze te
herstellen vanuit dezelfde terminal:

Als `openclaw config validate` al faalt, gebruik dan eerst `openclaw configure` of
`openclaw doctor --fix`. `openclaw chat` omzeilt de beveiliging tegen ongeldige
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

Pas gerichte fixes toe met `openclaw config set` of `openclaw configure`, en voer daarna
`openclaw config validate` opnieuw uit. Zie [TUI](/nl/web/tui) en [Config](/nl/cli/config).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [TUI](/nl/web/tui)
