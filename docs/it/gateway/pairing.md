---
read_when:
    - Implementazione delle approvazioni di associazione dei Node senza interfaccia utente macOS
    - Aggiunta di flussi CLI per approvare i nodi remoti
    - Estensione del protocollo del Gateway con la gestione dei Node
summary: 'Approvazioni delle funzionalità dei Node: come i Node ottengono l''accesso ai comandi dopo l''associazione del dispositivo'
title: Associazione dei Node
x-i18n:
    generated_at: "2026-07-12T07:05:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

L'associazione dei Node prevede due livelli, entrambi memorizzati nel record del dispositivo associato nel database di stato SQLite del Gateway:

- **Associazione del dispositivo** (ruolo `node`) controlla l'handshake `connect`. Vedere
  [Approvazione automatica dei dispositivi tramite CIDR attendibili](#trusted-cidr-device-auto-approval)
  di seguito e [Associazione dei canali](/it/channels/pairing).
- **Approvazione delle funzionalità del Node** (`node.pair.*`) controlla quali
  funzionalità/comandi dichiarati può esporre un Node connesso. Il Gateway è la
  fonte autorevole; le interfacce utente (app macOS, Control UI) sono frontend che approvano o
  rifiutano le richieste in sospeso.

Il precedente archivio autonomo delle associazioni dei Node (`nodes/paired.json` con un token
per Node, ritirato dal percorso di connessione a gennaio 2026) non esiste più: all'avvio, i Gateway
integrano una sola volta eventuali righe rimanenti nei record dei dispositivi e archiviano i
file legacy con il suffisso `.migrated`. Il supporto per il bridge TCP legacy è stato
rimosso.

## Funzionamento dell'approvazione delle funzionalità

1. Un Node si connette al WS del Gateway (l'associazione del dispositivo controlla questo passaggio).
2. Il Gateway confronta l'insieme delle funzionalità/dei comandi dichiarati con quello
   approvato; gli insiemi nuovi o ampliati memorizzano una **richiesta in sospeso** nel
   record del dispositivo ed emettono `node.pair.requested`.
3. La richiesta viene approvata o rifiutata (tramite CLI o interfaccia utente).
4. Fino all'approvazione, i comandi del Node restano filtrati; l'approvazione espone l'insieme
   dichiarato, nel rispetto dei normali criteri dei comandi.

Le richieste in sospeso scadono automaticamente **5 minuti dopo l'ultimo
nuovo tentativo del Node**: un Node che tenta attivamente di riconnettersi mantiene valida
la propria unica richiesta in sospeso invece di generarne una nuova (con la relativa richiesta di approvazione) a ogni tentativo.

## Flusso di lavoro CLI (adatto agli ambienti headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i Node associati/connessi e le relative funzionalità.

## Superficie API (protocollo del Gateway)

Eventi:

- `node.pair.requested` - emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` - emesso quando una richiesta viene approvata, rifiutata o
  scade.

Metodi:

- `node.pair.list` - elenca i Node in sospeso e associati (`operator.pairing`).
- `node.pair.approve` - approva una richiesta in sospeso.
- `node.pair.reject` - rifiuta una richiesta in sospeso.
- `node.pair.remove` - rimuove un Node associato. Questa operazione revoca il ruolo `node`
  del dispositivo nell'archivio dei dispositivi associati, rimuove insieme a esso la superficie approvata del Node e
  invalida/disconnette le sessioni con ruolo Node di tale dispositivo. Un dispositivo con **più ruoli**
  (ad esempio, che possiede anche `operator`) mantiene la propria riga e perde soltanto
  il ruolo `node`; la riga di un dispositivo con il solo ruolo Node viene eliminata. Autorizzazione:
  `operator.pairing` può rimuovere le righe dei Node che non hanno il ruolo operator; un chiamante con token del dispositivo
  che revoca il **proprio** ruolo Node su un dispositivo con più ruoli necessita inoltre di
  `operator.admin`.
- `node.rename` - rinomina il nome visualizzato di un Node associato mostrato agli operatori.

Rimossi nella versione 2026.7: `node.pair.request` e `node.pair.verify`. Le richieste in sospeso
vengono create dal Gateway stesso durante le connessioni dei Node e il
token autonomo per Node a cui erano destinati non esiste più; l'autenticazione del Node usa il
token di associazione del dispositivo.

Note:

- Le riconnessioni con un insieme invariato riutilizzano la richiesta in sospeso; le richieste
  ripetute aggiornano i metadati memorizzati del Node e l'ultima istantanea dei comandi
  dichiarati inclusi nell'elenco di autorizzazione, per renderli visibili all'operatore.
- I livelli di ambito dell'operatore e i controlli effettuati al momento dell'approvazione sono riepilogati in
  [Ambiti dell'operatore](/it/gateway/operator-scopes).
- `node.pair.approve` usa i comandi dichiarati nella richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi non esecutivi: `operator.pairing` + `operator.write`
  - richiesta di `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
L'approvazione dell'associazione del Node registra la superficie di funzionalità attendibile. **Non** fissa la superficie attiva dei comandi per ciascun Node.

- I comandi attivi del Node derivano da ciò che il Node dichiara al momento della connessione, filtrato dai
  criteri globali del Gateway per i comandi dei Node (`gateway.nodes.allowCommands` e
  `denyCommands`).
- I criteri di autorizzazione e richiesta per Node relativi a `system.run` risiedono sul Node in
  `exec.approvals.node.*`, non nel record di associazione.

</Warning>

## Controllo dei comandi dei Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire dalla versione `2026.3.31`, i comandi dei Node sono disabilitati finché l'associazione del Node non viene approvata. La sola associazione del dispositivo non è più sufficiente per esporre i comandi dichiarati del Node.
</Warning>

Quando un Node si connette per la prima volta, l'associazione viene richiesta automaticamente.
Finché la richiesta non viene approvata, tutti i comandi in sospeso provenienti da tale Node vengono
filtrati e non vengono eseguiti. Una volta approvata l'associazione, i comandi dichiarati
dal Node diventano disponibili, nel rispetto dei normali criteri dei comandi.

Ciò significa che:

- I Node che in precedenza si affidavano alla sola associazione del dispositivo per esporre i comandi devono
  ora completare anche l'associazione del Node.
- I comandi accodati prima dell'approvazione dell'associazione vengono eliminati, non rinviati.

## Confini di attendibilità degli eventi dei Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dai Node restano ora su una superficie attendibile ridotta.
</Warning>

I riepiloghi originati dai Node e gli eventi di sessione correlati sono limitati alla
superficie attendibile prevista. Potrebbe essere necessario modificare i flussi attivati da notifiche o dai Node
che in precedenza si affidavano a un accesso più ampio agli strumenti dell'host o della sessione.
Questo rafforzamento impedisce agli eventi dei Node di ottenere l'accesso agli strumenti a livello di host
oltre quanto consentito dal confine di attendibilità del Node.

Gli aggiornamenti persistenti della presenza dei Node seguono lo stesso confine di identità: l'evento
`node.presence.alive` viene accettato soltanto dalle sessioni autenticate dei dispositivi Node
e aggiorna i metadati di associazione soltanto quando l'identità del dispositivo/Node è
già associata. Un valore `client.id` autodichiarato non è sufficiente per scrivere
lo stato dell'ultima attività.

## Approvazione automatica dei dispositivi verificata tramite SSH (predefinita)

L'associazione iniziale di un dispositivo con `role: node` da un indirizzo privato/CGNAT viene
approvata automaticamente quando il Gateway può **dimostrare la proprietà della macchina tramite SSH**: si
riconnette all'host che richiede l'associazione (`BatchMode`, `StrictHostKeyChecking=yes`),
esegue lì `openclaw node identity --json` e approva soltanto quando l'ID del dispositivo
remoto e la chiave pubblica corrispondono esattamente alla richiesta in sospeso. È la corrispondenza della chiave
a rendere sicuro il processo: la sola raggiungibilità non comporta mai l'approvazione, pertanto gli altri utenti
dietro lo stesso NAT, gli altri utenti di un host condiviso e lo spoofing della LAN vengono tutti reindirizzati
alla normale richiesta di approvazione.

Abilitata per impostazione predefinita. Requisiti per l'attivazione:

- L'utente del processo del Gateway (o `sshVerify.user`) può connettersi tramite SSH all'host del Node
  in modo non interattivo (chiavi/agent; funziona anche Tailscale SSH) e la chiave dell'host è
  già considerata attendibile.
- `openclaw` viene risolto nel `PATH` remoto per l'esecuzione non interattiva di `sh -lc`.
- L'IP di connessione è un indirizzo diretto (senza proxy e non local loopback) privato, ULA,
  link-local o CGNAT oppure corrisponde a `sshVerify.cidrs`, se impostato.
- Si applica lo stesso requisito minimo di idoneità dell'approvazione tramite CIDR attendibili: soltanto una nuova associazione
  di Node senza ambiti; aggiornamenti, browser, Control UI e WebChat richiedono sempre l'approvazione.

Mentre è in corso una verifica, al client Node viene indicato di continuare a riprovare
(`wait_then_retry`) invece di restare in attesa dell'approvazione manuale; se la verifica
non riesce, il tentativo successivo torna al normale flusso di richiesta. Per le destinazioni
non riuscite viene applicato un breve periodo di sospensione (5 minuti dopo una mancata corrispondenza della chiave).

I dispositivi approvati registrano `approvedVia: "ssh-verified"` e la loro prima superficie di
funzionalità dichiarata viene approvata nello stesso passaggio: la corrispondenza della chiave dimostra già che
il Node viene eseguito con l'account dell'operatore su una macchina di sua proprietà, che è la
stessa attestazione fornita dall'approvazione manuale delle funzionalità. Gli ampliamenti successivi della superficie
richiedono comunque l'approvazione.

Per rafforzare la sicurezza o disabilitare:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disabilita completamente:
        sshVerify: false,
        // ...oppure limita/regola la verifica:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Approvazione automatica (app macOS)

L'app macOS può tentare un'**approvazione silenziosa** delle richieste di funzionalità dei Node
quando:

- la richiesta è contrassegnata come `silent` (il Gateway contrassegna come silenziosa la prima superficie di
  funzionalità quando l'associazione del dispositivo è stata approvata in modo non interattivo), e
- l'app può verificare una connessione SSH all'host del Gateway utilizzando lo stesso
  utente.

Se l'approvazione silenziosa non riesce, viene mostrata la normale richiesta Approve/Reject.

## Approvazione automatica dei dispositivi tramite CIDR attendibili

L'associazione dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per le reti private dei Node
in cui il Gateway considera già attendibile il percorso di rete, gli operatori possono abilitarla
specificando CIDR o indirizzi IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Confine di sicurezza:

- Disabilitata quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste una modalità di approvazione automatica generale per la LAN o le reti private; l'approvazione automatica
  verificata tramite SSH (descritta sopra) richiede una corrispondenza crittografica della chiave del dispositivo, mai
  la sola prossimità di rete.
- È idonea soltanto una nuova richiesta di associazione di un dispositivo con `role: node` senza ambiti richiesti.
- I client operator, browser, Control UI e WebChat restano manuali.
- Gli ampliamenti di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi delle intestazioni del proxy attendibile su local loopback dello stesso host non sono idonei, perché tale
  percorso può essere contraffatto dai chiamanti locali.

## Pulizia delle associazioni silenziose sostituite

Le approvazioni non interattive registrano la propria provenienza nella riga del dispositivo associato:
le approvazioni tramite criteri locali sullo stesso host come `silent`, le approvazioni dei Node tramite CIDR attendibili come
`trusted-cidr`, le approvazioni dei Node verificate tramite SSH come `ssh-verified`. I client la cui directory di stato è effimera (directory home temporanee,
container, sandbox per esecuzione) generano una nuova coppia di chiavi del dispositivo a ogni esecuzione e ogni
esecuzione effettua silenziosamente una nuova associazione come dispositivo completamente nuovo: senza pulizia, l'elenco dei dispositivi associati
aumenta di una riga obsoleta per ogni esecuzione.

Quando il Gateway approva silenziosamente l'associazione di un dispositivo **locale**, ritira
i record approvati come `silent` meno recenti che appartengono allo stesso gruppo di client
(con `clientId`, `clientMode` e nome visualizzato corrispondenti) e che non sono attualmente
connessi. I client locali vengono eseguiti sullo stesso host del Gateway, pertanto la chiave del
gruppo non può corrispondere a una macchina diversa. I token delle righe ritirate vengono invalidati immediatamente;
ogni voce legacy corrispondente relativa all'associazione del Node viene cancellata e viene trasmesso un evento
di rimozione `node.pair.resolved`.

Limiti:

- Sono idonei, sia come origine sia come destinazione, soltanto i record la cui approvazione più recente è avvenuta
  localmente sullo stesso host (`silent`). Le associazioni tramite CIDR attendibili e quelle verificate tramite SSH
  attraversano host in cui i metadati di visualizzazione non rappresentano un'identità della macchina, quindi non vengono
  mai rimosse automaticamente: per queste, utilizzare la pulizia della Control UI o
  `openclaw nodes remove`.
- Le associazioni approvate dal proprietario e tramite codice QR/codice di configurazione (bootstrap) non vengono mai rimosse
  automaticamente. I record approvati prima dell'introduzione della provenienza restano protetti,
  anche dopo una successiva riapprovazione silenziosa dello stesso ID del dispositivo.
- I dispositivi attualmente connessi vengono ignorati, così le sessioni locali simultanee con
  directory di stato separate mantengono i propri token mentre sono attive. Vengono ignorati anche i record approvati
  nell'ultimo minuto, affinché gli handshake di associazione simultanei
  non possano ritirarsi reciprocamente prima che le rispettive connessioni vengano registrate.
- Per costruzione, i client interessati sono locali, quindi alla connessione successiva
  eseguono nuovamente l'associazione in modo silenzioso.

## Approvazione automatica degli aggiornamenti dei metadati

Quando un dispositivo già associato si riconnette presentando soltanto modifiche non sensibili ai metadati
(ad esempio il nome visualizzato o indicazioni sulla piattaforma del client), OpenClaw considera
l'operazione un `metadata-upgrade`. L'approvazione automatica silenziosa è limitata: si applica soltanto
alle riconnessioni locali attendibili non provenienti da browser che hanno già dimostrato il possesso di
credenziali locali o condivise, incluse le riconnessioni delle app native sullo stesso host dopo
modifiche ai metadati della versione del sistema operativo. I client browser/Control UI e i client remoti
continuano a utilizzare il flusso esplicito di riapprovazione. Gli ampliamenti di ambito (da lettura a
scrittura/amministrazione) e le modifiche alla chiave pubblica **non** sono idonei
all'approvazione automatica degli aggiornamenti dei metadati; restano richieste esplicite di riapprovazione.

## Strumenti per l'associazione tramite codice QR

`/pair qr` visualizza il payload di associazione come contenuto multimediale strutturato, affinché i client mobili e browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di associazione in sospeso obsolete per quell'ID dispositivo, affinché `nodes pending` non mostri righe orfane dopo una revoca.

## Località e intestazioni inoltrate

L'associazione del Gateway considera una connessione come local loopback solo quando sia il socket originario sia qualsiasi evidenza proveniente da proxy a monte concordano. Se una richiesta arriva tramite local loopback ma contiene evidenze nelle intestazioni `Forwarded`, `X-Forwarded-*` o `X-Real-IP`, tali evidenze delle intestazioni inoltrate invalidano la dichiarazione di località local loopback e il percorso di associazione richiede un'approvazione esplicita anziché considerare implicitamente la richiesta come una connessione proveniente dallo stesso host. Consultare
[Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth) per la regola equivalente relativa all'autenticazione dell'operatore.

## Archiviazione (locale, privata)

Lo stato dell'associazione risiede nei record dei dispositivi associati nel database di stato SQLite condiviso, all'interno della directory di stato del Gateway (impostazione predefinita: `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivi associati con autenticazione del dispositivo, superfici dei Node approvate, richieste di superfici in sospeso, richieste di associazione dei dispositivi in sospeso e token di bootstrap)

Se si ridefinisce `OPENCLAW_STATE_DIR`, il database viene spostato insieme a essa. I Gateway aggiornati da versioni che utilizzavano archivi JSON li importano all'avvio e conservano gli archivi `devices/*.json.migrated` e `nodes/*.json.migrated`.

Note sulla sicurezza:

- I token dei dispositivi sono segreti; trattare il database di stato come sensibile.
- Per ruotare il token di un dispositivo si utilizzano `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamento del trasporto

- Il trasporto è **senza stato**; non memorizza le appartenenze.
- Se il Gateway è offline o l'associazione è disabilitata, i Node non possono eseguire l'associazione.
- In modalità remota, l'associazione avviene nell'archivio del Gateway remoto.

## Correlati

- [Associazione dei canali](/it/channels/pairing)
- [CLI dei Node](/it/cli/nodes)
- [CLI dei dispositivi](/it/cli/devices)
