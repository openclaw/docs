---
read_when:
    - Lavorare sulle reazioni in qualsiasi canale
    - Capire come le reazioni emoji differiscono tra le piattaforme المختلفة
summary: Semantica dello strumento delle reazioni su tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-04-24T09:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

L'agente può aggiungere e rimuovere reazioni emoji ai messaggi usando lo strumento `message`
con l'azione `react`. Il comportamento delle reazioni varia a seconda del canale.

## Come funziona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` è obbligatorio quando si aggiunge una reazione.
- Imposta `emoji` su una stringa vuota (`""`) per rimuovere la/e reazione/i del bot.
- Imposta `remove: true` per rimuovere una specifica emoji (richiede `emoji` non vuoto).

## Comportamento per canale

<AccordionGroup>
  <Accordion title="Discord e Slack">
    - `emoji` vuoto rimuove tutte le reazioni del bot sul messaggio.
    - `remove: true` rimuove solo l'emoji specificata.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vuoto rimuove le reazioni dell'app sul messaggio.
    - `remove: true` rimuove solo l'emoji specificata.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vuoto rimuove le reazioni del bot.
    - `remove: true` rimuove anch'esso le reazioni ma richiede comunque un valore `emoji` non vuoto per la validazione dello strumento.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vuoto rimuove la reazione del bot.
    - `remove: true` viene mappato internamente a emoji vuota (richiede comunque `emoji` nella chiamata dello strumento).

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
    - Le notifiche delle reazioni in ingresso sono controllate da `channels.signal.reactionNotifications`: `"off"` le disattiva, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi del bot, e `"all"` emette eventi per tutte le reazioni.

  </Accordion>
</AccordionGroup>

## Livello di reazione

La configurazione `reactionLevel` per canale controlla quanto ampiamente l'agente usa le reazioni. I valori sono tipicamente `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/it/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/it/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Imposta `reactionLevel` sui singoli canali per regolare quanto attivamente l'agente reagisce ai messaggi su ogni piattaforma.

## Correlati

- [Agent Send](/it/tools/agent-send) — lo strumento `message` che include `react`
- [Channels](/it/channels) — configurazione specifica del canale
