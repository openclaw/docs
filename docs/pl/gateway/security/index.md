---
read_when:
    - Dodawanie funkcji rozszerzających dostęp lub automatyzację
summary: Kwestie bezpieczeństwa i model zagrożeń związane z uruchamianiem bramy AI z dostępem do powłoki
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-16T18:28:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 39f8b4d598af5dac79f842b88461fad2187f0fe8d509b6dce1b9d720f2009351
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model zaufania osobistego asystenta.** Te wskazówki zakładają jedną granicę
  zaufanego operatora na każdy Gateway (model jednego użytkownika i osobistego
  asystenta). OpenClaw **nie** stanowi odpornej na ataki, wielodostępnej granicy
  bezpieczeństwa dla wielu wrogich użytkowników współdzielących jednego agenta
  lub jeden Gateway. W przypadku działania z różnymi poziomami zaufania lub
  wrogimi użytkownikami należy rozdzielić granice zaufania: osobny Gateway +
  poświadczenia, a najlepiej także osobni użytkownicy systemu operacyjnego lub
  osobne hosty.
</Warning>

## Zakres: model bezpieczeństwa osobistego asystenta

- Obsługiwane: jeden użytkownik/jedna granica zaufania na każdy Gateway (najlepiej jeden użytkownik systemu operacyjnego/host/VPS na granicę).
- Nieobsługiwane: jeden współdzielony Gateway/agent używany przez wzajemnie sobie nieufających lub wrogich użytkowników.
- Izolacja wrogich użytkowników wymaga osobnych Gatewayów (a najlepiej także osobnych użytkowników systemu operacyjnego/hostów).
- Jeśli kilku niezaufanych użytkowników może wysyłać wiadomości do jednego agenta z włączonymi narzędziami, współdzielą oni delegowane agentowi uprawnienia do narzędzi.
- Jeśli ktoś może modyfikować stan/konfigurację hosta Gatewaya (`~/.openclaw`, w tym `openclaw.json`), należy traktować tę osobę jako zaufanego operatora.
- W obrębie jednego Gatewaya uwierzytelniony dostęp operatora jest zaufaną rolą płaszczyzny sterowania, a nie rolą dzierżawcy przypisaną do użytkownika.
- `sessionKey` (identyfikatory sesji, etykiety) jest selektorem routingu, a nie tokenem autoryzacyjnym.

Hostujesz wielu użytkowników lub wiele organizacji? Zamiast współdzielić Gateway, uruchom jedną odizolowaną komórkę Gatewaya dla każdego dzierżawcy. Zobacz [Hosting wielodostępny](/gateway/multi-tenant-hosting).

Przed zmianą dostępu zdalnego, zasad wiadomości prywatnych, odwrotnego serwera proxy lub publicznego udostępnienia przejdź przez [procedurę udostępniania Gatewaya](/pl/gateway/security/exposure-runbook), używając jej jako listy kontrolnej przed wdrożeniem i wycofaniem zmian.

## `openclaw security audit`

Uruchom poniższe polecenia po każdej zmianie konfiguracji lub przed udostępnieniem interfejsów sieciowych:

```bash
openclaw security audit
openclaw security audit --deep    # próbuje aktywnie zbadać Gateway
openclaw security audit --fix     # stosuje bezpieczne środki zaradcze
openclaw security audit --json
```

`--fix` ma celowo wąski zakres: zmienia otwarte zasady grup na listy dozwolonych, przywraca `logging.redactSensitive: "tools"`, zaostrza uprawnienia do stanu/konfiguracji/dołączanych plików (pliki `600`, katalogi `700`), a w systemie Windows zamiast POSIX `chmod` używa resetowania list ACL.

### Co sprawdza audyt (ogólnie)

- **Dostęp przychodzący** — zasady wiadomości prywatnych/grup i listy dozwolonych: czy obce osoby mogą uruchomić bota?
- **Zasięg oddziaływania narzędzi** — narzędzia o podwyższonych uprawnieniach + otwarte pokoje: czy wstrzyknięcie polecenia może doprowadzić do operacji powłoki, plików lub sieci?
- **Rozbieżności dostępu exec do systemu plików** — narzędzia modyfikujące system plików są zabronione, podczas gdy `exec`/`process` pozostają dostępne bez ograniczeń piaskownicy.
- **Rozbieżności zatwierdzania exec** — `security="full"`, `autoAllowSkills`, listy dozwolonych interpreterów bez `strictInlineEval`. Samo `security="full"` jest ogólnym ostrzeżeniem dotyczącym przyjętego podejścia, a nie dowodem błędu — jest to wybrane ustawienie domyślne dla konfiguracji z zaufanym osobistym asystentem; należy je zaostrzać tylko wtedy, gdy model zagrożeń wymaga zabezpieczeń w postaci zatwierdzania lub listy dozwolonych.
- **Udostępnienie sieciowe** — powiązanie/uwierzytelnianie Gatewaya, Tailscale Serve/Funnel, słabe lub krótkie tokeny uwierzytelniające.
- **Udostępnienie sterowania przeglądarką** — zdalne Node'y, porty przekazywania, zdalne punkty końcowe CDP.
- **Higiena dysku lokalnego** — uprawnienia, dowiązania symboliczne, dołączenia konfiguracji, ścieżki folderów synchronizowanych.
- **Pluginy** — ładowanie bez jawnej listy dozwolonych.
- **Rozbieżności zasad** — ustawienia Dockera dla piaskownicy są skonfigurowane, ale tryb piaskownicy jest wyłączony; wpisy `gateway.nodes.denyCommands`, które wyglądają na skuteczne, ale pasują tylko do dokładnych identyfikatorów poleceń (na przykład `system.run`), a nie do tekstu powłoki wewnątrz ładunku; niebezpieczne wpisy `gateway.nodes.allowCommands`; globalne `tools.profile="minimal"` zastąpione dla poszczególnych agentów; narzędzia należące do Pluginów dostępne przy liberalnych zasadach.
- **Rozbieżności oczekiwań wobec środowiska uruchomieniowego** — założenie, że niejawne exec nadal oznacza `sandbox`, mimo że `tools.exec.host` ma teraz domyślnie wartość `auto`, albo ustawienie `tools.exec.host="sandbox"`, gdy tryb piaskownicy jest wyłączony.
- **Higiena modeli** — ostrzega o skonfigurowanych starszych modelach (łagodne ostrzeżenie, nie bezwzględna blokada).

Każdy wynik ma ustrukturyzowany `checkId` (na przykład `gateway.bind_no_auth`, `tools.exec.security_full_configured`). Prefiksy: `fs.*` (uprawnienia), `gateway.*` (powiązanie/uwierzytelnianie/Tailscale/Control UI/zaufany serwer proxy), `hooks.*`/`browser.*`/`sandbox.*`/`tools.exec.*` (wzmocnienie zabezpieczeń poszczególnych interfejsów), `plugins.*`/`skills.*` (łańcuch dostaw), `security.exposure.*` (zasady dostępu × zasięg oddziaływania narzędzi). Pełny katalog z poziomami istotności i informacją o obsłudze automatycznych poprawek: [Kontrole audytu bezpieczeństwa](/pl/gateway/security/audit-checks). Zobacz także [Weryfikacja formalna](/pl/security/formal-verification).

### Kolejność priorytetów podczas klasyfikowania wyników

1. Wszystko, co jest „otwarte” i ma włączone narzędzia: najpierw ogranicz wiadomości prywatne/grupy (parowanie/listy dozwolonych), a następnie zaostrz zasady narzędzi i piaskownicy.
2. Publiczne udostępnienie sieciowe (powiązanie z siecią LAN, Funnel, brak uwierzytelniania): napraw natychmiast.
3. Zdalne udostępnienie sterowania przeglądarką: traktuj jak dostęp operatora (wyłącznie przez tailnet, świadomie paruj Node'y, bez publicznego udostępnienia).
4. Uprawnienia: stan/konfiguracja/poświadczenia/dane uwierzytelniające nie mogą być dostępne do odczytu dla grupy ani wszystkich użytkowników.
5. Pluginy: ładuj tylko te, którym wyraźnie ufasz.
6. Wybór modelu: w przypadku każdego bota z narzędziami preferuj nowoczesne modele odporne na manipulację instrukcjami.

## Wzmocniona konfiguracja bazowa w 60 sekund

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

Utrzymuje Gateway wyłącznie lokalnie, izoluje wiadomości prywatne i domyślnie wyłącza narzędzia płaszczyzny sterowania oraz środowiska uruchomieniowego. Następnie można selektywnie ponownie włączać narzędzia dla poszczególnych zaufanych agentów.

Wbudowana konfiguracja bazowa dla tur agenta inicjowanych przez czat: nadawcy niebędący właścicielem nie mogą używać narzędzi `cron` ani `gateway` niezależnie od konfiguracji.

## Macierz granic zaufania

Skrócony model klasyfikowania zgłoszeń ryzyka:

| Granica lub mechanizm kontrolny                           | Znaczenie                                          | Częsta błędna interpretacja                                                     |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/hasło/zaufany serwer proxy/uwierzytelnianie urządzenia) | Uwierzytelnia wywołujących interfejsy API Gatewaya | „Bezpieczeństwo wymaga podpisów każdej wiadomości w każdej ramce”              |
| `sessionKey`                                              | Klucz routingu do wyboru kontekstu/sesji           | „Klucz sesji jest granicą uwierzytelniania użytkownika”                        |
| Zabezpieczenia poleceń/treści                             | Ograniczają ryzyko nadużycia modelu                | „Samo wstrzyknięcie polecenia dowodzi obejścia uwierzytelniania”               |
| `canvas.eval` / wykonywanie kodu w przeglądarce           | Celowa funkcja operatora, gdy jest włączona        | „Każdy mechanizm wykonywania JS automatycznie jest luką w tym modelu zaufania” |
| Lokalna powłoka TUI `!`                           | Lokalne wykonanie jawnie uruchomione przez operatora | „Wygodne lokalne polecenie powłoki jest zdalnym wstrzyknięciem”              |
| Parowanie Node'ów i polecenia Node'ów                     | Zdalne wykonywanie na sparowanych urządzeniach z uprawnieniami operatora | „Zdalne sterowanie urządzeniem należy domyślnie traktować jako dostęp niezaufanego użytkownika” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opcjonalna zasada rejestracji Node'ów w zaufanej sieci | „Domyślnie wyłączona lista dozwolonych automatycznie stanowi lukę w parowaniu” |
| `gateway.nodes.pairing.sshVerify`                         | Rejestracja Node'a ze zweryfikowanym kluczem przez SSH operatora | „Domyślnie włączone automatyczne zatwierdzanie automatycznie stanowi lukę w parowaniu” |

## Zachowania, które z założenia nie są lukami

<Accordion title="Częste zgłoszenia zamykane bez podejmowania działań">

- Łańcuchy oparte wyłącznie na wstrzyknięciu polecenia, bez obejścia zasad, uwierzytelniania ani piaskownicy.
- Twierdzenia zakładające wrogie, wielodostępne działanie na jednym współdzielonym hoście lub z jedną konfiguracją.
- Zwykły dostęp operatora do ścieżek odczytu (na przykład `sessions.list` / `sessions.preview` / `chat.history`) sklasyfikowany jako IDOR w konfiguracji ze współdzielonym Gatewayem.
- Zgłoszenia dotyczące wdrożeń dostępnych wyłącznie przez localhost (na przykład brak HSTS w Gatewayu dostępnym wyłącznie przez interfejs pętli zwrotnej).
- Zgłoszenia dotyczące podpisów przychodzących Webhooków Discorda dla ścieżek przychodzących, które nie istnieją w tym repozytorium.
- Metadane parowania Node'a traktowane jako ukryta, druga warstwa zatwierdzania każdego polecenia dla `system.run`; rzeczywistą granicą wykonywania są globalne zasady poleceń Node'a w Gatewayu oraz własne zatwierdzenia exec tego Node'a.
- `gateway.nodes.pairing.sshVerify` traktowane jako luka, ponieważ jest domyślnie włączone. Nigdy nie zatwierdza wyłącznie na podstawie lokalizacji sieciowej ani dostępności przez SSH: Gateway odczytuje tożsamość urządzenia przez SSH (BatchMode, ścisła kontrola kluczy hosta) i zatwierdza tylko w przypadku dokładnej zgodności klucza urządzenia z oczekującym żądaniem, co wymaga, aby łącząca się para kluczy już znajdowała się na koncie operatora na hoście kontrolowanym przez operatora. Sondowanie jest ograniczone do prywatnych/CGNAT-owych adresów źródłowych, podlega wspólnemu minimalnemu warunkowi kwalifikacji zaufanego CIDR (wyłącznie świeże `role: node` bez zakresu), a `sshVerify: false` wyłącza tę funkcję.
- `gateway.nodes.pairing.autoApproveCidrs` traktowane samo w sobie jako luka. Jest domyślnie wyłączone, wymaga jawnych wpisów CIDR/IP, ma zastosowanie wyłącznie do pierwszego parowania `role: node` bez żądanych zakresów i nigdy nie zatwierdza automatycznie operatora/przeglądarki/Control UI, WebChat, podwyższeń roli/zakresu, zmian metadanych ani klucza publicznego, ani ścieżek nagłówków zaufanego serwera proxy przez pętlę zwrotną na tym samym hoście (nawet gdy uwierzytelnianie zaufanego serwera proxy przez pętlę zwrotną jest włączone).
- Zgłoszenia „braku autoryzacji dla poszczególnych użytkowników”, które traktują `sessionKey` jako token uwierzytelniający.

</Accordion>

## Zaufanie do Gatewaya i Node'a

Gateway i Node należy traktować jako jedną domenę zaufania operatora z różnymi rolami:

- **Gateway**: płaszczyzna sterowania i interfejs zasad (`gateway.auth`, zasady narzędzi, routing).
- **Node**: interfejs zdalnego wykonywania sparowany z tym Gatewayem (polecenia, działania urządzenia, lokalne funkcje hosta).
- Wywołujący uwierzytelniony w Gatewayu jest zaufany w zakresie Gatewaya; po sparowaniu działania Node'a są zaufanymi działaniami operatora na tym Nodze. Zobacz [Zakresy operatora](/pl/gateway/operator-scopes).
- Bezpośrednie klienty zaplecza korzystające z interfejsu pętli zwrotnej, uwierzytelnione współdzielonym tokenem/hasłem Gatewaya, mogą wykonywać wewnętrzne wywołania RPC płaszczyzny sterowania bez przedstawiania tożsamości urządzenia użytkownika. Nie jest to obejście parowania zdalnego ani parowania przeglądarki — klienty sieciowe, klienty Node'a, klienty korzystające z tokenów urządzeń i jawne tożsamości urządzeń nadal podlegają mechanizmom parowania i egzekwowania podwyższeń zakresu.
- Zatwierdzenia exec (lista dozwolonych + pytanie) są zabezpieczeniami intencji operatora, a nie izolacją wrogich dzierżawców. Wiążą dokładny kontekst żądania i, w miarę możliwości, bezpośrednie lokalne operandy plikowe; nie modelują semantycznie każdej ścieżki ładowania środowiska uruchomieniowego/interpretera. Silne granice wymagają piaskownicy i izolacji hosta.
- Domyślne ustawienie dla zaufanego pojedynczego operatora: wykonywanie poleceń hosta przez `gateway`/`node` jest dozwolone bez monitów o zatwierdzenie (`security="full"`, `ask="off"`). Jest to celowa decyzja dotycząca wygody użytkowania, a nie luka sama w sobie.

W celu izolacji wrogich użytkowników należy rozdzielić granice zaufania według użytkownika systemu operacyjnego/hosta i uruchamiać osobne Gatewaye.

## Model zagrożeń

Twój asystent AI może wykonywać dowolne polecenia powłoki, odczytywać i zapisywać pliki, uzyskiwać dostęp do usług sieciowych oraz wysyłać wiadomości do dowolnych osób (jeśli ma dostęp do kanału). Osoby, które wysyłają mu wiadomości, mogą próbować nakłonić go do szkodliwych działań, socjotechnicznie uzyskać dostęp do Twoich danych lub sondować szczegóły infrastruktury.

Większość awarii nie wynika z egzotycznych exploitów — zwykle „ktoś wysłał wiadomość do bota, a bot zrobił to, o co go poproszono”. Podejście OpenClaw, w kolejności:

1. **Najpierw tożsamość** — zdecyduj, kto może rozmawiać z botem (parowanie wiadomości prywatnych / listy dozwolonych / jawne „otwarcie”).
2. **Następnie zakres** — zdecyduj, gdzie bot może działać (listy dozwolonych grup + wymóg wzmianki, narzędzia, izolacja w piaskownicy, uprawnienia urządzenia).
3. **Model na końcu** — załóż, że modelem można manipulować; zaprojektuj system tak, aby skutki manipulacji miały ograniczony zasięg.

## Dostęp przez wiadomości prywatne: parowanie, lista dozwolonych, otwarty, wyłączony

Każdy kanał obsługujący wiadomości prywatne obsługuje `dmPolicy` (lub `*.dm.policy`), który blokuje przychodzące wiadomości prywatne przed ich przetworzeniem:

| Zasada      | Zachowanie                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pairing`   | Domyślna. Nieznani nadawcy otrzymują kod parowania; bot ich ignoruje do czasu zatwierdzenia. Kody wygasają po 1 godzinie; kolejne wiadomości prywatne nie powodują ponownego wysłania kodu, dopóki nie zostanie utworzone nowe żądanie. Liczba oczekujących żądań jest ograniczona do 3 na kanał. |
| `allowlist` | Nieznani nadawcy są blokowani, bez procedury parowania.                                                                                                                                                                       |
| `open`      | Każdy może wysłać wiadomość prywatną (dostęp publiczny). Wymaga uwzględnienia `"*"` na liście dozwolonych kanału (jawna zgoda).                                                                                                                           |
| `disabled`  | Przychodzące wiadomości prywatne są całkowicie ignorowane.                                                                                                                                                                                        |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Szczegóły i pliki na dysku: [Parowanie](/pl/channels/pairing)

Ustawienia `dmPolicy="open"` i `groupPolicy="open"` należy traktować jako ostateczność; preferuj parowanie i listy dozwolonych, chyba że w pełni ufasz każdemu uczestnikowi pokoju.

### Listy dozwolonych (dwie warstwy)

- **Lista dozwolonych wiadomości prywatnych** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; starsze: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): określa, kto może wysyłać botowi wiadomości prywatne. Gdy `dmPolicy="pairing"`, zatwierdzenia są zapisywane w `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne) lub `<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne) i łączone z listami dozwolonych w konfiguracji.
- **Lista dozwolonych grup** (zależna od kanału): określa, które grupy/kanały/serwery bot w ogóle akceptuje.
  - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ustawienia domyślne dla poszczególnych grup, takie jak `requireMention`; po ustawieniu pełnią również funkcję listy dozwolonych grup (uwzględnij `"*"`, aby zachować zezwalanie na wszystkie). Wyzwalacze wzmianek można dostosować za pomocą `agents.list[].groupChat.mentionPatterns` (na przykład `["@openclaw", "@mybot"]`), aby `requireMention` wymagało własnych nazw bota.
  - `groupPolicy="allowlist"` + `groupAllowFrom`: ograniczają, kto może wyzwolić bota w ramach sesji grupowej (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
  - `channels.discord.guilds` / `channels.slack.channels`: listy dozwolonych dla poszczególnych powierzchni oraz domyślne ustawienia wzmianek.
  - Kolejność sprawdzania: najpierw `groupPolicy`/listy dozwolonych grup, a następnie aktywacja przez wzmiankę/odpowiedź. Odpowiedź na wiadomość bota (niejawna wzmianka) **nie** omija `groupAllowFrom`.

Szczegóły: [Konfiguracja](/pl/gateway/configuration) i [Grupy](/pl/channels/groups)

### Izolacja sesji wiadomości prywatnych (tryb wielu użytkowników)

Domyślnie OpenClaw kieruje wszystkie wiadomości prywatne do sesji głównej, aby zapewnić ciągłość między urządzeniami. Jeśli wiele osób może wysyłać botowi wiadomości prywatne (otwarte wiadomości prywatne lub lista dozwolonych obejmująca wiele osób), izoluj sesje wiadomości prywatnych:

```json5
{ session: { dmScope: "per-channel-peer" } }
```

Wartości `session.dmScope`:

| Wartość                      | Zakres                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `main` (domyślna konfiguracja)    | Wszystkie wiadomości prywatne współdzielą jedną sesję.                                             |
| `per-channel-peer`         | Każda para kanał+nadawca otrzymuje odizolowany kontekst wiadomości prywatnych (bezpieczny tryb wiadomości prywatnych). |
| `per-account-channel-peer` | Jak wyżej, z dodatkowym podziałem według konta (kanały obsługujące wiele kont).         |
| `per-peer`                 | Każdy nadawca otrzymuje jedną sesję we wszystkich kanałach tego samego typu.     |

Lokalny proces wdrażania za pomocą CLI zapisuje `session.dmScope: "per-channel-peer"`, jeśli wartość nie jest ustawiona, i zachowuje każdą jawną istniejącą wartość.

Jest to granica kontekstu wiadomości, a nie granica administracji hostem. Jeśli użytkownicy są wobec siebie potencjalnie wrodzy i współdzielą ten sam host/konfigurację Gateway, uruchom oddzielne instancje Gateway dla każdej granicy zaufania.

Jeśli ta sama osoba kontaktuje się z Tobą przez wiele kanałów, użyj `session.identityLinks`, aby scalić te sesje wiadomości prywatnych w jedną kanoniczną tożsamość. Zobacz [Zarządzanie sesjami](/pl/concepts/session) i [Konfiguracja](/pl/gateway/configuration).

## Widoczność kontekstu a autoryzacja wyzwalania

Dwa odrębne pojęcia:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`dmPolicy`, `groupPolicy`, listy dozwolonych, wymogi wzmianek).
- **Widoczność kontekstu**: jaki dodatkowy kontekst dociera do modelu (treść odpowiedzi, cytowany tekst, historia wątku, metadane przekazania).

`contextVisibility` steruje drugim z nich:

- `"all"` (domyślnie): dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `"allowlist"`: dodatkowy kontekst jest filtrowany do nadawców dopuszczonych przez aktywne kontrole list dozwolonych.
- `"allowlist_quote"`: jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

Ustaw dla kanału albo pokoju/konwersacji — zobacz [Grupy](/pl/channels/groups#context-visibility-and-allowlists). Zgłoszenia wykazujące jedynie, że „model może zobaczyć cytowany/historyczny tekst od nadawców spoza listy dozwolonych”, są ustaleniami dotyczącymi wzmocnienia zabezpieczeń, które można rozwiązać za pomocą `contextVisibility`; same w sobie nie stanowią obejścia uwierzytelniania ani piaskownicy. Zgłoszenie mające wpływ na bezpieczeństwo nadal musi wykazać obejście granicy zaufania.

## Wstrzykiwanie poleceń

Atakujący tworzy wiadomość, która manipuluje modelem, aby podjął niebezpieczne działanie („zignoruj instrukcje”, „ujawnij zawartość systemu plików”, „otwórz ten link i uruchom polecenia”). Problemu wstrzykiwania poleceń **nie rozwiązują** same zabezpieczenia w monicie systemowym — są one miękkimi wskazówkami; twarde egzekwowanie zapewniają zasady dotyczące narzędzi, zatwierdzanie wykonania, izolacja w piaskownicy i listy dozwolonych kanałów (które operatorzy nadal mogą celowo wyłączyć).

Wstrzykiwanie poleceń nie wymaga publicznych wiadomości prywatnych: nawet jeśli tylko Ty możesz wysyłać wiadomości do bota, wszelkie odczytywane przez niego **niezaufane treści** (wyniki wyszukiwania/pobierania z internetu, strony w przeglądarce, wiadomości e-mail, dokumenty, załączniki, wklejone dzienniki/kod) mogą zawierać wrogie instrukcje. Powierzchnię zagrożenia stanowi sama treść, a nie tylko jej nadawca.

Sygnały ostrzegawcze, które należy traktować jako niezaufane:

- „Przeczytaj ten plik/adres URL i zrób dokładnie to, co napisano”.
- „Zignoruj monit systemowy lub reguły bezpieczeństwa”.
- „Ujawnij ukryte instrukcje lub wyniki działania narzędzi”.
- „Wklej pełną zawartość ~/.openclaw lub dzienników”.

Co pomaga w praktyce:

- Ściśle ogranicz przychodzące wiadomości prywatne (parowanie/listy dozwolonych); w grupach preferuj wymóg wzmianki; unikaj stale aktywnych botów w publicznych pokojach.
- Domyślnie traktuj linki, załączniki i wklejone instrukcje jako wrogie.
- Wykonuj wrażliwe operacje narzędzi w piaskownicy; przechowuj sekrety poza systemem plików dostępnym dla agenta. Izolacja w piaskownicy wymaga włączenia: jeśli tryb piaskownicy jest wyłączony, niejawne `host=auto` wskazuje host Gateway, natomiast jawne `host=sandbox` nadal kończy się bezpiecznym niepowodzeniem (środowisko uruchomieniowe piaskownicy jest niedostępne). Ustaw `host=gateway`, aby jawnie określić to zachowanie w konfiguracji.
- Ogranicz narzędzia wysokiego ryzyka (`exec`, `browser`, `web_fetch`, `web_search`) do zaufanych agentów lub jawnych list dozwolonych.
- Jeśli dopuszczasz interpretery (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), włącz `tools.exec.strictInlineEval`, aby formy ewaluacji wbudowanej (`-c`, `-e` i podobne) nadal wymagały jawnego zatwierdzenia. W trybie listy dozwolonych każdy segment dokumentu wbudowanego (`<<`) zawsze wymaga zatwierdzenia recenzenta lub jawnego zatwierdzenia, niezależnie od sposobu cytowania — dozwolone polecenie nie może użyć treści dokumentu wbudowanego do ominięcia przeglądu listy dozwolonych.
- Zmniejsz zasięg potencjalnych szkód, używając **agenta odczytującego** działającego tylko do odczytu lub bez narzędzi do podsumowywania niezaufanych treści, a następnie przekaż podsumowanie głównemu agentowi.
- W przypadku haków Gmail wbudowana sesja dla każdej wiadomości izoluje kontekst konwersacji, ale nie odbiera docelowemu agentowi uprawnień do narzędzi ani obszaru roboczego. Kieruj niezaufaną pocztę do dedykowanego agenta odczytującego, zastosuj [piaskownicę i ograniczenia narzędzi dla poszczególnych agentów](/pl/tools/multi-agent-sandbox-tools), a każde przekazanie do głównego agenta ogranicz za pomocą [`tools.agentToAgent`](/pl/gateway/config-tools#toolsagenttoagent). Zobacz [Integracja z Gmail](/pl/gateway/configuration-reference#gmail-integration).
- Pozostaw `web_search` / `web_fetch` / `browser` wyłączone dla agentów korzystających z narzędzi, chyba że są potrzebne.
- Dla danych wejściowych URL OpenResponses (`input_file` / `input_image`) ustaw restrykcyjne `gateway.http.endpoints.responses.files.urlAllowlist` / `images.urlAllowlist` i utrzymuj niską wartość `maxUrlParts` (puste listy dozwolonych są traktowane jako nieustawione). Użyj `files.allowUrl: false` / `images.allowUrl: false`, aby całkowicie wyłączyć pobieranie adresów URL.
- Nie umieszczaj sekretów w monitach; przekazuj je zamiast tego przez środowisko/konfigurację na hoście Gateway.

**Wybór modelu ma znaczenie.** Odporność na wstrzykiwanie poleceń nie jest jednakowa we wszystkich klasach modeli — mniejsze/tańsze modele są bardziej podatne na niewłaściwe użycie narzędzi i przejęcie sterowania instrukcjami za pomocą wrogich monitów.

<Warning>
W przypadku agentów korzystających z narzędzi lub odczytujących niezaufane treści ryzyko wstrzykiwania poleceń przy użyciu starszych/mniejszych modeli jest często zbyt wysokie. Nie uruchamiaj takich obciążeń na słabych klasach modeli.
</Warning>

- Używaj modelu najnowszej generacji i najwyższej klasy dla każdego bota, który może uruchamiać narzędzia lub uzyskiwać dostęp do plików/sieci.
- Nie używaj starszych/słabszych/mniejszych klas modeli dla agentów korzystających z narzędzi ani niezaufanych skrzynek odbiorczych.
- Jeśli musisz użyć mniejszego modelu, zmniejsz zasięg potencjalnych szkód: narzędzia tylko do odczytu, silna izolacja w piaskownicy, minimalny dostęp do systemu plików, restrykcyjne listy dozwolonych. Włącz izolację w piaskownicy dla wszystkich sesji i wyłącz `web_search`/`web_fetch`/`browser`, chyba że dane wejściowe są ściśle kontrolowane.
- W przypadku osobistych asystentów służących wyłącznie do rozmowy, z zaufanymi danymi wejściowymi i bez narzędzi, mniejsze modele są zwykle wystarczające.

### Treści zewnętrzne i opakowywanie niezaufanych danych wejściowych

Tekst `input_file` OpenResponses jest nadal wstrzykiwany jako niezaufana treść zewnętrzna, mimo że Gateway dekoduje go lokalnie — blok zawiera znaczniki granic `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` oraz metadane `Source: External` (na tej ścieżce pomijany jest dłuższy baner `SECURITY NOTICE:` używany w innych miejscach). Takie samo opakowywanie oparte na znacznikach jest stosowane, gdy mechanizm rozumienia multimediów wyodrębnia tekst z załączonych dokumentów przed dołączeniem go do monitu dotyczącego multimediów.

OpenClaw usuwa również typowe literały tokenów specjalnych szablonów czatu samodzielnie hostowanych LLM (tokeny ról/tur Qwen/ChatML, Llama, Gemma, Mistral, Phi, GPT-OSS) z opakowanej zawartości zewnętrznej i metadanych, zanim dotrą one do modelu. Samodzielnie hostowane backendy zgodne z OpenAI (vLLM, SGLang, TGI, LM Studio, niestandardowe stosy tokenizatorów Hugging Face) czasami tokenizują literały ciągów, takie jak `<|im_start|>` lub `<|start_header_id|>`, jako strukturalne tokeny szablonu czatu wewnątrz treści użytkownika; bez tego oczyszczania niezaufany tekst na pobranej stronie, w treści wiadomości e-mail lub w wyniku narzędzia odczytującego zawartość pliku mógłby sfałszować syntetyczną granicę roli `assistant`/`system`. Oczyszczanie odbywa się w warstwie opakowywania zawartości zewnętrznej, dlatego jest stosowane jednolicie w narzędziach pobierania/odczytu i przychodzącej zawartości kanałów. Dostawcy hostowani (OpenAI, Anthropic) stosują już własne oczyszczanie po stronie żądań; opakowywanie zawartości zewnętrznej powinno pozostać włączone, a gdy jest to możliwe, należy preferować ustawienia backendu, które rozdzielają lub stosują sekwencje ucieczki dla tokenów specjalnych.

Wychodzące odpowiedzi modelu mają oddzielny mechanizm oczyszczania, który na końcowej granicy dostarczania do kanału usuwa z odpowiedzi widocznych dla użytkownika ujawnione `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` i podobne wewnętrzne elementy pomocnicze.

Nie zastępuje to `dmPolicy`, list dozwolonych, zatwierdzania wykonywania poleceń, piaskownicy ani `contextVisibility` — zamyka jeden konkretny sposób obejścia zabezpieczeń w warstwie tokenizatora.

### Flagi obejścia (pozostawić wyłączone w środowisku produkcyjnym)

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Pole ładunku Cron `allowUnsafeExternalContent`

Należy je włączać tylko tymczasowo na potrzeby ściśle ograniczonego debugowania; po włączeniu należy odizolować tego agenta (piaskownica + minimalny zestaw narzędzi + dedykowana przestrzeń nazw sesji).

Ładunki hooków stanowią niezaufaną zawartość nawet wtedy, gdy są dostarczane z kontrolowanych systemów (zawartość poczty, dokumentów lub stron internetowych może zawierać atak prompt injection). Słabsze klasy modeli zwiększają to ryzyko — w automatyzacji sterowanej hookami należy preferować zaawansowane, nowoczesne klasy modeli i utrzymywać restrykcyjną politykę narzędzi (`tools.profile: "messaging"` lub bardziej restrykcyjną), a także w miarę możliwości używać piaskownicy.

### Rozumowanie i szczegółowe dane wyjściowe w grupach

`/reasoning`, `/verbose` i `/trace` mogą ujawniać wewnętrzne rozumowanie, dane wyjściowe narzędzi lub diagnostykę pluginów, które nie są przeznaczone dla kanału publicznego — mogą obejmować argumenty narzędzi, adresy URL, diagnostykę pluginów i dane widziane przez model. W pokojach publicznych należy pozostawić je wyłączone; można je włączać wyłącznie w zaufanych wiadomościach prywatnych lub ściśle kontrolowanych pokojach.

## Autoryzacja poleceń

Polecenia z ukośnikiem i dyrektywy są respektowane wyłącznie w przypadku autoryzowanych nadawców, ustalanych na podstawie list dozwolonych/parowania kanałów oraz `commands.useAccessGroups` (zobacz [Konfiguracja](/pl/gateway/configuration) i [Polecenia z ukośnikiem](/pl/tools/slash-commands)). Jeśli lista dozwolonych kanału jest pusta lub zawiera `"*"`, polecenia są w praktyce dostępne dla każdego w tym kanale.

`/exec` to udogodnienie tylko dla bieżącej sesji, przeznaczone dla autoryzowanych operatorów — nie zapisuje konfiguracji ani nie zmienia innych sesji.

## Narzędzia płaszczyzny sterowania

Dwa wbudowane narzędzia pozostają wrażliwymi elementami płaszczyzny sterowania:

- `gateway` odczytuje konfigurację za pomocą `config.schema.lookup` / `config.get`. Nie może zapisywać konfiguracji, aktualizować OpenClaw ani ponownie uruchamiać Gateway.
- `cron` tworzy zaplanowane zadania, które działają nadal po zakończeniu pierwotnego czatu/zadania.

Narzędzie `gateway` pozostaje dostępne wyłącznie dla właściciela, ponieważ odczyty konfiguracji mogą ujawniać sekrety i topologię hosta. Agenci żądają trwałych zmian konfiguracji lub cyklu życia za pomocą narzędzia delegowania `openclaw`; OpenClaw odwzorowuje je na typowane operacje i wymaga zatwierdzenia przez człowieka przed ich zastosowaniem. Zobacz [Agent konfiguracji OpenClaw](/cli/openclaw#operations-and-approval).

W przypadku każdego agenta/interfejsu obsługującego niezaufaną zawartość należy domyślnie blokować te narzędzia:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` wyłącza `/restart` i zewnętrzne żądania ponownego uruchomienia `SIGUSR1`. Narzędzie agenta `gateway` nie ma akcji ponownego uruchomienia.

## Wykonywanie na Node (`system.run`)

Jeśli sparowany jest Node macOS, Gateway może wywołać na nim `system.run` — oznacza to zdalne wykonywanie kodu na tym komputerze Mac.

- Wymaga sparowania Node (zatwierdzenie + token). Parowanie ustanawia tożsamość/zaufanie Node i powoduje wydanie tokenu; nie jest mechanizmem zatwierdzania poszczególnych poleceń.
- Gateway stosuje ogólną globalną politykę poleceń Node za pomocą `gateway.nodes.allowCommands` / `denyCommands`. `denyCommands` dopasowuje wyłącznie dokładne nazwy poleceń Node (na przykład `system.run`), a nie tekst powłoki wewnątrz ładunku polecenia — ponownie łączący się Node, który ogłasza inną listę poleceń, sam w sobie nie stanowi luki, jeśli globalna polityka Gateway i własne zatwierdzenia wykonywania poleceń Node nadal egzekwują tę granicę.
- Polityka `system.run` dla konkretnego Node jest własnym plikiem zatwierdzeń wykonywania poleceń tego Node (`exec.approvals.node.*`), kontrolowanym na komputerze Mac za pomocą Settings -> Exec approvals (zabezpieczenia + pytanie + lista dozwolonych); może być bardziej lub mniej restrykcyjna niż globalna polityka identyfikatorów poleceń Gateway.
- Node działający z `security="full"` i `ask="off"` stosuje domyślny model zaufanego operatora — jest to oczekiwane zachowanie, a nie błąd, chyba że wdrożenie wymaga bardziej restrykcyjnego podejścia.
- Tryb zatwierdzania wiąże dokładny kontekst żądania oraz, gdy jest to możliwe, jeden konkretny operand lokalnego skryptu/pliku. Jeśli OpenClaw nie może zidentyfikować dokładnie jednego bezpośredniego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego, wykonanie oparte na zatwierdzeniu zostaje odrzucone zamiast obiecywania pełnego pokrycia semantycznego.
- W przypadku `host=node` uruchomienia oparte na zatwierdzeniu zapisują również kanoniczny, przygotowany `systemRunPlan`; późniejsze zatwierdzone przekazania ponownie wykorzystują ten zapisany plan, a walidacja Gateway odrzuca zmiany kontekstu polecenia/katalogu roboczego/sesji wprowadzone przez wywołującego po utworzeniu żądania zatwierdzenia.
- Aby całkowicie wyłączyć zdalne wykonywanie: ustawić zabezpieczenia na `deny` i usunąć parowanie Node dla tego komputera Mac.

## Dynamiczne Skills (obserwator / zdalne Node)

OpenClaw może odświeżyć listę Skills w trakcie sesji: obserwator Skills aktualizuje migawkę przy następnej turze agenta, gdy zmieni się `SKILL.md`, a połączenie Node macOS może sprawić, że Skills przeznaczone wyłącznie dla macOS staną się dostępne (na podstawie sondowania plików binarnych). Foldery Skills należy traktować jako zaufany kod i ograniczyć możliwość ich modyfikowania.

## Pluginy

Pluginy działają w procesie Gateway — należy traktować je jako zaufany kod.

- Instalować tylko z zaufanych źródeł; preferować jawne listy dozwolonych `plugins.allow`; sprawdzać konfigurację pluginu przed jego włączeniem; ponownie uruchamiać Gateway po zmianach pluginów.
- Instalowanie/aktualizowanie pluginów uruchamia kod wykonywalny:
  - Ścieżką instalacji jest katalog danego pluginu w aktywnym katalogu głównym instalacji pluginów.
  - Pakiety ClawHub oraz dołączony/oficjalny katalog OpenClaw są zaufanymi źródłami. Nowe, dowolne źródło npm, `npm-pack:`, git, lokalna ścieżka/archiwum lub marketplace powoduje wyświetlenie ostrzeżenia przed instalacją; instalacje nieinteraktywne wymagają `--force` po sprawdzeniu źródła i uznaniu go za zaufane. `--force` potwierdza pochodzenie i zezwala na nadpisanie; nie omija `security.installPolicy` ani pozostałych kontroli bezpieczeństwa instalacji. Aktualizacje ponownie wykorzystują wcześniej wybrane źródło.
  - OpenClaw nie uruchamia wbudowanego lokalnego blokowania niebezpiecznego kodu podczas instalacji/aktualizacji. Należy używać `security.installPolicy` do lokalnych decyzji operatora o zezwalaniu/blokowaniu oraz `openclaw security audit --deep` do skanowania diagnostycznego.
  - Instalacje pluginów npm i git przeprowadzają uzgadnianie zależności przez menedżera pakietów wyłącznie podczas jawnego procesu instalacji/aktualizacji. Lokalne ścieżki i archiwa są traktowane jako samowystarczalne pakiety; OpenClaw kopiuje je lub odwołuje się do nich bez uruchamiania `npm install`.
  - Preferować przypięte, dokładne wersje (`@scope/pkg@1.2.3`) i sprawdzać rozpakowany kod przed włączeniem.
  - `--dangerously-force-unsafe-install` jest przestarzałe i nie zmienia już zachowania instalacji/aktualizacji.
  - `security.installPolicy` pozwala operatorom uruchomić zaufane polecenie lokalne w celu podjęcia specyficznych dla hosta decyzji o zezwalaniu/blokowaniu instalacji Skills i pluginów. Jest uruchamiane po przygotowaniu materiału źródłowego, ale przed kontynuacją instalacji, ma zastosowanie również do Skills z ClawHub i nie jest omijane przez przestarzałe flagi niebezpiecznego trybu.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Piaskownica

Dedykowana dokumentacja: [Piaskownica](/pl/gateway/sandboxing)

Dwa uzupełniające się podejścia:

- **Cały Gateway w Dockerze** (granica kontenera): [Docker](/pl/install/docker)
- **Piaskownica narzędzi** (`agents.defaults.sandbox`; Gateway hosta + narzędzia izolowane w piaskownicy; Docker jest domyślnym backendem): [Piaskownica](/pl/gateway/sandboxing)

<Note>
Aby zapobiec dostępowi między agentami, należy zachować ustawienie `agents.defaults.sandbox.scope` na `"agent"` (domyślne) lub użyć `"session"`, aby uzyskać bardziej restrykcyjną izolację poszczególnych sesji. `scope: "shared"` używa jednego kontenera lub obszaru roboczego.
</Note>

Dostęp do obszaru roboczego agenta wewnątrz piaskownicy (`agents.defaults.sandbox.workspaceAccess`):

- `"none"` (domyślnie): narzędzia widzą obszar roboczy piaskownicy w `~/.openclaw/sandboxes`; obszar roboczy agenta jest niedostępny.
- `"ro"`: montuje obszar roboczy agenta tylko do odczytu w `/agent` (wyłącza `write`/`edit`/`apply_patch`).
- `"rw"`: montuje obszar roboczy agenta do odczytu i zapisu w `/workspace`.

Dodatkowe `sandbox.docker.binds` są weryfikowane względem znormalizowanych, kanonizowanych ścieżek źródłowych. Lista blokowanych ścieżek obejmuje `/etc`, `/private/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot` oraz katalogi, które często zawierają gniazdo Docker lub stanowią jego alias (`/run`, `/var/run` i znajdujące się pod nimi `docker.sock`), a także podścieżki poświadczeń w HOME (`.aws`, `.cargo`, `.config`, `.docker`, `.gnupg`, `.netrc`, `.npm`, `.ssh`). Sztuczki z dowiązaniami symbolicznymi katalogów nadrzędnych i kanoniczne aliasy katalogu domowego są rozwiązywane przez istniejące elementy nadrzędne i sprawdzane ponownie, dlatego nadal są domyślnie odrzucane, jeśli prowadzą do zablokowanego katalogu głównego.

<Warning>
`tools.elevated` jest globalnym mechanizmem awaryjnego obejścia bazowych ograniczeń, który uruchamia polecenia poza piaskownicą. Efektywnym hostem jest domyślnie `gateway` lub `node`, gdy cel wykonywania poleceń skonfigurowano jako `node`. Należy utrzymywać restrykcyjne ustawienie `tools.elevated.allowFrom` i nie włączać go dla nieznajomych. Można je dodatkowo ograniczyć dla poszczególnych agentów za pomocą `agents.list[].tools.elevated`. Zobacz [Tryb podwyższonych uprawnień](/pl/tools/elevated).
</Warning>

### Zabezpieczenie delegowania podagentów

Jeśli narzędzia sesji są dozwolone, delegowane uruchomienia podagentów należy traktować jako kolejną decyzję dotyczącą granicy:

- Blokować `sessions_spawn`, chyba że agent rzeczywiście wymaga delegowania.
- Ograniczyć `agents.defaults.subagents.allowAgents` i wszelkie nadpisania `agents.list[].subagents.allowAgents` dla poszczególnych agentów do znanych, bezpiecznych agentów docelowych.
- W przypadku przepływów pracy, które muszą pozostać w piaskownicy, wywoływać `sessions_spawn` z `sandbox: "require"` (wartość domyślna to `"inherit"`); `"require"` natychmiast zgłasza błąd, gdy docelowe środowisko uruchomieniowe procesu podrzędnego nie działa w piaskownicy.

### Tryb tylko do odczytu

Profil tylko do odczytu można utworzyć, łącząc `agents.defaults.sandbox.workspaceAccess: "ro"` (lub `"none"`, aby wyłączyć dostęp do obszaru roboczego) z listami dozwolonych/blokowanych narzędzi, które blokują `write`, `edit`, `apply_patch`, `exec`, `process` itd.

- `tools.exec.applyPatch.workspaceOnly: true` (domyślnie): uniemożliwia `apply_patch` zapisywanie/usuwanie poza katalogiem obszaru roboczego, nawet gdy piaskownica jest wyłączona. Ustawić `false` tylko wtedy, gdy `apply_patch` ma celowo modyfikować pliki poza obszarem roboczym.
- `tools.fs.workspaceOnly: true` (opcjonalnie): ogranicza ścieżki `read`/`write`/`edit`/`apply_patch` oraz ścieżki automatycznego ładowania natywnych obrazów promptów do katalogu obszaru roboczego.
- Katalogi główne systemu plików powinny mieć wąski zakres — należy unikać szerokich katalogów głównych, takich jak katalog domowy, w przypadku obszarów roboczych agenta/piaskownicy, ponieważ mogą one udostępnić narzędziom systemu plików wrażliwe pliki lokalne (na przykład stan/konfigurację w `~/.openclaw`).

## Profile dostępu poszczególnych agentów (wielu agentów)

Każdy agent może mieć własne zasady piaskownicy i narzędzi: pełny dostęp, tylko do odczytu lub brak dostępu. Reguły pierwszeństwa opisano w sekcji [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools).

Typowe wzorce: agent osobisty (pełny dostęp, bez piaskownicy), agent rodzinny/służbowy (w piaskownicy + narzędzia tylko do odczytu), agent publiczny (w piaskownicy + bez narzędzi systemu plików/powłoki).

### Pełny dostęp (bez piaskownicy)

```json5
{
  agents: {
    list: [
      { id: "personal", workspace: "~/.openclaw/workspace-personal", sandbox: { mode: "off" } },
    ],
  },
}
```

### Narzędzia tylko do odczytu + obszar roboczy tylko do odczytu

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Brak dostępu do systemu plików/powłoki (wiadomości dostawcy dozwolone)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          // Narzędzia sesji mogą ujawniać dane transkrypcji. Domyślny zakres obejmuje bieżącą sesję +
          // sesje uruchomionych podagentów; w razie potrzeby można go dodatkowo ograniczyć za pomocą tools.sessions.visibility.
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "discord",
            "slack",
            "telegram",
            "whatsapp",
          ],
          deny: [
            "apply_patch",
            "browser",
            "canvas",
            "cron",
            "edit",
            "exec",
            "gateway",
            "image",
            "nodes",
            "process",
            "read",
            "write",
          ],
        },
      },
    ],
  },
}
```

## Zagrożenia związane ze sterowaniem przeglądarką

Włączenie sterowania przeglądarką zapewnia modelowi dostęp do rzeczywistej przeglądarki. Jeśli ten profil zawiera już zalogowane sesje, model może uzyskać dostęp do tych kont i danych — profile przeglądarki należy traktować jako stan wrażliwy.

- Zaleca się używanie dedykowanego profilu dla agenta (domyślnego profilu `openclaw`); należy unikać osobistego profilu używanego na co dzień.
- Sterowanie przeglądarką hosta powinno pozostać wyłączone dla agentów w piaskownicy, chyba że są zaufani.
- Samodzielny interfejs API sterowania przeglądarką przez pętlę zwrotną obsługuje wyłącznie uwierzytelnianie za pomocą współdzielonego sekretu (uwierzytelnianie tokenem Gateway typu bearer lub hasłem Gateway) — nie korzysta z nagłówków tożsamości zaufanego serwera proxy ani Tailscale Serve.
- Pliki pobierane przez przeglądarkę należy traktować jako niezaufane dane wejściowe; zaleca się używanie odizolowanego katalogu pobierania.
- Jeśli to możliwe, należy wyłączyć synchronizację przeglądarki i menedżery haseł w profilu agenta.
- W przypadku zdalnych Gateway „sterowanie przeglądarką” jest równoważne „dostępowi operatora” do wszystkiego, do czego może uzyskać dostęp dany profil.
- Hosty Gateway i węzłów powinny być dostępne wyłącznie w sieci tailnet; należy unikać udostępniania portów sterowania przeglądarką w sieci LAN lub publicznym internecie.
- Należy wyłączyć trasowanie przez serwer proxy przeglądarki, gdy nie jest potrzebne (`gateway.nodes.browser.mode="off"`).
- Tryb istniejącej sesji Chrome MCP nie jest „bezpieczniejszy” — może działać w imieniu użytkownika w każdym miejscu dostępnym dla profilu Chrome na danym hoście.
- Na komputerze z przeglądarką należy uruchomić **host węzła** i umożliwić Gateway pośredniczenie w działaniach przeglądarki, gdy Gateway znajduje się zdalnie względem przeglądarki (zobacz [Narzędzie przeglądarki](/pl/tools/browser)); parowanie węzłów należy traktować jak dostęp administratora, utrzymywać Gateway i host węzła w tej samej sieci tailnet oraz unikać udostępniania portów przekazywania/sterowania przez sieć LAN, publiczny internet lub Tailscale Funnel.

### Zasady SSRF przeglądarki (domyślnie rygorystyczne)

Prywatne/wewnętrzne miejsca docelowe pozostają zablokowane, dopóki nie zostaną jawnie dozwolone.

- Domyślnie: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest nieustawione, więc prywatne/wewnętrzne/specjalnego przeznaczenia miejsca docelowe pozostają zablokowane. Starszy alias `allowPrivateNetwork` jest nadal obsługiwany.
- Jawne włączenie: należy ustawić `dangerouslyAllowPrivateNetwork: true`, aby zezwolić na te miejsca docelowe.
- W trybie rygorystycznym należy użyć `hostnameAllowlist` (wzorce takie jak `*.example.com`) oraz `allowedHostnames` (dokładne wyjątki hostów, w tym nazwy, które w przeciwnym razie byłyby blokowane, takie jak `localhost`) do definiowania jawnych wyjątków.
- Bezpośrednie żądania nawigacji są sprawdzane wstępnie. Podczas działania i przez ograniczony okres ochronny po jego zakończeniu zabezpieczone interakcje Playwright (kliknięcie, kliknięcie współrzędnych, najechanie, przeciągnięcie, przewijanie, wybór, naciśnięcie, wpisywanie, wypełnienie formularza i wykonanie kodu) przechwytują zabronione przez zasady ładowania dokumentów najwyższego poziomu i podramek przed wysłaniem bajtów żądania HTTP, a następnie w miarę możliwości ponownie sprawdzają końcowy adres URL `http(s)`.
- Przed każdym nowym uruchomieniem zarządzanej przeglądarki Chrome OpenClaw w miarę możliwości wyłącza przewidywanie sieciowe, tłumiąc zaobserwowane spekulacyjne połączenia wstępne Chromium dla zabronionych żądań. Jest to ochrona warstwowa, a nie granica zasad: przeglądarka używana ponownie po restarcie usługi sterującej oraz inne mechanizmy przeglądarek mogą nie korzystać z tego wzmocnienia. Trasowanie stron pozostaje przechwytywaniem na poziomie żądań, a nie zaporą sieciową: kolejne etapy przekierowań, pierwsze żądanie wyskakującego okna, ruch Service Worker, kod strony uruchomiony po upływie ograniczonego okresu ochronnego oraz niektóre ścieżki tła/podzasobów mogą je ominąć. Sprawdzanie końcowego adresu URL pozostaje mechanizmem wykrywania i kwarantanny; pełne zapobieganie wymaga izolacji ruchu wychodzącego po stronie właściciela lub serwera proxy egzekwującego zasady.

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

## Ekspozycja sieciowa

### Powiązanie, port, zapora

Gateway multipleksuje WebSocket + HTTP na jednym porcie (domyślnie `18789`; konfiguracja/flagi/zmienne środowiskowe: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`). Ta powierzchnia HTTP obejmuje interfejs sterowania (zasoby SPA, domyślna ścieżka bazowa `/`) oraz host kanwy (`/__openclaw__/canvas` i `/__openclaw__/a2ui` — dowolny kod HTML/JS; podczas ładowania w zwykłej przeglądarce należy traktować go jako niezaufaną treść; nie należy udostępniać go niezaufanym sieciom/użytkownikom ani współdzielić źródła z uprzywilejowanymi powierzchniami internetowymi).

`gateway.bind` określa, gdzie Gateway nasłuchuje:

- `"loopback"` (domyślnie): łączyć mogą się tylko klienci lokalni.
- `"lan"`, `"tailnet"`, `"custom"`: zwiększają powierzchnię ataku. Należy ich używać wyłącznie z uwierzytelnianiem Gateway (współdzielonym tokenem/hasłem lub prawidłowo skonfigurowanym zaufanym serwerem proxy) i rzeczywistą zaporą.

Ogólne zasady: zaleca się używanie Tailscale Serve zamiast powiązań z siecią LAN (Serve utrzymuje Gateway na interfejsie pętli zwrotnej, a Tailscale obsługuje dostęp); jeśli powiązanie z siecią LAN jest konieczne, należy ograniczyć port zaporą do ścisłej listy dozwolonych źródłowych adresów IP zamiast szeroko przekierowywać port; nigdy nie należy udostępniać nieuwierzytelnionego Gateway na `0.0.0.0`.

### Publikowanie portów Dockera z UFW

Opublikowane porty kontenera (`-p HOST:CONTAINER` lub `ports:` Compose) są trasowane przez łańcuchy przekazywania Dockera, a nie tylko przez reguły hosta `INPUT`. Reguły należy egzekwować w `DOCKER-USER` (ocenianym przed własnymi regułami akceptacji Dockera); większość współczesnych dystrybucji używa interfejsu `iptables-nft`, który nadal stosuje te reguły do mechanizmu nftables.

```bash
# /etc/ufw/after.rules (dołącz jako osobną sekcję *filter)
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

IPv6 ma osobne tablice — jeśli IPv6 Dockera jest włączone, należy dodać odpowiadające zasady w `/etc/ufw/after6.rules`. Należy unikać wpisywania na stałe nazw interfejsów (`eth0`), ponieważ różnią się one między obrazami VPS (`ens3`, `enp*` itd.), a niezgodność może spowodować ciche pominięcie reguły odmowy.

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Oczekiwane porty zewnętrzne powinny obejmować wyłącznie te, które udostępniono celowo (w większości konfiguracji: SSH + porty odwrotnego serwera proxy).

### Wykrywanie mDNS/Bonjour

Gdy wbudowany Plugin `bonjour` jest włączony, Gateway ogłasza swoją obecność przez mDNS (`_openclaw-gw._tcp`, port 5353), umożliwiając wykrywanie urządzeń lokalnych. Tryb pełny obejmuje rekordy TXT ujawniające szczegóły operacyjne: `cliPath` (ścieżka systemu plików ujawniająca nazwę użytkownika i lokalizację instalacji), `sshPort` (ogłasza dostępność SSH), `displayName`/`lanHost` (informacje o nazwie hosta). Rozgłaszanie szczegółów infrastruktury ułatwia rozpoznanie sieci LAN.

- Bonjour powinno pozostać wyłączone, chyba że potrzebne jest wykrywanie w sieci LAN — uruchamia się automatycznie na hostach macOS, a na innych platformach wymaga jawnego włączenia; bezpośrednie adresy URL Gateway, Tailnet, SSH lub rozległy DNS-SD pozwalają uniknąć lokalnego multiemisji.
- **Tryb minimalny** (domyślny po włączeniu Bonjour, zalecany dla udostępnionych Gateway) pomija pola wrażliwe:

  ```json5
  { discovery: { mdns: { mode: "minimal" } } }
  ```

- **Wyłączony** blokuje wykrywanie lokalne, pozostawiając Plugin włączony:

  ```json5
  { discovery: { mdns: { mode: "off" } } }
  ```

- **Tryb pełny** (włączany jawnie) obejmuje `cliPath` + `sshPort`:

  ```json5
  { discovery: { mdns: { mode: "full" } } }
  ```

- Można również ustawić `OPENCLAW_DISABLE_BONJOUR=1`, aby wyłączyć mDNS bez zmian konfiguracji.

W trybie minimalnym Gateway rozgłasza `role`, `gatewayPort`, `transport`, ale pomija `cliPath`/`sshPort`; aplikacje wymagające ścieżki CLI mogą zamiast tego pobrać ją przez uwierzytelnione połączenie WebSocket.

### Uwierzytelnianie WebSocket Gateway

Uwierzytelnianie Gateway jest domyślnie wymagane — jeśli nie skonfigurowano prawidłowej ścieżki uwierzytelniania, Gateway odrzuca połączenia WebSocket (bezpiecznie w razie błędu). Proces wdrażania domyślnie generuje token (nawet dla pętli zwrotnej), dlatego klienci lokalni muszą się uwierzytelnić.

```json5
{ gateway: { auth: { mode: "token", token: "your-token" } } }
```

`openclaw doctor --generate-gateway-token` może wygenerować token.

<Note>
`gateway.remote.token` i `gateway.remote.password` są źródłami poświadczeń klienta — same nie chronią lokalnego dostępu WS. Lokalne ścieżki wywołań używają `gateway.remote.*` wyłącznie jako rozwiązania rezerwowego, gdy `gateway.auth.*` nie jest ustawione. Jeśli `gateway.auth.token` lub `gateway.auth.password` jawnie skonfigurowano za pomocą SecretRef i nie można ich rozwiązać, rozwiązywanie kończy się bezpieczną odmową (bez maskowania przez zdalne rozwiązanie rezerwowe).
</Note>

Podczas używania `wss://` należy przypiąć zdalny certyfikat TLS za pomocą `gateway.remote.tlsFingerprint`. Nieszyfrowane `ws://` jest akceptowane dla pętli zwrotnej, literałów prywatnych adresów IP, `.local` oraz adresów URL Gateway `*.ts.net` w sieci Tailnet; w przypadku innych zaufanych prywatnych nazw DNS należy ustawić `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako rozwiązanie awaryjne (wyłącznie w środowisku procesu, nie jako klucz `openclaw.json`). Parowanie urządzeń mobilnych oraz ręczne/skanowane trasy Gateway w systemie Android są bardziej rygorystyczne: połączenia nieszyfrowane są dozwolone wyłącznie dla pętli zwrotnej, natomiast prywatna sieć LAN, adresy lokalne łącza, `.local` i nazwy hostów bez kropek muszą używać TLS, chyba że jawnie włączono zaufaną ścieżkę nieszyfrowaną sieci prywatnej.

Parowanie urządzeń jest automatycznie zatwierdzane dla bezpośrednich lokalnych połączeń przez pętlę zwrotną (oraz wąsko zdefiniowanej ścieżki samopołączenia lokalnego dla zaplecza/kontenera, używanej przez zaufane przepływy pomocnicze ze współdzielonym sekretem); połączenia przez Tailnet i LAN, w tym połączenia z tego samego hosta na adres tailnet, są traktowane jako zdalne i nadal wymagają zatwierdzenia. Rozwiązany adres `tailnet` lub adres `custom` inny niż `127.0.0.1` albo `0.0.0.0` dodaje osobny nasłuchiwacz `127.0.0.1`; tylko połączenia z tym lokalnym nasłuchiwaczem otrzymują semantykę pętli zwrotnej. Obecność danych z przekazywanych nagłówków w żądaniu pętli zwrotnej wyklucza lokalność pętli zwrotnej; automatyczne zatwierdzanie aktualizacji metadanych ma wąsko ograniczony zakres. Zobacz [Parowanie Gateway](/pl/gateway/pairing).

Tryby uwierzytelniania:

- `"token"`: współdzielony token okaziciela (zalecany w większości konfiguracji).
- `"password"`: zaleca się ustawienie za pomocą `OPENCLAW_GATEWAY_PASSWORD`.
- `"trusted-proxy"`: zaufanie odwrotnemu serwerowi proxy rozpoznającemu tożsamość, który uwierzytelnia użytkowników i przekazuje tożsamość w nagłówkach. Zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).

Lista kontrolna rotacji (token/hasło): wygenerować lub ustawić nowy sekret (`gateway.auth.token` albo `OPENCLAW_GATEWAY_PASSWORD`); ponownie uruchomić Gateway (lub aplikację macOS, jeśli nadzoruje Gateway); zaktualizować klientów zdalnych (`gateway.remote.token`/`.password`); sprawdzić, czy stare dane uwierzytelniające już nie działają.

### Nagłówki tożsamości Tailscale Serve

Gdy `gateway.auth.allowTailscale` ma wartość `true` (domyślną dla Serve), OpenClaw akceptuje nagłówek tożsamości Tailscale Serve `tailscale-user-login` do uwierzytelniania interfejsu Control UI/WebSocket. Weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pośrednictwem lokalnego demona Tailscale (`tailscale whois`) i porównując go z nagłówkiem — mechanizm ten uruchamia się tylko dla żądań z interfejsu pętli zwrotnej zawierających `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`, wstawione przez Tailscale. W przypadku tej kontroli asynchronicznej nieudane próby dla tej samej wartości `{scope, ip}` są serializowane, zanim ogranicznik zarejestruje niepowodzenie, dlatego równoczesne błędne ponowienia z jednego klienta Serve mogą natychmiast zablokować drugą próbę.

Punkty końcowe interfejsu HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*`) nie używają uwierzytelniania za pomocą nagłówka tożsamości Tailscale — korzystają ze skonfigurowanego trybu uwierzytelniania HTTP Gateway.

Uwierzytelnianie HTTP Gateway za pomocą tokenu okaziciela w praktyce zapewnia operatorowi dostęp typu „wszystko albo nic”. Dane uwierzytelniające umożliwiające wywołanie `/v1/chat/completions`, `/v1/responses`, tras pluginów takich jak `/api/v1/admin/rpc` lub `/api/channels/*` są sekretami operatora z pełnym dostępem do tego Gateway: uwierzytelnianie tokenem okaziciela opartym na współdzielonym sekrecie przywraca pełny domyślny zestaw zakresów operatora (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) oraz semantykę właściciela dla tur agenta, a węższe wartości `x-openclaw-scopes` nie ograniczają tej ścieżki współdzielonego sekretu. Semantyka zakresu poszczególnych żądań ma zastosowanie tylko wtedy, gdy żądanie pochodzi z trybu przekazującego tożsamość (uwierzytelnianie przez zaufany serwer proxy) lub jawnie nieuwierzytelnianego prywatnego punktu wejścia; w tych trybach pominięcie `x-openclaw-scopes` powoduje użycie zwykłego domyślnego zestawu zakresów operatora, a nagłówki na poziomie właściciela, takie jak `x-openclaw-model`, wymagają `operator.admin`, gdy zakresy są zawężone. `/tools/invoke` i punkty końcowe historii sesji HTTP podlegają tej samej regule współdzielonego sekretu. Nie należy udostępniać tych danych uwierzytelniających niezaufanym podmiotom wywołującym; zaleca się stosowanie oddzielnych Gateway dla każdej granicy zaufania.

Uwierzytelnianie Serve bez tokenu zakłada, że sam host Gateway jest zaufany — nie chroni przed wrogimi procesami działającymi na tym samym hoście. Jeśli na hoście Gateway może działać niezaufany kod lokalny, należy wyłączyć `allowTailscale` i wymagać jawnego uwierzytelniania współdzielonym sekretem (`token` albo `password`).

Nie należy przekazywać tych nagłówków z własnego odwrotnego serwera proxy. Jeśli protokół TLS jest kończony lub ruch jest przekazywany przez serwer proxy przed Gateway, należy wyłączyć `allowTailscale` i zamiast tego używać uwierzytelniania współdzielonym sekretem albo [uwierzytelniania przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).

Zobacz [Tailscale](/pl/gateway/tailscale) oraz [Omówienie interfejsu internetowego](/pl/web).

### Konfiguracja odwrotnego serwera proxy

Należy ustawić `gateway.trustedProxies`, aby prawidłowo obsługiwać przekazywany adres IP klienta za nginx/Caddy/Traefik itd. Gdy Gateway wykryje nagłówki serwera proxy z adresu, którego **nie ma** w `trustedProxies`, nie potraktuje połączenia jako lokalnego; jeśli uwierzytelnianie Gateway jest wyłączone, połączenie zostanie odrzucone. Zapobiega to pozornemu pochodzeniu połączeń przekazywanych przez serwer proxy z hosta lokalnego i automatycznemu uzyskiwaniu przez nie zaufania.

`trustedProxies` dostarcza również dane do `gateway.auth.mode: "trusted-proxy"`, który jest bardziej rygorystyczny: domyślnie odrzuca żądania w przypadku serwerów proxy ze źródłem w interfejsie pętli zwrotnej. Odwrotne serwery proxy działające na tym samym hoście przez interfejs pętli zwrotnej mogą używać `trustedProxies` do wykrywania klientów lokalnych i obsługi przekazywanych adresów IP, ale mogą spełnić wymagania trybu uwierzytelniania `trusted-proxy` tylko wtedy, gdy `gateway.auth.trustedProxy.allowLoopback = true`; w przeciwnym razie należy użyć uwierzytelniania tokenem/hasłem.

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # adres IP odwrotnego serwera proxy
  allowRealIpFallback: false # domyślnie false; włącz tylko wtedy, gdy serwer proxy nie może udostępnić X-Forwarded-For
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Gdy ustawiono `trustedProxies`, Gateway używa `X-Forwarded-For` do określania adresu IP klienta; `X-Real-IP` jest ignorowane, chyba że jawnie ustawiono `gateway.allowRealIpFallback: true`. Należy dopilnować, aby serwer proxy **nadpisywał** `X-Forwarded-For`/`X-Real-IP`, zamiast dołączać do nich wartości:

```nginx
# poprawnie
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;

# niepoprawnie: zachowuje/dołącza niezaufane wartości dostarczone przez klienta
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Nagłówki zaufanego serwera proxy nie powodują automatycznego uznania parowania urządzenia Node za zaufane — `gateway.nodes.pairing.autoApproveCidrs` to oddzielna zasada operatora, domyślnie wyłączona, a ścieżki nagłówków zaufanego serwera proxy ze źródłem w interfejsie pętli zwrotnej pozostają wyłączone z automatycznego zatwierdzania Node nawet wtedy, gdy włączone jest uwierzytelnianie zaufanego serwera proxy przez interfejs pętli zwrotnej (ponieważ lokalne podmioty wywołujące mogą fałszować te nagłówki).

### Uwagi dotyczące HSTS i źródła

- Gateway OpenClaw jest przeznaczony przede wszystkim do działania lokalnego/przez interfejs pętli zwrotnej. Jeśli protokół TLS jest kończony na odwrotnym serwerze proxy, należy tam ustawić HSTS.
- Jeśli sam Gateway kończy połączenie HTTPS, `gateway.http.securityHeaders.strictTransportSecurity` powoduje emitowanie nagłówka HSTS w odpowiedziach OpenClaw.
- Wdrożenia interfejsu Control UI poza interfejsem pętli zwrotnej domyślnie wymagają `gateway.controlUi.allowedOrigins`; `allowedOrigins: ["*"]` jest jawną zasadą zezwalającą na wszystkie źródła, a nie zabezpieczonym ustawieniem domyślnym — należy jej unikać poza ściśle kontrolowanymi testami lokalnymi.
- Niepowodzenia uwierzytelniania źródła przeglądarki przez interfejs pętli zwrotnej nadal podlegają ograniczeniu częstotliwości, nawet gdy włączone jest ogólne wyłączenie dla interfejsu pętli zwrotnej, ale klucz blokady jest określany osobno dla każdej znormalizowanej wartości `Origin`, zamiast korzystać z jednego współdzielonego zasobnika hosta lokalnego.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb rezerwowego określania źródła na podstawie nagłówka Host; należy traktować go jako niebezpieczną zasadę wybraną przez operatora.
- Ponowne wiązanie DNS oraz zachowanie nagłówka hosta serwera proxy należy traktować jako kwestie związane z zabezpieczeniem wdrożenia; należy ściśle ograniczyć `trustedProxies` i unikać bezpośredniego udostępniania Gateway w publicznym internecie.
- Szczegółowe wskazówki dotyczące wdrażania: [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts).

### Control UI przez HTTP

Interfejs Control UI wymaga bezpiecznego kontekstu (HTTPS lub localhost), aby wygenerować tożsamość urządzenia.

- `gateway.controlUi.allowInsecureAuth`: lokalny przełącznik zgodności. Na localhost umożliwia uwierzytelnianie interfejsu Control UI bez tożsamości urządzenia, gdy strona jest ładowana przez niezabezpieczony protokół HTTP. Nie omija kontroli parowania ani nie łagodzi wymagań dotyczących tożsamości urządzeń zdalnych (innych niż localhost). Zaleca się użycie HTTPS (Tailscale Serve) lub otwarcie interfejsu pod adresem `127.0.0.1`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth`: wyłącznie jako mechanizm awaryjny; całkowicie wyłącza sprawdzanie tożsamości urządzeń. Poważne obniżenie poziomu bezpieczeństwa; należy pozostawić wyłączone, chyba że aktywnie trwa debugowanie i możliwe jest szybkie przywrócenie ustawienia.
- Niezależnie od tych flag pomyślne `gateway.auth.mode: "trusted-proxy"` może zezwolić na sesje interfejsu Control UI **operatora** bez tożsamości urządzenia — jest to zamierzone zachowanie trybu uwierzytelniania, a nie skrót `allowInsecureAuth`, i nie obejmuje sesji interfejsu Control UI z rolą Node.

`openclaw security audit` wyświetla ostrzeżenie, gdy włączono `allowInsecureAuth`.

### Niezabezpieczone/niebezpieczne flagi

`openclaw security audit` zgłasza `config.insecure_or_dangerous_flags` dla każdego włączonego znanego niezabezpieczonego/niebezpiecznego przełącznika debugowania (jedno wykrycie na flagę). W środowisku produkcyjnym należy pozostawić je nieustawione. Jeśli skonfigurowano wyciszenia audytu, `security.audit.suppressions.active` pozostaje w aktywnych wynikach nawet wtedy, gdy pasujące wykrycia zostaną przeniesione do `suppressedFindings`.

<AccordionGroup>
  <Accordion title="Flagi obecnie śledzone przez audyt">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Wszystkie klucze dangerous*/dangerously* w schemacie konfiguracji">
    Control UI i przeglądarka:
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Dopasowywanie nazw kanałów (kanały wbudowane i kanały pluginów; również dla poszczególnych `accounts.<accountId>`, jeśli ma zastosowanie):
    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.irc.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.mattermost.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.synology-chat.dangerouslyAllowNameMatching` (kanał pluginu)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (kanał pluginu)
    - `channels.zalouser.dangerouslyAllowNameMatching` (kanał pluginu)

    Ekspozycja sieciowa:
    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (również dla poszczególnych kont)

    Docker piaskownicy (ustawienia domyślne i dla poszczególnych agentów):
    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Zaufanie do wdrożenia i hosta

- Pełne szyfrowanie dysku na hoście Gateway; jeśli host jest współdzielony, zaleca się użycie dedykowanego konta użytkownika systemu operacyjnego dla Gateway.
- Blokada zależności opublikowanego pakietu: kopie robocze kodu źródłowego używają `pnpm-lock.yaml`; opublikowany pakiet npm `openclaw` oraz należące do OpenClaw pakiety pluginów npm zawierają `npm-shrinkwrap.json`, dzięki czemu instalacje używają sprawdzonego przechodniego grafu zależności z wydania, zamiast rozwiązywać nowy graf podczas instalacji. Jest to granica wzmacniająca bezpieczeństwo łańcucha dostaw i odtwarzalność wydań, a nie piaskownica — zobacz [npm shrinkwrap](/pl/gateway/security/shrinkwrap).
- Bezpieczne operacje na plikach: OpenClaw używa `@openclaw/fs-safe` do dostępu do plików ograniczonego do katalogu głównego, niepodzielnych zapisów, wyodrębniania archiwów, tymczasowych przestrzeni roboczych i funkcji pomocniczych plików sekretów. Opcjonalna funkcja pomocnicza POSIX w Pythonie jest domyślnie **wyłączona**; `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` lub `require` należy ustawić tylko wtedy, gdy wymagane jest dodatkowe zabezpieczenie mutacji względem deskryptora pliku i dostępne jest środowisko uruchomieniowe Pythona. Szczegóły: [Bezpieczne operacje na plikach](/pl/gateway/security/secure-file-operations).
- Ryzyko współdzielonej przestrzeni roboczej Slack: jeśli każdy użytkownik Slack może wysyłać wiadomości do bota, głównym zagrożeniem są delegowane uprawnienia narzędzi — każdy dozwolony nadawca może wywołać użycie narzędzi (`exec`, przeglądarki, narzędzi sieciowych/plikowych) w granicach zasad agenta, wstrzyknięcie polecenia lub treści przez jednego nadawcę może wpłynąć na współdzielony stan, urządzenia lub wyniki, a jeśli współdzielony agent ma dostęp do poufnych danych uwierzytelniających lub plików, każdy dozwolony nadawca może potencjalnie doprowadzić do wyprowadzenia danych za pomocą narzędzi. W przepływach pracy zespołu należy używać oddzielnych agentów/Gateway z minimalnym zestawem narzędzi; agenty z danymi osobowymi powinny pozostać prywatne.
- Agent współdzielony w firmie (dopuszczalny wzorzec): jest odpowiedni, gdy wszystkie osoby korzystające z agenta należą do tej samej granicy zaufania (na przykład do jednego zespołu firmowego), a zakres działania agenta jest ściśle biznesowy. Należy uruchomić go na dedykowanej maszynie/maszynie wirtualnej/w kontenerze, używać dedykowanego użytkownika systemu operacyjnego oraz dedykowanej przeglądarki/profilu/kont, a także nie logować tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili menedżera haseł/przeglądarki. Łączenie tożsamości osobistych i firmowych w tym samym środowisku uruchomieniowym znosi separację i zwiększa ryzyko ujawnienia danych osobowych.

## Sekrety na dysku

Należy założyć, że wszystko w `~/.openclaw/` (lub `$OPENCLAW_STATE_DIR/`) może zawierać sekrety albo dane prywatne:

| Ścieżka                                        | Zawartość                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.json`                             | Konfiguracja może zawierać tokeny (Gateway, zdalny Gateway), ustawienia dostawców i listy dozwolonych.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `credentials/**`                             | Dane uwierzytelniające kanałów (na przykład dane uwierzytelniające WhatsApp), listy dozwolonych parowania, importy ze starszej wersji OAuth.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `agents/<agentId>/agent/auth-profiles.json`                             | Klucze API, profile tokenów, tokeny OAuth, opcjonalnie `keyRef`/`tokenRef`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `agents/<agentId>/agent/codex-home/**`                             | Konto serwera aplikacji Codex dla poszczególnych agentów, konfiguracja, umiejętności, pluginy, natywny stan wątków, diagnostyka (domyślnie).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `$CODEX_HOME/**` lub `~/.codex/**`      | Natywny stan środowiska uruchomieniowego Codex. Standardowa uprząż uzyskuje do niego dostęp tylko z jawnym ustawieniem `plugins.entries.codex.config.appServer.homeScope: "user"`. Oddzielne połączenie nadzorcze uzyskuje do niego dostęp, gdy jego ustalony zakres katalogu domowego to `"user"`, co jest wartością domyślną dla stdio lub Unix, jeśli nie ustawiono tej opcji. Zawiera natywne konto Codex, konfigurację, pluginy i magazyn wątków. Nadzór wyświetla metadane źródłowe i zachowuje kanoniczną natywną gałąź kontynuowanego czatu oraz późniejsze tury w tym połączeniu; rozgałęzienie kopiuje ograniczoną utrwaloną historię użytkownika i asystenta do uwierzytelnionego czatu OpenClaw z zablokowanym modelem. Włączać tylko w przypadku Gateway kontrolowanego przez właściciela. Zobacz [uprząż Codex](/pl/plugins/codex-harness#share-threads-with-codex-desktop-and-cli) i [nadzór Codex](/plugins/codex-supervision). |
| `secrets.json` (opcjonalnie)               | Przechowywany w pliku ładunek danych poufnych używany przez dostawców SecretRef `file` (`secrets.providers`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `agents/<agentId>/agent/auth.json`                             | Plik zgodności ze starszymi wersjami; statyczne wpisy `api_key` są usuwane po wykryciu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `agents/<agentId>/agent/openclaw-agent.sqlite`                             | Stan środowiska uruchomieniowego poszczególnych agentów, w tym rekordy sesji i transkrypcje, które mogą zawierać prywatne wiadomości oraz dane wyjściowe narzędzi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `agents/<agentId>/sessions/**`                             | Źródła migracji i archiwa starszych sesji, które mogą zawierać prywatne wiadomości oraz dane wyjściowe narzędzi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| pakiety dołączonych pluginów                   | Zainstalowane pluginy (wraz z ich `node_modules/`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `sandboxes/**`                             | Obszary robocze piaskownicy narzędzi; mogą gromadzić kopie plików odczytywanych lub zapisywanych w piaskownicy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Mapa przechowywania danych uwierzytelniających

Przydatna również przy podejmowaniu decyzji dotyczących kopii zapasowych:

- WhatsApp: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Token bota Telegram: konfiguracja/zmienna środowiskowa lub `channels.telegram.tokenFile` (wyłącznie zwykły plik; dowiązania symboliczne są odrzucane)
- Token bota Discord: konfiguracja/zmienna środowiskowa lub SecretRef (dostawcy env/file/exec)
- Tokeny Slack: konfiguracja/zmienna środowiskowa (`channels.slack.*`)
- Listy dozwolonych parowania: `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne) / `<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import ze starszej wersji OAuth: `~/.openclaw/credentials/oauth.json`

Wzmocnienie zabezpieczeń: należy stosować restrykcyjne uprawnienia (`700` dla katalogów, `600` dla plików), używać szyfrowania całego dysku na hoście Gateway i preferować dedykowane konto użytkownika systemu operacyjnego, jeśli host jest współdzielony.

### Uprawnienia plików

- `~/.openclaw/openclaw.json`: `600` (tylko odczyt/zapis przez użytkownika)
- `~/.openclaw`: `700` (tylko użytkownik)

`openclaw doctor` może ostrzegać i proponować zaostrzenie tych uprawnień.

### Pliki `.env` obszaru roboczego

OpenClaw wczytuje lokalne dla obszaru roboczego pliki `.env` na potrzeby agentów i narzędzi, ale nigdy nie pozwala im niejawnie zastępować mechanizmów sterowania środowiskiem uruchomieniowym Gateway:

- Zmienne środowiskowe z poświadczeniami dostawców są blokowane w plikach `.env` niezaufanego obszaru roboczego — na przykład `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` oraz klucze uwierzytelniania dostawców zadeklarowane przez zainstalowane zaufane pluginy. Zamiast tego poświadczenia dostawców należy umieścić w środowisku procesu Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), bloku `env` konfiguracji lub opcjonalnym imporcie z powłoki logowania.
- Każdy klucz zaczynający się od `OPENCLAW_` jest blokowany w plikach `.env` niezaufanego obszaru roboczego, co rezerwuje całą przestrzeń nazw środowiska uruchomieniowego, aby przyszła kontrolka `OPENCLAW_*` była domyślnie zamknięta w razie awarii, zamiast umożliwiać jej niejawne dziedziczenie z zatwierdzonej w repozytorium lub dostarczonej przez atakującego zawartości `.env`.
- Ustawienia routingu punktów końcowych kanałów i dostawców są również blokowane w nadpisaniach `.env` obszaru roboczego (na przykład `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`, `AZURE_SPEECH_ENDPOINT` oraz inne klucze kończące się na `_ENDPOINT`), aby sklonowany obszar roboczy nie mógł przekierować ruchu wbudowanych konektorów przez lokalną konfigurację punktów końcowych. Muszą one pochodzić ze środowiska procesu Gateway, globalnego pliku dotenv środowiska uruchomieniowego, jawnej konfiguracji lub `env.shellEnv`.
- Zaufane zmienne środowiskowe procesu/systemu operacyjnego, globalny plik dotenv środowiska uruchomieniowego, `env` konfiguracji oraz włączony import z powłoki logowania nadal mają zastosowanie — ograniczenie dotyczy wyłącznie wczytywania plików `.env` obszaru roboczego.

Pliki `.env` obszaru roboczego często znajdują się obok kodu agenta, są przypadkowo zatwierdzane w repozytorium lub zapisywane przez narzędzia; blokowanie poświadczeń dostawców uniemożliwia sklonowanemu obszarowi roboczemu podstawienie kont dostawców kontrolowanych przez atakującego.

### Dzienniki i transkrypcje

OpenClaw przechowuje transkrypcje sesji na dysku w katalogu `~/.openclaw/agents/<agentId>/sessions/*.jsonl` na potrzeby ciągłości sesji i opcjonalnego indeksowania pamięci — każdy proces lub użytkownik z dostępem do systemu plików może je odczytać. Dostęp do dysku należy traktować jako granicę zaufania i ograniczyć uprawnienia do `~/.openclaw`; w celu uzyskania silniejszej izolacji należy uruchamiać agentów jako oddzielnych użytkowników systemu operacyjnego lub na oddzielnych hostach.

Dzienniki Gateway mogą zawierać podsumowania narzędzi, błędy i adresy URL; transkrypcje sesji mogą zawierać wklejone sekrety, zawartość plików, dane wyjściowe poleceń i linki.

- Należy pozostawić włączoną redakcję dzienników i transkrypcji (`logging.redactSensitive: "tools"`, domyślnie).
- Należy dodać niestandardowe wzorce dla danego środowiska za pomocą `logging.redactPatterns` (tokeny, nazwy hostów, wewnętrzne adresy URL).
- Podczas udostępniania danych diagnostycznych należy preferować `openclaw status --all` (możliwe do wklejenia, z ukrytymi sekretami) zamiast surowych dzienników.
- Jeśli długie przechowywanie nie jest potrzebne, należy usuwać stare transkrypcje sesji i pliki dzienników.

Szczegóły: [Rejestrowanie](/pl/gateway/logging)

## Bezpieczna konfiguracja bazowa (do skopiowania i wklejenia)

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

Dzięki temu Gateway pozostaje prywatny, wymagane jest parowanie wiadomości prywatnych, a boty grupowe nie działają bez przerwy. Aby zwiększyć także bezpieczeństwo wykonywania narzędzi, należy dodać piaskownicę i zabronić niebezpiecznych narzędzi każdemu agentowi niebędącemu właścicielem (zobacz „Profile dostępu poszczególnych agentów” powyżej).

### Oddzielne numery (WhatsApp, Signal, Telegram)

W przypadku kanałów opartych na numerach telefonów warto uruchomić asystenta na numerze innym niż osobisty, aby prywatne rozmowy pozostały poufne, a numer bota obsługiwał automatyzację we własnych granicach.

## Reagowanie na incydenty

### Ograniczenie skutków

1. Zatrzymanie działania: należy zatrzymać aplikację macOS (jeśli nadzoruje Gateway) lub zakończyć proces `openclaw gateway`.
2. Zamknięcie dostępu: należy ustawić `gateway.bind: "loopback"` (lub wyłączyć Tailscale Funnel/Serve) do czasu wyjaśnienia zdarzenia.
3. Zablokowanie dostępu: należy przełączyć ryzykowne wiadomości prywatne/grupy na `dmPolicy: "disabled"` / wymagać wzmianek oraz usunąć wszystkie wpisy `"*"` zezwalające wszystkim.

### Rotacja (w razie wycieku sekretów należy założyć naruszenie zabezpieczeń)

1. Należy zmienić dane uwierzytelniające Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) i uruchomić go ponownie.
2. Należy zmienić sekrety klientów zdalnych (`gateway.remote.token` / `.password`) na każdym komputerze, który może wywoływać Gateway.
3. Należy zmienić poświadczenia dostawców/API (poświadczenia WhatsApp, tokeny Slack/Discord, klucze modelu/API w `auth-profiles.json` oraz wartości zaszyfrowanych ładunków sekretów, jeśli są używane).

### Audyt

1. Należy sprawdzić dzienniki Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (lub `logging.file`).
2. Należy przejrzeć odpowiednie transkrypcje: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Należy przejrzeć ostatnie zmiany konfiguracji, które mogły rozszerzyć dostęp: `gateway.bind`, `gateway.auth`, zasady wiadomości prywatnych/grup, `tools.elevated`, zmiany pluginów.
4. Należy ponownie uruchomić `openclaw security audit --deep` i potwierdzić usunięcie krytycznych problemów.

### Dane do zgłoszenia

- Znacznik czasu, system operacyjny hosta Gateway i wersja OpenClaw.
- Transkrypcje sesji i krótki fragment końcowy dziennika (po redakcji).
- Co wysłał atakujący i co zrobił agent.
- Czy Gateway był dostępny poza interfejsem loopback (LAN/Tailscale Funnel/Serve).

## Skanowanie sekretów

CI uruchamia w całym repozytorium hak pre-commit `detect-private-key`. Jeśli zakończy się on niepowodzeniem, należy usunąć lub zmienić zatwierdzony materiał klucza, a następnie odtworzyć problem lokalnie:

```bash
pre-commit run --all-files detect-private-key
```

## Zgłaszanie problemów z bezpieczeństwem

Znaleziono lukę w zabezpieczeniach OpenClaw? Należy zgłosić ją w sposób odpowiedzialny:

1. E-mail: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Nie należy publikować informacji przed usunięciem luki.
3. Autor zgłoszenia zostanie wymieniony (chyba że woli zachować anonimowość).
