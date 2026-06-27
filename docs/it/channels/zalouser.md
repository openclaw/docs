---
read_when:
    - Configurare Zalo Personal per OpenClaw
    - Debug del login o del flusso dei messaggi di Zalo Personal
summary: Supporto per account personale Zalo tramite zca-js nativo (accesso tramite QR), capacità e configurazione
title: Personale Zalo
x-i18n:
    generated_at: "2026-06-27T17:14:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Stato: sperimentale. Questa integrazione automatizza un **account Zalo personale** tramite `zca-js` nativo dentro OpenClaw.

<Warning>
Questa è un'integrazione non ufficiale e può comportare la sospensione o il ban dell'account. Usala a tuo rischio.
</Warning>

## Plugin incluso

Zalo Personal viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Zalo Personal,
installa direttamente il pacchetto npm:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalouser`
- Versione fissata: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Oppure da un checkout del sorgente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo Personal sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni più vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
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
5. L'accesso ai DM usa l'associazione per impostazione predefinita; approva il codice di associazione al primo contatto.

## Che cos'è

- Viene eseguito interamente nello stesso processo tramite `zca-js`.
- Usa listener di eventi nativi per ricevere i messaggi in ingresso.
- Invia risposte direttamente tramite l'API JS (testo/media/link).
- Progettato per casi d'uso con "account personale" in cui l'API Zalo Bot non è disponibile.

## Denominazione

L'ID del canale è `zalouser` per rendere esplicito che automatizza un **account utente Zalo personale** (non ufficiale). Manteniamo `zalo` riservato per una possibile integrazione futura ufficiale con l'API Zalo.

## Trovare gli ID (directory)

Usa la CLI della directory per scoprire peer/gruppi e i relativi ID:

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

`channels.zalouser.allowFrom` deve usare ID utente Zalo stabili. Può anche fare riferimento a gruppi statici di accesso dei mittenti (`accessGroup:<name>`). Durante la configurazione interattiva, i nomi inseriti possono essere risolti in ID usando la ricerca contatti nello stesso processo del Plugin.

Se un nome grezzo resta nella configurazione, all'avvio viene risolto solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato. Senza questa adesione esplicita, i controlli del mittente a runtime usano solo gli ID e i nomi grezzi vengono ignorati per l'autorizzazione.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Predefinito: `channels.zalouser.groupPolicy = "open"` (gruppi consentiti). Usa `channels.defaults.groupPolicy` per sostituire il valore predefinito quando non è impostato.
- Limita a un elenco di consentiti con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (le chiavi devono essere ID gruppo stabili; i nomi vengono risolti in ID all'avvio solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato)
  - `channels.zalouser.groupAllowFrom` (controlla quali mittenti nei gruppi consentiti possono attivare il bot; i gruppi statici di accesso dei mittenti possono essere referenziati con `accessGroup:<name>`)
- Blocca tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- La procedura guidata di configurazione può richiedere gli elenchi di gruppi consentiti.
- All'avvio, OpenClaw risolve i nomi di gruppi/utenti negli elenchi di consentiti in ID e registra la mappatura solo quando `channels.zalouser.dangerouslyAllowNameMatching: true` è abilitato.
- La corrispondenza dell'elenco di gruppi consentiti è basata solo sugli ID per impostazione predefinita. I nomi non risolti vengono ignorati per l'autenticazione, a meno che `channels.zalouser.dangerouslyAllowNameMatching: true` sia abilitato.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità break-glass che riabilita la risoluzione mutabile dei nomi all'avvio e la corrispondenza dei nomi dei gruppi a runtime.
- Se `groupAllowFrom` non è impostato, il runtime ripiega su `allowFrom` per i controlli dei mittenti nei gruppi.
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

### Gate sulle menzioni nei gruppi

- `channels.zalouser.groups.<group>.requireMention` controlla se le risposte nei gruppi richiedono una menzione.
- Ordine di risoluzione: ID/nome gruppo esatto -> slug del gruppo normalizzato -> `*` -> predefinito (`true`).
- Si applica sia ai gruppi nell'elenco di consentiti sia alla modalità gruppo aperta.
- Citare un messaggio del bot conta come menzione implicita per l'attivazione del gruppo.
- I comandi di controllo autorizzati (per esempio `/new`) possono bypassare il gate sulle menzioni.
- Quando un messaggio di gruppo viene saltato perché è richiesta una menzione, OpenClaw lo archivia come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
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

## Variabili d'ambiente

Il Plugin Zalo Personal può anche leggere la selezione del profilo dalle variabili d'ambiente:

- `ZALOUSER_PROFILE`: nome del profilo da usare quando non è impostato alcun `profile` nella configurazione del canale o dell'account.
- `ZCA_PROFILE`: nome del profilo fallback legacy, usato solo quando `ZALOUSER_PROFILE` non è impostato.

I nomi dei profili selezionano le credenziali di accesso Zalo salvate nello stato di OpenClaw. L'ordine di risoluzione è:

1. `profile` esplicito nella configurazione.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. L'ID account per gli account non predefiniti, oppure `default` per l'account predefinito.

Per le configurazioni multi-account, preferisci impostare `profile` su ogni account nella configurazione, così
una sola variabile d'ambiente non farà condividere a più account la stessa sessione
di accesso.

## Digitazione, reazioni e conferme di consegna

- OpenClaw invia un evento di digitazione prima di inoltrare una risposta (best-effort).
- L'azione di reazione ai messaggi `react` è supportata per `zalouser` nelle azioni del canale.
  - Usa `remove: true` per rimuovere una specifica emoji di reazione da un messaggio.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in ingresso che includono metadati evento, OpenClaw invia conferme di consegna + lettura (best-effort).

## Risoluzione dei problemi

**L'accesso non resta attivo:**

- `openclaw channels status --probe`
- Accedi di nuovo: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome nell'elenco consentiti/gruppo non è stato risolto:**

- Usa ID numerici in `allowFrom`/`groupAllowFrom` e ID gruppo stabili in `groups`. Se hai intenzionalmente bisogno dei nomi esatti di amici/gruppi, abilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aggiornato da una vecchia configurazione basata su CLI:**

- Rimuovi qualunque vecchia assunzione su processi esterni `zca`.
- Ora il canale viene eseguito interamente in OpenClaw senza binari CLI esterni.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gate sulle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
