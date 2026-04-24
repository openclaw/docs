---
read_when:
    - Configurazione dello streaming silenzioso di Matrix per Synapse o Tuwunel self-hosted
    - Gli utenti vogliono notifiche solo sui blocchi completati, non a ogni modifica dell'anteprima
summary: Regole push di Matrix per destinatario per modifiche di anteprima finalizzate silenziose
title: Regole push di Matrix per anteprime silenziose
x-i18n:
    generated_at: "2026-04-24T08:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Quando `channels.matrix.streaming` è `"quiet"`, OpenClaw modifica sul posto un singolo evento di anteprima e contrassegna la modifica finalizzata con un flag personalizzato nel contenuto. I client Matrix inviano una notifica sulla modifica finale solo se una regola push per utente corrisponde a quel flag. Questa pagina è destinata agli operatori che self-hostano Matrix e vogliono installare quella regola per ogni account destinatario.

Se vuoi solo il comportamento standard delle notifiche di Matrix, usa `streaming: "partial"` oppure lascia lo streaming disattivato. Vedi [Configurazione del canale Matrix](/it/channels/matrix#streaming-previews).

## Prerequisiti

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix OpenClaw che invia la risposta
- usa il token di accesso dell'utente destinatario per le chiamate API qui sotto
- fai corrispondere `sender` nella regola push all'MXID completo dell'utente bot
- l'account destinatario deve già avere pusher funzionanti — le regole di anteprima silenziosa funzionano solo quando il normale recapito push di Matrix è in salute

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
    Riutilizza, quando possibile, il token di una sessione client esistente. Per crearne uno nuovo:

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

  <Step title="Verifica che esistano dei pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se non viene restituito alcun pusher, risolvi il normale recapito push di Matrix per questo account prima di continuare.

  </Step>

  <Step title="Installa la regola push di override">
    OpenClaw contrassegna le modifiche finalizzate delle anteprime solo testuali con `content["com.openclaw.finalized_preview"] = true`. Installa una regola che corrisponda a quel marcatore più l'MXID del bot come mittente:

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
    - `openclaw-finalized-preview-botname`: un ID regola univoco per bot per destinatario (modello: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: l'MXID del tuo bot OpenClaw, non quello del destinatario

  </Step>

  <Step title="Verifica">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Poi testa una risposta in streaming. In modalità quiet la stanza mostra una bozza di anteprima silenziosa e invia una notifica una volta terminato il blocco o il turno.

  </Step>
</Steps>

Per rimuovere la regola in seguito, usa `DELETE` sullo stesso URL della regola con il token del destinatario.

## Note su più bot

Le regole push sono identificate da `ruleId`: rieseguire `PUT` sullo stesso ID aggiorna una singola regola. Per più bot OpenClaw che notificano lo stesso destinatario, crea una regola per ogni bot con una corrispondenza del mittente distinta.

Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non serve alcun parametro di ordinamento aggiuntivo. La regola influisce solo sulle modifiche delle anteprime solo testuali che possono essere finalizzate sul posto; i fallback per i media e i fallback per anteprime stale usano il normale recapito Matrix.

## Note sull'homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Non è richiesta alcuna modifica speciale a `homeserver.yaml`. Se le normali notifiche Matrix raggiungono già questo utente, il token del destinatario + la chiamata `pushrules` qui sopra sono il passaggio principale della configurazione.

    Se esegui Synapse dietro un reverse proxy o con worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse. Il recapito push è gestito dal processo principale o da `synapse.app.pusher` / worker pusher configurati — assicurati che siano in salute.

  </Accordion>

  <Accordion title="Tuwunel">
    Stesso flusso di Synapse; non è necessaria alcuna configurazione specifica di Tuwunel per il marcatore di anteprima finalizzata.

    Se le notifiche scompaiono mentre l'utente è attivo su un altro dispositivo, controlla se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione nella versione 1.4.2 (settembre 2025) e può sopprimere intenzionalmente le notifiche push verso altri dispositivi mentre un dispositivo è attivo.

  </Accordion>
</AccordionGroup>

## Correlati

- [Configurazione del canale Matrix](/it/channels/matrix)
- [Concetti di streaming](/it/concepts/streaming)
