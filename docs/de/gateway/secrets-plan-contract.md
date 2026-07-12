---
read_when:
    - Erstellen oder Überprüfen von `openclaw secrets apply`-Plänen
    - Fehlerbehebung bei `Invalid plan target path`-Fehlern
    - Verhalten bei der Validierung von Zieltyp und Pfad verstehen
summary: 'Vertrag für `secrets apply`-Pläne: Zielvalidierung, Pfadabgleich und Zielumfang von `auth-profiles.json`'
title: Vertrag für den Plan zur Anwendung von Geheimnissen
x-i18n:
    generated_at: "2026-07-12T01:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Diese Seite definiert den strikten Vertrag, den `openclaw secrets apply` durchsetzt. Wenn ein Ziel diesen Regeln nicht entspricht, schlägt die Anwendung fehl, bevor eine Datei verändert wird.

## Struktur der Plandatei

`openclaw secrets apply --from <plan.json>` erwartet ein `targets`-Array mit Planzielen:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` erzeugt Pläne in dieser Struktur. Sie können einen Plan auch manuell erstellen oder bearbeiten.

## Einfügen, Aktualisieren und Löschen von Providern

Pläne können außerdem zwei optionale Felder auf oberster Ebene enthalten, die zusätzlich zu den Schreibvorgängen für einzelne Ziele die Zuordnung `secrets.providers` verändern:

- `providerUpserts` -- ein Objekt, dessen Schlüssel Provider-Aliasse sind. Jeder Wert ist eine Provider-Definition (dieselbe Struktur, die unter `secrets.providers.<alias>` in `openclaw.json` akzeptiert wird, beispielsweise ein `exec`- oder `file`-Provider).
- `providerDeletes` -- ein Array mit zu entfernenden Provider-Aliassen.

`providerUpserts` wird vor `targets` ausgeführt, sodass `target.ref.provider` auf einen Provider-Alias verweisen kann, den derselbe Plan in `providerUpserts` einführt. Ohne diese Reihenfolge schlagen Pläne, die auf einen noch nicht in `openclaw.json` konfigurierten Alias verweisen, mit `provider "<alias>" is not configured` fehl.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Über `providerUpserts` eingeführte Exec-Provider unterliegen weiterhin den Regeln zur Zustimmung für Exec unter [Zustimmungsverhalten für Exec-Provider](#exec-provider-consent-behavior): Pläne mit Exec-Providern erfordern im Schreibmodus `--allow-exec`.

## Unterstützter Zielumfang

Planziele werden für die unterstützten Anmeldedatenpfade unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) akzeptiert.

## Verhalten der Zieltypen

`target.type` muss ein erkannter Zieltyp sein, und der normalisierte `target.path` muss der für diesen Typ registrierten Pfadstruktur entsprechen.

Einige Zieltypen akzeptieren für bestehende Pläne zusätzlich zu ihrem kanonischen Typnamen einen Kompatibilitätsalias als `target.type`:

| Kanonischer Typ                      | Akzeptierter Alias                             |
| ------------------------------------ | ---------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                    |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                      |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Regeln für die Pfadvalidierung

Jedes Ziel wird anhand aller folgenden Regeln validiert:

- `type` muss ein erkannter Zieltyp sein.
- `path` muss ein nicht leerer, durch Punkte getrennter Pfad sein.
- `pathSegments` kann weggelassen werden. Wenn es angegeben wird, muss es nach der Normalisierung exakt demselben Pfad wie `path` entsprechen.
- Verbotene Segmente werden abgelehnt: `__proto__`, `prototype`, `constructor`.
- Der normalisierte Pfad muss der für den Zieltyp registrierten Pfadstruktur entsprechen.
- Wenn `providerId` oder `accountId` festgelegt ist, muss der Wert mit der im Pfad codierten ID übereinstimmen.
- Ziele in `auth-profiles.json` erfordern `agentId`.
- Fügen Sie beim Erstellen einer neuen Zuordnung in `auth-profiles.json` `authProfileProvider` hinzu.

## Fehlerverhalten

Wenn die Validierung eines Ziels fehlschlägt, wird die Anwendung mit einem Fehler wie dem folgenden beendet:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Bei einem ungültigen Plan werden keine Schreibvorgänge übernommen: Zielauflösung und Pfadvalidierung erfolgen, bevor eine Datei verändert wird. Sobald ein gültiger Plan mit dem Schreiben beginnt, erstellt die Anwendung zunächst Momentaufnahmen aller betroffenen Dateien und stellt diese wieder her, wenn ein späterer Schreibvorgang im selben Durchlauf fehlschlägt. Dadurch bleiben Konfiguration, Authentifizierungsprofile und Umgebungsstatus nach einem partiellen Schreibvorgang niemals inkonsistent.

## Zustimmungsverhalten für Exec-Provider

- `--dry-run` überspringt standardmäßig die Prüfungen von Exec-SecretRefs.
- Pläne mit Exec-SecretRefs oder Exec-Providern werden im Schreibmodus abgelehnt, sofern `--allow-exec` nicht festgelegt ist.
- Übergeben Sie beim Validieren oder Anwenden von Plänen mit Exec-Inhalten sowohl beim Probelauf- als auch beim Schreibbefehl `--allow-exec`.

## Hinweise zum Laufzeit- und Prüfumfang

- Reine Referenzeinträge in `auth-profiles.json` (`keyRef`/`tokenRef`) werden bei der Auflösung von Laufzeitanmeldedaten und im Prüfumfang berücksichtigt.
- `secrets apply` schreibt unterstützte Ziele in `openclaw.json`, unterstützte Ziele in `auth-profiles.json` und führt drei optionale Bereinigungsdurchläufe aus, die jeweils standardmäßig aktiviert sind: `scrubEnv` (entfernt migrierte Klartextwerte aus `.env`), `scrubAuthProfilesForProviderTargets` (entfernt Klartext und nicht mehr verwendete Referenzreste aus `auth-profiles.json` für Provider, die gerade durch einen Plan migriert wurden) und `scrubLegacyAuthJson` (entfernt migrierte `api_key`-Einträge aus veralteten `auth.json`-Speichern). Setzen Sie im Plan einen beliebigen Wert von `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` oder `options.scrubLegacyAuthJson` auf `false`, um den jeweiligen Durchlauf zu überspringen.

## Prüfungen für den Betrieb

```bash
# Plan ohne Schreibvorgänge validieren
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Anschließend tatsächlich anwenden
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Bei Plänen mit Exec-Inhalten in beiden Modi ausdrücklich zustimmen
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Wenn die Anwendung mit einer Meldung über einen ungültigen Zielpfad fehlschlägt, erzeugen Sie den Plan mit `openclaw secrets configure` neu oder korrigieren Sie den Zielpfad entsprechend einer der oben aufgeführten unterstützten Strukturen.

## Verwandte Dokumentation

- [Verwaltung von Geheimnissen](/de/gateway/secrets)
- [CLI `secrets`](/de/cli/secrets)
- [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
