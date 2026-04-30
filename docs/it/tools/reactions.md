---
read_when:
    - Lavorare con le reazioni in qualsiasi canale
    - Comprendere in che modo le reazioni emoji differiscono tra le piattaforme
summary: Semantica dello strumento di reazione in tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-04-30T09:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

L'agente può aggiungere e rimuovere reazioni emoji sui messaggi usando lo strumento `message`
con l'azione `react`. Il comportamento delle reazioni varia in base al canale e al trasporto.

## Funzionamento

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` è obbligatorio quando si aggiunge una reazione.
- Imposta `emoji` su una stringa vuota (`""`) per rimuovere le reazioni del bot.
- Imposta `remove: true` per rimuovere una specifica emoji (richiede `emoji` non vuoto).

## Comportamento per canale

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` vuoto rimuove tutte le reazioni del bot sul messaggio.
    - `remove: true` rimuove solo l'emoji specificata.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vuoto rimuove le reazioni dell'app sul messaggio.
    - `remove: true` rimuove solo l'emoji specificata.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vuoto rimuove le reazioni del bot.
    - `remove: true` rimuove anche le reazioni, ma richiede comunque un `emoji` non vuoto per la convalida dello strumento.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vuoto rimuove la reazione del bot.
    - `remove: true` viene mappato internamente a emoji vuoto (richiede comunque `emoji` nella chiamata allo strumento).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Richiede `emoji` non vuoto.
    - `remove: true` rimuove quella specifica reazione emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa lo strumento `feishu_reaction` con le azioni `add`, `remove` e `list`.
    - L'aggiunta/rimozione richiede `emoji_type`; la rimozione richiede anche `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Le notifiche di reazione in ingresso sono controllate da `channels.signal.reactionNotifications`: `"off"` le disabilita, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi del bot e `"all"` emette eventi per tutte le reazioni.

  </Accordion>
</AccordionGroup>

## Livello delle reazioni

La configurazione `reactionLevel` per canale controlla quanto ampiamente l'agente usa le reazioni. I valori sono in genere `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/it/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/it/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Imposta `reactionLevel` sui singoli canali per regolare quanto attivamente l'agente reagisce ai messaggi su ciascuna piattaforma.

## Correlati

- [Invio agente](/it/tools/agent-send) — lo strumento `message` che include `react`
- [Canali](/it/channels) — configurazione specifica del canale
