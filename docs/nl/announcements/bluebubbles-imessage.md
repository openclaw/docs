---
read_when:
    - Je gebruikte het oude BlueBubbles-kanaal en moet overstappen naar iMessage
    - Je kiest de ondersteunde OpenClaw iMessage-configuratie
    - Je hebt een korte uitleg nodig over de verwijdering van BlueBubbles
summary: Ondersteuning voor BlueBubbles is verwijderd uit OpenClaw. Gebruik voor nieuwe en gemigreerde iMessage-configuraties de gebundelde iMessage Plugin met imsg.
title: Verwijdering van BlueBubbles en het imsg-pad voor iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Verwijdering van BlueBubbles en het imsg iMessage-pad

OpenClaw levert het BlueBubbles-kanaal niet meer mee. Ondersteuning voor iMessage loopt nu via de gebundelde `imessage` Plugin, die [`imsg`](https://github.com/steipete/imsg) lokaal of via een SSH-wrapper start en JSON-RPC via stdin/stdout gebruikt.

Als je configuratie nog `channels.bluebubbles` bevat, migreer dit dan naar `channels.imessage`. De oude docs-URL `/channels/bluebubbles` verwijst door naar [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles), met de volledige vertaaltabel voor configuratie en de checklist voor de overstap.

## Wat is er veranderd

- Er is geen BlueBubbles HTTP-server, Webhook-route, REST-wachtwoord of BlueBubbles Plugin-runtime in het ondersteunde OpenClaw iMessage-pad.
- OpenClaw leest en volgt Berichten via `imsg` op de Mac waarop Messages.app is ingelogd.
- Basisfuncties voor verzenden, ontvangen, geschiedenis en media gebruiken de normale `imsg`-oppervlakken en macOS-machtigingen.
- Geavanceerde acties zoals antwoorden in threads, tapbacks, bewerken, verzenden ongedaan maken, effecten, leesbewijzen, typindicatoren en groepsbeheer vereisen `imsg launch` met de private API-bridge beschikbaar.
- Linux- en Windows-gateways kunnen iMessage nog steeds gebruiken door `channels.imessage.cliPath` in te stellen op een SSH-wrapper die `imsg` uitvoert op de ingelogde Mac.

## Wat je moet doen

1. Installeer en verifieer `imsg` op de Berichten-Mac:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Verleen Volledige schijftoegang en Automatisering-machtigingen aan de procescontext die `imsg` en OpenClaw uitvoert.

3. Vertaal de oude configuratie:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Herstart de Gateway en verifieer:

   ```bash
   openclaw channels status --probe
   ```

5. Test DM's, groepen, bijlagen en alle private API-acties waarvan je afhankelijk bent voordat je je oude BlueBubbles-server verwijdert.

## Migratie-opmerkingen

- `channels.bluebubbles.serverUrl` en `channels.bluebubbles.password` hebben geen iMessage-equivalent.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, bijlageroots, groottelimieten voor media, chunking en actie-schakelaars hebben iMessage-equivalenten.
- `channels.imessage.includeAttachments` staat nog steeds standaard uit. Stel dit expliciet in als je verwacht dat binnenkomende foto's, spraakmemo's, video's of bestanden de agent bereiken.
- Met `groupPolicy: "allowlist"` kopieer je het oude `groups`-blok, inclusief een eventuele wildcard-vermelding `"*"`. Toestaanlijsten voor groepsafzenders en het groepsregister zijn afzonderlijke poorten.
- ACP-bindingen die overeenkwamen met `channel: "bluebubbles"` moeten worden gewijzigd naar `channel: "imessage"`.
- Oude BlueBubbles-sessiesleutels worden geen iMessage-sessiesleutels. Koppelingsgoedkeuringen worden per handle overgenomen, maar gespreksgeschiedenis onder BlueBubbles-sessiesleutels niet.

## Zie ook

- [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles)
- [iMessage](/nl/channels/imessage)
- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
