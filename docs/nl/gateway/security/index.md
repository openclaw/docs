---
read_when:
    - Functies toevoegen die toegang of automatisering uitbreiden
summary: Beveiligingsoverwegingen en dreigingsmodel voor het uitvoeren van een AI-Gateway met shelltoegang
title: Beveiliging
x-i18n:
    generated_at: "2026-06-27T17:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d4312e55f369e627a6549e7f11f2c7047f8a8f857ca6d31c5bd1b8c743a6df9
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Vertrouwensmodel voor persoonlijke assistenten.** Deze richtlijn gaat uit van één vertrouwde
  operatorgrens per gateway (single-user, persoonlijk-assistentmodel).
  OpenClaw is **geen** vijandige multi-tenant beveiligingsgrens voor meerdere
  adversariële gebruikers die één agent of gateway delen. Als je gemengd vertrouwen of
  adversariële-gebruikerswerking nodig hebt, splits dan de vertrouwensgrenzen (aparte gateway +
  credentials, idealiter aparte OS-gebruikers of hosts).
</Warning>

## Eerst de scope: beveiligingsmodel voor persoonlijke assistenten

OpenClaw-beveiligingsrichtlijnen gaan uit van een **persoonlijke assistent**-implementatie: één vertrouwde operatorgrens, mogelijk met veel agents.

- Ondersteunde beveiligingshouding: één gebruiker/vertrouwensgrens per gateway (bij voorkeur één OS-gebruiker/host/VPS per grens).
- Geen ondersteunde beveiligingsgrens: één gedeelde gateway/agent die wordt gebruikt door wederzijds onvertrouwde of adversariële gebruikers.
- Als isolatie van adversariële gebruikers vereist is, splits dan per vertrouwensgrens (aparte gateway + credentials, en idealiter aparte OS-gebruikers/hosts).
- Als meerdere onvertrouwde gebruikers één agent met tools kunnen berichten, behandel hen dan alsof ze dezelfde gedelegeerde toolbevoegdheid voor die agent delen.

Deze pagina legt hardening **binnen dat model** uit. Ze claimt geen vijandige multi-tenant isolatie op één gedeelde gateway.

Voordat je externe toegang, DM-beleid, reverse proxy of publieke blootstelling wijzigt,
gebruik je het [Gateway-blootstellingsrunbook](/nl/gateway/security/exposure-runbook) als
pre-flight- en rollbackchecklist.

## Snelle controle: `openclaw security audit`

Zie ook: [Formele verificatie (beveiligingsmodellen)](/nl/security/formal-verification)

Voer dit regelmatig uit (vooral na configuratiewijzigingen of het blootstellen van netwerkoppervlakken):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` blijft bewust beperkt: het zet algemeen open groepsbeleid
om naar allowlists, herstelt `logging.redactSensitive: "tools"`, scherpt
machtigingen voor state/config/include-bestanden aan, en gebruikt Windows ACL-resets in plaats van
POSIX `chmod` wanneer het op Windows draait.

Het markeert veelvoorkomende valkuilen (Gateway-auth-blootstelling, blootstelling van browserbesturing, verhoogde allowlists, bestandssysteemmachtigingen, permissieve exec-goedkeuringen en toolblootstelling via open kanalen).

OpenClaw is zowel een product als een experiment: je koppelt frontier-modelgedrag aan echte berichtoppervlakken en echte tools. **Er bestaat geen "perfect beveiligde" setup.** Het doel is om bewust om te gaan met:

- wie met je bot kan praten
- waar de bot mag handelen
- wat de bot mag aanraken

Begin met de kleinste toegang die nog werkt, en breid die vervolgens uit naarmate je vertrouwen groeit.

### Gepubliceerde package dependency lock

OpenClaw-broncheckouts gebruiken `pnpm-lock.yaml`. Het gepubliceerde `openclaw` npm
package en OpenClaw-owned npm plugin packages bevatten `npm-shrinkwrap.json`,
npm's publiceerbare dependency lockfile, zodat package-installaties de beoordeelde
transitieve dependency-grafiek uit de release gebruiken in plaats van tijdens
installatie een nieuwe grafiek op te lossen.

Shrinkwrap is een grens voor supply-chain-hardening en release-reproduceerbaarheid,
geen sandbox. Voor het model in gewone taal, maintainercommando's en package-
inspectiecontroles, zie [npm shrinkwrap](/nl/gateway/security/shrinkwrap).

### Deployment- en hostvertrouwen

OpenClaw gaat ervan uit dat de host- en configuratiegrens vertrouwd zijn:

- Als iemand Gateway-hoststatus/configuratie (`~/.openclaw`, inclusief `openclaw.json`) kan wijzigen, behandel die persoon dan als een vertrouwde operator.
- Eén Gateway draaien voor meerdere wederzijds onvertrouwde/adversariële operators is **geen aanbevolen setup**.
- Voor teams met gemengd vertrouwen splits je vertrouwensgrenzen met aparte gateways (of minimaal aparte OS-gebruikers/hosts).
- Aanbevolen standaard: één gebruiker per machine/host (of VPS), één gateway voor die gebruiker, en één of meer agents in die gateway.
- Binnen één Gateway-instantie is geauthenticeerde operatortoegang een vertrouwde control-plane-rol, geen tenantrol per gebruiker.
- Sessie-identifiers (`sessionKey`, sessie-ID's, labels) zijn routeringsselectoren, geen autorisatietokens.
- Als meerdere mensen één agent met tools kunnen berichten, kan ieder van hen dezelfde machtigingenset sturen. Sessie-/geheugenisolatie per gebruiker helpt bij privacy, maar verandert een gedeelde agent niet in hostautorisatie per gebruiker.

### Beveiligde bestandsbewerkingen

OpenClaw gebruikt `@openclaw/fs-safe` voor root-gebonden bestandstoegang, atomische schrijfacties, archiefextractie, tijdelijke werkruimten en helpers voor geheime bestanden. OpenClaw zet fs-safe's optionele POSIX Python-helper standaard **uit**; stel `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` of `require` alleen in wanneer je de extra fd-relatieve mutatiehardening wilt en een Python-runtime kunt ondersteunen.

Details: [Beveiligde bestandsbewerkingen](/nl/gateway/security/secure-file-operations).

### Gedeelde Slack-werkruimte: reëel risico

Als "iedereen in Slack de bot kan berichten", is het kernrisico gedelegeerde toolbevoegdheid:

- elke toegestane afzender kan toolcalls (`exec`, browser, netwerk-/bestandstools) uitlokken binnen het beleid van de agent;
- prompt-/contentinjectie van één afzender kan acties veroorzaken die gedeelde status, apparaten of output beïnvloeden;
- als één gedeelde agent gevoelige credentials/bestanden heeft, kan elke toegestane afzender mogelijk exfiltratie via toolgebruik aansturen.

Gebruik aparte agents/gateways met minimale tools voor teamworkflows; houd agents met persoonlijke data privé.

### Door het bedrijf gedeelde agent: acceptabel patroon

Dit is acceptabel wanneer iedereen die die agent gebruikt binnen dezelfde vertrouwensgrens valt (bijvoorbeeld één bedrijfsteam) en de agent strikt zakelijk is afgebakend.

- draai deze op een dedicated machine/VM/container;
- gebruik een dedicated OS-gebruiker + dedicated browser/profiel/accounts voor die runtime;
- meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke password-manager-/browserprofielen.

Als je persoonlijke en bedrijfsidentiteiten op dezelfde runtime mixt, hef je de scheiding op en vergroot je het risico op blootstelling van persoonlijke data.

## Gateway- en node-vertrouwensconcept

Behandel Gateway en node als één operatorvertrouwensdomein, met verschillende rollen:

- **Gateway** is de control plane en het beleidsoppervlak (`gateway.auth`, toolbeleid, routering).
- **Node** is het externe uitvoeringsoppervlak dat aan die Gateway is gekoppeld (commando's, apparaatacties, host-lokale capabilities).
- Een caller die bij de Gateway is geauthenticeerd, wordt vertrouwd binnen Gateway-scope. Na pairing zijn node-acties vertrouwde operatoracties op die node.
- Operator-scope-niveaus en controles tijdens goedkeuring worden samengevat in
  [Operator-scopes](/nl/gateway/operator-scopes).
- Directe local loopback-backendclients die zijn geauthenticeerd met het gedeelde gateway
  token/wachtwoord kunnen interne control-plane-RPC's uitvoeren zonder een gebruikers-
  apparaatidentiteit te presenteren. Dit is geen omzeiling van externe of browser-pairing: netwerk-
  clients, node-clients, device-token-clients en expliciete apparaatidentiteiten
  gaan nog steeds door pairing- en scope-upgradehandhaving.
- `sessionKey` is routerings-/contextselectie, geen auth per gebruiker.
- Exec-goedkeuringen (allowlist + vragen) zijn vangrails voor operatorintentie, geen vijandige multi-tenant isolatie.
- OpenClaw's productstandaard voor vertrouwde single-operator-setups is dat host-exec op `gateway`/`node` zonder goedkeuringsprompts is toegestaan (`security="full"`, `ask="off"` tenzij je dit aanscherpt). Die standaard is opzettelijke UX, geen kwetsbaarheid op zichzelf.
- Exec-goedkeuringen binden de exacte aanvraagcontext en best-effort directe lokale bestandsoperanden; ze modelleren niet semantisch elk runtime-/interpreter-loaderpad. Gebruik sandboxing en hostisolatie voor sterke grenzen.

Als je isolatie voor vijandige gebruikers nodig hebt, splits vertrouwensgrenzen dan per OS-gebruiker/host en draai aparte gateways.

## Matrix voor vertrouwensgrenzen

Gebruik dit als snel model bij risicotriage:

| Grens of controle                                         | Wat het betekent                                  | Veelvoorkomende misvatting                                                     |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Authenticeert callers bij gateway-API's           | "Heeft per-message signatures op elk frame nodig om veilig te zijn"           |
| `sessionKey`                                              | Routeringssleutel voor context-/sessieselectie    | "Session key is een gebruikersauth-grens"                                      |
| Prompt-/contentvangrails                                  | Verminderen risico op modelmisbruik               | "Promptinjectie alleen bewijst auth-omzeiling"                                |
| `canvas.eval` / browser evaluate                          | Opzettelijke operatorcapability wanneer ingeschakeld | "Elke JS eval-primitive is automatisch een kwetsbaarheid in dit vertrouwensmodel" |
| Lokale TUI `!` shell                                      | Expliciet door operator getriggerde lokale uitvoering | "Lokaal shell-gemakscommando is externe injectie"                              |
| Node-pairing en node-commando's                           | Remote uitvoering op operatorniveau op gekoppelde apparaten | "Remote apparaatbesturing moet standaard als onvertrouwde gebruikerstoegang worden behandeld" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in inschrijvingsbeleid voor nodes op vertrouwd netwerk | "Een standaard uitgeschakelde allowlist is een automatische pairingkwetsbaarheid" |

## Geen kwetsbaarheden volgens ontwerp

<Accordion title="Veelvoorkomende bevindingen die buiten scope vallen">

Deze patronen worden vaak gerapporteerd en meestal zonder actie gesloten, tenzij
een echte grensomzeiling wordt aangetoond:

- Alleen promptinjectie-ketens zonder beleids-, auth- of sandboxomzeiling.
- Claims die uitgaan van vijandige multi-tenant werking op één gedeelde host of
  configuratie.
- Claims die normale operatorleestoegang (bijvoorbeeld
  `sessions.list` / `sessions.preview` / `chat.history`) classificeren als IDOR in een
  gedeelde-gateway-setup.
- Bevindingen voor localhost-only deployments (bijvoorbeeld HSTS op een loopback-only
  gateway).
- Bevindingen over Discord inbound webhook signatures voor inbound paden die niet
  in deze repo bestaan.
- Rapporten die node-pairingmetadata behandelen als een verborgen tweede per-command
  goedkeuringslaag voor `system.run`, terwijl de echte uitvoeringsgrens nog steeds
  het globale node-commandobeleid van de gateway plus de eigen exec-
  goedkeuringen van de node is.
- Rapporten die geconfigureerde `gateway.nodes.pairing.autoApproveCidrs` op zichzelf als een
  kwetsbaarheid behandelen. Deze instelling is standaard uitgeschakeld, vereist
  expliciete CIDR/IP-vermeldingen, geldt alleen voor eerste `role: node`-pairing met
  geen aangevraagde scopes, en keurt operator/browser/Control UI,
  WebChat, rolupgrades, scope-upgrades, metadatawijzigingen, wijzigingen van publieke sleutels
  of same-host loopback trusted-proxy-headerpaden niet automatisch goed, tenzij loopback trusted-proxy auth expliciet was ingeschakeld.
- Bevindingen over "ontbrekende autorisatie per gebruiker" die `sessionKey` als een
  auth-token behandelen.

</Accordion>

## Verharde baseline in 60 seconden

Gebruik eerst deze baseline, en schakel daarna selectief tools opnieuw in per vertrouwde agent:

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

Dit houdt de Gateway alleen lokaal, isoleert DM's en schakelt control-plane-/runtime-tools standaard uit.

## Snelle regel voor gedeelde inbox

Als meer dan één persoon je bot kan DM'en:

- Stel `session.dmScope: "per-channel-peer"` in (of `"per-account-channel-peer"` voor kanalen met meerdere accounts).
- Houd `dmPolicy: "pairing"` of strikte allowlists aan.
- Combineer gedeelde DM's nooit met brede tooltoegang.
- Dit versterkt coöperatieve/gedeelde inboxen, maar is niet ontworpen als isolatie tegen vijandige medehuurders wanneer gebruikers schrijfrechten voor host/config delen.

## Contextzichtbaarheidsmodel

OpenClaw scheidt twee concepten:

- **Triggerautorisatie**: wie de agent kan triggeren (`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- **Contextzichtbaarheid**: welke aanvullende context in de modelinvoer wordt geïnjecteerd (antwoordtekst, geciteerde tekst, threadgeschiedenis, doorgestuurde metadata).

Allowlists regelen triggers en commandoautorisatie. De instelling `contextVisibility` bepaalt hoe aanvullende context (geciteerde antwoorden, thread-roots, opgehaalde geschiedenis) wordt gefilterd:

- `contextVisibility: "all"` (standaard) behoudt aanvullende context zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die door de actieve allowlist-controles zijn toegestaan.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Stel `contextVisibility` per kanaal of per ruimte/gesprek in. Zie [Groepschats](/nl/channels/groups#context-visibility-and-allowlists) voor configuratiedetails.

Adviserende triagerichtlijnen:

- Claims die alleen aantonen dat "het model geciteerde of historische tekst van afzenders buiten de allowlist kan zien" zijn hardening-bevindingen die met `contextVisibility` kunnen worden aangepakt, niet op zichzelf omzeilingen van auth- of sandboxgrenzen.
- Om beveiligingsimpact te hebben, moeten meldingen nog steeds een aangetoonde omzeiling van een vertrouwensgrens bevatten (auth, beleid, sandbox, goedkeuring of een andere gedocumenteerde grens).

## Wat de audit controleert (hoog niveau)

- **Inkomende toegang** (DM-beleid, groepsbeleid, allowlists): kunnen onbekenden de bot triggeren?
- **Tool blast radius** (verhoogde tools + open ruimtes): kan promptinjectie uitmonden in shell-/bestand-/netwerkacties?
- **Exec-bestandssysteemdrift**: worden muterende bestandssysteemtools geweigerd terwijl `exec`/`process` beschikbaar blijven zonder sandbox-beperkingen voor het bestandssysteem?
- **Exec-goedkeuringsdrift** (`security=full`, `autoAllowSkills`, interpreter-allowlists zonder `strictInlineEval`): doen host-exec-guardrails nog steeds wat u denkt dat ze doen?
  - `security="full"` is een brede posture-waarschuwing, geen bewijs van een bug. Het is de gekozen standaard voor vertrouwde persoonlijke-assistentconfiguraties; verscherp dit alleen wanneer uw dreigingsmodel goedkeuring of allowlist-guardrails vereist.
- **Netwerkblootstelling** (Gateway-bind/auth, Tailscale Serve/Funnel, zwakke/korte auth-tokens).
- **Blootstelling van browserbesturing** (externe nodes, relay-poorten, externe CDP-eindpunten).
- **Lokale schijfhygiëne** (rechten, symlinks, config-includes, paden voor "gesynchroniseerde map").
- **Plugins** (plugins laden zonder expliciete allowlist).
- **Beleidsdrift/misconfiguratie** (sandbox docker-instellingen geconfigureerd maar sandboxmodus uit; ineffectieve `gateway.nodes.denyCommands`-patronen omdat matching alleen op exacte commandonaam gebeurt (bijvoorbeeld `system.run`) en shelltekst niet inspecteert; gevaarlijke `gateway.nodes.allowCommands`-items; globale `tools.profile="minimal"` overschreven door profielen per agent; plugin-eigen tools bereikbaar onder permissief toolbeleid).
- **Drift in runtimeverwachtingen** (bijvoorbeeld aannemen dat impliciete exec nog steeds `sandbox` betekent wanneer `tools.exec.host` nu standaard `auto` is, of expliciet `tools.exec.host="sandbox"` instellen terwijl sandboxmodus uit staat).
- **Modelhygiëne** (waarschuw wanneer geconfigureerde modellen legacy lijken; geen harde blokkade).

Als u `--deep` uitvoert, probeert OpenClaw ook een best-effort live Gateway-probe.

## Opslagkaart voor referenties

Gebruik dit bij het auditen van toegang of het bepalen wat u moet back-uppen:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env/file/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Koppelings-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-auth-profielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex-runtime 상태**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Bestandsgebaseerde secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`

## Checklist voor beveiligingsaudit

Wanneer de audit bevindingen afdrukt, behandel dit als prioriteitsvolgorde:

1. **Alles wat "open" is + tools ingeschakeld**: vergrendel eerst DM's/groepen (pairing/allowlists), verscherp daarna toolbeleid/sandboxing.
2. **Publieke netwerkblootstelling** (LAN-bind, Funnel, ontbrekende auth): direct oplossen.
3. **Externe blootstelling van browserbesturing**: behandel dit als operatortoegang (alleen tailnet, koppel nodes bewust, vermijd publieke blootstelling).
4. **Rechten**: zorg dat state/config/referenties/auth niet leesbaar zijn voor groep/wereld.
5. **Plugins**: laad alleen wat u expliciet vertrouwt.
6. **Modelkeuze**: geef de voorkeur aan moderne, instructiegeharde modellen voor elke bot met tools.

## Woordenlijst voor beveiligingsaudit

Elke auditbevinding is gekoppeld aan een gestructureerde `checkId` (bijvoorbeeld
`gateway.bind_no_auth` of `tools.exec.security_full_configured`). Veelvoorkomende
kritieke ernstklassen:

- `fs.*` - bestandssysteemrechten op state, config, referenties, auth-profielen.
- `gateway.*` - bindmodus, auth, Tailscale, Control UI, trusted-proxy-configuratie.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening per oppervlak.
- `plugins.*`, `skills.*` - bevindingen over plugin-/skill-supplychain en scans.
- `security.exposure.*` - doorsnijdende controles waar toegangsbeleid de tool blast radius raakt.

Zie de volledige catalogus met ernstniveaus, fix-keys en auto-fix-ondersteuning op
[Controles voor beveiligingsaudit](/nl/gateway/security/audit-checks).

## Control UI via HTTP

De Control UI heeft een **veilige context** (HTTPS of localhost) nodig om apparaatidentiteit
te genereren. `gateway.controlUi.allowInsecureAuth` is een lokale compatibiliteitsschakelaar:

- Op localhost staat deze Control UI-auth zonder apparaatidentiteit toe wanneer de pagina
  via niet-veilige HTTP wordt geladen.
- Deze omzeilt geen koppelingscontroles.
- Deze versoepelt geen vereisten voor apparaatidentiteit op afstand (niet-localhost).

Geef de voorkeur aan HTTPS (Tailscale Serve) of open de UI op `127.0.0.1`.

Alleen voor break-glass-scenario's schakelt `gateway.controlUi.dangerouslyDisableDeviceAuth`
apparaatidentiteitscontroles volledig uit. Dit is een ernstige beveiligingsverlaging;
laat dit uit tenzij u actief debugt en snel kunt terugdraaien.

Los van die gevaarlijke flags kunnen succesvolle `gateway.auth.mode: "trusted-proxy"`
**operator** Control UI-sessies toelaten zonder apparaatidentiteit. Dat is
bedoeld auth-mode-gedrag, geen `allowInsecureAuth`-shortcut, en het breidt zich nog steeds
niet uit naar Control UI-sessies met node-rol.

`openclaw security audit` waarschuwt wanneer deze instelling is ingeschakeld.

## Samenvatting van onveilige of gevaarlijke flags

`openclaw security audit` meldt `config.insecure_or_dangerous_flags` wanneer
bekende onveilige/gevaarlijke debugschakelaars zijn ingeschakeld. Laat deze in
productie uitgeschakeld. Elke ingeschakelde flag wordt als eigen bevinding gerapporteerd. Als audit
suppressions zijn geconfigureerd, blijft `security.audit.suppressions.active` in de
actieve audituitvoer staan, zelfs wanneer overeenkomende bevindingen naar `suppressedFindings` verplaatsen.

<AccordionGroup>
  <Accordion title="Flags die vandaag door de audit worden bijgehouden">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Alle `dangerous*`- / `dangerously*`-keys in het config-schema">
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

    Sandbox Docker (standaarden + per agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Reverse-proxyconfiguratie

Als u de Gateway achter een reverse proxy draait (nginx, Caddy, Traefik, enz.), configureer
`gateway.trustedProxies` voor correcte afhandeling van doorgestuurde client-IP's.

Wanneer de Gateway proxyheaders detecteert vanaf een adres dat **niet** in `trustedProxies` staat, behandelt deze verbindingen **niet** als lokale clients. Als gateway-auth is uitgeschakeld, worden die verbindingen geweigerd. Dit voorkomt authenticatie-omzeiling waarbij proxied verbindingen anders van localhost afkomstig zouden lijken en automatisch vertrouwen zouden krijgen.

`gateway.trustedProxies` voedt ook `gateway.auth.mode: "trusted-proxy"`, maar die auth-modus is strikter:

- trusted-proxy-auth **faalt standaard gesloten bij loopback-bronproxy's**
- same-host loopback reverse proxy's kunnen `gateway.trustedProxies` gebruiken voor lokale-clientdetectie en afhandeling van doorgestuurde IP's
- same-host loopback reverse proxy's kunnen alleen aan `gateway.auth.mode: "trusted-proxy"` voldoen wanneer `gateway.auth.trustedProxy.allowLoopback = true`; gebruik anders token-/wachtwoordauth

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

Trusted-proxyheaders maken node-apparaatkoppeling niet automatisch vertrouwd.
`gateway.nodes.pairing.autoApproveCidrs` is een afzonderlijk, standaard uitgeschakeld
operatorbeleid. Zelfs wanneer dit is ingeschakeld, worden loopback-bron trusted-proxyheaderpaden
uitgesloten van node-auto-approval omdat lokale callers die
headers kunnen vervalsen, ook wanneer loopback trusted-proxy-auth expliciet is ingeschakeld.

Goed reverse-proxygedrag (inkomende forwarding-headers overschrijven):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Slecht reverse-proxygedrag (onvertrouwde forwarding-headers toevoegen/behouden):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS- en origin-opmerkingen

- OpenClaw Gateway is eerst lokaal/local loopback. Als je TLS bij een reverse proxy beëindigt, stel HSTS daar in op het proxygerichte HTTPS-domein.
- Als de Gateway zelf HTTPS beëindigt, kun je `gateway.http.securityHeaders.strictTransportSecurity` instellen om de HSTS-header vanuit OpenClaw-responses uit te sturen.
- Gedetailleerde implementatierichtlijnen staan in [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Voor niet-loopback Control UI-implementaties is `gateway.controlUi.allowedOrigins` standaard vereist.
- `gateway.controlUi.allowedOrigins: ["*"]` is een expliciet browser-originbeleid dat alles toestaat, geen geharde standaard. Vermijd dit buiten strikt gecontroleerde lokale tests.
- Browser-origin-authenticatiefouten op loopback blijven rate-limited, zelfs wanneer de
  algemene loopback-vrijstelling is ingeschakeld, maar de lockout-sleutel is per
  genormaliseerde `Origin`-waarde afgebakend in plaats van één gedeelde localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de Host-header-originfallbackmodus in; behandel dit als een gevaarlijk, door de operator gekozen beleid.
- Behandel DNS-rebinding en proxy-hostheadergedrag als aandachtspunten voor deploymenthardening; houd `trustedProxies` strikt en vermijd directe blootstelling van de Gateway aan het openbare internet.

## Lokale sessielogboeken staan op schijf

OpenClaw slaat sessietranscripten op schijf op onder `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Dit is vereist voor sessiecontinuïteit en (optioneel) indexering van sessiegeheugen, maar het betekent ook dat
**elk proces/elke gebruiker met bestandssysteemtoegang die logboeken kan lezen**. Behandel schijftoegang als de vertrouwensgrens
en vergrendel de machtigingen op `~/.openclaw` (zie de auditsectie hieronder). Als je
sterkere isolatie tussen agents nodig hebt, voer ze dan uit onder afzonderlijke OS-gebruikers of afzonderlijke hosts.

## Node-uitvoering (system.run)

Als een macOS-node is gekoppeld, kan de Gateway `system.run` op die node aanroepen. Dit is **uitvoering van externe code** op de Mac:

- Vereist node-koppeling (goedkeuring + token).
- Gateway-nodekoppeling is geen goedkeuringsvlak per commando. Het stelt node-identiteit/vertrouwen en tokenuitgifte vast.
- De Gateway past een grof globaal nodecommandobeleid toe via `gateway.nodes.allowCommands` / `denyCommands`.
- Beheerd op de Mac via **Settings → Exec approvals** (security + ask + allowlist).
- Het per-nodebeleid voor `system.run` is het eigen uitvoeringsgoedkeuringsbestand van de node (`exec.approvals.node.*`), dat strikter of losser kan zijn dan het globale command-ID-beleid van de Gateway.
- Een node die draait met `security="full"` en `ask="off"` volgt het standaardmodel voor vertrouwde operators. Behandel dat als verwacht gedrag, tenzij je deployment expliciet een striktere goedkeurings- of allowlist-houding vereist.
- De goedkeuringsmodus bindt de exacte requestcontext en, waar mogelijk, één concreet lokaal script-/bestandsoperand. Als OpenClaw niet precies één direct lokaal bestand kan identificeren voor een interpreter-/runtimecommando, wordt uitvoering met goedkeuring geweigerd in plaats van volledige semantische dekking te beloven.
- Voor `host=node` slaan goedgekeurde runs ook een canoniek voorbereid
  `systemRunPlan` op; latere goedgekeurde doorsturingen hergebruiken dat opgeslagen plan, en Gateway-
  validatie weigert bewerkingen door de aanroeper aan command/cwd/session-context nadat het
  goedkeuringsverzoek is aangemaakt.
- Als je geen externe uitvoering wilt, zet security op **deny** en verwijder node-koppeling voor die Mac.

Dit onderscheid is belangrijk voor triage:

- Een opnieuw verbindende gekoppelde node die een andere commandolijst adverteert, is op zichzelf geen kwetsbaarheid als het globale Gateway-beleid en de lokale uitvoeringsgoedkeuringen van de node nog steeds de daadwerkelijke uitvoeringsgrens afdwingen.
- Meldingen die nodekoppelingsmetadata behandelen als een tweede verborgen goedkeuringslaag per commando zijn meestal beleids-/UX-verwarring, geen omzeiling van een beveiligingsgrens.

## Dynamische Skills (watcher / externe nodes)

OpenClaw kan de skills-lijst midden in een sessie vernieuwen:

- **Skills-watcher**: wijzigingen in `SKILL.md` kunnen de skills-snapshot bij de volgende agentbeurt bijwerken.
- **Externe nodes**: het verbinden van een macOS-node kan macOS-only skills geschikt maken (op basis van bin-probing).

Behandel skillmappen als **vertrouwde code** en beperk wie ze kan wijzigen.

## Het dreigingsmodel

Je AI-assistent kan:

- Willekeurige shellcommando's uitvoeren
- Bestanden lezen/schrijven
- Toegang krijgen tot netwerkservices
- Berichten naar iedereen sturen (als je hem WhatsApp-toegang geeft)

Mensen die je berichten sturen kunnen:

- Proberen je AI te misleiden om slechte dingen te doen
- Toegang tot je gegevens sociaal manipuleren
- Infrastructuurdetails aftasten

## Kernconcept: toegangscontrole vóór intelligentie

De meeste fouten hier zijn geen geavanceerde exploits - het zijn gevallen van "iemand stuurde de bot een bericht en de bot deed wat er werd gevraagd."

De houding van OpenClaw:

- **Identiteit eerst:** bepaal wie met de bot mag praten (DM-koppeling / allowlists / expliciet "open").
- **Daarna bereik:** bepaal waar de bot mag handelen (groepsallowlists + mention-gating, tools, sandboxing, apparaatmachtigingen).
- **Model als laatste:** ga ervan uit dat het model kan worden gemanipuleerd; ontwerp zo dat manipulatie een beperkte blast radius heeft.

## Commandautorisatiemodel

Slash-commando's en directives worden alleen gehonoreerd voor **geautoriseerde afzenders**. Autorisatie wordt afgeleid van
kanaalallowlists/koppeling plus `commands.useAccessGroups` (zie [Configuratie](/nl/gateway/configuration)
en [Slash-commando's](/nl/tools/slash-commands)). Als een kanaalallowlist leeg is of `"*"` bevat,
staan commando's effectief open voor dat kanaal.

`/exec` is een sessiegebonden gemak voor geautoriseerde operators. Het schrijft **geen** configuratie en
wijzigt geen andere sessies.

## Risico van control-plane-tools

Twee ingebouwde tools kunnen blijvende control-plane-wijzigingen aanbrengen:

- `gateway` kan config inspecteren met `config.schema.lookup` / `config.get`, en kan blijvende wijzigingen aanbrengen met `config.apply`, `config.patch` en `update.run`.
- `cron` kan geplande jobs maken die blijven draaien nadat de oorspronkelijke chat/taak eindigt.

De agentgerichte runtime-tool `gateway` weigert nog steeds
`tools.exec.ask` of `tools.exec.security` te herschrijven; legacy `tools.bash.*`-aliassen worden
genormaliseerd naar dezelfde beschermde uitvoeringspaden voordat er wordt geschreven.
Door agents gedreven bewerkingen met `gateway config.apply` en `gateway config.patch` zijn
standaard fail-closed: alleen een smalle set laag-risico runtime-tuning,
mention-gating en zichtbare-antwoordpaden is door agents instelbaar. Globale modelstandaarden
en prompt-overlays blijven onder controle van de operator. Nieuwe gevoelige configbomen zijn
daarom beschermd, tenzij ze bewust aan de allowlist worden toegevoegd.

Voor elke agent/elk oppervlak dat niet-vertrouwde inhoud verwerkt, weiger deze standaard:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokkeert alleen herstartacties. Het schakelt `gateway`-config-/updateacties niet uit.

## Plugins

Plugins draaien **in-process** met de Gateway. Behandel ze als vertrouwde code:

- Installeer alleen plugins uit bronnen die je vertrouwt.
- Geef de voorkeur aan expliciete `plugins.allow`-allowlists.
- Controleer pluginconfiguratie voordat je die inschakelt.
- Herstart de Gateway na pluginwijzigingen.
- Als je plugins installeert of bijwerkt (`openclaw plugins install <package>`, `openclaw plugins update <id>`), behandel dit alsof je niet-vertrouwde code uitvoert:
  - Het installatiepad is de per-pluginmap onder de actieve plugininstallatieroot.
  - OpenClaw voert tijdens installatie/bijwerken geen ingebouwde lokale blokkering van gevaarlijke code uit. Gebruik `security.installPolicy` voor door operators beheerde lokale allow/block-beslissingen en `openclaw security audit --deep` voor diagnostische scanning.
  - npm- en git-plugininstallaties voeren alleen tijdens de expliciete installatie-/bijwerkflow package-manager-dependencyconvergentie uit. Lokale paden en archieven worden behandeld als zelfstandige pluginpakketten; OpenClaw kopieert/verwijst ernaar zonder `npm install` uit te voeren.
  - Geef de voorkeur aan vastgepinde, exacte versies (`@scope/pkg@1.2.3`) en inspecteer de uitgepakte code op schijf voordat je die inschakelt.
  - `--dangerously-force-unsafe-install` is deprecated en verandert het gedrag van plugininstallatie/-bijwerken niet meer.
  - Configureer `security.installPolicy` wanneer operators een vertrouwd lokaal commando nodig hebben om hostspecifieke allow/block-beslissingen te nemen voor skill- en plugininstallaties. Dit beleid draait nadat bronmateriaal is gestaged maar voordat de installatie doorgaat, geldt ook voor ClawHub-skills, en wordt niet omzeild door deprecated onveilige flags.

Details: [Plugins](/nl/tools/plugin)

## DM-toegangsmodel: koppeling, allowlist, open, uitgeschakeld

Alle huidige kanalen met DM-ondersteuning ondersteunen een DM-beleid (`dmPolicy` of `*.dm.policy`) dat inkomende DM's gate **voordat** het bericht wordt verwerkt:

- `pairing` (standaard): onbekende afzenders ontvangen een korte koppelingscode en de bot negeert hun bericht totdat het is goedgekeurd. Codes verlopen na 1 uur; herhaalde DM's sturen geen code opnieuw totdat er een nieuw verzoek is aangemaakt. Openstaande verzoeken zijn standaard gemaximeerd op **3 per kanaal**.
- `allowlist`: onbekende afzenders worden geblokkeerd (geen koppelingshandshake).
- `open`: sta iedereen toe om te DM'en (publiek). **Vereist** dat de kanaalallowlist `"*"` bevat (expliciete opt-in).
- `disabled`: negeer inkomende DM's volledig.

Goedkeuren via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + bestanden op schijf: [Koppeling](/nl/channels/pairing)

## DM-sessie-isolatie (multi-user-modus)

Standaard routeert OpenClaw **alle DM's naar de hoofdsessie**, zodat je assistent continuïteit heeft tussen apparaten en kanalen. Als **meerdere mensen** de bot kunnen DM'en (open DM's of een allowlist met meerdere personen), overweeg dan DM-sessies te isoleren:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Dit voorkomt contextlekkage tussen gebruikers terwijl groepschats geïsoleerd blijven.

Dit is een messaging-contextgrens, geen host-admin-grens. Als gebruikers onderling vijandig zijn en dezelfde Gateway-host/config delen, draai dan afzonderlijke gateways per vertrouwensgrens.

### Veilige DM-modus (aanbevolen)

Behandel het fragment hierboven als **veilige DM-modus**:

- Standaard: `session.dmScope: "main"` (alle DM's delen één sessie voor continuïteit).
- Standaard voor lokale CLI-onboarding: schrijft `session.dmScope: "per-channel-peer"` wanneer unset (behoudt bestaande expliciete waarden).
- Veilige DM-modus: `session.dmScope: "per-channel-peer"` (elk kanaal+afzender-paar krijgt een geïsoleerde DM-context).
- Cross-channel peer-isolatie: `session.dmScope: "per-peer"` (elke afzender krijgt één sessie over alle kanalen van hetzelfde type).

Als je meerdere accounts op hetzelfde kanaal draait, gebruik dan in plaats daarvan `per-account-channel-peer`. Als dezelfde persoon via meerdere kanalen contact met je opneemt, gebruik dan `session.identityLinks` om die DM-sessies samen te voegen tot één canonieke identiteit. Zie [Sessiebeheer](/nl/concepts/session) en [Configuratie](/nl/gateway/configuration).

## Allowlists voor DM's en groepen

OpenClaw heeft twee afzonderlijke lagen voor "wie kan mij triggeren?":

- **DM-allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): wie met de bot mag praten in directe berichten.
  - Wanneer `dmPolicy="pairing"` is, worden goedkeuringen weggeschreven naar de accountgebonden pairing-allowlistopslag onder `~/.openclaw/credentials/` (`<channel>-allowFrom.json` voor het standaardaccount, `<channel>-<accountId>-allowFrom.json` voor niet-standaardaccounts), samengevoegd met configuratie-allowlists.
- **Groeps-allowlist** (kanaalspecifiek): van welke groepen/kanalen/guilds de bot überhaupt berichten accepteert.
  - Veelvoorkomende patronen:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: standaardwaarden per groep zoals `requireMention`; wanneer ingesteld, werkt dit ook als groeps-allowlist (neem `"*"` op om allow-all-gedrag te behouden).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: beperk wie de bot _binnen_ een groepssessie kan activeren (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists per oppervlak + standaardwaarden voor vermeldingen.
  - Groepscontroles worden in deze volgorde uitgevoerd: eerst `groupPolicy`/groeps-allowlists, daarna activering via vermelding/antwoord.
  - Antwoorden op een botbericht (impliciete vermelding) omzeilt afzender-allowlists zoals `groupAllowFrom` **niet**.
  - **Beveiligingsopmerking:** behandel `dmPolicy="open"` en `groupPolicy="open"` als instellingen voor uiterste noodzaak. Ze zouden nauwelijks gebruikt moeten worden; geef de voorkeur aan pairing + allowlists, tenzij je elk lid van de ruimte volledig vertrouwt.

Details: [Configuratie](/nl/gateway/configuration) en [Groepen](/nl/channels/groups)

## Promptinjectie (wat het is, waarom het belangrijk is)

Promptinjectie is wanneer een aanvaller een bericht opstelt dat het model manipuleert om iets onveiligs te doen ("negeer je instructies", "dump je bestandssysteem", "volg deze link en voer opdrachten uit", enz.).

Zelfs met sterke systeemprompts is **promptinjectie niet opgelost**. Guardrails in systeemprompts zijn alleen zachte richtlijnen; harde handhaving komt van toolbeleid, uitvoeringsgoedkeuringen, sandboxing en kanaal-allowlists (en operators kunnen deze bewust uitschakelen). Wat in de praktijk helpt:

- Houd binnenkomende DM's afgesloten (pairing/allowlists).
- Geef in groepen de voorkeur aan activering via vermeldingen; vermijd "altijd-aan"-bots in openbare ruimtes.
- Behandel links, bijlagen en geplakte instructies standaard als vijandig.
- Voer gevoelige tooluitvoering uit in een sandbox; houd geheimen buiten het voor de agent bereikbare bestandssysteem.
- Opmerking: sandboxing is opt-in. Als sandboxmodus uit staat, wordt impliciet `host=auto` opgelost naar de gatewayhost. Expliciet `host=sandbox` faalt nog steeds gesloten omdat er geen sandboxruntime beschikbaar is. Stel `host=gateway` in als je wilt dat dit gedrag expliciet is in de configuratie.
- Beperk tools met hoog risico (`exec`, `browser`, `web_fetch`, `web_search`) tot vertrouwde agents of expliciete allowlists.
- Als je interpreters allowlist (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), schakel dan `tools.exec.strictInlineEval` in zodat inline-eval-vormen nog steeds expliciete goedkeuring nodig hebben.
- Shell-goedkeuringsanalyse wijst ook POSIX-vormen voor parameterexpansie af (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) binnen **niet-gequote heredocs**, zodat een geallowliste heredoc-body geen shellexpansie langs allowlistbeoordeling kan smokkelen als platte tekst. Quote de heredoc-terminator (bijvoorbeeld `<<'EOF'`) om te kiezen voor letterlijke bodysemantiek; niet-gequote heredocs die variabelen zouden hebben uitgebreid, worden afgewezen.
- **Modelkeuze is belangrijk:** oudere/kleinere/legacy modellen zijn aanzienlijk minder robuust tegen promptinjectie en toolmisbruik. Gebruik voor agents met tools het sterkste beschikbare model van de nieuwste generatie dat op instructies is gehard.

Rode vlaggen die je als onvertrouwd moet behandelen:

- "Lees dit bestand/deze URL en doe precies wat erin staat."
- "Negeer je systeemprompt of veiligheidsregels."
- "Onthul je verborgen instructies of tooluitvoer."
- "Plak de volledige inhoud van ~/.openclaw of je logs."

## Sanitization van speciale tokens in externe inhoud

OpenClaw verwijdert veelvoorkomende speciale-tokenliterals uit self-hosted LLM-chatsjablonen uit ingepakte externe inhoud en metadata voordat ze het model bereiken. Gedekte markerfamilies omvatten Qwen/ChatML, Llama, Gemma, Mistral, Phi en GPT-OSS rol-/beurttokens.

Waarom:

- OpenAI-compatibele backends die self-hosted modellen ontsluiten, behouden soms speciale tokens die in gebruikerstekst voorkomen, in plaats van ze te maskeren. Een aanvaller die naar binnenkomende externe inhoud kan schrijven (een opgehaalde pagina, een e-mailbody, uitvoer van een tool voor bestandsinhoud) zou anders een synthetische `assistant`- of `system`-rolgrens kunnen injecteren en ontsnappen aan de guardrails voor ingepakte inhoud.
- Sanitization gebeurt op de laag voor het inpakken van externe inhoud, zodat dit uniform geldt voor fetch-/read-tools en binnenkomende kanaalinhoud in plaats van per provider.
- Uitgaande modelantwoorden hebben al een aparte sanitizer die gelekte `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` en vergelijkbare interne runtimescaffolding verwijdert uit gebruikerszichtbare antwoorden bij de uiteindelijke kanaalafleveringsgrens. De sanitizer voor externe inhoud is de binnenkomende tegenhanger.

Dit vervangt de andere hardening op deze pagina niet - `dmPolicy`, allowlists, uitvoeringsgoedkeuringen, sandboxing en `contextVisibility` doen nog steeds het primaire werk. Het sluit één specifieke bypass op tokenizerlaag tegen self-hosted stacks die gebruikerstekst met speciale tokens intact doorsturen.

## Onveilige bypassvlaggen voor externe inhoud

OpenClaw bevat expliciete bypassvlaggen die veiligheidsinpakking van externe inhoud uitschakelen:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron-payloadveld `allowUnsafeExternalContent`

Richtlijnen:

- Laat deze in productie unset/false.
- Schakel ze alleen tijdelijk in voor strak afgebakende debugging.
- Als ingeschakeld, isoleer die agent (sandbox + minimale tools + toegewezen sessienamespace).

Risico-opmerking voor hooks:

- Hook-payloads zijn onvertrouwde inhoud, zelfs wanneer aflevering afkomstig is van systemen die je beheert (mail/docs/webinhoud kan promptinjectie bevatten).
- Zwakke modelniveaus verhogen dit risico. Geef voor hook-gedreven automatisering de voorkeur aan sterke moderne modelniveaus en houd toolbeleid strak (`tools.profile: "messaging"` of strenger), plus sandboxing waar mogelijk.

### Promptinjectie vereist geen openbare DM's

Zelfs als **alleen jij** de bot berichten kunt sturen, kan promptinjectie nog steeds gebeuren via
alle **onvertrouwde inhoud** die de bot leest (resultaten van web search/fetch, browserpagina's,
e-mails, docs, bijlagen, geplakte logs/code). Met andere woorden: de afzender is niet
het enige aanvalsoppervlak; de **inhoud zelf** kan vijandige instructies bevatten.

Wanneer tools zijn ingeschakeld, is het typische risico het exfiltreren van context of het activeren
van toolaanroepen. Verklein de blast radius door:

- Een alleen-lezen of tool-uitgeschakelde **reader agent** te gebruiken om onvertrouwde inhoud samen te vatten,
  en daarna de samenvatting aan je hoofdagent door te geven.
- `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools, tenzij nodig.
- Voor OpenResponses-URL-invoer (`input_file` / `input_image`) strakke
  `gateway.http.endpoints.responses.files.urlAllowlist` en
  `gateway.http.endpoints.responses.images.urlAllowlist` in te stellen, en `maxUrlParts` laag te houden.
  Lege allowlists worden behandeld als niet ingesteld; gebruik `files.allowUrl: false` / `images.allowUrl: false`
  als je URL-ophalen volledig wilt uitschakelen.
- Voor OpenResponses-bestandsinvoer wordt gedecodeerde `input_file`-tekst nog steeds geïnjecteerd als
  **onvertrouwde externe inhoud**. Vertrouw er niet op dat bestandstekst vertrouwd is alleen omdat
  de Gateway deze lokaal heeft gedecodeerd. Het geïnjecteerde blok bevat nog steeds expliciete
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>`-grensmarkers plus `Source: External`-
  metadata, ook al laat dit pad de langere `SECURITY NOTICE:`-banner weg.
- Dezelfde markergebaseerde inpakking wordt toegepast wanneer media-understanding tekst extraheert
  uit bijgevoegde documenten voordat die tekst aan de mediaprompt wordt toegevoegd.
- Sandboxing en strikte tool-allowlists in te schakelen voor elke agent die onvertrouwde invoer aanraakt.
- Geheimen uit prompts te houden; geef ze in plaats daarvan door via env/config op de gatewayhost.

### Self-hosted LLM-backends

OpenAI-compatibele self-hosted backends zoals vLLM, SGLang, TGI, LM Studio,
of aangepaste Hugging Face-tokenizerstacks kunnen verschillen van gehoste providers in hoe
speciale tokens uit chatsjablonen worden verwerkt. Als een backend letterlijke strings
zoals `<|im_start|>`, `<|start_header_id|>` of `<start_of_turn>` tokenizet als
structurele chatsjabloontokens binnen gebruikersinhoud, kan onvertrouwde tekst proberen
rolgrenzen op de tokenizerlaag te vervalsen.

OpenClaw verwijdert veelvoorkomende speciale-tokenliterals van modelfamilies uit ingepakte
externe inhoud voordat deze naar het model wordt verzonden. Houd inpakking van externe inhoud
ingeschakeld, en geef de voorkeur aan backendinstellingen die speciale tokens in door gebruikers
aangeleverde inhoud splitsen of escapen wanneer beschikbaar. Gehoste providers zoals OpenAI
en Anthropic passen al hun eigen sanitization aan de requestzijde toe.

### Modelsterkte (beveiligingsopmerking)

Weerstand tegen promptinjectie is **niet** uniform over modelniveaus. Kleinere/goedkopere modellen zijn over het algemeen gevoeliger voor toolmisbruik en instructiekaping, vooral onder vijandige prompts.

<Warning>
Voor agents met tools of agents die onvertrouwde inhoud lezen, is het promptinjectierisico met oudere/kleinere modellen vaak te hoog. Draai die workloads niet op zwakke modelniveaus.
</Warning>

Aanbevelingen:

- **Gebruik het model van de nieuwste generatie en het beste niveau** voor elke bot die tools kan uitvoeren of bestanden/netwerken kan aanraken.
- **Gebruik geen oudere/zwakkere/kleinere niveaus** voor agents met tools of onvertrouwde inboxen; het promptinjectierisico is te hoog.
- Als je een kleiner model moet gebruiken, **verklein de blast radius** (alleen-lezen tools, sterke sandboxing, minimale toegang tot bestandssystemen, strikte allowlists).
- Wanneer je kleine modellen draait, **schakel sandboxing in voor alle sessies** en **schakel web_search/web_fetch/browser uit**, tenzij invoer strikt gecontroleerd is.
- Voor persoonlijke chat-only assistenten met vertrouwde invoer en zonder tools zijn kleinere modellen meestal prima.

## Reasoning en uitgebreide uitvoer in groepen

`/reasoning`, `/verbose` en `/trace` kunnen interne reasoning, tool-
uitvoer of Plugin-diagnostiek blootleggen die
niet bedoeld waren voor een openbaar kanaal. Behandel ze in groepsinstellingen als **alleen debug**
en houd ze uit, tenzij je ze expliciet nodig hebt.

Richtlijnen:

- Houd `/reasoning`, `/verbose` en `/trace` uitgeschakeld in openbare ruimtes.
- Als je ze inschakelt, doe dat alleen in vertrouwde DM's of strak gecontroleerde ruimtes.
- Onthoud: uitgebreide uitvoer en trace-uitvoer kunnen toolargumenten, URL's, Plugin-diagnostiek en gegevens bevatten die het model heeft gezien.

## Voorbeelden voor configuratiehardening

### Bestandsrechten

Houd config + status privé op de gatewayhost:

- `~/.openclaw/openclaw.json`: `600` (alleen gebruiker lezen/schrijven)
- `~/.openclaw`: `700` (alleen gebruiker)

`openclaw doctor` kan waarschuwen en aanbieden deze rechten aan te scherpen.

### Netwerkblootstelling (bind, poort, firewall)

De Gateway multiplexeert **WebSocket + HTTP** op één poort:

- Standaard: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Dit HTTP-oppervlak omvat de Control UI en de canvas-host:

- Control UI (SPA-assets) (standaardbasispad `/`)
- Canvas-host: `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` (willekeurige HTML/JS; behandel als onvertrouwde inhoud)

Als je canvasinhoud in een normale browser laadt, behandel die dan als elke andere onvertrouwde webpagina:

- Stel de canvas-host niet bloot aan onvertrouwde netwerken/gebruikers.
- Laat canvasinhoud niet dezelfde origin delen als geprivilegieerde weboppervlakken, tenzij je de implicaties volledig begrijpt.

Bindmodus bepaalt waar de Gateway luistert:

- `gateway.bind: "loopback"` (standaard): alleen lokale clients kunnen verbinden.
- Niet-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) vergroten het aanvalsoppervlak. Gebruik ze alleen met gateway-authenticatie (gedeeld token/wachtwoord of een correct geconfigureerde vertrouwde proxy) en een echte firewall.

Vuistregels:

- Gebruik bij voorkeur Tailscale Serve in plaats van LAN-bindings (Serve houdt de Gateway op loopback, en Tailscale regelt de toegang).
- Als je toch aan LAN moet binden, scherm de poort met een firewall af tot een strikte allowlist van bron-IP's; forward de poort niet breed.
- Stel de Gateway nooit zonder authenticatie bloot op `0.0.0.0`.

### Docker-poortpublicatie met UFW

Als je OpenClaw met Docker op een VPS draait, onthoud dan dat gepubliceerde containerpoorten
(`-p HOST:CONTAINER` of Compose `ports:`) via Docker-forwardingketens worden gerouteerd,
niet alleen via host-`INPUT`-regels.

Om Docker-verkeer in lijn te houden met je firewallbeleid, dwing je regels af in
`DOCKER-USER` (deze keten wordt geëvalueerd vóór Docker's eigen acceptatieregels).
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
verschillen per VPS-image (`ens3`, `enp*`, enz.) en mismatches kunnen er per ongeluk voor zorgen
dat je deny-regel wordt overgeslagen.

Snelle validatie na herladen:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Verwachte externe poorten mogen alleen zijn wat je bewust blootstelt (voor de meeste
setups: SSH + je reverse-proxypoorten).

### mDNS/Bonjour-detectie

Wanneer de gebundelde `bonjour`-Plugin is ingeschakeld, broadcast de Gateway zijn aanwezigheid via mDNS (`_openclaw-gw._tcp` op poort 5353) voor lokale apparaatdetectie. In volledige modus bevat dit TXT-records die operationele details kunnen blootgeven:

- `cliPath`: volledig bestandssysteempad naar de CLI-binary (onthult gebruikersnaam en installatielocatie)
- `sshPort`: adverteert SSH-beschikbaarheid op de host
- `displayName`, `lanHost`: hostnaaminformatie

**Overweging voor operationele beveiliging:** Het broadcasten van infrastructuurdetails maakt verkenning eenvoudiger voor iedereen op het lokale netwerk. Zelfs "onschuldige" informatie zoals bestandssysteempaden en SSH-beschikbaarheid helpt aanvallers je omgeving in kaart te brengen.

**Aanbevelingen:**

1. **Houd Bonjour uitgeschakeld tenzij LAN-detectie nodig is.** Bonjour start automatisch op macOS-hosts en is elders opt-in; directe Gateway-URL's, Tailnet, SSH of wide-area DNS-SD vermijden lokale multicast.

2. **Minimale modus** (standaard wanneer Bonjour is ingeschakeld, aanbevolen voor blootgestelde gateways): laat gevoelige velden weg uit mDNS-broadcasts:

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

5. **Omgevingsvariabele** (alternatief): stel `OPENCLAW_DISABLE_BONJOUR=1` in om mDNS uit te schakelen zonder configuratiewijzigingen.

Wanneer Bonjour is ingeschakeld in minimale modus, broadcast de Gateway genoeg voor apparaatdetectie (`role`, `gatewayPort`, `transport`) maar laat `cliPath` en `sshPort` weg. Apps die CLI-padinformatie nodig hebben, kunnen die in plaats daarvan ophalen via de geauthenticeerde WebSocket-verbinding.

### Vergrendel de Gateway WebSocket (lokale authenticatie)

Gateway-authenticatie is **standaard vereist**. Als er geen geldig gateway-authenticatiepad is geconfigureerd,
weigert de Gateway WebSocket-verbindingen (fail-closed).

Onboarding genereert standaard een token (zelfs voor loopback), dus
lokale clients moeten authenticeren.

Stel een token in zodat **alle** WS-clients moeten authenticeren:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor kan er een voor je genereren: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` en `gateway.remote.password` zijn bronnen voor clientreferenties. Ze beschermen lokale WS-toegang **niet** op zichzelf. Lokale call-paden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld. Als `gateway.auth.token` of `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen remote fallback-maskering).
</Note>
Optioneel: pin remote TLS met `gateway.remote.tlsFingerprint` wanneer je `wss://` gebruikt.
Platte tekst `ws://` wordt geaccepteerd voor loopback, private IP-literals, `.local` en
Tailnet `*.ts.net` Gateway-URL's. Voor andere vertrouwde private-DNS-namen stel je
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als break-glass.
Dit is bewust alleen een procesomgeving, geen `openclaw.json`-configuratiesleutel.
Mobiele koppeling en handmatige of gescande Android-gatewayroutes zijn strikter:
cleartext wordt geaccepteerd voor loopback, maar private-LAN, link-local, `.local` en
hostnamen zonder punt moeten TLS gebruiken tenzij je expliciet opt-in doet voor het vertrouwde
private-network cleartext-pad.

Lokale apparaatkoppeling:

- Apparaatkoppeling wordt automatisch goedgekeurd voor directe lokale local loopback-verbindingen om
  clients op dezelfde host soepel te houden.
- OpenClaw heeft ook een smal backend/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief tailnet-bindings op dezelfde host, worden als
  remote behandeld voor koppeling en hebben nog steeds goedkeuring nodig.
- Forwarded-header-bewijs op een loopback-verzoek diskwalificeert loopback-
  localiteit. Automatische goedkeuring van metadata-upgrades is nauw afgebakend. Zie
  [Gateway-koppeling](/nl/gateway/pairing) voor beide regels.

Authenticatiemodi:

- `gateway.auth.mode: "token"`: gedeelde bearer-token (aanbevolen voor de meeste setups).
- `gateway.auth.mode: "password"`: wachtwoordauthenticatie (bij voorkeur instellen via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: vertrouw op een identity-aware reverse proxy om gebruikers te authenticeren en identiteit via headers door te geven (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).

Rotatiechecklist (token/wachtwoord):

1. Genereer/stel een nieuw geheim in (`gateway.auth.token` of `OPENCLAW_GATEWAY_PASSWORD`).
2. Herstart de Gateway (of herstart de macOS-app als die de Gateway superviseert).
3. Werk alle remote clients bij (`gateway.remote.token` / `.password` op machines die de Gateway aanroepen).
4. Controleer dat je niet meer kunt verbinden met de oude referenties.

### Tailscale Serve-identiteitsheaders

Wanneer `gateway.auth.allowTailscale` `true` is (standaard voor Serve), accepteert OpenClaw
Tailscale Serve-identiteitsheaders (`tailscale-user-login`) voor Control
UI/WebSocket-authenticatie. OpenClaw verifieert de identiteit door het
`x-forwarded-for`-adres via de lokale Tailscale-daemon (`tailscale whois`) op te lossen
en dit met de header te matchen. Dit wordt alleen geactiveerd voor verzoeken die loopback raken
en `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host` bevatten zoals
geïnjecteerd door Tailscale.
Voor dit async identiteitscontrolepad worden mislukte pogingen voor dezelfde `{scope, ip}`
geserialiseerd voordat de limiter de mislukking registreert. Gelijktijdige foute retries
van één Serve-client kunnen daarom de tweede poging onmiddellijk buitensluiten
in plaats van als twee gewone mismatches door te racen.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale identity-header-authenticatie. Ze volgen nog steeds de
geconfigureerde HTTP-authenticatiemodus van de gateway.

Belangrijke grensnotitie:

- Gateway HTTP bearer-authenticatie is in feite alles-of-niets operatortoegang.
- Behandel referenties die `/v1/chat/completions`, `/v1/responses`, Plugin-routes zoals `/api/v1/admin/rpc` of `/api/channels/*` kunnen aanroepen als operatorgeheimen met volledige toegang voor die gateway.
- Op het OpenAI-compatibele HTTP-oppervlak herstelt bearer-authenticatie met gedeeld geheim de volledige standaard operatorscopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) en eigenaarsemantiek voor agentbeurten; smallere `x-openclaw-scopes`-waarden verminderen dat pad met gedeeld geheim niet.
- Per-request scope-semantiek op HTTP is alleen van toepassing wanneer het verzoek afkomstig is uit een modus met identiteit, zoals trusted proxy auth, of uit een expliciet no-auth private ingress.
- In die modi met identiteit valt het weglaten van `x-openclaw-scopes` terug op de normale standaard operatorscope-set; stuur de header expliciet wanneer je een smallere scope-set wilt. OpenAI-compatibele headers op eigenaarniveau, zoals `x-openclaw-model`, vereisen `operator.admin` wanneer scopes worden versmald.
- `/tools/invoke` en HTTP-eindpunten voor sessiegeschiedenis volgen dezelfde regel voor gedeeld geheim: bearer-authenticatie met token/wachtwoord wordt daar ook behandeld als volledige operatortoegang, terwijl modi met identiteit nog steeds gedeclareerde scopes respecteren.
- Deel deze referenties niet met niet-vertrouwde callers; gebruik bij voorkeur aparte gateways per vertrouwensgrens.

**Vertrouwensaanname:** tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is.
Beschouw dit niet als bescherming tegen vijandige processen op dezelfde host. Als niet-vertrouwde
lokale code op de gatewayhost kan draaien, schakel dan `gateway.auth.allowTailscale` uit
en vereis expliciete authenticatie met gedeeld geheim via `gateway.auth.mode: "token"` of
`"password"`.

**Beveiligingsregel:** forward deze headers niet vanuit je eigen reverse proxy. Als
je TLS beëindigt of proxyt vóór de gateway, schakel dan
`gateway.auth.allowTailscale` uit en gebruik authenticatie met gedeeld geheim (`gateway.auth.mode:
"token"` of `"password"`) of [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)
in plaats daarvan.

Vertrouwde proxy's:

- Als je TLS vóór de Gateway beëindigt, stel `gateway.trustedProxies` in op de IP's van je proxy.
- OpenClaw vertrouwt `x-forwarded-for` (of `x-real-ip`) van die IP's om het client-IP te bepalen voor lokale koppelingscontroles en HTTP-auth/local-controles.
- Zorg dat je proxy `x-forwarded-for` **overschrijft** en directe toegang tot de Gateway-poort blokkeert.

Zie [Tailscale](/nl/gateway/tailscale) en [Web-overzicht](/nl/web).

### Browserbesturing via node host (aanbevolen)

Als je Gateway remote is maar de browser op een andere machine draait, voer dan een **node host**
uit op de browsermachine en laat de Gateway browseracties proxyen (zie [Browsertool](/nl/tools/browser)).
Behandel node-koppeling als admin-toegang.

Aanbevolen patroon:

- Houd de Gateway en node host op dezelfde tailnet (Tailscale).
- Koppel de node bewust; schakel browserproxyroutering uit als je die niet nodig hebt.

Vermijd:

- Relay/control-poorten blootstellen via LAN of publiek internet.
- Tailscale Funnel voor browserbesturingseindpunten (publieke blootstelling).

### Geheimen op schijf

Ga ervan uit dat alles onder `~/.openclaw/` (of `$OPENCLAW_STATE_DIR/`) geheimen of privégegevens kan bevatten:

- `openclaw.json`: configuratie kan tokens bevatten (gateway, remote gateway), providerinstellingen en allowlists.
- `credentials/**`: kanaalreferenties (voorbeeld: WhatsApp-creds), koppelingsallowlists, legacy OAuth-imports.
- `agents/<agentId>/agent/auth-profiles.json`: API-sleutels, tokenprofielen, OAuth-tokens en optionele `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex app-serveraccount, configuratie, skills, plugins, native thread state en diagnostiek.
- `secrets.json` (optioneel): file-backed geheime payload gebruikt door `file` SecretRef-providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: legacy compatibiliteitsbestand. Statische `api_key`-vermeldingen worden opgeschoond wanneer ze worden ontdekt.
- `agents/<agentId>/sessions/**`: sessietranscripten (`*.jsonl`) + routeringsmetadata (`sessions.json`) die privéberichten en tooluitvoer kunnen bevatten.
- gebundelde Plugin-pakketten: geïnstalleerde plugins (plus hun `node_modules/`).
- `sandboxes/**`: tool-sandboxwerkruimtes; kunnen kopieën verzamelen van bestanden die je in de sandbox leest/schrijft.

Hardening-tips:

- Houd machtigingen strikt (`700` voor mappen, `600` voor bestanden).
- Gebruik volledige-schijfversleuteling op de Gateway-host.
- Gebruik bij voorkeur een speciaal OS-gebruikersaccount voor de Gateway als de host wordt gedeeld.

### Workspace-`.env`-bestanden

OpenClaw laadt workspace-lokale `.env`-bestanden voor agents en tools, maar laat die bestanden nooit stilzwijgend Gateway-runtimebesturing overschrijven.

- Omgevingsvariabelen voor providerreferenties worden geblokkeerd uit niet-vertrouwde workspace-`.env`-bestanden. Voorbeelden zijn `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, en provider-authenticatiesleutels die door geinstalleerde vertrouwde plugins zijn gedeclareerd. Plaats providerreferenties in de procesomgeving van de Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), het config-`env`-blok, of optionele import uit de login-shell.
- Elke sleutel die begint met `OPENCLAW_*` wordt geblokkeerd uit niet-vertrouwde workspace-`.env`-bestanden.
- Channel-endpointinstellingen voor Matrix, Mattermost, IRC en Synology Chat worden ook geblokkeerd voor workspace-`.env`-overschrijvingen, zodat gekloonde workspaces gebundeld connectorverkeer niet kunnen omleiden via lokale endpointconfiguratie. Endpoint-env-sleutels (zoals `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) moeten uit de procesomgeving van de Gateway of `env.shellEnv` komen, niet uit een door de workspace geladen `.env`.
- De blokkade is fail-closed: een nieuwe runtimebesturingsvariabele die in een toekomstige release wordt toegevoegd, kan niet worden geerfd uit een ingecheckte of door een aanvaller aangeleverde `.env`; de sleutel wordt genegeerd en de Gateway behoudt zijn eigen waarde.
- Vertrouwde proces-/OS-omgevingsvariabelen, globale runtime-dotenv, config-`env` en ingeschakelde login-shell-import blijven van toepassing - dit beperkt alleen het laden van workspace-`.env`-bestanden.

Waarom: workspace-`.env`-bestanden staan vaak naast agentcode, worden per ongeluk gecommit of door tools geschreven. Het blokkeren van providerreferenties voorkomt dat een gekloonde workspace door aanvallers beheerde provideraccounts kan vervangen. Het blokkeren van het volledige `OPENCLAW_*`-prefix betekent dat het later toevoegen van een nieuwe `OPENCLAW_*`-vlag nooit kan terugvallen op stille overerving uit workspace-status.

### Logs en transcripten (redactie en bewaartermijn)

Logs en transcripten kunnen gevoelige informatie lekken, zelfs wanneer toegangscontroles correct zijn:

- Gateway-logs kunnen tool-samenvattingen, fouten en URL's bevatten.
- Sessietranscripten kunnen geplakte geheimen, bestandsinhoud, commandouitvoer en links bevatten.

Aanbevelingen:

- Laat redactie van logs en transcripten ingeschakeld (`logging.redactSensitive: "tools"`; standaard).
- Voeg aangepaste patronen voor je omgeving toe via `logging.redactPatterns` (tokens, hostnamen, interne URL's).
- Geef bij het delen van diagnostiek de voorkeur aan `openclaw status --all` (plakbaar, geheimen geredigeerd) boven ruwe logs.
- Snoei oude sessietranscripten en logbestanden als je geen lange bewaartermijn nodig hebt.

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

Reageer in groepschats alleen wanneer er expliciet wordt vermeld.

### Aparte nummers (WhatsApp, Signal, Telegram)

Overweeg voor channels op basis van telefoonnummers om je AI op een ander telefoonnummer te draaien dan je persoonlijke nummer:

- Persoonlijk nummer: je gesprekken blijven prive
- Botnummer: AI handelt deze af, met passende grenzen

### Alleen-lezenmodus (via sandbox en tools)

Je kunt een alleen-lezenprofiel maken door het volgende te combineren:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (of `"none"` voor geen workspacetoegang)
- tool-allow-/deny-lijsten die `write`, `edit`, `apply_patch`, `exec`, `process`, enz. blokkeren.

Aanvullende hardeningopties:

- `tools.exec.applyPatch.workspaceOnly: true` (standaard): zorgt ervoor dat `apply_patch` niet buiten de workspacemap kan schrijven/verwijderen, zelfs wanneer sandboxing uitstaat. Stel alleen in op `false` als je bewust wilt dat `apply_patch` bestanden buiten de workspace aanraakt.
- `tools.fs.workspaceOnly: true` (optioneel): beperkt `read`-/`write`-/`edit`-/`apply_patch`-paden en automatische laadpaden voor native promptafbeeldingen tot de workspacemap (handig als je vandaag absolute paden toestaat en een enkele guardrail wilt).
- Houd bestandssysteemroots beperkt: vermijd brede roots zoals je thuismap voor agentworkspaces/sandboxworkspaces. Brede roots kunnen gevoelige lokale bestanden (bijvoorbeeld state/config onder `~/.openclaw`) blootstellen aan bestandssysteemtools.

### Veilige baseline (kopieren/plakken)

Een "veilige standaard"-config die de Gateway prive houdt, DM-koppeling vereist en altijd-aan-groepsbots vermijdt:

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

Als je tooluitvoering ook "standaard veiliger" wilt maken, voeg dan een sandbox toe en weiger gevaarlijke tools voor elke agent die geen eigenaar is (voorbeeld hieronder onder "Toegangsprofielen per agent").

Ingebouwde baseline voor door chat aangestuurde agentbeurten: afzenders die geen eigenaar zijn, kunnen de `cron`- of `gateway`-tools niet gebruiken.

## Sandboxing (aanbevolen)

Specifieke documentatie: [Sandboxing](/nl/gateway/sandboxing)

Twee elkaar aanvullende benaderingen:

- **Draai de volledige Gateway in Docker** (containergrens): [Docker](/nl/install/docker)
- **Tool-sandbox** (`agents.defaults.sandbox`, host-Gateway + sandbox-geisoleerde tools; Docker is de standaardbackend): [Sandboxing](/nl/gateway/sandboxing)

<Note>
Houd `agents.defaults.sandbox.scope` op `"agent"` (standaard) of `"session"` voor strengere isolatie per sessie om toegang tussen agents te voorkomen. `scope: "shared"` gebruikt een enkele container of workspace.
</Note>

Overweeg ook agentworkspacetoegang binnen de sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (standaard) houdt de agentworkspace buiten bereik; tools draaien tegen een sandboxworkspace onder `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` koppelt de agentworkspace alleen-lezen op `/agent` (schakelt `write`/`edit`/`apply_patch` uit)
- `agents.defaults.sandbox.workspaceAccess: "rw"` koppelt de agentworkspace lezen/schrijven op `/workspace`
- Extra `sandbox.docker.binds` worden gevalideerd tegen genormaliseerde en gecanonicaliseerde bronpaden. Trucs met bovenliggende symlinks en canonieke thuismapaliassen falen nog steeds gesloten als ze oplossen naar geblokkeerde roots zoals `/etc`, `/var/run` of referentiemappen onder de OS-thuismap.

<Warning>
`tools.elevated` is de globale baseline-uitweg die exec buiten de sandbox uitvoert. De effectieve host is standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`. Houd `tools.elevated.allowFrom` strikt en schakel het niet in voor vreemden. Je kunt elevated per agent verder beperken via `agents.list[].tools.elevated`. Zie [Elevated mode](/nl/tools/elevated).
</Warning>

### Guardrail voor sub-agentdelegatie

Als je sessietools toestaat, behandel gedelegeerde sub-agentruns dan als een extra grensbeslissing:

- Weiger `sessions_spawn` tenzij de agent echt delegatie nodig heeft.
- Beperk `agents.defaults.subagents.allowAgents` en eventuele per-agent-overschrijvingen van `agents.list[].subagents.allowAgents` tot bekende veilige doelagents.
- Roep voor elke workflow die gesandboxed moet blijven `sessions_spawn` aan met `sandbox: "require"` (standaard is `inherit`).
- `sandbox: "require"` faalt snel wanneer de doel-child-runtime niet gesandboxed is.

## Risico's van browserbesturing

Het inschakelen van browserbesturing geeft het model de mogelijkheid om een echte browser te besturen.
Als dat browserprofiel al ingelogde sessies bevat, kan het model
toegang krijgen tot die accounts en gegevens. Behandel browserprofielen als **gevoelige status**:

- Gebruik bij voorkeur een speciaal profiel voor de agent (het standaardprofiel `openclaw`).
- Vermijd dat je de agent naar je persoonlijke dagelijkse profiel wijst.
- Houd hostbrowserbesturing uitgeschakeld voor gesandboxte agents tenzij je ze vertrouwt.
- De standalone local loopback-browserbesturings-API respecteert alleen authenticatie met gedeeld geheim
  (gateway-token-bearer-authenticatie of gateway-wachtwoord). Deze gebruikt geen
  trusted-proxy- of Tailscale Serve-identiteitsheaders.
- Behandel browserdownloads als niet-vertrouwde invoer; geef de voorkeur aan een geisoleerde downloadmap.
- Schakel browsersynchronisatie/wachtwoordbeheerders in het agentprofiel uit indien mogelijk (vermindert blast radius).
- Ga er bij externe gateways van uit dat "browserbesturing" gelijkstaat aan "operatortoegang" tot alles wat dat profiel kan bereiken.
- Houd de Gateway- en node-hosts alleen beschikbaar via tailnet; vermijd blootstelling van browserbesturingspoorten aan LAN of openbaar internet.
- Schakel browserproxyrouting uit wanneer je die niet nodig hebt (`gateway.nodes.browser.mode="off"`).
- Chrome MCP-modus voor bestaande sessies is **niet** "veiliger"; deze kan namens jou handelen in alles wat dat Chrome-hostprofiel kan bereiken.

### Browser-SSRF-beleid (standaard strikt)

Het browsernavigatiebeleid van OpenClaw is standaard strikt: prive/interne bestemmingen blijven geblokkeerd tenzij je expliciet opt-in gebruikt.

- Standaard: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is niet ingesteld, dus browsernavigatie houdt prive/interne/special-use-bestemmingen geblokkeerd.
- Legacy-alias: `browser.ssrfPolicy.allowPrivateNetwork` wordt nog steeds geaccepteerd voor compatibiliteit.
- Opt-inmodus: stel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in om prive/interne/special-use-bestemmingen toe te staan.
- Gebruik in strikte modus `hostnameAllowlist` (patronen zoals `*.example.com`) en `allowedHostnames` (exacte hostuitzonderingen, inclusief geblokkeerde namen zoals `localhost`) voor expliciete uitzonderingen.
- Navigatie wordt gecontroleerd voor het verzoek en best-effort opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL na navigatie om op redirects gebaseerde pivots te beperken.

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

Met multi-agentrouting kan elke agent zijn eigen sandbox- en toolbeleid hebben:
gebruik dit om per agent **volledige toegang**, **alleen-lezen** of **geen toegang** te geven.
Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor volledige details
en prioriteitsregels.

Veelvoorkomende gebruiksscenario's:

- Persoonlijke agent: volledige toegang, geen sandbox
- Familie-/werkagent: gesandboxed + alleen-lezen tools
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

Als je AI iets verkeerds doet:

### Beperk

1. **Stop het:** stop de macOS-app (als die de Gateway beheert) of beëindig je `openclaw gateway`-proces.
2. **Sluit blootstelling af:** stel `gateway.bind: "loopback"` in (of schakel Tailscale Funnel/Serve uit) totdat je begrijpt wat er is gebeurd.
3. **Bevries toegang:** zet risicovolle DM's/groepen op `dmPolicy: "disabled"` / vereis vermeldingen, en verwijder `"*"` allow-all-vermeldingen als je die had.

### Roteer (ga uit van compromittering als geheimen zijn gelekt)

1. Roteer Gateway-authenticatie (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) en start opnieuw.
2. Roteer remote-clientgeheimen (`gateway.remote.token` / `.password`) op elke machine die de Gateway kan aanroepen.
3. Roteer provider-/API-referenties (WhatsApp-referenties, Slack-/Discord-tokens, model-/API-sleutels in `auth-profiles.json` en versleutelde geheime payloadwaarden wanneer gebruikt).

### Audit

1. Controleer Gateway-logboeken: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (of `logging.file`).
2. Controleer de relevante transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Controleer recente configuratiewijzigingen (alles wat toegang kan hebben verruimd: `gateway.bind`, `gateway.auth`, DM-/groepsbeleid, `tools.elevated`, plugin-wijzigingen).
4. Voer `openclaw security audit --deep` opnieuw uit en bevestig dat kritieke bevindingen zijn opgelost.

### Verzamelen voor een rapport

- Tijdstempel, Gateway-hostbesturingssysteem + OpenClaw-versie
- De sessietranscript(s) + een korte logstaart (na redactie)
- Wat de aanvaller stuurde + wat de agent deed
- Of de Gateway buiten loopback was blootgesteld (LAN/Tailscale Funnel/Serve)

## Scannen op geheimen

CI voert de pre-commit-hook `detect-private-key` uit over de repository. Als deze
mislukt, verwijder of roteer dan het vastgelegde sleutelmateriaal en reproduceer lokaal:

```bash
pre-commit run --all-files detect-private-key
```

## Beveiligingsproblemen melden

Een kwetsbaarheid in OpenClaw gevonden? Meld deze verantwoord:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Plaats niets openbaar totdat het is opgelost
3. We vermelden je naam (tenzij je anonimiteit verkiest)
