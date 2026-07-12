---
read_when:
    - Progettazione dell'assistente di configurazione iniziale per macOS
    - Implementazione della configurazione dell'autenticazione o dell'identità
sidebarTitle: 'Onboarding: macOS App'
summary: Flusso di configurazione iniziale di OpenClaw (app macOS)
title: Configurazione iniziale (app macOS)
x-i18n:
    generated_at: "2026-07-12T07:31:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Il flusso di primo avvio dell'app macOS: scegli dove viene eseguito il Gateway, connetti un backend AI verificato, concedi le autorizzazioni e passa al rituale di bootstrap dell'agente.
Per l'onboarding tramite CLI e un confronto tra i due percorsi, consulta [Panoramica dell'onboarding](/it/start/onboarding-overview).

<Steps>
<Step title="Approva l'avviso di macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approva la ricerca delle reti locali">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Benvenuto e avviso di sicurezza">
<Frame caption="Leggi l'avviso di sicurezza visualizzato e decidi di conseguenza">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modello di fiducia per la sicurezza:

- Per impostazione predefinita, OpenClaw è un agente personale: un unico perimetro con un operatore fidato.
- Le configurazioni condivise o multiutente devono essere protette: separa i perimetri di fiducia, riduci al minimo l'accesso agli strumenti e segui le indicazioni in [Sicurezza](/it/gateway/security).
- L'onboarding locale imposta per le nuove configurazioni il valore predefinito `tools.profile: "coding"`, affinché le nuove installazioni mantengano gli strumenti per il filesystem e l'ambiente di esecuzione senza il profilo `full` privo di restrizioni.
- Se sono abilitati hook, Webhook o altri flussi di contenuti non attendibili, usa un modello moderno di fascia alta e mantieni criteri rigorosi per gli strumenti e l'isolamento in sandbox.

</Step>
<Step title="Locale o remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Dove viene eseguito il **Gateway**?

- **Questo Mac (solo locale):** l'onboarding configura l'autenticazione e salva le credenziali localmente.
- **Remoto (tramite SSH/Tailnet):** l'onboarding **non** configura l'autenticazione locale;
  le credenziali devono essere già presenti sull'host del Gateway. Il campo del token del Gateway remoto
  memorizza il token utilizzato dall'app macOS per connettersi a quel Gateway;
  i valori SecretRef esistenti di `gateway.remote.token` vengono conservati finché non
  li sostituisci.
- **Configura in seguito:** salta la configurazione e lascia l'app non configurata.

<Tip>
**Suggerimento per l'autenticazione del Gateway:**

- La modalità di autenticazione del Gateway usa per impostazione predefinita `token` anche per i binding loopback, quindi i client WS locali devono autenticarsi.
- L'impostazione `gateway.auth.mode: "none"` consente la connessione a qualsiasi processo locale; usala solo su macchine completamente attendibili.
- Usa un token per l'accesso da più macchine o per i binding non loopback.

</Tip>
</Step>
<Step title="CLI">
  La configurazione locale installa la CLI globale `openclaw` tramite npm, pnpm o bun,
  dando la precedenza a npm. Node rimane l'ambiente di esecuzione consigliato per il Gateway
  stesso. Le installazioni compatibili esistenti vengono riutilizzate.
</Step>
<Step title="Connetti la tua AI">
  Se un Gateway connesso dispone già di un modello di agente configurato, questa
  pagina viene ignorata completamente e si apre la normale interfaccia dell'agente. La configurazione
  di Crestodian e del fornitore viene eseguita solo per un Gateway nuovo o incompleto.

Quando il Gateway è pronto, l'onboarding cerca gli accessi AI già disponibili:
un login a Claude Code o Codex oppure `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. L'opzione migliore viene verificata con un completamento reale e
salvata solo dopo aver ricevuto una risposta; quando un test non riesce, l'app prova automaticamente
l'opzione successiva e mostra il motivo per cui quella precedente non ha funzionato. Se vengono trovate
più opzioni, puoi passare da una all'altra prima di continuare.

Gemini CLI rimane disponibile per gli agenti normali dopo la configurazione, ma non viene
proposta qui perché non può imporre il test di inferenza senza strumenti.

Puoi anche accedere tramite il flusso OAuth o di associazione del dispositivo del fornitore.
Le opzioni integrate includono OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global e CN e Chutes. L'elenco proviene dai
Plugin attivi del Gateway per l'inferenza testuale anziché da un elenco fisso dell'app,
quindi un altro fornitore può aderire senza aggiungere codice macOS specifico per il fornitore.

Il selettore manuale di chiavi o token utilizza lo stesso registro dei fornitori. In ogni percorso,
il fornitore specifica il proprio modello iniziale e la propria configurazione; OpenClaw verifica
la credenziale con lo stesso test in tempo reale prima di memorizzarne il profilo di autenticazione. Il pulsante Next
rimane bloccato finché almeno un backend non supera il test, quindi la prima chat con l'agente non può
iniziare senza un'inferenza funzionante. Dopo il superamento del controllo in tempo reale, Crestodian diventa
disponibile per aiutarti a configurare il resto dello spazio di lavoro, il Gateway, i canali e
le altre funzionalità facoltative; è disponibile anche in seguito in Settings → Crestodian.
</Step>
<Step title="Autorizzazioni">

<Frame caption="Scegli quali autorizzazioni vuoi concedere a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L'onboarding richiede le autorizzazioni TCC per: Automazione (AppleScript), Notifiche, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Fotocamera e Posizione.

</Step>
<Step title="Fine">
  Dopo il superamento del test di inferenza, Crestodian gestisce il resto della configurazione facoltativa e può
  indirizzarti alla normale chat con l'agente. Al termine della procedura guidata per le autorizzazioni
  si apre la stessa chat; l'app non crea uno spazio di lavoro né avvia una conversazione separata
  per la configurazione dell'agente prima di Crestodian. Consulta
  [Bootstrap](/it/start/bootstrapping) per sapere cosa accade sull'host del Gateway
  durante il primo vero turno dell'agente.
</Step>
</Steps>

## Contenuti correlati

- [Panoramica dell'onboarding](/it/start/onboarding-overview)
- [Introduzione](/it/start/getting-started)
