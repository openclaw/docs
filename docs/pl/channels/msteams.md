---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Stan obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T18:14:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Status: obsługiwane są tekst i załączniki w wiadomościach prywatnych; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` oraz uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane za pomocą kart adaptacyjnych. Akcje wiadomości udostępniają jawne `upload-file` do wysyłania najpierw pliku.

## Dołączony plugin

Microsoft Teams jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw; w standardowej wersji pakietowej nie jest wymagana osobna instalacja.

W starszej wersji lub instalacji niestandardowej, która nie zawiera dołączonego pluginu Teams, zainstaluj pakiet npm bezpośrednio:

```bash
openclaw plugins install @openclaw/msteams
```

Użyj samej nazwy pakietu, aby korzystać z bieżącego oficjalnego tagu wydania. Przypnij konkretną wersję tylko wtedy, gdy potrzebna jest powtarzalna instalacja.

Lokalna kopia robocza (uruchamianie z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) obsługuje rejestrację bota, tworzenie manifestu i generowanie poświadczeń za pomocą jednego polecenia.

**1. Zainstaluj i zaloguj się**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # sprawdź, czy jesteś zalogowany, i wyświetl informacje o dzierżawie
```

<Note>
CLI Teams jest obecnie w wersji zapoznawczej. Polecenia i flagi mogą zmieniać się między wydaniami.
</Note>

**2. Uruchom tunel** (Teams nie może połączyć się z hostem lokalnym)

W razie potrzeby zainstaluj CLI devtunnel i uwierzytelnij się w nim ([przewodnik wprowadzający](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Konfiguracja jednorazowa (stały adres URL między sesjami):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Każda sesja programistyczna:
devtunnel host my-openclaw-bot
# Twój punkt końcowy: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` jest wymagane, ponieważ Teams nie może uwierzytelniać się za pomocą devtunnels. Każde przychodzące żądanie bota jest nadal weryfikowane przez zestaw SDK Teams.
</Note>

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (adresy URL mogą zmieniać się w każdej sesji).

**3. Utwórz aplikację**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Powoduje to utworzenie aplikacji Entra ID (Azure AD), wygenerowanie klucza tajnego klienta, zbudowanie i przesłanie manifestu aplikacji Teams (z ikonami) oraz zarejestrowanie bota zarządzanego przez Teams (bez konieczności posiadania subskrypcji Azure). Dane wyjściowe zawierają `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` oraz **Teams App ID**; dostępna jest też opcja bezpośredniej instalacji aplikacji w Teams.

**4. Skonfiguruj OpenClaw** przy użyciu poświadczeń z danych wyjściowych:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Można też użyć bezpośrednio zmiennych środowiskowych: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Zainstaluj aplikację w Teams**

`teams app create` wyświetla monit o zainstalowanie aplikacji; wybierz "Install in Teams". Aby później uzyskać link instalacyjny:

```bash
teams app get <teamsAppId> --install-link
```

**6. Sprawdź, czy wszystko działa**

```bash
teams app doctor <teamsAppId>
```

Uruchamia diagnostykę rejestracji bota, konfiguracji aplikacji AAD, poprawności manifestu i konfiguracji SSO.

W środowisku produkcyjnym zamiast kluczy tajnych klienta warto rozważyć [uwierzytelnianie federacyjne](#federated-authentication-certificate-plus-managed-identity) (certyfikat lub tożsamość zarządzana).

<Note>
Czaty grupowe są domyślnie zablokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` lub użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (z wymaganym oznaczeniem).
</Note>

## Cele

- Komunikacja z OpenClaw za pośrednictwem wiadomości prywatnych, czatów grupowych lub kanałów Teams.
- Zachowanie deterministycznego routingu: odpowiedzi zawsze wracają do kanału, z którego nadeszły.
- Domyślne bezpieczne zachowanie kanałów (oznaczenia są wymagane, chyba że skonfigurowano inaczej).

## Zapisywanie konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wyzwalane przez `/config set|unset` (wymaga `commands.config: true`).

Aby wyłączyć:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (wiadomości prywatne i grupy)

**Dostęp do wiadomości prywatnych**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do czasu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD lub statycznych grup dostępu nadawców, takich jak `accessGroup:core-team`.
- Nie należy polegać na dopasowywaniu nazw UPN/nazw wyświetlanych na listach dozwolonych, ponieważ mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie nazw; można je włączyć za pomocą `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozpoznawać nazwy jako identyfikatory za pośrednictwem Microsoft Graph, jeśli pozwalają na to poświadczenia.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (zablokowane, dopóki nie zostanie dodane `groupAllowFrom`). `channels.defaults.groupPolicy` może zastąpić wspólną wartość domyślną, gdy `channels.msteams.groupPolicy` nie jest ustawione.
- `channels.msteams.groupAllowFrom` określa, którzy nadawcy lub które statyczne grupy dostępu nadawców mogą wyzwalać działanie w czatach grupowych/kanałach (wartością zapasową jest `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (domyślnie nadal wymagane jest oznaczenie).
- Aby zablokować **wszystkie** kanały, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Lista dozwolonych zespołów i kanałów**

- Ogranicz zakres odpowiedzi grupowych/kanałowych, umieszczając zespoły i kanały w `channels.msteams.teams`.
- Jako kluczy używaj stabilnych identyfikatorów konwersacji Teams z linków Teams, a nie zmiennych nazw wyświetlanych (zobacz [Identyfikatory zespołów i kanałów](#team-and-channel-ids-common-gotcha)).
- Gdy obecne są `groupPolicy="allowlist"` i lista dozwolonych zespołów, akceptowane są tylko wymienione zespoły/kanały (z wymaganym oznaczeniem).
- Kreator konfiguracji przyjmuje wpisy `Team/Channel` i zapisuje je.
- Podczas uruchamiania OpenClaw rozpoznaje nazwy zespołów/kanałów oraz nazwy użytkowników z listy dozwolonych jako identyfikatory (jeśli pozwalają na to uprawnienia Graph) i zapisuje mapowanie w dzienniku. Nierozpoznane nazwy są zachowywane w podanej postaci, ale ignorowane podczas routingu, chyba że ustawiono `channels.msteams.dangerouslyAllowNameMatching: true`.

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

<details>
<summary><strong>Konfiguracja ręczna (bez CLI Teams)</strong></summary>

### Jak to działa

1. Upewnij się, że plugin Microsoft Teams jest dostępny (dołączony w bieżących wydaniach).
2. Utwórz **Azure Bot** (identyfikator aplikacji, klucz tajny i identyfikator dzierżawy).
3. Zbuduj **pakiet aplikacji Teams** odwołujący się do bota i zawierający poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla wiadomości prywatnych).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub zmienne środowiskowe) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu Webhook Bot Framework na `/api/messages`.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                          |
   | ------------------ | ---------------------------------------------------------------- |
   | **Bot handle**     | Nazwa bota, np. `openclaw-msteams` (musi być unikatowa)          |
   | **Subscription**   | Wybierz subskrypcję Azure                                        |
   | **Resource group** | Utwórz nową lub użyj istniejącej                                 |
   | **Pricing tier**   | **Free** do programowania/testowania                              |
   | **Type of App**    | **Single Tenant** (zalecane; zobacz uwagę poniżej)                |
   | **Creation type**  | **Create new Microsoft App ID**                                  |

<Warning>
Tworzenie nowych botów wielodostępnych zostało wycofane po 2025-07-31. W przypadku nowych botów używaj **Single Tenant**.
</Warning>

3. Kliknij **Review + create**, a następnie **Create** (~1-2 minuty).

### Krok 2: Uzyskaj poświadczenia

1. Zasób Azure Bot → **Configuration** → skopiuj **Microsoft App ID** (wartość `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → skopiuj **Value** (wartość `appPassword`).
3. **Overview** → skopiuj **Directory (tenant) ID** (wartość `tenantId`).

### Krok 3: Skonfiguruj punkt końcowy obsługi wiadomości

1. Azure Bot → **Configuration**.
2. Ustaw **Messaging endpoint**:
   - Środowisko produkcyjne: `https://your-domain.com/api/messages`
   - Lokalne środowisko programistyczne: użyj tunelu (zobacz [Programowanie lokalne](#local-development-tunneling))

### Krok 4: Włącz kanał Teams

1. Azure Bot → **Channels**.
2. Kliknij **Microsoft Teams** → Configure → Save.
3. Zaakceptuj warunki korzystania z usługi.

### Krok 5: Zbuduj manifest aplikacji Teams

- Dodaj wpis `bot` z `botId = <App ID>`.
- Zakresy: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (wymagane do obsługi plików w zakresie osobistym).
- Dodaj uprawnienia RSC (zobacz [Uprawnienia RSC](#current-teams-rsc-permissions-manifest)).
- Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
- Spakuj razem do archiwum ZIP pliki `manifest.json`, `outline.png` i `color.png`.

### Krok 6: Skonfiguruj OpenClaw

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

Zmienne środowiskowe: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Krok 7: Uruchom Gateway

Kanał Teams uruchamia się automatycznie, gdy plugin jest dostępny, a konfiguracja `msteams` zawiera poświadczenia.

</details>

## Uwierzytelnianie federacyjne (certyfikat i tożsamość zarządzana)

W środowisku produkcyjnym OpenClaw obsługuje **uwierzytelnianie federacyjne** za pośrednictwem `channels.msteams.authType: "federated"` jako alternatywę dla kluczy tajnych klienta. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub uzyskaj certyfikat (format PEM z kluczem prywatnym).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij certyfikat publiczny.

**Konfiguracja:**

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

### Opcja B: Tożsamość zarządzana Azure

Użyj tożsamości zarządzanej Azure do uwierzytelniania bez hasła w infrastrukturze Azure (AKS, App Service, maszyny wirtualne Azure).

**Jak to działa:**

1. Pod/maszyna wirtualna bota ma tożsamość zarządzaną (przypisaną przez system lub użytkownika).
2. Poświadczenie tożsamości federacyjnej łączy tożsamość zarządzaną z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity` do uzyskiwania tokenów z punktu końcowego Azure IMDS.
4. Token jest przekazywany do zestawu SDK Teams w celu uwierzytelnienia bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną tożsamością zarządzaną (tożsamość obciążenia AKS, App Service, VM).
- Poświadczenie tożsamości federacyjnej utworzone w rejestracji aplikacji Entra ID.
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z poda/VM.

**Konfiguracja (tożsamość zarządzana przypisana przez system):**

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

**Konfiguracja (tożsamość zarządzana przypisana przez użytkownika):** dodaj `managedIdentityClientId: "<MI_CLIENT_ID>"` do powyższego bloku.

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko przypisana przez użytkownika)

### Konfiguracja tożsamości obciążenia AKS

W przypadku wdrożeń AKS używających tożsamości obciążenia:

1. **Włącz tożsamość obciążenia** w klastrze AKS.
2. **Utwórz poświadczenie tożsamości federacyjnej** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** zawierającą identyfikator klienta aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Dodaj etykietę do poda**, aby wstrzyknąć tożsamość obciążenia:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zezwól na dostęp sieciowy** do IMDS (`169.254.169.254`): jeśli używasz NetworkPolicy, dodaj regułę ruchu wychodzącego dla `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda               | Konfiguracja                                   | Zalety                                  | Wady                                                   |
| -------------------- | ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| **Klucz tajny klienta** | `appPassword`                                  | Prosta konfiguracja                     | Wymagana rotacja klucza tajnego, mniejsze bezpieczeństwo |
| **Certyfikat**       | `authType: "federated"` + `certificatePath`    | Brak współdzielonego klucza tajnego w sieci | Narzut związany z zarządzaniem certyfikatem            |
| **Tożsamość zarządzana** | `authType: "federated"` + `useManagedIdentity` | Bez hasła, brak kluczy tajnych do zarządzania | Wymagana infrastruktura Azure                          |

`certificateThumbprint` można ustawić razem z `certificatePath`, ale obecnie nie jest odczytywane przez ścieżkę uwierzytelniania; jest akceptowane wyłącznie w celu zgodności z przyszłymi wersjami.

**Domyślnie:** gdy `authType` nie jest ustawione, OpenClaw używa uwierzytelniania kluczem tajnym klienta (`appPassword`). Istniejące konfiguracje nadal działają bez zmian.

## Programowanie lokalne (tunelowanie)

Teams nie może uzyskać dostępu do `localhost`. Użyj trwałego tunelu deweloperskiego, aby adres URL pozostawał niezmienny między sesjami:

```bash
# Konfiguracja jednorazowa:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Każda sesja deweloperska:
devtunnel host my-openclaw-bot
```

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (adresy URL mogą zmieniać się w każdej sesji).

Jeśli adres URL tunelu się zmieni, zaktualizuj punkt końcowy:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testowanie bota

**Uruchom diagnostykę:**

```bash
teams app doctor <teamsAppId>
```

Sprawdza za jednym razem rejestrację bota, aplikację AAD, manifest i konfigurację SSO.

**Wyślij wiadomość testową:**

1. Zainstaluj aplikację Teams (łącze instalacyjne z `teams app get <id> --install-link`).
2. Znajdź bota w Teams i wyślij wiadomość bezpośrednią.
3. Sprawdź dzienniki Gateway pod kątem aktywności przychodzącej.

## Zmienne środowiskowe

Te klucze konfiguracji związane z uwierzytelnianiem można ustawić za pomocą zmiennych środowiskowych zamiast `openclaw.json` (inne klucze konfiguracji, takie jak `groupPolicy` lub `historyLimit`, można ustawić wyłącznie w konfiguracji):

| Zmienna środowiskowa                 | Klucz konfiguracji        | Uwagi                                         |
| ------------------------------------ | ------------------------- | --------------------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                               |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                               |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                               |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` lub `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | federacyjne + certyfikat                      |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | akceptowane, niewymagane do uwierzytelniania  |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | federacyjne + tożsamość zarządzana            |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | tylko tożsamość zarządzana przypisana przez użytkownika |

## Akcja informacji o członku

OpenClaw udostępnia dla Microsoft Teams akcję `member-info` opartą na Graph, dzięki której agenty i automatyzacje mogą ustalać zweryfikowane dane członków dla skonfigurowanej konwersacji.

Wymagania:

- Uprawnienia RSC `ChannelSettings.Read.Group` i `TeamMember.Read.Group` (są już zawarte w zalecanym manifeście).

Akcja jest dostępna zawsze, gdy skonfigurowano poświadczenia Graph; nie ma osobnego przełącznika `channels.msteams.actions.memberInfo`.
Wyszukiwania w kanałach standardowych zwracają pasującą tożsamość z listy członków zespołu, nazwę wyświetlaną, adres e-mail i role.
W bieżącej wiadomości bezpośredniej lub czacie grupowym akcja może zwrócić stabilny identyfikator użytkownika zaufanego nadawcy.
Wyszukiwanie członków kanałów prywatnych/współdzielonych i czatów innych niż bieżący wymaga dodatkowych uprawnień do listy członków
i jest odrzucane przy domyślnym podstawowym zestawie uprawnień.

## Kontekst historii

- `channels.msteams.historyLimit` określa, ile ostatnich wiadomości z kanału/grupy zostanie dołączonych do promptu. W razie braku wartości używane jest `messages.groupChat.historyLimit`, a następnie wartość domyślna 50. Ustaw `0`, aby wyłączyć tę funkcję.
- Pobrana historia wątku jest filtrowana według list dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), dlatego wstępne zasilanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Kontekst cytowanych załączników (przetworzony z kodu HTML schematu Skype Reply w załącznikach samej odpowiedzi) jest przekazywany bez filtrowania; obecnie filtr listy dozwolonych nadawców jest stosowany tylko do wstępnego zasilania historią wątku.
- Historię wiadomości bezpośrednich można ograniczyć za pomocą `channels.msteams.dmHistoryLimit` (wypowiedzi użytkownika). Nadpisania dla poszczególnych użytkowników: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia RSC Teams (manifest)

Są to **istniejące uprawnienia resourceSpecific** w manifeście naszej aplikacji Teams. Obowiązują wyłącznie w zespole/czacie, w którym zainstalowano aplikację.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) — odbieranie wszystkich wiadomości kanału bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) — odbieranie wszystkich wiadomości czatu grupowego bez @wzmianki

Dodaj uprawnienia RSC za pomocą CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Przykładowy manifest Teams (zanonimizowany)

Minimalny, prawidłowy przykład z wymaganymi polami. Zastąp identyfikatory i adresy URL.

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

- `bots[].botId` **musi** być zgodne z identyfikatorem aplikacji Azure Bot.
- `webApplicationInfo.id` **musi** być zgodne z identyfikatorem aplikacji Azure Bot.
- `bots[].scopes` musi zawierać powierzchnie, które mają być używane (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia do odczytu/wysyłania wiadomości kanału na potrzeby ruchu w kanałach.

### Aktualizowanie istniejącej aplikacji

```bash
# Pobierz, edytuj i ponownie prześlij manifest
teams app manifest download <teamsAppId> manifest.json
# Edytuj manifest.json lokalnie...
teams app manifest upload manifest.json <teamsAppId>
# Wersja jest automatycznie zwiększana, jeśli zawartość uległa zmianie
```

Po aktualizacji ponownie zainstaluj aplikację w każdym zespole oraz **całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić metadane aplikacji z pamięci podręcznej.

<details>
<summary>Ręczna aktualizacja manifestu (bez CLI)</summary>

1. Zaktualizuj `manifest.json` przy użyciu nowych ustawień.
2. **Zwiększ wartość pola `version`** (np. `1.0.0` → `1.1.0`).
3. **Ponownie utwórz archiwum ZIP** manifestu wraz z ikonami (`manifest.json`, `outline.png`, `color.png`).
4. Prześlij nowe archiwum ZIP:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Możliwości: tylko RSC a Graph

### Z **samym RSC Teams** (aplikacja zainstalowana, bez uprawnień interfejsu API Graph)

Działa:

- Odczytywanie treści **tekstowej** wiadomości kanału.
- Wysyłanie treści **tekstowej** wiadomości kanału.
- Odbieranie załączników w postaci plików w wiadomościach **osobistych (DM)**.

NIE działa:

- **Zawartość obrazów lub plików** w kanałach/grupach (ładunek zawiera tylko namiastkę HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości poza bieżącym zdarzeniem Webhook.

### Z **RSC Teams + uprawnieniami aplikacji Microsoft Graph**

Dodaje:

- Pobieranie hostowanej zawartości (obrazów wklejonych do wiadomości).
- Pobieranie załączników w postaci plików przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości kanału/czatu za pomocą Graph.

### RSC a interfejs API Graph

| Możliwość                  | Uprawnienia RSC             | Graph API                                      |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez webhook)         | Nie (tylko odpytywanie)                        |
| **Wiadomości historyczne** | Nie                         | Tak (można odpytywać historię)                 |
| **Złożoność konfiguracji** | Tylko manifest aplikacji   | Wymaga zgody administratora i przepływu tokenu |
| **Działa offline**         | Nie (musi być uruchomione) | Tak (można odpytywać w dowolnym momencie)      |

**Podsumowanie:** RSC służy do nasłuchiwania w czasie rzeczywistym, a Graph API — do dostępu do historii. Aby pobrać wiadomości pominięte w trybie offline, potrzebne jest Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Multimedia i historia obsługiwane przez Graph

Włącz tylko te uprawnienia aplikacji Microsoft Graph, które są potrzebne dla używanych zakresów i danych Teams:

1. Entra ID (Azure AD) **App Registration** → dodaj **Application permissions** Graph:
   - `ChannelMessage.Read.All` dla załączników kanałów i historii kanałów.
   - `Chat.Read.All` dla załączników czatów grupowych i historii czatów grupowych.
   - `Files.Read.All`, gdy bajty załączników muszą być pobierane z magazynu SharePoint/OneDrive; konfiguracje korzystające wyłącznie z historii go nie potrzebują.
2. Wybierz **Grant admin consent** dla dzierżawy.
3. Zwiększ **manifest version** aplikacji Teams, prześlij ją ponownie i **ponownie zainstaluj aplikację w Teams**.
4. **Całkowicie zamknij i ponownie uruchom Teams**, aby wyczyścić buforowane metadane aplikacji.

### Odzyskiwanie plików kanałów/grup (`graphMediaFallback`)

Teams może usuwać znaczniki plików z aktywności HTML wysyłanej do bota. W takim przypadku aktywności Bot Framework nie da się odróżnić od zwykłej wiadomości HTML; pełne odwołanie do załącznika istnieje tylko w kopii wiadomości dostępnej przez Graph.

Po nadaniu powyższych uprawnień włącz mechanizm rezerwowy:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Dotyczy to wyłącznie kanałów i czatów grupowych. Dodaje jedno wyszukanie wiadomości przez Graph za każdym razem, gdy aktywność HTML nie zawierała multimediów możliwych do bezpośredniego pobrania, w tym w przypadku zwykłych wiadomości lub wiadomości zawierających tylko wzmiankę. Wartością domyślną jest `false`, dzięki czemu istniejące instalacje nie generują automatycznie dodatkowego ruchu Graph ani błędów uprawnień.

**Wzmianki o użytkownikach:** wzmianki @ działają od razu w przypadku użytkowników, którzy już uczestniczą w konwersacji. Aby dynamicznie wyszukiwać i oznaczać użytkowników, którzy **nie uczestniczą w bieżącej konwersacji**, dodaj uprawnienie `User.Read.All` (Application) i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu webhooka

Teams dostarcza wiadomości przez webhook HTTP. OpenClaw stosuje stałe limity czasu serwera HTTP dla tego odbiornika webhooka: 30 s bezczynności, 30 s całkowitego czasu żądania i 15 s na odebranie nagłówków. Opcjonalne wzbogacanie przychodzących multimediów i kontekstu ma wspólny budżet 10 sekund, ale zestaw SDK Teams nadal czeka na zakończenie tury agenta przed zwróceniem odpowiedzi webhooka. Jeśli pełna tura przekroczy okno ponawiania Teams, mogą wystąpić:

- Ponowne wysyłanie wiadomości przez Teams (powodujące duplikaty).
- Utracone odpowiedzi.

Odpowiedzi są wysyłane proaktywnie, gdy agent odpowie, ale powolne przebiegi agenta mogą nadal powodować ponowienia lub duplikaty po stronie Teams.

### Obsługa chmury Teams i adresów URL usługi

Ta oparta na SDK ścieżka Teams została zweryfikowana na żywo dla chmury publicznej Microsoft Teams.

Odpowiedzi przychodzące korzystają z kontekstu tury SDK Teams dla przychodzącej wiadomości. Proaktywne operacje poza kontekstem — wysyłanie, edytowanie, usuwanie, karty, ankiety, wiadomości zgody na pliki i kolejkowane, długotrwałe odpowiedzi — używają zapisanego odwołania do konwersacji `serviceUrl`. Chmura publiczna domyślnie używa środowiska chmury publicznej SDK Teams i zezwala na zapisane odwołania na publicznym hoście Teams Connector: `https://smba.trafficmanager.net/`.

Chmura publiczna jest ustawieniem domyślnym. W przypadku zwykłych botów w chmurze publicznej nie trzeba ustawiać `channels.msteams.cloud` ani `channels.msteams.serviceUrl`.

W przypadku niepublicznych chmur Teams ustaw `cloud` oraz pasującą granicę operacji proaktywnych, gdy Microsoft ją opublikuje:

- `channels.msteams.cloud` wybiera ustawienie wstępne chmury SDK Teams dla uwierzytelniania, walidacji JWT, usług tokenów i zakresu Graph.
- `channels.msteams.serviceUrl` wybiera granicę punktu końcowego Bot Connector używaną do walidacji zapisanych odwołań do konwersacji przed proaktywnym wysyłaniem, edytowaniem, usuwaniem, kartami, ankietami, wiadomościami zgody na pliki i kolejkowanymi, długotrwałymi odpowiedziami. Jest wymagane dla chmur SDK USGov i DoD. W przypadku China/21Vianet OpenClaw używa ustawienia wstępnego SDK `China` i akceptuje zapisane/skonfigurowane adresy URL usług wyłącznie na hostach kanałów Azure China Bot Framework.

Microsoft publikuje globalne punkty końcowe Bot Connector dla operacji proaktywnych w sekcji [Tworzenie konwersacji](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) dokumentacji proaktywnego przesyłania wiadomości Teams. Użyj `serviceUrl` z przychodzącej aktywności, gdy jest dostępny; w przeciwnym razie użyj poniższej tabeli Microsoftu.

| Środowisko Teams | Konfiguracja OpenClaw                                             | Proaktywny `serviceUrl`                             |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Public            | konfiguracja cloud/serviceUrl nie jest potrzebna                  | `https://smba.trafficmanager.net/teams`                                        |
| GCC               | ustaw `serviceUrl`; nie istnieje osobne ustawienie wstępne chmury SDK Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                           | `https://smba.infra.gov.teams.microsoft.us/teams`                                        |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                           | `https://smba.infra.dod.teams.microsoft.us/teams`                                        |
| China/21Vianet    | `cloud: "China"`                                                | użyj `serviceUrl` z przychodzącej aktywności        |

Przykład dla GCC, gdzie Microsoft dokumentuje osobny adres URL usługi proaktywnej, ale SDK Teams nie udostępnia osobnego ustawienia wstępnego chmury GCC:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Przykład dla GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` jest ograniczone do obsługiwanych hostów Microsoft Teams Bot Connector. Po skonfigurowaniu adresu URL usługi OpenClaw sprawdza, czy zapisane odwołanie do konwersacji `serviceUrl` używa tego samego hosta, zanim zostaną wykonane proaktywne operacje wysyłania, edytowania, usuwania, kart, ankiet lub kolejkowanych, długotrwałych odpowiedzi. Przy domyślnej konfiguracji chmury publicznej OpenClaw bezpiecznie odmawia wykonania operacji, jeśli zapisana konwersacja wskazuje adres poza publicznym hostem Teams Connector. Po zmianie ustawień chmury/adresu URL usługi odbierz nową wiadomość z konwersacji, aby zapisane odwołanie do konwersacji było aktualne.

China/21Vianet nie ma osobnego globalnego proaktywnego adresu URL `smba` w tabeli proaktywnych punktów końcowych Teams firmy Microsoft. Skonfiguruj `cloud: "China"`, aby SDK Teams używał punktów końcowych uwierzytelniania, tokenów i JWT usługi Azure China. Proaktywne wysyłanie wymaga wtedy zapisanego odwołania do konwersacji pochodzącego z przychodzącej aktywności China Teams albo jawnie skonfigurowanego adresu URL usługi na granicy kanału Azure China Bot Framework (`*.botframework.azure.cn`). Pomocnicze funkcje Teams korzystające z Graph są wyłączone dla `cloud: "China"`, dopóki OpenClaw nie zacznie kierować żądań Graph przez punkt końcowy Graph usługi Azure China.

### Formatowanie

Markdown w Teams ma więcej ograniczeń niż w Slack lub Discord:

- Działa podstawowe formatowanie: **pogrubienie**, _kursywa_, `code`, linki.
- Złożony Markdown (tabele, listy zagnieżdżone) może nie być renderowany poprawnie.
- Karty adaptacyjne są obsługiwane w przypadku ankiet i semantycznych wysyłek prezentacyjnych (zobacz poniżej).

## Konfiguracja

Najważniejsze ustawienia (wspólne wzorce kanałów opisano w [/gateway/configuration](/pl/gateway/configuration)):

- `channels.msteams.enabled`: włącza/wyłącza kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: dane uwierzytelniające bota.
- `channels.msteams.cloud`: środowisko chmurowe zestawu Teams SDK (`Public`, `USGov`, `USGovDoD` lub `China`; domyślnie `Public`). Ustaw za pomocą `serviceUrl` dla chmur SDK USGov/DoD; Chiny korzystają z ustawienia wstępnego SDK i zapisanych odwołań do konwersacji usługi Azure China Bot Framework, a funkcje pomocnicze oparte na Graph pozostają wyłączone do czasu udostępnienia routingu Azure China Graph.
- `channels.msteams.serviceUrl`: granica adresu URL usługi Bot Connector dla proaktywnych operacji SDK. Chmura publiczna używa wartości domyślnej SDK; ustaw dla GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High lub DoD. W przypadku Chin akceptowane są hosty kanałów Azure China Bot Framework, gdy zapisane odwołanie do konwersacji pochodzi z usługi Teams obsługiwanej przez 21Vianet.
- `channels.msteams.webhook.port` (domyślnie `3978`).
- `channels.msteams.webhook.path` (domyślnie `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie `pairing`).
- `channels.msteams.allowFrom`: lista dozwolonych wiadomości prywatnych (zalecane są identyfikatory obiektów AAD). Kreator podczas konfiguracji zamienia nazwy na identyfikatory, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: awaryjny przełącznik ponownie włączający dopasowywanie zmiennych nazw UPN/nazw wyświetlanych oraz bezpośredni routing według nazw zespołów/kanałów.
- `channels.msteams.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego w znakach (domyślnie `4000`, z bezwzględnym limitem `4000` niezależnie od skonfigurowania wyższej wartości).
- `channels.msteams.streaming.chunkMode`: `length` (domyślnie) lub `newline`, aby przed dzieleniem według długości dzielić tekst przy pustych wierszach (granicach akapitów).
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów załączników przychodzących (domyślnie domeny Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: lista hostów, dla których podczas ponawiania pobierania multimediów dołączane są nagłówki Authorization (domyślnie hosty Graph i Bot Framework).
- `channels.msteams.graphMediaFallback`: włącza wyszukiwanie wiadomości za pomocą Graph, gdy kod HTML kanału/grupy nie zawiera znaczników plików (domyślnie `false`; zobacz [Odzyskiwanie plików kanału/grupy](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: zastępczy limit rozmiaru multimediów dla poszczególnych kanałów w MB. Jeśli nie ustawiono, używana jest wartość `agents.defaults.mediaMaxMb`.
- `channels.msteams.requireMention`: wymaga @wzmianki w kanałach/grupach (domyślnie `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: zastąpienie dla poszczególnych zespołów.
- `channels.msteams.teams.<teamId>.requireMention`: zastąpienie dla poszczególnych zespołów.
- `channels.msteams.teams.<teamId>.tools`: domyślne zastąpienia zasad narzędzi dla poszczególnych zespołów (`allow`/`deny`/`alsoAllow`), używane, gdy brakuje zastąpienia dla kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne zastąpienia zasad narzędzi według zespołu i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: zastąpienie dla poszczególnych kanałów.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: zastąpienie dla poszczególnych kanałów.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: zastąpienia zasad narzędzi dla poszczególnych kanałów (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: zastąpienia zasad narzędzi według kanału i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów: `channel:`, `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal są mapowane wyłącznie na `id:`).
- `channels.msteams.authType`: typ uwierzytelniania — `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (uwierzytelnianie federacyjne i certyfikatem).
- `channels.msteams.certificateThumbprint`: odcisk palca certyfikatu; akceptowany, ale niewymagany do uwierzytelniania.
- `channels.msteams.useManagedIdentity`: włącza uwierzytelnianie za pomocą tożsamości zarządzanej (tryb federacyjny).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta tożsamości zarządzanej przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint używany do przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: powitalna karta adaptacyjna wyświetlana przy pierwszym kontakcie prywatnym/grupowym oraz jej przyciski z sugerowanymi poleceniami.
- `channels.msteams.responsePrefix`: tekst dodawany na początku odpowiedzi wychodzących.
- `channels.msteams.feedbackEnabled` (domyślnie `true`), `channels.msteams.feedbackReflection` (domyślnie `true`), `channels.msteams.feedbackReflectionCooldownMs`: opinie o odpowiedziach w postaci kciuka w górę/dół oraz dalsza refleksja po negatywnej opinii.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: połączenie OAuth Bot Framework i delegowane zakresy Graph dla przepływów opartych na SSO; `sso.enabled: true` wymaga `sso.connectionName`.

## Routing i sesje

- Klucze sesji są zgodne ze standardowym formatem agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości prywatne współdzielą sesję główną (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałów/grup używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki a posty

Teams udostępnia dwa style interfejsu kanału oparte na tym samym modelu danych:

| Styl                     | Opis                                                      | Zalecane `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posty** (klasyczne)    | Wiadomości są wyświetlane jako karty z odpowiedziami w wątku poniżej | `thread` (domyślnie)       |
| **Wątki** (jak w Slacku) | Wiadomości są wyświetlane liniowo, podobnie jak w Slacku  | `top-level`              |

**Problem:** interfejs API Teams nie ujawnia, którego stylu interfejsu używa kanał. W przypadku użycia niewłaściwej wartości `replyStyle`:

- `thread` w kanale w stylu Wątki → odpowiedzi są niezręcznie zagnieżdżone.
- `top-level` w kanale w stylu Posty → odpowiedzi są wyświetlane jako oddzielne posty najwyższego poziomu zamiast w wątku.

**Rozwiązanie:** skonfiguruj `replyStyle` osobno dla każdego kanału, odpowiednio do jego konfiguracji:

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

### Kolejność rozstrzygania

Gdy bot wysyła odpowiedź do kanału, wartość `replyStyle` jest rozstrzygana od najbardziej szczegółowego zastąpienia do wartości domyślnej. Wygrywa pierwsza wartość inna niż `undefined`:

1. **Dla kanału** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Dla zespołu** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Globalnie** — `channels.msteams.replyStyle`
4. **Niejawna wartość domyślna** — wyznaczana na podstawie `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jeśli wartość `requireMention: false` zostanie ustawiona globalnie bez jawnej wartości `replyStyle`, wzmianki w kanałach w stylu Posty będą wyświetlane jako posty najwyższego poziomu, nawet jeśli wiadomość przychodząca była odpowiedzią w wątku. Ustaw na stałe `replyStyle: "thread"` na poziomie globalnym, zespołu lub kanału, aby uniknąć niespodzianek.

W przypadku proaktywnych wysyłek do zapisanej konwersacji kanału (odpowiedzi na wywołania narzędzi w kolejce, długotrwałe działania agentów) obowiązuje to samo rozstrzyganie według zespołu/kanału; czaty grupowe i konwersacje osobiste (wiadomości prywatne) dla proaktywnych wysyłek zawsze są rozstrzygane jako `top-level`, niezależnie od `replyStyle`.

### Zachowywanie kontekstu wątku

Gdy obowiązuje `replyStyle: "thread"`, a bot otrzymał @wzmiankę wewnątrz wątku kanału, OpenClaw ponownie dołącza pierwotny element główny wątku do odwołania do konwersacji wychodzącej (`19:...@thread.tacv2;messageid=<root>`), dzięki czemu odpowiedź trafia do tego samego wątku. Dotyczy to zarówno wysyłek na żywo (w ramach bieżącej tury), jak i wysyłek proaktywnych wykonanych po wygaśnięciu kontekstu tury Bot Framework (np. długotrwałych działań agentów, odpowiedzi na wywołania narzędzi w kolejce za pośrednictwem `mcp__openclaw__message`).

Element główny wątku jest pobierany z zapisanego `threadId` w odwołaniu do konwersacji. Starsze zapisane odwołania, utworzone przed wprowadzeniem `threadId`, korzystają awaryjnie z `activityId` (dowolnego działania przychodzącego, które ostatnio zainicjowało konwersację), dzięki czemu istniejące wdrożenia nadal działają bez ponownego inicjowania.

Gdy obowiązuje `replyStyle: "top-level"`, wiadomości przychodzące z wątków kanałów są celowo obsługiwane jako nowe posty najwyższego poziomu; nie jest dołączany żaden sufiks wątku. Jest to prawidłowe dla kanałów w stylu Wątki; posty najwyższego poziomu wyświetlane tam, gdzie oczekiwano odpowiedzi w wątku, oznaczają, że wartość `replyStyle` jest nieprawidłowo ustawiona dla tego kanału.

## Załączniki i obrazy

**Obecne ograniczenia:**

- **Wiadomości prywatne:** obrazy i załączniki plikowe działają za pośrednictwem interfejsów API plików botów Teams.
- **Kanały/grupy:** załączniki znajdują się w magazynie M365 (SharePoint/OneDrive). Ładunek Webhook zawiera jedynie zastępczy fragment HTML, a nie rzeczywiste bajty pliku. **Do pobierania załączników kanału wymagane są uprawnienia interfejsu API Graph**.
- W przypadku jawnych wysyłek rozpoczynających się od pliku użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalna wartość `message` staje się towarzyszącym tekstem/komentarzem, a `filename` (lub `title`) zastępuje nazwę przesyłanego pliku.

Bez uprawnień Graph wiadomości kanału zawierające obrazy docierają wyłącznie jako tekst (zawartość obrazu jest niedostępna dla bota).
Domyślnie OpenClaw pobiera multimedia wyłącznie z nazw hostów Microsoft/Teams. Zastąp to za pomocą `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane wyłącznie dla hostów z listy `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph i Bot Framework). Lista powinna być restrykcyjna (unikaj sufiksów obejmujących wiele dzierżaw).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w wiadomościach prywatnych za pomocą wbudowanego przepływu FileConsentCard. **Wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Sposób wysyłania plików                       | Wymagana konfiguracja                           |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Wiadomości prywatne**  | FileConsentCard → użytkownik akceptuje → bot przesyła plik | Działa od razu                                  |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → natywna karta pliku | Wymaga `sharePointSiteId` i uprawnień Graph     |
| **Obrazy (dowolny kontekst)** | Osadzane bezpośrednio w kodowaniu Base64 | Działa od razu                                  |

### Dlaczego czaty grupowe wymagają SharePoint

Boty używają tożsamości aplikacji, natomiast zasób `/me` usługi Microsoft Graph [wymaga zalogowanego użytkownika](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia interfejsu API Graph** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — przesyłanie plików do SharePoint.
   - `ChatMember.Read.All` (Application) — uprawnienie o najmniejszych wymaganych uprawnieniach w całej dzierżawie do wysyłania plików w czatach grupowych. `Chat.Read.All` również działa i obejmuje już tę funkcję, gdy historia czatu grupowego jest włączona. Alternatywnie dla poszczególnych czatów użyj [uprawnienia zgody specyficznego dla zasobu](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Udziel zgody administratora** dla dzierżawy.
3. **Uzyskaj identyfikator witryny SharePoint:**

   ```bash
   # Za pomocą Graph Explorer lub curl z prawidłowym tokenem:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Przykład: dla witryny pod adresem "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Odpowiedź zawiera: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfiguracja OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... inna konfiguracja ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Sposób udostępniania

| Kontekst i uprawnienie                                                  | Sposób udostępniania                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| Kanał + `Sites.ReadWrite.All`                                         | Łącze udostępniania dla całej organizacji (dostęp ma każdy w organizacji) |
| Czat grupowy + `Sites.ReadWrite.All` + obsługiwane uprawnienie odczytu członków czatu | Łącze udostępniania dla poszczególnych użytkowników (dostęp mają tylko członkowie czatu) |
| Czat grupowy bez obsługiwanego uprawnienia odczytu członków czatu       | Wysyłanie zostaje bezpiecznie przerwane                        |

Udostępnianie poszczególnym użytkownikom jest bezpieczniejsze, ponieważ dostęp do pliku mają tylko uczestnicy czatu. OpenClaw wymaga pomyślnego wyszukania członków czatu grupowego; przekroczenia limitu czasu, błędy transportu, puste wyniki i odmowy Graph API powodują przerwanie wysyłania zamiast rozszerzenia dostępu na całą organizację.

### Zachowanie awaryjne

| Scenariusz                                                       | Wynik                                            |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Czat grupowy + plik + skonfigurowane uprawnienia SharePoint i członków | Przesłanie do SharePoint i wysłanie natywnej karty pliku |
| Czat grupowy + plik + brak uprawnień SharePoint lub członków     | Niepowodzenie z użytecznym błędem konfiguracji   |
| Kanał + plik + skonfigurowane `sharePointSiteId`                 | Przesłanie do SharePoint i wysłanie natywnej karty pliku |
| Czat osobisty + plik                                             | Przepływ FileConsentCard (działa bez SharePoint) |
| Dowolny kontekst + obraz                                         | Osadzenie zakodowane w Base64 (działa bez SharePoint) |

### Lokalizacja przechowywanych plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (Teams nie udostępnia natywnego API ankiet).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Głosy są zapisywane przez Gateway w bazie SQLite stanu Pluginu OpenClaw w lokalizacji `state/openclaw.sqlite`.
- Istniejące pliki `msteams-polls.json` są importowane przez `openclaw doctor --fix`, a nie przez działający Plugin.
- Gateway musi pozostawać online, aby zapisywać głosy.
- Ankiety nie publikują automatycznie podsumowań wyników i nie istnieje jeszcze CLI do obsługi wyników ankiet.

## Karty prezentacji

Semantyczne ładunki prezentacji można wysyłać do użytkowników lub konwersacji Teams za pomocą narzędzia `message`, CLI albo standardowego mechanizmu dostarczania odpowiedzi. OpenClaw renderuje je jako Teams Adaptive Cards na podstawie ogólnego kontraktu prezentacji.

Parametr `presentation` przyjmuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny. Przyciski są renderowane jako akcje przesłania Adaptive Card lub akcje URL. Menu wyboru nie są natywnie obsługiwane przez mechanizm renderowania Teams, dlatego przed dostarczeniem OpenClaw przekształca je w czytelny tekst.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Witaj",
    blocks: [{ type: "text", text: "Witaj!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Witaj","blocks":[{"type":"text","text":"Witaj!"}]}'
```

Szczegółowe informacje o formatach celów zawiera sekcja [Formaty celów](#target-formats) poniżej.

## Formaty celów

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ celu            | Format                           | Przykład                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Użytkownik (według identyfikatora) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Użytkownik (według nazwy) | `user:<display-name>`            | `user:John Smith` (wymaga Graph API)                                                                 |
| Grupa/kanał         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Grupa/kanał (format surowy) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` lub sam identyfikator Bot Framework `a:`/`8:orgid:`/`29:` |

**Przykłady CLI:**

```bash
# Wysłanie do użytkownika według identyfikatora
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Witaj"

# Wysłanie do użytkownika według nazwy wyświetlanej (uruchamia wyszukiwanie Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Witaj"

# Wysłanie do czatu grupowego lub kanału
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Witaj"

# Wysłanie karty prezentacji do konwersacji
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Witaj","blocks":[{"type":"text","text":"Witaj"}]}'
```

**Przykłady narzędzia agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Witaj!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Witaj",
    blocks: [{ type: "text", text: "Witaj" }],
  },
}
```

<Note>
Bez prefiksu `user:` nazwy są domyślnie rozpoznawane jako grupy lub zespoły. Podczas wskazywania osób według nazwy wyświetlanej należy zawsze używać `user:`.
</Note>

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe dopiero **po** interakcji użytkownika, ponieważ wtedy OpenClaw zapisuje odwołania do konwersacji.
- Informacje o `dmPolicy` i ograniczaniu za pomocą listy dozwolonych zawiera sekcja [/gateway/configuration](/pl/gateway/configuration).

## Identyfikatory zespołów i kanałów (częsty problem)

Parametr zapytania `groupId` w adresach URL Teams **NIE** jest identyfikatorem zespołu używanym w konfiguracji. Identyfikatory należy zamiast tego wyodrębniać ze ścieżki URL:

**Adres URL zespołu:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Identyfikator konwersacji zespołu (należy zdekodować URL)
```

**Adres URL kanału:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Identyfikator kanału (należy zdekodować URL)
```

**Na potrzeby konfiguracji:**

- Klucz zespołu = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`; starsze dzierżawy mogą wyświetlać `@thread.skype`, co również jest prawidłowe).
- Klucz kanału = segment ścieżki po `/channel/` (po zdekodowaniu URL).
- W routingu OpenClaw należy **ignorować** parametr zapytania `groupId`. Jest to identyfikator grupy Microsoft Entra, a nie identyfikator konwersacji Bot Framework używany w przychodzących działaniach Teams.

## Kanały prywatne

Boty mają ograniczoną obsługę kanałów prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne        |
| ---------------------------- | ------------------ | ---------------------- |
| Instalacja bota              | Tak                | Ograniczona            |
| Wiadomości w czasie rzeczywistym (Webhook) | Tak                | Mogą nie działać       |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej   |
| @wzmianki                    | Tak                | Jeśli bot jest dostępny |
| Historia Graph API           | Tak                | Tak (z uprawnieniami)  |

**Obejścia w przypadku niedziałających kanałów prywatnych:**

1. Do interakcji z botem należy używać kanałów standardowych.
2. Należy używać wiadomości bezpośrednich; użytkownicy zawsze mogą wysłać wiadomość bezpośrednio do bota.
3. Do dostępu do historii należy używać Graph API (wymaga `ChannelMessage.Read.All`).

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie są wyświetlane na kanałach:** brakuje uprawnień Graph lub zgody administratora. Należy ponownie zainstalować aplikację Teams oraz całkowicie zamknąć i ponownie otworzyć Teams.
- **Brak odpowiedzi na kanale:** wzmianki są domyślnie wymagane; należy ustawić `channels.msteams.requireMention=false` lub skonfigurować tę opcję dla poszczególnych zespołów/kanałów.
- **Niezgodność wersji (Teams nadal wyświetla stary manifest):** należy usunąć i ponownie dodać aplikację oraz całkowicie zamknąć Teams, aby odświeżyć dane.
- **401 Unauthorized z Webhooka:** jest to oczekiwane podczas ręcznego testowania bez tokenu JWT Azure; oznacza, że punkt końcowy jest osiągalny, ale uwierzytelnianie nie powiodło się. Do prawidłowego testowania należy użyć Azure Web Chat.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon o rozmiarze 0 bajtów. Należy utworzyć prawidłowe ikony PNG (32x32 dla `outline.png`, 192x192 dla `color.png`).
- **"webApplicationInfo.Id already in use":** aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw należy ją znaleźć i odinstalować albo odczekać 5-10 minut na propagację.
- **"Something went wrong" podczas przesyłania:** zamiast tego należy przesłać aplikację przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otworzyć narzędzia deweloperskie przeglądarki (F12) → kartę Network i sprawdzić treść odpowiedzi zawierającą rzeczywisty błąd.
- **Niepowodzenie instalacji bezpośredniej:** należy spróbować użyć opcji "Upload an app to your org's app catalog" zamiast "Upload a custom app"; często pozwala to ominąć ograniczenia instalacji bezpośredniej.

### Uprawnienia RSC nie działają

1. Należy sprawdzić, czy `webApplicationInfo.id` dokładnie odpowiada identyfikatorowi App ID bota.
2. Należy ponownie przesłać aplikację i zainstalować ją ponownie w zespole/czacie.
3. Należy sprawdzić, czy administrator organizacji nie zablokował uprawnień RSC.
4. Należy potwierdzić użycie właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych.

## Materiały referencyjne

- [Tworzenie Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Portal deweloperski Teams](https://dev.teams.microsoft.com/apps) - tworzenie aplikacji Teams i zarządzanie nimi
- [Schemat manifestu aplikacji Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Odbieranie wiadomości kanału za pomocą RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Dokumentacja uprawnień RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Obsługa plików przez boty Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Wiadomości proaktywne](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams do zarządzania botami

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie w wiadomościach prywatnych i proces parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i ograniczanie dostępu na podstawie wzmianek
- [Trasowanie kanałów](/pl/channels/channel-routing) - trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
