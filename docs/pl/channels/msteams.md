---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Status obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T08:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Wiadomości tekstowe i załączniki w DM są obsługiwane; wysyłanie plików na kanałach i w grupach wymaga `sharePointSiteId` oraz uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` do wysyłania plików w pierwszej kolejności.

## Dołączony Plugin

Microsoft Teams jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc
w standardowej spakowanej kompilacji nie jest wymagana osobna instalacja.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera dołączonego Teams,
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

1. Upewnij się, że Plugin Microsoft Teams jest dostępny.
   - Bieżące spakowane wydania OpenClaw mają go już dołączonego.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + client secret + tenant ID).
3. Skonfiguruj OpenClaw przy użyciu tych poświadczeń.
4. Udostępnij `/api/messages` (domyślnie port 3978) przez publiczny URL lub tunel.
5. Zainstaluj pakiet aplikacji Teams i uruchom Gateway.

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

W przypadku wdrożeń produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](#federated-authentication) (certyfikat lub managed identity) zamiast client secret.

Uwaga: czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` (lub użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi, z domyślnym wymaganiem wzmianki).

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

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do czasu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- Nie polegaj na dopasowywaniu UPN/display-name w allowlistach — mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie po nazwie; włącz je jawnie za pomocą `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy do identyfikatorów przez Microsoft Graph, jeśli poświadczenia na to pozwalają.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (zablokowane, dopóki nie dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby zastąpić wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wywoływać działanie w czatach grupowych/kanałach (z powrotem do `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (domyślnie nadal obowiązuje wymaganie wzmianki).
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

- Ogranicz odpowiedzi grupowe/kanałowe przez wymienienie zespołów i kanałów w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów zespołów i identyfikatorów konwersacji kanałów.
- Gdy `groupPolicy="allowlist"` i obecna jest allowlista zespołów, akceptowane są tylko wymienione zespoły/kanały (z wymaganiem wzmianki).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Przy uruchomieniu OpenClaw rozwiązuje nazwy zespołów/kanałów i użytkowników z allowlist do identyfikatorów (gdy pozwalają na to uprawnienia Graph)
  i zapisuje mapowanie w logach; nierozwiązane nazwy zespołów/kanałów pozostają zapisane tak, jak zostały podane, ale domyślnie są ignorowane przez routing, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## Konfiguracja Azure Bot

Przed skonfigurowaniem OpenClaw utwórz zasób Azure Bot i zapisz jego poświadczenia.

<Steps>
  <Step title="Utwórz Azure Bot">
    Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) i wypełnij kartę **Basics**:

    | Pole               | Wartość                                                  |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
    | **Subscription**   | Twoja subskrypcja Azure                                  |
    | **Resource group** | Utwórz nową lub użyj istniejącej                         |
    | **Pricing tier**   | **Free** do programowania/testów                         |
    | **Type of App**    | **Single Tenant** (zalecane)                             |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Nowe boty multi-tenant zostały wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.
    </Note>

    Kliknij **Review + create** → **Create** (poczekaj ~1-2 minuty).

  </Step>

  <Step title="Zapisz poświadczenia">
    W zasobie Azure Bot → **Configuration**:

    - skopiuj **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → skopiuj wartość → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Skonfiguruj punkt końcowy wiadomości">
    Azure Bot → **Configuration** → ustaw **Messaging endpoint**:

    - Produkcja: `https://your-domain.com/api/messages`
    - Lokalne programowanie: użyj tunelu (zobacz [Lokalne programowanie](#local-development-tunneling))

  </Step>

  <Step title="Włącz kanał Teams">
    Azure Bot → **Channels** → kliknij **Microsoft Teams** → Configure → Save. Zaakceptuj Terms of Service.
  </Step>
</Steps>

## Uwierzytelnianie federacyjne

> Dodano w 2026.3.24

W przypadku wdrożeń produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla client secret. Dostępne są dwie metody:

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

Użyj Azure Managed Identity do uwierzytelniania bez haseł. To idealne rozwiązanie dla wdrożeń na infrastrukturze Azure (AKS, App Service, Azure VM), gdzie dostępna jest managed identity.

**Jak to działa:**

1. Pod/VM bota ma managed identity (przypisaną przez system lub użytkownika).
2. **Federated identity credential** łączy managed identity z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity`, aby uzyskiwać tokeny z punktu końcowego Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do SDK Teams do uwierzytelniania bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną managed identity (AKS workload identity, App Service, VM)
- Utworzone federated identity credential w rejestracji aplikacji Entra ID
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z podu/VM

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

### Konfiguracja AKS workload identity

W przypadku wdrożeń AKS używających workload identity:

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
| **Client secret**    | `appPassword`                                  | Prosta konfiguracja                | Wymagana rotacja sekretu, mniejsze bezpieczeństwo |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Brak współdzielonego sekretu w sieci | Narzut związany z zarządzaniem certyfikatami |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Uwierzytelnianie bez haseł, brak sekretów do zarządzania | Wymagana infrastruktura Azure         |

**Zachowanie domyślne:** Gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania client secret. Istniejące konfiguracje nadal działają bez zmian.

## Lokalne programowanie (tunelowanie)

Teams nie może połączyć się z `localhost`. Do lokalnego programowania użyj tunelu:

**Opcja A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**Opcja B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams Developer Portal (alternatywa)

Zamiast ręcznie tworzyć plik ZIP manifestu, możesz użyć [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Kliknij **+ New app**
2. Wypełnij podstawowe informacje (nazwa, opis, informacje o deweloperze)
3. Przejdź do **App features** → **Bot**
4. Wybierz **Enter a bot ID manually** i wklej App ID swojego Azure Bot
5. Zaznacz zakresy: **Personal**, **Team**, **Group Chat**
6. Kliknij **Distribute** → **Download app package**
7. W Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wybierz plik ZIP

Jest to często łatwiejsze niż ręczna edycja manifestów JSON.

## Testowanie bota

**Opcja A: Azure Web Chat (najpierw zweryfikuj Webhook)**

1. W Azure Portal → zasób Azure Bot → **Test in Web Chat**
2. Wyślij wiadomość — powinieneś zobaczyć odpowiedź
3. To potwierdza, że punkt końcowy Webhook działa przed konfiguracją Teams

**Opcja B: Teams (po instalacji aplikacji)**

1. Zainstaluj aplikację Teams (sideload lub katalog organizacji)
2. Znajdź bota w Teams i wyślij wiadomość prywatną
3. Sprawdź logi Gateway pod kątem przychodzącej aktywności

<Accordion title="Nadpisania zmiennych środowiskowych">

Dowolny z kluczy konfiguracji bota/uwierzytelniania można również ustawić przez zmienne środowiskowe:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` lub `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federated + certyfikat)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federated + managed identity; client ID tylko dla tożsamości przypisanej przez użytkownika)

</Accordion>

## Akcja informacji o członku

OpenClaw udostępnia dla Microsoft Teams akcję `member-info` opartą na Graph, dzięki czemu agenci i automatyzacje mogą bezpośrednio z Microsoft Graph pobierać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola).

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już zawarte w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` z zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` określa, ile ostatnich wiadomości kanału/grupy jest dołączanych do promptu.
- Wartość zapasowa to `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobierana historia wątku jest filtrowana przez allowlisty nadawców (`allowFrom` / `groupAllowFrom`), więc inicjalizacja kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Cytowany kontekst załączników (`ReplyTo*` wyprowadzony z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, allowlisty kontrolują, kto może wywołać agenta; obecnie filtrowane są tylko określone ścieżki dodatkowego kontekstu.
- Historię DM można ograniczyć za pomocą `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania per user: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktualne uprawnienia Teams RSC

To są **istniejące uprawnienia resourceSpecific** w manifeście naszej aplikacji Teams. Obowiązują tylko wewnątrz zespołu/czatu, w którym aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) — odbieranie wszystkich wiadomości kanałowych bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) — odbieranie wszystkich wiadomości czatu grupowego bez @wzmianki

## Przykładowy manifest Teams

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
- `bots[].scopes` musi obejmować powierzchnie, których zamierzasz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia odczytu/wysyłania kanałów, jeśli chcesz ruch kanałowy.

### Aktualizowanie istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. w celu dodania uprawnień RSC):

1. Zaktualizuj `manifest.json` o nowe ustawienia
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Spakuj ponownie** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Opcja A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → znajdź swoją aplikację → Upload new version
   - **Opcja B (Sideload):** w Teams → Apps → Manage your apps → Upload a custom app
5. **Dla kanałów zespołu:** zainstaluj ponownie aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać
6. **Całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić pamięć podręczną metadanych aplikacji

## Możliwości: tylko RSC vs Graph

### Tylko Teams RSC (bez uprawnień Microsoft Graph API)

Działa:

- Odczyt **tekstu** wiadomości kanałowych.
- Wysyłanie **tekstu** wiadomości kanałowych.
- Odbieranie załączników plikowych w **wiadomościach osobistych (DM)**.

Nie działa:

- **Obrazy lub treść plików** na kanałach/w grupach (ładunek zawiera tylko zastępczy fragment HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza zdarzeniem z bieżącego Webhook).

### Teams RSC plus uprawnienia aplikacyjne Microsoft Graph

Dodaje:

- Pobieranie hostowanych treści (obrazów wklejonych do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanału/czatu przez Graph.

### RSC vs Graph API

| Możliwość              | Uprawnienia RSC     | Graph API                           |
| ---------------------- | ------------------- | ----------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez Webhook) | Nie (tylko odpytywanie)             |
| **Wiadomości historyczne** | Nie              | Tak (można odpytywać historię)      |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenów |
| **Działa offline**     | Nie (musi działać)  | Tak (zapytanie w dowolnym momencie) |

**Podsumowanie:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić pominięte wiadomości podczas pracy offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Media + historia z włączonym Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików na **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i udzielić zgody administratora.

1. W **App Registration** Entra ID (Azure AD) dodaj uprawnienia aplikacyjne Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałowe + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Udziel zgody administratora** dla dzierżawy.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj ponownie aplikację w Teams**.
4. **Całkowicie zamknij i uruchom ponownie Teams**, aby wyczyścić pamięć podręczną metadanych aplikacji.

**Dodatkowe uprawnienie dla wzmianek użytkowników:** Wzmianki @user działają od razu dla użytkowników obecnych w konwersacji. Jeśli jednak chcesz dynamicznie wyszukiwać i oznaczać użytkowników, którzy **nie są w bieżącej konwersacji**, dodaj uprawnienie aplikacyjne `User.Read.All` i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu Webhook

Teams dostarcza wiadomości przez HTTP Webhook. Jeśli przetwarzanie trwa zbyt długo (np. z powodu wolnych odpowiedzi LLM), możesz zobaczyć:

- limity czasu Gateway
- ponowne wysyłanie wiadomości przez Teams (powodujące duplikaty)
- utracone odpowiedzi

OpenClaw radzi sobie z tym, szybko zwracając odpowiedź i wysyłając odpowiedzi proaktywnie, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown Teams jest bardziej ograniczony niż w Slack lub Discord:

- Podstawowe formatowanie działa: **pogrubienie**, _kursywa_, `code`, linki
- Złożony Markdown (tabele, zagnieżdżone listy) może renderować się niepoprawnie
- Adaptive Cards są obsługiwane dla ankiet i wysyłania prezentacji semantycznych (zobacz poniżej)

## Konfiguracja

Ustawienia pogrupowane (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów).

<AccordionGroup>
  <Accordion title="Rdzeń i Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: poświadczenia bota
    - `channels.msteams.webhook.port` (domyślnie `3978`)
    - `channels.msteams.webhook.path` (domyślnie `/api/messages`)
  </Accordion>

  <Accordion title="Uwierzytelnianie">
    - `authType`: `"secret"` (domyślnie) lub `"federated"`
    - `certificatePath`, `certificateThumbprint`: federated + uwierzytelnianie certyfikatem (thumbprint opcjonalny)
    - `useManagedIdentity`, `managedIdentityClientId`: federated + uwierzytelnianie managed identity
  </Accordion>

  <Accordion title="Kontrola dostępu">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
    - `allowFrom`: allowlista DM, preferowane identyfikatory obiektów AAD; kreator rozwiązuje nazwy, gdy dostęp do Graph jest dostępny
    - `dangerouslyAllowNameMatching`: obejście awaryjne dla zmiennych UPN/display-name i routingu nazw zespołów/kanałów
    - `requireMention`: wymaga @wzmianki na kanałach/w grupach (domyślnie `true`)
  </Accordion>

  <Accordion title="Nadpisania zespołów i kanałów">
    Wszystkie te ustawienia nadpisują domyślne ustawienia najwyższego poziomu:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: domyślne polityki narzędzi per team
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Klucze `toolsBySender` akceptują prefiksy `id:`, `e164:`, `username:`, `name:` (klucze bez prefiksu mapują do `id:`). `"*"` jest symbolem wieloznacznym.

  </Accordion>

  <Accordion title="Dostarczanie, multimedia i akcje">
    - `textChunkLimit`: rozmiar fragmentu tekstu wychodzącego
    - `chunkMode`: `length` (domyślnie) lub `newline` (dzielenie na granicach akapitów przed ograniczeniem długości)
    - `mediaAllowHosts`: allowlista hostów załączników przychodzących (domyślnie domeny Microsoft/Teams)
    - `mediaAuthAllowHosts`: hosty, które mogą otrzymywać nagłówki Authorization przy ponownych próbach (domyślnie Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: przełącza akcję informacji o członku opartą na Graph (domyślnie włączona, gdy Graph jest dostępny)
    - `sharePointSiteId`: wymagane do przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Routing i sesje

- Klucze sesji są zgodne ze standardowym formatem agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości prywatne współdzielą sesję główną (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałowe/grupowe używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki vs posty

Teams niedawno wprowadził dwa style UI kanałów na tym samym bazowym modelu danych:

| Styl                    | Opis                                                      | Zalecany `replyStyle` |
| ----------------------- | --------------------------------------------------------- | --------------------- |
| **Posts** (klasyczny)   | Wiadomości pojawiają się jako karty z odpowiedziami w wątku pod spodem | `thread` (domyślnie)  |
| **Threads** (jak Slack) | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`           |

**Problem:** API Teams nie ujawnia, którego stylu UI używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Threads → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu Posts → odpowiedzi pojawiają się jako oddzielne posty najwyższego poziomu zamiast w wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` per channel zgodnie z konfiguracją kanału:

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

- **DM:** Obrazy i załączniki plikowe działają przez interfejsy Teams bot file API.
- **Kanały/grupy:** Załączniki znajdują się w magazynie M365 (SharePoint/OneDrive). Ładunek Webhook zawiera tylko zastępczy fragment HTML, a nie rzeczywiste bajty pliku. Do pobierania załączników kanałowych **wymagane są uprawnienia Graph API**.
- W przypadku jawnego wysyłania z plikiem na pierwszym miejscu użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` stanie się dołączonym tekstem/komentarzem, a `filename` nadpisze nazwę przesłanego pliku.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane tylko jako tekst (treść obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera multimedia tylko z nazw hostów Microsoft/Teams. Nadpisz to przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów w `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Zachowaj ścisłą listę (unikaj przyrostków multi-tenant).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM za pomocą przepływu FileConsentCard (wbudowane). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Jak wysyłane są pliki                     | Wymagana konfiguracja                            |
| ------------------------ | ----------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                   |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → link udostępniania | Wymaga `sharePointSiteId` + uprawnień Graph      |
| **Obrazy (dowolny kontekst)** | Zakodowane inline jako Base64        | Działa od razu                                   |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (punkt końcowy Graph API `/me/drive` nie działa dla tożsamości aplikacji). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) — opcjonalnie, włącza linki udostępniania per user

2. **Udziel zgody administratora** dla dzierżawy.

3. **Pobierz identyfikator witryny SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

| Uprawnienie                             | Zachowanie udostępniania                                 |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` tylko             | Link udostępniania dla całej organizacji (każdy w organizacji ma dostęp) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link udostępniania per user (dostęp mają tylko członkowie czatu) |

Udostępnianie per user jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mają dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot wraca do udostępniania dla całej organizacji.

### Zachowanie awaryjne

| Scenariusz                                        | Wynik                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`     | Próba przesłania do OneDrive (może się nie udać), wysłanie tylko tekstu |
| Czat osobisty + plik                              | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                          | Zakodowany inline jako Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (adaptive cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są rejestrowane przez Gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby rejestrować głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Karty prezentacji

Wysyłaj semantyczne ładunki prezentacji do użytkowników lub konwersacji Teams za pomocą narzędzia `message` lub CLI. OpenClaw renderuje je jako Teams Adaptive Cards z ogólnego kontraktu prezentacji.

Parametr `presentation` akceptuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Szczegóły dotyczące formatu celu znajdziesz poniżej w sekcji [Formaty celów](#target-formats).

## Formaty celów

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ celu             | Format                           | Przykład                                            |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (według ID) | `user:<aad-object-id>`         | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (według nazwy) | `user:<display-name>`       | `user:John Smith` (wymaga Graph API)               |
| Grupa/kanał          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupa/kanał (surowy) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Uwaga: bez prefiksu `user:` nazwy domyślnie trafiają do rozwiązywania grup/zespołów. Zawsze używaj `user:`, gdy kierujesz wiadomość do osób według nazwy wyświetlanej.

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe **dopiero po** interakcji użytkownika, ponieważ dopiero wtedy przechowujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration`, aby poznać `dmPolicy` i kontrolę przez allowlisty.

## Identyfikatory zespołów i kanałów

Parametr zapytania `groupId` w URL-ach Teams **NIE** jest identyfikatorem zespołu używanym do konfiguracji. Wyodrębnij identyfikatory ze ścieżki URL:

**URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (zdekoduj to z URL)
```

**URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (zdekoduj to z URL)
```

**Do konfiguracji:**

- Team ID = segment ścieżki po `/team/` (po dekodowaniu URL, np. `19:Bk4j...@thread.tacv2`)
- Channel ID = segment ścieżki po `/channel/` (po dekodowaniu URL)
- **Zignoruj** parametr zapytania `groupId`

## Kanały prywatne

Boty mają ograniczoną obsługę kanałów prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne        |
| ---------------------------- | ------------------ | ---------------------- |
| Instalacja bota              | Tak                | Ograniczona            |
| Wiadomości w czasie rzeczywistym (Webhook) | Tak      | Może nie działać       |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej   |
| @wzmianki                    | Tak                | Jeśli bot jest dostępny |
| Historia przez Graph API     | Tak                | Tak (z uprawnieniami)  |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Używaj standardowych kanałów do interakcji z botem
2. Używaj DM — użytkownicy zawsze mogą pisać bezpośrednio do bota
3. Używaj Graph API do dostępu historycznego (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie wyświetlają się na kanałach:** brakuje uprawnień Graph lub zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij/otwórz ponownie Teams.
- **Brak odpowiedzi na kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` lub skonfiguruj to per team/channel.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie oraz całkowicie zamknij Teams, aby odświeżyć dane.
- **401 Unauthorized z Webhook:** oczekiwane podczas ręcznego testowania bez JWT z Azure — oznacza, że punkt końcowy jest osiągalny, ale uwierzytelnianie się nie powiodło. Do poprawnego testu użyj Azure Web Chat.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon o rozmiarze 0 bajtów. Utwórz poprawne ikony PNG (32x32 dla `outline.png`, 192x192 dla `color.png`).
- **"webApplicationInfo.Id already in use":** aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo poczekaj 5–10 minut na propagację.
- **"Something went wrong" przy przesyłaniu:** prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → kartę Network i sprawdź treść odpowiedzi, aby zobaczyć rzeczywisty błąd.
- **Sideload nie działa:** spróbuj opcji „Upload an app to your org's app catalog” zamiast „Upload a custom app” — często omija to ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Odwołania

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie/zarządzanie aplikacjami Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Powiązane

<CardGroup cols={2}>
  <Card title="Przegląd kanałów" icon="list" href="/pl/channels">
    Wszystkie obsługiwane kanały.
  </Card>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Uwierzytelnianie DM i przepływ parowania.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i wymaganie wzmianki.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Routing sesji dla wiadomości.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model dostępu i utwardzanie.
  </Card>
</CardGroup>
