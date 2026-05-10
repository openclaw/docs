---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania w iMessage
summary: Natywna obsługa iMessage przez imsg (JSON-RPC przez stdio), z akcjami prywatnego API dla odpowiedzi, reakcji tapback, efektów, załączników i zarządzania grupami. Preferowane dla nowych konfiguracji OpenClaw iMessage, gdy wymagania hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W przypadku wdrożeń OpenClaw iMessage używaj `imsg` na hoście macOS Messages z zalogowanym kontem. Jeśli Gateway działa na Linuksie lub Windows, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu.

**Nadrabianie przestoju Gateway jest opcjonalne.** Po włączeniu (`channels.imessage.catchup.enabled: true`) gateway przy następnym uruchomieniu odtwarza wiadomości przychodzące, które trafiły do `chat.db`, gdy był offline (awaria, restart, uśpienie Maca). Domyślnie wyłączone — zobacz [Nadrabianie po przestoju gateway](#catching-up-after-gateway-downtime). Zamyka [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Obsługa BlueBubbles została usunięta. Przenieś konfiguracje `channels.bluebubbles` do `channels.imessage`; OpenClaw obsługuje iMessage wyłącznie przez `imsg`.
</Warning>

Status: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu). Zaawansowane akcje wymagają `imsg launch` oraz udanego sprawdzenia prywatnego API.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Odpowiedzi, tapbacki, efekty, załączniki i zarządzanie grupami.
  </Card>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    DM-y iMessage domyślnie używają trybu parowania.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Użyj wrappera SSH, gdy Gateway nie działa na Macu z Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/pl/gateway/config-channels#imessage">
    Pełny opis pól iMessage.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw wymaga tylko `cliPath` zgodnego ze stdio, więc możesz wskazać `cliPath` na skrypt wrappera, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Zalecana konfiguracja, gdy załączniki są włączone:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie przez analizę skryptu wrappera SSH.
    `remoteHost` musi mieć postać `host` albo `user@host` (bez spacji ani opcji SSH).
    OpenClaw używa ścisłego sprawdzania kluczy hostów dla SCP, więc klucz hosta pośredniczącego musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są weryfikowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Na Macu uruchamiającym `imsg` konto w Messages musi być zalogowane.
- Wymagany jest pełny dostęp do dysku dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Do wysyłania wiadomości przez Messages.app wymagane jest uprawnienie automatyzacji.
- Dla akcji zaawansowanych (reakcja / edycja / cofnięcie wysłania / odpowiedź w wątku / efekty / operacje na grupach) System Integrity Protection musi być wyłączone — zobacz poniżej [Włączanie prywatnego API imsg](#enabling-the-imsg-private-api). Podstawowe wysyłanie/odbieranie tekstu i multimediów działa bez tego.

<Tip>
Uprawnienia są przyznawane na kontekst procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe polecenie interaktywne w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Włączanie prywatnego API imsg

`imsg` działa w dwóch trybach operacyjnych:

- **Tryb podstawowy** (domyślny, bez wymaganych zmian SIP): tekst i multimedia wychodzące przez `send`, obserwacja/historia przychodzących, lista czatów. To otrzymujesz od razu po świeżym `brew install steipete/tap/imsg` plus standardowych uprawnieniach macOS opisanych wyżej.
- **Tryb prywatnego API**: `imsg` wstrzykuje pomocniczą bibliotekę dylib do `Messages.app`, aby wywoływać wewnętrzne funkcje `IMCore`. To odblokowuje `react`, `edit`, `unsend`, `reply` (wątkowe), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, a także wskaźniki pisania i potwierdzenia odczytu.

Aby uzyskać powierzchnię akcji zaawansowanych opisaną na tej stronie kanału, potrzebujesz trybu prywatnego API. README `imsg` jasno opisuje wymaganie:

> Funkcje zaawansowane, takie jak `read`, `typing`, `launch`, wysyłanie rozszerzone oparte na moście, modyfikacja wiadomości i zarządzanie czatem, są opcjonalne. Wymagają wyłączenia SIP i wstrzyknięcia pomocniczej biblioteki dylib do `Messages.app`. `imsg launch` odmawia wstrzyknięcia, gdy SIP jest włączone.

Technika wstrzykiwania helpera używa własnej biblioteki dylib `imsg`, aby dotrzeć do prywatnych API Messages. W ścieżce OpenClaw iMessage nie ma serwera zewnętrznego ani środowiska uruchomieniowego BlueBubbles.

<Warning>
**Wyłączenie SIP to realny kompromis bezpieczeństwa.** SIP jest jedną z podstawowych ochron macOS przed uruchamianiem zmodyfikowanego kodu systemowego; wyłączenie go w całym systemie otwiera dodatkową powierzchnię ataku i może powodować skutki uboczne. Co istotne, **wyłączenie SIP na Macach Apple Silicon wyłącza także możliwość instalowania i uruchamiania aplikacji iOS na Macu**.

Traktuj to jako świadomy wybór operacyjny, nie ustawienie domyślne. Jeśli twój model zagrożeń nie toleruje wyłączonego SIP, wbudowany iMessage jest ograniczony do trybu podstawowego — tylko wysyłanie/odbieranie tekstu i multimediów, bez reakcji / edycji / cofania wysłania / efektów / operacji na grupach.
</Warning>

### Konfiguracja

1. **Zainstaluj (lub zaktualizuj) `imsg`** na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Wynik `imsg status --json` raportuje `bridge_version`, `rpc_methods` oraz `selectors` dla każdej metody, dzięki czemu możesz sprawdzić, co obsługuje bieżąca kompilacja, zanim zaczniesz.

2. **Wyłącz System Integrity Protection.** Jest to zależne od wersji macOS, ponieważ bazowe wymaganie Apple zależy od systemu operacyjnego i sprzętu:
   - **macOS 10.13–10.15 (Sierra–Catalina):** wyłącz Library Validation przez Terminal, uruchom ponownie w trybie Recovery Mode, uruchom `csrutil disable`, zrestartuj.
   - **macOS 11+ (Big Sur i nowsze), Intel:** Recovery Mode (lub Internet Recovery), `csrutil disable`, restart.
   - **macOS 11+, Apple Silicon:** sekwencja startowa z przyciskiem zasilania, aby wejść do Recovery; w nowszych wersjach macOS przytrzymaj klawisz **Left Shift**, gdy klikasz Continue, a następnie `csrutil disable`. Konfiguracje maszyn wirtualnych używają osobnej procedury — najpierw wykonaj snapshot VM.
   - **macOS 26 / Tahoe:** polityki walidacji bibliotek i kontrole prywatnych uprawnień `imagent` zostały dodatkowo zaostrzone; `imsg` może wymagać zaktualizowanej kompilacji, aby nadążyć. Jeśli po dużej aktualizacji macOS wstrzyknięcie `imsg launch` albo konkretne `selectors` zaczynają zwracać false, sprawdź informacje o wydaniu `imsg`, zanim uznasz, że krok SIP się powiódł.

   Postępuj zgodnie z procedurą Apple Recovery Mode dla swojego Maca, aby wyłączyć SIP przed uruchomieniem `imsg launch`.

3. **Wstrzyknij helpera.** Przy wyłączonym SIP i zalogowanym Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` odmawia wstrzyknięcia, gdy SIP jest nadal włączone, więc służy to także jako potwierdzenie, że krok 2 zadziałał.

4. **Zweryfikuj most z OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Wpis iMessage powinien raportować `works`, a `imsg status --json | jq '.selectors'` powinno pokazać `retractMessagePart: true` oraz wszystkie selektory edycji / pisania / odczytu, które udostępnia twoja kompilacja macOS. Bramkowanie metod w Pluginie OpenClaw w `actions.ts` reklamuje tylko akcje, których bazowy selektor ma wartość `true`, więc powierzchnia akcji widoczna na liście narzędzi agenta odzwierciedla to, co most faktycznie potrafi zrobić na tym hoście.

Jeśli `openclaw channels status --probe` raportuje kanał jako `works`, ale konkretne akcje rzucają błąd „iMessage `<action>` requires the imsg private API bridge” w czasie dispatchu, uruchom `imsg launch` ponownie — helper może wypaść (restart Messages.app, aktualizacja systemu itd.), a buforowany status `available: true` będzie nadal reklamował akcje do czasu, aż następne sprawdzenie odświeży stan.

### Gdy nie możesz wyłączyć SIP

Jeśli wyłączenie SIP nie jest akceptowalne dla twojego modelu zagrożeń:

- `imsg` wraca do trybu podstawowego — tylko tekst + multimedia + odbieranie.
- Plugin OpenClaw nadal reklamuje wysyłanie tekstu/multimediów i monitorowanie przychodzących; po prostu ukrywa `react`, `edit`, `unsend`, `reply`, `sendWithEffect` oraz operacje grupowe z powierzchni akcji (zgodnie z bramką możliwości dla każdej metody).
- Możesz uruchomić osobnego Maca bez Apple Silicon (albo dedykowanego Maca bota) z wyłączonym SIP dla obciążenia iMessage, zachowując SIP włączone na swoich głównych urządzeniach. Zobacz poniżej [Dedykowany użytkownik macOS bota (osobna tożsamość iMessage)](#deployment-patterns).

## Kontrola dostępu i routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` kontroluje wiadomości bezpośrednie:

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisami listy dozwolonych mogą być uchwyty, statyczne grupy dostępu nadawców (`accessGroup:<name>`) albo cele czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślne, gdy skonfigurowane)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Wpisy `groupAllowFrom` mogą także odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`).

    Fallback w runtime: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage wraca do `allowFrom`, gdy jest dostępne.
    Uwaga runtime: jeśli `channels.imessage` całkowicie brakuje, runtime wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli `channels.defaults.groupPolicy` jest ustawione).

    <Warning>
    Routing grup ma **dwie** bramki listy dozwolonych działające jedna po drugiej i obie muszą przejść:

    1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — uchwyt, `chat_guid`, `chat_identifier` albo `chat_id`.
    2. **Rejestr grup** (`channels.imessage.groups`) — przy `groupPolicy: "allowlist"` ta bramka wymaga albo wpisu wildcard `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo jawnego wpisu dla danego `chat_id` pod `groups`.

    Jeśli bramka 2 jest pusta, każda wiadomość grupowa jest odrzucana. Plugin emituje dwa sygnały poziomu `warn` przy domyślnym poziomie logowania:

    - jednorazowo na konto przy starcie: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - jednorazowo na `chat_id` w runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM-y nadal działają, ponieważ używają innej ścieżki kodu.

    Minimalna konfiguracja utrzymująca przepływ grup przy `groupPolicy: "allowlist"`:

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

    Jeśli te linie `warn` pojawiają się w logu gateway, bramka 2 odrzuca wiadomości — dodaj blok `groups`.
    </Warning>

    Bramkowanie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców wymuszanie bramkowania wzmianek nie jest możliwe

    Polecenia sterujące od autoryzowanych nadawców mogą omijać bramkowanie wzmianek w grupach.

    `systemPrompt` dla grupy:

    Każdy wpis pod `channels.imessage.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do promptu systemowego agenta przy każdej turze obsługującej wiadomość w tej grupie. Rozstrzyganie odzwierciedla rozstrzyganie promptu dla grupy używane przez `channels.whatsapp.groups`:

    1. **Prompt systemowy konkretnej grupy** (`groups["<chat_id>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest wyciszany i do tej grupy nie jest stosowany żaden prompt systemowy.
    2. **Prompt systemowy wildcard grupy** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompty dla grupy mają zastosowanie tylko do wiadomości grupowych — wiadomości bezpośrednie w tym kanale pozostają bez zmian.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Wiadomości DM używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości DM iMessage zwijają się do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych pierwotnego kanału/celu.

    Zachowanie wątków podobnych do grupowych:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany pod `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage można także powiązać z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w czacie DM lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji iMessage są kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu DM, takiego jak `+15555550123` lub `user@example.com`
- `chat_id:<id>` (zalecane dla stabilnych powiązań grupowych)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Przykład:

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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać współdzielone zachowanie powiązań ACP.

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz dedykowanego użytkownika macOS albo zaloguj się jako taki użytkownik.
    2. Zaloguj się do Messages za pomocą Apple ID bota u tego użytkownika.
    3. Zainstaluj `imsg` u tego użytkownika.
    4. Utwórz wrapper SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` do profilu tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń w GUI (Automation + Full Disk Access) w sesji użytkownika bota.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Typowa topologia:

    - gateway działa na Linuksie/VM
    - iMessage + `imsg` działa na Macu w Twoim tailnet
    - wrapper `cliPath` używa SSH do uruchomienia `imsg`
    - `remoteHost` włącza pobieranie załączników przez SCP

    Przykład:

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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP działały nieinteraktywnie.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` zostało wypełnione.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage obsługuje konfigurację dla konta pod `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i allowlisty katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Media, dzielenie na fragmenty i cele dostarczania

<AccordionGroup>
  <Accordion title="Attachments and media">
    - przyjmowanie załączników przychodzących jest **domyślnie wyłączone** — ustaw `channels.imessage.includeAttachments: true`, aby przekazywać agentowi zdjęcia, notatki głosowe, wideo i inne załączniki. Gdy jest wyłączone, iMessages zawierające tylko załączniki są odrzucane przed dotarciem do agenta i mogą w ogóle nie wygenerować wpisu dziennika `Inbound message`.
    - zdalne ścieżki załączników mogą być pobierane przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar mediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia na fragmenty: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw według akapitów)

  </Accordion>

  <Accordion title="Addressing formats">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są także cele uchwytów:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Akcje prywatnego API

Gdy `imsg launch` działa, a `openclaw channels status --probe` zgłasza `privateApi.available: true`, narzędzie wiadomości może używać natywnych akcji iMessage oprócz zwykłych wysyłek tekstu.

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Dodaj/usuń tapbacki iMessage (`messageId`, `emoji`, `remove`). Obsługiwane tapbacki mapują się na miłość, polubienie, niepolubienie, śmiech, podkreślenie i pytanie.
    - **reply**: Wyślij odpowiedź w wątku do istniejącej wiadomości (`messageId`, `text` lub `message` oraz `chatGuid`, `chatId`, `chatIdentifier` albo `to`).
    - **sendWithEffect**: Wyślij tekst z efektem iMessage (`text` lub `message`, `effect` albo `effectId`).
    - **edit**: Edytuj wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`, `text` lub `newText`).
    - **unsend**: Wycofaj wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`).
    - **upload-file**: Wyślij media/pliki (`buffer` jako base64 albo uwodnione `media`/`path`/`filePath`, `filename`, opcjonalne `asVoice`). Starszy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Zarządzaj czatami grupowymi, gdy bieżący cel jest konwersacją grupową.

  </Accordion>

  <Accordion title="Message IDs">
    Kontekst przychodzący iMessage zawiera zarówno krótkie wartości `MessageSid`, jak i pełne identyfikatory GUID wiadomości, gdy są dostępne. Krótkie identyfikatory są ograniczone do ostatniej pamięci podręcznej odpowiedzi w pamięci i przed użyciem są sprawdzane względem bieżącego czatu. Jeśli krótki identyfikator wygasł lub należy do innego czatu, spróbuj ponownie z pełnym `MessageSidFull`.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw ukrywa akcje prywatnego API tylko wtedy, gdy status sondy w pamięci podręcznej mówi, że mostek jest niedostępny. Jeśli status jest nieznany, akcje pozostają widoczne i leniwie uruchamiają sondy przy wysyłce, aby pierwsza akcja mogła się powieść po `imsg launch` bez osobnego ręcznego odświeżania statusu.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Gdy mostek prywatnego API działa, zaakceptowane czaty przychodzące są oznaczane jako przeczytane przed wysyłką, a nadawcy jest pokazywany dymek pisania podczas generowania przez agenta. Wyłącz oznaczanie jako przeczytane za pomocą:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Starsze kompilacje `imsg`, które poprzedzają listę możliwości dla metod, po cichu wyłączą pisanie/odczyt; OpenClaw rejestruje jednorazowe ostrzeżenie przy każdym restarcie, aby brak potwierdzenia był możliwy do przypisania.

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie pozwala na inicjowane przez kanał zapisy konfiguracji (dla `/config set|unset`, gdy `commands.config: true`).

Wyłącz:

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

## Łączenie rozdzielonych wysyłek DM (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i URL — np. `Dump https://example.com/article` — aplikacja Messages Apple dzieli wysyłkę na **dwa osobne wiersze `chat.db`**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Na większości konfiguracji oba wiersze docierają do OpenClaw w odstępie ~0.8-2.0 s. Bez łączenia agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 — wtedy kontekst polecenia jest już utracony. To jest potok wysyłania Apple, a nie coś wprowadzanego przez OpenClaw lub `imsg`.

`channels.imessage.coalesceSameSenderDms` włącza dla DM scalanie kolejnych wierszy od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal wysyłają każdą wiadomość osobno, aby zachować strukturę tur wielu użytkowników.

<Tabs>
  <Tab title="When to enable">
    Włącz, gdy:

    - Dostarczasz skills, które oczekują `command + payload` w jednej wiadomości (zrzut, wklejenie, zapisanie, kolejkowanie itd.).
    - Twoi użytkownicy wklejają adresy URL, obrazy lub długą treść obok poleceń.
    - Możesz zaakceptować dodane opóźnienie tury DM (zobacz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy są jednorazowymi poleceniami bez późniejszych ładunków.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Gdy flaga jest włączona i nie ma jawnego `messages.inbound.byChannel.imessage`, okno debounce rozszerza się do **2500 ms** (starsza wartość domyślna to 0 ms — bez debounce). Szersze okno jest wymagane, ponieważ kadencja dzielonej wysyłki Apple wynosząca 0,8–2,0 s nie mieści się w ciaśniejszej wartości domyślnej.

    Aby samodzielnie dostroić okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Dodane opóźnienie dla wiadomości DM.** Gdy flaga jest włączona, każda wiadomość DM (w tym samodzielne polecenia sterujące i pojedyncze tekstowe kontynuacje) czeka przed wysłaniem maksymalnie przez okno debounce, na wypadek gdyby nadchodził wiersz payloadu. Wiadomości czatu grupowego zachowują natychmiastowe wysyłanie.
    - **Scalone wyjście jest ograniczone.** Scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (po jego przekroczeniu zachowywany jest pierwszy i najnowsze). Każdy GUID źródła jest śledzony w `coalescedMessageGuids` na potrzeby dalszej telemetrii.
    - **Tylko DM.** Czaty grupowe przechodzą do wysyłania per wiadomość, aby bot pozostał responsywny, gdy pisze wiele osób.
    - **Opcjonalne, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian. Starsze konfiguracje BlueBubbles ustawiające `channels.bluebubbles.coalesceSameSenderDms` powinny przenieść tę wartość do `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Użytkownik tworzy                                                   | `chat.db` produkuje   | Flaga wyłączona (domyślnie)                  | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------ | --------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                         | 2 wiersze w odstępie ~1 s | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 wiersze             | Dwie tury (załącznik odrzucony przy scalaniu) | Jedna tura: tekst + obraz zachowane                                    |
| `/status` (samodzielne polecenie)                                  | 1 wiersz              | Natychmiastowe wysłanie                      | **Czekaj maksymalnie przez okno, potem wyślij**                         |
| URL wklejony samodzielnie                                          | 1 wiersz              | Natychmiastowe wysłanie                      | Natychmiastowe wysłanie (tylko jeden wpis w kubełku)                    |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, w odstępie minut | 2 wiersze poza oknem | Dwie tury                                    | Dwie tury (okno wygasa między nimi)                                     |
| Szybka lawina (>10 małych DM w oknie)                              | N wierszy             | N tur                                        | Jedna tura, ograniczone wyjście (pierwszy + najnowsze, zastosowane limity tekstu/załączników) |
| Dwie osoby piszące na czacie grupowym                              | N wierszy od M nadawców | M+ tur (jedna na kubełek nadawcy)          | M+ tur — czaty grupowe nie są scalane                                   |

## Nadrabianie po przestoju Gateway

Gdy Gateway jest offline (awaria, restart, uśpienie Maca, wyłączona maszyna), `imsg watch` wznawia działanie od bieżącego stanu `chat.db`, gdy Gateway ponownie się uruchomi — wszystko, co dotarło w czasie przerwy, domyślnie nigdy nie jest widziane. Catchup odtwarza te wiadomości przy następnym uruchomieniu, aby agent nie pomijał po cichu ruchu przychodzącego.

Catchup jest **domyślnie wyłączony**. Włącz go per kanał:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Jak to działa

Jedno przejście na każde uruchomienie `monitorIMessageProvider`, w sekwencji: gotowość `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → pętla wysyłania na żywo. Sam Catchup używa `chats.list` + per czat `messages.history` względem tego samego klienta JSON-RPC, którego używa `imsg watch`. Wszystko, co dotrze podczas przejścia Catchup, przepływa normalnie przez wysyłanie na żywo; istniejąca pamięć podręczna deduplikacji przychodzącej absorbuje każde nakładanie z odtwarzanymi wierszami.

Każdy odtworzony wiersz jest przekazywany przez ścieżkę wysyłania na żywo (`evaluateIMessageInbound` + `dispatchInboundMessage`), więc listy dozwolonych, polityka grup, debouncer, pamięć podręczna echa i potwierdzenia odczytu zachowują się identycznie dla wiadomości odtworzonych i na żywo.

### Semantyka kursora i ponawiania

Catchup przechowuje kursor per konto w `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (katalog stanu OpenClaw domyślnie to `~/.openclaw`, można go nadpisać przez `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Kursor przesuwa się po każdym udanym wysłaniu i jest wstrzymywany, gdy wysłanie wiersza rzuci wyjątek — następne uruchomienie ponawia ten sam wiersz od wstrzymanego kursora.
- Po `maxFailureRetries` kolejnych wyjątkach dla tego samego `guid` Catchup zapisuje `warn` i wymusza przesunięcie kursora poza zablokowaną wiadomość, aby kolejne uruchomienia mogły robić postępy.
- GUID-y, z których już zrezygnowano, są pomijane przy wykryciu (bez próby wysłania) w późniejszych uruchomieniach i zliczane w `skippedGivenUp` w podsumowaniu uruchomienia.

### Sygnały widoczne dla operatora

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Wiersz `WARN ... capped to perRunLimit` oznacza, że jedno uruchomienie nie opróżniło całych zaległości. Zwiększ `perRunLimit` (maks. 500), jeśli przerwy regularnie przekraczają domyślne przejście 50 wierszy.

### Kiedy zostawić wyłączone

- Gateway działa ciągle z automatycznym restartem watchdog, a przerwy zawsze są krótsze niż kilka sekund — domyślne wyłączenie jest w porządku.
- Wolumen DM jest niski, a pominięte wiadomości nie zmieniłyby zachowania agenta — początkowe okno `firstRunLookbackMinutes` może przy pierwszym włączeniu wysłać zaskakująco stary kontekst.

Gdy włączysz Catchup, pierwsze uruchomienie bez kursora spogląda wstecz tylko o `firstRunLookbackMinutes` (domyślnie 30 min), a nie o pełne okno `maxAgeMinutes` — zapobiega to odtwarzaniu długiej historii wiadomości sprzed włączenia.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Sprawdź binarkę i obsługę RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jeśli probe zgłasza brak obsługi RPC, zaktualizuj `imsg`. Jeśli akcje prywatnego API są niedostępne, uruchom `imsg launch` w sesji zalogowanego użytkownika macOS i ponownie wykonaj probe. Jeśli Gateway nie działa na macOS, użyj powyższej konfiguracji zdalnego Maca przez SSH zamiast domyślnej lokalnej ścieżki `imsg`.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Domyślne `cliPath: "imsg"` musi działać na Macu zalogowanym do Wiadomości. W systemie Linux lub Windows ustaw `channels.imessage.cliPath` na skrypt opakowujący, który łączy się przez SSH z tym Makiem i uruchamia `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Następnie uruchom:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia parowania (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - zachowanie listy dozwolonych `channels.imessage.groups`
    - konfigurację wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta Gateway
    - czy klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - czy ścieżka zdalna jest czytelna na Macu uruchamiającym Wiadomości

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Potwierdź, że Full Disk Access + Automation są przyznane dla kontekstu procesu uruchamiającego OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Wskaźniki odniesienia konfiguracji

- [Odniesienie konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles) — tabela tłumaczenia konfiguracji i przejście krok po kroku
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
