---
read_when:
    - Ricerca dello stato dell'app complementare per Linux
    - Pianificazione della copertura delle piattaforme o dei contributi
    - Debug degli arresti per OOM di Linux o del codice di uscita 137 su VPS o container
summary: Supporto per Linux + stato dell'app complementare
title: App Linux
x-i18n:
    generated_at: "2026-07-12T07:11:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Il Gateway è completamente supportato su Linux. Node è il runtime consigliato; Bun
non è consigliato (problemi noti con WhatsApp/Telegram).

Non è ancora disponibile un'app complementare nativa per Linux. I contributi sono benvenuti.

## Percorso rapido (VPS)

1. Installa Node 24 (consigliato) o Node 22.19+ (LTS, ancora supportato).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dal tuo portatile: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Apri `http://127.0.0.1:18789/` e autenticati con il segreto condiviso
   configurato (token per impostazione predefinita; password se `gateway.auth.mode` è `"password"`).

Guida completa per il server: [Server Linux](/it/vps). Esempio dettagliato per VPS:
[exe.dev](/it/install/exe-dev).

## Installazione

- [Primi passi](/it/start/getting-started)
- [Installazione e aggiornamenti](/it/install/updating)
- Facoltativo: [Bun (sperimentale)](/it/install/bun), [Nix](/it/install/nix), [Docker](/it/install/docker)

## Servizio Gateway (systemd)

Installa con uno dei seguenti comandi:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # seleziona "Servizio Gateway" quando richiesto
```

Ripara o migra un'installazione esistente:

```bash
openclaw doctor
```

Per impostazione predefinita, `openclaw gateway install` genera un'unità systemd
**utente**. Le indicazioni complete sul servizio, inclusa la variante dell'unità
a livello di **sistema** per host condivisi o sempre attivi, sono disponibili nel
[manuale operativo del Gateway](/it/gateway#supervision-and-service-lifecycle).

Scrivi manualmente un'unità solo per una configurazione personalizzata. Esempio
minimo di unità utente
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Abilitala:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressione sulla memoria e terminazioni OOM

Su Linux, il kernel seleziona una vittima OOM quando un host, una VM o un cgroup
di un container esaurisce la memoria. Il Gateway è una vittima poco adatta
perché gestisce sessioni e connessioni ai canali di lunga durata, quindi OpenClaw
favorisce, quando possibile, la terminazione preventiva dei processi figli
temporanei.

Per l'avvio dei processi figli Linux idonei, OpenClaw racchiude il comando in un
breve shim `/bin/sh` che aumenta a `1000` il valore `oom_score_adj` del processo
figlio stesso, quindi esegue il comando reale con `exec`. Questa operazione non
richiede privilegi: un processo può sempre aumentare il proprio punteggio OOM.

Superfici dei processi figli interessate:

- Processi figli dei comandi gestiti dal supervisore
- Processi figli della shell PTY
- Processi figli dei server MCP stdio
- Processi del browser/Chrome avviati da OpenClaw (tramite il runtime dei processi dell'SDK del plugin)

Il wrapper è specifico per Linux e viene ignorato quando `/bin/sh` non è
disponibile oppure quando l'ambiente del processo figlio imposta
`OPENCLAW_CHILD_OOM_SCORE_ADJ` su `0`, `false`, `no` o `off`.

Verifica un processo figlio:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Il valore previsto per i processi figli interessati è `1000`; il processo
Gateway mantiene il proprio punteggio normale (solitamente `0`).

L'impostazione `OOMPolicy=continue` dell'unità systemd mantiene attivo il servizio
Gateway quando il terminatore OOM seleziona un processo figlio temporaneo,
anziché contrassegnare come non riuscita l'intera unità e riavviare tutti i
canali; il processo figlio o la sessione non riusciti segnalano il proprio
errore.

Questo comportamento non sostituisce la normale ottimizzazione della memoria.
Se un VPS o un container termina ripetutamente i processi figli, aumenta il
limite di memoria, riduci la concorrenza o aggiungi controlli delle risorse più
rigorosi (`MemoryMax=` di systemd, limiti di memoria del container).

## Risorse correlate

- [Panoramica dell'installazione](/it/install)
- [Server Linux](/it/vps)
- [Raspberry Pi](/it/install/raspberry-pi)
- [Manuale operativo del Gateway](/it/gateway)
- [Configurazione del Gateway](/it/gateway/configuration)
