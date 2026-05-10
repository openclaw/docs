---
read_when:
    - Dodawanie funkcji rozszerzających dostęp lub automatyzację
summary: Kwestie bezpieczeństwa i model zagrożeń dotyczące uruchamiania Gateway dla sztucznej inteligencji z dostępem do powłoki
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-10T19:38:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc25981e46229a6fabe72d70222953e84fcb6a0b19792e9849c4e05de7c266bb
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model zaufania osobistego asystenta.** Te wytyczne zakładają jedną zaufaną
  granicę operatora na Gateway (model osobistego asystenta dla jednego użytkownika).
  OpenClaw **nie** jest wrogą, wielodzierżawną granicą bezpieczeństwa dla wielu
  antagonistycznych użytkowników współdzielących jednego agenta lub Gateway. Jeśli potrzebujesz działania
  z mieszanym zaufaniem lub antagonistycznymi użytkownikami, rozdziel granice zaufania (osobny Gateway +
  poświadczenia, najlepiej osobni użytkownicy systemu operacyjnego lub hosty).
</Warning>

## Najpierw zakres: model bezpieczeństwa osobistego asystenta

Wytyczne bezpieczeństwa OpenClaw zakładają wdrożenie **osobistego asystenta**: jedną zaufaną granicę operatora, potencjalnie wielu agentów.

- Obsługiwana postawa bezpieczeństwa: jeden użytkownik/granica zaufania na Gateway (preferuj jednego użytkownika systemu operacyjnego/host/VPS na granicę).
- Nieobsługiwana granica bezpieczeństwa: jeden współdzielony Gateway/agent używany przez wzajemnie niezaufanych lub antagonistycznych użytkowników.
- Jeśli wymagana jest izolacja antagonistycznych użytkowników, rozdziel według granicy zaufania (osobny Gateway + poświadczenia, a najlepiej osobni użytkownicy systemu operacyjnego/hosty).
- Jeśli wielu niezaufanych użytkowników może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, traktuj ich tak, jakby współdzielili te same delegowane uprawnienia narzędziowe dla tego agenta.

Ta strona wyjaśnia utwardzanie **w ramach tego modelu**. Nie deklaruje wrogiej izolacji wielodzierżawnej na jednym współdzielonym Gateway.

## Szybkie sprawdzenie: `openclaw security audit`

Zobacz też: [Formalna weryfikacja (modele bezpieczeństwa)](/pl/security/formal-verification)

Uruchamiaj to regularnie (zwłaszcza po zmianie konfiguracji lub wystawieniu powierzchni sieciowych):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` pozostaje celowo wąskie: przełącza typowe otwarte zasady grup
na listy dozwolonych, przywraca `logging.redactSensitive: "tools"`, zaostrza
uprawnienia stanu/konfiguracji/dołączanych plików i używa resetowania ACL Windows zamiast
POSIX `chmod`, gdy działa w Windows.

Oznacza typowe pułapki (ekspozycję uwierzytelniania Gateway, ekspozycję sterowania przeglądarką, podwyższone listy dozwolonych, uprawnienia systemu plików, liberalne zatwierdzenia wykonania oraz ekspozycję narzędzi w otwartych kanałach).

OpenClaw jest jednocześnie produktem i eksperymentem: podłączasz zachowanie modeli frontier do rzeczywistych powierzchni komunikacyjnych i rzeczywistych narzędzi. **Nie istnieje „idealnie bezpieczna” konfiguracja.** Celem jest świadome podejście do tego:

- kto może rozmawiać z twoim botem
- gdzie bot może działać
- czego bot może dotykać

Zacznij od najmniejszego dostępu, który nadal działa, a potem rozszerzaj go, gdy zyskasz pewność.

### Wdrożenie i zaufanie do hosta

OpenClaw zakłada, że host i granica konfiguracji są zaufane:

- Jeśli ktoś może modyfikować stan/konfigurację hosta Gateway (`~/.openclaw`, w tym `openclaw.json`), traktuj go jako zaufanego operatora.
- Uruchamianie jednego Gateway dla wielu wzajemnie niezaufanych/antagonistycznych operatorów **nie jest zalecaną konfiguracją**.
- W przypadku zespołów z mieszanym zaufaniem rozdziel granice zaufania za pomocą osobnych Gateway (lub co najmniej osobnych użytkowników systemu operacyjnego/hostów).
- Zalecane ustawienie domyślne: jeden użytkownik na maszynę/host (lub VPS), jeden Gateway dla tego użytkownika i jeden lub więcej agentów w tym Gateway.
- W jednej instancji Gateway uwierzytelniony dostęp operatora jest zaufaną rolą płaszczyzny sterowania, a nie rolą dzierżawcy na użytkownika.
- Identyfikatory sesji (`sessionKey`, identyfikatory sesji, etykiety) są selektorami routingu, a nie tokenami autoryzacji.
- Jeśli kilka osób może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, każda z nich może sterować tym samym zestawem uprawnień. Izolacja sesji/pamięci na użytkownika pomaga chronić prywatność, ale nie zmienia współdzielonego agenta w autoryzację hosta na użytkownika.

### Bezpieczne operacje na plikach

OpenClaw używa `@openclaw/fs-safe` do dostępu do plików ograniczonego do korzenia, zapisów atomowych, rozpakowywania archiwów, tymczasowych przestrzeni roboczych i pomocników plików tajnych. OpenClaw domyślnie wyłącza opcjonalnego pomocnika POSIX Python z fs-safe; ustaw `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` lub `require` tylko wtedy, gdy chcesz dodatkowego utwardzenia mutacji względnych wobec fd i możesz obsłużyć środowisko uruchomieniowe Python.

Szczegóły: [Bezpieczne operacje na plikach](/pl/gateway/security/secure-file-operations).

### Współdzielony obszar roboczy Slack: realne ryzyko

Jeśli „wszyscy w Slack mogą wysyłać wiadomości do bota”, głównym ryzykiem są delegowane uprawnienia narzędziowe:

- każdy dozwolony nadawca może wywołać wywołania narzędzi (`exec`, przeglądarka, narzędzia sieciowe/plikowe) w ramach zasad agenta;
- wstrzyknięcie promptu/treści od jednego nadawcy może spowodować działania wpływające na współdzielony stan, urządzenia lub wyniki;
- jeśli jeden współdzielony agent ma wrażliwe poświadczenia/pliki, każdy dozwolony nadawca może potencjalnie doprowadzić do eksfiltracji przez użycie narzędzi.

Do przepływów zespołowych używaj osobnych agentów/Gateway z minimalnymi narzędziami; agentów z danymi osobistymi trzymaj prywatnie.

### Agent współdzielony przez firmę: akceptowalny wzorzec

Jest to akceptowalne, gdy wszyscy używający tego agenta znajdują się w tej samej granicy zaufania (na przykład jeden zespół firmowy), a agent jest ściśle ograniczony do spraw biznesowych.

- uruchamiaj go na dedykowanej maszynie/VM/kontenerze;
- używaj dedykowanego użytkownika systemu operacyjnego + dedykowanej przeglądarki/profilu/kont dla tego środowiska uruchomieniowego;
- nie loguj tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili menedżera haseł/przeglądarki.

Jeśli mieszasz tożsamości osobiste i firmowe w tym samym środowisku uruchomieniowym, znosisz separację i zwiększasz ryzyko ekspozycji danych osobistych.

## Koncepcja zaufania Gateway i Node

Traktuj Gateway i Node jako jedną domenę zaufania operatora, z różnymi rolami:

- **Gateway** jest płaszczyzną sterowania i powierzchnią zasad (`gateway.auth`, zasady narzędzi, routing).
- **Node** jest powierzchnią zdalnego wykonywania sparowaną z tym Gateway (polecenia, działania urządzeń, możliwości lokalne dla hosta).
- Wywołujący uwierzytelniony w Gateway jest zaufany w zakresie Gateway. Po sparowaniu działania Node są zaufanymi działaniami operatora na tym Node.
- Poziomy zakresu operatora i kontrole w czasie zatwierdzania podsumowano w
  [Zakresy operatora](/pl/gateway/operator-scopes).
- Bezpośredni klienci backendu loopback uwierzytelnieni współdzielonym tokenem/hasłem
  Gateway mogą wykonywać wewnętrzne wywołania RPC płaszczyzny sterowania bez przedstawiania tożsamości
  urządzenia użytkownika. Nie jest to obejście parowania zdalnego ani przeglądarkowego: klienci sieciowi,
  klienci Node, klienci tokenów urządzeń i jawne tożsamości urządzeń
  nadal przechodzą przez egzekwowanie parowania i podnoszenia zakresu.
- `sessionKey` to wybór routingu/kontekstu, nie uwierzytelnianie na użytkownika.
- Zatwierdzenia exec (lista dozwolonych + pytanie) są barierami ochronnymi dla intencji operatora, a nie wrogą izolacją wielodzierżawną.
- Domyślne ustawienie produktu OpenClaw dla zaufanych konfiguracji z jednym operatorem jest takie, że wykonywanie na hoście dla `gateway`/`node` jest dozwolone bez monitów o zatwierdzenie (`security="full"`, `ask="off"`, chyba że je zaostrzysz). To ustawienie domyślne jest celowym UX, a nie samo w sobie podatnością.
- Zatwierdzenia exec wiążą dokładny kontekst żądania i możliwie najlepsze bezpośrednie lokalne operandy plikowe; nie modelują semantycznie każdej ścieżki programu ładującego środowiska uruchomieniowego/interpretera. Do silnych granic używaj sandboxingu i izolacji hosta.

Jeśli potrzebujesz izolacji wrogich użytkowników, rozdziel granice zaufania według użytkownika systemu operacyjnego/hosta i uruchamiaj osobne Gateway.

## Macierz granic zaufania

Używaj tego jako szybkiego modelu podczas triage'u ryzyka:

| Granica lub kontrola                                      | Co oznacza                                        | Częsta błędna interpretacja                                                   |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Uwierzytelnia wywołujących do API Gateway         | „Dla bezpieczeństwa każda ramka potrzebuje podpisów na każdą wiadomość”       |
| `sessionKey`                                              | Klucz routingu do wyboru kontekstu/sesji          | „Klucz sesji jest granicą uwierzytelniania użytkownika”                       |
| Bariery promptu/treści                                    | Zmniejszają ryzyko nadużyć modelu                 | „Samo wstrzyknięcie promptu dowodzi obejścia uwierzytelniania”                |
| `canvas.eval` / browser evaluate                          | Celowa możliwość operatora, gdy jest włączona     | „Każdy prymityw JS eval automatycznie jest podatnością w tym modelu zaufania” |
| Lokalna powłoka TUI `!`                                   | Jawne lokalne wykonanie wyzwalane przez operatora | „Wygodne polecenie lokalnej powłoki to zdalne wstrzyknięcie”                  |
| Parowanie Node i polecenia Node                           | Zdalne wykonywanie na poziomie operatora na sparowanych urządzeniach | „Zdalne sterowanie urządzeniem powinno być domyślnie traktowane jako dostęp niezaufanego użytkownika” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opcjonalna zasada rejestrowania Node w zaufanej sieci | „Domyślnie wyłączona lista dozwolonych to automatyczna podatność parowania”   |

## Nie są podatnościami z założenia

<Accordion title="Typowe zgłoszenia poza zakresem">

Te wzorce są zgłaszane często i zwykle zamykane bez działania, chyba że
zostanie wykazane rzeczywiste obejście granicy:

- Łańcuchy oparte wyłącznie na wstrzyknięciu promptu bez obejścia zasad, uwierzytelniania lub sandboxa.
- Twierdzenia zakładające wrogie działanie wielodzierżawne na jednym współdzielonym hoście lub
  konfiguracji.
- Twierdzenia klasyfikujące normalny dostęp operatora ścieżką odczytu (na przykład
  `sessions.list` / `sessions.preview` / `chat.history`) jako IDOR w
  konfiguracji współdzielonego Gateway.
- Ustalenia dotyczące wdrożeń tylko na localhost (na przykład HSTS na Gateway
  dostępnym tylko przez loopback).
- Ustalenia dotyczące podpisów przychodzących webhooków Discord dla ścieżek przychodzących, które nie
  istnieją w tym repozytorium.
- Raporty traktujące metadane parowania Node jako ukrytą drugą warstwę zatwierdzania
  na polecenie dla `system.run`, gdy rzeczywistą granicą wykonania nadal
  jest globalna zasada poleceń Node w Gateway plus własne zatwierdzenia exec
  danego Node.
- Raporty traktujące skonfigurowane `gateway.nodes.pairing.autoApproveCidrs` jako
  podatność samą w sobie. To ustawienie jest domyślnie wyłączone, wymaga
  jawnych wpisów CIDR/IP, dotyczy tylko pierwszego parowania `role: node` bez
  żądanych zakresów i nie zatwierdza automatycznie operatora/przeglądarki/Control UI,
  WebChat, podniesień roli, podniesień zakresu, zmian metadanych, zmian klucza publicznego
  ani ścieżek nagłówka trusted-proxy loopback tego samego hosta, chyba że uwierzytelnianie trusted-proxy loopback zostało jawnie włączone.
- Ustalenia „brak autoryzacji na użytkownika”, które traktują `sessionKey` jako
  token uwierzytelniający.

</Accordion>

## Utwardzona baza w 60 sekund

Najpierw użyj tej bazy, potem selektywnie ponownie włączaj narzędzia dla zaufanego agenta:

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

## Szybka reguła współdzielonej skrzynki odbiorczej

Jeśli więcej niż jedna osoba może wysłać DM do twojego bota:

- Ustaw `session.dmScope: "per-channel-peer"` (lub `"per-account-channel-peer"` dla kanałów z wieloma kontami).
- Zachowaj `dmPolicy: "pairing"` lub ścisłe listy dozwolonych.
- Nigdy nie łącz współdzielonych DM z szerokim dostępem do narzędzi.
- To utwardza kooperacyjne/współdzielone skrzynki odbiorcze, ale nie jest zaprojektowane jako wroga izolacja współdzierżawców, gdy użytkownicy współdzielą dostęp do zapisu hosta/konfiguracji.

## Model widoczności kontekstu

OpenClaw rozdziela dwa pojęcia:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`dmPolicy`, `groupPolicy`, listy dozwolonych, bramki wzmianki).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do wejścia modelu (treść odpowiedzi, cytowany tekst, historia wątku, przekazane metadane).

Listy dozwolonych bramkują wyzwalacze i autoryzację poleceń. Ustawienie `contextVisibility` kontroluje, jak filtrowany jest dodatkowy kontekst (cytowane odpowiedzi, korzenie wątków, pobrana historia):

- `contextVisibility: "all"` (domyślnie) zachowuje kontekst uzupełniający w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców dopuszczonych przez aktywne sprawdzenia allowlist.
- `contextVisibility: "allowlist_quote"` zachowuje się jak `allowlist`, ale nadal zachowuje jedną jawnie zacytowaną odpowiedź.

Ustaw `contextVisibility` dla kanału albo dla pokoju/konwersacji. Szczegóły konfiguracji znajdziesz w [Czatach grupowych](/pl/channels/groups#context-visibility-and-allowlists).

Wytyczne triage dla advisory:

- Zgłoszenia, które pokazują tylko, że „model może widzieć cytowany lub historyczny tekst od nadawców spoza allowlist”, są ustaleniami dotyczącymi utwardzania możliwymi do obsłużenia przez `contextVisibility`, a nie same w sobie obejściami granic auth lub sandbox.
- Aby mieć wpływ na bezpieczeństwo, raporty nadal muszą wykazać obejście granicy zaufania (auth, zasad, sandbox, zatwierdzenia albo innej udokumentowanej granicy).

## Co sprawdza audit (wysoki poziom)

- **Dostęp przychodzący** (zasady DM, zasady grup, allowlist): czy obce osoby mogą uruchomić bota?
- **Promień rażenia narzędzi** (podwyższone narzędzia + otwarte pokoje): czy prompt injection mogłoby zamienić się w działania powłoki/plików/sieci?
- **Dryf systemu plików exec**: czy narzędzia mutujące system plików są blokowane, podczas gdy `exec`/`process` pozostają dostępne bez ograniczeń systemu plików sandbox?
- **Dryf zatwierdzeń exec** (`security=full`, `autoAllowSkills`, allowlist interpreterów bez `strictInlineEval`): czy zabezpieczenia host-exec nadal robią to, czego oczekujesz?
  - `security="full"` to szerokie ostrzeżenie o postawie, nie dowód błędu. Jest to wybrane ustawienie domyślne dla zaufanych konfiguracji osobistego asystenta; zaostrzaj je tylko wtedy, gdy Twój model zagrożeń wymaga zabezpieczeń zatwierdzania lub allowlist.
- **Ekspozycja sieciowa** (powiązanie/auth Gateway, Tailscale Serve/Funnel, słabe/krótkie tokeny auth).
- **Ekspozycja kontroli przeglądarki** (zdalne węzły, porty relay, zdalne endpointy CDP).
- **Higiena lokalnego dysku** (uprawnienia, symlinki, dołączane konfiguracje, ścieżki „zsynchronizowanych folderów”).
- **Pluginy** (pluginy ładują się bez jawnej allowlist).
- **Dryf zasad/błędna konfiguracja** (ustawienia sandbox docker skonfigurowane, ale tryb sandbox wyłączony; nieskuteczne wzorce `gateway.nodes.denyCommands`, ponieważ dopasowanie odbywa się tylko po dokładnej nazwie polecenia (na przykład `system.run`) i nie sprawdza tekstu powłoki; niebezpieczne wpisy `gateway.nodes.allowCommands`; globalne `tools.profile="minimal"` nadpisane przez profile poszczególnych agentów; narzędzia należące do pluginów osiągalne przy permisywnej polityce narzędzi).
- **Dryf oczekiwań runtime** (na przykład założenie, że niejawny exec nadal oznacza `sandbox`, gdy `tools.exec.host` ma teraz domyślnie `auto`, albo jawne ustawienie `tools.exec.host="sandbox"` przy wyłączonym trybie sandbox).
- **Higiena modeli** (ostrzeżenie, gdy skonfigurowane modele wyglądają na przestarzałe; nie jest to twarda blokada).

Jeśli uruchomisz `--deep`, OpenClaw podejmuje też próbę live sondowania Gateway w trybie best-effort.

## Mapa przechowywania danych uwierzytelniających

Użyj tego podczas audytu dostępu lub decydowania, co tworzyć w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env albo `channels.telegram.tokenFile` (tylko zwykły plik; symlinki odrzucane)
- **Token bota Discord**: config/env albo SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Allowlist parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile auth modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Stan runtime Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Payload sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Legacy import OAuth**: `~/.openclaw/credentials/oauth.json`

## Lista kontrolna audytu bezpieczeństwa

Gdy audit wypisuje ustalenia, traktuj to jako kolejność priorytetów:

1. **Wszystko „otwarte” + włączone narzędzia**: najpierw zablokuj DM/grupy (parowanie/allowlist), potem zaostrz politykę narzędzi/sandboxing.
2. **Publiczna ekspozycja sieciowa** (powiązanie LAN, Funnel, brak auth): napraw natychmiast.
3. **Zdalna ekspozycja kontroli przeglądarki**: traktuj ją jak dostęp operatora (tylko tailnet, paruj węzły świadomie, unikaj publicznej ekspozycji).
4. **Uprawnienia**: upewnij się, że stan/config/dane uwierzytelniające/auth nie są czytelne dla grupy/świata.
5. **Pluginy**: ładuj tylko to, czemu jawnie ufasz.
6. **Wybór modelu**: preferuj nowoczesne modele utwardzone instrukcjami dla każdego bota z narzędziami.

## Glosariusz audytu bezpieczeństwa

Każde ustalenie audytu jest oznaczone strukturalnym `checkId` (na przykład
`gateway.bind_no_auth` albo `tools.exec.security_full_configured`). Typowe
klasy ważności critical:

- `fs.*` - uprawnienia systemu plików dla stanu, config, danych uwierzytelniających, profili auth.
- `gateway.*` - tryb powiązania, auth, Tailscale, Control UI, konfiguracja trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - utwardzanie dla poszczególnych powierzchni.
- `plugins.*`, `skills.*` - łańcuch dostaw pluginów/skillów i ustalenia skanowania.
- `security.exposure.*` - przekrojowe sprawdzenia, w których polityka dostępu styka się z promieniem rażenia narzędzi.

Pełny katalog z poziomami ważności, kluczami napraw i obsługą auto-fix znajdziesz w
[Sprawdzeniach audytu bezpieczeństwa](/pl/gateway/security/audit-checks).

## Control UI przez HTTP

Control UI potrzebuje **bezpiecznego kontekstu** (HTTPS lub localhost), aby wygenerować
tożsamość urządzenia. `gateway.controlUi.allowInsecureAuth` jest lokalnym przełącznikiem zgodności:

- Na localhost pozwala na auth Control UI bez tożsamości urządzenia, gdy strona
  jest ładowana przez niezabezpieczone HTTP.
- Nie omija sprawdzeń parowania.
- Nie rozluźnia wymagań tożsamości urządzenia dla zdalnych (nie-localhost) połączeń.

Preferuj HTTPS (Tailscale Serve) albo otwórz UI na `127.0.0.1`.

Tylko w scenariuszach awaryjnych `gateway.controlUi.dangerouslyDisableDeviceAuth`
całkowicie wyłącza sprawdzenia tożsamości urządzenia. To poważne obniżenie bezpieczeństwa;
pozostaw to wyłączone, chyba że aktywnie debugujesz i możesz szybko cofnąć zmianę.

Niezależnie od tych niebezpiecznych flag, udane `gateway.auth.mode: "trusted-proxy"`
może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia. Jest to
zamierzone zachowanie trybu auth, a nie skrót `allowInsecureAuth`, i nadal
nie obejmuje sesji Control UI z rolą węzła.

`openclaw security audit` ostrzega, gdy to ustawienie jest włączone.

## Podsumowanie flag niebezpiecznych lub niezabezpieczonych

`openclaw security audit` zgłasza `config.insecure_or_dangerous_flags`, gdy
znane niezabezpieczone/niebezpieczne przełączniki debugowania są włączone. W produkcji pozostaw je nieustawione.

<AccordionGroup>
  <Accordion title="Flagi obecnie śledzone przez audit">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Wszystkie klucze `dangerous*` / `dangerously*` w schemacie config">
    Control UI i przeglądarka:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Dopasowywanie nazw kanałów (kanały pakietowe i pluginowe; dostępne także dla poszczególnych
    `accounts.<accountId>`, gdy ma zastosowanie):

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

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (także dla poszczególnych kont)

    Sandbox Docker (domyślne + dla poszczególnych agentów):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Konfiguracja reverse proxy

Jeśli uruchamiasz Gateway za reverse proxy (nginx, Caddy, Traefik itd.), skonfiguruj
`gateway.trustedProxies`, aby poprawnie obsługiwać przekazany adres IP klienta.

Gdy Gateway wykryje nagłówki proxy z adresu, którego **nie ma** w `trustedProxies`, **nie** potraktuje połączeń jako lokalnych klientów. Jeśli auth gateway jest wyłączone, te połączenia zostaną odrzucone. Zapobiega to obejściu uwierzytelniania, w którym połączenia przez proxy w przeciwnym razie wyglądałyby, jakby pochodziły z localhost i otrzymywały automatyczne zaufanie.

`gateway.trustedProxies` zasila także `gateway.auth.mode: "trusted-proxy"`, ale ten tryb auth jest surowszy:

- auth trusted-proxy **domyślnie fail-closed dla proxy ze źródłem loopback**
- reverse proxy loopback na tym samym hoście mogą używać `gateway.trustedProxies` do wykrywania lokalnych klientów i obsługi przekazywanego IP
- reverse proxy loopback na tym samym hoście mogą spełnić `gateway.auth.mode: "trusted-proxy"` tylko wtedy, gdy `gateway.auth.trustedProxy.allowLoopback = true`; w przeciwnym razie użyj auth tokenem/hasłem

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

Gdy `trustedProxies` jest skonfigurowane, Gateway używa `X-Forwarded-For` do określenia IP klienta. `X-Real-IP` jest domyślnie ignorowane, chyba że jawnie ustawiono `gateway.allowRealIpFallback: true`.

Nagłówki zaufanego proxy nie sprawiają, że parowanie urządzeń węzłów automatycznie staje się zaufane.
`gateway.nodes.pairing.autoApproveCidrs` to osobna, domyślnie wyłączona
polityka operatora. Nawet gdy jest włączona, ścieżki nagłówków trusted-proxy
ze źródłem loopback są wykluczone z automatycznego zatwierdzania węzłów, ponieważ lokalni wywołujący mogą fałszować te
nagłówki, także wtedy, gdy auth trusted-proxy loopback jest jawnie włączone.

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

- Gateway OpenClaw jest najpierw lokalny/loopback. Jeśli terminujesz TLS na reverse proxy, ustaw HSTS tam, na domenie HTTPS skierowanej do proxy.
- Jeśli sam gateway terminuje HTTPS, możesz ustawić `gateway.http.securityHeaders.strictTransportSecurity`, aby emitować nagłówek HSTS z odpowiedzi OpenClaw.
- Szczegółowe wskazówki wdrożeniowe są w [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- W przypadku wdrożeń Control UI poza loopback, `gateway.controlUi.allowedOrigins` jest domyślnie wymagane.
- `gateway.controlUi.allowedOrigins: ["*"]` to jawna polityka allow-all dla browser-origin, a nie utwardzone ustawienie domyślne. Unikaj jej poza ściśle kontrolowanymi testami lokalnymi.
- Niepowodzenia auth browser-origin na loopback nadal podlegają rate limitowi, nawet gdy
  ogólne wyłączenie dla loopback jest włączone, ale klucz lockout jest zakresowany dla poszczególnych
  znormalizowanych wartości `Origin`, zamiast jednego współdzielonego kubełka localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallback origin z nagłówka Host; traktuj to jako niebezpieczną politykę wybraną przez operatora.
- Traktuj DNS rebinding i zachowanie nagłówka proxy-host jako kwestie utwardzania wdrożenia; utrzymuj `trustedProxies` wąskie i unikaj bezpośredniego wystawiania gateway do publicznego internetu.

## Lokalne dzienniki sesji znajdują się na dysku

OpenClaw przechowuje transkrypty sesji na dysku w `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Jest to wymagane dla ciągłości sesji i (opcjonalnie) indeksowania pamięci sesji, ale oznacza też, że
**każdy proces/użytkownik z dostępem do systemu plików może odczytać te logi**. Traktuj dostęp do dysku jako granicę zaufania
i ogranicz uprawnienia do `~/.openclaw` (zobacz sekcję audytu poniżej). Jeśli potrzebujesz
silniejszej izolacji między agentami, uruchamiaj ich pod osobnymi użytkownikami systemu operacyjnego lub na osobnych hostach.

## Wykonywanie w Node (system.run)

Jeśli sparowany jest węzeł macOS, Gateway może wywołać `system.run` na tym węźle. To jest **zdalne wykonanie kodu** na Macu:

- Wymaga sparowania węzła (zatwierdzenie + token).
- Parowanie węzła Gateway nie jest powierzchnią zatwierdzania per polecenie. Ustanawia tożsamość/zaufanie węzła i wydawanie tokenów.
- Gateway stosuje zgrubną globalną politykę poleceń węzła za pomocą `gateway.nodes.allowCommands` / `denyCommands`.
- Kontrolowane na Macu przez **Settings → Exec approvals** (bezpieczeństwo + pytanie + lista dozwolonych).
- Polityka `system.run` per węzeł jest własnym plikiem zatwierdzeń wykonywania węzła (`exec.approvals.node.*`), który może być bardziej restrykcyjny lub luźniejszy niż globalna polityka identyfikatorów poleceń Gateway.
- Węzeł działający z `security="full"` i `ask="off"` postępuje zgodnie z domyślnym modelem zaufanego operatora. Traktuj to jako oczekiwane zachowanie, chyba że Twoje wdrożenie wyraźnie wymaga ściślejszej postawy zatwierdzania lub listy dozwolonych.
- Tryb zatwierdzania wiąże dokładny kontekst żądania oraz, gdy to możliwe, jeden konkretny lokalny operand skryptu/pliku. Jeśli OpenClaw nie może zidentyfikować dokładnie jednego bezpośredniego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego, wykonanie oparte na zatwierdzeniu jest odrzucane zamiast obiecywać pełne pokrycie semantyczne.
- Dla `host=node` uruchomienia oparte na zatwierdzeniu przechowują także kanoniczny przygotowany
  `systemRunPlan`; późniejsze zatwierdzone przekazania ponownie używają tego zapisanego planu, a walidacja Gateway
  odrzuca edycje polecenia/cwd/kontekstu sesji dokonane przez wywołującego po utworzeniu
  żądania zatwierdzenia.
- Jeśli nie chcesz zdalnego wykonywania, ustaw bezpieczeństwo na **deny** i usuń parowanie węzła dla tego Maca.

To rozróżnienie ma znaczenie przy triage:

- Ponownie łączący się sparowany węzeł reklamujący inną listę poleceń sam w sobie nie jest podatnością, jeśli globalna polityka Gateway i lokalne zatwierdzenia wykonywania węzła nadal wymuszają faktyczną granicę wykonywania.
- Zgłoszenia, które traktują metadane parowania węzła jako drugą ukrytą warstwę zatwierdzania per polecenie, są zwykle nieporozumieniem dotyczącym polityki/UX, a nie obejściem granicy bezpieczeństwa.

## Dynamiczne Skills (obserwator / zdalne węzły)

OpenClaw może odświeżyć listę Skills w trakcie sesji:

- **Obserwator Skills**: zmiany w `SKILL.md` mogą zaktualizować migawkę Skills przy następnej turze agenta.
- **Zdalne węzły**: podłączenie węzła macOS może udostępnić Skills tylko dla macOS (na podstawie sondowania binariów).

Traktuj foldery Skills jako **zaufany kod** i ogranicz, kto może je modyfikować.

## Model zagrożeń

Twój asystent AI może:

- Wykonywać dowolne polecenia powłoki
- Odczytywać/zapisywać pliki
- Uzyskiwać dostęp do usług sieciowych
- Wysyłać wiadomości do dowolnych osób (jeśli dasz mu dostęp do WhatsApp)

Osoby, które do Ciebie piszą, mogą:

- Próbować nakłonić Twoją AI do robienia złych rzeczy
- Socjotechnicznie zdobywać dostęp do Twoich danych
- Sondować szczegóły infrastruktury

## Kluczowa koncepcja: kontrola dostępu przed inteligencją

Większość awarii tutaj to nie wymyślne exploity - to sytuacje typu „ktoś napisał do bota, a bot zrobił to, o co poproszono”.

Stanowisko OpenClaw:

- **Najpierw tożsamość:** zdecyduj, kto może rozmawiać z botem (parowanie DM / listy dozwolonych / jawne „otwarcie”).
- **Potem zakres:** zdecyduj, gdzie bot może działać (listy dozwolonych grup + bramkowanie wzmianką, narzędzia, sandboxing, uprawnienia urządzeń).
- **Model na końcu:** zakładaj, że modelem można manipulować; projektuj tak, aby manipulacja miała ograniczony promień rażenia.

## Model autoryzacji poleceń

Polecenia ukośnikowe i dyrektywy są honorowane tylko dla **autoryzowanych nadawców**. Autoryzacja wynika z
list dozwolonych/parowania kanałów oraz `commands.useAccessGroups` (zobacz [Konfiguracja](/pl/gateway/configuration)
i [Polecenia ukośnikowe](/pl/tools/slash-commands)). Jeśli lista dozwolonych kanału jest pusta lub zawiera `"*"`,
polecenia są faktycznie otwarte dla tego kanału.

`/exec` jest wygodą tylko dla sesji dla autoryzowanych operatorów. **Nie** zapisuje konfiguracji ani
nie zmienia innych sesji.

## Ryzyko narzędzi płaszczyzny sterowania

Dwa wbudowane narzędzia mogą wprowadzać trwałe zmiany w płaszczyźnie sterowania:

- `gateway` może sprawdzać konfigurację za pomocą `config.schema.lookup` / `config.get` oraz wprowadzać trwałe zmiany za pomocą `config.apply`, `config.patch` i `update.run`.
- `cron` może tworzyć zaplanowane zadania, które działają nadal po zakończeniu pierwotnego czatu/zadania.

Narzędzie uruchomieniowe `gateway` tylko dla właściciela nadal odmawia przepisywania
`tools.exec.ask` lub `tools.exec.security`; starsze aliasy `tools.bash.*` są
normalizowane do tych samych chronionych ścieżek wykonywania przed zapisem.
Edycje `gateway config.apply` i `gateway config.patch` sterowane przez agenta są
domyślnie zamknięte na niepowodzenie: tylko wąski zestaw ścieżek promptu, modelu i bramkowania wzmianką
może być dostrajany przez agenta. Nowe wrażliwe drzewa konfiguracji są więc chronione,
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

## Pluginy

Pluginy działają **w procesie** z Gateway. Traktuj je jako zaufany kod:

- Instaluj Pluginy tylko ze źródeł, którym ufasz.
- Preferuj jawne listy dozwolonych `plugins.allow`.
- Przejrzyj konfigurację Pluginu przed włączeniem.
- Zrestartuj Gateway po zmianach Pluginów.
- Jeśli instalujesz lub aktualizujesz Pluginy (`openclaw plugins install <package>`, `openclaw plugins update <id>`), traktuj to jak uruchamianie niezaufanego kodu:
  - Ścieżka instalacji to katalog per Plugin pod aktywnym katalogiem głównym instalacji Pluginów.
  - OpenClaw uruchamia wbudowane skanowanie niebezpiecznego kodu przed instalacją/aktualizacją. Wyniki `critical` domyślnie blokują.
  - Instalacje Pluginów z npm i git uruchamiają uzgadnianie zależności menedżera pakietów tylko podczas jawnego przepływu instalacji/aktualizacji. Ścieżki lokalne i archiwa są traktowane jako samowystarczalne pakiety Pluginów; OpenClaw kopiuje/odwołuje się do nich bez uruchamiania `npm install`.
  - Preferuj przypięte, dokładne wersje (`@scope/pkg@1.2.3`) i sprawdź rozpakowany kod na dysku przed włączeniem.
  - `--dangerously-force-unsafe-install` jest tylko trybem awaryjnym dla fałszywych alarmów wbudowanego skanowania w przepływach instalacji/aktualizacji Pluginów. Nie omija blokad polityki hooka `before_install` Pluginu i nie omija niepowodzeń skanowania.
  - Instalacje zależności Skills wspierane przez Gateway stosują ten sam podział na niebezpieczne/podejrzane: wbudowane wyniki `critical` blokują, chyba że wywołujący jawnie ustawi `dangerouslyForceUnsafeInstall`, podczas gdy podejrzane wyniki nadal tylko ostrzegają. `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Model dostępu DM: parowanie, lista dozwolonych, otwarte, wyłączone

Wszystkie obecne kanały obsługujące DM wspierają politykę DM (`dmPolicy` lub `*.dm.policy`), która bramkuje przychodzące DM **przed** przetworzeniem wiadomości:

- `pairing` (domyślnie): nieznani nadawcy otrzymują krótki kod parowania, a bot ignoruje ich wiadomość do czasu zatwierdzenia. Kody wygasają po 1 godzinie; powtarzane DM nie wyślą ponownie kodu, dopóki nie zostanie utworzone nowe żądanie. Oczekujące żądania są domyślnie ograniczone do **3 na kanał**.
- `allowlist`: nieznani nadawcy są blokowani (bez uzgadniania parowania).
- `open`: pozwól każdemu wysyłać DM (publiczne). **Wymaga**, aby lista dozwolonych kanału zawierała `"*"` (jawna zgoda).
- `disabled`: całkowicie ignoruj przychodzące DM.

Zatwierdź przez CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Szczegóły + pliki na dysku: [Parowanie](/pl/channels/pairing)

## Izolacja sesji DM (tryb wielu użytkowników)

Domyślnie OpenClaw kieruje **wszystkie DM do sesji głównej**, aby asystent zachowywał ciągłość między urządzeniami i kanałami. Jeśli **wiele osób** może pisać DM do bota (otwarte DM lub wieloosobowa lista dozwolonych), rozważ izolowanie sesji DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Zapobiega to wyciekowi kontekstu między użytkownikami, zachowując izolację czatów grupowych.

To granica kontekstu wiadomości, a nie granica administratora hosta. Jeśli użytkownicy są wobec siebie wzajemnie wrogo nastawieni i współdzielą ten sam host/konfigurację Gateway, zamiast tego uruchom osobne Gateway dla każdej granicy zaufania.

### Bezpieczny tryb DM (zalecany)

Traktuj powyższy fragment jako **bezpieczny tryb DM**:

- Domyślnie: `session.dmScope: "main"` (wszystkie DM współdzielą jedną sesję dla ciągłości).
- Domyślne lokalne wdrażanie przez CLI: zapisuje `session.dmScope: "per-channel-peer"`, gdy nie jest ustawione (zachowuje istniejące jawne wartości).
- Bezpieczny tryb DM: `session.dmScope: "per-channel-peer"` (każda para kanał+nadawca otrzymuje izolowany kontekst DM).
- Izolacja peera między kanałami: `session.dmScope: "per-peer"` (każdy nadawca otrzymuje jedną sesję we wszystkich kanałach tego samego typu).

Jeśli uruchamiasz wiele kont w tym samym kanale, użyj zamiast tego `per-account-channel-peer`. Jeśli ta sama osoba kontaktuje się z Tobą na wielu kanałach, użyj `session.identityLinks`, aby zwinąć te sesje DM do jednej kanonicznej tożsamości. Zobacz [Zarządzanie sesją](/pl/concepts/session) i [Konfiguracja](/pl/gateway/configuration).

## Listy dozwolonych dla DM i grup

OpenClaw ma dwie osobne warstwy „kto może mnie wywołać?”:

- **Lista dozwolonych DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; starsze: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): kto może rozmawiać z botem w wiadomościach bezpośrednich.
  - Gdy `dmPolicy="pairing"`, zatwierdzenia są zapisywane w magazynie listy dozwolonych parowania o zakresie konta w `~/.openclaw/credentials/` (`<channel>-allowFrom.json` dla konta domyślnego, `<channel>-<accountId>-allowFrom.json` dla kont innych niż domyślne), scalanym z listami dozwolonych z konfiguracji.
- **Lista dozwolonych grup** (specyficzna dla kanału): z których grup/kanałów/gildii bot w ogóle zaakceptuje wiadomości.
  - Typowe wzorce:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: domyślne ustawienia per grupa, takie jak `requireMention`; gdy ustawione, działają też jako lista dozwolonych grup (dołącz `"*"`, aby zachować zachowanie zezwalające wszystkim).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: ogranicz, kto może wywołać bota _wewnątrz_ sesji grupowej (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: listy dozwolonych per powierzchnia + domyślne wzmianki.
  - Sprawdzenia grup działają w tej kolejności: najpierw `groupPolicy`/listy dozwolonych grup, potem aktywacja wzmianką/odpowiedzią.
  - Odpowiadanie na wiadomość bota (niejawna wzmianka) **nie** omija list dozwolonych nadawców, takich jak `groupAllowFrom`.
  - **Uwaga dotycząca bezpieczeństwa:** traktuj `dmPolicy="open"` i `groupPolicy="open"` jako ustawienia ostatniej szansy. Powinny być używane bardzo rzadko; preferuj parowanie + listy dozwolonych, chyba że w pełni ufasz każdemu członkowi pokoju.

Szczegóły: [Konfiguracja](/pl/gateway/configuration) i [Grupy](/pl/channels/groups)

## Wstrzyknięcie promptu (czym jest, dlaczego ma znaczenie)

Wstrzyknięcie promptu ma miejsce, gdy atakujący tworzy wiadomość, która manipuluje modelem, aby zrobił coś niebezpiecznego („zignoruj swoje instrukcje”, „zrzuć swój system plików”, „kliknij ten link i uruchom polecenia” itd.).

Nawet przy silnych promptach systemowych **wstrzyknięcie promptu nie jest rozwiązane**. Bariery promptu systemowego są tylko miękkimi wskazówkami; twarde wymuszanie wynika z polityki narzędzi, zatwierdzeń wykonywania, sandboxingu i list dozwolonych kanałów (a operatorzy mogą je z założenia wyłączyć). Co pomaga w praktyce:

- Zablokuj przychodzące wiadomości prywatne (parowanie/listy dozwolonych).
- W grupach preferuj bramkowanie przez wzmianki; unikaj botów „zawsze włączonych” w pokojach publicznych.
- Domyślnie traktuj linki, załączniki i wklejone instrukcje jako wrogie.
- Uruchamiaj wykonywanie wrażliwych narzędzi w piaskownicy; trzymaj sekrety poza systemem plików osiągalnym dla agenta.
- Uwaga: piaskownica jest opcjonalna. Jeśli tryb piaskownicy jest wyłączony, niejawne `host=auto` rozwiązuje się do hosta Gateway. Jawne `host=sandbox` nadal kończy się bezpiecznym niepowodzeniem, ponieważ środowisko uruchomieniowe piaskownicy nie jest dostępne. Ustaw `host=gateway`, jeśli chcesz, aby to zachowanie było jawne w konfiguracji.
- Ogranicz narzędzia wysokiego ryzyka (`exec`, `browser`, `web_fetch`, `web_search`) do zaufanych agentów lub jawnych list dozwolonych.
- Jeśli dodajesz interpretery (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) do listy dozwolonych, włącz `tools.exec.strictInlineEval`, aby formy ewaluacji inline nadal wymagały jawnej zgody.
- Analiza zatwierdzania powłoki odrzuca też formy podstawiania parametrów POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) wewnątrz **niecytowanych heredoc**, więc ciało heredoc z listy dozwolonych nie może przemycić rozwinięcia powłoki przez przegląd listy dozwolonych jako zwykłego tekstu. Zacytuj terminator heredoc (na przykład `<<'EOF'`), aby przejść na semantykę dosłownego ciała; niecytowane heredoc, które rozwijałyby zmienne, są odrzucane.
- **Wybór modelu ma znaczenie:** starsze/mniejsze/przestarzałe modele są znacznie mniej odporne na prompt injection i nadużycia narzędzi. Dla agentów z włączonymi narzędziami używaj najsilniejszego dostępnego modelu najnowszej generacji, wzmocnionego pod kątem instrukcji.

Sygnały ostrzegawcze, które należy traktować jako niezaufane:

- „Przeczytaj ten plik/URL i zrób dokładnie to, co mówi.”
- „Zignoruj swój prompt systemowy lub reguły bezpieczeństwa.”
- „Ujawnij swoje ukryte instrukcje lub wyjścia narzędzi.”
- „Wklej pełną zawartość ~/.openclaw albo swoje logi.”

## Sanityzacja tokenów specjalnych w treści zewnętrznej

OpenClaw usuwa typowe literały tokenów specjalnych szablonów czatu samodzielnie hostowanych LLM z opakowanej treści zewnętrznej i metadanych, zanim dotrą do modelu. Objęte rodziny znaczników obejmują tokeny ról/tur Qwen/ChatML, Llama, Gemma, Mistral, Phi i GPT-OSS.

Dlaczego:

- Backend zgodny z OpenAI, który obsługuje samodzielnie hostowane modele, czasem zachowuje tokeny specjalne pojawiające się w tekście użytkownika zamiast je maskować. Atakujący, który może pisać do przychodzącej treści zewnętrznej (pobrana strona, treść e-maila, wyjście narzędzia z zawartością pliku), mógłby w przeciwnym razie wstrzyknąć syntetyczną granicę roli `assistant` lub `system` i uciec poza zabezpieczenia opakowanej treści.
- Sanityzacja odbywa się w warstwie opakowywania treści zewnętrznej, więc działa jednolicie dla narzędzi pobierania/odczytu i przychodzącej treści kanałów, zamiast być zależna od dostawcy.
- Wychodzące odpowiedzi modelu mają już oddzielny sanitizer, który usuwa wyciekłe `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` i podobne wewnętrzne rusztowanie środowiska uruchomieniowego z odpowiedzi widocznych dla użytkownika na końcowej granicy dostarczenia do kanału. Sanitizer treści zewnętrznej jest jego przychodzącym odpowiednikiem.

Nie zastępuje to innych mechanizmów wzmacniających na tej stronie - `dmPolicy`, listy dozwolonych, zatwierdzanie exec, piaskownica i `contextVisibility` nadal wykonują główną pracę. Zamyka to jedno konkretne obejście w warstwie tokenizera przeciwko samodzielnie hostowanym stosom, które przekazują tekst użytkownika z nienaruszonymi tokenami specjalnymi.

## Flagi obejścia niebezpiecznej treści zewnętrznej

OpenClaw zawiera jawne flagi obejścia, które wyłączają bezpieczne opakowywanie treści zewnętrznej:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Pole payload Cron `allowUnsafeExternalContent`

Wytyczne:

- W produkcji pozostaw je nieustawione/fałszywe.
- Włączaj tylko tymczasowo na potrzeby ściśle ograniczonego debugowania.
- Jeśli są włączone, odizoluj tego agenta (piaskownica + minimalne narzędzia + dedykowana przestrzeń nazw sesji).

Uwaga o ryzyku hooków:

- Payloady hooków są treścią niezaufaną, nawet gdy dostarczenie pochodzi z systemów, które kontrolujesz (treści poczty/dokumentów/web mogą przenosić prompt injection).
- Słabsze poziomy modeli zwiększają to ryzyko. Dla automatyzacji opartej na hookach preferuj silne nowoczesne poziomy modeli i utrzymuj ścisłą politykę narzędzi (`tools.profile: "messaging"` lub bardziej restrykcyjną), a także piaskownicę tam, gdzie to możliwe.

### Prompt injection nie wymaga publicznych wiadomości prywatnych

Nawet jeśli **tylko Ty** możesz wysyłać wiadomości do bota, prompt injection nadal może wystąpić przez
dowolną **niezaufaną treść**, którą bot czyta (wyniki wyszukiwania/pobierania z sieci, strony przeglądarki,
e-maile, dokumenty, załączniki, wklejone logi/kod). Innymi słowy: nadawca nie jest
jedyną powierzchnią zagrożenia; **sama treść** może przenosić wrogie instrukcje.

Gdy narzędzia są włączone, typowe ryzyko polega na eksfiltracji kontekstu lub wywołaniu
wywołań narzędzi. Ogranicz promień rażenia przez:

- Używanie tylko do odczytu lub pozbawionego narzędzi **agenta czytającego** do streszczania niezaufanej treści,
  a następnie przekazywanie streszczenia głównemu agentowi.
- Wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami, chyba że są potrzebne.
- Dla wejść URL OpenResponses (`input_file` / `input_image`) ustaw ścisłe
  `gateway.http.endpoints.responses.files.urlAllowlist` i
  `gateway.http.endpoints.responses.images.urlAllowlist`, a `maxUrlParts` utrzymuj na niskim poziomie.
  Puste listy dozwolonych są traktowane jako nieustawione; użyj `files.allowUrl: false` / `images.allowUrl: false`,
  jeśli chcesz całkowicie wyłączyć pobieranie URL.
- Dla wejść plikowych OpenResponses zdekodowany tekst `input_file` nadal jest wstrzykiwany jako
  **niezaufana treść zewnętrzna**. Nie zakładaj, że tekst pliku jest zaufany tylko dlatego,
  że Gateway zdekodował go lokalnie. Wstrzyknięty blok nadal niesie jawne znaczniki graniczne
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` oraz metadane `Source: External`,
  mimo że ta ścieżka pomija dłuższy baner `SECURITY NOTICE:`.
- To samo opakowywanie oparte na znacznikach jest stosowane, gdy rozumienie multimediów wyodrębnia tekst
  z dołączonych dokumentów przed dodaniem tego tekstu do promptu multimedialnego.
- Włączenie piaskownicy i ścisłych list dozwolonych narzędzi dla każdego agenta, który dotyka niezaufanego wejścia.
- Trzymanie sekretów poza promptami; zamiast tego przekazuj je przez env/konfigurację na hoście Gateway.

### Samodzielnie hostowane backendy LLM

Backendy samodzielnie hostowane zgodne z OpenAI, takie jak vLLM, SGLang, TGI, LM Studio
lub niestandardowe stosy tokenizerów Hugging Face, mogą różnić się od dostawców hostowanych sposobem
obsługi tokenów specjalnych szablonów czatu. Jeśli backend tokenizuje dosłowne ciągi
takie jak `<|im_start|>`, `<|start_header_id|>` lub `<start_of_turn>` jako
strukturalne tokeny szablonu czatu wewnątrz treści użytkownika, niezaufany tekst może próbować
fałszować granice ról w warstwie tokenizera.

OpenClaw usuwa typowe literały tokenów specjalnych rodzin modeli z opakowanej
treści zewnętrznej przed wysłaniem jej do modelu. Utrzymuj opakowywanie treści zewnętrznej
włączone i preferuj ustawienia backendu, które rozdzielają lub uciekają tokeny specjalne
w treści dostarczonej przez użytkownika, gdy są dostępne. Dostawcy hostowani, tacy jak OpenAI
i Anthropic, już stosują własną sanityzację po stronie żądania.

### Siła modelu (uwaga dotycząca bezpieczeństwa)

Odporność na prompt injection **nie** jest jednolita między poziomami modeli. Mniejsze/tańsze modele są zwykle bardziej podatne na nadużycia narzędzi i przejęcie instrukcji, zwłaszcza przy wrogich promptach.

<Warning>
Dla agentów z włączonymi narzędziami lub agentów czytających niezaufaną treść ryzyko prompt injection przy starszych/mniejszych modelach jest często zbyt wysokie. Nie uruchamiaj tych zadań na słabych poziomach modeli.
</Warning>

Zalecenia:

- **Używaj modelu najnowszej generacji i najlepszego poziomu** dla każdego bota, który może uruchamiać narzędzia albo dotykać plików/sieci.
- **Nie używaj starszych/słabszych/mniejszych poziomów** dla agentów z włączonymi narzędziami ani niezaufanych skrzynek odbiorczych; ryzyko prompt injection jest zbyt wysokie.
- Jeśli musisz użyć mniejszego modelu, **ogranicz promień rażenia** (narzędzia tylko do odczytu, silna piaskownica, minimalny dostęp do systemu plików, ścisłe listy dozwolonych).
- Podczas uruchamiania małych modeli **włącz piaskownicę dla wszystkich sesji** i **wyłącz web_search/web_fetch/browser**, chyba że wejścia są ściśle kontrolowane.
- Dla osobistych asystentów tylko do czatu z zaufanym wejściem i bez narzędzi mniejsze modele są zwykle wystarczające.

## Rozumowanie i szczegółowe wyjście w grupach

`/reasoning`, `/verbose` i `/trace` mogą ujawniać wewnętrzne rozumowanie, wyjście narzędzi
lub diagnostykę Plugin, która
nie była przeznaczona dla kanału publicznego. W ustawieniach grupowych traktuj je jako **tylko do debugowania**
i utrzymuj wyłączone, chyba że jawnie ich potrzebujesz.

Wytyczne:

- Utrzymuj `/reasoning`, `/verbose` i `/trace` wyłączone w pokojach publicznych.
- Jeśli je włączasz, rób to tylko w zaufanych wiadomościach prywatnych lub ściśle kontrolowanych pokojach.
- Pamiętaj: szczegółowe wyjście i ślad mogą zawierać argumenty narzędzi, URL-e, diagnostykę Plugin i dane, które widział model.

## Przykłady wzmacniania konfiguracji

### Uprawnienia plików

Utrzymuj konfigurację i stan jako prywatne na hoście Gateway:

- `~/.openclaw/openclaw.json`: `600` (tylko odczyt/zapis użytkownika)
- `~/.openclaw`: `700` (tylko użytkownik)

`openclaw doctor` może ostrzec i zaproponować zaostrzenie tych uprawnień.

### Ekspozycja sieciowa (wiązanie, port, zapora)

Gateway multipleksuje **WebSocket + HTTP** na jednym porcie:

- Domyślnie: `18789`
- Konfiguracja/flagi/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ta powierzchnia HTTP obejmuje Control UI i host kanwy:

- Control UI (zasoby SPA) (domyślna ścieżka bazowa `/`)
- Host kanwy: `/__openclaw__/canvas/` i `/__openclaw__/a2ui/` (dowolny HTML/JS; traktuj jako niezaufaną treść)

Jeśli ładujesz treść kanwy w zwykłej przeglądarce, traktuj ją jak każdą inną niezaufaną stronę internetową:

- Nie wystawiaj hosta kanwy na niezaufane sieci/użytkowników.
- Nie sprawiaj, aby treść kanwy współdzieliła to samo źródło z uprzywilejowanymi powierzchniami web, chyba że w pełni rozumiesz konsekwencje.

Tryb wiązania kontroluje, gdzie Gateway nasłuchuje:

- `gateway.bind: "loopback"` (domyślnie): mogą łączyć się tylko klienci lokalni.
- Wiązania inne niż loopback (`"lan"`, `"tailnet"`, `"custom"`) rozszerzają powierzchnię ataku. Używaj ich tylko z uwierzytelnianiem Gateway (wspólny token/hasło albo poprawnie skonfigurowany zaufany proxy) i realną zaporą.

Reguły praktyczne:

- Preferuj Tailscale Serve zamiast wiązań LAN (Serve utrzymuje Gateway na loopback, a Tailscale obsługuje dostęp).
- Jeśli musisz wiązać do LAN, ogranicz port zaporą do ścisłej listy dozwolonych źródłowych adresów IP; nie przekierowuj go szeroko.
- Nigdy nie wystawiaj nieuwierzytelnionego Gateway na `0.0.0.0`.

### Publikowanie portów Docker z UFW

Jeśli uruchamiasz OpenClaw z Docker na VPS, pamiętaj, że opublikowane porty kontenerów
(`-p HOST:CONTAINER` lub Compose `ports:`) są trasowane przez łańcuchy przekazywania Docker,
a nie tylko reguły hosta `INPUT`.

Aby ruch Docker był zgodny z polityką zapory, egzekwuj reguły w
`DOCKER-USER` (ten łańcuch jest oceniany przed własnymi regułami akceptacji Docker).
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

IPv6 ma oddzielne tabele. Dodaj odpowiadającą politykę w `/etc/ufw/after6.rules`, jeśli
Docker IPv6 jest włączony.

Unikaj twardego kodowania nazw interfejsów takich jak `eth0` we fragmentach dokumentacji. Nazwy interfejsów
różnią się między obrazami VPS (`ens3`, `enp*` itd.), a niedopasowania mogą przypadkowo
pominąć regułę odmowy.

Szybka walidacja po przeładowaniu:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Oczekiwane porty zewnętrzne powinny obejmować tylko to, co celowo wystawiasz (w większości
konfiguracji: SSH + porty reverse proxy).

### Wykrywanie mDNS/Bonjour

Gdy dołączony Plugin `bonjour` jest włączony, Gateway rozgłasza swoją obecność przez mDNS (`_openclaw-gw._tcp` na porcie 5353) na potrzeby wykrywania urządzeń lokalnych. W trybie pełnym obejmuje to rekordy TXT, które mogą ujawniać szczegóły operacyjne:

- `cliPath`: pełna ścieżka systemu plików do pliku binarnego CLI (ujawnia nazwę użytkownika i lokalizację instalacji)
- `sshPort`: ogłasza dostępność SSH na hoście
- `displayName`, `lanHost`: informacje o nazwie hosta

**Kwestia bezpieczeństwa operacyjnego:** Rozgłaszanie szczegółów infrastruktury ułatwia rozpoznanie każdemu w sieci lokalnej. Nawet „nieszkodliwe” informacje, takie jak ścieżki systemu plików i dostępność SSH, pomagają atakującym mapować środowisko.

**Zalecenia:**

1. **Pozostaw Bonjour wyłączone, chyba że potrzebne jest wykrywanie w LAN.** Bonjour uruchamia się automatycznie na hostach macOS, a gdzie indziej wymaga włączenia; bezpośrednie URL-e Gateway, Tailnet, SSH lub szerokoobszarowe DNS-SD unikają lokalnego multicastu.

2. **Tryb minimalny** (domyślny, gdy Bonjour jest włączone, zalecany dla wystawionych bram Gateway): pomija pola wrażliwe w rozgłoszeniach mDNS:

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

4. **Tryb pełny** (włączany jawnie): obejmuje `cliPath` + `sshPort` w rekordach TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Zmienna środowiskowa** (alternatywa): ustaw `OPENCLAW_DISABLE_BONJOUR=1`, aby wyłączyć mDNS bez zmian konfiguracji.

Gdy Bonjour jest włączone w trybie minimalnym, Gateway rozgłasza wystarczająco dużo danych do wykrywania urządzeń (`role`, `gatewayPort`, `transport`), ale pomija `cliPath` i `sshPort`. Aplikacje, które potrzebują informacji o ścieżce CLI, mogą zamiast tego pobrać ją przez uwierzytelnione połączenie WebSocket.

### Zabezpiecz WebSocket Gateway (lokalne uwierzytelnianie)

Uwierzytelnianie Gateway jest **domyślnie wymagane**. Jeśli nie skonfigurowano prawidłowej ścieżki uwierzytelniania gateway,
Gateway odmawia połączeń WebSocket (zamyka się bezpiecznie przy błędzie).

Onboarding domyślnie generuje token (nawet dla loopback), więc
lokalni klienci muszą się uwierzytelnić.

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
`gateway.remote.token` i `gateway.remote.password` są źródłami poświadczeń klienta. Same w sobie **nie** chronią lokalnego dostępu WS. Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako wartości awaryjnej tylko wtedy, gdy `gateway.auth.*` nie jest ustawione. Jeśli `gateway.auth.token` albo `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się bezpiecznym zamknięciem dostępu (bez maskowania przez zdalną wartość awaryjną).
</Note>
Opcjonalnie: przypnij zdalne TLS za pomocą `gateway.remote.tlsFingerprint`, gdy używasz `wss://`.
Jawny tekst `ws://` jest domyślnie ograniczony tylko do loopback. Dla zaufanych ścieżek w sieci prywatnej
ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
awaryjne obejście. To celowo jest tylko środowisko procesu, a nie
klucz konfiguracji `openclaw.json`.
Parowanie mobilne oraz ręczne lub skanowane trasy gateway w Androidzie są bardziej rygorystyczne:
tekst jawny jest akceptowany dla loopback, ale prywatny LAN, link-local, `.local` i
nazwy hostów bez kropki muszą używać TLS, chyba że jawnie włączysz zaufaną
ścieżkę tekstu jawnego w sieci prywatnej.

Parowanie urządzeń lokalnych:

- Parowanie urządzeń jest automatycznie zatwierdzane dla bezpośrednich połączeń local loopback, aby klienci na tym samym hoście działali płynnie.
- OpenClaw ma też wąską ścieżkę samopołączenia lokalnego dla backendu/kontenera, przeznaczoną dla zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia Tailnet i LAN, w tym wiązania tailnet na tym samym hoście, są traktowane jako zdalne przy parowaniu i nadal wymagają zatwierdzenia.
- Dowód z nagłówków przekazanych dalej w żądaniu loopback dyskwalifikuje lokalność loopback. Automatyczne zatwierdzanie aktualizacji metadanych ma wąski zakres. Zobacz [parowanie Gateway](/pl/gateway/pairing), aby poznać obie reguły.

Tryby uwierzytelniania:

- `gateway.auth.mode: "token"`: współdzielony token bearer (zalecany dla większości konfiguracji).
- `gateway.auth.mode: "password"`: uwierzytelnianie hasłem (preferuj ustawienie przez env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: ufa odwrotnemu proxy świadomemu tożsamości, które uwierzytelnia użytkowników i przekazuje tożsamość przez nagłówki (zobacz [uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)).

Lista kontrolna rotacji (token/hasło):

1. Wygeneruj/ustaw nowy sekret (`gateway.auth.token` albo `OPENCLAW_GATEWAY_PASSWORD`).
2. Uruchom ponownie Gateway (albo uruchom ponownie aplikację macOS, jeśli nadzoruje Gateway).
3. Zaktualizuj wszystkich zdalnych klientów (`gateway.remote.token` / `.password` na maszynach, które wywołują Gateway).
4. Zweryfikuj, że nie możesz już połączyć się przy użyciu starych poświadczeń.

### Nagłówki tożsamości Tailscale Serve

Gdy `gateway.auth.allowTailscale` ma wartość `true` (domyślnie dla Serve), OpenClaw
akceptuje nagłówki tożsamości Tailscale Serve (`tailscale-user-login`) dla uwierzytelniania Control
UI/WebSocket. OpenClaw weryfikuje tożsamość przez rozwiązywanie adresu
`x-forwarded-for` za pomocą lokalnego demona Tailscale (`tailscale whois`)
i dopasowanie go do nagłówka. To uruchamia się tylko dla żądań, które trafiają do loopback
i zawierają `x-forwarded-for`, `x-forwarded-proto` oraz `x-forwarded-host`,
wstrzyknięte przez Tailscale.
Dla tej asynchronicznej ścieżki sprawdzania tożsamości nieudane próby dla tego samego `{scope, ip}`
są serializowane, zanim limiter zapisze niepowodzenie. Równoległe błędne ponowienia
od jednego klienta Serve mogą więc natychmiast zablokować drugą próbę
zamiast przejść równolegle jako dwa zwykłe niedopasowania.
Punkty końcowe HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania nagłówkami tożsamości Tailscale. Nadal stosują
skonfigurowany tryb uwierzytelniania HTTP gateway.

Ważna uwaga o granicy:

- Uwierzytelnianie HTTP bearer Gateway oznacza w praktyce dostęp operatora typu wszystko albo nic.
- Traktuj poświadczenia, które mogą wywoływać `/v1/chat/completions`, `/v1/responses` albo `/api/channels/*`, jako sekrety operatora z pełnym dostępem do tej bramy gateway.
- Na powierzchni HTTP zgodnej z OpenAI uwierzytelnianie bearer współdzielonym sekretem przywraca pełny domyślny zestaw zakresów operatora (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) oraz semantykę właściciela dla tur agenta; węższe wartości `x-openclaw-scopes` nie ograniczają tej ścieżki współdzielonego sekretu.
- Semantyka zakresu per żądanie w HTTP ma zastosowanie tylko wtedy, gdy żądanie pochodzi z trybu przenoszącego tożsamość, takiego jak uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym wejściu.
- W tych trybach przenoszących tożsamość pominięcie `x-openclaw-scopes` wraca do normalnego domyślnego zestawu zakresów operatora; wyślij nagłówek jawnie, gdy chcesz węższy zestaw zakresów.
- `/tools/invoke` stosuje tę samą regułę współdzielonego sekretu: uwierzytelnianie bearer tokenem/hasłem też jest tam traktowane jako pełny dostęp operatora, natomiast tryby przenoszące tożsamość nadal respektują zadeklarowane zakresy.
- Nie udostępniaj tych poświadczeń niezaufanym wywołującym; preferuj osobne bramy gateway dla każdej granicy zaufania.

**Założenie zaufania:** uwierzytelnianie Serve bez tokenu zakłada, że host gateway jest zaufany.
Nie traktuj tego jako ochrony przed wrogimi procesami na tym samym hoście. Jeśli niezaufany
kod lokalny może działać na hoście gateway, wyłącz `gateway.auth.allowTailscale`
i wymagaj jawnego uwierzytelniania współdzielonym sekretem za pomocą `gateway.auth.mode: "token"` albo
`"password"`.

**Reguła bezpieczeństwa:** nie przekazuj tych nagłówków z własnego odwrotnego proxy. Jeśli
terminujesz TLS albo używasz proxy przed gateway, wyłącz
`gateway.auth.allowTailscale` i zamiast tego użyj uwierzytelniania współdzielonym sekretem (`gateway.auth.mode:
"token"` albo `"password"`) albo [uwierzytelniania przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

Zaufane proxy:

- Jeśli terminujesz TLS przed Gateway, ustaw `gateway.trustedProxies` na adresy IP swojego proxy.
- OpenClaw zaufa `x-forwarded-for` (albo `x-real-ip`) z tych adresów IP, aby określić IP klienta na potrzeby sprawdzania lokalnego parowania oraz uwierzytelniania HTTP/sprawdzeń lokalnych.
- Upewnij się, że Twoje proxy **nadpisuje** `x-forwarded-for` i blokuje bezpośredni dostęp do portu Gateway.

Zobacz [Tailscale](/pl/gateway/tailscale) i [przegląd Web](/pl/web).

### Sterowanie przeglądarką przez host Node (zalecane)

Jeśli Twój Gateway jest zdalny, ale przeglądarka działa na innej maszynie, uruchom **host Node**
na maszynie z przeglądarką i pozwól Gateway pośredniczyć w akcjach przeglądarki (zobacz [narzędzie przeglądarki](/pl/tools/browser)).
Traktuj parowanie Node jak dostęp administracyjny.

Zalecany wzorzec:

- Trzymaj Gateway i host Node w tym samym tailnet (Tailscale).
- Sparuj Node świadomie; wyłącz trasowanie proxy przeglądarki, jeśli go nie potrzebujesz.

Unikaj:

- Wystawiania portów przekaźnika/kontroli przez LAN lub publiczny Internet.
- Tailscale Funnel dla punktów końcowych sterowania przeglądarką (ekspozycja publiczna).

### Sekrety na dysku

Załóż, że wszystko w `~/.openclaw/` (albo `$OPENCLAW_STATE_DIR/`) może zawierać sekrety lub dane prywatne:

- `openclaw.json`: konfiguracja może zawierać tokeny (gateway, zdalny gateway), ustawienia dostawców i listy dozwolonych.
- `credentials/**`: poświadczenia kanałów (przykład: poświadczenia WhatsApp), listy dozwolone parowania, starsze importy OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: klucze API, profile tokenów, tokeny OAuth oraz opcjonalne `keyRef`/`tokenRef`.
- `agents/<agentId>/agent/codex-home/**`: przypisane do agenta konto serwera aplikacji Codex, konfiguracja, skills, plugins, natywny stan wątków i diagnostyka.
- `secrets.json` (opcjonalnie): ładunek sekretów oparty na pliku, używany przez dostawców SecretRef typu `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: starszy plik zgodności. Statyczne wpisy `api_key` są czyszczone po wykryciu.
- `agents/<agentId>/sessions/**`: transkrypty sesji (`*.jsonl`) + metadane trasowania (`sessions.json`), które mogą zawierać prywatne wiadomości i wynik narzędzi.
- pakiety dołączonych Plugin: zainstalowane plugins (plus ich `node_modules/`).
- `sandboxes/**`: przestrzenie robocze piaskownic narzędzi; mogą gromadzić kopie plików czytanych/zapisywanych w piaskownicy.

Wskazówki utwardzające:

- Utrzymuj restrykcyjne uprawnienia (`700` dla katalogów, `600` dla plików).
- Używaj pełnego szyfrowania dysku na hoście gateway.
- Preferuj dedykowane konto użytkownika systemu operacyjnego dla Gateway, jeśli host jest współdzielony.

### Pliki `.env` przestrzeni roboczej

OpenClaw ładuje lokalne pliki `.env` przestrzeni roboczej dla agentów i narzędzi, ale nigdy nie pozwala tym plikom po cichu nadpisywać kontroli runtime gateway.

- Każdy klucz zaczynający się od `OPENCLAW_*` jest blokowany w niezaufanych plikach `.env` przestrzeni roboczej.
- Ustawienia punktów końcowych kanałów dla Matrix, Mattermost, IRC i Synology Chat są również blokowane przed nadpisaniami z `.env` przestrzeni roboczej, więc sklonowane przestrzenie robocze nie mogą przekierować ruchu dołączonych konektorów przez lokalną konfigurację punktów końcowych. Klucze env punktów końcowych (takie jak `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) muszą pochodzić ze środowiska procesu gateway albo z `env.shellEnv`, a nie z pliku `.env` ładowanego z przestrzeni roboczej.
- Blokada działa w trybie bezpiecznego zamknięcia: nowa zmienna kontroli runtime dodana w przyszłej wersji nie może zostać odziedziczona z wpisanego do repozytorium albo dostarczonego przez atakującego pliku `.env`; klucz jest ignorowany, a gateway zachowuje własną wartość.
- Zaufane zmienne środowiskowe procesu/systemu operacyjnego (własna powłoka gateway, jednostka launchd/systemd, pakiet aplikacji) nadal obowiązują - ograniczenie dotyczy tylko ładowania plików `.env`.

Dlaczego: pliki `.env` przestrzeni roboczej często znajdują się obok kodu agenta, bywają przypadkowo commitowane albo zapisywane przez narzędzia. Blokowanie całego prefiksu `OPENCLAW_*` oznacza, że późniejsze dodanie nowej flagi `OPENCLAW_*` nigdy nie spowoduje regresji do cichego dziedziczenia ze stanu przestrzeni roboczej.

### Logi i transkrypty (redakcja i retencja)

Logi i transkrypty mogą ujawniać informacje wrażliwe nawet wtedy, gdy kontrole dostępu są poprawne:

- Logi Gateway mogą zawierać podsumowania narzędzi, błędy i URL-e.
- Transkrypty sesji mogą zawierać wklejone sekrety, zawartość plików, wynik poleceń i linki.

Zalecenia:

- Pozostaw redakcję logów i transkryptów włączoną (`logging.redactSensitive: "tools"`; domyślnie).
- Dodaj niestandardowe wzorce dla swojego środowiska przez `logging.redactPatterns` (tokeny, nazwy hostów, wewnętrzne URL-e).
- Udostępniając diagnostykę, preferuj `openclaw status --all` (łatwe do wklejenia, sekrety zredagowane) zamiast surowych logów.
- Usuwaj stare transkrypty sesji i pliki logów, jeśli nie potrzebujesz długiej retencji.

Szczegóły: [logowanie](/pl/gateway/logging)

### DM-y: domyślnie parowanie

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

W czatach grupowych odpowiadaj tylko wtedy, gdy wyraźnie o Tobie wspomniano.

### Oddzielne numery (WhatsApp, Signal, Telegram)

W przypadku kanałów opartych na numerach telefonów rozważ uruchamianie AI na oddzielnym numerze telefonu niż Twój osobisty:

- Numer osobisty: Twoje rozmowy pozostają prywatne
- Numer bota: AI obsługuje te rozmowy z odpowiednimi granicami

### Tryb tylko do odczytu (przez sandbox i narzędzia)

Możesz utworzyć profil tylko do odczytu, łącząc:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (lub `"none"` przy braku dostępu do przestrzeni roboczej)
- listy dozwolonych/zabronionych narzędzi blokujące `write`, `edit`, `apply_patch`, `exec`, `process` itd.

Dodatkowe opcje utwardzania:

- `tools.exec.applyPatch.workspaceOnly: true` (domyślnie): zapewnia, że `apply_patch` nie może zapisywać ani usuwać poza katalogiem przestrzeni roboczej, nawet gdy sandboxing jest wyłączony. Ustaw na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` dotykał plików poza przestrzenią roboczą.
- `tools.fs.workspaceOnly: true` (opcjonalnie): ogranicza ścieżki `read`/`write`/`edit`/`apply_patch` oraz ścieżki automatycznego ładowania obrazów z natywnego promptu do katalogu przestrzeni roboczej (przydatne, jeśli obecnie zezwalasz na ścieżki bezwzględne i chcesz mieć jedną barierę ochronną).
- Utrzymuj wąskie korzenie systemu plików: unikaj szerokich korzeni, takich jak katalog domowy, dla przestrzeni roboczych agentów lub przestrzeni roboczych sandboxa. Szerokie korzenie mogą ujawnić narzędziom systemu plików wrażliwe pliki lokalne (na przykład stan/konfigurację pod `~/.openclaw`).

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

Jeśli chcesz także wykonywania narzędzi „bezpieczniejszego domyślnie”, dodaj sandbox i zablokuj niebezpieczne narzędzia dla każdego agenta niebędącego właścicielem (przykład poniżej w sekcji „Profile dostępu na agenta”).

Wbudowana konfiguracja bazowa dla tur agenta sterowanych czatem: nadawcy niebędący właścicielami nie mogą używać narzędzi `cron` ani `gateway`.

## Sandboxing (zalecane)

Dedykowana dokumentacja: [Sandboxing](/pl/gateway/sandboxing)

Dwa uzupełniające się podejścia:

- **Uruchom cały Gateway w Dockerze** (granica kontenera): [Docker](/pl/install/docker)
- **Sandbox narzędzi** (`agents.defaults.sandbox`, host gateway + narzędzia izolowane sandboxem; Docker jest domyślnym backendem): [Sandboxing](/pl/gateway/sandboxing)

<Note>
Aby zapobiec dostępowi między agentami, pozostaw `agents.defaults.sandbox.scope` ustawione na `"agent"` (domyślnie) albo `"session"` dla ściślejszej izolacji na sesję. `scope: "shared"` używa jednego kontenera lub jednej przestrzeni roboczej.
</Note>

Rozważ też dostęp agenta do przestrzeni roboczej wewnątrz sandboxa:

- `agents.defaults.sandbox.workspaceAccess: "none"` (domyślnie) utrzymuje przestrzeń roboczą agenta poza dostępem; narzędzia działają względem przestrzeni roboczej sandboxa pod `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` montuje przestrzeń roboczą agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` montuje przestrzeń roboczą agenta do odczytu/zapisu pod `/workspace`
- Dodatkowe `sandbox.docker.binds` są sprawdzane względem znormalizowanych i skanonikalizowanych ścieżek źródłowych. Sztuczki z dowiązaniami symbolicznymi rodzica i kanonicznymi aliasami katalogu domowego nadal kończą się bezpiecznym odrzuceniem, jeśli rozwiązują się do zablokowanych korzeni, takich jak `/etc`, `/var/run` lub katalogi poświadczeń w katalogu domowym systemu operacyjnego.

<Warning>
`tools.elevated` to globalna bazowa furtka, która uruchamia exec poza sandboxem. Efektywny host to domyślnie `gateway` albo `node`, gdy cel exec jest skonfigurowany jako `node`. Utrzymuj `tools.elevated.allowFrom` restrykcyjnie i nie włączaj tego dla obcych. Możesz dodatkowo ograniczyć tryb podwyższony na agenta przez `agents.list[].tools.elevated`. Zobacz [Tryb podwyższony](/pl/tools/elevated).
</Warning>

### Bariera ochronna delegowania subagentów

Jeśli zezwalasz na narzędzia sesji, traktuj delegowane uruchomienia subagentów jako kolejną decyzję graniczną:

- Odmów `sessions_spawn`, chyba że agent naprawdę potrzebuje delegowania.
- Utrzymuj `agents.defaults.subagents.allowAgents` oraz wszelkie nadpisania `agents.list[].subagents.allowAgents` na agenta ograniczone do znanych, bezpiecznych agentów docelowych.
- Dla każdego przepływu pracy, który musi pozostać w sandboxie, wywołuj `sessions_spawn` z `sandbox: "require"` (domyślnie jest `inherit`).
- `sandbox: "require"` szybko kończy się niepowodzeniem, gdy docelowe środowisko uruchomieniowe dziecka nie jest objęte sandboxem.

## Ryzyka kontroli przeglądarki

Włączenie kontroli przeglądarki daje modelowi możliwość sterowania prawdziwą przeglądarką.
Jeśli ten profil przeglądarki zawiera już zalogowane sesje, model może uzyskać
dostęp do tych kont i danych. Traktuj profile przeglądarki jako **wrażliwy stan**:

- Preferuj dedykowany profil dla agenta (domyślny profil `openclaw`).
- Unikaj wskazywania agentowi swojego osobistego, codziennego profilu.
- Utrzymuj kontrolę przeglądarki hosta wyłączoną dla agentów w sandboxie, chyba że im ufasz.
- Samodzielne API kontroli przeglądarki local loopback honoruje tylko uwierzytelnianie współdzielonym sekretem
  (uwierzytelnianie bearer tokenem gateway lub hasło gateway). Nie używa
  nagłówków tożsamości trusted-proxy ani Tailscale Serve.
- Traktuj pobrania z przeglądarki jako niezaufane dane wejściowe; preferuj izolowany katalog pobrań.
- Jeśli to możliwe, wyłącz synchronizację przeglądarki i menedżery haseł w profilu agenta (zmniejsza zasięg szkód).
- W przypadku zdalnych gateway zakładaj, że „kontrola przeglądarki” jest równoważna „dostępowi operatora” do wszystkiego, do czego ten profil może dotrzeć.
- Utrzymuj hosty Gateway i node dostępne tylko w tailnecie; unikaj wystawiania portów kontroli przeglądarki do LAN lub publicznego Internetu.
- Wyłącz trasowanie proxy przeglądarki, gdy go nie potrzebujesz (`gateway.nodes.browser.mode="off"`).
- Tryb istniejącej sesji Chrome MCP **nie** jest „bezpieczniejszy”; może działać jako Ty we wszystkim, do czego może dotrzeć ten profil Chrome na hoście.

### Polityka SSRF przeglądarki (domyślnie ścisła)

Polityka nawigacji przeglądarki OpenClaw jest domyślnie ścisła: prywatne/wewnętrzne cele pozostają zablokowane, chyba że jawnie je włączysz.

- Domyślnie: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest nieustawione, więc nawigacja przeglądarki nadal blokuje prywatne/wewnętrzne/specjalnego użycia cele.
- Starszy alias: `browser.ssrfPolicy.allowPrivateNetwork` jest nadal akceptowany dla zgodności.
- Tryb opt-in: ustaw `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, aby zezwolić na prywatne/wewnętrzne/specjalnego użycia cele.
- W trybie ścisłym używaj `hostnameAllowlist` (wzorce takie jak `*.example.com`) i `allowedHostnames` (dokładne wyjątki hostów, w tym zablokowane nazwy, takie jak `localhost`) dla jawnych wyjątków.
- Nawigacja jest sprawdzana przed żądaniem i ponownie, w trybie best-effort, na końcowym adresie URL `http(s)` po nawigacji, aby ograniczyć pivoty oparte na przekierowaniach.

Przykładowa ścisła polityka:

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

## Profile dostępu na agenta (wiele agentów)

Dzięki trasowaniu wieloagentowemu każdy agent może mieć własny sandbox i politykę narzędzi:
użyj tego, aby przydzielić **pełny dostęp**, **tylko do odczytu** albo **brak dostępu** na agenta.
Zobacz [Wieloagentowy sandbox i narzędzia](/pl/tools/multi-agent-sandbox-tools), aby uzyskać pełne szczegóły
oraz reguły pierwszeństwa.

Typowe przypadki użycia:

- Agent osobisty: pełny dostęp, bez sandboxa
- Agent rodzinny/służbowy: sandbox + narzędzia tylko do odczytu
- Agent publiczny: sandbox + brak narzędzi systemu plików/powłoki

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

### Przykład: narzędzia tylko do odczytu + przestrzeń robocza tylko do odczytu

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

### Przykład: brak dostępu do systemu plików/powłoki (komunikacja przez dostawcę dozwolona)

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
2. **Zamknij ekspozycję:** ustaw `gateway.bind: "loopback"` (albo wyłącz Tailscale Funnel/Serve), dopóki nie zrozumiesz, co się stało.
3. **Zamroź dostęp:** przełącz ryzykowne DM/grupy na `dmPolicy: "disabled"` / wymagaj wzmianek i usuń wpisy `"*"` zezwalające wszystkim, jeśli ich używałeś.

### Rotuj (zakładaj kompromitację, jeśli wyciekły sekrety)

1. Zrotuj uwierzytelnianie Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) i uruchom ponownie.
2. Zrotuj sekrety klientów zdalnych (`gateway.remote.token` / `.password`) na każdej maszynie, która może wywołać Gateway.
3. Zrotuj poświadczenia dostawców/API (poświadczenia WhatsApp, tokeny Slack/Discord, klucze modelu/API w `auth-profiles.json` oraz wartości zaszyfrowanych ładunków sekretów, gdy są używane).

### Audytuj

1. Sprawdź logi Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (albo `logging.file`).
2. Przejrzyj odpowiednie transkrypty: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Przejrzyj ostatnie zmiany konfiguracji (wszystko, co mogło rozszerzyć dostęp: `gateway.bind`, `gateway.auth`, polityki DM/grup, `tools.elevated`, zmiany Plugin).
4. Uruchom ponownie `openclaw security audit --deep` i potwierdź, że krytyczne ustalenia zostały rozwiązane.

### Zbierz do raportu

- Znacznik czasu, system operacyjny hosta gateway + wersja OpenClaw
- Transkrypty sesji + krótki ogon logu (po redakcji)
- Co wysłał atakujący + co zrobił agent
- Czy Gateway był wystawiony poza loopback (LAN/Tailscale Funnel/Serve)

## Skanowanie sekretów

CI uruchamia hook pre-commit `detect-private-key` na repozytorium. Jeśli
zawiedzie, usuń lub zrotuj zatwierdzony materiał klucza, a następnie odtwórz lokalnie:

```bash
pre-commit run --all-files detect-private-key
```

## Zgłaszanie problemów bezpieczeństwa

Znalazłeś podatność w OpenClaw? Zgłoś ją odpowiedzialnie:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Nie publikuj publicznie, dopóki nie zostanie naprawiona
3. Podziękujemy Ci (chyba że wolisz anonimowość)
