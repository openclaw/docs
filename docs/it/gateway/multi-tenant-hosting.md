---
doc-schema-version: 1
read_when:
    - Si ospita OpenClaw per più utenti o organizzazioni
    - È necessario scegliere un confine di isolamento per i carichi di lavoro dei tenant
summary: Ospitare più domini di attendibilità tenant come una cella Gateway OpenClaw isolata per tenant
title: Hosting multi-tenant
x-i18n:
    generated_at: "2026-07-16T14:21:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hosting multi-tenant

Il modello di sicurezza predefinito di OpenClaw prevede un confine con un unico operatore attendibile per ogni Gateway, non l'isolamento di multi-tenant ostili all'interno di un Gateway condiviso. Ospitare utenti o organizzazioni che non condividono un confine di fiducia richiede quindi l'esecuzione di un'istanza OpenClaw completa e separata per ogni tenant.

`openclaw fleet` definisce ogni istanza isolata una **cella**. Una cella è un Gateway completo in un container sottoposto a hardening, con stato, credenziali, spazio di lavoro, account dei canali, token e porta host accessibile solo tramite loopback propri.

Fleet è **sperimentale**: i relativi comandi, flag e profilo del container possono cambiare tra una versione e l'altra senza un periodo di deprecazione.

Fleet è testato su host Linux e macOS. Gli host Windows non sono attualmente testati.

## Perché ogni tenant necessita di una cella

Un operatore autenticato all'interno di un Gateway ricopre un ruolo attendibile nel piano di controllo. Gli ID di sessione selezionano l'instradamento; non autorizzano un tenant rispetto a un altro. Il sandboxing degli agenti può ridurre gli effetti di contenuti non attendibili e dell'esecuzione di strumenti, ma non trasforma un Gateway condiviso in un confine di autorizzazione tra tenant.

Utilizzare una cella per ogni tenant, affinché ogni dominio di fiducia disponga di un processo Gateway, un container, un albero di stato persistente e una credenziale del Gateway separati. Ciò è conforme al [modello di sicurezza del Gateway](/it/gateway/security): non collocare utenti reciprocamente non attendibili nello stesso processo OpenClaw o sotto lo stesso utente del sistema operativo.

## Architettura

La CLI Fleet è un supervisore del ciclo di vita eseguito sull'host. Registra le celle nel database di stato di OpenClaw e richiede a un runtime Docker o Podman locale di creare, ispezionare, avviare, arrestare, sostituire e rimuovere i relativi container. Gli endpoint runtime remoti non sono supportati perché i percorsi di binding e gli URL di loopback di Fleet appartengono all'host locale. Fleet non inoltra i messaggi dei tenant e non aggiunge un percorso dati condiviso a livello di applicazione tra le celle.

Ogni cella esegue l'immagine ufficiale `ghcr.io/openclaw/openclaw` sulla propria rete bridge definita dall'utente. Bridge separati impediscono il traffico diretto tra gli indirizzi IP dei container delle diverse celle, mantenendo al contempo l'accesso NAT in uscita per provider e canali. Il traffico in uscita non è limitato per impostazione predefinita. Le celle Podman possono utilizzare `--network internal` per bloccare il traffico in uscita preservando la porta di loopback pubblicata del Gateway. Le reti interne Docker compromettono tale porta pubblicata, quindi Fleet rifiuta questa combinazione; applicare invece i criteri Docker per il traffico in uscita tramite regole del firewall dell'host, come la catena `DOCKER-USER`. Il Gateway della cella resta in ascolto sulla porta `18789` all'interno del container, mentre il runtime la pubblica sull'host esclusivamente su `127.0.0.1:<allocated-port>`. Quando è necessario l'accesso remoto, un operatore può anteporre a tale endpoint di loopback un reverse proxy approvato, un tunnel SSH o una tailnet.

Lo stato persistente del Gateway proviene da `<state-dir>/fleet/cells/<tenant>/` ed è montato in `/home/node/.openclaw`. Le chiavi di crittografia dei profili di autenticazione provengono dal percorso host separato `<state-dir>/fleet/auth-profile-secrets/<tenant>/` e sono montate in `/home/node/.config/openclaw`, in conformità con il [layout ufficiale di persistenza di Docker](/it/install/docker#storage-and-persistence). La chiave non è annidata sotto il normale punto di montaggio dello stato. Gli account dei canali specifici di ogni tenant terminano all'interno della cella che li possiede; Fleet non fornisce un account di canale condiviso né un router per i messaggi in entrata.

L'immagine ufficiale utilizza per impostazione predefinita l'utente non root `node` con UID 1000. Fleet utilizza mappature degli utenti compatibili con l'host affinché i mount bind privati restino scrivibili: Podman utilizza `keep-id`, Docker con privilegi root utilizza l'identità non root dell'utente che lo ha invocato e Docker rootless mappa l'utente root del container all'utente senza privilegi del daemon. Docker e Podman applicano una rietichettatura privata `:Z` quando SELinux è attivo sull'host. Il profilo del container evita le funzionalità privilegiate dell'host ed è compatibile con l'esecuzione rootless, ma quest'ultima è una scelta e un prerequisito del runtime host, non una funzionalità abilitata automaticamente da Fleet.

## Confine di fiducia

La multi-tenancy protegge i tenant gli uni dagli altri. L'operatore Fleet e l'host sono considerati attendibili da ogni tenant. La resistenza alla compromissione dell'host non rientra tra gli obiettivi.

Ciò significa che un amministratore dell'host può ispezionare la configurazione e l'ambiente dei container, leggere i dati montati delle celle, sostituire le immagini o accedere ai container. I token del Gateway e i valori passati tramite `--env` sono visibili a un amministratore mediante l'ispezione di Docker o Podman. Utilizzare di conseguenza controlli dell'host, criteri per l'accesso amministrativo, monitoraggio, backup e un gestore di segreti approvato.

La configurazione di base impedisce l'esposizione accidentale della rete tramite caratteri jolly e rimuove le comuni primitive di escalation dei privilegi dei container, ma non rende sicuro un host non attendibile.

## Livelli di isolamento

Scegliere il confine adatto ai tenant ospitati:

1. **Configurazione di base di un container sottoposto a hardening.** Fleet rimuove tutte le funzionalità Linux, abilita `no-new-privileges`, applica limiti per PID, memoria, CPU e, facoltativamente, spazio su disco del livello scrivibile, utilizza mount persistenti separati e reti per ogni cella e pubblica le porte esclusivamente sul loopback dell'host. La rete bridge non limita il traffico in uscita; quando una cella non deve avviare connessioni in uscita, utilizzare `--network internal` di Podman o i criteri del firewall dell'host per Docker. Questo è il profilo predefinito per i tenant che considerano attendibili l'operatore e l'host.
2. **Isolamento più robusto tramite container o VM.** Per i carichi di lavoro a rischio più elevato, configurare Docker o Podman affinché utilizzi un runtime di isolamento OCI più robusto, come gVisor o Kata Containers, oppure collocare le celle in microVM. Si tratta di una configurazione del runtime o dell'infrastruttura; l'opzione `--runtime docker|podman` di Fleet seleziona la CLI del container, non il backend di isolamento OCI. Consultare i [runtime alternativi per container](https://docs.docker.com/engine/daemon/alternative-runtimes/) di Docker e la [guida al runtime Docker per VM](/it/install/docker-vm-runtime).
3. **Macchine separate per tenant ostili.** Non collocare tenant ostili nello stesso processo OpenClaw o sotto lo stesso utente del sistema operativo. Quando i tenant non considerano attendibile lo stesso operatore dell'host o necessitano di un confine amministrativo più robusto, utilizzare VM o host fisici separati con un'amministrazione del runtime distinta.

Nessun livello di questa gerarchia modifica il modello di fiducia dell'applicazione OpenClaw: un Gateway rimane un singolo dominio con un operatore attendibile.

## Avvio rapido

Creare una cella. Il comando visualizza una sola volta un token del Gateway generato, pertanto è necessario conservarlo immediatamente:

```bash
openclaw fleet create acme
```

Aprire sull'host Fleet l'URL `http://127.0.0.1:<port>` indicato, autenticarsi con il token del tenant e configurare le credenziali del provider e gli account dei canali all'interno della cella.

Verificare lo stato del container e la raggiungibilità del Gateway:

```bash
openclaw fleet status acme
```

Eseguire l'upgrade preservando la porta host, i dati montati, il profilo delle risorse, l'ambiente fornito dall'utente e il token del Gateway:

```bash
openclaw fleet upgrade acme
```

Rimuovere il container e la riga del registro conservando i dati del tenant:

```bash
openclaw fleet rm acme --force
```

Per eliminare anche i dati persistenti del tenant, aggiungere `--purge-data`. L'eliminazione definitiva richiede `--force`, è irreversibile ed esegue un controllo di contenimento del percorso risolto prima di eliminare qualsiasi elemento:

```bash
openclaw fleet rm acme --purge-data --force
```

Consultare il [riferimento della CLI `openclaw fleet`](/cli/fleet) per tutti i comandi e le opzioni.

## Ambito attuale

Fleet non fornisce le seguenti funzionalità:

- Account di canale condivisi o un router di ingresso condiviso
- Processi host semplificati per tenant al posto di istanze OpenClaw complete
- Host remoti delle celle gestiti da un unico supervisore
- Un portale self-service per i tenant, un piano di fatturazione o un'interfaccia utente per l'amministrazione delegata

Queste funzionalità richiedono contratti espliciti per identità, instradamento, autorizzazione e domini di errore. Non approssimarle condividendo un Gateway o le relative credenziali tra i tenant. Fleet è un supervisore del ciclo di vita per un singolo host; le flotte multi-macchina governate dalle identità richiedono un livello separato per il piano di controllo.

## Argomenti correlati

- [`openclaw fleet`](/cli/fleet)
- [Sicurezza del Gateway](/it/gateway/security)
- [Gateway multipli](/it/gateway/multiple-gateways)
- [Docker](/it/install/docker)
- [Podman](/it/install/podman)
