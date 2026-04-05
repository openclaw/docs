---
read_when:
    - Modifica dei valori predefiniti della modalità elevata, delle allowlist o del comportamento dei comandi slash
    - Comprendere come gli agenti in sandbox possono accedere all'host
summary: 'Modalità exec elevata: esegui comandi fuori dalla sandbox da un agente in sandbox'
title: Modalità elevata
x-i18n:
    generated_at: "2026-04-05T14:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Modalità elevata

Quando un agente viene eseguito all'interno di una sandbox, i suoi comandi `exec` sono confinati
all'ambiente sandbox. La **modalità elevata** consente all'agente di uscire dalla sandbox ed eseguire comandi
all'esterno, con controlli di approvazione configurabili.

<Info>
  La modalità elevata cambia comportamento solo quando l'agente è **in sandbox**. Per
  gli agenti non in sandbox, `exec` viene già eseguito sull'host.
</Info>

## Direttive

Controlla la modalità elevata per sessione con i comandi slash:

| Direttiva       | Cosa fa                                                               |
| --------------- | --------------------------------------------------------------------- |
| `/elevated on`   | Esegue fuori dalla sandbox sul percorso host configurato, mantenendo le approvazioni |
| `/elevated ask`  | Uguale a `on` (alias)                                                 |
| `/elevated full` | Esegue fuori dalla sandbox sul percorso host configurato e salta le approvazioni |
| `/elevated off`  | Torna all'esecuzione confinata nella sandbox                          |

Disponibile anche come `/elev on|off|ask|full`.

Invia `/elevated` senza argomento per vedere il livello corrente.

## Come funziona

<Steps>
  <Step title="Controllare la disponibilità">
    La modalità elevata deve essere abilitata nella configurazione e il mittente deve essere nella allowlist:

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

    Oppure usala inline (si applica solo a quel messaggio):

    ```
    /elevated on esegui lo script di deploy
    ```

  </Step>

  <Step title="I comandi vengono eseguiti fuori dalla sandbox">
    Con la modalità elevata attiva, le chiamate `exec` escono dalla sandbox. L'host effettivo è
    `gateway` per impostazione predefinita, oppure `node` quando il target exec configurato/di sessione è
    `node`. In modalità `full`, le approvazioni exec vengono saltate. In modalità `on`/`ask`,
    continuano ad applicarsi le regole di approvazione configurate.
  </Step>
</Steps>

## Ordine di risoluzione

1. **Direttiva inline** nel messaggio (si applica solo a quel messaggio)
2. **Override di sessione** (impostato inviando un messaggio contenente solo una direttiva)
3. **Valore predefinito globale** (`agents.defaults.elevatedDefault` nella configurazione)

## Disponibilità e allowlist

- **Controllo globale**: `tools.elevated.enabled` (deve essere `true`)
- **Allowlist del mittente**: `tools.elevated.allowFrom` con elenchi per canale
- **Controllo per agente**: `agents.list[].tools.elevated.enabled` (può solo restringere ulteriormente)
- **Allowlist per agente**: `agents.list[].tools.elevated.allowFrom` (il mittente deve corrispondere sia a quella globale sia a quella per agente)
- **Fallback Discord**: se `tools.elevated.allowFrom.discord` viene omesso, come fallback viene usato `channels.discord.allowFrom`
- **Tutti i controlli devono essere superati**; altrimenti la modalità elevata è considerata non disponibile

Formati delle voci allowlist:

| Prefisso                | Corrisponde a                    |
| ----------------------- | -------------------------------- |
| (nessuno)               | ID mittente, E.164 o campo From  |
| `name:`                 | Nome visualizzato del mittente   |
| `username:`             | Username del mittente            |
| `tag:`                  | Tag del mittente                 |
| `id:`, `from:`, `e164:` | Targeting esplicito dell'identità |

## Cosa la modalità elevata non controlla

- **Policy dello strumento**: se `exec` è negato dalla policy dello strumento, la modalità elevata non può aggirarla
- **Policy di selezione dell'host**: la modalità elevata non trasforma `auto` in un override libero tra host. Usa le regole del target exec configurato/di sessione, scegliendo `node` solo quando il target è già `node`.
- **Separata da `/exec`**: la direttiva `/exec` regola i valori predefiniti di `exec` per sessione per i mittenti autorizzati e non richiede la modalità elevata

## Correlati

- [Strumento exec](/tools/exec) — esecuzione di comandi shell
- [Approvazioni exec](/tools/exec-approvals) — sistema di approvazione e allowlist
- [Sandboxing](/it/gateway/sandboxing) — configurazione sandbox
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
