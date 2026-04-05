---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Stan obsługi, możliwości i konfiguracja bota Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T13:47:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Porzućcie wszelką nadzieję, wy, którzy tu wchodzicie.”

Zaktualizowano: 2026-01-21

Stan: obsługiwane są tekst + załączniki DM; wysyłanie plików do kanałów/grup wymaga `sharePointSiteId` + uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek rozpoczynających się od pliku.

## Bundled plugin

Microsoft Teams jest dostarczany jako bundled plugin w bieżących wydaniach OpenClaw, więc w standardowym spakowanym buildzie nie jest wymagana osobna instalacja.

Jeśli używasz starszego builda lub niestandardowej instalacji bez bundled Teams,
zainstaluj go ręcznie:

```bash
openclaw plugins install @openclaw/msteams
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Plugins](/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Microsoft Teams jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + client secret + tenant ID).
3. Skonfiguruj OpenClaw przy użyciu tych poświadczeń.
4. Udostępnij `/api/messages` (domyślnie port 3978) przez publiczny URL lub tunel.
5. Zainstaluj pakiet aplikacji Teams i uruchom gateway.

Minimalna konfiguracja:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Uwaga: czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi w grupach, ustaw `channels.msteams.groupAllowFrom` (lub użyj `groupPolicy: "open"`, aby zezwolić każdemu członkowi, z bramkowaniem wzmianką).

## Cele

- Rozmawiać z OpenClaw przez DM-y Teams, czaty grupowe lub kanały.
- Zachować deterministyczne routowanie: odpowiedzi zawsze wracają do kanału, z którego przyszły.
- Domyślnie stosować bezpieczne zachowanie kanału (wzmianki wymagane, chyba że skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz przez:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM-y + grupy)

**Dostęp DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do momentu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- UPN-y/nazwy wyświetlane są zmienne; bezpośrednie dopasowanie jest domyślnie wyłączone i włączane tylko przez `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy na identyfikatory przez Microsoft Graph, jeśli poświadczenia na to pozwalają.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (zablokowane, dopóki nie dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wywoływać działanie w czatach grupowych/kanałach (zapasowo używa `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić każdemu członkowi (domyślnie nadal z bramkowaniem wzmianką).
- Aby nie zezwalać na **żadne kanały**, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlista kanałów**

- Ogranicz odpowiedzi w grupach/kanałach, podając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów zespołów i identyfikatorów konwersacji kanałów.
- Gdy `groupPolicy="allowlist"` i obecna jest allowlista zespołów, akceptowane są tylko wymienione zespoły/kanały (z bramkowaniem wzmianką).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Przy uruchamianiu OpenClaw rozwiązuje nazwy zespołów/kanałów i użytkowników z allowlisty na identyfikatory (gdy pozwalają na to uprawnienia Graph)
  i zapisuje mapowanie w logach; nierozwiązane nazwy zespołów/kanałów są zachowywane tak, jak zostały wpisane, ale domyślnie ignorowane przy routowaniu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Jak to działa

1. Upewnij się, że plugin Microsoft Teams jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + secret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla DM-ów).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub przez zmienne środowiskowe) i uruchom gateway.
6. Gateway domyślnie nasłuchuje ruchu webhook Bot Framework pod adresem `/api/messages`.

## Konfiguracja Azure Bot (wymagania wstępne)

Przed skonfigurowaniem OpenClaw musisz utworzyć zasób Azure Bot.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                 |
   | ------------------ | ------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                         |
   | **Resource group** | Utwórz nową lub użyj istniejącej                        |
   | **Pricing tier**   | **Free** do developmentu/testów                         |
   | **Type of App**    | **Single Tenant** (zalecane — patrz uwaga poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                         |

> **Powiadomienie o wycofaniu:** Tworzenie nowych botów wielodostępnych zostało wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.

3. Kliknij **Review + create** → **Create** (poczekaj ~1-2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twoje `appId`
3. Kliknij **Manage Password** → przejdź do App Registration
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twoje `tenantId`

### Krok 3: Skonfiguruj Messaging Endpoint

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL webhooka:
   - Produkcja: `https://your-domain.com/api/messages`
   - Local dev: użyj tunelu (zobacz [Local Development](#local-development-tunneling) poniżej)

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj Terms of Service

## Local Development (tunelowanie)

Teams nie może połączyć się z `localhost`. Użyj tunelu do local developmentu:

**Opcja A: ngrok**

```bash
ngrok http 3978
# Skopiuj URL https, np. https://abc123.ngrok.io
# Ustaw messaging endpoint na: https://abc123.ngrok.io/api/messages
```

**Opcja B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Użyj swojego URL Tailscale Funnel jako messaging endpoint
```

## Teams Developer Portal (alternatywa)

Zamiast ręcznie tworzyć ZIP manifestu, możesz użyć [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Kliknij **+ New app**
2. Wypełnij podstawowe informacje (nazwa, opis, informacje o deweloperze)
3. Przejdź do **App features** → **Bot**
4. Wybierz **Enter a bot ID manually** i wklej App ID swojego Azure Bot
5. Zaznacz zakresy: **Personal**, **Team**, **Group Chat**
6. Kliknij **Distribute** → **Download app package**
7. W Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wybierz ZIP

To często jest łatwiejsze niż ręczna edycja manifestów JSON.

## Testowanie bota

**Opcja A: Azure Web Chat (najpierw zweryfikuj webhook)**

1. W Azure Portal → zasób Azure Bot → **Test in Web Chat**
2. Wyślij wiadomość — powinieneś zobaczyć odpowiedź
3. To potwierdza, że endpoint webhooka działa przed konfiguracją Teams

**Opcja B: Teams (po instalacji aplikacji)**

1. Zainstaluj aplikację Teams (sideload lub katalog organizacji)
2. Znajdź bota w Teams i wyślij DM
3. Sprawdź logi gateway pod kątem przychodzącej aktywności

## Konfiguracja (minimalna, tylko tekst)

1. **Upewnij się, że plugin Microsoft Teams jest dostępny**
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie:
     - Z npm: `openclaw plugins install @openclaw/msteams`
     - Z lokalnego checkouta: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Rejestracja bota**
   - Utwórz Azure Bot (zobacz wyżej) i zanotuj:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Manifest aplikacji Teams**
   - Dodaj wpis `bot` z `botId = <App ID>`.
   - Zakresy: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (wymagane do obsługi plików w zakresie osobistym).
   - Dodaj uprawnienia RSC (poniżej).
   - Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
   - Spakuj wszystkie trzy pliki razem: `manifest.json`, `outline.png`, `color.png`.

4. **Skonfiguruj OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Możesz też użyć zmiennych środowiskowych zamiast kluczy konfiguracji:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint bota**
   - Ustaw Azure Bot Messaging Endpoint na:
     - `https://<host>:3978/api/messages` (lub wybraną przez Ciebie ścieżkę/port).

6. **Uruchom gateway**
   - Kanał Teams uruchamia się automatycznie, gdy bundled plugin lub ręcznie zainstalowany plugin jest dostępny i istnieje konfiguracja `msteams` z poświadczeniami.

## Akcja informacji o członku

OpenClaw udostępnia opartą na Graph akcję `member-info` dla Microsoft Teams, aby agenci i automatyzacje mogli bezpośrednio z Microsoft Graph rozwiązywać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola).

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już zawarte w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` z consentem administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje liczbę ostatnich wiadomości kanału/grupy opakowywanych do promptu.
- Zapasowo używa `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana przez allowlisty nadawców (`allowFrom` / `groupAllowFrom`), więc zasiewanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Cytowany kontekst załączników (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany tak, jak został odebrany.
- Innymi słowy, allowlisty kontrolują, kto może wywołać agenta; obecnie filtrowane są tylko konkretne dodatkowe ścieżki kontekstu.
- Historię DM można ograniczyć przez `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania per użytkownik: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia Teams RSC (manifest)

To są **istniejące resourceSpecific permissions** w naszym manifeście aplikacji Teams. Obowiązują tylko w zespole/czacie, gdzie aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbieranie wszystkich wiadomości kanałowych bez @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) - odbieranie wszystkich wiadomości czatu grupowego bez @mention

## Przykładowy manifest Teams (zredagowany)

Minimalny, poprawny przykład z wymaganymi polami. Zastąp identyfikatory i URL-e.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Zastrzeżenia dotyczące manifestu (pola obowiązkowe)

- `bots[].botId` **musi** odpowiadać Azure Bot App ID.
- `webApplicationInfo.id` **musi** odpowiadać Azure Bot App ID.
- `bots[].scopes` musi zawierać powierzchnie, których chcesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia odczytu/wysyłania kanałowego, jeśli chcesz obsługiwać ruch kanałowy.

### Aktualizacja istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. w celu dodania uprawnień RSC):

1. Zaktualizuj `manifest.json`, dodając nowe ustawienia
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Spakuj ponownie** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy zip:
   - **Opcja A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → znajdź swoją aplikację → Upload new version
   - **Opcja B (Sideload):** w Teams → Apps → Manage your apps → Upload a custom app
5. **Dla kanałów zespołowych:** zainstaluj ponownie aplikację w każdym zespole, aby nowe uprawnienia zaczęły działać
6. **Całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić cache metadanych aplikacji

## Możliwości: tylko RSC vs Graph

### Z **samym Teams RSC** (aplikacja zainstalowana, bez uprawnień Graph API)

Działa:

- Odczyt treści **tekstowej** wiadomości kanałowych.
- Wysyłanie **tekstowej** treści wiadomości kanałowych.
- Odbieranie załączników plikowych w **osobistych (DM)**.

NIE działa:

- Zawartość **obrazów lub plików** w kanałach/grupach (payload zawiera tylko HTML stub).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza zdarzeniem webhooka na żywo).

### Z **Teams RSC + uprawnieniami aplikacyjnymi Microsoft Graph**

Dodaje:

- Pobieranie hostowanych treści (obrazów wklejonych do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanałów/czatów przez Graph.

### RSC vs Graph API

| Możliwość               | Uprawnienia RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez webhook) | Nie (tylko polling)                 |
| **Wiadomości historyczne** | Nie                | Tak (można odpytywać historię)      |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga consentu administratora + przepływu tokena |
| **Działa offline**      | Nie (musi działać)   | Tak (zapytanie w dowolnym momencie) |

**Podsumowanie:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić wiadomości pominięte podczas offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga consentu administratora).

## Media + historia z włączonym Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i przyznać consent administratora.

1. W Entra ID (Azure AD) **App Registration** dodaj uprawnienia aplikacyjne Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałowe + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Przyznaj consent administratora** dla tenant.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj aplikację ponownie w Teams**.
4. **Całkowicie zamknij i uruchom ponownie Teams**, aby wyczyścić cache metadanych aplikacji.

**Dodatkowe uprawnienie dla wzmiankowania użytkowników:** Wzmianki @ użytkowników działają od razu dla użytkowników obecnych w konwersacji. Jeśli jednak chcesz dynamicznie wyszukiwać i wzmiankować użytkowników, którzy **nie są w bieżącej konwersacji**, dodaj uprawnienie aplikacyjne `User.Read.All` i przyznaj consent administratora.

## Znane ograniczenia

### Timeouty webhooków

Teams dostarcza wiadomości przez webhook HTTP. Jeśli przetwarzanie trwa zbyt długo (np. wolne odpowiedzi LLM), możesz zobaczyć:

- Timeouty gateway
- Ponawianie wiadomości przez Teams (powodujące duplikaty)
- Utracone odpowiedzi

OpenClaw obsługuje to, szybko zwracając odpowiedź i wysyłając odpowiedzi proaktywnie, ale bardzo wolne odpowiedzi mogą nadal powodować problemy.

### Formatowanie

Markdown Teams jest bardziej ograniczony niż w Slack lub Discord:

- Podstawowe formatowanie działa: **pogrubienie**, _kursywa_, `code`, linki
- Złożony Markdown (tabele, zagnieżdżone listy) może nie renderować się poprawnie
- Adaptive Cards są obsługiwane dla ankiet i dowolnych wysyłek kart (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów):

- `channels.msteams.enabled`: włącz/wyłącz kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: poświadczenia bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: allowlista DM (zalecane identyfikatory obiektów AAD). Kreator rozwiązuje nazwy na identyfikatory podczas konfiguracji, gdy dostępny jest Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny do ponownego włączenia dopasowywania zmiennych UPN-ów/nazw wyświetlanych oraz bezpośredniego routowania po nazwie zespołu/kanału.
- `channels.msteams.textChunkLimit`: rozmiar chunków tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed chunkowaniem po długości.
- `channels.msteams.mediaAllowHosts`: allowlista hostów dla przychodzących załączników (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlista hostów, dla których dołączane są nagłówki Authorization przy ponownych próbach pobierania mediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymagaj @mention w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania polityki narzędzi per zespół (`allow`/`deny`/`alsoAllow`) używane, gdy brak nadpisania kanałowego.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania polityki narzędzi per nadawca dla zespołu (obsługiwany wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania polityki narzędzi per kanał (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania polityki narzędzi per nadawca dla kanału (obsługiwany wildcard `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują tylko do `id:`).
- `channels.msteams.actions.memberInfo`: włącz lub wyłącz opartą na Graph akcję informacji o członku (domyślnie: włączona, gdy dostępne są poświadczenia Graph).
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint do przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routowanie i sesje

- Klucze sesji mają standardowy format agenta (zobacz [/concepts/session](/concepts/session)):
  - Wiadomości bezpośrednie współdzielą główną sesję (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałowe/grupowe używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki vs posty

Teams niedawno wprowadził dwa style UI kanałów na tym samym bazowym modelu danych:

| Styl                     | Opis                                                      | Zalecane `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Posts** (klasyczny)    | Wiadomości pojawiają się jako karty z odpowiedziami w wątku pod spodem | `thread` (domyślnie)  |
| **Threads** (jak Slack)  | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`           |

**Problem:** API Teams nie ujawnia, którego stylu UI używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Threads → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu Posts → odpowiedzi pojawiają się jako osobne posty najwyższego poziomu zamiast we wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` per kanał w zależności od tego, jak kanał jest skonfigurowany:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Załączniki i obrazy

**Bieżące ograniczenia:**

- **DM-y:** obrazy i załączniki plikowe działają przez botowe API plików Teams.
- **Kanały/grupy:** załączniki znajdują się w pamięci masowej M365 (SharePoint/OneDrive). Payload webhooka zawiera tylko HTML stub, a nie faktyczne bajty pliku. **Do pobierania załączników kanałowych wymagane są uprawnienia Graph API**.
- Dla jawnych wysyłek rozpoczynających się od pliku użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się dołączonym tekstem/komentarzem, a `filename` nadpisuje nazwę przesyłanego pliku.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane jako tylko tekstowe (zawartość obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera media tylko z nazw hostów Microsoft/Teams. Nadpisz to przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów z `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Utrzymuj tę listę restrykcyjną (unikaj wielodostępnych sufiksów).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM-ach przy użyciu przepływu FileConsentCard (wbudowane). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Sposób wysyłania plików                    | Wymagana konfiguracja                          |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- |
| **DM-y**                 | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                 |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → link współdzielenia | Wymaga `sharePointSiteId` + uprawnień Graph    |
| **Obrazy (dowolny kontekst)** | Inline zakodowane w Base64             | Działa od razu                                 |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (endpoint Graph API `/me/drive` nie działa dla tożsamości aplikacyjnych). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link współdzielenia.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalnie, umożliwia linki współdzielenia per użytkownik

2. **Przyznaj consent administratora** dla tenant.

3. **Pobierz identyfikator witryny SharePoint:**

   ```bash
   # Przez Graph Explorer lub curl z prawidłowym tokenem:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Przykład: dla witryny pod adresem "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Odpowiedź zawiera: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Skonfiguruj OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Zachowanie współdzielenia

| Uprawnienie                              | Zachowanie współdzielenia                                  |
| ---------------------------------------- | ---------------------------------------------------------- |
| `Sites.ReadWrite.All` tylko              | Link współdzielenia w całej organizacji (każdy w org może uzyskać dostęp) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link współdzielenia per użytkownik (dostęp mają tylko członkowie czatu) |

Współdzielenie per użytkownik jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mogą uzyskać dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot wraca do współdzielenia w całej organizacji.

### Zachowanie zapasowe

| Scenariusz                                        | Wynik                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku współdzielenia |
| Czat grupowy + plik + brak `sharePointSiteId`     | Próba przesłania do OneDrive (może się nie udać), wysłanie tylko tekstu |
| Czat osobisty + plik                              | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                          | Inline zakodowane w Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są zapisywane przez gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby rejestrować głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Adaptive Cards (dowolne)

Wyślij dowolny JSON Adaptive Card do użytkowników lub konwersacji Teams za pomocą narzędzia `message` lub CLI.

Parametr `card` akceptuje obiekt JSON Adaptive Card. Gdy podano `card`, tekst wiadomości jest opcjonalny.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Zobacz [dokumentację Adaptive Cards](https://adaptivecards.io/), aby poznać schemat kart i przykłady. Szczegóły formatu target znajdziesz poniżej w [Formatach target](#target-formats).

## Formaty target

Targety MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ targetu          | Format                           | Przykład                                            |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (po ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (po nazwie) | `user:<display-name>`          | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (raw)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Wyślij do użytkownika po ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Wyślij do użytkownika po nazwie wyświetlanej (wywołuje wyszukiwanie przez Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Wyślij do czatu grupowego lub kanału
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Wyślij Adaptive Card do konwersacji
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Przykłady narzędzia agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Uwaga: bez prefiksu `user:` nazwy domyślnie trafiają do rozwiązywania grup/zespołów. Zawsze używaj `user:`, gdy kierujesz wiadomość do osób po nazwie wyświetlanej.

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe **dopiero po** interakcji użytkownika, ponieważ dopiero wtedy zapisujemy referencje konwersacji.
- Zobacz `/gateway/configuration`, aby poznać `dmPolicy` i bramkowanie allowlistą.

## Identyfikatory zespołów i kanałów (częsta pułapka)

Parametr zapytania `groupId` w URL-ach Teams **NIE** jest identyfikatorem zespołu używanym do konfiguracji. Wyodrębnij identyfikatory ze ścieżki URL:

**URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Identyfikator zespołu (zdekoduj URL)
```

**URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Identyfikator kanału (zdekoduj URL)
```

**Dla konfiguracji:**

- Identyfikator zespołu = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`)
- Identyfikator kanału = segment ścieżki po `/channel/` (po zdekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId`

## Kanały prywatne

Boty mają ograniczone wsparcie w kanałach prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne        |
| ---------------------------- | ------------------ | ---------------------- |
| Instalacja bota              | Tak                | Ograniczona            |
| Wiadomości w czasie rzeczywistym (webhook) | Tak | Może nie działać       |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej   |
| @mentions                    | Tak                | Jeśli bot jest dostępny |
| Historia przez Graph API     | Tak                | Tak (z uprawnieniami)  |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Używaj kanałów standardowych do interakcji z botem
2. Używaj DM-ów — użytkownicy zawsze mogą napisać bezpośrednio do bota
3. Używaj Graph API do dostępu historycznego (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie pokazują się w kanałach:** brakuje uprawnień Graph lub consentu administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij/otwórz Teams.
- **Brak odpowiedzi w kanale:** domyślnie wymagane są wzmianki; ustaw `channels.msteams.requireMention=false` lub skonfiguruj per zespół/kanał.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie oraz całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z webhooka:** oczekiwane przy ręcznych testach bez Azure JWT — oznacza, że endpoint jest osiągalny, ale autoryzacja się nie powiodła. Użyj Azure Web Chat do poprawnego testowania.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon, które mają 0 bajtów. Utwórz poprawne ikony PNG (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** aplikacja nadal jest zainstalowana w innym zespole/czacie. Znajdź ją i odinstaluj najpierw albo odczekaj 5-10 minut na propagację.
- **"Something went wrong" przy przesyłaniu:** prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → zakładka Network i sprawdź body odpowiedzi, aby zobaczyć faktyczny błąd.
- **Sideload nie działa:** spróbuj opcji „Upload an app to your org's app catalog” zamiast „Upload a custom app” — często omija to ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Zweryfikuj, że `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator Twojej organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Odwołania

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie/zarządzanie aplikacjami Teams
- [Schemat manifestu aplikacji Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Odbieranie wiadomości kanałowych z RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Dokumentacja uprawnień RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Obsługa plików bota Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Wiadomości proaktywne](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Routowanie kanałów](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
