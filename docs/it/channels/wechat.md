---
read_when:
    - Vuoi connettere OpenClaw a WeChat o Weixin
    - Stai installando o risolvendo problemi relativi al plugin del canale openclaw-weixin
    - Devi capire come vengono eseguiti i plugin dei canali esterni insieme al Gateway
summary: Configurazione del canale WeChat tramite il plugin esterno openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T06:52:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw si connette a WeChat tramite il plugin di canale esterno
`@tencent-weixin/openclaw-weixin` di Tencent.

Stato: plugin esterno, gestito dal team Tencent Weixin. Sono supportate le chat dirette e
i contenuti multimediali. Le chat di gruppo non sono indicate nei metadati delle funzionalità
del plugin (che dichiara solo le chat dirette).

## Nomenclatura

- **WeChat** è il nome rivolto agli utenti in questa documentazione.
- **Weixin** è il nome usato dal pacchetto di Tencent e dall'ID del plugin.
- `openclaw-weixin` è l'ID del canale OpenClaw (`weixin` e `wechat` funzionano come alias).
- `@tencent-weixin/openclaw-weixin` è il pacchetto npm.

Usa `openclaw-weixin` nei comandi CLI e nei percorsi di configurazione.

## Funzionamento

Il codice di WeChat non risiede nel repository principale di OpenClaw. OpenClaw fornisce il
contratto generico per i plugin di canale, mentre il plugin esterno fornisce il runtime
specifico per WeChat:

1. `openclaw plugins install` installa `@tencent-weixin/openclaw-weixin`.
2. Il Gateway rileva il manifesto del plugin e ne carica il punto di ingresso.
3. Il plugin registra l'ID di canale `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` avvia l'accesso tramite codice QR.
5. Il plugin archivia le credenziali dell'account nella directory di stato di OpenClaw
   (`~/.openclaw` per impostazione predefinita).
6. All'avvio del Gateway, il plugin avvia il monitor di Weixin per ogni
   account configurato.
7. I messaggi WeChat in entrata vengono normalizzati tramite il contratto del canale, instradati
   all'agente OpenClaw selezionato e inviati in risposta tramite il percorso in uscita del plugin.

Questa separazione è importante: il nucleo di OpenClaw rimane indipendente dai canali. L'accesso a WeChat,
le chiamate all'API Tencent iLink, il caricamento e lo scaricamento di contenuti multimediali, i token di contesto e il
monitoraggio degli account sono gestiti dal plugin esterno.

## Installazione

Installazione rapida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Installazione manuale:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Riavvia il Gateway dopo l'installazione:

```bash
openclaw gateway restart
```

## Accesso

Esegui l'accesso tramite codice QR sulla stessa macchina che esegue il Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Scansiona il codice QR con WeChat sul telefono e conferma l'accesso. Dopo una scansione
riuscita, il plugin salva localmente il token dell'account.

Per aggiungere un altro account WeChat, esegui di nuovo lo stesso comando di accesso. Per più
account, isola le sessioni dei messaggi diretti in base ad account, canale e mittente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controllo degli accessi

I messaggi diretti usano il normale modello di abbinamento ed elenco consentiti di OpenClaw per i plugin
di canale.

Approva i nuovi mittenti:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Per il modello completo di controllo degli accessi, consulta [Abbinamento](/it/channels/pairing).

## Compatibilità

Il plugin controlla all'avvio la versione di OpenClaw dell'host.

| Serie del plugin | Versione di OpenClaw                                             | Tag npm  |
| ---------------- | ---------------------------------------------------------------- | -------- |
| `2.x`            | `>=2026.5.12` (attuale 2.4.6; le prime 2.x accettavano `>=2026.3.22`) | `latest` |
| `1.x`            | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Se il plugin segnala che la versione di OpenClaw è troppo vecchia, aggiorna
OpenClaw oppure installa la serie legacy del plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo sidecar

Il plugin WeChat può eseguire attività ausiliarie accanto al Gateway mentre monitora
l'API Tencent iLink. Nel problema #68451, questo percorso ausiliario ha rivelato un bug nella
pulizia generica dei Gateway obsoleti di OpenClaw: un processo figlio poteva tentare di ripulire il processo
Gateway padre, causando cicli di riavvio con gestori di processi come systemd.

L'attuale pulizia all'avvio di OpenClaw esclude il processo corrente e i suoi antenati,
quindi un processo ausiliario del canale non può terminare il Gateway che lo ha avviato. Questa correzione è
generica e non costituisce un percorso specifico per WeChat nel nucleo.

## Risoluzione dei problemi

Controlla l'installazione e lo stato:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se il canale risulta installato ma non si connette, verifica che il plugin sia
abilitato e riavvia:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se il Gateway si riavvia ripetutamente dopo l'abilitazione di WeChat, aggiorna sia OpenClaw sia
il plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Se all'avvio viene segnalato che il pacchetto del plugin installato `requires compiled runtime
output for TypeScript entry`, il pacchetto npm è stato pubblicato senza i file runtime JavaScript
compilati necessari a OpenClaw. Aggiorna o reinstalla il plugin dopo che il relativo
autore avrà pubblicato un pacchetto corretto, oppure disabilita o disinstalla temporaneamente il plugin.

Disabilitazione temporanea:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentazione correlata

- Panoramica dei canali: [Canali di chat](/it/channels)
- Abbinamento: [Abbinamento](/it/channels/pairing)
- Instradamento dei canali: [Instradamento dei canali](/it/channels/channel-routing)
- Architettura dei plugin: [Architettura dei plugin](/it/plugins/architecture)
- SDK per i plugin di canale: [SDK per i plugin di canale](/it/plugins/sdk-channel-plugins)
- Pacchetto esterno: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
