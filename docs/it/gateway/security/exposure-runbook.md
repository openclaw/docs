---
read_when:
    - Esposizione del Gateway tramite LAN, tailnet, Tailscale Serve, Funnel o un proxy inverso
    - Verifica di una distribuzione prima di consentire l'accesso agli utenti reali dei servizi di messaggistica
    - Ripristino di una configurazione rischiosa di accesso remoto o dei messaggi diretti
sidebarTitle: Exposure runbook
summary: Checklist preliminare e di rollback prima di esporre un Gateway OpenClaw oltre il local loopback
title: Runbook per l'esposizione del Gateway
x-i18n:
    generated_at: "2026-07-12T07:06:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Esponi il Gateway solo dopo essere in grado di spiegare chi può raggiungerlo, come viene
autenticato, quali agenti può attivare e quali strumenti possono usare tali agenti.
In caso di dubbio, ripristina l'accesso esclusivamente tramite local loopback ed esegui nuovamente l'audit.
</Warning>

Questa procedura operativa trasforma le indicazioni più generali sulla [sicurezza](/it/gateway/security) in una
lista di controllo per gli operatori relativa all'accesso remoto e all'esposizione della messaggistica.

## Scegliere il modello di esposizione

Preferisci il modello più restrittivo che soddisfa il flusso di lavoro.

| Modello                    | Consigliato quando                                      | Controlli obbligatori                                                                                                                            |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loopback + tunnel SSH      | Uso personale, accesso amministrativo, debug            | Mantieni `gateway.bind: "loopback"` e crea un tunnel verso `127.0.0.1:18789`                                                                      |
| Loopback + Tailscale Serve | Accesso dalla tailnet personale a UI di controllo/WebSocket | Mantieni il Gateway accessibile solo tramite loopback; gli header di identità Tailscale autenticano solo l'interfaccia WebSocket della UI di controllo, non altri percorsi di autenticazione |
| Binding su tailnet/LAN     | Rete privata dedicata con dispositivi noti              | Autenticazione del Gateway, elenco consentiti del firewall, nessun inoltro pubblico delle porte                                                   |
| Proxy inverso attendibile  | SSO/OIDC dell'organizzazione davanti al Gateway          | Autenticazione `trusted-proxy`, `trustedProxies` restrittivo, regole di sovrascrittura/rimozione degli header, utenti consentiti espliciti         |
| Internet pubblico          | Distribuzioni rare e ad alto rischio                    | Proxy sensibile all'identità, TLS, limiti di frequenza, elenchi consentiti restrittivi, sessioni non principali in sandbox                        |

Evita l'inoltro diretto di porte pubbliche verso il Gateway. Se è necessario
l'accesso pubblico, anteponi un proxy sensibile all'identità e assicurati che il proxy sia
l'unico percorso di rete verso il Gateway.

## Inventario preliminare

Registra quanto segue prima di modificare il binding, il proxy, Tailscale o i criteri dei canali:

- Host del Gateway, utente del sistema operativo e directory di stato (predefinita: `~/.openclaw`).
- URL del Gateway e modalità di binding (`gateway.bind`; porta predefinita `18789`).
- Modalità di autenticazione, origine del token/della password oppure origine dell'identità del proxy attendibile.
- Ogni canale abilitato e se accetta messaggi diretti, gruppi o webhook.
- Agenti raggiungibili da mittenti non locali.
- Profilo degli strumenti, modalità sandbox e criteri per gli strumenti con privilegi elevati per ciascun agente raggiungibile.
- Credenziali esterne disponibili per tali agenti.
- Posizione del backup di `~/.openclaw/openclaw.json` e delle credenziali.

Se più di una persona può inviare messaggi al bot, considera questa configurazione come autorità
delegata condivisa sugli strumenti, non come isolamento dell'host per singolo utente.

## Controlli di base

Esegui questi comandi prima di aprire l'accesso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Risolvi prima i problemi critici. Accetta gli avvisi solo quando sono intenzionali e
documentati per la distribuzione. Consulta i [controlli dell'audit di sicurezza](/it/gateway/security/audit-checks)
per sapere cosa significa ciascun `checkId` e qual è la relativa chiave di correzione.

Per la convalida remota tramite CLI, specifica esplicitamente le credenziali:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Non presumere che le credenziali della configurazione locale si applichino a un URL remoto esplicito.

## Configurazione minima sicura

Usa questa struttura come punto di partenza per le distribuzioni esposte:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Allenta un controllo alla volta: aggiungi un elenco consentiti specifico per il canale prima di abilitare
strumenti con capacità di scrittura oppure abilita un proxy inverso prima di accettare traffico remoto
verso la UI di controllo.

`tools.exec.security: "deny"` blocca tutte le chiamate di esecuzione, incluse le
operazioni diagnostiche innocue. Se sono necessari comandi diagnostici o a basso rischio, allenta questa impostazione solo
dopo aver scelto i mittenti, gli agenti, i comandi e la modalità di approvazione specifici che
corrispondono al tuo modello di minaccia.

## Esposizione di messaggi diretti e gruppi

I canali di messaggistica sono superfici di input non attendibili. Prima di consentire messaggi diretti o
gruppi:

- Preferisci `dmPolicy: "pairing"` o un elenco `allowFrom` restrittivo rispetto a `dmPolicy: "open"`.
- Non combinare elenchi consentiti `"*"` con un accesso esteso agli strumenti.
- Richiedi menzioni nei gruppi, a meno che la stanza non sia sottoposta a uno stretto controllo.
- Imposta `session.dmScope: "per-channel-peer"` (oppure `"per-account-channel-peer"` per
  i canali con più account) quando più persone possono inviare messaggi diretti al bot, in modo che le sessioni
  di messaggistica diretta non condividano il contesto.
- Instrada i canali condivisi verso agenti con strumenti minimi e senza credenziali
  personali.

L'associazione autorizza il mittente ad attivare il bot. Non rende tale mittente un
confine di sicurezza dell'host separato.

## Controlli del proxy inverso

Per i proxy sensibili all'identità:

- Il proxy deve autenticare gli utenti prima di inoltrare le richieste al Gateway.
- Il firewall o i criteri di rete devono bloccare l'accesso diretto alla porta del Gateway.
- `gateway.trustedProxies` deve elencare esclusivamente gli indirizzi IP di origine del proxy.
- Il proxy deve rimuovere o sovrascrivere gli header di identità e inoltro
  forniti dal client.
- Imposta `gateway.auth.trustedProxy.allowUsers` quando il proxy serve più di
  un gruppo di destinatari.
- Usa `gateway.auth.trustedProxy.allowLoopback` solo per un proxy sullo stesso host,
  quando i processi locali sono attendibili e il proxy controlla gli header di identità.

Esegui `openclaw security audit --deep` dopo le modifiche al proxy. I risultati relativi a `trusted-proxy`
sono particolarmente significativi perché il proxy diventa il confine di
autenticazione.

## Verifica degli strumenti e della sandbox

Prima di esporre un agente a mittenti remoti:

- Verifica quali sessioni vengono eseguite sull'host e quali nella sandbox.
- Nega o richiedi l'approvazione per l'esecuzione sull'host.
- Mantieni disabilitati gli strumenti con privilegi elevati, a meno che non siano necessari a un mittente specifico e attendibile.
- Evita gli strumenti per browser, canvas, Node, Cron, Gateway e creazione di sessioni sulle superfici di messaggistica
  aperte o semiaperte.
- Mantieni limitati i mount bind; evita percorsi relativi a credenziali, home, socket Docker e
  sistema.
- Usa Gateway, utenti del sistema operativo o host separati per confini di attendibilità
  sostanzialmente diversi.

Se gli utenti remoti non sono completamente attendibili, l'isolamento deve derivare da
distribuzioni separate, non soltanto da prompt o etichette di sessione.

## Convalida successiva alle modifiche

Dopo ogni modifica all'esposizione:

1. Esegui nuovamente `openclaw security audit --deep`.
2. Verifica che una connessione autorizzata riesca.
3. Verifica che un mittente o una sessione del browser non autorizzati vengano rifiutati.
4. Verifica che i log oscurino i segreti.
5. Verifica che l'instradamento dei messaggi diretti/dei gruppi raggiunga soltanto l'agente previsto.
6. Verifica che gli strumenti ad alto impatto richiedano l'approvazione o vengano negati.
7. Documenta gli avvisi residui accettati.

Non procedere alla successiva modifica dell'esposizione finché quella corrente non è
stata compresa.

## Piano di ripristino

Se il Gateway potrebbe essere eccessivamente esposto:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Quindi:

1. Interrompi l'inoltro pubblico, Tailscale Funnel o le route del proxy inverso.
2. Ruota i token/le password del Gateway e le credenziali delle integrazioni interessate.
3. Rimuovi `"*"` e i mittenti imprevisti dagli elenchi consentiti.
4. Esamina i log di audit recenti, la cronologia delle esecuzioni, le chiamate agli strumenti e le modifiche alla configurazione.
5. Esegui nuovamente `openclaw security audit --deep`.
6. Riabilita l'accesso con il modello più restrittivo che soddisfa il flusso di lavoro.

## Lista di controllo per la revisione

- Il Gateway rimane accessibile solo tramite loopback, salvo un motivo documentato.
- L'accesso non tramite loopback dispone di autenticazione e firewall e non ha alcun percorso pubblico diretto.
- Le distribuzioni con proxy attendibile hanno indirizzi IP del proxy e controlli degli header restrittivi.
- I messaggi diretti usano l'associazione o elenchi consentiti, non l'accesso aperto per impostazione predefinita.
- I gruppi richiedono menzioni o elenchi consentiti espliciti.
- I canali condivisi non possono accedere alle credenziali personali.
- Le sessioni non principali vengono eseguite in modalità sandbox.
- L'esecuzione sull'host e gli strumenti con privilegi elevati sono negati o subordinati all'approvazione.
- I log oscurano i segreti.
- I problemi critici rilevati dall'audit sono risolti.
- I passaggi di ripristino sono verificati e documentati.
