---
read_when:
    - Configurazione di Zalo Personal per OpenClaw
    - Debug di accesso o flusso dei messaggi di Zalo Personal
summary: Supporto per account personali Zalo tramite `zca-js` nativo (accesso con QR), funzionalità e configurazione
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T13:46:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (non ufficiale)

Stato: sperimentale. Questa integrazione automatizza un **account Zalo personale** tramite `zca-js` nativo all'interno di OpenClaw.

> **Avviso:** Questa è un'integrazione non ufficiale e può comportare la sospensione/il ban dell'account. Usala a tuo rischio.

## Plugin incluso

Zalo Personal è distribuito come plugin incluso nelle attuali versioni di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Zalo Personal, installalo manualmente:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Oppure da un checkout dei sorgenti: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il plugin Zalo Personal sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Accedi (QR, sulla macchina del Gateway):
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
5. L'accesso ai DM usa per impostazione predefinita il pairing; approva il codice di pairing al primo contatto.

## Che cos'è

- Funziona interamente nel processo tramite `zca-js`.
- Usa listener di eventi nativi per ricevere i messaggi in ingresso.
- Invia le risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso con “account personale” in cui l'API Bot di Zalo non è disponibile.

## Denominazione

L'id del canale è `zalouser` per rendere esplicito che automatizza un **account utente personale Zalo** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale con l'API Zalo.

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

## Controllo di accesso (DM)

`channels.zalouser.dmPolicy` supporta: `pairing | allowlist | open | disabled` (predefinito: `pairing`).

`channels.zalouser.allowFrom` accetta ID utente o nomi. Durante la configurazione, i nomi vengono risolti in ID usando la ricerca contatti in-process del plugin.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- Limita a una allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi dovrebbero essere ID di gruppo stabili; i nomi vengono risolti in ID all'avvio quando possibile)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può richiedere allowlist di gruppo.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti nelle allowlist in ID e registra la mappatura.
- La corrispondenza della allowlist di gruppo usa solo gli ID per impostazione predefinita. I nomi non risolti vengono ignorati per l'autorizzazione, a meno che `channels.zalouser.dangerouslyAllowNameMatching: true` non sia abilitato.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità break-glass che riabilita la corrispondenza con nomi di gruppo modificabili.
- Se `groupAllowFrom` non è impostato, il runtime usa `allowFrom` come fallback per i controlli del mittente nei gruppi.
- I controlli del mittente si applicano sia ai normali messaggi di gruppo sia ai comandi di controllo (ad esempio `/new`, `/reset`).

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

### Blocco tramite mention nei gruppi

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte nei gruppi richiedono una mention.
- Ordine di risoluzione: id/nome del gruppo esatto -> slug normalizzato del gruppo -> `*` -> predefinito (`true`).
- Questo vale sia per i gruppi in allowlist sia per la modalità gruppo aperto.
- I comandi di controllo autorizzati (ad esempio `/new`) possono bypassare il blocco tramite mention.
- Quando un messaggio di gruppo viene saltato perché è richiesta una mention, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel messaggio di gruppo successivo elaborato.
- Il limite della cronologia di gruppo usa per impostazione predefinita `messages.groupChat.historyLimit` (fallback `50`). Puoi sovrascriverlo per account con `channels.zalouser.historyLimit`.

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

Gli account sono mappati ai profili `zalouser` nello stato di OpenClaw. Esempio:

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

- OpenClaw invia un evento di digitazione prima di inoltrare una risposta (best-effort).
- L'azione di reazione ai messaggi `react` è supportata per `zalouser` nelle azioni del canale.
  - Usa `remove: true` per rimuovere una specifica emoji di reazione da un messaggio.
  - Semantica delle reazioni: [Reazioni](/tools/reactions)
- Per i messaggi in ingresso che includono metadati dell'evento, OpenClaw invia conferme di consegna e visualizzazione (best-effort).

## Risoluzione dei problemi

**L'accesso non viene mantenuto:**

- `openclaw channels status --probe`
- Esegui di nuovo l'accesso: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome nella allowlist/del gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom`/`groups`, oppure nomi esatti di amici/gruppi.

**Aggiornato da una vecchia configurazione basata su CLI:**

- Rimuovi qualsiasi vecchia assunzione relativa a processi `zca` esterni.
- Il canale ora viene eseguito interamente in OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e blocco tramite mention
- [Routing dei canali](/it/channels/channel-routing) — routing di sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
