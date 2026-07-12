---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/webowego lub kierowaniem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, sposób dostarczania i eksploatacja
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T14:50:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do użytku produkcyjnego za pośrednictwem WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami; nie istnieje osobny kanał Twilio WhatsApp.

## Instalacja

`openclaw onboard` i `openclaw channels add --channel whatsapp` wyświetlają monit o zainstalowanie pluginu przy jego pierwszym wyborze; `openclaw channels login --channel whatsapp` oferuje ten sam proces instalacji, jeśli brakuje pluginu. Wersje deweloperskie używają lokalnej ścieżki pluginu; instalacje stabilne/beta najpierw instalują `@openclaw/whatsapp` z ClawHub, a w razie niepowodzenia korzystają z npm. Środowisko uruchomieniowe WhatsApp jest dostarczane poza podstawowym pakietem npm OpenClaw, dlatego jego zależności uruchomieniowe pozostają w zewnętrznym pluginie. Instalacja ręczna:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Używaj samego pakietu npm (`@openclaw/whatsapp`) wyłącznie jako rozwiązania rezerwowego dla rejestru; przypinaj dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

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

    Logowanie odbywa się wyłącznie za pomocą kodu QR. Na hostach zdalnych lub bez interfejsu graficznego przed rozpoczęciem logowania zapewnij niezawodny sposób przekazania aktywnego kodu QR do telefonu; kody QR wyświetlane w terminalu, zrzuty ekranu lub załączniki na czacie mogą wygasnąć podczas przesyłania.

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
Zaleca się używanie osobnego numeru WhatsApp (konfiguracja i metadane są pod tym kątem zoptymalizowane), ale konfiguracje z numerem osobistym i czatem z samym sobą są w pełni obsługiwane.
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

  <Accordion title="Rozwiązanie rezerwowe z numerem osobistym">
    Proces wdrażania obsługuje tryb numeru osobistego i zapisuje konfigurację bazową przyjazną dla czatu z samym sobą: `dmPolicy: "allowlist"`, `allowFrom` zawierające własny numer oraz `selfChatMode: true`. Zabezpieczenia środowiska uruchomieniowego dotyczące czatu z samym sobą opierają się na połączonym własnym numerze oraz `allowFrom`.
  </Accordion>
</AccordionGroup>

## Model środowiska uruchomieniowego

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Mechanizm nadzorujący śledzi niezależnie dwa sygnały: surową aktywność transportu WhatsApp Web oraz aktywność wiadomości aplikacji. Cicha, lecz połączona sesja nie jest ponownie uruchamiana tylko dlatego, że ostatnio nie nadeszła żadna wiadomość; ponowne połączenie jest wymuszane wyłącznie wtedy, gdy ramki transportowe przestają napływać przez stały wewnętrzny okres (niekonfigurowalny przez użytkownika) lub wiadomości aplikacji nie pojawiają się przez okres przekraczający czterokrotność standardowego limitu czasu wiadomości. Bezpośrednio po ponownym połączeniu niedawno aktywnej sesji pierwsze okno używa krótszego, standardowego limitu czasu wiadomości zamiast okna czterokrotnie dłuższego. OpenClaw może automatycznie odpowiadać na wiadomości offline, które Baileys dostarcza na wczesnym etapie tego ponownego połączenia, z ograniczeniem wynikającym z czasu życia deduplikacji identyfikatorów wiadomości przychodzących; początkowe uruchomienie zachowuje krótki mechanizm ochrony przed nieaktualną historią.
- Czasy gniazda Baileys są jawnie określone w `web.whatsapp.*`: `keepAliveIntervalMs` (interwał sygnału ping aplikacji), `connectTimeoutMs` (limit czasu początkowego uzgadniania połączenia), `defaultQueryTimeoutMs` (oczekiwanie na zapytania Baileys oraz limity czasu wysyłania i sygnalizowania obecności przez OpenClaw, a także potwierdzeń odczytu wiadomości przychodzących).
- Wysyłanie wiadomości wychodzących wymaga aktywnego nasłuchiwania WhatsApp dla konta docelowego; w przeciwnym razie wysyłanie natychmiast kończy się niepowodzeniem.
- Wiadomości wysyłane do grup dołączają natywne metadane wzmianek dla tokenów `@+<digits>` i `@<digits>` (w tekście i podpisach multimediów), gdy token odpowiada bieżącym metadanym uczestnika, również w grupach opartych na LID.
- Czaty statusowe i transmisyjne (`@status`, `@broadcast`) są ignorowane.
- Czaty bezpośrednie używają reguł sesji wiadomości prywatnych (`session.dmScope`; domyślna wartość `main` scala wiadomości prywatne z główną sesją agenta). Sesje grupowe są izolowane dla każdego JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanały/biuletyny WhatsApp mogą być jawnymi celami wychodzącymi za pośrednictwem natywnego JID `@newsletter`, przy użyciu metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`) zamiast semantyki wiadomości prywatnych.
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe serwera proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` oraz ich warianty pisane małymi literami). Preferuj konfigurację serwera proxy na poziomie hosta zamiast ustawień poszczególnych kanałów.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw usuwa reakcję potwierdzenia po dostarczeniu widocznej odpowiedzi.

## Zadzwoń do bieżącego nadawcy za pomocą MeowCaller (funkcja eksperymentalna)

Plugin może udostępnić `whatsapp_call` w turach agenta pochodzących z WhatsApp. Używa [MeowCaller](https://github.com/purpshell/meowcaller) do nawiązania połączenia głosowego WhatsApp z bieżącym autoryzowanym nadawcą i odtworzenia wiadomości TTS OpenClaw po odebraniu połączenia. Narzędzie nie ma parametru numeru docelowego, więc polecenie nie może przekierować połączenia. Domyślnie wyłączone.

<Warning>
MeowCaller jest rozwiązaniem eksperymentalnym, nie ma oznaczonego wydania i używa osobno sparowanej sesji połączonego urządzenia whatsmeow — nie może ponownie wykorzystać danych uwierzytelniających Baileys pluginu. Parowanie dodaje kolejne połączone urządzenie do tego samego konta WhatsApp; zeskanuj kod przy użyciu tożsamości używanej przez OpenClaw. Tryb numeru osobistego/czatu z samym sobą nie może dzwonić do samego siebie; użyj dedykowanego numeru OpenClaw, aby zadzwonić na swój numer osobisty.
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

    Gdy ta wartość jest nieobecna lub wynosi `false`, OpenClaw nie udostępnia narzędzia `whatsapp_call`.

  </Step>

  <Step title="Zainstaluj zweryfikowany interfejs CLI MeowCaller">

    Adapter oczekuje pliku wykonywalnego `meowcaller` w zmiennej `PATH` hosta Gateway. Do czasu scalenia [PR MeowCaller nr 7](https://github.com/purpshell/meowcaller/pull/7) zbuduj zweryfikowaną gałąź:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Upewnij się, że `$HOME/.local/bin` znajduje się w zmiennej `PATH` usługi Gateway. Ta rewizja zawiera jawne polecenia `pair` i `notify` służące wyłącznie do wysyłania; `notify` nie otwiera mikrofonu, głośnika, urządzenia wideo ani mechanizmu przechwytywania danych diagnostycznych. Nie zastępuj go poleceniem `play` z przykładowego interfejsu CLI projektu źródłowego.

  </Step>

  <Step title="Sparuj połączone urządzenie MeowCaller">

    Poproś agenta WhatsApp o sprawdzenie konfiguracji połączeń (akcja statusu `whatsapp_call` zgłasza katalog stanu właściwy dla konta i polecenie parowania). Dla konta domyślnego:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Uruchom to interaktywnie, zeskanuj kod QR w **WhatsApp > Linked devices** i poczekaj na komunikat `MeowCaller linked device ready`. Zachowaj prywatność pliku `wa-voip.db` — jest to sesja MeowCaller. Konta inne niż domyślne otrzymują własną ścieżkę magazynu z akcji statusu; w systemie Windows uruchom podane polecenie PowerShell.

  </Step>

  <Step title="Skonfiguruj TTS i zadzwoń z WhatsApp">

    Skonfiguruj [dostawcę TTS](/pl/tools/tts) obsługującego telefonię, uruchom ponownie Gateway, a następnie wyślij prośbę, na przykład `Zadzwoń do mnie i powiedz, że kompilacja została zakończona.` Narzędzie ustala nadawcę na podstawie zaufanego kontekstu przychodzącego, syntetyzuje tymczasowy prywatny plik WAV, uruchamia MeowCaller w ograniczonym przedziale czasu połączenia, a następnie usuwa plik dźwiękowy. OpenClaw jawnie przekazuje magazyn konta, czeka na zerowy kod zakończenia po odebraniu, odtworzeniu i rozłączeniu oraz traktuje przekroczenie limitu czasu lub niezerowy kod zakończenia jako nieudane wywołanie narzędzia.

  </Step>
</Steps>

Ograniczenia: wyłącznie wychodzące połączenia audio jeden-do-jednego, brak dowolnych numerów docelowych, brak współdzielonego uwierzytelniania z połączeniem czatu, brak połączeń do samego siebie w trybie numeru osobistego/czatu z samym sobą, syntetyzowany dźwięk ograniczony do 60 sekund, brak potwierdzenia słyszalności po stronie telefonu poza zakończeniem przez MeowCaller etapów odebrania, odtworzenia i rozłączenia oraz zatrzymanie procesu towarzyszącego przez OpenClaw po ograniczonym okresie 115–175 sekund (obejmującym fazy łączenia, odbierania, odtwarzania i zamykania MeowCaller).

## Monity zatwierdzania

WhatsApp może wyświetlać monity zatwierdzania wykonania i pluginów jako reakcje `👍`/`👎`, sterowane przez konfigurację przekazywania zatwierdzeń najwyższego poziomu:

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

`approvals.exec` i `approvals.plugin` są niezależne; włączenie WhatsApp jako kanału jedynie łączy transport i niczego nie wysyła, chyba że odpowiednia rodzina zatwierdzeń jest włączona i kierowana do tego kanału. Tryb sesji dostarcza natywne zatwierdzenia za pomocą emoji wyłącznie dla zatwierdzeń pochodzących z WhatsApp. Tryb celów używa współdzielonego potoku przekazywania dla jawnych celów i nie tworzy osobnego rozsyłania wiadomości prywatnych do zatwierdzających.

Reakcje zatwierdzające WhatsApp wymagają jawnie określonych zatwierdzających w `allowFrom` (lub `"*"`). `defaultTo` ustawia zwykłe domyślne cele wiadomości, a nie listę zatwierdzających. Ręczne polecenia `/approve` nadal przechodzą standardową ścieżkę autoryzacji nadawcy WhatsApp przed rozstrzygnięciem zatwierdzenia.

## Punkty zaczepienia pluginów i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać treści osobiste, numery telefonów, identyfikatory grup, nazwy nadawców i pola korelacji sesji. WhatsApp nie rozgłasza przychodzących ładunków punktu zaczepienia `message_received` do pluginów, chyba że jawnie wyrazisz na to zgodę:

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

Ogranicz zgodę do jednego konta w `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Włączaj tę opcję tylko dla pluginów, którym ufasz w zakresie dostępu do treści i identyfikatorów przychodzących z WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasady wiadomości prywatnych">
    `channels.whatsapp.dmPolicy`:

    | Wartość | Działanie |
    | --- | --- |
    | `pairing` (domyślnie) | Nieznani nadawcy proszą o sparowanie; właściciel zatwierdza |
    | `allowlist` | Dopuszczani są tylko nadawcy z `allowFrom` |
    | `open` | Wymaga, aby `allowFrom` zawierało `"*"` |
    | `disabled` | Blokuje wszystkie wiadomości prywatne |

    `allowFrom` przyjmuje numery w formacie E.164 (normalizowane wewnętrznie). Jest to wyłącznie lista kontroli dostępu nadawców wiadomości prywatnych — nie ogranicza jawnego wysyłania wiadomości wychodzących do grupowych JID ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `.allowFrom`) ma dla danego konta pierwszeństwo przed wartościami domyślnymi na poziomie kanału.

    Uwagi dotyczące środowiska uruchomieniowego:

    - parowania są utrwalane w magazynie dozwolonych elementów kanału i łączone ze skonfigurowanym `allowFrom`
    - zaplanowane automatyzacje i awaryjny wybór odbiorcy Heartbeat używają jawnych celów dostarczania lub skonfigurowanego `allowFrom`; zatwierdzenia parowania wiadomości prywatnych nie stają się automatycznie odbiorcami Cron/Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, domyślnie dozwolony jest połączony własny numer
    - OpenClaw nigdy nie paruje automatycznie wychodzących wiadomości prywatnych `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Zasady grup i listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych grup** (`channels.whatsapp.groups`): jeśli pominięto `groups`, kwalifikują się wszystkie grupy; jeśli jest obecne, działa jako lista dozwolonych grup (`"*"` dopuszcza wszystkie).
    2. **Zasady nadawców w grupach** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` pomija listę dozwolonych nadawców, `allowlist` wymaga dopasowania do `groupAllowFrom` (lub `*`), a `disabled` blokuje wszystkie przychodzące wiadomości grupowe.

    Jeśli `groupAllowFrom` nie jest ustawione, a `allowFrom` zawiera wpisy, sprawdzanie nadawców korzysta z niego awaryjnie. Listy dozwolonych nadawców są sprawdzane przed aktywacją przez wzmiankę lub odpowiedź.

    Jeśli blok `channels.whatsapp` w ogóle nie istnieje, środowisko uruchomieniowe używa awaryjnie `groupPolicy: "allowlist"` (z ostrzeżeniem w dzienniku), nawet jeśli `channels.defaults.groupPolicy` ma inną wartość.

    <Note>
    Rozpoznawanie członkostwa w grupach ma zabezpieczenie dla pojedynczego konta: jeśli skonfigurowano tylko jedno konto WhatsApp, a jego `accounts.<id>.groups` jest jawnym pustym obiektem (`{}`), jest to traktowane jako „nieustawione” i używana jest główna mapa `channels.whatsapp.groups`, zamiast niejawnie blokować każdą grupę. Gdy skonfigurowano co najmniej 2 konta, jawna pusta mapa konta pozostaje pusta i nie korzysta z wartości głównej — dzięki temu jedno konto może celowo wyłączyć wszystkie grupy bez wpływu na pozostałe konta.
    </Note>

  </Tab>

  <Tab title="Wzmianki i /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki. Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących wiadomości głosowych w autoryzowanych wiadomościach grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi odpowiada tożsamości bota)

    Bezpieczeństwo: cytowanie lub odpowiedź spełnia jedynie warunek wzmianki — **nie** przyznaje nadawcy autoryzacji. Przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych pozostają zablokowani, nawet gdy odpowiadają na wiadomość użytkownika z listy dozwolonych.

    Polecenie aktywacji na poziomie sesji: `/activation mention` lub `/activation always`. Aktualizuje ono stan sesji (nie konfigurację globalną) i jest dostępne tylko dla właściciela.

  </Tab>
</Tabs>

## Skonfigurowane powiązania ACP

WhatsApp obsługuje trwałe powiązania ACP za pomocą `bindings[]` najwyższego poziomu:

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

Czaty bezpośrednie są dopasowywane według numerów E.164, a grupy według identyfikatorów JID grup WhatsApp. Listy dozwolonych grup, zasady nadawców oraz warunki aktywacji przez wzmiankę lub polecenie są stosowane, zanim OpenClaw zapewni istnienie powiązanej sesji ACP. Dopasowane powiązanie przejmuje trasę — grupy rozgłoszeniowe nie rozsyłają tej tury do zwykłych sesji WhatsApp.

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony własny numer znajduje się również w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą: potwierdzenia odczytu są pomijane dla tur takiego czatu, ignorowane jest automatyczne wyzwalanie przez JID wzmianki, które wysyłałoby powiadomienia do samego siebie, a odpowiedzi domyślnie otrzymują prefiks `[{identity.name}]` (lub `[openclaw]`), gdy `messages.responsePrefix` nie jest ustawione.

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta wiadomości przychodzącej i kontekst odpowiedzi">
    Wiadomości przychodzące są opakowywane we wspólną kopertę wiadomości przychodzącej. Cytowana odpowiedź dołącza kontekst w następującej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadane odpowiedzi (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy) są uzupełniane, gdy są dostępne. Jeśli cytowany element docelowy jest plikiem multimedialnym możliwym do pobrania, OpenClaw zapisuje go w standardowym magazynie przychodzących multimediów i udostępnia `MediaPath`/`MediaType`, aby agent mógł sprawdzić go bezpośrednio, zamiast widzieć jedynie `<media:image>`.

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów oraz wyodrębnianie lokalizacji i kontaktów">
    Wiadomości zawierające wyłącznie multimedia są normalizowane do symboli zastępczych: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Autoryzowane grupowe wiadomości głosowe są transkrybowane przed sprawdzeniem wzmianki, gdy treść zawiera wyłącznie `<media:audio>`, dzięki czemu wypowiedzenie wzmianki o bocie w wiadomości głosowej może wyzwolić odpowiedź. Jeśli transkrypcja nadal nie zawiera wzmianki o bocie, trafia do oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treść lokalizacji jest przedstawiana jako zwięzły tekst ze współrzędnymi. Etykiety i komentarze lokalizacji oraz szczegóły kontaktów/vCard są przedstawiane jako wydzielone, niezaufane metadane, a nie tekst wbudowany w prompt.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    Nieprzetworzone wiadomości grupowe są buforowane i wstrzykiwane jako kontekst, gdy bot zostanie ostatecznie wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`, awaryjnie `messages.groupChat.historyLimit`
    - `0` wyłącza tę funkcję

    Znaczniki wstrzykiwania: `[Chat messages since your last reply - for context]` i `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Potwierdzenia odczytu">
    Domyślnie włączone dla zaakceptowanych wiadomości przychodzących. Aby wyłączyć je globalnie:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Ustawienie zastępcze dla konta: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Tury czatu z samym sobą pomijają potwierdzenia odczytu, nawet gdy są one włączone globalnie.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` preferuje granice akapitów (puste wiersze), a następnie korzysta awaryjnie z bezpiecznego dzielenia według długości

  </Accordion>

  <Accordion title="Zachowanie multimediów wychodzących">
    - obsługuje obrazy, filmy, dźwięk (wiadomości głosowe PTT) i dokumenty
    - dźwięk jest wysyłany jako ładunek Baileys `audio` z `ptt: true`, dzięki czemu jest wyświetlany jako wiadomość głosowa „naciśnij, aby mówić”; `audioAsVoice` jest zachowywane w ładunkach odpowiedzi, aby wynik wiadomości głosowej TTS pozostawał na tej ścieżce niezależnie od formatu źródłowego dostawcy
    - natywny dźwięk Ogg/Opus jest wysyłany jako `audio/ogg; codecs=opus`; każdy inny format (w tym wyjście MP3/WebM z Microsoft Edge TTS) jest przed dostarczeniem PTT transkodowany za pomocą `ffmpeg` do jednokanałowego Ogg/Opus 48 kHz
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako pojedynczą wiadomość głosową i blokuje ponowne wysyłanie tej samej odpowiedzi; `/tts chat on|off|default` steruje automatycznym TTS dla bieżącego czatu
    - `gifPlayback: true` przy wysyłaniu filmu włącza odtwarzanie animowanego GIF-a
    - `forceDocument`/`asDocument` kieruje wychodzące obrazy, GIF-y i filmy przez ładunek dokumentu Baileys, aby uniknąć kompresji multimediów przez WhatsApp, zachowując ustaloną nazwę pliku i typ MIME
    - podpisy są stosowane do pierwszego elementu multimedialnego w odpowiedzi zawierającej wiele multimediów, z wyjątkiem wiadomości głosowych PTT: dźwięk jest wysyłany jako pierwszy bez podpisu, a następnie podpis jest wysyłany jako osobna wiadomość tekstowa (klienty WhatsApp nie wyświetlają spójnie podpisów wiadomości głosowych)
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżka lokalna

  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie awaryjne">
    - limit zapisu multimediów przychodzących i wysyłania wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - ustawienie zastępcze dla konta: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru i dobór jakości), aby zmieściły się w limitach, chyba że `forceDocument`/`asDocument` wymaga dostarczenia jako dokument
    - w razie niepowodzenia wysyłania multimediów mechanizm awaryjny dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu pomijać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

`channels.whatsapp.replyToMode` steruje natywnym cytowaniem odpowiedzi (odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą):

| Wartość           | Zachowanie                                                            |
| ----------------- | --------------------------------------------------------------------- |
| `"off"` (domyślnie) | Nigdy nie cytuje; wysyła jako zwykłą wiadomość                        |
| `"first"`         | Cytuje tylko pierwszy fragment odpowiedzi wychodzącej                 |
| `"all"`           | Cytuje każdy fragment odpowiedzi wychodzącej                          |
| `"batched"`       | Cytuje kolejkowane odpowiedzi zbiorcze; odpowiedzi natychmiastowe pozostawia bez cytowania |

Ustawienie zastępcze dla konta: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` określa, jak szeroko agent używa reakcji emoji:

| Poziom                | Reakcje potwierdzające | Reakcje inicjowane przez agenta      |
| --------------------- | ---------------------- | ------------------------------------ |
| `"off"`               | Nie                    | Nie                                  |
| `"ack"`               | Tak                    | Nie                                  |
| `"minimal"` (domyślnie) | Tak                  | Tak, zgodnie z ostrożnymi wytycznymi |
| `"extensive"`         | Tak                    | Tak, zgodnie z zachęcającymi wytycznymi |

Ustawienie zastępcze dla konta: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reakcje potwierdzające

`channels.whatsapp.ackReaction` wysyła natychmiastową reakcję po odebraniu wiadomości przychodzącej, zależnie od `reactionLevel` (pomijana przy `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Uwagi: reakcja jest wysyłana natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią); jeśli `ackReaction` jest obecne bez `emoji`, WhatsApp używa emoji tożsamości przypisanego agenta, a awaryjnie „👀” (pomiń `ackReaction` lub ustaw `emoji: ""`, aby wyłączyć potwierdzenie); błędy są rejestrowane, ale nie blokują dostarczenia odpowiedzi; tryb grupowy `mentions` reaguje tylko na tury wyzwolone wzmianką, natomiast aktywacja grupy `always` pomija to sprawdzenie; WhatsApp używa wyłącznie `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie ma tutaj zastosowania).

## Reakcje stanu cyklu życia

Ustaw `messages.statusReactions.enabled: true`, aby WhatsApp podczas tury zastępował reakcję potwierdzającą zamiast pozostawiać statyczne emoji potwierdzenia odbioru, przechodząc kolejno przez stany takie jak oczekiwanie w kolejce, myślenie, aktywność narzędzi, Compaction, ukończenie i błąd:

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

Uwagi: `channels.whatsapp.ackReaction` nadal określa dostępność dla wiadomości bezpośrednich i grup; stan oczekiwania w kolejce używa tego samego efektywnego emoji co zwykłe reakcje potwierdzające; WhatsApp udostępnia jedno miejsce na reakcję bota dla każdej wiadomości, dlatego aktualizacje cyklu życia zastępują bieżącą reakcję w miejscu; `messages.removeAckAfterReply: true` usuwa końcową reakcję stanu po skonfigurowanym czasie utrzymywania stanu ukończenia/błędu; kategorie emoji narzędzi obejmują `tool`, `coding`, `web`, `deploy`, `build` i `concierge`.

## Wiele kont i dane uwierzytelniające

<AccordionGroup>
  <Accordion title="Wybór konta i ustawienia domyślne">
    Identyfikatory kont pochodzą z `channels.whatsapp.accounts`. Domyślnie wybierane jest konto `default`, jeśli istnieje; w przeciwnym razie wybierany jest pierwszy skonfigurowany identyfikator konta (po sortowaniu alfabetycznym). Identyfikatory kont są wewnętrznie normalizowane na potrzeby wyszukiwania.
  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (kopia zapasowa: `creds.json.bak`)
    - starsze domyślne dane uwierzytelniania w `~/.openclaw/credentials/` są nadal rozpoznawane i migrowane w przepływach konta domyślnego

  </Accordion>

  <Accordion title="Działanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` usuwa stan uwierzytelniania WhatsApp dla tego konta. Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny proces nasłuchujący tego konta, dzięki czemu połączona sesja przestaje odbierać wiadomości jeszcze przed kolejnym uruchomieniem. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny proces nasłuchujący przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania plik `oauth.json` zostaje zachowany, natomiast pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, działania i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje działanie reakcji WhatsApp (`react`).
- Bramki działań: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (istniejące działania mają domyślnie wartość `true`), `channels.whatsapp.actions.calls` (domyślnie `false`; zobacz MeowCaller powyżej).
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone; można je wyłączyć przez `channels.whatsapp.configWrites: false`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak połączenia (wymagany kod QR)">
    Objaw: stan kanału zgłasza brak połączenia.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Połączono, ale rozłączono / pętla ponownego łączenia">
    Objaw: połączone konto jest wielokrotnie rozłączane lub podejmuje powtarzające się próby ponownego połączenia.

    Mało aktywne konta mogą pozostawać połączone po upływie zwykłego limitu czasu wiadomości; mechanizm nadzorujący uruchamia je ponownie tylko wtedy, gdy ustaje aktywność transportu WhatsApp Web, gniazdo zostaje zamknięte albo aktywność na poziomie aplikacji pozostaje bezczynna dłużej niż przewiduje rozszerzony przedział bezpieczeństwa (zobacz Model działania powyżej).

    Jeśli dzienniki wielokrotnie zawierają `status=408 Request Time-out Connection was lost`, dostosuj limity czasowe gniazda Baileys w `web.whatsapp`. Zacznij od ustawienia `keepAliveIntervalMs` poniżej limitu czasu bezczynności sieci oraz zwiększenia `connectTimeoutMs` dla wolnych lub zawodnych połączeń:

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

    Jeśli pętla utrzymuje się po naprawieniu łączności hosta i limitów czasowych, utwórz kopię zapasową katalogu uwierzytelniania konta i połącz je ponownie:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jeśli plik `~/.openclaw/logs/whatsapp-health.log` zawiera komunikat `Gateway inactive`, ale zarówno `openclaw gateway status`, jak i `openclaw channels status --probe` wskazują prawidłowe działanie, uruchom `openclaw doctor`. W systemie Linux narzędzie doctor ostrzega o starszych wpisach crontab wywołujących wycofany skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te wpisy za pomocą `crontab -e` — środowisko Cron może nie zawierać magistrali użytkownika systemd, przez co stary skrypt błędnie zgłasza stan Gateway.

  </Accordion>

  <Accordion title="Logowanie za pomocą kodu QR przekracza limit czasu za serwerem proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed wyświetleniem użytecznego kodu QR, zgłaszając `status=408 Request Time-out` lub rozłączenie gniazda TLS.

    Logowanie do WhatsApp Web korzysta ze standardowego środowiska proxy hosta Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty zapisane małymi literami, `NO_PROXY`). Sprawdź, czy proces Gateway dziedziczy środowisko proxy oraz czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego procesu nasłuchującego podczas wysyłania">
    Wysyłanie wiadomości wychodzących natychmiast kończy się niepowodzeniem, jeśli dla konta docelowego nie istnieje aktywny proces nasłuchujący Gateway. Upewnij się, że Gateway działa, a konto jest połączone.
  </Accordion>

  <Accordion title="Odpowiedź widoczna w transkrypcji, ale nie w WhatsApp">
    Wiersze transkrypcji rejestrują treść wygenerowaną przez agenta; dostarczanie do WhatsApp jest sprawdzane oddzielnie. OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero wtedy, gdy Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami wysyłanymi przed odpowiedzią — pomyślna reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została przyjęta. Sprawdź dzienniki Gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Nieoczekiwane ignorowanie wiadomości grupowych">
    Sprawdź kolejno: `groupPolicy`, `groupAllowFrom`/`allowFrom`, wpisy listy dozwolonych `groups`, bramkowanie wzmianek (`requireMention` wraz ze wzorcami wzmianek) oraz zduplikowane klucze w `openclaw.json` (późniejsze wpisy JSON5 zastępują wcześniejsze — zachowaj tylko jeden klucz `groupPolicy` w każdym zakresie).

    Jeśli występuje `channels.whatsapp.groups`, WhatsApp może nadal odbierać wiadomości z innych grup, ale OpenClaw odrzuca je przed trasowaniem sesji. Dodaj JID grupy do `channels.whatsapp.groups` albo dodaj `groups["*"]`, aby dopuścić wszystkie grupy, zachowując autoryzację nadawców kontrolowaną przez `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Ostrzeżenie dotyczące środowiska Bun">
    Środowisko Gateway dla WhatsApp powinno korzystać z Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway dla WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Monity systemowe

WhatsApp obsługuje monity systemowe w stylu Telegram dla grup i czatów bezpośrednich za pośrednictwem map `groups` i `direct`.

Rozstrzyganie dla wiadomości grupowych: najpierw wyznaczana jest obowiązująca mapa `groups` — jeśli konto w ogóle definiuje własny klucz `groups`, całkowicie zastępuje on główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie monitu odbywa się w tej jednej wynikowej mapie:

1. **Monit właściwy dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy wpis grupy istnieje **i** jego klucz `systemPrompt` jest zdefiniowany. Pusty ciąg (`""`) wyłącza symbol wieloznaczny i nie stosuje żadnego monitu.
2. **Monit grupowy z symbolem wieloznacznym** (`groups["*"].systemPrompt`): używany, gdy nie ma wpisu dla konkretnej grupy lub gdy wpis istnieje bez klucza `systemPrompt`.

Rozstrzyganie dla wiadomości bezpośrednich przebiega według identycznego wzorca względem mapy `direct` i `direct["*"]`.

<Note>
`dms` pozostaje uproszczonym zbiorem ustawień nadpisujących historię poszczególnych wiadomości bezpośrednich (`dms.<id>.historyLimit`). Nadpisania monitów znajdują się w `direct`.
</Note>

<Note>
Zasada zastępowania ustawień głównych przez konto podczas rozstrzygania monitów jest zwykłym płytkim nadpisaniem: każdy klucz `groups`/`direct` konta, w tym jawnie pusty obiekt, zastępuje mapę główną. Różni się to od opisanego powyżej sprawdzania listy dozwolonych grup, które dla pojedynczego konta ma zabezpieczenie na wypadek przypadkowo pustego `groups: {}`.
</Note>

**Różnica względem Telegram:** Telegram pomija główne `groups` dla każdego konta w konfiguracji wielokontowej (nawet dla kont bez własnego `groups`), aby uniemożliwić botowi odbieranie wiadomości z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia — główne `groups`/`direct` są dziedziczone przez każde konto bez własnego nadpisania, niezależnie od liczby kont. W wielokontowej konfiguracji WhatsApp zdefiniuj jawnie pełną mapę dla każdego konta, jeśli chcesz stosować monity właściwe dla poszczególnych kont.

Ważne działanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji poszczególnych grup oraz listą dozwolonych grup na poziomie czatu. Zarówno w zakresie głównym, jak i konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” w tym zakresie.
- Dodawaj `systemPrompt` z symbolem wieloznacznym tylko wtedy, gdy dany zakres ma już dopuszczać wszystkie grupy. Aby zachować dostępność tylko dla ustalonego zbioru identyfikatorów grup, powtórz monit w każdym jawnie dozwolonym wpisie zamiast używać `groups["*"]`.
- Dopuszczenie grupy i autoryzacja nadawcy są oddzielnymi kontrolami. `groups["*"]` rozszerza zbiór grup przekazywanych do obsługi grupowej; nie autoryzuje wszystkich nadawców w tych grupach — nadal kontrolują to `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` nie wywołuje analogicznego skutku ubocznego dla wiadomości bezpośrednich: `direct["*"]` zapewnia jedynie konfigurację domyślną po wcześniejszym dopuszczeniu wiadomości bezpośredniej przez `dmPolicy` wraz z `allowFrom` lub regułami magazynu parowania.

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
            // zastąpione. Aby zachować symbol wieloznaczny, zdefiniuj tutaj jawnie także "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Skup się na zarządzaniu projektem.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Domyślny monit dla grup służbowych." },
          },
          direct: {
            // To konto definiuje własną mapę wiadomości bezpośrednich, więc główne wpisy
            // zostają całkowicie zastąpione. Aby zachować symbol wieloznaczny, zdefiniuj tutaj jawnie także "*".
            "+15551234567": { systemPrompt: "Monit dla konkretnego służbowego czatu bezpośredniego." },
            "*": { systemPrompt: "Domyślny monit dla służbowych czatów bezpośrednich." },
          },
        },
      },
    },
  },
}
```

## Odnośniki do dokumentacji konfiguracji

Główne źródło: [Dokumentacja konfiguracji — WhatsApp](/pl/gateway/config-channels#whatsapp)

| Obszar             | Pola                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Dostęp             | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Dostarczanie       | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Wiele kont         | `accounts.<id>.enabled`, `accounts.<id>.authDir` i inne nadpisania właściwe dla konta                          |
| Działanie          | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Działanie sesji    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Monity             | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Trasowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
