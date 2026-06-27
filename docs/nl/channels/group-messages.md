---
read_when:
    - Specifiek WhatsApp-groepen configureren
    - De activeringsmodi van WhatsApp wijzigen (`mention` vs `always`)
    - WhatsApp-groepssessiesleutels of context voor wachtende berichten afstemmen
sidebarTitle: WhatsApp groups
summary: WhatsApp-afhandeling van groepsberichten — activering, allowlists, sessies en contextinjectie
title: WhatsApp-groepsberichten
x-i18n:
    generated_at: "2026-06-27T17:10:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Zie [Groepen](/nl/channels/groups) voor het model voor kanaaloverstijgende groepen (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo). Deze pagina behandelt het WhatsApp-specifieke gedrag bovenop dat model: activering, groep-allowlists, sessiesleutels per groep en contextinjectie van wachtende berichten.

Doel: OpenClaw in WhatsApp-groepen laten zitten, alleen wakker laten worden wanneer het wordt gepingd, en die thread gescheiden houden van de persoonlijke DM-sessie.

<Note>
`agents.list[].groupChat.mentionPatterns` wordt ook gebruikt door Telegram, Discord, Slack en iMessage. Stel dit bij opstellingen met meerdere agents per agent in, of gebruik `messages.groupChat.mentionPatterns` als globale fallback.
</Note>

## Gedrag

- Activeringsmodi: `mention` (standaard) of `always`. `mention` vereist een ping (echte WhatsApp-@vermeldingen via `mentionedJids`, veilige regex-patronen, of de E.164 van de bot ergens in de tekst). `always` wekt de agent bij elk bericht, maar die moet alleen antwoorden wanneer die betekenisvolle waarde kan toevoegen; anders geeft die de exacte stille token `NO_REPLY` / `no_reply` terug. Standaarden kunnen in de configuratie worden ingesteld (`channels.whatsapp.groups`) en per groep worden overschreven via `/activation`. Wanneer `channels.whatsapp.groups` is ingesteld, fungeert het ook als groep-allowlist (neem `"*"` op om alles toe te staan).
- Groepsbeleid: `channels.whatsapp.groupPolicy` bepaalt of groepsberichten worden geaccepteerd (`open|disabled|allowlist`). `allowlist` gebruikt `channels.whatsapp.groupAllowFrom` (fallback: expliciete `channels.whatsapp.allowFrom`). De standaard is `allowlist` (geblokkeerd totdat je afzenders toevoegt).
- Sessies per groep: sessiesleutels zien eruit als `agent:<agentId>:whatsapp:group:<jid>`, zodat opdrachten zoals `/verbose on`, `/trace on` of `/think high` (verzonden als zelfstandige berichten) beperkt blijven tot die groep; de persoonlijke DM-status blijft onaangeroerd. Heartbeats worden overgeslagen voor groepsthreads.
- Contextinjectie: groepsberichten die **alleen wachten** (standaard 50) en _geen_ run hebben geactiveerd, krijgen het voorvoegsel `[Chat messages since your last reply - for context]`, met de activerende regel onder `[Current message - respond to this]`. Berichten die al in de sessie staan, worden niet opnieuw geïnjecteerd.
- Afzenderweergave: elke groepsbatch eindigt nu met `[from: Sender Name (+E164)]`, zodat OpenClaw weet wie er spreekt.
- Vluchtig/eenmalig bekijken: we pakken die uit voordat tekst/vermeldingen worden geëxtraheerd, zodat pings daarin nog steeds activeren.
- Systeemprompt voor groepen: bij de eerste beurt van een groepssessie (en telkens wanneer `/activation` de modus wijzigt) injecteren we een korte toelichting in de systeemprompt, zoals `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Als metadata niet beschikbaar is, vertellen we de agent nog steeds dat het een groepschat is.

## Configuratievoorbeeld (WhatsApp)

Voeg een `groupChat`-blok toe aan `~/.openclaw/openclaw.json`, zodat pings op weergavenaam werken, zelfs wanneer WhatsApp de visuele `@` uit de tekstinhoud verwijdert:

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

- De regexen zijn hoofdletterongevoelig en gebruiken dezelfde beveiligingen voor veilige regex als andere configuratie-oppervlakken met regex; ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- WhatsApp stuurt nog steeds canonieke vermeldingen via `mentionedJids` wanneer iemand op het contact tikt, dus de nummer-fallback is zelden nodig, maar is een nuttig vangnet.

### Activeringsopdracht (alleen eigenaar)

Gebruik de groepschatopdracht:

- `/activation mention`
- `/activation always`

Alleen het eigenaarnummer (uit `channels.whatsapp.allowFrom`, of de eigen E.164 van de bot wanneer dit niet is ingesteld) kan dit wijzigen. Stuur `/status` als zelfstandig bericht in de groep om de huidige activeringsmodus te zien.

## Gebruik

1. Voeg je WhatsApp-account (het account waarop OpenClaw draait) toe aan de groep.
2. Zeg `@openclaw …` (of neem het nummer op). Alleen afzenders op de allowlist kunnen dit activeren, tenzij je `groupPolicy: "open"` instelt.
3. De agentprompt bevat recente groepscontext plus de afsluitende markering `[from: …]`, zodat die de juiste persoon kan aanspreken.
4. Richtlijnen op sessieniveau (`/verbose on`, `/trace on`, `/think high`, `/new` of `/reset`, `/compact`) gelden alleen voor de sessie van die groep; stuur ze als zelfstandige berichten, zodat ze worden geregistreerd. Je persoonlijke DM-sessie blijft onafhankelijk.

## Testen / verificatie

- Handmatige rooktest:
  - Stuur een `@openclaw`-ping in de groep en bevestig een antwoord dat naar de naam van de afzender verwijst.
  - Stuur een tweede ping en controleer dat het geschiedenisblok wordt opgenomen en daarna bij de volgende beurt wordt gewist.
- Controleer Gateway-logboeken (uitvoeren met `--verbose`) om vermeldingen voor `inbound web message` te zien met `from: <groupJid>` en het achtervoegsel `[from: …]`.

## Bekende aandachtspunten

- Heartbeats worden voor groepen bewust overgeslagen om lawaaierige uitzendingen te voorkomen.
- Echo-onderdrukking gebruikt de gecombineerde batchstring; als je twee keer identieke tekst zonder vermeldingen stuurt, krijgt alleen de eerste een antwoord.
- Vermeldingen in de sessieopslag verschijnen als `agent:<agentId>:whatsapp:group:<jid>` in de sessieopslag (standaard `~/.openclaw/agents/<agentId>/sessions/sessions.json`); een ontbrekende vermelding betekent alleen dat de groep nog geen run heeft geactiveerd.
- Typindicatoren in groepen volgen `agents.defaults.typingMode`. Wanneer zichtbare antwoorden zijn ingesteld op modus met alleen berichttools, begint typen standaard onmiddellijk, zodat groepsleden kunnen zien dat de agent werkt, zelfs als er geen automatisch eindantwoord wordt geplaatst. Expliciete configuratie voor typmodus heeft nog steeds voorrang.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Uitzendgroepen](/nl/channels/broadcast-groups)
