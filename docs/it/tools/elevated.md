---
read_when:
    - Regolazione delle impostazioni predefinite della modalità elevata, degli elenchi consentiti o del comportamento dei comandi slash
    - Comprendere come gli agenti in sandbox possono accedere all'host
summary: 'Modalità exec con privilegi elevati: esegui comandi al di fuori della sandbox da un agente in sandbox'
title: Modalità elevata
x-i18n:
    generated_at: "2026-05-06T09:11:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

Quando un agent viene eseguito dentro una sandbox, i suoi comandi `exec` sono confinati
all'ambiente sandbox. La **modalità elevata** consente all'agent di uscire ed eseguire invece comandi
fuori dalla sandbox, con gate di approvazione configurabili.

<Info>
  La modalità elevata cambia comportamento solo quando l'agent è **in sandbox**. Per
  gli agent non in sandbox, exec viene già eseguito sull'host.
</Info>

## Direttive

Controlla la modalità elevata per sessione con comandi slash:

| Direttiva        | Cosa fa                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Esegue fuori dalla sandbox sul percorso host configurato, mantenendo le approvazioni    |
| `/elevated ask`  | Uguale a `on` (alias)                                                   |
| `/elevated full` | Esegue fuori dalla sandbox sul percorso host configurato e salta le approvazioni |
| `/elevated off`  | Torna all'esecuzione confinata nella sandbox                                   |

Disponibile anche come `/elev on|off|ask|full`.

Invia `/elevated` senza argomento per vedere il livello corrente.

## Come funziona

<Steps>
  <Step title="Verifica la disponibilità">
    La modalità elevata deve essere abilitata nella configurazione e il mittente deve essere nell'allowlist:

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

  <Step title="Imposta il livello">
    Invia un messaggio contenente solo la direttiva per impostare il valore predefinito della sessione:

    ```
    /elevated full
    ```

    Oppure usala inline (si applica solo a quel messaggio):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="I comandi vengono eseguiti fuori dalla sandbox">
    Con la modalità elevata attiva, le chiamate `exec` escono dalla sandbox. L'host effettivo è
    `gateway` per impostazione predefinita, oppure `node` quando la destinazione exec configurata/di sessione è
    `node`. In modalità `full`, le approvazioni exec vengono saltate. In modalità `on`/`ask`,
    le regole di approvazione configurate continuano ad applicarsi.
  </Step>
</Steps>

## Ordine di risoluzione

1. **Direttiva inline** nel messaggio (si applica solo a quel messaggio)
2. **Override di sessione** (impostato inviando un messaggio contenente solo la direttiva)
3. **Predefinito globale** (`agents.defaults.elevatedDefault` nella configurazione)

## Disponibilità e allowlist

- **Gate globale**: `tools.elevated.enabled` (deve essere `true`)
- **Allowlist mittente**: `tools.elevated.allowFrom` con elenchi per canale
- **Gate per agent**: `agents.list[].tools.elevated.enabled` (può solo restringere ulteriormente)
- **Allowlist per agent**: `agents.list[].tools.elevated.allowFrom` (il mittente deve corrispondere sia a quella globale sia a quella per agent)
- **Fallback Discord**: se `tools.elevated.allowFrom.discord` viene omesso, `channels.discord.allowFrom` viene usato come fallback
- **Tutti i gate devono passare**; altrimenti la modalità elevata viene trattata come non disponibile

Formati delle voci allowlist:

| Prefisso                  | Corrisponde a                         |
| ----------------------- | ------------------------------- |
| (nessuno)                  | ID mittente, E.164 o campo From |
| `name:`                 | Nome visualizzato del mittente             |
| `username:`             | Nome utente del mittente                 |
| `tag:`                  | Tag del mittente                      |
| `id:`, `from:`, `e164:` | Targeting esplicito dell'identità     |

## Cosa non controlla la modalità elevata

- **Policy degli strumenti**: se `exec` viene negato dalla policy degli strumenti, la modalità elevata non può ignorarla.
- **Policy di selezione dell'host**: la modalità elevata non trasforma `auto` in un override libero tra host. Usa le regole della destinazione exec configurata/di sessione, scegliendo `node` solo quando la destinazione è già `node`.
- **Separata da `/exec`**: la direttiva `/exec` regola i valori predefiniti exec per sessione per i mittenti autorizzati e non richiede la modalità elevata.

<Note>
  Il comando chat bash (prefisso `!`; alias `/bash`) è un gate separato che richiede che `tools.elevated` sia abilitato oltre al proprio flag `tools.bash.enabled`. Disabilitare la modalità elevata blocca anche i comandi shell `!`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento exec" href="/it/tools/exec" icon="terminal">
    Esecuzione di comandi shell dall'agent.
  </Card>
  <Card title="Approvazioni exec" href="/it/tools/exec-approvals" icon="shield">
    Sistema di approvazioni e allowlist per `exec`.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Configurazione della sandbox a livello Gateway.
  </Card>
  <Card title="Sandbox vs policy degli strumenti vs modalità elevata" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Come i tre gate si combinano durante una chiamata strumento.
  </Card>
</CardGroup>
