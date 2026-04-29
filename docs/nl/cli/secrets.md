---
read_when:
    - Geheime verwijzingen opnieuw oplossen tijdens runtime
    - Controleren op resten in platte tekst en onopgeloste verwijzingen
    - SecretRefs configureren en eenrichtings-scrubwijzigingen toepassen
summary: CLI-referentie voor `openclaw secrets` (reload, audit, configure, apply)
title: Geheimen
x-i18n:
    generated_at: "2026-04-29T22:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gebruik `openclaw secrets` om SecretRefs te beheren en de actieve runtime-snapshot gezond te houden.

Commandorollen:

- `reload`: Gateway-RPC (`secrets.reload`) die refs opnieuw resolved en de runtime-snapshot alleen bij volledig succes wisselt (geen configuratiewrites).
- `audit`: alleen-lezen scan van configuratie-/auth-/gegenereerde-model-stores en legacyresten op platte tekst, onopgeloste refs en prioriteitsdrift (exec-refs worden overgeslagen tenzij `--allow-exec` is ingesteld).
- `configure`: interactieve planner voor providerconfiguratie, doelmapping en preflight (TTY vereist).
- `apply`: voer een opgeslagen plan uit (`--dry-run` alleen voor validatie; dry-run slaat exec-controles standaard over, en schrijfmodus weigert plannen met exec tenzij `--allow-exec` is ingesteld), en scrub daarna gerichte plattetekstresten.

Aanbevolen operatorloop:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Als je plan `exec` SecretRefs/providers bevat, geef dan `--allow-exec` mee aan zowel dry-run- als schrijf-apply-commando's.

Opmerking over exitcodes voor CI/gates:

- `audit --check` retourneert `1` bij bevindingen.
- onopgeloste refs retourneren `2`.

Gerelateerd:

- Geheimenhandleiding: [Geheimenbeheer](/nl/gateway/secrets)
- Credential-oppervlak: [SecretRef Credential-oppervlak](/nl/reference/secretref-credential-surface)
- Beveiligingshandleiding: [Beveiliging](/nl/gateway/security)

## Runtime-snapshot herladen

Resolve geheime refs opnieuw en wissel de runtime-snapshot atomair.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Opmerkingen:

- Gebruikt de Gateway-RPC-methode `secrets.reload`.
- Als resolutie mislukt, behoudt de Gateway de laatst bekende goede snapshot en retourneert een fout (geen gedeeltelijke activatie).
- JSON-respons bevat `warningCount`.

Opties:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Scan OpenClaw-status op:

- opslag van geheimen in platte tekst
- onopgeloste refs
- prioriteitsdrift (`auth-profiles.json`-credentials die `openclaw.json`-refs overschaduwen)
- gegenereerde `agents/*/agent/models.json`-resten (provider-`apiKey`-waarden en gevoelige providerheaders)
- legacyresten (legacy-auth-storevermeldingen, OAuth-herinneringen)

Opmerking over headerresten:

- Detectie van gevoelige providerheaders is gebaseerd op naamheuristiek (veelvoorkomende auth-/credential-headernamen en fragmenten zoals `authorization`, `x-api-key`, `token`, `secret`, `password` en `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Exitgedrag:

- `--check` sluit af met een niet-nulstatus bij bevindingen.
- onopgeloste refs sluiten af met een niet-nulcode met hogere prioriteit.

Hoogtepunten van de rapportvorm:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- bevindingscodes:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interactieve helper)

Bouw provider- en SecretRef-wijzigingen interactief, voer preflight uit en pas ze optioneel toe:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flow:

- Providerconfiguratie eerst (`add/edit/remove` voor `secrets.providers`-aliassen).
- Credential-mapping daarna (selecteer velden en wijs `{source, provider, id}`-refs toe).
- Preflight en optionele apply als laatste.

Flags:

- `--providers-only`: configureer alleen `secrets.providers`, sla credential-mapping over.
- `--skip-provider-setup`: sla providerconfiguratie over en map credentials naar bestaande providers.
- `--agent <id>`: beperk doeldetectie en writes voor `auth-profiles.json` tot één agent-store.
- `--allow-exec`: sta exec-SecretRef-controles toe tijdens preflight/apply (kan providercommando's uitvoeren).

Opmerkingen:

- Vereist een interactieve TTY.
- Je kunt `--providers-only` niet combineren met `--skip-provider-setup`.
- `configure` richt zich op velden met geheimen in `openclaw.json` plus `auth-profiles.json` voor de geselecteerde agent-scope.
- `configure` ondersteunt het rechtstreeks maken van nieuwe `auth-profiles.json`-mappings in de pickerflow.
- Canoniek ondersteund oppervlak: [SecretRef Credential-oppervlak](/nl/reference/secretref-credential-surface).
- Het voert preflight-resolutie uit vóór apply.
- Als preflight/apply exec-refs bevat, houd `--allow-exec` dan ingesteld voor beide stappen.
- Gegenereerde plannen gebruiken standaard scrubopties (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` allemaal ingeschakeld).
- Het apply-pad is eenrichtingsverkeer voor gescrubde plattetekstwaarden.
- Zonder `--apply` vraagt de CLI na preflight nog steeds `Apply this plan now?`.
- Met `--apply` (en zonder `--yes`) vraagt de CLI om een extra onomkeerbare bevestiging.
- `--json` drukt het plan + preflight-rapport af, maar het commando vereist nog steeds een interactieve TTY.

Veiligheidsopmerking voor exec-provider:

- Homebrew-installaties stellen vaak gesymlinkte binaries beschikbaar onder `/opt/homebrew/bin/*`.
- Stel `allowSymlinkCommand: true` alleen in wanneer dat nodig is voor vertrouwde package-managerpaden, en combineer dit met `trustedDirs` (bijvoorbeeld `["/opt/homebrew"]`).
- Op Windows faalt OpenClaw gesloten als ACL-verificatie niet beschikbaar is voor een providerpad. Stel alleen voor vertrouwde paden `allowInsecurePath: true` in op die provider om padbeveiligingscontroles te omzeilen.

## Een opgeslagen plan toepassen

Pas een eerder gegenereerd plan toe of voer er een preflight op uit:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec-gedrag:

- `--dry-run` valideert preflight zonder bestanden te schrijven.
- exec-SecretRef-controles worden standaard overgeslagen in dry-run.
- schrijfmodus weigert plannen die exec-SecretRefs/providers bevatten tenzij `--allow-exec` is ingesteld.
- Gebruik `--allow-exec` om in beide modi expliciet te kiezen voor exec-providercontroles/-uitvoering.

Details van het plancontract (toegestane doelpaden, validatieregels en faalsemantiek):

- [Secrets Apply Plan-contract](/nl/gateway/secrets-plan-contract)

Wat `apply` kan bijwerken:

- `openclaw.json` (SecretRef-doelen + provider-upserts/-verwijderingen)
- `auth-profiles.json` (scrubbing van providerdoelen)
- legacy-`auth.json`-resten
- bekende geheime sleutels in `~/.openclaw/.env` waarvan de waarden zijn gemigreerd

## Waarom geen rollbackback-ups

`secrets apply` schrijft bewust geen rollbackback-ups die oude plattetekstwaarden bevatten.

Veiligheid komt van strikte preflight + atomair-achtige apply met best-effort herstel in het geheugen bij falen.

## Voorbeeld

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Als `audit --check` nog steeds plattetekstbevindingen rapporteert, werk dan de resterende gerapporteerde doelpaden bij en voer audit opnieuw uit.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheimenbeheer](/nl/gateway/secrets)
