---
read_when:
    - Lavorare sulle reazioni in qualsiasi canale
    - Comprendere le differenze nelle reazioni emoji tra le piattaforme
summary: Semantica dello strumento di reazione in tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-06-27T18:23:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
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
- Sui canali che supportano le reazioni di stato, `trackToolCalls: true` su una reazione consente al runtime di usare quel messaggio con reazione per le successive reazioni di avanzamento degli strumenti durante lo stesso turno.

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

  <Accordion title="Nextcloud Talk">
    - Solo aggiunta di reazioni: `emoji` è obbligatorio e non deve essere vuoto.
    - La rimozione delle reazioni non è ancora supportata; le chiamate con `remove: true` (o `emoji` vuoto) vengono rifiutate con un errore chiaro invece di non avere effetto in modo silenzioso.
    - Richiede che il bot Talk sia registrato con la funzionalità `reaction` (vedi [documentazione del canale Nextcloud Talk](/it/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vuoto rimuove le reazioni del bot.
    - Anche `remove: true` rimuove le reazioni, ma richiede comunque un `emoji` non vuoto per la validazione dello strumento.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vuoto rimuove la reazione del bot.
    - `remove: true` viene mappato internamente a emoji vuoto (richiede comunque `emoji` nella chiamata allo strumento).
    - WhatsApp ha uno slot di reazione del bot per messaggio; gli aggiornamenti delle reazioni di stato sostituiscono quello slot invece di accumulare più emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Richiede `emoji` non vuoto.
    - `remove: true` rimuove quella specifica reazione emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Usa lo strumento `feishu_reaction` con le azioni `add`, `remove` e `list`.
    - Add/remove richiede `emoji_type`; remove richiede anche `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Le notifiche delle reazioni in ingresso sono controllate da `channels.signal.reactionNotifications`: `"off"` le disattiva, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi del bot e `"all"` emette eventi per tutte le reazioni.

  </Accordion>

  <Accordion title="iMessage">
    - Le reazioni in uscita sono tapback di iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` e `question`).
    - Le notifiche dei tapback in ingresso sono controllate da `channels.imessage.reactionNotifications`: `"off"` le disattiva, `"own"` (predefinito) emette eventi quando gli utenti reagiscono ai messaggi scritti dal bot e `"all"` emette eventi per tutti i tapback provenienti da mittenti autorizzati.

  </Accordion>
</AccordionGroup>

## Livello di reazione

La configurazione `reactionLevel` per canale controlla quanto ampiamente l'agente usa le reazioni. I valori sono in genere `off`, `ack`, `minimal` o `extensive`.

- [Telegram reactionLevel](/it/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/it/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Imposta `reactionLevel` sui singoli canali per regolare quanto attivamente l'agente reagisce ai messaggi su ciascuna piattaforma.

## Correlati

- [Invio dell'agente](/it/tools/agent-send) — lo strumento `message` che include `react`
- [Canali](/it/channels) — configurazione specifica per canale
