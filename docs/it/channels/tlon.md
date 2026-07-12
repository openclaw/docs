---
read_when:
    - Sviluppo delle funzionalità del canale Tlon/Urbit
summary: Stato del supporto, funzionalità e configurazione di Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T06:51:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon è un servizio di messaggistica decentralizzato basato su Urbit. OpenClaw si connette alla tua nave Urbit e
risponde ai messaggi diretti e ai messaggi delle chat di gruppo. Per impostazione predefinita, le risposte nei gruppi richiedono una menzione @, con
regole di autorizzazione e un flusso di approvazione del proprietario aggiuntivi.

Stato: plugin incluso. Sono supportati messaggi diretti, menzioni nei gruppi, thread, testo formattato, caricamento/scaricamento di immagini e un
sistema di approvazione del proprietario. Reazioni e sondaggi non sono supportati.

## Plugin incluso

Tlon è incluso nelle versioni attuali di OpenClaw; le build distribuite non richiedono un'installazione separata.

In una build precedente o in un'installazione personalizzata che lo esclude, installalo da npm:

```bash
openclaw plugins install @openclaw/tlon
```

Usa il nome semplice del pacchetto per seguire il tag della versione corrente. Blocca una versione (`@openclaw/tlon@x.y.z`)
solo per installazioni riproducibili.

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

In alternativa, modifica direttamente la configurazione:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // consigliato: la tua nave, sempre autorizzata
    },
  },
}
```

Riavvia il Gateway dopo aver modificato direttamente la configurazione. Quindi invia un messaggio diretto al bot oppure menzionalo con @ in un
canale di gruppo.

## Navi private/LAN

Per impostazione predefinita, OpenClaw blocca nomi host e intervalli IP privati/interni per proteggere dagli attacchi SSRF. Se la tua
nave è in esecuzione su una rete privata (localhost, IP LAN, nome host interno), abilitala esplicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Si applica a destinazioni quali `http://localhost:8080`, `http://192.168.x.x:8080` e
`http://my-ship.local:8080`. Abilita questa opzione solo per l'URL di una nave attendibile; disabilita la protezione
SSRF per le richieste HTTP di quell'account.

<Note>
`channels.tlon.allowPrivateNetwork` (chiave non annidata) è stato ritirato. `openclaw doctor --fix` lo sposta automaticamente in
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Canali di gruppo

Fissa manualmente i canali oppure attiva il rilevamento automatico:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

Quando non è impostato nella configurazione, il valore predefinito di `autoDiscoverChannels` è `false`; la procedura guidata di configurazione propone
sì come risposta predefinita e scrive esplicitamente `true`. Quando è attivo, OpenClaw esegue lo scry dei gruppi a cui si è iscritti all'avvio,
monitora i nuovi canali man mano che gli inviti ai gruppi vengono accettati e ricontrolla ogni 2 minuti.

## Controllo degli accessi

Elenco consentiti per i messaggi diretti (vuoto = nessun messaggio diretto consentito, a meno che il mittente non sia `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Per impostazione predefinita, l'autorizzazione dei gruppi è `restricted` per ogni canale. Imposta `defaultAuthorizedShips` come
base e applica sostituzioni per ogni nest di canale:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Dopo che il bot ha risposto all'interno di un thread, continua a rispondere ai messaggi successivi in quel thread
senza richiedere un'altra menzione.

## Proprietario e sistema di approvazione

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La nave del proprietario è autorizzata ovunque: gli inviti ai messaggi diretti vengono sempre accettati automaticamente, gli inviti ai gruppi vengono
sempre accettati automaticamente e i messaggi dei canali superano sempre l'autorizzazione. Non è necessario che il proprietario
sia presente in `dmAllowlist`, `defaultAuthorizedShips` o `groupInviteAllowlist`.

Quando `ownerShip` è impostato, le richieste non autorizzate non vengono semplicemente ignorate: vengono aggiunte alla coda delle
approvazioni in sospeso e viene inviato un messaggio diretto al proprietario:

- Richieste di messaggi diretti da navi non presenti in `dmAllowlist`
- Menzioni in canali in cui il mittente non supera l'autorizzazione
- Inviti ai gruppi da navi non presenti in `groupInviteAllowlist` (quando l'accettazione automatica è disattivata, oppure è attiva ma
  chi ha inviato l'invito non è nell'elenco consentiti)

Il proprietario risponde tramite messaggio diretto per intervenire su una richiesta:

| Risposta del proprietario     | Effetto                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| `approve` / `deny` / `block`  | Interviene sull'approvazione in sospeso più recente                         |
| `approve <id>` / `deny <id>`  | Interviene su un'approvazione specifica tramite ID                          |
| `block`                       | Blocca anche la nave in modo nativo, impedendole di riconnettersi           |
| `unblock ~ship`               | Annulla un blocco nativo                                                    |
| `blocked`                     | Elenca le navi attualmente bloccate                                         |
| `pending`                     | Elenca le richieste di approvazione in sospeso                              |

Senza `ownerShip` configurato, i messaggi diretti e le menzioni nei canali non autorizzati vengono semplicemente ignorati e registrati;
non viene mostrata alcuna richiesta di approvazione.

## Impostazioni di accettazione automatica

Accetta automaticamente gli inviti ai messaggi diretti dalle navi già presenti in `dmAllowlist` (il proprietario viene sempre accettato automaticamente
indipendentemente da questo flag):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accetta automaticamente gli inviti ai gruppi da un elenco consentiti (in caso di dubbio, rifiuta: con `autoAcceptGroupInvites: true` e
un `groupInviteAllowlist` vuoto, non viene accettato alcun invito da parte di soggetti diversi dal proprietario):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Ricaricamento a caldo tramite l'archivio delle impostazioni di Urbit

La maggior parte delle impostazioni precedenti (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) viene replicata nell'agente
`%settings` della nave (desk `moltbot`, bucket `tlon`) al primo avvio e poi letta in tempo reale da lì,
quindi le modifiche apportate tramite un client Landscape o i comandi per le impostazioni della skill inclusa vengono applicate senza
riavviare il Gateway. Anche `channelRules` e le approvazioni in sospeso vengono archiviate lì in formato JSON. La
configurazione nel file rimane la fonte autorevole per i valori mai scritti nell'archivio delle impostazioni.

## Destinazioni di consegna (CLI/cron)

Da usare con `openclaw message send` o la consegna tramite cron:

- Messaggio diretto: `~sampel-palnet` o `dm/~sampel-palnet`
- Gruppo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill inclusa

Il plugin include [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), una CLI per
operazioni dirette su Urbit, disponibile automaticamente dopo l'installazione del plugin:

- **Attività**: menzioni, risposte, elementi non letti
- **Canali**: elencare, creare, rinominare
- **Contatti**: elencare/ottenere/aggiornare i profili
- **Gruppi**: creare, partecipare, flussi di invito/richiesta, ruoli
- **Hook**: gestire gli hook dei canali
- **Messaggi**: cronologia, ricerca
- **Messaggi diretti**: inviare, reagire, accettare/rifiutare
- **Post**: reagire, eliminare
- **Taccuino**: pubblicare nei canali diario
- **Impostazioni**: ricaricare a caldo la configurazione del plugin tramite l'archivio delle impostazioni descritto sopra

## Funzionalità

| Funzionalità      | Stato                                                    |
| ----------------- | -------------------------------------------------------- |
| Messaggi diretti  | Supportati                                               |
| Gruppi/canali     | Supportati (per impostazione predefinita richiedono una menzione) |
| Thread            | Supportati (continua a rispondere dopo essersi unito)    |
| Testo formattato  | Markdown convertito nel formato nativo di Tlon           |
| Immagini          | Scaricate in entrata, caricate in uscita                 |
| Reazioni          | Solo tramite la [skill inclusa](#bundled-skill)          |
| Sondaggi          | Non supportati                                           |
| Comandi nativi    | Per impostazione predefinita, riservati al proprietario  |

## Risoluzione dei problemi

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Problemi comuni:

- **Messaggi diretti ignorati**: il mittente non è presente in `dmAllowlist` e non è configurato alcun `ownerShip` per il flusso di approvazione.
- **Messaggi di gruppo ignorati**: il canale non è stato rilevato/fissato oppure il mittente non supera l'autorizzazione e non è presente alcun
  `ownerShip` a cui accodare un'approvazione.
- **Errori di connessione**: verifica che l'URL della nave sia raggiungibile; imposta
  `network.dangerouslyAllowPrivateNetwork` per le navi locali.
- **Errori di autenticazione**: i codici di accesso cambiano; copia il codice corrente dalla tua nave.

## Riferimento per la configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

| Chiave                                                 | Significato                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `channels.tlon.enabled`                                | Abilita/disabilita l'avvio del canale.                                         |
| `channels.tlon.ship`                                   | Nome della nave Urbit del bot (ad es. `~sampel-palnet`).                       |
| `channels.tlon.url`                                    | URL della nave (ad es. `https://sampel-palnet.tlon.network`).                  |
| `channels.tlon.code`                                   | Codice di accesso della nave.                                                  |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Consente URL di navi su localhost/LAN (abilitazione esplicita per SSRF).       |
| `channels.tlon.ownerShip`                              | Nave del proprietario: sempre autorizzata, riceve le richieste di approvazione. |
| `channels.tlon.dmAllowlist`                            | Navi autorizzate a inviare messaggi diretti (vuoto = nessuna oltre al proprietario). |
| `channels.tlon.autoAcceptDmInvites`                    | Accetta automaticamente i messaggi diretti dalle navi in `dmAllowlist`.        |
| `channels.tlon.autoAcceptGroupInvites`                 | Accetta automaticamente gli inviti ai gruppi da `groupInviteAllowlist`.        |
| `channels.tlon.groupInviteAllowlist`                   | Navi i cui inviti ai gruppi vengono accettati automaticamente.                 |
| `channels.tlon.autoDiscoverChannels`                   | Rileva automaticamente i canali dei gruppi a cui si è iscritti (predefinito: `false`). |
| `channels.tlon.groupChannels`                          | Nest di canali fissati manualmente.                                            |
| `channels.tlon.defaultAuthorizedShips`                 | Navi autorizzate per tutti i canali (usato quando nessuna regola corrisponde).  |
| `channels.tlon.authorization.channelRules`             | Modalità di autenticazione ed elenco consentiti per ogni nest di canale.       |
| `channels.tlon.showModelSignature`                     | Aggiunge `_[Generato da <model>]_` alle risposte.                              |
| `channels.tlon.responsePrefix`                         | Prefisso statico anteposto alle risposte in uscita.                            |
| `channels.tlon.accounts.<id>`                          | Account aggiuntivi con nome (configurazioni con più navi).                     |

## Note

- Le risposte nei gruppi richiedono una menzione @ (ad es. `~your-bot-ship`), a meno che il bot non abbia già partecipato a quel thread.
- Le risposte ai thread vengono pubblicate nel thread; inoltre, al bot vengono anteposti gli ultimi 10 messaggi del contesto del thread
  per l'agente.
- Il testo formattato (grassetto, corsivo, codice, intestazioni, elenchi) viene convertito nel formato nativo di Tlon.
- L'invio di un messaggio in entrata che richiede un riepilogo del canale (ad esempio "riassumi questo
  canale") attiva un riepilogo integrato della cronologia anziché il normale flusso di risposta.

## Contenuti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — flusso di autenticazione e associazione dei messaggi diretti
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e requisito di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
