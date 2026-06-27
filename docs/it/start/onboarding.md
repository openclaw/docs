---
read_when:
    - Progettare l'assistente di onboarding per macOS
    - Implementazione della configurazione di autenticazione o identità
sidebarTitle: 'Onboarding: macOS App'
summary: Flusso di configurazione al primo avvio per OpenClaw (app macOS)
title: Onboarding (app macOS)
x-i18n:
    generated_at: "2026-06-27T18:16:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Questo documento descrive il flusso di configurazione al **primo avvio** attuale. L'obiettivo è un'esperienza
fluida di "giorno 0": scegliere dove viene eseguito il Gateway, collegare l'autenticazione, eseguire la
procedura guidata e lasciare che l'agente si inizializzi.
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

- Per impostazione predefinita, OpenClaw è un agente personale: un unico confine operatore fidato.
- Le configurazioni condivise/multiutente richiedono una messa in sicurezza (confini di fiducia separati, accesso agli strumenti ridotto al minimo e rispetto di [Sicurezza](/it/gateway/security)).
- L'onboarding locale ora imposta come predefinito per le nuove configurazioni `tools.profile: "coding"`, così le nuove configurazioni locali mantengono gli strumenti filesystem/runtime senza imporre il profilo `full` senza restrizioni.
- Se sono abilitati hook/webhook o altri feed di contenuti non attendibili, usa un tier di modello moderno e robusto e mantieni una policy degli strumenti/sandboxing rigorosa.

</Step>
<Step title="Locale vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Dove viene eseguito il **Gateway**?

- **Questo Mac (solo locale):** l'onboarding può configurare l'autenticazione e scrivere le credenziali
  localmente.
- **Remoto (tramite SSH/Tailnet):** l'onboarding **non** configura l'autenticazione locale;
  le credenziali devono esistere sull'host del gateway. Il campo del token del gateway remoto
  archivia il token usato dall'app macOS per connettersi a quel Gateway; i valori
  `gateway.remote.token` esistenti non in testo normale vengono preservati finché non li sostituisci.
- **Configura più tardi:** salta la configurazione e lascia l'app non configurata.

<Tip>
**Suggerimento per l'autenticazione del Gateway:**

- La procedura guidata ora genera un **token** anche per loopback, quindi i client WS locali devono autenticarsi.
- Se disabiliti l'autenticazione, qualsiasi processo locale può connettersi; usalo solo su macchine completamente fidate.
- Usa un **token** per l'accesso multi-macchina o per bind non loopback.

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
- Registrazione schermo
- Microfono
- Riconoscimento vocale
- Fotocamera
- Posizione

</Step>
<Step title="CLI">
  <Info>Questo passaggio è facoltativo</Info>
  L'app può installare la CLI globale `openclaw` tramite npm, pnpm o bun.
  Preferisce prima npm, poi pnpm, quindi bun se è l'unico package manager
  rilevato. Per il runtime del Gateway, Node rimane il percorso consigliato.
</Step>
<Step title="Chat di onboarding (sessione dedicata)">
  Dopo la configurazione, l'app apre una sessione di chat di onboarding dedicata, così l'agente può
  presentarsi e guidare i passaggi successivi. Questo mantiene la guida del primo avvio separata
  dalla tua conversazione normale. Consulta [Bootstrap](/it/start/bootstrapping) per
  cosa accade sull'host del gateway durante la prima esecuzione dell'agente.
</Step>
</Steps>

## Correlati

- [Panoramica dell'onboarding](/it/start/onboarding-overview)
- [Introduzione](/it/start/getting-started)
