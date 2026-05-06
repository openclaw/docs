---
read_when:
    - Dodawanie funkcji, które rozszerzają dostęp lub automatyzację
summary: Kwestie bezpieczeństwa i model zagrożeń przy uruchamianiu Gateway AI z dostępem do powłoki
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-06T09:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8706977504b52a225c08deadeddb60ac6791933297637d41885d0b859ca28406
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model zaufania osobistego asystenta.** Te wytyczne zakładają jedną zaufaną
  granicę operatora na Gateway (model jednego użytkownika, osobistego asystenta).
  OpenClaw **nie** jest wrogą wielodzierżawną granicą bezpieczeństwa dla wielu
  antagonistycznych użytkowników współdzielących jednego agenta lub Gateway. Jeśli potrzebujesz działania z mieszanym zaufaniem albo
  antagonistycznymi użytkownikami, rozdziel granice zaufania (osobny Gateway +
  poświadczenia, najlepiej osobni użytkownicy OS albo hosty).
</Warning>

## Najpierw zakres: model bezpieczeństwa osobistego asystenta

Wytyczne bezpieczeństwa OpenClaw zakładają wdrożenie **osobistego asystenta**: jedną zaufaną granicę operatora, potencjalnie wielu agentów.

- Obsługiwana postawa bezpieczeństwa: jeden użytkownik/granica zaufania na Gateway (preferuj jednego użytkownika OS/host/VPS na granicę).
- Nieobsługiwana granica bezpieczeństwa: jeden współdzielony Gateway/agent używany przez wzajemnie niezaufanych lub antagonistycznych użytkowników.
- Jeśli wymagana jest izolacja antagonistycznych użytkowników, rozdziel według granicy zaufania (osobny Gateway + poświadczenia, a najlepiej osobni użytkownicy/hosty OS).
- Jeśli wielu niezaufanych użytkowników może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, traktuj ich tak, jakby współdzielili te same delegowane uprawnienia narzędzi dla tego agenta.

Ta strona wyjaśnia utwardzanie **w ramach tego modelu**. Nie deklaruje wrogiej izolacji wielodzierżawnej na jednym współdzielonym Gateway.

## Szybka kontrola: `openclaw security audit`

Zobacz też: [Formalna weryfikacja (modele bezpieczeństwa)](/pl/security/formal-verification)

Uruchamiaj to regularnie (zwłaszcza po zmianie konfiguracji albo wystawieniu powierzchni sieciowych):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` jest celowo wąskie: przełącza typowe otwarte zasady grup
na listy dozwolonych, przywraca `logging.redactSensitive: "tools"`, zaostrza
uprawnienia stanu/konfiguracji/plików dołączanych i używa resetów ACL Windows zamiast
POSIX `chmod`, gdy działa w Windows.

Oznacza typowe pułapki (ekspozycję uwierzytelniania Gateway, ekspozycję sterowania przeglądarką, podwyższone listy dozwolonych, uprawnienia systemu plików, permisywne zatwierdzenia exec i ekspozycję narzędzi w otwartym kanale).

OpenClaw jest zarówno produktem, jak i eksperymentem: podłączasz zachowanie modeli frontier do rzeczywistych powierzchni komunikatorów i rzeczywistych narzędzi. **Nie istnieje „idealnie bezpieczna” konfiguracja.** Celem jest świadome podejście do tego:

- kto może rozmawiać z twoim botem
- gdzie bot może działać
- czego bot może dotykać

Zacznij od najmniejszego dostępu, który nadal działa, a potem rozszerzaj go wraz ze wzrostem zaufania.

### Wdrożenie i zaufanie do hosta

OpenClaw zakłada, że host i granica konfiguracji są zaufane:

- Jeśli ktoś może modyfikować stan/konfigurację hosta Gateway (`~/.openclaw`, w tym `openclaw.json`), traktuj tę osobę jako zaufanego operatora.
- Uruchamianie jednego Gateway dla wielu wzajemnie niezaufanych/antagonistycznych operatorów **nie jest zalecaną konfiguracją**.
- Dla zespołów o mieszanym zaufaniu rozdziel granice zaufania za pomocą osobnych Gateway (albo co najmniej osobnych użytkowników/hostów OS).
- Zalecane ustawienie domyślne: jeden użytkownik na maszynę/host (albo VPS), jeden Gateway dla tego użytkownika oraz jeden lub więcej agentów w tym Gateway.
- W jednej instancji Gateway uwierzytelniony dostęp operatora jest zaufaną rolą płaszczyzny sterowania, a nie rolą dzierżawcy na użytkownika.
- Identyfikatory sesji (`sessionKey`, identyfikatory sesji, etykiety) są selektorami routingu, a nie tokenami autoryzacji.
- Jeśli kilka osób może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, każda z nich może sterować tym samym zestawem uprawnień. Izolacja sesji/pamięci na użytkownika pomaga w prywatności, ale nie zamienia współdzielonego agenta w autoryzację hosta na użytkownika.

### Bezpieczne operacje na plikach

OpenClaw używa `@openclaw/fs-safe` do ograniczonego do katalogu głównego dostępu do plików, atomowych zapisów, rozpakowywania archiwów, tymczasowych przestrzeni roboczych i pomocników plików sekretów. OpenClaw domyślnie wyłącza opcjonalnego pomocnika POSIX Python w fs-safe; ustaw `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` lub `require` tylko wtedy, gdy chcesz dodatkowego utwardzenia mutacji względem fd i możesz obsłużyć środowisko uruchomieniowe Python.

Szczegóły: [Bezpieczne operacje na plikach](/pl/gateway/security/secure-file-operations).

### Współdzielona przestrzeń robocza Slack: realne ryzyko

Jeśli „wszyscy w Slack mogą wysyłać wiadomości do bota”, głównym ryzykiem są delegowane uprawnienia narzędzi:

- każdy dozwolony nadawca może wywoływać narzędzia (`exec`, przeglądarka, narzędzia sieciowe/plikowe) w ramach zasad agenta;
- wstrzyknięcie promptu/treści od jednego nadawcy może spowodować działania wpływające na współdzielony stan, urządzenia lub wyniki;
- jeśli jeden współdzielony agent ma wrażliwe poświadczenia/pliki, każdy dozwolony nadawca może potencjalnie doprowadzić do eksfiltracji przez użycie narzędzi.

Używaj osobnych agentów/Gateway z minimalnymi narzędziami dla przepływów pracy zespołu; agentów z danymi osobistymi trzymaj prywatnie.

### Agent współdzielony w firmie: akceptowalny wzorzec

Jest to akceptowalne, gdy wszyscy używający tego agenta znajdują się w tej samej granicy zaufania (na przykład jeden zespół firmowy), a agent jest ściśle ograniczony do spraw biznesowych.

- uruchamiaj go na dedykowanej maszynie/VM/kontenerze;
- używaj dedykowanego użytkownika OS + dedykowanej przeglądarki/profilu/kont dla tego środowiska uruchomieniowego;
- nie loguj tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili menedżera haseł/przeglądarki.

Jeśli mieszasz tożsamości osobiste i firmowe w tym samym środowisku uruchomieniowym, znosisz separację i zwiększasz ryzyko ekspozycji danych osobistych.

## Koncepcja zaufania Gateway i Node

Traktuj Gateway i Node jako jedną domenę zaufania operatora, z różnymi rolami:

- **Gateway** to płaszczyzna sterowania i powierzchnia zasad (`gateway.auth`, zasady narzędzi, routing).
- **Node** to powierzchnia zdalnego wykonywania sparowana z tym Gateway (polecenia, działania urządzenia, lokalne możliwości hosta).
- Wywołujący uwierzytelniony w Gateway jest zaufany w zakresie Gateway. Po sparowaniu działania Node są zaufanymi działaniami operatora na tym Node.
- Poziomy zakresu operatora i kontrole w czasie zatwierdzania są podsumowane w
  [Zakresach operatora](/pl/gateway/operator-scopes).
- Bezpośredni klienci backendowi local loopback uwierzytelnieni współdzielonym
  tokenem/hasłem Gateway mogą wykonywać wewnętrzne RPC płaszczyzny sterowania bez przedstawiania tożsamości
  urządzenia użytkownika. Nie jest to obejście zdalnego parowania ani parowania przeglądarki: klienci sieciowi,
  klienci Node, klienci z tokenem urządzenia i jawne tożsamości urządzeń
  nadal przechodzą przez parowanie i egzekwowanie podniesienia zakresu.
- `sessionKey` służy do wyboru routingu/kontekstu, a nie do uwierzytelniania na użytkownika.
- Zatwierdzenia exec (lista dozwolonych + pytanie) są zabezpieczeniami intencji operatora, a nie wrogą izolacją wielodzierżawną.
- Domyślnym ustawieniem produktu OpenClaw dla zaufanych konfiguracji z jednym operatorem jest to, że host exec na `gateway`/`node` jest dozwolony bez monitów o zatwierdzenie (`security="full"`, `ask="off"`, chyba że to zaostrzysz). To ustawienie domyślne jest celowym UX, a nie samo w sobie podatnością.
- Zatwierdzenia exec wiążą dokładny kontekst żądania i najlepszym wysiłkiem bezpośrednie lokalne operandy plikowe; nie modelują semantycznie każdej ścieżki ładowania środowiska uruchomieniowego/interpretera. Używaj sandboxingu i izolacji hosta do silnych granic.

Jeśli potrzebujesz izolacji wrogich użytkowników, rozdziel granice zaufania według użytkownika/hosta OS i uruchamiaj osobne Gateway.

## Macierz granic zaufania

Używaj tego jako szybkiego modelu podczas triage ryzyka:

| Granica lub kontrola                                      | Co to oznacza                                     | Typowa błędna interpretacja                                                    |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/hasło/zaufany proxy/uwierzytelnianie urządzenia) | Uwierzytelnia wywołujących do API Gateway         | „Aby było bezpiecznie, każda ramka wymaga podpisów na wiadomość”              |
| `sessionKey`                                              | Klucz routingu do wyboru kontekstu/sesji          | „Klucz sesji jest granicą uwierzytelniania użytkownika”                       |
| Zabezpieczenia promptu/treści                             | Zmniejszają ryzyko nadużycia modelu               | „Samo wstrzyknięcie promptu dowodzi obejścia uwierzytelniania”                |
| `canvas.eval` / browser evaluate                          | Zamierzona możliwość operatora, gdy włączona      | „Każdy prymityw JS eval automatycznie jest podatnością w tym modelu zaufania” |
| Lokalna powłoka TUI `!`                                   | Jawne lokalne wykonanie uruchamiane przez operatora | „Wygodne polecenie lokalnej powłoki to zdalne wstrzyknięcie”                  |
| Parowanie Node i polecenia Node                           | Zdalne wykonanie na poziomie operatora na sparowanych urządzeniach | „Zdalne sterowanie urządzeniem domyślnie należy traktować jako dostęp niezaufanego użytkownika” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opcjonalna zasada rejestracji Node w zaufanej sieci | „Domyślnie wyłączona lista dozwolonych to automatyczna podatność parowania”   |

## Nie są podatnościami z założenia

<Accordion title="Typowe zgłoszenia poza zakresem">

Te wzorce są często zgłaszane i zwykle zamykane bez działania, chyba że
wykazano rzeczywiste obejście granicy:

- Łańcuchy oparte wyłącznie na wstrzyknięciu promptu bez obejścia zasad, uwierzytelniania lub sandboxu.
- Twierdzenia zakładające wrogie działanie wielodzierżawne na jednym współdzielonym hoście albo
  konfiguracji.
- Twierdzenia klasyfikujące normalny dostęp operatora ścieżką odczytu (na przykład
  `sessions.list` / `sessions.preview` / `chat.history`) jako IDOR w
  konfiguracji współdzielonego Gateway.
- Zgłoszenia dotyczące wdrożeń tylko na localhost (na przykład HSTS na Gateway
  wyłącznie loopback).
- Zgłoszenia podpisu przychodzącego Webhook Discord dla ścieżek przychodzących, które nie
  istnieją w tym repozytorium.
- Zgłoszenia traktujące metadane parowania Node jako ukrytą drugą warstwę
  zatwierdzania na polecenie dla `system.run`, gdy rzeczywistą granicą wykonywania nadal
  jest globalna zasada poleceń Node w Gateway plus własne zatwierdzenia exec
  Node.
- Zgłoszenia traktujące skonfigurowane `gateway.nodes.pairing.autoApproveCidrs` jako
  podatność samą w sobie. To ustawienie jest domyślnie wyłączone, wymaga
  jawnych wpisów CIDR/IP, dotyczy tylko pierwszego parowania `role: node` bez
  żądanych zakresów i nie zatwierdza automatycznie operatora/przeglądarki/Control UI,
  WebChat, podniesień ról, podniesień zakresów, zmian metadanych, zmian klucza publicznego
  ani ścieżek nagłówka zaufanego proxy samego hosta przez loopback, chyba że uwierzytelnianie zaufanego proxy przez loopback zostało jawnie włączone.
- Zgłoszenia „brakującej autoryzacji na użytkownika”, które traktują `sessionKey` jako
  token uwierzytelniania.

</Accordion>

## Utwardzona baza w 60 sekund

Najpierw użyj tej bazy, a potem selektywnie ponownie włączaj narzędzia dla zaufanego agenta:

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

Dzięki temu Gateway pozostaje tylko lokalny, DM są izolowane, a narzędzia płaszczyzny sterowania/środowiska uruchomieniowego są domyślnie wyłączone.

## Szybka reguła dla współdzielonej skrzynki odbiorczej

Jeśli więcej niż jedna osoba może wysłać DM do twojego bota:

- Ustaw `session.dmScope: "per-channel-peer"` (albo `"per-account-channel-peer"` dla kanałów z wieloma kontami).
- Zachowaj `dmPolicy: "pairing"` albo ścisłe listy dozwolonych.
- Nigdy nie łącz współdzielonych DM z szerokim dostępem do narzędzi.
- Utwardza to kooperacyjne/współdzielone skrzynki odbiorcze, ale nie jest zaprojektowane jako wroga izolacja współdzierżawców, gdy użytkownicy współdzielą dostęp zapisu do hosta/konfiguracji.

## Model widoczności kontekstu

OpenClaw rozdziela dwa pojęcia:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`dmPolicy`, `groupPolicy`, listy dozwolonych, bramki wzmianki).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do wejścia modelu (treść odpowiedzi, cytowany tekst, historia wątku, przekazane metadane).

Listy dozwolonych bramkują wyzwalacze i autoryzację poleceń. Ustawienie `contextVisibility` kontroluje, jak filtrowany jest dodatkowy kontekst (cytowane odpowiedzi, korzenie wątków, pobrana historia):

- `contextVisibility: "all"` (domyślne) zachowuje dodatkowy kontekst w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dopuszczonych przez aktywne sprawdzenia listy dozwolonych.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną wyraźnie zacytowaną odpowiedź.

Ustaw `contextVisibility` dla kanału albo dla pokoju/konwersacji. Szczegóły konfiguracji znajdziesz w sekcji [Czaty grupowe](/pl/channels/groups#context-visibility-and-allowlists).

Wytyczne triage'u zgłoszeń doradczych:

- Twierdzenia, które pokazują tylko, że „model może widzieć cytowany lub historyczny tekst od nadawców spoza listy dozwolonych”, są ustaleniami dotyczącymi utwardzania możliwymi do obsłużenia przez `contextVisibility`, a nie same w sobie obejściami granicy uwierzytelniania lub sandboxa.
- Aby raporty miały wpływ na bezpieczeństwo, nadal muszą pokazać obejście granicy zaufania (uwierzytelniania, polityki, sandboxa, zatwierdzania albo innej udokumentowanej granicy).

## Co sprawdza audyt (wysoki poziom)

- **Dostęp przychodzący** (polityki wiadomości prywatnych, polityki grup, listy dozwolonych): czy obce osoby mogą uruchomić bota?
- **Zasięg narzędzi** (narzędzia podwyższone + otwarte pokoje): czy prompt injection mogłoby przełożyć się na działania powłoki/plików/sieci?
- **Dryf zatwierdzania exec** (`security=full`, `autoAllowSkills`, listy dozwolonych interpreterów bez `strictInlineEval`): czy zabezpieczenia host-exec nadal robią to, czego oczekujesz?
  - `security="full"` jest szerokim ostrzeżeniem o postawie bezpieczeństwa, a nie dowodem błędu. To wybrana wartość domyślna dla zaufanych konfiguracji osobistego asystenta; zaostrz ją tylko wtedy, gdy Twój model zagrożeń wymaga zatwierdzania lub zabezpieczeń opartych na liście dozwolonych.
- **Ekspozycja sieciowa** (wiązanie/uwierzytelnianie Gateway, Tailscale Serve/Funnel, słabe/krótkie tokeny uwierzytelniania).
- **Ekspozycja sterowania przeglądarką** (zdalne węzły, porty przekaźnika, zdalne punkty końcowe CDP).
- **Higiena dysku lokalnego** (uprawnienia, dowiązania symboliczne, dołączenia konfiguracji, ścieżki „synchronizowanych folderów”).
- **Pluginy** (pluginy ładują się bez jawnej listy dozwolonych).
- **Dryf polityki/błędna konfiguracja** (ustawienia dockera sandboxa skonfigurowane, ale tryb sandboxa wyłączony; nieskuteczne wzorce `gateway.nodes.denyCommands`, ponieważ dopasowanie odbywa się wyłącznie po dokładnej nazwie polecenia (na przykład `system.run`) i nie analizuje tekstu powłoki; niebezpieczne wpisy `gateway.nodes.allowCommands`; globalne `tools.profile="minimal"` nadpisane przez profile poszczególnych agentów; narzędzia należące do pluginów osiągalne przy liberalnej polityce narzędzi).
- **Dryf oczekiwań środowiska uruchomieniowego** (na przykład założenie, że niejawny exec nadal oznacza `sandbox`, gdy `tools.exec.host` ma teraz domyślnie wartość `auto`, albo jawne ustawienie `tools.exec.host="sandbox"` przy wyłączonym trybie sandboxa).
- **Higiena modelu** (ostrzeganie, gdy skonfigurowane modele wyglądają na przestarzałe; nie jest to twarda blokada).

Jeśli uruchomisz `--deep`, OpenClaw spróbuje też wykonać najlepsze możliwe sprawdzenie Gateway na żywo.

## Mapa przechowywania poświadczeń

Użyj tego podczas audytu dostępu albo decydowania, co uwzględnić w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env albo `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: konfiguracja/env albo SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolonych parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Stan środowiska uruchomieniowego Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Ładunek sekretów oparty na pliku (opcjonalny)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`

## Lista kontrolna audytu bezpieczeństwa

Gdy audyt drukuje ustalenia, traktuj to jako kolejność priorytetów:

1. **Cokolwiek „otwarte” + włączone narzędzia**: najpierw zablokuj wiadomości prywatne/grupy (parowanie/listy dozwolonych), potem zaostrz politykę narzędzi/sandboxing.
2. **Publiczna ekspozycja sieciowa** (wiązanie LAN, Funnel, brak uwierzytelniania): napraw natychmiast.
3. **Zdalna ekspozycja sterowania przeglądarką**: traktuj ją jak dostęp operatora (tylko tailnet, paruj węzły celowo, unikaj ekspozycji publicznej).
4. **Uprawnienia**: upewnij się, że stan/konfiguracja/poświadczenia/uwierzytelnianie nie są czytelne dla grupy/świata.
5. **Pluginy**: ładuj tylko to, czemu jawnie ufasz.
6. **Wybór modelu**: preferuj nowoczesne modele odporne na instrukcje dla każdego bota z narzędziami.

## Glosariusz audytu bezpieczeństwa

Każde ustalenie audytu jest oznaczone ustrukturyzowanym `checkId` (na przykład
`gateway.bind_no_auth` albo `tools.exec.security_full_configured`). Typowe
klasy wagi krytycznej:

- `fs.*` - uprawnienia systemu plików dla stanu, konfiguracji, poświadczeń, profili uwierzytelniania.
- `gateway.*` - tryb wiązania, uwierzytelnianie, Tailscale, Control UI, konfiguracja trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - utwardzanie według powierzchni.
- `plugins.*`, `skills.*` - łańcuch dostaw pluginów/skillów i ustalenia skanowania.
- `security.exposure.*` - przekrojowe sprawdzenia, w których polityka dostępu spotyka się z zasięgiem narzędzi.

Pełny katalog z poziomami wagi, kluczami napraw i obsługą automatycznej naprawy znajdziesz w
[Sprawdzeniach audytu bezpieczeństwa](/pl/gateway/security/audit-checks).

## Control UI przez HTTP

Control UI potrzebuje **bezpiecznego kontekstu** (HTTPS albo localhost), aby wygenerować tożsamość
urządzenia. `gateway.controlUi.allowInsecureAuth` to lokalny przełącznik zgodności:

- Na localhost pozwala na uwierzytelnianie Control UI bez tożsamości urządzenia, gdy strona
  jest ładowana przez niezabezpieczony HTTP.
- Nie omija sprawdzeń parowania.
- Nie rozluźnia wymagań tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

Preferuj HTTPS (Tailscale Serve) albo otwieraj UI na `127.0.0.1`.

Tylko w scenariuszach awaryjnych `gateway.controlUi.dangerouslyDisableDeviceAuth`
całkowicie wyłącza sprawdzenia tożsamości urządzenia. To poważne obniżenie bezpieczeństwa;
pozostaw je wyłączone, chyba że aktywnie debugujesz i możesz szybko cofnąć zmianę.

Niezależnie od tych niebezpiecznych flag, udane `gateway.auth.mode: "trusted-proxy"`
może dopuszczać sesje Control UI **operatora** bez tożsamości urządzenia. Jest to
zamierzone zachowanie trybu uwierzytelniania, a nie skrót `allowInsecureAuth`, i nadal
nie rozszerza się na sesje Control UI w roli węzła.

`openclaw security audit` ostrzega, gdy to ustawienie jest włączone.

## Podsumowanie niebezpiecznych lub niezabezpieczonych flag

`openclaw security audit` zgłasza `config.insecure_or_dangerous_flags`, gdy
znane niezabezpieczone/niebezpieczne przełączniki debugowania są włączone. Pozostaw je nieustawione w
produkcji.

<AccordionGroup>
  <Accordion title="Flagi śledzone obecnie przez audyt">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Wszystkie klucze `dangerous*` / `dangerously*` w schemacie konfiguracji">
    Control UI i przeglądarka:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Dopasowywanie nazw kanałów (kanały w pakiecie i kanały pluginów; dostępne także dla
    `accounts.<accountId>` tam, gdzie ma to zastosowanie):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (kanał pluginu)
    - `channels.zalouser.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.irc.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.mattermost.dangerouslyAllowNameMatching` (kanał pluginu)

    Ekspozycja sieciowa:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (także dla konta)

    Sandbox Docker (wartości domyślne + według agenta):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Konfiguracja reverse proxy

Jeśli uruchamiasz Gateway za reverse proxy (nginx, Caddy, Traefik itd.), skonfiguruj
`gateway.trustedProxies`, aby poprawnie obsługiwać przekazany adres IP klienta.

Gdy Gateway wykryje nagłówki proxy z adresu, który **nie** znajduje się w `trustedProxies`, **nie** będzie traktować połączeń jako klientów lokalnych. Jeśli uwierzytelnianie Gateway jest wyłączone, takie połączenia są odrzucane. Zapobiega to obejściu uwierzytelniania, w którym połączenia przez proxy w przeciwnym razie wyglądałyby, jakby pochodziły z localhost, i otrzymywały automatyczne zaufanie.

`gateway.trustedProxies` zasila także `gateway.auth.mode: "trusted-proxy"`, ale ten tryb uwierzytelniania jest bardziej rygorystyczny:

- uwierzytelnianie trusted-proxy domyślnie **zamyka się bezpiecznie dla proxy pochodzących z loopback**
- reverse proxy loopback na tym samym hoście mogą używać `gateway.trustedProxies` do wykrywania klientów lokalnych i obsługi przekazanych adresów IP
- reverse proxy loopback na tym samym hoście mogą spełnić `gateway.auth.mode: "trusted-proxy"` tylko wtedy, gdy `gateway.auth.trustedProxy.allowLoopback = true`; w przeciwnym razie użyj uwierzytelniania tokenem/hasłem

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

Gdy `trustedProxies` jest skonfigurowane, Gateway używa `X-Forwarded-For`, aby określić adres IP klienta. `X-Real-IP` jest domyślnie ignorowany, chyba że jawnie ustawiono `gateway.allowRealIpFallback: true`.

Nagłówki zaufanego proxy nie sprawiają, że parowanie urządzenia węzła automatycznie staje się zaufane.
`gateway.nodes.pairing.autoApproveCidrs` to osobna, domyślnie wyłączona
polityka operatora. Nawet gdy jest włączona, ścieżki nagłówków trusted-proxy pochodzące z loopback
są wykluczone z automatycznego zatwierdzania węzłów, ponieważ lokalni wywołujący mogą fałszować te
nagłówki, także wtedy, gdy uwierzytelnianie loopback trusted-proxy jest jawnie włączone.

Dobre zachowanie reverse proxy (nadpisywanie przychodzących nagłówków przekazywania):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Złe zachowanie reverse proxy (dopisywanie/zachowywanie niezaufanych nagłówków przekazywania):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Uwagi dotyczące HSTS i origin

- OpenClaw gateway działa przede wszystkim lokalnie/na loopback. Jeśli kończysz TLS na reverse proxy, ustaw HSTS tam, na domenie HTTPS obsługiwanej przez proxy.
- Jeśli sam gateway kończy HTTPS, możesz ustawić `gateway.http.securityHeaders.strictTransportSecurity`, aby emitować nagłówek HSTS z odpowiedzi OpenClaw.
- Szczegółowe wskazówki wdrożeniowe są w sekcji [Uwierzytelnianie Trusted Proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Dla wdrożeń Control UI poza loopback `gateway.controlUi.allowedOrigins` jest domyślnie wymagane.
- `gateway.controlUi.allowedOrigins: ["*"]` to jawna polityka pozwalająca na wszystkie originy przeglądarki, a nie utwardzona wartość domyślna. Unikaj jej poza ściśle kontrolowanymi testami lokalnymi.
- Niepowodzenia uwierzytelniania originu przeglądarki na loopback nadal podlegają ograniczaniu częstotliwości, nawet gdy
  ogólne wyłączenie dla loopback jest włączone, ale klucz blokady jest zakresowany według
  znormalizowanej wartości `Origin` zamiast jednego wspólnego koszyka localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku originu z nagłówka Host; traktuj to jako niebezpieczną politykę wybraną przez operatora.
- Traktuj DNS rebinding i zachowanie nagłówka hosta proxy jako kwestie utwardzania wdrożenia; utrzymuj `trustedProxies` wąsko i unikaj bezpośredniej ekspozycji gateway na publiczny internet.

## Lokalne logi sesji znajdują się na dysku

OpenClaw przechowuje transkrypcje sesji na dysku w `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Jest to wymagane dla ciągłości sesji oraz (opcjonalnie) indeksowania pamięci sesji, ale oznacza też, że
**każdy proces/użytkownik z dostępem do systemu plików może odczytać te logi**. Traktuj dostęp do dysku jako granicę zaufania
i ogranicz uprawnienia do `~/.openclaw` (zobacz sekcję audytu poniżej). Jeśli potrzebujesz
silniejszej izolacji między agentami, uruchamiaj je jako osobnych użytkowników systemu operacyjnego lub na osobnych hostach.

## Wykonywanie w Node (system.run)

Jeśli sparowany jest węzeł macOS, Gateway może wywołać `system.run` na tym węźle. To jest **zdalne wykonywanie kodu** na Macu:

- Wymaga sparowania węzła (zatwierdzenie + token).
- Parowanie węzła Gateway nie jest powierzchnią zatwierdzania pojedynczych poleceń. Ustanawia tożsamość/zaufanie węzła i wydawanie tokenów.
- Gateway stosuje ogólną globalną politykę poleceń węzła przez `gateway.nodes.allowCommands` / `denyCommands`.
- Kontrolowane na Macu przez **Settings → Exec approvals** (zabezpieczenia + pytanie + lista dozwolonych).
- Polityka `system.run` dla danego węzła to własny plik zatwierdzeń wykonywania tego węzła (`exec.approvals.node.*`), który może być bardziej restrykcyjny lub luźniejszy niż globalna polityka identyfikatorów poleceń gateway.
- Węzeł działający z `security="full"` i `ask="off"` działa zgodnie z domyślnym modelem zaufanego operatora. Traktuj to jako oczekiwane zachowanie, chyba że Twoje wdrożenie wyraźnie wymaga ściślejszego zatwierdzania lub podejścia opartego na liście dozwolonych.
- Tryb zatwierdzania wiąże dokładny kontekst żądania i, gdy to możliwe, jeden konkretny operand lokalnego skryptu/pliku. Jeśli OpenClaw nie może zidentyfikować dokładnie jednego bezpośredniego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego, wykonanie oparte na zatwierdzeniu jest odrzucane zamiast obiecywać pełne pokrycie semantyczne.
- Dla `host=node` uruchomienia oparte na zatwierdzeniu przechowują także kanoniczny przygotowany
  `systemRunPlan`; późniejsze zatwierdzone przekazania ponownie używają tego zapisanego planu, a walidacja gateway
  odrzuca edycje polecenia/cwd/kontekstu sesji przez wywołującego po utworzeniu
  żądania zatwierdzenia.
- Jeśli nie chcesz zdalnego wykonywania, ustaw zabezpieczenia na **deny** i usuń sparowanie węzła dla tego Maca.

To rozróżnienie ma znaczenie podczas triage:

- Ponownie łączący się sparowany węzeł, który ogłasza inną listę poleceń, sam w sobie nie jest podatnością, jeśli globalna polityka Gateway i lokalne zatwierdzenia wykonywania węzła nadal egzekwują rzeczywistą granicę wykonywania.
- Zgłoszenia, które traktują metadane parowania węzła jako drugą ukrytą warstwę zatwierdzania pojedynczych poleceń, zwykle są niejasnością polityki/UX, a nie obejściem granicy bezpieczeństwa.

## Dynamiczne Skills (obserwator / zdalne węzły)

OpenClaw może odświeżyć listę Skills w trakcie sesji:

- **Obserwator Skills**: zmiany w `SKILL.md` mogą zaktualizować migawkę Skills przy następnej turze agenta.
- **Zdalne węzły**: podłączenie węzła macOS może sprawić, że Skills dostępne tylko dla macOS staną się kwalifikowalne (na podstawie sondowania binariów).

Traktuj foldery Skills jako **zaufany kod** i ogranicz, kto może je modyfikować.

## Model zagrożeń

Twój asystent AI może:

- Wykonywać dowolne polecenia powłoki
- Odczytywać/zapisywać pliki
- Uzyskiwać dostęp do usług sieciowych
- Wysyłać wiadomości do dowolnych osób (jeśli dasz mu dostęp do WhatsApp)

Osoby, które do Ciebie piszą, mogą:

- Próbować nakłonić Twoją AI do zrobienia złych rzeczy
- Socjotechnicznie uzyskać dostęp do Twoich danych
- Badać szczegóły infrastruktury

## Podstawowa koncepcja: kontrola dostępu przed inteligencją

Większość problemów tutaj to nie wyrafinowane exploity - to sytuacje typu „ktoś napisał do bota, a bot zrobił to, o co go poproszono”.

Stanowisko OpenClaw:

- **Najpierw tożsamość:** zdecyduj, kto może rozmawiać z botem (parowanie DM / listy dozwolonych / jawne „otwarcie”).
- **Następnie zakres:** zdecyduj, gdzie bot może działać (listy dozwolonych grup + wymaganie wzmianki, narzędzia, sandboxing, uprawnienia urządzenia).
- **Model na końcu:** zakładaj, że modelem można manipulować; projektuj tak, aby manipulacja miała ograniczony zasięg szkód.

## Model autoryzacji poleceń

Polecenia ukośnikowe i dyrektywy są honorowane tylko dla **autoryzowanych nadawców**. Autoryzacja wynika z
list dozwolonych/parowania kanału oraz `commands.useAccessGroups` (zobacz [Konfiguracja](/pl/gateway/configuration)
i [Polecenia ukośnikowe](/pl/tools/slash-commands)). Jeśli lista dozwolonych kanału jest pusta lub zawiera `"*"`,
polecenia są faktycznie otwarte dla tego kanału.

`/exec` to wygodne narzędzie tylko w ramach sesji dla autoryzowanych operatorów. **Nie** zapisuje konfiguracji ani
nie zmienia innych sesji.

## Ryzyko narzędzi płaszczyzny sterowania

Dwa wbudowane narzędzia mogą wprowadzać trwałe zmiany w płaszczyźnie sterowania:

- `gateway` może sprawdzać konfigurację za pomocą `config.schema.lookup` / `config.get` i może wprowadzać trwałe zmiany za pomocą `config.apply`, `config.patch` oraz `update.run`.
- `cron` może tworzyć zaplanowane zadania, które nadal działają po zakończeniu pierwotnego czatu/zadania.

Narzędzie uruchomieniowe `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania
`tools.exec.ask` lub `tools.exec.security`; starsze aliasy `tools.bash.*` są
normalizowane do tych samych chronionych ścieżek wykonywania przed zapisem.
Edycje `gateway config.apply` i `gateway config.patch` wykonywane przez agenta
domyślnie kończą się zamknięciem w razie błędu: agent może dostrajać tylko wąski zestaw ścieżek promptów, modeli i wymagania wzmianek.
Nowe wrażliwe drzewa konfiguracji są więc chronione,
chyba że celowo zostaną dodane do listy dozwolonych.

Dla każdego agenta/powierzchni obsługującej niezaufaną treść domyślnie odmawiaj tego:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokuje tylko akcje restartu. Nie wyłącza akcji konfiguracji/aktualizacji `gateway`.

## Pluginy

Pluginy działają **w procesie** razem z Gateway. Traktuj je jako zaufany kod:

- Instaluj tylko pluginy ze źródeł, którym ufasz.
- Preferuj jawne listy dozwolonych `plugins.allow`.
- Przejrzyj konfigurację pluginu przed włączeniem.
- Zrestartuj Gateway po zmianach pluginów.
- Jeśli instalujesz lub aktualizujesz pluginy (`openclaw plugins install <package>`, `openclaw plugins update <id>`), traktuj to jak uruchamianie niezaufanego kodu:
  - Ścieżka instalacji to katalog danego pluginu pod aktywnym katalogiem głównym instalacji pluginów.
  - OpenClaw uruchamia wbudowane skanowanie niebezpiecznego kodu przed instalacją/aktualizacją. Wyniki `critical` domyślnie blokują.
  - Instalacje pluginów z npm i git uruchamiają uzgadnianie zależności menedżera pakietów tylko podczas jawnego przepływu instalacji/aktualizacji. Ścieżki lokalne i archiwa są traktowane jako samodzielne pakiety pluginów; OpenClaw kopiuje/odwołuje się do nich bez uruchamiania `npm install`.
  - Preferuj przypięte, dokładne wersje (`@scope/pkg@1.2.3`) i sprawdź rozpakowany kod na dysku przed włączeniem.
  - `--dangerously-force-unsafe-install` to opcja awaryjna tylko dla fałszywych alarmów wbudowanego skanowania w przepływach instalacji/aktualizacji pluginów. Nie omija blokad polityki hooka `before_install` pluginu i nie omija niepowodzeń skanowania.
  - Instalacje zależności Skills obsługiwane przez Gateway używają tego samego podziału na niebezpieczne/podejrzane: wbudowane wyniki `critical` blokują, chyba że wywołujący jawnie ustawi `dangerouslyForceUnsafeInstall`, natomiast podejrzane wyniki nadal tylko ostrzegają. `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Model dostępu DM: parowanie, lista dozwolonych, otwarte, wyłączone

Wszystkie obecne kanały obsługujące DM wspierają politykę DM (`dmPolicy` lub `*.dm.policy`), która bramkuje przychodzące DM **zanim** wiadomość zostanie przetworzona:

- `pairing` (domyślnie): nieznani nadawcy otrzymują krótki kod parowania, a bot ignoruje ich wiadomość do czasu zatwierdzenia. Kody wygasają po 1 godzinie; powtarzane DM nie wyślą ponownie kodu, dopóki nie zostanie utworzone nowe żądanie. Oczekujące żądania są domyślnie ograniczone do **3 na kanał**.
- `allowlist`: nieznani nadawcy są blokowani (bez uzgadniania parowania).
- `open`: pozwól każdemu wysłać DM (publicznie). **Wymaga**, aby lista dozwolonych kanału zawierała `"*"` (jawne wyrażenie zgody).
- `disabled`: całkowicie ignoruj przychodzące DM.

Zatwierdzanie przez CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Szczegóły + pliki na dysku: [Parowanie](/pl/channels/pairing)

## Izolacja sesji DM (tryb wielu użytkowników)

Domyślnie OpenClaw kieruje **wszystkie DM do głównej sesji**, aby asystent zachował ciągłość między urządzeniami i kanałami. Jeśli **wiele osób** może pisać DM do bota (otwarte DM lub lista dozwolonych z wieloma osobami), rozważ izolację sesji DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Zapobiega to wyciekom kontekstu między użytkownikami, jednocześnie utrzymując izolację czatów grupowych.

To jest granica kontekstu wiadomości, nie granica administratora hosta. Jeśli użytkownicy są wzajemnie antagonistyczni i współdzielą ten sam host/konfigurację Gateway, zamiast tego uruchom osobne gatewaye dla każdej granicy zaufania.

### Bezpieczny tryb DM (zalecane)

Traktuj powyższy fragment jako **bezpieczny tryb DM**:

- Domyślnie: `session.dmScope: "main"` (wszystkie DM współdzielą jedną sesję dla ciągłości).
- Domyślne lokalne wdrażanie CLI: zapisuje `session.dmScope: "per-channel-peer"`, gdy wartość nie jest ustawiona (zachowuje istniejące jawne wartości).
- Bezpieczny tryb DM: `session.dmScope: "per-channel-peer"` (każda para kanał+nadawca otrzymuje izolowany kontekst DM).
- Izolacja nadawcy między kanałami: `session.dmScope: "per-peer"` (każdy nadawca otrzymuje jedną sesję we wszystkich kanałach tego samego typu).

Jeśli używasz wielu kont na tym samym kanale, użyj zamiast tego `per-account-channel-peer`. Jeśli ta sama osoba kontaktuje się z Tobą na wielu kanałach, użyj `session.identityLinks`, aby scalić te sesje DM w jedną kanoniczną tożsamość. Zobacz [Zarządzanie sesjami](/pl/concepts/session) i [Konfiguracja](/pl/gateway/configuration).

## Listy dozwolonych dla DM i grup

OpenClaw ma dwie osobne warstwy „kto może mnie wyzwolić?”:

- **Lista dozwolonych DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; starsze: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): kto może rozmawiać z botem w wiadomościach bezpośrednich.
  - Gdy `dmPolicy="pairing"`, zatwierdzenia są zapisywane w magazynie listy dozwolonych parowania o zakresie konta w `~/.openclaw/credentials/` (`<channel>-allowFrom.json` dla konta domyślnego, `<channel>-<accountId>-allowFrom.json` dla kont innych niż domyślne), scalane z listami dozwolonych z konfiguracji.
- **Lista dozwolonych grup** (specyficzna dla kanału): z których grup/kanałów/gildii bot w ogóle zaakceptuje wiadomości.
  - Typowe wzorce:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: domyślne ustawienia dla grup, takie jak `requireMention`; po ustawieniu działa to także jako lista dozwolonych grup (dodaj `"*"`, aby zachować zachowanie pozwalające wszystkim).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: ogranicz, kto może wyzwolić bota _wewnątrz_ sesji grupowej (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: listy dozwolonych dla powierzchni + domyślne wymaganie wzmianki.
  - Sprawdzenia grup są wykonywane w tej kolejności: najpierw `groupPolicy`/listy dozwolonych grup, potem aktywacja przez wzmiankę/odpowiedź.
  - Odpowiedź na wiadomość bota (niejawna wzmianka) **nie** omija list dozwolonych nadawców, takich jak `groupAllowFrom`.
  - **Uwaga dotycząca bezpieczeństwa:** traktuj `dmPolicy="open"` i `groupPolicy="open"` jako ustawienia ostateczne. Powinny być używane bardzo rzadko; preferuj parowanie + listy dozwolonych, chyba że w pełni ufasz każdemu członkowi pokoju.

Szczegóły: [Konfiguracja](/pl/gateway/configuration) i [Grupy](/pl/channels/groups)

## Prompt injection (czym jest i dlaczego ma znaczenie)

Prompt injection ma miejsce wtedy, gdy atakujący tworzy wiadomość manipulującą modelem, aby zrobił coś niebezpiecznego („ignoruj swoje instrukcje”, „zrzuć swój system plików”, „otwórz ten link i uruchom polecenia” itd.).

Nawet przy silnych promptach systemowych **prompt injection nie jest rozwiązane**. Zabezpieczenia promptu systemowego są tylko miękkimi wskazówkami; twarde egzekwowanie wynika z polityki narzędzi, zatwierdzeń wykonywania, sandboxingu i list dozwolonych kanałów (a operatorzy mogą je celowo wyłączyć). Co pomaga w praktyce:

- Zablokuj przychodzące wiadomości prywatne (parowanie/listy dozwolonych).
- W grupach preferuj bramkowanie przez wzmianki; unikaj botów „zawsze włączonych” w pokojach publicznych.
- Domyślnie traktuj linki, załączniki i wklejone instrukcje jako wrogie.
- Uruchamiaj wykonywanie wrażliwych narzędzi w piaskownicy; trzymaj sekrety poza systemem plików dostępnym dla agenta.
- Uwaga: piaskownica jest opcjonalna. Jeśli tryb piaskownicy jest wyłączony, niejawne `host=auto` rozwiązuje się do hosta gateway. Jawne `host=sandbox` nadal kończy się bezpiecznym błędem, ponieważ nie jest dostępne środowisko uruchomieniowe piaskownicy. Ustaw `host=gateway`, jeśli chcesz, aby to zachowanie było jawne w konfiguracji.
- Ogranicz narzędzia wysokiego ryzyka (`exec`, `browser`, `web_fetch`, `web_search`) do zaufanych agentów lub jawnych list dozwolonych.
- Jeśli dodajesz interpretery do listy dozwolonych (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), włącz `tools.exec.strictInlineEval`, aby formy oceny inline nadal wymagały jawnego zatwierdzenia.
- Analiza zatwierdzania powłoki odrzuca też formy rozwijania parametrów POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) wewnątrz **niecytowanych heredoców**, więc ciało heredoca z listy dozwolonych nie może przemycić rozwijania powłoki przez przegląd listy dozwolonych jako zwykłego tekstu. Zacytuj terminator heredoca (na przykład `<<'EOF'`), aby wybrać semantykę dosłownego ciała; niecytowane heredoci, które rozwinęłyby zmienne, są odrzucane.
- **Wybór modelu ma znaczenie:** starsze/mniejsze/dziedziczone modele są znacznie mniej odporne na prompt injection i niewłaściwe użycie narzędzi. Dla agentów z włączonymi narzędziami używaj najsilniejszego dostępnego modelu najnowszej generacji, utwardzonego instrukcyjnie.

Czerwone flagi, które należy traktować jako niezaufane:

- „Przeczytaj ten plik/URL i zrób dokładnie to, co mówi.”
- „Zignoruj swój prompt systemowy lub reguły bezpieczeństwa.”
- „Ujawnij swoje ukryte instrukcje lub wyniki narzędzi.”
- „Wklej pełną zawartość ~/.openclaw albo swoje logi.”

## Sanityzacja tokenów specjalnych w treści zewnętrznej

OpenClaw usuwa typowe literały tokenów specjalnych szablonów czatu LLM self-hosted z opakowanej treści zewnętrznej i metadanych, zanim dotrą do modelu. Objęte rodziny znaczników obejmują tokeny ról/turowe Qwen/ChatML, Llama, Gemma, Mistral, Phi i GPT-OSS.

Dlaczego:

- Backend’y zgodne z OpenAI, które wystawiają modele self-hosted, czasem zachowują tokeny specjalne pojawiające się w tekście użytkownika zamiast je maskować. Atakujący, który może zapisać coś w przychodzącej treści zewnętrznej (pobrana strona, treść e-maila, wynik narzędzia zawartości pliku), mógłby w przeciwnym razie wstrzyknąć syntetyczną granicę roli `assistant` lub `system` i ominąć zabezpieczenia opakowanej treści.
- Sanityzacja odbywa się w warstwie opakowywania treści zewnętrznej, więc stosuje się jednolicie do narzędzi pobierania/odczytu oraz treści kanałów przychodzących, zamiast działać osobno dla każdego dostawcy.
- Wychodzące odpowiedzi modelu mają już osobny sanityzator, który usuwa wyciekłe `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` i podobne wewnętrzne elementy rusztowania runtime z odpowiedzi widocznych dla użytkownika na końcowej granicy dostarczenia kanału. Sanityzator treści zewnętrznej jest jego odpowiednikiem po stronie przychodzącej.

Nie zastępuje to innych zabezpieczeń na tej stronie - `dmPolicy`, list dozwolonych, zatwierdzeń exec, piaskownicy i `contextVisibility` nadal wykonują główną pracę. Zamyka jedno konkretne obejście w warstwie tokenizera wobec stosów self-hosted, które przekazują tekst użytkownika z nienaruszonymi tokenami specjalnymi.

## Niebezpieczne flagi obejścia treści zewnętrznej

OpenClaw zawiera jawne flagi obejścia, które wyłączają bezpieczne opakowywanie treści zewnętrznej:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Pole payloadu Cron `allowUnsafeExternalContent`

Wytyczne:

- W produkcji pozostaw je nieustawione/fałszywe.
- Włączaj je tylko tymczasowo do ściśle zawężonego debugowania.
- Jeśli są włączone, odizoluj tego agenta (piaskownica + minimalne narzędzia + dedykowana przestrzeń nazw sesji).

Uwaga o ryzyku hooków:

- Payloady hooków są niezaufaną treścią, nawet gdy dostarczenie pochodzi z systemów, które kontrolujesz (poczta/dokumenty/treści WWW mogą przenosić prompt injection).
- Słabsze poziomy modeli zwiększają to ryzyko. Dla automatyzacji sterowanej hookami preferuj silne, nowoczesne poziomy modeli i utrzymuj ścisłą politykę narzędzi (`tools.profile: "messaging"` lub bardziej restrykcyjną), a także piaskownicę tam, gdzie to możliwe.

### Prompt injection nie wymaga publicznych wiadomości prywatnych

Nawet jeśli **tylko ty** możesz pisać do bota, prompt injection nadal może nastąpić przez
dowolną **niezaufaną treść**, którą bot czyta (wyniki wyszukiwania/pobierania z WWW, strony w przeglądarce,
e-maile, dokumenty, załączniki, wklejone logi/kod). Innymi słowy: nadawca nie jest
jedyną powierzchnią zagrożenia; **sama treść** może przenosić wrogie instrukcje.

Gdy narzędzia są włączone, typowe ryzyko polega na eksfiltracji kontekstu lub wyzwalaniu
wywołań narzędzi. Ogranicz promień rażenia przez:

- Użycie tylko do odczytu albo pozbawionego narzędzi **agenta czytającego** do streszczenia niezaufanej treści,
  a następnie przekazanie streszczenia do głównego agenta.
- Wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami, chyba że są potrzebne.
- Dla wejść URL OpenResponses (`input_file` / `input_image`) ustaw ścisłe
  `gateway.http.endpoints.responses.files.urlAllowlist` i
  `gateway.http.endpoints.responses.images.urlAllowlist`, oraz utrzymuj niskie `maxUrlParts`.
  Puste listy dozwolonych są traktowane jako nieustawione; użyj `files.allowUrl: false` / `images.allowUrl: false`,
  jeśli chcesz całkowicie wyłączyć pobieranie URL-i.
- Dla wejść plików OpenResponses zdekodowany tekst `input_file` nadal jest wstrzykiwany jako
  **niezaufana treść zewnętrzna**. Nie zakładaj, że tekst pliku jest zaufany tylko dlatego,
  że Gateway zdekodował go lokalnie. Wstrzyknięty blok nadal zawiera jawne
  znaczniki granic `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` oraz metadane `Source: External`,
  mimo że ta ścieżka pomija dłuższy baner `SECURITY NOTICE:`.
- To samo opakowywanie oparte na znacznikach jest stosowane, gdy rozumienie mediów wyodrębnia tekst
  z załączonych dokumentów przed dołączeniem tego tekstu do promptu mediów.
- Włączenie piaskownicy i ścisłych list dozwolonych narzędzi dla każdego agenta, który dotyka niezaufanego wejścia.
- Trzymanie sekretów poza promptami; przekazuj je zamiast tego przez env/config na hoście gateway.

### Backend’y LLM self-hosted

Backend’y self-hosted zgodne z OpenAI, takie jak vLLM, SGLang, TGI, LM Studio,
albo niestandardowe stosy tokenizera Hugging Face mogą różnić się od hostowanych dostawców sposobem
obsługi tokenów specjalnych szablonu czatu. Jeśli backend tokenizuje dosłowne ciągi
takie jak `<|im_start|>`, `<|start_header_id|>` lub `<start_of_turn>` jako
strukturalne tokeny szablonu czatu wewnątrz treści użytkownika, niezaufany tekst może próbować
fałszować granice ról w warstwie tokenizera.

OpenClaw usuwa typowe literały tokenów specjalnych rodzin modeli z opakowanej
treści zewnętrznej przed wysłaniem jej do modelu. Pozostaw opakowywanie treści zewnętrznej
włączone i preferuj ustawienia backendu, które dzielą albo escapują tokeny specjalne
w treści dostarczonej przez użytkownika, gdy są dostępne. Hostowani dostawcy, tacy jak OpenAI
i Anthropic, stosują już własną sanityzację po stronie żądania.

### Siła modelu (uwaga dotycząca bezpieczeństwa)

Odporność na prompt injection **nie** jest jednolita między poziomami modeli. Mniejsze/tańsze modele są ogólnie bardziej podatne na niewłaściwe użycie narzędzi i przejęcie instrukcji, zwłaszcza pod wrogimi promptami.

<Warning>
Dla agentów z włączonymi narzędziami lub agentów czytających niezaufaną treść ryzyko prompt injection przy starszych/mniejszych modelach jest często zbyt wysokie. Nie uruchamiaj takich obciążeń na słabych poziomach modeli.
</Warning>

Rekomendacje:

- **Używaj modelu najnowszej generacji i najlepszego poziomu** dla każdego bota, który może uruchamiać narzędzia albo dotykać plików/sieci.
- **Nie używaj starszych/słabszych/mniejszych poziomów** dla agentów z włączonymi narzędziami ani niezaufanych skrzynek odbiorczych; ryzyko prompt injection jest zbyt wysokie.
- Jeśli musisz użyć mniejszego modelu, **zmniejsz promień rażenia** (narzędzia tylko do odczytu, silna piaskownica, minimalny dostęp do systemu plików, ścisłe listy dozwolonych).
- Przy uruchamianiu małych modeli **włącz piaskownicę dla wszystkich sesji** i **wyłącz web_search/web_fetch/browser**, chyba że wejścia są ściśle kontrolowane.
- Dla osobistych asystentów wyłącznie czatowych z zaufanym wejściem i bez narzędzi mniejsze modele są zwykle w porządku.

## Rozumowanie i szczegółowe wyjście w grupach

`/reasoning`, `/verbose` i `/trace` mogą ujawniać wewnętrzne rozumowanie, wynik narzędzia
albo diagnostykę pluginu, które
nie były przeznaczone dla kanału publicznego. W ustawieniach grupowych traktuj je jako **tylko do debugowania**
i pozostaw wyłączone, chyba że wyraźnie ich potrzebujesz.

Wytyczne:

- Pozostaw `/reasoning`, `/verbose` i `/trace` wyłączone w pokojach publicznych.
- Jeśli je włączasz, rób to tylko w zaufanych wiadomościach prywatnych lub ściśle kontrolowanych pokojach.
- Pamiętaj: szczegółowe i śledzące wyjście może zawierać argumenty narzędzi, URL-e, diagnostykę pluginów i dane widziane przez model.

## Przykłady utwardzania konfiguracji

### Uprawnienia plików

Utrzymuj konfigurację i stan jako prywatne na hoście gateway:

- `~/.openclaw/openclaw.json`: `600` (tylko odczyt/zapis przez użytkownika)
- `~/.openclaw`: `700` (tylko użytkownik)

`openclaw doctor` może ostrzec i zaproponować zaostrzenie tych uprawnień.

### Ekspozycja sieciowa (bind, port, zapora)

Gateway multipleksuje **WebSocket + HTTP** na jednym porcie:

- Domyślnie: `18789`
- Konfiguracja/flagi/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ta powierzchnia HTTP obejmuje Control UI i host kanwy:

- Control UI (zasoby SPA) (domyślna ścieżka bazowa `/`)
- Host kanwy: `/__openclaw__/canvas/` i `/__openclaw__/a2ui/` (dowolny HTML/JS; traktuj jako niezaufaną treść)

Jeśli ładujesz treść kanwy w zwykłej przeglądarce, traktuj ją jak każdą inną niezaufaną stronę internetową:

- Nie wystawiaj hosta kanwy do niezaufanych sieci/użytkowników.
- Nie sprawiaj, aby treść kanwy współdzieliła to samo origin z uprzywilejowanymi powierzchniami WWW, chyba że w pełni rozumiesz konsekwencje.

Tryb bind kontroluje, gdzie Gateway nasłuchuje:

- `gateway.bind: "loopback"` (domyślnie): łączyć się mogą tylko lokalni klienci.
- Bindy inne niż loopback (`"lan"`, `"tailnet"`, `"custom"`) rozszerzają powierzchnię ataku. Używaj ich tylko z uwierzytelnianiem gateway (wspólny token/hasło albo poprawnie skonfigurowany zaufany proxy) i prawdziwą zaporą.

Reguły praktyczne:

- Preferuj Tailscale Serve zamiast bindów LAN (Serve utrzymuje Gateway na loopback, a Tailscale obsługuje dostęp).
- Jeśli musisz bindować do LAN, ogranicz port zaporą do ścisłej listy dozwolonych źródłowych adresów IP; nie przekierowuj go szeroko.
- Nigdy nie wystawiaj nieuwierzytelnionego Gateway na `0.0.0.0`.

### Publikowanie portów Dockera z UFW

Jeśli uruchamiasz OpenClaw z Dockerem na VPS, pamiętaj, że opublikowane porty kontenera
(`-p HOST:CONTAINER` albo Compose `ports:`) są trasowane przez łańcuchy przekazywania
Dockera, nie tylko przez reguły hosta `INPUT`.

Aby utrzymać ruch Dockera zgodny z polityką zapory, wymuszaj reguły w
`DOCKER-USER` (ten łańcuch jest oceniany przed własnymi regułami akceptacji Dockera).
W wielu nowoczesnych dystrybucjach `iptables`/`ip6tables` używają frontendu `iptables-nft`
i nadal stosują te reguły do backendu nftables.

Minimalny przykład listy dozwolonych (IPv4):

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

IPv6 ma osobne tabele. Dodaj dopasowaną politykę w `/etc/ufw/after6.rules`, jeśli
IPv6 Dockera jest włączone.

Unikaj kodowania na sztywno nazw interfejsów, takich jak `eth0`, we fragmentach dokumentacji. Nazwy interfejsów
różnią się między obrazami VPS (`ens3`, `enp*` itd.), a niedopasowania mogą przypadkowo
pominąć regułę odmowy.

Szybka walidacja po ponownym załadowaniu:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Oczekiwane porty zewnętrzne powinny być tylko tymi, które celowo wystawiasz (w większości
konfiguracji: SSH + porty twojego reverse proxy).

### Wykrywanie mDNS/Bonjour

Gdy dołączony plugin `bonjour` jest włączony, Gateway rozgłasza swoją obecność przez mDNS (`_openclaw-gw._tcp` na porcie 5353) w celu wykrywania lokalnych urządzeń. W trybie pełnym obejmuje to rekordy TXT, które mogą ujawniać szczegóły operacyjne:

- `cliPath`: pełna ścieżka w systemie plików do pliku binarnego CLI (ujawnia nazwę użytkownika i lokalizację instalacji)
- `sshPort`: ogłasza dostępność SSH na hoście
- `displayName`, `lanHost`: informacje o nazwie hosta

**Kwestia bezpieczeństwa operacyjnego:** Rozgłaszanie szczegółów infrastruktury ułatwia rekonesans każdemu w sieci lokalnej. Nawet „nieszkodliwe” informacje, takie jak ścieżki w systemie plików i dostępność SSH, pomagają atakującym mapować środowisko.

**Zalecenia:**

1. **Pozostaw Bonjour wyłączony, chyba że potrzebne jest wykrywanie w LAN.** Bonjour uruchamia się automatycznie na hostach macOS, a gdzie indziej wymaga włączenia; bezpośrednie adresy URL Gateway, Tailnet, SSH lub szerokoobszarowe DNS-SD pozwalają uniknąć lokalnego multicastu.

2. **Tryb minimalny** (domyślny, gdy Bonjour jest włączony, zalecany dla wystawionych Gateway): pomija pola wrażliwe w rozgłoszeniach mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Wyłącz tryb mDNS**, jeśli chcesz pozostawić Plugin włączony, ale zablokować lokalne wykrywanie urządzeń:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Tryb pełny** (włączany opcjonalnie): dołącz `cliPath` + `sshPort` w rekordach TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Zmienna środowiskowa** (alternatywa): ustaw `OPENCLAW_DISABLE_BONJOUR=1`, aby wyłączyć mDNS bez zmian w konfiguracji.

Gdy Bonjour jest włączony w trybie minimalnym, Gateway rozgłasza wystarczająco dużo informacji do wykrywania urządzeń (`role`, `gatewayPort`, `transport`), ale pomija `cliPath` i `sshPort`. Aplikacje, które potrzebują informacji o ścieżce CLI, mogą zamiast tego pobrać ją przez uwierzytelnione połączenie WebSocket.

### Zablokuj dostęp do WebSocket Gateway (uwierzytelnianie lokalne)

Uwierzytelnianie Gateway jest **domyślnie wymagane**. Jeśli nie skonfigurowano prawidłowej ścieżki uwierzytelniania gateway,
Gateway odrzuca połączenia WebSocket (zamknięcie z odmową).

Onboarding domyślnie generuje token (nawet dla loopback), więc
klienci lokalni muszą się uwierzytelnić.

Ustaw token, aby **wszyscy** klienci WS musieli się uwierzytelniać:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor może wygenerować go dla Ciebie: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` i `gateway.remote.password` są źródłami poświadczeń klienta. Same z siebie **nie** chronią lokalnego dostępu WS. Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione. Jeśli `gateway.auth.token` lub `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się odmową dostępu (bez maskowania przez zdalne rozwiązanie awaryjne).
</Note>
Opcjonalnie: przypnij zdalne TLS za pomocą `gateway.remote.tlsFingerprint` podczas używania `wss://`.
Nieszyfrowane `ws://` jest domyślnie dozwolone tylko dla loopback. Dla zaufanych ścieżek
sieci prywatnej ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
awaryjne obejście. To celowo działa wyłącznie przez środowisko procesu, a nie jako
klucz konfiguracji `openclaw.json`.
Parowanie mobilne oraz ręczne lub skanowane trasy gateway na Androidzie są bardziej rygorystyczne:
tekst jawny jest akceptowany dla loopback, ale nazwy hostów private-LAN, link-local, `.local` i
bez kropek muszą używać TLS, chyba że jawnie włączysz zaufaną ścieżkę tekstu jawnego
w sieci prywatnej.

Parowanie urządzeń lokalnych:

- Parowanie urządzeń jest automatycznie zatwierdzane dla bezpośrednich połączeń local loopback, aby
  klienci na tym samym hoście działali płynnie.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalną dla backendu/kontenera dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia przez Tailnet i LAN, w tym wiązania tailnet na tym samym hoście, są traktowane jako
  zdalne na potrzeby parowania i nadal wymagają zatwierdzenia.
- Dowody z nagłówków przekazywanych w żądaniu loopback wykluczają lokalność loopback.
  Automatyczne zatwierdzanie podniesienia poziomu metadanych ma wąski zakres. Zobacz
  [Parowanie Gateway](/pl/gateway/pairing), aby poznać obie reguły.

Tryby uwierzytelniania:

- `gateway.auth.mode: "token"`: współdzielony token bearer (zalecany dla większości konfiguracji).
- `gateway.auth.mode: "password"`: uwierzytelnianie hasłem (najlepiej ustawiać przez env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: zaufaj odwrotnemu proxy świadomemu tożsamości, które uwierzytelnia użytkowników i przekazuje tożsamość przez nagłówki (zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)).

Lista kontrolna rotacji (token/hasło):

1. Wygeneruj/ustaw nowy sekret (`gateway.auth.token` lub `OPENCLAW_GATEWAY_PASSWORD`).
2. Uruchom ponownie Gateway (lub uruchom ponownie aplikację macOS, jeśli nadzoruje Gateway).
3. Zaktualizuj wszystkich klientów zdalnych (`gateway.remote.token` / `.password` na maszynach, które wywołują Gateway).
4. Sprawdź, czy nie można już połączyć się przy użyciu starych poświadczeń.

### Nagłówki tożsamości Tailscale Serve

Gdy `gateway.auth.allowTailscale` ma wartość `true` (domyślnie dla Serve), OpenClaw
akceptuje nagłówki tożsamości Tailscale Serve (`tailscale-user-login`) dla uwierzytelniania Control
UI/WebSocket. OpenClaw weryfikuje tożsamość, rozwiązując adres
`x-forwarded-for` przez lokalny demon Tailscale (`tailscale whois`)
i dopasowując go do nagłówka. To uruchamia się tylko dla żądań, które trafiają w loopback
i zawierają `x-forwarded-for`, `x-forwarded-proto` oraz `x-forwarded-host` w formie
wstrzykniętej przez Tailscale.
Dla tej asynchronicznej ścieżki sprawdzania tożsamości nieudane próby dla tego samego `{scope, ip}`
są serializowane, zanim limiter zapisze niepowodzenie. Równoczesne błędne ponowienia
od jednego klienta Serve mogą więc natychmiast zablokować drugą próbę,
zamiast przejść równolegle jako dwa zwykłe niedopasowania.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania przez nagłówki tożsamości Tailscale. Nadal stosują
skonfigurowany tryb uwierzytelniania HTTP gateway.

Ważna uwaga o granicach:

- Uwierzytelnianie bearer HTTP Gateway jest w praktyce dostępem operatora typu wszystko albo nic.
- Traktuj poświadczenia, które mogą wywoływać `/v1/chat/completions`, `/v1/responses` lub `/api/channels/*`, jako sekrety operatora z pełnym dostępem do tego gateway.
- Na powierzchni HTTP zgodnej z OpenAI uwierzytelnianie bearer współdzielonym sekretem przywraca pełne domyślne zakresy operatora (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) oraz semantykę właściciela dla tur agenta; węższe wartości `x-openclaw-scopes` nie ograniczają tej ścieżki współdzielonego sekretu.
- Semantyka zakresu dla pojedynczego żądania w HTTP ma zastosowanie tylko wtedy, gdy żądanie pochodzi z trybu niosącego tożsamość, takiego jak uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"` na prywatnym wejściu.
- W tych trybach niosących tożsamość pominięcie `x-openclaw-scopes` powoduje powrót do zwykłego domyślnego zestawu zakresów operatora; wyślij nagłówek jawnie, gdy chcesz użyć węższego zestawu zakresów.
- `/tools/invoke` stosuje tę samą regułę współdzielonego sekretu: uwierzytelnianie bearer tokenem/hasłem jest tam również traktowane jako pełny dostęp operatora, natomiast tryby niosące tożsamość nadal respektują zadeklarowane zakresy.
- Nie udostępniaj tych poświadczeń niezaufanym wywołującym; preferuj osobne gateway dla każdej granicy zaufania.

**Założenie zaufania:** uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany.
Nie traktuj tego jako ochrony przed wrogimi procesami na tym samym hoście. Jeśli na hoście
gateway może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale`
i wymagaj jawnego uwierzytelniania współdzielonym sekretem przez `gateway.auth.mode: "token"` lub
`"password"`.

**Reguła bezpieczeństwa:** nie przekazuj tych nagłówków z własnego odwrotnego proxy. Jeśli
kończysz TLS lub proxy przed gateway, wyłącz
`gateway.auth.allowTailscale` i zamiast tego użyj uwierzytelniania współdzielonym sekretem (`gateway.auth.mode:
"token"` lub `"password"`) albo [Uwierzytelniania przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

Zaufane proxy:

- Jeśli kończysz TLS przed Gateway, ustaw `gateway.trustedProxies` na adresy IP swojego proxy.
- OpenClaw zaufa `x-forwarded-for` (lub `x-real-ip`) z tych adresów IP, aby określić IP klienta na potrzeby lokalnych kontroli parowania oraz uwierzytelniania HTTP/kontroli lokalnych.
- Upewnij się, że proxy **nadpisuje** `x-forwarded-for` i blokuje bezpośredni dostęp do portu Gateway.

Zobacz [Tailscale](/pl/gateway/tailscale) i [Przegląd WWW](/pl/web).

### Sterowanie przeglądarką przez host Node (zalecane)

Jeśli Twój Gateway jest zdalny, ale przeglądarka działa na innej maszynie, uruchom **host Node**
na maszynie z przeglądarką i pozwól Gateway pośredniczyć w działaniach przeglądarki (zobacz [Narzędzie przeglądarki](/pl/tools/browser)).
Traktuj parowanie node jak dostęp administracyjny.

Zalecany wzorzec:

- Trzymaj Gateway i host Node w tym samym tailnet (Tailscale).
- Sparuj node celowo; wyłącz trasowanie proxy przeglądarki, jeśli go nie potrzebujesz.

Unikaj:

- Wystawiania portów przekaźnika/sterowania przez LAN lub publiczny Internet.
- Tailscale Funnel dla endpointów sterowania przeglądarką (ekspozycja publiczna).

### Sekrety na dysku

Zakładaj, że wszystko pod `~/.openclaw/` (lub `$OPENCLAW_STATE_DIR/`) może zawierać sekrety lub dane prywatne:

- `openclaw.json`: konfiguracja może obejmować tokeny (gateway, zdalny gateway), ustawienia dostawców i listy dozwolonych.
- `credentials/**`: poświadczenia kanałów (przykład: poświadczenia WhatsApp), listy dozwolonych parowań, starsze importy OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: klucze API, profile tokenów, tokeny OAuth oraz opcjonalne `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: konto serwera aplikacji Codex dla danego agenta, konfiguracja, Skills, plugins, natywny stan wątków i diagnostyka.
- `secrets.json` (opcjonalnie): ładunek sekretów oparty na pliku używany przez dostawców SecretRef typu `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: starszy plik zgodności. Statyczne wpisy `api_key` są czyszczone po wykryciu.
- `agents/<agentId>/sessions/**`: transkrypty sesji (`*.jsonl`) + metadane routingu (`sessions.json`), które mogą zawierać prywatne wiadomości i dane wyjściowe narzędzi.
- pakiety dołączonych plugins: zainstalowane plugins (plus ich `node_modules/`).
- `sandboxes/**`: obszary robocze sandboxów narzędzi; mogą gromadzić kopie plików odczytywanych/zapisywanych w sandboxie.

Wskazówki utwardzania:

- Utrzymuj restrykcyjne uprawnienia (`700` dla katalogów, `600` dla plików).
- Używaj pełnego szyfrowania dysku na hoście gateway.
- Preferuj dedykowane konto użytkownika systemu operacyjnego dla Gateway, jeśli host jest współdzielony.

### Pliki `.env` obszaru roboczego

OpenClaw ładuje lokalne dla obszaru roboczego pliki `.env` dla agentów i narzędzi, ale nigdy nie pozwala tym plikom po cichu nadpisywać kontroli czasu działania gateway.

- Każdy klucz zaczynający się od `OPENCLAW_*` jest blokowany w niezaufanych plikach `.env` obszaru roboczego.
- Ustawienia endpointów kanałów dla Matrix, Mattermost, IRC i Synology Chat są również blokowane przed nadpisaniami z `.env` obszaru roboczego, więc sklonowane obszary robocze nie mogą przekierować ruchu dołączonych konektorów przez lokalną konfigurację endpointów. Klucze env endpointów (takie jak `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) muszą pochodzić ze środowiska procesu gateway lub `env.shellEnv`, a nie z pliku `.env` ładowanego z obszaru roboczego.
- Blokada działa z odmową domyślną: nowa zmienna kontroli czasu działania dodana w przyszłej wersji nie może zostać odziedziczona z wpisanego do repozytorium lub dostarczonego przez atakującego pliku `.env`; klucz jest ignorowany, a gateway zachowuje własną wartość.
- Zaufane zmienne środowiskowe procesu/systemu operacyjnego (własna powłoka gateway, jednostka launchd/systemd, pakiet aplikacji) nadal obowiązują - ograniczenie dotyczy tylko ładowania plików `.env`.

Dlaczego: pliki `.env` obszaru roboczego często znajdują się obok kodu agenta, bywają przypadkowo commitowane albo zapisywane przez narzędzia. Zablokowanie całego prefiksu `OPENCLAW_*` oznacza, że dodanie później nowej flagi `OPENCLAW_*` nigdy nie cofnie się do cichego dziedziczenia ze stanu obszaru roboczego.

### Logi i transkrypty (redakcja i retencja)

Logi i transkrypty mogą ujawniać informacje wrażliwe nawet wtedy, gdy kontrole dostępu są poprawne:

- Logi Gateway mogą zawierać podsumowania narzędzi, błędy i adresy URL.
- Transkrypty sesji mogą zawierać wklejone sekrety, zawartość plików, dane wyjściowe poleceń i linki.

Zalecenia:

- Pozostaw redakcję logów i transkryptów włączoną (`logging.redactSensitive: "tools"`; domyślnie).
- Dodaj niestandardowe wzorce dla swojego środowiska przez `logging.redactPatterns` (tokeny, nazwy hostów, wewnętrzne adresy URL).
- Podczas udostępniania diagnostyki preferuj `openclaw status --all` (nadaje się do wklejenia, sekrety zredagowane) zamiast surowych logów.
- Usuwaj stare transkrypty sesji i pliki logów, jeśli nie potrzebujesz długiej retencji.

Szczegóły: [Logowanie](/pl/gateway/logging)

### DM: domyślnie parowanie

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Grupy: wymagaj wzmianki wszędzie

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

W czatach grupowych odpowiadaj tylko po wyraźnym oznaczeniu.

### Oddzielne numery (WhatsApp, Signal, Telegram)

W przypadku kanałów opartych na numerach telefonów rozważ uruchamianie swojej AI na numerze telefonu oddzielnym od osobistego:

- Numer osobisty: Twoje rozmowy pozostają prywatne
- Numer bota: AI obsługuje te rozmowy z odpowiednimi granicami

### Tryb tylko do odczytu (przez piaskownicę i narzędzia)

Profil tylko do odczytu możesz zbudować przez połączenie:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (lub `"none"` przy braku dostępu do obszaru roboczego)
- list dozwolonych/zabronionych narzędzi, które blokują `write`, `edit`, `apply_patch`, `exec`, `process` itd.

Dodatkowe opcje wzmocnienia zabezpieczeń:

- `tools.exec.applyPatch.workspaceOnly: true` (domyślnie): zapewnia, że `apply_patch` nie może zapisywać/usuwać poza katalogiem obszaru roboczego nawet wtedy, gdy piaskownica jest wyłączona. Ustaw na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` dotykał plików poza obszarem roboczym.
- `tools.fs.workspaceOnly: true` (opcjonalnie): ogranicza ścieżki `read`/`write`/`edit`/`apply_patch` oraz ścieżki automatycznego ładowania obrazów z natywnego promptu do katalogu obszaru roboczego (przydatne, jeśli dziś dopuszczasz ścieżki bezwzględne i chcesz mieć jedną barierę ochronną).
- Utrzymuj wąskie korzenie systemu plików: unikaj szerokich korzeni, takich jak katalog domowy, dla obszarów roboczych agentów/obszarów roboczych piaskownicy. Szerokie korzenie mogą ujawnić narzędziom systemu plików wrażliwe pliki lokalne (na przykład stan/konfigurację pod `~/.openclaw`).

### Bezpieczna konfiguracja bazowa (kopiuj/wklej)

Jedna konfiguracja „bezpieczna domyślnie”, która utrzymuje Gateway jako prywatny, wymaga parowania DM i unika zawsze aktywnych botów grupowych:

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

Jeśli chcesz też „bezpieczniejszego domyślnie” wykonywania narzędzi, dodaj piaskownicę i zablokuj niebezpieczne narzędzia dla każdego agenta niebędącego właścicielem (przykład poniżej w sekcji „Profile dostępu dla poszczególnych agentów”).

Wbudowana konfiguracja bazowa dla tur agenta wywoływanych z czatu: nadawcy niebędący właścicielami nie mogą używać narzędzi `cron` ani `gateway`.

## Izolacja w piaskownicy (zalecane)

Dedykowana dokumentacja: [Izolacja w piaskownicy](/pl/gateway/sandboxing)

Dwa uzupełniające się podejścia:

- **Uruchom cały Gateway w Dockerze** (granica kontenera): [Docker](/pl/install/docker)
- **Piaskownica narzędzi** (`agents.defaults.sandbox`, Gateway na hoście + narzędzia izolowane w piaskownicy; Docker jest domyślnym backendem): [Izolacja w piaskownicy](/pl/gateway/sandboxing)

<Note>
Aby zapobiec dostępowi między agentami, pozostaw `agents.defaults.sandbox.scope` ustawione na `"agent"` (domyślnie) albo `"session"` dla ściślejszej izolacji na poziomie sesji. `scope: "shared"` używa pojedynczego kontenera lub obszaru roboczego.
</Note>

Rozważ też dostęp do obszaru roboczego agenta wewnątrz piaskownicy:

- `agents.defaults.sandbox.workspaceAccess: "none"` (domyślnie) utrzymuje obszar roboczy agenta poza zasięgiem; narzędzia działają względem obszaru roboczego piaskownicy pod `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` montuje obszar roboczy agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` montuje obszar roboczy agenta do odczytu/zapisu pod `/workspace`
- Dodatkowe `sandbox.docker.binds` są walidowane względem znormalizowanych i kanonicznych ścieżek źródłowych. Sztuczki z dowiązaniami symbolicznymi rodzica i kanoniczne aliasy katalogu domowego nadal są domyślnie blokowane, jeśli rozwiążą się do zablokowanych korzeni, takich jak `/etc`, `/var/run` lub katalogi z poświadczeniami pod katalogiem domowym systemu operacyjnego.

<Warning>
`tools.elevated` to globalna bazowa furtka ucieczki, która uruchamia exec poza piaskownicą. Efektywny host to domyślnie `gateway`, albo `node`, gdy cel exec jest skonfigurowany jako `node`. Utrzymuj `tools.elevated.allowFrom` restrykcyjne i nie włączaj tego dla obcych. Możesz dodatkowo ograniczyć tryb podwyższony dla poszczególnych agentów przez `agents.list[].tools.elevated`. Zobacz [Tryb podwyższony](/pl/tools/elevated).
</Warning>

### Bariera ochronna delegowania podagentów

Jeśli dopuszczasz narzędzia sesji, traktuj delegowane uruchomienia podagentów jako kolejną decyzję graniczną:

- Zabroń `sessions_spawn`, chyba że agent naprawdę potrzebuje delegowania.
- Utrzymuj `agents.defaults.subagents.allowAgents` i wszelkie nadpisania `agents.list[].subagents.allowAgents` dla poszczególnych agentów ograniczone do znanych bezpiecznych agentów docelowych.
- Dla każdego przepływu pracy, który musi pozostać w piaskownicy, wywołuj `sessions_spawn` z `sandbox: "require"` (domyślnie jest `inherit`).
- `sandbox: "require"` szybko kończy się błędem, gdy docelowe środowisko uruchomieniowe dziecka nie jest w piaskownicy.

## Ryzyka sterowania przeglądarką

Włączenie sterowania przeglądarką daje modelowi możliwość kierowania prawdziwą przeglądarką.
Jeśli ten profil przeglądarki już zawiera zalogowane sesje, model może
uzyskać dostęp do tych kont i danych. Traktuj profile przeglądarki jako **wrażliwy stan**:

- Preferuj dedykowany profil dla agenta (domyślny profil `openclaw`).
- Unikaj kierowania agenta na swój osobisty profil używany na co dzień.
- Pozostaw sterowanie przeglądarką hosta wyłączone dla agentów w piaskownicy, chyba że im ufasz.
- Samodzielne API sterowania przeglądarką przez local loopback honoruje tylko uwierzytelnianie współdzielonym sekretem
  (uwierzytelnianie tokenem bearer Gateway lub hasło Gateway). Nie korzysta z
  nagłówków tożsamości trusted-proxy ani Tailscale Serve.
- Traktuj pobierane pliki przeglądarki jako niezaufane dane wejściowe; preferuj izolowany katalog pobierania.
- Jeśli to możliwe, wyłącz synchronizację przeglądarki/menedżery haseł w profilu agenta (zmniejsza zasięg skutków).
- W przypadku zdalnych Gateway zakładaj, że „sterowanie przeglądarką” jest równoważne „dostępowi operatora” do wszystkiego, co ten profil może osiągnąć.
- Utrzymuj hosty Gateway i Node dostępne tylko w tailnet; unikaj wystawiania portów sterowania przeglądarką do LAN lub publicznego Internetu.
- Wyłącz routing proxy przeglądarki, gdy go nie potrzebujesz (`gateway.nodes.browser.mode="off"`).
- Tryb istniejącej sesji Chrome MCP **nie** jest „bezpieczniejszy”; może działać jako Ty we wszystkim, co może osiągnąć ten profil Chrome na hoście.

### Polityka SSRF przeglądarki (domyślnie restrykcyjna)

Polityka nawigacji przeglądarki OpenClaw jest domyślnie restrykcyjna: prywatne/wewnętrzne miejsca docelowe pozostają zablokowane, chyba że jawnie je włączysz.

- Domyślnie: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nie jest ustawione, więc nawigacja przeglądarki nadal blokuje prywatne/wewnętrzne/specjalnego użycia miejsca docelowe.
- Starszy alias: `browser.ssrfPolicy.allowPrivateNetwork` jest nadal akceptowany dla zgodności.
- Tryb jawnego włączenia: ustaw `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, aby zezwolić na prywatne/wewnętrzne/specjalnego użycia miejsca docelowe.
- W trybie restrykcyjnym użyj `hostnameAllowlist` (wzorce takie jak `*.example.com`) i `allowedHostnames` (dokładne wyjątki hostów, w tym zablokowane nazwy takie jak `localhost`) dla jawnych wyjątków.
- Nawigacja jest sprawdzana przed żądaniem i w miarę możliwości ponownie sprawdzana na końcowym adresie URL `http(s)` po nawigacji, aby ograniczyć przekierowania prowadzące do zmiany celu.

Przykładowa restrykcyjna polityka:

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

## Profile dostępu dla poszczególnych agentów (wiele agentów)

Przy routingu wieloagentowym każdy agent może mieć własną piaskownicę i politykę narzędzi:
użyj tego, aby nadać agentowi **pełny dostęp**, **tylko odczyt** lub **brak dostępu**.
Pełne szczegóły i reguły pierwszeństwa znajdziesz w [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools).

Typowe przypadki użycia:

- Agent osobisty: pełny dostęp, brak piaskownicy
- Agent rodzinny/służbowy: piaskownica + narzędzia tylko do odczytu
- Agent publiczny: piaskownica + brak narzędzi systemu plików/powłoki

### Przykład: pełny dostęp (brak piaskownicy)

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

### Przykład: narzędzia tylko do odczytu + obszar roboczy tylko do odczytu

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

### Przykład: brak dostępu do systemu plików/powłoki (komunikacja przez dostawców dozwolona)

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

## Reakcja na incydent

Jeśli Twoja AI zrobi coś złego:

### Ogranicz

1. **Zatrzymaj ją:** zatrzymaj aplikację macOS (jeśli nadzoruje Gateway) albo zakończ proces `openclaw gateway`.
2. **Zamknij ekspozycję:** ustaw `gateway.bind: "loopback"` (albo wyłącz Tailscale Funnel/Serve), dopóki nie zrozumiesz, co się stało.
3. **Zamroź dostęp:** przełącz ryzykowne DM/grupy na `dmPolicy: "disabled"` / wymagaj oznaczeń i usuń wpisy allow-all `"*"`, jeśli je miałeś.

### Obróć (zakładaj kompromitację, jeśli wyciekły sekrety)

1. Obróć uwierzytelnianie Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) i uruchom ponownie.
2. Obróć sekrety zdalnych klientów (`gateway.remote.token` / `.password`) na każdej maszynie, która może wywołać Gateway.
3. Obróć poświadczenia dostawców/API (poświadczenia WhatsApp, tokeny Slack/Discord, klucze modelu/API w `auth-profiles.json` oraz zaszyfrowane wartości ładunków sekretów, gdy są używane).

### Audytuj

1. Sprawdź logi Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (lub `logging.file`).
2. Przejrzyj odpowiednie transkrypty: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Przejrzyj ostatnie zmiany konfiguracji (wszystko, co mogło rozszerzyć dostęp: `gateway.bind`, `gateway.auth`, polityki DM/grup, `tools.elevated`, zmiany Plugin).
4. Uruchom ponownie `openclaw security audit --deep` i potwierdź, że krytyczne ustalenia zostały rozwiązane.

### Zbierz do raportu

- Znacznik czasu, system operacyjny hosta Gateway + wersja OpenClaw
- Transkrypty sesji + krótki ogon logu (po redakcji)
- Co wysłał atakujący + co zrobił agent
- Czy Gateway był wystawiony poza loopback (LAN/Tailscale Funnel/Serve)

## Skanowanie sekretów

CI uruchamia hook pre-commit `detect-private-key` w repozytorium. Jeśli
zakończy się niepowodzeniem, usuń lub obróć zatwierdzony materiał klucza, a następnie odtwórz lokalnie:

```bash
pre-commit run --all-files detect-private-key
```

## Zgłaszanie problemów bezpieczeństwa

Znalazłeś lukę w OpenClaw? Zgłoś ją odpowiedzialnie:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Nie publikuj publicznie, dopóki nie zostanie naprawiona
3. Przyznamy Ci zasługę (chyba że wolisz anonimowość)
