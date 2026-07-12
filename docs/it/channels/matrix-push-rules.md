---
read_when:
    - Configurazione dello streaming silenzioso di Matrix per Synapse o Tuwunel in self-hosting
    - Gli utenti vogliono ricevere notifiche solo al completamento dei blocchi, non a ogni modifica dell'anteprima
summary: Regole push di Matrix per destinatario per modifiche silenziose alle anteprime finalizzate
title: Regole di push di Matrix per anteprime silenziose
x-i18n:
    generated_at: "2026-07-12T06:50:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Quando `channels.matrix.streaming` è impostato su `"quiet"`, OpenClaw trasmette la risposta modificando sul posto un singolo evento di anteprima. Le anteprime vengono inviate come eventi `m.notice` che non generano notifiche e la modifica definitiva viene contrassegnata con `content["com.openclaw.finalized_preview"] = true`. I client Matrix notificano tale modifica definitiva solo se una regola push specifica per utente corrisponde al contrassegno. Questa pagina è destinata agli operatori che ospitano autonomamente Matrix e desiderano installare tale regola per ciascun account destinatario.

`streaming: "progress"` finalizza le proprie bozze tramite lo stesso percorso, quindi la stessa regola si attiva anche per le modifiche definitive in modalità di avanzamento.

Se desideri soltanto il comportamento standard delle notifiche di Matrix, usa `streaming: "partial"` oppure disattiva lo streaming. Consulta [Configurazione del canale Matrix](/it/channels/matrix#streaming-previews).

## Prerequisiti

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix di OpenClaw che invia la risposta
- usa il token di accesso dell'utente destinatario per le chiamate API riportate di seguito
- nella regola push, confronta `sender` con l'MXID completo dell'utente bot
- l'account destinatario deve già disporre di pusher funzionanti; le regole per le anteprime silenziose funzionano solo quando la normale consegna push di Matrix è operativa

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
    Quando possibile, riutilizza il token di una sessione client esistente. Per generarne uno nuovo:

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
    Installa una regola che corrisponda al contrassegno dell'anteprima definitiva e all'MXID del bot come mittente:

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

    Prima dell'esecuzione, sostituisci:

    - `https://matrix.example.org`: l'URL di base del tuo homeserver
    - `$USER_ACCESS_TOKEN`: il token di accesso dell'utente destinatario
    - `openclaw-finalized-preview-botname`: un ID regola univoco per ogni bot e destinatario (schema: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: l'MXID del tuo bot OpenClaw, non quello del destinatario

  </Step>

  <Step title="Verifica">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Quindi prova una risposta trasmessa in streaming. In modalità silenziosa, la stanza mostra un'anteprima silenziosa della bozza e invia una notifica quando il blocco o il turno termina.

  </Step>
</Steps>

Per rimuovere successivamente la regola, esegui `DELETE` sullo stesso URL della regola usando il token del destinatario.

## Note per configurazioni con più bot

Le regole push sono identificate da `ruleId`: rieseguire `PUT` sullo stesso ID aggiorna una singola regola. Se più bot OpenClaw devono inviare notifiche allo stesso destinatario, crea una regola per ogni bot con una corrispondenza distinta per il mittente.

Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite del server, quindi non è necessario alcun parametro di ordinamento aggiuntivo. La regola riguarda soltanto le modifiche delle anteprime di solo testo che possono essere finalizzate sul posto; le risposte multimediali, i fallback per anteprime obsolete e i testi definitivi che attiverebbero le menzioni di Matrix vengono invece consegnati come normali messaggi con notifica.

## Note sull'homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Non è necessaria alcuna modifica specifica a `homeserver.yaml`. Se le normali notifiche di Matrix raggiungono già questo utente, il token del destinatario e la chiamata `pushrules` riportata sopra costituiscono il passaggio principale della configurazione.

    Se esegui Synapse dietro un proxy inverso o con processi worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse. La consegna push è gestita dal processo principale oppure da `synapse.app.pusher` o dai worker pusher configurati: assicurati che siano operativi.

    La regola utilizza la condizione `event_property_is` delle regole push (MSC3758, regole push v1.10), aggiunta a Synapse nel 2023. Le versioni meno recenti di Synapse accettano la chiamata `PUT pushrules/...`, ma la condizione non corrisponde mai e non viene segnalato alcun errore: aggiorna Synapse se non arriva alcuna notifica per una modifica definitiva dell'anteprima.

  </Accordion>

  <Accordion title="Tuwunel">
    Il flusso è identico a quello di Synapse; non è necessaria alcuna configurazione specifica di Tuwunel per il contrassegno dell'anteprima definitiva.

    Se le notifiche scompaiono mentre l'utente è attivo su un altro dispositivo, verifica se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione nella versione 1.4.2 (settembre 2025) e può sopprimere intenzionalmente le notifiche push verso gli altri dispositivi mentre un dispositivo è attivo.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Configurazione del canale Matrix](/it/channels/matrix)
- [Concetti dello streaming](/it/concepts/streaming)
