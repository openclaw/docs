---
read_when:
    - Configurazione dello streaming silenzioso di Matrix per Synapse o Tuwunel self-hosted
    - Gli utenti vogliono ricevere notifiche solo al completamento dei blocchi, non a ogni modifica dell'anteprima
summary: Regole push di Matrix per destinatario per modifiche silenziose delle anteprime finalizzate
title: Regole push di Matrix per anteprime discrete
x-i18n:
    generated_at: "2026-07-16T14:00:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Quando `channels.matrix.streaming.mode` è `"quiet"`, OpenClaw trasmette la risposta modificando sul posto un singolo evento di anteprima. Le anteprime vengono inviate come eventi `m.notice` che non generano notifiche e la modifica finalizzata viene contrassegnata con `content["com.openclaw.finalized_preview"] = true`. I client Matrix generano una notifica per la modifica finale solo se una regola push per utente corrisponde al marcatore. Questa pagina è destinata agli operatori che ospitano autonomamente Matrix e desiderano installare tale regola per ciascun account destinatario.

`streaming.mode: "progress"` finalizza le proprie bozze tramite lo stesso percorso, quindi la stessa regola viene attivata anche per le modifiche finalizzate in modalità avanzamento.

Se si desidera soltanto il comportamento di notifica standard di Matrix, usare `streaming.mode: "partial"` oppure lasciare disattivato lo streaming. Consultare [Configurazione del canale Matrix](/it/channels/matrix#streaming-previews).

## Prerequisiti

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix di OpenClaw che invia la risposta
- usare il token di accesso dell'utente destinatario per le chiamate API riportate di seguito
- far corrispondere `sender` nella regola push all'MXID completo dell'utente bot
- l'account destinatario deve già disporre di pusher funzionanti; le regole di anteprima silenziosa funzionano solo quando la normale distribuzione push di Matrix è operativa

## Passaggi

<Steps>
  <Step title="Configurare le anteprime silenziose">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Ottenere il token di accesso del destinatario">
    Se possibile, riutilizzare il token di una sessione client esistente. Per generarne uno nuovo:

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

  <Step title="Verificare che esistano pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se non viene restituito alcun pusher, correggere la normale distribuzione push di Matrix per questo account prima di continuare.

  </Step>

  <Step title="Installare la regola push di override">
    Installare una regola che verifichi la corrispondenza del marcatore dell'anteprima finalizzata e dell'MXID del bot come mittente:

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

    Sostituire prima dell'esecuzione:

    - `https://matrix.example.org`: l'URL di base dell'homeserver
    - `$USER_ACCESS_TOKEN`: il token di accesso dell'utente destinatario
    - `openclaw-finalized-preview-botname`: un ID regola univoco per ogni bot e destinatario (modello: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: l'MXID del bot OpenClaw, non quello del destinatario

  </Step>

  <Step title="Verificare">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Quindi provare una risposta trasmessa in streaming. In modalità silenziosa, la stanza mostra un'anteprima silenziosa della bozza e genera una notifica al termine del blocco o del turno.

  </Step>
</Steps>

Per rimuovere la regola in seguito, eseguire `DELETE` sullo stesso URL della regola con il token del destinatario.

## Note sull'uso di più bot

Le regole push sono identificate da `ruleId`: rieseguire `PUT` sullo stesso ID aggiorna una singola regola. Se più bot OpenClaw inviano notifiche allo stesso destinatario, creare una regola per ciascun bot con una corrispondenza del mittente distinta.

Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite del server, quindi non è necessario alcun parametro di ordinamento aggiuntivo. La regola interessa solo le modifiche delle anteprime di solo testo che possono essere finalizzate sul posto; le risposte multimediali, i fallback per anteprime obsolete e i testi finali che attiverebbero le menzioni Matrix vengono invece distribuiti come normali messaggi che generano notifiche.

## Note sull'homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Non è richiesta alcuna modifica speciale a `homeserver.yaml`. Se le normali notifiche Matrix raggiungono già questo utente, il token del destinatario e la chiamata `pushrules` riportata sopra costituiscono il passaggio di configurazione principale.

    Se Synapse viene eseguito dietro un proxy inverso o dei worker, assicurarsi che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse. La distribuzione push viene gestita dal processo principale oppure da `synapse.app.pusher` / dai worker pusher configurati: assicurarsi che siano operativi.

    La regola usa la condizione della regola push `event_property_is` (MSC3758, regola push v1.10), aggiunta a Synapse nel 2023. Le versioni precedenti di Synapse accettano la chiamata `PUT pushrules/...`, ma la condizione non corrisponde mai e non viene segnalato alcun errore: aggiornare Synapse se non arriva alcuna notifica per una modifica di anteprima finalizzata.

  </Accordion>

  <Accordion title="Tuwunel">
    Il flusso è identico a quello di Synapse; non è necessaria alcuna configurazione specifica per Tuwunel relativa al marcatore dell'anteprima finalizzata.

    Se le notifiche scompaiono mentre l'utente è attivo su un altro dispositivo, verificare se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione nella versione 1.4.2 (settembre 2025) e può sopprimere intenzionalmente le notifiche push sugli altri dispositivi mentre un dispositivo è attivo.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Configurazione del canale Matrix](/it/channels/matrix)
- [Concetti dello streaming](/it/concepts/streaming)
