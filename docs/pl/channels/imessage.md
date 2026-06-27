---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Natywna obsługa iMessage przez imsg (JSON-RPC przez stdio), z akcjami prywatnego API dla odpowiedzi, tapbacków, efektów, załączników i zarządzania grupami. Preferowane w nowych konfiguracjach OpenClaw iMessage, gdy wymagania hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W przypadku wdrożeń OpenClaw iMessage użyj `imsg` na hoście macOS Messages z zalogowanym kontem. Jeśli Twój Gateway działa w systemie Linux lub Windows, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu.

**Odzyskiwanie ruchu przychodzącego jest automatyczne.** Po ponownym uruchomieniu mostka lub Gateway iMessage odtwarza wiadomości pominięte podczas przestoju i tłumi nieaktualną „bombę zaległości”, którą Apple może wypchnąć po odzyskaniu Push, deduplikując je tak, aby nic nie zostało wysłane dwukrotnie. Nie ma konfiguracji do włączania — zobacz [Odzyskiwanie ruchu przychodzącego po ponownym uruchomieniu mostka lub Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Obsługa BlueBubbles została usunięta. Przenieś konfiguracje `channels.bluebubbles` do `channels.imessage`; OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Zacznij od [Usunięcie BlueBubbles i ścieżka imsg dla iMessage](/pl/announcements/bluebubbles-imessage), aby przeczytać krótkie ogłoszenie, albo od [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles), aby zobaczyć pełną tabelę migracji.
</Warning>

Status: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu). Zaawansowane akcje wymagają `imsg launch` i udanego sondowania prywatnego API.

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

      <Step title="Uruchom gateway">

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

    Jeśli `remoteHost` nie jest ustawiony, OpenClaw próbuje wykryć go automatycznie, analizując skrypt wrappera SSH.
    `remoteHost` musi mieć postać `host` albo `user@host` (bez spacji ani opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są weryfikowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Każdy wrapper `cliPath` lub proxy SSH, które umieścisz przed `imsg`, MUSI zachowywać się jak przezroczysty potok stdio dla długotrwałego JSON-RPC. OpenClaw wymienia małe komunikaty JSON-RPC rozdzielane znakami nowego wiersza przez stdin/stdout wrappera przez cały czas życia kanału:

- Przekazuj każdy fragment/wiersz stdin **natychmiast, gdy bajty są dostępne** — nie czekaj na EOF.
- Niezwłocznie przekazuj każdy fragment/wiersz stdout w przeciwnym kierunku.
- Zachowuj znaki nowego wiersza.
- Unikaj blokujących odczytów o stałym rozmiarze (`read(4096)`, `cat | buffer`, domyślne powłokowe `read`), które mogą zagłodzić małe ramki.
- Trzymaj stderr oddzielnie od strumienia stdout JSON-RPC.

Wrapper, który buforuje stdin do czasu zapełnienia dużego bloku, spowoduje objawy wyglądające jak awaria iMessage — `imsg rpc timeout (chats.list)` albo powtarzające się restarty kanału — mimo że sam `imsg rpc` jest sprawny. `ssh -T host imsg "$@"` (powyżej) jest bezpieczne, ponieważ przekazuje argumenty `cliPath` OpenClaw, takie jak `rpc` i `--db`. Potoki takie jak `ssh host imsg | grep -v '^DEBUG'` NIE są bezpieczne — narzędzia buforowane liniowo nadal mogą zatrzymywać ramki; użyj `stdbuf -oL -eL` na każdym etapie, jeśli musisz filtrować.
</Warning>

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Macu uruchamiającym `imsg`.
- Pełny dostęp do dysku jest wymagany dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy Messages).
- Uprawnienie Automatyzacji jest wymagane do wysyłania wiadomości przez Messages.app.
- W przypadku zaawansowanych akcji (reakcja / edycja / cofnięcie wysłania / odpowiedź w wątku / efekty / operacje grupowe) ochrona System Integrity Protection musi być wyłączona — zobacz [Włączanie prywatnego API imsg](#enabling-the-imsg-private-api) poniżej. Podstawowe wysyłanie/odbieranie tekstu i multimediów działa bez tego.

<Tip>
Uprawnienia są przyznawane dla kontekstu procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe polecenie interaktywne w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Wysyłanie przez wrapper SSH kończy się błędem AppleEvents -1743">
  Konfiguracja zdalna przez SSH może odczytywać czaty, przechodzić `channels status --probe` i przetwarzać wiadomości przychodzące, podczas gdy wysyłanie wychodzące nadal kończy się błędem autoryzacji AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Sprawdź bazę TCC zalogowanego użytkownika Maca albo Ustawienia systemowe > Prywatność i ochrona > Automatyzacja. Jeśli wpis Automatyzacji jest zapisany dla `/usr/libexec/sshd-keygen-wrapper` zamiast procesu `imsg` lub lokalnej powłoki, macOS może nie udostępnić użytecznego przełącznika Messages dla tego klienta po stronie serwera SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

W takim stanie powtarzanie `tccutil reset AppleEvents` albo ponowne uruchamianie `imsg send` przez ten sam wrapper SSH może nadal kończyć się niepowodzeniem, ponieważ kontekstem procesu, który potrzebuje Automatyzacji Messages, jest wrapper SSH, a nie aplikacja, której interfejs może przyznać uprawnienie.

Użyj zamiast tego jednego z obsługiwanych kontekstów procesu `imsg`:

- Uruchom Gateway albo przynajmniej mostek `imsg` w lokalnej sesji zalogowanego użytkownika Messages.
- Uruchom Gateway przez LaunchAgent dla tego użytkownika po przyznaniu Pełnego dostępu do dysku i Automatyzacji z tej samej sesji.
- Jeśli zachowujesz topologię SSH z dwoma użytkownikami, sprawdź, czy rzeczywiste wychodzące `imsg send` działa przez dokładnie ten wrapper przed włączeniem kanału. Jeśli nie da się przyznać Automatyzacji, zamiast polegać na wrapperze SSH do wysyłania, skonfiguruj jednoużytkownikowe środowisko `imsg`.

</Accordion>

## Włączanie prywatnego API imsg

`imsg` działa w dwóch trybach operacyjnych:

- **Tryb podstawowy** (domyślny, bez wymaganych zmian SIP): tekst i multimedia wychodzące przez `send`, obserwacja/historia przychodząca, lista czatów. To otrzymujesz od razu po świeżym `brew install steipete/tap/imsg` oraz standardowych uprawnieniach macOS opisanych powyżej.
- **Tryb prywatnego API**: `imsg` wstrzykuje pomocniczą bibliotekę dylib do `Messages.app`, aby wywoływać wewnętrzne funkcje `IMCore`. To odblokowuje `react`, `edit`, `unsend`, `reply` (wątkowe), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, a także wskaźniki pisania i potwierdzenia odczytu.

Aby uzyskać dostęp do zaawansowanych akcji dokumentowanych na tej stronie kanału, potrzebujesz trybu prywatnego API. README `imsg` jasno określa wymaganie:

> Zaawansowane funkcje, takie jak `read`, `typing`, `launch`, bogate wysyłanie oparte na mostku, modyfikowanie wiadomości i zarządzanie czatami, są opcjonalne. Wymagają wyłączenia SIP oraz wstrzyknięcia pomocniczej biblioteki dylib do `Messages.app`. `imsg launch` odmawia wstrzyknięcia, gdy SIP jest włączone.

Technika wstrzykiwania pomocnika używa własnej biblioteki dylib `imsg`, aby uzyskać dostęp do prywatnych API Messages. W ścieżce OpenClaw iMessage nie ma serwera zewnętrznego ani środowiska uruchomieniowego BlueBubbles.

<Warning>
**Wyłączenie SIP to realny kompromis bezpieczeństwa.** SIP jest jedną z podstawowych ochron macOS przed uruchamianiem zmodyfikowanego kodu systemowego; wyłączenie go w całym systemie otwiera dodatkową powierzchnię ataku i skutki uboczne. Warto zauważyć, że **wyłączenie SIP na Macach z Apple Silicon wyłącza także możliwość instalowania i uruchamiania aplikacji iOS na Macu**.

Traktuj to jako świadomą decyzję operacyjną, a nie ustawienie domyślne. Jeśli Twój model zagrożeń nie toleruje wyłączonego SIP, dołączone iMessage jest ograniczone do trybu podstawowego — tylko wysyłanie/odbieranie tekstu i multimediów, bez reakcji / edycji / cofnięcia wysłania / efektów / operacji grupowych.
</Warning>

### Konfiguracja

1. **Zainstaluj (lub zaktualizuj) `imsg`** na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Dane wyjściowe `imsg status --json` raportują `bridge_version`, `rpc_methods` i `selectors` dla poszczególnych metod, aby można było zobaczyć, co obsługuje aktualna kompilacja przed rozpoczęciem.

2. **Wyłącz System Integrity Protection oraz (w nowoczesnym macOS) Library Validation.** Wstrzyknięcie nieapple’owej pomocniczej biblioteki dylib do podpisanej przez Apple aplikacji `Messages.app` wymaga wyłączonego SIP **oraz** poluzowanej walidacji bibliotek. Krok SIP w trybie odzyskiwania zależy od wersji macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** wyłącz Library Validation przez Terminal, uruchom ponownie w trybie odzyskiwania, uruchom `csrutil disable`, zrestartuj.
   - **macOS 11+ (Big Sur i nowsze), Intel:** tryb odzyskiwania (albo Internet Recovery), `csrutil disable`, zrestartuj.
   - **macOS 11+, Apple Silicon:** sekwencja uruchamiania przyciskiem zasilania, aby wejść do Recovery; w najnowszych wersjach macOS przytrzymaj klawisz **Left Shift**, gdy klikniesz Continue, następnie `csrutil disable`. Konfiguracje maszyn wirtualnych mają osobny przebieg, więc najpierw wykonaj migawkę VM.

   **W macOS 11 i nowszych samo `csrutil disable` zwykle nie wystarcza.** Apple nadal egzekwuje walidację bibliotek wobec `Messages.app` jako binarium platformowego, więc pomocnik podpisany adhoc jest odrzucany (`Library Validation failed: ... platform binary, but mapped file is not`) nawet przy wyłączonym SIP. Po wyłączeniu SIP wyłącz także walidację bibliotek i uruchom ponownie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), zweryfikowane na 26.5.1:** wyłączony SIP **plus** powyższe polecenie `DisableLibraryValidation` wystarcza do wstrzyknięcia pomocnika w wersjach od 26.0 do 26.5.x. **Nie są wymagane żadne boot-args.** Plist jest decydującym czynnikiem i najczęstszym brakującym krokiem, gdy wstrzyknięcie nie działa na Tahoe:
   - **Z plist:** `imsg launch` wstrzykuje, a `imsg status` raportuje `advanced_features: true`.
   - **Bez plist (nawet przy wyłączonym SIP):** `imsg launch` kończy się błędem `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI odrzuca pomocnika adhoc podczas ładowania, więc mostek nigdy nie staje się gotowy, a uruchomienie przekracza limit czasu. Ten limit czasu jest objawem, na który trafia większość osób na Tahoe, a poprawką jest powyższy plist, nie nic bardziej radykalnego.

   Potwierdzono to kontrolowanym testem przed/po na macOS 26.5.1 (Apple Silicon): z plist biblioteka dylib mapuje się do `Messages.app`, a mostek się uruchamia; usuń plist i uruchom ponownie, a `imsg launch` powoduje powyższy błąd limitu czasu bez zmapowanej biblioteki dylib.

   Jeśli wstrzykiwanie `imsg launch` albo konkretne `selectors` zaczną zwracać false po aktualizacji macOS, zwykle przyczyną jest ta bramka. Sprawdź stan SIP i walidacji bibliotek, zanim założysz, że sam krok SIP się nie powiódł. Jeśli te ustawienia są poprawne, a mostek nadal nie może wykonać wstrzyknięcia, zbierz `imsg status --json` oraz wynik `imsg launch` i zgłoś to do projektu `imsg` zamiast osłabiać dodatkowe, ogólnosystemowe mechanizmy bezpieczeństwa.

   Postępuj zgodnie z procedurą Apple w trybie odzyskiwania dla swojego Maca, aby wyłączyć SIP przed uruchomieniem `imsg launch`.

3. **Wstrzyknij helper.** Przy wyłączonym SIP i zalogowanej aplikacji Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` odmawia wstrzyknięcia, gdy SIP jest nadal włączony, więc działa to również jako potwierdzenie, że krok 2 się powiódł.

4. **Zweryfikuj mostek z OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Wpis iMessage powinien zgłaszać `works`, a `imsg status --json | jq '.selectors'` powinno pokazać `retractMessagePart: true` oraz te selektory edycji / pisania / odczytu, które udostępnia Twoja kompilacja macOS. Bramkowanie per metoda w Plugin OpenClaw w `actions.ts` reklamuje tylko akcje, których bazowy selektor ma wartość `true`, więc powierzchnia akcji widoczna na liście narzędzi agenta odzwierciedla to, co mostek faktycznie może zrobić na tym hoście.

Jeśli `openclaw channels status --probe` zgłasza kanał jako `works`, ale konkretne akcje zgłaszają błąd „iMessage `<action>` wymaga prywatnego mostka API imsg” podczas wysyłania, uruchom ponownie `imsg launch` — helper może wypaść (restart Messages.app, aktualizacja systemu itd.), a zapisany w pamięci podręcznej status `available: true` będzie nadal reklamował akcje do czasu odświeżenia przez następną sondę.

### Gdy nie możesz wyłączyć SIP

Jeśli wyłączenie SIP nie jest akceptowalne dla Twojego modelu zagrożeń:

- `imsg` przechodzi na tryb podstawowy — tylko tekst + multimedia + odbiór.
- Plugin OpenClaw nadal reklamuje wysyłanie tekstu/multimediów i monitorowanie przychodzących wiadomości; po prostu ukrywa `react`, `edit`, `unsend`, `reply`, `sendWithEffect` oraz operacje grupowe z powierzchni akcji (zgodnie z bramką możliwości per metoda).
- Możesz uruchomić osobny Mac bez Apple Silicon (albo dedykowany Mac bota) z wyłączonym SIP dla obciążenia iMessage, utrzymując SIP włączony na podstawowych urządzeniach. Zobacz [Dedykowany użytkownik bota macOS (osobna tożsamość iMessage)](#deployment-patterns) poniżej.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` kontroluje wiadomości bezpośrednie:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisy listy dozwolonych muszą identyfikować nadawców: uchwyty albo statyczne grupy dostępu nadawców (`accessGroup:<name>`). Użyj `channels.imessage.groupAllowFrom` dla celów czatu, takich jak `chat_id:*`, `chat_guid:*` albo `chat_identifier:*`; użyj `channels.imessage.groups` dla numerycznych kluczy rejestru `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślnie po skonfigurowaniu)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Wpisy `groupAllowFrom` mogą również odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`).

    Awaryjne zachowanie runtime: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage używa `allowFrom`; ustaw `groupAllowFrom`, gdy dopuszczanie DM i grup ma się różnić.
    Uwaga dotycząca runtime: jeśli `channels.imessage` całkowicie brakuje, runtime wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli `channels.defaults.groupPolicy` jest ustawione).

    <Warning>
    Routing grup ma **dwie** bramki listy dozwolonych uruchamiane jedna po drugiej i obie muszą przejść:

    1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — uchwyt, `chat_guid`, `chat_identifier` albo `chat_id`.
    2. **Rejestr grup** (`channels.imessage.groups`) — przy `groupPolicy: "allowlist"` ta bramka wymaga albo wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo jawnego wpisu per `chat_id` w `groups`.

    Jeśli bramka 2 nie ma żadnej zawartości, każda wiadomość grupowa jest odrzucana. Plugin emituje dwa sygnały poziomu `warn` przy domyślnym poziomie logowania:

    - jednorazowo per konto przy starcie: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - jednorazowo per `chat_id` w runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM nadal działają, ponieważ używają innej ścieżki kodu.

    Minimalna konfiguracja, aby grupy nadal działały przy `groupPolicy: "allowlist"`:

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

    Jeśli te wiersze `warn` pojawiają się w logu gateway, odrzuca bramka 2 — dodaj blok `groups`.
    </Warning>

    Bramkowanie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców nie da się egzekwować bramkowania wzmianek

    Polecenia sterujące od autoryzowanych nadawców mogą omijać bramkowanie wzmianek w grupach.

    `systemPrompt` per grupa:

    Każdy wpis w `channels.imessage.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do promptu systemowego agenta przy każdej turze obsługującej wiadomość w tej grupie. Rozstrzyganie odzwierciedla rozstrzyganie promptu per grupa używane przez `channels.whatsapp.groups`:

    1. **Prompt systemowy konkretnej grupy** (`groups["<chat_id>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wpis wieloznaczny jest tłumiony i do tej grupy nie jest stosowany żaden prompt systemowy.
    2. **Prompt systemowy grupy wieloznacznej** (`groups["*"].systemPrompt`): używany, gdy konkretnego wpisu grupy całkowicie brakuje w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

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

    Prompty per grupa mają zastosowanie tylko do wiadomości grupowych — wiadomości bezpośrednie w tym kanale pozostają bez zmian.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` DM iMessage są zwijane do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału/celu pochodzenia.

    Zachowanie wątków podobnych do grup:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grup + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage można również powiązać z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM albo dozwolonego czatu grupowego.
- Przyszłe wiadomości w tej samej konwersacji iMessage są kierowane do utworzonej sesji ACP.
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz/zaloguj dedykowanego użytkownika macOS.
    2. Zaloguj się do Messages przy użyciu Apple ID bota w tym użytkowniku.
    3. Zainstaluj `imsg` w tym użytkowniku.
    4. Utwórz wrapper SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` do profilu tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń GUI (Automatyzacja + Pełny dostęp do dysku) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Typowa topologia:

    - gateway działa na Linux/VM
    - iMessage + `imsg` działa na Macu w Twojej sieci tailnet
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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP były nieinteraktywne.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` zostało uzupełnione.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage obsługuje konfigurację per konto w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii oraz listy dozwolonych katalogów głównych załączników.

  </Accordion>

  <Accordion title="Direct-message history">
    Ustaw `channels.imessage.dmHistoryLimit`, aby zasilić nowe sesje wiadomości bezpośrednich ostatnią zdekodowaną historią `imsg` dla tej konwersacji. Użyj `channels.imessage.dms["<sender>"].historyLimit` dla nadpisań per nadawca, w tym `0`, aby wyłączyć historię dla nadawcy.

    Historia DM iMessage jest pobierana na żądanie z `imsg`. Pozostawienie `dmHistoryLimit` bez ustawienia wyłącza globalne zasilanie historii DM, ale dodatnia wartość per nadawca `channels.imessage.dms["<sender>"].historyLimit` nadal włącza zasilanie dla tego nadawcy.

  </Accordion>
</AccordionGroup>

## Multimedia, dzielenie na części i cele dostarczania

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
      - `newline` (dzielenie najpierw według akapitów)

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

## Akcje Prywatnego API

Gdy działa `imsg launch`, a `openclaw channels status --probe` zgłasza `privateApi.available: true`, narzędzie wiadomości może używać natywnych akcji iMessage oprócz zwykłego wysyłania tekstu.

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
    - **react**: Dodaj/usuń reakcje Tapback iMessage (`messageId`, `emoji`, `remove`). Obsługiwane reakcje Tapback mapują się na miłość, polubienie, niechęć, śmiech, podkreślenie i pytanie.
    - **reply**: Wyślij odpowiedź w wątku do istniejącej wiadomości (`messageId`, `text` lub `message`, plus `chatGuid`, `chatId`, `chatIdentifier` albo `to`).
    - **sendWithEffect**: Wyślij tekst z efektem iMessage (`text` lub `message`, `effect` lub `effectId`).
    - **edit**: Edytuj wysłaną wiadomość w obsługiwanych wersjach macOS/Prywatnego API (`messageId`, `text` lub `newText`).
    - **unsend**: Wycofaj wysłaną wiadomość w obsługiwanych wersjach macOS/Prywatnego API (`messageId`).
    - **upload-file**: Wyślij multimedia/pliki (`buffer` jako base64 albo uwodnione `media`/`path`/`filePath`, `filename`, opcjonalne `asVoice`). Starszy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Zarządzaj czatami grupowymi, gdy bieżący cel jest rozmową grupową.

  </Accordion>

  <Accordion title="Identyfikatory wiadomości">
    Kontekst przychodzący iMessage zawiera zarówno krótkie wartości `MessageSid`, jak i pełne identyfikatory GUID wiadomości, gdy są dostępne. Krótkie identyfikatory są ograniczone do najnowszej pamięci podręcznej odpowiedzi opartej na SQLite i przed użyciem są sprawdzane względem bieżącego czatu. Jeśli krótki identyfikator wygasł albo należy do innego czatu, spróbuj ponownie z pełnym `MessageSidFull`.

  </Accordion>

  <Accordion title="Wykrywanie możliwości">
    OpenClaw ukrywa akcje Prywatnego API tylko wtedy, gdy status z pamięci podręcznej mówi, że most jest niedostępny. Jeśli status jest nieznany, akcje pozostają widoczne, a wysłanie uruchamia sondowanie leniwie, aby pierwsza akcja mogła się powieść po `imsg launch` bez osobnego ręcznego odświeżania statusu.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu i pisanie">
    Gdy most Prywatnego API działa, zaakceptowane czaty przychodzące są oznaczane jako przeczytane, a czaty bezpośrednie pokazują dymek pisania, gdy tylko tura zostanie zaakceptowana, podczas gdy agent przygotowuje kontekst i generuje odpowiedź. Wyłącz oznaczanie jako przeczytane za pomocą:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Starsze kompilacje `imsg`, które poprzedzają listę możliwości dla poszczególnych metod, po cichu wyłączą pisanie/odczyt; OpenClaw zapisuje jednorazowe ostrzeżenie przy każdym restarcie, aby brak potwierdzenia można było przypisać właściwej przyczynie.

  </Accordion>

  <Accordion title="Przychodzące reakcje Tapback">
    OpenClaw subskrybuje reakcje Tapback iMessage i kieruje zaakceptowane reakcje jako zdarzenia systemowe zamiast zwykłego tekstu wiadomości, więc reakcja Tapback użytkownika nie uruchamia zwykłej pętli odpowiedzi.

    Tryb powiadomień jest kontrolowany przez `channels.imessage.reactionNotifications`:

    - `"own"` (domyślnie): powiadamiaj tylko wtedy, gdy użytkownicy reagują na wiadomości napisane przez bota.
    - `"all"`: powiadamiaj o wszystkich przychodzących reakcjach Tapback od autoryzowanych nadawców.
    - `"off"`: ignoruj przychodzące reakcje Tapback.

    Nadpisania dla poszczególnych kont używają `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reakcje zatwierdzania (👍 / 👎)">
    Gdy `approvals.exec.enabled` lub `approvals.plugin.enabled` ma wartość true, a żądanie jest kierowane do iMessage, Gateway dostarcza natywnie monit zatwierdzenia i akceptuje reakcję Tapback, aby go rozstrzygnąć:

    - `👍` (reakcja Tapback Like) → `allow-once`
    - `👎` (reakcja Tapback Dislike) → `deny`
    - `allow-always` pozostaje ręcznym mechanizmem awaryjnym: wyślij `/approve <id> allow-always` jako zwykłą odpowiedź.

    Obsługa reakcji wymaga, aby uchwyt reagującego użytkownika był jawnym zatwierdzającym. Lista zatwierdzających jest odczytywana z `channels.imessage.allowFrom` (lub `channels.imessage.accounts.<id>.allowFrom`); dodaj numer telefonu użytkownika w formacie E.164 albo jego adres e-mail Apple ID. Wpis wieloznaczny `"*"` jest respektowany, ale pozwala zatwierdzać dowolnemu nadawcy. Skrót reakcji celowo pomija `reactionNotifications`, `dmPolicy` i `groupAllowFrom`, ponieważ jawna lista dozwolonych zatwierdzających jest jedyną bramką istotną dla rozstrzygnięcia zatwierdzenia.

    **Zmiana zachowania w tym wydaniu:** Gdy `channels.imessage.allowFrom` nie jest puste, polecenie tekstowe `/approve <id> <decision>` jest teraz autoryzowane względem tej listy zatwierdzających (a nie szerszej listy dozwolonej dla DM). Nadawcy dozwoleni na liście DM, ale nieobecni w `allowFrom`, otrzymają jawne odrzucenie. Dodaj do `allowFrom` każdego operatora, który powinien móc zatwierdzać przez `/approve` (i przez reakcje), aby zachować poprzednie zachowanie. Gdy `allowFrom` jest puste, starszy „mechanizm awaryjny tego samego czatu” pozostaje aktywny, a `/approve` nadal autoryzuje każdą osobę dopuszczoną przez listę DM.

    Uwagi dla operatorów:
    - Powiązanie reakcji jest przechowywane zarówno w pamięci (z TTL dopasowanym do wygaśnięcia zatwierdzenia), jak i w trwałym magazynie kluczowanym Gateway, więc reakcja Tapback, która dotrze krótko po restarcie Gateway, nadal rozstrzygnie zatwierdzenie.
    - Reakcje Tapback między urządzeniami z `is_from_me=true` (własna reakcja operatora na sparowanym urządzeniu Apple) są celowo ignorowane, aby bot nie mógł zatwierdzić sam siebie.
    - Starsze tekstowe reakcje Tapback (`Liked "…"` jako zwykły tekst od bardzo starych klientów Apple) nie mogą rozstrzygać zatwierdzeń, ponieważ nie niosą identyfikatora GUID wiadomości; rozstrzyganie reakcji wymaga strukturalnych metadanych Tapback emitowanych przez aktualne klienty macOS / iOS.

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie pozwala na zapisy konfiguracji inicjowane przez kanał (dla `/config set|unset`, gdy `commands.config: true`).

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

## Scalanie DM z dzielonym wysyłaniem (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisuje razem polecenie i URL — np. `Dump https://example.com/article` — aplikacja Apple Messages dzieli wysyłkę na **dwa osobne wiersze `chat.db`**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Te dwa wiersze docierają do OpenClaw w odstępie około 0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 — wtedy kontekst polecenia jest już utracony. To jest potok wysyłania Apple, a nie coś wprowadzonego przez OpenClaw lub `imsg`.

`channels.imessage.coalesceSameSenderDms` włącza buforowanie kolejnych wierszy DM od tego samego nadawcy. Gdy `imsg` ujawnia strukturalny znacznik podglądu URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` w jednym z wierszy źródłowych, OpenClaw scala tylko tę rzeczywistą wysyłkę dzieloną i zachowuje wszystkie inne zbuforowane wiersze jako osobne tury. W starszych kompilacjach `imsg`, które w ogóle nie emitują metadanych dymka, OpenClaw nie potrafi odróżnić wysyłki dzielonej od osobnych wysyłek, więc awaryjnie scala kubełek. Zachowuje to zachowanie sprzed metadanych zamiast regresji dzielonych wysyłek `Dump <url>` do dwóch tur. Czaty grupowe nadal są wysyłane pojedynczo dla każdej wiadomości, aby zachować strukturę tur wielu użytkowników.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Dostarczasz skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Twoi użytkownicy wklejają URL-e obok poleceń.
    - Możesz zaakceptować dodatkowe opóźnienie tury DM (patrz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez dalszych ładunków.

  </Tab>
  <Tab title="Włączanie">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // włącz opcjonalnie (domyślnie: false)
        },
      },
    }
    ```

    Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.imessage` ani globalnego `messages.inbound.debounceMs` okno debounce rozszerza się do **7000 ms** (starsza wartość domyślna to 0 ms — bez debounce). Szersze okno jest wymagane, ponieważ rytm dzielonej wysyłki podglądu URL Apple może rozciągać się do kilku sekund, gdy Messages.app emituje wiersz podglądu.

    Aby samodzielnie dostroić okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms obejmuje zaobserwowane opóźnienia podglądu URL w Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisy">
    - **Precyzyjne scalanie wymaga aktualnych metadanych ładunku `imsg`.** Gdy wiersz URL zawiera `balloon_bundle_id`, scala się tylko ta rzeczywista wysyłka dzielona, a inne zbuforowane wiersze pozostają osobne. W starszych kompilacjach `imsg`, które nie ujawniają metadanych dymka, OpenClaw awaryjnie scala zbuforowany kubełek, aby dzielone wysyłki `Dump <url>` nie regresowały do dwóch tur (tymczasowa zgodność wsteczna, usunięta, gdy `imsg` zacznie scalać dzielone wysyłki upstream).
    - **Dodatkowe opóźnienie dla wiadomości DM.** Przy włączonej fladze każda wiadomość DM (w tym samodzielne polecenia kontrolne i jednotekstowe kontynuacje) czeka przed wysłaniem do końca okna debounce, na wypadek gdyby nadchodził wiersz podglądu URL. Wiadomości czatu grupowego zachowują natychmiastowe wysyłanie.
    - **Scalony wynik jest ograniczony.** Scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (powyżej tego zachowywany jest pierwszy oraz najnowsze). Każdy źródłowy GUID jest śledzony w `coalescedMessageGuids` na potrzeby dalszej telemetrii.
    - **Tylko DM.** Czaty grupowe przechodzą do wysyłania pojedynczo dla każdej wiadomości, więc bot pozostaje responsywny, gdy pisze wiele osób.
    - **Opcjonalne, dla kanału.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian. Starsze konfiguracje BlueBubbles ustawiające `channels.bluebubbles.coalesceSameSenderDms` powinny przenieść tę wartość do `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

Kolumna „Flaga włączona” pokazuje zachowanie w kompilacji `imsg`, która emituje `balloon_bundle_id`. W starszych kompilacjach `imsg`, które w ogóle nie emitują metadanych dymka, wiersze oznaczone poniżej jako „Dwie tury” / „N tur” zamiast tego wracają do starszego scalania (jedna tura): OpenClaw nie może strukturalnie odróżnić podzielonej wysyłki od osobnych wysyłek, więc zachowuje scalanie sprzed metadanych. Precyzyjne rozdzielanie aktywuje się, gdy kompilacja zaczyna emitować metadane dymka.

| Użytkownik tworzy wiadomość                                        | `chat.db` produkuje                 | Flaga wyłączona (domyślnie)             | Flaga włączona + okno (imsg emituje metadane dymka)                                                  |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                         | 2 wiersze w odstępie ~1 s           | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                                                |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 wiersze bez metadanych dymka URL  | Dwie tury                               | Dwie tury po zaobserwowaniu metadanych; jedna scalona tura w starych sesjach bez metadanych / sprzed aktywacji |
| `/status` (samodzielne polecenie)                                  | 1 wiersz                            | Natychmiastowe przekazanie              | **Czekaj do końca okna, potem przekaż**                                                             |
| URL wklejony samodzielnie                                          | 1 wiersz                            | Natychmiastowe przekazanie              | Czekaj do końca okna, potem przekaż                                                                 |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, w odstępie minut | 2 wiersze poza oknem                | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                                                 |
| Szybki zalew (>10 małych DM w oknie)                               | N wierszy bez metadanych dymka URL  | N tur                                   | N tur po zaobserwowaniu metadanych; jedna ograniczona scalona tura w starych sesjach bez metadanych / sprzed aktywacji |
| Dwie osoby piszące na czacie grupowym                              | N wierszy od M nadawców             | M+ tur (po jednej na koszyk nadawcy)    | M+ tur — czaty grupowe nie są scalane                                                               |

## Odzyskiwanie przychodzących wiadomości po restarcie mostka lub Gateway

iMessage odzyskuje wiadomości pominięte, gdy Gateway był wyłączony, a jednocześnie tłumi przestarzałą „bombę zaległości”, którą Apple może wypchnąć po odzyskiwaniu Push. Domyślne zachowanie jest zawsze włączone i opiera się na deduplikacji przychodzących wiadomości.

- **Deduplikacja odtworzeń.** Każda przekazana przychodząca wiadomość jest zapisywana według jej Apple GUID w trwałym stanie wtyczki (`imessage.inbound-dedupe`), zajmowana przy pobieraniu i zatwierdzana po obsłudze (zwalniana przy przejściowej awarii, aby można było ponowić próbę). Wszystko, co już obsłużono, jest porzucane zamiast przekazywania po raz drugi. To pozwala odtwarzać odzyskiwanie agresywnie, bez księgowania każdej wiadomości osobno.
- **Odzyskiwanie po przestoju.** Przy uruchomieniu monitor zapamiętuje ostatni przekazany `chat.db` rowid (utrwalony kursor per konto) i przekazuje go do `imsg watch.subscribe` jako `since_rowid`, dzięki czemu imsg odtwarza wiersze, które trafiły podczas wyłączenia Gateway, a potem śledzi zdarzenia na żywo. Odtwarzanie jest ograniczone do najnowszych wierszy i wiadomości mających do ~2 godzin, a deduplikacja odrzuca wszystko, co już obsłużono.
- **Bariera wieku przestarzałych zaległości.** Wiersze powyżej granicy startowej są rzeczywiście bieżące; taki, którego data wysłania jest starsza od czasu przybycia o więcej niż ~15 minut, jest zaległością wypchniętą przez Push i zostaje stłumiony. Odtwarzane wiersze (na granicy lub poniżej niej) używają zamiast tego szerszego okna odzyskiwania, więc niedawno pominięta wiadomość zostaje dostarczona, a bardzo stara historia nie.

Odzyskiwanie działa zarówno w lokalnych, jak i zdalnych konfiguracjach `cliPath`, ponieważ odtwarzanie `since_rowid` działa przez to samo połączenie RPC `imsg`. Różnica polega na oknie: gdy Gateway może czytać `chat.db` (lokalnie), zakotwicza granicę rowid przy uruchomieniu, ogranicza zakres odtwarzania i dostarcza pominięte wiadomości do kilku godzin wstecz. Przez zdalne SSH `cliPath` nie może czytać bazy danych, więc odtwarzanie nie ma limitu, a każdy wiersz używa bariery wieku na żywo — nadal odzyskuje niedawno pominięte wiadomości i nadal tłumi stare zaległości, tylko z węższym oknem na żywo. Uruchom Gateway na Macu z Messages, aby uzyskać szersze okno odzyskiwania.

### Sygnał widoczny dla operatora

Stłumione zaległości są logowane na domyślnym poziomie, nigdy nie są po cichu porzucane (flaga `recovery` pokazuje, które okno zastosowano):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migracja

`channels.imessage.catchup.*` jest przestarzałe — odzyskiwanie po przestoju jest teraz automatyczne i nie wymaga konfiguracji w nowych instalacjach. Istniejące konfiguracje z `catchup.enabled: true` pozostają respektowane jako profil zgodności dla okna odtwarzania odzyskiwania. Wyłączone bloki catchup (`enabled: false` lub bez `enabled: true`) są wycofane; `openclaw doctor --fix` je usuwa.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie znaleziono imsg albo RPC nie jest obsługiwane">
    Sprawdź binarium i obsługę RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jeśli sonda zgłasza brak obsługi RPC, zaktualizuj `imsg`. Jeśli działania prywatnego API są niedostępne, uruchom `imsg launch` w zalogowanej sesji użytkownika macOS i ponownie uruchom sondę. Jeśli Gateway nie działa na macOS, użyj powyższej konfiguracji zdalnego Maca przez SSH zamiast domyślnej lokalnej ścieżki `imsg`.

  </Accordion>

  <Accordion title="Wiadomości są wysyłane, ale przychodzące iMessages nie docierają">
    Najpierw udowodnij, czy wiadomość dotarła do lokalnego Maca. Jeśli `chat.db` się nie zmienia, OpenClaw nie może odebrać wiadomości nawet wtedy, gdy `imsg status --json` zgłasza zdrowy mostek.

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

    Wyślij świeżą iMessage z telefonu i potwierdź nowy wiersz `chat.db` albo zdarzenie `imsg watch`, zanim zaczniesz debugować sesje OpenClaw. Nie uruchamiaj tego jako okresowej pętli ponownego uruchamiania mostka; powtarzane `imsg launch` wraz z restartami Gateway podczas aktywnej pracy może przerwać dostarczanie i pozostawić uruchomione przebiegi kanału w zawieszeniu.

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
    - klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - czytelność zdalnej ścieżki na Macu z uruchomionym Messages

  </Accordion>

  <Accordion title="Pominięto monity uprawnień macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Potwierdź, że Full Disk Access + Automation są przyznane dla kontekstu procesu, który uruchamia OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Wskaźniki dokumentacji konfiguracji

- [Dokumentacja konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) — ogłoszenie i podsumowanie migracji
- [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) — tabela tłumaczenia konfiguracji i migracja krok po kroku
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
