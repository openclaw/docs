---
read_when:
    - Progettare l’assistente alla configurazione iniziale per macOS
    - Implementazione dell'autenticazione o della configurazione dell'identità
sidebarTitle: 'Onboarding: macOS App'
summary: Flusso di configurazione al primo avvio per OpenClaw (app macOS)
title: Configurazione iniziale (app macOS)
x-i18n:
    generated_at: "2026-05-06T09:09:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Questo documento descrive il flusso di configurazione iniziale **attuale**. L'obiettivo è un'esperienza fluida del "giorno 0": scegliere dove viene eseguito il Gateway, collegare l'autenticazione, eseguire la procedura guidata e lasciare che l'agente inizializzi se stesso.
Per una panoramica generale dei percorsi di onboarding, consulta [Panoramica dell'onboarding](/it/start/onboarding-overview).

<Steps>
<Step title="Approva l'avviso macOS">
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

- Per impostazione predefinita, OpenClaw è un agente personale: un unico perimetro di operatore attendibile.
- Le configurazioni condivise/multiutente richiedono un irrigidimento (separa i perimetri di fiducia, mantieni l'accesso agli strumenti al minimo e segui [Sicurezza](/it/gateway/security)).
- L'onboarding locale ora imposta per impostazione predefinita le nuove configurazioni su `tools.profile: "coding"`, così le nuove configurazioni locali mantengono gli strumenti di filesystem/runtime senza imporre il profilo `full` senza restrizioni.
- Se sono abilitati hook/webhook o altri feed di contenuti non attendibili, usa un livello di modello moderno e robusto e mantieni criteri degli strumenti/sandboxing rigorosi.

</Step>
<Step title="Locale vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Dove viene eseguito il **Gateway**?

- **Questo Mac (solo locale):** l'onboarding può configurare l'autenticazione e scrivere le credenziali localmente.
- **Remoto (tramite SSH/Tailnet):** l'onboarding **non** configura l'autenticazione locale; le credenziali devono esistere sull'host del Gateway.
- **Configura più tardi:** salta la configurazione e lascia l'app non configurata.

<Tip>
**Suggerimento sull'autenticazione del Gateway:**

- La procedura guidata ora genera un **token** anche per loopback, quindi i client WS locali devono autenticarsi.
- Se disabiliti l'autenticazione, qualsiasi processo locale può connettersi; usalo solo su macchine completamente attendibili.
- Usa un **token** per l'accesso da più macchine o per bind non-loopback.

</Tip>
</Step>
<Step title="Autorizzazioni">
<Frame caption="Scegli quali autorizzazioni vuoi concedere a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L'onboarding richiede le autorizzazioni TCC necessarie per:

- Automazione (AppleScript)
- Notifiche
- Accessibilità
- Registrazione dello schermo
- Microfono
- Riconoscimento vocale
- Fotocamera
- Posizione

</Step>
<Step title="CLI">
  <Info>Questo passaggio è facoltativo</Info>
  L'app può installare la CLI globale `openclaw` tramite npm, pnpm o bun.
  Preferisce prima npm, poi pnpm, quindi bun se è l'unico gestore di pacchetti
  rilevato. Per il runtime del Gateway, Node rimane il percorso consigliato.
</Step>
<Step title="Chat di onboarding (sessione dedicata)">
  Dopo la configurazione, l'app apre una sessione di chat di onboarding dedicata, così l'agente può
  presentarsi e guidare i passaggi successivi. Questo mantiene la guida al primo avvio separata
  dalla tua conversazione normale. Consulta [Bootstrapping](/it/start/bootstrapping) per
  vedere cosa accade sull'host del Gateway durante la prima esecuzione dell'agente.
</Step>
</Steps>

## Correlati

- [Panoramica dell'onboarding](/it/start/onboarding-overview)
- [Guida introduttiva](/it/start/getting-started)
