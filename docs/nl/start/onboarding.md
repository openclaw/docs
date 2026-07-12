---
read_when:
    - De macOS-onboardingassistent ontwerpen
    - Authenticatie- of identiteitsconfiguratie implementeren
sidebarTitle: 'Onboarding: macOS App'
summary: Installatieprocedure voor de eerste keer voor OpenClaw (macOS-app)
title: Onboarding (macOS-app)
x-i18n:
    generated_at: "2026-07-12T09:26:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

De eerste-startflow van de macOS-app: kies waar de Gateway draait, verbind een
geverifieerde AI-backend, verleen machtigingen en draag de besturing over aan
het eigen bootstrapritueel van de agent.
Zie [Overzicht van onboarding](/nl/start/onboarding-overview) voor onboarding via de CLI en een vergelijking van beide trajecten.

<Steps>
<Step title="macOS-waarschuwing goedkeuren">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Zoeken naar lokale netwerken goedkeuren">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Welkom en beveiligingsmelding">
<Frame caption="Lees de weergegeven beveiligingsmelding en neem op basis daarvan een beslissing">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Vertrouwensmodel voor beveiliging:

- OpenClaw is standaard een persoonlijke agent: één grens met één vertrouwde beheerder.
- Gedeelde configuraties en configuraties voor meerdere gebruikers moeten worden vergrendeld: scheid vertrouwensgrenzen, beperk toegang tot hulpmiddelen tot een minimum en volg [Beveiliging](/nl/gateway/security).
- Bij lokale onboarding wordt voor nieuwe configuraties standaard `tools.profile: "coding"` ingesteld, zodat nieuwe configuraties toegang tot bestands- en runtimehulpmiddelen behouden zonder het onbeperkte profiel `full`.
- Als hooks/webhooks of andere bronnen met niet-vertrouwde inhoud zijn ingeschakeld, gebruik dan een krachtig modern modelniveau en hanteer een strikt hulpmiddelenbeleid en strikte sandboxing.

</Step>
<Step title="Lokaal versus extern">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Waar draait de **Gateway**?

- **Deze Mac (alleen lokaal):** de onboarding configureert authenticatie en schrijft de aanmeldgegevens lokaal weg.
- **Extern (via SSH/Tailnet):** de onboarding configureert **geen** lokale authenticatie;
  de aanmeldgegevens moeten al op de Gateway-host aanwezig zijn. In het veld voor het externe Gateway-token
  wordt het token opgeslagen waarmee de macOS-app verbinding maakt met die Gateway;
  bestaande SecretRef-waarden voor `gateway.remote.token` blijven behouden totdat u
  ze vervangt.
- **Later configureren:** sla de configuratie over en laat de app ongeconfigureerd.

<Tip>
**Tip voor Gateway-authenticatie:**

- De authenticatiemodus van de Gateway is standaard `token`, zelfs voor local loopback-bindingen, dus lokale WS-clients moeten zich authenticeren.
- Met `gateway.auth.mode: "none"` kan elk lokaal proces verbinding maken; gebruik dit alleen op volledig vertrouwde machines.
- Gebruik een token voor toegang vanaf meerdere machines of voor bindingen die geen local loopback gebruiken.

</Tip>
</Step>
<Step title="CLI">
  De lokale configuratie installeert de algemene `openclaw`-CLI via npm, pnpm of bun,
  waarbij npm de voorkeur heeft. Node blijft de aanbevolen runtime voor de Gateway
  zelf. Bestaande compatibele installaties worden hergebruikt.
</Step>
<Step title="Verbind uw AI">
  Een verbonden Gateway waarop al een agentmodel is geconfigureerd, slaat deze
  pagina volledig over en opent de normale agentinterface. De configuratie van
  Crestodian en de provider wordt alleen uitgevoerd voor een nieuwe of onvolledig
  geconfigureerde Gateway.

Zodra de Gateway gereed is, zoekt de onboarding naar AI-toegang die u al hebt:
een aanmelding bij Claude Code of Codex, of `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. De beste optie wordt getest met een echte voltooiing en
pas opgeslagen nadat deze antwoord geeft; wanneer een test mislukt, probeert
de app automatisch de volgende optie en toont deze waarom de vorige is mislukt.
Als er meerdere opties worden gevonden, kunt u ertussen wisselen voordat u doorgaat.

Gemini CLI blijft na de configuratie beschikbaar voor normale agents, maar wordt
hier niet aangeboden omdat deze de inferentieproef zonder hulpmiddelen niet kan afdwingen.

U kunt zich ook aanmelden via de eigen OAuth- of apparaatkoppelingsflow van de provider.
De ingebouwde opties omvatten OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global en CN, en Chutes. De lijst is afkomstig van de
actieve providerplugins voor tekstinferentie van de Gateway en niet van een vaste
applijst, zodat een andere provider zich kan aanmelden zonder providerspecifieke
macOS-code toe te voegen.

De handmatige kiezer voor sleutels/tokens gebruikt hetzelfde providerregister. Bij elke route
levert de provider het startmodel en de configuratie; OpenClaw verifieert
de aanmeldgegevens met dezelfde live-test voordat het authenticatieprofiel wordt opgeslagen. Volgende
blijft vergrendeld totdat één backend is geslaagd, zodat de eerste agentchat niet
kan worden gestart zonder werkende inferentie. Nadat die live-controle is geslaagd, wordt Crestodian
beschikbaar om de resterende werkruimte, Gateway, kanalen en andere
optionele functies te configureren; Crestodian is later ook beschikbaar onder Settings → Crestodian.
</Step>
<Step title="Machtigingen">

<Frame caption="Kies welke machtigingen u aan OpenClaw wilt verlenen">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

De onboarding vraagt TCC-machtigingen aan voor: automatisering (AppleScript), meldingen, toegankelijkheid, schermopname, microfoon, spraakherkenning, camera en locatie.

</Step>
<Step title="Voltooien">
  Nadat de inferentie is geslaagd, beheert Crestodian de resterende optionele configuratie en kan
  deze u doorsturen naar de normale agentchat. Na het voltooien van het machtigingstraject
  wordt dezelfde chat geopend; de app maakt geen werkruimte aan en start geen afzonderlijk
  configuratiegesprek voor de agent vóór Crestodian. Zie
  [Bootstrapping](/nl/start/bootstrapping) voor wat er op de Gateway-host gebeurt
  tijdens de eerste echte beurt van de agent.
</Step>
</Steps>

## Gerelateerd

- [Overzicht van onboarding](/nl/start/onboarding-overview)
- [Aan de slag](/nl/start/getting-started)
