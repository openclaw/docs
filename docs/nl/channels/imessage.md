---
read_when:
    - iMessage-ondersteuning instellen
    - Problemen met het verzenden/ontvangen van iMessage oplossen
summary: Native iMessage-ondersteuning via imsg (JSON-RPC via stdio), met private API-acties voor antwoorden, tapbacks, effecten, peilingen, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-configuraties wanneer aan de hostvereisten wordt voldaan.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T15:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Voor de gebruikelijke OpenClaw iMessage-implementatie voer je de Gateway en `imsg` uit op dezelfde macOS-host waarop bij Berichten is ingelogd. Als je Gateway elders draait, laat je `channels.imessage.cliPath` verwijzen naar een transparante SSH-wrapper die `imsg` op de Mac uitvoert.

**Inkomend herstel verloopt automatisch.** Na een herstart van de bridge of Gateway speelt iMessage de berichten opnieuw af die tijdens de uitval zijn gemist en onderdrukt het de verouderde 'backlogbom' die Apple na Push-herstel kan uitsturen, met deduplicatie zodat niets tweemaal wordt doorgestuurd. Er is geen configuratie nodig om dit in te schakelen — zie [Inkomend herstel na een herstart van de bridge of Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Ondersteuning voor BlueBubbles is verwijderd. Migreer `channels.bluebubbles`-configuraties naar `channels.imessage`; OpenClaw ondersteunt iMessage alleen via `imsg`. Begin met [Verwijdering van BlueBubbles en het imsg-pad voor iMessage](/nl/announcements/bluebubbles-imessage) voor de korte aankondiging, of [Overstappen van BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige migratietabel.
</Warning>

Status: native externe CLI-integratie. De Gateway start `imsg rpc` en communiceert via stdio met JSON-RPC — zonder afzonderlijke daemon of poort. De Private API-modus wordt sterk aanbevolen voor een volledig iMessage-kanaal; antwoorden, tapbacks, effecten, peilingen, antwoorden op bijlagen en groepsacties vereisen `imsg launch` en een geslaagde Private API-controle.

Voor de gebruikelijke lokale configuratie kan de OpenClaw-installatie, na bevestiging door de gebruiker, aanbieden om `imsg` via Homebrew te installeren of bij te werken op de Mac waarop bij Berichten is ingelogd. Handmatige configuraties en topologieën met SSH-wrappers blijven door de beheerder beheerd: installeer of werk `imsg` bij binnen dezelfde gebruikerscontext waarin de Gateway of wrapper wordt uitgevoerd.

<CardGroup cols={3}>
  <Card title="Private API-acties" icon="wand-sparkles" href="#private-api-actions">
    Antwoorden, tapbacks, effecten, peilingen, bijlagen en groepsbeheer.
  </Card>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Privéberichten via iMessage gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Externe Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gebruik een SSH-wrapper wanneer de Gateway niet op de Berichten-Mac draait.
  </Card>
  <Card title="Configuratiereferentie" icon="settings" href="/nl/gateway/config-channels#imessage">
    Volledige referentie voor iMessage-velden.
  </Card>
</CardGroup>

## Snelle configuratie

<Tabs>
  <Tab title="Lokale Mac (snelste route)">
    <Steps>
      <Step title="imsg installeren en verifiëren">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Wanneer de lokale configuratiewizard een ontbrekende standaardopdracht `imsg` detecteert, kan deze vragen om `steipete/tap/imsg` via Homebrew te installeren. Als de wizard een door Homebrew beheerde `imsg` detecteert, kan deze vragen om die opnieuw te installeren of bij te werken. Aangepaste `cliPath`-wrappers worden niet gewijzigd.

      </Step>

      <Step title="OpenClaw configureren">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Eerste koppeling voor privéberichten goedkeuren (standaard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Koppelingsverzoeken verlopen na 1 uur.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Externe Mac via SSH">
    Voor de meeste configuraties is SSH niet nodig. Gebruik deze topologie alleen wanneer de Gateway niet kan draaien op de Mac waarop bij Berichten is ingelogd. OpenClaw vereist alleen een stdio-compatibele `cliPath`, zodat je `cliPath` kunt laten verwijzen naar een wrapperscript dat via SSH verbinding maakt met een externe Mac en `imsg` uitvoert.
    Installeer en werk `imsg` bij op die externe Mac, niet op de Gateway-host:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Aanbevolen configuratie wanneer bijlagen zijn ingeschakeld:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Als `remoteHost` niet is ingesteld, probeert OpenClaw dit automatisch te detecteren door het SSH-wrapperscript te ontleden.
    `remoteHost` moet `host` of `user@host` zijn (geen spaties of SSH-opties); onveilige waarden worden genegeerd.
    OpenClaw gebruikt strikte controle van hostsleutels voor SCP, dus de hostsleutel van de relayhost moet al aanwezig zijn in `~/.ssh/known_hosts`.
    Paden naar bijlagen worden gevalideerd aan de hand van toegestane hoofdmappen (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Elke `cliPath`-wrapper of SSH-proxy die je vóór `imsg` plaatst, MOET zich gedragen als een transparante stdio-pipe voor langdurige JSON-RPC-verbindingen. OpenClaw wisselt gedurende de volledige levensduur van het kanaal kleine, door nieuwe regels gescheiden JSON-RPC-berichten uit via stdin/stdout van de wrapper:

- Stuur elk stdin-fragment of elke stdin-regel door **zodra bytes beschikbaar zijn** — wacht niet op EOF.
- Stuur elk stdout-fragment of elke stdout-regel direct in de omgekeerde richting door.
- Behoud nieuwe regels.
- Vermijd blokkerende leesbewerkingen met een vaste grootte (`read(4096)`, `cat | buffer`, standaard-shell-`read`) die kleine frames kunnen uithongeren.
- Houd stderr gescheiden van de JSON-RPC-stream op stdout.

Een wrapper die stdin buffert totdat een groot blok vol is, veroorzaakt symptomen die op een iMessage-storing lijken — `imsg rpc timeout (chats.list)` of herhaalde herstarts van het kanaal — hoewel `imsg rpc` zelf goed functioneert. `ssh -T host imsg "$@"` (hierboven) is veilig omdat deze de `cliPath`-argumenten van OpenClaw doorstuurt, zoals `rpc` en `--db`. Pipelines zoals `ssh host imsg | grep -v '^DEBUG'` zijn dat NIET — hulpmiddelen met regelbuffering kunnen frames nog steeds vasthouden; gebruik `stdbuf -oL -eL` in elke fase als je moet filteren.
</Warning>

  </Tab>
</Tabs>

## Vereisten en machtigingen (macOS)

- Op de Mac waarop `imsg` draait, moet bij Berichten zijn ingelogd.
- Volledige schijftoegang is vereist voor de procescontext waarin OpenClaw/`imsg` wordt uitgevoerd (toegang tot de Berichten-database).
- Automatiseringsmachtiging is vereist om berichten via Messages.app te verzenden.
- Voor geavanceerde acties (reageren / bewerken / verzending ongedaan maken / antwoorden in een thread / effecten / peilingen / groepsbewerkingen) moet System Integrity Protection zijn uitgeschakeld — zie [De Private API van imsg inschakelen](#enabling-the-imsg-private-api). Het verzenden en ontvangen van gewone tekst en media werkt zonder deze wijziging.

<Tip>
Machtigingen worden per procescontext verleend. Als de Gateway headless draait (LaunchAgent/SSH), voer je eenmaal interactief een opdracht uit in diezelfde context om de prompts te activeren:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Verzenden via SSH-wrapper mislukt met AppleEvents -1743">
  Een configuratie via externe SSH kan chats lezen, slagen voor `channels status --probe` en inkomende berichten verwerken, terwijl het verzenden van uitgaande berichten nog steeds mislukt met een AppleEvents-autorisatiefout:

```text
Niet gemachtigd om Apple-events naar Berichten te sturen. (-1743)
```

Controleer de TCC-database van de ingelogde Mac-gebruiker of System Settings > Privacy & Security > Automation. Als de automatiseringsvermelding is vastgelegd voor `/usr/libexec/sshd-keygen-wrapper` in plaats van voor `imsg` of het lokale shellproces, biedt macOS mogelijk geen bruikbare Berichten-schakelaar voor die client aan de serverzijde van SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In die toestand kunnen het herhalen van `tccutil reset AppleEvents` of het opnieuw uitvoeren van `imsg send` via dezelfde SSH-wrapper blijven mislukken, omdat de procescontext die automatisering van Berichten nodig heeft de SSH-wrapper is, en niet een app waaraan de gebruikersinterface toestemming kan verlenen.

Gebruik in plaats daarvan een van de ondersteunde `imsg`-procescontexten:

- Voer de Gateway, of ten minste de `imsg`-bridge, uit in de lokale sessie van de ingelogde Berichten-gebruiker.
- Start de Gateway met een LaunchAgent voor die gebruiker nadat je vanuit dezelfde sessie volledige schijftoegang en automatiseringsmachtiging hebt verleend.
- Als je de SSH-topologie met twee gebruikers behoudt, controleer dan of een echte uitgaande `imsg send` slaagt via exact dezelfde wrapper voordat je het kanaal inschakelt. Als hiervoor geen automatiseringsmachtiging kan worden verleend, configureer dan een `imsg`-configuratie met één gebruiker in plaats van voor verzending op de SSH-wrapper te vertrouwen.

</Accordion>

## De Private API van imsg inschakelen

`imsg` wordt geleverd met twee operationele modi. Voor OpenClaw is de Private API-modus de aanbevolen configuratie, omdat deze het kanaal de native iMessage-acties biedt die gebruikers verwachten. De basismodus blijft nuttig voor installaties met een laag risico, initiële verificatie of hosts waarop SIP niet kan worden uitgeschakeld.

- **Basismodus** (standaard, geen SIP-wijzigingen nodig): uitgaande tekst en media via `send`, bewaking/geschiedenis van inkomende berichten en de chatlijst. Dit krijg je standaard met een nieuwe `brew install steipete/tap/imsg` plus de hierboven genoemde standaardmachtigingen van macOS.
- **Private API-modus**: `imsg` injecteert een ondersteunende dylib in `Messages.app` om interne `IMCore`-functies aan te roepen. Hiermee worden `react`, `edit`, `unsend`, `reply` (in een thread), `sendWithEffect`, `poll` en `poll-vote` (native peilingen van Berichten), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, typindicatoren en leesbevestigingen beschikbaar.

Voor de aanbevolen acties op deze pagina is de Private API-modus vereist. De README van `imsg` vermeldt deze vereiste expliciet:

> Geavanceerde functies zoals `read`, `typing`, `launch`, uitgebreide verzending via een bridge, berichtwijziging en chatbeheer zijn optioneel. Ze vereisen dat SIP is uitgeschakeld en dat een ondersteunende dylib in `Messages.app` wordt geïnjecteerd. `imsg launch` weigert te injecteren wanneer SIP is ingeschakeld.

De techniek voor het injecteren van de helper gebruikt de eigen dylib van `imsg` om toegang te krijgen tot de private API's van Berichten. Het iMessage-pad van OpenClaw bevat geen server van derden of BlueBubbles-runtime.

<Warning>
**Het uitschakelen van SIP is een echte afweging op het gebied van beveiliging.** SIP is een van de belangrijkste macOS-beveiligingen tegen het uitvoeren van gewijzigde systeemcode; als je dit systeembreed uitschakelt, ontstaan extra aanvalsoppervlak en neveneffecten. Met name geldt dat **het uitschakelen van SIP op Macs met Apple Silicon ook de mogelijkheid uitschakelt om iOS-apps op je Mac te installeren en uit te voeren**.

Behandel dit als een bewuste operationele keuze, vooral op een primaire persoonlijke Mac. Gebruik voor een productiegeschikte OpenClaw-configuratie voor iMessage bij voorkeur een speciale Mac of een speciale macOS-botgebruiker waarop je de bridge met een gerust gevoel kunt inschakelen. Als je dreigingsmodel nergens toestaat dat SIP is uitgeschakeld, is de gebundelde iMessage-functionaliteit beperkt tot de basismodus — alleen tekst en media verzenden en ontvangen, zonder reacties / bewerken / verzending ongedaan maken / effecten / groepsbewerkingen.
</Warning>

### Configuratie

1. **Installeer (of upgrade) `imsg`** op de Mac waarop Messages.app draait:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   De uitvoer van `imsg status --json` rapporteert `bridge_version`, `rpc_methods` en `selectors` per methode, zodat je kunt zien wat de huidige build ondersteunt voordat je begint.

2. **Schakel System Integrity Protection en (op moderne macOS-versies) Library Validation uit.** Voor het injecteren van een niet-Apple-helper-dylib in het door Apple ondertekende `Messages.app` moet SIP zijn uitgeschakeld **en** Library Validation zijn versoepeld. De SIP-stap in de herstelmodus verschilt per macOS-versie:
   - **macOS 10.13-10.15 (Sierra-Catalina):** schakel Library Validation uit via Terminal, start opnieuw op in de herstelmodus, voer `csrutil disable` uit en start opnieuw op.
   - **macOS 11+ (Big Sur en nieuwer), Intel:** open de herstelmodus (of Internet Recovery), voer `csrutil disable` uit en start opnieuw op.
   - **macOS 11+, Apple Silicon:** gebruik de opstartprocedure met de aan-uitknop om de herstelmodus te openen; houd op recente macOS-versies de **Left Shift**-toets ingedrukt wanneer je op Continue klikt en voer vervolgens `csrutil disable` uit. Voor virtuele machines geldt een afzonderlijke procedure, dus maak eerst een VM-momentopname.

   **Op macOS 11 en nieuwer is alleen `csrutil disable` doorgaans niet voldoende.** Apple dwingt Library Validation nog steeds af voor `Messages.app` als platformbinary, waardoor een ad-hoc ondertekende helper wordt geweigerd (`Library Validation failed: ... platform binary, but mapped file is not`), zelfs als SIP is uitgeschakeld. Schakel na SIP ook Library Validation uit en start opnieuw op:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), geverifieerd op 26.5.1:** uitgeschakelde SIP **plus** de bovenstaande opdracht `DisableLibraryValidation` volstaat om de helper te injecteren in versies 26.0 tot en met 26.5.x. **Er zijn geen boot-args vereist.** De plist is de beslissende factor en de vaakst ontbrekende stap wanneer injectie op Tahoe mislukt:
   - **Met de plist:** `imsg launch` injecteert en `imsg status` meldt `advanced_features: true`.
   - **Zonder de plist (zelfs met uitgeschakelde SIP):** `imsg launch` mislukt met `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI weigert de ad-hoc helper tijdens het laden, waardoor de bridge nooit gereed is en het starten een time-out bereikt. Die time-out is het symptoom dat de meeste mensen op Tahoe tegenkomen; de oplossing is de bovenstaande plist, niet iets ingrijpenders.

   Als de injectie van `imsg launch` of specifieke `selectors` na een macOS-upgrade false beginnen te retourneren, is deze beveiligingscontrole meestal de oorzaak. Controleer de status van SIP en Library Validation voordat je aanneemt dat de SIP-stap zelf is mislukt. Als die instellingen correct zijn en de bridge nog steeds niet kan injecteren, verzamel dan `imsg status --json` plus de uitvoer van `imsg launch` en meld dit bij het project `imsg`, in plaats van aanvullende systeembrede beveiligingsmaatregelen te verzwakken.

3. **Injecteer de helper.** Met SIP uitgeschakeld en aangemeld bij Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` weigert te injecteren wanneer SIP nog is ingeschakeld, dus dit dient ook als bevestiging dat stap 2 is uitgevoerd.

4. **Verifieer de bridge vanuit OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   De iMessage-vermelding moet `works` melden en `imsg status --json | jq '{rpc_methods, selectors}'` moet de mogelijkheden tonen die door jouw macOS-build beschikbaar worden gesteld. Voor het maken van peilingen is `selectors.pollPayloadMessage` vereist; voor stemmen zijn zowel `selectors.pollVoteMessage` als de RPC-methode `poll.vote` vereist. De OpenClaw-plugin kondigt alleen acties aan die door de gecachte probe worden ondersteund, terwijl een lege cache optimistisch blijft en bij de eerste verzending een probe uitvoert.

Als `openclaw channels status --probe` het kanaal als `works` meldt, maar specifieke acties tijdens de verzending de fout "iMessage `<action>` vereist de private-API-bridge van imsg" geven, voer `imsg launch` dan opnieuw uit — de helper kan wegvallen (herstart van Messages.app, OS-update enzovoort) en de gecachte status `available: true` blijft acties aankondigen totdat de volgende probe deze vernieuwt.

### Wanneer SIP ingeschakeld blijft

Als het uitschakelen van SIP niet acceptabel is voor jouw dreigingsmodel:

- `imsg` valt terug op de basismodus — alleen tekst + media + ontvangen.
- De OpenClaw-plugin biedt nog steeds het verzenden van tekst/media en de bewaking van inkomende berichten aan; de plugin verbergt `react`, `edit`, `unsend`, `reply`, `sendWithEffect` en groepsbewerkingen op het actieoppervlak (volgens de capability-gate per methode).
- Je kunt een afzonderlijke Mac zonder Apple Silicon (of een speciale bot-Mac) met uitgeschakelde SIP gebruiken voor de iMessage-workload, terwijl SIP op je primaire apparaten ingeschakeld blijft. Zie hieronder [Speciale macOS-botgebruiker (afzonderlijke iMessage-identiteit)](#deployment-patterns).

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.imessage.dmPolicy` beheert directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één vermelding in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Toegestane-lijstveld: `channels.imessage.allowFrom`.

    Vermeldingen in de toegestane lijst moeten afzenders identificeren: handles of statische afzendertoegangsgroepen (`accessGroup:<name>`). Gebruik `channels.imessage.groupAllowFrom` voor chatdoelen zoals `chat_id:*`, `chat_guid:*` of `chat_identifier:*`; gebruik `channels.imessage.groups` voor numerieke `chat_id`-registersleutels.

  </Tab>

  <Tab title="Groepsbeleid + vermeldingen">
    `channels.imessage.groupPolicy` beheert de afhandeling van groepen:

    - `allowlist` (standaard)
    - `open`
    - `disabled`

    Toegestane lijst voor groepsafzenders: `channels.imessage.groupAllowFrom`.

    Vermeldingen in `groupAllowFrom` kunnen ook verwijzen naar statische afzendertoegangsgroepen (`accessGroup:<name>`).

    Runtime-terugval: als `groupAllowFrom` niet is ingesteld, gebruiken controles van iMessage-groepsafzenders `allowFrom`; stel `groupAllowFrom` in wanneer toelating voor DM's en groepen moet verschillen. Een expliciet lege `groupAllowFrom: []` valt niet terug — deze blokkeert alle groepsafzenders onder `allowlist`.
    Runtime-opmerking: als `channels.imessage` volledig ontbreekt, valt de runtime terug op `groupPolicy="allowlist"` en wordt een waarschuwing gelogd (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    <Warning>
    Groepsroutering onder `groupPolicy: "allowlist"` voert **twee** gates direct na elkaar uit:

    1. **Toegestane lijst voor afzenders** (`channels.imessage.groupAllowFrom`) — handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` of `chat_id`. Een lege effectieve lijst (geen `groupAllowFrom` en geen terugval op `allowFrom`) blokkeert elke groepsafzender.
    2. **Groepsregister** (`channels.imessage.groups`) — wordt afgedwongen zodra de toewijzing vermeldingen bevat: de chat moet overeenkomen met een expliciete vermelding per `chat_id` of een jokerteken `groups: { "*": { ... } }`. Wanneer `groups` leeg is of ontbreekt, bepaalt alleen de toegestane lijst voor afzenders de toelating.

    Als er geen effectieve toegestane lijst voor groepsafzenders is geconfigureerd, wordt elk groepsbericht verwijderd vóór de register-gate. Elke gate heeft een eigen signaal op `warn`-niveau bij het standaardlogniveau, en elk signaal noemt een andere oplossing:

    - eenmalig per account bij het opstarten, wanneer de effectieve toestemmingslijst voor groepsafzenders leeg is: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — los dit op door `channels.imessage.groupAllowFrom` (of `allowFrom`) in te stellen; alleen vermeldingen aan `groups` toevoegen zorgt ervoor dat poort 1 elke afzender blijft blokkeren.
    - eenmalig per `chat_id` tijdens runtime, wanneer een afzender poort 1 is gepasseerd maar de chat ontbreekt in een gevuld `groups`-register: `imessage: dropping group message from chat_id=<id> ...` — los dit op door die `chat_id` (of `"*"`) onder `channels.imessage.groups` toe te voegen.

    DM's worden niet beïnvloed — die volgen een ander codepad.

    Aanbevolen configuratie voor groepsverkeer onder `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Alleen `groupAllowFrom` staat die afzenders in elke groep toe; voeg het `groups`-blok toe om te bepalen welke chats zijn toegestaan (en om opties per chat in te stellen, zoals `requireMention`).
    </Warning>

    Vermeldingscontrole voor groepen:

    - iMessage heeft geen systeemeigen metagegevens voor vermeldingen
    - vermeldingsdetectie gebruikt regexpatronen (`agents.list[].groupChat.mentionPatterns`, met `messages.groupChat.mentionPatterns` als terugvaloptie)
    - zonder geconfigureerde patronen kan vermeldingscontrole niet worden afgedwongen
    - besturingsopdrachten van geautoriseerde afzenders omzeilen de vermeldingscontrole

    `systemPrompt` per groep:

    Elke vermelding onder `channels.imessage.groups.*` accepteert een optionele `systemPrompt`-tekenreeks, die bij elke beurt waarin een bericht in die groep wordt verwerkt in de systeemprompt van de agent wordt ingevoegd. De resolutie werkt hetzelfde als bij `channels.whatsapp.groups`:

    1. **Groepsspecifieke systeemprompt** (`groups["<chat_id>"].systemPrompt`): wordt gebruikt wanneer de specifieke groepsvermelding in de toewijzing bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt het jokerteken onderdrukt en wordt er geen systeemprompt op die groep toegepast.
    2. **Systeemprompt met groepsjokerteken** (`groups["*"].systemPrompt`): wordt gebruikt wanneer de specifieke groepsvermelding volledig ontbreekt in de toewijzing, of wanneer deze wel bestaat maar geen sleutel `systemPrompt` definieert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Gebruik de Britse spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "Dit is de chat voor de bereikbaarheidsdienst. Beperk antwoorden tot maximaal 3 zinnen.",
            },
            "9907": {
              // expliciete onderdrukking: het jokerteken "Gebruik de Britse spelling." is hier niet van toepassing
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts per groep zijn alleen van toepassing op groepsberichten — directe berichten worden niet beïnvloed.

  </Tab>

  <Tab title="Sessies en deterministische antwoorden">
    - DM's gebruiken directe routering; groepen gebruiken groepsroutering.
    - Met de standaardwaarde `session.dmScope=main` worden iMessage-DM's samengevoegd in de hoofdsessie van de agent.
    - Groepssessies zijn geïsoleerd (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antwoorden worden met behulp van de kanaal- en doelmetagegevens van de oorsprong teruggestuurd naar iMessage.

    Gedrag van groepachtige gesprekken:

    Sommige iMessage-gesprekken met meerdere deelnemers kunnen binnenkomen met `is_group=false`.
    Als die `chat_id` expliciet onder `channels.imessage.groups` is geconfigureerd, behandelt OpenClaw dit als groepsverkeer (groepscontrole + isolatie van de groepssessie).

  </Tab>
</Tabs>

## ACP-gespreksbindingen

iMessage-chats kunnen aan ACP-sessies worden gebonden.

Snelle procedure voor operators:

- Voer `/acp spawn codex --bind here` uit in de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde iMessage-gesprek worden naar de gestarte ACP-sessie gerouteerd.
- `/new` en `/reset` stellen dezelfde gebonden ACP-sessie ter plaatse opnieuw in.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde permanente bindingen gebruiken `bindings[]`-vermeldingen op het hoogste niveau met `type: "acp"` en `match.channel: "imessage"`.

`match.peer.id` kan het volgende gebruiken:

- genormaliseerde DM-handle, zoals `+15555550123` of `user@example.com`
- `chat_id:<id>` (aanbevolen voor stabiele groepsbindingen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Voorbeeld:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Zie [ACP-agents](/nl/tools/acp-agents) voor het gedeelde gedrag van ACP-bindingen.

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciale macOS-gebruiker voor de bot (afzonderlijke iMessage-identiteit)">
    Gebruik een speciale Apple ID en macOS-gebruiker, zodat botverkeer gescheiden blijft van je persoonlijke Berichten-profiel.

    Gebruikelijke procedure:

    1. Maak/log in bij een speciale macOS-gebruiker.
    2. Log bij Berichten in met de Apple ID van de bot voor die gebruiker.
    3. Installeer `imsg` voor die gebruiker.
    4. Maak een SSH-wrapper zodat OpenClaw `imsg` in de context van die gebruiker kan uitvoeren.
    5. Laat `channels.imessage.accounts.<id>.cliPath` en `.dbPath` naar dat gebruikersprofiel verwijzen.

    Bij de eerste uitvoering kunnen GUI-goedkeuringen (Automatisering + Volledige schijftoegang) vereist zijn in de gebruikerssessie van die bot.

  </Accordion>

  <Accordion title="Externe Mac via Tailscale (voorbeeld)">
    Gebruikelijke topologie:

    - Gateway draait op Linux/VM
    - iMessage + `imsg` draait op een Mac in je tailnet
    - `cliPath`-wrapper gebruikt SSH om `imsg` uit te voeren
    - `remoteHost` maakt het ophalen van bijlagen via SCP mogelijk

    Voorbeeld:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Gebruik SSH-sleutels zodat zowel SSH als SCP niet-interactief zijn.
    Zorg eerst dat de hostsleutel wordt vertrouwd (bijvoorbeeld `ssh bot@mac-mini.tailnet-1234.ts.net`), zodat `known_hosts` wordt gevuld.

  </Accordion>

  <Accordion title="Patroon voor meerdere accounts">
    iMessage ondersteunt configuratie per account onder `channels.imessage.accounts`.

    Elk account kan velden overschrijven, zoals `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geschiedenisinstellingen en toegestane hoofdpaden voor bijlagen.

  </Accordion>

  <Accordion title="Geschiedenis van privéberichten">
    Stel `channels.imessage.dmHistoryLimit` in om nieuwe privéberichtsessies te voorzien van recente, gedecodeerde `imsg`-geschiedenis voor dat gesprek. Gebruik `channels.imessage.dms["<sender>"].historyLimit` voor overschrijvingen per afzender, waaronder `0` om geschiedenis voor een afzender uit te schakelen.

    De geschiedenis van iMessage-privéberichten wordt op aanvraag opgehaald uit `imsg`. Als `dmHistoryLimit` niet is ingesteld, wordt het globaal aanvullen met privéberichtgeschiedenis uitgeschakeld, maar een positieve `channels.imessage.dms["<sender>"].historyLimit` per afzender schakelt het aanvullen voor die afzender nog steeds in.

  </Accordion>
</AccordionGroup>

## Media, segmentering en afleveringsdoelen

<AccordionGroup>
  <Accordion title="Bijlagen en media">
    - het verwerken van inkomende bijlagen is **standaard uitgeschakeld** — stel `channels.imessage.includeAttachments: true` in om foto's, gesproken memo's, video's en andere bijlagen naar de agent door te sturen. Als dit is uitgeschakeld, worden iMessages die alleen een bijlage bevatten verwijderd voordat ze de agent bereiken en produceren ze mogelijk helemaal geen `Inbound message`-logregel.
    - externe bijlagepaden kunnen via SCP worden opgehaald wanneer `remoteHost` is ingesteld
    - bijlagepaden moeten overeenkomen met toegestane hoofdpaden:
      - `channels.imessage.attachmentRoots` (lokaal)
      - `channels.imessage.remoteAttachmentRoots` (externe SCP-modus)
      - geconfigureerde hoofdpaden breiden het standaardpatroon `/Users/*/Library/Messages/Attachments` uit (samengevoegd, niet vervangen)
    - SCP gebruikt strikte controle van hostsleutels (`StrictHostKeyChecking=yes`)
    - de grootte van uitgaande media gebruikt `channels.imessage.mediaMaxMb` (standaard 16 MB)

  </Accordion>

  <Accordion title="Uitgaande tekst en segmentering">
    - limiet voor tekstsegmenten: `channels.imessage.textChunkLimit` (standaard 4000)
    - segmenteringsmodus: `channels.imessage.streaming.chunkMode`
      - `length` (standaard)
      - `newline` (eerst splitsen op alinea's)
    - uitgaande Markdown voor vet/cursief/onderstrepen/doorhalen wordt omgezet in tekst met systeemeigen opmaak (ontvangers met macOS 15+ geven de opmaak weer; oudere ontvangers zien platte tekst zonder de markeringen); Markdown-tabellen worden omgezet volgens de Markdown-tabelmodus van het kanaal
    - `channels.imessage.sendTransport` (`auto` standaard, `bridge`, `applescript`) bepaalt hoe `imsg` berichten aflevert

  </Accordion>

  <Accordion title="Adresseringsindelingen">
    Expliciete voorkeursdoelen:

    - `chat_id:123` (aanbevolen voor stabiele routering)
    - `chat_guid:...`
    - `chat_identifier:...`

    Doelen op basis van een gebruikersadres worden ook ondersteund:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Acties van de privé-API

Wanneer `imsg launch` actief is en `openclaw channels status --probe` `privateApi.available: true` rapporteert, kan het berichtenhulpmiddel naast normale tekstberichten ook systeemeigen iMessage-acties gebruiken.

Alle acties zijn standaard ingeschakeld; gebruik `channels.imessage.actions` om afzonderlijke acties uit te schakelen:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Beschikbare acties">
    - **react**: Voeg iMessage-tapbacks toe of verwijder ze (`messageId`, `emoji`, `remove`). Ondersteunde tapbacks komen overeen met liefde, leuk, niet leuk, lachen, benadrukken en vraagteken. Verwijderen zonder emoji wist de ingestelde tapback.
    - **reply**: Stuur een antwoord in een thread op een bestaand bericht (`messageId`, `text` of `message`, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`). Voor antwoorden met een bijlage is daarnaast een `imsg`-build vereist waarvan `send-rich` `--file` ondersteunt.
    - **sendWithEffect**: Stuur tekst met een iMessage-effect (`text` of `message`, `effect` of `effectId`). Korte namen: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Bewerk een verzonden bericht op ondersteunde versies van macOS/de privé-API (`messageId`, `text` of `newText`). Alleen berichten die de Gateway zelf heeft verzonden, kunnen worden bewerkt.
    - **unsend**: Trek een verzonden bericht in op ondersteunde versies van macOS/de privé-API (`messageId`). Alleen berichten die de Gateway zelf heeft verzonden, kunnen worden ingetrokken.
    - **upload-file**: Stuur media/bestanden (`buffer` als base64 of een gevulde `media`/`path`/`filePath`, `filename`, optioneel `asVoice`). Verouderde alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Beheer groepsgesprekken wanneer het huidige doel een groepsgesprek is. Deze wijzigen de Berichten-identiteit van de host en vereisen daarom een afzender die eigenaar is of een `operator.admin`-Gateway-client.
    - **poll**: Maak een systeemeigen peiling in Apple Berichten (`pollQuestion`, `pollOption` 2 tot 12 keer herhaald, plus `chatGuid`, `chatId`, `chatIdentifier` of `to`). Ontvangers met iOS/iPadOS/macOS 26+ zien de peiling en kunnen er systeemeigen op stemmen; oudere OS-versies krijgen als terugval de tekst "Een peiling verzonden". Vereist `selectors.pollPayloadMessage`.
    - **poll-vote**: Stem op een bestaande peiling (`pollId` of `messageId`, plus precies één van `pollOptionIndex`, `pollOptionId` of `pollOptionText`). Vereist `selectors.pollVoteMessage` en de RPC-methode `poll.vote`.

    Geaccepteerde inkomende peilingen worden voor de agent weergegeven met de vraag, genummerde optielabels, aantallen stemmen en de bericht-ID van de peiling die `poll-vote` nodig heeft.

  </Accordion>

  <Accordion title="Bericht-ID's">
    Inkomende iMessage-context bevat zowel korte `MessageSid`-waarden als volledige bericht-GUID's (`MessageSidFull`), wanneer beschikbaar. Korte ID's zijn beperkt tot de recente, door SQLite ondersteunde antwoordcache en worden vóór gebruik vergeleken met het huidige gesprek. Als een korte ID verloopt, probeer het opnieuw met de bijbehorende `MessageSidFull` en richt je op het gesprek waaruit deze afkomstig is. Volledige ID's omzeilen de binding aan het gesprek of account niet; vervang daarom een ID uit een ander gesprek door een ID van het huidige doel. Extern gedelegeerde aanroepen kunnen verouderde volledige ID's weigeren wanneer bewijs voor het huidige gesprek niet beschikbaar is.

  </Accordion>

  <Accordion title="Detectie van mogelijkheden">
    OpenClaw verbergt acties van de privé-API alleen wanneer de gecachte probestatus aangeeft dat de bridge niet beschikbaar is. Als de status onbekend is, blijven acties zichtbaar en voeren verzendingen zo nodig een probe uit, zodat de eerste actie na `imsg launch` kan slagen zonder dat de status afzonderlijk handmatig hoeft te worden vernieuwd.

  </Accordion>

  <Accordion title="Leesbevestigingen en typen">
    Wanneer de bridge van de privé-API actief is, worden geaccepteerde inkomende gesprekken als gelezen gemarkeerd en tonen directe gesprekken een typindicator zodra de beurt is geaccepteerd, terwijl de agent context voorbereidt en genereert. Schakel markeren als gelezen uit met:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Oudere `imsg`-builds van vóór de lijst met mogelijkheden per methode schakelen typen/lezen stilzwijgend uit; OpenClaw registreert één waarschuwing per herstart, zodat duidelijk is waaraan de ontbrekende leesbevestiging te wijten is.

  </Accordion>

  <Accordion title="Inkomende tapbacks">
    OpenClaw abonneert zich op iMessage-tapbacks en routeert geaccepteerde reacties als systeemgebeurtenissen in plaats van als normale berichttekst, zodat een tapback van een gebruiker geen gewone antwoordlus activeert.

    De meldingsmodus wordt beheerd door `channels.imessage.reactionNotifications`:

    - `"own"` (standaard): meld alleen wanneer gebruikers reageren op berichten die door de bot zijn geschreven.
    - `"all"`: meld alle inkomende tapbacks van geautoriseerde afzenders.
    - `"off"`: negeer inkomende tapbacks.

    Gebruik `channels.imessage.accounts.<id>.reactionNotifications` voor overschrijvingen per account.

  </Accordion>

  <Accordion title="Goedkeuringsreacties (👍 / 👎)">
    Wanneer `approvals.exec.enabled` of `approvals.plugin.enabled` waar is en het verzoek naar iMessage wordt gerouteerd, levert de Gateway systeemeigen een goedkeuringsprompt af en accepteert deze een tapback om het verzoek af te handelen:

    - `👍` (Like-tapback) → `allow-once`
    - `👎` (Dislike-tapback) → `deny`
    - `allow-always` blijft beschikbaar als handmatige terugvaloptie: stuur `/approve <id> allow-always` als een gewoon antwoord.

    Voor het verwerken van reacties moet het gebruikersadres van de reagerende gebruiker expliciet als goedkeurder zijn opgegeven. De lijst met goedkeurders wordt gelezen uit `channels.imessage.allowFrom` (of `channels.imessage.accounts.<id>.allowFrom`); voeg het telefoonnummer van de gebruiker in E.164-indeling of het e-mailadres van diens Apple ID toe (gespreksdoelen zoals `chat_id:*` zijn geen geldige vermeldingen voor goedkeurders). Het jokerteken `"*"` wordt gehonoreerd, maar staat elke afzender toe om goed te keuren; een lege lijst met goedkeurders schakelt de reactiesnelkoppeling volledig uit. De reactiesnelkoppeling omzeilt bewust `reactionNotifications`, `dmPolicy` en `groupAllowFrom`, omdat alleen de expliciete toelatingslijst met goedkeurders relevant is voor het afhandelen van goedkeuringen.

    De autorisatie van de tekstuele opdracht `/approve` volgt dezelfde lijst: wanneer `channels.imessage.allowFrom` niet leeg is, wordt `/approve <id> <decision>` geautoriseerd aan de hand van die lijst met goedkeurders (niet de bredere toelatingslijst voor privéberichten), en afzenders die wel op de toelatingslijst voor privéberichten staan maar niet in `allowFrom`, krijgen een expliciete weigering. Wanneer `allowFrom` leeg is, blijft de terugval voor hetzelfde gesprek van kracht en autoriseert `/approve` iedereen die volgens de toelatingslijst voor privéberichten is toegestaan. Voeg elke beheerder die moet kunnen goedkeuren — via `/approve` of via reacties — toe aan `allowFrom`.

    Opmerkingen voor operators:
    - De reactiekoppeling wordt zowel in het geheugen als in de permanente opslag met sleutels van de Gateway bewaard (met een TTL die overeenkomt met het verlopen van de goedkeuring), en de Gateway controleert openstaande prompts ook op tapbacks, zodat een tapback die kort na een herstart van de Gateway binnenkomt, de goedkeuring alsnog afhandelt.
    - De `is_from_me=true`-tapback van de operator zelf (bijvoorbeeld vanaf een gekoppeld Apple-apparaat) handelt de goedkeuring af wanneer die handle expliciet als goedkeurder is ingesteld.
    - Goedkeuringsprompts worden alleen naar een groepsgesprek gerouteerd wanneer expliciete goedkeurders zijn geconfigureerd; anders zou elk groepslid kunnen goedkeuren.
    - Oude tapbacks in tekstvorm (`Liked "…"` platte tekst van zeer oude Apple-clients) kunnen geen goedkeuringen afhandelen omdat ze geen bericht-GUID bevatten; voor afhandeling via een reactie zijn de gestructureerde tapbackmetadata vereist die huidige macOS-/iOS-clients versturen.

  </Accordion>
</AccordionGroup>

## Configuratie schrijven

iMessage staat standaard toe dat het kanaal configuratiewijzigingen initieert (voor `/config set|unset` wanneer `commands.config: true`).

Uitschakelen:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Gesplitst verzonden DM's samenvoegen (opdracht + URL in één compositie)

Wanneer een gebruiker een opdracht en een URL samen typt — bijvoorbeeld `Dump https://example.com/article` — splitst Apples Berichten-app de verzending op in **twee afzonderlijke `chat.db`-rijen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-voorbeeldballon (`"https://..."`) met OG-voorbeeldafbeeldingen als bijlagen.

De twee rijen komen bij de meeste configuraties ongeveer 0,8-2,0 s na elkaar bij OpenClaw aan. Zonder samenvoeging ontvangt de agent tijdens beurt 1 alleen de opdracht (en antwoordt vaak "stuur me de URL") voordat de URL tijdens beurt 2 aankomt. Dit is de verzendpipeline van Apple en niet iets dat OpenClaw of `imsg` introduceert.

Met `channels.imessage.coalesceSameSenderDms` kan een DM opeenvolgende rijen van dezelfde afzender bufferen. Wanneer `imsg` op een van de bronrijen de structurele URL-voorbeeldmarkering `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` beschikbaar stelt, voegt OpenClaw alleen die daadwerkelijk gesplitste verzending samen en houdt het eventuele andere gebufferde rijen als afzonderlijke beurten. Bij oudere `imsg`-builds die helemaal geen ballonmetadata versturen, kan OpenClaw een gesplitste verzending niet onderscheiden van afzonderlijke verzendingen en valt het daarom terug op het samenvoegen van de bucket. Daarmee blijft het gedrag van vóór de metadata behouden, in plaats van `Dump <url>`-verzendingen weer op te splitsen in twee beurten. Groepschats blijven per bericht verzenden, zodat de beurtstructuur met meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel dit in wanneer:

    - Je Skills levert die `command + payload` in één bericht verwachten (dumpen, plakken, opslaan, in de wachtrij zetten enzovoort).
    - Je gebruikers URL's naast opdrachten plakken.
    - Je de extra vertraging van DM-beurten kunt accepteren (zie hieronder).

    Laat dit uitgeschakeld wanneer:

    - Je minimale opdrachtvertraging nodig hebt voor DM-triggers van één woord.
    - Al je flows eenmalige opdrachten zonder vervolgladingen zijn.

  </Tab>
  <Tab title="Inschakelen">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // aanmelden (standaard: false)
        },
      },
    }
    ```

    Als de vlag is ingeschakeld en er geen expliciete `messages.inbound.byChannel.imessage` of algemene `messages.inbound.debounceMs` is ingesteld, wordt het debouncevenster verruimd tot **7000 ms** (de oude standaardwaarde is 0 ms — geen debouncing). Het ruimere venster is vereist omdat het verzendinterval van Apples gesplitste URL-voorbeelden tot enkele seconden kan oplopen terwijl Messages.app de voorbeeldrij verstuurt.

    Zo stel je het venster zelf af:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms dekt waargenomen vertragingen van URL-voorbeelden in Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Afwegingen">
    - **Voor nauwkeurig samenvoegen zijn actuele payloadmetadata van `imsg` nodig.** Als `balloon_bundle_id` aanwezig is, wordt alleen de daadwerkelijk gesplitste verzending samengevoegd; de hierboven beschreven terugval waarbij metadata ontbreken, is tijdelijke achterwaartse compatibiliteit en wordt verwijderd zodra `imsg` gesplitste verzendingen upstream samenvoegt.
    - **Extra vertraging voor DM-berichten.** Als de vlag is ingeschakeld, wacht elke DM (inclusief zelfstandige besturingsopdrachten en vervolgberichten met alleen tekst) vóór verzending maximaal de duur van het debouncevenster, voor het geval er een URL-voorbeeldrij aankomt. Groepschatberichten worden nog steeds direct verzonden.
    - **Samengevoegde uitvoer is begrensd.** Samengevoegde tekst is beperkt tot 4000 tekens, met een expliciete `…[truncated]`-markering; bijlagen zijn beperkt tot 20; bronvermeldingen zijn beperkt tot 10 (daarboven worden de eerste en meest recente behouden). Elke bron-GUID wordt voor downstreamtelemetrie bijgehouden in `coalescedMessageGuids`.
    - **Alleen DM's.** Groepschats vallen terug op verzending per bericht, zodat de bot responsief blijft wanneer meerdere mensen typen.
    - **Opt-in, per kanaal.** Andere kanalen (Discord, Slack, Telegram, WhatsApp, …) blijven ongewijzigd. Oude BlueBubbles-configuraties waarin `channels.bluebubbles.coalesceSameSenderDms` is ingesteld, moeten die waarde migreren naar `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

De kolom "Vlag ingeschakeld" toont het gedrag van een `imsg`-build die `balloon_bundle_id` verstuurt. Bij oudere `imsg`-builds die helemaal geen ballonmetadata versturen, vallen de onderstaande rijen met "Twee beurten"/"N beurten" terug op een oude samenvoeging (één beurt): OpenClaw kan een gesplitste verzending structureel niet onderscheiden van afzonderlijke verzendingen en behoudt daarom de samenvoeging van vóór de metadata. Nauwkeurige scheiding wordt actief zodra de build ballonmetadata verstuurt.

| Gebruiker stelt op                                                | `chat.db` produceert               | Vlag uit (standaard)                         | Vlag aan + venster (imsg verstuurt ballonmetadata)                                                         |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (één verzending)                              | 2 rijen met ~1 s ertussen                   | Twee agentbeurten: alleen "Dump", daarna URL | Eén beurt: samengevoegde tekst `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (bijlage + tekst)                | 2 rijen zonder URL-ballonmetadata | Twee beurten                               | Twee beurten nadat metadata zijn waargenomen; één samengevoegde beurt in oude/metadataloze sessies vóór de latch       |
| `/status` (zelfstandige opdracht)                                     | 1 rij                               | Directe verzending                        | **Maximaal de duur van het venster wachten en daarna verzenden**                                                                |
| Alleen URL geplakt                                                   | 1 rij                               | Directe verzending                        | Maximaal de duur van het venster wachten en daarna verzenden                                                                    |
| Tekst + URL als twee bewust afzonderlijke berichten verzonden, met minuten ertussen | 2 rijen buiten het venster               | Twee beurten                               | Twee beurten (het venster verloopt ertussen)                                                             |
| Snelle stroom (>10 kleine DM's binnen het venster)                          | N rijen zonder URL-ballonmetadata | N beurten                                 | N beurten nadat metadata zijn waargenomen; één begrensde, samengevoegde beurt in oude/metadataloze sessies vóór de latch |
| Twee mensen typen in een groepschat                                  | N rijen van M afzenders               | M+ beurten (één per afzenderbucket)        | M+ beurten — groepschats worden niet samengevoegd                                                            |

## Herstel van inkomende berichten na herstart van een bridge of Gateway

iMessage herstelt berichten die zijn gemist terwijl de Gateway niet actief was en onderdrukt tegelijkertijd de verouderde "achterstandsbom" die Apple na herstel van Push kan uitstorten. Het standaardgedrag is altijd actief en is gebouwd op de ontdubbeling van inkomende berichten.

- **Ontdubbeling bij opnieuw afspelen.** Elk verzonden inkomend bericht wordt aan de hand van zijn Apple-GUID vastgelegd in de permanente Plugin-status (`imessage.inbound-dedupe`), bij inname geclaimd en na verwerking vastgelegd (en bij een tijdelijke fout vrijgegeven zodat het opnieuw kan worden geprobeerd). Alles wat al is verwerkt, wordt verwijderd in plaats van tweemaal verzonden. Hierdoor kan herstel agressief opnieuw afspelen zonder administratie per bericht.
- **Herstel na uitvaltijd.** Bij het opstarten onthoudt de monitor de rowid van de laatst verzonden `chat.db`-rij (een permanente cursor per account) en geeft deze als `since_rowid` door aan `imsg watch.subscribe`, zodat imsg de rijen opnieuw afspeelt die binnenkwamen terwijl de Gateway niet actief was en daarna live blijft volgen. Het opnieuw afspelen is beperkt tot de 500 meest recente rijen en berichten van maximaal ongeveer 2 uur oud; de ontdubbeling verwijdert alles wat al is verwerkt.
- **Leeftijdsgrens voor verouderde achterstand.** Rijen boven de opstartgrens zijn daadwerkelijk live; een rij waarvan de verzenddatum meer dan ongeveer 15 minuten vóór de aankomsttijd ligt, maakt deel uit van de door Push uitgestorte achterstand en wordt onderdrukt. Opnieuw afgespeelde rijen (op of onder de grens) gebruiken in plaats daarvan het ruimere herstelvenster, zodat een recent gemist bericht wordt afgeleverd maar oude geschiedenis niet.

Herstel werkt zowel met lokale als externe `cliPath`-configuraties, omdat het opnieuw afspelen via `since_rowid` over dezelfde `imsg`-RPC-verbinding loopt. Het verschil is het venster: wanneer de Gateway `chat.db` kan lezen (lokaal), verankert deze de rowid-grens bij het opstarten, beperkt deze het bereik voor opnieuw afspelen en levert deze gemiste berichten van maximaal een paar uur oud af. Via een externe SSH-`cliPath` kan de Gateway de database niet lezen, waardoor het opnieuw afspelen onbeperkt is en elke rij de live-leeftijdsgrens gebruikt — recent gemiste berichten worden nog steeds hersteld en oude achterstand wordt nog steeds onderdrukt, maar met het kleinere livevenster. Voer de Gateway uit op de Berichten-Mac voor het ruimere herstelvenster.

### Voor de operator zichtbaar signaal

Onderdrukte achterstand wordt op het standaardniveau gelogd en nooit stilzwijgend verwijderd (de vlag `recovery` toont welk venster is toegepast):

```text
imessage: verouderde inkomende achterstand onderdrukt account=<id> verzonden=<iso> herstel=<bool> (<N> onderdrukt sinds opstarten)
```

### Migratie

`channels.imessage.catchup.*` is verouderd — herstel na uitvaltijd verloopt automatisch en vereist voor nieuwe configuraties geen configuratie. Bestaande configuraties met `catchup.enabled: true` blijven als compatibiliteitsprofiel voor het venster voor opnieuw afspelen tijdens herstel ondersteund. Uitgeschakelde catchup-blokken (`enabled: false` of zonder `enabled: true`) worden niet meer gebruikt; `openclaw doctor --fix` verwijdert deze.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="imsg niet gevonden of RPC niet ondersteund">
    Controleer het binaire bestand en de RPC-ondersteuning:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Als de controle meldt dat RPC niet wordt ondersteund, werk je `imsg` bij. Als acties van de privé-API niet beschikbaar zijn, voer je `imsg launch` uit in de sessie van de ingelogde macOS-gebruiker en voer je de controle opnieuw uit. Als de Gateway niet op macOS wordt uitgevoerd, gebruik je in plaats van het standaard lokale `imsg`-pad de bovenstaande configuratie voor een externe Mac via SSH.

  </Accordion>

  <Accordion title="Berichten worden verzonden, maar inkomende iMessages komen niet aan">
    Stel eerst vast of het bericht de lokale Mac heeft bereikt. Als `chat.db` niet verandert, kan OpenClaw het bericht niet ontvangen, zelfs wanneer `imsg status --json` een gezonde bridge meldt.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Als vanaf de telefoon verzonden berichten geen nieuwe rijen aanmaken, herstel je de laag macOS Berichten en Apple Push voordat je de OpenClaw-configuratie wijzigt. Een eenmalige vernieuwing van de service is vaak voldoende:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Stuur een nieuw iMessage-bericht vanaf de telefoon en controleer of er een nieuwe `chat.db`-rij of `imsg watch`-gebeurtenis is voordat je problemen met OpenClaw-sessies oplost. Voer dit niet uit als een periodieke lus om de bridge opnieuw te starten; herhaalde `imsg launch` plus herstarts van de Gateway tijdens actief gebruik kunnen leveringen onderbreken en lopende kanaaluitvoeringen laten vastlopen.

  </Accordion>

  <Accordion title="Gateway wordt niet uitgevoerd op macOS">
    De standaard-`cliPath: "imsg"` moet worden uitgevoerd op de Mac die bij Berichten is aangemeld. Stel op Linux of Windows `channels.imessage.cliPath` in op een wrapperscript dat via SSH verbinding maakt met die Mac en `imsg "$@"` uitvoert.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Voer vervolgens het volgende uit:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Privéberichten worden genegeerd">
    Controleer:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - goedkeuringen voor koppelingen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Groepsberichten worden genegeerd">
    Controleer:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` gedrag van de toelatingslijst
    - configuratie van vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Externe bijlagen mislukken">
    Controleer:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-sleutelauthenticatie vanaf de Gateway-host
    - de hostsleutel bestaat in `~/.ssh/known_hosts` op de Gateway-host
    - de leesbaarheid van het externe pad op de Mac waarop Messages wordt uitgevoerd

  </Accordion>

  <Accordion title="macOS-toestemmingsvragen zijn gemist">
    Voer dit opnieuw uit in een interactieve GUI-terminal binnen dezelfde gebruikers-/sessiecontext en keur de vragen goed:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Controleer of Full Disk Access + Automation zijn verleend voor de procescontext waarin OpenClaw/`imsg` wordt uitgevoerd.

  </Accordion>
</AccordionGroup>

## Verwijzingen naar de configuratiereferentie

- [Configuratiereferentie - iMessage](/nl/gateway/config-channels#imessage)
- [Gateway-configuratie](/nl/gateway/configuration)
- [Koppelen](/nl/channels/pairing)

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Verwijdering van BlueBubbles en het imsg-pad voor iMessage](/nl/announcements/bluebubbles-imessage) — aankondiging en migratiesamenvatting
- [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) — tabel voor configuratievertaling en stapsgewijze omschakeling
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en beperking op basis van vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiligingsversterking
