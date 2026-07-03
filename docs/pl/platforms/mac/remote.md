---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania komputerem Mac
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-07-03T23:44:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ten przepływ pozwala aplikacji macOS działać jako pełny pilot zdalnego sterowania dla OpenClaw gateway uruchomionego na innym hoście (komputerze stacjonarnym/serwerze). Aplikacja może łączyć się bezpośrednio z zaufanymi adresami URL Gateway w sieci LAN/Tailnet albo zarządzać tunelem SSH, gdy zdalny Gateway jest dostępny tylko przez loopback. Kontrole kondycji, przekazywanie wybudzania głosem i czat WWW używają tej samej zdalnej konfiguracji z _Ustawienia → Ogólne_.

## Tryby

- **Lokalnie (ten Mac)**: Wszystko działa na laptopie. Bez udziału SSH.
- **Zdalnie przez SSH (domyślnie)**: Polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja na Maca otwiera połączenie SSH z `-o BatchMode`, wybraną tożsamością/kluczem oraz lokalnym przekierowaniem portu.
- **Zdalnie bezpośrednio (ws/wss)**: Bez tunelu SSH. Aplikacja na Maca łączy się bezpośrednio z adresem URL Gateway (na przykład przez LAN, Tailscale, Tailscale Serve albo publiczny odwrotny serwer proxy HTTPS).

## Transporty zdalne

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): Używa `ssh -N -L ...`, aby przekierować port Gateway na localhost. Gateway zobaczy IP Node jako `127.0.0.1`, ponieważ tunel używa loopback.
- **Bezpośrednio (ws/wss)**: Łączy się prosto z adresem URL Gateway. Gateway widzi rzeczywisty adres IP klienta.

Aplikacja wyłącza multipleksowanie połączeń SSH i przechodzenie w tło po uwierzytelnieniu dla należących do aplikacji procesów SSH, aby mogła monitorować i restartować dokładnie ten proces, nawet gdy wybrany alias włącza `ControlMaster` lub `ForkAfterAuthentication`.

Weryfikacja klucza hosta SSH jest domyślnie rygorystyczna, ponieważ poświadczenia Gateway przechodzą przez ten tunel. Dla zarządzanego aliasu SSH, którego zachowania zaufania chcesz jawnie używać, włącz to przez `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` albo ustaw `gateway.remote.sshHostKeyPolicy` na `"openssh"`. To jawne włączenie używa efektywnej polityki kluczy hosta OpenSSH; najpierw sprawdź alias oraz każdą pasującą konfigurację `Host *` lub systemową. Zmiana celu SSH w aplikacji albo przez `configure-remote` resetuje politykę do `strict`, chyba że jawnie włączysz ją ponownie.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja utrzymuje `gateway.remote.url` na lokalnym
punkcie końcowym tunelu, na przykład `ws://127.0.0.1:18789`, dzięki czemu CLI, czat WWW i
lokalna usługa hosta Node używają tego samego bezpiecznego transportu loopback.
Gdy wykrywanie zwraca zarówno surowe adresy IP Tailnet, jak i stabilne nazwy hostów, aplikacja
preferuje nazwy Tailscale MagicDNS lub LAN, aby zdalne połączenia lepiej przetrwały
zmiany adresów.
Jeśli lokalny port tunelu różni się od zdalnego portu Gateway, ustaw
`gateway.remote.remotePort` na port na zdalnym hoście.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta Node CLI, a nie do
natywnego Node aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta Node, gdy
to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją przez
`openclaw node install ...` i `openclaw node start` (albo uruchom
`openclaw node run ...` na pierwszym planie), a następnie wybierz ten Node obsługujący
przeglądarkę jako cel.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest w PATH dla powłok nieinteraktywnych (w razie potrzeby utwórz dowiązanie symboliczne w `/usr/local/bin` lub `/opt/homebrew/bin`).
3. Tylko dla transportu SSH: otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej osiągalności poza LAN.

## Konfiguracja aplikacji macOS

Aby wstępnie skonfigurować aplikację bez przepływu powitalnego:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dla Gateway już osiągalnego w zaufanej sieci LAN lub Tailnet całkowicie pomiń SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

To zapisuje zdalną konfigurację, oznacza wdrażanie jako ukończone i pozwala aplikacji zarządzać
wybranym transportem po uruchomieniu.

1. Otwórz _Ustawienia → Ogólne_.
2. W sekcji **OpenClaw działa** wybierz **Zdalnie** i ustaw:
   - **Transport**: **Tunel SSH** albo **Bezpośrednio (ws/wss)**.
   - **Cel SSH**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway jest w tej samej sieci LAN i rozgłasza się przez Bonjour, wybierz go z wykrytej listy, aby automatycznie uzupełnić to pole.
   - **Adres URL Gateway** (tylko Bezpośrednio): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Plik tożsamości** (zaawansowane): ścieżka do klucza.
   - **Katalog główny projektu** (zaawansowane): ścieżka do zdalnego checkoutu używana dla poleceń.
   - **Ścieżka CLI** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (uzupełniana automatycznie, gdy jest rozgłaszana).
3. Naciśnij **Testuj zdalne**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Awarie zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie znaleziono zdalnie.
4. Kontrole kondycji i czat WWW będą teraz automatycznie działać przez wybrany transport.

## Czat WWW

- **Tunel SSH**: Czat WWW łączy się z Gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Bezpośrednio (ws/wss)**: Czat WWW łączy się prosto ze skonfigurowanym adresem URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zgód TCC co lokalny (Automatyzacja, Dostępność, Nagrywanie ekranu, Mikrofon, Rozpoznawanie mowy, Powiadomienia). Uruchom wdrażanie na tej maszynie, aby przyznać je raz.
- Node rozgłaszają swój stan uprawnień przez `node.list` / `node.describe`, dzięki czemu agenci wiedzą, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj wiązania loopback na zdalnym hoście i łącz się przez SSH, Tailscale Serve albo zaufany bezpośredni adres URL Tailnet/LAN.
- Tunelowanie SSH domyślnie wymaga już zaufanego klucza hosta. Najpierw zaufaj kluczowi hosta, aby istniał w skonfigurowanym pliku known-hosts, albo jawnie wybierz `gateway.remote.sshHostKeyPolicy: "openssh"` dla zarządzanego aliasu, którego politykę zaufania OpenSSH akceptujesz.
- Jeśli wiążesz Gateway z interfejsem innym niż loopback, wymagaj poprawnego uwierzytelniania Gateway: tokenu, hasła albo odwrotnego serwera proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalny)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR przez WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnienie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **kod wyjścia 127 / nie znaleziono**: `openclaw` nie jest w PATH dla powłok bez logowania. Dodaj go do `/etc/paths`, pliku rc powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda kondycji nie powiodła się**: sprawdź osiągalność SSH, PATH oraz to, czy Baileys jest zalogowany (`openclaw status --json`).
- **Czat WWW zablokowany**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port pasuje do portu WS Gateway; interfejs wymaga zdrowego połączenia WS.
- **IP Node pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Bezpośrednio (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.
- **Dashboard działa, ale możliwości Maca są offline**: oznacza to, że połączenie operatora/sterowania aplikacji jest zdrowe, ale połączenie towarzyszącego Node nie jest połączone albo brakuje mu powierzchni poleceń. Otwórz sekcję urządzenia na pasku menu i sprawdź, czy Mac ma stan `paired · disconnected`. Dla punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa nieaktualne starsze przypięcia liścia TLS po rotacji certyfikatu, czyści nieaktualne przypięcie, gdy macOS ufa nowemu certyfikatowi, i automatycznie ponawia próbę. Jeśli certyfikat nie jest zaufany przez system albo host nie jest nazwą Tailscale Serve, ustaw `gateway.remote.tlsFingerprint` na oczekiwany odcisk certyfikatu, sprawdź certyfikat albo przełącz na **Zdalnie przez SSH**.
- **Wybudzanie głosem**: frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; osobny mechanizm przekazujący nie jest potrzebny.

## Dźwięki powiadomień

Wybieraj dźwięki dla poszczególnych powiadomień ze skryptów za pomocą `openclaw` i `node.invoke`, np.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „domyślny dźwięk”; wywołujący wybierają dźwięk (albo jego brak) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Zdalny dostęp](/pl/gateway/remote)
