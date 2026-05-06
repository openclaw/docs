---
read_when:
    - Configurazione di Zalo Personal per OpenClaw
    - Debug del flusso di accesso o dei messaggi di Zalo Personal
summary: Supporto per account personale Zalo tramite zca-js nativo (accesso con codice QR), funzionalità e configurazione
title: Zalo personale
x-i18n:
    generated_at: "2026-05-06T17:52:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Stato: sperimentale. Questa integrazione automatizza un **account Zalo personale** tramite `zca-js` nativo all'interno di OpenClaw.

<Warning>
Questa è un'integrazione non ufficiale e può causare la sospensione o il ban dell'account. Usala a tuo rischio.
</Warning>

## Plugin integrato

Zalo Personal viene distribuito come Plugin integrato nelle versioni attuali di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build meno recente o un'installazione personalizzata che esclude Zalo Personal,
installa direttamente il pacchetto npm:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Versione fissata: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oppure da un checkout dei sorgenti: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo Personal sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Accedi (QR, sulla macchina Gateway):
   - `openclaw channels login --channel zalouser`
   - Scansiona il codice QR con l'app mobile Zalo.
3. Abilita il canale:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Riavvia il Gateway (oppure completa la configurazione).
5. L'accesso DM usa come impostazione predefinita l'associazione; approva il codice di associazione al primo contatto.

## Che cos'è

- Viene eseguito interamente nello stesso processo tramite `zca-js`.
- Usa listener di eventi nativi per ricevere i messaggi in ingresso.
- Invia risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso con "account personale" in cui l'API Zalo Bot non è disponibile.

## Nomi

L'id del canale è `zalouser` per rendere esplicito che automatizza un **account utente Zalo personale** (non ufficiale). Manteniamo `zalo` riservato per una potenziale futura integrazione ufficiale dell'API Zalo.

## Trovare gli ID (directory)

Usa la CLI della directory per individuare peer/gruppi e i relativi ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limiti

- Il testo in uscita viene suddiviso in blocchi di circa 2000 caratteri (limiti del client Zalo).
- Lo streaming è bloccato per impostazione predefinita.

## Controllo degli accessi (DM)

`channels.zalouser.dmPolicy` supporta: `pairing | allowlist | open | disabled` (predefinito: `pairing`).

`channels.zalouser.allowFrom` deve usare ID utente Zalo stabili. Durante la configurazione interattiva, i nomi inseriti possono essere risolti in ID usando la ricerca contatti in-process del Plugin.

Se nella configurazione rimane un nome grezzo, all'avvio viene risolto solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato. Senza questo consenso esplicito, i controlli runtime del mittente sono basati solo su ID e i nomi grezzi vengono ignorati per l'autorizzazione.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (opzionale)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- Limita a una allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi devono essere ID gruppo stabili; i nomi vengono risolti in ID all'avvio solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può richiedere le allowlist dei gruppi.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti nelle allowlist in ID e registra la mappatura solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato.
- La corrispondenza della allowlist dei gruppi è basata solo su ID per impostazione predefinita. I nomi non risolti vengono ignorati per l'autenticazione a meno che `channels.zalouser.dangerouslyAllowNameMatching: true` non sia abilitato.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la risoluzione mutabile dei nomi all'avvio e la corrispondenza runtime dei nomi gruppo.
- Se `groupAllowFrom` non è impostato, a runtime si ripiega su `allowFrom` per i controlli dei mittenti nei gruppi.
- I controlli dei mittenti si applicano sia ai normali messaggi di gruppo sia ai comandi di controllo (per esempio `/new`, `/reset`).

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Blocco tramite menzione nei gruppi

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte di gruppo richiedono una menzione.
- Ordine di risoluzione: id/nome gruppo esatto -> slug gruppo normalizzato -> `*` -> predefinito (`true`).
- Questo si applica sia ai gruppi in allowlist sia alla modalità gruppi aperta.
- Citare un messaggio del bot conta come menzione implicita per l'attivazione nel gruppo.
- I comandi di controllo autorizzati (per esempio `/new`) possono bypassare il blocco tramite menzione.
- Quando un messaggio di gruppo viene saltato perché è richiesta una menzione, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
- Il limite della cronologia di gruppo è predefinito su `messages.groupChat.historyLimit` (fallback `50`). Puoi sovrascriverlo per account con `channels.zalouser.historyLimit`.

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-account

Gli account vengono mappati ai profili `zalouser` nello stato di OpenClaw. Esempio:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitazione, reazioni e conferme di consegna

- OpenClaw invia un evento di digitazione prima di inviare una risposta (best-effort).
- L'azione di reazione al messaggio `react` è supportata per `zalouser` nelle azioni del canale.
  - Usa `remove: true` per rimuovere da un messaggio una specifica emoji di reazione.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in ingresso che includono metadati evento, OpenClaw invia conferme di consegna + visualizzazione (best-effort).

## Risoluzione dei problemi

**L'accesso non persiste:**

- `openclaw channels status --probe`
- Accedi di nuovo: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome in allowlist/gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom` e ID gruppo stabili in `groups`. Se hai intenzionalmente bisogno di nomi esatti di amici/gruppi, abilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aggiornamento da una vecchia configurazione basata su CLI:**

- Rimuovi qualsiasi vecchia ipotesi di processo esterno `zca`.
- Il canale ora viene eseguito completamente in OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e blocco tramite menzione
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
