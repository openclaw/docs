---
read_when:
    - Functies toevoegen die toegang of automatisering uitbreiden
summary: Beveiligingsoverwegingen en dreigingsmodel voor het draaien van een AI-Gateway met shelltoegang
title: Beveiliging
x-i18n:
    generated_at: "2026-05-07T01:52:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 076b3254955a7bec22788b6f11fc69dc17f6fa7f5bcf48def27deaf567526a55
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Vertrouwensmodel voor persoonlijke assistenten.** Deze richtlijn gaat uit van één vertrouwde
  operatorgrens per Gateway (single-user, persoonlijke-assistentmodel).
  OpenClaw is **geen** vijandige multi-tenant-beveiligingsgrens voor meerdere
  vijandige gebruikers die één agent of Gateway delen. Als je werking met gemengd vertrouwen of
  vijandige gebruikers nodig hebt, splits dan vertrouwensgrenzen (afzonderlijke Gateway +
  referenties, idealiter afzonderlijke OS-gebruikers of hosts).
</Warning>

## Eerst de scope: beveiligingsmodel voor persoonlijke assistenten

OpenClaw-beveiligingsrichtlijnen gaan uit van een **persoonlijke assistent**-implementatie: één vertrouwde operatorgrens, mogelijk met veel agents.

- Ondersteunde beveiligingshouding: één gebruiker/vertrouwensgrens per Gateway (bij voorkeur één OS-gebruiker/host/VPS per grens).
- Geen ondersteunde beveiligingsgrens: één gedeelde Gateway/agent die wordt gebruikt door wederzijds onvertrouwde of vijandige gebruikers.
- Als isolatie voor vijandige gebruikers vereist is, splits dan per vertrouwensgrens (afzonderlijke Gateway + referenties, en idealiter afzonderlijke OS-gebruikers/hosts).
- Als meerdere onvertrouwde gebruikers één agent met tools kunnen berichten, behandel hen dan alsof ze dezelfde gedelegeerde toolbevoegdheid voor die agent delen.

Deze pagina legt hardening **binnen dat model** uit. Ze claimt geen vijandige multi-tenant-isolatie op één gedeelde Gateway.

## Snelle controle: `openclaw security audit`

Zie ook: [Formele verificatie (beveiligingsmodellen)](/nl/security/formal-verification)

Voer dit regelmatig uit (vooral na het wijzigen van configuratie of het blootstellen van netwerkoppervlakken):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` blijft bewust smal: het zet veelvoorkomende open groepsbeleidsregels
om naar allowlists, herstelt `logging.redactSensitive: "tools"`, verscherpt
machtigingen voor state/config/include-bestanden, en gebruikt Windows ACL-resets in plaats van
POSIX `chmod` wanneer het op Windows draait.

Het markeert veelvoorkomende voetangels (blootstelling van Gateway-authenticatie, blootstelling van browserbesturing, verhoogde allowlists, bestandssysteemmachtigingen, permissieve exec-goedkeuringen en open-channel-toolblootstelling).

OpenClaw is zowel een product als een experiment: je verbindt frontier-modelgedrag met echte berichtoppervlakken en echte tools. **Er bestaat geen "perfect beveiligde" opstelling.** Het doel is om doelbewust te zijn over:

- wie met je bot kan praten
- waar de bot mag handelen
- wat de bot mag aanraken

Begin met de kleinste toegang die nog werkt, en breid die vervolgens uit naarmate je vertrouwen wint.

### Implementatie en hostvertrouwen

OpenClaw gaat ervan uit dat de host- en configuratiegrens vertrouwd zijn:

- Als iemand Gateway-hoststate/config kan wijzigen (`~/.openclaw`, inclusief `openclaw.json`), behandel die persoon dan als een vertrouwde operator.
- Eén Gateway draaien voor meerdere wederzijds onvertrouwde/vijandige operators is **geen aanbevolen opstelling**.
- Voor teams met gemengd vertrouwen: splits vertrouwensgrenzen met afzonderlijke gateways (of minimaal afzonderlijke OS-gebruikers/hosts).
- Aanbevolen standaard: één gebruiker per machine/host (of VPS), één Gateway voor die gebruiker, en één of meer agents in die Gateway.
- Binnen één Gateway-instantie is geauthenticeerde operatortoegang een vertrouwde control-plane-rol, geen tenantrol per gebruiker.
- Sessie-identificatoren (`sessionKey`, sessie-ID's, labels) zijn routeringsselectors, geen autorisatietokens.
- Als meerdere mensen één agent met tools kunnen berichten, kan ieder van hen dezelfde machtigingenset aansturen. Sessie-/geheugenisolatie per gebruiker helpt de privacy, maar zet een gedeelde agent niet om in hostautorisatie per gebruiker.

### Veilige bestandsbewerkingen

OpenClaw gebruikt `@openclaw/fs-safe` voor root-gebonden bestandstoegang, atomische schrijfbewerkingen, archiefextractie, tijdelijke werkruimten en helpers voor geheime bestanden. OpenClaw zet de optionele POSIX Python-helper van fs-safe standaard **uit**; stel `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` of `require` alleen in wanneer je de extra fd-relatieve mutation hardening wilt en een Python-runtime kunt ondersteunen.

Details: [Veilige bestandsbewerkingen](/nl/gateway/security/secure-file-operations).

### Gedeelde Slack-werkruimte: reëel risico

Als "iedereen in Slack de bot kan berichten," is het kernrisico gedelegeerde toolbevoegdheid:

- elke toegestane afzender kan toolaanroepen (`exec`, browser, netwerk-/bestandstools) induceren binnen het beleid van de agent;
- prompt-/contentinjectie van één afzender kan acties veroorzaken die gedeelde state, apparaten of uitvoer beïnvloeden;
- als één gedeelde agent gevoelige referenties/bestanden heeft, kan elke toegestane afzender mogelijk exfiltratie via toolgebruik aansturen.

Gebruik afzonderlijke agents/gateways met minimale tools voor teamworkflows; houd agents met persoonlijke gegevens privé.

### Bedrijfsgedeelde agent: acceptabel patroon

Dit is acceptabel wanneer iedereen die die agent gebruikt binnen dezelfde vertrouwensgrens valt (bijvoorbeeld één bedrijfsteam) en de agent strikt zakelijk is afgebakend.

- draai hem op een toegewezen machine/VM/container;
- gebruik een toegewezen OS-gebruiker + toegewezen browser/profiel/accounts voor die runtime;
- meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke wachtwoordmanager-/browserprofielen.

Als je persoonlijke en bedrijfsidentiteiten op dezelfde runtime mengt, laat je de scheiding vervallen en vergroot je het risico op blootstelling van persoonlijke gegevens.

## Gateway- en Node-vertrouwensconcept

Behandel Gateway en Node als één operatorvertrouwensdomein, met verschillende rollen:

- **Gateway** is het control plane en beleidsoppervlak (`gateway.auth`, toolbeleid, routering).
- **Node** is het externe uitvoeringsoppervlak dat aan die Gateway is gekoppeld (commando's, apparaatacties, host-lokale mogelijkheden).
- Een aanroeper die bij de Gateway is geauthenticeerd, wordt vertrouwd binnen Gateway-scope. Na pairing zijn Node-acties vertrouwde operatoracties op die Node.
- Operatorscopeniveaus en controles op goedkeuringstijd worden samengevat in
  [Operatorscopen](/nl/gateway/operator-scopes).
- Directe local loopback-backendclients die zijn geauthenticeerd met het gedeelde Gateway-
  token/wachtwoord kunnen interne control-plane-RPC's doen zonder een gebruikers-
  apparaatidentiteit te presenteren. Dit is geen bypass voor externe of browserpairing: netwerk-
  clients, Node-clients, device-token-clients en expliciete apparaatidentiteiten
  blijven via pairing en scope-upgradehandhaving lopen.
- `sessionKey` is routerings-/contextselectie, geen auth per gebruiker.
- Exec-goedkeuringen (allowlist + vragen) zijn vangrails voor operatorintentie, geen vijandige multi-tenant-isolatie.
- De productstandaard van OpenClaw voor vertrouwde single-operatoropstellingen is dat host-exec op `gateway`/`node` is toegestaan zonder goedkeuringsprompts (`security="full"`, `ask="off"` tenzij je dit aanscherpt). Die standaard is bewuste UX, op zichzelf geen kwetsbaarheid.
- Exec-goedkeuringen binden exacte aanvraagcontext en best-effort directe lokale bestandsoperanden; ze modelleren niet semantisch elk runtime-/interpreter-loaderpad. Gebruik sandboxing en hostisolatie voor sterke grenzen.

Als je vijandige-gebruikersisolatie nodig hebt, splits vertrouwensgrenzen per OS-gebruiker/host en draai afzonderlijke gateways.

## Matrix voor vertrouwensgrenzen

Gebruik dit als snel model bij het triëren van risico:

| Grens of controle                                          | Wat het betekent                                  | Veelvoorkomende misinterpretatie                                              |
| ---------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth)  | Authenticeert aanroepers bij Gateway-API's        | "Vereist per-message signatures op elk frame om veilig te zijn"               |
| `sessionKey`                                               | Routeringssleutel voor context-/sessieselectie    | "Sessiesleutel is een gebruikersauthgrens"                                    |
| Prompt-/contentvangrails                                   | Verminderen risico op modelmisbruik               | "Promptinjectie alleen bewijst auth-bypass"                                   |
| `canvas.eval` / browser evaluate                           | Bewuste operatormogelijkheid wanneer ingeschakeld | "Elke JS eval-primitive is automatisch een vuln in dit vertrouwensmodel"      |
| Lokale TUI `!`-shell                                       | Expliciet door operator getriggerde lokale uitvoer | "Lokaal shell-gemakscommando is externe injectie"                             |
| Node-pairing en Node-commando's                            | Remote uitvoering op operatorniveau op gekoppelde apparaten | "Remote apparaatbesturing moet standaard als onvertrouwde gebruikerstoegang worden behandeld" |
| `gateway.nodes.pairing.autoApproveCidrs`                   | Opt-in vertrouwd-netwerkbeleid voor Node-inschrijving | "Een standaard uitgeschakelde allowlist is een automatische pairingkwetsbaarheid" |

## Grenzen voor multi-agent en sub-agent

OpenClaw kan veel agents binnen één Gateway draaien, maar die agents zitten nog steeds
binnen dezelfde vertrouwde-operatorgrens, tenzij je de implementatie splitst per
Gateway, OS-gebruiker, host of sandbox. Behandel sub-agentdelegatie als een beslissing over
toolbeleid en sandboxing, niet als een vijandige multi-tenant-autorisatielaag.

Verwacht gedrag binnen één vertrouwde Gateway:

- Een geauthenticeerde operator kan werk routeren naar sessies en agents die ze volgens
  configuratie mogen gebruiken.
- `sessionKey`, sessie-ID, labels en sub-agent-sessiesleutels selecteren
  gesprekscontext. Ze zijn geen bearer credentials en geen autorisatiegrenzen
  per gebruiker.
- Sub-agents hebben standaard afzonderlijke sessies. Native `sessions_spawn` gebruikt
  geïsoleerde context tenzij de aanroeper expliciet vraagt om `context: "fork"`;
  thread-gebonden vervolgsessies gebruiken geforkte context omdat ze de
  gespreksthread voortzetten.
- Een geforkte sub-agent kan de transcriptcontext zien die bewust aan hem is gegeven.
  Dat is verwacht. Het wordt alleen een beveiligingsprobleem als hij context ontvangt die
  volgens beleid niet mocht worden ontvangen.
- Tooltoegang komt uit het effectieve profiel, channel-/group-/providerbeleid,
  sandboxbeleid, per-agentbeleid en de restrictielaag voor sub-agents. Een breed
  toolprofiel geeft bewust brede mogelijkheden.
- Auth-profielen voor sub-agents worden opgelost op basis van target agent id. Main-agent-auth kan
  als fallback beschikbaar zijn tenzij je referenties/implementaties splitst; vertrouw
  niet alleen op sub-agentidentiteit voor sterke geheimisolatie.

Wat telt als een echte grensbypass:

- `sessions_spawn` werkt ook al heeft het effectieve toolbeleid dit geweigerd.
- Een child draait zonder sandbox terwijl de requester gesandboxt is of de aanroep
  `sandbox: "require"` vereiste.
- Een child ontvangt sessietools, system tools of toegang tot een target-agent die de
  opgeloste configuratie heeft geweigerd.
- Een leaf-sub-agent bestuurt, beëindigt, stuurt of bericht sibling-sessies die hij
  niet heeft gespawned.
- Een sub-agent ziet transcript, geheugen, referenties of bestanden die waren uitgesloten
  door een expliciet beleid of sandboxgrens.
- Een Gateway-/API-aanroeper zonder de vereiste Gateway-auth of trusted-proxy-/device-
  identiteit kan agent- of tooluitvoering triggeren.

Hardening-knoppen:

- Houd `sessions_spawn` geweigerd tenzij een agent delegatie echt nodig heeft.
- Geef de voorkeur aan `tools.profile: "messaging"` of een ander smal profiel voor agents die
  met externe channels praten.
- Stel `agents.list[].subagents.requireAgentId: true` in voor agents die werk mogen spawnen,
  zodat targetselectie expliciet is.
- Houd `agents.defaults.subagents.allowAgents` en
  `agents.list[].subagents.allowAgents` smal; vermijd `["*"]` voor agents die
  onvertrouwde input ontvangen.
- Gebruik `tools.subagents.tools.allow` om sub-agenttools allow-only te maken in plaats
  van een breed parent-profiel te erven.
- Voor workflows die gesandboxt moeten blijven, gebruik `sessions_spawn` met
  `sandbox: "require"`.
- Gebruik afzonderlijke gateways, OS-gebruikers, hosts, browserprofielen en referenties wanneer
  agents of gebruikers wederzijds onvertrouwd zijn.

## Geen kwetsbaarheden by design

<Accordion title="Veelvoorkomende bevindingen die buiten scope vallen">

Deze patronen worden vaak gerapporteerd en meestal gesloten zonder actie, tenzij
een echte grensbypass wordt aangetoond:

- Alleen prompt-injectieketens zonder policy-, auth- of sandbox-bypass.
- Claims die uitgaan van vijandige multi-tenant werking op een gedeelde host of
  config.
- Claims die normale operator-toegang via read-paths (bijvoorbeeld
  `sessions.list` / `sessions.preview` / `chat.history`) classificeren als IDOR in een
  gedeelde-gatewayopstelling.
- Claims die verwachte `context: "fork"`-transcriptovererving behandelen als een
  boundary-bypass wanneer de aanvrager die context expliciet heeft geforkt.
- Claims die brede subagent-tooltoegang behandelen als een bypass wanneer het geconfigureerde
  profiel of de allowlist die tools bewust heeft toegekend.
- Bevindingen voor alleen-localhost-deployments (bijvoorbeeld HSTS op een gateway die alleen via local loopback bereikbaar is).
- Bevindingen over Discord inbound webhook-handtekeningen voor inbound-paden die niet
  bestaan in deze repo.
- Rapporten die node-koppelingsmetadata behandelen als een verborgen tweede goedkeuringslaag
  per opdracht voor `system.run`, terwijl de echte uitvoeringsgrens nog steeds
  het globale node-commandobeleid van de gateway is plus de eigen exec-goedkeuringen
  van de node.
- Rapporten die geconfigureerde `gateway.nodes.pairing.autoApproveCidrs` op zichzelf als een
  kwetsbaarheid behandelen. Deze instelling is standaard uitgeschakeld, vereist
  expliciete CIDR/IP-vermeldingen, geldt alleen voor eerste `role: node`-koppeling met
  geen aangevraagde scopes, en keurt operator/browser/Control UI,
  WebChat, rolupgrades, scope-upgrades, metadatawijzigingen, public-keywijzigingen
  of same-host local loopback trusted-proxy-headerpaden niet automatisch goed tenzij local loopback trusted-proxy-auth expliciet is ingeschakeld.
- Bevindingen over "ontbrekende autorisatie per gebruiker" die `sessionKey` behandelen als een
  auth-token.

</Accordion>

## Geharde baseline in 60 seconden

Gebruik deze baseline eerst en schakel daarna selectief tools opnieuw in per vertrouwde agent:

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
- Dit hardt coöperatieve/gedeelde inboxen, maar is niet ontworpen als vijandige co-tenant-isolatie wanneer gebruikers host-/config-schrijftoegang delen.

## Contextzichtbaarheidsmodel

OpenClaw scheidt twee concepten:

- **Triggerautorisatie**: wie de agent kan triggeren (`dmPolicy`, `groupPolicy`, allowlists, vermeldingspoorten).
- **Contextzichtbaarheid**: welke aanvullende context in modelinvoer wordt geïnjecteerd (antwoordtekst, geciteerde tekst, threadgeschiedenis, doorgestuurde metadata).

Allowlists begrenzen triggers en opdracht-autorisatie. De instelling `contextVisibility` bepaalt hoe aanvullende context (geciteerde antwoorden, thread-roots, opgehaalde geschiedenis) wordt gefilterd:

- `contextVisibility: "all"` (standaard) behoudt aanvullende context zoals ontvangen.
- `contextVisibility: "allowlist"` filtert aanvullende context tot afzenders die door de actieve allowlist-controles zijn toegestaan.
- `contextVisibility: "allowlist_quote"` gedraagt zich als `allowlist`, maar behoudt nog steeds één expliciet geciteerd antwoord.

Stel `contextVisibility` per kanaal of per ruimte/gesprek in. Zie [Groepschats](/nl/channels/groups#context-visibility-and-allowlists) voor configuratiedetails.

Richtlijnen voor advisory-triage:

- Claims die alleen aantonen dat "model geciteerde of historische tekst van niet-geallowliste afzenders kan zien" zijn hardeningsbevindingen die met `contextVisibility` kunnen worden opgelost, geen auth- of sandbox-boundary-bypasses op zichzelf.
- Om security-impact te hebben, moeten rapporten nog steeds een aangetoonde trust-boundary-bypass tonen (auth, policy, sandbox, goedkeuring of een andere gedocumenteerde boundary).

## Wat de audit controleert (hoog niveau)

- **Inbound-toegang** (DM-policies, groepspolicies, allowlists): kunnen onbekenden de bot triggeren?
- **Tool-blast-radius** (elevated tools + open ruimtes): kan prompt-injectie veranderen in shell-/bestands-/netwerkacties?
- **Exec-goedkeuringsdrift** (`security=full`, `autoAllowSkills`, interpreter-allowlists zonder `strictInlineEval`): doen host-exec-guardrails nog steeds wat je denkt dat ze doen?
  - `security="full"` is een brede posture-waarschuwing, geen bewijs van een bug. Het is de gekozen standaard voor vertrouwde personal-assistant-opstellingen; maak dit alleen strenger wanneer je dreigingsmodel goedkeurings- of allowlist-guardrails nodig heeft.
- **Netwerkblootstelling** (Gateway-bind/auth, Tailscale Serve/Funnel, zwakke/korte auth-tokens).
- **Blootstelling van browserbesturing** (remote nodes, relay-poorten, remote CDP-eindpunten).
- **Hygiëne van lokale schijf** (rechten, symlinks, config-includes, "gesynchroniseerde map"-paden).
- **Plugins** (plugins laden zonder een expliciete allowlist).
- **Policy-drift/misconfig** (sandbox-dockerinstellingen geconfigureerd maar sandboxmodus uit; ineffectieve `gateway.nodes.denyCommands`-patronen omdat matching alleen op exacte commandonaam gebeurt (bijvoorbeeld `system.run`) en shelltekst niet inspecteert; gevaarlijke `gateway.nodes.allowCommands`-vermeldingen; globale `tools.profile="minimal"` overschreven door per-agent-profielen; plugin-owned tools bereikbaar onder permissief toolbeleid).
- **Runtime-verwachtingsdrift** (bijvoorbeeld aannemen dat impliciete exec nog steeds `sandbox` betekent wanneer `tools.exec.host` nu standaard `auto` is, of expliciet `tools.exec.host="sandbox"` instellen terwijl sandboxmodus uit staat).
- **Modelhygiëne** (waarschuw wanneer geconfigureerde modellen legacy lijken; geen harde blokkade).

Als je `--deep` uitvoert, probeert OpenClaw ook een best-effort live Gateway-probe.

## Overzicht van opslag voor credentials

Gebruik dit bij het auditen van toegang of beslissen wat je moet back-uppen:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-bottoken**: config/env of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd)
- **Discord-bottoken**: config/env of SecretRef (env/file/exec-providers)
- **Slack-tokens**: config/env (`channels.slack.*`)
- **Koppelings-allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (standaardaccount)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (niet-standaardaccounts)
- **Model-auth-profielen**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex-runtime-state**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **File-backed secrets-payload (optioneel)**: `~/.openclaw/secrets.json`
- **Legacy OAuth-import**: `~/.openclaw/credentials/oauth.json`

## Checklist voor security-audit

Wanneer de audit bevindingen afdrukt, behandel dit als prioriteitsvolgorde:

1. **Alles "open" + tools ingeschakeld**: vergrendel eerst DM's/groepen (pairing/allowlists), maak daarna toolbeleid/sandboxing strenger.
2. **Publieke netwerkblootstelling** (LAN-bind, Funnel, ontbrekende auth): direct oplossen.
3. **Remote blootstelling van browserbesturing**: behandel dit als operator-toegang (alleen tailnet, koppel nodes bewust, vermijd publieke blootstelling).
4. **Rechten**: zorg dat state/config/credentials/auth niet group/world-readable zijn.
5. **Plugins**: laad alleen wat je expliciet vertrouwt.
6. **Modelkeuze**: geef de voorkeur aan moderne, instructiegeharde modellen voor elke bot met tools.

## Glossarium voor security-audit

Elke auditbevinding wordt aangeduid met een gestructureerde `checkId` (bijvoorbeeld
`gateway.bind_no_auth` of `tools.exec.security_full_configured`). Veelvoorkomende
kritieke severity-klassen:

- `fs.*` - bestandssysteemrechten op state, config, credentials, auth-profielen.
- `gateway.*` - bindmodus, auth, Tailscale, Control UI, trusted-proxy-configuratie.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening per oppervlak.
- `plugins.*`, `skills.*` - plugin-/skill-supplychain en scanbevindingen.
- `security.exposure.*` - doorsnijdende controles waar toegangsbeleid en tool-blast-radius samenkomen.

Zie de volledige catalogus met severity-niveaus, fix-keys en auto-fix-ondersteuning op
[Security-auditcontroles](/nl/gateway/security/audit-checks).

## Control UI via HTTP

De Control UI heeft een **veilige context** (HTTPS of localhost) nodig om apparaatidentiteit
te genereren. `gateway.controlUi.allowInsecureAuth` is een lokale compatibiliteitsschakelaar:

- Op localhost staat dit Control UI-auth zonder apparaatidentiteit toe wanneer de pagina
  via niet-veilige HTTP is geladen.
- Dit omzeilt geen koppelingscontroles.
- Dit versoepelt geen vereisten voor remote (niet-localhost) apparaatidentiteit.

Geef de voorkeur aan HTTPS (Tailscale Serve) of open de UI op `127.0.0.1`.

Alleen voor break-glass-scenario's schakelt `gateway.controlUi.dangerouslyDisableDeviceAuth`
apparaatidentiteitscontroles volledig uit. Dit is een ernstige security-downgrade;
laat dit uit tenzij je actief debugt en snel kunt terugdraaien.

Los van die gevaarlijke flags kunnen geslaagde `gateway.auth.mode: "trusted-proxy"`
**operator** Control UI-sessies zonder apparaatidentiteit toelaten. Dat is
bewust auth-mode-gedrag, geen `allowInsecureAuth`-shortcut, en het geldt nog steeds
niet voor Control UI-sessies met node-rol.

`openclaw security audit` waarschuwt wanneer deze instelling is ingeschakeld.

## Samenvatting van onveilige of gevaarlijke flags

`openclaw security audit` meldt `config.insecure_or_dangerous_flags` wanneer
bekende onveilige/gevaarlijke debugschakelaars zijn ingeschakeld. Laat deze unset in
productie.

<AccordionGroup>
  <Accordion title="Flags die de audit vandaag volgt">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Alle `dangerous*` / `dangerously*`-keys in het config-schema">
    Control UI en browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Kanaalnaam-matching (gebundelde en plugin-kanalen; waar van toepassing ook beschikbaar per
    `accounts.<accountId>`):

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

    Sandbox Docker (standaarden + per-agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Reverse-proxyconfiguratie

Als je de Gateway achter een reverse proxy draait (nginx, Caddy, Traefik, enz.), configureer
`gateway.trustedProxies` voor correcte verwerking van forwarded-client-IP's.

Wanneer de Gateway proxyheaders detecteert vanaf een adres dat **niet** in `trustedProxies` staat, zal die verbindingen **niet** behandelen als lokale clients. Als gateway-auth is uitgeschakeld, worden die verbindingen geweigerd. Dit voorkomt authenticatiebypass waarbij proxied verbindingen anders van localhost lijken te komen en automatisch vertrouwen krijgen.

`gateway.trustedProxies` voedt ook `gateway.auth.mode: "trusted-proxy"`, maar die auth-modus is strikter:

- trusted-proxy-auth **faalt standaard gesloten bij proxy's met loopback-bron**
- loopback-reverseproxy's op dezelfde host kunnen `gateway.trustedProxies` gebruiken voor detectie van lokale clients en afhandeling van doorgestuurde IP's
- loopback-reverseproxy's op dezelfde host kunnen alleen aan `gateway.auth.mode: "trusted-proxy"` voldoen wanneer `gateway.auth.trustedProxy.allowLoopback = true`; gebruik anders token-/wachtwoordauth

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

Vertrouwde proxyheaders maken apparaatkoppeling van nodes niet automatisch vertrouwd.
`gateway.nodes.pairing.autoApproveCidrs` is een afzonderlijk, standaard uitgeschakeld
operatorbeleid. Zelfs wanneer dit is ingeschakeld, worden headerpaden van vertrouwde proxy's
met loopback-bron uitgesloten van automatische node-goedkeuring, omdat lokale aanroepers die
headers kunnen vervalsen, ook wanneer loopback trusted-proxy-auth expliciet is ingeschakeld.

Goed reverseproxygedrag (inkomende forwardingheaders overschrijven):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Slecht reverseproxygedrag (niet-vertrouwde forwardingheaders toevoegen/behouden):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS- en origin-opmerkingen

- OpenClaw gateway is eerst lokaal/loopback. Als je TLS bij een reverseproxy termineert, stel HSTS daar in op het HTTPS-domein dat naar de proxy wijst.
- Als de gateway zelf HTTPS termineert, kun je `gateway.http.securityHeaders.strictTransportSecurity` instellen om de HSTS-header vanuit OpenClaw-antwoorden te verzenden.
- Gedetailleerde implementatierichtlijnen staan in [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Voor niet-loopback Control UI-implementaties is `gateway.controlUi.allowedOrigins` standaard vereist.
- `gateway.controlUi.allowedOrigins: ["*"]` is een expliciet allow-all beleid voor browser-origins, geen geharde standaard. Vermijd dit buiten strikt gecontroleerde lokale tests.
- Auth-fouten voor browser-origins op loopback blijven rate-limited, zelfs wanneer de
  algemene loopback-uitzondering is ingeschakeld, maar de lockout-sleutel is per
  genormaliseerde `Origin`-waarde gescoped in plaats van één gedeelde localhost-bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de fallbackmodus voor Host-header-origin in; behandel dit als een gevaarlijk, door de operator gekozen beleid.
- Behandel DNS-rebinding en proxy-hostheadergedrag als aandachtspunten voor implementatiehardening; houd `trustedProxies` strikt en vermijd directe blootstelling van de gateway aan het openbare internet.

## Lokale sessielogs staan op schijf

OpenClaw slaat sessietranscripten op schijf op onder `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Dit is vereist voor sessiecontinuiteit en (optioneel) sessiegeheugenindexering, maar het betekent ook dat
**elk proces/elke gebruiker met bestandssysteemtoegang die logs kan lezen**. Behandel schijftoegang als de vertrouwensgrens
en vergrendel de rechten op `~/.openclaw` (zie de auditsectie hieronder). Als je
sterkere isolatie tussen agents nodig hebt, voer ze dan uit onder afzonderlijke OS-gebruikers of afzonderlijke hosts.

## Node-uitvoering (system.run)

Als een macOS-node is gekoppeld, kan de Gateway `system.run` op die node aanroepen. Dit is **uitvoering van externe code** op de Mac:

- Vereist node-koppeling (goedkeuring + token).
- Gateway-nodekoppeling is geen goedkeuringsvlak per opdracht. Het stelt node-identiteit/-vertrouwen en tokenuitgifte vast.
- De Gateway past een grof globaal node-opdrachtbeleid toe via `gateway.nodes.allowCommands` / `denyCommands`.
- Beheerd op de Mac via **Settings → Exec approvals** (security + ask + allowlist).
- Het per-node `system.run`-beleid is het eigen exec-goedkeuringsbestand van de node (`exec.approvals.node.*`), dat strikter of losser kan zijn dan het globale opdracht-ID-beleid van de gateway.
- Een node die draait met `security="full"` en `ask="off"` volgt het standaardmodel voor een vertrouwde operator. Behandel dat als verwacht gedrag, tenzij je implementatie expliciet een striktere goedkeurings- of allowlist-houding vereist.
- Goedkeuringsmodus bindt de exacte aanvraagcontext en, waar mogelijk, één concreet lokaal script-/bestandsoperand. Als OpenClaw niet exact één direct lokaal bestand voor een interpreter-/runtimeopdracht kan identificeren, wordt uitvoering met goedkeuring geweigerd in plaats van volledige semantische dekking te beloven.
- Voor `host=node` slaan runs met goedkeuring ook een canoniek voorbereid
  `systemRunPlan` op; latere goedgekeurde forwards hergebruiken dat opgeslagen plan, en gateway-
  validatie weigert wijzigingen door de aanroeper aan opdracht/cwd/sessiecontext nadat het
  goedkeuringsverzoek is aangemaakt.
- Als je geen externe uitvoering wilt, stel security in op **deny** en verwijder de node-koppeling voor die Mac.

Dit onderscheid is belangrijk voor triage:

- Een opnieuw verbindende gekoppelde node die een andere opdrachtenlijst adverteert, is op zichzelf geen kwetsbaarheid als het globale Gateway-beleid en de lokale exec-goedkeuringen van de node nog steeds de daadwerkelijke uitvoeringsgrens afdwingen.
- Meldingen die node-koppelingsmetadata behandelen als een tweede verborgen goedkeuringslaag per opdracht, zijn meestal beleids-/UX-verwarring, geen omzeiling van een beveiligingsgrens.

## Dynamische Skills (watcher / externe nodes)

OpenClaw kan de lijst met Skills midden in een sessie vernieuwen:

- **Skills-watcher**: wijzigingen in `SKILL.md` kunnen de skill-snapshot bij de volgende agentbeurt bijwerken.
- **Externe nodes**: het verbinden van een macOS-node kan macOS-only skills beschikbaar maken (op basis van bin-probing).

Behandel skill-mappen als **vertrouwde code** en beperk wie ze kan wijzigen.

## Het dreigingsmodel

Je AI-assistent kan:

- Willekeurige shellopdrachten uitvoeren
- Bestanden lezen/schrijven
- Toegang krijgen tot netwerkservices
- Berichten naar iedereen sturen (als je hem WhatsApp-toegang geeft)

Mensen die je berichten sturen kunnen:

- Proberen je AI te misleiden om slechte dingen te doen
- Via social engineering toegang tot je gegevens krijgen
- Naar infrastructuurdetails peilen

## Kernconcept: toegangscontrole vóór intelligentie

De meeste fouten hier zijn geen geavanceerde exploits - het is "iemand stuurde de bot een bericht en de bot deed wat er werd gevraagd."

De houding van OpenClaw:

- **Eerst identiteit:** bepaal wie met de bot mag praten (DM-koppeling / allowlists / expliciet "open").
- **Daarna scope:** bepaal waar de bot mag handelen (groeps-allowlists + mention-gating, tools, sandboxing, apparaatrechten).
- **Als laatste model:** ga ervan uit dat het model kan worden gemanipuleerd; ontwerp zo dat manipulatie een beperkte impact heeft.

## Model voor opdracht-autorisatie

Slash-opdrachten en directieven worden alleen gehonoreerd voor **geautoriseerde afzenders**. Autorisatie wordt afgeleid uit
kanaal-allowlists/koppeling plus `commands.useAccessGroups` (zie [Configuratie](/nl/gateway/configuration)
en [Slash-opdrachten](/nl/tools/slash-commands)). Als een kanaal-allowlist leeg is of `"*"` bevat,
staan opdrachten effectief open voor dat kanaal.

`/exec` is een sessiegebonden gemak voor geautoriseerde operators. Het schrijft **geen** config en
wijzigt geen andere sessies.

## Risico van control-plane-tools

Twee ingebouwde tools kunnen permanente control-plane-wijzigingen aanbrengen:

- `gateway` kan config inspecteren met `config.schema.lookup` / `config.get`, en kan permanente wijzigingen aanbrengen met `config.apply`, `config.patch` en `update.run`.
- `cron` kan geplande taken maken die blijven draaien nadat de oorspronkelijke chat/taak eindigt.

De owner-only runtime-tool `gateway` weigert nog steeds
`tools.exec.ask` of `tools.exec.security` te herschrijven; verouderde `tools.bash.*`-aliassen worden
vóór het schrijven genormaliseerd naar dezelfde beschermde exec-paden.
Door agents aangestuurde bewerkingen via `gateway config.apply` en `gateway config.patch` zijn
standaard fail-closed: alleen een beperkte set paden voor prompts, modellen en mention-gating
is door agents afstembaar. Nieuwe gevoelige configbomen zijn daarom beschermd,
tenzij ze bewust aan de allowlist worden toegevoegd.

Weiger deze standaard voor elke agent/surface die niet-vertrouwde content verwerkt:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokkeert alleen herstartacties. Het schakelt `gateway` config-/updateacties niet uit.

## Plugins

Plugins draaien **in-process** met de Gateway. Behandel ze als vertrouwde code:

- Installeer alleen plugins uit bronnen die je vertrouwt.
- Geef de voorkeur aan expliciete `plugins.allow`-allowlists.
- Controleer pluginconfig voordat je deze inschakelt.
- Herstart de Gateway na pluginwijzigingen.
- Als je plugins installeert of bijwerkt (`openclaw plugins install <package>`, `openclaw plugins update <id>`), behandel dit alsof je niet-vertrouwde code uitvoert:
  - Het installatiepad is de per-plugin directory onder de actieve plugin-installatieroot.
  - OpenClaw voert vóór installatie/bijwerken een ingebouwde gevaarlijke-code-scan uit. `critical`-bevindingen blokkeren standaard.
  - npm- en git-plugininstallaties voeren dependency-convergentie via de package manager alleen uit tijdens de expliciete installatie-/bijwerkflow. Lokale paden en archieven worden behandeld als zelfstandige pluginpakketten; OpenClaw kopieert/verwijst ernaar zonder `npm install` uit te voeren.
  - Geef de voorkeur aan gepinde, exacte versies (`@scope/pkg@1.2.3`) en inspecteer de uitgepakte code op schijf voordat je deze inschakelt.
  - `--dangerously-force-unsafe-install` is alleen een noodoptie voor false positives van de ingebouwde scan bij plugininstallatie-/bijwerkflows. Het omzeilt geen beleidsblokkades van plugin-`before_install`-hooks en omzeilt geen scanfouten.
  - Door de Gateway ondersteunde installaties van skill-dependencies volgen dezelfde splitsing tussen gevaarlijk/verdacht: ingebouwde `critical`-bevindingen blokkeren tenzij de aanroeper expliciet `dangerouslyForceUnsafeInstall` instelt, terwijl verdachte bevindingen nog steeds alleen waarschuwen. `openclaw skills install` blijft de afzonderlijke ClawHub-download-/installflow voor skills.

Details: [Plugins](/nl/tools/plugin)

## DM-toegangsmodel: koppeling, allowlist, open, uitgeschakeld

Alle huidige kanalen met DM-ondersteuning ondersteunen een DM-beleid (`dmPolicy` of `*.dm.policy`) dat inkomende DM's gate **voordat** het bericht wordt verwerkt:

- `pairing` (standaard): onbekende afzenders ontvangen een korte koppelingscode en de bot negeert hun bericht totdat dit is goedgekeurd. Codes verlopen na 1 uur; herhaalde DM's verzenden geen code opnieuw totdat een nieuw verzoek is aangemaakt. Wachtende verzoeken zijn standaard beperkt tot **3 per kanaal**.
- `allowlist`: onbekende afzenders worden geblokkeerd (geen koppelingshandshake).
- `open`: sta iedereen toe een DM te sturen (publiek). **Vereist** dat de kanaal-allowlist `"*"` bevat (expliciete opt-in).
- `disabled`: negeer inkomende DM's volledig.

Goedkeuren via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + bestanden op schijf: [Koppeling](/nl/channels/pairing)

## DM-sessie-isolatie (multi-usermodus)

Standaard routeert OpenClaw **alle DM's naar de hoofdsessie** zodat je assistent continuiteit heeft over apparaten en kanalen heen. Als **meerdere mensen** de bot kunnen DM'en (open DM's of een allowlist met meerdere personen), overweeg dan DM-sessies te isoleren:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Dit voorkomt contextlekken tussen gebruikers terwijl groepschats geisoleerd blijven.

Dit is een berichtcontextgrens, geen host-admin-grens. Als gebruikers onderling vijandig zijn en dezelfde Gateway-host/config delen, draai dan in plaats daarvan afzonderlijke gateways per vertrouwensgrens.

### Veilige DM-modus (aanbevolen)

Behandel het fragment hierboven als **veilige DM-modus**:

- Standaard: `session.dmScope: "main"` (alle DM's delen één sessie voor continuiteit).
- Standaard bij lokale CLI-onboarding: schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld (behoudt bestaande expliciete waarden).
- Veilige DM-modus: `session.dmScope: "per-channel-peer"` (elk kanaal+afzender-paar krijgt een geisoleerde DM-context).
- Cross-channel peer-isolatie: `session.dmScope: "per-peer"` (elke afzender krijgt één sessie over alle kanalen van hetzelfde type).

Als je meerdere accounts op hetzelfde kanaal gebruikt, gebruik dan in plaats daarvan `per-account-channel-peer`. Als dezelfde persoon je via meerdere kanalen contacteert, gebruik dan `session.identityLinks` om die DM-sessies samen te voegen tot een canonieke identiteit. Zie [Sessiebeheer](/nl/concepts/session) en [Configuratie](/nl/gateway/configuration).

## Toestaanlijsten voor DM's en groepen

OpenClaw heeft twee aparte lagen voor "wie mag mij activeren?":

- **DM-toestaanlijst** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; verouderd: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): wie met de bot mag praten in directe berichten.
  - Wanneer `dmPolicy="pairing"` is, worden goedkeuringen geschreven naar de accountgebonden pairing-toestaanlijstopslag onder `~/.openclaw/credentials/` (`<channel>-allowFrom.json` voor het standaardaccount, `<channel>-<accountId>-allowFrom.json` voor niet-standaardaccounts), samengevoegd met configuratie-toestaanlijsten.
- **Groepstoestaanlijst** (kanaalspecifiek): van welke groepen/kanalen/guilds de bot überhaupt berichten accepteert.
  - Veelvoorkomende patronen:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: standaarden per groep zoals `requireMention`; wanneer ingesteld, fungeert dit ook als groepstoestaanlijst (neem `"*"` op om alles-toestaan-gedrag te behouden).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: beperk wie de bot _binnen_ een groepssessie kan activeren (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: toestaanlijsten per oppervlak + vermeldingsstandaarden.
  - Groepscontroles worden in deze volgorde uitgevoerd: eerst `groupPolicy`/groepstoestaanlijsten, daarna activering via vermelding/antwoord.
  - Antwoorden op een botbericht (impliciete vermelding) omzeilt **niet** toestaanlijsten voor afzenders zoals `groupAllowFrom`.
  - **Beveiligingsopmerking:** behandel `dmPolicy="open"` en `groupPolicy="open"` als instellingen voor noodgevallen. Ze zouden nauwelijks gebruikt moeten worden; geef de voorkeur aan pairing + toestaanlijsten, tenzij je elk lid van de ruimte volledig vertrouwt.

Details: [Configuratie](/nl/gateway/configuration) en [Groepen](/nl/channels/groups)

## Promptinjectie (wat het is, waarom het belangrijk is)

Promptinjectie is wanneer een aanvaller een bericht opstelt dat het model manipuleert om iets onveiligs te doen ("negeer je instructies", "dump je bestandssysteem", "volg deze link en voer opdrachten uit", enzovoort).

Zelfs met sterke systeemprompts is **promptinjectie niet opgelost**. Guardrails in systeemprompts zijn alleen zachte richtlijnen; harde handhaving komt van toolbeleid, exec-goedkeuringen, sandboxing en kanaaltoestaanlijsten (en operators kunnen deze bewust uitschakelen). Wat in de praktijk helpt:

- Houd inkomende DM's afgesloten (pairing/toestaanlijsten).
- Geef de voorkeur aan activering via vermelding in groepen; vermijd "altijd-aan"-bots in openbare ruimtes.
- Behandel links, bijlagen en geplakte instructies standaard als vijandig.
- Voer gevoelige tooluitvoering uit in een sandbox; houd geheimen buiten het bereikbare bestandssysteem van de agent.
- Opmerking: sandboxing is opt-in. Als sandboxmodus uit staat, wordt impliciete `host=auto` opgelost naar de Gateway-host. Expliciete `host=sandbox` faalt nog steeds gesloten omdat er geen sandboxruntime beschikbaar is. Stel `host=gateway` in als je wilt dat dat gedrag expliciet in de configuratie staat.
- Beperk tools met hoog risico (`exec`, `browser`, `web_fetch`, `web_search`) tot vertrouwde agents of expliciete toestaanlijsten.
- Als je interpreters toestaat (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), schakel dan `tools.exec.strictInlineEval` in zodat inline-eval-vormen nog steeds expliciete goedkeuring nodig hebben.
- Analyse van shellgoedkeuring weigert ook POSIX-parameterexpansievormen (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) binnen **niet-gequote heredocs**, zodat een toegestane heredoc-body geen shell-expansie als platte tekst langs toestaanlijstcontrole kan smokkelen. Quote de heredoc-terminator (bijvoorbeeld `<<'EOF'`) om te kiezen voor letterlijke bodysemantiek; niet-gequote heredocs die variabelen zouden hebben geëxpandeerd, worden geweigerd.
- **Modelkeuze is belangrijk:** oudere/kleinere/legacy-modellen zijn aanzienlijk minder robuust tegen promptinjectie en toolmisbruik. Gebruik voor agents met tools het sterkste beschikbare nieuwste-generatie, instructiegeharde model.

Rode vlaggen die je als onbetrouwbaar moet behandelen:

- "Lees dit bestand/deze URL en doe precies wat er staat."
- "Negeer je systeemprompt of veiligheidsregels."
- "Onthul je verborgen instructies of tooluitvoer."
- "Plak de volledige inhoud van ~/.openclaw of je logs."

## Opschonen van speciale tokens in externe content

OpenClaw verwijdert veelvoorkomende self-hosted LLM-chattemplatespecial-token-literals uit ingepakte externe content en metadata voordat ze het model bereiken. Gedekte markerfamilies omvatten Qwen/ChatML, Llama, Gemma, Mistral, Phi en GPT-OSS rol-/beurttokens.

Waarom:

- OpenAI-compatibele backends die self-hosted modellen aanbieden, behouden soms speciale tokens die in gebruikerstekst voorkomen, in plaats van ze te maskeren. Een aanvaller die in inkomende externe content kan schrijven (een opgehaalde pagina, een e-mailbody, uitvoer van een tool voor bestandsinhoud) zou anders een synthetische `assistant`- of `system`-rolgrens kunnen injecteren en ontsnappen aan de guardrails voor ingepakte content.
- Opschoning gebeurt op de laag voor het inpakken van externe content, zodat deze uniform geldt voor fetch-/read-tools en inkomende kanaalcontent in plaats van per provider.
- Uitgaande modelantwoorden hebben al een aparte sanitizer die gelekte `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` en vergelijkbare interne runtime-scaffolding uit gebruikerszichtbare antwoorden verwijdert bij de uiteindelijke kanaalafleveringsgrens. De sanitizer voor externe content is de inkomende tegenhanger.

Dit vervangt de andere verharding op deze pagina niet - `dmPolicy`, toestaanlijsten, exec-goedkeuringen, sandboxing en `contextVisibility` doen nog steeds het primaire werk. Het sluit één specifieke bypass op tokenizerlaag tegen self-hosted stacks die gebruikerstekst met speciale tokens intact doorsturen.

## Onveilige bypassvlaggen voor externe content

OpenClaw bevat expliciete bypassvlaggen die veiligheidsinpakking van externe content uitschakelen:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron-payloadveld `allowUnsafeExternalContent`

Richtlijnen:

- Laat deze in productie niet ingesteld/onwaar.
- Schakel ze alleen tijdelijk in voor strak afgebakende foutopsporing.
- Indien ingeschakeld, isoleer die agent (sandbox + minimale tools + toegewezen sessienaamruimte).

Risico-opmerking voor hooks:

- Hook-payloads zijn onbetrouwbare content, zelfs wanneer aflevering afkomstig is van systemen die je beheert (mail-/docs-/webcontent kan promptinjectie bevatten).
- Zwakke modelniveaus vergroten dit risico. Geef voor hook-gedreven automatisering de voorkeur aan sterke moderne modelniveaus en houd toolbeleid strikt (`tools.profile: "messaging"` of strenger), plus sandboxing waar mogelijk.

### Promptinjectie vereist geen openbare DM's

Zelfs als **alleen jij** de bot berichten kunt sturen, kan promptinjectie nog steeds gebeuren via
elke **onbetrouwbare content** die de bot leest (webzoek-/fetchresultaten, browserpagina's,
e-mails, docs, bijlagen, geplakte logs/code). Met andere woorden: de afzender is niet
het enige aanvalsoppervlak; de **content zelf** kan vijandige instructies bevatten.

Wanneer tools zijn ingeschakeld, is het typische risico het exfiltreren van context of het activeren van
toolaanroepen. Beperk de blast radius door:

- Een alleen-lezen of tool-uitgeschakelde **reader-agent** te gebruiken om onbetrouwbare content samen te vatten,
  en daarna de samenvatting door te geven aan je hoofdagent.
- `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools tenzij nodig.
- Voor OpenResponses-URL-invoer (`input_file` / `input_image`) strikte
  `gateway.http.endpoints.responses.files.urlAllowlist` en
  `gateway.http.endpoints.responses.images.urlAllowlist` in te stellen, en `maxUrlParts` laag te houden.
  Lege toestaanlijsten worden behandeld als niet ingesteld; gebruik `files.allowUrl: false` / `images.allowUrl: false`
  als je URL-fetching volledig wilt uitschakelen.
- Voor OpenResponses-bestandsinvoer wordt gedecodeerde `input_file`-tekst nog steeds geïnjecteerd als
  **onbetrouwbare externe content**. Vertrouw er niet op dat bestandstekst betrouwbaar is alleen omdat
  de Gateway deze lokaal heeft gedecodeerd. Het geïnjecteerde blok draagt nog steeds expliciete
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>`-grensmarkers plus `Source: External`-
  metadata, ook al laat dit pad de langere `SECURITY NOTICE:`-banner weg.
- Dezelfde markergebaseerde inpakking wordt toegepast wanneer media-understanding tekst extraheert
  uit bijgevoegde documenten voordat die tekst aan de mediaprompt wordt toegevoegd.
- Sandboxing en strikte tooltoestaanlijsten in te schakelen voor elke agent die onbetrouwbare invoer aanraakt.
- Geheimen uit prompts te houden; geef ze in plaats daarvan door via env/config op de Gateway-host.

### Self-hosted LLM-backends

OpenAI-compatibele self-hosted backends zoals vLLM, SGLang, TGI, LM Studio,
of aangepaste Hugging Face-tokenizerstacks kunnen verschillen van hosted providers in hoe
chattemplatespecial-tokens worden afgehandeld. Als een backend letterlijke strings
zoals `<|im_start|>`, `<|start_header_id|>` of `<start_of_turn>` tokenizet als
structurele chattemplate-tokens binnen gebruikerscontent, kan onbetrouwbare tekst proberen
rolgrenzen op de tokenizerlaag te vervalsen.

OpenClaw verwijdert veelvoorkomende modelfamilie-special-token-literals uit ingepakte
externe content voordat deze naar het model wordt verzonden. Houd inpakking van externe content
ingeschakeld en geef de voorkeur aan backendinstellingen die speciale tokens in door gebruikers
aangeleverde content splitsen of escapen wanneer beschikbaar. Hosted providers zoals OpenAI
en Anthropic passen al hun eigen opschoning aan de aanvraagzijde toe.

### Modelsterkte (beveiligingsopmerking)

Weerstand tegen promptinjectie is **niet** uniform over modelniveaus. Kleinere/goedkopere modellen zijn doorgaans gevoeliger voor toolmisbruik en instructiekaping, vooral onder vijandige prompts.

<Warning>
Voor agents met tools of agents die onbetrouwbare content lezen, is het promptinjectierisico bij oudere/kleinere modellen vaak te hoog. Draai die workloads niet op zwakke modelniveaus.
</Warning>

Aanbevelingen:

- **Gebruik het nieuwste generatie-, beste-niveau-model** voor elke bot die tools kan uitvoeren of bestanden/netwerken kan aanraken.
- **Gebruik geen oudere/zwakkere/kleinere niveaus** voor agents met tools of onbetrouwbare inboxen; het promptinjectierisico is te hoog.
- Als je een kleiner model moet gebruiken, **beperk de blast radius** (alleen-lezen tools, sterke sandboxing, minimale bestandssysteemtoegang, strikte toestaanlijsten).
- Wanneer je kleine modellen draait, **schakel sandboxing in voor alle sessies** en **schakel web_search/web_fetch/browser uit** tenzij invoer strikt gecontroleerd is.
- Voor chat-only persoonlijke assistenten met betrouwbare invoer en zonder tools zijn kleinere modellen meestal prima.

## Redenering en uitgebreide uitvoer in groepen

`/reasoning`, `/verbose` en `/trace` kunnen interne redenering, tooluitvoer
of Plugin-diagnostiek blootleggen die
niet bedoeld was voor een openbaar kanaal. Behandel ze in groepsinstellingen als **alleen debug**
en houd ze uitgeschakeld tenzij je ze expliciet nodig hebt.

Richtlijnen:

- Houd `/reasoning`, `/verbose` en `/trace` uitgeschakeld in openbare ruimtes.
- Als je ze inschakelt, doe dat dan alleen in vertrouwde DM's of strak gecontroleerde ruimtes.
- Onthoud: uitgebreide en trace-uitvoer kan toolargumenten, URL's, Plugin-diagnostiek en data bevatten die het model heeft gezien.

## Voorbeelden van configuratieverharding

### Bestandsrechten

Houd configuratie + toestand privé op de Gateway-host:

- `~/.openclaw/openclaw.json`: `600` (alleen gebruiker lezen/schrijven)
- `~/.openclaw`: `700` (alleen gebruiker)

`openclaw doctor` kan waarschuwen en aanbieden deze rechten aan te scherpen.

### Netwerkblootstelling (bind, poort, firewall)

De Gateway multiplext **WebSocket + HTTP** op één poort:

- Standaard: `18789`
- Configuratie/vlaggen/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Dit HTTP-oppervlak omvat de Control UI en de canvas-host:

- Control UI (SPA-assets) (standaardbasispad `/`)
- Canvas-host: `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` (willekeurige HTML/JS; behandel als onbetrouwbare content)

Als je canvascontent in een normale browser laadt, behandel die dan zoals elke andere onbetrouwbare webpagina:

- Stel de canvas-host niet bloot aan onbetrouwbare netwerken/gebruikers.
- Laat canvascontent niet dezelfde origin delen als geprivilegieerde weboppervlakken, tenzij je de gevolgen volledig begrijpt.

Bindmodus bepaalt waar de Gateway luistert:

- `gateway.bind: "loopback"` (standaard): alleen lokale clients kunnen verbinding maken.
- Niet-loopback-binds (`"lan"`, `"tailnet"`, `"custom"`) vergroten het aanvalsoppervlak. Gebruik ze alleen met gateway-authenticatie (gedeeld token/wachtwoord of een correct geconfigureerde vertrouwde proxy) en een echte firewall.

Vuistregels:

- Geef de voorkeur aan Tailscale Serve boven LAN-binds (Serve houdt de Gateway op loopback, en Tailscale regelt de toegang).
- Als je aan LAN moet binden, scherm de poort dan met een firewall af tot een strikte allowlist van bron-IP's; forward de poort niet breed.
- Stel de Gateway nooit zonder authenticatie bloot op `0.0.0.0`.

### Docker-poortpublicatie met UFW

Als je OpenClaw met Docker op een VPS draait, onthoud dan dat gepubliceerde containerpoorten
(`-p HOST:CONTAINER` of Compose `ports:`) via Docker's forwardingketens worden gerouteerd,
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

IPv6 heeft aparte tabellen. Voeg een overeenkomstig beleid toe in `/etc/ufw/after6.rules` als
Docker IPv6 is ingeschakeld.

Vermijd het hardcoderen van interfacenamen zoals `eth0` in docs-fragmenten. Interfacenamen
verschillen tussen VPS-images (`ens3`, `enp*`, enz.) en mismatches kunnen ervoor zorgen dat
je deny-regel per ongeluk wordt overgeslagen.

Snelle validatie na herladen:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Verwachte externe poorten moeten alleen zijn wat je bewust blootstelt (voor de meeste
setups: SSH + je reverse-proxypoorten).

### mDNS/Bonjour-detectie

Wanneer de gebundelde `bonjour`-Plugin is ingeschakeld, zendt de Gateway zijn aanwezigheid uit via mDNS (`_openclaw-gw._tcp` op poort 5353) voor lokale apparaatdetectie. In volledige modus bevat dit TXT-records die operationele details kunnen blootleggen:

- `cliPath`: volledig bestandssysteempad naar de CLI-binary (onthult gebruikersnaam en installatielocatie)
- `sshPort`: adverteert SSH-beschikbaarheid op de host
- `displayName`, `lanHost`: hostnaaminformatie

**Overweging voor operationele beveiliging:** Het uitzenden van infrastructuurdetails maakt verkenning eenvoudiger voor iedereen op het lokale netwerk. Zelfs "onschuldige" informatie zoals bestandssysteempaden en SSH-beschikbaarheid helpt aanvallers je omgeving in kaart te brengen.

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

5. **Omgevingsvariabele** (alternatief): stel `OPENCLAW_DISABLE_BONJOUR=1` in om mDNS uit te schakelen zonder configuratiewijzigingen.

Wanneer Bonjour is ingeschakeld in minimale modus, zendt de Gateway genoeg uit voor apparaatdetectie (`role`, `gatewayPort`, `transport`), maar laat `cliPath` en `sshPort` weg. Apps die CLI-padinformatie nodig hebben, kunnen die in plaats daarvan ophalen via de geauthenticeerde WebSocket-verbinding.

### Vergrendel de Gateway-WebSocket (lokale authenticatie)

Gateway-authenticatie is **standaard vereist**. Als er geen geldig gateway-authenticatiepad is geconfigureerd,
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
`gateway.remote.token` en `gateway.remote.password` zijn bronnen voor clientreferenties. Ze beschermen lokale WS-toegang op zichzelf **niet**. Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld. Als `gateway.auth.token` of `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt de resolutie gesloten (geen remote fallback masking).
</Note>
Optioneel: pin remote TLS met `gateway.remote.tlsFingerprint` wanneer je `wss://` gebruikt.
Plaintext `ws://` is standaard alleen loopback. Voor vertrouwde private-netwerkpaden
stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als
noodoptie. Dit is bewust alleen een procesomgeving, geen
`openclaw.json`-configuratiesleutel.
Mobiele koppeling en Android-handmatige of gescande gatewayroutes zijn strikter:
cleartext wordt geaccepteerd voor loopback, maar private-LAN, link-local, `.local` en
puntloze hostnamen moeten TLS gebruiken tenzij je expliciet kiest voor het vertrouwde
private-netwerk-cleartextpad.

Lokale apparaatkoppeling:

- Apparaatkoppeling wordt automatisch goedgekeurd voor directe lokale loopback-verbindingen om
  clients op dezelfde host soepel te houden.
- OpenClaw heeft ook een smal backend-/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief tailnet-binds op dezelfde host, worden behandeld als
  remote voor koppeling en hebben nog steeds goedkeuring nodig.
- Forwarded-header-bewijs op een loopback-request diskwalificeert loopback-
  localiteit. Automatische goedkeuring voor metadata-upgrades is smal afgebakend. Zie
  [Gateway-koppeling](/nl/gateway/pairing) voor beide regels.

Authenticatiemodi:

- `gateway.auth.mode: "token"`: gedeeld bearer-token (aanbevolen voor de meeste setups).
- `gateway.auth.mode: "password"`: wachtwoordauthenticatie (bij voorkeur instellen via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: vertrouw op een identiteitsbewuste reverse proxy om gebruikers te authenticeren en identiteit via headers door te geven (zie [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth)).

Rotatiechecklist (token/wachtwoord):

1. Genereer/stel een nieuw geheim in (`gateway.auth.token` of `OPENCLAW_GATEWAY_PASSWORD`).
2. Herstart de Gateway (of herstart de macOS-app als die de Gateway superviseert).
3. Werk eventuele remote clients bij (`gateway.remote.token` / `.password` op machines die de Gateway aanroepen).
4. Controleer dat je niet meer kunt verbinden met de oude referenties.

### Tailscale Serve-identiteitsheaders

Wanneer `gateway.auth.allowTailscale` `true` is (standaard voor Serve), accepteert OpenClaw
Tailscale Serve-identiteitsheaders (`tailscale-user-login`) voor Control
UI-/WebSocket-authenticatie. OpenClaw verifieert de identiteit door het
`x-forwarded-for`-adres op te lossen via de lokale Tailscale-daemon (`tailscale whois`)
en dit te matchen met de header. Dit wordt alleen geactiveerd voor requests die loopback raken
en `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host` bevatten zoals
geïnjecteerd door Tailscale.
Voor dit async identiteitscontrolepad worden mislukte pogingen voor dezelfde `{scope, ip}`
geserialiseerd voordat de limiter de mislukking registreert. Gelijktijdige foutieve retries
van één Serve-client kunnen daardoor de tweede poging direct buitensluiten
in plaats van erdoorheen te racen als twee gewone mismatches.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale-authenticatie via identiteitsheaders. Ze volgen nog steeds de
geconfigureerde HTTP-authenticatiemodus van de gateway.

Belangrijke grensopmerking:

- Gateway HTTP-bearer-authenticatie is in feite alles-of-niets operatortoegang.
- Behandel referenties die `/v1/chat/completions`, `/v1/responses` of `/api/channels/*` kunnen aanroepen als operatorgeheimen met volledige toegang voor die gateway.
- Op het OpenAI-compatibele HTTP-oppervlak herstelt bearer-authenticatie met gedeeld geheim de volledige standaard operator-scopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) en owner-semantiek voor agent-turns; smallere `x-openclaw-scopes`-waarden verminderen dat pad met gedeeld geheim niet.
- Per-request scope-semantiek op HTTP is alleen van toepassing wanneer het request afkomstig is uit een modus met identiteit, zoals vertrouwde-proxy-authenticatie of `gateway.auth.mode="none"` op een private ingress.
- In die modi met identiteit valt het weglaten van `x-openclaw-scopes` terug op de normale standaard operator-scopeset; stuur de header expliciet wanneer je een smallere scopeset wilt.
- `/tools/invoke` volgt dezelfde regel voor gedeeld geheim: bearer-authenticatie met token/wachtwoord wordt daar ook behandeld als volledige operatortoegang, terwijl modi met identiteit nog steeds gedeclareerde scopes respecteren.
- Deel deze referenties niet met niet-vertrouwde callers; geef de voorkeur aan aparte gateways per vertrouwensgrens.

**Vertrouwensaanname:** tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is.
Behandel dit niet als bescherming tegen vijandige processen op dezelfde host. Als niet-vertrouwde
lokale code op de gatewayhost kan draaien, schakel dan `gateway.auth.allowTailscale` uit
en vereis expliciete authenticatie met gedeeld geheim via `gateway.auth.mode: "token"` of
`"password"`.

**Beveiligingsregel:** forward deze headers niet vanuit je eigen reverse proxy. Als
je TLS beëindigt of proxyt vóór de gateway, schakel dan
`gateway.auth.allowTailscale` uit en gebruik authenticatie met gedeeld geheim (`gateway.auth.mode:
"token"` of `"password"`) of [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth)
in plaats daarvan.

Vertrouwde proxy's:

- Als je TLS vóór de Gateway beëindigt, stel dan `gateway.trustedProxies` in op de IP's van je proxy.
- OpenClaw vertrouwt `x-forwarded-for` (of `x-real-ip`) van die IP's om het client-IP te bepalen voor lokale koppelingscontroles en HTTP-auth-/lokale controles.
- Zorg dat je proxy `x-forwarded-for` **overschrijft** en directe toegang tot de Gateway-poort blokkeert.

Zie [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

### Browserbesturing via nodehost (aanbevolen)

Als je Gateway remote is maar de browser op een andere machine draait, voer dan een **nodehost**
uit op de browsermachine en laat de Gateway browseracties proxien (zie [Browsertool](/nl/tools/browser)).
Behandel node-koppeling als admintoegang.

Aanbevolen patroon:

- Houd de Gateway en nodehost op dezelfde tailnet (Tailscale).
- Koppel de node bewust; schakel browserproxyrouting uit als je die niet nodig hebt.

Vermijd:

- Relay-/controlpoorten blootstellen via LAN of het openbare internet.
- Tailscale Funnel voor browsercontrole-eindpunten (publieke blootstelling).

### Geheimen op schijf

Ga ervan uit dat alles onder `~/.openclaw/` (of `$OPENCLAW_STATE_DIR/`) geheimen of privégegevens kan bevatten:

- `openclaw.json`: configuratie kan tokens bevatten (gateway, remote gateway), providerinstellingen en allowlists.
- `credentials/**`: kanaalreferenties (voorbeeld: WhatsApp-referenties), koppelings-allowlists, legacy OAuth-imports.
- `agents/<agentId>/agent/auth-profiles.json`: API-sleutels, tokenprofielen, OAuth-tokens en optionele `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex app-serveraccount, configuratie, Skills, plugins, native thread-status en diagnostiek.
- `secrets.json` (optioneel): bestandsgedragen geheime payload gebruikt door `file` SecretRef-providers (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: legacy compatibiliteitsbestand. Statische `api_key`-vermeldingen worden opgeschoond wanneer ze worden ontdekt.
- `agents/<agentId>/sessions/**`: sessietranscripten (`*.jsonl`) + routeringsmetadata (`sessions.json`) die privéberichten en tooloutput kunnen bevatten.
- gebundelde Plugin-pakketten: geïnstalleerde plugins (plus hun `node_modules/`).
- `sandboxes/**`: tool-sandboxwerkruimten; kunnen kopieën verzamelen van bestanden die je binnen de sandbox leest/schrijft.

Tips voor verharding:

- Houd rechten strikt (`700` op mappen, `600` op bestanden).
- Gebruik versleuteling van de volledige schijf op de Gateway-host.
- Geef de voorkeur aan een toegewezen OS-gebruikersaccount voor de Gateway als de host wordt gedeeld.

### Workspace-`.env`-bestanden

OpenClaw laadt workspace-lokale `.env`-bestanden voor agents en tools, maar laat die bestanden nooit stilzwijgend runtime-besturingsinstellingen van de Gateway overschrijven.

- Elke sleutel die begint met `OPENCLAW_*` wordt geblokkeerd vanuit niet-vertrouwde workspace-`.env`-bestanden.
- Kanaaleindpuntinstellingen voor Matrix, Mattermost, IRC en Synology Chat worden ook geblokkeerd voor overschrijvingen vanuit workspace-`.env`, zodat gekloonde workspaces meegeleverd connectorverkeer niet via lokale eindpuntconfiguratie kunnen omleiden. Eindpunt-omgevingssleutels (zoals `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) moeten afkomstig zijn uit de procesomgeving van de Gateway of uit `env.shellEnv`, niet uit een vanuit de workspace geladen `.env`.
- De blokkering is fail-closed: een nieuwe runtime-control-variabele die in een toekomstige release wordt toegevoegd, kan niet worden geërfd uit een ingecheckte of door een aanvaller aangeleverde `.env`; de sleutel wordt genegeerd en de Gateway behoudt zijn eigen waarde.
- Vertrouwde proces-/OS-omgevingsvariabelen (de eigen shell van de Gateway, launchd/systemd-unit, appbundel) blijven van toepassing - dit beperkt alleen het laden van `.env`-bestanden.

Waarom: workspace-`.env`-bestanden staan vaak naast agentcode, worden per ongeluk gecommit of door tools geschreven. Door de volledige prefix `OPENCLAW_*` te blokkeren, kan het later toevoegen van een nieuwe `OPENCLAW_*`-vlag nooit terugvallen op stille overerving vanuit de workspace-status.

### Logs en transcripties (redactie en bewaring)

Logs en transcripties kunnen gevoelige informatie lekken, zelfs wanneer toegangscontroles correct zijn:

- Gateway-logs kunnen toolsamenvattingen, fouten en URL's bevatten.
- Sessietranscripties kunnen geplakte geheimen, bestandsinhoud, opdrachtuitvoer en links bevatten.

Aanbevelingen:

- Laat redactie van logs en transcripties aan staan (`logging.redactSensitive: "tools"`; standaard).
- Voeg aangepaste patronen voor je omgeving toe via `logging.redactPatterns` (tokens, hostnamen, interne URL's).
- Geef bij het delen van diagnostiek de voorkeur aan `openclaw status --all` (plakbaar, geheimen geredigeerd) boven ruwe logs.
- Snoei oude sessietranscripties en logbestanden als je geen lange bewaring nodig hebt.

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

### Afzonderlijke nummers (WhatsApp, Signal, Telegram)

Overweeg voor kanalen op basis van telefoonnummers om je AI op een ander telefoonnummer te laten draaien dan je persoonlijke nummer:

- Persoonlijk nummer: je gesprekken blijven privé
- Botnummer: AI behandelt deze, met passende grenzen

### Alleen-lezenmodus (via sandbox en tools)

Je kunt een alleen-lezenprofiel maken door te combineren:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (of `"none"` voor geen workspace-toegang)
- allow-/deny-lijsten voor tools die `write`, `edit`, `apply_patch`, `exec`, `process`, enzovoort blokkeren.

Aanvullende opties voor verharding:

- `tools.exec.applyPatch.workspaceOnly: true` (standaard): zorgt ervoor dat `apply_patch` niet buiten de workspace-map kan schrijven/verwijderen, zelfs wanneer sandboxing uit staat. Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` bestanden buiten de workspace aanraakt.
- `tools.fs.workspaceOnly: true` (optioneel): beperkt `read`-/`write`-/`edit`-/`apply_patch`-paden en auto-laadpaden voor native promptafbeeldingen tot de workspace-map (handig als je vandaag absolute paden toestaat en één vangrail wilt).
- Houd filesystem-roots smal: vermijd brede roots zoals je homedirectory voor agentworkspaces/sandboxworkspaces. Brede roots kunnen gevoelige lokale bestanden (bijvoorbeeld status/configuratie onder `~/.openclaw`) blootstellen aan filesystem-tools.

### Veilige baseline (kopiëren/plakken)

Eén "safe default"-configuratie die de Gateway privé houdt, DM-koppeling vereist en altijd-aan groepsbots vermijdt:

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

Als je ook tooluitvoering "standaard veiliger" wilt maken, voeg dan een sandbox toe en weiger gevaarlijke tools voor elke niet-eigenaar-agent (voorbeeld hieronder onder "Toegangsprofielen per agent").

Ingebouwde baseline voor door chat aangestuurde agentbeurten: niet-eigenaar-afzenders kunnen de tools `cron` of `gateway` niet gebruiken.

## Sandboxing (aanbevolen)

Toegewijde documentatie: [Sandboxing](/nl/gateway/sandboxing)

Twee aanvullende benaderingen:

- **Draai de volledige Gateway in Docker** (containergrens): [Docker](/nl/install/docker)
- **Toolsandbox** (`agents.defaults.sandbox`, host-Gateway + door sandbox geïsoleerde tools; Docker is de standaardbackend): [Sandboxing](/nl/gateway/sandboxing)

<Note>
Om toegang tussen agents te voorkomen, houd je `agents.defaults.sandbox.scope` op `"agent"` (standaard) of `"session"` voor striktere isolatie per sessie. `scope: "shared"` gebruikt één container of workspace.
</Note>

Overweeg ook agentworkspacetoegang binnen de sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (standaard) houdt de agentworkspace buiten bereik; tools draaien tegen een sandboxworkspace onder `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` koppelt de agentworkspace alleen-lezen op `/agent` (schakelt `write`/`edit`/`apply_patch` uit)
- `agents.defaults.sandbox.workspaceAccess: "rw"` koppelt de agentworkspace lezen/schrijven op `/workspace`
- Extra `sandbox.docker.binds` worden gevalideerd tegen genormaliseerde en gecanonicaliseerde bronpaden. Parent-symlinktrucs en canonieke home-aliassen falen nog steeds gesloten als ze oplossen naar geblokkeerde roots zoals `/etc`, `/var/run` of credentialmappen onder de OS-home.

<Warning>
`tools.elevated` is de globale baseline-escape hatch die exec buiten de sandbox uitvoert. De effectieve host is standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`. Houd `tools.elevated.allowFrom` strikt en schakel dit niet in voor vreemden. Je kunt elevated per agent verder beperken via `agents.list[].tools.elevated`. Zie [Elevated mode](/nl/tools/elevated).
</Warning>

### Vangrail voor sub-agentdelegatie

Als je sessietools toestaat, behandel gedelegeerde sub-agentruns dan als een andere grensbeslissing:

- Weiger `sessions_spawn` tenzij de agent echt delegatie nodig heeft.
- Houd `agents.defaults.subagents.allowAgents` en eventuele per-agent-overschrijvingen van `agents.list[].subagents.allowAgents` beperkt tot bekende veilige doelagents.
- Roep voor elke workflow die gesandboxed moet blijven `sessions_spawn` aan met `sandbox: "require"` (standaard is `inherit`).
- `sandbox: "require"` faalt snel wanneer de doel-childruntime niet gesandboxed is.

## Risico's van browserbesturing

Het inschakelen van browserbesturing geeft het model de mogelijkheid om een echte browser te besturen.
Als dat browserprofiel al ingelogde sessies bevat, kan het model
toegang krijgen tot die accounts en gegevens. Behandel browserprofielen als **gevoelige status**:

- Geef de voorkeur aan een toegewezen profiel voor de agent (het standaardprofiel `openclaw`).
- Vermijd het wijzen van de agent naar je persoonlijke dagelijkse profiel.
- Houd hostbrowserbesturing uitgeschakeld voor gesandboxte agents, tenzij je ze vertrouwt.
- De standalone loopback-API voor browserbesturing accepteert alleen gedeelde-geheim-authenticatie
  (gateway token bearer auth of gatewaywachtwoord). Deze gebruikt geen
  trusted-proxy- of Tailscale Serve-identiteitsheaders.
- Behandel browserdownloads als niet-vertrouwde invoer; geef de voorkeur aan een geïsoleerde downloadmap.
- Schakel browsersynchronisatie/wachtwoordbeheerders in het agentprofiel uit als dat mogelijk is (verkleint de blast radius).
- Ga er bij externe gateways van uit dat "browserbesturing" gelijkstaat aan "operator-toegang" tot alles wat dat profiel kan bereiken.
- Houd de Gateway- en node-hosts alleen-tailnet; vermijd het blootstellen van browserbesturingspoorten aan LAN of het openbare internet.
- Schakel browserproxyrouting uit wanneer je die niet nodig hebt (`gateway.nodes.browser.mode="off"`).
- Chrome MCP-modus voor bestaande sessies is **niet** "veiliger"; deze kan namens jou handelen in alles wat dat host-Chrome-profiel kan bereiken.

### Browser-SSRF-beleid (standaard strikt)

Het browsernavigatiebeleid van OpenClaw is standaard strikt: privé/interne bestemmingen blijven geblokkeerd tenzij je expliciet opt-in inschakelt.

- Standaard: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is niet ingesteld, dus browsernavigatie houdt privé/interne/special-use-bestemmingen geblokkeerd.
- Legacy-alias: `browser.ssrfPolicy.allowPrivateNetwork` wordt nog steeds geaccepteerd voor compatibiliteit.
- Opt-inmodus: stel `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` in om privé/interne/special-use-bestemmingen toe te staan.
- Gebruik in strikte modus `hostnameAllowlist` (patronen zoals `*.example.com`) en `allowedHostnames` (exacte hostuitzonderingen, inclusief geblokkeerde namen zoals `localhost`) voor expliciete uitzonderingen.
- Navigatie wordt vóór het verzoek gecontroleerd en na navigatie naar best effort opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL om redirect-gebaseerde pivots te verminderen.

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

Met multi-agentrouting kan elke agent een eigen sandbox- en toolbeleid hebben:
gebruik dit om per agent **volledige toegang**, **alleen-lezen** of **geen toegang** te geven.
Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor volledige details
en voorrangsregels.

Veelvoorkomende use cases:

- Persoonlijke agent: volledige toegang, geen sandbox
- Familie-/werkagent: gesandboxed + alleen-lezentools
- Publieke agent: gesandboxed + geen filesystem-/shelltools

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

### Voorbeeld: alleen-lezentools + alleen-lezenworkspace

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

### Voorbeeld: geen filesystem-/shelltoegang (providerberichten toegestaan)

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

### Indammen

1. **Stop het:** stop de macOS-app (als die de Gateway superviseert) of beëindig je `openclaw gateway`-proces.
2. **Sluit blootstelling af:** stel `gateway.bind: "loopback"` in (of schakel Tailscale Funnel/Serve uit) totdat je begrijpt wat er is gebeurd.
3. **Bevries toegang:** zet risicovolle DM's/groepen op `dmPolicy: "disabled"` / vereis vermeldingen, en verwijder `"*"`-vermeldingen die alles toestaan als je die had.

### Roteren (ga uit van compromittering als geheimen zijn gelekt)

1. Roteer Gateway-authenticatie (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) en herstart.
2. Roteer externe clientgeheimen (`gateway.remote.token` / `.password`) op elke machine die de Gateway kan aanroepen.
3. Roteer provider-/API-inloggegevens (WhatsApp-inloggegevens, Slack/Discord-tokens, model-/API-sleutels in `auth-profiles.json`, en versleutelde geheime payloadwaarden wanneer gebruikt).

### Controleren

1. Controleer Gateway-logboeken: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (of `logging.file`).
2. Bekijk de relevante transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Bekijk recente configuratiewijzigingen (alles wat toegang kan hebben verruimd: `gateway.bind`, `gateway.auth`, DM-/groepsbeleid, `tools.elevated`, Plugin-wijzigingen).
4. Voer `openclaw security audit --deep` opnieuw uit en bevestig dat kritieke bevindingen zijn opgelost.

### Verzamelen voor een rapport

- Tijdstempel, host-besturingssysteem van de gateway + OpenClaw-versie
- De sessietranscript(s) + een korte logstaart (na redactie)
- Wat de aanvaller heeft gestuurd + wat de agent heeft gedaan
- Of de Gateway buiten loopback was blootgesteld (LAN/Tailscale Funnel/Serve)

## Geheimscanning

CI voert de pre-commit-hook `detect-private-key` uit over de repository. Als die
mislukt, verwijder of roteer dan het gecommitte keymateriaal en reproduceer dit vervolgens lokaal:

```bash
pre-commit run --all-files detect-private-key
```

## Beveiligingsproblemen melden

Een kwetsbaarheid in OpenClaw gevonden? Meld deze verantwoord:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Plaats niets openbaar totdat het is opgelost
3. We vermelden je naam (tenzij je liever anoniem blijft)
