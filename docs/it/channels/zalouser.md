---
read_when:
    - Configurazione di Zalo Personal per OpenClaw
    - Debug del flusso di accesso o dei messaggi di Zalo Personal
summary: Supporto per account personali Zalo tramite zca-js nativo (accesso con codice QR), funzionalità e configurazione
title: Zalo personale
x-i18n:
    generated_at: "2026-07-12T06:53:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Stato: sperimentale. Questa integrazione automatizza un **account Zalo personale** tramite `zca-js` nativo, nello stesso processo, senza alcun binario CLI esterno.

<Warning>
Questa è un'integrazione non ufficiale e può comportare la sospensione o il blocco dell'account. Utilizzala a tuo rischio.
</Warning>

## Installazione

Zalo Personal è un plugin esterno ufficiale, non incluso nel core. Installalo prima dell'uso:

```bash
openclaw plugins install @openclaw/zalouser
```

- Fissare una versione: `openclaw plugins install @openclaw/zalouser@<version>`
- Da un checkout del codice sorgente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Installa il plugin (come indicato sopra).
2. Effettua l'accesso (tramite QR, sulla macchina del Gateway):
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
5. Per impostazione predefinita, l'accesso ai messaggi diretti usa l'associazione; approva il codice di associazione al primo contatto.

## Che cos'è

- Viene eseguito interamente nello stesso processo tramite la libreria `zca-js` (senza binari esterni `zca`/`openzca`).
- Utilizza listener di eventi nativi (`message`, `error`) per ricevere i messaggi in entrata.
- Invia le risposte direttamente tramite l'API JS (testo, contenuti multimediali e collegamenti).
- È progettato per i casi d'uso con un "account personale" nei quali l'API Zalo Bot non è disponibile.

## Denominazione

L'ID del canale è `zalouser` per indicare esplicitamente che automatizza un **account utente Zalo personale** (in modo non ufficiale). `zalo` è riservato a una possibile futura integrazione ufficiale con l'API Zalo.

## Individuazione degli ID (directory)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limiti

- Il testo in uscita viene suddiviso in blocchi di 2.000 caratteri (limite del client Zalo).
- Lo streaming non è supportato.

## Controllo degli accessi (messaggi diretti)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: `pairing`).

`channels.zalouser.allowFrom` deve utilizzare ID utente Zalo stabili. Può anche fare riferimento a gruppi statici di accesso dei mittenti (`accessGroup:<name>`). Durante la configurazione interattiva, i nomi inseriti possono essere risolti in ID tramite la ricerca dei contatti interna al processo del plugin.

Se nella configurazione rimane un nome non elaborato, all'avvio viene risolto solo quando è abilitato `channels.zalouser.dangerouslyAllowNameMatching: true`. Senza questa abilitazione esplicita, i controlli dei mittenti in fase di esecuzione utilizzano esclusivamente gli ID e i nomi non elaborati vengono ignorati ai fini dell'autorizzazione.

Approva tramite:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accesso ai gruppi (facoltativo)

- Valore predefinito: `channels.zalouser.groupPolicy = "allowlist"` (i gruppi richiedono una voce esplicita nell'elenco consentiti).
- Aprire tutti i gruppi: `channels.zalouser.groupPolicy = "open"`.
- Bloccare tutti i gruppi: `channels.zalouser.groupPolicy = "disabled"`.
- Con `groupPolicy = "allowlist"`:
  - Le chiavi di `channels.zalouser.groups` devono essere ID di gruppo stabili; i nomi vengono risolti in ID all'avvio solo quando è abilitato `channels.zalouser.dangerouslyAllowNameMatching: true`.
  - `channels.zalouser.groupAllowFrom` controlla quali mittenti nei gruppi consentiti possono attivare il bot; è possibile fare riferimento ai gruppi statici di accesso dei mittenti con `accessGroup:<name>`.
- La procedura guidata di configurazione può richiedere gli elenchi di gruppi consentiti.
- Per impostazione predefinita, la corrispondenza con l'elenco dei gruppi consentiti utilizza esclusivamente gli ID. I nomi non risolti vengono ignorati ai fini dell'autorizzazione, a meno che non sia abilitato `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la risoluzione all'avvio dei nomi modificabili e la corrispondenza dei nomi dei gruppi in fase di esecuzione.
- Per i normali messaggi di gruppo, `groupAllowFrom` **non** utilizza `allowFrom` come ripiego: se viene lasciato vuoto per un gruppo presente nell'elenco consentiti, qualsiasi mittente può accedere a quel gruppo. I comandi di controllo autorizzati (ad esempio `/new`) costituiscono un'eccezione; quando `groupAllowFrom` è vuoto, i controlli sul mittente dei comandi utilizzano `allowFrom` come ripiego.

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` è il nome di un campo precedente; la configurazione attuale utilizza `enabled`. `openclaw doctor --fix` migra automaticamente `allow` in `enabled`.
</Note>

### Attivazione tramite menzione nei gruppi

- `channels.zalouser.groups.<group>.requireMention` determina se le risposte nei gruppi richiedono una menzione.
- Ordine di risoluzione: ID del gruppo -> alias `group:<id>` -> nome/slug del gruppo (i candidati basati sul nome si applicano solo quando `dangerouslyAllowNameMatching: true`) -> `*` -> valore predefinito (`true`).
- Si applica sia ai gruppi presenti nell'elenco consentiti sia alla modalità con gruppi aperti.
- Citare un messaggio del bot conta come menzione implicita ai fini dell'attivazione nel gruppo.
- I comandi di controllo autorizzati (ad esempio `/new`) possono ignorare il requisito della menzione.
- Quando un messaggio di gruppo viene ignorato perché è richiesta una menzione, OpenClaw lo memorizza come cronologia di gruppo in sospeso e lo include nel successivo messaggio di gruppo elaborato.
- Limite della cronologia dei gruppi: `channels.zalouser.historyLimit`, quindi `messages.groupChat.historyLimit`, infine un valore di ripiego pari a `50`.

Esempio:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Account multipli

Gli account vengono associati ai profili `zalouser` nello stato di OpenClaw. Esempio:

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

La selezione del profilo può provenire anche dalle variabili d'ambiente:

| Variabile          | Scopo                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nome del profilo da utilizzare quando non è impostato alcun `profile` nella configurazione del canale o dell'account.      |
| `ZCA_PROFILE`      | Ripiego precedente, utilizzato solo quando `ZALOUSER_PROFILE` non è impostata.                                             |

I nomi dei profili selezionano le credenziali di accesso a Zalo salvate nello stato di OpenClaw. Ordine di risoluzione:

1. `profile` esplicito nella configurazione.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. L'ID account per gli account non predefiniti oppure `default` per l'account predefinito.

Per le configurazioni con più account, è preferibile impostare `profile` per ciascun account nella configurazione, affinché una singola variabile d'ambiente non faccia condividere la stessa sessione di accesso a più account.

## Digitazione, reazioni e conferme di consegna

- OpenClaw invia un evento di digitazione prima di inoltrare una risposta (con il massimo impegno possibile).
- L'azione di reazione ai messaggi `react` è supportata per `zalouser` nelle azioni del canale.
  - Utilizza `remove: true` per rimuovere da un messaggio una specifica emoji di reazione.
  - Semantica delle reazioni: [Reazioni](/it/tools/reactions)
- Per i messaggi in entrata che includono i metadati dell'evento, OpenClaw invia conferme di consegna e lettura (con il massimo impegno possibile).

## Risoluzione dei problemi

**L'accesso non rimane memorizzato:**

- `openclaw channels status --probe`
- Accedi nuovamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Il nome nell'elenco consentiti o del gruppo non è stato risolto:**

- Utilizza ID numerici in `allowFrom`/`groupAllowFrom` e ID di gruppo stabili in `groups`. Se hai intenzionalmente bisogno di nomi esatti di amici o gruppi, abilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aggiornamento da una vecchia configurazione basata su `zca` esterno/CLI:**

- Rimuovi qualsiasi presupposto relativo a un processo `zca` esterno; ora il canale viene eseguito interamente nello stesso processo tramite `zca-js`, senza alcun binario CLI esterno.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e attivazione tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e protezione avanzata
