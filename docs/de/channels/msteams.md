---
read_when:
    - Arbeiten an Funktionen des Microsoft-Teams-Kanals
summary: Status, Funktionen und Konfiguration der Microsoft-Teams-Bot-Unterstützung
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T12:27:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Status: Text- und DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen explizites `upload-file` für Sendungen bereit, bei denen die Datei zuerst kommt.

## Mitgeliefertes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Versionen als mitgeliefertes Plugin ausgeliefert; im normalen paketierten Build ist keine separate Installation erforderlich.

Installieren Sie bei einem älteren Build oder einer benutzerdefinierten Installation, die das mitgelieferte Teams ausschließt, das npm-Paket direkt:

```bash
openclaw plugins install @openclaw/msteams
```

Verwenden Sie das Paket ohne Versionsangabe, um dem aktuellen offiziellen Release-Tag zu folgen. Legen Sie nur dann eine genaue Version fest, wenn Sie eine reproduzierbare Installation benötigen.

Lokaler Checkout (Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) übernimmt Bot-Registrierung, Manifest-Erstellung und Generierung von Anmeldedaten in einem einzigen Befehl.

**1. Installieren und anmelden**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # prüfen, ob Sie angemeldet sind, und Mandanteninformationen anzeigen
```

<Note>
Die Teams CLI befindet sich derzeit in der Vorschauphase. Befehle und Flags können sich zwischen Versionen ändern.
</Note>

**2. Einen Tunnel starten** (Teams kann localhost nicht erreichen)

Installieren und authentifizieren Sie bei Bedarf die devtunnel CLI ([Leitfaden für die ersten Schritte](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Einmalige Einrichtung (dauerhafte URL über Sitzungen hinweg):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# In jeder Entwicklungssitzung:
devtunnel host my-openclaw-bot
# Ihr Endpunkt: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` ist erforderlich, da Teams sich nicht bei devtunnels authentifizieren kann. Jede eingehende Bot-Anfrage wird weiterhin vom Teams SDK validiert.
</Note>

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (URLs können sich bei jeder Sitzung ändern).

**3. Die App erstellen**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Dadurch wird eine Entra-ID-Anwendung (Azure AD) erstellt, ein Clientgeheimnis generiert, ein Teams-App-Manifest (mit Symbolen) erstellt und hochgeladen sowie ein von Teams verwalteter Bot registriert (kein Azure-Abonnement erforderlich). Die Ausgabe enthält `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` und eine **Teams App ID**; außerdem wird angeboten, die App direkt in Teams zu installieren.

**4. OpenClaw konfigurieren** – mit den Anmeldedaten aus der Ausgabe:

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

Alternativ können Sie Umgebungsvariablen direkt verwenden: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Die App in Teams installieren**

`teams app create` fordert Sie zur Installation der App auf; wählen Sie "Install in Teams". So erhalten Sie den Installationslink später:

```bash
teams app get <teamsAppId> --install-link
```

**6. Prüfen, ob alles funktioniert**

```bash
teams app doctor <teamsAppId>
```

Führt Diagnosen für Bot-Registrierung, AAD-App-Konfiguration, Manifest-Gültigkeit und SSO-Einrichtung aus.

Für die Produktion sollten Sie anstelle von Clientgeheimnissen die [föderierte Authentifizierung](#federated-authentication-certificate-plus-managed-identity) (Zertifikat oder verwaltete Identität) in Betracht ziehen.

<Note>
Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setzen Sie `channels.msteams.groupAllowFrom`, oder verwenden Sie `groupPolicy: "open"`, um alle Mitglieder zuzulassen (Erwähnung weiterhin erforderlich).
</Note>

## Ziele

- Kommunizieren Sie über Teams-DMs, Gruppenchats oder Kanäle mit OpenClaw.
- Halten Sie das Routing deterministisch: Antworten gehen immer an den Kanal zurück, über den sie eingegangen sind.
- Verwenden Sie standardmäßig ein sicheres Kanalverhalten (Erwähnungen sind erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsänderungen

Standardmäßig kann Microsoft Teams durch `/config set|unset` ausgelöste Konfigurationsaktualisierungen schreiben (erfordert `commands.config: true`).

So deaktivieren Sie dies:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffskontrolle (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden bis zur Genehmigung ignoriert.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs oder statische Absenderzugriffsgruppen wie `accessGroup:core-team` verwenden.
- Verlassen Sie sich für Zulassungslisten nicht auf den Abgleich von UPN/Anzeigenamen; diese können sich ändern. OpenClaw deaktiviert den direkten Namensabgleich standardmäßig; aktivieren Sie ihn mit `channels.msteams.dangerouslyAllowNameMatching: true`.
- Der Assistent kann Namen über Microsoft Graph in IDs auflösen, sofern die Anmeldedaten dies erlauben.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, sofern Sie nicht `groupAllowFrom` hinzufügen). `channels.defaults.groupPolicy` kann den gemeinsamen Standardwert überschreiben, wenn `channels.msteams.groupPolicy` nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender oder statischen Absenderzugriffsgruppen in Gruppenchats/Kanälen eine Ausführung auslösen können (greift auf `channels.msteams.allowFrom` zurück).
- Setzen Sie `groupPolicy: "open"`, um alle Mitglieder zuzulassen (standardmäßig ist weiterhin eine Erwähnung erforderlich).
- Um **alle** Kanäle zu blockieren, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

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

**Team- und Kanal-Zulassungsliste**

- Begrenzen Sie Gruppen-/Kanalantworten, indem Sie Teams und Kanäle unter `channels.msteams.teams` auflisten.
- Verwenden Sie stabile Teams-Unterhaltungs-IDs aus Teams-Links als Schlüssel, nicht veränderliche Anzeigenamen (siehe [Team- und Kanal-IDs](#team-and-channel-ids-common-gotcha)).
- Wenn `groupPolicy="allowlist"` und eine Teams-Zulassungsliste vorhanden sind, werden nur aufgeführte Teams/Kanäle akzeptiert (Erwähnung erforderlich).
- Der Konfigurationsassistent akzeptiert `Team/Channel`-Einträge und speichert sie für Sie.
- Beim Start löst OpenClaw Namen in Team-/Kanal- und Benutzer-Zulassungslisten in IDs auf (sofern Graph-Berechtigungen dies erlauben) und protokolliert die Zuordnung. Nicht aufgelöste Namen werden wie eingegeben beibehalten, aber beim Routing ignoriert, sofern `channels.msteams.dangerouslyAllowNameMatching: true` nicht gesetzt ist.

Beispiel:

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
<summary><strong>Manuelle Einrichtung (ohne Teams CLI)</strong></summary>

### Funktionsweise

1. Stellen Sie sicher, dass das Microsoft-Teams-Plugin verfügbar ist (in aktuellen Versionen mitgeliefert).
2. Erstellen Sie einen **Azure Bot** (App-ID + Geheimnis + Mandanten-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die unten aufgeführten RSC-Berechtigungen enthält.
4. Laden/installieren Sie die Teams-App in einem Team (oder im persönlichen Bereich für DMs).
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder über Umgebungsvariablen) und starten Sie den Gateway.
6. Der Gateway lauscht standardmäßig unter `/api/messages` auf Bot-Framework-Webhook-Datenverkehr.

### Schritt 1: Azure Bot erstellen

1. Rufen Sie [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) auf.
2. Füllen Sie die Registerkarte **Basics** aus:

   | Feld               | Wert                                                         |
   | ------------------ | ------------------------------------------------------------ |
   | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wählen Sie Ihr Azure-Abonnement aus                          |
   | **Resource group** | Erstellen Sie eine neue oder verwenden Sie eine vorhandene   |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                               |
   | **Type of App**    | **Single Tenant** (empfohlen; siehe Hinweis unten)            |
   | **Creation type**  | **Create new Microsoft App ID**                              |

<Warning>
Die Erstellung neuer mandantenfähiger Bots wurde nach dem 2025-07-31 eingestellt. Verwenden Sie **Single Tenant** für neue Bots.
</Warning>

3. Klicken Sie auf **Review + create** und anschließend auf **Create** (~1-2 Minuten).

### Schritt 2: Anmeldedaten abrufen

1. Azure-Bot-Ressource → **Configuration** → kopieren Sie die **Microsoft App ID** (Ihre `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → kopieren Sie den **Value** (Ihr `appPassword`).
3. **Overview** → kopieren Sie die **Directory (tenant) ID** (Ihre `tenantId`).

### Schritt 3: Messaging-Endpunkt konfigurieren

1. Azure Bot → **Configuration**.
2. Legen Sie den **Messaging endpoint** fest:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling)).

### Schritt 4: Teams-Kanal aktivieren

1. Azure Bot → **Channels**.
2. Klicken Sie auf **Microsoft Teams** → Configure → Save.
3. Akzeptieren Sie die Nutzungsbedingungen.

### Schritt 5: Teams-App-Manifest erstellen

- Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
- Bereiche: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (für die Dateiverarbeitung im persönlichen Bereich erforderlich).
- Fügen Sie RSC-Berechtigungen hinzu (siehe [RSC-Berechtigungen](#current-teams-rsc-permissions-manifest)).
- Erstellen Sie Symbole: `outline.png` (32x32) und `color.png` (192x192).
- Packen Sie `manifest.json`, `outline.png` und `color.png` gemeinsam in eine ZIP-Datei.

### Schritt 6: OpenClaw konfigurieren

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

Umgebungsvariablen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Schritt 7: Gateway ausführen

Der Teams-Kanal startet automatisch, wenn das Plugin verfügbar ist und die `msteams`-Konfiguration Anmeldedaten enthält.

</details>

## Föderierte Authentifizierung (Zertifikat plus verwaltete Identität)

Für die Produktion unterstützt OpenClaw über `channels.msteams.authType: "federated"` die **föderierte Authentifizierung** als Alternative zu Clientgeheimnissen. Es gibt zwei Methoden:

### Option A: Zertifikatbasierte Authentifizierung

Verwenden Sie ein bei Ihrer Entra-ID-App-Registrierung registriertes PEM-Zertifikat.

**Einrichtung:**

1. Generieren oder beschaffen Sie ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → laden Sie das öffentliche Zertifikat hoch.

**Konfiguration:**

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

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B: Azure Managed Identity

Verwenden Sie Azure Managed Identity für die passwortlose Authentifizierung auf Azure-Infrastruktur (AKS, App Service, Azure-VMs).

**Funktionsweise:**

1. Der Bot-Pod/die VM verfügt über eine verwaltete Identität (system- oder benutzerseitig zugewiesen).
2. Anmeldedaten für eine föderierte Identität verknüpfen die verwaltete Identität mit der Entra-ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Token vom Azure-IMDS-Endpunkt abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter verwalteter Identität (AKS-Workloadidentität, App Service, VM).
- Für die Entra-ID-App-Registrierung erstellte Anmeldeinformation für eine Verbundidentität.
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) aus dem Pod/der VM.

**Konfiguration (systemseitig zugewiesene verwaltete Identität):**

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

**Konfiguration (benutzerseitig zugewiesene verwaltete Identität):** Fügen Sie dem obigen Block `managedIdentityClientId: "<MI_CLIENT_ID>"` hinzu.

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur benutzerseitig zugewiesen)

### Einrichtung der AKS-Workloadidentität

Für AKS-Bereitstellungen mit Workloadidentität:

1. **Aktivieren Sie die Workloadidentität** für Ihren AKS-Cluster.
2. **Erstellen Sie eine Anmeldeinformation für eine Verbundidentität** für die Entra-ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Versehen Sie das Kubernetes-Dienstkonto mit einer Annotation**, die die App-Client-ID enthält:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Versehen Sie den Pod mit einem Label**, um die Workloadidentität einzubinden:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Erlauben Sie Netzwerkzugriff** auf IMDS (`169.254.169.254`): Wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel für `169.254.169.254/32` auf Port 80 hinzu.

### Vergleich der Authentifizierungstypen

| Methode                  | Konfiguration                                  | Vorteile                                      | Nachteile                                           |
| ------------------------ | ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| **Clientgeheimnis**      | `appPassword`                             | Einfache Einrichtung                          | Rotation des Geheimnisses erforderlich, unsicherer  |
| **Zertifikat**           | `authType: "federated"` + `certificatePath`       | Kein geteiltes Geheimnis über das Netzwerk    | Zusätzlicher Aufwand für die Zertifikatsverwaltung  |
| **Verwaltete Identität** | `authType: "federated"` + `useManagedIdentity`       | Kennwortlos, keine Geheimnisse zu verwalten   | Azure-Infrastruktur erforderlich                    |

`certificateThumbprint` kann zusammen mit `certificatePath` festgelegt werden, wird vom Authentifizierungspfad derzeit jedoch nicht gelesen; es wird ausschließlich für die Vorwärtskompatibilität akzeptiert.

**Standard:** Wenn `authType` nicht festgelegt ist, verwendet OpenClaw die Authentifizierung mit Clientgeheimnis (`appPassword`). Bestehende Konfigurationen funktionieren unverändert weiter.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie einen beständigen Entwicklungstunnel, damit die URL sitzungsübergreifend stabil bleibt:

```bash
# Einmalige Einrichtung:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Für jede Entwicklungssitzung:
devtunnel host my-openclaw-bot
```

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (URLs können sich bei jeder Sitzung ändern).

Wenn sich die Tunnel-URL ändert, aktualisieren Sie den Endpunkt:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot testen

**Diagnose ausführen:**

```bash
teams app doctor <teamsAppId>
```

Prüft Bot-Registrierung, AAD-App, Manifest und SSO-Konfiguration in einem Durchlauf.

**Testnachricht senden:**

1. Installieren Sie die Teams-App (Installationslink aus `teams app get <id> --install-link`).
2. Suchen Sie den Bot in Teams und senden Sie ihm eine Direktnachricht.
3. Prüfen Sie die Gateway-Protokolle auf eingehende Aktivität.

## Umgebungsvariablen

Diese authentifizierungsbezogenen Konfigurationsschlüssel können anstelle von `openclaw.json` über Umgebungsvariablen festgelegt werden (andere Konfigurationsschlüssel wie `groupPolicy` oder `historyLimit` sind nur in der Konfiguration verfügbar):

| Umgebungsvariable                     | Konfigurationsschlüssel     | Hinweise                                      |
| ------------------------------------- | --------------------------- | --------------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`          |                                               |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`          |                                               |
| `MSTEAMS_TENANT_ID`                   | `tenantId`          |                                               |
| `MSTEAMS_AUTH_TYPE`                   | `authType`          | `"secret"` oder `"federated"`    |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`          | Verbundidentität + Zertifikat                 |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`          | akzeptiert, für die Authentifizierung nicht erforderlich |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`          | Verbundidentität + verwaltete Identität       |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`          | nur benutzerseitig zugewiesene verwaltete Identität |

## Aktion für Mitgliedsinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte Aktion `member-info` bereit, mit der Agenten und Automatisierungen verifizierte Teilnehmerdetails für eine konfigurierte Unterhaltung auflösen können.

Anforderungen:

- `ChannelSettings.Read.Group`- und `TeamMember.Read.Group`-RSC-Berechtigungen (bereits im empfohlenen Manifest enthalten).

Die Aktion ist verfügbar, sobald Graph-Anmeldeinformationen konfiguriert sind; es gibt keinen separaten Schalter `channels.msteams.actions.memberInfo`.
Abfragen in Standardkanälen geben die übereinstimmende Teamteilnehmeridentität, den Anzeigenamen, die E-Mail-Adresse und die Rollen zurück.
In der aktuellen Direktnachricht oder im aktuellen Gruppenchat kann die Aktion die stabile Benutzer-ID des vertrauenswürdigen Absenders zurückgeben.
Mitgliedsabfragen in privaten/freigegebenen Kanälen und nicht aktuellen Chats erfordern zusätzliche Teilnehmerberechtigungen
und werden von der standardmäßigen Berechtigungsbasis abgelehnt.

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden. Fällt auf `messages.groupChat.historyLimit` zurück und verwendet anschließend standardmäßig 50. Legen Sie `0` fest, um dies zu deaktivieren.
- Der abgerufene Threadverlauf wird anhand von Absender-Zulassungslisten (`allowFrom` / `groupAllowFrom`) gefiltert, sodass die anfängliche Befüllung des Threadkontexts nur Nachrichten von zugelassenen Absendern umfasst.
- Der Kontext zitierter Anhänge (aus dem HTML des Skype-Antwortschemas in den eigenen Anhängen einer Antwort geparst) wird ungefiltert weitergegeben; derzeit wird nur bei der anfänglichen Befüllung des Threadverlaufs der Filter der Absender-Zulassungsliste angewendet.
- Der Direktnachrichtenverlauf kann mit `channels.msteams.dmHistoryLimit` (Benutzerbeiträge) begrenzt werden. Benutzerspezifische Überschreibungen: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **vorhandenen ressourcenspezifischen Berechtigungen** im Manifest unserer Teams-App. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Teambereich):**

- `ChannelMessage.Read.Group` (Anwendung) – alle Kanalnachrichten ohne @Erwähnung empfangen
- `ChannelMessage.Send.Group` (Anwendung)
- `Member.Read.Group` (Anwendung)
- `Owner.Read.Group` (Anwendung)
- `ChannelSettings.Read.Group` (Anwendung)
- `TeamMember.Read.Group` (Anwendung)
- `TeamSettings.Read.Group` (Anwendung)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Anwendung) – alle Gruppenchatnachrichten ohne @Erwähnung empfangen

Fügen Sie RSC-Berechtigungen über die Teams-CLI hinzu:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Beispiel für ein Teams-Manifest (geschwärzt)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetzen Sie IDs und URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Ihre Organisation",
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

### Einschränkungen des Manifests (Pflichtfelder)

- `bots[].botId` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Bereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lese-/Sendeberechtigungen für Kanalverkehr enthalten.

### Vorhandene App aktualisieren

```bash
# Manifest herunterladen, bearbeiten und erneut hochladen
teams app manifest download <teamsAppId> manifest.json
# manifest.json lokal bearbeiten ...
teams app manifest upload manifest.json <teamsAppId>
# Die Version wird automatisch erhöht, wenn sich der Inhalt geändert hat
```

Installieren Sie die App nach der Aktualisierung in jedem Team erneut und **beenden Sie Teams vollständig und starten Sie es neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen.

<details>
<summary>Manuelle Manifestaktualisierung (ohne CLI)</summary>

1. Aktualisieren Sie `manifest.json` mit den neuen Einstellungen.
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`).
3. **Packen Sie das Manifest erneut als ZIP-Datei** mit den Symbolen (`manifest.json`, `outline.png`, `color.png`).
4. Laden Sie die neue ZIP-Datei hoch:
   - **Teams Admin Center:** Teams apps → Manage apps → suchen Sie Ihre App → Upload new version.
   - **Querladen:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Funktionen: nur RSC oder Graph

### Mit **ausschließlich Teams RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- **Textinhalt** von Kanalnachrichten lesen.
- **Textinhalt** von Kanalnachrichten senden.
- Dateianhänge in **persönlichen Nachrichten (DM)** empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanälen/Gruppen (die Nutzlast enthält nur einen HTML-Platzhalter).
- In SharePoint/OneDrive gespeicherte Anhänge herunterladen.
- Nachrichtenverlauf lesen, der über das aktuelle Webhook-Ereignis hinausgeht.

### Mit **Teams RSC + Microsoft-Graph-Anwendungsberechtigungen**

Ergänzt:

- Gehostete Inhalte herunterladen (in Nachrichten eingefügte Bilder).
- In SharePoint/OneDrive gespeicherte Dateianhänge herunterladen.
- Kanal-/Chatnachrichtenverlauf über Graph lesen.

### RSC im Vergleich zur Graph API

| Funktion                     | RSC-Berechtigungen     | Graph API                                       |
| ---------------------------- | ---------------------- | ----------------------------------------------- |
| **Echtzeitnachrichten**      | Ja (über Webhook)      | Nein (nur Polling)                              |
| **Historische Nachrichten**  | Nein                   | Ja (Verlauf kann abgefragt werden)              |
| **Einrichtungsaufwand**      | Nur App-Manifest       | Erfordert Administratoreinwilligung + Tokenfluss |
| **Funktioniert offline**     | Nein (muss ausgeführt werden) | Ja (jederzeit abfragbar)                 |

**Fazit:** RSC dient zum Abhören in Echtzeit; die Graph API dient dem historischen Zugriff. Um offline verpasste Nachrichten nachträglich abzurufen, benötigen Sie die Graph API mit `ChannelMessage.Read.All` (erfordert Administratoreinwilligung).

## Graph-gestützte Medien und Verläufe

Aktivieren Sie nur die Microsoft-Graph-Anwendungsberechtigungen, die für die von Ihnen verwendeten Teams-Bereiche und -Daten erforderlich sind:

1. Entra ID (Azure AD) **App Registration** → Graph-**Application permissions** hinzufügen:
   - `ChannelMessage.Read.All` für Kanalanhänge und Kanalverläufe.
   - `Chat.Read.All` für Gruppenchat-Anhänge und Gruppenchat-Verläufe.
   - `Files.Read.All`, wenn Anhangsbytes aus dem SharePoint-/OneDrive-Speicher heruntergeladen werden müssen; reine Verlaufskonfigurationen benötigen diese Berechtigung nicht.
2. **Grant admin consent** für den Mandanten.
3. Erhöhen Sie die **Manifestversion** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams neu**.
4. **Beenden Sie Teams vollständig und starten Sie es neu**, um zwischengespeicherte App-Metadaten zu löschen.

### Wiederherstellung von Kanal-/Gruppendateien (`graphMediaFallback`)

Teams kann Dateimarkierungen aus der an einen Bot gesendeten HTML-Aktivität entfernen. In diesem Fall ist die Bot-Framework-Aktivität nicht von einer gewöhnlichen HTML-Nachricht zu unterscheiden; die vollständige Anhangsreferenz ist nur in der Graph-Kopie der Nachricht vorhanden.

Aktivieren Sie den Fallback, nachdem Sie die oben genannten Berechtigungen erteilt haben:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Dies gilt nur für Kanäle und Gruppenchats. Es fügt jeweils eine Graph-Nachrichtenabfrage hinzu, wenn eine HTML-Aktivität keine direkt herunterladbaren Medien hervorgebracht hat, einschließlich gewöhnlicher Nachrichten oder Nachrichten, die nur eine Erwähnung enthalten. Der Standardwert ist `false`, damit bestehende Installationen nicht automatisch zusätzlichen Graph-Datenverkehr oder Berechtigungsfehler verursachen.

**Benutzererwähnungen:** @Erwähnungen funktionieren ohne zusätzliche Konfiguration für Benutzer, die bereits an der Unterhaltung teilnehmen. Um Benutzer, die **nicht an der aktuellen Unterhaltung teilnehmen**, dynamisch zu suchen und zu erwähnen, fügen Sie die Berechtigung `User.Read.All` (Anwendung) hinzu und erteilen Sie die Administratoreinwilligung.

## Bekannte Einschränkungen

### Webhook-Zeitüberschreitungen

Teams stellt Nachrichten über einen HTTP-Webhook zu. OpenClaw wendet feste HTTP-Server-Zeitüberschreitungen auf diesen Webhook-Listener an: 30 s Inaktivität, insgesamt 30 s pro Anfrage und 15 s für den Empfang der Header. Für optionale eingehende Medien und die Kontextanreicherung gilt ein gemeinsames Budget von 10 Sekunden, aber das Teams SDK wartet weiterhin auf den Agentendurchlauf, bevor es die Webhook-Antwort zurückgibt. Wenn der gesamte Durchlauf das Wiederholungszeitfenster von Teams überschreitet, kann Folgendes auftreten:

- Teams versucht erneut, die Nachricht zuzustellen (wodurch Duplikate entstehen).
- Antworten gehen verloren.

Antworten werden proaktiv gesendet, sobald der Agent antwortet. Langsame Agentendurchläufe können auf Teams-Seite jedoch weiterhin Wiederholungen oder Duplikate verursachen.

### Unterstützung für Teams-Clouds und Dienst-URLs

Dieser SDK-gestützte Teams-Pfad wurde für die öffentliche Microsoft-Teams-Cloud live validiert.

Eingehende Antworten verwenden den eingehenden Teams-SDK-Durchlaufkontext. Kontextunabhängige proaktive Vorgänge – Senden, Bearbeiten, Löschen, Karten, Umfragen, Dateizustimmungsnachrichten und in die Warteschlange gestellte lang laufende Antworten – verwenden die gespeicherte Unterhaltungsreferenz `serviceUrl`. Die öffentliche Cloud verwendet standardmäßig die öffentliche Cloud-Umgebung des Teams SDK und erlaubt gespeicherte Referenzen auf dem öffentlichen Teams-Connector-Host: `https://smba.trafficmanager.net/`.

Die öffentliche Cloud ist die Standardeinstellung. Für normale Bots in der öffentlichen Cloud müssen Sie weder `channels.msteams.cloud` noch `channels.msteams.serviceUrl` festlegen.

Legen Sie für nicht öffentliche Teams-Clouds `cloud` und die passende Grenze für proaktive Vorgänge fest, sobald Microsoft eine veröffentlicht:

- `channels.msteams.cloud` wählt die Cloud-Voreinstellung des Teams SDK für Authentifizierung, JWT-Validierung, Token-Dienste und den Graph-Bereich aus.
- `channels.msteams.serviceUrl` wählt die Bot-Connector-Endpunktgrenze aus, anhand derer gespeicherte Unterhaltungsreferenzen vor proaktivem Senden, Bearbeiten und Löschen sowie vor Karten, Umfragen, Dateizustimmungsnachrichten und in die Warteschlange gestellten lang laufenden Antworten validiert werden. Sie ist für die SDK-Clouds USGov und DoD erforderlich. Für China/21Vianet verwendet OpenClaw die SDK-Voreinstellung `China` und akzeptiert gespeicherte/konfigurierte Dienst-URLs nur auf Azure-China-Hosts des Bot-Framework-Kanals.

Microsoft veröffentlicht die globalen proaktiven Bot-Connector-Endpunkte im Abschnitt [Unterhaltung erstellen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) der Teams-Dokumentation zu proaktiven Nachrichten. Verwenden Sie, sofern verfügbar, `serviceUrl` aus der eingehenden Aktivität; verwenden Sie andernfalls die nachstehende Tabelle von Microsoft.

| Teams-Umgebung  | OpenClaw-Konfiguration                                      | Proaktive `serviceUrl`                        |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Öffentlich       | Keine Cloud-/serviceUrl-Konfiguration erforderlich          | `https://smba.trafficmanager.net/teams`                                 |
| GCC              | `serviceUrl` festlegen; es gibt keine separate Cloud-Voreinstellung des Teams SDK | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                    | `https://smba.infra.gov.teams.microsoft.us/teams`                                 |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                    | `https://smba.infra.dod.teams.microsoft.us/teams`                                 |
| China/21Vianet   | `cloud: "China"`                                          | `serviceUrl` aus der eingehenden Aktivität verwenden |

Beispiel für GCC, wo Microsoft eine separate proaktive Dienst-URL dokumentiert, das Teams SDK aber keine separate GCC-Cloud-Voreinstellung bereitstellt:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Beispiel für GCC High:

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

`channels.msteams.serviceUrl` ist auf unterstützte Microsoft-Teams-Bot-Connector-Hosts beschränkt. Wenn eine Dienst-URL konfiguriert ist, prüft OpenClaw vor dem proaktiven Senden, Bearbeiten und Löschen sowie vor Karten, Umfragen oder in die Warteschlange gestellten lang laufenden Antworten, ob `serviceUrl` der gespeicherten Unterhaltung denselben Host verwendet. Bei der standardmäßigen Konfiguration für die öffentliche Cloud schlägt OpenClaw sicherheitsgerichtet fehl, wenn eine gespeicherte Unterhaltung auf einen Host außerhalb des öffentlichen Teams Connectors verweist. Empfangen Sie nach einer Änderung der Cloud-/Dienst-URL-Einstellungen eine neue Nachricht aus der Unterhaltung, damit die gespeicherte Unterhaltungsreferenz aktuell ist.

China/21Vianet besitzt in Microsofts Tabelle der proaktiven Teams-Endpunkte keine separate globale proaktive `smba`-URL. Konfigurieren Sie `cloud: "China"`, damit das Teams SDK die Azure-China-Endpunkte für Authentifizierung, Token und JWT verwendet. Proaktives Senden erfordert dann eine gespeicherte Unterhaltungsreferenz aus einer eingehenden China-Teams-Aktivität oder eine explizit konfigurierte Dienst-URL innerhalb der Azure-China-Grenze für Bot-Framework-Kanäle (`*.botframework.azure.cn`). Graph-gestützte Teams-Hilfsfunktionen sind für `cloud: "China"` deaktiviert, bis OpenClaw Graph-Anfragen über den Azure-China-Graph-Endpunkt leitet.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack- oder Discord-Markdown:

- Grundlegende Formatierungen funktionieren: **fett**, _kursiv_, `code`, Links.
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt dargestellt.
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten).

## Konfiguration

Wichtige Einstellungen (gemeinsame Kanalmuster finden Sie unter [/gateway/configuration](/de/gateway/configuration)):

- `channels.msteams.enabled`: den Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.cloud`: Cloud-Umgebung des Teams SDK (`Public`, `USGov`, `USGovDoD` oder `China`; Standardwert `Public`). Für USGov-/DoD-SDK-Clouds mit `serviceUrl` festlegen; China verwendet die SDK-Voreinstellung und gespeicherte Azure China Bot Framework-Konversationsreferenzen, wobei Graph-gestützte Hilfsfunktionen deaktiviert bleiben, bis das Azure-China-Graph-Routing verfügbar ist.
- `channels.msteams.serviceUrl`: Grenze der Bot-Connector-Dienst-URL für proaktive SDK-Vorgänge. Die öffentliche Cloud verwendet den SDK-Standardwert; für GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High oder DoD festlegen. China akzeptiert Azure China Bot Framework-Kanalhosts, wenn die gespeicherte Konversationsreferenz aus dem von 21Vianet betriebenen Teams stammt.
- `channels.msteams.webhook.port` (Standardwert `3978`).
- `channels.msteams.webhook.path` (Standardwert `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standardwert `pairing`).
- `channels.msteams.allowFrom`: DM-Zulassungsliste (AAD-Objekt-IDs empfohlen). Der Assistent löst Namen während der Einrichtung in IDs auf, sofern Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Notfallumschalter, um den veränderlichen Abgleich von UPNs/Anzeigenamen und das direkte Routing anhand von Team-/Kanalnamen wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Größe ausgehender Textabschnitte in Zeichen (Standardwert `4000`; unabhängig von einem höheren konfigurierten Wert hart auf `4000` begrenzt).
- `channels.msteams.streaming.chunkMode`: `length` (Standardwert) oder `newline`, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.msteams.mediaAllowHosts`: Zulassungsliste für Hosts eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: Zulassungsliste für das Anhängen von Authorization-Headern bei erneuten Medienabrufen (standardmäßig Graph- und Bot-Framework-Hosts).
- `channels.msteams.graphMediaFallback`: Graph-Nachrichtensuchen aktivieren, wenn Kanal-/Gruppen-HTML keine Dateimarkierungen enthält (Standardwert `false`; siehe [Wiederherstellung von Kanal-/Gruppendateien](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: kanalspezifische Überschreibung der Mediengrößenbegrenzung in MB. Fällt auf `agents.defaults.mediaMaxMb` zurück, wenn nicht festgelegt.
- `channels.msteams.requireMention`: @Erwähnung in Kanälen/Gruppen voraussetzen (Standardwert `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: teamspezifische Überschreibung.
- `channels.msteams.teams.<teamId>.requireMention`: teamspezifische Überschreibung.
- `channels.msteams.teams.<teamId>.tools`: standardmäßige teamspezifische Überschreibungen der Tool-Richtlinie (`allow`/`deny`/`alsoAllow`), die verwendet werden, wenn keine Kanalüberschreibung vorhanden ist.
- `channels.msteams.teams.<teamId>.toolsBySender`: standardmäßige teamspezifische und absenderspezifische Überschreibungen der Tool-Richtlinie (Platzhalter `"*"` unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: kanalspezifische Überschreibung.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: kanalspezifische Überschreibung.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: kanalspezifische Überschreibungen der Tool-Richtlinie (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: kanal- und absenderspezifische Überschreibungen der Tool-Richtlinie (Platzhalter `"*"` unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden: `channel:`, `id:`, `e164:`, `username:`, `name:` (veraltete Schlüssel ohne Präfix werden weiterhin ausschließlich `id:` zugeordnet).
- `channels.msteams.authType`: Authentifizierungstyp – `"secret"` (Standardwert) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatsdatei (föderierte Authentifizierung und Zertifikatsauthentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikatfingerabdruck; wird akzeptiert, ist für die Authentifizierung jedoch nicht erforderlich.
- `channels.msteams.useManagedIdentity`: Authentifizierung mit verwalteter Identität aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für eine benutzerseitig zugewiesene verwaltete Identität.
- `channels.msteams.sharePointSiteId`: SharePoint-Website-ID für Datei-Uploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card zur Begrüßung, die beim ersten DM-/Gruppenkontakt angezeigt wird, sowie deren Schaltflächen mit vorgeschlagenen Prompts.
- `channels.msteams.responsePrefix`: Text, der ausgehenden Antworten vorangestellt wird.
- `channels.msteams.feedbackEnabled` (Standardwert `true`), `channels.msteams.feedbackReflection` (Standardwert `true`), `channels.msteams.feedbackReflectionCooldownMs`: Feedback mit „Daumen hoch“/„Daumen runter“ zu Antworten und anschließende Reflexion bei negativem Feedback.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: Bot-Framework-OAuth-Verbindung und delegierte Graph-Bereiche für SSO-gestützte Abläufe; `sso.enabled: true` erfordert `sso.connectionName`.

## Routing und Sitzungen

- Sitzungsschlüssel folgen dem standardmäßigen Agentenformat (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten verwenden gemeinsam die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads oder Beiträge

Teams bietet für dasselbe zugrunde liegende Datenmodell zwei Kanaloberflächen:

| Stil                     | Beschreibung                                                    | Empfohlener Wert für `replyStyle` |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------------- |
| **Beiträge** (klassisch) | Nachrichten erscheinen als Karten mit darunterliegenden Antworten in Threads | `thread` (Standardwert) |
| **Threads** (wie Slack)  | Nachrichten werden linear dargestellt, ähnlich wie in Slack    | `top-level`                       |

**Das Problem:** Die Teams-API stellt nicht bereit, welchen Oberflächenstil ein Kanal verwendet. Wenn Sie den falschen Wert für `replyStyle` verwenden:

- `thread` in einem Kanal im Threads-Stil → Antworten erscheinen unpassend verschachtelt.
- `top-level` in einem Kanal im Beitragsstil → Antworten erscheinen als separate Beiträge auf oberster Ebene statt innerhalb des Threads.

**Lösung:** Konfigurieren Sie `replyStyle` für jeden Kanal entsprechend seiner Einrichtung:

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

### Auflösungsreihenfolge

Wenn der Bot eine Antwort in einen Kanal sendet, wird `replyStyle` von der spezifischsten Überschreibung bis zum Standardwert aufgelöst. Der erste Wert, der nicht `undefined` ist, gilt:

1. **Pro Kanal** – `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Pro Team** – `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** – `channels.msteams.replyStyle`
4. **Impliziter Standardwert** – abgeleitet aus `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Wenn Sie `requireMention: false` global ohne einen expliziten Wert für `replyStyle` festlegen, erscheinen Erwähnungen in Kanälen im Beitragsstil als Beiträge auf oberster Ebene, selbst wenn die eingehende Nachricht eine Thread-Antwort war. Legen Sie `replyStyle: "thread"` auf globaler, Team- oder Kanalebene fest, um Überraschungen zu vermeiden.

Bei proaktiven Sendungen in eine gespeicherte Kanalkonversation (Antworten auf Tool-Aufrufe in der Warteschlange, lang laufende Agenten) gilt dieselbe Team-/Kanalauflösung; Gruppenchats und persönliche Konversationen (DMs) werden bei proaktiven Sendungen unabhängig von `replyStyle` immer zu `top-level` aufgelöst.

### Beibehaltung des Thread-Kontexts

Wenn `replyStyle: "thread"` gilt und der Bot innerhalb eines Kanal-Threads per @Erwähnung angesprochen wurde, hängt OpenClaw den ursprünglichen Thread-Ausgangspunkt wieder an die ausgehende Konversationsreferenz (`19:...@thread.tacv2;messageid=<root>`) an, sodass die Antwort im selben Thread erscheint. Dies gilt sowohl für Live-Sendungen (innerhalb desselben Durchlaufs) als auch für proaktive Sendungen, nachdem der Bot-Framework-Kontext des Durchlaufs abgelaufen ist (z. B. lang laufende Agenten oder Antworten auf Tool-Aufrufe in der Warteschlange über `mcp__openclaw__message`).

Der Thread-Ausgangspunkt wird aus dem gespeicherten `threadId` der Konversationsreferenz entnommen. Ältere gespeicherte Referenzen, die vor `threadId` erstellt wurden, fallen auf `activityId` zurück (die eingehende Aktivität, welche die Konversation zuletzt initialisiert hat), sodass bestehende Bereitstellungen ohne erneute Initialisierung weiter funktionieren.

Wenn `replyStyle: "top-level"` gilt, werden eingehende Nachrichten in Kanal-Threads absichtlich als neue Beiträge auf oberster Ebene beantwortet; es wird kein Thread-Suffix angehängt. Dies ist für Kanäle im Threads-Stil korrekt. Wenn Beiträge auf oberster Ebene erscheinen, obwohl Sie Antworten in Threads erwartet haben, ist `replyStyle` für diesen Kanal falsch festgelegt.

## Anhänge und Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über die Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge befinden sich im M365-Speicher (SharePoint/OneDrive). Die Webhook-Nutzlast enthält nur einen HTML-Platzhalter, nicht die eigentlichen Dateibytes. **Zum Herunterladen von Kanalanhängen sind Graph-API-Berechtigungen erforderlich.**
- Verwenden Sie für explizite Sendungen, bei denen die Datei an erster Stelle steht, `action=upload-file` mit `media` / `filePath` / `path`; das optionale `message` wird zum begleitenden Text/Kommentar, und `filename` (oder `title`) überschreibt den Namen der hochgeladenen Datei.

Ohne Graph-Berechtigungen gehen Kanalnachrichten mit Bildern ausschließlich als Text ein (der Bildinhalt ist für den Bot nicht zugänglich).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um beliebige Hosts zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- und Bot-Framework-Hosts). Halten Sie diese Liste restriktiv (vermeiden Sie mandantenübergreifende Suffixe).

## Dateien in Gruppenchats senden

Bots können mithilfe des integrierten FileConsentCard-Ablaufs Dateien in DMs senden. **Das Senden von Dateien in Gruppenchats/Kanälen** erfordert zusätzliche Einrichtung:

| Kontext                  | Art des Dateiversands                           | Erforderliche Einrichtung                         |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert ohne zusätzliche Einrichtung    |
| **Gruppenchats/Kanäle**  | Upload zu SharePoint → native Dateikarte        | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-codiert und eingebettet                 | Funktioniert ohne zusätzliche Einrichtung         |

### Warum Gruppenchats SharePoint benötigen

Bots verwenden eine Anwendungsidentität, während die `/me`-Ressource von Microsoft Graph [einen angemeldeten Benutzer erfordert](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Zum Senden von Dateien in Gruppenchats/Kanälen lädt der Bot sie auf eine **SharePoint-Website** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Graph-API-Berechtigungen hinzufügen** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Anwendung) – Dateien zu SharePoint hochladen.
   - `ChatMember.Read.All` (Anwendung) – mandantenweite Berechtigung mit minimalen Privilegien für das Senden von Dateien in Gruppenchats. `Chat.Read.All` funktioniert ebenfalls und deckt dies bereits ab, wenn der Gruppenchatverlauf aktiviert ist. Verwenden Sie als Alternative pro Chat die [ressourcenspezifische Einwilligungsberechtigung](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Administratoreinwilligung** für den Mandanten erteilen.
3. **Ihre SharePoint-Website-ID abrufen:**

   ```bash
   # Über Graph Explorer oder curl mit einem gültigen Token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Beispiel: für eine Website unter "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Die Antwort enthält: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

   ```json5
   {
     channels: {
       msteams: {
         // ... weitere Konfiguration ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Freigabeverhalten

| Kontext und Berechtigung                                              | Freigabeverhalten                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kanal + `Sites.ReadWrite.All`                                           | Organisationsweiter Freigabelink (jeder in der Organisation hat Zugriff) |
| Gruppenchat + `Sites.ReadWrite.All` + eine unterstützte Leseberechtigung für Chatmitglieder | Benutzerspezifischer Freigabelink (nur Chatmitglieder haben Zugriff) |
| Gruppenchat ohne unterstützte Leseberechtigung für Chatmitglieder     | Senden schlägt nach dem Fail-Closed-Prinzip fehl                    |

Die benutzerspezifische Freigabe ist sicherer, da nur Chatteilnehmer auf die Datei zugreifen können. OpenClaw erfordert für Gruppenchats eine erfolgreiche Mitgliedersuche; Zeitüberschreitungen, Transportfehler, leere Ergebnisse und Ablehnungen durch die Graph API führen dazu, dass das Senden fehlschlägt, statt den Zugriff auf die Organisation auszuweiten.

### Fallback-Verhalten

| Szenario                                                         | Ergebnis                                           |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + SharePoint- und Mitgliederberechtigungen konfiguriert | In SharePoint hochladen, eine native Dateikarte senden |
| Gruppenchat + Datei + fehlende SharePoint- oder Mitgliederberechtigungen | Mit einem konkret umsetzbaren Konfigurationsfehler fehlschlagen |
| Kanal + Datei + `sharePointSiteId` konfiguriert                   | In SharePoint hochladen, eine native Dateikarte senden |
| Persönlicher Chat + Datei                                        | FileConsentCard-Ablauf (funktioniert ohne SharePoint) |
| Beliebiger Kontext + Bild                                        | Base64-codiert und eingebettet (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem `/OpenClawShared/`-Ordner in der standardmäßigen Dokumentbibliothek der konfigurierten SharePoint-Website gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Stimmen werden vom Gateway im SQLite-Plugin-Status von OpenClaw unter `state/openclaw.sqlite` aufgezeichnet.
- Vorhandene `msteams-polls.json`-Dateien werden von `openclaw doctor --fix` importiert, nicht vom laufenden Plugin.
- Das Gateway muss online bleiben, um Stimmen aufzuzeichnen.
- Umfragen veröffentlichen nicht automatisch Ergebniszusammenfassungen, und es gibt noch keine CLI für Umfrageergebnisse.

## Präsentationskarten

Senden Sie semantische Präsentationsnutzdaten mit dem Tool `message`, der CLI oder der normalen Antwortzustellung an Teams-Benutzer oder -Unterhaltungen. OpenClaw rendert sie anhand des generischen Präsentationsvertrags als Teams Adaptive Cards.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben ist, ist der Nachrichtentext optional. Schaltflächen werden als Absende- oder URL-Aktionen der Adaptive Card dargestellt. Auswahlmenüs sind im Teams-Renderer nicht nativ verfügbar, daher wandelt OpenClaw sie vor der Zustellung in lesbaren Text um.

**Agent-Tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hallo",
    blocks: [{ type: "text", text: "Hallo!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hallo","blocks":[{"type":"text","text":"Hallo!"}]}'
```

Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Unterhaltungen zu unterscheiden:

| Zieltyp             | Format                           | Beispiel                                                                                               |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Benutzer (nach ID)  | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| Benutzer (nach Name) | `user:<display-name>`              | `user:John Smith` (erfordert die Graph API)                                                           |
| Gruppe/Kanal        | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| Gruppe/Kanal (roh)  | `<conversation-id>`               | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` oder eine reine `a:`- oder `8:orgid:`- oder `29:`-Bot-Framework-ID |

**CLI-Beispiele:**

```bash
# An einen Benutzer anhand der ID senden
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hallo"

# An einen Benutzer anhand des Anzeigenamens senden (löst eine Graph-API-Suche aus)
openclaw message send --channel msteams --target "user:John Smith" --message "Hallo"

# An einen Gruppenchat oder Kanal senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hallo"

# Eine Präsentationskarte an eine Unterhaltung senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hallo","blocks":[{"type":"text","text":"Hallo"}]}'
```

**Beispiele für das Agent-Tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hallo!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hallo",
    blocks: [{ type: "text", text: "Hallo" }],
  },
}
```

<Note>
Ohne das Präfix `user:` werden Namen standardmäßig als Gruppe oder Team aufgelöst. Verwenden Sie immer `user:`, wenn Sie Personen anhand ihres Anzeigenamens adressieren.
</Note>

## Proaktive Nachrichten

- Proaktive Nachrichten sind erst möglich, **nachdem** ein Benutzer interagiert hat, da OpenClaw zu diesem Zeitpunkt Unterhaltungsreferenzen speichert.
- Informationen zu `dmPolicy` und zur Steuerung über Zulassungslisten finden Sie unter [/gateway/configuration](/de/gateway/configuration).

## Team- und Kanal-IDs (häufige Stolperfalle)

Der Abfrageparameter `groupId` in Teams-URLs ist **NICHT** die für die Konfiguration verwendete Team-ID. Extrahieren Sie die IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team-Unterhaltungs-ID (URL-decodieren)
```

**Kanal-URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal-ID (URL-decodieren)
```

**Für die Konfiguration:**

- Team-Schlüssel = Pfadsegment nach `/team/` (URL-decodiert, z. B. `19:Bk4j...@thread.tacv2`; ältere Mandanten zeigen möglicherweise `@thread.skype`, was ebenfalls gültig ist).
- Kanal-Schlüssel = Pfadsegment nach `/channel/` (URL-decodiert).
- **Ignorieren** Sie den Abfrageparameter `groupId` für das OpenClaw-Routing. Dabei handelt es sich um die Microsoft-Entra-Gruppen-ID, nicht um die Bot-Framework-Unterhaltungs-ID, die in eingehenden Teams-Aktivitäten verwendet wird.

## Private Kanäle

Bots werden in privaten Kanälen nur eingeschränkt unterstützt:

| Funktion                     | Standardkanäle | Private Kanäle              |
| ---------------------------- | -------------- | ---------------------------- |
| Bot-Installation             | Ja             | Eingeschränkt                |
| Echtzeitnachrichten (Webhook) | Ja            | Funktionieren möglicherweise nicht |
| RSC-Berechtigungen           | Ja             | Können sich anders verhalten |
| @Erwähnungen                 | Ja             | Wenn der Bot erreichbar ist  |
| Graph-API-Verlauf            | Ja             | Ja (mit Berechtigungen)      |

**Problemumgehungen, wenn private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen.
2. Verwenden Sie Direktnachrichten; Benutzer können dem Bot jederzeit direkt eine Nachricht senden.
3. Verwenden Sie die Graph API für den historischen Zugriff (erfordert `ChannelMessage.Read.All`).

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Administratoreinwilligung fehlen. Installieren Sie die Teams-App erneut, beenden Sie Teams vollständig und öffnen Sie es erneut.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; legen Sie `channels.msteams.requireMention=false` fest oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin das alte Manifest):** Entfernen Sie die App, fügen Sie sie erneut hinzu und beenden Sie Teams vollständig, um die Anzeige zu aktualisieren.
- **401 Unauthorized vom Webhook:** Wird beim manuellen Testen ohne Azure-JWT erwartet; dies bedeutet, dass der Endpunkt erreichbar ist, die Authentifizierung jedoch fehlgeschlagen ist. Verwenden Sie Azure Web Chat für einen korrekten Test.

### Fehler beim Hochladen des Manifests

- **"Icon file cannot be empty":** Das Manifest verweist auf Symboldateien mit 0 Byte. Erstellen Sie gültige PNG-Symbole (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Suchen und deinstallieren Sie sie zuerst oder warten Sie 5-10 Minuten auf die Weitergabe.
- **"Something went wrong" beim Hochladen:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die Browser-Entwicklertools (F12) → Network und prüfen Sie den Antworttext auf den tatsächlichen Fehler.
- **Sideloading schlägt fehl:** Versuchen Sie "Upload an app to your org's app catalog" anstelle von "Upload a custom app"; dadurch werden Sideloading-Beschränkungen häufig umgangen.

### RSC-Berechtigungen funktionieren nicht

1. Überprüfen Sie, ob `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt.
2. Laden Sie die App erneut hoch und installieren Sie sie erneut im Team/Chat.
3. Prüfen Sie, ob der Administrator Ihrer Organisation RSC-Berechtigungen blockiert hat.
4. Vergewissern Sie sich, dass Sie den richtigen Geltungsbereich verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats.

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Einrichtungsanleitung für Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams-App-Manifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referenz zu RSC-Berechtigungen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Dateiverarbeitung für Teams-Bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktive Nachrichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams-CLI für die Bot-Verwaltung

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungssteuerung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung
