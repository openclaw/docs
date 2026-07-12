---
read_when:
    - Regolazione delle impostazioni predefinite della modalità con privilegi elevati, delle liste di elementi consentiti o del comportamento dei comandi slash
    - Comprendere come gli agenti in sandbox possono accedere all'host
summary: 'Modalità di esecuzione con privilegi elevati: esegui comandi all''esterno della sandbox da un agente in sandbox'
title: Modalità con privilegi elevati
x-i18n:
    generated_at: "2026-07-12T07:32:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Quando un agente viene eseguito all'interno di una sandbox, i suoi comandi `exec` sono confinati all'ambiente della sandbox. La **modalità elevata** consente invece all'agente di uscirne ed eseguire comandi al di fuori della sandbox, con controlli di approvazione configurabili.

<Info>
  La modalità elevata modifica il comportamento solo quando l'agente è **in una sandbox**. Per gli agenti senza sandbox, `exec` viene già eseguito sull'host.
</Info>

## Direttive

Controlla la modalità elevata per ogni sessione con i comandi slash:

| Direttiva        | Funzione                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Esegue al di fuori della sandbox nel percorso dell'host configurato, mantenendo le approvazioni                                                      |
| `/elevated ask`  | Equivale a `on` (alias)                                                                                                                             |
| `/elevated full` | Esegue al di fuori della sandbox nel percorso dell'host configurato e ignora le approvazioni se la politica di approvazione per modalità/host è già permissiva |
| `/elevated off`  | Ripristina l'esecuzione confinata alla sandbox                                                                                                      |

Disponibile anche come `/elev on|off|ask|full`.

Invia `/elevated` senza argomenti per visualizzare il livello corrente.

## Funzionamento

<Steps>
  <Step title="Verificare la disponibilità">
    La modalità elevata deve essere abilitata nella configurazione e il mittente deve essere nell'elenco degli elementi consentiti:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Impostare il livello">
    Invia un messaggio contenente solo la direttiva per impostare il valore predefinito della sessione:

    ```
    /elevated full
    ```

    In alternativa, usala all'interno del messaggio (si applica solo a quel messaggio):

    ```
    /elevated on esegui lo script di distribuzione
    ```

  </Step>

  <Step title="I comandi vengono eseguiti al di fuori della sandbox">
    Quando la modalità elevata è attiva, le chiamate `exec` escono dalla sandbox. Per impostazione predefinita, l'host effettivo è
    `gateway`, oppure `node` quando la destinazione `exec` configurata o della sessione è
    `node`. In modalità `full`, le approvazioni di `exec` vengono ignorate quando la politica di approvazione
    risolta per la modalità/l'host è già completamente permissiva (sicurezza `full`,
    richiesta `off`); in caso contrario, continua ad applicarsi la normale politica di approvazione. In modalità
    `on`/`ask`, si applicano sempre le regole di approvazione configurate.
  </Step>
</Steps>

## Ordine di risoluzione

1. **Direttiva incorporata** nel messaggio (si applica solo a quel messaggio)
2. **Sostituzione della sessione** (impostata inviando un messaggio contenente solo la direttiva)
3. **Valore predefinito globale** (`agents.defaults.elevatedDefault` nella configurazione)

## Disponibilità ed elenchi degli elementi consentiti

- **Controllo globale**: `tools.elevated.enabled` (deve essere `true`)
- **Elenco dei mittenti consentiti**: `tools.elevated.allowFrom` con elenchi per canale
- **Controllo per agente**: `agents.list[].tools.elevated.enabled` (può solo applicare ulteriori restrizioni; sia il controllo globale sia quello per agente devono essere `true`)
- **Elenco consentito per agente**: `agents.list[].tools.elevated.allowFrom` (il mittente deve corrispondere sia all'elenco globale sia a quello per agente)
- **Elenco consentito di riserva fornito dal canale**: i Plugin del canale possono facoltativamente fornire un elenco consentito di riserva tramite un hook dell'adattatore SDK, utilizzato quando `tools.elevated.allowFrom.<provider>` non è configurato. Attualmente nessun canale incluso implementa questo hook, quindi in pratica ogni provider necessita oggi di una voce esplicita `tools.elevated.allowFrom.<provider>`.
- **Tutti i controlli devono essere superati**; in caso contrario, la modalità elevata viene considerata non disponibile

Formati delle voci dell'elenco consentito:

| Prefisso                | Corrispondenza                              |
| ----------------------- | ------------------------------------------- |
| (nessuno)               | ID mittente, E.164 o campo From             |
| `name:`                 | Nome visualizzato del mittente              |
| `username:`             | Nome utente del mittente                    |
| `tag:`                  | Tag del mittente                            |
| `id:`, `from:`, `e164:` | Selezione esplicita dell'identità           |

## Cosa non controlla la modalità elevata

- **Politica degli strumenti**: se `exec` è negato dalla politica degli strumenti, la modalità elevata non può ignorarla.
- **Politica di selezione dell'host**: la modalità elevata non trasforma `auto` in una sostituzione libera tra host. Utilizza le regole configurate o della sessione per la destinazione `exec`, scegliendo `node` solo quando la destinazione è già `node`.
- **Separata da `/exec`**: la direttiva `/exec` regola i valori predefiniti di `exec` per sessione (host, sicurezza, richiesta, node) per i mittenti autorizzati e non richiede la modalità elevata.

<Note>
  Il comando chat bash (prefisso `!`; alias `/bash`) dispone di un controllo separato che richiede l'abilitazione di `tools.elevated` oltre al proprio flag `tools.bash.enabled`. La disabilitazione della modalità elevata impedisce anche l'uso dei comandi shell `!`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Esecuzione dei comandi shell dall'agente.
  </Card>
  <Card title="Approvazioni Exec" href="/it/tools/exec-approvals" icon="shield">
    Sistema di approvazione e di elenchi consentiti per `exec`.
  </Card>
  <Card title="Uso della sandbox" href="/it/gateway/sandboxing" icon="box">
    Configurazione della sandbox a livello di Gateway.
  </Card>
  <Card title="Sandbox, politica degli strumenti e modalità elevata" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Come si combinano i tre controlli durante una chiamata a uno strumento.
  </Card>
</CardGroup>
