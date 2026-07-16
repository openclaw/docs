---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania i odbierania wiadomości w iMessage
summary: Natywna obsługa iMessage za pośrednictwem imsg (JSON-RPC przez stdio), z akcjami prywatnego API do odpowiedzi, reakcji Tapback, efektów, ankiet, załączników i zarządzania grupami. Preferowana w nowych konfiguracjach iMessage w OpenClaw, gdy wymagania dotyczące hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T17:58:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W typowym wdrożeniu OpenClaw z iMessage uruchom Gateway i `imsg` na tym samym hoście macOS zalogowanym do Wiadomości. Jeśli Gateway działa gdzie indziej, ustaw `channels.imessage.cliPath` tak, aby wskazywał przezroczysty wrapper SSH uruchamiający `imsg` na Macu.

**Odzyskiwanie wiadomości przychodzących jest automatyczne.** Po ponownym uruchomieniu mostu lub Gateway iMessage odtwarza wiadomości pominięte podczas przerwy w działaniu i pomija nieaktualną „bombę zaległości”, którą Apple może wysłać po odzyskaniu połączenia Push, usuwając duplikaty, aby żadna wiadomość nie została przekazana dwukrotnie. Nie ma konfiguracji, która to włącza — zobacz [Odzyskiwanie wiadomości przychodzących po ponownym uruchomieniu mostu lub Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Obsługa BlueBubbles została usunięta. Przenieś konfiguracje `channels.bluebubbles` do `channels.imessage`; OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Zacznij od [Usunięcie BlueBubbles i ścieżka iMessage przez imsg](/pl/announcements/bluebubbles-imessage), aby przeczytać krótkie ogłoszenie, lub od [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles), aby uzyskać pełną tabelę migracji.
</Warning>

Stan: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC za pośrednictwem standardowego wejścia i wyjścia — bez osobnego demona ani portu. Tryb prywatnego API jest zdecydowanie zalecany do uzyskania pełnej funkcjonalności kanału iMessage; odpowiedzi, reakcje Tapback, efekty, ankiety, odpowiedzi na załączniki i działania grupowe wymagają `imsg launch` oraz pomyślnego sprawdzenia prywatnego API.

W typowej konfiguracji lokalnej instalator OpenClaw może zaproponować potwierdzoną przez użytkownika instalację lub aktualizację `imsg` przez Homebrew na Macu zalogowanym do Wiadomości. Konfiguracja ręczna i topologie z wrapperem SSH pozostają zarządzane przez operatora: zainstaluj lub zaktualizuj `imsg` w tym samym kontekście użytkownika, w którym będzie działać Gateway lub wrapper.

<CardGroup cols={3}>
  <Card title="Działania prywatnego API" icon="wand-sparkles" href="#private-api-actions">
    Odpowiedzi, reakcje Tapback, efekty, ankiety, załączniki i zarządzanie grupami.
  </Card>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne iMessage domyślnie działają w trybie parowania.
  </Card>
  <Card title="Zdalny Mac" icon="terminal" href="#remote-mac-over-ssh">
    Użyj wrappera SSH, gdy Gateway nie działa na Macu obsługującym Wiadomości.
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
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Gdy lokalny kreator konfiguracji wykryje brak domyślnego polecenia `imsg`, może zaproponować instalację `steipete/tap/imsg` przez Homebrew. Jeśli wykryje `imsg` zarządzany przez Homebrew, może zaproponować jego ponowną instalację lub aktualizację. Niestandardowe wrappery `cliPath` nie są modyfikowane.

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

      <Step title="Zatwierdź pierwsze parowanie wiadomości prywatnej (domyślna zasada dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    Większość konfiguracji nie wymaga SSH. Używaj tej topologii tylko wtedy, gdy Gateway nie może działać na Macu zalogowanym do Wiadomości. OpenClaw wymaga jedynie `cliPath` zgodnego ze standardowym wejściem i wyjściem, dlatego `cliPath` może wskazywać skrypt wrappera, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.
    Zainstaluj i aktualizuj `imsg` na tym zdalnym Macu, a nie na hoście Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Zalecana konfiguracja przy włączonych załącznikach:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // używane do pobierania załączników przez SCP
      includeAttachments: true,
      // Opcjonalnie: dodatkowe dozwolone katalogi główne załączników (łączone z domyślnym
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie, analizując skrypt wrappera SSH.
    `remoteHost` musi mieć postać `host` lub `user@host` (bez spacji i opcji SSH); niebezpieczne wartości są ignorowane.
    OpenClaw używa ścisłej weryfikacji klucza hosta dla SCP, dlatego klucz hosta przekaźnikowego musi już znajdować się w `~/.ssh/known_hosts`.
    Ścieżki załączników są weryfikowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Każdy wrapper `cliPath` lub serwer proxy SSH umieszczony przed `imsg` MUSI działać jak przezroczysty potok standardowego wejścia i wyjścia dla długotrwałego połączenia JSON-RPC. Przez cały okres działania kanału OpenClaw wymienia niewielkie komunikaty JSON-RPC rozdzielane znakami nowego wiersza za pośrednictwem standardowego wejścia i wyjścia wrappera:

- Przekazuj każdy fragment lub wiersz standardowego wejścia **natychmiast po udostępnieniu bajtów** — nie czekaj na EOF.
- Niezwłocznie przekazuj każdy fragment lub wiersz standardowego wyjścia w przeciwnym kierunku.
- Zachowuj znaki nowego wiersza.
- Unikaj blokujących odczytów o stałym rozmiarze (`read(4096)`, `cat | buffer`, domyślne `read` powłoki), które mogą blokować małe ramki.
- Oddzielaj standardowy strumień błędów od strumienia standardowego wyjścia JSON-RPC.

Wrapper, który buforuje standardowe wejście do momentu zapełnienia dużego bloku, spowoduje objawy przypominające awarię iMessage — `imsg rpc timeout (chats.list)` lub wielokrotne ponowne uruchamianie kanału — mimo że sam `imsg rpc` działa prawidłowo. `ssh -T host imsg "$@"` (powyżej) jest bezpieczny, ponieważ przekazuje argumenty `cliPath` OpenClaw, takie jak `rpc` i `--db`. Potoki takie jak `ssh host imsg | grep -v '^DEBUG'` NIE są bezpieczne — narzędzia buforujące wiersze nadal mogą zatrzymywać ramki; jeśli filtrowanie jest konieczne, użyj `stdbuf -oL -eL` na każdym etapie.
</Warning>

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Na Macu, na którym działa `imsg`, użytkownik musi być zalogowany do Wiadomości.
- Kontekst procesu uruchamiającego OpenClaw/`imsg` wymaga pełnego dostępu do dysku (dostęp do bazy danych Wiadomości).
- Wysyłanie wiadomości przez Messages.app wymaga uprawnienia do automatyzacji.
- W przypadku zaawansowanych działań (reakcja / edycja / cofnięcie wysłania / odpowiedź w wątku / efekty / ankiety / operacje grupowe) ochrona integralności systemu musi być wyłączona — zobacz [Włączanie prywatnego API imsg](#enabling-the-imsg-private-api). Podstawowe wysyłanie i odbieranie tekstu oraz multimediów działa bez jej wyłączania.

<Tip>
Uprawnienia są przyznawane dla konkretnego kontekstu procesu. Jeśli Gateway działa bez interfejsu użytkownika (LaunchAgent/SSH), uruchom jednorazowe polecenie interaktywne w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# lub
imsg send <handle> "test"
```

</Tip>

<Accordion title="Wysyłanie przez wrapper SSH kończy się błędem AppleEvents -1743">
  Konfiguracja ze zdalnym dostępem przez SSH może odczytywać czaty, przechodzić `channels status --probe` i przetwarzać wiadomości przychodzące, podczas gdy wysyłanie wiadomości nadal kończy się błędem autoryzacji AppleEvents:

```text
Brak uprawnień do wysyłania zdarzeń Apple do Wiadomości. (-1743)
```

Sprawdź bazę danych TCC zalogowanego użytkownika Maca lub System Settings > Privacy & Security > Automation. Jeśli wpis automatyzacji jest zarejestrowany dla `/usr/libexec/sshd-keygen-wrapper`, a nie dla procesu `imsg` lub lokalnej powłoki, macOS może nie udostępnić użytecznego przełącznika Wiadomości dla tego klienta po stronie serwera SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

W tym stanie powtarzanie `tccutil reset AppleEvents` lub ponowne uruchamianie `imsg send` przez ten sam wrapper SSH może nadal kończyć się niepowodzeniem, ponieważ kontekstem procesu wymagającym automatyzacji Wiadomości jest wrapper SSH, a nie aplikacja, której interfejs może przyznać uprawnienie.

Zamiast tego użyj jednego z obsługiwanych kontekstów procesu `imsg`:

- Uruchom Gateway lub przynajmniej most `imsg` w lokalnej sesji użytkownika zalogowanego do Wiadomości.
- Uruchom Gateway za pomocą LaunchAgent dla tego użytkownika po przyznaniu pełnego dostępu do dysku i automatyzacji w tej samej sesji.
- Jeśli zachowujesz topologię SSH z dwoma użytkownikami, przed włączeniem kanału sprawdź, czy rzeczywiste wychodzące polecenie `imsg send` działa przez dokładnie ten wrapper. Jeśli nie można przyznać mu automatyzacji, zamiast polegać na wrapperze SSH do wysyłania, zmień konfigurację na `imsg` z jednym użytkownikiem.

</Accordion>

## Włączanie prywatnego API imsg

`imsg` jest dostępny w dwóch trybach działania. W przypadku OpenClaw zalecaną konfiguracją jest tryb prywatnego API, ponieważ udostępnia on kanałowi natywne działania iMessage oczekiwane przez użytkowników. Tryb podstawowy pozostaje przydatny w instalacjach o niskim poziomie ryzyka, do wstępnej weryfikacji lub na hostach, na których nie można wyłączyć SIP.

- **Tryb podstawowy** (domyślny, nie wymaga zmian SIP): wychodzący tekst i multimedia przez `send`, obserwowanie i historia wiadomości przychodzących oraz lista czatów. Te funkcje są dostępne od razu po świeżej instalacji `brew install steipete/tap/imsg` i przyznaniu opisanych powyżej standardowych uprawnień systemu macOS.
- **Tryb prywatnego API**: `imsg` wstrzykuje pomocniczą bibliotekę dylib do `Messages.app`, aby wywoływać wewnętrzne funkcje `IMCore`. Odblokowuje to `react`, `edit`, `unsend`, `reply` (w wątku), `sendWithEffect`, `poll` i `poll-vote` (natywne ankiety Wiadomości), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, a także wskaźniki pisania i potwierdzenia odczytu.

Zalecany na tej stronie zakres działań wymaga trybu prywatnego API. Plik README `imsg` jasno określa to wymaganie:

> Funkcje zaawansowane, takie jak `read`, `typing`, `launch`, rozbudowane wysyłanie obsługiwane przez most, modyfikowanie wiadomości i zarządzanie czatami, są opcjonalne. Wymagają wyłączenia SIP i wstrzyknięcia pomocniczej biblioteki dylib do `Messages.app`. `imsg launch` odmawia wstrzyknięcia, gdy SIP jest włączona.

Technika wstrzykiwania pomocnika wykorzystuje własną bibliotekę dylib `imsg` do uzyskania dostępu do prywatnych interfejsów API Wiadomości. Ścieżka iMessage w OpenClaw nie korzysta z serwera innej firmy ani środowiska wykonawczego BlueBubbles.

<Warning>
**Wyłączenie SIP stanowi rzeczywisty kompromis w zakresie bezpieczeństwa.** SIP jest jednym z podstawowych mechanizmów ochrony macOS przed uruchamianiem zmodyfikowanego kodu systemowego; wyłączenie jej w całym systemie zwiększa powierzchnię ataku i może powodować skutki uboczne. Co istotne, **wyłączenie SIP na Macach z układami Apple Silicon wyłącza również możliwość instalowania i uruchamiania aplikacji iOS na Macu**.

Traktuj to jako świadomą decyzję operacyjną, zwłaszcza na głównym prywatnym Macu. Aby uzyskać produkcyjną jakość iMessage w OpenClaw, najlepiej użyć dedykowanego Maca lub użytkownika-bota macOS, dla którego włączenie mostu jest akceptowalne. Jeśli model zagrożeń nie dopuszcza wyłączenia SIP w żadnym miejscu, dołączona obsługa iMessage jest ograniczona do trybu podstawowego — tylko wysyłanie i odbieranie tekstu oraz multimediów, bez reakcji / edycji / cofania wysłania / efektów / operacji grupowych.
</Warning>

### Konfiguracja

1. **Zainstaluj (lub uaktualnij) `imsg`** na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Dane wyjściowe `imsg status --json` zawierają `bridge_version`, `rpc_methods` oraz `selectors` dla poszczególnych metod, dzięki czemu przed rozpoczęciem można sprawdzić, co obsługuje bieżąca kompilacja.

2. **Wyłącz System Integrity Protection oraz (we współczesnych wersjach macOS) Library Validation.** Wstrzyknięcie pomocniczej biblioteki dylib firmy innej niż Apple do podpisanego przez Apple procesu `Messages.app` wymaga wyłączenia SIP **oraz** złagodzenia weryfikacji bibliotek. Krok dotyczący SIP w trybie odzyskiwania zależy od wersji macOS:
   - **macOS 10.13–10.15 (Sierra–Catalina):** wyłącz Library Validation za pomocą Terminala, uruchom ponownie komputer w trybie odzyskiwania, wykonaj `csrutil disable`, a następnie ponownie uruchom komputer.
   - **macOS 11+ (Big Sur i nowsze), Intel:** przejdź do trybu odzyskiwania (lub odzyskiwania przez Internet), wykonaj `csrutil disable`, a następnie ponownie uruchom komputer.
   - **macOS 11+, Apple Silicon:** użyj sekwencji uruchamiania przyciskiem zasilania, aby przejść do trybu odzyskiwania; w najnowszych wersjach macOS przytrzymaj klawisz **Left Shift** podczas klikania Continue, a następnie wykonaj `csrutil disable`. Konfiguracje maszyn wirtualnych wymagają osobnej procedury, dlatego najpierw utwórz migawkę maszyny wirtualnej.

   **W systemie macOS 11 i nowszych samo `csrutil disable` zwykle nie wystarcza.** Apple nadal wymusza weryfikację bibliotek dla `Messages.app` jako pliku binarnego platformy, dlatego pomocniczy komponent podpisany ad hoc zostaje odrzucony (`Library Validation failed: ... platform binary, but mapped file is not`) nawet przy wyłączonym SIP. Po wyłączeniu SIP wyłącz również weryfikację bibliotek i ponownie uruchom komputer:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), zweryfikowano w wersji 26.5.1:** wyłączony SIP **wraz z** powyższym poleceniem `DisableLibraryValidation` wystarcza do wstrzyknięcia komponentu pomocniczego we wszystkich wersjach od 26.0 do 26.5.x. **Żadne argumenty rozruchowe nie są wymagane.** Plik plist jest czynnikiem decydującym i najczęściej pomijanym krokiem, gdy wstrzykiwanie w Tahoe kończy się niepowodzeniem:
   - **Z plikiem plist:** `imsg launch` wykonuje wstrzyknięcie, a `imsg status` zgłasza `advanced_features: true`.
   - **Bez pliku plist (nawet przy wyłączonym SIP):** `imsg launch` kończy się niepowodzeniem z komunikatem `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI odrzuca podczas ładowania komponent pomocniczy podpisany ad hoc, przez co most nigdy nie osiąga gotowości, a uruchamianie przekracza limit czasu. To przekroczenie limitu czasu jest objawem, z którym większość osób spotyka się w Tahoe; rozwiązaniem jest powyższy plik plist, a nie bardziej drastyczne działania.

   Jeśli po uaktualnieniu macOS wstrzykiwanie `imsg launch` lub określone `selectors` zaczynają zwracać wartość false, zwykle przyczyną jest ta blokada. Zanim uznasz, że sam krok dotyczący SIP się nie powiódł, sprawdź stan SIP i weryfikacji bibliotek. Jeśli te ustawienia są prawidłowe, ale most nadal nie może wykonać wstrzyknięcia, zbierz `imsg status --json` wraz z wynikiem `imsg launch` i zgłoś problem w projekcie `imsg` zamiast osłabiać dodatkowe zabezpieczenia całego systemu.

3. **Wstrzyknij komponent pomocniczy.** Po wyłączeniu SIP i zalogowaniu się w Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` odmawia wykonania wstrzyknięcia, jeśli SIP jest nadal włączony, więc służy to również jako potwierdzenie wykonania kroku 2.

4. **Zweryfikuj most z poziomu OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Wpis iMessage powinien zgłaszać `works`, a `imsg status --json | jq '{rpc_methods, selectors}'` powinien przedstawiać możliwości udostępniane przez używaną kompilację macOS. Tworzenie ankiet wymaga `selectors.pollPayloadMessage`; głosowanie wymaga zarówno `selectors.pollVoteMessage`, jak i metody RPC `poll.vote`. Plugin OpenClaw udostępnia tylko działania obsługiwane przez wynik sondowania zapisany w pamięci podręcznej, natomiast przy pustej pamięci podręcznej zachowuje optymistyczne założenia i wykonuje sondowanie przy pierwszym wysłaniu.

Jeśli `openclaw channels status --probe` zgłasza kanał jako `works`, ale określone działania podczas wysyłania zgłaszają błąd „iMessage `<action>` requires the imsg private API bridge”, ponownie uruchom `imsg launch` — komponent pomocniczy może przestać działać (po ponownym uruchomieniu Messages.app, aktualizacji systemu operacyjnego itp.), a zapisany w pamięci podręcznej stan `available: true` będzie nadal udostępniać działania do czasu odświeżenia go przez kolejne sondowanie.

### Gdy SIP pozostaje włączony

Jeśli wyłączenie SIP jest nieakceptowalne w danym modelu zagrożeń:

- `imsg` przechodzi do trybu podstawowego — obsługuje tylko tekst, multimedia i odbieranie.
- Plugin OpenClaw nadal udostępnia wysyłanie tekstu i multimediów oraz monitorowanie wiadomości przychodzących; ukrywa `react`, `edit`, `unsend`, `reply`, `sendWithEffect` i operacje grupowe z powierzchni działań (zgodnie z blokadą możliwości poszczególnych metod).
- Można użyć osobnego komputera Mac bez Apple Silicon (lub dedykowanego komputera Mac dla bota) z wyłączonym SIP do obsługi obciążenia iMessage, pozostawiając SIP włączony na urządzeniach głównych. Zobacz poniżej sekcję [Dedykowany użytkownik macOS dla bota (osobna tożsamość iMessage)](#deployment-patterns).

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Zasady wiadomości bezpośrednich">
    `channels.imessage.dmPolicy` steruje wiadomościami bezpośrednimi:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego wpisu `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisy listy dozwolonych muszą identyfikować nadawców: uchwyty lub statyczne grupy dostępu nadawców (`accessGroup:<name>`). Użyj `channels.imessage.groupAllowFrom` dla celów czatów, takich jak `chat_id:*`, `chat_guid:*` lub `chat_identifier:*`; użyj `channels.imessage.groups` dla numerycznych kluczy rejestru `chat_id`.

  </Tab>

  <Tab title="Zasady grup i wzmianki">
    `channels.imessage.groupPolicy` steruje obsługą grup:

    - `allowlist` (domyślnie)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Wpisy `groupAllowFrom` mogą również odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`).

    Zachowanie awaryjne środowiska uruchomieniowego: jeśli `groupAllowFrom` nie jest ustawione, kontrole nadawców grupowych iMessage używają `allowFrom`; ustaw `groupAllowFrom`, gdy kryteria dopuszczania wiadomości bezpośrednich i grupowych powinny się różnić. Jawnie puste `groupAllowFrom: []` nie korzysta z zachowania awaryjnego — blokuje wszystkich nadawców grupowych w ramach `allowlist`.
    Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.imessage`, środowisko uruchomieniowe przechodzi na `groupPolicy="allowlist"` i zapisuje ostrzeżenie w dzienniku (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    <Warning>
    Trasowanie grupowe w ramach `groupPolicy: "allowlist"` uruchamia kolejno **dwie** blokady:

    1. **Lista dozwolonych nadawców** (`channels.imessage.groupAllowFrom`) — uchwyt, `accessGroup:<name>`, `chat_guid`, `chat_identifier` lub `chat_id`. Pusta efektywna lista (brak `groupAllowFrom` i zachowania awaryjnego `allowFrom`) blokuje każdego nadawcę grupowego.
    2. **Rejestr grup** (`channels.imessage.groups`) — jest wymuszany, gdy mapa zawiera wpisy: czat musi pasować do jawnego wpisu dla danego `chat_id` lub symbolu wieloznacznego `groups: { "*": { ... } }`. Gdy `groups` jest puste lub go brakuje, o dopuszczeniu decyduje wyłącznie lista dozwolonych nadawców.

    Jeśli nie skonfigurowano efektywnej listy dozwolonych nadawców grupowych, każda wiadomość grupowa jest odrzucana przed sprawdzeniem rejestru. Każda blokada emituje własny sygnał poziomu `warn` przy domyślnym poziomie rejestrowania, a każdy z nich wskazuje inne rozwiązanie:

    - jednorazowo dla każdego konta podczas uruchamiania, gdy efektywna lista dozwolonych nadawców grupowych jest pusta: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — rozwiązaniem jest ustawienie `channels.imessage.groupAllowFrom` (lub `allowFrom`); samo dodanie wpisów `groups` sprawia, że blokada 1 nadal blokuje każdego nadawcę.
    - jednorazowo dla każdego `chat_id` w czasie działania, gdy nadawca przeszedł blokadę 1, ale czatu brakuje w wypełnionym rejestrze `groups`: `imessage: dropping group message from chat_id=<id> ...` — rozwiązaniem jest dodanie tego `chat_id` (lub `"*"`) w `channels.imessage.groups`.

    Nie wpływa to na wiadomości bezpośrednie — korzystają one z innej ścieżki kodu.

    Zalecana konfiguracja przepływu grupowego w ramach `groupPolicy: "allowlist"`:

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

    Samo `groupAllowFrom` dopuszcza tych nadawców w dowolnej grupie; dodaj blok `groups`, aby ograniczyć dozwolone czaty (oraz ustawić opcje poszczególnych czatów, takie jak `requireMention`).
    </Warning>

    Wymaganie wzmianki w grupach:

    - iMessage nie udostępnia natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców wyrażeń regularnych (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców nie można wymusić wymagania wzmianki
    - polecenia sterujące od autoryzowanych nadawców omijają wymaganie wzmianki

    Ustawienie `systemPrompt` dla poszczególnych grup:

    Każdy wpis w `channels.imessage.groups.*` przyjmuje opcjonalny ciąg `systemPrompt`, wstrzykiwany do monitu systemowego agenta przy każdej turze obsługującej wiadomość w tej grupie. Rozstrzyganie odzwierciedla `channels.whatsapp.groups`:

    1. **Monit systemowy określonej grupy** (`groups["<chat_id>"].systemPrompt`): używany, gdy określony wpis grupy istnieje na mapie **i** zdefiniowano w nim klucz `systemPrompt`. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny zostaje pominięty i do tej grupy nie jest stosowany żaden monit systemowy.
    2. **Monit systemowy symbolu wieloznacznego grupy** (`groups["*"].systemPrompt`): używany, gdy określony wpis grupy jest całkowicie nieobecny na mapie lub gdy istnieje, ale nie definiuje klucza `systemPrompt`.

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

    Monity poszczególnych grup dotyczą tylko wiadomości grupowych — nie wpływają na wiadomości bezpośrednie.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - Wiadomości bezpośrednie używają trasowania bezpośredniego, a grupy — trasowania grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości bezpośrednie iMessage są łączone z główną sesją agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych pierwotnego kanału i celu.

    Zachowanie wątków przypominających grupy:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (blokady grupowe i izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Czaty iMessage można powiązać z sesjami ACP.

Szybka procedura operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości bezpośredniej lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji iMessage są kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP bez jej zastępowania.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania używają wpisów `bindings[]` najwyższego poziomu z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu wiadomości bezpośredniej, takiego jak `+15555550123` lub `user@example.com`
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

Opis wspólnego działania powiązań ACP znajduje się w sekcji [Agenci ACP](/pl/tools/acp-agents).

## Wzorce wdrażania

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik macOS dla bota (osobna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od osobistego profilu Messages.

    Typowa procedura:

    1. Utwórz dedykowanego użytkownika systemu macOS lub zaloguj się na jego konto.
    2. W ramach tego konta użytkownika zaloguj się w Wiadomościach przy użyciu Apple ID bota.
    3. Zainstaluj `imsg` w ramach tego konta użytkownika.
    4. Utwórz skrypt opakowujący SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` do profilu tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzenia uprawnień w interfejsie graficznym (Automation + Full Disk Access) w sesji użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - Gateway działa w systemie Linux/na maszynie wirtualnej
    - iMessage i `imsg` działają na Macu w sieci tailnet
    - skrypt opakowujący `cliPath` używa SSH do uruchamiania `imsg`
    - `remoteHost` umożliwia pobieranie załączników przez SCP

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
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby plik `known_hosts` został uzupełniony.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację poszczególnych kont w sekcji `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii oraz listy dozwolonych katalogów głównych załączników.

  </Accordion>

  <Accordion title="Historia wiadomości bezpośrednich">
    Ustaw `channels.imessage.dmHistoryLimit`, aby inicjować nowe sesje wiadomości bezpośrednich ostatnią zdekodowaną historią `imsg` danej rozmowy. Użyj `channels.imessage.dms["<sender>"].historyLimit` do określenia nadpisań dla poszczególnych nadawców, w tym `0`, aby wyłączyć historię dla danego nadawcy.

    Historia wiadomości bezpośrednich iMessage jest pobierana na żądanie z `imsg`. Pozostawienie `dmHistoryLimit` bez ustawionej wartości wyłącza globalne inicjowanie historii wiadomości bezpośrednich, ale dodatnia wartość `channels.imessage.dms["<sender>"].historyLimit` dla konkretnego nadawcy nadal włącza inicjowanie historii dla tego nadawcy.

  </Accordion>
</AccordionGroup>

## Multimedia, dzielenie na fragmenty i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - odbieranie przychodzących załączników jest **domyślnie wyłączone** — ustaw `channels.imessage.includeAttachments: true`, aby przekazywać agentowi zdjęcia, notatki głosowe, filmy i inne załączniki. Gdy ta opcja jest wyłączona, wiadomości iMessage zawierające wyłącznie załączniki są odrzucane przed dotarciem do agenta i mogą w ogóle nie generować wpisu `Inbound message` w dzienniku.
    - zdalne ścieżki załączników można pobierać przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą odpowiadać dozwolonym katalogom głównym:
      - `channels.imessage.attachmentRoots` (lokalnie)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - skonfigurowane katalogi główne rozszerzają domyślny wzorzec katalogu głównego `/Users/*/Library/Messages/Attachments` (są łączone, a nie zastępowane)
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar wychodzących multimediów jest określany przez `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Tekst wychodzący i dzielenie na fragmenty">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia na fragmenty: `channels.imessage.streaming.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie w pierwszej kolejności według akapitów)
    - wychodzące formatowanie Markdown obejmujące pogrubienie, kursywę, podkreślenie i przekreślenie jest konwertowane na natywnie stylizowany tekst (odbiorcy korzystający z systemu macOS 15 lub nowszego widzą stylizację, a odbiorcy korzystający ze starszych wersji widzą zwykły tekst bez znaczników); tabele Markdown są konwertowane zgodnie z trybem tabel Markdown kanału
    - `channels.imessage.sendTransport` (domyślnie `auto`, `bridge`, `applescript`) określa sposób realizacji wysyłania przez `imsg`

  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane do stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są również cele oparte na identyfikatorach użytkowników:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Akcje prywatnego API

Gdy `imsg launch` jest uruchomiony, a `openclaw channels status --probe` zgłasza `privateApi.available: true`, narzędzie wiadomości może oprócz zwykłego wysyłania tekstu korzystać z natywnych akcji iMessage.

Wszystkie akcje są domyślnie włączone; użyj `channels.imessage.actions`, aby wyłączyć poszczególne akcje:

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
    - **react**: Dodaje/usuwa reakcje Tapback iMessage (`messageId`, `emoji`, `remove`). Obsługiwane reakcje Tapback odpowiadają reakcjom: serce, „lubię”, „nie lubię”, śmiech, podkreślenie i pytajnik. Usunięcie bez emoji kasuje dowolną ustawioną reakcję Tapback.
    - **reply**: Wysyła odpowiedź w wątku do istniejącej wiadomości (`messageId`, `text` lub `message`, a także `chatGuid`, `chatId`, `chatIdentifier` lub `to`). Odpowiedź z załącznikiem dodatkowo wymaga kompilacji `imsg`, w której `send-rich` obsługuje `--file`.
    - **sendWithEffect**: Wysyła tekst z efektem iMessage (`text` lub `message`, `effect` lub `effectId`). Nazwy skrócone: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edytuje wysłaną wiadomość w obsługiwanych wersjach systemu macOS/prywatnego API (`messageId`, `text` lub `newText`). Edytować można tylko wiadomości wysłane przez sam Gateway.
    - **unsend**: Wycofuje wysłaną wiadomość w obsługiwanych wersjach systemu macOS/prywatnego API (`messageId`). Wycofać można tylko wiadomości wysłane przez sam Gateway.
    - **upload-file**: Wysyła multimedia/pliki (`buffer` jako base64 lub wypełniony `media`/`path`/`filePath`, `filename`, opcjonalnie `asVoice`). Starszy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Zarządza czatami grupowymi, gdy bieżącym celem jest rozmowa grupowa. Akcje te modyfikują tożsamość Wiadomości na hoście, dlatego wymagają nadawcy będącego właścicielem lub klienta Gateway `operator.admin`.
    - **poll**: Tworzy natywną ankietę Apple Messages (`pollQuestion`, `pollOption` powtórzone od 2 do 12 razy, a także `chatGuid`, `chatId`, `chatIdentifier` lub `to`). Odbiorcy korzystający z systemu iOS/iPadOS/macOS 26 lub nowszego widzą ją i głosują w niej natywnie; starsze wersje systemów operacyjnych otrzymują zastępczy tekst „Sent a poll”. Wymaga `selectors.pollPayloadMessage`.
    - **poll-vote**: Oddaje głos w istniejącej ankiecie (`pollId` lub `messageId`, a także dokładnie jeden z `pollOptionIndex`, `pollOptionId` lub `pollOptionText`). Wymaga `selectors.pollVoteMessage` i metody RPC `poll.vote`.

    Zaakceptowane przychodzące ankiety są przedstawiane agentowi wraz z pytaniem, ponumerowanymi etykietami opcji, liczbami głosów i identyfikatorem wiadomości ankiety wymaganym przez `poll-vote`.

  </Accordion>

  <Accordion title="Identyfikatory wiadomości">
    Kontekst przychodzącej wiadomości iMessage zawiera zarówno krótkie wartości `MessageSid`, jak i pełne identyfikatory GUID wiadomości (`MessageSidFull`), gdy są dostępne. Krótkie identyfikatory są ograniczone do ostatniej pamięci podręcznej odpowiedzi opartej na SQLite i przed użyciem są sprawdzane względem bieżącego czatu. Jeśli krótki identyfikator wygaśnie, spróbuj ponownie, używając jego `MessageSidFull` i wskazując rozmowę, z której pochodzi. Pełne identyfikatory nie omijają powiązania z rozmową ani kontem, dlatego identyfikator z innego czatu należy zastąpić identyfikatorem z bieżącego celu. Zdalnie delegowane wywołania mogą odrzucać nieaktualne pełne identyfikatory, gdy brakuje dowodu ich powiązania z bieżącą rozmową.

  </Accordion>

  <Accordion title="Wykrywanie możliwości">
    OpenClaw ukrywa akcje prywatnego API tylko wtedy, gdy status sondy zapisany w pamięci podręcznej wskazuje, że most jest niedostępny. Jeśli status jest nieznany, akcje pozostają widoczne, a podczas ich wywoływania sondy są uruchamiane leniwie, dzięki czemu pierwsza akcja może zakończyć się powodzeniem po `imsg launch` bez osobnego ręcznego odświeżania statusu.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu i wskaźnik pisania">
    Gdy most prywatnego API jest aktywny, zaakceptowane czaty przychodzące są oznaczane jako przeczytane, a na czatach bezpośrednich pojawia się dymek pisania natychmiast po zaakceptowaniu tury, gdy agent przygotowuje kontekst i generuje odpowiedź. Oznaczanie jako przeczytane można wyłączyć za pomocą:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Starsze kompilacje `imsg`, pochodzące sprzed wprowadzenia listy możliwości poszczególnych metod, po cichu wyłączają wskaźnik pisania i potwierdzenia odczytu; OpenClaw rejestruje jednorazowe ostrzeżenie po każdym ponownym uruchomieniu, aby można było ustalić przyczynę braku potwierdzenia.

  </Accordion>

  <Accordion title="Przychodzące reakcje Tapback">
    OpenClaw subskrybuje reakcje Tapback iMessage i kieruje zaakceptowane reakcje jako zdarzenia systemowe zamiast zwykłego tekstu wiadomości, dzięki czemu reakcja Tapback użytkownika nie uruchamia zwykłej pętli odpowiedzi.

    Tryb powiadomień jest kontrolowany przez `channels.imessage.reactionNotifications`:

    - `"own"` (domyślnie): powiadamiaj tylko wtedy, gdy użytkownicy reagują na wiadomości napisane przez bota.
    - `"all"`: powiadamiaj o wszystkich przychodzących reakcjach Tapback od autoryzowanych nadawców.
    - `"off"`: ignoruj przychodzące reakcje Tapback.

    Nadpisania dla poszczególnych kont korzystają z `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reakcje zatwierdzające (👍 / 👎)">
    Gdy `approvals.exec.enabled` lub `approvals.plugin.enabled` ma wartość true, a żądanie jest kierowane do iMessage, Gateway natywnie dostarcza monit o zatwierdzenie i akceptuje reakcję Tapback w celu jego rozstrzygnięcia:

    - `👍` (reakcja Tapback „Like”) → `allow-once`
    - `👎` (reakcja Tapback „Dislike”) → `deny`
    - `allow-always` pozostaje ręcznym rozwiązaniem zastępczym: wyślij `/approve <id> allow-always` jako zwykłą odpowiedź.

    Obsługa reakcji wymaga, aby identyfikator reagującego użytkownika był jawnie wskazany jako osoba zatwierdzająca. Lista osób zatwierdzających jest odczytywana z `channels.imessage.allowFrom` (lub `channels.imessage.accounts.<id>.allowFrom`); dodaj numer telefonu użytkownika w formacie E.164 lub jego adres e-mail Apple ID (cele czatu takie jak `chat_id:*` nie są prawidłowymi wpisami osób zatwierdzających). Wpis wieloznaczny `"*"` jest respektowany, ale pozwala zatwierdzać każdemu nadawcy; pusta lista osób zatwierdzających całkowicie wyłącza skrót reakcji. Skrót reakcji celowo pomija `reactionNotifications`, `dmPolicy` i `groupAllowFrom`, ponieważ jawna lista dozwolonych osób zatwierdzających jest jedyną kontrolą mającą znaczenie przy rozstrzyganiu zatwierdzenia.

    Autoryzacja polecenia tekstowego `/approve` korzysta z tej samej listy: gdy `channels.imessage.allowFrom` nie jest puste, `/approve <id> <decision>` jest autoryzowane na podstawie tej listy osób zatwierdzających (a nie szerszej listy dozwolonych wiadomości bezpośrednich), a nadawcy dopuszczeni na liście dozwolonych wiadomości bezpośrednich, ale nieobecni w `allowFrom`, otrzymują jawną odmowę. Gdy `allowFrom` jest puste, nadal obowiązuje rozwiązanie zastępcze dla tego samego czatu, a `/approve` autoryzuje każdą osobę dopuszczoną przez listę dozwolonych wiadomości bezpośrednich. Dodaj każdego operatora, który powinien mieć możliwość zatwierdzania — za pomocą `/approve` lub reakcji — do `allowFrom`.

    Uwagi dla operatora:
    - Powiązanie reakcji jest przechowywane zarówno w pamięci, jak i w trwałym magazynie Gateway opartym na kluczach (TTL jest dopasowany do terminu wygaśnięcia zatwierdzenia), a Gateway odpytuje również oczekujące monity o tapbacki, dzięki czemu tapback otrzymany krótko po ponownym uruchomieniu Gateway nadal rozstrzyga zatwierdzenie.
    - Tapback operatora `is_from_me=true` (na przykład ze sparowanego urządzenia Apple) rozstrzyga zatwierdzenie, gdy ten identyfikator jest jawnym zatwierdzającym.
    - Monity o zatwierdzenie są kierowane do rozmowy grupowej tylko wtedy, gdy skonfigurowano jawnych zatwierdzających; w przeciwnym razie zatwierdzenia mógłby dokonać dowolny członek grupy.
    - Starsze tapbacki w formie tekstowej (`Liked "…"` zwykły tekst z bardzo starych klientów Apple) nie mogą rozstrzygać zatwierdzeń, ponieważ nie zawierają identyfikatora GUID wiadomości; rozstrzyganie reakcji wymaga ustrukturyzowanych metadanych tapbacka emitowanych przez obecne klienty macOS / iOS.

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie zezwala na inicjowane przez kanał zapisy konfiguracji (dla `/config set|unset`, gdy `commands.config: true`).

Wyłączanie:

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

## Scalanie podzielonych wiadomości prywatnych (polecenie + adres URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i adres URL — np. `Dump https://example.com/article` — aplikacja Wiadomości firmy Apple dzieli wysyłkę na **dwa oddzielne wiersze `chat.db`**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu adresu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

W większości konfiguracji oba wiersze docierają do OpenClaw w odstępie około 0,8–2,0 s. Bez scalania agent otrzymuje samo polecenie w turze 1 (i często odpowiada „wyślij adres URL”), zanim adres URL dotrze w turze 2. Wynika to z potoku wysyłania Apple, a nie z działania wprowadzonego przez OpenClaw ani `imsg`.

`channels.imessage.coalesceSameSenderDms` włącza dla wiadomości prywatnych buforowanie kolejnych wierszy od tego samego nadawcy. Gdy `imsg` udostępnia strukturalny znacznik podglądu adresu URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` w jednym z wierszy źródłowych, OpenClaw scala tylko tę rzeczywiście podzieloną wysyłkę, a pozostałe buforowane wiersze zachowuje jako osobne tury. W starszych kompilacjach `imsg`, które nie emitują żadnych metadanych dymka, OpenClaw nie potrafi odróżnić podzielonej wysyłki od osobnych wysyłek, dlatego awaryjnie scala zawartość bufora. Zachowuje to zachowanie sprzed wprowadzenia metadanych, zamiast powodować regresję polegającą na dzieleniu wysyłek `Dump <url>` na dwie tury. Czaty grupowe nadal przekazują każdą wiadomość osobno, aby zachować strukturę tur wielu użytkowników.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Udostępniane Skills oczekują `command + payload` w jednej wiadomości (zrzut, wklejenie, zapisanie, dodanie do kolejki itd.).
    - Użytkownicy wklejają adresy URL razem z poleceniami.
    - Można zaakceptować dodatkowe opóźnienie tur wiadomości prywatnych (patrz niżej).

    Pozostaw wyłączone, gdy:

    - Wymagane jest minimalne opóźnienie poleceń dla jednowyrazowych wyzwalaczy w wiadomościach prywatnych.
    - Wszystkie przepływy składają się z jednorazowych poleceń bez późniejszych wiadomości z ładunkiem.

  </Tab>
  <Tab title="Włączanie">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // włączenie opcjonalne (domyślnie: false)
        },
      },
    }
    ```

    Po włączeniu flagi, jeśli nie ustawiono jawnie `messages.inbound.byChannel.imessage` ani globalnego `messages.inbound.debounceMs`, okno debounce zostaje rozszerzone do **7000 ms** (starsza wartość domyślna to 0 ms — bez debounce). Szersze okno jest wymagane, ponieważ odstęp między częściami wysyłki dzielonej przez podgląd adresu URL Apple może wydłużyć się do kilku sekund, gdy Messages.app emituje wiersz podglądu.

    Aby samodzielnie dostosować okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms obejmuje zaobserwowane opóźnienia podglądu adresów URL w Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisy">
    - **Precyzyjne scalanie wymaga aktualnych metadanych ładunku `imsg`.** Gdy obecne jest `balloon_bundle_id`, scalana jest tylko rzeczywiście podzielona wysyłka; opisane wyżej awaryjne scalanie bez metadanych stanowi tymczasową zgodność wsteczną i zostanie usunięte, gdy `imsg` zacznie scalać podzielone wysyłki po stronie źródłowej.
    - **Dodatkowe opóźnienie wiadomości prywatnych.** Po włączeniu flagi każda wiadomość prywatna (w tym samodzielne polecenia sterujące i pojedyncze tekstowe wiadomości uzupełniające) czeka przed przekazaniem maksymalnie przez czas okna debounce na wypadek nadejścia wiersza podglądu adresu URL. Wiadomości czatu grupowego są przekazywane natychmiast.
    - **Scalony wynik ma określone limity.** Scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; liczba załączników jest ograniczona do 20; liczba wpisów źródłowych jest ograniczona do 10 (po przekroczeniu limitu zachowywany jest pierwszy wpis i najnowsze wpisy). Każdy źródłowy identyfikator GUID jest śledzony w `coalescedMessageGuids` na potrzeby dalszej telemetrii.
    - **Tylko wiadomości prywatne.** Czaty grupowe nadal przekazują każdą wiadomość osobno, dzięki czemu bot zachowuje responsywność, gdy pisze wiele osób.
    - **Opcjonalne, dla każdego kanału osobno.** Nie wpływa to na inne kanały (Discord, Slack, Telegram, WhatsApp, …). Starsze konfiguracje BlueBubbles, które ustawiają `channels.bluebubbles.coalesceSameSenderDms`, powinny przenieść tę wartość do `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenariusze i dane widoczne dla agenta

Kolumna „Flaga włączona” przedstawia zachowanie kompilacji `imsg`, która emituje `balloon_bundle_id`. W starszych kompilacjach `imsg`, które nie emitują żadnych metadanych dymka, wiersze oznaczone niżej jako „Dwie tury” / „N tur” korzystają zamiast tego ze starszego scalania awaryjnego (jedna tura): OpenClaw nie potrafi strukturalnie odróżnić podzielonej wysyłki od osobnych wysyłek, dlatego zachowuje scalanie sprzed wprowadzenia metadanych. Precyzyjne rozdzielanie włącza się, gdy kompilacja zaczyna emitować metadane dymka.

| Kompozycja użytkownika                                              | Wynik działania `chat.db`         | Flaga wyłączona (domyślnie)                      | Flaga włączona + okno (imsg emituje metadane dymka)                                                  |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                              | 2 wiersze w odstępie około 1 s                   | Dwie tury agenta: samo „Dump”, a następnie adres URL | Jedna tura: scalony tekst `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 wiersze bez metadanych dymka adresu URL | Dwie tury                               | Dwie tury po zaobserwowaniu metadanych; jedna scalona tura w starych sesjach bez metadanych lub sprzed aktywacji       |
| `/status` (samodzielne polecenie)                                     | 1 wiersz                               | Natychmiastowe przekazanie                        | **Oczekiwanie maksymalnie przez czas okna, a następnie przekazanie**                                |
| Sam adres URL                                                   | 1 wiersz                               | Natychmiastowe przekazanie                        | Oczekiwanie maksymalnie przez czas okna, a następnie przekazanie                                    |
| Tekst + adres URL wysłane celowo jako dwie osobne wiadomości w odstępie kilku minut | 2 wiersze poza oknem               | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                                                 |
| Szybka seria (>10 małych wiadomości prywatnych w czasie okna)                          | N wierszy bez metadanych dymka adresu URL | N tur                                 | N tur po zaobserwowaniu metadanych; jedna scalona tura z limitami w starych sesjach bez metadanych lub sprzed aktywacji |
| Dwie osoby piszące na czacie grupowym                                  | N wierszy od M nadawców               | M+ tur (po jednej na bufor nadawcy)        | M+ tur — czaty grupowe nie są scalane                                                              |

## Odzyskiwanie wiadomości przychodzących po ponownym uruchomieniu mostu lub Gateway

iMessage odzyskuje wiadomości pominięte podczas niedostępności Gateway, a jednocześnie tłumi nieaktualną „bombę zaległości”, którą Apple może wysłać po odzyskaniu połączenia Push. Domyślne zachowanie jest zawsze włączone i opiera się na deduplikacji wiadomości przychodzących.

- **Deduplikacja powtórzeń.** Każda przekazana wiadomość przychodząca jest rejestrowana według identyfikatora GUID Apple w trwałym stanie pluginu (`imessage.inbound-dedupe`): zostaje zarezerwowana podczas pobierania i zatwierdzona po obsłużeniu (rezerwacja jest zwalniana po przejściowym błędzie, aby umożliwić ponowną próbę). Wszystko, co już obsłużono, jest odrzucane zamiast przekazywane dwukrotnie. Umożliwia to agresywne odtwarzanie podczas odzyskiwania bez prowadzenia ewidencji poszczególnych wiadomości.
- **Odzyskiwanie po przestoju.** Podczas uruchamiania monitor zapamiętuje ostatni przekazany identyfikator rowid `chat.db` (trwały kursor dla każdego konta) i przekazuje go do `imsg watch.subscribe` jako `since_rowid`, dzięki czemu imsg odtwarza wiersze otrzymane podczas niedostępności Gateway, a następnie śledzi wiadomości na żywo. Odtwarzanie jest ograniczone do 500 najnowszych wierszy oraz wiadomości sprzed maksymalnie około 2 godzin, a deduplikacja odrzuca wszystko, co już obsłużono.
- **Ograniczenie wieku nieaktualnych zaległości.** Wiersze powyżej granicy uruchomienia są faktycznie odbierane na żywo; jeśli data wysłania jednego z nich jest starsza od czasu nadejścia o ponad około 15 minut, jest on zaległością opróżnioną przez Push i zostaje stłumiony. Odtwarzane wiersze (na granicy lub poniżej niej) korzystają natomiast z szerszego okna odzyskiwania, dzięki czemu niedawno pominięta wiadomość zostaje dostarczona, a dawna historia nie.

Odzyskiwanie działa zarówno w lokalnych, jak i zdalnych konfiguracjach `cliPath`, ponieważ odtwarzanie `since_rowid` odbywa się przez to samo połączenie RPC `imsg`. Różnica dotyczy okna: gdy Gateway może odczytać `chat.db` (lokalnie), ustala na jego podstawie graniczny identyfikator rowid uruchomienia, ogranicza zakres odtwarzania i dostarcza pominięte wiadomości sprzed maksymalnie kilku godzin. W przypadku zdalnego `cliPath` przez SSH nie może odczytać bazy danych, dlatego odtwarzanie nie ma limitu, a każdy wiersz korzysta z ograniczenia wieku wiadomości na żywo — nadal odzyskuje niedawno pominięte wiadomości i tłumi stare zaległości, ale używa węższego okna wiadomości na żywo. Aby uzyskać szersze okno odzyskiwania, należy uruchomić Gateway na Macu obsługującym Wiadomości.

### Sygnał widoczny dla operatora

Stłumione zaległości są rejestrowane na domyślnym poziomie i nigdy nie są odrzucane bez informacji (flaga `recovery` wskazuje zastosowane okno):

```text
imessage: stłumiono nieaktualne zaległe wiadomości przychodzące account=<id> sent=<iso> recovery=<bool> (<N> stłumionych od uruchomienia)
```

### Migracja

`channels.imessage.catchup.*` jest przestarzałe — odzyskiwanie po przestoju jest automatyczne i w nowych konfiguracjach nie wymaga ustawień. Istniejące konfiguracje z `catchup.enabled: true` nadal są respektowane jako profil zgodności dla okna odtwarzania podczas odzyskiwania. Wyłączone bloki nadrabiania zaległości (`enabled: false` lub brak `enabled: true`) zostały wycofane; `openclaw doctor --fix` je usuwa.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie znaleziono imsg lub RPC nie jest obsługiwane">
    Sprawdź plik binarny i obsługę RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jeśli sonda zgłasza brak obsługi RPC, zaktualizuj `imsg`. Jeśli działania prywatnego API są niedostępne, uruchom `imsg launch` w sesji zalogowanego użytkownika macOS i ponownie wykonaj sondowanie. Jeśli Gateway nie działa w systemie macOS, zamiast domyślnej lokalnej ścieżki `imsg` użyj opisanej wyżej konfiguracji zdalnego Maca przez SSH.

  </Accordion>

  <Accordion title="Wiadomości są wysyłane, ale przychodzące wiadomości iMessage nie docierają">
    Najpierw sprawdź, czy wiadomość dotarła do lokalnego Maca. Jeśli `chat.db` się nie zmienia, OpenClaw nie może odebrać wiadomości, nawet gdy `imsg status --json` zgłasza prawidłowo działający most.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Jeśli wiadomości wysyłane z telefonu nie tworzą nowych wierszy, przed zmianą konfiguracji OpenClaw należy naprawić warstwę Wiadomości macOS i Apple Push. Często wystarcza jednorazowe odświeżenie usługi:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Wyślij nową wiadomość iMessage z telefonu i przed debugowaniem sesji OpenClaw potwierdź pojawienie się nowego wiersza `chat.db` lub zdarzenia `imsg watch`. Nie uruchamiaj tego jako okresowej pętli ponownie uruchamiającej most; powtarzające się `imsg launch` wraz z ponownymi uruchomieniami Gateway podczas aktywnej pracy mogą przerywać dostarczanie wiadomości i pozostawiać trwające uruchomienia kanału w stanie zawieszenia.

  </Accordion>

  <Accordion title="Gateway nie działa w systemie macOS">
    Domyślny `cliPath: "imsg"` musi działać na Macu zalogowanym do Wiadomości. W systemie Linux lub Windows ustaw `channels.imessage.cliPath` na skrypt opakowujący, który łączy się przez SSH z tym Makiem i uruchamia `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Następnie uruchom:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Wiadomości prywatne są ignorowane">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia parowania (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Wiadomości grupowe są ignorowane">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` działanie listy dozwolonych
    - konfiguracja wzorca wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Załączniki zdalne nie działają">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta Gateway
    - klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - możliwość odczytu ścieżki zdalnej na Macu, na którym działa Messages

  </Accordion>

  <Accordion title="Pominięto monity o uprawnienia systemu macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w kontekście tego samego użytkownika i tej samej sesji, a następnie zaakceptuj monity:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Potwierdź, że dla kontekstu procesu uruchamiającego OpenClaw/`imsg` przyznano pełny dostęp do dysku i uprawnienia automatyzacji.

  </Accordion>
</AccordionGroup>

## Odnośniki do dokumentacji konfiguracji

- [Dokumentacja konfiguracji — iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Usunięcie BlueBubbles i ścieżka iMessage oparta na imsg](/pl/announcements/bluebubbles-imessage) — ogłoszenie i podsumowanie migracji
- [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) — tabela mapowania konfiguracji i instrukcja migracji krok po kroku
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i proces parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i ograniczanie obsługi na podstawie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
