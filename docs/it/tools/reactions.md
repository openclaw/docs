---
read_when:
    - Lavorare con le reazioni in qualsiasi canale
    - Comprendere in che modo le reazioni con emoji differiscono tra le piattaforme
summary: Semantica dello strumento di reazione in tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-05-03T21:44:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

L'agente può aggiungere e rimuovere reazioni emoji sui messaggi usando lo strumento `message` con l'azione `react`. Il comportamento delle reazioni varia in base al canale e al trasporto.

## Come funziona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` è obbligatorio quando si aggiunge una reazione.
- Imposta `emoji` su una stringa vuota (`""`) per rimuovere le reazioni del bot.
- Imposta `remove: true` per rimuovere un emoji specifico (richiede `emoji` non vuoto).
- Sui canali che supportano le reazioni di stato, `trackToolCalls: true` su una
  reazione consente al runtime di usare quel messaggio con reazione per le successive
  reazioni di avanzamento degli strumenti durante lo stesso turno.

## Comportamento del canale

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` vuoto rimuove tutte le reazioni del bot sul messaggio.
    - `remove: true` rimuove solo l'emoji specificato.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vuoto rimuove le reazioni dell'app sul messaggio.
    - `remove: true` rimuove solo l'emoji specificato.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vuoto rimuove le reazioni del bot.
    - `remove: true` rimuove anche le reazioni, ma richiede comunque un `emoji` non vuoto per la convalida dello strumento.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vuoto rimuove la reazione del bot.
    - `remove: true` viene mappato internamente a un emoji vuoto (richiede comunque `emoji` nella chiamata allo strumento).

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
    - Le notifiche delle reazioni in ingresso sono controllate da `channels.signal.reactionNotifications`: `"off"` le disabilita, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi del bot e `"all"` emette eventi per tutte le reazioni.

  </Accordion>
</AccordionGroup>

## Livello di reazione

La configurazione `reactionLevel` per canale controlla quanto ampiamente l'agente usa le reazioni. I valori sono in genere `off`, `ack`, `minimal` o `extensive`.

- [reactionLevel di Telegram](/it/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel di WhatsApp](/it/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Imposta `reactionLevel` sui singoli canali per regolare quanto attivamente l'agente reagisce ai messaggi su ciascuna piattaforma.

## Correlati

- [Invio dell'agente](/it/tools/agent-send) — lo strumento `message` che include `react`
- [Canali](/it/channels) — configurazione specifica del canale
