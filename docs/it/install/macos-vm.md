---
read_when:
    - Vuoi OpenClaw isolato dal tuo ambiente macOS principale
    - Vuoi l'integrazione con iMessage (BlueBubbles) in un sandbox
    - Vuoi un ambiente macOS ripristinabile che puoi clonare
    - Vuoi confrontare opzioni di VM macOS locali e ospitate
summary: Esegui OpenClaw in una VM macOS sandboxata (locale o ospitata) quando hai bisogno di isolamento o iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-04-05T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw su VM macOS (Sandboxing)

## Impostazione predefinita consigliata (per la maggior parte degli utenti)

- **Piccolo VPS Linux** per un Gateway sempre attivo e a basso costo. Vedi [VPS hosting](/vps).
- **Hardware dedicato** (Mac mini o box Linux) se vuoi pieno controllo e un **IP residenziale** per l'automazione del browser. Molti siti bloccano gli IP dei data center, quindi la navigazione locale spesso funziona meglio.
- **Ibrido:** mantieni il Gateway su un VPS economico e collega il tuo Mac come **node** quando hai bisogno di automazione browser/UI. Vedi [Nodes](/nodes) e [Gateway remote](/gateway/remote).

Usa una VM macOS quando hai bisogno in particolare di funzionalità esclusive di macOS (iMessage/BlueBubbles) o vuoi un isolamento rigoroso dal tuo Mac quotidiano.

## Opzioni per VM macOS

### VM locale sul tuo Mac Apple Silicon (Lume)

Esegui OpenClaw in una VM macOS sandboxata sul tuo Mac Apple Silicon esistente usando [Lume](https://cua.ai/docs/lume).

Questo ti offre:

- Ambiente macOS completo in isolamento (il tuo host resta pulito)
- Supporto iMessage tramite BlueBubbles (impossibile su Linux/Windows)
- Ripristino istantaneo clonando le VM
- Nessun costo aggiuntivo per hardware o cloud

### Provider Mac ospitati (cloud)

Se vuoi macOS nel cloud, vanno bene anche i provider Mac ospitati:

- [MacStadium](https://www.macstadium.com/) (Mac ospitati)
- Anche altri fornitori di Mac ospitati funzionano; segui la loro documentazione su VM + SSH

Una volta che hai l'accesso SSH a una VM macOS, continua dal passaggio 6 qui sotto.

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

Documentazione: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Crea la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Questo scarica macOS e crea la VM. Si apre automaticamente una finestra VNC.

Nota: il download può richiedere un po' di tempo a seconda della tua connessione.

---

## 3) Completa Setup Assistant

Nella finestra VNC:

1. Seleziona lingua e regione
2. Salta Apple ID (oppure accedi se vuoi iMessage in seguito)
3. Crea un account utente (ricorda nome utente e password)
4. Salta tutte le funzionalità facoltative

Dopo che la configurazione è completata, abilita SSH:

1. Apri Impostazioni di Sistema → Generali → Condivisione
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

All'interno della VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Segui le richieste dell'onboarding per configurare il tuo provider di modelli (Anthropic, OpenAI, ecc.).

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

## 8) Esegui la VM senza interfaccia

Arresta la VM e riavviala senza display:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM viene eseguita in background. Il daemon di OpenClaw mantiene il gateway in esecuzione.

Per controllare lo stato:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrazione con iMessage

Questa è la funzionalità decisiva dell'esecuzione su macOS. Usa [BlueBubbles](https://bluebubbles.app) per aggiungere iMessage a OpenClaw.

All'interno della VM:

1. Scarica BlueBubbles da bluebubbles.app
2. Accedi con il tuo Apple ID
3. Abilita la Web API e imposta una password
4. Punta i webhook BlueBubbles al tuo gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Aggiungi alla tua configurazione OpenClaw:

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

Riavvia il gateway. Ora il tuo agente può inviare e ricevere iMessage.

Dettagli completi della configurazione: [BlueBubbles channel](/it/channels/bluebubbles)

---

## Salva un'immagine golden

Prima di personalizzare ulteriormente, crea uno snapshot del tuo stato pulito:

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
- Disabilitando la modalità stop in Impostazioni di Sistema → Risparmio Energia
- Usando `caffeinate` se necessario

Per un vero always-on, considera un Mac mini dedicato o un piccolo VPS. Vedi [VPS hosting](/vps).

---

## Troubleshooting

| Problema                 | Soluzione                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Impossibile accedere via SSH alla VM | Controlla che "Remote Login" sia abilitato nelle Impostazioni di Sistema della VM |
| L'IP della VM non viene mostrato | Attendi che la VM completi l'avvio, poi esegui di nuovo `lume get openclaw`      |
| Comando Lume non trovato | Aggiungi `~/.local/bin` al tuo PATH                                               |
| Il QR di WhatsApp non viene scansionato | Assicurati di aver effettuato l'accesso alla VM (non all'host) quando esegui `openclaw channels login` |

---

## Documenti correlati

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/it/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzato)
- [Docker Sandboxing](/install/docker) (approccio alternativo di isolamento)
