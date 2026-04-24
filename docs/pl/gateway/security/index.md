---
read_when:
    - Dodawanie funkcji, które rozszerzają dostęp lub automatyzację
summary: Zagadnienia bezpieczeństwa i model zagrożeń przy uruchamianiu gateway AI z dostępem do powłoki
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-04-24T09:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e8cfc2bd0b4519f60d10b10b3496869a1668d57905926607f597aa34e4ce6de
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **Model zaufania osobistego asystenta.** Te wskazówki zakładają jedną granicę
  zaufanego operatora na gateway (model jednego użytkownika, osobistego asystenta).
  OpenClaw **nie** jest wrogą granicą bezpieczeństwa wielodostępowego dla wielu
  antagonistycznych użytkowników współdzielących jednego agenta lub gateway. Jeśli
  potrzebujesz działania z mieszanym zaufaniem lub z antagonistycznymi
  użytkownikami, rozdziel granice zaufania (osobny gateway +
  poświadczenia, najlepiej także osobni użytkownicy OS lub hosty).
</Warning>

## Najpierw zakres: model bezpieczeństwa osobistego asystenta

Wskazówki bezpieczeństwa OpenClaw zakładają wdrożenie **osobistego asystenta**: jedną granicę zaufanego operatora, potencjalnie z wieloma agentami.

- Obsługiwana postawa bezpieczeństwa: jeden użytkownik/jedna granica zaufania na gateway (preferowany jeden użytkownik OS/host/VPS na granicę).
- Nieobsługiwana granica bezpieczeństwa: jeden współdzielony gateway/agent używany przez wzajemnie nieufnych lub antagonistycznych użytkowników.
- Jeśli wymagana jest izolacja antagonistycznych użytkowników, rozdziel według granicy zaufania (osobny gateway + poświadczenia, a najlepiej także osobni użytkownicy OS/hosty).
- Jeśli wielu nieufnych użytkowników może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, traktuj ich tak, jakby współdzielili tę samą delegowaną władzę nad narzędziami dla tego agenta.

Ta strona wyjaśnia utwardzanie **w ramach tego modelu**. Nie twierdzi, że zapewnia wrogą izolację wielodostępową na jednym współdzielonym gateway.

## Szybka kontrola: `openclaw security audit`

Zobacz także: [Formalna weryfikacja (modele bezpieczeństwa)](/pl/security/formal-verification)

Uruchamiaj to regularnie (szczególnie po zmianie konfiguracji lub wystawieniu powierzchni sieciowych):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` pozostaje celowo wąskie: przełącza typowe otwarte zasady grup
na allowlisty, przywraca `logging.redactSensitive: "tools"`, zaostrza
uprawnienia do plików stanu/konfiguracji/include i używa resetów ACL Windows zamiast
POSIX `chmod`, gdy działa na Windows.

Oznacza typowe pułapki (ekspozycja auth Gateway, ekspozycja sterowania przeglądarką, podniesione allowlisty, uprawnienia systemu plików, zbyt liberalne zatwierdzenia exec oraz ekspozycja narzędzi w otwartych kanałach).

OpenClaw jest jednocześnie produktem i eksperymentem: łączysz zachowanie modeli frontier z rzeczywistymi powierzchniami wiadomości i rzeczywistymi narzędziami. **Nie istnieje „idealnie bezpieczna” konfiguracja.** Celem jest świadome podejście do:

- kto może rozmawiać z Twoim botem
- gdzie bot może działać
- czego bot może dotykać

Zacznij od najmniejszego dostępu, który nadal działa, a następnie rozszerzaj go w miarę nabierania pewności.

### Wdrożenie i zaufanie do hosta

OpenClaw zakłada, że host i granica konfiguracji są zaufane:

- Jeśli ktoś może modyfikować stan/konfigurację hosta Gateway (`~/.openclaw`, w tym `openclaw.json`), traktuj go jak zaufanego operatora.
- Uruchamianie jednego Gateway dla wielu wzajemnie nieufnych/antagonistycznych operatorów **nie jest zalecaną konfiguracją**.
- Dla zespołów o mieszanym zaufaniu rozdziel granice zaufania za pomocą osobnych gateway (lub co najmniej osobnych użytkowników OS/hostów).
- Zalecane ustawienie domyślne: jeden użytkownik na maszynę/host (lub VPS), jeden gateway dla tego użytkownika i jeden lub więcej agentów w tym gateway.
- W ramach jednej instancji Gateway uwierzytelniony dostęp operatora jest zaufaną rolą control-plane, a nie rolą tenant per użytkownik.
- Identyfikatory sesji (`sessionKey`, identyfikatory sesji, etykiety) są selektorami routingu, a nie tokenami autoryzacji.
- Jeśli kilka osób może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, każda z nich może sterować tym samym zestawem uprawnień. Izolacja sesji/pamięci per użytkownik pomaga w prywatności, ale nie przekształca współdzielonego agenta w autoryzację hosta per użytkownik.

### Współdzielony workspace Slack: rzeczywiste ryzyko

Jeśli „wszyscy w Slack mogą wysyłać wiadomości do bota”, głównym ryzykiem jest delegowana władza nad narzędziami:

- każdy dozwolony nadawca może wywołać użycie narzędzi (`exec`, przeglądarka, narzędzia sieciowe/plikowe) w ramach polityki agenta;
- prompt injection / content injection od jednego nadawcy może wywołać działania wpływające na współdzielony stan, urządzenia lub wyniki;
- jeśli jeden współdzielony agent ma wrażliwe poświadczenia/pliki, każdy dozwolony nadawca może potencjalnie wymusić eksfiltrację przez użycie narzędzi.

Używaj osobnych agentów/gateway z minimalnym zestawem narzędzi dla przepływów pracy zespołu; agentów z danymi osobistymi trzymaj prywatnie.

### Agent współdzielony w firmie: akceptowalny wzorzec

To jest akceptowalne, gdy wszyscy używający tego agenta należą do tej samej granicy zaufania (na przykład jednego zespołu w firmie), a agent ma ściśle biznesowy zakres.

- uruchamiaj go na dedykowanej maszynie/VM/kontenerze;
- używaj dedykowanego użytkownika OS + dedykowanej przeglądarki/profilu/kont dla tego runtime;
- nie loguj tego runtime do osobistych kont Apple/Google ani osobistych profili menedżera haseł/przeglądarki.

Jeśli mieszasz tożsamości osobiste i firmowe w tym samym runtime, znosisz rozdzielenie i zwiększasz ryzyko ekspozycji danych osobistych.

## Koncepcja zaufania Gateway i Node

Traktuj Gateway i Node jako jedną domenę zaufania operatora, ale z różnymi rolami:

- **Gateway** to control-plane i powierzchnia polityk (`gateway.auth`, polityka narzędzi, routing).
- **Node** to powierzchnia zdalnego wykonania sparowana z tym Gateway (polecenia, akcje urządzenia, możliwości lokalne hosta).
- Wywołujący uwierzytelniony do Gateway jest zaufany w zakresie Gateway. Po sparowaniu akcje Node są zaufanymi działaniami operatora na tym Node.
- `sessionKey` służy do wyboru routingu/kontekstu, a nie do auth per użytkownik.
- Zatwierdzenia exec (allowlista + ask) są zabezpieczeniami intencji operatora, a nie wrogą izolacją wielodostępową.
- Domyślne ustawienie produktu OpenClaw dla zaufanych konfiguracji z jednym operatorem zakłada, że host exec na `gateway`/`node` jest dozwolone bez promptów zatwierdzenia (`security="full"`, `ask="off"`, chyba że to zaostrzysz). To ustawienie domyślne jest zamierzoną decyzją UX, a nie samo w sobie podatnością.
- Zatwierdzenia exec wiążą dokładny kontekst żądania i best-effort bezpośrednie lokalne operandy plikowe; nie modelują semantycznie każdej ścieżki ładowania runtime/interpretera. Aby uzyskać silne granice, używaj sandboxingu i izolacji hosta.

Jeśli potrzebujesz izolacji wrogich użytkowników, rozdziel granice zaufania według użytkownika OS/hosta i uruchamiaj osobne gateway.

## Macierz granic zaufania

Używaj tego jako szybkiego modelu przy triage ryzyka:

| Granica lub kontrola                                      | Co to oznacza                                    | Częsta błędna interpretacja                                                  |
| --------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Uwierzytelnia wywołujących do API gateway        | „Aby było bezpieczne, potrzebne są podpisy per wiadomość na każdej ramce”    |
| `sessionKey`                                              | Klucz routingu do wyboru kontekstu/sesji         | „Klucz sesji to granica auth użytkownika”                                     |
| Guardraile prompt/content                                 | Ograniczają ryzyko nadużycia modelu              | „Sam prompt injection dowodzi obejścia auth”                                  |
| `canvas.eval` / browser evaluate                          | Zamierzona możliwość operatora, gdy włączona     | „Każdy prymityw eval JS jest automatycznie podatnością w tym modelu zaufania” |
| Lokalne TUI `!` shell                                     | Jawnie wywołane przez operatora lokalne wykonanie | „Lokalne wygodne polecenie shell to zdalne wstrzyknięcie”                    |
| Parowanie Node i polecenia Node                           | Zdalne wykonanie na sparowanych urządzeniach na poziomie operatora | „Zdalne sterowanie urządzeniem powinno domyślnie być traktowane jak dostęp nieufnego użytkownika” |

## Z założenia nie są to podatności

<Accordion title="Częste zgłoszenia poza zakresem">
  Te wzorce są zgłaszane często i zwykle są zamykane bez dalszych działań,
  chyba że zostanie wykazane rzeczywiste obejście granicy:

- Łańcuchy oparte wyłącznie na prompt injection bez obejścia polityki, auth lub sandboxu.
- Twierdzenia zakładające wrogie działanie wielodostępowe na jednym współdzielonym hoście lub
  konfiguracji.
- Twierdzenia klasyfikujące normalny dostęp operatora po ścieżkach odczytu (na przykład
  `sessions.list` / `sessions.preview` / `chat.history`) jako IDOR w
  konfiguracji współdzielonego gateway.
- Znaleziska dotyczące wdrożeń tylko na localhost (na przykład HSTS na gateway
  tylko loopback).
- Znaleziska dotyczące podpisów przychodzących Webhooków Discord dla ścieżek przychodzących, które nie
  istnieją w tym repozytorium.
- Zgłoszenia traktujące metadane parowania Node jako ukrytą drugą warstwę
  zatwierdzania per polecenie dla `system.run`, podczas gdy rzeczywistą granicą wykonania pozostaje
  globalna polityka poleceń Node w gateway oraz własne zatwierdzenia exec
  Node.
- Znaleziska „braku autoryzacji per użytkownik”, które traktują `sessionKey` jako
  token auth.
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

To utrzymuje Gateway jako lokalny, izoluje wiadomości bezpośrednie i domyślnie wyłącza narzędzia control-plane/runtime.

## Szybka zasada dla współdzielonej skrzynki odbiorczej

Jeśli więcej niż jedna osoba może wysyłać wiadomości bezpośrednie do Twojego bota:

- Ustaw `session.dmScope: "per-channel-peer"` (lub `"per-account-channel-peer"` dla kanałów wielokontowych).
- Zachowaj `dmPolicy: "pairing"` albo restrykcyjne allowlisty.
- Nigdy nie łącz współdzielonych wiadomości bezpośrednich z szerokim dostępem do narzędzi.
- To utwardza wspólne/skrzynki odbiorcze współpracy, ale nie jest zaprojektowane jako wroga izolacja współtenantów, gdy użytkownicy współdzielą dostęp zapisu do hosta/konfiguracji.

## Model widoczności kontekstu

OpenClaw rozdziela dwa pojęcia:

- **Autoryzacja wyzwolenia**: kto może wyzwolić agenta (`dmPolicy`, `groupPolicy`, allowlisty, bramki wzmianek).
- **Widoczność kontekstu**: jaki kontekst uzupełniający jest wstrzykiwany do wejścia modelu (treść odpowiedzi, cytowany tekst, historia wątku, metadane przekazania).

Allowlisty kontrolują wyzwolenia i autoryzację poleceń. Ustawienie `contextVisibility` kontroluje sposób filtrowania kontekstu uzupełniającego (cytowane odpowiedzi, korzenie wątków, pobrana historia):

- `contextVisibility: "all"` (domyślnie) zachowuje kontekst uzupełniający w postaci, w jakiej został odebrany.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców dozwolonych przez aktywne kontrole allowlist.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

Ustaw `contextVisibility` per kanał lub per pokój/konwersację. Szczegóły konfiguracji znajdziesz w [Czatach grupowych](/pl/channels/groups#context-visibility-and-allowlists).

Wskazówki dla triage zgłoszeń:

- Twierdzenia pokazujące tylko, że „model może widzieć cytowany lub historyczny tekst od nadawców spoza allowlisty”, to znaleziska hardeningowe rozwiązywane przez `contextVisibility`, a nie same w sobie obejścia granicy auth lub sandboxu.
- Aby mieć wpływ bezpieczeństwa, zgłoszenia nadal muszą wykazać obejście granicy zaufania (auth, polityki, sandboxu, zatwierdzeń lub innej udokumentowanej granicy).

## Co sprawdza audyt (na wysokim poziomie)

- **Dostęp przychodzący** (zasady wiadomości bezpośrednich, zasady grup, allowlisty): czy obcy mogą wyzwolić bota?
- **Promień rażenia narzędzi** (narzędzia podniesione + otwarte pokoje): czy prompt injection może zamienić się w akcje shell/plik/sieć?
- **Dryf zatwierdzeń exec** (`security=full`, `autoAllowSkills`, allowlisty interpreterów bez `strictInlineEval`): czy guardraile host-exec nadal robią to, co myślisz?
  - `security="full"` to szerokie ostrzeżenie o postawie, a nie dowód błędu. To wybrane ustawienie domyślne dla zaufanych konfiguracji osobistego asystenta; zaostrzaj je tylko wtedy, gdy Twój model zagrożeń wymaga guardraili zatwierdzeń lub allowlist.
- **Ekspozycja sieciowa** (bind/auth Gateway, Tailscale Serve/Funnel, słabe/krótkie tokeny auth).
- **Ekspozycja sterowania przeglądarką** (zdalne Node, porty relay, zdalne punkty końcowe CDP).
- **Higiena lokalnego dysku** (uprawnienia, dowiązania symboliczne, include konfiguracji, ścieżki „synchronizowanych folderów”).
- **Pluginy** (Pluginy ładują się bez jawnej allowlisty).
- **Dryf polityk/błędna konfiguracja** (ustawienia sandbox Docker skonfigurowane, ale tryb sandbox wyłączony; nieskuteczne wzorce `gateway.nodes.denyCommands`, ponieważ dopasowanie odbywa się dokładnie tylko po nazwie polecenia (na przykład `system.run`) i nie analizuje treści shell; niebezpieczne wpisy `gateway.nodes.allowCommands`; globalne `tools.profile="minimal"` nadpisane przez profile per agent; narzędzia należące do Pluginów osiągalne przy zbyt liberalnej polityce narzędzi).
- **Dryf oczekiwań runtime** (na przykład zakładanie, że implicit exec nadal oznacza `sandbox`, gdy `tools.exec.host` ma teraz domyślnie wartość `auto`, lub jawne ustawienie `tools.exec.host="sandbox"` przy wyłączonym trybie sandbox).
- **Higiena modeli** (ostrzeżenie, gdy skonfigurowane modele wyglądają na legacy; nie jest to twarda blokada).

Jeśli uruchomisz `--deep`, OpenClaw wykona też best-effort aktywny probing Gateway.

## Mapa przechowywania poświadczeń

Użyj tego podczas audytu dostępu lub przy podejmowaniu decyzji o backupie:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne są odrzucane)
- **Token bota Discord**: config/env lub SecretRef (providerzy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Allowlisty parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile auth modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalny)**: `~/.openclaw/secrets.json`
- **Starszy import OAuth**: `~/.openclaw/credentials/oauth.json`

## Checklista audytu bezpieczeństwa

Gdy audyt wypisze znaleziska, traktuj to jako kolejność priorytetów:

1. **Wszystko, co jest „open” + narzędzia włączone**: najpierw zablokuj wiadomości bezpośrednie/grupy (pairing/allowlisty), potem zaostrz politykę narzędzi/sandboxing.
2. **Ekspozycja na publiczną sieć** (bind LAN, Funnel, brak auth): napraw natychmiast.
3. **Zdalna ekspozycja sterowania przeglądarką**: traktuj jak dostęp operatora (tylko tailnet, paruj Node świadomie, unikaj ekspozycji publicznej).
4. **Uprawnienia**: upewnij się, że stan/konfiguracja/poświadczenia/auth nie są czytelne dla grupy/świata.
5. **Pluginy**: ładuj tylko to, czemu jawnie ufasz.
6. **Wybór modelu**: preferuj nowoczesne modele utwardzone instrukcjami dla każdego bota z narzędziami.

## Słownik audytu bezpieczeństwa

Każde znalezisko audytu jest oznaczone uporządkowanym `checkId` (na przykład
`gateway.bind_no_auth` lub `tools.exec.security_full_configured`). Typowe klasy o krytycznej wadze:

- `fs.*` — uprawnienia systemu plików dla stanu, konfiguracji, poświadczeń, profili auth.
- `gateway.*` — tryb bind, auth, Tailscale, interfejs Control, konfiguracja trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — utwardzanie dla poszczególnych powierzchni.
- `plugins.*`, `skills.*` — łańcuch dostaw Pluginów/Skills i wyniki skanowania.
- `security.exposure.*` — kontrole przekrojowe tam, gdzie polityka dostępu styka się z promieniem rażenia narzędzi.

Pełny katalog z poziomami ważności, kluczami napraw i obsługą auto-fix znajdziesz w
[Kontrolach audytu bezpieczeństwa](/pl/gateway/security/audit-checks).

## Interfejs Control przez HTTP

Interfejs Control wymaga **bezpiecznego kontekstu** (HTTPS lub localhost), aby wygenerować tożsamość urządzenia.
`gateway.controlUi.allowInsecureAuth` to lokalny przełącznik zgodności:

- Na localhost pozwala na auth interfejsu Control bez tożsamości urządzenia, gdy strona
  jest ładowana przez niezabezpieczony HTTP.
- Nie omija kontroli parowania.
- Nie rozluźnia wymagań tożsamości urządzenia dla połączeń zdalnych (spoza localhost).

Preferuj HTTPS (Tailscale Serve) albo otwieraj UI pod `127.0.0.1`.

Tylko w scenariuszach break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth`
całkowicie wyłącza kontrole tożsamości urządzenia. To poważne obniżenie poziomu bezpieczeństwa;
pozostaw wyłączone, chyba że aktywnie debugujesz i możesz szybko przywrócić poprzedni stan.

Niezależnie od tych niebezpiecznych flag, poprawne `gateway.auth.mode: "trusted-proxy"`
może dopuścić **operatorowe** sesje interfejsu Control bez tożsamości urządzenia. To
zamierzone zachowanie trybu auth, a nie skrót `allowInsecureAuth`, i nadal
nie rozciąga się na sesje interfejsu Control o roli node.

`openclaw security audit` ostrzega, gdy to ustawienie jest włączone.

## Podsumowanie niebezpiecznych flag

`openclaw security audit` zgłasza `config.insecure_or_dangerous_flags`, gdy
włączone są znane niebezpieczne/przeznaczone do debugowania przełączniki. W środowisku
produkcyjnym pozostaw je nieustawione.

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
    Interfejs Control i przeglądarka:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Dopasowanie nazw kanałów (kanały dołączone i kanały Pluginów; dostępne też per
    `accounts.<accountId>`, gdzie ma to zastosowanie):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (kanał Pluginu)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (kanał Pluginu)
    - `channels.zalouser.dangerouslyAllowNameMatching` (kanał Pluginu)
    - `channels.irc.dangerouslyAllowNameMatching` (kanał Pluginu)
    - `channels.mattermost.dangerouslyAllowNameMatching` (kanał Pluginu)

    Ekspozycja sieciowa:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (także per konto)

    Sandbox Docker (domyślne + per agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Konfiguracja reverse proxy

Jeśli uruchamiasz Gateway za reverse proxy (nginx, Caddy, Traefik itd.), skonfiguruj
`gateway.trustedProxies`, aby poprawnie obsługiwać przekazywany dalej adres IP klienta.

Gdy Gateway wykryje nagłówki proxy z adresu, który **nie** znajduje się w `trustedProxies`, **nie** będzie traktować połączeń jako lokalnych klientów. Jeśli auth gateway jest wyłączone, takie połączenia są odrzucane. Zapobiega to obejściu auth, w którym połączenia przez proxy mogłyby w przeciwnym razie wyglądać, jakby pochodziły z localhost i otrzymywały automatyczne zaufanie.

`gateway.trustedProxies` zasila również `gateway.auth.mode: "trusted-proxy"`, ale ten tryb auth jest bardziej restrykcyjny:

- auth trusted-proxy **kończy się odmową dla proxy ze źródłem loopback**
- reverse proxy loopback na tym samym hoście nadal mogą używać `gateway.trustedProxies` do wykrywania klienta lokalnego i obsługi przekazywanego adresu IP
- dla reverse proxy loopback na tym samym hoście używaj auth token/password zamiast `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # adres IP reverse proxy
  # Opcjonalne. Domyślnie false.
  # Włączaj tylko wtedy, gdy Twoje proxy nie może dostarczyć X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Gdy skonfigurowane jest `trustedProxies`, Gateway używa `X-Forwarded-For` do określenia IP klienta. `X-Real-IP` jest domyślnie ignorowane, chyba że jawnie ustawiono `gateway.allowRealIpFallback: true`.

Prawidłowe zachowanie reverse proxy (nadpisuj przychodzące nagłówki przekazywania dalej):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Nieprawidłowe zachowanie reverse proxy (dopisywanie/zachowywanie nieufnych nagłówków przekazywania dalej):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Uwagi o HSTS i origin

- Gateway OpenClaw jest przede wszystkim lokalny/loopback. Jeśli kończysz TLS na reverse proxy, ustaw HSTS na domenie HTTPS wystawionej przez proxy.
- Jeśli sam gateway kończy HTTPS, możesz ustawić `gateway.http.securityHeaders.strictTransportSecurity`, aby emitować nagłówek HSTS z odpowiedzi OpenClaw.
- Szczegółowe wskazówki wdrożeniowe znajdziesz w [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Dla wdrożeń interfejsu Control spoza loopback domyślnie wymagane jest `gateway.controlUi.allowedOrigins`.
- `gateway.controlUi.allowedOrigins: ["*"]` to jawna polityka zezwalająca na wszystkie origin przeglądarki, a nie utwardzone ustawienie domyślne. Unikaj jej poza ściśle kontrolowanymi testami lokalnymi.
- Błędy auth pochodzące z origin przeglądarki na loopback są nadal ograniczane szybkością, nawet gdy
  ogólne zwolnienie dla loopback jest włączone, ale klucz blokady jest ograniczony per
  znormalizowana wartość `Origin`, zamiast jednego współdzielonego koszyka localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku origin na podstawie nagłówka Host; traktuj go jako niebezpieczną politykę wybraną przez operatora.
- Traktuj DNS rebinding i zachowanie nagłówka Host w proxy jako kwestie hardeningu wdrożenia; utrzymuj `trustedProxies` wąsko i unikaj bezpośredniego wystawiania gateway do publicznego internetu.

## Lokalne logi sesji znajdują się na dysku

OpenClaw przechowuje transkrypty sesji na dysku w `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Jest to wymagane dla ciągłości sesji i (opcjonalnie) indeksowania pamięci sesji, ale oznacza też, że
**dowolny proces/użytkownik z dostępem do systemu plików może czytać te logi**. Traktuj dostęp do dysku jako granicę
zaufania i zablokuj uprawnienia do `~/.openclaw` (zobacz sekcję audytu poniżej). Jeśli potrzebujesz
silniejszej izolacji między agentami, uruchamiaj ich pod osobnymi użytkownikami OS lub na osobnych hostach.

## Wykonywanie na Node (`system.run`)

Jeśli sparowany jest Node macOS, Gateway może wywoływać `system.run` na tym Node. To jest **zdalne wykonywanie kodu** na Macu:

- Wymaga parowania Node (zatwierdzenie + token).
- Parowanie Node w Gateway nie jest powierzchnią zatwierdzania per polecenie. Ustanawia tożsamość/zaufanie Node i wydawanie tokenów.
- Gateway stosuje zgrubną globalną politykę poleceń Node przez `gateway.nodes.allowCommands` / `denyCommands`.
- Kontrolowane na Macu przez **Ustawienia → Zatwierdzenia exec** (security + ask + allowlist).
- Polityka `system.run` per Node to własny plik zatwierdzeń exec tego Node (`exec.approvals.node.*`), który może być bardziej restrykcyjny lub luźniejszy niż globalna polityka identyfikatorów poleceń w gateway.
- Node działający z `security="full"` i `ask="off"` podąża za domyślnym modelem zaufanego operatora. Traktuj to jako oczekiwane zachowanie, chyba że Twoje wdrożenie jawnie wymaga ostrzejszej postawy zatwierdzeń lub allowlist.
- Tryb zatwierdzeń wiąże dokładny kontekst żądania i, gdy to możliwe, jeden konkretny lokalny operand skryptu/pliku. Jeśli OpenClaw nie może zidentyfikować dokładnie jednego bezpośredniego lokalnego pliku dla polecenia interpretera/runtime, wykonanie oparte na zatwierdzeniu jest odrzucane zamiast obiecywać pełne pokrycie semantyczne.
- Dla `host=node` uruchomienia oparte na zatwierdzeniu zapisują również kanoniczny przygotowany
  `systemRunPlan`; późniejsze zatwierdzone przekazania dalej używają ponownie zapisanego planu, a
  walidacja gateway odrzuca edycje command/cwd/kontekstu sesji dokonane przez wywołującego po utworzeniu żądania zatwierdzenia.
- Jeśli nie chcesz zdalnego wykonania, ustaw security na **deny** i usuń parowanie Node dla tego Maca.

To rozróżnienie ma znaczenie przy triage:

- Ponownie łączący się sparowany Node reklamujący inną listę poleceń sam w sobie nie jest podatnością, jeśli globalna polityka Gateway i lokalne zatwierdzenia exec Node nadal egzekwują rzeczywistą granicę wykonania.
- Zgłoszenia traktujące metadane parowania Node jako drugą ukrytą warstwę zatwierdzania per polecenie to zwykle nieporozumienie polityki/UX, a nie obejście granicy bezpieczeństwa.

## Dynamiczne Skills (watcher / zdalne Node)

OpenClaw może odświeżać listę Skills w trakcie sesji:

- **Watcher Skills**: zmiany w `SKILL.md` mogą zaktualizować snapshot Skills przy następnej turze agenta.
- **Zdalne Node**: podłączenie macOS Node może sprawić, że kwalifikować się będą Skills tylko dla macOS (na podstawie sprawdzania binariów).

Traktuj katalogi Skills jako **zaufany kod** i ogranicz, kto może je modyfikować.

## Model zagrożeń

Twój asystent AI może:

- Wykonywać dowolne polecenia powłoki
- Odczytywać/zapisywać pliki
- Uzyskiwać dostęp do usług sieciowych
- Wysyłać wiadomości do kogokolwiek (jeśli dasz mu dostęp do WhatsApp)

Osoby, które wysyłają Ci wiadomości, mogą:

- Próbować nakłonić Twoje AI do robienia złych rzeczy
- Stosować socjotechnikę, aby uzyskać dostęp do Twoich danych
- Badać szczegóły infrastruktury

## Główna koncepcja: kontrola dostępu przed inteligencją

Większość porażek tutaj to nie wymyślne exploity — to „ktoś wysłał wiadomość do bota, a bot zrobił to, o co poprosił”.

Podejście OpenClaw:

- **Najpierw tożsamość:** zdecyduj, kto może rozmawiać z botem (parowanie wiadomości bezpośrednich / allowlisty / jawne „open”).
- **Potem zakres:** zdecyduj, gdzie bot może działać (allowlisty grup + bramkowanie wzmianek, narzędzia, sandboxing, uprawnienia urządzeń).
- **Na końcu model:** zakładaj, że modelem można manipulować; projektuj tak, aby manipulacja miała ograniczony promień rażenia.

## Model autoryzacji poleceń

Polecenia slash i dyrektywy są honorowane tylko dla **autoryzowanych nadawców**. Autoryzacja jest wyprowadzana z
allowlist/parowania kanałów oraz `commands.useAccessGroups` (zobacz [Konfiguracja](/pl/gateway/configuration)
i [Polecenia Slash](/pl/tools/slash-commands)). Jeśli allowlista kanału jest pusta lub zawiera `"*"`,
polecenia są efektywnie otwarte dla tego kanału.

`/exec` to wygodne polecenie tylko dla sesji dla autoryzowanych operatorów. **Nie** zapisuje konfiguracji ani
nie zmienia innych sesji.

## Ryzyko narzędzi control-plane

Dwa wbudowane narzędzia mogą wprowadzać trwałe zmiany w control-plane:

- `gateway` może sprawdzać konfigurację przez `config.schema.lookup` / `config.get`, a także wprowadzać trwałe zmiany przez `config.apply`, `config.patch` i `update.run`.
- `cron` może tworzyć zaplanowane zadania, które działają dalej po zakończeniu pierwotnego czatu/zadania.

Narzędzie runtime `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania
`tools.exec.ask` lub `tools.exec.security`; starsze aliasy `tools.bash.*` są
normalizowane do tych samych chronionych ścieżek exec przed zapisem.

Dla każdego agenta/powierzchni obsługujących nieufną treść domyślnie blokuj te narzędzia:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` blokuje tylko akcje restartu. Nie wyłącza akcji config/update narzędzia `gateway`.

## Pluginy

Pluginy działają **w procesie** razem z Gateway. Traktuj je jako zaufany kod:

- Instaluj Pluginy tylko ze źródeł, którym ufasz.
- Preferuj jawne allowlisty `plugins.allow`.
- Przed włączeniem przejrzyj konfigurację Pluginu.
- Po zmianach Pluginów uruchom ponownie Gateway.
- Jeśli instalujesz lub aktualizujesz Pluginy (`openclaw plugins install <package>`, `openclaw plugins update <id>`), traktuj to jak uruchamianie nieufnego kodu:
  - Ścieżka instalacji to katalog per Plugin w aktywnym katalogu głównym instalacji Pluginów.
  - OpenClaw uruchamia wbudowane skanowanie niebezpiecznego kodu przed instalacją/aktualizacją. Znaleziska `critical` domyślnie blokują działanie.
  - OpenClaw używa `npm pack`, a następnie uruchamia `npm install --omit=dev` w tym katalogu (skrypty lifecycle npm mogą wykonywać kod podczas instalacji).
  - Preferuj przypięte, dokładne wersje (`@scope/pkg@1.2.3`) i sprawdzaj rozpakowany kod na dysku przed włączeniem.
  - `--dangerously-force-unsafe-install` to opcja break-glass tylko dla fałszywych trafień wbudowanego skanera w przepływach instalacji/aktualizacji Pluginów. Nie omija blokad polityki hooka Pluginu `before_install` i nie omija błędów skanowania.
  - Instalacje zależności Skills obsługiwane przez Gateway stosują ten sam podział na niebezpieczne/podejrzane: wbudowane znaleziska `critical` blokują działanie, chyba że wywołujący jawnie ustawi `dangerouslyForceUnsafeInstall`, podczas gdy podejrzane znaleziska nadal jedynie ostrzegają. `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Model dostępu do wiadomości bezpośrednich: pairing, allowlist, open, disabled

Wszystkie obecne kanały obsługujące wiadomości bezpośrednie wspierają zasadę wiadomości bezpośrednich (`dmPolicy` lub `*.dm.policy`), która blokuje przychodzące wiadomości bezpośrednie **zanim** wiadomość zostanie przetworzona:

- `pairing` (domyślnie): nieznani nadawcy otrzymują krótki kod parowania, a bot ignoruje ich wiadomość do czasu zatwierdzenia. Kody wygasają po 1 godzinie; powtarzane wiadomości bezpośrednie nie wysyłają ponownie kodu, dopóki nie zostanie utworzona nowa prośba. Oczekujące prośby są domyślnie ograniczone do **3 na kanał**.
- `allowlist`: nieznani nadawcy są blokowani (bez handshake parowania).
- `open`: pozwala każdemu wysyłać wiadomości bezpośrednie (publiczne). **Wymaga**, aby allowlista kanału zawierała `"*"`` (jawne opt-in).
- `disabled`: całkowicie ignoruje przychodzące wiadomości bezpośrednie.

Zatwierdzanie przez CLI:
__OC_I18N_900006__
Szczegóły + pliki na dysku: [Parowanie](/channels/pairing)

## Izolacja sesji wiadomości bezpośrednich (tryb wielu użytkowników)

Domyślnie OpenClaw kieruje **wszystkie wiadomości bezpośrednie do sesji głównej**, aby asystent zachowywał ciągłość między urządzeniami i kanałami. Jeśli **wiele osób** może wysyłać wiadomości bezpośrednie do bota (otwarte wiadomości bezpośrednie lub allowlista wieloosobowa), rozważ izolowanie sesji wiadomości bezpośrednich:
__OC_I18N_900007__
To zapobiega przeciekom kontekstu między użytkownikami, przy zachowaniu izolacji czatów grupowych.

To jest granica kontekstu wiadomości, a nie granica administracyjna hosta. Jeśli użytkownicy są wzajemnie antagonistyczni i współdzielą ten sam host/konfigurację Gateway, uruchamiaj osobne gateway dla każdej granicy zaufania.

### Bezpieczny tryb wiadomości bezpośrednich (zalecany)

Traktuj powyższy fragment jako **bezpieczny tryb wiadomości bezpośrednich**:

- Domyślnie: `session.dmScope: "main"` (wszystkie wiadomości bezpośrednie współdzielą jedną sesję dla ciągłości).
- Domyślne ustawienie lokalnego onboardingu CLI: zapisuje `session.dmScope: "per-channel-peer"`, gdy pole nie jest ustawione (zachowuje istniejące jawne wartości).
- Bezpieczny tryb wiadomości bezpośrednich: `session.dmScope: "per-channel-peer"` (każda para kanał+nadawca dostaje izolowany kontekst wiadomości bezpośrednich).
- Izolacja peera między kanałami: `session.dmScope: "per-peer"` (każdy nadawca dostaje jedną sesję we wszystkich kanałach tego samego typu).

Jeśli używasz wielu kont na tym samym kanale, użyj zamiast tego `per-account-channel-peer`. Jeśli ta sama osoba kontaktuje się z Tobą na wielu kanałach, użyj `session.identityLinks`, aby zwinąć te sesje wiadomości bezpośrednich do jednej kanonicznej tożsamości. Zobacz [Zarządzanie sesją](/concepts/session) i [Konfiguracja](/gateway/configuration).

## Allowlisty dla wiadomości bezpośrednich i grup

OpenClaw ma dwie oddzielne warstwy „kto może mnie wyzwolić?”:

- **Allowlista wiadomości bezpośrednich** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; starsze: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): kto może rozmawiać z botem w wiadomościach bezpośrednich.
  - Gdy `dmPolicy="pairing"`, zatwierdzenia są zapisywane do magazynu allowlisty parowania z zakresem konta w `~/.openclaw/credentials/` (`<channel>-allowFrom.json` dla konta domyślnego, `<channel>-<accountId>-allowFrom.json` dla kont niedomyślnych), a następnie scalane z allowlistami konfiguracji.
- **Allowlista grup** (specyficzna dla kanału): które grupy/kanały/gildie w ogóle będą akceptować wiadomości do bota.
  - Typowe wzorce:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: domyślne ustawienia per grupa, takie jak `requireMention`; gdy są ustawione, działają również jako allowlista grup (dodaj `"*"`, aby zachować zachowanie allow-all).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: ogranicza, kto może wyzwolić bota _wewnątrz_ sesji grupowej (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlisty per powierzchnia + domyślne wzmianki.
  - Kontrole grup uruchamiają się w tej kolejności: najpierw `groupPolicy`/allowlisty grup, potem aktywacja wzmianki/odpowiedzi.
  - Odpowiedź na wiadomość bota (niejawna wzmianka) **nie** omija allowlist nadawcy takich jak `groupAllowFrom`.
  - **Uwaga dotycząca bezpieczeństwa:** traktuj `dmPolicy="open"` i `groupPolicy="open"` jako ustawienia ostateczności. Powinny być używane jak najrzadziej; preferuj pairing + allowlisty, chyba że w pełni ufasz każdemu członkowi pokoju.

Szczegóły: [Konfiguracja](/gateway/configuration) i [Grupy](/channels/groups)

## Prompt injection (co to jest i dlaczego ma znaczenie)

Prompt injection występuje wtedy, gdy atakujący tworzy wiadomość manipulującą modelem tak, aby zrobił coś niebezpiecznego („zignoruj swoje instrukcje”, „zrzuć system plików”, „wejdź w ten link i uruchom polecenia” itd.).

Nawet przy silnych promptach systemowych **prompt injection nie jest rozwiązane**. Guardraile promptu systemowego są tylko miękką wskazówką; twarde egzekwowanie pochodzi z polityki narzędzi, zatwierdzeń exec, sandboxingu i allowlist kanałów (a operatorzy mogą je z założenia wyłączać). W praktyce pomaga:

- Utrzymuj przychodzące wiadomości bezpośrednie zablokowane (pairing/allowlisty).
- Preferuj bramkowanie wzmianek w grupach; unikaj botów „zawsze włączonych” w pokojach publicznych.
- Traktuj linki, załączniki i wklejone instrukcje jako wrogie domyślnie.
- Uruchamiaj wrażliwe wykonania narzędzi w sandboxie; trzymaj sekrety poza systemem plików osiągalnym dla agenta.
- Uwaga: sandboxing jest opcjonalny. Jeśli tryb sandbox jest wyłączony, niejawne `host=auto` rozstrzyga się do hosta gateway. Jawne `host=sandbox` nadal kończy się odmową w trybie fail-closed, ponieważ runtime sandbox nie jest dostępny. Ustaw `host=gateway`, jeśli chcesz, by takie zachowanie było jawne w konfiguracji.
- Ogranicz narzędzia wysokiego ryzyka (`exec`, `browser`, `web_fetch`, `web_search`) do zaufanych agentów lub jawnych allowlist.
- Jeśli używasz allowlist interpreterów (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), włącz `tools.exec.strictInlineEval`, aby formy inline eval nadal wymagały jawnego zatwierdzenia.
- Analiza zatwierdzeń shell odrzuca też formy rozwijania parametrów POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) wewnątrz **niecytowanych heredoców**, dzięki czemu allowlistowana treść heredoca nie może przemycić rozszerzania shell poza przeglądem allowlisty jako zwykły tekst. Zacytuj terminator heredoca (na przykład `<<'EOF'`), aby przełączyć się na semantykę treści dosłownej; niecytowane heredoki, które rozwinęłyby zmienne, są odrzucane.
- **Wybór modelu ma znaczenie:** starsze/mniejsze/legacy modele są znacząco mniej odporne na prompt injection i niewłaściwe użycie narzędzi. Dla agentów z włączonymi narzędziami używaj najmocniejszego dostępnego modelu najnowszej generacji, utwardzonego instrukcjami.

Sygnały ostrzegawcze, które należy traktować jako nieufne:

- „Przeczytaj ten plik/URL i zrób dokładnie to, co mówi.”
- „Zignoruj swój prompt systemowy lub reguły bezpieczeństwa.”
- „Ujawnij swoje ukryte instrukcje lub dane wyjściowe narzędzi.”
- „Wklej pełną zawartość `~/.openclaw` albo swoich logów.”

## Sanityzacja specjalnych tokenów w treści zewnętrznej

OpenClaw usuwa typowe literały specjalnych tokenów szablonów czatu z własnych, self-hosted stosów LLM z opakowanej treści zewnętrznej i metadanych, zanim dotrą one do modelu. Obsługiwane rodziny znaczników obejmują tokeny ról/tur Qwen/ChatML, Llama, Gemma, Mistral, Phi i GPT-OSS.

Dlaczego:

- Backendy zgodne z OpenAI, które udostępniają self-hosted modele, czasami zachowują specjalne tokeny pojawiające się w tekście użytkownika, zamiast je maskować. Atakujący, który może zapisywać do przychodzącej treści zewnętrznej (pobrana strona, treść maila, dane wyjściowe narzędzia odczytu pliku), mógłby w przeciwnym razie wstrzyknąć syntetyczną granicę roli `assistant` lub `system` i wyjść poza guardraile opakowanej treści.
- Sanityzacja odbywa się na warstwie opakowywania treści zewnętrznej, więc działa jednolicie dla narzędzi fetch/read i treści przychodzącej z kanałów, zamiast być implementowana per provider.
- Wychodzące odpowiedzi modelu mają już osobny sanitizer, który usuwa wyciekłe konstrukcje `<tool_call>`, `<function_calls>` i podobne z odpowiedzi widocznych dla użytkownika. Sanitizer treści zewnętrznej jest odpowiednikiem po stronie wejścia.

To nie zastępuje pozostałych mechanizmów hardeningu na tej stronie — `dmPolicy`, allowlisty, zatwierdzenia exec, sandboxing i `contextVisibility` nadal wykonują główną pracę. To zamyka jedno konkretne obejście na poziomie tokenizera w self-hosted stosach, które przekazują tekst użytkownika z nienaruszonymi specjalnymi tokenami.

## Flagi obejścia dla niebezpiecznej treści zewnętrznej

OpenClaw zawiera jawne flagi obejścia, które wyłączają bezpieczne opakowywanie treści zewnętrznej:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Pole ładunku cron `allowUnsafeExternalContent`

Wskazówki:

- W środowisku produkcyjnym pozostawiaj je nieustawione/false.
- Włączaj je tylko tymczasowo do ściśle ograniczonego debugowania.
- Jeśli są włączone, izoluj tego agenta (sandbox + minimalne narzędzia + dedykowana przestrzeń nazw sesji).

Uwaga o ryzyku hooków:

- Ładunki hooków to nieufna treść, nawet gdy dostarczanie pochodzi z systemów, które kontrolujesz (poczta/dokumenty/treść WWW może zawierać prompt injection).
- Słabsze klasy modeli zwiększają to ryzyko. W automatyzacji opartej na hookach preferuj silne nowoczesne klasy modeli i utrzymuj restrykcyjną politykę narzędzi (`tools.profile: "messaging"` lub ostrzejszą), plus sandboxing tam, gdzie to możliwe.

### Prompt injection nie wymaga publicznych wiadomości bezpośrednich

Nawet jeśli **tylko Ty** możesz wysyłać wiadomości do bota, prompt injection może nadal wystąpić przez
dowolną **nieufną treść**, którą bot odczytuje (wyniki wyszukiwania/pobierania z sieci, strony w przeglądarce,
maile, dokumenty, załączniki, wklejone logi/kod). Innymi słowy: nadawca nie jest jedyną powierzchnią zagrożenia;
same **treści** mogą zawierać wrogie instrukcje.

Gdy narzędzia są włączone, typowym ryzykiem jest eksfiltracja kontekstu lub wywołanie
narzędzi. Ogranicz promień rażenia przez:

- Używanie agenta **czytelnika** tylko do odczytu lub bez narzędzi do podsumowywania nieufnej treści,
  a następnie przekazywanie podsumowania do głównego agenta.
- Utrzymywanie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z narzędziami, chyba że są potrzebne.
- Dla wejść URL OpenResponses (`input_file` / `input_image`) ustaw ścisłe
  `gateway.http.endpoints.responses.files.urlAllowlist` i
  `gateway.http.endpoints.responses.images.urlAllowlist`, oraz utrzymuj niskie `maxUrlParts`.
  Puste allowlisty są traktowane jak nieustawione; użyj `files.allowUrl: false` / `images.allowUrl: false`,
  jeśli chcesz całkowicie wyłączyć pobieranie URL.
- Dla wejść plikowych OpenResponses zdekodowany tekst `input_file` nadal jest wstrzykiwany jako
  **nieufna treść zewnętrzna**. Nie zakładaj, że tekst pliku jest zaufany tylko dlatego,
  że Gateway zdekodował go lokalnie. Wstrzyknięty blok nadal zawiera jawne
  znaczniki graniczne `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` oraz metadane
  `Source: External`, mimo że ta ścieżka pomija dłuższy banner `SECURITY NOTICE:`.
- To samo opakowywanie oparte na znacznikach jest stosowane, gdy rozumienie multimediów wyodrębnia tekst
  z dołączonych dokumentów przed dopisaniem tego tekstu do promptu multimediów.
- Włączanie sandboxingu i restrykcyjnych allowlist narzędzi dla każdego agenta dotykającego nieufnych danych wejściowych.
- Trzymanie sekretów poza promptami; przekazuj je przez env/config na hoście gateway.

### Self-hosted backendy LLM

Self-hosted backendy zgodne z OpenAI, takie jak vLLM, SGLang, TGI, LM Studio,
lub niestandardowe stosy tokenizerów Hugging Face, mogą różnić się od hostowanych providerów sposobem
obsługi specjalnych tokenów szablonów czatu. Jeśli backend tokenizuje literały
takie jak `<|im_start|>`, `<|start_header_id|>` lub `<start_of_turn>` jako
strukturalne tokeny szablonu czatu wewnątrz treści użytkownika, nieufny tekst może próbować
fałszować granice ról na poziomie tokenizera.

OpenClaw usuwa typowe literały specjalnych tokenów rodzin modeli z opakowanej
treści zewnętrznej przed wysłaniem jej do modelu. Pozostaw włączone opakowywanie treści
zewnętrznej i, gdy to możliwe, preferuj ustawienia backendu, które rozdzielają lub escapują specjalne
tokeny w treści dostarczanej przez użytkownika. Hostowani providerzy, tacy jak OpenAI
i Anthropic, już stosują własną sanityzację po stronie żądania.

### Siła modelu (uwaga o bezpieczeństwie)

Odporność na prompt injection **nie** jest jednolita między klasami modeli. Mniejsze/tańsze modele są na ogół bardziej podatne na niewłaściwe użycie narzędzi i przejmowanie instrukcji, szczególnie przy antagonistycznych promptach.

<Warning>
Dla agentów z włączonymi narzędziami lub agentów czytających nieufną treść ryzyko prompt injection przy starszych/mniejszych modelach jest często zbyt wysokie. Nie uruchamiaj takich obciążeń na słabych klasach modeli.
</Warning>

Zalecenia:

- **Używaj najnowszego, najlepszej klasy modelu** dla każdego bota, który może uruchamiać narzędzia lub dotykać plików/sieci.
- **Nie używaj starszych/słabszych/mniejszych klas** dla agentów z włączonymi narzędziami lub nieufnych skrzynek odbiorczych; ryzyko prompt injection jest zbyt wysokie.
- Jeśli musisz użyć mniejszego modelu, **zmniejsz promień rażenia** (narzędzia tylko do odczytu, silny sandboxing, minimalny dostęp do systemu plików, ścisłe allowlisty).
- Przy uruchamianiu małych modeli **włącz sandboxing dla wszystkich sesji** i **wyłącz `web_search`/`web_fetch`/`browser`**, chyba że wejścia są ściśle kontrolowane.
- Dla osobistych asystentów tylko do czatu z zaufanym wejściem i bez narzędzi mniejsze modele zwykle są w porządku.

## Reasoning i verbose output w grupach

`/reasoning`, `/verbose` i `/trace` mogą ujawniać wewnętrzne reasoning, dane wyjściowe narzędzi lub diagnostykę Pluginów, które
nie były przeznaczone dla kanału publicznego. W ustawieniach grupowych traktuj je jako **tylko do debugowania**
i pozostawiaj wyłączone, chyba że jawnie ich potrzebujesz.

Wskazówki:

- Utrzymuj `/reasoning`, `/verbose` i `/trace` wyłączone w publicznych pokojach.
- Jeśli je włączasz, rób to tylko w zaufanych wiadomościach bezpośrednich lub ściśle kontrolowanych pokojach.
- Pamiętaj: dane wyjściowe verbose i trace mogą zawierać argumenty narzędzi, URL-e, diagnostykę Pluginów i dane, które widział model.

## Przykłady hardeningu konfiguracji

### Uprawnienia plików

Zachowaj prywatność konfiguracji + stanu na hoście gateway:

- `~/.openclaw/openclaw.json`: `600` (tylko użytkownik może czytać/zapisywać)
- `~/.openclaw`: `700` (tylko użytkownik)

`openclaw doctor` może ostrzec i zaproponować zaostrzenie tych uprawnień.

### Ekspozycja sieciowa (bind, port, firewall)

Gateway multipleksuje **WebSocket + HTTP** na jednym porcie:

- Domyślnie: `18789`
- Config/flagi/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ta powierzchnia HTTP obejmuje interfejs Control i host canvas:

- Interfejs Control (zasoby SPA) (domyślna ścieżka bazowa `/`)
- Host canvas: `/__openclaw__/canvas/` i `/__openclaw__/a2ui/` (dowolne HTML/JS; traktuj jako nieufną treść)

Jeśli ładujesz treść canvas w zwykłej przeglądarce, traktuj ją jak każdą inną nieufną stronę WWW:

- Nie wystawiaj hosta canvas niezaufanym sieciom/użytkownikom.
- Nie pozwalaj, aby treść canvas współdzieliła ten sam origin z uprzywilejowanymi powierzchniami WWW, chyba że w pełni rozumiesz konsekwencje.

Tryb bind kontroluje, gdzie nasłuchuje Gateway:

- `gateway.bind: "loopback"` (domyślnie): mogą łączyć się tylko lokalni klienci.
- Powiązania inne niż loopback (`"lan"`, `"tailnet"`, `"custom"`) rozszerzają powierzchnię ataku. Używaj ich tylko z auth gateway (współdzielony token/hasło lub poprawnie skonfigurowane trusted proxy spoza loopback) oraz rzeczywistym firewallem.

Zasady praktyczne:

- Preferuj Tailscale Serve zamiast bindów LAN (Serve utrzymuje Gateway na loopback, a Tailscale obsługuje dostęp).
- Jeśli musisz powiązać z LAN, ogranicz port firewallem do ścisłej allowlisty źródłowych adresów IP; nie przekierowuj go szeroko.
- Nigdy nie wystawiaj nieuwierzytelnionego Gateway na `0.0.0.0`.

### Publikowanie portów Docker z UFW

Jeśli uruchamiasz OpenClaw z Dockerem na VPS, pamiętaj, że opublikowane porty kontenera
(`-p HOST:CONTAINER` lub Compose `ports:`) są routowane przez łańcuchy przekazywania Docker, a nie
tylko przez reguły `INPUT` hosta.

Aby utrzymać ruch Docker zgodny z polityką firewalla, egzekwuj reguły w
`DOCKER-USER` (ten łańcuch jest oceniany przed własnymi regułami accept Dockera).
Na wielu nowoczesnych dystrybucjach `iptables`/`ip6tables` używają frontendów `iptables-nft`
i nadal stosują te reguły do backendu nftables.

Minimalny przykład allowlisty (IPv4):
__OC_I18N_900008__
IPv6 ma osobne tabele. Dodaj odpowiadającą politykę w `/etc/ufw/after6.rules`, jeśli
Docker IPv6 jest włączony.

Unikaj wpisywania na sztywno nazw interfejsów takich jak `eth0` w fragmentach dokumentacji. Nazwy interfejsów
różnią się między obrazami VPS (`ens3`, `enp*` itd.), a niedopasowania mogą przypadkowo
pominąć Twoją regułę blokującą.

Szybka walidacja po przeładowaniu:
__OC_I18N_900009__
Oczekiwane porty zewnętrzne powinny obejmować tylko to, co celowo wystawiasz (dla większości
konfiguracji: SSH + porty reverse proxy).

### Wykrywanie mDNS/Bonjour

Gateway rozgłasza swoją obecność przez mDNS (`_openclaw-gw._tcp` na porcie 5353) do lokalnego wykrywania urządzeń. W trybie pełnym obejmuje to rekordy TXT, które mogą ujawniać szczegóły operacyjne:

- `cliPath`: pełna ścieżka systemu plików do binarki CLI (ujawnia nazwę użytkownika i lokalizację instalacji)
- `sshPort`: reklamuje dostępność SSH na hoście
- `displayName`, `lanHost`: informacje o nazwie hosta

**Uwagi dotyczące bezpieczeństwa operacyjnego:** Rozgłaszanie szczegółów infrastruktury ułatwia rekonesans każdemu w sieci lokalnej. Nawet „nieszkodliwe” informacje, takie jak ścieżki systemu plików i dostępność SSH, pomagają atakującym mapować Twoje środowisko.

**Zalecenia:**

1. **Tryb minimalny** (domyślny, zalecany dla wystawionych gateway): pomija wrażliwe pola z rozgłoszeń mDNS:
__OC_I18N_900010__
2. **Wyłącz całkowicie**, jeśli nie potrzebujesz lokalnego wykrywania urządzeń:
__OC_I18N_900011__
3. **Tryb pełny** (opt-in): uwzględnia `cliPath` + `sshPort` w rekordach TXT:
__OC_I18N_900012__
4. **Zmienna środowiskowa** (alternatywa): ustaw `OPENCLAW_DISABLE_BONJOUR=1`, aby wyłączyć mDNS bez zmian konfiguracji.

W trybie minimalnym Gateway nadal rozgłasza wystarczająco dużo do wykrywania urządzeń (`role`, `gatewayPort`, `transport`), ale pomija `cliPath` i `sshPort`. Aplikacje potrzebujące informacji o ścieżce CLI mogą pobrać je później przez uwierzytelnione połączenie WebSocket.

### Zablokuj Gateway WebSocket (lokalne auth)

Auth Gateway jest **domyślnie wymagane**. Jeśli nie skonfigurowano poprawnej ścieżki auth gateway,
Gateway odmawia połączeń WebSocket (fail‑closed).

Onboarding domyślnie generuje token (nawet dla loopback), więc
lokalni klienci muszą się uwierzytelnić.

Ustaw token, aby **wszyscy** klienci WS musieli się uwierzytelnić:
__OC_I18N_900013__
Doctor może wygenerować token za Ciebie: `openclaw doctor --generate-gateway-token`.

Uwaga: `gateway.remote.token` / `.password` to źródła poświadczeń klienta. Same
w sobie **nie** chronią lokalnego dostępu WS.
Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*`
nie jest ustawione.
Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez
SecretRef i nierozstrzygnięte, rozstrzyganie kończy się odmową (bez maskującego fallbacku zdalnego).
Opcjonalnie: przypnij zdalny TLS przez `gateway.remote.tlsFingerprint` przy użyciu `wss://`.
Jawnotekstowe `ws://` jest domyślnie dozwolone tylko dla loopback. Dla zaufanych ścieżek
sieci prywatnej ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
break-glass. To celowo działa tylko przez środowisko procesu, a nie jako
klucz konfiguracji `openclaw.json`.

Lokalne parowanie urządzeń:

- Parowanie urządzeń jest automatycznie zatwierdzane dla bezpośrednich lokalnych połączeń loopback, aby
  zachować płynność dla klientów na tym samym hoście.
- OpenClaw ma też wąską ścieżkę lokalnego samopołączenia backend/kontener dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet i LAN, w tym bindy tailnet na tym samym hoście, są traktowane jako
  zdalne na potrzeby parowania i nadal wymagają zatwierdzenia.
- Dowody z nagłówków przekazanych dalej w żądaniu loopback wykluczają lokalność
  loopback. Automatyczne zatwierdzanie podniesienia metadanych ma wąski zakres. Zobacz
  [Parowanie Gateway](/gateway/pairing), aby poznać obie reguły.

Tryby auth:

- `gateway.auth.mode: "token"`: współdzielony token bearer (zalecane dla większości konfiguracji).
- `gateway.auth.mode: "password"`: auth hasłem (preferowane ustawienie przez env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: zaufaj reverse proxy świadomemu tożsamości, które uwierzytelnia użytkowników i przekazuje tożsamość przez nagłówki (zobacz [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).

Checklista rotacji (token/hasło):

1. Wygeneruj/ustaw nowy sekret (`gateway.auth.token` lub `OPENCLAW_GATEWAY_PASSWORD`).
2. Uruchom ponownie Gateway (lub aplikację macOS, jeśli nadzoruje Gateway).
3. Zaktualizuj wszystkie zdalne klienty (`gateway.remote.token` / `.password` na maszynach wywołujących Gateway).
4. Zweryfikuj, że stare poświadczenia nie pozwalają już na połączenie.

### Nagłówki tożsamości Tailscale Serve

Gdy `gateway.auth.allowTailscale` ma wartość `true` (domyślnie dla Serve), OpenClaw
akceptuje nagłówki tożsamości Tailscale Serve (`tailscale-user-login`) do
uwierzytelniania interfejsu Control UI/WebSocket. OpenClaw weryfikuje tożsamość, rozstrzygając
adres `x-forwarded-for` przez lokalny daemon Tailscale (`tailscale whois`)
i dopasowując go do nagłówka. Uruchamia się to tylko dla żądań trafiających do loopback
i zawierających `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`,
jak wstrzykuje Tailscale.
Dla tej asynchronicznej ścieżki sprawdzania tożsamości nieudane próby dla tego samego `{scope, ip}`
są serializowane, zanim limiter zapisze błąd. Współbieżne błędne ponowienia
od jednego klienta Serve mogą więc zablokować drugą próbę natychmiast
zamiast przejść wyścigowo jako dwa zwykłe niedopasowania.
Punkty końcowe HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają auth nagłówków tożsamości Tailscale. Nadal podążają za
skonfigurowanym trybem auth HTTP gateway.

Ważna uwaga o granicy:

- HTTP bearer auth Gateway jest w praktyce dostępem operatora typu wszystko albo nic.
- Traktuj poświadczenia mogące wywoływać `/v1/chat/completions`, `/v1/responses` lub `/api/channels/*` jako sekrety operatora z pełnym dostępem dla tego gateway.
- Na powierzchni HTTP zgodnej z OpenAI współdzielone bearer auth przywraca pełne domyślne zakresy operatora (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) oraz semantykę właściciela dla tur agenta; węższe wartości `x-openclaw-scopes` nie ograniczają tej ścieżki współdzielonego sekretu.
- Semantyka zakresów per żądanie na HTTP działa tylko wtedy, gdy żądanie pochodzi z trybu niosącego tożsamość, takiego jak trusted proxy auth albo `gateway.auth.mode="none"` na prywatnym wejściu.
- W tych trybach niosących tożsamość pominięcie `x-openclaw-scopes` wraca do normalnego domyślnego zestawu zakresów operatora; wysyłaj ten nagłówek jawnie, gdy chcesz węższy zestaw zakresów.
- `/tools/invoke` stosuje tę samą zasadę współdzielonego sekretu: bearer auth token/password jest również traktowane tam jako pełny dostęp operatora, podczas gdy tryby niosące tożsamość nadal respektują zadeklarowane zakresy.
- Nie udostępniaj tych poświadczeń niezaufanym wywołującym; preferuj osobne gateway dla każdej granicy zaufania.

**Założenie zaufania:** beztokenowe auth Serve zakłada, że host gateway jest zaufany.
Nie traktuj tego jako ochrony przed wrogimi procesami na tym samym hoście. Jeśli na hoście gateway
może działać niezaufany lokalny kod, wyłącz `gateway.auth.allowTailscale`
i wymagaj jawnego auth opartego na współdzielonym sekrecie z `gateway.auth.mode: "token"` lub
`"password"`.

**Reguła bezpieczeństwa:** nie przekazuj tych nagłówków ze swojego reverse proxy. Jeśli
kończysz TLS albo stosujesz proxy przed gateway, wyłącz
`gateway.auth.allowTailscale` i użyj auth opartego na współdzielonym sekrecie (`gateway.auth.mode:
"token"` lub `"password"`) albo [Trusted Proxy Auth](/gateway/trusted-proxy-auth)
zamiast tego.

Zaufane proxy:

- Jeśli kończysz TLS przed Gateway, ustaw `gateway.trustedProxies` na adresy IP swoich proxy.
- OpenClaw zaufa `x-forwarded-for` (lub `x-real-ip`) z tych adresów IP w celu określenia IP klienta dla lokalnych kontroli parowania i lokalnych kontroli auth/HTTP.
- Upewnij się, że proxy **nadpisuje** `x-forwarded-for` i blokuje bezpośredni dostęp do portu Gateway.

Zobacz [Tailscale](/gateway/tailscale) i [Przegląd web](/web).

### Sterowanie przeglądarką przez hosta Node (zalecane)

Jeśli Gateway jest zdalny, ale przeglądarka działa na innej maszynie, uruchom **host Node**
na maszynie z przeglądarką i pozwól Gateway przekazywać akcje przeglądarki (zobacz [Narzędzie przeglądarki](/tools/browser)).
Traktuj parowanie Node jak dostęp administratora.

Zalecany wzorzec:

- Trzymaj Gateway i host Node w tym samym tailnet (Tailscale).
- Sparuj Node świadomie; wyłącz routing proxy przeglądarki, jeśli go nie potrzebujesz.

Unikaj:

- Wystawiania portów relay/control przez LAN lub publiczny internet.
- Tailscale Funnel dla punktów końcowych sterowania przeglądarką (ekspozycja publiczna).

### Sekrety na dysku

Zakładaj, że wszystko w `~/.openclaw/` (lub `$OPENCLAW_STATE_DIR/`) może zawierać sekrety lub prywatne dane:

- `openclaw.json`: konfiguracja może zawierać tokeny (gateway, zdalny gateway), ustawienia providerów i allowlisty.
- `credentials/**`: poświadczenia kanałów (np. poświadczenia WhatsApp), allowlisty parowania, starsze importy OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: klucze API, profile tokenów, tokeny OAuth i opcjonalne `keyRef`/`tokenRef`.
- `secrets.json` (opcjonalne): ładunek sekretów oparty na pliku używany przez providerów SecretRef typu `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: starszy plik zgodności. Statyczne wpisy `api_key` są scrubowane po wykryciu.
- `agents/<agentId>/sessions/**`: transkrypty sesji (`*.jsonl`) + metadane routingu (`sessions.json`), które mogą zawierać prywatne wiadomości i dane wyjściowe narzędzi.
- pakiety dołączonych Pluginów: zainstalowane Pluginy (plus ich `node_modules/`).
- `sandboxes/**`: obszary robocze sandboxów narzędzi; mogą gromadzić kopie plików odczytywanych/zapisywanych wewnątrz sandboxa.

Wskazówki hardeningowe:

- Utrzymuj ścisłe uprawnienia (`700` dla katalogów, `600` dla plików).
- Używaj pełnego szyfrowania dysku na hoście gateway.
- Preferuj dedykowane konto użytkownika OS dla Gateway, jeśli host jest współdzielony.

### Pliki `.env` obszaru roboczego

OpenClaw ładuje lokalne dla obszaru roboczego pliki `.env` dla agentów i narzędzi, ale nigdy nie pozwala, by te pliki po cichu nadpisywały kontrolki runtime gateway.

- Każdy klucz zaczynający się od `OPENCLAW_*` jest blokowany w niezaufanych plikach `.env` obszaru roboczego.
- Ustawienia punktów końcowych kanałów dla Matrix, Mattermost, IRC i Synology Chat również są blokowane przed nadpisaniem przez `.env` obszaru roboczego, tak aby sklonowane obszary robocze nie mogły przekierowywać ruchu dołączonych connectorów przez lokalną konfigurację punktów końcowych. Klucze env punktów końcowych (takie jak `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) muszą pochodzić ze środowiska procesu gateway albo z `env.shellEnv`, a nie z `.env` ładowanego z obszaru roboczego.
- Blokada działa w trybie fail-closed: nowa zmienna sterująca runtime dodana w przyszłej wersji nie może zostać odziedziczona z commitowanego lub dostarczonego przez atakującego `.env`; klucz jest ignorowany, a gateway zachowuje własną wartość.
- Zaufane zmienne środowiskowe procesu/OS (własna powłoka gateway, jednostka launchd/systemd, bundle aplikacji) nadal działają — to ogranicza tylko ładowanie plików `.env`.

Dlaczego: pliki `.env` obszaru roboczego często leżą obok kodu agenta, bywają commitowane przez przypadek albo zapisywane przez narzędzia. Zablokowanie całego prefiksu `OPENCLAW_*` oznacza, że dodanie nowej flagi `OPENCLAW_*` w przyszłości nigdy nie może cofnąć się do cichego dziedziczenia ze stanu obszaru roboczego.

### Logi i transkrypty (redakcja i retencja)

Logi i transkrypty mogą ujawniać wrażliwe informacje nawet wtedy, gdy kontrola dostępu jest poprawna:

- Logi Gateway mogą zawierać podsumowania narzędzi, błędy i URL-e.
- Transkrypty sesji mogą zawierać wklejone sekrety, zawartość plików, dane wyjściowe poleceń i linki.

Zalecenia:

- Pozostaw redakcję podsumowań narzędzi włączoną (`logging.redactSensitive: "tools"`; domyślnie).
- Dodaj własne wzorce dla swojego środowiska przez `logging.redactPatterns` (tokeny, nazwy hostów, wewnętrzne URL-e).
- Udostępniając diagnostykę, preferuj `openclaw status --all` (do wklejenia, sekrety zredagowane) zamiast surowych logów.
- Przycinaj stare transkrypty sesji i pliki logów, jeśli nie potrzebujesz długiej retencji.

Szczegóły: [Logowanie](/gateway/logging)

### Wiadomości bezpośrednie: domyślnie pairing
__OC_I18N_900014__
### Grupy: wszędzie wymagaj wzmianki
__OC_I18N_900015__
W czatach grupowych odpowiadaj tylko wtedy, gdy bot zostanie jawnie wspomniany.

### Osobne numery (WhatsApp, Signal, Telegram)

Dla kanałów opartych na numerach telefonów rozważ uruchamianie AI na osobnym numerze telefonu niż Twój osobisty:

- Numer osobisty: Twoje rozmowy pozostają prywatne
- Numer bota: AI obsługuje te rozmowy, z odpowiednimi granicami

### Tryb tylko do odczytu (przez sandbox i narzędzia)

Możesz zbudować profil tylko do odczytu, łącząc:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (lub `"none"` dla braku dostępu do obszaru roboczego)
- listy allow/deny narzędzi blokujące `write`, `edit`, `apply_patch`, `exec`, `process` itd.

Dodatkowe opcje hardeningu:

- `tools.exec.applyPatch.workspaceOnly: true` (domyślnie): zapewnia, że `apply_patch` nie może zapisywać/usuwać poza katalogiem obszaru roboczego nawet przy wyłączonym sandboxingu. Ustaw `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` dotykał plików poza obszarem roboczym.
- `tools.fs.workspaceOnly: true` (opcjonalne): ogranicza ścieżki `read`/`write`/`edit`/`apply_patch` oraz natywne ścieżki automatycznego ładowania obrazów w promptach do katalogu obszaru roboczego (przydatne, jeśli dziś dopuszczasz ścieżki absolutne i chcesz mieć jedną wspólną ochronę).
- Utrzymuj wąskie katalogi główne systemu plików: unikaj szerokich katalogów głównych, takich jak katalog domowy, dla obszarów roboczych agentów/sandboxów. Szerokie katalogi główne mogą wystawić wrażliwe pliki lokalne (na przykład stan/konfigurację w `~/.openclaw`) narzędziom systemu plików.

### Bezpieczna baza (kopiuj/wklej)

Jedna „bezpieczna domyślna” konfiguracja, która utrzymuje prywatny Gateway, wymaga parowania wiadomości bezpośrednich i unika botów grupowych zawsze aktywnych:
__OC_I18N_900016__
Jeśli chcesz także „domyślnie bezpieczniejszego” wykonywania narzędzi, dodaj sandbox + zablokuj niebezpieczne narzędzia dla każdego agenta niebędącego właścicielem (przykład poniżej w sekcji „Profile dostępu per agent”).

Wbudowana baza dla tur agenta wyzwalanych przez czat: nadawcy niebędący właścicielem nie mogą używać narzędzi `cron` ani `gateway`.

## Sandboxing (zalecane)

Dedykowana dokumentacja: [Sandboxing](/gateway/sandboxing)

Dwa uzupełniające się podejścia:

- **Uruchom pełny Gateway w Dockerze** (granica kontenera): [Docker](/install/docker)
- **Sandbox narzędzi** (`agents.defaults.sandbox`, host gateway + narzędzia izolowane sandboxem; Docker jest domyślnym backendem): [Sandboxing](/gateway/sandboxing)

Uwaga: aby zapobiec dostępowi między agentami, pozostaw `agents.defaults.sandbox.scope` na `"agent"` (domyślnie)
lub ustaw `"session"` dla ostrzejszej izolacji per sesja. `scope: "shared"` używa
jednego kontenera/obszaru roboczego.

Rozważ również dostęp agenta do obszaru roboczego wewnątrz sandboxa:

- `agents.defaults.sandbox.workspaceAccess: "none"` (domyślnie) utrzymuje obszar roboczy agenta poza zasięgiem; narzędzia działają na obszarze roboczym sandboxa w `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` montuje obszar roboczy agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` montuje obszar roboczy agenta do odczytu i zapisu pod `/workspace`
- Dodatkowe `sandbox.docker.binds` są walidowane względem znormalizowanych i kanonicznych ścieżek źródłowych. Sztuczki z dowiązaniami symbolicznymi w katalogach nadrzędnych i kanoniczne aliasy katalogu domowego nadal kończą się odmową fail-closed, jeśli rozstrzygają się do zablokowanych katalogów głównych, takich jak `/etc`, `/var/run` lub katalogi poświadczeń w katalogu domowym systemu OS.

Ważne: `tools.elevated` to globalna furtka bazowa, która uruchamia exec poza sandboxem. Efektywny host to domyślnie `gateway`, albo `node`, gdy cel exec jest skonfigurowany jako `node`. Utrzymuj ścisłe `tools.elevated.allowFrom` i nie włączaj tego dla obcych. Możesz dodatkowo ograniczyć elevated per agent przez `agents.list[].tools.elevated`. Zobacz [Tryb Elevated](/tools/elevated).

### Guardrail delegowania subagentów

Jeśli zezwalasz na narzędzia sesji, traktuj delegowane uruchomienia subagentów jako kolejną decyzję o granicy:

- Blokuj `sessions_spawn`, chyba że agent rzeczywiście potrzebuje delegowania.
- Ogranicz `agents.defaults.subagents.allowAgents` oraz wszystkie nadpisania per agent `agents.list[].subagents.allowAgents` do znanych bezpiecznych agentów docelowych.
- Dla każdego przepływu pracy, który musi pozostać w sandboxie, wywołuj `sessions_spawn` z `sandbox: "require"` (domyślnie jest `inherit`).
- `sandbox: "require"` kończy się szybkim błędem, gdy docelowy runtime potomny nie jest sandboxowany.

## Ryzyko sterowania przeglądarką

Włączenie sterowania przeglądarką daje modelowi możliwość kierowania prawdziwą przeglądarką.
Jeśli ten profil przeglądarki zawiera już zalogowane sesje, model może
uzyskać dostęp do tych kont i danych. Traktuj profile przeglądarki jako **wrażliwy stan**:

- Preferuj dedykowany profil dla agenta (domyślny profil `openclaw`).
- Unikaj kierowania agenta na swój osobisty codzienny profil.
- Utrzymuj sterowanie przeglądarką hosta wyłączone dla agentów sandboxowanych, chyba że im ufasz.
- Samodzielne loopback API sterowania przeglądarką honoruje tylko auth oparte
  na współdzielonym sekrecie (bearer auth tokenu gateway lub hasła gateway). Nie
  wykorzystuje nagłówków tożsamości trusted-proxy ani Tailscale Serve.
- Traktuj pobrania przeglądarki jako nieufne wejście; preferuj izolowany katalog pobrań.
- Jeśli to możliwe, wyłącz synchronizację przeglądarki/menedżery haseł w profilu agenta (zmniejsza promień rażenia).
- Dla zdalnych gateway zakładaj, że „sterowanie przeglądarką” jest równoważne „dostępowi operatora” do wszystkiego, do czego ten profil ma dostęp.
- Utrzymuj Gateway i hosty Node wyłącznie w tailnet; unikaj wystawiania portów sterowania przeglądarką do LAN lub publicznego internetu.
- Wyłącz routing proxy przeglądarki, gdy go nie potrzebujesz (`gateway.nodes.browser.mode="off"`).
- Tryb istniejącej sesji Chrome MCP **nie** jest „bezpieczniejszy”; może działać jak Ty we wszystkim, do czego ten profil Chrome na danym hoście ma dostęp.

### Polityka SSRF przeglądarki (domyślnie restrykcyjna)

Polityka nawigacji przeglądarki w OpenClaw jest domyślnie restrykcyjna: prywatne/wewnętrzne cele pozostają zablokowane, chyba że jawnie się na to zgodzisz.

- Domyślnie: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest nieustawione, więc nawigacja przeglądarki blokuje cele prywatne/wewnętrzne/specjalnego przeznaczenia.
- Starszy alias: `browser.ssrfPolicy.allowPrivateNetwork` nadal jest akceptowany dla zgodności.
- Tryb opt-in: ustaw `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, aby dopuścić cele prywatne/wewnętrzne/specjalnego przeznaczenia.
- W trybie restrykcyjnym używaj `hostnameAllowlist` (wzorce takie jak `*.example.com`) i `allowedHostnames` (dokładne wyjątki hostów, w tym zablokowane nazwy takie jak `localhost`) dla jawnych wyjątków.
- Nawigacja jest sprawdzana przed żądaniem i best-effort ponownie sprawdzana na końcowym URL `http(s)` po nawigacji, aby ograniczyć pivoty oparte na przekierowaniach.

Przykład restrykcyjnej polityki:
__OC_I18N_900017__
## Profile dostępu per agent (multi-agent)

Przy routingu multi-agent każdy agent może mieć własny sandbox + politykę narzędzi:
używaj tego, aby przydzielać **pełny dostęp**, **tylko odczyt** lub **brak dostępu** per agent.
Pełne szczegóły i zasady pierwszeństwa znajdziesz w [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools).

Typowe przypadki użycia:

- Agent osobisty: pełny dostęp, bez sandboxa
- Agent rodzinny/służbowy: sandboxowany + narzędzia tylko do odczytu
- Agent publiczny: sandboxowany + bez narzędzi systemu plików/powłoki

### Przykład: pełny dostęp (bez sandboxa)
__OC_I18N_900018__
### Przykład: narzędzia tylko do odczytu + obszar roboczy tylko do odczytu
__OC_I18N_900019__
### Przykład: brak dostępu do systemu plików/powłoki (dozwolone wiadomości providera)
__OC_I18N_900020__
## Reagowanie na incydenty

Jeśli AI zrobi coś złego:

### Ogranicz szkody

1. **Zatrzymaj to:** zatrzymaj aplikację macOS (jeśli nadzoruje Gateway) albo zakończ proces `openclaw gateway`.
2. **Zamknij ekspozycję:** ustaw `gateway.bind: "loopback"` (lub wyłącz Tailscale Funnel/Serve), dopóki nie zrozumiesz, co się stało.
3. **Zamroź dostęp:** przełącz ryzykowne wiadomości bezpośrednie/grupy na `dmPolicy: "disabled"` / wymagaj wzmianek, i usuń wpisy `"*"` typu allow-all, jeśli je miałeś.

### Obróć sekrety (zakładaj kompromitację, jeśli sekrety wyciekły)

1. Obróć auth Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) i uruchom ponownie.
2. Obróć sekrety zdalnych klientów (`gateway.remote.token` / `.password`) na każdej maszynie, która może wywoływać Gateway.
3. Obróć poświadczenia providerów/API (poświadczenia WhatsApp, tokeny Slack/Discord, klucze modeli/API w `auth-profiles.json` oraz wartości ładunków zaszyfrowanych sekretów, gdy są używane).

### Audyt

1. Sprawdź logi Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (lub `logging.file`).
2. Przejrzyj odpowiednie transkrypty: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Przejrzyj ostatnie zmiany konfiguracji (wszystko, co mogło rozszerzyć dostęp: `gateway.bind`, `gateway.auth`, zasady wiadomości bezpośrednich/grup, `tools.elevated`, zmiany Pluginów).
4. Uruchom ponownie `openclaw security audit --deep` i potwierdź, że krytyczne znaleziska zostały naprawione.

### Zbierz do zgłoszenia

- Znacznik czasu, system OS hosta gateway + wersja OpenClaw
- Transkrypty sesji + krótki tail logów (po redakcji)
- Co wysłał atakujący + co zrobił agent
- Czy Gateway był wystawiony poza loopback (LAN/Tailscale Funnel/Serve)

## Skanowanie sekretów za pomocą detect-secrets

CI uruchamia hook pre-commit `detect-secrets` w zadaniu `secrets`.
Push do `main` zawsze uruchamia skan wszystkich plików. Pull requesty używają
szybkiej ścieżki dla zmienionych plików, gdy dostępny jest commit bazowy, i wracają do
skanu wszystkich plików w przeciwnym razie. Jeśli zadanie się nie powiedzie, pojawiły się nowe kandydaty, których jeszcze nie ma w baseline.

### Jeśli CI zakończy się błędem

1. Odtwórz lokalnie:
__OC_I18N_900021__
2. Zrozum narzędzia:
   - `detect-secrets` w pre-commit uruchamia `detect-secrets-hook` z baseline
     repozytorium i wykluczeniami.
   - `detect-secrets audit` otwiera interaktywny przegląd, aby oznaczyć każdy element baseline
     jako prawdziwy lub false positive.
3. Dla prawdziwych sekretów: obróć/usuń je, a następnie uruchom ponownie skan, aby zaktualizować baseline.
4. Dla false positive: uruchom interaktywny audyt i oznacz je jako fałszywe:
__OC_I18N_900022__
5. Jeśli potrzebujesz nowych wykluczeń, dodaj je do `.detect-secrets.cfg` i wygeneruj
   baseline ponownie z pasującymi flagami `--exclude-files` / `--exclude-lines` (plik
   konfiguracyjny ma charakter referencyjny; detect-secrets nie czyta go automatycznie).

Commituj zaktualizowany `.secrets.baseline`, gdy odzwierciedla zamierzony stan.

## Zgłaszanie problemów bezpieczeństwa

Znalazłeś podatność w OpenClaw? Zgłoś ją odpowiedzialnie:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Nie publikuj publicznie do czasu naprawy
3. Uhonorujemy Cię za zgłoszenie (chyba że wolisz anonimowość)
