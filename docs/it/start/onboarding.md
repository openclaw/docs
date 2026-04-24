---
read_when:
    - Progettare l’assistente di onboarding macOS
    - Implementare la configurazione di autenticazione o identità
sidebarTitle: 'Onboarding: macOS App'
summary: Flusso di configurazione iniziale per OpenClaw (app macOS)
title: Onboarding (app macOS)
x-i18n:
    generated_at: "2026-04-24T09:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Questa documentazione descrive il flusso di configurazione iniziale **attuale**. L’obiettivo è offrire
un’esperienza “giorno 0” fluida: scegliere dove eseguire il Gateway, collegare l’autenticazione, eseguire la
procedura guidata e lasciare che l’agente faccia il bootstrap da solo.
Per una panoramica generale dei percorsi di onboarding, vedi [Panoramica dell’onboarding](/it/start/onboarding-overview).

<Steps>
<Step title="Approva l’avviso macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approva trova reti locali">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Benvenuto e avviso di sicurezza">
<Frame caption="Leggi l’avviso di sicurezza visualizzato e decidi di conseguenza">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modello di fiducia della sicurezza:

- Per impostazione predefinita, OpenClaw è un agente personale: un unico confine di operatore trusted.
- Le configurazioni condivise/multiutente richiedono un forte lock-down (separa i confini di fiducia, mantieni minimo l’accesso agli strumenti e segui [Security](/it/gateway/security)).
- L’onboarding locale ora imposta come predefinito per le nuove configurazioni `tools.profile: "coding"` così le nuove configurazioni locali mantengono strumenti filesystem/runtime senza forzare il profilo non ristretto `full`.
- Se hook/Webhook o altri feed di contenuti non fidati sono abilitati, usa un livello di modello moderno e forte e mantieni policy degli strumenti/sandboxing rigorosi.

</Step>
<Step title="Locale vs Remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Dove viene eseguito il **Gateway**?

- **Questo Mac (solo locale):** l’onboarding può configurare l’autenticazione e scrivere le credenziali
  localmente.
- **Remoto (tramite SSH/Tailnet):** l’onboarding **non** configura l’autenticazione locale;
  le credenziali devono esistere sull’host del gateway.
- **Configura più tardi:** salta la configurazione e lascia l’app non configurata.

<Tip>
**Suggerimento sull’autenticazione del Gateway:**

- La procedura guidata ora genera un **token** anche per loopback, quindi i client WS locali devono autenticarsi.
- Se disabiliti l’autenticazione, qualsiasi processo locale può connettersi; usalo solo su macchine completamente trusted.
- Usa un **token** per accesso da più macchine o bind non loopback.

</Tip>
</Step>
<Step title="Permessi">
<Frame caption="Scegli quali permessi vuoi concedere a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L’onboarding richiede i permessi TCC necessari per:

- Automazione (AppleScript)
- Notifiche
- Accessibilità
- Registrazione schermo
- Microfono
- Riconoscimento vocale
- Fotocamera
- Posizione

</Step>
<Step title="CLI">
  <Info>Questo passaggio è opzionale</Info>
  L’app può installare la CLI globale `openclaw` tramite npm, pnpm o bun.
  Preferisce prima npm, poi pnpm, poi bun se questo è l’unico
  gestore di pacchetti rilevato. Per il runtime del Gateway, Node resta il percorso consigliato.
</Step>
<Step title="Chat di onboarding (sessione dedicata)">
  Dopo la configurazione, l’app apre una sessione chat di onboarding dedicata così l’agente può
  presentarsi e guidare i passaggi successivi. Questo mantiene la guida del primo avvio separata
  dalla tua conversazione normale. Vedi [Bootstrapping](/it/start/bootstrapping) per
  ciò che accade sull’host del gateway durante la prima esecuzione dell’agente.
</Step>
</Steps>

## Correlati

- [Panoramica dell’onboarding](/it/start/onboarding-overview)
- [Getting started](/it/start/getting-started)
