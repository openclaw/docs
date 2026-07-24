---
read_when:
    - Sie möchten, dass OpenClaw API-Schlüssel aus HashiCorp Vault liest
    - Sie richten SecretRefs auf einem lokalen Rechner oder Server ein
    - Sie müssen Vault-gestützte Anmeldedaten für den Modell-Provider konfigurieren.
summary: Verwenden Sie das mitgelieferte Vault-Plugin, um SecretRefs aus HashiCorp Vault aufzulösen
title: Vault-SecretRefs
x-i18n:
    generated_at: "2026-07-24T04:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Vault-SecretRefs

Das gebündelte Vault-Plugin ermöglicht OpenClaw, `exec`-SecretRefs beim
Start des Gateway und bei Neuladevorgängen aus HashiCorp Vault aufzulösen. OpenClaw speichert Vault-
Referenzen in der Konfiguration, hält aufgelöste Werte im speicherinternen Secrets-Snapshot
und schreibt die aufgelösten API-Schlüssel nicht in `openclaw.json` zurück.

Verwenden Sie dies, wenn Sie Vault bereits betreiben oder die Schlüssel für Modell-Provider außerhalb
der OpenClaw-Konfigurationsdateien speichern möchten. Informationen zum SecretRef-Laufzeitmodell finden Sie unter
[Secrets-Verwaltung](/de/gateway/secrets).

## Bevor Sie beginnen

Sie benötigen:

- OpenClaw mit verfügbarem gebündeltem `vault`-Plugin
- einen erreichbaren Vault-Server
- eine Vault-Authentifizierung, die ein Client-Token mit Lesezugriff auf die Secret-
  Pfade erzeugen kann, die OpenClaw auflösen soll
- die Umgebung, die das Gateway startet, muss `VAULT_ADDR` und entweder
  `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` mit `VAULT_TOKEN_FILE`
  oder eine konfigurierte JWT-/Kubernetes-Anmeldung enthalten

Der Resolver kommuniziert von Node aus über HTTP mit Vault. Das Gateway benötigt die
Vault-CLI nicht, um SecretRefs aufzulösen.

Aktivieren Sie das gebündelte Plugin, bevor Sie die `openclaw vault`-Befehle ausführen:

```bash
openclaw plugins enable vault
```

## Einen Provider-Schlüssel in Vault speichern

OpenClaw verwendet standardmäßig KV v2, eingebunden unter `secret`, entsprechend den
Beispielen für den Vault-Entwicklungsserver. Setzen Sie für produktive Vault-Installationen `OPENCLAW_VAULT_KV_MOUNT` auf Ihren tatsächlichen KV-
Einbindungspfad, bevor Sie SecretRef-IDs erstellen. Mit den OpenClaw-Standardeinstellungen liest diese
SecretRef-ID:

```text
providers/openrouter/apiKey
```

dieses Vault-Feld:

```text
secret/data/providers/openrouter -> apiKey
```

Eine Möglichkeit, es mit der Vault-CLI zu erstellen:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Verwenden Sie für OpenClaw ein eingeschränktes Client-Token und kein Root-Token. Für das standardmäßige KV-v2-
Layout sieht eine minimale Richtlinie für Schlüssel von Modell-Providern folgendermaßen aus:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Vault für das Gateway verfügbar machen

Exportieren Sie für ein lokales Gateway ohne Container die Vault-Einstellungen in derselben Shell,
in der OpenClaw gestartet wird. Die standardmäßige Authentifizierungsmethode liest ein Vault-Client-Token aus
`VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Wenn Vault Agent eine Token-Sink-Datei schreibt, verwenden Sie die Token-Datei-Authentifizierung:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Installieren Sie bei einem Vault-Server, der von einer privaten CA signiert wurde, entweder diese CA im
Vertrauensspeicher des Hosts und aktivieren Sie den Systemvertrauensspeicher von Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Oder stellen Sie direkt ein PEM-Bundle bereit:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Diese Variablen müssen beim Start von OpenClaw vorhanden sein. Das Vault-Plugin leitet
sie an seinen Resolver-Prozess weiter.

Verwenden Sie für eine nicht interaktive JWT-Authentifizierung eine Workload-JWT-Datei und eine Vault-Rolle vom Typ
`jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

Die JWT-Datei sollte ein projiziertes Workload-Token sein, beispielsweise ein Kubernetes-Dienstkonto-
Token mit einer von der Vault-Rolle akzeptierten Zielgruppe.
Die interaktive OIDC-Browseranmeldung ist für Menschen nützlich, aber die Gateway-Laufzeit benötigt
eine nicht interaktive JWT-Anmeldung oder eine Token-Datei.

Verwenden Sie für die Kubernetes-Authentifizierungsmethode von Vault `kubernetes`. Diese ist für
Gateways vorgesehen, die als Pods ausgeführt werden. Die Standardeinbindung ist `kubernetes`, und die standardmäßige JWT-
Datei ist der reguläre Pfad des Dienstkonto-Tokens:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Setzen Sie `OPENCLAW_VAULT_AUTH_MOUNT` nur, wenn die Kubernetes-Authentifizierung in Vault an einer anderen Stelle als
`auth/kubernetes` eingebunden ist. Setzen Sie `OPENCLAW_VAULT_JWT_FILE` nur, wenn das Dienstkonto-
Token unter einem benutzerdefinierten Pfad projiziert wird.

Optionale Einstellungen:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Prüfen Sie, was für die aktuelle Shell sichtbar ist:

```bash
openclaw vault status
```

Wenn mehr als ein Vault-gestützter Secret-Provider konfiguriert ist, wählen Sie einen über seinen
Alias aus:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` gibt `VAULT_TOKEN` niemals aus; es meldet nur, ob
Token, Token-Datei und JWT-Datei festgelegt sind.

<Warning>
Wenn das Gateway als Dienst, LaunchAgent, systemd-Unit, geplante Aufgabe oder
Container ausgeführt wird, muss diese Laufzeitumgebung dieselben Vault-Variablen erhalten.
Das Setzen der Variablen in einer interaktiven Shell bestätigt nur diese Shell, nicht das
bereits ausgeführte Gateway.
</Warning>

## Einen SecretRef-Plan erstellen und anwenden

Erstellen Sie einen Plan, der den API-Schlüssel des OpenRouter-Modell-Providers Vault zuordnet:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Wenden Sie den Plan an und überprüfen Sie ihn:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Verwenden Sie `--allow-exec`, da das Vault-Plugin die Auflösung über einen von OpenClaw verwalteten
Exec-SecretRef-Provider durchführt.

Wenn das Gateway noch nicht ausgeführt wird, starten Sie es nach dem Anwenden des Plans
wie gewohnt, anstatt `openclaw secrets reload` auszuführen.

## Weitere Provider-Schlüssel konfigurieren

Integrierte Kurzformen:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Mehrere Provider-Schlüssel in einem Plan:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Gebündelte Provider ohne Kurzformen sowie bereits konfigurierte OpenAI-kompatible und
benutzerdefinierte Modell-Provider verwenden `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Jedes `--provider-key <provider=id>` schreibt eine SecretRef nach
`models.providers.<provider>.apiKey`. Bei benutzerdefinierten Providern erstellt es nicht die Einstellungen
`baseUrl`, `api` oder `models` des Providers; konfigurieren Sie diese zuerst.

Verwenden Sie `--target <path=id>` für jeden bekannten SecretRef-Zielpfad:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Reine Zielpfade gelten für `openclaw.json`. Verwenden Sie
`auth-profiles:<agentId>:<path>` für bestehende `auth-profiles.json`-Ziele.
Der Zielpfad muss ein registriertes OpenClaw-SecretRef-Ziel sein. Der Setup-
Befehl erstellt keine beliebigen benannten Secrets in OpenClaw; Vault bleibt der
Secret-Speicher, und OpenClaw speichert SecretRefs nur in unterstützten Konfigurationsfeldern.

## Format der SecretRef-ID

Vault-SecretRef-IDs verwenden diese Konvention:

```text
<vault-secret-path>/<field>
```

Beispiele:

| SecretRef-ID                  | Standardmäßiger KV-v2-Vault-Lesezugriff | Zurückgegebenes Feld |
| ----------------------------- | --------------------------------------- | -------------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

Das zurückgegebene Vault-Feld muss eine Zeichenfolge sein.

Setzen Sie für KV v1:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Dann liest `providers/openrouter/apiKey`:

```text
secret/providers/openrouter -> apiKey
```

## Was OpenClaw speichert

Beim Anwenden eines Vault-Setup-Plans wird ein vom Plugin verwalteter Provider gespeichert:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Anmeldedatenfelder verweisen auf diesen Provider:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

Der aufgelöste Wert ist nur im aktiven Secrets-Snapshot der Laufzeit vorhanden.

## Container und verwaltete Bereitstellungen

Containerisierte Gateways verwenden weiterhin dieselbe Plugin- und SecretRef-Konfiguration. Der
Container muss Folgendes erhalten:

- `VAULT_ADDR`
- eine Authentifizierungsquelle:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` plus `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` plus `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE` und `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` plus `OPENCLAW_VAULT_AUTH_ROLE`; optional
    `OPENCLAW_VAULT_AUTH_MOUNT` oder `OPENCLAW_VAULT_JWT_FILE` überschreiben
- optional `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` und
  `OPENCLAW_VAULT_KV_VERSION`

Bevorzugen Sie bei Verwendung von Kubernetes `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`,
wenn die Kubernetes-Authentifizierung in Vault für den Cluster konfiguriert ist. Verwenden Sie
`OPENCLAW_VAULT_AUTH_METHOD=jwt` nur, wenn Vault so konfiguriert ist, dass der Cluster
als generischer JWT-/OIDC-Aussteller behandelt wird. Beide Optionen sind besser als ein langlebiges Vault-
Token in einem Kubernetes-Secret. Bei Bereitstellungen mit Vault-Agent-Sidecar oder -Injector kann
stattdessen `token_file` verwendet werden.

Halten Sie bei mandantenfähigen Vault-Installationen die Mandantenzuordnung in der Vault-Richtlinie und
Bereitstellungskonfiguration. OpenClaw erfordert keine feste Einbindung, Rolle oder keinen festen Pfad: Jede
Gateway-Umgebung kann eigene Werte für `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` und SecretRef-IDs festlegen. Wenn ein gemeinsames Gateway gleichzeitig
verschiedene Vault-Benutzer auflösen muss, verwenden Sie manuell konfigurierte Exec-Provider,
die unterschiedliche Authentifizierungsumgebungen kapseln, oder verteilen Sie Mandanten auf Gateway-
Umgebungen mit separaten Vault-Umgebungsvariablen.

## Verwandte Themen

- [Secrets-Verwaltung](/de/gateway/secrets)
- [`openclaw secrets`](/de/cli/secrets)
- [Plugin-Inventar](/de/plugins/plugin-inventory)
