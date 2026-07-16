---
read_when:
    - Implementazione delle approvazioni per l'associazione dei Node senza interfaccia utente macOS
    - Aggiunta di flussi CLI per l'approvazione dei nodi remoti
    - Estensione del protocollo Gateway con la gestione dei Node
summary: 'Approvazioni delle funzionalità dei Node: come i Node ottengono l''esposizione dei comandi dopo l''associazione del dispositivo'
title: Associazione del Node
x-i18n:
    generated_at: "2026-07-16T14:22:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

L'associazione dei Node prevede due livelli, entrambi memorizzati nel record del dispositivo associato nel database di stato SQLite del Gateway:

- **Associazione del dispositivo** (ruolo `node`) controlla l'handshake `connect`. Consultare
  [Approvazione automatica dei dispositivi tramite CIDR attendibili](#trusted-cidr-device-auto-approval)
  più avanti e [Associazione dei canali](/it/channels/pairing).
- **Approvazione delle funzionalità del Node** (`node.pair.*`) controlla quali
  funzionalità/comandi dichiarati può esporre un Node connesso. Il Gateway è la
  fonte autorevole; le interfacce utente (app macOS, interfaccia di controllo) sono frontend che approvano o
  rifiutano le richieste in sospeso.

Il precedente archivio autonomo per l'associazione dei Node (`nodes/paired.json` con un token
per Node, ritirato dal percorso di connessione nel gennaio 2026) non esiste più: all'avvio, i Gateway
integrano una sola volta le eventuali righe rimanenti nei record dei dispositivi e archiviano i
file legacy con il suffisso `.migrated`. Il supporto del bridge TCP legacy è stato
rimosso.

## Funzionamento dell'approvazione delle funzionalità

1. Un Node si connette al WS del Gateway (l'associazione del dispositivo controlla questo passaggio).
2. Il Gateway confronta l'insieme dichiarato di funzionalità/comandi con quello
   approvato; gli insiemi nuovi o ampliati memorizzano una **richiesta in sospeso** nel
   record del dispositivo ed emettono `node.pair.requested`.
3. La richiesta viene approvata o rifiutata (tramite CLI o interfaccia utente).
4. Fino all'approvazione, i comandi del Node restano filtrati; l'approvazione espone l'insieme
   dichiarato, nel rispetto dei normali criteri per i comandi.

Le richieste in sospeso scadono automaticamente **5 minuti dopo l'ultimo
tentativo del Node**: un Node che continua attivamente a riconnettersi mantiene attiva la sua unica richiesta in sospeso,
anziché generare una nuova richiesta (e una nuova richiesta di approvazione) a ogni tentativo.

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
- `node.pair.remove` - rimuove un Node associato. Ciò revoca il ruolo `node` del dispositivo
  nell'archivio dei dispositivi associati, elimina contestualmente la superficie approvata del Node e
  invalida/disconnette le sessioni del ruolo Node di tale dispositivo. Un dispositivo con **ruoli misti**
  (ad esempio, uno che possiede anche `operator`) conserva la propria riga e perde soltanto
  il ruolo `node`; la riga di un dispositivo esclusivamente Node viene eliminata. Autorizzazione:
  `operator.pairing` può rimuovere le righe dei Node non operatori; un chiamante con token del dispositivo
  che revoca il **proprio** ruolo Node su un dispositivo con ruoli misti necessita inoltre di
  `operator.admin`.
- `node.rename` - rinomina il nome visualizzato di un Node associato destinato all'operatore.

Rimossi nella versione 2026.7: `node.pair.request` e `node.pair.verify`. Le richieste in sospeso
vengono create dal Gateway stesso durante le connessioni dei Node e il
token autonomo per Node che gestivano non esiste più; l'autenticazione del Node usa il
token di associazione del dispositivo.

Note:

- Le riconnessioni con una superficie invariata riutilizzano la richiesta in sospeso; le richieste
  ripetute aggiornano i metadati del Node memorizzati e l'ultima
  istantanea dichiarata dei comandi inclusi nell'elenco consentito, per consentirne la visibilità all'operatore.
- I livelli di ambito dell'operatore e i controlli eseguiti al momento dell'approvazione sono riepilogati in
  [Ambiti dell'operatore](/it/gateway/operator-scopes).
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi ordinari: `operator.pairing` + `operator.write`
  - richiesta sensibile per l'amministrazione contenente `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` o
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
L'approvazione dell'associazione del Node registra la superficie di funzionalità attendibile. **Non** vincola la superficie attiva dei comandi del Node per ciascun Node.

- I comandi attivi del Node provengono da quanto dichiarato dal Node al momento della connessione, filtrato dai
  criteri globali del Gateway per i comandi dei Node (`gateway.nodes.allowCommands` e
  `denyCommands`).
- I criteri di autorizzazione e richiesta `system.run` per ciascun Node risiedono nel Node in
  `exec.approvals.node.*`, non nel record di associazione.

</Warning>

## Controllo dei comandi del Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi dei Node sono disabilitati finché l'associazione del Node non viene approvata. La sola associazione del dispositivo non è più sufficiente per esporre i comandi dichiarati dal Node.
</Warning>

Quando un Node si connette per la prima volta, l'associazione viene richiesta automaticamente.
Finché tale richiesta non viene approvata, tutti i comandi in sospeso provenienti da quel Node vengono
filtrati e non saranno eseguiti. Dopo l'approvazione dell'associazione, i comandi dichiarati
dal Node diventano disponibili, nel rispetto dei normali criteri per i comandi.

Ciò significa che:

- I Node che in precedenza si affidavano alla sola associazione del dispositivo per esporre i comandi devono
  ora completare anche l'associazione del Node.
- I comandi accodati prima dell'approvazione dell'associazione vengono eliminati, non differiti.

## Limiti di attendibilità degli eventi dei Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dai Node restano ora su una superficie attendibile ridotta.
</Warning>

I riepiloghi originati dai Node e i relativi eventi di sessione sono limitati alla
superficie attendibile prevista. Potrebbe essere necessario adeguare i flussi basati sulle notifiche o attivati dai Node
che in precedenza si affidavano a un accesso più ampio agli strumenti dell'host o della sessione.
Questa misura di sicurezza impedisce agli eventi dei Node di ottenere l'accesso agli strumenti a livello di host
oltre quanto consentito dal limite di attendibilità del Node.

Gli aggiornamenti persistenti della presenza del Node seguono lo stesso limite di identità: l'evento
`node.presence.alive` viene accettato soltanto dalle sessioni autenticate dei dispositivi Node
e aggiorna i metadati dell'associazione soltanto quando l'identità del dispositivo/Node è
già associata. Un valore `client.id` autodichiarato non è sufficiente per scrivere
lo stato dell'ultimo rilevamento.

## Approvazione automatica dei dispositivi verificata tramite SSH (impostazione predefinita)

L'associazione iniziale del dispositivo `role: node` da un indirizzo privato/CGNAT viene
approvata automaticamente quando il Gateway può **dimostrare la proprietà della macchina tramite SSH**: si
riconnette all'host che richiede l'associazione (`BatchMode`, `StrictHostKeyChecking=yes`),
esegue lì `openclaw node identity --json` e approva soltanto quando l'ID del dispositivo
remoto e la chiave pubblica corrispondono esattamente alla richiesta in sospeso. La corrispondenza della chiave è
ciò che rende sicuro il processo: la sola raggiungibilità non determina mai l'approvazione, quindi gli utenti che condividono lo stesso NAT,
gli altri utenti di un host condiviso e lo spoofing LAN ricadono tutti nella normale
richiesta di conferma.

Abilitata per impostazione predefinita. Requisiti per l'attivazione:

- L'utente del processo Gateway (o `sshVerify.user`) può collegarsi tramite SSH all'host del Node
  senza interazione (chiavi/agente; funziona anche Tailscale SSH) e la chiave dell'host è
  già attendibile.
- `openclaw` viene risolto sul `PATH` remoto per `sh -lc` non interattivo.
- L'IP di connessione è un indirizzo diretto (senza proxy e non loopback) privato, ULA,
  link-local o CGNAT, oppure corrisponde a `sshVerify.cidrs` quando impostato.
- Stessa soglia di idoneità dell'approvazione tramite CIDR attendibili: solo associazioni iniziali
  dei Node senza ambiti; aggiornamenti, browser, interfaccia di controllo e WebChat richiedono sempre conferma.

Mentre è in corso una verifica, al client Node viene indicato di continuare a riprovare
(`wait_then_retry`) anziché sospendersi in attesa dell'approvazione manuale; se la verifica
non riesce, il tentativo successivo ricade nel normale flusso di richiesta. Le destinazioni per cui la verifica non riesce
sono soggette a un breve periodo di attesa (5 minuti dopo una mancata corrispondenza della chiave).

I dispositivi approvati registrano `approvedVia: "ssh-verified"` e la loro prima superficie di
funzionalità dichiarata viene approvata nello stesso passaggio: la corrispondenza della chiave dimostra già
che il Node viene eseguito con l'account dell'operatore su una macchina di sua proprietà, ovvero la
stessa affermazione attestata dall'approvazione manuale delle funzionalità. I successivi ampliamenti della superficie
richiedono comunque conferma.

Per rafforzare la sicurezza o disabilitare:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disabilita completamente:
        sshVerify: false,
        // ...oppure definisce l'ambito/regola la verifica:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Approvazione automatica (app macOS)

L'app macOS può tentare un'**approvazione silenziosa** delle richieste relative alle funzionalità dei Node
quando:

- la richiesta è contrassegnata come `silent` (il Gateway contrassegna come silenziosa la prima superficie di funzionalità
  quando l'associazione del dispositivo è stata approvata senza interazione) e
- l'app può verificare una connessione SSH all'host del Gateway usando lo stesso
  utente.

Se l'approvazione silenziosa non riesce, viene usata la normale richiesta Approve/Reject.

## Approvazione automatica dei dispositivi tramite CIDR attendibili

L'associazione dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per le reti private dei Node
in cui il Gateway considera già attendibile il percorso di rete, gli operatori possono abilitarla
specificando CIDR o IP esatti:

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

Limite di sicurezza:

- Disabilitata quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste una modalità generale di approvazione automatica per LAN o reti private; l'approvazione
  automatica verificata tramite SSH (descritta sopra) richiede una corrispondenza crittografica della chiave del dispositivo, mai
  la sola vicinanza di rete.
- È idonea soltanto una nuova richiesta di associazione del dispositivo `role: node` senza ambiti richiesti.
- I client operatore, browser, interfaccia di controllo e WebChat restano manuali.
- Gli aggiornamenti di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi delle intestazioni del proxy attendibile in loopback sullo stesso host non sono idonei, perché tale
  percorso può essere falsificato dai chiamanti locali.

## Pulizia delle associazioni silenziose sostituite

Le approvazioni non interattive registrano la propria provenienza nella riga del dispositivo associato:
le approvazioni tramite criteri locali sullo stesso host come `silent`, le approvazioni dei Node tramite CIDR attendibili come
`trusted-cidr` e le approvazioni dei Node verificate tramite SSH come `ssh-verified`. I client la cui directory di stato è effimera (home temporanee,
container, sandbox per esecuzione) generano una nuova coppia di chiavi del dispositivo a ogni esecuzione e ogni
esecuzione ripete silenziosamente l'associazione come dispositivo completamente nuovo: senza pulizia, l'elenco dei dispositivi associati
aumenta di una riga obsoleta a ogni esecuzione.

Quando il Gateway approva silenziosamente l'associazione di un dispositivo **locale**, ritira
i record precedenti approvati tramite `silent` che appartengono allo stesso cluster di client
(con `clientId`, `clientMode` e nome visualizzato corrispondenti) e non sono attualmente
connessi. I client locali vengono eseguiti sull'host del Gateway stesso, quindi la chiave del cluster
non può corrispondere a una macchina diversa. I token delle righe ritirate vengono invalidati immediatamente;
ogni voce legacy corrispondente dell'associazione dei Node viene eliminata e viene trasmesso un evento di
rimozione `node.pair.resolved`.

Limiti:

- Sono idonei, sia come origine sia come destinazione, solo i record la cui approvazione
  più recente è avvenuta localmente sullo stesso host (`silent`). Gli abbinamenti verificati
  tramite CIDR attendibile e SSH attraversano host in cui i metadati di visualizzazione non costituiscono
  un'identità della macchina, pertanto non vengono mai rimossi automaticamente: per questi, utilizzare
  la pulizia nella UI di controllo o `openclaw nodes remove`.
- Gli abbinamenti approvati dal proprietario e quelli tramite QR/codice di configurazione
  (bootstrap) non vengono mai rimossi automaticamente. I record approvati prima che esistesse la
  provenienza restano protetti, anche dopo una successiva riapprovazione silenziosa dello stesso ID dispositivo.
- I dispositivi attualmente connessi vengono ignorati, quindi le sessioni locali simultanee
  con directory di stato separate mantengono i propri token finché sono attive. Vengono ignorati anche
  i record approvati nell'ultimo minuto, così gli handshake di abbinamento simultanei non possono
  revocarsi a vicenda prima che le rispettive connessioni vengano registrate.
- Per definizione, i client interessati sono locali, quindi si abbinano nuovamente
  in modo silenzioso alla connessione successiva.

## Approvazione automatica degli aggiornamenti dei metadati

Quando un dispositivo già abbinato si riconnette presentando solo modifiche
a metadati non sensibili (ad esempio il nome visualizzato o indicazioni sulla
piattaforma client), OpenClaw considera l'evento un `metadata-upgrade`.
L'approvazione automatica silenziosa ha un ambito ristretto: si applica solo
alle riconnessioni locali attendibili non provenienti da browser che hanno già
dimostrato il possesso di credenziali locali o condivise, incluse le riconnessioni
di app native sullo stesso host dopo modifiche ai metadati della versione del
sistema operativo. I client browser/UI di controllo e i client remoti continuano
a utilizzare il flusso esplicito di riapprovazione. Gli ampliamenti dell'ambito
(da lettura a scrittura/amministrazione) e le modifiche alla chiave pubblica
**non** sono idonei all'approvazione automatica degli aggiornamenti dei metadati;
rimangono richieste esplicite di riapprovazione.

## Strumenti per l'abbinamento tramite QR

`/pair qr` restituisce il payload di abbinamento come contenuto multimediale
strutturato, affinché i client mobili e browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di abbinamento
in sospeso obsolete per tale ID dispositivo, così `nodes pending` non mostra
righe orfane dopo una revoca.

## Località e intestazioni inoltrate

L'abbinamento del Gateway considera una connessione come loopback solo quando
sia il socket non elaborato sia qualsiasi evidenza del proxy a monte concordano.
Se una richiesta arriva tramite loopback ma contiene evidenze nelle intestazioni
`Forwarded`, in qualsiasi `X-Forwarded-*` o in `X-Real-IP`, tali
evidenze di intestazioni inoltrate invalidano l'asserzione di località loopback
e il percorso di abbinamento richiede un'approvazione esplicita anziché trattare
silenziosamente la richiesta come una connessione dallo stesso host. Consultare
[Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth) per la
regola equivalente relativa all'autenticazione dell'operatore.

## Archiviazione (locale, privata)

Lo stato dell'abbinamento risiede nei record dei dispositivi abbinati nel database
di stato SQLite condiviso, all'interno della directory di stato del Gateway
(per impostazione predefinita `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivi abbinati con autenticazione
  del dispositivo, superfici Node approvate, richieste di superfici in sospeso,
  richieste di abbinamento di dispositivi in sospeso e token di bootstrap)

Se si sovrascrive `OPENCLAW_STATE_DIR`, il database viene spostato insieme a essa.
I Gateway aggiornati da versioni con archivi JSON li importano all'avvio e
lasciano gli archivi `devices/*.json.migrated` e `nodes/*.json.migrated`.

Note sulla sicurezza:

- I token dei dispositivi sono segreti; il database di stato
deve essere trattato come sensibile.
- La rotazione del token di un dispositivo utilizza
`openclaw devices rotate` / `device.token.rotate`.

## Comportamento del trasporto

- Il trasporto è **senza stato**; non memorizza l'appartenenza.
- Se il Gateway non è in linea o l'abbinamento è disabilitato,
i Node non possono essere abbinati.
- In modalità remota, l'abbinamento avviene nell'archivio
del Gateway remoto.

## Argomenti correlati

- [Abbinamento dei canali](/it/channels/pairing)
- [CLI dei Node](/it/cli/nodes)
- [CLI dei dispositivi](/it/cli/devices)
