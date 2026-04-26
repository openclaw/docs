---
read_when:
    - Arbeiten an Funktionen des Microsoft Teams-Kanals
summary: Supportstatus, Funktionen und Konfiguration des Microsoft Teams-Bots
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Status: Text und DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen ein explizites `upload-file` für dateiorientiertes Senden bereit.

## Gebündeltes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist in der normalen paketierten Build kein separates Installieren erforderlich.

Wenn Sie eine ältere Build oder eine benutzerdefinierte Installation verwenden, die das gebündelte Teams nicht enthält, installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/msteams
```

Lokaler Checkout (beim Ausführen aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

Die [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) übernimmt Bot-Registrierung, Manifesterstellung und Generierung von Anmeldedaten in einem einzigen Befehl.

**1. Installieren und anmelden**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # prüfen, ob Sie angemeldet sind, und Ihre Mandanteninformationen anzeigen
```

> **Hinweis:** Die Teams CLI befindet sich derzeit in der Preview. Befehle und Flags können sich zwischen Releases ändern.

**2. Einen Tunnel starten** (Teams kann localhost nicht erreichen)

Installieren Sie die devtunnel-CLI und authentifizieren Sie sie, falls Sie das noch nicht getan haben ([Leitfaden für den Einstieg](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Einmalige Einrichtung (persistente URL über Sitzungen hinweg):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Jede Entwicklungs-Sitzung:
devtunnel host my-openclaw-bot
# Ihr Endpunkt: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Hinweis:** `--allow-anonymous` ist erforderlich, weil Teams sich nicht mit devtunnels authentifizieren kann. Jede eingehende Bot-Anfrage wird dennoch automatisch vom Teams SDK validiert.

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (diese können jedoch die URLs in jeder Sitzung ändern).

**3. Die App erstellen**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Dieser einzelne Befehl:

- Erstellt eine Entra-ID- (Azure AD-) Anwendung
- Generiert ein Client Secret
- Erstellt und lädt ein Teams-App-Manifest hoch (mit Symbolen)
- Registriert den Bot (standardmäßig Teams-verwaltet — kein Azure-Abonnement erforderlich)

Die Ausgabe zeigt `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` und eine **Teams App ID** — notieren Sie diese für die nächsten Schritte. Außerdem wird angeboten, die App direkt in Teams zu installieren.

**4. OpenClaw konfigurieren** mit den Anmeldedaten aus der Ausgabe:

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

Oder verwenden Sie direkt Umgebungsvariablen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Die App in Teams installieren**

`teams app create` fordert Sie auf, die App zu installieren — wählen Sie „Install in Teams“. Wenn Sie das übersprungen haben, können Sie den Link später abrufen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Prüfen, ob alles funktioniert**

```bash
teams app doctor <teamsAppId>
```

Dies führt Diagnosen für Bot-Registrierung, AAD-App-Konfiguration, Manifestgültigkeit und SSO-Einrichtung aus.

Für Produktionsbereitstellungen sollten Sie erwägen, [föderierte Authentifizierung](#federated-authentication-certificate--managed-identity) (Zertifikat oder Managed Identity) anstelle von Client Secrets zu verwenden.

Hinweis: Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setzen Sie `channels.msteams.groupAllowFrom` (oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen, standardmäßig mit Erwähnungssteuerung).

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Routing deterministisch halten: Antworten gehen immer an den Kanal zurück, auf dem sie eingegangen sind.
- Standardmäßig ein sicheres Kanalverhalten verwenden (Erwähnungen erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsschreibvorgänge

Standardmäßig darf Microsoft Teams Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffskontrolle (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt wurden.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs verwenden.
- Verlassen Sie sich bei Allowlists nicht auf UPN-/Anzeigenamen-Abgleich — diese können sich ändern. OpenClaw deaktiviert direkten Namensabgleich standardmäßig; aktivieren Sie ihn nur explizit mit `channels.msteams.dangerouslyAllowNameMatching: true`.
- Der Assistent kann Namen über Microsoft Graph in IDs auflösen, wenn die Anmeldedaten dies erlauben.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, bis Sie `groupAllowFrom` hinzufügen). Verwenden Sie `channels.defaults.groupPolicy`, um den Standardwert zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender in Gruppenchats/Kanälen auslösen können (greift auf `channels.msteams.allowFrom` zurück).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin mit Erwähnungssteuerung).
- Um **keine Kanäle** zuzulassen, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

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

**Teams- + Kanal-Allowlist**

- Begrenzen Sie Gruppen-/Kanalantworten, indem Sie Teams und Kanäle unter `channels.msteams.teams` auflisten.
- Schlüssel sollten stabile Team-IDs und Kanal-Konversations-IDs verwenden.
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Kanäle akzeptiert (mit Erwähnungssteuerung).
- Der Konfigurationsassistent akzeptiert Einträge im Format `Team/Channel` und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen in IDs auf (wenn Graph-Berechtigungen dies erlauben)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen bleiben wie eingegeben erhalten, werden aber standardmäßig für das Routing ignoriert, sofern nicht `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert ist.

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
<summary><strong>Manuelle Einrichtung (ohne die Teams CLI)</strong></summary>

Wenn Sie die Teams CLI nicht verwenden können, können Sie den Bot manuell über das Azure-Portal einrichten.

### Funktionsweise

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist (in aktuellen Releases gebündelt).
2. Erstellen Sie einen **Azure Bot** (App-ID + Secret + Mandanten-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die untenstehenden RSC-Berechtigungen enthält.
4. Laden Sie die Teams-App in ein Team hoch/installieren Sie sie (oder in den persönlichen Bereich für DMs).
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder per Umgebungsvariablen) und starten Sie das Gateway.
6. Das Gateway lauscht standardmäßig auf `/api/messages` für Bot-Framework-Webhook-Datenverkehr.

### Schritt 1: Azure Bot erstellen

1. Öffnen Sie [Azure Bot erstellen](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Füllen Sie die Registerkarte **Basics** aus:

   | Field              | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wählen Sie Ihr Azure-Abonnement                          |
   | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
   | **Type of App**    | **Single Tenant** (empfohlen – siehe Hinweis unten)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Hinweis zur Abkündigung:** Die Erstellung neuer Multi-Tenant-Bots wurde nach dem 31.07.2025 eingestellt. Verwenden Sie **Single Tenant** für neue Bots.

3. Klicken Sie auf **Review + create** → **Create** (warten Sie etwa 1–2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehen Sie zu Ihrer Azure-Bot-Ressource → **Configuration**
2. Kopieren Sie **Microsoft App ID** → dies ist Ihre `appId`
3. Klicken Sie auf **Manage Password** → wechseln Sie zur App-Registrierung
4. Unter **Certificates & secrets** → **New client secret** → kopieren Sie den **Value** → dies ist Ihr `appPassword`
5. Gehen Sie zu **Overview** → kopieren Sie **Directory (tenant) ID** → dies ist Ihre `tenantId`

### Schritt 3: Nachrichtenendpunkt konfigurieren

1. In Azure Bot → **Configuration**
2. Setzen Sie **Messaging endpoint** auf Ihre Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling) unten)

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Channels**
2. Klicken Sie auf **Microsoft Teams** → Configure → Save
3. Akzeptieren Sie die Nutzungsbedingungen

### Schritt 5: Teams-App-Manifest erstellen

- Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
- Bereiche: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (erforderlich für die Dateiverarbeitung im persönlichen Bereich).
- Fügen Sie RSC-Berechtigungen hinzu (siehe [RSC-Berechtigungen](#current-teams-rsc-permissions-manifest)).
- Erstellen Sie Symbole: `outline.png` (32x32) und `color.png` (192x192).
- Packen Sie alle drei Dateien zusammen in eine ZIP-Datei: `manifest.json`, `outline.png`, `color.png`.

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

### Schritt 7: Das Gateway ausführen

Der Teams-Kanal startet automatisch, wenn das Plugin verfügbar ist und eine `msteams`-Konfiguration mit Anmeldedaten vorhanden ist.

</details>

## Föderierte Authentifizierung (Zertifikat + Managed Identity)

> Hinzugefügt in 2026.3.24

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Es stehen zwei Methoden zur Verfügung:

### Option A: Zertifikatbasierte Authentifizierung

Verwenden Sie ein PEM-Zertifikat, das in Ihrer Entra-ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Erstellen oder beschaffen Sie ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → laden Sie das öffentliche Zertifikat hoch.

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

Verwenden Sie Azure Managed Identity für passwortlose Authentifizierung. Dies ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure-VMs), bei denen eine Managed Identity verfügbar ist.

**Funktionsweise:**

1. Der Bot-Pod/die VM verfügt über eine Managed Identity (systemzugewiesen oder benutzerzugewiesen).
2. Eine **Federated Identity Credential** verknüpft die Managed Identity mit der Entra-ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure-IMDS-Endpunkt (`169.254.169.254`) abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter Managed Identity (AKS Workload Identity, App Service, VM)
- Auf der Entra-ID-App-Registrierung erstellte Federated Identity Credential
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) vom Pod/von der VM

**Konfiguration (systemzugewiesene Managed Identity):**

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

**Konfiguration (benutzerzugewiesene Managed Identity):**

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

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur für benutzerzugewiesene Managed Identity)

### Einrichtung von AKS Workload Identity

Für AKS-Bereitstellungen mit Workload Identity:

1. **Aktivieren Sie Workload Identity** in Ihrem AKS-Cluster.
2. **Erstellen Sie eine Federated Identity Credential** in der Entra-ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Kommentieren Sie das Kubernetes-Servicekonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Labeln Sie den Pod** für die Injektion von Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stellen Sie den Netzwerkzugriff** auf IMDS (`169.254.169.254`) sicher — wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel hinzu, die Datenverkehr zu `169.254.169.254/32` auf Port 80 erlaubt.

### Vergleich der Authentifizierungstypen

| Methode              | Konfiguration                                 | Vorteile                           | Nachteile                             |
| -------------------- | --------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client Secret**    | `appPassword`                                 | Einfache Einrichtung               | Secret-Rotation erforderlich, weniger sicher |
| **Zertifikat**       | `authType: "federated"` + `certificatePath`   | Kein gemeinsames Secret über das Netzwerk | Verwaltungsaufwand für Zertifikate |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Passwortlos, keine Secrets zu verwalten | Azure-Infrastruktur erforderlich    |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig die Authentifizierung mit Client Secret. Bestehende Konfigurationen funktionieren ohne Änderungen weiter.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie einen persistenten Entwicklungstunnel, damit Ihre URL sitzungsübergreifend gleich bleibt:

```bash
# Einmalige Einrichtung:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Jede Entwicklungs-Sitzung:
devtunnel host my-openclaw-bot
```

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (die URLs können sich in jeder Sitzung ändern).

Wenn sich Ihre Tunnel-URL ändert, aktualisieren Sie den Endpunkt:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Den Bot testen

**Diagnosen ausführen:**

```bash
teams app doctor <teamsAppId>
```

Prüft Bot-Registrierung, AAD-App, Manifest und SSO-Konfiguration in einem Durchlauf.

**Eine Testnachricht senden:**

1. Installieren Sie die Teams-App (verwenden Sie den Installationslink aus `teams app get <id> --install-link`)
2. Suchen Sie den Bot in Teams und senden Sie eine DM
3. Prüfen Sie die Gateway-Logs auf eingehende Aktivitäten

## Umgebungsvariablen

Alle Konfigurationsschlüssel können stattdessen auch über Umgebungsvariablen gesetzt werden:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optional: `"secret"` oder `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (föderiert + Zertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optional, für die Authentifizierung nicht erforderlich)
- `MSTEAMS_USE_MANAGED_IDENTITY` (föderiert + Managed Identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (nur für benutzerzugewiesene MI)

## Aktion für Mitgliederinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte Aktion `member-info` bereit, damit Agenten und Automatisierungen Mitgliederdetails eines Kanals (Anzeigename, E-Mail, Rolle) direkt über Microsoft Graph auflösen können.

Anforderungen:

- `Member.Read.Group`-RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Nachschlagevorgänge: `User.Read.All`-Graph-Anwendungsberechtigung mit Admin-Zustimmung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (standardmäßig aktiviert, wenn Graph-Anmeldedaten verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden.
- Fällt zurück auf `messages.groupChat.historyLimit`. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Abgerufener Thread-Verlauf wird nach Absender-Allowlists (`allowFrom` / `groupAllowFrom`) gefiltert, sodass das Anreichern des Thread-Kontexts nur Nachrichten von zugelassenen Absendern enthält.
- Zitierter Anhangskontext (`ReplyTo*`, abgeleitet aus Teams-Antwort-HTML) wird derzeit unverändert weitergegeben.
- Anders ausgedrückt: Allowlists steuern, wer den Agenten auslösen kann; derzeit werden nur bestimmte ergänzende Kontextpfade gefiltert.
- Der DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` begrenzt werden (Benutzer-Turns). Überschreibungen pro Benutzer: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **bestehenden resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Bereich):**

- `ChannelMessage.Read.Group` (Application) - alle Kanalnachrichten ohne @Erwähnung empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchats-Nachrichten ohne @Erwähnung empfangen

So fügen Sie RSC-Berechtigungen über die Teams CLI hinzu:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Beispiel für ein Teams-Manifest (redigiert)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetzen Sie IDs und URLs.

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

### Hinweise zum Manifest (Pflichtfelder)

- `bots[].botId` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `bots[].scopes` muss die Bereiche enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Bereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lese-/Sende-Berechtigungen für Kanäle enthalten, wenn Sie Kanalverkehr verwenden möchten.

### Eine bestehende App aktualisieren

So aktualisieren Sie eine bereits installierte Teams-App (z. B. um RSC-Berechtigungen hinzuzufügen):

```bash
# Manifest herunterladen, bearbeiten und erneut hochladen
teams app manifest download <teamsAppId> manifest.json
# manifest.json lokal bearbeiten...
teams app manifest upload manifest.json <teamsAppId>
# Die Version wird automatisch erhöht, wenn sich der Inhalt geändert hat
```

Nach der Aktualisierung installieren Sie die App in jedem Team erneut, damit neue Berechtigungen wirksam werden, und **beenden Sie Teams vollständig und starten Sie es neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu leeren.

<details>
<summary>Manuelles Manifest-Update (ohne CLI)</summary>

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Packen Sie das Manifest erneut als ZIP** zusammen mit den Symbolen (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP-Datei hoch:
   - **Teams Admin Center:** Teams apps → Manage apps → Ihre App suchen → Neue Version hochladen
   - **Sideload:** In Teams → Apps → Manage your apps → Eine benutzerdefinierte App hochladen

</details>

## Funktionen: nur RSC vs. Graph

### Mit **nur Teams RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- Kanalnachrichten-**Text**inhalt lesen.
- Kanalnachrichten-**Text**inhalt senden.
- **Dateianhänge** in persönlichen Nachrichten (DM) empfangen.

Funktioniert NICHT:

- Kanal-/Gruppen-**Bild- oder Dateiinhalte** (Payload enthält nur einen HTML-Stub).
- Herunterladen von Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams RSC + Microsoft Graph-Anwendungsberechtigungen**

Zusätzlich möglich:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Dateianhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Kanal-/Chat-Nachrichtenverlaufs über Graph.

### RSC vs. Graph API

| Funktion                | RSC-Berechtigungen | Graph API                           |
| ----------------------- | ------------------ | ----------------------------------- |
| **Echtzeitnachrichten** | Ja (über Webhook)  | Nein (nur Polling)                  |
| **Historische Nachrichten** | Nein           | Ja (Verlauf kann abgefragt werden)  |
| **Komplexität der Einrichtung** | Nur App-Manifest | Erfordert Admin-Zustimmung + Token-Flow |
| **Funktioniert offline** | Nein (muss laufen) | Ja (jederzeit abfragbar)            |

**Kurz gesagt:** RSC ist für das Zuhören in Echtzeit; Graph API ist für historischen Zugriff. Um verpasste Nachrichten nachzuholen, während Sie offline sind, benötigen Sie Graph API mit `ChannelMessage.Read.All` (erfordert Admin-Zustimmung).

## Graph-aktivierte Medien + Verlauf (für Kanäle erforderlich)

Wenn Sie Bilder/Dateien in **Kanälen** benötigen oder den **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft-Graph-Berechtigungen aktivieren und die Admin-Zustimmung erteilen.

1. Fügen Sie in der **App Registration** von Entra ID (Azure AD) Microsoft-Graph-**Application permissions** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie die Admin-Zustimmung** für den Mandanten.
3. Erhöhen Sie die **Manifestversion** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams erneut**.
4. **Beenden Sie Teams vollständig und starten Sie es neu**, um zwischengespeicherte App-Metadaten zu leeren.

**Zusätzliche Berechtigung für Benutzererwähnungen:** Benutzer-@Erwähnungen funktionieren sofort für Benutzer in der Unterhaltung. Wenn Sie jedoch Benutzer dynamisch suchen und erwähnen möchten, die **nicht in der aktuellen Unterhaltung** sind, fügen Sie die **Application**-Berechtigung `User.Read.All` hinzu und erteilen Sie die Admin-Zustimmung.

## Bekannte Einschränkungen

### Webhook-Zeitüberschreitungen

Teams stellt Nachrichten über HTTP-Webhooks zu. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), kann Folgendes auftreten:

- Gateway-Zeitüberschreitungen
- Teams versucht erneut, die Nachricht zuzustellen (führt zu Duplikaten)
- Verlorene Antworten

OpenClaw behandelt dies, indem es schnell antwortet und Antworten proaktiv sendet, aber sehr langsame Antworten können dennoch Probleme verursachen.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (siehe `/gateway/configuration` für gemeinsame Kanalmuster):

- `channels.msteams.enabled`: den Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst während der Einrichtung Namen in IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Notfallschalter, um veränderlichen UPN-/Anzeigenamen-Abgleich und direktes Routing nach Team-/Kanalnamen wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Größe ausgehender Textabschnitte.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um vor dem Aufteilen nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.msteams.mediaAllowHosts`: Allowlist für Hosts eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist zum Anhängen von Authorization-Headern bei Medienwiederholungen (standardmäßig Graph- + Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @Erwähnung in Kanälen/Gruppen erforderlich (Standard true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardüberschreibungen der Tool-Richtlinie pro Team (`allow`/`deny`/`alsoAllow`), die verwendet werden, wenn eine Kanalüberschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardüberschreibungen der Tool-Richtlinie pro Team und Absender (`"*"`-Wildcard wird unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Überschreibungen der Tool-Richtlinie pro Kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Überschreibungen der Tool-Richtlinie pro Kanal und Absender (`"*"`-Wildcard wird unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `id:`, `e164:`, `username:`, `name:` (ältere Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet).
- `channels.msteams.actions.memberInfo`: die Graph-gestützte Aktion für Mitgliederinformationen aktivieren oder deaktivieren (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.authType`: Authentifizierungstyp — `"secret"` (Standard) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatsdatei (föderiert + Zertifikatauthentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikat-Fingerabdruck (optional, für die Authentifizierung nicht erforderlich).
- `channels.msteams.useManagedIdentity`: Managed-Identity-Authentifizierung aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für benutzerzugewiesene Managed Identity.
- `channels.msteams.sharePointSiteId`: SharePoint-Site-ID für Datei-Uploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).

## Routing & Sitzungen

- Sitzungsschlüssel folgen dem Standard-Agentenformat (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten verwenden die Hauptsitzung gemeinsam (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat kürzlich zwei Kanal-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Style                    | Beschreibung                                            | Empfohlener `replyStyle` |
| ------------------------ | ------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard) |
| **Threads** (Slack-like) | Nachrichten fließen linearer, eher wie in Slack         | `top-level`              |

**Das Problem:** Die Teams-API gibt nicht an, welchen UI-Stil ein Kanal verwendet. Wenn Sie den falschen `replyStyle` verwenden:

- `thread` in einem Kanal im Threads-Stil → Antworten erscheinen unpassend verschachtelt
- `top-level` in einem Kanal im Posts-Stil → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfigurieren Sie `replyStyle` pro Kanal abhängig davon, wie der Kanal eingerichtet ist:

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

## Anhänge & Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Payload enthält nur einen HTML-Stub, nicht die tatsächlichen Datei-Bytes. **Graph-API-Berechtigungen sind erforderlich**, um Kanalanhänge herunterzuladen.
- Für explizite dateiorientierte Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum begleitenden Text/Kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Kanalnachrichten mit Bildern nur als Text empfangen (der Bildinhalt ist für den Bot nicht zugänglich).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- + Bot-Framework-Hosts). Halten Sie diese Liste restriktiv (vermeiden Sie mandantenübergreifende Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs mithilfe des FileConsentCard-Ablaufs senden (integriert). Das **Senden von Dateien in Gruppenchats/Kanälen** erfordert jedoch zusätzliche Einrichtung:

| Kontext                 | Art des Dateiversands                        | Erforderliche Einrichtung                       |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                 | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                    |
| **Gruppenchats/Kanäle** | Upload zu SharePoint → Link teilen           | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Inline base64-kodiert                     | Funktioniert sofort                             |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph-API-Endpunkt `/me/drive` funktioniert nicht für Anwendungsidentitäten). Um Dateien in Gruppenchats/Kanälen zu senden, lädt der Bot zu einer **SharePoint-Site** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Graph-API-Berechtigungen hinzufügen** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - Dateien nach SharePoint hochladen
   - `Chat.Read.All` (Application) - optional, aktiviert Freigabelinks pro Benutzer

2. **Admin-Zustimmung** für den Mandanten erteilen.

3. **Ihre SharePoint-Site-ID abrufen:**

   ```bash
   # Über Graph Explorer oder curl mit einem gültigen Token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Beispiel: für eine Site unter "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Antwort enthält: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

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

### Freigabeverhalten

| Berechtigung                            | Freigabeverhalten                                        |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` nur               | Organisationsweiter Freigabelink (jeder in der Organisation kann zugreifen) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Freigabelink pro Benutzer (nur Chatmitglieder können zugreifen) |

Die Freigabe pro Benutzer ist sicherer, da nur die Chatteilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, greift der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                          | Ergebnis                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Zu SharePoint hochladen, Freigabelink senden   |
| Gruppenchat + Datei + keine `sharePointSiteId`    | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                         | FileConsentCard-Ablauf (funktioniert ohne SharePoint) |
| Jeder Kontext + Bild                              | Inline base64-kodiert (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standarddokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` gespeichert.
- Das Gateway muss online bleiben, um Stimmen zu erfassen.
- Umfragen veröffentlichen derzeit noch keine Ergebniszusammenfassungen automatisch (prüfen Sie bei Bedarf die Speicherdatei).

## Präsentationskarten

Senden Sie semantische Präsentations-Payloads an Teams-Benutzer oder Konversationen mit dem `message`-Tool oder der CLI. OpenClaw rendert sie aus dem generischen Präsentationsvertrag als Teams Adaptive Cards.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben ist, ist der Nachrichtentext optional.

**Agenten-Tool:**

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

Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Konversationen zu unterscheiden:

| Zieltyp                | Format                           | Beispiel                                           |
| ---------------------- | -------------------------------- | -------------------------------------------------- |
| Benutzer (nach ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`        |
| Benutzer (nach Name)   | `user:<display-name>`            | `user:John Smith` (erfordert Graph API)            |
| Gruppe/Kanal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Gruppe/Kanal (roh)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

```bash
# An einen Benutzer per ID senden
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# An einen Benutzer per Anzeigename senden (löst Graph-API-Nachschlagen aus)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# An einen Gruppenchat oder Kanal senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Eine Präsentationskarte an eine Konversation senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Beispiele für Agenten-Tools:**

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

Hinweis: Ohne das Präfix `user:` werden Namen standardmäßig als Gruppen-/Team-Ziele aufgelöst. Verwenden Sie immer `user:`, wenn Sie Personen per Anzeigename ansprechen.

## Proaktives Messaging

- Proaktive Nachrichten sind nur möglich, **nachdem** ein Benutzer interagiert hat, da wir Konversationsreferenzen erst dann speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Steuerung.

## Team- und Kanal-IDs (häufiger Stolperstein)

Der Abfrageparameter `groupId` in Teams-URLs ist **NICHT** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team-ID (URL-dekodieren)
```

**Kanal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal-ID (URL-dekodieren)
```

**Für die Konfiguration:**

- Team-ID = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`)
- Kanal-ID = Pfadsegment nach `/channel/` (URL-dekodiert)
- Den Abfrageparameter `groupId` **ignorieren**

## Private Kanäle

Bots werden in privaten Kanälen nur eingeschränkt unterstützt:

| Funktion                     | Standardkanäle    | Private Kanäle        |
| --------------------------- | ----------------- | --------------------- |
| Bot-Installation            | Ja                | Eingeschränkt         |
| Echtzeitnachrichten (Webhook) | Ja              | Funktioniert eventuell nicht |
| RSC-Berechtigungen          | Ja                | Kann sich anders verhalten |
| @Erwähnungen                | Ja                | Wenn der Bot zugänglich ist |
| Graph-API-Verlauf           | Ja                | Ja (mit Berechtigungen) |

**Workarounds, falls private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen
2. Verwenden Sie DMs - Benutzer können dem Bot immer direkt schreiben
3. Verwenden Sie Graph API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App erneut und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt noch altes Manifest):** Entfernen Sie die App und fügen Sie sie erneut hinzu, und beenden Sie Teams vollständig, um die Aktualisierung zu erzwingen.
- **401 Unauthorized vom Webhook:** Beim manuellen Testen ohne Azure-JWT erwartet - bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwenden Sie Azure Web Chat zum korrekten Testen.

### Fehler beim Hochladen des Manifests

- **"Icon file cannot be empty":** Das Manifest verweist auf Symboldateien mit 0 Byte. Erstellen Sie gültige PNG-Symbole (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Suchen Sie sie und deinstallieren Sie sie zuerst, oder warten Sie 5–10 Minuten auf die Verteilung.
- **"Something went wrong" beim Hochladen:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die Browser-DevTools (F12) → Reiter „Network“, und prüfen Sie den Response-Body auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie „Upload an app to your org's app catalog“ statt „Upload a custom app“ - dies umgeht oft Sideload-Einschränkungen.

### RSC-Berechtigungen funktionieren nicht

1. Prüfen Sie, ob `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat erneut
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Stellen Sie sicher, dass Sie den richtigen Bereich verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Leitfaden zur Einrichtung von Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams-App-Manifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referenz zu RSC-Berechtigungen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams-Bot-Dateiverarbeitung](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktives Messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI für die Bot-Verwaltung

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung über Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
