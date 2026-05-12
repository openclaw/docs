---
read_when:
    - Lavorare con le reazioni in qualsiasi canale
    - Comprendere le differenze delle reazioni emoji tra le piattaforme
summary: Semantica dello strumento di reazione in tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-05-12T01:00:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
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
  reazione consente al runtime di usare quel messaggio reagito per le reazioni
  di avanzamento degli strumenti successive durante lo stesso turno.

## Comportamento dei canali

<AccordionGroup>
  <Accordion title="Discord e Slack">
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
    - Aggiunta/rimozione richiede `emoji_type`; la rimozione richiede anche `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Le notifiche delle reazioni in ingresso sono controllate da `channels.signal.reactionNotifications`: `"off"` le disabilita, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi del bot e `"all"` emette eventi per tutte le reazioni.

  </Accordion>

  <Accordion title="iMessage">
    - Le reazioni in uscita sono tapback di iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` e `question`).
    - Le notifiche dei tapback in ingresso sono controllate da `channels.imessage.reactionNotifications`: `"off"` le disabilita, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi scritti dal bot e `"all"` emette eventi per tutti i tapback provenienti da mittenti autorizzati.

  </Accordion>
</AccordionGroup>

## Livello di reazione

La configurazione `reactionLevel` per canale controlla quanto ampiamente l'agente usa le reazioni. I valori sono in genere `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/it/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/it/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Imposta `reactionLevel` sui singoli canali per regolare quanto attivamente l'agente reagisce ai messaggi su ogni piattaforma.

## Correlati

- [Invio dell'agente](/it/tools/agent-send) — lo strumento `message` che include `react`
- [Canali](/it/channels) — configurazione specifica per canale
