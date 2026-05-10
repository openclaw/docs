---
read_when:
    - Configurazione di Zalo Personal per OpenClaw
    - Risoluzione dei problemi relativi all'accesso o al flusso dei messaggi di Zalo Personal
summary: Supporto per account personale Zalo tramite zca-js nativo (accesso con codice QR), funzionalità e configurazione
title: Zalo personale
x-i18n:
    generated_at: "2026-05-10T19:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Stato: sperimentale. Questa integrazione automatizza un **account Zalo personale** tramite `zca-js` nativo dentro OpenClaw.

<Warning>
Questa è un'integrazione non ufficiale e può comportare la sospensione o il ban dell'account. Usala a tuo rischio.
</Warning>

## Plugin incluso

Zalo Personal viene distribuito come plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Zalo Personal,
installa direttamente il pacchetto npm:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Versione fissata: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oppure da un checkout sorgente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il plugin Zalo Personal sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
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

4. Riavvia il Gateway (o completa la configurazione).
5. L'accesso DM usa per impostazione predefinita l'abbinamento; approva il codice di abbinamento al primo contatto.

## Che cos'è

- Viene eseguito interamente in-process tramite `zca-js`.
- Usa listener di eventi nativi per ricevere messaggi in ingresso.
- Invia risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso con "account personale" in cui l'API Zalo Bot non è disponibile.

## Denominazione

L'ID canale è `zalouser` per rendere esplicito che automatizza un **account utente Zalo personale** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale dell'API Zalo.

## Trovare gli ID (directory)

Usa la CLI della directory per scoprire peer/gruppi e i loro ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limiti

- Il testo in uscita viene suddiviso in blocchi di ~2000 caratteri (limiti del client Zalo).
- Lo streaming è bloccato per impostazione predefinita.

## Controllo accessi (DM)

`channels.zalouser.dmPolicy` supporta: `pairing | allowlist | open | disabled` (predefinito: `pairing`).

`channels.zalouser.allowFrom` dovrebbe usare ID utente Zalo stabili. Può anche fare riferimento a gruppi statici di accesso mittente (`accessGroup:<name>`). Durante la configurazione interattiva, i nomi inseriti possono essere risolti in ID usando la ricerca contatti in-process del plugin.

Se un nome grezzo rimane nella configurazione, all'avvio viene risolto solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato. Senza quell'opt-in, i controlli mittente a runtime sono solo per ID e i nomi grezzi vengono ignorati per l'autorizzazione.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non impostato.
- Limita a un'allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi dovrebbero essere ID gruppo stabili; i nomi vengono risolti in ID all'avvio solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot; i gruppi statici di accesso mittente possono essere referenziati con `accessGroup:<name>`)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può richiedere allowlist di gruppi.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti nelle allowlist in ID e registra la mappatura solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato.
- Per impostazione predefinita, la corrispondenza dell'allowlist dei gruppi è solo per ID. I nomi non risolti vengono ignorati per l'autenticazione a meno che `channels.zalouser.dangerouslyAllowNameMatching: true` sia abilitato.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la risoluzione dei nomi mutabili all'avvio e la corrispondenza dei nomi dei gruppi a runtime.
- Se `groupAllowFrom` non è impostato, il runtime ripiega su `allowFrom` per i controlli del mittente del gruppo.
- I controlli del mittente si applicano sia ai normali messaggi di gruppo sia ai comandi di controllo (per esempio `/new`, `/reset`).

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

### Gate per menzioni di gruppo

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte di gruppo richiedono una menzione.
- Ordine di risoluzione: ID/nome gruppo esatto -> slug gruppo normalizzato -> `*` -> predefinito (`true`).
- Si applica sia ai gruppi in allowlist sia alla modalità gruppo aperto.
- Citare un messaggio del bot conta come menzione implicita per l'attivazione nel gruppo.
- I comandi di controllo autorizzati (per esempio `/new`) possono bypassare il gate delle menzioni.
- Quando un messaggio di gruppo viene saltato perché è richiesta una menzione, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
- Il limite della cronologia dei gruppi usa per impostazione predefinita `messages.groupChat.historyLimit` (fallback `50`). Puoi sovrascriverlo per account con `channels.zalouser.historyLimit`.

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

## Account multipli

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
  - Usa `remove: true` per rimuovere una specifica emoji di reazione da un messaggio.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in ingresso che includono metadati evento, OpenClaw invia conferme di consegna + visualizzazione (best-effort).

## Risoluzione dei problemi

**L'accesso non persiste:**

- `openclaw channels status --probe`
- Accedi di nuovo: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome nell'allowlist/gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom` e ID gruppo stabili in `groups`. Se hai intenzionalmente bisogno dei nomi esatti di amici/gruppi, abilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aggiornato da una vecchia configurazione basata su CLI:**

- Rimuovi qualsiasi vecchia assunzione su un processo esterno `zca`.
- Il canale ora viene eseguito completamente in OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gate delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
