---
read_when:
    - |-
      Regolare i valori predefiniti della modalità elevata, le allowlist o il comportamento dei comandi slashуҷ to=final code```
      Regolare i valori predefiniti della modalità elevata, le allowlist o il comportamento dei comandi slash
      ```
    - |-
      Capire come gli agenti in sandbox possono accedere all’host分分彩 to=final code```
      Capire come gli agenti in sandbox possono accedere all’host
      ```
summary: 'Modalità exec elevata: eseguire comandi fuori dalla sandbox da un agente in sandbox'
title: Modalità elevata
x-i18n:
    generated_at: "2026-04-24T09:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Quando un agente viene eseguito dentro una sandbox, i suoi comandi `exec` sono confinati all’ambiente
sandbox. La **modalità elevata** permette all’agente di uscire dalla sandbox ed eseguire invece i comandi
all’esterno, con gate di approvazione configurabili.

<Info>
  La modalità elevata cambia comportamento solo quando l’agente è **in sandbox**. Per
  gli agenti non in sandbox, exec viene già eseguito sull’host.
</Info>

## Direttive

Controlla la modalità elevata per sessione con comandi slash:

| Direttiva       | Cosa fa                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `/elevated on`  | Esegue fuori dalla sandbox sul percorso host configurato, mantenendo le approvazioni |
| `/elevated ask` | Come `on` (alias)                                                      |
| `/elevated full`| Esegue fuori dalla sandbox sul percorso host configurato e salta le approvazioni |
| `/elevated off` | Torna all’esecuzione confinata nella sandbox                           |

Disponibile anche come `/elev on|off|ask|full`.

Invia `/elevated` senza argomenti per vedere il livello corrente.

## Come funziona

<Steps>
  <Step title="Controlla la disponibilità">
    Elevated deve essere abilitato nella configurazione e il mittente deve essere nella allowlist:

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

    Oppure usalo inline (si applica solo a quel messaggio):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="I comandi vengono eseguiti fuori dalla sandbox">
    Con elevated attivo, le chiamate `exec` escono dalla sandbox. L’host effettivo è
    `gateway` per impostazione predefinita, oppure `node` quando la destinazione exec configurata/sessione è
    `node`. In modalità `full`, le approvazioni exec vengono saltate. In modalità `on`/`ask`,
    continuano ad applicarsi le regole di approvazione configurate.
  </Step>
</Steps>

## Ordine di risoluzione

1. **Direttiva inline** nel messaggio (si applica solo a quel messaggio)
2. **Override di sessione** (impostato inviando un messaggio contenente solo una direttiva)
3. **Predefinito globale** (`agents.defaults.elevatedDefault` nella configurazione)

## Disponibilità e allowlist

- **Gate globale**: `tools.elevated.enabled` (deve essere `true`)
- **Allowlist del mittente**: `tools.elevated.allowFrom` con elenchi per canale
- **Gate per agente**: `agents.list[].tools.elevated.enabled` (può solo restringere ulteriormente)
- **Allowlist per agente**: `agents.list[].tools.elevated.allowFrom` (il mittente deve corrispondere sia a quella globale sia a quella per agente)
- **Fallback Discord**: se `tools.elevated.allowFrom.discord` è omesso, `channels.discord.allowFrom` viene usato come fallback
- **Tutti i gate devono essere superati**; altrimenti elevated viene trattato come non disponibile

Formati delle voci di allowlist:

| Prefisso                | Corrisponde a                    |
| ----------------------- | -------------------------------- |
| (nessuno)               | Sender ID, E.164 oppure campo From |
| `name:`                 | Nome visualizzato del mittente   |
| `username:`             | Username del mittente            |
| `tag:`                  | Tag del mittente                 |
| `id:`, `from:`, `e164:` | Targeting esplicito dell’identità |

## Cosa elevated non controlla

- **Policy degli strumenti**: se `exec` è negato dalla policy degli strumenti, elevated non può sostituirla
- **Policy di selezione dell’host**: elevated non trasforma `auto` in un override libero tra host. Usa le regole della destinazione exec configurata/sessione, scegliendo `node` solo quando la destinazione è già `node`.
- **Separato da `/exec`**: la direttiva `/exec` regola i valori predefiniti exec per sessione per mittenti autorizzati e non richiede la modalità elevata

## Correlati

- [Strumento Exec](/it/tools/exec) — esecuzione di comandi shell
- [Approvazioni Exec](/it/tools/exec-approvals) — sistema di approvazione e allowlist
- [Sandboxing](/it/gateway/sandboxing) — configurazione della sandbox
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
