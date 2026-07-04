---
read_when:
    - Functies toevoegen die toegang of automatisering uitbreiden
summary: Beveiligingsoverwegingen en dreigingsmodel voor het uitvoeren van een AI-gateway met shelltoegang
title: Beveiliging
x-i18n:
    generated_at: "2026-07-04T10:51:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42a398a347f04414c443277c8ab3632953bce73e957c8439883846813f882dd5
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Vertrouwensmodel voor persoonlijke assistent.** Deze richtlijn gaat uit van één vertrouwde
  operatorgrens per Gateway (single-user, persoonlijke-assistentmodel).
  OpenClaw is **geen** vijandige multi-tenant-beveiligingsgrens voor meerdere
  kwaadwillende gebruikers die één agent of Gateway delen. Als je werking met gemengd vertrouwen of
  kwaadwillende gebruikers nodig hebt, splits dan vertrouwensgrenzen (aparte Gateway +
  referenties, idealiter aparte OS-gebruikers of hosts).
</Warning>

## Eerst de scope: beveiligingsmodel voor persoonlijke assistent

De beveiligingsrichtlijnen van OpenClaw gaan uit van een **persoonlijke assistent**-implementatie: één vertrouwde operatorgrens, mogelijk veel agents.

- Ondersteunde beveiligingshouding: één gebruiker/vertrouwensgrens per Gateway (bij voorkeur één OS-gebruiker/host/VPS per grens).
- Geen ondersteunde beveiligingsgrens: één gedeelde Gateway/agent die wordt gebruikt door wederzijds niet-vertrouwde of kwaadwillende gebruikers.
- Als isolatie voor kwaadwillende gebruikers vereist is, splits dan per vertrouwensgrens (aparte Gateway + referenties, en idealiter aparte OS-gebruikers/hosts).
- Als meerdere niet-vertrouwde gebruikers één agent met tools kunnen berichten, behandel hen dan alsof ze dezelfde gedelegeerde toolbevoegdheid voor die agent delen.

Deze pagina legt hardening **binnen dat model** uit. Ze claimt geen vijandige multi-tenant-isolatie op één gedeelde Gateway.

Gebruik vóór het wijzigen van externe toegang, DM-beleid, reverse proxy of publieke blootstelling
het [Gateway-blootstellingsdraaiboek](/nl/gateway/security/exposure-runbook) als
pre-flight- en rollbackchecklist.

## Snelle controle: `openclaw security audit`

Zie ook: [Formele verificatie (beveiligingsmodellen)](/nl/security/formal-verification)

Voer dit regelmatig uit (vooral na het wijzigen van configuratie of het blootstellen van netwerkoppervlakken):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` blijft bewust smal: het zet gangbaar open groepsbeleid om
naar allowlists, herstelt `logging.redactSensitive: "tools"`, scherpt
machtigingen voor state/config/include-bestanden aan, en gebruikt Windows ACL-resets in plaats van
POSIX `chmod` wanneer het op Windows draait.

Het markeert veelvoorkomende voetangels (blootstelling van Gateway-auth, blootstelling van browserbesturing, verhoogde allowlists, bestandssysteemmachtigingen, toegeeflijke exec-goedkeuringen en toolblootstelling via open kanalen).

OpenClaw is zowel een product als een experiment: je verbindt frontier-modelgedrag met echte messaging-oppervlakken en echte tools. **Er bestaat geen "perfect beveiligde" setup.** Het doel is bewust om te gaan met:

- wie met je bot kan praten
- waar de bot mag handelen
- wat de bot mag aanraken

Begin met de kleinste toegang die nog werkt, en verruim die daarna naarmate je meer vertrouwen krijgt.

### Dependency lock voor gepubliceerde pakketten

OpenClaw-broncheckouts gebruiken `pnpm-lock.yaml`. Het gepubliceerde `openclaw` npm-
pakket en npm-Plugin-pakketten die eigendom zijn van OpenClaw bevatten `npm-shrinkwrap.json`,
npm's publiceerbare dependency lockfile, zodat pakketinstallaties de beoordeelde
transitieve dependency-grafiek uit de release gebruiken in plaats van tijdens installatie een nieuwe grafiek
op te lossen.

Shrinkwrap is een grens voor supply-chain-hardening en release-reproduceerbaarheid,
geen sandbox. Zie [npm shrinkwrap](/nl/gateway/security/shrinkwrap) voor het model in gewone taal, maintainercommando's en
pakketinspectiecontroles.

### Implementatie en hostvertrouwen

OpenClaw gaat ervan uit dat de host- en configuratiegrens vertrouwd zijn:

- Als iemand Gateway-hoststate/config (`~/.openclaw`, inclusief `openclaw.json`) kan wijzigen, behandel diegene dan als een vertrouwde operator.
- Eén Gateway draaien voor meerdere wederzijds niet-vertrouwde/kwaadwillende operators is **geen aanbevolen setup**.
- Voor teams met gemengd vertrouwen: splits vertrouwensgrenzen met aparte Gateways (of minimaal aparte OS-gebruikers/hosts).
- Aanbevolen standaard: één gebruiker per machine/host (of VPS), één Gateway voor die gebruiker, en één of meer agents in die Gateway.
- Binnen één Gateway-instantie is geauthenticeerde operatortoegang een vertrouwde control-plane-rol, geen tenantrol per gebruiker.
- Sessie-identifiers (`sessionKey`, sessie-ID's, labels) zijn routeringsselectoren, geen autorisatietokens.
- Als meerdere mensen één agent met tools kunnen berichten, kan ieder van hen dezelfde machtigingenset sturen. Sessie-/geheugenisolatie per gebruiker helpt privacy, maar verandert een gedeelde agent niet in hostautorisatie per gebruiker.

### Veilige bestandsbewerkingen

OpenClaw gebruikt `@openclaw/fs-safe` voor root-gebonden bestandstoegang, atomische writes, archiefextractie, tijdelijke werkruimtes en helpers voor geheime bestanden. OpenClaw zet fs-safe's optionele POSIX Python-helper standaard **uit**; stel `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` of `require` alleen in wanneer je de extra fd-relatieve mutatiehardening wilt en een Python-runtime kunt ondersteunen.

Details: [Veilige bestandsbewerkingen](/nl/gateway/security/secure-file-operations).

### Gedeelde Slack-werkruimte: echt risico

Als "iedereen in Slack de bot kan berichten", is het kernrisico gedelegeerde toolbevoegdheid:

- elke toegestane afzender kan toolcalls (`exec`, browser, netwerk-/bestandstools) binnen het beleid van de agent uitlokken;
- prompt-/contentinjectie van één afzender kan acties veroorzaken die gedeelde state, apparaten of outputs beïnvloeden;
- als één gedeelde agent gevoelige referenties/bestanden heeft, kan elke toegestane afzender mogelijk exfiltratie via toolgebruik sturen.

Gebruik aparte agents/Gateways met minimale tools voor teamworkflows; houd agents met persoonlijke data privé.

### Door het bedrijf gedeelde agent: acceptabel patroon

Dit is acceptabel wanneer iedereen die die agent gebruikt binnen dezelfde vertrouwensgrens valt (bijvoorbeeld één bedrijfsteam) en de agent strikt zakelijk is afgebakend.

- draai hem op een dedicated machine/VM/container;
- gebruik een dedicated OS-gebruiker + dedicated browser/profiel/accounts voor die runtime;
- meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke wachtwoordmanager-/browserprofielen.

Als je persoonlijke en bedrijfsidentiteiten op dezelfde runtime mengt, laat je de scheiding instorten en vergroot je het risico op blootstelling van persoonlijke data.

## Vertrouwensconcept voor Gateway en node

Behandel Gateway en node als één operatorvertrouwensdomein, met verschillende rollen:

- **Gateway** is het control plane en beleidsoppervlak (`gateway.auth`, toolbeleid, routering).
- **Node** is het externe uitvoeringsoppervlak dat aan die Gateway is gekoppeld (commando's, apparaatacties, hostlokale capabilities).
- Een caller die bij de Gateway is geauthenticeerd, wordt vertrouwd binnen Gateway-scope. Na pairing zijn node-acties vertrouwde operatoracties op die node.
- Operatorscopeniveaus en controles tijdens goedkeuring worden samengevat in
  [Operatorscopes](/nl/gateway/operator-scopes).
- Directe local loopback-backendclients die zijn geauthenticeerd met het gedeelde Gateway-
  token/wachtwoord kunnen interne control-plane-RPC's uitvoeren zonder een gebruikers-
  apparaatidentiteit te presenteren. Dit is geen bypass voor externe of browserpairing: netwerk-
  clients, node-clients, device-token-clients en expliciete apparaatidentiteiten
  blijven door pairing- en scope-upgradehandhaving gaan.
- `sessionKey` is routerings-/contextselectie, geen auth per gebruiker.
- Exec-goedkeuringen (allowlist + vragen) zijn guardrails voor operatorintentie, geen vijandige multi-tenant-isolatie.
- De productstandaard van OpenClaw voor vertrouwde single-operator-setups is dat hostexec op `gateway`/`node` is toegestaan zonder goedkeuringsprompts (`security="full"`, `ask="off"` tenzij je dit aanscherpt). Die standaard is bewuste UX, op zichzelf geen kwetsbaarheid.
- Exec-goedkeuringen binden exacte requestcontext en best-effort directe lokale bestandsoperanden; ze modelleren niet semantisch elk runtime-/interpreterloaderpad. Gebruik sandboxing en hostisolatie voor sterke grenzen.

Als je isolatie voor vijandige gebruikers nodig hebt, splits vertrouwensgrenzen per OS-gebruiker/host en draai aparte Gateways.

## Vertrouwensgrenzenmatrix

Gebruik dit als snel model bij risicotriage:

| Grens of controle                                         | Wat het betekent                                  | Veelvoorkomende misvatting                                                     |
| --------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Authenticeert callers bij Gateway-API's           | "Heeft per-message signatures op elk frame nodig om veilig te zijn"            |
| `sessionKey`                                              | Routeringssleutel voor context-/sessieselectie    | "Session key is een gebruikersauthgrens"                                       |
| Prompt-/contentguardrails                                 | Verminderen risico op modelmisbruik               | "Promptinjectie alleen bewijst auth-bypass"                                    |
| `canvas.eval` / browser evaluate                          | Bewuste operatorcapability wanneer ingeschakeld   | "Elke JS eval-primitive is automatisch een kwetsbaarheid in dit vertrouwensmodel" |
| Lokale TUI `!`-shell                                      | Expliciet door operator getriggerde lokale uitvoering | "Lokale shellgemaksopdracht is externe injectie"                            |
| Node-pairing en node-commando's                           | Externe uitvoering op operatorniveau op gekoppelde apparaten | "Externe apparaatbesturing moet standaard als niet-vertrouwde gebruikerstoegang worden behandeld" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in enrollmentbeleid voor nodes op vertrouwde netwerken | "Een standaard uitgeschakelde allowlist is een automatische pairingkwetsbaarheid" |

## Geen kwetsbaarheden volgens ontwerp

<Accordion title="Veelvoorkomende bevindingen die buiten scope vallen">

Deze patronen worden vaak gemeld en worden meestal zonder actie gesloten, tenzij
een echte grensbypass wordt aangetoond:

- Ketens met alleen promptinjectie zonder beleids-, auth- of sandboxbypass.
- Claims die uitgaan van vijandige multi-tenant-werking op één gedeelde host of
  config.
- Claims die normale operatortoegang via read-paden (bijvoorbeeld
  `sessions.list` / `sessions.preview` / `chat.history`) als IDOR classificeren in een
  gedeelde-Gateway-setup.
- Bevindingen voor localhost-only implementaties (bijvoorbeeld HSTS op een Gateway die alleen via loopback bereikbaar is).
- Bevindingen over Discord inbound Webhook-signatures voor inbound paden die niet
  in deze repo bestaan.
- Rapporten die node-pairingmetadata behandelen als een verborgen tweede goedkeuringslaag per commando
  voor `system.run`, terwijl de echte uitvoeringsgrens nog steeds
  het globale node-commandobeleid van de Gateway plus de eigen exec-
  goedkeuringen van de node is.
- Rapporten die geconfigureerde `gateway.nodes.pairing.autoApproveCidrs` op zichzelf
  als een kwetsbaarheid behandelen. Deze instelling is standaard uitgeschakeld, vereist
  expliciete CIDR/IP-items, geldt alleen voor eerste `role: node`-pairing met
  geen gevraagde scopes, en keurt operator/browser/Control UI,
  WebChat, rolupgrades, scope-upgrades, metadatawijzigingen, public-key-wijzigingen,
  of loopback trusted-proxy-headerpaden op dezelfde host niet automatisch goed, tenzij loopback trusted-proxy auth expliciet was ingeschakeld.
- Bevindingen over "ontbrekende autorisatie per gebruiker" die `sessionKey` als een
  auth-token behandelen.

</Accordion>

## Versterkte basislijn in 60 seconden

Gebruik eerst deze basislijn, en schakel daarna selectief tools opnieuw in per vertrouwde agent:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Dit houdt de Gateway alleen lokaal, isoleert DM's en schakelt control-plane-/runtimetools standaard uit.

## Snelle regel voor gedeelde inbox

Als meer dan één persoon je bot kan DM'en:

- Stel `session.dmScope: "per-channel-peer"` in (of `"per-account-channel-peer"` voor kanalen met meerdere accounts).
- Houd `dmPolicy: "pairing"` of strikte toelatingslijsten aan.
- Combineer gedeelde DM's nooit met brede tooltoegang.
- Dit versterkt coöperatieve/gedeelde inboxen, maar is niet ontworpen als isolatie tegen vijandige medehuurders wanneer gebruikers schrijf toegang tot host/configuratie delen.

## Model voor contextzichtbaarheid

OpenClaw scheidt twee concepten:

- **Triggerautorisatie**: wie de agent mag triggeren (`dmPolicy`, `groupPolicy`, toelatingslijsten, mention-gates).
- **Contextzichtbaarheid**: welke aanvullende context in de modelinvoer wordt geïnjecteerd (antwoordtekst, geciteerde tekst, threadgeschiedenis, doorgestuurde metadata).

Toelatingslijsten beperken triggers en commandoautorisatie. De instelling `contextVisibility` bepaalt hoe aanvullende context (geciteerde antwoorden, thread-roots, opgehaalde geschiedenis) wordt gefilterd:

- `contextVisibility: "all"` (standaard) behoudt aanvullende context zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die door de actieve toelatingslijstcontroles zijn toegestaan.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Stel `contextVisibility` per kanaal of per ruimte/gesprek in. Zie [Groepschats](/nl/channels/groups#context-visibility-and-allowlists) voor instellingsdetails.

Advies voor triage van meldingen:

- Claims die alleen aantonen dat "het model geciteerde of historische tekst van afzenders buiten de toelatingslijst kan zien" zijn hardeningsbevindingen die met `contextVisibility` kunnen worden aangepakt, geen opzichzelfstaande omzeilingen van autorisatie- of sandboxgrenzen.
- Om beveiligingsimpact te hebben, moeten rapporten nog steeds een aangetoonde omzeiling van een vertrouwensgrens bevatten (auth, beleid, sandbox, goedkeuring of een andere gedocumenteerde grens).

## Wat de audit controleert (hoog niveau)

- **Inkomende toegang** (DM-beleid, groepsbeleid, toelatingslijsten): kunnen onbekenden de bot triggeren?
- **Tool-blastradius** (verhoogde tools + open ruimtes): kan promptinjectie leiden tot shell-/bestands-/netwerkacties?
- **Exec-bestandssysteemdrift**: worden muterende bestandssysteemtools geweigerd terwijl `exec`/`process` beschikbaar blijven zonder sandboxbeperkingen voor het bestandssysteem?
- **Exec-goedkeuringsdrift** (`security=full`, `autoAllowSkills`, interpreter-toelatingslijsten zonder `strictInlineEval`): doen host-exec-guardrails nog steeds wat je denkt dat ze doen?
  - `security="full"` is een brede waarschuwing over de houding, geen bewijs van een bug. Het is de gekozen standaard voor vertrouwde personal-assistant-installaties; verscherp dit alleen wanneer je dreigingsmodel goedkeurings- of toelatingslijstguardrails vereist.
- **Netwerkblootstelling** (Gateway-bind/auth, Tailscale Serve/Funnel, zwakke/korte auth-tokens).
- **Blootstelling van browserbesturing** (externe nodes, relaypoorten, externe CDP-eindpunten).
- **Lokale schijfhygiëne** (machtigingen, symlinks, config-includes, paden naar "gesynchroniseerde mappen").
- **Plugins** (plugins laden zonder expliciete toelatingslijst).
- **Beleidsdrift/misconfiguratie** (sandbox-dockerinstellingen geconfigureerd maar sandboxmodus uit; ineffectieve `gateway.nodes.denyCommands`-patronen omdat matching alleen op exacte commandonaam gebeurt (bijvoorbeeld `system.run`) en shelltekst niet wordt geïnspecteerd; gevaarlijke `gateway.nodes.allowCommands`-items; globale `tools.profile="minimal"` overschreven door per-agent-profielen; plugin-eigen tools bereikbaar onder permissief toolbeleid).
- **Runtimeverwachtingsdrift** (bijvoorbeeld aannemen dat impliciete exec nog steeds `sandbox` betekent wanneer `tools.exec.host` nu standaard `auto` is, of expliciet `tools.exec.host="sandbox"` instellen terwijl sandboxmodus uit staat).
- **Modelhygiëne** (waarschuw wanneer geconfigureerde modellen verouderd lijken; geen harde blokkade).

Als je `--deep` uitvoert, probeert OpenClaw ook een best-effort live Gateway-probe.

## Overzicht van opslag van referenties

Gebruik dit bij het auditen van toegang of het bepalen waarvan je een back-up moet maken:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env-/file-/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Pairing-toelatingslijsten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-auth-profielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex-runtimestatus (standaard)**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Gedeelde Codex-runtimestatus (opt-in)**: `$CODEX_HOME` of `~/.codex` wanneer
  `plugins.entries.codex.config.appServer.homeScope` `"user"` is. Deze modus gebruikt
  het native Codex-account, de config, plugins en threadopslag; schakel dit alleen in voor
  een door de eigenaar beheerde lokale Gateway. Zie [Codex-harnas](/nl/plugins/codex-harness#share-threads-with-codex-desktop-and-cli).
- **Bestandsgedragen secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`

## Checklist voor beveiligingsaudit

Wanneer de audit bevindingen afdrukt, behandel dit als prioriteitsvolgorde:

1. **Alles wat "open" is + tools ingeschakeld**: vergrendel eerst DM's/groepen (pairing/toelatingslijsten), verscherp daarna toolbeleid/sandboxing.
2. **Publieke netwerkblootstelling** (LAN-bind, Funnel, ontbrekende auth): direct oplossen.
3. **Externe blootstelling van browserbesturing**: behandel dit als operatortoegang (alleen tailnet, pair nodes bewust, vermijd publieke blootstelling).
4. **Machtigingen**: zorg dat status/config/referenties/auth niet leesbaar zijn voor groep/wereld.
5. **Plugins**: laad alleen wat je expliciet vertrouwt.
6. **Modelkeuze**: geef de voorkeur aan moderne, instructiegeharde modellen voor elke bot met tools.

## Begrippenlijst voor beveiligingsaudit

Elke auditbevinding wordt geïdentificeerd met een gestructureerde `checkId` (bijvoorbeeld
`gateway.bind_no_auth` of `tools.exec.security_full_configured`). Veelvoorkomende
kritieke ernstklassen:

- `fs.*` - bestandssysteemmachtigingen voor status, config, referenties, auth-profielen.
- `gateway.*` - bindmodus, auth, Tailscale, Control UI, trusted-proxy-instelling.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening per oppervlak.
- `plugins.*`, `skills.*` - bevindingen rond plugin-/skill-supplychain en scans.
- `security.exposure.*` - doorsnijdende controles waar toegangsbeleid en tool-blastradius samenkomen.

Zie de volledige catalogus met ernstniveaus, fix-sleutels en auto-fix-ondersteuning op
[Beveiligingsauditcontroles](/nl/gateway/security/audit-checks).

## Control UI via HTTP

De Control UI heeft een **beveiligde context** (HTTPS of localhost) nodig om apparaatidentiteit
te genereren. `gateway.controlUi.allowInsecureAuth` is een lokale compatibiliteitsschakelaar:

- Op localhost staat dit Control UI-auth toe zonder apparaatidentiteit wanneer de pagina
  via onbeveiligde HTTP wordt geladen.
- Het omzeilt geen pairingcontroles.
- Het versoepelt geen vereisten voor apparaatidentiteit op afstand (niet-localhost).

Geef de voorkeur aan HTTPS (Tailscale Serve) of open de UI op `127.0.0.1`.

Alleen voor break-glass-scenario's schakelt `gateway.controlUi.dangerouslyDisableDeviceAuth`
apparaatidentiteitscontroles volledig uit. Dit is een ernstige beveiligingsverlaging;
laat dit uit tenzij je actief debugt en snel kunt terugdraaien.

Los van die gevaarlijke flags kunnen succesvolle `gateway.auth.mode: "trusted-proxy"`-
sessies **operator**-Control UI-sessies toelaten zonder apparaatidentiteit. Dat is
bedoeld gedrag van de auth-modus, geen `allowInsecureAuth`-shortcut, en het geldt nog steeds
niet voor Control UI-sessies met node-rol.

`openclaw security audit` waarschuwt wanneer deze instelling is ingeschakeld.

## Samenvatting van onveilige of gevaarlijke flags

`openclaw security audit` geeft `config.insecure_or_dangerous_flags` wanneer
bekende onveilige/gevaarlijke debugschakelaars zijn ingeschakeld. Laat deze uitgeschakeld in
productie. Elke ingeschakelde flag wordt als eigen bevinding gerapporteerd. Als audit-
onderdrukkingen zijn geconfigureerd, blijft `security.audit.suppressions.active` in de
actieve audituitvoer staan, zelfs wanneer overeenkomende bevindingen naar `suppressedFindings` gaan.

<AccordionGroup>
  <Accordion title="Flags die vandaag door de audit worden gevolgd">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Alle `dangerous*` / `dangerously*`-sleutels in het configschema">
    Control UI en browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Kanaalnaammatching (gebundelde en plugin-kanalen; ook beschikbaar per
    `accounts.<accountId>` waar van toepassing):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (plugin-kanaal)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (plugin-kanaal)
    - `channels.zalouser.dangerouslyAllowNameMatching` (plugin-kanaal)
    - `channels.irc.dangerouslyAllowNameMatching` (plugin-kanaal)
    - `channels.mattermost.dangerouslyAllowNameMatching` (plugin-kanaal)

    Netwerkblootstelling:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (ook per account)

    Sandbox Docker (standaarden + per agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Reverse-proxyconfiguratie

Als je de Gateway achter een reverse proxy draait (nginx, Caddy, Traefik, enz.), configureer
`gateway.trustedProxies` voor correcte verwerking van forwarded-client-IP's.

Wanneer de Gateway proxyheaders detecteert vanaf een adres dat **niet** in `trustedProxies` staat, behandelt hij verbindingen **niet** als lokale clients. Als gateway-auth is uitgeschakeld, worden die verbindingen geweigerd. Dit voorkomt authenticatieomzeiling waarbij geproxiede verbindingen anders van localhost lijken te komen en automatisch vertrouwen krijgen.

`gateway.trustedProxies` voedt ook `gateway.auth.mode: "trusted-proxy"`, maar die auth-modus is strenger:

- trusted-proxy-auth **faalt standaard gesloten bij proxies met loopback-bron**
- same-host loopback reverse proxies kunnen `gateway.trustedProxies` gebruiken voor lokale-clientdetectie en forwarded-IP-verwerking
- same-host loopback reverse proxies kunnen alleen aan `gateway.auth.mode: "trusted-proxy"` voldoen wanneer `gateway.auth.trustedProxy.allowLoopback = true`; gebruik anders token-/wachtwoordauth

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optioneel. Standaard false.
  # Alleen inschakelen als je proxy geen X-Forwarded-For kan leveren.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Wanneer `trustedProxies` is geconfigureerd, gebruikt de Gateway `X-Forwarded-For` om het client-IP te bepalen. `X-Real-IP` wordt standaard genegeerd tenzij `gateway.allowRealIpFallback: true` expliciet is ingesteld.

Trusted-proxyheaders maken node-device-pairing niet automatisch vertrouwd.
`gateway.nodes.pairing.autoApproveCidrs` is een afzonderlijk, standaard uitgeschakeld
operatorbeleid. Zelfs wanneer ingeschakeld, worden headerpaden van trusted-proxy's met
loopback-bron uitgesloten van automatische node-goedkeuring omdat lokale callers die
headers kunnen vervalsen, ook wanneer loopback trusted-proxy-auth expliciet is ingeschakeld.

Goed reverse-proxygedrag (inkomende forwardingheaders overschrijven):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Slecht reverse-proxygedrag (niet-vertrouwde forwardingheaders toevoegen/behouden):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS- en oorsprongsnotities

- OpenClaw gateway is eerst lokaal/loopback. Als je TLS beëindigt bij een reverse proxy, stel HSTS daar in op het proxy-gerichte HTTPS-domein.
- Als de gateway zelf HTTPS beëindigt, kun je `gateway.http.securityHeaders.strictTransportSecurity` instellen om de HSTS-header uit OpenClaw-responses te verzenden.
- Gedetailleerde implementatierichtlijnen staan in [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Voor niet-loopback Control UI-implementaties is `gateway.controlUi.allowedOrigins` standaard vereist.
- `gateway.controlUi.allowedOrigins: ["*"]` is een expliciet beleid dat alle browser-origins toestaat, geen geharde standaard. Vermijd dit buiten strikt gecontroleerde lokale tests.
- Browser-origin-authenticatiefouten op loopback blijven rate-limited, zelfs wanneer de
  algemene loopback-vrijstelling is ingeschakeld, maar de lockout-sleutel is scoped per
  genormaliseerde `Origin`-waarde in plaats van één gedeelde localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt Host-header-origin-fallbackmodus in; behandel dit als een gevaarlijk, door de operator gekozen beleid.
- Behandel DNS-rebinding en proxy-hostheadergedrag als implementatiehardening; houd `trustedProxies` strikt en vermijd directe blootstelling van de gateway aan het openbare internet.

## Lokale sessielogs staan op schijf

OpenClaw slaat sessietranscripten op schijf op onder `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Dit is vereist voor sessiecontinuïteit en (optioneel) indexering van sessiegeheugen, maar het betekent ook dat
**elk proces/elke gebruiker met bestandssysteemtoegang die logs kan lezen**. Behandel schijftoegang als de vertrouwensgrens
en vergrendel de machtigingen op `~/.openclaw` (zie de auditsectie hieronder). Als je
sterkere isolatie tussen agents nodig hebt, voer ze dan uit onder afzonderlijke OS-gebruikers of afzonderlijke hosts.

## Node-uitvoering (system.run)

Als een macOS-node is gekoppeld, kan de Gateway `system.run` op die node aanroepen. Dit is **remote code execution** op de Mac:

- Vereist node-koppeling (goedkeuring + token).
- Gateway-nodekoppeling is geen goedkeuringsvlak per opdracht. Het stelt node-identiteit/vertrouwen en tokenuitgifte vast.
- De Gateway past een grof globaal node-opdrachtbeleid toe via `gateway.nodes.allowCommands` / `denyCommands`.
- Beheerd op de Mac via **Settings → Exec approvals** (security + ask + allowlist).
- Het per-node `system.run`-beleid is het eigen exec-goedkeuringsbestand van de node (`exec.approvals.node.*`), dat strenger of losser kan zijn dan het globale command-ID-beleid van de gateway.
- Een node die draait met `security="full"` en `ask="off"` volgt het standaardmodel voor vertrouwde operators. Behandel dat als verwacht gedrag, tenzij je implementatie expliciet een strenger goedkeurings- of allowlist-standpunt vereist.
- Goedkeuringsmodus bindt de exacte requestcontext en, waar mogelijk, één concreet lokaal script-/bestandsoperand. Als OpenClaw niet precies één direct lokaal bestand voor een interpreter-/runtime-opdracht kan identificeren, wordt uitvoering op basis van goedkeuring geweigerd in plaats van volledige semantische dekking te beloven.
- Voor `host=node` slaan goedgekeurde runs ook een canoniek voorbereide
  `systemRunPlan` op; latere goedgekeurde forwards hergebruiken dat opgeslagen plan, en gateway-
  validatie wijst wijzigingen van de caller aan command/cwd/session-context af nadat de
  goedkeuringsaanvraag is aangemaakt.
- Als je geen uitvoering op afstand wilt, stel security in op **deny** en verwijder node-koppeling voor die Mac.

Dit onderscheid is belangrijk voor triage:

- Een opnieuw verbindende gekoppelde node die een andere commandolijst adverteert, is op zichzelf geen kwetsbaarheid als het globale Gateway-beleid en de lokale exec-goedkeuringen van de node nog steeds de daadwerkelijke uitvoeringsgrens afdwingen.
- Meldingen die node-koppelingsmetadata behandelen als een tweede verborgen goedkeuringslaag per opdracht zijn meestal beleids-/UX-verwarring, geen omzeiling van een beveiligingsgrens.

## Dynamische Skills (watcher / remote nodes)

OpenClaw kan de Skills-lijst midden in een sessie vernieuwen:

- **Skills-watcher**: wijzigingen aan `SKILL.md` kunnen de Skills-snapshot bij de volgende agentbeurt bijwerken.
- **Remote nodes**: het verbinden van een macOS-node kan macOS-only Skills eligible maken (op basis van bin-probing).

Behandel Skills-mappen als **vertrouwde code** en beperk wie ze kan wijzigen.

## Het threat model

Je AI-assistent kan:

- Willekeurige shell-opdrachten uitvoeren
- Bestanden lezen/schrijven
- Netwerkservices benaderen
- Berichten naar iedereen sturen (als je hem WhatsApp-toegang geeft)

Mensen die je berichten sturen kunnen:

- Proberen je AI te misleiden om slechte dingen te doen
- Via social engineering toegang tot je data proberen te krijgen
- Infrastructuurdetails aftasten

## Kernconcept: toegangscontrole vóór intelligentie

De meeste fouten hier zijn geen geavanceerde exploits - het is "iemand stuurde de bot een bericht en de bot deed wat werd gevraagd."

OpenClaw's standpunt:

- **Eerst identiteit:** beslis wie met de bot mag praten (DM-koppeling / allowlists / expliciet "open").
- **Daarna scope:** beslis waar de bot mag handelen (groep-allowlists + mention-gating, tools, sandboxing, apparaatmachtigingen).
- **Model als laatste:** ga ervan uit dat het model kan worden gemanipuleerd; ontwerp zo dat manipulatie een beperkte blast radius heeft.

## Model voor opdrachtautorisatie

Slash-opdrachten en directives worden alleen gehonoreerd voor **geautoriseerde afzenders**. Autorisatie wordt afgeleid uit
kanaal-allowlists/koppeling plus `commands.useAccessGroups` (zie [Configuratie](/nl/gateway/configuration)
en [Slash-opdrachten](/nl/tools/slash-commands)). Als een kanaal-allowlist leeg is of `"*"` bevat,
zijn opdrachten effectief open voor dat kanaal.

`/exec` is een sessiegebonden gemak voor geautoriseerde operators. Het schrijft **geen** config en
wijzigt geen andere sessies.

## Risico van control-plane-tools

Twee ingebouwde tools kunnen blijvende control-plane-wijzigingen aanbrengen:

- `gateway` kan config inspecteren met `config.schema.lookup` / `config.get`, en kan blijvende wijzigingen aanbrengen met `config.apply`, `config.patch` en `update.run`.
- `cron` kan geplande jobs maken die blijven draaien nadat de oorspronkelijke chat/taak eindigt.

De agent-facing `gateway` runtime-tool blijft weigeren om
`tools.exec.ask` of `tools.exec.security` te herschrijven; legacy `tools.bash.*`-aliassen worden
genormaliseerd naar dezelfde beschermde exec-paden voordat er wordt geschreven.
Door agents gestuurde `gateway config.apply`- en `gateway config.patch`-bewerkingen
fail-closed standaard: alleen een smalle set low-risk runtime-tuning,
mention-gating en zichtbare-reply-paden is agent-tunable. Globale modelstandaarden
en prompt-overlays blijven door operators beheerd. Nieuwe gevoelige config-trees zijn
daarom beschermd, tenzij ze bewust aan de allowlist worden toegevoegd.

Voor elke agent/surface die onvertrouwde content verwerkt, weiger deze standaard:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokkeert alleen herstartacties. Het schakelt `gateway` config-/update-acties niet uit.

## Plugins

Plugins draaien **in-process** met de Gateway. Behandel ze als vertrouwde code:

- Installeer alleen plugins uit bronnen die je vertrouwt.
- Geef de voorkeur aan expliciete `plugins.allow`-allowlists.
- Controleer pluginconfig voordat je inschakelt.
- Herstart de Gateway na pluginwijzigingen.
- Als je plugins installeert of bijwerkt (`openclaw plugins install <package>`, `openclaw plugins update <id>`), behandel dit alsof je onvertrouwde code uitvoert:
  - Het installatiepad is de per-plugin-directory onder de actieve plugin-installatieroot.
  - OpenClaw voert tijdens install/update geen ingebouwde lokale blokkering van gevaarlijke code uit. Gebruik `security.installPolicy` voor door operators beheerde lokale allow/block-beslissingen en `openclaw security audit --deep` voor diagnostische scanning.
  - npm- en git-plugininstallaties voeren package-manager dependency convergence alleen uit tijdens de expliciete install/update-flow. Lokale paden en archieven worden behandeld als self-contained pluginpakketten; OpenClaw kopieert/verwijst ernaar zonder `npm install` uit te voeren.
  - Geef de voorkeur aan gepinde, exacte versies (`@scope/pkg@1.2.3`) en inspecteer de uitgepakte code op schijf voordat je inschakelt.
  - `--dangerously-force-unsafe-install` is deprecated en verandert plugin-install/update-gedrag niet meer.
  - Configureer `security.installPolicy` wanneer operators een vertrouwde lokale opdracht nodig hebben om host-specifieke allow/block-beslissingen te nemen voor Skills- en plugininstallaties. Dit beleid draait nadat bronmateriaal is gestaged maar voordat installatie doorgaat, geldt ook voor ClawHub Skills en wordt niet omzeild door deprecated unsafe flags.

Details: [Plugins](/nl/tools/plugin)

## DM-toegangsmodel: koppeling, allowlist, open, disabled

Alle huidige DM-capable kanalen ondersteunen een DM-beleid (`dmPolicy` of `*.dm.policy`) dat inkomende DM's gate **voordat** het bericht wordt verwerkt:

- `pairing` (standaard): onbekende afzenders ontvangen een korte koppelingscode en de bot negeert hun bericht totdat het is goedgekeurd. Codes verlopen na 1 uur; herhaalde DM's sturen geen code opnieuw totdat een nieuwe aanvraag is aangemaakt. Openstaande aanvragen zijn standaard beperkt tot **3 per kanaal**.
- `allowlist`: onbekende afzenders worden geblokkeerd (geen pairing-handshake).
- `open`: sta iedereen toe om te DM'en (publiek). **Vereist** dat de kanaal-allowlist `"*"` bevat (expliciete opt-in).
- `disabled`: negeer inkomende DM's volledig.

Goedkeuren via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + bestanden op schijf: [Koppeling](/nl/channels/pairing)

## DM-sessie-isolatie (multi-user-modus)

Standaard routeert OpenClaw **alle DM's naar de hoofdsessie**, zodat je assistent continuïteit heeft over apparaten en kanalen heen. Als **meerdere mensen** de bot kunnen DM'en (open DM's of een multi-person allowlist), overweeg dan DM-sessies te isoleren:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Dit voorkomt contextlekkage tussen gebruikers terwijl groepschats geïsoleerd blijven.

Dit is een messaging-contextgrens, geen host-admin-grens. Als gebruikers onderling adversarial zijn en dezelfde Gateway-host/config delen, voer dan in plaats daarvan afzonderlijke gateways per vertrouwensgrens uit.

### Veilige DM-modus (aanbevolen)

Behandel het fragment hierboven als **veilige DM-modus**:

- Standaard: `session.dmScope: "main"` (alle DM's delen één sessie voor continuïteit).
- Standaard voor lokale CLI-onboarding: schrijft `session.dmScope: "per-channel-peer"` wanneer unset (behoudt bestaande expliciete waarden).
- Veilige DM-modus: `session.dmScope: "per-channel-peer"` (elk kanaal+afzender-paar krijgt een geïsoleerde DM-context).
- Cross-channel peer-isolatie: `session.dmScope: "per-peer"` (elke afzender krijgt één sessie over alle kanalen van hetzelfde type).

Als je meerdere accounts op hetzelfde kanaal gebruikt, gebruik dan in plaats daarvan `per-account-channel-peer`. Als dezelfde persoon contact met je opneemt via meerdere kanalen, gebruik dan `session.identityLinks` om die DM-sessies samen te voegen tot één canonieke identiteit. Zie [Sessiebeheer](/nl/concepts/session) en [Configuratie](/nl/gateway/configuration).

## Allowlists voor DM's en groepen

OpenClaw heeft twee afzonderlijke "wie kan mij triggeren?"-lagen:

- **DM-allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): wie met de bot mag praten in directe berichten.
  - Wanneer `dmPolicy="pairing"` is, worden goedkeuringen geschreven naar de accountgebonden pairing-allowlistopslag onder `~/.openclaw/credentials/` (`<channel>-allowFrom.json` voor het standaardaccount, `<channel>-<accountId>-allowFrom.json` voor niet-standaardaccounts), samengevoegd met configuratie-allowlists.
- **Groepsallowlist** (kanaalspecifiek): van welke groepen/kanalen/guilds de bot uberhaupt berichten accepteert.
  - Veelvoorkomende patronen:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: standaardwaarden per groep zoals `requireMention`; wanneer ingesteld, werkt dit ook als groepsallowlist (neem `"*"` op om allow-all-gedrag te behouden).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: beperk wie de bot _binnen_ een groepssessie kan activeren (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists per oppervlak + standaardwaarden voor vermeldingen.
  - Groepscontroles worden in deze volgorde uitgevoerd: eerst `groupPolicy`/groepsallowlists, daarna activering via vermelding/antwoord.
  - Antwoorden op een botbericht (impliciete vermelding) omzeilt afzender-allowlists zoals `groupAllowFrom` **niet**.
  - **Beveiligingsopmerking:** behandel `dmPolicy="open"` en `groupPolicy="open"` als instellingen voor noodgevallen. Ze zouden nauwelijks gebruikt moeten worden; geef de voorkeur aan pairing + allowlists, tenzij je elk lid van de ruimte volledig vertrouwt.

Details: [Configuratie](/nl/gateway/configuration) en [Groepen](/nl/channels/groups)

## Promptinjectie (wat het is, waarom het belangrijk is)

Promptinjectie is wanneer een aanvaller een bericht opstelt dat het model manipuleert om iets onveiligs te doen ("negeer je instructies", "dump je bestandssysteem", "volg deze link en voer opdrachten uit", enz.).

Zelfs met sterke systeemprompts is **promptinjectie niet opgelost**. Guardrails in systeemprompts zijn alleen zachte richtlijnen; harde afdwinging komt van toolbeleid, uitvoeringsgoedkeuringen, sandboxing en kanaal-allowlists (en operators kunnen deze bewust uitschakelen). Wat in de praktijk helpt:

- Houd inkomende DM's vergrendeld (pairing/allowlists).
- Geef in groepen de voorkeur aan activering via vermeldingen; vermijd "altijd-aan"-bots in openbare ruimtes.
- Behandel links, bijlagen en geplakte instructies standaard als vijandig.
- Voer gevoelige tooluitvoering uit in een sandbox; houd geheimen buiten het bestandssysteem dat de agent kan bereiken.
- Opmerking: sandboxing is opt-in. Als sandboxmodus uit staat, wordt impliciet `host=auto` omgezet naar de gatewayhost. Expliciet `host=sandbox` faalt nog steeds gesloten omdat er geen sandboxruntime beschikbaar is. Stel `host=gateway` in als je wilt dat dit gedrag expliciet in de configuratie staat.
- Beperk tools met hoog risico (`exec`, `browser`, `web_fetch`, `web_search`) tot vertrouwde agents of expliciete allowlists.
- Als je interpreters toestaat (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), schakel dan `tools.exec.strictInlineEval` in zodat inline-eval-vormen nog steeds expliciete goedkeuring vereisen.
- Shell-goedkeuringsanalyse wijst ook POSIX-parameterexpansievormen (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) binnen **niet-gequote heredocs** af, zodat een heredoc-body op de allowlist geen shell-expansie als platte tekst langs allowlist-review kan smokkelen. Quote de heredoc-terminator (bijvoorbeeld `<<'EOF'`) om te kiezen voor letterlijke body-semantiek; niet-gequote heredocs die variabelen zouden hebben uitgebreid, worden afgewezen.
- **Modelkeuze is belangrijk:** oudere/kleinere/legacy modellen zijn aanzienlijk minder robuust tegen promptinjectie en misbruik van tools. Gebruik voor agents met tools het sterkste beschikbare model van de nieuwste generatie dat is gehard voor instructies.

Rode vlaggen om als onvertrouwd te behandelen:

- "Lees dit bestand/deze URL en doe precies wat er staat."
- "Negeer je systeemprompt of veiligheidsregels."
- "Onthul je verborgen instructies of tooluitvoer."
- "Plak de volledige inhoud van ~/.openclaw of je logs."

## Sanitization van speciale tokens in externe content

OpenClaw verwijdert veelvoorkomende letterlijke special-token-waarden van chattemplates voor self-hosted LLM's uit ingepakte externe content en metadata voordat ze het model bereiken. Gedekte markerfamilies omvatten Qwen/ChatML, Llama, Gemma, Mistral, Phi en GPT-OSS role/turn-tokens.

Waarom:

- OpenAI-compatibele backends die self-hosted modellen aanbieden, behouden soms speciale tokens die in gebruikerstekst verschijnen, in plaats van ze te maskeren. Een aanvaller die naar inkomende externe content kan schrijven (een opgehaalde pagina, een e-mailbody, tooluitvoer met bestandsinhoud) zou anders een synthetische `assistant`- of `system`-rolgrens kunnen injecteren en ontsnappen aan de guardrails voor ingepakte content.
- Sanitization gebeurt in de laag voor het inpakken van externe content, zodat dit uniform geldt voor fetch/read-tools en inkomende kanaalcontent in plaats van per provider.
- Uitgaande modelreacties hebben al een aparte sanitizer die gelekte `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` en vergelijkbare interne runtime-scaffolding verwijdert uit gebruikerszichtbare antwoorden bij de uiteindelijke kanaalafleveringsgrens. De sanitizer voor externe content is de inkomende tegenhanger.

Dit vervangt niet de andere hardening op deze pagina - `dmPolicy`, allowlists, uitvoeringsgoedkeuringen, sandboxing en `contextVisibility` doen nog steeds het primaire werk. Het sluit een specifieke bypass op tokenizerlaag tegen self-hosted stacks die gebruikerstekst met speciale tokens intact doorsturen.

## Onveilige bypassvlaggen voor externe content

OpenClaw bevat expliciete bypassvlaggen die veiligheidswrapping van externe content uitschakelen:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron-payloadveld `allowUnsafeExternalContent`

Richtlijnen:

- Laat deze in productie niet ingesteld/false.
- Schakel ze alleen tijdelijk in voor strikt afgebakende debugging.
- Indien ingeschakeld, isoleer die agent (sandbox + minimale tools + toegewezen sessienamespace).

Risico-opmerking voor hooks:

- Hook-payloads zijn onvertrouwde content, zelfs wanneer aflevering afkomstig is van systemen die je beheert (mail/docs/webcontent kan promptinjectie bevatten).
- Zwakke modellagen vergroten dit risico. Geef voor hook-gedreven automatisering de voorkeur aan sterke moderne modellagen en houd toolbeleid strikt (`tools.profile: "messaging"` of strenger), plus sandboxing waar mogelijk.

### Promptinjectie vereist geen openbare DM's

Zelfs als **alleen jij** de bot berichten kunt sturen, kan promptinjectie nog steeds plaatsvinden via
elke **onvertrouwde content** die de bot leest (webzoek-/fetchresultaten, browserpagina's,
e-mails, docs, bijlagen, geplakte logs/code). Met andere woorden: de afzender is niet
het enige dreigingsoppervlak; de **content zelf** kan vijandige instructies bevatten.

Wanneer tools zijn ingeschakeld, is het typische risico het exfiltreren van context of het activeren van
toolaanroepen. Verklein de blast radius door:

- Een alleen-lezen of tool-uitgeschakelde **reader agent** te gebruiken om onvertrouwde content samen te vatten,
  en daarna de samenvatting aan je hoofdagent door te geven.
- `web_search` / `web_fetch` / `browser` uit te laten voor agents met tools, tenzij nodig.
- Voor OpenResponses-URL-invoer (`input_file` / `input_image`) strikte
  `gateway.http.endpoints.responses.files.urlAllowlist` en
  `gateway.http.endpoints.responses.images.urlAllowlist` in te stellen, en `maxUrlParts` laag te houden.
  Lege allowlists worden behandeld als niet ingesteld; gebruik `files.allowUrl: false` / `images.allowUrl: false`
  als je URL-fetching volledig wilt uitschakelen.
- Voor OpenResponses-bestandsinvoer wordt gedecodeerde `input_file`-tekst nog steeds geinjecteerd als
  **onvertrouwde externe content**. Vertrouw er niet op dat bestandstekst vertrouwd is alleen omdat
  de Gateway deze lokaal heeft gedecodeerd. Het geinjecteerde blok bevat nog steeds expliciete
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>`-grensmarkers plus `Source: External`-metadata,
  ook al laat dit pad de langere `SECURITY NOTICE:`-banner weg.
- Dezelfde markergebaseerde wrapping wordt toegepast wanneer media-understanding tekst extraheert
  uit bijgevoegde documenten voordat die tekst aan de mediaprompt wordt toegevoegd.
- Sandboxing en strikte tool-allowlists in te schakelen voor elke agent die onvertrouwde invoer raakt.
- Geheimen buiten prompts te houden; geef ze in plaats daarvan door via env/config op de gatewayhost.

### Self-hosted LLM-backends

OpenAI-compatibele self-hosted backends zoals vLLM, SGLang, TGI, LM Studio,
of aangepaste Hugging Face-tokenizerstacks kunnen verschillen van gehoste providers in hoe
speciale chattemplate-tokens worden verwerkt. Als een backend letterlijke strings tokenizet
zoals `<|im_start|>`, `<|start_header_id|>` of `<start_of_turn>` als
structurele chattemplate-tokens binnen gebruikerscontent, kan onvertrouwde tekst proberen
rolgrenzen op tokenizerlaag te vervalsen.

OpenClaw verwijdert veelvoorkomende letterlijke special-token-waarden per modelfamilie uit ingepakte
externe content voordat die naar het model wordt verzonden. Houd wrapping van externe content
ingeschakeld, en geef de voorkeur aan backendinstellingen die speciale
tokens in door gebruikers aangeleverde content splitsen of escapen wanneer beschikbaar. Gehoste providers zoals OpenAI
en Anthropic passen al hun eigen sanitization aan de requestzijde toe.

### Modelsterkte (beveiligingsopmerking)

Weerstand tegen promptinjectie is **niet** uniform over modellagen. Kleinere/goedkopere modellen zijn doorgaans gevoeliger voor toolmisbruik en instructiekaping, vooral onder vijandige prompts.

<Warning>
Voor agents met tools of agents die onvertrouwde content lezen, is het promptinjectierisico met oudere/kleinere modellen vaak te hoog. Voer die workloads niet uit op zwakke modellagen.
</Warning>

Aanbevelingen:

- **Gebruik het nieuwste generatie, beste-tier model** voor elke bot die tools kan uitvoeren of bestanden/netwerken kan aanraken.
- **Gebruik geen oudere/zwakkere/kleinere tiers** voor agents met tools of onvertrouwde inboxen; het promptinjectierisico is te hoog.
- Als je een kleiner model moet gebruiken, **verklein de blast radius** (alleen-lezen tools, sterke sandboxing, minimale bestandssysteemtoegang, strikte allowlists).
- Wanneer je kleine modellen draait, **schakel sandboxing in voor alle sessies** en **schakel web_search/web_fetch/browser uit**, tenzij invoer strikt gecontroleerd is.
- Voor chat-only persoonlijke assistenten met vertrouwde invoer en geen tools zijn kleinere modellen meestal prima.

## Reasoning en uitgebreide uitvoer in groepen

`/reasoning`, `/verbose` en `/trace` kunnen interne reasoning, tooluitvoer
of Plugin-diagnostiek blootstellen die
niet bedoeld was voor een openbaar kanaal. Behandel ze in groepsinstellingen als **alleen debug**
en houd ze uitgeschakeld tenzij je ze expliciet nodig hebt.

Richtlijnen:

- Houd `/reasoning`, `/verbose` en `/trace` uitgeschakeld in openbare ruimtes.
- Als je ze inschakelt, doe dat dan alleen in vertrouwde DM's of strikt gecontroleerde ruimtes.
- Onthoud: uitgebreide en trace-uitvoer kan toolargumenten, URL's, Plugin-diagnostiek en data bevatten die het model heeft gezien.

## Voorbeelden voor configuratiehardening

### Bestandsrechten

Houd config + state prive op de gatewayhost:

- `~/.openclaw/openclaw.json`: `600` (alleen gebruiker lezen/schrijven)
- `~/.openclaw`: `700` (alleen gebruiker)

`openclaw doctor` kan waarschuwen en aanbieden om deze rechten aan te scherpen.

### Netwerkblootstelling (bind, poort, firewall)

De Gateway multiplexet **WebSocket + HTTP** op een enkele poort:

- Standaard: `18789`
- Configuratie/vlaggen/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Dit HTTP-oppervlak omvat de Control UI en de canvashost:

- Control UI (SPA-assets) (standaardbasispad `/`)
- Canvashost: `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` (willekeurige HTML/JS; behandel als onvertrouwde content)

Als je canvascontent in een normale browser laadt, behandel die dan als elke andere onvertrouwde webpagina:

- Stel de canvashost niet bloot aan onvertrouwde netwerken/gebruikers.
- Laat canvascontent niet dezelfde origin delen als bevoorrechte weboppervlakken, tenzij je de implicaties volledig begrijpt.

Bindmodus bepaalt waar de Gateway luistert:

- `gateway.bind: "loopback"` (standaard): alleen lokale clients kunnen verbinding maken.
- Niet-loopback-binds (`"lan"`, `"tailnet"`, `"custom"`) vergroten het aanvalsoppervlak. Gebruik ze alleen met gateway-authenticatie (gedeeld token/wachtwoord of een correct geconfigureerde vertrouwde proxy) en een echte firewall.

Vuistregels:

- Geef de voorkeur aan Tailscale Serve boven LAN-binds (Serve houdt de Gateway op loopback en Tailscale regelt de toegang).
- Als je aan LAN moet binden, scherm de poort dan met een firewall af tot een strikte allowlist van bron-IP's; forward de poort niet breed.
- Stel de Gateway nooit zonder authenticatie beschikbaar op `0.0.0.0`.

### Docker-poortpublicatie met UFW

Als je OpenClaw met Docker op een VPS draait, onthoud dan dat gepubliceerde containerpoorten
(`-p HOST:CONTAINER` of Compose `ports:`) via Docker's forwarding
chains worden gerouteerd, niet alleen via host-`INPUT`-regels.

Om Docker-verkeer in lijn te houden met je firewallbeleid, dwing je regels af in
`DOCKER-USER` (deze chain wordt geëvalueerd vóór Docker's eigen accept-regels).
Op veel moderne distro's gebruiken `iptables`/`ip6tables` de `iptables-nft`-frontend
en passen ze deze regels nog steeds toe op de nftables-backend.

Minimaal allowlist-voorbeeld (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 heeft aparte tabellen. Voeg een overeenkomend beleid toe in `/etc/ufw/after6.rules` als
Docker IPv6 is ingeschakeld.

Vermijd het hardcoderen van interfacenamen zoals `eth0` in documentatiefragmenten. Interfacenamen
verschillen per VPS-image (`ens3`, `enp*`, enz.) en mismatches kunnen per ongeluk
je deny-regel overslaan.

Snelle validatie na herladen:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Verwachte externe poorten zouden alleen moeten zijn wat je bewust beschikbaar stelt (voor de meeste
setups: SSH + je reverse-proxypoorten).

### mDNS/Bonjour-detectie

Wanneer de gebundelde `bonjour`-Plugin is ingeschakeld, zendt de Gateway zijn aanwezigheid uit via mDNS (`_openclaw-gw._tcp` op poort 5353) voor lokale apparaatdetectie. In volledige modus omvat dit TXT-records die operationele details kunnen blootgeven:

- `cliPath`: volledig bestandssysteempad naar de CLI-binary (onthult gebruikersnaam en installatielocatie)
- `sshPort`: adverteert SSH-beschikbaarheid op de host
- `displayName`, `lanHost`: hostnaaminformatie

**Overweging voor operationele beveiliging:** Het uitzenden van infrastructuurdetails maakt verkenning eenvoudiger voor iedereen op het lokale netwerk. Zelfs "onschuldige" info zoals bestandssysteempaden en SSH-beschikbaarheid helpt aanvallers je omgeving in kaart te brengen.

**Aanbevelingen:**

1. **Houd Bonjour uitgeschakeld tenzij LAN-detectie nodig is.** Bonjour start automatisch op macOS-hosts en is elders opt-in; directe Gateway-URL's, Tailnet, SSH of wide-area DNS-SD vermijden lokale multicast.

2. **Minimale modus** (standaard wanneer Bonjour is ingeschakeld, aanbevolen voor blootgestelde gateways): laat gevoelige velden weg uit mDNS-uitzendingen:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Schakel mDNS-modus uit** als je de Plugin ingeschakeld wilt houden maar lokale apparaatdetectie wilt onderdrukken:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Volledige modus** (opt-in): neem `cliPath` + `sshPort` op in TXT-records:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Omgevingsvariabele** (alternatief): stel `OPENCLAW_DISABLE_BONJOUR=1` in om mDNS uit te schakelen zonder configwijzigingen.

Wanneer Bonjour is ingeschakeld in minimale modus, zendt de Gateway genoeg uit voor apparaatdetectie (`role`, `gatewayPort`, `transport`) maar laat `cliPath` en `sshPort` weg. Apps die CLI-padinformatie nodig hebben, kunnen die in plaats daarvan ophalen via de geauthenticeerde WebSocket-verbinding.

### Vergrendel de Gateway-WebSocket (lokale authenticatie)

Gateway-authenticatie is **standaard vereist**. Als er geen geldig Gateway-authenticatiepad is geconfigureerd,
weigert de Gateway WebSocket-verbindingen (fail-closed).

Onboarding genereert standaard een token (zelfs voor loopback), zodat
lokale clients zich moeten authenticeren.

Stel een token in zodat **alle** WS-clients zich moeten authenticeren:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor kan er een voor je genereren: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` en `gateway.remote.password` zijn bronnen voor clientreferenties. Ze beschermen lokale WS-toegang op zichzelf **niet**. Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld. Als `gateway.auth.token` of `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen maskering door remote fallback).
</Note>
Optioneel: pin remote TLS met `gateway.remote.tlsFingerprint` wanneer je `wss://` gebruikt.
Plaintext `ws://` wordt geaccepteerd voor loopback, private IP-literals, `.local` en
Tailnet-`*.ts.net` Gateway-URL's. Stel voor andere vertrouwde private-DNS-namen
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als noodoptie.
Dit is bewust alleen een procesomgevingsvariabele, geen `openclaw.json`-config
key.
Mobiele pairing en handmatige of gescande Gateway-routes op Android zijn strenger:
cleartext wordt geaccepteerd voor loopback, maar private-LAN, link-local, `.local` en
hostnamen zonder punt moeten TLS gebruiken, tenzij je expliciet kiest voor het vertrouwde
private-netwerk-cleartextpad.

Lokale apparaatpairing:

- Apparaatpairing wordt automatisch goedgekeurd voor directe lokale loopback-verbindingen om
  same-host-clients soepel te houden.
- OpenClaw heeft ook een smal backend/container-lokaal self-connectpad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief same-host tailnet-binds, worden voor
  pairing als remote behandeld en hebben nog steeds goedkeuring nodig.
- Forwarded-header-bewijs op een loopback-verzoek diskwalificeert loopback-
  localiteit. Automatische goedkeuring van metadata-upgrades is smal afgebakend. Zie
  [Gateway-pairing](/nl/gateway/pairing) voor beide regels.

Authenticatiemodi:

- `gateway.auth.mode: "token"`: gedeeld bearer-token (aanbevolen voor de meeste setups).
- `gateway.auth.mode: "password"`: wachtwoordauthenticatie (stel bij voorkeur in via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: vertrouw op een identity-aware reverse proxy om gebruikers te authenticeren en identiteit via headers door te geven (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).

Rotatiechecklist (token/wachtwoord):

1. Genereer/stel een nieuw geheim in (`gateway.auth.token` of `OPENCLAW_GATEWAY_PASSWORD`).
2. Herstart de Gateway (of herstart de macOS-app als die de Gateway beheert).
3. Werk eventuele remote clients bij (`gateway.remote.token` / `.password` op machines die de Gateway aanroepen).
4. Controleer dat je niet langer met de oude referenties kunt verbinden.

### Tailscale Serve-identiteitsheaders

Wanneer `gateway.auth.allowTailscale` `true` is (standaard voor Serve), accepteert OpenClaw
Tailscale Serve-identiteitsheaders (`tailscale-user-login`) voor Control
UI/WebSocket-authenticatie. OpenClaw verifieert de identiteit door het
`x-forwarded-for`-adres via de lokale Tailscale-daemon (`tailscale whois`) op te lossen
en te matchen met de header. Dit wordt alleen geactiveerd voor verzoeken die loopback raken
en `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host` bevatten zoals
geïnjecteerd door Tailscale.
Voor dit asynchrone identiteitscontrolepad worden mislukte pogingen voor dezelfde `{scope, ip}`
geserialiseerd voordat de limiter de mislukking registreert. Gelijktijdige slechte retries
van één Serve-client kunnen daarom de tweede poging onmiddellijk blokkeren
in plaats van als twee gewone mismatches door te racen.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale-authenticatie via identiteitsheaders. Ze volgen nog steeds de
geconfigureerde HTTP-authenticatiemodus van de Gateway.

Belangrijke grensnotitie:

- Gateway HTTP bearer-authenticatie is effectief alles-of-niets operator-toegang.
- Behandel referenties die `/v1/chat/completions`, `/v1/responses`, Plugin-routes zoals `/api/v1/admin/rpc` of `/api/channels/*` kunnen aanroepen als operatorgeheimen met volledige toegang voor die Gateway.
- Op het OpenAI-compatibele HTTP-oppervlak herstelt bearer-authenticatie met gedeeld geheim de volledige standaard operatorscopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) en owner-semantiek voor agentbeurten; smallere `x-openclaw-scopes`-waarden beperken dat pad met gedeeld geheim niet.
- Per-request-scope-semantiek op HTTP geldt alleen wanneer het verzoek uit een identity-bearing modus komt, zoals trusted proxy-authenticatie, of uit een expliciet no-auth private ingress.
- In die identity-bearing modi valt het weglaten van `x-openclaw-scopes` terug op de normale standaardset operatorscopes; stuur de header expliciet wanneer je een smallere scopeset wilt. Owner-level OpenAI-compatibele headers zoals `x-openclaw-model` vereisen `operator.admin` wanneer scopes zijn versmald.
- `/tools/invoke` en HTTP-eindpunten voor sessiegeschiedenis volgen dezelfde regel voor gedeelde geheimen: bearer-authenticatie met token/wachtwoord wordt daar ook behandeld als volledige operator-toegang, terwijl identity-bearing modi nog steeds gedeclareerde scopes respecteren.
- Deel deze referenties niet met niet-vertrouwde callers; geef de voorkeur aan aparte gateways per vertrouwensgrens.

**Vertrouwensaanname:** tokenloze Serve-authenticatie gaat ervan uit dat de Gateway-host vertrouwd is.
Behandel dit niet als bescherming tegen vijandige processen op dezelfde host. Als niet-vertrouwde
lokale code op de Gateway-host kan draaien, schakel `gateway.auth.allowTailscale` uit
en vereis expliciete authenticatie met gedeeld geheim via `gateway.auth.mode: "token"` of
`"password"`.

**Beveiligingsregel:** forward deze headers niet vanuit je eigen reverse proxy. Als
je TLS termineert of een proxy vóór de Gateway plaatst, schakel dan
`gateway.auth.allowTailscale` uit en gebruik authenticatie met gedeeld geheim (`gateway.auth.mode:
"token"` of `"password"`) of [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)
in plaats daarvan.

Vertrouwde proxy's:

- Als je TLS vóór de Gateway termineert, stel `gateway.trustedProxies` in op de IP's van je proxy.
- OpenClaw vertrouwt `x-forwarded-for` (of `x-real-ip`) van die IP's om het client-IP te bepalen voor lokale pairingcontroles en HTTP-auth/local-controles.
- Zorg dat je proxy `x-forwarded-for` **overschrijft** en directe toegang tot de Gateway-poort blokkeert.

Zie [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

### Browserbesturing via nodehost (aanbevolen)

Als je Gateway remote is maar de browser op een andere machine draait, voer dan een **nodehost**
uit op de browsermachine en laat de Gateway browseracties proxyen (zie [Browsertool](/nl/tools/browser)).
Behandel node-pairing als admin-toegang.

Aanbevolen patroon:

- Houd de Gateway en nodehost op dezelfde tailnet (Tailscale).
- Pair de node bewust; schakel browser-proxyrouting uit als je die niet nodig hebt.

Vermijd:

- Relay-/controlpoorten beschikbaar stellen via LAN of het openbare internet.
- Tailscale Funnel voor browsercontrole-eindpunten (openbare blootstelling).

### Geheimen op schijf

Ga ervan uit dat alles onder `~/.openclaw/` (of `$OPENCLAW_STATE_DIR/`) geheimen of privégegevens kan bevatten:

- `openclaw.json`: configuratie kan tokens bevatten (Gateway, externe Gateway), providerinstellingen en allowlists.
- `credentials/**`: kanaalreferenties (voorbeeld: WhatsApp-referenties), koppelingsallowlists, verouderde OAuth-imports.
- `agents/<agentId>/agent/auth-profiles.json`: API-sleutels, tokenprofielen, OAuth-tokens en optionele `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex-appserveraccount, configuratie, skills, plugins, native threadstatus en diagnostiek (de standaard).
- `$CODEX_HOME/**` of `~/.codex/**`: wanneer de Codex-plugin expliciet
  `appServer.homeScope: "user"` gebruikt, kan de Gateway het native Codex-
  account, de configuratie, plugins en threads lezen en bijwerken. Behandel dit als bevoorrechte eigenaarstoegang;
  de modus is alleen lokale stdio en native threadbeheer is alleen voor de eigenaar.
- `secrets.json` (optioneel): bestandsgebaseerde geheime payload die wordt gebruikt door `file` SecretRef-providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: verouderd compatibiliteitsbestand. Statische `api_key`-vermeldingen worden opgeschoond wanneer ze worden gevonden.
- `agents/<agentId>/sessions/**`: sessietranscripten (`*.jsonl`) + routeringsmetadata (`sessions.json`) die privéberichten en tooluitvoer kunnen bevatten.
- gebundelde pluginpakketten: geïnstalleerde plugins (plus hun `node_modules/`).
- `sandboxes/**`: tool-sandboxwerkruimten; kunnen kopieën verzamelen van bestanden die je binnen de sandbox leest/schrijft.

Hardeningtips:

- Houd machtigingen strikt (`700` op mappen, `600` op bestanden).
- Gebruik volledige-schijfversleuteling op de gatewayhost.
- Geef de voorkeur aan een speciaal OS-gebruikersaccount voor de Gateway als de host wordt gedeeld.

### Workspace-`.env`-bestanden

OpenClaw laadt workspace-lokale `.env`-bestanden voor agents en tools, maar laat die bestanden nooit stilzwijgend Gateway-runtime-instellingen overschrijven.

- Omgevingsvariabelen voor providerreferenties worden geblokkeerd vanuit niet-vertrouwde workspace-`.env`-bestanden. Voorbeelden zijn `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` en provider-authenticatiesleutels die door geïnstalleerde vertrouwde plugins zijn gedeclareerd. Zet providerreferenties in de procesomgeving van de Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), het configuratieblok `env` of de optionele login-shell-import.
- Elke sleutel die begint met `OPENCLAW_*` wordt geblokkeerd vanuit niet-vertrouwde workspace-`.env`-bestanden.
- Kanaaleindpuntinstellingen voor Matrix, Mattermost, IRC en Synology Chat worden ook geblokkeerd voor workspace-`.env`-overschrijvingen, zodat gekloonde workspaces gebundeld connectorverkeer niet via lokale eindpuntconfiguratie kunnen omleiden. Eindpunt-env-sleutels (zoals `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) moeten uit de procesomgeving van de gateway of `env.shellEnv` komen, niet uit een door de workspace geladen `.env`.
- De blokkade faalt gesloten: een nieuwe runtime-control-variabele die in een toekomstige release wordt toegevoegd, kan niet worden overgenomen uit een ingecheckte of door een aanvaller aangeleverde `.env`; de sleutel wordt genegeerd en de gateway behoudt zijn eigen waarde.
- Vertrouwde proces-/OS-omgevingsvariabelen, globale runtime-dotenv, configuratie-`env` en ingeschakelde login-shell-import blijven van toepassing - dit beperkt alleen het laden van workspace-`.env`-bestanden.

Waarom: workspace-`.env`-bestanden staan vaak naast agentcode, worden per ongeluk gecommit of worden door tools geschreven. Het blokkeren van providerreferenties voorkomt dat een gekloonde workspace door een aanvaller beheerde provideraccounts vervangt. Het blokkeren van het volledige voorvoegsel `OPENCLAW_*` betekent dat het later toevoegen van een nieuwe `OPENCLAW_*`-vlag nooit kan terugvallen naar stille overname uit workspacestatus.

### Logs en transcripten (redactie en retentie)

Logs en transcripten kunnen gevoelige informatie lekken, zelfs wanneer toegangscontroles correct zijn:

- Gateway-logs kunnen toolsamenvattingen, fouten en URL's bevatten.
- Sessietranscripten kunnen geplakte geheimen, bestandsinhoud, opdrachtuitvoer en links bevatten.

Aanbevelingen:

- Houd redactie van logs en transcripten ingeschakeld (`logging.redactSensitive: "tools"`; standaard).
- Voeg aangepaste patronen voor je omgeving toe via `logging.redactPatterns` (tokens, hostnamen, interne URL's).
- Geef bij het delen van diagnostiek de voorkeur aan `openclaw status --all` (plakbaar, geheimen geredigeerd) boven ruwe logs.
- Ruim oude sessietranscripten en logbestanden op als je geen lange retentie nodig hebt.

Details: [Logging](/nl/gateway/logging)

### DM's: standaard koppelen

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Groepen: overal vermelding vereisen

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Reageer in groepschats alleen wanneer je expliciet wordt vermeld.

### Aparte nummers (WhatsApp, Signal, Telegram)

Overweeg voor kanalen op basis van telefoonnummers je AI op een ander telefoonnummer te draaien dan je persoonlijke nummer:

- Persoonlijk nummer: je gesprekken blijven privé
- Botnummer: AI handelt deze af, met passende grenzen

### Alleen-lezenmodus (via sandbox en tools)

Je kunt een alleen-lezenprofiel bouwen door te combineren:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (of `"none"` voor geen workspacetoegang)
- tool-allow-/deny-lijsten die `write`, `edit`, `apply_patch`, `exec`, `process`, enzovoort blokkeren.

Aanvullende hardeningopties:

- `tools.exec.applyPatch.workspaceOnly: true` (standaard): zorgt ervoor dat `apply_patch` niet buiten de workspacemap kan schrijven/verwijderen, zelfs wanneer sandboxing uit staat. Stel in op `false` alleen als je bewust wilt dat `apply_patch` bestanden buiten de workspace raakt.
- `tools.fs.workspaceOnly: true` (optioneel): beperkt `read`/`write`/`edit`/`apply_patch`-paden en native automatische promptafbeeldingslaadpaden tot de workspacemap (handig als je vandaag absolute paden toestaat en één guardrail wilt).
- Houd bestandssysteemroots smal: vermijd brede roots zoals je home-map voor agentworkspaces/sandboxworkspaces. Brede roots kunnen gevoelige lokale bestanden (bijvoorbeeld status/configuratie onder `~/.openclaw`) blootstellen aan bestandssysteemtools.

### Veilige basislijn (kopiëren/plakken)

Eén configuratie met "veilige standaard" die de Gateway privé houdt, DM-koppeling vereist en altijd-aan-groepsbots vermijdt:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Als je tooluitvoering ook "standaard veiliger" wilt, voeg dan een sandbox toe + weiger gevaarlijke tools voor elke niet-eigenaar-agent (voorbeeld hieronder onder "Toegangsprofielen per agent").

Ingebouwde basislijn voor chatgestuurde agentbeurten: niet-eigenaar-afzenders kunnen de tools `cron` of `gateway` niet gebruiken.

## Sandboxing (aanbevolen)

Specifiek document: [Sandboxing](/nl/gateway/sandboxing)

Twee complementaire benaderingen:

- **Draai de volledige Gateway in Docker** (containergrens): [Docker](/nl/install/docker)
- **Tool-sandbox** (`agents.defaults.sandbox`, hostgateway + sandbox-geïsoleerde tools; Docker is de standaardbackend): [Sandboxing](/nl/gateway/sandboxing)

<Note>
Om toegang tussen agents te voorkomen, houd `agents.defaults.sandbox.scope` op `"agent"` (standaard) of `"session"` voor strengere isolatie per sessie. `scope: "shared"` gebruikt één container of workspace.
</Note>

Overweeg ook agent-workspacetoegang binnen de sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (standaard) houdt de agentworkspace verboden terrein; tools draaien tegen een sandboxworkspace onder `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` mount de agentworkspace alleen-lezen op `/agent` (schakelt `write`/`edit`/`apply_patch` uit)
- `agents.defaults.sandbox.workspaceAccess: "rw"` mount de agentworkspace lezen/schrijven op `/workspace`
- Extra `sandbox.docker.binds` worden gevalideerd tegen genormaliseerde en gecanonicaliseerde bronpaden. Parent-symlinktrucs en canonieke home-aliassen falen nog steeds gesloten als ze oplossen naar geblokkeerde roots zoals `/etc`, `/var/run` of referentiemappen onder de OS-home.

<Warning>
`tools.elevated` is de globale basislijn-ontsnappingsroute die exec buiten de sandbox draait. De effectieve host is standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`. Houd `tools.elevated.allowFrom` strikt en schakel dit niet in voor onbekenden. Je kunt elevated verder per agent beperken via `agents.list[].tools.elevated`. Zie [Elevated-modus](/nl/tools/elevated).
</Warning>

### Guardrail voor subagentdelegatie

Als je sessietools toestaat, behandel gedelegeerde subagent-runs dan als een andere grensbeslissing:

- Weiger `sessions_spawn` tenzij de agent echt delegatie nodig heeft.
- Houd `agents.defaults.subagents.allowAgents` en eventuele per-agent-overschrijvingen van `agents.list[].subagents.allowAgents` beperkt tot bekende veilige doelagents.
- Roep voor elke workflow die gesandboxed moet blijven `sessions_spawn` aan met `sandbox: "require"` (standaard is `inherit`).
- `sandbox: "require"` faalt snel wanneer de doel-child-runtime niet is gesandboxed.

## Risico's van browserbesturing

Het inschakelen van browserbesturing geeft het model de mogelijkheid een echte browser aan te sturen.
Als dat browserprofiel al ingelogde sessies bevat, kan het model
toegang krijgen tot die accounts en gegevens. Behandel browserprofielen als **gevoelige status**:

- Geef de voorkeur aan een speciaal profiel voor de agent (het standaardprofiel `openclaw`).
- Vermijd het wijzen van de agent naar je persoonlijke dagelijkse profiel.
- Houd hostbrowserbesturing uitgeschakeld voor gesandboxte agents tenzij je ze vertrouwt.
- De zelfstandige loopback-API voor browserbesturing respecteert alleen shared-secret-authenticatie
  (gateway-token-bearer-authenticatie of gatewaywachtwoord). Deze gebruikt geen
  trusted-proxy- of Tailscale Serve-identiteitsheaders.
- Behandel browserdownloads als niet-vertrouwde invoer; geef de voorkeur aan een geïsoleerde downloadsmap.
- Schakel browsersynchronisatie/wachtwoordbeheerders in het agentprofiel uit als dat mogelijk is (vermindert de blast radius).
- Ga er bij externe gateways van uit dat "browserbesturing" gelijkstaat aan "operatortoegang" tot alles wat dat profiel kan bereiken.
- Houd de Gateway- en node-hosts alleen tailnet; vermijd het blootstellen van browserbesturingspoorten aan LAN of openbaar internet.
- Schakel browserproxyrouting uit wanneer je die niet nodig hebt (`gateway.nodes.browser.mode="off"`).
- Chrome MCP-modus met bestaande sessie is **niet** "veiliger"; deze kan als jij handelen in alles wat dat host-Chrome-profiel kan bereiken.

### Browser-SSRF-beleid (standaard strikt)

Het browsernavigatiebeleid van OpenClaw is standaard strikt: privé/interne bestemmingen blijven geblokkeerd tenzij je expliciet opt-in gebruikt.

- Standaard: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is niet ingesteld, dus browsernavigatie houdt privé/interne/special-use-bestemmingen geblokkeerd.
- Verouderd alias: `browser.ssrfPolicy.allowPrivateNetwork` wordt nog steeds geaccepteerd voor compatibiliteit.
- Opt-inmodus: stel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in om privé/interne/special-use-bestemmingen toe te staan.
- Gebruik in strikte modus `hostnameAllowlist` (patronen zoals `*.example.com`) en `allowedHostnames` (exacte hostuitzonderingen, inclusief geblokkeerde namen zoals `localhost`) voor expliciete uitzonderingen.
- Navigatie wordt gecontroleerd vóór het verzoek en met beste inspanning opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL na navigatie om omleidingsgebaseerde pivots te verminderen.

Voorbeeld van strikt beleid:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Toegangsprofielen per agent (multi-agent)

Met multi-agent-routering kan elke agent zijn eigen sandbox + toolbeleid hebben:
gebruik dit om per agent **volledige toegang**, **alleen-lezen** of **geen toegang** te geven.
Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor volledige details
en prioriteitsregels.

Veelvoorkomende gebruiksscenario's:

- Persoonlijke agent: volledige toegang, geen sandbox
- Familie-/werkagent: gesandboxed + alleen-lezertools
- Publieke agent: gesandboxed + geen bestandssysteem-/shelltools

### Voorbeeld: volledige toegang (geen sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Voorbeeld: alleen-lezen tools + alleen-lezen workspace

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Voorbeeld: geen toegang tot bestandssysteem/shell (providerberichten toegestaan)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Incidentrespons

Als je AI iets verkeerds doet:

### Inperken

1. **Stop deze:** stop de macOS-app (als die toezicht houdt op de Gateway) of beëindig je `openclaw gateway`-proces.
2. **Sluit blootstelling af:** stel `gateway.bind: "loopback"` in (of schakel Tailscale Funnel/Serve uit) totdat je begrijpt wat er is gebeurd.
3. **Bevries toegang:** schakel risicovolle DM's/groepen over naar `dmPolicy: "disabled"` / vereis vermeldingen, en verwijder `"*"` allow-all-vermeldingen als je die had.

### Roteer (ga uit van compromittering als geheimen zijn gelekt)

1. Roteer Gateway-authenticatie (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) en start opnieuw.
2. Roteer externe clientgeheimen (`gateway.remote.token` / `.password`) op elke machine die de Gateway kan aanroepen.
3. Roteer provider-/API-inloggegevens (WhatsApp-inloggegevens, Slack-/Discord-tokens, model-/API-sleutels in `auth-profiles.json`, en versleutelde secret-payloadwaarden wanneer gebruikt).

### Auditen

1. Controleer Gateway-logboeken: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (of `logging.file`).
2. Bekijk de relevante transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Bekijk recente configuratiewijzigingen (alles wat toegang kan hebben verruimd: `gateway.bind`, `gateway.auth`, DM-/groepsbeleid, `tools.elevated`, Plugin-wijzigingen).
4. Voer `openclaw security audit --deep` opnieuw uit en bevestig dat kritieke bevindingen zijn opgelost.

### Verzamelen voor een rapport

- Tijdstempel, hostbesturingssysteem van de gateway + OpenClaw-versie
- De sessietranscript(s) + een korte logtail (na redactie)
- Wat de aanvaller verstuurde + wat de agent deed
- Of de Gateway verder dan loopback was blootgesteld (LAN/Tailscale Funnel/Serve)

## Secret-scanning

CI voert de pre-commit-hook `detect-private-key` uit over de repository. Als deze
mislukt, verwijder of roteer dan het gecommitte keymateriaal en reproduceer lokaal:

```bash
pre-commit run --all-files detect-private-key
```

## Beveiligingsproblemen melden

Een kwetsbaarheid gevonden in OpenClaw? Meld deze verantwoord:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Plaats niets openbaar totdat het is opgelost
3. We vermelden je bijdrage (tenzij je anoniem wilt blijven)
