---
read_when:
    - Esporre il Gateway su LAN, tailnet, Tailscale Serve, Funnel o un reverse proxy
    - Esaminare un deployment prima di consentire utenti di messaggistica reali
    - Ripristino di una configurazione rischiosa di accesso remoto o DM
sidebarTitle: Exposure runbook
summary: Checklist preliminare e di rollback prima di esporre un Gateway OpenClaw oltre il loopback
title: Runbook di esposizione del Gateway
x-i18n:
    generated_at: "2026-06-27T17:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Esponi il Gateway solo dopo che sai spiegare chi può raggiungerlo, come viene
autenticato, quali agenti può attivare e quali strumenti quegli agenti possono
usare. In caso di dubbio, torna all'accesso solo loopback e riesegui l'audit.
</Warning>

Questo runbook trasforma la guida più ampia sulla [Sicurezza](/it/gateway/security) in una
checklist operativa per l'accesso remoto e l'esposizione della messaggistica.

## Scegli il modello di esposizione

Preferisci il modello più ristretto che soddisfa il flusso di lavoro.

| Modello                    | Consigliato quando                              | Controlli richiesti                                                                                 |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + tunnel SSH      | Uso personale, accesso amministrativo, debug    | Mantieni `gateway.bind: "loopback"` e crea un tunnel verso `127.0.0.1:18789`                        |
| Loopback + Tailscale Serve | Accesso tailnet personale a Control UI/WebSocket | Mantieni il Gateway solo loopback; affidati agli header di identità Tailscale solo per le superfici supportate |
| Bind su tailnet/LAN        | Rete privata dedicata con dispositivi noti      | Autenticazione Gateway, allowlist del firewall, nessun port-forward pubblico                        |
| Reverse proxy attendibile  | SSO/OIDC dell'organizzazione davanti al Gateway | Autenticazione `trusted-proxy`, `trustedProxies` rigorosi, regole di sovrascrittura/rimozione degli header, utenti consentiti espliciti |
| Internet pubblico          | Distribuzioni rare e ad alto rischio            | Proxy identity-aware, TLS, limiti di frequenza, allowlist rigorose, sessioni non-main in sandbox    |

Evita il port-forwarding pubblico diretto verso il Gateway. Se ti serve accesso pubblico,
metti davanti un proxy identity-aware e rendi il proxy l'unico percorso di rete
verso il Gateway.

## Inventario preliminare

Registra questi elementi prima di modificare bind, proxy, Tailscale o policy dei canali:

- Host del Gateway, utente del sistema operativo e directory di stato.
- URL del Gateway e modalità di bind.
- Modalità di autenticazione, origine del token/password o origine dell'identità del proxy attendibile.
- Tutti i canali abilitati e se accettano DM, gruppi o webhook.
- Agenti raggiungibili da mittenti non locali.
- Profilo degli strumenti, modalità sandbox e policy degli strumenti elevati per ogni agente raggiungibile.
- Credenziali esterne disponibili per quegli agenti.
- Posizione del backup per `~/.openclaw/openclaw.json` e le credenziali.

Se più di una persona può inviare messaggi al bot, trattalo come autorità condivisa
delegata sugli strumenti, non come isolamento host per utente.

## Controlli di base

Esegui questi comandi prima di aprire l'accesso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Risolvi prima i risultati critici. Gli avvisi possono essere accettabili solo quando sono
intenzionali e documentati per la distribuzione.

Per la convalida CLI remota, passa le credenziali esplicitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Non presumere che le credenziali della configurazione locale si applichino a un URL remoto esplicito.

## Baseline minima sicura

Usa questa forma come punto di partenza per le distribuzioni esposte:

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

Poi amplia un controllo alla volta. Ad esempio, aggiungi una allowlist specifica del canale
prima di abilitare strumenti capaci di scrivere, oppure abilita un reverse proxy prima di accettare
traffico remoto della Control UI.

La baseline rigorosa `exec.security: "deny"` blocca tutte le chiamate exec, incluse
diagnostiche innocue. Se sono necessarie diagnostiche o comandi a basso rischio, rilassala
solo dopo aver scelto i mittenti, gli agenti, i comandi e la modalità di approvazione specifici
che corrispondono al tuo modello di minaccia.

## Esposizione di DM e gruppi

I canali di messaggistica sono superfici di input non attendibili. Prima di consentire DM o gruppi:

- Preferisci `dmPolicy: "pairing"` o liste `allowFrom` rigorose.
- Evita `dmPolicy: "open"` a meno che ogni mittente sia attendibile.
- Non combinare allowlist `"*"` con accesso ampio agli strumenti.
- Richiedi menzioni nei gruppi a meno che la stanza sia strettamente controllata.
- Usa `session.dmScope: "per-channel-peer"` quando più persone possono inviare DM al bot.
- Instrada i canali condivisi verso agenti con strumenti minimi e senza credenziali personali.

Il pairing autorizza il mittente ad attivare il bot. Non rende quel mittente un
confine di sicurezza host separato.

## Controlli del reverse proxy

Per i proxy identity-aware:

- Il proxy deve autenticare gli utenti prima di inoltrare al Gateway.
- L'accesso diretto alla porta del Gateway deve essere bloccato da firewall o policy di rete.
- `gateway.trustedProxies` deve contenere solo gli IP sorgente del proxy.
- Il proxy deve rimuovere o sovrascrivere gli header di identità e inoltro forniti dal client.
- `gateway.auth.trustedProxy.allowUsers` dovrebbe elencare gli utenti previsti quando il proxy serve più di un pubblico.
- La modalità proxy loopback sullo stesso host dovrebbe usare `allowLoopback` solo quando i processi locali sono attendibili e il proxy possiede gli header di identità.

Esegui `openclaw security audit --deep` dopo le modifiche al proxy. I risultati sul trusted-proxy
sono intenzionalmente ad alto segnale perché il proxy diventa il confine di autenticazione.

## Revisione di strumenti e sandbox

Prima di esporre un agente a mittenti remoti:

- Conferma quali sessioni vengono eseguite sull'host rispetto alla sandbox.
- Nega o richiedi approvazione per l'exec sull'host.
- Mantieni disabilitati gli strumenti elevati a meno che un mittente specifico e attendibile ne abbia bisogno.
- Evita strumenti browser, canvas, node, cron, gateway e session-spawn per superfici di messaggistica aperte o semiaperte.
- Mantieni i bind mount ristretti ed evita credenziali, home, socket Docker e percorsi di sistema.
- Usa gateway, utenti del sistema operativo o host separati per confini di fiducia materialmente diversi.

Se gli utenti remoti non sono completamente attendibili, l'isolamento deve provenire da
distribuzioni separate, non solo da prompt o etichette di sessione.

## Convalida post-modifica

Dopo ogni modifica di esposizione:

1. Riesegui `openclaw security audit --deep`.
2. Testa una connessione autorizzata riuscita.
3. Testa che un mittente o una sessione browser non autorizzati vengano negati.
4. Conferma che i log redigano i segreti.
5. Conferma che l'instradamento DM/gruppo raggiunga solo l'agente previsto.
6. Conferma che gli strumenti ad alto impatto chiedano approvazione o vengano negati.
7. Documenta gli avvisi residui accettati.

Non procedere alla modifica di esposizione successiva finché quella corrente non è compresa.

## Piano di rollback

Se il Gateway potrebbe essere sovraesposto:

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

Poi:

1. Interrompi l'inoltro pubblico, Tailscale Funnel o le route del reverse proxy.
2. Ruota i token/password del Gateway e le credenziali delle integrazioni interessate.
3. Rimuovi `"*"` e mittenti imprevisti dalle allowlist.
4. Esamina i log di audit recenti, la cronologia delle esecuzioni, le chiamate agli strumenti e le modifiche alla configurazione.
5. Riesegui `openclaw security audit --deep`.
6. Riabilita l'accesso con il modello più ristretto che soddisfa il flusso di lavoro.

## Checklist di revisione

- Il Gateway resta solo loopback a meno che ci sia un motivo documentato.
- L'accesso non-loopback ha autenticazione, firewall e nessuna route diretta pubblica.
- Le distribuzioni con trusted-proxy hanno IP del proxy e controlli degli header rigorosi.
- I DM usano pairing o allowlist, non accesso aperto per impostazione predefinita.
- I gruppi richiedono menzioni o allowlist esplicite.
- I canali condivisi non raggiungono credenziali personali.
- Le sessioni non-main vengono eseguite in modalità sandbox.
- L'exec sull'host e gli strumenti elevati sono negati o protetti da approvazione.
- I log redigono i segreti.
- I risultati critici dell'audit sono risolti.
- I passaggi di rollback sono testati e documentati.
