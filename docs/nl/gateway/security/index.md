---
read_when:
    - Functies toevoegen die toegang of automatisering verruimen
summary: Beveiligingsoverwegingen en dreigingsmodel voor het draaien van een AI-Gateway met shelltoegang
title: Beveiliging
x-i18n:
    generated_at: "2026-05-03T11:10:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cee36b337c79199e037d6087f9db0500925ed869d67dca302dedfe0d236b818f
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Vertrouwensmodel voor persoonlijke assistenten.** Deze richtlijn gaat uit van één vertrouwde
  operatorgrens per gateway (single-user, persoonlijke-assistentmodel).
  OpenClaw is **geen** vijandige multi-tenant beveiligingsgrens voor meerdere
  vijandige gebruikers die één agent of gateway delen. Als je werking met gemengd vertrouwen of
  vijandige gebruikers nodig hebt, splits dan de vertrouwensgrenzen (aparte gateway +
  credentials, idealiter aparte OS-gebruikers of hosts).
</Warning>

## Scope eerst: beveiligingsmodel voor persoonlijke assistenten

OpenClaw-beveiligingsrichtlijnen gaan uit van een **persoonlijke assistent**-deployment: één vertrouwde operatorgrens, mogelijk veel agents.

- Ondersteunde beveiligingshouding: één gebruiker/vertrouwensgrens per gateway (bij voorkeur één OS-gebruiker/host/VPS per grens).
- Geen ondersteunde beveiligingsgrens: één gedeelde gateway/agent die wordt gebruikt door wederzijds niet-vertrouwde of vijandige gebruikers.
- Als isolatie van vijandige gebruikers vereist is, splits dan per vertrouwensgrens (aparte gateway + credentials, en idealiter aparte OS-gebruikers/hosts).
- Als meerdere niet-vertrouwde gebruikers één agent met tools kunnen berichten, behandel hen dan alsof ze dezelfde gedelegeerde toolbevoegdheid voor die agent delen.

Deze pagina legt hardening **binnen dat model** uit. Ze claimt geen vijandige multi-tenant isolatie op één gedeelde gateway.

## Snelle controle: `openclaw security audit`

Zie ook: [Formele verificatie (beveiligingsmodellen)](/nl/security/formal-verification)

Voer dit regelmatig uit (vooral na het wijzigen van configuratie of het blootstellen van netwerkoppervlakken):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` blijft bewust beperkt: het zet gangbare open groepsbeleidsregels
om naar allowlists, herstelt `logging.redactSensitive: "tools"`, scherpt
machtigingen voor state/config/include-bestanden aan, en gebruikt Windows ACL-resets in plaats van
POSIX `chmod` wanneer het op Windows draait.

Het markeert veelvoorkomende valkuilen (blootstelling van Gateway-authenticatie, blootstelling van browserbesturing, verhoogde allowlists, bestandssysteemmachtigingen, permissieve exec-goedkeuringen en toolblootstelling via open kanalen).

OpenClaw is zowel een product als een experiment: je verbindt frontier-modelgedrag met echte messaging-oppervlakken en echte tools. **Er bestaat geen “perfect beveiligde” setup.** Het doel is om bewust te zijn over:

- wie met je bot kan praten
- waar de bot mag handelen
- wat de bot mag aanraken

Begin met de kleinste toegang die nog werkt, en breid die daarna uit naarmate je meer vertrouwen krijgt.

### Deployment en hostvertrouwen

OpenClaw gaat ervan uit dat de host- en configuratiegrens vertrouwd zijn:

- Als iemand Gateway-hoststate/configuratie (`~/.openclaw`, inclusief `openclaw.json`) kan wijzigen, behandel diegene dan als een vertrouwde operator.
- Eén Gateway draaien voor meerdere wederzijds niet-vertrouwde/vijandige operators is **geen aanbevolen setup**.
- Voor teams met gemengd vertrouwen splits je vertrouwensgrenzen met aparte gateways (of minimaal aparte OS-gebruikers/hosts).
- Aanbevolen standaard: één gebruiker per machine/host (of VPS), één gateway voor die gebruiker, en één of meer agents in die gateway.
- Binnen één Gateway-instantie is geauthenticeerde operatortoegang een vertrouwde control-plane-rol, geen tenantrol per gebruiker.
- Sessie-identifiers (`sessionKey`, sessie-ID’s, labels) zijn routingselectors, geen autorisatietokens.
- Als meerdere mensen één agent met tools kunnen berichten, kan ieder van hen dezelfde machtigingenset sturen. Sessie-/geheugenisolatie per gebruiker helpt privacy, maar verandert een gedeelde agent niet in hostautorisatie per gebruiker.

### Gedeelde Slack-werkruimte: echt risico

Als "iedereen in Slack de bot kan berichten", is het kernrisico gedelegeerde toolbevoegdheid:

- elke toegestane afzender kan toolcalls (`exec`, browser, netwerk-/bestandstools) binnen het beleid van de agent uitlokken;
- prompt-/contentinjectie van één afzender kan acties veroorzaken die gedeelde state, apparaten of uitvoer beïnvloeden;
- als één gedeelde agent gevoelige credentials/bestanden heeft, kan elke toegestane afzender mogelijk exfiltratie via toolgebruik aansturen.

Gebruik aparte agents/gateways met minimale tools voor teamworkflows; houd agents met persoonlijke gegevens privé.

### Bedrijfsgedeelde agent: acceptabel patroon

Dit is acceptabel wanneer iedereen die die agent gebruikt binnen dezelfde vertrouwensgrens valt (bijvoorbeeld één bedrijfsteam) en de agent strikt zakelijk is afgebakend.

- draai hem op een dedicated machine/VM/container;
- gebruik een dedicated OS-gebruiker + dedicated browser/profiel/accounts voor die runtime;
- meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke wachtwoordmanager-/browserprofielen.

Als je persoonlijke en bedrijfsidentiteiten op dezelfde runtime mengt, hef je de scheiding op en verhoog je het risico op blootstelling van persoonlijke gegevens.

## Vertrouwensconcept voor Gateway en Node

Behandel Gateway en Node als één operatorvertrouwensdomein, met verschillende rollen:

- **Gateway** is de control plane en het beleidsoppervlak (`gateway.auth`, toolbeleid, routing).
- **Node** is het externe uitvoeringsoppervlak dat aan die Gateway is gekoppeld (commando’s, apparaatacties, host-lokale mogelijkheden).
- Een caller die bij de Gateway is geauthenticeerd, is vertrouwd binnen Gateway-scope. Na koppeling zijn Node-acties vertrouwde operatoracties op die Node.
- Operatorscopeniveaus en controles op het moment van goedkeuring worden samengevat in
  [Operatorscopen](/nl/gateway/operator-scopes).
- Directe local loopback-backendclients die zijn geauthenticeerd met het gedeelde gateway-
  token/wachtwoord kunnen interne control-plane-RPC’s uitvoeren zonder een gebruikers-
  apparaatidentiteit te presenteren. Dit is geen bypass voor externe of browserkoppeling: netwerk-
  clients, Node-clients, device-token-clients en expliciete apparaatidentiteiten
  doorlopen nog steeds koppeling en scope-upgrade-afdwinging.
- `sessionKey` is routing-/contextselectie, geen auth per gebruiker.
- Exec-goedkeuringen (allowlist + vragen) zijn guardrails voor operatorintentie, geen vijandige multi-tenant isolatie.
- De productstandaard van OpenClaw voor vertrouwde single-operator-setups is dat host-exec op `gateway`/`node` is toegestaan zonder goedkeuringsprompts (`security="full"`, `ask="off"` tenzij je dit aanscherpt). Die standaard is bewuste UX, op zichzelf geen kwetsbaarheid.
- Exec-goedkeuringen binden exacte requestcontext en best-effort directe lokale bestandsoperanden; ze modelleren niet semantisch elk runtime-/interpreter-loaderpad. Gebruik sandboxing en hostisolatie voor sterke grenzen.

Als je isolatie van vijandige gebruikers nodig hebt, splits dan vertrouwensgrenzen per OS-gebruiker/host en draai aparte gateways.

## Matrix voor vertrouwensgrenzen

Gebruik dit als snel model bij risicotriage:

| Grens of controle                                         | Wat het betekent                                  | Veelvoorkomende misinterpretatie                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Authenticeert callers bij gateway-API’s           | "Heeft per-bericht-handtekeningen op elk frame nodig om veilig te zijn"         |
| `sessionKey`                                              | Routingsleutel voor context-/sessieselectie       | "Sessiesleutel is een authgrens voor gebruikers"                                |
| Prompt-/contentguardrails                                 | Verminderen risico op modelmisbruik               | "Promptinjectie alleen bewijst authbypass"                                      |
| `canvas.eval` / browser evaluate                          | Bewuste operatormogelijkheid wanneer ingeschakeld | "Elke JS-eval-primitive is automatisch een kwetsbaarheid in dit vertrouwensmodel" |
| Lokale TUI `!` shell                                      | Expliciet door operator geactiveerde lokale uitvoering | "Lokaal shell-gemakscommando is externe injectie"                           |
| Node-koppeling en Node-commando’s                         | Externe uitvoering op operatorniveau op gekoppelde apparaten | "Externe apparaatbesturing moet standaard als niet-vertrouwde gebruikerstoegang worden behandeld" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in beleid voor Node-inschrijving op vertrouwd netwerk | "Een standaard uitgeschakelde allowlist is een automatische koppelingskwetsbaarheid" |

## Geen kwetsbaarheden volgens ontwerp

<Accordion title="Common findings that are out of scope">

Deze patronen worden vaak gerapporteerd en worden meestal zonder actie gesloten, tenzij
een echte grensbypass wordt aangetoond:

- Alleen-promptinjectie-ketens zonder beleids-, auth- of sandboxbypass.
- Claims die uitgaan van vijandige multi-tenant werking op één gedeelde host of
  configuratie.
- Claims die normale operatortoegang via leespaden (bijvoorbeeld
  `sessions.list` / `sessions.preview` / `chat.history`) classificeren als IDOR in een
  gedeelde-gateway-setup.
- Bevindingen voor deployments die alleen op localhost draaien (bijvoorbeeld HSTS op een gateway die alleen via loopback bereikbaar is).
- Bevindingen over Discord inbound Webhook-handtekeningen voor inbound paden die niet
  in deze repo bestaan.
- Rapporten die Node-koppelingsmetadata behandelen als een verborgen tweede per-commando
  goedkeuringslaag voor `system.run`, terwijl de echte uitvoeringsgrens nog steeds
  het globale Node-commandobeleid van de gateway plus de eigen exec-
  goedkeuringen van de Node is.
- Rapporten die geconfigureerde `gateway.nodes.pairing.autoApproveCidrs` op zichzelf als een
  kwetsbaarheid behandelen. Deze instelling is standaard uitgeschakeld, vereist
  expliciete CIDR/IP-vermeldingen, geldt alleen voor eerste `role: node`-koppeling zonder
  gevraagde scopen, en keurt operator/browser/Control UI,
  WebChat, role-upgrades, scope-upgrades, metadatawijzigingen, public-key-wijzigingen
  of same-host loopback trusted-proxy-headerpaden niet automatisch goed, tenzij loopback trusted-proxy-auth expliciet was ingeschakeld.
- Bevindingen over "ontbrekende autorisatie per gebruiker" die `sessionKey` als een
  auth-token behandelen.

</Accordion>

## Geharde baseline in 60 seconden

Gebruik deze baseline eerst, en schakel daarna per vertrouwde agent selectief tools opnieuw in:

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

Dit houdt de Gateway alleen lokaal, isoleert DM’s en schakelt control-plane-/runtimetools standaard uit.

## Snelle regel voor gedeelde inbox

Als meer dan één persoon je bot kan DM’en:

- Stel `session.dmScope: "per-channel-peer"` in (of `"per-account-channel-peer"` voor multi-account-kanalen).
- Houd `dmPolicy: "pairing"` aan of gebruik strikte allowlists.
- Combineer gedeelde DM’s nooit met brede tooltoegang.
- Dit hardt coöperatieve/gedeelde inboxen, maar is niet ontworpen als vijandige co-tenant isolatie wanneer gebruikers host-/config-schrijftoegang delen.

## Model voor contextzichtbaarheid

OpenClaw scheidt twee concepten:

- **Triggerautorisatie**: wie de agent kan triggeren (`dmPolicy`, `groupPolicy`, allowlists, vermeldingsgates).
- **Contextzichtbaarheid**: welke aanvullende context in de modelinvoer wordt geïnjecteerd (antwoordtekst, geciteerde tekst, threadgeschiedenis, doorgestuurde metadata).

Allowlists bewaken triggers en commandoautorisatie. De instelling `contextVisibility` bepaalt hoe aanvullende context (geciteerde antwoorden, threadroots, opgehaalde geschiedenis) wordt gefilterd:

- `contextVisibility: "all"` (standaard) behoudt aanvullende context zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die door de actieve allowlist-controles zijn toegestaan.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Stel `contextVisibility` per kanaal of per ruimte/gesprek in. Zie [Groepschats](/nl/channels/groups#context-visibility-and-allowlists) voor setupdetails.

Richtlijn voor advisory-triage:

- Claims die alleen aantonen dat "het model geciteerde of historische tekst van niet-toegestane afzenders kan zien" zijn hardeningsbevindingen die met `contextVisibility` kunnen worden aangepakt, niet op zichzelf omzeilingen van auth- of sandboxgrenzen.
- Om security-impact te hebben, hebben rapporten nog steeds een aangetoonde omzeiling van een vertrouwensgrens nodig (auth, beleid, sandbox, goedkeuring of een andere gedocumenteerde grens).

## Wat de audit controleert (hoog niveau)

- **Inkomende toegang** (DM-beleid, groepsbeleid, allowlists): kunnen vreemden de bot triggeren?
- **Tool blast radius** (verhoogde tools + open kamers): kan promptinjectie leiden tot shell-/bestand-/netwerkacties?
- **Exec-goedkeuringsdrift** (`security=full`, `autoAllowSkills`, interpreter-allowlists zonder `strictInlineEval`): doen host-exec-guardrails nog wat je denkt dat ze doen?
  - `security="full"` is een brede posture-waarschuwing, geen bewijs van een bug. Het is de gekozen standaard voor vertrouwde personal-assistant-setups; scherp dit alleen aan wanneer je dreigingsmodel goedkeurings- of allowlist-guardrails nodig heeft.
- **Netwerkblootstelling** (Gateway-bind/auth, Tailscale Serve/Funnel, zwakke/korte auth-tokens).
- **Blootstelling van browserbesturing** (remote nodes, relaypoorten, remote CDP-endpoints).
- **Lokale schijfhygiëne** (machtigingen, symlinks, config-includes, paden voor “gesynchroniseerde map”).
- **Plugins** (plugins laden zonder expliciete allowlist).
- **Beleidsdrift/misconfiguratie** (sandbox-Docker-instellingen geconfigureerd maar sandboxmodus uit; ineffectieve `gateway.nodes.denyCommands`-patronen omdat matching alleen op exacte commandonaam gebeurt (bijvoorbeeld `system.run`) en shelltekst niet inspecteert; gevaarlijke `gateway.nodes.allowCommands`-vermeldingen; globale `tools.profile="minimal"` overschreven door profielen per agent; tools die eigendom zijn van plugins bereikbaar onder permissief toolbeleid).
- **Runtime-verwachtingsdrift** (bijvoorbeeld aannemen dat impliciete exec nog steeds `sandbox` betekent wanneer `tools.exec.host` nu standaard `auto` is, of expliciet `tools.exec.host="sandbox"` instellen terwijl sandboxmodus uit staat).
- **Modelhygiëne** (waarschuwen wanneer geconfigureerde modellen legacy lijken; geen harde blokkade).

Als je `--deep` uitvoert, probeert OpenClaw ook een best-effort live Gateway-probe.

## Kaart voor opslag van referenties

Gebruik dit bij het auditen van toegang of het bepalen waarvan je een back-up maakt:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env-/file-/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Koppelings-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-authprofielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex-runtime-status**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Bestandsgebaseerde secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`

## Checklist voor security-audit

Wanneer de audit bevindingen afdrukt, behandel dit als prioriteitsvolgorde:

1. **Alles “open” + tools ingeschakeld**: vergrendel eerst DM's/groepen (koppeling/allowlists), scherp daarna toolbeleid/sandboxing aan.
2. **Publieke netwerkblootstelling** (LAN-bind, Funnel, ontbrekende auth): direct oplossen.
3. **Remote blootstelling van browserbesturing**: behandel dit als operatortoegang (alleen tailnet, koppel nodes doelbewust, vermijd publieke blootstelling).
4. **Machtigingen**: zorg dat status/config/referenties/auth niet leesbaar zijn voor groep/wereld.
5. **Plugins**: laad alleen wat je expliciet vertrouwt.
6. **Modelkeuze**: geef de voorkeur aan moderne, instructie-geharde modellen voor elke bot met tools.

## Woordenlijst voor security-audit

Elke auditbevinding wordt aangeduid met een gestructureerde `checkId` (bijvoorbeeld
`gateway.bind_no_auth` of `tools.exec.security_full_configured`). Veelvoorkomende
kritieke severity-klassen:

- `fs.*` — bestandssysteemmachtigingen op status, config, referenties, auth-profielen.
- `gateway.*` — bindmodus, auth, Tailscale, Control UI, trusted-proxy-setup.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — hardening per oppervlak.
- `plugins.*`, `skills.*` — plugin-/skill-toeleveringsketen en scanbevindingen.
- `security.exposure.*` — doorsnijdende controles waar toegangsbeleid en tool blast radius samenkomen.

Zie de volledige catalogus met severity-niveaus, fix-sleutels en ondersteuning voor auto-fix op
[Security-auditcontroles](/nl/gateway/security/audit-checks).

## Control UI via HTTP

De Control UI heeft een **beveiligde context** (HTTPS of localhost) nodig om apparaatidentiteit
te genereren. `gateway.controlUi.allowInsecureAuth` is een lokale compatibiliteitsschakelaar:

- Op localhost staat dit Control UI-auth toe zonder apparaatidentiteit wanneer de pagina
  via niet-beveiligde HTTP is geladen.
- Het omzeilt geen koppelingscontroles.
- Het versoepelt geen remote (niet-localhost) vereisten voor apparaatidentiteit.

Geef de voorkeur aan HTTPS (Tailscale Serve) of open de UI op `127.0.0.1`.

Alleen voor break-glass-scenario's schakelt `gateway.controlUi.dangerouslyDisableDeviceAuth`
apparaatidentiteitscontroles volledig uit. Dit is een ernstige security-downgrade;
laat dit uit tenzij je actief debugt en snel kunt terugdraaien.

Los van die gevaarlijke flags kan succesvolle `gateway.auth.mode: "trusted-proxy"`
**operator**-Control UI-sessies toelaten zonder apparaatidentiteit. Dat is bewust
auth-mode-gedrag, geen `allowInsecureAuth`-kortere weg, en het geldt nog steeds
niet voor Control UI-sessies met node-rol.

`openclaw security audit` waarschuwt wanneer deze instelling is ingeschakeld.

## Samenvatting van onveilige of gevaarlijke flags

`openclaw security audit` geeft `config.insecure_or_dangerous_flags` wanneer
bekende onveilige/gevaarlijke debugschakelaars zijn ingeschakeld. Laat deze unset in
productie.

<AccordionGroup>
  <Accordion title="Flags die vandaag door de audit worden gevolgd">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Alle `dangerous*`- / `dangerously*`-sleutels in het configschema">
    Control UI en browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Kanaalnaam-matching (gebundelde en plugin-kanalen; ook beschikbaar per
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

    Sandbox-Docker (standaarden + per agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Reverse-proxyconfiguratie

Als je de Gateway achter een reverse proxy (nginx, Caddy, Traefik, enz.) uitvoert, configureer
`gateway.trustedProxies` voor correcte afhandeling van doorgestuurde client-IP's.

Wanneer de Gateway proxyheaders detecteert vanaf een adres dat **niet** in `trustedProxies` staat, behandelt het verbindingen **niet** als lokale clients. Als gateway-auth is uitgeschakeld, worden die verbindingen geweigerd. Dit voorkomt authenticatie-omzeiling waarbij geproxiede verbindingen anders van localhost lijken te komen en automatisch vertrouwen krijgen.

`gateway.trustedProxies` voedt ook `gateway.auth.mode: "trusted-proxy"`, maar die auth-modus is strikter:

- trusted-proxy-auth **faalt standaard gesloten bij proxies met loopback-bron**
- same-host loopback-reverse-proxies kunnen `gateway.trustedProxies` gebruiken voor lokale-clientdetectie en afhandeling van doorgestuurde IP's
- same-host loopback-reverse-proxies kunnen alleen voldoen aan `gateway.auth.mode: "trusted-proxy"` wanneer `gateway.auth.trustedProxy.allowLoopback = true`; gebruik anders token-/wachtwoord-auth

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Wanneer `trustedProxies` is geconfigureerd, gebruikt de Gateway `X-Forwarded-For` om het client-IP te bepalen. `X-Real-IP` wordt standaard genegeerd tenzij `gateway.allowRealIpFallback: true` expliciet is ingesteld.

Trusted-proxy-headers maken node-apparaatkoppeling niet automatisch vertrouwd.
`gateway.nodes.pairing.autoApproveCidrs` is een apart, standaard uitgeschakeld
operatorbeleid. Zelfs wanneer het is ingeschakeld, zijn trusted-proxy-headerpaden
met loopback-bron uitgesloten van automatische node-goedkeuring omdat lokale aanroepers die
headers kunnen vervalsen, ook wanneer loopback trusted-proxy-auth expliciet is ingeschakeld.

Goed reverse-proxygedrag (inkomende forwarding-headers overschrijven):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Slecht reverse-proxygedrag (niet-vertrouwde forwarding-headers toevoegen/behouden):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS- en origin-notities

- OpenClaw gateway is eerst lokaal/local loopback. Als je TLS beëindigt bij een reverse proxy, stel HSTS daar in op het HTTPS-domein dat naar de proxy wijst.
- Als de gateway zelf HTTPS beëindigt, kun je `gateway.http.securityHeaders.strictTransportSecurity` instellen om de HSTS-header vanuit OpenClaw-responses uit te geven.
- Gedetailleerde deploymentrichtlijnen staan in [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Voor niet-loopback Control UI-deployments is `gateway.controlUi.allowedOrigins` standaard vereist.
- `gateway.controlUi.allowedOrigins: ["*"]` is een expliciet allow-all browser-origin-beleid, geen geharde standaard. Vermijd dit buiten strak gecontroleerde lokale tests.
- Browser-origin-authfouten op loopback blijven rate-limited, zelfs wanneer de
  algemene loopback-vrijstelling is ingeschakeld, maar de lockout-sleutel is gescoped per
  genormaliseerde `Origin`-waarde in plaats van één gedeelde localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt Host-header-origin-fallbackmodus in; behandel dit als een gevaarlijk door de operator gekozen beleid.
- Behandel DNS-rebinding en proxy-host-headergedrag als deployment-hardeningpunten; houd `trustedProxies` strak en vermijd directe blootstelling van de gateway aan het publieke internet.

## Lokale sessielogs staan op schijf

OpenClaw slaat sessietranscripten op schijf op onder `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Dit is vereist voor sessiecontinuïteit en (optioneel) indexering van sessiegeheugen, maar het betekent ook dat
**elk proces/elke gebruiker met bestandssysteemtoegang die logs kan lezen**. Behandel schijftoegang als de vertrouwensgrens
en vergrendel machtigingen op `~/.openclaw` (zie de auditsectie hieronder). Als je
sterkere isolatie tussen agents nodig hebt, voer ze uit onder afzonderlijke OS-gebruikers of op afzonderlijke hosts.

## Node-uitvoering (system.run)

Als een macOS-node is gekoppeld, kan de Gateway `system.run` op die node aanroepen. Dit is **remote code execution** op de Mac:

- Vereist node-koppeling (goedkeuring + token).
- Gateway-nodekoppeling is geen goedkeuringsvlak per opdracht. Het stelt node-identiteit/vertrouwen en tokenuitgifte vast.
- De Gateway past een grof globaal node-opdrachtbeleid toe via `gateway.nodes.allowCommands` / `denyCommands`.
- Beheerd op de Mac via **Instellingen → Exec-goedkeuringen** (beveiliging + vragen + allowlist).
- Het per-node `system.run`-beleid is het eigen exec-goedkeuringsbestand van de node (`exec.approvals.node.*`), dat strenger of losser kan zijn dan het globale command-ID-beleid van de gateway.
- Een node die draait met `security="full"` en `ask="off"` volgt het standaardmodel voor vertrouwde operators. Behandel dat als verwacht gedrag, tenzij je implementatie expliciet een strakkere goedkeurings- of allowlist-houding vereist.
- De goedkeuringsmodus bindt de exacte aanvraagcontext en, waar mogelijk, één concreet lokaal script-/bestandsoperand. Als OpenClaw niet precies één direct lokaal bestand kan identificeren voor een interpreter-/runtime-opdracht, wordt uitvoering op basis van goedkeuring geweigerd in plaats van volledige semantische dekking te beloven.
- Voor `host=node` slaan goedkeuringsruns ook een canoniek voorbereid
  `systemRunPlan` op; later goedgekeurde forwards hergebruiken dat opgeslagen plan, en gateway-
  validatie weigert wijzigingen door de aanroeper aan opdracht/cwd/sessiecontext nadat de
  goedkeuringsaanvraag is aangemaakt.
- Als je geen uitvoering op afstand wilt, stel beveiliging in op **deny** en verwijder node-koppeling voor die Mac.

Dit onderscheid is belangrijk voor triage:

- Een opnieuw verbindende gekoppelde node die een andere opdrachtenlijst adverteert, is op zichzelf geen kwetsbaarheid als het globale Gateway-beleid en de lokale exec-goedkeuringen van de node nog steeds de daadwerkelijke uitvoeringsgrens afdwingen.
- Meldingen die node-koppelingsmetadata behandelen als een tweede verborgen goedkeuringslaag per opdracht zijn meestal verwarring over beleid/UX, geen omzeiling van een beveiligingsgrens.

## Dynamische Skills (watcher / externe nodes)

OpenClaw kan de skills-lijst tijdens een sessie verversen:

- **Skills-watcher**: wijzigingen aan `SKILL.md` kunnen de skills-snapshot bij de volgende agentbeurt bijwerken.
- **Externe nodes**: het verbinden van een macOS-node kan macOS-only skills in aanmerking laten komen (op basis van bin-probing).

Behandel skill-mappen als **vertrouwde code** en beperk wie ze kan wijzigen.

## Het dreigingsmodel

Je AI-assistent kan:

- Willekeurige shellopdrachten uitvoeren
- Bestanden lezen/schrijven
- Toegang krijgen tot netwerkdiensten
- Berichten naar iedereen sturen (als je WhatsApp-toegang geeft)

Mensen die je berichten sturen kunnen:

- Proberen je AI te misleiden om slechte dingen te doen
- Toegang tot je gegevens social engineeren
- Peilen naar infrastructuurdetails

## Kernconcept: toegangscontrole vóór intelligentie

De meeste fouten hier zijn geen geavanceerde exploits — ze zijn “iemand stuurde de bot een bericht en de bot deed wat werd gevraagd.”

De houding van OpenClaw:

- **Eerst identiteit:** bepaal wie met de bot mag praten (DM-koppeling / allowlists / expliciet “open”).
- **Daarna scope:** bepaal waar de bot mag handelen (groeps-allowlists + vermelding-gating, tools, sandboxing, apparaatmachtigingen).
- **Model als laatste:** ga ervan uit dat het model kan worden gemanipuleerd; ontwerp zo dat manipulatie een beperkte impact heeft.

## Opdrachtautorisatiemodel

Slash-opdrachten en directives worden alleen gehonoreerd voor **geautoriseerde afzenders**. Autorisatie is afgeleid van
kanaal-allowlists/koppeling plus `commands.useAccessGroups` (zie [Configuratie](/nl/gateway/configuration)
en [Slash-opdrachten](/nl/tools/slash-commands)). Als een kanaal-allowlist leeg is of `"*"` bevat,
staan opdrachten effectief open voor dat kanaal.

`/exec` is een sessiegebonden gemak voor geautoriseerde operators. Het schrijft **geen** config en
wijzigt geen andere sessies.

## Risico van control-plane-tools

Twee ingebouwde tools kunnen permanente control-plane-wijzigingen aanbrengen:

- `gateway` kan config inspecteren met `config.schema.lookup` / `config.get`, en permanente wijzigingen aanbrengen met `config.apply`, `config.patch` en `update.run`.
- `cron` kan geplande taken maken die blijven draaien nadat de oorspronkelijke chat/taak eindigt.

De owner-only runtime-tool `gateway` weigert nog steeds
`tools.exec.ask` of `tools.exec.security` te herschrijven; legacy `tools.bash.*`-aliassen worden
genormaliseerd naar dezelfde beschermde exec-paden vóór de schrijfactie.
Door agents aangestuurde bewerkingen met `gateway config.apply` en `gateway config.patch` zijn
standaard fail-closed: alleen een smalle set prompt-, model- en mention-gating-
paden kan door agents worden aangepast. Nieuwe gevoelige config-bomen zijn daarom beschermd
tenzij ze doelbewust aan de allowlist worden toegevoegd.

Weiger deze standaard voor elke agent/surface die onvertrouwde inhoud verwerkt:

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
- Controleer pluginconfig vóór inschakeling.
- Herstart de Gateway na pluginwijzigingen.
- Als je plugins installeert of bijwerkt (`openclaw plugins install <package>`, `openclaw plugins update <id>`), behandel dit dan alsof je onvertrouwde code uitvoert:
  - Het installatiepad is de per-plugin-map onder de actieve plugin-installatieroot.
  - OpenClaw voert vóór installatie/update een ingebouwde scan op gevaarlijke code uit. `critical`-bevindingen blokkeren standaard.
  - npm- en git-plugininstallaties voeren convergentie van package-manager-afhankelijkheden alleen uit tijdens de expliciete installatie-/updateflow. Lokale paden en archieven worden behandeld als zelfstandige pluginpakketten; OpenClaw kopieert/verwijst ernaar zonder `npm install` uit te voeren.
  - Geef de voorkeur aan gepinde, exacte versies (`@scope/pkg@1.2.3`) en inspecteer de uitgepakte code op schijf vóór inschakeling.
  - `--dangerously-force-unsafe-install` is alleen een noodoptie voor false positives van de ingebouwde scan bij plugin-installatie-/updateflows. Het omzeilt geen beleidsblokkades van plugin-`before_install`-hooks en omzeilt geen scanfouten.
  - Door Gateway ondersteunde installatie van skill-afhankelijkheden volgt dezelfde gevaarlijk/verdacht-splitsing: ingebouwde `critical`-bevindingen blokkeren tenzij de aanroeper expliciet `dangerouslyForceUnsafeInstall` instelt, terwijl verdachte bevindingen nog steeds alleen waarschuwen. `openclaw skills install` blijft de afzonderlijke download-/installatieflow voor ClawHub-skills.

Details: [Plugins](/nl/tools/plugin)

## DM-toegangsmodel: koppeling, allowlist, open, uitgeschakeld

Alle huidige DM-geschikte kanalen ondersteunen een DM-beleid (`dmPolicy` of `*.dm.policy`) dat inkomende DM's afschermt **voordat** het bericht wordt verwerkt:

- `pairing` (standaard): onbekende afzenders ontvangen een korte koppelingscode en de bot negeert hun bericht totdat dit is goedgekeurd. Codes verlopen na 1 uur; herhaalde DM's sturen geen code opnieuw totdat een nieuwe aanvraag is aangemaakt. Openstaande aanvragen zijn standaard beperkt tot **3 per kanaal**.
- `allowlist`: onbekende afzenders worden geblokkeerd (geen koppelingshandshake).
- `open`: sta iedereen toe te DM'en (publiek). **Vereist** dat de kanaal-allowlist `"*"` bevat (expliciete opt-in).
- `disabled`: negeer inkomende DM's volledig.

Goedkeuren via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + bestanden op schijf: [Koppeling](/nl/channels/pairing)

## DM-sessie-isolatie (multi-user-modus)

Standaard routeert OpenClaw **alle DM's naar de hoofdsessie** zodat je assistent continuïteit heeft over apparaten en kanalen heen. Als **meerdere mensen** de bot kunnen DM'en (open DM's of een allowlist met meerdere personen), overweeg dan DM-sessies te isoleren:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Dit voorkomt contextlekken tussen gebruikers terwijl groepschats geïsoleerd blijven.

Dit is een grens voor berichtcontext, geen host-admin-grens. Als gebruikers elkaar niet vertrouwen en dezelfde Gateway-host/config delen, draai dan in plaats daarvan afzonderlijke gateways per vertrouwensgrens.

### Veilige DM-modus (aanbevolen)

Behandel het fragment hierboven als **veilige DM-modus**:

- Standaard: `session.dmScope: "main"` (alle DM's delen één sessie voor continuïteit).
- Standaard voor lokale CLI-onboarding: schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld (behoudt bestaande expliciete waarden).
- Veilige DM-modus: `session.dmScope: "per-channel-peer"` (elk kanaal+afzender-paar krijgt een geïsoleerde DM-context).
- Cross-channel peer-isolatie: `session.dmScope: "per-peer"` (elke afzender krijgt één sessie over alle kanalen van hetzelfde type).

Als je meerdere accounts op hetzelfde kanaal gebruikt, gebruik dan in plaats daarvan `per-account-channel-peer`. Als dezelfde persoon contact met je opneemt via meerdere kanalen, gebruik dan `session.identityLinks` om die DM-sessies samen te voegen tot één canonieke identiteit. Zie [Sessiebeheer](/nl/concepts/session) en [Configuratie](/nl/gateway/configuration).

## Allowlists voor DM's en groepen

OpenClaw heeft twee afzonderlijke lagen voor “wie kan mij triggeren?”:

- **DM-allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): wie met de bot mag praten in directe berichten.
  - Wanneer `dmPolicy="pairing"` worden goedkeuringen geschreven naar de account-scoped pairing-allowlistopslag onder `~/.openclaw/credentials/` (`<channel>-allowFrom.json` voor het standaardaccount, `<channel>-<accountId>-allowFrom.json` voor niet-standaardaccounts), samengevoegd met config-allowlists.
- **Groeps-allowlist** (kanaalspecifiek): van welke groepen/kanalen/guilds de bot überhaupt berichten accepteert.
  - Veelvoorkomende patronen:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: per-groep-standaarden zoals `requireMention`; wanneer ingesteld, fungeert dit ook als groeps-allowlist (neem `"*"` op om allow-all-gedrag te behouden).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: beperk wie de bot _binnen_ een groepssessie kan triggeren (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: per-surface allowlists + vermeldingsstandaarden.
  - Groepscontroles worden in deze volgorde uitgevoerd: eerst `groupPolicy`/groeps-allowlists, daarna activering via vermelding/antwoord.
  - Antwoorden op een botbericht (impliciete vermelding) omzeilt afzender-allowlists zoals `groupAllowFrom` **niet**.
  - **Beveiligingsopmerking:** behandel `dmPolicy="open"` en `groupPolicy="open"` als laatste redmiddel. Ze zouden nauwelijks gebruikt moeten worden; geef de voorkeur aan pairing + allowlists tenzij je elk lid van de ruimte volledig vertrouwt.

Details: [Configuratie](/nl/gateway/configuration) en [Groepen](/nl/channels/groups)

## Promptinjectie (wat het is, waarom het ertoe doet)

Promptinjectie is wanneer een aanvaller een bericht opstelt dat het model manipuleert om iets onveiligs te doen (“negeer je instructies”, “dump je bestandssysteem”, “volg deze link en voer opdrachten uit”, enz.).

Zelfs met sterke systeemprompts is **promptinjectie niet opgelost**. Guardrails in systeemprompts zijn alleen zachte begeleiding; harde afdwinging komt van toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists (en operators kunnen deze bewust uitschakelen). Wat in de praktijk helpt:

- Houd inkomende DM's vergrendeld (pairing/allowlists).
- Geef de voorkeur aan mention-gating in groepen; vermijd “always-on” bots in openbare ruimtes.
- Behandel links, bijlagen en geplakte instructies standaard als vijandig.
- Voer gevoelige tooluitvoering uit in een sandbox; houd secrets buiten het voor de agent bereikbare bestandssysteem.
- Opmerking: sandboxing is opt-in. Als sandboxmodus uit staat, wordt impliciet `host=auto` omgezet naar de gatewayhost. Expliciet `host=sandbox` faalt nog steeds gesloten omdat er geen sandbox-runtime beschikbaar is. Stel `host=gateway` in als je wilt dat dit gedrag expliciet in de configuratie staat.
- Beperk tools met hoog risico (`exec`, `browser`, `web_fetch`, `web_search`) tot vertrouwde agents of expliciete allowlists.
- Als je interpreters toestaat (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), schakel dan `tools.exec.strictInlineEval` in zodat inline-eval-vormen nog steeds expliciete goedkeuring nodig hebben.
- Shell-goedkeuringsanalyse weigert ook POSIX-vormen voor parameterexpansie (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) binnen **niet-gequote heredocs**, zodat een toegestane heredoc-body geen shell-expansie als platte tekst langs allowlist-controle kan smokkelen. Quote de heredoc-terminator (bijvoorbeeld `<<'EOF'`) om te kiezen voor letterlijke body-semantiek; niet-gequote heredocs die variabelen zouden hebben uitgebreid, worden geweigerd.
- **Modelkeuze is belangrijk:** oudere/kleinere/legacy-modellen zijn aanzienlijk minder robuust tegen promptinjectie en misbruik van tools. Gebruik voor agents met tools het sterkste beschikbare model van de nieuwste generatie dat is gehard voor instructies.

Waarschuwingssignalen die als niet-vertrouwd moeten worden behandeld:

- “Lees dit bestand/deze URL en doe precies wat erin staat.”
- “Negeer je systeemprompt of veiligheidsregels.”
- “Onthul je verborgen instructies of tooluitvoer.”
- “Plak de volledige inhoud van ~/.openclaw of je logs.”

## Sanitization van speciale tokens in externe content

OpenClaw verwijdert gangbare speciale-token-literals uit chat-templates van self-hosted LLM's uit ingepakte externe content en metadata voordat ze het model bereiken. Gedekte markerfamilies omvatten Qwen/ChatML, Llama, Gemma, Mistral, Phi en GPT-OSS role/turn-tokens.

Waarom:

- OpenAI-compatibele backends die voor self-hosted modellen staan, behouden soms speciale tokens die in gebruikerstekst voorkomen, in plaats van ze te maskeren. Een aanvaller die naar inkomende externe content kan schrijven (een opgehaalde pagina, een e-mailbody, tooluitvoer met bestandsinhoud), zou anders een synthetische `assistant`- of `system`-rolgrens kunnen injecteren en ontsnappen aan de guardrails voor ingepakte content.
- Sanitization gebeurt op de wrapping-laag voor externe content, zodat dit uniform geldt voor fetch/read-tools en inkomende kanaalcontent in plaats van per provider.
- Uitgaande modelantwoorden hebben al een aparte sanitizer die gelekte `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` en vergelijkbare interne runtime-scaffolding verwijdert uit voor gebruikers zichtbare antwoorden bij de uiteindelijke kanaalafleveringsgrens. De sanitizer voor externe content is de inkomende tegenhanger.

Dit vervangt de andere hardening op deze pagina niet — `dmPolicy`, allowlists, exec-goedkeuringen, sandboxing en `contextVisibility` doen nog steeds het primaire werk. Het sluit één specifieke bypass op tokenizer-laag tegen self-hosted stacks die gebruikerstekst met speciale tokens intact doorsturen.

## Onveilige bypass-flags voor externe content

OpenClaw bevat expliciete bypass-flags die veiligheidswrapping van externe content uitschakelen:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron-payloadveld `allowUnsafeExternalContent`

Richtlijn:

- Laat deze unset/false in productie.
- Schakel ze alleen tijdelijk in voor strak afgebakende debugging.
- Als ze zijn ingeschakeld, isoleer die agent (sandbox + minimale tools + dedicated sessienaamruimte).

Risico-opmerking voor hooks:

- Hook-payloads zijn niet-vertrouwde content, zelfs wanneer de aflevering komt van systemen die je beheert (mail/docs/webcontent kan promptinjectie bevatten).
- Zwakke modeltiers vergroten dit risico. Geef voor hook-gedreven automatisering de voorkeur aan sterke moderne modeltiers en houd het toolbeleid strak (`tools.profile: "messaging"` of strenger), plus sandboxing waar mogelijk.

### Promptinjectie vereist geen openbare DM's

Zelfs als **alleen jij** de bot berichten kunt sturen, kan promptinjectie nog steeds gebeuren via
alle **niet-vertrouwde content** die de bot leest (webzoek-/fetch-resultaten, browserpagina's,
e-mails, docs, bijlagen, geplakte logs/code). Met andere woorden: de afzender is niet
het enige aanvalsoppervlak; de **content zelf** kan vijandige instructies bevatten.

Wanneer tools zijn ingeschakeld, is het typische risico het exfiltreren van context of het triggeren van
toolaanroepen. Beperk de blast radius door:

- Een alleen-lezen of tool-uitgeschakelde **reader agent** te gebruiken om niet-vertrouwde content samen te vatten,
  en die samenvatting daarna aan je hoofdagent door te geven.
- `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools, tenzij nodig.
- Voor OpenResponses-URL-invoer (`input_file` / `input_image`) strakke
  `gateway.http.endpoints.responses.files.urlAllowlist` en
  `gateway.http.endpoints.responses.images.urlAllowlist` in te stellen, en `maxUrlParts` laag te houden.
  Lege allowlists worden als unset behandeld; gebruik `files.allowUrl: false` / `images.allowUrl: false`
  als je URL-fetching volledig wilt uitschakelen.
- Voor OpenResponses-bestandsinvoer wordt gedecodeerde `input_file`-tekst nog steeds geïnjecteerd als
  **niet-vertrouwde externe content**. Vertrouw niet op bestandstekst alleen omdat
  de Gateway deze lokaal heeft gedecodeerd. Het geïnjecteerde blok bevat nog steeds expliciete
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>`-grensmarkers plus `Source: External`-
  metadata, ook al laat dit pad de langere `SECURITY NOTICE:`-banner weg.
- Dezelfde markergebaseerde wrapping wordt toegepast wanneer media-understanding tekst extraheert
  uit bijgevoegde documenten voordat die tekst aan de mediaprompt wordt toegevoegd.
- Sandboxing en strikte tool-allowlists in te schakelen voor elke agent die met niet-vertrouwde invoer in aanraking komt.
- Secrets uit prompts te houden; geef ze in plaats daarvan door via env/config op de gatewayhost.

### Self-hosted LLM-backends

OpenAI-compatibele self-hosted backends zoals vLLM, SGLang, TGI, LM Studio,
of aangepaste Hugging Face-tokenizerstacks kunnen verschillen van hosted providers in hoe
speciale tokens uit chat-templates worden behandeld. Als een backend letterlijke strings
zoals `<|im_start|>`, `<|start_header_id|>` of `<start_of_turn>` tokenizet als
structurele chat-template-tokens binnen gebruikerscontent, kan niet-vertrouwde tekst proberen
rolgrenzen te vervalsen op de tokenizer-laag.

OpenClaw verwijdert gangbare speciale-token-literals van modelfamilies uit ingepakte
externe content voordat deze naar het model wordt verzonden. Houd externe-content-
wrapping ingeschakeld, en geef de voorkeur aan backend-instellingen die speciale
tokens in door gebruikers aangeleverde content splitsen of escapen wanneer beschikbaar. Hosted providers zoals OpenAI
en Anthropic passen al hun eigen request-side sanitization toe.

### Modelsterkte (beveiligingsopmerking)

Weerstand tegen promptinjectie is **niet** uniform over modeltiers. Kleinere/goedkopere modellen zijn over het algemeen gevoeliger voor toolmisbruik en instructiekaping, vooral onder vijandige prompts.

<Warning>
Voor agents met tools of agents die niet-vertrouwde content lezen, is het promptinjectierisico met oudere/kleinere modellen vaak te hoog. Draai die workloads niet op zwakke modeltiers.
</Warning>

Aanbevelingen:

- **Gebruik het model van de nieuwste generatie en beste tier** voor elke bot die tools kan uitvoeren of bestanden/netwerken kan aanraken.
- **Gebruik geen oudere/zwakkere/kleinere tiers** voor agents met tools of niet-vertrouwde inboxen; het promptinjectierisico is te hoog.
- Als je een kleiner model moet gebruiken, **beperk de blast radius** (alleen-lezen tools, sterke sandboxing, minimale bestandssysteemtoegang, strikte allowlists).
- Wanneer je kleine modellen draait, **schakel sandboxing in voor alle sessies** en **schakel web_search/web_fetch/browser uit**, tenzij invoer strikt wordt beheerst.
- Voor persoonlijke chat-only assistenten met vertrouwde invoer en geen tools zijn kleinere modellen meestal prima.

## Redenering en uitgebreide uitvoer in groepen

`/reasoning`, `/verbose` en `/trace` kunnen interne redenering, tool-
uitvoer of Plugin-diagnostiek blootleggen die
niet bedoeld was voor een openbaar kanaal. Behandel ze in groepsinstellingen als **alleen debug**
en houd ze uit, tenzij je ze expliciet nodig hebt.

Richtlijn:

- Houd `/reasoning`, `/verbose` en `/trace` uitgeschakeld in openbare ruimtes.
- Als je ze inschakelt, doe dat alleen in vertrouwde DM's of strak beheerde ruimtes.
- Onthoud: uitgebreide uitvoer en trace-uitvoer kunnen toolargumenten, URL's, Plugin-diagnostiek en data bevatten die het model heeft gezien.

## Voorbeelden voor configuratiehardening

### Bestandsrechten

Houd configuratie + state privé op de gatewayhost:

- `~/.openclaw/openclaw.json`: `600` (alleen gebruiker lezen/schrijven)
- `~/.openclaw`: `700` (alleen gebruiker)

`openclaw doctor` kan waarschuwen en aanbieden deze rechten aan te scherpen.

### Netwerkblootstelling (bind, poort, firewall)

De Gateway multiplexet **WebSocket + HTTP** op één poort:

- Standaard: `18789`
- Configuratie/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Dit HTTP-oppervlak omvat de Control UI en de canvashost:

- Control UI (SPA-assets) (standaardbasispad `/`)
- Canvashost: `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` (willekeurige HTML/JS; behandel als niet-vertrouwde content)

Als je canvascontent in een normale browser laadt, behandel deze dan als elke andere niet-vertrouwde webpagina:

- Stel de canvashost niet bloot aan niet-vertrouwde netwerken/gebruikers.
- Laat canvascontent niet dezelfde origin delen als geprivilegieerde weboppervlakken, tenzij je de implicaties volledig begrijpt.

Bindmodus bepaalt waar de Gateway luistert:

- `gateway.bind: "loopback"` (standaard): alleen lokale clients kunnen verbinden.
- Niet-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) vergroten het aanvalsoppervlak. Gebruik ze alleen met gateway-authenticatie (gedeeld token/wachtwoord of een correct geconfigureerde vertrouwde proxy) en een echte firewall.

Vuistregels:

- Geef de voorkeur aan Tailscale Serve boven LAN-binds (Serve houdt de Gateway op loopback, en Tailscale regelt toegang).
- Als je naar LAN moet binden, firewall de poort dan naar een strakke allowlist van bron-IP's; port-forward deze niet breed.
- Stel de Gateway nooit zonder authenticatie bloot op `0.0.0.0`.

### Docker-poortpublicatie met UFW

Als je OpenClaw met Docker op een VPS draait, onthoud dan dat gepubliceerde containerpoorten
(`-p HOST:CONTAINER` of Compose `ports:`) worden gerouteerd via Docker's forwarding-
chains, niet alleen via host-`INPUT`-regels.

Om Docker-verkeer in lijn te houden met je firewallbeleid, handhaaf je regels in
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

Vermijd het hardcoderen van interfacenamen zoals `eth0` in documentatiesnippets. Interfacenamen
verschillen tussen VPS-images (`ens3`, `enp*`, enz.) en mismatches kunnen per ongeluk
je deny-regel overslaan.

Snelle validatie na reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Verwachte externe poorten zouden alleen moeten zijn wat je bewust blootstelt (voor de meeste
setups: SSH + je reverse-proxy-poorten).

### mDNS/Bonjour-discovery

De Gateway broadcast zijn aanwezigheid via mDNS (`_openclaw-gw._tcp` op poort 5353) voor lokale apparaatdetectie. In volledige modus omvat dit TXT-records die operationele details kunnen blootleggen:

- `cliPath`: volledig bestandssysteempad naar het CLI-binaire bestand (onthult gebruikersnaam en installatielocatie)
- `sshPort`: kondigt SSH-beschikbaarheid op de host aan
- `displayName`, `lanHost`: hostnaaminformatie

**Overweging voor operationele beveiliging:** Het uitzenden van infrastructuurdetails maakt verkenning gemakkelijker voor iedereen op het lokale netwerk. Zelfs "onschuldige" info zoals bestandssysteempaden en SSH-beschikbaarheid helpt aanvallers je omgeving in kaart te brengen.

**Aanbevelingen:**

1. **Minimale modus** (standaard, aanbevolen voor blootgestelde gateways): laat gevoelige velden weg uit mDNS-uitzendingen:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Volledig uitschakelen** als je lokale apparaatdetectie niet nodig hebt:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Volledige modus** (opt-in): neem `cliPath` + `sshPort` op in TXT-records:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Omgevingsvariabele** (alternatief): stel `OPENCLAW_DISABLE_BONJOUR=1` in om mDNS uit te schakelen zonder configwijzigingen.

In minimale modus zendt de Gateway nog steeds genoeg uit voor apparaatdetectie (`role`, `gatewayPort`, `transport`), maar laat `cliPath` en `sshPort` weg. Apps die CLI-padinformatie nodig hebben, kunnen die in plaats daarvan ophalen via de geauthenticeerde WebSocket-verbinding.

### Vergrendel de Gateway WebSocket (lokale auth)

Gateway-auth is **standaard vereist**. Als er geen geldig gateway-auth-pad is geconfigureerd,
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
`gateway.remote.token` en `gateway.remote.password` zijn bronnen voor clientreferenties. Ze beschermen lokale WS-toegang **niet** op zichzelf. Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld. Als `gateway.auth.token` of `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de oplossing gesloten (geen maskering door externe fallback).
</Note>
Optioneel: pin externe TLS met `gateway.remote.tlsFingerprint` wanneer je `wss://` gebruikt.
Plattetekst `ws://` is standaard alleen voor loopback. Voor vertrouwde paden op privénetwerken
stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als
noodoptie. Dit is bewust alleen een procesomgeving, geen
`openclaw.json`-configsleutel.
Mobiele koppeling en Android-routes voor handmatige of gescande gateways zijn strenger:
cleartext wordt geaccepteerd voor loopback, maar private-LAN, link-local, `.local` en
hostnamen zonder punt moeten TLS gebruiken, tenzij je expliciet kiest voor het vertrouwde
cleartext-pad op een privénetwerk.

Lokale apparaatkoppeling:

- Apparaatkoppeling wordt automatisch goedgekeurd voor directe local loopback-verbindingen om
  clients op dezelfde host soepel te laten werken.
- OpenClaw heeft ook een smal zelfverbindingspad voor backend/container-lokaal gebruik voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief tailnet-binds op dezelfde host, worden als
  extern behandeld voor koppeling en vereisen nog steeds goedkeuring.
- Bewijs via doorgestuurde headers op een loopback-verzoek diskwalificeert loopback-
  lokaliteit. Automatische goedkeuring voor metadata-upgrades is nauw afgebakend. Zie
  [Gateway-koppeling](/nl/gateway/pairing) voor beide regels.

Auth-modi:

- `gateway.auth.mode: "token"`: gedeeld bearer-token (aanbevolen voor de meeste installaties).
- `gateway.auth.mode: "password"`: wachtwoordauth (bij voorkeur instellen via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: vertrouw op een identiteitsbewuste reverse proxy om gebruikers te authenticeren en identiteit via headers door te geven (zie [Vertrouwde proxy-auth](/nl/gateway/trusted-proxy-auth)).

Rotatiechecklist (token/wachtwoord):

1. Genereer/stel een nieuw geheim in (`gateway.auth.token` of `OPENCLAW_GATEWAY_PASSWORD`).
2. Herstart de Gateway (of herstart de macOS-app als die de Gateway beheert).
3. Werk alle externe clients bij (`gateway.remote.token` / `.password` op machines die de Gateway aanroepen).
4. Controleer dat je niet langer met de oude referenties kunt verbinden.

### Identiteitsheaders van Tailscale Serve

Wanneer `gateway.auth.allowTailscale` `true` is (standaard voor Serve), accepteert OpenClaw
identiteitsheaders van Tailscale Serve (`tailscale-user-login`) voor authenticatie van Control
UI/WebSocket. OpenClaw verifieert de identiteit door het
`x-forwarded-for`-adres op te lossen via de lokale Tailscale-daemon (`tailscale whois`)
en het te matchen met de header. Dit wordt alleen geactiveerd voor verzoeken die loopback raken
en `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host` bevatten zoals
geïnjecteerd door Tailscale.
Voor dit asynchrone identiteitscontrolepad worden mislukte pogingen voor dezelfde `{scope, ip}`
geserialiseerd voordat de limiter de mislukking registreert. Gelijktijdige slechte retries
van één Serve-client kunnen de tweede poging daardoor onmiddellijk uitsluiten
in plaats van als twee gewone mismatches door te racen.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** auth via Tailscale-identiteitsheaders. Ze volgen nog steeds de
geconfigureerde HTTP-authmodus van de gateway.

Belangrijke grensnotitie:

- Gateway HTTP bearer-auth is feitelijk alles-of-niets operatortoegang.
- Behandel referenties die `/v1/chat/completions`, `/v1/responses` of `/api/channels/*` kunnen aanroepen als operatorgeheimen met volledige toegang voor die gateway.
- Op het OpenAI-compatibele HTTP-oppervlak herstelt bearer-auth met gedeeld geheim de volledige standaard operatorscopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) en eigenaarssemantiek voor agentbeurten; smallere `x-openclaw-scopes`-waarden beperken dat pad met gedeeld geheim niet.
- Scope-semantiek per verzoek op HTTP geldt alleen wanneer het verzoek afkomstig is uit een modus met identiteit, zoals vertrouwde proxy-auth of `gateway.auth.mode="none"` op een private ingress.
- In die modi met identiteit valt het weglaten van `x-openclaw-scopes` terug op de normale standaard operatorscopeset; stuur de header expliciet wanneer je een smallere scopeset wilt.
- `/tools/invoke` volgt dezelfde regel voor gedeelde geheimen: bearer-auth met token/wachtwoord wordt daar ook behandeld als volledige operatortoegang, terwijl modi met identiteit nog steeds gedeclareerde scopes respecteren.
- Deel deze referenties niet met niet-vertrouwde aanroepers; gebruik bij voorkeur afzonderlijke gateways per vertrouwensgrens.

**Vertrouwensaannname:** tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is.
Beschouw dit niet als bescherming tegen vijandige processen op dezelfde host. Als niet-vertrouwde
lokale code op de gatewayhost kan draaien, schakel dan `gateway.auth.allowTailscale` uit
en vereis expliciete auth met gedeeld geheim via `gateway.auth.mode: "token"` of
`"password"`.

**Beveiligingsregel:** stuur deze headers niet door vanaf je eigen reverse proxy. Als
je TLS beëindigt of via een proxy vóór de gateway werkt, schakel dan
`gateway.auth.allowTailscale` uit en gebruik in plaats daarvan auth met gedeeld geheim (`gateway.auth.mode:
"token"` of `"password"`) of [Vertrouwde proxy-auth](/nl/gateway/trusted-proxy-auth).

Vertrouwde proxies:

- Als je TLS vóór de Gateway beëindigt, stel `gateway.trustedProxies` in op de IP's van je proxy.
- OpenClaw vertrouwt `x-forwarded-for` (of `x-real-ip`) vanaf die IP's om het client-IP te bepalen voor lokale koppelingscontroles en HTTP-auth/lokale controles.
- Zorg dat je proxy `x-forwarded-for` **overschrijft** en directe toegang tot de Gateway-poort blokkeert.

Zie [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

### Browserbediening via Node-host (aanbevolen)

Als je Gateway extern is maar de browser op een andere machine draait, voer dan een **Node-host**
uit op de browsermachine en laat de Gateway browseracties proxyen (zie [Browsertool](/nl/tools/browser)).
Behandel Node-koppeling als admin-toegang.

Aanbevolen patroon:

- Houd de Gateway en Node-host op hetzelfde tailnet (Tailscale).
- Koppel de Node bewust; schakel browserproxyroutering uit als je die niet nodig hebt.

Vermijd:

- Relay-/controlpoorten blootstellen via LAN of het openbare internet.
- Tailscale Funnel voor browserbedieningseindpunten (openbare blootstelling).

### Geheimen op schijf

Ga ervan uit dat alles onder `~/.openclaw/` (of `$OPENCLAW_STATE_DIR/`) geheimen of privégegevens kan bevatten:

- `openclaw.json`: config kan tokens bevatten (gateway, externe gateway), providerinstellingen en allowlists.
- `credentials/**`: kanaalreferenties (voorbeeld: WhatsApp-referenties), koppelingsallowlists, legacy OAuth-imports.
- `agents/<agentId>/agent/auth-profiles.json`: API-sleutels, tokenprofielen, OAuth-tokens en optioneel `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex-appserveraccount, config, skills, plugins, native threadstatus en diagnostiek.
- `secrets.json` (optioneel): door bestanden ondersteunde geheime payload gebruikt door `file` SecretRef-providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: legacy compatibiliteitsbestand. Statische `api_key`-items worden opgeschoond wanneer ze worden ontdekt.
- `agents/<agentId>/sessions/**`: sessietranscripten (`*.jsonl`) + routeringsmetadata (`sessions.json`) die privéberichten en tooluitvoer kunnen bevatten.
- gebundelde Plugin-pakketten: geïnstalleerde plugins (plus hun `node_modules/`).
- `sandboxes/**`: tool-sandboxwerkruimten; kunnen kopieën ophopen van bestanden die je binnen de sandbox leest/schrijft.

Hardeningtips:

- Houd permissies strikt (`700` op dirs, `600` op bestanden).
- Gebruik volledige schijfversleuteling op de gatewayhost.
- Gebruik bij voorkeur een speciaal OS-gebruikersaccount voor de Gateway als de host gedeeld is.

### Workspace-`.env`-bestanden

OpenClaw laadt workspace-lokale `.env`-bestanden voor agents en tools, maar laat die bestanden nooit stilzwijgend gateway-runtimebesturing overschrijven.

- Elke sleutel die begint met `OPENCLAW_*` wordt geblokkeerd vanuit niet-vertrouwde workspace-`.env`-bestanden.
- Kanaaleindpuntinstellingen voor Matrix, Mattermost, IRC en Synology Chat worden ook geblokkeerd voor workspace-`.env`-overschrijvingen, zodat gekloonde workspaces gebundeld connectorverkeer niet via lokale eindpuntconfig kunnen omleiden. Eindpunt-env-sleutels (zoals `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) moeten uit de procesomgeving van de gateway of `env.shellEnv` komen, niet uit een door de workspace geladen `.env`.
- De blokkade is fail-closed: een nieuwe runtime-control-variabele die in een toekomstige release wordt toegevoegd, kan niet worden geërfd uit een ingecheckte of door een aanvaller aangeleverde `.env`; de sleutel wordt genegeerd en de gateway behoudt zijn eigen waarde.
- Vertrouwde proces-/OS-omgevingsvariabelen (de eigen shell van de gateway, launchd-/systemd-unit, appbundel) blijven gelden — dit beperkt alleen het laden van `.env`-bestanden.

Waarom: workspace-`.env`-bestanden staan vaak naast agentcode, worden per ongeluk gecommit of worden door tools geschreven. Het blokkeren van het hele `OPENCLAW_*`-voorvoegsel betekent dat het later toevoegen van een nieuwe `OPENCLAW_*`-flag nooit kan terugvallen naar stille overerving uit workspacestatus.

### Logs en transcripten (redactie en retentie)

Logs en transcripten kunnen gevoelige info lekken, zelfs wanneer toegangscontroles correct zijn:

- Gateway-logs kunnen toolsamenvattingen, fouten en URL's bevatten.
- Sessietranscripten kunnen geplakte geheimen, bestandsinhoud, commandouitvoer en links bevatten.

Aanbevelingen:

- Houd redactie van logs en transcripten ingeschakeld (`logging.redactSensitive: "tools"`; standaard).
- Voeg aangepaste patronen voor je omgeving toe via `logging.redactPatterns` (tokens, hostnamen, interne URL's).
- Gebruik bij het delen van diagnostiek bij voorkeur `openclaw status --all` (plakbaar, geheimen geredigeerd) in plaats van ruwe logs.
- Snoei oude sessietranscripten en logbestanden als je geen lange retentie nodig hebt.

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

### Afzonderlijke nummers (WhatsApp, Signal, Telegram)

Overweeg voor telefoonnummergebaseerde kanalen om je AI op een ander telefoonnummer te draaien dan je persoonlijke nummer:

- Persoonlijk nummer: je gesprekken blijven privé
- Botnummer: AI handelt deze af, met passende grenzen

### Alleen-lezenmodus (via sandbox en tools)

Je kunt een alleen-lezenprofiel bouwen door het volgende te combineren:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (of `"none"` voor geen toegang tot de workspace)
- lijsten voor toestaan/weigeren van tools die `write`, `edit`, `apply_patch`, `exec`, `process`, enzovoort blokkeren.

Aanvullende opties voor versteviging:

- `tools.exec.applyPatch.workspaceOnly: true` (standaard): zorgt ervoor dat `apply_patch` niet buiten de workspace-map kan schrijven/verwijderen, zelfs wanneer sandboxing uit staat. Zet dit alleen op `false` als je bewust wilt dat `apply_patch` bestanden buiten de workspace aanraakt.
- `tools.fs.workspaceOnly: true` (optioneel): beperkt paden voor `read`/`write`/`edit`/`apply_patch` en auto-loadpaden voor native promptafbeeldingen tot de workspace-map (handig als je vandaag absolute paden toestaat en één vangrail wilt).
- Houd bestandssysteemroots smal: vermijd brede roots zoals je thuismap voor agent-workspaces/sandbox-workspaces. Brede roots kunnen gevoelige lokale bestanden (bijvoorbeeld status/configuratie onder `~/.openclaw`) blootstellen aan bestandssysteemtools.

### Veilige basisconfiguratie (kopiëren/plakken)

Eén “veilige standaard”-configuratie die de Gateway privé houdt, DM-koppeling vereist en altijd actieve groepsbots vermijdt:

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

Als je ook “standaard veiliger” tooluitvoering wilt, voeg dan een sandbox toe en weiger gevaarlijke tools voor elke agent die geen eigenaar is (voorbeeld hieronder onder “Toegangsprofielen per agent”).

Ingebouwde basis voor chatgestuurde agentbeurten: afzenders die geen eigenaar zijn, kunnen de tools `cron` of `gateway` niet gebruiken.

## Sandboxing (aanbevolen)

Specifiek document: [Sandboxing](/nl/gateway/sandboxing)

Twee aanvullende benaderingen:

- **Draai de volledige Gateway in Docker** (containergrens): [Docker](/nl/install/docker)
- **Tool-sandbox** (`agents.defaults.sandbox`, host-Gateway + sandbox-geïsoleerde tools; Docker is de standaardbackend): [Sandboxing](/nl/gateway/sandboxing)

<Note>
Houd `agents.defaults.sandbox.scope` op `"agent"` (standaard) om toegang tussen agents te voorkomen, of gebruik `"session"` voor strengere isolatie per sessie. `scope: "shared"` gebruikt één container of workspace.
</Note>

Overweeg ook agent-workspacetoegang binnen de sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (standaard) houdt de agent-workspace buiten bereik; tools draaien tegen een sandbox-workspace onder `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` koppelt de agent-workspace alleen-lezen aan `/agent` (schakelt `write`/`edit`/`apply_patch` uit)
- `agents.defaults.sandbox.workspaceAccess: "rw"` koppelt de agent-workspace lezen/schrijven aan `/workspace`
- Extra `sandbox.docker.binds` worden gevalideerd tegen genormaliseerde en gecanonicaliseerde bronpaden. Trucs met bovenliggende symlinks en canonieke home-aliassen falen nog steeds gesloten als ze oplossen naar geblokkeerde roots zoals `/etc`, `/var/run` of credentialmappen onder de OS-thuismap.

<Warning>
`tools.elevated` is het globale basisontsnappingsluik dat exec buiten de sandbox draait. De effectieve host is standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`. Houd `tools.elevated.allowFrom` strikt en schakel dit niet in voor vreemden. Je kunt verhoogde rechten per agent verder beperken via `agents.list[].tools.elevated`. Zie [Verhoogde modus](/nl/tools/elevated).
</Warning>

### Vangrail voor delegatie aan sub-agents

Als je sessietools toestaat, behandel gedelegeerde sub-agentuitvoeringen dan als een extra grensbeslissing:

- Weiger `sessions_spawn` tenzij de agent delegatie echt nodig heeft.
- Houd `agents.defaults.subagents.allowAgents` en eventuele per-agentoverschrijvingen van `agents.list[].subagents.allowAgents` beperkt tot bekende veilige doelagents.
- Voor elke workflow die gesandboxed moet blijven, roep je `sessions_spawn` aan met `sandbox: "require"` (standaard is `inherit`).
- `sandbox: "require"` faalt snel wanneer de doel-childruntime niet gesandboxed is.

## Risico’s van browserbesturing

Browserbesturing inschakelen geeft het model de mogelijkheid om een echte browser aan te sturen.
Als dat browserprofiel al ingelogde sessies bevat, kan het model
toegang krijgen tot die accounts en gegevens. Behandel browserprofielen als **gevoelige staat**:

- Geef de voorkeur aan een speciaal profiel voor de agent (het standaardprofiel `openclaw`).
- Vermijd dat je de agent naar je persoonlijke dagelijkse profiel wijst.
- Houd hostbrowserbesturing uitgeschakeld voor gesandboxte agents, tenzij je ze vertrouwt.
- De standalone local loopback-API voor browserbesturing respecteert alleen shared-secret-authenticatie
  (Gateway-tokenbearerauthenticatie of Gateway-wachtwoord). Deze gebruikt geen
  trusted-proxy- of Tailscale Serve-identiteitsheaders.
- Behandel browserdownloads als niet-vertrouwde invoer; geef de voorkeur aan een geïsoleerde downloadmap.
- Schakel browsersynchronisatie/wachtwoordbeheerders indien mogelijk uit in het agentprofiel (verkleint de impact).
- Ga er voor externe gateways van uit dat “browserbesturing” gelijkstaat aan “operatortoegang” tot alles wat dat profiel kan bereiken.
- Houd de Gateway- en Node-hosts alleen beschikbaar via tailnet; vermijd blootstelling van browserbesturingspoorten aan LAN of het openbare internet.
- Schakel browserproxyrouting uit wanneer je die niet nodig hebt (`gateway.nodes.browser.mode="off"`).
- Chrome MCP-modus met bestaande sessie is **niet** “veiliger”; die kan handelen als jij in alles wat dat Chrome-hostprofiel kan bereiken.

### Browser-SSRF-beleid (standaard strikt)

Het browsernavigatiebeleid van OpenClaw is standaard strikt: privé/interne bestemmingen blijven geblokkeerd tenzij je je expliciet aanmeldt.

- Standaard: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is niet ingesteld, dus browsernavigatie houdt privé/interne/speciaal-gebruikbestemmingen geblokkeerd.
- Legacy-alias: `browser.ssrfPolicy.allowPrivateNetwork` wordt nog steeds geaccepteerd voor compatibiliteit.
- Opt-inmodus: stel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in om privé/interne/speciaal-gebruikbestemmingen toe te staan.
- Gebruik in strikte modus `hostnameAllowlist` (patronen zoals `*.example.com`) en `allowedHostnames` (exacte hostuitzonderingen, inclusief geblokkeerde namen zoals `localhost`) voor expliciete uitzonderingen.
- Navigatie wordt vóór het verzoek gecontroleerd en, naar beste vermogen, opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL na navigatie om op redirects gebaseerde pivots te verminderen.

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

Met multi-agentroutering kan elke agent zijn eigen sandbox- en toolbeleid hebben:
gebruik dit om per agent **volledige toegang**, **alleen-lezen** of **geen toegang** te geven.
Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor volledige details
en prioriteitsregels.

Veelvoorkomende gebruikssituaties:

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

### Voorbeeld: alleen-lezertools + alleen-lezenworkspace

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

### Voorbeeld: geen bestandssysteem-/shelltoegang (providerberichten toegestaan)

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

Als je AI iets slechts doet:

### Indammen

1. **Stop deze:** stop de macOS-app (als die de Gateway superviseert) of beëindig je `openclaw gateway`-proces.
2. **Sluit blootstelling:** stel `gateway.bind: "loopback"` in (of schakel Tailscale Funnel/Serve uit) totdat je begrijpt wat er is gebeurd.
3. **Bevries toegang:** zet risicovolle DM’s/groepen op `dmPolicy: "disabled"` / vereis vermeldingen, en verwijder `"*"`-items die alles toestaan als je die had.

### Roteren (ga uit van compromittering als geheimen zijn gelekt)

1. Roteer Gateway-authenticatie (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) en herstart.
2. Roteer externe clientgeheimen (`gateway.remote.token` / `.password`) op elke machine die de Gateway kan aanroepen.
3. Roteer provider-/API-credentials (WhatsApp-credentials, Slack-/Discord-tokens, model-/API-sleutels in `auth-profiles.json` en versleutelde waarden in secret payloads wanneer gebruikt).

### Auditen

1. Controleer Gateway-logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (of `logging.file`).
2. Bekijk de relevante transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Bekijk recente configuratiewijzigingen (alles wat toegang had kunnen verbreden: `gateway.bind`, `gateway.auth`, DM-/groepsbeleid, `tools.elevated`, Plugin-wijzigingen).
4. Voer `openclaw security audit --deep` opnieuw uit en bevestig dat kritieke bevindingen zijn opgelost.

### Verzamelen voor een rapport

- Tijdstempel, host-OS van de gateway + OpenClaw-versie
- De sessietranscript(s) + een korte logstaart (na redactie)
- Wat de aanvaller stuurde + wat de agent deed
- Of de Gateway buiten loopback was blootgesteld (LAN/Tailscale Funnel/Serve)

## Geheimenscanning

CI draait de pre-commit-hook `detect-private-key` over de repository. Als deze
faalt, verwijder of roteer dan het gecommitte keymateriaal en reproduceer lokaal:

```bash
pre-commit run --all-files detect-private-key
```

## Beveiligingsproblemen melden

Kwetsbaarheid gevonden in OpenClaw? Meld deze verantwoord:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Plaats niets openbaar totdat het is opgelost
3. We geven je erkenning (tenzij je anonimiteit verkiest)
