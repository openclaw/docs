---
read_when:
    - Configurazione di Zalo personale per OpenClaw
    - Debug delle problematiche di accesso o del flusso dei messaggi di Zalo personale
summary: Supporto per account personale Zalo tramite zca-js nativo (accesso con QR), capacità e configurazione
title: Zalo personale
x-i18n:
    generated_at: "2026-04-24T08:32:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo personale (non ufficiale)

Stato: sperimentale. Questa integrazione automatizza un **account personale Zalo** tramite `zca-js` nativo all'interno di OpenClaw.

> **Avviso:** questa è un'integrazione non ufficiale e può comportare la sospensione/il ban dell'account. Usala a tuo rischio.

## Plugin incluso

Zalo personale è distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Zalo personale,
installalo manualmente:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Oppure da un checkout del sorgente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo personale sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
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

4. Riavvia il Gateway (o completa la configurazione).
5. L'accesso DM usa per impostazione predefinita l'associazione; approva il codice di associazione al primo contatto.

## Cos'è

- Viene eseguito interamente nel processo tramite `zca-js`.
- Usa listener di eventi nativi per ricevere i messaggi in ingresso.
- Invia risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso di “account personale” in cui l'API Bot di Zalo non è disponibile.

## Denominazione

L'ID canale è `zalouser` per rendere esplicito che questo automatizza un **account utente personale Zalo** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale con l'API Zalo.

## Trovare gli ID (directory)

Usa la CLI directory per scoprire peer/gruppi e i loro ID:

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

`channels.zalouser.allowFrom` accetta ID utente o nomi. Durante la configurazione, i nomi vengono risolti in ID usando la ricerca contatti in-process del Plugin.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- Limita a una allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi dovrebbero essere ID gruppo stabili; i nomi vengono risolti in ID all'avvio quando possibile)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può chiedere allowlist di gruppi.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti nelle allowlist in ID e registra la mappatura.
- La corrispondenza della allowlist dei gruppi usa solo gli ID per impostazione predefinita. I nomi non risolti vengono ignorati per l'autenticazione a meno che non sia abilitato `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la corrispondenza con nomi di gruppo mutabili.
- Se `groupAllowFrom` non è impostato, il runtime usa come fallback `allowFrom` per i controlli dei mittenti nei gruppi.
- I controlli sui mittenti si applicano sia ai normali messaggi di gruppo sia ai comandi di controllo (per esempio `/new`, `/reset`).

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

### Vincolo della menzione nei gruppi

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte nei gruppi richiedono una menzione.
- Ordine di risoluzione: ID/nome gruppo esatto -> slug gruppo normalizzato -> `*` -> predefinito (`true`).
- Questo si applica sia ai gruppi in allowlist sia alla modalità gruppi aperti.
- Citare un messaggio del bot conta come menzione implicita per l'attivazione nel gruppo.
- I comandi di controllo autorizzati (per esempio `/new`) possono bypassare il vincolo della menzione.
- Quando un messaggio di gruppo viene saltato perché è richiesta una menzione, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
- Il limite della cronologia di gruppo usa come predefinito `messages.groupChat.historyLimit` (fallback `50`). Puoi sovrascriverlo per account con `channels.zalouser.historyLimit`.

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

- OpenClaw invia un evento di digitazione prima di inviare una risposta (best-effort).
- L'azione di reazione ai messaggi `react` è supportata per `zalouser` nelle azioni del canale.
  - Usa `remove: true` per rimuovere una specifica reazione emoji da un messaggio.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in ingresso che includono metadati evento, OpenClaw invia conferme delivered + seen (best-effort).

## Risoluzione dei problemi

**L'accesso non persiste:**

- `openclaw channels status --probe`
- Accedi di nuovo: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome nella allowlist/nel gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom`/`groups`, oppure nomi esatti di amici/gruppi.

**Aggiornato dalla vecchia configurazione basata su CLI:**

- Rimuovi qualsiasi vecchia ipotesi su processi esterni `zca`.
- Il canale ora funziona interamente in OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e vincolo della menzione
- [Instradamento del canale](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
