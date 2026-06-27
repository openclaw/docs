---
read_when:
    - Vuoi mantenere OpenClaw isolato dal tuo ambiente macOS principale
    - Vuoi l'integrazione con iMessage in una sandbox
    - Vuoi un ambiente macOS ripristinabile che puoi clonare
    - Vuoi confrontare le opzioni di VM macOS locali e ospitate
summary: Esegui OpenClaw in una VM macOS in sandbox (locale o ospitata) quando hai bisogno di isolamento o iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-06-27T17:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Impostazione predefinita consigliata (la maggior parte degli utenti)

- **Piccolo VPS Linux** per un Gateway sempre attivo e a basso costo. Vedi [hosting VPS](/it/vps).
- **Hardware dedicato** (Mac mini o macchina Linux) se vuoi il pieno controllo e un **IP residenziale** per l'automazione del browser. Molti siti bloccano gli IP dei data center, quindi la navigazione locale spesso funziona meglio.
- **Ibrido:** mantieni il Gateway su un VPS economico e collega il tuo Mac come **Node** quando hai bisogno di automazione browser/UI. Vedi [Node](/it/nodes) e [Gateway remoto](/it/gateway/remote).

Usa una VM macOS quando ti servono specificamente funzionalità disponibili solo su macOS, come iMessage, o vuoi un isolamento rigoroso dal tuo Mac quotidiano.

## Opzioni VM macOS

### VM locale sul tuo Mac Apple Silicon (Lume)

Esegui OpenClaw in una VM macOS in sandbox sul tuo Mac Apple Silicon esistente usando [Lume](https://cua.ai/docs/lume).

Questo ti offre:

- Ambiente macOS completo in isolamento (l'host resta pulito)
- Supporto iMessage tramite `imsg` (il percorso locale predefinito è impossibile su Linux/Windows)
- Ripristino istantaneo clonando le VM
- Nessun costo aggiuntivo per hardware o cloud

### Provider Mac ospitati (cloud)

Se vuoi macOS nel cloud, funzionano anche i provider Mac ospitati:

- [MacStadium](https://www.macstadium.com/) (Mac ospitati)
- Funzionano anche altri fornitori di Mac ospitati; segui la loro documentazione VM + SSH

Una volta ottenuto l'accesso SSH a una VM macOS, continua dal passaggio 6 qui sotto.

---

## Percorso rapido (Lume, utenti esperti)

1. Installa Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Completa Impostazione Assistita, abilita Login remoto (SSH)
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

Questo scarica macOS e crea la VM. Si apre automaticamente una finestra VNC.

<Note>
Il download può richiedere un po' di tempo a seconda della tua connessione.
</Note>

---

## 3) Completa Impostazione Assistita

Nella finestra VNC:

1. Seleziona lingua e area geografica
2. Salta Apple ID (oppure accedi se vuoi usare iMessage in seguito)
3. Crea un account utente (ricorda nome utente e password)
4. Salta tutte le funzionalità opzionali

Al termine della configurazione:

1. Abilita SSH: apri Impostazioni di Sistema -> Generali -> Condivisione e abilita "Login remoto".
2. Per usare la VM senza interfaccia, abilita il login automatico: apri Impostazioni di Sistema -> Utenti e Gruppi, seleziona "Accedi automaticamente come:" e scegli l'utente della VM.

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

Segui i prompt di onboarding per configurare il tuo provider di modelli (Anthropic, OpenAI, ecc.).

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

La VM viene eseguita in background. Il daemon di OpenClaw mantiene in esecuzione il Gateway.

Per controllare lo stato:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrazione iMessage

Questa è la funzionalità distintiva dell'esecuzione su macOS. Usa [iMessage](/it/channels/imessage) con `imsg` per aggiungere Messaggi a OpenClaw.

Dentro la VM:

1. Accedi a Messaggi.
2. Installa `imsg`.
3. Concedi Accesso completo al disco e l'autorizzazione Automazione al processo che esegue OpenClaw/`imsg`.
4. Verifica il supporto RPC con `imsg rpc --help`.

Aggiungi alla tua configurazione OpenClaw:

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

Riavvia il Gateway. Ora il tuo agente può inviare e ricevere iMessage.

Dettagli completi di configurazione: [canale iMessage](/it/channels/imessage)

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
- Disabilitando lo stop in Impostazioni di Sistema → Risparmio Energia
- Usando `caffeinate` se necessario

Per un vero sistema sempre attivo, considera un Mac mini dedicato o un piccolo VPS. Vedi [hosting VPS](/it/vps).

---

## Risoluzione dei problemi

| Problema                  | Soluzione                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Impossibile accedere alla VM via SSH | Controlla che "Login remoto" sia abilitato nelle Impostazioni di Sistema della VM |
| IP della VM non visibile | Attendi che la VM completi l'avvio, poi esegui di nuovo `lume get openclaw` |
| Comando Lume non trovato | Aggiungi `~/.local/bin` al tuo PATH |
| Il QR di WhatsApp non viene scansionato | Assicurati di aver effettuato l'accesso alla VM (non all'host) quando esegui `openclaw channels login` |

---

## Documentazione correlata

- [hosting VPS](/it/vps)
- [Node](/it/nodes)
- [Gateway remoto](/it/gateway/remote)
- [canale iMessage](/it/channels/imessage)
- [Avvio rapido Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Riferimento CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configurazione VM non presidiata](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzato)
- [Sandboxing Docker](/it/install/docker) (approccio di isolamento alternativo)
