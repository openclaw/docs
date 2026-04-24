---
read_when:
    - Vuoi connettere OpenClaw a WeChat o Weixin
    - Stai installando o risolvendo i problemi del Plugin di canale openclaw-weixin
    - Devi capire come i Plugin di canale esterni vengono eseguiti accanto al Gateway
summary: Configurazione del canale WeChat tramite il Plugin esterno openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T08:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw si connette a WeChat tramite il Plugin di canale esterno di Tencent
`@tencent-weixin/openclaw-weixin`.

Stato: Plugin esterno. Le chat dirette e i contenuti multimediali sono supportati. Le chat di gruppo non sono
pubblicizzate dagli attuali metadati di capacità del plugin.

## Denominazione

- **WeChat** è il nome visibile all'utente in questa documentazione.
- **Weixin** è il nome usato dal pacchetto Tencent e dall'ID del plugin.
- `openclaw-weixin` è l'ID canale OpenClaw.
- `@tencent-weixin/openclaw-weixin` è il pacchetto npm.

Usa `openclaw-weixin` nei comandi CLI e nei percorsi di configurazione.

## Come funziona

Il codice WeChat non si trova nel repository core di OpenClaw. OpenClaw fornisce il
contratto generico dei Plugin di canale, e il Plugin esterno fornisce il
runtime specifico per WeChat:

1. `openclaw plugins install` installa `@tencent-weixin/openclaw-weixin`.
2. Il Gateway rileva il manifest del Plugin e carica l'entrypoint del Plugin.
3. Il Plugin registra l'ID canale `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` avvia l'accesso tramite QR.
5. Il Plugin memorizza le credenziali dell'account nella directory di stato di OpenClaw.
6. Quando il Gateway si avvia, il Plugin avvia il monitor Weixin per ogni
   account configurato.
7. I messaggi WeChat in ingresso vengono normalizzati tramite il contratto di canale, instradati all'
   agente OpenClaw selezionato e reinviati tramite il percorso in uscita del Plugin.

Questa separazione è importante: il core di OpenClaw deve restare indipendente dal canale. L'accesso WeChat,
le chiamate API Tencent iLink, l'upload/download dei contenuti multimediali, i token di contesto e il
monitoraggio degli account appartengono al Plugin esterno.

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

Esegui l'accesso tramite QR sulla stessa macchina che esegue il Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Scansiona il codice QR con WeChat sul tuo telefono e conferma l'accesso. Il Plugin salva
localmente il token dell'account dopo una scansione riuscita.

Per aggiungere un altro account WeChat, esegui di nuovo lo stesso comando di accesso. Per più
account, isola le sessioni dei messaggi diretti per account, canale e mittente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controllo degli accessi

I messaggi diretti usano il normale modello di associazione e allowlist di OpenClaw per i Plugin
di canale.

Approva nuovi mittenti:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Per il modello completo di controllo degli accessi, vedi [Associazione](/it/channels/pairing).

## Compatibilità

Il Plugin controlla la versione dell'host OpenClaw all'avvio.

| Linea del Plugin | Versione OpenClaw        | Tag npm  |
| ---------------- | ------------------------ | -------- |
| `2.x`            | `>=2026.3.22`           | `latest` |
| `1.x`            | `>=2026.1.0 <2026.3.22` | `legacy` |

Se il Plugin segnala che la tua versione di OpenClaw è troppo vecchia, aggiorna
OpenClaw oppure installa la linea legacy del Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo sidecar

Il Plugin WeChat può eseguire lavoro di supporto accanto al Gateway mentre monitora la
API Tencent iLink. Nel problema #68451, questo percorso di supporto ha esposto un bug nella
pulizia generica dei Gateway obsoleti di OpenClaw: un processo figlio poteva tentare di pulire il
processo Gateway padre, causando cicli di riavvio con gestori di processo come systemd.

L'attuale pulizia all'avvio di OpenClaw esclude il processo corrente e i suoi antenati,
quindi un supporto di canale non deve uccidere il Gateway che lo ha avviato. Questa correzione è
generica; non è un percorso specifico di WeChat nel core.

## Risoluzione dei problemi

Controlla installazione e stato:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se il canale risulta installato ma non si connette, conferma che il Plugin sia
abilitato e riavvia:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se il Gateway si riavvia ripetutamente dopo aver abilitato WeChat, aggiorna sia OpenClaw sia
il Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Disabilitazione temporanea:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentazione correlata

- Panoramica dei canali: [Canali chat](/it/channels)
- Associazione: [Associazione](/it/channels/pairing)
- Instradamento del canale: [Instradamento del canale](/it/channels/channel-routing)
- Architettura dei Plugin: [Architettura dei Plugin](/it/plugins/architecture)
- SDK Plugin di canale: [SDK Plugin di canale](/it/plugins/sdk-channel-plugins)
- Pacchetto esterno: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
