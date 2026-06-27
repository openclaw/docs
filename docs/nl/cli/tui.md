---
read_when:
    - Je wilt een terminal-UI voor de Gateway (geschikt voor gebruik op afstand)
    - Je wilt url/token/session vanuit scripts doorgeven
    - Je wilt de TUI in lokale ingebedde modus uitvoeren zonder Gateway
    - U wilt openclaw chat of openclaw tui --local gebruiken
summary: CLI-referentie voor `openclaw tui` (Gateway-ondersteunde of lokale ingebedde terminal-UI)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:23:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Open de terminal-UI die is verbonden met de Gateway, of voer deze uit in lokale ingesloten
modus.

Gerelateerd:

- TUI-handleiding: [TUI](/nl/web/tui)

## Opties

| Vlag                  | Standaard                                | Beschrijving                                                                       |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                  | Voer uit tegen de lokale ingesloten agentruntime in plaats van een Gateway.        |
| `--url <url>`         | `gateway.remote.url` uit config          | Gateway WebSocket-URL.                                                             |
| `--token <token>`     | (geen)                                   | Gateway-token indien vereist.                                                      |
| `--password <pass>`   | (geen)                                   | Gateway-wachtwoord indien vereist.                                                 |
| `--session <key>`     | `main` (of `global` wanneer scope globaal is) | Sessiesleutel. Binnen een agentwerkruimte selecteert dit automatisch die agent, tenzij voorafgegaan door een prefix. |
| `--deliver`           | `false`                                  | Lever assistentantwoorden via geconfigureerde kanalen.                             |
| `--thinking <level>`  | (modelstandaard)                         | Overschrijving van denkniveau.                                                     |
| `--message <text>`    | (geen)                                   | Stuur een eerste bericht na het verbinden.                                         |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Agenttime-out. Ongeldige waarden loggen een waarschuwing en worden genegeerd.      |
| `--history-limit <n>` | `200`                                    | Geschiedenisitems om te laden bij koppelen.                                        |

Aliassen: `openclaw chat` en `openclaw terminal` roepen dezelfde opdracht aan met impliciet `--local`.

Opmerkingen:

- `chat` en `terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- `tui` lost geconfigureerde Gateway-authenticatie-SecretRefs op voor token-/wachtwoordauthenticatie wanneer mogelijk (`env`/`file`/`exec` providers).
- Wanneer gestart vanuit een geconfigureerde agentwerkruimtemap, selecteert TUI automatisch die agent voor de standaardsessiesleutel (tenzij `--session` expliciet `agent:<id>:...` is).
- Om de Gateway-hostnaam in de voettekst te tonen voor niet-lokale URL-ondersteunde verbindingen, voer `openclaw config set tui.footer.showRemoteHost true` uit. Het hostlabel staat standaard uit en verschijnt nooit voor loopback- of ingesloten lokale verbindingen.
- Lokale modus gebruikt de ingesloten agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Lokale modus voegt `/auth [provider]` toe binnen het TUI-oppervlak voor opdrachten.
- Plugin-goedkeuringspoorten blijven ook gelden in lokale modus. Tools die goedkeuring vereisen vragen in de terminal om een beslissing; niets wordt stilzwijgend automatisch goedgekeurd omdat de Gateway niet betrokken is.
- Sessie[doelen](/nl/tools/goal) verschijnen in de voettekst en kunnen worden beheerd met `/goal`.

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

Gebruik lokale modus wanneer de huidige config al valideert en je wilt dat de
ingesloten agent deze inspecteert, vergelijkt met de docs en helpt deze te herstellen
vanuit dezelfde terminal:

Als `openclaw config validate` al faalt, gebruik dan eerst `openclaw configure` of
`openclaw doctor --fix`. `openclaw chat` omzeilt de bewaking voor ongeldige
config niet.

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
`openclaw config validate` opnieuw uit. Zie [TUI](/nl/web/tui) en [Configuratie](/nl/cli/config).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [TUI](/nl/web/tui)
- [Doel](/nl/tools/goal)
