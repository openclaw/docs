---
read_when:
    - Functies toevoegen die de toegang verbreden of automatisering uitbreiden
summary: Beveiligingsoverwegingen en dreigingsmodel voor het draaien van een AI-Gateway met shelltoegang
title: Beveiliging
x-i18n:
    generated_at: "2026-05-07T13:18:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8706977504b52a225c08deadeddb60ac6791933297637d41885d0b859ca28406
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Vertrouwensmodel voor persoonlijke assistenten.** Deze richtlijn gaat uit van één vertrouwde
  operatorgrens per Gateway (single-user, personal-assistant-model).
  OpenClaw is **geen** vijandige multi-tenant beveiligingsgrens voor meerdere
  vijandige gebruikers die één agent of Gateway delen. Als je gebruik met gemengd vertrouwen of
  vijandige gebruikers nodig hebt, splits dan vertrouwensgrenzen (aparte Gateway +
  inloggegevens, idealiter aparte OS-gebruikers of hosts).
</Warning>

## Eerst scope: beveiligingsmodel voor persoonlijke assistenten

De beveiligingsrichtlijnen van OpenClaw gaan uit van een **persoonlijke assistent**-deployment: één vertrouwde operatorgrens, mogelijk met veel agents.

- Ondersteunde beveiligingshouding: één gebruiker/vertrouwensgrens per Gateway (bij voorkeur één OS-gebruiker/host/VPS per grens).
- Geen ondersteunde beveiligingsgrens: één gedeelde Gateway/agent die wordt gebruikt door onderling onvertrouwde of vijandige gebruikers.
- Als isolatie voor vijandige gebruikers vereist is, splits dan per vertrouwensgrens (aparte Gateway + inloggegevens, en idealiter aparte OS-gebruikers/hosts).
- Als meerdere onvertrouwde gebruikers één tool-enabled agent kunnen berichten, behandel ze dan alsof ze dezelfde gedelegeerde toolbevoegdheid voor die agent delen.

Deze pagina legt hardening **binnen dat model** uit. Ze claimt geen vijandige multi-tenant isolatie op één gedeelde Gateway.

## Snelle controle: `openclaw security audit`

Zie ook: [Formele verificatie (beveiligingsmodellen)](/nl/security/formal-verification)

Voer dit regelmatig uit (vooral na het wijzigen van configuratie of het blootstellen van netwerkoppervlakken):

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

Het markeert veelvoorkomende valkuilen (blootstelling van Gateway-authenticatie, blootstelling van browserbesturing, verhoogde allowlists, bestandssysteemmachtigingen, permissieve exec-goedkeuringen en toolblootstelling via open kanalen).

OpenClaw is zowel een product als een experiment: je koppelt gedrag van frontiermodellen aan echte berichtoppervlakken en echte tools. **Er bestaat geen "perfect beveiligde" setup.** Het doel is om bewust te zijn over:

- wie met je bot kan praten
- waar de bot mag handelen
- wat de bot mag aanraken

Begin met de kleinste toegang die nog werkt en breid die daarna uit naarmate je meer vertrouwen krijgt.

### Deployment- en hostvertrouwen

OpenClaw gaat ervan uit dat de host- en configuratiegrens vertrouwd zijn:

- Als iemand de state/config van de Gateway-host kan wijzigen (`~/.openclaw`, inclusief `openclaw.json`), behandel die persoon dan als een vertrouwde operator.
- Eén Gateway draaien voor meerdere onderling onvertrouwde/vijandige operators is **geen aanbevolen setup**.
- Voor teams met gemengd vertrouwen: splits vertrouwensgrenzen met aparte Gateways (of minimaal aparte OS-gebruikers/hosts).
- Aanbevolen standaard: één gebruiker per machine/host (of VPS), één Gateway voor die gebruiker, en één of meer agents in die Gateway.
- Binnen één Gateway-instantie is geauthenticeerde operatortoegang een vertrouwde control-plane-rol, geen per-user tenantrol.
- Sessie-identifiers (`sessionKey`, sessie-ID's, labels) zijn routeselectors, geen autorisatietokens.
- Als meerdere mensen één tool-enabled agent kunnen berichten, kan elk van hen dezelfde machtigingenset sturen. Per-user sessie-/geheugenisolatie helpt voor privacy, maar zet een gedeelde agent niet om in per-user hostautorisatie.

### Veilige bestandsbewerkingen

OpenClaw gebruikt `@openclaw/fs-safe` voor root-gebonden bestandstoegang, atomische writes, archiefextractie, tijdelijke workspaces en helpers voor geheime bestanden. OpenClaw zet de optionele POSIX Python-helper van fs-safe standaard **uit**; stel `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` of `require` alleen in wanneer je de extra fd-relatieve mutation-hardening wilt en een Python-runtime kunt ondersteunen.

Details: [Veilige bestandsbewerkingen](/nl/gateway/security/secure-file-operations).

### Gedeelde Slack-workspace: echt risico

Als "iedereen in Slack de bot kan berichten", is het kernrisico gedelegeerde toolbevoegdheid:

- elke toegestane afzender kan toolcalls (`exec`, browser, netwerk-/bestandstools) binnen het beleid van de agent uitlokken;
- prompt-/contentinjectie van één afzender kan acties veroorzaken die gedeelde state, apparaten of outputs beïnvloeden;
- als één gedeelde agent gevoelige inloggegevens/bestanden heeft, kan elke toegestane afzender potentieel exfiltratie via toolgebruik aansturen.

Gebruik aparte agents/Gateways met minimale tools voor teamworkflows; houd agents met persoonlijke gegevens privé.

### Door het bedrijf gedeelde agent: acceptabel patroon

Dit is acceptabel wanneer iedereen die die agent gebruikt binnen dezelfde vertrouwensgrens zit (bijvoorbeeld één bedrijfsteam) en de agent strikt zakelijk afgebakend is.

- draai hem op een toegewezen machine/VM/container;
- gebruik een toegewezen OS-gebruiker + toegewezen browser/profiel/accounts voor die runtime;
- meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke wachtwoordmanager-/browserprofielen.

Als je persoonlijke en bedrijfsidentiteiten op dezelfde runtime mengt, laat je de scheiding vervallen en vergroot je het risico op blootstelling van persoonlijke gegevens.

## Vertrouwensconcept voor Gateway en Node

Behandel Gateway en Node als één operatorvertrouwensdomein, met verschillende rollen:

- **Gateway** is de control plane en het beleidsoppervlak (`gateway.auth`, toolbeleid, routing).
- **Node** is het externe uitvoeringsoppervlak dat aan die Gateway is gekoppeld (commando's, apparaatacties, host-lokale mogelijkheden).
- Een caller die bij de Gateway is geauthenticeerd, wordt op Gateway-scope vertrouwd. Na pairing zijn Node-acties vertrouwde operatoracties op die Node.
- Operatorscopeniveaus en checks op goedkeuringsmoment worden samengevat in
  [Operatorscopes](/nl/gateway/operator-scopes).
- Directe loopback-backendclients die zijn geauthenticeerd met het gedeelde Gateway-
  token/wachtwoord kunnen interne control-plane RPC's uitvoeren zonder een gebruikers-
  apparaatidentiteit te presenteren. Dit is geen bypass voor externe of browserpairing: netwerk-
  clients, Node-clients, device-tokenclients en expliciete apparaatidentiteiten
  gaan nog steeds door pairing en scope-upgradehandhaving.
- `sessionKey` is routing-/contextselectie, geen per-user auth.
- Exec-goedkeuringen (allowlist + ask) zijn vangrails voor operatorintentie, geen vijandige multi-tenant isolatie.
- De productstandaard van OpenClaw voor vertrouwde single-operator-setups is dat host-exec op `gateway`/`node` is toegestaan zonder goedkeuringsprompts (`security="full"`, `ask="off"` tenzij je dit aanscherpt). Die standaard is bewuste UX, op zichzelf geen kwetsbaarheid.
- Exec-goedkeuringen binden exacte aanvraagcontext en best-effort directe lokale bestandsoperanden; ze modelleren niet semantisch elk runtime-/interpreter-loaderpad. Gebruik sandboxing en hostisolatie voor sterke grenzen.

Als je vijandige-gebruikersisolatie nodig hebt, splits vertrouwensgrenzen per OS-gebruiker/host en draai aparte Gateways.

## Matrix voor vertrouwensgrenzen

Gebruik dit als snel model bij het triageren van risico:

| Grens of controle                                         | Wat het betekent                                  | Veelvoorkomende verkeerde interpretatie                                       |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/wachtwoord/trusted-proxy/device auth) | Authenticeert callers bij Gateway-API's           | "Heeft per-message signatures op elk frame nodig om veilig te zijn"           |
| `sessionKey`                                              | Routingsleutel voor context-/sessieselectie       | "Sessiesleutel is een gebruikersauthgrens"                                    |
| Prompt-/contentvangrails                                  | Verminderen risico op modelmisbruik               | "Promptinjectie alleen bewijst auth-bypass"                                   |
| `canvas.eval` / browser evaluate                          | Bewuste operatormogelijkheid wanneer ingeschakeld | "Elke JS eval-primitive is automatisch een kwetsbaarheid in dit vertrouwensmodel" |
| Lokale TUI `!` shell                                      | Expliciet door operator getriggerde lokale uitvoering | "Lokale shell-gemaksopdracht is externe injectie"                          |
| Node-pairing en Node-commando's                           | Remote uitvoering op operatorniveau op gekoppelde apparaten | "Remote apparaatbesturing moet standaard als toegang door onvertrouwde gebruikers worden behandeld" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in enrollmentbeleid voor Nodes op vertrouwde netwerken | "Een standaard uitgeschakelde allowlist is een automatische pairingkwetsbaarheid" |

## Geen kwetsbaarheden by design

<Accordion title="Veelvoorkomende bevindingen die buiten scope vallen">

Deze patronen worden vaak gerapporteerd en worden meestal zonder actie gesloten, tenzij
een echte grensbypass wordt aangetoond:

- Alleen-promptinjectieketens zonder beleids-, auth- of sandboxbypass.
- Claims die uitgaan van vijandige multi-tenant werking op één gedeelde host of
  configuratie.
- Claims die normale operator read-path-toegang (bijvoorbeeld
  `sessions.list` / `sessions.preview` / `chat.history`) als IDOR classificeren in een
  gedeelde-Gateway-setup.
- Bevindingen bij deployments die alleen localhost gebruiken (bijvoorbeeld HSTS op een Gateway
  die alleen local loopback gebruikt).
- Bevindingen over Discord inkomende Webhook-handtekeningen voor inkomende paden die niet
  bestaan in deze repo.
- Rapporten die Node-pairingmetadata behandelen als een verborgen tweede per-command
  goedkeuringslaag voor `system.run`, terwijl de echte uitvoeringsgrens nog steeds
  het globale Node-commandobeleid van de Gateway plus de eigen exec-
  goedkeuringen van de Node is.
- Rapporten die geconfigureerde `gateway.nodes.pairing.autoApproveCidrs` op zichzelf als een
  kwetsbaarheid behandelen. Deze instelling is standaard uitgeschakeld, vereist
  expliciete CIDR/IP-vermeldingen, geldt alleen voor eerste `role: node`-pairing met
  geen aangevraagde scopes, en keurt operator/browser/Control UI,
  WebChat, role-upgrades, scope-upgrades, metadatawijzigingen, public-key-wijzigingen
  of same-host loopback trusted-proxy-headerpaden niet automatisch goed, tenzij loopback trusted-proxy auth expliciet was ingeschakeld.
- Bevindingen over "ontbrekende per-user autorisatie" die `sessionKey` als een
  auth-token behandelen.

</Accordion>

## Geharde baseline in 60 seconden

Gebruik eerst deze baseline en schakel daarna selectief tools per vertrouwde agent opnieuw in:

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

## Snelle regel voor gedeelde inboxen

Als meer dan één persoon je bot kan DM'en:

- Stel `session.dmScope: "per-channel-peer"` in (of `"per-account-channel-peer"` voor kanalen met meerdere accounts).
- Houd `dmPolicy: "pairing"` of strikte allowlists aan.
- Combineer gedeelde DM's nooit met brede tooltoegang.
- Dit hardt coöperatieve/gedeelde inboxen, maar is niet ontworpen als vijandige co-tenant-isolatie wanneer gebruikers host-/config-schrijftoegang delen.

## Model voor contextzichtbaarheid

OpenClaw scheidt twee concepten:

- **Triggerautorisatie**: wie de agent kan triggeren (`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- **Contextzichtbaarheid**: welke aanvullende context in modelinput wordt geïnjecteerd (antwoordtekst, geciteerde tekst, threadgeschiedenis, doorgestuurde metadata).

Allowlists bewaken triggers en commandoautorisatie. De instelling `contextVisibility` bepaalt hoe aanvullende context (geciteerde antwoorden, thread-roots, opgehaalde geschiedenis) wordt gefilterd:

- `contextVisibility: "all"` (standaard) behoudt aanvullende context zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context naar afzenders die zijn toegestaan door de actieve allowlist-controles.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Stel `contextVisibility` per kanaal of per ruimte/gesprek in. Zie [Groepschats](/nl/channels/groups#context-visibility-and-allowlists) voor configuratiedetails.

Richtlijnen voor advies-triage:

- Claims die alleen aantonen dat "het model geciteerde of historische tekst van afzenders buiten de allowlist kan zien" zijn hardeningsbevindingen die met `contextVisibility` kunnen worden aangepakt, geen auth- of sandboxgrens-omzeilingen op zichzelf.
- Om beveiligingsimpact te hebben, hebben meldingen nog steeds een aangetoonde vertrouwensgrens-omzeiling nodig (auth, beleid, sandbox, goedkeuring of een andere gedocumenteerde grens).

## Wat de audit controleert (op hoofdlijnen)

- **Inkomende toegang** (DM-beleid, groepsbeleid, allowlists): kunnen onbekenden de bot activeren?
- **Blast radius van tools** (verhoogde tools + open ruimtes): kan promptinjectie uitmonden in shell-/bestand-/netwerkacties?
- **Afwijking in exec-goedkeuring** (`security=full`, `autoAllowSkills`, interpreter-allowlists zonder `strictInlineEval`): doen host-exec-guardrails nog steeds wat je denkt dat ze doen?
  - `security="full"` is een brede houdingswaarschuwing, geen bewijs van een bug. Het is de gekozen standaard voor vertrouwde persoonlijke-assistent-configuraties; scherp dit alleen aan wanneer je dreigingsmodel goedkeurings- of allowlist-guardrails vereist.
- **Netwerkblootstelling** (Gateway-bind/auth, Tailscale Serve/Funnel, zwakke/korte auth-tokens).
- **Blootstelling van browserbesturing** (externe nodes, relaypoorten, externe CDP-eindpunten).
- **Hygiëne van lokale schijf** (rechten, symlinks, config-includes, paden voor "gesynchroniseerde map").
- **Plugins** (plugins laden zonder expliciete allowlist).
- **Beleidsafwijking/misconfiguratie** (sandbox-dockerinstellingen geconfigureerd maar sandboxmodus uit; ineffectieve `gateway.nodes.denyCommands`-patronen omdat matching alleen op exacte commandonaam gebeurt (bijvoorbeeld `system.run`) en shelltekst niet inspecteert; gevaarlijke `gateway.nodes.allowCommands`-items; globale `tools.profile="minimal"` overschreven door profielen per agent; door plugins beheerde tools bereikbaar onder permissief toolbeleid).
- **Afwijking in runtimeverwachtingen** (bijvoorbeeld aannemen dat impliciete exec nog steeds `sandbox` betekent wanneer `tools.exec.host` nu standaard `auto` is, of expliciet `tools.exec.host="sandbox"` instellen terwijl sandboxmodus uit staat).
- **Modelhygiëne** (waarschuwen wanneer geconfigureerde modellen legacy lijken; geen harde blokkade).

Als je `--deep` uitvoert, probeert OpenClaw ook een best-effort live Gateway-probe.

## Opslagkaart voor inloggegevens

Gebruik dit bij het auditen van toegang of het bepalen waarvan je een back-up moet maken:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env/file/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Koppelings-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-auth-profielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex-runtime-status**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Bestandsgebaseerde secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`

## Checklist voor beveiligingsaudit

Wanneer de audit bevindingen afdrukt, behandel dit als prioriteitsvolgorde:

1. **Alles dat "open" is + tools ingeschakeld**: vergrendel eerst DM's/groepen (koppeling/allowlists), scherp daarna toolbeleid/sandboxing aan.
2. **Publieke netwerkblootstelling** (LAN-bind, Funnel, ontbrekende auth): los onmiddellijk op.
3. **Externe blootstelling van browserbesturing**: behandel dit als operatortoegang (alleen tailnet, koppel nodes bewust, vermijd publieke blootstelling).
4. **Rechten**: zorg dat status/config/inloggegevens/auth niet leesbaar zijn voor groep/wereld.
5. **Plugins**: laad alleen wat je expliciet vertrouwt.
6. **Modelkeuze**: geef de voorkeur aan moderne, instructiegeharde modellen voor elke bot met tools.

## Begrippenlijst voor beveiligingsaudit

Elke auditbevinding heeft een gestructureerde `checkId` als sleutel (bijvoorbeeld
`gateway.bind_no_auth` of `tools.exec.security_full_configured`). Veelvoorkomende
kritieke ernstklassen:

- `fs.*` - bestandssysteemrechten op status, config, inloggegevens, auth-profielen.
- `gateway.*` - bindmodus, auth, Tailscale, Control UI, trusted-proxy-configuratie.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening per oppervlak.
- `plugins.*`, `skills.*` - supplychain van plugins/skills en scanbevindingen.
- `security.exposure.*` - doorsnijdende controles waar toegangsbeleid samenkomt met de blast radius van tools.

Zie de volledige catalogus met ernstniveaus, fixsleutels en ondersteuning voor automatische fixes op
[Beveiligingsauditcontroles](/nl/gateway/security/audit-checks).

## Control UI via HTTP

De Control UI heeft een **veilige context** (HTTPS of localhost) nodig om apparaatidentiteit
te genereren. `gateway.controlUi.allowInsecureAuth` is een lokale compatibiliteitsschakelaar:

- Op localhost staat het Control UI-auth toe zonder apparaatidentiteit wanneer de pagina
  via niet-veilige HTTP wordt geladen.
- Het omzeilt geen koppelingscontroles.
- Het versoepelt geen externe (niet-localhost) vereisten voor apparaatidentiteit.

Geef de voorkeur aan HTTPS (Tailscale Serve) of open de UI op `127.0.0.1`.

Alleen voor break-glass-scenario's schakelt `gateway.controlUi.dangerouslyDisableDeviceAuth`
apparaatidentiteitscontroles volledig uit. Dit is een ernstige beveiligingsverlaging;
houd dit uitgeschakeld tenzij je actief debugt en snel kunt terugdraaien.

Los van die gevaarlijke flags kunnen succesvolle `gateway.auth.mode: "trusted-proxy"`
**operator**-Control UI-sessies toelaten zonder apparaatidentiteit. Dat is bedoeld
authmodusgedrag, geen `allowInsecureAuth`-shortcut, en het geldt nog steeds niet
voor Control UI-sessies met node-rol.

`openclaw security audit` waarschuwt wanneer deze instelling is ingeschakeld.

## Samenvatting van onveilige of gevaarlijke flags

`openclaw security audit` geeft `config.insecure_or_dangerous_flags` wanneer
bekende onveilige/gevaarlijke debugschakelaars zijn ingeschakeld. Houd deze in
productie uitgeschakeld.

<AccordionGroup>
  <Accordion title="Flags tracked by the audit today">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="All `dangerous*` / `dangerously*` keys in the config schema">
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

## Configuratie van reverse proxy

Als je de Gateway achter een reverse proxy draait (nginx, Caddy, Traefik, enz.), configureer
`gateway.trustedProxies` voor correcte verwerking van doorgestuurde client-IP's.

Wanneer de Gateway proxyheaders detecteert vanaf een adres dat **niet** in `trustedProxies` staat, behandelt hij verbindingen **niet** als lokale clients. Als Gateway-auth is uitgeschakeld, worden die verbindingen geweigerd. Dit voorkomt authenticatie-omzeiling waarbij geproxiede verbindingen anders van localhost lijken te komen en automatisch vertrouwen krijgen.

`gateway.trustedProxies` voedt ook `gateway.auth.mode: "trusted-proxy"`, maar die authmodus is strenger:

- trusted-proxy-auth **faalt standaard gesloten bij proxies met loopback-bron**
- reverse proxies met loopback op dezelfde host kunnen `gateway.trustedProxies` gebruiken voor lokale-clientdetectie en verwerking van doorgestuurde IP's
- reverse proxies met loopback op dezelfde host kunnen alleen aan `gateway.auth.mode: "trusted-proxy"` voldoen wanneer `gateway.auth.trustedProxy.allowLoopback = true`; gebruik anders token-/wachtwoordauth

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

Wanneer `trustedProxies` is geconfigureerd, gebruikt de Gateway `X-Forwarded-For` om het client-IP te bepalen. `X-Real-IP` wordt standaard genegeerd, tenzij `gateway.allowRealIpFallback: true` expliciet is ingesteld.

Trusted-proxy-headers maken node-apparaatkoppeling niet automatisch vertrouwd.
`gateway.nodes.pairing.autoApproveCidrs` is een apart operatorbeleid dat standaard
is uitgeschakeld. Zelfs wanneer dit is ingeschakeld, worden trusted-proxy-headerpaden
met loopback-bron uitgesloten van automatische node-goedkeuring omdat lokale aanroepers die
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

## HSTS- en origin-opmerkingen

- OpenClaw Gateway is eerst lokaal/loopback. Als je TLS op een reverse proxy beëindigt, stel HSTS daar in op het HTTPS-domein richting proxy.
- Als de Gateway zelf HTTPS beëindigt, kun je `gateway.http.securityHeaders.strictTransportSecurity` instellen om de HSTS-header vanuit OpenClaw-responses uit te geven.
- Gedetailleerde implementatierichtlijnen staan in [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Voor niet-loopback Control UI-implementaties is `gateway.controlUi.allowedOrigins` standaard vereist.
- `gateway.controlUi.allowedOrigins: ["*"]` is een expliciet allow-all browser-origin-beleid, geen geharde standaard. Vermijd dit buiten strak gecontroleerde lokale tests.
- Browser-origin-authfouten op loopback blijven rate-limited, ook wanneer de
  algemene loopback-vrijstelling is ingeschakeld, maar de lockout-sleutel is gescoord per
  genormaliseerde `Origin`-waarde in plaats van één gedeelde localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt Host-header-origin-fallbackmodus in; behandel dit als een gevaarlijk door de operator geselecteerd beleid.
- Behandel DNS-rebinding en proxy-host-headergedrag als hardeningkwesties voor implementatie; houd `trustedProxies` strikt en vermijd directe blootstelling van de gateway aan het publieke internet.

## Lokale sessielogs staan op schijf

OpenClaw bewaart sessietranscripten op schijf onder `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Dit is vereist voor sessiecontinuiteit en (optioneel) sessiegeheugenindexering, maar het betekent ook dat
**elk proces/elke gebruiker met bestandssysteemtoegang die logs kan lezen**. Behandel schijftoegang als de vertrouwensgrens
en vergrendel de rechten op `~/.openclaw` (zie het auditgedeelte hieronder). Als je
sterkere isolatie tussen agents nodig hebt, voer ze dan uit onder afzonderlijke OS-gebruikers of afzonderlijke hosts.

## Node-uitvoering (system.run)

Als een macOS-node is gekoppeld, kan de Gateway `system.run` aanroepen op die node. Dit is **uitvoering van externe code** op de Mac:

- Vereist node-koppeling (goedkeuring + token).
- Gateway-nodekoppeling is geen goedkeuringsvlak per opdracht. Het stelt node-identiteit/vertrouwen en tokenuitgifte vast.
- De Gateway past een grof globaal beleid voor node-opdrachten toe via `gateway.nodes.allowCommands` / `denyCommands`.
- Beheerd op de Mac via **Instellingen → Exec-goedkeuringen** (beveiliging + vragen + allowlist).
- Het per-node `system.run`-beleid is het eigen exec-goedkeuringsbestand van de node (`exec.approvals.node.*`), dat strenger of soepeler kan zijn dan het globale opdracht-ID-beleid van de Gateway.
- Een node die draait met `security="full"` en `ask="off"` volgt het standaardmodel voor vertrouwde operators. Behandel dat als verwacht gedrag, tenzij je implementatie expliciet een strakker goedkeurings- of allowlist-standpunt vereist.
- De goedkeuringsmodus bindt de exacte aanvraagcontext en, waar mogelijk, een concreet lokaal script-/bestandsoperand. Als OpenClaw niet exact een direct lokaal bestand voor een interpreter-/runtime-opdracht kan identificeren, wordt uitvoering met goedkeuring geweigerd in plaats van volledige semantische dekking te beloven.
- Voor `host=node` slaan uitvoeringen met goedkeuring ook een canoniek voorbereid
  `systemRunPlan` op; latere goedgekeurde forwards hergebruiken dat opgeslagen plan, en Gateway-
  validatie weigert wijzigingen door de aanroeper aan opdracht/cwd/sessiecontext nadat de
  goedkeuringsaanvraag is gemaakt.
- Als je geen externe uitvoering wilt, stel beveiliging dan in op **weigeren** en verwijder de node-koppeling voor die Mac.

Dit onderscheid is belangrijk voor triage:

- Een opnieuw verbindende gekoppelde node die een andere opdrachtenlijst adverteert, is op zichzelf geen kwetsbaarheid als het globale beleid van de Gateway en de lokale exec-goedkeuringen van de node nog steeds de daadwerkelijke uitvoeringsgrens afdwingen.
- Meldingen die node-koppelingsmetadata behandelen als een tweede verborgen goedkeuringslaag per opdracht zijn meestal beleids-/UX-verwarring, geen omzeiling van een beveiligingsgrens.

## Dynamische Skills (watcher / externe nodes)

OpenClaw kan de Skills-lijst midden in een sessie verversen:

- **Skills-watcher**: wijzigingen aan `SKILL.md` kunnen de Skills-snapshot bij de volgende agentbeurt bijwerken.
- **Externe nodes**: het verbinden van een macOS-node kan macOS-only Skills geschikt maken (op basis van bin-probing).

Behandel Skills-mappen als **vertrouwde code** en beperk wie ze kan wijzigen.

## Het dreigingsmodel

Je AI-assistent kan:

- Willekeurige shellopdrachten uitvoeren
- Bestanden lezen/schrijven
- Toegang krijgen tot netwerkservices
- Berichten naar iedereen sturen (als je hem WhatsApp-toegang geeft)

Mensen die je berichten sturen, kunnen:

- Proberen je AI te misleiden zodat die slechte dingen doet
- Toegang tot je data social engineeren
- Infrastructuurdetails verkennen

## Kernconcept: toegangscontrole vóór intelligentie

De meeste fouten hier zijn geen geavanceerde exploits - het is "iemand stuurde de bot een bericht en de bot deed wat werd gevraagd."

Het standpunt van OpenClaw:

- **Eerst identiteit:** bepaal wie met de bot mag praten (DM-koppeling / allowlists / expliciet "open").
- **Daarna bereik:** bepaal waar de bot mag handelen (groeps-allowlists + mention-gating, tools, sandboxing, apparaatrechten).
- **Model als laatste:** ga ervan uit dat het model kan worden gemanipuleerd; ontwerp zo dat manipulatie een beperkte impact heeft.

## Opdrachtautorisatiemodel

Slashopdrachten en directives worden alleen gehonoreerd voor **geautoriseerde afzenders**. Autorisatie wordt afgeleid uit
kanaal-allowlists/koppeling plus `commands.useAccessGroups` (zie [Configuratie](/nl/gateway/configuration)
en [Slashopdrachten](/nl/tools/slash-commands)). Als een kanaal-allowlist leeg is of `"*"` bevat,
staan opdrachten effectief open voor dat kanaal.

`/exec` is een sessie-only gemak voor geautoriseerde operators. Het schrijft **geen** configuratie en
wijzigt geen andere sessies.

## Risico van control-plane-tools

Twee ingebouwde tools kunnen blijvende control-plane-wijzigingen maken:

- `gateway` kan configuratie inspecteren met `config.schema.lookup` / `config.get`, en kan blijvende wijzigingen maken met `config.apply`, `config.patch` en `update.run`.
- `cron` kan geplande taken maken die blijven draaien nadat de oorspronkelijke chat/taak is afgelopen.

De owner-only `gateway` runtime-tool weigert nog steeds om
`tools.exec.ask` of `tools.exec.security` te herschrijven; legacy `tools.bash.*`-aliassen worden
genormaliseerd naar dezelfde beschermde exec-paden vóór het schrijven.
Door agents aangestuurde bewerkingen met `gateway config.apply` en `gateway config.patch` zijn
standaard fail-closed: alleen een smalle set prompt-, model- en mention-gating-
paden is door agents aanpasbaar. Nieuwe gevoelige configuratiebomen zijn daarom beschermd,
tenzij ze bewust aan de allowlist worden toegevoegd.

Weiger deze standaard voor elke agent/elk oppervlak dat onvertrouwde inhoud verwerkt:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokkeert alleen herstartacties. Het schakelt `gateway`-configuratie-/updateacties niet uit.

## Plugins

Plugins draaien **in-process** met de Gateway. Behandel ze als vertrouwde code:

- Installeer alleen plugins uit bronnen die je vertrouwt.
- Geef de voorkeur aan expliciete `plugins.allow`-allowlists.
- Controleer pluginconfiguratie voordat je inschakelt.
- Herstart de Gateway na pluginwijzigingen.
- Als je plugins installeert of bijwerkt (`openclaw plugins install <package>`, `openclaw plugins update <id>`), behandel dit dan alsof je onvertrouwde code uitvoert:
  - Het installatiepad is de per-plugin-map onder de actieve plugininstallatie-root.
  - OpenClaw voert vóór installatie/update een ingebouwde gevaarlijke-code-scan uit. `critical`-bevindingen blokkeren standaard.
  - npm- en git-plugininstallaties voeren package-manager dependency convergence alleen uit tijdens de expliciete installatie-/updateflow. Lokale paden en archieven worden behandeld als self-contained pluginpakketten; OpenClaw kopieert/verwijst ernaar zonder `npm install` uit te voeren.
  - Geef de voorkeur aan gepinde, exacte versies (`@scope/pkg@1.2.3`) en inspecteer de uitgepakte code op schijf voordat je inschakelt.
  - `--dangerously-force-unsafe-install` is alleen een noodoptie voor fout-positieven van de ingebouwde scan bij plugininstallatie-/updateflows. Het omzeilt geen beleidsblokkades van plugin-`before_install`-hooks en omzeilt geen scanfouten.
  - Door Gateway ondersteunde installatie van Skill-dependencies volgt dezelfde gevaarlijk/verdacht-scheiding: ingebouwde `critical`-bevindingen blokkeren tenzij de aanroeper expliciet `dangerouslyForceUnsafeInstall` instelt, terwijl verdachte bevindingen alleen blijven waarschuwen. `openclaw skills install` blijft de afzonderlijke download-/installatieflow voor ClawHub-Skills.

Details: [Plugins](/nl/tools/plugin)

## DM-toegangsmodel: koppeling, allowlist, open, uitgeschakeld

Alle huidige kanalen met DM-mogelijkheid ondersteunen een DM-beleid (`dmPolicy` of `*.dm.policy`) dat inkomende DM's poort **voordat** het bericht wordt verwerkt:

- `pairing` (standaard): onbekende afzenders ontvangen een korte koppelingscode en de bot negeert hun bericht totdat het is goedgekeurd. Codes verlopen na 1 uur; herhaalde DM's verzenden geen code opnieuw totdat er een nieuwe aanvraag is gemaakt. Openstaande aanvragen zijn standaard begrensd op **3 per kanaal**.
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

Standaard routeert OpenClaw **alle DM's naar de hoofdsessie**, zodat je assistent continuïteit heeft tussen apparaten en kanalen. Als **meerdere mensen** de bot kunnen DM'en (open DM's of een allowlist met meerdere personen), overweeg dan DM-sessies te isoleren:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Dit voorkomt contextlekkage tussen gebruikers terwijl groepschats geïsoleerd blijven.

Dit is een grens voor berichtcontext, geen grens voor hostbeheerders. Als gebruikers wederzijds vijandig zijn en dezelfde Gateway-host/configuratie delen, voer dan in plaats daarvan afzonderlijke gateways per vertrouwensgrens uit.

### Veilige DM-modus (aanbevolen)

Behandel het fragment hierboven als **veilige DM-modus**:

- Standaard: `session.dmScope: "main"` (alle DM's delen één sessie voor continuïteit).
- Standaard voor lokale CLI-onboarding: schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld (bestaande expliciete waarden blijven behouden).
- Veilige DM-modus: `session.dmScope: "per-channel-peer"` (elk kanaal+afzender-paar krijgt een geïsoleerde DM-context).
- Peer-isolatie tussen kanalen: `session.dmScope: "per-peer"` (elke afzender krijgt één sessie over alle kanalen van hetzelfde type).

Als je meerdere accounts op hetzelfde kanaal gebruikt, gebruik dan in plaats daarvan `per-account-channel-peer`. Als dezelfde persoon contact met je opneemt via meerdere kanalen, gebruik dan `session.identityLinks` om die DM-sessies samen te voegen tot één canonieke identiteit. Zie [Sessiebeheer](/nl/concepts/session) en [Configuratie](/nl/gateway/configuration).

## Allowlists voor DM's en groepen

OpenClaw heeft twee afzonderlijke "wie kan mij triggeren?"-lagen:

- **DM-allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): wie met de bot mag praten in directe berichten.
  - Wanneer `dmPolicy="pairing"` worden goedkeuringen geschreven naar de account-scoped pairing-allowlistopslag onder `~/.openclaw/credentials/` (`<channel>-allowFrom.json` voor het standaardaccount, `<channel>-<accountId>-allowFrom.json` voor niet-standaardaccounts), samengevoegd met configuratie-allowlists.
- **Groeps-allowlist** (kanaalspecifiek): van welke groepen/kanalen/guilds de bot überhaupt berichten accepteert.
  - Veelvoorkomende patronen:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: per-groep-standaarden zoals `requireMention`; wanneer ingesteld, werkt dit ook als groeps-allowlist (neem `"*"` op om allow-all-gedrag te behouden).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: beperk wie de bot _binnen_ een groepssessie kan triggeren (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: per-oppervlak-allowlists + mention-standaarden.
  - Groepscontroles worden in deze volgorde uitgevoerd: eerst `groupPolicy`/groeps-allowlists, daarna mention-/reply-activering.
  - Antwoorden op een botbericht (impliciete mention) omzeilt afzender-allowlists zoals `groupAllowFrom` **niet**.
  - **Beveiligingsopmerking:** behandel `dmPolicy="open"` en `groupPolicy="open"` als laatste-redmiddel-instellingen. Ze zouden nauwelijks gebruikt moeten worden; geef de voorkeur aan koppeling + allowlists, tenzij je elk lid van de ruimte volledig vertrouwt.

Details: [Configuratie](/nl/gateway/configuration) en [Groepen](/nl/channels/groups)

## Prompt injection (wat het is, waarom het belangrijk is)

Prompt injection is wanneer een aanvaller een bericht maakt dat het model manipuleert om iets onveiligs te doen ("negeer je instructies", "dump je bestandssysteem", "volg deze link en voer opdrachten uit", enz.).

Zelfs met sterke systeemprompts is **prompt injection niet opgelost**. Systeemprompt-guardrails zijn alleen zachte richtlijnen; harde afdwinging komt van toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists (en operators kunnen deze bewust uitschakelen). Wat in de praktijk helpt:

- Houd inkomende DM's afgeschermd (pairing/allowlists).
- Geef de voorkeur aan mention-gating in groepen; vermijd "altijd actieve" bots in openbare ruimtes.
- Behandel links, bijlagen en geplakte instructies standaard als vijandig.
- Voer gevoelige tooluitvoering uit in een sandbox; houd geheimen buiten het voor de agent bereikbare bestandssysteem.
- Opmerking: sandboxing is opt-in. Als sandboxmodus uit staat, wordt impliciete `host=auto` opgelost naar de gateway-host. Expliciete `host=sandbox` faalt nog steeds gesloten omdat er geen sandbox-runtime beschikbaar is. Stel `host=gateway` in als je wilt dat dat gedrag expliciet in de config staat.
- Beperk tools met hoog risico (`exec`, `browser`, `web_fetch`, `web_search`) tot vertrouwde agents of expliciete allowlists.
- Als je interpreters op een allowlist zet (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), schakel dan `tools.exec.strictInlineEval` in zodat inline eval-vormen nog steeds expliciete goedkeuring nodig hebben.
- Shell-goedkeuringsanalyse weigert ook POSIX parameter-expansion-vormen (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) binnen **ongequote heredocs**, zodat een heredoc-body op een allowlist shell-expansion niet als platte tekst langs allowlist-review kan smokkelen. Quote de heredoc-terminator (bijvoorbeeld `<<'EOF'`) om te kiezen voor letterlijke body-semantiek; ongequote heredocs die variabelen zouden hebben geëxpandeerd, worden geweigerd.
- **Modelkeuze doet ertoe:** oudere/kleinere/legacy modellen zijn aanzienlijk minder robuust tegen prompt-injectie en toolmisbruik. Gebruik voor agents met tools het sterkste beschikbare model van de nieuwste generatie dat tegen instructiemisbruik is gehard.

Rode vlaggen die je als onvertrouwd moet behandelen:

- "Lees dit bestand/deze URL en doe precies wat erin staat."
- "Negeer je systeemprompt of veiligheidsregels."
- "Onthul je verborgen instructies of tooluitvoer."
- "Plak de volledige inhoud van ~/.openclaw of je logs."

## Special-token-sanitization voor externe content

OpenClaw verwijdert veelvoorkomende letterlijke special-token-waarden van chat-templates voor zelfgehoste LLM's uit verpakte externe content en metadata voordat ze het model bereiken. Gedekte markerfamilies omvatten Qwen/ChatML, Llama, Gemma, Mistral, Phi en GPT-OSS rol-/beurt-tokens.

Waarom:

- OpenAI-compatibele backends die zelfgehoste modellen ontsluiten, bewaren soms speciale tokens die in gebruikerstekst voorkomen, in plaats van ze te maskeren. Een aanvaller die naar inkomende externe content kan schrijven (een opgehaalde pagina, een e-mailbody, tooluitvoer met bestandsinhoud), zou anders een synthetische `assistant`- of `system`-rolgrens kunnen injecteren en aan de guardrails voor verpakte content kunnen ontsnappen.
- Sanitization gebeurt in de wrapping-laag voor externe content, zodat dit uniform geldt voor fetch-/read-tools en inkomende kanaalcontent in plaats van per provider.
- Uitgaande modelreacties hebben al een aparte sanitizer die gelekte `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` en vergelijkbare interne runtime-steigers uit voor gebruikers zichtbare antwoorden verwijdert bij de uiteindelijke aflevergrens van het kanaal. De sanitizer voor externe content is de inkomende tegenhanger.

Dit vervangt de andere hardening op deze pagina niet - `dmPolicy`, allowlists, exec-goedkeuringen, sandboxing en `contextVisibility` doen nog steeds het primaire werk. Het sluit één specifieke bypass op tokenizer-laag tegen zelfgehoste stacks die gebruikerstekst met speciale tokens intact doorsturen.

## Onveilige bypass-vlaggen voor externe content

OpenClaw bevat expliciete bypass-vlaggen die veiligheidswrapping voor externe content uitschakelen:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron-payloadveld `allowUnsafeExternalContent`

Richtlijnen:

- Laat deze in productie unset/false.
- Schakel ze alleen tijdelijk in voor strak afgebakend debuggen.
- Als ze zijn ingeschakeld, isoleer die agent (sandbox + minimale tools + dedicated sessie-namespace).

Risico-opmerking voor hooks:

- Hook-payloads zijn onvertrouwde content, zelfs wanneer aflevering komt van systemen die je beheert (mail/docs/webcontent kan prompt-injectie bevatten).
- Zwakke modelklassen vergroten dit risico. Geef voor door hooks aangestuurde automatisering de voorkeur aan sterke moderne modelklassen en houd het toolbeleid strak (`tools.profile: "messaging"` of strenger), plus sandboxing waar mogelijk.

### Prompt-injectie vereist geen openbare DM's

Zelfs als **alleen jij** de bot berichten kunt sturen, kan prompt-injectie nog steeds gebeuren via
elke **onvertrouwde content** die de bot leest (resultaten van webzoekacties/fetches, browserpagina's,
e-mails, docs, bijlagen, geplakte logs/code). Met andere woorden: de afzender is niet
het enige aanvalsoppervlak; de **content zelf** kan vijandige instructies bevatten.

Wanneer tools zijn ingeschakeld, is het typische risico het exfiltreren van context of het triggeren
van toolaanroepen. Verklein de blast radius door:

- Een alleen-lezen of tool-uitgeschakelde **reader-agent** te gebruiken om onvertrouwde content samen te vatten,
  en daarna de samenvatting aan je hoofdagent door te geven.
- `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools, tenzij nodig.
- Voor OpenResponses-URL-invoer (`input_file` / `input_image`) strakke
  `gateway.http.endpoints.responses.files.urlAllowlist` en
  `gateway.http.endpoints.responses.images.urlAllowlist` in te stellen, en `maxUrlParts` laag te houden.
  Lege allowlists worden behandeld als unset; gebruik `files.allowUrl: false` / `images.allowUrl: false`
  als je URL-fetching volledig wilt uitschakelen.
- Voor OpenResponses-bestandsinvoer wordt gedecodeerde `input_file`-tekst nog steeds geïnjecteerd als
  **onvertrouwde externe content**. Vertrouw er niet op dat bestandstekst vertrouwd is alleen omdat
  de Gateway die lokaal heeft gedecodeerd. Het geïnjecteerde blok bevat nog steeds expliciete
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>`-grensmarkeringen plus `Source: External`-
  metadata, ook al laat dit pad de langere `SECURITY NOTICE:`-banner weg.
- Dezelfde marker-gebaseerde wrapping wordt toegepast wanneer media-understanding tekst extraheert
  uit bijgevoegde documenten voordat die tekst aan de mediaprompt wordt toegevoegd.
- Sandboxing en strikte tool-allowlists in te schakelen voor elke agent die onvertrouwde invoer aanraakt.
- Geheimen uit prompts te houden; geef ze in plaats daarvan door via env/config op de gateway-host.

### Zelfgehoste LLM-backends

OpenAI-compatibele zelfgehoste backends zoals vLLM, SGLang, TGI, LM Studio,
of aangepaste Hugging Face-tokenizerstacks kunnen verschillen van gehoste providers in hoe
speciale tokens van chat-templates worden afgehandeld. Als een backend letterlijke strings
zoals `<|im_start|>`, `<|start_header_id|>` of `<start_of_turn>` tokenizet als
structurele chat-template-tokens binnen gebruikerscontent, kan onvertrouwde tekst proberen
rolgrenzen op de tokenizer-laag te vervalsen.

OpenClaw verwijdert veelvoorkomende letterlijke special-token-waarden van modelfamilies uit verpakte
externe content voordat die naar het model wordt verzonden. Houd wrapping van externe content
ingeschakeld, en geef de voorkeur aan backend-instellingen die speciale tokens in door gebruikers
aangeleverde content splitsen of escapen wanneer beschikbaar. Gehoste providers zoals OpenAI
en Anthropic passen al hun eigen sanitization aan de request-zijde toe.

### Modelsterkte (security-opmerking)

Weerstand tegen prompt-injectie is **niet** uniform over modelklassen. Kleinere/goedkopere modellen zijn over het algemeen vatbaarder voor toolmisbruik en instructiekaping, vooral bij vijandige prompts.

<Warning>
Voor agents met tools of agents die onvertrouwde content lezen, is het prompt-injectierisico bij oudere/kleinere modellen vaak te hoog. Draai die workloads niet op zwakke modelklassen.
</Warning>

Aanbevelingen:

- **Gebruik het nieuwste generatie, beste klasse model** voor elke bot die tools kan draaien of bestanden/netwerken kan aanraken.
- **Gebruik geen oudere/zwakkere/kleinere klassen** voor agents met tools of onvertrouwde inboxen; het prompt-injectierisico is te hoog.
- Als je een kleiner model moet gebruiken, **verklein dan de blast radius** (alleen-lezen tools, sterke sandboxing, minimale bestandssysteemtoegang, strikte allowlists).
- Bij het draaien van kleine modellen: **schakel sandboxing in voor alle sessies** en **schakel web_search/web_fetch/browser uit** tenzij invoer strak wordt beheerst.
- Voor chat-only persoonlijke assistenten met vertrouwde invoer en geen tools zijn kleinere modellen meestal prima.

## Reasoning en uitgebreide uitvoer in groepen

`/reasoning`, `/verbose` en `/trace` kunnen interne reasoning, tool-
uitvoer of Plugin-diagnostiek blootleggen die
niet bedoeld was voor een openbaar kanaal. Behandel ze in groepsinstellingen als **alleen debug**
en houd ze uit, tenzij je ze expliciet nodig hebt.

Richtlijnen:

- Houd `/reasoning`, `/verbose` en `/trace` uitgeschakeld in openbare ruimtes.
- Als je ze inschakelt, doe dat dan alleen in vertrouwde DM's of strak gecontroleerde ruimtes.
- Onthoud: uitgebreide en trace-uitvoer kan toolargumenten, URL's, Plugin-diagnostiek en data bevatten die het model heeft gezien.

## Voorbeelden voor configuratiehardening

### Bestandsmachtigingen

Houd config + state privé op de gateway-host:

- `~/.openclaw/openclaw.json`: `600` (alleen gebruiker lezen/schrijven)
- `~/.openclaw`: `700` (alleen gebruiker)

`openclaw doctor` kan waarschuwen en aanbieden deze machtigingen strakker te zetten.

### Netwerkblootstelling (bind, poort, firewall)

De Gateway multiplexet **WebSocket + HTTP** op één poort:

- Standaard: `18789`
- Config/vlaggen/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Dit HTTP-oppervlak omvat de Control UI en de canvashost:

- Control UI (SPA-assets) (standaard basispad `/`)
- Canvashost: `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` (willekeurige HTML/JS; behandel als onvertrouwde content)

Als je canvascontent in een normale browser laadt, behandel die dan als elke andere onvertrouwde webpagina:

- Stel de canvashost niet bloot aan onvertrouwde netwerken/gebruikers.
- Laat canvascontent niet dezelfde origin delen als geprivilegieerde weboppervlakken, tenzij je de gevolgen volledig begrijpt.

Bind-modus bepaalt waar de Gateway luistert:

- `gateway.bind: "loopback"` (standaard): alleen lokale clients kunnen verbinden.
- Niet-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) vergroten het aanvalsoppervlak. Gebruik ze alleen met gateway-authenticatie (gedeeld token/wachtwoord of een correct geconfigureerde vertrouwde proxy) en een echte firewall.

Vuistregels:

- Geef de voorkeur aan Tailscale Serve boven LAN-binds (Serve houdt de Gateway op loopback, en Tailscale regelt toegang).
- Als je aan LAN moet binden, firewall de poort dan naar een strakke allowlist van bron-IP's; port-forward hem niet breed.
- Stel de Gateway nooit ongeauthenticeerd bloot op `0.0.0.0`.

### Docker-poortpublicatie met UFW

Als je OpenClaw met Docker op een VPS draait, onthoud dan dat gepubliceerde containerpoorten
(`-p HOST:CONTAINER` of Compose `ports:`) worden gerouteerd via Docker's forwarding-
chains, niet alleen via host-`INPUT`-regels.

Om Docker-verkeer in lijn te houden met je firewallbeleid, dwing je regels af in
`DOCKER-USER` (deze chain wordt geëvalueerd vóór Docker's eigen accept-regels).
Op veel moderne distro's gebruiken `iptables`/`ip6tables` de `iptables-nft`-frontend
en passen deze regels nog steeds toe op de nftables-backend.

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

IPv6 heeft aparte tabellen. Voeg een passend beleid toe in `/etc/ufw/after6.rules` als
Docker IPv6 is ingeschakeld.

Vermijd het hardcoderen van interfacenamen zoals `eth0` in docs-snippets. Interfacenamen
verschillen tussen VPS-images (`ens3`, `enp*`, enz.) en mismatches kunnen per ongeluk
je deny-regel overslaan.

Snelle validatie na herladen:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Verwachte externe poorten zouden alleen moeten zijn wat je opzettelijk blootstelt (voor de meeste
setups: SSH + je reverse-proxy-poorten).

### mDNS/Bonjour-discovery

Wanneer de gebundelde `bonjour`-Plugin is ingeschakeld, kondigt de Gateway zijn aanwezigheid aan via mDNS (`_openclaw-gw._tcp` op poort 5353) voor lokale apparaatdiscovery. In volledige modus omvat dit TXT-records die operationele details kunnen blootleggen:

- `cliPath`: volledig bestandssysteempad naar de CLI-binary (onthult gebruikersnaam en installatielocatie)
- `sshPort`: adverteert SSH-beschikbaarheid op de host
- `displayName`, `lanHost`: hostnaaminformatie

**Operationele beveiligingsoverweging:** Het uitzenden van infrastructuurdetails maakt verkenning eenvoudiger voor iedereen op het lokale netwerk. Zelfs "onschuldige" informatie zoals bestandssysteempaden en SSH-beschikbaarheid helpt aanvallers je omgeving in kaart te brengen.

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

Wanneer Bonjour is ingeschakeld in minimale modus, zendt de Gateway genoeg uit voor apparaatdetectie (`role`, `gatewayPort`, `transport`) maar laat `cliPath` en `sshPort` weg. Apps die CLI-padinformatie nodig hebben, kunnen die in plaats daarvan ophalen via de geauthenticeerde WebSocket-verbinding.

### Vergrendel de Gateway-WebSocket (lokale auth)

Gateway-auth is **standaard vereist**. Als er geen geldig gateway-authpad is geconfigureerd,
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
`gateway.remote.token` en `gateway.remote.password` zijn bronnen voor clientreferenties. Ze beschermen lokale WS-toegang **niet** op zichzelf. Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld. Als `gateway.auth.token` of `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt de resolutie gesloten (geen maskering door remote fallback).
</Note>
Optioneel: pin remote TLS met `gateway.remote.tlsFingerprint` wanneer je `wss://` gebruikt.
Plaintext `ws://` is standaard alleen loopback. Stel voor vertrouwde private-netwerkpaden
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als
noodmaatregel. Dit is bewust alleen een procesomgeving, geen
`openclaw.json`-configuratiesleutel.
Mobiel koppelen en handmatige of gescande Android-gatewayroutes zijn strenger:
cleartext wordt geaccepteerd voor loopback, maar private-LAN, link-local, `.local` en
hostnamen zonder punt moeten TLS gebruiken, tenzij je expliciet kiest voor het vertrouwde
private-netwerkpad met cleartext.

Lokale apparaatkoppeling:

- Apparaatkoppeling wordt automatisch goedgekeurd voor directe local loopback-verbindingen om
  clients op dezelfde host soepel te laten werken.
- OpenClaw heeft ook een smal backend/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief tailnet-binds op dezelfde host, worden behandeld als
  remote voor koppeling en hebben nog steeds goedkeuring nodig.
- Bewijs via doorgestuurde headers op een loopback-verzoek diskwalificeert loopback-
  lokaliteit. Automatische goedkeuring voor metadata-upgrades is smal afgebakend. Zie
  [Gateway-koppeling](/nl/gateway/pairing) voor beide regels.

Auth-modi:

- `gateway.auth.mode: "token"`: gedeeld bearer-token (aanbevolen voor de meeste setups).
- `gateway.auth.mode: "password"`: wachtwoord-auth (bij voorkeur instellen via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: vertrouw op een identiteitsbewuste reverse proxy om gebruikers te authenticeren en identiteit via headers door te geven (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).

Rotatiechecklist (token/wachtwoord):

1. Genereer/stel een nieuw geheim in (`gateway.auth.token` of `OPENCLAW_GATEWAY_PASSWORD`).
2. Herstart de Gateway (of herstart de macOS-app als die de Gateway superviseert).
3. Werk eventuele remote clients bij (`gateway.remote.token` / `.password` op machines die de Gateway aanroepen).
4. Controleer dat je niet langer kunt verbinden met de oude referenties.

### Tailscale Serve-identiteitsheaders

Wanneer `gateway.auth.allowTailscale` `true` is (standaard voor Serve), accepteert OpenClaw
Tailscale Serve-identiteitsheaders (`tailscale-user-login`) voor Control
UI/WebSocket-authenticatie. OpenClaw verifieert de identiteit door het
`x-forwarded-for`-adres op te lossen via de lokale Tailscale-daemon (`tailscale whois`)
en dit te matchen met de header. Dit wordt alleen geactiveerd voor verzoeken die loopback raken
en `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host` bevatten zoals
geïnjecteerd door Tailscale.
Voor dit async identiteitscontrolepad worden mislukte pogingen voor dezelfde `{scope, ip}`
geserialiseerd voordat de limiter de mislukking registreert. Gelijktijdige slechte retries
van één Serve-client kunnen daarom de tweede poging onmiddellijk buitensluiten
in plaats van erdoorheen te racen als twee gewone mismatches.
HTTP-API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** auth via Tailscale-identiteitsheaders. Ze volgen nog steeds de
geconfigureerde HTTP-authmodus van de gateway.

Belangrijke grensnotitie:

- Gateway HTTP bearer-auth is in feite alles-of-niets operatortoegang.
- Behandel referenties die `/v1/chat/completions`, `/v1/responses` of `/api/channels/*` kunnen aanroepen als operatorgeheimen met volledige toegang voor die gateway.
- Op het OpenAI-compatibele HTTP-oppervlak herstelt bearer-auth met gedeeld geheim de volledige standaard operatorscopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) en eigenaarsemantiek voor agentbeurten; smallere `x-openclaw-scopes`-waarden beperken dat pad met gedeeld geheim niet.
- Semantiek per requestscope op HTTP is alleen van toepassing wanneer het verzoek afkomstig is uit een identiteitsdragende modus, zoals trusted proxy-auth of `gateway.auth.mode="none"` op een private ingress.
- In die identiteitsdragende modi valt het weglaten van `x-openclaw-scopes` terug op de normale standaardset operatorscopes; stuur de header expliciet wanneer je een smallere scopeset wilt.
- `/tools/invoke` volgt dezelfde regel voor gedeeld geheim: token/wachtwoord bearer-auth wordt daar ook behandeld als volledige operatortoegang, terwijl identiteitsdragende modi nog steeds gedeclareerde scopes respecteren.
- Deel deze referenties niet met niet-vertrouwde aanroepers; geef de voorkeur aan afzonderlijke gateways per vertrouwensgrens.

**Vertrouwensaannname:** tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is.
Beschouw dit niet als bescherming tegen vijandige processen op dezelfde host. Als niet-vertrouwde
lokale code op de gatewayhost kan draaien, schakel `gateway.auth.allowTailscale` uit
en vereis expliciete auth met gedeeld geheim via `gateway.auth.mode: "token"` of
`"password"`.

**Beveiligingsregel:** stuur deze headers niet door vanuit je eigen reverse proxy. Als
je TLS beëindigt of vóór de gateway proxyt, schakel dan
`gateway.auth.allowTailscale` uit en gebruik in plaats daarvan auth met gedeeld geheim (`gateway.auth.mode:
"token"` of `"password"`) of [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth).

Vertrouwde proxy's:

- Als je TLS vóór de Gateway beëindigt, stel `gateway.trustedProxies` in op de IP's van je proxy.
- OpenClaw vertrouwt `x-forwarded-for` (of `x-real-ip`) vanaf die IP's om het client-IP te bepalen voor lokale koppelingscontroles en HTTP-auth/lokale controles.
- Zorg dat je proxy `x-forwarded-for` **overschrijft** en directe toegang tot de Gateway-poort blokkeert.

Zie [Tailscale](/nl/gateway/tailscale) en [Web-overzicht](/nl/web).

### Browserbesturing via Node-host (aanbevolen)

Als je Gateway remote is maar de browser op een andere machine draait, voer dan een **Node-host**
uit op de browsermachine en laat de Gateway browseracties proxyen (zie [Browsertool](/nl/tools/browser)).
Behandel Node-koppeling als admintoegang.

Aanbevolen patroon:

- Houd de Gateway en Node-host op dezelfde tailnet (Tailscale).
- Koppel de Node bewust; schakel browserproxyrouting uit als je die niet nodig hebt.

Vermijd:

- Relay-/controlepoorten blootstellen via LAN of het openbare internet.
- Tailscale Funnel voor browsercontrole-eindpunten (openbare blootstelling).

### Geheimen op schijf

Ga ervan uit dat alles onder `~/.openclaw/` (of `$OPENCLAW_STATE_DIR/`) geheimen of privégegevens kan bevatten:

- `openclaw.json`: configuratie kan tokens bevatten (gateway, remote gateway), providerinstellingen en allowlists.
- `credentials/**`: kanaalreferenties (voorbeeld: WhatsApp-referenties), koppelingsallowlists, legacy OAuth-imports.
- `agents/<agentId>/agent/auth-profiles.json`: API-sleutels, tokenprofielen, OAuth-tokens en optioneel `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex-appserveraccount, configuratie, skills, plugins, native threadstatus en diagnostiek.
- `secrets.json` (optioneel): bestandsgebaseerde geheime payload gebruikt door `file` SecretRef-providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: legacy compatibiliteitsbestand. Statische `api_key`-vermeldingen worden opgeschoond wanneer ze worden ontdekt.
- `agents/<agentId>/sessions/**`: sessietranscripten (`*.jsonl`) + routeringsmetadata (`sessions.json`) die privéberichten en tooluitvoer kunnen bevatten.
- gebundelde Plugin-pakketten: geïnstalleerde plugins (plus hun `node_modules/`).
- `sandboxes/**`: tool-sandboxwerkruimten; kunnen kopieën ophopen van bestanden die je binnen de sandbox leest/schrijft.

Hardeningtips:

- Houd machtigingen strikt (`700` op mappen, `600` op bestanden).
- Gebruik volledige schijfversleuteling op de gatewayhost.
- Geef de voorkeur aan een toegewijd OS-gebruikersaccount voor de Gateway als de host wordt gedeeld.

### Workspace-`.env`-bestanden

OpenClaw laadt workspace-lokale `.env`-bestanden voor agents en tools, maar laat die bestanden nooit stilzwijgend gatewayruntimecontroles overschrijven.

- Elke sleutel die begint met `OPENCLAW_*` wordt geblokkeerd vanuit niet-vertrouwde workspace-`.env`-bestanden.
- Kanaaleindpuntinstellingen voor Matrix, Mattermost, IRC en Synology Chat worden ook geblokkeerd voor workspace-`.env`-overschrijvingen, zodat gekloonde workspaces gebundeld connectorverkeer niet kunnen omleiden via lokale eindpuntconfiguratie. Eindpunt-env-sleutels (zoals `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) moeten afkomstig zijn uit de procesomgeving van de gateway of `env.shellEnv`, niet uit een door de workspace geladen `.env`.
- De blokkade is fail-closed: een nieuwe runtime-controlvariabele die in een toekomstige release wordt toegevoegd, kan niet worden geërfd uit een ingecheckte of door een aanvaller aangeleverde `.env`; de sleutel wordt genegeerd en de gateway behoudt zijn eigen waarde.
- Vertrouwde proces-/OS-omgevingsvariabelen (de eigen shell van de gateway, launchd/systemd-unit, appbundle) blijven van toepassing - dit beperkt alleen het laden van `.env`-bestanden.

Waarom: workspace-`.env`-bestanden staan vaak naast agentcode, worden per ongeluk gecommit of worden door tools geschreven. Het blokkeren van de volledige `OPENCLAW_*`-prefix betekent dat het later toevoegen van een nieuwe `OPENCLAW_*`-flag nooit kan terugvallen in stille overerving vanuit workspacestatus.

### Logs en transcripten (redactie en retentie)

Logs en transcripten kunnen gevoelige informatie lekken, zelfs wanneer toegangscontroles correct zijn:

- Gateway-logs kunnen toolsamenvattingen, fouten en URL's bevatten.
- Sessietranscripten kunnen geplakte geheimen, bestandsinhoud, commandouitvoer en links bevatten.

Aanbevelingen:

- Houd redactie van logs en transcripten ingeschakeld (`logging.redactSensitive: "tools"`; standaard).
- Voeg aangepaste patronen voor je omgeving toe via `logging.redactPatterns` (tokens, hostnamen, interne URL's).
- Geef bij het delen van diagnostiek de voorkeur aan `openclaw status --all` (plakbaar, geheimen geredigeerd) boven ruwe logs.
- Verwijder oude sessietranscripten en logbestanden als je geen lange retentie nodig hebt.

Details: [Logging](/nl/gateway/logging)

### DM's: standaard koppeling

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

Reageer in groepschats alleen wanneer je expliciet wordt genoemd.

### Aparte nummers (WhatsApp, Signal, Telegram)

Voor kanalen op basis van telefoonnummers kun je overwegen je AI op een ander telefoonnummer te laten draaien dan je persoonlijke nummer:

- Persoonlijk nummer: je gesprekken blijven privé
- Botnummer: AI handelt deze af, met passende grenzen

### Alleen-lezenmodus (via sandbox en tools)

Je kunt een alleen-lezenprofiel maken door het volgende te combineren:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (of `"none"` voor geen toegang tot de werkruimte)
- allow-/deny-lijsten voor tools die `write`, `edit`, `apply_patch`, `exec`, `process`, enz. blokkeren.

Aanvullende opties voor hardening:

- `tools.exec.applyPatch.workspaceOnly: true` (standaard): zorgt ervoor dat `apply_patch` niet buiten de werkruimtemap kan schrijven/verwijderen, zelfs wanneer sandboxing is uitgeschakeld. Zet dit alleen op `false` als je bewust wilt dat `apply_patch` bestanden buiten de werkruimte aanraakt.
- `tools.fs.workspaceOnly: true` (optioneel): beperkt paden voor `read`/`write`/`edit`/`apply_patch` en automatisch laden van afbeeldingen in native prompts tot de werkruimtemap (handig als je nu absolute paden toestaat en één enkele vangrail wilt).
- Houd bestandssysteemroots beperkt: vermijd brede roots zoals je thuismap voor agentwerkruimten/sandboxwerkruimten. Brede roots kunnen gevoelige lokale bestanden (bijvoorbeeld status/config onder `~/.openclaw`) blootstellen aan bestandssysteemtools.

### Veilige basisconfiguratie (kopiëren/plakken)

Eén configuratie met “veilige standaardinstellingen” die de Gateway privé houdt, DM-koppeling vereist en altijd-aan groepsbots vermijdt:

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

Als je tooluitvoering ook “veiliger standaard” wilt maken, voeg dan een sandbox toe en weiger gevaarlijke tools voor elke niet-eigenaaragent (voorbeeld hieronder onder “Toegangsprofielen per agent”).

Ingebouwde basisconfiguratie voor chatgestuurde agentbeurten: afzenders die geen eigenaar zijn, kunnen de tools `cron` of `gateway` niet gebruiken.

## Sandboxing (aanbevolen)

Specifiek document: [Sandboxing](/nl/gateway/sandboxing)

Twee aanvullende benaderingen:

- **Draai de volledige Gateway in Docker** (containergrens): [Docker](/nl/install/docker)
- **Toolsandbox** (`agents.defaults.sandbox`, hostgateway + tools geïsoleerd in sandbox; Docker is de standaardbackend): [Sandboxing](/nl/gateway/sandboxing)

<Note>
Om toegang tussen agents te voorkomen, houd je `agents.defaults.sandbox.scope` op `"agent"` (standaard) of `"session"` voor striktere isolatie per sessie. `scope: "shared"` gebruikt één container of werkruimte.
</Note>

Overweeg ook agentwerkruimtetoegang binnen de sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (standaard) houdt de agentwerkruimte buiten bereik; tools draaien tegen een sandboxwerkruimte onder `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` mount de agentwerkruimte alleen-lezen op `/agent` (schakelt `write`/`edit`/`apply_patch` uit)
- `agents.defaults.sandbox.workspaceAccess: "rw"` mount de agentwerkruimte lezen/schrijven op `/workspace`
- Extra `sandbox.docker.binds` worden gevalideerd tegen genormaliseerde en gecanonicaliseerde bronpaden. Trucs met bovenliggende symlinks en canonieke aliassen voor de thuismap falen nog steeds gesloten als ze oplossen naar geblokkeerde roots zoals `/etc`, `/var/run` of credentialmappen onder de OS-thuismap.

<Warning>
`tools.elevated` is de globale basisontsnappingsroute die exec buiten de sandbox draait. De effectieve host is standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`. Houd `tools.elevated.allowFrom` strikt en schakel dit niet in voor onbekenden. Je kunt elevated verder per agent beperken via `agents.list[].tools.elevated`. Zie [Elevated mode](/nl/tools/elevated).
</Warning>

### Vangrail voor sub-agent-delegatie

Als je sessietools toestaat, behandel gedelegeerde sub-agent-runs dan als een extra grensbeslissing:

- Weiger `sessions_spawn` tenzij de agent delegatie echt nodig heeft.
- Houd `agents.defaults.subagents.allowAgents` en eventuele per-agent-overschrijvingen van `agents.list[].subagents.allowAgents` beperkt tot bekende veilige doelagents.
- Roep voor elke workflow die gesandboxed moet blijven `sessions_spawn` aan met `sandbox: "require"` (standaard is `inherit`).
- `sandbox: "require"` faalt snel wanneer de runtime van het doelkind niet gesandboxed is.

## Risico’s van browserbesturing

Het inschakelen van browserbesturing geeft het model de mogelijkheid een echte browser aan te sturen.
Als dat browserprofiel al ingelogde sessies bevat, kan het model
toegang krijgen tot die accounts en gegevens. Behandel browserprofielen als **gevoelige status**:

- Gebruik bij voorkeur een speciaal profiel voor de agent (het standaardprofiel `openclaw`).
- Vermijd het aanwijzen van je persoonlijke dagelijkse profiel voor de agent.
- Houd hostbrowserbesturing uitgeschakeld voor gesandboxte agents, tenzij je ze vertrouwt.
- De zelfstandige local loopback API voor browserbesturing respecteert alleen authenticatie met gedeeld geheim
  (gateway-token bearer-authenticatie of gatewaywachtwoord). Deze gebruikt geen
  trusted-proxy- of Tailscale Serve-identiteitsheaders.
- Behandel browserdownloads als niet-vertrouwde invoer; gebruik bij voorkeur een geïsoleerde downloadmap.
- Schakel browsersynchronisatie/wachtwoordbeheerders indien mogelijk uit in het agentprofiel (verkleint de blast radius).
- Ga er bij externe gateways van uit dat “browserbesturing” gelijkstaat aan “operatortoegang” tot alles wat dat profiel kan bereiken.
- Houd de Gateway- en node-hosts alleen toegankelijk via tailnet; voorkom blootstelling van browserbesturingspoorten aan LAN of openbaar internet.
- Schakel browserproxyrouting uit wanneer je die niet nodig hebt (`gateway.nodes.browser.mode="off"`).
- De modus voor bestaande sessies van Chrome MCP is **niet** “veiliger”; deze kan als jou handelen in alles wat dat host-Chrome-profiel kan bereiken.

### Browser-SSRF-beleid (standaard strikt)

Het browsernavigatiebeleid van OpenClaw is standaard strikt: privé/interne bestemmingen blijven geblokkeerd tenzij je expliciet opt-in gebruikt.

- Standaard: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is niet ingesteld, dus browsernavigatie blijft privé/interne/special-use bestemmingen blokkeren.
- Legacy-alias: `browser.ssrfPolicy.allowPrivateNetwork` wordt nog steeds geaccepteerd voor compatibiliteit.
- Opt-inmodus: stel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in om privé/interne/special-use bestemmingen toe te staan.
- Gebruik in strikte modus `hostnameAllowlist` (patronen zoals `*.example.com`) en `allowedHostnames` (exacte hostuitzonderingen, inclusief geblokkeerde namen zoals `localhost`) voor expliciete uitzonderingen.
- Navigatie wordt gecontroleerd vóór het verzoek en met beste inspanning opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL na navigatie om redirects als pivot te beperken.

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

Met multi-agentroutering kan elke agent een eigen sandbox- en toolbeleid hebben:
gebruik dit om per agent **volledige toegang**, **alleen-lezen** of **geen toegang** te geven.
Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor volledige details
en prioriteitsregels.

Veelvoorkomende usecases:

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

### Voorbeeld: alleen-lezen tools + alleen-lezen werkruimte

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

### Voorbeeld: geen bestandssysteem-/shelltoegang (providermessaging toegestaan)

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

1. **Stop het:** stop de macOS-app (als die de Gateway superviseert) of beëindig je `openclaw gateway`-proces.
2. **Sluit blootstelling:** stel `gateway.bind: "loopback"` in (of schakel Tailscale Funnel/Serve uit) totdat je begrijpt wat er is gebeurd.
3. **Bevries toegang:** zet risicovolle DM’s/groepen op `dmPolicy: "disabled"` / vereis vermeldingen, en verwijder `"*"` allow-all-vermeldingen als je die had.

### Roteren (ga uit van compromittering als geheimen zijn gelekt)

1. Roteer Gateway-authenticatie (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) en herstart.
2. Roteer externe clientgeheimen (`gateway.remote.token` / `.password`) op elke machine die de Gateway kan aanroepen.
3. Roteer provider-/API-credentials (WhatsApp-credentials, Slack-/Discord-tokens, model-/API-sleutels in `auth-profiles.json`, en versleutelde geheime payloadwaarden wanneer gebruikt).

### Auditen

1. Controleer Gateway-logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (of `logging.file`).
2. Bekijk de relevante transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Bekijk recente configuratiewijzigingen (alles wat toegang kan hebben verbreed: `gateway.bind`, `gateway.auth`, DM-/groepsbeleid, `tools.elevated`, pluginwijzigingen).
4. Voer `openclaw security audit --deep` opnieuw uit en bevestig dat kritieke bevindingen zijn opgelost.

### Verzamelen voor een rapport

- Tijdstempel, OS van de gatewayhost + OpenClaw-versie
- De sessietranscript(s) + een korte logtail (na redactie)
- Wat de aanvaller stuurde + wat de agent deed
- Of de Gateway verder dan loopback was blootgesteld (LAN/Tailscale Funnel/Serve)

## Secretscanning

CI voert de pre-commit-hook `detect-private-key` uit over de repository. Als deze
faalt, verwijder of roteer dan het gecommitte keymateriaal en reproduceer lokaal:

```bash
pre-commit run --all-files detect-private-key
```

## Beveiligingsproblemen melden

Een kwetsbaarheid gevonden in OpenClaw? Meld deze dan verantwoordelijk:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Plaats niets openbaar totdat het is opgelost
3. We vermelden je als ontdekker (tenzij je anonimiteit verkiest)
