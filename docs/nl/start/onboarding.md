---
read_when:
    - De macOS-onboardingassistent ontwerpen
    - Auth- of identiteitsconfiguratie implementeren
sidebarTitle: 'Onboarding: macOS App'
summary: Eerste-installatieflow voor OpenClaw (macOS-app)
title: Onboarding (macOS-app)
x-i18n:
    generated_at: "2026-06-27T18:22:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Dit document beschrijft de **huidige** configuratiestroom bij de eerste start. Het doel is een
soepele "dag 0"-ervaring: kies waar de Gateway draait, koppel authenticatie, voer de
wizard uit en laat de agent zichzelf opstarten.
Zie [Onboardingoverzicht](/nl/start/onboarding-overview) voor een algemeen overzicht van onboardingpaden.

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

Vertrouwensmodel voor beveiliging:

- Standaard is OpenClaw een persoonlijke agent: één vertrouwde operatorgrens.
- Gedeelde/multigebruikersconfiguraties vereisen vergrendeling (splits vertrouwensgrenzen, houd tooltoegang minimaal en volg [Beveiliging](/nl/gateway/security)).
- Lokale onboarding zet nieuwe configuraties nu standaard op `tools.profile: "coding"`, zodat nieuwe lokale configuraties filesystem-/runtimetools behouden zonder het onbeperkte `full`-profiel af te dwingen.
- Als hooks/webhooks of andere niet-vertrouwde contentfeeds zijn ingeschakeld, gebruik dan een sterke moderne modelklasse en houd een strikt toolbeleid en strikte sandboxing aan.

</Step>
<Step title="Lokaal vs extern">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Waar draait de **Gateway**?

- **Deze Mac (alleen lokaal):** onboarding kan authenticatie configureren en referenties
  lokaal schrijven.
- **Extern (via SSH/Tailnet):** onboarding configureert **geen** lokale authenticatie;
  referenties moeten op de gatewayhost bestaan. Het tokenveld voor de externe Gateway
  slaat het token op dat de macOS-app gebruikt om verbinding te maken met die Gateway; bestaande
  niet-plaintext `gateway.remote.token`-waarden blijven behouden totdat je ze vervangt.
- **Later configureren:** sla de configuratie over en laat de app ongeconfigureerd.

<Tip>
**Tip voor Gateway-authenticatie:**

- De wizard genereert nu een **token**, zelfs voor loopback, dus lokale WS-clients moeten authenticeren.
- Als je authenticatie uitschakelt, kan elk lokaal proces verbinding maken; gebruik dat alleen op volledig vertrouwde machines.
- Gebruik een **token** voor toegang vanaf meerdere machines of binds buiten loopback.

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
  Na de configuratie opent de app een speciale onboardingchatsessie, zodat de agent zichzelf kan
  introduceren en de volgende stappen kan begeleiden. Dit houdt begeleiding bij de eerste start gescheiden
  van je normale gesprek. Zie [Opstarten](/nl/start/bootstrapping) voor
  wat er op de gatewayhost gebeurt tijdens de eerste agentrun.
</Step>
</Steps>

## Gerelateerd

- [Onboardingoverzicht](/nl/start/onboarding-overview)
- [Aan de slag](/nl/start/getting-started)
