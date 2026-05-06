---
read_when:
    - De macOS-onboardingassistent ontwerpen
    - Authenticatie- of identiteitsconfiguratie implementeren
sidebarTitle: 'Onboarding: macOS App'
summary: Configuratiestroom bij eerste gebruik voor OpenClaw (macOS-app)
title: Introductie (macOS-app)
x-i18n:
    generated_at: "2026-05-06T09:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Dit document beschrijft de **huidige** setupflow bij de eerste start. Het doel is een
soepele "dag 0"-ervaring: kies waar de Gateway draait, koppel authenticatie, doorloop de
wizard en laat de agent zichzelf bootstrappen.
Zie [Onboarding-overzicht](/nl/start/onboarding-overview) voor een algemeen overzicht van onboardingpaden.

<Steps>
<Step title="macOS-waarschuwing goedkeuren">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Lokale netwerken zoeken goedkeuren">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Welkom en beveiligingsmelding">
<Frame caption="Lees de weergegeven beveiligingsmelding en beslis dienovereenkomstig">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Beveiligingsvertrouwensmodel:

- Standaard is OpenClaw een persoonlijke agent: één vertrouwde operatorgrens.
- Gedeelde/multi-user setups vereisen vergrendeling (splits vertrouwensgrenzen, houd tooltoegang minimaal en volg [Beveiliging](/nl/gateway/security)).
- Lokale onboarding stelt nieuwe configuraties nu standaard in op `tools.profile: "coding"`, zodat nieuwe lokale setups filesystem-/runtime-tools behouden zonder het onbeperkte profiel `full` af te dwingen.
- Als hooks/Webhooks of andere niet-vertrouwde contentfeeds zijn ingeschakeld, gebruik dan een sterk modern modelniveau en hanteer strikt toolbeleid/sandboxing.

</Step>
<Step title="Lokaal versus extern">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Waar draait de **Gateway**?

- **Deze Mac (alleen lokaal):** onboarding kan authenticatie configureren en referenties
  lokaal wegschrijven.
- **Extern (via SSH/Tailnet):** onboarding configureert **geen** lokale authenticatie;
  referenties moeten op de gatewayhost bestaan.
- **Later configureren:** sla de setup over en laat de app ongeconfigureerd.

<Tip>
**Tip voor Gateway-authenticatie:**

- De wizard genereert nu zelfs voor loopback een **token**, dus lokale WS-clients moeten zich authenticeren.
- Als je authenticatie uitschakelt, kan elk lokaal proces verbinding maken; gebruik dat alleen op volledig vertrouwde machines.
- Gebruik een **token** voor toegang vanaf meerdere machines of niet-loopback-bindings.

</Tip>
</Step>
<Step title="Machtigingen">
<Frame caption="Kies welke machtigingen je OpenClaw wilt geven">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding vraagt TCC-machtigingen aan die nodig zijn voor:

- Automatisering (AppleScript)
- Meldingen
- Toegankelijkheid
- Schermopname
- Microfoon
- Spraakherkenning
- Camera
- Locatie

</Step>
<Step title="CLI">
  <Info>Deze stap is optioneel</Info>
  De app kan de globale `openclaw` CLI installeren via npm, pnpm of bun.
  De voorkeur gaat eerst uit naar npm, daarna pnpm en daarna bun als dat de enige gedetecteerde
  package manager is. Voor de Gateway-runtime blijft Node het aanbevolen pad.
</Step>
<Step title="Onboardingchat (speciale sessie)">
  Na de setup opent de app een speciale onboardingchatsessie, zodat de agent
  zichzelf kan introduceren en de volgende stappen kan begeleiden. Zo blijft begeleiding bij de eerste start gescheiden
  van je normale gesprek. Zie [Bootstrapping](/nl/start/bootstrapping) voor
  wat er op de gatewayhost gebeurt tijdens de eerste agentrun.
</Step>
</Steps>

## Gerelateerd

- [Onboarding-overzicht](/nl/start/onboarding-overview)
- [Aan de slag](/nl/start/getting-started)
