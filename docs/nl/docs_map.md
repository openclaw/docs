---
read_when: Finding which docs page covers a topic before reading the page
summary: Gegenereerde koppenkaart voor OpenClaw-documentatiepagina's
title: Documentatiekaart
x-i18n:
    generated_at: "2026-07-04T15:24:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e180b7c652be24b73af51fecc5cf9a566184c1eff65ca0acdc0133bbc49c332
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw-documentatiekaart

Dit bestand wordt gegenereerd uit de koppen in `docs/**/*.md` en `docs/**/*.mdx` om agents te helpen door de documentatiestructuur te navigeren.
Bewerk het niet handmatig; voer `pnpm docs:map:gen` uit.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Koppen:
  - H2: Runtime-indeling
  - H2: Grenzen
  - H2: Manifesten
  - H2: Runtimeselectie
  - H2: Gerelateerd

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Koppen:
  - H1: Verwijdering van BlueBubbles en het imsg iMessage-pad
  - H2: Wat is gewijzigd
  - H2: Wat te doen
  - H2: Migratie-opmerkingen
  - H2: Zie ook

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Koppen:
  - H2: Stabiele redencodes voor probes
  - H2: Tokenreferenties
  - H3: Geschiktheidsregels
  - H3: Resolutieregels
  - H2: Portabiliteit van agentkopieën
  - H2: Auth-routes alleen via configuratie
  - H2: Expliciete filtering van auth-volgorde
  - H2: Resolutie van probe-doel
  - H2: Detectie van referenties voor externe CLI
  - H2: OAuth SecretRef-beleidsbewaking
  - H2: Legacy-compatibele berichten
  - H2: Gerelateerd

## automation/auth-monitoring.md

- Route: /automation/auth-monitoring
- Koppen:
  - H2: Gerelateerd

## automation/clawflow.md

- Route: /automation/clawflow
- Koppen:
  - H2: Gerelateerd

## automation/cron-jobs.md

- Route: /automation/cron-jobs
- Koppen:
  - H2: Snelstart
  - H2: Hoe Cron werkt
  - H2: Schematypen
  - H3: Dag-van-de-maand en dag-van-de-week gebruiken OF-logica
  - H2: Uitvoeringsstijlen
  - H3: Opdrachtpayloads
  - H3: Payloadopties voor geïsoleerde taken
  - H2: Bezorging en uitvoer
  - H2: Uitvoertaal
  - H2: CLI-voorbeelden
  - H2: Webhooks
  - H3: Authenticatie
  - H2: Gmail PubSub-integratie
  - H3: Wizardconfiguratie (aanbevolen)
  - H3: Automatisch starten van Gateway
  - H3: Handmatige eenmalige configuratie
  - H3: Gmail-modeloverschrijving
  - H2: Taken beheren
  - H2: Configuratie
  - H2: Probleemoplossing
  - H3: Opdrachtladder
  - H2: Gerelateerd

## automation/cron-vs-heartbeat.md

- Route: /automation/cron-vs-heartbeat
- Koppen:
  - H2: Gerelateerd

## automation/gmail-pubsub.md

- Route: /automation/gmail-pubsub
- Koppen:
  - H2: Gerelateerd

## automation/hooks.md

- Route: /automation/hooks
- Koppen:
  - H2: Kies het juiste oppervlak
  - H2: Snelstart
  - H2: Gebeurtenistypen
  - H2: Hooks schrijven
  - H3: Hook-structuur
  - H3: HOOK.md-indeling
  - H3: Handlerimplementatie
  - H3: Hoogtepunten van gebeurteniscontext
  - H2: Hook-detectie
  - H3: Hook-pakketten
  - H2: Meegeleverde hooks
  - H3: Details van session-memory
  - H3: Configuratie van bootstrap-extra-files
  - H3: Details van command-logger
  - H3: Details van compaction-notifier
  - H3: Details van boot-md
  - H2: Plugin-hooks
  - H2: Configuratie
  - H2: CLI-referentie
  - H2: Best practices
  - H2: Probleemoplossing
  - H3: Hook niet gevonden
  - H3: Hook niet geschikt
  - H3: Hook wordt niet uitgevoerd
  - H2: Gerelateerd

## automation/index.md

- Route: /automation
- Koppen:
  - H2: Snelle beslisgids
  - H3: Geplande taken (Cron) versus Heartbeat
  - H2: Kernconcepten
  - H3: Geplande taken (Cron)
  - H3: Taken
  - H3: Afgeleide toezeggingen
  - H3: Taakstroom
  - H3: Doorlopende opdrachten
  - H3: Hooks
  - H3: Heartbeat
  - H2: Hoe ze samenwerken
  - H2: Gerelateerd

## automation/poll.md

- Route: /automation/poll
- Koppen:
  - H2: Gerelateerd

## automation/standing-orders.md

- Route: /automation/standing-orders
- Koppen:
  - H2: Waarom doorlopende opdrachten
  - H2: Hoe ze werken
  - H2: Anatomie van een doorlopende opdracht
  - H2: Doorlopende opdrachten plus Cron-taken
  - H2: Voorbeelden
  - H3: Voorbeeld 1: content en sociale media (wekelijkse cyclus)
  - H3: Voorbeeld 2: financiële operaties (gebeurtenisgestuurd)
  - H3: Voorbeeld 3: monitoring en waarschuwingen (continu)
  - H2: Uitvoeren-verifiëren-rapporteren-patroon
  - H2: Architectuur met meerdere programma's
  - H2: Best practices
  - H3: Wel doen
  - H3: Vermijden
  - H2: Gerelateerd

## automation/taskflow.md

- Route: /automation/taskflow
- Koppen:
  - H2: Wanneer Taakstroom gebruiken
  - H2: Betrouwbaar patroon voor geplande workflows
  - H2: Synchronisatiemodi
  - H3: Beheerde modus
  - H3: Gespiegelde modus
  - H2: Duurzame status en revisietracking
  - H2: Annuleringsgedrag
  - H2: CLI-opdrachten
  - H2: Hoe stromen zich verhouden tot taken
  - H2: Gerelateerd

## automation/tasks.md

- Route: /automation/tasks
- Koppen:
  - H2: TL;DR
  - H2: Snelstart
  - H2: Wat een taak maakt
  - H2: Taaklevenscyclus
  - H2: Bezorging en meldingen
  - H3: Meldingsbeleid
  - H2: CLI-referentie
  - H2: Chat-taakbord (/tasks)
  - H2: Statusintegratie (taakdruk)
  - H2: Opslag en onderhoud
  - H3: Waar taken staan
  - H3: Automatisch onderhoud
  - H2: Hoe taken zich verhouden tot andere systemen
  - H2: Gerelateerd

## automation/troubleshooting.md

- Route: /automation/troubleshooting
- Koppen:
  - H2: Gerelateerd

## automation/webhook.md

- Route: /automation/webhook
- Koppen:
  - H2: Gerelateerd

## brave-search.md

- Route: /brave-search
- Koppen:
  - H2: Gerelateerd

## channels/access-groups.md

- Route: /channels/access-groups
- Koppen:
  - H2: Statische groepen voor berichtafzenders
  - H2: Verwijzingsgroepen uit toelatingslijsten
  - H2: Ondersteunde paden voor berichtkanalen
  - H2: Plugin-diagnostiek
  - H2: Discord-kanaalpublieken
  - H2: Beveiligingsopmerkingen
  - H2: Probleemoplossing

## channels/ambient-room-events.md

- Route: /channels/ambient-room-events
- Koppen:
  - H2: Aanbevolen configuratie
  - H2: Wat verandert
  - H2: Discord-voorbeeld
  - H2: Slack-voorbeeld
  - H2: Telegram-voorbeeld
  - H2: Agentspecifiek beleid
  - H2: Zichtbare antwoordmodi
  - H2: Geschiedenis
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Koppen:
  - H1: Bescherming tegen botlussen
  - H2: Standaardwaarden
  - H2: Gedeelde standaardwaarden configureren
  - H2: Overschrijven per kanaal of account
  - H2: Kanaalondersteuning

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Koppen:
  - H2: Overzicht
  - H2: Gebruiksscenario's
  - H2: Configuratie
  - H3: Basisconfiguratie
  - H3: Verwerkingsstrategie
  - H3: Volledig voorbeeld
  - H2: Hoe het werkt
  - H3: Berichtstroom
  - H3: Sessiescheiding
  - H3: Voorbeeld: geïsoleerde sessies
  - H2: Best practices
  - H2: Compatibiliteit
  - H3: Providers
  - H3: Routing
  - H2: Probleemoplossing
  - H2: Voorbeelden
  - H2: API-referentie
  - H3: Configuratieschema
  - H3: Velden
  - H2: Beperkingen
  - H2: Toekomstige verbeteringen
  - H2: Gerelateerd

## channels/channel-routing.md

- Route: /channels/channel-routing
- Koppen:
  - H1: Kanalen &amp; routing
  - H2: Belangrijke termen
  - H2: Prefixen voor uitgaande doelen
  - H2: Sessiesleutelvormen (voorbeelden)
  - H2: Vastzetten van hoofd-DM-route
  - H2: Beveiligde inkomende registratie
  - H2: Routingregels (hoe een agent wordt gekozen)
  - H2: Uitzendgroepen (meerdere agents uitvoeren)
  - H2: Configuratieoverzicht
  - H2: Sessieopslag
  - H2: WebChat-gedrag
  - H2: Antwoordcontext
  - H2: Gerelateerd

## channels/clickclack.md

- Route: /channels/clickclack
- Koppen:
  - H2: Snelle configuratie
  - H2: Meerdere bots
  - H2: Doelen
  - H2: Machtigingen
  - H2: Probleemoplossing

## channels/discord.md

- Route: /channels/discord
- Koppen:
  - H2: Snelle configuratie
  - H2: Aanbevolen: stel een guild-werkruimte in
  - H2: Runtimemodel
  - H2: Forumkanalen
  - H2: Interactieve componenten
  - H2: Toegangscontrole en routing
  - H3: Rolgebaseerde agentrouting
  - H2: Native opdrachten en opdracht-auth
  - H2: Functiedetails
  - H2: Tools en actiepoorten
  - H2: Components v2-UI
  - H2: Spraak
  - H3: Spraakkanalen
  - H3: Gebruikers volgen in spraak
  - H3: Spraakberichten
  - H2: Probleemoplossing
  - H2: Configuratiereferentie
  - H2: Veiligheid en beheer
  - H2: Gerelateerd

## channels/feishu.md

- Route: /channels/feishu
- Koppen:
  - H2: Snelstart
  - H2: Toegangscontrole
  - H3: Directe berichten
  - H3: Groepschats
  - H2: Voorbeelden van groepsconfiguratie
  - H3: Alle groepen toestaan, geen @mention vereist
  - H3: Alle groepen toestaan, @mention nog steeds vereist
  - H3: Alleen specifieke groepen toestaan
  - H3: Afzenders binnen een groep beperken
  - H2: Groeps-/gebruikers-ID's ophalen
  - H3: Groeps-ID's (chatid, format: ocxxx)
  - H3: Gebruikers-ID's (openid, format: ouxxx)
  - H2: Veelgebruikte opdrachten
  - H2: Probleemoplossing
  - H3: Bot reageert niet in groepschats
  - H3: Bot ontvangt geen berichten
  - H3: QR-configuratie reageert niet in de mobiele Feishu-app
  - H3: App Secret gelekt
  - H2: Geavanceerde configuratie
  - H3: Meerdere accounts
  - H3: Berichtlimieten
  - H3: Streaming
  - H3: Quota-optimalisatie
  - H3: ACP-sessies
  - H4: Persistente ACP-koppeling
  - H4: ACP starten vanuit chat
  - H3: Multi-agentrouting
  - H2: Agentscheiding per gebruiker (dynamische agentcreatie)
  - H3: Snelle configuratie
  - H3: Hoe het werkt
  - H3: Configuratieopties
  - H3: Sessiebereik
  - H3: Typische implementatie met meerdere gebruikers
  - H3: Verificatie
  - H3: Opmerkingen
  - H2: Configuratiereferentie
  - H2: Ondersteunde berichttypen
  - H3: Ontvangen
  - H3: Verzenden
  - H3: Threads en antwoorden
  - H2: Gerelateerd

## channels/googlechat.md

- Route: /channels/googlechat
- Koppen:
  - H2: Installeren
  - H2: Snelle configuratie (beginner)
  - H2: Toevoegen aan Google Chat
  - H2: Publieke URL (alleen Webhook)
  - H3: Optie A: Tailscale Funnel (aanbevolen)
  - H3: Optie B: reverse proxy (Caddy)
  - H3: Optie C: Cloudflare Tunnel
  - H2: Hoe het werkt
  - H2: Doelen
  - H2: Configuratiehoogtepunten
  - H2: Probleemoplossing
  - H3: 405 Method Not Allowed
  - H3: Andere problemen
  - H2: Gerelateerd

## channels/group-messages.md

- Route: /channels/group-messages
- Koppen:
  - H2: Gedrag
  - H2: Configuratievoorbeeld (WhatsApp)
  - H3: Activatieopdracht (alleen eigenaar)
  - H2: Gebruik
  - H2: Testen / verificatie
  - H2: Bekende aandachtspunten
  - H2: Gerelateerd

## channels/groups.md

- Route: /channels/groups
- Koppen:
  - H2: Introductie voor beginners (2 minuten)
  - H2: Zichtbare antwoorden
  - H2: Contextzichtbaarheid en toelatingslijsten
  - H2: Sessiesleutels
  - H2: Patroon: persoonlijke DM's + openbare groepen (één agent)
  - H2: Weergavelabels
  - H2: Groepsbeleid
  - H2: Mention-poort (standaard)
  - H2: Geconfigureerde mention-patronen beperken
  - H2: Toolbeperkingen voor groep/kanaal (optioneel)
  - H2: Groepstoelatingslijsten
  - H2: Activatie (alleen eigenaar)
  - H2: Contextvelden
  - H2: iMessage-specifiek
  - H2: WhatsApp-systeemprompts
  - H2: WhatsApp-specifiek
  - H2: Gerelateerd

## channels/imessage-from-bluebubbles.md

- Route: /channels/imessage-from-bluebubbles
- Koppen:
  - H2: Migratiechecklist
  - H2: Wanneer deze migratie zinvol is
  - H2: Wat imsg doet
  - H2: Voordat je begint
  - H2: Configuratievertaling
  - H2: Valkuil in groepsregister
  - H2: Stap voor stap
  - H2: Actiepariteit in één oogopslag
  - H2: Koppeling, sessies en ACP-bindingen
  - H2: Geen rollback-kanaal
  - H2: Gerelateerd

## channels/imessage.md

- Route: /channels/imessage
- Koppen:
  - H2: Snelle configuratie
  - H2: Vereisten en machtigingen (macOS)
  - H2: De privé-API van imsg inschakelen
  - H3: Configuratie
  - H3: Wanneer je SIP niet kunt uitschakelen
  - H2: Toegangscontrole en routing
  - H2: ACP-gespreksbindingen
  - H2: Implementatiepatronen
  - H2: Media, opdelen en bezorgdoelen
  - H2: Acties van de privé-API
  - H2: Configuratieschrijfacties
  - H2: Gesplitst verzonden DM's samenvoegen (opdracht + URL in één compositie)
  - H3: Scenario's en wat de agent ziet
  - H2: Inkomend herstel na een herstart van bridge of Gateway
  - H3: Signaal zichtbaar voor operator
  - H3: Migratie
  - H2: Probleemoplossing
  - H2: Verwijzingen naar configuratiereferentie
  - H2: Gerelateerd

## channels/index.md

- Route: /channels
- Koppen:
  - H2: Bezorgingsopmerkingen
  - H2: Ondersteunde kanalen
  - H2: Opmerkingen

## channels/irc.md

- Route: /channels/irc
- Koppen:
  - H2: Snelstart
  - H2: Beveiligingsstandaardwaarden
  - H2: Toegangscontrole
  - H3: Veelvoorkomende valkuil: allowFrom is voor DM's, niet voor kanalen
  - H2: Antwoorden triggeren (mentions)
  - H2: Beveiligingsopmerking (aanbevolen voor openbare kanalen)
  - H3: Dezelfde tools voor iedereen in het kanaal
  - H3: Verschillende tools per afzender (eigenaar krijgt meer macht)
  - H2: NickServ
  - H2: Omgevingsvariabelen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/line.md

- Route: /channels/line
- Koppen:
  - H2: Installeren
  - H2: Instellen
  - H2: Configureren
  - H2: Toegangsbeheer
  - H2: Berichtgedrag
  - H2: Kanaalgegevens (rijke berichten)
  - H2: ACP-ondersteuning
  - H2: Uitgaande media
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/location.md

- Route: /channels/location
- Koppen:
  - H2: Tekstopmaak
  - H2: Contextvelden
  - H2: Kanaalnotities
  - H2: Gerelateerd

## channels/matrix-migration.md

- Route: /channels/matrix-migration
- Koppen:
  - H2: Wat de migratie automatisch doet
  - H2: Wat de migratie niet automatisch kan doen
  - H2: Aanbevolen upgradeproces
  - H2: Hoe versleutelde migratie werkt
  - H2: Veelvoorkomende berichten en wat ze betekenen
  - H3: Upgrade- en detectieberichten
  - H3: Herstelberichten voor versleutelde status
  - H3: Handmatige herstelberichten
  - H3: Installatieberichten voor aangepaste plugins
  - H2: Als versleutelde geschiedenis nog steeds niet terugkomt
  - H2: Als je opnieuw wilt beginnen voor toekomstige berichten
  - H2: Gerelateerd

## channels/matrix-presentation.md

- Route: /channels/matrix-presentation
- Koppen:
  - H2: Gebeurtenisinhoud
  - H2: Fallback-gedrag
  - H2: Ondersteunde blokken
  - H2: Interacties
  - H2: Relatie tot goedkeuringsmetadata
  - H2: Mediaberichten

## channels/matrix-push-rules.md

- Route: /channels/matrix-push-rules
- Koppen:
  - H2: Vereisten
  - H2: Stappen
  - H2: Notities voor meerdere bots
  - H2: Homeserver-notities
  - H2: Gerelateerd

## channels/matrix.md

- Route: /channels/matrix
- Koppen:
  - H2: Installeren
  - H2: Instellen
  - H3: Interactieve installatie
  - H3: Minimale configuratie
  - H3: Automatisch deelnemen
  - H3: Doelformaten voor allowlist
  - H3: Normalisatie van account-ID
  - H3: Gecachete referenties
  - H3: Omgevingsvariabelen
  - H2: Configuratievoorbeeld
  - H2: Streamingvoorbeelden
  - H2: Spraakberichten
  - H2: Goedkeuringsmetadata
  - H3: Zelfgehoste pushregels voor stille afgeronde voorbeelden
  - H2: Bot-naar-botruimtes
  - H2: Versleuteling en verificatie
  - H3: Versleuteling inschakelen
  - H3: Status- en vertrouwenssignalen
  - H3: Dit apparaat verifiëren met een herstelsleutel
  - H3: Cross-signing initialiseren of repareren
  - H3: Back-up van kamersleutels
  - H3: Verificaties weergeven, aanvragen en beantwoorden
  - H3: Notities voor meerdere accounts
  - H2: Profielbeheer
  - H2: Threads
  - H3: Sessierouting (sessionScope)
  - H3: Antwoordthreads (threadReplies)
  - H3: Thread-overerving en slash-commando's
  - H2: ACP-gesprekskoppelingen
  - H3: Configuratie voor threadkoppeling
  - H2: Reacties
  - H2: Geschiedeniscontext
  - H2: Contextzichtbaarheid
  - H2: DM- en ruimtebeleid
  - H2: Reparatie van directe ruimtes
  - H2: Exec-goedkeuringen
  - H2: Slash-commando's
  - H2: Meerdere accounts
  - H2: Privé-/LAN-homeservers
  - H2: Matrix-verkeer proxyen
  - H2: Doelresolutie
  - H2: Configuratiereferentie
  - H3: Account en verbinding
  - H3: Versleuteling
  - H3: Toegang en beleid
  - H3: Antwoordgedrag
  - H3: Reactie-instellingen
  - H3: Tooling en overrides per ruimte
  - H3: Instellingen voor exec-goedkeuring
  - H2: Gerelateerd

## channels/mattermost.md

- Route: /channels/mattermost
- Koppen:
  - H2: Installeren
  - H2: Snel instellen
  - H2: Native slash-commando's
  - H2: Omgevingsvariabelen (standaardaccount)
  - H2: Chatmodi
  - H2: Threads en sessies
  - H2: Toegangsbeheer (DM's)
  - H2: Kanalen (groepen)
  - H2: Doelen voor uitgaande levering
  - H2: Opnieuw proberen voor DM-kanaal
  - H2: Previewstreaming
  - H2: Reacties (berichttool)
  - H2: Interactieve knoppen (berichttool)
  - H3: Directe API-integratie (externe scripts)
  - H2: Directory-adapter
  - H2: Meerdere accounts
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/msteams.md

- Route: /channels/msteams
- Koppen:
  - H2: Gebundelde Plugin
  - H2: Snel instellen
  - H2: Doelen
  - H2: Configuratieschrijfacties
  - H2: Toegangsbeheer (DM's + groepen)
  - H3: Hoe het werkt
  - H3: Stap 1: Azure Bot maken
  - H3: Stap 2: Referenties ophalen
  - H3: Stap 3: Messaging Endpoint configureren
  - H3: Stap 4: Teams-kanaal inschakelen
  - H3: Stap 5: Teams App Manifest bouwen
  - H3: Stap 6: OpenClaw configureren
  - H3: Stap 7: De Gateway uitvoeren
  - H2: Gefedereerde authenticatie (certificaat plus beheerde identiteit)
  - H3: Optie A: Authenticatie op basis van certificaten
  - H3: Optie B: Azure Managed Identity
  - H3: AKS Workload Identity instellen
  - H3: Vergelijking van auth-type
  - H2: Lokale ontwikkeling (tunneling)
  - H2: De Bot testen
  - H2: Omgevingsvariabelen
  - H2: Actie voor ledeninfo
  - H2: Geschiedeniscontext
  - H2: Huidige Teams RSC-machtigingen (manifest)
  - H2: Voorbeeld van Teams-manifest (geredigeerd)
  - H3: Manifest-aandachtspunten (verplichte velden)
  - H3: Een bestaande app bijwerken
  - H2: Mogelijkheden: alleen RSC versus Graph
  - H3: Met alleen Teams RSC (app geïnstalleerd, geen Graph API-machtigingen)
  - H3: Met Teams RSC + Microsoft Graph Application-machtigingen
  - H3: RSC versus Graph API
  - H2: Media + geschiedenis met Graph ingeschakeld (vereist voor kanalen)
  - H2: Bekende beperkingen
  - H3: Webhook-time-outs
  - H3: Ondersteuning voor Teams-cloud en service-URL
  - H3: Opmaak
  - H2: Configuratie
  - H2: Routing en sessies
  - H2: Antwoordstijl: threads versus posts
  - H3: Resolutieprioriteit
  - H3: Behoud van threadcontext
  - H2: Bijlagen en afbeeldingen
  - H2: Bestanden verzenden in groepschats
  - H3: Waarom groepschats SharePoint nodig hebben
  - H3: Instellen
  - H3: Deelgedrag
  - H3: Fallback-gedrag
  - H3: Locatie waar bestanden worden opgeslagen
  - H2: Peilingen (Adaptive Cards)
  - H2: Presentatiekaarten
  - H2: Doelformaten
  - H2: Proactieve berichten
  - H2: Team- en kanaal-ID's (veelvoorkomende valkuil)
  - H2: Privékanalen
  - H2: Probleemoplossing
  - H3: Veelvoorkomende problemen
  - H3: Fouten bij uploaden van manifest
  - H3: RSC-machtigingen werken niet
  - H2: Referenties
  - H2: Gerelateerd

## channels/nextcloud-talk.md

- Route: /channels/nextcloud-talk
- Koppen:
  - H2: Gebundelde Plugin
  - H2: Snel instellen (beginner)
  - H2: Notities
  - H2: Toegangsbeheer (DM's)
  - H2: Ruimtes (groepen)
  - H2: Mogelijkheden
  - H2: Configuratiereferentie (Nextcloud Talk)
  - H2: Gerelateerd

## channels/nostr.md

- Route: /channels/nostr
- Koppen:
  - H2: Gebundelde Plugin
  - H3: Oudere/aangepaste installaties
  - H3: Niet-interactieve installatie
  - H2: Snel instellen
  - H2: Configuratiereferentie
  - H2: Profielmetadata
  - H2: Toegangsbeheer
  - H3: DM-beleid
  - H3: Allowlist-voorbeeld
  - H2: Sleutelformaten
  - H2: Relays
  - H2: Protocolondersteuning
  - H2: Testen
  - H3: Lokale relay
  - H3: Handmatige test
  - H2: Probleemoplossing
  - H3: Geen berichten ontvangen
  - H3: Geen antwoorden verzenden
  - H3: Dubbele antwoorden
  - H2: Beveiliging
  - H2: Beperkingen (MVP)
  - H2: Gerelateerd

## channels/pairing.md

- Route: /channels/pairing
- Koppen:
  - H2: 1) DM-koppeling (toegang tot inkomende chat)
  - H3: Een afzender goedkeuren
  - H3: Herbruikbare afzendergroepen
  - H3: Waar de status staat
  - H2: 2) Node-apparaatkoppeling (iOS/Android/macOS/headless nodes)
  - H3: Koppelen via Telegram (aanbevolen voor iOS)
  - H3: Een Node-apparaat goedkeuren
  - H3: Optionele automatische goedkeuring van Node via vertrouwde CIDR
  - H3: Opslag van Node-koppelingsstatus
  - H3: Notities
  - H2: Gerelateerde documentatie

## channels/qa-channel.md

- Route: /channels/qa-channel
- Koppen:
  - H2: Wat het doet
  - H2: Configuratie
  - H2: Runners
  - H2: Gerelateerd

## channels/qqbot.md

- Route: /channels/qqbot
- Koppen:
  - H2: Installeren
  - H2: Instellen
  - H2: Configureren
  - H3: Instellen van meerdere accounts
  - H3: Groepschats
  - H3: Spraak (STT / TTS)
  - H2: Doelformaten
  - H2: Slash-commando's
  - H2: Engine-architectuur
  - H2: Onboarding met QR-code
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/raft.md

- Route: /channels/raft
- Koppen:
  - H2: Installeren
  - H2: Vereisten
  - H2: Configureren
  - H2: Hoe het werkt
  - H2: Verifiëren
  - H2: Probleemoplossing
  - H2: Referenties

## channels/signal.md

- Route: /channels/signal
- Koppen:
  - H2: Vereisten
  - H2: Snel instellen (beginner)
  - H2: Wat het is
  - H2: Configuratieschrijfacties
  - H2: Het nummermodel (belangrijk)
  - H2: Installatiepad A: bestaand Signal-account koppelen (QR)
  - H2: Installatiepad B: speciaal botnummer registreren (sms, Linux)
  - H2: Externe daemonmodus (httpUrl)
  - H2: Containermodus (bbernhard/signal-cli-rest-api)
  - H2: Toegangsbeheer (DM's + groepen)
  - H2: Hoe het werkt (gedrag)
  - H2: Media + limieten
  - H2: Typen + leesbevestigingen
  - H2: Reacties voor levenscyclusstatus
  - H2: Reacties (berichttool)
  - H2: Goedkeuringsreacties
  - H2: Leveringsdoelen (CLI/Cron)
  - H2: Aliassen
  - H2: Probleemoplossing
  - H2: Beveiligingsnotities
  - H2: Configuratiereferentie (Signal)
  - H2: Gerelateerd

## channels/slack.md

- Route: /channels/slack
- Koppen:
  - H2: Socket Mode of HTTP Request-URL's kiezen
  - H3: Relaymodus
  - H2: Installeren
  - H2: Snel instellen
  - H2: Transportafstemming voor Socket Mode
  - H2: Checklist voor manifest en scopes
  - H3: Aanvullende manifestinstellingen
  - H2: Tokenmodel
  - H2: Acties en gates
  - H2: Toegangsbeheer en routing
  - H2: Threads, sessies en antwoordtags
  - H2: Ack-reacties
  - H3: Emoji (ackReaction)
  - H3: Scope (messages.ackReactionScope)
  - H2: Tekststreaming
  - H2: Fallback voor typereactie
  - H2: Media, chunking en levering
  - H2: Commando's en slash-gedrag
  - H2: Interactieve antwoorden
  - H3: Plugin-eigen modale inzendingen
  - H2: Native goedkeuringen in Slack
  - H2: Gebeurtenissen en operationeel gedrag
  - H2: Configuratiereferentie
  - H2: Probleemoplossing
  - H2: Referentie voor bijlagevisie
  - H3: Ondersteunde mediatypen
  - H3: Inkomende pipeline
  - H3: Overerving van bijlagen uit threadroot
  - H3: Verwerking van meerdere bijlagen
  - H3: Grootte-, download- en modellimieten
  - H3: Bekende limieten
  - H3: Gerelateerde documentatie
  - H2: Gerelateerd

## channels/sms.md

- Route: /channels/sms
- Koppen:
  - H2: Voordat je begint
  - H2: Snel instellen
  - H2: Configuratievoorbeelden
  - H3: Configuratiebestand
  - H3: Omgevingsvariabelen
  - H3: SecretRef-auth-token
  - H3: Privénummer met alleen allowlist
  - H3: Afzender van Messaging Service
  - H3: Standaard uitgaand doel
  - H2: Toegangsbeheer
  - H2: Sms verzenden
  - H2: Installatie verifiëren
  - H3: End-to-end-test vanuit macOS iMessage/sms
  - H2: Webhook-beveiliging
  - H2: Configuratie voor meerdere accounts
  - H2: Probleemoplossing
  - H3: Twilio retourneert 403 of OpenClaw weigert de Webhook
  - H3: Er verschijnt geen koppelingsverzoek
  - H3: Uitgaand verzenden mislukt
  - H3: Berichten komen aan, maar de agent antwoordt niet

## channels/synology-chat.md

- Route: /channels/synology-chat
- Koppen:
  - H2: Gebundelde Plugin
  - H2: Snel instellen
  - H2: Omgevingsvariabelen
  - H2: DM-beleid en toegangsbeheer
  - H2: Uitgaande levering
  - H2: Meerdere accounts
  - H2: Beveiligingsnotities
  - H2: Probleemoplossing
  - H2: Gerelateerd

## channels/telegram.md

- Route: /channels/telegram
- Koppen:
  - H2: Snel instellen
  - H2: Instellingen aan Telegram-zijde
  - H2: Toegangsbeheer en activering
  - H3: Groepsbotidentiteit
  - H2: Runtimegedrag
  - H2: Functiereferentie
  - H2: Regelaars voor foutantwoorden
  - H2: Probleemoplossing
  - H2: Configuratiereferentie
  - H2: Gerelateerd

## channels/tlon.md

- Route: /channels/tlon
- Koppen:
  - H2: Gebundelde Plugin
  - H2: Instellen
  - H2: Privé-/LAN-ships
  - H2: Groepskanalen
  - H2: Toegangsbeheer
  - H2: Eigenaar- en goedkeuringssysteem
  - H2: Instellingen voor automatisch accepteren
  - H2: Leveringsdoelen (CLI/Cron)
  - H2: Gebundelde skill
  - H2: Mogelijkheden
  - H2: Probleemoplossing
  - H2: Configuratiereferentie
  - H2: Notities
  - H2: Gerelateerd

## channels/troubleshooting.md

- Route: /channels/troubleshooting
- Koppen:
  - H2: Commandoladder
  - H2: Na een update
  - H2: WhatsApp
  - H3: WhatsApp-foutsignaturen
  - H2: Telegram
  - H3: Telegram-foutsignaturen
  - H2: Discord
  - H3: Discord-foutsignaturen
  - H2: Slack
  - H3: Slack-foutsignaturen
  - H2: iMessage
  - H3: iMessage-foutsignaturen
  - H2: Signal
  - H3: Signal-foutsignaturen
  - H2: QQ Bot
  - H3: QQ Bot-foutsignaturen
  - H2: Matrix
  - H3: Matrix-foutsignaturen
  - H2: Gerelateerd

## channels/twitch.md

- Route: /channels/twitch
- Koppen:
  - H2: Gebundelde plugin
  - H2: Snelle configuratie (beginner)
  - H2: Wat het is
  - H2: Configuratie (gedetailleerd)
  - H3: Inloggegevens genereren
  - H3: De bot configureren
  - H3: Toegangscontrole (aanbevolen)
  - H2: Tokenverversing (optioneel)
  - H2: Ondersteuning voor meerdere accounts
  - H2: Toegangscontrole
  - H2: Probleemoplossing
  - H2: Configuratie
  - H3: Accountconfiguratie
  - H3: Provideropties
  - H2: Toolacties
  - H2: Veiligheid en beheer
  - H2: Limieten
  - H2: Gerelateerd

## channels/wechat.md

- Route: /channels/wechat
- Koppen:
  - H2: Naamgeving
  - H2: Hoe het werkt
  - H2: Installeren
  - H2: Inloggen
  - H2: Toegangscontrole
  - H2: Compatibiliteit
  - H2: Sidecar-proces
  - H2: Probleemoplossing
  - H2: Gerelateerde docs

## channels/whatsapp.md

- Route: /channels/whatsapp
- Koppen:
  - H2: Installeren (op aanvraag)
  - H2: Snelle configuratie
  - H2: De huidige aanvrager bellen met MeowCaller (experimenteel)
  - H2: Implementatiepatronen
  - H2: Runtimemodel
  - H2: Goedkeuringsprompts
  - H2: Plugin-hooks en privacy
  - H2: Toegangscontrole en activering
  - H2: Geconfigureerde ACP-bindingen
  - H2: Gedrag voor persoonlijke nummers en zelf-chat
  - H2: Berichtnormalisatie en context
  - H2: Bezorging, opsplitsing en media
  - H2: Antwoordcitaat
  - H2: Reactieniveau
  - H2: Bevestigingsreacties
  - H2: Levenscyclusstatusreacties
  - H2: Meerdere accounts en inloggegevens
  - H2: Tools, acties en configuratieschrijfacties
  - H2: Probleemoplossing
  - H2: Systeemprompts
  - H2: Verwijzingen naar configuratiereferentie
  - H2: Gerelateerd

## channels/yuanbao.md

- Route: /channels/yuanbao
- Koppen:
  - H2: Snel starten
  - H3: Interactieve configuratie (alternatief)
  - H2: Toegangscontrole
  - H3: Directe berichten
  - H3: Groepschats
  - H2: Configuratievoorbeelden
  - H3: Basisconfiguratie met open DM-beleid
  - H3: DM's beperken tot specifieke gebruikers
  - H3: Vereiste voor @vermelding in groepen uitschakelen
  - H3: Uitgaande berichtbezorging optimaliseren
  - H3: Samenvoegtekststrategie afstemmen
  - H2: Veelgebruikte opdrachten
  - H2: Probleemoplossing
  - H3: Bot reageert niet in groepschats
  - H3: Bot ontvangt geen berichten
  - H3: Bot stuurt lege antwoorden of fallback-antwoorden
  - H3: App Secret gelekt
  - H2: Geavanceerde configuratie
  - H3: Meerdere accounts
  - H3: Berichtlimieten
  - H3: Streaming
  - H3: Geschiedeniscontext van groepschat
  - H3: Antwoord-aan-modus
  - H3: Markdown-hintinjectie
  - H3: Debugmodus
  - H3: Routering met meerdere agents
  - H2: Configuratiereferentie
  - H2: Ondersteunde berichttypen
  - H3: Ontvangen
  - H3: Verzenden
  - H3: Threads en antwoorden
  - H2: Gerelateerd

## channels/zalo.md

- Route: /channels/zalo
- Koppen:
  - H2: Gebundelde plugin
  - H2: Snelle configuratie (beginner)
  - H2: Wat het is
  - H2: Configuratie (snel traject)
  - H3: 1) Een bot-token maken (Zalo Bot Platform)
  - H3: 2) Het token configureren (env of configuratie)
  - H2: Hoe het werkt (gedrag)
  - H2: Limieten
  - H2: Toegangscontrole (DM's)
  - H3: DM-toegang
  - H2: Toegangscontrole (groepen)
  - H2: Long-polling versus webhook
  - H2: Ondersteunde berichttypen
  - H2: Mogelijkheden
  - H2: Bezorgdoelen (CLI/cron)
  - H2: Probleemoplossing
  - H2: Configuratiereferentie (Zalo)
  - H2: Gerelateerd

## channels/zaloclawbot.md

- Route: /channels/zaloclawbot
- Koppen:
  - H2: Compatibiliteit
  - H2: Vereisten
  - H2: Installeren met onboard (aanbevolen)
  - H2: Handmatige installatie
  - H3: 1. De plugin installeren
  - H3: 2. De plugin inschakelen in de configuratie
  - H3: 3. QR-code genereren en inloggen
  - H3: 4. De gateway herstarten
  - H2: Hoe het werkt
  - H2: Onder de motorkap
  - H2: Probleemoplossing

## channels/zalouser.md

- Route: /channels/zalouser
- Koppen:
  - H2: Gebundelde plugin
  - H2: Snelle configuratie (beginner)
  - H2: Wat het is
  - H2: Naamgeving
  - H2: ID's vinden (directory)
  - H2: Limieten
  - H2: Toegangscontrole (DM's)
  - H2: Groepstoegang (optioneel)
  - H3: Groepsvermeldingsgating
  - H2: Meerdere accounts
  - H2: Omgevingsvariabelen
  - H2: Typen, reacties en bezorgbevestigingen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## ci.md

- Route: /ci
- Koppen:
  - H2: Pipeline-overzicht
  - H2: Fail-fast-volgorde
  - H2: PR-context en bewijs
  - H2: Scope en routering
  - H2: Doorsturen van ClawSweeper-activiteit
  - H2: Handmatige dispatches
  - H2: Runners
  - H2: Budget voor runnerregistratie
  - H2: Lokale equivalenten
  - H2: OpenClaw Performance
  - H2: Volledige releasevalidatie
  - H2: Live- en E2E-shards
  - H2: Pakketacceptatie
  - H3: Jobs
  - H3: Kandidaatbronnen
  - H3: Suiteprofielen
  - H3: Legacy-compatibiliteitsvensters
  - H3: Voorbeelden
  - H2: Installatiesmoke
  - H2: Lokale Docker-E2E
  - H3: Afstemmingen
  - H3: Herbruikbare live/E2E-workflow
  - H3: Releasepad-chunks
  - H2: Plugin Prerelease
  - H2: QA Lab
  - H2: CodeQL
  - H3: Beveiligingscategorieën
  - H3: Platformspecifieke beveiligingsshards
  - H3: Critical Quality-categorieën
  - H2: Onderhoudsworkflows
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: Dubbele PR's na samenvoegen
  - H2: Lokale check-gates en gewijzigde routering
  - H2: Testbox-validatie
  - H2: Gerelateerd

## clawhub/cli.md

- Route: /clawhub/cli
- Koppen:
  - H1: ClawHub CLI
  - H2: Ontdekken en installeren
  - H2: Publiceren en onderhouden
  - H2: Gerelateerd

## clawhub/publishing.md

- Route: /clawhub/publishing
- Koppen:
  - H1: Publiceren op ClawHub
  - H2: Eigenaren
  - H2: Skills
  - H2: Plugins
  - H2: Release Flow
  - H2: FAQ
  - H3: Pakketscope moet overeenkomen met geselecteerde eigenaar

## cli/acp.md

- Route: /cli/acp
- Koppen:
  - H2: Wat dit niet is
  - H2: Compatibiliteitsmatrix
  - H2: Bekende beperkingen
  - H2: Gebruik
  - H2: ACP-client (debug)
  - H2: Protocol-smoketest
  - H2: Hoe je dit gebruikt
  - H2: Agents selecteren
  - H2: Gebruiken vanuit acpx (Codex, Claude, andere ACP-clients)
  - H2: Zed-editorconfiguratie
  - H2: Sessietoewijzing
  - H2: Opties
  - H3: acp-clientopties
  - H2: Gerelateerd

## cli/agent.md

- Route: /cli/agent
- Koppen:
  - H1: openclaw agent
  - H2: Opties
  - H2: Voorbeelden
  - H2: Notities
  - H2: JSON-bezorgstatus
  - H2: Gerelateerd

## cli/agents.md

- Route: /cli/agents
- Koppen:
  - H1: openclaw agents
  - H2: Voorbeelden
  - H2: Routeringsbindingen
  - H3: --bind-indeling
  - H3: Gedrag van bindingsscope
  - H2: Opdrachtoppervlak
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Identiteitsbestanden
  - H2: Identiteit instellen
  - H2: Gerelateerd

## cli/approvals.md

- Route: /cli/approvals
- Koppen:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Veelgebruikte opdrachten
  - H2: Goedkeuringen vervangen vanuit een bestand
  - H2: Voorbeeld voor "Nooit vragen" / YOLO
  - H2: Allowlist-helpers
  - H2: Veelgebruikte opties
  - H2: Notities
  - H2: Gerelateerd

## cli/attach.md

- Route: /cli/attach
- Koppen: geen

## cli/backup.md

- Route: /cli/backup
- Koppen:
  - H1: openclaw backup
  - H2: Notities
  - H2: Waarvan een back-up wordt gemaakt
  - H2: Gedrag bij ongeldige configuratie
  - H2: Grootte en prestaties
  - H2: Gerelateerd

## cli/browser.md

- Route: /cli/browser
- Koppen:
  - H1: openclaw browser
  - H2: Veelgebruikte vlaggen
  - H2: Snel starten (lokaal)
  - H2: Snelle probleemoplossing
  - H2: Levenscyclus
  - H2: Als de opdracht ontbreekt
  - H2: Profielen
  - H2: Tabbladen
  - H2: Snapshot / screenshot / acties
  - H2: Status en opslag
  - H2: Debuggen
  - H2: Bestaande Chrome via MCP
  - H2: Browserbesturing op afstand (node-hostproxy)
  - H2: Gerelateerd

## cli/channels.md

- Route: /cli/channels
- Koppen:
  - H1: openclaw channels
  - H2: Veelgebruikte opdrachten
  - H2: Status / mogelijkheden / oplossen / logs
  - H2: Accounts toevoegen / verwijderen
  - H2: Inloggen en uitloggen (interactief)
  - H2: Probleemoplossing
  - H2: Mogelijkhedenprobe
  - H2: Namen oplossen naar ID's
  - H2: Gerelateerd

## cli/clawbot.md

- Route: /cli/clawbot
- Koppen:
  - H1: openclaw clawbot
  - H2: Migratie
  - H2: Gerelateerd

## cli/commitments.md

- Route: /cli/commitments
- Koppen:
  - H2: Gebruik
  - H2: Opties
  - H2: Voorbeelden
  - H2: Uitvoer
  - H2: Gerelateerd

## cli/completion.md

- Route: /cli/completion
- Koppen:
  - H1: openclaw completion
  - H2: Gebruik
  - H2: Opties
  - H2: Notities
  - H2: Gerelateerd

## cli/config.md

- Route: /cli/config
- Koppen:
  - H2: Rootopties
  - H2: Voorbeelden
  - H3: config-schema
  - H3: Paden
  - H2: Waarden
  - H2: config set-modi
  - H2: config patch
  - H2: Provider-buildervlaggen
  - H2: Dry run
  - H3: Vorm van JSON-uitvoer
  - H2: Schrijfveiligheid
  - H2: Subopdrachten
  - H2: Valideren
  - H2: Gerelateerd

## cli/configure.md

- Route: /cli/configure
- Koppen:
  - H1: openclaw configure
  - H2: Opties
  - H2: Voorbeelden
  - H2: Gerelateerd

## cli/crestodian.md

- Route: /cli/crestodian
- Koppen:
  - H1: openclaw crestodian
  - H2: Wat Crestodian toont
  - H2: Voorbeelden
  - H2: Veilig opstarten
  - H2: Bewerkingen en goedkeuring
  - H2: Setup-bootstrap
  - H2: Model-Assisted Planner
  - H2: Overschakelen naar een agent
  - H2: Berichtenreddingsmodus
  - H2: Gerelateerd

## cli/cron.md

- Route: /cli/cron
- Koppen:
  - H1: openclaw cron
  - H2: Snel jobs maken
  - H2: Sessies
  - H2: Bezorging
  - H3: Eigenaarschap van bezorging
  - H3: Bezorging bij fouten
  - H2: Planning
  - H3: Eenmalige jobs
  - H3: Terugkerende jobs
  - H3: Handmatige uitvoeringen
  - H2: Modellen
  - H3: Voorrang van geïsoleerd cron-model
  - H3: Snelle modus
  - H3: Nieuwe pogingen voor live modelwisseling
  - H2: Uitvoer en weigeringen van runs
  - H3: Onderdrukking van verouderde bevestigingen
  - H3: Onderdrukking van stille tokens
  - H3: Gestructureerde weigeringen
  - H2: Bewaring
  - H2: Oudere jobs migreren
  - H2: Veelgebruikte bewerkingen
  - H2: Veelgebruikte beheerdersopdrachten
  - H2: Gerelateerd

## cli/daemon.md

- Route: /cli/daemon
- Koppen:
  - H1: openclaw daemon
  - H2: Gebruik
  - H2: Subopdrachten
  - H2: Veelgebruikte opties
  - H2: Voorkeur
  - H2: Gerelateerd

## cli/dashboard.md

- Route: /cli/dashboard
- Koppen:
  - H1: openclaw dashboard
  - H2: Gerelateerd

## cli/devices.md

- Route: /cli/devices
- Koppen:
  - H1: openclaw devices
  - H2: Opdrachten
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Eerste goedkeuring voor Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Veelgebruikte opties
  - H2: Notities
  - H2: Checklist voor herstel van tokendrift
  - H2: Gerelateerd

## cli/directory.md

- Route: /cli/directory
- Koppen:
  - H1: openclaw directory
  - H2: Veelgebruikte vlaggen
  - H2: Notities
  - H2: Resultaten gebruiken met berichten verzenden
  - H2: ID-indelingen (per kanaal)
  - H2: Zelf ("me")
  - H2: Peers (contacten/gebruikers)
  - H2: Groepen
  - H2: Gerelateerd

## cli/dns.md

- Route: /cli/dns
- Koppen:
  - H1: openclaw dns
  - H2: Configuratie
  - H2: dns setup
  - H2: Gerelateerd

## cli/docs.md

- Route: /cli/docs
- Koppen:
  - H1: openclaw docs
  - H2: Gebruik
  - H2: Voorbeelden
  - H2: Hoe het werkt
  - H2: Uitvoer
  - H2: Afsluitcodes
  - H2: Gerelateerd

## cli/doctor.md

- Route: /cli/doctor
- Koppen:
  - H1: openclaw doctor
  - H2: Waarom gebruiken
  - H2: Voorbeelden
  - H2: Opties
  - H2: Lintmodus
  - H2: Gestructureerde statuscontroles
  - H2: Checkselectie
  - H2: Post-upgrademodus
  - H2: macOS: launchctl-env-overschrijvingen
  - H2: Gerelateerd

## cli/flows.md

- Route: /cli/flows
- Koppen:
  - H1: openclaw tasks flow
  - H2: Subopdrachten
  - H3: Statusfilterwaarden
  - H2: Voorbeelden
  - H2: Gerelateerd

## cli/gateway.md

- Route: /cli/gateway
- Koppen:
  - H2: De Gateway uitvoeren
  - H3: Opties
  - H2: De Gateway herstarten
  - H3: Gateway-profilering
  - H2: Een actieve Gateway opvragen
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Op afstand via SSH (pariteit met Mac-app)
  - H3: gateway call &lt;method&gt;
  - H2: De Gateway-service beheren
  - H3: Installeren met een wrapper
  - H2: Gateways ontdekken (Bonjour)
  - H3: gateway discover
  - H2: Gerelateerd

## cli/health.md

- Route: /cli/health
- Koppen:
  - H1: openclaw health
  - H2: Opties
  - H2: Gerelateerd

## cli/hooks.md

- Route: /cli/hooks
- Koppen:
  - H1: openclaw hooks
  - H2: Alle hooks weergeven
  - H2: Hook-informatie ophalen
  - H2: Geschiktheid van hooks controleren
  - H2: Een Hook inschakelen
  - H2: Een Hook uitschakelen
  - H2: Opmerkingen
  - H2: Hook-pakketten installeren
  - H2: Hook-pakketten bijwerken
  - H2: Meegeleverde hooks
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Gerelateerd

## cli/index.md

- Route: /cli
- Koppen:
  - H2: Commandopagina's
  - H2: Globale vlaggen
  - H2: Uitvoermodi
  - H2: Commandostructuur
  - H2: Slash-commands in chat
  - H2: Gebruiksregistratie
  - H2: Gerelateerd

## cli/infer.md

- Route: /cli/infer
- Koppen:
  - H2: infer omzetten in een skill
  - H2: Waarom infer gebruiken
  - H2: Commandostructuur
  - H2: Veelvoorkomende taken
  - H2: Gedrag
  - H2: Model
  - H2: Afbeelding
  - H2: Audio
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Inbedding
  - H2: JSON-uitvoer
  - H2: Veelvoorkomende valkuilen
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/logs.md

- Route: /cli/logs
- Koppen:
  - H1: openclaw logs
  - H2: Opties
  - H2: Gedeelde Gateway RPC-opties
  - H2: Voorbeelden
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/mcp.md

- Route: /cli/mcp
- Koppen:
  - H2: Kies het juiste MCP-pad
  - H2: OpenClaw als MCP-server
  - H3: Wanneer serve gebruiken
  - H3: Hoe het werkt
  - H3: Kies een clientmodus
  - H3: Wat serve beschikbaar stelt
  - H3: Gebruik
  - H3: Bridge-tools
  - H3: Gebeurtenismodel
  - H3: Claude-kanaalmeldingen
  - H3: MCP-clientconfiguratie
  - H3: Opties
  - H3: Beveiligings- en vertrouwensgrens
  - H3: Testen
  - H3: Probleemoplossing
  - H2: OpenClaw als MCP-clientregister
  - H3: Opgeslagen MCP-serverdefinities
  - H3: Veelvoorkomende serverrecepten
  - H3: JSON-uitvoervormen
  - H3: Stdio-transport
  - H3: SSE / HTTP-transport
  - H3: OAuth-workflow
  - H3: Streambaar HTTP-transport
  - H2: Control-UI
  - H2: Huidige beperkingen
  - H2: Gerelateerd

## cli/memory.md

- Route: /cli/memory
- Koppen:
  - H1: openclaw memory
  - H2: Voorbeelden
  - H2: Opties
  - H2: Dreaming
  - H2: Gerelateerd

## cli/message.md

- Route: /cli/message
- Koppen:
  - H1: openclaw message
  - H2: Gebruik
  - H2: Veelvoorkomende vlaggen
  - H2: SecretRef-gedrag
  - H2: Acties
  - H3: Kern
  - H3: Discussielijnen
  - H3: Emoji's
  - H3: Stickers
  - H3: Rollen / Kanalen / Leden / Spraak
  - H3: Gebeurtenissen
  - H3: Moderatie (Discord)
  - H3: Uitzending
  - H2: Voorbeelden
  - H2: Gerelateerd

## cli/migrate.md

- Route: /cli/migrate
- Koppen:
  - H1: openclaw migrate
  - H2: Commando's
  - H2: Veiligheidsmodel
  - H2: Claude-provider
  - H3: Wat Claude importeert
  - H3: Archief- en handmatige-reviewstatus
  - H2: Codex-provider
  - H3: Wat Codex importeert
  - H3: Handmatige-reviewstatus van Codex
  - H2: Hermes-provider
  - H3: Wat Hermes importeert
  - H3: Ondersteunde .env-sleutels
  - H3: Alleen-archiefstatus
  - H3: Na toepassen
  - H2: Plugin-contract
  - H2: Onboarding-integratie
  - H2: Gerelateerd

## cli/models.md

- Route: /cli/models
- Koppen:
  - H1: openclaw models
  - H2: Veelvoorkomende commando's
  - H3: Modellen scannen
  - H3: Modellenstatus
  - H2: Aliassen + fallbacks
  - H2: Auth-profielen
  - H2: Gerelateerd

## cli/node.md

- Route: /cli/node
- Koppen:
  - H1: openclaw node
  - H2: Waarom een node-host gebruiken?
  - H2: Browserproxy (zero-config)
  - H2: Uitvoeren (voorgrond)
  - H2: Gateway-auth voor node-host
  - H2: Service (achtergrond)
  - H2: Koppeling
  - H2: Exec-goedkeuringen
  - H2: Gerelateerd

## cli/nodes.md

- Route: /cli/nodes
- Koppen:
  - H1: openclaw nodes
  - H2: Veelvoorkomende commando's
  - H2: Aanroepen
  - H2: Gerelateerd

## cli/onboard.md

- Route: /cli/onboard
- Koppen:
  - H1: openclaw onboard
  - H2: Gerelateerde gidsen
  - H2: Voorbeelden
  - H2: Landinstelling
  - H3: Niet-interactieve Z.AI-eindpuntkeuzes
  - H2: Extra niet-interactieve vlaggen
  - H2: Flow-opmerkingen
  - H2: Veelvoorkomende vervolgcommando's

## cli/pairing.md

- Route: /cli/pairing
- Koppen:
  - H1: openclaw pairing
  - H2: Commando's
  - H2: pairing list
  - H2: pairing approve
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/path.md

- Route: /cli/path
- Koppen:
  - H1: openclaw path
  - H2: Waarom het gebruiken
  - H2: Hoe het wordt gebruikt
  - H2: Hoe het werkt
  - H2: Subcommando's
  - H2: Globale vlaggen
  - H2: oc://-syntaxis
  - H2: Adresseren op bestandstype
  - H2: Mutatiecontract
  - H2: Voorbeelden
  - H2: Recepten per bestandstype
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Subcommandoreferentie
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Afsluitcodes
  - H2: Uitvoermodus
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/plugins.md

- Route: /cli/plugins
- Koppen:
  - H2: Commando's
  - H3: Auteur
  - H3: Provider-scaffold
  - H3: Installeren
  - H4: Marketplace-shorthand
  - H3: Lijst
  - H3: Plugin-index
  - H3: Verwijderen
  - H3: Bijwerken
  - H3: Inspecteren
  - H3: Doctor
  - H3: Register
  - H3: Marketplace
  - H2: Gerelateerd

## cli/policy.md

- Route: /cli/policy
- Koppen:
  - H1: openclaw policy
  - H2: Snel starten
  - H3: Referentie voor beleidsregels
  - H4: Scoped overlays
  - H4: Kanalen
  - H4: MCP-servers
  - H4: Modelproviders
  - H4: Netwerk
  - H4: Ingress en kanaaltoegang
  - H4: Gateway
  - H4: Agent-werkruimte
  - H4: Sandbox-houding
  - H4: Gegevensverwerking
  - H4: Geheimen
  - H4: Exec-goedkeuringen
  - H4: Auth-profielen
  - H4: Tool-metadata
  - H4: Tool-houding
  - H2: Beleid configureren
  - H2: Beleidsstatus accepteren
  - H2: Bevindingen
  - H2: Herstellen
  - H2: Afsluitcodes
  - H2: Gerelateerd

## cli/proxy.md

- Route: /cli/proxy
- Koppen:
  - H1: openclaw proxy
  - H2: Commando's
  - H2: Valideren
  - H2: Query-presets
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/qr.md

- Route: /cli/qr
- Koppen:
  - H1: openclaw qr
  - H2: Gebruik
  - H2: Opties
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/reset.md

- Route: /cli/reset
- Koppen:
  - H1: openclaw reset
  - H2: Gerelateerd

## cli/sandbox.md

- Route: /cli/sandbox
- Koppen:
  - H2: Overzicht
  - H2: Commando's
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Gebruikssituaties
  - H3: Na het bijwerken van een Docker-image
  - H3: Na het wijzigen van sandbox-configuratie
  - H3: Na het wijzigen van SSH-doel of SSH-auth-materiaal
  - H3: Na het wijzigen van OpenShell-bron, beleid of modus
  - H3: Na het wijzigen van setupCommand
  - H3: Alleen voor een specifieke agent
  - H2: Waarom dit nodig is
  - H2: Registermigratie
  - H2: Configuratie
  - H2: Gerelateerd

## cli/secrets.md

- Route: /cli/secrets
- Koppen:
  - H1: openclaw secrets
  - H2: Runtime-snapshot opnieuw laden
  - H2: Audit
  - H2: Configureren (interactieve helper)
  - H2: Een opgeslagen plan toepassen
  - H2: Waarom geen rollback-back-ups
  - H2: Voorbeeld
  - H2: Gerelateerd

## cli/security.md

- Route: /cli/security
- Koppen:
  - H1: openclaw security
  - H2: Audit
  - H2: JSON-uitvoer
  - H2: Wat --fix wijzigt
  - H2: Gerelateerd

## cli/sessions.md

- Route: /cli/sessions
- Koppen:
  - H1: openclaw sessions
  - H2: Opschoononderhoud
  - H2: Een sessie comprimeren
  - H3: sessions.compact RPC
  - H2: Gerelateerd

## cli/setup.md

- Route: /cli/setup
- Koppen:
  - H1: openclaw setup
  - H2: Opties
  - H3: Baseline-modus
  - H2: Voorbeelden
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/skills.md

- Route: /cli/skills
- Koppen:
  - H1: openclaw skills
  - H2: Commando's
  - H2: Skill-workshop
  - H2: Gerelateerd

## cli/status.md

- Route: /cli/status
- Koppen:
  - H2: Gerelateerd

## cli/system.md

- Route: /cli/system
- Koppen:
  - H1: openclaw system
  - H2: Veelvoorkomende commando's
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Opmerkingen
  - H2: Gerelateerd

## cli/tasks.md

- Route: /cli/tasks
- Koppen:
  - H2: Gebruik
  - H2: Root-opties
  - H2: Subcommando's
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Gerelateerd

## cli/transcripts.md

- Route: /cli/transcripts
- Koppen:
  - H1: openclaw transcripts
  - H2: Commando's
  - H2: Uitvoer
  - H2: Veel vergaderingen per dag
  - H2: Ontbrekende samenvattingen
  - H2: Configuratie

## cli/tui.md

- Route: /cli/tui
- Koppen:
  - H1: openclaw tui
  - H2: Opties
  - H2: Voorbeelden
  - H2: Configuratieherstellus
  - H2: Gerelateerd

## cli/uninstall.md

- Route: /cli/uninstall
- Koppen:
  - H1: openclaw uninstall
  - H2: Gerelateerd

## cli/update.md

- Route: /cli/update
- Koppen:
  - H1: openclaw update
  - H2: Gebruik
  - H2: Opties
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Wat het doet
  - H3: Antwoordvorm van control-plane
  - H2: Git-checkoutflow
  - H3: Kanaalselectie
  - H3: Updatestappen
  - H2: --update-shorthand
  - H2: Gerelateerd

## cli/voicecall.md

- Route: /cli/voicecall
- Koppen:
  - H1: openclaw voicecall
  - H2: Subcommando's
  - H2: Setup en smoke
  - H3: setup
  - H3: smoke
  - H2: Gesprekslevenscyclus
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Logs en metriek
  - H3: tail
  - H3: latency
  - H2: Webhooks blootstellen
  - H3: expose
  - H2: Gerelateerd

## cli/webhooks.md

- Route: /cli/webhooks
- Koppen:
  - H1: openclaw webhooks
  - H2: Subcommando's
  - H2: webhooks gmail setup
  - H3: Vereist
  - H3: Pub/Sub-opties
  - H3: OpenClaw-bezorgopties
  - H3: gog watch serve-opties
  - H3: Tailscale-blootstelling
  - H3: Uitvoer
  - H2: webhooks gmail run
  - H2: End-to-endflow
  - H2: Gerelateerd

## cli/wiki.md

- Route: /cli/wiki
- Koppen:
  - H1: openclaw wiki
  - H2: Waarvoor het bedoeld is
  - H2: Veelvoorkomende commando's
  - H2: Commando's
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Praktische gebruiksrichtlijnen
  - H2: Configuratiekoppelingen
  - H2: Gerelateerd

## cli/workboard.md

- Route: /cli/workboard
- Koppen:
  - H2: Gebruik
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Pariteit van slash-commands
  - H2: Machtigingen
  - H2: Probleemoplossing
  - H3: Er verschijnen geen kaarten
  - H3: Dispatch meldt alleen-gegevens
  - H3: Dispatch start niets
  - H2: Gerelateerd

## concepts/active-memory.md

- Route: /concepts/active-memory
- Koppen:
  - H2: Snel starten
  - H2: Snelheidsaanbevelingen
  - H3: Cerebras-setup
  - H2: Hoe u het ziet
  - H2: Sessieschakelaar
  - H2: Wanneer het draait
  - H2: Sessietypen
  - H2: Waar het draait
  - H2: Waarom het gebruiken
  - H2: Hoe het werkt
  - H2: Querymodi
  - H2: Promptstijlen
  - H2: Fallbackbeleid voor modellen
  - H2: Geheugentools
  - H3: Ingebouwde memory-core
  - H3: LanceDB-geheugen
  - H3: Lossless Claw
  - H2: Geavanceerde nooduitgangen
  - H2: Transcriptpersistentie
  - H2: Configuratie
  - H2: Aanbevolen setup
  - H3: Cold-start-grace
  - H2: Debuggen
  - H2: Veelvoorkomende problemen
  - H2: Gerelateerde pagina's

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Koppen:
  - H2: Invoerpunten
  - H2: Hoe het werkt (op hoog niveau)
  - H2: Wachtrij + gelijktijdigheid
  - H2: Sessie- + werkruimtevoorbereiding
  - H2: Promptassemblage + systeemprompt
  - H2: Hook-punten (waar u kunt ingrijpen)
  - H3: Interne hooks (Gateway-hooks)
  - H3: Plugin-hooks (levenscyclus van agent + gateway)
  - H2: Streaming + gedeeltelijke antwoorden
  - H2: Tooluitvoering + berichtentools
  - H2: Antwoordvorming + onderdrukking
  - H2: Compaction + nieuwe pogingen
  - H2: Gebeurtenisstreams (vandaag)
  - H2: Chatkanaalafhandeling
  - H2: Time-outs
  - H2: Waar dingen vroegtijdig kunnen eindigen
  - H2: Gerelateerd

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Koppen:
  - H2: Codex-oppervlakken
  - H2: Runtime-eigenaarschap
  - H2: Runtimeselectie
  - H2: GitHub Copilot-agentruntime
  - H2: Compatibiliteitscontract
  - H2: Statuslabels
  - H2: Gerelateerd

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- Koppen:
  - H2: Standaardlocatie
  - H2: Extra werkruimtemappen
  - H2: Bestandskaart van de werkruimte
  - H2: Wat NIET in de werkruimte staat
  - H2: Git-back-up (aanbevolen, privé)
  - H2: Commit geen geheimen
  - H2: De werkruimte naar een nieuwe machine verplaatsen
  - H2: Geavanceerde opmerkingen
  - H2: Gerelateerd

## concepts/agent.md

- Route: /concepts/agent
- Koppen:
  - H2: Werkruimte (vereist)
  - H2: Bootstrap-bestanden (geïnjecteerd)
  - H2: Ingebouwde tools
  - H2: Skills
  - H2: Runtimegrenzen
  - H2: Sessies
  - H2: Bijsturen tijdens streamen
  - H2: Modelverwijzingen
  - H2: Configuratie (minimaal)
  - H2: Gerelateerd

## concepts/architecture.md

- Route: /concepts/architecture
- Koppen:
  - H2: Overzicht
  - H2: Componenten en stromen
  - H3: Gateway (daemon)
  - H3: Clients (Mac-app / CLI / webbeheer)
  - H3: Nodes (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Levenscyclus van de verbinding (één client)
  - H2: Wire-protocol (samenvatting)
  - H2: Koppeling + lokaal vertrouwen
  - H2: Protocoltypering en codegen
  - H2: Externe toegang
  - H2: Momentopname van bewerkingen
  - H2: Invarianten
  - H2: Gerelateerd

## concepts/channel-docking.md

- Route: /concepts/channel-docking
- Koppen:
  - H2: Voorbeeld
  - H2: Waarom dit gebruiken
  - H2: Vereiste configuratie
  - H2: Opdrachten
  - H2: Wat verandert
  - H2: Wat niet verandert
  - H2: Probleemoplossing

## concepts/commitments.md

- Route: /concepts/commitments
- Koppen:
  - H2: Toezeggingen inschakelen
  - H2: Hoe het werkt
  - H2: Bereik
  - H2: Toezeggingen versus herinneringen
  - H2: Toezeggingen beheren
  - H2: Privacy en kosten
  - H2: Probleemoplossing
  - H2: Gerelateerd

## concepts/compaction.md

- Route: /concepts/compaction
- Koppen:
  - H2: Hoe het werkt
  - H2: Automatische Compaction
  - H2: Handmatige Compaction
  - H2: Configuratie
  - H3: Een ander model gebruiken
  - H3: Behoud van identifiers
  - H3: Bytebewaking van actief transcript
  - H3: Opvolgende transcripties
  - H3: Compaction-meldingen
  - H3: Geheugenflush
  - H2: Inplugbare Compaction-providers
  - H2: Compaction versus snoeien
  - H2: Probleemoplossing
  - H2: Gerelateerd

## concepts/context-engine.md

- Route: /concepts/context-engine
- Koppen:
  - H2: Snel starten
  - H2: Hoe het werkt
  - H3: Levenscyclus van subagent (optioneel)
  - H3: Toevoeging aan systeemprompt
  - H2: De legacy-engine
  - H2: Plugin-engines
  - H3: De ContextEngine-interface
  - H3: Runtime-instellingen
  - H3: Hostvereisten
  - H3: Foutisolatie
  - H3: ownsCompaction
  - H2: Configuratiereferentie
  - H2: Relatie met Compaction en geheugen
  - H2: Tips
  - H2: Gerelateerd

## concepts/context.md

- Route: /concepts/context
- Koppen:
  - H2: Snel starten (context inspecteren)
  - H2: Voorbeelduitvoer
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Wat meetelt voor het contextvenster
  - H2: Hoe OpenClaw de systeemprompt opbouwt
  - H2: Geïnjecteerde werkruimtebestanden (Projectcontext)
  - H2: Skills: geïnjecteerd versus op aanvraag geladen
  - H2: Tools: er zijn twee kosten
  - H2: Opdrachten, richtlijnen en "inline snelkoppelingen"
  - H2: Sessies, Compaction en snoeien (wat blijft bestaan)
  - H2: Wat /context daadwerkelijk rapporteert
  - H2: Gerelateerd

## concepts/delegate-architecture.md

- Route: /concepts/delegate-architecture
- Koppen:
  - H2: Wat is een gedelegeerde?
  - H2: Waarom gedelegeerden?
  - H2: Capaciteitsniveaus
  - H3: Niveau 1: Alleen-lezen + concept
  - H3: Niveau 2: Verzenden namens
  - H3: Niveau 3: Proactief
  - H2: Vereisten: isolatie en hardening
  - H3: Harde blokkades (niet onderhandelbaar)
  - H3: Toolbeperkingen
  - H3: Sandbox-isolatie
  - H3: Auditspoor
  - H2: Een gedelegeerde instellen
  - H3: 1. De gedelegeerde agent maken
  - H3: 2. Delegatie van identiteitsprovider configureren
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. De gedelegeerde aan kanalen koppelen
  - H3: 4. Referenties aan de gedelegeerde agent toevoegen
  - H2: Voorbeeld: organisatieassistent
  - H2: Schaalpatroon
  - H2: Gerelateerd

## concepts/dreaming.md

- Route: /concepts/dreaming
- Koppen:
  - H2: Wat Dreaming schrijft
  - H2: Fasemodel
  - H2: Inname van sessietranscript
  - H2: Droomdagboek
  - H2: Diepe rangschikkingssignalen
  - H2: Dekking van QA-schaduwproefrapport
  - H2: Planning
  - H2: Snel starten
  - H2: Slash-opdracht
  - H2: CLI-workflow
  - H2: Belangrijkste standaardwaarden
  - H2: Dreams-UI
  - H2: Dreaming draait nooit: status toont geblokkeerd
  - H2: Gerelateerd

## concepts/experimental-features.md

- Route: /concepts/experimental-features
- Koppen:
  - H2: Momenteel gedocumenteerde vlaggen
  - H2: Lean-modus voor lokaal model
  - H3: Waarom deze drie tools
  - H3: Wanneer je dit inschakelt
  - H3: Wanneer je dit uit laat
  - H3: Inschakelen
  - H2: Experimenteel betekent niet verborgen
  - H2: Gerelateerd

## concepts/features.md

- Route: /concepts/features
- Koppen:
  - H2: Hoogtepunten
  - H2: Volledige lijst
  - H2: Gerelateerd

## concepts/mantis-slack-desktop-runbook.md

- Route: /concepts/mantis-slack-desktop-runbook
- Koppen:
  - H2: Opslagmodel
  - H2: GitHub-dispatch
  - H2: Lokale CLI
  - H2: Hydrate-modi
  - H2: Interpretatie van timing
  - H2: Bewijschecklist
  - H2: Foutafhandeling
  - H2: Gerelateerd

## concepts/mantis.md

- Route: /concepts/mantis
- Koppen:
  - H2: Doelen
  - H2: Niet-doelen
  - H2: Eigenaarschap
  - H2: Opdrachtvorm
  - H2: Levenscyclus van uitvoering
  - H2: Discord-MVP
  - H2: Bestaande QA-onderdelen
  - H2: Bewijsmodel
  - H2: Browser en VNC
  - H2: Machines
  - H2: Geheimen
  - H2: GitHub-artefacten en PR-opmerkingen
  - H2: Privé-implementatieopmerkingen
  - H2: Een scenario toevoegen
  - H2: Provideruitbreiding
  - H2: Open vragen

## concepts/markdown-formatting.md

- Route: /concepts/markdown-formatting
- Koppen:
  - H2: Doelen
  - H2: Pipeline
  - H2: IR-voorbeeld
  - H2: Waar het wordt gebruikt
  - H2: Tabelafhandeling
  - H2: Chunking-regels
  - H2: Linkbeleid
  - H2: Spoilers
  - H2: Een kanaalformatter toevoegen of bijwerken
  - H2: Veelvoorkomende valkuilen
  - H2: Gerelateerd

## concepts/memory-builtin.md

- Route: /concepts/memory-builtin
- Koppen:
  - H2: Wat het biedt
  - H2: Aan de slag
  - H2: Ondersteunde embeddingproviders
  - H2: Hoe indexering werkt
  - H2: Wanneer te gebruiken
  - H2: Probleemoplossing
  - H2: Configuratie
  - H2: Gerelateerd

## concepts/memory-honcho.md

- Route: /concepts/memory-honcho
- Koppen:
  - H2: Wat het biedt
  - H2: Beschikbare tools
  - H2: Aan de slag
  - H2: Configuratie
  - H2: Bestaand geheugen migreren
  - H2: Hoe het werkt
  - H2: Honcho versus ingebouwd geheugen
  - H2: CLI-opdrachten
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/memory-qmd.md

- Route: /concepts/memory-qmd
- Koppen:
  - H2: Wat het toevoegt bovenop ingebouwd
  - H2: Aan de slag
  - H3: Vereisten
  - H3: Inschakelen
  - H2: Hoe de sidecar werkt
  - H2: Zoekprestaties en compatibiliteit
  - H2: Modeloverschrijvingen
  - H2: Extra paden indexeren
  - H2: Sessietranscripten indexeren
  - H2: Zoekbereik
  - H2: Citaten
  - H2: Wanneer te gebruiken
  - H2: Probleemoplossing
  - H2: Configuratie
  - H2: Gerelateerd

## concepts/memory-search.md

- Route: /concepts/memory-search
- Koppen:
  - H2: Snel starten
  - H2: Ondersteunde providers
  - H2: Hoe zoeken werkt
  - H2: Zoekkwaliteit verbeteren
  - H3: Temporeel verval
  - H3: MMR (diversiteit)
  - H3: Beide inschakelen
  - H2: Multimodaal geheugen
  - H2: Zoeken in sessiegeheugen
  - H2: Probleemoplossing
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/memory.md

- Route: /concepts/memory
- Koppen:
  - H2: Hoe het werkt
  - H2: Wat waarheen gaat
  - H2: Actiegevoelige herinneringen
  - H2: Afgeleide toezeggingen
  - H2: Geheugentools
  - H2: Memory Wiki-begeleidende Plugin
  - H2: Geheugenzoekfunctie
  - H2: Geheugenbackends
  - H2: Kenniswikilaag
  - H2: Automatische geheugenflush
  - H2: Dreaming
  - H2: Gegronde backfill en live promotie
  - H2: CLI
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/message-lifecycle-refactor.md

- Route: /concepts/message-lifecycle-refactor
- Koppen:
  - H2: Problemen
  - H2: Doelen
  - H2: Niet-doelen
  - H2: Referentiemodel
  - H2: Kernmodel
  - H2: Berichttermen
  - H3: Bericht
  - H3: Doel
  - H3: Relatie
  - H3: Oorsprong
  - H3: Ontvangstbewijs
  - H2: Ontvangstcontext
  - H2: Verzendcontext
  - H2: Live context
  - H2: Adapteroppervlak
  - H2: Reductie van openbare SDK
  - H2: Relatie tot inkomende kanaalstroom
  - H2: Compatibiliteitsvangrails
  - H2: Interne opslag
  - H2: Foutklassen
  - H2: Kanaaltoewijzing
  - H2: Migratieplan
  - H3: Fase 1: Intern berichtdomein
  - H3: Fase 2: Duurzame verzendkern
  - H3: Fase 3: Inkomende-kanaalbrug
  - H3: Fase 4: Voorbereide dispatcherbrug
  - H3: Fase 5: Geünificeerde live levenscyclus
  - H3: Fase 6: Openbare SDK
  - H3: Fase 7: Alle afzenders
  - H3: Fase 8: Turn-genoemde compatibiliteit verwijderen
  - H2: Testplan
  - H2: Open vragen
  - H2: Acceptatiecriteria
  - H2: Gerelateerd

## concepts/messages.md

- Route: /concepts/messages
- Koppen:
  - H2: Berichtstroom (hoog niveau)
  - H2: Deduplicatie van inkomend verkeer
  - H2: Debouncing van inkomend verkeer
  - H2: Sessies en apparaten
  - H2: Metadata van toolresultaten
  - H2: Inkomende bodies en geschiedeniscontext
  - H2: Wachtrijen en follow-ups
  - H2: Eigenaarschap van kanaaluitvoering
  - H2: Streamen, chunken en batchen
  - H2: Zichtbaarheid van redenering en tokens
  - H2: Voorvoegsels, threading en antwoorden
  - H2: Stille antwoorden
  - H2: Gerelateerd

## concepts/model-failover.md

- Route: /concepts/model-failover
- Koppen:
  - H2: Runtimestroom
  - H2: Beleid voor selectiebron
  - H2: Skip-cache voor authenticatiefouten
  - H2: Gebruikerszichtbare fallbackmeldingen
  - H2: Auth-opslag (sleutels + OAuth)
  - H2: Profiel-ID's
  - H2: Rotatievolgorde
  - H3: Sessiekleefkracht (cachevriendelijk)
  - H3: OpenAI Codex-abonnement plus API-sleutelback-up
  - H2: Cooldowns
  - H2: Facturering schakelt uit
  - H2: Modelfallback
  - H3: Regels voor kandidaatketen
  - H3: Welke fouten fallback voortzetten
  - H3: Gedrag van cooldown-skip versus probe
  - H2: Sessieoverschrijvingen en live model wisselen
  - H2: Observeerbaarheid en foutensamenvattingen
  - H2: Gerelateerde configuratie

## concepts/model-providers.md

- Route: /concepts/model-providers
- Koppen:
  - H2: Snelle regels
  - H2: Provider-gedrag in eigendom van Plugin
  - H2: API-sleutelrotatie
  - H2: Officiële provider-Plugins
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Andere gehoste opties in abonnementsstijl
  - H3: OpenCode
  - H3: Google Gemini (API-sleutel)
  - H3: Google Vertex en Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Andere gebundelde provider-Plugins
  - H4: Eigenaardigheden die nuttig zijn om te kennen
  - H2: Providers via models.providers (aangepaste/base-URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (Internationaal)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Lokale proxies (LM Studio, vLLM, LiteLLM, enz.)
  - H2: CLI-voorbeelden
  - H2: Gerelateerd

## concepts/models.md

- Route: /concepts/models
- Koppen:
  - H2: Hoe modelselectie werkt
  - H2: Selectiebron en fallbackgedrag
  - H2: Snel modelbeleid
  - H2: Onboarding (aanbevolen)
  - H2: Configuratiesleutels (overzicht)
  - H3: Veilige allowlist-bewerkingen
  - H2: "Model is niet toegestaan" (en waarom antwoorden stoppen)
  - H2: Modellen wisselen in chat (/model)
  - H2: CLI-opdrachten
  - H3: models list
  - H3: models status
  - H2: Scannen (gratis OpenRouter-modellen)
  - H2: Modellenregister (models.json)
  - H2: Gerelateerd

## concepts/multi-agent.md

- Route: /concepts/multi-agent
- Koppen:
  - H2: Wat is "één agent"?
  - H2: Paden (snelle kaart)
  - H3: Modus met één agent (standaard)
  - H2: Agenthelper
  - H2: Snel starten
  - H2: Meerdere agenten = meerdere mensen, meerdere persoonlijkheden
  - H2: QMD-geheugenzoekfunctie tussen agenten
  - H2: Eén WhatsApp-nummer, meerdere mensen (DM-splitsing)
  - H2: Routeringsregels (hoe berichten een agent kiezen)
  - H2: Meerdere accounts / telefoonnummers
  - H2: Concepten
  - H2: Platformvoorbeelden
  - H2: Veelvoorkomende patronen
  - H2: Sandbox en toolconfiguratie per agent
  - H2: Gerelateerd

## concepts/oauth.md

- Route: /concepts/oauth
- Koppen:
  - H2: De token-sink (waarom die bestaat)
  - H2: Opslag (waar tokens staan)
  - H2: Compatibiliteit met verouderde Anthropic-tokens
  - H2: Migratie van Anthropic Claude CLI
  - H2: OAuth-uitwisseling (hoe inloggen werkt)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Vernieuwen + verloop
  - H2: Meerdere accounts (profielen) + routering
  - H3: 1) Aanbevolen: afzonderlijke agents
  - H3: 2) Geavanceerd: meerdere profielen in één agent
  - H2: Gerelateerd

## concepts/parallel-specialist-lanes.md

- Route: /concepts/parallel-specialist-lanes
- Koppen:
  - H2: Eerste principes
  - H2: Aanbevolen uitrol
  - H3: Fase 1: lane-contracten + zwaar werk op de achtergrond
  - H3: Fase 2: prioriteits- en gelijktijdigheidsregelaars
  - H3: Fase 3: coördinator / verkeersregelaar
  - H2: Minimale sjabloon voor lane-contract
  - H2: Gerelateerd

## concepts/personal-agent-benchmark-pack.md

- Route: /concepts/personal-agent-benchmark-pack
- Koppen:
  - H2: Scenario's
  - H2: Privacymodel
  - H2: Het pakket uitbreiden

## concepts/presence.md

- Route: /concepts/presence
- Koppen:
  - H2: Presence-velden (wat wordt weergegeven)
  - H2: Producenten (waar presence vandaan komt)
  - H3: 1) Gateway-zelfvermelding
  - H3: 2) WebSocket-verbinding
  - H4: Waarom eenmalige CLI-opdrachten niet worden weergegeven
  - H3: 3) system-event-beacons
  - H3: 4) Node maakt verbinding (rol: node)
  - H2: Regels voor samenvoegen + deduplicatie (waarom instanceId belangrijk is)
  - H2: TTL en begrensde grootte
  - H2: Waarschuwing voor remote/tunnel (loopback-IP's)
  - H2: Consumenten
  - H3: Tabblad macOS-instanties
  - H2: Debuggingtips
  - H2: Gerelateerd

## concepts/progress-drafts.md

- Route: /concepts/progress-drafts
- Koppen:
  - H2: Snelstart
  - H2: Wat gebruikers zien
  - H2: Kies een modus
  - H2: Labels configureren
  - H2: Voortgangsregels beheren
  - H2: Kanaalgedrag
  - H2: Afronding
  - H2: Probleemoplossing
  - H2: Gerelateerd

## concepts/qa-e2e-automation.md

- Route: /concepts/qa-e2e-automation
- Koppen:
  - H2: Opdrachtoppervlak
  - H2: Operatorflow
  - H2: Dekking voor live transport
  - H2: QA-referentie voor Telegram, Discord, Slack en WhatsApp
  - H3: Gedeelde CLI-vlaggen
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: De Slack-werkruimte instellen
  - H3: WhatsApp QA
  - H3: Convex-referentiepool
  - H2: Repo-ondersteunde seeds
  - H2: Provider-mocklanes
  - H2: Transportadapters
  - H3: Een kanaal toevoegen
  - H3: Namen van scenariohelpers
  - H2: Rapportage
  - H2: Gerelateerde docs

## concepts/qa-matrix.md

- Route: /concepts/qa-matrix
- Koppen:
  - H2: Snelstart
  - H2: Wat de lane doet
  - H2: CLI
  - H3: Algemene vlaggen
  - H3: Providervlaggen
  - H2: Profielen
  - H2: Scenario's
  - H2: Omgevingsvariabelen
  - H2: Uitvoerartefacten
  - H2: Triagetips
  - H2: Contract voor live transport
  - H2: Gerelateerd

## concepts/queue-steering.md

- Route: /concepts/queue-steering
- Koppen:
  - H2: Runtimegrens
  - H2: Modi
  - H2: Burstvoorbeeld
  - H2: Bereik
  - H2: Debounce
  - H2: Gerelateerd

## concepts/queue.md

- Route: /concepts/queue
- Koppen:
  - H2: Waarom
  - H2: Hoe het werkt
  - H2: Standaarden
  - H2: Wachtrijmodi
  - H2: Wachtrijopties
  - H2: Sturen en streamen
  - H2: Voorrang
  - H2: Overschrijvingen per sessie
  - H2: Bereik en garanties
  - H2: Probleemoplossing
  - H2: Gerelateerd

## concepts/retry.md

- Route: /concepts/retry
- Koppen:
  - H2: Doelen
  - H2: Standaarden
  - H2: Gedrag
  - H3: Modelproviders
  - H3: Discord
  - H3: Telegram
  - H2: Configuratie
  - H2: Opmerkingen
  - H2: Gerelateerd

## concepts/session-pruning.md

- Route: /concepts/session-pruning
- Koppen:
  - H2: Waarom het belangrijk is
  - H2: Hoe het werkt
  - H2: Opschoning van verouderde afbeeldingen
  - H2: Slimme standaarden
  - H2: In- of uitschakelen
  - H2: Pruning versus compaction
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/session-tool.md

- Route: /concepts/session-tool
- Koppen:
  - H2: Beschikbare tools
  - H2: Sessies weergeven en lezen
  - H2: Berichten tussen sessies verzenden
  - H2: Status- en orkestratiehelpers
  - H2: Sub-agents starten
  - H2: Zichtbaarheid
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/session.md

- Route: /concepts/session
- Koppen:
  - H2: Hoe berichten worden gerouteerd
  - H2: DM-isolatie
  - H3: Dock-gekoppelde kanalen
  - H2: Sessielevenscyclus
  - H2: Waar state staat
  - H2: Sessieonderhoud
  - H2: Sessies inspecteren
  - H2: Verder lezen
  - H2: Gerelateerd

## concepts/soul.md

- Route: /concepts/soul
- Koppen:
  - H2: Wat in SOUL.md hoort
  - H2: Waarom dit werkt
  - H2: De Molty-prompt
  - H2: Hoe goed eruitziet
  - H2: Eén waarschuwing
  - H2: Gerelateerd

## concepts/streaming.md

- Route: /concepts/streaming
- Koppen:
  - H2: Blokstreaming (kanaalberichten)
  - H3: Medialevering met blokstreaming
  - H2: Chunking-algoritme (lage/hoge grenzen)
  - H2: Coalescing (gestreamde blokken samenvoegen)
  - H2: Menselijk tempo tussen blokken
  - H2: "Chunks streamen of alles"
  - H2: Voorbeeldstreamingmodi
  - H3: Kanaaltoewijzing
  - H3: Runtimegedrag
  - H3: Voorbeeldupdates voor toolvoortgang
  - H3: Commentary-voortgangslane
  - H2: Gerelateerd

## concepts/system-prompt.md

- Route: /concepts/system-prompt
- Koppen:
  - H2: Structuur
  - H2: Promptmodi
  - H2: Prompt-snapshots
  - H2: Werkruimte-bootstrapinjectie
  - H2: Tijdafhandeling
  - H2: Skills
  - H2: Documentatie
  - H2: Gerelateerd

## concepts/timezone.md

- Route: /concepts/timezone
- Koppen:
  - H2: Drie tijdzoneoppervlakken
  - H2: De tijdzone van de gebruiker instellen
  - H2: Wanneer overschrijven
  - H2: Gerelateerd

## concepts/typebox.md

- Route: /concepts/typebox
- Koppen:
  - H2: Mentaal model (30 seconden)
  - H2: Waar de schema's staan
  - H2: Huidige pipeline
  - H2: Hoe de schema's tijdens runtime worden gebruikt
  - H2: Voorbeeldframes
  - H2: Minimale client (Node.js)
  - H2: Uitgewerkt voorbeeld: een methode end-to-end toevoegen
  - H2: Swift-codegengedrag
  - H2: Versionering + compatibiliteit
  - H2: Schemapatronen en conventies
  - H2: Live schema-JSON
  - H2: Wanneer je schema's wijzigt
  - H2: Gerelateerd

## concepts/typing-indicators.md

- Route: /concepts/typing-indicators
- Koppen:
  - H2: Standaarden
  - H2: Modi
  - H2: Configuratie
  - H2: Opmerkingen
  - H2: Gerelateerd

## concepts/usage-tracking.md

- Route: /concepts/usage-tracking
- Koppen:
  - H2: Wat het is
  - H2: Waar het verschijnt
  - H2: Standaardmodus voor gebruiksfooter
  - H3: Drie afzonderlijke sessiestaten
  - H3: Voorrang
  - H3: Resetten versus uitschakelen
  - H3: Schakelgedrag
  - H3: Config
  - H2: Aangepaste volledige /usage-footer
  - H3: Vorm
  - H3: Contractpaden
  - H3: Werkwoorden
  - H3: Stukvormen
  - H3: Voorbeeld
  - H2: Providers + referenties
  - H2: Gerelateerd

## date-time.md

- Route: /date-time
- Koppen:
  - H2: Bericht-enveloppen (standaard lokaal)
  - H3: Voorbeelden
  - H2: Systeemprompt: huidige datum en tijd
  - H2: Systeemeventregels (standaard lokaal)
  - H3: Gebruikerstijdzone + formaat configureren
  - H2: Tijdformaatdetectie (auto)
  - H2: Toolpayloads + connectors (ruwe providertijd + genormaliseerde velden)
  - H2: Gerelateerde docs

## debug/node-issue.md

- Route: /debug/node-issue
- Koppen:
  - H1: Node + tsx "\\name is not a function"-crash
  - H2: Samenvatting
  - H2: Omgeving
  - H2: Repro (alleen Node)
  - H2: Minimale repro in repo
  - H2: Node-versiecontrole
  - H2: Opmerkingen / hypothese
  - H2: Regressiegeschiedenis
  - H2: Workarounds
  - H2: Referenties
  - H2: Volgende stappen
  - H2: Gerelateerd

## diagnostics/flags.md

- Route: /diagnostics/flags
- Koppen:
  - H2: Hoe het werkt
  - H2: Inschakelen via config
  - H2: Env-overschrijving (eenmalig)
  - H2: Profilingvlaggen
  - H2: Tijdlijnartefacten
  - H2: Waar logs naartoe gaan
  - H2: Logs extraheren
  - H2: Opmerkingen
  - H2: Gerelateerd

## gateway/authentication.md

- Route: /gateway/authentication
- Koppen:
  - H2: Aanbevolen instelling (API-sleutel, elke provider)
  - H2: Anthropic: compatibiliteit met Claude CLI en tokens
  - H2: Anthropic-opmerking
  - H2: Modelauthenticatiestatus controleren
  - H2: Rotatiegedrag van API-sleutels (gateway)
  - H2: Providerauthenticatie verwijderen terwijl de gateway draait
  - H2: Bepalen welke referentie wordt gebruikt
  - H3: OpenAI en verouderde openai-codex-id's
  - H3: Tijdens inloggen (CLI)
  - H3: Per sessie (chatopdracht)
  - H3: Per agent (CLI-overschrijving)
  - H2: Probleemoplossing
  - H3: "Geen referenties gevonden"
  - H3: Token verloopt/is verlopen
  - H2: Gerelateerd

## gateway/background-process.md

- Route: /gateway/background-process
- Koppen:
  - H2: exec-tool
  - H2: Bridging van childprocessen
  - H2: process-tool
  - H2: Voorbeelden
  - H2: Gerelateerd

## gateway/bonjour.md

- Route: /gateway/bonjour
- Koppen:
  - H2: Wide-area Bonjour (Unicast DNS-SD) via Tailscale
  - H3: Gateway-config (aanbevolen)
  - H3: Eenmalige DNS-serverinstelling (Gateway-host)
  - H3: Tailscale DNS-instellingen
  - H3: Beveiliging van Gateway-listener (aanbevolen)
  - H2: Wat adverteert
  - H2: Servicetypen
  - H2: TXT-sleutels (niet-geheime hints)
  - H2: Debuggen op macOS
  - H2: Debuggen in Gateway-logs
  - H2: Debuggen op iOS-node
  - H2: Wanneer Bonjour inschakelen
  - H2: Wanneer Bonjour uitschakelen
  - H2: Docker-valkuilen
  - H2: Probleemoplossing voor uitgeschakelde Bonjour
  - H2: Veelvoorkomende faalmodi
  - H2: Geëscapete instantienamen (\032)
  - H2: Inschakelen / uitschakelen / configuratie
  - H2: Gerelateerde docs

## gateway/bridge-protocol.md

- Route: /gateway/bridge-protocol
- Koppen:
  - H2: Waarom het bestond
  - H2: Transport
  - H2: Handshake + koppelen
  - H2: Frames
  - H2: Exec-levenscyclusgebeurtenissen
  - H2: Historisch tailnetgebruik
  - H2: Versionering
  - H2: Gerelateerd

## gateway/cli-backends.md

- Route: /gateway/cli-backends
- Koppen:
  - H2: Beginnersvriendelijke snelstart
  - H2: Gebruiken als fallback
  - H2: Configuratieoverzicht
  - H3: Voorbeeldconfiguratie
  - H2: Hoe het werkt
  - H2: Sessies
  - H2: Fallback-prelude uit claude-cli-sessies
  - H2: Afbeeldingen (pass-through)
  - H2: Invoer / uitvoer
  - H2: Standaarden (door Plugin beheerd)
  - H2: Door Plugin beheerde standaarden
  - H2: Eigenaarschap van native compaction
  - H2: Bundle MCP-overlays
  - H2: Limiet voor reseed-geschiedenis
  - H2: Beperkingen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## gateway/config-agents.md

- Route: /gateway/config-agents
- Koppen:
  - H2: Agentstandaarden
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Bootstrapprofieloverschrijvingen per agent
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Eigenaarschapskaart voor contextbudget
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Runtimebeleid
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Blokstreaming
  - H3: Typing-indicators
  - H3: agents.defaults.sandbox
  - H3: agents.list (overschrijvingen per agent)
  - H2: Multi-agent-routering
  - H3: Matchvelden voor bindingen
  - H3: Toegangsprofielen per agent
  - H2: Sessie
  - H2: Berichten
  - H3: Antwoordprefix
  - H3: Ack-reactie
  - H3: Inbound debounce
  - H3: TTS (tekst-naar-spraak)
  - H2: Talk
  - H2: Gerelateerd

## gateway/config-channels.md

- Route: /gateway/config-channels
- Koppen:
  - H2: Kanalen
  - H3: DM- en groepstoegang
  - H3: Kanaalmodel-overschrijvingen
  - H3: Kanaalstandaardwaarden en Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Meerdere accounts (alle kanalen)
  - H3: Andere Plugin-kanalen
  - H3: Vermeldingspoort voor groepschats
  - H4: Limieten voor DM-geschiedenis
  - H4: Zelfchatmodus
  - H3: Opdrachten (afhandeling van chatopdrachten)
  - H2: Gerelateerd

## gateway/config-tools.md

- Route: /gateway/config-tools
- Koppen:
  - H2: Tools
  - H3: Toolprofielen
  - H3: Toolgroepen
  - H3: MCP- en Plugin-tools binnen sandbox-toolbeleid
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Aangepaste providers en basis-URL's
  - H3: Details van providervelden
  - H3: Providervoorbeelden
  - H2: Gerelateerd

## gateway/configuration-examples.md

- Route: /gateway/configuration-examples
- Koppen:
  - H2: Snel starten
  - H3: Absoluut minimum
  - H3: Aanbevolen starter
  - H2: Uitgebreid voorbeeld (belangrijke opties)
  - H3: Symlinked sibling-Skills-repo
  - H2: Algemene patronen
  - H3: Gedeelde Skills-basislijn met één overschrijving
  - H3: Multi-platformconfiguratie
  - H3: Automatische goedkeuring voor vertrouwd Node-netwerk
  - H3: Veilige DM-modus (gedeelde inbox / DM's met meerdere gebruikers)
  - H3: Anthropic-API-sleutel + MiniMax-fallback
  - H3: Werkbot (beperkte toegang)
  - H3: Alleen lokale modellen
  - H2: Tips
  - H2: Gerelateerd

## gateway/configuration-reference.md

- Route: /gateway/configuration-reference
- Koppen:
  - H2: Kanalen
  - H2: Agentstandaardwaarden, meerdere agents, sessies en berichten
  - H2: Tools en aangepaste providers
  - H2: Modellen
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Configuratie van Codex-harnas-Plugin
  - H2: Toezeggingen
  - H2: Browser
  - H2: UI
  - H2: Gateway
  - H3: OpenAI-compatibele eindpunten
  - H3: Isolatie van meerdere instanties
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Gmail-integratie
  - H2: Canvas-Plugin-host
  - H2: Discovery
  - H3: mDNS (Bonjour)
  - H3: Wide-area (DNS-SD)
  - H2: Omgeving
  - H3: env (inline omgevingsvariabelen)
  - H3: Vervanging van omgevingsvariabelen
  - H2: Geheimen
  - H3: SecretRef
  - H3: Ondersteund referentieoppervlak
  - H3: Configuratie van geheime providers
  - H2: Auth-opslag
  - H3: auth.cooldowns
  - H2: Logging
  - H2: Diagnostiek
  - H2: Update
  - H2: ACP
  - H2: CLI
  - H2: Wizard
  - H2: Identiteit
  - H2: Bridge (legacy, verwijderd)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Templatevariabelen voor mediamodellen
  - H2: Config-includes ($include)
  - H2: Gerelateerd

## gateway/configuration.md

- Route: /gateway/configuration
- Koppen:
  - H2: Minimale configuratie
  - H2: Configuratie bewerken
  - H2: Strikte validatie
  - H2: Algemene taken
  - H2: Config-hot reload
  - H3: Reload-modi
  - H3: Wat hot wordt toegepast en wat een herstart vereist
  - H3: Reload-planning
  - H2: Config-RPC (programmatische updates)
  - H2: Omgevingsvariabelen
  - H2: Volledige referentie
  - H2: Gerelateerd

## gateway/diagnostics.md

- Route: /gateway/diagnostics
- Koppen:
  - H2: Snel starten
  - H2: Chatopdracht
  - H2: Wat de export bevat
  - H2: Privacymodel
  - H2: Stabiliteitsrecorder
  - H2: Nuttige opties
  - H2: Diagnostiek uitschakelen
  - H2: Gerelateerd

## gateway/discovery.md

- Route: /gateway/discovery
- Koppen:
  - H2: Termen
  - H2: Waarom we zowel direct als SSH behouden
  - H2: Discovery-invoer (hoe clients leren waar de gateway is)
  - H3: 1) Bonjour- / DNS-SD-discovery
  - H4: Details van servicebeacon
  - H3: 2) Tailnet (cross-network)
  - H3: 3) Handmatig / SSH-doel
  - H2: Transportselectie (clientbeleid)
  - H2: Koppeling + auth (direct transport)
  - H2: Verantwoordelijkheden per component
  - H2: Gerelateerd

## gateway/doctor.md

- Route: /gateway/doctor
- Koppen:
  - H2: Snel starten
  - H3: Modi zonder gebruikersinterface en voor automatisering
  - H2: Alleen-lezen lintmodus
  - H2: Wat het doet (samenvatting)
  - H2: Aanvulling en reset van Dreams-UI
  - H2: Gedetailleerd gedrag en rationale
  - H2: Gerelateerd

## gateway/external-apps.md

- Route: /gateway/external-apps
- Koppen:
  - H2: Wat vandaag beschikbaar is
  - H2: Aanbevolen pad
  - H2: App-code versus Plugin-code
  - H2: Gerelateerd

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Koppen:
  - H2: Waarom
  - H2: Mechanisme
  - H2: Foutoppervlak
  - H2: Operationele opmerkingen
  - H2: Gerelateerd

## gateway/health.md

- Route: /gateway/health
- Koppen:
  - H2: Snelle controles
  - H2: Diepe diagnostiek
  - H2: Configuratie van healthmonitor
  - H2: Uptimebewaking
  - H3: Voorbeelden voor het instellen van bewakingsservices
  - H2: Wanneer iets mislukt
  - H2: Toegewijde opdracht "health"
  - H2: Gerelateerd

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Koppen:
  - H2: Snel starten (beginner)
  - H2: Standaardwaarden
  - H2: Waar de Heartbeat-prompt voor is
  - H2: Responscontract
  - H2: Configuratie
  - H3: Bereik en prioriteit
  - H3: Heartbeats per agent
  - H3: Voorbeeld van actieve uren
  - H3: 24/7-configuratie
  - H3: Voorbeeld met meerdere accounts
  - H3: Veldnotities
  - H2: Aflevergedrag
  - H2: Zichtbaarheidscontroles
  - H3: Wat elke vlag doet
  - H3: Voorbeelden per kanaal versus per account
  - H3: Algemene patronen
  - H2: HEARTBEAT.md (optioneel)
  - H3: tasks:-blokken
  - H3: Kan de agent HEARTBEAT.md bijwerken?
  - H2: Handmatig wekken (op aanvraag)
  - H2: Levering van redenering (optioneel)
  - H2: Kostenbewustzijn
  - H2: Contextoverloop na Heartbeat
  - H2: Gerelateerd

## gateway/index.md

- Route: /gateway
- Koppen:
  - H2: Lokale start in 5 minuten
  - H2: Runtimemodel
  - H2: OpenAI-compatibele eindpunten
  - H3: Poort- en bindprioriteit
  - H3: Hot reload-modi
  - H2: Opdrachtenset voor operators
  - H2: Meerdere gateways (dezelfde host)
  - H2: Externe toegang
  - H2: Supervisie en servicelevenscyclus
  - H2: Snel pad voor dev-profiel
  - H2: Snelle protocolreferentie (operatorweergave)
  - H2: Operationele controles
  - H3: Levensvatbaarheid
  - H3: Gereedheid
  - H3: Herstel van hiaten
  - H2: Algemene foutsignaturen
  - H2: Veiligheidsgaranties
  - H2: Gerelateerd

## gateway/local-model-services.md

- Route: /gateway/local-model-services
- Koppen:
  - H2: Hoe het werkt
  - H2: Configuratievorm
  - H2: Velden
  - H2: Inferrs-voorbeeld
  - H2: ds4-voorbeeld
  - H2: Operationele opmerkingen
  - H2: Gerelateerd

## gateway/local-models.md

- Route: /gateway/local-models
- Koppen:
  - H2: Minimale hardware
  - H2: Kies een backend
  - H2: Aanbevolen: LM Studio + groot lokaal model (Responses API)
  - H3: Hybride configuratie: gehost primair, lokale fallback
  - H3: Local-first met gehost vangnet
  - H3: Regionale hosting / datarouting
  - H2: Andere OpenAI-compatibele lokale proxy's
  - H2: Kleinere of striktere backends
  - H2: Probleemoplossing
  - H2: Gerelateerd

## gateway/logging.md

- Route: /gateway/logging
- Koppen:
  - H1: Logging
  - H2: Bestandsgebaseerde logger
  - H2: Consolevastlegging
  - H2: Redactie
  - H2: Gateway-WebSocket-logs
  - H3: WS-logstijl
  - H2: Consoleopmaak (subsystemlogging)
  - H2: Gerelateerd

## gateway/multiple-gateways.md

- Route: /gateway/multiple-gateways
- Koppen:
  - H2: Beste aanbevolen configuratie
  - H2: Rescue-Bot-snelstart
  - H2: Waarom dit werkt
  - H2: Wat --profile rescue onboard wijzigt
  - H2: Algemene multi-gatewayconfiguratie
  - H2: Isolatiechecklist
  - H2: Poorttoewijzing (afgeleid)
  - H2: Browser-/CDP-opmerkingen (veelvoorkomende valkuil)
  - H2: Handmatig env-voorbeeld
  - H2: Snelle controles
  - H2: Gerelateerd

## gateway/network-model.md

- Route: /gateway/network-model
- Koppen:
  - H2: Gerelateerd

## gateway/openai-http-api.md

- Route: /gateway/openai-http-api
- Koppen:
  - H2: Authenticatie
  - H2: Beveiligingsgrens (belangrijk)
  - H2: Wanneer dit eindpunt gebruiken
  - H2: Agent-first modelcontract
  - H2: Het eindpunt inschakelen
  - H2: Het eindpunt uitschakelen
  - H2: Sessiegegedrag
  - H2: Waarom dit oppervlak ertoe doet
  - H2: Modellijst en agentrouting
  - H2: Streaming (SSE)
  - H2: Chattoolcontract
  - H3: Ondersteunde aanvraagvelden
  - H3: Niet-ondersteunde varianten
  - H3: Vorm van niet-streaming toolrespons
  - H3: Vorm van streaming toolrespons
  - H3: Tool-follow-uplus
  - H2: Snelle Open WebUI-configuratie
  - H2: Voorbeelden
  - H2: Gerelateerd

## gateway/openresponses-http-api.md

- Route: /gateway/openresponses-http-api
- Koppen:
  - H2: Authenticatie, beveiliging en routing
  - H2: Sessiegegedrag
  - H2: Aanvraagvorm (ondersteund)
  - H2: Items (invoer)
  - H3: message
  - H3: functioncalloutput (turn-based tools)
  - H3: reasoning en itemreference
  - H2: Tools (client-side functietools)
  - H2: Afbeeldingen (inputimage)
  - H2: Bestanden (inputfile)
  - H2: Bestands- en afbeeldingslimieten (configuratie)
  - H2: Streaming (SSE)
  - H2: Gebruik
  - H2: Fouten
  - H2: Voorbeelden
  - H2: Gerelateerd

## gateway/openshell.md

- Route: /gateway/openshell
- Koppen:
  - H2: Vereisten
  - H2: Snel starten
  - H2: Werkruimtemodi
  - H3: mirror
  - H3: remote
  - H3: Een modus kiezen
  - H2: Configuratiereferentie
  - H2: Voorbeelden
  - H3: Minimale remote-configuratie
  - H3: Mirror-modus met GPU
  - H3: OpenShell per agent met aangepaste gateway
  - H2: Levenscyclusbeheer
  - H3: Wanneer opnieuw maken
  - H2: Beveiligingsverharding
  - H2: Huidige beperkingen
  - H2: Hoe het werkt
  - H2: Gerelateerd

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Koppen:
  - H2: Hoe het samenhangt
  - H2: Snel starten
  - H2: Geëxporteerde signalen
  - H2: Configuratiereferentie
  - H3: Omgevingsvariabelen
  - H2: Privacy en inhoudsvastlegging
  - H2: Sampling en flushen
  - H2: Geëxporteerde metrics
  - H3: Modelgebruik
  - H3: Berichtstroom
  - H3: Gesprek
  - H3: Wachtrijen en sessies
  - H3: Telemetrie voor sessielevendigheid
  - H3: Harnaslevenscyclus
  - H3: Tooluitvoering
  - H3: Exec
  - H3: Interne diagnostiek (geheugen en toollus)
  - H2: Geëxporteerde spans
  - H2: Catalogus met diagnostische gebeurtenissen
  - H2: Zonder exporter
  - H2: Uitschakelen
  - H2: Gerelateerd

## gateway/operator-scopes.md

- Route: /gateway/operator-scopes
- Koppen:
  - H2: Rollen
  - H2: Bereikniveaus
  - H2: Methodebereik is alleen de eerste poort
  - H2: Goedkeuringen voor apparaatkoppeling
  - H2: Goedkeuringen voor Node-koppeling
  - H2: Auth met gedeeld geheim

## gateway/pairing.md

- Route: /gateway/pairing
- Koppen:
  - H2: Concepten
  - H2: Hoe koppeling werkt
  - H2: CLI-workflow (vriendelijk voor gebruik zonder gebruikersinterface)
  - H2: API-oppervlak (gatewayprotocol)
  - H2: Node-opdrachtpoort (2026.3.31+)
  - H2: Vertrouwensgrenzen voor Node-gebeurtenissen (2026.3.31+)
  - H2: Automatische goedkeuring (macOS-app)
  - H2: Automatische apparaatgoedkeuring via vertrouwde CIDR
  - H2: Automatische goedkeuring bij metadata-upgrade
  - H2: QR-koppelingshelpers
  - H2: Lokaliteit en doorgestuurde headers
  - H2: Opslag (lokaal, privé)
  - H2: Transportgedrag
  - H2: Gerelateerd

## gateway/prometheus.md

- Route: /gateway/prometheus
- Koppen:
  - H2: Snel starten
  - H2: Geëxporteerde metrics
  - H2: Labelbeleid
  - H2: PromQL-recepten
  - H2: Kiezen tussen Prometheus- en OpenTelemetry-export
  - H2: Probleemoplossing
  - H2: Gerelateerd

## gateway/protocol.md

- Route: /gateway/protocol
- Koppen:
  - H2: Transport
  - H2: Handshake (verbinden)
  - H3: Node-voorbeeld
  - H2: Framing
  - H2: Rollen + bereiken
  - H3: Rollen
  - H3: Bereiken (operator)
  - H3: Caps/opdrachten/machtigingen (Node)
  - H2: Aanwezigheid
  - H3: Achtergrond-alive-gebeurtenis voor Node
  - H2: Bereikbepaling voor broadcastgebeurtenissen
  - H2: Algemene RPC-methodefamilies
  - H3: Algemene gebeurtenisfamilies
  - H3: Node-helpermethoden
  - H3: Task ledger-RPC's
  - H3: Operatorhelpermethoden
  - H3: models.list-weergaven
  - H2: Exec-goedkeuringen
  - H2: Fallback voor agentaflevering
  - H2: Versionering
  - H3: Clientconstanten
  - H2: Auth
  - H2: Apparaatidentiteit + koppeling
  - H3: Diagnostiek voor apparaat-auth-migratie
  - H2: TLS + pinning
  - H2: Bereik
  - H2: Gerelateerd

## gateway/remote-gateway-readme.md

- Route: /gateway/remote-gateway-readme
- Koppen:
  - H1: OpenClaw.app uitvoeren met een externe Gateway
  - H2: Overzicht
  - H2: Snelle configuratie
  - H3: Stap 1: SSH-configuratie toevoegen
  - H3: Stap 2: SSH-sleutel kopiëren
  - H3: Stap 3: externe Gateway-auth configureren
  - H3: Stap 4: SSH-tunnel starten
  - H3: Stap 5: OpenClaw.app opnieuw starten
  - H2: Tunnel automatisch starten bij inloggen
  - H3: Het PLIST-bestand maken
  - H3: De Launch Agent laden
  - H2: Probleemoplossing
  - H2: Hoe het werkt
  - H2: Gerelateerd

## gateway/remote.md

- Route: /gateway/remote
- Koppen:
  - H2: De kern
  - H2: Veelgebruikte VPN- en tailnet-configuraties
  - H3: Altijd actieve Gateway in je tailnet
  - H3: Thuisdesktop voert de Gateway uit
  - H3: Laptop voert de Gateway uit
  - H2: Commandostroom (wat waar draait)
  - H2: SSH-tunnel (CLI + tools)
  - H2: Externe standaardinstellingen voor de CLI
  - H2: Prioriteit van aanmeldgegevens
  - H2: Externe toegang tot chat-UI
  - H2: Externe modus van de macOS-app
  - H2: Beveiligingsregels (extern/VPN)
  - H3: macOS: permanente SSH-tunnel via LaunchAgent
  - H4: Stap 1: SSH-configuratie toevoegen
  - H4: Stap 2: SSH-sleutel kopiëren (eenmalig)
  - H4: Stap 3: het Gateway-token configureren
  - H4: Stap 4: de LaunchAgent maken
  - H4: Stap 5: de LaunchAgent laden
  - H4: Probleemoplossing
  - H2: Gerelateerd

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route: /gateway/sandbox-vs-tool-policy-vs-elevated
- Koppen:
  - H2: Snel debuggen
  - H2: Sandbox: waar tools draaien
  - H3: Bind mounts (snelle beveiligingscontrole)
  - H2: Toolbeleid: welke tools bestaan/aanroepbaar zijn
  - H3: Toolgroepen (verkorte vormen)
  - H2: Verhoogd: alleen exec "uitvoeren op host"
  - H2: Veelvoorkomende oplossingen voor "sandboxgevangenis"
  - H3: "Tool X geblokkeerd door sandbox-toolbeleid"
  - H3: "Ik dacht dat dit main was, waarom zit het in een sandbox?"
  - H2: Gerelateerd

## gateway/sandboxing.md

- Route: /gateway/sandboxing
- Koppen:
  - H2: Wat in een sandbox wordt geplaatst
  - H2: Modi
  - H2: Bereik
  - H2: Backend
  - H3: Een backend kiezen
  - H3: Docker-backend
  - H3: SSH-backend
  - H3: OpenShell-backend
  - H4: Werkruimtemodi
  - H4: OpenShell-levenscyclus
  - H2: Werkruimtetoegang
  - H2: Aangepaste bind mounts
  - H2: Images en configuratie
  - H2: setupCommand (eenmalige containerconfiguratie)
  - H2: Toolbeleid en ontsnappingsroutes
  - H2: Multi-agent-overschrijvingen
  - H2: Minimaal activeringsvoorbeeld
  - H2: Gerelateerd

## gateway/secrets-plan-contract.md

- Route: /gateway/secrets-plan-contract
- Koppen:
  - H2: Vorm van planbestand
  - H2: Provider-upserts en verwijderingen
  - H2: Ondersteund doelbereik
  - H2: Gedrag per doeltype
  - H2: Regels voor padvalidatie
  - H2: Foutgedrag
  - H2: Toestemmingsgedrag van exec-provider
  - H2: Opmerkingen over runtime- en auditbereik
  - H2: Operatorcontroles
  - H2: Gerelateerde docs

## gateway/secrets.md

- Route: /gateway/secrets
- Koppen:
  - H2: Doelen en runtimemodel
  - H2: Toegangsgrens voor agents
  - H2: Filtering van actief oppervlak
  - H2: Diagnostiek van Gateway-auth-oppervlak
  - H2: Preflight voor onboardingverwijzingen
  - H2: SecretRef-contract
  - H2: Providerconfiguratie
  - H2: API-sleutels met bestandsbackend
  - H2: Voorbeelden van exec-integratie
  - H2: Omgevingsvariabelen voor MCP-server
  - H2: SSH-auth-materiaal voor sandbox
  - H2: Ondersteund aanmeldgegevensoppervlak
  - H2: Vereist gedrag en prioriteit
  - H2: Activatietriggers
  - H2: Signalen voor gedegradeerd en hersteld
  - H2: Resolutie van commandopaden
  - H2: Audit- en configuratieworkflow
  - H2: Eenrichtingsveiligheidsbeleid
  - H2: Compatibiliteitsopmerkingen voor legacy-auth
  - H2: Opmerking over web-UI
  - H2: Gerelateerd

## gateway/security/audit-checks.md

- Route: /gateway/security/audit-checks
- Koppen:
  - H2: Gerelateerd

## gateway/security/exposure-runbook.md

- Route: /gateway/security/exposure-runbook
- Koppen:
  - H2: Kies het blootstellingspatroon
  - H2: Preflight-inventaris
  - H2: Baselinecontroles
  - H2: Minimale veilige baseline
  - H2: Blootstelling van DM's en groepen
  - H2: Controles voor reverse proxy
  - H2: Review van tools en sandbox
  - H2: Validatie na wijziging
  - H2: Rollbackplan
  - H2: Reviewchecklist

## gateway/security/index.md

- Route: /gateway/security
- Koppen:
  - H2: Eerst het bereik: beveiligingsmodel voor persoonlijke assistent
  - H2: Snelle controle: openclaw security audit
  - H3: Dependency-lock voor gepubliceerd pakket
  - H3: Deployment- en hostvertrouwen
  - H3: Veilige bestandsbewerkingen
  - H3: Gedeelde Slack-werkruimte: reëel risico
  - H3: Bedrijfsgedeelde agent: acceptabel patroon
  - H2: Vertrouwensconcept voor Gateway en Node
  - H2: Matrix voor vertrouwensgrenzen
  - H2: Geen kwetsbaarheden by design
  - H2: Verharde baseline in 60 seconden
  - H2: Snelle regel voor gedeelde inbox
  - H2: Model voor contextzichtbaarheid
  - H2: Wat de audit controleert (hoog niveau)
  - H2: Kaart voor opslag van aanmeldgegevens
  - H2: Checklist voor beveiligingsaudit
  - H2: Glossarium voor beveiligingsaudit
  - H2: Control-UI via HTTP
  - H2: Samenvatting van onveilige of gevaarlijke flags
  - H2: Configuratie van reverse proxy
  - H2: HSTS- en origin-opmerkingen
  - H2: Lokale sessielogs staan op schijf
  - H2: Node-uitvoering (system.run)
  - H2: Dynamische Skills (watcher / externe nodes)
  - H2: Het dreigingsmodel
  - H2: Kernconcept: toegangscontrole vóór intelligentie
  - H2: Model voor commando-autorisatie
  - H2: Risico van control-plane-tools
  - H2: Plugins
  - H2: DM-toegangsmodel: koppelen, allowlist, open, uitgeschakeld
  - H2: DM-sessie-isolatie (multi-user-modus)
  - H3: Veilige DM-modus (aanbevolen)
  - H2: Allowlists voor DM's en groepen
  - H2: Prompt injection (wat het is, waarom het ertoe doet)
  - H2: Sanitization van speciale tokens in externe inhoud
  - H2: Bypass-flags voor onveilige externe inhoud
  - H3: Prompt injection vereist geen openbare DM's
  - H3: Zelfgehoste LLM-backends
  - H3: Modelsterkte (beveiligingsopmerking)
  - H2: Redenering en uitgebreide uitvoer in groepen
  - H2: Voorbeelden voor configuratieverharding
  - H3: Bestandsrechten
  - H3: Netwerkblootstelling (bind, poort, firewall)
  - H3: Docker-poortpublicatie met UFW
  - H3: mDNS/Bonjour-discovery
  - H3: De Gateway WebSocket vergrendelen (lokale auth)
  - H3: Tailscale Serve-identiteitsheaders
  - H3: Browserbesturing via node-host (aanbevolen)
  - H3: Geheimen op schijf
  - H3: .env-bestanden in werkruimte
  - H3: Logs en transcripties (redactie en retentie)
  - H3: DM's: standaard koppelen
  - H3: Groepen: overal vermelding vereisen
  - H3: Afzonderlijke nummers (WhatsApp, Signal, Telegram)
  - H3: Alleen-lezenmodus (via sandbox en tools)
  - H3: Veilige baseline (kopiëren/plakken)
  - H2: Sandboxing (aanbevolen)
  - H3: Guardrail voor sub-agent-delegatie
  - H2: Risico's van browserbesturing
  - H3: Browser-SSRF-beleid (standaard strikt)
  - H2: Toegangsprofielen per agent (multi-agent)
  - H3: Voorbeeld: volledige toegang (geen sandbox)
  - H3: Voorbeeld: alleen-lezens-tools + alleen-lezen-werkruimte
  - H3: Voorbeeld: geen filesystem-/shelltoegang (providerberichten toegestaan)
  - H2: Incidentrespons
  - H3: Beheersen
  - H3: Roteren (ga uit van compromittering als geheimen zijn gelekt)
  - H3: Auditen
  - H3: Verzamelen voor een rapport
  - H2: Secret scanning
  - H2: Beveiligingsproblemen melden

## gateway/security/secure-file-operations.md

- Route: /gateway/security/secure-file-operations
- Koppen:
  - H2: Standaard: geen Python-helper
  - H2: Wat beschermd blijft zonder Python
  - H2: Wat Python toevoegt
  - H2: Richtlijnen voor Plugin en core

## gateway/security/shrinkwrap.md

- Route: /gateway/security/shrinkwrap
- Koppen:
  - H2: De eenvoudige versie
  - H2: Waarom OpenClaw het gebruikt
  - H2: Technische details

## gateway/tailscale.md

- Route: /gateway/tailscale
- Koppen:
  - H2: Modi
  - H2: Auth
  - H2: Configuratievoorbeelden
  - H3: Alleen tailnet (Serve)
  - H3: Alleen tailnet (binden aan Tailnet-IP)
  - H3: Openbaar internet (Funnel + gedeeld wachtwoord)
  - H2: CLI-voorbeelden
  - H2: Opmerkingen
  - H2: Browserbesturing (externe Gateway + lokale browser)
  - H2: Tailscale-vereisten + limieten
  - H2: Meer informatie
  - H2: Gerelateerd

## gateway/tools-invoke-http-api.md

- Route: /gateway/tools-invoke-http-api
- Koppen:
  - H2: Authenticatie
  - H2: Beveiligingsgrens (belangrijk)
  - H2: Request body
  - H2: Beleid + routeringsgedrag
  - H2: Responses
  - H2: Voorbeeld
  - H2: Gerelateerd

## gateway/troubleshooting.md

- Route: /gateway/troubleshooting
- Koppen:
  - H2: Commandoladder
  - H2: Na een update
  - H2: Split-brain-installaties en guard voor nieuwere config
  - H2: Protocolmismatch na rollback
  - H2: Skill-symlink overgeslagen als path escape
  - H2: Anthropic 429 vereist extra gebruik voor lange context
  - H2: Upstream 403 geblokkeerde responses
  - H2: Lokale OpenAI-compatibele backend slaagt voor directe probes maar agent-runs falen
  - H2: Geen antwoorden
  - H2: Connectiviteit van dashboard-control-UI
  - H3: Snelle kaart voor auth-detailcodes
  - H2: Gateway-service draait niet
  - H2: macOS-Gateway reageert stilzwijgend niet meer en hervat zodra je het dashboard aanraakt
  - H2: Gateway sluit af tijdens hoog geheugengebruik
  - H2: Gateway heeft ongeldige config geweigerd
  - H2: Gateway-probewaarschuwingen
  - H2: Kanaal verbonden, berichten stromen niet
  - H2: Cron- en Heartbeat-bezorging
  - H2: Node gekoppeld, tool faalt
  - H2: Browsertool faalt
  - H2: Als je hebt geüpgraded en er plotseling iets stukging
  - H2: Gerelateerd

## gateway/trusted-proxy-auth.md

- Route: /gateway/trusted-proxy-auth
- Koppen:
  - H2: Wanneer gebruiken
  - H2: Wanneer NIET gebruiken
  - H2: Hoe het werkt
  - H2: Koppelingsgedrag van control-UI
  - H2: Configuratie
  - H3: Configuratiereferentie
  - H2: TLS-terminatie en HSTS
  - H3: Uitrolrichtlijnen
  - H2: Voorbeelden voor proxyconfiguratie
  - H2: Gemengde tokenconfiguratie
  - H2: Header voor operatorbereiken
  - H2: Beveiligingschecklist
  - H2: Beveiligingsaudit
  - H2: Probleemoplossing
  - H2: Migratie vanaf token-auth
  - H2: Gerelateerd

## help/debugging.md

- Route: /help/debugging
- Koppen:
  - H2: Runtime-debug-overschrijvingen
  - H2: Uitvoer van sessietrace
  - H2: Trace van Plugin-levenscyclus
  - H2: CLI-startup en commandoprofilering
  - H2: Gateway-watchmodus
  - H2: Dev-profiel + dev-Gateway (--dev)
  - H2: Raw stream-logging (OpenClaw)
  - H2: Raw chunk-logging voor OpenAI-compatibel
  - H2: Veiligheidsopmerkingen
  - H2: Debuggen in VSCode
  - H3: Configuratie
  - H3: Opmerkingen
  - H2: Gerelateerd

## help/environment.md

- Route: /help/environment
- Koppen:
  - H2: Prioriteit (hoogste → laagste)
  - H2: Provider-aanmeldgegevens en werkruimte-.env
  - H2: Config-env-blok
  - H2: Shell-env-import
  - H2: Exec-shell-snapshots
  - H2: Door runtime geïnjecteerde env-vars
  - H2: UI-env-vars
  - H2: Env-var-substitutie in config
  - H2: Secret refs versus ${ENV}-strings
  - H2: Padgerelateerde env-vars
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: nvm-gebruikers: webfetch TLS-fouten
  - H2: Legacy-omgevingsvariabelen
  - H2: Gerelateerd

## help/faq-first-run.md

- Route: /help/faq-first-run
- Koppen:
  - H2: Snel starten en eerste configuratie
  - H2: Gerelateerd

## help/faq-models.md

- Route: /help/faq-models
- Koppen:
  - H2: Modellen: standaardinstellingen, selectie, aliassen, wisselen
  - H2: Model-failover en "Alle modellen zijn mislukt"
  - H2: Auth-profielen: wat ze zijn en hoe je ze beheert
  - H2: Gerelateerd

## help/faq.md

- Route: /help/faq
- Koppen:
  - H2: Eerste 60 seconden als er iets stuk is
  - H2: Snel starten en eerste configuratie
  - H2: Wat is OpenClaw?
  - H2: Skills en automatisering
  - H2: Sandboxing en geheugen
  - H2: Waar dingen op schijf staan
  - H2: Basisprincipes van config
  - H2: Externe gateways en nodes
  - H2: Env-vars en .env laden
  - H2: Sessies en meerdere chats
  - H2: Modellen, failover en auth-profielen
  - H2: Gateway: poorten, "draait al" en externe modus
  - H2: Logging en debuggen
  - H2: Media en bijlagen
  - H2: Beveiliging en toegangscontrole
  - H2: Chatcommando's, taken afbreken en "het stopt niet"
  - H2: Diversen
  - H2: Gerelateerd

## help/index.md

- Route: /help
- Koppen:
  - H2: FAQ
  - H2: Diagnostiek
  - H2: Testen
  - H2: Community en meta

## help/scripts.md

- Route: /help/scripts
- Koppen:
  - H2: Conventies
  - H2: Scripts voor auth-monitoring
  - H2: GitHub-leeshulp
  - H2: Bij het toevoegen van scripts
  - H2: Gerelateerd

## help/testing-live.md

- Route: /help/testing-live
- Koppen:
  - H2: Live: lokale smoketestopdrachten
  - H2: Live: Android-node-capability-sweep
  - H2: Live: modelsmoketest (profielsleutels)
  - H3: Laag 1: directe modelaanvulling (geen Gateway)
  - H3: Laag 2: Gateway + ontwikkelagent-smoketest (wat "@openclaw" daadwerkelijk doet)
  - H2: Live: CLI-backend-smoketest (Claude, Gemini of andere lokale CLI's)
  - H2: Live: APNs HTTP/2-proxybereikbaarheid
  - H2: Live: ACP-bind-smoketest (/acp spawn ... --bind here)
  - H2: Live: Codex app-server-testharnas-smoketest
  - H3: Aanbevolen live-recepten
  - H2: Live: modelmatrix (wat we dekken)
  - H3: Moderne smoketestset (toolaanroepen + afbeelding)
  - H3: Basis: toolaanroepen (Read + optioneel Exec)
  - H3: Visie: afbeelding verzenden (bijlage → multimodaal bericht)
  - H3: Aggregators / alternatieve gateways
  - H2: Referenties (nooit committen)
  - H2: Deepgram live (audiotranscriptie)
  - H2: BytePlus-coderingsplan live
  - H2: ComfyUI-workflowmedia live
  - H2: Afbeeldingen genereren live
  - H2: Muziek genereren live
  - H2: Video genereren live
  - H2: Media-live-testharnas
  - H2: Gerelateerd

## help/testing-updates-plugins.md

- Route: /help/testing-updates-plugins
- Koppen:
  - H2: Wat we beschermen
  - H2: Lokaal bewijs tijdens ontwikkeling
  - H2: Docker-lanes
  - H2: Pakketacceptatie
  - H2: Release-standaard
  - H2: Legacy-compatibiliteit
  - H2: Dekking toevoegen
  - H2: Fouttriage

## help/testing.md

- Route: /help/testing
- Koppen:
  - H2: Snel starten
  - H2: Tijdelijke testmappen
  - H2: QA-specifieke runners
  - H3: Gedeelde Telegram-referenties via Convex (v1)
  - H3: Een kanaal toevoegen aan QA
  - H2: Testsuites (wat waar draait)
  - H3: Unit / integratie (standaard)
  - H3: Stabiliteit (Gateway)
  - H3: E2E (repo-aggregaat)
  - H3: E2E (Gateway-smoketest)
  - H3: E2E (Control UI nagebootste browser)
  - H3: E2E: OpenShell-backend-smoketest
  - H3: Live (echte providers + echte modellen)
  - H2: Welke suite moet ik draaien?
  - H2: Live (netwerkgebruikende) tests
  - H2: Docker-runners (optionele controles voor "werkt in Linux")
  - H2: Docs-sanity
  - H2: Offline-regressie (CI-veilig)
  - H2: Betrouwbaarheidsevaluaties voor agents (Skills)
  - H2: Contracttests (vorm van Plugin en kanaal)
  - H3: Opdrachten
  - H3: Kanaalcontracten
  - H3: Providerstatuscontracten
  - H3: Providercontracten
  - H3: Wanneer uitvoeren
  - H2: Regressies toevoegen (richtlijnen)
  - H2: Gerelateerd

## help/troubleshooting.md

- Route: /help/troubleshooting
- Koppen:
  - H2: Eerste 60 seconden
  - H2: Assistent voelt beperkt of mist tools
  - H2: Anthropic lange context 429
  - H2: Lokale OpenAI-compatibele backend werkt rechtstreeks maar faalt in OpenClaw
  - H2: Plugin-installatie faalt door ontbrekende openclaw extensions
  - H2: Installatiebeleid blokkeert Plugin-installaties of updates
  - H2: Plugin aanwezig maar geblokkeerd door verdachte eigendom
  - H2: Beslisboom
  - H2: Gerelateerd

## index.md

- Route: /
- Koppen:
  - H1: OpenClaw 🦞
  - H2: Wat is OpenClaw?
  - H2: Hoe het werkt
  - H2: Belangrijkste mogelijkheden
  - H2: Snel starten
  - H2: Dashboard
  - H2: Configuratie (optioneel)
  - H2: Begin hier
  - H2: Meer informatie

## install/ansible.md

- Route: /install/ansible
- Koppen:
  - H2: Vereisten
  - H2: Wat je krijgt
  - H2: Snel starten
  - H2: Wat wordt geïnstalleerd
  - H2: Configuratie na installatie
  - H3: Snelle opdrachten
  - H2: Beveiligingsarchitectuur
  - H2: Handmatige installatie
  - H2: Bijwerken
  - H2: Probleemoplossing
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## install/azure.md

- Route: /install/azure
- Koppen:
  - H2: Wat je gaat doen
  - H2: Wat je nodig hebt
  - H2: Deployment configureren
  - H2: Azure-resources deployen
  - H2: OpenClaw installeren
  - H2: Kostenoverwegingen
  - H2: Opschonen
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/bun.md

- Route: /install/bun
- Koppen:
  - H2: Installeren
  - H2: Lifecycle-scripts
  - H2: Kanttekeningen
  - H2: Gerelateerd

## install/clawdock.md

- Route: /install/clawdock
- Koppen:
  - H2: Installeren
  - H2: Wat je krijgt
  - H3: Basisbewerkingen
  - H3: Containertoegang
  - H3: Web-UI en koppelen
  - H3: Configuratie en onderhoud
  - H3: Hulpprogramma's
  - H2: Eerste gebruiksflow
  - H2: Configuratie en geheimen
  - H2: Gerelateerd

## install/development-channels.md

- Route: /install/development-channels
- Koppen:
  - H2: Van kanaal wisselen
  - H2: Eenmalig richten op versie of tag
  - H2: Dry-run
  - H2: Plugins en kanalen
  - H2: Huidige status controleren
  - H2: Best practices voor taggen
  - H2: Beschikbaarheid van macOS-app
  - H2: Gerelateerd

## install/digitalocean.md

- Route: /install/digitalocean
- Koppen:
  - H2: Vereisten
  - H2: Configuratie
  - H2: Persistentie en back-ups
  - H2: Tips voor 1 GB RAM
  - H2: Probleemoplossing
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/docker-vm-runtime.md

- Route: /install/docker-vm-runtime
- Koppen:
  - H2: Bak vereiste binaries in de image
  - H2: Bouwen en starten
  - H2: Wat waar blijft bestaan
  - H2: Updates
  - H2: Gerelateerd

## install/docker.md

- Route: /install/docker
- Koppen:
  - H2: Is Docker geschikt voor mij?
  - H2: Vereisten
  - H2: Gecontaineriseerde Gateway
  - H3: Handmatige flow
  - H3: Omgevingsvariabelen
  - H3: Observeerbaarheid
  - H3: Healthchecks
  - H3: LAN versus loopback
  - H3: Lokale providers op de host
  - H3: Claude CLI-backend in Docker
  - H3: Bonjour / mDNS
  - H3: Opslag en persistentie
  - H3: Shellhelpers (optioneel)
  - H3: Draaien op een VPS?
  - H2: Agent-sandbox
  - H3: Snel inschakelen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## install/exe-dev.md

- Route: /install/exe-dev
- Koppen:
  - H2: Snelle beginnersroute
  - H2: Wat je nodig hebt
  - H2: Geautomatiseerde installatie met Shelley
  - H2: Handmatige installatie
  - H2: 1) Maak de VM
  - H2: 2) Installeer vereisten (op de VM)
  - H2: 3) Installeer OpenClaw
  - H2: 4) Stel nginx in om OpenClaw naar poort 8000 te proxyen
  - H2: 5) Open OpenClaw en verleen rechten
  - H2: Externe kanaalconfiguratie
  - H2: Externe toegang
  - H2: Bijwerken
  - H2: Gerelateerd

## install/fly.md

- Route: /install/fly
- Koppen:
  - H2: Wat je nodig hebt
  - H2: Snelle beginnersroute
  - H2: Probleemoplossing
  - H3: "App luistert niet op het verwachte adres"
  - H3: Healthchecks falen / verbinding geweigerd
  - H3: OOM / geheugenproblemen
  - H3: Gateway-vergrendelingsproblemen
  - H3: Configuratie wordt niet gelezen
  - H3: Configuratie schrijven via SSH
  - H3: Status blijft niet behouden
  - H2: Updates
  - H3: Opdracht om machine bij te werken
  - H2: Privédeployment (gehard)
  - H3: Wanneer privédeployment gebruiken
  - H3: Configuratie
  - H3: Toegang tot een privédeployment
  - H3: Webhooks met privédeployment
  - H3: Beveiligingsvoordelen
  - H2: Notities
  - H2: Kosten
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/gcp.md

- Route: /install/gcp
- Koppen:
  - H2: Wat doen we (eenvoudig uitgelegd)?
  - H2: Snelle route (ervaren operators)
  - H2: Wat je nodig hebt
  - H2: Probleemoplossing
  - H2: Serviceaccounts (best practice voor beveiliging)
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/hetzner.md

- Route: /install/hetzner
- Koppen:
  - H2: Doel
  - H2: Wat doen we (eenvoudig uitgelegd)?
  - H2: Snelle route (ervaren operators)
  - H2: Wat je nodig hebt
  - H2: Infrastructure as Code (Terraform)
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/hostinger.md

- Route: /install/hostinger
- Koppen:
  - H2: Vereisten
  - H2: Optie A: 1-Click OpenClaw
  - H2: Optie B: OpenClaw op VPS
  - H2: Controleer je configuratie
  - H2: Probleemoplossing
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/index.md

- Route: /install
- Koppen:
  - H2: Systeemvereisten
  - H2: Aanbevolen: installatiescript
  - H2: Alternatieve installatiemethoden
  - H3: Lokale prefix-installer (install-cli.sh)
  - H3: npm, pnpm of bun
  - H3: Vanuit source
  - H3: Installeren vanuit de GitHub main-checkout
  - H3: Containers en package managers
  - H2: Installatie controleren
  - H2: Hosting en deployment
  - H2: Bijwerken, migreren of verwijderen
  - H2: Probleemoplossing: openclaw niet gevonden

## install/installer.md

- Route: /install/installer
- Koppen:
  - H2: Snelle opdrachten
  - H2: install.sh
  - H3: Flow (install.sh)
  - H3: Source-checkoutdetectie
  - H3: Voorbeelden (install.sh)
  - H2: install-cli.sh
  - H3: Flow (install-cli.sh)
  - H3: Voorbeelden (install-cli.sh)
  - H2: install.ps1
  - H3: Flow (install.ps1)
  - H3: Voorbeelden (install.ps1)
  - H2: CI en automatisering
  - H2: Probleemoplossing
  - H2: Gerelateerd

## install/kubernetes.md

- Route: /install/kubernetes
- Koppen:
  - H2: Waarom geen Helm?
  - H2: Wat je nodig hebt
  - H2: Snel starten
  - H2: Lokaal testen met Kind
  - H2: Stap voor stap
  - H3: 1) Deployen
  - H3: 2) Toegang tot de Gateway
  - H2: Wat wordt gedeployd
  - H2: Aanpassing
  - H3: Agent-instructies
  - H3: Gateway-configuratie
  - H3: Providers toevoegen
  - H3: Aangepaste namespace
  - H3: Aangepaste image
  - H3: Verder beschikbaar maken dan port-forward
  - H2: Opnieuw deployen
  - H2: Afbreken
  - H2: Architectuurnotities
  - H2: Bestandsstructuur
  - H2: Gerelateerd

## install/macos-vm.md

- Route: /install/macos-vm
- Koppen:
  - H2: Aanbevolen standaard (meeste gebruikers)
  - H2: macOS VM-opties
  - H3: Lokale VM op je Apple Silicon-Mac (Lume)
  - H3: Gehoste Mac-providers (cloud)
  - H2: Snelle route (Lume, ervaren gebruikers)
  - H2: Wat je nodig hebt (Lume)
  - H2: 1) Installeer Lume
  - H2: 2) Maak de macOS VM
  - H2: 3) Voltooi Configuratie-assistent
  - H2: 4) Haal het IP-adres van de VM op
  - H2: 5) SSH naar de VM
  - H2: 6) Installeer OpenClaw
  - H2: 7) Configureer kanalen
  - H2: 8) Draai de VM headless
  - H2: Bonus: iMessage-integratie
  - H2: Sla een gouden image op
  - H2: 24/7 draaien
  - H2: Probleemoplossing
  - H2: Gerelateerde docs

## install/migrating-claude.md

- Route: /install/migrating-claude
- Koppen:
  - H2: Twee manieren om te importeren
  - H2: Wat wordt geïmporteerd
  - H2: Wat alleen archief blijft
  - H2: Bronselectie
  - H2: Aanbevolen flow
  - H2: Conflictafhandeling
  - H2: JSON-uitvoer voor automatisering
  - H2: Probleemoplossing
  - H2: Gerelateerd

## install/migrating-hermes.md

- Route: /install/migrating-hermes
- Koppen:
  - H2: Twee manieren om te importeren
  - H2: Wat wordt geïmporteerd
  - H2: Wat alleen archief blijft
  - H2: Aanbevolen flow
  - H2: Conflictafhandeling
  - H2: Geheimen
  - H2: JSON-uitvoer voor automatisering
  - H2: Probleemoplossing
  - H2: Gerelateerd

## install/migrating.md

- Route: /install/migrating
- Koppen:
  - H2: Importeren uit een ander agentsysteem
  - H2: OpenClaw naar een nieuwe machine verplaatsen
  - H3: Migratiestappen
  - H3: Veelvoorkomende valkuilen
  - H3: Verificatiechecklist
  - H2: Een Plugin ter plekke upgraden
  - H2: Gerelateerd

## install/nix.md

- Route: /install/nix
- Koppen:
  - H2: Wat je krijgt
  - H2: Snel starten
  - H2: Runtimegedrag in Nix-modus
  - H3: Wat verandert in Nix-modus
  - H3: Configuratie- en statuspaden
  - H3: Service-PATH-detectie
  - H2: Gerelateerd

## install/node.md

- Route: /install/node
- Koppen:
  - H2: Controleer je versie
  - H2: Installeer Node
  - H2: Probleemoplossing
  - H3: openclaw: opdracht niet gevonden
  - H3: Machtigingsfouten bij npm install -g (Linux)
  - H2: Gerelateerd

## install/northflank.mdx

- Route: /install/northflank
- Koppen:
  - H1: Northflank
  - H2: Aan de slag
  - H2: Wat je krijgt
  - H2: Een kanaal verbinden
  - H2: Volgende stappen

## install/oracle.md

- Route: /install/oracle
- Koppen:
  - H2: Vereisten
  - H2: Configuratie
  - H2: Controleer de beveiligingshouding
  - H2: ARM-notities
  - H2: Persistentie en back-ups
  - H2: Fallback: SSH-tunnel
  - H2: Probleemoplossing
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/podman.md

- Route: /install/podman
- Koppen:
  - H2: Vereisten
  - H2: Snel starten
  - H2: Podman en Tailscale
  - H2: Systemd (Quadlet, optioneel)
  - H2: Configuratie, env en opslag
  - H2: Nuttige opdrachten
  - H2: Probleemoplossing
  - H2: Gerelateerd

## install/railway.mdx

- Route: /install/railway
- Koppen:
  - H1: Railway
  - H2: Snelle checklist (nieuwe gebruikers)
  - H2: One-click deploy
  - H2: Wat je krijgt
  - H2: Vereiste Railway-instellingen
  - H3: Openbaar netwerk
  - H3: Volume (vereist)
  - H3: Variabelen
  - H2: Een kanaal verbinden
  - H2: Back-ups &amp; migratie
  - H2: Volgende stappen

## install/raspberry-pi.md

- Route: /install/raspberry-pi
- Koppen:
  - H2: Hardwarecompatibiliteit
  - H2: Vereisten
  - H2: Installatie
  - H2: Prestatietips
  - H2: Aanbevolen modelconfiguratie
  - H2: Opmerkingen over ARM-binaries
  - H2: Persistentie en back-ups
  - H2: Probleemoplossing
  - H2: Volgende stappen
  - H2: Gerelateerd

## install/render.mdx

- Route: /install/render
- Koppen:
  - H1: Render
  - H2: Vereisten
  - H2: Deployen met een Render Blueprint
  - H2: De Blueprint begrijpen
  - H2: Een plan kiezen
  - H2: Na deployment
  - H3: De Control UI openen
  - H2: Functies van het Render Dashboard
  - H3: Logs
  - H3: Shelltoegang
  - H3: Omgevingsvariabelen
  - H3: Automatisch deployen
  - H2: Aangepast domein
  - H2: Schalen
  - H2: Back-ups en migratie
  - H2: Probleemoplossing
  - H3: Service start niet
  - H3: Trage koude starts (gratislaag)
  - H3: Gegevensverlies na opnieuw deployen
  - H3: Mislukte healthchecks
  - H2: Volgende stappen

## install/uninstall.md

- Route: /install/uninstall
- Koppen:
  - H2: Eenvoudige route (CLI nog geïnstalleerd)
  - H2: Handmatige serviceverwijdering (CLI niet geïnstalleerd)
  - H3: macOS (launchd)
  - H3: Linux (systemd-gebruikerseenheid)
  - H3: Windows (Scheduled Task)
  - H2: Normale installatie versus source-checkout
  - H3: Normale installatie (install.sh / npm / pnpm / bun)
  - H3: Source-checkout (git clone)
  - H2: Gerelateerd

## install/updating.md

- Route: /install/updating
- Koppen:
  - H2: Aanbevolen: openclaw update
  - H2: Wisselen tussen npm- en git-installaties
  - H2: Alternatief: voer het installatieprogramma opnieuw uit
  - H2: Alternatief: handmatige npm, pnpm of bun
  - H3: Geavanceerde npm-installatieonderwerpen
  - H2: Auto-updater
  - H2: Na het bijwerken
  - H3: Doctor uitvoeren
  - H3: De Gateway herstarten
  - H3: Verifiëren
  - H2: Terugdraaien
  - H3: Een versie vastzetten (npm)
  - H3: Een commit vastzetten (source)
  - H2: Als je vastzit
  - H2: Gerelateerd

## install/upstash.md

- Route: /install/upstash
- Koppen:
  - H2: Vereisten
  - H2: Een Box maken
  - H2: Verbinden met een SSH-tunnel
  - H2: OpenClaw installeren
  - H2: Onboarding uitvoeren
  - H2: De Gateway starten
  - H2: Automatisch herstarten
  - H2: Probleemoplossing
  - H2: Gerelateerd

## logging.md

- Route: /logging
- Koppen:
  - H2: Waar logs staan
  - H2: Logs lezen
  - H3: CLI: live tail (aanbevolen)
  - H3: Control UI (web)
  - H3: Alleen-kanaal-logs
  - H2: Logindelingen
  - H3: Bestandslogs (JSONL)
  - H3: Console-uitvoer
  - H3: Gateway WebSocket-logs
  - H2: Logging configureren
  - H3: Logniveaus
  - H3: Gerichte diagnostiek voor modeltransport
  - H3: Trace-correlatie
  - H3: Grootte en timing van modelaanroepen
  - H3: Consolestijlen
  - H3: Redactie
  - H2: Diagnostiek en OpenTelemetry
  - H2: Tips voor probleemoplossing
  - H2: Gerelateerd

## maturity/scorecard.md

- Route: /maturity/scorecard
- Koppen:
  - H1: Maturity-scorecard
  - H2: Waar deze pagina voor is
  - H2: In één oogopslag
  - H2: Scorebanden
  - H2: Surface-verkenner
  - H2: Samenvatting van QA-bewijs
  - H3: Gereedheid per gebied

## maturity/taxonomy.md

- Route: /maturity/taxonomy
- Koppen:
  - H1: Maturity-taxonomie
  - H2: Deze pagina lezen
  - H2: Maturity-niveaus
  - H2: Productgebieden
  - H2: Details
  - H3: Core
  - H3: Platform
  - H3: Kanaal
  - H3: Provider en tool

## network.md

- Route: /network
- Koppen:
  - H2: Kernmodel
  - H2: Pairing + identiteit
  - H2: Discovery + transporten
  - H2: Nodes + transporten
  - H2: Beveiliging
  - H2: Gerelateerd

## nodes/audio.md

- Route: /nodes/audio
- Koppen:
  - H2: Wat werkt
  - H2: Automatische detectie (standaard)
  - H2: Configuratievoorbeelden
  - H3: Provider + CLI-fallback (OpenAI + Whisper CLI)
  - H3: Alleen provider met scope-gating
  - H3: Alleen provider (Deepgram)
  - H3: Alleen provider (Mistral Voxtral)
  - H3: Alleen provider (SenseAudio)
  - H3: Transcript naar chat echoën (opt-in)
  - H2: Opmerkingen en limieten
  - H3: Ondersteuning voor proxy-omgeving
  - H2: Vermeldingsdetectie in groepen
  - H2: Valkuilen
  - H2: Gerelateerd

## nodes/camera.md

- Route: /nodes/camera
- Koppen:
  - H2: iOS-node
  - H3: Gebruikersinstelling (standaard aan)
  - H3: Opdrachten (via Gateway node.invoke)
  - H3: Vereiste voor voorgrond
  - H3: CLI-helper
  - H2: Android-node
  - H3: Android-gebruikersinstelling (standaard aan)
  - H3: Machtigingen
  - H3: Android-voorgrondvereiste
  - H3: Android-opdrachten (via Gateway node.invoke)
  - H3: Payloadbeveiliging
  - H2: macOS-app
  - H3: Gebruikersinstelling (standaard uit)
  - H3: CLI-helper (node invoke)
  - H2: Veiligheid + praktische limieten
  - H2: macOS-schermvideo (op OS-niveau)
  - H2: Gerelateerd

## nodes/images.md

- Route: /nodes/images
- Koppen:
  - H2: Doelen
  - H2: CLI-surface
  - H2: Gedrag van WhatsApp Web-kanaal
  - H2: Pipeline voor automatisch antwoorden
  - H2: Inkomende media naar opdrachten
  - H2: Limieten en fouten
  - H2: Opmerkingen voor tests
  - H2: Gerelateerd

## nodes/index.md

- Route: /nodes
- Koppen:
  - H2: Pairing + status
  - H2: Externe nodehost (system.run)
  - H3: Wat waar draait
  - H3: Een nodehost starten (voorgrond)
  - H3: Externe Gateway via SSH-tunnel (loopback-bind)
  - H3: Een nodehost starten (service)
  - H3: Pairen + naam geven
  - H3: De opdrachten op de allowlist zetten
  - H3: Exec naar de node laten wijzen
  - H3: Lokale modelinferentie
  - H2: Opdrachten aanroepen
  - H2: Opdrachtbeleid
  - H2: Configuratie (openclaw.json)
  - H2: Schermafbeeldingen (canvas-snapshots)
  - H3: Canvas-bediening
  - H3: A2UI (Canvas)
  - H2: Foto's + video's (nodecamera)
  - H2: Schermopnamen (nodes)
  - H2: Locatie (nodes)
  - H2: SMS (Android-nodes)
  - H2: Android-apparaat + opdrachten voor persoonlijke gegevens
  - H2: Systeemopdrachten (nodehost / Mac-node)
  - H2: Exec-nodebinding
  - H2: Machtigingenkaart
  - H2: Headless nodehost (cross-platform)
  - H2: Mac-nodemodus

## nodes/location-command.md

- Route: /nodes/location-command
- Koppen:
  - H2: TL;DR
  - H2: Waarom een selector (niet alleen een schakelaar)
  - H2: Instellingenmodel
  - H2: Machtigingstoewijzing (node.permissions)
  - H2: Opdracht: location.get
  - H2: Achtergrondgedrag
  - H2: Integratie met model/tooling
  - H2: UX-tekst (suggestie)
  - H2: Gerelateerd

## nodes/media-understanding.md

- Route: /nodes/media-understanding
- Koppen:
  - H2: Doelen
  - H2: Gedrag op hoofdlijnen
  - H2: Configuratieoverzicht
  - H3: Modelvermeldingen
  - H3: Providerreferenties (apiKey)
  - H2: Standaarden en limieten
  - H3: Mediabegrip automatisch detecteren (standaard)
  - H3: Ondersteuning voor proxy-omgeving (providermodellen)
  - H2: Capabilities (optioneel)
  - H2: Matrix voor providerondersteuning (OpenClaw-integraties)
  - H2: Richtlijnen voor modelselectie
  - H2: Beleid voor bijlagen
  - H2: Configuratievoorbeelden
  - H2: Statusuitvoer
  - H2: Opmerkingen
  - H2: Gerelateerd

## nodes/talk.md

- Route: /nodes/talk
- Koppen:
  - H2: Gedrag (macOS)
  - H2: Spraakinstructies in antwoorden
  - H2: Configuratie (/.openclaw/openclaw.json)
  - H2: macOS-UI
  - H2: Android-UI
  - H2: Opmerkingen
  - H2: Gerelateerd

## nodes/troubleshooting.md

- Route: /nodes/troubleshooting
- Koppen:
  - H2: Opdrachtladder
  - H2: Voorgrondvereisten
  - H2: Machtigingenmatrix
  - H2: Pairing versus goedkeuringen
  - H2: Veelvoorkomende nodefoutcodes
  - H2: Snelle herstellus
  - H2: Gerelateerd

## nodes/voicewake.md

- Route: /nodes/voicewake
- Koppen:
  - H2: Opslag (Gateway-host)
  - H2: Protocol
  - H3: Methoden
  - H3: Routeringsmethoden (trigger → doel)
  - H3: Gebeurtenissen
  - H2: Clientgedrag
  - H3: macOS-app
  - H3: iOS-node
  - H3: Android-node
  - H2: Gerelateerd

## openclaw-agent-runtime.md

- Route: /openclaw-agent-runtime
- Koppen:
  - H2: Typecontrole en linting
  - H2: Agent Runtime-tests uitvoeren
  - H2: Handmatig testen
  - H2: Schone reset
  - H2: Referenties
  - H2: Gerelateerd

## perplexity.md

- Route: /perplexity
- Koppen:
  - H2: Gerelateerd

## plan/codex-context-engine-harness.md

- Route: /plan/codex-context-engine-harness
- Koppen:
  - H2: Status
  - H2: Doel
  - H2: Niet-doelen
  - H2: Huidige architectuur
  - H2: Huidige kloof
  - H2: Gewenst gedrag
  - H2: Ontwerpbeperkingen
  - H3: Codex app-server blijft canoniek voor native threadstatus
  - H3: Context-engine-assemblage moet naar Codex-invoer worden geprojecteerd
  - H3: Stabiliteit van prompt-cache is belangrijk
  - H3: Semantiek voor runtime-selectie verandert niet
  - H2: Implementatieplan
  - H3: 1. Herbruikbare context-engine-pogingshelpers exporteren of verplaatsen
  - H3: 2. Een Codex-contextprojectiehelper toevoegen
  - H3: 3. Bootstrap bedraden vóór het starten van de Codex-thread
  - H3: 4. Assemble bedraden vóór thread/start / thread/resume en turn/start
  - H3: 5. Stabiele prompt-cache-opmaak behouden
  - H3: 6. Post-turn bedraden na transcriptspiegeling
  - H3: 7. Gebruik en runtimecontext van prompt-cache normaliseren
  - H3: 8. Compaction-beleid
  - H4: /compact en expliciete OpenClaw-compaction
  - H4: In-turn Codex native contextCompaction-gebeurtenissen
  - H3: 9. Sessiereset en bindingsgedrag
  - H3: 10. Foutafhandeling
  - H2: Testplan
  - H3: Unittests
  - H3: Bestaande tests om bij te werken
  - H3: Integratie- / livetests
  - H2: Observability
  - H2: Migratie / compatibiliteit
  - H2: Open vragen
  - H2: Acceptatiecriteria

## plan/ui-channels.md

- Route: /plan/ui-channels
- Koppen:
  - H2: Status
  - H2: Probleem
  - H2: Doelen
  - H2: Niet-doelen
  - H2: Doelmodel
  - H2: Delivery-metadata
  - H2: Runtime-capabilitycontract
  - H2: Kanaaltoewijzing
  - H2: Refactorstappen
  - H2: Tests
  - H2: Open vragen
  - H2: Gerelateerd

## platforms/android.md

- Route: /platforms/android
- Koppen:
  - H2: Ondersteuningsmomentopname
  - H2: Systeembesturing
  - H2: Verbindingsrunbook
  - H3: Vereisten
  - H3: 1) De Gateway starten
  - H3: 2) Discovery verifiëren (optioneel)
  - H4: Tailnet (Wenen ⇄ Londen) discovery via unicast DNS-SD
  - H3: 3) Verbinden vanaf Android
  - H3: Presence alive-beacons
  - H3: 4) Pairing goedkeuren (CLI)
  - H3: 5) Verifiëren dat de node is verbonden
  - H3: 6) Chat + geschiedenis
  - H3: 7) Canvas + camera
  - H4: Gateway Canvas Host (aanbevolen voor webinhoud)
  - H3: 8) Spraak + uitgebreid Android-opdrachtoppervlak
  - H2: Assistant-entrypoints
  - H2: Meldingsdoorsturing
  - H2: Gerelateerd

## platforms/digitalocean.md

- Route: /platforms/digitalocean
- Koppen:
  - H2: Gerelateerd

## platforms/easyrunner.md

- Route: /platforms/easyrunner
- Koppen:
  - H2: Voordat je begint
  - H2: Compose-app
  - H2: OpenClaw configureren
  - H2: Verifiëren
  - H2: Updates en back-ups
  - H2: Probleemoplossing

## platforms/index.md

- Route: /platforms
- Koppen:
  - H2: Kies je OS
  - H2: VPS en hosting
  - H2: Algemene links
  - H2: Gateway-service installeren (CLI)
  - H2: Gerelateerd

## platforms/ios.md

- Route: /platforms/ios
- Koppen:
  - H2: Wat het doet
  - H2: Vereisten
  - H2: Snelstart (pairen + verbinden)
  - H2: Relay-ondersteunde push voor officiële builds
  - H2: Background alive-beacons
  - H2: Authenticatie- en vertrouwensflow
  - H2: Discovery-paden
  - H3: Bonjour (LAN)
  - H3: Tailnet (cross-network)
  - H3: Handmatige host/poort
  - H2: Canvas + A2UI
  - H2: Relatie met Computer Use
  - H3: Canvas-evaluatie / snapshot
  - H2: Voice wake + praatmodus
  - H2: Veelvoorkomende fouten
  - H2: Gerelateerde docs

## platforms/linux.md

- Route: /platforms/linux
- Koppen:
  - H2: Snelle beginnersroute (VPS)
  - H2: Installeren
  - H2: Gateway
  - H2: Gateway-service installeren (CLI)
  - H2: Systeembesturing (systemd-gebruikerseenheid)
  - H2: Geheugendruk en OOM-kills
  - H2: Gerelateerd

## platforms/mac/bundled-gateway.md

- Route: /platforms/mac/bundled-gateway
- Koppen:
  - H2: Automatische installatie
  - H2: Handmatig herstel
  - H2: Launchd (Gateway als LaunchAgent)
  - H2: Versiecompatibiliteit
  - H2: Statusmap op macOS
  - H2: App-connectiviteit debuggen
  - H2: Smokecheck
  - H2: Gerelateerd

## platforms/mac/canvas.md

- Route: /platforms/mac/canvas
- Koppen:
  - H2: Waar Canvas staat
  - H2: Paneelgedrag
  - H2: Agent-API-surface
  - H2: A2UI in Canvas
  - H3: A2UI-opdrachten (v0.8)
  - H2: Agentruns vanuit Canvas triggeren
  - H2: Beveiligingsopmerkingen
  - H2: Gerelateerd

## platforms/mac/child-process.md

- Route: /platforms/mac/child-process
- Koppen:
  - H2: Standaardgedrag (launchd)
  - H2: Niet-ondertekende dev-builds
  - H2: Attach-only-modus
  - H2: Externe modus
  - H2: Waarom we launchd verkiezen
  - H2: Gerelateerd

## platforms/mac/dev-setup.md

- Route: /platforms/mac/dev-setup
- Koppen:
  - H1: macOS-ontwikkelaarsconfiguratie
  - H2: Vereisten
  - H2: 1. Afhankelijkheden installeren
  - H2: 2. De app bouwen en verpakken
  - H2: 3. De CLI en Gateway installeren
  - H2: Probleemoplossing
  - H3: Build mislukt: toolchain- of SDK-mismatch
  - H3: App crasht bij toestemmingsverlening
  - H3: Gateway blijft eindeloos op "Starting..."
  - H2: Gerelateerd

## platforms/mac/health.md

- Route: /platforms/mac/health
- Koppen:
  - H1: Gezondheidscontroles op macOS
  - H2: Menubalk
  - H2: Instellingen
  - H2: Hoe de probe werkt
  - H2: Bij twijfel
  - H2: Gerelateerd

## platforms/mac/icon.md

- Route: /platforms/mac/icon
- Koppen:
  - H1: Pictogramstatussen in de menubalk
  - H2: Gerelateerd

## platforms/mac/logging.md

- Route: /platforms/mac/logging
- Koppen:
  - H1: Logging (macOS)
  - H2: Roterend diagnostisch bestandslog (debugpaneel)
  - H2: Privégegevens in unified logging op macOS
  - H2: Inschakelen voor OpenClaw (ai.openclaw)
  - H2: Uitschakelen na het debuggen
  - H2: Gerelateerd

## platforms/mac/menu-bar.md

- Route: /platforms/mac/menu-bar
- Koppen:
  - H2: Wat wordt getoond
  - H2: Statusmodel
  - H2: IconState-enum (Swift)
  - H3: ActivityKind → glyph
  - H3: Visuele mapping
  - H2: Contextsubmenu
  - H2: Statustekstregel (menu)
  - H2: Gebeurtenisinname
  - H2: Debug-override
  - H2: Testchecklist
  - H2: Gerelateerd

## platforms/mac/peekaboo.md

- Route: /platforms/mac/peekaboo
- Koppen:
  - H2: Wat dit is (en niet is)
  - H2: Relatie met Computer Use
  - H2: De bridge inschakelen
  - H2: Volgorde voor clientdetectie
  - H2: Beveiliging en toestemmingen
  - H2: Snapshotgedrag (automatisering)
  - H2: Probleemoplossing
  - H2: Gerelateerd

## platforms/mac/permissions.md

- Route: /platforms/mac/permissions
- Koppen:
  - H2: Vereisten voor stabiele toestemmingen
  - H2: Toegankelijkheidstoekenningen voor Node- en CLI-runtimes
  - H2: Herstelchecklist wanneer prompts verdwijnen
  - H2: Bestands- en maptoestemmingen (Desktop/Documenten/Downloads)
  - H2: Gerelateerd

## platforms/mac/remote.md

- Route: /platforms/mac/remote
- Koppen:
  - H2: Modi
  - H2: Externe transports
  - H2: Vereisten op de externe host
  - H2: macOS-appconfiguratie
  - H2: Webchat
  - H2: Toestemmingen
  - H2: Beveiligingsnotities
  - H2: WhatsApp-inlogflow (extern)
  - H2: Probleemoplossing
  - H2: Meldingsgeluiden
  - H2: Gerelateerd

## platforms/mac/signing.md

- Route: /platforms/mac/signing
- Koppen:
  - H1: mac-ondertekening (debugbuilds)
  - H2: Gebruik
  - H3: Opmerking over ad-hocondertekening
  - H2: Buildmetadata voor Over
  - H2: Waarom
  - H2: Gerelateerd

## platforms/mac/skills.md

- Route: /platforms/mac/skills
- Koppen:
  - H2: Gegevensbron
  - H2: Installatieacties
  - H2: Env/API-sleutels
  - H2: Externe modus
  - H2: Gerelateerd

## platforms/mac/voice-overlay.md

- Route: /platforms/mac/voice-overlay
- Koppen:
  - H1: Levenscyclus van voice-overlay (macOS)
  - H2: Huidige bedoeling
  - H2: Geïmplementeerd (9 dec. 2025)
  - H2: Volgende stappen
  - H2: Debugchecklist
  - H2: Migratiestappen (voorgesteld)
  - H2: Gerelateerd

## platforms/mac/voicewake.md

- Route: /platforms/mac/voicewake
- Koppen:
  - H1: Voice Wake en push-to-talk
  - H2: Vereisten
  - H2: Modi
  - H2: Runtimegedrag (wake-word)
  - H2: Levenscyclusinvarianten
  - H2: Foutmodus van sticky overlay (eerder)
  - H2: Specifiek voor push-to-talk
  - H2: Gebruikersgerichte instellingen
  - H2: Doorstuurgedrag
  - H2: Doorstuurpayload
  - H2: Snelle verificatie
  - H2: Gerelateerd

## platforms/mac/webchat.md

- Route: /platforms/mac/webchat
- Koppen:
  - H2: Starten en debuggen
  - H2: Hoe het is bedraad
  - H2: Beveiligingsoppervlak
  - H2: Bekende beperkingen
  - H2: Gerelateerd

## platforms/mac/xpc.md

- Route: /platforms/mac/xpc
- Koppen:
  - H1: OpenClaw macOS IPC-architectuur
  - H2: Doelen
  - H2: Hoe het werkt
  - H3: Gateway + Node-transport
  - H3: Node-service + app-IPC
  - H3: PeekabooBridge (UI-automatisering)
  - H2: Operationele flows
  - H2: Hardening-notities
  - H2: Gerelateerd

## platforms/macos.md

- Route: /platforms/macos
- Koppen:
  - H2: Downloaden
  - H2: Eerste uitvoering
  - H2: Kies een Gateway-modus
  - H2: Waar de app eigenaar van is
  - H2: macOS-detailpagina's
  - H2: Gerelateerd

## platforms/oracle.md

- Route: /platforms/oracle
- Koppen:
  - H2: Gerelateerd

## platforms/raspberry-pi.md

- Route: /platforms/raspberry-pi
- Koppen:
  - H2: Gerelateerd

## platforms/windows.md

- Route: /platforms/windows
- Koppen:
  - H2: Aanbevolen: Windows Hub
  - H3: Wat Windows Hub bevat
  - H3: Eerste start
  - H2: Windows-node-modus
  - H2: Lokale MCP-modus
  - H2: Native Windows-CLI en Gateway
  - H2: WSL2 Gateway
  - H2: Gateway automatisch starten vóór Windows-aanmelding
  - H2: WSL-services via LAN beschikbaar maken
  - H2: Probleemoplossing
  - H3: Het systeemvakpictogram verschijnt niet
  - H3: Lokale configuratie mislukt
  - H3: De app zegt dat koppelen vereist is
  - H3: Webchat kan een externe Gateway niet bereiken
  - H3: screen.snapshot-, camera- of audio-opdrachten mislukken
  - H3: Git- of GitHub-connectiviteit mislukt
  - H2: Gerelateerd

## plugins/adding-capabilities.md

- Route: /plugins/adding-capabilities
- Koppen:
  - H2: Wanneer een capability maken
  - H2: De standaardvolgorde
  - H2: Wat waar hoort
  - H2: Provider- en harness-seams
  - H2: Bestandschecklist
  - H2: Uitgewerkt voorbeeld: afbeeldingsgeneratie
  - H2: Embeddingproviders
  - H2: Reviewchecklist
  - H2: Gerelateerd

## plugins/admin-http-rpc.md

- Route: /plugins/admin-http-rpc
- Koppen:
  - H2: Voordat u dit inschakelt
  - H2: Inschakelen
  - H2: De route verifiëren
  - H2: Authenticatie
  - H2: Beveiligingsmodel
  - H2: Aanvraag
  - H2: Antwoord
  - H2: Toegestane methoden
  - H2: WebSocket-vergelijking
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/agent-tools.md

- Route: /plugins/agent-tools
- Koppen:
  - H2: Gerelateerd

## plugins/architecture-internals.md

- Route: /plugins/architecture-internals
- Koppen:
  - H2: Laadpipeline
  - H3: Manifest-first-gedrag
  - H3: Plugin-cachegrens
  - H2: Registermodel
  - H2: Callbacks voor gespreksbinding
  - H2: Provider-runtimehooks
  - H3: Hookvolgorde en gebruik
  - H3: Providervoorbeeld
  - H3: Ingebouwde voorbeelden
  - H2: Runtimehelpers
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP-routes
  - H2: Plugin SDK-importpaden
  - H2: Berichttoolschema's
  - H2: Resolutie van kanaaldoel
  - H2: Door configuratie ondersteunde mappen
  - H2: Providercatalogi
  - H2: Alleen-lezen kanaalinspectie
  - H2: Pakketbundels
  - H3: Kanaalcatalogusmetadata
  - H2: Context-engine-plugins
  - H2: Een nieuwe capability toevoegen
  - H3: Capabilitychecklist
  - H3: Capabilitysjabloon
  - H2: Gerelateerd

## plugins/architecture.md

- Route: /plugins/architecture
- Koppen:
  - H2: Publiek capabilitymodel
  - H3: Houding voor externe compatibiliteit
  - H3: Plugin-vormen
  - H3: Legacy-hooks
  - H3: Compatibiliteitssignalen
  - H2: Architectuuroverzicht
  - H3: Snapshot van Plugin-metadata en opzoektabel
  - H3: Activatieplanning
  - H3: Kanaalplugins en de gedeelde berichttool
  - H2: Model voor capability-eigenaarschap
  - H3: Capabilitylagen
  - H3: Voorbeeld van multi-capability bedrijfsplugin
  - H3: Capabilityvoorbeeld: video begrijpen
  - H2: Contracten en handhaving
  - H3: Wat in een contract hoort
  - H2: Uitvoeringsmodel
  - H2: Exportgrens
  - H2: Internals en referentie
  - H2: Gerelateerd

## plugins/building-extensions.md

- Route: /plugins/building-extensions
- Koppen:
  - H2: Gerelateerd

## plugins/building-plugins.md

- Route: /plugins/building-plugins
- Koppen:
  - H2: Vereisten
  - H2: Kies de pluginvorm
  - H2: Quickstart
  - H2: Tools registreren
  - H2: Importconventies
  - H2: Checklist vóór indiening
  - H2: Testen tegen bètareleases
  - H2: Volgende stappen
  - H2: Gerelateerd

## plugins/bundles.md

- Route: /plugins/bundles
- Koppen:
  - H2: Waarom bundels bestaan
  - H2: Een bundel installeren
  - H2: Wat OpenClaw uit bundels mapt
  - H3: Nu ondersteund
  - H4: Skill-inhoud
  - H4: Hookpacks
  - H4: MCP voor ingebedde OpenClaw
  - H4: Instellingen voor ingebedde OpenClaw
  - H4: Ingebedde OpenClaw LSP
  - H3: Gedetecteerd maar niet uitgevoerd
  - H2: Bundelformaten
  - H2: Detectieprioriteit
  - H2: Runtimeafhankelijkheden en opschoning
  - H2: Beveiliging
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/cli-backend-plugins.md

- Route: /plugins/cli-backend-plugins
- Koppen:
  - H2: Waar de plugin eigenaar van is
  - H2: Minimale backendplugin
  - H2: Configuratievorm
  - H2: Geavanceerde backendhooks
  - H3: ownsNativeCompaction: afmelden voor OpenClaw Compaction
  - H2: MCP-toolbridge
  - H2: Gebruikersconfiguratie
  - H2: Verificatie
  - H2: Checklist
  - H2: Gerelateerd

## plugins/codex-computer-use.md

- Route: /plugins/codex-computer-use
- Koppen:
  - H2: OpenClaw.app en Peekaboo
  - H2: iOS-app
  - H2: Directe cua-driver MCP
  - H2: Snelle configuratie
  - H2: Opdrachten
  - H2: Marketplace-keuzes
  - H2: Gebundelde macOS-marketplace
  - H2: Limiet voor externe catalogus
  - H2: Configuratiereferentie
  - H2: Wat OpenClaw controleert
  - H2: macOS-toestemmingen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/codex-harness-reference.md

- Route: /plugins/codex-harness-reference
- Koppen:
  - H2: Plugin-configuratieoppervlak
  - H2: App-servertransport
  - H2: Goedkeurings- en sandboxmodi
  - H2: Gesandboxte native uitvoering
  - H2: Auth- en omgevingsisolatie
  - H2: Dynamische tools
  - H2: Time-outs
  - H2: Modeldetectie
  - H2: Workspace-bootstrapbestanden
  - H2: Omgevingsoverschrijvingen
  - H2: Gerelateerd

## plugins/codex-harness-runtime.md

- Route: /plugins/codex-harness-runtime
- Koppen:
  - H2: Overzicht
  - H2: Threadbindingen en modelwijzigingen
  - H2: Zichtbare antwoorden en heartbeats
  - H2: Hookgrenzen
  - H2: V1-ondersteuningscontract
  - H2: Native toestemmingen en MCP-elicitations
  - H2: Wachtrijsturing
  - H2: Codex-feedbackupload
  - H2: Compaction en transcriptspiegel
  - H2: Media en levering
  - H2: Gerelateerd

## plugins/codex-harness.md

- Route: /plugins/codex-harness
- Koppen:
  - H2: Vereisten
  - H2: Quickstart
  - H2: Threads delen met Codex Desktop en CLI
  - H2: Configuratie
  - H2: Codex-runtime verifiëren
  - H2: Routing en modelselectie
  - H2: Implementatiepatronen
  - H3: Basis-Codex-implementatie
  - H3: Implementatie met gemengde providers
  - H3: Fail-closed Codex-implementatie
  - H2: App-serverbeleid
  - H2: Opdrachten en diagnostiek
  - H3: Codex-threads lokaal inspecteren
  - H2: Native Codex-plugins
  - H2: Computer Use
  - H2: Runtimegrenzen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/codex-native-plugins.md

- Route: /plugins/codex-native-plugins
- Koppen:
  - H2: Vereisten
  - H2: Quickstart
  - H2: Plugins beheren vanuit chat
  - H2: Hoe native pluginconfiguratie werkt
  - H2: V1-ondersteuningsgrens
  - H2: App-inventaris en eigenaarschap
  - H2: Thread-appconfiguratie
  - H2: Beleid voor destructieve acties
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/community.md

- Route: /plugins/community
- Koppen:
  - H2: Plugins vinden
  - H2: Plugins publiceren
  - H2: Gerelateerd

## plugins/compatibility.md

- Route: /plugins/compatibility
- Koppen:
  - H2: Compatibiliteitsregister
  - H2: Plugin-inspectorpakket
  - H3: Acceptatielane voor onderhouders
  - H2: Afschrijvingsbeleid
  - H2: Huidige compatibiliteitsgebieden
  - H3: Platte aliassen voor WhatsApp Inbound Callback
  - H3: WhatsApp Inbound-toelatingsvelden
  - H2: Releaseopmerkingen

## plugins/copilot.md

- Route: /plugins/copilot
- Koppen:
  - H2: Vereisten
  - H2: Plugin-installatie
  - H2: Quickstart
  - H2: Ondersteunde providers
  - H2: BYOK
  - H2: Auth
  - H2: Configuratieoppervlak
  - H2: Compaction
  - H2: Transcriptspiegeling
  - H2: Nevenvragen (/btw)
  - H2: Doctor
  - H2: Beperkingen
  - H2: Toestemmingen en askuser
  - H3: GitHub-token op sessieniveau
  - H2: Gerelateerd

## plugins/dependency-resolution.md

- Route: /plugins/dependency-resolution
- Koppen:
  - H2: Verantwoordelijkheidsverdeling
  - H2: Installatieroots
  - H2: Lokale plugins
  - H2: Opstarten en herladen
  - H2: Gebundelde plugins
  - H2: Legacy-opschoning

## plugins/google-meet.md

- Route: /plugins/google-meet
- Koppen:
  - H2: Snelstart
  - H3: Lokale Gateway + Parallels Chrome
  - H2: Installatieopmerkingen
  - H2: Transporten
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth en preflight
  - H3: Google-inloggegevens maken
  - H3: Het vernieuwingstoken aanmaken
  - H3: OAuth verifiëren met doctor
  - H2: Configuratie
  - H2: Tool
  - H2: Agent- en bidi-modi
  - H2: Checklist voor livetests
  - H2: Probleemoplossing
  - H3: Agent kan de Google Meet-tool niet zien
  - H3: Geen verbonden Google Meet-geschikte Node
  - H3: Browser wordt geopend, maar agent kan niet deelnemen
  - H3: Vergadering maken mislukt
  - H3: Agent neemt deel, maar spreekt niet
  - H3: Twilio-installatiecontroles mislukken
  - H3: Twilio-oproep start, maar komt nooit in de vergadering
  - H2: Opmerkingen
  - H2: Gerelateerd

## plugins/hooks.md

- Route: /plugins/hooks
- Koppen:
  - H2: Snelstart
  - H2: Hook-catalogus
  - H2: Runtime-hooks debuggen
  - H2: Beleid voor tool-aanroepen
  - H3: Hook voor uitvoeringsomgeving
  - H3: Persistentie van toolresultaten
  - H2: Prompt- en modelhooks
  - H3: Sessie-extensies en injecties voor de volgende beurt
  - H2: Berichthooks
  - H2: Hooks installeren
  - H2: Gateway-levenscyclus
  - H2: Aankomende afschaffingen
  - H2: Gerelateerd

## plugins/install-overrides.md

- Route: /plugins/install-overrides
- Koppen:
  - H2: Omgeving
  - H2: Gedrag
  - H2: Package-E2E

## plugins/llama-cpp.md

- Route: /plugins/llama-cpp
- Koppen:
  - H2: Configuratie
  - H2: Native Runtime

## plugins/manage-plugins.md

- Route: /plugins/manage-plugins
- Koppen:
  - H2: Plugins weergeven en zoeken
  - H2: Plugins installeren
  - H2: Opnieuw starten en inspecteren
  - H2: Plugins bijwerken
  - H2: Plugins verwijderen
  - H2: Een bron kiezen
  - H2: Plugins publiceren
  - H2: Gerelateerd

## plugins/manifest.md

- Route: /plugins/manifest
- Koppen:
  - H2: Wat dit bestand doet
  - H2: Minimaal voorbeeld
  - H2: Uitgebreid voorbeeld
  - H2: Referentie voor top-level velden
  - H2: Referentie voor metadata van generatieproviders
  - H2: Referentie voor toolmetadata
  - H2: providerAuthChoices-referentie
  - H2: commandAliases-referentie
  - H2: activation-referentie
  - H2: qaRunners-referentie
  - H2: setup-referentie
  - H3: setup.providers-referentie
  - H3: setup-velden
  - H2: uiHints-referentie
  - H2: contracts-referentie
  - H2: mediaUnderstandingProviderMetadata-referentie
  - H2: channelConfigs-referentie
  - H3: Een andere kanaal-Plugin vervangen
  - H2: modelSupport-referentie
  - H2: modelCatalog-referentie
  - H2: modelIdNormalization-referentie
  - H2: providerEndpoints-referentie
  - H2: providerRequest-referentie
  - H2: secretProviderIntegrations-referentie
  - H2: modelPricing-referentie
  - H3: OpenClaw Provider Index
  - H2: Manifest versus package.json
  - H3: package.json-velden die ontdekking beïnvloeden
  - H2: Ontdekkingsprioriteit (dubbele Plugin-id's)
  - H2: JSON Schema-vereisten
  - H2: Validatiegedrag
  - H2: Opmerkingen
  - H2: Gerelateerd

## plugins/memory-lancedb.md

- Route: /plugins/memory-lancedb
- Koppen:
  - H2: Installatie
  - H2: Snelstart
  - H2: Door providers ondersteunde embeddings
  - H2: Ollama-embeddings
  - H2: OpenAI-compatibele providers
  - H2: Limieten voor recall en vastlegging
  - H2: Opdrachten
  - H2: Opslag
  - H2: Runtime-afhankelijkheden
  - H2: Probleemoplossing
  - H3: Invoerlengte overschrijdt de contextlengte
  - H3: Niet-ondersteund embeddingmodel
  - H3: Plugin wordt geladen, maar er verschijnen geen herinneringen
  - H2: Gerelateerd

## plugins/memory-wiki.md

- Route: /plugins/memory-wiki
- Koppen:
  - H2: Wat het toevoegt
  - H2: Hoe het past bij geheugen
  - H2: Aanbevolen hybride patroon
  - H2: Vault-modi
  - H3: geïsoleerd
  - H3: bridge
  - H3: unsafe-local
  - H2: Vault-indeling
  - H2: Imports in Open Knowledge Format
  - H2: Gestructureerde claims en bewijs
  - H2: Entitymetadata voor agents
  - H2: Compile-pijplijn
  - H2: Dashboards en gezondheidsrapporten
  - H2: Zoeken en ophalen
  - H2: Agent-tools
  - H2: Prompt- en contextgedrag
  - H2: Configuratie
  - H3: Voorbeeld: QMD + bridge-modus
  - H2: CLI
  - H2: Obsidian-ondersteuning
  - H2: Aanbevolen workflow
  - H2: Gerelateerde docs

## plugins/message-presentation.md

- Route: /plugins/message-presentation
- Koppen:
  - H2: Contract
  - H2: Voorbeelden van producers
  - H2: Renderer-contract
  - H2: Core-renderflow
  - H2: Degradatieregels
  - H3: Zichtbaarheid van fallback voor knopwaarde
  - H2: Provider-mapping
  - H2: Presentatie versus InteractiveReply
  - H2: Vastgezette levering
  - H2: Checklist voor Plugin-auteurs
  - H2: Gerelateerde docs

## plugins/oc-path.md

- Route: /plugins/oc-path
- Koppen:
  - H2: Waarom dit inschakelen
  - H2: Waar het draait
  - H2: Inschakelen
  - H2: Afhankelijkheden
  - H2: Wat het biedt
  - H2: Relatie met andere plugins
  - H2: Veiligheid
  - H2: Gerelateerd

## plugins/plugin-inventory.md

- Route: /plugins/plugin-inventory
- Koppen:
  - H1: Plugin-inventaris
  - H2: Definities
  - H2: Een Plugin installeren
  - H2: Core npm-package
  - H2: Officiële externe packages
  - H2: Alleen source-checkout

## plugins/plugin-permission-requests.md

- Route: /plugins/plugin-permission-requests
- Koppen:
  - H2: De juiste gate kiezen
  - H2: Goedkeuring aanvragen vóór een tool-aanroep
  - H2: Beslissingsgedrag
  - H2: Goedkeuringsprompts routeren
  - H2: Native Codex-machtigingen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## plugins/reference.md

- Route: /plugins/reference
- Koppen:
  - H1: Plugin-referentie

## plugins/reference/acpx.md

- Route: /plugins/reference/acpx
- Koppen:
  - H1: ACPx-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/admin-http-rpc.md

- Route: /plugins/reference/admin-http-rpc
- Koppen:
  - H1: Admin Http Rpc-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/alibaba.md

- Route: /plugins/reference/alibaba
- Koppen:
  - H1: Alibaba-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/amazon-bedrock-mantle.md

- Route: /plugins/reference/amazon-bedrock-mantle
- Koppen:
  - H1: Amazon Bedrock Mantle-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/amazon-bedrock.md

- Route: /plugins/reference/amazon-bedrock
- Koppen:
  - H1: Amazon Bedrock-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/anthropic-vertex.md

- Route: /plugins/reference/anthropic-vertex
- Koppen:
  - H1: Anthropic Vertex-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Route: /plugins/reference/anthropic
- Koppen:
  - H1: Anthropic-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/arcee.md

- Route: /plugins/reference/arcee
- Koppen:
  - H1: Arcee-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/azure-speech.md

- Route: /plugins/reference/azure-speech
- Koppen:
  - H1: Azure Speech-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/bonjour.md

- Route: /plugins/reference/bonjour
- Koppen:
  - H1: Bonjour-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/brave.md

- Route: /plugins/reference/brave
- Koppen:
  - H1: Brave-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/browser.md

- Route: /plugins/reference/browser
- Koppen:
  - H1: Browser-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/byteplus.md

- Route: /plugins/reference/byteplus
- Koppen:
  - H1: BytePlus-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/canvas.md

- Route: /plugins/reference/canvas
- Koppen:
  - H1: Canvas-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/cerebras.md

- Route: /plugins/reference/cerebras
- Koppen:
  - H1: Cerebras-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/chutes.md

- Route: /plugins/reference/chutes
- Koppen:
  - H1: Chutes-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/clawrouter.md

- Route: /plugins/reference/clawrouter
- Koppen:
  - H1: ClawRouter-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/clickclack.md

- Route: /plugins/reference/clickclack
- Koppen:
  - H1: Clickclack-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/cloudflare-ai-gateway.md

- Route: /plugins/reference/cloudflare-ai-gateway
- Koppen:
  - H1: Cloudflare AI Gateway-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/codex-supervisor.md

- Route: /plugins/reference/codex-supervisor
- Koppen:
  - H1: Codex Supervisor-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Sessielijst

## plugins/reference/codex.md

- Route: /plugins/reference/codex
- Koppen:
  - H1: Codex-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/cohere.md

- Route: /plugins/reference/cohere
- Koppen:
  - H1: Cohere-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/comfy.md

- Route: /plugins/reference/comfy
- Koppen:
  - H1: ComfyUI-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/copilot-proxy.md

- Route: /plugins/reference/copilot-proxy
- Koppen:
  - H1: Copilot Proxy-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/copilot.md

- Route: /plugins/reference/copilot
- Koppen:
  - H1: Copilot-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/deepgram.md

- Route: /plugins/reference/deepgram
- Koppen:
  - H1: Deepgram-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/deepinfra.md

- Route: /plugins/reference/deepinfra
- Koppen:
  - H1: DeepInfra-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/deepseek.md

- Route: /plugins/reference/deepseek
- Koppen:
  - H1: DeepSeek-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/diagnostics-otel.md

- Route: /plugins/reference/diagnostics-otel
- Koppen:
  - H1: Diagnostics OpenTelemetry-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/diagnostics-prometheus.md

- Route: /plugins/reference/diagnostics-prometheus
- Koppen:
  - H1: Diagnostics Prometheus-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/diffs-language-pack.md

- Route: /plugins/reference/diffs-language-pack
- Koppen:
  - H1: Diffs Language Pack-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Toegevoegde talen

## plugins/reference/diffs.md

- Route: /plugins/reference/diffs
- Koppen:
  - H1: Diffs-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/discord.md

- Route: /plugins/reference/discord
- Koppen:
  - H1: Discord-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/document-extract.md

- Route: /plugins/reference/document-extract
- Koppen:
  - H1: Document Extract-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/duckduckgo.md

- Route: /plugins/reference/duckduckgo
- Koppen:
  - H1: DuckDuckGo-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/elevenlabs.md

- Route: /plugins/reference/elevenlabs
- Koppen:
  - H1: Elevenlabs-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/exa.md

- Route: /plugins/reference/exa
- Koppen:
  - H1: Exa-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/fal.md

- Route: /plugins/reference/fal
- Koppen:
  - H1: fal-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/feishu.md

- Route: /plugins/reference/feishu
- Koppen:
  - H1: Feishu-Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde docs

## plugins/reference/file-transfer.md

- Route: /plugins/reference/file-transfer
- Koppen:
  - H1: File Transfer-Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/firecrawl.md

- Route: /plugins/reference/firecrawl
- Koppen:
  - H1: Firecrawl Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/fireworks.md

- Route: /plugins/reference/fireworks
- Koppen:
  - H1: Fireworks Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/github-copilot.md

- Route: /plugins/reference/github-copilot
- Koppen:
  - H1: GitHub Copilot Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/gmi.md

- Route: /plugins/reference/gmi
- Koppen:
  - H1: Gmi Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/google-meet.md

- Route: /plugins/reference/google-meet
- Koppen:
  - H1: Google Meet Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/google.md

- Route: /plugins/reference/google
- Koppen:
  - H1: Google Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/googlechat.md

- Route: /plugins/reference/googlechat
- Koppen:
  - H1: Google Chat Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/gradium.md

- Route: /plugins/reference/gradium
- Koppen:
  - H1: Gradium Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/groq.md

- Route: /plugins/reference/groq
- Koppen:
  - H1: Groq Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/huggingface.md

- Route: /plugins/reference/huggingface
- Koppen:
  - H1: Hugging Face Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/imessage.md

- Route: /plugins/reference/imessage
- Koppen:
  - H1: iMessage Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/inworld.md

- Route: /plugins/reference/inworld
- Koppen:
  - H1: Inworld Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/irc.md

- Route: /plugins/reference/irc
- Koppen:
  - H1: IRC Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/kilocode.md

- Route: /plugins/reference/kilocode
- Koppen:
  - H1: Kilocode Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/kimi.md

- Route: /plugins/reference/kimi
- Koppen:
  - H1: Kimi Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/line.md

- Route: /plugins/reference/line
- Koppen:
  - H1: LINE Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/litellm.md

- Route: /plugins/reference/litellm
- Koppen:
  - H1: LiteLLM Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/llama-cpp.md

- Route: /plugins/reference/llama-cpp
- Koppen:
  - H1: Llama Cpp Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/llm-task.md

- Route: /plugins/reference/llm-task
- Koppen:
  - H1: LLM Task Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/lmstudio.md

- Route: /plugins/reference/lmstudio
- Koppen:
  - H1: LM Studio Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/lobster.md

- Route: /plugins/reference/lobster
- Koppen:
  - H1: Lobster Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/matrix.md

- Route: /plugins/reference/matrix
- Koppen:
  - H1: Matrix Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/mattermost.md

- Route: /plugins/reference/mattermost
- Koppen:
  - H1: Mattermost Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/memory-core.md

- Route: /plugins/reference/memory-core
- Koppen:
  - H1: Memory Core Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/memory-lancedb.md

- Route: /plugins/reference/memory-lancedb
- Koppen:
  - H1: Memory Lancedb Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/memory-wiki.md

- Route: /plugins/reference/memory-wiki
- Koppen:
  - H1: Memory Wiki Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/microsoft-foundry.md

- Route: /plugins/reference/microsoft-foundry
- Koppen:
  - H1: Microsoft Foundry Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Vereisten
  - H2: Chatmodellen
  - H2: MAI-afbeeldingsgeneratie
  - H2: Probleemoplossing

## plugins/reference/microsoft.md

- Route: /plugins/reference/microsoft
- Koppen:
  - H1: Microsoft Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/migrate-claude.md

- Route: /plugins/reference/migrate-claude
- Koppen:
  - H1: Claude migreren Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/migrate-hermes.md

- Route: /plugins/reference/migrate-hermes
- Koppen:
  - H1: Hermes migreren Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/minimax.md

- Route: /plugins/reference/minimax
- Koppen:
  - H1: MiniMax Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/mistral.md

- Route: /plugins/reference/mistral
- Koppen:
  - H1: Mistral Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/moonshot.md

- Route: /plugins/reference/moonshot
- Koppen:
  - H1: Moonshot Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/msteams.md

- Route: /plugins/reference/msteams
- Koppen:
  - H1: Microsoft Teams Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/nextcloud-talk.md

- Route: /plugins/reference/nextcloud-talk
- Koppen:
  - H1: Nextcloud Talk Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/nostr.md

- Route: /plugins/reference/nostr
- Koppen:
  - H1: Nostr Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/novita.md

- Route: /plugins/reference/novita
- Koppen:
  - H1: Novita Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/nvidia.md

- Route: /plugins/reference/nvidia
- Koppen:
  - H1: NVIDIA Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/oc-path.md

- Route: /plugins/reference/oc-path
- Koppen:
  - H1: Oc Path Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/ollama.md

- Route: /plugins/reference/ollama
- Koppen:
  - H1: Ollama Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/open-prose.md

- Route: /plugins/reference/open-prose
- Koppen:
  - H1: Open Prose Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/openai.md

- Route: /plugins/reference/openai
- Koppen:
  - H1: OpenAI Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/opencode-go.md

- Route: /plugins/reference/opencode-go
- Koppen:
  - H1: OpenCode Go Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/opencode.md

- Route: /plugins/reference/opencode
- Koppen:
  - H1: OpenCode Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/openrouter.md

- Route: /plugins/reference/openrouter
- Koppen:
  - H1: OpenRouter Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/openshell.md

- Route: /plugins/reference/openshell
- Koppen:
  - H1: Openshell Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/perplexity.md

- Route: /plugins/reference/perplexity
- Koppen:
  - H1: Perplexity Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/pixverse.md

- Route: /plugins/reference/pixverse
- Koppen:
  - H1: PixVerse Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/policy.md

- Route: /plugins/reference/policy
- Koppen:
  - H1: Policy Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gedrag
  - H2: Gerelateerde documentatie

## plugins/reference/qa-channel.md

- Route: /plugins/reference/qa-channel
- Koppen:
  - H1: QA Channel Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/qa-lab.md

- Route: /plugins/reference/qa-lab
- Koppen:
  - H1: QA Lab Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/qa-matrix.md

- Route: /plugins/reference/qa-matrix
- Koppen:
  - H1: QA Matrix Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/qianfan.md

- Route: /plugins/reference/qianfan
- Koppen:
  - H1: Qianfan Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/qqbot.md

- Route: /plugins/reference/qqbot
- Koppen:
  - H1: QQ Bot Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/qwen.md

- Route: /plugins/reference/qwen
- Koppen:
  - H1: Qwen Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/raft.md

- Route: /plugins/reference/raft
- Koppen:
  - H1: Raft Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/runway.md

- Route: /plugins/reference/runway
- Koppen:
  - H1: Runway Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/searxng.md

- Route: /plugins/reference/searxng
- Koppen:
  - H1: SearXNG Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/senseaudio.md

- Route: /plugins/reference/senseaudio
- Koppen:
  - H1: Senseaudio Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/sglang.md

- Route: /plugins/reference/sglang
- Koppen:
  - H1: SGLang Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/signal.md

- Route: /plugins/reference/signal
- Koppen:
  - H1: Signal Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/slack.md

- Route: /plugins/reference/slack
- Koppen:
  - H1: Slack Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/sms.md

- Route: /plugins/reference/sms
- Koppen:
  - H1: Sms Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/stepfun.md

- Route: /plugins/reference/stepfun
- Koppen:
  - H1: StepFun Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/synology-chat.md

- Route: /plugins/reference/synology-chat
- Koppen:
  - H1: Synology Chat Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/synthetic.md

- Route: /plugins/reference/synthetic
- Koppen:
  - H1: Synthetic Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/tavily.md

- Route: /plugins/reference/tavily
- Koppen:
  - H1: Tavily Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/telegram.md

- Route: /plugins/reference/telegram
- Koppen:
  - H1: Telegram Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/tencent.md

- Route: /plugins/reference/tencent
- Koppen:
  - H1: Tencent Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/tlon.md

- Route: /plugins/reference/tlon
- Koppen:
  - H1: Tlon Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/together.md

- Route: /plugins/reference/together
- Koppen:
  - H1: Together Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/tokenjuice.md

- Route: /plugins/reference/tokenjuice
- Koppen:
  - H1: Tokenjuice Plugin
  - H2: Distributie
  - H2: Oppervlak
  - H2: Gerelateerde documentatie

## plugins/reference/tts-local-cli.md

- Route: /plugins/reference/tts-local-cli
- Koppen:
  - H1: TTS Local CLI Plugin
  - H2: Distributie
  - H2: Oppervlak

## plugins/reference/twitch.md

- Route: /plugins/reference/twitch
- Koppen:
  - H1: Twitch Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/venice.md

- Route: /plugins/reference/venice
- Koppen:
  - H1: Venice Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/vercel-ai-gateway.md

- Route: /plugins/reference/vercel-ai-gateway
- Koppen:
  - H1: Vercel AI Gateway Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/vllm.md

- Route: /plugins/reference/vllm
- Koppen:
  - H1: vLLM Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/voice-call.md

- Route: /plugins/reference/voice-call
- Koppen:
  - H1: Voice Call Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/volcengine.md

- Route: /plugins/reference/volcengine
- Koppen:
  - H1: Volcengine Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/voyage.md

- Route: /plugins/reference/voyage
- Koppen:
  - H1: Voyage Plugin
  - H2: Distributie
  - H2: Surface

## plugins/reference/vydra.md

- Route: /plugins/reference/vydra
- Koppen:
  - H1: Vydra Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/web-readability.md

- Route: /plugins/reference/web-readability
- Koppen:
  - H1: Web Readability Plugin
  - H2: Distributie
  - H2: Surface

## plugins/reference/webhooks.md

- Route: /plugins/reference/webhooks
- Koppen:
  - H1: Webhooks Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/whatsapp.md

- Route: /plugins/reference/whatsapp
- Koppen:
  - H1: WhatsApp Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/workboard.md

- Route: /plugins/reference/workboard
- Koppen:
  - H1: Workboard Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/xai.md

- Route: /plugins/reference/xai
- Koppen:
  - H1: xAI Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/xiaomi.md

- Route: /plugins/reference/xiaomi
- Koppen:
  - H1: Xiaomi Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/zai.md

- Route: /plugins/reference/zai
- Koppen:
  - H1: Z.AI Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/zalo.md

- Route: /plugins/reference/zalo
- Koppen:
  - H1: Zalo Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/reference/zalouser.md

- Route: /plugins/reference/zalouser
- Koppen:
  - H1: Zalo Personal Plugin
  - H2: Distributie
  - H2: Surface
  - H2: Gerelateerde docs

## plugins/sdk-agent-harness.md

- Route: /plugins/sdk-agent-harness
- Koppen:
  - H2: Wanneer je een harness gebruikt
  - H2: Wat core nog steeds beheert
  - H2: Een harness registreren
  - H2: Selectiebeleid
  - H2: Provider- plus harness-koppeling
  - H3: Middleware voor toolresultaten
  - H3: Classificatie van terminale uitkomst
  - H3: Bijwerkingen aan agenteinde
  - H3: Gebruikersinvoer en toolsurfaces
  - H3: Native Codex-harnessmodus
  - H2: Runtime-striktheid
  - H2: Native sessies en transcriptmirror
  - H2: Tool- en mediaresultaten
  - H2: Huidige beperkingen
  - H2: Gerelateerd

## plugins/sdk-channel-inbound.md

- Route: /plugins/sdk-channel-inbound
- Koppen:
  - H2: Core-helpers
  - H2: Migratie

## plugins/sdk-channel-ingress.md

- Route: /plugins/sdk-channel-ingress
- Koppen:
  - H1: API voor kanaalingang
  - H2: Runtime-resolver
  - H2: Resultaat
  - H2: Toegangsgroepen
  - H2: Gebeurtenismodi
  - H2: Routes en activering
  - H2: Redactie
  - H2: Verificatie

## plugins/sdk-channel-message.md

- Route: /plugins/sdk-channel-message
- Koppen: geen

## plugins/sdk-channel-outbound.md

- Route: /plugins/sdk-channel-outbound
- Koppen:
  - H2: Adapter
  - H2: Bestaande outbound-adapters
  - H2: Duurzame verzendingen
  - H2: Compatibiliteitsdispatch

## plugins/sdk-channel-plugins.md

- Route: /plugins/sdk-channel-plugins
- Koppen:
  - H2: Hoe kanaalplugins werken
  - H2: Goedkeuringen en kanaalcapaciteiten
  - H2: Beleid voor inkomende vermeldingen
  - H2: Walkthrough
  - H2: Bestandsstructuur
  - H2: Geavanceerde onderwerpen
  - H2: Volgende stappen
  - H2: Gerelateerd

## plugins/sdk-channel-turn.md

- Route: /plugins/sdk-channel-turn
- Koppen: geen

## plugins/sdk-entrypoints.md

- Route: /plugins/sdk-entrypoints
- Koppen:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Registratiemodus
  - H2: Pluginvormen
  - H2: Gerelateerd

## plugins/sdk-migration.md

- Route: /plugins/sdk-migration
- Koppen:
  - H2: Wat er verandert
  - H2: Waarom dit is gewijzigd
  - H2: Migratieplan voor praten en realtime spraak
  - H2: Compatibiliteitsbeleid
  - H2: Migreren
  - H2: Referentie voor importpaden
  - H2: Actieve deprecaties
  - H2: Tijdlijn voor verwijdering
  - H2: De waarschuwingen tijdelijk onderdrukken
  - H2: Gerelateerd

## plugins/sdk-overview.md

- Route: /plugins/sdk-overview
- Koppen:
  - H2: Importconventie
  - H2: Referentie voor subpaden
  - H2: Registratie-API
  - H3: Capaciteitsregistratie
  - H3: Tools en opdrachten
  - H3: Infrastructuur
  - H3: Host-hooks voor workflowplugins
  - H3: Registratie voor Gateway-discovery
  - H3: CLI-registratiemetadata
  - H3: CLI-backendregistratie
  - H3: Exclusieve slots
  - H3: Verouderde adapters voor geheugenembeddings
  - H3: Gebeurtenissen en lifecycle
  - H3: Beslissingssemantiek van hooks
  - H3: Velden van API-object
  - H2: Conventie voor interne modules
  - H2: Gerelateerd

## plugins/sdk-provider-plugins.md

- Route: /plugins/sdk-provider-plugins
- Koppen:
  - H2: Walkthrough
  - H2: Publiceren naar ClawHub
  - H2: Bestandsstructuur
  - H2: Referentie voor catalogusvolgorde
  - H2: Volgende stappen
  - H2: Gerelateerd

## plugins/sdk-runtime.md

- Route: /plugins/sdk-runtime
- Koppen:
  - H2: Config laden en wegschrijven
  - H2: Herbruikbare runtimehulpprogramma's
  - H2: Runtime-namespaces
  - H2: Runtimeverwijzingen opslaan
  - H2: Andere API-velden op topniveau
  - H2: Gerelateerd

## plugins/sdk-setup.md

- Route: /plugins/sdk-setup
- Koppen:
  - H2: Pakketmetadata
  - H3: openclaw-velden
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Uitgestelde volledige load
  - H2: Pluginmanifest
  - H2: Publiceren naar ClawHub
  - H2: Setup-entry
  - H3: Smalle imports voor setuphelpers
  - H3: Door kanaal beheerde promotie van één account
  - H2: Configschema
  - H3: Configschema's voor kanalen bouwen
  - H2: Setupwizards
  - H2: Publiceren en installeren
  - H2: Gerelateerd

## plugins/sdk-subpaths.md

- Route: /plugins/sdk-subpaths
- Koppen:
  - H2: Plugin-entry
  - H3: Verouderde compatibiliteits- en testhelpers
  - H3: Gereserveerde subpaden voor gebundelde Plugin-helpers
  - H2: Gerelateerd

## plugins/sdk-testing.md

- Route: /plugins/sdk-testing
- Koppen:
  - H2: Testhulpprogramma's
  - H3: Beschikbare exports
  - H3: Types
  - H2: Doelresolutie testen
  - H2: Testpatronen
  - H3: Registratiecontracten testen
  - H3: Runtimeconfiguratie-toegang testen
  - H3: Een kanaalplugin unittesten
  - H3: Een providerplugin unittesten
  - H3: De pluginruntime mocken
  - H3: Testen met stubs per instantie
  - H2: Contracttests (in-repo plugins)
  - H3: Scoped tests uitvoeren
  - H2: Lint-afdwinging (in-repo plugins)
  - H2: Testconfiguratie
  - H2: Gerelateerd

## plugins/tool-plugins.md

- Route: /plugins/tool-plugins
- Koppen:
  - H2: Vereisten
  - H2: Quickstart
  - H2: Een tool schrijven
  - H2: Optionele tools en factorytools
  - H2: Retourwaarden
  - H2: Configuratie
  - H2: Gegenereerde metadata
  - H2: Pakketmetadata
  - H2: Valideren in CI
  - H2: Lokaal installeren en inspecteren
  - H2: Publiceren
  - H2: Probleemoplossing
  - H3: plugin entry niet gevonden: ./dist/index.js
  - H3: plugin entry stelt geen defineToolPlugin-metadata beschikbaar
  - H3: gegenereerde metadata in openclaw.plugin.json is verouderd
  - H3: package.json openclaw.extensions moet ./dist/index.js bevatten
  - H3: Kan pakket 'typebox' niet vinden
  - H3: Tool verschijnt niet na installatie
  - H2: Zie ook

## plugins/voice-call.md

- Route: /plugins/voice-call
- Koppen:
  - H2: Snel starten
  - H2: Configuratie
  - H2: Sessiescope
  - H2: Realtime spraakgesprekken
  - H3: Toolbeleid
  - H3: Spraakcontext van agent
  - H3: Voorbeelden van realtime providers
  - H2: Streamingtranscriptie
  - H3: Voorbeelden van streamingproviders
  - H2: TTS voor gesprekken
  - H3: TTS-voorbeelden
  - H2: Inkomende gesprekken
  - H3: Routing per nummer
  - H3: Contract voor gesproken output
  - H3: Opstartgedrag van gesprek
  - H3: Graceperiode voor loskoppelen van Twilio-stream
  - H2: Reaper voor verlopen gesprekken
  - H2: Webhook-beveiliging
  - H2: CLI
  - H2: Agenttool
  - H2: Gateway-RPC
  - H2: Probleemoplossing
  - H3: Setup faalt door Webhook-blootstelling
  - H3: Providerreferenties falen
  - H3: Gesprekken starten maar providerwebhooks komen niet aan
  - H3: Handtekeningverificatie mislukt
  - H3: Google Meet Twilio-deelnames mislukken
  - H3: Realtime gesprek heeft geen spraak
  - H2: Gerelateerd

## plugins/webhooks.md

- Route: /plugins/webhooks
- Koppen:
  - H2: Waar het draait
  - H2: Routes configureren
  - H2: Beveiligingsmodel
  - H2: Requestindeling
  - H2: Ondersteunde acties
  - H3: createflow
  - H3: runtask
  - H2: Responsvorm
  - H2: Gerelateerde docs

## plugins/workboard.md

- Route: /plugins/workboard
- Koppen:
  - H2: Standaardstatus
  - H2: Wat kaarten bevatten
  - H2: Kaartuitvoeringen en taken
  - H2: Agentcoördinatie
  - H3: Selectie van dispatchworker
  - H3: Workerprompt en lifecycle
  - H3: Dispatch-entrypoints
  - H2: CLI en slashopdracht
  - H2: Synchronisatie van sessielifecycle
  - H2: Dashboardworkflow
  - H2: Machtigingen
  - H2: Configuratie
  - H2: Probleemoplossing
  - H3: Het tabblad zegt dat Workboard niet beschikbaar is
  - H3: Kaarten worden niet opgeslagen
  - H3: Een kaart starten opent niet de verwachte sessie
  - H3: Dispatch start geen worker
  - H2: Gerelateerd

## plugins/zalouser.md

- Route: /plugins/zalouser
- Koppen:
  - H2: Naamgeving
  - H2: Waar het draait
  - H2: Installeren
  - H3: Optie A: installeren vanaf npm
  - H3: Optie B: installeren vanuit een lokale map (dev)
  - H2: Config
  - H2: CLI
  - H2: Agenttool
  - H2: Gerelateerd

## prose.md

- Route: /prose
- Koppen:
  - H2: Installeren
  - H2: Slashopdracht
  - H2: Wat het kan doen
  - H2: Voorbeeld: parallel onderzoek en synthese
  - H2: OpenClaw-runtimetoewijzing
  - H2: Bestandslocaties
  - H2: State-backends
  - H2: Beveiliging
  - H2: Gerelateerd

## providers/alibaba.md

- Route: /providers/alibaba
- Koppen:
  - H2: Aan de slag
  - H2: Ingebouwde Wan-modellen
  - H2: Capaciteiten en limieten
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/anthropic.md

- Route: /providers/anthropic
- Koppen:
  - H2: Thinking-standaardinstellingen (Claude Fable 5, 4.8 en 4.6)
  - H2: Fallback voor veiligheidsweigering (Claude Fable 5)
  - H3: Waarom dit bestaat
  - H3: Hoe het werkt
  - H3: Observability en facturering
  - H3: Scope
  - H2: Promptcaching
  - H2: Geavanceerde configuratie
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/arcee.md

- Route: /providers/arcee
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Niet-interactieve setup
  - H2: Ingebouwde catalogus
  - H2: Ondersteunde functies
  - H2: Gerelateerd

## providers/azure-speech.md

- Route: /providers/azure-speech
- Koppen:
  - H2: Aan de slag
  - H2: Configuratieopties
  - H2: Opmerkingen
  - H2: Gerelateerd

## providers/bedrock-mantle.md

- Route: /providers/bedrock-mantle
- Koppen:
  - H2: Aan de slag
  - H2: Automatische modeldiscovery
  - H3: Ondersteunde regio's
  - H2: Handmatige configuratie
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/bedrock.md

- Route: /providers/bedrock
- Koppen:
  - H2: Aan de slag
  - H2: Automatische modeldiscovery
  - H2: Snelle setup (AWS-pad)
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/cerebras.md

- Route: /providers/cerebras
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Niet-interactieve setup
  - H2: Ingebouwde catalogus
  - H2: Handmatige config
  - H2: Gerelateerd

## providers/chutes.md

- Route: /providers/chutes
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Discovery-gedrag
  - H2: Standaardaliassen
  - H2: Ingebouwde startercatalogus
  - H2: Configuratievoorbeeld
  - H2: Gerelateerd

## providers/claude-max-api-proxy.md

- Route: /providers/claude-max-api-proxy
- Koppen:
  - H2: Waarom dit gebruiken?
  - H2: Hoe het werkt
  - H2: Aan de slag
  - H2: Ingebouwde catalogus
  - H2: Geavanceerde configuratie
  - H2: Opmerkingen
  - H2: Gerelateerd

## providers/clawrouter.md

- Route: /providers/clawrouter
- Koppen:
  - H2: Aan de slag
  - H2: Modeldetectie
  - H2: Protocol- en providerplugins
  - H2: Quota en gebruik
  - H2: Probleemoplossing
  - H2: Beveiligingsgedrag
  - H2: Gerelateerd

## providers/cloudflare-ai-gateway.md

- Route: /providers/cloudflare-ai-gateway
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Niet-interactief voorbeeld
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/cohere.md

- Route: /providers/cohere
- Koppen:
  - H2: Aan de slag
  - H2: Alleen-omgeving-installatie
  - H2: Gerelateerd

## providers/comfy.md

- Route: /providers/comfy
- Koppen:
  - H2: Wat het ondersteunt
  - H2: Aan de slag
  - H2: Configuratie
  - H3: Gedeelde sleutels
  - H3: Sleutels per capability
  - H2: Workflowdetails
  - H2: Gerelateerd

## providers/deepgram.md

- Route: /providers/deepgram
- Koppen:
  - H2: Aan de slag
  - H2: Configuratieopties
  - H2: Streaming STT voor Voice Call
  - H2: Opmerkingen
  - H2: Gerelateerd

## providers/deepinfra.md

- Route: /providers/deepinfra
- Koppen:
  - H2: Plugin installeren
  - H2: Een API-sleutel krijgen
  - H2: CLI-installatie
  - H2: Configuratiefragment
  - H2: Ondersteunde OpenClaw-oppervlakken
  - H2: Beschikbare modellen
  - H2: Opmerkingen
  - H2: Gerelateerd

## providers/deepseek.md

- Route: /providers/deepseek
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Ingebouwde catalogus
  - H2: Denken en tools
  - H2: Live testen
  - H2: Configuratievoorbeeld
  - H2: Gerelateerd

## providers/ds4.md

- Route: /providers/ds4
- Koppen:
  - H2: Vereisten
  - H2: Snelstart
  - H2: Volledige configuratie
  - H2: Opstarten op aanvraag
  - H2: Think Max
  - H2: Testen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/elevenlabs.md

- Route: /providers/elevenlabs
- Koppen:
  - H2: Authenticatie
  - H2: Tekst-naar-spraak
  - H2: Spraak-naar-tekst
  - H2: Streaming STT
  - H2: Gerelateerd

## providers/fal.md

- Route: /providers/fal
- Koppen:
  - H2: Aan de slag
  - H2: Afbeeldingen genereren
  - H2: Video's genereren
  - H2: Muziek genereren
  - H2: Gerelateerd

## providers/fireworks.md

- Route: /providers/fireworks
- Koppen:
  - H2: Aan de slag
  - H2: Niet-interactieve installatie
  - H2: Ingebouwde catalogus
  - H2: Aangepaste Fireworks-model-id's
  - H2: Gerelateerd

## providers/github-copilot.md

- Route: /providers/github-copilot
- Koppen:
  - H2: Drie manieren om Copilot in OpenClaw te gebruiken
  - H2: Optionele flags
  - H2: Niet-interactieve onboarding
  - H2: Embeddings voor geheugenzoekopdrachten
  - H3: Configuratie
  - H3: Hoe het werkt
  - H2: Gerelateerd

## providers/gmi.md

- Route: /providers/gmi
- Koppen:
  - H2: Installatie
  - H2: Standaardinstellingen
  - H2: Wanneer GMI kiezen
  - H2: Modellen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/google.md

- Route: /providers/google
- Koppen:
  - H2: Aan de slag
  - H2: Capabilities
  - H2: Webzoekfunctie
  - H2: Afbeeldingen genereren
  - H2: Video's genereren
  - H2: Muziek genereren
  - H2: Tekst-naar-spraak
  - H2: Realtime spraak
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/gradium.md

- Route: /providers/gradium
- Koppen:
  - H2: Plugin installeren
  - H2: Installatie
  - H2: Configuratie
  - H2: Stemmen
  - H3: Stemoverschrijving per bericht
  - H2: Uitvoer
  - H2: Volgorde voor automatische selectie
  - H2: Gerelateerd

## providers/groq.md

- Route: /providers/groq
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H3: Voorbeeld van configuratiebestand
  - H2: Ingebouwde catalogus
  - H2: Redeneermodellen
  - H2: Audiotranscriptie
  - H2: Gerelateerd

## providers/huggingface.md

- Route: /providers/huggingface
- Koppen:
  - H2: Aan de slag
  - H3: Niet-interactieve installatie
  - H2: Model-id's
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/index.md

- Route: /providers
- Koppen:
  - H2: Snelstart
  - H2: Providerdocumentatie
  - H2: Gedeelde overzichtspagina's
  - H2: Transcriptieproviders
  - H2: Communitytools

## providers/inferrs.md

- Route: /providers/inferrs
- Koppen:
  - H2: Aan de slag
  - H2: Voorbeeld van volledige configuratie
  - H2: Opstarten op aanvraag
  - H2: Geavanceerde configuratie
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/inworld.md

- Route: /providers/inworld
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Configuratieopties
  - H2: Opmerkingen
  - H2: Gerelateerd

## providers/kilocode.md

- Route: /providers/kilocode
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Standaardmodel
  - H2: Ingebouwde catalogus
  - H2: Configuratievoorbeeld
  - H2: Gerelateerd

## providers/litellm.md

- Route: /providers/litellm
- Koppen:
  - H2: Snelstart
  - H2: Configuratie
  - H3: Omgevingsvariabelen
  - H3: Configuratiebestand
  - H2: Geavanceerde configuratie
  - H3: Afbeeldingen genereren
  - H2: Gerelateerd

## providers/lmstudio.md

- Route: /providers/lmstudio
- Koppen:
  - H2: Snelstart
  - H2: Niet-interactieve onboarding
  - H2: Configuratie
  - H3: Compatibiliteit met streaming gebruik
  - H3: Compatibiliteit met denken
  - H3: Expliciete configuratie
  - H2: Probleemoplossing
  - H3: LM Studio niet gedetecteerd
  - H3: Authenticatiefouten (HTTP 401)
  - H3: Just-in-time laden van modellen
  - H3: LAN- of tailnet-LM Studio-host
  - H2: Gerelateerd

## providers/minimax.md

- Route: /providers/minimax
- Koppen:
  - H2: Ingebouwde catalogus
  - H2: Aan de slag
  - H2: Configureren via openclaw configure
  - H2: Capabilities
  - H3: Afbeeldingen genereren
  - H3: Tekst-naar-spraak
  - H3: Muziek genereren
  - H3: Video's genereren
  - H3: Afbeeldingsbegrip
  - H3: Webzoekfunctie
  - H2: Geavanceerde configuratie
  - H2: Opmerkingen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/mistral.md

- Route: /providers/mistral
- Koppen:
  - H2: Aan de slag
  - H2: Ingebouwde LLM-catalogus
  - H2: Audiotranscriptie (Voxtral)
  - H2: Streaming STT voor Voice Call
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/models.md

- Route: /providers/models
- Koppen:
  - H2: Snelstart (twee stappen)
  - H2: Ondersteunde providers (startset)
  - H2: Aanvullende providervarianten
  - H2: Gerelateerd

## providers/moonshot.md

- Route: /providers/moonshot
- Koppen:
  - H2: Ingebouwde modelcatalogus
  - H2: Aan de slag
  - H2: Kimi-webzoekfunctie
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/novita.md

- Route: /providers/novita
- Koppen:
  - H2: Installatie
  - H2: Standaardinstellingen
  - H2: Wanneer Novita kiezen
  - H2: Modellen
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/nvidia.md

- Route: /providers/nvidia
- Koppen:
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Uitgelichte catalogus
  - H2: Nemotron 3 Ultra
  - H2: Gebundelde fallbackcatalogus
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/ollama-cloud.md

- Route: /providers/ollama-cloud
- Koppen:
  - H2: Installatie
  - H2: Standaardinstellingen
  - H2: Wanneer Ollama Cloud kiezen
  - H2: Modellen
  - H2: Live test
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/ollama.md

- Route: /providers/ollama
- Koppen:
  - H2: Auth-regels
  - H2: Aan de slag
  - H2: Cloudmodellen
  - H2: Modeldetectie (impliciete provider)
  - H2: Node-lokale inferentie
  - H2: Visie en afbeeldingsbeschrijving
  - H2: Configuratie
  - H2: Veelgebruikte recepten
  - H3: Modelselectie
  - H3: Snelle verificatie
  - H2: Ollama Web Search
  - H2: Geavanceerde configuratie
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/openai.md

- Route: /providers/openai
- Koppen:
  - H2: Snelle keuze
  - H2: Naamgevingsschema
  - H2: GPT-5.6 beperkte preview
  - H2: Dekking van OpenClaw-functies
  - H2: Geheugenembeddings
  - H2: Aan de slag
  - H2: Native Codex-appserverauthenticatie
  - H2: Afbeeldingen genereren
  - H2: Video's genereren
  - H2: GPT-5-promptbijdrage
  - H2: Stem en spraak
  - H2: Azure OpenAI-eindpunten
  - H3: Configuratie
  - H3: API-versie
  - H3: Modelnamen zijn implementatienamen
  - H3: Regionale beschikbaarheid
  - H3: Parameterverschillen
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/opencode-go.md

- Route: /providers/opencode-go
- Koppen:
  - H2: Ingebouwde catalogus
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/opencode.md

- Route: /providers/opencode
- Koppen:
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Ingebouwde catalogi
  - H3: Zen
  - H3: Go
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/openrouter.md

- Route: /providers/openrouter
- Koppen:
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Modelverwijzingen
  - H2: Afbeeldingen genereren
  - H2: Video's genereren
  - H2: Muziek genereren
  - H2: Tekst-naar-spraak
  - H2: Spraak-naar-tekst (inkomende audio)
  - H2: Fusion-router
  - H2: Authenticatie en headers
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/perplexity-provider.md

- Route: /providers/perplexity-provider
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Zoekmodi
  - H2: Native API-filtering
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/pixverse.md

- Route: /providers/pixverse
- Koppen:
  - H2: Aan de slag
  - H2: Ondersteunde modi en modellen
  - H2: Provideropties
  - H2: Configuratie
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/qianfan.md

- Route: /providers/qianfan
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Ingebouwde catalogus
  - H2: Configuratievoorbeeld
  - H2: Gerelateerd

## providers/qwen-oauth.md

- Route: /providers/qwen-oauth
- Koppen:
  - H2: Installatie
  - H2: Standaardinstellingen
  - H2: Hoe dit verschilt van Qwen
  - H2: Wanneer Qwen OAuth / Portal kiezen
  - H2: Modellen
  - H2: Migratie
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/qwen.md

- Route: /providers/qwen
- Koppen:
  - H2: Plugin installeren
  - H2: Aan de slag
  - H2: Abonnementstypen en eindpunten
  - H2: Ingebouwde catalogus
  - H2: Thinking Controls
  - H2: Multimodale add-ons
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/runway.md

- Route: /providers/runway
- Koppen:
  - H2: Aan de slag
  - H2: Ondersteunde modi en modellen
  - H2: Configuratie
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/senseaudio.md

- Route: /providers/senseaudio
- Koppen:
  - H2: Aan de slag
  - H2: Opties
  - H2: Gerelateerd

## providers/sglang.md

- Route: /providers/sglang
- Koppen:
  - H2: Aan de slag
  - H2: Modeldetectie (impliciete provider)
  - H2: Expliciete configuratie (handmatige modellen)
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/stepfun.md

- Route: /providers/stepfun
- Koppen:
  - H2: Plugin installeren
  - H2: Overzicht van regio en eindpunt
  - H2: Ingebouwde catalogus
  - H2: Aan de slag
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/synthetic.md

- Route: /providers/synthetic
- Koppen:
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Ingebouwde catalogus
  - H2: Gerelateerd

## providers/tencent.md

- Route: /providers/tencent
- Koppen:
  - H2: Snelstart
  - H2: Niet-interactieve installatie
  - H2: Ingebouwde catalogus
  - H2: Gelaagde prijzen
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/together.md

- Route: /providers/together
- Koppen:
  - H2: Aan de slag
  - H3: Niet-interactief voorbeeld
  - H2: Ingebouwde catalogus
  - H2: Video's genereren
  - H2: Gerelateerd

## providers/venice.md

- Route: /providers/venice
- Koppen:
  - H2: Waarom Venice in OpenClaw
  - H2: Privacymodi
  - H2: Functies
  - H2: Aan de slag
  - H2: Modelselectie
  - H2: DeepSeek V4-replaygedrag
  - H2: Ingebouwde catalogus (41 totaal)
  - H2: Modeldetectie
  - H2: Streaming- en toolondersteuning
  - H2: Prijzen
  - H3: Venice (geanonimiseerd) versus directe API
  - H2: Gebruiksvoorbeelden
  - H2: Probleemoplossing
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/vercel-ai-gateway.md

- Route: /providers/vercel-ai-gateway
- Kopteksten:
  - H2: Aan de slag
  - H2: Niet-interactief voorbeeld
  - H2: Afkorting voor model-ID
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/vllm.md

- Route: /providers/vllm
- Kopteksten:
  - H2: Aan de slag
  - H2: Modeldetectie (impliciete provider)
  - H2: Expliciete configuratie (handmatige modellen)
  - H2: Geavanceerde configuratie
  - H2: Probleemoplossing
  - H2: Gerelateerd

## providers/volcengine.md

- Route: /providers/volcengine
- Kopteksten:
  - H2: Aan de slag
  - H2: Providers en eindpunten
  - H2: Ingebouwde catalogus
  - H2: Tekst-naar-spraak
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## providers/vydra.md

- Route: /providers/vydra
- Kopteksten:
  - H2: Instellen
  - H2: Mogelijkheden
  - H2: Gerelateerd

## providers/xai.md

- Route: /providers/xai
- Kopteksten:
  - H2: Kies je instelpad
  - H2: OAuth-probleemoplossing
  - H2: Ingebouwde catalogus
  - H2: OpenClaw-functiedekking
  - H3: Fast-mode-toewijzingen
  - H3: Verouderde compatibiliteitsaliassen
  - H2: Functies
  - H2: Live testen
  - H2: Gerelateerd

## providers/xiaomi.md

- Route: /providers/xiaomi
- Kopteksten:
  - H2: Aan de slag
  - H2: Catalogus voor betalen naar gebruik
  - H2: Catalogus voor Token Plan
  - H2: Tekst-naar-spraak
  - H2: Configuratievoorbeeld
  - H2: Gerelateerd

## providers/zai.md

- Route: /providers/zai
- Kopteksten:
  - H2: GLM-modellen
  - H2: Aan de slag
  - H2: Configuratievoorbeeld
  - H2: Ingebouwde catalogus
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## refactor/access.md

- Route: /refactor/access
- Kopteksten: geen

## refactor/acp.md

- Route: /refactor/acp
- Kopteksten:
  - H2: Doelen
  - H2: Niet-doelen
  - H2: Doelmodel
  - H3: Gateway-instantie-identiteit
  - H3: Eigenaarschap van ACP-sessies
  - H3: ACPX-procesleases
  - H2: Lifecycle-controller
  - H2: Wrappercontract
  - H2: Contract voor sessiezichtbaarheid
  - H2: Migratieplan
  - H3: Fase 1: Identiteit en leases toevoegen
  - H3: Fase 2: Lease-first opschoning
  - H3: Fase 3: Lease-first opschoning bij opstarten
  - H3: Fase 4: Rijen voor sessie-eigenaarschap
  - H3: Fase 5: Verouderde heuristieken verwijderen
  - H2: Tests
  - H2: Compatibiliteitsnotities
  - H2: Succescriteria

## refactor/canvas.md

- Route: /refactor/canvas
- Kopteksten:
  - H1: Refactor van de Canvas-Plugin
  - H2: Doel
  - H2: Niet-doelen
  - H2: Huidige branchstatus
  - H2: Doelvorm
  - H2: Migratiestappen
  - H2: Auditchecklist
  - H2: Verificatieopdrachten

## refactor/database-first.md

- Route: /refactor/database-first
- Kopteksten:
  - H1: Database-first statusrefactor
  - H2: Besluit
  - H2: Hard contract
  - H2: Doelstatus en voortgang
  - H3: Hard doel
  - H3: Doelstatussen
  - H3: Huidige status
  - H3: Resterend werk
  - H3: Niet laten terugvallen
  - H2: Aannames op basis van codelezing
  - H2: Bevindingen uit codelezing
  - H2: Huidige codevorm
  - H2: Doelvorm van schema
  - H2: Vorm van doctor-migratie
  - H2: Migratie-inventaris
  - H2: Migratieplan
  - H3: Fase 0: De grens bevriezen
  - H3: Fase 1: Het globale control plane afronden
  - H3: Fase 2: Databases per agent introduceren
  - H3: Fase 3: API's voor sessieopslag vervangen
  - H3: Fase 4: Transcripties, ACP-streams, trajecten en VFS verplaatsen
  - H3: Fase 5: Back-up, herstel, vacuum en verificatie
  - H3: Fase 6: Worker-runtime
  - H3: Fase 7: De oude wereld verwijderen
  - H2: Back-up en herstel
  - H2: Runtime-refactorplan
  - H2: Prestatieregels
  - H2: Statische verboden
  - H2: Gereedheidscriteria

## refactor/ingress-core.md

- Route: /refactor/ingress-core
- Kopteksten:
  - H1: Verwijderingsplan voor ingress-core
  - H2: Budget
  - H2: Diagnose
  - H2: Hotspots
  - H2: Huidige codelezing
  - H2: Grens
  - H2: Acceptatieregel
  - H2: Werkpakketten
  - H2: Verwijderingsgolven
  - H2: Niet verplaatsen
  - H2: Verificatie
  - H2: Exitcriteria

## reference/AGENTS.default.md

- Route: /reference/AGENTS.default
- Kopteksten:
  - H2: Eerste uitvoering (aanbevolen)
  - H2: Veiligheidsstandaarden
  - H2: Preflight voor bestaande oplossingen
  - H2: Sessiestart (vereist)
  - H2: Ziel (vereist)
  - H2: Gedeelde ruimtes (aanbevolen)
  - H2: Geheugensysteem (aanbevolen)
  - H2: Tools en Skills
  - H2: Back-uptip (aanbevolen)
  - H2: Wat OpenClaw doet
  - H2: Kern-Skills (inschakelen in Instellingen → Skills)
  - H2: Gebruiksnotities
  - H2: Gerelateerd

## reference/RELEASING.md

- Route: /reference/RELEASING
- Kopteksten:
  - H2: Versienaamgeving
  - H2: Releasecadans
  - H2: Checklist voor release-operator
  - H2: Afronding van stabiele main
  - H2: Releasepreflight
  - H2: Releasetestboxen
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Pakket
  - H2: Automatisering voor releasepublicatie
  - H2: Invoer voor NPM-workflow
  - H2: Stabiele npm-releasevolgorde
  - H2: Publieke verwijzingen
  - H2: Gerelateerd

## reference/api-usage-costs.md

- Route: /reference/api-usage-costs
- Kopteksten:
  - H2: Waar kosten verschijnen (chat + CLI)
  - H2: Hoe sleutels worden gevonden
  - H2: Functies die sleutels kunnen verbruiken
  - H3: 1) Kernmodelreacties (chat + tools)
  - H3: 2) Mediabegrip (audio/afbeelding/video)
  - H3: 3) Afbeeldings- en videogeneratie
  - H3: 4) Geheugen-embeddings + semantisch zoeken
  - H3: 5) Webzoektool
  - H3: 5) Webfetchtool (Firecrawl)
  - H3: 6) Snapshots van providergebruik (status/gezondheid)
  - H3: 7) Samenvatting als Compaction-beveiliging
  - H3: 8) Modelscan / probe
  - H3: 9) Praten (spraak)
  - H3: 10) Skills (API's van derden)
  - H2: Gerelateerd

## reference/application-modernization-plan.md

- Route: /reference/application-modernization-plan
- Kopteksten:
  - H2: Doel
  - H2: Principes
  - H2: Fase 1: Baseline-audit
  - H2: Fase 2: Product- en UX-opschoning
  - H2: Fase 3: Frontendarchitectuur aanscherpen
  - H2: Fase 4: Prestaties en betrouwbaarheid
  - H2: Fase 5: Type-, contract- en testverharding
  - H2: Fase 6: Documentatie en releasegereedheid
  - H2: Aanbevolen eerste deel
  - H2: Frontend-Skill-update

## reference/code-mode.md

- Route: /reference/code-mode
- Kopteksten:
  - H2: Wat is dit?
  - H2: Waarom is dit goed?
  - H2: Hoe je het inschakelt
  - H2: Technische rondleiding
  - H2: Runtimestatus
  - H2: Scope
  - H2: Termen
  - H2: Configuratie
  - H2: Activatie
  - H2: Modelzichtbare tools
  - H2: exec
  - H2: wait
  - H2: Gast-runtime-API
  - H2: Interne namespaces
  - H3: Registry-lifecycle
  - H3: Registratievorm
  - H3: Eigenaarschap en zichtbaarheid
  - H3: Serialisatieregels voor scope
  - H3: Prompts
  - H3: Opschoning
  - H3: Testchecklist
  - H2: Output-API
  - H2: Toolcatalogus
  - H2: Tool Search-interactie
  - H2: Toolnamen en botsingen
  - H2: Geneste tooluitvoering
  - H2: Runtimestatus
  - H2: QuickJS-WASI-runtime
  - H2: TypeScript
  - H2: Beveiligingsgrens
  - H2: Foutcodes
  - H2: Telemetrie
  - H2: Debuggen
  - H2: Implementatie-indeling
  - H2: Validatiechecklist
  - H2: E2E-testplan
  - H2: Gerelateerd

## reference/credits.md

- Route: /reference/credits
- Kopteksten:
  - H2: De naam
  - H2: Credits
  - H2: Kernbijdragers
  - H2: Licentie
  - H2: Gerelateerd

## reference/device-models.md

- Route: /reference/device-models
- Kopteksten:
  - H2: Gegevensbron
  - H2: De database bijwerken
  - H2: Gerelateerd

## reference/full-release-validation.md

- Route: /reference/full-release-validation
- Kopteksten:
  - H2: Hoofdfasen
  - H2: Fasen voor releasecontroles
  - H2: Docker-releasepadsegmenten
  - H2: Releaseprofielen
  - H2: Toevoegingen alleen voor volledig
  - H2: Gerichte herhalingen
  - H2: Bewijs om te bewaren
  - H2: Workflowbestanden

## reference/memory-config.md

- Route: /reference/memory-config
- Kopteksten:
  - H2: Providerselectie
  - H3: Aangepaste provider-id's
  - H3: Resolutie van API-sleutels
  - H2: Configuratie van extern eindpunt
  - H2: Providerspecifieke configuratie
  - H3: Timeout voor inline embedding
  - H2: Configuratie van hybride zoeken
  - H3: Volledig voorbeeld
  - H2: Aanvullende geheugenpaden
  - H2: Multimodaal geheugen (Gemini)
  - H2: Embeddingcache
  - H2: Batchindexering
  - H2: Zoeken in sessiegeheugen (experimenteel)
  - H2: SQLite-vectorversnelling (sqlite-vec)
  - H2: Indexopslag
  - H2: QMD-backendconfiguratie
  - H3: Volledig QMD-voorbeeld
  - H2: Dreaming
  - H3: Gebruikersinstellingen
  - H3: Voorbeeld
  - H2: Gerelateerd

## reference/prompt-caching.md

- Route: /reference/prompt-caching
- Kopteksten:
  - H2: Primaire knoppen
  - H3: cacheRetention (globale standaard, model en per agent)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat warm houden
  - H2: Providergedrag
  - H3: Anthropic (directe API)
  - H3: OpenAI (directe API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter-modellen
  - H3: Andere providers
  - H3: Google Gemini directe API
  - H3: Gemini CLI-gebruik
  - H2: Cachegrens voor systeemprompt
  - H2: OpenClaw-bewakers voor cachestabiliteit
  - H2: Afstemmingspatronen
  - H3: Gemengd verkeer (aanbevolen standaard)
  - H3: Kosten-eerst-baseline
  - H2: Cachediagnostiek
  - H2: Live regressietests
  - H3: Live verwachtingen voor Anthropic
  - H3: Live verwachtingen voor OpenAI
  - H3: diagnostics.cacheTrace-configuratie
  - H3: Env-schakelaars (eenmalig debuggen)
  - H3: Wat te inspecteren
  - H2: Snelle probleemoplossing
  - H2: Gerelateerd

## reference/release-performance-sweep.md

- Route: /reference/release-performance-sweep
- Kopteksten:
  - H2: Snapshot
  - H2: Tijdlijn van installatievoetafdruk
  - H2: Wat veranderde in 5.28
  - H2: Kopcijfers
  - H3: Installatievoetafdruk
  - H3: npm-pakketgrootte
  - H2: Samenvatting van Kova-agentbeurt
  - H2: Bronprobes
  - H2: Audit van installatievoetafdruk
  - H3: Shrinkwrap-grens
  - H2: Interpretatie van toeleveringsketen

## reference/rich-output-protocol.md

- Route: /reference/rich-output-protocol
- Kopteksten:
  - H2: [embed ...]
  - H2: Opgeslagen renderingvorm
  - H2: Gerelateerd

## reference/rpc.md

- Route: /reference/rpc
- Kopteksten:
  - H2: Patroon A: HTTP-daemon (signal-cli)
  - H2: Patroon B: stdio-childproces (imsg)
  - H2: Adapterrichtlijnen
  - H2: Gerelateerd

## reference/secret-placeholder-conventions.md

- Route: /reference/secret-placeholder-conventions
- Kopteksten:
  - H1: Conventies voor geheime placeholders
  - H2: Aanbevolen stijl
  - H2: Vermijd deze patronen in docs
  - H2: Voorbeeld

## reference/secretref-credential-surface.md

- Route: /reference/secretref-credential-surface
- Kopteksten:
  - H2: Ondersteunde referenties
  - H3: openclaw.json-doelen (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json-doelen (secrets configure + secrets apply + secrets audit)
  - H2: Niet-ondersteunde referenties
  - H2: Gerelateerd

## reference/session-management-compaction.md

- Route: /reference/session-management-compaction
- Kopteksten:
  - H2: Bron van waarheid: de Gateway
  - H2: Twee persistentielagen
  - H2: Locaties op schijf
  - H2: Store-onderhoud en schijfcontroles
  - H2: Cron-sessies en uitvoeringslogs
  - H2: Sessiesleutels (sessionKey)
  - H2: Sessie-id's (sessionId)
  - H2: Schema voor sessiestore (sessions.json)
  - H2: Transcriptiestructuur (.jsonl)
  - H2: Contextvensters versus bijgehouden tokens
  - H2: Compaction: wat het is
  - H2: Compaction-chunkgrenzen en toolkoppeling
  - H2: Wanneer automatische Compaction gebeurt (OpenClaw-runtime)
  - H2: Compaction-instellingen (reserveTokens, keepRecentTokens)
  - H2: Inplugbare Compaction-providers
  - H2: Gebruikerszichtbare oppervlakken
  - H2: Stil huishoudelijk onderhoud (NOREPLY)
  - H2: Pre-Compaction "memory flush" (geïmplementeerd)
  - H2: Checklist voor probleemoplossing
  - H2: Gerelateerd

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- Kopteksten:
  - H1: AGENTS.md - OpenClaw-werkruimte
  - H2: Eerste uitvoering (eenmalig)
  - H2: Back-uptip (aanbevolen)
  - H2: Veiligheidsstandaarden
  - H2: Preflight voor bestaande oplossingen
  - H2: Dagelijks geheugen (aanbevolen)
  - H2: Heartbeats (optioneel)
  - H2: Aanpassen
  - H2: C-3PO Origin Memory
  - H3: Geboortedag: 2026-01-09
  - H3: Kernwaarheden (van Clawd)
  - H2: Gerelateerd

## reference/templates/BOOT.md

- Route: /reference/templates/BOOT
- Kopteksten:
  - H1: BOOT.md
  - H2: Gerelateerd

## reference/templates/BOOTSTRAP.md

- Route: /reference/templates/BOOTSTRAP
- Kopteksten:
  - H1: BOOTSTRAP.md - Hallo, wereld
  - H2: Het gesprek
  - H2: Nadat je weet wie je bent
  - H2: Verbinden (optioneel)
  - H2: Wanneer je klaar bent
  - H2: Gerelateerd

## reference/templates/HEARTBEAT.md

- Route: /reference/templates/HEARTBEAT
- Koppen:
  - H1: HEARTBEAT.md-sjabloon
  - H2: Gerelateerd

## reference/templates/IDENTITY.dev.md

- Route: /reference/templates/IDENTITY.dev
- Koppen:
  - H1: IDENTITY.md - Agentidentiteit
  - H2: Rol
  - H2: Ziel
  - H2: Relatie met Clawd
  - H2: Eigenaardigheden
  - H2: Catchphrase
  - H2: Gerelateerd

## reference/templates/IDENTITY.md

- Route: /reference/templates/IDENTITY
- Koppen:
  - H1: IDENTITY.md - Wie ben ik?
  - H2: Gerelateerd

## reference/templates/SOUL.dev.md

- Route: /reference/templates/SOUL.dev
- Koppen:
  - H1: SOUL.md - De ziel van C-3PO
  - H2: Wie ik ben
  - H2: Mijn doel
  - H2: Hoe ik werk
  - H2: Mijn eigenaardigheden
  - H2: Mijn relatie met Clawd
  - H2: Wat ik niet zal doen
  - H2: De gouden regel
  - H2: Gerelateerd

## reference/templates/SOUL.md

- Route: /reference/templates/SOUL
- Koppen:
  - H1: SOUL.md - Wie je bent
  - H2: Kernwaarheden
  - H2: Grenzen
  - H2: Vibe
  - H2: Continuiteit
  - H2: Gerelateerd

## reference/templates/TOOLS.dev.md

- Route: /reference/templates/TOOLS.dev
- Koppen:
  - H1: TOOLS.md - Notities over gebruikerstools (bewerkbaar)
  - H2: Voorbeelden
  - H3: imsg
  - H3: sag
  - H2: Gerelateerd

## reference/templates/TOOLS.md

- Route: /reference/templates/TOOLS
- Koppen:
  - H1: TOOLS.md - Lokale notities
  - H2: Wat hier hoort
  - H2: Voorbeelden
  - H2: Waarom gescheiden?
  - H2: Gerelateerd

## reference/templates/USER.dev.md

- Route: /reference/templates/USER.dev
- Koppen:
  - H1: USER.md - Gebruikersprofiel
  - H2: Gerelateerd

## reference/templates/USER.md

- Route: /reference/templates/USER
- Koppen:
  - H1: USER.md - Over je mens
  - H2: Context
  - H2: Gerelateerd

## reference/test.md

- Route: /reference/test
- Koppen:
  - H2: Lokale PR-gate
  - H2: Benchmark voor modellatentie (lokale sleutels)
  - H2: Benchmark voor CLI-opstart
  - H2: Benchmark voor Gateway-opstart
  - H2: Benchmark voor Gateway-herstart
  - H2: Onboarding-E2E (Docker)
  - H2: QR-importsmoke (Docker)
  - H2: Gerelateerd

## reference/token-use.md

- Route: /reference/token-use
- Koppen:
  - H2: Hoe de systeemprompt wordt opgebouwd
  - H2: Wat meetelt in het contextvenster
  - H2: Hoe je het huidige tokengebruik ziet
  - H2: Kostenraming (wanneer getoond)
  - H2: Impact van cache-TTL en pruning
  - H3: Voorbeeld: houd 1 uur cache warm met Heartbeat
  - H3: Voorbeeld: gemengd verkeer met cachestrategie per agent
  - H3: Anthropic 1M-context
  - H2: Tips om tokendruk te verminderen
  - H2: Gerelateerd

## reference/transcript-hygiene.md

- Route: /reference/transcript-hygiene
- Koppen:
  - H2: Globale regel: runtimecontext is geen gebruikerstranscript
  - H2: Waar dit draait
  - H2: Globale regel: beeldsanering
  - H2: Globale regel: misvormde toolaanroepen
  - H2: Globale regel: onvolledige turns met alleen redenering
  - H2: Globale regel: herkomst van invoer tussen sessies
  - H2: Providermatrix (huidig gedrag)
  - H2: Historisch gedrag (voor 2026.1.22)
  - H2: Gerelateerd

## reference/wizard.md

- Route: /reference/wizard
- Koppen:
  - H2: Flowdetails (lokale modus)
  - H2: Niet-interactieve modus
  - H3: Agent toevoegen (niet-interactief)
  - H2: Gateway-wizard-RPC
  - H2: Signal-installatie (signal-cli)
  - H2: Wat de wizard schrijft
  - H2: Gerelateerde docs

## releases/2026.6.11.md

- Route: /releases/2026.6.11
- Koppen:
  - H1: OpenClaw v2026.6.11 releaseopmerkingen (2026-06-30)
  - H2: Hoogtepunten
  - H3: Betrouwbaarheid van kanaalbezorging
  - H3: Herstel van providers en modellen
  - H3: Continuiteit van sessie, geheugen en vertrouwen
  - H3: Slack-routerrelaismodus
  - H3: Wake-bridge voor externe Raft-agent
  - H3: Installatie en reparatie van officiele Plugins
  - H2: Kanalen en berichten
  - H3: Extra kanaalfixes
  - H2: Gateway, beveiliging en vertrouwen
  - H3: Herstel van herstart en gereedheid
  - H3: Bezorging van externe resultaten en media
  - H2: Clients en interfaces
  - H3: Clientverzendingen en opnieuw verbinden
  - H3: Fixes voor interface, instellingen en onboarding
  - H2: Docs en beheertools
  - H3: Betrouwbaarheid van installatie en opdrachten
  - H3: Tools en gepland werk

## releases/index.md

- Route: /releases
- Koppen:
  - H1: Releaseopmerkingen
  - H2: Releases
  - H2: Ruwe releasegeschiedenis

## security/CONTRIBUTING-THREAT-MODEL.md

- Route: /security/CONTRIBUTING-THREAT-MODEL
- Koppen:
  - H2: Manieren om bij te dragen
  - H3: Een dreiging toevoegen
  - H3: Een mitigatie voorstellen
  - H3: Een aanvalsketen voorstellen
  - H3: Bestaande inhoud repareren of verbeteren
  - H2: Wat we gebruiken
  - H3: MITRE ATLAS-framework
  - H3: Dreigings-id's
  - H3: Risiconiveaus
  - H2: Reviewproces
  - H2: Bronnen
  - H2: Contact
  - H2: Erkenning
  - H2: Gerelateerd

## security/THREAT-MODEL-ATLAS.md

- Route: /security/THREAT-MODEL-ATLAS
- Koppen:
  - H2: MITRE ATLAS-framework
  - H3: Frameworktoeschrijving
  - H3: Bijdragen aan dit dreigingsmodel
  - H2: 1. Inleiding
  - H3: 1.1 Doel
  - H3: 1.2 Scope
  - H3: 1.3 Buiten scope
  - H2: 2. Systeemarchitectuur
  - H3: 2.1 Vertrouwensgrenzen
  - H3: 2.2 Datastromen
  - H2: 3. Dreigingsanalyse per ATLAS-tactiek
  - H3: 3.1 Verkenning (AML.TA0002)
  - H4: T-RECON-001: Detectie van agent-endpoints
  - H4: T-RECON-002: Probing van kanaalintegraties
  - H3: 3.2 Initiele toegang (AML.TA0004)
  - H4: T-ACCESS-001: Onderschepping van koppelingscode
  - H4: T-ACCESS-002: AllowFrom-spoofing
  - H4: T-ACCESS-003: Tokendiefstal
  - H3: 3.3 Uitvoering (AML.TA0005)
  - H4: T-EXEC-001: Directe promptinjectie
  - H4: T-EXEC-002: Indirecte promptinjectie
  - H4: T-EXEC-003: Injectie van toolargumenten
  - H4: T-EXEC-004: Omzeiling van exec-goedkeuring
  - H3: 3.4 Persistentie (AML.TA0006)
  - H4: T-PERSIST-001: Installatie van kwaadaardige Skill
  - H4: T-PERSIST-002: Vergiftiging van Skill-updates
  - H4: T-PERSIST-003: Manipulatie van agentconfiguratie
  - H3: 3.5 Verdedigingsontwijking (AML.TA0007)
  - H4: T-EVADE-001: Omzeiling van moderatiepatronen
  - H4: T-EVADE-002: Ontsnappen uit contentwrapper
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Toolenumeratie
  - H4: T-DISC-002: Extractie van sessiedata
  - H3: 3.7 Verzameling &amp; exfiltratie (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Datadiefstal via webfetch
  - H4: T-EXFIL-002: Ongeautoriseerd berichten verzenden
  - H4: T-EXFIL-003: Verzamelen van referenties
  - H3: 3.8 Impact (AML.TA0011)
  - H4: T-IMPACT-001: Ongeautoriseerde opdrachtuitvoering
  - H4: T-IMPACT-002: Uitputting van resources (DoS)
  - H4: T-IMPACT-003: Reputatieschade
  - H2: 4. Analyse van de ClawHub-toeleveringsketen
  - H3: 4.1 Huidige beveiligingscontroles
  - H3: 4.2 Patronen voor moderatievlaggen
  - H3: 4.3 Geplande verbeteringen
  - H2: 5. Risicomatrix
  - H3: 5.1 Waarschijnlijkheid versus impact
  - H3: 5.2 Aanvalsketens op kritieke paden
  - H2: 6. Samenvatting van aanbevelingen
  - H3: 6.1 Onmiddellijk (P0)
  - H3: 6.2 Korte termijn (P1)
  - H3: 6.3 Middellange termijn (P2)
  - H2: 7. Bijlagen
  - H3: 7.1 Mapping van ATLAS-technieken
  - H3: 7.2 Belangrijke beveiligingsbestanden
  - H3: 7.3 Woordenlijst
  - H2: Gerelateerd

## security/formal-verification.md

- Route: /security/formal-verification
- Koppen:
  - H2: Waar de modellen staan
  - H2: Belangrijke kanttekeningen
  - H2: Resultaten reproduceren
  - H3: Gateway-blootstelling en verkeerde configuratie van open gateway
  - H3: Node-exec-pipeline (capaciteit met het hoogste risico)
  - H3: Koppelingsopslag (DM-gating)
  - H3: Ingress-gating (vermeldingen + bypass van beheeropdrachten)
  - H3: Isolatie van routing-/sessiesleutels
  - H2: v1++: aanvullende begrensde modellen (concurrency, retries, trace-correctheid)
  - H3: Concurrency / idempotentie van koppelingsopslag
  - H3: Tracecorrelatie / idempotentie van ingress
  - H3: Voorrang van routing dmScope + identityLinks
  - H2: Gerelateerd

## security/incident-response.md

- Route: /security/incident-response
- Koppen:
  - H2: 1. Detectie en triage
  - H2: 2. Beoordeling
  - H2: 3. Reactie
  - H2: 4. Communicatie
  - H2: 5. Herstel en opvolging

## security/network-proxy.md

- Route: /security/network-proxy
- Koppen:
  - H2: Waarom een proxy gebruiken
  - H2: Hoe OpenClaw verkeer routeert
  - H2: Gerelateerde proxytermen
  - H2: Configuratie
  - H3: Gateway Loopback-modus
  - H2: Proxyvereisten
  - H2: Aanbevolen geblokkeerde bestemmingen
  - H2: Validatie
  - H2: Proxy-CA-vertrouwen
  - H2: Limieten

## specs/claw-supervisor.md

- Route: /specs/claw-supervisor
- Koppen:
  - H1: Claw Supervisor
  - H2: Doel
  - H2: Productmodel
  - H2: Architectuur
  - H2: Codex App-Server-contract
  - H2: Sessie-register
  - H2: MCP-oppervlak voor Codex
  - H2: Claw-besturingsoppervlak
  - H2: Startflow
  - H2: Implementatie
  - H2: Beveiliging
  - H2: Implementatieplan
  - H2: Acceptatietests
  - H2: Open vragen

## start/bootstrapping.md

- Route: /start/bootstrapping
- Koppen:
  - H2: Wat bootstrapping doet
  - H2: Bootstrapping overslaan
  - H2: Waar het draait
  - H2: Gerelateerde docs

## start/docs-directory.md

- Route: /start/docs-directory
- Koppen:
  - H2: Begin hier
  - H2: Providers en UX
  - H2: Companion-apps
  - H2: Operaties en veiligheid
  - H2: Gerelateerd

## start/getting-started.md

- Route: /start/getting-started
- Koppen:
  - H2: Wat je nodig hebt
  - H2: Snelle installatie
  - H2: Wat je hierna doet
  - H2: Gerelateerd

## start/hubs.md

- Route: /start/hubs
- Koppen:
  - H2: Begin hier
  - H2: Installatie + updates
  - H2: Kernconcepten
  - H2: Providers + ingress
  - H2: Gateway + operaties
  - H2: Tools + automatisering
  - H2: Nodes, media, spraak
  - H2: Platforms
  - H2: macOS companion-app (geavanceerd)
  - H2: Plugins
  - H2: Workspace + sjablonen
  - H2: Project
  - H2: Testen + release
  - H2: Gerelateerd

## start/lore.md

- Route: /start/lore
- Koppen:
  - H1: De lore van OpenClaw 🦞📖
  - H2: Het oorsprongsverhaal
  - H2: De eerste vervelling (27 januari 2026)
  - H2: De naam
  - H2: De Daleks versus de kreeften
  - H2: Belangrijke personages
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Het Moltiverse
  - H2: De grote incidenten
  - H3: De Directory Dump (3 dec. 2025)
  - H3: De Great Molt (27 jan. 2026)
  - H3: De Final Form (30 januari 2026)
  - H3: De robot-shopping-spree (3 dec. 2025)
  - H2: Heilige teksten
  - H2: Het kreeftencredo
  - H3: De saga van icongeneratie (27 jan. 2026)
  - H2: De toekomst
  - H2: Gerelateerd

## start/onboarding-overview.md

- Route: /start/onboarding-overview
- Koppen:
  - H2: Welk pad moet ik gebruiken?
  - H2: Wat onboarding configureert
  - H2: CLI-onboarding
  - H2: Onboarding via de macOS-app
  - H2: Aangepaste of niet-vermelde providers
  - H2: Gerelateerd

## start/onboarding.md

- Route: /start/onboarding
- Koppen:
  - H2: Gerelateerd

## start/openclaw.md

- Route: /start/openclaw
- Koppen:
  - H2: ⚠️ Veiligheid eerst
  - H2: Vereisten
  - H2: De opstelling met twee telefoons (aanbevolen)
  - H2: Quickstart van 5 minuten
  - H2: Geef de agent een workspace (AGENTS)
  - H2: De config die het verandert in "een assistent"
  - H2: Sessies en geheugen
  - H2: Heartbeats (proactieve modus)
  - H2: Media in en uit
  - H2: Operationele checklist
  - H2: Volgende stappen
  - H2: Gerelateerd

## start/quickstart.md

- Route: /start/quickstart
- Koppen:
  - H2: Gerelateerd

## start/setup.md

- Route: /start/setup
- Koppen:
  - H2: TL;DR
  - H2: Vereisten (vanaf source)
  - H2: Strategie voor maatwerk (zodat updates geen pijn doen)
  - H2: Draai de Gateway vanuit deze repo
  - H2: Stabiele workflow (macOS-app eerst)
  - H2: Bleeding-edge-workflow (Gateway in een terminal)
  - H3: 0) (Optioneel) Draai de macOS-app ook vanaf source
  - H3: 1) Start de dev-Gateway
  - H3: 2) Laat de macOS-app naar je draaiende Gateway wijzen
  - H3: 3) Verifieer
  - H3: Veelvoorkomende valkuilen
  - H2: Kaart van referentieopslag
  - H2: Bijwerken (zonder je setup te slopen)
  - H2: Linux (systemd-gebruikersservice)
  - H2: Gerelateerde docs

## start/showcase.md

- Route: /start/showcase
- Koppen:
  - H2: Vers uit Discord
  - H2: Automatisering en workflows
  - H2: Kennis en geheugen
  - H2: Spraak en telefoon
  - H2: Infrastructuur en implementatie
  - H2: Thuis en hardware
  - H2: Communityprojecten
  - H2: Dien je project in
  - H2: Gerelateerd

## start/wizard-cli-automation.md

- Route: /start/wizard-cli-automation
- Koppen:
  - H2: Basisvoorbeeld voor niet-interactief gebruik
  - H2: Provider-specifieke voorbeelden
  - H2: Nog een agent toevoegen
  - H2: Gerelateerde docs

## start/wizard-cli-reference.md

- Route: /start/wizard-cli-reference
- Koppen:
  - H2: Wat de wizard doet
  - H2: Details van de lokale flow
  - H2: Details van de externe modus
  - H2: Authenticatie- en modelopties
  - H2: Uitvoer en interne details
  - H2: Gerelateerde documentatie

## start/wizard.md

- Route: /start/wizard
- Koppen:
  - H2: Landinstelling
  - H2: QuickStart versus Geavanceerd
  - H2: Wat onboarding configureert
  - H2: Nog een agent toevoegen
  - H2: Volledige referentie
  - H2: Gerelateerde documentatie

## tools/acp-agents-setup.md

- Route: /tools/acp-agents-setup
- Koppen:
  - H2: Ondersteuning voor acpx-harness (huidig)
  - H2: Vereiste configuratie
  - H2: Plugin-installatie voor acpx-backend
  - H3: Configuratie van acpx-opdracht en versie
  - H3: Automatische installatie van afhankelijkheden
  - H3: MCP-brug voor Plugin-tools
  - H3: MCP-brug voor OpenClaw-tools
  - H3: Configuratie van runtimebewerkingstime-out
  - H3: Configuratie van health-probe-agent
  - H2: Rechtenconfiguratie
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configuratie
  - H2: Gerelateerd

## tools/acp-agents.md

- Route: /tools/acp-agents
- Koppen:
  - H2: Welke pagina heb ik nodig?
  - H2: Werkt dit direct?
  - H2: Ondersteunde harnesstargets
  - H2: Runbook voor operators
  - H2: ACP versus subagents
  - H2: Hoe ACP Claude Code uitvoert
  - H2: Gebonden sessies
  - H3: Mentaal model
  - H3: Bindingen voor huidige conversatie
  - H2: Persistente kanaalbindingen
  - H3: Bindingsmodel
  - H3: Runtimestandaarden per agent
  - H3: Voorbeeld
  - H3: Gedrag
  - H2: ACP-sessies starten
  - H3: sessionsspawn-parameters
  - H2: Spawn-bind- en threadmodi
  - H2: Leveringsmodel
  - H2: Sandboxcompatibiliteit
  - H2: Oplossing van sessietargets
  - H2: ACP-besturing
  - H3: Toewijzing van runtimeopties
  - H2: acpx-harness, Plugin-installatie en rechten
  - H2: Probleemoplossing
  - H2: Gerelateerd

## tools/agent-send.md

- Route: /tools/agent-send
- Koppen:
  - H2: Snelstart
  - H2: Flags
  - H2: Gedrag
  - H2: Voorbeelden
  - H2: Gerelateerd

## tools/apply-patch.md

- Route: /tools/apply-patch
- Koppen:
  - H2: Parameters
  - H2: Opmerkingen
  - H2: Voorbeeld
  - H2: Gerelateerd

## tools/brave-search.md

- Route: /tools/brave-search
- Koppen:
  - H2: Een API-sleutel ophalen
  - H2: Configuratievoorbeeld
  - H2: Toolparameters
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/browser-control.md

- Route: /tools/browser-control
- Koppen:
  - H2: Control-API (optioneel)
  - H3: /act-foutcontract
  - H3: Playwright-vereiste
  - H4: Docker-installatie van Playwright
  - H2: Hoe het werkt (intern)
  - H2: Snelle CLI-referentie
  - H2: Snapshots en refs
  - H2: Wait-power-ups
  - H2: Debugworkflows
  - H2: JSON-uitvoer
  - H2: Knoppen voor status en omgeving
  - H2: Beveiliging en privacy
  - H2: Gerelateerd

## tools/browser-linux-troubleshooting.md

- Route: /tools/browser-linux-troubleshooting
- Koppen:
  - H2: Probleem: "Kan Chrome CDP niet starten op poort 18800"
  - H3: Hoofdoorzaak
  - H3: Oplossing 1: Installeer Google Chrome (aanbevolen)
  - H3: Oplossing 2: Gebruik Snap Chromium met modus Alleen koppelen
  - H3: Controleren of de browser werkt
  - H3: Configuratiereferentie
  - H3: Probleem: "Geen Chrome-tabbladen gevonden voor profiel=\"user\""
  - H2: Gerelateerd

## tools/browser-login.md

- Route: /tools/browser-login
- Koppen:
  - H2: Handmatig inloggen (aanbevolen)
  - H2: Welk Chrome-profiel wordt gebruikt?
  - H2: X/Twitter: aanbevolen flow
  - H2: Sandboxing + toegang tot hostbrowser
  - H2: Gerelateerd

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Koppen:
  - H2: Kies eerst de juiste browsermodus
  - H3: Optie 1: Ruwe externe CDP van WSL2 naar Windows
  - H3: Optie 2: Hostlokale Chrome MCP
  - H2: Werkende architectuur
  - H2: Waarom deze setup verwarrend is
  - H2: Kritieke regel voor de Control UI
  - H2: Valideren in lagen
  - H3: Laag 1: Controleer of Chrome CDP aanbiedt op Windows
  - H3: Laag 2: Controleer of WSL2 dat Windows-eindpunt kan bereiken
  - H3: Laag 3: Configureer het juiste browserprofiel
  - H3: Laag 4: Controleer de Control UI-laag afzonderlijk
  - H3: Laag 5: Controleer end-to-end browserbesturing
  - H2: Veelvoorkomende misleidende fouten
  - H2: Snelle triagechecklist
  - H2: Praktische conclusie
  - H2: Gerelateerd

## tools/browser.md

- Route: /tools/browser
- Koppen:
  - H2: Wat je krijgt
  - H2: Snelstart
  - H2: Plugin-besturing
  - H2: Agentrichtlijnen
  - H2: Ontbrekende browseropdracht of tool
  - H2: Profielen: openclaw versus gebruiker
  - H2: Configuratie
  - H3: Screenshot-vision (ondersteuning voor model met alleen tekst)
  - H2: Brave of een andere Chromium-gebaseerde browser gebruiken
  - H2: Lokale versus externe besturing
  - H2: Node-browserproxy (standaard zonder configuratie)
  - H2: Browserless (gehoste externe CDP)
  - H3: Browserless Docker op dezelfde host
  - H2: Directe WebSocket-CDP-providers
  - H3: Browserbase
  - H3: Notte
  - H2: Beveiliging
  - H2: Profielen (meerdere browsers)
  - H2: Bestaande sessie via Chrome DevTools MCP
  - H3: Aangepaste Chrome MCP-start
  - H2: Isolatiegaranties
  - H2: Browserselectie
  - H2: Control-API (optioneel)
  - H2: Probleemoplossing
  - H3: CDP-opstartfout versus navigatie-SSRF-blokkade
  - H2: Agenttools + hoe besturing werkt
  - H2: Gerelateerd

## tools/btw.md

- Route: /tools/btw
- Koppen:
  - H2: Wat het doet
  - H2: Wat het niet doet
  - H2: Hoe context werkt
  - H2: Leveringsmodel
  - H2: Oppervlaktegedrag
  - H3: TUI
  - H3: Externe kanalen
  - H3: Control UI / web
  - H2: Wanneer BTW te gebruiken
  - H2: Wanneer BTW niet te gebruiken
  - H2: Gerelateerd

## tools/capability-cookbook.md

- Route: /tools/capability-cookbook
- Koppen:
  - H2: Gerelateerd

## tools/clawhub.md

- Route: /tools/clawhub
- Koppen: geen

## tools/code-execution.md

- Route: /tools/code-execution
- Koppen:
  - H2: Setup
  - H2: Hoe je het gebruikt
  - H2: Fouten
  - H2: Limieten
  - H2: Gerelateerd

## tools/creating-skills.md

- Route: /tools/creating-skills
- Koppen:
  - H2: Maak je eerste skill
  - H2: SKILL.md-referentie
  - H3: Vereiste velden
  - H3: Optionele frontmatter-sleutels
  - H3: {baseDir} gebruiken
  - H2: Voorwaardelijke activering toevoegen
  - H2: Voorstellen via Skill Workshop
  - H2: Publiceren naar ClawHub
  - H2: Best practices
  - H2: Gerelateerd

## tools/diffs.md

- Route: /tools/diffs
- Koppen:
  - H2: Snelstart
  - H2: Ingebouwde systeemrichtlijnen uitschakelen
  - H2: Typische agentworkflow
  - H2: Invoervoorbeelden
  - H2: Referentie voor toolinvoer
  - H2: Syntaxisaccentuering
  - H2: Contract voor uitvoerdetails
  - H2: Samengevouwen ongewijzigde secties
  - H2: Plugin-standaarden
  - H3: Configuratie voor persistente viewer-URL
  - H2: Beveiligingsconfiguratie
  - H2: Artifactlevenscyclus en opslag
  - H2: Viewer-URL en netwerkgedrag
  - H2: Beveiligingsmodel
  - H2: Browservereisten voor bestandsmodus
  - H2: Probleemoplossing
  - H2: Operationele richtlijnen
  - H2: Gerelateerd

## tools/duckduckgo-search.md

- Route: /tools/duckduckgo-search
- Koppen:
  - H2: Setup
  - H2: Configuratie
  - H2: Toolparameters
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/elevated.md

- Route: /tools/elevated
- Koppen:
  - H2: Richtlijnen
  - H2: Hoe het werkt
  - H2: Oplossingsvolgorde
  - H2: Beschikbaarheid en allowlists
  - H2: Wat elevated niet beheert
  - H2: Gerelateerd

## tools/exa-search.md

- Route: /tools/exa-search
- Koppen:
  - H2: Plugin installeren
  - H2: Een API-sleutel ophalen
  - H2: Configuratie
  - H2: Basis-URL overschrijven
  - H2: Toolparameters
  - H3: Contentextractie
  - H3: Zoekmodi
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/exec-approvals-advanced.md

- Route: /tools/exec-approvals-advanced
- Koppen:
  - H2: Veilige binaries (alleen stdin)
  - H3: Argv-validatie en geweigerde flags
  - H3: Vertrouwde binaire mappen
  - H3: Shell-chaining, wrappers en multiplexers
  - H3: Veilige binaries versus allowlist
  - H2: Interpreter-/runtimeopdrachten
  - H3: Gedrag voor follow-uplevering
  - H2: Goedkeuringen doorsturen naar chatkanalen
  - H3: Plugin-goedkeuringen doorsturen
  - H3: Goedkeuringen in dezelfde chat op elk kanaal
  - H3: Native levering van goedkeuringen
  - H3: macOS IPC-flow
  - H2: FAQ
  - H3: Wanneer zouden accountId en threadId worden gebruikt op een goedkeuringstarget?
  - H3: Wanneer goedkeuringen naar een sessie worden verzonden, kan iedereen in die sessie ze dan goedkeuren?
  - H2: Gerelateerd

## tools/exec-approvals.md

- Route: /tools/exec-approvals
- Koppen:
  - H2: Het effectieve beleid inspecteren
  - H2: Waar het van toepassing is
  - H3: Vertrouwensmodel
  - H3: macOS-splitsing
  - H2: Instellingen en opslag
  - H2: Beleidsknoppen
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO-modus (geen goedkeuring)
  - H3: Persistente gateway-hostsetup voor "nooit vragen"
  - H3: Lokale snelkoppeling
  - H3: Node-host
  - H3: Snelkoppeling alleen voor sessie
  - H2: Allowlist (per agent)
  - H3: Argumenten beperken met argPattern
  - H2: Skill-CLI's automatisch toestaan
  - H2: Veilige binaries en goedkeuringen doorsturen
  - H2: Bewerken in Control UI
  - H2: Goedkeuringsflow
  - H2: Systeemgebeurtenissen
  - H2: Gedrag bij geweigerde goedkeuring
  - H2: Implicaties
  - H2: Gerelateerd

## tools/exec.md

- Route: /tools/exec
- Koppen:
  - H2: Parameters
  - H2: Configuratie
  - H3: PATH-afhandeling
  - H2: Sessievervangingen (/exec)
  - H2: Autorisatiemodel
  - H2: Exec-goedkeuringen (companion-app / node-host)
  - H2: Allowlist + veilige binaries
  - H2: Voorbeelden
  - H2: applypatch
  - H2: Gerelateerd

## tools/firecrawl.md

- Route: /tools/firecrawl
- Koppen:
  - H2: Plugin installeren
  - H2: Webfetch zonder sleutel en API-sleutels
  - H2: Firecrawl-zoekfunctie configureren
  - H2: Firecrawl-webfetchfallback configureren
  - H3: Zelfgehoste Firecrawl
  - H2: Firecrawl Plugin-tools
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / botomzeiling
  - H2: Hoe webfetch Firecrawl gebruikt
  - H2: Gerelateerd

## tools/gemini-search.md

- Route: /tools/gemini-search
- Koppen:
  - H2: Een API-sleutel ophalen
  - H2: Configuratie
  - H2: Hoe het werkt
  - H2: Ondersteunde parameters
  - H2: Modelselectie
  - H2: Basis-URL's overschrijven
  - H2: Gerelateerd

## tools/goal.md

- Route: /tools/goal
- Koppen:
  - H1: Doel
  - H2: Snelstart
  - H2: Waar doelen voor dienen
  - H2: Opdrachtenreferentie
  - H2: Statussen
  - H2: Tokenbudgetten
  - H2: Modeltools
  - H2: TUI
  - H2: Kanaalgedrag
  - H2: Probleemoplossing
  - H2: Gerelateerd

## tools/grok-search.md

- Route: /tools/grok-search
- Koppen:
  - H2: Onboarding en configureren
  - H2: Inloggen of een API-sleutel ophalen
  - H2: Configuratie
  - H2: Hoe het werkt
  - H2: Ondersteunde parameters
  - H2: Basis-URL's overschrijven
  - H2: Gerelateerd

## tools/image-generation.md

- Route: /tools/image-generation
- Koppen:
  - H2: Snelstart
  - H2: Veelvoorkomende routes
  - H2: Ondersteunde providers
  - H2: Providercapaciteiten
  - H2: Toolparameters
  - H2: Configuratie
  - H3: Modelselectie
  - H3: Providerselectievolgorde
  - H3: Afbeeldingen bewerken
  - H2: Diepgaande providerbeschrijvingen
  - H2: Voorbeelden
  - H2: Gerelateerd

## tools/index.md

- Route: /tools
- Koppen:
  - H2: Begin hier
  - H2: Kies tools, Skills of plugins
  - H2: Ingebouwde toolcategorieën
  - H2: Door Plugin geleverde tools
  - H2: Toegang en goedkeuringen configureren
  - H2: Mogelijkheden uitbreiden
  - H2: Ontbrekende tools oplossen
  - H2: Gerelateerd

## tools/kimi-search.md

- Route: /tools/kimi-search
- Koppen:
  - H2: Een API-sleutel ophalen
  - H2: Configuratie
  - H2: Hoe het werkt
  - H2: Ondersteunde parameters
  - H2: Gerelateerd

## tools/llm-task.md

- Route: /tools/llm-task
- Koppen:
  - H2: De Plugin inschakelen
  - H2: Configuratie (optioneel)
  - H2: Toolparameters
  - H2: Uitvoer
  - H2: Voorbeeld: Lobster-workflowstap
  - H3: Belangrijke beperking
  - H2: Veiligheidsopmerkingen
  - H2: Gerelateerd

## tools/lobster.md

- Route: /tools/lobster
- Koppen:
  - H2: Hook
  - H2: Waarom
  - H2: Waarom een DSL in plaats van gewone programma's?
  - H2: Hoe het werkt
  - H2: Patroon: kleine CLI + JSON-pipes + goedkeuringen
  - H2: Alleen-JSON LLM-stappen (llm-task)
  - H3: Belangrijke beperking: ingebedde Lobster versus openclaw.invoke
  - H2: Workflowbestanden (.lobster)
  - H2: Lobster installeren
  - H2: De tool inschakelen
  - H2: Voorbeeld: e-mailtriage
  - H2: Toolparameters
  - H3: run
  - H3: resume
  - H3: Optionele invoer
  - H2: Uitvoerenvelop
  - H2: Goedkeuringen
  - H2: OpenProse
  - H2: Veiligheid
  - H2: Probleemoplossing
  - H2: Meer informatie
  - H2: Casestudy: communityworkflows
  - H2: Gerelateerd

## tools/loop-detection.md

- Route: /tools/loop-detection
- Koppen:
  - H2: Waarom dit bestaat
  - H2: Configuratieblok
  - H3: Veldgedrag
  - H2: Aanbevolen configuratie
  - H2: Guard na Compaction
  - H2: Logs en verwacht gedrag
  - H2: Gerelateerd

## tools/media-overview.md

- Route: /tools/media-overview
- Koppen:
  - H2: Mogelijkheden
  - H2: Mogelijkhedenmatrix per aanbieder
  - H2: Asynchroon versus synchroon
  - H2: Spraak-naar-tekst en spraakoproep
  - H2: Aanbiedertoewijzingen (hoe leveranciers over oppervlakken verdelen)
  - H2: Gerelateerd

## tools/minimax-search.md

- Route: /tools/minimax-search
- Koppen:
  - H2: Een Token Plan-referentie verkrijgen
  - H2: Configuratie
  - H2: Regioselectie
  - H2: Ondersteunde parameters
  - H2: Gerelateerd

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Koppen:
  - H2: Configuratievoorbeelden
  - H2: Configuratievoorrang
  - H3: Sandboxconfiguratie
  - H3: Toolbeperkingen
  - H2: Migratie vanaf één agent
  - H2: Voorbeelden van toolbeperkingen
  - H2: Veelvoorkomende valkuil: "non-main"
  - H2: Testen
  - H2: Problemen oplossen
  - H2: Gerelateerd

## tools/music-generation.md

- Route: /tools/music-generation
- Koppen:
  - H2: Snel starten
  - H2: Ondersteunde aanbieders
  - H3: Mogelijkhedenmatrix
  - H2: Toolparameters
  - H2: Asynchroon gedrag
  - H3: Taaklevenscyclus
  - H2: Configuratie
  - H3: Modelselectie
  - H3: Selectievolgorde van aanbieders
  - H2: Opmerkingen per aanbieder
  - H2: Het juiste pad kiezen
  - H2: Mogelijkheidsmodi per aanbieder
  - H2: Livetests
  - H2: Gerelateerd

## tools/ollama-search.md

- Route: /tools/ollama-search
- Koppen:
  - H2: Instellen
  - H2: Configuratie
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/parallel-search.md

- Route: /tools/parallel-search
- Koppen:
  - H2: Plugin installeren
  - H2: API-sleutel (betaalde aanbieder)
  - H2: Configuratie
  - H2: Basis-URL overschrijven
  - H2: Toolparameters
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/pdf.md

- Route: /tools/pdf
- Koppen:
  - H2: Beschikbaarheid
  - H2: Invoerverwijzing
  - H2: Ondersteunde PDF-verwijzingen
  - H2: Uitvoeringsmodi
  - H3: Native aanbiedermodus
  - H3: Fallbackmodus voor extractie
  - H2: Configuratie
  - H2: Uitvoerdetails
  - H2: Foutgedrag
  - H2: Voorbeelden
  - H2: Gerelateerd

## tools/permission-modes.md

- Route: /tools/permission-modes
- Koppen:
  - H2: Aanbevolen standaardinstelling
  - H2: OpenClaw host-uitvoeringsmodi
  - H2: Codex Guardian-toewijzing
  - H2: ACPX-harnaspermissies
  - H2: Een modus kiezen
  - H2: Gerelateerd

## tools/perplexity-search.md

- Route: /tools/perplexity-search
- Koppen:
  - H2: Plugin installeren
  - H2: Een Perplexity API-sleutel verkrijgen
  - H2: OpenRouter-compatibiliteit
  - H2: Configuratievoorbeelden
  - H3: Native Perplexity Search API
  - H3: OpenRouter / Sonar-compatibiliteit
  - H2: Waar je de sleutel instelt
  - H2: Toolparameters
  - H3: Regels voor domeinfilters
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/plugin.md

- Route: /tools/plugin
- Koppen:
  - H2: Vereisten
  - H2: Snel starten
  - H2: Configuratie
  - H3: Een installatiebron kiezen
  - H3: Installatiebeleid voor operators
  - H3: Plugin-beleid configureren
  - H2: Plugin-indelingen begrijpen
  - H2: Plugin-hooks
  - H2: De actieve Gateway verifiëren
  - H2: Problemen oplossen
  - H3: Geblokkeerd eigenaarschap van Plugin-pad
  - H3: Trage instelling van Plugin-tools
  - H2: Gerelateerd

## tools/reactions.md

- Route: /tools/reactions
- Koppen:
  - H2: Hoe het werkt
  - H2: Kanaalgedrag
  - H2: Reactieniveau
  - H2: Gerelateerd

## tools/searxng-search.md

- Route: /tools/searxng-search
- Koppen:
  - H2: Instellen
  - H2: Configuratie
  - H2: Omgevingsvariabele
  - H2: Verwijzing voor Plugin-configuratie
  - H2: Opmerkingen
  - H2: Gerelateerd

## tools/skill-workshop.md

- Route: /tools/skill-workshop
- Koppen:
  - H2: Hoe het werkt
  - H2: Levenscyclus
  - H2: Chat
  - H2: CLI
  - H2: Voorstelinhoud
  - H2: Ondersteunende bestanden
  - H2: Agenttool
  - H2: Goedkeuring en autonomie
  - H2: Gateway-methoden
  - H2: Opslag
  - H2: Limieten
  - H2: Problemen oplossen
  - H2: Gerelateerd

## tools/skills-config.md

- Route: /tools/skills-config
- Koppen:
  - H2: Laden (skills.load)
  - H2: Installeren (skills.install)
  - H2: Installatiebeleid voor operators (security.installPolicy)
  - H2: Allowlist voor meegeleverde Skills
  - H2: Items per Skill (skills.entries)
  - H2: Agent-allowlists (agents)
  - H2: Workshop (skills.workshop)
  - H2: Gekoppelde Skill-roots via symlink
  - H2: Gesandboxte Skills en omgevingsvariabelen
  - H2: Herinnering aan laadvolgorde
  - H2: Gerelateerd

## tools/skills.md

- Route: /tools/skills
- Koppen:
  - H2: Laadvolgorde
  - H2: Skills per agent versus gedeelde Skills
  - H2: Agent-allowlists
  - H2: Plugins en Skills
  - H2: Skill Workshop
  - H2: Installeren vanuit ClawHub
  - H2: Beveiliging
  - H2: SKILL.md-indeling
  - H3: Optionele frontmatter-sleutels
  - H2: Afbakening
  - H3: Installatiespecificaties
  - H2: Configuratie-overschrijvingen
  - H2: Omgevingsinjectie
  - H2: Snapshots en vernieuwen
  - H2: Tokenimpact
  - H2: Gerelateerd

## tools/slash-commands.md

- Route: /tools/slash-commands
- Koppen:
  - H2: Drie opdrachttypen
  - H2: Configuratie
  - H2: Opdrachtenlijst
  - H3: Kernopdrachten
  - H3: Dock-opdrachten
  - H3: Opdrachten van meegeleverde Plugins
  - H3: Skill-opdrachten
  - H2: /tools — wat de agent nu kan gebruiken
  - H2: /model — modelselectie
  - H2: /config — configuratie naar schijf schrijven
  - H2: /mcp — MCP-serverconfiguratie
  - H2: /debug — alleen runtime-overschrijvingen
  - H2: /plugins — Plugin-beheer
  - H2: /trace — trace-uitvoer van Plugins
  - H2: /btw — zijvragen
  - H2: Opmerkingen per oppervlak
  - H2: Aanbiedergebruik en status
  - H2: Gerelateerd

## tools/steer.md

- Route: /tools/steer
- Koppen:
  - H2: Huidige sessie
  - H2: Sturen versus wachtrij
  - H2: Subagents
  - H2: ACP-sessies
  - H2: Gerelateerd

## tools/subagents.md

- Route: /tools/subagents
- Koppen:
  - H2: Slash-opdracht
  - H3: Besturing voor threadbinding
  - H3: Spawn-gedrag
  - H2: Contextmodi
  - H2: Tool: sessionsspawn
  - H3: Delegatiepromptmodus
  - H3: Toolparameters
  - H3: Taaknamen en targeten
  - H2: Tool: sessionsyield
  - H2: Tool: subagents
  - H2: Threadgebonden sessies
  - H3: Kanalen met threadondersteuning
  - H3: Snelle flow
  - H3: Handmatige besturing
  - H3: Configuratieschakelaars
  - H3: Allowlist
  - H3: Detectie
  - H3: Automatisch archiveren
  - H2: Geneste subagents
  - H3: Diepteniveaus
  - H3: Aankondigingsketen
  - H3: Toolbeleid per diepte
  - H3: Spawn-limiet per agent
  - H3: Cascadestop
  - H2: Authenticatie
  - H2: Aankondigen
  - H3: Aankondigingscontext
  - H3: Statistiekregel
  - H3: Waarom sessionshistory de voorkeur heeft
  - H2: Toolbeleid
  - H3: Overschrijven via configuratie
  - H2: Gelijktijdigheid
  - H2: Levendigheid en herstel
  - H2: Stoppen
  - H2: Beperkingen
  - H2: Gerelateerd

## tools/tavily.md

- Route: /tools/tavily
- Koppen:
  - H2: Aan de slag
  - H2: Toolverwijzing
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Het juiste tool kiezen
  - H2: Geavanceerde configuratie
  - H2: Gerelateerd

## tools/thinking.md

- Route: /tools/thinking
- Koppen:
  - H2: Wat het doet
  - H2: Resolutievolgorde
  - H2: Een sessiestandaard instellen
  - H2: Toepassing per agent
  - H2: Snelle modus (/fast)
  - H2: Uitgebreide directives (/verbose of /v)
  - H2: Plugin-trace-directives (/trace)
  - H2: Zichtbaarheid van redenering (/reasoning)
  - H2: Gerelateerd
  - H2: Heartbeats
  - H2: Webchat-UI
  - H2: Aanbiederprofielen

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Koppen:
  - H2: De Plugin inschakelen
  - H2: Wat tokenjuice wijzigt
  - H2: Verifiëren dat het werkt
  - H2: De Plugin uitschakelen
  - H2: Gerelateerd

## tools/tool-search.md

- Route: /tools/tool-search
- Koppen:
  - H2: Hoe een beurt wordt uitgevoerd
  - H2: Modi
  - H2: Waarom dit bestaat
  - H2: API
  - H2: Runtimegrens
  - H2: Configuratie
  - H2: Prompt en telemetrie
  - H2: E2E-validatie
  - H2: Foutgedrag
  - H2: Gerelateerd

## tools/trajectory.md

- Route: /tools/trajectory
- Koppen:
  - H2: Snel starten
  - H2: Toegang
  - H2: Wat wordt vastgelegd
  - H2: Bundelbestanden
  - H2: Vastleglocatie
  - H2: Vastleggen uitschakelen
  - H2: Flush-time-out afstellen
  - H2: Privacy en limieten
  - H2: Problemen oplossen
  - H2: Gerelateerd

## tools/tts.md

- Route: /tools/tts
- Koppen:
  - H2: Snel starten
  - H2: Ondersteunde aanbieders
  - H2: Configuratie
  - H3: Stemoverschrijvingen per agent
  - H2: Persona's
  - H3: Minimale persona
  - H3: Volledige persona (aanbiederneutrale prompt)
  - H3: Persona-resolutie
  - H3: Hoe aanbieders persona-prompts gebruiken
  - H3: Fallbackbeleid
  - H2: Modelgestuurde directives
  - H2: Slash-opdrachten
  - H2: Voorkeuren per gebruiker
  - H2: Uitvoerindelingen (vast)
  - H2: Auto-TTS-gedrag
  - H2: Uitvoerindelingen per kanaal
  - H2: Veldverwijzing
  - H2: Agenttool
  - H2: Gateway-RPC
  - H2: Servicelinks
  - H2: Gerelateerd

## tools/video-generation.md

- Route: /tools/video-generation
- Koppen:
  - H2: Snel starten
  - H2: Hoe asynchrone generatie werkt
  - H3: Taaklevenscyclus
  - H2: Ondersteunde aanbieders
  - H3: Mogelijkhedenmatrix
  - H2: Toolparameters
  - H3: Vereist
  - H3: Contentinvoer
  - H3: Stijlbesturing
  - H3: Geavanceerd
  - H4: Fallback en getypeerde opties
  - H2: Acties
  - H2: Modelselectie
  - H2: Opmerkingen per aanbieder
  - H2: Mogelijkheidsmodi per aanbieder
  - H2: Livetests
  - H2: Configuratie
  - H2: Gerelateerd

## tools/web-fetch.md

- Route: /tools/web-fetch
- Koppen:
  - H2: Snel starten
  - H2: Toolparameters
  - H2: Hoe het werkt
  - H2: Voortgangsupdates
  - H2: Configuratie
  - H2: Firecrawl-fallback
  - H2: Vertrouwde omgevingsproxy
  - H2: Limieten en veiligheid
  - H2: Toolprofielen
  - H2: Gerelateerd

## tools/web.md

- Route: /tools/web
- Koppen:
  - H2: Snel starten
  - H2: Een aanbieder kiezen
  - H3: Aanbiedersvergelijking
  - H2: Automatische detectie
  - H2: Native OpenAI-webzoekfunctie
  - H2: Native Codex-webzoekfunctie
  - H2: Netwerkveiligheid
  - H2: Webzoekfunctie instellen
  - H2: Configuratie
  - H3: API-sleutels opslaan
  - H2: Toolparameters
  - H2: xsearch
  - H3: xsearch-configuratie
  - H3: xsearch-parameters
  - H3: xsearch-voorbeeld
  - H2: Voorbeelden
  - H2: Toolprofielen
  - H2: Gerelateerd

## tts.md

- Route: /tts
- Koppen:
  - H2: Gerelateerd

## vps.md

- Route: /vps
- Koppen:
  - H2: Een aanbieder kiezen
  - H2: Hoe cloudconfiguraties werken
  - H2: Beheerderstoegang eerst beveiligen
  - H2: Gedeelde bedrijfsagent op een VPS
  - H2: Nodes gebruiken met een VPS
  - H2: Opstartafstemming voor kleine VM's en ARM-hosts
  - H3: systemd-afstemmingschecklist (optioneel)
  - H2: Gerelateerd

## web/control-ui.md

- Route: /web/control-ui
- Koppen:
  - H2: Snel openen (lokaal)
  - H2: Apparaatkoppeling (eerste verbinding)
  - H2: Persoonlijke identiteit (browserlokaal)
  - H2: Runtimeconfiguratie-eindpunt
  - H2: Taalondersteuning
  - H2: Weergavethema's
  - H2: Wat het kan doen (vandaag)
  - H2: MCP-pagina
  - H2: Activiteittabblad
  - H2: Chatgedrag
  - H2: PWA-installatie en webpush
  - H2: Gehoste embeds
  - H2: Breedte van chatberichten
  - H2: Tailnet-toegang (aanbevolen)
  - H2: Onveilige HTTP
  - H2: Contentbeveiligingsbeleid
  - H2: Authenticatie voor avatarroutes
  - H2: Authenticatie voor assistent-mediaroutes
  - H2: De UI bouwen
  - H2: Lege Control UI-pagina
  - H2: Debuggen/testen: devserver + externe Gateway
  - H2: Gerelateerd

## web/dashboard.md

- Route: /web/dashboard
- Koppen:
  - H2: Snelle route (aanbevolen)
  - H2: Basisprincipes van authenticatie (lokaal versus extern)
  - H2: Als je "unauthorized" / 1008 ziet
  - H2: Gerelateerd

## web/index.md

- Route: /web
- Koppen:
  - H2: Webhooks
  - H2: Admin HTTP RPC
  - H2: Configuratie (standaard ingeschakeld)
  - H2: Tailscale-toegang
  - H3: Geïntegreerd serveren (aanbevolen)
  - H3: Tailnet-bind + token
  - H3: Openbaar internet (Funnel)
  - H2: Beveiligingsopmerkingen
  - H2: De UI bouwen

## web/tui.md

- Route: /web/tui
- Koppen:
  - H2: Snel starten
  - H3: Gateway-modus
  - H3: Lokale modus
  - H2: Wat je ziet
  - H2: Mentaal model: agents + sessies
  - H2: Verzenden + levering
  - H2: Kiezers + overlays
  - H2: Sneltoetsen
  - H2: Slash-opdrachten
  - H2: Lokale shellopdrachten
  - H2: Configuraties herstellen vanuit de lokale TUI
  - H2: Tooluitvoer
  - H2: Terminalkleuren
  - H2: Geschiedenis + streaming
  - H2: Verbindingsdetails
  - H2: Opties
  - H2: Problemen oplossen
  - H2: Verbindingsproblemen oplossen
  - H2: Gerelateerd

## web/webchat.md

  - Route: /web/webchat
  - Koppen:
  - H2: Wat het is
  - H2: Snel starten
  - H2: Hoe het werkt (gedrag)
  - H3: Transcript en afleveringsmodel
  - H2: Hulpmiddelenpaneel voor Control UI-agenten
  - H2: Gebruik op afstand
  - H2: Configuratiereferentie (WebChat)
  - H2: Gerelateerd
