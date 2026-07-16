---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, sposób dostarczania i obsługa operacyjna
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T18:03:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do użytku produkcyjnego przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami; nie istnieje osobny kanał WhatsApp Twilio.

## Instalacja

`openclaw onboard` i `openclaw channels add --channel whatsapp` wyświetlają monit o instalację pluginu przy jego pierwszym wybraniu; `openclaw channels login --channel whatsapp` oferuje ten sam proces instalacji, jeśli pluginu brakuje. Wersje deweloperskie używają lokalnej ścieżki pluginu; instalacje stabilne/beta najpierw instalują `@openclaw/whatsapp` z ClawHub, a w razie niepowodzenia używają npm. Środowisko uruchomieniowe WhatsApp jest dostarczane poza głównym pakietem npm OpenClaw, dlatego jego zależności pozostają w zewnętrznym pluginie. Instalacja ręczna:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Podstawowego pakietu npm (`@openclaw/whatsapp`) należy używać tylko jako rozwiązania rezerwowego dla rejestru; dokładną wersję należy przypinać wyłącznie w celu zapewnienia powtarzalnej instalacji.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości prywatnych dla nieznanych nadawców jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Procedury diagnostyki i naprawy obejmujące wiele kanałów.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Skonfiguruj zasady dostępu">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Połącz WhatsApp (kod QR)">

```bash
openclaw channels login --channel whatsapp
```

    Logowanie odbywa się wyłącznie za pomocą kodu QR. Na hostach zdalnych lub bez interfejsu graficznego przed rozpoczęciem logowania należy zapewnić niezawodny sposób przekazania aktywnego kodu QR na telefon; kody QR wyświetlane w terminalu, zrzuty ekranu lub załączniki na czacie mogą wygasnąć podczas przesyłania.

    Dla określonego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby przed logowaniem dołączyć istniejący lub niestandardowy katalog uwierzytelniania:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Zatwierdź pierwszą prośbę o parowanie (tryb parowania)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Prośby o parowanie wygasają po 1 godzinie; liczba oczekujących próśb jest ograniczona do 3 na konto.

  </Step>
</Steps>

<Note>
Zalecany jest osobny numer WhatsApp (konfiguracja i metadane są pod tym kątem zoptymalizowane), ale w pełni obsługiwane są również konfiguracje z numerem osobistym i czatem z samym sobą.
</Note>

## Wzorce wdrażania

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    - osobna tożsamość WhatsApp dla OpenClaw
    - bardziej przejrzyste listy dozwolonych nadawców wiadomości prywatnych i granice routingu
    - mniejsze ryzyko pomyłek związanych z czatem z samym sobą

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb rezerwowy z numerem osobistym">
    Proces wdrażania obsługuje tryb numeru osobistego i zapisuje konfigurację bazową dostosowaną do czatu z samym sobą: `dmPolicy: "allowlist"`, `allowFrom` z uwzględnieniem własnego numeru, `selfChatMode: true`. Mechanizmy ochrony czatu z samym sobą w środowisku uruchomieniowym opierają się na połączonym własnym numerze oraz `allowFrom`.
  </Accordion>
</AccordionGroup>

## Model środowiska uruchomieniowego

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Mechanizm nadzorujący niezależnie śledzi dwa sygnały: aktywność nieprzetworzonego transportu WhatsApp Web oraz aktywność wiadomości aplikacji. Cicha, lecz połączona sesja nie jest uruchamiana ponownie tylko dlatego, że ostatnio nie nadeszła żadna wiadomość; ponowne połączenie jest wymuszane wyłącznie wtedy, gdy ramki transportowe przestaną napływać przez stały wewnętrzny okres (niekonfigurowalny przez użytkownika) albo wiadomości aplikacji nie pojawią się przez czas przekraczający 4-krotność normalnego limitu czasu wiadomości. Bezpośrednio po ponownym połączeniu niedawno aktywnej sesji pierwszy okres używa krótszego, normalnego limitu czasu wiadomości zamiast okresu 4-krotnie dłuższego. OpenClaw może automatycznie odpowiadać na wiadomości offline, które Baileys dostarczy na początku tego ponownego połączenia, w granicach czasu przechowywania identyfikatorów wiadomości do deduplikacji; podczas początkowego uruchomienia zachowywane jest krótkie zabezpieczenie przed nieaktualną historią.
- Czasy gniazda Baileys są jawnie określone w `web.whatsapp.*`: `keepAliveIntervalMs` (interwał sygnału ping aplikacji), `connectTimeoutMs` (limit czasu początkowego uzgadniania), `defaultQueryTimeoutMs` (oczekiwanie na zapytania Baileys oraz limity czasu wysyłania wychodzącego, obecności i przychodzących potwierdzeń odczytu w OpenClaw).
- Wysyłanie wiadomości wychodzących wymaga aktywnego nasłuchiwania WhatsApp dla konta docelowego; w przeciwnym razie wysyłanie natychmiast kończy się niepowodzeniem.
- Wiadomości wysyłane do grup zawierają natywne metadane wzmianek dla tokenów `@+<digits>` i `@<digits>` (w tekście i podpisach multimediów), jeśli token odpowiada bieżącym metadanym uczestnika, również w grupach opartych na LID.
- Czaty statusowe i transmisyjne (`@status`, `@broadcast`) są ignorowane.
- Czaty bezpośrednie korzystają z reguł sesji wiadomości prywatnych (`session.dmScope`; domyślna wartość `main` łączy wiadomości prywatne w głównej sesji agenta). Sesje grupowe są izolowane dla każdego JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanały/biuletyny WhatsApp mogą być jawnymi celami wiadomości wychodzących za pośrednictwem ich natywnego JID `@newsletter`, z użyciem metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`) zamiast semantyki wiadomości prywatnych.
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe serwera proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, również warianty pisane małymi literami). Zaleca się konfigurację serwera proxy na poziomie hosta zamiast ustawień poszczególnych kanałów.
- Gdy opcja `messages.removeAckAfterReply` jest włączona, OpenClaw usuwa reakcję potwierdzenia po dostarczeniu widocznej odpowiedzi.

## Nawiązywanie połączenia z bieżącym nadawcą za pomocą MeowCaller (eksperymentalne)

Plugin może udostępniać `whatsapp_call` podczas tur agenta pochodzących z WhatsApp. Używa narzędzia [MeowCaller](https://github.com/purpshell/meowcaller) do nawiązania połączenia głosowego WhatsApp z bieżącym upoważnionym nadawcą i odtworzenia komunikatu TTS OpenClaw po odebraniu połączenia. Narzędzie nie ma parametru numeru docelowego, dlatego monit nie może przekierować połączenia. Funkcja jest domyślnie wyłączona.

<Warning>
MeowCaller jest rozwiązaniem eksperymentalnym, nie ma oznaczonego wydania i używa osobno sparowanej sesji połączonego urządzenia whatsmeow — nie może ponownie wykorzystać danych uwierzytelniających Baileys należących do pluginu. Parowanie dodaje kolejne połączone urządzenie do tego samego konta WhatsApp; kod należy zeskanować przy użyciu tożsamości używanej przez OpenClaw. W trybie numeru osobistego lub czatu z samym sobą nie można nawiązać połączenia z własnym numerem; należy użyć dedykowanego numeru OpenClaw do dzwonienia na numer osobisty.
</Warning>

<Steps>
  <Step title="Włącz eksperymentalne połączenia">

    Dodaj `actions.calls: true` do konfiguracji kanału WhatsApp i uruchom ponownie Gateway:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Jeśli wartość jest nieobecna lub wynosi `false`, OpenClaw nie udostępnia narzędzia `whatsapp_call`.

  </Step>

  <Step title="Zainstaluj zweryfikowany interfejs CLI MeowCaller">

    Adapter oczekuje pliku wykonywalnego `meowcaller` w ścieżce `PATH` hosta Gateway. Do czasu scalenia [PR nr 7 projektu MeowCaller](https://github.com/purpshell/meowcaller/pull/7) należy zbudować zweryfikowaną gałąź:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Należy upewnić się, że `$HOME/.local/bin` znajduje się w `PATH` usługi Gateway. Ta rewizja zawiera jawne polecenia `pair` i `notify` służące wyłącznie do wysyłania; `notify` nie otwiera mikrofonu, głośnika, urządzenia wideo ani funkcji przechwytywania diagnostycznego. Nie należy zastępować go poleceniem `play` z przykładowego interfejsu CLI projektu nadrzędnego.

  </Step>

  <Step title="Sparuj połączone urządzenie MeowCaller">

    Należy poprosić agenta WhatsApp o sprawdzenie konfiguracji połączeń (akcja statusu `whatsapp_call` zgłasza katalog stanu określony dla konta oraz polecenie parowania). Dla konta domyślnego:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Polecenie należy uruchomić interaktywnie, zeskanować kod QR w sekcji **WhatsApp > Linked devices** i poczekać na `MeowCaller linked device ready`. Należy zachować poufność `wa-voip.db` — jest to sesja MeowCaller. Konta inne niż domyślne otrzymują własną ścieżkę magazynu z akcji statusu; w systemie Windows należy uruchomić odpowiednie polecenie PowerShell.

  </Step>

  <Step title="Skonfiguruj TTS i nawiąż połączenie z WhatsApp">

    Należy skonfigurować [dostawcę TTS](/pl/tools/tts) obsługującego telefonię, uruchomić ponownie Gateway, a następnie wysłać żądanie, takie jak `Call me and say the build finished.` Narzędzie ustala nadawcę na podstawie zaufanego kontekstu przychodzącego, syntetyzuje tymczasowy prywatny plik WAV, uruchamia MeowCaller na ograniczony czas połączenia, a następnie usuwa plik dźwiękowy. OpenClaw jawnie przekazuje magazyn konta, czeka na zerowy kod wyjścia po odebraniu, odtworzeniu i rozłączeniu oraz traktuje przekroczenie limitu czasu lub niezerowy kod wyjścia jako nieudane wywołanie narzędzia.

  </Step>
</Steps>

Ograniczenia: wyłącznie wychodzące połączenia głosowe jeden na jeden, brak dowolnych numerów docelowych, brak współdzielonego uwierzytelniania z połączeniem czatu, brak połączeń z własnym numerem w trybie numeru osobistego lub czatu z samym sobą, syntetyzowany dźwięk ograniczony do 60 sekund, brak potwierdzenia słyszalności po stronie telefonu poza zakończeniem etapów odebrania, odtworzenia i rozłączenia przez MeowCaller oraz zatrzymywanie procesu pomocniczego przez OpenClaw po ograniczonym okresie 115–175 sekund (obejmującym fazy łączenia, odbierania, odtwarzania i zamykania MeowCaller).

## Monity o zatwierdzenie

WhatsApp może wyświetlać monity o zatwierdzenie wykonywania poleceń i pluginów jako reakcje `👍`/`👎`, sterowane przez konfigurację przekazywania zatwierdzeń najwyższego poziomu:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` i `approvals.plugin` są niezależne; włączenie WhatsApp jako kanału jedynie łączy transport i nie wysyła niczego, jeśli odpowiednia rodzina zatwierdzeń nie jest włączona i kierowana do tego kanału. Tryb sesji dostarcza natywne zatwierdzenia za pomocą emoji wyłącznie w przypadku zatwierdzeń pochodzących z WhatsApp. Tryb celu używa współdzielonego potoku przekazywania dla jawnie określonych celów i nie tworzy osobnego rozsyłania wiadomości prywatnych do zatwierdzających.

Reakcje zatwierdzające WhatsApp wymagają jawnego określenia zatwierdzających w `allowFrom` (lub `"*"`). `defaultTo` określa zwykłe domyślne cele wiadomości, a nie listę zatwierdzających. Ręczne polecenia `/approve` nadal przechodzą standardową ścieżkę autoryzacji nadawcy WhatsApp przed rozstrzygnięciem zatwierdzenia.

## Hooki pluginów i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać treści osobiste, numery telefonów, identyfikatory grup, nazwy nadawców i pola korelacji sesji. WhatsApp nie rozsyła do pluginów przychodzących danych hooka `message_received`, chyba że zostanie to włączone:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Zgodę można ograniczyć do jednego konta w `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Funkcję należy włączać wyłącznie dla pluginów, którym ufa się w zakresie dostępu do przychodzących treści i identyfikatorów WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasady wiadomości prywatnych">
    `channels.whatsapp.dmPolicy`:

    | Wartość | Zachowanie |
    | --- | --- |
    | `pairing` (domyślnie) | Nieznani nadawcy proszą o parowanie; właściciel zatwierdza |
    | `allowlist` | Dopuszczani są tylko nadawcy `allowFrom` |
    | `open` | Wymaga, aby `allowFrom` zawierało `"*"` |
    | `disabled` | Blokuje wszystkie wiadomości prywatne |

    `allowFrom` przyjmuje numery w formacie E.164 (normalizowane wewnętrznie). Jest to wyłącznie lista kontroli dostępu nadawców wiadomości prywatnych — nie ogranicza jawnego wysyłania wiadomości wychodzących do grupowych JID ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `.allowFrom`) ma dla danego konta pierwszeństwo przed wartościami domyślnymi na poziomie kanału.

    Uwagi dotyczące środowiska uruchomieniowego:

    - parowania są utrwalane w magazynie dozwolonych elementów kanału i scalane ze skonfigurowanymi `allowFrom`
    - zaplanowane automatyzacje i mechanizm wyboru zastępczego odbiorcy Heartbeat używają jawnych celów dostarczania lub skonfigurowanych `allowFrom`; zatwierdzenia parowania wiadomości prywatnych nie stają się domyślnie odbiorcami Cron/Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych elementów, domyślnie dozwolony jest powiązany własny numer
    - OpenClaw nigdy nie paruje automatycznie wychodzących wiadomości prywatnych `fromMe` (wiadomości wysyłanych do siebie z powiązanego urządzenia)

  </Tab>

  <Tab title="Zasady grup i listy dozwolonych elementów">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonego członkostwa w grupach** (`channels.whatsapp.groups`): jeśli pominięto `groups`, kwalifikują się wszystkie grupy; jeśli jest obecne, działa jako lista dozwolonych grup (`"*"` dopuszcza wszystkie).
    2. **Zasady nadawców w grupach** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` pomija listę dozwolonych nadawców, `allowlist` wymaga dopasowania `groupAllowFrom` (lub `*`), a `disabled` blokuje wszystkie przychodzące wiadomości grupowe.

    Jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców korzysta zastępczo z `allowFrom`, gdy zawiera ono wpisy. Listy dozwolonych nadawców są sprawdzane przed aktywacją przez wzmiankę lub odpowiedź.

    Jeśli blok `channels.whatsapp` w ogóle nie istnieje, środowisko uruchomieniowe korzysta zastępczo z `groupPolicy: "allowlist"` (z ostrzeżeniem w dzienniku), nawet gdy `channels.defaults.groupPolicy` ma inną wartość.

    <Note>
    Rozstrzyganie członkostwa w grupach ma zabezpieczenie dla jednego konta: jeśli skonfigurowano tylko jedno konto WhatsApp, a jego `accounts.<id>.groups` jest jawnym pustym obiektem (`{}`), traktuje się to jako „nieustawione” i używa zastępczo głównej mapy `channels.whatsapp.groups`, zamiast po cichu blokować każdą grupę. Gdy skonfigurowano co najmniej 2 konta, jawnie pusta mapa konta pozostaje pusta i nie korzysta z wartości zastępczej — dzięki temu jedno konto może celowo wyłączyć wszystkie grupy bez wpływu na pozostałe konta.
    </Note>

  </Tab>

  <Tab title="Wzmianki i /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki. Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, wartość zastępcza `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi jest zgodny z tożsamością bota)

    Bezpieczeństwo: cytat lub odpowiedź spełnia jedynie warunek wzmianki — **nie** udziela nadawcy autoryzacji. Przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych pozostają zablokowani nawet wtedy, gdy odpowiadają na wiadomość użytkownika z listy dozwolonych.

    Polecenie aktywacji na poziomie sesji: `/activation mention` lub `/activation always`. Aktualizuje ono stan sesji (nie konfigurację globalną) i jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Skonfigurowane powiązania ACP

WhatsApp obsługuje trwałe powiązania ACP za pomocą elementu najwyższego poziomu `bindings[]`:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

Czaty bezpośrednie są dopasowywane do numerów E.164, a grupy do identyfikatorów JID grup WhatsApp. Listy dozwolonych grup, zasady nadawców oraz warunki aktywacji przez wzmiankę lub polecenie są stosowane, zanim OpenClaw zapewni istnienie powiązanej sesji ACP. Dopasowane powiązanie przejmuje trasę — grupy rozgłoszeniowe nie rozsyłają tej tury do zwykłych sesji WhatsApp.

## Zachowanie numeru osobistego i czatu ze sobą

Gdy powiązany własny numer znajduje się również w `allowFrom`, aktywują się zabezpieczenia czatu ze sobą: potwierdzenia odczytu są pomijane dla tur czatu ze sobą, ignorowane jest automatyczne wyzwalanie przez JID wzmianki, które powodowałoby wysłanie powiadomienia do siebie, a odpowiedzi domyślnie trafiają do `[{identity.name}]` (lub `[openclaw]`), gdy `messages.responsePrefix` nie jest ustawione.

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta wiadomości przychodzącej i kontekst odpowiedzi">
    Wiadomości przychodzące są opakowywane we wspólną kopertę wiadomości przychodzącej. Cytowana odpowiedź dołącza kontekst w następującej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadane odpowiedzi (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy) są uzupełniane, gdy są dostępne. Jeśli cytowany element docelowy jest plikiem multimedialnym możliwym do pobrania, OpenClaw zapisuje go za pośrednictwem zwykłego magazynu przychodzących multimediów i udostępnia `MediaPath`/`MediaType`, aby agent mógł sprawdzić go bezpośrednio, zamiast widzieć tylko `<media:image>`.

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów i wyodrębnianie lokalizacji/kontaktów">
    Wiadomości zawierające wyłącznie multimedia są normalizowane do symboli zastępczych: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Autoryzowane grupowe notatki głosowe są transkrybowane przed sprawdzeniem warunku wzmianki, gdy treść zawiera wyłącznie `<media:audio>`, dzięki czemu wypowiedzenie wzmianki o bocie w notatce głosowej może wyzwolić odpowiedź. Jeśli transkrypcja nadal nie zawiera wzmianki o bocie, trafia do oczekującej historii grupy zamiast nieprzetworzonego symbolu zastępczego.

    Treść lokalizacji jest renderowana jako zwięzły tekst ze współrzędnymi. Etykiety i komentarze lokalizacji oraz szczegóły kontaktów/vCard są renderowane jako ogrodzone, niezaufane metadane, a nie tekst osadzony w prompcie.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    Nieprzetworzone wiadomości grupowe są buforowane i wstrzykiwane jako kontekst po ostatecznym wyzwoleniu bota.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`, wartość zastępcza `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzykiwania: `[Chat messages since your last reply - for context]` i `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu">
    Domyślnie włączone dla zaakceptowanych wiadomości przychodzących. Wyłączenie globalne:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Nadpisanie dla konta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Tury czatu ze sobą pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` preferuje granice akapitów (puste wiersze), a następnie korzysta zastępczo z bezpiecznego dzielenia według długości

  </Accordion>

  <Accordion title="Obsługa wychodzących multimediów">
    - obsługuje obrazy, filmy, dźwięk (notatki głosowe PTT) i dokumenty
    - dźwięk jest wysyłany jako ładunek Baileys `audio` z `ptt: true`, renderowany jako notatka głosowa „naciśnij, aby mówić”; `audioAsVoice` jest zachowywane w ładunkach odpowiedzi, dzięki czemu wyjście notatki głosowej TTS pozostaje na tej ścieżce niezależnie od formatu źródłowego dostawcy
    - natywny dźwięk Ogg/Opus jest wysyłany jako `audio/ogg; codecs=opus`; wszystkie pozostałe formaty (w tym dane wyjściowe MP3/WebM usługi TTS Microsoft Edge) są transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i zapobiega ponownym wysyłkom tej samej odpowiedzi; `/tts chat on|off|default` steruje automatycznym TTS dla bieżącego czatu
    - `gifPlayback: true` przy wysyłaniu filmu włącza odtwarzanie animowanego GIF-a
    - `forceDocument`/`asDocument` kieruje wychodzące obrazy, GIF-y i filmy przez ładunek dokumentu Baileys, aby uniknąć kompresji multimediów przez WhatsApp, zachowując ustaloną nazwę pliku i typ MIME
    - podpisy dotyczą pierwszego elementu multimedialnego w odpowiedzi z wieloma multimediami, z wyjątkiem notatek głosowych PTT: dźwięk jest wysyłany najpierw bez podpisu, a następnie podpis jest wysyłany jako osobna wiadomość tekstowa (klienty WhatsApp nie renderują podpisów notatek głosowych w sposób spójny)
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżka lokalna

  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie zastępcze">
    - limit zapisu danych przychodzących i wysyłania danych wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisanie dla konta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru i dobór jakości), aby zmieścić się w limitach, chyba że `forceDocument`/`asDocument` wymaga dostarczenia jako dokument
    - w razie niepowodzenia wysyłania multimediów mechanizm zastępczy dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu odrzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

`channels.whatsapp.replyToMode` steruje natywnym cytowaniem odpowiedzi (odpowiedzi wychodzące zawierają widoczny cytat wiadomości przychodzącej):

| Wartość             | Zachowanie                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (domyślnie) | Nigdy nie cytuje; wysyła jako zwykłą wiadomość                           |
| `"first"`         | Cytuje tylko pierwszy fragment odpowiedzi wychodzącej                      |
| `"all"`           | Cytuje każdy fragment odpowiedzi wychodzącej                               |
| `"batched"`       | Cytuje kolejkowane odpowiedzi grupowane; pozostawia odpowiedzi natychmiastowe bez cytatu |

Nadpisanie dla konta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` określa zakres używania przez agenta reakcji emoji:

| Poziom                 | Reakcje potwierdzające | Reakcje inicjowane przez agenta  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Nie            | Nie                         |
| `"ack"`               | Tak           | Nie                         |
| `"minimal"` (domyślnie) | Tak           | Tak, ostrożne wytyczne |
| `"extensive"`         | Tak           | Tak, zalecane wytyczne   |

Nadpisanie dla konta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reakcje potwierdzające

`channels.whatsapp.ackReaction` wysyła natychmiastową reakcję po odebraniu wiadomości przychodzącej, z uwzględnieniem warunku `reactionLevel` (pomijana, gdy `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // zawsze | wzmianki | nigdy
      },
    },
  },
}
```

Uwagi: wysyłana natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią); jeśli `ackReaction` jest obecne bez `emoji`, WhatsApp używa emoji tożsamości przypisanego agenta, a w razie jego braku „👀” (należy pominąć `ackReaction` lub ustawić `emoji: ""`, aby wyłączyć potwierdzenie); błędy są rejestrowane, ale nie blokują dostarczania odpowiedzi; tryb grupowy `mentions` reaguje tylko na tury wyzwolone wzmianką, natomiast aktywacja grupy `always` pomija to sprawdzenie; WhatsApp używa wyłącznie `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie ma tutaj zastosowania).

## Reakcje stanu cyklu życia

Należy ustawić `messages.statusReactions.enabled: true`, aby WhatsApp zastępował reakcję potwierdzającą podczas tury zamiast pozostawiać statyczne emoji potwierdzenia odbioru, przechodząc kolejno przez stany takie jak oczekiwanie w kolejce, myślenie, aktywność narzędzia, Compaction, ukończenie i błąd:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Uwagi: `channels.whatsapp.ackReaction` nadal steruje kwalifikowaniem wiadomości bezpośrednich i grup; stan oczekiwania w kolejce używa tego samego obowiązującego emoji co zwykłe reakcje potwierdzające; WhatsApp ma jedno miejsce na reakcję bota na wiadomość, dlatego aktualizacje cyklu życia zastępują bieżącą reakcję w miejscu; `messages.removeAckAfterReply: true` usuwa końcową reakcję stanu po skonfigurowanym czasie wyświetlania stanu ukończenia/błędu; kategorie emoji narzędzi obejmują `tool`, `coding`, `web`, `deploy`, `build` i `concierge`.

## Wiele kont i dane uwierzytelniające

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    Identyfikatory kont pochodzą z `channels.whatsapp.accounts`. Domyślnie wybierane jest konto `default`, jeśli istnieje; w przeciwnym razie wybierany jest pierwszy skonfigurowany identyfikator konta (w kolejności alfabetycznej). Identyfikatory kont są wewnętrznie normalizowane na potrzeby wyszukiwania.
  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (kopia zapasowa: `creds.json.bak`)
    - starsze domyślne dane uwierzytelniające w `~/.openclaw/credentials/` są nadal rozpoznawane/migrowane w przepływach dotyczących konta domyślnego

  </Accordion>

  <Accordion title="Działanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` usuwa stan uwierzytelniania WhatsApp dla tego konta. Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny odbiornik tego konta, dzięki czemu połączona sesja przestaje odbierać wiadomości jeszcze przed kolejnym uruchomieniem. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny odbiornik przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania plik `oauth.json` zostaje zachowany, natomiast pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, działania i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje działanie reakcji WhatsApp (`react`).
- Bramki działań: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (istniejące działania mają domyślnie wartość `true`), `channels.whatsapp.actions.calls` (domyślnie `false`, patrz MeowCaller powyżej).
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone; można je wyłączyć za pomocą `channels.whatsapp.configWrites: false`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak połączenia (wymagany kod QR)">
    Objaw: stan kanału informuje o braku połączenia.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Połączono, ale rozłączono / pętla ponownego łączenia">
    Objaw: połączone konto wielokrotnie się rozłącza lub podejmuje próby ponownego połączenia.

    Nieaktywne konta mogą pozostawać połączone po upływie standardowego limitu czasu wiadomości; mechanizm nadzorujący uruchamia je ponownie tylko wtedy, gdy ustanie aktywność transportu WhatsApp Web, gniazdo zostanie zamknięte lub aktywność na poziomie aplikacji pozostanie wyciszona dłużej niż przewiduje rozszerzone okno bezpieczeństwa (patrz Model środowiska uruchomieniowego powyżej).

    Jeśli dzienniki wielokrotnie zawierają `status=408 Request Time-out Connection was lost`, dostosuj czasy gniazda Baileys w `web.whatsapp`. Zacznij od skrócenia `keepAliveIntervalMs` poniżej limitu bezczynności sieci oraz zwiększenia `connectTimeoutMs` w przypadku wolnych lub zawodnych połączeń:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Rozwiązanie:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Jeśli pętla utrzymuje się po naprawieniu łączności hosta i ustawień czasowych, wykonaj kopię zapasową katalogu uwierzytelniania konta i połącz je ponownie:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jeśli `~/.openclaw/logs/whatsapp-health.log` wskazuje `Gateway inactive`, ale zarówno `openclaw gateway status`, jak i `openclaw channels status --probe` wskazują prawidłowy stan, uruchom `openclaw doctor`. W systemie Linux narzędzie doctor ostrzega o starszych wpisach crontab wywołujących wycofany skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te wpisy za pomocą `crontab -e` — cron może nie mieć środowiska magistrali użytkownika systemd, przez co ten stary skrypt błędnie zgłasza stan Gateway.

  </Accordion>

  <Accordion title="Logowanie kodem QR przekracza limit czasu za serwerem proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed wyświetleniem użytecznego kodu QR, zgłaszając `status=408 Request Time-out` lub rozłączenie gniazda TLS.

    Logowanie do WhatsApp Web korzysta ze standardowego środowiska proxy hosta Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty pisane małymi literami, `NO_PROXY`). Sprawdź, czy proces Gateway dziedziczy środowisko proxy oraz czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego odbiornika podczas wysyłania">
    Wysyłanie wiadomości wychodzących szybko kończy się niepowodzeniem, gdy dla konta docelowego nie istnieje aktywny odbiornik Gateway. Sprawdź, czy Gateway działa i czy konto jest połączone.
  </Accordion>

  <Accordion title="Odpowiedź jest widoczna w transkrypcji, ale nie w WhatsApp">
    Wiersze transkrypcji rejestrują treści wygenerowane przez agenta; dostarczenie do WhatsApp jest sprawdzane oddzielnie. OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero wtedy, gdy Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami odbioru wysyłanymi przed odpowiedzią — pomyślna reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została przyjęta. Sprawdź dzienniki Gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź kolejno: `groupPolicy`, `groupAllowFrom`/`allowFrom`, wpisy listy dozwolonych `groups`, bramkowanie wzmianek (`requireMention` + wzorce wzmianek) oraz zduplikowane klucze w `openclaw.json` (w JSON5 późniejsze wpisy zastępują wcześniejsze — zachowaj tylko jeden `groupPolicy` w każdym zakresie).

    Jeśli obecne jest `channels.whatsapp.groups`, WhatsApp nadal może obserwować wiadomości z innych grup, ale OpenClaw odrzuca je przed przekierowaniem do sesji. Dodaj JID grupy do `channels.whatsapp.groups` albo dodaj `groups["*"]`, aby dopuścić wszystkie grupy, pozostawiając autoryzację nadawców pod kontrolą `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Ostrzeżenie dotyczące środowiska Bun">
    Gateway OpenClaw wymaga Node. Bun nie udostępnia interfejsu API `node:sqlite` używanego przez kanoniczny magazyn stanu, a narzędzie doctor migruje starsze usługi Bun do Node.
  </Accordion>
</AccordionGroup>

## Monity systemowe

WhatsApp obsługuje monity systemowe w stylu Telegram dla grup i czatów bezpośrednich za pośrednictwem map `groups` i `direct`.

Rozstrzyganie dla wiadomości grupowych: najpierw określana jest obowiązująca mapa `groups` — jeśli konto w ogóle definiuje własny klucz `groups`, całkowicie zastępuje on główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie monitu odbywa się w tej pojedynczej wynikowej mapie:

1. **Monit właściwy dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy wpis grupy istnieje **i** jego klucz `systemPrompt` jest zdefiniowany. Pusty ciąg (`""`) pomija symbol wieloznaczny i nie stosuje żadnego monitu.
2. **Monit grupowy z symbolem wieloznacznym** (`groups["*"].systemPrompt`): używany, gdy wpis właściwy dla danej grupy nie istnieje lub istnieje bez klucza `systemPrompt`.

Rozstrzyganie dla wiadomości bezpośrednich odbywa się według identycznego wzorca względem mapy `direct` i `direct["*"]`.

<Note>
`dms` pozostaje lekkim kontenerem nadpisywania historii dla poszczególnych wiadomości bezpośrednich (`dms.<id>.historyLimit`). Nadpisania monitów znajdują się w `direct`.
</Note>

<Note>
To zastępowanie ustawień głównych przez konto podczas rozstrzygania monitów jest zwykłym płytkim nadpisaniem: każdy klucz `groups`/`direct` konta, w tym jawnie pusty obiekt, zastępuje główną mapę. Różni się to od opisanego powyżej sprawdzania listy dozwolonego członkostwa w grupach, które w konfiguracji z jednym kontem ma zabezpieczenie na wypadek przypadkowo pustego `groups: {}`.
</Note>

**Różnica względem Telegram:** Telegram pomija główny `groups` dla każdego konta w konfiguracji wielokontowej (nawet dla kont bez własnego `groups`), aby bot nie odbierał wiadomości z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia — główne `groups`/`direct` są dziedziczone przez każde konto bez własnego nadpisania, niezależnie od liczby kont. W wielokontowej konfiguracji WhatsApp należy jawnie zdefiniować pełną mapę dla każdego konta, jeśli monity mają być właściwe dla poszczególnych kont.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji poszczególnych grup, jak i listą grup dozwolonych na poziomie czatu. Zarówno w zakresie głównym, jak i konta, `groups["*"]` oznacza „wszystkie grupy są dozwolone” w tym zakresie.
- Symbol wieloznaczny `systemPrompt` należy dodawać tylko wtedy, gdy dany zakres ma już dopuszczać wszystkie grupy. Aby kwalifikował się wyłącznie stały zestaw identyfikatorów grup, powtórz monit w każdym jawnie dozwolonym wpisie zamiast używać `groups["*"]`.
- Dopuszczanie grup i autoryzacja nadawców są oddzielnymi kontrolami. `groups["*"]` rozszerza zakres grup przekazywanych do obsługi grupowej; nie autoryzuje wszystkich nadawców w tych grupach — pozostaje to pod kontrolą `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` nie ma równoważnego efektu ubocznego dla wiadomości bezpośrednich: `direct["*"]` dostarcza jedynie konfigurację domyślną po uprzednim dopuszczeniu wiadomości bezpośredniej przez `dmPolicy` wraz z `allowFrom` lub regułami magazynu parowania.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone w zakresie głównym.
        // Dotyczy wszystkich kont, które nie definiują własnej mapy grup.
        "*": { systemPrompt: "Domyślny monit dla wszystkich grup." },
      },
      direct: {
        // Dotyczy wszystkich kont, które nie definiują własnej mapy wiadomości bezpośrednich.
        "*": { systemPrompt: "Domyślny monit dla wszystkich czatów bezpośrednich." },
      },
      accounts: {
        work: {
          groups: {
            // To konto definiuje własne grupy, więc grupy główne zostają całkowicie
            // zastąpione. Aby zachować symbol wieloznaczny, jawnie zdefiniuj tutaj również "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Skup się na zarządzaniu projektem.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Domyślny monit dla grup służbowych." },
          },
          direct: {
            // To konto definiuje własną mapę wiadomości bezpośrednich, więc główne wpisy
            // wiadomości bezpośrednich zostają całkowicie zastąpione. Aby zachować symbol
            // wieloznaczny, jawnie zdefiniuj tutaj również "*".
            "+15551234567": { systemPrompt: "Monit dla określonego służbowego czatu bezpośredniego." },
            "*": { systemPrompt: "Domyślny monit dla służbowych czatów bezpośrednich." },
          },
        },
      },
    },
  },
}
```

## Odnośniki do dokumentacji konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji — WhatsApp](/pl/gateway/config-channels#whatsapp)

| Obszar             | Pola                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Dostęp             | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Dostarczanie       | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Wiele kont         | `accounts.<id>.enabled`, `accounts.<id>.authDir` oraz inne nadpisania dla poszczególnych kont                              |
| Operacje           | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Zachowanie sesji   | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Monity             | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
