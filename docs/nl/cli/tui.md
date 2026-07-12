---
read_when:
    - Je wilt een terminalinterface voor de Gateway (geschikt voor externe toegang)
    - Je wilt url/token/sessie vanuit scripts doorgeven
    - U wilt de TUI uitvoeren in lokale ingebedde modus zonder Gateway
    - Je wilt `openclaw chat` of `openclaw tui --local` gebruiken
summary: CLI-referentie voor `openclaw tui` (door Gateway ondersteunde of lokaal ingebedde terminalinterface)
title: TUI
x-i18n:
    generated_at: "2026-07-12T08:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Open de terminalinterface die met de Gateway is verbonden, of voer deze uit in de lokale ingebedde modus.

Gerelateerde handleiding: [TUI](/nl/web/tui)

## Opties

| Vlag                         | Standaard                                 | Beschrijving                                                                                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--local`                    | `false`                                   | Uitvoeren met de lokale ingebedde agentruntime in plaats van een Gateway.                                    |
| `--url <url>`                | `gateway.remote.url` uit de configuratie  | WebSocket-URL van de Gateway.                                                                                |
| `--token <token>`            | (geen)                                    | Gateway-token indien vereist.                                                                                |
| `--password <pass>`          | (geen)                                    | Gateway-wachtwoord indien vereist.                                                                           |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Verwachte vingerafdruk van het TLS-certificaat voor een vastgezette `wss://`-Gateway.                        |
| `--session <key>`            | `main` (of `global` bij globaal bereik)   | Sessiesleutel. Binnen een agentwerkruimte wordt die agent automatisch geselecteerd, tenzij een voorvoegsel is opgegeven. |
| `--deliver`                  | `false`                                   | Antwoorden van de assistent afleveren via geconfigureerde kanalen.                                           |
| `--thinking <level>`         | (standaard van het model)                 | Overschrijving van het denkniveau.                                                                           |
| `--message <text>`           | (geen)                                    | Na het verbinden een eerste bericht verzenden.                                                               |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Time-out van de agent. Ongeldige waarden leiden tot een waarschuwing in het logboek en worden genegeerd.     |
| `--history-limit <n>`        | `200`                                     | Aantal geschiedenisitems dat bij het koppelen wordt geladen.                                                 |

Aliassen: `openclaw chat` en `openclaw terminal` roepen deze opdracht aan waarbij `--local` impliciet wordt toegepast.

## Opmerkingen

- `--local` kan niet worden gecombineerd met `--url`, `--token`, `--password` of `--tls-fingerprint`.
- `tui` herleidt waar mogelijk de geconfigureerde Gateway-authenticatie-SecretRefs voor authenticatie met tokens/wachtwoorden (`env`/`file`/`exec`-providers).
- Zonder expliciete URL of poort volgt `tui` de actieve lokale Gateway-poort die door de actieve Gateway is vastgelegd. Expliciete waarden voor `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` en de configuratie van een externe Gateway behouden voorrang.
- Wanneer TUI vanuit de map van een geconfigureerde agentwerkruimte wordt gestart, selecteert TUI die agent automatisch als standaard voor de sessiesleutel (tenzij `--session` expliciet `agent:<id>:...` is).
- Voer `openclaw config set tui.footer.showRemoteHost true` uit om de hostnaam van de Gateway in de voettekst weer te geven voor niet-lokale verbindingen via een URL. Dit staat standaard uit en wordt nooit weergegeven voor local loopback- of ingebedde lokale verbindingen.
- De lokale modus gebruikt de ingebedde agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die uitsluitend via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- In de lokale modus wordt `/auth [provider]` toegevoegd aan de opdrachten van TUI.
- Goedkeuringscontroles van Plugins blijven ook in de lokale modus van toepassing: tools waarvoor goedkeuring vereist is, vragen in de terminal om een beslissing; niets wordt stilzwijgend automatisch goedgekeurd.
- Sessiedoelen ([goals](/nl/tools/goal)) worden in de voettekst weergegeven en kunnen met `/goal` worden beheerd.

## Voorbeelden

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Vergelijk mijn configuratie met de documentatie en vertel me wat ik moet herstellen"
# wanneer uitgevoerd binnen een agentwerkruimte, wordt die agent automatisch afgeleid
openclaw tui --session bugfix
```

## Herstelcyclus voor configuratie

Gebruik de lokale modus om de ingebedde agent de huidige configuratie te laten inspecteren, deze met de documentatie te vergelijken en vanuit dezelfde terminal te helpen herstellen.

Als `openclaw config validate` al mislukt, voer dan eerst `openclaw configure` of `openclaw doctor --fix` uit; `openclaw chat` omzeilt de controle op een ongeldige configuratie niet.

```bash
openclaw chat
```

Vervolgens binnen TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Pas gerichte correcties toe met `openclaw config set` of `openclaw configure` en voer daarna `openclaw config validate` opnieuw uit. Zie [TUI](/nl/web/tui) en [Configuratie](/nl/cli/config).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [TUI](/nl/web/tui)
- [Doel](/nl/tools/goal)
