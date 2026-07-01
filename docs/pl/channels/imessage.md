---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Natywna obsługa iMessage przez imsg (JSON-RPC przez stdio), z akcjami prywatnego API do odpowiedzi, tapbacków, efektów, ankiet, załączników i zarządzania grupami. Preferowane dla nowych konfiguracji iMessage w OpenClaw, gdy wymagania hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W przypadku wdrożeń OpenClaw iMessage użyj `imsg` na zalogowanym hoście macOS Messages. Jeśli Gateway działa w systemie Linux lub Windows, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu.

**Odzyskiwanie ruchu przychodzącego jest automatyczne.** Po restarcie mostu lub Gateway iMessage odtwarza wiadomości pominięte w czasie niedostępności i tłumi przestarzałą „bombę zaległości”, którą Apple może opróżnić po odzyskaniu Push, deduplikując je tak, aby nic nie zostało wysłane dwukrotnie. Nie ma konfiguracji do włączenia — zobacz [Odzyskiwanie ruchu przychodzącego po restarcie mostu lub Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Obsługa BlueBubbles została usunięta. Zmigruj konfiguracje `channels.bluebubbles` do `channels.imessage`; OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Zacznij od [Usunięcie BlueBubbles i ścieżka imsg dla iMessage](/pl/announcements/bluebubbles-imessage), aby przeczytać krótkie ogłoszenie, albo od [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles), aby zobaczyć pełną tabelę migracji.
</Warning>

Status: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu). Zaawansowane akcje wymagają `imsg launch` i pomyślnej sondy prywatnego API.

<CardGroup cols={3}>
  <Card title="Akcje prywatnego API" icon="wand-sparkles" href="#private-api-actions">
    Odpowiedzi, tapbacki, efekty, ankiety, załączniki i zarządzanie grupami.
  </Card>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości DM iMessage domyślnie używają trybu parowania.
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

      <Step title="Uruchom gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Zatwierdź pierwsze parowanie DM (domyślne dmPolicy)">

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

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie, analizując skrypt wrappera SSH.
    `remoteHost` musi mieć postać `host` albo `user@host` (bez spacji i opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są weryfikowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Każdy wrapper `cliPath` lub proxy SSH, które umieścisz przed `imsg`, MUSI działać jak przezroczysty potok stdio dla długotrwałego JSON-RPC. OpenClaw wymienia małe, rozdzielane znakami nowej linii komunikaty JSON-RPC przez stdin/stdout wrappera przez cały czas działania kanału:

- Przekazuj każdy fragment/wiersz stdin **natychmiast, gdy bajty są dostępne** — nie czekaj na EOF.
- Szybko przekazuj każdy fragment/wiersz stdout w przeciwnym kierunku.
- Zachowuj znaki nowej linii.
- Unikaj blokujących odczytów o stałym rozmiarze (`read(4096)`, `cat | buffer`, domyślne `read` powłoki), które mogą zagłodzić małe ramki.
- Trzymaj stderr oddzielnie od strumienia stdout JSON-RPC.

Wrapper, który buforuje stdin do czasu wypełnienia dużego bloku, wywoła objawy wyglądające jak awaria iMessage — `imsg rpc timeout (chats.list)` lub powtarzające się restarty kanału — mimo że samo `imsg rpc` działa poprawnie. `ssh -T host imsg "$@"` (powyżej) jest bezpieczne, ponieważ przekazuje argumenty `cliPath` OpenClaw, takie jak `rpc` i `--db`. Potoki typu `ssh host imsg | grep -v '^DEBUG'` NIE są bezpieczne — narzędzia buforowane liniowo nadal mogą przetrzymywać ramki; użyj `stdbuf -oL -eL` na każdym etapie, jeśli musisz filtrować.
</Warning>

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Macu uruchamiającym `imsg`.
- Full Disk Access jest wymagany dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Uprawnienie Automation jest wymagane do wysyłania wiadomości przez Messages.app.
- Dla zaawansowanych akcji (reakcja / edycja / cofnięcie wysłania / odpowiedź w wątku / efekty / ankiety / operacje na grupach) System Integrity Protection musi być wyłączone — zobacz [Włączanie prywatnego API imsg](#enabling-the-imsg-private-api) poniżej. Podstawowe wysyłanie/odbieranie tekstu i multimediów działa bez tego.

<Tip>
Uprawnienia są przyznawane dla kontekstu procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe interaktywne polecenie w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Wysyłanie przez wrapper SSH kończy się niepowodzeniem z AppleEvents -1743">
  Konfiguracja przez zdalne SSH może odczytywać czaty, przechodzić `channels status --probe` i przetwarzać wiadomości przychodzące, podczas gdy wysyłka wychodząca nadal kończy się błędem autoryzacji AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Sprawdź bazę danych TCC zalogowanego użytkownika Maca albo System Settings > Privacy & Security > Automation. Jeśli wpis Automation jest zapisany dla `/usr/libexec/sshd-keygen-wrapper` zamiast procesu `imsg` lub lokalnej powłoki, macOS może nie pokazać użytecznego przełącznika Messages dla tego klienta po stronie serwera SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

W takim stanie powtarzanie `tccutil reset AppleEvents` lub ponowne uruchamianie `imsg send` przez ten sam wrapper SSH może nadal kończyć się niepowodzeniem, ponieważ kontekstem procesu wymagającym Automation dla Messages jest wrapper SSH, a nie aplikacja, której interfejs może nadać uprawnienia.

Zamiast tego użyj jednego z obsługiwanych kontekstów procesu `imsg`:

- Uruchom Gateway albo przynajmniej most `imsg` w lokalnej sesji zalogowanego użytkownika Messages.
- Uruchom Gateway przez LaunchAgent tego użytkownika po przyznaniu Full Disk Access i Automation z tej samej sesji.
- Jeśli zachowujesz topologię SSH z dwoma użytkownikami, sprawdź, czy prawdziwe wychodzące `imsg send` działa przez dokładnie ten wrapper, zanim włączysz kanał. Jeśli nie można przyznać Automation, skonfiguruj zamiast tego jednoużytkownikowe środowisko `imsg`, nie polegając na wrapperze SSH do wysyłania.

</Accordion>

## Włączanie prywatnego API imsg

`imsg` działa w dwóch trybach operacyjnych:

- **Tryb podstawowy** (domyślny, bez potrzeby zmian SIP): tekst i multimedia wychodzące przez `send`, obserwacja/historia przychodząca, lista czatów. To otrzymujesz od razu po świeżym `brew install steipete/tap/imsg` oraz standardowych uprawnieniach macOS opisanych wyżej.
- **Tryb prywatnego API**: `imsg` wstrzykuje pomocniczą dylib do `Messages.app`, aby wywoływać wewnętrzne funkcje `IMCore`. To odblokowuje `react`, `edit`, `unsend`, `reply` (w wątku), `sendWithEffect`, `poll` i `poll-vote` (natywne ankiety Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, a także wskaźniki pisania i potwierdzenia odczytu.

Aby uzyskać powierzchnię zaawansowanych akcji dokumentowaną na tej stronie kanału, potrzebujesz trybu prywatnego API. README `imsg` jednoznacznie określa wymaganie:

> Zaawansowane funkcje, takie jak `read`, `typing`, `launch`, bogate wysyłanie wspierane przez most, modyfikacja wiadomości i zarządzanie czatem, są opcjonalne. Wymagają wyłączenia SIP i wstrzyknięcia pomocniczej dylib do `Messages.app`. `imsg launch` odmawia wstrzyknięcia, gdy SIP jest włączone.

Technika wstrzykiwania pomocnika używa własnej dylib `imsg`, aby uzyskać dostęp do prywatnych API Messages. W ścieżce OpenClaw iMessage nie ma serwera zewnętrznego ani środowiska uruchomieniowego BlueBubbles.

<Warning>
**Wyłączenie SIP to realny kompromis bezpieczeństwa.** SIP jest jednym z podstawowych mechanizmów ochrony macOS przed uruchamianiem zmodyfikowanego kodu systemowego; wyłączenie go w całym systemie otwiera dodatkową powierzchnię ataku i skutki uboczne. Co istotne, **wyłączenie SIP na Macach Apple Silicon wyłącza też możliwość instalowania i uruchamiania aplikacji iOS na Macu**.

Traktuj to jako świadomy wybór operacyjny, a nie ustawienie domyślne. Jeśli Twój model zagrożeń nie toleruje wyłączonego SIP, wbudowane iMessage jest ograniczone do trybu podstawowego — tylko wysyłanie/odbieranie tekstu i multimediów, bez reakcji / edycji / cofnięcia wysłania / efektów / operacji na grupach.
</Warning>

### Konfiguracja

1. **Zainstaluj (lub zaktualizuj) `imsg`** na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Dane wyjściowe `imsg status --json` raportują `bridge_version`, `rpc_methods` i `selectors` dla poszczególnych metod, aby przed rozpoczęciem można było zobaczyć, co obsługuje bieżąca kompilacja.

2. **Wyłącz System Integrity Protection oraz (na nowoczesnym macOS) Library Validation.** Wstrzyknięcie niepochodzącej od Apple pomocniczej dylib do podpisanej przez Apple aplikacji `Messages.app` wymaga wyłączenia SIP **oraz** poluzowania walidacji bibliotek. Krok SIP w trybie Recovery zależy od wersji macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** wyłącz Library Validation przez Terminal, uruchom ponownie w Recovery Mode, wykonaj `csrutil disable`, uruchom ponownie.
   - **macOS 11+ (Big Sur i nowsze), Intel:** Recovery Mode (albo Internet Recovery), `csrutil disable`, uruchom ponownie.
   - **macOS 11+, Apple Silicon:** sekwencja startu przyciskiem zasilania, aby wejść do Recovery; w nowszych wersjach macOS przytrzymaj klawisz **Left Shift** podczas kliknięcia Continue, a następnie `csrutil disable`. Konfiguracje maszyn wirtualnych używają osobnego procesu, więc najpierw zrób migawkę VM.

   **W macOS 11 i nowszych samo `csrutil disable` zwykle nie wystarcza.** Apple nadal wymusza walidację bibliotek wobec `Messages.app` jako pliku binarnego platformy, więc pomocnik podpisany adhoc jest odrzucany (`Library Validation failed: ... platform binary, but mapped file is not`) nawet przy wyłączonym SIP. Po wyłączeniu SIP wyłącz także walidację bibliotek i uruchom ponownie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), zweryfikowane na 26.5.1:** wyłączone SIP **plus** powyższe polecenie `DisableLibraryValidation` wystarczają do wstrzyknięcia pomocnika w wersjach od 26.0 do 26.5.x. **Nie są wymagane żadne boot-args.** Plist jest czynnikiem decydującym i najczęściej pomijanym krokiem, gdy wstrzyknięcie na Tahoe kończy się niepowodzeniem:
   - **Z plist:** `imsg launch` wstrzykuje, a `imsg status` raportuje `advanced_features: true`.
   - **Bez plist (nawet z wyłączonym SIP):** `imsg launch` kończy się niepowodzeniem z `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI odrzuca pomocnik adhoc podczas ładowania, więc most nigdy nie staje się gotowy, a uruchomienie przekracza limit czasu. Ten timeout jest objawem, na który większość osób trafia na Tahoe, a poprawką jest powyższy plist, nie nic bardziej radykalnego.

   Zostało to potwierdzone kontrolowanym testem przed/po na macOS 26.5.1 (Apple Silicon): z plist dylib mapuje się do `Messages.app`, a most się uruchamia; po usunięciu plist i restarcie `imsg launch` generuje powyższy błąd timeout, a dylib nie jest zmapowana.

   Jeśli wstrzykiwanie `imsg launch` albo konkretne `selectors` zaczynają zwracać fałsz po uaktualnieniu macOS, ta blokada jest zwykle przyczyną. Sprawdź stan SIP i walidacji bibliotek, zanim uznasz, że nie powiódł się sam krok SIP. Jeśli te ustawienia są poprawne, a most nadal nie może wykonać wstrzyknięcia, zbierz `imsg status --json` oraz wynik `imsg launch` i zgłoś to do projektu `imsg` zamiast osłabiać dodatkowe systemowe mechanizmy bezpieczeństwa.

   Wykonaj procedurę Apple w trybie odzyskiwania dla swojego Maca, aby wyłączyć SIP przed uruchomieniem `imsg launch`.

3. **Wstrzyknij pomocnika.** Przy wyłączonym SIP i zalogowanej aplikacji Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` odmawia wstrzyknięcia, gdy SIP jest nadal włączony, więc służy to także jako potwierdzenie, że krok 2 zadziałał.

4. **Zweryfikuj most z OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Wpis iMessage powinien zgłaszać `works`, a `imsg status --json | jq '{rpc_methods, selectors}'` powinno pokazać możliwości udostępniane przez Twoją wersję macOS. Tworzenie ankiet wymaga `selectors.pollPayloadMessage`; głosowanie wymaga zarówno `selectors.pollVoteMessage`, jak i metody RPC `poll.vote`. Plugin OpenClaw ogłasza tylko akcje obsługiwane przez zbuforowaną sondę, natomiast pusta pamięć podręczna pozostaje optymistyczna i sonduje przy pierwszym wysłaniu.

Jeśli `openclaw channels status --probe` zgłasza kanał jako `works`, ale konkretne akcje podczas wysyłania zgłaszają błąd „iMessage `<action>` wymaga mostu prywatnego API imsg”, uruchom ponownie `imsg launch` — pomocnik może wypaść (restart Messages.app, aktualizacja OS itp.), a zbuforowany status `available: true` będzie nadal ogłaszał akcje do czasu odświeżenia przez kolejną sondę.

### Gdy nie możesz wyłączyć SIP

Jeśli wyłączenie SIP jest nieakceptowalne dla Twojego modelu zagrożeń:

- `imsg` wraca do trybu podstawowego — tylko tekst + media + odbieranie.
- Plugin OpenClaw nadal ogłasza wysyłanie tekstu/mediów i monitorowanie przychodzące; ukrywa tylko `react`, `edit`, `unsend`, `reply`, `sendWithEffect` oraz operacje grupowe z powierzchni akcji (zgodnie z bramką możliwości dla poszczególnych metod).
- Możesz uruchomić osobnego Maca bez Apple Silicon (albo dedykowanego Maca bota) z wyłączonym SIP dla obciążenia iMessage, pozostawiając SIP włączony na swoich głównych urządzeniach. Zobacz [Dedykowany użytkownik bota macOS (osobna tożsamość iMessage)](#deployment-patterns) poniżej.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady DM">
    `channels.imessage.dmPolicy` steruje wiadomościami bezpośrednimi:

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisy listy dozwolonych muszą identyfikować nadawców: uchwyty albo statyczne grupy dostępu nadawców (`accessGroup:<name>`). Użyj `channels.imessage.groupAllowFrom` dla celów czatu, takich jak `chat_id:*`, `chat_guid:*` albo `chat_identifier:*`; użyj `channels.imessage.groups` dla numerycznych kluczy rejestru `chat_id`.

  </Tab>

  <Tab title="Zasady grup + wzmianki">
    `channels.imessage.groupPolicy` steruje obsługą grup:

    - `allowlist` (domyślne po skonfigurowaniu)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Wpisy `groupAllowFrom` mogą też odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`).

    Fallback czasu wykonywania: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage używa `allowFrom`; ustaw `groupAllowFrom`, gdy dopuszczanie DM i grup ma się różnić.
    Uwaga czasu wykonywania: jeśli całkowicie brakuje `channels.imessage`, runtime wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    <Warning>
    Routing grupowy ma **dwie** bramki listy dozwolonych uruchamiane jedna po drugiej i obie muszą przejść:

    1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — uchwyt, `chat_guid`, `chat_identifier` albo `chat_id`.
    2. **Rejestr grup** (`channels.imessage.groups`) — przy `groupPolicy: "allowlist"` ta bramka wymaga albo wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo jawnego wpisu dla danego `chat_id` pod `groups`.

    Jeśli bramka 2 nie zawiera niczego, każda wiadomość grupowa jest odrzucana. Plugin emituje dwa sygnały poziomu `warn` przy domyślnym poziomie logowania:

    - jednorazowo na konto przy starcie: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - jednorazowo na `chat_id` w czasie wykonywania: `imessage: dropping group message from chat_id=<id> ...`

    DM nadal działają, ponieważ używają innej ścieżki kodu.

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

    Jeśli te linie `warn` pojawiają się w logu gateway, odrzuca bramka 2 — dodaj blok `groups`.
    </Warning>

    Bramkowanie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców bramkowania wzmianek nie da się egzekwować

    Polecenia sterujące od autoryzowanych nadawców mogą omijać bramkowanie wzmianek w grupach.

    `systemPrompt` dla grupy:

    Każdy wpis pod `channels.imessage.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do promptu systemowego agenta przy każdym przebiegu obsługującym wiadomość w tej grupie. Rozwiązywanie odzwierciedla rozwiązywanie promptu dla grup używane przez `channels.whatsapp.groups`:

    1. **Prompt systemowy konkretnej grupy** (`groups["<chat_id>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest tłumiony i do tej grupy nie jest stosowany żaden prompt systemowy.
    2. **Prompt systemowy symbolu wieloznacznego grup** (`groups["*"].systemPrompt`): używany, gdy konkretnego wpisu grupy całkowicie brakuje w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

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

    Prompty dla grup stosują się tylko do wiadomości grupowych — wiadomości bezpośrednie w tym kanale pozostają bez zmian.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - DM używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` DM iMessage są zwijane do głównej sesji agenta.
    - Sesje grup są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi wracają do iMessage przy użyciu metadanych kanału/celu pochodzenia.

    Zachowanie wątków podobnych do grupowych:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany pod `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania rozmów ACP

Starsze czaty iMessage można także wiązać z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM albo dozwolonego czatu grupowego.
- Przyszłe wiadomości w tej samej rozmowie iMessage będą kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu DM, takiego jak `+15555550123` albo `user@example.com`
- `chat_id:<id>` (zalecane dla stabilnych powiązań grup)
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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik bota macOS (osobna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz dedykowanego użytkownika macOS / zaloguj się jako taki użytkownik.
    2. Zaloguj się w Messages przy użyciu Apple ID bota w tym użytkowniku.
    3. Zainstaluj `imsg` w tym użytkowniku.
    4. Utwórz wrapper SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` do profilu tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń GUI (Automatyzacja + Pełny dostęp do dysku) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - gateway działa na Linux/VM
    - iMessage + `imsg` działa na Macu w Twoim tailnecie
    - wrapper `cliPath` używa SSH do uruchamiania `imsg`
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

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację dla poszczególnych kont pod `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii oraz listy dozwolonych katalogów głównych załączników.

  </Accordion>

  <Accordion title="Historia wiadomości bezpośrednich">
    Ustaw `channels.imessage.dmHistoryLimit`, aby zasilić nowe sesje wiadomości bezpośrednich najnowszą zdekodowaną historią `imsg` dla tej rozmowy. Użyj `channels.imessage.dms["<sender>"].historyLimit` dla nadpisań per nadawca, w tym `0`, aby wyłączyć historię dla nadawcy.

    Historia DM iMessage jest pobierana na żądanie z `imsg`. Pozostawienie `dmHistoryLimit` bez ustawienia wyłącza globalne zasilanie historią DM, ale dodatnia wartość `channels.imessage.dms["<sender>"].historyLimit` dla nadawcy nadal włącza zasilanie dla tego nadawcy.

  </Accordion>
</AccordionGroup>

## Media, dzielenie na części i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - pobieranie załączników przychodzących jest **domyślnie wyłączone** — ustaw `channels.imessage.includeAttachments: true`, aby przekazywać zdjęcia, notatki głosowe, wideo i inne załączniki do agenta. Gdy ta opcja jest wyłączona, iMessages zawierające tylko załączniki są odrzucane przed dotarciem do agenta i mogą w ogóle nie wygenerować wiersza dziennika `Inbound message`.
    - zdalne ścieżki załączników można pobierać przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar multimediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw po akapitach)

  </Accordion>

  <Accordion title="Formaty adresowania">
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

Gdy `imsg launch` działa, a `openclaw channels status --probe` zgłasza `privateApi.available: true`, narzędzie wiadomości może używać natywnych akcji iMessage oprócz zwykłego wysyłania tekstu.

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
  <Accordion title="Dostępne akcje">
    - **react**: Dodaj/usuń tapbacki iMessage (`messageId`, `emoji`, `remove`). Obsługiwane tapbacki mapują się na love, like, dislike, laugh, emphasize i question.
    - **reply**: Wyślij odpowiedź w wątku do istniejącej wiadomości (`messageId`, `text` lub `message`, plus `chatGuid`, `chatId`, `chatIdentifier` albo `to`).
    - **sendWithEffect**: Wyślij tekst z efektem iMessage (`text` lub `message`, `effect` albo `effectId`).
    - **edit**: Edytuj wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`, `text` lub `newText`).
    - **unsend**: Wycofaj wysłaną wiadomość w obsługiwanych wersjach macOS/prywatnego API (`messageId`).
    - **upload-file**: Wyślij multimedia/pliki (`buffer` jako base64 lub uzupełnione `media`/`path`/`filePath`, `filename`, opcjonalnie `asVoice`). Starszy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Zarządzaj czatami grupowymi, gdy bieżący cel jest rozmową grupową.
    - **poll**: Utwórz natywną ankietę Apple Messages (`pollQuestion`, `pollOption` powtórzone od 2 do 12 razy, plus `chatGuid`, `chatId`, `chatIdentifier` albo `to`). Odbiorcy na iOS/iPadOS/macOS 26+ widzą ją i głosują natywnie; starsze wersje OS otrzymują tekstowy fallback "Sent a poll". Wymaga `selectors.pollPayloadMessage`.
    - **poll-vote**: Zagłosuj w istniejącej ankiecie (`pollId` lub `messageId`, plus dokładnie jedno z `pollOptionIndex`, `pollOptionId` albo `pollOptionText`). Wymaga `selectors.pollVoteMessage` i metody RPC `poll.vote`.

    Zaakceptowane ankiety przychodzące są renderowane dla agenta z pytaniem, ponumerowanymi etykietami opcji, liczbą głosów i identyfikatorem wiadomości ankiety wymaganym przez `poll-vote`.

  </Accordion>

  <Accordion title="Identyfikatory wiadomości">
    Kontekst przychodzącego iMessage zawiera zarówno krótkie wartości `MessageSid`, jak i pełne identyfikatory GUID wiadomości, gdy są dostępne. Krótkie identyfikatory są ograniczone do ostatniej pamięci podręcznej odpowiedzi opartej na SQLite i przed użyciem są sprawdzane względem bieżącego czatu. Jeśli krótki identyfikator wygasł lub należy do innego czatu, ponów próbę z pełnym `MessageSidFull`.

  </Accordion>

  <Accordion title="Wykrywanie możliwości">
    OpenClaw ukrywa akcje prywatnego API tylko wtedy, gdy status sondy w pamięci podręcznej mówi, że mostek jest niedostępny. Jeśli status jest nieznany, akcje pozostają widoczne i leniwie uruchamiają sondy przy wysyłce, aby pierwsza akcja mogła się udać po `imsg launch` bez osobnego ręcznego odświeżania statusu.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu i pisanie">
    Gdy mostek prywatnego API działa, zaakceptowane czaty przychodzące są oznaczane jako przeczytane, a czaty bezpośrednie pokazują dymek pisania, gdy tylko tura zostanie zaakceptowana, podczas gdy agent przygotowuje kontekst i generuje odpowiedź. Wyłącz oznaczanie jako przeczytane za pomocą:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Starsze kompilacje `imsg`, które poprzedzają listę możliwości per metoda, po cichu wyłączą pisanie/odczyt; OpenClaw zapisuje jednorazowe ostrzeżenie po każdym restarcie, aby brak potwierdzenia był możliwy do przypisania.

  </Accordion>

  <Accordion title="Przychodzące tapbacki">
    OpenClaw subskrybuje tapbacki iMessage i kieruje zaakceptowane reakcje jako zdarzenia systemowe zamiast zwykłego tekstu wiadomości, więc tapback użytkownika nie uruchamia zwykłej pętli odpowiedzi.

    Trybem powiadomień steruje `channels.imessage.reactionNotifications`:

    - `"own"` (domyślnie): powiadamiaj tylko wtedy, gdy użytkownicy reagują na wiadomości utworzone przez bota.
    - `"all"`: powiadamiaj o wszystkich przychodzących tapbackach od autoryzowanych nadawców.
    - `"off"`: ignoruj przychodzące tapbacki.

    Nadpisania per konto używają `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reakcje zatwierdzania (👍 / 👎)">
    Gdy `approvals.exec.enabled` lub `approvals.plugin.enabled` ma wartość true, a żądanie jest kierowane do iMessage, Gateway dostarcza natywny monit o zatwierdzenie i akceptuje tapback, aby go rozstrzygnąć:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` pozostaje ręcznym fallbackiem: wyślij `/approve <id> allow-always` jako zwykłą odpowiedź.

    Obsługa reakcji wymaga, aby uchwyt reagującego użytkownika był jawnym zatwierdzającym. Lista zatwierdzających jest odczytywana z `channels.imessage.allowFrom` (lub `channels.imessage.accounts.<id>.allowFrom`); dodaj numer telefonu użytkownika w formacie E.164 albo jego adres e-mail Apple ID. Wpis wieloznaczny `"*"` jest honorowany, ale pozwala zatwierdzać dowolnemu nadawcy. Skrót reakcji celowo omija `reactionNotifications`, `dmPolicy` i `groupAllowFrom`, ponieważ jawna lista dozwolonych zatwierdzających jest jedyną bramką, która ma znaczenie dla rozstrzygania zatwierdzeń.

    **Zmiana zachowania w tym wydaniu:** Gdy `channels.imessage.allowFrom` nie jest puste, polecenie tekstowe `/approve <id> <decision>` jest teraz autoryzowane względem tej listy zatwierdzających (a nie szerszej listy dozwolonych DM). Nadawcy dozwoleni na liście DM, ale nieobecni w `allowFrom`, otrzymają jawne odrzucenie. Dodaj każdego operatora, który powinien móc zatwierdzać przez `/approve` (i przez reakcje), do `allowFrom`, aby zachować poprzednie zachowanie. Gdy `allowFrom` jest puste, starszy "same-chat fallback" pozostaje w mocy, a `/approve` nadal autoryzuje każdego, na kogo pozwala lista dozwolonych DM.

    Uwagi dla operatorów:
    - Powiązanie reakcji jest przechowywane zarówno w pamięci (z TTL dopasowanym do wygaśnięcia zatwierdzenia), jak i w trwałym magazynie kluczowanym Gateway, więc tapback, który dotrze krótko po restarcie Gateway, nadal rozstrzyga zatwierdzenie.
    - Tapbacki między urządzeniami z `is_from_me=true` (własna reakcja operatora na sparowanym urządzeniu Apple) są celowo ignorowane, aby bot nie mógł zatwierdzić sam siebie.
    - Starsze tapbacki w stylu tekstowym (`Liked "…"` jako zwykły tekst od bardzo starych klientów Apple) nie mogą rozstrzygać zatwierdzeń, ponieważ nie przenoszą GUID wiadomości; rozstrzyganie reakcji wymaga ustrukturyzowanych metadanych tapbacka emitowanych przez obecnych klientów macOS / iOS.

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

## Scalanie dzielonych wysyłek DM (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i URL — np. `Dump https://example.com/article` — aplikacja Wiadomości Apple dzieli wysyłkę na **dwa osobne wiersze `chat.db`**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Te dwa wiersze docierają do OpenClaw w odstępie ~0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często "wyślij mi URL") i widzi URL dopiero w turze 2 — kiedy kontekst polecenia jest już utracony. To jest potok wysyłania Apple, a nie coś wprowadzanego przez OpenClaw lub `imsg`.

`channels.imessage.coalesceSameSenderDms` włącza dla DM buforowanie kolejnych wierszy od tego samego nadawcy. Gdy `imsg` ujawnia strukturalny znacznik podglądu URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` w jednym z wierszy źródłowych, OpenClaw scala tylko tę rzeczywistą dzieloną wysyłkę i zachowuje pozostałe zbuforowane wiersze jako osobne tury. W starszych kompilacjach `imsg`, które w ogóle nie emitują metadanych dymka, OpenClaw nie potrafi odróżnić dzielonej wysyłki od osobnych wysyłek, więc fallback polega na scaleniu koszyka. Zachowuje to zachowanie sprzed metadanych zamiast regresji dzielonych wysyłek `Dump <url>` do dwóch tur. Czaty grupowe nadal wysyłają per wiadomość, aby zachować strukturę tur wielu użytkowników.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Twoi użytkownicy wklejają URL-e obok poleceń.
    - Możesz zaakceptować dodane opóźnienie tury DM (zobacz poniżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez kolejnych ładunków.

  </Tab>
  <Tab title="Włączanie">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Gdy flaga jest włączona i nie ma jawnego `messages.inbound.byChannel.imessage` ani globalnego `messages.inbound.debounceMs`, okno debounce rozszerza się do **7000 ms** (starsza wartość domyślna to 0 ms — bez debounce). Szersze okno jest wymagane, ponieważ rytm dzielonej wysyłki podglądu URL Apple może rozciągnąć się do kilku sekund, gdy Messages.app emituje wiersz podglądu.

    Aby samodzielnie dostroić okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisy">
    - **Precyzyjne scalanie wymaga bieżących metadanych ładunku `imsg`.** Gdy wiersz URL zawiera `balloon_bundle_id`, scalana jest tylko ta rzeczywista wysyłka podzielona, a inne zbuforowane wiersze pozostają osobno. W starszych kompilacjach `imsg`, które nie udostępniają metadanych dymku, OpenClaw awaryjnie scala zbuforowany kubeł, aby wysyłki podzielone `Dump <url>` nie cofnęły się do dwóch tur (tymczasowa zgodność wsteczna, usuwana po scalaniu wysyłek podzielonych w upstream `imsg`).
    - **Dodatkowe opóźnienie dla wiadomości DM.** Gdy flaga jest włączona, każda wiadomość DM (w tym samodzielne polecenia sterujące i pojedyncze tekstowe kontynuacje) czeka przed wysłaniem maksymalnie przez okno debounce, na wypadek gdyby nadchodził wiersz podglądu URL. Wiadomości w czacie grupowym zachowują natychmiastową wysyłkę.
    - **Scalone wyjście jest ograniczone.** Scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki są ograniczone do 20; wpisy źródłowe do 10 (powyżej tego limitu zachowywany jest pierwszy oraz najnowsze). Każdy źródłowy GUID jest śledzony w `coalescedMessageGuids` na potrzeby dalszej telemetrii.
    - **Tylko DM.** Czaty grupowe przechodzą do wysyłki per wiadomość, aby bot pozostawał responsywny, gdy pisze wiele osób.
    - **Opcjonalne, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian. Starsze konfiguracje BlueBubbles ustawiające `channels.bluebubbles.coalesceSameSenderDms` powinny przenieść tę wartość do `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenariusze i co widzi agent

Kolumna „Flaga włączona” pokazuje zachowanie w kompilacji `imsg`, która emituje `balloon_bundle_id`. W starszych kompilacjach `imsg`, które w ogóle nie emitują metadanych dymku, wiersze oznaczone poniżej jako „Dwie tury” / „N tur” zamiast tego wracają do starszego scalania (jedna tura): OpenClaw nie może strukturalnie odróżnić wysyłki podzielonej od osobnych wysyłek, więc zachowuje scalanie sprzed metadanych. Precyzyjne rozdzielanie aktywuje się, gdy kompilacja zacznie emitować metadane dymku.

| Użytkownik tworzy wiadomość                                         | `chat.db` tworzy                    | Flaga wyłączona (domyślnie)                      | Flaga włączona + okno (`imsg` emituje metadane dymku)                                               |
| ------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                          | 2 wiersze w odstępie ~1 s           | Dwie tury agenta: samo „Dump”, potem URL         | Jedna tura: scalony tekst `Dump https://example.com`                                                |
| `Save this 📎image.jpg caption` (załącznik + tekst)                 | 2 wiersze bez metadanych dymku URL  | Dwie tury                                        | Dwie tury po zaobserwowaniu metadanych; jedna scalona tura w starych sesjach bez metadanych/przed zatrzaśnięciem |
| `/status` (samodzielne polecenie)                                   | 1 wiersz                            | Natychmiastowa wysyłka                           | **Czekaj maksymalnie przez okno, potem wyślij**                                                     |
| URL wklejony samodzielnie                                           | 1 wiersz                            | Natychmiastowa wysyłka                           | Czekaj maksymalnie przez okno, potem wyślij                                                         |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, minuty później | 2 wiersze poza oknem                | Dwie tury                                        | Dwie tury (okno wygasa między nimi)                                                                 |
| Szybki zalew (>10 małych DM w oknie)                                | N wierszy bez metadanych dymku URL  | N tur                                            | N tur po zaobserwowaniu metadanych; jedna ograniczona scalona tura w starych sesjach bez metadanych/przed zatrzaśnięciem |
| Dwie osoby piszące w czacie grupowym                                | N wierszy od M nadawców             | M+ tur (jedna na kubeł nadawcy)                  | M+ tur — czaty grupowe nie są scalane                                                               |

## Odzyskiwanie przychodzących wiadomości po restarcie mostka lub Gateway

iMessage odzyskuje wiadomości pominięte, gdy Gateway był wyłączony, a jednocześnie tłumi przestarzałą „bombę zaległości”, którą Apple może opróżnić po odzyskiwaniu Push. Domyślne zachowanie jest zawsze włączone i opiera się na deduplikacji przychodzącej.

- **Deduplikacja odtworzeń.** Każda wysłana przychodząca wiadomość jest rejestrowana według swojego Apple GUID w trwałym stanie Plugin (`imessage.inbound-dedupe`), zajmowana podczas ingestii i zatwierdzana po obsłużeniu (zwalniana przy błędzie przejściowym, aby można było ponowić próbę). Wszystko, co już obsłużono, jest odrzucane zamiast wysyłane drugi raz. To pozwala odzyskiwaniu agresywnie odtwarzać bez księgowania każdej wiadomości osobno.
- **Odzyskiwanie po przestoju.** Przy starcie monitor zapamiętuje ostatni wysłany `chat.db` rowid (utrwalony kursor per konto) i przekazuje go do `imsg watch.subscribe` jako `since_rowid`, więc imsg odtwarza wiersze, które trafiły podczas niedostępności Gateway, a potem śledzi na żywo. Odtwarzanie jest ograniczone do najnowszych wierszy i do wiadomości mających maksymalnie ~2 godziny, a deduplikacja odrzuca wszystko, co już obsłużono.
- **Bariera wieku przestarzałych zaległości.** Wiersze powyżej granicy startowej są rzeczywiście na żywo; taki, którego data wysłania jest o ponad ~15 minut starsza niż czas przybycia, jest zaległością opróżnioną przez Push i jest tłumiony. Odtworzone wiersze (na granicy lub poniżej) używają zamiast tego szerszego okna odzyskiwania, więc niedawno pominięta wiadomość zostanie dostarczona, a dawna historia nie.

Odzyskiwanie działa zarówno w lokalnych, jak i zdalnych konfiguracjach `cliPath`, ponieważ odtwarzanie `since_rowid` działa przez to samo połączenie RPC `imsg`. Różnicą jest okno: gdy Gateway może odczytać `chat.db` (lokalnie), zakotwicza granicę rowid startu, ogranicza zakres odtwarzania i dostarcza pominięte wiadomości mające maksymalnie kilka godzin. Przez zdalne SSH `cliPath` nie może odczytać bazy danych, więc odtwarzanie nie ma ograniczenia, a każdy wiersz używa bariery wieku dla trybu na żywo — nadal odzyskuje niedawno pominięte wiadomości i nadal tłumi stare zaległości, tylko z węższym oknem na żywo. Uruchom Gateway na Macu z Messages, aby uzyskać szersze okno odzyskiwania.

### Sygnał widoczny dla operatora

Tłumione zaległości są logowane na domyślnym poziomie, nigdy nie są po cichu odrzucane (flaga `recovery` pokazuje, które okno zastosowano):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migracja

`channels.imessage.catchup.*` jest przestarzałe — odzyskiwanie po przestoju jest teraz automatyczne i nie wymaga konfiguracji w nowych instalacjach. Istniejące konfiguracje z `catchup.enabled: true` pozostają honorowane jako profil zgodności dla okna odtwarzania odzyskiwania. Wyłączone bloki catchup (`enabled: false` albo brak `enabled: true`) są wycofane; `openclaw doctor --fix` je usuwa.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie znaleziono imsg lub RPC nie jest obsługiwane">
    Sprawdź plik binarny i obsługę RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jeśli probe zgłasza brak obsługi RPC, zaktualizuj `imsg`. Jeśli akcje prywatnego API są niedostępne, uruchom `imsg launch` w sesji zalogowanego użytkownika macOS i ponów probe. Jeśli Gateway nie działa na macOS, użyj powyższej konfiguracji zdalnego Maca przez SSH zamiast domyślnej lokalnej ścieżki `imsg`.

  </Accordion>

  <Accordion title="Wiadomości są wysyłane, ale przychodzące iMessage nie docierają">
    Najpierw udowodnij, czy wiadomość dotarła do lokalnego Maca. Jeśli `chat.db` się nie zmienia, OpenClaw nie może odebrać wiadomości, nawet gdy `imsg status --json` zgłasza zdrowy mostek.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Jeśli wiadomości wysłane z telefonu nie tworzą nowych wierszy, napraw warstwę macOS Messages i Apple Push przed zmianą konfiguracji OpenClaw. Jednorazowe odświeżenie usługi często wystarcza:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Wyślij świeżą iMessage z telefonu i potwierdź nowy wiersz `chat.db` albo zdarzenie `imsg watch` przed debugowaniem sesji OpenClaw. Nie uruchamiaj tego jako okresowej pętli ponownego uruchamiania mostka; powtarzane `imsg launch` plus restarty Gateway podczas aktywnej pracy mogą przerywać dostawy i pozostawiać uruchomienia kanału w toku.

  </Accordion>

  <Accordion title="Gateway nie działa na macOS">
    Domyślne `cliPath: "imsg"` musi działać na Macu zalogowanym do Messages. Na Linuksie lub Windows ustaw `channels.imessage.cliPath` na skrypt opakowujący, który łączy się przez SSH z tym Makiem i uruchamia `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Następnie uruchom:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM są ignorowane">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia parowania (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Wiadomości grupowe są ignorowane">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - zachowanie listy dozwolonych `channels.imessage.groups`
    - konfigurację wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Zdalne załączniki zawodzą">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta Gateway
    - czy klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - czy ścieżka zdalna jest czytelna na Macu uruchamiającym Messages

  </Accordion>

  <Accordion title="Przeoczono monity uprawnień macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Potwierdź, że Pełny dostęp do dysku + Automatyzacja są przyznane dla kontekstu procesu uruchamiającego OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Wskaźniki odniesienia konfiguracji

- [Dokumentacja konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) — ogłoszenie i podsumowanie migracji
- [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) — tabela tłumaczenia konfiguracji i przełączenie krok po kroku
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
