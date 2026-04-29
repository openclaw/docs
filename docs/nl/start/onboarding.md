---
read_when:
    - De macOS-introductieassistent ontwerpen
    - Authenticatie- of identiteitsconfiguratie implementeren
sidebarTitle: 'Onboarding: macOS App'
summary: Configuratieflow bij eerste start voor OpenClaw (macOS-app)
title: Introductie (macOS-app)
x-i18n:
    generated_at: "2026-04-29T23:19:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 16
---

Dit document beschrijft de **huidige** eerste-installatiestroom. Het doel is een
soepele “dag 0”-ervaring: kies waar de Gateway draait, verbind authenticatie, doorloop de
wizard en laat de agent zichzelf opstarten.
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

- Standaard is OpenClaw een persoonlijke agent: één grens voor een vertrouwde operator.
- Gedeelde opstellingen met meerdere gebruikers vereisen vergrendeling (gescheiden vertrouwensgrenzen, minimale toegang tot tools en volg [Beveiliging](/nl/gateway/security)).
- Lokale onboarding stelt nieuwe configuraties nu standaard in op `tools.profile: "coding"`, zodat nieuwe lokale opstellingen bestandssysteem-/runtimetools behouden zonder het onbeperkte `full`-profiel af te dwingen.
- Als hooks/webhooks of andere feeds met niet-vertrouwde inhoud zijn ingeschakeld, gebruik dan een sterke moderne modeltier en hanteer strikt toolbeleid en sandboxing.

</Step>
<Step title="Lokaal versus extern">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Waar draait de **Gateway**?

- **Deze Mac (alleen lokaal):** onboarding kan authenticatie configureren en referenties
  lokaal wegschrijven.
- **Extern (via SSH/Tailnet):** onboarding configureert **geen** lokale authenticatie;
  referenties moeten aanwezig zijn op de gatewayhost.
- **Later configureren:** sla de installatie over en laat de app ongeconfigureerd.

<Tip>
**Tip voor Gateway-authenticatie:**

- De wizard genereert nu zelfs voor loopback een **token**, dus lokale WS-clients moeten authenticeren.
- Als je authenticatie uitschakelt, kan elk lokaal proces verbinding maken; gebruik dat alleen op volledig vertrouwde machines.
- Gebruik een **token** voor toegang vanaf meerdere machines of niet-loopbackbindingen.

</Tip>
</Step>
<Step title="Machtigingen">
<Frame caption="Kies welke machtigingen je aan OpenClaw wilt geven">
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
  De app geeft eerst de voorkeur aan npm, daarna pnpm en daarna bun als dat de enige gedetecteerde
  pakketbeheerder is. Voor de Gateway-runtime blijft Node de aanbevolen route.
</Step>
<Step title="Onboardingchat (speciale sessie)">
  Na de installatie opent de app een speciale onboardingchatsessie, zodat de agent
  zichzelf kan introduceren en de volgende stappen kan begeleiden. Zo blijft begeleiding bij de eerste start gescheiden
  van je normale gesprek. Zie [Bootstrapping](/nl/start/bootstrapping) voor
  wat er op de gatewayhost gebeurt tijdens de eerste agentuitvoering.
</Step>
</Steps>

## Gerelateerd

- [Onboarding-overzicht](/nl/start/onboarding-overview)
- [Aan de slag](/nl/start/getting-started)
