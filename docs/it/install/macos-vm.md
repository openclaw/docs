---
read_when:
    - Vuoi isolare OpenClaw dal tuo ambiente macOS principale
    - Vuoi integrare iMessage in una sandbox
    - Vuoi un ambiente macOS ripristinabile che puoi clonare
    - Vuoi confrontare le opzioni di macchine virtuali macOS locali e in hosting
summary: Esegui OpenClaw in una VM macOS con sandbox (locale o ospitata) quando hai bisogno di isolamento o di iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-07-12T07:11:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Impostazione predefinita consigliata (per la maggior parte degli utenti)

- **Piccolo VPS Linux** per un Gateway sempre attivo e a basso costo. Consulta [Hosting VPS](/it/vps).
- **Hardware dedicato** (Mac mini o computer Linux) se desideri il controllo completo e un **IP residenziale** per l'automazione del browser. Molti siti bloccano gli IP dei data center, quindi la navigazione locale spesso funziona meglio.
- **Ibrido**: mantieni il Gateway su un VPS economico e connetti il tuo Mac come **Node** quando hai bisogno dell'automazione del browser o dell'interfaccia utente. Consulta [Node](/it/nodes) e [Gateway remoto](/it/gateway/remote).

Usa una VM macOS solo quando hai specificamente bisogno di funzionalità disponibili esclusivamente su macOS, come iMessage, oppure desideri un isolamento rigoroso dal Mac che utilizzi quotidianamente.

## Opzioni per le VM macOS

### VM locale sul tuo Mac Apple Silicon (Lume)

Esegui OpenClaw in una VM macOS con sandbox sul tuo Mac Apple Silicon esistente utilizzando [Lume](https://cua.ai/docs/lume). Questa soluzione offre:

- Ambiente macOS completo e isolato (il sistema host rimane pulito)
- Supporto per iMessage tramite `imsg`; il percorso locale predefinito non è possibile su Linux/Windows
- Ripristino immediato mediante clonazione delle VM
- Nessun costo aggiuntivo per hardware o servizi cloud

### Fornitori di Mac in hosting (cloud)

Se desideri macOS nel cloud, puoi utilizzare anche fornitori di Mac in hosting:

- [MacStadium](https://www.macstadium.com/) (Mac in hosting)
- Sono supportati anche altri fornitori di Mac in hosting; segui la relativa documentazione su VM e SSH

Dopo aver ottenuto l'accesso SSH a una VM macOS, prosegui con [Installare OpenClaw](#6-install-openclaw) più avanti.

## Procedura rapida (Lume, utenti esperti)

1. Installa Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Completa l'Assistente Configurazione e abilita Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Accedi tramite SSH, installa OpenClaw e configura i canali.
6. Operazione completata.

## Requisiti (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia o versione successiva sul sistema host
- Circa 60 GB di spazio libero su disco per ogni VM
- Circa 20 minuti

## 1) Installare Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Se `~/.local/bin` non è incluso nel tuo PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifica:

```bash
lume --version
```

Documentazione: [Installazione di Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Creare la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Questo comando scarica macOS e crea la VM. Si apre automaticamente una finestra VNC.

<Note>
Il download può richiedere del tempo, a seconda della connessione.
</Note>

## 3) Completare l'Assistente Configurazione

Nella finestra VNC:

1. Seleziona la lingua e l'area geografica.
2. Salta l'Apple ID (oppure accedi se desideri usare iMessage in seguito).
3. Crea un account utente (ricorda il nome utente e la password).
4. Salta tutte le funzionalità facoltative.

Al termine della configurazione:

1. Abilita SSH: System Settings -> General -> Sharing, quindi abilita "Remote Login".
2. Per utilizzare la VM senza interfaccia grafica, abilita l'accesso automatico: System Settings -> Users & Groups, seleziona "Automatically log in as:" e scegli l'utente della VM.

## 4) Ottenere l'indirizzo IP della VM

```bash
lume get openclaw
```

Individua l'indirizzo IP (solitamente `192.168.64.x`).

## 5) Accedere alla VM tramite SSH

```bash
ssh youruser@192.168.64.X
```

Sostituisci `youruser` con l'account che hai creato e l'indirizzo IP con quello della VM.

## 6) Installare OpenClaw

All'interno della VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Segui le istruzioni della procedura iniziale per configurare il fornitore del modello (Anthropic, OpenAI e così via).

## 7) Configurare i canali

Modifica il file di configurazione:

```bash
nano ~/.openclaw/openclaw.json
```

Aggiungi i tuoi canali:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Quindi accedi a WhatsApp (scansiona il codice QR):

```bash
openclaw channels login
```

## 8) Eseguire la VM senza interfaccia grafica

Arresta la VM e riavviala senza schermo:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM viene eseguita in background; il daemon di OpenClaw mantiene in esecuzione il Gateway. Per controllare lo stato:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Extra: integrazione con iMessage

Questa è la funzionalità più importante dell'esecuzione su macOS. Usa [iMessage](/it/channels/imessage) con `imsg` per aggiungere Messaggi a OpenClaw.

All'interno della VM:

1. Accedi a Messaggi.
2. Installa `imsg`.
3. Concedi l'accesso completo al disco e l'autorizzazione per l'automazione al processo che esegue OpenClaw/`imsg`.
4. Verifica il supporto RPC con `imsg rpc --help`.

Aggiungi quanto segue alla configurazione di OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Riavvia il Gateway. Ora il tuo agente può inviare e ricevere iMessage. Per i dettagli completi sulla configurazione, consulta [Canale iMessage](/it/channels/imessage).

## Salvare un'immagine master

Prima di procedere con ulteriori personalizzazioni, crea un'istantanea dello stato pulito:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Puoi ripristinarlo in qualsiasi momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Esecuzione 24 ore su 24, 7 giorni su 7

Mantieni la VM in esecuzione:

- Tenendo il Mac collegato all'alimentazione
- Disabilitando la sospensione in System Settings -> Energy Saver
- Utilizzando `caffeinate`, se necessario

Per un funzionamento realmente continuo, valuta un Mac mini dedicato o un piccolo VPS. Consulta [Hosting VPS](/it/vps).

## Risoluzione dei problemi

| Problema                         | Soluzione                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Impossibile accedere alla VM con SSH | Verifica che "Remote Login" sia abilitato nelle System Settings della VM                                            |
| L'IP della VM non viene visualizzato | Attendi il completamento dell'avvio della VM, quindi esegui nuovamente `lume get openclaw`                           |
| Comando Lume non trovato         | Aggiungi `~/.local/bin` al tuo PATH                                                                                     |
| Il codice QR di WhatsApp non viene scansionato | Assicurati di aver effettuato l'accesso alla VM, non al sistema host, quando esegui `openclaw channels login` |

## Documentazione correlata

- [Hosting VPS](/it/vps)
- [Node](/it/nodes)
- [Gateway remoto](/it/gateway/remote)
- [Canale iMessage](/it/channels/imessage)
- [Guida introduttiva di Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Riferimento della CLI di Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configurazione automatica della VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzata)
- [Sandbox con Docker](/it/install/docker) (approccio alternativo all'isolamento)
