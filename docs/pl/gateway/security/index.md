---
read_when:
    - Dodawanie funkcji rozszerzających dostęp lub automatyzację
summary: Zagadnienia dotyczące bezpieczeństwa i model zagrożeń przy uruchamianiu Gateway AI z dostępem do powłoki
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-03T21:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: dde3c066d5e108b9e9de765144f03512375e19c3d877481b12e4e217d4e7090b
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model zaufania osobistego asystenta.** Te wskazówki zakładają jedną zaufaną
  granicę operatora na Gateway (model jednego użytkownika, osobistego asystenta).
  OpenClaw **nie** jest wrogą, wielodzierżawną granicą bezpieczeństwa dla wielu
  przeciwniczych użytkowników współdzielących jednego agenta lub Gateway. Jeśli potrzebujesz działania z mieszanym zaufaniem lub z przeciwniczymi użytkownikami, rozdziel granice zaufania (osobny Gateway +
  dane uwierzytelniające, najlepiej osobni użytkownicy systemu operacyjnego lub hosty).
</Warning>

## Najpierw zakres: model bezpieczeństwa osobistego asystenta

Wskazówki dotyczące bezpieczeństwa OpenClaw zakładają wdrożenie typu **osobisty asystent**: jedna zaufana granica operatora, potencjalnie wielu agentów.

- Obsługiwana postawa bezpieczeństwa: jeden użytkownik/granica zaufania na Gateway (preferowany jeden użytkownik systemu operacyjnego/host/VPS na granicę).
- Nieobsługiwana granica bezpieczeństwa: jeden współdzielony Gateway/agent używany przez wzajemnie niezaufanych lub przeciwniczych użytkowników.
- Jeśli wymagana jest izolacja przeciwniczych użytkowników, rozdziel według granicy zaufania (osobny Gateway + dane uwierzytelniające, a najlepiej osobni użytkownicy/hosty systemu operacyjnego).
- Jeśli wielu niezaufanych użytkowników może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, traktuj ich tak, jakby współdzielili te same delegowane uprawnienia narzędziowe tego agenta.

Ta strona wyjaśnia wzmacnianie zabezpieczeń **w ramach tego modelu**. Nie deklaruje wrogiej izolacji wielodzierżawnej na jednym współdzielonym Gateway.

## Szybka kontrola: `openclaw security audit`

Zobacz też: [Weryfikacja formalna (modele bezpieczeństwa)](/pl/security/formal-verification)

Uruchamiaj to regularnie (zwłaszcza po zmianie konfiguracji lub wystawieniu powierzchni sieciowych):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` pozostaje celowo wąskie: przełącza typowe otwarte polityki grup
na listy dozwolonych, przywraca `logging.redactSensitive: "tools"`, zaostrza
uprawnienia plików stanu/konfiguracji/dołączanych plików oraz używa resetów ACL systemu Windows zamiast
POSIX `chmod`, gdy działa w systemie Windows.

Oznacza typowe pułapki (ekspozycję uwierzytelniania Gateway, ekspozycję sterowania przeglądarką, podwyższone listy dozwolonych, uprawnienia systemu plików, permisywne zatwierdzenia wykonywania oraz ekspozycję narzędzi w otwartych kanałach).

OpenClaw jest zarówno produktem, jak i eksperymentem: podpinasz zachowanie modelu frontier do prawdziwych powierzchni wiadomości i prawdziwych narzędzi. **Nie istnieje „idealnie bezpieczna” konfiguracja.** Celem jest świadome określenie:

- kto może rozmawiać z twoim botem
- gdzie bot może działać
- czego bot może dotykać

Zacznij od najmniejszego dostępu, który nadal działa, a potem rozszerzaj go w miarę nabierania zaufania.

### Wdrożenie i zaufanie do hosta

OpenClaw zakłada, że host i granica konfiguracji są zaufane:

- Jeśli ktoś może modyfikować stan/konfigurację hosta Gateway (`~/.openclaw`, w tym `openclaw.json`), traktuj tę osobę jako zaufanego operatora.
- Uruchamianie jednego Gateway dla wielu wzajemnie niezaufanych/przeciwniczych operatorów **nie jest zalecaną konfiguracją**.
- W zespołach o mieszanym zaufaniu rozdziel granice zaufania za pomocą osobnych Gateway (lub co najmniej osobnych użytkowników/hostów systemu operacyjnego).
- Zalecane ustawienie domyślne: jeden użytkownik na maszynę/host (lub VPS), jeden Gateway dla tego użytkownika i jeden lub więcej agentów w tym Gateway.
- W obrębie jednej instancji Gateway uwierzytelniony dostęp operatora jest zaufaną rolą płaszczyzny sterowania, a nie rolą dzierżawcy na użytkownika.
- Identyfikatory sesji (`sessionKey`, identyfikatory sesji, etykiety) są selektorami routingu, a nie tokenami autoryzacji.
- Jeśli kilka osób może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, każda z nich może sterować tym samym zestawem uprawnień. Izolacja sesji/pamięci na użytkownika pomaga chronić prywatność, ale nie przekształca współdzielonego agenta w autoryzację hosta na użytkownika.

### Współdzielony obszar roboczy Slack: realne ryzyko

Jeśli „każdy w Slack może wysłać wiadomość do bota”, podstawowym ryzykiem jest delegowane uprawnienie narzędziowe:

- każdy dozwolony nadawca może wywołać użycie narzędzi (`exec`, przeglądarka, narzędzia sieciowe/plikowe) w ramach polityki agenta;
- wstrzyknięcie promptu/treści od jednego nadawcy może spowodować działania wpływające na współdzielony stan, urządzenia lub wyniki;
- jeśli jeden współdzielony agent ma wrażliwe dane uwierzytelniające/pliki, każdy dozwolony nadawca może potencjalnie doprowadzić do ich eksfiltracji przez użycie narzędzi.

Używaj osobnych agentów/Gateway z minimalnymi narzędziami dla przepływów pracy zespołowej; agentów z danymi osobistymi trzymaj prywatnie.

### Agent współdzielony w firmie: akceptowalny wzorzec

Jest to akceptowalne, gdy wszyscy używający tego agenta należą do tej samej granicy zaufania (na przykład jeden zespół firmowy), a agent jest ściśle ograniczony do spraw biznesowych.

- uruchamiaj go na dedykowanej maszynie/VM/kontenerze;
- używaj dedykowanego użytkownika systemu operacyjnego + dedykowanej przeglądarki/profilu/kont dla tego środowiska uruchomieniowego;
- nie loguj tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili menedżera haseł/przeglądarki.

Jeśli mieszasz tożsamości osobiste i firmowe w tym samym środowisku uruchomieniowym, znosisz separację i zwiększasz ryzyko ekspozycji danych osobistych.

## Koncepcja zaufania Gateway i Node

Traktuj Gateway i Node jako jedną domenę zaufania operatora, z różnymi rolami:

- **Gateway** to płaszczyzna sterowania i powierzchnia polityk (`gateway.auth`, polityka narzędzi, routing).
- **Node** to powierzchnia zdalnego wykonywania sparowana z tym Gateway (polecenia, działania urządzenia, możliwości lokalne hosta).
- Wywołujący uwierzytelniony w Gateway jest zaufany w zakresie Gateway. Po sparowaniu działania Node są zaufanymi działaniami operatora na tym Node.
- Poziomy zakresu operatora i kontrole w czasie zatwierdzania podsumowano w
  [Zakresy operatora](/pl/gateway/operator-scopes).
- Bezpośredni klienci backendu local loopback uwierzytelnieni współdzielonym tokenem/hasłem Gateway
  mogą wykonywać wewnętrzne RPC płaszczyzny sterowania bez przedstawiania tożsamości urządzenia
  użytkownika. To nie jest obejście zdalnego parowania ani parowania przeglądarki: klienci sieciowi,
  klienci Node, klienci z tokenem urządzenia i jawne tożsamości urządzeń
  nadal przechodzą przez parowanie i egzekwowanie podnoszenia zakresu.
- `sessionKey` to wybór routingu/kontekstu, a nie uwierzytelnianie na użytkownika.
- Zatwierdzenia `exec` (lista dozwolonych + pytanie) są zabezpieczeniami intencji operatora, a nie wrogą izolacją wielodzierżawną.
- Domyślne ustawienie produktu OpenClaw dla zaufanych konfiguracji z jednym operatorem jest takie, że wykonywanie na hoście w `gateway`/`node` jest dozwolone bez monitów o zatwierdzenie (`security="full"`, `ask="off"`, chyba że je zaostrzysz). To ustawienie domyślne jest zamierzonym UX, a nie samo w sobie podatnością.
- Zatwierdzenia `exec` wiążą dokładny kontekst żądania i best-effort bezpośrednie lokalne operandy plików; nie modelują semantycznie każdej ścieżki ładowania środowiska uruchomieniowego/interpretera. Do silnych granic używaj sandboxingu i izolacji hosta.

Jeśli potrzebujesz izolacji wrogich użytkowników, rozdziel granice zaufania według użytkownika/hosta systemu operacyjnego i uruchamiaj osobne Gateway.

## Macierz granic zaufania

Używaj tego jako szybkiego modelu przy triage ryzyka:

| Granica lub kontrola                                      | Co oznacza                                        | Typowe błędne odczytanie                                                      |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/hasło/zaufany proxy/uwierzytelnianie urządzenia) | Uwierzytelnia wywołujących do API Gateway         | „Wymaga podpisów na wiadomość dla każdej ramki, aby było bezpieczne”          |
| `sessionKey`                                              | Klucz routingu do wyboru kontekstu/sesji          | „Klucz sesji jest granicą uwierzytelniania użytkownika”                       |
| Zabezpieczenia promptu/treści                             | Zmniejszają ryzyko nadużycia modelu               | „Samo wstrzyknięcie promptu dowodzi obejścia uwierzytelniania”                |
| `canvas.eval` / ocena w przeglądarce                      | Zamierzona możliwość operatora, gdy włączona      | „Każdy prymityw ewaluacji JS jest automatycznie podatnością w tym modelu zaufania” |
| Lokalna powłoka TUI `!`                                   | Jawne lokalne wykonanie wyzwalane przez operatora | „Wygodne lokalne polecenie powłoki jest zdalnym wstrzyknięciem”               |
| Parowanie Node i polecenia Node                           | Zdalne wykonywanie na sparowanych urządzeniach na poziomie operatora | „Zdalne sterowanie urządzeniem powinno być domyślnie traktowane jako dostęp niezaufanego użytkownika” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opcjonalna polityka rejestracji Node w zaufanej sieci | „Domyślnie wyłączona lista dozwolonych jest automatyczną podatnością parowania” |

## Nie są podatnościami z założenia

<Accordion title="Typowe zgłoszenia poza zakresem">

Te wzorce są zgłaszane często i zwykle są zamykane bez działań, chyba że
zostanie wykazane realne obejście granicy:

- Łańcuchy oparte wyłącznie na wstrzyknięciu promptu bez obejścia polityki, uwierzytelniania lub sandboxa.
- Twierdzenia zakładające wrogie działanie wielodzierżawne na jednym współdzielonym hoście lub
  konfiguracji.
- Twierdzenia klasyfikujące normalny dostęp operatora do ścieżek odczytu (na przykład
  `sessions.list` / `sessions.preview` / `chat.history`) jako IDOR w
  konfiguracji współdzielonego Gateway.
- Zgłoszenia dotyczące wdrożeń wyłącznie na localhost (na przykład HSTS na Gateway dostępnym tylko przez loopback).
- Zgłoszenia dotyczące podpisów przychodzącego Webhook Discord dla ścieżek przychodzących, które nie
  istnieją w tym repozytorium.
- Raporty traktujące metadane parowania Node jako ukrytą drugą warstwę zatwierdzeń na polecenie
  dla `system.run`, gdy rzeczywistą granicą wykonywania jest nadal
  globalna polityka poleceń Node w Gateway plus własne zatwierdzenia `exec`
  w Node.
- Raporty traktujące skonfigurowane `gateway.nodes.pairing.autoApproveCidrs` jako
  podatność samą w sobie. To ustawienie jest domyślnie wyłączone, wymaga
  jawnych wpisów CIDR/IP, dotyczy tylko pierwszego parowania `role: node` bez
  żądanych zakresów i nie zatwierdza automatycznie operatora/przeglądarki/Control UI,
  WebChat, podniesień roli, podniesień zakresu, zmian metadanych, zmian klucza publicznego
  ani ścieżek nagłówków trusted-proxy samego hosta przez loopback, chyba że uwierzytelnianie trusted-proxy przez loopback zostało jawnie włączone.
- Zgłoszenia „braku autoryzacji na użytkownika”, które traktują `sessionKey` jako
  token uwierzytelniania.

</Accordion>

## Wzmocniona konfiguracja bazowa w 60 sekund

Najpierw użyj tej konfiguracji bazowej, a potem selektywnie ponownie włączaj narzędzia dla zaufanego agenta:

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

Dzięki temu Gateway pozostaje dostępny tylko lokalnie, DM są izolowane, a narzędzia płaszczyzny sterowania/środowiska uruchomieniowego są domyślnie wyłączone.

## Szybka reguła dla współdzielonej skrzynki odbiorczej

Jeśli więcej niż jedna osoba może wysłać DM do twojego bota:

- Ustaw `session.dmScope: "per-channel-peer"` (lub `"per-account-channel-peer"` dla kanałów z wieloma kontami).
- Zachowaj `dmPolicy: "pairing"` lub ścisłe listy dozwolonych.
- Nigdy nie łącz współdzielonych DM z szerokim dostępem do narzędzi.
- To wzmacnia współpracujące/współdzielone skrzynki odbiorcze, ale nie jest zaprojektowane jako izolacja wrogich współdzierżawców, gdy użytkownicy współdzielą dostęp do zapisu na hoście/w konfiguracji.

## Model widoczności kontekstu

OpenClaw rozdziela dwie koncepcje:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`dmPolicy`, `groupPolicy`, listy dozwolonych, bramki wzmianek).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do wejścia modelu (treść odpowiedzi, cytowany tekst, historia wątku, przekazane metadane).

Listy dozwolonych bramkują wyzwalacze i autoryzację poleceń. Ustawienie `contextVisibility` kontroluje, jak filtrowany jest dodatkowy kontekst (cytowane odpowiedzi, korzenie wątków, pobrana historia):

- `contextVisibility: "all"` (domyślnie) zachowuje dodatkowy kontekst tak, jak został odebrany.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych.
- `contextVisibility: "allowlist_quote"` zachowuje się jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

Ustaw `contextVisibility` dla kanału albo dla pokoju/konwersacji. Szczegóły konfiguracji znajdziesz w [Czatach grupowych](/pl/channels/groups#context-visibility-and-allowlists).

Wskazówki dotyczące triage doradczego:

- Twierdzenia, które pokazują tylko, że „model może widzieć cytowany lub historyczny tekst od nadawców spoza listy dozwolonych”, są ustaleniami wzmacniającymi, możliwymi do obsłużenia przez `contextVisibility`, a same w sobie nie są obejściem granic uwierzytelniania ani sandboxa.
- Aby raporty miały wpływ na bezpieczeństwo, nadal muszą wykazać obejście granicy zaufania (uwierzytelniania, zasad, sandboxa, zatwierdzeń lub innej udokumentowanej granicy).

## Co sprawdza audyt (wysoki poziom)

- **Dostęp przychodzący** (zasady DM, zasady grup, listy dozwolonych): czy obce osoby mogą wywołać bota?
- **Zasięg narzędzi** (narzędzia podwyższonego ryzyka + otwarte pokoje): czy prompt injection może przerodzić się w działania na powłoce/plikach/sieci?
- **Dryf zatwierdzania exec** (`security=full`, `autoAllowSkills`, listy dozwolonych interpreterów bez `strictInlineEval`): czy zabezpieczenia wykonywania na hoście nadal robią to, czego się spodziewasz?
  - `security="full"` to szerokie ostrzeżenie o postawie bezpieczeństwa, a nie dowód błędu. Jest to wybrane ustawienie domyślne dla zaufanych konfiguracji osobistego asystenta; zaostrzaj je tylko wtedy, gdy twój model zagrożeń wymaga zatwierdzeń lub zabezpieczeń w postaci list dozwolonych.
- **Ekspozycja sieciowa** (wiązanie/uwierzytelnianie Gateway, Tailscale Serve/Funnel, słabe/krótkie tokeny uwierzytelniające).
- **Ekspozycja sterowania przeglądarką** (zdalne węzły, porty przekaźnika, zdalne punkty końcowe CDP).
- **Higiena dysku lokalnego** (uprawnienia, dowiązania symboliczne, dołączane konfiguracje, ścieżki „synchronizowanych folderów”).
- **Pluginy** (pluginy ładują się bez jawnej listy dozwolonych).
- **Dryf zasad/błędna konfiguracja** (ustawienia sandboxa Docker skonfigurowane, ale tryb sandboxa wyłączony; nieskuteczne wzorce `gateway.nodes.denyCommands`, ponieważ dopasowanie odbywa się tylko po dokładnej nazwie polecenia (na przykład `system.run`) i nie sprawdza tekstu powłoki; niebezpieczne wpisy `gateway.nodes.allowCommands`; globalne `tools.profile="minimal"` nadpisane przez profile poszczególnych agentów; narzędzia należące do pluginów osiągalne przy permisywnej polityce narzędzi).
- **Dryf oczekiwań środowiska uruchomieniowego** (na przykład założenie, że niejawne exec nadal oznacza `sandbox`, gdy `tools.exec.host` ma teraz domyślnie wartość `auto`, albo jawne ustawienie `tools.exec.host="sandbox"` przy wyłączonym trybie sandboxa).
- **Higiena modelu** (ostrzeżenie, gdy skonfigurowane modele wyglądają na przestarzałe; nie jest to twarda blokada).

Jeśli uruchomisz `--deep`, OpenClaw podejmie też najlepszą możliwą próbę sondowania Gateway na żywo.

## Mapa przechowywania danych uwierzytelniających

Użyj tego podczas audytowania dostępu lub decydowania, co uwzględnić w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: konfiguracja/env lub SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolonych parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Stan środowiska uruchomieniowego Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`

## Lista kontrolna audytu bezpieczeństwa

Gdy audyt wypisuje ustalenia, traktuj to jako kolejność priorytetów:

1. **Cokolwiek „otwartego” + włączone narzędzia**: najpierw zablokuj DM/grupy (parowanie/listy dozwolonych), potem zaostrz politykę narzędzi/sandboxing.
2. **Publiczna ekspozycja sieciowa** (wiązanie LAN, Funnel, brak uwierzytelniania): napraw natychmiast.
3. **Zdalna ekspozycja sterowania przeglądarką**: traktuj ją jak dostęp operatora (tylko tailnet, paruj węzły świadomie, unikaj publicznej ekspozycji).
4. **Uprawnienia**: upewnij się, że stan/konfiguracja/dane uwierzytelniające/uwierzytelnianie nie są czytelne dla grupy/świata.
5. **Pluginy**: ładuj tylko to, czemu jawnie ufasz.
6. **Wybór modelu**: preferuj nowoczesne modele wzmocnione instrukcjami dla każdego bota z narzędziami.

## Glosariusz audytu bezpieczeństwa

Każde ustalenie audytu jest oznaczone strukturalnym `checkId` (na przykład
`gateway.bind_no_auth` lub `tools.exec.security_full_configured`). Typowe
klasy ważności krytycznej:

- `fs.*` — uprawnienia systemu plików dla stanu, konfiguracji, danych uwierzytelniających, profili uwierzytelniania.
- `gateway.*` — tryb wiązania, uwierzytelnianie, Tailscale, Control UI, konfiguracja zaufanego proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — wzmacnianie według powierzchni.
- `plugins.*`, `skills.*` — łańcuch dostaw pluginów/Skills i ustalenia skanowania.
- `security.exposure.*` — przekrojowe sprawdzenia, w których polityka dostępu styka się z zasięgiem narzędzi.

Zobacz pełny katalog z poziomami ważności, kluczami napraw i obsługą automatycznej naprawy w
[Sprawdzenia audytu bezpieczeństwa](/pl/gateway/security/audit-checks).

## Control UI przez HTTP

Control UI potrzebuje **bezpiecznego kontekstu** (HTTPS lub localhost), aby wygenerować tożsamość
urządzenia. `gateway.controlUi.allowInsecureAuth` to lokalny przełącznik zgodności:

- Na localhost pozwala na uwierzytelnianie Control UI bez tożsamości urządzenia, gdy strona
  jest ładowana przez niezabezpieczony HTTP.
- Nie omija sprawdzeń parowania.
- Nie rozluźnia wymagań dotyczących tożsamości urządzenia zdalnego (innego niż localhost).

Preferuj HTTPS (Tailscale Serve) albo otwórz UI na `127.0.0.1`.

Tylko w scenariuszach awaryjnych `gateway.controlUi.dangerouslyDisableDeviceAuth`
całkowicie wyłącza sprawdzenia tożsamości urządzenia. To poważne obniżenie bezpieczeństwa;
pozostaw wyłączone, chyba że aktywnie debugujesz i możesz szybko cofnąć zmianę.

Niezależnie od tych niebezpiecznych flag, pomyślne `gateway.auth.mode: "trusted-proxy"`
może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia. Jest to
zamierzone zachowanie trybu uwierzytelniania, a nie skrót `allowInsecureAuth`, i nadal
nie rozszerza się na sesje Control UI z rolą węzła.

`openclaw security audit` ostrzega, gdy to ustawienie jest włączone.

## Podsumowanie niezabezpieczonych lub niebezpiecznych flag

`openclaw security audit` zgłasza `config.insecure_or_dangerous_flags`, gdy
znane niezabezpieczone/niebezpieczne przełączniki debugowania są włączone. Nie ustawiaj ich w
produkcji.

<AccordionGroup>
  <Accordion title="Flagi śledzone dziś przez audyt">
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

    Dopasowywanie nazw kanałów (kanały wbudowane i kanały pluginów; dostępne także per
    `accounts.<accountId>`, gdzie ma to zastosowanie):

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

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (także per konto)

    Sandbox Docker (wartości domyślne + per agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Konfiguracja reverse proxy

Jeśli uruchamiasz Gateway za reverse proxy (nginx, Caddy, Traefik itp.), skonfiguruj
`gateway.trustedProxies`, aby poprawnie obsługiwać przekazywany adres IP klienta.

Gdy Gateway wykryje nagłówki proxy z adresu, którego **nie ma** w `trustedProxies`, **nie** potraktuje połączeń jako klientów lokalnych. Jeśli uwierzytelnianie gatewaya jest wyłączone, takie połączenia są odrzucane. Zapobiega to obejściu uwierzytelniania, w którym połączenia przez proxy w innym przypadku wyglądałyby tak, jakby pochodziły z localhost i otrzymały automatyczne zaufanie.

`gateway.trustedProxies` zasila także `gateway.auth.mode: "trusted-proxy"`, ale ten tryb uwierzytelniania jest bardziej rygorystyczny:

- uwierzytelnianie trusted-proxy **domyślnie kończy się niepowodzeniem w sposób zamknięty dla proxy ze źródłem loopback**
- reverse proxy loopback na tym samym hoście mogą używać `gateway.trustedProxies` do wykrywania klientów lokalnych i obsługi przekazywanego IP
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

Gdy `trustedProxies` jest skonfigurowane, Gateway używa `X-Forwarded-For` do ustalenia adresu IP klienta. `X-Real-IP` jest domyślnie ignorowany, chyba że jawnie ustawiono `gateway.allowRealIpFallback: true`.

Nagłówki zaufanego proxy nie sprawiają, że parowanie urządzeń węzłów staje się automatycznie zaufane.
`gateway.nodes.pairing.autoApproveCidrs` to osobna, domyślnie wyłączona
polityka operatora. Nawet gdy jest włączona, ścieżki nagłówków trusted-proxy ze źródłem loopback
są wyłączone z automatycznego zatwierdzania węzłów, ponieważ lokalni wywołujący mogą fałszować te
nagłówki, także wtedy, gdy uwierzytelnianie trusted-proxy dla loopback jest jawnie włączone.

Dobre zachowanie reverse proxy (nadpisuj przychodzące nagłówki przekazywania):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Złe zachowanie reverse proxy (dołączaj/zachowuj niezaufane nagłówki przekazywania):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Uwagi o HSTS i origin

- Gateway OpenClaw jest przede wszystkim lokalny/loopback. Jeśli kończysz TLS na reverse proxy, ustaw HSTS na domenie HTTPS obsługiwanej przez proxy.
- Jeśli sam gateway kończy HTTPS, możesz ustawić `gateway.http.securityHeaders.strictTransportSecurity`, aby emitować nagłówek HSTS z odpowiedzi OpenClaw.
- Szczegółowe wskazówki wdrożeniowe znajdują się w [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Dla wdrożeń Control UI poza loopback `gateway.controlUi.allowedOrigins` jest domyślnie wymagane.
- `gateway.controlUi.allowedOrigins: ["*"]` to jawna polityka dopuszczająca wszystkie originy przeglądarki, a nie wzmocnione ustawienie domyślne. Unikaj jej poza ściśle kontrolowanymi testami lokalnymi.
- Błędy uwierzytelniania originu przeglądarki na loopback nadal są ograniczane limitem szybkości, nawet gdy
  ogólne wyłączenie dla loopback jest włączone, ale klucz blokady jest zakresowany per
  znormalizowana wartość `Origin` zamiast jednego wspólnego koszyka localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego originu na podstawie nagłówka Host; traktuj to jako niebezpieczną politykę wybraną przez operatora.
- Traktuj DNS rebinding i zachowanie nagłówka hosta proxy jako kwestie wzmacniania wdrożenia; trzymaj `trustedProxies` wąsko i unikaj bezpośredniego wystawiania gatewaya do publicznego internetu.

## Lokalne dzienniki sesji znajdują się na dysku

OpenClaw przechowuje transkrypty sesji na dysku w `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Jest to wymagane dla ciągłości sesji oraz (opcjonalnie) indeksowania pamięci sesji, ale oznacza też, że
**każdy proces/użytkownik z dostępem do systemu plików może czytać te dzienniki**. Traktuj dostęp do dysku jako granicę zaufania
i ogranicz uprawnienia do `~/.openclaw` (zobacz sekcję audytu poniżej). Jeśli potrzebujesz
silniejszej izolacji między agentami, uruchamiaj je pod oddzielnymi użytkownikami systemu operacyjnego lub na oddzielnych hostach.

## Wykonywanie na węźle (`system.run`)

Jeśli węzeł macOS jest sparowany, Gateway może wywołać `system.run` na tym węźle. To jest **zdalne wykonanie kodu** na Macu:

- Wymaga parowania node'a (zatwierdzenie + token).
- Parowanie node'a Gateway nie jest powierzchnią zatwierdzania dla każdego polecenia. Ustanawia tożsamość/zaufanie node'a i wydawanie tokenów.
- Gateway stosuje zgrubną globalną politykę poleceń node'a za pomocą `gateway.nodes.allowCommands` / `denyCommands`.
- Kontrolowane na Macu przez **Ustawienia → Zatwierdzenia exec** (bezpieczeństwo + pytaj + lista dozwolonych).
- Polityka `system.run` dla danego node'a to jego własny plik zatwierdzeń exec (`exec.approvals.node.*`), który może być surowszy lub luźniejszy niż globalna polityka identyfikatorów poleceń gatewaya.
- Node działający z `security="full"` i `ask="off"` działa zgodnie z domyślnym modelem zaufanego operatora. Traktuj to jako oczekiwane zachowanie, chyba że Twoje wdrożenie wyraźnie wymaga ciaśniejszego stanowiska wobec zatwierdzeń lub listy dozwolonych.
- Tryb zatwierdzania wiąże dokładny kontekst żądania oraz, gdy to możliwe, jeden konkretny operand lokalnego skryptu/pliku. Jeśli OpenClaw nie może dokładnie zidentyfikować jednego bezpośredniego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego, wykonanie oparte na zatwierdzeniu jest odrzucane zamiast obiecywać pełne pokrycie semantyczne.
- Dla `host=node` uruchomienia oparte na zatwierdzeniu zapisują także kanoniczny przygotowany
  `systemRunPlan`; późniejsze zatwierdzone przekazania ponownie używają tego zapisanego planu, a walidacja gatewaya
  odrzuca zmiany wywołującego w poleceniu/cwd/kontekście sesji po utworzeniu
  żądania zatwierdzenia.
- Jeśli nie chcesz zdalnego wykonywania, ustaw bezpieczeństwo na **deny** i usuń parowanie node'a dla tego Maca.

To rozróżnienie ma znaczenie w triage'u:

- Ponownie łączący się sparowany node reklamujący inną listę poleceń sam w sobie nie jest podatnością, jeśli globalna polityka Gateway i lokalne zatwierdzenia exec node'a nadal egzekwują rzeczywistą granicę wykonywania.
- Zgłoszenia, które traktują metadane parowania node'a jako drugą ukrytą warstwę zatwierdzania dla każdego polecenia, zwykle są pomyłką dotyczącą polityki/UX, a nie obejściem granicy bezpieczeństwa.

## Dynamiczne Skills (watcher / zdalne node'y)

OpenClaw może odświeżyć listę Skills w trakcie sesji:

- **Watcher Skills**: zmiany w `SKILL.md` mogą zaktualizować migawkę Skills przy następnej turze agenta.
- **Zdalne node'y**: podłączenie node'a macOS może sprawić, że Skills dostępne tylko dla macOS staną się kwalifikowalne (na podstawie sondowania binariów).

Traktuj foldery Skills jako **zaufany kod** i ogranicz, kto może je modyfikować.

## Model zagrożeń

Twój asystent AI może:

- Wykonywać dowolne polecenia powłoki
- Odczytywać/zapisywać pliki
- Uzyskiwać dostęp do usług sieciowych
- Wysyłać wiadomości do dowolnej osoby (jeśli dasz mu dostęp do WhatsApp)

Osoby, które do Ciebie piszą, mogą:

- Próbować nakłonić Twoją AI do robienia złych rzeczy
- Socjotechnicznie uzyskać dostęp do Twoich danych
- Sondować szczegóły infrastruktury

## Kluczowa koncepcja: kontrola dostępu przed inteligencją

Większość awarii tutaj to nie wymyślne exploity — to sytuacje typu „ktoś napisał do bota, a bot zrobił to, o co poproszono”.

Stanowisko OpenClaw:

- **Najpierw tożsamość:** zdecyduj, kto może rozmawiać z botem (parowanie DM / listy dozwolonych / jawnie „otwarte”).
- **Następnie zakres:** zdecyduj, gdzie bot może działać (listy dozwolonych grup + bramkowanie wzmiankami, narzędzia, sandboxing, uprawnienia urządzenia).
- **Model na końcu:** załóż, że modelem można manipulować; projektuj tak, aby manipulacja miała ograniczony zasięg szkód.

## Model autoryzacji poleceń

Polecenia slash i dyrektywy są honorowane tylko dla **autoryzowanych nadawców**. Autoryzacja wynika z
list dozwolonych/parowania kanału oraz `commands.useAccessGroups` (zobacz [Konfiguracja](/pl/gateway/configuration)
i [Polecenia slash](/pl/tools/slash-commands)). Jeśli lista dozwolonych kanału jest pusta albo zawiera `"*"`,
polecenia są faktycznie otwarte dla tego kanału.

`/exec` to wygodna funkcja tylko w ramach sesji dla autoryzowanych operatorów. **Nie** zapisuje konfiguracji ani
nie zmienia innych sesji.

## Ryzyko narzędzi control plane

Dwa wbudowane narzędzia mogą wprowadzać trwałe zmiany control plane:

- `gateway` może sprawdzać konfigurację za pomocą `config.schema.lookup` / `config.get` oraz wprowadzać trwałe zmiany za pomocą `config.apply`, `config.patch` i `update.run`.
- `cron` może tworzyć zaplanowane zadania, które działają dalej po zakończeniu pierwotnego czatu/zadania.

Narzędzie uruchomieniowe `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania
`tools.exec.ask` lub `tools.exec.security`; starsze aliasy `tools.bash.*` są
normalizowane do tych samych chronionych ścieżek exec przed zapisem.
Edycje `gateway config.apply` i `gateway config.patch` sterowane przez agenta
domyślnie fail-closed: tylko wąski zestaw ścieżek promptu, modelu i bramkowania wzmiankami
jest przestrajalny przez agenta. Dlatego nowe wrażliwe drzewa konfiguracji są chronione,
chyba że zostaną celowo dodane do listy dozwolonych.

Dla każdego agenta/powierzchni obsługującej niezaufaną treść domyślnie odmawiaj tych narzędzi:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokuje tylko akcje restartu. Nie wyłącza akcji konfiguracji/aktualizacji `gateway`.

## Plugins

Plugins działają **w procesie** z Gateway. Traktuj je jako zaufany kod:

- Instaluj Plugins tylko ze źródeł, którym ufasz.
- Preferuj jawne listy dozwolonych `plugins.allow`.
- Przejrzyj konfigurację Plugin przed włączeniem.
- Uruchom ponownie Gateway po zmianach Plugin.
- Jeśli instalujesz lub aktualizujesz Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), traktuj to jak uruchamianie niezaufanego kodu:
  - Ścieżka instalacji to katalog danego Plugin pod aktywnym katalogiem głównym instalacji Plugin.
  - OpenClaw uruchamia wbudowane skanowanie pod kątem niebezpiecznego kodu przed instalacją/aktualizacją. Wyniki `critical` domyślnie blokują.
  - Instalacje Plugin z npm i git uruchamiają zbieżność zależności menedżera pakietów tylko podczas jawnego przepływu instalacji/aktualizacji. Ścieżki lokalne i archiwa są traktowane jako samowystarczalne pakiety Plugin; OpenClaw kopiuje/odwołuje się do nich bez uruchamiania `npm install`.
  - Preferuj przypięte, dokładne wersje (`@scope/pkg@1.2.3`) i sprawdzaj rozpakowany kod na dysku przed włączeniem.
  - `--dangerously-force-unsafe-install` to opcja awaryjna tylko dla fałszywych alarmów wbudowanego skanowania w przepływach instalacji/aktualizacji Plugin. Nie omija blokad polityki hooka Plugin `before_install` i nie omija niepowodzeń skanowania.
  - Instalacje zależności Skills wspierane przez Gateway stosują ten sam podział na niebezpieczne/podejrzane: wbudowane wyniki `critical` blokują, chyba że wywołujący jawnie ustawi `dangerouslyForceUnsafeInstall`, podczas gdy wyniki podejrzane nadal tylko ostrzegają. `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Szczegóły: [Plugins](/pl/tools/plugin)

## Model dostępu DM: parowanie, lista dozwolonych, otwarte, wyłączone

Wszystkie obecne kanały obsługujące DM wspierają politykę DM (`dmPolicy` lub `*.dm.policy`), która bramkuje przychodzące DM **przed** przetworzeniem wiadomości:

- `pairing` (domyślnie): nieznani nadawcy otrzymują krótki kod parowania, a bot ignoruje ich wiadomość do czasu zatwierdzenia. Kody wygasają po 1 godzinie; powtarzane DM nie wyślą ponownie kodu, dopóki nie zostanie utworzone nowe żądanie. Oczekujące żądania są domyślnie ograniczone do **3 na kanał**.
- `allowlist`: nieznani nadawcy są blokowani (bez uzgadniania parowania).
- `open`: pozwala każdemu wysłać DM (publiczne). **Wymaga**, aby lista dozwolonych kanału zawierała `"*"` (jawna zgoda).
- `disabled`: całkowicie ignoruje przychodzące DM.

Zatwierdź przez CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Szczegóły + pliki na dysku: [Parowanie](/pl/channels/pairing)

## Izolacja sesji DM (tryb wielu użytkowników)

Domyślnie OpenClaw kieruje **wszystkie DM do sesji głównej**, aby Twój asystent miał ciągłość między urządzeniami i kanałami. Jeśli **wiele osób** może wysyłać DM do bota (otwarte DM albo lista dozwolonych obejmująca wiele osób), rozważ izolację sesji DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Zapobiega to wyciekom kontekstu między użytkownikami, zachowując izolację czatów grupowych.

To granica kontekstu wiadomości, a nie granica administratora hosta. Jeśli użytkownicy są wzajemnie antagonistyczni i współdzielą tego samego hosta/konfigurację Gateway, zamiast tego uruchom osobne gatewaye dla każdej granicy zaufania.

### Bezpieczny tryb DM (zalecany)

Traktuj powyższy fragment jako **bezpieczny tryb DM**:

- Domyślnie: `session.dmScope: "main"` (wszystkie DM współdzielą jedną sesję dla ciągłości).
- Domyślne lokalne wdrażanie CLI: zapisuje `session.dmScope: "per-channel-peer"`, gdy wartość nie jest ustawiona (zachowuje istniejące jawne wartości).
- Bezpieczny tryb DM: `session.dmScope: "per-channel-peer"` (każda para kanał+nadawca otrzymuje izolowany kontekst DM).
- Izolacja peerów między kanałami: `session.dmScope: "per-peer"` (każdy nadawca otrzymuje jedną sesję we wszystkich kanałach tego samego typu).

Jeśli uruchamiasz wiele kont na tym samym kanale, użyj zamiast tego `per-account-channel-peer`. Jeśli ta sama osoba kontaktuje się z Tobą na wielu kanałach, użyj `session.identityLinks`, aby zwinąć te sesje DM do jednej kanonicznej tożsamości. Zobacz [Zarządzanie sesjami](/pl/concepts/session) i [Konfiguracja](/pl/gateway/configuration).

## Listy dozwolonych dla DM i grup

OpenClaw ma dwie oddzielne warstwy „kto może mnie wyzwolić?”:

- **Lista dozwolonych DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; starsze: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): kto może rozmawiać z botem w wiadomościach bezpośrednich.
  - Gdy `dmPolicy="pairing"`, zatwierdzenia są zapisywane w magazynie listy dozwolonych parowania o zakresie konta pod `~/.openclaw/credentials/` (`<channel>-allowFrom.json` dla konta domyślnego, `<channel>-<accountId>-allowFrom.json` dla kont innych niż domyślne), scalanym z listami dozwolonych w konfiguracji.
- **Lista dozwolonych grup** (specyficzna dla kanału): z których grup/kanałów/gildii bot w ogóle będzie akceptować wiadomości.
  - Typowe wzorce:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: domyślne ustawienia dla grup, takie jak `requireMention`; po ustawieniu działa to także jako lista dozwolonych grup (dodaj `"*"`, aby zachować zachowanie zezwalania wszystkim).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: ogranicza, kto może wyzwolić bota _wewnątrz_ sesji grupowej (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: listy dozwolonych dla powierzchni + domyślne wzmianki.
  - Sprawdzenia grup przebiegają w tej kolejności: najpierw `groupPolicy`/listy dozwolonych grup, potem aktywacja wzmianką/odpowiedzią.
  - Odpowiedź na wiadomość bota (niejawna wzmianka) **nie** omija list dozwolonych nadawców, takich jak `groupAllowFrom`.
  - **Uwaga dotycząca bezpieczeństwa:** traktuj `dmPolicy="open"` i `groupPolicy="open"` jako ustawienia ostatniej szansy. Powinny być używane bardzo rzadko; preferuj parowanie + listy dozwolonych, chyba że w pełni ufasz każdemu członkowi pokoju.

Szczegóły: [Konfiguracja](/pl/gateway/configuration) i [Grupy](/pl/channels/groups)

## Prompt injection (czym jest i dlaczego ma znaczenie)

Prompt injection występuje wtedy, gdy atakujący tworzy wiadomość, która manipuluje modelem, aby zrobił coś niebezpiecznego („zignoruj instrukcje”, „zrzuć swój system plików”, „otwórz ten link i uruchom polecenia” itd.).

Nawet przy silnych promptach systemowych **prompt injection nie jest rozwiązany**. Zabezpieczenia promptu systemowego są tylko miękkimi wskazówkami; twarde egzekwowanie pochodzi z polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów (a operatorzy mogą je celowo wyłączyć). Co pomaga w praktyce:

- Utrzymuj przychodzące DM-y pod ścisłą kontrolą (parowanie/listy dozwolonych).
- W grupach preferuj wymaganie wzmianki; unikaj botów działających stale w pokojach publicznych.
- Traktuj linki, załączniki i wklejone instrukcje domyślnie jako wrogie.
- Uruchamiaj wykonywanie wrażliwych narzędzi w piaskownicy; trzymaj sekrety poza systemem plików dostępnym dla agenta.
- Uwaga: izolacja w piaskownicy jest opcjonalna. Jeśli tryb piaskownicy jest wyłączony, niejawne `host=auto` rozwiązuje się do hosta Gateway. Jawne `host=sandbox` nadal kończy się bezpieczną odmową, ponieważ środowisko uruchomieniowe piaskownicy nie jest dostępne. Ustaw `host=gateway`, jeśli chcesz, aby to zachowanie było jawne w konfiguracji.
- Ogranicz narzędzia wysokiego ryzyka (`exec`, `browser`, `web_fetch`, `web_search`) do zaufanych agentów lub jawnych list dozwolonych.
- Jeśli dodajesz interpretery do listy dozwolonych (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), włącz `tools.exec.strictInlineEval`, aby formy inline eval nadal wymagały jawnej zgody.
- Analiza zatwierdzania powłoki odrzuca również formy rozwinięcia parametrów POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) wewnątrz **niecytowanych heredoców**, więc treść heredoca z listy dozwolonych nie może przemycić rozwinięcia powłoki przez przegląd listy dozwolonych jako zwykłego tekstu. Zacytuj terminator heredoca (na przykład `<<'EOF'`), aby wybrać semantykę treści literalnej; niecytowane heredoki, które rozszerzałyby zmienne, są odrzucane.
- **Wybór modelu ma znaczenie:** starsze/mniejsze/przestarzałe modele są znacząco mniej odporne na prompt injection i niewłaściwe użycie narzędzi. Dla agentów z włączonymi narzędziami używaj najsilniejszego dostępnego modelu najnowszej generacji, wzmocnionego pod kątem instrukcji.

Sygnały ostrzegawcze, które należy traktować jako niezaufane:

- „Przeczytaj ten plik/URL i zrób dokładnie to, co mówi.”
- „Zignoruj swój prompt systemowy lub reguły bezpieczeństwa.”
- „Ujawnij swoje ukryte instrukcje lub wyniki narzędzi.”
- „Wklej pełną zawartość ~/.openclaw albo swoich logów.”

## Sanityzacja tokenów specjalnych w treści zewnętrznej

OpenClaw usuwa typowe literały tokenów specjalnych szablonów czatu LLM hostowanych samodzielnie z opakowanej treści zewnętrznej i metadanych, zanim dotrą do modelu. Obsługiwane rodziny znaczników obejmują tokeny ról/tur Qwen/ChatML, Llama, Gemma, Mistral, Phi i GPT-OSS.

Dlaczego:

- Backend kompatybilny z OpenAI, który frontuje modele hostowane samodzielnie, czasami zachowuje tokeny specjalne pojawiające się w tekście użytkownika zamiast je maskować. Atakujący, który może zapisać dane w przychodzącej treści zewnętrznej (pobranej stronie, treści e-maila, wyniku narzędzia odczytu pliku), mógłby w innym przypadku wstrzyknąć syntetyczną granicę roli `assistant` lub `system` i obejść zabezpieczenia opakowanej treści.
- Sanityzacja odbywa się w warstwie opakowywania treści zewnętrznej, więc działa jednolicie dla narzędzi pobierania/odczytu oraz przychodzącej treści kanałów, zamiast być zależna od dostawcy.
- Wychodzące odpowiedzi modelu mają już osobny sanitizer, który usuwa wyciekłe `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` i podobne wewnętrzne rusztowanie środowiska uruchomieniowego z odpowiedzi widocznych dla użytkownika na końcowej granicy dostarczania kanału. Sanitizer treści zewnętrznej jest jego przychodzącym odpowiednikiem.

Nie zastępuje to innych zabezpieczeń z tej strony — `dmPolicy`, listy dozwolonych, zatwierdzania exec, izolacja w piaskownicy i `contextVisibility` nadal wykonują podstawową pracę. Zamyka jedno konkretne obejście w warstwie tokenizera przeciwko stosom hostowanym samodzielnie, które przekazują tekst użytkownika z nienaruszonymi tokenami specjalnymi.

## Niebezpieczne flagi obejścia treści zewnętrznej

OpenClaw zawiera jawne flagi obejścia, które wyłączają bezpieczne opakowywanie treści zewnętrznej:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Pole ładunku Cron `allowUnsafeExternalContent`

Wskazówki:

- W produkcji pozostaw je nieustawione/fałszywe.
- Włączaj je tylko tymczasowo do ściśle ograniczonego debugowania.
- Jeśli są włączone, odizoluj tego agenta (piaskownica + minimalne narzędzia + dedykowana przestrzeń nazw sesji).

Uwaga o ryzyku hooków:

- Ładunki hooków są treścią niezaufaną, nawet gdy dostarczają je systemy, które kontrolujesz (poczta/dokumenty/treść webowa mogą przenosić prompt injection).
- Słabsze klasy modeli zwiększają to ryzyko. W automatyzacji sterowanej hookami preferuj silne współczesne klasy modeli i utrzymuj ścisłą politykę narzędzi (`tools.profile: "messaging"` lub bardziej restrykcyjną), a tam, gdzie to możliwe, także izolację w piaskownicy.

### Prompt injection nie wymaga publicznych DM-ów

Nawet jeśli **tylko ty** możesz wysyłać wiadomości do bota, prompt injection nadal może nastąpić przez
dowolną **niezaufaną treść**, którą bot odczytuje (wyniki wyszukiwania/pobierania z sieci, strony przeglądarki,
e-maile, dokumenty, załączniki, wklejone logi/kod). Innymi słowy: nadawca nie jest
jedyną powierzchnią zagrożenia; **sama treść** może przenosić instrukcje przeciwnika.

Gdy narzędzia są włączone, typowe ryzyko polega na eksfiltracji kontekstu lub wywołaniu
narzędzi. Zmniejsz promień rażenia przez:

- Użycie tylko do odczytu albo pozbawionego narzędzi **agenta czytającego** do streszczania niezaufanej treści,
  a następnie przekazanie streszczenia do głównego agenta.
- Wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami, chyba że są potrzebne.
- Dla wejść URL OpenResponses (`input_file` / `input_image`) ustaw ścisłe
  `gateway.http.endpoints.responses.files.urlAllowlist` oraz
  `gateway.http.endpoints.responses.images.urlAllowlist`, a `maxUrlParts` utrzymuj na niskim poziomie.
  Puste listy dozwolonych są traktowane jak nieustawione; użyj `files.allowUrl: false` / `images.allowUrl: false`,
  jeśli chcesz całkowicie wyłączyć pobieranie URL-i.
- Dla wejść plików OpenResponses zdekodowany tekst `input_file` nadal jest wstrzykiwany jako
  **niezaufana treść zewnętrzna**. Nie zakładaj, że tekst pliku jest zaufany tylko dlatego,
  że Gateway zdekodował go lokalnie. Wstrzyknięty blok nadal niesie jawne
  znaczniki granic `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` oraz metadane `Source: External`,
  mimo że ta ścieżka pomija dłuższy baner `SECURITY NOTICE:`.
- To samo opakowywanie oparte na znacznikach jest stosowane, gdy rozumienie mediów wyodrębnia tekst
  z załączonych dokumentów przed dodaniem tego tekstu do promptu mediów.
- Włączenie izolacji w piaskownicy i ścisłych list dozwolonych narzędzi dla każdego agenta, który dotyka niezaufanego wejścia.
- Trzymanie sekretów poza promptami; przekazuj je zamiast tego przez env/konfigurację na hoście Gateway.

### Backendy LLM hostowane samodzielnie

Backendy hostowane samodzielnie kompatybilne z OpenAI, takie jak vLLM, SGLang, TGI, LM Studio,
albo niestandardowe stosy tokenizerów Hugging Face, mogą różnić się od dostawców hostowanych tym, jak
obsługiwane są tokeny specjalne szablonów czatu. Jeśli backend tokenizuje literały tekstowe,
takie jak `<|im_start|>`, `<|start_header_id|>` lub `<start_of_turn>`, jako
strukturalne tokeny szablonu czatu wewnątrz treści użytkownika, niezaufany tekst może próbować
fałszować granice ról w warstwie tokenizera.

OpenClaw usuwa typowe literały tokenów specjalnych rodzin modeli z opakowanej
treści zewnętrznej przed wysłaniem jej do modelu. Pozostaw opakowywanie treści zewnętrznej
włączone i preferuj ustawienia backendu, które rozdzielają lub escapują tokeny specjalne
w treści dostarczonej przez użytkownika, gdy są dostępne. Dostawcy hostowani, tacy jak OpenAI
i Anthropic, stosują już własną sanityzację po stronie żądania.

### Siła modelu (uwaga bezpieczeństwa)

Odporność na prompt injection **nie** jest jednolita w różnych klasach modeli. Mniejsze/tańsze modele są zwykle bardziej podatne na niewłaściwe użycie narzędzi i przejęcie instrukcji, zwłaszcza przy promptach przeciwnika.

<Warning>
Dla agentów z włączonymi narzędziami lub agentów czytających niezaufaną treść ryzyko prompt injection w starszych/mniejszych modelach jest często zbyt wysokie. Nie uruchamiaj takich obciążeń na słabych klasach modeli.
</Warning>

Zalecenia:

- **Używaj modelu najnowszej generacji i najlepszej klasy** dla każdego bota, który może uruchamiać narzędzia lub dotykać plików/sieci.
- **Nie używaj starszych/słabszych/mniejszych klas** dla agentów z włączonymi narzędziami ani niezaufanych skrzynek odbiorczych; ryzyko prompt injection jest zbyt wysokie.
- Jeśli musisz użyć mniejszego modelu, **zmniejsz promień rażenia** (narzędzia tylko do odczytu, silna izolacja w piaskownicy, minimalny dostęp do systemu plików, ścisłe listy dozwolonych).
- Podczas uruchamiania małych modeli **włącz izolację w piaskownicy dla wszystkich sesji** i **wyłącz web_search/web_fetch/browser**, chyba że wejścia są ściśle kontrolowane.
- Dla osobistych asystentów wyłącznie czatowych z zaufanym wejściem i bez narzędzi mniejsze modele są zwykle w porządku.

## Reasoning i szczegółowe dane wyjściowe w grupach

`/reasoning`, `/verbose` i `/trace` mogą ujawniać wewnętrzne rozumowanie, wynik narzędzia
albo diagnostykę pluginów, które
nie były przeznaczone dla kanału publicznego. W ustawieniach grupowych traktuj je jako **tylko do debugowania**
i pozostaw wyłączone, chyba że jawnie ich potrzebujesz.

Wskazówki:

- Pozostaw `/reasoning`, `/verbose` i `/trace` wyłączone w pokojach publicznych.
- Jeśli je włączasz, rób to tylko w zaufanych DM-ach albo ściśle kontrolowanych pokojach.
- Pamiętaj: szczegółowe dane wyjściowe i trace mogą zawierać argumenty narzędzi, URL-e, diagnostykę pluginów i dane, które widział model.

## Przykłady wzmacniania konfiguracji

### Uprawnienia plików

Utrzymuj konfigurację i stan jako prywatne na hoście Gateway:

- `~/.openclaw/openclaw.json`: `600` (tylko odczyt/zapis użytkownika)
- `~/.openclaw`: `700` (tylko użytkownik)

`openclaw doctor` może ostrzec i zaproponować zaostrzenie tych uprawnień.

### Ekspozycja sieciowa (bind, port, zapora)

Gateway multipleksuje **WebSocket + HTTP** na jednym porcie:

- Domyślnie: `18789`
- Konfiguracja/flagi/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ta powierzchnia HTTP obejmuje Control UI i host canvas:

- Control UI (zasoby SPA) (domyślna ścieżka bazowa `/`)
- Host canvas: `/__openclaw__/canvas/` i `/__openclaw__/a2ui/` (dowolny HTML/JS; traktuj jako niezaufaną treść)

Jeśli ładujesz treść canvas w zwykłej przeglądarce, traktuj ją jak każdą inną niezaufaną stronę webową:

- Nie wystawiaj hosta canvas na niezaufane sieci/użytkowników.
- Nie sprawiaj, aby treść canvas współdzieliła to samo origin z uprzywilejowanymi powierzchniami webowymi, chyba że w pełni rozumiesz konsekwencje.

Tryb bind kontroluje, gdzie Gateway nasłuchuje:

- `gateway.bind: "loopback"` (domyślnie): łączyć mogą się tylko klienci lokalni.
- Bindy inne niż local loopback (`"lan"`, `"tailnet"`, `"custom"`) rozszerzają powierzchnię ataku. Używaj ich tylko z uwierzytelnianiem Gateway (wspólny token/hasło albo poprawnie skonfigurowany zaufany proxy) i prawdziwą zaporą.

Reguły praktyczne:

- Preferuj Tailscale Serve zamiast bindów LAN (Serve utrzymuje Gateway na local loopback, a Tailscale obsługuje dostęp).
- Jeśli musisz bindować do LAN, ogranicz port zaporą do ścisłej listy dozwolonych źródłowych adresów IP; nie przekierowuj go szeroko.
- Nigdy nie wystawiaj Gateway bez uwierzytelnienia na `0.0.0.0`.

### Publikowanie portów Dockera z UFW

Jeśli uruchamiasz OpenClaw z Dockerem na VPS, pamiętaj, że opublikowane porty kontenerów
(`-p HOST:CONTAINER` albo Compose `ports:`) są routowane przez łańcuchy przekazywania Dockera,
a nie tylko przez reguły hosta `INPUT`.

Aby ruch Dockera był zgodny z polityką zapory, wymuszaj reguły w
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

IPv6 ma osobne tabele. Dodaj pasującą politykę w `/etc/ufw/after6.rules`, jeśli
IPv6 Dockera jest włączony.

Unikaj hardkodowania nazw interfejsów, takich jak `eth0`, we fragmentach dokumentacji. Nazwy interfejsów
różnią się między obrazami VPS (`ens3`, `enp*` itd.), a niedopasowania mogą przypadkowo
pominąć regułę odmowy.

Szybka walidacja po przeładowaniu:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Oczekiwane porty zewnętrzne powinny być tylko tymi, które celowo wystawiasz (dla większości
konfiguracji: SSH + porty reverse proxy).

### Wykrywanie mDNS/Bonjour

Gdy dołączony plugin `bonjour` jest włączony, Gateway rozgłasza swoją obecność przez mDNS (`_openclaw-gw._tcp` na porcie 5353) na potrzeby wykrywania lokalnych urządzeń. W trybie pełnym obejmuje to rekordy TXT, które mogą ujawniać szczegóły operacyjne:

- `cliPath`: pełna ścieżka systemu plików do pliku binarnego CLI (ujawnia nazwę użytkownika i lokalizację instalacji)
- `sshPort`: ogłasza dostępność SSH na hoście
- `displayName`, `lanHost`: informacje o nazwie hosta

**Kwestia bezpieczeństwa operacyjnego:** Rozgłaszanie szczegółów infrastruktury ułatwia rekonesans każdemu w sieci lokalnej. Nawet „nieszkodliwe” informacje, takie jak ścieżki systemu plików i dostępność SSH, pomagają atakującym mapować środowisko.

**Zalecenia:**

1. **Pozostaw Bonjour wyłączony, chyba że potrzebne jest wykrywanie w sieci LAN.** Bonjour uruchamia się automatycznie na hostach macOS, a w innych miejscach wymaga jawnego włączenia; bezpośrednie adresy URL Gateway, Tailnet, SSH lub szerokoobszarowe DNS-SD pozwalają uniknąć lokalnego multicastu.

2. **Tryb minimalny** (domyślny, gdy Bonjour jest włączony; zalecany dla wystawionych gatewayów): pomijaj wrażliwe pola w rozgłoszeniach mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Wyłącz tryb mDNS**, jeśli chcesz pozostawić plugin włączony, ale zablokować wykrywanie urządzeń lokalnych:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Tryb pełny** (jawnie włączany): uwzględnia `cliPath` + `sshPort` w rekordach TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Zmienna środowiskowa** (alternatywa): ustaw `OPENCLAW_DISABLE_BONJOUR=1`, aby wyłączyć mDNS bez zmian w konfiguracji.

Gdy Bonjour jest włączony w trybie minimalnym, Gateway rozgłasza dane wystarczające do wykrywania urządzeń (`role`, `gatewayPort`, `transport`), ale pomija `cliPath` i `sshPort`. Aplikacje, które potrzebują informacji o ścieżce CLI, mogą zamiast tego pobrać ją przez uwierzytelnione połączenie WebSocket.

### Zabezpiecz WebSocket Gateway (uwierzytelnianie lokalne)

Uwierzytelnianie Gateway jest **domyślnie wymagane**. Jeśli nie skonfigurowano prawidłowej ścieżki uwierzytelniania gatewaya,
Gateway odrzuca połączenia WebSocket (zamyka się bezpiecznie).

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

Doctor może wygenerować go za Ciebie: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` i `gateway.remote.password` są źródłami poświadczeń klienta. Same w sobie **nie** chronią lokalnego dostępu WS. Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako opcji zapasowej tylko wtedy, gdy `gateway.auth.*` nie jest ustawione. Jeśli `gateway.auth.token` lub `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie można go rozwiązać, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalną opcję zapasową).
</Note>
Opcjonalnie: przypnij zdalny TLS za pomocą `gateway.remote.tlsFingerprint`, gdy używasz `wss://`.
Tekst jawny `ws://` jest domyślnie ograniczony do loopback. Dla zaufanych ścieżek w sieci prywatnej
ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
awaryjne obejście. Celowo jest to wyłącznie środowisko procesu, a nie
klucz konfiguracji `openclaw.json`.
Parowanie mobilne oraz ręczne lub skanowane trasy gatewaya na Androidzie są bardziej rygorystyczne:
tekst jawny jest akceptowany dla loopback, ale hosty private-LAN, link-local, `.local` i
nazwy hostów bez kropki muszą używać TLS, chyba że jawnie wybierzesz zaufaną
ścieżkę tekstu jawnego w sieci prywatnej.

Parowanie urządzeń lokalnych:

- Parowanie urządzeń jest automatycznie zatwierdzane dla bezpośrednich połączeń local loopback, aby
  klienci na tym samym hoście działali płynnie.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalną dla backendu/kontenera,
  przeznaczoną dla zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia Tailnet i LAN, w tym powiązania tailnet na tym samym hoście, są traktowane jako
  zdalne na potrzeby parowania i nadal wymagają zatwierdzenia.
- Dowody z nagłówków przekazujących w żądaniu loopback wykluczają lokalność loopback.
  Automatyczne zatwierdzanie podniesienia metadanych ma wąski zakres. Zobacz
  [Parowanie Gateway](/pl/gateway/pairing), aby poznać obie reguły.

Tryby uwierzytelniania:

- `gateway.auth.mode: "token"`: współdzielony token bearer (zalecane w większości konfiguracji).
- `gateway.auth.mode: "password"`: uwierzytelnianie hasłem (zalecane ustawianie przez env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: zaufanie reverse proxy świadomemu tożsamości, które uwierzytelnia użytkowników i przekazuje tożsamość w nagłówkach (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)).

Lista kontrolna rotacji (token/hasło):

1. Wygeneruj/ustaw nowy sekret (`gateway.auth.token` lub `OPENCLAW_GATEWAY_PASSWORD`).
2. Uruchom ponownie Gateway (albo uruchom ponownie aplikację macOS, jeśli nadzoruje Gateway).
3. Zaktualizuj wszystkich klientów zdalnych (`gateway.remote.token` / `.password` na maszynach, które wywołują Gateway).
4. Sprawdź, że nie możesz już połączyć się przy użyciu starych poświadczeń.

### Nagłówki tożsamości Tailscale Serve

Gdy `gateway.auth.allowTailscale` ma wartość `true` (domyślnie dla Serve), OpenClaw
akceptuje nagłówki tożsamości Tailscale Serve (`tailscale-user-login`) do uwierzytelniania Control
UI/WebSocket. OpenClaw weryfikuje tożsamość, rozwiązując adres
`x-forwarded-for` przez lokalnego demona Tailscale (`tailscale whois`)
i dopasowując go do nagłówka. Uruchamia się to tylko dla żądań trafiających na loopback
i zawierających `x-forwarded-for`, `x-forwarded-proto` oraz `x-forwarded-host` zgodnie z
wstrzyknięciem przez Tailscale.
Dla tej asynchronicznej ścieżki sprawdzania tożsamości nieudane próby dla tego samego `{scope, ip}`
są serializowane, zanim limiter zarejestruje niepowodzenie. Równoczesne błędne ponowienia
od jednego klienta Serve mogą więc natychmiast zablokować drugą próbę
zamiast przejść równolegle jako dwa zwykłe niedopasowania.
Punkty końcowe HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania nagłówkami tożsamości Tailscale. Nadal stosują skonfigurowany
tryb uwierzytelniania HTTP gatewaya.

Ważna uwaga o granicach:

- Uwierzytelnianie bearer HTTP Gateway jest w praktyce pełnym dostępem operatora albo brakiem dostępu.
- Traktuj poświadczenia, które mogą wywoływać `/v1/chat/completions`, `/v1/responses` lub `/api/channels/*`, jako sekrety operatora z pełnym dostępem do tego gatewaya.
- Na powierzchni HTTP zgodnej z OpenAI uwierzytelnianie bearer współdzielonym sekretem przywraca pełny domyślny zestaw zakresów operatora (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) oraz semantykę właściciela dla tur agenta; węższe wartości `x-openclaw-scopes` nie ograniczają tej ścieżki współdzielonego sekretu.
- Semantyka zakresów per żądanie w HTTP ma zastosowanie tylko wtedy, gdy żądanie pochodzi z trybu niosącego tożsamość, takiego jak uwierzytelnianie zaufanego proxy albo `gateway.auth.mode="none"` na prywatnym wejściu.
- W tych trybach niosących tożsamość pominięcie `x-openclaw-scopes` powoduje powrót do normalnego domyślnego zestawu zakresów operatora; wyślij nagłówek jawnie, gdy chcesz węższy zestaw zakresów.
- `/tools/invoke` stosuje tę samą regułę współdzielonego sekretu: uwierzytelnianie bearer tokenem/hasłem również jest tam traktowane jako pełny dostęp operatora, podczas gdy tryby niosące tożsamość nadal respektują zadeklarowane zakresy.
- Nie udostępniaj tych poświadczeń niezaufanym wywołującym; preferuj osobne gatewaye dla każdej granicy zaufania.

**Założenie zaufania:** uwierzytelnianie Serve bez tokena zakłada, że host gatewaya jest zaufany.
Nie traktuj tego jako ochrony przed wrogimi procesami na tym samym hoście. Jeśli niezaufany
kod lokalny może działać na hoście gatewaya, wyłącz `gateway.auth.allowTailscale`
i wymagaj jawnego uwierzytelniania współdzielonym sekretem za pomocą `gateway.auth.mode: "token"` lub
`"password"`.

**Reguła bezpieczeństwa:** nie przekazuj tych nagłówków z własnego reverse proxy. Jeśli
kończysz TLS lub używasz proxy przed gatewayem, wyłącz
`gateway.auth.allowTailscale` i zamiast tego użyj uwierzytelniania współdzielonym sekretem (`gateway.auth.mode:
"token"` lub `"password"`) albo [Uwierzytelniania zaufanego proxy](/pl/gateway/trusted-proxy-auth).

Zaufane proxy:

- Jeśli kończysz TLS przed Gateway, ustaw `gateway.trustedProxies` na adresy IP swojego proxy.
- OpenClaw będzie ufać `x-forwarded-for` (lub `x-real-ip`) z tych adresów IP, aby określić adres IP klienta na potrzeby lokalnych kontroli parowania oraz kontroli uwierzytelniania HTTP/lokalnych.
- Upewnij się, że proxy **nadpisuje** `x-forwarded-for` i blokuje bezpośredni dostęp do portu Gateway.

Zobacz [Tailscale](/pl/gateway/tailscale) i [Omówienie sieci web](/pl/web).

### Sterowanie przeglądarką przez host Node (zalecane)

Jeśli Gateway jest zdalny, ale przeglądarka działa na innej maszynie, uruchom **host Node**
na maszynie przeglądarki i pozwól Gateway pośredniczyć w akcjach przeglądarki (zobacz [Narzędzie przeglądarki](/pl/tools/browser)).
Traktuj parowanie węzła jak dostęp administratora.

Zalecany wzorzec:

- Utrzymuj Gateway i host Node w tym samym tailnet (Tailscale).
- Sparuj węzeł świadomie; wyłącz trasowanie proxy przeglądarki, jeśli go nie potrzebujesz.

Unikaj:

- Wystawiania portów relay/control przez LAN lub publiczny Internet.
- Tailscale Funnel dla punktów końcowych sterowania przeglądarką (publiczna ekspozycja).

### Sekrety na dysku

Zakładaj, że wszystko pod `~/.openclaw/` (lub `$OPENCLAW_STATE_DIR/`) może zawierać sekrety lub dane prywatne:

- `openclaw.json`: konfiguracja może zawierać tokeny (gateway, zdalny gateway), ustawienia providerów i listy dozwolonych.
- `credentials/**`: poświadczenia kanałów (przykład: poświadczenia WhatsApp), listy dozwolone parowania, starsze importy OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: klucze API, profile tokenów, tokeny OAuth oraz opcjonalne `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: konto serwera aplikacji Codex per agent, konfiguracja, Skills, pluginy, natywny stan wątków i diagnostyka.
- `secrets.json` (opcjonalnie): ładunek sekretu oparty na pliku używany przez providery SecretRef typu `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: starszy plik zgodności. Statyczne wpisy `api_key` są czyszczone po wykryciu.
- `agents/<agentId>/sessions/**`: transkrypty sesji (`*.jsonl`) + metadane routingu (`sessions.json`), które mogą zawierać prywatne wiadomości i dane wyjściowe narzędzi.
- dołączone pakiety pluginów: zainstalowane pluginy (wraz z ich `node_modules/`).
- `sandboxes/**`: przestrzenie robocze piaskownic narzędzi; mogą gromadzić kopie plików odczytywanych/zapisywanych w piaskownicy.

Wskazówki wzmacniające zabezpieczenia:

- Utrzymuj ścisłe uprawnienia (`700` dla katalogów, `600` dla plików).
- Używaj pełnego szyfrowania dysku na hoście gatewaya.
- Preferuj dedykowane konto użytkownika systemu operacyjnego dla Gateway, jeśli host jest współdzielony.

### Pliki `.env` w workspace

OpenClaw ładuje lokalne dla workspace pliki `.env` dla agentów i narzędzi, ale nigdy nie pozwala tym plikom po cichu nadpisać kontroli środowiska uruchomieniowego gatewaya.

- Każdy klucz zaczynający się od `OPENCLAW_*` jest blokowany w niezaufanych plikach `.env` workspace.
- Ustawienia punktów końcowych kanałów dla Matrix, Mattermost, IRC i Synology Chat są również blokowane przed nadpisaniami z plików `.env` workspace, więc sklonowane workspace nie mogą przekierowywać ruchu dołączonych konektorów przez lokalną konfigurację punktów końcowych. Klucze env punktów końcowych (takie jak `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) muszą pochodzić ze środowiska procesu gatewaya lub `env.shellEnv`, a nie z pliku `.env` ładowanego z workspace.
- Blokada działa w trybie fail-closed: nowa zmienna kontroli środowiska uruchomieniowego dodana w przyszłym wydaniu nie może zostać odziedziczona z zaewidencjonowanego lub dostarczonego przez atakującego pliku `.env`; klucz jest ignorowany, a gateway zachowuje własną wartość.
- Zaufane zmienne środowiskowe procesu/systemu operacyjnego (własna powłoka gatewaya, jednostka launchd/systemd, pakiet aplikacji) nadal obowiązują — ogranicza to tylko ładowanie plików `.env`.

Dlaczego: pliki `.env` workspace często znajdują się obok kodu agenta, bywają przypadkowo commitowane albo zapisywane przez narzędzia. Zablokowanie całego prefiksu `OPENCLAW_*` oznacza, że dodanie później nowej flagi `OPENCLAW_*` nigdy nie spowoduje regresji w postaci cichego dziedziczenia ze stanu workspace.

### Logi i transkrypty (redakcja i retencja)

Logi i transkrypty mogą ujawniać wrażliwe informacje nawet wtedy, gdy kontrole dostępu są prawidłowe:

- Logi Gateway mogą zawierać podsumowania narzędzi, błędy i adresy URL.
- Transkrypty sesji mogą zawierać wklejone sekrety, zawartość plików, dane wyjściowe poleceń i linki.

Zalecenia:

- Pozostaw redakcję logów i transkryptów włączoną (`logging.redactSensitive: "tools"`; domyślnie).
- Dodaj własne wzorce dla swojego środowiska przez `logging.redactPatterns` (tokeny, nazwy hostów, wewnętrzne adresy URL).
- Przy udostępnianiu diagnostyki preferuj `openclaw status --all` (łatwe do wklejenia, zredagowane sekrety) zamiast surowych logów.
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

W czatach grupowych odpowiadaj tylko wtedy, gdy pojawi się wyraźna wzmianka.

### Osobne numery (WhatsApp, Signal, Telegram)

W przypadku kanałów opartych na numerach telefonów rozważ uruchomienie swojej AI na numerze telefonu innym niż prywatny:

- Numer prywatny: Twoje rozmowy pozostają prywatne
- Numer bota: AI obsługuje te rozmowy z odpowiednimi granicami

### Tryb tylko do odczytu (przez sandbox i narzędzia)

Możesz zbudować profil tylko do odczytu, łącząc:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (lub `"none"` bez dostępu do obszaru roboczego)
- listy dozwolonych/zablokowanych narzędzi, które blokują `write`, `edit`, `apply_patch`, `exec`, `process` itd.

Dodatkowe opcje utwardzania:

- `tools.exec.applyPatch.workspaceOnly: true` (domyślnie): zapewnia, że `apply_patch` nie może zapisywać/usuwać poza katalogiem obszaru roboczego nawet wtedy, gdy sandboxing jest wyłączony. Ustaw na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` dotykał plików poza obszarem roboczym.
- `tools.fs.workspaceOnly: true` (opcjonalnie): ogranicza ścieżki `read`/`write`/`edit`/`apply_patch` oraz ścieżki automatycznego ładowania obrazów z natywnego promptu do katalogu obszaru roboczego (przydatne, jeśli obecnie dopuszczasz ścieżki bezwzględne i chcesz mieć jedną barierę ochronną).
- Utrzymuj wąskie korzenie systemu plików: unikaj szerokich korzeni, takich jak katalog domowy, dla obszarów roboczych agentów/sandboxów. Szerokie korzenie mogą ujawnić narzędziom systemu plików wrażliwe pliki lokalne (na przykład stan/konfigurację pod `~/.openclaw`).

### Bezpieczna konfiguracja bazowa (kopiuj/wklej)

Jedna „bezpieczna domyślna” konfiguracja, która utrzymuje Gateway jako prywatny, wymaga parowania DM i unika zawsze aktywnych botów grupowych:

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

Jeśli chcesz też „bezpieczniejszego domyślnie” wykonywania narzędzi, dodaj sandbox i zablokuj niebezpieczne narzędzia dla każdego agenta niebędącego właścicielem (przykład poniżej w sekcji „Profile dostępu dla poszczególnych agentów”).

Wbudowana konfiguracja bazowa dla tur agenta uruchamianych z czatu: nadawcy niebędący właścicielami nie mogą używać narzędzi `cron` ani `gateway`.

## Sandboxing (zalecane)

Dedykowana dokumentacja: [Sandboxing](/pl/gateway/sandboxing)

Dwa uzupełniające się podejścia:

- **Uruchom cały Gateway w Dockerze** (granica kontenera): [Docker](/pl/install/docker)
- **Sandbox narzędzi** (`agents.defaults.sandbox`, host gateway + narzędzia izolowane sandboxem; Docker jest domyślnym backendem): [Sandboxing](/pl/gateway/sandboxing)

<Note>
Aby zapobiec dostępowi między agentami, pozostaw `agents.defaults.sandbox.scope` jako `"agent"` (domyślnie) albo `"session"` dla ściślejszej izolacji na sesję. `scope: "shared"` używa pojedynczego kontenera lub obszaru roboczego.
</Note>

Rozważ także dostęp agenta do obszaru roboczego wewnątrz sandboxa:

- `agents.defaults.sandbox.workspaceAccess: "none"` (domyślnie) trzyma obszar roboczy agenta poza zasięgiem; narzędzia działają na obszarze roboczym sandboxa pod `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` montuje obszar roboczy agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` montuje obszar roboczy agenta do odczytu/zapisu pod `/workspace`
- Dodatkowe `sandbox.docker.binds` są walidowane względem znormalizowanych i skanonikalizowanych ścieżek źródłowych. Sztuczki z dowiązaniami symbolicznymi rodzica i kanoniczne aliasy katalogu domowego nadal są bezpiecznie odrzucane, jeśli rozwiązują się do zablokowanych korzeni, takich jak `/etc`, `/var/run` lub katalogi poświadczeń pod katalogiem domowym systemu operacyjnego.

<Warning>
`tools.elevated` to globalny bazowy wyłącznik bezpieczeństwa, który uruchamia exec poza sandboxem. Efektywnym hostem jest domyślnie `gateway` albo `node`, gdy cel exec jest skonfigurowany jako `node`. Utrzymuj `tools.elevated.allowFrom` jako wąskie i nie włączaj tego dla obcych osób. Możesz dodatkowo ograniczyć tryb podwyższony dla poszczególnych agentów przez `agents.list[].tools.elevated`. Zobacz [Tryb podwyższony](/pl/tools/elevated).
</Warning>

### Bariera ochronna delegowania do podagentów

Jeśli zezwalasz na narzędzia sesji, traktuj delegowane uruchomienia podagentów jako kolejną decyzję o granicy:

- Zablokuj `sessions_spawn`, chyba że agent naprawdę potrzebuje delegowania.
- Utrzymuj `agents.defaults.subagents.allowAgents` oraz wszelkie nadpisania `agents.list[].subagents.allowAgents` dla poszczególnych agentów ograniczone do znanych, bezpiecznych agentów docelowych.
- Dla każdego przepływu pracy, który musi pozostać w sandboxie, wywołuj `sessions_spawn` z `sandbox: "require"` (domyślne to `inherit`).
- `sandbox: "require"` szybko kończy się błędem, gdy docelowe środowisko uruchomieniowe dziecka nie jest w sandboxie.

## Ryzyka kontroli przeglądarki

Włączenie kontroli przeglądarki daje modelowi możliwość sterowania prawdziwą przeglądarką.
Jeśli ten profil przeglądarki zawiera już zalogowane sesje, model może
uzyskać dostęp do tych kont i danych. Traktuj profile przeglądarki jako **wrażliwy stan**:

- Preferuj dedykowany profil dla agenta (domyślny profil `openclaw`).
- Unikaj kierowania agenta na swój prywatny profil używany na co dzień.
- Pozostaw kontrolę przeglądarki hosta wyłączoną dla agentów w sandboxie, chyba że im ufasz.
- Samodzielne API kontroli przeglądarki local loopback respektuje tylko uwierzytelnianie współdzielonym sekretem
  (uwierzytelnianie tokenem bearer Gateway albo hasło Gateway). Nie używa
  nagłówków tożsamości zaufanego proxy ani Tailscale Serve.
- Traktuj pobierane pliki z przeglądarki jako niezaufane dane wejściowe; preferuj izolowany katalog pobierania.
- Jeśli to możliwe, wyłącz synchronizację przeglądarki/menedżery haseł w profilu agenta (zmniejsza zakres szkód).
- W przypadku zdalnych Gateway zakładaj, że „kontrola przeglądarki” jest równoważna „dostępowi operatora” do wszystkiego, co ten profil może osiągnąć.
- Utrzymuj hosty Gateway i node tylko w tailnecie; unikaj wystawiania portów kontroli przeglądarki do LAN lub publicznego Internetu.
- Wyłącz trasowanie proxy przeglądarki, gdy go nie potrzebujesz (`gateway.nodes.browser.mode="off"`).
- Tryb istniejącej sesji Chrome MCP **nie** jest „bezpieczniejszy”; może działać jako Ty w tym, co może osiągnąć dany profil Chrome na hoście.

### Polityka SSRF przeglądarki (domyślnie ścisła)

Polityka nawigacji przeglądarki OpenClaw jest domyślnie ścisła: prywatne/wewnętrzne miejsca docelowe pozostają zablokowane, chyba że jawnie się na nie zgodzisz.

- Domyślnie: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nie jest ustawione, więc nawigacja przeglądarki nadal blokuje prywatne/wewnętrzne/specjalnego użytku miejsca docelowe.
- Starszy alias: `browser.ssrfPolicy.allowPrivateNetwork` jest nadal akceptowany dla zgodności.
- Tryb jawnej zgody: ustaw `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, aby zezwolić na prywatne/wewnętrzne/specjalnego użytku miejsca docelowe.
- W trybie ścisłym używaj `hostnameAllowlist` (wzorce takie jak `*.example.com`) i `allowedHostnames` (dokładne wyjątki hostów, w tym zablokowane nazwy takie jak `localhost`) dla jawnych wyjątków.
- Nawigacja jest sprawdzana przed żądaniem i ponownie sprawdzana best-effort na końcowym adresie URL `http(s)` po nawigacji, aby ograniczyć przejścia oparte na przekierowaniach.

Przykład ścisłej polityki:

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

## Profile dostępu dla poszczególnych agentów (wielu agentów)

Dzięki trasowaniu wieloagentowemu każdy agent może mieć własny sandbox i politykę narzędzi:
użyj tego, aby nadać **pełny dostęp**, **tylko do odczytu** lub **brak dostępu** dla poszczególnych agentów.
Zobacz [Sandbox i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools), aby poznać pełne szczegóły
i reguły pierwszeństwa.

Typowe przypadki użycia:

- Agent osobisty: pełny dostęp, bez sandboxa
- Agent rodzinny/pracowniczy: w sandboxie + narzędzia tylko do odczytu
- Agent publiczny: w sandboxie + brak narzędzi systemu plików/powłoki

### Przykład: pełny dostęp (bez sandboxa)

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

### Przykład: brak dostępu do systemu plików/powłoki (dozwolone wiadomości providerów)

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

## Reagowanie na incydenty

Jeśli Twoja AI zrobi coś złego:

### Ogranicz

1. **Zatrzymaj ją:** zatrzymaj aplikację macOS (jeśli nadzoruje Gateway) albo zakończ proces `openclaw gateway`.
2. **Zamknij ekspozycję:** ustaw `gateway.bind: "loopback"` (lub wyłącz Tailscale Funnel/Serve), dopóki nie zrozumiesz, co się stało.
3. **Zamroź dostęp:** przełącz ryzykowne DM/grupy na `dmPolicy: "disabled"` / wymagaj wzmianek i usuń wpisy zezwalające wszystkim `"*"`, jeśli je masz.

### Rotuj (zakładaj kompromitację, jeśli sekrety wyciekły)

1. Zrotuj uwierzytelnianie Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) i uruchom ponownie.
2. Zrotuj sekrety zdalnych klientów (`gateway.remote.token` / `.password`) na każdej maszynie, która może wywołać Gateway.
3. Zrotuj poświadczenia providerów/API (poświadczenia WhatsApp, tokeny Slack/Discord, klucze modelu/API w `auth-profiles.json` oraz wartości zaszyfrowanych ładunków sekretów, gdy są używane).

### Audyt

1. Sprawdź logi Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (lub `logging.file`).
2. Przejrzyj odpowiednie transkrypty: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Przejrzyj ostatnie zmiany konfiguracji (wszystko, co mogło poszerzyć dostęp: `gateway.bind`, `gateway.auth`, polityki DM/grup, `tools.elevated`, zmiany pluginów).
4. Uruchom ponownie `openclaw security audit --deep` i potwierdź, że krytyczne ustalenia zostały rozwiązane.

### Zbierz do raportu

- Znacznik czasu, system operacyjny hosta gateway + wersja OpenClaw
- Transkrypty sesji + krótki ogon logu (po redakcji)
- Co wysłał atakujący + co zrobił agent
- Czy Gateway był wystawiony poza loopback (LAN/Tailscale Funnel/Serve)

## Skanowanie sekretów

CI uruchamia hook pre-commit `detect-private-key` na repozytorium. Jeśli
się nie powiedzie, usuń lub zrotuj zatwierdzony materiał klucza, a następnie odtwórz lokalnie:

```bash
pre-commit run --all-files detect-private-key
```

## Zgłaszanie problemów bezpieczeństwa

Znalazłeś lukę w OpenClaw? Zgłoś ją odpowiedzialnie:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Nie publikuj publicznie do czasu naprawy
3. Wymienimy Cię jako autora zgłoszenia (chyba że wolisz anonimowość)
