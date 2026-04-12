---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Stan obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-12T00:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e6841a618fb030e4c2029b3652d45dedd516392e2ae17309ff46b93648ffb79
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Porzućcie wszelką nadzieję, wy, którzy tu wchodzicie.”

Zaktualizowano: 2026-03-25

Stan: obsługiwane są tekst oraz załączniki DM; wysyłanie plików na kanałach/w grupach wymaga `sharePointSiteId` i uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek rozpoczynających się od pliku.

## Bundled plugin

Microsoft Teams jest dostarczany jako bundled plugin w bieżących wydaniach OpenClaw, więc
w standardowej paczkowanej kompilacji nie jest wymagana osobna instalacja.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji bez dołączonego Teams,
zainstaluj go ręcznie:

```bash
openclaw plugins install @openclaw/msteams
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Microsoft Teams jest dostępny.
   - Bieżące paczkowane wydania OpenClaw zawierają go już domyślnie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + client secret + tenant ID).
3. Skonfiguruj OpenClaw przy użyciu tych poświadczeń.
4. Udostępnij `/api/messages` (domyślnie port 3978) przez publiczny URL lub tunel.
5. Zainstaluj pakiet aplikacji Teams i uruchom gateway.

Minimalna konfiguracja (client secret):

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

W środowiskach produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](#federated-authentication-certificate--managed-identity) (certyfikat lub managed identity) zamiast client secret.

Uwaga: czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi w grupach, ustaw `channels.msteams.groupAllowFrom` (lub użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi, z bramkowaniem wzmianką).

## Cele

- Rozmawiaj z OpenClaw przez Teams DM, czaty grupowe lub kanały.
- Zachowaj deterministyczny routing: odpowiedzi zawsze wracają do kanału, z którego przyszły.
- Domyślnie stosuj bezpieczne zachowanie kanałów (wzmianki są wymagane, chyba że skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM + grupy)

**Dostęp do DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nadawcy nieznani systemowi są ignorowani do momentu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- UPN-y/nazwy wyświetlane są zmienne; bezpośrednie dopasowywanie jest domyślnie wyłączone i włączane tylko przez `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy do identyfikatorów przez Microsoft Graph, jeśli poświadczenia na to pozwalają.

**Dostęp do grup**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (zablokowane, dopóki nie dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby zastąpić domyślną wartość, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` określa, którzy nadawcy mogą wyzwalać działania w czatach grupowych/kanałach (z fallbackiem do `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (nadal z domyślnym bramkowaniem wzmianką).
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

**Teams + lista dozwolonych kanałów**

- Ogranicz odpowiedzi w grupach/kanałach, podając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów zespołów i identyfikatorów konwersacji kanałów.
- Gdy `groupPolicy="allowlist"` i lista dozwolonych zespołów jest obecna, akceptowane są tylko wymienione zespoły/kanały (z bramkowaniem wzmianką).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Przy uruchomieniu OpenClaw rozwiązuje nazwy zespołów/kanałów oraz nazwy na liście dozwolonych użytkowników do identyfikatorów (gdy pozwalają na to uprawnienia Graph)
  i zapisuje mapowanie w logach; nierozwiązane nazwy zespołów/kanałów są zachowywane w podanej postaci, ale domyślnie ignorowane przy routingu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

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
   - Bieżące paczkowane wydania OpenClaw zawierają go już domyślnie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + secret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla DM).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub przez zmienne środowiskowe) i uruchom gateway.
6. Gateway domyślnie nasłuchuje ruchu webhook Bot Framework na `/api/messages`.

## Konfiguracja Azure Bot (wymagania wstępne)

Przed skonfigurowaniem OpenClaw musisz utworzyć zasób Azure Bot.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                  |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                          |
   | **Resource group** | Utwórz nową lub użyj istniejącej                         |
   | **Pricing tier**   | **Free** do developmentu/testów                         |
   | **Type of App**    | **Single Tenant** (zalecane - zobacz uwagę poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Informacja o wycofaniu:** Tworzenie nowych botów wielodzierżawowych zostało wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.

3. Kliknij **Review + create** → **Create** (poczekaj ~1-2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twoje `appId`
3. Kliknij **Manage Password** → przejdź do rejestracji aplikacji
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twoje `tenantId`

### Krok 3: Skonfiguruj endpoint wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL webhooka:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalny development: użyj tunelu (zobacz poniżej [Local Development](#local-development-tunneling))

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj Terms of Service

## Uwierzytelnianie federacyjne (certyfikat + managed identity)

> Dodano w 2026.3.24

W środowiskach produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla client secret. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub uzyskaj certyfikat (format PEM z kluczem prywatnym).
2. W Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij certyfikat publiczny.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opcja B: Azure Managed Identity

Użyj Azure Managed Identity do uwierzytelniania bez hasła. To idealne rozwiązanie dla wdrożeń na infrastrukturze Azure (AKS, App Service, maszyny wirtualne Azure), gdzie dostępna jest managed identity.

**Jak to działa:**

1. Pod/VM bota ma managed identity (przypisaną przez system lub użytkownika).
2. **Federated identity credential** łączy managed identity z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity` do pobierania tokenów z endpointu Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do SDK Teams na potrzeby uwierzytelniania bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną managed identity (AKS workload identity, App Service, VM)
- Utworzona federated identity credential w rejestracji aplikacji Entra ID
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z poda/VM

**Config (managed identity przypisana przez system):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (managed identity przypisana przez użytkownika):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko dla tożsamości przypisanej przez użytkownika)

### Konfiguracja AKS Workload Identity

Dla wdrożeń AKS używających workload identity:

1. **Włącz workload identity** w klastrze AKS.
2. **Utwórz federated identity credential** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** z identyfikatorem klienta aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Dodaj etykietę do poda** dla wstrzykiwania workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) — jeśli używasz NetworkPolicy, dodaj regułę egress zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda               | Konfiguracja                                   | Zalety                             | Wady                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Prosta konfiguracja                | Wymaga rotacji sekretu, mniejsze bezpieczeństwo |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Brak współdzielonego sekretu w sieci | Narzut związany z zarządzaniem certyfikatami |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Bez haseł, brak sekretów do zarządzania | Wymagana infrastruktura Azure         |

**Zachowanie domyślne:** Gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania client secret. Istniejące konfiguracje nadal działają bez zmian.

## Local Development (tunelowanie)

Teams nie może połączyć się z `localhost`. Do lokalnego developmentu użyj tunelu:

**Opcja A: ngrok**

```bash
ngrok http 3978
# Skopiuj URL https, np. https://abc123.ngrok.io
# Ustaw messaging endpoint na: https://abc123.ngrok.io/api/messages
```

**Opcja B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Użyj swojego URL Tailscale funnel jako messaging endpoint
```

## Teams Developer Portal (alternatywa)

Zamiast ręcznie tworzyć ZIP z manifestem, możesz użyć [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Kliknij **+ New app**
2. Uzupełnij podstawowe informacje (nazwa, opis, informacje o deweloperze)
3. Przejdź do **App features** → **Bot**
4. Wybierz **Enter a bot ID manually** i wklej App ID swojego Azure Bot
5. Zaznacz zakresy: **Personal**, **Team**, **Group Chat**
6. Kliknij **Distribute** → **Download app package**
7. W Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wybierz plik ZIP

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
   - Bieżące paczkowane wydania OpenClaw zawierają go już domyślnie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie:
     - Z npm: `openclaw plugins install @openclaw/msteams`
     - Z lokalnego checkoutu: `openclaw plugins install ./path/to/local/msteams-plugin`

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
   - `MSTEAMS_AUTH_TYPE` (opcjonalnie: `"secret"` lub `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certyfikat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalne, niewymagane do uwierzytelniania)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko dla managed identity przypisanej przez użytkownika)

5. **Endpoint bota**
   - Ustaw Azure Bot Messaging Endpoint na:
     - `https://<host>:3978/api/messages` (lub wybraną ścieżkę/port).

6. **Uruchom gateway**
   - Kanał Teams uruchamia się automatycznie, gdy bundled plugin lub ręcznie zainstalowany plugin jest dostępny, a konfiguracja `msteams` zawiera poświadczenia.

## Akcja informacji o członku

OpenClaw udostępnia opartą na Graph akcję `member-info` dla Microsoft Teams, dzięki czemu agenci i automatyzacje mogą bezpośrednio z Microsoft Graph rozwiązywać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola).

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już obecne w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` z zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` określa, ile ostatnich wiadomości z kanału/grupy jest opakowywanych do promptu.
- Z fallbackiem do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobierana historia wątku jest filtrowana przez listy dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), więc seedowanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Cytowany kontekst załączników (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, listy dozwolonych nadawców kontrolują, kto może wyzwolić agenta; obecnie filtrowane są tylko określone uzupełniające ścieżki kontekstu.
- Historię DM można ograniczyć przez `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania per użytkownik: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia Teams RSC (manifest)

To są **istniejące uprawnienia resourceSpecific** w manifeście naszej aplikacji Teams. Obowiązują tylko wewnątrz zespołu/czatu, w którym aplikacja jest zainstalowana.

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

## Przykładowy manifest Teams (z redakcją)

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

### Zastrzeżenia dotyczące manifestu (pola wymagane)

- `bots[].botId` **musi** odpowiadać Azure Bot App ID.
- `webApplicationInfo.id` **musi** odpowiadać Azure Bot App ID.
- `bots[].scopes` musi zawierać powierzchnie, których planujesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia odczytu/wysyłania kanałowego, jeśli chcesz obsługiwać ruch kanałowy.

### Aktualizacja istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. dodać uprawnienia RSC):

1. Zaktualizuj `manifest.json`, dodając nowe ustawienia
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Ponownie spakuj ZIP** z manifestem i ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Opcja A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → znajdź swoją aplikację → Upload new version
   - **Opcja B (Sideload):** W Teams → Apps → Manage your apps → Upload a custom app
5. **Dla kanałów zespołu:** ponownie zainstaluj aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać
6. **Całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić metadane aplikacji z cache

## Możliwości: tylko RSC vs Graph

### Z **samym Teams RSC** (aplikacja zainstalowana, bez uprawnień API Graph)

Działa:

- Odczyt **tekstu** wiadomości kanałowych.
- Wysyłanie **tekstu** wiadomości kanałowych.
- Odbieranie załączników plikowych w **zakresie osobistym (DM)**.

Nie działa:

- Zawartość **obrazów lub plików** w kanałach/grupach (payload zawiera tylko stub HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza wydarzeniem webhooka na żywo).

### Z **Teams RSC + uprawnieniami aplikacyjnymi Microsoft Graph**

Dodaje:

- Pobieranie hostowanych treści (obrazy wklejane do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanału/czatu przez Graph.

### RSC vs Graph API

| Możliwość             | Uprawnienia RSC      | Graph API                           |
| --------------------- | -------------------- | ----------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez webhook)   | Nie (tylko polling)                 |
| **Wiadomości historyczne** | Nie                   | Tak (można odpytywać historię)      |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenów |
| **Działa offline**    | Nie (musi działać)   | Tak (zapytanie możliwe w dowolnym momencie) |

**Podsumowanie:** RSC służy do nasłuchu w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić pominięte wiadomości podczas pracy offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Media + historia z Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i udzielić zgody administratora.

1. W Entra ID (Azure AD) **App Registration** dodaj uprawnienia aplikacyjne Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałowe + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Udziel zgody administratora** dla tenantu.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj aplikację ponownie w Teams**.
4. **Całkowicie zamknij i uruchom ponownie Teams**, aby wyczyścić metadane aplikacji z cache.

**Dodatkowe uprawnienie dla wzmianek o użytkownikach:** Wzmianki @ użytkowników działają od razu dla użytkowników będących uczestnikami rozmowy. Jeśli jednak chcesz dynamicznie wyszukiwać i oznaczać użytkowników, którzy **nie są w bieżącej rozmowie**, dodaj uprawnienie aplikacyjne `User.Read.All` i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu webhooka

Teams dostarcza wiadomości przez webhook HTTP. Jeśli przetwarzanie trwa zbyt długo (np. powolne odpowiedzi LLM), możesz zobaczyć:

- przekroczenia czasu gateway
- ponawianie wiadomości przez Teams (powodujące duplikaty)
- porzucone odpowiedzi

OpenClaw obsługuje to przez szybki zwrot odpowiedzi i proaktywne wysyłanie odpowiedzi, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown Teams jest bardziej ograniczony niż w Slack lub Discord:

- Działa podstawowe formatowanie: **bold**, _italic_, `code`, linki
- Złożony markdown (tabele, zagnieżdżone listy) może renderować się niepoprawnie
- Adaptive Cards są obsługiwane dla ankiet i dowolnych wysyłek kart (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (wspólne wzorce kanałów znajdziesz w `/gateway/configuration`):

- `channels.msteams.enabled`: włącza/wyłącza kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: poświadczenia bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych dla DM (zalecane identyfikatory obiektów AAD). Kreator rozwiązuje nazwy do identyfikatorów podczas konfiguracji, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny przywracający dopasowywanie po zmiennych UPN/nazwach wyświetlanych oraz bezpośredni routing po nazwach zespołów/kanałów.
- `channels.msteams.textChunkLimit`: rozmiar fragmentów tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych wierszach (granice akapitów) przed dzieleniem według długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów dla przychodzących załączników (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach pobrania mediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymaga @mention w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania polityki narzędzi per zespół (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania polityki narzędzi per zespół i nadawcę (obsługiwany wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania polityki narzędzi per kanał (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania polityki narzędzi per kanał i nadawcę (obsługiwany wildcard `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują się tylko do `id:`).
- `channels.msteams.actions.memberInfo`: włącza lub wyłącza opartą na Graph akcję informacji o członku (domyślnie: włączona, gdy dostępne są poświadczenia Graph).
- `channels.msteams.authType`: typ uwierzytelniania — `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (federated + uwierzytelnianie certyfikatem).
- `channels.msteams.certificateThumbprint`: odcisk palca certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącza uwierzytelnianie managed identity (tryb federated).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta dla managed identity przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint dla wysyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routing i sesje

- Klucze sesji są zgodne ze standardowym formatem agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą główną sesję (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałowe/grupowe używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki vs posty

Teams niedawno wprowadził dwa style interfejsu kanałów nad tym samym bazowym modelem danych:

| Styl                    | Opis                                                      | Zalecane `replyStyle` |
| ----------------------- | --------------------------------------------------------- | --------------------- |
| **Posts** (klasyczny)   | Wiadomości pojawiają się jako karty z odpowiedziami we wątku pod spodem | `thread` (domyślnie)  |
| **Threads** (jak Slack) | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`           |

**Problem:** API Teams nie ujawnia, którego stylu interfejsu używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Threads → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu Posts → odpowiedzi pojawiają się jako osobne posty najwyższego poziomu zamiast we wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` per kanał na podstawie sposobu skonfigurowania kanału:

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

**Obecne ograniczenia:**

- **DM-y:** obrazy i załączniki plikowe działają przez interfejsy API plików bota Teams.
- **Kanały/grupy:** załączniki są przechowywane w M365 (SharePoint/OneDrive). Payload webhooka zawiera tylko stub HTML, a nie rzeczywiste bajty pliku. **Do pobierania załączników kanałowych wymagane są uprawnienia Graph API**.
- Dla jawnych wysyłek rozpoczynających się od pliku użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się dołączonym tekstem/komentarzem, a `filename` nadpisuje nazwę przesyłanego pliku.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane tylko jako tekst (zawartość obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera media tylko z nazw hostów Microsoft/Teams. Nadpisz to przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów z `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Utrzymuj tę listę restrykcyjną (unikaj sufiksów wielodzierżawowych).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM-ach przy użyciu przepływu FileConsentCard (wbudowane). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Sposób wysyłania plików                    | Wymagana konfiguracja                          |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- |
| **DM-y**                 | FileConsentCard → użytkownik akceptuje → bot przesyła plik | Działa od razu                                 |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → udostępnienie linku | Wymaga `sharePointSiteId` + uprawnień Graph    |
| **Obrazy (dowolny kontekst)** | Inline zakodowane w Base64             | Działa od razu                                 |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (endpoint Graph API `/me/drive` nie działa dla tożsamości aplikacyjnych). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link do udostępnienia.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalne, włącza linki udostępniania per użytkownik

2. **Udziel zgody administratora** dla tenantu.

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

### Zachowanie udostępniania

| Uprawnienie                             | Zachowanie udostępniania                                  |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` tylko             | Link udostępniania dla całej organizacji (dostępny dla każdego w organizacji) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link udostępniania per użytkownik (dostępny tylko dla członków czatu) |

Udostępnianie per użytkownik jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mają dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot wraca do udostępniania dla całej organizacji.

### Zachowanie fallback

| Scenariusz                                        | Wynik                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku udostępniania |
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

Wysyłaj dowolny JSON Adaptive Card do użytkowników lub konwersacji Teams przy użyciu narzędzia `message` lub CLI.

Parametr `card` akceptuje obiekt JSON Adaptive Card. Gdy `card` jest podane, tekst wiadomości jest opcjonalny.

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

Zobacz [dokumentację Adaptive Cards](https://adaptivecards.io/), aby poznać schemat karty i przykłady. Szczegóły formatu celu znajdziesz poniżej w [Formatach celu](#target-formats).

## Formaty celu

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ celu              | Format                           | Przykład                                            |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (według ID) | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (według nazwy) | `user:<display-name>`        | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (raw)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Wyślij do użytkownika według ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Wyślij do użytkownika według nazwy wyświetlanej (wywołuje wyszukiwanie przez Graph API)
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

Uwaga: bez prefiksu `user:` nazwy domyślnie trafiają do rozwiązywania grup/zespołów. Zawsze używaj `user:`, gdy kierujesz wiadomości do osób po nazwie wyświetlanej.

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe **dopiero po** interakcji użytkownika, ponieważ dopiero wtedy zapisujemy referencje konwersacji.
- Zobacz `/gateway/configuration`, aby poznać `dmPolicy` i kontrolę przez listy dozwolonych.

## Identyfikatory zespołów i kanałów (częsty problem)

Parametr zapytania `groupId` w URL-ach Teams **NIE** jest identyfikatorem zespołu używanym do konfiguracji. Wyodrębnij identyfikatory ze ścieżki URL:

**URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (zdekoduj URL)
```

**URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (zdekoduj URL)
```

**Do konfiguracji:**

- Team ID = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`)
- Channel ID = segment ścieżki po `/channel/` (po zdekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId`

## Kanały prywatne

Boty mają ograniczoną obsługę w kanałach prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne        |
| ---------------------------- | ------------------ | ---------------------- |
| Instalacja bota              | Tak                | Ograniczona            |
| Wiadomości w czasie rzeczywistym (webhook) | Tak                | Może nie działać       |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej   |
| @mentions                    | Tak                | Jeśli bot jest dostępny |
| Historia przez Graph API     | Tak                | Tak (z uprawnieniami)  |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Używaj standardowych kanałów do interakcji z botem
2. Używaj DM-ów — użytkownicy zawsze mogą napisać do bota bezpośrednio
3. Używaj Graph API do dostępu historycznego (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie pokazują się w kanałach:** brakuje uprawnień Graph lub zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij/otwórz ponownie Teams.
- **Brak odpowiedzi w kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` lub skonfiguruj to per zespół/kanał.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie oraz całkowicie zamknij Teams, aby odświeżyć dane.
- **401 Unauthorized z webhooka:** oczekiwane przy ręcznych testach bez JWT z Azure — oznacza, że endpoint jest osiągalny, ale uwierzytelnianie nie przeszło. Do poprawnego testu użyj Azure Web Chat.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon mających 0 bajtów. Utwórz poprawne ikony PNG (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo poczekaj 5-10 minut na propagację.
- **"Something went wrong" podczas przesyłania:** prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → kartę Network i sprawdź body odpowiedzi, aby zobaczyć rzeczywisty błąd.
- **Niepowodzenie sideload:** spróbuj użyć „Upload an app to your org's app catalog” zamiast „Upload a custom app” — często omija to ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Odnośniki

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie/zarządzanie aplikacjami Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanały/grupy wymagają Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianką
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
