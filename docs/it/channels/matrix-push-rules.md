---
read_when:
    - Configurazione dello streaming silenzioso di Matrix per Synapse o Tuwunel ospitati autonomamente
    - Gli utenti vogliono notifiche solo sui blocchi completati, non a ogni modifica di anteprima
summary: Regole di notifica di Matrix per destinatario per modifiche silenziose delle anteprime finalizzate
title: Regole push di Matrix per anteprime silenziose
x-i18n:
    generated_at: "2026-04-30T08:38:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Quando `channels.matrix.streaming` è `"quiet"`, OpenClaw modifica sul posto un singolo evento di anteprima e contrassegna la modifica finalizzata con un flag di contenuto personalizzato. I client Matrix notificano solo la modifica finale se una regola push per utente corrisponde a quel flag. Questa pagina è destinata agli operatori che ospitano autonomamente Matrix e vogliono installare tale regola per ogni account destinatario.

Se vuoi solo il comportamento di notifica standard di Matrix, usa `streaming: "partial"` o lascia lo streaming disattivato. Vedi [configurazione del canale Matrix](/it/channels/matrix#streaming-previews).

## Prerequisiti

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix di OpenClaw che invia la risposta
- usa il token di accesso dell'utente destinatario per le chiamate API seguenti
- fai corrispondere `sender` nella regola push all'MXID completo dell'utente bot
- l'account destinatario deve già avere pusher funzionanti: le regole di anteprima silenziosa funzionano solo quando la normale consegna push di Matrix è sana

## Passaggi

<Steps>
  <Step title="Configura le anteprime silenziose">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Ottieni il token di accesso del destinatario">
    Riutilizza un token di sessione client esistente quando possibile. Per crearne uno nuovo:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Verifica che esistano pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se non viene restituito alcun pusher, correggi la normale consegna push di Matrix per questo account prima di continuare.

  </Step>

  <Step title="Installa la regola push di override">
    OpenClaw contrassegna le modifiche di anteprima finalizzate solo testuali con `content["com.openclaw.finalized_preview"] = true`. Installa una regola che corrisponda a quel marker più all'MXID del bot come mittente:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Sostituisci prima di eseguire:

    - `https://matrix.example.org`: l'URL di base del tuo homeserver
    - `$USER_ACCESS_TOKEN`: il token di accesso dell'utente destinatario
    - `openclaw-finalized-preview-botname`: un ID regola univoco per bot e per destinatario (schema: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: l'MXID del tuo bot OpenClaw, non quello del destinatario

  </Step>

  <Step title="Verifica">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Poi testa una risposta in streaming. In modalità silenziosa, la stanza mostra un'anteprima bozza silenziosa e invia una notifica una volta terminato il blocco o il turno.

  </Step>
</Steps>

Per rimuovere la regola in seguito, esegui `DELETE` sullo stesso URL della regola con il token del destinatario.

## Note multi-bot

Le regole push sono indicizzate da `ruleId`: rieseguire `PUT` sullo stesso ID aggiorna una singola regola. Per più bot OpenClaw che notificano lo stesso destinatario, crea una regola per ciascun bot con una corrispondenza del mittente distinta.

Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non è necessario alcun parametro di ordinamento aggiuntivo. La regola influisce solo sulle modifiche di anteprima solo testuali che possono essere finalizzate sul posto; i fallback multimediali e i fallback di anteprima obsoleta usano la normale consegna di Matrix.

## Note sugli homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Non è richiesta alcuna modifica speciale a `homeserver.yaml`. Se le normali notifiche Matrix raggiungono già questo utente, il token del destinatario più la chiamata `pushrules` sopra sono il passaggio principale di configurazione.

    Se esegui Synapse dietro un reverse proxy o worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse. La consegna push è gestita dal processo principale o da `synapse.app.pusher` / dai worker pusher configurati: assicurati che siano sani.

    La regola usa la condizione di regola push `event_property_is` (MSC3758, regola push v1.10), aggiunta a Synapse nel 2023. Le versioni precedenti di Synapse accettano la chiamata `PUT pushrules/...` ma silenziosamente non fanno mai corrispondere la condizione: aggiorna Synapse se non arriva alcuna notifica su una modifica di anteprima finalizzata.

  </Accordion>

  <Accordion title="Tuwunel">
    Stesso flusso di Synapse; non è necessaria alcuna configurazione specifica di Tuwunel per il marker di anteprima finalizzata.

    Se le notifiche scompaiono mentre l'utente è attivo su un altro dispositivo, controlla se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione nella versione 1.4.2 (settembre 2025) e può sopprimere intenzionalmente i push verso altri dispositivi mentre un dispositivo è attivo.

  </Accordion>
</AccordionGroup>

## Correlati

- [Configurazione del canale Matrix](/it/channels/matrix)
- [Concetti di streaming](/it/concepts/streaming)
