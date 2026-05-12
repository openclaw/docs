---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Natywna obsługa iMessage za pośrednictwem imsg (JSON-RPC przez stdio), z akcjami prywatnego API do odpowiedzi, szybkich reakcji, efektów, załączników i zarządzania grupami. Zalecana dla nowych konfiguracji OpenClaw iMessage, gdy wymagania hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W przypadku wdrożeń OpenClaw iMessage użyj `imsg` na hoście macOS Messages z aktywnym logowaniem. Jeśli Twój Gateway działa w systemie Linux lub Windows, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu.

**Nadrabianie zaległości po niedostępności Gateway jest opcjonalne.** Po włączeniu (`channels.imessage.catchup.enabled: true`) Gateway odtwarza przy następnym uruchomieniu przychodzące wiadomości, które trafiły do `chat.db`, gdy był offline (awaria, restart, uśpienie Maca). Domyślnie wyłączone — zobacz [Nadrabianie po niedostępności Gateway](#catching-up-after-gateway-downtime). Zamyka [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Obsługa BlueBubbles została usunięta. Przenieś konfiguracje `channels.bluebubbles` do `channels.imessage`; OpenClaw obsługuje iMessage tylko przez `imsg`. Zacznij od [Usunięcie BlueBubbles i ścieżka iMessage przez imsg](/pl/announcements/bluebubbles-imessage), aby przeczytać krótkie ogłoszenie, albo od [Przechodzisz z BlueBubbles](/pl/channels/imessage-from-bluebubbles), aby zobaczyć pełną tabelę migracji.
</Warning>

Status: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu). Zaawansowane akcje wymagają `imsg launch` oraz udanej sondy prywatnego API.

<CardGroup cols={3}>
  <Card title="Akcje prywatnego API" icon="wand-sparkles" href="#private-api-actions">
    Odpowiedzi, tapbacki, efekty, załączniki i zarządzanie grupami.
  </Card>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne iMessage domyślnie używają trybu parowania.
  </Card>
  <Card title="Zdalny Mac" icon="terminal" href="#remote-mac-over-ssh">
    Użyj wrappera SSH, gdy Gateway nie działa na Macu z Messages.
  </Card>
  <Card title="Dokumentacja konfiguracji" icon="settings" href="/pl/gateway/config-channels#imessage">
    Pełna dokumentacja pól iMessage.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Lokalny Mac (szybka ścieżka)">
    <Steps>
      <Step title="Zainstaluj i zweryfikuj imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Skonfiguruj OpenClaw">

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

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Zatwierdź pierwsze parowanie wiadomości prywatnej (domyślne dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    OpenClaw wymaga tylko zgodnego ze stdio `cliPath`, więc możesz wskazać `cliPath` na skrypt wrappera, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.

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

    Jeśli `remoteHost` nie jest ustawiony, OpenClaw spróbuje wykryć go automatycznie, analizując skrypt wrappera SSH.
    `remoteHost` musi mieć postać `host` albo `user@host` (bez spacji ani opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta pośredniczącego musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są walidowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Macu uruchamiającym `imsg`.
- Wymagany jest Pełny dostęp do dysku dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Wymagane jest uprawnienie Automatyzacji do wysyłania wiadomości przez Messages.app.
- W przypadku zaawansowanych akcji (reakcja / edycja / cofnięcie wysłania / odpowiedź w wątku / efekty / operacje na grupach) Ochrona integralności systemu musi być wyłączona — zobacz poniżej [Włączanie prywatnego API imsg](#enabling-the-imsg-private-api). Podstawowe wysyłanie/odbieranie tekstu i multimediów działa bez tego.

<Tip>
Uprawnienia są przyznawane dla każdego kontekstu procesu. Jeśli Gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe polecenie interaktywne w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Włączanie prywatnego API imsg

`imsg` działa w dwóch trybach operacyjnych:

- **Tryb podstawowy** (domyślny, bez potrzeby zmian SIP): tekst i multimedia wychodzące przez `send`, obserwowanie/historia przychodzących wiadomości, lista czatów. To otrzymujesz od razu po świeżej instalacji `brew install steipete/tap/imsg` oraz standardowych uprawnieniach macOS opisanych wyżej.
- **Tryb prywatnego API**: `imsg` wstrzykuje pomocniczą bibliotekę dylib do `Messages.app`, aby wywoływać wewnętrzne funkcje `IMCore`. To odblokowuje `react`, `edit`, `unsend`, `reply` (wątkowe), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, a także wskaźniki pisania i potwierdzenia odczytu.

Aby uzyskać dostęp do zaawansowanej powierzchni akcji dokumentowanej na tej stronie kanału, potrzebujesz trybu prywatnego API. README `imsg` jasno opisuje to wymaganie:

> Zaawansowane funkcje, takie jak `read`, `typing`, `launch`, bogate wysyłanie oparte na mostku, modyfikacja wiadomości i zarządzanie czatami, są opcjonalne. Wymagają wyłączenia SIP oraz wstrzyknięcia pomocniczej biblioteki dylib do `Messages.app`. `imsg launch` odmawia wstrzyknięcia, gdy SIP jest włączony.

Technika wstrzykiwania pomocnika używa własnej biblioteki dylib `imsg`, aby uzyskać dostęp do prywatnych API Messages. W ścieżce OpenClaw iMessage nie ma serwera zewnętrznego ani środowiska uruchomieniowego BlueBubbles.

<Warning>
**Wyłączenie SIP to realny kompromis bezpieczeństwa.** SIP jest jedną z podstawowych ochron macOS przed uruchamianiem zmodyfikowanego kodu systemowego; wyłączenie jej w całym systemie otwiera dodatkową powierzchnię ataku i może powodować skutki uboczne. Co ważne, **wyłączenie SIP na Macach z Apple Silicon wyłącza również możliwość instalowania i uruchamiania aplikacji iOS na Macu**.

Traktuj to jako świadomy wybór operacyjny, a nie ustawienie domyślne. Jeśli Twój model zagrożeń nie dopuszcza wyłączenia SIP, wbudowane iMessage jest ograniczone do trybu podstawowego — tylko wysyłanie/odbieranie tekstu i multimediów, bez reakcji / edycji / cofania wysłania / efektów / operacji na grupach.
</Warning>

### Konfiguracja

1. **Zainstaluj (lub zaktualizuj) `imsg`** na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Wynik `imsg status --json` raportuje `bridge_version`, `rpc_methods` oraz `selectors` dla każdej metody, dzięki czemu możesz zobaczyć, co obsługuje bieżąca kompilacja, zanim zaczniesz.

2. **Wyłącz Ochronę integralności systemu.** Zależy to od wersji macOS, ponieważ podstawowe wymaganie Apple zależy od systemu operacyjnego i sprzętu:
   - **macOS 10.13–10.15 (Sierra–Catalina):** wyłącz Library Validation przez Terminal, uruchom ponownie do Recovery Mode, wykonaj `csrutil disable`, uruchom ponownie.
   - **macOS 11+ (Big Sur i nowsze), Intel:** Recovery Mode (lub Internet Recovery), `csrutil disable`, uruchom ponownie.
   - **macOS 11+, Apple Silicon:** sekwencja startowa z przyciskiem zasilania, aby wejść do Recovery; w najnowszych wersjach macOS przytrzymaj klawisz **Left Shift** po kliknięciu Continue, a następnie `csrutil disable`. Konfiguracje maszyn wirtualnych używają osobnego przepływu — najpierw wykonaj migawkę VM.
   - **macOS 26 / Tahoe:** zasady walidacji bibliotek i kontrole prywatnych uprawnień `imagent` zostały dodatkowo zaostrzone; `imsg` może wymagać zaktualizowanej kompilacji, aby nadążyć. Jeśli wstrzykiwanie `imsg launch` lub konkretne `selectors` zaczną zwracać false po dużej aktualizacji macOS, sprawdź informacje o wydaniach `imsg`, zanim uznasz, że krok SIP się powiódł.

   Wykonaj przepływ Apple dla Recovery Mode odpowiedni dla Twojego Maca, aby wyłączyć SIP przed uruchomieniem `imsg launch`.

3. **Wstrzyknij pomocnika.** Gdy SIP jest wyłączony, a Messages.app zalogowane:

   ```bash
   imsg launch
   ```

   `imsg launch` odmawia wstrzyknięcia, jeśli SIP nadal jest włączony, więc działa to też jako potwierdzenie, że krok 2 został wykonany.

4. **Zweryfikuj mostek z OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Wpis iMessage powinien zgłaszać `works`, a `imsg status --json | jq '.selectors'` powinno pokazywać `retractMessagePart: true` oraz selektory edycji / pisania / odczytu, które udostępnia Twoja kompilacja macOS. Bramkowanie poszczególnych metod przez Plugin OpenClaw w `actions.ts` reklamuje tylko akcje, których bazowy selektor ma wartość `true`, więc powierzchnia akcji widoczna na liście narzędzi agenta odzwierciedla to, co mostek naprawdę potrafi zrobić na tym hoście.

Jeśli `openclaw channels status --probe` raportuje kanał jako `works`, ale konkretne akcje zgłaszają "iMessage `<action>` requires the imsg private API bridge" w czasie wysyłki, uruchom ponownie `imsg launch` — pomocnik może wypaść (restart Messages.app, aktualizacja systemu itd.), a zapisany w pamięci podręcznej status `available: true` będzie nadal reklamował akcje do czasu, aż następna sonda go odświeży.

### Gdy nie możesz wyłączyć SIP

Jeśli wyłączenie SIP nie jest akceptowalne w Twoim modelu zagrożeń:

- `imsg` wraca do trybu podstawowego — tylko tekst + multimedia + odbiór.
- Plugin OpenClaw nadal reklamuje wysyłanie tekstu/multimediów i monitorowanie przychodzących wiadomości; po prostu ukrywa `react`, `edit`, `unsend`, `reply`, `sendWithEffect` oraz operacje na grupach z powierzchni akcji (zgodnie z bramką możliwości dla poszczególnych metod).
- Możesz uruchomić osobnego Maca bez Apple Silicon (lub dedykowanego Maca-bota) z wyłączonym SIP dla obciążenia iMessage, pozostawiając SIP włączony na swoich głównych urządzeniach. Zobacz poniżej [Dedykowany użytkownik macOS dla bota (osobna tożsamość iMessage)](#deployment-patterns).

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasada wiadomości prywatnych">
    `channels.imessage.dmPolicy` kontroluje wiadomości bezpośrednie:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisami listy dozwolonych mogą być uchwyty, statyczne grupy dostępu nadawców (`accessGroup:<name>`) albo cele czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Zasada grup + wzmianki">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślnie, gdy skonfigurowane)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Wpisy `groupAllowFrom` mogą też odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`).

    Zapasowe zachowanie w czasie działania: jeśli `groupAllowFrom` nie jest ustawione, kontrole nadawców grup iMessage wracają do `allowFrom`, gdy jest dostępne.
    Uwaga dotycząca czasu działania: jeśli całkowicie brakuje `channels.imessage`, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli ustawione jest `channels.defaults.groupPolicy`).

    <Warning>
    Routing grup ma **dwie** bramki listy dozwolonych uruchamiane jedna po drugiej i obie muszą przejść:

    1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — uchwyt, `chat_guid`, `chat_identifier` albo `chat_id`.
    2. **Rejestr grup** (`channels.imessage.groups`) — przy `groupPolicy: "allowlist"` ta bramka wymaga albo wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo jawnego wpisu dla konkretnego `chat_id` pod `groups`.

    Jeśli bramka 2 nie ma żadnych wpisów, każda wiadomość grupowa jest odrzucana. Plugin emituje dwa sygnały na poziomie `warn` przy domyślnym poziomie logowania:

    - jednorazowo dla konta przy starcie: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - jednorazowo dla `chat_id` w czasie działania: `imessage: dropping group message from chat_id=<id> ...`

    Wiadomości prywatne nadal działają, ponieważ korzystają z innej ścieżki kodu.

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

    Jeśli te wiersze `warn` pojawią się w dzienniku Gateway, bramka 2 odrzuca ruch — dodaj blok `groups`.
    </Warning>

    Wspomnij o bramkowaniu dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców bramkowanie wzmianek nie może być egzekwowane

    Polecenia sterujące od autoryzowanych nadawców mogą omijać bramkowanie wzmianek w grupach.

    `systemPrompt` dla grupy:

    Każdy wpis w `channels.imessage.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do systemowego promptu agenta przy każdej turze obsługującej wiadomość w tej grupie. Rozwiązywanie odzwierciedla rozwiązywanie promptu dla grupy używane przez `channels.whatsapp.groups`:

    1. **Systemowy prompt konkretnej grupy** (`groups["<chat_id>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest pomijany i do tej grupy nie jest stosowany żaden systemowy prompt.
    2. **Systemowy prompt wieloznaczny grupy** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

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

    Prompty dla grup mają zastosowanie tylko do wiadomości grupowych — wiadomości bezpośrednie w tym kanale pozostają bez zmian.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Wiadomości prywatne używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości prywatne iMessage są zwijane do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału docelowego/pochodzenia.

    Zachowanie wątków podobnych do grupowych:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage mogą być również powiązane z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości prywatnej lub dozwolonego czatu grupowego.
- Przyszłe wiadomości w tej samej konwersacji iMessage są kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu wiadomości prywatnej, takiego jak `+15555550123` lub `user@example.com`
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

## Wzorce wdrażania

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz dedykowanego użytkownika macOS lub zaloguj się jako taki użytkownik.
    2. Zaloguj się do Messages przy użyciu Apple ID bota w tym użytkowniku.
    3. Zainstaluj `imsg` u tego użytkownika.
    4. Utwórz opakowanie SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Ustaw `channels.imessage.accounts.<id>.cliPath` i `.dbPath` na profil tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń w GUI (Automatyzacja + Pełny dostęp do dysku) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Typowa topologia:

    - Gateway działa w systemie Linux/VM
    - iMessage + `imsg` działa na Macu w Twojej sieci tailnet
    - opakowanie `cliPath` używa SSH do uruchomienia `imsg`
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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP były nieinteraktywne.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` było wypełnione.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage obsługuje konfigurację dla konta w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i listy dozwolonych katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Media, dzielenie na fragmenty i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i media">
    - pobieranie załączników przychodzących jest **domyślnie wyłączone** — ustaw `channels.imessage.includeAttachments: true`, aby przekazywać zdjęcia, notatki głosowe, wideo i inne załączniki do agenta. Gdy jest wyłączone, iMessages zawierające wyłącznie załączniki są odrzucane przed dotarciem do agenta i mogą w ogóle nie wygenerować wpisu dziennika `Inbound message`.
    - zdalne ścieżki załączników można pobierać przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalnie)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar mediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Dzielenie wychodzących wiadomości na fragmenty">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia na fragmenty: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw według akapitów)

  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są też cele oparte na uchwytach:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Akcje prywatnego API

Gdy `imsg launch` działa, a `openclaw channels status --probe` zgłasza `privateApi.available: true`, narzędzie wiadomości może używać natywnych dla iMessage akcji oprócz zwykłego wysyłania tekstu.

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
  <Accordion title="Dostępne akcje">
    - **react**: Dodaj/usuń tapbacki iMessage (`messageId`, `emoji`, `remove`). Obsługiwane tapbacki mapują się na miłość, polubienie, niechęć, śmiech, podkreślenie i pytanie.
    - **reply**: Wyślij odpowiedź w wątku do istniejącej wiadomości (`messageId`, `text` lub `message`, plus `chatGuid`, `chatId`, `chatIdentifier` albo `to`).
    - **sendWithEffect**: Wyślij tekst z efektem iMessage (`text` lub `message`, `effect` albo `effectId`).
    - **edit**: Edytuj wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`, `text` lub `newText`).
    - **unsend**: Cofnij wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`).
    - **upload-file**: Wyślij media/pliki (`buffer` jako base64 albo uwodnione `media`/`path`/`filePath`, `filename`, opcjonalnie `asVoice`). Starszy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Zarządzaj czatami grupowymi, gdy bieżący cel jest rozmową grupową.

  </Accordion>

  <Accordion title="Identyfikatory wiadomości">
    Kontekst przychodzący iMessage obejmuje zarówno krótkie wartości `MessageSid`, jak i pełne identyfikatory GUID wiadomości, gdy są dostępne. Krótkie identyfikatory są ograniczone do ostatniej pamięci podręcznej odpowiedzi w pamięci i przed użyciem są sprawdzane względem bieżącego czatu. Jeśli krótki identyfikator wygasł albo należy do innego czatu, ponów próbę z pełnym `MessageSidFull`.

  </Accordion>

  <Accordion title="Wykrywanie możliwości">
    OpenClaw ukrywa akcje prywatnego API tylko wtedy, gdy zapisany w pamięci podręcznej status sondy mówi, że mostek jest niedostępny. Jeśli status jest nieznany, akcje pozostają widoczne i leniwie uruchamiają sondy przy wysyłce, aby pierwsza akcja mogła się powieść po `imsg launch` bez osobnego ręcznego odświeżania statusu.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu i pisanie">
    Gdy mostek prywatnego API działa, zaakceptowane czaty przychodzące są oznaczane jako przeczytane przed wysłaniem do agenta, a nadawcy jest pokazywany dymek pisania, gdy agent generuje odpowiedź. Wyłącz oznaczanie jako przeczytane za pomocą:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Starsze wersje `imsg`, sprzed listy możliwości dla poszczególnych metod, po cichu wyłączą pisanie/odczyt; OpenClaw zapisuje jednorazowe ostrzeżenie przy każdym ponownym uruchomieniu, aby można było przypisać brakujące potwierdzenie.

  </Accordion>

  <Accordion title="Przychodzące tapbacki">
    OpenClaw subskrybuje tapbacki iMessage i kieruje zaakceptowane reakcje jako zdarzenia systemowe zamiast zwykłego tekstu wiadomości, więc tapback użytkownika nie uruchamia zwykłej pętli odpowiedzi.

    Tryb powiadomień kontroluje `channels.imessage.reactionNotifications`:

    - `"own"` (domyślnie): powiadamiaj tylko wtedy, gdy użytkownicy reagują na wiadomości napisane przez bota.
    - `"all"`: powiadamiaj o wszystkich przychodzących tapbackach od autoryzowanych nadawców.
    - `"off"`: ignoruj przychodzące tapbacki.

    Nadpisania dla poszczególnych kont używają `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie zezwala na zapisy konfiguracji inicjowane przez kanał (dla `/config set|unset`, gdy `commands.config: true`).

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

## Scalanie podzielonych wiadomości prywatnych (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i URL — np. `Dump https://example.com/article` — aplikacja Messages firmy Apple dzieli wysyłkę na **dwa osobne wiersze `chat.db`**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Te dwa wiersze docierają do OpenClaw w odstępie około 0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 — gdy kontekst polecenia jest już utracony. To jest potok wysyłania Apple, a nie coś wprowadzanego przez OpenClaw lub `imsg`.

`channels.imessage.coalesceSameSenderDms` włącza dla DM scalanie kolejnych wierszy od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są wysyłane osobno dla każdej wiadomości, aby zachować strukturę tur wielu użytkowników.

<Tabs>
  <Tab title="When to enable">
    Włącz, gdy:

    - Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Użytkownicy wklejają URL-e, obrazy lub długą treść obok poleceń.
    - Możesz zaakceptować dodatkowe opóźnienie tur DM (zobacz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie przepływy to jednorazowe polecenia bez dalszych payloadów.

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

    Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.imessage` okno debounce rozszerza się do **2500 ms** (starsza wartość domyślna to 0 ms — bez debounce). Szersze okno jest wymagane, ponieważ stosowany przez Apple rytm podzielonego wysyłania 0,8-2,0 s nie mieści się w ciaśniejszej wartości domyślnej.

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
    - **Dodatkowe opóźnienie dla wiadomości DM.** Przy włączonej fladze każda DM (w tym samodzielne polecenia sterujące i pojedyncze tekstowe kontynuacje) czeka do końca okna debounce przed wysłaniem, na wypadek gdyby miał nadejść wiersz payloadu. Wiadomości czatu grupowego zachowują natychmiastowe wysyłanie.
    - **Scalony wynik ma limity.** Scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki są ograniczone do 20; wpisy źródłowe do 10 (po przekroczeniu tego limitu zachowywany jest pierwszy i najnowszy). Każdy GUID źródła jest śledzony w `coalescedMessageGuids` dla dalszej telemetrii.
    - **Tylko DM.** Czaty grupowe przechodzą do wysyłania osobno dla każdej wiadomości, dzięki czemu bot pozostaje responsywny, gdy pisze wiele osób.
    - **Włączane świadomie, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian. Starsze konfiguracje BlueBubbles ustawiające `channels.bluebubbles.coalesceSameSenderDms` powinny przenieść tę wartość do `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Użytkownik tworzy                                                  | `chat.db` generuje    | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedno wysłanie)                        | 2 wiersze w odstępie ~1 s | Dwie tury agenta: samo "Dump", potem URL | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 wiersze             | Dwie tury (załącznik porzucony przy scalaniu) | Jedna tura: tekst + obraz zachowane                                     |
| `/status` (samodzielne polecenie)                                  | 1 wiersz              | Natychmiastowe wysłanie                 | **Czeka do końca okna, potem wysyła**                                   |
| URL wklejony samodzielnie                                          | 1 wiersz              | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w kubełku)                    |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, w odstępie minut | 2 wiersze poza oknem | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                     |
| Szybka seria (>10 małych DM w oknie)                               | N wierszy             | N tur                                   | Jedna tura, ograniczony wynik (pierwszy + najnowszy, zastosowane limity tekstu/załączników) |
| Dwie osoby piszące w czacie grupowym                               | N wierszy od M nadawców | M+ tur (jedna na kubełek nadawcy)       | M+ tur — czaty grupowe nie są scalane                                   |

## Nadrabianie po przestoju Gateway

Gdy Gateway jest offline (awaria, restart, uśpienie Maca, wyłączona maszyna), `imsg watch` wznawia pracę od bieżącego stanu `chat.db` po ponownym uruchomieniu Gateway — wszystko, co dotarło w trakcie przerwy, domyślnie nigdy nie zostaje zauważone. Nadrabianie odtwarza te wiadomości przy następnym uruchomieniu, aby agent nie pomijał po cichu ruchu przychodzącego.

Nadrabianie jest **domyślnie wyłączone**. Włącz je per kanał:

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

### Jak działa

Jedno przejście na każde uruchomienie `monitorIMessageProvider`, w sekwencji: gotowość `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → pętla wysyłania live. Samo nadrabianie używa `chats.list` + `messages.history` per czat względem tego samego klienta JSON-RPC, którego używa `imsg watch`. Wszystko, co dotrze podczas przebiegu nadrabiania, normalnie przechodzi przez wysyłanie live; istniejąca pamięć podręczna deduplikacji ruchu przychodzącego wchłania wszelkie nakładanie się z odtworzonymi wierszami.

Każdy odtwarzany wiersz jest podawany przez ścieżkę wysyłania live (`evaluateIMessageInbound` + `dispatchInboundMessage`), więc listy dozwolonych, polityka grup, debouncer, pamięć podręczna echo i potwierdzenia odczytu zachowują się identycznie dla wiadomości odtwarzanych i live.

### Semantyka kursora i ponowień

Nadrabianie utrzymuje kursor per konto w `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (katalog stanu OpenClaw domyślnie to `~/.openclaw`, można go nadpisać przez `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Kursor przesuwa się po każdym udanym wysłaniu i pozostaje w miejscu, gdy wysłanie wiersza rzuci wyjątek — następne uruchomienie ponawia ten sam wiersz od zatrzymanego kursora.
- Po `maxFailureRetries` kolejnych wyjątkach dla tego samego `guid` nadrabianie zapisuje `warn` i wymusza przesunięcie kursora za zablokowaną wiadomość, aby kolejne uruchomienia mogły postępować.
- GUID-y, z których już zrezygnowano, są pomijane przy napotkaniu (bez próby wysłania) w późniejszych uruchomieniach i zliczane pod `skippedGivenUp` w podsumowaniu przebiegu.

### Sygnały widoczne dla operatora

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Wiersz `WARN ... capped to perRunLimit` oznacza, że pojedyncze uruchomienie nie opróżniło całego backlogu. Zwiększ `perRunLimit` (maks. 500), jeśli przerwy regularnie przekraczają domyślne przejście 50 wierszy.

### Kiedy pozostawić wyłączone

- Gateway działa ciągle z automatycznym restartem przez watchdog, a przerwy zawsze trwają < kilka sekund — domyślne wyłączenie jest w porządku.
- Wolumen DM jest niski, a pominięte wiadomości nie zmieniłyby zachowania agenta — początkowe okno `firstRunLookbackMinutes` może przy pierwszym włączeniu wysłać zaskakująco stary kontekst.

Po włączeniu nadrabiania pierwsze uruchomienie bez kursora patrzy wstecz tylko o `firstRunLookbackMinutes` (domyślnie 30 min), a nie o pełne okno `maxAgeMinutes` — zapobiega to odtworzeniu długiej historii wiadomości sprzed włączenia.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Zweryfikuj binarkę i obsługę RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jeśli probe zgłasza brak obsługi RPC, zaktualizuj `imsg`. Jeśli akcje prywatnego API są niedostępne, uruchom `imsg launch` w sesji zalogowanego użytkownika macOS i ponów probe. Jeśli Gateway nie działa na macOS, użyj powyższej konfiguracji zdalnego Maca przez SSH zamiast domyślnej lokalnej ścieżki `imsg`.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Domyślne `cliPath: "imsg"` musi działać na Macu zalogowanym do Messages. W systemie Linux lub Windows ustaw `channels.imessage.cliPath` na skrypt opakowujący, który łączy się SSH z tym Makiem i uruchamia `imsg "$@"`.

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
    - klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - czytelność zdalnej ścieżki na Macu uruchamiającym Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zaakceptuj monity:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Potwierdź, że Full Disk Access + Automation zostały przyznane dla kontekstu procesu uruchamiającego OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Odnośniki do referencji konfiguracji

- [Referencja konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Usunięcie BlueBubbles i ścieżka iMessage przez imsg](/pl/announcements/bluebubbles-imessage) — ogłoszenie i podsumowanie migracji
- [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) — tabela translacji konfiguracji i migracja krok po kroku
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
