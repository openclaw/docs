---
read_when:
    - Erstellen oder Überprüfen von `openclaw secrets apply`-Plänen
    - Debuggen von `Invalid plan target path`-Fehlern
    - Zieltyp und Pfadvalidierungsverhalten verstehen
summary: 'Vertrag für `secrets apply`-Pläne: Zielvalidierung, Pfadabgleich und `auth-profiles.json`-Zielumfang'
title: Vertrag für den Anwendungsplan von Geheimnissen
x-i18n:
    generated_at: "2026-06-27T17:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Diese Seite definiert den strikten Vertrag, der von `openclaw secrets apply` erzwungen wird.

Wenn ein Ziel nicht diesen Regeln entspricht, schlägt apply fehl, bevor die Konfiguration verändert wird.

## Plan-Dateiform

`openclaw secrets apply --from <plan.json>` erwartet ein `targets`-Array mit Plan-Zielen:

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

## Provider-Upserts und -Löschungen

Pläne können außerdem zwei optionale Felder auf oberster Ebene enthalten, die die
`secrets.providers`-Map zusätzlich zu den Schreibvorgängen pro Ziel verändern:

- `providerUpserts` — ein Objekt, das nach Provider-Alias verschlüsselt ist. Jeder Wert ist eine
  Provider-Definition (dieselbe Form, die unter
  `secrets.providers.<alias>` in `openclaw.json` akzeptiert wird, z. B. ein `exec`- oder `file`-
  Provider).
- `providerDeletes` — ein Array von Provider-Aliassen, die entfernt werden sollen.

`providerUpserts` wird vor `targets` ausgeführt, sodass ein `target.ref.provider`
auf einen Provider-Alias verweisen kann, den derselbe Plan in
`providerUpserts` einführt. Ohne dies schlagen Pläne, die auf einen noch nicht in
`openclaw.json` konfigurierten Alias verweisen, mit `provider "<alias>" is not
configured` fehl.

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

Exec-Provider, die über `providerUpserts` eingeführt werden, unterliegen weiterhin den
Exec-Zustimmungsregeln in [Zustimmungsverhalten für Exec-Provider](#exec-provider-consent-behavior):
Pläne mit Exec-Providern erfordern im Schreibmodus `--allow-exec`.

## Unterstützter Zielbereich

Plan-Ziele werden für unterstützte Anmeldeinformationspfade akzeptiert in:

- [SecretRef-Oberfläche für Anmeldeinformationen](/de/reference/secretref-credential-surface)

## Verhalten des Zieltyps

Allgemeine Regel:

- `target.type` muss erkannt werden und der normalisierten Form von `target.path` entsprechen.

Kompatibilitäts-Aliasse bleiben für bestehende Pläne akzeptiert:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regeln zur Pfadvalidierung

Jedes Ziel wird anhand aller folgenden Regeln validiert:

- `type` muss ein erkannter Zieltyp sein.
- `path` muss ein nicht leerer Punktpfad sein.
- `pathSegments` kann weggelassen werden. Wenn es angegeben wird, muss es exakt auf denselben Pfad wie `path` normalisieren.
- Verbotene Segmente werden abgelehnt: `__proto__`, `prototype`, `constructor`.
- Der normalisierte Pfad muss der registrierten Pfadform für den Zieltyp entsprechen.
- Wenn `providerId` oder `accountId` gesetzt ist, muss es mit der im Pfad kodierten ID übereinstimmen.
- `auth-profiles.json`-Ziele erfordern `agentId`.
- Beim Erstellen einer neuen `auth-profiles.json`-Zuordnung muss `authProfileProvider` enthalten sein.

## Fehlerverhalten

Wenn die Validierung eines Ziels fehlschlägt, beendet apply mit einem Fehler wie:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Für einen ungültigen Plan werden keine Schreibvorgänge übernommen.

## Zustimmungsverhalten für Exec-Provider

- `--dry-run` überspringt Exec-SecretRef-Prüfungen standardmäßig.
- Pläne mit Exec-SecretRefs/Providern werden im Schreibmodus abgelehnt, sofern `--allow-exec` nicht gesetzt ist.
- Beim Validieren/Anwenden von Plänen mit Exec-Inhalten übergeben Sie `--allow-exec` sowohl in Dry-Run- als auch in Schreibbefehlen.

## Hinweise zu Laufzeit- und Audit-Umfang

- Nur-Ref-Einträge in `auth-profiles.json` (`keyRef`/`tokenRef`) sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.
- `secrets apply` schreibt unterstützte `openclaw.json`-Ziele, unterstützte `auth-profiles.json`-Ziele und optionale Bereinigungsziele.

## Operator-Prüfungen

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Wenn apply mit einer Meldung zu einem ungültigen Zielpfad fehlschlägt, generieren Sie den Plan mit `openclaw secrets configure` neu oder korrigieren Sie den Zielpfad auf eine oben unterstützte Form.

## Verwandte Dokumentation

- [Secrets-Verwaltung](/de/gateway/secrets)
- [CLI `secrets`](/de/cli/secrets)
- [SecretRef-Oberfläche für Anmeldeinformationen](/de/reference/secretref-credential-surface)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
