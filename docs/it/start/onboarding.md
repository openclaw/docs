---
read_when:
    - Progettazione dell'assistente di onboarding per macOS
    - Implementazione della configurazione di autenticazione o identità
sidebarTitle: 'Onboarding: macOS App'
summary: Flusso di configurazione al primo avvio per OpenClaw (app macOS)
title: Onboarding (app macOS)
x-i18n:
    generated_at: "2026-04-05T14:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (app macOS)

Questo documento descrive il flusso di configurazione al primo avvio **attuale**. L'obiettivo è offrire un'esperienza fluida al “giorno 0”: scegliere dove eseguire il Gateway, collegare l'autenticazione, eseguire la procedura guidata e lasciare che l'agente si inizializzi da solo.
Per una panoramica generale dei percorsi di onboarding, vedi [Panoramica dell'onboarding](/start/onboarding-overview).

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
<Step title="Messaggio di benvenuto e avviso di sicurezza">
<Frame caption="Leggi l'avviso di sicurezza visualizzato e decidi di conseguenza">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modello di attendibilità della sicurezza:

- Per impostazione predefinita, OpenClaw è un agente personale: un unico confine di operatore attendibile.
- Le configurazioni condivise/multiutente richiedono restrizioni (separare i confini di attendibilità, mantenere minimo l'accesso agli strumenti e seguire [Sicurezza](/it/gateway/security)).
- L'onboarding locale ora imposta per default le nuove configurazioni su `tools.profile: "coding"` così le nuove configurazioni locali mantengono gli strumenti di filesystem/runtime senza imporre il profilo `full` senza restrizioni.
- Se sono abilitati hook/webhook o altri feed di contenuti non attendibili, usa un livello di modello moderno e robusto e mantieni criteri rigorosi per gli strumenti/il sandboxing.

</Step>
<Step title="Locale o remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Dove viene eseguito il **Gateway**?

- **Questo Mac (solo locale):** l'onboarding può configurare l'autenticazione e scrivere le credenziali localmente.
- **Remoto (tramite SSH/Tailnet):** l'onboarding **non** configura l'autenticazione locale; le credenziali devono esistere sull'host del gateway.
- **Configura più tardi:** salta la configurazione e lascia l'app non configurata.

<Tip>
**Suggerimento sull'autenticazione del Gateway:**

- La procedura guidata ora genera un **token** anche per il loopback, quindi i client WS locali devono autenticarsi.
- Se disabiliti l'autenticazione, qualsiasi processo locale può connettersi; usalo solo su macchine completamente attendibili.
- Usa un **token** per l'accesso da più macchine o per bind non loopback.

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
  Preferisce prima npm, poi pnpm, poi bun se è l'unico gestore di pacchetti
  rilevato. Per il runtime del Gateway, Node rimane il percorso consigliato.
</Step>
<Step title="Chat di onboarding (sessione dedicata)">
  Dopo la configurazione, l'app apre una sessione di chat di onboarding dedicata così l'agente può
  presentarsi e guidare i passaggi successivi. Questo mantiene separate le indicazioni del primo avvio
  dalla conversazione normale. Vedi [Bootstrap](/it/start/bootstrapping) per
  cosa accade sull'host del gateway durante la prima esecuzione dell'agente.
</Step>
</Steps>
