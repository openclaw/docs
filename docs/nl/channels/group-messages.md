---
read_when:
    - Regels voor groepsberichten of vermeldingen wijzigen
summary: Gedrag en configuratie voor afhandeling van WhatsApp-groepsberichten (mentionPatterns worden gedeeld tussen oppervlakken)
title: Groepsberichten
x-i18n:
    generated_at: "2026-04-29T22:25:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Doel: laat Clawd in WhatsApp-groepen zitten, alleen wakker worden wanneer hij wordt gepingd, en die thread gescheiden houden van de persoonlijke DM-sessie.

<Note>
`agents.list[].groupChat.mentionPatterns` wordt ook gebruikt door Telegram, Discord, Slack en iMessage. Dit document richt zich op WhatsApp-specifiek gedrag. Stel voor opstellingen met meerdere agents `agents.list[].groupChat.mentionPatterns` per agent in, of gebruik `messages.groupChat.mentionPatterns` als globale fallback.
</Note>

## Huidige implementatie (2025-12-03)

- Activeringsmodi: `mention` (standaard) of `always`. `mention` vereist een ping (echte WhatsApp-@vermeldingen via `mentionedJids`, veilige regex-patronen, of de E.164 van de bot ergens in de tekst). `always` maakt de agent wakker bij elk bericht, maar hij zou alleen moeten antwoorden wanneer hij zinvolle waarde kan toevoegen; anders retourneert hij de exacte stille token `NO_REPLY` / `no_reply`. Standaarden kunnen in de config (`channels.whatsapp.groups`) worden ingesteld en per groep via `/activation` worden overschreven. Wanneer `channels.whatsapp.groups` is ingesteld, werkt dit ook als toestemmingslijst voor groepen (neem `"*"` op om alles toe te staan).
- Groepsbeleid: `channels.whatsapp.groupPolicy` bepaalt of groepsberichten worden geaccepteerd (`open|disabled|allowlist`). `allowlist` gebruikt `channels.whatsapp.groupAllowFrom` (fallback: expliciete `channels.whatsapp.allowFrom`). Standaard is `allowlist` (geblokkeerd totdat je afzenders toevoegt).
- Sessies per groep: sessiesleutels zien eruit als `agent:<agentId>:whatsapp:group:<jid>`, zodat opdrachten zoals `/verbose on`, `/trace on` of `/think high` (verzonden als zelfstandige berichten) beperkt blijven tot die groep; de persoonlijke DM-status blijft onaangeraakt. Heartbeats worden overgeslagen voor groepsthreads.
- Contextinjectie: **alleen-pending** groepsberichten (standaard 50) die _geen_ run hebben geactiveerd, krijgen een voorvoegsel onder `[Chat messages since your last reply - for context]`, met de activerende regel onder `[Current message - respond to this]`. Berichten die al in de sessie staan, worden niet opnieuw geïnjecteerd.
- Afzenderweergave: elke groepsbatch eindigt nu met `[from: Sender Name (+E164)]`, zodat Pi weet wie er spreekt.
- Tijdelijk/eenmalig bekijken: we pakken die uit voordat tekst/vermeldingen worden geëxtraheerd, zodat pings erin nog steeds activeren.
- Systeemprompt voor groepen: bij de eerste beurt van een groepssessie (en telkens wanneer `/activation` de modus wijzigt) injecteren we een korte tekst in de systeemprompt zoals `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Als metadata niet beschikbaar is, vertellen we de agent nog steeds dat het een groepschat is.

## Config-voorbeeld (WhatsApp)

Voeg een `groupChat`-blok toe aan `~/.openclaw/openclaw.json`, zodat pings op weergavenaam werken, zelfs wanneer WhatsApp de visuele `@` uit de tekstbody verwijdert:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Opmerkingen:

- De regexes zijn hoofdletterongevoelig en gebruiken dezelfde veilige-regex-vangrails als andere config-regexoppervlakken; ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- WhatsApp verzendt nog steeds canonieke vermeldingen via `mentionedJids` wanneer iemand op het contact tikt, dus de nummer-fallback is zelden nodig, maar is een handig vangnet.

### Activeringsopdracht (alleen eigenaar)

Gebruik de groepschatopdracht:

- `/activation mention`
- `/activation always`

Alleen het eigenaarnummer (uit `channels.whatsapp.allowFrom`, of de eigen E.164 van de bot wanneer dit niet is ingesteld) kan dit wijzigen. Verzend `/status` als zelfstandig bericht in de groep om de huidige activeringsmodus te bekijken.

## Gebruik

1. Voeg je WhatsApp-account (degene waarop OpenClaw draait) toe aan de groep.
2. Zeg `@openclaw …` (of voeg het nummer toe). Alleen afzenders op de toestemmingslijst kunnen hem activeren, tenzij je `groupPolicy: "open"` instelt.
3. De agentprompt bevat recente groepscontext plus de afsluitende `[from: …]`-markering, zodat hij de juiste persoon kan aanspreken.
4. Richtlijnen op sessieniveau (`/verbose on`, `/trace on`, `/think high`, `/new` of `/reset`, `/compact`) gelden alleen voor de sessie van die groep; verzend ze als zelfstandige berichten zodat ze worden geregistreerd. Je persoonlijke DM-sessie blijft onafhankelijk.

## Testen / verificatie

- Handmatige smoke-test:
  - Verzend een `@openclaw`-ping in de groep en bevestig dat er een antwoord komt dat naar de naam van de afzender verwijst.
  - Verzend een tweede ping en controleer dat het geschiedenisblok is opgenomen en daarna bij de volgende beurt wordt gewist.
- Controleer Gateway-logboeken (uitvoeren met `--verbose`) om vermeldingen voor `inbound web message` te zien met `from: <groupJid>` en het achtervoegsel `[from: …]`.

## Bekende aandachtspunten

- Heartbeats worden bewust overgeslagen voor groepen om luidruchtige broadcasts te vermijden.
- Echo-onderdrukking gebruikt de gecombineerde batchstring; als je twee keer identieke tekst zonder vermeldingen verzendt, krijgt alleen de eerste een reactie.
- Sessiestore-vermeldingen verschijnen als `agent:<agentId>:whatsapp:group:<jid>` in de sessiestore (standaard `~/.openclaw/agents/<agentId>/sessions/sessions.json`); een ontbrekende vermelding betekent alleen dat de groep nog geen run heeft geactiveerd.
- Typindicatoren in groepen volgen `agents.defaults.typingMode`. Wanneer zichtbare antwoorden de standaardmodus alleen-berichttool gebruiken, begint typen standaard onmiddellijk, zodat groepsleden kunnen zien dat de agent werkt, zelfs als er geen automatisch definitief antwoord wordt geplaatst. Expliciete typemodus-config heeft nog steeds voorrang.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Broadcastgroepen](/nl/channels/broadcast-groups)
