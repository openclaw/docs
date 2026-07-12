---
read_when:
    - Gestire le reazioni in qualsiasi canale
    - Comprendere come variano le reazioni emoji tra le diverse piattaforme
summary: Semantica dello strumento per le reazioni in tutti i canali supportati
title: Reazioni
x-i18n:
    generated_at: "2026-07-12T07:34:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

L'agente aggiunge e rimuove le reazioni emoji tramite l'azione `react` dello strumento `message`. Il comportamento varia in base al canale.

## Funzionamento

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` è obbligatorio quando si aggiunge una reazione.
- Imposta `emoji` su una stringa vuota (`""`) per rimuovere le reazioni del bot sui canali che supportano questa operazione.
- Imposta `remove: true` per rimuovere una specifica emoji (richiede un valore `emoji` non vuoto).
- Sui canali con reazioni di stato, impostando `trackToolCalls: true` su una reazione, il runtime può riutilizzare il messaggio con la reazione per le successive reazioni relative all'avanzamento degli strumenti durante lo stesso turno.

## Comportamento dei canali

<AccordionGroup>
  <Accordion title="Discord e Slack">
    - Un valore `emoji` vuoto rimuove dal messaggio tutte le reazioni del bot.
    - `remove: true` rimuove soltanto l'emoji specificata.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Consente solo di aggiungere reazioni: `emoji` è obbligatorio e non può essere vuoto.
    - La rimozione delle reazioni non è ancora collegata a una chiamata di eliminazione; `remove: true` viene rifiutato con un errore esplicito anziché non produrre silenziosamente alcun effetto.
    - Richiede che il bot di Talk sia registrato con la funzionalità `reaction` (consulta la [documentazione del canale Nextcloud Talk](/it/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Un valore `emoji` vuoto rimuove le reazioni del bot.
    - Anche `remove: true` rimuove le reazioni, ma richiede comunque un valore `emoji` non vuoto per la convalida dello strumento.

  </Accordion>

  <Accordion title="WhatsApp">
    - Un valore `emoji` vuoto rimuove la reazione del bot.
    - `remove: true` viene convertito internamente in un'emoji vuota, ma richiede comunque `emoji` nella chiamata dello strumento.
    - WhatsApp dispone di un solo spazio per la reazione del bot per ciascun messaggio; l'invio di una nuova reazione sostituisce quella esistente anziché accumulare più emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Richiede un valore `emoji` non vuoto sia per l'aggiunta sia per la rimozione.
    - `remove: true` rimuove la specifica reazione emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Utilizza la stessa azione `react` degli altri canali (aggiunta, rimozione ed elenco tramite gli ID delle reazioni ai messaggi), non uno strumento separato.
    - L'aggiunta richiede un valore `emoji` non vuoto, associato a un `emoji_type` di Feishu, ad esempio `SMILE`, `THUMBSUP` o `HEART`.
    - `remove: true` richiede un valore `emoji` non vuoto e rimuove la reazione del bot corrispondente a quel tipo di emoji.
    - Un valore `emoji` vuoto con `clearAll: true` rimuove dal messaggio tutte le reazioni del bot.

  </Accordion>

  <Accordion title="Signal">
    - Le notifiche delle reazioni in entrata sono controllate da `channels.signal.reactionNotifications`: `"off"` le disabilita, `"own"` (valore predefinito) genera eventi quando gli utenti reagiscono ai messaggi del bot, `"all"` genera eventi per tutte le reazioni e `"allowlist"` genera eventi solo per i mittenti presenti in `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Le reazioni in uscita sono tapback di iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` e `question`); per aggiungere una reazione, `emoji` deve corrispondere a uno di questi tipi.
    - `remove: true` senza un tipo di tapback riconosciuto rimuove tutti i tipi di tapback; con un tipo riconosciuto rimuove soltanto quello specifico.

  </Accordion>
</AccordionGroup>

## Livello delle reazioni

L'impostazione `reactionLevel` per ciascun canale limita la frequenza con cui l'agente invia le proprie reazioni. Valori: `off`, `ack`, `minimal` o `extensive`.

- [Notifiche delle reazioni di Telegram](/it/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (valore predefinito: `minimal`)
- [Livello delle reazioni di WhatsApp](/it/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (valore predefinito: `minimal`)
- [Reazioni di Signal](/it/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (valore predefinito: `minimal`)

## Contenuti correlati

- [Invio dell'agente](/it/tools/agent-send) - lo strumento `message` che include `react`
- [Canali](/it/channels) - configurazione specifica per ciascun canale
