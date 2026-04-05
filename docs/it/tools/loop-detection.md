---
read_when:
    - Un utente segnala che gli agenti restano bloccati ripetendo chiamate agli strumenti
    - Devi regolare la protezione contro le chiamate ripetitive
    - Stai modificando le policy di runtime/strumenti dell'agente
summary: Come abilitare e regolare i guardrail che rilevano i loop ripetitivi di chiamate agli strumenti
title: Rilevamento dei loop degli strumenti
x-i18n:
    generated_at: "2026-04-05T14:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Rilevamento dei loop degli strumenti

OpenClaw può impedire agli agenti di restare bloccati in schemi ripetuti di chiamate agli strumenti.
La protezione è **disabilitata per impostazione predefinita**.

Abilitala solo dove serve, perché con impostazioni rigide può bloccare chiamate ripetute legittime.

## Perché esiste

- Rilevare sequenze ripetitive che non fanno progressi.
- Rilevare loop ad alta frequenza senza risultati (stesso strumento, stessi input, errori ripetuti).
- Rilevare specifici pattern di chiamate ripetute per strumenti di polling noti.

## Blocco di configurazione

Valori predefiniti globali:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Override per agente (facoltativo):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportamento dei campi

- `enabled`: interruttore principale. `false` significa che non viene eseguito alcun rilevamento dei loop.
- `historySize`: numero di chiamate recenti agli strumenti mantenute per l'analisi.
- `warningThreshold`: soglia prima di classificare un pattern come solo avviso.
- `criticalThreshold`: soglia per bloccare i pattern di loop ripetitivi.
- `globalCircuitBreakerThreshold`: soglia globale dell'interruttore di sicurezza per assenza di progressi.
- `detectors.genericRepeat`: rileva pattern ripetuti stesso strumento + stessi parametri.
- `detectors.knownPollNoProgress`: rileva pattern simili al polling noti senza cambiamento di stato.
- `detectors.pingPong`: rileva pattern alternati di tipo ping-pong.

## Configurazione consigliata

- Inizia con `enabled: true`, lasciando invariati i valori predefiniti.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - aumenta `warningThreshold` e/o `criticalThreshold`
  - (facoltativamente) aumenta `globalCircuitBreakerThreshold`
  - disabilita solo il detector che causa problemi
  - riduci `historySize` per un contesto storico meno rigido

## Log e comportamento previsto

Quando viene rilevato un loop, OpenClaw segnala un evento di loop e blocca o attenua il ciclo successivo dello strumento a seconda della gravità.
Questo protegge gli utenti da un consumo incontrollato di token e da blocchi, preservando al tempo stesso il normale accesso agli strumenti.

- Preferisci prima avvisi e soppressione temporanea.
- Escala solo quando si accumulano prove ripetute.

## Note

- `tools.loopDetection` viene unito con gli override a livello agente.
- La configurazione per agente sostituisce completamente o estende i valori globali.
- Se non esiste alcuna configurazione, i guardrail restano disattivati.
