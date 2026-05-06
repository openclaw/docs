---
read_when:
    - Vuoi mantenere OpenClaw isolato dal tuo ambiente macOS principale
    - Vuoi l'integrazione con iMessage (BlueBubbles) in un ambiente isolato
    - Vuoi un ambiente macOS ripristinabile che puoi clonare
    - Vuoi confrontare le opzioni di VM macOS locali rispetto a quelle ospitate
summary: Esegui OpenClaw in una VM macOS isolata (locale o ospitata) quando hai bisogno di isolamento o di iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-05-06T08:57:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Predefinito consigliato (per la maggior parte degli utenti)

- **Piccola VPS Linux** per un Gateway sempre attivo e a basso costo. Vedi [hosting VPS](/it/vps).
- **Hardware dedicato** (Mac mini o macchina Linux) se vuoi il pieno controllo e un **IP residenziale** per l'automazione del browser. Molti siti bloccano gli IP dei data center, quindi la navigazione locale spesso funziona meglio.
- **Ibrido:** mantieni il Gateway su una VPS economica e collega il tuo Mac come **Node** quando hai bisogno di automazione del browser/UI. Vedi [Nodes](/it/nodes) e [Gateway remoto](/it/gateway/remote).

Usa una VM macOS quando hai specificamente bisogno di funzionalità disponibili solo su macOS (iMessage/BlueBubbles) o vuoi un isolamento rigoroso dal tuo Mac quotidiano.

## Opzioni VM macOS

### VM locale sul tuo Mac Apple Silicon (Lume)

Esegui OpenClaw in una VM macOS in sandbox sul tuo Mac Apple Silicon esistente usando [Lume](https://cua.ai/docs/lume).

Questo ti offre:

- Ambiente macOS completo in isolamento (il tuo host resta pulito)
- Supporto iMessage tramite BlueBubbles (impossibile su Linux/Windows)
- Ripristino istantaneo clonando le VM
- Nessun hardware aggiuntivo o costo cloud

### Provider Mac in hosting (cloud)

Se vuoi macOS nel cloud, vanno bene anche i provider Mac in hosting:

- [MacStadium](https://www.macstadium.com/) (Mac in hosting)
- Funzionano anche altri fornitori di Mac in hosting; segui la loro documentazione su VM + SSH

Una volta ottenuto l'accesso SSH a una VM macOS, continua dal passaggio 6 qui sotto.

---

## Percorso rapido (Lume, utenti esperti)

1. Installa Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Completa Setup Assistant, abilita Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Accedi via SSH, installa OpenClaw, configura i canali
6. Fatto

---

## Cosa ti serve (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia o successivo sull'host
- ~60 GB di spazio libero su disco per VM
- ~20 minuti

---

## 1) Installa Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Se `~/.local/bin` non è nel tuo PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifica:

```bash
lume --version
```

Documentazione: [Installazione di Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Crea la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Questo scarica macOS e crea la VM. Una finestra VNC si apre automaticamente.

<Note>
Il download può richiedere un po' di tempo a seconda della tua connessione.
</Note>

---

## 3) Completa Setup Assistant

Nella finestra VNC:

1. Seleziona lingua e area geografica
2. Salta Apple ID (oppure accedi se vuoi iMessage in seguito)
3. Crea un account utente (ricorda nome utente e password)
4. Salta tutte le funzionalità opzionali

Al termine della configurazione, abilita SSH:

1. Apri System Settings → General → Sharing
2. Abilita "Remote Login"

---

## 4) Ottieni l'indirizzo IP della VM

```bash
lume get openclaw
```

Cerca l'indirizzo IP (di solito `192.168.64.x`).

---

## 5) Accedi alla VM via SSH

```bash
ssh youruser@192.168.64.X
```

Sostituisci `youruser` con l'account che hai creato e l'IP con l'IP della tua VM.

---

## 6) Installa OpenClaw

Dentro la VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Segui le richieste di onboarding per configurare il tuo provider di modelli (Anthropic, OpenAI, ecc.).

---

## 7) Configura i canali

Modifica il file di configurazione:

```bash
nano ~/.openclaw/openclaw.json
```

Aggiungi i tuoi canali:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Poi accedi a WhatsApp (scansiona il QR):

```bash
openclaw channels login
```

---

## 8) Esegui la VM senza interfaccia grafica

Ferma la VM e riavviala senza display:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM viene eseguita in background. Il demone di OpenClaw mantiene in esecuzione il Gateway.

Per controllare lo stato:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrazione iMessage

Questa è la funzionalità principale dell'esecuzione su macOS. Usa [BlueBubbles](https://bluebubbles.app) per aggiungere iMessage a OpenClaw.

Dentro la VM:

1. Scarica BlueBubbles da bluebubbles.app
2. Accedi con il tuo Apple ID
3. Abilita la Web API e imposta una password
4. Punta i Webhook di BlueBubbles al tuo Gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Aggiungi alla configurazione di OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Riavvia il Gateway. Ora il tuo agente può inviare e ricevere iMessage.

Dettagli completi di configurazione: [canale BlueBubbles](/it/channels/bluebubbles)

---

## Salva un'immagine golden

Prima di personalizzare ulteriormente, crea uno snapshot dello stato pulito:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Ripristina in qualsiasi momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Esecuzione 24/7

Mantieni la VM in esecuzione:

- Tenendo il Mac collegato all'alimentazione
- Disabilitando lo stop in System Settings → Energy Saver
- Usando `caffeinate` se necessario

Per un vero funzionamento sempre attivo, considera un Mac mini dedicato o una piccola VPS. Vedi [hosting VPS](/it/vps).

---

## Risoluzione dei problemi

| Problema                 | Soluzione                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Impossibile accedere alla VM via SSH | Controlla che "Remote Login" sia abilitato nelle System Settings della VM |
| L'IP della VM non appare | Attendi che la VM completi l'avvio, esegui di nuovo `lume get openclaw`            |
| Comando Lume non trovato | Aggiungi `~/.local/bin` al tuo PATH                                                |
| Il QR di WhatsApp non viene scansionato | Assicurati di essere connesso alla VM (non all'host) quando esegui `openclaw channels login` |

---

## Documentazione correlata

- [hosting VPS](/it/vps)
- [Nodes](/it/nodes)
- [Gateway remoto](/it/gateway/remote)
- [canale BlueBubbles](/it/channels/bluebubbles)
- [Quickstart di Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Riferimento CLI di Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configurazione VM non presidiata](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzato)
- [Sandboxing Docker](/it/install/docker) (approccio di isolamento alternativo)
